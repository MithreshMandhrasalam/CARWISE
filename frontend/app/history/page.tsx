'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, Filter, History, ArrowRight, Shield, Calendar, MapPin, Sparkles, Trash2, Database } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { RiskIndicator } from '@/components/ui/RiskIndicator';
import { DEMO_INSPECTIONS } from '@/lib/mockData';
import { inspectionApi } from '@/lib/api';

interface HistoryItem {
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
    location?: string;
  };
  conditionScore?: number;
  trustScore?: number;
  trustBand?: any;
  createdAt: string;
}

export default function HistoryPage() {
  const [search, setSearch] = useState('');
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchHistory = async () => {
    try {
      const res = await inspectionApi.list({ limit: 50 });
      const dbItems: HistoryItem[] = (res.data || []).map((doc: any) => ({
        id: doc._id,
        source: 'database' as const,
        status: doc.status || 'PENDING',
        vehicleInfo: doc.vehicleInfo,
        conditionScore: doc.conditionScore?.overallScore,
        trustScore: doc.trustScore?.overallTrustScore,
        trustBand: doc.trustScore?.trustBand || 'INSUFFICIENT_EVIDENCE',
        createdAt: doc.createdAt,
      }));

      const demoItems: HistoryItem[] = DEMO_INSPECTIONS.map((demo) => ({
        id: demo.id,
        source: 'demo' as const,
        status: 'COMPLETE',
        vehicleInfo: demo.vehicleInfo,
        conditionScore: demo.conditionScore.overallScore,
        trustScore: demo.trustScore.overallTrustScore,
        trustBand: demo.trustScore.trustBand,
        createdAt: demo.inspectionDate,
      }));

      setItems([...dbItems, ...demoItems]);
    } catch (err) {
      const demoItems: HistoryItem[] = DEMO_INSPECTIONS.map((demo) => ({
        id: demo.id,
        source: 'demo' as const,
        status: 'COMPLETE',
        vehicleInfo: demo.vehicleInfo,
        conditionScore: demo.conditionScore.overallScore,
        trustScore: demo.trustScore.overallTrustScore,
        trustBand: demo.trustScore.trustBand,
        createdAt: demo.inspectionDate,
      }));
      setItems(demoItems);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleDelete = async (id: string, source: 'database' | 'demo') => {
    if (source === 'demo') {
      alert('Demonstration audits are protected from deletion.');
      return;
    }

    if (confirm('Are you sure you want to archive (soft delete) this inspection record?')) {
      try {
        await inspectionApi.delete(id);
        setItems((prev) => prev.filter((i) => i.id !== id));
      } catch (err: any) {
        alert('Failed to delete inspection: ' + (err.response?.data?.error?.message || err.message));
      }
    }
  };

  const filtered = items.filter((i) =>
    `${i.vehicleInfo.make} ${i.vehicleInfo.model} ${i.vehicleInfo.location || ''}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <AppShell
      title="Inspection History"
      subtitle="Review all previously submitted vehicle audits and MongoDB persistence records."
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-6)', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Badge variant="primary" icon={<Database size={12} />}>
            {items.filter((i) => i.source === 'database').length} In Database
          </Badge>
          <span style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
            Showing {filtered.length} of {items.length} total inspections
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
                  {insp.source === 'demo' ? (
                    <Badge variant="warning" style={{ fontSize: '0.6875rem' }}>Demo Audit</Badge>
                  ) : (
                    <Badge variant={insp.status === 'COMPLETE' ? 'success' : 'info'} style={{ fontSize: '0.6875rem' }}>
                      DB: {insp.status}
                    </Badge>
                  )}
                  {insp.trustBand && <RiskIndicator trustBand={insp.trustBand} size="sm" />}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: '0.8125rem', color: 'var(--color-text-secondary)', flexWrap: 'wrap' }}>
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
                  <span>•</span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <Calendar size={12} /> {new Date(insp.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', flexWrap: 'wrap' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '0.6875rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-muted)', fontWeight: 600 }}>
                    Condition Score
                  </div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-primary-light)' }}>
                    {insp.conditionScore !== undefined ? `${insp.conditionScore}/100` : 'Pending'}
                  </div>
                </div>

                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '0.6875rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-muted)', fontWeight: 600 }}>
                    Trust Score
                  </div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 800, color: (insp.trustScore || 0) >= 70 ? 'var(--color-success-text)' : 'var(--color-warning-text)' }}>
                    {insp.trustScore !== undefined ? `${insp.trustScore}/100` : 'Pending'}
                  </div>
                </div>

                <Link href={`/inspect/${insp.id}`} className="btn btn-secondary btn-sm">
                  View Audit <ArrowRight size={14} />
                </Link>

                {insp.source === 'database' && (
                  <button
                    onClick={() => handleDelete(insp.id, insp.source)}
                    className="btn btn-ghost btn-sm"
                    style={{ color: 'var(--color-danger-text)', padding: 8 }}
                    title="Soft delete record"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </AppShell>
  );
}
