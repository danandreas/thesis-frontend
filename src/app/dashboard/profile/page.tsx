'use client';

import { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { get, put, post, del, getErrorMessage } from '@/lib/api';
import { getUser, saveSession, getToken } from '@/lib/auth';
import { useTheme } from '@/hooks/useTheme';

interface Education {
  id: number; institution: string; degree: string; major: string;
  gpa: number; gpa_scale: number; graduation_year: number | null; is_latest: boolean;
}

export default function ProfilePage() {
  const { isDark } = useTheme();
  const surface  = isDark ? '#1A2332' : '#ffffff';
  const border   = isDark ? '#2A3A4A' : '#E2E8F0';
  const textMain = isDark ? '#E2EAF0' : '#25343F';
  const textMut  = isDark ? '#8BA3B5' : '#64748B';
  const inputBg  = isDark ? 'rgba(255,255,255,0.04)' : '#F8FAFC';

  const [form, setForm] = useState({ name: '', email: '', phone: '', address: '' });
  const [passForm, setPassForm] = useState({ current_password: '', password: '', password_confirm: '' });
  const [educations, setEducations] = useState<Education[]>([]);
  const [eduModal, setEduModal] = useState(false);
  const [editEdu, setEditEdu] = useState<Education | null>(null);
  const [eduForm, setEduForm] = useState({ institution: '', degree: '', major: '', gpa: '', start_year: '', end_year: '', is_current: false });
  const [saving, setSaving] = useState(false);
  const [passLoading, setPassLoading] = useState(false);
  const [eduSaving, setEduSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [passSuccess, setPassSuccess] = useState('');
  const [passError, setPassError] = useState('');
  const [eduError, setEduError] = useState('');

  const fetchMe = useCallback(async () => {
    try {
      const meRes = await get<{ name: string; email: string; phone: string; address: string }>('/auth/me');
      if (meRes.success && meRes.data) setForm({ name: meRes.data.name, email: meRes.data.email, phone: meRes.data.phone || '', address: meRes.data.address || '' });
      try {
        const eduRes = await get<Education[]>('/content/educations');
        if (eduRes.success && eduRes.data) setEducations(eduRes.data);
      } catch { /* kandidat mungkin belum ada */ }
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    const user = getUser();
    if (user) setForm({ name: user.name, email: user.email, phone: user.phone || '', address: '' });
    fetchMe();
  }, [fetchMe]);

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setSuccess(''); setSaving(true);
    try {
      // Bug #4 fix: gunakan /auth/me bukan /master/users/me
      await put('/auth/me', { name: form.name, phone: form.phone, address: form.address });
      setSuccess('Profil berhasil diperbarui.');
      const user = getUser();
      if (user) saveSession(getToken() || '', '', { ...user, name: form.name, phone: form.phone });
    } catch (err) { setError(getErrorMessage(err)); }
    finally { setSaving(false); }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault(); setPassError(''); setPassSuccess('');
    if (passForm.password !== passForm.password_confirm) { setPassError('Konfirmasi password tidak cocok.'); return; }
    setPassLoading(true);
    try {
      // Bug #4 fix: gunakan /auth/me/password bukan /master/users/me/password
      await put('/auth/me/password', passForm);
      setPassSuccess('Password berhasil diubah.'); setPassForm({ current_password: '', password: '', password_confirm: '' });
    } catch (err) { setPassError(getErrorMessage(err)); }
    finally { setPassLoading(false); }
  };

  const openAddEdu = () => { setEditEdu(null); setEduForm({ institution: '', degree: '', major: '', gpa: '', start_year: new Date().getFullYear().toString(), end_year: '', is_current: false }); setEduError(''); setEduModal(true); };
  // Bug #7 fix: map backend fields (graduation_year, is_latest) → frontend form fields (end_year, is_current)
  const openEditEdu = (edu: Education) => { setEditEdu(edu); setEduForm({ institution: edu.institution, degree: edu.degree, major: edu.major, gpa: edu.gpa?.toString() ?? '', start_year: '', end_year: edu.graduation_year?.toString() ?? '', is_current: edu.is_latest }); setEduError(''); setEduModal(true); };

  const handleEduSave = async (e: React.FormEvent) => {
    e.preventDefault(); setEduError(''); setEduSaving(true);
    try {
      // Bug #7 fix: map frontend field names → backend field names
      const payload = {
        institution:     eduForm.institution,
        degree:          eduForm.degree,
        major:           eduForm.major,
        gpa:             parseFloat(eduForm.gpa),
        gpa_scale:       4.0,
        graduation_year: eduForm.is_current ? null : (eduForm.end_year ? parseInt(eduForm.end_year) : null),
        is_latest:       eduForm.is_current,
      };
      if (editEdu) await put(`/content/educations/${editEdu.id}`, payload);
      else await post('/content/educations', payload);
      setEduModal(false); fetchMe();
    } catch (err) { setEduError(getErrorMessage(err)); }
    finally { setEduSaving(false); }
  };

  const handleEduDelete = async (id: number) => {
    if (!confirm('Hapus riwayat pendidikan ini?')) return;
    try { await del(`/content/educations/${id}`); fetchMe(); }
    catch (err) { alert(getErrorMessage(err)); }
  };

  const inputStyle: React.CSSProperties = { width: '100%', padding: '0.625rem 0.875rem', background: inputBg, border: `1.5px solid ${border}`, borderRadius: '10px', color: textMain, fontSize: '0.875rem', fontFamily: "'Montserrat', sans-serif", outline: 'none', transition: 'border-color 0.2s', boxSizing: 'border-box' };
  const labelStyle: React.CSSProperties = { display: 'block', fontSize: '0.72rem', fontWeight: 700, color: textMut, marginBottom: '0.375rem', letterSpacing: '0.05em', textTransform: 'uppercase' };

  return (
    <DashboardLayout>
      <div style={{ marginBottom: '1.75rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: textMain }}>Profil Saya</h1>
        <p style={{ color: textMut, fontSize: '0.875rem' }}>Kelola informasi dan riwayat pendidikan</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', alignItems: 'start' }}>
        <div style={{ background: surface, border: `1px solid ${border}`, borderRadius: '16px', padding: '1.5rem' }}>
          <h2 style={{ fontWeight: 700, fontSize: '1rem', color: textMain, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <i className="lni lni-user-4" style={{ color: '#FF9B51' }} /> Informasi Pribadi
          </h2>
          {success && <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '8px', padding: '0.75rem', color: '#10b981', fontSize: '0.875rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><i className="lni lni-check-circle-1" /> {success}</div>}
          {error && <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '8px', padding: '0.75rem', color: '#ef4444', fontSize: '0.875rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><i className="lni lni-info" /> {error}</div>}
          <form onSubmit={handleProfileSave}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div><label style={labelStyle}>Nama Lengkap</label><input style={inputStyle} value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required onFocus={e => e.target.style.borderColor = '#FF9B51'} onBlur={e => e.target.style.borderColor = border} /></div>
              <div><label style={labelStyle}>Email</label><input style={{ ...inputStyle, opacity: 0.6, cursor: 'not-allowed' }} value={form.email} disabled /></div>
              <div><label style={labelStyle}>No. Telepon</label><input style={inputStyle} value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} onFocus={e => e.target.style.borderColor = '#FF9B51'} onBlur={e => e.target.style.borderColor = border} /></div>
              <div><label style={labelStyle}>Alamat</label><textarea style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' } as React.CSSProperties} value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} onFocus={e => e.target.style.borderColor = '#FF9B51'} onBlur={e => e.target.style.borderColor = border} /></div>
              <button type="submit" disabled={saving} style={{ padding: '0.75rem', background: saving ? '#94a3b8' : '#25343F', border: 'none', borderRadius: '10px', color: 'white', fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: "'Montserrat', sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                {saving ? <><i className="lni lni-spinner-3" style={{ animation: 'spin 1s linear infinite' }} /> Menyimpan...</> : <><i className="lni lni-floppy-disk-1" /> Simpan</>}
              </button>
            </div>
          </form>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ background: surface, border: `1px solid ${border}`, borderRadius: '16px', padding: '1.5rem' }}>
            <h2 style={{ fontWeight: 700, fontSize: '1rem', color: textMain, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <i className="lni lni-locked-1" style={{ color: '#FF9B51' }} /> Ganti Password
            </h2>
            {passSuccess && <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '8px', padding: '0.75rem', color: '#10b981', fontSize: '0.875rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><i className="lni lni-check-circle-1" /> {passSuccess}</div>}
            {passError && <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '8px', padding: '0.75rem', color: '#ef4444', fontSize: '0.875rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><i className="lni lni-info" /> {passError}</div>}
            <form onSubmit={handlePasswordChange}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                {[{ key: 'current_password', label: 'Password Saat Ini' }, { key: 'password', label: 'Password Baru' }, { key: 'password_confirm', label: 'Konfirmasi Password Baru' }].map(f => (
                  <div key={f.key}><label style={labelStyle}>{f.label}</label><input type="password" style={inputStyle} value={passForm[f.key as keyof typeof passForm]} onChange={e => setPassForm(p => ({ ...p, [f.key]: e.target.value }))} required minLength={f.key !== 'current_password' ? 8 : 1} onFocus={e => e.target.style.borderColor = '#FF9B51'} onBlur={e => e.target.style.borderColor = border} /></div>
                ))}
                <button type="submit" disabled={passLoading} style={{ padding: '0.75rem', background: passLoading ? '#94a3b8' : '#FF9B51', border: 'none', borderRadius: '10px', color: 'white', fontWeight: 700, cursor: passLoading ? 'not-allowed' : 'pointer', fontFamily: "'Montserrat', sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                  {passLoading ? <><i className="lni lni-spinner-3" style={{ animation: 'spin 1s linear infinite' }} /> Mengubah...</> : <><i className="lni lni-locked-1" /> Ubah Password</>}
                </button>
              </div>
            </form>
          </div>

          <div style={{ background: surface, border: `1px solid ${border}`, borderRadius: '16px', padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h2 style={{ fontWeight: 700, fontSize: '1rem', color: textMain, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <i className="lni lni-graduation-cap-1" style={{ color: '#FF9B51' }} /> Riwayat Pendidikan
              </h2>
              <button onClick={openAddEdu} style={{ padding: '0.375rem 0.75rem', background: '#FF9B51', border: 'none', borderRadius: '8px', color: 'white', fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer', fontFamily: "'Montserrat', sans-serif", display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                <i className="lni lni-plus" /> Tambah
              </button>
            </div>
            {educations.length === 0 ? (
              <p style={{ color: textMut, fontSize: '0.875rem', fontStyle: 'italic' }}>Belum ada riwayat pendidikan.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                {educations.map(edu => (
                  <div key={edu.id} style={{ padding: '1rem', background: isDark ? 'rgba(255,255,255,0.03)' : '#F8FAFC', borderRadius: '12px', border: `1px solid ${border}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <p style={{ fontWeight: 700, color: textMain, fontSize: '0.875rem' }}>{edu.institution}</p>
                        <p style={{ fontSize: '0.8rem', color: textMut }}>{edu.degree} — {edu.major}</p>
                        {/* Bug #7 fix: pakai graduation_year & is_latest dari backend */}
                        <p style={{ fontSize: '0.75rem', color: textMut, marginTop: '0.2rem' }}>IPK: <strong style={{ color: '#FF9B51' }}>{edu.gpa ?? '—'}</strong> · Lulus: {edu.is_latest ? 'Pendidikan Terakhir ✓' : (edu.graduation_year ?? '—')}</p>
                      </div>
                      <div style={{ display: 'flex', gap: '0.375rem' }}>
                        <button onClick={() => openEditEdu(edu)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: textMut, fontSize: '0.875rem' }}><i className="lni lni-pencil-1" /></button>
                        <button onClick={() => handleEduDelete(edu.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', fontSize: '0.875rem' }}><i className="lni lni-trash-3" /></button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {eduModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', backdropFilter: 'blur(4px)' }}>
          <div style={{ background: surface, border: `1px solid ${border}`, borderRadius: '20px', padding: '2rem', width: '100%', maxWidth: '500px', animation: 'fadeInUp 0.25s ease', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontWeight: 800, fontSize: '1.125rem', color: textMain }}>{editEdu ? 'Edit Pendidikan' : 'Tambah Pendidikan'}</h2>
              <button onClick={() => setEduModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: textMut, fontSize: '1.25rem' }}><i className="lni lni-xmark-circle" /></button>
            </div>
            {eduError && <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '8px', padding: '0.75rem', color: '#ef4444', fontSize: '0.875rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><i className="lni lni-info" /> {eduError}</div>}
            <form onSubmit={handleEduSave}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div><label style={labelStyle}>Nama Institusi</label><input style={inputStyle} value={eduForm.institution} onChange={e => setEduForm(p => ({ ...p, institution: e.target.value }))} placeholder="Universitas Indonesia" required onFocus={e => e.target.style.borderColor = '#FF9B51'} onBlur={e => e.target.style.borderColor = border} /></div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div><label style={labelStyle}>Jenjang</label><input style={inputStyle} value={eduForm.degree} onChange={e => setEduForm(p => ({ ...p, degree: e.target.value }))} placeholder="S1" required onFocus={e => e.target.style.borderColor = '#FF9B51'} onBlur={e => e.target.style.borderColor = border} /></div>
                  <div><label style={labelStyle}>IPK (max 4.00)</label><input type="number" step="0.01" min="0" max="4" style={inputStyle} value={eduForm.gpa} onChange={e => setEduForm(p => ({ ...p, gpa: e.target.value }))} placeholder="3.50" required onFocus={e => e.target.style.borderColor = '#FF9B51'} onBlur={e => e.target.style.borderColor = border} /></div>
                </div>
                <div><label style={labelStyle}>Program Studi</label><input style={inputStyle} value={eduForm.major} onChange={e => setEduForm(p => ({ ...p, major: e.target.value }))} placeholder="Teknik Informatika" required onFocus={e => e.target.style.borderColor = '#FF9B51'} onBlur={e => e.target.style.borderColor = border} /></div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div><label style={labelStyle}>Tahun Mulai</label><input type="number" style={inputStyle} value={eduForm.start_year} onChange={e => setEduForm(p => ({ ...p, start_year: e.target.value }))} required onFocus={e => e.target.style.borderColor = '#FF9B51'} onBlur={e => e.target.style.borderColor = border} /></div>
                  <div><label style={labelStyle}>Tahun Lulus</label><input type="number" style={inputStyle} value={eduForm.end_year} onChange={e => setEduForm(p => ({ ...p, end_year: e.target.value }))} disabled={eduForm.is_current} placeholder={eduForm.is_current ? 'Masih kuliah' : ''} onFocus={e => e.target.style.borderColor = '#FF9B51'} onBlur={e => e.target.style.borderColor = border} /></div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <input type="checkbox" id="is_current_edu" checked={eduForm.is_current} onChange={e => setEduForm(p => ({ ...p, is_current: e.target.checked, end_year: e.target.checked ? '' : p.end_year }))} style={{ width: '18px', height: '18px', accentColor: '#FF9B51' }} />
                  <label htmlFor="is_current_edu" style={{ fontSize: '0.875rem', color: textMain, cursor: 'pointer' }}>Masih berlangsung</label>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button type="button" onClick={() => setEduModal(false)} style={{ flex: 1, padding: '0.75rem', background: 'none', border: `1.5px solid ${border}`, borderRadius: '10px', color: textMain, cursor: 'pointer', fontWeight: 600, fontFamily: "'Montserrat', sans-serif" }}>Batal</button>
                  <button type="submit" disabled={eduSaving} style={{ flex: 1, padding: '0.75rem', background: eduSaving ? '#94a3b8' : '#FF9B51', border: 'none', borderRadius: '10px', color: 'white', cursor: eduSaving ? 'not-allowed' : 'pointer', fontWeight: 700, fontFamily: "'Montserrat', sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                    {eduSaving ? <><i className="lni lni-spinner-3" style={{ animation: 'spin 1s linear infinite' }} /> Menyimpan...</> : <><i className="lni lni-floppy-disk-1" /> Simpan</>}
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
