import { useState } from 'react';
import {
  Check,
  GripVertical,
  Plus,
  Save,
  ScrollText,
  Trash2,
} from 'lucide-react';
import type { BookingRule, BookingRulesConfig } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { getSystemSettings, saveSystemSettings } from '../utils/storage';
import { DEFAULT_BOOKING_RULES } from '../data/defaults';

/** محرر ضوابط وإجراءات حجز مرافق المركز — متاح لمدير المركز ومدير النظام */
export default function BookingRulesEditor() {
  const { language } = useLanguage();
  const isAr = language === 'ar';
  const [cfg, setCfg] = useState<BookingRulesConfig>(
    () => getSystemSettings().bookingRules || DEFAULT_BOOKING_RULES
  );
  const [saved, setSaved] = useState(false);
  const [editAr, setEditAr] = useState(false);

  const save = () => {
    const s = getSystemSettings();
    saveSystemSettings({ ...s, bookingRules: cfg });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const patchRule = (id: string, patch: Partial<BookingRule>) =>
    setCfg((c) => ({
      ...c,
      rules: c.rules.map((r) => (r.id === id ? { ...r, ...patch } : r)),
    }));

  const removeRule = (id: string) =>
    setCfg((c) => ({ ...c, rules: c.rules.filter((r) => r.id !== id) }));

  const addRule = () =>
    setCfg((c) => ({
      ...c,
      rules: [
        ...c.rules,
        { id: `r_${Date.now().toString(36)}`, ar: '', en: '', enabled: true },
      ],
    }));

  const move = (id: string, dir: -1 | 1) =>
    setCfg((c) => {
      const idx = c.rules.findIndex((r) => r.id === id);
      const j = idx + dir;
      if (idx < 0 || j < 0 || j >= c.rules.length) return c;
      const rules = [...c.rules];
      [rules[idx], rules[j]] = [rules[j], rules[idx]];
      return { ...c, rules };
    });

  return (
    <div className="space-y-5">
      {/* المعاملات الرقمية */}
      <div className="card-static">
        <h3 className="font-bold text-primary-900 mb-4 flex items-center gap-2">
          <ScrollText className="w-5 h-5" />
          {isAr ? 'ضوابط الحجز — القيود الزمنية' : 'Booking Rules — Time Constraints'}
        </h3>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <label className="label">{isAr ? 'نافذة قبول المواعيد (يوم)' : 'Advance booking window (days)'}</label>
            <input
              type="number"
              min={1}
              max={365}
              className="input-field"
              dir="ltr"
              value={cfg.maxAdvanceDays}
              onChange={(e) =>
                setCfg((c) => ({ ...c, maxAdvanceDays: Math.max(1, Number(e.target.value) || 1) }))
              }
            />
            <p className="text-[11px] text-slate-400 mt-1.5">
              {isAr
                ? 'لا يقبل النظام مواعيد تتجاوز هذا العدد من الأيام من تاريخ التقديم.'
                : 'Dates beyond this many days from submission are rejected.'}
            </p>
          </div>
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <label className="label">{isAr ? 'أقصى مدة حجز متصلة (يوم)' : 'Max consecutive booking days'}</label>
            <input
              type="number"
              min={0}
              max={30}
              className="input-field"
              dir="ltr"
              value={cfg.maxConsecutiveDays}
              onChange={(e) =>
                setCfg((c) => ({ ...c, maxConsecutiveDays: Math.max(0, Number(e.target.value) || 0) }))
              }
            />
            <p className="text-[11px] text-slate-400 mt-1.5">
              {isAr
                ? 'أقصى عدد أيام متصلة مسموح بها لكل طلب — صفر لتعطيل القيد.'
                : 'Max consecutive days per request — 0 disables the limit.'}
            </p>
          </div>
        </div>
      </div>

      {/* قائمة الضوابط */}
      <div className="card-static">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <h3 className="font-bold text-primary-900">
            {isAr ? 'نصوص الضوابط والإجراءات' : 'Rules & Procedures Text'}
          </h3>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setEditAr(!editAr)}
              className="btn-ghost text-xs border border-slate-200 rounded-md !py-1.5"
            >
              {editAr ? (isAr ? 'عرض الإنجليزية' : 'Show EN') : (isAr ? 'تعديل الإنجليزية' : 'Edit EN')}
            </button>
            <button onClick={addRule} className="btn-primary !py-1.5 text-xs flex items-center gap-1">
              <Plus className="w-3.5 h-3.5" />
              {isAr ? 'إضافة ضابط' : 'Add rule'}
            </button>
          </div>
        </div>
        <div className="space-y-2.5">
          {cfg.rules.map((r, i) => (
            <div
              key={r.id}
              className={`rounded-xl border p-3 transition-colors ${
                r.enabled ? 'bg-white border-slate-200' : 'bg-slate-50 border-slate-100 opacity-60'
              }`}
            >
              <div className="flex items-start gap-2">
                <div className="flex flex-col gap-0.5 pt-1">
                  <button
                    onClick={() => move(r.id, -1)}
                    disabled={i === 0}
                    className="text-slate-300 hover:text-primary-700 disabled:opacity-20 text-xs leading-none"
                  >
                    ▲
                  </button>
                  <GripVertical className="w-3.5 h-3.5 text-slate-300" />
                  <button
                    onClick={() => move(r.id, 1)}
                    disabled={i === cfg.rules.length - 1}
                    className="text-slate-300 hover:text-primary-700 disabled:opacity-20 text-xs leading-none"
                  >
                    ▼
                  </button>
                </div>
                <span className="w-6 h-6 rounded-full bg-primary-700 text-white text-[11px] font-bold flex items-center justify-center shrink-0 mt-1">
                  {i + 1}
                </span>
                <div className="flex-1 space-y-1.5">
                  <textarea
                    className="input-field !py-2 text-sm min-h-[56px]"
                    value={editAr ? r.en : r.ar}
                    onChange={(e) =>
                      patchRule(r.id, editAr ? { en: e.target.value } : { ar: e.target.value })
                    }
                    dir={editAr ? 'ltr' : 'rtl'}
                    placeholder={editAr ? 'English text' : 'نص الضابط بالعربية'}
                  />
                </div>
                <div className="flex flex-col items-center gap-1.5 pt-1">
                  <label className="cursor-pointer" title={isAr ? 'مفعّل' : 'Enabled'}>
                    <input
                      type="checkbox"
                      className="accent-primary w-4 h-4"
                      checked={r.enabled}
                      onChange={(e) => patchRule(r.id, { enabled: e.target.checked })}
                    />
                  </label>
                  <button
                    onClick={() => removeRule(r.id)}
                    className="text-rose-400 hover:text-rose-600 p-1"
                    title={isAr ? 'حذف' : 'Delete'}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
          {cfg.rules.length === 0 && (
            <p className="text-center text-sm text-slate-400 py-6">
              {isAr ? 'لا توجد ضوابط — أضف أول ضابط' : 'No rules yet'}
            </p>
          )}
        </div>
      </div>

      <button onClick={save} className="btn-primary w-full sm:w-auto flex items-center justify-center gap-2">
        {saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
        {saved ? (isAr ? 'تم الحفظ' : 'Saved') : (isAr ? 'حفظ ضوابط الحجز' : 'Save Booking Rules')}
      </button>
      <p className="text-[11px] text-slate-400">
        {isAr
          ? 'تُطبق الضوابط فوراً على معالج الحجز: القيود الزمنية تُفرض تلقائياً، والنصوص تُعرض لمقدم الطلب قبل بدء الحجز.'
          : 'Rules apply immediately: time constraints are enforced and texts are shown to requesters before booking.'}
      </p>
    </div>
  );
}
