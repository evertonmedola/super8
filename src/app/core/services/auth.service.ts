import { Injectable, signal } from '@angular/core';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase.config';

const AUTH_DOC = 'config';
const AUTH_FIELD = 'passwordHash';
const COLLECTION = 'app';
const SESSION_KEY = 'super8_session';
const HASH_PREFIX = 'super8_';

@Injectable({ providedIn: 'root' })
export class AuthService {

  readonly isOrganizer = signal<boolean>(this.checkSession());
  readonly hasPassword = signal<boolean>(false);
  readonly loading = signal<boolean>(true);

  constructor() {
    this.loadPasswordStatus();
  }

  // Verifica no Firestore se já existe senha cadastrada
  private async loadPasswordStatus() {
    try {
      const snap = await getDoc(doc(db, COLLECTION, AUTH_DOC));
      this.hasPassword.set(snap.exists() && !!snap.data()?.[AUTH_FIELD]);
    } catch {
      this.hasPassword.set(false);
    } finally {
      this.loading.set(false);
    }
  }

  async setPassword(password: string): Promise<void> {
    const hash = this.simpleHash(password);
    await setDoc(doc(db, COLLECTION, AUTH_DOC), { [AUTH_FIELD]: hash });
    this.hasPassword.set(true);
    this.isOrganizer.set(true);
    sessionStorage.setItem(SESSION_KEY, '1');
  }

  async login(password: string): Promise<boolean> {
    try {
      const snap = await getDoc(doc(db, COLLECTION, AUTH_DOC));
      if (!snap.exists()) return false;
      const stored = snap.data()?.[AUTH_FIELD];
      if (stored === this.simpleHash(password)) {
        sessionStorage.setItem(SESSION_KEY, '1');
        this.isOrganizer.set(true);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  async changePassword(current: string, next: string): Promise<boolean> {
    const ok = await this.login(current);
    if (!ok) return false;
    await this.setPassword(next);
    return true;
  }

  logout(): void {
    sessionStorage.removeItem(SESSION_KEY);
    this.isOrganizer.set(false);
  }

  private checkSession(): boolean {
    return sessionStorage.getItem(SESSION_KEY) === '1';
  }

  private simpleHash(str: string): string {
    let hash = 0;
    const s = HASH_PREFIX + str;
    for (let i = 0; i < s.length; i++) {
      hash = ((hash << 5) - hash) + s.charCodeAt(i);
      hash |= 0;
    }
    return hash.toString(16);
  }
}