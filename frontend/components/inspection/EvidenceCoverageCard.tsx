'use client';

import React from 'react';
import {
  Camera,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Eye,
  Info,
  ShieldCheck,
} from 'lucide-react';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

export interface ViewQualityItem {
  viewType: string;
  submitted: boolean;
  usable: boolean;
  iqaStatus: string;
  qualityScore: number;
  isDuplicate?: boolean;
  coverageContribution: number;
  reason?: string;
}

export interface BlindspotItem {
  type: string;
  viewType: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW' | string;
  message: string;
}

export interface EvidenceCompletenessData {
  mandatoryCoverage: number;
  optionalCoverage: number;
  mandatoryDisclosureRatio: number;
  overallDisclosureRatio: number;
  coverageScore: number;
  usableImageCount: number;
  submittedImageCount: number;
  mandatoryViewsComplete: boolean;
  viewQuality?: ViewQualityItem[];
  blindspots?: BlindspotItem[];
}

interface EvidenceCoverageCardProps {
  completeness: EvidenceCompletenessData;
}

export const EvidenceCoverageCard: React.FC<EvidenceCoverageCardProps> = ({ completeness }) => {
  const {
    mandatoryCoverage = 0,
    optionalCoverage = 0,
    coverageScore = 0,
    usableImageCount = 0,
    submittedImageCount = 0,
    mandatoryViewsComplete = false,
    viewQuality = [],
    blindspots = [],
  } = completeness;

  // IQA Breakdown
  const passCount = viewQuality.filter((v) => v.submitted && v.iqaStatus === 'PASS').length;
  const warnCount = viewQuality.filter((v) => v.submitted && v.iqaStatus === 'WARN').length;
  const failCount = viewQuality.filter((v) => v.submitted && v.iqaStatus === 'FAIL').length;

  const mandatoryCount = Math.round(mandatoryCoverage * 4);
  const optionalCount = Math.round(optionalCoverage * 8);

  return (
    <Card elevated className="border border-slate-700/80 bg-slate-900/90 shadow-2xl">
      <CardHeader className="border-b border-slate-800 pb-4">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <Camera size={22} />
            </div>
            <div>
              <h3 className="heading-sm text-slate-100">
                Evidence Coverage & Perspective Completeness
              </h3>
              <p className="text-secondary text-xs mt-0.5">
                Evaluates physical perspective disclosure and Image Quality Assessment (IQA) usability.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {mandatoryViewsComplete ? (
              <Badge variant="success">4 Mandatory Views Complete</Badge>
            ) : (
              <Badge variant="warning">Missing Mandatory Views</Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardBody className="p-6 space-y-6">
        {/* Coverage Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Mandatory Coverage */}
          <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/60 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Mandatory Views
              </span>
              <span className="text-xs font-bold text-slate-100">{mandatoryCount} / 4</span>
            </div>
            <div className="my-2 h-2 w-full bg-slate-700/50 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all ${
                  mandatoryCount === 4 ? 'bg-emerald-500' : mandatoryCount >= 2 ? 'bg-amber-500' : 'bg-rose-500'
                }`}
                style={{ width: `${(mandatoryCount / 4) * 100}%` }}
              />
            </div>
            <span className="text-[11px] text-slate-400">
              Front, Rear, Left Side, Right Side
            </span>
          </div>

          {/* Optional Angles */}
          <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/60 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Optional Angles
              </span>
              <span className="text-xs font-bold text-slate-100">{optionalCount} / 8</span>
            </div>
            <div className="my-2 h-2 w-full bg-slate-700/50 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 transition-all"
                style={{ width: `${(optionalCount / 8) * 100}%` }}
              />
            </div>
            <span className="text-[11px] text-slate-400">
              Corner 45° angles, interior & engine bay
            </span>
          </div>

          {/* Overall Coverage Score */}
          <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-indigo-300 uppercase tracking-wider">
                Evidence Completeness
              </span>
              <span className="text-base font-extrabold font-mono text-indigo-200">
                {Math.round(coverageScore * 100)}%
              </span>
            </div>
            <div className="my-2 flex items-center gap-3 text-[11px] text-slate-300">
              <span className="flex items-center gap-1 text-emerald-400">
                <CheckCircle2 size={13} /> {passCount} PASS
              </span>
              <span className="flex items-center gap-1 text-amber-400">
                <AlertTriangle size={13} /> {warnCount} WARN
              </span>
              {failCount > 0 && (
                <span className="flex items-center gap-1 text-rose-400">
                  <XCircle size={13} /> {failCount} FAIL
                </span>
              )}
            </div>
            <span className="text-[11px] text-indigo-200/80">
              {usableImageCount} usable of {submittedImageCount} submitted
            </span>
          </div>
        </div>

        {/* Blindspots & Missing Views Callout */}
        {blindspots && blindspots.length > 0 && (
          <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/60 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <Eye size={14} className="text-amber-400" /> Perspective Blindspot Diagnostics ({blindspots.length})
              </span>
              <span className="text-[11px] text-slate-400">
                Missing sections require physical verification
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {blindspots.slice(0, 6).map((b, idx) => (
                <div
                  key={idx}
                  className={`p-2.5 rounded-lg border text-xs flex items-start gap-2 ${
                    b.severity === 'HIGH'
                      ? 'bg-rose-500/10 border-rose-500/30 text-rose-200'
                      : b.severity === 'MEDIUM'
                      ? 'bg-amber-500/10 border-amber-500/30 text-amber-200'
                      : 'bg-slate-800/40 border-slate-700/40 text-slate-300'
                  }`}
                >
                  <span
                    className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase mt-0.5 shrink-0 ${
                      b.severity === 'HIGH'
                        ? 'bg-rose-500/30 text-rose-200'
                        : b.severity === 'MEDIUM'
                        ? 'bg-amber-500/30 text-amber-200'
                        : 'bg-slate-700 text-slate-300'
                    }`}
                  >
                    {b.severity}
                  </span>
                  <span className="leading-tight">{b.message}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardBody>
    </Card>
  );
};

export default EvidenceCoverageCard;
