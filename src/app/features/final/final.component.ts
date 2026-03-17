import { Component, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TournamentStore } from '../../core/services/tournament.store';
import { AuthService } from '../../core/services/auth.service';
import { StatsService, StandingsRow } from '../../core/services/stats.service';
import { ScoreSelectorComponent } from '../../shared/components/score-selector/score-selector.component';
import { MatchScore } from '../../core/models/tournament.model';

@Component({
  selector: 'app-final',
  standalone: true,
  imports: [CommonModule, ScoreSelectorComponent],
  templateUrl: './final.component.html',
})
export class FinalComponent {

  readonly classStandings = computed<StandingsRow[]>(() => {
    const t = this.store.tournament();
    if (!t) return [];
    const rows = this.stats.buildStandings(t, false).slice(0, 4);

    // Se houve tiebreaker, substitui o perdedor pelo vencedor
    if (t.tiebreaker?.winner != null) {
      const winner = t.tiebreaker.winner;
      const loser = t.tiebreaker.players.find(p => p !== winner)!;
      const hasLoser = rows.some(r => r.player.id === loser);
      const hasWinner = rows.some(r => r.player.id === winner);

      if (hasLoser && !hasWinner) {
        // Busca o row do vencedor no ranking completo
        const allRows = this.stats.buildStandings(t, false);
        const winnerRow = allRows.find(r => r.player.id === winner);
        if (winnerRow) {
          return rows.map(r => r.player.id === loser ? { ...winnerRow, rank: 4 } : r);
        }
      }
    }

    return rows;
  });
  readonly finalStandings = computed<StandingsRow[]>(() => {
    const t = this.store.tournament();
    if (!t || !t.finalMatches.length) return [];
    const finalistPlayers = t.players.filter(p => t.finalists.includes(p.id));
    return this.stats.buildStandings({ ...t, players: finalistPlayers }, true);
  });

  readonly champion = computed(() =>
    this.store.finalComplete() ? (this.finalStandings()[0] ?? null) : null
  );

  constructor(
    public store: TournamentStore,
    public auth: AuthService,
    private stats: StatsService,
  ) { }

  startFinal() { this.store.startFinal(); }
  reshuffle() { if (confirm('Re-sortear duplas? Os resultados da final serão apagados.')) this.store.reshuffleFinal(); }
  setScore(i: number, s: MatchScore) { this.store.setFinalScore(i, s); }
  clearScore(i: number) { this.store.clearFinalScore(i); }

  name(id: number) { return this.store.playerName(id); }
  saldoClass(v: number) { return v > 0 ? 'saldo-pos' : v < 0 ? 'saldo-neg' : 'saldo-zero'; }
  rankIcon(r: number) { return r === 1 ? '🥇' : r === 2 ? '🥈' : r === 3 ? '🥉' : r === 4 ? '4º' : String(r); }
  saldoFmt(v: number) { return (v > 0 ? '+' : '') + v; }

  classificationSaldo(playerId: number): string {
    const row = this.classStandings().find(r => r.player.id === playerId);
    return row ? this.saldoFmt(row.saldo) : '–';
  }

  get finalMatches() { return this.store.tournament()?.finalMatches ?? []; }
}
