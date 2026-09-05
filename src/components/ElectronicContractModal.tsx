import React from 'react';
import { FileText, Printer, CheckCircle, Shield, Building, DollarSign, Download, X } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import type { ServiceRequest } from '../types';

interface ElectronicContractModalProps {
  isOpen: boolean;
  onClose: () => void;
  request?: ServiceRequest | null;
  customData?: {
    clientName: string;
    entityName: string;
    entityType: string;
    phone: string;
    email: string;
    venueName: string;
    eventTitle: string;
    eventDate: string;
    duration: string;
    totalAmount: number;
    trackingCode: string;
  };
}

export default function ElectronicContractModal({
  isOpen,
  onClose,
  request,
  customData,
}: ElectronicContractModalProps) {
  const { language } = useLanguage();
  const isAr = language === 'ar';

  if (!isOpen) return null;

  const data = customData || {
    clientName: request?.requesterName || 'ممثّل الجهة المعتمد',
    entityName: request?.requesterDepartment || request?.externalEntity || 'جهة مستفيدة',
    entityType: request?.requesterType === 'internal' ? 'جهة داخلية (جامعة المعرفة)' : (request?.externalEntity || 'جهة خارجية متعاقدة'),
    phone: request?.requesterPhone || '05xxxxxxxx',
    email: request?.requesterEmail || 'client@example.com',
    venueName: request?.venues?.includes('theater') ? 'المسرح الرئيسي وقاعة المؤتمرات الكبرى' : (request?.venues?.includes('lobby') ? 'البهو الملكي وقاعة المعارض' : 'قاعة B2 والقاعات الذكية'),
    eventTitle: request?.title || 'فعالية / مؤتمر رسمي',
    eventDate: request?.eventDates?.[0]?.date || new Date().toISOString().split('T')[0],
    duration: 'يوم كامل (08:00 ص - 05:00 م)',
    totalAmount: 15000,
    trackingCode: request?.trackingCode || 'UM-DC-2026-001',
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-fadeIn print:p-0 print:bg-white">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full border border-[var(--line)] overflow-hidden flex flex-col max-h-[92vh] print:max-h-none print:shadow-none print:border-none">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-ink to-primary text-white flex items-center justify-between print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center border border-white/20">
              <FileText className="w-5 h-5 text-secondary-300" />
            </div>
            <div>
              <h3 className="font-bold text-base md:text-lg">
                {isAr ? 'العقد الإلكتروني الموحد لتأجير مرافق المركز' : 'Unified Facility Rental E-Contract'}
              </h3>
              <p className="text-xs text-white/70">
                {isAr ? 'مركز مؤتمرات وأعمال الدرعية — جامعة المعرفة' : 'Diriyah Conferences & Business Center — Almaarefa University'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 bg-white/15 hover:bg-white/25 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>{isAr ? 'طباعة / حفظ PDF' : 'Print / PDF'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-md transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Contract Content (Printable) */}
        <div className="p-6 sm:p-8 overflow-y-auto font-naskh text-ink-800 leading-relaxed space-y-6 text-sm" id="printable-contract">
          {/* Header of Contract */}
          <div className="border-b-2 border-secondary pb-5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <img src="/img/logo-um.png" alt="University Logo" className="h-14 w-auto object-contain" onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }} />
              <div>
                <h2 className="text-lg font-bold text-primary-900 font-sans">جامعة المعرفة — Almaarefa University</h2>
                <h1 className="text-base font-bold text-ink-900">مركز مؤتمرات وأعمال الدرعية (DCBC)</h1>
                <p className="text-xs text-ink-500">إدارة العلاقات العامة والتسويق واستثمار المرافق</p>
              </div>
            </div>
            <div className="text-end bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs font-sans">
              <div><span className="text-slate-500">رقم العقد:</span> <strong className="text-primary font-mono">{data.trackingCode}</strong></div>
              <div><span className="text-slate-500">تاريخ الإصدار:</span> {new Date().toLocaleDateString('ar-SA')}</div>
              <div><span className="text-slate-500">الحالة:</span> <span className="text-emerald-700 font-semibold">عقد إلكتروني موثق</span></div>
            </div>
          </div>

          {/* Contract Preamble */}
          <div className="bg-primary-50/50 p-4 rounded-lg border border-primary/20 text-xs md:text-sm">
            <h4 className="font-bold text-primary-900 mb-1 font-sans">مقدمة العقد والأطراف المتعاقدة:</h4>
            <p>
              بعون الله تعالى وتوفيقه، تم إبرام هذا العقد الإلكتروني بين كلٍ من:
              <br />
              <strong>الطرف الأول (المؤجر):</strong> مركز مؤتمرات وأعمال الدرعية — جامعة المعرفة، ويمثله إدارة العلاقات العامة والاتصال المؤسسي.
              <br />
              <strong>الطرف الثاني (المستأجر):</strong> {data.entityName} — ويمثله المفوض: <strong>{data.clientName}</strong> (جوال: <span dir="ltr">{data.phone}</span>، بريد: {data.email}).
            </p>
          </div>

          {/* Clause 1: Subject & Venue */}
          <div>
            <h4 className="font-bold text-primary-900 text-sm mb-2 flex items-center gap-2 font-sans">
              <Building className="w-4 h-4 text-secondary" />
              البند الأول: موضوع العقد والمرافق المؤجرة
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-100 text-xs">
              <div><strong className="text-slate-600">عنوان الفعالية:</strong> {data.eventTitle}</div>
              <div><strong className="text-slate-600">المرفق / القاعة المخصصة:</strong> {data.venueName}</div>
              <div><strong className="text-slate-600">تاريخ الفعالية:</strong> {data.eventDate}</div>
              <div><strong className="text-slate-600">الفترة الزمنية:</strong> {data.duration}</div>
            </div>
          </div>

          {/* Clause 2: Financial Obligations */}
          <div>
            <h4 className="font-bold text-primary-900 text-sm mb-2 flex items-center gap-2 font-sans">
              <DollarSign className="w-4 h-4 text-secondary" />
              البند الثاني: المقابل المالي وآلية السداد
            </h4>
            <p className="text-xs text-slate-700 mb-2">
              يلتزم الطرف الثاني بسداد المقابل المالي الإجمالي المعتمد والبالغ قدره:
              <strong className="text-primary font-bold text-sm px-2">{data.totalAmount.toLocaleString('ar-SA')} ر.س</strong>
              (شاملاً ضريبة القيمة المضافة 15% والتجهيزات الفنية الأساسية المذكورة)، وذلك عبر بوابة الدفع الإلكتروني المعتمدة أو التحويل للحساب البنكي الرسمي للجامعة قبل موعد الفعالية بـ 7 أيام عمل على الأقل.
            </p>
          </div>

          {/* Clause 3: Technical & Operational Terms */}
          <div>
            <h4 className="font-bold text-primary-900 text-sm mb-2 flex items-center gap-2 font-sans">
              <Shield className="w-4 h-4 text-secondary" />
              البند الثالث: التزامات التشغيل والدعم الفني
            </h4>
            <ul className="list-disc list-inside space-y-1 text-xs text-slate-600 ps-1">
              <li>يلتزم الطرف الأول بتهيئة القاعات بالأنظمة الصوتية والمرئية، التكييف، وشبكة الإنترنت، وتوفير فريق دعم فني طوال ساعات الفعالية.</li>
              <li>يلتزم الطرف الثاني بالمحافظة على مرافق وأصول المركز والتقيد بأنظمة الأمن والسلامة المعتمدة لدى الجامعة والدفاع المدني.</li>
              <li>أي خدمات إضافية كالتغطية التلفزيونية الخاصة، الترجمة الفورية، أو الضيافة الخارجية تخضع لموافقة إدارة المركز المسبقة.</li>
            </ul>
          </div>

          {/* Clause 4: Cancellation and SLA */}
          <div>
            <h4 className="font-bold text-primary-900 text-sm mb-1 font-sans">البند الرابع: الإلغاء والظروف الطارئة</h4>
            <p className="text-xs text-slate-600">
              يحق للطرف الثاني طلب تعديل الموعد أو الإلغاء مع استرداد الرسوم وفق سياسة الإلغاء المعتمدة للمركز قبل 10 أيام من موعد بدء الحجز.
            </p>
          </div>

          {/* Electronic Signatures */}
          <div className="pt-4 border-t border-slate-200 grid grid-cols-2 gap-6 text-center font-sans text-xs">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <div className="text-slate-500 mb-1">الطرف الأول (إدارة المركز)</div>
              <div className="font-bold text-ink-800">إدارة مركز مؤتمرات وأعمال الدرعية</div>
              <div className="mt-2 text-emerald-700 flex items-center justify-center gap-1 font-semibold text-[11px]">
                <CheckCircle className="w-3.5 h-3.5" />
                معتمد وموقع إلكترونياً
              </div>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <div className="text-slate-500 mb-1">الطرف الثاني (المستأجر / المستفيد)</div>
              <div className="font-bold text-ink-800">{data.clientName}</div>
              <div className="mt-2 text-emerald-700 flex items-center justify-center gap-1 font-semibold text-[11px]">
                <CheckCircle className="w-3.5 h-3.5" />
                تم التوثيق والموافقة بالنظام
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-[var(--line)] flex items-center justify-between print:hidden">
          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <Shield className="w-4 h-4 text-secondary" />
            <span>عقد رقمي موثق خاضع للائحة استثمار مرافق جامعة المعرفة</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="btn-primary text-xs !py-2 !px-4 flex items-center gap-1.5"
            >
              <Download className="w-4 h-4" />
              <span>تحميل العقد الموحد</span>
            </button>
            <button onClick={onClose} className="btn-ghost text-xs !py-2 !px-3">
              إغلاق
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
