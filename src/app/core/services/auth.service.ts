import { Injectable, signal } from '@angular/core';

const AUTH_KEY = 'super8_auth';
const DEFAULT_HASH_PREFIX = 'super8_';

@Injectable({ providedIn: 'root' })
export class AuthService {

  // true = organizer mode unlocked
  readonly isOrganizer = signal<boolean>(this.checkSession());

  private storedHash(): string | null {
    return localStorage.getItem(AUTH_KEY);
  }

  hasPassword(): boolean {
    return !!this.storedHash();
  }

  setPassword(password: string): void {
    const hash = this.simpleHash(password);
    localStorage.setItem(AUTH_KEY, hash);
    this.isOrganizer.set(true);
  }

  login(password: string): boolean {
    const hash = this.simpleHash(password);
    if (hash === this.storedHash()) {
      sessionStorage.setItem('super8_session', '1');
      this.isOrganizer.set(true);
      return true;
    }
    return false;
  }

  logout(): void {
    sessionStorage.removeItem('super8_session');
    this.isOrganizer.set(false);
  }

  changePassword(current: string, next: string): boolean {
    if (!this.login(current)) return false;
    this.setPassword(next);
    return true;
  }

  private checkSession(): boolean {
    return sessionStorage.getItem('super8_session') === '1';
  }

  // Simple deterministic hash — good enough for casual protection
  private simpleHash(str: string): string {
    let hash = 0;
    const s = DEFAULT_HASH_PREFIX + str;
    for (let i = 0; i < s.length; i++) {
      hash = ((hash << 5) - hash) + s.charCodeAt(i);
      hash |= 0;
    }
    return hash.toString(16);
  }
}
