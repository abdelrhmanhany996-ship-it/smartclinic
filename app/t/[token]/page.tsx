import type { Metadata } from 'next';
import Tracker from '@/components/tracker';
export async function generateMetadata({ params }: { params: Promise<{ token: string }> }): Promise<Metadata> {
  const { token } = await params;
  return { title: 'My Appointment', robots: { index: false, follow: false }, referrer: 'no-referrer', manifest: `/t/${token}/manifest.webmanifest` };
}
export default async function Page({ params }: { params: Promise<{ token: string }> }) {
  return <Tracker token={(await params).token} />;
}
