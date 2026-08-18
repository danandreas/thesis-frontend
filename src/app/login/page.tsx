'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { loginUser, isAdmin } from '@/lib/auth';
import { getErrorMessage } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await loginUser(email, password);
      // Redirect berdasarkan role
      if (user.role.code === 'admin') {
        router.push('/dashboard');
      } else {
        router.push('/dashboard');
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #25343F 0%, #1a2632 60%, #0F1419 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'Montserrat', sans-serif",
      padding: '2rem',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Background decoration */}
      <div style={{ position: 'absolute', top: '-100px', right: '-100px', width: '400px', height: '400px', borderRadius: '50%', background: 'rgba(255,155,81,0.05)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '-100px', left: '-100px', width: '300px', height: '300px', borderRadius: '50%', background: 'rgba(255,155,81,0.03)', pointerEvents: 'none' }} />

      <div style={{
        width: '100%', maxWidth: '440px',
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '20px',
        padding: '2.5rem',
        backdropFilter: 'blur(20px)',
        position: 'relative',
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <Link href="/" style={{ textDecoration: 'none', display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '56px', height: '56px', borderRadius: '16px',
              background: 'linear-gradient(135deg, #FF9B51 0%, #FF7A1F 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 800, color: 'white', fontSize: '1rem', letterSpacing: '-0.02em',
              boxShadow: '0 8px 24px rgba(255,155,81,0.4)',
            }}>PsP</div>
            <div style={{ color: 'white', fontWeight: 700, fontSize: '0.95rem', lineHeight: 0.88, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ display: 'block' }}>Psycho</span>
              <span style={{ display: 'block' }}>position</span>
            </div>
          </Link>
          <p style={{ color: '#8BA3B5', fontSize: '0.875rem', marginTop: '0.5rem' }}>
            Masuk ke akun Anda
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {error && (
            <div style={{
              background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.2)',
              borderRadius: '10px', padding: '0.875rem 1rem', marginBottom: '1.25rem',
              color: '#fca5a5', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem',
            }}>
              <i className="lni lni-info" /> {error}
            </div>
          )}

          <div style={{ marginBottom: '1.125rem' }}>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#8BA3B5', marginBottom: '0.375rem', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              Email
            </label>
            <div style={{ position: 'relative' }}>
              <i className="lni lni-envelope-1" style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: '#8BA3B5', fontSize: '1rem' }} />
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="contoh@email.com"
                required
                style={{
                  width: '100%', padding: '0.75rem 0.875rem 0.75rem 2.75rem',
                  background: 'rgba(255,255,255,0.06)',
                  border: '1.5px solid rgba(255,255,255,0.1)',
                  borderRadius: '10px', color: 'white', fontSize: '0.875rem',
                  fontFamily: "'Montserrat', sans-serif", outline: 'none',
                  transition: 'border-color 0.2s',
                  boxSizing: 'border-box',
                }}
                onFocus={e => e.target.style.borderColor = '#FF9B51'}
                onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
              />
            </div>
          </div>

          <div style={{ marginBottom: '1.75rem' }}>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#8BA3B5', marginBottom: '0.375rem', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <i className="lni lni-locked-1" style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: '#8BA3B5', fontSize: '1rem' }} />
              <input
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                style={{
                  width: '100%', padding: '0.75rem 2.75rem 0.75rem 2.75rem',
                  background: 'rgba(255,255,255,0.06)',
                  border: '1.5px solid rgba(255,255,255,0.1)',
                  borderRadius: '10px', color: 'white', fontSize: '0.875rem',
                  fontFamily: "'Montserrat', sans-serif", outline: 'none',
                  transition: 'border-color 0.2s', boxSizing: 'border-box',
                }}
                onFocus={e => e.target.style.borderColor = '#FF9B51'}
                onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
              />
              <button type="button" onClick={() => setShowPass(!showPass)} style={{
                position: 'absolute', right: '0.875rem', top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', cursor: 'pointer', color: '#8BA3B5', padding: '0',
              }}>
                <i className={`lni ${showPass ? 'lni-eye' : 'lni-eye'}`} />
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading} style={{
            width: '100%', padding: '0.875rem',
            background: loading ? '#94a3b8' : 'linear-gradient(135deg, #FF9B51 0%, #FF7A1F 100%)',
            border: 'none', borderRadius: '10px',
            color: 'white', fontWeight: 700, fontSize: '0.9375rem',
            fontFamily: "'Montserrat', sans-serif",
            cursor: loading ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s',
            boxShadow: loading ? 'none' : '0 4px 16px rgba(255,155,81,0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
          }}>
            {loading ? (
              <><i className="lni lni-spinner-3" style={{ animation: 'spin 1s linear infinite' }} /> Memproses...</>
            ) : (
              <><i className="lni lni-enter" /> Masuk</>
            )}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '1.5rem', color: '#8BA3B5', fontSize: '0.875rem' }}>
          Belum punya akun?{' '}
          <Link href="/register" style={{ color: '#FF9B51', fontWeight: 600, textDecoration: 'none' }}>
            Daftar di sini
          </Link>
        </p>

        <div style={{ marginTop: '1rem', textAlign: 'center' }}>
          <Link href="/" style={{ color: '#64748B', fontSize: '0.8rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.375rem' }}>
            <i className="lni lni-arrow-left" /> Kembali ke Beranda
          </Link>
        </div>
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
