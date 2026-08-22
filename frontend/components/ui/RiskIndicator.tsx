import React from 'react';
import { ShieldCheck, ShieldAlert, AlertTriangle, XCircle, HelpCircle } from 'lucide-react';
import { TrustBand } from '@/lib/types';

export interface RiskIndicatorProps {
  trustBand?: TrustBand;
  customLabel?: string;
  size?: 'sm' | 'md';
}

export function RiskIndicator({ trustBand, customLabel, size = 'md' }: RiskIndicatorProps) {
  const getConfig = () => {
    switch (trustBand) {
      case 'HIGH_CONFIDENCE':
        return {
          label: customLabel || 'High Confidence Assessment',
          bg: 'var(--color-success-bg)',
          border: 'var(--color-success-border)',
          color: 'var(--color-success-text)',
          icon: <ShieldCheck size={size === 'sm' ? 14 : 16} />,
        };
      case 'MODERATE_CONFIDENCE':
        return {
          label: customLabel || 'Moderate Confidence',
          bg: 'var(--color-info-bg)',
          border: 'var(--color-info-border)',
          color: 'var(--color-info-text)',
          icon: <ShieldAlert size={size === 'sm' ? 14 : 16} />,
        };
      case 'PROCEED_WITH_CAUTION':
        return {
          label: customLabel || 'Proceed With Caution',
          bg: 'var(--color-warning-bg)',
          border: 'var(--color-warning-border)',
          color: 'var(--color-warning-text)',
          icon: <AlertTriangle size={size === 'sm' ? 14 : 16} />,
        };
      case 'INSUFFICIENT_EVIDENCE':
      default:
        return {
          label: customLabel || 'Insufficient Evidence / High Risk',
          bg: 'var(--color-danger-bg)',
          border: 'var(--color-danger-border)',
          color: 'var(--color-danger-text)',
          icon: <XCircle size={size === 'sm' ? 14 : 16} />,
        };
    }
  };

  const config = getConfig();

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: size === 'sm' ? '3px 10px' : '5px 14px',
        borderRadius: 'var(--radius-full)',
        background: config.bg,
        border: `1px solid ${config.border}`,
        color: config.color,
        fontSize: size === 'sm' ? '0.75rem' : '0.8125rem',
        fontWeight: 600,
        letterSpacing: '0.02em',
      }}
    >
      {config.icon}
      <span>{config.label}</span>
    </div>
  );
}

export function StatusIndicator({
  status,
  label,
}: {
  status: 'PASS' | 'WARN' | 'FAIL' | 'PENDING';
  label?: string;
}) {
  const getStyle = () => {
    switch (status) {
      case 'PASS':
        return { bg: 'var(--color-success-bg)', border: 'var(--color-success-border)', color: 'var(--color-success-text)', text: label || 'Passed' };
      case 'WARN':
        return { bg: 'var(--color-warning-bg)', border: 'var(--color-warning-border)', color: 'var(--color-warning-text)', text: label || 'Warning' };
      case 'FAIL':
        return { bg: 'var(--color-danger-bg)', border: 'var(--color-danger-border)', color: 'var(--color-danger-text)', text: label || 'Failed' };
      case 'PENDING':
      default:
        return { bg: 'var(--color-surface-elevated)', border: 'var(--color-border)', color: 'var(--color-text-muted)', text: label || 'Pending' };
    }
  };

  const s = getStyle();

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        padding: '2px 8px',
        borderRadius: 'var(--radius-xs)',
        background: s.bg,
        border: `1px solid ${s.border}`,
        color: s.color,
        fontSize: '0.75rem',
        fontWeight: 600,
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: s.color,
          display: 'inline-block',
        }}
      />
      {s.text}
    </span>
  );
}
