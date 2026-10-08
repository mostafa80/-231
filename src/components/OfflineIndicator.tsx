import React from 'react';
import { WifiOff, Wifi, Info, ShieldCheck } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

interface OfflineIndicatorProps {
  onOpenOfflineGuide?: () => void;
  lang?: 'ar' | 'en';
}

export const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({ onOpenOfflineGuide, lang = 'ar' }) => {
  const isOnline = useOnlineStatus();

  if (isOnline) {
    return null;
  }

  const isAr = lang === 'ar';

  return (
    <aside
      aria-label={isAr ? 'حالة العمل بدون إنترنت' : 'Offline Status'}
      className="fixed bottom-4 left-4 z-50 flex items-center gap-2.5 rounded-xl bg-slate-900/95 text-white px-4 py-2.5 shadow-2xl border border-emerald-500/40 backdrop-blur-md transition-all animate-bounce-subtle"
    >
      <div className="relative flex items-center justify-center">
        <span className="absolute h-3 w-3 rounded-full bg-emerald-400 opacity-75 animate-ping" />
        <span className="relative flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
      </div>

      <div className="flex items-center gap-2 text-xs">
        <div className="flex items-center gap-1 text-emerald-400 font-bold">
          <WifiOff className="w-4 h-4" />
          <span>{isAr ? 'وضع الأوفلاين نشط ⚡' : 'Offline Mode Active ⚡'}</span>
        </div>
        <span className="text-slate-300 hidden sm:inline">
          {isAr
            ? 'البرنامج يعمل 100% بدون إنترنت (فحص، مسح، حفظ، تصدير)'
            : 'Working 100% offline (scan, check, save, export)'}
        </span>
      </div>

      {onOpenOfflineGuide && (
        <button
          onClick={onOpenOfflineGuide}
          className="mr-1 text-[11px] bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 px-2.5 py-1 rounded-lg border border-emerald-500/30 font-medium transition"
        >
          {isAr ? 'تفاصيل الأوفلاين' : 'Details'}
        </button>
      )}
    </aside>
  );
};
