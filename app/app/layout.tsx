import type { Metadata } from 'next';
import { Shell } from '@/components/shell';
export const metadata: Metadata = { manifest: '/manifest.webmanifest' };
export default function L({ children }: { children: React.ReactNode }) { return <Shell role="receptionist">{children}</Shell>; }
