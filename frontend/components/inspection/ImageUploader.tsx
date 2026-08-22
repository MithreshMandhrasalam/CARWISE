'use client';
import { useCallback, useState } from 'react';
import { Upload, X, Check, Image as ImageIcon, ArrowRight } from 'lucide-react';
import { ImageAngle } from '@/lib/types';

const IMAGE_SLOTS: { angle: ImageAngle; label: string; required?: boolean }[] = [
  { angle: 'front', label: 'Front', required: true },
  { angle: 'rear', label: 'Rear', required: true },
  { angle: 'left', label: 'Left Side', required: true },
  { angle: 'right', label: 'Right Side', required: true },
  { angle: 'front-left', label: 'Front-Left' },
  { angle: 'front-right', label: 'Front-Right' },
  { angle: 'rear-left', label: 'Rear-Left' },
  { angle: 'rear-right', label: 'Rear-Right' },
  { angle: 'interior', label: 'Interior' },
  { angle: 'dashboard', label: 'Dashboard' },
  { angle: 'engine', label: 'Engine Bay' },
  { angle: 'tyre-fl', label: 'Tyre FL' },
  { angle: 'tyre-fr', label: 'Tyre FR' },
  { angle: 'tyre-rl', label: 'Tyre RL' },
  { angle: 'tyre-rr', label: 'Tyre RR' },
];

interface UploadedImage {
  angle: ImageAngle;
  file: File;
  preview: string;
}

interface Props {
  onSubmit: (files: File[], angles: string[]) => void;
}

export default function ImageUploader({ onSubmit }: Props) {
  const [uploaded, setUploaded] = useState<Map<ImageAngle, UploadedImage>>(new Map());
  const [dragOver, setDragOver] = useState<ImageAngle | null>(null);
  const [submitting, setSubmitting] = useState(false);

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
    setUploaded((prev) => { const m = new Map(prev); m.delete(angle); return m; });
  };

  const requiredMissing = IMAGE_SLOTS.filter((s) => s.required && !uploaded.has(s.angle));
  const canSubmit = requiredMissing.length === 0 && uploaded.size > 0;

  const handleSubmit = async () => {
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    const entries = Array.from(uploaded.values());
    onSubmit(entries.map((e) => e.file), entries.map((e) => e.angle));
  };

  return (
    <div className="card-elevated" style={{ padding: 'var(--space-8)' }}>
      <h2 className="heading-md" style={{ marginBottom: 'var(--space-2)' }}>Upload Vehicle Images</h2>
      <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', marginBottom: 'var(--space-2)' }}>
        Upload photos from each angle. <strong style={{ color: 'var(--color-text-primary)' }}>Front, Rear, Left, Right are required.</strong>
      </p>
      <p style={{ color: 'var(--color-text-muted)', fontSize: '0.8125rem', marginBottom: 'var(--space-6)' }}>
        More images = better AI analysis. Max 20MB per photo. JPG, PNG, WebP supported.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-3)', marginBottom: 'var(--space-6)' }}>
        {IMAGE_SLOTS.map(({ angle, label, required }) => {
          const img = uploaded.get(angle);
          const isDrag = dragOver === angle;

          return (
            <div key={angle} style={{ position: 'relative' }}>
              <input
                id={`img-${angle}`}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleInputChange(angle)}
              />
              <label
                htmlFor={`img-${angle}`}
                onDragOver={(e) => { e.preventDefault(); setDragOver(angle); }}
                onDragLeave={() => setDragOver(null)}
                onDrop={handleDrop(angle)}
                style={{
                  display: 'block',
                  aspectRatio: '4/3',
                  borderRadius: 'var(--radius-md)',
                  border: `2px dashed ${img ? 'var(--color-accent)' : isDrag ? 'var(--color-primary)' : required ? 'rgba(0,87,255,0.3)' : 'var(--color-border)'}`,
                  background: img ? 'transparent' : isDrag ? 'var(--color-primary-glow)' : 'var(--color-surface-2)',
                  cursor: 'pointer',
                  overflow: 'hidden',
                  position: 'relative',
                  transition: 'border-color 0.2s, background 0.2s',
                }}
              >
                {img ? (
                  // Preview
                  <img src={img.preview} alt={label} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  // Upload zone
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 8, padding: 8 }}>
                    <ImageIcon size={22} color={required ? 'var(--color-primary-light)' : 'var(--color-text-muted)'} />
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: required ? 'var(--color-text-secondary)' : 'var(--color-text-muted)', textAlign: 'center', lineHeight: 1.3 }}>
                      {label}
                      {required && <span style={{ color: 'var(--color-primary-light)' }}> *</span>}
                    </span>
                  </div>
                )}
              </label>

              {/* Uploaded indicator & remove button */}
              {img && (
                <>
                  <div style={{ position: 'absolute', bottom: 6, left: 6, background: 'rgba(0,0,0,0.6)', borderRadius: 6, padding: '2px 8px', fontSize: '0.7rem', color: '#fff', fontWeight: 600 }}>
                    {label}
                  </div>
                  <button
                    onClick={(e) => { e.preventDefault(); removeImage(angle); }}
                    style={{ position: 'absolute', top: 6, right: 6, width: 22, height: 22, borderRadius: '50%', background: 'rgba(239,68,68,0.9)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer' }}
                  >
                    <X size={12} />
                  </button>
                  <div style={{ position: 'absolute', top: 6, left: 6, width: 20, height: 20, borderRadius: '50%', background: 'var(--color-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Check size={11} color="#0A0C12" strokeWidth={3} />
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* Upload summary */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
        <span><strong style={{ color: 'var(--color-text-primary)' }}>{uploaded.size}</strong> / {IMAGE_SLOTS.length} images uploaded</span>
        {!canSubmit && requiredMissing.length > 0 && (
          <span style={{ color: 'var(--color-warning)' }}>
            Required: {requiredMissing.map((s) => s.label).join(', ')}
          </span>
        )}
      </div>

      <button
        className="btn btn-primary btn-full btn-lg"
        onClick={handleSubmit}
        disabled={!canSubmit || submitting}
      >
        {submitting ? 'Uploading…' : 'Run AI Analysis'} <ArrowRight size={18} />
      </button>
    </div>
  );
}
