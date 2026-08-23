'use client';

import React from 'react';
import {
  ShieldAlert,
  Sparkles,
  Layers,
  AlertTriangle,
  Info,
  CheckCircle2,
  HelpCircle,
  Eye,
  FileText,
} from 'lucide-react';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Alert } from '@/components/ui/Alert';

export interface EvidenceAssessmentData {
  version: string;
  totalEvidenceCount: number;
  uniqueFindingCount: number;
  findings: Array<{
    evidenceId: string;
    imageId?: string;
    viewType: string;
    zone: string;
    damageClass: string;
    modelConfidence: number;
    confidenceBand: string;
    bbox: { xMin: number; yMin: number; xMax: number; yMax: number };
    bboxAreaRatio: number;
    severity: string;
    severityBasis: string[];
    mappingConfidence: string;
    mappingBasis: string;
    requiresPhysicalVerification: boolean;
    isDuplicateEvidence: boolean;
    duplicateOf?: string | null;
    qualityWarning?: boolean;
  }>;
  zones: Array<{
    zone: string;
    findingCount: number;
    highestSeverity: string;
    evidencePriority: number;
    findings: any[];
  }>;
  crossViewObservations: Array<{
    observationId: string;
    type: string;
    severity: string;
    zones: string[];
    evidenceIds: string[];
    statement: string;
    requiresPhysicalVerification: boolean;
  }>;
  conditionScore: {
    score: number;
    formulaVersion: string;
    baseScore: number;
    deductions: Array<{
      reason: string;
      zone: string;
      severity: string;
      points: number;
    }>;
    explanation: string;
    limitations: string[];
  };
  evidenceCompleteness: {
    coverageScore: number;
    mandatoryViewsComplete: boolean;
    usableImageCount: number;
    submittedViews: string[];
    blindspots: string[];
    warnings: string[];
  };
  trustScore: {
    trustScore: number | null;
    status: string;
    reason: string;
  };
  limitations: string[];
}

interface EvidenceSummaryCardProps {
  evidence: EvidenceAssessmentData;
}

export const EvidenceSummaryCard: React.FC<EvidenceSummaryCardProps> = ({ evidence }) => {
  const { conditionScore, zones, crossViewObservations, evidenceCompleteness, trustScore } = evidence;
  const score = conditionScore?.score ?? 100;

  // Dynamic score color tone
  const scoreColor =
    score >= 80 ? 'text-emerald-400' : score >= 60 ? 'text-amber-400' : 'text-rose-400';
  const scoreBg =
    score >= 80 ? 'bg-emerald-500/10 border-emerald-500/30' : score >= 60 ? 'bg-amber-500/10 border-amber-500/30' : 'bg-rose-500/10 border-rose-500/30';

  return (
    <div className="space-y-6">
      {/* ── 1. Top Level Condition Score & Evidence Header ─────────────────── */}
      <Card elevated className="border border-slate-700/80 bg-slate-900/90 shadow-2xl">
        <CardHeader className="border-b border-slate-800 pb-4">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30">
                <Layers size={22} />
              </div>
              <div>
                <h2 className="heading-md text-slate-100">
                  Phase 8: Evidence Reasoning & Condition Score V1
                </h2>
                <p className="text-secondary text-xs mt-0.5">
                  Deterministic aggregation of localized visual findings into explainable vehicle zones.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="primary">{evidence.version || 'EVIDENCE_V1'}</Badge>
              <Badge variant="info">Deterministic Engine</Badge>
            </div>
          </div>
        </CardHeader>

        <CardBody className="p-6 space-y-6">
          {/* Score Overview Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Condition Score Meter */}
            <div className={`p-5 rounded-2xl border ${scoreBg} flex flex-col justify-between`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Vehicle Condition Score
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 font-mono text-slate-300">
                  {conditionScore?.formulaVersion || 'CONDITION_V1'}
                </span>
              </div>
              <div className="my-3 flex items-baseline gap-2">
                <span className={`text-4xl font-extrabold font-display ${scoreColor}`}>
                  {score}
                </span>
                <span className="text-sm font-semibold text-slate-400">/ 100</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                {conditionScore?.explanation || 'Calculated deterministically from observable physical evidence.'}
              </p>
            </div>

            {/* Evidence Findings Counter */}
            <div className="p-5 rounded-2xl border border-slate-700/60 bg-slate-800/40 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Localized Evidence Findings
                </span>
                <Eye size={16} className="text-blue-400" />
              </div>
              <div className="my-3 flex items-baseline gap-3">
                <span className="text-3xl font-bold font-display text-slate-100">
                  {evidence.uniqueFindingCount}
                </span>
                <span className="text-xs text-slate-400">
                  Unique ({evidence.totalEvidenceCount} Raw Detections)
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Duplicates with IoU $\ge 0.70$ are consolidated to prevent double deduction.
              </p>
            </div>

            {/* Evidence Completeness */}
            <div className="p-5 rounded-2xl border border-slate-700/60 bg-slate-800/40 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Evidence Completeness
                </span>
                <span className="text-xs font-mono text-slate-400">
                  {Math.round((evidenceCompleteness?.coverageScore || 0) * 100)}%
                </span>
              </div>
              <div className="my-3">
                <div className="flex items-center gap-2">
                  {evidenceCompleteness?.mandatoryViewsComplete ? (
                    <Badge variant="success">Mandatory 4-Views Complete</Badge>
                  ) : (
                    <Badge variant="warning">Incomplete Coverage</Badge>
                  )}
                </div>
              </div>
              <p className="text-[11px] text-slate-400">
                {evidenceCompleteness?.usableImageCount || 0} usable perspective photos analyzed.
              </p>
            </div>
          </div>

          {/* ── 2. Deduction Transparency Breakdown ───────────────────────── */}
          {conditionScore?.deductions && conditionScore.deductions.length > 0 && (
            <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/60 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                  <FileText size={14} className="text-blue-400" /> Transparent Mathematical Deductions (Base: 100)
                </h4>
                <span className="text-xs font-mono text-rose-400 font-semibold">
                  -{conditionScore.deductions.reduce((a, b) => a + b.points, 0)} pts total
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {conditionScore.deductions.map((d, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          d.severity === 'SEVERE'
                            ? 'bg-rose-400'
                            : d.severity === 'MODERATE'
                            ? 'bg-amber-400'
                            : 'bg-blue-400'
                        }`}
                      />
                      <span className="text-slate-200 capitalize">{d.reason}</span>
                    </div>
                    <span className="font-mono text-rose-400 font-bold">-{d.points}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── 3. Canonical 8-Zone Vehicle Grid ──────────────────────────── */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Layers size={14} className="text-blue-400" /> Vehicle-Zone Assessment (8 Canonical Zones)
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                'FRONT',
                'FRONT_LEFT',
                'FRONT_RIGHT',
                'LEFT_SIDE',
                'RIGHT_SIDE',
                'REAR',
                'REAR_LEFT',
                'REAR_RIGHT',
              ].map((zoneName) => {
                const zoneData = zones?.find((z) => z.zone === zoneName);
                const hasFindings = zoneData && zoneData.findingCount > 0;
                const isSevere = zoneData?.highestSeverity === 'SEVERE';
                const isMod = zoneData?.highestSeverity === 'MODERATE';

                return (
                  <div
                    key={zoneName}
                    className={`p-3 rounded-xl border text-xs flex flex-col justify-between transition-all ${
                      hasFindings
                        ? isSevere
                          ? 'bg-rose-500/10 border-rose-500/40 text-rose-200'
                          : isMod
                          ? 'bg-amber-500/10 border-amber-500/40 text-amber-200'
                          : 'bg-blue-500/10 border-blue-500/30 text-blue-200'
                        : 'bg-slate-800/30 border-slate-700/40 text-slate-400'
                    }`}
                  >
                    <div className="font-semibold">{zoneName.replace('_', ' ')}</div>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-[10px] font-mono">
                        {hasFindings ? `${zoneData.findingCount} finding(s)` : 'Clear'}
                      </span>
                      {hasFindings && (
                        <span
                          className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${
                            isSevere
                              ? 'bg-rose-500/20 text-rose-300'
                              : isMod
                              ? 'bg-amber-500/20 text-amber-300'
                              : 'bg-blue-500/20 text-blue-300'
                          }`}
                        >
                          {zoneData.highestSeverity}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── 4. Cross-View Observations ────────────────────────────────── */}
          {crossViewObservations && crossViewObservations.length > 0 && (
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-2">
              <div className="flex items-center gap-2 text-amber-300 text-xs font-bold uppercase tracking-wider">
                <AlertTriangle size={15} /> Cross-View Evidence Reasoning
              </div>
              <div className="space-y-1.5">
                {crossViewObservations.map((obs, idx) => (
                  <div key={idx} className="text-xs text-amber-200/90 leading-relaxed">
                    • {obs.statement}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── 5. Trust Score Contract Interface (Pending Phase 9+) ───────── */}
          <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/50 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-slate-300">
              <HelpCircle size={15} className="text-slate-400" />
              <span>
                <strong>Buyer Assessment Trust Score:</strong>{' '}
                <span className="text-slate-400">
                  Pending integration of evidence completeness, model uncertainty calibration, and regional price valuation.
                </span>
              </span>
            </div>
            <Badge variant="default">{trustScore?.status || 'PENDING_TRUST_MODEL'}</Badge>
          </div>

          {/* ── 6. Academic Evidence Limitations & Disclaimer ──────────────── */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-[11px] text-slate-400 space-y-1.5">
            <div className="font-bold text-slate-300 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
              <Info size={13} className="text-blue-400" /> Evidence Scope & Physical Inspection Disclaimer
            </div>
            <ul className="list-disc pl-4 space-y-1 text-slate-400">
              <li>
                All findings represent <strong>observable 2D photographic evidence</strong> and require on-site physical pre-purchase verification.
              </li>
              <li>
                Photographs cannot establish hidden mechanical condition, engine wear, transmission health, or sub-surface corrosion.
              </li>
              <li>
                Logical vehicle-zone mappings are computed from camera angle perspectives and do not represent exact 3D chassis scans.
              </li>
            </ul>
          </div>
        </CardBody>
      </Card>
    </div>
  );
};

export default EvidenceSummaryCard;
