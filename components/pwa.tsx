'use client';
import { useEffect } from 'react';
export function Pwa() { useEffect(() => { if ('serviceWorker' in navigator && location.protocol !== 'file:') navigator.serviceWorker.register('/sw.js').catch(() => {}); }, []); return null; }
