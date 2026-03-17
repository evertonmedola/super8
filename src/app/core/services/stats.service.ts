import { Injectable } from '@angular/core';
import { Match, FinalMatch, Player, PlayerStats, Tournament } from '../models/tournament.model';

export interface StandingsRow extends PlayerStats {
  rank: number;
  isFinalist: boolean;
}

@Injectable({ providedIn: 'root' })
export class StatsService {

  computeStats(players: Player[], matches: Array<Match | FinalMatch>): PlayerStats[] {
    const map = new Map<number, PlayerStats>();
    players.forEach(p => map.set(p.id, { player: p, played: 0, wins: 0, draws: 0, losses: 0, saldo: 0 }));

    for (const m of matches) {
      if (!m.score) continue;
      const { team1: s1, team2: s2 } = m.score;

      const apply = (ids: [number, number], own: number, opp: number) => {
        const diff = own - opp;
        ids.forEach(id => {
          const s = map.get(id);
          if (!s) return;
          s.played++;
          s.saldo += diff;
          if (diff > 0) s.wins++;
          else if (diff === 0) s.draws++;
          else s.losses++;
        });
      };

      apply(m.team1, s1, s2);
      apply(m.team2, s2, s1);
    }

    return Array.from(map.values());
  }

  sortStats(stats: PlayerStats[], matches: Array<Match | FinalMatch>): PlayerStats[] {
    return [...stats].sort((a, b) => {
      if (b.saldo !== a.saldo) return b.saldo - a.saldo;
      return this.headToHead(a.player.id, b.player.id, matches);
    });
  }

  buildStandings(tournament: Tournament, useFinal = false): StandingsRow[] {
    const matches = useFinal ? tournament.finalMatches : tournament.matches;
    const players = useFinal
      ? tournament.players.filter(p => tournament.finalists.includes(p.id))
      : tournament.players;

    const stats = this.computeStats(players, matches);
    const sorted = this.sortStats(stats, matches);

    return sorted.map((s, i) => ({
      ...s,
      rank: i + 1,
      isFinalist: !useFinal && tournament.finalists.includes(s.player.id),
    }));
  }

  hasTiebreakerNeeded(tournament: Tournament | null): boolean {
    if (!tournament || !tournament.matches.every(m => m.score !== null)) return false;
    const stats = this.computeStats(tournament.players, tournament.matches);
    const sorted = [...stats].sort((a, b) => b.saldo - a.saldo);
    return sorted[3]?.saldo === sorted[4]?.saldo;
  }

  getTiebreakerPlayers(tournament: Tournament | null): [number, number] | null {
    if (!tournament) return null;
    const stats = this.computeStats(tournament.players, tournament.matches);
    const sorted = [...stats].sort((a, b) => b.saldo - a.saldo);
    if (sorted[3]?.saldo !== sorted[4]?.saldo) return null;
    return [sorted[3].player.id, sorted[4].player.id];
  }

  getFinalistIds(tournament: Tournament): number[] {
    const stats = this.computeStats(tournament.players, tournament.matches);
    const sorted = this.sortStats(stats, tournament.matches);
    return sorted.slice(0, 4).map(s => s.player.id);
  }

  // Returns positive if B ranks higher (for sort comparator)
  private headToHead(idA: number, idB: number, matches: Array<Match | FinalMatch>): number {
    let sA = 0, sB = 0;
    for (const m of matches) {
      if (!m.score) continue;
      const aT1 = (m.team1 as number[]).includes(idA);
      const bT1 = (m.team1 as number[]).includes(idB);
      const aT2 = (m.team2 as number[]).includes(idA);
      const bT2 = (m.team2 as number[]).includes(idB);
      if ((aT1 && bT2) || (aT2 && bT1)) {
        const { team1, team2 } = m.score;
        if (aT1) { sA += team1 - team2; sB += team2 - team1; }
        else { sA += team2 - team1; sB += team1 - team2; }
      }
    }
    return sB - sA;
  }
}
