'use client';

import React from 'react';
import {
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  Info,
  DollarSign,
  ShieldCheck,
  Tag,
} from 'lucide-react';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

export interface PriceAdjustmentItem {
  adjustmentType: string;
  amountInr: number;
  percentageDelta: number;
  rationale: string;
}

export interface ValuationAssessmentData {
  version: string;
  currency: string;
  status: string;
  valuationConfidence: 'HIGH' | 'MODERATE' | 'LOW' | string;
  fairMarketValueRange: {
    min: number | null;
    max: number | null;
    midpoint: number | null;
  };
  baseBenchmarkNewPrice?: number | null;
  depreciatedBaseValue?: number | null;
  askingPriceAssessment: {
    askingPrice: number;
    pricePosition: string;
    premiumAmount: number;
    discountAmount: number;
    varianceFromMidpoint: number;
    variancePercentage: number;
    verdictHeading: string;
    verdictText: string;
  };
  adjustments: PriceAdjustmentItem[];
  limitations: string[];
  summary: string;
}

interface ValuationSummaryCardProps {
  valuationData: ValuationAssessmentData;
}

export const ValuationSummaryCard: React.FC<ValuationSummaryCardProps> = ({ valuationData }) => {
  const {
    status,
    valuationConfidence = 'MODERATE',
    fairMarketValueRange,
    baseBenchmarkNewPrice,
    depreciatedBaseValue,
    askingPriceAssessment,
    adjustments = [],
    limitations = [],
    summary,
  } = valuationData;

  const min = fairMarketValueRange?.min;
  const max = fairMarketValueRange?.max;
  const midpoint = fairMarketValueRange?.midpoint;

  const isInsufficient = status === 'INSUFFICIENT_EVIDENCE' || min === null;
  const isBelow = askingPriceAssessment?.pricePosition === 'BELOW_FAIR_RANGE';
  const isAbove = askingPriceAssessment?.pricePosition === 'ABOVE_FAIR_RANGE';
  const isFair = askingPriceAssessment?.pricePosition === 'FAIRLY_PRICED';

  const positionBadgeVariant = isFair ? 'success' : isBelow ? 'primary' : isAbove ? 'warning' : 'danger';

  return (
    <Card elevated className="border border-slate-700/80 bg-slate-900/90 shadow-2xl">
      <CardHeader className="border-b border-slate-800 pb-4">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <Tag size={22} />
            </div>
            <div>
              <h3 className="heading-sm text-slate-100">
                Fair-Market Vehicle Valuation & Asking-Price Analysis (V1)
              </h3>
              <p className="text-secondary text-xs mt-0.5">
                Evidence-adjusted fair market valuation benchmarked against Indian automotive depreciation curves.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={positionBadgeVariant}>
              {askingPriceAssessment?.pricePosition?.replace(/_/g, ' ') || status}
            </Badge>
            <span
              className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                valuationConfidence === 'HIGH'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : valuationConfidence === 'MODERATE'
                  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
              }`}
            >
              {valuationConfidence} CONFIDENCE
            </span>
          </div>
        </div>
      </CardHeader>

      <CardBody className="p-6 space-y-6">
        {/* Fair Value vs Asking Price Banner */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Estimated Fair Value Range */}
          <div className="p-5 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-300">
                Estimated Fair Market Range
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 font-mono text-emerald-200">
                VALUATION_V1
              </span>
            </div>

            <div className="my-3">
              {isInsufficient ? (
                <div className="text-lg font-bold text-slate-400">INSUFFICIENT EVIDENCE</div>
              ) : (
                <div>
                  <div className="text-2xl sm:text-3xl font-extrabold font-display text-slate-100">
                    ₹{(min! / 100000).toFixed(2)}L – ₹{(max! / 100000).toFixed(2)}L
                  </div>
                  <div className="text-xs text-emerald-200/90 font-medium mt-1">
                    Midpoint Benchmark: <strong>₹{(midpoint! / 100000).toFixed(2)} Lakhs (₹{midpoint?.toLocaleString()})</strong>
                  </div>
                </div>
              )}
            </div>

            <p className="text-[11px] text-slate-300 leading-relaxed">
              Adjusted for vehicle age, odometer mileage, observed physical condition, and required bodywork repairs.
            </p>
          </div>

          {/* Asking Price Comparison Card */}
          <div className="p-5 rounded-2xl border border-slate-700/60 bg-slate-800/40 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                Seller Asking Price Assessment
              </span>
              <span className="text-xs font-mono font-bold text-slate-100">
                ₹{((askingPriceAssessment?.askingPrice || 0) / 100000).toFixed(2)} Lakhs
              </span>
            </div>

            <div className="my-3">
              <div className="text-base font-bold text-slate-100">
                {askingPriceAssessment?.verdictHeading || 'Asking Price Evaluation'}
              </div>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                {askingPriceAssessment?.verdictText || summary}
              </p>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-700/40 text-xs">
              <span className="text-slate-400">Variance from Midpoint:</span>
              <span
                className={`font-mono font-bold ${
                  isBelow ? 'text-emerald-400' : isAbove ? 'text-amber-400' : 'text-slate-200'
                }`}
              >
                {askingPriceAssessment?.variancePercentage > 0 ? '+' : ''}
                {askingPriceAssessment?.variancePercentage}% (₹
                {Math.abs(askingPriceAssessment?.varianceFromMidpoint || 0).toLocaleString()})
              </span>
            </div>
          </div>
        </div>

        {/* Adjustments Breakdown Table */}
        {adjustments.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <TrendingDown size={14} className="text-emerald-400" /> Transparent Valuation Adjustments ({adjustments.length})
              </span>
              {baseBenchmarkNewPrice && (
                <span className="text-[11px] text-slate-400">
                  Base Ex-Showroom Benchmark: ₹{baseBenchmarkNewPrice.toLocaleString()}
                </span>
              )}
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-800">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-800/80 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-700/80">
                  <tr>
                    <th className="py-2.5 px-3">Adjustment Factor</th>
                    <th className="py-2.5 px-3">Detailed Rationale</th>
                    <th className="py-2.5 px-3 text-right">Percentage Impact</th>
                    <th className="py-2.5 px-3 text-right">Value Impact (INR)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {adjustments.map((adj, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 px-3 font-semibold text-slate-200">
                        {adj.adjustmentType.replace(/_/g, ' ')}
                      </td>
                      <td className="py-3 px-3 text-slate-300 leading-tight">
                        {adj.rationale}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold">
                        <span className={adj.percentageDelta < 0 ? 'text-rose-400' : 'text-emerald-400'}>
                          {adj.percentageDelta > 0 ? '+' : ''}
                          {adj.percentageDelta}%
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold">
                        <span className={adj.amountInr < 0 ? 'text-rose-400' : 'text-emerald-400'}>
                          {adj.amountInr > 0 ? '+' : ''}₹{Math.abs(adj.amountInr).toLocaleString()}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Valuation Limitations & Disclaimers */}
        {limitations && limitations.length > 0 && (
          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 text-[11px] text-slate-400 space-y-1">
            <div className="font-bold text-slate-300 uppercase tracking-wider text-[10px] flex items-center gap-1">
              <Info size={12} className="text-emerald-400" /> Fair-Market Valuation Disclaimers & Limitations
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

export default ValuationSummaryCard;
