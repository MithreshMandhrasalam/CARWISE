'use client';
import React, { useState, ReactNode } from 'react';

export interface TooltipProps {
  content: string;
  children: ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export function Tooltip({ content, children, position = 'top' }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);

  const getPositionStyles = () => {
    switch (position) {
      case 'bottom':
        return { top: 'calc(100% + 6px)', left: '50%', transform: 'translateX(-50%)' };
      case 'left':
        return { right: 'calc(100% + 6px)', top: '50%', transform: 'translateY(-50%)' };
      case 'right':
        return { left: 'calc(100% + 6px)', top: '50%', transform: 'translateY(-50%)' };
      case 'top':
      default:
        return { bottom: 'calc(100% + 6px)', left: '50%', transform: 'translateX(-50%)' };
    }
  };

  return (
    <span
      style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      onFocus={() => setIsVisible(true)}
      onBlur={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <span
          role="tooltip"
          style={{
            position: 'absolute',
            zIndex: 100,
            padding: '4px 8px',
            background: 'var(--color-surface-elevated)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-xs)',
            fontSize: '0.75rem',
            color: 'var(--color-text-primary)',
            whiteSpace: 'nowrap',
            boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
            pointerEvents: 'none',
            ...getPositionStyles(),
          }}
        >
          {content}
        </span>
      )}
    </span>
  );
}
