'use client';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import {
  Shield, Camera, TrendingUp, CheckSquare, ArrowRight,
  Eye, AlertTriangle, IndianRupee, ClipboardList
} from 'lucide-react';

const features = [
  {
    icon: Camera,
    title: 'AI Damage Detection',
    desc: 'Upload photos from any angle. Our computer vision model identifies dents, scratches, rust, and paint anomalies on specific vehicle components.',
    color: '#3D7BFF',
  },
  {
    icon: TrendingUp,
    title: 'Market Price Analysis',
    desc: 'Get an estimated fair market price range based on make, model, year, mileage, and location. Know if you\'re paying too much.',
    color: '#00D4A1',
  },
  {
    icon: Eye,
    title: 'Condition Scoring',
    desc: 'Receive a transparent 0–100 vehicle condition score broken down by exterior, interior, tyres, mileage, and more. Every point is explained.',
    color: '#F59E0B',
  },
  {
    icon: ClipboardList,
    title: 'Inspection Checklist',
    desc: 'Get a prioritized list of what to physically check before buying, generated from detected issues. High, medium, and low priority items.',
    color: '#A78BFA',
  },
  {
    icon: AlertTriangle,
    title: 'Repair Indication',
    desc: 'If visual evidence suggests possible prior repairs, the system flags it with careful language — never making unsubstantiated claims.',
    color: '#EF4444',
  },
  {
    icon: IndianRupee,
    title: 'Trust Assessment',
    desc: 'A final overall trust score with a plain-language recommendation: RECOMMENDED, CONSIDER & INSPECT, PROCEED WITH CAUTION, or AVOID.',
    color: '#10B981',
  },
];

const steps = [
  { step: '01', title: 'Enter Vehicle Details', desc: 'Make, model, year, mileage, fuel type, and asking price.' },
  { step: '02', title: 'Upload Photos', desc: 'Upload images from all angles — front, rear, sides, interior, tyres, engine.' },
  { step: '03', title: 'AI Analysis', desc: 'Our models analyze damage, estimate market price, and compute a condition score.' },
  { step: '04', title: 'Read Your Report', desc: 'Get a full inspection report with findings, score, checklist, and recommendation.' },
];

export default function HomePage() {
  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />

      {/* ── Hero ──────────────────────────────────────────────────── */}
      <section style={{ padding: 'var(--space-24) 0 var(--space-16)', position: 'relative', overflow: 'hidden' }}>
        {/* Background glow */}
        <div style={{
          position: 'absolute', top: '10%', left: '50%', transform: 'translateX(-50%)',
          width: 800, height: 400,
          background: 'radial-gradient(ellipse, rgba(0,87,255,0.12) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        <div className="container" style={{ textAlign: 'center', position: 'relative' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 'var(--space-6)', padding: '6px 16px', borderRadius: 'var(--radius-full)', background: 'rgba(0,87,255,0.1)', border: '1px solid rgba(0,87,255,0.25)', fontSize: '0.875rem', color: 'var(--color-primary-light)', fontWeight: 500 }}>
            <Shield size={14} /> AI-Powered Vehicle Inspection
          </div>

          <h1 className="heading-xl" style={{ marginBottom: 'var(--space-5)', background: 'linear-gradient(135deg, #F0F2F8 40%, #9BA3C2)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Buy Used Cars With<br />Confidence
          </h1>

          <p style={{ fontSize: '1.125rem', color: 'var(--color-text-secondary)', maxWidth: 560, margin: '0 auto var(--space-10)', lineHeight: 1.7 }}>
            AutoTrust AI analyses vehicle photos, detects visible damage, estimates fair market prices,
            and generates an explainable condition report — before you hand over a single rupee.
          </p>

          <div style={{ display: 'flex', gap: 'var(--space-4)', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/inspect" className="btn btn-primary btn-lg">
              Start Free Inspection <ArrowRight size={18} />
            </Link>
            <Link href="/auth/register" className="btn btn-secondary btn-lg">
              Create Account
            </Link>
          </div>

          {/* Stats row */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 'var(--space-12)', marginTop: 'var(--space-16)', flexWrap: 'wrap' }}>
            {[
              { label: 'Damage Types Detected', value: '10+' },
              { label: 'Condition Score Dimensions', value: '8' },
              { label: 'Inspection Checklist Items', value: '30+' },
            ].map((s) => (
              <div key={s.label} style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '2.25rem', fontWeight: 800, color: 'var(--color-primary-light)', lineHeight: 1 }}>{s.value}</div>
                <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', marginTop: 4 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ────────────────────────────────────────────────── */}
      <section className="section">
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: 'var(--space-12)' }}>
            <h2 className="heading-lg" style={{ marginBottom: 'var(--space-3)' }}>What AutoTrust AI Analyses</h2>
            <p className="text-muted">Six integrated AI modules working together for a complete vehicle report.</p>
          </div>

          <div className="grid-3">
            {features.map((f) => (
              <div key={f.title} className="card" style={{ transition: 'transform 0.2s, border-color 0.2s' }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)'; (e.currentTarget as HTMLElement).style.borderColor = f.color + '40'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLElement).style.borderColor = 'var(--color-border)'; }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: f.color + '20', border: `1px solid ${f.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 'var(--space-4)' }}>
                  <f.icon size={20} color={f.color} />
                </div>
                <h3 className="heading-md" style={{ marginBottom: 'var(--space-2)' }}>{f.title}</h3>
                <p style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', lineHeight: 1.65 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ────────────────────────────────────────────── */}
      <section className="section" style={{ background: 'var(--color-surface)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: 'var(--space-12)' }}>
            <h2 className="heading-lg" style={{ marginBottom: 'var(--space-3)' }}>How It Works</h2>
            <p className="text-muted">Four steps to a comprehensive used car inspection report.</p>
          </div>

          <div className="grid-4">
            {steps.map((s, i) => (
              <div key={s.step} style={{ position: 'relative', textAlign: 'center', padding: 'var(--space-6)' }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '3rem', fontWeight: 800, color: 'var(--color-primary)', opacity: 0.25, lineHeight: 1, marginBottom: 'var(--space-3)' }}>{s.step}</div>
                <h3 className="heading-md" style={{ marginBottom: 'var(--space-2)' }}>{s.title}</h3>
                <p style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', lineHeight: 1.65 }}>{s.desc}</p>
                {i < steps.length - 1 && (
                  <div style={{ position: 'absolute', right: 0, top: '50%', color: 'var(--color-border-strong)', fontSize: '1.5rem' }}>›</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Disclaimer + CTA ────────────────────────────────────────── */}
      <section className="section">
        <div className="container" style={{ textAlign: 'center' }}>
          <div className="card" style={{ maxWidth: 700, margin: '0 auto', borderColor: 'rgba(0,87,255,0.2)' }}>
            <Shield size={40} color="var(--color-primary-light)" style={{ margin: '0 auto var(--space-4)' }} />
            <h2 className="heading-lg" style={{ marginBottom: 'var(--space-4)' }}>Ready to Inspect a Car?</h2>
            <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--space-6)', lineHeight: 1.7 }}>
              Get a free AI-powered inspection report in minutes. No hardware required.
            </p>
            <Link href="/inspect" className="btn btn-accent btn-lg">
              Start Inspection <ArrowRight size={18} />
            </Link>
            <p style={{ marginTop: 'var(--space-5)', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
              ⚠️ AI decision-support tool only. Does not replace professional mechanical inspection.
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
