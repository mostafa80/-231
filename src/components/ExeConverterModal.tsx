import React, { useState } from 'react';
import {
  Laptop,
  Download,
  Copy,
  Check,
  FolderDown,
  Terminal,
  Zap,
  CheckCircle2,
  HardDriveDownload,
  FileCode2,
  ExternalLink,
  X,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface ExeConverterModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang?: 'ar' | 'en';
}

export const ExeConverterModal: React.FC<ExeConverterModalProps> = ({
  isOpen,
  onClose,
  lang = 'ar',
}) => {
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'pwa-quick' | 'electron-exe'>('electron-exe');
  const { isInstallable, isInstalled, install } = usePWAInstall();

  if (!isOpen) return null;

  const isAr = lang === 'ar';

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCmd(id);
    setTimeout(() => setCopiedCmd(null), 2500);
  };

  const handleDownloadBuildBat = () => {
    const batContent = `@echo off
chcp 65001 >nul
title بناء وتحويل برنامج الاستلامات إلى ملف EXE
cls
echo ==============================================================================
echo        🦅 صقر الشرق - برنامج الاستلامات للفروع والمخازن
echo         أداة بناء وتحويل البرنامج إلى ملف تشغيلي EXE لويندوز
echo ==============================================================================
echo.
echo [1/3] فحص بيئة Node.js...
where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo [خطأ] لم يتم العثور على Node.js أو npm على جهازك!
    echo يرجى تحميل وتثبيت Node.js من: https://nodejs.org
    pause
    exit /b
)
echo [2/3] بناء وتجهيز واجهة البرنامج (Vite Production Build)...
call npm run build
echo [3/3] جاري تجميع وحزم ملف EXE المستقل لنظام ويندوز 64-بت عبر electron-builder...
call npx electron-builder --win --x64
echo.
echo ==============================================================================
echo [تم بنجاح!] تم إنشاء ملف EXE داخل مجلد: dist-electron\\
echo ==============================================================================
pause
`;
    const blob = new Blob([batContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'build-exe.bat';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadRunDesktopBat = () => {
    const batContent = `@echo off
chcp 65001 >nul
title تشغيل برنامج الاستلامات للفروع كبرنامج ديسكتوب
cls
echo ==============================================================================
echo        🦅 صقر الشرق - تشغيل برنامج الاستلامات للفروع
echo ==============================================================================
if not exist "dist\\index.html" (
    echo جاري بناء ملفات الواجهة...
    call npm run build
)
call npx electron electron/main.cjs
`;
    const blob = new Blob([batContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'run-desktop.bat';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/75 backdrop-blur-xs animate-fadeIn"
      dir={isAr ? 'rtl' : 'ltr'}
    >
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white p-5 flex items-center justify-between shrink-0 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow-lg shadow-blue-950/40">
              <Laptop className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold flex items-center gap-2">
                {isAr ? 'تحويل وتشغيل البرنامج بصيغة EXE للكمبيوتر' : 'Windows EXE Desktop App Setup'}
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-600/30 text-blue-200 border border-blue-500/30">
                  Windows 64-bit Ready
                </span>
              </h2>
              <p className="text-xs text-slate-300">
                {isAr
                  ? 'تم تجهيز المشروع بالكامل لدعم حزم وتوليد ملف EXE المستقل لنظام ويندوز أو التثبيت الفوري لسطح المكتب'
                  : 'Complete ready-to-build setup for Windows Standalone Executable (.exe)'}
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

        {/* Tab Selection */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-4 pt-2 shrink-0 gap-2">
          <button
            onClick={() => setActiveTab('electron-exe')}
            className={`px-4 py-2.5 text-xs sm:text-sm font-bold rounded-t-xl transition-all cursor-pointer border-t border-x flex items-center gap-2 ${
              activeTab === 'electron-exe'
                ? 'bg-white text-blue-700 border-slate-200 -mb-px shadow-xs'
                : 'bg-transparent text-slate-600 border-transparent hover:text-slate-900'
            }`}
          >
            <Terminal className="w-4 h-4 text-blue-600" />
            <span>{isAr ? '1. حزم ملف التثبيت المستقل (.EXE عبر Electron)' : '1. Standalone Installer (.EXE)'}</span>
          </button>

          <button
            onClick={() => setActiveTab('pwa-quick')}
            className={`px-4 py-2.5 text-xs sm:text-sm font-bold rounded-t-xl transition-all cursor-pointer border-t border-x flex items-center gap-2 ${
              activeTab === 'pwa-quick'
                ? 'bg-white text-emerald-700 border-slate-200 -mb-px shadow-xs'
                : 'bg-transparent text-slate-600 border-transparent hover:text-slate-900'
            }`}
          >
            <Zap className="w-4 h-4 text-emerald-600" />
            <span>{isAr ? '2. التثبيت الفوري كبرنامج ويندوز بنقرة واحدة (PWA)' : '2. Instant 1-Click Desktop Install'}</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1 text-slate-800">
          {activeTab === 'electron-exe' ? (
            <div className="space-y-5">
              {/* Ready notice */}
              <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-4 text-xs text-blue-900 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-sm mb-1">
                    {isAr ? 'المشروع جاهز ومُجهّز بملفات Electron و Electron-Builder الرسمية!' : 'Electron & Electron-Builder fully configured!'}
                  </h4>
                  <p className="leading-relaxed">
                    {isAr
                      ? 'تم إنشاء ملف التكوين الرئيسي `electron/main.cjs` وإضافة أوامر حزم ملف الـ .EXE داخل `package.json`. يمكنك إنشاء ملف التثبيت النهائي (Setup.exe) في ثوانٍ لنقله وتشغيله على أي كمبيوتر في الفروع والمخازن بدون إنترنت.'
                      : 'The main electron configuration files and build scripts are fully installed and configured.'}
                  </p>
                </div>
              </div>

              {/* Step 1: Commands */}
              <div className="rounded-xl border border-slate-200 p-4 bg-slate-50/50 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-blue-600" />
                    <span>{isAr ? 'الخطوة 1: أمر إنشاء ملف الـ EXE في التيرمينال:' : 'Step 1: Run Build Command:'}</span>
                  </h4>
                  <span className="text-[11px] font-semibold text-slate-500">ينشئ ملف Setup.exe + نسخة Portable</span>
                </div>

                <div className="bg-slate-900 text-slate-100 rounded-lg p-3 font-mono text-xs flex items-center justify-between border border-slate-800">
                  <code>npm run build:exe</code>
                  <button
                    onClick={() => copyToClipboard('npm run build:exe', 'exe-cmd')}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white font-sans text-xs transition-all active:scale-95 cursor-pointer"
                  >
                    {copiedCmd === 'exe-cmd' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedCmd === 'exe-cmd' ? (isAr ? 'تم النسخ!' : 'Copied!') : (isAr ? 'نسخ' : 'Copy')}</span>
                  </button>
                </div>

                <p className="text-[11px] text-slate-500">
                  {isAr
                    ? 'هذا الأمر سيقوم ببناء ملفات الإنتاج وتجميعها داخل مجلد `dist-electron/` ليخرج لك ملف: `برنامج الاستلامات للفروع Setup.exe`.'
                    : 'This command will output the installer executable inside `dist-electron/`.'}
                </p>
              </div>

              {/* Step 2: 1-Click Helper files download */}
              <div className="rounded-xl border border-slate-200 p-4 bg-white space-y-3 shadow-xs">
                <h4 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-2">
                  <HardDriveDownload className="w-4 h-4 text-emerald-600" />
                  <span>{isAr ? 'الخطوة 2: تحميل ملفات البناء التلقائية لويندوز (1-Click Batch Files):' : 'Step 2: Windows 1-Click Helpers:'}</span>
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {isAr
                    ? 'يمكنك تنزيل هذه الملفات بنقرة واحدة ووضعها بجانب ملفات المشروع على جهازك؛ بمجرد الضغط مرتين على الملف سيقوم بتجميع الـ EXE بدون كتابة أي أوامر:'
                    : 'Download these helper scripts to double click on Windows:'}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <button
                    onClick={handleDownloadBuildBat}
                    className="flex items-center justify-between p-3 rounded-xl border border-blue-200 bg-blue-50/60 hover:bg-blue-100/80 text-blue-900 transition-all cursor-pointer shadow-xs active:scale-98"
                  >
                    <div className="flex items-center gap-2.5 text-start">
                      <Download className="w-5 h-5 text-blue-600" />
                      <div>
                        <div className="text-xs font-bold">تحميل build-exe.bat</div>
                        <div className="text-[10px] text-blue-700">تجميع وإنشاء ملف EXE بنقرة واحدة</div>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-200 text-blue-900">.BAT</span>
                  </button>

                  <button
                    onClick={handleDownloadRunDesktopBat}
                    className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800 transition-all cursor-pointer shadow-xs active:scale-98"
                  >
                    <div className="flex items-center gap-2.5 text-start">
                      <Download className="w-5 h-5 text-slate-600" />
                      <div>
                        <div className="text-xs font-bold">تحميل run-desktop.bat</div>
                        <div className="text-[10px] text-slate-500">تشغيل فوري كنافذة ديسكتوب محلية</div>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-200 text-slate-700">.BAT</span>
                  </button>
                </div>
              </div>

              {/* Specs & Features of the generated EXE */}
              <div className="rounded-xl border border-slate-200 p-4 bg-slate-50/40">
                <h4 className="text-xs font-bold text-slate-900 mb-2.5 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  {isAr ? 'مميزات ملف الـ EXE بعد بنائه وتثبيته:' : 'Features of the Generated EXE:'}
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span>يعمل 100% أوفلاين بدون أي اتصال بالإنترنت</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span>أيقونة مخصصة واختصار على سطح المكتب وقائمة Start</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span>نافذة مخصصة بملء الشاشة مع دعم كامل للطباعة A4 (Ctrl+P)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span>دعم جميع ماسحات الباركود اللاسلكية والـ USB السلكية</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span>حفظ دائم لجميع الجلسات والبيانات محلياً على القرص الصلب</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span>قابل للنقل على فلاشة USB وتثبيته على أي جهاز ويندوز 10/11</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* PWA Quick Option */
            <div className="space-y-5">
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4 text-xs text-emerald-900 flex items-start gap-3">
                <Zap className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-sm mb-1">
                    {isAr ? 'التثبيت الفوري كبرنامج ويندوز رسمي (أسهل وأسرع حل بدون أي أوامر!)' : 'Instant 1-Click Desktop App (Zero-setup)'}
                  </h4>
                  <p className="leading-relaxed">
                    {isAr
                      ? 'تقنية Progressive Desktop App المعتمدة من Microsoft و Google تتيح لك تثبيت هذا البرنامج كـ Standalone App على الويندوز فوراً بنقرة واحدة، وتظهر أيقونة البرنامج رسمياً على سطح المكتب وفي قائمة Start وشريط المهام.'
                      : 'Install immediately as a standalone Windows desktop app with desktop shortcut and start menu entry.'}
                  </p>
                </div>
              </div>

              <div className="p-5 rounded-xl border border-slate-200 bg-slate-50 flex flex-col items-center text-center space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-900 to-indigo-900 flex items-center justify-center shadow-lg border border-slate-700">
                  <Laptop className="w-8 h-8 text-white" />
                </div>

                <div>
                  <h3 className="font-bold text-base text-slate-900 mb-1">
                    {isInstalled
                      ? (isAr ? 'البرنامج مُثبّت بالفعل على جهازك كبرنامج سطح مكتب! ✅' : 'Already installed as desktop app! ✅')
                      : (isAr ? 'جاهز للتثبيت الفوري على جهازك' : 'Ready to install on this PC')}
                  </h3>
                  <p className="text-xs text-slate-600 max-w-md mx-auto">
                    {isAr
                      ? 'اضغط على الزر أدناه لتثبيت البرنامج مباشرة وفتح نافذة مستقلة بملء الشاشة مع كافة المميزات أوفلاين.'
                      : 'Click the button below to install the app as a standalone desktop window.'}
                  </p>
                </div>

                {!isInstalled && isInstallable && (
                  <button
                    onClick={install}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-bold text-sm shadow-md transition-all active:scale-95 cursor-pointer"
                  >
                    <Download className="w-5 h-5" />
                    <span>{isAr ? 'تثبيت البرنامج على الكمبيوتر الآن 💻' : 'Install Desktop App Now 💻'}</span>
                  </button>
                )}

                {isInstalled && (
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-100 text-emerald-800 font-bold text-xs">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>{isAr ? 'يمكنك فتحه في أي وقت من قائمة Start أو سطح المكتب' : 'Launch it anytime from Start menu or Desktop'}</span>
                  </div>
                )}
              </div>

              {/* Instructions if install prompt didn't show */}
              {!isInstalled && !isInstallable && (
                <div className="rounded-xl border border-slate-200 p-4 bg-white space-y-2 text-xs text-slate-700">
                  <h5 className="font-bold text-slate-900 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-blue-600" />
                    <span>{isAr ? 'طريقة التثبيت اليدوي من متصفح Chrome أو Edge على ويندوز:' : 'Manual Installation Steps:'}</span>
                  </h5>
                  <ol className="list-decimal list-inside space-y-1.5 text-slate-600 pr-2">
                    <li>{isAr ? 'في متصفح Google Chrome أو Microsoft Edge، انظر إلى شريط العنوان في الأعلى (Address Bar).' : 'In Chrome or Edge, check the top right address bar.'}</li>
                    <li>{isAr ? 'ستجد أيقونة صغيرة على شكل كمبيوتر أو شاشة مع سهم: «تثبيت برنامج الاستلامات للفروع».' : 'Click the install icon in the address bar.'}</li>
                    <li>{isAr ? 'أو افتح القائمة (ثلاث نقاط ⋮) واختر «تثبيت كبرنامج / Install this site as an app».' : 'Or select menu ⋮ -> Install this site as an app.'}</li>
                  </ol>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 p-4 border-t border-slate-200 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-500 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>{isAr ? 'جاهز للعمل في بيئة ويندوز أوفلاين بالكامل' : 'Windows offline-ready'}</span>
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 text-xs sm:text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-all cursor-pointer shadow-sm active:scale-95"
          >
            {isAr ? 'إغلاق' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
