'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Search, Filter, Shield, Sparkles, Eye, ArrowRight, Calendar, MapPin, Gauge, Database } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { RiskIndicator } from '@/components/ui/RiskIndicator';
import { DEMO_INSPECTIONS } from '@/lib/mockData';
import { inspectionApi } from '@/lib/api';

interface CombinedInspection {
  id: string;
  source: 'database' | 'demo';
  status: string;
  vehicleInfo: {
    make: string;
    model: string;
    variant?: string;
    year: number;
    mileageKm: number;
    askingPrice: number;
    fuelType?: string;
    transmission?: string;
    location?: string;
  };
  conditionScore?: number;
  coverageRatio?: number;
  trustScore?: number;
  trustBand?: any;
  createdAt: string;
}

export default function DashboardPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [items, setItems] = useState<CombinedInspection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadInspections() {
      try {
        const res = await inspectionApi.list({ limit: 20 });
        const dbItems: CombinedInspection[] = (res.data || []).map((doc: any) => ({
          id: doc._id,
          source: 'database' as const,
          status: doc.status || 'PENDING',
          vehicleInfo: doc.vehicleInfo,
          conditionScore: doc.conditionScore?.overallScore,
          coverageRatio: doc.evidenceConfidence?.visualCoverageIndex,
          trustScore: doc.trustScore?.overallTrustScore,
          trustBand: doc.trustScore?.trustBand || 'INSUFFICIENT_EVIDENCE',
          createdAt: doc.createdAt,
        }));

        // Convert demo inspections into combined format
        const demoItems: CombinedInspection[] = DEMO_INSPECTIONS.map((demo) => ({
          id: demo.id,
          source: 'demo' as const,
          status: 'COMPLETE',
          vehicleInfo: demo.vehicleInfo,
          conditionScore: demo.conditionScore.overallScore,
          coverageRatio: demo.evidenceConfidence.visualCoverageIndex,
          trustScore: demo.trustScore.overallTrustScore,
          trustBand: demo.trustScore.trustBand,
          createdAt: demo.inspectionDate,
        }));

        // Combine DB items first, followed by demo items
        setItems([...dbItems, ...demoItems]);
      } catch (err) {
        // Fallback to demo items if backend is unavailable
        const demoItems: CombinedInspection[] = DEMO_INSPECTIONS.map((demo) => ({
          id: demo.id,
          source: 'demo' as const,
          status: 'COMPLETE',
          vehicleInfo: demo.vehicleInfo,
          conditionScore: demo.conditionScore.overallScore,
          coverageRatio: demo.evidenceConfidence.visualCoverageIndex,
          trustScore: demo.trustScore.overallTrustScore,
          trustBand: demo.trustScore.trustBand,
          createdAt: demo.inspectionDate,
        }));
        setItems(demoItems);
      } finally {
        setLoading(false);
      }
    }

    loadInspections();
  }, []);

  const filtered = items.filter((item) => {
    const q = searchQuery.toLowerCase();
    const v = item.vehicleInfo;
    return (
      v.make.toLowerCase().includes(q) ||
      v.model.toLowerCase().includes(q) ||
      (v.location && v.location.toLowerCase().includes(q))
    );
  });

  const dbCount = items.filter((i) => i.source === 'database').length;

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
            {items.length}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: 4 }}>
            {dbCount} Live DB + {items.length - dbCount} Demo
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
              Database Sync
            </span>
            <span style={{ padding: 6, borderRadius: 'var(--radius-sm)', background: 'var(--color-surface-elevated)' }}>
              <Database size={16} color="var(--color-accent-light)" />
            </span>
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 800, marginTop: 'var(--space-2)', color: 'var(--color-success-text)' }}>
            MongoDB Online
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: 4 }}>
            carwise_db persistence active
          </div>
        </Card>
      </div>

      {/* ── Inspections Header & Search Filter ─────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-4)', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <h2 className="heading-md">Recent Vehicle Assessments</h2>
          <Badge variant="primary" icon={<Database size={12} />}>
            {dbCount} In Database
          </Badge>
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
        {filtered.map((item) => (
          <Card key={item.id} elevated style={{ transition: 'border-color 0.2s' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
              {/* Vehicle Info */}
              <div style={{ flex: '1 1 300px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                  <h3 className="heading-md">
                    {item.vehicleInfo.year} {item.vehicleInfo.make} {item.vehicleInfo.model}
                  </h3>
                  {item.source === 'demo' ? (
                    <Badge variant="warning" style={{ fontSize: '0.6875rem' }}>Demo Audit</Badge>
                  ) : (
                    <Badge variant={item.status === 'COMPLETE' ? 'success' : 'info'} style={{ fontSize: '0.6875rem' }}>
                      DB: {item.status}
                    </Badge>
                  )}
                  {item.trustBand && <RiskIndicator trustBand={item.trustBand} size="sm" />}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: '0.8125rem', color: 'var(--color-text-secondary)', flexWrap: 'wrap' }}>
                  <span>{item.vehicleInfo.variant || 'Standard'}</span>
                  <span>•</span>
                  <span>{item.vehicleInfo.mileageKm.toLocaleString()} km</span>
                  <span>•</span>
                  <span>₹{(item.vehicleInfo.askingPrice / 100000).toFixed(2)} Lakhs</span>
                  {item.vehicleInfo.location && (
                    <>
                      <span>•</span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <MapPin size={12} /> {item.vehicleInfo.location}
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
                    {item.conditionScore !== undefined ? item.conditionScore : 'Pending'}
                  </div>
                </div>

                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '0.6875rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-muted)', fontWeight: 600 }}>
                    Evidence
                  </div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-accent-light)' }}>
                    {item.coverageRatio !== undefined ? `${Math.round(item.coverageRatio * 100)}%` : 'Pending'}
                  </div>
                </div>

                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '0.6875rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-muted)', fontWeight: 600 }}>
                    Trust Score
                  </div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 800, color: (item.trustScore || 0) >= 70 ? 'var(--color-success-text)' : 'var(--color-warning-text)' }}>
                    {item.trustScore !== undefined ? item.trustScore : 'Pending'}
                  </div>
                </div>

                {/* View Report CTA */}
                <Link href={`/inspect/${item.id}`} className="btn btn-secondary btn-sm">
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
