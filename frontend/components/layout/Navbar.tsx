'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Shield, LogOut, LayoutDashboard, Plus } from 'lucide-react';

export default function Navbar() {
  const [user, setUser] = useState<{ name: string } | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('autotrust_user');
    if (stored) setUser(JSON.parse(stored));
  }, []);

  const logout = () => {
    localStorage.removeItem('autotrust_token');
    localStorage.removeItem('autotrust_user');
    window.location.href = '/';
  };

  return (
    <nav style={{
      position: 'sticky', top: 0, zIndex: 100,
      background: 'rgba(10, 12, 18, 0.85)',
      borderBottom: '1px solid var(--color-border)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
    }}>
      <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64 }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'linear-gradient(135deg, var(--color-primary), var(--color-accent))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Shield size={18} color="#fff" />
          </div>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.1rem', color: 'var(--color-text-primary)' }}>
            AutoTrust<span style={{ color: 'var(--color-accent)' }}>AI</span>
          </span>
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {user ? (
            <>
              <Link href="/inspect" className="btn btn-primary btn-sm">
                <Plus size={15} /> New Inspection
              </Link>
              <Link href="/dashboard" className="btn btn-ghost btn-sm">
                <LayoutDashboard size={15} /> Dashboard
              </Link>
              <button className="btn btn-ghost btn-sm" onClick={logout}>
                <LogOut size={15} /> Sign Out
              </button>
            </>
          ) : (
            <>
              <Link href="/auth/login" className="btn btn-ghost btn-sm">Sign In</Link>
              <Link href="/auth/register" className="btn btn-primary btn-sm">Get Started</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
