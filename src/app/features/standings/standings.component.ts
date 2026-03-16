import { Component, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TournamentStore } from '../../core/services/tournament.store';
import { StatsService, StandingsRow } from '../../core/services/stats.service';

@Component({
  selector: 'app-standings',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './standings.component.html',
})
export class StandingsComponent {

  readonly rows = computed<StandingsRow[]>(() => {
    const t = this.store.tournament();
    if (!t || !t.matches.length) return [];
    return this.stats.buildStandings(t, false);
  });

  constructor(public store: TournamentStore, private stats: StatsService) {}

  saldoClass(v: number) { return v > 0 ? 'saldo-pos' : v < 0 ? 'saldo-neg' : 'saldo-zero'; }
  rankIcon(r: number)   { return r === 1 ? '🥇' : r === 2 ? '🥈' : r === 3 ? '🥉' : String(r); }
  saldoFmt(v: number)   { return (v > 0 ? '+' : '') + v; }
}
