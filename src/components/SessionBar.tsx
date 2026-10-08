import React from 'react';
import { Search, Plus, X, Truck, Package, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Session, Language } from '../types';

interface SessionBarProps {
  sessions: Session[];
  activeSessionId: string | null;
  onSelectSession: (id: string) => void;
  onCloseSession: (id: string, e: React.MouseEvent) => void;
  onAddNewSession: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  lang: Language;
}

export const SessionBar: React.FC<SessionBarProps> = ({
  sessions,
  activeSessionId,
  onSelectSession,
  onCloseSession,
  onAddNewSession,
  searchQuery,
  onSearchChange,
  lang,
}) => {
  const isAr = lang === 'ar';

  const filteredSessions = sessions.filter((s) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const branchMatch = (s.returnMeta.branch || '').toLowerCase().includes(q);
    const numMatch = (s.returnMeta.returnNo || '').toLowerCase().includes(q);
    const titleMatch = s.title.toLowerCase().includes(q);
    const notesMatch = (s.returnMeta.notes || '').toLowerCase().includes(q);
    return branchMatch || numMatch || titleMatch || notesMatch;
  });

  return (
    <div className="space-y-2 mb-4">
      {/* Search & Direct Dropdown */}
      <div className="flex flex-col sm:flex-row items-center gap-2 bg-white p-2.5 rounded-xl border border-slate-200 shadow-xs">
        <div className="relative flex-1 w-full">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 rtl:right-3 ltr:left-3 ltr:right-auto" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={
              isAr
                ? '🔎 ابحث برقم الإذن (مثال: 4476) أو اسم الفرع (مثال: سيتي ستارز)...'
                : '🔎 Search return # (e.g. 4476) or branch name (e.g. Citystars)...'
            }
            className="w-full text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg py-2 rtl:pr-9 rtl:pl-3 ltr:pl-9 ltr:pr-3 focus:bg-white focus:border-red-600 focus:ring-2 focus:ring-red-100 transition-all outline-hidden"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={activeSessionId || ''}
            onChange={(e) => e.target.value && onSelectSession(e.target.value)}
            className="w-full sm:w-64 text-xs font-semibold py-2 px-3 bg-white border border-slate-200 rounded-lg text-slate-800 focus:border-red-600 focus:ring-2 focus:ring-red-100 transition-all outline-hidden cursor-pointer"
          >
            <option value="">
              {isAr ? '📂 اختر أو انتقل لإذن محدد...' : '📂 Jump to specific return...'}
            </option>
            {filteredSessions.map((s) => {
              const prefix = s.returnMeta.returnNo ? `#${s.returnMeta.returnNo} - ` : '';
              const icon = s.routeInfo.isTransfer ? '🚚' : s.routeInfo.isDamaged ? '⚠️' : '📦';
              const statusTag = s.isCompleted ? (isAr ? ' [✅ تم الاستلام]' : ' [✅ Completed]') : '';
              return (
                <option key={s.id} value={s.id}>
                  {icon} {prefix}
                  {s.returnMeta.branch || s.title}
                  {statusTag}
                </option>
              );
            })}
          </select>

          <button
            onClick={onAddNewSession}
            title={isAr ? 'إنشاء إذن مرتجع يدوي جديد' : 'Add custom return tab'}
            className="flex-shrink-0 inline-flex items-center gap-1 px-3 py-2 text-xs font-bold rounded-lg bg-red-600 hover:bg-red-700 text-white shadow-xs transition-all active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">{isAr ? 'إذن جديد' : 'New Return'}</span>
          </button>
        </div>
      </div>

      {/* Horizontally Scrollable Tabs Strip */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 pt-0.5 scrollbar-thin">
        {sessions.map((s) => {
          const isActive = s.id === activeSessionId;
          const route = s.routeInfo;
          const isDone = s.isCompleted;

          // Color coding: green when completed!
          let tabClasses = '';
          if (isDone) {
            tabClasses = isActive
              ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm shadow-emerald-200 ring-2 ring-emerald-400'
              : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border-emerald-300';
          } else {
            tabClasses = isActive
              ? 'bg-red-700 text-white border-red-700 shadow-sm shadow-red-200'
              : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200 hover:border-red-300';
          }

          return (
            <div
              key={s.id}
              onClick={() => onSelectSession(s.id)}
              className={`group flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer transition-all border select-none ${tabClasses}`}
            >
              {/* Movement Type Icon or Green Checkmark */}
              {isDone ? (
                <CheckCircle2 className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-emerald-600'}`} />
              ) : route.isTransfer ? (
                <Truck className={`w-3.5 h-3.5 ${isActive ? 'text-amber-300' : 'text-blue-500'}`} />
              ) : route.isDamaged ? (
                <AlertTriangle className={`w-3.5 h-3.5 ${isActive ? 'text-amber-300' : 'text-amber-500'}`} />
              ) : (
                <Package className={`w-3.5 h-3.5 ${isActive ? 'text-rose-200' : 'text-red-600'}`} />
              )}

              {/* Title & Items Count */}
              <span>
                {s.returnMeta.returnNo ? `#${s.returnMeta.returnNo} - ` : ''}
                {s.returnMeta.branch || s.title}
              </span>

              {isDone && (
                <span className={`text-[10px] px-1 py-0.2 rounded font-black ${
                  isActive ? 'bg-emerald-800 text-emerald-100' : 'bg-emerald-200 text-emerald-800'
                }`}>
                  {isAr ? 'مستلم' : 'Received'}
                </span>
              )}

              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                  isActive
                    ? isDone ? 'bg-emerald-800 text-emerald-100' : 'bg-red-800 text-red-100'
                    : isDone ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {Object.keys(s.inventoryMap).length}
              </span>

              {/* Close Button if more than 1 tab */}
              {sessions.length > 1 && (
                <button
                  type="button"
                  onClick={(e) => onCloseSession(s.id, e)}
                  title={isAr ? 'إغلاق هذا الإذن' : 'Close tab'}
                  className={`p-0.5 rounded-full hover:bg-black/20 transition-all ${
                    isActive ? 'text-white/80 hover:text-white' : 'text-slate-400 hover:text-slate-700'
                  }`}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
