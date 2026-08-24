'use client';

import React from 'react';
import {
  Wrench,
  Tag,
  MapPin,
  Sparkles,
  AlertCircle,
  TrendingDown,
  Info,
  CheckCircle2,
} from 'lucide-react';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

export interface ItemizedRepairItem {
  repairId: string;
  evidenceId?: string;
  zone: string;
  damageClass: string;
  severity: string;
  recommendedAction: string;
  actionName: string;
  actionDescription: string;
  baseRange: { min: number; max: number; median: number };
  estimatedRange: { min: number; max: number; median: number };
  confidence: 'HIGH' | 'MODERATE' | 'LOW' | string;
  requiresPhysicalInspection?: boolean;
  qualityWarning?: boolean;
}

export interface RepairCostAssessmentData {
  version: string;
  currency: string;
  status: string;
  totalEstimatedRange: {
    min: number | null;
    max: number | null;
    median: number | null;
  };
  vehicleSegment: string;
  regionTier: string;
  multipliersApplied: {
    segment?: string;
    segmentFactor: number;
    region?: string;
    regionFactor: number;
  };
  itemizedRepairs: ItemizedRepairItem[];
  synergyDiscountApplied: {
    itemsCount: number;
    discountPercentage: number;
    savingsMedian: number;
  };
  summary: string;
  limitations: string[];
}

interface RepairCostSummaryCardProps {
  repairData: RepairCostAssessmentData;
}

export const RepairCostSummaryCard: React.FC<RepairCostSummaryCardProps> = ({ repairData }) => {
  const {
    totalEstimatedRange,
    vehicleSegment = 'HATCHBACK',
    regionTier = 'TIER_2',
    multipliersApplied = { segmentFactor: 1.0, regionFactor: 1.0 },
    itemizedRepairs = [],
    synergyDiscountApplied = { itemsCount: 0, discountPercentage: 0, savingsMedian: 0 },
    summary,
    limitations = [],
    status,
  } = repairData;

  const min = totalEstimatedRange?.min;
  const max = totalEstimatedRange?.max;
  const median = totalEstimatedRange?.median;

  const isClean = status === 'NO_DAMAGE_DETECTED' || (min === 0 && max === 0);
  const isInsufficient = status === 'INSUFFICIENT_EVIDENCE' || min === null;

  return (
    <Card elevated className="border border-slate-700/80 bg-slate-900/90 shadow-2xl">
      <CardHeader className="border-b border-slate-800 pb-4">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Wrench size={22} />
            </div>
            <div>
              <h3 className="heading-sm text-slate-100">
                Market-Aware Repair Cost Estimation (V1)
              </h3>
              <p className="text-secondary text-xs mt-0.5">
                Deterministic cost ranges (INR) scaled by vehicle segment, regional labor rates, and panel complexity.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 font-mono text-slate-300">
              {vehicleSegment.replace(/_/g, ' ')} • {regionTier.replace(/_/g, ' ')}
            </span>
          </div>
        </div>
      </CardHeader>

      <CardBody className="p-6 space-y-6">
        {/* Total Cost Estimate Banner */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Estimated Range Meter */}
          <div className="p-5 rounded-2xl border border-amber-500/30 bg-amber-500/10 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-300">
                Total Estimated Range
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 font-mono text-amber-200">
                INR (₹)
              </span>
            </div>

            <div className="my-3">
              {isInsufficient ? (
                <div className="text-xl font-bold text-slate-400">INSUFFICIENT EVIDENCE</div>
              ) : isClean ? (
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-emerald-400">₹0</span>
                  <span className="text-xs text-emerald-300">No Immediate Repairs</span>
                </div>
              ) : (
                <div>
                  <div className="text-2xl sm:text-3xl font-extrabold font-display text-slate-100">
                    ₹{min?.toLocaleString()} – ₹{max?.toLocaleString()}
                  </div>
                  <div className="text-xs text-amber-200/90 font-medium mt-1">
                    Expected Median: <strong>₹{median?.toLocaleString()}</strong>
                  </div>
                </div>
              )}
            </div>

            <p className="text-[11px] text-slate-300 leading-relaxed">
              {summary || 'Calculated from localized visual findings with multi-panel paint batch discounts.'}
            </p>
          </div>

          {/* Multiplier Factors & Synergy Card */}
          <div className="md:col-span-2 p-4 rounded-2xl bg-slate-800/40 border border-slate-700/60 flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Cost Scaling Factors & Labor Synergy
              </span>
              {synergyDiscountApplied.discountPercentage > 0 && (
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                  {synergyDiscountApplied.discountPercentage}% Batch Synergy Discount
                </span>
              )}
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                <div className="text-xs font-bold text-slate-200">{vehicleSegment.replace(/_/g, ' ')}</div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  Segment Factor: <strong>{multipliersApplied.segmentFactor.toFixed(2)}x</strong>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                <div className="text-xs font-bold text-slate-200">{regionTier.replace(/_/g, ' ')}</div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  Region Factor: <strong>{multipliersApplied.regionFactor.toFixed(2)}x</strong>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                <div className="text-xs font-bold text-emerald-400">
                  {synergyDiscountApplied.discountPercentage > 0
                    ? `-₹${synergyDiscountApplied.savingsMedian.toLocaleString()}`
                    : '₹0'}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  Paint Batching Savings
                </div>
              </div>
            </div>

            <div className="text-[11px] text-slate-400 leading-tight">
              Rates reflect independent multi-brand bodyshop standards in India (2026). OEM dealership rates are typically 30%–60% higher.
            </div>
          </div>
        </div>

        {/* Itemized Repair Actions Table */}
        {itemizedRepairs.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <Wrench size={14} className="text-amber-400" /> Itemized Repair Operations ({itemizedRepairs.length})
              </span>
              <span className="text-[11px] text-slate-400">
                Traceable to individual photographic findings
              </span>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-800">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-800/80 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-700/80">
                  <tr>
                    <th className="py-2.5 px-3">Vehicle Zone</th>
                    <th className="py-2.5 px-3">Observed Defect</th>
                    <th className="py-2.5 px-3">Recommended Repair Action</th>
                    <th className="py-2.5 px-3 text-right">Estimated Cost (INR)</th>
                    <th className="py-2.5 px-3 text-center">Confidence</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {itemizedRepairs.map((item, idx) => (
                    <tr key={item.repairId || idx} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 px-3 font-semibold text-slate-200">
                        {item.zone.replace(/_/g, ' ')}
                      </td>
                      <td className="py-3 px-3">
                        <span className="capitalize font-medium text-slate-200">
                          {item.severity.toLowerCase()} {item.damageClass.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-medium text-amber-300">{item.actionName}</div>
                        <div className="text-[10px] text-slate-400 leading-tight mt-0.5">{item.actionDescription}</div>
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-100">
                        ₹{item.estimatedRange.min.toLocaleString()} – ₹{item.estimatedRange.max.toLocaleString()}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase ${
                            item.confidence === 'HIGH'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : item.confidence === 'MODERATE'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : 'bg-slate-700 text-slate-300'
                          }`}
                        >
                          {item.confidence}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Limitations & Disclaimer */}
        {limitations && limitations.length > 0 && (
          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 text-[11px] text-slate-400 space-y-1">
            <div className="font-bold text-slate-300 uppercase tracking-wider text-[10px] flex items-center gap-1">
              <Info size={12} className="text-amber-400" /> Repair Cost Estimation Scope & Limitations
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

export default RepairCostSummaryCard;
