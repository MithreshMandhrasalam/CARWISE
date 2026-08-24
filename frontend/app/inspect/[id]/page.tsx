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
import { EvidenceCoverageCard } from '@/components/inspection/EvidenceCoverageCard';
import { TrustScoreBreakdown } from '@/components/inspection/TrustScoreBreakdown';
import { RepairCostSummaryCard } from '@/components/inspection/RepairCostSummaryCard';
import { ValuationSummaryCard } from '@/components/inspection/ValuationSummaryCard';
import { FinalAssessmentCard } from '@/components/inspection/FinalAssessmentCard';
import { inspectionApi } from '@/lib/api';
import { CARWISEInspectionReport } from '@/lib/types';

export default function InspectionReportPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const id = resolvedParams.id;

  const [loading, setLoading] = useState(true);
  const [analyzingFull, setAnalyzingFull] = useState(false);
  const [analyzingDamage, setAnalyzingDamage] = useState(false);
  const [analyzingEvidence, setAnalyzingEvidence] = useState(false);
  const [analyzingTrust, setAnalyzingTrust] = useState(false);
  const [analyzingRepair, setAnalyzingRepair] = useState(false);
  const [analyzingValuation, setAnalyzingValuation] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<CARWISEInspectionReport | null>(null);
  const [dbInspection, setDbInspection] = useState<any | null>(null);

  async function loadRecord() {
    // 1. Check if this is a known demonstration ID
    const demoMatch = DEMO_INSPECTIONS.find((d) => d.id === id);
    if (demoMatch) {
      // Build a comprehensive dbInspection structure from the demo match
      setDbInspection({
        _id: demoMatch.id,
        createdAt: demoMatch.inspectionDate,
        status: demoMatch.status,
        vehicleInfo: demoMatch.vehicleInfo,
        images: demoMatch.detections.map((d, i) => ({
          imageId: `demo-img-${i}`,
          viewType: d.imageAngle.toUpperCase(),
          qualityStatus: 'PASS',
          qualityScore: 92,
        })),
        conditionScore: demoMatch.conditionScore,
        trustScore: demoMatch.trustScore,
        evidenceAssessment: {
          conditionScore: demoMatch.conditionScore,
          trustScore: demoMatch.trustScore,
          evidenceCompleteness: {
            mandatoryCoverage: demoMatch.evidenceConfidence.mandatoryAnglesSubmitted / 4,
            optionalCoverage: demoMatch.evidenceConfidence.optionalAnglesSubmitted / 8,
            totalCoverage: demoMatch.evidenceConfidence.visualCoverageIndex,
            uninspectedBlindspots: demoMatch.evidenceConfidence.uninspectedBlindspots,
          },
          zoneObservations: demoMatch.crossViewObservations,
          damageFindings: demoMatch.detections,
        },
        repairCostAssessment: {
          status: 'ESTIMATED',
          formulaVersion: 'REPAIR_V1',
          totalEstimatedRange: { min: 14500, max: 22800, median: 18650 },
          itemizedRepairs: [
            { finding: 'Bumper Scuff and Scratch', repairAction: 'Paint Touch-Up & Buffing', costRange: { min: 4500, max: 7000 } },
            { finding: 'Door Panel Dent', repairAction: 'Paintless Dent Removal (PDR)', costRange: { min: 10000, max: 15800 } },
          ],
        },
        priceValuation: {
          status: 'VALUATED',
          formulaVersion: 'VALUATION_V1',
          fairMarketValueRange: { min: 780000, max: 860000, midpoint: 820000 },
          askingPriceAssessment: {
            askingPrice: demoMatch.vehicleInfo.askingPrice,
            pricePosition: demoMatch.vehicleInfo.askingPrice > 860000 ? 'ABOVE_FAIR_RANGE' : 'FAIRLY_PRICED',
            premiumAmount: Math.max(0, demoMatch.vehicleInfo.askingPrice - 820000),
          },
        },
        finalAssessment: {
          assessmentVersion: 'CARWISE_ASSESSMENT_V1',
          overallStatus: demoMatch.status === 'COMPLETED' ? 'COMPLETED' : 'LIMITED_ASSESSMENT',
          executiveVerdict: {
            verdictCode: demoMatch.finalRecommendation.verdict,
            badgeVariant: demoMatch.finalRecommendation.verdict === 'PROCEED_WITH_CAUTION' ? 'warning' : 'primary',
            title: demoMatch.finalRecommendation.summaryHeading,
            recommendation: demoMatch.finalRecommendation.summaryText,
          },
          timings: { totalOrchestrationTimeMs: 12.4 },
          limitations: demoMatch.trustScore.limitations,
        },
      });
      setLoading(false);
      return;
    }

    // 2. Otherwise fetch from real MongoDB backend
    try {
      const res = await inspectionApi.get(id);
      if (res.data) {
        const doc = res.data;
        setDbInspection(doc);

        // If doc has images but no finalAssessment yet, automatically run full assessment
        if (!doc.finalAssessment && doc.images && doc.images.length > 0) {
          try {
            const autoRes = await inspectionApi.runFullAssessment(id, 'TIER_2');
            if (autoRes.success && autoRes.data?.assessment) {
              setDbInspection((prev: any) => ({
                ...prev,
                ...autoRes.data,
                finalAssessment: autoRes.data.assessment,
              }));
            }
          } catch (autoErr) {
            console.warn('Auto assessment trigger note:', autoErr);
          }
        }
      } else {
        setError('Inspection not found in database.');
      }
    } catch (err: any) {
      console.warn('DB fetch notice, loading demonstration baseline:', err.message);
      // Construct fallback from DEMO_INSPECTIONS[0]
      const fallbackDemo = DEMO_INSPECTIONS[0];
      setDbInspection({
        _id: fallbackDemo.id,
        createdAt: fallbackDemo.inspectionDate,
        status: fallbackDemo.status,
        vehicleInfo: fallbackDemo.vehicleInfo,
        conditionScore: fallbackDemo.conditionScore,
        trustScore: fallbackDemo.trustScore,
        finalAssessment: {
          assessmentVersion: 'CARWISE_ASSESSMENT_V1',
          overallStatus: 'COMPLETED',
          executiveVerdict: {
            verdictCode: 'READY_FOR_DECISION',
            badgeVariant: 'success',
            title: 'Verified Demonstration Assessment',
            recommendation: 'Baseline assessment complete. Physical vehicle inspection recommended.',
          },
          timings: { totalOrchestrationTimeMs: 8.5 },
          limitations: ['Demonstration data baseline.'],
        },
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRecord();
  }, [id]);

  const handleRunFullAssessment = async () => {
    try {
      setAnalyzingFull(true);
      await inspectionApi.runFullAssessment(id, 'TIER_2');
      await loadRecord();
    } catch (err: any) {
      console.error('Failed to run full assessment:', err);
    } finally {
      setAnalyzingFull(false);
    }
  };

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

  const handleRunTrustAnalysis = async () => {
    try {
      setAnalyzingTrust(true);
      await inspectionApi.analyzeTrust(id);
      await loadRecord();
    } catch (err: any) {
      console.error('Failed to run trust analysis:', err);
    } finally {
      setAnalyzingTrust(false);
    }
  };

  const handleRunRepairCostEstimate = async () => {
    try {
      setAnalyzingRepair(true);
      await inspectionApi.estimateRepairCost(id, 'TIER_2');
      await loadRecord();
    } catch (err: any) {
      console.error('Failed to estimate repair cost:', err);
    } finally {
      setAnalyzingRepair(false);
    }
  };

  const handleRunValuationEvaluation = async () => {
    try {
      setAnalyzingValuation(true);
      await inspectionApi.evaluateValuation(id);
      await loadRecord();
    } catch (err: any) {
      console.error('Failed to evaluate valuation:', err);
    } finally {
      setAnalyzingValuation(false);
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
    const trustScoreData = evidenceAssessment?.trustScore || dbInspection.trustScore;
    const completenessData = evidenceAssessment?.evidenceCompleteness;
    const repairCostData = dbInspection.repairCostAssessment;
    const valuationData = dbInspection.priceValuation;
    const finalAssessmentData = dbInspection.finalAssessment;

    return (
      <AppShell
        title={`Vehicle Record: ${v.year} ${v.make} ${v.model}`}
        subtitle={`MongoDB Persisted Inspection (${dbInspection._id})`}
        action={
          <div className="flex items-center gap-2">
            <Button
              variant="primary"
              size="sm"
              loading={analyzingFull}
              leftIcon={<Sparkles size={14} />}
              onClick={handleRunFullAssessment}
            >
              {finalAssessmentData ? 'Re-run Full Assessment' : 'Run Full CARWISE Assessment'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              loading={analyzingValuation}
              leftIcon={<Sparkles size={14} />}
              onClick={handleRunValuationEvaluation}
            >
              {valuationData?.fairMarketValueRange?.midpoint ? 'Valuation' : 'Evaluate Valuation'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              loading={analyzingRepair}
              leftIcon={<Sparkles size={14} />}
              onClick={handleRunRepairCostEstimate}
            >
              {repairCostData ? 'Repair' : 'Estimate Repair'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              loading={analyzingTrust}
              leftIcon={<Sparkles size={14} />}
              onClick={handleRunTrustAnalysis}
            >
              {trustScoreData?.trustScore !== null && trustScoreData?.trustScore !== undefined
                ? 'Trust'
                : 'Trust Score'}
            </Button>
            <Link href="/dashboard" className="btn btn-ghost btn-sm">
              <ArrowLeft size={14} /> Back to Dashboard
            </Link>
          </div>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          {/* Unanalyzed Callout Banner */}
          {!finalAssessmentData && (
            <Card elevated className="border-2 border-primary-500/40 bg-gradient-to-r from-blue-950/60 to-slate-900/90 p-6">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="p-3 rounded-2xl bg-primary-500/20 text-primary-400 border border-primary-500/30">
                    <Sparkles size={26} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-100">Ready for Complete Assessment</h3>
                    <p className="text-xs text-slate-300 mt-0.5">
                      Run the unified CARWISE analysis pipeline to evaluate Observable Condition, Buyer Trust, Estimated Repairs, and Fair Market Valuation.
                    </p>
                  </div>
                </div>
                <Button
                  variant="primary"
                  size="md"
                  loading={analyzingFull}
                  leftIcon={<Sparkles size={16} />}
                  onClick={handleRunFullAssessment}
                >
                  Run Full CARWISE Assessment
                </Button>
              </div>
            </Card>
          )}

          {/* Phase 12 Final Executive Assessment Card */}
          {finalAssessmentData && (
            <FinalAssessmentCard
              assessment={{
                ...finalAssessmentData,
                conditionScore: dbInspection.conditionScore,
                trustScore: trustScoreData,
                repairCostAssessment: repairCostData,
                priceValuation: valuationData,
              }}
            />
          )}

          {/* Phase 11 Fair Market Valuation Summary Card */}
          {valuationData && valuationData.fairMarketValueRange && (
            <ValuationSummaryCard valuationData={valuationData} />
          )}

          {/* Phase 10 Repair Cost Summary Card */}
          {repairCostData && (
            <RepairCostSummaryCard repairData={repairCostData} />
          )}

          {/* Phase 9 Buyer Assessment Trust Card */}
          {trustScoreData && (
            <TrustScoreBreakdown trustData={trustScoreData} />
          )}

          {/* Phase 9 Evidence Coverage Card */}
          {completenessData && (
            <EvidenceCoverageCard completeness={completenessData} />
          )}

          {/* Phase 8 Evidence Summary Card */}
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
