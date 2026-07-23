'use client';

import { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { get, post, put, del, getErrorMessage } from '@/lib/api';
import { useTheme } from '@/hooks/useTheme';

interface Criteria { id: number; code: string; name: string; description: string; is_active: boolean; }

export default function CriteriaPage() {
  const { isDark } = useTheme();
  const surface = isDark ? '#1A2332' : '#ffffff';
  const border  = isDark ? '#2A3A4A' : '#E2E8F0';
  const textMain= isDark ? '#E2EAF0' : '#25343F';
  const textMut = isDark ? '#8BA3B5' : '#64748B';
  const inputBg = isDark ? 'rgba(255,255,255,0.04)' : '#F8FAFC';

  const [items, setItems] = useState<Criteria[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Criteria | null>(null);
  const [form, setForm] = useState({ code: '', name: '', description: '', is_active: true });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState<number | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await get<Criteria[]>('/master/criteria');
      if (res.success && res.data) setItems(res.data);
    } catch (e) { console.error(getErrorMessage(e)); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openCreate = () => { setEditing(null); setForm({ code: '', name: '', description: '', is_active: true }); setError(''); setShowModal(true); };
  const openEdit = (item: Criteria) => { setEditing(item); setForm({ code: item.code, name: item.name, description: item.description || '', is_active: item.is_active }); setError(''); setShowModal(true); };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setSaving(true);
    try {
      if (editing) {
        await put(`/master/criteria/${editing.id}`, form);
      } else {
        await post('/master/criteria', form);
      }
      setShowModal(false); fetchData();
    } catch (err) { setError(getErrorMessage(err)); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Yakin ingin menghapus kriteria ini?')) return;
    setDeleting(id);
    try { await del(`/master/criteria/${id}`); fetchData(); }
    catch (err) { alert(getErrorMessage(err)); }
    finally { setDeleting(null); }
  };

  const inputStyle: React.CSSProperties = { width: '100%', padding: '0.625rem 0.875rem', background: inputBg, border: `1.5px solid ${border}`, borderRadius: '10px', color: textMain, fontSize: '0.875rem', fontFamily: "'Montserrat', sans-serif", outline: 'none', boxSizing: 'border-box' };
  const labelStyle: React.CSSProperties = { display: 'block', fontSize: '0.72rem', fontWeight: 700, color: textMut, marginBottom: '0.375rem', letterSpacing: '0.05em', textTransform: 'uppercase' };

  return (
    <DashboardLayout>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: textMain }}>Kriteria Penilaian</h1>
          <p style={{ color: textMut, fontSize: '0.875rem' }}>Kelola master data kriteria untuk penilaian kandidat</p>
        </div>
        <button onClick={openCreate} style={{ padding: '0.625rem 1.25rem', background: '#FF9B51', border: 'none', borderRadius: '10px', color: 'white', fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer', fontFamily: "'Montserrat', sans-serif", display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <i className="lni lni-plus" /> Tambah Kriteria
        </button>
      </div>

      <div style={{ background: surface, border: `1px solid ${border}`, borderRadius: '16px', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: textMut }}>
            <i className="lni lni-spinner-3" style={{ fontSize: '2rem', animation: 'spin 1s linear infinite', display: 'block', marginBottom: '0.75rem' }} />
            Memuat data...
          </div>
        ) : items.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: textMut }}>
            <i className="lni lni-clipboard" style={{ fontSize: '2.5rem', display: 'block', marginBottom: '0.75rem' }} />
            Belum ada kriteria. Klik "Tambah Kriteria" untuk memulai.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['#', 'Kode', 'Nama Kriteria', 'Deskripsi', 'Status', 'Aksi'].map(h => (
                    <th key={h} style={{ padding: '0.875rem 1rem', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: textMut, background: isDark ? '#0F1419' : '#F8FAFC', textAlign: 'left', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map((item, i) => (
                  <tr key={item.id} style={{ borderTop: `1px solid ${border}` }}>
                    <td style={{ padding: '0.875rem 1rem', fontSize: '0.8rem', color: textMut }}>{i + 1}</td>
                    <td style={{ padding: '0.875rem 1rem' }}>
                      <span style={{ background: 'rgba(255,155,81,0.12)', color: '#FF7A1F', padding: '0.2rem 0.625rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700 }}>{item.code}</span>
                    </td>
                    <td style={{ padding: '0.875rem 1rem', fontWeight: 600, color: textMain, fontSize: '0.875rem' }}>{item.name}</td>
                    <td style={{ padding: '0.875rem 1rem', color: textMut, fontSize: '0.8rem', maxWidth: '260px' }}>
                      <span style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{item.description || '—'}</span>
                    </td>
                    <td style={{ padding: '0.875rem 1rem' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.2rem 0.625rem', borderRadius: '999px', fontSize: '0.7rem', fontWeight: 700, background: item.is_active ? 'rgba(16,185,129,0.12)' : 'rgba(100,116,139,0.1)', color: item.is_active ? '#10b981' : textMut }}>
                        <i className={item.is_active ? 'lni lni-check-circle-1' : 'lni lni-xmark-circle'} />
                        {item.is_active ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </td>
                    <td style={{ padding: '0.875rem 1rem' }}>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button onClick={() => openEdit(item)} style={{ padding: '0.375rem 0.75rem', background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(37,52,63,0.06)', border: `1px solid ${border}`, borderRadius: '8px', color: textMain, cursor: 'pointer', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.375rem', fontFamily: "'Montserrat', sans-serif" }}>
                          <i className="lni lni-pencil-1" /> Edit
                        </button>
                        <button onClick={() => handleDelete(item.id)} disabled={deleting === item.id} style={{ padding: '0.375rem 0.75rem', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '8px', color: '#ef4444', cursor: 'pointer', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.375rem', fontFamily: "'Montserrat', sans-serif" }}>
                          <i className={deleting === item.id ? 'lni lni-spinner-3' : 'lni lni-trash-3'} style={deleting === item.id ? { animation: 'spin 1s linear infinite' } : {}} />
                          Hapus
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', backdropFilter: 'blur(4px)' }}>
          <div style={{ background: surface, border: `1px solid ${border}`, borderRadius: '20px', padding: '2rem', width: '100%', maxWidth: '480px', animation: 'fadeInUp 0.25s ease' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontWeight: 800, fontSize: '1.125rem', color: textMain }}>{editing ? 'Edit Kriteria' : 'Tambah Kriteria'}</h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: textMut, fontSize: '1.25rem' }}><i className="lni lni-xmark-circle" /></button>
            </div>
            {error && <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '8px', padding: '0.75rem', color: '#ef4444', fontSize: '0.875rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><i className="lni lni-info" /> {error}</div>}
            <form onSubmit={handleSave}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={labelStyle}>Kode Kriteria</label>
                  <input style={inputStyle} value={form.code} onChange={e => setForm(p => ({ ...p, code: e.target.value.toUpperCase() }))} placeholder="LOG" required maxLength={10}
                    onFocus={e => e.target.style.borderColor = '#FF9B51'} onBlur={e => e.target.style.borderColor = border} />
                </div>
                <div>
                  <label style={labelStyle}>Nama Kriteria</label>
                  <input style={inputStyle} value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Logical Thinking" required
                    onFocus={e => e.target.style.borderColor = '#FF9B51'} onBlur={e => e.target.style.borderColor = border} />
                </div>
                <div>
                  <label style={labelStyle}>Deskripsi</label>
                  <textarea style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' } as React.CSSProperties}
                    value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Deskripsi singkat tentang kriteria ini..."
                    onFocus={e => e.target.style.borderColor = '#FF9B51'} onBlur={e => e.target.style.borderColor = border}
                  />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <input type="checkbox" id="is_active" checked={form.is_active} onChange={e => setForm(p => ({ ...p, is_active: e.target.checked }))} style={{ width: '18px', height: '18px', accentColor: '#FF9B51' }} />
                  <label htmlFor="is_active" style={{ fontSize: '0.875rem', color: textMain, cursor: 'pointer', userSelect: 'none' }}>Kriteria aktif</label>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                  <button type="button" onClick={() => setShowModal(false)} style={{ flex: 1, padding: '0.75rem', background: 'none', border: `1.5px solid ${border}`, borderRadius: '10px', color: textMain, cursor: 'pointer', fontWeight: 600, fontFamily: "'Montserrat', sans-serif" }}>Batal</button>
                  <button type="submit" disabled={saving} style={{ flex: 1, padding: '0.75rem', background: saving ? '#94a3b8' : '#FF9B51', border: 'none', borderRadius: '10px', color: 'white', cursor: saving ? 'not-allowed' : 'pointer', fontWeight: 700, fontFamily: "'Montserrat', sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                    {saving ? <><i className="lni lni-spinner-3" style={{ animation: 'spin 1s linear infinite' }} /> Menyimpan...</> : <><i className="lni lni-floppy-disk-1" /> Simpan</>}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } } @keyframes fadeInUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }`}</style>
    </DashboardLayout>
  );
}
