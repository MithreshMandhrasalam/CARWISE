import React, { InputHTMLAttributes, forwardRef } from 'react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, hint, error, id, leftIcon, rightIcon, className = '', style, required, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="form-group" style={style}>
        {label && (
          <label htmlFor={inputId} className="form-label">
            {label} {required && <span style={{ color: 'var(--color-danger)' }}>*</span>}
          </label>
        )}
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          {leftIcon && (
            <span style={{ position: 'absolute', left: 12, display: 'flex', alignItems: 'center', color: 'var(--color-text-muted)', pointerEvents: 'none' }}>
              {leftIcon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            required={required}
            className={`input ${className}`.trim()}
            style={{
              paddingLeft: leftIcon ? 38 : 14,
              paddingRight: rightIcon ? 38 : 14,
              borderColor: error ? 'var(--color-danger)' : undefined,
            }}
            aria-invalid={!!error}
            aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
            {...props}
          />
          {rightIcon && (
            <span style={{ position: 'absolute', right: 12, display: 'flex', alignItems: 'center', color: 'var(--color-text-muted)', pointerEvents: 'none' }}>
              {rightIcon}
            </span>
          )}
        </div>
        {hint && !error && <span id={`${inputId}-hint`} className="form-hint">{hint}</span>}
        {error && <span id={`${inputId}-error`} className="form-error">{error}</span>}
      </div>
    );
  }
);

Input.displayName = 'Input';
