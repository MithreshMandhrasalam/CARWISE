'use client';
import Link from 'next/link';
import {
  Shield,
  ArrowRight,
  Sparkles,
  Camera,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Search,
  Eye,
  Sliders,
  HelpCircle,
  TrendingUp,
  Car,
} from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ScoreIndicator } from '@/components/ui/ScoreIndicator';
import { RiskIndicator } from '@/components/ui/RiskIndicator';
import { DEMO_INSPECTIONS } from '@/lib/mockData';

export default function HomePage() {
  const sampleReport = DEMO_INSPECTIONS[0];

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />

      {/* ── Section 1: Hero ────────────────────────────────────────── */}
      <section
        style={{
          position: 'relative',
          padding: 'var(--space-20) 0 var(--space-16)',
          background: 'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(37,99,235,0.25), transparent 70%), var(--color-bg)',
          overflow: 'hidden',
        }}
      >
        <div className="container" style={{ textAlign: 'center', position: 'relative', zIndex: 2 }}>
          {/* Eyebrow Pill */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              marginBottom: 'var(--space-6)',
              padding: '6px 16px',
              borderRadius: 'var(--radius-full)',
              background: 'rgba(37, 99, 235, 0.12)',
              border: '1px solid rgba(37, 99, 235, 0.3)',
              fontSize: '0.8125rem',
              color: 'var(--color-primary-light)',
              fontWeight: 600,
            }}
          >
            <Shield size={14} /> Car Assessment & Risk With Intelligent Safety & Evidence
          </div>

          {/* Main Headline */}
          <h1
            className="heading-display"
            style={{
              maxWidth: 820,
              margin: '0 auto var(--space-6)',
              background: 'linear-gradient(135deg, #FFFFFF 30%, #9BA5B9 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Make a smarter used-car decision.
          </h1>

          {/* Tagline & Subtext */}
          <p
            style={{
              fontSize: '1.25rem',
              color: 'var(--color-text-secondary)',
              maxWidth: 680,
              margin: '0 auto var(--space-4)',
              fontWeight: 500,
              lineHeight: 1.5,
            }}
          >
            &ldquo;See the Evidence. Know the Risk. Buy Wiser.&rdquo;
          </p>

          <p
            style={{
              fontSize: '1rem',
              color: 'var(--color-text-muted)',
              maxWidth: 620,
              margin: '0 auto var(--space-10)',
              lineHeight: 1.7,
            }}
          >
            <strong>CARWISE</strong> analyzes available vehicle photographs, identifies visible abnormalities,
            evaluates condition and evidence completeness, and generates prioritized inspection checklists — before you buy.
          </p>

          {/* Action CTAs */}
          <div style={{ display: 'flex', gap: 'var(--space-4)', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/inspect" className="btn btn-primary btn-lg">
              Start Free Inspection <ArrowRight size={18} />
            </Link>
            <Link href="/dashboard" className="btn btn-secondary btn-lg">
              View Sample Dashboard
            </Link>
          </div>

          {/* Stats Bar */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              gap: 'var(--space-10)',
              marginTop: 'var(--space-16)',
              paddingTop: 'var(--space-8)',
              borderTop: '1px solid var(--color-border-subtle)',
              flexWrap: 'wrap',
            }}
          >
            {[
              { label: 'Logical Vehicle Zones', value: '8 Zones' },
              { label: 'Mandatory Perspectives', value: '4 Views' },
              { label: 'Condition & Trust Scale', value: '0–100' },
              { label: 'Physical Checklist Triggers', value: '20+ Checks' },
            ].map((stat) => (
              <div key={stat.label} style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-primary-light)' }}>
                  {stat.value}
                </div>
                <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', marginTop: 2 }}>
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Section 2: Problem Statement ───────────────────────────── */}
      <section className="section" style={{ background: 'var(--color-surface)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', maxWidth: 640, margin: '0 auto var(--space-12)' }}>
            <Badge variant="warning" icon={<AlertTriangle size={12} />}>The Used-Car Reality</Badge>
            <h2 className="heading-lg" style={{ marginTop: 'var(--space-3)', marginBottom: 'var(--space-3)' }}>
              Buying a used car is full of blindspots.
            </h2>
            <p className="text-secondary">
              Buyers often rely on seller claims or superficial walkarounds, missing subtle repair patterns and structural risks.
            </p>
          </div>

          <div className="grid-3">
            <Card>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--color-danger-bg)', border: '1px solid var(--color-danger-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 'var(--space-4)', color: 'var(--color-danger-text)' }}>
                <AlertTriangle size={20} />
              </div>
              <h3 className="heading-md" style={{ marginBottom: 'var(--space-2)' }}>Concealed Impact Repairs</h3>
              <p className="text-secondary" style={{ fontSize: '0.875rem' }}>
                Replaced panels, misaligned bumper clips, and paint overspray often go unnoticed until after the purchase is finalized.
              </p>
            </Card>

            <Card>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--color-warning-bg)', border: '1px solid var(--color-warning-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 'var(--space-4)', color: 'var(--color-warning-text)' }}>
                <Eye size={20} />
              </div>
              <h3 className="heading-md" style={{ marginBottom: 'var(--space-2)' }}>Omitted Angles & Blindspots</h3>
              <p className="text-secondary" style={{ fontSize: '0.875rem' }}>
                Sellers frequently omit damaged sides or submit low-quality photos. Traditional buyers have no way to quantify evidence completeness.
              </p>
            </Card>

            <Card>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--color-info-bg)', border: '1px solid var(--color-info-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 'var(--space-4)', color: 'var(--color-info-text)' }}>
                <TrendingUp size={20} />
              </div>
              <h3 className="heading-md" style={{ marginBottom: 'var(--space-2)' }}>Unclear Fair Market Valuation</h3>
              <p className="text-secondary" style={{ fontSize: '0.875rem' }}>
                Without observable condition factoring into pricing, buyers overpay for vehicles requiring thousands in immediate cosmetic or mechanical fixes.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* ── Section 3: How CARWISE Works ───────────────────────────── */}
      <section className="section">
        <div className="container">
          <div style={{ textAlign: 'center', maxWidth: 640, margin: '0 auto var(--space-12)' }}>
            <Badge variant="info" icon={<Sliders size={12} />}>Structured Process</Badge>
            <h2 className="heading-lg" style={{ marginTop: 'var(--space-3)', marginBottom: 'var(--space-3)' }}>
              How CARWISE Evaluates a Vehicle
            </h2>
            <p className="text-secondary">
              A 4-step evidence-first evaluation from photo ingestion to prioritized inspection checklist.
            </p>
          </div>

          <div className="grid-4">
            {[
              {
                step: '01',
                title: 'Guided Upload',
                desc: 'Upload 4 mandatory perspectives (Front, Rear, Left, Right) plus optional angles and specs.',
                icon: <Camera size={20} color="var(--color-primary-light)" />,
              },
              {
                step: '02',
                title: 'Quality Assessment',
                desc: 'Deterministic IQA checks for blur, improper exposure, and duplicate images before analysis.',
                icon: <CheckCircle2 size={20} color="var(--color-accent-light)" />,
              },
              {
                step: '03',
                title: 'Zone Reasoning',
                desc: 'Observable cosmetic flaws are mapped into 8 logical vehicle zones to identify co-located repair patterns.',
                icon: <Search size={20} color="var(--color-warning-text)" />,
              },
              {
                step: '04',
                title: 'Audit Report',
                desc: 'Receive separate Condition and Trust scores with a prioritized physical inspection checklist.',
                icon: <FileText size={20} color="var(--color-success-text)" />,
              },
            ].map((s) => (
              <Card key={s.step} style={{ position: 'relative' }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8125rem', fontWeight: 700, color: 'var(--color-text-muted)', marginBottom: 'var(--space-3)' }}>
                  STEP {s.step}
                </div>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--color-surface-elevated)', border: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 'var(--space-4)' }}>
                  {s.icon}
                </div>
                <h3 className="heading-sm" style={{ marginBottom: 'var(--space-2)' }}>{s.title}</h3>
                <p className="text-secondary" style={{ fontSize: '0.8125rem', lineHeight: 1.6 }}>{s.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── Section 4: Key Capabilities ────────────────────────────── */}
      <section className="section" style={{ background: 'var(--color-surface)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', maxWidth: 640, margin: '0 auto var(--space-12)' }}>
            <Badge variant="primary" icon={<Sparkles size={12} />}>Analytical Intelligence</Badge>
            <h2 className="heading-lg" style={{ marginTop: 'var(--space-3)', marginBottom: 'var(--space-3)' }}>
              Core Technical Capabilities
            </h2>
            <p className="text-secondary">
              Built on transparent mathematical formulations, pluggable CV interfaces, and explainable decision rules.
            </p>
          </div>

          <div className="grid-3">
            <Card elevated>
              <h3 className="heading-md" style={{ color: 'var(--color-primary-light)', marginBottom: 'var(--space-2)' }}>
                8-Zone Spatial Mapping
              </h3>
              <p className="text-secondary" style={{ fontSize: '0.875rem', lineHeight: 1.6 }}>
                Aggregates detected scratches, dents, and misalignments into logical zones (e.g. `ZONE_FRONT_RIGHT`) to synthesize adjacent panel findings.
              </p>
            </Card>

            <Card elevated>
              <h3 className="heading-md" style={{ color: 'var(--color-accent-light)', marginBottom: 'var(--space-2)' }}>
                Evidence Completeness Meter
              </h3>
              <p className="text-secondary" style={{ fontSize: '0.875rem', lineHeight: 1.6 }}>
                Explicitly measures visual coverage ratio. If a seller omits a damaged side, CARWISE caps the Trust Score and warns the buyer.
              </p>
            </Card>

            <Card elevated>
              <h3 className="heading-md" style={{ color: 'var(--color-success-text)', marginBottom: 'var(--space-2)' }}>
                Prioritized Action Checklist
              </h3>
              <p className="text-secondary" style={{ fontSize: '0.875rem', lineHeight: 1.6 }}>
                Converts analytical findings into high-, medium-, and low-priority physical inspection steps for when you meet the seller.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* ── Section 5: Trust vs Condition Score Explanation ────────── */}
      <section className="section">
        <div className="container">
          <div style={{ textAlign: 'center', maxWidth: 640, margin: '0 auto var(--space-12)' }}>
            <Badge variant="info" icon={<HelpCircle size={12} />}>Traceable Derivations</Badge>
            <h2 className="heading-lg" style={{ marginTop: 'var(--space-3)', marginBottom: 'var(--space-3)' }}>
              Condition Score vs. Assessment Trust Score
            </h2>
            <p className="text-secondary">
              CARWISE strictly decouples physical appearance from evaluation confidence.
            </p>
          </div>

          <div className="grid-2">
            <Card elevated style={{ borderTop: '4px solid var(--color-primary)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 'var(--space-3)' }}>
                <Sparkles size={20} color="var(--color-primary-light)" />
                <h3 className="heading-md">Vehicle Condition Score (0–100)</h3>
              </div>
              <p className="text-secondary" style={{ fontSize: '0.875rem', marginBottom: 'var(--space-4)' }}>
                <strong>What it measures:</strong> How good the vehicle appears based solely on observable visual evidence.
              </p>
              <ul style={{ paddingLeft: 'var(--space-5)', fontSize: '0.8125rem', color: 'var(--color-text-secondary)', display: 'flex', flexDirection: 'column', gap: 6 }}>
                <li>Derived from visible dents, scratches, rust, and panel gaps.</li>
                <li>Weighted by damage severity and panel structural criticality.</li>
                <li>A clean car with missing photos can still have a high condition score.</li>
              </ul>
            </Card>

            <Card elevated style={{ borderTop: '4px solid var(--color-accent)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 'var(--space-3)' }}>
                <Shield size={20} color="var(--color-accent-light)" />
                <h3 className="heading-md">Buyer Assessment Trust Score (0–100)</h3>
              </div>
              <p className="text-secondary" style={{ fontSize: '0.875rem', marginBottom: 'var(--space-4)' }}>
                <strong>What it measures:</strong> How confident the buyer should be in the overall assessment and listing.
              </p>
              <ul style={{ paddingLeft: 'var(--space-5)', fontSize: '0.8125rem', color: 'var(--color-text-secondary)', display: 'flex', flexDirection: 'column', gap: 6 }}>
                <li>Factors in Condition + Evidence Completeness + Image Clarity.</li>
                <li>Penalizes omitted mandatory angles, suspicious anomalies, and price disparities.</li>
                <li><strong>Does NOT measure seller honesty</strong> — measures evidence certainty.</li>
              </ul>
            </Card>
          </div>
        </div>
      </section>

      {/* ── Section 6: Example Report Preview ───────────────────────── */}
      <section className="section" style={{ background: 'var(--color-surface)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', maxWidth: 640, margin: '0 auto var(--space-10)' }}>
            <span className="demo-banner">
              <Sparkles size={12} /> Interactive Demonstration Preview
            </span>
            <h2 className="heading-lg" style={{ marginTop: 'var(--space-3)', marginBottom: 'var(--space-3)' }}>
              Sample Inspection Audit Preview
            </h2>
            <p className="text-secondary">
              Here is how CARWISE presents findings to prospective buyers.
            </p>
          </div>

          <div style={{ maxWidth: 860, margin: '0 auto' }}>
            <Card elevated style={{ border: '1px solid var(--color-border-hover)' }}>
              <CardHeader>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <h3 className="heading-md">{sampleReport.vehicleInfo.year} {sampleReport.vehicleInfo.make} {sampleReport.vehicleInfo.model}</h3>
                    <RiskIndicator trustBand={sampleReport.trustScore.trustBand} size="sm" />
                  </div>
                  <p className="text-muted" style={{ fontSize: '0.8125rem', marginTop: 2 }}>
                    {sampleReport.vehicleInfo.variant} • {sampleReport.vehicleInfo.mileageKm.toLocaleString()} km • {sampleReport.vehicleInfo.location}
                  </p>
                </div>
                <Link href={`/inspect/${sampleReport.id}`} className="btn btn-outline btn-sm">
                  View Full Report <ArrowRight size={14} />
                </Link>
              </CardHeader>

              <CardBody>
                <div className="grid-3" style={{ marginBottom: 'var(--space-6)' }}>
                  <ScoreIndicator
                    type="condition"
                    score={sampleReport.conditionScore.overallScore}
                    subLabel="Observable Cosmetic Integrity"
                    size="sm"
                  />
                  <ScoreIndicator
                    type="evidence"
                    score={sampleReport.evidenceConfidence.visualCoverageIndex}
                    subLabel="4 Mandatory + 5 Optional views"
                    size="sm"
                  />
                  <ScoreIndicator
                    type="trust"
                    score={sampleReport.trustScore.overallTrustScore}
                    subLabel="Assessment Certainty"
                    size="sm"
                  />
                </div>

                <div style={{ padding: 'var(--space-4)', background: 'var(--color-surface-elevated)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border-subtle)' }}>
                  <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--color-primary-light)', marginBottom: 4 }}>
                    Cross-View Zone Finding: {sampleReport.crossViewObservations[0].zoneTitle}
                  </div>
                  <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
                    {sampleReport.crossViewObservations[0].observedFinding}
                  </p>
                </div>
              </CardBody>
            </Card>
          </div>
        </div>
      </section>

      {/* ── Section 7: Final CTA ───────────────────────────────────── */}
      <section
        className="section"
        style={{
          textAlign: 'center',
          background: 'radial-gradient(ellipse 60% 50% at 50% 50%, rgba(37,99,235,0.15), transparent 70%), var(--color-bg)',
          padding: 'var(--space-16) 0',
        }}
      >
        <div className="container" style={{ maxWidth: 640 }}>
          <h2 className="heading-xl" style={{ marginBottom: 'var(--space-4)' }}>
            Ready to evaluate a used car?
          </h2>
          <p className="text-secondary" style={{ fontSize: '1rem', marginBottom: 'var(--space-8)', lineHeight: 1.6 }}>
            Upload vehicle photos now and inspect with evidence, transparency, and confidence.
          </p>
          <Link href="/inspect" className="btn btn-primary btn-lg">
            Start Free Inspection <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
