import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'AutoTrust AI — Used Car Inspection Platform',
  description:
    'AI-powered used car inspection and trust platform. Detect vehicle damage, estimate fair market prices, and get a comprehensive vehicle condition report before you buy.',
  keywords: 'used car inspection, AI car evaluation, vehicle damage detection, car price estimator, AutoTrust',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
