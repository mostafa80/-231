import React, { useMemo } from 'react';
import {
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  CheckCircle2,
  Clock,
  CheckCheck,
  Edit2,
  FileSpreadsheet,
  AlertOctagon,
  Sparkles,
  ShoppingBag,
} from 'lucide-react';
import { Session, FilterType, Language } from '../types';

interface InvoiceDiscrepancyInspectorProps {
  session: Session | null;
  onEditItem: (code: string) => void;
  onFilterSelect: (filter: FilterType) => void;
  currentFilter: FilterType;
  onQuickMatchAll?: () => void;
  onResetCounts?: () => void;
  lang: Language;
}

export const InvoiceDiscrepancyInspector: React.FC<InvoiceDiscrepancyInspectorProps> = ({
  session,
  onEditItem,
  onFilterSelect,
  currentFilter,
  onQuickMatchAll,
  onResetCounts,
  lang,
}) => {
  const isAr = lang === 'ar';

  const analysis = useMemo(() => {
    if (!session || Object.keys(session.inventoryMap).length === 0) {
      return null;
    }

    const items = Object.values(session.inventoryMap);
    const totalItemsCount = items.length;

    let totalSystemQty = 0;
    let totalSystemAmount = 0;

    let totalCountedPieces = 0;
    let totalSoundPieces = 0;
    let totalDamagedPieces = 0;
    let totalReceivedAmount = 0;

    let matchLines = 0;
    let shortageLines = 0;
    let surplusLines = 0;
    let uncountedLines = 0;

    let totalShortagePieces = 0;
    let totalShortageSaleValue = 0;

    let totalSurplusPieces = 0;
    let totalSurplusSaleValue = 0;

    const discrepantItems: {
      code: string;
      itemName: string;
      systemQty: number;
      countedQty: number;
      soundQty: number;
      damagedQty: number;
      diff: number;
      price: number;
      diffValue: number;
      type: 'shortage' | 'surplus' | 'uncounted';
    }[] = [];

    items.forEach((it) => {
      const key = it.code.toUpperCase();
      const j = session.jardData[key];
      const price = it.price || 0;

      totalSystemQty += it.systemQty;
      totalSystemAmount += it.systemQty * price;

      if (!j) {
        if (it.systemQty > 0) {
          uncountedLines++;
          shortageLines++;
          totalShortagePieces += it.systemQty;
          const lossVal = it.systemQty * price;
          totalShortageSaleValue += lossVal;

          discrepantItems.push({
            code: it.code,
            itemName: it.itemName,
            systemQty: it.systemQty,
            countedQty: 0,
            soundQty: 0,
            damagedQty: 0,
            diff: -it.systemQty,
            price,
            diffValue: lossVal,
            type: 'uncounted',
          });
        }
      } else {
        const sound = j.soundQty || 0;
        const damaged = j.damagedQty || 0;
        const counted = j.countedQty || 0;

        totalCountedPieces += counted;
        totalSoundPieces += sound;
        totalDamagedPieces += damaged;
        totalReceivedAmount += counted * price;

        const diff = counted - it.systemQty;

        if (diff === 0) {
          matchLines++;
        } else if (diff < 0) {
          shortageLines++;
          const shortPcs = Math.abs(diff);
          const shortVal = shortPcs * price;
          totalShortagePieces += shortPcs;
          totalShortageSaleValue += shortVal;

          discrepantItems.push({
            code: it.code,
            itemName: it.itemName,
            systemQty: it.systemQty,
            countedQty: counted,
            soundQty: sound,
            damagedQty: damaged,
            diff,
            price,
            diffValue: shortVal,
            type: 'shortage',
          });
        } else {
          surplusLines++;
          const surpPcs = diff;
          const surpVal = surpPcs * price;
          totalSurplusPieces += surpPcs;
          totalSurplusSaleValue += surpVal;

          discrepantItems.push({
            code: it.code,
            itemName: it.itemName,
            systemQty: it.systemQty,
            countedQty: counted,
            soundQty: sound,
            damagedQty: damaged,
            diff,
            price,
            diffValue: surpVal,
            type: 'surplus',
          });
        }
      }
    });

    const isFullyMatched =
      totalItemsCount > 0 &&
      matchLines === totalItemsCount &&
      totalShortagePieces === 0 &&
      totalSurplusPieces === 0;

    const hasDifferences = totalShortagePieces > 0 || totalSurplusPieces > 0;
    const isPendingInspection = totalCountedPieces === 0;

    return {
      totalItemsCount,
      totalSystemQty,
      totalSystemAmount,
      totalCountedPieces,
      totalSoundPieces,
      totalDamagedPieces,
      totalReceivedAmount,
      matchLines,
      shortageLines,
      surplusLines,
      uncountedLines,
      totalShortagePieces,
      totalShortageSaleValue,
      totalSurplusPieces,
      totalSurplusSaleValue,
      discrepantItems,
      isFullyMatched,
      hasDifferences,
      isPendingInspection,
    };
  }, [session]);

  if (!session || !analysis) return null;

  const branchName = session.returnMeta.branch || 'فاتورة الفرع';
  const invoiceNo = session.returnMeta.returnNo || '3925';
  const keeper = session.returnMeta.keeper || '';

  return (
    <section className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-4 sm:p-5 mb-4">
      {/* 1. Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-3.5 mb-3.5 border-b border-slate-100 gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-600 text-white flex items-center justify-center font-black shadow-xs">
            <ShoppingBag className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base sm:text-lg font-black text-slate-900">
                {isAr ? `كاشف وفاحص فوارق الفاتورة | ${branchName}` : `Invoice Discrepancies Radar | ${branchName}`}
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200 font-mono">
                #{invoiceNo}
              </span>
              {keeper && (
                <span className="text-xs font-semibold text-slate-500">
                  ({isAr ? `المندوب: ${keeper}` : `Salesperson: ${keeper}`})
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              {isAr
                ? 'تحليل تلقائي فوري لكميات فاتورة البيع ومقارنتها بالمستلم الفعلي لحساب الفوارق بدقة'
                : 'Real-time automatic audit of sales invoice items vs actual received counts'}
            </p>
          </div>
        </div>

        {/* Global Verdict Badge */}
        <div>
          {analysis.isFullyMatched ? (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-black shadow-2xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-700" />
              <span>{isAr ? '🟢 الفاتورة مطابقة بالكامل 100% (لا توجد فوارق)' : '🟢 100% Matched! No Discrepancies'}</span>
            </div>
          ) : analysis.isPendingInspection ? (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-100 text-sky-800 border border-sky-300 text-xs font-black shadow-2xs">
              <Clock className="w-4 h-4 text-sky-700" />
              <span>{isAr ? '🔵 بانتظار بدء الاستلام والفحص' : '🔵 Pending Inspection & Scanning'}</span>
            </div>
          ) : analysis.hasDifferences ? (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-100 text-rose-800 border border-rose-300 text-xs font-black shadow-2xs animate-pulse">
              <AlertTriangle className="w-4 h-4 text-rose-700" />
              <span>
                {isAr
                  ? `🚨 تنبيه: يوجد فوارق ظاهرية (${analysis.totalShortagePieces > 0 ? `عجز: -${analysis.totalShortagePieces}` : ''}${analysis.totalSurplusPieces > 0 ? ` | زيادة: +${analysis.totalSurplusPieces}` : ''})`
                  : `🚨 Discrepancies Found! (Shortage: -${analysis.totalShortagePieces} | Surplus: +${analysis.totalSurplusPieces})`}
              </span>
            </div>
          ) : null}
        </div>
      </div>

      {/* 2. Key Metrics Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 mb-4">
        {/* Card 1: Total Invoice System Qty */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-col justify-between">
          <span className="text-[11px] font-bold text-slate-500">{isAr ? 'كمية الفاتورة' : 'Invoice Total'}</span>
          <div className="mt-1">
            <span className="text-lg sm:text-xl font-black text-slate-900">{analysis.totalSystemQty}</span>
            <span className="text-[11px] font-bold text-slate-500 mx-1">{isAr ? 'قطعة' : 'pcs'}</span>
          </div>
          <span className="text-[10px] font-semibold text-slate-500 mt-0.5 truncate">
            {Math.round(analysis.totalSystemAmount).toLocaleString()} {isAr ? 'ج.م' : 'EGP'}
          </span>
        </div>

        {/* Card 2: Actual Received Count */}
        <div className="bg-slate-900 text-white rounded-xl p-3 flex flex-col justify-between shadow-xs">
          <span className="text-[11px] font-bold text-slate-300">{isAr ? 'المستلم الفعلي' : 'Actual Counted'}</span>
          <div className="mt-1">
            <span className="text-lg sm:text-xl font-black text-white">{analysis.totalCountedPieces}</span>
            <span className="text-[11px] font-bold text-slate-300 mx-1">{isAr ? 'قطعة' : 'pcs'}</span>
          </div>
          <span className="text-[10px] font-semibold text-slate-300 mt-0.5 truncate">
            {Math.round(analysis.totalReceivedAmount).toLocaleString()} {isAr ? 'ج.م' : 'EGP'}
          </span>
        </div>

        {/* Card 3: Shortage (العجز) */}
        <div className={`rounded-xl p-3 flex flex-col justify-between border transition-all ${
          analysis.totalShortagePieces > 0
            ? 'bg-rose-50 border-rose-300 text-rose-900 shadow-2xs'
            : 'bg-slate-50/70 border-slate-200 text-slate-600'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold">{isAr ? '🔻 إجمالي العجز' : '🔻 Shortage'}</span>
            <TrendingDown className={`w-3.5 h-3.5 ${analysis.totalShortagePieces > 0 ? 'text-rose-600' : 'text-slate-400'}`} />
          </div>
          <div className="mt-1">
            <span className={`text-lg sm:text-xl font-black ${analysis.totalShortagePieces > 0 ? 'text-rose-700' : 'text-slate-500'}`}>
              {analysis.totalShortagePieces > 0 ? `-${analysis.totalShortagePieces}` : '0'}
            </span>
            <span className="text-[11px] font-bold mx-1">{isAr ? 'قطعة' : 'pcs'}</span>
          </div>
          <span className="text-[10px] font-bold text-rose-700 mt-0.5 truncate">
            {analysis.totalShortageSaleValue > 0 ? `${Math.round(analysis.totalShortageSaleValue).toLocaleString()} ج.م بالبيع` : 'لا يوجد عجز'}
          </span>
        </div>

        {/* Card 4: Surplus (الزيادة) */}
        <div className={`rounded-xl p-3 flex flex-col justify-between border transition-all ${
          analysis.totalSurplusPieces > 0
            ? 'bg-amber-50 border-amber-300 text-amber-900 shadow-2xs'
            : 'bg-slate-50/70 border-slate-200 text-slate-600'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold">{isAr ? '🔺 إجمالي الزيادة' : '🔺 Surplus'}</span>
            <TrendingUp className={`w-3.5 h-3.5 ${analysis.totalSurplusPieces > 0 ? 'text-amber-600' : 'text-slate-400'}`} />
          </div>
          <div className="mt-1">
            <span className={`text-lg sm:text-xl font-black ${analysis.totalSurplusPieces > 0 ? 'text-amber-700' : 'text-slate-500'}`}>
              {analysis.totalSurplusPieces > 0 ? `+${analysis.totalSurplusPieces}` : '0'}
            </span>
            <span className="text-[11px] font-bold mx-1">{isAr ? 'قطعة' : 'pcs'}</span>
          </div>
          <span className="text-[10px] font-bold text-amber-700 mt-0.5 truncate">
            {analysis.totalSurplusSaleValue > 0 ? `${Math.round(analysis.totalSurplusSaleValue).toLocaleString()} ج.م بالبيع` : 'لا توجد زيادة'}
          </span>
        </div>

        {/* Card 5: Matched Lines */}
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl p-3 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold">{isAr ? '✓ الأصناف المطابقة' : '✓ Matched Items'}</span>
            <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div className="mt-1">
            <span className="text-lg sm:text-xl font-black text-emerald-700">{analysis.matchLines}</span>
            <span className="text-[11px] font-bold text-emerald-800 mx-1">
              / {analysis.totalItemsCount}
            </span>
          </div>
          <span className="text-[10px] font-bold text-emerald-700 mt-0.5">
            {isAr ? 'مطابق تماماً' : 'Matched 100%'}
          </span>
        </div>

        {/* Card 6: Damaged Pieces */}
        <div className={`rounded-xl p-3 flex flex-col justify-between border ${
          analysis.totalDamagedPieces > 0
            ? 'bg-rose-50 border-rose-300 text-rose-900'
            : 'bg-slate-50 border-slate-200 text-slate-600'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold">{isAr ? '⚠️ التوالف' : '⚠️ Damaged'}</span>
            <AlertOctagon className="w-3.5 h-3.5 text-rose-600" />
          </div>
          <div className="mt-1">
            <span className="text-lg sm:text-xl font-black text-rose-700">{analysis.totalDamagedPieces}</span>
            <span className="text-[11px] font-bold mx-1">{isAr ? 'قطعة' : 'pcs'}</span>
          </div>
          <span className="text-[10px] font-bold text-rose-700 mt-0.5">
            {analysis.totalDamagedPieces > 0 ? (isAr ? 'تالف معتمد' : 'Defect Items') : (isAr ? 'سليم بالكامل' : 'None')}
          </span>
        </div>
      </div>

      {/* 3. Filter Navigation & Quick Actions Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 p-3 bg-slate-50 border border-slate-200 rounded-xl">
        {/* Quick Filter Buttons */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-extrabold text-slate-700 me-1">
            {isAr ? 'تصفية سريعة:' : 'Quick Filters:'}
          </span>

          <button
            type="button"
            onClick={() => onFilterSelect('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              currentFilter === 'all'
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
            }`}
          >
            {isAr ? `كل الأصناف (${analysis.totalItemsCount})` : `All (${analysis.totalItemsCount})`}
          </button>

          <button
            type="button"
            onClick={() => onFilterSelect('less')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              currentFilter === 'less'
                ? 'bg-rose-700 text-white shadow-2xs ring-2 ring-rose-300'
                : 'bg-white text-rose-700 border border-rose-200 hover:bg-rose-50'
            }`}
          >
            {isAr ? `🔻 العجز فقط (${analysis.shortageLines})` : `🔻 Shortages (${analysis.shortageLines})`}
          </button>

          <button
            type="button"
            onClick={() => onFilterSelect('extra')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              currentFilter === 'extra'
                ? 'bg-amber-700 text-white shadow-2xs ring-2 ring-amber-300'
                : 'bg-white text-amber-800 border border-amber-200 hover:bg-amber-50'
            }`}
          >
            {isAr ? `🔺 الزيادة فقط (${analysis.surplusLines})` : `🔺 Surpluses (${analysis.surplusLines})`}
          </button>

          <button
            type="button"
            onClick={() => onFilterSelect('match')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              currentFilter === 'match'
                ? 'bg-emerald-700 text-white shadow-2xs'
                : 'bg-white text-emerald-800 border border-emerald-200 hover:bg-emerald-50'
            }`}
          >
            {isAr ? `✓ المطابق (${analysis.matchLines})` : `✓ Matched (${analysis.matchLines})`}
          </button>

          <button
            type="button"
            onClick={() => onFilterSelect('damaged')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              currentFilter === 'damaged'
                ? 'bg-purple-700 text-white shadow-2xs'
                : 'bg-white text-purple-800 border border-purple-200 hover:bg-purple-50'
            }`}
          >
            {isAr ? `⚠️ التوالف (${analysis.totalDamagedPieces})` : `⚠️ Damaged (${analysis.totalDamagedPieces})`}
          </button>
        </div>

        {/* Quick Auditor Actions */}
        <div className="flex items-center gap-2">
          {onQuickMatchAll && (
            <button
              type="button"
              onClick={onQuickMatchAll}
              title={isAr ? 'اعتماد جميع كميات الفاتورة كمستلمة دفعة واحدة للتعديل السريع على الفوارق فقط' : 'Fill all items as matched with invoice quantities'}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-2xs transition-all active:scale-95 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isAr ? 'استلام الكل كمطابق 100%' : 'Quick Match All'}</span>
            </button>
          )}

          {onResetCounts && (
            <button
              type="button"
              onClick={onResetCounts}
              title={isAr ? 'تصفير كميات الفحص لإعادة التدقيق من الصفر' : 'Reset actual counts to re-audit'}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold transition-all active:scale-95 cursor-pointer"
            >
              <span>{isAr ? 'تصفير الفعلي' : 'Reset'}</span>
            </button>
          )}
        </div>
      </div>

      {/* 4. Detailed Discrepant Items Quick Radar List (Shows exact items that have differences) */}
      {analysis.discrepantItems.length > 0 && (
        <div className="mt-3.5 pt-3 border-t border-slate-100">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs sm:text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
              <span>🚨</span>
              <span>
                {isAr
                  ? `قائمة الأصناف التي بها فوارق واضحة في فاتورة [${branchName}] (${analysis.discrepantItems.length} صنف):`
                  : `Discrepant Items Radar in [${branchName}] (${analysis.discrepantItems.length} items):`}
              </span>
            </h4>
            <span className="text-[11px] font-bold text-slate-500">
              {isAr ? 'انقر على أي صنف لتعديله فوراً' : 'Click any item to edit immediately'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {analysis.discrepantItems.slice(0, 12).map((item) => {
              const isShortage = item.diff < 0;
              const borderCls = isShortage
                ? 'border-rose-200 hover:border-rose-400 bg-rose-50/40'
                : 'border-amber-200 hover:border-amber-400 bg-amber-50/40';

              return (
                <div
                  key={item.code}
                  onClick={() => onEditItem(item.code)}
                  className={`border rounded-xl p-2.5 transition-all cursor-pointer hover:shadow-xs flex items-center justify-between gap-2 ${borderCls}`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className={`text-[10px] font-black px-1.5 py-0.5 rounded ${
                        isShortage ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-900'
                      }`}>
                        {isShortage ? (isAr ? '🔻 عجز' : 'Shortage') : (isAr ? '🔺 زيادة' : 'Surplus')}
                      </span>
                      <span className="text-xs font-mono font-bold text-slate-700 truncate">{item.code}</span>
                    </div>

                    <h5 className="text-xs font-bold text-slate-900 truncate mt-1" title={item.itemName}>
                      {item.itemName}
                    </h5>

                    <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-600">
                      <span>
                        {isAr ? 'الفاتورة:' : 'Inv:'} <b>{item.systemQty}</b>
                      </span>
                      <span>•</span>
                      <span>
                        {isAr ? 'المستلم:' : 'Rec:'} <b>{item.countedQty}</b>
                      </span>
                      <span>•</span>
                      <span className="font-bold text-slate-800">
                        {item.price > 0 ? `${item.price} ج.م` : ''}
                      </span>
                    </div>
                  </div>

                  {/* Difference Badge */}
                  <div className="text-end flex flex-col items-end">
                    <span className={`text-xs sm:text-sm font-black px-2 py-0.5 rounded-lg ${
                      isShortage ? 'bg-rose-600 text-white' : 'bg-amber-600 text-white'
                    }`}>
                      {item.diff > 0 ? `+${item.diff}` : item.diff}
                    </span>
                    <span className="text-[10px] font-bold text-slate-700 mt-1">
                      {item.diffValue > 0 ? `${Math.round(item.diffValue).toLocaleString()} ج.م` : ''}
                    </span>
                    <button
                      type="button"
                      className="text-slate-400 hover:text-red-700 transition-colors mt-0.5 p-0.5 cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {analysis.discrepantItems.length > 12 && (
            <p className="text-center text-xs font-bold text-slate-500 mt-2">
              {isAr
                ? `... ويوجد ${analysis.discrepantItems.length - 12} صنف آخر به فوارق (معروضة بجدول المراجعة بالأسفل)`
                : `... and ${analysis.discrepantItems.length - 12} more items with discrepancies`}
            </p>
          )}
        </div>
      )}
    </section>
  );
};
