'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useTheme } from '@/hooks/useTheme';
import { getUser, logout, isAdmin } from '@/lib/auth';
import type { UserData } from '@/lib/auth';

// ── Navigasi berdasarkan role ───────────────────────────────────
const adminNav = [
  { label: 'Dashboard',       href: '/dashboard',             icon: 'lni-dashboard' },
  { label: 'Pengguna',        href: '/dashboard/users',       icon: 'lni-users' },
  { label: 'Kriteria',        href: '/dashboard/criteria',    icon: 'lni-tag' },
  { label: 'Jenis Syarat',    href: '/dashboard/req-types',   icon: 'lni-files',  },
  { label: 'Rekrutmen',       href: '/dashboard/recruitment', icon: 'lni-briefcase' },
  { label: 'Laporan',         href: '/dashboard/report',      icon: 'lni-bar-chart' },
];

const candidateNav = [
  { label: 'Dashboard',       href: '/dashboard',               icon: 'lni-dashboard' },
  { label: 'Rekrutmen Aktif', href: '/dashboard/recruitments',  icon: 'lni-briefcase' },
  { label: 'Lamaran Saya',    href: '/dashboard/my-applications',icon: 'lni-files' },
];

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname  = usePathname();
  const router    = useRouter();
  const { isDark, toggleTheme } = useTheme();
  const [user, setUser]               = useState<UserData | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [avatarOpen, setAvatarOpen]   = useState(false);
  const avatarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const u = getUser();
    if (!u) { router.push('/login'); return; }
    setUser(u);
  }, [router]);

  // Tutup dropdown avatar jika klik di luar
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (avatarRef.current && !avatarRef.current.contains(e.target as Node)) {
        setAvatarOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const navItems = user?.role?.code === 'admin' ? adminNav : candidateNav;

  const surface = isDark ? '#1A2332' : '#ffffff';
  const border  = isDark ? '#2A3A4A' : '#E2E8F0';
  const textMain= isDark ? '#E2EAF0' : '#25343F';
  const textMut = isDark ? '#8BA3B5' : '#64748B';
  const bg      = isDark ? '#0F1419' : '#F5F7FA';

  if (!user) return null;

  const Sidebar = () => (
    <aside style={{
      width: '260px', background: surface,
      borderRight: `1px solid ${border}`,
      display: 'flex', flexDirection: 'column',
      padding: '1.25rem 0.875rem',
      height: '100%', overflowY: 'auto',
    }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '2rem', paddingLeft: '0.25rem' }}>
        <div style={{
          width: '36px', height: '36px', borderRadius: '10px', flexShrink: 0,
          background: 'linear-gradient(135deg, #25343F 0%, #FF9B51 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 800, color: 'white', fontSize: '0.8rem',
        }}>PsP</div>
        <div>
          <div style={{ fontWeight: 800, fontSize: '0.95rem', color: textMain, lineHeight: 1.2 }}>Psychoposition</div>
          <div style={{ fontSize: '0.65rem', color: '#FF9B51', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            {user.role.code === 'admin' ? 'Admin Panel' : 'Kandidat'}
          </div>
        </div>
      </div>

      {/* Nav items */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', flex: 1 }}>
        <div style={{ fontSize: '0.65rem', fontWeight: 700, color: textMut, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '0 0.625rem', marginBottom: '0.375rem' }}>
          Menu
        </div>
        {navItems.map(item => {
          const active = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link key={item.href} href={item.href} onClick={() => setSidebarOpen(false)} style={{
              display: 'flex', alignItems: 'center', gap: '0.75rem',
              padding: '0.625rem 0.875rem', borderRadius: '10px',
              color: active ? '#FF9B51' : textMut,
              background: active ? (isDark ? 'rgba(255,155,81,0.12)' : 'rgba(255,155,81,0.08)') : 'transparent',
              fontWeight: active ? 700 : 500, fontSize: '0.875rem',
              textDecoration: 'none', transition: 'all 0.2s',
            }}>
              <i className={`lni ${item.icon}`} style={{ fontSize: '1.1rem', width: '20px' }} />
              {item.label}
              {active && <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#FF9B51', marginLeft: 'auto' }} />}
            </Link>
          );
        })}

        <div style={{ borderTop: `1px solid ${border}`, margin: '0.75rem 0', paddingTop: '0.75rem' }}>
          <div style={{ fontSize: '0.65rem', fontWeight: 700, color: textMut, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '0 0.625rem', marginBottom: '0.375rem' }}>
            Akun
          </div>
          <Link href="/dashboard/profile" onClick={() => setSidebarOpen(false)} style={{
            display: 'flex', alignItems: 'center', gap: '0.75rem',
            padding: '0.625rem 0.875rem', borderRadius: '10px',
            color: pathname === '/dashboard/profile' ? '#FF9B51' : textMut,
            background: pathname === '/dashboard/profile' ? (isDark ? 'rgba(255,155,81,0.12)' : 'rgba(255,155,81,0.08)') : 'transparent',
            fontWeight: pathname === '/dashboard/profile' ? 700 : 500, fontSize: '0.875rem',
            textDecoration: 'none', transition: 'all 0.2s',
          }}>
            <i className="lni lni-user" style={{ fontSize: '1.1rem', width: '20px' }} />
            Profil
          </Link>
        </div>
      </nav>

      {/* User card di bawah sidebar */}
      <div style={{
        marginTop: 'auto', padding: '0.875rem', borderRadius: '12px',
        background: isDark ? 'rgba(255,155,81,0.05)' : 'rgba(37,52,63,0.04)',
        border: `1px solid ${border}`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
          <div style={{
            width: '36px', height: '36px', borderRadius: '50%', flexShrink: 0,
            background: 'linear-gradient(135deg, #FF9B51, #25343F)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', fontWeight: 700, fontSize: '0.875rem',
          }}>
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div style={{ overflow: 'hidden', flex: 1 }}>
            <div style={{ fontWeight: 600, fontSize: '0.8rem', color: textMain, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user.name}
            </div>
            <div style={{ fontSize: '0.7rem', color: textMut, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user.email}
            </div>
          </div>
        </div>
      </div>
    </aside>
  );

  return (
    <div style={{ minHeight: '100vh', background: bg, fontFamily: "'Montserrat', sans-serif" }}>

      {/* ── HEADER ─────────────────────────────────────────────── */}
      <header style={{
        position: 'fixed', top: 0, left: 0, right: 0, height: '64px',
        background: surface, borderBottom: `1px solid ${border}`,
        display: 'flex', alignItems: 'center',
        padding: '0 1.25rem', zIndex: 50,
        gap: '1rem',
      }}>
        {/* Mobile hamburger */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: textMain, fontSize: '1.25rem', padding: '0.25rem', display: 'flex', alignItems: 'center' }}
          className="mobile-menu-btn"
        >
          <i className="lni lni-menu" />
        </button>

        {/* Logo (mobile) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{
            width: '32px', height: '32px', borderRadius: '8px',
            background: 'linear-gradient(135deg, #25343F 0%, #FF9B51 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 800, color: 'white', fontSize: '0.7rem', flexShrink: 0,
          }}>PsP</div>
          <span style={{ fontWeight: 700, fontSize: '1rem', color: textMain }}>Psychoposition</span>
        </div>

        <div style={{ flex: 1 }} />

        {/* Dark mode toggle */}
        <button
          onClick={toggleTheme}
          style={{
            width: '40px', height: '40px', borderRadius: '10px',
            background: isDark ? 'rgba(255,155,81,0.1)' : 'rgba(37,52,63,0.06)',
            border: `1px solid ${border}`,
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: isDark ? '#FF9B51' : '#25343F', fontSize: '1rem', transition: 'all 0.2s',
          }}
          title={isDark ? 'Mode Terang' : 'Mode Gelap'}
        >
          <i className={isDark ? 'lni lni-sun' : 'lni lni-night'} />
        </button>

        {/* Avatar dropdown */}
        <div ref={avatarRef} style={{ position: 'relative' }}>
          <button
            onClick={() => setAvatarOpen(!avatarOpen)}
            style={{
              width: '40px', height: '40px', borderRadius: '50%',
              background: 'linear-gradient(135deg, #FF9B51, #25343F)',
              border: `2px solid ${avatarOpen ? '#FF9B51' : border}`,
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'white', fontWeight: 700, fontSize: '0.9rem', transition: 'border-color 0.2s',
            }}
          >
            {user.name.charAt(0).toUpperCase()}
          </button>

          {/* Dropdown */}
          {avatarOpen && (
            <div style={{
              position: 'absolute', top: 'calc(100% + 8px)', right: 0,
              width: '240px', background: surface,
              border: `1px solid ${border}`, borderRadius: '14px',
              boxShadow: isDark ? '0 8px 32px rgba(0,0,0,0.5)' : '0 8px 32px rgba(37,52,63,0.15)',
              overflow: 'hidden', animation: 'fadeInUp 0.2s ease',
            }}>
              {/* User info */}
              <div style={{ padding: '1rem', borderBottom: `1px solid ${border}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{
                    width: '42px', height: '42px', borderRadius: '50%', flexShrink: 0,
                    background: 'linear-gradient(135deg, #FF9B51, #25343F)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'white', fontWeight: 700, fontSize: '1rem',
                  }}>
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.875rem', color: textMain }}>{user.name}</div>
                    <div style={{ fontSize: '0.75rem', color: textMut }}>{user.email}</div>
                    <div style={{
                      display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
                      marginTop: '0.25rem', padding: '0.1rem 0.5rem', borderRadius: '999px',
                      background: user.role.code === 'admin' ? 'rgba(255,155,81,0.15)' : 'rgba(59,130,246,0.12)',
                      fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase' as const,
                      color: user.role.code === 'admin' ? '#FF7A1F' : '#2563eb',
                    }}>
                      <i className={user.role.code === 'admin' ? 'lni lni-shield' : 'lni lni-user'} />
                      {user.role.name}
                    </div>
                  </div>
                </div>
              </div>
              {/* Menu items */}
              <div style={{ padding: '0.5rem' }}>
                <Link href="/dashboard/profile" onClick={() => setAvatarOpen(false)} style={{
                  display: 'flex', alignItems: 'center', gap: '0.625rem',
                  padding: '0.625rem 0.75rem', borderRadius: '8px',
                  color: textMain, fontSize: '0.875rem', textDecoration: 'none',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={e => (e.currentTarget as HTMLAnchorElement).style.background = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(37,52,63,0.04)'}
                onMouseLeave={e => (e.currentTarget as HTMLAnchorElement).style.background = 'transparent'}
                >
                  <i className="lni lni-user" style={{ color: '#FF9B51' }} />
                  Profil Saya
                </Link>
                <button onClick={() => { setAvatarOpen(false); logout(); }} style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: '0.625rem',
                  padding: '0.625rem 0.75rem', borderRadius: '8px',
                  color: '#ef4444', fontSize: '0.875rem', background: 'none', border: 'none',
                  cursor: 'pointer', fontFamily: "'Montserrat', sans-serif", fontWeight: 500,
                  transition: 'background 0.15s', textAlign: 'left' as const,
                }}
                onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background = 'rgba(239,68,68,0.08)'}
                onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = 'transparent'}
                >
                  <i className="lni lni-exit" />
                  Keluar
                </button>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* ── BODY ───────────────────────────────────────────────── */}
      <div style={{ display: 'flex', paddingTop: '64px', minHeight: '100vh' }}>

        {/* Mobile overlay */}
        {sidebarOpen && (
          <div
            onClick={() => setSidebarOpen(false)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 40, backdropFilter: 'blur(2px)' }}
          />
        )}

        {/* ── SIDEBAR (desktop: sticky, mobile: overlay) ── */}
        <div
          style={{
            width: '260px', flexShrink: 0,
            position: 'sticky', top: '64px', height: 'calc(100vh - 64px)',
          }}
          className="desktop-sidebar"
        >
          <Sidebar />
        </div>

        {/* ── SIDEBAR (mobile overlay) ── */}
        {sidebarOpen && (
          <div style={{
            position: 'fixed', top: '64px', left: 0, bottom: 0,
            width: '260px', zIndex: 50,
            boxShadow: '4px 0 24px rgba(0,0,0,0.3)',
            animation: 'slideIn 0.25s ease',
          }}
          className="mobile-sidebar"
          >
            <Sidebar />
          </div>
        )}

        {/* ── MAIN CONTENT ── */}
        <main style={{ flex: 1, minWidth: 0, padding: '1.75rem', paddingBottom: '3rem' }}>
          <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
            {children}
          </div>
        </main>
      </div>

      {/* ── FOOTER ─────────────────────────────────────────────── */}
      <footer style={{
        background: surface, borderTop: `1px solid ${border}`,
        textAlign: 'center', padding: '0.875rem 1.25rem',
        fontSize: '0.75rem', color: textMut,
      }}>
        © {new Date().getFullYear()} <strong style={{ color: '#FF9B51' }}>Psychoposition</strong> — Sistem Seleksi Kandidat Berbasis ML-Enhanced Fuzzy-ELECTRE
      </footer>

      <style>{`
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideIn  { from { opacity: 0; transform: translateX(-260px); } to { opacity: 1; transform: translateX(0); } }
        @media (min-width: 769px) {
          .mobile-menu-btn  { display: none !important; }
          .mobile-sidebar   { display: none !important; }
        }
        @media (max-width: 768px) {
          .desktop-sidebar  { display: none !important; }
        }
      `}</style>
    </div>
  );
}
