'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Shield, Plus, LayoutDashboard, History, Menu, X, Sparkles } from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

        {/* Desktop Right Action */}
        <div style={{ display: 'none', alignItems: 'center', gap: 12 }} className="desktop-cta">
          <span className="demo-banner">
            <Sparkles size={12} /> Phase 2 Prototype
          </span>
          <Link href="/inspect" className="btn btn-primary btn-sm">
            <Plus size={15} /> Start Inspection
          </Link>
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
          <div style={{ marginTop: 'var(--space-2)', paddingTop: 'var(--space-3)', borderTop: '1px solid var(--color-border-subtle)' }}>
            <Link
              href="/inspect"
              onClick={() => setMobileMenuOpen(false)}
              className="btn btn-primary btn-full"
            >
              <Plus size={16} /> Start New Inspection
            </Link>
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
