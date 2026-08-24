'use client';

import React from 'react';
import {
  ShieldCheck,
  Award,
  AlertTriangle,
  Info,
  Clock,
  Cpu,
  CheckCircle2,
  Wrench,
  Tag,
  Sparkles,
} from 'lucide-react';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

export interface FinalAssessmentData {
  assessmentVersion: string;
  assessmentId?: string;
  overallStatus: string;
  componentVersions?: {
    iqa?: string;
    cvDetector?: string;
    evidenceReasoning?: string;
    conditionScore?: string;
    trustScore?: string;
    repairCost?: string;
    marketValuation?: string;
  };
  executiveVerdict?: {
    verdictCode: string;
    badgeVariant: 'success' | 'warning' | 'danger' | 'primary' | string;
    title: string;
    recommendation: string;
  };
  conditionScore?: {
    score?: number;
    overallScore?: number;
  };
  trustScore?: {
    trustScore?: number;
    overallTrustScore?: number;
    trustBand?: string;
  };
  repairCostAssessment?: {
    totalEstimatedRange?: {
      min?: number | null;
      max?: number | null;
      median?: number | null;
    };
    status?: string;
  };
  priceValuation?: {
    status?: string;
    fairMarketValueRange?: {
      min?: number | null;
      max?: number | null;
      midpoint?: number | null;
    };
    askingPriceAssessment?: {
      askingPrice?: number;
      pricePosition?: string;
      premiumAmount?: number;
      discountAmount?: number;
    };
  };
  timings?: {
    iqaTimeMs?: number;
    damageDetectionTimeMs?: number;
    evidenceReasoningTimeMs?: number;
    trustScoringTimeMs?: number;
    repairCostTimeMs?: number;
    valuationTimeMs?: number;
    totalOrchestrationTimeMs?: number;
  };
  limitations?: string[];
  analyzedAt?: string;
}

interface FinalAssessmentCardProps {
  assessment: FinalAssessmentData;
}

export const FinalAssessmentCard: React.FC<FinalAssessmentCardProps> = ({ assessment }) => {
  const {
    assessmentVersion = 'CARWISE_ASSESSMENT_V1',
    overallStatus = 'COMPLETED',
    componentVersions = {},
    executiveVerdict,
    conditionScore,
    trustScore,
    repairCostAssessment,
    priceValuation,
    timings,
    limitations = [],
  } = assessment;

  const condScore = conditionScore?.score ?? conditionScore?.overallScore ?? null;
  const rawTrust = trustScore?.trustScore ?? trustScore?.overallTrustScore ?? null;
  const trustBand = trustScore?.trustBand || 'INSUFFICIENT_EVIDENCE';

  const repairMedian = repairCostAssessment?.totalEstimatedRange?.median;
  const fairMin = priceValuation?.fairMarketValueRange?.min;
  const fairMax = priceValuation?.fairMarketValueRange?.max;
  const pricePosition = priceValuation?.askingPriceAssessment?.pricePosition || priceValuation?.status;

  const isSuccess = overallStatus === 'COMPLETED' || executiveVerdict?.badgeVariant === 'success';
  const isWarning = overallStatus === 'LIMITED_ASSESSMENT' || executiveVerdict?.badgeVariant === 'warning';

  return (
    <Card elevated className="border-2 border-primary-500/40 bg-slate-900/95 shadow-2xl overflow-hidden">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-blue-900/40 via-indigo-900/40 to-slate-900/60 p-6 border-b border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="p-3 rounded-2xl bg-primary-500/20 text-primary-400 border border-primary-500/30">
              <ShieldCheck size={28} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-primary-500/20 text-primary-300 font-mono border border-primary-500/30">
                  {assessmentVersion}
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  {assessment.assessmentId || 'OFFICIAL REPORT'}
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold font-display text-slate-100 mt-1">
                Executive Buyer Assessment Summary
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge
              variant={
                isSuccess
                  ? 'success'
                  : isWarning
                  ? 'warning'
                  : 'danger'
              }
              className="text-sm px-3.5 py-1 uppercase font-bold"
            >
              {executiveVerdict?.verdictCode?.replace(/_/g, ' ') || overallStatus}
            </Badge>
          </div>
        </div>

        {/* Executive Verdict Box */}
        {executiveVerdict && (
          <div className="mt-4 p-4 rounded-xl bg-slate-950/70 border border-slate-800/90 flex items-start gap-3">
            <div className="mt-0.5 text-primary-400">
              {isSuccess ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} className="text-amber-400" />}
            </div>
            <div>
              <div className="text-sm font-bold text-slate-100">{executiveVerdict.title}</div>
              <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
                {executiveVerdict.recommendation}
              </p>
            </div>
          </div>
        )}
      </div>

      <CardBody className="p-6 space-y-6">
        {/* 4-Quadrant Consolidated Decision Matrix */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 1. Condition Score */}
          <div className="p-4 rounded-xl border border-slate-800 bg-slate-800/30 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Award size={14} className="text-blue-400" /> Condition Score
              </span>
              <span className="text-[10px] text-slate-500 font-mono">CONDITION_V1</span>
            </div>
            <div className="my-2">
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-100 font-display">
                {condScore !== null ? `${condScore}/100` : 'N/A'}
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">Observable cosmetic panel integrity</p>
            </div>
            <div className="text-[10px] text-slate-500 pt-1.5 border-t border-slate-800/60">
              Deterministic 2D surface evidence
            </div>
          </div>

          {/* 2. Buyer Assessment Trust */}
          <div className="p-4 rounded-xl border border-slate-800 bg-slate-800/30 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck size={14} className="text-emerald-400" /> Assessment Trust
              </span>
              <span className="text-[10px] text-slate-500 font-mono">TRUST_V1</span>
            </div>
            <div className="my-2">
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-100 font-display">
                {rawTrust !== null ? `${rawTrust}/100` : 'INSUFFICIENT'}
              </div>
              <p className="text-[11px] text-emerald-300/80 mt-0.5 font-medium">
                {trustBand.replace(/_/g, ' ')}
              </p>
            </div>
            <div className="text-[10px] text-slate-500 pt-1.5 border-t border-slate-800/60">
              Evidence reliability & completeness
            </div>
          </div>

          {/* 3. Repair Cost Burden */}
          <div className="p-4 rounded-xl border border-slate-800 bg-slate-800/30 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Wrench size={14} className="text-amber-400" /> Repair Estimate
              </span>
              <span className="text-[10px] text-slate-500 font-mono">REPAIR_V1</span>
            </div>
            <div className="my-2">
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-100 font-display">
                {repairMedian !== undefined && repairMedian !== null
                  ? repairMedian === 0
                    ? '₹0 (Clean)'
                    : `₹${(repairMedian / 1000).toFixed(1)}k`
                  : 'N/A'}
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">Bodywork & cosmetic repair range</p>
            </div>
            <div className="text-[10px] text-slate-500 pt-1.5 border-t border-slate-800/60">
              Synergy-discounted median cost
            </div>
          </div>

          {/* 4. Fair-Market Value Range */}
          <div className="p-4 rounded-xl border border-slate-800 bg-slate-800/30 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Tag size={14} className="text-teal-400" /> Market Valuation
              </span>
              <span className="text-[10px] text-slate-500 font-mono">VALUATION_V1</span>
            </div>
            <div className="my-2">
              <div className="text-xl sm:text-2xl font-extrabold text-slate-100 font-display">
                {fairMin && fairMax
                  ? `₹${(fairMin / 100000).toFixed(1)}L–₹${(fairMax / 100000).toFixed(1)}L`
                  : 'WITHHELD'}
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {pricePosition ? pricePosition.replace(/_/g, ' ') : 'Market range'}
              </p>
            </div>
            <div className="text-[10px] text-slate-500 pt-1.5 border-t border-slate-800/60">
              Indian depreciation benchmark
            </div>
          </div>
        </div>

        {/* Component Version Audit Strip */}
        <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-400 font-semibold">
            <Cpu size={14} className="text-primary-400" /> Component Versions:
          </div>
          <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono text-slate-300">
            <span className="px-2 py-0.5 rounded bg-slate-800/80 border border-slate-700">
              IQA: {componentVersions.iqa || 'IQA_V1'}
            </span>
            <span className="px-2 py-0.5 rounded bg-slate-800/80 border border-slate-700">
              CV: {componentVersions.cvDetector || 'CV_BASELINE_V1'}
            </span>
            <span className="px-2 py-0.5 rounded bg-slate-800/80 border border-slate-700">
              Evidence: {componentVersions.evidenceReasoning || 'EVIDENCE_V1'}
            </span>
            <span className="px-2 py-0.5 rounded bg-slate-800/80 border border-slate-700">
              Trust: {componentVersions.trustScore || 'TRUST_V1'}
            </span>
            <span className="px-2 py-0.5 rounded bg-slate-800/80 border border-slate-700">
              Repair: {componentVersions.repairCost || 'REPAIR_V1'}
            </span>
            <span className="px-2 py-0.5 rounded bg-slate-800/80 border border-slate-700">
              Valuation: {componentVersions.marketValuation || 'VALUATION_V1'}
            </span>
          </div>
        </div>

        {/* Execution Timings Strip */}
        {timings && timings.totalOrchestrationTimeMs !== undefined && (
          <div className="flex items-center justify-between text-[11px] text-slate-400 px-1 font-mono">
            <span className="flex items-center gap-1">
              <Clock size={12} className="text-slate-500" /> Pipeline Orchestration Latency:
            </span>
            <span>
              IQA: {timings.iqaTimeMs || 0}ms | CV: {timings.damageDetectionTimeMs || 0}ms | Evidence: {timings.evidenceReasoningTimeMs || 0}ms | Total: {timings.totalOrchestrationTimeMs || 0}ms
            </span>
          </div>
        )}

        {/* Academic Disclaimers */}
        {limitations.length > 0 && (
          <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800 text-[11px] text-slate-400 space-y-1">
            <div className="font-bold text-slate-300 uppercase tracking-wider text-[10px] flex items-center gap-1">
              <Info size={12} className="text-primary-400" /> Assessment Boundaries & Disclaimers
            </div>
            <ul className="list-disc pl-4 space-y-0.5 text-slate-400">
              {limitations.map((lim, i) => (
                <li key={i}>{lim}</li>
              ))}
            </ul>
          </div>
        )}
      </CardBody>
    </Card>
  );
};

export default FinalAssessmentCard;
