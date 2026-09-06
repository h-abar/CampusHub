import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  BarChart3,
  Building2,
  CheckCircle2,
  ClipboardList,
  Eye,
  FileText,
  PlayCircle,
  Power,
  Search,
  Settings,
  ShieldCheck,
  Trash2,
  UserCheck,
  UserPlus,
  XCircle,
  Inbox,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import {
  getStoredRequests,
  getSystemSettings,
  saveSystemSettings,
  updateStoredRequest,
  getStoredAdmins,
  addStoredAdmin,
  updateStoredAdmin,
  deleteStoredAdmin,
  getStoredVenues,
} from '../utils/storage';
import { formatDate, formatDateRange } from '../utils/dateUtils';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import StatsCard from '../components/StatsCard';
import ElectronicContractModal from '../components/ElectronicContractModal';
import type { RequestStatus, ServiceRequest, SystemSettings, VenueInfo } from '../types';
import type { StoredAdmin } from '../types/auth';
import { normalizeDateRange, addDaysISO, todayISO } from '../utils/dateUtils';

type Tab = 'overview' | 'requests' | 'venues' | 'admins' | 'settings';

export default function Dashboard() {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>('overview');
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [settings, setSettings] = useState<SystemSettings>(() => getSystemSettings());
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [serviceFilter, setServiceFilter] = useState<string>('all');
  const [mineOnly, setMineOnly] = useState(false);
  const [selected, setSelected] = useState<ServiceRequest | null>(null);
  const [note, setNote] = useState('');
  const [savedFlash, setSavedFlash] = useState(false);
  const [admins, setAdmins] = useState<StoredAdmin[]>(() => getStoredAdmins());
  const [dashboardVenues] = useState<VenueInfo[]>(() => getStoredVenues());
  const [venueCategoryFilter, setVenueCategoryFilter] = useState<string>('all');
  const [adminModalOpen, setAdminModalOpen] = useState(false);
  const [contractModalRequest, setContractModalRequest] = useState<ServiceRequest | null>(null);
  const [adminForm, setAdminForm] = useState({ name: '', username: '', email: '', password: '', department: '' });
  const [adminError, setAdminError] = useState('');

  const reload = useCallback(() => {
    setRequests(getStoredRequests());
    setSettings(getSystemSettings());
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const stats = useMemo(() => {
    const c: Record<RequestStatus | 'total', number> = {
      total: requests.length,
      pending: 0,
      approved: 0,
      completed: 0,
      rejected: 0,
      in_progress: 0,
      cancelled: 0,
    };
    for (const r of requests) {
      c[r.status] += 1;
    }
    return c;
  }, [requests]);

  // Services assigned to the currently logged-in admin (empty = all services)
  const myServices = useMemo(
    () => admins.find((a) => a.id === user?.id)?.services,
    [admins, user]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return requests.filter((r) => {
      if (mineOnly && myServices?.length && !myServices.includes(r.serviceType)) return false;
      if (statusFilter !== 'all' && r.status !== statusFilter) return false;
      if (serviceFilter !== 'all' && r.serviceType !== serviceFilter) return false;
      if (!q) return true;
      return (
        r.title?.toLowerCase().includes(q) ||
        r.requesterName?.toLowerCase().includes(q) ||
        r.trackingCode?.toLowerCase().includes(q) ||
        r.requesterEmail?.toLowerCase().includes(q)
      );
    });
  }, [requests, search, statusFilter, serviceFilter, mineOnly, myServices]);

  const serviceLabel = (key: string) => {
    const s = settings.services.find((x) => x.key === key);
    if (!s) return t(`service.${key}`) !== `service.${key}` ? t(`service.${key}`) : key;
    return language === 'ar' ? s.name : s.nameEn || s.name;
  };

  const changeStatus = (id: string, status: RequestStatus, adminNote?: string) => {
    const req = requests.find((r) => r.id === id);
    if (!req) return;
    const history = [
      ...(req.statusHistory || []),
      {
        status,
        changedBy: user?.username || 'admin',
        changedAt: new Date().toISOString(),
        note: adminNote || undefined,
      },
    ];
    updateStoredRequest(id, {
      status,
      statusHistory: history,
      adminNotes: adminNote || req.adminNotes,
    });
    reload();
    if (selected?.id === id) {
      const updated = getStoredRequests().find((r) => r.id === id) || null;
      setSelected(updated);
    }
    setNote('');
  };

  /* ================= Admins management ================= */
  const reloadAdmins = () => setAdmins(getStoredAdmins());
  const activeAdminsCount = admins.filter((a) => a.active).length;

  const handleAddAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    setAdminError('');
    const username = adminForm.username.trim();
    const email = adminForm.email.trim();
    const password = adminForm.password.trim();
    const department = adminForm.department.trim();
    if (!username || !email || !password) {
      setAdminError(t('admins.error.required'));
      return;
    }
    if (admins.some((a) => a.username.toLowerCase() === username.toLowerCase())) {
      setAdminError(t('admins.error.exists'));
      return;
    }
    addStoredAdmin({
      id: Date.now().toString(),
      username,
      email,
      password,
      department,
      name: adminForm.name.trim() || undefined,
      role: 'admin',
      active: true,
      createdAt: new Date().toISOString(),
    });
    reloadAdmins();
    setAdminModalOpen(false);
    setAdminForm({ name: '', username: '', email: '', password: '', department: '' });
  };

  const toggleAdminActive = (a: StoredAdmin) => {
    setAdminError('');
    if (a.id === user?.id) {
      setAdminError(t('admins.error.self'));
      return;
    }
    if (a.active && activeAdminsCount <= 1) {
      setAdminError(t('admins.error.lastAdmin'));
      return;
    }
    updateStoredAdmin(a.id, { active: !a.active });
    reloadAdmins();
  };

  const removeAdmin = (a: StoredAdmin) => {
    setAdminError('');
    if (a.id === user?.id) {
      setAdminError(t('admins.error.self'));
      return;
    }
    if (a.active && activeAdminsCount <= 1) {
      setAdminError(t('admins.error.lastAdmin'));
      return;
    }
    if (window.confirm(t('admins.confirmDelete'))) {
      deleteStoredAdmin(a.id);
      reloadAdmins();
    }
  };

  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: 'overview', label: t('dashboard.overview'), icon: BarChart3 },
    { id: 'requests', label: t('dashboard.requests'), icon: ClipboardList },
    { id: 'venues', label: t('dashboard.venues'), icon: Building2 },
    { id: 'admins', label: t('dashboard.admins'), icon: ShieldCheck },
    { id: 'settings', label: t('dashboard.settings'), icon: Settings },
  ];

  // Venue occupancy for next 14 days
  const days = useMemo(() => {
    const start = todayISO();
    return Array.from({ length: 14 }, (_, i) => addDaysISO(i, start));
  }, []);

  const venueBookings = useMemo(() => {
    const map: Record<string, Set<string>> = {};
    for (const v of dashboardVenues) {
      map[v.id] = new Set();
    }
    map['theater'] = map['theater'] || new Set();
    map['lobby'] = map['lobby'] || new Set();
    map['b2'] = map['b2'] || new Set();

    for (const req of requests) {
      if (!req.venues?.length) continue;
      if (req.status === 'rejected' || req.status === 'cancelled') continue;
      for (const v of req.venues) {
        if (!map[v]) map[v] = new Set();
        for (const raw of req.eventDates || []) {
          const dr = normalizeDateRange(raw);
          if (dr.date) map[v]?.add(dr.date);
        }
      }
    }
    return map;
  }, [dashboardVenues, requests]);

  const saveSettings = () => {
    saveSystemSettings(settings);
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 2000);
  };

  return (
    <div className="page-shell animate-fadeIn">
      <div className="mb-6">
        <div className="title-rule">
          <h1 className="section-title !mb-0">{t('dashboard.title')}</h1>
        </div>
        <p className="text-ink-500 font-naskh">
          {t('header.welcome')} {user?.username} — {t('dashboard.welcome')}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1 mb-6 p-1 bg-white border border-[var(--line)] shadow-panel">
        {tabs.map((tb) => (
          <button
            key={tb.id}
            onClick={() => setTab(tb.id)}
            className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors ${
              tab === tb.id
                ? 'bg-ink text-white'
                : 'text-ink-600 hover:bg-ink-50'
            }`}
          >
            <tb.icon className="w-4 h-4" />
            {tb.label}
          </button>
        ))}
      </div>

      {/* Overview */}
      {tab === 'overview' && (
        <div className="space-y-6">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            <StatsCard title={t('dashboard.stats.total')} value={stats.total} icon={<Inbox className="w-6 h-6 text-primary" />} />
            <StatsCard title={t('dashboard.stats.pending')} value={stats.pending} icon={<ClipboardList className="w-6 h-6 text-amber-500" />} />
            <StatsCard title={t('dashboard.stats.approved')} value={stats.approved} icon={<CheckCircle2 className="w-6 h-6 text-emerald-500" />} />
            <StatsCard title={t('dashboard.stats.progress')} value={stats.in_progress} icon={<PlayCircle className="w-6 h-6 text-violet-500" />} />
            <StatsCard title={t('dashboard.stats.completed')} value={stats.completed} icon={<CheckCircle2 className="w-6 h-6 text-sky-500" />} />
            <StatsCard title={t('dashboard.stats.rejected')} value={stats.rejected} icon={<XCircle className="w-6 h-6 text-rose-500" />} />
          </div>

          <div className="card-static">
            <h3 className="font-bold text-primary-900 mb-4">{t('dashboard.requests')}</h3>
            <RequestsMini
              items={requests.slice(0, 5)}
              serviceLabel={serviceLabel}
              language={language}
              t={t}
              onView={setSelected}
            />
          </div>
        </div>
      )}

      {/* Requests — إدارة طلبات القبول */}
      {tab === 'requests' && (
        <div className="space-y-5">
          <div>
            <div className="title-rule">
              <h2 className="section-title !mb-0 !text-xl">{t('dashboard.admissions.title')}</h2>
            </div>
            <p className="text-ink-500 font-naskh text-sm">{t('dashboard.admissions.subtitle')}</p>
          </div>

          {/* Status filter chips with live counts */}
          <div className="flex flex-wrap gap-2">
            {[
              { key: 'all', count: stats.total },
              { key: 'pending', count: stats.pending },
              { key: 'approved', count: stats.approved },
              { key: 'in_progress', count: stats.in_progress },
              { key: 'completed', count: stats.completed },
              { key: 'rejected', count: stats.rejected },
            ].map((chip) => (
              <button
                key={chip.key}
                onClick={() => setStatusFilter(chip.key)}
                className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium border transition-all duration-150 ${
                  statusFilter === chip.key
                    ? 'bg-ink text-white border-ink shadow-panel'
                    : 'bg-white text-ink-600 border-[var(--line)] hover:border-primary hover:text-primary'
                }`}
              >
                {chip.key === 'all' ? t('dashboard.filter.all') : t(`status.${chip.key}`)}
                <span
                  className={`text-xs px-1.5 py-0.5 min-w-[1.5rem] text-center font-semibold ${
                    statusFilter === chip.key
                      ? 'bg-white/15 text-secondary-300'
                      : 'bg-ink-50 text-ink-500'
                  }`}
                >
                  {chip.count}
                </span>
              </button>
            ))}
          </div>

          {/* Search + service filter */}
          <div className="card-static !p-4 flex flex-col lg:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute top-1/2 -translate-y-1/2 start-3 text-slate-400" />
              <input
                className="input-field !ps-10"
                placeholder={t('dashboard.search')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <select
                className="input-field !py-2 lg:!w-56"
                value={serviceFilter}
                onChange={(e) => setServiceFilter(e.target.value)}
              >
                <option value="all">{t('dashboard.filter.service')}</option>
                {settings.services.map((s) => (
                  <option key={s.key} value={s.key}>
                    {language === 'ar' ? s.name : s.nameEn || s.name}
                  </option>
                ))}
              </select>
              {myServices?.length ? (
                <button
                  type="button"
                  onClick={() => setMineOnly((v) => !v)}
                  className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium border whitespace-nowrap transition-all duration-150 ${
                    mineOnly
                      ? 'bg-primary-700 text-white border-primary-700 shadow-brand'
                      : 'bg-white text-ink-600 border-[var(--line)] hover:border-primary-700 hover:text-primary-700'
                  }`}
                  title={t('dashboard.filter.mine')}
                >
                  <UserCheck className="w-4 h-4" />
                  {t('dashboard.filter.mine')}
                </button>
              ) : null}
            </div>
          </div>

          {/* Requests table */}
          <div className="card-static !p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-ink text-white">
                    <th className="p-3 font-medium text-start">{t('table.requestId')}</th>
                    <th className="p-3 font-medium text-start">{t('table.serviceType')}</th>
                    <th className="p-3 font-medium text-start">{t('table.title')}</th>
                    <th className="p-3 font-medium text-start">{t('table.requester')}</th>
                    <th className="p-3 font-medium text-start">{t('table.date')}</th>
                    <th className="p-3 font-medium text-start">{t('table.status')}</th>
                    <th className="p-3 font-medium text-start">{t('table.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={7} className="p-10 text-center">
                        <Inbox className="w-8 h-8 mx-auto mb-2 text-ink-300" />
                        <span className="text-ink-400">{t('dashboard.noRequests')}</span>
                      </td>
                    </tr>
                  )}
                  {filtered.map((r) => (
                    <tr
                      key={r.id}
                      className="border-t border-[var(--line)] hover:bg-primary-50/40 transition-colors"
                    >
                      <td className="p-3 font-mono text-xs text-primary-700 whitespace-nowrap" dir="ltr">
                        {r.trackingCode || r.id}
                      </td>
                      <td className="p-3 text-ink-600">{serviceLabel(r.serviceType)}</td>
                      <td className="p-3 font-semibold text-ink max-w-[220px] truncate">{r.title}</td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <span className="w-7 h-7 rounded-full bg-primary-50 text-primary-700 text-xs font-bold flex items-center justify-center shrink-0">
                            {r.requesterName?.trim().charAt(0) || '؟'}
                          </span>
                          <span className="text-ink-700 whitespace-nowrap">{r.requesterName}</span>
                        </div>
                      </td>
                      <td className="p-3 text-ink-500 whitespace-nowrap">
                        {formatDate(r.requestDate, language)}
                      </td>
                      <td className="p-3">
                        <StatusBadge status={r.status} />
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-1">
                          <button className="btn-ghost !p-2" onClick={() => setSelected(r)} title={t('dashboard.view')}>
                            <Eye className="w-4 h-4" />
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
                                changeStatus(
                                  r.id,
                                  r.status === 'approved' ? 'in_progress' : 'completed'
                                )
                              }
                              title={r.status === 'approved' ? t('dashboard.start') : t('dashboard.complete')}
                            >
                              <PlayCircle className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Venues */}
      {tab === 'venues' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="title-rule">
                <h2 className="section-title !mb-0 !text-xl">{t('venues.availability')}</h2>
              </div>
              <p className="text-ink-500 font-naskh text-sm">
                {language === 'ar' ? 'إدارة ومتابعة إشغال القاعات والمرافق (13 مرفقاً)' : 'Monitor facility occupancy (13 venues)'}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={venueCategoryFilter}
                onChange={(e) => setVenueCategoryFilter(e.target.value)}
                className="input-field !py-2 !px-3 text-xs bg-white font-semibold"
              >
                <option value="all">{language === 'ar' ? 'جميع المرافق (13)' : 'All Facilities (13)'}</option>
                <option value="auditorium">{language === 'ar' ? 'المسارح الكبرى' : 'Auditoriums'}</option>
                <option value="exhibition">{language === 'ar' ? 'المعارض والبهو' : 'Exhibition'}</option>
                <option value="vip">{language === 'ar' ? 'أجنحة VIP' : 'VIP'}</option>
                <option value="tiered">{language === 'ar' ? 'القاعات المدرجة' : 'Tiered'}</option>
                <option value="workshop">{language === 'ar' ? 'ورش العمل' : 'Workshops'}</option>
                <option value="meeting">{language === 'ar' ? 'قاعات الاجتماعات' : 'Meetings'}</option>
              </select>
            </div>
          </div>

          <div className="card-static overflow-x-auto bg-white border border-[var(--line)] rounded-xl shadow-xs">
            <table className="min-w-full text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="p-3 text-start font-bold text-slate-700 min-w-[190px] sticky start-0 bg-slate-50 z-10 border-e border-slate-200">
                    {language === 'ar' ? 'المرفق / القاعة' : 'Venue / Hall'}
                  </th>
                  {days.map((d) => (
                    <th key={d} className="p-2 text-center text-slate-600 whitespace-nowrap min-w-[70px]">
                      {formatDate(d, language)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {dashboardVenues
                  .filter((v) => venueCategoryFilter === 'all' || v.category === venueCategoryFilter)
                  .map((v) => (
                    <tr key={v.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="p-2.5 font-semibold text-slate-800 sticky start-0 bg-white border-e border-slate-200 z-10">
                        <div className="font-bold text-ink-900">{language === 'ar' ? v.nameAr : v.nameEn}</div>
                        <div className="text-[10px] text-slate-400 font-normal">{v.capacity} {t('venues.persons')} · {v.location}</div>
                      </td>
                      {days.map((d) => {
                        const booked = venueBookings[v.id]?.has(d);
                        return (
                          <td key={d} className="p-1 text-center">
                            <span
                              className={`inline-block w-full py-1.5 px-1 rounded text-[10px] font-bold ${
                                booked
                                  ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              }`}
                            >
                              {booked ? t('venues.booked') : t('venues.available')}
                            </span>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
              </tbody>
            </table>
            <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
              <span>{t('venues.legend')}</span>
              <span>{t('venues.next14')}</span>
            </div>
          </div>
        </div>
      )}

      {/* Admins */}
      {tab === 'admins' && (
        <div className="space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
            <div>
              <div className="title-rule">
                <h2 className="section-title !mb-0 !text-xl">{t('dashboard.admins')}</h2>
              </div>
              <p className="text-ink-500 font-naskh text-sm">{t('dashboard.admins.subtitle')}</p>
            </div>
            <button
              className="btn-primary shrink-0"
              onClick={() => {
                setAdminError('');
                setAdminModalOpen(true);
              }}
            >
              <UserPlus className="w-4 h-4" />
              {t('admins.add')}
            </button>
          </div>

          {adminError && !adminModalOpen && (
            <div className="bg-rose-50 text-rose-700 border border-rose-100 rounded-xl px-4 py-3 text-sm">
              {adminError}
            </div>
          )}

          <div className="card-static !p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-ink text-white">
                    <th className="p-3 font-medium text-start">{t('admins.username')}</th>
                    <th className="p-3 font-medium text-start">{t('admins.department')}</th>
                    <th className="p-3 font-medium text-start">{t('admins.services')}</th>
                    <th className="p-3 font-medium text-start">{t('admins.status')}</th>
                    <th className="p-3 font-medium text-start">{t('admins.created')}</th>
                    <th className="p-3 font-medium text-start">{t('table.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {admins.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-10 text-center">
                        <ShieldCheck className="w-8 h-8 mx-auto mb-2 text-ink-300" />
                        <span className="text-ink-400">{t('admins.empty')}</span>
                      </td>
                    </tr>
                  )}
                  {admins.map((a) => {
                    const isSelf = a.id === user?.id;
                    return (
                      <tr
                        key={a.id}
                        className="border-t border-[var(--line)] hover:bg-primary-50/40 transition-colors"
                      >
                        <td className="p-3">
                          <div className="flex items-center gap-3">
                            <span className="w-9 h-9 rounded-full bg-ink text-secondary-300 flex items-center justify-center font-bold shrink-0">
                              {(a.name || a.username).charAt(0).toUpperCase()}
                            </span>
                            <div className="min-w-0">
                              <div className="font-semibold text-ink flex items-center gap-2">
                                {a.name || a.username}
                                {isSelf && (
                                  <span className="text-[10px] px-1.5 py-0.5 bg-primary-50 text-primary-700 border border-primary-100">
                                    {t('admins.you')}
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-ink-400" dir="ltr">
                                {a.username} · {a.email}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="p-3 text-ink-600 whitespace-nowrap">{a.department || '—'}</td>
                        <td className="p-3">
                          {a.services?.length ? (
                            <div className="flex flex-wrap gap-1 max-w-[240px]">
                              {a.services.map((k) => (
                                <span
                                  key={k}
                                  className="text-[10px] font-medium bg-primary-50 text-primary-700 px-1.5 py-0.5 border border-primary-100 whitespace-nowrap"
                                >
                                  {serviceLabel(k)}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-xs text-ink-300">{t('admins.allServices')}</span>
                          )}
                        </td>
                        <td className="p-3">
                          <span className={a.active ? 'badge-approved' : 'badge-cancelled'}>
                            {a.active ? t('admins.active') : t('admins.inactive')}
                          </span>
                        </td>
                        <td className="p-3 text-ink-500 whitespace-nowrap">
                          {formatDate(a.createdAt.split('T')[0], language)}
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-1">
                            <button
                              className={`btn-ghost !p-2 ${
                                a.active
                                  ? 'text-amber-600 hover:!bg-amber-50'
                                  : 'text-emerald-600 hover:!bg-emerald-50'
                              } disabled:opacity-30 disabled:cursor-not-allowed`}
                              title={a.active ? t('admins.disable') : t('admins.enable')}
                              onClick={() => toggleAdminActive(a)}
                              disabled={isSelf}
                            >
                              <Power className="w-4 h-4" />
                            </button>
                            <button
                              className="btn-ghost !p-2 text-rose-600 hover:!bg-rose-50 disabled:opacity-30 disabled:cursor-not-allowed"
                              title={t('admins.delete')}
                              onClick={() => removeAdmin(a)}
                              disabled={isSelf}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
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

      {/* Settings */}
      {tab === 'settings' && (
        <div className="space-y-6">
          <div className="card-static">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-primary-900">{t('settings.services')}</h3>
              <button
                className="btn-primary text-sm py-2"
                onClick={() => {
                  const key = prompt(language === 'ar' ? 'معرف الخدمة (EN)' : 'Service key (EN)');
                  const name = prompt(language === 'ar' ? 'اسم الخدمة' : 'Service name');
                  if (key && name) {
                    setSettings((s) => ({
                      ...s,
                      services: [...s.services, { key, name, enabled: true }],
                    }));
                  }
                }}
              >
                + {t('settings.add')}
              </button>
            </div>
            <div className="space-y-2">
              {settings.services.map((s) => (
                <div
                  key={s.key}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100"
                >
                  <div>
                    <div className="font-semibold text-slate-800">{s.name}</div>
                    <div className="text-xs text-slate-400 font-mono">{s.key}</div>
                  </div>
                  <label className="inline-flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      className="accent-primary w-4 h-4"
                      checked={s.enabled}
                      onChange={() =>
                        setSettings((prev) => ({
                          ...prev,
                          services: prev.services.map((x) =>
                            x.key === s.key ? { ...x, enabled: !x.enabled } : x
                          ),
                        }))
                      }
                    />
                    {s.enabled ? t('settings.enabled') : t('settings.disabled')}
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div className="card-static">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-primary-900">{t('settings.colleges')}</h3>
              <button
                className="btn-outline text-sm py-2"
                onClick={() => {
                  const name = prompt(language === 'ar' ? 'اسم الكلية' : 'College name');
                  if (name) {
                    setSettings((s) => ({
                      ...s,
                      colleges: [
                        ...s.colleges,
                        { id: Date.now().toString(), name, enabled: true, departments: [] },
                      ],
                    }));
                  }
                }}
              >
                + {t('settings.add')}
              </button>
            </div>
            <div className="space-y-3">
              {settings.colleges.map((c) => (
                <div key={c.id} className="p-3 rounded-xl border border-slate-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold">{c.name}</span>
                    <div className="flex gap-2">
                      <button
                        className="text-xs text-primary"
                        onClick={() => {
                          const name = prompt(language === 'ar' ? 'اسم القسم' : 'Department name');
                          if (name) {
                            setSettings((s) => ({
                              ...s,
                              colleges: s.colleges.map((x) =>
                                x.id === c.id
                                  ? {
                                      ...x,
                                      departments: [
                                        ...x.departments,
                                        { id: Date.now().toString(), name, enabled: true },
                                      ],
                                    }
                                  : x
                              ),
                            }));
                          }
                        }}
                      >
                        + {t('form.dept')}
                      </button>
                      <label className="text-xs flex items-center gap-1">
                        <input
                          type="checkbox"
                          className="accent-primary"
                          checked={c.enabled}
                          onChange={() =>
                            setSettings((s) => ({
                              ...s,
                              colleges: s.colleges.map((x) =>
                                x.id === c.id ? { ...x, enabled: !x.enabled } : x
                              ),
                            }))
                          }
                        />
                        {t('settings.enabled')}
                      </label>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {c.departments.map((d) => (
                      <span key={d.id} className="text-xs bg-primary-50 text-primary-700 px-2 py-1 rounded-lg">
                        {d.name}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card-static">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-primary-900">{t('settings.external')}</h3>
              <button
                className="btn-outline text-sm py-2"
                onClick={() => {
                  const name = prompt(language === 'ar' ? 'اسم الجهة' : 'Entity name');
                  if (name) {
                    setSettings((s) => ({
                      ...s,
                      externalEntities: [
                        ...s.externalEntities,
                        { id: Date.now().toString(), name, enabled: true },
                      ],
                    }));
                  }
                }}
              >
                + {t('settings.add')}
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {settings.externalEntities.map((e) => (
                <label
                  key={e.id}
                  className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl border text-sm cursor-pointer ${
                    e.enabled ? 'border-primary-200 bg-primary-50' : 'border-slate-200 bg-slate-50 opacity-60'
                  }`}
                >
                  <input
                    type="checkbox"
                    className="accent-primary"
                    checked={e.enabled}
                    onChange={() =>
                      setSettings((s) => ({
                        ...s,
                        externalEntities: s.externalEntities.map((x) =>
                          x.id === e.id ? { ...x, enabled: !x.enabled } : x
                        ),
                      }))
                    }
                  />
                  {e.name}
                </label>
              ))}
            </div>
          </div>

          <button onClick={saveSettings} className="btn-primary">
            {savedFlash ? t('settings.saved') : t('settings.save')}
          </button>
        </div>
      )}

      {/* Details modal */}
      <Modal
        isOpen={!!selected}
        onClose={() => setSelected(null)}
        title={t('request.details.title')}
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
              <StatusBadge status={selected.status} />
            </div>

            <h3 className="text-xl font-bold text-slate-800">{selected.title}</h3>
            <p className="text-slate-600 text-sm">{selected.description}</p>

            <div className="grid sm:grid-cols-2 gap-3 text-sm">
              <Detail label={t('table.serviceType')} value={serviceLabel(selected.serviceType)} />
              <Detail label={t('table.dates')} value={formatDateRange(selected.eventDates, language)} />
              <Detail label={t('form.name')} value={selected.requesterName} />
              <Detail label={t('form.email')} value={selected.requesterEmail} />
              <Detail label={t('form.phone')} value={selected.requesterPhone || '—'} />
              <Detail
                label={t('table.department')}
                value={
                  selected.requesterType === 'external'
                    ? selected.externalEntity || '—'
                    : selected.requesterDepartment?.split(':')[1] ||
                      selected.requesterDepartment ||
                      '—'
                }
              />
              {selected.venues?.length ? (
                <Detail
                  label={t('request.details.venues')}
                  value={selected.venues.map((v) => t(`venues.${v}`)).join(' · ')}
                />
              ) : null}
              <Detail label={t('request.details.notes')} value={selected.additionalNotes || '—'} />
            </div>

            <div>
              <h4 className="font-bold text-primary-900 mb-3">{t('request.details.history')}</h4>
              <div className="relative">
                {(selected.statusHistory || []).map((h, i, arr) => (
                  <div key={i} className="flex gap-3 pb-5 last:pb-0">
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-3 h-3 rounded-full ring-4 ring-white shrink-0 ${
                          i === arr.length - 1 ? 'bg-primary' : 'bg-secondary'
                        }`}
                      />
                      {i < arr.length - 1 && <div className="w-0.5 flex-1 bg-slate-200 mt-1" />}
                    </div>
                    <div className="-mt-0.5">
                      <div className="flex flex-wrap items-center gap-2 mb-0.5">
                        <StatusBadge status={h.status} />
                        <span className="text-xs text-slate-400">
                          {formatDate(h.changedAt.split('T')[0], language)}
                        </span>
                      </div>
                      <div className="text-sm text-slate-600">
                        {h.changedBy}
                        {h.note ? ` — ${h.note}` : ''}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="label">{t('dashboard.note')}</label>
              <textarea
                className="input-field min-h-[70px]"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>

            <div className="flex flex-wrap gap-2 items-center">
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
              {selected.status === 'approved' && (
                <button className="btn-secondary" onClick={() => changeStatus(selected.id, 'in_progress', note)}>
                  {t('dashboard.start')}
                </button>
              )}
              {selected.status === 'in_progress' && (
                <button className="btn-primary" onClick={() => changeStatus(selected.id, 'completed', note)}>
                  {t('dashboard.complete')}
                </button>
              )}
              {(selected.serviceType === 'theater' || (selected.venues && selected.venues.length > 0)) && (
                <button
                  className="px-3 py-2 bg-secondary-50 text-secondary-900 border border-secondary/30 rounded-md text-sm font-semibold flex items-center gap-1.5 hover:bg-secondary-100 transition-colors"
                  onClick={() => setContractModalRequest(selected)}
                >
                  <FileText className="w-4 h-4 text-secondary-700" />
                  <span>{language === 'ar' ? 'عرض / طباعة العقد الإلكتروني' : 'View / Print Contract'}</span>
                </button>
              )}
              <button className="btn-ghost" onClick={() => setSelected(null)}>
                {t('common.close')}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Add admin modal */}
      <Modal
        isOpen={adminModalOpen}
        onClose={() => setAdminModalOpen(false)}
        title={t('admins.add')}
        size="md"
      >
        <form onSubmit={handleAddAdmin} className="space-y-4">
          {adminError && (
            <div className="bg-rose-50 text-rose-700 border border-rose-100 rounded-xl px-4 py-3 text-sm">
              {adminError}
            </div>
          )}
          <div>
            <label className="label">{t('admins.name')}</label>
            <input
              className="input-field"
              value={adminForm.name}
              onChange={(e) => setAdminForm({ ...adminForm, name: e.target.value })}
              placeholder={language === 'ar' ? 'مثال: أ. محمد العتيبي' : 'e.g. John Smith'}
            />
          </div>
          <div>
            <label className="label">{t('admins.username')}</label>
            <input
              className="input-field"
              value={adminForm.username}
              onChange={(e) => setAdminForm({ ...adminForm, username: e.target.value })}
              required
              dir="ltr"
              autoComplete="off"
            />
          </div>
          <div>
            <label className="label">{t('admins.email')}</label>
            <input
              type="email"
              className="input-field"
              value={adminForm.email}
              onChange={(e) => setAdminForm({ ...adminForm, email: e.target.value })}
              required
              dir="ltr"
              autoComplete="off"
            />
          </div>
          <div>
            <label className="label">{t('admins.password')}</label>
            <input
              type="text"
              className="input-field font-mono"
              value={adminForm.password}
              onChange={(e) => setAdminForm({ ...adminForm, password: e.target.value })}
              required
              dir="ltr"
              autoComplete="new-password"
            />
          </div>
          <div>
            <label className="label">{t('admins.department')}</label>
            <input
              className="input-field"
              value={adminForm.department}
              onChange={(e) => setAdminForm({ ...adminForm, department: e.target.value })}
            />
          </div>
          <div className="flex gap-2 justify-end pt-1">
            <button type="button" className="btn-ghost" onClick={() => setAdminModalOpen(false)}>
              {t('common.close')}
            </button>
            <button type="submit" className="btn-primary">
              <UserPlus className="w-4 h-4" />
              {t('admins.add')}
            </button>
          </div>
        </form>
      </Modal>

      {/* Electronic Contract Modal */}
      <ElectronicContractModal
        isOpen={!!contractModalRequest}
        onClose={() => setContractModalRequest(null)}
        request={contractModalRequest}
      />
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
      <div className="text-[11px] text-slate-400 mb-0.5">{label}</div>
      <div className="font-medium text-slate-700 break-words">{value}</div>
    </div>
  );
}

function RequestsMini({
  items,
  serviceLabel,
  language,
  t,
  onView,
}: {
  items: ServiceRequest[];
  serviceLabel: (k: string) => string;
  language: string;
  t: (k: string) => string;
  onView: (r: ServiceRequest) => void;
}) {
  if (!items.length) {
    return <p className="text-slate-400 text-sm">{t('dashboard.noRequests')}</p>;
  }
  return (
    <div className="space-y-2">
      {items.map((r) => (
        <button
          key={r.id}
          onClick={() => onView(r)}
          className="w-full flex items-center justify-between gap-3 p-3 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-100 text-start transition-all"
        >
          <div className="min-w-0">
            <div className="font-semibold text-slate-800 truncate">{r.title}</div>
            <div className="text-xs text-slate-400">
              {serviceLabel(r.serviceType)} · {r.requesterName} · {formatDate(r.requestDate, language)}
            </div>
          </div>
          <StatusBadge status={r.status} />
        </button>
      ))}
    </div>
  );
}
