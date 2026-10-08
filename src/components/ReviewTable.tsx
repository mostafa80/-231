import React, { useState, useMemo } from 'react';
import {
  FileSpreadsheet,
  Printer,
  Save,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Edit2,
  Filter,
  CheckCircle2,
} from 'lucide-react';
import { Session, ReturnItem, FilterType, Language } from '../types';

interface ReviewTableProps {
  session: Session | null;
  onEditItem: (code: string) => void;
  onExportExcel: () => void;
  onPrintReceipt: () => void;
  onCompleteAndExport: () => void;
  onManualSave: () => void;
  onResetSession: () => void;
  highlightedCode?: string | null;
  lang: Language;
  filter?: FilterType;
  onFilterChange?: (filter: FilterType) => void;
}

const PAGE_SIZE = 50;

export const ReviewTable: React.FC<ReviewTableProps> = ({
  session,
  onEditItem,
  onExportExcel,
  onPrintReceipt,
  onCompleteAndExport,
  onManualSave,
  onResetSession,
  highlightedCode,
  lang,
  filter,
  onFilterChange,
}) => {
  const [internalFilter, setInternalFilter] = useState<FilterType>('all');
  const currentFilter = filter !== undefined ? filter : internalFilter;
  const handleFilterChange = (f: FilterType) => {
    if (onFilterChange) onFilterChange(f);
    else setInternalFilter(f);
  };

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState<number>(1);

  const isAr = lang === 'ar';

  // Extract categories & subcategories from active session
  const { mainCategories, fullCategories } = useMemo(() => {
    const main = new Set<string>();
    const full = new Set<string>();

    if (session) {
      Object.values(session.inventoryMap).forEach((it) => {
        if (it.category) main.add(it.category);
        if (it.fullCategory) full.add(it.fullCategory);
      });
    }

    return {
      mainCategories: Array.from(main).sort(),
      fullCategories: Array.from(full).sort(),
    };
  }, [session]);

  // Filter items
  const filteredItems = useMemo(() => {
    if (!session) return [];
    const all = Object.values(session.inventoryMap);

    return all.filter((item: ReturnItem) => {
      const key = item.code.toUpperCase();
      const jard = session.jardData[key];

      // Category filter
      if (selectedCategory !== 'all') {
        const matchMain = item.category === selectedCategory;
        const matchFull = item.fullCategory === selectedCategory;
        if (!matchMain && !matchFull) return false;
      }

      // Status filter
      if (currentFilter === 'all') return true;
      if (currentFilter === 'counted') return jard && jard.countedQty > 0;
      if (currentFilter === 'damaged') return jard && jard.damagedQty > 0;
      if (currentFilter === 'match') return jard && jard.countedQty === item.systemQty;
      if (currentFilter === 'extra') return jard && jard.countedQty > item.systemQty;
      if (currentFilter === 'less') {
        return (!jard && item.systemQty > 0) || (jard && jard.countedQty < item.systemQty);
      }
      return true;
    }).sort((a, b) => {
      // Show recently scanned items first
      const timeA = session.jardData[a.code.toUpperCase()]?.time || 0;
      const timeB = session.jardData[b.code.toUpperCase()]?.time || 0;
      return timeB - timeA;
    });
  }, [session, selectedCategory, currentFilter]);

  const totalItems = filteredItems.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));
  const validCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

  const paginatedItems = useMemo(() => {
    const start = (validCurrentPage - 1) * PAGE_SIZE;
    return filteredItems.slice(start, start + PAGE_SIZE);
  }, [filteredItems, validCurrentPage]);

  // Real-time visible discrepancy calculation
  const discrepanciesSummary = useMemo(() => {
    if (!session) return { shortages: 0, shortagePcs: 0, shortageVal: 0, surpluses: 0, surplusPcs: 0, surplusVal: 0, uncounted: 0, totalDiffItems: 0 };
    let shortages = 0;
    let shortagePcs = 0;
    let shortageVal = 0;
    let surpluses = 0;
    let surplusPcs = 0;
    let surplusVal = 0;
    let uncounted = 0;

    Object.values(session.inventoryMap).forEach((it) => {
      const key = it.code.toUpperCase();
      const j = session.jardData[key];
      const sound = j ? j.soundQty : 0;
      const damaged = j ? j.damagedQty : 0;
      const rec = sound + damaged;
      const diff = rec - it.systemQty;
      const price = it.price || 0;

      if (!j && it.systemQty > 0) {
        uncounted++;
        shortages++;
        shortagePcs += it.systemQty;
        shortageVal += it.systemQty * price;
      } else if (diff < 0) {
        shortages++;
        const sQty = Math.abs(diff);
        shortagePcs += sQty;
        shortageVal += sQty * price;
      } else if (diff > 0) {
        surpluses++;
        surplusPcs += diff;
        surplusVal += diff * price;
      }
    });

    return {
      shortages,
      shortagePcs,
      shortageVal,
      surpluses,
      surplusPcs,
      surplusVal,
      uncounted,
      totalDiffItems: shortages + surpluses,
    };
  }, [session]);

  const filterButtons: { type: FilterType; labelAr: string; labelEn: string }[] = [
    { type: 'all', labelAr: 'الكل', labelEn: 'All' },
    { type: 'match', labelAr: 'مطابق', labelEn: 'Matched' },
    { type: 'extra', labelAr: 'فائض', labelEn: 'Surplus' },
    { type: 'less', labelAr: 'عجز', labelEn: 'Shortage' },
    { type: 'counted', labelAr: 'تم استلامه', labelEn: 'Received' },
    { type: 'damaged', labelAr: 'يحتوي تالف', labelEn: 'With Damaged' },
  ];

  return (
    <section className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-4 sm:p-5 mb-4">
      {/* Table Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 mb-3 border-b border-slate-100 gap-2">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-red-100 text-red-700 flex items-center justify-center font-bold text-xs">
            3
          </div>
          <h2 className="text-sm sm:text-base font-bold text-slate-900">
            {isAr
              ? 'جدول مراجعة ومقارنة الفاتورة (الفعلي مقابل كمية الفاتورة)'
              : 'Audit & Reconciliation Table (Actual vs Invoice)'}
          </h2>
        </div>
      </div>

      {/* Real-time Visible Discrepancy Insight Banner */}
      {discrepanciesSummary.totalDiffItems > 0 ? (
        <div className="mb-3.5 bg-gradient-to-r from-rose-50 via-amber-50 to-rose-50 border border-rose-200 rounded-xl p-3 shadow-2xs">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-base">🚨</span>
              <div>
                <h4 className="text-xs sm:text-sm font-extrabold text-slate-900">
                  {isAr ? 'ملخص الفوارق الظاهرة بين الفاتورة والمستلم الفعلي:' : 'Visible Invoice Discrepancies Summary:'}
                </h4>
                <div className="flex flex-wrap items-center gap-2 mt-1 text-xs font-bold">
                  {discrepanciesSummary.shortages > 0 && (
                    <span className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 border border-rose-200">
                      🔻 عجز: {discrepanciesSummary.shortages} صنف ({discrepanciesSummary.shortagePcs} قطعة | {discrepanciesSummary.shortageVal.toLocaleString()} ج.م)
                    </span>
                  )}
                  {discrepanciesSummary.surpluses > 0 && (
                    <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 border border-amber-200">
                      🔺 زيادة: {discrepanciesSummary.surpluses} صنف ({discrepanciesSummary.surplusPcs} قطعة | {discrepanciesSummary.surplusVal.toLocaleString()} ج.م)
                    </span>
                  )}
                  {discrepanciesSummary.uncounted > 0 && (
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                      📦 لم تفحص بعد: {discrepanciesSummary.uncounted} صنف
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => handleFilterChange(currentFilter === 'less' ? 'all' : 'less')}
                className={`text-xs font-bold px-2.5 py-1 rounded-lg shadow-2xs cursor-pointer transition-all active:scale-95 ${
                  currentFilter === 'less' ? 'bg-rose-800 text-white' : 'bg-rose-600 hover:bg-rose-700 text-white'
                }`}
              >
                {isAr ? 'عرض العجز فقط' : 'Show Shortages'}
              </button>
              <button
                type="button"
                onClick={() => handleFilterChange(currentFilter === 'extra' ? 'all' : 'extra')}
                className={`text-xs font-bold px-2.5 py-1 rounded-lg shadow-2xs cursor-pointer transition-all active:scale-95 ${
                  currentFilter === 'extra' ? 'bg-amber-800 text-white' : 'bg-amber-600 hover:bg-amber-700 text-white'
                }`}
              >
                {isAr ? 'عرض الزيادة فقط' : 'Show Surpluses'}
              </button>
            </div>
          </div>
        </div>
      ) : Object.keys(session?.inventoryMap || {}).length > 0 && Object.keys(session?.jardData || {}).length > 0 ? (
        <div className="mb-3.5 bg-emerald-50 border border-emerald-200 rounded-xl p-2.5 flex items-center justify-between text-xs font-bold text-emerald-900">
          <div className="flex items-center gap-2">
            <span className="text-base">✅</span>
            <span>{isAr ? 'الفاتورة مطابقة بالكامل 100% - جميع الكميات المستلمة مطابقة لكميات الفاتورة المسجلة ولا توجد أي فوارق ظاهرة.' : '100% Matched! No visible discrepancies.'}</span>
          </div>
        </div>
      ) : null}

      {/* Filter Toolbar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5 p-3 bg-slate-50 border border-slate-200 rounded-xl mb-3">
        {/* Category Dropdown */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-500 flex-shrink-0" />
          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setCurrentPage(1);
            }}
            className="text-xs font-semibold py-1.5 px-2.5 bg-white border border-slate-200 rounded-lg text-slate-800 focus:border-red-600 focus:ring-1 focus:ring-red-100 outline-hidden cursor-pointer w-full md:w-56"
          >
            <option value="all">{isAr ? 'كل التصنيفات والأقسام' : 'All Categories'}</option>
            {mainCategories.length > 0 && (
              <optgroup label={isAr ? 'الأقسام الرئيسية' : 'Main Categories'}>
                {mainCategories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </optgroup>
            )}
            {fullCategories.length > 0 && (
              <optgroup label={isAr ? 'الماركات / التصنيف الفرعي' : 'Sub-categories'}>
                {fullCategories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </optgroup>
            )}
          </select>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 justify-start md:justify-end">
          {filterButtons.map((btn) => (
            <button
              key={btn.type}
              type="button"
              onClick={() => {
                handleFilterChange(btn.type);
                setCurrentPage(1);
              }}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                currentFilter === btn.type
                  ? 'bg-red-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              {isAr ? btn.labelAr : btn.labelEn}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white max-h-[55vh] relative scrollbar-thin">
        <table className="w-full text-right rtl:text-right ltr:text-left text-xs border-collapse">
          <thead className="bg-slate-50 text-slate-700 font-bold sticky top-0 z-10 border-b-2 border-slate-200 shadow-2xs">
            <tr>
              <th className="py-2.5 px-2.5 text-center w-10">{isAr ? 'الحالة' : 'Status'}</th>
              <th className="py-2.5 px-2 text-center font-bold text-amber-700 bg-amber-50/70 border-x border-amber-200/50 w-12" title="الأصفر: رقم الصنف في الفاتورة">
                {isAr ? 'م' : '#'}
              </th>
              <th className="py-2.5 px-3 font-bold text-rose-900 bg-rose-50/50 border-x border-rose-200/40" title="الأحمر: اسم الصنف">
                {isAr ? 'اسم الصنف' : 'Item Name'}
              </th>
              <th className="py-2.5 px-3 text-center font-mono font-bold text-emerald-800 bg-emerald-50/50 border-x border-emerald-200/40" title="الأخضر: كود الصنف">
                {isAr ? 'كود الصنف' : 'Barcode'}
              </th>
              <th className="py-2.5 px-3 text-center font-bold text-purple-800 bg-purple-50/50 border-x border-purple-200/40" title="البنفسجي: عدد الصنف في الفاتورة">
                {isAr ? 'عدد الفاتورة' : 'Inv Qty'}
              </th>
              <th className="py-2.5 px-3 text-center font-bold text-sky-800 bg-sky-50/50 border-x border-sky-200/40" title="اللبني: سعر الصنف">
                {isAr ? 'سعر الصنف' : 'Price'}
              </th>
              <th className="py-2.5 px-3 text-center font-bold text-orange-800 bg-orange-50/50 border-x border-orange-200/40" title="البرتقالي: حاصل ضرب السعر * الكمية">
                {isAr ? 'إجمالي الفاتورة' : 'Total'}
              </th>
              <th className="py-2.5 px-3 text-center text-emerald-700 font-bold">{isAr ? 'المستلم سليم' : 'Sound'}</th>
              <th className="py-2.5 px-3 text-center text-rose-700 font-bold">{isAr ? 'المستلم متلف' : 'Damaged'}</th>
              <th className="py-2.5 px-3 text-center font-black">{isAr ? 'إجمالي المستلم' : 'Total Counted'}</th>
              <th className="py-2.5 px-3 text-center font-bold">{isAr ? 'الفرق' : 'Diff'}</th>
              <th className="py-2.5 px-3 text-center">{isAr ? 'تعديل' : 'Action'}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {paginatedItems.length === 0 ? (
              <tr>
                <td colSpan={12} className="py-8 text-center text-slate-400 font-medium">
                  {isAr ? 'لا توجد أصناف مطابقة للبحث أو الفلتر' : 'No items match current filters'}
                </td>
              </tr>
            ) : (
              paginatedItems.map((item, rowIdx) => {
                const key = item.code.toUpperCase();
                const jard = session?.jardData[key];
                const isTargetHighlighted = highlightedCode && highlightedCode.toUpperCase() === key;

                let rowBg = 'hover:bg-slate-50/80';
                let diffBadge = <span className="text-slate-400 font-medium">-</span>;
                let soundDisplay = 0;
                let damagedDisplay = 0;
                let totalDisplay = 0;
                let statusBadge = <span className="text-slate-300">-</span>;

                if (jard) {
                  soundDisplay = jard.soundQty;
                  damagedDisplay = jard.damagedQty;
                  totalDisplay = jard.countedQty;
                  const diff = jard.countedQty - item.systemQty;

                  if (diff === 0) {
                    rowBg = 'bg-cyan-50/50 hover:bg-cyan-50/80';
                    statusBadge = <span className="font-bold text-cyan-700">✓</span>;
                    diffBadge = <span className="font-bold text-cyan-700">0</span>;
                  } else if (diff > 0) {
                    rowBg = 'bg-amber-50/50 hover:bg-amber-50/80';
                    statusBadge = <span className="font-bold text-amber-700">▲</span>;
                    diffBadge = <span className="font-bold text-amber-700">+{diff}</span>;
                  } else {
                    rowBg = 'bg-rose-50/50 hover:bg-rose-50/80';
                    statusBadge = <span className="font-bold text-rose-700">▼</span>;
                    diffBadge = <span className="font-bold text-rose-700">{diff}</span>;
                  }
                } else if (item.systemQty > 0) {
                  rowBg = 'bg-rose-50/30 hover:bg-rose-50/60';
                  diffBadge = <span className="font-bold text-rose-600">-{item.systemQty}</span>;
                }

                if (isTargetHighlighted) {
                  rowBg = 'bg-red-100/80 ring-2 ring-red-500 shadow-sm animate-pulse';
                }

                const lineTotalVal = item.total || Number((item.price * item.systemQty).toFixed(2));
                const serialNum = item.serialNo || ((validCurrentPage - 1) * PAGE_SIZE + rowIdx + 1);

                return (
                  <tr key={item.code} className={`transition-colors ${rowBg}`}>
                    <td className="py-2.5 px-2.5 text-center">{statusBadge}</td>
                    <td className="py-2.5 px-2 text-center font-bold text-amber-900 bg-amber-50/30 border-x border-amber-100 font-mono">
                      {serialNum}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-slate-900 max-w-xs truncate" title={item.itemName}>
                      {item.itemName}
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono font-semibold text-emerald-800 bg-emerald-50/20 border-x border-emerald-100/60">
                      {item.code}
                    </td>
                    <td className="py-2.5 px-3 text-center font-black text-purple-900 bg-purple-50/20 border-x border-purple-100/60 font-mono">
                      {item.systemQty}
                    </td>
                    <td className="py-2.5 px-3 text-center font-bold text-sky-800 bg-sky-50/20 border-x border-sky-100/60 font-mono">
                      {item.price ? `${item.price.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '0.00'}
                    </td>
                    <td className="py-2.5 px-3 text-center font-bold text-orange-900 bg-orange-50/20 border-x border-orange-100/60 font-mono">
                      {lineTotalVal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-2.5 px-3 text-center font-semibold text-emerald-700">
                      {soundDisplay}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      {damagedDisplay > 0 ? (
                        <span className="inline-block px-1.5 py-0.5 rounded-full text-[11px] font-extrabold bg-rose-100 text-rose-700 border border-rose-200">
                          {damagedDisplay}
                        </span>
                      ) : (
                        <span className="text-slate-400">0</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-center font-black text-slate-900">
                      {totalDisplay}
                    </td>
                    <td className="py-2.5 px-3 text-center">{diffBadge}</td>
                    <td className="py-2.5 px-3 text-center">
                      <button
                        type="button"
                        onClick={() => onEditItem(item.code)}
                        title={isAr ? 'تعديل الكمية يدوياً' : 'Edit Counts'}
                        className="p-1 rounded-md text-slate-400 hover:text-red-700 hover:bg-red-50 transition-colors cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Bar */}
      <div className="flex items-center justify-between pt-3 pb-1 text-xs">
        <button
          type="button"
          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
          disabled={validCurrentPage <= 1}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-lg border font-bold transition-all cursor-pointer ${
            validCurrentPage <= 1
              ? 'bg-slate-50 text-slate-300 border-slate-200 cursor-not-allowed'
              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 active:scale-95'
          }`}
        >
          {isAr ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          <span>{isAr ? 'السابق' : 'Previous'}</span>
        </button>

        <span className="text-slate-600 font-semibold">
          {isAr
            ? `صفحة ${validCurrentPage} من ${totalPages} (إجمالي: ${totalItems} صنف)`
            : `Page ${validCurrentPage} of ${totalPages} (${totalItems} items)`}
        </span>

        <button
          type="button"
          onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
          disabled={validCurrentPage >= totalPages}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-lg border font-bold transition-all cursor-pointer ${
            validCurrentPage >= totalPages
              ? 'bg-slate-50 text-slate-300 border-slate-200 cursor-not-allowed'
              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 active:scale-95'
          }`}
        >
          <span>{isAr ? 'التالي' : 'Next'}</span>
          {isAr ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>
      </div>

      {/* Action Footer Buttons */}
      <div className="flex flex-wrap items-center justify-center gap-2 pt-4 border-t border-slate-100 mt-3">
        {/* Complete Received & Auto Download Multi-Sheet Excel Button */}
        <button
          type="button"
          onClick={onCompleteAndExport}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-xs sm:text-sm text-white shadow-md transition-all active:scale-95 cursor-pointer ${
            session?.isCompleted
              ? 'bg-emerald-700 hover:bg-emerald-800 ring-2 ring-emerald-300'
              : 'bg-emerald-600 hover:bg-emerald-700 hover:shadow-emerald-200'
          }`}
        >
          <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-200" />
          <span>
            {session?.isCompleted
              ? (isAr ? '✅ تم استلام الإذن (إعادة تنزيل شيت الإكسيل 📥)' : '✅ Received (Re-download Excel 📥)')
              : (isAr ? '✅ تم الاستلام واعتماد الإذن (وتنزيل شيت الإكسيل 📥)' : '✅ Mark Received & Download Excel 📥')}
          </span>
        </button>

        {/* Smart Excel Export */}
        <button
          type="button"
          onClick={onExportExcel}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-extrabold text-xs bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-all active:scale-95 cursor-pointer"
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>{isAr ? 'تصدير Excel باسم الفرع ورقم الإذن' : 'Export Excel with Branch & Slip #'}</span>
        </button>

        {/* Print Receipt */}
        <button
          type="button"
          onClick={onPrintReceipt}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-extrabold text-xs bg-slate-900 hover:bg-black text-white shadow-xs transition-all active:scale-95 cursor-pointer"
        >
          <Printer className="w-4 h-4" />
          <span>{isAr ? 'طباعة عادية 🖨️' : 'Print Receipt 🖨️'}</span>
        </button>

        {/* Manual Save */}
        <button
          type="button"
          onClick={onManualSave}
          className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl font-extrabold text-xs bg-sky-600 hover:bg-sky-700 text-white shadow-xs transition-all active:scale-95 cursor-pointer"
        >
          <Save className="w-4 h-4" />
          <span>{isAr ? 'حفظ يدوي' : 'Save State'}</span>
        </button>

        {/* Reset Active Session */}
        <button
          type="button"
          onClick={onResetSession}
          className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl font-extrabold text-xs bg-rose-600 hover:bg-rose-700 text-white shadow-xs transition-all active:scale-95 cursor-pointer"
        >
          <Trash2 className="w-4 h-4" />
          <span>{isAr ? 'تصفير هذا الإذن' : 'Reset Return'}</span>
        </button>
      </div>
    </section>
  );
};
