'use client';

import React, { useState } from 'react';

export interface BoundingBoxData {
  xMin: number;
  yMin: number;
  xMax: number;
  yMax: number;
}

export interface DamageDetectionData {
  className: string;
  classId: number;
  confidence: number;
  confidenceBand: 'HIGH_CONFIDENCE' | 'POTENTIAL' | string;
  bbox: BoundingBoxData;
  qualityWarning?: boolean;
}

export interface DamageOverlayViewerProps {
  imageUrl: string;
  viewType: string;
  status: 'COMPLETE' | 'BLOCKED_BY_IQA' | 'NO_DAMAGE_DETECTED' | 'MODEL_ERROR' | string;
  detections: DamageDetectionData[];
  modelMetadata?: {
    name?: string;
    version?: string;
    weightsVersion?: string;
    inferenceTimeMs?: number;
  };
  iqaMeta?: {
    qualityStatus?: string;
    qualityWarning?: boolean;
  };
}

export const DamageOverlayViewer: React.FC<DamageOverlayViewerProps> = ({
  imageUrl,
  viewType,
  status,
  detections,
  modelMetadata,
  iqaMeta,
}) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [showBoxes, setShowBoxes] = useState<boolean>(true);

  const isBlocked = status === 'BLOCKED_BY_IQA';
  const isNoDamage = status === 'NO_DAMAGE_DETECTED' || detections.length === 0;

  return (
    <div className="card card-glass overflow-hidden border border-slate-700/60 bg-slate-900/80 shadow-xl rounded-2xl flex flex-col">
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-800/80 border-b border-slate-700/50">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 text-xs font-semibold rounded-md bg-blue-500/20 text-blue-300 border border-blue-500/30">
            {viewType}
          </span>
          <span className="text-xs font-mono text-slate-400">
            {modelMetadata?.name || 'YOLO11s'} ({modelMetadata?.weightsVersion || 'cardd-v1'})
          </span>
        </div>

        <div className="flex items-center gap-2">
          {detections.length > 0 && (
            <button
              onClick={() => setShowBoxes(!showBoxes)}
              className="text-xs px-2.5 py-1 rounded bg-slate-700 hover:bg-slate-600 text-slate-200 transition-colors"
            >
              {showBoxes ? 'Hide BBoxes' : 'Show BBoxes'}
            </button>
          )}

          {isBlocked ? (
            <span className="badge badge-danger text-xs">BLOCKED BY IQA</span>
          ) : isNoDamage ? (
            <span className="badge badge-success text-xs">NO DEFECTS DETECTED</span>
          ) : (
            <span className="badge badge-warning text-xs">
              {detections.length} {detections.length === 1 ? 'FINDING' : 'FINDINGS'}
            </span>
          )}
        </div>
      </div>

      {/* Main Image Viewport with Dynamic Scaled SVG Overlay */}
      <div className="relative w-full aspect-[4/3] bg-slate-950 flex items-center justify-center overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl}
          alt={`Vehicle ${viewType} perspective`}
          className="w-full h-full object-cover select-none"
        />

        {/* Dynamic SVG Bounding Box Layer */}
        {showBoxes && !isBlocked && (
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            {detections.map((det, idx) => {
              const x = det.bbox.xMin * 100;
              const y = det.bbox.yMin * 100;
              const width = (det.bbox.xMax - det.bbox.xMin) * 100;
              const height = (det.bbox.yMax - det.bbox.yMin) * 100;
              const isHighConf = det.confidenceBand === 'HIGH_CONFIDENCE';
              const isHovered = hoveredIdx === idx;

              const strokeColor = isHighConf ? '#10b981' : '#f59e0b';
              const fillColor = isHighConf
                ? isHovered
                  ? 'rgba(16, 185, 129, 0.35)'
                  : 'rgba(16, 185, 129, 0.15)'
                : isHovered
                ? 'rgba(245, 158, 11, 0.30)'
                : 'rgba(245, 158, 11, 0.12)';

              return (
                <g key={idx} className="transition-all duration-150">
                  {/* Bounding Box Rectangle */}
                  <rect
                    x={x}
                    y={y}
                    width={width}
                    height={height}
                    fill={fillColor}
                    stroke={strokeColor}
                    strokeWidth={isHovered ? '0.8' : '0.5'}
                    strokeDasharray={isHighConf ? 'none' : '2,1'}
                    rx="0.5"
                  />
                </g>
              );
            })}
          </svg>
        )}

        {/* IQA Blocked Glass Overlay */}
        {isBlocked && (
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-400 mb-3 text-2xl font-bold">
              ✕
            </div>
            <h4 className="text-sm font-bold text-red-300 mb-1">Inference Blocked by IQA</h4>
            <p className="text-xs text-slate-400 max-w-xs">
              Photograph failed image quality standards (blur/exposure). Please replace with a clearer image before running damage detection.
            </p>
          </div>
        )}
      </div>

      {/* Detections List & Confidence Banding */}
      <div className="p-4 bg-slate-900/90 flex-1 flex flex-col justify-between space-y-3">
        {detections.length > 0 ? (
          <div className="space-y-2">
            <div className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Detected Anomalies ({detections.length})
            </div>
            <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
              {detections.map((det, idx) => {
                const isHighConf = det.confidenceBand === 'HIGH_CONFIDENCE';
                return (
                  <div
                    key={idx}
                    onMouseEnter={() => setHoveredIdx(idx)}
                    onMouseLeave={() => setHoveredIdx(null)}
                    className={`flex items-center justify-between p-2 rounded-lg text-xs border transition-all cursor-pointer ${
                      hoveredIdx === idx
                        ? 'bg-slate-800 border-slate-500'
                        : 'bg-slate-800/50 border-slate-700/50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          isHighConf ? 'bg-emerald-400' : 'bg-amber-400'
                        }`}
                      />
                      <span className="font-semibold text-slate-200 capitalize">
                        {det.className.replace('_', ' ')}
                      </span>
                      {det.qualityWarning && (
                        <span className="text-[10px] text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded">
                          IQA Warn
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="font-mono text-slate-300">
                        {Math.round(det.confidence * 100)}%
                      </span>
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                          isHighConf
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        }`}
                      >
                        {isHighConf ? 'High Confidence' : 'Potential'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : !isBlocked ? (
          <div className="py-4 text-center">
            <p className="text-xs text-slate-400">
              No visible cosmetic damage localized in this perspective view.
            </p>
          </div>
        ) : null}

        {/* Academic Traceability Disclaimer */}
        <div className="pt-2 border-t border-slate-800 text-[10px] text-slate-500 flex items-center justify-between">
          <span>Model: CarDD Baseline v1 (Ultralytics YOLO11s)</span>
          <span>AI Evidence Locator • Not Physical Proof</span>
        </div>
      </div>
    </div>
  );
};

export default DamageOverlayViewer;
