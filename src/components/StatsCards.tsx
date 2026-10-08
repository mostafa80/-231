import React from 'react';
import { Package, CheckCheck, CheckCircle2, AlertOctagon, Scale, Coins, Boxes } from 'lucide-react';
import { Session, Language } from '../types';

interface StatsCardsProps {
  session: Session | null;
  lang: Language;
}

export const StatsCards: React.FC<StatsCardsProps> = ({ session, lang }) => {
  const isAr = lang === 'ar';

  if (!session) return null;

  const totalItems = Object.keys(session.inventoryMap).length;
  const countedList = Object.values(session.jardData);

  const totalReceivedPieces = countedList.reduce((s, i) => s + (i.countedQty || 0), 0);
  let totalSound = 0;
  let totalDamaged = 0;
  let matchCount = 0;
  let extraCount = 0;
  let lessCount = 0;
  let totalValue = 0;

  countedList.forEach((item) => {
    totalSound += item.soundQty || 0;
    totalDamaged += item.damagedQty || 0;
    if (item.countedQty === item.systemQty) {
      matchCount++;
    } else if (item.countedQty > item.systemQty) {
      extraCount++;
    } else {
      lessCount++;
    }
    totalValue += (item.countedQty || 0) * (item.price || 0);
  });

  // Items in return that haven't been counted yet (uncounted are shortages)
  const uncountedLess = Object.values(session.inventoryMap).filter(
    (item) => !session.jardData[item.code.toUpperCase()] && item.systemQty > 0
  ).length;

  const totalShortageLines = lessCount + uncountedLess;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5 mb-4">
      {/* 1. Distinct items */}
      <div className="bg-gradient-to-br from-red-700 to-red-800 text-white rounded-xl p-3 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between text-red-200">
          <span className="text-[11px] font-bold">{isAr ? 'أصناف الإذن' : 'Total Items'}</span>
          <Boxes className="w-4 h-4" />
        </div>
        <div className="text-xl sm:text-2xl font-black mt-1 text-white">{totalItems}</div>
      </div>

      {/* 2. Total received pieces */}
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 text-white rounded-xl p-3 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-300">
          <span className="text-[11px] font-bold">{isAr ? 'إجمالي المستلم' : 'Total Received'}</span>
          <Package className="w-4 h-4 text-slate-300" />
        </div>
        <div className="text-xl sm:text-2xl font-black mt-1 text-white">{totalReceivedPieces}</div>
      </div>

      {/* 3. Sound items */}
      <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 text-white rounded-xl p-3 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between text-emerald-100">
          <span className="text-[11px] font-bold">{isAr ? 'المستلم سليم' : 'Sound (Clean)'}</span>
          <CheckCircle2 className="w-4 h-4" />
        </div>
        <div className="text-xl sm:text-2xl font-black mt-1 text-white">{totalSound}</div>
      </div>

      {/* 4. Damaged items */}
      <div className="bg-gradient-to-br from-amber-600 to-amber-700 text-white rounded-xl p-3 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between text-amber-100">
          <span className="text-[11px] font-bold">{isAr ? 'المستلم متلف' : 'Damaged / Defect'}</span>
          <AlertOctagon className="w-4 h-4" />
        </div>
        <div className="text-xl sm:text-2xl font-black mt-1 text-white">{totalDamaged}</div>
      </div>

      {/* 5. Matched items */}
      <div className="bg-gradient-to-br from-cyan-700 to-cyan-800 text-white rounded-xl p-3 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between text-cyan-200">
          <span className="text-[11px] font-bold">{isAr ? 'مطابق للإذن' : 'Matched Lines'}</span>
          <CheckCheck className="w-4 h-4" />
        </div>
        <div className="text-xl sm:text-2xl font-black mt-1 text-white">{matchCount}</div>
      </div>

      {/* 6. Shortage / Surplus */}
      <div className="bg-gradient-to-br from-indigo-700 to-indigo-800 text-white rounded-xl p-3 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between text-indigo-200">
          <span className="text-[11px] font-bold">{isAr ? 'العجز / الفائض' : 'Diff Status'}</span>
          <Scale className="w-4 h-4" />
        </div>
        <div className="text-sm sm:text-base font-black mt-1 text-white truncate">
          <span className="text-amber-300">+{extraCount}</span>
          <span className="text-white/60 mx-1">/</span>
          <span className="text-rose-300">-{totalShortageLines}</span>
        </div>
      </div>

      {/* 7. Total Value in EGP */}
      <div className="bg-gradient-to-br from-rose-700 to-rose-900 text-white rounded-xl p-3 shadow-xs flex flex-col justify-between col-span-2 sm:col-span-2 lg:col-span-1">
        <div className="flex items-center justify-between text-rose-200">
          <span className="text-[11px] font-bold">{isAr ? 'قيمة المستلم' : 'Received Value'}</span>
          <Coins className="w-4 h-4" />
        </div>
        <div className="text-base sm:text-lg font-black mt-1 text-white truncate">
          {Math.round(totalValue).toLocaleString()}{' '}
          <span className="text-[10px] font-normal text-rose-200">{isAr ? 'ج.م' : 'EGP'}</span>
        </div>
      </div>
    </div>
  );
};
