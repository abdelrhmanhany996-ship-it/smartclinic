export type Locale = 'en' | 'ar';
type Dict = Record<string, string>;

const en: Dict = {
  'brand.tagline': 'Less Waiting. Better Care.',
  // common
  'common.save': 'Save changes', 'common.cancel': 'Cancel', 'common.close': 'Close', 'common.search': 'Search…', 'common.loading': 'Loading…', 'common.confirm': 'Confirm',
  'common.today': 'Today', 'common.back': 'Back', 'common.next': 'Next', 'common.yes': 'Yes', 'common.no': 'No', 'common.all': 'All', 'common.none': '—', 'common.min': 'min',
  'common.saved': 'Saved', 'common.error': 'Something went wrong', 'common.copied': 'Copied to clipboard', 'common.retry': 'Retry', 'common.actions': 'Actions',
  'common.name': 'Name', 'common.phone': 'Phone', 'common.doctor': 'Doctor', 'common.status': 'Status', 'common.date': 'Date', 'common.time': 'Time', 'common.email': 'Email', 'common.password': 'Password',
  'common.signout': 'Sign out', 'common.light': 'Light', 'common.dark': 'Dark', 'common.language': 'Language', 'common.theme': 'Theme', 'common.view': 'View', 'common.create': 'Create', 'common.add': 'Add',
  'common.live': 'Live', 'common.offline': 'Reconnecting…', 'common.noData': 'No data yet', 'common.clinic': 'Clinic', 'common.role': 'Role', 'common.enabled': 'Enabled', 'common.disabled': 'Disabled',
  // nav
  'nav.overview': 'Overview', 'nav.calendar': 'Appointments', 'nav.new': 'New Appointment', 'nav.queue': 'Live Queue', 'nav.patients': 'Patients', 'nav.notifications': 'Notifications', 'nav.reports': 'Reports', 'nav.settings': 'Settings',
  'nav.today': "Today's Queue", 'nav.stats': 'Statistics', 'nav.schedule': 'Schedule & Duration', 'nav.clinics': 'Clinics', 'nav.accounts': 'Accounts', 'nav.subscriptions': 'Subscriptions', 'nav.platform': 'Platform',
  // status
  'status.booked': 'Booked', 'status.checked_in': 'Waiting', 'status.in_consultation': 'In consultation', 'status.completed': 'Completed', 'status.skipped': 'Skipped', 'status.cancelled': 'Cancelled', 'status.no_show': 'No show',
  // visit
  'visit.consultation': 'Consultation', 'visit.follow_up': 'Follow-up', 'visit.checkup': 'Check-up', 'visit.procedure': 'Procedure',
  // actions
  'act.check_in': 'Check in', 'act.start': 'Start visit', 'act.end': 'End visit', 'act.skip': 'Skip', 'act.recall': 'Recall', 'act.reschedule': 'Reschedule', 'act.cancel': 'Cancel appointment', 'act.no_show': 'No show',
  'act.whatsapp': 'WhatsApp', 'act.telegram': 'Telegram', 'act.copy': 'Copy link', 'act.share': 'Share',
  // login
  'login.title': 'Welcome back', 'login.sub': 'Sign in to manage your clinic queue.', 'login.cta': 'Sign in', 'login.demo': 'Demo accounts', 'login.hero': 'One synchronized queue for reception, doctors and patients.', 'login.invalid': 'Invalid email or password',
  'login.f1': 'Patients wait comfortably at home', 'login.f2': 'Live queue and smart delay estimates', 'login.f3': 'WhatsApp & Telegram confirmations',
  // overview
  'ov.title': 'Overview', 'ov.appointments': 'Appointments', 'ov.waiting': 'Waiting', 'ov.inConsult': 'In consultation', 'ov.completed': 'Completed', 'ov.doctors': 'Doctor queues', 'ov.current': 'Now seeing', 'ov.next': 'Next up', 'ov.delay': 'Running late', 'ov.onTime': 'On time',
  'ov.idle': 'No patient inside', 'ov.noNext': 'Nobody waiting', 'ov.schedule': "Today's schedule", 'ov.noShow': 'No shows', 'ov.openQueue': 'Open queue', 'ov.waitingCount': 'waiting',
  // calendar
  'cal.title': 'Appointment Calendar', 'cal.week': 'Week', 'cal.day': 'Day', 'cal.noAppts': 'No appointments', 'cal.all': 'All doctors', 'cal.prev': 'Previous', 'cal.nextW': 'Next',
  // new appointment
  'new.title': 'New Appointment', 'new.sub': 'Check availability, register the patient and confirm.', 'new.step1': 'Doctor & time', 'new.step2': 'Patient details', 'new.slots': 'Available slots', 'new.noSlots': 'No available slots on this day', 'new.dayOff': 'Doctor is off on this day',
  'new.fullName': 'Full name', 'new.phone': 'Phone number', 'new.visitType': 'Visit type', 'new.channel': 'Preferred communication', 'new.confirm': 'Confirm appointment', 'new.pickSlot': 'Pick a time slot', 'new.slotBooked': 'Booked', 'new.slotPast': 'Passed', 'new.slotBreak': 'Break',
  'new.phoneHint': 'Local number or with country code, e.g. 010 1234 5678', 'new.existing': 'Existing patient — details autofilled', 'new.summary': 'Summary', 'new.channelLink': 'Link only',
  // confirmation
  'conf.title': 'Appointment confirmed', 'conf.sub': 'Send the tracking link so the patient can wait at home.', 'conf.queue': 'Queue number', 'conf.link': 'Private tracking link', 'conf.preview': 'Message preview', 'conf.lang': 'Message language',
  'conf.another': 'Book another', 'conf.openQueue': 'Open live queue', 'conf.hint': 'The message opens pre-filled. You press Send yourself.',
  // queue
  'q.title': 'Live Queue', 'q.sub': 'Every action updates the patient’s phone instantly.', 'q.ticket': 'Ticket', 'q.patient': 'Patient', 'q.appt': 'Appointment', 'q.est': 'Estimated', 'q.ahead': 'Ahead', 'q.search': 'Search patient or ticket…', 'q.empty': 'No appointments for this doctor today', 'q.nowServing': 'Now serving', 'q.delayBanner': 'Queue running {n} min late — estimates updated automatically.',
  'q.reschedTitle': 'Reschedule appointment', 'q.cancelConfirm': 'Cancel this appointment? The patient will be notified.', 'q.noShowConfirm': 'Mark this patient as a no-show?', 'q.skipConfirm': 'Skip this patient? They keep their ticket and can be recalled.', 'q.filterAll': 'All', 'q.filterActive': 'Active', 'q.filterDone': 'Done',
  'q.late': 'Not arrived', 'q.avgConsult': 'Avg. consult', 'q.sendLink': 'Send link',
  // patients
  'pt.title': 'Patient Directory', 'pt.visits': 'Visits', 'pt.last': 'Last visit', 'pt.noShows': 'No shows', 'pt.history': 'Visit history', 'pt.notes': 'Notes', 'pt.empty': 'No patients found', 'pt.add': 'New appointment',
  // notifications (staff)
  'nt.title': 'Notifications', 'nt.markRead': 'Mark all as read', 'nt.empty': 'You are all caught up',
  // reports
  'rp.title': 'Reports & Analytics', 'rp.range7': 'Last 7 days', 'rp.range14': 'Last 14 days', 'rp.range30': 'Last 30 days', 'rp.total': 'Appointments', 'rp.completed': 'Completed', 'rp.avgWait': 'Avg. wait', 'rp.avgConsult': 'Avg. consultation', 'rp.noShowRate': 'No-show rate',
  'rp.daily': 'Daily volume', 'rp.byDoctor': 'Doctor performance', 'rp.byHour': 'Busiest hours', 'rp.byType': 'Visit types', 'rp.export': 'Export CSV', 'rp.cancelled': 'Cancelled',
  // settings
  'st.title': 'Settings', 'st.clinic': 'Clinic profile', 'st.branding': 'Branding', 'st.queue': 'Queue & notifications', 'st.doctors': 'Doctors', 'st.audit': 'Audit log', 'st.subscription': 'Subscription',
  'st.name': 'Clinic name', 'st.nameAr': 'Clinic name (Arabic)', 'st.address': 'Address', 'st.phone': 'Phone', 'st.email': 'Email', 'st.tagline': 'Tagline', 'st.color': 'Brand color', 'st.tz': 'Time zone', 'st.cc': 'Default country code',
  'st.threshold': 'Notify when patients ahead ≤', 'st.thresholdHint': 'Patients get "Your turn is approaching" when this many patients are ahead of them.', 'st.delayMin': 'Notify delay changes of at least (min)', 'st.capacity': 'Patients per time slot', 'st.msgLang': 'Default message language',
  'st.addDoctor': 'Add doctor', 'st.docName': 'Doctor name', 'st.docSpec': 'Specialty', 'st.avg': 'Avg. consultation (min)', 'st.hours': 'Working hours', 'st.from': 'From', 'st.to': 'To', 'st.break': 'Break', 'st.days': 'Working days', 'st.active': 'Active',
  'st.plan': 'Plan', 'st.renews': 'Renews', 'st.maxDoctors': 'Doctors included', 'st.loginEmail': 'Login email (optional)', 'st.loginPw': 'Password (min 8)',
  // doctor
  'dr.title': 'Doctor Dashboard', 'dr.today': "Today's appointments", 'dr.current': 'Current patient', 'dr.next': 'Next patient', 'dr.noCurrent': 'No consultation in progress', 'dr.noNext': 'No patients waiting', 'dr.startNext': 'Start next', 'dr.elapsed': 'Elapsed',
  'dr.stats': 'Statistics', 'dr.schedule': 'Working hours & duration', 'dr.queueLeft': 'Waiting now', 'dr.doneToday': 'Seen today', 'dr.workDays': 'Working days',
  // days
  'day.0': 'Sun', 'day.1': 'Mon', 'day.2': 'Tue', 'day.3': 'Wed', 'day.4': 'Thu', 'day.5': 'Fri', 'day.6': 'Sat',
  // admin
  'ad.title': 'Platform Admin', 'ad.clinics': 'Clinics', 'ad.activeClinics': 'Active clinics', 'ad.users': 'Accounts', 'ad.doctors': 'Doctors', 'ad.today': 'Appointments today', 'ad.mrr': 'Monthly revenue', 'ad.newClinic': 'New clinic', 'ad.slug': 'Slug', 'ad.owner': 'Receptionist name', 'ad.ownerEmail': 'Receptionist email',
  'ad.suspend': 'Suspend', 'ad.activate': 'Activate', 'ad.plan': 'Plan', 'ad.price': 'Price / month', 'ad.period': 'Period end', 'ad.subStatus': 'Subscription status', 'ad.resetPw': 'Reset password', 'ad.newPw': 'New password (min 8)', 'ad.addUser': 'Add receptionist', 'ad.edit': 'Edit',
  'ad.suspended': 'Suspended', 'ad.appts': 'Appointments',
  // tracker
  'tr.confirmed': 'Appointment confirmed', 'tr.yourQueue': 'Your queue number', 'tr.original': 'Booked time', 'tr.estimated': 'Estimated consultation', 'tr.ahead': 'patients ahead', 'tr.aheadOne': 'patient ahead', 'tr.status': 'Status', 'tr.nowServing': 'Now serving', 'tr.delayed': 'Running late', 'tr.delayedBy': '+{n} min later than booked',
  'tr.onTime': 'On time', 'tr.upcoming': 'Your turn is approaching', 'tr.upcomingSub': 'Please prepare for your visit.', 'tr.yourTurn': "It's your turn!", 'tr.yourTurnSub': "Please proceed to the doctor's room.", 'tr.completed': 'Visit completed', 'tr.completedSub': 'Thank you for visiting. Wishing you good health.',
  'tr.cancelled': 'Appointment cancelled', 'tr.cancelledSub': 'Contact the clinic to book a new appointment.', 'tr.noShow': 'Marked as missed', 'tr.skipped': 'Your turn was skipped', 'tr.skippedSub': 'Please see the reception to rejoin the queue.',
  'tr.clinic': 'Clinic', 'tr.call': 'Call clinic', 'tr.directions': 'Directions', 'tr.notifications': 'Notifications', 'tr.noNotifs': 'No notifications yet', 'tr.enablePush': 'Enable notifications', 'tr.pushOn': 'Notifications are on', 'tr.pushBlocked': 'Notifications blocked in browser settings',
  'tr.install': 'Add to Home Screen', 'tr.installSub': 'Open your queue in one tap — no app store needed.', 'tr.installIos': 'Tap Share, then "Add to Home Screen".', 'tr.installBtn': 'Install', 'tr.live': 'Live', 'tr.reconnect': 'Reconnecting…', 'tr.notFound': 'This link is not valid', 'tr.notFoundSub': 'Check the link in your message or contact the clinic.',
  'tr.futureDay': 'Your appointment is on {date}. Live queue tracking starts on the day of your visit.', 'tr.doctor': 'Doctor', 'tr.visit': 'Visit type', 'tr.date': 'Date', 'tr.today': 'Today', 'tr.waitingTotal': 'Patients waiting in total',
  'tr.progress': 'Queue progress', 'tr.updated': 'Updated just now', 'tr.hello': 'Hello', 'tr.privacy': 'Private link — only you can see your appointment.', 'tr.inRoom': 'You are in consultation',
  // notification kinds are rendered from lib/notiftext
};

const ar: Dict = {
  'brand.tagline': 'انتظار أقل. رعاية أفضل.',
  'common.save': 'حفظ التغييرات', 'common.cancel': 'إلغاء', 'common.close': 'إغلاق', 'common.search': 'بحث…', 'common.loading': 'جارٍ التحميل…', 'common.confirm': 'تأكيد',
  'common.today': 'اليوم', 'common.back': 'رجوع', 'common.next': 'التالي', 'common.yes': 'نعم', 'common.no': 'لا', 'common.all': 'الكل', 'common.none': '—', 'common.min': 'د',
  'common.saved': 'تم الحفظ', 'common.error': 'حدث خطأ ما', 'common.copied': 'تم النسخ', 'common.retry': 'إعادة المحاولة', 'common.actions': 'إجراءات',
  'common.name': 'الاسم', 'common.phone': 'الهاتف', 'common.doctor': 'الطبيب', 'common.status': 'الحالة', 'common.date': 'التاريخ', 'common.time': 'الوقت', 'common.email': 'البريد الإلكتروني', 'common.password': 'كلمة المرور',
  'common.signout': 'تسجيل الخروج', 'common.light': 'فاتح', 'common.dark': 'داكن', 'common.language': 'اللغة', 'common.theme': 'المظهر', 'common.view': 'عرض', 'common.create': 'إنشاء', 'common.add': 'إضافة',
  'common.live': 'مباشر', 'common.offline': 'جارٍ إعادة الاتصال…', 'common.noData': 'لا توجد بيانات', 'common.clinic': 'العيادة', 'common.role': 'الدور', 'common.enabled': 'مفعّل', 'common.disabled': 'معطّل',
  'nav.overview': 'نظرة عامة', 'nav.calendar': 'المواعيد', 'nav.new': 'حجز جديد', 'nav.queue': 'الطابور المباشر', 'nav.patients': 'المرضى', 'nav.notifications': 'الإشعارات', 'nav.reports': 'التقارير', 'nav.settings': 'الإعدادات',
  'nav.today': 'طابور اليوم', 'nav.stats': 'الإحصائيات', 'nav.schedule': 'الجدول والمدة', 'nav.clinics': 'العيادات', 'nav.accounts': 'الحسابات', 'nav.subscriptions': 'الاشتراكات', 'nav.platform': 'المنصة',
  'status.booked': 'محجوز', 'status.checked_in': 'في الانتظار', 'status.in_consultation': 'في الكشف', 'status.completed': 'مكتمل', 'status.skipped': 'تم التخطي', 'status.cancelled': 'ملغي', 'status.no_show': 'لم يحضر',
  'visit.consultation': 'كشف', 'visit.follow_up': 'متابعة', 'visit.checkup': 'فحص شامل', 'visit.procedure': 'إجراء',
  'act.check_in': 'تسجيل حضور', 'act.start': 'بدء الكشف', 'act.end': 'إنهاء الكشف', 'act.skip': 'تخطي', 'act.recall': 'إعادة للطابور', 'act.reschedule': 'إعادة جدولة', 'act.cancel': 'إلغاء الموعد', 'act.no_show': 'لم يحضر',
  'act.whatsapp': 'واتساب', 'act.telegram': 'تيليجرام', 'act.copy': 'نسخ الرابط', 'act.share': 'مشاركة',
  'login.title': 'أهلاً بعودتك', 'login.sub': 'سجّل الدخول لإدارة طابور عيادتك.', 'login.cta': 'تسجيل الدخول', 'login.demo': 'حسابات تجريبية', 'login.hero': 'طابور واحد متزامن للاستقبال والأطباء والمرضى.', 'login.invalid': 'البريد أو كلمة المرور غير صحيحة',
  'login.f1': 'المريض ينتظر في راحة من بيته', 'login.f2': 'طابور مباشر وتقدير ذكي للتأخير', 'login.f3': 'تأكيدات عبر واتساب وتيليجرام',
  'ov.title': 'نظرة عامة', 'ov.appointments': 'المواعيد', 'ov.waiting': 'في الانتظار', 'ov.inConsult': 'في الكشف', 'ov.completed': 'مكتمل', 'ov.doctors': 'طوابير الأطباء', 'ov.current': 'يدخل الآن', 'ov.next': 'التالي', 'ov.delay': 'متأخر', 'ov.onTime': 'في الموعد',
  'ov.idle': 'لا يوجد مريض بالداخل', 'ov.noNext': 'لا أحد في الانتظار', 'ov.schedule': 'جدول اليوم', 'ov.noShow': 'غياب', 'ov.openQueue': 'فتح الطابور', 'ov.waitingCount': 'منتظر',
  'cal.title': 'تقويم المواعيد', 'cal.week': 'أسبوع', 'cal.day': 'يوم', 'cal.noAppts': 'لا توجد مواعيد', 'cal.all': 'كل الأطباء', 'cal.prev': 'السابق', 'cal.nextW': 'التالي',
  'new.title': 'حجز جديد', 'new.sub': 'تحقق من المواعيد المتاحة وسجّل بيانات المريض وأكّد الحجز.', 'new.step1': 'الطبيب والموعد', 'new.step2': 'بيانات المريض', 'new.slots': 'المواعيد المتاحة', 'new.noSlots': 'لا توجد مواعيد متاحة في هذا اليوم', 'new.dayOff': 'الطبيب في إجازة هذا اليوم',
  'new.fullName': 'الاسم بالكامل', 'new.phone': 'رقم الهاتف', 'new.visitType': 'نوع الزيارة', 'new.channel': 'وسيلة التواصل المفضلة', 'new.confirm': 'تأكيد الحجز', 'new.pickSlot': 'اختر موعداً', 'new.slotBooked': 'محجوز', 'new.slotPast': 'انتهى', 'new.slotBreak': 'استراحة',
  'new.phoneHint': 'رقم محلي أو بكود الدولة، مثال 010 1234 5678', 'new.existing': 'مريض مسجل — تم ملء البيانات', 'new.summary': 'الملخص', 'new.channelLink': 'رابط فقط',
  'conf.title': 'تم تأكيد الحجز', 'conf.sub': 'أرسل رابط المتابعة ليتمكن المريض من الانتظار في بيته.', 'conf.queue': 'رقم الدور', 'conf.link': 'رابط المتابعة الخاص', 'conf.preview': 'معاينة الرسالة', 'conf.lang': 'لغة الرسالة',
  'conf.another': 'حجز آخر', 'conf.openQueue': 'فتح الطابور المباشر', 'conf.hint': 'تُفتح الرسالة جاهزة وتضغط أنت على إرسال.',
  'q.title': 'الطابور المباشر', 'q.sub': 'كل إجراء يظهر فوراً على هاتف المريض.', 'q.ticket': 'التذكرة', 'q.patient': 'المريض', 'q.appt': 'الموعد', 'q.est': 'المتوقع', 'q.ahead': 'قبله', 'q.search': 'ابحث عن مريض أو تذكرة…', 'q.empty': 'لا توجد مواعيد لهذا الطبيب اليوم', 'q.nowServing': 'يدخل الآن', 'q.delayBanner': 'الطابور متأخر {n} دقيقة — تم تحديث التقديرات تلقائياً.',
  'q.reschedTitle': 'إعادة جدولة الموعد', 'q.cancelConfirm': 'إلغاء هذا الموعد؟ سيتم إبلاغ المريض.', 'q.noShowConfirm': 'تسجيل هذا المريض كغائب؟', 'q.skipConfirm': 'تخطي هذا المريض؟ يحتفظ بتذكرته ويمكن إعادته.', 'q.filterAll': 'الكل', 'q.filterActive': 'نشط', 'q.filterDone': 'منتهي',
  'q.late': 'لم يصل', 'q.avgConsult': 'متوسط الكشف', 'q.sendLink': 'إرسال الرابط',
  'pt.title': 'دليل المرضى', 'pt.visits': 'الزيارات', 'pt.last': 'آخر زيارة', 'pt.noShows': 'الغياب', 'pt.history': 'سجل الزيارات', 'pt.notes': 'ملاحظات', 'pt.empty': 'لا يوجد مرضى', 'pt.add': 'حجز جديد',
  'nt.title': 'الإشعارات', 'nt.markRead': 'تعليم الكل كمقروء', 'nt.empty': 'لا توجد إشعارات جديدة',
  'rp.title': 'التقارير والتحليلات', 'rp.range7': 'آخر 7 أيام', 'rp.range14': 'آخر 14 يوماً', 'rp.range30': 'آخر 30 يوماً', 'rp.total': 'المواعيد', 'rp.completed': 'مكتمل', 'rp.avgWait': 'متوسط الانتظار', 'rp.avgConsult': 'متوسط الكشف', 'rp.noShowRate': 'نسبة الغياب',
  'rp.daily': 'الحجوزات اليومية', 'rp.byDoctor': 'أداء الأطباء', 'rp.byHour': 'أوقات الذروة', 'rp.byType': 'أنواع الزيارات', 'rp.export': 'تصدير CSV', 'rp.cancelled': 'ملغي',
  'st.title': 'الإعدادات', 'st.clinic': 'بيانات العيادة', 'st.branding': 'الهوية', 'st.queue': 'الطابور والإشعارات', 'st.doctors': 'الأطباء', 'st.audit': 'سجل التدقيق', 'st.subscription': 'الاشتراك',
  'st.name': 'اسم العيادة', 'st.nameAr': 'اسم العيادة (عربي)', 'st.address': 'العنوان', 'st.phone': 'الهاتف', 'st.email': 'البريد', 'st.tagline': 'الشعار النصي', 'st.color': 'لون العلامة', 'st.tz': 'المنطقة الزمنية', 'st.cc': 'كود الدولة الافتراضي',
  'st.threshold': 'نبّه عندما يكون عدد من قبله ≤', 'st.thresholdHint': 'يصل المريض إشعار "دورك يقترب" عندما يكون هذا العدد من المرضى قبله.', 'st.delayMin': 'نبّه عند تغيّر الموعد بمقدار (دقيقة)', 'st.capacity': 'عدد المرضى في الموعد الواحد', 'st.msgLang': 'لغة الرسائل الافتراضية',
  'st.addDoctor': 'إضافة طبيب', 'st.docName': 'اسم الطبيب', 'st.docSpec': 'التخصص', 'st.avg': 'متوسط الكشف (دقيقة)', 'st.hours': 'ساعات العمل', 'st.from': 'من', 'st.to': 'إلى', 'st.break': 'استراحة', 'st.days': 'أيام العمل', 'st.active': 'نشط',
  'st.plan': 'الباقة', 'st.renews': 'يتجدد في', 'st.maxDoctors': 'عدد الأطباء المسموح', 'st.loginEmail': 'بريد الدخول (اختياري)', 'st.loginPw': 'كلمة المرور (8 أحرف على الأقل)',
  'dr.title': 'لوحة الطبيب', 'dr.today': 'مواعيد اليوم', 'dr.current': 'المريض الحالي', 'dr.next': 'المريض التالي', 'dr.noCurrent': 'لا يوجد كشف حالياً', 'dr.noNext': 'لا أحد في الانتظار', 'dr.startNext': 'بدء التالي', 'dr.elapsed': 'المدة',
  'dr.stats': 'الإحصائيات', 'dr.schedule': 'ساعات العمل ومدة الكشف', 'dr.queueLeft': 'في الانتظار الآن', 'dr.doneToday': 'تم كشفهم اليوم', 'dr.workDays': 'أيام العمل',
  'day.0': 'الأحد', 'day.1': 'الإثنين', 'day.2': 'الثلاثاء', 'day.3': 'الأربعاء', 'day.4': 'الخميس', 'day.5': 'الجمعة', 'day.6': 'السبت',
  'ad.title': 'إدارة المنصة', 'ad.clinics': 'العيادات', 'ad.activeClinics': 'عيادات نشطة', 'ad.users': 'الحسابات', 'ad.doctors': 'الأطباء', 'ad.today': 'مواعيد اليوم', 'ad.mrr': 'الإيراد الشهري', 'ad.newClinic': 'عيادة جديدة', 'ad.slug': 'المعرّف', 'ad.owner': 'اسم موظف الاستقبال', 'ad.ownerEmail': 'بريد موظف الاستقبال',
  'ad.suspend': 'إيقاف', 'ad.activate': 'تفعيل', 'ad.plan': 'الباقة', 'ad.price': 'السعر / شهر', 'ad.period': 'نهاية الفترة', 'ad.subStatus': 'حالة الاشتراك', 'ad.resetPw': 'إعادة تعيين كلمة المرور', 'ad.newPw': 'كلمة مرور جديدة (8 أحرف)', 'ad.addUser': 'إضافة موظف استقبال', 'ad.edit': 'تعديل',
  'ad.suspended': 'موقوفة', 'ad.appts': 'المواعيد',
  'tr.confirmed': 'تم تأكيد الموعد', 'tr.yourQueue': 'رقم دورك', 'tr.original': 'موعد الحجز', 'tr.estimated': 'موعد الكشف المتوقع', 'tr.ahead': 'مرضى قبلك', 'tr.aheadOne': 'مريض قبلك', 'tr.status': 'الحالة', 'tr.nowServing': 'يدخل الآن', 'tr.delayed': 'يوجد تأخير', 'tr.delayedBy': 'متأخر {n} دقيقة عن موعد الحجز',
  'tr.onTime': 'في الموعد', 'tr.upcoming': 'دورك يقترب', 'tr.upcomingSub': 'من فضلك استعد لزيارتك.', 'tr.yourTurn': 'حان دورك!', 'tr.yourTurnSub': 'تفضل بالدخول إلى غرفة الطبيب.', 'tr.completed': 'اكتملت الزيارة', 'tr.completedSub': 'شكراً لزيارتك. نتمنى لك الشفاء العاجل.',
  'tr.cancelled': 'تم إلغاء الموعد', 'tr.cancelledSub': 'تواصل مع العيادة لحجز موعد جديد.', 'tr.noShow': 'تم تسجيل الموعد كغياب', 'tr.skipped': 'تم تخطي دورك', 'tr.skippedSub': 'توجّه إلى الاستقبال لإعادتك إلى الطابور.',
  'tr.clinic': 'العيادة', 'tr.call': 'اتصل بالعيادة', 'tr.directions': 'الاتجاهات', 'tr.notifications': 'الإشعارات', 'tr.noNotifs': 'لا توجد إشعارات بعد', 'tr.enablePush': 'تفعيل الإشعارات', 'tr.pushOn': 'الإشعارات مفعّلة', 'tr.pushBlocked': 'الإشعارات محظورة من إعدادات المتصفح',
  'tr.install': 'أضف إلى الشاشة الرئيسية', 'tr.installSub': 'افتح دورك بضغطة واحدة — بدون متجر تطبيقات.', 'tr.installIos': 'اضغط مشاركة ثم "إضافة إلى الشاشة الرئيسية".', 'tr.installBtn': 'تثبيت', 'tr.live': 'مباشر', 'tr.reconnect': 'جارٍ إعادة الاتصال…', 'tr.notFound': 'هذا الرابط غير صالح', 'tr.notFoundSub': 'تأكد من الرابط في رسالتك أو تواصل مع العيادة.',
  'tr.futureDay': 'موعدك يوم {date}. تبدأ المتابعة المباشرة في يوم الزيارة.', 'tr.doctor': 'الطبيب', 'tr.visit': 'نوع الزيارة', 'tr.date': 'التاريخ', 'tr.today': 'اليوم', 'tr.waitingTotal': 'إجمالي المنتظرين',
  'tr.progress': 'تقدم الطابور', 'tr.updated': 'تم التحديث الآن', 'tr.hello': 'مرحباً', 'tr.privacy': 'رابط خاص — لا يراه غيرك.', 'tr.inRoom': 'أنت الآن في الكشف',
};
export const dict = { en, ar };
export function translate(locale: Locale, key: string, vars?: Record<string, string | number>) {
  let s = dict[locale][key] ?? dict.en[key] ?? key;
  if (vars) for (const [k, v] of Object.entries(vars)) s = s.replaceAll(`{${k}}`, String(v));
  return s;
}
export const fmtTime = (hhmm: string | null | undefined, locale: Locale) => {
  if (!hhmm) return '—';
  const [h, m] = hhmm.slice(0, 5).split(':').map(Number);
  const suf = h >= 12 ? (locale === 'ar' ? 'م' : 'PM') : locale === 'ar' ? 'ص' : 'AM';
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${suf}`;
};
