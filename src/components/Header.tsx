import React from 'react';
import { Volume2, VolumeX, Globe, Sparkles, FileSpreadsheet, WifiOff, Zap, Palette, Laptop } from 'lucide-react';
import { Language } from '../types';
import { SoMuchLogo } from './SoMuchLogo';
import { PWAInstallButton } from './PWAInstallButton';

interface HeaderProps {
  lang: Language;
  onToggleLang: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onLoadDemoData: () => void;
  onDownloadTemplate: () => void;
  onOpenOfflineGuide: () => void;
  onOpenThemeSettings: () => void;
  onOpenExeConverter: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  lang,
  onToggleLang,
  soundEnabled,
  onToggleSound,
  onLoadDemoData,
  onDownloadTemplate,
  onOpenOfflineGuide,
  onOpenThemeSettings,
  onOpenExeConverter,
}) => {
  const isAr = lang === 'ar';

  return (
    <header className="bg-white/95 backdrop-blur-md border border-slate-200/80 rounded-2xl shadow-sm px-4 py-3 sm:px-6 sm:py-4 mb-4 transition-all">
      <div className="flex flex-col lg:flex-row items-center justify-between gap-3 sm:gap-4">
        {/* Logo & Brand Title */}
        <div className="flex items-center gap-3.5 self-start lg:self-auto">
          {/* Official SO MUCH Logo */}
          <div className="flex-shrink-0">
            <SoMuchLogo variant="badge" className="w-28 sm:w-36 h-9 sm:h-11" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
                {isAr ? 'برنامج الاستلامات للفروع' : 'Branch Reception Hub'}
              </h1>
              <span className="hidden md:inline-block px-2 py-0.5 text-[11px] font-bold rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                SO MUCH
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                <Zap className="w-3 h-3 text-emerald-600 fill-emerald-600" />
                {isAr ? 'أوفلاين 100%' : 'Offline 100%'}
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              {isAr
                ? 'تدقيق ومطابقة فواتير وبضاعة الفروع، كشف التوالف، ومسار الحركة الذكي'
                : 'Multi-Branch Inventory Verification, Damage Tracking & Transfer Logistics'}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2 self-stretch lg:self-auto justify-end">
          {/* In-App PWA Install Button */}
          <PWAInstallButton lang={lang} onOpenOfflineGuide={onOpenOfflineGuide} />

          {/* Windows EXE Desktop App Button */}
          <button
            onClick={onOpenExeConverter}
            title={isAr ? 'تحويل وتشغيل البرنامج بصيغة EXE للكمبيوتر' : 'Windows Desktop EXE converter'}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 transition-all active:scale-95 cursor-pointer shadow-xs"
          >
            <Laptop className="w-3.5 h-3.5 text-blue-600" />
            <span className="font-bold">{isAr ? 'تحويل لـ EXE 💻' : 'EXE App 💻'}</span>
          </button>

          {/* Theme & Fonts Customizer Button */}
          <button
            onClick={onOpenThemeSettings}
            title={isAr ? 'تخصيص الثيم اللوني ونوع وحجم الخط' : 'Customize theme & fonts'}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 transition-all active:scale-95 cursor-pointer shadow-xs"
          >
            <Palette className="w-3.5 h-3.5 text-indigo-600" />
            <span>{isAr ? 'الثيم والخطوط 🎨' : 'Themes & Fonts'}</span>
          </button>

          {/* Offline Guide Button */}
          <button
            onClick={onOpenOfflineGuide}
            title={isAr ? 'دليل وكيفية عمل البرنامج أوفلاين بدون إنترنت' : 'Offline Mode Guide'}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 transition-all active:scale-95 cursor-pointer shadow-xs"
          >
            <WifiOff className="w-3.5 h-3.5 text-emerald-600" />
            <span className="hidden sm:inline">{isAr ? 'دليل الأوفلاين ⚡' : 'Offline Guide ⚡'}</span>
          </button>

          {/* Load Sample Demo */}
          <button
            onClick={onLoadDemoData}
            title={isAr ? 'تحميل بيانات تجريبية جاهزة للاختبار الفوري' : 'Load ready demo data for quick test'}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 transition-all active:scale-95 cursor-pointer shadow-xs"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>{isAr ? 'بيانات تجريبية' : 'Demo Data'}</span>
          </button>

          {/* Download Template */}
          <button
            onClick={onDownloadTemplate}
            title={isAr ? 'تحميل نموذج شيت إكسيل لتعبئته' : 'Download Excel template'}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 transition-all active:scale-95 cursor-pointer shadow-xs"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-slate-600" />
            <span className="hidden sm:inline">{isAr ? 'نموذج إكسيل' : 'Template'}</span>
          </button>

          {/* Sound Toggle */}
          <button
            onClick={onToggleSound}
            title={soundEnabled ? (isAr ? 'كتم الصوت' : 'Mute') : (isAr ? 'تشغيل الصوت' : 'Unmute')}
            className={`inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg border transition-all active:scale-95 cursor-pointer ${
              soundEnabled
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'
            }`}
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            <span className="hidden xs:inline">{soundEnabled ? (isAr ? 'صوت' : 'Sound') : (isAr ? 'صامت' : 'Muted')}</span>
          </button>

          {/* Language Toggle */}
          <button
            onClick={onToggleLang}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-slate-100 hover:bg-red-600 hover:text-white text-slate-700 border border-slate-200 hover:border-red-600 transition-all active:scale-95 cursor-pointer"
          >
            <Globe className="w-3.5 h-3.5" />
            <span>{isAr ? 'English' : 'عربي'}</span>
          </button>
        </div>
      </div>
    </header>
  );
};

