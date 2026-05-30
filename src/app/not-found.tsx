import Link from 'next/link';

export default function NotFound() {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #25343F 0%, #1a2632 60%, #0F1419 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'Montserrat', sans-serif",
      textAlign: 'center', padding: '2rem',
    }}>
      <div>
        <div style={{ fontSize: '6rem', fontWeight: 900, color: '#FF9B51', lineHeight: 1, marginBottom: '1rem' }}>404</div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'white', marginBottom: '0.75rem' }}>Halaman Tidak Ditemukan</h1>
        <p style={{ color: '#8BA3B5', marginBottom: '2rem', maxWidth: '360px' }}>
          Halaman yang Anda cari tidak ada atau sudah dipindahkan.
        </p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/dashboard" style={{ padding: '0.75rem 1.5rem', background: '#FF9B51', borderRadius: '10px', color: 'white', fontWeight: 700, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
            <i className="lni lni-dashboard" /> Dashboard
          </Link>
          <Link href="/" style={{ padding: '0.75rem 1.5rem', border: '1.5px solid rgba(255,255,255,0.2)', borderRadius: '10px', color: 'white', fontWeight: 600, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
            <i className="lni lni-home" /> Beranda
          </Link>
        </div>
      </div>
    </div>
  );
}
