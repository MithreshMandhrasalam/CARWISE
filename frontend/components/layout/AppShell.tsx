'use client';
import React, { ReactNode, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Navbar from './Navbar';
import Footer from './Footer';
import { useAuth } from '@/contexts/AuthContext';
import { LoadingCard } from '@/components/ui/LoadingState';

export interface AppShellProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  action?: ReactNode;
  containerSize?: 'sm' | 'md' | 'lg' | 'xl';
  showBanner?: boolean;
  requireAuth?: boolean;
}

export function AppShell({
  children,
  title,
  subtitle,
  action,
  containerSize = 'lg',
  showBanner = true,
  requireAuth = false,
}: AppShellProps) {
  const containerClass = `container-${containerSize}`;
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (requireAuth && !isLoading && !isAuthenticated) {
      router.push(`/auth/login?redirect=${encodeURIComponent(pathname)}`);
    }
  }, [requireAuth, isLoading, isAuthenticated, router, pathname]);

  if (requireAuth && isLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Navbar />
        <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-12)' }}>
          <LoadingCard title="Verifying your secure session..." />
        </main>
        <Footer />
      </div>
    );
  }

  if (requireAuth && !isAuthenticated) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Navbar />
        <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-12)' }}>
          <LoadingCard title="Redirecting to secure login..." />
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />

      {/* Demo Prototype Banner */}
      {showBanner && (
        <div
          style={{
            background: 'linear-gradient(90deg, rgba(37, 99, 235, 0.15), rgba(6, 182, 212, 0.15))',
            borderBottom: '1px solid rgba(37, 99, 235, 0.25)',
            padding: '6px var(--space-4)',
            fontSize: '0.75rem',
            textAlign: 'center',
            color: 'var(--color-primary-light)',
            fontWeight: 500,
          }}
        >
          <span>
            🔒 <strong>CARWISE Protected Workspace:</strong> User Authentication & Inspection Ownership Active
          </span>
        </div>
      )}

      {/* Main Content Area */}
      <main style={{ flex: 1, paddingBottom: 'var(--space-16)' }}>
        {(title || action) && (
          <div style={{ background: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)', padding: 'var(--space-8) 0' }}>
            <div className={containerClass} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
              <div>
                {title && <h1 className="heading-xl">{title}</h1>}
                {subtitle && <p style={{ fontSize: '0.9375rem', color: 'var(--color-text-secondary)', marginTop: 4 }}>{subtitle}</p>}
              </div>
              {action && <div>{action}</div>}
            </div>
          </div>
        )}

        <div className={containerClass} style={{ marginTop: title ? 'var(--space-8)' : 'var(--space-6)' }}>
          {children}
        </div>
      </main>

      <Footer />
    </div>
  );
}
