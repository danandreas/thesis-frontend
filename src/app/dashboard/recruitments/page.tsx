'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { get, post, getErrorMessage } from '@/lib/api';
import { useTheme } from '@/hooks/useTheme';

interface Position { id: number; title: string; description: string; quota: number; my_application_status: string | null; my_application_id: number | null; }
interface Recruitment { id: number; code: string; title: string; description: string; assessment_weight: number; positions: Position[]; requirements: { requirement_type: { name: string }; weight: number; is_mandatory: boolean }[]; }

export default function RecruitmentsPage() {
  const { isDark } = useTheme();
  const surface = isDark ? '#1A2332' : '#ffffff';
  const border  = isDark ? '#2A3A4A' : '#E2E8F0';
  const textMain= isDark ? '#E2EAF0' : '#25343F';
  const textMut = isDark ? '#8BA3B5' : '#64748B';

  const [items, setItems] = useState<Recruitment[]>([]);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState<number | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const listRes = await get<{ id: number }[]>('/content/recruitments');
        if (listRes.success && listRes.data) {
          const details = await Promise.all(listRes.data.map(r => get<Recruitment>(`/content/recruitments/${r.id}`)));
          setItems(details.filter(r => r.success && r.data).map(r => r.data!));
        }
      } catch (e) { console.error(getErrorMessage(e)); }
      finally { setLoading(false); }
    })();
  }, []);

  const handleApply = async (positionId: number) => {
    setApplying(positionId);
    try {
      await post(`/content/apply/${positionId}`);
      // Refresh
      const listRes = await get<{ id: number }[]>('/content/recruitments');
      if (listRes.success && listRes.data) {
        const details = await Promise.all(listRes.data.map(r => get<Recruitment>(`/content/recruitments/${r.id}`)));
        setItems(details.filter(r => r.success && r.data).map(r => r.data!));
      }
    } catch (err) { alert(getErrorMessage(err)); }
    finally { setApplying(null); }
  };

  const statusMap: Record<string, { label: string; color: string; bg: string }> = {
    registered:  { label: 'Terdaftar',    color: '#3b82f6', bg: 'rgba(59,130,246,0.12)' },
    in_progress: { label: 'Mengisi Form', color: '#FF9B51', bg: 'rgba(255,155,81,0.12)' },
    submitted:   { label: 'Disubmit',     color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)' },
    verified:    { label: 'Diverifikasi', color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
    scored:      { label: 'Dinilai',      color: '#FF9B51', bg: 'rgba(255,155,81,0.12)' },
    accepted:    { label: 'Diterima ✓',   color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
    rejected:    { label: 'Ditolak',      color: '#ef4444', bg: 'rgba(239,68,68,0.12)' },
  };

  return (
    <DashboardLayout>
      <div style={{ marginBottom: '1.75rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: textMain }}>Rekrutmen Aktif</h1>
        <p style={{ color: textMut, fontSize: '0.875rem' }}>Daftar posisi yang tersedia untuk dilamar</p>
      </div>

      {loading ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: textMut }}>
          <i className="lni lni-spinner-3" style={{ fontSize: '2rem', animation: 'spin 1s linear infinite', display: 'block', marginBottom: '0.75rem' }} /> Memuat...
        </div>
      ) : items.length === 0 ? (
        <div style={{ background: surface, border: `1px solid ${border}`, borderRadius: '16px', padding: '3rem', textAlign: 'center', color: textMut }}>
          <i className="lni lni-briefcase-1" style={{ fontSize: '3rem', display: 'block', marginBottom: '1rem' }} />
          Belum ada rekrutmen aktif saat ini.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {items.map(rec => (
            <div key={rec.id} style={{ background: surface, border: `1px solid ${border}`, borderRadius: '16px', overflow: 'hidden', animation: 'fadeInUp 0.4s ease' }}>
              <div style={{ padding: '1.25rem 1.5rem', borderBottom: `1px solid ${border}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                  <span style={{ background: 'rgba(255,155,81,0.12)', color: '#FF7A1F', padding: '0.2rem 0.625rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700 }}>{rec.code}</span>
                  <span style={{ fontSize: '0.75rem', color: textMut }}>Asesmen: <strong style={{ color: '#FF9B51' }}>{rec.assessment_weight}%</strong></span>
                </div>
                <h2 style={{ fontWeight: 800, color: textMain, fontSize: '1.125rem', marginBottom: '0.375rem' }}>{rec.title}</h2>
                {rec.description && <p style={{ fontSize: '0.875rem', color: textMut, lineHeight: 1.6 }}>{rec.description}</p>}
                {rec.requirements?.filter(r => r.weight > 0).length > 0 && (
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.75rem' }}>
                    {rec.requirements.filter(r => r.weight > 0).map((r, i) => (
                      <span key={i} style={{ fontSize: '0.72rem', padding: '0.2rem 0.5rem', borderRadius: '6px', background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(37,52,63,0.06)', color: textMut, fontWeight: 600 }}>
                        {r.requirement_type.name}: {r.weight}%{r.is_mandatory ? ' *' : ''}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div style={{ padding: '1.25rem 1.5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
                {rec.positions.map(pos => {
                  const status = pos.my_application_status ? statusMap[pos.my_application_status] : null;
                  return (
                    <div key={pos.id} style={{ border: `1.5px solid ${border}`, borderRadius: '12px', padding: '1.125rem', display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <h3 style={{ fontWeight: 700, color: textMain, fontSize: '0.9375rem' }}>{pos.title}</h3>
                        <span style={{ fontSize: '0.7rem', color: textMut, background: isDark ? 'rgba(255,255,255,0.04)' : '#F8FAFC', padding: '0.15rem 0.5rem', borderRadius: '6px', flexShrink: 0 }}>
                          Kuota: {pos.quota}
                        </span>
                      </div>
                      {pos.description && <p style={{ fontSize: '0.8rem', color: textMut, lineHeight: 1.5 }}>{pos.description}</p>}
                      {status ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.3rem 0.75rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 700, background: status.bg, color: status.color, alignSelf: 'flex-start' }}>
                          <i className="lni lni-check-circle-1" /> Status: {status.label}
                        </span>
                      ) : (
                        <button onClick={() => handleApply(pos.id)} disabled={applying === pos.id} style={{ padding: '0.625rem 1rem', background: applying === pos.id ? '#94a3b8' : '#FF9B51', border: 'none', borderRadius: '8px', color: 'white', fontWeight: 700, fontSize: '0.8rem', cursor: applying === pos.id ? 'not-allowed' : 'pointer', fontFamily: "'Montserrat', sans-serif", display: 'flex', alignItems: 'center', gap: '0.375rem', alignSelf: 'flex-start' }}>
                          {applying === pos.id ? <><i className="lni lni-spinner-3" style={{ animation: 'spin 1s linear infinite' }} /> Mendaftar...</> : <><i className="lni lni-enter" /> Daftar Sekarang</>}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } } @keyframes fadeInUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }`}</style>
    </DashboardLayout>
  );
}
