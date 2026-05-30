'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { get, getErrorMessage } from '@/lib/api';
import { useTheme } from '@/hooks/useTheme';

interface Application { id: number; position_title: string; candidate_name: string; status: string; submitted_at: string | null; answer_count: number; }

export default function MyApplicationsPage() {
  const { isDark } = useTheme();
  const surface = isDark ? '#1A2332' : '#ffffff';
  const border  = isDark ? '#2A3A4A' : '#E2E8F0';
  const textMain= isDark ? '#E2EAF0' : '#25343F';
  const textMut = isDark ? '#8BA3B5' : '#64748B';

  const [items, setItems] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await get<Application[]>('/content/my-applications');
        if (res.success && res.data) setItems(res.data);
      } catch (e) { console.error(getErrorMessage(e)); }
      finally { setLoading(false); }
    })();
  }, []);

  const statusMap: Record<string, { label: string; color: string; bg: string; icon: string }> = {
    registered:  { label: 'Terdaftar',        color: '#3b82f6', bg: 'rgba(59,130,246,0.12)',  icon: 'lni-user' },
    in_progress: { label: 'Mengisi Asesmen',   color: '#FF9B51', bg: 'rgba(255,155,81,0.12)', icon: 'lni-pencil' },
    submitted:   { label: 'Sudah Disubmit',    color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)', icon: 'lni-checkmark' },
    verified:    { label: 'Dokumen Diverifikasi', color: '#10b981', bg: 'rgba(16,185,129,0.12)', icon: 'lni-shield' },
    scored:      { label: 'Sudah Dinilai',     color: '#FF9B51', bg: 'rgba(255,155,81,0.12)', icon: 'lni-bar-chart' },
    accepted:    { label: 'Diterima ✓',        color: '#10b981', bg: 'rgba(16,185,129,0.12)', icon: 'lni-checkmark-circle' },
    rejected:    { label: 'Tidak Lolos',        color: '#ef4444', bg: 'rgba(239,68,68,0.12)',  icon: 'lni-close' },
  };

  return (
    <DashboardLayout>
      <div style={{ marginBottom: '1.75rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: textMain }}>Lamaran Saya</h1>
        <p style={{ color: textMut, fontSize: '0.875rem' }}>Pantau status semua lamaran yang sudah kamu kirim</p>
      </div>

      {loading ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: textMut }}>
          <i className="lni lni-spinner" style={{ fontSize: '2rem', animation: 'spin 1s linear infinite', display: 'block', marginBottom: '0.75rem' }} /> Memuat...
        </div>
      ) : items.length === 0 ? (
        <div style={{ background: surface, border: `1px solid ${border}`, borderRadius: '16px', padding: '3rem', textAlign: 'center', color: textMut }}>
          <i className="lni lni-files" style={{ fontSize: '3rem', display: 'block', marginBottom: '1rem' }} />
          <p style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Belum ada lamaran.</p>
          <Link href="/dashboard/recruitments" style={{ color: '#FF9B51', fontWeight: 700, textDecoration: 'none', fontSize: '0.875rem' }}>
            Lihat Rekrutmen Aktif →
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {items.map((app, i) => {
            const s = statusMap[app.status] || statusMap['registered'];
            const canFill = app.status === 'registered' || app.status === 'in_progress';
            const canSeeResult = ['scored', 'accepted', 'rejected'].includes(app.status);
            return (
              <div key={app.id} style={{ background: surface, border: `1px solid ${border}`, borderRadius: '16px', padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap', animation: `fadeInUp 0.4s ease both`, animationDelay: `${i * 0.05}s` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1, flexWrap: 'wrap' }}>
                  <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <i className={`lni ${s.icon}`} style={{ fontSize: '1.25rem', color: s.color }} />
                  </div>
                  <div>
                    <h3 style={{ fontWeight: 700, color: textMain, fontSize: '0.9375rem', marginBottom: '0.25rem' }}>{app.position_title}</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.2rem 0.625rem', borderRadius: '999px', fontSize: '0.7rem', fontWeight: 700, background: s.bg, color: s.color }}>
                        {s.label}
                      </span>
                      {app.submitted_at && (
                        <span style={{ fontSize: '0.75rem', color: textMut }}>
                          <i className="lni lni-calendar" style={{ marginRight: '0.25rem' }} />
                          {new Date(app.submitted_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}
                        </span>
                      )}
                      {app.answer_count > 0 && (
                        <span style={{ fontSize: '0.75rem', color: textMut }}>{app.answer_count} jawaban</span>
                      )}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.625rem' }}>
                  {canFill && (
                    <Link href={`/dashboard/assessment/${app.id}`} style={{ padding: '0.5rem 1rem', background: '#FF9B51', border: 'none', borderRadius: '8px', color: 'white', fontWeight: 700, fontSize: '0.8rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.375rem' }}>
                      <i className="lni lni-pencil" /> {app.status === 'registered' ? 'Isi Asesmen' : 'Lanjutkan'}
                    </Link>
                  )}
                  {canSeeResult && (
                    <Link href={`/dashboard/result/${app.id}`} style={{ padding: '0.5rem 1rem', background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(37,52,63,0.06)', border: `1px solid ${border}`, borderRadius: '8px', color: textMain, fontWeight: 600, fontSize: '0.8rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.375rem' }}>
                      <i className="lni lni-bar-chart" /> Lihat Hasil
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } } @keyframes fadeInUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }`}</style>
    </DashboardLayout>
  );
}
