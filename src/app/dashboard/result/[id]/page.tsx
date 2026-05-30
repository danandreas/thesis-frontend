'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { get, getErrorMessage } from '@/lib/api';
import { useTheme } from '@/hooks/useTheme';

interface ResultData { application_id: number; position: string; status: string; final_rank: number | null; final_status: string; is_recommended: boolean; }

export default function ResultPage() {
  const params = useParams();
  const { isDark } = useTheme();
  const appId = Number(params.id);

  const surface = isDark ? '#1A2332' : '#ffffff';
  const border  = isDark ? '#2A3A4A' : '#E2E8F0';
  const textMain= isDark ? '#E2EAF0' : '#25343F';
  const textMut = isDark ? '#8BA3B5' : '#64748B';

  const [result, setResult] = useState<ResultData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await get<ResultData>(`/content/applications/${appId}/result`);
        if (res.success && res.data) setResult(res.data);
        else setError(res.message || 'Hasil belum tersedia.');
      } catch (e) { setError(getErrorMessage(e)); }
      finally { setLoading(false); }
    })();
  }, [appId]);

  const statusConfig = {
    accepted: { icon: 'lni-checkmark-circle', color: '#10b981', bg: 'rgba(16,185,129,0.1)', label: 'Selamat! Anda Diterima 🎉' },
    rejected: { icon: 'lni-close', color: '#ef4444', bg: 'rgba(239,68,68,0.1)', label: 'Mohon Maaf, Tidak Lolos' },
    pending:  { icon: 'lni-hourglass', color: '#FF9B51', bg: 'rgba(255,155,81,0.1)', label: 'Menunggu Keputusan Final' },
  };

  return (
    <DashboardLayout>
      <div style={{ marginBottom: '1.75rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: textMain }}>Hasil Seleksi</h1>
        <p style={{ color: textMut, fontSize: '0.875rem' }}>Hasil asesmen dan ranking Anda</p>
      </div>

      {loading ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: textMut }}>
          <i className="lni lni-spinner" style={{ fontSize: '2rem', animation: 'spin 1s linear infinite', display: 'block', marginBottom: '0.75rem' }} /> Memuat hasil...
        </div>
      ) : error ? (
        <div style={{ background: surface, border: `1px solid ${border}`, borderRadius: '16px', padding: '3rem', textAlign: 'center' }}>
          <i className="lni lni-hourglass" style={{ fontSize: '3rem', color: '#FF9B51', display: 'block', marginBottom: '1rem' }} />
          <p style={{ fontWeight: 700, color: textMain, marginBottom: '0.5rem' }}>Hasil Belum Tersedia</p>
          <p style={{ color: textMut, fontSize: '0.875rem', marginBottom: '1.5rem' }}>Proses seleksi masih berlangsung. Pantau terus status lamaran Anda.</p>
          <Link href="/dashboard/my-applications" style={{ color: '#FF9B51', fontWeight: 700, textDecoration: 'none' }}>← Kembali ke Lamaran Saya</Link>
        </div>
      ) : result ? (
        <div style={{ maxWidth: '560px', margin: '0 auto' }}>
          {(() => {
            const cfg = statusConfig[result.final_status as keyof typeof statusConfig] || statusConfig.pending;
            return (
              <div style={{ background: surface, border: `2px solid ${result.final_status === 'accepted' ? '#10b981' : result.final_status === 'rejected' ? '#ef4444' : border}`, borderRadius: '20px', padding: '2.5rem', textAlign: 'center' }}>
                <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: cfg.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem' }}>
                  <i className={`lni ${cfg.icon}`} style={{ fontSize: '2.25rem', color: cfg.color }} />
                </div>
                <h2 style={{ fontSize: '1.375rem', fontWeight: 900, color: textMain, marginBottom: '0.5rem' }}>{cfg.label}</h2>
                <p style={{ color: textMut, marginBottom: '1.75rem', fontSize: '0.9rem' }}>Posisi: <strong style={{ color: textMain }}>{result.position}</strong></p>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                  <div style={{ background: isDark ? 'rgba(255,255,255,0.04)' : '#F8FAFC', borderRadius: '12px', padding: '1rem' }}>
                    <div style={{ fontSize: '2rem', fontWeight: 900, color: '#FF9B51' }}>{result.final_rank ?? '—'}</div>
                    <div style={{ fontSize: '0.75rem', color: textMut, fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '0.05em' }}>Peringkat Anda</div>
                  </div>
                  <div style={{ background: isDark ? 'rgba(255,255,255,0.04)' : '#F8FAFC', borderRadius: '12px', padding: '1rem' }}>
                    <div style={{ fontSize: '2rem', fontWeight: 900, color: result.is_recommended ? '#10b981' : '#ef4444' }}>
                      <i className={`lni ${result.is_recommended ? 'lni-checkmark-circle' : 'lni-close'}`} />
                    </div>
                    <div style={{ fontSize: '0.75rem', color: textMut, fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '0.05em' }}>Rekomendasi</div>
                  </div>
                </div>

                {result.final_status === 'pending' && (
                  <div style={{ background: 'rgba(255,155,81,0.08)', border: '1px solid rgba(255,155,81,0.2)', borderRadius: '10px', padding: '0.875rem', fontSize: '0.8rem', color: textMut, marginBottom: '1.5rem' }}>
                    <i className="lni lni-information" style={{ color: '#FF9B51', marginRight: '0.375rem' }} />
                    Admin sedang meninjau hasil dan akan segera menetapkan keputusan final.
                  </div>
                )}

                <Link href="/dashboard/my-applications" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem', background: '#FF9B51', borderRadius: '10px', color: 'white', fontWeight: 700, textDecoration: 'none', fontSize: '0.875rem' }}>
                  <i className="lni lni-arrow-left" /> Kembali ke Lamaran
                </Link>
              </div>
            );
          })()}
        </div>
      ) : null}
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </DashboardLayout>
  );
}
