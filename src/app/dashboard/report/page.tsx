'use client';

import { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { get, post, getErrorMessage } from '@/lib/api';
import { useTheme } from '@/hooks/useTheme';

interface Position { id: number; title: string; quota: number; recruitment_id: number; }
interface Recruitment { id: number; title: string; status: string; positions: Position[]; }
interface RankingItem { application_id: number; candidate_name: string; candidate_email: string; rank_manual: number; rank_ml: number; final_score_manual: number; final_score_ml: number; is_recommended: boolean; admin_choice?: string; final_rank?: number; final_status?: string; }
interface WeightComp { criteria_code: string; criteria_name: string; weight_manual: number; weight_ewm: number; weight_ml: number; difference: number; }

export default function ReportPage() {
  const { isDark } = useTheme();
  const surface = isDark ? '#1A2332' : '#ffffff';
  const border  = isDark ? '#2A3A4A' : '#E2E8F0';
  const textMain= isDark ? '#E2EAF0' : '#25343F';
  const textMut = isDark ? '#8BA3B5' : '#64748B';

  const [positions, setPositions] = useState<Position[]>([]);
  const [selectedPos, setSelectedPos] = useState<number | null>(null);
  const [ranking, setRanking] = useState<RankingItem[]>([]);
  const [weights, setWeights] = useState<WeightComp[]>([]);
  const [generating, setGenerating] = useState(false);
  const [loadingRank, setLoadingRank] = useState(false);
  const [genResult, setGenResult] = useState<{ pso_converged: boolean; pso_iterations: number; spearman_correlation: number; total_candidates: number; } | null>(null);
  const [choosing, setChoosing] = useState(false);

  // Ambil semua posisi dari rekrutmen aktif/closed
  useEffect(() => {
    (async () => {
      try {
        // Bug fix: GET /master/recruitments sekarang mengembalikan { items, total, ... }
        const res = await get<{ items: Recruitment[] }>('/master/recruitments?per_page=100');
        if (res.success && res.data) {
          const allPos = (res.data.items ?? [])
            .filter(r => ['active', 'closed'].includes(r.status))
            .flatMap(r => (r.positions || []).map(p => ({ ...p, recruitment_id: r.id })));
          setPositions(allPos);
        }
      } catch { /* ignore */ }
    })();
  }, []);

  const fetchRanking = useCallback(async (posId: number) => {
    setLoadingRank(true); setRanking([]); setWeights([]);
    try {
      const res = await get<{ ranking: RankingItem[]; weight_comparison: WeightComp[] }>(`/report/ranking/${posId}`);
      if (res.success && res.data) { setRanking(res.data.ranking); setWeights(res.data.weight_comparison); }
    } catch { /* no ranking yet */ }
    finally { setLoadingRank(false); }
  }, []);

  const handleSelectPos = (posId: number) => { setSelectedPos(posId); setGenResult(null); fetchRanking(posId); };

  const handleGenerate = async () => {
    if (!selectedPos) return;
    setGenerating(true);
    try {
      const res = await post<{ pso_converged: boolean; pso_iterations: number; spearman_correlation: number; total_candidates: number; ranking: RankingItem[]; weight_comparison: WeightComp[] }>(`/report/generate/${selectedPos}`);
      if (res.success && res.data) {
        setGenResult({ pso_converged: res.data.pso_converged, pso_iterations: res.data.pso_iterations, spearman_correlation: res.data.spearman_correlation, total_candidates: res.data.total_candidates });
        setRanking(res.data.ranking);
        setWeights(res.data.weight_comparison);
      }
    } catch (err) { alert(getErrorMessage(err)); }
    finally { setGenerating(false); }
  };

  const handleChoose = async (choice: 'manual' | 'ml') => {
    if (!selectedPos) return;
    setChoosing(true);
    try {
      await post(`/report/ranking/${selectedPos}/choose`, { choice });
      fetchRanking(selectedPos);
    } catch (err) { alert(getErrorMessage(err)); }
    finally { setChoosing(false); }
  };

  return (
    <DashboardLayout>
      <div style={{ marginBottom: '1.75rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: textMain }}>Laporan & Ranking</h1>
        <p style={{ color: textMut, fontSize: '0.875rem' }}>Generate dan bandingkan ranking kandidat manual vs ML</p>
      </div>

      {/* Pilih Posisi */}
      <div style={{ background: surface, border: `1px solid ${border}`, borderRadius: '16px', padding: '1.25rem 1.5rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
        <label style={{ fontSize: '0.8rem', fontWeight: 700, color: textMut, textTransform: 'uppercase', letterSpacing: '0.05em', flexShrink: 0 }}>Pilih Posisi:</label>
        <select value={selectedPos || ''} onChange={e => handleSelectPos(Number(e.target.value))} style={{ flex: 1, minWidth: '240px', padding: '0.625rem 0.875rem', background: isDark ? 'rgba(255,255,255,0.04)' : '#F8FAFC', border: `1.5px solid ${border}`, borderRadius: '10px', color: textMain, fontSize: '0.875rem', fontFamily: "'Montserrat', sans-serif", outline: 'none' }}>
          <option value="">-- Pilih posisi --</option>
          {positions.map(p => <option key={p.id} value={p.id}>{p.title} (ID: {p.id})</option>)}
        </select>
        {selectedPos && (
          <button onClick={handleGenerate} disabled={generating} style={{ padding: '0.625rem 1.25rem', background: generating ? '#94a3b8' : '#25343F', border: 'none', borderRadius: '10px', color: 'white', fontWeight: 700, fontSize: '0.875rem', cursor: generating ? 'not-allowed' : 'pointer', fontFamily: "'Montserrat', sans-serif", display: 'flex', alignItems: 'center', gap: '0.5rem', whiteSpace: 'nowrap' }}>
            {generating ? <><i className="lni lni-spinner-3" style={{ animation: 'spin 1s linear infinite' }} /> Memproses Fuzzy+EWM+PSO+ELECTRE...</> : <><i className="lni lni-refresh-circle-1-clockwise" /> Generate Ranking</>}
          </button>
        )}
      </div>

      {/* Hasil Generate */}
      {genResult && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
          {[
            { label: 'Total Kandidat', value: genResult.total_candidates, icon: 'lni-user-multiple-4', color: '#3b82f6' },
            { label: 'Iterasi PSO', value: genResult.pso_iterations, icon: 'lni-refresh-circle-1-clockwise', color: '#FF9B51' },
            { label: 'PSO Konvergen', value: genResult.pso_converged ? 'Ya' : 'Tidak', icon: 'lni-check-circle-1', color: genResult.pso_converged ? '#10b981' : '#ef4444' },
            { label: 'Spearman Corr.', value: genResult.spearman_correlation != null ? genResult.spearman_correlation.toFixed(4) : '—', icon: 'lni-bar-chart-4', color: '#8b5cf6' },
          ].map((s, i) => (
            <div key={i} style={{ background: surface, border: `1px solid ${border}`, borderRadius: '12px', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '1.25rem', fontWeight: 900, color: textMain }}>{s.value}</span>
                <i className={`lni ${s.icon}`} style={{ color: s.color, fontSize: '1.1rem' }} />
              </div>
              <span style={{ fontSize: '0.72rem', color: textMut, fontWeight: 600 }}>{s.label}</span>
            </div>
          ))}
        </div>
      )}

      {/* Ranking Table */}
      {loadingRank ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: textMut }}>
          <i className="lni lni-spinner-3" style={{ fontSize: '2rem', animation: 'spin 1s linear infinite', display: 'block', marginBottom: '0.75rem' }} /> Memuat ranking...
        </div>
      ) : ranking.length > 0 ? (
        <>
          {/* Human-in-the-Loop */}
          <div style={{ background: surface, border: `1px solid ${border}`, borderRadius: '16px', padding: '1.25rem 1.5rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h3 style={{ fontWeight: 700, color: textMain, fontSize: '0.9375rem', marginBottom: '0.25rem' }}>
                <i className="lni lni-user-multiple-4" style={{ color: '#FF9B51', marginRight: '0.375rem' }} /> Human-in-the-Loop
              </h3>
              <p style={{ color: textMut, fontSize: '0.8rem' }}>Pilih versi ranking yang akan digunakan sebagai final</p>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button onClick={() => handleChoose('manual')} disabled={choosing} style={{ padding: '0.625rem 1.25rem', background: 'rgba(37,52,63,0.08)', border: `1.5px solid #25343F`, borderRadius: '10px', color: '#25343F', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer', fontFamily: "'Montserrat', sans-serif", display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <i className="lni lni-user-4" /> Pakai Bobot Manual
              </button>
              <button onClick={() => handleChoose('ml')} disabled={choosing} style={{ padding: '0.625rem 1.25rem', background: '#FF9B51', border: 'none', borderRadius: '10px', color: 'white', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer', fontFamily: "'Montserrat', sans-serif", display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <i className="lni lni-bulb-2" /> Pakai Bobot ML
              </button>
            </div>
          </div>

          {/* Ranking */}
          <div style={{ background: surface, border: `1px solid ${border}`, borderRadius: '16px', overflow: 'hidden', marginBottom: '1.5rem' }}>
            <div style={{ padding: '1rem 1.5rem', borderBottom: `1px solid ${border}` }}>
              <h3 style={{ fontWeight: 700, color: textMain }}>Perbandingan Ranking Kandidat</h3>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    {['Kandidat', 'Rank Manual', 'Skor Manual', 'Rank ML', 'Skor ML', 'Selisih Rank', 'Rekomendasi'].map(h => (
                      <th key={h} style={{ padding: '0.875rem 1rem', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: textMut, background: isDark ? '#0F1419' : '#F8FAFC', textAlign: 'left', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {ranking.map((r, i) => {
                    const diff = r.rank_manual - r.rank_ml;
                    return (
                      <tr key={i} style={{ borderTop: `1px solid ${border}`, background: r.is_recommended ? (isDark ? 'rgba(16,185,129,0.05)' : 'rgba(16,185,129,0.03)') : 'transparent' }}>
                        <td style={{ padding: '0.875rem 1rem' }}>
                          <div style={{ fontWeight: 600, color: textMain, fontSize: '0.875rem' }}>{r.candidate_name}</div>
                          <div style={{ fontSize: '0.75rem', color: textMut }}>{r.candidate_email}</div>
                        </td>
                        <td style={{ padding: '0.875rem 1rem', textAlign: 'center' }}>
                          <span style={{ fontWeight: 800, fontSize: '1.1rem', color: r.rank_manual <= 3 ? '#FF9B51' : textMain }}>#{r.rank_manual}</span>
                        </td>
                        <td style={{ padding: '0.875rem 1rem', fontWeight: 600, color: textMain }}>{r.final_score_manual?.toFixed(2)}</td>
                        <td style={{ padding: '0.875rem 1rem', textAlign: 'center' }}>
                          <span style={{ fontWeight: 800, fontSize: '1.1rem', color: r.rank_ml <= 3 ? '#FF9B51' : textMain }}>#{r.rank_ml}</span>
                        </td>
                        <td style={{ padding: '0.875rem 1rem', fontWeight: 600, color: textMain }}>{r.final_score_ml?.toFixed(2)}</td>
                        <td style={{ padding: '0.875rem 1rem', textAlign: 'center' }}>
                          <span style={{ fontWeight: 700, color: diff > 0 ? '#10b981' : diff < 0 ? '#ef4444' : textMut, fontSize: '0.875rem' }}>
                            {diff > 0 ? `↑${diff}` : diff < 0 ? `↓${Math.abs(diff)}` : '—'}
                          </span>
                        </td>
                        <td style={{ padding: '0.875rem 1rem' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.2rem 0.625rem', borderRadius: '999px', fontSize: '0.7rem', fontWeight: 700, background: r.is_recommended ? 'rgba(16,185,129,0.12)' : 'rgba(100,116,139,0.1)', color: r.is_recommended ? '#10b981' : textMut }}>
                            <i className={r.is_recommended ? 'lni lni-check-circle-1' : 'lni lni-xmark-circle'} />
                            {r.is_recommended ? 'Direkomendasikan' : 'Tidak Lolos'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Perbandingan Bobot */}
          {weights.length > 0 && (
            <div style={{ background: surface, border: `1px solid ${border}`, borderRadius: '16px', overflow: 'hidden' }}>
              <div style={{ padding: '1rem 1.5rem', borderBottom: `1px solid ${border}` }}>
                <h3 style={{ fontWeight: 700, color: textMain }}>
                  <i className="lni lni-bar-chart-4" style={{ color: '#FF9B51', marginRight: '0.5rem' }} />
                  Perbandingan Bobot: Manual vs EWM vs ML (PSO)
                </h3>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      {['Kriteria', 'Bobot Manual', 'Bobot EWM', 'Bobot ML (PSO)', 'Selisih'].map(h => (
                        <th key={h} style={{ padding: '0.875rem 1rem', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: textMut, background: isDark ? '#0F1419' : '#F8FAFC', textAlign: 'left' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {weights.map((w, i) => (
                      <tr key={i} style={{ borderTop: `1px solid ${border}` }}>
                        <td style={{ padding: '0.875rem 1rem' }}>
                          <span style={{ background: 'rgba(255,155,81,0.12)', color: '#FF7A1F', padding: '0.2rem 0.5rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700, marginRight: '0.5rem' }}>{w.criteria_code}</span>
                          <span style={{ fontSize: '0.875rem', color: textMain, fontWeight: 500 }}>{w.criteria_name}</span>
                        </td>
                        <td style={{ padding: '0.875rem 1rem', fontSize: '0.875rem', color: textMain }}>{(w.weight_manual * 100).toFixed(2)}%</td>
                        <td style={{ padding: '0.875rem 1rem', fontSize: '0.875rem', color: '#3b82f6', fontWeight: 600 }}>{(w.weight_ewm * 100).toFixed(2)}%</td>
                        <td style={{ padding: '0.875rem 1rem', fontSize: '0.875rem', color: '#FF9B51', fontWeight: 700 }}>{(w.weight_ml * 100).toFixed(2)}%</td>
                        <td style={{ padding: '0.875rem 1rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div style={{ flex: 1, height: '6px', background: isDark ? '#2A3A4A' : '#E2E8F0', borderRadius: '3px', overflow: 'hidden' }}>
                              <div style={{ height: '100%', width: `${Math.min(w.difference * 1000, 100)}%`, background: w.difference > 0.05 ? '#ef4444' : '#10b981', borderRadius: '3px' }} />
                            </div>
                            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: w.difference > 0.05 ? '#ef4444' : '#10b981', minWidth: '48px' }}>{(w.difference * 100).toFixed(2)}%</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      ) : selectedPos ? (
        <div style={{ background: surface, border: `1px solid ${border}`, borderRadius: '16px', padding: '3rem', textAlign: 'center', color: textMut }}>
          <i className="lni lni-bar-chart-4" style={{ fontSize: '2.5rem', display: 'block', marginBottom: '0.75rem' }} />
          <p style={{ fontWeight: 600, marginBottom: '0.25rem' }}>Ranking belum di-generate.</p>
          <p style={{ fontSize: '0.875rem' }}>Klik "Generate Ranking" untuk memulai proses Fuzzy → EWM → PSO → ELECTRE.</p>
        </div>
      ) : null}

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </DashboardLayout>
  );
}
