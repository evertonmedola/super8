import { Injectable } from '@angular/core';
import { Match, FinalMatch } from '../models/tournament.model';

// Canonical 14-game Super 8 schedule extracted from the reference sheet.
// Every pair of players is partners exactly once across all 14 games.
// Perfect matching system using RR
const BASE_SCHEDULE: Array<{ game: number; team1: [number, number]; team2: [number, number] }> = [
  { game: 1, team1: [1, 2], team2: [3, 4] },
  { game: 2, team1: [5, 6], team2: [7, 8] },

  { game: 3, team1: [1, 3], team2: [5, 7] },
  { game: 4, team1: [2, 4], team2: [6, 8] },

  { game: 5, team1: [1, 4], team2: [6, 7] },
  { game: 6, team1: [2, 3], team2: [5, 8] },

  { game: 7, team1: [1, 5], team2: [2, 6] },
  { game: 8, team1: [3, 7], team2: [4, 8] },

  { game: 9, team1: [1, 6], team2: [3, 8] },
  { game: 10, team1: [2, 5], team2: [4, 7] },

  { game: 11, team1: [1, 7], team2: [4, 5] },
  { game: 12, team1: [2, 8], team2: [3, 6] },

  { game: 13, team1: [1, 8], team2: [2, 7] },
  { game: 14, team1: [3, 5], team2: [4, 6] },
];

const SUPER12_SCHEDULE: Array<{ game: number; team1: [number, number]; team2: [number, number] }> = [
  { game: 1, team1: [1, 2], team2: [3, 4] },
  { game: 2, team1: [5, 6], team2: [7, 8] },
  { game: 3, team1: [9, 10], team2: [11, 12] },
  { game: 4, team1: [1, 3], team2: [5, 7] },
  { game: 5, team1: [2, 4], team2: [6, 8] },
  { game: 6, team1: [9, 11], team2: [10, 12] },
  { game: 7, team1: [1, 4], team2: [9, 12] },
  { game: 8, team1: [2, 3], team2: [10, 11] },
  { game: 9, team1: [5, 8], team2: [6, 7] },
  { game: 10, team1: [1, 5], team2: [2, 6] },
  { game: 11, team1: [3, 7], team2: [4, 8] },
  { game: 12, team1: [9, 10], team2: [3, 5] },
  { game: 13, team1: [1, 6], team2: [3, 8] },
  { game: 14, team1: [2, 5], team2: [4, 7] },
  { game: 15, team1: [10, 11], team2: [1, 9] },
  { game: 16, team1: [1, 7], team2: [4, 5] },
  { game: 17, team1: [2, 8], team2: [3, 6] },
  { game: 18, team1: [11, 12], team2: [2, 9] },
  { game: 19, team1: [1, 8], team2: [2, 7] },
  { game: 20, team1: [3, 5], team2: [4, 6] },
  { game: 21, team1: [10, 12], team2: [3, 9] },
  { game: 22, team1: [6, 12], team2: [1, 10] },
  { game: 23, team1: [5, 9], team2: [4, 11] },
  { game: 24, team1: [7, 12], team2: [2, 10] },
  { game: 25, team1: [6, 9], team2: [3, 11] },
  { game: 26, team1: [8, 12], team2: [1, 11] },
  { game: 27, team1: [7, 9], team2: [4, 10] },
  { game: 28, team1: [8, 11], team2: [2, 12] },
  { game: 29, team1: [5, 10], team2: [6, 11] },
  { game: 30, team1: [7, 10], team2: [8, 9] },
  { game: 31, team1: [5, 11], team2: [6, 12] },
  { game: 32, team1: [4, 9], team2: [8, 10] },
  { game: 33, team1: [5, 12], team2: [7, 11] },
];

// 3-game final schedule template for 4 players [A,B,C,D]
const FINAL_TEMPLATE: Array<{ game: number; i: [number, number]; j: [number, number] }> = [
  { game: 1, i: [0, 1], j: [2, 3] },
  { game: 2, i: [0, 2], j: [1, 3] },
  { game: 3, i: [0, 3], j: [1, 2] },
];

@Injectable({ providedIn: 'root' })
export class ScheduleService {

  getFixedSchedule(): Match[] {
    return BASE_SCHEDULE.map(s => ({
      game: s.game,
      team1: [...s.team1] as [number, number],
      team2: [...s.team2] as [number, number],
      score: null,
    }));
  }

  getFixedScheduleSuper12(): Match[] {
    return SUPER12_SCHEDULE.map(s => ({
      game: s.game,
      team1: [...s.team1] as [number, number],
      team2: [...s.team2] as [number, number],
      score: null,
    }));
  }

  getRandomScheduleSuper12(): Match[] {
    const shuffled = this.shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
    const map = (slot: number) => shuffled[slot - 1];
    return SUPER12_SCHEDULE.map(s => ({
      game: s.game,
      team1: [map(s.team1[0]), map(s.team1[1])] as [number, number],
      team2: [map(s.team2[0]), map(s.team2[1])] as [number, number],
      score: null,
    }));
  }

  getRandomSchedule(): Match[] {
    const shuffled = this.shuffle([1, 2, 3, 4, 5, 6, 7, 8]);
    const map = (slot: number) => shuffled[slot - 1];
    return BASE_SCHEDULE.map(s => ({
      game: s.game,
      team1: [map(s.team1[0]), map(s.team1[1])] as [number, number],
      team2: [map(s.team2[0]), map(s.team2[1])] as [number, number],
      score: null,
    }));
  }

  getFinalSchedule(finalistIds: number[]): FinalMatch[] {
    const shuffled = this.shuffle([...finalistIds]);
    return FINAL_TEMPLATE.map(t => ({
      game: t.game,
      team1: [shuffled[t.i[0]], shuffled[t.i[1]]] as [number, number],
      team2: [shuffled[t.j[0]], shuffled[t.j[1]]] as [number, number],
      score: null,
    }));
  }

  validateManualSchedule(matches: Match[]): { valid: boolean; error?: string } {
    const pairs = new Set<string>();
    for (const m of matches) {
      for (const team of [m.team1, m.team2]) {
        const key = [Math.min(...team), Math.max(...team)].join('-');
        if (pairs.has(key)) return { valid: false, error: `Dupla ${team[0]}+${team[1]} aparece mais de uma vez.` };
        pairs.add(key);
      }
    }
    return { valid: true };
  }

  private shuffle<T>(arr: T[]): T[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }
}
