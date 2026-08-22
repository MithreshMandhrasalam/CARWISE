import Link from 'next/link';
import { Shield, ExternalLink } from 'lucide-react';

export default function Footer() {
  return (
    <footer
      style={{
        borderTop: '1px solid var(--color-border)',
        background: 'var(--color-surface)',
        padding: 'var(--space-12) 0 var(--space-8)',
        marginTop: 'auto',
        color: 'var(--color-text-secondary)',
        fontSize: '0.875rem',
      }}
    >
      <div className="container">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--space-8)', marginBottom: 'var(--space-10)' }}>
          {/* Col 1: Brand & Purpose */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 'var(--space-3)' }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: 'linear-gradient(135deg, var(--color-primary), var(--color-accent))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Shield size={16} color="#FFF" />
              </div>
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.1rem', color: 'var(--color-text-primary)' }}>
                CAR<span style={{ color: 'var(--color-accent)' }}>WISE</span>
              </span>
            </div>
            <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', lineHeight: 1.6, maxWidth: 320 }}>
              Car Assessment & Risk With Intelligent Safety & Evidence. An AI-assisted decision-support platform for used-car buyers.
            </p>
            <div style={{ marginTop: 'var(--space-3)', fontStyle: 'italic', fontSize: '0.8125rem', color: 'var(--color-primary-light)' }}>
              &ldquo;See the Evidence. Know the Risk. Buy Wiser.&rdquo;
            </div>
          </div>

          {/* Col 2: Navigation Links */}
          <div>
            <h4 style={{ fontWeight: 700, fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-primary)', marginBottom: 'var(--space-3)' }}>
              Navigation
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <Link href="/" style={{ color: 'var(--color-text-secondary)', textDecoration: 'none' }}>Home</Link>
              <Link href="/dashboard" style={{ color: 'var(--color-text-secondary)', textDecoration: 'none' }}>Dashboard</Link>
              <Link href="/inspect" style={{ color: 'var(--color-text-secondary)', textDecoration: 'none' }}>New Inspection Wizard</Link>
              <Link href="/history" style={{ color: 'var(--color-text-secondary)', textDecoration: 'none' }}>Inspection History</Link>
            </div>
          </div>

          {/* Col 3: Academic & Safety Disclaimer */}
          <div style={{ gridColumn: 'span 1' }}>
            <h4 style={{ fontWeight: 700, fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-primary)', marginBottom: 'var(--space-3)' }}>
              Academic & Safety Notice
            </h4>
            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
              ⚠️ CARWISE is an analytical decision-support tool. It evaluates visible exterior evidence and provides prioritized inspection advice. It does <strong>not</strong> guarantee mechanical condition and cannot substitute for a professional hands-on inspection.
            </p>
          </div>
        </div>

        {/* Bottom Bar */}
        <div
          style={{
            paddingTop: 'var(--space-6)',
            borderTop: '1px solid var(--color-border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12,
            fontSize: '0.75rem',
            color: 'var(--color-text-muted)',
          }}
        >
          <span>© 2026 CARWISE — Final Year CSE Project (Software Only)</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span>Phase 2: Frontend Design System Baseline</span>
          </span>
        </div>
      </div>
    </footer>
  );
}
