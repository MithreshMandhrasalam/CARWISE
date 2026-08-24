'use client';

import React from 'react';
import {
  Shield,
  HelpCircle,
  AlertCircle,
  CheckCircle,
  TrendingUp,
  Info,
  Lock,
} from 'lucide-react';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

export interface TrustScoreData {
  trustScore: number | null;
  trustBand: string;
  status: string;
  formulaVersion: string;
  components?: {
    evidenceCompleteness: number;
    iqaReliability: number;
    modelConfidence: number;
    crossViewConsistency: number;
  };
  rawReliabilityScore?: number;
  capsApplied?: string[];
  explanation: string;
  limitations: string[];
}

interface TrustScoreBreakdownProps {
  trustData: TrustScoreData;
}

export const TrustScoreBreakdown: React.FC<TrustScoreBreakdownProps> = ({ trustData }) => {
  const {
    trustScore = null,
    trustBand = 'INSUFFICIENT_EVIDENCE',
    components = {
      evidenceCompleteness: 0,
      iqaReliability: 0,
      modelConfidence: 0,
      crossViewConsistency: 0,
    },
    capsApplied = [],
    explanation,
    limitations = [],
  } = trustData;

  const isHigh = trustBand === 'HIGH_CONFIDENCE';
  const isMod = trustBand === 'MODERATE_CONFIDENCE';
  const isCaution = trustBand === 'PROCEED_WITH_CAUTION';

  const bandColor = isHigh
    ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10'
    : isMod
    ? 'text-blue-400 border-blue-500/30 bg-blue-500/10'
    : isCaution
    ? 'text-amber-400 border-amber-500/30 bg-amber-500/10'
    : 'text-rose-400 border-rose-500/30 bg-rose-500/10';

  const bandBadgeVariant = isHigh ? 'success' : isMod ? 'primary' : isCaution ? 'warning' : 'danger';

  return (
    <Card elevated className="border border-slate-700/80 bg-slate-900/90 shadow-2xl">
      <CardHeader className="border-b border-slate-800 pb-4">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <Shield size={22} />
            </div>
            <div>
              <h3 className="heading-sm text-slate-100">
                Buyer Assessment Trust Score V1
              </h3>
              <p className="text-secondary text-xs mt-0.5">
                Measures analytical confidence in the quality, coverage, and consistency of the assessment.
              </p>
            </div>
          </div>
          <Badge variant={bandBadgeVariant}>{trustBand.replace(/_/g, ' ')}</Badge>
        </div>
      </CardHeader>

      <CardBody className="p-6 space-y-6">
        {/* Trust Score & Band Banner */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Trust Meter */}
          <div className={`p-5 rounded-2xl border ${bandColor} flex flex-col justify-between`}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider">
                Assessment Trust Index
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 font-mono">
                TRUST_V1
              </span>
            </div>
            <div className="my-3 flex items-baseline gap-2">
              <span className="text-4xl font-extrabold font-display">
                {trustScore !== null ? trustScore : '--'}
              </span>
              <span className="text-sm font-semibold opacity-70">/ 100</span>
            </div>
            <p className="text-[11px] leading-relaxed opacity-90">
              {explanation || 'Calculated from photographic completeness, IQA reliability, and model certainty.'}
            </p>
          </div>

          {/* 4 Core Mathematical Components */}
          <div className="md:col-span-2 p-4 rounded-2xl bg-slate-800/40 border border-slate-700/60 flex flex-col justify-between space-y-3">
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Underlying Reliability Components
            </span>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-center">
                <div className="text-lg font-bold font-mono text-indigo-400">
                  {Math.round((components.evidenceCompleteness || 0) * 100)}%
                </div>
                <div className="text-[10px] text-slate-400 mt-1 uppercase font-semibold">
                  Coverage (35%)
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-center">
                <div className="text-lg font-bold font-mono text-emerald-400">
                  {Math.round((components.iqaReliability || 0) * 100)}%
                </div>
                <div className="text-[10px] text-slate-400 mt-1 uppercase font-semibold">
                  IQA Quality (25%)
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-center">
                <div className="text-lg font-bold font-mono text-blue-400">
                  {Math.round((components.modelConfidence || 0) * 100)}%
                </div>
                <div className="text-[10px] text-slate-400 mt-1 uppercase font-semibold">
                  Model Conf (25%)
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-center">
                <div className="text-lg font-bold font-mono text-amber-400">
                  {Math.round((components.crossViewConsistency || 0) * 100)}%
                </div>
                <div className="text-[10px] text-slate-400 mt-1 uppercase font-semibold">
                  Cross-View (15%)
                </div>
              </div>
            </div>

            {capsApplied.length > 0 && (
              <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-300 flex items-center gap-2">
                <Lock size={13} className="shrink-0" />
                <span>
                  <strong>Evidence Gating Active:</strong> Score was constrained because mandatory perspective photos are missing or degraded.
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Why isn't this higher? Callout */}
        <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/60 text-xs space-y-2">
          <div className="font-bold text-slate-200 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
            <HelpCircle size={14} className="text-blue-400" /> How to interpret Condition vs Trust
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-slate-300">
            <div className="p-3 rounded-lg bg-slate-900/50 border border-slate-800">
              <strong className="text-slate-100">Vehicle Condition Score:</strong> Evaluates physical cosmetic integrity strictly from observable photographic evidence.
            </div>
            <div className="p-3 rounded-lg bg-slate-900/50 border border-slate-800">
              <strong className="text-slate-100">Buyer Assessment Trust:</strong> Evaluates how complete and reliable the photographic evidence is before you make a purchasing decision.
            </div>
          </div>
        </div>

        {/* Limitations */}
        {limitations && limitations.length > 0 && (
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-[11px] text-slate-400 space-y-1">
            <div className="font-bold text-slate-300 uppercase tracking-wider text-[10px] flex items-center gap-1">
              <Info size={12} className="text-blue-400" /> Trust Score Scope Disclaimer
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

export default TrustScoreBreakdown;
