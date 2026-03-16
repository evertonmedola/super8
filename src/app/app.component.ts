import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SetupComponent } from './features/setup/setup.component';
import { MatchesComponent } from './features/matches/matches.component';
import { StandingsComponent } from './features/standings/standings.component';
import { FinalComponent } from './features/final/final.component';
import { TournamentStore } from './core/services/tournament.store';
import { AuthService } from './core/services/auth.service';

type Page = 'setup' | 'matches' | 'standings' | 'final';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule, SetupComponent, MatchesComponent, StandingsComponent, FinalComponent],
  templateUrl: './app.component.html',
})
export class AppComponent {
  readonly page = signal<Page>('setup');
  readonly menuOpen = signal(false);
  readonly loginModal = signal(false);

  loginPassword = '';
  loginError = signal<string | null>(null);

  readonly nav: { id: Page; label: string }[] = [
    { id: 'setup', label: 'Jogadores' },
    { id: 'matches', label: 'Jogos' },
    { id: 'standings', label: 'Classificação' },
    { id: 'final', label: 'Final' },
  ];

  constructor(public store: TournamentStore, public auth: AuthService) { }

  goTo(p: Page) { this.page.set(p); this.menuOpen.set(false); }

  openLogin() { this.loginModal.set(true); this.loginError.set(null); this.loginPassword = ''; }
  closeLogin() { this.loginModal.set(false); }

  async submitLogin() {
    const ok = await this.auth.login(this.loginPassword);
    if (ok) {
      this.loginModal.set(false);
      this.loginPassword = '';
    } else {
      this.loginError.set('Senha incorreta.');
    }
  }

  logout() { this.auth.logout(); }

  get tournamentName() { return this.store.tournament()?.name ?? 'Super 8 Beach Tennis'; }
}
