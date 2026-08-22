import React, { HTMLAttributes } from 'react';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'interactive';
  elevated?: boolean;
}

export function Card({
  variant = 'default',
  elevated = false,
  className = '',
  children,
  ...props
}: CardProps) {
  const isElevated = elevated || variant === 'elevated';
  const variantClass = isElevated
    ? 'card-elevated'
    : variant === 'interactive'
    ? 'card card-interactive'
    : 'card';

  return (
    <div className={`${variantClass} ${className}`.trim()} {...props}>
      {children}
    </div>
  );
}

export function CardHeader({
  className = '',
  children,
  style,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={className}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 'var(--space-4)',
        paddingBottom: 'var(--space-3)',
        borderBottom: '1px solid var(--color-border-subtle)',
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardBody({ className = '', children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={className} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({
  className = '',
  children,
  style,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={className}
      style={{
        marginTop: 'var(--space-4)',
        paddingTop: 'var(--space-3)',
        borderTop: '1px solid var(--color-border-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
        gap: 'var(--space-2)',
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  );
}
