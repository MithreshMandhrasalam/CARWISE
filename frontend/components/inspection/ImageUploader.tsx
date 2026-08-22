'use client';
import { useCallback, useState } from 'react';
import { Upload, X, Check, Image as ImageIcon, ArrowRight, ShieldCheck, AlertTriangle } from 'lucide-react';
import { ImageAngle } from '@/lib/types';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Alert } from '@/components/ui/Alert';

const IMAGE_SLOTS: { angle: ImageAngle; label: string; isMandatory: boolean; desc: string }[] = [
  { angle: 'front', label: 'Front View', isMandatory: true, desc: 'Hood, grille & bumper' },
  { angle: 'rear', label: 'Rear View', isMandatory: true, desc: 'Boot lid, bumper & taillights' },
  { angle: 'left', label: 'Left Side Profile', isMandatory: true, desc: 'Left doors, fenders & sills' },
  { angle: 'right', label: 'Right Side Profile', isMandatory: true, desc: 'Right doors, fenders & sills' },
  { angle: 'front-left', label: 'Front-Left 45°', isMandatory: false, desc: 'Front bumper/fender joint' },
  { angle: 'front-right', label: 'Front-Right 45°', isMandatory: false, desc: 'Front bumper/fender joint' },
  { angle: 'rear-left', label: 'Rear-Left 45°', isMandatory: false, desc: 'Rear bumper/quarter joint' },
  { angle: 'rear-right', label: 'Rear-Right 45°', isMandatory: false, desc: 'Rear bumper/quarter joint' },
  { angle: 'interior', label: 'Interior Cabin', isMandatory: false, desc: 'Upholstery & seats' },
  { angle: 'dashboard', label: 'Dashboard / Odometer', isMandatory: false, desc: 'Odometer cluster' },
  { angle: 'engine', label: 'Engine Bay', isMandatory: false, desc: 'Under-hood overview' },
  { angle: 'tyres', label: 'Tyre Tread & Wheels', isMandatory: false, desc: 'Tread depth & sidewall' },
];

interface UploadedImage {
  angle: ImageAngle;
  file: File;
  preview: string;
}

interface Props {
  onSubmit?: (files: File[], angles: string[]) => void;
}

export function ImageUploader({ onSubmit }: Props) {
  const [uploaded, setUploaded] = useState<Map<ImageAngle, UploadedImage>>(new Map());
  const [dragOver, setDragOver] = useState<ImageAngle | null>(null);

  const handleFile = useCallback((angle: ImageAngle, file: File) => {
    if (!file.type.startsWith('image/')) return;
    const preview = URL.createObjectURL(file);
    setUploaded((prev) => new Map(prev).set(angle, { angle, file, preview }));
  }, []);

  const handleInputChange = (angle: ImageAngle) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(angle, file);
  };

  const handleDrop = (angle: ImageAngle) => (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(null);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(angle, file);
  };

  const removeImage = (angle: ImageAngle) => {
    const prev = uploaded.get(angle);
    if (prev) URL.revokeObjectURL(prev.preview);
    setUploaded((prev) => {
      const m = new Map(prev);
      m.delete(angle);
      return m;
    });
  };

  const mandatoryCount = IMAGE_SLOTS.filter((s) => s.isMandatory && uploaded.has(s.angle)).length;
  const isMandatoryComplete = mandatoryCount === 4;

  const handleSubmit = () => {
    if (!onSubmit) return;
    const files: File[] = [];
    const angles: string[] = [];
    uploaded.forEach((val) => {
      files.push(val.file);
      angles.push(val.angle);
    });
    onSubmit(files, angles);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* Status Alert Banner */}
      {!isMandatoryComplete ? (
        <Alert variant="warning">
          <strong>Mandatory Perspective Check:</strong> {mandatoryCount} of 4 required views uploaded. Please upload Front, Rear, Left, and Right views to minimize visual blindspot risk.
        </Alert>
      ) : (
        <Alert variant="success">
          <strong>Mandatory Views Complete:</strong> All 4 core angles are ready. Additional optional angles will increase overall Evidence Completeness.
        </Alert>
      )}

      {/* Grid of Slots */}
      <div className="grid-3">
        {IMAGE_SLOTS.map((slot) => {
          const img = uploaded.get(slot.angle);
          const isOver = dragOver === slot.angle;

          return (
            <div
              key={slot.angle}
              onDragOver={(e) => { e.preventDefault(); setDragOver(slot.angle); }}
              onDragLeave={() => setDragOver(null)}
              onDrop={handleDrop(slot.angle)}
              style={{
                background: 'var(--color-surface)',
                border: `1px solid ${isOver ? 'var(--color-primary-light)' : 'var(--color-border)'}`,
                borderRadius: 'var(--radius-lg)',
                padding: 'var(--space-4)',
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--space-3)',
                transition: 'all var(--transition-fast)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <h4 style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--color-text-primary)' }}>
                    {slot.label}
                  </h4>
                  <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: 2 }}>
                    {slot.desc}
                  </p>
                </div>
                <Badge variant={slot.isMandatory ? 'primary' : 'default'} style={{ fontSize: '0.6875rem' }}>
                  {slot.isMandatory ? 'Mandatory' : 'Optional'}
                </Badge>
              </div>

              {img ? (
                <div style={{ position: 'relative', height: 140, borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--color-border)' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img.preview} alt={slot.label} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <button
                    onClick={() => removeImage(slot.angle)}
                    aria-label={`Remove ${slot.label} image`}
                    style={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      width: 28,
                      height: 28,
                      borderRadius: 'var(--radius-full)',
                      background: 'rgba(239, 68, 68, 0.85)',
                      border: 'none',
                      color: '#FFF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                    }}
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <label
                  style={{
                    height: 140,
                    borderRadius: 'var(--radius-md)',
                    border: `2px dashed ${slot.isMandatory ? 'rgba(37, 99, 235, 0.4)' : 'var(--color-border)'}`,
                    background: isOver ? 'var(--color-primary-glow)' : 'var(--color-surface-elevated)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    cursor: 'pointer',
                    textAlign: 'center',
                    padding: 'var(--space-3)',
                  }}
                >
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    style={{ display: 'none' }}
                    onChange={handleInputChange(slot.angle)}
                  />
                  <Upload size={20} color={slot.isMandatory ? 'var(--color-primary-light)' : 'var(--color-text-muted)'} />
                  <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                    Upload Photo
                  </span>
                </label>
              )}
            </div>
          );
        })}
      </div>

      {onSubmit && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'var(--space-4)' }}>
          <Button
            variant="primary"
            size="lg"
            rightIcon={<ArrowRight size={16} />}
            disabled={!isMandatoryComplete}
            onClick={handleSubmit}
          >
            Process Selected Images
          </Button>
        </div>
      )}
    </div>
  );
}

export default ImageUploader;
