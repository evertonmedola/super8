import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatchScore } from '../../../core/models/tournament.model';

export const SCORE_OPTIONS: MatchScore[] = [
  { team1: 6, team2: 0 },
  { team1: 5, team2: 1 },
  { team1: 4, team2: 2 },
  { team1: 3, team2: 3 },
  { team1: 2, team2: 4 },
  { team1: 1, team2: 5 },
  { team1: 0, team2: 6 },
];

@Component({
  selector: 'app-score-selector',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './score-selector.component.html',
})
export class ScoreSelectorComponent {
  readonly current = input<MatchScore | null>(null);
  readonly readonly = input<boolean>(false);
  readonly scoreChange = output<MatchScore>();
  readonly cleared = output<void>();

  readonly options = SCORE_OPTIONS;

  isSelected(opt: MatchScore): boolean {
    const c = this.current();
    return !!c && c.team1 === opt.team1 && c.team2 === opt.team2;
  }

  select(opt: MatchScore) {
    if (!this.readonly()) this.scoreChange.emit(opt);
  }

  clear() {
    if (!this.readonly()) this.cleared.emit();
  }
}
