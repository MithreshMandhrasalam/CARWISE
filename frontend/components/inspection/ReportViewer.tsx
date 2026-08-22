'use client';
import { Inspection, Detection, Severity, Recommendation, ConditionRating, RiskLevel, PriceAssessment } from '@/lib/types';
import { AlertTriangle, CheckCircle, TrendingUp, TrendingDown, Minus, Info, ShieldAlert } from 'lucide-react';

/* ── Helper: recommendation style ────────── */
const REC_CONFIG: Record<Recommendation, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  RECOMMENDED:      { label: '✓ RECOMMENDED', color: '#10B981', bg: 'rgba(16,185,129,0.12)', icon: CheckCircle },
  CONSIDER_INSPECT: { label: '🔍 CONSIDER — INSPECT BEFORE PURCHASE', color: '#3B82F6', bg: 'rgba(59,130,246,0.12)', icon: Info },
  PROCEED_CAUTION:  { label: '⚠ PROCEED WITH CAUTION', color: '#F59E0B', bg: 'rgba(245,158,11,0.12)', icon: AlertTriangle },
  AVOID:            { label: '✗ NOT RECOMMENDED — AVOID', color: '#EF4444', bg: 'rgba(239,68,68,0.12)', icon: ShieldAlert },
};

const SEV_COLORS: Record<Severity, string> = { minor: '#10B981', moderate: '#F59E0B', severe: '#EF4444' };

const RATING_LABEL: Record<ConditionRating, string> = {
  excellent: 'Excellent', good: 'Good', fair: 'Fair', poor: 'Poor', critical: 'Critical',
};

const RISK_CONFIG: Record<RiskLevel, { label: string; color: string }> = {
  low:      { label: 'Low Risk', color: '#10B981' },
  medium:   { label: 'Medium Risk', color: '#F59E0B' },
  high:     { label: 'High Risk', color: '#EF4444' },
  very_high:{ label: 'Very High Risk', color: '#DC2626' },
};

const PRICE_CONFIG: Record<PriceAssessment, { label: string; color: string; icon: React.ElementType }> = {
  underpriced:             { label: 'Below Market — Great Deal', color: '#10B981', icon: TrendingDown },
  fair:                    { label: 'Fair Market Price', color: '#3B82F6', icon: Minus },
  slightly_overpriced:     { label: 'Slightly Above Market', color: '#F59E0B', icon: TrendingUp },
  significantly_overpriced:{ label: 'Significantly Overpriced', color: '#EF4444', icon: TrendingUp },
};

const SUBSCORE_LABELS: Record<string, string> = {
  exteriorCondition: 'Exterior Condition',
  interiorCondition: 'Interior Condition',
  visibleDamage: 'Visible Damage',
  tyreCondition: 'Tyre Condition',
  vehicleAge: 'Vehicle Age',
  mileageFactor: 'Mileage Factor',
  maintenanceEvidence: 'Maintenance Evidence',
  priceFairness: 'Price Fairness',
};

/* ── Score Ring ────────────────────────────────────────────────── */
function ScoreRing({ score, size = 140 }: { score: number; size?: number }) {
  const r = (size - 16) / 2;
  const circumference = 2 * Math.PI * r;
  const pct = Math.min(score / 100, 1);
  const color = score >= 70 ? '#10B981' : score >= 45 ? '#F59E0B' : '#EF4444';

  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--color-surface-3)" strokeWidth={10} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={10}
          strokeDasharray={circumference} strokeDashoffset={circumference * (1 - pct)}
          strokeLinecap="round" style={{ transition: 'stroke-dashoffset 1s cubic-bezier(0.34,1.56,0.64,1)' }} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: size > 100 ? '2rem' : '1.25rem', fontWeight: 800, color, lineHeight: 1 }}>{Math.round(score)}</span>
        <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginTop: 2 }}>/100</span>
      </div>
    </div>
  );
}

/* ── SubScore Bar ──────────────────────────────────────────────── */
function SubScoreBar({ label, value }: { label: string; value: number }) {
  const color = value >= 70 ? '#10B981' : value >= 45 ? '#F59E0B' : '#EF4444';
  return (
    <div style={{ marginBottom: 'var(--space-3)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: '0.8125rem' }}>
        <span style={{ color: 'var(--color-text-secondary)' }}>{label}</span>
        <span style={{ fontWeight: 700, color }}>{Math.round(value)}</span>
      </div>
      <div className="progress-track">
        <div className="progress-fill" style={{ width: `${value}%`, background: color }} />
      </div>
    </div>
  );
}

/* ── Detection Card ────────────────────────────────────────────── */
function DetectionCard({ d }: { d: Detection }) {
  const color = SEV_COLORS[d.severity];
  return (
    <div style={{ padding: 'var(--space-3) var(--space-4)', background: 'var(--color-surface-2)', borderRadius: 'var(--radius-md)', border: `1px solid ${color}25`, display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontWeight: 600, fontSize: '0.875rem', textTransform: 'capitalize' }}>
          {d.damageType.replace(/_/g, ' ')}
        </span>
        <span className="badge" style={{ background: color + '20', color, border: `1px solid ${color}40` }}>
          {d.severity}
        </span>
      </div>
      <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>📍 {d.component}</span>
      {d.notes && <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', lineHeight: 1.5 }}>{d.notes}</span>}
      <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
        Confidence: {Math.round(d.confidence * 100)}% · Angle: {d.imageAngle}
      </span>
    </div>
  );
}

/* ── Main Report Viewer ────────────────────────────────────────── */
export default function ReportViewer({ inspection }: { inspection: Inspection }) {
  const { vehicleInfo, aiResults } = inspection;
  const fa = aiResults?.finalAssessment;
  const cs = aiResults?.conditionScore;
  const dd = aiResults?.damageDetection;
  const pe = aiResults?.priceEstimation;
  const checklist = aiResults?.inspectionChecklist || [];

  if (!fa) {
    return (
      <div className="empty-state">
        <Info size={48} color="var(--color-text-muted)" />
        <p>No analysis results yet. Status: <strong>{inspection.status}</strong></p>
      </div>
    );
  }

  const recCfg = REC_CONFIG[fa.recommendation];
  const RecIcon = recCfg.icon;
  const riskCfg = RISK_CONFIG[fa.riskLevel];
  const priceCfg = pe ? PRICE_CONFIG[pe.priceAssessment] : null;
  const PriceIcon = priceCfg?.icon || Minus;

  return (
    <div className="animate-fade-in" style={{ maxWidth: 960, margin: '0 auto' }}>
      {/* ── Mock warning ── */}
      {(dd?.isMock || pe?.isMock) && (
        <div className="mock-banner" style={{ marginBottom: 'var(--space-6)' }}>
          <AlertTriangle size={16} />
          <span>
            <strong>⚠️ Demo Data</strong> — This inspection uses mock AI predictions for development purposes.
            Results are NOT real AI outputs. Set <code>AI_SERVICE_USE_MOCK=false</code> to use real models.
          </span>
        </div>
      )}

      {/* ── Header ── */}
      <div style={{ marginBottom: 'var(--space-6)' }}>
        <h1 className="heading-lg">
          {vehicleInfo.make?.replace('_', ' ').toUpperCase()} {vehicleInfo.model} {vehicleInfo.variant}
        </h1>
        <p style={{ color: 'var(--color-text-secondary)', marginTop: 4 }}>
          {vehicleInfo.year} · {vehicleInfo.fuelType} · {vehicleInfo.transmission} · {vehicleInfo.mileageKm?.toLocaleString('en-IN')} km
          {vehicleInfo.location && ` · ${vehicleInfo.location}`}
        </p>
      </div>

      {/* ── Final Recommendation Banner ── */}
      <div style={{
        background: recCfg.bg, border: `1.5px solid ${recCfg.color}40`,
        borderRadius: 'var(--radius-xl)', padding: 'var(--space-6)', marginBottom: 'var(--space-6)',
        display: 'flex', alignItems: 'flex-start', gap: 'var(--space-4)',
      }}>
        <RecIcon size={32} color={recCfg.color} style={{ flexShrink: 0 }} />
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.25rem', color: recCfg.color, marginBottom: 8 }}>
            {recCfg.label}
          </div>
          <p style={{ color: 'var(--color-text-secondary)', lineHeight: 1.65 }}>{fa.recommendationText}</p>
        </div>
      </div>

      {/* ── Trust Score + Key Stats ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
        {/* Trust score */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-3)', gridRow: 'span 1' }}>
          <ScoreRing score={fa.trustScore} />
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontWeight: 700, fontSize: '0.875rem' }}>Trust Score</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{RATING_LABEL[fa.conditionRating]} condition</div>
          </div>
        </div>

        {/* Risk Level */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 8, justifyContent: 'center' }}>
          <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>Risk Level</div>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.5rem', color: riskCfg.color }}>{riskCfg.label}</div>
        </div>

        {/* Damage count */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 8, justifyContent: 'center' }}>
          <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>Damage Detected</div>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '2rem', color: 'var(--color-text-primary)' }}>
            {dd?.detections?.length ?? 0}
          </div>
          {dd?.repairIndicationFlag && (
            <span className="badge badge-warning">Possible prior repair</span>
          )}
        </div>

        {/* Price Assessment */}
        {pe && (
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 8, justifyContent: 'center' }}>
            <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>Price Assessment</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <PriceIcon size={20} color={priceCfg?.color} />
              <span style={{ fontWeight: 700, color: priceCfg?.color, fontSize: '0.9rem' }}>{priceCfg?.label}</span>
            </div>
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-6)', marginBottom: 'var(--space-6)' }}>
        {/* ── Condition Sub-Scores ── */}
        {cs && (
          <div className="card">
            <h3 className="heading-md" style={{ marginBottom: 'var(--space-5)' }}>Condition Breakdown</h3>
            {Object.entries(cs.subScores).map(([key, val]) => (
              <SubScoreBar key={key} label={SUBSCORE_LABELS[key] || key} value={val} />
            ))}
            {cs.isMock && (
              <div style={{ display: 'flex', gap: 6, marginTop: 'var(--space-3)', fontSize: '0.75rem', color: '#F59E0B' }}>
                <AlertTriangle size={13} /> Scores use mock data
              </div>
            )}
          </div>
        )}

        {/* ── Price Analysis ── */}
        {pe && (
          <div className="card">
            <h3 className="heading-md" style={{ marginBottom: 'var(--space-5)' }}>Price Analysis</h3>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-3)' }}>
              <div>
                <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', marginBottom: 4 }}>Estimated Market Range</div>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.2rem' }}>
                  ₹{pe.estimatedRangeLow.toLocaleString('en-IN')} – ₹{pe.estimatedRangeHigh.toLocaleString('en-IN')}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', marginBottom: 4 }}>Asking Price</div>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.2rem' }}>
                  ₹{pe.askingPrice.toLocaleString('en-IN')}
                </div>
              </div>
            </div>

            <div style={{ height: 1, background: 'var(--color-border)', margin: 'var(--space-4) 0' }} />

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 'var(--space-4)' }}>
              <PriceIcon size={18} color={priceCfg?.color} />
              <span style={{ fontWeight: 600, color: priceCfg?.color }}>{priceCfg?.label}</span>
              {pe.priceDelta !== 0 && (
                <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
                  ({pe.priceDelta > 0 ? '+' : ''}₹{pe.priceDelta.toLocaleString('en-IN')} vs mid estimate)
                </span>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {pe.factors.map((f, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
                  <span style={{ color: 'var(--color-text-muted)', flexShrink: 0 }}>›</span> {f}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Damage Detections ── */}
      {dd && dd.detections.length > 0 && (
        <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
          <h3 className="heading-md" style={{ marginBottom: 'var(--space-2)' }}>Detected Issues</h3>
          {dd.repairIndicationFlag && (
            <div className="mock-banner" style={{ marginBottom: 'var(--space-4)', borderColor: 'rgba(239,68,68,0.3)', color: '#EF4444', background: 'rgba(239,68,68,0.08)' }}>
              <AlertTriangle size={16} />
              <span>{dd.repairIndicationNote}</span>
            </div>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
            {dd.detections.map((d) => <DetectionCard key={d._id || d.component} d={d} />)}
          </div>
        </div>
      )}

      {/* ── Inspection Checklist ── */}
      {checklist.length > 0 && (
        <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
          <h3 className="heading-md" style={{ marginBottom: 'var(--space-5)' }}>Inspection Checklist</h3>
          {(['high', 'medium', 'low'] as const).map((priority) => {
            const items = checklist.filter((c) => c.priority === priority);
            if (!items.length) return null;
            const colors = { high: '#EF4444', medium: '#F59E0B', low: '#10B981' };
            const color = colors[priority];
            return (
              <div key={priority} style={{ marginBottom: 'var(--space-5)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 'var(--space-3)' }}>
                  <span className="badge" style={{ background: color + '20', color, border: `1px solid ${color}40`, textTransform: 'uppercase' }}>
                    {priority} Priority
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {items.map((item) => (
                    <div key={item._id} style={{ display: 'flex', gap: 12, padding: 'var(--space-3)', background: 'var(--color-surface-2)', borderRadius: 'var(--radius-md)', borderLeft: `3px solid ${color}` }}>
                      <div style={{ flexShrink: 0, marginTop: 2 }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, marginTop: 4 }} />
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: 2 }}>{item.area}</div>
                        <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>{item.reason}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Major Findings ── */}
      {fa.majorFindings.length > 0 && (
        <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
          <h3 className="heading-md" style={{ marginBottom: 'var(--space-4)' }}>Major Findings Summary</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {fa.majorFindings.map((finding, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, fontSize: '0.9rem', padding: 'var(--space-3)', background: 'var(--color-surface-2)', borderRadius: 'var(--radius-md)' }}>
                <span style={{ color: 'var(--color-primary-light)', flexShrink: 0 }}>›</span>
                <span style={{ color: 'var(--color-text-secondary)' }}>{finding}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Disclaimer ── */}
      <div style={{ padding: 'var(--space-4)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-surface-2)', fontSize: '0.8125rem', color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
        <strong style={{ color: 'var(--color-text-secondary)' }}>⚠️ Disclaimer:</strong> {fa.disclaimer}
      </div>
    </div>
  );
}
