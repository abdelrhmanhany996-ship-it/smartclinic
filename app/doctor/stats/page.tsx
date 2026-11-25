'use client';
import { PageHeader } from '@/components/shell';
import { ReportsView } from '@/components/reports-view';
import { usePrefs } from '@/components/providers';
export default function Stats() { const { t } = usePrefs(); return <><PageHeader title={t('dr.stats')} /><ReportsView doctorId="me" /></>; }
