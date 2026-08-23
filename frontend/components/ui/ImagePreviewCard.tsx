'use client';
import React, { useRef, useState } from 'react';
import { Upload, X, RefreshCw, CheckCircle2, AlertTriangle, XCircle, Sparkles } from 'lucide-react';
import { ImageAngle } from '@/lib/types';
import { Badge } from './Badge';

export interface ImagePreviewCardProps {
  angle: ImageAngle;
  label: string;
  description: string;
  isMandatory: boolean;
  file?: File;
  previewUrl?: string;
  qualityStatus?: 'PASS' | 'WARN' | 'FAIL' | 'PENDING';
  qualityScore?: number | null;
  warnings?: string[];
  isUploading?: boolean;
  onFileSelect: (angle: ImageAngle, file: File) => void;
  onFileRemove: (angle: ImageAngle) => void;
}

export function ImagePreviewCard({
  angle,
  label,
  description,
  isMandatory,
  file,
  previewUrl,
  qualityStatus,
  qualityScore,
  warnings = [],
  isUploading = false,
  onFileSelect,
  onFileRemove,
}: ImagePreviewCardProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onFileSelect(angle, e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div
      style={{
        background: 'var(--color-surface)',
        border: `1px solid ${isDragOver ? 'var(--color-primary-light)' : 'var(--color-border)'}`,
        borderRadius: 'var(--radius-lg)',
        padding: 'var(--space-4)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-3)',
        transition: 'all var(--transition-fast)',
        boxShadow: isDragOver ? '0 0 16px var(--color-primary-glow)' : 'var(--shadow-sm)',
      }}
    >
      {/* Header with Slot Angle and Mandatory/Optional Tag */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h4 style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--color-text-primary)' }}>
            {label}
          </h4>
          <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: 2 }}>
            {description}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          {qualityStatus && qualityStatus !== 'PENDING' && (
            <Badge
              variant={qualityStatus === 'PASS' ? 'success' : qualityStatus === 'WARN' ? 'warning' : 'danger'}
              style={{ fontSize: '0.6875rem' }}
            >
              {qualityStatus === 'PASS' ? 'IQA PASS' : qualityStatus === 'WARN' ? 'IQA WARN' : 'IQA FAIL'}
              {qualityScore !== null && qualityScore !== undefined ? ` • ${qualityScore}/100` : ''}
            </Badge>
          )}
          <Badge variant={isMandatory ? 'primary' : 'default'} style={{ fontSize: '0.6875rem' }}>
            {isMandatory ? 'Mandatory' : 'Optional'}
          </Badge>
        </div>
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        style={{ display: 'none' }}
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            onFileSelect(angle, e.target.files[0]);
          }
        }}
      />

      {/* Dropzone / Preview Area */}
      {previewUrl ? (
        <div style={{ position: 'relative', width: '100%', height: 160, borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--color-border)' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewUrl}
            alt={`${label} Preview`}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />

          {/* Action Overlay */}
          <div
            style={{
              position: 'absolute',
              top: 8,
              right: 8,
              display: 'flex',
              gap: 6,
              zIndex: 10,
            }}
          >
            <button
              onClick={handleClick}
              title="Replace image"
              className="btn btn-secondary btn-sm"
              style={{ padding: 6, background: 'rgba(14, 18, 27, 0.85)', backdropFilter: 'blur(4px)' }}
            >
              <RefreshCw size={14} />
            </button>
            <button
              onClick={() => onFileRemove(angle)}
              title="Remove image"
              className="btn btn-danger btn-sm"
              style={{ padding: 6 }}
            >
              <X size={14} />
            </button>
          </div>

          {/* IQA Quality Diagnostic Overlay */}
          {qualityStatus && qualityStatus !== 'PENDING' && (
            <div
              style={{
                position: 'absolute',
                bottom: 8,
                left: 8,
                zIndex: 10,
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                padding: '4px 10px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.6875rem',
                fontWeight: 600,
                backdropFilter: 'blur(8px)',
                background:
                  qualityStatus === 'PASS'
                    ? 'rgba(16, 185, 129, 0.90)'
                    : qualityStatus === 'WARN'
                    ? 'rgba(245, 158, 11, 0.90)'
                    : 'rgba(239, 68, 68, 0.90)',
                color: '#FFFFFF',
              }}
            >
              {qualityStatus === 'PASS' ? (
                <CheckCircle2 size={13} />
              ) : qualityStatus === 'WARN' ? (
                <AlertTriangle size={13} />
              ) : (
                <XCircle size={13} />
              )}
              <span>
                {qualityStatus === 'PASS'
                  ? 'Sharp & Clear'
                  : qualityStatus === 'WARN'
                  ? 'Minor Quality Warning'
                  : 'Quality Inadequate'}
              </span>
            </div>
          )}

          {isUploading && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'rgba(7, 9, 14, 0.75)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                color: '#FFF',
                fontSize: '0.8125rem',
                fontWeight: 600,
              }}
            >
              <RefreshCw size={16} className="animate-spin" /> Ingesting & Validating...
            </div>
          )}
        </div>
      ) : (
        <div
          onClick={handleClick}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          tabIndex={0}
          role="button"
          aria-label={`Upload photo for ${label}`}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleClick();
            }
          }}
          style={{
            height: 160,
            borderRadius: 'var(--radius-md)',
            border: `2px dashed ${isMandatory ? 'rgba(37, 99, 235, 0.4)' : 'var(--color-border)'}`,
            background: isDragOver ? 'var(--color-primary-glow)' : 'var(--color-surface-elevated)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 'var(--space-2)',
            cursor: 'pointer',
            textAlign: 'center',
            padding: 'var(--space-3)',
            transition: 'all var(--transition-fast)',
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 'var(--radius-full)',
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: isMandatory ? 'var(--color-primary-light)' : 'var(--color-text-muted)',
            }}
          >
            <Upload size={18} />
          </div>
          <div>
            <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
              Click or drag to upload
            </span>
            <p style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)', marginTop: 2 }}>
              JPG, PNG, or WebP (Up to 20MB)
            </p>
          </div>
        </div>
      )}

      {/* Warnings List */}
      {warnings && warnings.length > 0 && (
        <div style={{ fontSize: '0.6875rem', color: qualityStatus === 'FAIL' ? 'var(--color-danger)' : 'var(--color-warning)', lineHeight: 1.3 }}>
          {warnings.map((w, idx) => (
            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span>•</span>
              <span>{w}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
