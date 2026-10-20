'use client';

import { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { get, post, getErrorMessage } from '@/lib/api';
import { useTheme } from '@/hooks/useTheme';

interface Position { id: number; title: string; quota: number; recruitment_id: number; recruitment_code: string; recruitment_title: string; }
interface Recruitment { id: number; code: string; title: string; status: string; positions: Position[]; }
interface RankingItem {
  application_id: number; candidate_name: string; candidate_email: string;
  rank_ml: number; rank_a: number; rank_b: number;
  skor_a?: number; skor_b?: number; closeness_b?: number; electre_net_ml?: number; d_rank?: number;
  final_score_ml: number; is_recommended: boolean;
  final_rank?: number; final_status?: string;
}
interface WeightComp { criteria_code: string; criteria_name: string; weight_manual: number; weight_ewm: number; weight_ml: number; difference: number; }
interface ProcessInfo {
  pso_converged: boolean; pso_iterations: number; pso_best_fitness: number; pso_fitness_history: number[];
  spearman_correlation: number; kendall_tau: number; rank_changes_count: number; total_candidates: number;
  process_duration_ms: number; processed_at: string; duration_a_ms?: number; duration_b_ms?: number;
}

const statusBadge: Record<string, { label: string; bg: string; color: string; icon: string }> = {
  pending:   { label: 'Menunggu',  bg: 'rgba(100,116,139,0.12)',  color: '#64748B', icon: 'lni lni-timer' },
  accepted:  { label: 'Diterima',   bg: 'rgba(16,185,129,0.12)',  color: '#10b981', icon: 'lni lni-check-circle-1' },
  review:    { label: 'Review',     bg: 'rgba(245,158,11,0.14)',  color: '#f59e0b', icon: 'lni lni-target' },
  rejected:  { label: 'Ditolak',    bg: 'rgba(239,68,68,0.12)',   color: '#ef4444', icon: 'lni lni-xmark-circle' },
};

export default function ReportPage() {
  const { isDark } = useTheme();
  const surface = isDark ? '#1A2332' : '#ffffff';
  const border  = isDark ? '#2A3A4A' : '#E2E8F0';
  const textMain= isDark ? '#E2EAF0' : '#25343F';
  const textMut = isDark ? '#8BA3B5' : '#64748B';

  const [positions, setPositions] = useState<Position[]>([]);
  const [selectedPos, setSelectedPos] = useState<number | null>(null);
  const [quota, setQuota] = useState(0);
  const [ranking, setRanking] = useState<RankingItem[]>([]);
  const [weights, setWeights] = useState<WeightComp[]>([]);
  const [process, setProcess] = useState<ProcessInfo | null>(null);
  const [generating, setGenerating] = useState(false);
  const [loadingRank, setLoadingRank] = useState(false);
  const [finalizing, setFinalizing] = useState(false);
  const [rowBusy, setRowBusy] = useState<number | null>(null);

  // Ambil semua posisi dari rekrutmen aktif/closed
  useEffect(() => {
    (async () => {
      try {
        const res = await get<{ items: Recruitment[] }>('/master/recruitments?per_page=100');
        if (res.success && res.data) {
          const allPos = (res.data.items ?? [])
            .filter(r => ['active', 'closed'].includes(r.status))
            .flatMap(r => (r.positions || []).map(p => ({ ...p, recruitment_id: r.id, recruitment_code: r.code, recruitment_title: r.title })));
          setPositions(allPos);
        }
      } catch { /* ignore */ }
    })();
  }, []);

  const fetchRanking = useCallback(async (posId: number) => {
    setLoadingRank(true); setRanking([]); setWeights([]); setProcess(null);
    try {
      const res = await get<{ quota: number; ranking: RankingItem[]; weight_comparison: WeightComp[]; process_info: ProcessInfo | null }>(`/report/ranking/${posId}`);
      if (res.success && res.data) {
        setRanking(res.data.ranking); setWeights(res.data.weight_comparison);
        setProcess(res.data.process_info); setQuota(res.data.quota ?? 0);
      }
    } catch { /* no ranking yet */ }
    finally { setLoadingRank(false); }
  }, []);

  const handleSelectPos = (posId: number) => { setSelectedPos(posId); fetchRanking(posId); };

  const handleGenerate = async () => {
    if (!selectedPos) return;
    setGenerating(true);
    try {
      await post(`/report/generate/${selectedPos}`);
      fetchRanking(selectedPos);
    } catch (err) { alert(getErrorMessage(err)); }
    finally { setGenerating(false); }
  };

  // Finalize otomatis: kedua lintasan masuk kuota → accepted, satu → review, selainnya rejected
  const handleFinalize = async () => {
    if (!selectedPos) return;
    setFinalizing(true);
    try {
      const res = await post<{ auto_status_counts: Record<string, number>; }>(`/report/ranking/${selectedPos}/finalize`);
      if (res.success) {
        const c = res.data?.auto_status_counts;
        if (c) alert(`Finalize selesai — diterima: ${c.accepted ?? 0}, review: ${c.review ?? 0}, ditolak: ${c.rejected ?? 0}`);
        fetchRanking(selectedPos);
      }
    } catch (err) { alert(getErrorMessage(err)); }
    finally { setFinalizing(false); }
  };

  // Penyesuaian manual status satu kandidat
  const handleRowStatus = async (applicationId: number, status: string) => {
    setRowBusy(applicationId);
    try {
      await post(`/report/ranking/${selectedPos}/finalize/${applicationId}`, { status });
      setRanking(rs => rs.map(r => r.application_id === applicationId ? { ...r, final_status: status } : r));
    } catch (err) { alert(getErrorMessage(err)); }
    finally { setRowBusy(null); }
  };

  const rho = process?.spearman_correlation;
  const tau = process?.kendall_tau;

  return (
    <DashboardLayout>
      <div style={{ marginBottom: '1.75rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: textMain }}>Generate Ranking</h1>
        <p style={{ color: textMut, fontSize: '0.875rem' }}>
          Perbandingan dua lintasan: Lintasan A (Fuzzy-ELECTRE) vs Lintasan B (Fuzzy-TOPSIS) — bobot EWM-PSO yang sama
        </p>
      </div>

      {/* Pilih Posisi */}
      <div style={{ background: surface, border: `1px solid ${border}`, borderRadius: '16px', padding: '1.25rem 1.5rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
        <label style={{ fontSize: '0.8rem', fontWeight: 700, color: textMut, textTransform: 'uppercase', letterSpacing: '0.05em', flexShrink: 0 }}>Pilih Posisi:</label>
        <select value={selectedPos || ''} onChange={e => handleSelectPos(Number(e.target.value))} style={{ flex: 1, minWidth: '240px', padding: '0.625rem 0.875rem', background: isDark ? 'rgba(255,255,255,0.04)' : '#F8FAFC', border: `1.5px solid ${border}`, borderRadius: '10px', color: textMain, fontSize: '0.875rem', fontFamily: "'Montserrat', sans-serif", outline: 'none' }}>
          <option value="">-- Pilih posisi --</option>
          {positions.map(p => <option key={p.id} value={p.id}>{p.title} — {p.recruitment_code} · {p.recruitment_title}</option>)}
        </select>
        {selectedPos && (
          <button onClick={handleGenerate} disabled={generating} style={{ padding: '0.625rem 1.25rem', background: generating ? '#94a3b8' : '#25343F', border: 'none', borderRadius: '10px', color: 'white', fontWeight: 700, fontSize: '0.875rem', cursor: generating ? 'not-allowed' : 'pointer', fontFamily: "'Montserrat', sans-serif", display: 'flex', alignItems: 'center', gap: '0.5rem', whiteSpace: 'nowrap' }}>
            {generating ? <><i className="lni lni-spinner-3" style={{ animation: 'spin 1s linear infinite' }} /> Memproses Fuzzy → EWM → PSO → A &amp; B...</> : <><i className="lni lni-refresh-circle-1-clockwise" /> Generate Ranking</>}
          </button>
        )}
      </div>

      {/* Panel Metrik Perbandingan (ρ, τ, PSO, durasi) */}
      {process && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
            {[
              { label: 'Total Kandidat', value: process.total_candidates, icon: 'lni lni-user-multiple-4', color: '#3b82f6' },
              { label: 'Spearman ρ', value: rho != null ? rho.toFixed(4) : '—', icon: 'lni lni-bar-chart-4', color: '#8b5cf6' },
              { label: 'Kendall τ', value: tau != null ? tau.toFixed(4) : '—', icon: 'lni lni-bar-chart-4', color: '#14b8a6' },
              { label: 'PSO Fitness', value: process.pso_best_fitness != null ? process.pso_best_fitness.toFixed(4) : '—', sub: process.pso_converged ? `konvergen · ${process.pso_iterations} iter` : 'belum konvergen', icon: 'lni lni-refresh-circle-1-clockwise', color: process.pso_converged ? '#10b981' : '#ef4444' },
              { label: 'Rank Beda (A vs B)', value: process.rank_changes_count ?? 0, icon: 'lni lni-arrows-vertical', color: process.rank_changes_count ? '#f59e0b' : '#10b981' },
      {label: 'Durasi Proses', value: process.duration_a_ms != null ? `A ${process.duration_a_ms}ms · B ${process.duration_b_ms}ms` : `${process.process_duration_ms} ms`, icon: 'lni lni-timer', color: '#FF9B51' },
            ].map((s, i) => (
              <div key={i} style={{ background: surface, border: `1px solid ${border}`, borderRadius: '12px', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '1.25rem', fontWeight: 900, color: textMain }}>{String(s.value)}</span>
                  <i className={`lni ${s.icon}`} style={{ color: s.color, fontSize: '1.1rem' }} />
                </div>
                <span style={{ fontSize: '0.72rem', color: textMut, fontWeight: 600 }}>{s.sub ? `${s.label} · ${s.sub}` : s.label}</span>
              </div>
            ))}
          </div>

          {/* Kurva Konvergensi PSO (dari fitness history) */}
          {process.pso_fitness_history?.length > 1 && (
            <ConvergenceCard history={process.pso_fitness_history} isDark={isDark} />
          )}
        </>
      )}

      {/* Ranking A vs B */}
      {loadingRank ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: textMut }}>
          <i className="lni lni-spinner-3" style={{ fontSize: '2rem', animation: 'spin 1s linear infinite', display: 'block', marginBottom: '0.75rem' }} /> Memuat ranking...
        </div>
      ) : ranking.length > 0 ? (
        <>
          {/* Keputusan Akhir: Finalize Otomatis */}
          <div style={{ background: surface, border: `1px solid ${border}`, borderRadius: '16px', padding: '1.25rem 1.5rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h3 style={{ fontWeight: 700, color: textMain, fontSize: '0.9375rem', marginBottom: '0.25rem' }}>
                <i className="lni lni-target" style={{ color: '#FF9B51', marginRight: '0.375rem' }} /> Keputusan Akhir (dua lintasan)
              </h3>
              <p style={{ color: textMut, fontSize: '0.8rem' }}>
                Masuk kuota ({quota}) di <strong>kedua</strong> lintasan → Diterima · hanya satu → Review · lainnya → Ditolak
              </p>
            </div>
            <button onClick={handleFinalize} disabled={finalizing} style={{ padding: '0.625rem 1.25rem', background: finalizing ? '#94a3b8' : '#FF9B51', border: 'none', borderRadius: '10px', color: 'white', fontWeight: 700, fontSize: '0.8rem', cursor: finalizing ? 'not-allowed' : 'pointer', fontFamily: "'Montserrat', sans-serif", display: 'flex', alignItems: 'center', gap: '0.5rem', whiteSpace: 'nowrap' }}>
              {finalizing ? <><i className="lni lni-spinner-3" style={{ animation: 'spin 1s linear infinite' }} /> Memproses...</> : <><i className="lni lni-checkmark-circle" /> Finalize Semua Kandidat</>}
            </button>
          </div>

          {/* Tabel A-vs-B */}
          <div style={{ background: surface, border: `1px solid ${border}`, borderRadius: '16px', overflow: 'hidden', marginBottom: '1.5rem' }}>
            <div style={{ padding: '1rem 1.5rem', borderBottom: `1px solid ${border}` }}>
              <h3 style={{ fontWeight: 700, color: textMain }}>Perbandingan Peringkat Kandidat — Lintasan A vs B</h3>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    {['Kandidat', 'Rank A / Skor A', 'Rank B / Skor B', 'CLᵦ', 'dᵢ (A−B)', 'Skor Final', 'Status Akhir', 'Atur Ulang'].map(h => (
                      <th key={h} style={{ padding: '0.875rem 1rem', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: textMut, background: isDark ? '#0F1419' : '#F8FAFC', textAlign: 'left', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {ranking.map((r, i) => {
                    const d = (r.d_rank ?? 0);
                    const st = statusBadge[r.final_status ?? 'pending'] ?? statusBadge.pending;
                    return (
                      <tr key={i} style={{ borderTop: `1px solid ${border}`, background: r.rank_a <= quota ? (isDark ? 'rgba(16,185,129,0.05)' : 'rgba(16,185,129,0.03)') : 'transparent' }}>
                        <td style={{ padding: '0.875rem 1rem' }}>
                          <div style={{ fontWeight: 600, color: textMain, fontSize: '0.875rem' }}>{r.candidate_name}</div>
                          <div style={{ fontSize: '0.75rem', color: textMut }}>{r.candidate_email}</div>
                        </td>
                        <td style={{ padding: '0.875rem 1rem', textAlign: 'center' }}>
                          <span style={{ fontWeight: 800, fontSize: '1.1rem', color: r.rank_a <= quota ? '#FF9B51' : textMain }}>#{r.rank_a}</span>
                          <div style={{ fontSize: '0.72rem', color: textMut }}>{r.skor_a?.toFixed(2)}</div>
                        </td>
                        <td style={{ padding: '0.875rem 1rem', textAlign: 'center' }}>
                          <span style={{ fontWeight: 800, fontSize: '1.1rem', color: r.rank_b <= quota ? '#3b82f6' : textMain }}>#{r.rank_b}</span>
                          <div style={{ fontSize: '0.72rem', color: textMut }}>{r.skor_b?.toFixed(2)}</div>
                        </td>
                        <td style={{ padding: '0.875rem 1rem', fontWeight: 600, color: textMut, fontSize: '0.8125rem' }}>{r.closeness_b?.toFixed(3)}</td>
                        <td style={{ padding: '0.875rem 1rem', textAlign: 'center' }}>
                          <span style={{ fontWeight: 700, color: d > 0 ? '#10b981' : d < 0 ? '#ef4444' : textMut, fontSize: '0.875rem' }}>
                            {d > 0 ? `+${d}` : `${d}`}
                          </span>
                        </td>
                        <td style={{ padding: '0.875rem 1rem', fontWeight: 600, color: textMain }}>{r.final_score_ml?.toFixed(2)}</td>
                        <td style={{ padding: '0.875rem 1rem' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.2rem 0.625rem', borderRadius: '999px', fontSize: '0.7rem', fontWeight: 700, background: st.bg, color: st.color }}>
                            <i className={st.icon} /> {st.label}
                          </span>
                        </td>
                        <td style={{ padding: '0.875rem 1rem' }}>
                          <select value={r.final_status ?? 'pending'} disabled={rowBusy === r.application_id} onChange={e => handleRowStatus(r.application_id, e.target.value)}
                            style={{ background: isDark ? 'rgba(255,255,255,0.04)' : '#F8FAFC', border: `1px solid ${border}`, borderRadius: '8px', color: textMain, fontSize: '0.75rem', fontFamily: "'Montserrat', sans-serif", padding: '0.3rem 0.375rem', outline: 'none', opacity: rowBusy === r.application_id ? 0.5 : 1 }}>
                            <option value="pending">Menunggu</option>
                            <option value="accepted">Diterima</option>
                            <option value="review">Review</option>
                            <option value="rejected">Ditolak</option>
                          </select>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Perbandingan Bobot: Manual (baseline) vs EWM vs PSO */}
          {weights.length > 0 && (
            <div style={{ background: surface, border: `1px solid ${border}`, borderRadius: '16px', overflow: 'hidden' }}>
              <div style={{ padding: '1rem 1.5rem', borderBottom: `1px solid ${border}` }}>
                <h3 style={{ fontWeight: 700, color: textMain }}>
                  <i className="lni lni-bar-chart-4" style={{ color: '#FF9B51', marginRight: '0.5rem' }} />
                  Bobot Kriteria: Manual (baseline) vs EWM vs PSO
                </h3>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      {['Kriteria', 'Bobot Manual (baseline)', 'Bobot EWM', 'Bobot PSO', 'Selisih (PSO−EWM)'].map(h => (
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
                        <td style={{ padding: '0.875rem 1rem', fontSize: '0.875rem', color: textMut }}>{(w.weight_manual * 100).toFixed(2)}%</td>
                        <td style={{ padding: '0.875rem 1rem', fontSize: '0.875rem', color: '#3b82f6', fontWeight: 600 }}>{(w.weight_ewm * 100).toFixed(2)}%</td>
                        <td style={{ padding: '0.875rem 1rem', fontSize: '0.875rem', color: '#FF9B51', fontWeight: 700 }}>{(w.weight_ml * 100).toFixed(2)}%</td>
                        <td style={{ padding: '0.875rem 1rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div style={{ flex: 1, height: '6px', background: isDark ? '#2A3A4A' : '#E2E8F0', borderRadius: '3px', overflow: 'hidden' }}>
                              <div style={{ height: '100%', width: `${Math.min(Math.abs(w.difference) * 500, 100)}%`, background: w.difference > 0.05 ? '#ef4444' : '#10b981', borderRadius: '3px' }} />
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
          <p style={{ fontSize: '0.875rem' }}>Klik "Generate Ranking" untuk memproses Fuzzy → EWM → PSO → Lintasan A &amp; B.</p>
        </div>
      ) : null}

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </DashboardLayout>
  );
}

/* ── Kurva konvergensi PSO (SVG ringan) ──────────────────────────────────── */
function ConvergenceCard({ history, isDark }: { history: number[]; isDark: boolean }) {
  const surface = isDark ? '#1A2332' : '#ffffff';
  const border  = isDark ? '#2A3A4A' : '#E2E8F0';
  const textMain= isDark ? '#E2EAF0' : '#25343F';
  const textMut = isDark ? '#8BA3B5' : '#64748B';

  const W = 720, H = 180, PADL = 56, PADB = 26, PADT = 12, PADR = 12;
  const vals = history.map(v => Math.max(0, v));
  const lo = Math.min(...vals), hi = Math.max(...vals);
  const span = hi - lo || 1;
  const pt = (i: number, v: number) =>
    `${PADL + (i * (W - PADL - PADR)) / Math.max(vals.length - 1, 1)},${PADT + (H - PADT - PADB) * (1 - (v - lo) / span)}`;
  const path = vals.map((v, i) => pt(i, v)).join(' ');
  const last = vals[vals.length - 1];
  const iters = vals.length - 1;

  return (
    <div style={{ background: surface, border: `1px solid ${border}`, borderRadius: '16px', overflow: 'hidden', marginBottom: '1.5rem' }}>
      <div style={{ padding: '1rem 1.5rem', borderBottom: `1px solid ${border}`, display: 'flex', justifyContent: 'space-between' }}>
        <h3 style={{ fontWeight: 700, color: textMain }}>
          <i className="lni lni-graph" style={{ color: '#FF9B51', marginRight: '0.5rem' }} /> Kurva Konvergensi PSO
        </h3>
        <span style={{ fontSize: '0.75rem', color: textMut }}>fitness gbest terakhir: <strong style={{ color: textMain }}>{last.toFixed(6)}</strong> · {iters} iterasi</span>
      </div>
      <div style={{ padding: '1rem 1.25rem', overflowX: 'auto' }}>
        <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', minWidth: '480px', height: 'auto', display: 'block' }}>
          {/* grid + tick label fitness */}
          {[0, 0.25, 0.5, 0.75, 1].map(f => {
            const y = PADT + (H - PADT - PADB) * f;
            return (
              <g key={f}>
                <line x1={PADL} x2={W - PADR} y1={y} y2={y} stroke={border} strokeDasharray="3 3" strokeWidth="1" />
                <text x={PADL - 6} y={y + 3} textAnchor="end" fill={textMut} fontSize="9">{(hi - f * span).toFixed(4)}</text>
              </g>
            );
          })}
          {/* label axis */}
          <text x={PADL} y={H - 8} fill={textMut} fontSize="9" textAnchor="middle">iter 0</text>
          <text x={W - PADR} y={H - 8} fill={textMut} fontSize="9" textAnchor="middle">iter {iters}</text>
          {/* kurva fitness */}
          <polyline points={path} fill="none" stroke="#FF9B51" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </div>
  );
}