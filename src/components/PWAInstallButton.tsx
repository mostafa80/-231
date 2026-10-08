import React, { useState } from 'react';
import { Download, Smartphone, CheckCircle, Info, Laptop, WifiOff, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  lang?: 'ar' | 'en';
  onOpenOfflineGuide?: () => void;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ lang = 'ar', onOpenOfflineGuide }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const isAr = lang === 'ar';

  const handleInstallClick = async () => {
    if (isInstallable) {
      setIsInstalling(true);
      try {
        await install();
      } finally {
        setIsInstalling(false);
      }
    } else if (isIOS) {
      setShowIOSGuide(true);
    } else if (onOpenOfflineGuide) {
      onOpenOfflineGuide();
    }
  };

  // If already running as an installed PWA standalone app
  if (isInstalled) {
    return (
      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
        <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
        <span>{isAr ? 'تطبيق مثبت (أوفلاين جاهز)' : 'Installed PWA (Offline Ready)'}</span>
      </div>
    );
  }

  return (
    <>
      <button
        onClick={handleInstallClick}
        disabled={isInstalling}
        title={isAr ? 'تثبيت البرنامج للعمل بدون إنترنت (أوفلاين)' : 'Install app for offline work'}
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-md hover:shadow-emerald-500/20 transition-all border border-emerald-400/30 cursor-pointer active:scale-95"
      >
        <Download className="w-3.5 h-3.5 animate-pulse" />
        <span>{isAr ? 'تثبيت البرنامج أوفلاين 📲' : 'Install Offline App 📲'}</span>
      </button>

      {/* iOS Safari Guide Modal */}
      {showIOSGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-700 p-6 text-white shadow-2xl relative animate-in fade-in zoom-in-95">
            <button
              onClick={() => setShowIOSGuide(false)}
              className="absolute top-4 left-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <Smartphone className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-base text-white">
                  {isAr ? 'تثبيت البرنامج على iPhone / iPad' : 'Install on iPhone / iPad'}
                </h3>
                <p className="text-xs text-slate-400">
                  {isAr ? 'ليعمل كتطبيق أوفلاين بدون متصفح' : 'Run as offline standalone app'}
                </p>
              </div>
            </div>

            <div className="space-y-3 text-xs text-slate-300 bg-slate-800/60 p-4 rounded-xl border border-slate-700/60">
              <div className="flex items-start gap-2.5">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center text-xs">
                  1
                </span>
                <p>
                  {isAr ? (
                    <>
                      اضغط على زر <strong>المشاركة (Share <span className="text-emerald-400">⎋</span>)</strong> في شريط متصفح سفاري بالأسفل.
                    </>
                  ) : (
                    'Tap the Share button in Safari toolbar.'
                  )}
                </p>
              </div>

              <div className="flex items-start gap-2.5">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center text-xs">
                  2
                </span>
                <p>
                  {isAr ? (
                    <>
                      مرر للأسفل واختر <strong>«إضافة إلى الشاشة الرئيسية» (Add to Home Screen)</strong>.
                    </>
                  ) : (
                    'Scroll down and tap "Add to Home Screen".'
                  )}
                </p>
              </div>

              <div className="flex items-start gap-2.5">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center text-xs">
                  3
                </span>
                <p>
                  {isAr
                    ? 'اضغط إضافة في الأعلى، وستظهر أيقونة البرنامج فوراً وتعمل بدون إنترنت!'
                    : 'Tap Add at top right, and the app will work fully offline!'}
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowIOSGuide(false)}
              className="mt-5 w-full rounded-xl bg-emerald-600 hover:bg-emerald-500 py-2.5 text-xs font-bold text-white transition shadow-lg"
            >
              {isAr ? 'فهمت، تم' : 'Got it'}
            </button>
          </div>
        </div>
      )}
    </>
  );
};
