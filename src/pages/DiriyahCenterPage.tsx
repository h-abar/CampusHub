import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Building2,
  Calendar,
  CheckCircle2,
  Eye,
  FileText,
  Globe,
  Layers,
  MapPin,
  Mic,
  Phone,
  ShieldCheck,
  Sparkles,
  Users,
  X,
  CreditCard,
  DollarSign,
  ArrowRight,
  ArrowLeft,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import ElectronicContractModal from '../components/ElectronicContractModal';

type GalleryCategory = 'all' | 'auditorium' | 'lobby' | 'meetings' | 'events';
type CalcDuration = 'half_day' | 'full_day' | 'multi_day';
type CalcEntity = 'gov' | 'private' | 'nonprofit' | 'internal';

const BASE_RATES: Record<string, { half_day: number; full_day: number }> = {
  theater: { half_day: 12000, full_day: 20000 },
  lobby: { half_day: 7000, full_day: 12000 },
  b2: { half_day: 4500, full_day: 7500 },
  all: { half_day: 20000, full_day: 35000 },
};

const ENTITY_DISCOUNTS: Record<CalcEntity, number> = {
  gov: 0.15, // 15% discount for government
  private: 0.0, // Standard private
  nonprofit: 0.25, // 25% discount for non-profit
  internal: 0.40, // 40% discount for university internal
};

interface VenueDetail {
  id: string;
  nameAr: string;
  nameEn: string;
  taglineAr: string;
  taglineEn: string;
  capacity: number;
  area: string;
  image: string;
  gallery: string[];
  specs: {
    ar: string[];
    en: string[];
  };
  suitableForAr: string[];
  suitableForEn: string[];
}

const DIRIYAH_VENUES: VenueDetail[] = [
  {
    id: 'theater',
    nameAr: 'قاعة الدرعية الكبرى (المسرح)',
    nameEn: 'Grand Diriyah Hall (Auditorium)',
    taglineAr: 'صرح استثنائي يتسع لـ 872 مقعداً مجهز بأرقى التقنيات للمؤتمرات الوزارية والاحتفالات الكبرى',
    taglineEn: 'Exceptional 872-seat auditorium with cutting-edge tech for ministerial conferences & grand ceremonies',
    capacity: 872,
    area: '1,100 م²',
    image: '/img/business-presentation.jpg',
    gallery: [
      '/img/business-presentation.jpg',
      '/img/hero-university.jpg',
      '/img/service-theater.jpg',
    ],
    specs: {
      ar: [
        'يتسع لـ 872 مقعداً: 702 بالمسرح الرئيسي (3 أقسام) + 170 بالشرفة المطلة على بهو الدور B1',
        'نظام صوتي متطور عالي الوضوح',
        'شاشة عرض بمساحة 18 متراً مربعاً (6 × 3م)',
        'كاونترات استقبال تتسع لـ 12 جهاز حاسب آلي مع مقاعد للجلوس',
        'مداخل خاصة لكبار الضيوف VIP وغرفة تحكم متكاملة',
        'كبائن مجهزة للترجمة الفورية لـ 4 لغات متزامنة',
        'مرافق داعمة ومساندة متكاملة وتصميم فاخر',
      ],
      en: [
        '872 seats: 702 main hall (3 sections) + 170 balcony facing B1 lobby',
        'Advanced high-definition digital sound system',
        '18 sqm main display screen (6 x 3m)',
        'Reception counters accommodating 12 PC workstations with seating',
        'Dedicated VIP entrances & master control room',
        'Simultaneous translation cabins for 4 languages',
        'Comprehensive support facilities & luxury finishes',
      ],
    },
    suitableForAr: ['المؤتمرات الوزارية والدولية', 'حفلات التخرج والافتتاح', 'الندوات العلمية والطبية', 'العروض المسرحية الكبرى'],
    suitableForEn: ['Ministerial & International Conferences', 'Graduation & Opening Ceremonies', 'Scientific & Medical Symposiums', 'Major Theatrical Shows'],
  },
  {
    id: 'vip_lounge',
    nameAr: 'غرفة كبار الضيوف VIP',
    nameEn: 'VIP Royal Lounge',
    taglineAr: 'جناح تشريفات ملكي فاخر بمدخل خاص ومباشر للمسرح الرئيسي',
    taglineEn: 'Luxury protocol suite with private entrance & direct access to auditorium stage',
    capacity: 40,
    area: '140 م²',
    image: '/img/business-meeting.jpg',
    gallery: [
      '/img/business-meeting.jpg',
      '/img/wall.jpg',
    ],
    specs: {
      ar: [
        'مدخل خاص ومستقل لكبار الضيوف',
        'تصميم فاخر يتسع لـ 40 مقعداً',
        'منطقة انتظار وخدمة مجاورة',
        'مدخل مباشر إلى المنطقة الأمامية للمسرح الرئيسي',
        'خدمات ضيافة خاصة وسريعة',
      ],
      en: [
        'Dedicated private entrance for dignitaries',
        'Luxury interior accommodating 40 VIP seats',
        'Adjacent reception, waiting & service area',
        'Direct doorway to the front section of the auditorium',
        'Executive protocol hospitality services',
      ],
    },
    suitableForAr: ['استقبال أصحاب المعالي والوزراء', 'الوفود الدولية الرسمية', 'كبار المتحدثين والرعاة'],
    suitableForEn: ['Ministerial & Dignitary Receptions', 'Official International Delegations', 'Keynote Speakers & VIPs'],
  },
  {
    id: 'lobby',
    nameAr: 'مركز المعارض والمؤتمرات (البهو الرئيسي)',
    nameEn: 'Exhibition & Conference Center (Main Lobby)',
    taglineAr: 'بهو رئيسي فسيح بمساحة 710 م² وسقف مرتفع و4 مداخل رئيسية',
    taglineEn: 'Spacious 710 sqm main exhibition lobby with high ceiling & 4 primary entrances',
    capacity: 450,
    area: '710 م²',
    image: '/img/campus-1.jpg',
    gallery: [
      '/img/campus-1.jpg',
      '/img/business-students.jpg',
      '/img/wall.jpg',
    ],
    specs: {
      ar: [
        'بهو رئيسي بمساحة إجمالية تبلغ 710 أمتار مربعة بسقف مرتفع',
        'يحتوي على 4 مداخل رئيسية',
        'مناسب لإقامة المعارض المصاحبة لأنشطة وفعاليات قاعة الدرعية الكبرى',
        'يحيط بمنطقة البهو 8 مصاعد (مصاعد VIP ومصاعد عامة)',
        'نقاط تزويد كهربائي وشبكات مستقلة لأجنحة العارضين',
      ],
      en: [
        '710 sqm total area with soaring high ceilings',
        '4 primary access gates & entrances',
        'Ideal for exhibitions alongside Grand Diriyah Hall events',
        'Surrounded by 8 elevators (including dedicated VIP elevators)',
        'Independent power and data lines for exhibitor booths',
      ],
    },
    suitableForAr: ['المعارض المصاحبة للمؤتمرات', 'أجنحة الرعاة والشركاء', 'حفلات الاستقبال الكبرى', 'معارض الابتكار والتوظيف'],
    suitableForEn: ['Concurrent Conference Expos', 'Sponsors & Partners Pavilions', 'Grand Networking Receptions', 'Innovation & Career Fairs'],
  },
  {
    id: 'b208_all',
    nameAr: 'قاعات ورش العمل B208 (A - B - C)',
    nameEn: 'Workshop Suites B208 (A - B - C)',
    taglineAr: '3 قاعات تفاعلية تسع 180 شخصاً مجتمعة ومجهزة بسبورات ذكية ومقاعد دراسية وطاولات مستديرة',
    taglineEn: '3 modular suites seating 180 combined, equipped with internet smart boards',
    capacity: 180,
    area: '320 م²',
    image: '/img/service-workshop.jpg',
    gallery: [
      '/img/service-workshop.jpg',
      '/img/business-students.jpg',
    ],
    specs: {
      ar: [
        'تتكون من ثلاث قاعات: A و B و C (تتسع كل قاعة لـ 60 مقعداً)',
        'القاعتان A و B مجهزتان بمقاعد دراسية',
        'القاعة C مجهزة بطاولات مستديرة للعمل التشاركي',
        'سبورة ذكية متصلة بالإنترنت في كل قاعة',
        'إمكانية فتح القاعات الثلاث متصلة لتصبح قاعة واحدة تتسع لـ 180 شخصاً',
        'مجاورة لقاعة الدرعية الكبرى (المسرح)',
      ],
      en: [
        'Composed of 3 halls: A, B & C (60 seats each)',
        'Halls A & B equipped with classroom seating',
        'Hall C equipped with round collaboration tables',
        'Internet-connected smart interactive board in each hall',
        'Option to merge all 3 halls into one unified 180-seat suite',
        'Directly adjacent to Grand Diriyah Auditorium',
      ],
    },
    suitableForAr: ['ورش العمل التفاعلية', 'الدورات التدريبية المتقدمة', 'جلسات العصف الذهني واللجان', 'الهاكاثونات'],
    suitableForEn: ['Interactive Workshops', 'Executive Training Courses', 'Brainstorming & Committee Sessions', 'Hackathons'],
  },
  {
    id: 'b203',
    nameAr: 'القاعات المدرجة B203 و B204',
    nameEn: 'Tiered Lecture Halls B203 & B204',
    taglineAr: 'قاعات مدرجة بسعة 88 مقعداً لكل قاعة مجهزة بسبورات ذكية للندوات والمحاضرات',
    taglineEn: 'Tiered halls (88 seats each) equipped with smart boards for seminars & lectures',
    capacity: 88,
    area: '160 م²',
    image: '/img/business-strategy.jpg',
    gallery: [
      '/img/business-strategy.jpg',
      '/img/business-meeting.jpg',
    ],
    specs: {
      ar: [
        'قاعات مدرجة بتصميم أكاديمي رفيع',
        'تتسع لـ 88 مقعداً',
        'مجهزة بسبورة ذكية متصلة بالإنترنت',
        'أنظمة صوت وعرض بروجكتر عالية الدقة',
        'مناسبة للندوات والمحاضرات العامة ومجاورة للمسرح الرئيسي',
      ],
      en: [
        'Tiered lecture hall design',
        'Capacity of 88 seats',
        'Equipped with internet-connected smart interactive boards',
        'High-resolution sound & projection systems',
        'Ideal for seminars & lectures, adjacent to Grand Hall',
      ],
    },
    suitableForAr: ['الندوات العلمية والطبية', 'المحاضرات العامة', 'الجلسات المتوازية للمؤتمرات'],
    suitableForEn: ['Scientific & Medical Seminars', 'Public Lectures', 'Conference Breakout Sessions'],
  },
];

const PACKAGES = [
  {
    id: 'platinum',
    nameAr: 'الباقة البلاتينية للمؤتمرات الكبرى',
    nameEn: 'Platinum Conference Package',
    badgeAr: 'الأكثر شمولاً',
    badgeEn: 'All-Inclusive',
    descAr: 'الحل الأمثل للفعاليات والمؤتمرات الضخمة التي تتطلب تكاملاً بين المسرح والمعرض والخدمات الإعلامية الكاملة.',
    descEn: 'The ultimate solution for major conferences requiring seamless integration of auditorium, exhibition & full media.',
    basePrice: 28000,
    featuresAr: [
      'حجز كامل للمسرح الرئيسي + البهو الملكي (يوم كامل)',
      'فريق تحكم صوتي ومرئي وفني متخصص على مدار الفعالية',
      'تجهيز الترجمة الفورية لـ لغتين طوال اليوم',
      'تغطية تلفزيونية وبث مباشر متعدد الكاميرات',
      'توثيق فوتوغرافي وفيديو سينمائي مع مونتاج هايلايت',
      'استخدام جناح كبار الشخصيات VIP للضيوف والمتحدثين',
    ],
    featuresEn: [
      'Full Grand Auditorium + Royal Lobby (Full Day)',
      'Dedicated A/V & technical operation team all day',
      'Simultaneous interpretation for 2 languages',
      'Multi-camera TV production & Live Streaming',
      'Cinematic photo/video documentation & highlight reel',
      'VIP Protocol Suite access for dignitaries & speakers',
    ],
  },
  {
    id: 'gold',
    nameAr: 'الباقة الذهبية للمعارض والملتقيات',
    nameEn: 'Gold Exhibition & Forum Package',
    badgeAr: 'الأكثر طلباً',
    badgeEn: 'Most Popular',
    descAr: 'مصممة خصيصاً للملتقيات، معارض التوظيف، وحفلات التكريم مع تجهيزات متكاملة للأجنحة والتغطية.',
    descEn: 'Designed specifically for forums, career fairs, and recognition events with booth setup & coverage.',
    basePrice: 18000,
    featuresAr: [
      'حجز البهو الملكي + مسرح القاعة الرئيسية (نصف يوم / 5 ساعات)',
      'تجهيز قواطع المعارض ونقاط الطاقة لـ 20 جناح',
      'تغطية إعلامية وتصوير فوتوغرافي احترافي',
      'شاشات رقمية تفاعلية لعرض شعارات الرعاة',
      'ضيافة واستقبال في البهو',
    ],
    featuresEn: [
      'Royal Lobby + Auditorium access (Half Day / 5 Hours)',
      'Exhibition partition & power setup for 20 booths',
      'Professional media coverage & photography',
      'Digital interactive sponsor display screens',
      'Welcome coffee & hospitality arrangement in lobby',
    ],
  },
  {
    id: 'executive',
    nameAr: 'باقة الأعمال وورش العمل التنفيذية',
    nameEn: 'Executive Business & Workshop',
    badgeAr: 'مرنة وسريعة',
    badgeEn: 'Flexible & Fast',
    descAr: 'مثالية للاجتماعات الاستراتيجية، جلسات مجالس الإدارة، والدورات التدريبية المتقدمة.',
    descEn: 'Ideal for strategic meetings, board sessions, and executive training seminars.',
    basePrice: 8500,
    featuresAr: [
      'حجز قاعة المؤتمرات B2 أو القاعات الذكية (يوم كامل)',
      'تجهيزات الاجتماعات الهجينة وشاشات العرض الذكية',
      'نظام ميكروفونات تفاعلية ودعم فني مخصص',
      'ضيافة أعمال مستمرة (قهوة وشاي ووجبات خفيفة)',
      'مواقف سيارات خاصة للمشاركين',
    ],
    featuresEn: [
      'Hall B2 / Smart Boardroom booking (Full Day)',
      'Hybrid meeting system & smart touch screens',
      'Interactive microphone system & dedicated technician',
      'Executive business hospitality (Coffee breaks & snacks)',
      'Reserved parking spaces for attendees',
    ],
  },
];

const EVENTS_NEWS = [
  {
    id: '1',
    titleAr: 'انعقاد المؤتمر الدولي للابتكار الطبي والتقنيات الصحية 2026',
    titleEn: 'International Medical Innovation & HealthTech Conference 2026',
    date: '12 مارس 2026',
    venueAr: 'المسرح الرئيسي والبهو الملكي',
    venueEn: 'Grand Auditorium & Royal Lobby',
    descAr: 'استضاف المركز أكثر من 600 خبير ومتحدث دولي لمناقشة أحدث تقنيات الذكاء الاصطناعي في الرعاية الصحية برعاية معالي وزير الصحة.',
    descEn: 'The center hosted 600+ international experts and dignitaries discussing AI in healthcare under ministerial patronage.',
    image: '/img/business-presentation.jpg',
  },
  {
    id: '2',
    titleAr: 'منتدى الدرعية السنوي لريادة الأعمال والاستثمار الجريء',
    titleEn: 'Diriyah Annual Entrepreneurship & VC Forum',
    date: '28 فبراير 2026',
    venueAr: 'قاعة B2 والبهو الملكي',
    venueEn: 'Hall B2 & Royal Lobby',
    descAr: 'ملتقى ريادي جمع أكثر من 40 شركة ناشئة وصناديق استثمارية مع ورش عمل تفاعلية وجلسات توقيع اتفاقيات استراتيجية.',
    descEn: 'Leading startup forum bringing together 40+ startups and investment funds with interactive deal-signing ceremonies.',
    image: '/img/business-strategy.jpg',
  },
  {
    id: '3',
    titleAr: 'ملتقى القيادات الأكاديمية والبحث العلمي',
    titleEn: 'Academic Leadership & Scientific Research Symposium',
    date: '15 فبراير 2026',
    venueAr: 'المسرح الرئيسي',
    venueEn: 'Grand Auditorium',
    descAr: 'جلسات عمل موسعة لتعزيز الشراكات البحثية والتطويرية بين الجامعات والقطاع الصناعي.',
    descEn: 'Plenary sessions strengthening research and industrial partnerships between universities and sector leaders.',
    image: '/img/business-meeting.jpg',
  },
];

export default function DiriyahCenterPage() {
  const { language } = useLanguage();
  const isAr = language === 'ar';
  const Arrow = isAr ? ArrowLeft : ArrowRight;

  // Selected venue for technical spec modal
  const [activeSpecVenue, setActiveSpecVenue] = useState<VenueDetail | null>(null);

  // Gallery filter
  const [galleryCategory, setGalleryCategory] = useState<GalleryCategory>('all');
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  // Calculator State
  const [calcVenue, setCalcVenue] = useState<string>('theater');
  const [calcDuration, setCalcDuration] = useState<CalcDuration>('full_day');
  const [calcEntity, setCalcEntity] = useState<CalcEntity>('gov');
  const [calcDays, setCalcDays] = useState<number>(1);
  const [calcAddons, setCalcAddons] = useState<{
    translation: boolean;
    streaming: boolean;
    vipCatering: boolean;
    cinematicVideo: boolean;
  }>({
    translation: false,
    streaming: true,
    vipCatering: false,
    cinematicVideo: false,
  });

  // Contract Modal State
  const [contractModalOpen, setContractModalOpen] = useState(false);

  const calculatedTotal = React.useMemo(() => {
    const selectedRate = BASE_RATES[calcVenue] || BASE_RATES.theater;
    let base = calcDuration === 'half_day' ? selectedRate.half_day : selectedRate.full_day;
    if (calcDuration === 'multi_day') {
      base = selectedRate.full_day * Math.max(2, calcDays);
    }

    let addonsCost = 0;
    if (calcAddons.translation) addonsCost += 3500;
    if (calcAddons.streaming) addonsCost += 4000;
    if (calcAddons.vipCatering) addonsCost += 3000;
    if (calcAddons.cinematicVideo) addonsCost += 2500;

    const subtotal = base + addonsCost;
    const discountRate = ENTITY_DISCOUNTS[calcEntity] || 0;
    const discount = subtotal * discountRate;
    const afterDiscount = subtotal - discount;
    const vat = afterDiscount * 0.15;
    return {
      subtotal,
      discount,
      discountPercent: Math.round(discountRate * 100),
      vat,
      total: Math.round(afterDiscount + vat),
    };
  }, [calcVenue, calcDuration, calcEntity, calcDays, calcAddons]);

  const galleryItems = [
    { src: '/img/business-presentation.jpg', category: 'auditorium', titleAr: 'المسرح الرئيسي - المؤتمرات الكبرى', titleEn: 'Grand Auditorium' },
    { src: '/img/campus-1.jpg', category: 'lobby', titleAr: 'البهو الملكي وقاعة المعارض', titleEn: 'Royal Exhibition Lobby' },
    { src: '/img/business-meeting.jpg', category: 'meetings', titleAr: 'قاعة B2 والاجتماعات التنفيذية', titleEn: 'Executive Boardroom B2' },
    { src: '/img/hero-university.jpg', category: 'auditorium', titleAr: 'المسرح - شاشات العرض والتجهيزات', titleEn: 'Auditorium Displays & Stage' },
    { src: '/img/business-strategy.jpg', category: 'events', titleAr: 'جلسات العمل والمنتديات', titleEn: 'Forums & Strategy Sessions' },
    { src: '/img/business-students.jpg', category: 'lobby', titleAr: 'معارض التوظيف والابتكار بالبهو', titleEn: 'Career Fair & Exhibition' },
  ];

  const filteredGallery = galleryCategory === 'all' ? galleryItems : galleryItems.filter((g) => g.category === galleryCategory);

  return (
    <div className="animate-fadeIn font-sans text-ink">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-ink-950 text-white border-b border-[var(--line)]">
        {/* Background Image with Deep Overlay */}
        <div className="absolute inset-0">
          <img
            src="/img/business-presentation.jpg"
            alt="Diriyah Center"
            className="w-full h-full object-cover object-center opacity-30 transform scale-105"
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                'radial-gradient(circle at center, rgba(11,44,53,0.7) 0%, rgba(6,22,27,0.96) 100%)',
            }}
          />
        </div>

        {/* Decorative Lines */}
        <div className="absolute top-0 start-0 w-32 h-32 border-s-2 border-t-2 border-secondary/40" />
        <div className="absolute bottom-0 end-0 w-32 h-32 border-e-2 border-b-2 border-primary/30" />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <div className="max-w-3xl">
            {/* Badges */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-secondary/40 backdrop-blur-md mb-6">
              <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
              <span className="text-secondary-300 font-semibold text-xs tracking-wider uppercase">
                {isAr ? 'مركز مؤتمرات وأعمال الدرعية — DCBC' : 'Diriyah Conferences & Business Center'}
              </span>
            </div>

            {/* Main Headline */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold leading-tight tracking-tight mb-6">
              {isAr ? (
                <>
                  منظومة متكاملة لاستضافة{' '}
                  <span className="text-transparent bg-clip-text bg-gradient-to-l from-secondary to-primary-300">
                    المؤتمرات الكبرى وفعاليات الأعمال
                  </span>
                </>
              ) : (
                <>
                  Premier Destination for{' '}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-secondary to-primary-300">
                    Conferences & Corporate Events
                  </span>
                </>
              )}
            </h1>

            <p className="text-white/80 text-base md:text-lg mb-8 leading-relaxed font-naskh">
              {isAr
                ? 'يوفر مركز مؤتمرات وأعمال الدرعية بجامعة المعرفة مرافق ومسارح استثنائية مجهزة بأحدث تقنيات الصوت والصورة 4K، والترجمة الفورية، والبث المباشر، مع باقات تأجير متكاملة وعقد إلكتروني موحد يضمن أعلى مستويات الاحترافية.'
                : 'Almaarefa University’s Diriyah Center delivers world-class auditoriums, exhibition halls, and smart boardrooms equipped with 4K A/V, simultaneous interpretation, and integrated booking solutions.'}
            </p>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-4">
              <Link
                to="/services?service=theater"
                className="btn-primary !py-3 !px-6 text-sm font-semibold shadow-lg shadow-primary/25 flex items-center gap-2"
              >
                <span>{isAr ? 'حجز القاعات والفعاليات' : 'Book Facilities Now'}</span>
                <Arrow className="w-4 h-4" />
              </Link>
              <a
                href="#calculator"
                className="btn-secondary !py-3 !px-6 text-sm font-semibold flex items-center gap-2"
              >
                <DollarSign className="w-4 h-4" />
                <span>{isAr ? 'حاسبة الباقات والأسعار' : 'Instant Pricing Calculator'}</span>
              </a>
              <button
                onClick={() => setContractModalOpen(true)}
                className="px-4 py-3 rounded-md bg-white/10 hover:bg-white/20 border border-white/25 text-white text-sm font-semibold flex items-center gap-2 transition-colors"
              >
                <FileText className="w-4 h-4 text-secondary-300" />
                <span>{isAr ? 'نموذج العقد الإلكتروني الموحد' : 'View Unified Contract'}</span>
              </button>
            </div>
          </div>

          {/* Quick Metrics Strip */}
          <div className="mt-14 pt-8 border-t border-white/15 grid grid-cols-2 sm:grid-cols-4 gap-6">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center text-primary-300 shrink-0">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <div className="text-2xl font-bold text-white">872</div>
                <div className="text-xs text-white/70 font-naskh">{isAr ? 'سعة قاعة الدرعية الكبرى' : 'Grand Hall Capacity'}</div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-lg bg-secondary/20 border border-secondary/30 flex items-center justify-center text-secondary-300 shrink-0">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <div className="text-2xl font-bold text-white">13</div>
                <div className="text-xs text-white/70 font-naskh">{isAr ? 'مرفقاً وقاعة ذكية' : 'Smart Venues & Halls'}</div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-300 shrink-0">
                <Mic className="w-5 h-5" />
              </div>
              <div>
                <div className="text-2xl font-bold text-white">4 {isAr ? 'لغات' : 'Langs'}</div>
                <div className="text-xs text-white/70 font-naskh">{isAr ? 'ترجمة فورية متزامنة' : 'Simultaneous Translation'}</div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-300 shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="text-2xl font-bold text-white">100%</div>
                <div className="text-xs text-white/70 font-naskh">{isAr ? 'عقد وحجز إلكتروني موحد' : 'Digital Unified E-Contract'}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Overview & Strategic Value */}
      <section className="py-16 bg-white border-b border-[var(--line)]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-6 space-y-5">
              <div className="inline-flex items-center gap-2 text-primary-700 font-semibold text-xs tracking-wider uppercase">
                <span className="geo-diamond" />
                <span>{isAr ? 'عن مركز مؤتمرات وأعمال الدرعية' : 'About Diriyah Center'}</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-ink-900 leading-tight">
                {isAr
                  ? 'الوجهة الرائدة للفعاليات والمؤتمرات الاستراتيجية في منطقة الدرعية'
                  : 'The Leading Venue for Strategic Conferences in Diriyah Region'}
              </h2>
              <p className="text-ink-600 font-naskh leading-relaxed text-sm md:text-base">
                {isAr
                  ? 'يشكّل مركز مؤتمرات وأعمال الدرعية ذراعاً حيوياً لجامعة المعرفة في احتضان الأنشطة والمؤتمرات والملتقيات الحكومية والخاصة والدولية. يتميز المركز بموقعه الاستراتيجي وبنيته التحتية الذكية التي تواكب أعلى المواصفات والمعايير العالمية لصناعة الفعاليات والمؤتمرات (MICE).'
                  : 'Diriyah Conferences & Business Center is Almaarefa University’s flagship facility hosting government, private, and international gatherings with cutting-edge MICE infrastructure.'}
              </p>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg">
                  <div className="font-bold text-primary-900 text-sm mb-1">{isAr ? 'تجهيزات صوتية ومرئية 4K' : '4K Audio/Visual'}</div>
                  <div className="text-xs text-ink-500 font-naskh">{isAr ? 'شاشات جدارية عملاقة وأنظمة صوتية متقدمة' : 'Video walls & advanced audio line-array'}</div>
                </div>
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg">
                  <div className="font-bold text-primary-900 text-sm mb-1">{isAr ? 'إجراءات تعاقد موحدة' : 'Unified E-Contracting'}</div>
                  <div className="text-xs text-ink-500 font-naskh">{isAr ? 'عقد إلكتروني رسمي ودفع رقمي فوري' : 'Official digital contract & instant payment'}</div>
                </div>
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg">
                  <div className="font-bold text-primary-900 text-sm mb-1">{isAr ? 'أجنحة VIP وضيافة رفيعة' : 'VIP Protocol Suites'}</div>
                  <div className="text-xs text-ink-500 font-naskh">{isAr ? 'مداخل مستقلة ومجالس تشريفات ملكية' : 'Private entrances & executive majlis'}</div>
                </div>
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg">
                  <div className="font-bold text-primary-900 text-sm mb-1">{isAr ? 'دعم فني وتشغيلي متواصل' : '24/7 Operations Support'}</div>
                  <div className="text-xs text-ink-500 font-naskh">{isAr ? 'فريق هندسي وتقني متفرغ لإنجاح فعاليتكم' : 'Dedicated engineering & event team'}</div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-6 relative">
              <div className="relative rounded-2xl overflow-hidden border border-[var(--line)] shadow-xl">
                <img
                  src="/img/business-presentation.jpg"
                  alt="Diriyah Auditorium"
                  className="w-full h-80 sm:h-96 object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ink-950/80 via-transparent to-transparent" />
                <div className="absolute bottom-4 start-4 end-4 p-4 bg-white/90 backdrop-blur-md rounded-xl border border-white/40 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-ink-900 text-sm">{isAr ? 'المسرح الرئيسي وقاعة المؤتمرات' : 'Grand Auditorium & Stage'}</div>
                    <div className="text-xs text-primary-700 font-medium">{isAr ? 'سعة 520 مقعد · مجهز بالكامل' : '520 Seats · Full Tech Suite'}</div>
                  </div>
                  <Link
                    to="/services?service=theater&venue=theater"
                    className="btn-primary text-xs !py-1.5 !px-3 shrink-0"
                  >
                    {isAr ? 'حجز المسرح' : 'Book Theater'}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Facilities & Technical Specifications */}
      <section className="py-16 bg-slate-50 border-b border-[var(--line)]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <div className="inline-flex items-center gap-2 text-primary-700 font-semibold text-xs tracking-wider uppercase mb-2">
              <Building2 className="w-4 h-4" />
              <span>{isAr ? 'المرافق والقاعات والمواصفات الفنية' : 'Facilities & Technical Specs'}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-ink-900">
              {isAr ? 'قاعات المركز وتجهيزاتها الفنية' : 'Halls & Technical Specifications'}
            </h2>
            <p className="text-ink-600 font-naskh text-sm mt-2">
              {isAr
                ? 'استعرض تفاصيل ومواصفات كل مرفق واختر المساحة المناسبة لحجم ونوع فعاليتك.'
                : 'Explore detailed specs for each hall and choose the right space for your event.'}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {DIRIYAH_VENUES.map((v) => (
              <div
                key={v.id}
                className="card flex flex-col !p-0 overflow-hidden bg-white border border-[var(--line)] rounded-xl shadow-xs hover:shadow-lg transition-all duration-300 group"
              >
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={v.image}
                    alt={isAr ? v.nameAr : v.nameEn}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-ink-950/80 via-ink-950/20 to-transparent" />
                  <div className="absolute top-3 start-3">
                    <span className="px-2.5 py-1 bg-ink/80 backdrop-blur-xs text-secondary-300 text-xs font-semibold rounded-md border border-secondary/30">
                      {v.area} · {v.capacity} {isAr ? 'شخص' : 'seats'}
                    </span>
                  </div>
                  <div className="absolute bottom-3 start-3 end-3 text-white">
                    <h3 className="font-bold text-base md:text-lg leading-snug">
                      {isAr ? v.nameAr : v.nameEn}
                    </h3>
                  </div>
                </div>

                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <p className="text-xs text-ink-600 font-naskh leading-relaxed">
                    {isAr ? v.taglineAr : v.taglineEn}
                  </p>

                  {/* Highlights list */}
                  <div className="space-y-1.5 pt-2 border-t border-slate-100">
                    <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      {isAr ? 'أبرز المواصفات الفنية' : 'Key Tech Features'}
                    </div>
                    {(isAr ? v.specs.ar : v.specs.en).slice(0, 3).map((spec, i) => (
                      <div key={i} className="flex items-start gap-1.5 text-xs text-ink-700">
                        <CheckCircle2 className="w-3.5 h-3.5 text-secondary-700 shrink-0 mt-0.5" />
                        <span className="line-clamp-1">{spec}</span>
                      </div>
                    ))}
                  </div>

                  {/* Buttons */}
                  <div className="pt-3 border-t border-slate-100 flex items-center gap-2">
                    <button
                      onClick={() => setActiveSpecVenue(v)}
                      className="btn-ghost text-xs !py-2 !px-3 flex-1 flex items-center justify-center gap-1.5"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>{isAr ? 'المواصفات الكاملة' : 'Full Specs'}</span>
                    </button>
                    <Link
                      to={`/services?service=theater&venue=${v.id}`}
                      className="btn-primary text-xs !py-2 !px-3 flex-1 flex items-center justify-center gap-1.5"
                    >
                      <span>{isAr ? 'حجز القاعة' : 'Book Hall'}</span>
                      <Arrow className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Media Gallery & Interactive Photos */}
      <section className="py-16 bg-white border-b border-[var(--line)]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
            <div>
              <div className="inline-flex items-center gap-2 text-primary-700 font-semibold text-xs tracking-wider uppercase mb-1">
                <Sparkles className="w-4 h-4 text-secondary-700" />
                <span>{isAr ? 'مكتبة الوسائط والصور' : 'Media Gallery'}</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-ink-900">
                {isAr ? 'معرض صور مرافق وفعاليات المركز' : 'Center Facilities & Events Gallery'}
              </h2>
            </div>

            {/* Category Filter Pills */}
            <div className="flex flex-wrap gap-1.5">
              {(
                [
                  { id: 'all', labelAr: 'الكل', labelEn: 'All' },
                  { id: 'auditorium', labelAr: 'المسرح الرئيسي', labelEn: 'Auditorium' },
                  { id: 'lobby', labelAr: 'البهو والمعارض', labelEn: 'Lobby & Expo' },
                  { id: 'meetings', labelAr: 'قاعات الاجتماعات', labelEn: 'Boardrooms' },
                  { id: 'events', labelAr: 'فعاليات سابقة', labelEn: 'Events' },
                ] as const
              ).map((c) => (
                <button
                  key={c.id}
                  onClick={() => setGalleryCategory(c.id)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                    galleryCategory === c.id
                      ? 'bg-primary-700 text-white shadow-xs'
                      : 'bg-slate-100 text-ink-600 hover:bg-slate-200'
                  }`}
                >
                  {isAr ? c.labelAr : c.labelEn}
                </button>
              ))}
            </div>
          </div>

          {/* Photo Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {filteredGallery.map((item, idx) => (
              <div
                key={idx}
                onClick={() => setLightboxImage(item.src)}
                className="group relative h-52 sm:h-60 rounded-xl overflow-hidden border border-[var(--line)] cursor-pointer shadow-xs"
              >
                <img
                  src={item.src}
                  alt={isAr ? item.titleAr : item.titleEn}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ink-950/80 via-transparent to-transparent opacity-80 group-hover:opacity-100 transition-opacity" />
                <div className="absolute bottom-3 start-3 end-3 text-white">
                  <div className="text-xs font-bold leading-tight drop-shadow-xs">
                    {isAr ? item.titleAr : item.titleEn}
                  </div>
                </div>
                <div className="absolute top-3 end-3 w-8 h-8 rounded-full bg-white/80 backdrop-blur-xs flex items-center justify-center text-ink opacity-0 group-hover:opacity-100 transition-opacity">
                  <Eye className="w-4 h-4" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Packages & Live Calculator */}
      <section id="calculator" className="py-16 bg-slate-50 border-b border-[var(--line)] scroll-mt-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <div className="inline-flex items-center gap-2 text-primary-700 font-semibold text-xs tracking-wider uppercase mb-2">
              <DollarSign className="w-4 h-4 text-secondary-700" />
              <span>{isAr ? 'باقات التأجير وحاسبة التكلفة الفورية' : 'Packages & Live Pricing Estimator'}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-ink-900">
              {isAr ? 'باقات المؤتمرات وحاسبة التكلفة التقديرية' : 'Conference Packages & Price Estimator'}
            </h2>
            <p className="text-ink-600 font-naskh text-sm mt-2">
              {isAr
                ? 'اختر الباقة المناسبة أو استخدم الحاسبة التفاعلية لتقدير التكلفة الإجمالية وإصدار العقد الإلكتروني فوراً.'
                : 'Select a package or use our interactive calculator to estimate costs and view the electronic contract.'}
            </p>
          </div>

          {/* Curated Packages */}
          <div className="grid md:grid-cols-3 gap-6 mb-16">
            {PACKAGES.map((pkg) => (
              <div
                key={pkg.id}
                className={`card flex flex-col justify-between relative bg-white border rounded-xl p-6 ${
                  pkg.id === 'platinum' ? 'border-secondary ring-2 ring-secondary/20 shadow-lg' : 'border-[var(--line)] shadow-xs'
                }`}
              >
                {pkg.badgeAr && (
                  <div className="absolute -top-3 start-6">
                    <span className="px-3 py-1 bg-secondary-700 text-white text-xs font-bold rounded-full uppercase tracking-wider shadow-xs">
                      {isAr ? pkg.badgeAr : pkg.badgeEn}
                    </span>
                  </div>
                )}

                <div>
                  <h3 className="font-bold text-lg text-ink-900 mt-2 mb-1">
                    {isAr ? pkg.nameAr : pkg.nameEn}
                  </h3>
                  <p className="text-xs text-ink-500 font-naskh mb-4">
                    {isAr ? pkg.descAr : pkg.descEn}
                  </p>
                  <div className="mb-6 p-3 bg-primary-50/50 rounded-lg border border-primary/20 flex items-baseline gap-1">
                    <span className="text-xs text-slate-500">{isAr ? 'تبدأ من:' : 'From:'}</span>
                    <span className="text-2xl font-bold text-primary-700 font-mono">
                      {pkg.basePrice.toLocaleString('ar-SA')}
                    </span>
                    <span className="text-xs text-primary-700 font-semibold">{isAr ? 'ر.س' : 'SAR'}</span>
                  </div>

                  <div className="space-y-2.5">
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      {isAr ? 'المميزات المضمنة:' : 'Included Features:'}
                    </div>
                    {(isAr ? pkg.featuresAr : pkg.featuresEn).map((feat, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-xs text-ink-700 font-naskh">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-8 pt-4 border-t border-slate-100">
                  <Link
                    to={`/services?service=theater&package=${pkg.id}`}
                    className="btn-primary w-full text-xs !py-2.5 text-center flex items-center justify-center gap-1.5"
                  >
                    <span>{isAr ? 'حجز هذه الباقة' : 'Select Package'}</span>
                    <Arrow className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {/* Interactive Calculator Box */}
          <div className="bg-white rounded-2xl border border-[var(--line)] shadow-md p-6 sm:p-8">
            <div className="flex items-center gap-3 pb-6 border-b border-[var(--line)] mb-6">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <DollarSign className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-ink-900">
                  {isAr ? 'حاسبة التأجير الفورية لمركز مؤتمرات وأعمال الدرعية' : 'Live Rental Calculator'}
                </h3>
                <p className="text-xs text-ink-500 font-naskh">
                  {isAr ? 'حدد متطلباتك لحساب القيمة التقديرية بدقة وإصدار العقد' : 'Customize requirements to estimate total cost and generate contract'}
                </p>
              </div>
            </div>

            <div className="grid lg:grid-cols-12 gap-8">
              {/* Controls */}
              <div className="lg:col-span-7 space-y-6">
                {/* 1. Venue Select */}
                <div>
                  <label className="block text-xs font-bold text-ink-700 uppercase tracking-wider mb-2">
                    {isAr ? '1. اختر القاعة أو المرفق المطلوب:' : '1. Select Venue / Space:'}
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { id: 'theater', labelAr: 'المسرح الرئيسي', labelEn: 'Auditorium' },
                      { id: 'lobby', labelAr: 'البهو الملكي', labelEn: 'Royal Lobby' },
                      { id: 'b2', labelAr: 'قاعة B2 الذكية', labelEn: 'Hall B2' },
                      { id: 'all', labelAr: 'كامل مرافق المركز', labelEn: 'All Facilities' },
                    ].map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setCalcVenue(item.id)}
                        className={`p-3 text-xs font-semibold rounded-lg border text-start transition-all ${
                          calcVenue === item.id
                            ? 'border-primary bg-primary-50/50 text-primary-800 ring-1 ring-primary'
                            : 'border-slate-200 bg-white text-ink-700 hover:border-slate-300'
                        }`}
                      >
                        {isAr ? item.labelAr : item.labelEn}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. Duration */}
                <div>
                  <label className="block text-xs font-bold text-ink-700 uppercase tracking-wider mb-2">
                    {isAr ? '2. المدة الزمنية للفعالية:' : '2. Event Duration:'}
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(
                      [
                        { id: 'half_day', labelAr: 'نصف يوم (4 ساعات)', labelEn: 'Half Day (4 hrs)' },
                        { id: 'full_day', labelAr: 'يوم كامل (8 ساعات)', labelEn: 'Full Day (8 hrs)' },
                        { id: 'multi_day', labelAr: 'متعدد الأيام', labelEn: 'Multi-Day' },
                      ] as const
                    ).map((d) => (
                      <button
                        key={d.id}
                        type="button"
                        onClick={() => setCalcDuration(d.id)}
                        className={`p-2.5 text-xs font-semibold rounded-lg border text-center transition-all ${
                          calcDuration === d.id
                            ? 'border-secondary bg-secondary-50/50 text-secondary-800 ring-1 ring-secondary'
                            : 'border-slate-200 bg-white text-ink-700 hover:border-slate-300'
                        }`}
                      >
                        {isAr ? d.labelAr : d.labelEn}
                      </button>
                    ))}
                  </div>
                  {calcDuration === 'multi_day' && (
                    <div className="mt-3 flex items-center gap-3">
                      <span className="text-xs text-ink-600 font-naskh">{isAr ? 'عدد الأيام:' : 'Number of Days:'}</span>
                      <input
                        type="number"
                        min="2"
                        max="14"
                        value={calcDays}
                        onChange={(e) => setCalcDays(Math.max(2, parseInt(e.target.value) || 2))}
                        className="w-20 p-1.5 border border-slate-300 rounded-md text-sm text-center font-bold"
                      />
                    </div>
                  )}
                </div>

                {/* 3. Entity Classification */}
                <div>
                  <label className="block text-xs font-bold text-ink-700 uppercase tracking-wider mb-2">
                    {isAr ? '3. تصنيف الجهة المستفيدة (نسب الخصم المؤسسي):' : '3. Entity Classification:'}
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {(
                      [
                        { id: 'gov', labelAr: 'جهة حكومية / وزارية (خصم 15%)', labelEn: 'Government (15% Off)' },
                        { id: 'private', labelAr: 'شركة قطاع خاص (تسعير قياسي)', labelEn: 'Private Company' },
                        { id: 'nonprofit', labelAr: 'جمعية / قطاع غير ربحي (خصم 25%)', labelEn: 'Non-Profit (25% Off)' },
                        { id: 'internal', labelAr: 'منسوبو جامعة المعرفة (خصم 40%)', labelEn: 'University Internal (40% Off)' },
                      ] as const
                    ).map((ent) => (
                      <button
                        key={ent.id}
                        type="button"
                        onClick={() => setCalcEntity(ent.id)}
                        className={`p-2.5 text-xs font-semibold rounded-lg border text-start transition-all ${
                          calcEntity === ent.id
                            ? 'border-primary bg-primary-50/50 text-primary-800 ring-1 ring-primary'
                            : 'border-slate-200 bg-white text-ink-700 hover:border-slate-300'
                        }`}
                      >
                        {isAr ? ent.labelAr : ent.labelEn}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 4. Add-ons */}
                <div>
                  <label className="block text-xs font-bold text-ink-700 uppercase tracking-wider mb-2">
                    {isAr ? '4. الخدمات الإضافية الفنية:' : '4. Additional Technical Services:'}
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <label className="flex items-center gap-2 p-2.5 border rounded-lg cursor-pointer hover:bg-slate-50 text-xs">
                      <input
                        type="checkbox"
                        checked={calcAddons.translation}
                        onChange={(e) => setCalcAddons((prev) => ({ ...prev, translation: e.target.checked }))}
                        className="rounded text-primary focus:ring-primary"
                      />
                      <span>{isAr ? 'كابينة وترجمة فورية (+3,500 ر.س)' : 'Simultaneous Translation (+3,500 SAR)'}</span>
                    </label>

                    <label className="flex items-center gap-2 p-2.5 border rounded-lg cursor-pointer hover:bg-slate-50 text-xs">
                      <input
                        type="checkbox"
                        checked={calcAddons.streaming}
                        onChange={(e) => setCalcAddons((prev) => ({ ...prev, streaming: e.target.checked }))}
                        className="rounded text-primary focus:ring-primary"
                      />
                      <span>{isAr ? 'بث مباشر متعدد الكاميرات (+4,000 ر.س)' : 'Live Broadcast Multi-Cam (+4,000 SAR)'}</span>
                    </label>

                    <label className="flex items-center gap-2 p-2.5 border rounded-lg cursor-pointer hover:bg-slate-50 text-xs">
                      <input
                        type="checkbox"
                        checked={calcAddons.vipCatering}
                        onChange={(e) => setCalcAddons((prev) => ({ ...prev, vipCatering: e.target.checked }))}
                        className="rounded text-primary focus:ring-primary"
                      />
                      <span>{isAr ? 'ضيافة واستقبال VIP (+3,000 ر.س)' : 'VIP Catering & Reception (+3,000 SAR)'}</span>
                    </label>

                    <label className="flex items-center gap-2 p-2.5 border rounded-lg cursor-pointer hover:bg-slate-50 text-xs">
                      <input
                        type="checkbox"
                        checked={calcAddons.cinematicVideo}
                        onChange={(e) => setCalcAddons((prev) => ({ ...prev, cinematicVideo: e.target.checked }))}
                        className="rounded text-primary focus:ring-primary"
                      />
                      <span>{isAr ? 'توثيق سينمائي وفيديو هايلايت (+2,500 ر.س)' : 'Cinematic Video Reel (+2,500 SAR)'}</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Price Calculation Receipt */}
              <div className="lg:col-span-5 bg-slate-50 border border-slate-200 rounded-xl p-6 flex flex-col justify-between">
                <div>
                  <h4 className="font-bold text-sm text-ink-900 border-b border-slate-200 pb-3 mb-4 flex items-center justify-between">
                    <span>{isAr ? 'تفاصيل التسعير التقديري' : 'Estimated Breakdown'}</span>
                    <span className="text-[11px] font-mono text-slate-400">VAT Incl.</span>
                  </h4>

                  <div className="space-y-3 text-xs font-naskh">
                    <div className="flex justify-between text-slate-600">
                      <span>{isAr ? 'رسوم حجز المرفق الأساسي:' : 'Base Venue Rental:'}</span>
                      <span className="font-mono font-semibold">
                        {(calculatedTotal.subtotal - (calcAddons.translation ? 3500 : 0) - (calcAddons.streaming ? 4000 : 0) - (calcAddons.vipCatering ? 3000 : 0) - (calcAddons.cinematicVideo ? 2500 : 0)).toLocaleString('ar-SA')} ر.س
                      </span>
                    </div>

                    {(calcAddons.translation || calcAddons.streaming || calcAddons.vipCatering || calcAddons.cinematicVideo) && (
                      <div className="flex justify-between text-slate-600">
                        <span>{isAr ? 'إجمالي الخدمات الفنية الإضافية:' : 'Additional Tech Add-ons:'}</span>
                        <span className="font-mono font-semibold">
                          {((calcAddons.translation ? 3500 : 0) + (calcAddons.streaming ? 4000 : 0) + (calcAddons.vipCatering ? 3000 : 0) + (calcAddons.cinematicVideo ? 2500 : 0)).toLocaleString('ar-SA')} ر.س
                        </span>
                      </div>
                    )}

                    {calculatedTotal.discount > 0 && (
                      <div className="flex justify-between text-emerald-700 font-semibold bg-emerald-50 p-2 rounded-md">
                        <span>{isAr ? `الخصم المؤسسي (${calculatedTotal.discountPercent}%):` : `Discount (${calculatedTotal.discountPercent}%):`}</span>
                        <span className="font-mono">-{calculatedTotal.discount.toLocaleString('ar-SA')} ر.س</span>
                      </div>
                    )}

                    <div className="flex justify-between text-slate-500 pt-2 border-t border-slate-200">
                      <span>{isAr ? 'ضريبة القيمة المضافة (15%):' : 'VAT (15%):'}</span>
                      <span className="font-mono">{calculatedTotal.vat.toLocaleString('ar-SA')} ر.س</span>
                    </div>

                    <div className="pt-3 border-t-2 border-slate-300 flex justify-between items-baseline">
                      <span className="font-bold text-sm text-ink-900">{isAr ? 'المجموع الإجمالي التقديري:' : 'Total Estimated Cost:'}</span>
                      <div className="text-end">
                        <div className="text-2xl font-extrabold text-primary-700 font-mono">
                          {calculatedTotal.total.toLocaleString('ar-SA')} <span className="text-xs font-normal">ر.س</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 space-y-2 pt-4 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => setContractModalOpen(true)}
                    className="w-full py-2.5 px-3 bg-secondary/10 hover:bg-secondary/20 text-secondary-900 text-xs font-bold rounded-lg border border-secondary/30 flex items-center justify-center gap-2 transition-colors"
                  >
                    <FileText className="w-4 h-4 text-secondary-700" />
                    <span>{isAr ? 'استعراض مسودة العقد الإلكتروني الموحد' : 'View E-Contract Draft'}</span>
                  </button>

                  <Link
                    to={`/services?service=theater&venue=${calcVenue}&estimatedTotal=${calculatedTotal.total}`}
                    className="btn-primary w-full text-xs !py-3 flex items-center justify-center gap-2 text-center"
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>{isAr ? 'متابعة الحجز وتقديم الطلب' : 'Proceed with Booking'}</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* News & Events Hosted at Diriyah Center */}
      <section className="py-16 bg-white border-b border-[var(--line)]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
            <div>
              <div className="inline-flex items-center gap-2 text-primary-700 font-semibold text-xs tracking-wider uppercase mb-1">
                <Calendar className="w-4 h-4 text-secondary-700" />
                <span>{isAr ? 'أخبار وفعاليات المركز' : 'Center Events & News'}</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-ink-900">
                {isAr ? 'أحدث المؤتمرات والفعاليات المنعقدة' : 'Recent Conferences & Events'}
              </h2>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {EVENTS_NEWS.map((ev) => (
              <div key={ev.id} className="card !p-0 overflow-hidden bg-white border border-[var(--line)] rounded-xl flex flex-col justify-between shadow-xs hover:shadow-md transition-shadow">
                <div className="h-44 relative overflow-hidden">
                  <img src={ev.image} alt="" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-ink-950/75 via-transparent to-transparent" />
                  <div className="absolute top-3 start-3">
                    <span className="px-2.5 py-1 bg-ink/80 backdrop-blur-xs text-white text-[11px] font-semibold rounded-md">
                      {ev.date}
                    </span>
                  </div>
                  <div className="absolute bottom-2 start-3 end-3 text-white">
                    <span className="text-[11px] text-secondary-300 font-medium">{isAr ? ev.venueAr : ev.venueEn}</span>
                  </div>
                </div>

                <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                  <h3 className="font-bold text-sm text-ink-900 leading-snug">
                    {isAr ? ev.titleAr : ev.titleEn}
                  </h3>
                  <p className="text-xs text-ink-600 font-naskh leading-relaxed line-clamp-3">
                    {isAr ? ev.descAr : ev.descEn}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Concierge & Contact Support */}
      <section className="py-16 bg-gradient-to-br from-ink to-primary-950 text-white relative overflow-hidden">
        <div className="absolute top-0 start-0 w-24 h-24 border-s-2 border-t-2 border-secondary/30" />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-8 space-y-4">
              <div className="inline-flex items-center gap-2 text-secondary-300 font-semibold text-xs tracking-wider uppercase">
                <span className="geo-diamond" />
                <span>{isAr ? 'فريق علاقات العملاء والكونسيرج' : 'Concierge & Event Advisory'}</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-white">
                {isAr ? 'هل تحتاج إلى استشارة مخصصة لفعاليتك القادمة؟' : 'Need Custom Planning for Your Next Event?'}
              </h2>
              <p className="text-white/80 font-naskh text-sm md:text-base leading-relaxed">
                {isAr
                  ? 'يسعد فريق مركز مؤتمرات وأعمال الدرعية بترتيب جولة ميدانية لمعاينة القاعات، وتقديم المشورة الفنية وتصميم الباقة الأمثل لاحتياجاتكم.'
                  : 'Our dedicated advisory team is ready to schedule a venue walkthrough and design a bespoke package.'}
              </p>

              <div className="flex flex-wrap items-center gap-6 pt-4 text-xs font-mono text-white/90">
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-secondary-300" />
                  <span dir="ltr">920011909 (Ext: 3400)</span>
                </div>
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-secondary-300" />
                  <span dir="ltr">dcbc@um.edu.sa</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-secondary-300" />
                  <span>{isAr ? 'مقر جامعة المعرفة — الدرعية' : 'Almaarefa University — Diriyah'}</span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-4 flex flex-col gap-3">
              <Link
                to="/services?service=theater"
                className="btn-secondary !py-3.5 !px-6 text-center text-sm font-bold flex items-center justify-center gap-2 shadow-lg"
              >
                <span>{isAr ? 'تقديم طلب حجز وتأجير' : 'Submit Rental Booking'}</span>
                <Arrow className="w-4 h-4" />
              </Link>
              <button
                onClick={() => setContractModalOpen(true)}
                className="px-6 py-3 rounded-md bg-white/10 hover:bg-white/20 border border-white/25 text-white text-xs font-semibold text-center transition-colors"
              >
                {isAr ? 'استعراض بنود العقد الإلكتروني' : 'Review Electronic Contract'}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Technical Spec Modal */}
      {activeSpecVenue && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full border border-[var(--line)] overflow-hidden">
            <div className="p-5 bg-gradient-to-r from-ink to-primary text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base md:text-lg">
                  {isAr ? activeSpecVenue.nameAr : activeSpecVenue.nameEn}
                </h3>
                <p className="text-xs text-white/70">{activeSpecVenue.area} · {activeSpecVenue.capacity} {isAr ? 'شخص' : 'seats'}</p>
              </div>
              <button
                onClick={() => setActiveSpecVenue(null)}
                className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto font-naskh text-sm">
              <div>
                <h4 className="font-bold text-primary-900 text-xs uppercase tracking-wider mb-2 font-sans">
                  {isAr ? 'المواصفات والتجهيزات الفنية الشاملة:' : 'Complete Technical Specs:'}
                </h4>
                <div className="space-y-2">
                  {(isAr ? activeSpecVenue.specs.ar : activeSpecVenue.specs.en).map((item, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-bold text-primary-900 text-xs uppercase tracking-wider mb-2 font-sans">
                  {isAr ? 'الملائمة والاستخدامات النموذجية:' : 'Ideal For:'}
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {(isAr ? activeSpecVenue.suitableForAr : activeSpecVenue.suitableForEn).map((use, i) => (
                    <span key={i} className="px-2.5 py-1 bg-secondary-50 text-secondary-900 border border-secondary/20 rounded-md text-xs font-semibold">
                      {use}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-[var(--line)] flex items-center justify-end gap-2">
              <button
                onClick={() => setActiveSpecVenue(null)}
                className="btn-ghost text-xs !py-2 !px-3"
              >
                {isAr ? 'إغلاق' : 'Close'}
              </button>
              <Link
                to={`/services?service=theater&venue=${activeSpecVenue.id}`}
                className="btn-primary text-xs !py-2 !px-4 flex items-center gap-1.5"
              >
                <span>{isAr ? 'حجز هذا المرفق الآن' : 'Book Facility'}</span>
                <Arrow className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox Modal */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn"
          onClick={() => setLightboxImage(null)}
        >
          <div className="relative max-w-4xl w-full" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setLightboxImage(null)}
              className="absolute -top-10 end-0 text-white hover:text-secondary-700 p-1"
            >
              <X className="w-7 h-7" />
            </button>
            <img src={lightboxImage} alt="Preview" className="w-full max-h-[85vh] object-contain rounded-lg shadow-2xl border border-white/20" />
          </div>
        </div>
      )}

      {/* Electronic Contract Modal */}
      <ElectronicContractModal
        isOpen={contractModalOpen}
        onClose={() => setContractModalOpen(false)}
        customData={{
          clientName: 'المفوّض الرسمي للجهة المستفيدة',
          entityName: isAr ? 'الجهة المتعاقدة لحجز مركز المؤتمرات' : 'Contracting Entity',
          entityType: isAr ? 'حجز وتأجير مرافق مركز مؤتمرات وأعمال الدرعية' : 'DCBC Facility Rental',
          phone: '05xxxxxxxx',
          email: 'contact@partner.sa',
          venueName: calcVenue === 'theater' ? 'المسرح الرئيسي وقاعة المؤتمرات الكبرى' : (calcVenue === 'lobby' ? 'البهو الملكي وقاعة المعارض' : 'قاعة المؤتمرات B2 والقاعات الذكية'),
          eventTitle: isAr ? 'استضافة مؤتمر / فعالية رسمية بالمركز' : 'Official Conference / Corporate Event',
          eventDate: new Date().toISOString().split('T')[0],
          duration: calcDuration === 'half_day' ? 'نصف يوم (08:00 ص - 01:00 م)' : (calcDuration === 'full_day' ? 'يوم كامل (08:00 ص - 05:00 م)' : `${calcDays} أيام متتالية`),
          totalAmount: calculatedTotal.total,
          trackingCode: 'UM-DCBC-2026-88',
        }}
      />
    </div>
  );
}
