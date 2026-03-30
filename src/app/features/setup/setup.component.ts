import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TournamentStore } from '../../core/services/tournament.store';
import { ScheduleService } from '../../core/services/schedule.service';
import { AuthService } from '../../core/services/auth.service';
import { Player, Match, GenerationMode, TournamentType } from '../../core/models/tournament.model';

@Component({
  selector: 'app-setup',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './setup.component.html',
})
export class SetupComponent implements OnInit {
  tournamentName = signal('');
  players = signal<string[]>(Array(8).fill(''));
  mode = signal<GenerationMode>('auto');
  manualMatches = signal<Match[]>([]);
  manualError = signal<string | null>(null);
  tournamentType = signal<TournamentType>('super8');

  // Password setup
  secretKey = '';
  newSecret = '';
  confirmSecret = '';
  newPassword = '';
  confirmPassword = '';
  currentPassword = '';
  nextPassword = '';
  passwordError = signal<string | null>(null);
  passwordSuccess = signal<string | null>(null);
  showPasswordForm = signal(false);
  showSecretForm = signal(false);
  showChangeForm = signal(false);

  readonly playerNumbers = computed(() =>
    Array.from({ length: this.tournamentType() === 'super12' ? 12 : 8 }, (_, i) => i + 1)
  );
  readonly canGenerate = computed(() =>
    this.tournamentName().trim().length > 0 &&
    this.players().every(p => p.trim().length > 0) &&
    this.players().length === (this.tournamentType() === 'super12' ? 12 : 8)
  );


  constructor(
    public store: TournamentStore,
    public auth: AuthService,
    private scheduleService: ScheduleService,
  ) { }

  ngOnInit() {
    const t = this.store.tournament();
    if (t) {
      this.tournamentName.set(t.name);
      this.players.set(t.players.map(p => p.name));
      this.mode.set(t.generationMode);
    }
    this.manualMatches.set(this.scheduleService.getFixedSchedule());
  }

  setMode(m: GenerationMode) { this.mode.set(m); }

  generate() {
    if (!this.canGenerate()) return;
    const playerObjs: Player[] = this.players().map((name, i) => ({ id: i + 1, name: name.trim() }));
    this.store.upsertTournament(this.tournamentName().trim(), playerObjs, this.tournamentType());

    if (this.mode() === 'manual') {
      const val = this.scheduleService.validateManualSchedule(this.manualMatches());
      if (!val.valid) { this.manualError.set(val.error ?? 'Tabela inválida'); return; }
      this.manualError.set(null);
      this.store.generateMatches('manual', this.manualMatches());
    } else {
      this.store.generateMatches('auto');
    }
  }

  updatePlayer(index: number, value: string) {
    const arr = [...this.players()];
    arr[index] = value;
    this.players.set(arr);

    if (this.tournamentName().trim()) {
      const playerObjs: Player[] = arr.map((name, i) => ({ id: i + 1, name: name.trim() }));
      this.store.upsertTournament(this.tournamentName().trim(), playerObjs, this.tournamentType());
    }
  }

  updateTournamentName(value: string) {
    this.tournamentName.set(value);
    if (value.trim() && this.players().some(p => p.trim())) {
      const playerObjs: Player[] = this.players().map((name, i) => ({ id: i + 1, name: name.trim() }));
      this.store.upsertTournament(value.trim(), playerObjs, this.tournamentType());
    }
  }

  updateManualTeam(matchIdx: number, team: 'team1' | 'team2', slot: 0 | 1, value: number) {
    const matches = this.manualMatches().map((m, i) => {
      if (i !== matchIdx) return m;
      const arr: [number, number] = [...m[team]] as [number, number];
      arr[slot] = Number(value);
      return { ...m, [team]: arr };
    });
    this.manualMatches.set(matches);
    this.manualError.set(null);
  }

  resetManual() { this.manualMatches.set(this.scheduleService.getFixedSchedule()); }

  confirmReset() {
    if (confirm('Apagar todos os dados do torneio?')) {
      this.store.reset();
      this.tournamentName.set('');
      this.players.set(Array(8).fill(''));
    }
  }

  // ── Password ──────────────────────────────────────────────────────

  async savePassword() {
    if (this.newPassword.length < 4) { this.passwordError.set('Senha deve ter pelo menos 4 caracteres.'); return; }
    if (this.newPassword !== this.confirmPassword) { this.passwordError.set('As senhas não coincidem.'); return; }
    await this.auth.setPassword(this.newPassword);
    this.passwordError.set(null);
    this.passwordSuccess.set('Senha definida com sucesso!');
    this.newPassword = ''; this.confirmPassword = '';
    setTimeout(() => { this.passwordSuccess.set(null); this.showPasswordForm.set(false); }, 2000);
  }

  async saveSecret() {
    if (this.newSecret.length < 4) { this.passwordError.set('Secret deve ter pelo menos 4 caracteres.'); return; }
    if (this.newSecret !== this.confirmSecret) { this.passwordError.set('Os secrets não coincidem.'); return; }
    await this.auth.setSecret(this.newSecret);
    this.passwordError.set(null);
    this.passwordSuccess.set('Secret definido com sucesso!');
    this.newSecret = ''; this.confirmSecret = '';
    setTimeout(() => { this.passwordSuccess.set(null); this.showSecretForm.set(false); }, 2000);
  }

  async changePassword() {
    if (this.nextPassword.length < 4) { this.passwordError.set('Nova senha deve ter pelo menos 4 caracteres.'); return; }
    const ok = await this.auth.changePassword(this.secretKey, this.nextPassword);
    if (!ok) { this.passwordError.set('Secret incorreto.'); return; }
    this.passwordError.set(null);
    this.passwordSuccess.set('Senha alterada com sucesso!');
    this.secretKey = ''; this.nextPassword = '';
    setTimeout(() => { this.passwordSuccess.set(null); this.showChangeForm.set(false); }, 2000);
  }
}
