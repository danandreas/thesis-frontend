'use client';

import { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { get, post, put, del, getErrorMessage } from '@/lib/api';
import { useTheme } from '@/hooks/useTheme';

interface ReqType { id: number; code: string; name: string; description: string; is_active: boolean; }

export default function ReqTypesPage() {
  const { isDark } = useTheme();
  const surface  = isDark ? '#1A2332' : '#ffffff';
  const border   = isDark ? '#2A3A4A' : '#E2E8F0';
  const textMain = isDark ? '#E2EAF0' : '#25343F';
  const textMut  = isDark ? '#8BA3B5' : '#64748B';
  const inputBg  = isDark ? 'rgba(255,255,255,0.04)' : '#F8FAFC';

  const [items, setItems] = useState<ReqType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<ReqType | null>(null);
  const [form, setForm] = useState({ code: '', name: '', description: '', is_active: true });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await get<ReqType[]>('/master/requirement-types');
      if (res.success && res.data) setItems(res.data);
    } catch (e) { console.error(getErrorMessage(e)); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openCreate = () => { setEditing(null); setForm({ code: '', name: '', description: '', is_active: true }); setError(''); setShowModal(true); };
  const openEdit = (item: ReqType) => { setEditing(item); setForm({ code: item.code, name: item.name, description: item.description || '', is_active: item.is_active }); setError(''); setShowModal(true); };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setSaving(true);
    try {
      if (editing) await put(`/master/requirement-types/${editing.id}`, form);
      else await post('/master/requirement-types', form);
      setShowModal(false); fetchData();
    } catch (err) { setError(getErrorMessage(err)); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Hapus jenis syarat ini?')) return;
    try { await del(`/master/requirement-types/${id}`); fetchData(); }
    catch (err) { alert(getErrorMessage(err)); }
  };

  const inputStyle: React.CSSProperties = { width: '100%', padding: '0.625rem 0.875rem', background: inputBg, border: `1.5px solid ${border}`, borderRadius: '10px', color: textMain, fontSize: '0.875rem', fontFamily: "'Montserrat', sans-serif", outline: 'none', boxSizing: 'border-box' };
  const labelStyle: React.CSSProperties = { display: 'block', fontSize: '0.72rem', fontWeight: 700, color: textMut, marginBottom: '0.375rem', letterSpacing: '0.05em', textTransform: 'uppercase' };

  // Ikon sesuai kode
  const iconMap: Record<string, string> = {
    GPA: 'lni-graduation', TOEFL: 'lni-world', IELTS: 'lni-world', CERT: 'lni-certificate', WORK: 'lni-briefcase',
  };

  return (
    <DashboardLayout>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: textMain }}>Jenis Syarat</h1>
          <p style={{ color: textMut, fontSize: '0.875rem' }}>Master data jenis syarat tambahan kandidat (IPK, TOEFL, Sertifikat, dll.)</p>
        </div>
        <button onClick={openCreate} style={{ padding: '0.625rem 1.25rem', background: '#FF9B51', border: 'none', borderRadius: '10px', color: 'white', fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer', fontFamily: "'Montserrat', sans-serif", display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <i className="lni lni-plus" /> Tambah Jenis
        </button>
      </div>

      {/* Cards Grid */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1rem' }}>
          {[...Array(5)].map((_, i) => (
            <div key={i} style={{ height: '120px', borderRadius: '14px', background: isDark ? '#1E2D3D' : '#E2E8F0', animation: 'pulse 1.5s ease-in-out infinite' }} />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div style={{ background: surface, border: `1px solid ${border}`, borderRadius: '16px', padding: '3rem', textAlign: 'center', color: textMut }}>
          <i className="lni lni-files" style={{ fontSize: '2.5rem', display: 'block', marginBottom: '0.75rem' }} />
          Belum ada jenis syarat. Klik "Tambah Jenis" untuk memulai.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1.25rem' }}>
          {items.map((item, i) => (
            <div key={item.id} style={{
              background: surface, border: `1px solid ${border}`, borderRadius: '16px', padding: '1.375rem',
              position: 'relative', overflow: 'hidden',
              animation: 'fadeInUp 0.4s ease both', animationDelay: `${i * 0.06}s`,
              transition: 'box-shadow 0.2s',
            }}
            onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.boxShadow = isDark ? '0 8px 32px rgba(0,0,0,0.4)' : '0 8px 32px rgba(37,52,63,0.12)'}
            onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.boxShadow = ''}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.875rem' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(255,155,81,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <i className={`lni ${iconMap[item.code] || 'lni-files'}`} style={{ fontSize: '1.25rem', color: '#FF9B51' }} />
                </div>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.2rem 0.625rem', borderRadius: '999px', fontSize: '0.65rem', fontWeight: 700, background: item.is_active ? 'rgba(16,185,129,0.12)' : 'rgba(100,116,139,0.1)', color: item.is_active ? '#10b981' : textMut }}>
                  {item.is_active ? 'Aktif' : 'Nonaktif'}
                </span>
              </div>

              <div style={{ marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ background: 'rgba(255,155,81,0.12)', color: '#FF7A1F', padding: '0.1rem 0.4rem', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 700 }}>{item.code}</span>
                <h3 style={{ fontWeight: 700, color: textMain, fontSize: '0.9375rem' }}>{item.name}</h3>
              </div>
              {item.description && <p style={{ fontSize: '0.8rem', color: textMut, lineHeight: 1.5, marginBottom: '1rem' }}>{item.description}</p>}

              <div style={{ display: 'flex', gap: '0.625rem', marginTop: 'auto' }}>
                <button onClick={() => openEdit(item)} style={{ flex: 1, padding: '0.5rem', background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(37,52,63,0.06)', border: `1px solid ${border}`, borderRadius: '8px', color: textMain, cursor: 'pointer', fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.375rem', fontFamily: "'Montserrat', sans-serif", fontWeight: 600 }}>
                  <i className="lni lni-pencil" /> Edit
                </button>
                <button onClick={() => handleDelete(item.id)} style={{ flex: 1, padding: '0.5rem', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '8px', color: '#ef4444', cursor: 'pointer', fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.375rem', fontFamily: "'Montserrat', sans-serif", fontWeight: 600 }}>
                  <i className="lni lni-trash-can" /> Hapus
                </button>
              </div>

              {/* Decorative bg circle */}
              <div style={{ position: 'absolute', bottom: '-16px', right: '-16px', width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(255,155,81,0.05)', pointerEvents: 'none' }} />
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', backdropFilter: 'blur(4px)' }}>
          <div style={{ background: surface, border: `1px solid ${border}`, borderRadius: '20px', padding: '2rem', width: '100%', maxWidth: '460px', animation: 'fadeInUp 0.25s ease' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontWeight: 800, fontSize: '1.125rem', color: textMain }}>{editing ? 'Edit Jenis Syarat' : 'Tambah Jenis Syarat'}</h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: textMut, fontSize: '1.25rem' }}><i className="lni lni-close" /></button>
            </div>
            {error && <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '8px', padding: '0.75rem', color: '#ef4444', fontSize: '0.875rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><i className="lni lni-warning" /> {error}</div>}
            <form onSubmit={handleSave}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div><label style={labelStyle}>Kode</label><input style={inputStyle} value={form.code} onChange={e => setForm(p => ({ ...p, code: e.target.value.toUpperCase() }))} placeholder="GPA" required maxLength={20} onFocus={e => e.target.style.borderColor = '#FF9B51'} onBlur={e => e.target.style.borderColor = border} /></div>
                <div><label style={labelStyle}>Nama</label><input style={inputStyle} value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Indeks Prestasi Kumulatif" required onFocus={e => e.target.style.borderColor = '#FF9B51'} onBlur={e => e.target.style.borderColor = border} /></div>
                <div><label style={labelStyle}>Deskripsi</label><textarea style={{ ...inputStyle, minHeight: '70px', resize: 'vertical' } as React.CSSProperties} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} onFocus={e => e.target.style.borderColor = '#FF9B51'} onBlur={e => e.target.style.borderColor = border} /></div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <input type="checkbox" id="is_active_rt" checked={form.is_active} onChange={e => setForm(p => ({ ...p, is_active: e.target.checked }))} style={{ width: '18px', height: '18px', accentColor: '#FF9B51' }} />
                  <label htmlFor="is_active_rt" style={{ fontSize: '0.875rem', color: textMain, cursor: 'pointer' }}>Aktif</label>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button type="button" onClick={() => setShowModal(false)} style={{ flex: 1, padding: '0.75rem', background: 'none', border: `1.5px solid ${border}`, borderRadius: '10px', color: textMain, cursor: 'pointer', fontWeight: 600, fontFamily: "'Montserrat', sans-serif" }}>Batal</button>
                  <button type="submit" disabled={saving} style={{ flex: 1, padding: '0.75rem', background: saving ? '#94a3b8' : '#FF9B51', border: 'none', borderRadius: '10px', color: 'white', cursor: saving ? 'not-allowed' : 'pointer', fontWeight: 700, fontFamily: "'Montserrat', sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                    {saving ? <><i className="lni lni-spinner" style={{ animation: 'spin 1s linear infinite' }} /> Menyimpan...</> : <><i className="lni lni-save" /> Simpan</>}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        @keyframes fadeInUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}
      `}</style>
    </DashboardLayout>
  );
}
