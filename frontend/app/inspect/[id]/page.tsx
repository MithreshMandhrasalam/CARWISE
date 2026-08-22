'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import ReportViewer from '@/components/inspection/ReportViewer';
import { inspectionApi } from '@/lib/api';
import { Inspection } from '@/lib/types';
import { Loader, AlertCircle } from 'lucide-react';

export default function InspectionReportPage() {
  const { id } = useParams<{ id: string }>();
  const [inspection, setInspection] = useState<Inspection | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await inspectionApi.get(id);
        setInspection(data.data);
      } catch {
        setError('Failed to load inspection report.');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [id]);

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />
      <div className="container" style={{ padding: 'var(--space-10) var(--space-6)', flex: 1 }}>
        {loading && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
            <Loader size={40} color="var(--color-primary-light)" className="animate-spin" />
          </div>
        )}
        {error && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, minHeight: 400, justifyContent: 'center' }}>
            <AlertCircle size={48} color="var(--color-danger)" />
            <p style={{ color: 'var(--color-text-secondary)' }}>{error}</p>
          </div>
        )}
        {inspection && <ReportViewer inspection={inspection} />}
      </div>
      <Footer />
    </div>
  );
}
