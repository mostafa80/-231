import React from 'react';
import {
  Palette,
  Type,
  Maximize2,
  Check,
  RotateCcw,
  X,
  Sparkles,
  Eye,
  Sliders,
  CheckCircle2,
} from 'lucide-react';
import {
  AVAILABLE_THEMES,
  AVAILABLE_FONTS,
  ThemeId,
  FontId,
  FontSizeScale,
  ThemeConfig,
} from '../types/theme';

interface ThemeSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: ThemeConfig;
  onSetTheme: (theme: ThemeId) => void;
  onSetFont: (font: FontId) => void;
  onSetFontSize: (size: FontSizeScale) => void;
  onSetTabularNums: (tabular: boolean) => void;
  onResetDefaults: () => void;
  lang?: 'ar' | 'en';
}

export const ThemeSettingsModal: React.FC<ThemeSettingsModalProps> = ({
  isOpen,
  onClose,
  config,
  onSetTheme,
  onSetFont,
  onSetFontSize,
  onSetTabularNums,
  onResetDefaults,
  lang = 'ar',
}) => {
  if (!isOpen) return null;

  const isAr = lang === 'ar';

  const selectedTheme = AVAILABLE_THEMES.find((t) => t.id === config.theme) || AVAILABLE_THEMES[0];
  const selectedFont = AVAILABLE_FONTS.find((f) => f.id === config.font) || AVAILABLE_FONTS[0];

  const fontSizeOptions: { id: FontSizeScale; labelAr: string; labelEn: string; descAr: string }[] = [
    { id: 'compact', labelAr: 'مضغوط (92%)', labelEn: 'Compact (92%)', descAr: 'مناسب للشاشات الصغيرة وعرض بيانات أكثر في الجدول' },
    { id: 'normal', labelAr: 'قياسي (100%)', labelEn: 'Standard (100%)', descAr: 'المقاس الافتراضي المتوازن والمريح للقراءة اليومية' },
    { id: 'large', labelAr: 'مريح كبير (108%)', labelEn: 'Comfort Large (108%)', descAr: 'خط أكبر وأكثر راحة للعين أثناء مراجعة الفواتير' },
    { id: 'xlarge', labelAr: 'شاشات المخازن (118%)', labelEn: 'Warehouse Display (118%)', descAr: 'أقصى وضوح لقارئات الباركود وشاشات اللمس والمخازن' },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/75 backdrop-blur-xs animate-fadeIn"
      dir={isAr ? 'rtl' : 'ltr'}
    >
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-5 flex items-center justify-between shrink-0 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 to-red-600 flex items-center justify-center shadow-lg shadow-red-950/40">
              <Palette className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold flex items-center gap-2">
                {isAr ? 'تخصيص المظهر ونوع الخط والثيمات' : 'Theme & Typography Settings'}
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-red-600/30 text-red-200 border border-red-500/30">
                  {isAr ? 'متعدد الثيمات' : 'Multi-Theme'}
                </span>
              </h2>
              <p className="text-xs text-slate-300">
                {isAr
                  ? 'اختر الثيم اللوني المفضل لديك، ونوع الخط العربي، وحجم النص الملائم لطبيعة شاشتك'
                  : 'Customize color palettes, Arabic font families, and typography scaling'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-all cursor-pointer"
            title={isAr ? 'إغلاق' : 'Close'}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1 text-slate-800">
          {/* Live Preview Banner */}
          <div className="rounded-xl border border-slate-200 p-4 bg-slate-50/70 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                <Eye className="w-4 h-4 text-indigo-600" />
                <span>{isAr ? 'معاينة فورية حية للشكل والخط المختارين:' : 'Live Active Preview:'}</span>
              </div>
              <span className="text-xs px-2.5 py-0.5 rounded-md font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                {isAr ? selectedTheme.nameAr : selectedTheme.nameEn} • {selectedFont.nameAr}
              </span>
            </div>

            <div
              className="p-3.5 rounded-lg border bg-white shadow-xs transition-all"
              style={{ fontFamily: selectedFont.familyCss }}
            >
              <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-2 mb-2">
                <span className="font-extrabold text-sm text-slate-900">
                  🦅 شركة صقر الشرق للملابس - فرع المهندسين الرئيسي
                </span>
                <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                  إذن استلام #10842 (مطابق بالكامل 100%)
                </span>
              </div>
              <p className="text-xs text-slate-600 mb-2 leading-relaxed">
                {selectedFont.sampleText}
              </p>
              <div className="flex flex-wrap gap-2 text-xs font-semibold">
                <span className="px-2 py-1 rounded bg-slate-100 text-slate-700">عدد الأصناف: 45</span>
                <span className="px-2 py-1 rounded bg-blue-50 text-blue-700">الكمية المستلمة: 1,240 قطعة</span>
                <span className="px-2 py-1 rounded bg-emerald-50 text-emerald-700 font-bold">قيمة الفاتورة: 148,500.00 ج.م</span>
              </div>
            </div>
          </div>

          {/* Section 1: Themes Selection */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Palette className="w-4 h-4 text-indigo-600" />
                {isAr ? '1. اختر الثيم اللوني (Color Theme):' : '1. Choose Color Theme:'}
              </h3>
              <span className="text-xs text-slate-500 font-medium">
                {AVAILABLE_THEMES.length} {isAr ? 'ثيمات احترافية جاهزة' : 'themes available'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {AVAILABLE_THEMES.map((theme) => {
                const isSelected = config.theme === theme.id;
                return (
                  <button
                    key={theme.id}
                    onClick={() => onSetTheme(theme.id)}
                    className={`text-start p-3.5 rounded-xl border transition-all relative flex flex-col justify-between cursor-pointer ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/50 shadow-md ring-2 ring-indigo-500/20'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className={`w-5 h-5 rounded-full border border-white/40 shadow-xs ${theme.previewBg}`} />
                          <span className={`w-3.5 h-3.5 rounded-full ${theme.previewAccent}`} />
                        </div>
                        {isSelected && (
                          <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </span>
                        )}
                      </div>
                      <div className="font-bold text-xs sm:text-sm text-slate-900 mb-1">
                        {isAr ? theme.nameAr : theme.nameEn}
                      </div>
                      <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                        {isAr ? theme.descriptionAr : theme.descriptionEn}
                      </p>
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-[10px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-sm">
                        {theme.badge}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {theme.isDark ? (isAr ? 'داكن 🌙' : 'Dark') : (isAr ? 'نهاري ☀️' : 'Light')}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 2: Arabic Font Selection */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Type className="w-4 h-4 text-red-600" />
                {isAr ? '2. نوع الخط العربي (Arabic Font):' : '2. Choose Typography:'}
              </h3>
              <span className="text-xs text-slate-500 font-medium">
                {AVAILABLE_FONTS.length} {isAr ? 'خطوط عربية عالية الدقة' : 'Arabic fonts'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {AVAILABLE_FONTS.map((font) => {
                const isSelected = config.font === font.id;
                return (
                  <button
                    key={font.id}
                    onClick={() => onSetFont(font.id)}
                    className={`text-start p-3.5 rounded-xl border transition-all relative flex flex-col justify-between cursor-pointer ${
                      isSelected
                        ? 'border-red-600 bg-red-50/40 shadow-md ring-2 ring-red-500/20'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-bold text-xs sm:text-sm text-slate-900">
                          {isAr ? font.nameAr : font.nameEn}
                        </span>
                        {isSelected && (
                          <span className="w-4 h-4 rounded-full bg-red-600 text-white flex items-center justify-center">
                            <Check className="w-2.5 h-2.5 stroke-[3]" />
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 mb-2 leading-relaxed">
                        {font.descriptionAr}
                      </p>
                    </div>

                    <div
                      className="p-2 rounded-lg bg-slate-50 border border-slate-200/80 text-xs font-semibold text-slate-800"
                      style={{ fontFamily: font.familyCss }}
                    >
                      ١٢٣٤٥ • 12345 • نموذج خط
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 3: Font Scaling & Number Formatting */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            {/* Font Size Scaling */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
              <h4 className="text-xs font-bold text-slate-900 mb-2.5 flex items-center gap-2">
                <Maximize2 className="w-4 h-4 text-indigo-600" />
                {isAr ? 'حجم النصوص والشاشة (Text Scale):' : 'Display Scale:'}
              </h4>
              <div className="space-y-2">
                {fontSizeOptions.map((opt) => (
                  <label
                    key={opt.id}
                    className={`flex items-start gap-2.5 p-2 rounded-lg border cursor-pointer transition-all ${
                      config.fontSize === opt.id
                        ? 'border-indigo-600 bg-indigo-50/80 text-indigo-950 font-bold'
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="font-size"
                      checked={config.fontSize === opt.id}
                      onChange={() => onSetFontSize(opt.id)}
                      className="mt-0.5 text-indigo-600 focus:ring-indigo-500"
                    />
                    <div className="text-xs">
                      <div>{isAr ? opt.labelAr : opt.labelEn}</div>
                      <div className="text-[10px] text-slate-500 font-normal">{opt.descAr}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Tabular numbers & Options */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-900 mb-2.5 flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-red-600" />
                  {isAr ? 'تنسيق الأرقام والجداول:' : 'Tabular Numbers Alignment:'}
                </h4>

                <label className="flex items-start gap-2.5 p-3 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer transition-all">
                  <input
                    type="checkbox"
                    checked={config.tabularNums}
                    onChange={(e) => onSetTabularNums(e.target.checked)}
                    className="mt-0.5 text-red-600 rounded-sm focus:ring-red-500"
                  />
                  <div className="text-xs">
                    <span className="font-bold text-slate-800">
                      {isAr ? 'محاذاة عمودية متساوية للأرقام (Tabular Numbers)' : 'Tabular Figures (Monospaced Numbers)'}
                    </span>
                    <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                      {isAr
                        ? 'يجعل جميع الأرقام بعرض متساوٍ تماماً داخل جداول الفواتير والأسعار ليسهل المقارنة بالعين'
                        : 'Aligns invoice numbers and quantities evenly for rapid visual audit'}
                    </p>
                  </div>
                </label>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between">
                <span className="text-xs text-slate-500">
                  {isAr ? 'الحفظ فوري وتلقائي في جهازك' : 'Auto-saved locally'}
                </span>
                <button
                  onClick={onResetDefaults}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-all cursor-pointer shadow-xs active:scale-95"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                  <span>{isAr ? 'استعادة الإعدادات الافتراضية' : 'Reset to Default'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 p-4 border-t border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{isAr ? 'يتم حفظ تفضيلات الخط والثيم على هذا الجهاز فوراً' : 'Preferences saved instantly'}</span>
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 text-xs sm:text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-all cursor-pointer shadow-sm active:scale-95"
          >
            {isAr ? 'تأكيد وإغلاق' : 'Done'}
          </button>
        </div>
      </div>
    </div>
  );
};
