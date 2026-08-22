import React from 'react';
import { Shield, Sparkles, Eye, AlertCircle } from 'lucide-react';

export interface ScoreIndicatorProps {
  type: 'condition' | 'trust' | 'evidence';
  score?: number | null; // 0 to 100 or 0 to 1 for evidence
  label?: string;
  subLabel?: string;
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  isUnavailable?: boolean;
  unavailableReason?: string;
}

export function ScoreIndicator({
  type,
  score,
  label,
  subLabel,
  size = 'md',
  isLoading = false,
  isUnavailable = false,
  unavailableReason,
}: ScoreIndicatorProps) {
  // Normalize score to 0-100
  const normalizedScore =
    score == null
      ? 0
      : type === 'evidence' && score <= 1
      ? Math.round(score * 100)
      : Math.round(score);

  const getScoreColor = () => {
    if (isUnavailable || score == null) return 'var(--color-text-muted)';
    if (normalizedScore >= 80) return 'var(--color-success)';
    if (normalizedScore >= 60) return 'var(--color-warning)';
    return 'var(--color-danger)';
  };

  const getScoreBg = () => {
    if (isUnavailable || score == null) return 'rgba(94, 106, 130, 0.1)';
    if (normalizedScore >= 80) return 'var(--color-success-bg)';
    if (normalizedScore >= 60) return 'var(--color-warning-bg)';
    return 'var(--color-danger-bg)';
  };

  const getDefaultIcon = () => {
    switch (type) {
      case 'trust':
        return <Shield size={size === 'lg' ? 22 : 16} color={getScoreColor()} />;
      case 'condition':
        return <Sparkles size={size === 'lg' ? 22 : 16} color={getScoreColor()} />;
      case 'evidence':
        return <Eye size={size === 'lg' ? 22 : 16} color={getScoreColor()} />;
    }
  };

  const getDefaultLabel = () => {
    switch (type) {
      case 'trust': return 'Assessment Trust Score';
      case 'condition': return 'Vehicle Condition Score';
      case 'evidence': return 'Evidence Completeness';
    }
  };

  const gaugeRadius = size === 'lg' ? 44 : size === 'sm' ? 24 : 34;
  const strokeWidth = size === 'lg' ? 8 : size === 'sm' ? 4 : 6;
  const circumference = 2 * Math.PI * gaugeRadius;
  const strokeDashoffset = isUnavailable || score == null ? circumference : circumference - (normalizedScore / 100) * circumference;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: size === 'lg' ? 'var(--space-5)' : 'var(--space-4)',
        padding: size === 'lg' ? 'var(--space-5)' : 'var(--space-4)',
        background: 'var(--color-surface-elevated)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)',
      }}
    >
      {/* Circular Gauge */}
      <div style={{ position: 'relative', width: (gaugeRadius + strokeWidth) * 2, height: (gaugeRadius + strokeWidth) * 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg
          width={(gaugeRadius + strokeWidth) * 2}
          height={(gaugeRadius + strokeWidth) * 2}
          style={{ transform: 'rotate(-90deg)' }}
        >
          <circle
            cx={gaugeRadius + strokeWidth}
            cy={gaugeRadius + strokeWidth}
            r={gaugeRadius}
            fill="transparent"
            stroke="var(--color-border)"
            strokeWidth={strokeWidth}
          />
          {!isUnavailable && !isLoading && score != null && (
            <circle
              cx={gaugeRadius + strokeWidth}
              cy={gaugeRadius + strokeWidth}
              r={gaugeRadius}
              fill="transparent"
              stroke={getScoreColor()}
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              style={{ transition: 'stroke-dashoffset 0.8s cubic-bezier(0.16, 1, 0.3, 1)' }}
            />
          )}
        </svg>

        <div style={{ position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          {isLoading ? (
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>...</span>
          ) : isUnavailable || score == null ? (
            <span style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>N/A</span>
          ) : (
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: size === 'lg' ? '1.5rem' : size === 'sm' ? '0.9rem' : '1.15rem', color: 'var(--color-text-primary)' }}>
              {normalizedScore}
            </span>
          )}
        </div>
      </div>

      {/* Label and Explanations */}
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {getDefaultIcon()}
          <span style={{ fontWeight: 700, fontSize: size === 'lg' ? '1rem' : '0.875rem', color: 'var(--color-text-primary)' }}>
            {label || getDefaultLabel()}
          </span>
        </div>
        {subLabel && (
          <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', marginTop: 2 }}>
            {subLabel}
          </p>
        )}
        {isUnavailable && unavailableReason && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4, fontSize: '0.75rem', color: 'var(--color-warning-text)' }}>
            <AlertCircle size={12} />
            <span>{unavailableReason}</span>
          </div>
        )}
      </div>
    </div>
  );
}
