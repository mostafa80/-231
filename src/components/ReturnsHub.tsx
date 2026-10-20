import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import {
  Package,
  Layers,
  Upload,
  Plus,
  Minus,
  Printer,
  FileSpreadsheet,
  Trash2,
  Search,
  Building2,
  FileText,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Barcode,
  RotateCcw,
  Sparkles,
  Filter,
  SlidersHorizontal,
  Edit2,
  Download,
  Eye,
  HelpCircle,
  Check,
  X,
  History,
  ShieldCheck,
  Tag,
  Info,
  Calendar,
  User,
  ArrowRight,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { DedicatedReturnItem, DedicatedReturnSlip, ReturnConditionType, ReturnItem, Language } from '../types';
import { BatchAddReturnsModal } from './BatchAddReturnsModal';
import {
  exportReturnsToExcel,
  downloadMasterCatalogTemplate,
  downloadConsolidatedReturnsTemplate,
} from '../utils/exportReturnsExcel';
import {
  parseMasterCatalogSheet,
  parseConsolidatedMultiBranchReturns,
} from '../utils/excelParser';
import { PrintReturnsReceipt } from './PrintReturnsReceipt';

interface ReturnsHubProps {
  masterCatalog: Record<string, ReturnItem>;
  onUpdateMasterCatalog?: (catalog: Record<string, ReturnItem>) => void;
  lang: Language;
  soundEnabled: boolean;
  onPlayBeep: () => void;
  showMessage: (text: string, type: 'success' | 'error' | 'info') => void;
}

const RETURNS_STORAGE_KEY = 'so_much_dedicated_returns_data_v1';

export const ReturnsHub: React.FC<ReturnsHubProps> = ({
  masterCatalog,
  onUpdateMasterCatalog,
  lang,
  soundEnabled,
  onPlayBeep,
  showMessage,
}) => {
  const isAr = lang === 'ar';

  // File Inputs
  const multiFileInputRef = useRef<HTMLInputElement>(null);
  const masterFileInputRef = useRef<HTMLInputElement>(null);
  const consolidatedFileInputRef = useRef<HTMLInputElement>(null);

  // Scanner Input Refs
  const barcodeInputRef = useRef<HTMLInputElement>(null);
  const qtyInputRef = useRef<HTMLInputElement>(null);

  // Stored Slips & Items state
  const [slips, setSlips] = useState<DedicatedReturnSlip[]>(() => {
    try {
      const saved = localStorage.getItem(RETURNS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore
    }
    // Default initial return slip matching real demo
    return [
      {
        id: 'slip-default',
        slipNo: '4476',
        branch: 'فرع المعادي بلس',
        date: new Date().toISOString().slice(0, 10),
        keeper: 'محمد مصطفى (أمين المخزن)',
        notes: 'مردودات شهرية - ملابس وأحذية',
        items: [
          {
            id: 'item-1',
            code: '6223012631039',
            itemName: 'شان كريم يد بزبدة الشيا 60جم',
            category: 'عناية بالبشرة',
            qty: 12,
            costPrice: 65,
            sellingPrice: 100,
            totalCost: 65 * 12,
            totalSelling: 100 * 12,
            condition: 'sound',
            branch: 'فرع المعادي بلس',
            returnNo: '4476',
            date: new Date().toISOString().slice(0, 10),
            notes: 'مرتجع زائد عن حاجة الفرع',
            timestamp: Date.now() - 3600000,
          },
          {
            id: 'item-2',
            code: '4902470171036',
            itemName: 'موس حواجب فلامنجو',
            category: 'مستحضرات تجميل',
            qty: 5,
            costPrice: 170,
            sellingPrice: 265,
            totalCost: 170 * 5,
            totalSelling: 265 * 5,
            condition: 'sound',
            branch: 'فرع المعادي بلس',
            returnNo: '4476',
            date: new Date().toISOString().slice(0, 10),
            notes: 'سليم وجاهز للتسكين',
            timestamp: Date.now() - 1800000,
          },
          {
            id: 'item-3',
            code: 'E4091',
            itemName: 'ميدالية 155',
            category: 'اكسسوارات',
            qty: 2,
            costPrice: 95,
            sellingPrice: 155,
            totalCost: 95 * 2,
            totalSelling: 155 * 2,
            condition: 'damaged',
            branch: 'فرع المعادي بلس',
            returnNo: '4476',
            date: new Date().toISOString().slice(0, 10),
            notes: 'كسر بالعلبة',
            timestamp: Date.now() - 900000,
          },
        ],
        createdAt: Date.now(),
      },
    ];
  });

  const [activeSlipId, setActiveSlipId] = useState<string>('all'); // 'all' or specific slip ID
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterCondition, setFilterCondition] = useState<string>('all');
  const [filterBranch, setFilterBranch] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'latest' | 'qty' | 'cost' | 'selling'>('latest');

  // Modals
  const [isBatchModalOpen, setIsBatchModalOpen] = useState<boolean>(false);
  const [isExcelGuideOpen, setIsExcelGuideOpen] = useState<boolean>(false);
  const [isMasterViewerOpen, setIsMasterViewerOpen] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<DedicatedReturnItem | null>(null);

  // ----------------------------------------------------
  // Barcode Scanner State ("سكان للمنتجات و اني ادخل عددها")
  // ----------------------------------------------------
  const [scanBarcode, setScanBarcode] = useState<string>('');
  const [scanQty, setScanQty] = useState<string>('1');
  const [qtyMode, setQtyMode] = useState<'hold' | 'reset' | 'accumulate'>('reset');
  const [scanCost, setScanCost] = useState<string>('');
  const [scanPrice, setScanPrice] = useState<string>('');
  const [scanCondition, setScanCondition] = useState<ReturnConditionType>('sound');
  const [scanNotes, setScanNotes] = useState<string>('');
  const [scanBranch, setScanBranch] = useState<string>('');
  const [scanSlipNo, setScanSlipNo] = useState<string>('');
  const [recentScans, setRecentScans] = useState<DedicatedReturnItem[]>([]);

  // Persist slips
  const saveSlips = useCallback((updated: DedicatedReturnSlip[]) => {
    setSlips(updated);
    try {
      localStorage.setItem(RETURNS_STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }
  }, []);

  // Distinct branches list
  const distinctBranches = useMemo(() => {
    const set = new Set<string>();
    slips.forEach((s) => {
      if (s.branch) set.add(s.branch);
      s.items.forEach((it) => {
        if (it.branch) set.add(it.branch);
      });
    });
    return Array.from(set);
  }, [slips]);

  // Active slip helper
  const activeSlip = useMemo(() => {
    if (activeSlipId === 'all') return null;
    return slips.find((s) => s.id === activeSlipId) || null;
  }, [slips, activeSlipId]);

  // Update scanner default branch & slip when active tab changes
  useEffect(() => {
    if (activeSlip) {
      setScanBranch(activeSlip.branch);
      setScanSlipNo(activeSlip.slipNo);
    } else if (slips.length > 0) {
      setScanBranch(slips[0].branch);
      setScanSlipNo(slips[0].slipNo);
    }
  }, [activeSlip, slips]);

  // Matched item from Master Catalog for the typed/scanned barcode
  const matchedMasterItem = useMemo(() => {
    const clean = scanBarcode.trim().toUpperCase();
    if (!clean) return null;
    return masterCatalog[clean] || null;
  }, [scanBarcode, masterCatalog]);

  // When barcode changes, auto-fill cost, price, and suggest details from master
  const handleBarcodeChange = (val: string) => {
    setScanBarcode(val);
    const clean = val.trim().toUpperCase();
    const match = masterCatalog[clean];
    if (match) {
      if (match.cost !== undefined && match.cost > 0) {
        setScanCost(String(match.cost));
      } else if (match.price > 0) {
        setScanCost(String(Math.round(match.price * 0.65)));
      }
      if (match.price > 0) {
        setScanPrice(String(match.price));
      }
    }
  };

  // Quick Quantity shortcut setter
  const handleQuickQtySelect = (q: number) => {
    setScanQty(String(q));
    barcodeInputRef.current?.focus();
  };

  // ----------------------------------------------------
  // Add Scanned Item ("سكان للمنتجات و اني ادخل عددها")
  // ----------------------------------------------------
  const handleAddScannedItem = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const code = scanBarcode.trim().toUpperCase();
    if (!code) {
      showMessage('يرجى كتابة أو مسح باركود الصنف أولاً!', 'error');
      barcodeInputRef.current?.focus();
      return;
    }

    const qty = parseInt(scanQty, 10);
    if (isNaN(qty) || qty <= 0) {
      showMessage('يرجى إدخال كمية صحيحة (أكبر من صفر)!', 'error');
      qtyInputRef.current?.focus();
      return;
    }

    const match = masterCatalog[code];
    const itemName = match ? match.itemName : `صنف #${code}`;
    const category = match ? match.category : 'عام';

    let cost = parseFloat(scanCost);
    if (isNaN(cost) || cost <= 0) {
      cost = match?.cost && match.cost > 0 ? match.cost : Math.round((match?.price || 100) * 0.65);
    }

    let price = parseFloat(scanPrice);
    if (isNaN(price) || price <= 0) {
      price = match?.price && match.price > 0 ? match.price : 100;
    }

    const targetBranch = scanBranch.trim() || activeSlip?.branch || slips[0]?.branch || 'فرع المعادي بلس';
    const targetReturnNo = scanSlipNo.trim() || activeSlip?.slipNo || slips[0]?.slipNo || '4476';
    const dateStr = new Date().toISOString().slice(0, 10);

    const newItem: DedicatedReturnItem = {
      id: `ret-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      code,
      itemName,
      category,
      qty,
      costPrice: cost,
      sellingPrice: price,
      totalCost: cost * qty,
      totalSelling: price * qty,
      condition: scanCondition,
      branch: targetBranch,
      returnNo: targetReturnNo,
      date: dateStr,
      notes: scanNotes.trim() || undefined,
      timestamp: Date.now(),
    };

    // Find target slip
    const existingSlipIndex = slips.findIndex(
      (s) =>
        s.branch.toLowerCase().trim() === targetBranch.toLowerCase().trim() &&
        s.slipNo.toLowerCase().trim() === targetReturnNo.toLowerCase().trim()
    );

    let updatedSlips: DedicatedReturnSlip[] = [];

    if (existingSlipIndex >= 0) {
      const targetSlip = slips[existingSlipIndex];

      // If accumulate mode is enabled and same code exists, increment qty
      if (qtyMode === 'accumulate') {
        const itemIdx = targetSlip.items.findIndex(
          (it) => it.code.toUpperCase() === code && it.condition === scanCondition
        );
        if (itemIdx >= 0) {
          const updatedItems = [...targetSlip.items];
          const existing = updatedItems[itemIdx];
          const newQty = existing.qty + qty;
          updatedItems[itemIdx] = {
            ...existing,
            qty: newQty,
            totalCost: existing.costPrice * newQty,
            totalSelling: existing.sellingPrice * newQty,
            timestamp: Date.now(),
          };
          updatedSlips = slips.map((s, idx) =>
            idx === existingSlipIndex ? { ...s, items: updatedItems } : s
          );
        } else {
          updatedSlips = slips.map((s, idx) =>
            idx === existingSlipIndex ? { ...s, items: [newItem, ...s.items] } : s
          );
        }
      } else {
        updatedSlips = slips.map((s, idx) =>
          idx === existingSlipIndex ? { ...s, items: [newItem, ...s.items] } : s
        );
      }
    } else {
      // Create new slip
      const newSlip: DedicatedReturnSlip = {
        id: `slip-${Date.now()}`,
        slipNo: targetReturnNo,
        branch: targetBranch,
        date: dateStr,
        keeper: 'أمين المخزن المستلم',
        notes: '',
        items: [newItem],
        createdAt: Date.now(),
      };
      updatedSlips = [newSlip, ...slips];
      setActiveSlipId(newSlip.id);
    }

    saveSlips(updatedSlips);
    setRecentScans((prev) => [newItem, ...prev.slice(0, 4)]);

    if (soundEnabled) onPlayBeep();
    showMessage(
      `✅ تم بنجاح استلام [${itemName}] | العدد: (${qty} قطعة) | التكلفة: (${cost * qty} ج.م)`,
      'success'
    );

    // Reset scanner fields
    setScanBarcode('');
    if (qtyMode === 'reset') {
      setScanQty('1');
    }
    setScanCost('');
    setScanPrice('');
    setScanNotes('');

    // Re-focus barcode input
    setTimeout(() => {
      barcodeInputRef.current?.focus();
    }, 50);
  };

  // Adjust recent scan quantity (+1 / -1)
  const handleAdjustItemQty = (itemId: string, delta: number) => {
    const updated = slips.map((s) => ({
      ...s,
      items: s.items
        .map((it) => {
          if (it.id === itemId) {
            const newQty = Math.max(1, it.qty + delta);
            return {
              ...it,
              qty: newQty,
              totalCost: it.costPrice * newQty,
              totalSelling: it.sellingPrice * newQty,
            };
          }
          return it;
        }),
    }));
    saveSlips(updated);
    if (soundEnabled) onPlayBeep();
  };

  // Delete an item
  const handleDeleteItem = (itemId: string) => {
    if (window.confirm('هل تريد حذف هذا الصنف من كشف المرتجعات؟')) {
      const updated = slips.map((s) => ({
        ...s,
        items: s.items.filter((it) => it.id !== itemId),
      }));
      saveSlips(updated);
      setRecentScans((prev) => prev.filter((it) => it.id !== itemId));
      showMessage('تم حذف الصنف من كشف المرتجعات', 'info');
    }
  };

  // Update item condition directly in table
  const handleUpdateItemCondition = (itemId: string, newCond: ReturnConditionType) => {
    const updated = slips.map((s) => ({
      ...s,
      items: s.items.map((it) => (it.id === itemId ? { ...it, condition: newCond } : it)),
    }));
    saveSlips(updated);
  };

  // ----------------------------------------------------
  // 1. Upload Master Sheet ("ارفع شيت مستر")
  // ----------------------------------------------------
  const handleMasterUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const buffer = await file.arrayBuffer();
      const wb = XLSX.read(buffer, { type: 'array' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rawRows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' }) as unknown[][];

      const newCatalog = parseMasterCatalogSheet(rawRows);
      const catalogCount = Object.keys(newCatalog).length;

      if (catalogCount === 0) {
        showMessage('لم يتم العثور على أصناف وأسعار صالحة في شيت الماستر المرفوع', 'error');
        return;
      }

      if (onUpdateMasterCatalog) {
        onUpdateMasterCatalog(newCatalog);
      }

      // Enrich existing return items with master costs & prices if they had zero
      const enrichedSlips = slips.map((s) => ({
        ...s,
        items: s.items.map((it) => {
          const match = newCatalog[it.code.toUpperCase()];
          if (!match) return it;
          const cost = it.costPrice > 0 ? it.costPrice : match.cost || Math.round(match.price * 0.65);
          const price = it.sellingPrice > 0 ? it.sellingPrice : match.price;
          const name = it.itemName.startsWith('صنف #') ? match.itemName : it.itemName;
          return {
            ...it,
            itemName: name,
            category: it.category === 'عام' ? match.category : it.category,
            costPrice: cost,
            sellingPrice: price,
            totalCost: cost * it.qty,
            totalSelling: price * it.qty,
          };
        }),
      }));
      saveSlips(enrichedSlips);

      if (soundEnabled) onPlayBeep();
      showMessage(
        `🎉 تم بنجاح رفع واعتماد شيت الماستر العام (${catalogCount.toLocaleString()} صنف مسجل بالتكلفة وسعر البيع)!`,
        'success'
      );
    } catch (err) {
      console.error('Error uploading master sheet:', err);
      showMessage('حدث خطأ أثناء قراءة ملف شيت الماستر', 'error');
    }

    if (masterFileInputRef.current) masterFileInputRef.current.value = '';
  };

  // ----------------------------------------------------
  // 2. Upload Consolidated Multi-Branch Sheet
  // ("شيت تاني مجمع فية كل المردودات لكذا لفرع")
  // ----------------------------------------------------
  const handleConsolidatedMultiBranchUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const buffer = await file.arrayBuffer();
      const wb = XLSX.read(buffer, { type: 'array' });

      // Call universal parser
      const parsedSlips = parseConsolidatedMultiBranchReturns(wb, masterCatalog);

      if (parsedSlips.length === 0) {
        showMessage(
          'لم يتم التعرف على أذونات وفروع صالحة في الشيت المجمع. تأكد من وجود عمود الفرع أو صفحات للفروع.',
          'error'
        );
        return;
      }

      const totalItems = parsedSlips.reduce((sum, s) => sum + s.items.length, 0);
      const totalPieces = parsedSlips.reduce((sum, s) => sum + s.items.reduce((acc, it) => acc + it.qty, 0), 0);
      const totalCostSum = parsedSlips.reduce((sum, s) => sum + s.items.reduce((acc, it) => acc + it.totalCost, 0), 0);
      const totalSellingSum = parsedSlips.reduce((sum, s) => sum + s.items.reduce((acc, it) => acc + it.totalSelling, 0), 0);

      // Merge with existing slips
      const merged = [...parsedSlips, ...slips];
      saveSlips(merged);
      setActiveSlipId(parsedSlips[0].id);

      if (soundEnabled) onPlayBeep();
      showMessage(
        `🎉 تم استيراد الشيت المجمع بنجاح: عدد (${parsedSlips.length}) فروع وأذونات | (${totalItems}) صنف | (${totalPieces.toLocaleString()} قطعة) | تكلفة: (${Math.round(totalCostSum).toLocaleString()} ج.م) | بيع: (${Math.round(totalSellingSum).toLocaleString()} ج.م)!`,
        'success'
      );
    } catch (err) {
      console.error('Error uploading consolidated sheet:', err);
      showMessage('حدث خطأ أثناء معالجة شيت المردودات المجمع', 'error');
    }

    if (consolidatedFileInputRef.current) consolidatedFileInputRef.current.value = '';
  };

  // ----------------------------------------------------
  // 3. Multi-Files Upload (Multiple individual Excel files)
  // ----------------------------------------------------
  const handleMultiFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    let totalImportedSlips = 0;
    let totalImportedItems = 0;
    const newSlips: DedicatedReturnSlip[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const buffer = await file.arrayBuffer();
        const wb = XLSX.read(buffer, { type: 'array' });
        const parsed = parseConsolidatedMultiBranchReturns(wb, masterCatalog);
        if (parsed.length > 0) {
          newSlips.push(...parsed);
          totalImportedSlips += parsed.length;
          totalImportedItems += parsed.reduce((sum, s) => sum + s.items.length, 0);
        }
      } catch (err) {
        console.error('Error importing file:', file.name, err);
      }
    }

    if (newSlips.length > 0) {
      const merged = [...newSlips, ...slips];
      saveSlips(merged);
      setActiveSlipId(newSlips[0].id);
      if (soundEnabled) onPlayBeep();
      showMessage(
        `🎉 تم بنجاح استيراد عدد (${totalImportedSlips}) أذونات مرتجعات بإجمالي (${totalImportedItems}) صنف بالتكلفة والبيع!`,
        'success'
      );
    } else {
      showMessage('لم يتم العثور على أذونات صالحة في الملفات المرفوعة', 'error');
    }

    if (multiFileInputRef.current) multiFileInputRef.current.value = '';
  };

  // Multi-Return Batch Save Callback
  const handleSaveBatch = (newItems: DedicatedReturnItem[], branchName: string, returnNoStr: string) => {
    const existing = slips.find(
      (s) => s.slipNo.toLowerCase() === returnNoStr.toLowerCase() && s.branch === branchName
    );

    let updated: DedicatedReturnSlip[] = [];
    if (existing) {
      updated = slips.map((s) => (s.id === existing.id ? { ...s, items: [...newItems, ...s.items] } : s));
    } else {
      const newSlip: DedicatedReturnSlip = {
        id: `slip-${Date.now()}`,
        slipNo: returnNoStr,
        branch: branchName,
        date: new Date().toISOString().slice(0, 10),
        keeper: 'أمين المخزن المستلم',
        notes: 'إذن مردود مجمع',
        items: newItems,
        createdAt: Date.now(),
      };
      updated = [newSlip, ...slips];
      setActiveSlipId(newSlip.id);
    }

    saveSlips(updated);
    if (soundEnabled) onPlayBeep();
    showMessage(`🎉 تم بنجاح إضافة ${newItems.length} صنف مرتجع للإذن [${returnNoStr} - ${branchName}]!`, 'success');
  };

  // Save Item Edit from Modal
  const handleSaveItemEdit = (updatedItem: DedicatedReturnItem) => {
    const updated = slips.map((s) => ({
      ...s,
      items: s.items.map((it) => (it.id === updatedItem.id ? updatedItem : it)),
    }));
    saveSlips(updated);
    setEditingItem(null);
    showMessage(`تم تعديل الصنف [${updatedItem.itemName}] بنجاح`, 'success');
  };

  // Reset entire return system
  const handleResetReturns = () => {
    if (window.confirm('هل أنت متأكد من تصفير كافة المرتجعات والأذونات المسجلة في هذا القسم؟')) {
      saveSlips([]);
      setRecentScans([]);
      showMessage('تم تصفير قسم المرتجعات بالكامل', 'info');
    }
  };

  // Export to Excel
  const handleExportExcel = () => {
    try {
      exportReturnsToExcel(displayItems, activeSlip, slips);
      showMessage('✅ تم تصدير شيت إكسيل المرتجعات بالتكلفة والبيع بنجاح!', 'success');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'فشل التصدير';
      showMessage(msg, 'error');
    }
  };

  // Filtered & Sorted Items List
  const displayItems = useMemo(() => {
    let list: DedicatedReturnItem[] = [];
    if (activeSlipId === 'all') {
      slips.forEach((s) => {
        list = list.concat(s.items);
      });
    } else if (activeSlip) {
      list = activeSlip.items;
    }

    // Filter by query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((it) => {
        return (
          it.code.toLowerCase().includes(q) ||
          it.itemName.toLowerCase().includes(q) ||
          (it.category || '').toLowerCase().includes(q) ||
          (it.branch || '').toLowerCase().includes(q) ||
          (it.returnNo || '').toLowerCase().includes(q) ||
          (it.notes || '').toLowerCase().includes(q)
        );
      });
    }

    // Filter by condition
    if (filterCondition !== 'all') {
      list = list.filter((it) => it.condition === filterCondition);
    }

    // Filter by branch
    if (filterBranch !== 'all') {
      list = list.filter((it) => it.branch === filterBranch);
    }

    // Sort
    return list.sort((a, b) => {
      if (sortBy === 'qty') return b.qty - a.qty;
      if (sortBy === 'cost') return b.totalCost - a.totalCost;
      if (sortBy === 'selling') return b.totalSelling - a.totalSelling;
      return b.timestamp - a.timestamp;
    });
  }, [slips, activeSlipId, activeSlip, searchQuery, filterCondition, filterBranch, sortBy]);

  // Financial KPI Metrics
  const stats = useMemo(() => {
    const targetItems = activeSlipId === 'all' ? slips.flatMap((s) => s.items) : activeSlip?.items || [];

    const totalQty = targetItems.reduce((acc, it) => acc + (it.qty || 0), 0);
    const totalCost = targetItems.reduce((acc, it) => acc + (it.totalCost || 0), 0);
    const totalSelling = targetItems.reduce((acc, it) => acc + (it.totalSelling || 0), 0);
    const soundPieces = targetItems.filter((it) => it.condition === 'sound').reduce((acc, it) => acc + it.qty, 0);
    const damagedPieces = targetItems
      .filter((it) => it.condition === 'damaged' || it.condition === 'defect')
      .reduce((acc, it) => acc + it.qty, 0);
    const uniqueCodes = new Set(targetItems.map((it) => it.code)).size;

    return {
      totalQty,
      totalCost,
      totalSelling,
      profitDiff: totalSelling - totalCost,
      soundPieces,
      damagedPieces,
      uniqueCodes,
      slipsCount: slips.length,
    };
  }, [slips, activeSlipId, activeSlip]);

  const masterCount = Object.keys(masterCatalog).length;

  return (
    <div className="space-y-4">
      {/* Hidden File Inputs */}
      <input
        ref={multiFileInputRef}
        type="file"
        multiple
        accept=".xlsx,.xls"
        className="hidden"
        onChange={handleMultiFileUpload}
      />
      <input
        ref={masterFileInputRef}
        type="file"
        accept=".xlsx,.xls"
        className="hidden"
        onChange={handleMasterUpload}
      />
      <input
        ref={consolidatedFileInputRef}
        type="file"
        accept=".xlsx,.xls"
        className="hidden"
        onChange={handleConsolidatedMultiBranchUpload}
      />

      {/* 1. Returns Hero Banner & Action Toolbar */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-4 sm:p-5 shadow-sm border border-indigo-900/40">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center font-black flex-shrink-0 text-indigo-300">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-black text-white">
                  منظومة إدارة المرتجعات والمردودات (سعر التكلفة وسعر البيع)
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-200 border border-indigo-400/30">
                  قسم المرتجعات المستقل
                </span>
              </div>
              <p className="text-xs text-slate-300 font-medium mt-1">
                سكان الباركود مع إدخال الكميات، دعم رفع شيت الماستر، واستيراد شيت المردودات المجمع لكافة الفروع بالتكلفة والبيع
              </p>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex flex-wrap items-center gap-2 self-start lg:self-auto">
            {/* Consolidated Multi-Branch Upload */}
            <button
              type="button"
              onClick={() => consolidatedFileInputRef.current?.click()}
              title="رفع شيت إكسيل مجمع يحتوي على مردودات لكذا فرع"
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-all active:scale-95 cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>رفع شيت مجمع لكذا فرع 📂</span>
            </button>

            {/* Master Sheet Upload */}
            <button
              type="button"
              onClick={() => masterFileInputRef.current?.click()}
              title="رفع أو تحديث شيت الماستر العام للأصناف والتكلفة والبيع"
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl bg-white hover:bg-slate-100 text-indigo-950 border border-indigo-200 shadow-xs transition-all active:scale-95 cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-indigo-600" />
              <span>رفع شيت ماستر 📥</span>
            </button>

            {/* Batch Manual Add */}
            <button
              type="button"
              onClick={() => setIsBatchModalOpen(true)}
              title="إدخال مجموعة أصناف أو لصق باركودات دفعة واحدة"
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 shadow-xs transition-all active:scale-95 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-indigo-400" />
              <span>إضافة يدوية مجمعة 📋</span>
            </button>

            {/* Print Official Receipt */}
            <button
              type="button"
              onClick={() => window.print()}
              title="طباعة محضر استلام المرتجعات بأماكن التوقيع للمستلم والمراجعة المالية"
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 transition-all active:scale-95 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-slate-300" />
              <span>طباعة بالتوقيعات 🖨️</span>
            </button>

            {/* Export Excel */}
            <button
              type="button"
              onClick={handleExportExcel}
              title="تصدير شيت إكسيل شامل بسعر التكلفة والبيع"
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white shadow-xs transition-all active:scale-95 cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>تصدير إكسيل 📊</span>
            </button>

            {/* Excel Guide Modal */}
            <button
              type="button"
              onClick={() => setIsExcelGuideOpen(true)}
              title="مواصفات وتنسيق شيتات الإكسيل وتحميل النماذج التجريبية"
              className="p-2 rounded-xl bg-indigo-900/60 hover:bg-indigo-800 text-indigo-200 transition-colors cursor-pointer"
            >
              <HelpCircle className="w-4 h-4" />
            </button>

            {/* Reset */}
            <button
              type="button"
              onClick={handleResetReturns}
              title="تصفير قسم المرتجعات"
              className="p-2 rounded-xl text-rose-300 hover:text-white hover:bg-rose-900/50 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 2. Master Sheet & Consolidated Upload Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Card A: Master Catalog Status */}
        <div className="bg-gradient-to-r from-indigo-50/90 via-white to-indigo-50/50 border border-indigo-200/90 rounded-xl p-3.5 flex flex-col justify-between shadow-xs">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold flex-shrink-0 shadow-xs">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-black text-indigo-950">شيت الماستر العام للأصناف والتسعير</h4>
                  {masterCount > 0 ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                      🟢 معتمد ({masterCount.toLocaleString()} صنف)
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                      🟡 غير مرفوع بعد
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-600 mt-0.5">
                  يربط الباركودات تلقائياً باسم الصنف، سعر التكلفة، وسعر البيع فور المسح
                </p>
              </div>
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-indigo-100 flex items-center justify-between gap-2 flex-wrap text-xs">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => masterFileInputRef.current?.click()}
                className="px-2.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[11px] flex items-center gap-1 cursor-pointer transition-all active:scale-95"
              >
                <Upload className="w-3 h-3" />
                <span>رفع / استبدال شيت الماستر</span>
              </button>
              <button
                type="button"
                onClick={downloadMasterCatalogTemplate}
                title="تنزيل ملف إكسيل فارغ بمواصفات وأعمدة الماستر المطلوبة"
                className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-indigo-50 text-indigo-700 font-bold text-[11px] border border-indigo-200 flex items-center gap-1 cursor-pointer transition-all active:scale-95"
              >
                <Download className="w-3 h-3" />
                <span>تحميل نموذج الماستر (.xlsx)</span>
              </button>
            </div>

            {masterCount > 0 && (
              <button
                type="button"
                onClick={() => setIsMasterViewerOpen(true)}
                className="text-[11px] font-bold text-indigo-700 hover:text-indigo-900 underline cursor-pointer flex items-center gap-1"
              >
                <Eye className="w-3 h-3" />
                <span>استعراض أصناف الماستر</span>
              </button>
            )}
          </div>
        </div>

        {/* Card B: Consolidated Multi-Branch Sheet Status */}
        <div className="bg-gradient-to-r from-emerald-50/90 via-white to-emerald-50/50 border border-emerald-200/90 rounded-xl p-3.5 flex flex-col justify-between shadow-xs">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold flex-shrink-0 shadow-xs">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-black text-emerald-950">شيت المردودات المجمع لكافة الفروع</h4>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                    🏢 يدعم كشف متعدد الفروع
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 mt-0.5">
                  يتعرف تلقائياً على كل فرع ورقم مردود ويفصلها لأذونات مستقلة بالتكلفة والبيع
                </p>
              </div>
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-emerald-100 flex items-center justify-between gap-2 flex-wrap text-xs">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => consolidatedFileInputRef.current?.click()}
                className="px-2.5 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-[11px] flex items-center gap-1 cursor-pointer transition-all active:scale-95"
              >
                <Upload className="w-3 h-3" />
                <span>رفع الشيت المجمع الآن</span>
              </button>
              <button
                type="button"
                onClick={downloadConsolidatedReturnsTemplate}
                title="تنزيل نموذج إكسيل مجمع جاهز لكذا فرع لتجربته أو استخدامه"
                className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-emerald-50 text-emerald-800 font-bold text-[11px] border border-emerald-200 flex items-center gap-1 cursor-pointer transition-all active:scale-95"
              >
                <Download className="w-3 h-3" />
                <span>تحميل نموذج الشيت المجمع (.xlsx)</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => multiFileInputRef.current?.click()}
              className="text-[11px] font-bold text-emerald-800 hover:text-emerald-950 underline cursor-pointer"
            >
              + رفع عدة ملفات منفصلة
            </button>
          </div>
        </div>
      </div>

      {/* 3. Financial KPI Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        {/* Total Pieces */}
        <div className="bg-white border border-slate-200 rounded-xl p-3 flex flex-col justify-between shadow-xs">
          <span className="text-[11px] font-bold text-slate-500">إجمالي قطع المرتجع</span>
          <div className="mt-1">
            <span className="text-xl font-black text-slate-900">{stats.totalQty.toLocaleString()}</span>
            <span className="text-xs font-bold text-slate-500 mx-1">قطعة</span>
          </div>
          <span className="text-[10px] font-semibold text-slate-400 mt-0.5">
            {stats.uniqueCodes} صنف مختلف
          </span>
        </div>

        {/* Total Cost Price */}
        <div className="bg-indigo-50/70 border border-indigo-200 rounded-xl p-3 flex flex-col justify-between shadow-xs">
          <span className="text-[11px] font-bold text-indigo-900">إجمالي التكلفة</span>
          <div className="mt-1">
            <span className="text-xl font-black text-indigo-700">
              {Math.round(stats.totalCost).toLocaleString()}
            </span>
            <span className="text-xs font-bold text-indigo-800 mx-1">ج.م</span>
          </div>
          <span className="text-[10px] font-semibold text-indigo-600 mt-0.5">سعر التكلفة الفعلي</span>
        </div>

        {/* Total Selling Price */}
        <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3 flex flex-col justify-between shadow-xs">
          <span className="text-[11px] font-bold text-emerald-900">إجمالي البيع</span>
          <div className="mt-1">
            <span className="text-xl font-black text-emerald-700">
              {Math.round(stats.totalSelling).toLocaleString()}
            </span>
            <span className="text-xs font-bold text-emerald-800 mx-1">ج.م</span>
          </div>
          <span className="text-[10px] font-semibold text-emerald-600 mt-0.5">سعر البيع للجمهور</span>
        </div>

        {/* Profit Difference */}
        <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3 flex flex-col justify-between shadow-xs">
          <span className="text-[11px] font-bold text-amber-900">فارق القيمة (الهامش)</span>
          <div className="mt-1">
            <span className="text-xl font-black text-amber-700">
              {Math.round(stats.profitDiff).toLocaleString()}
            </span>
            <span className="text-xs font-bold text-amber-800 mx-1">ج.م</span>
          </div>
          <span className="text-[10px] font-semibold text-amber-600 mt-0.5">البيع ناقص التكلفة</span>
        </div>

        {/* Sound Items */}
        <div className="bg-white border border-slate-200 rounded-xl p-3 flex flex-col justify-between shadow-xs">
          <span className="text-[11px] font-bold text-slate-500">قطع سليمة 🟢</span>
          <div className="mt-1">
            <span className="text-xl font-black text-emerald-700">{stats.soundPieces.toLocaleString()}</span>
            <span className="text-xs font-bold text-slate-500 mx-1">قطعة</span>
          </div>
          <span className="text-[10px] font-semibold text-slate-400 mt-0.5">جاهزة لإعادة الصرف</span>
        </div>

        {/* Damaged / Defect Items */}
        <div className="bg-white border border-slate-200 rounded-xl p-3 flex flex-col justify-between shadow-xs">
          <span className="text-[11px] font-bold text-slate-500">توالف وعيوب 🔴</span>
          <div className="mt-1">
            <span className="text-xl font-black text-rose-700">{stats.damagedPieces.toLocaleString()}</span>
            <span className="text-xs font-bold text-slate-500 mx-1">قطعة</span>
          </div>
          <span className="text-[10px] font-semibold text-rose-500 mt-0.5">للتكهين أو الضمان</span>
        </div>
      </div>

      {/* 4. Product Barcode Scanner Panel with Quantity Input */}
      {/* ("سكان للمنتجات و اني ادخل عددها") */}
      <div className="bg-white rounded-2xl border-2 border-indigo-200/80 p-4 sm:p-5 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
              <Barcode className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-black text-slate-900">
                سكان المنتجات المرتجعة وإدخال العدد (Scanner & Quantity)
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">
                مسح الباركود بجهاز الاسكانر أو الكاميرا مع تحديد الكمية المطلوبة والحالة واعتماد الأسعار تلقائياً من الماستر
              </p>
            </div>
          </div>

          {/* Quantity Mode Switcher */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-[11px] font-bold self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setQtyMode('reset')}
              title="يعيد الكمية إلى 1 تلقائياً بعد إضافة كل صنف"
              className={`px-2 py-1 rounded-lg transition-all cursor-pointer ${
                qtyMode === 'reset' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              🔄 تصفير العدد لـ 1
            </button>
            <button
              type="button"
              onClick={() => setQtyMode('hold')}
              title="يحتفظ بنفس الكمية لعمليات المسح المتتالية"
              className={`px-2 py-1 rounded-lg transition-all cursor-pointer ${
                qtyMode === 'hold' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              🔒 تثبيت العدد
            </button>
            <button
              type="button"
              onClick={() => setQtyMode('accumulate')}
              title="تراكمي (+1 على نفس الصنف إذا تكرر مسحه)"
              className={`px-2 py-1 rounded-lg transition-all cursor-pointer ${
                qtyMode === 'accumulate' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              ➕ تراكمي
            </button>
          </div>
        </div>

        {/* The Scanning Form */}
        <form onSubmit={handleAddScannedItem} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
            {/* Barcode Input */}
            <div className="sm:col-span-4">
              <label className="block text-xs font-black text-slate-700 mb-1 flex items-center justify-between">
                <span>مسح أو كتابة الباركود *:</span>
                <span className="text-[10px] text-slate-400 font-normal">يدعم سكانر الباركود</span>
              </label>
              <div className="relative">
                <input
                  ref={barcodeInputRef}
                  type="text"
                  required
                  autoFocus
                  value={scanBarcode}
                  onChange={(e) => handleBarcodeChange(e.target.value)}
                  placeholder="امسح الباركود أو اكتب الكود..."
                  className="w-full text-sm font-mono font-black py-2.5 px-3 border-2 border-indigo-300 rounded-xl focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 outline-hidden bg-indigo-50/20"
                />
                {scanBarcode && (
                  <button
                    type="button"
                    onClick={() => {
                      setScanBarcode('');
                      barcodeInputRef.current?.focus();
                    }}
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 cursor-pointer rtl:left-2.5 ltr:right-2.5 ltr:left-auto"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Quantity Input ("ادخل عددها") */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-black text-slate-700 mb-1">
                الكمية / العدد *:
              </label>
              <div className="flex items-center">
                <button
                  type="button"
                  onClick={() => {
                    const cur = parseInt(scanQty, 10) || 1;
                    if (cur > 1) setScanQty(String(cur - 1));
                  }}
                  className="p-2 border border-slate-300 rounded-r-xl bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer rtl:rounded-r-xl rtl:rounded-l-none ltr:rounded-l-xl ltr:rounded-r-none"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <input
                  ref={qtyInputRef}
                  type="number"
                  min={1}
                  max={9999}
                  required
                  value={scanQty}
                  onChange={(e) => setScanQty(e.target.value)}
                  className="w-full text-center text-sm font-black py-2.5 border-y border-slate-300 outline-hidden focus:border-indigo-600 bg-white"
                />
                <button
                  type="button"
                  onClick={() => {
                    const cur = parseInt(scanQty, 10) || 0;
                    setScanQty(String(cur + 1));
                  }}
                  className="p-2 border border-slate-300 rounded-l-xl bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer rtl:rounded-l-xl rtl:rounded-r-none ltr:rounded-r-xl ltr:rounded-l-none"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Target Branch */}
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                الفرع الراسل:
              </label>
              <input
                type="text"
                value={scanBranch}
                onChange={(e) => setScanBranch(e.target.value)}
                placeholder="اسم الفرع"
                className="w-full text-xs font-bold py-2.5 px-2.5 border border-slate-300 rounded-xl focus:border-indigo-600 outline-hidden bg-slate-50"
              />
            </div>

            {/* Target Return No */}
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                رقم الإذن / المردود:
              </label>
              <input
                type="text"
                value={scanSlipNo}
                onChange={(e) => setScanSlipNo(e.target.value)}
                placeholder="رقم الإذن"
                className="w-full text-xs font-mono font-bold py-2.5 px-2.5 border border-slate-300 rounded-xl focus:border-indigo-600 outline-hidden bg-slate-50"
              />
            </div>

            {/* Submit Button */}
            <div className="sm:col-span-2">
              <button
                type="submit"
                className="w-full py-2.5 px-3 rounded-xl text-xs font-black bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>إضافة للمرتجع ↵</span>
              </button>
            </div>
          </div>

          {/* Quick Quantity Chips & Financial Details Row */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pt-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
            {/* Quick Quantity Presets */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] font-bold text-slate-500 ml-1">تحديد سريع للعدد:</span>
              {[1, 2, 3, 5, 10, 12, 20, 24, 50].map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => handleQuickQtySelect(q)}
                  className={`px-2 py-0.5 rounded-md text-[11px] font-black transition-all cursor-pointer ${
                    scanQty === String(q)
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-white text-slate-700 hover:bg-indigo-50 border border-slate-200'
                  }`}
                >
                  {q}
                </button>
              ))}
            </div>

            {/* Condition & Custom Cost/Price toggle */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Condition */}
              <div className="flex items-center gap-1">
                <span className="text-[11px] font-bold text-slate-500">الحالة:</span>
                <select
                  value={scanCondition}
                  onChange={(e) => setScanCondition(e.target.value as ReturnConditionType)}
                  className={`text-xs font-bold py-1 px-2 rounded-lg border outline-hidden cursor-pointer ${
                    scanCondition === 'sound'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                      : scanCondition === 'damaged'
                      ? 'bg-rose-50 text-rose-800 border-rose-300'
                      : 'bg-amber-50 text-amber-800 border-amber-300'
                  }`}
                >
                  <option value="sound">🟢 سليم (جاهز للتسكين)</option>
                  <option value="damaged">🔴 تالف / كسر (تكهين)</option>
                  <option value="defect">🟠 عيب صناعة (ضمان)</option>
                </select>
              </div>

              {/* Cost Price */}
              <div className="flex items-center gap-1">
                <span className="text-[11px] font-bold text-indigo-900">سعر التكلفة:</span>
                <input
                  type="number"
                  step="any"
                  min={0}
                  value={scanCost}
                  onChange={(e) => setScanCost(e.target.value)}
                  placeholder="التكلفة"
                  className="w-16 text-center text-xs font-bold py-1 px-1 bg-white border border-indigo-200 rounded-lg text-indigo-700 outline-hidden focus:border-indigo-600"
                />
              </div>

              {/* Selling Price */}
              <div className="flex items-center gap-1">
                <span className="text-[11px] font-bold text-emerald-900">سعر البيع:</span>
                <input
                  type="number"
                  step="any"
                  min={0}
                  value={scanPrice}
                  onChange={(e) => setScanPrice(e.target.value)}
                  placeholder="البيع"
                  className="w-16 text-center text-xs font-bold py-1 px-1 bg-white border border-emerald-200 rounded-lg text-emerald-700 outline-hidden focus:border-emerald-600"
                />
              </div>
            </div>
          </div>

          {/* Live Matched Item Card (if barcode is entered) */}
          {matchedMasterItem && (
            <div className="bg-emerald-50/80 border border-emerald-300 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fadeIn">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold flex-shrink-0">
                  <Check className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-emerald-950">{matchedMasterItem.itemName}</span>
                    <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-emerald-200 text-emerald-900">
                      معتمد بالماستر
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-emerald-800 font-semibold mt-0.5">
                    <span>كود: <b className="font-mono">{matchedMasterItem.code}</b></span>
                    <span>•</span>
                    <span>التصنيف: <b>{matchedMasterItem.category}</b></span>
                    <span>•</span>
                    <span>سعر التكلفة: <b>{matchedMasterItem.cost || Math.round(matchedMasterItem.price * 0.65)} ج.م</b></span>
                    <span>•</span>
                    <span>سعر البيع: <b>{matchedMasterItem.price} ج.م</b></span>
                  </div>
                </div>
              </div>

              {/* Live Subtotal Preview for this Scan */}
              <div className="flex items-center gap-3 text-xs bg-white px-3 py-1.5 rounded-lg border border-emerald-200 self-start sm:self-auto">
                <div>
                  <span className="text-[10px] text-slate-500 block">إجمالي تكلفة الإضافة</span>
                  <span className="font-black text-indigo-700">
                    {(
                      (parseInt(scanQty, 10) || 1) *
                      (parseFloat(scanCost) || matchedMasterItem.cost || Math.round(matchedMasterItem.price * 0.65))
                    ).toLocaleString()}{' '}
                    ج.م
                  </span>
                </div>
                <div className="border-r border-slate-200 pr-3 rtl:border-r rtl:border-l-0 ltr:border-l ltr:border-r-0 ltr:pl-3">
                  <span className="text-[10px] text-slate-500 block">إجمالي بيع الإضافة</span>
                  <span className="font-black text-emerald-700">
                    {(
                      (parseInt(scanQty, 10) || 1) * (parseFloat(scanPrice) || matchedMasterItem.price)
                    ).toLocaleString()}{' '}
                    ج.م
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Recent Scans Strip */}
          {recentScans.length > 0 && (
            <div className="pt-2 border-t border-slate-100 flex items-center gap-2 overflow-x-auto text-xs scrollbar-thin">
              <span className="text-[11px] font-bold text-slate-400 whitespace-nowrap flex items-center gap-1">
                <History className="w-3.5 h-3.5 text-indigo-600" />
                <span>آخر المسوحات:</span>
              </span>
              {recentScans.map((rItem) => (
                <div
                  key={rItem.id}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-950 whitespace-nowrap"
                >
                  <span className="font-mono font-bold text-[11px]">{rItem.code}</span>
                  <span className="text-[11px] font-semibold text-slate-700 truncate max-w-[120px]">
                    {rItem.itemName}
                  </span>
                  <span className="text-[10px] font-black bg-indigo-200 text-indigo-900 px-1.5 rounded">
                    ×{rItem.qty}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleAdjustItemQty(rItem.id, 1)}
                    className="p-0.5 hover:bg-indigo-200 rounded text-indigo-700 cursor-pointer"
                    title="+1 زيادة"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAdjustItemQty(rItem.id, -1)}
                    className="p-0.5 hover:bg-indigo-200 rounded text-indigo-700 cursor-pointer"
                    title="-1 نقص"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteItem(rItem.id)}
                    className="p-0.5 hover:bg-rose-100 rounded text-rose-600 cursor-pointer"
                    title="حذف"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </form>
      </div>

      {/* 5. Multi-Slips Tabs & Branch Selector */}
      <div className="bg-white rounded-xl border border-slate-200 p-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shadow-xs">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-thin">
          <span className="text-xs font-bold text-slate-400 px-1 whitespace-nowrap">الأذونات:</span>
          {/* All Combined Tab */}
          <button
            type="button"
            onClick={() => setActiveSlipId('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeSlipId === 'all' ? 'bg-slate-900 text-white shadow-xs' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            📊 جميع المرتجعات مجمعة ({slips.reduce((acc, s) => acc + s.items.length, 0)})
          </button>

          {/* Individual Return Slips */}
          {slips.map((s) => {
            const isCurrent = activeSlipId === s.id;
            const slipQty = s.items.reduce((acc, it) => acc + it.qty, 0);
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => setActiveSlipId(s.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap border ${
                  isCurrent
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs ring-2 ring-indigo-200'
                    : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                }`}
              >
                <span>
                  #{s.slipNo} - {s.branch}
                </span>
                <span
                  className={`text-[10px] mx-1 px-1.5 py-0.2 rounded font-black ${
                    isCurrent ? 'bg-indigo-800 text-indigo-100' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {slipQty} ق
                </span>
              </button>
            );
          })}
        </div>

        {/* Quick Branch & Slip Badge Display */}
        {activeSlip && (
          <div className="flex items-center gap-2 text-xs font-bold bg-indigo-50 text-indigo-900 border border-indigo-200 px-2.5 py-1 rounded-lg self-start sm:self-auto">
            <span>
              🏢 الفرع: <b>{activeSlip.branch}</b>
            </span>
            <span>•</span>
            <span>
              🔢 رقم المردود: <b className="font-mono">#{activeSlip.slipNo}</b>
            </span>
          </div>
        )}
      </div>

      {/* 6. Returns Filter Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-3 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shadow-xs">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 rtl:right-3 ltr:left-3 ltr:right-auto" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="🔎 بحث في المرتجعات (كود، اسم، فرع، رقم مردود)..."
            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg py-2 rtl:pr-9 rtl:pl-3 ltr:pl-9 ltr:pr-3 focus:bg-white focus:border-indigo-600 outline-hidden"
          />
        </div>

        {/* Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Branch Filter */}
          <select
            value={filterBranch}
            onChange={(e) => setFilterBranch(e.target.value)}
            className="text-xs font-semibold py-1.5 px-2.5 bg-white border border-slate-200 rounded-lg text-slate-700 focus:border-indigo-600 outline-hidden cursor-pointer"
          >
            <option value="all">🏢 جميع الفروع</option>
            {distinctBranches.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>

          {/* Condition Filter */}
          <select
            value={filterCondition}
            onChange={(e) => setFilterCondition(e.target.value)}
            className="text-xs font-semibold py-1.5 px-2.5 bg-white border border-slate-200 rounded-lg text-slate-700 focus:border-indigo-600 outline-hidden cursor-pointer"
          >
            <option value="all">📦 كافة الحالات</option>
            <option value="sound">🟢 سليم فقط</option>
            <option value="damaged">🔴 تالف فقط</option>
            <option value="defect">🟠 عيب صناعة فقط</option>
          </select>

          {/* Sort By */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="text-xs font-semibold py-1.5 px-2.5 bg-white border border-slate-200 rounded-lg text-slate-700 focus:border-indigo-600 outline-hidden cursor-pointer"
          >
            <option value="latest">⏱️ الأحدث أولاً</option>
            <option value="qty">🔢 الأعلى كمية</option>
            <option value="cost">💰 الأعلى تكلفة</option>
            <option value="selling">💵 الأعلى بيع</option>
          </select>
        </div>
      </div>

      {/* 7. Returns Detailed Table (Showing BOTH Cost Price and Selling Price) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-100/90 border-b border-slate-200 font-bold text-slate-700">
              <tr>
                <th className="p-3 w-8 text-center">م</th>
                <th className="p-3 w-32">الباركود</th>
                <th className="p-3">اسم الصنف المرتجع</th>
                <th className="p-3 w-28">التصنيف</th>
                <th className="p-3 w-28">الفرع</th>
                <th className="p-3 w-24">رقم المردود</th>
                <th className="p-3 w-24 text-center">الحالة</th>
                <th className="p-3 w-24 text-center">الكمية</th>
                <th className="p-3 w-24 text-center bg-indigo-50/70 text-indigo-900">سعر التكلفة</th>
                <th className="p-3 w-28 text-center bg-indigo-50/70 text-indigo-900">إجمالي التكلفة</th>
                <th className="p-3 w-24 text-center bg-emerald-50/70 text-emerald-900">سعر البيع</th>
                <th className="p-3 w-28 text-center bg-emerald-50/70 text-emerald-900">إجمالي البيع</th>
                <th className="p-3 w-24 text-center text-amber-900">الفارق</th>
                <th className="p-3 w-28">ملاحظات</th>
                <th className="p-3 w-16 text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {displayItems.length === 0 ? (
                <tr>
                  <td colSpan={15} className="p-8 text-center text-slate-400 font-bold">
                    لا توجد أصناف مرتجعة مسجلة تطابق البحث. يرجى استخدام السكانر أعلاه أو رفع شيت إكسيل.
                  </td>
                </tr>
              ) : (
                displayItems.map((it, idx) => {
                  const profitDiff = (it.totalSelling || 0) - (it.totalCost || 0);

                  return (
                    <tr key={it.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3 text-center text-slate-400 font-bold">{idx + 1}</td>
                      <td className="p-3 font-mono font-bold text-slate-900">{it.code}</td>
                      <td className="p-3 font-bold text-slate-800">{it.itemName}</td>
                      <td className="p-3 text-slate-500">{it.category || 'عام'}</td>
                      <td className="p-3 font-semibold text-slate-700">{it.branch || '-'}</td>
                      <td className="p-3 font-mono font-bold text-indigo-700">#{it.returnNo || '-'}</td>

                      {/* Condition badge with toggle */}
                      <td className="p-2 text-center">
                        <select
                          value={it.condition}
                          onChange={(e) => handleUpdateItemCondition(it.id, e.target.value as ReturnConditionType)}
                          className={`text-[11px] font-bold py-1 px-1.5 rounded-md border outline-hidden cursor-pointer ${
                            it.condition === 'sound'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : it.condition === 'damaged'
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}
                        >
                          <option value="sound">🟢 سليم</option>
                          <option value="damaged">🔴 تالف</option>
                          <option value="defect">🟠 عيب صناعة</option>
                        </select>
                      </td>

                      {/* Qty with quick plus/minus */}
                      <td className="p-2 text-center">
                        <div className="flex items-center justify-center gap-1 font-black text-slate-900">
                          <button
                            type="button"
                            onClick={() => handleAdjustItemQty(it.id, -1)}
                            className="w-5 h-5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center cursor-pointer text-xs"
                          >
                            -
                          </button>
                          <span className="w-8 text-center text-sm">{it.qty}</span>
                          <button
                            type="button"
                            onClick={() => handleAdjustItemQty(it.id, 1)}
                            className="w-5 h-5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center cursor-pointer text-xs"
                          >
                            +
                          </button>
                        </div>
                      </td>

                      {/* Cost Price */}
                      <td className="p-3 text-center font-bold text-indigo-700 bg-indigo-50/20">{it.costPrice}</td>

                      {/* Total Cost */}
                      <td className="p-3 text-center font-black text-indigo-900 bg-indigo-50/30">
                        {Math.round(it.totalCost).toLocaleString()} ج.م
                      </td>

                      {/* Selling Price */}
                      <td className="p-3 text-center font-bold text-emerald-700 bg-emerald-50/20">{it.sellingPrice}</td>

                      {/* Total Selling */}
                      <td className="p-3 text-center font-black text-emerald-900 bg-emerald-50/30">
                        {Math.round(it.totalSelling).toLocaleString()} ج.م
                      </td>

                      {/* Profit Margin */}
                      <td className="p-3 text-center font-bold text-amber-700">
                        {Math.round(profitDiff).toLocaleString()}
                      </td>

                      {/* Notes */}
                      <td className="p-3 text-slate-500 text-[11px]">{it.notes || '-'}</td>

                      {/* Actions: Edit & Delete */}
                      <td className="p-2 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => setEditingItem(it)}
                            className="p-1 rounded text-slate-400 hover:text-indigo-600 transition-colors cursor-pointer"
                            title="تعديل الصنف"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteItem(it.id)}
                            className="p-1 rounded text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                            title="حذف هذا الصنف"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            {/* Table Footer with Total Sums */}
            {displayItems.length > 0 && (
              <tfoot className="bg-slate-100 font-black border-t-2 border-slate-300 text-xs">
                <tr>
                  <td colSpan={7} className="p-3 text-right">
                    الإجمالي ({displayItems.length} صنف)
                  </td>
                  <td className="p-3 text-center font-black text-sm text-slate-900">
                    {displayItems.reduce((acc, it) => acc + it.qty, 0)}
                  </td>
                  <td className="p-3 text-center">-</td>
                  <td className="p-3 text-center text-indigo-900 font-black">
                    {Math.round(displayItems.reduce((acc, it) => acc + (it.totalCost || 0), 0)).toLocaleString()} ج.م
                  </td>
                  <td className="p-3 text-center">-</td>
                  <td className="p-3 text-center text-emerald-900 font-black">
                    {Math.round(displayItems.reduce((acc, it) => acc + (it.totalSelling || 0), 0)).toLocaleString()} ج.م
                  </td>
                  <td className="p-3 text-center text-amber-900 font-black">
                    {Math.round(
                      displayItems.reduce((acc, it) => acc + ((it.totalSelling || 0) - (it.totalCost || 0)), 0)
                    ).toLocaleString()}
                  </td>
                  <td colSpan={2} className="p-3 text-center">
                    -
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* ---------------------------------------------------- */}
      {/* MODALS */}
      {/* ---------------------------------------------------- */}

      {/* 1. Batch Add Modal */}
      {isBatchModalOpen && (
        <BatchAddReturnsModal
          onClose={() => setIsBatchModalOpen(false)}
          onSaveBatch={handleSaveBatch}
          masterCatalog={masterCatalog}
          existingBranches={distinctBranches}
        />
      )}

      {/* 2. Excel Format Guide Modal */}
      {isExcelGuideOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-5 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-indigo-900">
                <FileSpreadsheet className="w-5 h-5 text-indigo-600" />
                <h3 className="text-sm font-black">دليل مواصفات وتنسيق شيتات الإكسيل (Excel Formats Guide)</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsExcelGuideOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Section 1: Master Sheet */}
            <div className="bg-indigo-50/70 border border-indigo-200 rounded-xl p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black text-indigo-950 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px]">
                    1
                  </span>
                  <span>شيت الماستر العام (Master Catalog Sheet)</span>
                </h4>
                <button
                  type="button"
                  onClick={downloadMasterCatalogTemplate}
                  className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Download className="w-3 h-3" />
                  <span>تنزيل النموذج التجريبي</span>
                </button>
              </div>
              <p className="text-[11px] text-slate-600">
                شيت يحتوي على قائمة الأصناف العامة بالشركة مع أسعارها. الأعمدة التي يتعرف عليها النظام تلقائياً:
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 text-[11px]">
                <div className="bg-white p-2 rounded border border-indigo-100">
                  <b className="text-indigo-950">باركود الصنف</b>
                  <span className="text-[10px] text-slate-500 block">كود، باركود، Barcode</span>
                </div>
                <div className="bg-white p-2 rounded border border-indigo-100">
                  <b className="text-indigo-950">اسم الصنف</b>
                  <span className="text-[10px] text-slate-500 block">الصنف، البيان، Name</span>
                </div>
                <div className="bg-white p-2 rounded border border-indigo-100">
                  <b className="text-indigo-950">سعر التكلفة</b>
                  <span className="text-[10px] text-slate-500 block">التكلفة، Cost</span>
                </div>
                <div className="bg-white p-2 rounded border border-indigo-100">
                  <b className="text-indigo-950">سعر البيع</b>
                  <span className="text-[10px] text-slate-500 block">البيع، السعر، Price</span>
                </div>
                <div className="bg-white p-2 rounded border border-indigo-100">
                  <b className="text-indigo-950">التصنيف</b>
                  <span className="text-[10px] text-slate-500 block">القسم، الفئة، Category</span>
                </div>
                <div className="bg-white p-2 rounded border border-indigo-100">
                  <b className="text-indigo-950">التصنيف الفرعي</b>
                  <span className="text-[10px] text-slate-500 block">الماركة، Subcategory</span>
                </div>
              </div>
            </div>

            {/* Section 2: Consolidated Multi-Branch Sheet */}
            <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black text-emerald-950 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px]">
                    2
                  </span>
                  <span>شيت المردودات المجمع لكذا فرع (Consolidated Returns Sheet)</span>
                </h4>
                <button
                  type="button"
                  onClick={downloadConsolidatedReturnsTemplate}
                  className="px-2.5 py-1 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Download className="w-3 h-3" />
                  <span>تنزيل النموذج التجريبي</span>
                </button>
              </div>
              <p className="text-[11px] text-slate-600">
                شيت إكسيل واحد يجمع مردودات عدة فروع. يدعم طريقتين للتعرف التلقائي:
              </p>
              <ul className="text-[11px] text-slate-700 list-disc list-inside space-y-1">
                <li>
                  <b>الأسلوب الأول (عمود الفرع):</b> جدول واحد فيه عمود <code>الفرع</code> وعمود <code>رقم المردود</code>.
                </li>
                <li>
                  <b>الأسلوب الثاني (صفحات متعددة Tabs):</b> كل ورقة عمل (Sheet Tab) باسم فرع مستقل.
                </li>
              </ul>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-[11px] pt-1">
                <div className="bg-white p-1.5 rounded border border-emerald-100">
                  <b className="text-emerald-950">الفرع</b>
                  <span className="text-[10px] text-slate-500 block">Branch, الفرع الراسل</span>
                </div>
                <div className="bg-white p-1.5 rounded border border-emerald-100">
                  <b className="text-emerald-950">رقم المردود</b>
                  <span className="text-[10px] text-slate-500 block">رقم الإذن, Return No</span>
                </div>
                <div className="bg-white p-1.5 rounded border border-emerald-100">
                  <b className="text-emerald-950">الباركود</b>
                  <span className="text-[10px] text-slate-500 block">كود الصنف, Barcode</span>
                </div>
                <div className="bg-white p-1.5 rounded border border-emerald-100">
                  <b className="text-emerald-950">الكمية</b>
                  <span className="text-[10px] text-slate-500 block">عدد, Qty</span>
                </div>
                <div className="bg-white p-1.5 rounded border border-emerald-100">
                  <b className="text-emerald-950">سعر التكلفة</b>
                  <span className="text-[10px] text-slate-500 block">سعر الشراء, Cost</span>
                </div>
                <div className="bg-white p-1.5 rounded border border-emerald-100">
                  <b className="text-emerald-950">سعر البيع</b>
                  <span className="text-[10px] text-slate-500 block">سعر الوحدة, Price</span>
                </div>
                <div className="bg-white p-1.5 rounded border border-emerald-100">
                  <b className="text-emerald-950">حالة الصنف</b>
                  <span className="text-[10px] text-slate-500 block">سليم / تالف / عيب</span>
                </div>
                <div className="bg-white p-1.5 rounded border border-emerald-100">
                  <b className="text-emerald-950">المستلم</b>
                  <span className="text-[10px] text-slate-500 block">أمين المخزن, Keeper</span>
                </div>
              </div>
            </div>

            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => setIsExcelGuideOpen(false)}
                className="px-5 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs cursor-pointer hover:bg-slate-800"
              >
                فهمت، إغلاق الدليل
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Master Catalog Browser Modal */}
      {isMasterViewerOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-5 shadow-2xl border border-slate-200 max-h-[90vh] flex flex-col space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-indigo-600" />
                <h3 className="text-sm font-black text-slate-900">
                  استعراض قاعدة بيانات شيت الماستر ({masterCount.toLocaleString()} صنف)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsMasterViewerOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 max-h-[60vh]">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-100 font-bold text-slate-700 sticky top-0">
                  <tr>
                    <th className="p-2 w-8 text-center">م</th>
                    <th className="p-2 w-32">الباركود</th>
                    <th className="p-2">اسم الصنف</th>
                    <th className="p-2 w-28">التصنيف</th>
                    <th className="p-2 w-24 text-center">سعر التكلفة</th>
                    <th className="p-2 w-24 text-center">سعر البيع</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {Object.values(masterCatalog).map((mItem, idx) => (
                    <tr key={mItem.code + idx} className="hover:bg-slate-50">
                      <td className="p-2 text-center text-slate-400">{idx + 1}</td>
                      <td className="p-2 font-mono font-bold text-slate-900">{mItem.code}</td>
                      <td className="p-2 font-semibold text-slate-800">{mItem.itemName}</td>
                      <td className="p-2 text-slate-500">{mItem.category}</td>
                      <td className="p-2 text-center font-bold text-indigo-700">
                        {mItem.cost || Math.round(mItem.price * 0.65)} ج.م
                      </td>
                      <td className="p-2 text-center font-bold text-emerald-700">{mItem.price} ج.م</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                إجمالي الأصناف: <b>{masterCount}</b>
              </span>
              <button
                type="button"
                onClick={() => setIsMasterViewerOpen(false)}
                className="px-4 py-1.5 rounded-lg bg-slate-900 text-white font-bold text-xs cursor-pointer hover:bg-slate-800"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Edit Return Item Modal */}
      {editingItem && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-indigo-600" />
                <h3 className="text-xs font-black text-slate-900">تعديل بيانات الصنف المرتجع</h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSaveItemEdit(editingItem);
              }}
              className="space-y-2.5 text-xs"
            >
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-0.5">الباركود:</label>
                <input
                  type="text"
                  value={editingItem.code}
                  disabled
                  className="w-full py-1.5 px-2.5 bg-slate-100 border border-slate-200 rounded-lg font-mono font-bold text-slate-700"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-0.5">اسم الصنف:</label>
                <input
                  type="text"
                  required
                  value={editingItem.itemName}
                  onChange={(e) => setEditingItem({ ...editingItem, itemName: e.target.value })}
                  className="w-full py-1.5 px-2.5 border border-slate-300 rounded-lg font-bold text-slate-800 outline-hidden focus:border-indigo-600"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-0.5">الكمية:</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={editingItem.qty}
                    onChange={(e) => {
                      const q = parseInt(e.target.value, 10) || 1;
                      setEditingItem({
                        ...editingItem,
                        qty: q,
                        totalCost: editingItem.costPrice * q,
                        totalSelling: editingItem.sellingPrice * q,
                      });
                    }}
                    className="w-full py-1.5 px-2 border border-slate-300 rounded-lg text-center font-black outline-hidden focus:border-indigo-600"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-indigo-900 mb-0.5">سعر التكلفة:</label>
                  <input
                    type="number"
                    step="any"
                    min={0}
                    value={editingItem.costPrice}
                    onChange={(e) => {
                      const c = parseFloat(e.target.value) || 0;
                      setEditingItem({
                        ...editingItem,
                        costPrice: c,
                        totalCost: c * editingItem.qty,
                      });
                    }}
                    className="w-full py-1.5 px-2 border border-indigo-200 bg-indigo-50/40 rounded-lg text-center font-bold text-indigo-700 outline-hidden focus:border-indigo-600"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-emerald-900 mb-0.5">سعر البيع:</label>
                  <input
                    type="number"
                    step="any"
                    min={0}
                    value={editingItem.sellingPrice}
                    onChange={(e) => {
                      const p = parseFloat(e.target.value) || 0;
                      setEditingItem({
                        ...editingItem,
                        sellingPrice: p,
                        totalSelling: p * editingItem.qty,
                      });
                    }}
                    className="w-full py-1.5 px-2 border border-emerald-200 bg-emerald-50/40 rounded-lg text-center font-bold text-emerald-700 outline-hidden focus:border-emerald-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-0.5">الحالة:</label>
                <select
                  value={editingItem.condition}
                  onChange={(e) =>
                    setEditingItem({ ...editingItem, condition: e.target.value as ReturnConditionType })
                  }
                  className="w-full py-1.5 px-2.5 border border-slate-300 rounded-lg font-bold outline-hidden focus:border-indigo-600 cursor-pointer"
                >
                  <option value="sound">🟢 سليم (جاهز للتسكين)</option>
                  <option value="damaged">🔴 تالف / كسر (تكهين)</option>
                  <option value="defect">🟠 عيب صناعة (ضمان)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-0.5">ملاحظات:</label>
                <input
                  type="text"
                  value={editingItem.notes || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, notes: e.target.value })}
                  placeholder="ملاحظات الفحص"
                  className="w-full py-1.5 px-2.5 border border-slate-300 rounded-lg outline-hidden focus:border-indigo-600"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold cursor-pointer"
                >
                  حفظ التعديلات
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. Print Component (Active during window.print()) */}
      <PrintReturnsReceipt slip={activeSlip} items={displayItems} />
    </div>
  );
};
