'use client';
import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Shield, Eye, EyeOff, LogIn, ArrowRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardHeader, CardBody, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Alert } from '@/components/ui/Alert';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/dashboard';
  const { login } = useAuth();

  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const res = await login(form.email, form.password);
    if (res.success) {
      router.push(redirect);
    } else {
      setError(res.error || 'Authentication failed. Please check your credentials.');
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-6)', background: 'var(--color-bg)' }}>
      <div style={{ width: '100%', maxWidth: 440 }}>
        {/* Brand Logo */}
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-8)' }}>
          <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 12, textDecoration: 'none' }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: 'linear-gradient(135deg, var(--color-primary), var(--color-accent))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 16px var(--color-primary-glow)',
              }}
            >
              <Shield size={22} color="#fff" strokeWidth={2.5} />
            </div>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.35rem', letterSpacing: '0.04em', color: 'var(--color-text-primary)', lineHeight: 1.1 }}>
                CAR<span style={{ color: 'var(--color-accent)' }}>WISE</span>
              </div>
              <div style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)', letterSpacing: '0.03em', textTransform: 'uppercase', fontWeight: 600 }}>
                Evidence & Risk Platform
              </div>
            </div>
          </Link>
        </div>

        <Card elevated style={{ padding: 'var(--space-8)' }}>
          <h1 className="heading-lg" style={{ textAlign: 'center', marginBottom: 'var(--space-2)' }}>
            Welcome back
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', textAlign: 'center', marginBottom: 'var(--space-6)' }}>
            Sign in to access your saved inspections and audits
          </p>

          {error && (
            <Alert variant="danger" style={{ marginBottom: 'var(--space-4)' }}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <Input
              label="Email address"
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
              autoComplete="email"
            />

            <div>
              <label className="form-label" htmlFor="login-password">Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  className="form-input"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                  autoComplete="current-password"
                  style={{ paddingRight: 44 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  style={{
                    position: 'absolute',
                    right: 12,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: 'var(--color-text-muted)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              loading={loading}
              rightIcon={<ArrowRight size={16} />}
              style={{ marginTop: 'var(--space-2)' }}
            >
              Sign In
            </Button>
          </form>

          <p style={{ textAlign: 'center', marginTop: 'var(--space-6)', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
            Don&apos;t have an account?{' '}
            <Link href={`/auth/register${redirect ? `?redirect=${encodeURIComponent(redirect)}` : ''}`} style={{ color: 'var(--color-primary-light)', fontWeight: 600 }}>
              Create one free
            </Link>
          </p>
        </Card>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100dvh', background: 'var(--color-bg)' }} />}>
      <LoginForm />
    </Suspense>
  );
}
