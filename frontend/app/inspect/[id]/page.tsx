'use client';
import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Database, Sparkles, Clock, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { ReportViewer } from '@/components/inspection/ReportViewer';
import { DEMO_INSPECTIONS } from '@/lib/mockData';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingCard } from '@/components/ui/LoadingState';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Alert } from '@/components/ui/Alert';
import { inspectionApi } from '@/lib/api';
import { CARWISEInspectionReport } from '@/lib/types';

export default function InspectionReportPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const id = resolvedParams.id;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<CARWISEInspectionReport | null>(null);
  const [dbInspection, setDbInspection] = useState<any | null>(null);

  useEffect(() => {
    async function loadRecord() {
      // 1. Check if this is a known demonstration ID
      const demoMatch = DEMO_INSPECTIONS.find((d) => d.id === id);
      if (demoMatch) {
        setReport(demoMatch);
        setLoading(false);
        return;
      }

      // 2. Otherwise fetch from real MongoDB backend
      try {
        const res = await inspectionApi.get(id);
        if (res.data) {
          const doc = res.data;
          setDbInspection(doc);

          // If the DB doc already contains compiled analytical containers
          if (doc.conditionScore && doc.trustScore) {
            setReport({
              id: doc._id,
              isDemonstrationData: false,
              vehicleInfo: doc.vehicleInfo,
              inspectionDate: doc.createdAt,
              status: doc.status,
              conditionScore: doc.conditionScore,
              evidenceConfidence: doc.evidenceConfidence || {
                visualCoverageIndex: 0.5,
                mandatoryAnglesSubmitted: doc.images?.length || 0,
                optionalAnglesSubmitted: 0,
                uninspectedBlindspots: [],
                dataCompletenessRatio: 0.8,
              },
              trustScore: doc.trustScore,
              detections: doc.detections || [],
              crossViewObservations: doc.crossViewObservations || [],
              priceValuation: doc.priceValuation || {
                status: 'PENDING_DATASET_VALIDATION',
                valuationNote: 'Pricing model pending verified Indian used car dataset.',
              },
              prioritizedChecklist: doc.prioritizedChecklist || [],
              finalRecommendation: doc.finalRecommendation || {
                verdict: 'PROCEED_WITH_CAUTION',
                summaryHeading: 'Inspection Record Pending Live CV & AI Processing',
                summaryText: 'This record was successfully persisted in MongoDB. Analytical evaluation will run in upcoming phases.',
              },
            });
          }
        } else {
          setError('Inspection not found in database.');
        }
      } catch (err: any) {
        console.warn('DB fetch notice, falling back to demo:', err.message);
        // Fallback to demo 1 for seamless preview
        setReport(DEMO_INSPECTIONS[0]);
      } finally {
        setLoading(false);
      }
    }

    loadRecord();
  }, [id]);

  if (loading) {
    return (
      <AppShell title="Loading Vehicle Record">
        <LoadingCard title="Retrieving inspection record from database..." />
      </AppShell>
    );
  }

  if (error && !report && !dbInspection) {
    return (
      <AppShell title="Report Not Found">
        <EmptyState
          title="Inspection Record Not Found"
          description="The requested inspection identifier does not exist or has been deleted."
          actionLabel="Return to Dashboard"
          onAction={() => (window.location.href = '/dashboard')}
        />
      </AppShell>
    );
  }

  // If inspection exists in DB but AI evaluation is pending (Phase 3 state)
  if (dbInspection && !report) {
    const v = dbInspection.vehicleInfo;
    return (
      <AppShell
        title={`Vehicle Record: ${v.year} ${v.make} ${v.model}`}
        subtitle={`MongoDB Persisted Inspection (${dbInspection._id})`}
        action={
          <Link href="/dashboard" className="btn btn-ghost btn-sm">
            <ArrowLeft size={14} /> Back to Dashboard
          </Link>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          <Alert variant="info">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Database size={16} />
              <span>
                <strong>MongoDB Record Active:</strong> This inspection is securely stored in <code>carwise_db</code> with status <strong>{dbInspection.status}</strong>. AI analysis, CV damage detection, and pricing will be connected in subsequent phases.
              </span>
            </div>
          </Alert>

          <Card elevated>
            <CardHeader>
              <div>
                <h2 className="heading-md">{v.year} {v.make} {v.model} {v.variant || ''}</h2>
                <p className="text-muted" style={{ fontSize: '0.8125rem', marginTop: 2 }}>
                  Registered / Created on {new Date(dbInspection.createdAt).toLocaleString()}
                </p>
              </div>
              <Badge variant={dbInspection.status === 'PENDING' ? 'warning' : 'success'}>
                {dbInspection.status}
              </Badge>
            </CardHeader>

            <CardBody>
              <div className="grid-3" style={{ marginBottom: 'var(--space-6)' }}>
                <div style={{ background: 'var(--color-surface-elevated)', padding: 'var(--space-4)', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Odometer Mileage</div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 700, marginTop: 2 }}>{v.mileageKm.toLocaleString()} km</div>
                </div>

                <div style={{ background: 'var(--color-surface-elevated)', padding: 'var(--space-4)', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Asking Price</div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 700, marginTop: 2 }}>₹{(v.askingPrice / 100000).toFixed(2)} Lakhs</div>
                </div>

                <div style={{ background: 'var(--color-surface-elevated)', padding: 'var(--space-4)', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Fuel & Transmission</div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 700, marginTop: 2 }}>{v.fuelType.toUpperCase()} • {v.transmission.toUpperCase()}</div>
                </div>
              </div>

              <div style={{ padding: 'var(--space-4)', background: 'var(--color-surface-elevated)', borderRadius: 'var(--radius-md)', border: '1px dashed var(--color-border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--color-accent-light)', fontWeight: 600, fontSize: '0.875rem', marginBottom: 4 }}>
                  <Clock size={16} /> Phase 3 Architecture Milestone
                </div>
                <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
                  Vehicle specifications successfully validated and saved to <code>carwise_db.inspections</code>. Phase 4 & 5 will enable authenticated media uploads, and Phase 6+ will attach automated CV damage detection and cross-view vehicle-zone reasoning.
                </p>
              </div>
            </CardBody>
          </Card>
        </div>
      </AppShell>
    );
  }

  // Render comprehensive audit report if compiled report is ready
  return (
    <AppShell
      title={`Vehicle Audit: ${report!.vehicleInfo.year} ${report!.vehicleInfo.make} ${report!.vehicleInfo.model}`}
      subtitle={`Comprehensive condition, evidence confidence, and trust assessment report.`}
      action={
        <Link href="/dashboard" className="btn btn-ghost btn-sm">
          <ArrowLeft size={14} /> Back to Dashboard
        </Link>
      }
    >
      <ReportViewer report={report!} />
    </AppShell>
  );
}
