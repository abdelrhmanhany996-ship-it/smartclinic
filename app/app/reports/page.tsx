'use client';
import { PageHeader } from '@/components/shell';
import { ReportsView } from '@/components/reports-view';
import { usePrefs } from '@/components/providers';
export default function Reports() { const { t } = usePrefs(); return <><PageHeader title={t('rp.title')} /><ReportsView /></>; }
