import { useMemo, useState } from 'react';
import {
  Building2,
  Check,
  DollarSign,
  Edit3,
  Image as ImageIcon,
  MapPin,
  Plus,
  Power,
  PowerOff,
  Search,
  Star,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import type { CapacityByEventType, VenueCategory, VenueEventType, VenueInfo } from '../types';
import { useLanguage } from '../context/LanguageContext';
import {
  addStoredVenue,
  deleteStoredVenue,
  updateStoredVenue,
} from '../utils/storage';

const CATEGORIES: { id: VenueCategory; ar: string; en: string }[] = [
  { id: 'auditorium', ar: 'مسرح رئيسي', en: 'Auditorium' },
  { id: 'exhibition', ar: 'معرض / بهو', en: 'Exhibition' },
  { id: 'vip', ar: 'جناح VIP', en: 'VIP' },
  { id: 'tiered', ar: 'قاعة مدرجة', en: 'Tiered' },
  { id: 'workshop', ar: 'ورشة عمل', en: 'Workshop' },
  { id: 'meeting', ar: 'قاعة اجتماعات', en: 'Meeting' },
];

const EVENT_TYPES: { id: keyof CapacityByEventType; ar: string; en: string }[] = [
  { id: 'exam', ar: 'اختبار', en: 'Exam' },
  { id: 'workshop', ar: 'ورشة عمل', en: 'Workshop' },
  { id: 'lecture', ar: 'محاضرة', en: 'Lecture' },
  { id: 'conference', ar: 'مؤتمر', en: 'Conference' },
  { id: 'ceremony', ar: 'حفل', en: 'Ceremony' },
  { id: 'exhibition', ar: 'معرض', en: 'Exhibition' },
  { id: 'meeting', ar: 'اجتماع', en: 'Meeting' },
  { id: 'other', ar: 'أخرى', en: 'Other' },
];

interface Props {
  venues: VenueInfo[];
  onChanged: () => void;
}

const emptyVenue = (): VenueInfo => ({
  id: `v_${Date.now().toString(36)}`,
  nameAr: '',
  nameEn: '',
  category: 'meeting',
  capacity: 50,
  capacityByEventType: {},
  location: '',
  floor: '',
  area: '',
  amenities: [],
  features: [],
  image: '',
  hourlyRate: undefined,
  dailyRate: undefined,
  enabled: true,
});

export default function VenueManagementTab({ venues, onChanged }: Props) {
  const { language } = useLanguage();
  const isAr = language === 'ar';

  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('all');
  const [editing, setEditing] = useState<VenueInfo | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [amenitiesText, setAmenitiesText] = useState('');
  const [featuresText, setFeaturesText] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<VenueInfo | null>(null);
  const [err, setErr] = useState('');

  const catLabel = (id: string) => {
    const c = CATEGORIES.find((x) => x.id === id);
    return c ? (isAr ? c.ar : c.en) : id;
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return venues.filter((v) => {
      if (catFilter !== 'all' && v.category !== catFilter) return false;
      if (!q) return true;
      return (
        v.nameAr.toLowerCase().includes(q) ||
        v.nameEn.toLowerCase().includes(q) ||
        v.location?.toLowerCase().includes(q) ||
        v.id.toLowerCase().includes(q)
      );
    });
  }, [venues, search, catFilter]);

  const openEdit = (v: VenueInfo) => {
    setEditing({ ...v });
    setIsNew(false);
    setAmenitiesText((v.amenities || []).join('، '));
    setFeaturesText((v.features || []).join('، '));
    setErr('');
  };

  const openNew = () => {
    setEditing(emptyVenue());
    setIsNew(true);
    setAmenitiesText('');
    setFeaturesText('');
    setErr('');
  };

  const toggleEnabled = (v: VenueInfo) => {
    updateStoredVenue(v.id, { enabled: v.enabled === false });
    onChanged();
  };

  const save = () => {
    if (!editing) return;
    if (!editing.nameAr.trim()) {
      setErr(isAr ? 'أدخل اسم القاعة بالعربية' : 'Arabic name is required');
      return;
    }
    if (!editing.location?.trim()) {
      setErr(isAr ? 'أدخل الموقع' : 'Location is required');
      return;
    }
    const splitList = (s: string) =>
      s.split(/[،,\n]/).map((x) => x.trim()).filter(Boolean);
    const venue: VenueInfo = {
      ...editing,
      nameAr: editing.nameAr.trim(),
      nameEn: editing.nameEn?.trim() || editing.nameAr.trim(),
      amenities: splitList(amenitiesText),
      features: splitList(featuresText),
      capacityByEventType: Object.fromEntries(
        Object.entries(editing.capacityByEventType || {}).filter(
          ([, val]) => val !== undefined && val !== '' && val !== null
        )
      ) as CapacityByEventType,
    };
    if (isNew) addStoredVenue(venue);
    else updateStoredVenue(venue.id, venue);
    setEditing(null);
    onChanged();
  };

  const doDelete = () => {
    if (!confirmDelete) return;
    deleteStoredVenue(confirmDelete.id);
    setConfirmDelete(null);
    onChanged();
  };

  const setCap = (et: VenueEventType, val: string) => {
    if (!editing) return;
    setEditing({
      ...editing,
      capacityByEventType: {
        ...(editing.capacityByEventType || {}),
        [et]: val === '' ? undefined : isNaN(Number(val)) ? val : Number(val),
      },
    });
  };

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="card-static !p-4 flex flex-col lg:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute top-1/2 -translate-y-1/2 start-3 text-slate-400" />
          <input
            className="input-field !ps-10"
            placeholder={isAr ? 'بحث باسم القاعة أو الموقع...' : 'Search venue name or location...'}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="input-field !py-2 lg:!w-52"
          value={catFilter}
          onChange={(e) => setCatFilter(e.target.value)}
        >
          <option value="all">{isAr ? 'كل الفئات' : 'All categories'}</option>
          {CATEGORIES.map((c) => (
            <option key={c.id} value={c.id}>{isAr ? c.ar : c.en}</option>
          ))}
        </select>
        <button
          onClick={openNew}
          className="btn-primary !py-2 flex items-center gap-1.5 whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          {isAr ? 'إضافة قاعة' : 'Add Venue'}
        </button>
      </div>

      {/* Venues grid */}
      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((v) => (
          <div
            key={v.id}
            className={`card-static !p-0 overflow-hidden group ${v.enabled === false ? 'opacity-60' : ''}`}
          >
            <div className="h-28 relative bg-slate-100">
              {v.image ? (
                <img src={v.image} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-300">
                  <ImageIcon className="w-8 h-8" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <span className="absolute top-2 start-2 text-[10px] font-bold px-2 py-0.5 rounded-full bg-black/50 text-white">
                {catLabel(v.category)}
              </span>
              {v.enabled === false && (
                <span className="absolute top-2 end-2 text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-600 text-white">
                  {isAr ? 'موقوفة' : 'Disabled'}
                </span>
              )}
              <div className="absolute bottom-2 start-2 end-2 text-white">
                <div className="font-bold text-sm truncate">{isAr ? v.nameAr : v.nameEn}</div>
                <div className="text-[10px] text-white/80 flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {v.location}
                  {v.floor ? ` · ${v.floor}` : ''}
                </div>
              </div>
            </div>
            <div className="p-3">
              <div className="flex items-center justify-between text-[11px] text-slate-500 mb-3">
                <span className="flex items-center gap-1 font-semibold text-primary-700">
                  <Users className="w-3.5 h-3.5" />
                  {v.capacity} {isAr ? 'شخص' : 'seats'}
                </span>
                <span className="flex items-center gap-1 font-mono" dir="ltr">
                  <DollarSign className="w-3.5 h-3.5" />
                  {v.hourlyRate ? `${v.hourlyRate}/h` : '—'}
                  {v.dailyRate ? ` · ${v.dailyRate}/d` : ''}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => openEdit(v)}
                  className="flex-1 btn-outline !py-1.5 text-xs flex items-center justify-center gap-1"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  {isAr ? 'تعديل' : 'Edit'}
                </button>
                <button
                  onClick={() => toggleEnabled(v)}
                  title={v.enabled === false ? (isAr ? 'تفعيل' : 'Enable') : (isAr ? 'إيقاف' : 'Disable')}
                  className={`btn-ghost !p-2 ${
                    v.enabled === false ? 'text-emerald-600 hover:!bg-emerald-50' : 'text-amber-600 hover:!bg-amber-50'
                  }`}
                >
                  {v.enabled === false ? <Power className="w-4 h-4" /> : <PowerOff className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => setConfirmDelete(v)}
                  title={isAr ? 'حذف' : 'Delete'}
                  className="btn-ghost !p-2 text-rose-500 hover:!bg-rose-50"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-full card-static text-center text-slate-400 py-10">
            <Building2 className="w-8 h-8 mx-auto mb-2 text-slate-300" />
            {isAr ? 'لا توجد قاعات مطابقة' : 'No venues match'}
          </div>
        )}
      </div>

      {/* ===== Edit / Add modal ===== */}
      {editing && (
        <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-[var(--line)] overflow-hidden flex flex-col max-h-[92vh]">
            <div className="p-5 bg-gradient-to-r from-ink to-primary-800 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center border border-white/20">
                  <Building2 className="w-5 h-5 text-secondary-300" />
                </div>
                <div>
                  <h3 className="font-bold text-base">
                    {isNew ? (isAr ? 'إضافة قاعة جديدة' : 'Add New Venue') : (isAr ? 'تعديل بيانات القاعة' : 'Edit Venue')}
                  </h3>
                  {!isNew && <p className="text-xs text-white/70 font-mono" dir="ltr">{editing.id}</p>}
                </div>
              </div>
              <button onClick={() => setEditing(null)} className="p-1.5 text-white hover:bg-white/20 rounded-md">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto text-sm">
              {err && (
                <div className="bg-rose-50 text-rose-700 border border-rose-200 rounded-xl px-3 py-2 text-xs font-semibold">
                  {err}
                </div>
              )}

              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="label">{isAr ? 'الاسم بالعربية *' : 'Arabic name *'}</label>
                  <input
                    className="input-field"
                    value={editing.nameAr}
                    onChange={(e) => setEditing({ ...editing, nameAr: e.target.value })}
                  />
                </div>
                <div>
                  <label className="label">{isAr ? 'الاسم بالإنجليزية' : 'English name'}</label>
                  <input
                    className="input-field"
                    dir="ltr"
                    value={editing.nameEn}
                    onChange={(e) => setEditing({ ...editing, nameEn: e.target.value })}
                  />
                </div>
                <div>
                  <label className="label">{isAr ? 'الفئة' : 'Category'}</label>
                  <select
                    className="input-field"
                    value={editing.category}
                    onChange={(e) => setEditing({ ...editing, category: e.target.value as VenueCategory })}
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c.id} value={c.id}>{isAr ? c.ar : c.en}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">{isAr ? 'السعة الافتراضية *' : 'Default capacity *'}</label>
                  <input
                    type="number"
                    min={1}
                    className="input-field"
                    dir="ltr"
                    value={editing.capacity}
                    onChange={(e) => setEditing({ ...editing, capacity: Number(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <label className="label">{isAr ? 'الموقع *' : 'Location *'}</label>
                  <input
                    className="input-field"
                    value={editing.location}
                    onChange={(e) => setEditing({ ...editing, location: e.target.value })}
                    placeholder={isAr ? 'مثال: مبنى المؤتمرات' : 'e.g. Convention Building'}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="label">{isAr ? 'الدور' : 'Floor'}</label>
                    <input
                      className="input-field"
                      value={editing.floor || ''}
                      onChange={(e) => setEditing({ ...editing, floor: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="label">{isAr ? 'المساحة' : 'Area'}</label>
                    <input
                      className="input-field"
                      value={editing.area || ''}
                      onChange={(e) => setEditing({ ...editing, area: e.target.value })}
                      placeholder="500 م²"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="label flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4" />
                  {isAr ? 'رابط الصورة' : 'Image URL'}
                </label>
                <input
                  className="input-field"
                  dir="ltr"
                  value={editing.image || ''}
                  onChange={(e) => setEditing({ ...editing, image: e.target.value })}
                  placeholder="https://..."
                />
                {editing.image && (
                  <img src={editing.image} alt="" className="mt-2 h-24 w-full object-cover rounded-lg border border-slate-200" />
                )}
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="label">{isAr ? 'السعر بالساعة (ر.س)' : 'Hourly rate (SAR)'}</label>
                  <input
                    type="number"
                    min={0}
                    className="input-field"
                    dir="ltr"
                    value={editing.hourlyRate ?? ''}
                    onChange={(e) =>
                      setEditing({ ...editing, hourlyRate: e.target.value === '' ? undefined : Number(e.target.value) })
                    }
                  />
                </div>
                <div>
                  <label className="label">{isAr ? 'السعر اليومي (ر.س)' : 'Daily rate (SAR)'}</label>
                  <input
                    type="number"
                    min={0}
                    className="input-field"
                    dir="ltr"
                    value={editing.dailyRate ?? ''}
                    onChange={(e) =>
                      setEditing({ ...editing, dailyRate: e.target.value === '' ? undefined : Number(e.target.value) })
                    }
                  />
                </div>
              </div>

              {/* السعة حسب نوع الفعالية */}
              <div className="rounded-xl border border-slate-200 p-4">
                <div className="label !mb-1 flex items-center gap-1.5">
                  <Star className="w-4 h-4 text-secondary-700" />
                  {isAr ? 'السعة حسب نوع الفعالية (اختياري)' : 'Capacity by event type (optional)'}
                </div>
                <p className="text-[11px] text-slate-400 mb-3">
                  {isAr
                    ? 'اترك الحقل فارغاً لاستخدام السعة الافتراضية. يمكن إدخال نطاق مثل 50-60.'
                    : 'Leave empty to use default capacity. Ranges like 50-60 allowed.'}
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {EVENT_TYPES.map((et) => (
                    <div key={et.id}>
                      <label className="text-[10px] text-slate-500 block mb-0.5">{isAr ? et.ar : et.en}</label>
                      <input
                        className="input-field !py-1.5 text-xs"
                        dir="ltr"
                        value={editing.capacityByEventType?.[et.id] ?? ''}
                        onChange={(e) => setCap(et.id, e.target.value)}
                        placeholder={String(editing.capacity)}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="label">{isAr ? 'المرافق والتجهيزات (افصل بفاصلة)' : 'Amenities (comma separated)'}</label>
                <textarea
                  className="input-field min-h-[60px]"
                  value={amenitiesText}
                  onChange={(e) => setAmenitiesText(e.target.value)}
                  placeholder={isAr ? 'شاشة عرض، نظام صوتي، ترجمة فورية...' : 'Projector, sound system...'}
                />
              </div>
              <div>
                <label className="label">{isAr ? 'مميزات القاعة (افصل بفاصلة)' : 'Features (comma separated)'}</label>
                <textarea
                  className="input-field min-h-[60px]"
                  value={featuresText}
                  onChange={(e) => setFeaturesText(e.target.value)}
                />
              </div>
              <div>
                <label className="label">{isAr ? 'ملاصقة لـ' : 'Adjacent to'}</label>
                <input
                  className="input-field"
                  value={editing.adjacentTo || ''}
                  onChange={(e) => setEditing({ ...editing, adjacentTo: e.target.value })}
                />
              </div>

              <label className="flex items-center gap-2 p-3 rounded-xl border border-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  className="accent-primary w-4 h-4"
                  checked={editing.enabled !== false}
                  onChange={(e) => setEditing({ ...editing, enabled: e.target.checked })}
                />
                <span className="text-sm font-semibold">
                  {isAr ? 'القاعة متاحة للحجز في الموقع' : 'Venue is bookable on the site'}
                </span>
              </label>
            </div>

            <div className="p-4 border-t border-slate-100 flex justify-end gap-2">
              <button onClick={() => setEditing(null)} className="btn-ghost text-sm">
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>
              <button onClick={save} className="btn-primary text-sm flex items-center gap-1.5">
                <Check className="w-4 h-4" />
                {isAr ? 'حفظ القاعة' : 'Save Venue'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== Delete confirm ===== */}
      {confirmDelete && (
        <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 text-center">
            <Trash2 className="w-10 h-10 text-rose-500 mx-auto mb-3" />
            <h3 className="font-bold text-ink-900 mb-1">
              {isAr ? 'حذف القاعة؟' : 'Delete venue?'}
            </h3>
            <p className="text-sm text-slate-500 mb-5">
              {isAr
                ? `سيتم حذف "${confirmDelete.nameAr}" نهائياً. الحجوزات السابقة لن تتأثر لكنها ستظهر بالمعرف القديم.`
                : `"${confirmDelete.nameEn}" will be permanently deleted.`}
            </p>
            <div className="flex gap-2 justify-center">
              <button onClick={() => setConfirmDelete(null)} className="btn-ghost text-sm">
                {isAr ? 'تراجع' : 'Cancel'}
              </button>
              <button
                onClick={doDelete}
                className="px-4 py-2 bg-rose-600 text-white rounded-lg text-sm font-bold hover:bg-rose-700"
              >
                {isAr ? 'حذف نهائي' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
