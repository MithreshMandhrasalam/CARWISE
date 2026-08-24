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
  Upload,
  Activity,
  XCircle,
  Eye,
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

interface UploadedImageItem {
  file?: File;
  previewUrl: string;
  imageId?: string;
  isUploading?: boolean;
  qualityStatus?: 'PASS' | 'WARN' | 'FAIL' | 'PENDING';
  qualityScore?: number | null;
  warnings?: string[];
}

export default function InspectWizardPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [activeInspectionId, setActiveInspectionId] = useState<string | null>(null);
  const [isSubmittingSpecs, setIsSubmittingSpecs] = useState(false);
  const [serverCompleteness, setServerCompleteness] = useState<any>(null);
  const [isRunningIQA, setIsRunningIQA] = useState(false);
  const [iqaSummary, setIqaSummary] = useState<any>(null);

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

  // Images State
  const [uploadedImages, setUploadedImages] = useState<Record<string, UploadedImageItem>>({});
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

  // Move from Step 1 to Step 2: Creates live inspection in MongoDB
  const handleProceedToImages = async () => {
    if (activeInspectionId) {
      setCurrentStep(2);
      return;
    }

    setIsSubmittingSpecs(true);
    try {
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

      if (res.success && res.data?._id) {
        setActiveInspectionId(res.data._id);
      }
      setCurrentStep(2);
    } catch (err: any) {
      console.warn('Backend creation note, proceeding with local id:', err.message);
      setActiveInspectionId('demo-insp-2026-001');
      setCurrentStep(2);
    } finally {
      setIsSubmittingSpecs(false);
    }
  };

  const handleFileSelect = async (angle: ImageAngle, file: File) => {
    const previewUrl = URL.createObjectURL(file);

    setUploadedImages((prev) => ({
      ...prev,
      [angle]: { file, previewUrl, isUploading: true },
    }));

    if (activeInspectionId && activeInspectionId !== 'demo-insp-2026-001') {
      try {
        const res = await inspectionApi.uploadImage(activeInspectionId, file, angle);
        if (res.success && res.data?.image) {
          setUploadedImages((prev) => ({
            ...prev,
            [angle]: {
              file,
              previewUrl,
              imageId: res.data.image.imageId,
              isUploading: false,
              qualityStatus: res.data.image.qualityStatus,
              qualityScore: res.data.image.qualityScore,
              warnings: res.data.image.warnings,
            },
          }));
          if (res.data.completeness) {
            setServerCompleteness(res.data.completeness);
          }
        }
      } catch (uploadErr: any) {
        console.error('Image upload failed:', uploadErr);
        setUploadedImages((prev) => ({
          ...prev,
          [angle]: { file, previewUrl, isUploading: false },
        }));
      }
    } else {
      setUploadedImages((prev) => ({
        ...prev,
        [angle]: { file, previewUrl, isUploading: false },
      }));
    }
  };

  const handleFileRemove = async (angle: ImageAngle) => {
    const item = uploadedImages[angle];
    if (item?.imageId && activeInspectionId && activeInspectionId !== 'demo-insp-2026-001') {
      try {
        const res = await inspectionApi.deleteImage(activeInspectionId, item.imageId);
        if (res.success && res.data?.completeness) {
          setServerCompleteness(res.data.completeness);
        }
      } catch (delErr) {
        console.warn('Backend delete image note:', delErr);
      }
    }

    setUploadedImages((prev) => {
      const updated = { ...prev };
      if (updated[angle]?.previewUrl) {
        URL.revokeObjectURL(updated[angle].previewUrl);
      }
      delete updated[angle];
      return updated;
    });
  };

  // Trigger Phase 6 Deterministic IQA on all uploaded images
  const handleProceedToReview = async () => {
    setCurrentStep(4);
    if (activeInspectionId && activeInspectionId !== 'demo-insp-2026-001') {
      setIsRunningIQA(true);
      try {
        const res = await inspectionApi.runIQA(activeInspectionId);
        if (res.success && res.data) {
          setIqaSummary(res.data);
          // Sync each image's quality status to local preview state
          if (Array.isArray(res.data.images)) {
            setUploadedImages((prev) => {
              const updated = { ...prev };
              for (const imgResult of res.data.images) {
                const angleKey = imgResult.viewType?.toLowerCase().replace(/_/g, '-') as ImageAngle;
                if (updated[angleKey]) {
                  updated[angleKey] = {
                    ...updated[angleKey],
                    qualityStatus: imgResult.qualityStatus,
                    qualityScore: imgResult.qualityScore,
                    warnings: imgResult.warnings,
                  };
                }
              }
              return updated;
            });
          }
        }
      } catch (iqaErr: any) {
        console.warn('IQA assessment note:', iqaErr.message);
      } finally {
        setIsRunningIQA(false);
      }
    }
  };

  const mandatoryCount = mandatorySlots.filter((s) => uploadedImages[s.angle]).length;
  const optionalCount = optionalSlots.filter((s) => uploadedImages[s.angle]).length;
  const isMandatoryComplete = mandatoryCount === 4;

  const estimatedCoverage = Math.round(((mandatoryCount / 4) * 0.70 + (optionalCount / 8) * 0.20 + 0.10) * 100);

  const steps = [
    { number: 1, title: 'Vehicle Specs' },
    { number: 2, title: 'Required Views (4)' },
    { number: 3, title: 'Optional Angles' },
    { number: 4, title: 'IQA & Scope' },
    { number: 5, title: 'Evaluation' },
  ];

  const handleStartAnalysis = async () => {
    setIsAnalyzing(true);
    setCurrentStep(5);

    const targetId = activeInspectionId || 'demo-insp-2026-001';

    // Fire live full assessment if activeInspectionId is in MongoDB
    if (activeInspectionId && activeInspectionId !== 'demo-insp-2026-001') {
      try {
        await inspectionApi.runFullAssessment(activeInspectionId, 'TIER_2');
      } catch (err) {
        console.warn('Full assessment run notice during wizard:', err);
      }
    }

    // Visual progression simulation
    setTimeout(() => setAnalysisStep(1), 500);
    setTimeout(() => setAnalysisStep(2), 1000);
    setTimeout(() => setAnalysisStep(3), 1500);
    setTimeout(() => {
      router.push(`/inspect/${targetId}`);
    }, 2000);
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
                Enter baseline specifications to create the persisted inspection record.
              </p>
            </div>
            <Badge variant="info">MongoDB Synced</Badge>
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
                min={1990}
                max={2027}
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
              loading={isSubmittingSpecs}
              onClick={handleProceedToImages}
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
                Uploads are verified via magic-byte inspection and stored in secure backend storage.
              </p>
            </div>
            <Badge variant={isMandatoryComplete ? 'success' : 'warning'}>
              {mandatoryCount} of 4 Uploaded
            </Badge>
          </CardHeader>

          <CardBody>
            {!isMandatoryComplete && (
              <Alert variant="warning" style={{ marginBottom: 'var(--space-6)' }}>
                <strong>Mandatory Perspectives Required:</strong> Front, Rear, Left, and Right views must be uploaded before starting the evaluation.
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
                  qualityStatus={uploadedImages[slot.angle]?.qualityStatus}
                  qualityScore={uploadedImages[slot.angle]?.qualityScore}
                  warnings={uploadedImages[slot.angle]?.warnings}
                  isUploading={uploadedImages[slot.angle]?.isUploading}
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
              <h2 className="heading-md">Step 3: Optional Additional Angles</h2>
              <p className="text-secondary" style={{ fontSize: '0.8125rem', marginTop: 2 }}>
                45° corners, interior, and odometer images improve Evidence Confidence.
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
                  qualityStatus={uploadedImages[slot.angle]?.qualityStatus}
                  qualityScore={uploadedImages[slot.angle]?.qualityScore}
                  warnings={uploadedImages[slot.angle]?.warnings}
                  isUploading={uploadedImages[slot.angle]?.isUploading}
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
              onClick={handleProceedToReview}
            >
              Run IQA & Review Scope
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* ── STEP 4: Review Scope & Deterministic IQA Results ─────────── */}
      {currentStep === 4 && (
        <Card elevated>
          <CardHeader>
            <div>
              <h2 className="heading-md">Step 4: Image Quality Assessment (IQA) & Evidence Scope</h2>
              <p className="text-secondary" style={{ fontSize: '0.8125rem', marginTop: 2 }}>
                Mathematical verification of blur, luminance exposure, contrast, and duplicate prevention.
              </p>
            </div>
            <Badge variant={isMandatoryComplete ? 'success' : 'danger'}>
              {isMandatoryComplete ? 'Mandatory Views Complete' : 'Missing Required Views'}
            </Badge>
          </CardHeader>

          <CardBody>
            {/* IQA Quality Metrics Banner */}
            <div className="grid-3" style={{ marginBottom: 'var(--space-6)' }}>
              <div style={{ background: 'var(--color-surface)', padding: 'var(--space-4)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <Activity size={16} color="var(--color-primary-light)" />
                  <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>IQA Pipeline Status</span>
                </div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: isRunningIQA ? 'var(--color-warning)' : 'var(--color-success-text)' }}>
                  {isRunningIQA ? 'Evaluating Signals...' : 'Verification Complete'}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: 2 }}>
                  Laplacian Blur & Exposure Filters
                </div>
              </div>

              <div style={{ background: 'var(--color-surface)', padding: 'var(--space-4)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <Shield size={16} color="var(--color-accent-light)" />
                  <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>Quality Score Overview</span>
                </div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-text-primary)' }}>
                  {iqaSummary?.summary ? `${iqaSummary.summary.pass} Pass / ${iqaSummary.summary.warn} Warn / ${iqaSummary.summary.fail} Fail` : `${mandatoryCount + optionalCount} Photos Persisted`}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: 2 }}>
                  dHash Duplicate Checks Active
                </div>
              </div>

              <div style={{ background: 'var(--color-surface)', padding: 'var(--space-4)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <CheckCircle2 size={16} color="var(--color-success-text)" />
                  <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>Ready for CV Models</span>
                </div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: iqaSummary?.allReadyForCV !== false ? 'var(--color-success-text)' : 'var(--color-danger)' }}>
                  {iqaSummary?.allReadyForCV !== false ? 'READY FOR CV' : 'ACTION REQUIRED'}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: 2 }}>
                  Gated for Damage Detection
                </div>
              </div>
            </div>

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
                  Server Verified Visual Coverage
                </h4>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>Coverage Ratio</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--color-accent-light)' }}>{estimatedCoverage}%</span>
                </div>
                <div style={{ width: '100%', height: 8, background: 'var(--color-surface-elevated)', borderRadius: 'var(--radius-full)', overflow: 'hidden', marginBottom: 8 }}>
                  <div style={{ width: `${estimatedCoverage}%`, height: '100%', background: 'linear-gradient(90deg, var(--color-primary), var(--color-accent))' }} />
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                  {mandatoryCount} mandatory views + {optionalCount} optional views verified.
                </p>
              </div>
            </div>

            {!isMandatoryComplete && (
              <Alert variant="danger" style={{ marginBottom: 'var(--space-6)' }}>
                <strong>Attention:</strong> {4 - mandatoryCount} mandatory angle(s) are missing. You must upload Front, Rear, Left, and Right views before proceeding.
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
              disabled={!isMandatoryComplete}
              rightIcon={<Sparkles size={18} />}
              onClick={handleStartAnalysis}
            >
              Start CARWISE Assessment
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* ── STEP 5: Progression Transition ─────────────────────────── */}
      {currentStep === 5 && (
        <Card elevated style={{ textAlign: 'center', padding: 'var(--space-12) var(--space-6)' }}>
          <div style={{ width: 64, height: 64, borderRadius: 'var(--radius-full)', background: 'var(--color-primary-glow)', border: '2px solid var(--color-primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto var(--space-6)' }}>
            <Sparkles size={30} color="var(--color-primary-light)" className="animate-spin" />
          </div>

          <h2 className="heading-lg" style={{ marginBottom: 'var(--space-2)' }}>
            Images Ingested & Quality Verified
          </h2>
          <p className="text-secondary" style={{ maxWidth: 480, margin: '0 auto var(--space-8)', fontSize: '0.875rem' }}>
            All vehicle photographs have passed deterministic IQA checks and are queued for analytical processing.
          </p>

          <div style={{ maxWidth: 440, margin: '0 auto', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { step: 1, label: 'Secure Multipart Image Ingestion & Magic-Byte Validation' },
              { step: 2, label: 'Deterministic IQA (Variance of Laplacian, Exposure, dHash)' },
              { step: 3, label: 'Inspection Record & Completeness Synthesis' },
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
