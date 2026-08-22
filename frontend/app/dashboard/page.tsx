'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Plus, Search, Filter, Shield, Sparkles, Eye, ArrowRight, Calendar, MapPin, Gauge } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { ScoreIndicator } from '@/components/ui/ScoreIndicator';
import { RiskIndicator } from '@/components/ui/RiskIndicator';
import { DEMO_INSPECTIONS } from '@/lib/mockData';

export default function DashboardPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [inspections] = useState(DEMO_INSPECTIONS);

  const filteredInspections = inspections.filter((insp) => {
    const q = searchQuery.toLowerCase();
    const v = insp.vehicleInfo;
    return (
      v.make.toLowerCase().includes(q) ||
      v.model.toLowerCase().includes(q) ||
      (v.location && v.location.toLowerCase().includes(q))
    );
  });

  return (
    <AppShell
      title="Inspection Dashboard"
      subtitle="Track, manage, and review your used-vehicle assessment reports."
      action={
        <Link href="/inspect" className="btn btn-primary">
          <Plus size={16} /> New Inspection
        </Link>
      }
    >
      {/* ── Top Metric Cards ────────────────────────────────────────── */}
      <div className="grid-4" style={{ marginBottom: 'var(--space-8)' }}>
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Total Audits
            </span>
            <span style={{ padding: 6, borderRadius: 'var(--radius-sm)', background: 'var(--color-surface-elevated)' }}>
              <Shield size={16} color="var(--color-primary-light)" />
            </span>
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 800, marginTop: 'var(--space-2)', color: 'var(--color-text-primary)' }}>
            2
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: 4 }}>
            Sample demonstration audits
          </div>
        </Card>

        <Card>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Avg. Condition
            </span>
            <span style={{ padding: 6, borderRadius: 'var(--radius-sm)', background: 'var(--color-surface-elevated)' }}>
              <Sparkles size={16} color="var(--color-accent-light)" />
            </span>
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 800, marginTop: 'var(--space-2)', color: 'var(--color-text-primary)' }}>
            71<span style={{ fontSize: '1rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>/100</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: 4 }}>
            Observable cosmetic average
          </div>
        </Card>

        <Card>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Avg. Evidence
            </span>
            <span style={{ padding: 6, borderRadius: 'var(--radius-sm)', background: 'var(--color-surface-elevated)' }}>
              <Eye size={16} color="var(--color-success-text)" />
            </span>
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 800, marginTop: 'var(--space-2)', color: 'var(--color-text-primary)' }}>
            74<span style={{ fontSize: '1rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>%</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: 4 }}>
            Visual angle coverage ratio
          </div>
        </Card>

        <Card>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Flagged Risks
            </span>
            <span style={{ padding: 6, borderRadius: 'var(--radius-sm)', background: 'var(--color-surface-elevated)' }}>
              <Gauge size={16} color="var(--color-warning-text)" />
            </span>
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 800, marginTop: 'var(--space-2)', color: 'var(--color-warning-text)' }}>
            1
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: 4 }}>
            Inspection requires physical check
          </div>
        </Card>
      </div>

      {/* ── Inspections Header & Search Filter ─────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-4)', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <h2 className="heading-md">Recent Vehicle Assessments</h2>
          <span className="demo-banner">
            <Sparkles size={12} /> Demonstrator Data
          </span>
        </div>

        <div style={{ width: 280 }}>
          <Input
            placeholder="Search make, model, city..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Search size={15} />}
            style={{ marginBottom: 0 }}
          />
        </div>
      </div>

      {/* ── Inspections List ────────────────────────────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        {filteredInspections.map((insp) => (
          <Card key={insp.id} elevated style={{ transition: 'border-color 0.2s' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
              {/* Vehicle Info */}
              <div style={{ flex: '1 1 300px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                  <h3 className="heading-md">
                    {insp.vehicleInfo.year} {insp.vehicleInfo.make} {insp.vehicleInfo.model}
                  </h3>
                  <RiskIndicator trustBand={insp.trustScore.trustBand} size="sm" />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: '0.8125rem', color: 'var(--color-text-secondary)', flexWrap: 'wrap' }}>
                  <span>{insp.vehicleInfo.variant || 'Standard'}</span>
                  <span>•</span>
                  <span>{insp.vehicleInfo.mileageKm.toLocaleString()} km</span>
                  <span>•</span>
                  <span>₹{(insp.vehicleInfo.askingPrice / 100000).toFixed(2)} Lakhs</span>
                  {insp.vehicleInfo.location && (
                    <>
                      <span>•</span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <MapPin size={12} /> {insp.vehicleInfo.location}
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Quick Scores */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-6)', flexWrap: 'wrap' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '0.6875rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-muted)', fontWeight: 600 }}>
                    Condition
                  </div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-primary-light)' }}>
                    {insp.conditionScore.overallScore}
                  </div>
                </div>

                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '0.6875rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-muted)', fontWeight: 600 }}>
                    Evidence
                  </div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-accent-light)' }}>
                    {Math.round(insp.evidenceConfidence.visualCoverageIndex * 100)}%
                  </div>
                </div>

                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '0.6875rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-muted)', fontWeight: 600 }}>
                    Trust Score
                  </div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 800, color: insp.trustScore.overallTrustScore >= 70 ? 'var(--color-success-text)' : 'var(--color-warning-text)' }}>
                    {insp.trustScore.overallTrustScore}
                  </div>
                </div>

                {/* View Report CTA */}
                <Link href={`/inspect/${insp.id}`} className="btn btn-secondary btn-sm">
                  View Report <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </AppShell>
  );
}
