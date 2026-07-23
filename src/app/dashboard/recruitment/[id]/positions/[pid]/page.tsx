'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { get, post, put, del, getErrorMessage } from '@/lib/api';
import { useTheme } from '@/hooks/useTheme';

interface Option { id: number; option_text: string; likert_value: number; display_order: number; }
interface Question { id: number; question_text: string; display_order: number; options: Option[]; }
interface PositionData { id: number; title: string; recruitment_title: string; recruitment_id: number; }

export default function PositionQuestionsPage() {
  const params = useParams();
  const recId = Number(params.id);
  const posId = Number(params.pid);
  const { isDark } = useTheme();

  const surface  = isDark ? '#1A2332' : '#ffffff';
  const border   = isDark ? '#2A3A4A' : '#E2E8F0';
  const textMain = isDark ? '#E2EAF0' : '#25343F';
  const textMut  = isDark ? '#8BA3B5' : '#64748B';
  const inputBg  = isDark ? 'rgba(255,255,255,0.04)' : '#F8FAFC';

  const [position, setPosition] = useState<PositionData | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);

  const [qModal, setQModal] = useState(false);
  const [optModal, setOptModal] = useState(false);
  const [editQ, setEditQ] = useState<Question | null>(null);
  const [editOpt, setEditOpt] = useState<Option | null>(null);
  const [activeQId, setActiveQId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [expandedQ, setExpandedQ] = useState<number | null>(null);

  const [qForm, setQForm] = useState({ question_text: '', display_order: 1 });
  const [optForm, setOptForm] = useState({ option_text: '', likert_value: 3, display_order: 1 });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [posRes, qRes] = await Promise.all([
        get<PositionData>(`/master/recruitments/${recId}/positions/${posId}`),
        get<Question[]>(`/master/position-criteria/${posId}/questions`),
      ]);
      if (posRes.success && posRes.data) setPosition(posRes.data);
      if (qRes.success && qRes.data) setQuestions(qRes.data);
    } catch (e) { console.error(getErrorMessage(e)); }
    finally { setLoading(false); }
  }, [recId, posId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Question CRUD
  const openAddQ = () => { setEditQ(null); setQForm({ question_text: '', display_order: (questions.length + 1) * 10 }); setError(''); setQModal(true); };
  const openEditQ = (q: Question) => { setEditQ(q); setQForm({ question_text: q.question_text, display_order: q.display_order }); setError(''); setQModal(true); };

  const saveQ = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setSaving(true);
    try {
      if (editQ) await put(`/master/questions/${editQ.id}`, qForm);
      else await post(`/master/position-criteria/${posId}/questions`, qForm);
      setQModal(false); fetchData();
    } catch (err) { setError(getErrorMessage(err)); }
    finally { setSaving(false); }
  };

  const deleteQ = async (qId: number) => {
    if (!confirm('Hapus pertanyaan ini beserta semua opsinya?')) return;
    try { await del(`/master/questions/${qId}`); fetchData(); }
    catch (err) { alert(getErrorMessage(err)); }
  };

  // Option CRUD
  const openAddOpt = (qId: number, existingOpts: Option[]) => {
    setActiveQId(qId); setEditOpt(null);
    setOptForm({ option_text: '', likert_value: 3, display_order: existingOpts.length + 1 });
    setError(''); setOptModal(true);
  };
  const openEditOpt = (qId: number, opt: Option) => {
    setActiveQId(qId); setEditOpt(opt);
    setOptForm({ option_text: opt.option_text, likert_value: opt.likert_value, display_order: opt.display_order });
    setError(''); setOptModal(true);
  };

  const saveOpt = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setSaving(true);
    try {
      const payload = { ...optForm, likert_value: Number(optForm.likert_value), display_order: Number(optForm.display_order) };
      if (editOpt) await put(`/master/options/${editOpt.id}`, payload);
      else await post(`/master/questions/${activeQId}/options`, payload);
      setOptModal(false); fetchData();
    } catch (err) { setError(getErrorMessage(err)); }
    finally { setSaving(false); }
  };

  const deleteOpt = async (optId: number) => {
    if (!confirm('Hapus opsi ini?')) return;
    try { await del(`/master/options/${optId}`); fetchData(); }
    catch (err) { alert(getErrorMessage(err)); }
  };

  const inputStyle: React.CSSProperties = { width: '100%', padding: '0.625rem 0.875rem', background: inputBg, border: `1.5px solid ${border}`, borderRadius: '10px', color: textMain, fontSize: '0.875rem', fontFamily: "'Montserrat', sans-serif", outline: 'none', boxSizing: 'border-box' };
  const labelStyle: React.CSSProperties = { display: 'block', fontSize: '0.72rem', fontWeight: 700, color: textMut, marginBottom: '0.375rem', letterSpacing: '0.05em', textTransform: 'uppercase' };

  if (loading) return (
    <DashboardLayout>
      <div style={{ padding: '3rem', textAlign: 'center', color: textMut }}>
        <i className="lni lni-spinner-3" style={{ fontSize: '2rem', animation: 'spin 1s linear infinite', display: 'block', marginBottom: '0.75rem' }} /> Memuat...
      </div>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </DashboardLayout>
  );

  return (
    <DashboardLayout>
      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', fontSize: '0.8rem', color: textMut, flexWrap: 'wrap' }}>
        <Link href="/dashboard/recruitment" style={{ color: textMut, textDecoration: 'none' }}>Rekrutmen</Link>
        <i className="lni lni-chevron-right-circle" style={{ fontSize: '0.7rem' }} />
        <Link href={`/dashboard/recruitment/${recId}`} style={{ color: textMut, textDecoration: 'none' }}>{position?.recruitment_title || `REC #${recId}`}</Link>
        <i className="lni lni-chevron-right-circle" style={{ fontSize: '0.7rem' }} />
        <span style={{ color: '#FF9B51', fontWeight: 600 }}>{position?.title}</span>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.75rem', gap: '1rem', flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: '1.375rem', fontWeight: 800, color: textMain }}>Pertanyaan Asesmen</h1>
          <p style={{ color: textMut, fontSize: '0.875rem' }}>
            Posisi: <strong style={{ color: '#FF9B51' }}>{position?.title}</strong> &nbsp;·&nbsp; {questions.length} pertanyaan
          </p>
        </div>
        <button onClick={openAddQ} style={{ padding: '0.625rem 1.25rem', background: '#FF9B51', border: 'none', borderRadius: '10px', color: 'white', fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer', fontFamily: "'Montserrat', sans-serif", display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <i className="lni lni-plus" /> Tambah Pertanyaan
        </button>
      </div>

      {questions.length === 0 ? (
        <div style={{ background: surface, border: `1px solid ${border}`, borderRadius: '16px', padding: '3rem', textAlign: 'center', color: textMut }}>
          <i className="lni lni-question-mark-circle" style={{ fontSize: '3rem', display: 'block', marginBottom: '1rem' }} />
          Belum ada pertanyaan. Tambahkan pertanyaan Likert untuk asesmen ini.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {questions.map((q, idx) => (
            <div key={q.id} style={{ background: surface, border: `1px solid ${border}`, borderRadius: '14px', overflow: 'hidden', animation: 'fadeInUp 0.3s ease' }}>
              {/* Question header */}
              <div style={{ padding: '1rem 1.25rem', display: 'flex', alignItems: 'flex-start', gap: '0.875rem' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'rgba(255,155,81,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontWeight: 800, fontSize: '0.75rem', color: '#FF7A1F' }}>{idx + 1}</div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontWeight: 600, color: textMain, fontSize: '0.9rem', lineHeight: 1.5 }}>{q.question_text}</p>
                  <p style={{ fontSize: '0.72rem', color: textMut, marginTop: '0.25rem' }}>{q.options.length} opsi jawaban · urutan: {q.display_order}</p>
                </div>
                <div style={{ display: 'flex', gap: '0.375rem', flexShrink: 0 }}>
                  <button onClick={() => setExpandedQ(expandedQ === q.id ? null : q.id)} style={{ padding: '0.3rem 0.625rem', background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(37,52,63,0.06)', border: `1px solid ${border}`, borderRadius: '6px', color: textMain, cursor: 'pointer', fontSize: '0.75rem', fontFamily: "'Montserrat', sans-serif" }}>
                    <i className={`lni ${expandedQ === q.id ? 'lni-chevron-up' : 'lni-chevron-down'}`} />
                  </button>
                  <button onClick={() => openEditQ(q)} style={{ padding: '0.3rem 0.625rem', background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(37,52,63,0.06)', border: `1px solid ${border}`, borderRadius: '6px', color: textMain, cursor: 'pointer', fontSize: '0.75rem', fontFamily: "'Montserrat', sans-serif" }}>
                    <i className="lni lni-pencil-1" />
                  </button>
                  <button onClick={() => deleteQ(q.id)} style={{ padding: '0.3rem 0.625rem', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '6px', color: '#ef4444', cursor: 'pointer', fontSize: '0.75rem', fontFamily: "'Montserrat', sans-serif" }}>
                    <i className="lni lni-trash-3" />
                  </button>
                </div>
              </div>

              {/* Options (expanded) */}
              {expandedQ === q.id && (
                <div style={{ padding: '0.875rem 1.25rem', borderTop: `1px solid ${border}`, background: isDark ? 'rgba(0,0,0,0.15)' : 'rgba(37,52,63,0.02)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.625rem' }}>
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, color: textMut, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Opsi Jawaban</span>
                    <button onClick={() => openAddOpt(q.id, q.options)} style={{ padding: '0.2rem 0.5rem', background: 'rgba(255,155,81,0.1)', border: '1px solid rgba(255,155,81,0.2)', borderRadius: '6px', color: '#FF7A1F', cursor: 'pointer', fontSize: '0.7rem', fontFamily: "'Montserrat', sans-serif", fontWeight: 700 }}>
                      + Tambah Opsi
                    </button>
                  </div>
                  {q.options.length === 0 ? (
                    <p style={{ fontSize: '0.8rem', color: textMut, fontStyle: 'italic' }}>Belum ada opsi jawaban.</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                      {q.options.sort((a, b) => a.display_order - b.display_order).map(opt => (
                        <div key={opt.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0.875rem', background: surface, borderRadius: '8px', border: `1px solid ${border}` }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: `hsl(${(opt.likert_value - 1) * 30 + 120}, 60%, ${isDark ? '30%' : '90%'})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 700, color: textMain, flexShrink: 0 }}>{opt.likert_value}</div>
                            <span style={{ fontSize: '0.8rem', color: textMain }}>{opt.option_text}</span>
                          </div>
                          <div style={{ display: 'flex', gap: '0.25rem' }}>
                            <button onClick={() => openEditOpt(q.id, opt)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: textMut, padding: '0.15rem', fontSize: '0.8rem' }}><i className="lni lni-pencil-1" /></button>
                            <button onClick={() => deleteOpt(opt.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: '0.15rem', fontSize: '0.8rem' }}><i className="lni lni-trash-3" /></button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Question Modal */}
      {qModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', backdropFilter: 'blur(4px)' }}>
          <div style={{ background: surface, border: `1px solid ${border}`, borderRadius: '20px', padding: '2rem', width: '100%', maxWidth: '520px', animation: 'fadeInUp 0.25s ease' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontWeight: 800, fontSize: '1.125rem', color: textMain }}>{editQ ? 'Edit Pertanyaan' : 'Tambah Pertanyaan'}</h2>
              <button onClick={() => setQModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: textMut, fontSize: '1.25rem' }}><i className="lni lni-xmark-circle" /></button>
            </div>
            {error && <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '8px', padding: '0.75rem', color: '#ef4444', fontSize: '0.875rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><i className="lni lni-info" /> {error}</div>}
            <form onSubmit={saveQ}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div><label style={labelStyle}>Teks Pertanyaan</label><textarea style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' } as React.CSSProperties} value={qForm.question_text} onChange={e => setQForm(p => ({ ...p, question_text: e.target.value }))} placeholder="Seberapa sering Anda menyelesaikan masalah teknis secara mandiri?" required onFocus={e => e.target.style.borderColor = '#FF9B51'} onBlur={e => e.target.style.borderColor = border} /></div>
                <div><label style={labelStyle}>Urutan Tampil</label><input type="number" min={1} style={inputStyle} value={qForm.display_order} onChange={e => setQForm(p => ({ ...p, display_order: parseInt(e.target.value) }))} onFocus={e => e.target.style.borderColor = '#FF9B51'} onBlur={e => e.target.style.borderColor = border} /></div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button type="button" onClick={() => setQModal(false)} style={{ flex: 1, padding: '0.75rem', background: 'none', border: `1.5px solid ${border}`, borderRadius: '10px', color: textMain, cursor: 'pointer', fontWeight: 600, fontFamily: "'Montserrat', sans-serif" }}>Batal</button>
                  <button type="submit" disabled={saving} style={{ flex: 1, padding: '0.75rem', background: saving ? '#94a3b8' : '#FF9B51', border: 'none', borderRadius: '10px', color: 'white', cursor: saving ? 'not-allowed' : 'pointer', fontWeight: 700, fontFamily: "'Montserrat', sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                    {saving ? <><i className="lni lni-spinner-3" style={{ animation: 'spin 1s linear infinite' }} /> Menyimpan...</> : <><i className="lni lni-floppy-disk-1" /> Simpan</>}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Option Modal */}
      {optModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', backdropFilter: 'blur(4px)' }}>
          <div style={{ background: surface, border: `1px solid ${border}`, borderRadius: '20px', padding: '2rem', width: '100%', maxWidth: '440px', animation: 'fadeInUp 0.25s ease' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontWeight: 800, fontSize: '1.125rem', color: textMain }}>{editOpt ? 'Edit Opsi' : 'Tambah Opsi Jawaban'}</h2>
              <button onClick={() => setOptModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: textMut, fontSize: '1.25rem' }}><i className="lni lni-xmark-circle" /></button>
            </div>
            {error && <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '8px', padding: '0.75rem', color: '#ef4444', fontSize: '0.875rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><i className="lni lni-info" /> {error}</div>}
            <form onSubmit={saveOpt}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div><label style={labelStyle}>Teks Opsi</label><input style={inputStyle} value={optForm.option_text} onChange={e => setOptForm(p => ({ ...p, option_text: e.target.value }))} placeholder="Sangat Sering" required onFocus={e => e.target.style.borderColor = '#FF9B51'} onBlur={e => e.target.style.borderColor = border} /></div>
                <div>
                  <label style={labelStyle}>Nilai Likert (1-5)</label>
                  <select style={inputStyle} value={optForm.likert_value} onChange={e => setOptForm(p => ({ ...p, likert_value: parseInt(e.target.value) }))}>
                    <option value={1}>1 — Sangat Rendah / Tidak Pernah</option>
                    <option value={2}>2 — Rendah / Jarang</option>
                    <option value={3}>3 — Sedang / Kadang-kadang</option>
                    <option value={4}>4 — Tinggi / Sering</option>
                    <option value={5}>5 — Sangat Tinggi / Selalu</option>
                  </select>
                </div>
                <div><label style={labelStyle}>Urutan Tampil</label><input type="number" min={1} style={inputStyle} value={optForm.display_order} onChange={e => setOptForm(p => ({ ...p, display_order: parseInt(e.target.value) }))} onFocus={e => e.target.style.borderColor = '#FF9B51'} onBlur={e => e.target.style.borderColor = border} /></div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button type="button" onClick={() => setOptModal(false)} style={{ flex: 1, padding: '0.75rem', background: 'none', border: `1.5px solid ${border}`, borderRadius: '10px', color: textMain, cursor: 'pointer', fontWeight: 600, fontFamily: "'Montserrat', sans-serif" }}>Batal</button>
                  <button type="submit" disabled={saving} style={{ flex: 1, padding: '0.75rem', background: saving ? '#94a3b8' : '#FF9B51', border: 'none', borderRadius: '10px', color: 'white', cursor: saving ? 'not-allowed' : 'pointer', fontWeight: 700, fontFamily: "'Montserrat', sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                    {saving ? <><i className="lni lni-spinner-3" style={{ animation: 'spin 1s linear infinite' }} /> Menyimpan...</> : <><i className="lni lni-floppy-disk-1" /> Simpan</>}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}} @keyframes fadeInUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}`}</style>
    </DashboardLayout>
  );
}
