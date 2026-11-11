'use client';

import { useState, useEffect, useCallback, type ReactNode } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { get, post, getErrorMessage } from '@/lib/api';
import { useTheme } from '@/hooks/useTheme';

interface Position { id: number; title: string; quota: number; recruitment_id: number; recruitment_code: string; recruitment_title: string; }
interface Recruitment { id: number; code: string; title: string; status: string; positions: Position[]; }
interface RankingItem {
  application_id: number; candidate_name: string; candidate_email: string;
  rank_ml: number; rank_a: number; rank_b: number;
  skor_a?: number; skor_b?: number; closeness_b?: number; electre_net_ml?: number; d_rank?: number;
  // Metrik asli Lintasan A (ELECTRE) — net mentah, semestanya beda dari 0-100
  net_concordance_a?: number | null; net_discordance_a?: number | null; net_a?: number | null;
  // Metrik asli Lintasan B (TOPSIS)
  d_plus_b?: number | null; d_minus_b?: number | null;
  final_score_ml: number; is_recommended: boolean;
  final_rank?: number; final_status?: string;
}
interface WeightComp { criteria_code: string; criteria_name: string; weight_manual: number; weight_ewm: number; weight_ml: number; difference: number; }
interface ProcessInfo {
  pso_converged: boolean; pso_iterations: number; pso_best_fitness: number; pso_fitness_history: number[];
  spearman_correlation: number; kendall_tau: number; rank_changes_count: number; total_candidates: number;
  process_duration_ms: number; processed_at: string; duration_a_ms?: number | null; duration_b_ms?: number | null;
}

const statusBadge: Record<string, { label: string; bg: string; color: string; icon: string }> = {
  pending:   { label: 'Menunggu',  bg: 'rgba(100,116,139,0.12)',  color: '#64748B', icon: 'lni lni-timer' },
  accepted:  { label: 'Diterima',  bg: 'rgba(16,185,129,0.12)',   color: '#10b981', icon: 'lni lni-check-circle-1' },
  review:    { label: 'Review',    bg: 'rgba(245,158,11,0.14)',   color: '#f59e0b', icon: 'lni lni-target' },
  rejected:  { label: 'Ditolak',   bg: 'rgba(239,68,68,0.12)',    color: '#ef4444', icon: 'lni lni-xmark-circle' },
};

/* Definisi kolom metrik asli tiap lintasan (tooltip pada header tabel kartu) */
interface MetricCol { key: string; label: string; hint: string; fmt: (v: number | null | undefined) => string; }

const colsA: MetricCol[] = [
  { key: 'net_concordance_a', label: 'Net C', hint: 'Net concordance: selisih agregat indeks kemenangan pasangan — (Σ C(a,·) − Σ C(·,a)). Makin besar = kandidat makin sering unggul atas kandidat lain.', fmt: v => fmtNum(v, 3) },
  { key: 'net_discordance_a', label: 'Net D', hint: 'Net discordance: selisih agregat indeks kekalahan pasangan — (Σ D(a,·) − Σ D(·,a)). Makin kecil (negatif) = kekalahan yang dialami makin ringan.', fmt: v => fmtNum(v, 3) },
  { key: 'net_a', label: 'Net Score', hint: 'Net score ELECTRE = Net C − Net D. Inilah dasar peringkat Lintasan A; nilai aslinya bisa negatif (skala −n s.d. +n), berbeda semesta dengan Skor 0–100.', fmt: v => fmtNum(v, 3) },
];
const colsB: MetricCol[] = [
  { key: 'closeness_b', label: 'CL', hint: 'Closeness coefficient TOPSIS = D⁻ / (D⁺ + D⁻), rentang 0–1. Makin dekat 1 = makin dekat ke solusi ideal dan makin jauh dari solusi terburuk.', fmt: v => fmtNum(v, 3) },
  { key: 'd_plus_b', label: 'D⁺', hint: 'Jarak Euclidean (D⁺) nilai terbobot kandidat ke solusi ideal positif A⁺ (gabungan nilai terbaik tiap kriteria). Makin kecil = makin mirip kandidat ideal.', fmt: v => fmtNum(v, 4) },
  { key: 'd_minus_b', label: 'D⁻', hint: 'Jarak Euclidean (D⁻) nilai terbobot kandidat ke solusi anti-ideal A⁻ (gabungan nilai terburuk tiap kriteria). Makin besar = makin jauh dari profil terburuk.', fmt: v => fmtNum(v, 4) },
];

function fmtNum(v: number | null | undefined, d = 2): string {
  return v == null ? '—' : v.toFixed(d);
}

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

  // Kesepakatan top-3 antar lintasan (himpunan kandidat peringkat ≤ 3)
  const top3Set = (getRank: (r: RankingItem) => number | undefined) =>
    ranking.filter(r => (getRank(r) ?? 99) <= 3).map(r => r.candidate_name).sort().join(' · ');
  const top3A = top3Set(r => r.rank_a);
  const top3B = top3Set(r => r.rank_b);
  const top3Same = top3A.length > 0 && top3A === top3B;

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

      {/* 1. Panel Metrik Kesepakatan (shared — bukan milik salah satu lintasan) */}
      {process && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
          <Tile isDark={isDark} label="Total Kandidat" value={String(process.total_candidates)} icon="lni lni-user-multiple-4" color="#3b82f6" />
          <Tile isDark={isDark} label="Spearman ρ" value={rho != null ? rho.toFixed(4) : '—'} icon="lni lni-bar-chart-4" color="#8b5cf6"
            hint="Korelasi rank Spearman antara peringkat Lintasan A dan B atas bobot yang sama. 1,000 = urutan identik penuh; mendekati 1 = kecil perbedaannya." />
          <Tile isDark={isDark} label="Kendall τ" value={tau != null ? tau.toFixed(4) : '—'} icon="lni lni-bar-chart-4" color="#14b8a6"
            hint="Korelasi Kendall: proporsi pasangan kandidat yang urutannya sepakat antara kedua lintasan (tahan terhadap peringkat seri)." />
          <Tile isDark={isDark} label="Top-3 A vs B" value={top3Same ? 'Identik' : 'Beda'} sub={top3A || '—'} icon="lni lni-target" color={top3Same ? '#10b981' : '#f59e0b'}
            hint="Kandidat peringkat 1–3 pada masing-masing lintasan; menentukan komposisi kuota penerimaan." />
          <Tile isDark={isDark} label="Rank Beda (A vs B)" value={String(process.rank_changes_count ?? 0)} icon="lni lni-arrows-vertical" color={process.rank_changes_count ? '#f59e0b' : '#10b981'}
            hint="Jumlah kandidat dengan nomor peringkat berbeda antara Lintasan A dan Lintasan B." />
          <Tile isDark={isDark} label="PSO Fitness" value={process.pso_best_fitness != null ? process.pso_best_fitness.toFixed(4) : '—'} sub={process.pso_converged ? `konvergen · ${process.pso_iterations} iter` : 'belum konvergen'} icon="lni lni-refresh-circle-1-clockwise" color={process.pso_converged ? '#10b981' : '#ef4444'}
            hint="Nilai fungsi fitness EWM-PSO (sumber bobot KEDUA lintasan) — sama untuk kiri dan kanan, inilah yang membuat perbandingan terkontrol." />
        </div>
      )}

      {loadingRank ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: textMut }}>
          <i className="lni lni-spinner-3" style={{ fontSize: '2rem', animation: 'spin 1s linear infinite', display: 'block', marginBottom: '0.75rem' }} /> Memuat ranking...
        </div>
      ) : ranking.length > 0 ? (
        <>
          {/* 2. Dua kolom: Lintasan A (kiri) vs Lintasan B (kanan) */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem', alignItems: 'start' }}>
            <LaneCard
              isDark={isDark} border={border} surface={surface} textMain={textMain} textMut={textMut}
              lane="A" laneColor="#FF9B51" quota={quota}
              methodName="Fuzzy-ELECTRE"
              methodHint="ELECTRE (Elimination Et Choix Traduisant la Réalité) membandingkan setiap PASANGAN kandidat lewat dua matriks: concordance (berapa kriteria kandidat a tidak kalah dari b) dan discordance (seberapa jauh a kalah dari b). Peringkat dari net score = net concordance − net discordance. Karakter: keputusan dari mayoritas kriteria, mudah ditelusuri per pasangan."
              tagline="Outranking berpasangan concordance–discordance"
              scaleLabel="Net score (−n … +n, bisa negatif)"
              scaleHint="Skala asli output ELECTRE: agregat selisih concordance–discordance per kandidat. Berbeda semesta dari Skor 0–100."
              durationMs={process?.duration_a_ms}
              rows={ranking.map(r => ({
                id: r.application_id, name: r.candidate_name, rank: r.rank_a ?? 0,
                score: r.skor_a ?? 0,
                metrics: [
                  r.net_concordance_a ?? null, r.net_discordance_a ?? null, r.net_a ?? r.electre_net_ml ?? null,
                ],
              }))}
              metricCols={colsA}
            />
            <LaneCard
              isDark={isDark} border={border} surface={surface} textMain={textMain} textMut={textMut}
              lane="B" laneColor="#3b82f6" quota={quota}
              methodName="Fuzzy-TOPSIS"
              methodHint="TOPSIS (Technique for Order Preference by Similarity to Ideal Solution) mengukur kedekatan setiap kandidat ke dua titik: solusi ideal A⁺ (profil terbaik tiap kriteria) dan anti-ideal A⁻ (profil terburuk). Peringkat dari closeness CL = D⁻/(D⁺+D⁻), rentang 0–1. Karakter: keputusan dari jarak agregat ke profil ideal; skor mudah dibaca."
              tagline="Kedekatan ke solusi ideal & anti-ideal"
              scaleLabel="Closeness (0–1)"
              scaleHint="Skala asli output TOPSIS: closeness coefficient CL = D⁻/(D⁺+D⁻). Berbeda semesta dari Skor 0–100."
              durationMs={process?.duration_b_ms}
              rows={ranking.map(r => ({
                id: r.application_id, name: r.candidate_name, rank: r.rank_b ?? 0,
                score: r.skor_b ?? 0,
                metrics: [r.closeness_b ?? null, r.d_plus_b ?? null, r.d_minus_b ?? null],
              }))}
              metricCols={colsB} sortOwnRank
            />
          </div>

          {/* 3. Keputusan Akhir: Finalize Otomatis + tabel gabungan */}
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

          <div style={{ background: surface, border: `1px solid ${border}`, borderRadius: '16px', overflow: 'hidden', marginBottom: '1.5rem' }}>
            <div style={{ padding: '1rem 1.5rem', borderBottom: `1px solid ${border}` }}>
              <h3 style={{ fontWeight: 700, color: textMain }}>Tabulasi Gabungan Per Kandidat — Lintasan A vs B</h3>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    {[<span key="k">Kandidat</span>,
                      <Hint key="ra" text="Peringkat Lintasan A — dihitung dari net score Fuzzy-ELECTRE (net concordance − net discordance)." isDark={isDark}>Rank A</Hint>,
                      <Hint key="rb" text="Peringkat Lintasan B — dihitung dari closeness coefficient Fuzzy-TOPSIS (D⁻/(D⁺+D⁻))." isDark={isDark}>Rank B</Hint>,
                      <Hint key="di" text="Selisih peringkat kandidat ini antara kedua lintasan: dᵢ = rank A − rank B. Nilai 0 berarti kedua metode sepakat untuk kandidat ini." isDark={isDark}>dᵢ (A−B)</Hint>,
                      <Hint key="fin" text="Skor keputusan akhir = Skor Lintasan A (assessment, dinormalisasi) × bobot penilaian + skor syarat tambahan × bobot syarat — persentase bobot per komponen tercantum di panel metrik." isDark={isDark}>Skor Final</Hint>,
                      <span key="st">Status Akhir</span>, <span key="ov">Atur Ulang</span>].map((head, i) => (
                      <th key={i} style={{ padding: '0.875rem 1rem', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: textMut, background: isDark ? '#0F1419' : '#F8FAFC', textAlign: 'left', whiteSpace: 'nowrap' }}>{head}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {ranking.map((r, i) => {
                    const d = r.d_rank ?? ((r.rank_a ?? 0) - (r.rank_b ?? 0));
                    const st = statusBadge[r.final_status ?? 'pending'] ?? statusBadge.pending;
                    return (
                      <tr key={i} style={{ borderTop: `1px solid ${border}`, background: r.rank_a <= quota ? (isDark ? 'rgba(16,185,129,0.05)' : 'rgba(16,185,129,0.03)') : 'transparent' }}>
                        <td style={{ padding: '0.875rem 1rem' }}>
                          <div style={{ fontWeight: 600, color: textMain, fontSize: '0.875rem' }}>{r.candidate_name}</div>
                          <div style={{ fontSize: '0.75rem', color: textMut }}>{r.candidate_email}</div>
                        </td>
                        <td style={{ padding: '0.875rem 1rem', textAlign: 'center' }}>
                          <span style={{ fontWeight: 800, fontSize: '1.1rem', color: r.rank_a <= quota ? '#FF9B51' : textMain }}>#{r.rank_a}</span>
                        </td>
                        <td style={{ padding: '0.875rem 1rem', textAlign: 'center' }}>
                          <span style={{ fontWeight: 800, fontSize: '1.1rem', color: r.rank_b <= quota ? '#3b82f6' : textMain }}>#{r.rank_b}</span>
                        </td>
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

          {/* 4. Panel Catatan Pembacaan (penegas) */}
          <ReaderNote isDark={isDark} border={border} surface={surface} textMain={textMain} textMut={textMut}
            rho={rho} tau={tau} rankSame={(process?.rank_changes_count ?? 0) === 0} top3Same={top3Same}
            durationA={process?.duration_a_ms} durationB={process?.duration_b_ms} />

          {/* 5. Perbandingan Bobot: Manual (baseline) vs EWM vs PSO */}
          {weights.length > 0 && (
            <div style={{ background: surface, border: `1px solid ${border}`, borderRadius: '16px', overflow: 'hidden', marginBottom: '1.5rem' }}>
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

          {/* Kurva Konvergensi PSO (dari fitness history) */}
          {process && process.pso_fitness_history?.length > 1 && (
            <ConvergenceCard history={process.pso_fitness_history} isDark={isDark} />
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

/* ── Tile metrik (tooltip opsional pada label) ───────────────────────────── */
function Tile({ label, value, sub, icon, color, isDark, hint }: {
  label: string; value: string; sub?: string; icon: string; color: string; isDark: boolean; hint?: string;
}) {
  const surface = isDark ? '#1A2332' : '#ffffff';
  const border  = isDark ? '#2A3A4A' : '#E2E8F0';
  const textMain= isDark ? '#E2EAF0' : '#25343F';
  const textMut = isDark ? '#8BA3B5' : '#64748B';
  const labelText = sub ? `${label} · ${sub}` : label;
  return (
    <div style={{ background: surface, border: `1px solid ${border}`, borderRadius: '12px', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '1.25rem', fontWeight: 900, color: textMain }}>{value}</span>
        <i className={`lni ${icon}`} style={{ color, fontSize: '1.1rem' }} />
      </div>
      <span style={{ fontSize: '0.72rem', color: textMut, fontWeight: 600 }}>
        {hint ? <Hint text={hint} isDark={isDark}>{labelText}</Hint> : labelText}
      </span>
    </div>
  );
}

/* ── Tooltip singkatan/istilah — hover / fokus keyboard ──────────────────── */
function Hint({ children, text, isDark, dir = 'up' }: { children: ReactNode; text: string; isDark?: boolean; dir?: 'up' | 'down' }) {
  const [open, setOpen] = useState(false);
  const dark = isDark ?? false;
  const pos = dir === 'up' ? { bottom: 'calc(100% + 6px)' } : { top: 'calc(100% + 6px)' };
  return (
    <span tabIndex={0} style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', gap: '0.2rem', cursor: 'help', outline: 'none' }}
      onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)} onBlur={() => setOpen(false)}
      onClick={() => setOpen(o => !o)}>
      {children}
      <i className="lni lni-information" style={{ fontSize: '0.7rem', color: dark ? '#8BA3B5' : '#94A3B8', flexShrink: 0 }} />
      {open && (
        <span style={{
          position: 'absolute', ...pos, left: '50%', transform: 'translateX(-50%)',
          zIndex: 60, width: 'min(280px, 72vw)', background: dark ? '#0B1220' : '#0F172A', color: '#E2EAF0',
          padding: '0.5rem 0.75rem', borderRadius: '8px', fontSize: '0.7rem', lineHeight: 1.5, fontWeight: 400,
          boxShadow: '0 8px 24px rgba(0,0,0,0.25)', border: `1px solid ${dark ? '#2A3A4A' : '#334155'}`,
          textAlign: 'left', whiteSpace: 'normal', pointerEvents: 'none',
        }}>
          {text}
        </span>
      )}
    </span>
  );
}

/* ── Kartu satu lintasan (kolom kiri/kanan) ──────────────────────────────── */
interface LaneRow { id: number; name: string; rank: number; score: number; metrics: (number | null)[]; }

function LaneCard({ lane, laneColor, methodName, methodHint, tagline, scaleLabel, scaleHint, durationMs, rows, metricCols, quota, sortOwnRank,
  isDark, surface, border, textMain, textMut }: {
  lane: 'A' | 'B'; laneColor: string; methodName: string; methodHint: string; tagline: string;
  scaleLabel: string; scaleHint: string; durationMs?: number | null; rows: LaneRow[]; metricCols: MetricCol[];
  quota: number; sortOwnRank?: boolean; isDark: boolean; surface: string; border: string; textMain: string; textMut: string;
}) {
  // Urutkan sesuai peringkat lintasan sendiri (B bisa saja beda urutan tampil dari A)
  const sortedRows = sortOwnRank
    ? [...rows].sort((x, y) => x.rank - y.rank || x.id - y.id)
    : rows;

  const cell = { padding: '0.55rem 0.75rem', fontSize: '0.78rem', color: textMain, whiteSpace: 'nowrap' as const };

  return (
    <div style={{ background: surface, border: `1.5px solid ${border}`, borderRadius: '16px', borderTop: `4px solid ${laneColor}` }}>
      <div style={{ padding: '1rem 1.25rem', borderBottom: `1px solid ${border}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <span style={{ background: laneColor, color: '#fff', padding: '0.15rem 0.55rem', borderRadius: '6px', fontSize: '0.68rem', fontWeight: 800, letterSpacing: '0.04em' }}>LINTASAN {lane}</span>
          <Hint text={methodHint} isDark={isDark} dir="down">
            <span style={{ fontWeight: 800, color: textMain, fontSize: '1rem' }}>{methodName}</span>
          </Hint>
        </div>
        <p style={{ color: textMut, fontSize: '0.75rem', margin: '0.4rem 0 0' }}>{tagline}</p>
        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.65rem', flexWrap: 'wrap' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', padding: '0.25rem 0.6rem', borderRadius: '999px', fontSize: '0.68rem', fontWeight: 700, background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.035)', color: textMut }}>
            <i className="lni lni-timer" style={{ color: laneColor }} /> Durasi {durationMs != null ? `${durationMs} ms` : '—'}
          </span>
          <Hint text={scaleHint} isDark={isDark}>
            <span style={{ padding: '0.25rem 0.6rem', borderRadius: '999px', fontSize: '0.68rem', fontWeight: 700, background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.035)', color: textMut, display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
              <i className="lni lni-ruler" style={{ color: laneColor }} /> Skala: {scaleLabel}
            </span>
          </Hint>
        </div>
      </div>

      {/* Grafik batang skor (skala min-max 0-100 per lintasan — tampilan URUTAN) */}
      <div style={{ padding: '1rem 1.25rem 0.75rem', borderBottom: `1px solid ${border}` }}>
        <div style={{ fontSize: '0.68rem', fontWeight: 700, color: textMut, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
          <Hint text={`Grafik menampilkan urutan, bukan kekuatan skor: nilai 0–100 adalah skala min–max internal lintasan ${lane} (Skor A dari net ELECTRE / Skor B dari closeness TOPSIS), bukan perbandingan antar lintasan.`} isDark={isDark} dir="down">
            <span>Skor {lane} per kandidat (0–100) · skala min–max lintasan</span>
          </Hint>
        </div>
        <ScoreBars rows={sortedRows} color={laneColor} isDark={isDark} track={isDark ? '#2A3A4A' : '#EDF2F7'} textMut={textMut} />
      </div>

      {/* Tabel metrik lintasan */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ padding: '0.55rem 0.75rem', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: textMut, background: isDark ? '#0F1419' : '#F8FAFC', textAlign: 'left' }}>Kandidat</th>
              <th style={{ padding: '0.55rem 0.75rem', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: textMut, background: isDark ? '#0F1419' : '#F8FAFC', textAlign: 'center' }}>Rank</th>
              <th style={{ padding: '0.55rem 0.75rem', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: textMut, background: isDark ? '#0F1419' : '#F8FAFC', textAlign: 'right' }}>Skor</th>
              {metricCols.map(c => (
                <th key={c.key} style={{ padding: '0.55rem 0.75rem', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: textMut, background: isDark ? '#0F1419' : '#F8FAFC', textAlign: 'right' }}>
                  <Hint text={c.hint} isDark={isDark}>{c.label}</Hint>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedRows.map(row => (
              <tr key={row.id} style={{ borderTop: `1px solid ${border}`, background: row.rank <= quota ? (isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.015)') : 'transparent' }}>
                <td style={{ ...cell }}>
                  <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', background: row.rank <= quota ? laneColor : 'transparent', marginRight: '0.4rem', border: row.rank <= quota ? 'none' : `1px solid ${border}` }} />
                  {row.name}
                </td>
                <td style={{ ...cell, textAlign: 'center', fontWeight: 800, color: row.rank <= quota ? laneColor : textMain }}>#{row.rank}</td>
                <td style={{ ...cell, textAlign: 'right' }}>{row.score.toFixed(2)}</td>
                {row.metrics.map((m, j) => (
                  <td key={j} style={{ ...cell, textAlign: 'right', color: textMut, fontVariantNumeric: 'tabular-nums' }}>{metricCols[j]?.fmt(m)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ── Grafik batang horizontal skor per kandidat ──────────────────────────── */
function ScoreBars({ rows, color, isDark, track, textMut }: {
  rows: LaneRow[]; color: string; isDark: boolean; track: string; textMut: string;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
      {rows.map(row => (
        <div key={row.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.7rem', color: textMut, fontWeight: 600, flex: '0 0 8.5rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.name}</span>
          <div style={{ flex: 1, height: '9px', background: track, borderRadius: '5px', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${Math.max(row.score, 1.5)}%`, background: color, borderRadius: '5px', opacity: row.rank <= 3 ? 1 : 0.55 }} />
          </div>
          <span style={{ fontSize: '0.68rem', color: textMut, fontWeight: 700, flex: '0 0 2.4rem', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{row.score.toFixed(1)}</span>
        </div>
      ))}
    </div>
  );
}

/* ── Panel Catatan Pembacaan (penegas jujur) ─────────────────────────────── */
function ReaderNote({ isDark, surface, border, textMain, textMut, rho, tau, rankSame, top3Same, durationA, durationB }: {
  isDark: boolean; surface: string; border: string; textMain: string; textMut: string;
  rho?: number | null; tau?: number | null; rankSame: boolean; top3Same: boolean;
  durationA?: number | null; durationB?: number | null;
}) {
  const item = { display: 'flex', gap: '0.6rem', fontSize: '0.78rem', color: textMain, lineHeight: 1.6 } as const;
  const num  = { flexShrink: 0, width: '1.25rem', height: '1.25rem', borderRadius: '999px', background: 'rgba(255,155,81,0.15)', color: '#FF7A1F', fontSize: '0.68rem', fontWeight: 800, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginTop: '0.15rem' };
  const strongFmt = (v?: number | null) => v == null ? '—' : v.toFixed(3);

  return (
    <div style={{ background: surface, border: `1.5px solid ${isDark ? '#2A3A4A' : '#FCD7B9'}`, borderRadius: '16px', padding: '1.25rem 1.5rem', marginBottom: '1.5rem' }}>
      <h3 style={{ fontWeight: 800, color: textMain, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.9rem' }}>
        <i className="lni lni-information" style={{ color: '#FF9B51' }} /> Cara Membaca Perbandingan Ini
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
        <div style={item}><span style={num}>1</span><p style={{ margin: 0 }}>
          Kedua lintasan bekerja pada <strong>input yang identik</strong> — nilai fuzzifikasi shoulder_right dan satu set bobot EWM-PSO yang sama — sehingga seluruh perbedaan hasil bersumber murni dari logika metode (outranking berpasangan vs jarak ke solusi ideal).
        </p></div>
        <div style={item}><span style={num}>2</span><p style={{ margin: 0 }}>
          <strong>Skor 0–100 kedua lintasan tidak saling sejenis.</strong> Skor A adalah skala min–max dari <em>net score</em> ELECTRE yang aslinya bisa negatif (lihat kolom Net Score), sedangkan Skor B bersumber dari <em>closeness coefficient</em> TOPSIS (0–1, lihat kolom CL). <strong>Bandingkan urutan peringkat, bukan besaran skornya.</strong>
        </p></div>
        <div style={item}><span style={num}>3</span><p style={{ margin: 0 }}>
          Pada data posisi ini kedua metode {rankSame && top3Same ? <strong>sepakat penuh</strong> : <>perbedaannya terukur</>} (Spearman ρ = <strong>{strongFmt(rho)}</strong>, Kendall τ = <strong>{strongFmt(tau)}</strong>{rankSame && top3Same ? '; seluruh peringkat sama, komposisi kuota tidak sensitif terhadap pilihan metode' : ''}). Karakter perbedaan metode baru terlihat pada uji stabilitas (naskah, Tabel 4.27).
        </p></div>
        <div style={item}><span style={num}>4</span><p style={{ margin: 0 }}>
          Durasi eksekusi berbeda (ELECTRE <strong>{durationA != null ? `${durationA} ms` : '—'}</strong> vs TOPSIS <strong>{durationB != null ? `${durationB} ms` : '—'}</strong>) namun keduanya jauh di bawah ambang respons sistem, sehingga tidak berpengaruh pada operasional.
        </p></div>
        <div style={item}><span style={num}>5</span><p style={{ margin: 0 }}>
          <em>Skor Final</em> dan status keputusan dihitung dari <strong>Skor Lintasan A dinormalisasi (bobot 82%) ditambah skor syarat tambahan (18%)</strong> — konsisten karena kedua lintasan memberi dasar keputusan yang sepakat pada tabel di atas.
        </p></div>
      </div>
      <div style={{ marginTop: '1rem', paddingTop: '0.9rem', borderTop: `1px dashed ${border}`, display: 'flex', flexWrap: 'wrap', gap: '0.4rem 0.9rem', alignItems: 'center' }}>
        <span style={{ fontSize: '0.68rem', fontWeight: 800, color: textMut, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Kamus singkatan:</span>
        {[
          ['Net C', 'Net concordance — selisih agregat indeks kemenangan pasangan ELECTRE.'],
          ['Net D', 'Net discordance — selisih agregat indeks kekalahan pasangan ELECTRE.'],
          ['Net Score', 'Net C − Net D; dasar peringkat Lintasan A, aslinya bisa negatif.'],
          ['CL', 'Closeness coefficient = D⁻/(D⁺+D⁻); dasar peringkat Lintasan B, rentang 0–1.'],
          ['D⁺', 'Jarak Euclidean nilai terbobot kandidat ke solusi ideal positif A⁺ (TOPSIS).'],
          ['D⁻', 'Jarak Euclidean nilai terbobot kandidat ke solusi anti-ideal A⁻ (TOPSIS).'],
          ['ELECTRE', 'Lintasan A — peringkat dari outranking berpasangan concordance–discordance (net score).'],
          ['TOPSIS', 'Lintasan B — peringkat dari kedekatan ke solusi ideal positif/anti-ideal (closeness).'],
          ['dᵢ', 'Selisih peringkat satu kandidat antara Lintasan A dan B: rank A − rank B.'],
          ['ρ', 'Korelasi rank Spearman kedua lintasan (Pers. 2.7 naskah).'],
          ['τ', 'Korelasi Kendall kedua lintasan (Pers. 2.8 naskah).'],
          ['EWM-PSO', 'Sumber bobot yang dipakai KEDUA lintasan — Entropy Weight Method yang disempurnakan Particle Swarm Optimization.'],
        ].map(([term, desc]) => (
          <Hint key={term} text={desc} isDark={isDark}>
            <span style={{ fontSize: '0.7rem', fontWeight: 700, background: 'rgba(255,155,81,0.1)', color: '#FF7A1F', padding: '0.15rem 0.45rem', borderRadius: '6px' }}>{term}</span>
          </Hint>
        ))}
      </div>
    </div>
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
    <div style={{ background: surface, border: `1px solid ${border}`, borderRadius: '16px', overflow: 'hidden' }}>
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