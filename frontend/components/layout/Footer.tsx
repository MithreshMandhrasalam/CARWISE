import Link from 'next/link';
import { Shield } from 'lucide-react';

export default function Footer() {
  return (
    <footer style={{
      borderTop: '1px solid var(--color-border)',
      padding: 'var(--space-8) 0',
      marginTop: 'auto',
      color: 'var(--color-text-muted)',
      fontSize: '0.875rem',
    }}>
      <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Shield size={14} color="var(--color-primary-light)" />
          <span>AutoTrustAI — Final Year CSE Project</span>
        </div>
        <p style={{ textAlign: 'center', maxWidth: 600, fontSize: '0.75rem' }}>
          ⚠️ This is an AI decision-support tool and does not replace a professional mechanical inspection.
          Always physically inspect any vehicle before purchase.
        </p>
        <div style={{ display: 'flex', gap: 16 }}>
          <Link href="/" style={{ color: 'var(--color-text-muted)' }}>Home</Link>
          <Link href="/inspect" style={{ color: 'var(--color-text-muted)' }}>Inspect</Link>
          <Link href="/dashboard" style={{ color: 'var(--color-text-muted)' }}>Dashboard</Link>
        </div>
      </div>
    </footer>
  );
}
