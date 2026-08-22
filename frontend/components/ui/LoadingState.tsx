import React from 'react';
import { Loader2 } from 'lucide-react';

export function Spinner({ size = 24, color = 'var(--color-primary-light)' }: { size?: number; color?: string }) {
  return <Loader2 size={size} color={color} className="animate-spin" />;
}

export function LoadingCard({ title = 'Processing inspection data...' }: { title?: string }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--space-12) var(--space-6)',
        textAlign: 'center',
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)',
      }}
    >
      <Spinner size={36} />
      <p style={{ marginTop: 'var(--space-4)', fontWeight: 600, color: 'var(--color-text-primary)' }}>{title}</p>
      <p style={{ marginTop: 'var(--space-1)', fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
        Evaluating visual evidence and compiling assessment findings...
      </p>
    </div>
  );
}

export function Skeleton({
  width = '100%',
  height = 20,
  borderRadius = 'var(--radius-sm)',
  style,
}: {
  width?: string | number;
  height?: string | number;
  borderRadius?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className="animate-pulse"
      style={{
        width,
        height,
        borderRadius,
        background: 'var(--color-surface-elevated)',
        border: '1px solid var(--color-border-subtle)',
        ...style,
      }}
    />
  );
}
