import type { Metadata } from 'next';
import Tracker from '@/components/tracker';
export const metadata: Metadata = { title: 'My Appointment', robots: { index: false, follow: false }, referrer: 'no-referrer' };
export default async function Page({ params }: { params: Promise<{ token: string }> }) {
  return <Tracker token={(await params).token} />;
}
