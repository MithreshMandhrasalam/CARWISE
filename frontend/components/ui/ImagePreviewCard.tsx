'use client';
import React, { useRef, useState } from 'react';
import { Upload, X, RefreshCw, CheckCircle2, AlertTriangle, Eye } from 'lucide-react';
import { ImageAngle, IQAResult } from '@/lib/types';
import { Badge } from './Badge';

export interface ImagePreviewCardProps {
  angle: ImageAngle;
  label: string;
  description: string;
  isMandatory: boolean;
  file?: File;
  previewUrl?: string;
  iqaResult?: IQAResult;
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
  iqaResult,
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
        <Badge variant={isMandatory ? 'primary' : 'default'} style={{ fontSize: '0.6875rem' }}>
          {isMandatory ? 'Mandatory' : 'Optional'}
        </Badge>
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

          {/* IQA Quality Badge Preview (Simulation/Feedback) */}
          {iqaResult && (
            <div
              style={{
                position: 'absolute',
                bottom: 8,
                left: 8,
                zIndex: 10,
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                padding: '2px 8px',
                borderRadius: 'var(--radius-xs)',
                fontSize: '0.6875rem',
                fontWeight: 600,
                background: iqaResult.status === 'PASS' ? 'rgba(16, 185, 129, 0.9)' : 'rgba(245, 158, 11, 0.9)',
                color: '#FFFFFF',
              }}
            >
              {iqaResult.status === 'PASS' ? <CheckCircle2 size={12} /> : <AlertTriangle size={12} />}
              <span>{iqaResult.status === 'PASS' ? 'Quality Verified' : 'Exposure/Blur Warning'}</span>
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
              JPG, PNG, or WEBP (Max 15MB)
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
