export type VenueType = string;

export type VenueCategory =
  | 'auditorium'
  | 'vip'
  | 'exhibition'
  | 'tiered'
  | 'workshop'
  | 'meeting';

/** نوع الفعالية المرتبط بالقاعة — يحدد السعة المسموحة */
export type VenueEventType =
  | 'exam'
  | 'workshop'
  | 'lecture'
  | 'conference'
  | 'ceremony'
  | 'exhibition'
  | 'meeting'
  | 'other';

/** السعة المسموح بها حسب نوع الفعالية لكل قاعة */
export interface CapacityByEventType {
  exam?: number;
  workshop?: number | string; // قد تكون نطاقاً مثل "50-60"
  lecture?: number;
  conference?: number;
  ceremony?: number;
  exhibition?: number;
  meeting?: number;
  other?: number;
}

export interface VenueInfo {
  id: VenueType;
  nameAr: string;
  nameEn: string;
  category: VenueCategory;
  capacity: number;
  /** السعة المسموح بها حسب نوع الفعالية (اختبار/ورشة عمل/محاضرة...) */
  capacityByEventType?: CapacityByEventType;
  area?: string;
  location: string;
  floor?: string;
  amenities: string[];
  features?: string[];
  image?: string;
  hourlyRate?: number;
  dailyRate?: number;
  adjacentTo?: string;
  enabled?: boolean;
}

export interface ServiceDefinition {
  key: string;
  name: string;
  nameEn?: string;
  description?: string;
  descriptionEn?: string;
  enabled: boolean;
  requiresVenue?: boolean;
  icon?: string;
}

export type ServiceType = string;

export interface DateRange {
  date: string;
  startTime: string;
  endTime: string;
}

export type RequestStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

export interface StatusHistory {
  status: RequestStatus;
  changedBy: string;
  changedAt: string;
  note?: string;
}

export interface ServiceRequest {
  id: string;
  trackingCode: string;
  serviceType: ServiceType;
  title: string;
  description: string;
  requestDate: string;
  eventDates: DateRange[];
  venues?: VenueType[];
  status: RequestStatus;
  statusHistory: StatusHistory[];
  requesterName: string;
  requesterEmail: string;
  requesterPhone?: string;
  requesterDepartment: string;
  requesterType: 'internal' | 'external';
  externalEntity?: string;
  additionalNotes?: string;
  adminNotes?: string;
  // ===== حقول النماذج الموسّعة (تُحفظ مع الطلب) =====
  venueEventType?: VenueEventType;
  newsDate?: string;
  publishingChannels?: string[];
  designLanguage?: 'ar' | 'en' | 'both';
  targetAudience?: 'students' | 'staff' | 'faculty' | 'external' | 'all';
  designCategory?: string;
  designLinks?: string;
  designLogos?: string[];
  workshopAttachments?: string[];
  designBrief?: string;
  otherEventType?: string;
  needsVenueBooking?: boolean;
  needsDocumentation?: boolean;
  documentationType?: 'photo' | 'video' | 'both';
  supportServices?: string[];
  expectedVisitors?: number;
  visitorGender?: 'male' | 'female' | 'both';
}

export interface College {
  id: string;
  name: string;
  nameEn?: string;
  enabled: boolean;
  departments: Department[];
}

export interface Department {
  id: string;
  name: string;
  nameEn?: string;
  enabled: boolean;
}

export interface ExternalEntity {
  id: string;
  name: string;
  enabled: boolean;
}

export interface ServiceFormData {
  venues?: VenueType[];
  serviceType: ServiceType;
  title: string;
  description: string;
  eventDates: DateRange[];
  requesterName: string;
  requesterEmail: string;
  requesterPhone?: string;
  requesterDepartment: string;
  requesterType: 'internal' | 'external';
  externalEntity?: string;
  additionalNotes?: string;
  // ===== حقول النماذج الموسّعة =====
  /** نوع الفعالية لحجز القاعات (اختبار/ورشة عمل/محاضرة...) */
  venueEventType?: VenueEventType;
  /** تاريخ الخبر مستقل عن تاريخ النشر (نموذج نشر خبر) */
  newsDate?: string;
  /** قنوات النشر المختارة (نموذج نشر خبر) — متعددة */
  publishingChannels?: string[];
  /** لغة التصميم المطلوبة (نماذج التصميم) */
  designLanguage?: 'ar' | 'en' | 'both';
  /** الفئة المستهدفة بالتصميم/الفعالية */
  targetAudience?: 'students' | 'staff' | 'faculty' | 'external' | 'all';
  /** نوع التصميم المطلوب (إعلان دورة/محاضرة/ورشة عمل...) */
  designCategory?: string;
  /** روابط يرغب مقدم الطلب بتضمينها في التصميم */
  designLinks?: string;
  /** الشعارات المطلوب إدراجها في التصميم */
  designLogos?: string[];
  /** مرفقات ورشة العمل (السيرة الذاتية/نبذة/صورة) — أسماء ملفات مرجعية */
  workshopAttachments?: string[];
  /** وصف التصميم/المحتوى المطلوب (مستقل عن وصف الورشة) */
  designBrief?: string;
  /** نص حر لنوع الفعالية عند اختيار "أخرى" (نموذج إقامة فعالية) */
  otherEventType?: string;
  /** طلب حجز قاعة ضمن نموذج الفعالية */
  needsVenueBooking?: boolean;
  /** طلب توثيق المناسبة */
  needsDocumentation?: boolean;
  /** نوع التوثيق المطلوب */
  documentationType?: 'photo' | 'video' | 'both';
  /** الخدمات المساندة لزيارة الوفد */
  supportServices?: string[]; // ['airport_reception','transport','hotel']
  /** العدد المتوقع للزوار */
  expectedVisitors?: number;
  /** الفئة المستهدفة من حيث الجنس */
  visitorGender?: 'male' | 'female' | 'both';
}

export interface SystemSettings {
  services: ServiceDefinition[];
  colleges: College[];
  externalEntities: ExternalEntity[];
  general?: {
    systemName: string;
    contactEmail: string;
    logoUrl: string;
    defaultLanguage: string;
  };
}
