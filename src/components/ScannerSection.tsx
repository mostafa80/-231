import React, { useState, useEffect, useRef } from 'react';
import {
  Barcode,
  Search,
  CheckCircle2,
  AlertOctagon,
  RotateCcw,
  Eraser,
  Plus,
  Minus,
  Loader2,
  Zap,
} from 'lucide-react';
import { Session, ReturnItem, ItemCondition, Language } from '../types';

interface ScannerSectionProps {
  session: Session | null;
  masterCatalog: Record<string, ReturnItem>;
  condition: ItemCondition;
  onConditionChange: (c: ItemCondition) => void;
  autoAdd: boolean;
  onAutoAddChange: (auto: boolean) => void;
  onAddItem: (code: string, qty: number, isSubtract: boolean, condition: ItemCondition) => void;
  onUndo: () => void;
  canUndo: boolean;
  message: { text: string; type: 'success' | 'error' | 'info' } | null;
  lang: Language;
  hasInvoice?: boolean;
  hasMaster?: boolean;
}

export const ScannerSection: React.FC<ScannerSectionProps> = ({
  session,
  masterCatalog,
  condition,
  onConditionChange,
  autoAdd,
  onAutoAddChange,
  onAddItem,
  onUndo,
  canUndo,
  message,
  lang,
  hasInvoice,
  hasMaster,
}) => {
  const [barcode, setBarcode] = useState('');
  const [manualQty, setManualQty] = useState(''); // Initial value is empty as requested
  const [qtyError, setQtyError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ReturnItem[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [matchedItem, setMatchedItem] = useState<ReturnItem | null>(null);
  const [isSearchingBarcode, setIsSearchingBarcode] = useState(false);

  const barcodeInputRef = useRef<HTMLInputElement>(null);
  const qtyInputRef = useRef<HTMLInputElement>(null);
  const isAr = lang === 'ar';

  const isInvoiceLoaded = hasInvoice !== undefined ? hasInvoice : Boolean(session && Object.keys(session.inventoryMap).length > 0);
  const isMasterLoaded = hasMaster !== undefined ? hasMaster : Boolean(Object.keys(masterCatalog).length > 0);
  const canScan = isInvoiceLoaded && isMasterLoaded;

  // Live item preview when barcode changes
  useEffect(() => {
    const codeTrim = barcode.trim();
    if (!codeTrim) {
      setMatchedItem(null);
      setIsSearchingBarcode(false);
      return;
    }

    setIsSearchingBarcode(true);
    const timer = setTimeout(() => {
      const key = codeTrim.toUpperCase();
      const item = session?.inventoryMap[key] || masterCatalog[key] || null;
      setMatchedItem(item);
      setIsSearchingBarcode(false);
    }, 60);

    return () => clearTimeout(timer);
  }, [barcode, session, masterCatalog]);

  // Live search inside active invoice + master
  useEffect(() => {
    const q = searchQuery.trim().toLowerCase();
    if (q.length < 2) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }

    const results: ReturnItem[] = [];
    const seen = new Set<string>();

    const checkList = [
      ...Object.values(session?.inventoryMap || {}),
      ...Object.values(masterCatalog || {}),
    ];

    for (const item of checkList) {
      if (seen.has(item.code.toUpperCase())) continue;
      const nameMatch = item.itemName.toLowerCase().includes(q);
      const catMatch = (item.fullCategory || item.category || '').toLowerCase().includes(q);
      const codeMatch = item.code.toLowerCase().includes(q);

      if (nameMatch || catMatch || codeMatch) {
        seen.add(item.code.toUpperCase());
        results.push(item);
        if (results.length >= 8) break;
      }
    }

    setSearchResults(results);
    setShowDropdown(results.length > 0);
  }, [searchQuery, session, masterCatalog]);

  const handleBarcodeSubmit = (isSubtract: boolean = false) => {
    if (!canScan) {
      setQtyError(isAr ? '⚠️ لا يمكن مسح أي صنف قبل رفع شيت الفاتورة وشيت الماستر أولاً!' : 'Please upload Invoice and Master sheets first!');
      return;
    }

    const code = barcode.trim();
    if (!code) {
      barcodeInputRef.current?.focus();
      return;
    }

    let qty = 1;
    if (!autoAdd) {
      if (!manualQty.trim()) {
        setQtyError(isAr ? '⚠️ يجب إدخال عدد القطع المستلمة بالأرقام (1 إلى 30 قطعة)' : 'Please enter quantity in numbers (1 to 30)');
        qtyInputRef.current?.focus();
        return;
      }
      const parsed = parseInt(manualQty, 10);
      if (isNaN(parsed) || parsed < 1) {
        setQtyError(isAr ? '⚠️ أدخل رقماً صحيحاً للكمية (من 1 إلى 30)' : 'Enter a valid number (1 to 30)');
        qtyInputRef.current?.focus();
        return;
      }
      if (parsed > 30) {
        setQtyError(isAr ? '⚠️ أقصى كمية مسموح بإدخالها هي 30 قطعة فقط!' : 'Maximum allowed quantity is 30 pieces!');
        qtyInputRef.current?.focus();
        return;
      }
      qty = parsed;
    }

    setQtyError(null);
    onAddItem(code, qty, isSubtract, condition);
    setBarcode('');
    setManualQty('');
    setMatchedItem(null);
    barcodeInputRef.current?.focus();
  };

  const handleSelectItemFromSearch = (item: ReturnItem) => {
    if (!canScan) {
      setQtyError(isAr ? '⚠️ يرجى رفع شيت الفاتورة وشيت الماستر أولاً!' : 'Upload sheets first!');
      return;
    }
    setBarcode(item.code);
    setSearchQuery('');
    setShowDropdown(false);
    if (autoAdd) {
      onAddItem(item.code, 1, false, condition);
      setBarcode('');
      setMatchedItem(null);
      barcodeInputRef.current?.focus();
    } else {
      // In manual mode, jump directly to quantity input so user types quantity immediately!
      setTimeout(() => {
        qtyInputRef.current?.focus();
        qtyInputRef.current?.select();
      }, 50);
    }
  };

  const handleClear = () => {
    setBarcode('');
    setManualQty('');
    setQtyError(null);
    setMatchedItem(null);
    setSearchQuery('');
    setShowDropdown(false);
    barcodeInputRef.current?.focus();
  };

  return (
    <section className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-4 sm:p-5 mb-4">
      {/* Title */}
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-red-100 text-red-700 flex items-center justify-center font-bold text-xs">
            2
          </div>
          <h2 className="text-sm sm:text-base font-bold text-slate-900">
            {isAr
              ? 'مسح واستلام أصناف الفاتورة الواردة من المخزن الى الفرع'
              : 'Scan & Receive Inbound Invoice Items (Warehouse to Branch)'}
          </h2>
        </div>
      </div>

      {/* Search Inside Return */}
      <div className="relative mb-3.5">
        <label className="block text-xs font-bold text-slate-600 mb-1">
          {isAr
            ? '🔍 بحث سريع داخل أصناف الفاتورة الواردة (اسم / باركود / تصنيف):'
            : '🔍 Quick Search items in this inbound invoice:'}
        </label>
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 rtl:right-3 ltr:left-3 ltr:right-auto" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={isAr ? 'اكتب للبحث واختيار الصنف...' : 'Type to search item...'}
            className="w-full text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg py-2 rtl:pr-9 rtl:pl-3 ltr:pl-9 ltr:pr-3 focus:bg-white focus:border-red-600 focus:ring-2 focus:ring-red-100 transition-all outline-hidden"
          />
        </div>

        {/* Dropdown search results */}
        {showDropdown && searchResults.length > 0 && (
          <div className="absolute z-30 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-56 overflow-y-auto divide-y divide-slate-100">
            {searchResults.map((item) => (
              <div
                key={item.code}
                onClick={() => handleSelectItemFromSearch(item)}
                className="p-2.5 hover:bg-red-50 cursor-pointer flex items-center justify-between gap-3 text-xs transition-colors"
              >
                <div>
                  <div className="font-bold text-slate-900">{item.itemName}</div>
                  <div className="text-[11px] text-slate-500">{item.fullCategory || item.category}</div>
                </div>
                <div className="text-right flex-shrink-0">
                  <span className="font-mono font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded border border-red-100">
                    {item.code}
                  </span>
                  <div className="text-[11px] text-slate-500 font-semibold">{item.price} ج.م</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Condition Toggle: Sound vs Damaged */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50/80 border border-slate-200 rounded-xl p-3 mb-3.5">
        <span className="text-xs font-extrabold text-slate-700 flex items-center gap-1.5">
          📦 {isAr ? 'حالة القطع المستلمة الآن:' : 'Current Condition of Pieces:'}
        </span>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onConditionChange('sound')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
              condition === 'sound'
                ? 'bg-emerald-600 text-white shadow-xs scale-102'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{isAr ? 'سليم معتمد ✅' : 'Sound (Normal) ✅'}</span>
          </button>

          <button
            type="button"
            onClick={() => onConditionChange('damaged')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
              condition === 'damaged'
                ? 'bg-red-600 text-white shadow-xs scale-102'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
            }`}
          >
            <AlertOctagon className="w-3.5 h-3.5" />
            <span>{isAr ? 'متلف / تالف ⚠️' : 'Damaged / Defect ⚠️'}</span>
          </button>
        </div>
      </div>

      {/* Auto-Add Switch */}
      <div className="flex items-center justify-between bg-red-50/60 border border-red-100 rounded-xl px-3.5 py-2.5 mb-3.5">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-red-600" />
          <span className="text-xs font-bold text-red-900">
            {isAr
              ? '⚡ وضع المسح السريع (+1 تلقائياً مع كل سكان بالباركود)'
              : '⚡ Fast Scan Mode (+1 piece automatically on each scan)'}
          </span>
        </div>

        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={autoAdd}
            onChange={(e) => onAutoAddChange(e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-9 h-5 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-red-600"></div>
        </label>
      </div>

      {/* Lockout Notice when sheets are missing */}
      {!canScan && (
        <div className="bg-amber-50/90 border-2 border-amber-300 rounded-xl p-3.5 mb-3.5 shadow-xs animate-fadeIn">
          <div className="flex items-start gap-2.5">
            <span className="text-xl">🔒</span>
            <div className="flex-1">
              <h4 className="text-xs sm:text-sm font-black text-amber-950">
                {isAr ? 'المسح والاستلام معطّل مؤقتاً (بانتظار رفع الشيتات)' : 'Scanning Locked (Pending File Uploads)'}
              </h4>
              <p className="text-xs text-amber-900 font-medium mt-1 leading-relaxed">
                {isAr
                  ? 'لبدء مسح واستلام الباركود، يلزم أولاً رفع شيت الفاتورة وشيت الماستر من قسم (1. استيراد فاتورة البيع والماستر) أعلاه:'
                  : 'To enable scanning and counting, please upload both the Invoice and Master sheets in section 1 above:'}
              </p>
              <div className="flex flex-wrap items-center gap-2 mt-2.5">
                <div
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black border ${
                    isInvoiceLoaded
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                      : 'bg-rose-100 text-rose-800 border-rose-300 animate-pulse'
                  }`}
                >
                  <span>{isInvoiceLoaded ? '✅' : '❌'}</span>
                  <span>{isAr ? 'شيت فاتورة البيع:' : 'Invoice Sheet:'}</span>
                  <span>{isInvoiceLoaded ? (isAr ? 'تم الرفع' : 'Uploaded') : (isAr ? 'لم يرفع بعد' : 'Missing')}</span>
                </div>

                <div
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black border ${
                    isMasterLoaded
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                      : 'bg-rose-100 text-rose-800 border-rose-300 animate-pulse'
                  }`}
                >
                  <span>{isMasterLoaded ? '✅' : '❌'}</span>
                  <span>{isAr ? 'شيت ماستر الأصناف:' : 'Master Catalog:'}</span>
                  <span>{isMasterLoaded ? (isAr ? 'تم الرفع' : 'Uploaded') : (isAr ? 'لم يرفع بعد' : 'Missing')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Barcode Input & Scanner */}
      <div className="space-y-3">
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Barcode className="w-4 h-4 text-red-600" />
              <span>{isAr ? 'مسح باركود الصنف المستلم:' : 'Scan or type barcode:'}</span>
            </label>
            {!autoAdd && (
              <span className="text-[11px] font-bold text-slate-500">
                {isAr ? 'اضغط Enter بعد السكان للانتقال للكمية فوراً' : 'Press Enter to jump to quantity'}
              </span>
            )}
          </div>

          <div className="relative">
            <input
              ref={barcodeInputRef}
              type="text"
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  if (!canScan) return;
                  const code = barcode.trim();
                  if (!code) return;

                  if (!autoAdd) {
                    // Manual mode: hitting Enter jumps directly to the quantity input!
                    qtyInputRef.current?.focus();
                    qtyInputRef.current?.select();
                  } else {
                    handleBarcodeSubmit(false);
                  }
                }
              }}
              disabled={!canScan}
              placeholder={
                !canScan
                  ? (isAr ? '🔒 معطّل - يرجى رفع شيت الفاتورة والماستر أولاً للبدء...' : '🔒 Locked - Upload Invoice & Master first...')
                  : (isAr ? 'أدخل أو وجه الباركود هنا...' : 'Scan barcode here...')
              }
              autoFocus
              className={`w-full text-base sm:text-lg font-bold font-mono text-center tracking-wider rounded-xl py-2.5 px-4 transition-all outline-hidden shadow-2xs ${
                !canScan
                  ? 'bg-slate-100 text-slate-400 border-2 border-slate-200 cursor-not-allowed'
                  : 'bg-slate-50 border-2 border-slate-300 focus:bg-white focus:border-red-600 focus:ring-4 focus:ring-red-100'
              }`}
            />
            {isSearchingBarcode && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                <Loader2 className="w-4 h-4 animate-spin text-red-600" />
              </div>
            )}
          </div>
        </div>

        {/* Matched item live preview */}
        {matchedItem && (
          <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-3 text-xs text-emerald-900 flex flex-wrap items-center justify-between gap-2 animate-fadeIn">
            <div>
              <div className="font-extrabold text-sm text-emerald-800">
                📦 {matchedItem.itemName}
              </div>
              <div className="flex flex-wrap items-center gap-2 text-[11px] text-emerald-700 font-semibold mt-0.5">
                <span>{matchedItem.fullCategory || matchedItem.category}</span>
                <span>•</span>
                <span className="font-bold text-sky-800">
                  🏷️ {isAr ? 'سعر البيع:' : 'Sale:'} {matchedItem.price} ج.م
                </span>
                <span>•</span>
                <span className="font-bold text-emerald-800">
                  💰 {isAr ? 'سعر الصنف (التكلفة):' : 'Cost:'} {matchedItem.cost ?? 0} ج.م
                </span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-emerald-600 font-bold block">{isAr ? 'كمية الإذن' : 'Invoice Qty'}</span>
              <span className="font-extrabold text-sm">{matchedItem.systemQty}</span>
            </div>
          </div>
        )}

        {/* Manual Quantity Input (visible when auto-add is OFF) */}
        {!autoAdd && (
          <div className="bg-amber-50/70 border-2 border-amber-300/80 rounded-xl p-3.5 transition-all">
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-black text-amber-950">
                {isAr ? '🔢 الكمية المستلمة (للوضع اليدوي):' : '🔢 Quantity (Manual Mode):'}
              </label>
              <span className="text-[11px] font-bold text-amber-800 bg-amber-100/90 px-2 py-0.5 rounded-full border border-amber-200">
                {isAr ? 'أرقام فقط • الحد الأقصى 30 قطعة' : 'Digits only • Max 30 pieces'}
              </span>
            </div>

            <div className="relative">
              <input
                ref={qtyInputRef}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={manualQty}
                onChange={(e) => {
                  const raw = e.target.value;
                  const digits = raw.replace(/\D/g, '');
                  if (!digits) {
                    setManualQty('');
                    setQtyError(null);
                    return;
                  }
                  const num = parseInt(digits, 10);
                  if (num > 30) {
                    setManualQty('30');
                    setQtyError(isAr ? '⚠️ أقصى كمية مسموح بها هي 30 قطعة فقط!' : 'Maximum allowed quantity is 30 pieces!');
                  } else {
                    setManualQty(digits);
                    setQtyError(null);
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleBarcodeSubmit(false);
                  }
                }}
                disabled={!canScan}
                placeholder={isAr ? 'اكتب عدد القطع بالأرقام (1 إلى 30)...' : 'Type quantity in digits (1 to 30)...'}
                className="w-full text-base sm:text-lg font-black text-center bg-white border-2 border-amber-400 rounded-xl py-2 px-3 text-slate-900 focus:border-red-600 focus:ring-4 focus:ring-amber-100 transition-all outline-hidden shadow-2xs"
              />
            </div>

            {qtyError ? (
              <p className="text-xs font-bold text-rose-600 mt-1.5 animate-fadeIn">
                {qtyError}
              </p>
            ) : (
              <p className="text-[11px] text-amber-800/80 mt-1">
                {isAr ? '💡 اضغط Enter بعد كتابة العدد لتسجيل الاستلام فوراً والرجوع لمسح الباركود' : '💡 Press Enter after typing quantity to submit and return to barcode'}
              </p>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
          <button
            type="button"
            disabled={!canScan}
            onClick={() => handleBarcodeSubmit(false)}
            className={`col-span-1 sm:col-span-2 flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl font-extrabold text-xs sm:text-sm transition-all active:scale-95 cursor-pointer shadow-xs ${
              !canScan
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                : 'bg-red-600 hover:bg-red-700 text-white'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>{isAr ? 'إضافة استلام' : 'Add Count'}</span>
          </button>

          <button
            type="button"
            disabled={!canScan}
            onClick={() => handleBarcodeSubmit(true)}
            className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl font-extrabold text-xs transition-all active:scale-95 cursor-pointer shadow-xs ${
              !canScan
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                : 'bg-orange-500 hover:bg-orange-600 text-white'
            }`}
          >
            <Minus className="w-4 h-4" />
            <span>{isAr ? 'خصم' : 'Subtract'}</span>
          </button>

          <button
            type="button"
            onClick={onUndo}
            disabled={!canUndo}
            className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl font-extrabold text-xs transition-all active:scale-95 cursor-pointer ${
              canUndo
                ? 'bg-slate-700 hover:bg-slate-800 text-white shadow-xs'
                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{isAr ? 'تراجع' : 'Undo'}</span>
          </button>
        </div>

        {/* Clear Button */}
        <div className="flex justify-end pt-1">
          <button
            type="button"
            onClick={handleClear}
            className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-red-700 transition-colors cursor-pointer"
          >
            <Eraser className="w-3.5 h-3.5" />
            <span>{isAr ? 'مسح الحقول' : 'Clear Inputs'}</span>
          </button>
        </div>

        {/* Notification Banner */}
        {message && (
          <div
            className={`p-3 rounded-xl text-xs sm:text-sm font-bold text-center border transition-all animate-fadeIn ${
              message.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : message.type === 'error'
                ? 'bg-rose-50 text-rose-800 border-rose-200'
                : 'bg-sky-50 text-sky-800 border-sky-200'
            }`}
          >
            {message.text}
          </div>
        )}
      </div>
    </section>
  );
};
