import React, { useCallback, useMemo, useState } from 'react';
import {
  AlertTriangle,
  BarChart3,
  Building2,
  CalendarClock,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Clock,
  Eye,
  FileText,
  Flame,
  Inbox,
  Landmark,
  PlayCircle,
  Search,
  Star,
  X,
  XCircle,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import {
  getStoredRequests,
  getStoredVenues,
  updateStoredRequest,
} from '../utils/storage';
import {
  buildConflictsMap,
  bookingsForSlot,
  findRequestConflicts,
  isActiveBooking,
  isCenterRequest,
  priorityOf,
  sortByPriority,
  slotConflicts,
} from '../utils/bookingUtils';
import { addDaysISO, formatDate, formatDateRange, normalizeDateRange, todayISO } from '../utils/dateUtils';
import StatusBadge from './StatusBadge';
import StatsCard from './StatsCard';
import Modal from './Modal';
import ElectronicContractModal from './ElectronicContractModal';
import type { BookingPriority, DateRange, RequestStatus, ServiceRequest, VenueInfo } from '../types';

type CenterTab = 'overview' | 'requests' | 'schedule';

const PRIORITY_CONFIG: Record<
  BookingPriority,
  { ar: string; en: string; chip: string; icon: string }
> = {
  urgent: {
    ar: 'عاجل',
    en: 'Urgent',
    chip: 'bg-rose-100 text-rose-800 border-rose-300',
    icon: 'text-rose-600',
  },
  high: {
    ar: 'أولوية عالية',
    en: 'High',
    chip: 'bg-amber-100 text-amber-800 border-amber-300',
    icon: 'text-amber-600',
  },
  normal: {
    ar: 'عادية',
    en: 'Normal',
    chip: 'bg-slate-100 text-slate-600 border-slate-300',
    icon: 'text-slate-500',
  },
};

const SLOT_STATUS_STYLE: Record<string, string> = {
  approved: 'bg-emerald-50 border-emerald-300 text-emerald-900',
  in_progress: 'bg-indigo-50 border-indigo-300 text-indigo-900',
  pending: 'bg-amber-50 border-amber-300 text-amber-900',
  completed: 'bg-sky-50 border-sky-300 text-sky-900',
};

export default function CenterManagerDashboard() {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const isAr = language === 'ar';
  const ArrowNext = isAr ? ChevronLeft : ChevronRight;
  const ArrowPrev = isAr ? ChevronRight : ChevronLeft;

  const [tab, setTab] = useState<CenterTab>('overview');
  const [requests, setRequests] = useState<ServiceRequest[]>(() => getStoredRequests());
  const [venues] = useState<VenueInfo[]>(() => getStoredVenues());
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selected, setSelected] = useState<ServiceRequest | null>(null);
  const [note, setNote] = useState('');
  const [contractRequest, setContractRequest] = useState<ServiceRequest | null>(null);
  const [rescheduleTarget, setRescheduleTarget] = useState<ServiceRequest | null>(null);
  const [scheduleOffset, setScheduleOffset] = useState(0);

  const reload = useCallback(() => setRequests(getStoredRequests()), []);

  const centerRequests = useMemo(() => requests.filter(isCenterRequest), [requests]);
  const conflictsMap = useMemo(() => buildConflictsMap(requests), [requests]);
  const today = todayISO();
  const weekEnd = addDaysISO(7, today);

  const stats = useMemo(() => {
    let pending = 0;
    let todayBookings = 0;
    let weekBookings = 0;
    for (const r of centerRequests) {
      if (r.status === 'pending') pending++;
      if (!isActiveBooking(r)) continue;
      for (const raw of r.eventDates) {
        const d = normalizeDateRange(raw).date;
        if (d === today) todayBookings++;
        if (d >= today && d <= weekEnd) weekBookings++;
      }
    }
    return { pending, todayBookings, weekBookings, conflicts: conflictsMap.size };
  }, [centerRequests, conflictsMap, today, weekEnd]);

  const filteredRequests = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = centerRequests.filter((r) => {
      if (statusFilter !== 'all' && r.status !== statusFilter) return false;
      if (!q) return true;
      return (
        r.title?.toLowerCase().includes(q) ||
        r.requesterName?.toLowerCase().includes(q) ||
        r.trackingCode?.toLowerCase().includes(q) ||
        r.externalEntity?.toLowerCase().includes(q) ||
        r.requesterDepartment?.toLowerCase().includes(q)
      );
    });
    return sortByPriority(list);
  }, [centerRequests, search, statusFilter]);

  const scheduleDays = useMemo(
    () => Array.from({ length: 14 }, (_, i) => addDaysISO(scheduleOffset + i, today)),
    [scheduleOffset, today]
  );

  const venueName = (id: string) => {
    const v = venues.find((x) => x.id === id);
    return v ? (isAr ? v.nameAr : v.nameEn) : t(`venues.${id}`) !== `venues.${id}` ? t(`venues.${id}`) : id;
  };

  const changeStatus = (id: string, status: RequestStatus, adminNote?: string) => {
    const req = requests.find((r) => r.id === id);
    if (!req) return;
    const history = [
      ...(req.statusHistory || []),
      {
        status,
        changedBy: user?.name || user?.username || 'center_manager',
        changedAt: new Date().toISOString(),
        note: adminNote || undefined,
      },
    ];
    updateStoredRequest(id, { status, statusHistory: history, adminNotes: adminNote || req.adminNotes });
    reload();
    if (selected?.id === id) {
      setSelected(getStoredRequests().find((r) => r.id === id) || null);
    }
    setNote('');
  };

  const setPriority = (id: string, priority: BookingPriority) => {
    updateStoredRequest(id, { priority });
    reload();
    if (selected?.id === id) {
      setSelected(getStoredRequests().find((r) => r.id === id) || null);
    }
  };

  const PriorityBadge = ({ p }: { p?: BookingPriority }) => {
    const cfg = PRIORITY_CONFIG[p ?? 'normal'];
    if (!p || p === 'normal') return null;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-bold ${cfg.chip}`}>
        <Flame className={`w-3 h-3 ${cfg.icon}`} />
        {isAr ? cfg.ar : cfg.en}
      </span>
    );
  };

  const tabs: { id: CenterTab; label: string; icon: React.ElementType; badge?: number }[] = [
    { id: 'overview', label: isAr ? 'نظرة عامة' : 'Overview', icon: BarChart3 },
    {
      id: 'requests',
      label: isAr ? 'طلبات المركز' : 'Center Requests',
      icon: ClipboardList,
      badge: stats.pending,
    },
    {
      id: 'schedule',
      label: isAr ? 'جدول الحجوزات والتعارضات' : 'Bookings & Conflicts',
      icon: CalendarClock,
      badge: stats.conflicts || undefined,
    },
  ];

  return (
    <div className="page-shell animate-fadeIn">
      {/* Center Manager Banner */}
      <div className="mb-6 p-5 rounded-2xl bg-gradient-to-r from-ink-950 via-ink to-primary-950 text-white border border-[var(--line)] shadow-xl relative overflow-hidden">
        <div className="absolute top-0 start-0 w-24 h-24 border-s-2 border-t-2 border-secondary/40" />
        <div className="absolute bottom-0 end-0 w-24 h-24 border-e-2 border-b-2 border-primary/30" />
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-secondary/20 border border-secondary/40 flex items-center justify-center shrink-0">
              <Landmark className="w-6 h-6 text-secondary-300" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-secondary-300 font-bold text-xs uppercase tracking-wider">
                  {isAr ? 'مركز مؤتمرات وأعمال الدرعية' : 'Diriyah Conferences & Business Center'}
                </span>
                <span className="px-2 py-0.5 text-[10px] font-bold bg-secondary text-ink-950 rounded-full">
                  {isAr ? 'مدير المركز' : 'Center Manager'}
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-extrabold">
                {isAr ? `مرحباً ${user?.name || ''} — لوحة إدارة حجوزات المركز` : `Welcome ${user?.name || ''} — Center Operations Board`}
              </h1>
              <p className="text-xs sm:text-sm text-white/80 font-naskh mt-1">
                {isAr
                  ? 'إدارة طلبات المركز، جدولة القاعات، فض التعارضات، وتحديد أولوية الحجوزات.'
                  : 'Manage center requests, venue scheduling, conflict resolution and booking priorities.'}
              </p>
            </div>
          </div>
          {stats.conflicts > 0 && (
            <button
              onClick={() => setTab('schedule')}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-rose-500/20 border border-rose-400/40 text-rose-200 rounded-xl text-xs font-bold hover:bg-rose-500/30 transition-colors shrink-0"
            >
              <AlertTriangle className="w-4 h-4" />
              {isAr ? `${stats.conflicts} تعارض يحتاج مراجعة` : `${stats.conflicts} conflicts need review`}
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1 mb-6 p-1 bg-white border border-[var(--line)] shadow-panel">
        {tabs.map((tb) => (
          <button
            key={tb.id}
            onClick={() => setTab(tb.id)}
            className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors ${
              tab === tb.id ? 'bg-ink text-white' : 'text-ink-600 hover:bg-ink-50'
            }`}
          >
            <tb.icon className="w-4 h-4" />
            {tb.label}
            {tb.badge ? (
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                  tab === tb.id ? 'bg-secondary text-ink-950' : 'bg-rose-100 text-rose-700'
                }`}
              >
                {tb.badge}
              </span>
            ) : null}
          </button>
        ))}
      </div>

      {/* ======= OVERVIEW ======= */}
      {tab === 'overview' && (
        <div className="space-y-6">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatsCard
              title={isAr ? 'طلبات بانتظار الاعتماد' : 'Pending Requests'}
              value={stats.pending}
              icon={<ClipboardList className="w-6 h-6 text-amber-500" />}
            />
            <StatsCard
              title={isAr ? 'حجوزات اليوم' : "Today's Bookings"}
              value={stats.todayBookings}
              icon={<CalendarClock className="w-6 h-6 text-primary" />}
            />
            <StatsCard
              title={isAr ? 'حجوزات هذا الأسبوع' : 'This Week'}
              value={stats.weekBookings}
              icon={<Building2 className="w-6 h-6 text-emerald-500" />}
            />
            <StatsCard
              title={isAr ? 'تعارضات تحتاج معالجة' : 'Active Conflicts'}
              value={stats.conflicts}
              icon={<AlertTriangle className="w-6 h-6 text-rose-500" />}
            />
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Pending quick list */}
            <div className="card-static">
              <h3 className="font-bold text-primary-900 mb-4 flex items-center gap-2">
                <Inbox className="w-4 h-4" />
                {isAr ? 'أحدث طلبات المركز' : 'Latest Center Requests'}
              </h3>
              <div className="space-y-2">
                {filteredRequests.slice(0, 6).length === 0 && (
                  <p className="text-slate-400 text-sm">{t('dashboard.noRequests')}</p>
                )}
                {filteredRequests.slice(0, 6).map((r) => (
                  <button
                    key={r.id}
                    onClick={() => setSelected(r)}
                    className="w-full flex items-center justify-between gap-3 p-3 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-100 text-start transition-all"
                  >
                    <div className="min-w-0">
                      <div className="font-semibold text-slate-800 truncate flex items-center gap-2">
                        {r.title}
                        <PriorityBadge p={r.priority} />
                        {conflictsMap.has(r.id) && (
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                        )}
                      </div>
                      <div className="text-xs text-slate-400">
                        {r.trackingCode} · {r.requesterName} · {formatDate(r.requestDate, language)}
                      </div>
                    </div>
                    <StatusBadge status={r.status} />
                  </button>
                ))}
              </div>
            </div>

            {/* Today's schedule */}
            <div className="card-static">
              <h3 className="font-bold text-primary-900 mb-4 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                {isAr ? 'جدول اليوم' : "Today's Schedule"}
              </h3>
              <div className="space-y-2">
                {venues.map((v) => {
                  const todays = bookingsForSlot(requests, v.id, today);
                  if (!todays.length) return null;
                  return todays.map((r) => {
                    const dr = normalizeDateRange(
                      r.eventDates.find((x) => normalizeDateRange(x).date === today) || r.eventDates[0]
                    );
                    return (
                      <button
                        key={r.id + v.id}
                        onClick={() => setSelected(r)}
                        className="w-full flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100 hover:border-primary-200 text-start transition-all"
                      >
                        <div className="min-w-0">
                          <div className="font-semibold text-ink-900 text-sm truncate">{r.title}</div>
                          <div className="text-xs text-slate-500">
                            {isAr ? v.nameAr : v.nameEn} ·{' '}
                            <span dir="ltr" className="font-mono">
                              {dr.startTime} - {dr.endTime}
                            </span>
                          </div>
                        </div>
                        <StatusBadge status={r.status} />
                      </button>
                    );
                  });
                })}
                {stats.todayBookings === 0 && (
                  <p className="text-slate-400 text-sm">
                    {isAr ? 'لا توجد حجوزات مجدولة اليوم' : 'No bookings scheduled for today'}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======= CENTER REQUESTS ======= */}
      {tab === 'requests' && (
        <div className="space-y-5">
          <div className="card-static !p-4 flex flex-col lg:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute top-1/2 -translate-y-1/2 start-3 text-slate-400" />
              <input
                className="input-field !ps-10"
                placeholder={isAr ? 'بحث برقم التتبع، الجهة، أو مقدم الطلب...' : 'Search tracking code, entity, requester...'}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <select
              className="input-field !py-2 lg:!w-56"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">{t('dashboard.filter.all')}</option>
              <option value="pending">{t('status.pending')}</option>
              <option value="approved">{t('status.approved')}</option>
              <option value="in_progress">{t('status.in_progress')}</option>
              <option value="completed">{t('status.completed')}</option>
              <option value="rejected">{t('status.rejected')}</option>
              <option value="cancelled">{t('status.cancelled')}</option>
            </select>
          </div>

          <div className="card-static !p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-ink text-white">
                    <th className="p-3 font-medium text-start">{t('table.requestId')}</th>
                    <th className="p-3 font-medium text-start">{t('table.title')}</th>
                    <th className="p-3 font-medium text-start">{isAr ? 'القاعات' : 'Venues'}</th>
                    <th className="p-3 font-medium text-start">{isAr ? 'الموعد' : 'Schedule'}</th>
                    <th className="p-3 font-medium text-start">{isAr ? 'الأولوية' : 'Priority'}</th>
                    <th className="p-3 font-medium text-start">{t('table.status')}</th>
                    <th className="p-3 font-medium text-start">{t('table.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRequests.length === 0 && (
                    <tr>
                      <td colSpan={7} className="p-10 text-center">
                        <Inbox className="w-8 h-8 mx-auto mb-2 text-ink-300" />
                        <span className="text-ink-400">{t('dashboard.noRequests')}</span>
                      </td>
                    </tr>
                  )}
                  {filteredRequests.map((r) => {
                    const hasConflict = conflictsMap.has(r.id);
                    return (
                      <tr
                        key={r.id}
                        className={`border-t border-[var(--line)] transition-colors ${
                          hasConflict ? 'bg-rose-50/50 hover:bg-rose-50' : 'hover:bg-primary-50/40'
                        }`}
                      >
                        <td className="p-3 font-mono text-xs text-primary-700 whitespace-nowrap" dir="ltr">
                          {r.trackingCode || r.id}
                        </td>
                        <td className="p-3 max-w-[220px]">
                          <div className="font-semibold text-ink truncate flex items-center gap-1.5">
                            {hasConflict && (
                              <AlertTriangle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                            )}
                            {r.title}
                          </div>
                          <div className="text-xs text-ink-400 truncate">{r.requesterName}</div>
                        </td>
                        <td className="p-3 text-ink-600 text-xs max-w-[160px]">
                          {r.venues?.length ? r.venues.map(venueName).join(' · ') : '—'}
                        </td>
                        <td className="p-3 text-ink-500 text-xs whitespace-nowrap">
                          {formatDateRange(r.eventDates, language)}
                        </td>
                        <td className="p-3">
                          <PriorityBadge p={r.priority} />
                          {(!r.priority || r.priority === 'normal') && (
                            <span className="text-[11px] text-slate-400">{isAr ? 'عادية' : 'Normal'}</span>
                          )}
                        </td>
                        <td className="p-3">
                          <StatusBadge status={r.status} />
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-1">
                            <button className="btn-ghost !p-2" onClick={() => setSelected(r)} title={t('dashboard.view')}>
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              className="btn-ghost !p-2 text-primary-700 hover:!bg-primary-50"
                              onClick={() => setRescheduleTarget(r)}
                              title={isAr ? 'إعادة جدولة / تغيير الوقت' : 'Reschedule'}
                            >
                              <CalendarClock className="w-4 h-4" />
                            </button>
                            {r.status === 'pending' && (
                              <>
                                <button
                                  className="btn-ghost !p-2 text-emerald-600 hover:!bg-emerald-50"
                                  onClick={() => changeStatus(r.id, 'approved')}
                                  title={t('dashboard.approve')}
                                >
                                  <CheckCircle2 className="w-4 h-4" />
                                </button>
                                <button
                                  className="btn-ghost !p-2 text-rose-600 hover:!bg-rose-50"
                                  onClick={() => changeStatus(r.id, 'rejected')}
                                  title={t('dashboard.reject')}
                                >
                                  <XCircle className="w-4 h-4" />
                                </button>
                              </>
                            )}
                            {(r.status === 'approved' || r.status === 'in_progress') && (
                              <button
                                className="btn-ghost !p-2 text-violet-600 hover:!bg-violet-50"
                                onClick={() =>
                                  changeStatus(r.id, r.status === 'approved' ? 'in_progress' : 'completed')
                                }
                                title={r.status === 'approved' ? t('dashboard.start') : t('dashboard.complete')}
                              >
                                <PlayCircle className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ======= SCHEDULE MATRIX ======= */}
      {tab === 'schedule' && (
        <div className="card-static !p-0 overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-[var(--line)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-ink-900">
                {isAr ? 'جدول إشغال مرافق المركز — 14 يوماً' : 'Center Occupancy — 14 Days'}
              </h2>
              <p className="text-xs text-slate-500 font-naskh">
                {isAr
                  ? 'انقر على أي حجز لإدارته (إعادة جدولة، أولوية، إلغاء). التعارضات تظهر بإطار أحمر.'
                  : 'Click any booking to manage it. Conflicts are outlined in red.'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setScheduleOffset((p) => Math.max(0, p - 7))}
                disabled={scheduleOffset === 0}
                className="btn-ghost text-xs !py-1.5 !px-2.5 disabled:opacity-30 flex items-center gap-1 border border-slate-200 rounded-md"
              >
                <ArrowPrev className="w-4 h-4" />
                <span>{isAr ? 'السابق' : 'Prev'}</span>
              </button>
              {scheduleOffset > 0 && (
                <button
                  onClick={() => setScheduleOffset(0)}
                  className="px-2.5 py-1 text-xs bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-md font-semibold"
                >
                  {isAr ? 'اليوم' : 'Today'}
                </button>
              )}
              <button
                onClick={() => setScheduleOffset((p) => p + 7)}
                className="btn-ghost text-xs !py-1.5 !px-2.5 flex items-center gap-1 border border-slate-200 rounded-md"
              >
                <span>{isAr ? 'التالي' : 'Next'}</span>
                <ArrowNext className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="p-3 text-start font-bold text-slate-700 min-w-[180px] sticky start-0 bg-slate-50 z-10 border-e border-slate-200">
                    {isAr ? 'المرفق' : 'Venue'}
                  </th>
                  {scheduleDays.map((d) => (
                    <th
                      key={d}
                      className={`p-2 text-center whitespace-nowrap min-w-[120px] ${
                        d === today ? 'bg-primary-50/80 font-bold text-primary-900' : 'text-slate-600'
                      }`}
                    >
                      {formatDate(d, language)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {venues.map((v) => (
                  <tr key={v.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="p-2.5 font-semibold sticky start-0 bg-white border-e border-slate-200 z-10">
                      <div className="font-bold text-ink-900">{isAr ? v.nameAr : v.nameEn}</div>
                      <div className="text-[10px] text-slate-400 font-normal">
                        {v.capacity} {t('venues.persons')} · {v.location}
                      </div>
                    </td>
                    {scheduleDays.map((d) => {
                      const slotReqs = bookingsForSlot(requests, v.id, d);
                      const conflicted = slotConflicts(slotReqs);
                      return (
                        <td key={d} className="p-1 align-top border-e border-slate-100">
                          {slotReqs.length === 0 ? (
                            <span className="block w-full py-2 text-center rounded bg-emerald-50/60 text-emerald-700 text-[10px] font-semibold border border-emerald-200/60">
                              {isAr ? 'متاح' : 'Free'}
                            </span>
                          ) : (
                            <div className="space-y-1">
                              {sortByPriority(slotReqs).map((r) => {
                                const dr = normalizeDateRange(
                                  r.eventDates.find((x) => normalizeDateRange(x).date === d) || r.eventDates[0]
                                );
                                const style = SLOT_STATUS_STYLE[r.status] || SLOT_STATUS_STYLE.pending;
                                return (
                                  <button
                                    key={r.id}
                                    onClick={() => setSelected(r)}
                                    className={`w-full p-1.5 rounded-lg border text-start transition-all hover:scale-[1.02] ${style} ${
                                      conflictsMap.has(r.id) ? 'ring-2 ring-rose-400' : ''
                                    }`}
                                    title={conflictsMap.has(r.id) ? (isAr ? 'يوجد تعارض!' : 'Conflict!') : ''}
                                  >
                                    <div className="flex items-center gap-1 font-bold text-[10px]">
                                      {conflictsMap.has(r.id) && (
                                        <AlertTriangle className="w-3 h-3 text-rose-600 shrink-0" />
                                      )}
                                      {priorityOf(r) > 1 && <Flame className="w-3 h-3 text-rose-500 shrink-0" />}
                                      <span className="truncate">{r.title}</span>
                                    </div>
                                    <div className="text-[9px] font-mono mt-0.5 opacity-80" dir="ltr">
                                      {dr.startTime}-{dr.endTime}
                                    </div>
                                  </button>
                                );
                              })}
                              {conflicted && (
                                <div className="text-[9px] text-rose-600 font-bold text-center">
                                  {isAr ? 'تعارض زمني' : 'Overlap'}
                                </div>
                              )}
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======= REQUEST DETAIL / MANAGE MODAL ======= */}
      <Modal
        isOpen={!!selected}
        onClose={() => setSelected(null)}
        title={isAr ? 'إدارة حجز المركز' : 'Manage Center Booking'}
        size="lg"
      >
        {selected && (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-xs text-slate-400">{t('form.success.tracking')}</div>
                <div className="font-mono text-lg font-bold text-primary-800" dir="ltr">
                  {selected.trackingCode}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <PriorityBadge p={selected.priority} />
                <StatusBadge status={selected.status} />
              </div>
            </div>

            <h3 className="text-xl font-bold text-slate-800">{selected.title}</h3>
            <p className="text-slate-600 text-sm">{selected.description}</p>

            {/* Conflict alert */}
            {conflictsMap.has(selected.id) && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-sm">
                <div className="flex items-center gap-2 font-bold text-rose-800 mb-1">
                  <AlertTriangle className="w-4 h-4" />
                  {isAr ? 'تنبيه: تعارض في الموعد' : 'Warning: Schedule Conflict'}
                </div>
                <div className="text-xs text-rose-700">
                  {isAr ? 'يتعارض هذا الحجز مع:' : 'This booking conflicts with:'}{' '}
                  {conflictsMap.get(selected.id)!.map((c) => c.trackingCode).join(' · ')}
                </div>
              </div>
            )}

            <div className="grid sm:grid-cols-2 gap-3 text-sm">
              <CenterDetail label={t('table.serviceType')} value={selected.serviceType === 'theater' ? (isAr ? 'حجز مرافق' : 'Venue Booking') : selected.serviceType} />
              <CenterDetail label={t('table.dates')} value={formatDateRange(selected.eventDates, language)} />
              <CenterDetail label={t('form.name')} value={selected.requesterName} />
              <CenterDetail label={t('form.email')} value={selected.requesterEmail} />
              <CenterDetail label={t('form.phone')} value={selected.requesterPhone || '—'} />
              <CenterDetail
                label={t('table.department')}
                value={
                  selected.requesterType === 'external'
                    ? selected.externalEntity || '—'
                    : selected.requesterDepartment?.split(':')[1] || selected.requesterDepartment || '—'
                }
              />
              {selected.venues?.length ? (
                <CenterDetail
                  label={t('request.details.venues')}
                  value={selected.venues.map(venueName).join(' · ')}
                />
              ) : null}
            </div>

            {/* Priority control */}
            <div>
              <div className="label !mb-2 flex items-center gap-1.5">
                <Star className="w-4 h-4 text-secondary-700" />
                {isAr ? 'أولوية الحجز (تحدد ترتيب التنفيذ وفض التعارض)' : 'Booking Priority (ordering & conflict resolution)'}
              </div>
              <div className="flex gap-2">
                {(['normal', 'high', 'urgent'] as BookingPriority[]).map((p) => {
                  const cfg = PRIORITY_CONFIG[p];
                  const active = (selected.priority ?? 'normal') === p;
                  return (
                    <button
                      key={p}
                      onClick={() => setPriority(selected.id, p)}
                      className={`flex-1 px-3 py-2 rounded-lg border text-xs font-bold transition-all ${
                        active ? cfg.chip + ' ring-1 ring-current' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      {isAr ? cfg.ar : cfg.en}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="label">{t('dashboard.note')}</label>
              <textarea
                className="input-field min-h-[60px]"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>

            <div className="flex flex-wrap gap-2 items-center">
              <button
                className="btn-outline text-sm !py-2 flex items-center gap-1.5"
                onClick={() => {
                  setRescheduleTarget(selected);
                }}
              >
                <CalendarClock className="w-4 h-4" />
                {isAr ? 'إعادة جدولة الموعد' : 'Reschedule'}
              </button>
              <button
                className="px-3 py-2 bg-secondary-50 text-secondary-900 border border-secondary/30 rounded-md text-sm font-semibold flex items-center gap-1.5 hover:bg-secondary-100 transition-colors"
                onClick={() => setContractRequest(selected)}
              >
                <FileText className="w-4 h-4 text-secondary-700" />
                {isAr ? 'العقد الإلكتروني' : 'E-Contract'}
              </button>
              {selected.status === 'pending' && (
                <>
                  <button className="btn-primary" onClick={() => changeStatus(selected.id, 'approved', note)}>
                    {t('dashboard.approve')}
                  </button>
                  <button
                    className="btn-outline !border-rose-400 !text-rose-600 hover:!bg-rose-700 hover:!text-white"
                    onClick={() => changeStatus(selected.id, 'rejected', note)}
                  >
                    {t('dashboard.reject')}
                  </button>
                </>
              )}
              {(selected.status === 'approved' || selected.status === 'in_progress' || selected.status === 'pending') && (
                <button
                  className="btn-ghost !text-rose-700 hover:!bg-rose-50 text-sm"
                  onClick={() => changeStatus(selected.id, 'cancelled', note)}
                >
                  {isAr ? 'إلغاء الحجز' : 'Cancel Booking'}
                </button>
              )}
              {selected.status === 'in_progress' && (
                <button className="btn-primary" onClick={() => changeStatus(selected.id, 'completed', note)}>
                  {t('dashboard.complete')}
                </button>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* ======= RESCHEDULE MODAL ======= */}
      {rescheduleTarget && (
        <RescheduleModal
          request={rescheduleTarget}
          allRequests={requests}
          isAr={isAr}
          username={user?.name || user?.username || 'center_manager'}
          onClose={() => setRescheduleTarget(null)}
          onSaved={() => {
            reload();
            setRescheduleTarget(null);
            if (selected?.id === rescheduleTarget.id) {
              setSelected(getStoredRequests().find((r) => r.id === rescheduleTarget.id) || null);
            }
          }}
        />
      )}

      <ElectronicContractModal
        isOpen={!!contractRequest}
        onClose={() => setContractRequest(null)}
        request={contractRequest}
      />
    </div>
  );
}

function CenterDetail({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
      <div className="text-[11px] text-slate-400 mb-0.5">{label}</div>
      <div className="font-medium text-slate-700 break-words">{value}</div>
    </div>
  );
}

/* ---------- Reschedule modal: تغيير تاريخ وأوقات الحجز مع كشف التعارض ---------- */
function RescheduleModal({
  request,
  allRequests,
  isAr,
  username,
  onClose,
  onSaved,
}: {
  request: ServiceRequest;
  allRequests: ServiceRequest[];
  isAr: boolean;
  username: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [ranges, setRanges] = useState<DateRange[]>(
    (request.eventDates?.length ? request.eventDates : [{ date: todayISO(), startTime: '08:30', endTime: '13:00' }]).map((d) => ({
      date: d.date,
      startTime: d.startTime || '08:30',
      endTime: d.endTime || '13:00',
    }))
  );
  const [reason, setReason] = useState('');

  // فحص التعارض المباشر للمواعيد الجديدة
  const draftConflicts = useMemo(() => {
    const draft: ServiceRequest = { ...request, eventDates: ranges };
    return findRequestConflicts(draft, allRequests);
  }, [ranges, request, allRequests]);

  const update = (i: number, patch: Partial<DateRange>) =>
    setRanges((prev) => prev.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));

  const save = () => {
    const history = [
      ...(request.statusHistory || []),
      {
        status: request.status,
        changedBy: username,
        changedAt: new Date().toISOString(),
        note: isAr
          ? `إعادة جدولة إلى ${ranges.map((r) => `${r.date} ${r.startTime}-${r.endTime}`).join('، ')}${reason ? ` — السبب: ${reason}` : ''}`
          : `Rescheduled to ${ranges.map((r) => `${r.date} ${r.startTime}-${r.endTime}`).join(', ')}${reason ? ` — Reason: ${reason}` : ''}`,
      },
    ];
    updateStoredRequest(request.id, { eventDates: ranges, statusHistory: history });
    onSaved();
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-[var(--line)] overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-5 bg-gradient-to-r from-ink to-primary-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center border border-white/20">
              <CalendarClock className="w-5 h-5 text-secondary-300" />
            </div>
            <div>
              <h3 className="font-bold text-base">{isAr ? 'إعادة جدولة الحجز' : 'Reschedule Booking'}</h3>
              <p className="text-xs text-white/70 font-mono" dir="ltr">{request.trackingCode}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-white hover:bg-white/20 rounded-md">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 overflow-y-auto text-sm">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600">
            {isAr ? 'القاعات:' : 'Venues:'}{' '}
            <span className="font-bold text-ink-800">{request.venues?.join(' · ') || '—'}</span>
          </div>

          {ranges.map((r, i) => (
            <div key={i} className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-2.5">
              <div className="text-xs font-bold text-ink-800">
                {isAr ? `الموعد ${i + 1}` : `Slot ${i + 1}`}
              </div>
              <div>
                <label className="text-[10px] text-slate-500 block mb-0.5">{isAr ? 'التاريخ' : 'Date'}</label>
                <input
                  type="date"
                  value={r.date}
                  min={todayISO()}
                  onChange={(e) => update(i, { date: e.target.value })}
                  className="input-field !py-1.5 text-xs font-mono"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-slate-500 block mb-0.5">{isAr ? 'من' : 'From'}</label>
                  <input
                    type="time"
                    value={r.startTime}
                    onChange={(e) => update(i, { startTime: e.target.value })}
                    className="input-field !py-1.5 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 block mb-0.5">{isAr ? 'إلى' : 'To'}</label>
                  <input
                    type="time"
                    value={r.endTime}
                    onChange={(e) => update(i, { endTime: e.target.value })}
                    className="input-field !py-1.5 text-xs font-mono"
                  />
                </div>
              </div>
            </div>
          ))}

          {draftConflicts.length > 0 && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800">
              <div className="flex items-center gap-1.5 font-bold mb-1">
                <AlertTriangle className="w-4 h-4" />
                {isAr ? 'تحذير: الموعد الجديد يتعارض مع' : 'Warning: new slot conflicts with'}
              </div>
              {draftConflicts.map((c) => (
                <div key={c.id} className="font-mono" dir="ltr">
                  {c.trackingCode} — {c.title}
                </div>
              ))}
            </div>
          )}

          <div>
            <label className="label text-xs">{isAr ? 'سبب إعادة الجدولة (يُسجل في سجل الطلب)' : 'Reschedule reason (logged)'}</label>
            <input
              className="input-field !py-2 text-xs"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={isAr ? 'مثال: تجهيزات صيانة / أولوية لفعالية رسمية' : 'e.g. maintenance / official event priority'}
            />
          </div>
        </div>

        <div className="p-4 bg-slate-50 border-t border-[var(--line)] flex items-center justify-end gap-2">
          <button onClick={onClose} className="btn-ghost text-xs !py-2 !px-3">
            {isAr ? 'إلغاء' : 'Cancel'}
          </button>
          <button
            onClick={save}
            className={`text-xs !py-2.5 !px-5 font-bold flex items-center gap-1.5 shadow-md ${
              draftConflicts.length ? 'btn-secondary' : 'btn-primary'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            {draftConflicts.length
              ? isAr
                ? 'حفظ رغم التعارض (يستلزم فضّه لاحقاً)'
                : 'Save despite conflict'
              : isAr
                ? 'حفظ الموعد الجديد'
                : 'Save New Slot'}
          </button>
        </div>
      </div>
    </div>
  );
}
