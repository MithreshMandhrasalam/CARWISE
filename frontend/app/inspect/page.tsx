'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Car,
  Camera,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Info,
  Shield,
  Layers,
  AlertTriangle,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { Card, CardHeader, CardBody, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { StepperProgress } from '@/components/ui/ProgressIndicator';
import { ImagePreviewCard } from '@/components/ui/ImagePreviewCard';
import { Alert } from '@/components/ui/Alert';
import { Badge } from '@/components/ui/Badge';
import { ImageAngle, MandatoryImageAngle, OptionalImageAngle, VehicleInfo } from '@/lib/types';
import { inspectionApi } from '@/lib/api';

interface UploadedFilesState {
  [key: string]: { file: File; previewUrl: string };
}

export default function InspectWizardPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);

  // Form State
  const [vehicleInfo, setVehicleInfo] = useState<VehicleInfo>({
    make: 'Honda',
    model: 'City',
    variant: 'ZX 1.5 i-VTEC',
    year: 2021,
    fuelType: 'petrol',
    transmission: 'manual',
    mileageKm: 42500,
    askingPrice: 890000,
    currency: 'INR',
    location: 'Bengaluru, Karnataka',
    vinOrReg: 'KA01MJ4921',
  });

  // Images State (Local Preview Only)
  const [uploadedImages, setUploadedImages] = useState<UploadedFilesState>({});
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState(0);

  const mandatorySlots: Array<{ angle: MandatoryImageAngle; label: string; description: string }> = [
    { angle: 'front', label: 'Front View', description: 'Direct front angle capturing hood, grille, and bumper' },
    { angle: 'rear', label: 'Rear View', description: 'Direct rear angle capturing boot lid, bumper, and lights' },
    { angle: 'left', label: 'Left Side Profile', description: 'Complete side profile capturing front/rear doors and fenders' },
    { angle: 'right', label: 'Right Side Profile', description: 'Complete side profile capturing right side doors and panels' },
  ];

  const optionalSlots: Array<{ angle: OptionalImageAngle; label: string; description: string }> = [
    { angle: 'front-left', label: 'Front-Left 45°', description: 'Three-quarter angle showing front bumper and left fender joint' },
    { angle: 'front-right', label: 'Front-Right 45°', description: 'Three-quarter angle showing front bumper and right fender joint' },
    { angle: 'rear-left', label: 'Rear-Left 45°', description: 'Three-quarter angle showing rear bumper and left quarter panel' },
    { angle: 'rear-right', label: 'Rear-Right 45°', description: 'Three-quarter angle showing rear bumper and right quarter panel' },
    { angle: 'interior', label: 'Interior Cabin', description: 'Driver seat, steering wheel, and upholstery overview' },
    { angle: 'dashboard', label: 'Dashboard & Odometer', description: 'Instrument cluster showing odometer reading and warning lights' },
    { angle: 'engine', label: 'Engine Bay (Experimental)', description: 'Under-hood overview for visual inspection baseline' },
    { angle: 'tyres', label: 'Tyre Tread & Wheels', description: 'Close-up of front/rear tyre tread and wheel condition' },
  ];

  const handleFileSelect = (angle: ImageAngle, file: File) => {
    const previewUrl = URL.createObjectURL(file);
    setUploadedImages((prev) => ({
      ...prev,
      [angle]: { file, previewUrl },
    }));
  };

  const handleFileRemove = (angle: ImageAngle) => {
    setUploadedImages((prev) => {
      const updated = { ...prev };
      if (updated[angle]?.previewUrl) {
        URL.revokeObjectURL(updated[angle].previewUrl);
      }
      delete updated[angle];
      return updated;
    });
  };

  const mandatoryCount = mandatorySlots.filter((s) => uploadedImages[s.angle]).length;
  const optionalCount = optionalSlots.filter((s) => uploadedImages[s.angle]).length;
  const isMandatoryComplete = mandatoryCount === 4;

  // Local Evidence Completeness calculation for preview
  const estimatedCoverage = Math.round(((mandatoryCount / 4) * 0.70 + (optionalCount / 8) * 0.20 + 0.10) * 100);

  const steps = [
    { number: 1, title: 'Vehicle Specs' },
    { number: 2, title: 'Required Views (4)' },
    { number: 3, title: 'Optional Angles' },
    { number: 4, title: 'Review & Scope' },
    { number: 5, title: 'Evaluation' },
  ];

  const handleStartAnalysis = async () => {
    setIsAnalyzing(true);
    setCurrentStep(5);

    try {
      // Step 1: Create real inspection record in MongoDB via Backend API
      const res = await inspectionApi.create({
        make: vehicleInfo.make,
        model: vehicleInfo.model,
        variant: vehicleInfo.variant,
        year: vehicleInfo.year,
        fuelType: vehicleInfo.fuelType,
        transmission: vehicleInfo.transmission,
        mileageKm: vehicleInfo.mileageKm,
        askingPrice: vehicleInfo.askingPrice,
        location: vehicleInfo.location,
        registrationNumber: vehicleInfo.vinOrReg,
      });

      const newId = res.data?._id || 'demo-insp-2026-001';

      // Visual progression simulation for prototype flow
      setTimeout(() => setAnalysisStep(1), 600);
      setTimeout(() => setAnalysisStep(2), 1200);
      setTimeout(() => setAnalysisStep(3), 1800);
      setTimeout(() => {
        router.push(`/inspect/${newId}`);
      }, 2400);
    } catch (err: any) {
      console.warn('Backend API connection note:', err.message);
      // If backend is in mock/offline mode, fallback gracefully to demo ID
      setTimeout(() => setAnalysisStep(1), 600);
      setTimeout(() => setAnalysisStep(2), 1200);
      setTimeout(() => setAnalysisStep(3), 1800);
      setTimeout(() => {
        router.push('/inspect/demo-insp-2026-001');
      }, 2400);
    }
  };

  return (
    <AppShell
      title="Used Vehicle Inspection Wizard"
      subtitle="Follow the 5-step guided process to evaluate vehicle condition and evidence certainty."
      containerSize="lg"
      requireAuth={true}
    >
      {/* ── Wizard Stepper Header ────────────────────────────────────── */}
      <Card style={{ marginBottom: 'var(--space-8)', padding: 'var(--space-6)' }}>
        <StepperProgress
          steps={steps}
          currentStep={currentStep}
          onStepClick={(step) => !isAnalyzing && setCurrentStep(step)}
        />
      </Card>

      {/* ── STEP 1: Vehicle Information Form ────────────────────────── */}
      {currentStep === 1 && (
        <Card elevated>
          <CardHeader>
            <div>
              <h2 className="heading-md">Step 1: Vehicle Information & Listing Details</h2>
              <p className="text-secondary" style={{ fontSize: '0.8125rem', marginTop: 2 }}>
                Enter the baseline specifications for accurate price bracket and age factor evaluation.
              </p>
            </div>
            <Badge variant="info">Baseline Data</Badge>
          </CardHeader>

          <CardBody>
            <div className="grid-2">
              <Input
                label="Make"
                placeholder="e.g. Honda, Hyundai, Maruti"
                value={vehicleInfo.make}
                onChange={(e) => setVehicleInfo({ ...vehicleInfo, make: e.target.value })}
                required
              />
              <Input
                label="Model"
                placeholder="e.g. City, Creta, Swift"
                value={vehicleInfo.model}
                onChange={(e) => setVehicleInfo({ ...vehicleInfo, model: e.target.value })}
                required
              />
            </div>

            <div className="grid-3">
              <Input
                label="Variant / Trim"
                placeholder="e.g. ZX 1.5 i-VTEC"
                value={vehicleInfo.variant || ''}
                onChange={(e) => setVehicleInfo({ ...vehicleInfo, variant: e.target.value })}
              />
              <Input
                label="Manufacturing Year"
                type="number"
                min={2000}
                max={2026}
                value={vehicleInfo.year}
                onChange={(e) => setVehicleInfo({ ...vehicleInfo, year: Number(e.target.value) })}
                required
              />
              <Input
                label="Odometer (Kilometers)"
                type="number"
                min={0}
                value={vehicleInfo.mileageKm}
                onChange={(e) => setVehicleInfo({ ...vehicleInfo, mileageKm: Number(e.target.value) })}
                required
              />
            </div>

            <div className="grid-3">
              <Select
                label="Fuel Type"
                value={vehicleInfo.fuelType}
                onChange={(e) => setVehicleInfo({ ...vehicleInfo, fuelType: e.target.value as any })}
                options={[
                  { value: 'petrol', label: 'Petrol' },
                  { value: 'diesel', label: 'Diesel' },
                  { value: 'cng', label: 'CNG' },
                  { value: 'electric', label: 'Electric' },
                  { value: 'hybrid', label: 'Hybrid' },
                ]}
              />
              <Select
                label="Transmission"
                value={vehicleInfo.transmission}
                onChange={(e) => setVehicleInfo({ ...vehicleInfo, transmission: e.target.value as any })}
                options={[
                  { value: 'manual', label: 'Manual' },
                  { value: 'automatic', label: 'Automatic' },
                  { value: 'amt', label: 'AMT' },
                ]}
              />
              <Input
                label="Asking Price (INR ₹)"
                type="number"
                value={vehicleInfo.askingPrice}
                onChange={(e) => setVehicleInfo({ ...vehicleInfo, askingPrice: Number(e.target.value) })}
                required
              />
            </div>

            <div className="grid-2">
              <Input
                label="City / Location"
                placeholder="e.g. Bengaluru, Karnataka"
                value={vehicleInfo.location || ''}
                onChange={(e) => setVehicleInfo({ ...vehicleInfo, location: e.target.value })}
              />
              <Input
                label="Registration / VIN (Optional)"
                placeholder="e.g. KA01MJ4921"
                value={vehicleInfo.vinOrReg || ''}
                onChange={(e) => setVehicleInfo({ ...vehicleInfo, vinOrReg: e.target.value })}
                hint="Used for registration sanity check and record alignment"
              />
            </div>
          </CardBody>

          <CardFooter>
            <Button
              variant="primary"
              rightIcon={<ArrowRight size={16} />}
              onClick={() => setCurrentStep(2)}
            >
              Continue to Required Images
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* ── STEP 2: Required Images (4 Mandatory Views) ─────────────── */}
      {currentStep === 2 && (
        <Card elevated>
          <CardHeader>
            <div>
              <h2 className="heading-md">Step 2: Four Mandatory Vehicle Perspectives</h2>
              <p className="text-secondary" style={{ fontSize: '0.8125rem', marginTop: 2 }}>
                Front, Rear, Left, and Right views are required to establish minimal visual coverage.
              </p>
            </div>
            <Badge variant={isMandatoryComplete ? 'success' : 'warning'}>
              {mandatoryCount} of 4 Uploaded
            </Badge>
          </CardHeader>

          <CardBody>
            {!isMandatoryComplete && (
              <Alert variant="warning" style={{ marginBottom: 'var(--space-6)' }}>
                <strong>Mandatory View Requirement:</strong> All 4 primary vehicle perspectives are needed for a full evaluation. Omitting an angle reduces Evidence Completeness and caps the Assessment Trust Score.
              </Alert>
            )}

            <div className="grid-2">
              {mandatorySlots.map((slot) => (
                <ImagePreviewCard
                  key={slot.angle}
                  angle={slot.angle}
                  label={slot.label}
                  description={slot.description}
                  isMandatory={true}
                  previewUrl={uploadedImages[slot.angle]?.previewUrl}
                  onFileSelect={handleFileSelect}
                  onFileRemove={handleFileRemove}
                />
              ))}
            </div>
          </CardBody>

          <CardFooter>
            <Button variant="ghost" leftIcon={<ArrowLeft size={16} />} onClick={() => setCurrentStep(1)}>
              Back to Specs
            </Button>
            <Button
              variant="primary"
              rightIcon={<ArrowRight size={16} />}
              onClick={() => setCurrentStep(3)}
            >
              Continue to Optional Angles
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* ── STEP 3: Optional Angles ─────────────────────────────────── */}
      {currentStep === 3 && (
        <Card elevated>
          <CardHeader>
            <div>
              <h2 className="heading-md">Step 3: Optional Additional Angles (Recommended)</h2>
              <p className="text-secondary" style={{ fontSize: '0.8125rem', marginTop: 2 }}>
                45° corner perspectives, cabin, and odometer photos increase Evidence Completeness up to 100%.
              </p>
            </div>
            <Badge variant="info">{optionalCount} of 8 Optional Views</Badge>
          </CardHeader>

          <CardBody>
            <div className="grid-2">
              {optionalSlots.map((slot) => (
                <ImagePreviewCard
                  key={slot.angle}
                  angle={slot.angle}
                  label={slot.label}
                  description={slot.description}
                  isMandatory={false}
                  previewUrl={uploadedImages[slot.angle]?.previewUrl}
                  onFileSelect={handleFileSelect}
                  onFileRemove={handleFileRemove}
                />
              ))}
            </div>
          </CardBody>

          <CardFooter>
            <Button variant="ghost" leftIcon={<ArrowLeft size={16} />} onClick={() => setCurrentStep(2)}>
              Back to Required Views
            </Button>
            <Button
              variant="primary"
              rightIcon={<ArrowRight size={16} />}
              onClick={() => setCurrentStep(4)}
            >
              Review Scope & Evidence
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* ── STEP 4: Review Scope & Evidence Completeness ────────────── */}
      {currentStep === 4 && (
        <Card elevated>
          <CardHeader>
            <div>
              <h2 className="heading-md">Step 4: Review Evidence & Inspection Scope</h2>
              <p className="text-secondary" style={{ fontSize: '0.8125rem', marginTop: 2 }}>
                Verify vehicle details and preview the evidence confidence coverage before initiating assessment.
              </p>
            </div>
            <span className="demo-banner">
              <Sparkles size={12} /> Ready for Evaluation
            </span>
          </CardHeader>

          <CardBody>
            <div className="grid-2" style={{ marginBottom: 'var(--space-6)' }}>
              {/* Specs Summary Card */}
              <div style={{ background: 'var(--color-surface)', padding: 'var(--space-4)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                <h4 style={{ fontWeight: 700, fontSize: '0.875rem', marginBottom: 'var(--space-3)', color: 'var(--color-primary-light)' }}>
                  Vehicle Specifications
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: '0.8125rem' }}>
                  <div><span className="text-muted">Vehicle:</span> <strong>{vehicleInfo.year} {vehicleInfo.make} {vehicleInfo.model}</strong></div>
                  <div><span className="text-muted">Variant:</span> <strong>{vehicleInfo.variant || 'N/A'}</strong></div>
                  <div><span className="text-muted">Mileage:</span> <strong>{vehicleInfo.mileageKm.toLocaleString()} km</strong></div>
                  <div><span className="text-muted">Asking:</span> <strong>₹{(vehicleInfo.askingPrice / 100000).toFixed(2)} Lakhs</strong></div>
                  <div><span className="text-muted">Fuel & Trans:</span> <strong>{vehicleInfo.fuelType} • {vehicleInfo.transmission}</strong></div>
                  <div><span className="text-muted">Location:</span> <strong>{vehicleInfo.location || 'N/A'}</strong></div>
                </div>
              </div>

              {/* Evidence Coverage Card */}
              <div style={{ background: 'var(--color-surface)', padding: 'var(--space-4)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                <h4 style={{ fontWeight: 700, fontSize: '0.875rem', marginBottom: 'var(--space-3)', color: 'var(--color-accent-light)' }}>
                  Estimated Evidence Completeness
                </h4>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>Visual Angle Coverage</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--color-accent-light)' }}>{estimatedCoverage}%</span>
                </div>
                <div style={{ width: '100%', height: 8, background: 'var(--color-surface-elevated)', borderRadius: 'var(--radius-full)', overflow: 'hidden', marginBottom: 8 }}>
                  <div style={{ width: `${estimatedCoverage}%`, height: '100%', background: 'linear-gradient(90deg, var(--color-primary), var(--color-accent))' }} />
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                  {mandatoryCount} mandatory views + {optionalCount} optional views submitted.
                </p>
              </div>
            </div>

            {!isMandatoryComplete && (
              <Alert variant="danger" style={{ marginBottom: 'var(--space-6)' }}>
                <strong>Warning:</strong> {4 - mandatoryCount} mandatory angle(s) are missing. In real analysis, omitted mandatory angles cause high uncertainty and cap the Assessment Trust Score at 55.
              </Alert>
            )}
          </CardBody>

          <CardFooter>
            <Button variant="ghost" leftIcon={<ArrowLeft size={16} />} onClick={() => setCurrentStep(3)}>
              Back to Images
            </Button>
            <Button
              variant="primary"
              size="lg"
              rightIcon={<Sparkles size={18} />}
              onClick={handleStartAnalysis}
            >
              Start CARWISE Assessment
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* ── STEP 5: Demonstration Analysis Progression ─────────────── */}
      {currentStep === 5 && (
        <Card elevated style={{ textAlign: 'center', padding: 'var(--space-12) var(--space-6)' }}>
          <div style={{ width: 64, height: 64, borderRadius: 'var(--radius-full)', background: 'var(--color-primary-glow)', border: '2px solid var(--color-primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto var(--space-6)' }}>
            <Sparkles size={30} color="var(--color-primary-light)" className="animate-spin" />
          </div>

          <h2 className="heading-lg" style={{ marginBottom: 'var(--space-2)' }}>
            CARWISE Analytical Pipeline In Progress
          </h2>
          <p className="text-secondary" style={{ maxWidth: 480, margin: '0 auto var(--space-8)', fontSize: '0.875rem' }}>
            Simulating multi-layer assessment across IQA verification, 8-zone damage correlation, and trust score compilation.
          </p>

          <div style={{ maxWidth: 440, margin: '0 auto', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { step: 1, label: 'Deterministic Image Quality Assessment (Blur, Exposure, Duplicate Check)' },
              { step: 2, label: 'Cross-View Vehicle-Zone Mapping & Spatial Correlation' },
              { step: 3, label: 'Condition Score ($S_{condition}$) & Trust Score Compilation' },
            ].map((s) => (
              <div
                key={s.step}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-md)',
                  background: analysisStep >= s.step ? 'var(--color-surface-elevated)' : 'transparent',
                  border: `1px solid ${analysisStep >= s.step ? 'var(--color-primary)' : 'var(--color-border-subtle)'}`,
                  fontSize: '0.8125rem',
                  color: analysisStep >= s.step ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
                }}
              >
                {analysisStep >= s.step ? (
                  <CheckCircle2 size={16} color="var(--color-success-text)" />
                ) : (
                  <div style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid var(--color-border)' }} />
                )}
                <span>{s.label}</span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </AppShell>
  );
}
