'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { get, getErrorMessage } from '@/lib/api';
import { getUser, isAdmin } from '@/lib/auth';
import { useTheme } from '@/hooks/useTheme';

interface DashboardSummary {
  total_recruitments: number;
  active_recruitments: number;
  total_applications: number;
  submitted: number;
  accepted: number;
  rejected: number;
}

interface ActiveRecruitment {
  id: number; code: string; title: string;
  positions: { id: number; title: string; quota: number; applicant_count: number; ranked: boolean }[];
}

export default function DashboardPage() {
  const { isDark } = useTheme();
  const user = getUser();
  const admin = isAdmin();

  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [activeRecs, setActiveRecs] = useState<ActiveRecruitment[]>([]);
  const [loading, setLoading] = useState(true);

  const surface = isDark ? '#1A2332' : '#ffffff';
  const border  = isDark ? '#2A3A4A' : '#E2E8F0';
  const textMain= isDark ? '#E2EAF0' : '#25343F';
  const textMut = isDark ? '#8BA3B5' : '#64748B';
  const bg      = isDark ? '#0F1419' : '#F5F7FA';

  useEffect(() => {
    if (!admin) { setLoading(false); return; }
    (async () => {
      try {
        const res = await get<{ summary: DashboardSummary; active_recruitments: ActiveRecruitment[] }>('/report/dashboard');
        if (res.success && res.data) {
          setSummary(res.data.summary);
          setActiveRecs(res.data.active_recruitments);
        }
      } catch (e) {
        console.error(getErrorMessage(e));
      } finally {
        setLoading(false);
      }
    })();
  }, [admin]);

  const statCards = summary ? [
    { label: 'Total Rekrutmen', value: summary.total_recruitments, icon: 'lni-briefcase-1', color: '#25343F' },
    { label: 'Rekrutmen Aktif', value: summary.active_recruitments, icon: 'lni-play', color: '#10b981' },
    { label: 'Total Pelamar', value: summary.total_applications, icon: 'lni-user-multiple-4', color: '#3b82f6' },
    { label: 'Menunggu Review', value: summary.submitted, icon: 'lni-hourglass', color: '#FF9B51' },
    { label: 'Diterima', value: summary.accepted, icon: 'lni-check-circle-1', color: '#10b981' },
    { label: 'Ditolak', value: summary.rejected, icon: 'lni-xmark-circle', color: '#ef4444' },
  ] : [];

  return (
    <DashboardLayout>
      {/* Greeting */}
      <div style={{ marginBottom: '1.75rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: textMain, marginBottom: '0.25rem' }}>
          Selamat datang, <span style={{ color: '#FF9B51' }}>{user?.name?.split(' ')[0]}</span> 👋
        </h1>
        <p style={{ color: textMut, fontSize: '0.875rem' }}>
          {admin ? 'Kelola rekrutmen dan pantau seleksi kandidat dari sini.' : 'Lihat rekrutmen aktif dan status lamaranmu.'}
        </p>
      </div>

      {/* Admin Stats */}
      {admin && (
        <>
          {loading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
              {[...Array(6)].map((_, i) => (
                <div key={i} style={{ height: '96px', borderRadius: '12px', background: isDark ? '#1E2D3D' : '#E2E8F0', animation: 'pulse 1.5s ease-in-out infinite' }} />
              ))}
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
              {statCards.map((s, i) => (
                <div key={i} style={{
                  background: surface, border: `1px solid ${border}`,
                  borderRadius: '14px', padding: '1.25rem',
                  display: 'flex', flexDirection: 'column', gap: '0.5rem',
                  position: 'relative', overflow: 'hidden',
                  animation: `fadeInUp 0.4s ease both`,
                  animationDelay: `${i * 0.06}s`,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ fontSize: '1.75rem', fontWeight: 900, color: textMain }}>{s.value}</div>
                    <div style={{
                      width: '36px', height: '36px', borderRadius: '10px',
                      background: `${s.color}18`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <i className={`lni ${s.icon}`} style={{ color: s.color, fontSize: '1rem' }} />
                    </div>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: textMut, fontWeight: 500 }}>{s.label}</div>
                  <div style={{ position: 'absolute', bottom: '-10px', right: '-10px', width: '60px', height: '60px', borderRadius: '50%', background: `${s.color}08`, pointerEvents: 'none' }} />
                </div>
              ))}
            </div>
          )}

          {/* Active Recruitments Table */}
          <div style={{ background: surface, border: `1px solid ${border}`, borderRadius: '16px', overflow: 'hidden' }}>
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: `1px solid ${border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontWeight: 700, fontSize: '1rem', color: textMain }}>
                <i className="lni lni-briefcase-1" style={{ color: '#FF9B51', marginRight: '0.5rem' }} />
                Rekrutmen Aktif
              </h2>
              <a href="/dashboard/recruitment" style={{ color: '#FF9B51', fontSize: '0.8rem', fontWeight: 600, textDecoration: 'none' }}>Lihat Semua →</a>
            </div>
            {activeRecs.length === 0 ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: textMut }}>
                <i className="lni lni-briefcase-1" style={{ fontSize: '2rem', marginBottom: '0.75rem', display: 'block' }} />
                Belum ada rekrutmen aktif.
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      {['Kode', 'Judul', 'Posisi', 'Pelamar', 'Status Ranking'].map(h => (
                        <th key={h} style={{ padding: '0.75rem 1rem', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: textMut, background: isDark ? '#0F1419' : '#F8FAFC', textAlign: 'left', whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {activeRecs.flatMap(rec =>
                      rec.positions.map((pos, j) => (
                        <tr key={`${rec.id}-${j}`} style={{ borderTop: `1px solid ${border}` }}>
                          {j === 0 && <td rowSpan={rec.positions.length} style={{ padding: '0.875rem 1rem', fontSize: '0.8rem', fontWeight: 700, color: '#FF9B51', verticalAlign: 'top' }}>{rec.code}</td>}
                          {j === 0 && <td rowSpan={rec.positions.length} style={{ padding: '0.875rem 1rem', fontSize: '0.875rem', color: textMain, fontWeight: 600, verticalAlign: 'top' }}>{rec.title}</td>}
                          <td style={{ padding: '0.875rem 1rem', fontSize: '0.875rem', color: textMain }}>{pos.title}</td>
                          <td style={{ padding: '0.875rem 1rem', fontSize: '0.875rem', color: textMain, textAlign: 'center' }}>
                            <span style={{ fontWeight: 700, color: '#FF9B51' }}>{pos.applicant_count}</span>
                            <span style={{ color: textMut }}>/{pos.quota}</span>
                          </td>
                          <td style={{ padding: '0.875rem 1rem' }}>
                            <span style={{
                              display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
                              padding: '0.2rem 0.625rem', borderRadius: '999px', fontSize: '0.7rem', fontWeight: 700,
                              background: pos.ranked ? 'rgba(16,185,129,0.12)' : 'rgba(100,116,139,0.1)',
                              color: pos.ranked ? '#10b981' : textMut,
                            }}>
                              <i className={pos.ranked ? 'lni lni-check' : 'lni lni-hourglass'} />
                              {pos.ranked ? 'Sudah Di-generate' : 'Belum Di-generate'}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* Candidate Dashboard */}
      {!admin && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
          {[
            { href: '/dashboard/recruitments', icon: 'lni-briefcase-1', title: 'Rekrutmen Aktif', desc: 'Lihat posisi yang tersedia dan daftar', color: '#25343F' },
            { href: '/dashboard/my-applications', icon: 'lni-file-multiple', title: 'Lamaran Saya', desc: 'Pantau status lamaran yang sudah kamu kirim', color: '#3b82f6' },
            { href: '/dashboard/profile', icon: 'lni-user-4', title: 'Profil Saya', desc: 'Lengkapi data profil dan riwayat pendidikan', color: '#FF9B51' },
          ].map((c, i) => (
            <a key={i} href={c.href} style={{
              background: surface, border: `1px solid ${border}`, borderRadius: '16px',
              padding: '1.5rem', textDecoration: 'none', display: 'block',
              transition: 'all 0.2s',
              animation: `fadeInUp 0.4s ease both`,
              animationDelay: `${i * 0.08}s`,
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.transform = 'translateY(-4px)'; (e.currentTarget as HTMLAnchorElement).style.boxShadow = isDark ? '0 12px 32px rgba(0,0,0,0.4)' : '0 12px 32px rgba(37,52,63,0.12)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.transform = ''; (e.currentTarget as HTMLAnchorElement).style.boxShadow = ''; }}
            >
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: `${c.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
                <i className={`lni ${c.icon}`} style={{ fontSize: '1.375rem', color: c.color }} />
              </div>
              <div style={{ fontWeight: 700, color: textMain, marginBottom: '0.375rem' }}>{c.title}</div>
              <div style={{ fontSize: '0.875rem', color: textMut }}>{c.desc}</div>
            </a>
          ))}
        </div>
      )}

      <style>{`
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
      `}</style>
    </DashboardLayout>
  );
}
