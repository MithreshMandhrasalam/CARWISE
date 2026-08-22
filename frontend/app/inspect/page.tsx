'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import VehicleInfoForm from '@/components/inspection/VehicleInfoForm';
import ImageUploader from '@/components/inspection/ImageUploader';
import { inspectionApi } from '@/lib/api';
import { VehicleInfo } from '@/lib/types';
import { CheckCircle, Loader, AlertCircle } from 'lucide-react';

type Step = 'vehicle-info' | 'image-upload' | 'analyzing' | 'done' | 'error';

export default function InspectPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('vehicle-info');
  const [inspectionId, setInspectionId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [analysisStatus, setAnalysisStatus] = useState('Starting analysis...');

  const STEPS = ['Vehicle Info', 'Upload Images', 'AI Analysis', 'Report'];
  const stepIndex = { 'vehicle-info': 0, 'image-upload': 1, 'analyzing': 2, 'done': 3, 'error': 2 };

  const handleVehicleInfoSubmit = async (vehicleInfo: VehicleInfo) => {
    try {
      // Redirect to login if not authenticated
      if (!localStorage.getItem('autotrust_token')) {
        router.push('/auth/login');
        return;
      }
      const { data } = await inspectionApi.create(vehicleInfo as unknown as Record<string, unknown>);
      setInspectionId(data.data._id);
      setStep('image-upload');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to create inspection.';
      setError(msg);
    }
  };

  const handleImagesSubmit = async (files: File[], angles: string[]) => {
    if (!inspectionId) return;
    try {
      await inspectionApi.uploadImages(inspectionId, files, angles);
      setStep('analyzing');
      await inspectionApi.analyze(inspectionId);

      // Poll for completion
      await inspectionApi.pollStatus(inspectionId, (status) => {
        const messages: Record<string, string> = {
          processing: 'Running AI analysis...',
          complete: 'Analysis complete!',
          failed: 'Analysis encountered an error.',
        };
        setAnalysisStatus(messages[status] || status);
      });

      setStep('done');
      setTimeout(() => router.push(`/inspect/${inspectionId}`), 1500);
    } catch (err: unknown) {
      setError('Analysis failed. Please try again.');
      setStep('error');
    }
  };

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />

      <div className="container" style={{ padding: 'var(--space-10) var(--space-6)', flex: 1 }}>
        {/* Step progress */}
        <div style={{ maxWidth: 640, margin: '0 auto var(--space-10)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0 }}>
            {STEPS.map((label, i) => {
              const current = stepIndex[step] ?? 0;
              const isActive = i === current;
              const isDone = i < current;
              return (
                <div key={label} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 700,
                      background: isDone ? 'var(--color-accent)' : isActive ? 'var(--color-primary)' : 'var(--color-surface-3)',
                      color: isDone || isActive ? '#fff' : 'var(--color-text-muted)',
                      border: isActive ? '2px solid var(--color-primary-light)' : '2px solid transparent',
                      transition: 'all 0.3s',
                    }}>
                      {isDone ? '✓' : i + 1}
                    </div>
                    <span style={{ fontSize: '0.75rem', color: isActive ? 'var(--color-text-primary)' : 'var(--color-text-muted)', fontWeight: isActive ? 600 : 400, whiteSpace: 'nowrap' }}>{label}</span>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div style={{ flex: 1, height: 2, background: isDone ? 'var(--color-accent)' : 'var(--color-border)', margin: '0 8px', marginBottom: 22, transition: 'background 0.3s' }} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Step content */}
        <div className="animate-fade-in" style={{ maxWidth: 720, margin: '0 auto' }}>
          {step === 'vehicle-info' && (
            <VehicleInfoForm onSubmit={handleVehicleInfoSubmit} />
          )}

          {step === 'image-upload' && (
            <ImageUploader onSubmit={handleImagesSubmit} />
          )}

          {step === 'analyzing' && (
            <div className="card" style={{ textAlign: 'center', padding: 'var(--space-16)' }}>
              <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'var(--color-primary-glow)', border: '2px solid var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto var(--space-6)' }}>
                <Loader size={32} color="var(--color-primary-light)" className="animate-spin" />
              </div>
              <h2 className="heading-md" style={{ marginBottom: 'var(--space-3)' }}>Analysing Your Vehicle</h2>
              <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--space-4)' }}>{analysisStatus}</p>
              <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>This usually takes 20–60 seconds depending on the number of images.</p>
            </div>
          )}

          {step === 'done' && (
            <div className="card" style={{ textAlign: 'center', padding: 'var(--space-16)' }}>
              <CheckCircle size={64} color="var(--color-success)" style={{ margin: '0 auto var(--space-6)' }} />
              <h2 className="heading-md">Analysis Complete!</h2>
              <p style={{ color: 'var(--color-text-secondary)', marginTop: 'var(--space-2)' }}>Redirecting to your report...</p>
            </div>
          )}

          {step === 'error' && (
            <div className="card" style={{ textAlign: 'center', padding: 'var(--space-16)' }}>
              <AlertCircle size={64} color="var(--color-danger)" style={{ margin: '0 auto var(--space-6)' }} />
              <h2 className="heading-md" style={{ marginBottom: 'var(--space-3)' }}>Analysis Failed</h2>
              <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--space-6)' }}>{error}</p>
              <button className="btn btn-primary" onClick={() => setStep('vehicle-info')}>Try Again</button>
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}
