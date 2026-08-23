'use client';
import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Database, Sparkles, AlertTriangle, CheckCircle2, RefreshCw } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { ReportViewer } from '@/components/inspection/ReportViewer';
import { DEMO_INSPECTIONS } from '@/lib/mockData';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingCard } from '@/components/ui/LoadingState';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { DamageOverlayViewer } from '@/components/ui/DamageOverlayViewer';
import { EvidenceSummaryCard } from '@/components/inspection/EvidenceSummaryCard';
import { inspectionApi } from '@/lib/api';
import { CARWISEInspectionReport } from '@/lib/types';

export default function InspectionReportPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const id = resolvedParams.id;

  const [loading, setLoading] = useState(true);
  const [analyzingDamage, setAnalyzingDamage] = useState(false);
  const [analyzingEvidence, setAnalyzingEvidence] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<CARWISEInspectionReport | null>(null);
  const [dbInspection, setDbInspection] = useState<any | null>(null);

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
        if (doc.conditionScore && doc.trustScore && doc.evidenceAssessment) {
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
              summaryHeading: 'Inspection Record Active',
              summaryText: 'This record was evaluated with YOLO11s (CarDD Baseline v1) and Phase 8 Evidence Reasoning.',
            },
          });
        }
      } else {
        setError('Inspection not found in database.');
      }
    } catch (err: any) {
      console.warn('DB fetch notice, falling back to demo:', err.message);
      setReport(DEMO_INSPECTIONS[0]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRecord();
  }, [id]);

  const handleRunDamageDetection = async () => {
    try {
      setAnalyzingDamage(true);
      await inspectionApi.runDamageDetection(id);
      await loadRecord();
    } catch (err: any) {
      console.error('Failed to run damage detection:', err);
    } finally {
      setAnalyzingDamage(false);
    }
  };

  const handleRunEvidenceReasoning = async () => {
    try {
      setAnalyzingEvidence(true);
      await inspectionApi.analyzeEvidence(id);
      await loadRecord();
    } catch (err: any) {
      console.error('Failed to run evidence reasoning:', err);
    } finally {
      setAnalyzingEvidence(false);
    }
  };

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

  // If inspection exists in DB with images / damage detections
  if (dbInspection && !report) {
    const v = dbInspection.vehicleInfo;
    const images = dbInspection.images || [];
    const damageDetections = dbInspection.damageDetections || [];
    const evidenceAssessment = dbInspection.evidenceAssessment;

    return (
      <AppShell
        title={`Vehicle Record: ${v.year} ${v.make} ${v.model}`}
        subtitle={`MongoDB Persisted Inspection (${dbInspection._id})`}
        action={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              loading={analyzingEvidence}
              leftIcon={<Sparkles size={14} />}
              onClick={handleRunEvidenceReasoning}
            >
              {evidenceAssessment ? 'Re-evaluate Evidence Reasoning' : 'Run Phase 8 Evidence Reasoning'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              loading={analyzingDamage}
              leftIcon={<Sparkles size={14} />}
              onClick={handleRunDamageDetection}
            >
              {damageDetections.length > 0 ? 'Re-run CV Detection' : 'Run YOLO11s Damage Detection'}
            </Button>
            <Link href="/dashboard" className="btn btn-ghost btn-sm">
              <ArrowLeft size={14} /> Back to Dashboard
            </Link>
          </div>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          {/* Phase 8 Evidence Summary Card if evaluated */}
          {evidenceAssessment && (
            <EvidenceSummaryCard evidence={evidenceAssessment} />
          )}

          {/* Phase 7C Status Alert */}
          {!evidenceAssessment && (
            <Alert variant="info">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Sparkles size={16} />
                  <span>
                    <strong>Phase 7C & 8 Active:</strong> Run Evidence Reasoning to compute the deterministic Vehicle Condition Score V1 and zone aggregations.
                  </span>
                </div>
                <Badge variant="primary">YOLO11s Active</Badge>
              </div>
            </Alert>
          )}

          {/* Vehicle Specifications Overview */}
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

              {/* Perspected Images & Bounding Box Overlay Grid */}
              {images.length > 0 && (
                <div style={{ marginTop: 'var(--space-6)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-4)' }}>
                    <div>
                      <h3 className="heading-sm">Perspective Images & Localized Damage Detections</h3>
                      <p className="text-secondary" style={{ fontSize: '0.8125rem' }}>
                        Visualizing localized cosmetic flaws with responsive bounding boxes and confidence categorization.
                      </p>
                    </div>
                    <Badge variant="default">{images.length} Perspectives</Badge>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {images.map((img: any) => {
                      const detRecord = damageDetections.find((d: any) => d.imageId === img.imageId || d.viewType === img.viewType);
                      const imageUrl = inspectionApi.getImageUrl(dbInspection._id, img.imageId);

                      return (
                        <DamageOverlayViewer
                          key={img.imageId || img.viewType}
                          imageUrl={imageUrl}
                          viewType={img.viewType}
                          status={detRecord?.status || img.qualityStatus === 'FAIL' ? 'BLOCKED_BY_IQA' : 'COMPLETE'}
                          detections={detRecord?.detections || []}
                          modelMetadata={detRecord?.modelMetadata}
                          iqaMeta={{
                            qualityStatus: img.qualityStatus,
                            qualityWarning: img.qualityStatus === 'WARN',
                          }}
                        />
                      );
                    })}
                  </div>
                </div>
              )}
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
