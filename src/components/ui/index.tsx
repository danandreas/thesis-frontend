/**
 * components/ui/index.tsx
 * Komponen UI reusable yang dipakai di seluruh aplikasi.
 */

'use client';

import React from 'react';
import { useTheme } from '@/hooks/useTheme';

// ── Loading Spinner ────────────────────────────────────────────
export function LoadingSpinner({ size = '2rem', message = 'Memuat...' }: { size?: string; message?: string }) {
  const { isDark } = useTheme();
  return (
    <div style={{ padding: '3rem', textAlign: 'center', color: isDark ? '#8BA3B5' : '#64748B' }}>
      <i className="lni lni-spinner-3" style={{ fontSize: size, animation: 'spin 1s linear infinite', display: 'block', marginBottom: '0.75rem' }} />
      {message}
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

// ── Empty State ────────────────────────────────────────────────
export function EmptyState({ icon = 'lni-folder-1', title = 'Tidak ada data', desc = '', action }: { icon?: string; title?: string; desc?: string; action?: React.ReactNode }) {
  const { isDark } = useTheme();
  return (
    <div style={{ padding: '3rem', textAlign: 'center', color: isDark ? '#8BA3B5' : '#64748B' }}>
      <i className={`lni ${icon}`} style={{ fontSize: '2.5rem', display: 'block', marginBottom: '0.75rem' }} />
      <p style={{ fontWeight: 600, fontSize: '0.9375rem', marginBottom: '0.375rem', color: isDark ? '#E2EAF0' : '#25343F' }}>{title}</p>
      {desc && <p style={{ fontSize: '0.875rem', maxWidth: '320px', margin: '0 auto 1.25rem' }}>{desc}</p>}
      {action}
    </div>
  );
}

// ── Alert ──────────────────────────────────────────────────────
type AlertType = 'success' | 'error' | 'warning' | 'info';
const alertConfig: Record<AlertType, { bg: string; border: string; color: string; icon: string }> = {
  success: { bg: 'rgba(16,185,129,0.1)',  border: 'rgba(16,185,129,0.2)',  color: '#10b981', icon: 'lni-check-circle-1' },
  error:   { bg: 'rgba(239,68,68,0.1)',   border: 'rgba(239,68,68,0.2)',   color: '#ef4444', icon: 'lni-info' },
  warning: { bg: 'rgba(255,155,81,0.1)',  border: 'rgba(255,155,81,0.2)',  color: '#FF9B51', icon: 'lni-info' },
  info:    { bg: 'rgba(59,130,246,0.1)',  border: 'rgba(59,130,246,0.2)',  color: '#3b82f6', icon: 'lni-info' },
};

export function Alert({ type = 'info', children }: { type?: AlertType; children: React.ReactNode }) {
  const c = alertConfig[type];
  return (
    <div style={{ background: c.bg, border: `1px solid ${c.border}`, borderRadius: '10px', padding: '0.875rem 1rem', color: c.color, fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      <i className={`lni ${c.icon}`} style={{ flexShrink: 0 }} />
      <span>{children}</span>
    </div>
  );
}

// ── Badge ──────────────────────────────────────────────────────
export function Badge({ children, color = 'muted' }: { children: React.ReactNode; color?: 'success' | 'danger' | 'warning' | 'info' | 'muted' | 'primary' }) {
  const colorMap = {
    success: { bg: 'rgba(16,185,129,0.12)',  color: '#10b981' },
    danger:  { bg: 'rgba(239,68,68,0.12)',   color: '#dc2626' },
    warning: { bg: 'rgba(255,155,81,0.15)',  color: '#FF7A1F' },
    info:    { bg: 'rgba(59,130,246,0.12)',  color: '#2563eb' },
    muted:   { bg: 'rgba(100,116,139,0.12)', color: '#64748b' },
    primary: { bg: 'rgba(37,52,63,0.12)',    color: '#25343F' },
  };
  const c = colorMap[color];
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', padding: '0.2rem 0.625rem', borderRadius: '999px', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.05em', background: c.bg, color: c.color }}>
      {children}
    </span>
  );
}

// ── Section Header ─────────────────────────────────────────────
export function SectionHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  const { isDark } = useTheme();
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
      <div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: isDark ? '#E2EAF0' : '#25343F' }}>{title}</h1>
        {subtitle && <p style={{ color: isDark ? '#8BA3B5' : '#64748B', fontSize: '0.875rem', marginTop: '0.125rem' }}>{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

// ── Card ───────────────────────────────────────────────────────
export function Card({ children, padding = '1.5rem', style = {} }: { children: React.ReactNode; padding?: string; style?: React.CSSProperties }) {
  const { isDark } = useTheme();
  return (
    <div style={{
      background: isDark ? '#1A2332' : '#ffffff',
      border: `1px solid ${isDark ? '#2A3A4A' : '#E2E8F0'}`,
      borderRadius: '16px', padding, ...style,
    }}>
      {children}
    </div>
  );
}
