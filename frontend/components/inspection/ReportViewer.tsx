'use client';
import React from 'react';
import Link from 'next/link';
import {
  Shield,
  Sparkles,
  Eye,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  HelpCircle,
  MapPin,
  Calendar,
  Layers,
  ArrowLeft,
  Printer,
  TrendingUp,
  Info,
} from 'lucide-react';
import { CARWISEInspectionReport } from '@/lib/types';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { ScoreIndicator } from '@/components/ui/ScoreIndicator';
import { RiskIndicator } from '@/components/ui/RiskIndicator';
import { Badge } from '@/components/ui/Badge';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';

export interface ReportViewerProps {
  report: CARWISEInspectionReport;
}

export function ReportViewer({ report }: ReportViewerProps) {
  const { vehicleInfo, conditionScore, evidenceConfidence, trustScore, detections, crossViewObservations, priceValuation, prioritizedChecklist, finalRecommendation } = report;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-8)' }}>
      {/* ── Demo Notice Watermark Banner ────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: 'var(--space-3) var(--space-4)',
          borderRadius: 'var(--radius-md)',
          background: 'rgba(245, 158, 11, 0.12)',
          border: '1px dashed var(--color-warning-border)',
          color: 'var(--color-warning-text)',
          fontSize: '0.8125rem',
          flexWrap: 'wrap',
          gap: 8,
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600 }}>
          <Sparkles size={14} /> Demonstration Assessment Report (Phase 2 UI Architecture)
        </span>
        <span style={{ fontSize: '0.75rem', opacity: 0.9 }}>
          Values represent simulated fixtures pending live AI service integration.
        </span>
      </div>

      {/* ── Section 1: Vehicle Header Summary Card ──────────────────── */}
      <Card elevated>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <h1 className="heading-xl">
                {vehicleInfo.year} {vehicleInfo.make} {vehicleInfo.model}
              </h1>
              <RiskIndicator trustBand={trustScore.trustBand} />
            </div>
            <p style={{ fontSize: '1rem', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-4)' }}>
              {vehicleInfo.variant || 'Standard'} • {vehicleInfo.fuelType.toUpperCase()} • {vehicleInfo.transmission.toUpperCase()}
            </p>

            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', fontSize: '0.8125rem', color: 'var(--color-text-muted)', flexWrap: 'wrap' }}>
              <span>Odometer: <strong style={{ color: 'var(--color-text-primary)' }}>{vehicleInfo.mileageKm.toLocaleString()} km</strong></span>
              <span>•</span>
              <span>Asking Price: <strong style={{ color: 'var(--color-text-primary)' }}>₹{(vehicleInfo.askingPrice / 100000).toFixed(2)} Lakhs</strong></span>
              {vehicleInfo.location && (
                <>
                  <span>•</span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <MapPin size={13} /> {vehicleInfo.location}
                  </span>
                </>
              )}
              <span>•</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <Calendar size={13} /> {new Date(report.inspectionDate).toLocaleDateString()}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            <Button variant="secondary" size="sm" leftIcon={<Printer size={14} />} onClick={handlePrint}>
              Print Report
            </Button>
            <Link href="/inspect" className="btn btn-primary btn-sm">
              New Inspection
            </Link>
          </div>
        </div>
      </Card>

      {/* ── Section 2: Dual Scores & Evidence Gauge Row ─────────────── */}
      <div className="grid-3">
        {/* Condition Score */}
        <ScoreIndicator
          type="condition"
          score={conditionScore.overallScore}
          subLabel="Observable Cosmetic Integrity (0–100)"
          size="lg"
        />

        {/* Evidence Confidence */}
        <ScoreIndicator
          type="evidence"
          score={evidenceConfidence.visualCoverageIndex}
          subLabel={`${evidenceConfidence.mandatoryAnglesSubmitted}/4 Mandatory • ${evidenceConfidence.optionalAnglesSubmitted}/8 Optional Views`}
          size="lg"
        />

        {/* Assessment Trust Score */}
        <ScoreIndicator
          type="trust"
          score={trustScore.overallTrustScore}
          subLabel="Buyer Assessment Certainty (0–100)"
          size="lg"
        />
      </div>

      {/* ── Section 3: Evidence Completeness & Blindspot Warnings ────── */}
      <Card>
        <CardHeader>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Eye size={18} color="var(--color-accent-light)" />
            <h3 className="heading-md">Evidence Completeness & Visual Blindspots</h3>
          </div>
          <Badge variant={(evidenceConfidence?.visualCoverageIndex || 0) >= 0.8 ? 'success' : 'warning'}>
            {Math.round((evidenceConfidence?.visualCoverageIndex || 0) * 100)}% Visual Coverage
          </Badge>
        </CardHeader>

        <CardBody>
          <div className="grid-2">
            <div>
              <h4 style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: 'var(--space-2)', color: 'var(--color-text-primary)' }}>
                Visual Evidence Breakdown
              </h4>
              <ul style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', display: 'flex', flexDirection: 'column', gap: 6, paddingLeft: 18 }}>
                <li>Mandatory Angles: <strong>{evidenceConfidence.mandatoryAnglesSubmitted} of 4</strong> submitted.</li>
                <li>Optional Perspectives: <strong>{evidenceConfidence.optionalAnglesSubmitted} of 8</strong> submitted.</li>
                <li>Data Field Completeness: <strong>{Math.round(evidenceConfidence.dataCompletenessRatio * 100)}%</strong>.</li>
              </ul>
            </div>

            <div>
              <h4 style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: 'var(--space-2)', color: 'var(--color-warning-text)' }}>
                Identified Visual Blindspots
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {evidenceConfidence.uninspectedBlindspots.map((blindspot, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
                    <AlertTriangle size={13} color="var(--color-warning-text)" />
                    <span>{blindspot}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* ── Section 4: Cross-View Vehicle-Zone Reasoning Card ───────── */}
      <Card elevated style={{ borderLeft: '4px solid var(--color-primary)' }}>
        <CardHeader>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Layers size={18} color="var(--color-primary-light)" />
            <h3 className="heading-md">Cross-View Vehicle-Zone Observations</h3>
          </div>
          <Badge variant="primary">Multi-View Correlation</Badge>
        </CardHeader>

        <CardBody>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            {crossViewObservations.map((obs, idx) => (
              <div
                key={idx}
                style={{
                  padding: 'var(--space-4)',
                  background: 'var(--color-surface-elevated)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-border-subtle)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--color-primary-light)' }}>
                    {obs.zoneTitle} ({obs.vehicleZone})
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
                    Involved angles: {obs.involvedViews.join(', ')}
                  </span>
                </div>
                <p style={{ fontSize: '0.875rem', color: 'var(--color-text-primary)', lineHeight: 1.6, marginBottom: 8 }}>
                  {obs.observedFinding}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8125rem', color: 'var(--color-warning-text)' }}>
                  <Info size={14} />
                  <span><strong>Recommended Physical Action:</strong> {obs.recommendedAction}</span>
                </div>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>

      {/* ── Section 5: Observable Damage Findings (8-Zone Mapping) ───── */}
      <Card>
        <CardHeader>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Sparkles size={18} color="var(--color-accent-light)" />
            <h3 className="heading-md">Detected Visible Abnormalities ({detections.length})</h3>
          </div>
          <Badge variant="default">Observable Evidence</Badge>
        </CardHeader>

        <CardBody>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {detections.map((det) => (
              <div
                key={det._id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: 'var(--space-3) var(--space-4)',
                  background: 'var(--color-surface-elevated)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-border-subtle)',
                  flexWrap: 'wrap',
                  gap: 12,
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <strong style={{ fontSize: '0.875rem', color: 'var(--color-text-primary)' }}>{det.component}</strong>
                    <Badge variant={det.severity === 'severe' ? 'danger' : det.severity === 'moderate' ? 'warning' : 'default'} style={{ fontSize: '0.6875rem' }}>
                      {det.severity} {det.damageType.replace('_', ' ')}
                    </Badge>
                  </div>
                  {det.notes && (
                    <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: 2 }}>
                      {det.notes}
                    </p>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                  <span>Zone: <strong>{det.vehicleZone}</strong></span>
                  <span>•</span>
                  <span>Perspective: <strong>{det.imageAngle}</strong></span>
                  <span>•</span>
                  <span>Conf: <strong>{Math.round(det.confidence * 100)}%</strong></span>
                </div>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>

      {/* ── Section 6: Fair-Market Price Valuation Section ──────────── */}
      <Card>
        <CardHeader>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <TrendingUp size={18} color="var(--color-info-text)" />
            <h3 className="heading-md">Fair-Market Price Valuation Analysis</h3>
          </div>
          <Badge variant="warning">Pending Dataset Validation</Badge>
        </CardHeader>

        <CardBody>
          <Alert variant="info" style={{ marginBottom: 'var(--space-4)' }}>
            <strong>Academic Integrity Disclosure:</strong> {priceValuation.valuationNote}
          </Alert>

          <div className="grid-3">
            <div style={{ background: 'var(--color-surface-elevated)', padding: 'var(--space-4)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Estimated Fair Low</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 700, marginTop: 2 }}>
                ₹{((priceValuation.fairRangeLow || 0) / 100000).toFixed(2)} Lakhs
              </div>
            </div>

            <div style={{ background: 'var(--color-surface-elevated)', padding: 'var(--space-4)', borderRadius: 'var(--radius-md)', textAlign: 'center', border: '1px solid var(--color-primary)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-primary-light)', textTransform: 'uppercase', fontWeight: 600 }}>Estimated Fair Median</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 800, marginTop: 2, color: 'var(--color-primary-light)' }}>
                ₹{((priceValuation.fairMedian || 0) / 100000).toFixed(2)} Lakhs
              </div>
            </div>

            <div style={{ background: 'var(--color-surface-elevated)', padding: 'var(--space-4)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Estimated Fair High</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 700, marginTop: 2 }}>
                ₹{((priceValuation.fairRangeHigh || 0) / 100000).toFixed(2)} Lakhs
              </div>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* ── Section 7: Prioritized Physical Checklist ───────────────── */}
      <Card elevated>
        <CardHeader>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <CheckCircle2 size={18} color="var(--color-success-text)" />
            <h3 className="heading-md">Prioritized In-Person Inspection Checklist</h3>
          </div>
          <Badge variant="success">Actionable Steps</Badge>
        </CardHeader>

        <CardBody>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {prioritizedChecklist.map((item) => (
              <div
                key={item.id}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 12,
                  padding: 'var(--space-3) var(--space-4)',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--color-surface-elevated)',
                  border: '1px solid var(--color-border-subtle)',
                }}
              >
                <Badge variant={item.priority === 'HIGH' ? 'danger' : item.priority === 'MEDIUM' ? 'warning' : 'default'} style={{ fontSize: '0.6875rem', marginTop: 2 }}>
                  {item.priority}
                </Badge>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--color-text-primary)' }}>
                    {item.item} ({item.zone})
                  </div>
                  <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', marginTop: 2 }}>
                    {item.rationale}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>

      {/* ── Section 8: Final Recommendation Verdict ─────────────────── */}
      <Card
        elevated
        style={{
          background: finalRecommendation.verdict === 'RECOMMENDED_FOR_INSPECTION'
            ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.1), var(--color-surface-elevated))'
            : 'linear-gradient(135deg, rgba(239, 68, 68, 0.1), var(--color-surface-elevated))',
          border: `1px solid ${finalRecommendation.verdict === 'RECOMMENDED_FOR_INSPECTION' ? 'var(--color-success-border)' : 'var(--color-danger-border)'}`,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 'var(--radius-full)',
              background: finalRecommendation.verdict === 'RECOMMENDED_FOR_INSPECTION' ? 'var(--color-success-bg)' : 'var(--color-danger-bg)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            {finalRecommendation.verdict === 'RECOMMENDED_FOR_INSPECTION' ? (
              <Shield size={24} color="var(--color-success-text)" />
            ) : (
              <AlertTriangle size={24} color="var(--color-danger-text)" />
            )}
          </div>
          <div>
            <h3 className="heading-lg" style={{ marginBottom: 'var(--space-2)' }}>
              Final Recommendation: {finalRecommendation.summaryHeading}
            </h3>
            <p style={{ fontSize: '0.9375rem', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
              {finalRecommendation.summaryText}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
