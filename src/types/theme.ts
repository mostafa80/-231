export type ThemeId =
  | 'somuch-red'     // صقر الشرق كحلي وياقوتي
  | 'dark-indigo'    // الوضع الليلي الاحترافي
  | 'emerald'        // الزمردي المحاسبي
  | 'royal-navy'     // الأزرق الملكي البحري
  | 'gold-luxury'    // صقر الذهب الأسود
  | 'cyber-violet'   // السيبراني البنفسجي
  | 'clean-light';   // المكتبي النهاري الناصع

export type FontId =
  | 'cairo'          // Cairo
  | 'tajawal'        // Tajawal
  | 'almarai'        // Almarai
  | 'ibm-plex'       // IBM Plex Sans Arabic
  | 'readex'         // Readex Pro
  | 'alexandria'     // Alexandria
  | 'changa'         // Changa
  | 'amiri'          // Amiri
  | 'system';        // System Default

export type FontSizeScale = 'compact' | 'normal' | 'large' | 'xlarge';

export interface ThemeDefinition {
  id: ThemeId;
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  descriptionEn: string;
  previewBg: string;
  previewAccent: string;
  badge: string;
  isDark: boolean;
}

export interface FontDefinition {
  id: FontId;
  nameAr: string;
  nameEn: string;
  familyCss: string;
  descriptionAr: string;
  sampleText: string;
}

export interface ThemeConfig {
  theme: ThemeId;
  font: FontId;
  fontSize: FontSizeScale;
  tabularNums: boolean;
}

export const AVAILABLE_THEMES: ThemeDefinition[] = [
  {
    id: 'somuch-red',
    nameAr: 'صقر الشرق الأصلي (ياقوتي & كحلي)',
    nameEn: 'SoMuch Ruby & Dark Slate',
    descriptionAr: 'الثيم الرسمي المعتمد لشركة صقر الشرق للملابس مع لمسات الياقوت الأحمر',
    descriptionEn: 'Official brand theme with deep slate background and crimson accents',
    previewBg: 'bg-slate-900',
    previewAccent: 'bg-red-600',
    badge: 'الافتراضي المعتمد 🦅',
    isDark: true,
  },
  {
    id: 'dark-indigo',
    nameAr: 'الوضع الليلي النيلي الاحترافي',
    nameEn: 'Deep Indigo Dark Mode',
    descriptionAr: 'واجهة ليلية داكنة مريحة للعين مع إضاءة نيلية هادئة',
    descriptionEn: 'Midnight palette with soothing indigo and violet highlights',
    previewBg: 'bg-slate-950',
    previewAccent: 'bg-indigo-600',
    badge: 'مريح للعين 🌙',
    isDark: true,
  },
  {
    id: 'emerald',
    nameAr: 'الزمردي المالي والمحاسبي',
    nameEn: 'Emerald Accounting Ledger',
    descriptionAr: 'طابع محاسبي هادئ يركز على توازن الأرقام وجداول الجرد',
    descriptionEn: 'Financial emerald green & sage palette designed for ledger clarity',
    previewBg: 'bg-slate-900',
    previewAccent: 'bg-emerald-600',
    badge: 'محاسبي دقيق 💵',
    isDark: true,
  },
  {
    id: 'royal-navy',
    nameAr: 'الأزرق الملكي البحري',
    nameEn: 'Royal Ocean Navy',
    descriptionAr: 'أزرق كحلي عميق مع لمسات سماوية مشعة للأزرار والتنبيهات',
    descriptionEn: 'Deep oceanic blue tones with cyan & sky highlights',
    previewBg: 'bg-slate-950',
    previewAccent: 'bg-blue-600',
    badge: 'ملكي راقي 🌊',
    isDark: true,
  },
  {
    id: 'gold-luxury',
    nameAr: 'صقر الذهب الأسود الفاخر',
    nameEn: 'OLED Black & Gold Amber',
    descriptionAr: 'خلفية سوداء نقية مع تفاصيل باللون الذهبي الكهرماني اللامع',
    descriptionEn: 'True black OLED theme with luxury warm amber & gold details',
    previewBg: 'bg-black',
    previewAccent: 'bg-amber-500',
    badge: 'فاخر عالي التباين ✨',
    isDark: true,
  },
  {
    id: 'cyber-violet',
    nameAr: 'السيبراني البنفسجي التقني',
    nameEn: 'Cyber Violet & Neon',
    descriptionAr: 'تصميم عصري متطور بتدرجات البنفسجي والوردي التقني',
    descriptionEn: 'Futuristic theme with purple and energetic accents',
    previewBg: 'bg-zinc-950',
    previewAccent: 'bg-fuchsia-600',
    badge: 'تقني عصري ⚡',
    isDark: true,
  },
  {
    id: 'clean-light',
    nameAr: 'النهاري الناصع المكتبي',
    nameEn: 'Clean Light Office',
    descriptionAr: 'واجهة نهارية بيضاء نقية مع حدود واضحة مناسبة للمكاتب المضيئة',
    descriptionEn: 'High-visibility crisp light theme tailored for daylight office screens',
    previewBg: 'bg-white',
    previewAccent: 'bg-sky-600',
    badge: 'نهاري ساطع ☀️',
    isDark: false,
  },
];

export const AVAILABLE_FONTS: FontDefinition[] = [
  {
    id: 'cairo',
    nameAr: 'خط القاهرة (Cairo)',
    nameEn: 'Cairo',
    familyCss: "'Cairo', 'Plus Jakarta Sans', sans-serif",
    descriptionAr: 'الخط القياسي العصري الأكثر انتشاراً، متوازن ومقروء جداً في الأرقام',
    sampleText: 'صقر الشرق للملابس - إذن استلام #10492 | الكمية: 250 قطة',
  },
  {
    id: 'tajawal',
    nameAr: 'خط تجوّل (Tajawal)',
    nameEn: 'Tajawal',
    familyCss: "'Tajawal', 'Plus Jakarta Sans', sans-serif",
    descriptionAr: 'تصميم عربي انسيابي وهادئ يمنح الجداول مظهراً أنيقاً وعصرياً',
    sampleText: 'مراجعة فروقات فواتير البيع ومطابقة باركود الأصناف بدقة',
  },
  {
    id: 'almarai',
    nameAr: 'خط المراعي (Almarai)',
    nameEn: 'Almarai',
    familyCss: "'Almarai', 'Plus Jakarta Sans', sans-serif",
    descriptionAr: 'خط هندسي عربي مريح جداً للعين، مثالي للجداول الطويلة وقوائم الجرد',
    sampleText: 'عجز وفائض الأصناف - سعر القطعة 145.00 ج.م - تم الحفظ محلياً',
  },
  {
    id: 'ibm-plex',
    nameAr: 'آي بي إم بلكس (IBM Plex Sans Arabic)',
    nameEn: 'IBM Plex Sans Arabic',
    familyCss: "'IBM Plex Sans Arabic', 'Plus Jakarta Sans', sans-serif",
    descriptionAr: 'خط تقني مؤسسي عالي الدقة، مصمم خصيصاً للجداول والبيانات المالية',
    sampleText: 'باركود: 62211029481 | الإجمالي: 45,800 ج.م | سليم: 40 | تالف: 2',
  },
  {
    id: 'readex',
    nameAr: 'ريدكس برو (Readex Pro)',
    nameEn: 'Readex Pro',
    familyCss: "'Readex Pro', 'Plus Jakarta Sans', sans-serif",
    descriptionAr: 'خط هندسي حديث بنسب متناسقة، يتميز بوضوح استثنائي للأرقام الإنجليزية والعربية',
    sampleText: 'فحص الفاتورة والباركود أوفلاين بدون اتصال بالإنترنت ⚡',
  },
  {
    id: 'alexandria',
    nameAr: 'خط الإسكندرية (Alexandria)',
    nameEn: 'Alexandria',
    familyCss: "'Alexandria', 'Plus Jakarta Sans', sans-serif",
    descriptionAr: 'طابع عصري متجدد يمنح التطبيق حضوراً بصرياً قوياً وجذاباً',
    sampleText: 'نظام إدارة الاستلامات متعدد الفروع | SoMuch Retail ERP',
  },
  {
    id: 'changa',
    nameAr: 'خط تشانجا (Changa)',
    nameEn: 'Changa',
    familyCss: "'Changa', 'Plus Jakarta Sans', sans-serif",
    descriptionAr: 'خط عريض وبارز ممتاز لعناوين الأقسام وقراءة الباركود من مسافة',
    sampleText: 'تنبيه: يوجد نقص 5 قطع في الصنف [تيشرت بولو قطن أسود]',
  },
  {
    id: 'amiri',
    nameAr: 'خط أميري (Amiri)',
    nameEn: 'Amiri',
    familyCss: "'Amiri', serif",
    descriptionAr: 'خط نسخي كلاسيكي فخم وتقليدي لإيصالات الطباعة والتقارير الرسمية',
    sampleText: 'تقرير مطابقة استلامات المخزن الرئيسي لفرع مدينة نصر',
  },
  {
    id: 'system',
    nameAr: 'خط النظام الافتراضي (System Sans)',
    nameEn: 'System Sans',
    familyCss: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    descriptionAr: 'استخدام الخط المدمج في نظام تشغيل ويندوز / جهازك بأقصى سرعة',
    sampleText: 'Windows Native Font - استجابة فورية وسرعة فائقة',
  },
];
