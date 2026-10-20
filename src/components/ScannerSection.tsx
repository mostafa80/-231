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
  Sparkles,
  Star,
  Tag,
  Banknote,
  Layers,
  X,
} from 'lucide-react';
import { Session, ReturnItem, ItemCondition, Language } from '../types';
import { searchItemsWithPriority, SearchMatchResult } from '../utils/itemSearch';

interface ScannerSectionProps {
  session: Session | null;
  masterCatalog: Record<string, ReturnItem>;
  condition: ItemCondition;
  onConditionChange: (c: ItemCondition) => void;
  autoAdd: boolean;
  onAutoAddChange: (auto: boolean) => void;
  quickScanQty?: number;
  onQuickScanQtyChange?: (qty: number) => void;
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
  quickScanQty = 1,
  onQuickScanQtyChange,
  onAddItem,
  onUndo,
  canUndo,
  message,
  lang,
  hasInvoice,
  hasMaster,
}) => {
  const activeQuickScanQty = [1, 3, 6, 12].includes(quickScanQty) ? quickScanQty : 1;
  const [barcode, setBarcode] = useState('');
  const [manualQty, setManualQty] = useState(''); // Initial value is empty as requested
  const [qtyError, setQtyError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchMatchResult[]>([]);
  const [barcodeSuggestions, setBarcodeSuggestions] = useState<SearchMatchResult[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [matchedItem, setMatchedItem] = useState<ReturnItem | null>(null);
  const [isSearchingBarcode, setIsSearchingBarcode] = useState(false);

  const barcodeInputRef = useRef<HTMLInputElement>(null);
  const qtyInputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);
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
      setBarcodeSuggestions([]);
      return;
    }

    setIsSearchingBarcode(true);
    const timer = setTimeout(() => {
      const key = codeTrim.toUpperCase();
      const item = session?.inventoryMap[key] || masterCatalog[key] || null;
      setMatchedItem(item);
      setIsSearchingBarcode(false);

      // If not an exact match and user typed 2+ digits or chars, generate smart suggestions (invoice first, then master)
      if (!item && codeTrim.length >= 2) {
        const suggestions = searchItemsWithPriority(codeTrim, session?.inventoryMap, masterCatalog, 4);
        setBarcodeSuggestions(suggestions);
      } else {
        setBarcodeSuggestions([]);
      }
    }, 60);

    return () => clearTimeout(timer);
  }, [barcode, session, masterCatalog]);

  // Live search inside active invoice + master with Priority Sorting
  useEffect(() => {
    const q = searchQuery.trim();
    if (!q || q.length < 1) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }

    const matches = searchItemsWithPriority(q, session?.inventoryMap, masterCatalog, 25);
    setSearchResults(matches);
    setShowDropdown(matches.length > 0);
  }, [searchQuery, session?.inventoryMap, masterCatalog]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

    const activeQuickScanQty = [1, 3, 6, 12].includes(quickScanQty) ? quickScanQty : 1;
    let qty = activeQuickScanQty;
    if (!autoAdd) {
      if (!manualQty.trim()) {
        setQtyError(isAr ? '⚠️ يجب إدخال عدد القطع المستلمة بالأرقام (1 إلى 50 قطعة)' : 'Please enter quantity in numbers (1 to 50)');
        qtyInputRef.current?.focus();
        return;
      }
      const parsed = parseInt(manualQty, 10);
      if (isNaN(parsed) || parsed < 1) {
        setQtyError(isAr ? '⚠️ أدخل رقماً صحيحاً للكمية (من 1 إلى 50)' : 'Enter a valid number (1 to 50)');
        qtyInputRef.current?.focus();
        return;
      }
      if (parsed > 50) {
        setQtyError(isAr ? '⚠️ أقصى كمية مسموح بإدخالها هي 50 قطعة فقط!' : 'Maximum allowed quantity is 50 pieces!');
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
    const activeQuickScanQty = [1, 3, 6, 12].includes(quickScanQty) ? quickScanQty : 1;
    if (autoAdd) {
      onAddItem(item.code, activeQuickScanQty, false, condition);
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

      {/* Multi-Criteria Smart Search (Last digits / Price / Name with Priority) */}
      <div ref={searchContainerRef} className="relative mb-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 mb-1.5">
          <label className="text-xs font-black text-slate-800 flex items-center gap-1.5">
            <Search className="w-4 h-4 text-red-600" />
            <span>
              {isAr
                ? '🔍 بحث ذكي متقدم (بآخر 3 أو 4 أرقام من الباركود / سعر البيع / اسم المنتج):'
                : '🔍 Smart Search (Last 3-4 barcode digits / Price / Product Name):'}
            </span>
          </label>

          <span className="text-[11px] font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded-full border border-red-200 self-start sm:self-auto flex items-center gap-1">
            <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
            <span>{isAr ? 'الأولوية التلقائية للفاتورة الحالية أولاً ثم الماستر' : 'Priority: Active Invoice first, then Master'}</span>
          </span>
        </div>

        {/* Feature quick tags */}
        <div className="flex flex-wrap items-center gap-1.5 mb-2 text-[10px] text-slate-600 font-bold">
          <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
            🔢 {isAr ? 'آخر 3 أو 4 أرقام بالباركود (مثال: 842)' : 'Last 3-4 digits'}
          </span>
          <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
            💵 {isAr ? 'سعر البيع (مثال: 150 أو 299)' : 'Price'}
          </span>
          <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
            🏷️ {isAr ? 'اسم الصنف أو الموديل' : 'Product name'}
          </span>
        </div>

        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 rtl:right-3 ltr:left-3 ltr:right-auto pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => {
              if (searchResults.length > 0) setShowDropdown(true);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && searchResults.length > 0) {
                e.preventDefault();
                handleSelectItemFromSearch(searchResults[0].item);
              } else if (e.key === 'Escape') {
                setShowDropdown(false);
              }
            }}
            placeholder={
              isAr
                ? 'ابحث بآخر 3 أو 4 أرقام من الباركود (مثال: 842)، أو سعر البيع (مثال: 150)، أو اسم الصنف... (Enter لاختيار أول نتيجة)'
                : 'Search by last 3-4 barcode digits, selling price (e.g. 150), or name... (Press Enter for #1 match)'
            }
            className="w-full text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl py-2.5 rtl:pr-9 rtl:pl-8 ltr:pl-9 ltr:pr-8 focus:bg-white focus:border-red-600 focus:ring-4 focus:ring-red-100 transition-all outline-hidden font-bold"
          />

          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setShowDropdown(false);
              }}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 rtl:left-2.5 rtl:right-auto ltr:right-2.5 ltr:left-auto p-1 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Dropdown search results with Grouped/Prioritized cards */}
        {showDropdown && searchResults.length > 0 && (
          <div className="absolute z-40 left-0 right-0 mt-1.5 bg-white border-2 border-slate-300 rounded-2xl shadow-2xl max-h-96 overflow-y-auto divide-y divide-slate-100 animate-fadeIn">
            {/* Dropdown Header Stats */}
            <div className="p-2.5 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white border-b border-slate-700 flex flex-wrap items-center justify-between gap-2 text-xs font-extrabold sticky top-0 z-10">
              <span className="text-amber-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>
                  {isAr
                    ? `عثرنا على ${searchResults.length} نتيجة (الأولوية لشيت الفاتورة • الخيار الأول مميز):`
                    : `Found ${searchResults.length} matching items (Invoice priority • #1 highlighted):`}
                </span>
              </span>

              <div className="flex items-center gap-2 text-[10px]">
                <span className="px-2 py-0.5 rounded-full bg-emerald-500 text-white font-black shadow-2xs">
                  ⭐ {searchResults.filter((r) => r.source === 'invoice').length} {isAr ? 'بشيت الفاتورة (أولوية 1)' : 'Invoice (Pri 1)'}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-slate-700 text-slate-200 font-bold border border-slate-600">
                  🏢 {searchResults.filter((r) => r.source === 'master').length} {isAr ? 'بالماستر (أولوية 2)' : 'Master (Pri 2)'}
                </span>
              </div>
            </div>

            {/* Results Items */}
            {searchResults.map((res, idx) => {
              const item = res.item;
              const isInvoiceSource = res.source === 'invoice';
              const isFirstOption = idx === 0;
              const receivedSoFar = session?.jardData[item.code.toUpperCase()]?.countedQty || 0;

              return (
                <div
                  key={`${res.source}_${item.code}`}
                  onClick={() => handleSelectItemFromSearch(item)}
                  className={`p-3.5 cursor-pointer flex items-center justify-between gap-3 text-xs transition-all ${
                    isFirstOption
                      ? isInvoiceSource
                        ? 'bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-700 hover:to-teal-800 text-white border-y-2 border-l-8 rtl:border-r-8 rtl:border-l-0 border-amber-400 shadow-lg ring-2 ring-amber-400/50'
                        : 'bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-700 text-white border-y-2 border-l-8 rtl:border-r-8 rtl:border-l-0 border-yellow-300 shadow-md'
                      : isInvoiceSource
                        ? 'bg-emerald-50/75 hover:bg-emerald-100/90 border-l-4 rtl:border-r-4 rtl:border-l-0 border-emerald-600'
                        : 'bg-white hover:bg-slate-50 border-l-4 rtl:border-r-4 rtl:border-l-0 border-slate-300'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap mb-1.5">
                      {/* First Option Distinctive Badge */}
                      {isFirstOption && (
                        <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-amber-300 text-slate-950 shadow-xs flex items-center gap-1 animate-pulse">
                          <span>👑</span>
                          <span>
                            {isAr
                              ? isInvoiceSource
                                ? 'الخيار الأول المقترح (بشيت الفاتورة) • اضغط Enter'
                                : 'الخيار الأول المقترح • اضغط Enter'
                              : 'Top #1 Match • Press Enter'}
                          </span>
                        </span>
                      )}

                      {/* Priority Source Badge */}
                      {isInvoiceSource ? (
                        <span
                          className={`text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1 ${
                            isFirstOption
                              ? 'bg-white/20 text-white border border-white/40'
                              : 'bg-emerald-600 text-white shadow-2xs'
                          }`}
                        >
                          <Star className="w-3 h-3 fill-amber-300 text-amber-300" />
                          <span>{isAr ? 'موجود بشيت الفاتورة (أولوية 1)' : 'Pri 1: In Invoice Sheet'}</span>
                        </span>
                      ) : (
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                            isFirstOption
                              ? 'bg-white/20 text-white border border-white/40'
                              : 'bg-blue-50 text-blue-700 border border-blue-200'
                          }`}
                        >
                          <Layers className="w-3 h-3" />
                          <span>{isAr ? 'أولوية 2: شيت الماستر (صنف عام)' : 'Pri 2: Master Catalog'}</span>
                        </span>
                      )}

                      {/* Match Reasons Tags */}
                      {res.matchReasons.includes('barcode_ends_with') && (
                        <span
                          className={`text-[10px] font-black px-1.5 py-0.5 rounded border ${
                            isFirstOption
                              ? 'bg-amber-400/30 text-amber-100 border-amber-300/60'
                              : 'bg-amber-100 text-amber-900 border-amber-300'
                          }`}
                        >
                          🔢 {isAr ? `تطابق أرقام (${res.highlightDigits || item.code})` : `Match (${res.highlightDigits || item.code})`}
                        </span>
                      )}

                      {res.matchReasons.includes('price') && (
                        <span
                          className={`text-[10px] font-black px-1.5 py-0.5 rounded border ${
                            isFirstOption
                              ? 'bg-white/20 text-white border-white/40'
                              : 'bg-emerald-100 text-emerald-900 border-emerald-300'
                          }`}
                        >
                          💵 {isAr ? `سعر البيع (${item.price} ج.م)` : `Price (${item.price})`}
                        </span>
                      )}

                      {res.matchReasons.includes('name') && (
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                            isFirstOption
                              ? 'bg-white/20 text-white border-white/40'
                              : 'bg-purple-100 text-purple-900 border-purple-200'
                          }`}
                        >
                          🏷️ {isAr ? 'تطابق بالاسم' : 'Name match'}
                        </span>
                      )}
                    </div>

                    <div
                      className={`font-black text-sm sm:text-base truncate ${
                        isFirstOption ? 'text-white drop-shadow-2xs' : 'text-slate-900'
                      }`}
                    >
                      {item.itemName}
                    </div>

                    <div
                      className={`flex flex-wrap items-center gap-2 text-[11px] mt-1 ${
                        isFirstOption ? 'text-emerald-50 font-semibold' : 'text-slate-500'
                      }`}
                    >
                      <span>{item.fullCategory || item.category || (isAr ? 'عام' : 'General')}</span>
                      {isInvoiceSource && res.invoiceQty !== undefined && (
                        <>
                          <span>•</span>
                          <span
                            className={`font-extrabold px-1.5 py-0.2 rounded ${
                              isFirstOption
                                ? 'bg-amber-300 text-slate-950'
                                : 'text-emerald-800 bg-emerald-100'
                            }`}
                          >
                            📦 {isAr ? `كمية الفاتورة: ${res.invoiceQty} قطعة` : `Invoice Qty: ${res.invoiceQty}`}
                          </span>
                        </>
                      )}
                      {receivedSoFar > 0 && (
                        <>
                          <span>•</span>
                          <span
                            className={`font-extrabold px-1.5 py-0.2 rounded ${
                              isFirstOption ? 'bg-white text-emerald-900' : 'bg-sky-100 text-sky-800'
                            }`}
                          >
                            ✅ {isAr ? `تم استلام: ${receivedSoFar}` : `Received: ${receivedSoFar}`}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Price & Code Block */}
                  <div className="text-right rtl:text-left flex-shrink-0 flex flex-col items-end rtl:items-start gap-1">
                    <span
                      className={`font-mono font-black text-xs px-2.5 py-1 rounded-lg border shadow-2xs ${
                        isFirstOption
                          ? 'bg-amber-300 text-slate-950 border-amber-200'
                          : 'text-red-700 bg-white border-red-200'
                      }`}
                    >
                      {item.code}
                    </span>
                    <div className={`text-xs font-black ${isFirstOption ? 'text-white' : 'text-slate-900'}`}>
                      {item.price}{' '}
                      <span className={`text-[10px] font-semibold ${isFirstOption ? 'text-emerald-100' : 'text-slate-500'}`}>
                        ج.م
                      </span>
                    </div>
                    <span
                      className={`text-[10px] font-black px-2 py-0.5 rounded-md ${
                        isFirstOption
                          ? 'bg-white text-emerald-900 shadow-2xs'
                          : 'text-red-600 hover:underline'
                      }`}
                    >
                      {autoAdd
                        ? (isAr ? `مسح فوري (+${activeQuickScanQty}) ⚡` : `Fast Add (+${activeQuickScanQty}) ⚡`)
                        : (isAr ? 'اختيار لتحديد الكمية 👈' : 'Select item 👈')}
                    </span>
                  </div>
                </div>
              );
            })}
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

      {/* Auto-Add Switch & Quick Scan Step Selector */}
      <div className="bg-red-50/70 border border-red-200/90 rounded-xl p-3 sm:p-3.5 mb-3.5 space-y-2.5 transition-all">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Zap className={`w-4 h-4 ${autoAdd ? 'text-red-600 animate-pulse' : 'text-slate-400'}`} />
            <span className="text-xs font-bold text-slate-900">
              {isAr
                ? autoAdd
                  ? `⚡ وضع المسح السريع (+${activeQuickScanQty} تلقائياً مع كل سكان بالباركود)`
                  : '⚡ وضع المسح السريع (معطّل - إدخال يدوي للكمية)'
                : autoAdd
                  ? `⚡ Fast Scan Mode (+${activeQuickScanQty} auto per barcode scan)`
                  : '⚡ Fast Scan Mode (Disabled - Manual quantity input)'}
            </span>
          </div>

          <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
            <input
              type="checkbox"
              checked={autoAdd}
              onChange={(e) => onAutoAddChange(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-9 h-5 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-red-600"></div>
          </label>
        </div>

        {/* Quick Scan Step Options: +1, +3, +6, +12 */}
        {autoAdd && (
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-red-200/70 animate-fadeIn">
            <span className="text-xs font-extrabold text-red-950 flex items-center gap-1.5">
              <span>{isAr ? 'كمية الإضافة السريعة مع كل مسح:' : 'Quick addition per scan:'}</span>
            </span>

            <div className="flex items-center gap-1 sm:gap-1.5 bg-white p-1 rounded-xl border border-red-200 shadow-2xs">
              {[
                { qty: 1, labelAr: '+1 قطعة', labelEn: '+1 pc' },
                { qty: 3, labelAr: '+3 قطع', labelEn: '+3 pcs' },
                { qty: 6, labelAr: '+6 قطع (نصف دستة)', labelEn: '+6 pcs (half-doz)' },
                { qty: 12, labelAr: '+12 قطعة (دستة كاملة)', labelEn: '+12 pcs (doz)' },
              ].map(({ qty, labelAr, labelEn }) => {
                const isSelected = activeQuickScanQty === qty;
                return (
                  <button
                    key={qty}
                    type="button"
                    onClick={() => onQuickScanQtyChange?.(qty)}
                    title={isAr ? `تحديد إضافة ${labelAr} تلقائياً مع كل مسح` : `Add ${labelEn} per scan`}
                    className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer select-none active:scale-95 ${
                      isSelected
                        ? 'bg-red-600 text-white shadow-xs scale-102 ring-2 ring-red-300'
                        : 'text-slate-700 bg-slate-50 hover:bg-red-50 hover:text-red-700 border border-slate-200/60'
                    }`}
                  >
                    <span>+{qty}</span>
                    <span className="hidden sm:inline mr-1 text-[11px] font-semibold opacity-90">
                      {isAr ? (qty === 1 ? ' قطعة' : qty === 12 ? ' (دستة)' : qty === 6 ? ' (نصف دستة)' : ' قطع') : ''}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
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
              className={`w-full text-[26px] text-[#2672be] font-bold font-mono text-center tracking-wider rounded-xl py-2.5 px-4 transition-all outline-hidden shadow-2xs ${
                !canScan
                  ? 'bg-slate-100 border-2 border-slate-200 cursor-not-allowed'
                  : 'bg-slate-50 border-2 border-slate-300 focus:bg-white focus:border-red-600 focus:ring-4 focus:ring-red-100'
              }`}
            />
            {isSearchingBarcode && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                <Loader2 className="w-4 h-4 animate-spin text-red-600" />
              </div>
            )}
          </div>

          {/* Smart barcode suggestions (e.g. matched by last 3 or 4 digits) */}
          {barcodeSuggestions.length > 0 && !matchedItem && (
            <div className="mt-2 p-2.5 bg-amber-50/90 border border-amber-300 rounded-xl space-y-1.5 animate-fadeIn">
              <div className="flex items-center justify-between text-[11px] font-black text-amber-950">
                <span className="flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  <span>
                    {isAr
                      ? `أصناف تطابق الأرقام (${barcode.trim()}) - الأولوية للفاتورة أولاً:`
                      : `Items matching (${barcode.trim()}) - Priority: Invoice first:`}
                  </span>
                </span>
                <span className="text-[10px] text-amber-800 font-bold">
                  {isAr ? 'اضغط على أي صنف لاختياره فوراً' : 'Click to select'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {barcodeSuggestions.map((sug, idx) => {
                  const isFirst = idx === 0;
                  return (
                    <button
                      key={`${sug.source}_${sug.item.code}`}
                      type="button"
                      onClick={() => handleSelectItemFromSearch(sug.item)}
                      className={`p-2 text-right rtl:text-right ltr:text-left rounded-xl flex items-center justify-between gap-2 text-xs transition-all cursor-pointer shadow-xs active:scale-95 ${
                        isFirst
                          ? 'bg-gradient-to-r from-emerald-600 to-teal-700 text-white border-2 border-amber-400 ring-2 ring-emerald-300'
                          : 'bg-white border border-amber-200 hover:border-red-500 hover:bg-red-50/50'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1 truncate">
                          {isFirst && (
                            <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-amber-300 text-slate-950 flex-shrink-0">
                              👑 خيار 1
                            </span>
                          )}
                          {sug.source === 'invoice' ? (
                            <span
                              className={`text-[9px] font-black px-1.5 py-0.5 rounded flex-shrink-0 ${
                                isFirst ? 'bg-white/20 text-white' : 'bg-emerald-600 text-white'
                              }`}
                            >
                              ⭐ فاتورة
                            </span>
                          ) : (
                            <span
                              className={`text-[9px] font-bold px-1.5 py-0.5 rounded flex-shrink-0 ${
                                isFirst ? 'bg-white/20 text-white' : 'bg-blue-100 text-blue-800'
                              }`}
                            >
                              🏢 ماستر
                            </span>
                          )}
                          <span className={`font-bold truncate text-[11px] ${isFirst ? 'text-white' : 'text-slate-900'}`}>
                            {sug.item.itemName}
                          </span>
                        </div>
                      </div>
                      <div
                        className={`text-right rtl:text-left flex-shrink-0 flex items-center gap-1 font-mono text-[11px] font-bold ${
                          isFirst ? 'text-amber-300' : 'text-red-700'
                        }`}
                      >
                        <span>{sug.item.code}</span>
                        <span className={`font-sans text-[10px] ${isFirst ? 'text-emerald-100' : 'text-slate-500'}`}>
                          ({sug.item.price} ج.م)
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
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
                {isAr ? 'أرقام فقط • الحد الأقصى 50 قطعة' : 'Digits only • Max 50 pieces'}
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
                  if (num > 50) {
                    setManualQty('50');
                    setQtyError(isAr ? '⚠️ أقصى كمية مسموح بها هي 50 قطعة فقط!' : 'Maximum allowed quantity is 50 pieces!');
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
                placeholder={isAr ? 'اكتب عدد القطع بالأرقام (1 إلى 50)...' : 'Type quantity in digits (1 to 50)...'}
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
            <span>
              {isAr
                ? autoAdd
                  ? `إضافة استلام (+${activeQuickScanQty})`
                  : 'إضافة استلام'
                : autoAdd
                  ? `Add Count (+${activeQuickScanQty})`
                  : 'Add Count'}
            </span>
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
            <span>
              {isAr
                ? autoAdd
                  ? `خصم (-${activeQuickScanQty})`
                  : 'خصم'
                : autoAdd
                  ? `Subtract (-${activeQuickScanQty})`
                  : 'Subtract'}
            </span>
          </button>

          <button
            type="button"
            onClick={onUndo}
            disabled={!canUndo}
            title={isAr ? 'تراجع عن آخر حركة مسح (Ctrl+Z)' : 'Undo last action (Ctrl+Z)'}
            className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl font-extrabold text-xs transition-all active:scale-95 cursor-pointer ${
              canUndo
                ? 'bg-slate-700 hover:bg-slate-800 text-white shadow-xs'
                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{isAr ? 'تراجع (Ctrl+Z)' : 'Undo (Ctrl+Z)'}</span>
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
