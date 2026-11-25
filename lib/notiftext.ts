import { fmtTime12, Lang } from './messages';
type D = Record<string, any>;
const t = (d: D, l: Lang) => (d.time ? fmtTime12(String(d.time).slice(0, 5), l) : '');
export function notifText(kind: string, d: D, lang: Lang): { title: string; body: string } {
  const ar = lang === 'ar';
  switch (kind) {
    case 'confirmed': return ar ? { title: 'تم تأكيد الحجز', body: `رقم دورك ${d.ticket} — ${t(d, lang)}` } : { title: 'Appointment confirmed', body: `Your queue number is ${d.ticket} — ${t(d, lang)}` };
    case 'upcoming': return ar ? { title: 'دورك اقترب', body: 'دورك يقترب. من فضلك استعد لزيارتك.' } : { title: 'Your turn is approaching', body: 'Your turn is approaching. Please prepare for your visit.' };
    case 'your_turn': return ar ? { title: 'حان دورك الآن', body: 'تفضل بالدخول إلى غرفة الطبيب.' } : { title: "It's your turn", body: "Please proceed to the doctor's room now." };
    case 'delay': return ar ? { title: 'تحديث الموعد المتوقع', body: `بسبب تأخر الكشوفات، الموعد المتوقع الآن ${t(d, lang)} (تأخير ${d.delay} دقيقة).` } : { title: 'Estimated time updated', body: `Consultations are running late. Your new estimated time is ${t(d, lang)} (+${d.delay} min).` };
    case 'earlier': return ar ? { title: 'موعدك أقرب', body: `الموعد المتوقع الآن ${t(d, lang)}.` } : { title: 'Good news — earlier turn', body: `Your estimated time is now ${t(d, lang)}.` };
    case 'completed': return ar ? { title: 'اكتملت الزيارة', body: 'شكراً لزيارتك. نتمنى لك الشفاء العاجل.' } : { title: 'Visit completed', body: 'Thank you for visiting. Wishing you good health.' };
    case 'cancelled': return ar ? { title: 'تم إلغاء الموعد', body: 'تم إلغاء موعدك. تواصل مع العيادة لحجز موعد جديد.' } : { title: 'Appointment cancelled', body: 'Your appointment was cancelled. Contact the clinic to rebook.' };
    case 'rescheduled': return ar ? { title: 'تم تغيير الموعد', body: `موعدك الجديد ${d.date} - ${t(d, lang)} — رقم الدور ${d.ticket}` } : { title: 'Appointment rescheduled', body: `New time: ${d.date} at ${t(d, lang)} — queue number ${d.ticket}` };
    case 'skipped': return ar ? { title: 'تم تخطي دورك', body: 'لم تكن حاضراً عند ندائك. توجه للاستقبال لإعادة دورك.' } : { title: 'Your turn was skipped', body: 'You were not present when called. Please see the reception to rejoin.' };
    case 'no_show': return ar ? { title: 'لم تحضر', body: 'تم تسجيل الموعد كغياب.' } : { title: 'Marked as no-show', body: 'Your appointment was marked as missed.' };
    // staff
    case 'booked': return ar ? { title: 'حجز جديد', body: `${d.patient} — ${d.ticket} — ${t(d, lang)}` } : { title: 'New booking', body: `${d.patient} — ${d.ticket} — ${t(d, lang)}` };
    case 'checked_in': return ar ? { title: 'وصل المريض', body: `${d.patient} (${d.ticket})` } : { title: 'Patient arrived', body: `${d.patient} (${d.ticket}) checked in` };
    case 'delay_alert': return ar ? { title: 'تأخير في الطابور', body: `${d.doctor}: التأخير الحالي ${d.delay} دقيقة` } : { title: 'Queue running late', body: `${d.doctor}: current delay is ${d.delay} min` };
    case 'staff_completed': return ar ? { title: 'انتهت الزيارة', body: `${d.patient} (${d.ticket})` } : { title: 'Visit completed', body: `${d.patient} (${d.ticket})` };
    case 'staff_cancelled': return ar ? { title: 'تم إلغاء موعد', body: `${d.patient} (${d.ticket})` } : { title: 'Appointment cancelled', body: `${d.patient} (${d.ticket})` };
    case 'staff_no_show': return ar ? { title: 'غياب مريض', body: `${d.patient} (${d.ticket})` } : { title: 'No-show', body: `${d.patient} (${d.ticket})` };
    default: return { title: kind, body: '' };
  }
}
