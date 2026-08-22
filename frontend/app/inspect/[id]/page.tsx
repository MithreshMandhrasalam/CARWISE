'use client';
import { use } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { ReportViewer } from '@/components/inspection/ReportViewer';
import { DEMO_INSPECTIONS } from '@/lib/mockData';
import { EmptyState } from '@/components/ui/EmptyState';

export default function InspectionReportPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const report = DEMO_INSPECTIONS.find((i) => i.id === resolvedParams.id) || DEMO_INSPECTIONS[0];

  if (!report) {
    return (
      <AppShell title="Report Not Found">
        <EmptyState
          title="Inspection Report Not Found"
          description="The requested inspection report identifier does not exist or has expired."
          actionLabel="Return to Dashboard"
          onAction={() => window.location.href = '/dashboard'}
        />
      </AppShell>
    );
  }

  return (
    <AppShell
      title={`Vehicle Audit: ${report.vehicleInfo.year} ${report.vehicleInfo.make} ${report.vehicleInfo.model}`}
      subtitle={`Comprehensive condition, evidence confidence, and trust assessment report.`}
      action={
        <Link href="/dashboard" className="btn btn-ghost btn-sm">
          <ArrowLeft size={14} /> Back to Dashboard
        </Link>
      }
    >
      <ReportViewer report={report} />
    </AppShell>
  );
}
