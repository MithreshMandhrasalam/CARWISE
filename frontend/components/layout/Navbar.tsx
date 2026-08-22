'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Shield, Plus, LayoutDashboard, History, Menu, X, Sparkles, User, LogOut, LogIn } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();

  const navLinks = [
    { href: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={16} /> },
    { href: '/inspect', label: 'New Inspection', icon: <Plus size={16} /> },
    { href: '/history', label: 'Inspection History', icon: <History size={16} /> },
  ];

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        background: 'rgba(7, 9, 14, 0.90)',
        borderBottom: '1px solid var(--color-border)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
      }}
    >
      <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 68 }}>
        {/* Brand Logo & Tagline */}
        <Link
          href="/"
          style={{ display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none' }}
          onClick={() => setMobileMenuOpen(false)}
        >
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              background: 'linear-gradient(135deg, var(--color-primary), var(--color-accent))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 16px var(--color-primary-glow)',
            }}
          >
            <Shield size={20} color="#FFFFFF" strokeWidth={2.5} />
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.25rem', letterSpacing: '0.04em', color: 'var(--color-text-primary)', lineHeight: 1.1 }}>
              CAR<span style={{ color: 'var(--color-accent)' }}>WISE</span>
            </div>
            <div style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)', letterSpacing: '0.03em', textTransform: 'uppercase', fontWeight: 600 }}>
              Evidence & Risk Platform
            </div>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav style={{ display: 'none', alignItems: 'center', gap: 8 }} className="desktop-nav">
          {navLinks.map((link) => {
            const isActive = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href));
            return (
              <Link
                key={link.href}
                href={link.href}
                className={isActive ? 'btn btn-secondary btn-sm' : 'btn btn-ghost btn-sm'}
                style={{
                  color: isActive ? 'var(--color-primary-light)' : 'var(--color-text-secondary)',
                  borderColor: isActive ? 'var(--color-primary)' : 'transparent',
                }}
              >
                {link.icon}
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Desktop Right Action: Auth / New Inspection */}
        <div style={{ display: 'none', alignItems: 'center', gap: 12 }} className="desktop-cta">
          {isAuthenticated && user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '4px 12px',
                  borderRadius: 'var(--radius-full)',
                  background: 'var(--color-surface-elevated)',
                  border: '1px solid var(--color-border)',
                  fontSize: '0.8125rem',
                }}
              >
                <div
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: '50%',
                    background: 'var(--color-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.6875rem',
                    fontWeight: 700,
                    color: '#FFF',
                  }}
                >
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <span style={{ color: 'var(--color-text-primary)', fontWeight: 600 }}>{user.name}</span>
              </div>

              <Link href="/inspect" className="btn btn-primary btn-sm">
                <Plus size={15} /> Start Inspection
              </Link>

              <button
                onClick={logout}
                className="btn btn-ghost btn-sm"
                title="Sign out"
                style={{ padding: '6px 10px', color: 'var(--color-text-muted)' }}
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Link href="/auth/login" className="btn btn-ghost btn-sm">
                <LogIn size={15} /> Sign In
              </Link>
              <Link href="/auth/register" className="btn btn-primary btn-sm">
                Register Free
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Hamburger Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
          className="btn btn-ghost btn-sm mobile-menu-btn"
          style={{ padding: 8 }}
        >
          {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div
          style={{
            borderTop: '1px solid var(--color-border)',
            background: 'var(--color-surface)',
            padding: 'var(--space-4) var(--space-4) var(--space-6)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-2)',
          }}
          className="mobile-drawer"
        >
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className="btn btn-ghost"
              style={{
                justifyContent: 'flex-start',
                width: '100%',
                padding: '12px 16px',
                background: pathname === link.href ? 'var(--color-surface-elevated)' : 'transparent',
                color: pathname === link.href ? 'var(--color-primary-light)' : 'var(--color-text-primary)',
              }}
            >
              {link.icon}
              <span>{link.label}</span>
            </Link>
          ))}

          <div style={{ marginTop: 'var(--space-2)', paddingTop: 'var(--space-3)', borderTop: '1px solid var(--color-border-subtle)', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {isAuthenticated && user ? (
              <>
                <div style={{ padding: '8px 12px', fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
                  Signed in as <strong>{user.email}</strong>
                </div>
                <Link
                  href="/inspect"
                  onClick={() => setMobileMenuOpen(false)}
                  className="btn btn-primary btn-full"
                >
                  <Plus size={16} /> Start New Inspection
                </Link>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    logout();
                  }}
                  className="btn btn-secondary btn-full"
                >
                  <LogOut size={16} /> Sign Out
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="btn btn-secondary btn-full"
                >
                  <LogIn size={16} /> Sign In
                </Link>
                <Link
                  href="/auth/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="btn btn-primary btn-full"
                >
                  Register Free Account
                </Link>
              </>
            )}
          </div>
        </div>
      )}

      <style jsx>{`
        @media (min-width: 768px) {
          :global(.desktop-nav), :global(.desktop-cta) {
            display: flex !important;
          }
          :global(.mobile-menu-btn), :global(.mobile-drawer) {
            display: none !important;
          }
        }
      `}</style>
    </header>
  );
}
