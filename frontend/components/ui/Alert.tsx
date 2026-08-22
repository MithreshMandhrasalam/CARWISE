import React, { ReactNode } from 'react';
import { AlertCircle, CheckCircle2, Info, AlertTriangle, X } from 'lucide-react';

export interface AlertProps {
  variant?: 'info' | 'success' | 'warning' | 'danger';
  title?: string;
  children: ReactNode;
  onClose?: () => void;
  className?: string;
  style?: React.CSSProperties;
}

export function Alert({
  variant = 'info',
  title,
  children,
  onClose,
  className = '',
  style,
}: AlertProps) {
  const getIcon = () => {
    switch (variant) {
      case 'success':
        return <CheckCircle2 size={18} color="var(--color-success-text)" />;
      case 'warning':
        return <AlertTriangle size={18} color="var(--color-warning-text)" />;
      case 'danger':
        return <AlertCircle size={18} color="var(--color-danger-text)" />;
      case 'info':
      default:
        return <Info size={18} color="var(--color-info-text)" />;
    }
  };

  const getBorderColor = () => {
    switch (variant) {
      case 'success': return 'var(--color-success-border)';
      case 'warning': return 'var(--color-warning-border)';
      case 'danger': return 'var(--color-danger-border)';
      case 'info': default: return 'var(--color-info-border)';
    }
  };

  const getBgColor = () => {
    switch (variant) {
      case 'success': return 'var(--color-success-bg)';
      case 'warning': return 'var(--color-warning-bg)';
      case 'danger': return 'var(--color-danger-bg)';
      case 'info': default: return 'var(--color-info-bg)';
    }
  };

  return (
    <div
      role="alert"
      className={className}
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 'var(--space-3)',
        padding: 'var(--space-4)',
        borderRadius: 'var(--radius-md)',
        background: getBgColor(),
        border: `1px solid ${getBorderColor()}`,
        ...style,
      }}
    >
      <div style={{ flexShrink: 0, marginTop: 2 }}>{getIcon()}</div>
      <div style={{ flex: 1 }}>
        {title && (
          <div style={{ fontWeight: 600, fontSize: '0.9375rem', marginBottom: 4, color: 'var(--color-text-primary)' }}>
            {title}
          </div>
        )}
        <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
          {children}
        </div>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          aria-label="Close alert"
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--color-text-muted)',
            cursor: 'pointer',
            padding: 2,
            borderRadius: 'var(--radius-xs)',
          }}
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
}
