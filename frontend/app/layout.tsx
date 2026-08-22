import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';

export const metadata: Metadata = {
  title: 'CARWISE — Car Assessment & Risk With Intelligent Safety & Evidence',
  description:
    'CARWISE is a software-only, AI-powered used-vehicle assessment and buyer decision-support platform. See the Evidence. Know the Risk. Buy Wiser.',
  keywords: 'CARWISE, used car inspection, AI car evaluation, vehicle damage detection, car price estimator, trust score, evidence confidence',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
