import React, { SelectHTMLAttributes, forwardRef } from 'react';

export interface SelectOption {
  value: string | number;
  label: string;
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  hint?: string;
  error?: string;
  options: SelectOption[];
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, hint, error, id, options, className = '', style, required, ...props }, ref) => {
    const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="form-group" style={style}>
        {label && (
          <label htmlFor={selectId} className="form-label">
            {label} {required && <span style={{ color: 'var(--color-danger)' }}>*</span>}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          required={required}
          className={`select ${className}`.trim()}
          style={{ borderColor: error ? 'var(--color-danger)' : undefined }}
          aria-invalid={!!error}
          aria-describedby={error ? `${selectId}-error` : hint ? `${selectId}-hint` : undefined}
          {...props}
        >
          {options.map((opt) => (
            <option key={String(opt.value)} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {hint && !error && <span id={`${selectId}-hint`} className="form-hint">{hint}</span>}
        {error && <span id={`${selectId}-error`} className="form-error">{error}</span>}
      </div>
    );
  }
);

Select.displayName = 'Select';
