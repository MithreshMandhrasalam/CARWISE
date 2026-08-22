import React from 'react';
import { Check } from 'lucide-react';

export interface LinearProgressProps {
  value: number; // 0 to 100
  max?: number;
  label?: string;
  showPercent?: boolean;
  color?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function LinearProgress({
  value,
  max = 100,
  label,
  showPercent = true,
  color = 'var(--color-primary)',
  size = 'md',
}: LinearProgressProps) {
  const percentage = Math.min(Math.max(Math.round((value / max) * 100), 0), 100);
  const height = size === 'sm' ? 6 : size === 'lg' ? 12 : 8;

  return (
    <div style={{ width: '100%' }}>
      {(label || showPercent) && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6, fontSize: '0.8125rem' }}>
          {label && <span style={{ fontWeight: 600, color: 'var(--color-text-secondary)' }}>{label}</span>}
          {showPercent && <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--color-text-primary)' }}>{percentage}%</span>}
        </div>
      )}
      <div
        role="progressbar"
        aria-valuenow={percentage}
        aria-valuemin={0}
        aria-valuemax={100}
        style={{
          width: '100%',
          height,
          background: 'var(--color-surface-elevated)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-full)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${percentage}%`,
            height: '100%',
            background: color,
            borderRadius: 'var(--radius-full)',
            transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        />
      </div>
    </div>
  );
}

export interface Step {
  number: number;
  title: string;
  description?: string;
}

export interface StepperProps {
  steps: Step[];
  currentStep: number;
  onStepClick?: (stepNumber: number) => void;
}

export function StepperProgress({ steps, currentStep, onStepClick }: StepperProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', position: 'relative' }}>
      {steps.map((step, idx) => {
        const isCompleted = step.number < currentStep;
        const isCurrent = step.number === currentStep;
        const isClickable = onStepClick && step.number < currentStep;

        return (
          <React.Fragment key={step.number}>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                zIndex: 2,
                cursor: isClickable ? 'pointer' : 'default',
              }}
              onClick={() => isClickable && onStepClick(step.number)}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 'var(--radius-full)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '0.875rem',
                  transition: 'all var(--transition-fast)',
                  background: isCompleted
                    ? 'var(--color-success)'
                    : isCurrent
                    ? 'linear-gradient(135deg, var(--color-primary), var(--color-accent))'
                    : 'var(--color-surface-elevated)',
                  color: isCompleted || isCurrent ? '#FFFFFF' : 'var(--color-text-muted)',
                  border: isCurrent
                    ? '2px solid var(--color-primary-light)'
                    : isCompleted
                    ? '2px solid var(--color-success)'
                    : '1px solid var(--color-border)',
                  boxShadow: isCurrent ? '0 0 12px var(--color-primary-glow)' : 'none',
                }}
              >
                {isCompleted ? <Check size={18} strokeWidth={3} /> : step.number}
              </div>
              <span
                style={{
                  marginTop: 6,
                  fontSize: '0.8125rem',
                  fontWeight: isCurrent ? 700 : 500,
                  color: isCurrent ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
                  whiteSpace: 'nowrap',
                }}
              >
                {step.title}
              </span>
            </div>

            {idx < steps.length - 1 && (
              <div
                style={{
                  flex: 1,
                  height: 2,
                  margin: '0 8px',
                  marginBottom: 22,
                  background: step.number < currentStep ? 'var(--color-success)' : 'var(--color-border)',
                  transition: 'background var(--transition-normal)',
                  zIndex: 1,
                }}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
