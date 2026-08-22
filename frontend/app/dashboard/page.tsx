'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { inspectionApi } from '@/lib/api';
import { Inspection } from '@/lib/types';
import { Plus, FileText, Clock, CheckCircle, AlertCircle, Loader, Car } from 'lucide-react';

const STATUS_CONFIG = {
  pending:    { label: 'Pending', color: '#9BA3C2', icon: Clock },
  processing: { label: 'Analysing', color: '#3B82F6', icon: Loader },
  complete:   { label: 'Complete', color: '#10B981', icon: CheckCircle },
  failed:     { label: 'Failed', color: '#EF4444', icon: AlertCircle },
};

const REC_COLORS = {
  RECOMMENDED:      '#10B981',
  CONSIDER_INSPECT: '#3B82F6',
  PROCEED_CAUTION:  '#F59E0B',
  AVOID:            '#EF4444',
};

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ name: string } | null>(null);
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('autotrust_user');
    if (!stored) { router.push('/auth/login'); return; }
    setUser(JSON.parse(stored));

    const fetchInspections = async () => {
      try {
        const { data } = await inspectionApi.list();
        setInspections(data.data);
      } catch {
        setInspections([]);
      } finally {
        setLoading(false);
      }
    };
    fetchInspections();
  }, [router]);

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />
      <div className="container" style={{ padding: 'var(--space-10) var(--space-6)', flex: 1 }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-8)' }}>
          <div>
            <h1 className="heading-lg">My Inspections</h1>
            <p style={{ color: 'var(--color-text-secondary)', marginTop: 4 }}>
              Welcome back{user ? `, ${user.name.split(' ')[0]}` : ''}. Here are your inspection reports.
            </p>
          </div>
          <Link href="/inspect" className="btn btn-primary">
            <Plus size={16} /> New Inspection
          </Link>
        </div>

        {/* Content */}
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-16)' }}>
            <Loader size={36} color="var(--color-primary-light)" className="animate-spin" />
          </div>
        ) : inspections.length === 0 ? (
          <div className="empty-state">
            <Car size={64} color="var(--color-text-muted)" />
            <h3 className="heading-md">No inspections yet</h3>
            <p style={{ maxWidth: 360, textAlign: 'center' }}>
              Start your first AI-powered vehicle inspection. Upload photos and get a full condition report.
            </p>
            <Link href="/inspect" className="btn btn-primary">
              <Plus size={16} /> Start First Inspection
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {inspections.map((inspection) => {
              const vi = inspection.vehicleInfo;
              const sc = STATUS_CONFIG[inspection.status];
              const StatusIcon = sc.icon;
              const recommendation = inspection.aiResults?.finalAssessment?.recommendation;
              const trustScore = inspection.aiResults?.finalAssessment?.trustScore;

              return (
                <Link key={inspection._id} href={`/inspect/${inspection._id}`} style={{ textDecoration: 'none' }}>
                  <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', cursor: 'pointer', transition: 'transform 0.15s, border-color 0.15s' }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = 'translateX(4px)'; (e.currentTarget as HTMLElement).style.borderColor = 'var(--color-border-strong)'; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = 'translateX(0)'; (e.currentTarget as HTMLElement).style.borderColor = 'var(--color-border)'; }}>

                    {/* Vehicle icon */}
                    <div style={{ width: 48, height: 48, borderRadius: 'var(--radius-md)', background: 'var(--color-surface-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Car size={24} color="var(--color-text-muted)" />
                    </div>

                    {/* Vehicle info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, marginBottom: 2 }}>
                        {vi.make?.replace('_', ' ').toUpperCase()} {vi.model} {vi.variant}
                      </div>
                      <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
                        {vi.year} · {vi.fuelType} · {vi.mileageKm?.toLocaleString('en-IN')} km · ₹{vi.askingPrice?.toLocaleString('en-IN')}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: 2 }}>
                        {new Date(inspection.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </div>
                    </div>

                    {/* Trust score */}
                    {trustScore !== undefined && (
                      <div style={{ textAlign: 'center', flexShrink: 0 }}>
                        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.5rem', color: trustScore >= 70 ? '#10B981' : trustScore >= 45 ? '#F59E0B' : '#EF4444' }}>
                          {Math.round(trustScore)}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>Score</div>
                      </div>
                    )}

                    {/* Recommendation badge */}
                    {recommendation && (
                      <span className="badge" style={{ background: REC_COLORS[recommendation] + '20', color: REC_COLORS[recommendation], border: `1px solid ${REC_COLORS[recommendation]}40`, flexShrink: 0, whiteSpace: 'nowrap' }}>
                        {recommendation.replace(/_/g, ' ')}
                      </span>
                    )}

                    {/* Status */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                      <StatusIcon size={14} color={sc.color} className={inspection.status === 'processing' ? 'animate-spin' : undefined} />
                      <span style={{ fontSize: '0.8125rem', color: sc.color, fontWeight: 500 }}>{sc.label}</span>
                    </div>

                    <FileText size={16} color="var(--color-text-muted)" />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
