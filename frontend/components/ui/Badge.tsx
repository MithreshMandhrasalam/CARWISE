import React, { HTMLAttributes } from 'react';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info';
  icon?: React.ReactNode;
}

export function Badge({
  variant = 'default',
  icon,
  className = '',
  children,
  ...props
}: BadgeProps) {
  const variantClass = variant === 'primary' ? 'badge-info' : `badge-${variant}`;

  return (
    <span className={`badge ${variantClass} ${className}`.trim()} {...props}>
      {icon}
      <span>{children}</span>
    </span>
  );
}
