import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  MapPin,
  Check,
  CalendarDays,
  Search,
  Eye,
  Building2,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  ArrowLeft,
  FileText,
  CreditCard,
  Grid3X3,
  Table as TableIcon,
  Clock,
  Send,
  X,
  Calendar as CalendarIcon,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import {
  getStoredRequests,
  getStoredVenues,
  addStoredRequest,
} from '../utils/storage';
import { addDaysISO, normalizeDateRange, todayISO } from '../utils/dateUtils';
import { generateTrackingCode } from '../data/defaults';
import type { VenueCategory, VenueInfo, ServiceRequest, RequestStatus } from '../types';
import ElectronicContractModal from '../components/ElectronicContractModal';

type ViewMode = 'cards' | 'matrix' | 'timeline';

const CATEGORY_LABELS: Record<VenueCategory, { ar: string; en: string }> = {
  auditorium: { ar: 'المسارح الكبرى', en: 'Auditoriums' },
  vip: { ar: 'أجنحة كبار الضيوف VIP', en: 'VIP Lounges' },
  exhibition: { ar: 'المعارض والبهو', en: 'Exhibition & Lobby' },
  tiered: { ar: 'القاعات المدرجة', en: 'Tiered Lecture Halls' },
  workshop: { ar: 'قاعات ورش العمل', en: 'Workshop Suites' },
  meeting: { ar: 'قاعات الاجتماعات والندوات', en: 'Meeting & Seminar Rooms' },
};

const STATUS_CONFIG: Record<
  RequestStatus,
  { labelAr: string; labelEn: string; bg: string; text: string; border: string; dot: string }
> = {
  approved: {
    labelAr: 'معتمد ومؤكد',
    labelEn: 'Approved',
    bg: 'bg-emerald-50',
    text: 'text-emerald-800',
    border: 'border-emerald-300',
    dot: 'bg-emerald-500',
  },
  pending: {
    labelAr: 'قيد المراجعة',
    labelEn: 'Pending Review',
    bg: 'bg-amber-50',
    text: 'text-amber-800',
    border: 'border-amber-300',
    dot: 'bg-amber-500',
  },
  in_progress: {
    labelAr: 'قيد التنفيذ',
    labelEn: 'In Progress',
    bg: 'bg-indigo-50',
    text: 'text-indigo-800',
    border: 'border-indigo-300',
    dot: 'bg-indigo-500',
  },
  completed: {
    labelAr: 'مكتمل',
    labelEn: 'Completed',
    bg: 'bg-sky-50',
    text: 'text-sky-800',
    border: 'border-sky-300',
    dot: 'bg-sky-500',
  },
  rejected: {
    labelAr: 'مرفوض',
    labelEn: 'Rejected',
    bg: 'bg-rose-50',
    text: 'text-rose-800',
    border: 'border-rose-300',
    dot: 'bg-rose-500',
  },
  cancelled: {
    labelAr: 'ملغي',
    labelEn: 'Cancelled',
    bg: 'bg-slate-50',
    text: 'text-slate-600',
    border: 'border-slate-300',
    dot: 'bg-slate-400',
  },
};

const VENUE_FALLBACK_IMAGES: Record<string, string> = {
  theater: '/img/business-presentation.jpg',
  vip_lounge: '/img/business-meeting.jpg',
  lobby: '/img/campus-1.jpg',
  b203: '/img/business-strategy.jpg',
  b204: '/img/business-strategy.jpg',
  b208_all: '/img/service-workshop.jpg',
  b208_a: '/img/business-students.jpg',
  b208_b: '/img/business-students.jpg',
  b208_c: '/img/service-workshop.jpg',
  b205: '/img/business-meeting.jpg',
  b206: '/img/business-meeting.jpg',
  b207: '/img/business-meeting.jpg',
  b1_meeting: '/img/supply-chain.jpg',
};

export default function VenuesPage() {
  const { language } = useLanguage();
  const isAr = language === 'ar';
  const Arrow = isAr ? ArrowLeft : ArrowRight;

  const [venues] = useState<VenueInfo[]>(() => getStoredVenues());
  const [requests, setRequests] = useState<ServiceRequest[]>(() => getStoredRequests());

  // View Mode
  const [viewMode, setViewMode] = useState<ViewMode>('matrix');

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [capacityFilter, setCapacityFilter] = useState<string>('all');

  // Interactive selected venue for detailed modal
  const [detailVenue, setDetailVenue] = useState<VenueInfo | null>(null);

  // Contract Modal
  const [contractData, setContractData] = useState<{
    venue: VenueInfo;
    request?: ServiceRequest;
    customDetails?: {
      beneficiary: string;
      date: string;
      startTime: string;
      endTime: string;
    };
  } | null>(null);

  // Selected Booking details modal (When clicking on booked slot)
  const [inspectedBooking, setInspectedBooking] = useState<{
    request: ServiceRequest;
    venue: VenueInfo;
    date: string;
  } | null>(null);

  // Quick Instant Booking Modal (When clicking on available slot)
  const [quickBookingSlot, setQuickBookingSlot] = useState<{
    venue: VenueInfo;
    date: string;
  } | null>(null);

  const [quickForm, setQuickForm] = useState({
    title: '',
    requesterType: 'internal' as 'internal' | 'external',
    beneficiary: 'كلية الطب - عمادة الكلية',
    requesterName: '',
    requesterPhone: '',
    requesterEmail: '',
    timePreset: 'morning' as 'morning' | 'evening' | 'fullday' | 'custom',
    startTime: '08:30',
    endTime: '13:00',
    notes: '',
  });

  const [quickSuccessCode, setQuickSuccessCode] = useState<string | null>(null);

  // Calendar navigation offset in days (for 14-day schedule)
  const [dateOffset, setDateOffset] = useState(0);

  // 14 Days calculation
  const days = useMemo(() => {
    const base = todayISO();
    const start = addDaysISO(dateOffset, base);
    return Array.from({ length: 14 }, (_, i) => addDaysISO(i, start));
  }, [dateOffset]);

  // Bookings map: venueId -> date -> list of requests
  const bookingsMap = useMemo(() => {
    const map: Record<string, Record<string, ServiceRequest[]>> = {};
    for (const v of venues) {
      map[v.id] = {};
    }
    map['theater'] = map['theater'] || {};
    map['lobby'] = map['lobby'] || {};
    map['b2'] = map['b2'] || {};

    for (const req of requests) {
      if (!req.venues?.length || !req.eventDates?.length) continue;
      if (req.status === 'rejected' || req.status === 'cancelled') continue;
      for (const v of req.venues) {
        if (!map[v]) map[v] = {};
        for (const raw of req.eventDates) {
          const dr = normalizeDateRange(raw);
          if (dr.date) {
            if (!map[v][dr.date]) map[v][dr.date] = [];
            map[v][dr.date].push(req);
          }
        }
      }
    }
    return map;
  }, [venues, requests]);

  // Filtered venues list
  const filteredVenues = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return venues.filter((v) => {
      if (selectedCategory !== 'all' && v.category !== selectedCategory) return false;
      if (capacityFilter === '500plus' && v.capacity < 500) return false;
      if (capacityFilter === '100to500' && (v.capacity < 100 || v.capacity >= 500)) return false;
      if (capacityFilter === '50to100' && (v.capacity < 50 || v.capacity >= 100)) return false;
      if (capacityFilter === 'under50' && v.capacity >= 50) return false;

      if (!q) return true;
      return (
        v.nameAr.toLowerCase().includes(q) ||
        v.nameEn.toLowerCase().includes(q) ||
        v.location.toLowerCase().includes(q) ||
        v.amenities.some((a) => a.toLowerCase().includes(q)) ||
        (v.features && v.features.some((f) => f.toLowerCase().includes(q)))
      );
    });
  }, [venues, searchQuery, selectedCategory, capacityFilter]);

  const formatDay = (iso: string) => {
    const d = new Date(iso + 'T00:00:00');
    return {
      weekday: d.toLocaleDateString(isAr ? 'ar-SA' : 'en-GB', { weekday: 'short' }),
      dayNumber: d.toLocaleDateString(isAr ? 'ar-SA' : 'en-GB', { day: 'numeric' }),
      month: d.toLocaleDateString(isAr ? 'ar-SA' : 'en-GB', { month: 'short' }),
      isToday: iso === todayISO(),
      fullFormatted: d.toLocaleDateString(isAr ? 'ar-SA' : 'en-GB', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
    };
  };

  const handleOpenQuickBooking = (venue: VenueInfo, date: string) => {
    setQuickBookingSlot({ venue, date });
    setQuickSuccessCode(null);
    setQuickForm({
      title: isAr ? `فعالية في ${venue.nameAr}` : `Event at ${venue.nameEn}`,
      requesterType: 'internal',
      beneficiary: isAr ? 'كلية الطب - عمادة الكلية' : 'College of Medicine',
      requesterName: '',
      requesterPhone: '',
      requesterEmail: '',
      timePreset: 'morning',
      startTime: '08:30',
      endTime: '13:00',
      notes: '',
    });
  };

  const handleTimePresetChange = (preset: 'morning' | 'evening' | 'fullday' | 'custom') => {
    let start = '08:30';
    let end = '13:00';
    if (preset === 'evening') {
      start = '16:00';
      end = '21:30';
    } else if (preset === 'fullday') {
      start = '08:00';
      end = '17:00';
    }
    setQuickForm((prev) => ({
      ...prev,
      timePreset: preset,
      startTime: start,
      endTime: end,
    }));
  };

  const handleSaveQuickBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickBookingSlot) return;

    const tracking = generateTrackingCode();
    const newReq: ServiceRequest = {
      id: Date.now().toString(),
      trackingCode: tracking,
      serviceType: 'theater',
      title: quickForm.title || (isAr ? 'حجز مرفق معتمد' : 'Confirmed Facility Booking'),
      description: quickForm.notes || (isAr ? 'حجز تم إنشاؤه عبر الجدول الذكي' : 'Created via Smart Matrix'),
      requestDate: todayISO(),
      eventDates: [
        {
          date: quickBookingSlot.date,
          startTime: quickForm.startTime,
          endTime: quickForm.endTime,
        },
      ],
      venues: [quickBookingSlot.venue.id],
      status: 'approved',
      statusHistory: [
        {
          status: 'approved',
          changedBy: 'بوابة الحجز الذكية',
          changedAt: new Date().toISOString(),
          note: isAr
            ? `تم تأكيد وتثبيت الحجز لصالح: ${quickForm.beneficiary} في الفترة (${quickForm.startTime} - ${quickForm.endTime})`
            : `Booking confirmed for ${quickForm.beneficiary} (${quickForm.startTime} - ${quickForm.endTime})`,
        },
      ],
      requesterName: quickForm.requesterName || (isAr ? 'منسق الجهة' : 'Entity Coordinator'),
      requesterEmail: quickForm.requesterEmail || 'coordinator@um.edu.sa',
      requesterPhone: quickForm.requesterPhone || '0500000000',
      requesterDepartment: quickForm.beneficiary,
      requesterType: quickForm.requesterType,
      externalEntity: quickForm.requesterType === 'external' ? quickForm.beneficiary : undefined,
    };

    addStoredRequest(newReq);
    setRequests(getStoredRequests());
    setQuickSuccessCode(tracking);
  };

  return (
    <div className="page-shell animate-fadeIn font-sans">
      {/* Diriyah Conferences & Business Center Highlight Banner */}
      <div className="mb-8 p-6 rounded-2xl bg-gradient-to-r from-ink-950 via-ink to-primary-950 text-white border border-[var(--line)] shadow-xl relative overflow-hidden">
        <div className="absolute top-0 start-0 w-28 h-28 border-s-2 border-t-2 border-secondary/40" />
        <div className="absolute bottom-0 end-0 w-28 h-28 border-e-2 border-b-2 border-primary/30" />
        <div className="relative flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center shrink-0 border border-white/20 text-secondary-300">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-secondary-300 font-bold text-xs uppercase tracking-wider">
                  {isAr ? 'مركز مؤتمرات وأعمال الدرعية — جامعة المعرفة' : 'Almaarefa & Diriyah Facilities Hub'}
                </span>
                <span className="px-2.5 py-0.5 text-[10px] font-semibold bg-secondary/20 text-secondary-200 border border-secondary/30 rounded-full">
                  13 {isAr ? 'مرفقاً وقاعة ذكية' : 'Smart Venues'}
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-white leading-snug">
                {isAr
                  ? 'منظومة حجز القاعات والمرافق والكلندر الذكي'
                  : 'World-Class Facility Booking & Live Calendar Hub'}
              </h1>
              <p className="text-xs sm:text-sm text-white/80 font-naskh mt-1.5 max-w-3xl leading-relaxed">
                {isAr
                  ? 'يحدد الكلندر الذكي بدقة: لمن سيحجز المرفق، الوقت المحدد بالساعة، وحالة الاعتماد الرسمية لكل قاعة مع إمكانية التثبيت الفوري والعقد الإلكتروني.'
                  : 'The smart schedule precisely identifies: the beneficiary entity, exact time slot, and official booking status with instant confirmation.'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Link
              to="/diriyah-center"
              className="btn-secondary text-xs !py-3 !px-5 font-bold flex items-center gap-2 shadow-lg"
            >
              <span>{isAr ? 'مركز مؤتمرات الدرعية' : 'Diriyah Center Page'}</span>
              <Arrow className="w-4 h-4" />
            </Link>
            <button
              onClick={() => {
                const first = venues[0];
                if (first) handleOpenQuickBooking(first, todayISO());
              }}
              className="btn-primary text-xs !py-3 !px-5 font-bold flex items-center gap-2 shadow-lg"
            >
              <CreditCard className="w-4 h-4" />
              <span>{isAr ? 'حجز فوري جديد' : 'New Fast Booking'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Filter & View Control Bar */}
      <div className="bg-white rounded-xl border border-[var(--line)] shadow-xs p-4 sm:p-5 mb-8">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute start-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={
                isAr
                  ? 'ابحث باسم القاعة، السعة، الجهة المستفيدة، أو التجهيزات...'
                  : 'Search venue, capacity, beneficiary, or amenities...'
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field !ps-10 !py-2.5 text-xs sm:text-sm bg-slate-50/50"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute end-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            )}
          </div>

          {/* Controls & Switcher */}
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="input-field !py-2.5 !px-3 text-xs font-semibold bg-slate-50 cursor-pointer min-w-[150px]"
            >
              <option value="all">{isAr ? 'جميع الفئات (13)' : 'All Categories (13)'}</option>
              {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                <option key={key} value={key}>
                  {isAr ? label.ar : label.en}
                </option>
              ))}
            </select>

            <select
              value={capacityFilter}
              onChange={(e) => setCapacityFilter(e.target.value)}
              className="input-field !py-2.5 !px-3 text-xs font-semibold bg-slate-50 cursor-pointer min-w-[130px]"
            >
              <option value="all">{isAr ? 'أي سعة' : 'Any Capacity'}</option>
              <option value="500plus">{isAr ? '+500 مقعد' : '500+ Seats'}</option>
              <option value="100to500">{isAr ? '100 - 500 مقعد' : '100 - 500 Seats'}</option>
              <option value="50to100">{isAr ? '50 - 100 مقعد' : '50 - 100 Seats'}</option>
              <option value="under50">{isAr ? 'أقل من 50 مقعد' : 'Under 50 Seats'}</option>
            </select>

            {/* View Mode Switcher */}
            <div className="inline-flex rounded-lg p-1 bg-slate-100 border border-slate-200">
              <button
                onClick={() => setViewMode('matrix')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                  viewMode === 'matrix'
                    ? 'bg-white text-primary shadow-xs'
                    : 'text-slate-600 hover:text-ink'
                }`}
                title={isAr ? 'جدول الإتاحة ومحدد الحجوزات لـ 14 يوماً' : '14-Day Live Matrix'}
              >
                <TableIcon className="w-3.5 h-3.5" />
                <span>{isAr ? 'مصفوفة الـ 14 يوماً' : '14-Day Matrix'}</span>
              </button>

              <button
                onClick={() => setViewMode('cards')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                  viewMode === 'cards'
                    ? 'bg-white text-primary shadow-xs'
                    : 'text-slate-600 hover:text-ink'
                }`}
                title={isAr ? 'عرض بطاقات المرافق' : 'Cards View'}
              >
                <Grid3X3 className="w-3.5 h-3.5" />
                <span>{isAr ? 'بطاقات القاعات' : 'Cards'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Category Quick Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-3 mt-3 border-t border-slate-100 pb-1 scrollbar-none">
          <button
            onClick={() => {
              setSelectedCategory('all');
              setCapacityFilter('all');
            }}
            className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
              selectedCategory === 'all'
                ? 'bg-primary-700 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {isAr ? 'الكل (13)' : 'All (13)'}
          </button>
          {Object.entries(CATEGORY_LABELS).map(([catKey, label]) => {
            const count = venues.filter((v) => v.category === catKey).length;
            return (
              <button
                key={catKey}
                onClick={() => setSelectedCategory(catKey)}
                className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                  selectedCategory === catKey
                    ? 'bg-primary-700 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {isAr ? label.ar : label.en} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* VIEW MODE 1: 14-DAY INTERACTIVE MATRIX WITH DETAILED BENEFICIARY & TIME & STATUS */}
      {viewMode === 'matrix' && (
        <div className="space-y-6">
          <div className="card-static bg-white border border-[var(--line)] rounded-2xl shadow-xs overflow-hidden">
            {/* Header of Table */}
            <div className="p-4 sm:p-5 border-b border-[var(--line)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary-700">
                  <CalendarDays className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-ink-900">
                    {isAr ? 'جدول الإتاحة وتحديد الجهات المستفيدة والمواعيد' : '14-Day Beneficiary & Schedule Matrix'}
                  </h2>
                  <p className="text-xs text-slate-500 font-naskh">
                    {isAr
                      ? 'يوضح الجدول الجهة المستفيدة، الوقت المحدد بالساعة، وحالة الحجز. انقر على أي موعد للتفاصيل أو الحجز المباشر.'
                      : 'Displays beneficiary entity, exact hours, and status. Click any cell for details or instant booking.'}
                  </p>
                </div>
              </div>

              {/* Navigation buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setDateOffset((prev) => Math.max(0, prev - 7))}
                  disabled={dateOffset === 0}
                  className="btn-ghost text-xs !py-1.5 !px-2.5 disabled:opacity-30 flex items-center gap-1 border border-slate-200 rounded-md"
                >
                  {isAr ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                  <span>{isAr ? 'الأسبوع السابق' : 'Prev Week'}</span>
                </button>

                {dateOffset > 0 && (
                  <button
                    onClick={() => setDateOffset(0)}
                    className="px-2.5 py-1 text-xs bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-md font-semibold"
                  >
                    {isAr ? 'اليوم' : 'Today'}
                  </button>
                )}

                <button
                  onClick={() => setDateOffset((prev) => prev + 7)}
                  className="btn-ghost text-xs !py-1.5 !px-2.5 flex items-center gap-1 border border-slate-200 rounded-md"
                >
                  <span>{isAr ? 'الأسبوع التالي' : 'Next Week'}</span>
                  {isAr ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Matrix Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="p-3.5 font-bold text-slate-700 sticky start-0 bg-slate-50 min-w-[210px] z-20 border-e border-slate-200 text-start">
                      {isAr ? 'المرفق / القاعة' : 'Facility / Hall'}
                    </th>
                    {days.map((d) => {
                      const dayInfo = formatDay(d);
                      return (
                        <th
                          key={d}
                          className={`p-2 text-center whitespace-nowrap min-w-[130px] border-e border-slate-100 ${
                            dayInfo.isToday ? 'bg-primary-50/80 font-bold text-primary-900' : 'text-slate-600'
                          }`}
                        >
                          <div className="text-[10px] uppercase font-bold text-slate-400">{dayInfo.weekday}</div>
                          <div className="text-sm font-extrabold">{dayInfo.dayNumber}</div>
                          <div className="text-[9px] text-slate-400">{dayInfo.month}</div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredVenues.map((venue) => {
                    return (
                      <tr key={venue.id} className="hover:bg-slate-50/50 transition-colors">
                        {/* Facility Name & Capacity */}
                        <td className="p-3 font-semibold text-slate-800 sticky start-0 bg-white border-e border-slate-200 z-10">
                          <div className="font-bold text-ink-900 flex items-center justify-between gap-2">
                            <span className="line-clamp-1">{isAr ? venue.nameAr : venue.nameEn}</span>
                            <span className="text-[10px] text-slate-400 font-mono shrink-0 bg-slate-100 px-1.5 py-0.5 rounded">
                              {venue.capacity}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-400 font-normal truncate mt-0.5">
                            {venue.location}
                          </div>
                        </td>

                        {/* Days Slots */}
                        {days.map((d) => {
                          const reqs = bookingsMap[venue.id]?.[d] || [];
                          const isBooked = reqs.length > 0;
                          const req = reqs[0];

                          if (isBooked && req) {
                            const statusStyle = STATUS_CONFIG[req.status] || STATUS_CONFIG.approved;
                            const beneficiary =
                              req.externalEntity ||
                              (req.requesterDepartment ? req.requesterDepartment.replace(/^[^:]*:/, '') : req.requesterName);
                            const slotTime = req.eventDates?.find((dr) => dr.date === d);
                            const timeStr = slotTime?.startTime && slotTime?.endTime
                              ? `${slotTime.startTime} - ${slotTime.endTime}`
                              : '09:00 - 14:00';

                            return (
                              <td key={d} className="p-1.5 text-start border-e border-slate-100 align-top">
                                <button
                                  type="button"
                                  onClick={() => setInspectedBooking({ request: req, venue, date: d })}
                                  className={`w-full p-2 rounded-lg border text-start transition-all hover:scale-[1.02] shadow-2xs ${statusStyle.bg} ${statusStyle.border}`}
                                >
                                  {/* Status pill & dot */}
                                  <div className="flex items-center justify-between gap-1 mb-1">
                                    <span className="flex items-center gap-1 text-[10px] font-bold truncate">
                                      <span className={`w-2 h-2 rounded-full ${statusStyle.dot} shrink-0`} />
                                      <span className={statusStyle.text}>
                                        {isAr ? statusStyle.labelAr : statusStyle.labelEn}
                                      </span>
                                    </span>
                                  </div>

                                  {/* Beneficiary Entity */}
                                  <div className="text-[11px] font-bold text-ink-900 line-clamp-1 mb-1 font-naskh">
                                    {beneficiary}
                                  </div>

                                  {/* Exact Time Slot */}
                                  <div className="flex items-center gap-1 text-[10px] text-slate-600 font-mono" dir="ltr">
                                    <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                                    <span>{timeStr}</span>
                                  </div>
                                </button>
                              </td>
                            );
                          }

                          return (
                            <td key={d} className="p-1.5 text-center border-e border-slate-100">
                              <button
                                type="button"
                                onClick={() => handleOpenQuickBooking(venue, d)}
                                className="w-full h-full min-h-[58px] py-2 px-1.5 rounded-lg text-[11px] font-bold bg-emerald-50/60 text-emerald-800 border border-emerald-200/80 hover:bg-emerald-700 hover:text-white transition-all flex flex-col items-center justify-center gap-0.5 group"
                              >
                                <span className="flex items-center gap-1 text-emerald-700 group-hover:text-white">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 group-hover:bg-white" />
                                  <span>{isAr ? 'متاح' : 'Available'}</span>
                                </span>
                                <span className="text-[10px] font-normal text-emerald-600 group-hover:text-white/90">
                                  {isAr ? '+ احجز الآن' : '+ Book'}
                                </span>
                              </button>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Legend Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4 text-xs">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-md bg-emerald-500" />
                  <span className="text-slate-700 font-semibold">{isAr ? 'متاح للحجز الفوري' : 'Available for Booking'}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-md bg-emerald-700" />
                  <span className="text-slate-700">{isAr ? 'معتمد ومؤكد (Approved)' : 'Confirmed Booking'}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-md bg-amber-500" />
                  <span className="text-slate-700">{isAr ? 'قيد المراجعة (Pending)' : 'Under Review'}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-md bg-indigo-500" />
                  <span className="text-slate-700">{isAr ? 'قيد التنفيذ (In Progress)' : 'In Progress'}</span>
                </div>
              </div>
              <div className="text-slate-400 text-[11px]">
                {isAr ? 'اضغط على أي خانة لعرض التفاصيل الكاملة أو الحجز الفوري' : 'Click any slot to view details or book immediately'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW MODE 2: CARDS GRID */}
      {viewMode === 'cards' && (
        <div className="space-y-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredVenues.map((venue) => {
              const bgImg = venue.image || VENUE_FALLBACK_IMAGES[venue.id] || '/img/business-meeting.jpg';
              return (
                <div
                  key={venue.id}
                  className="card flex flex-col !p-0 overflow-hidden bg-white border border-[var(--line)] rounded-2xl shadow-xs hover:shadow-lg transition-all duration-300 group"
                >
                  {/* Photo Header */}
                  <div className="h-48 relative overflow-hidden">
                    <img
                      src={bgImg}
                      alt={isAr ? venue.nameAr : venue.nameEn}
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div
                      className="absolute inset-0"
                      style={{
                        background:
                          'linear-gradient(to top, rgba(11,44,53,0.92) 0%, rgba(11,44,53,0.2) 100%)',
                      }}
                    />
                    <div className="absolute top-3 start-3 flex items-center gap-2">
                      <span className="px-2.5 py-1 bg-ink/80 backdrop-blur-xs text-secondary-300 text-xs font-bold rounded-md border border-secondary/30">
                        {isAr
                          ? CATEGORY_LABELS[venue.category]?.ar || venue.category
                          : CATEGORY_LABELS[venue.category]?.en || venue.category}
                      </span>
                    </div>
                    <div className="absolute top-3 end-3">
                      <span className="px-2.5 py-1 bg-white/90 backdrop-blur-xs text-ink-900 text-xs font-bold rounded-md font-mono shadow-xs">
                        {venue.capacity} {isAr ? 'مقعد' : 'seats'}
                      </span>
                    </div>
                    <div className="absolute bottom-3 start-4 end-4">
                      <h3 className="text-white text-lg font-bold leading-tight drop-shadow-xs">
                        {isAr ? venue.nameAr : venue.nameEn}
                      </h3>
                      {venue.adjacentTo && (
                        <p className="text-secondary-300 text-xs font-naskh mt-0.5 truncate">
                          {venue.adjacentTo}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-2.5">
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <MapPin className="w-3.5 h-3.5 text-primary-700 shrink-0" />
                        <span>{venue.location}</span>
                      </div>

                      {/* Key features */}
                      {venue.features && venue.features.length > 0 && (
                        <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-xs text-slate-700 font-naskh space-y-1">
                          {venue.features.slice(0, 2).map((feat, idx) => (
                            <div key={idx} className="flex items-start gap-1.5">
                              <span className="text-secondary font-bold">▪</span>
                              <span>{feat}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Amenities Pills */}
                      <div>
                        <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                          {isAr ? 'التجهيزات المعتمدة:' : 'Amenities:'}
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {venue.amenities.slice(0, 4).map((a) => (
                            <span
                              key={a}
                              className="inline-flex items-center gap-1 text-[11px] bg-primary-50 text-primary-800 px-2 py-0.5 rounded-md font-medium"
                            >
                              <Check className="w-3 h-3 text-emerald-600" />
                              {a}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="pt-3 border-t border-slate-100 flex items-center gap-2">
                      <button
                        onClick={() => setDetailVenue(venue)}
                        className="btn-ghost text-xs !py-2 !px-3 flex-1 flex items-center justify-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>{isAr ? 'المواصفات' : 'Specs'}</span>
                      </button>

                      <button
                        onClick={() => handleOpenQuickBooking(venue, todayISO())}
                        className="btn-primary text-xs !py-2 !px-3 flex-1 flex items-center justify-center gap-1 font-bold"
                      >
                        <span>{isAr ? 'حجز المرفق' : 'Book Hall'}</span>
                        <Arrow className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* INSPECTED BOOKING DETAIL MODAL (WHEN CLICKING ON BOOKED SLOT) */}
      {inspectedBooking && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full border border-[var(--line)] overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-5 bg-gradient-to-r from-ink to-primary text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center border border-white/20">
                  <CalendarIcon className="w-5 h-5 text-secondary-300" />
                </div>
                <div>
                  <h3 className="font-bold text-base md:text-lg">
                    {isAr ? 'تفاصيل حجز المرفق المعتمد' : 'Confirmed Booking Inspection'}
                  </h3>
                  <p className="text-xs text-white/70">
                    {isAr ? inspectedBooking.venue.nameAr : inspectedBooking.venue.nameEn}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setInspectedBooking(null)}
                className="p-1.5 text-white hover:bg-white/20 rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto font-naskh text-sm">
              {/* Status Header */}
              <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <div className="text-[11px] text-slate-400 font-sans">{isAr ? 'رقم التتبع والتوثيق' : 'Tracking ID'}</div>
                  <div className="font-mono font-bold text-primary-700 text-sm">{inspectedBooking.request.trackingCode}</div>
                </div>
                <div>
                  {(() => {
                    const st = STATUS_CONFIG[inspectedBooking.request.status] || STATUS_CONFIG.approved;
                    return (
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${st.bg} ${st.text} border ${st.border}`}>
                        <span className={`w-2 h-2 rounded-full ${st.dot}`} />
                        {isAr ? st.labelAr : st.labelEn}
                      </span>
                    );
                  })()}
                </div>
              </div>

              {/* Event title */}
              <div>
                <div className="text-[11px] text-slate-400 font-sans uppercase font-bold">{isAr ? 'عنوان الفعالية / المناسبة' : 'Event Title'}</div>
                <div className="font-bold text-base text-ink-900 mt-0.5">{inspectedBooking.request.title}</div>
                {inspectedBooking.request.description && (
                  <p className="text-xs text-slate-600 mt-1">{inspectedBooking.request.description}</p>
                )}
              </div>

              {/* Beneficiary & Time Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="p-3 bg-primary-50/50 rounded-xl border border-primary/20">
                  <div className="text-[11px] text-primary-800 font-bold mb-1 flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5 text-secondary" />
                    <span>{isAr ? 'الجهة المستفيدة المعتمدة:' : 'Beneficiary Entity:'}</span>
                  </div>
                  <div className="font-bold text-xs text-ink-900">
                    {inspectedBooking.request.externalEntity ||
                      inspectedBooking.request.requesterDepartment?.replace(/^[^:]*:/, '') ||
                      inspectedBooking.request.requesterName}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    {inspectedBooking.request.requesterType === 'external' ? (isAr ? 'جهة خارجية' : 'External') : (isAr ? 'جهة جامعية داخلية' : 'University Internal')}
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="text-[11px] text-slate-600 font-bold mb-1 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-secondary" />
                    <span>{isAr ? 'الوقت المحدد والتاريخ:' : 'Time & Date:'}</span>
                  </div>
                  <div className="font-bold text-xs text-ink-900 font-mono">
                    {inspectedBooking.date}
                  </div>
                  <div className="text-[11px] text-primary-700 font-bold font-mono mt-0.5" dir="ltr">
                    {inspectedBooking.request.eventDates?.[0]?.startTime || '08:30'} - {inspectedBooking.request.eventDates?.[0]?.endTime || '13:30'}
                  </div>
                </div>
              </div>

              {/* Requester Contact */}
              <div className="p-3 rounded-xl border border-slate-100 bg-slate-50 text-xs text-slate-700 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">{isAr ? 'مقدم الطلب / المفوض:' : 'Contact Person:'}</span>
                  <span className="font-bold">{inspectedBooking.request.requesterName}</span>
                </div>
                {inspectedBooking.request.requesterPhone && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">{isAr ? 'رقم الاتصال:' : 'Phone:'}</span>
                    <span className="font-mono" dir="ltr">{inspectedBooking.request.requesterPhone}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-[var(--line)] flex items-center justify-between gap-2">
              <button
                onClick={() => {
                  setContractData({
                    venue: inspectedBooking.venue,
                    request: inspectedBooking.request,
                  });
                  setInspectedBooking(null);
                }}
                className="px-3.5 py-2 bg-secondary-50 text-secondary-900 border border-secondary/30 rounded-lg text-xs font-bold hover:bg-secondary-100 flex items-center gap-1.5 transition-colors"
              >
                <FileText className="w-4 h-4 text-secondary-700" />
                <span>{isAr ? 'استعراض العقد الإلكتروني' : 'View E-Contract'}</span>
              </button>

              <button
                onClick={() => setInspectedBooking(null)}
                className="btn-ghost text-xs !py-2 !px-4"
              >
                {isAr ? 'إغلاق' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QUICK INSTANT BOOKING DRAWER / MODAL (WHEN CLICKING ON AVAILABLE SLOT) */}
      {quickBookingSlot && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-[var(--line)] overflow-hidden flex flex-col max-h-[92vh]">
            <div className="p-5 bg-gradient-to-r from-ink to-primary text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-emerald-500/20 flex items-center justify-center border border-emerald-400/30 text-emerald-300">
                  <CalendarIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base">
                    {isAr ? 'تثبيت حجز فوري للمرفق' : 'Instant Facility Booking'}
                  </h3>
                  <p className="text-xs text-white/70">
                    {isAr ? quickBookingSlot.venue.nameAr : quickBookingSlot.venue.nameEn} · {quickBookingSlot.date}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setQuickBookingSlot(null)}
                className="p-1.5 text-white hover:bg-white/20 rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {quickSuccessCode ? (
              <div className="p-8 text-center space-y-4 font-naskh">
                <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h4 className="font-bold text-lg text-ink-900 font-sans">
                  {isAr ? 'تم تثبيت وتأكيد الحجز بنجاح!' : 'Booking Confirmed Successfully!'}
                </h4>
                <p className="text-xs text-slate-600 max-w-sm mx-auto">
                  {isAr
                    ? `تم تسجيل الحجز للقاعة في التاريخ المحدد وإدراجه في جدول الإشغال برقم تتبع:`
                    : `Your booking has been registered in the live schedule with tracking code:`}
                </p>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl font-mono text-base font-bold text-primary">
                  {quickSuccessCode}
                </div>
                <div className="flex items-center justify-center gap-2 pt-2">
                  <button
                    onClick={() => {
                      const req = getStoredRequests().find((r) => r.trackingCode === quickSuccessCode);
                      if (req) {
                        setContractData({
                          venue: quickBookingSlot.venue,
                          request: req,
                        });
                      }
                      setQuickBookingSlot(null);
                    }}
                    className="btn-secondary text-xs !py-2.5 !px-4 flex items-center gap-1.5"
                  >
                    <FileText className="w-4 h-4" />
                    <span>{isAr ? 'عرض العقد الإلكتروني' : 'View Contract'}</span>
                  </button>
                  <button
                    onClick={() => setQuickBookingSlot(null)}
                    className="btn-ghost text-xs !py-2.5 !px-4"
                  >
                    {isAr ? 'إغلاق ومتابعة' : 'Done'}
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSaveQuickBooking} className="p-6 space-y-4 overflow-y-auto font-naskh text-sm">
                {/* 1. Who is booking (Beneficiary) */}
                <div>
                  <label className="block text-xs font-bold text-ink-900 uppercase font-sans mb-1.5">
                    {isAr ? '1. لمن سيحجز المرفق؟ (الجهة المستفيدة):' : '1. Beneficiary Entity:'}
                  </label>
                  <div className="grid grid-cols-2 gap-2 mb-2">
                    <button
                      type="button"
                      onClick={() =>
                        setQuickForm((p) => ({
                          ...p,
                          requesterType: 'internal',
                          beneficiary: isAr ? 'كلية الطب - عمادة الكلية' : 'College of Medicine',
                        }))
                      }
                      className={`p-2 text-xs font-bold rounded-lg border text-center transition-colors ${
                        quickForm.requesterType === 'internal'
                          ? 'bg-primary-50 border-primary text-primary-800'
                          : 'bg-slate-50 border-slate-200 text-slate-600'
                      }`}
                    >
                      {isAr ? 'جهة داخلية (كلية / قسم)' : 'University Internal'}
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setQuickForm((p) => ({
                          ...p,
                          requesterType: 'external',
                          beneficiary: isAr ? 'هيئة تطوير بوابة الدرعية' : 'Diriyah Gate Authority',
                        }))
                      }
                      className={`p-2 text-xs font-bold rounded-lg border text-center transition-colors ${
                        quickForm.requesterType === 'external'
                          ? 'bg-primary-50 border-primary text-primary-800'
                          : 'bg-slate-50 border-slate-200 text-slate-600'
                      }`}
                    >
                      {isAr ? 'جهة خارجية متعاقدة' : 'External Partner'}
                    </button>
                  </div>

                  <input
                    type="text"
                    required
                    placeholder={
                      isAr
                        ? 'اكتب اسم الجهة / الكلية / الشركة المستفيدة'
                        : 'Enter entity / college / partner name'
                    }
                    value={quickForm.beneficiary}
                    onChange={(e) => setQuickForm({ ...quickForm, beneficiary: e.target.value })}
                    className="input-field text-xs sm:text-sm !py-2"
                  />
                </div>

                {/* 2. Event Title */}
                <div>
                  <label className="block text-xs font-bold text-ink-900 uppercase font-sans mb-1">
                    {isAr ? '2. مسمى الفعالية / النشاط:' : '2. Event Title:'}
                  </label>
                  <input
                    type="text"
                    required
                    value={quickForm.title}
                    onChange={(e) => setQuickForm({ ...quickForm, title: e.target.value })}
                    className="input-field text-xs sm:text-sm !py-2"
                  />
                </div>

                {/* 3. Exact Time Range */}
                <div>
                  <label className="block text-xs font-bold text-ink-900 uppercase font-sans mb-1.5">
                    {isAr ? '3. الوقت المحدد للحجز:' : '3. Exact Time Slot:'}
                  </label>
                  <div className="grid grid-cols-4 gap-1.5 mb-2.5 text-[11px] font-sans">
                    {(
                      [
                        { id: 'morning', labelAr: 'صباحي (08:30-13:00)', labelEn: 'Morning' },
                        { id: 'evening', labelAr: 'مسائي (16:00-21:30)', labelEn: 'Evening' },
                        { id: 'fullday', labelAr: 'يوم كامل (08:00-17:00)', labelEn: 'Full Day' },
                        { id: 'custom', labelAr: 'مخصص', labelEn: 'Custom' },
                      ] as const
                    ).map((ps) => (
                      <button
                        key={ps.id}
                        type="button"
                        onClick={() => handleTimePresetChange(ps.id)}
                        className={`p-1.5 rounded-lg border font-semibold text-center truncate ${
                          quickForm.timePreset === ps.id
                            ? 'bg-secondary text-ink-950 border-secondary font-bold'
                            : 'bg-slate-50 text-slate-600 border-slate-200'
                        }`}
                      >
                        {isAr ? ps.labelAr : ps.labelEn}
                      </button>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-[10px] text-slate-500 block mb-0.5">{isAr ? 'من الساعة' : 'From'}</span>
                      <input
                        type="time"
                        required
                        value={quickForm.startTime}
                        onChange={(e) => setQuickForm({ ...quickForm, startTime: e.target.value, timePreset: 'custom' })}
                        className="input-field !py-1.5 text-xs font-mono"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block mb-0.5">{isAr ? 'إلى الساعة' : 'To'}</span>
                      <input
                        type="time"
                        required
                        value={quickForm.endTime}
                        onChange={(e) => setQuickForm({ ...quickForm, endTime: e.target.value, timePreset: 'custom' })}
                        className="input-field !py-1.5 text-xs font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* 4. Requester info */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div>
                    <label className="text-[10px] text-slate-500 block mb-0.5">{isAr ? 'اسم المسؤول' : 'Coordinator'}</label>
                    <input
                      type="text"
                      placeholder={isAr ? 'أ. أحمد' : 'Name'}
                      value={quickForm.requesterName}
                      onChange={(e) => setQuickForm({ ...quickForm, requesterName: e.target.value })}
                      className="input-field !py-1.5 text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 block mb-0.5">{isAr ? 'رقم الجوال' : 'Phone'}</label>
                    <input
                      type="tel"
                      placeholder="05xxxxxxxx"
                      value={quickForm.requesterPhone}
                      onChange={(e) => setQuickForm({ ...quickForm, requesterPhone: e.target.value })}
                      className="input-field !py-1.5 text-xs font-mono"
                      dir="ltr"
                    />
                  </div>
                </div>

                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    {isAr
                      ? `تم التحقق: المرفق متاح في تاريخ ${quickBookingSlot.date} ولا يوجد أي تعارض.`
                      : `Verified: No schedule conflict detected for ${quickBookingSlot.date}.`}
                  </span>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setQuickBookingSlot(null)}
                    className="btn-ghost text-xs !py-2 !px-3"
                  >
                    {isAr ? 'إلغاء' : 'Cancel'}
                  </button>
                  <button
                    type="submit"
                    className="btn-primary text-xs !py-2.5 !px-5 font-bold flex items-center gap-1.5 shadow-md"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{isAr ? 'تأكيد وحفظ الحجز في الجدول' : 'Confirm & Lock Slot'}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* DETAILED FACILITY MODAL */}
      {detailVenue && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-[var(--line)] overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-5 bg-gradient-to-r from-ink to-primary text-white flex items-center justify-between">
              <div>
                <div className="text-xs text-secondary-300 font-semibold mb-0.5">
                  {isAr
                    ? CATEGORY_LABELS[detailVenue.category]?.ar
                    : CATEGORY_LABELS[detailVenue.category]?.en}
                </div>
                <h3 className="font-bold text-lg">{isAr ? detailVenue.nameAr : detailVenue.nameEn}</h3>
              </div>
              <button
                onClick={() => setDetailVenue(null)}
                className="p-1.5 text-white hover:bg-white/20 rounded-md"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-5 font-naskh text-sm">
              <div className="h-44 relative rounded-xl overflow-hidden border border-slate-200">
                <img
                  src={detailVenue.image || VENUE_FALLBACK_IMAGES[detailVenue.id]}
                  alt=""
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ink-950/70 via-transparent to-transparent" />
                <div className="absolute bottom-3 start-3 end-3 text-white flex items-center justify-between">
                  <span className="text-xs font-semibold">{detailVenue.location}</span>
                  <span className="px-2.5 py-1 bg-secondary text-ink-950 font-bold text-xs rounded-md">
                    {detailVenue.capacity} {isAr ? 'مقعد' : 'seats'}
                  </span>
                </div>
              </div>

              {detailVenue.features && (
                <div>
                  <h4 className="font-bold text-xs font-sans text-primary-900 uppercase tracking-wider mb-2">
                    {isAr ? 'مواصفات وتفاصيل القاعة:' : 'Hall Specifications:'}
                  </h4>
                  <div className="space-y-1.5 bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs text-slate-700">
                    {detailVenue.features.map((f, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{f}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h4 className="font-bold text-xs font-sans text-primary-900 uppercase tracking-wider mb-2">
                  {isAr ? 'التجهيزات والخدمات الفنية المعتمدة:' : 'Approved Amenities & Tech Setup:'}
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {detailVenue.amenities.map((a) => (
                    <span
                      key={a}
                      className="px-2.5 py-1 bg-primary-50 text-primary-800 text-xs font-semibold rounded-md border border-primary/20"
                    >
                      {a}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-[var(--line)] flex items-center justify-end gap-2">
              <button onClick={() => setDetailVenue(null)} className="btn-ghost text-xs !py-2 !px-3">
                {isAr ? 'إغلاق' : 'Close'}
              </button>
              <button
                onClick={() => {
                  handleOpenQuickBooking(detailVenue, todayISO());
                  setDetailVenue(null);
                }}
                className="btn-primary text-xs !py-2 !px-4 flex items-center gap-1.5 font-bold"
              >
                <span>{isAr ? 'حجز هذا المرفق الآن' : 'Book Hall'}</span>
                <Arrow className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ELECTRONIC CONTRACT MODAL */}
      {contractData && (
        <ElectronicContractModal
          isOpen={!!contractData}
          onClose={() => setContractData(null)}
          request={contractData.request}
          customData={
            contractData.request
              ? undefined
              : {
                  clientName: 'المفوّض المعتمد للجهة',
                  entityName: contractData.customDetails?.beneficiary || (isAr ? 'الجهة المستفيدة' : 'Beneficiary Entity'),
                  entityType: isAr ? 'عقد تأجير مرافق مركز مؤتمرات وأعمال الدرعية' : 'Facility Lease Contract',
                  phone: '05xxxxxxxx',
                  email: 'client@partner.sa',
                  venueName: isAr ? contractData.venue.nameAr : contractData.venue.nameEn,
                  eventTitle: isAr ? `حجز في ${contractData.venue.nameAr}` : `Booking for ${contractData.venue.nameEn}`,
                  eventDate: contractData.customDetails?.date || todayISO(),
                  duration: `${contractData.customDetails?.startTime || '08:30'} - ${contractData.customDetails?.endTime || '13:30'}`,
                  totalAmount: contractData.venue.capacity > 500 ? 25000 : (contractData.venue.capacity > 100 ? 15000 : 7500),
                  trackingCode: `UM-DCBC-${contractData.venue.id.toUpperCase()}-26`,
                }
          }
        />
      )}
    </div>
  );
}
