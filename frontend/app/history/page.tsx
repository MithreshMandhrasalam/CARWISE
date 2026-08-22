'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Search, Filter, History, ArrowRight, Shield, Calendar, MapPin, Sparkles } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { RiskIndicator } from '@/components/ui/RiskIndicator';
import { DEMO_INSPECTIONS } from '@/lib/mockData';

export default function HistoryPage() {
  const [search, setSearch] = useState('');
  const inspections = DEMO_INSPECTIONS;

  const filtered = inspections.filter((i) =>
    `${i.vehicleInfo.make} ${i.vehicleInfo.model} ${i.vehicleInfo.location || ''}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <AppShell
      title="Inspection History"
      subtitle="Review all previously submitted vehicle audits and evidence reports."
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-6)', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="demo-banner">
            <Sparkles size={12} /> Demonstration History
          </span>
          <span style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
            Showing {filtered.length} of {inspections.length} recorded inspections
          </span>
        </div>

        <div style={{ width: 280 }}>
          <Input
            placeholder="Search inspections..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Search size={15} />}
            style={{ marginBottom: 0 }}
          />
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        {filtered.map((insp) => (
          <Card key={insp.id} elevated>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                  <h3 className="heading-md">
                    {insp.vehicleInfo.year} {insp.vehicleInfo.make} {insp.vehicleInfo.model}
                  </h3>
                  <RiskIndicator trustBand={insp.trustScore.trustBand} size="sm" />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: '0.8125rem', color: 'var(--color-text-secondary)', flexWrap: 'wrap' }}>
                  <span>{insp.vehicleInfo.variant}</span>
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
                  <span>•</span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <Calendar size={12} /> {new Date(insp.inspectionDate).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-6)', flexWrap: 'wrap' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '0.6875rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-muted)', fontWeight: 600 }}>
                    Condition Score
                  </div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-primary-light)' }}>
                    {insp.conditionScore.overallScore}/100
                  </div>
                </div>

                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '0.6875rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-muted)', fontWeight: 600 }}>
                    Trust Score
                  </div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 800, color: insp.trustScore.overallTrustScore >= 70 ? 'var(--color-success-text)' : 'var(--color-warning-text)' }}>
                    {insp.trustScore.overallTrustScore}/100
                  </div>
                </div>

                <Link href={`/inspect/${insp.id}`} className="btn btn-secondary btn-sm">
                  View Full Audit <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </AppShell>
  );
}
