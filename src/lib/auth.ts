/**
 * lib/auth.ts
 * Helper untuk manajemen autentikasi: login, logout, cek role, ambil user.
 */

import Cookies from 'js-cookie';
import { post } from './api';

export interface UserData {
  id: number;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  role: { id: number; code: string; name: string };
}

// ── Simpan token dan data user ke cookie ───────────────────────
export function saveSession(accessToken: string, refreshToken: string, user: UserData) {
  // Token disimpan sebagai cookie HttpOnly-like (client side, tapi cukup untuk SPA)
  Cookies.set('access_token',  accessToken,  { expires: 1 });      // 1 hari
  Cookies.set('refresh_token', refreshToken, { expires: 7 });      // 7 hari
  Cookies.set('user_data',     JSON.stringify(user), { expires: 1 });
}

// ── Ambil data user dari cookie ────────────────────────────────
export function getUser(): UserData | null {
  try {
    const raw = Cookies.get('user_data');
    if (!raw) return null;
    return JSON.parse(raw) as UserData;
  } catch {
    return null;
  }
}

// ── Ambil access token ─────────────────────────────────────────
export function getToken(): string | null {
  return Cookies.get('access_token') || null;
}

// ── Cek apakah sudah login ─────────────────────────────────────
export function isLoggedIn(): boolean {
  return !!getToken();
}

// ── Cek role ───────────────────────────────────────────────────
export function isAdmin(): boolean {
  const user = getUser();
  return user?.role?.code === 'admin';
}

export function isCandidate(): boolean {
  const user = getUser();
  return user?.role?.code === 'candidate';
}

// ── Logout: hapus semua cookie dan panggil endpoint logout ─────
export async function logout() {
  try {
    await post('/auth/logout');
  } catch {
    // Tetap lanjut logout meskipun endpoint gagal
  } finally {
    Cookies.remove('access_token');
    Cookies.remove('refresh_token');
    Cookies.remove('user_data');
    window.location.href = '/login';
  }
}

// ── Login ──────────────────────────────────────────────────────
export async function loginUser(email: string, password: string): Promise<UserData> {
  const res = await post<{
    access_token: string;
    refresh_token: string;
    user: UserData;
  }>('/auth/login', { email, password });

  if (!res.success || !res.data) {
    throw new Error(res.message || 'Login gagal.');
  }

  const { access_token, refresh_token, user } = res.data;
  saveSession(access_token, refresh_token, user);
  return user;
}
