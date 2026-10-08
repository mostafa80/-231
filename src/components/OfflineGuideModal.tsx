import React from 'react';
import {
  WifiOff,
  Download,
  Laptop,
  Smartphone,
  CheckCircle,
  Database,
  FileSpreadsheet,
  X,
  Zap,
  HardDriveDownload,
  Layers,
} from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface OfflineGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang?: 'ar' | 'en';
}

export const OfflineGuideModal: React.FC<OfflineGuideModalProps> = ({ isOpen, onClose, lang = 'ar' }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const isAr = lang === 'ar';

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-2xl rounded-2xl bg-slate-900 border border-slate-700 p-6 text-white shadow-2xl relative my-8 animate-in fade-in zoom-in-95">
        <button
          onClick={onClose}
          className="absolute top-4 left-4 text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3.5 mb-5 pb-4 border-b border-slate-800">
          <div className="p-3 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <WifiOff className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-lg font-black text-white flex items-center gap-2">
              {isAr ? 'دليل تشغيل البرنامج أوفلاين (بدون إنترنت)' : 'Offline Operation Guide'}
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                100% Offline Ready
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {isAr
                ? 'كيف يعمل برنامج الاستلامات في الفروع والمخازن بدون أي اتصال بالإنترنت'
                : 'How to use branch reception offline with zero internet'}
            </p>
          </div>
        </div>

        {/* Quick Action: Install App */}
        <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-950/60 to-slate-800/80 border border-emerald-500/30 mb-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1 text-center sm:text-right">
            <p className="text-sm font-bold text-white flex items-center gap-2 justify-center sm:justify-start">
              <Zap className="w-4 h-4 text-emerald-400 fill-emerald-400" />
              {isAr ? 'تثبيت البرنامج كتطبيق سطح مكتب أو هاتف' : 'Install as Standalone App'}
            </p>
            <p className="text-xs text-slate-300">
              {isAr
                ? 'يفتح البرنامج بنقرة واحدة من سطح المكتب ويعمل بدون متصفح وبدون إنترنت.'
                : 'Launches directly from desktop or phone screen without internet.'}
            </p>
          </div>

          {isInstalled ? (
            <div className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold whitespace-nowrap">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              <span>{isAr ? 'البرنامج مثبت بالفعل' : 'Already Installed'}</span>
            </div>
          ) : isInstallable ? (
            <button
              onClick={async () => {
                await install();
              }}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg transition whitespace-nowrap cursor-pointer active:scale-95"
            >
              <Download className="w-4 h-4" />
              <span>{isAr ? 'تثبيت البرنامج الآن' : 'Install App Now'}</span>
            </button>
          ) : (
            <div className="text-xs text-slate-400 text-center sm:text-right">
              {isAr ? 'اضغط أيقونة التثبيت في شريط العنوان' : 'Click install icon in browser address bar'}
            </div>
          )}
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-5">
          <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-1.5">
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <h4 className="text-xs font-bold text-white">
              {isAr ? 'قراءة وتصدير الإكسيل محلياً' : 'Local Excel Processing'}
            </h4>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              {isAr
                ? 'قراءة فواتير البيع وتوليد شيتات الإكسيل الثلاثية تتم 100% داخل جهازك دون رفع أي ملف لخادم خارجي.'
                : 'All parsing and multi-sheet exports run client-side without any server calls.'}
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-1.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
              <Database className="w-4 h-4" />
            </div>
            <h4 className="text-xs font-bold text-white">
              {isAr ? 'حفظ تلقائي في الذاكرة' : 'Offline Data Storage'}
            </h4>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              {isAr
                ? 'يتم تخزين جميع جلسات الاستلام والمطابقات في LocalStorage لجهازك وتبقى محفوظة حتى بعد إغلاق الجهاز.'
                : 'Sessions and scan records persist in offline storage across restarts.'}
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-1.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
              <Layers className="w-4 h-4" />
            </div>
            <h4 className="text-xs font-bold text-white">
              {isAr ? 'كاش كامل للملفات (PWA)' : 'PWA Cache Engine'}
            </h4>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              {isAr
                ? 'Service Worker يقوم بتخزين ملفات البرنامج، الأصوات، والخطوط لتعمل حتى عند قطع الإنترنت تماماً.'
                : 'Service worker caches code, assets, audio, and styles for complete offline operation.'}
            </p>
          </div>
        </div>

        {/* Steps for devices */}
        <div className="space-y-3 bg-slate-800/40 p-4 rounded-xl border border-slate-700/60 text-xs">
          <h4 className="font-bold text-slate-200 flex items-center gap-2">
            <Laptop className="w-4 h-4 text-emerald-400" />
            {isAr ? 'خطوات التثبيت والاستخدام على الكمبيوتر واللابتوب:' : 'Desktop / Laptop Setup:'}
          </h4>
          <ol className="list-decimal list-inside space-y-1.5 text-slate-300 pr-1">
            <li>
              {isAr
                ? 'اضغط على زر «تثبيت البرنامج أوفلاين 📲» في أعلى الصفحة أو علامة التثبيت (➕ أو 💻) في شريط متصفح Chrome / Edge.'
                : 'Click "Install Offline App" button or the install icon in Chrome / Edge toolbar.'}
            </li>
            <li>
              {isAr
                ? 'سيتم إضافة أيقونة «برنامج الاستلامات» على سطح المكتب وقائمة Start.'
                : 'The app icon will be added to your desktop and start menu.'}
            </li>
            <li>
              {isAr
                ? 'افصل الإنترنت تماماً وافتح البرنامج؛ ستجده يفتح فوراً ويعمل بكامل وظائفه دون أي بطء أو انقطاع!'
                : 'Disconnect your internet and launch it; everything functions seamlessly offline.'}
            </li>
          </ol>
        </div>

        {/* Footer */}
        <div className="mt-5 flex items-center justify-between pt-4 border-t border-slate-800">
          <span className="text-[11px] text-emerald-400 font-medium flex items-center gap-1.5">
            <CheckCircle className="w-3.5 h-3.5" />
            {isAr ? 'نظام استلامات معتمد أوفلاين 100%' : '100% Offline Certified'}
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition"
          >
            {isAr ? 'إغلاق' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
