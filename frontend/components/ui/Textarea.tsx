import React, { TextareaHTMLAttributes, forwardRef } from 'react';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  hint?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, hint, error, id, className = '', style, required, rows = 3, ...props }, ref) => {
    const areaId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="form-group" style={style}>
        {label && (
          <label htmlFor={areaId} className="form-label">
            {label} {required && <span style={{ color: 'var(--color-danger)' }}>*</span>}
          </label>
        )}
        <textarea
          ref={ref}
          id={areaId}
          rows={rows}
          required={required}
          className={`textarea ${className}`.trim()}
          style={{ borderColor: error ? 'var(--color-danger)' : undefined, resize: 'vertical' }}
          aria-invalid={!!error}
          aria-describedby={error ? `${areaId}-error` : hint ? `${areaId}-hint` : undefined}
          {...props}
        />
        {hint && !error && <span id={`${areaId}-hint`} className="form-hint">{hint}</span>}
        {error && <span id={`${areaId}-error`} className="form-error">{error}</span>}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
