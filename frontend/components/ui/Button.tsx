import React, { ButtonHTMLAttributes, forwardRef } from 'react';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      loading = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      disabled,
      className = '',
      style,
      ...props
    },
    ref
  ) => {
    const isSpinning = isLoading || loading;
    const variantClass = `btn-${variant}`;
    const sizeClass = size !== 'md' ? `btn-${size}` : '';
    const fullClass = fullWidth ? 'btn-full' : '';

    return (
      <button
        ref={ref}
        disabled={disabled || isSpinning}
        className={`btn ${variantClass} ${sizeClass} ${fullClass} ${className}`.trim()}
        style={style}
        {...props}
      >
        {isSpinning && <Loader2 size={16} className="animate-spin" style={{ marginRight: 6 }} />}
        {!isSpinning && leftIcon && <span style={{ marginRight: 6, display: 'inline-flex' }}>{leftIcon}</span>}
        <span>{children}</span>
        {!isSpinning && rightIcon && <span style={{ marginLeft: 6, display: 'inline-flex' }}>{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';
