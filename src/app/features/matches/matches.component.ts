import { Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TournamentStore } from '../../core/services/tournament.store';
import { AuthService } from '../../core/services/auth.service';
import { ScoreSelectorComponent } from '../../shared/components/score-selector/score-selector.component';
import { MatchScore } from '../../core/models/tournament.model';

type Filter = 'all' | 'pending' | 'done';

@Component({
  selector: 'app-matches',
  standalone: true,
  imports: [CommonModule, ScoreSelectorComponent],
  templateUrl: './matches.component.html',
})
export class MatchesComponent {
  readonly filter = signal<Filter>('all');

  readonly visibleMatches = computed(() => {
    const t = this.store.tournament();
    if (!t) return [];
    const f = this.filter();
    return t.matches
      .map((m, index) => ({ ...m, index }))
      .filter(m => {
        if (f === 'pending') return m.score === null;
        if (f === 'done') return m.score !== null;
        return true;
      });
  });

  constructor(
    public store: TournamentStore,
    public auth: AuthService,
  ) { }

  setFilter(f: Filter) { this.filter.set(f); }

  name(id: number) { return this.store.playerName(id); }

  setScore(index: number, score: MatchScore) { this.store.setMatchScore(index, score); }
  clearScore(index: number) { this.store.clearMatchScore(index); }
}
