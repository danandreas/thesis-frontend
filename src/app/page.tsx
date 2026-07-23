'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

const features = [
  {
    icon: 'lni lni-bulb-2',
    title: 'ML-Enhanced Scoring',
    desc: 'Algoritma PSO dan EWM mengoptimasi bobot kriteria secara objektif berdasarkan data aktual kandidat.',
  },
  {
    icon: 'lni lni-bar-chart-4',
    title: 'Fuzzy-ELECTRE Ranking',
    desc: 'Metode Fuzzy Logic dikombinasikan ELECTRE menghasilkan ranking kandidat yang adil dan transparan.',
  },
  {
    icon: 'lni lni-user-multiple-4',
    title: 'Human-in-the-Loop',
    desc: 'Admin membandingkan ranking manual vs ML dan memilih keputusan terbaik dengan kontrol penuh.',
  },
  {
    icon: 'lni lni-shield-2',
    title: 'Asesmen Tersamar',
    desc: 'Form Likert dirancang agar kandidat tidak mengetahui kriteria apa yang sedang diukur.',
  },
  {
    icon: 'lni lni-dashboard-square-1',
    title: 'Dashboard Analitik',
    desc: 'Visualisasi perbandingan bobot, distribusi skor, dan spearman correlation antar metode.',
  },
  {
    icon: 'lni lni-check-circle-1',
    title: 'Multi-Posisi',
    desc: 'Satu batch rekrutmen dapat membuka beberapa posisi dengan profil kriteria berbeda.',
  },
];

const steps = [
  { num: '01', title: 'Admin Setup', desc: 'Buat rekrutmen, posisi, bobot kriteria, dan form asesmen Likert.' },
  { num: '02', title: 'Kandidat Daftar', desc: 'Kandidat mendaftar, mengisi form asesmen dan melampirkan syarat dokumen.' },
  { num: '03', title: 'Verifikasi', desc: 'Admin memverifikasi dokumen dan mengkonfirmasi nilai IPK/TOEFL/sertifikat.' },
  { num: '04', title: 'Generate Ranking', desc: 'Sistem menjalankan Fuzzy → EWM → PSO → ELECTRE secara otomatis.' },
  { num: '05', title: 'Pilih Versi', desc: 'Admin membandingkan ranking manual vs ML dan memilih yang digunakan.' },
  { num: '06', title: 'Keputusan Final', desc: 'Admin menetapkan kandidat diterima/ditolak dan notifikasi dikirim.' },
];

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  return (
    <div style={{ fontFamily: "'Montserrat', sans-serif", background: '#F5F7FA', color: '#25343F', minHeight: '100vh' }}>

      {/* ── NAVBAR ── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        padding: '0 2rem',
        height: '64px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: scrolled ? 'rgba(255,255,255,0.95)' : 'transparent',
        backdropFilter: scrolled ? 'blur(12px)' : 'none',
        borderBottom: scrolled ? '1px solid #E2E8F0' : 'none',
        transition: 'all 0.3s ease',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
          <div style={{
            width: '36px', height: '36px', borderRadius: '10px',
            background: 'linear-gradient(135deg, #25343F 0%, #FF9B51 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 800, color: 'white', fontSize: '0.8rem', letterSpacing: '-0.02em',
          }}>PsP</div>
          <span style={{ fontWeight: 700, fontSize: '1.1rem', color: '#25343F' }}>Psychoposition</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Link href="/login" style={{
            padding: '0.5rem 1.25rem', borderRadius: '8px',
            border: '1.5px solid #25343F', color: '#25343F',
            fontWeight: 600, fontSize: '0.875rem', textDecoration: 'none',
            transition: 'all 0.2s',
          }}>Masuk</Link>
          <Link href="/register" style={{
            padding: '0.5rem 1.25rem', borderRadius: '8px',
            background: '#FF9B51', color: 'white',
            fontWeight: 600, fontSize: '0.875rem', textDecoration: 'none',
            transition: 'all 0.2s',
          }}>Daftar</Link>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #25343F 0%, #1a2632 50%, #0F1419 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        textAlign: 'center', padding: '6rem 2rem 4rem',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Decorative circles */}
        <div style={{ position: 'absolute', top: '10%', left: '5%', width: '300px', height: '300px', borderRadius: '50%', background: 'rgba(255,155,81,0.06)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '10%', right: '5%', width: '200px', height: '200px', borderRadius: '50%', background: 'rgba(255,155,81,0.04)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: '600px', height: '600px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,155,81,0.05) 0%, transparent 70%)', pointerEvents: 'none' }} />

        <div style={{ position: 'relative', maxWidth: '800px' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
            padding: '0.375rem 1rem', borderRadius: '999px',
            background: 'rgba(255,155,81,0.15)', border: '1px solid rgba(255,155,81,0.3)',
            marginBottom: '1.5rem',
          }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#FF9B51', display: 'block' }} />
            <span style={{ color: '#FF9B51', fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.06em' }}>
              ML-ENHANCED FUZZY-ELECTRE
            </span>
          </div>

          <h1 style={{
            fontSize: 'clamp(2.5rem, 6vw, 4.5rem)',
            fontWeight: 900, color: 'white',
            lineHeight: 1.1, marginBottom: '1.5rem',
            letterSpacing: '-0.03em',
          }}>
            Seleksi Kandidat<br />
            <span style={{ color: '#FF9B51' }}>Lebih Cerdas</span>
          </h1>

          <p style={{
            fontSize: '1.125rem', color: '#8BA3B5',
            lineHeight: 1.7, marginBottom: '2.5rem', maxWidth: '600px', margin: '0 auto 2.5rem',
          }}>
            Psychoposition adalah sistem rekomendasi penempatan karyawan berbasis
            Machine Learning yang menggabungkan Fuzzy Logic, EWM, PSO, dan ELECTRE
            untuk menghasilkan ranking kandidat yang adil, transparan, dan optimal.
          </p>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/register" style={{
              padding: '0.875rem 2rem', borderRadius: '12px',
              background: '#FF9B51', color: 'white',
              fontWeight: 700, fontSize: '1rem', textDecoration: 'none',
              boxShadow: '0 8px 24px rgba(255,155,81,0.4)',
              transition: 'all 0.2s',
            }}>
              Daftar Sekarang <i className="lni lni-arrow-right" style={{ marginLeft: '0.5rem' }} />
            </Link>
            <Link href="/login" style={{
              padding: '0.875rem 2rem', borderRadius: '12px',
              border: '1.5px solid rgba(255,255,255,0.2)', color: 'white',
              fontWeight: 600, fontSize: '1rem', textDecoration: 'none',
              transition: 'all 0.2s',
            }}>
              Sudah Punya Akun
            </Link>
          </div>

          {/* Stats */}
          <div style={{ display: 'flex', gap: '2.5rem', justifyContent: 'center', marginTop: '4rem', flexWrap: 'wrap' }}>
            {[['10', 'Kriteria Penilaian'], ['3', 'Algoritma ML'], ['2', 'Versi Ranking']].map(([num, label]) => (
              <div key={label} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', fontWeight: 900, color: '#FF9B51' }}>{num}</div>
                <div style={{ fontSize: '0.75rem', color: '#8BA3B5', fontWeight: 500 }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section style={{ padding: '5rem 2rem', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#FF9B51', letterSpacing: '0.1em', marginBottom: '0.75rem' }}>
            FITUR UTAMA
          </div>
          <h2 style={{ fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', fontWeight: 800, color: '#25343F', letterSpacing: '-0.02em' }}>
            Mengapa Psychoposition?
          </h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
          {features.map((f, i) => (
            <div key={i} style={{
              background: 'white', borderRadius: '16px', padding: '1.75rem',
              border: '1px solid #E2E8F0',
              transition: 'transform 0.2s, box-shadow 0.2s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-4px)'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 12px 32px rgba(37,52,63,0.12)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = ''; (e.currentTarget as HTMLDivElement).style.boxShadow = ''; }}
            >
              <div style={{
                width: '48px', height: '48px', borderRadius: '12px',
                background: 'rgba(255,155,81,0.1)', display: 'flex',
                alignItems: 'center', justifyContent: 'center', marginBottom: '1rem',
              }}>
                <i className={f.icon} style={{ fontSize: '1.375rem', color: '#FF9B51' }} />
              </div>
              <h3 style={{ fontWeight: 700, marginBottom: '0.5rem', fontSize: '1rem' }}>{f.title}</h3>
              <p style={{ fontSize: '0.875rem', color: '#64748B', lineHeight: 1.6 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section style={{ padding: '5rem 2rem', background: 'white' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#FF9B51', letterSpacing: '0.1em', marginBottom: '0.75rem' }}>ALUR SISTEM</div>
            <h2 style={{ fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', fontWeight: 800, color: '#25343F', letterSpacing: '-0.02em' }}>
              Bagaimana Cara Kerjanya?
            </h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
            {steps.map((s, i) => (
              <div key={i} style={{ display: 'flex', gap: '1rem', padding: '1.25rem', borderRadius: '12px', background: '#F5F7FA' }}>
                <div style={{
                  flexShrink: 0, width: '40px', height: '40px',
                  borderRadius: '10px', background: '#25343F',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#FF9B51', fontWeight: 800, fontSize: '0.8rem',
                }}>{s.num}</div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.25rem' }}>{s.title}</div>
                  <div style={{ fontSize: '0.8rem', color: '#64748B', lineHeight: 1.6 }}>{s.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{
        padding: '5rem 2rem',
        background: 'linear-gradient(135deg, #25343F 0%, #1a2632 100%)',
        textAlign: 'center',
      }}>
        <h2 style={{ fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', fontWeight: 800, color: 'white', marginBottom: '1rem', letterSpacing: '-0.02em' }}>
          Siap Memulai Seleksi?
        </h2>
        <p style={{ color: '#8BA3B5', marginBottom: '2rem', fontSize: '1rem' }}>
          Daftar sebagai kandidat dan ikuti proses seleksi yang transparan.
        </p>
        <Link href="/register" style={{
          display: 'inline-block', padding: '0.875rem 2.5rem', borderRadius: '12px',
          background: '#FF9B51', color: 'white', fontWeight: 700, fontSize: '1rem',
          textDecoration: 'none', boxShadow: '0 8px 24px rgba(255,155,81,0.4)',
        }}>
          Daftar Sekarang
        </Link>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{
        background: '#0F1419', color: '#8BA3B5',
        textAlign: 'center', padding: '1.5rem 2rem',
        fontSize: '0.8rem',
      }}>
        © {new Date().getFullYear()} Psychoposition — Sistem Seleksi Kandidat Berbasis ML-Enhanced Fuzzy-ELECTRE. All rights reserved.
      </footer>
    </div>
  );
}
