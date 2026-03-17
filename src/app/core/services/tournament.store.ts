import { Injectable, signal, computed, OnDestroy } from '@angular/core';
import {
  doc, setDoc, deleteDoc, onSnapshot,
  Unsubscribe, DocumentSnapshot
} from 'firebase/firestore';
import { db } from '../firebase.config';
import { Tournament, Player, Match, FinalMatch, GenerationMode, MatchScore } from '../models/tournament.model';
import { ScheduleService } from './schedule.service';
import { StatsService } from './stats.service';

const DOC_ID = 'active';
const COLLECTION = 'tournaments';
const LOCAL_KEY = 'super8_tournament';

@Injectable({ providedIn: 'root' })
export class TournamentStore implements OnDestroy {

  // ── Signals ──────────────────────────────────────────────────────
  readonly tournament = signal<Tournament | null>(this.loadLocal());
  readonly syncing = signal<boolean>(false);
  readonly online = signal<boolean>(true);

  readonly isGenerated = computed(() => (this.tournament()?.matches.length ?? 0) > 0);

  readonly completedMatches = computed(() =>
    this.tournament()?.matches.filter(m => m.score !== null).length ?? 0
  );

  readonly totalMatches = computed(() => this.tournament()?.matches.length ?? 14);

  readonly progressPct = computed(() =>
    this.totalMatches() > 0
      ? Math.round((this.completedMatches() / this.totalMatches()) * 100)
      : 0
  );

  readonly classificationComplete = computed(() =>
    this.isGenerated() && this.completedMatches() === this.totalMatches()
  );

  readonly needsTiebreaker = computed(() => {
    const t = this.tournament();
    if (!t || !this.classificationComplete()) return false;
    // Mostra o bloco se há empate OU se já tem tiebreaker salvo sem resultado
    return !!t.tiebreaker || this.stats.hasTiebreakerNeeded(t);
  });

  readonly tiebreakerResolved = computed(() => {
    const t = this.tournament();
    return t?.tiebreaker?.winner != null;
  });

  setTiebreakerWinner(playerId: number) {
    const t = this.tournament();
    if (!t?.tiebreaker) return;
    this.commit({ ...t, tiebreaker: { ...t.tiebreaker, winner: playerId } });
  }

  clearTiebreakerWinner() {
    const t = this.tournament();
    if (!t?.tiebreaker) return;
    this.commit({ ...t, tiebreaker: { ...t.tiebreaker, winner: null } });
  }

  readonly finalStarted = computed(() => (this.tournament()?.finalMatches.length ?? 0) > 0);

  readonly finalComplete = computed(() => {
    const t = this.tournament();
    return !!t && t.finalMatches.length > 0 && t.finalMatches.every(m => m.score !== null);
  });

  private unsub: Unsubscribe | null = null;

  constructor(
    private schedule: ScheduleService,
    private stats: StatsService,
  ) {
    this.subscribeFirestore();
  }

  ngOnDestroy() { this.unsub?.(); }

  // ── Firestore real-time listener ─────────────────────────────────

  private subscribeFirestore() {
    const ref = doc(db, COLLECTION, DOC_ID);
    this.unsub = onSnapshot(
      ref,
      (snap: DocumentSnapshot) => {
        this.online.set(true);
        if (snap.exists()) {
          const remote = snap.data() as Tournament;
          this.tournament.set(remote);
          this.saveLocal(remote);
        }
      },
      () => this.online.set(false)
    );
  }

  // ── Setup ────────────────────────────────────────────────────────

  upsertTournament(name: string, players: Player[]) {
    const current = this.tournament();
    const next: Tournament = current
      ? { ...current, name, players }
      : {
        id: crypto.randomUUID(),
        name,
        createdAt: new Date().toISOString(),
        phase: 'setup',
        players,
        generationMode: 'auto',
        matches: [],
        finalMatches: [],
        finalists: [],
        tiebreaker: null,
      };
    this.commit(next);
  }

  generateMatches(mode: GenerationMode, manualMatches?: Match[]) {
    const t = this.tournament();
    if (!t) return;
    const matches = mode === 'auto'
      ? this.schedule.getRandomSchedule()
      : (manualMatches ?? this.schedule.getFixedSchedule());
    this.commit({ ...t, generationMode: mode, matches, phase: 'classification', finalMatches: [], finalists: [], tiebreaker: null });
  }

  // ── Classification ───────────────────────────────────────────────

  setMatchScore(index: number, score: MatchScore) {
    const t = this.tournament();
    if (!t) return;
    const matches = t.matches.map((m, i) => i === index ? { ...m, score } : m);

    let tiebreaker = t.tiebreaker ?? null;
    const allDone = matches.every(m => m.score !== null);
    if (allDone) {
      const pair = this.stats.getTiebreakerPlayers({ ...t, matches });
      tiebreaker = pair ? { players: pair, winner: null } : null;
    }

    this.commit({ ...t, matches, tiebreaker });
  }

  clearMatchScore(index: number) {
    const t = this.tournament();
    if (!t) return;
    const matches = t.matches.map((m, i) => i === index ? { ...m, score: null } : m);
    // Reseta o tiebreaker ao desfazer um placar
    this.commit({ ...t, matches, tiebreaker: null });
  }

  // ── Final ────────────────────────────────────────────────────────

  startFinal() {
    const t = this.tournament();
    if (!t) return;
    let finalists = this.stats.getFinalistIds(t);

    // Se houve tiebreaker, substitui o perdedor pelo vencedor
    if (t.tiebreaker?.winner != null) {
      const winner = t.tiebreaker.winner;
      // Garante que o vencedor está no top 4
      if (!finalists.includes(winner)) {
        finalists[3] = winner;
      }
    }

    const finalMatches = this.schedule.getFinalSchedule(finalists);
    this.commit({ ...t, finalists, finalMatches, phase: 'final' });

  }

  reshuffleFinal() {
    const t = this.tournament();
    if (!t || !t.finalists.length) return;
    const finalMatches = this.schedule.getFinalSchedule(t.finalists);
    this.commit({ ...t, finalMatches, phase: 'final' });
  }

  setFinalScore(index: number, score: MatchScore) {
    const t = this.tournament();
    if (!t) return;
    const finalMatches = t.finalMatches.map((m, i) => i === index ? { ...m, score } : m);
    const phase = finalMatches.every(m => m.score !== null) ? 'finished' : 'final';
    this.commit({ ...t, finalMatches, phase });
  }

  clearFinalScore(index: number) {
    const t = this.tournament();
    if (!t) return;
    const finalMatches = t.finalMatches.map((m, i) => i === index ? { ...m, score: null } : m);
    this.commit({ ...t, finalMatches, phase: 'final' });
  }

  // ── Reset ────────────────────────────────────────────────────────

  async reset() {
    try { await deleteDoc(doc(db, COLLECTION, DOC_ID)); } catch { /* offline */ }
    this.tournament.set(null);
    this.saveLocal(null);
  }

  // ── Helpers ──────────────────────────────────────────────────────

  playerName(id: number): string {
    return this.tournament()?.players.find(p => p.id === id)?.name ?? `J${id}`;
  }

  // ── Internal ─────────────────────────────────────────────────────

  private async commit(t: Tournament) {
    this.tournament.set(t);
    this.saveLocal(t);

    this.syncing.set(true);
    try {
      await setDoc(doc(db, COLLECTION, DOC_ID), JSON.parse(JSON.stringify(t)));
    } catch (err) {
      console.warn('[TournamentStore] Firestore write failed:', err);
      this.online.set(false);
    } finally {
      this.syncing.set(false);
    }
  }

  private saveLocal(t: Tournament | null) {
    try {
      if (t) localStorage.setItem(LOCAL_KEY, JSON.stringify(t));
      else localStorage.removeItem(LOCAL_KEY);
    } catch { /* quota */ }
  }

  private loadLocal(): Tournament | null {
    try {
      const raw = localStorage.getItem(LOCAL_KEY);
      return raw ? JSON.parse(raw) as Tournament : null;
    } catch { return null; }
  }
}
