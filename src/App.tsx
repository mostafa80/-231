/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { Header } from './components/Header';
import { SessionBar } from './components/SessionBar';
import { ImportSection } from './components/ImportSection';
import { ScannerSection } from './components/ScannerSection';
import { StatsCards } from './components/StatsCards';
import { ReviewTable } from './components/ReviewTable';
import { PrintReceipt } from './components/PrintReceipt';
import { EditModal } from './components/EditModal';
import { NewReturnModal } from './components/NewReturnModal';

import { Session, ReturnItem, JardItem, ReturnMeta, ItemCondition, Language, FilterType } from './types';
import { playSuccessBeep, playAlarmSound } from './utils/audio';
import {
  parseMultiReturnsSheet,
  parseMasterCatalogSheet,
  createSampleDemoSessions,
  createSessionFromExtracted,
} from './utils/excelParser';
import { smartExport, downloadSampleExcelTemplate } from './utils/excelExporter';
import { analyzeTransferRoute } from './utils/routeAnalyzer';
import { InvoiceDiscrepancyInspector } from './components/InvoiceDiscrepancyInspector';
import { OfflineIndicator } from './components/OfflineIndicator';
import { OfflineGuideModal } from './components/OfflineGuideModal';

const MULTI_RETURNS_STORAGE_KEY = 'jard_multi_returns_hub_v2';
const AUTO_SAVE_INTERVAL = 3 * 60 * 1000; // 3 minutes

export default function App() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [masterCatalog, setMasterCatalog] = useState<Record<string, ReturnItem>>({});

  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [condition, setCondition] = useState<ItemCondition>('sound');
  const [autoAdd, setAutoAdd] = useState<boolean>(true);

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [lang, setLang] = useState<Language>('ar');
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [autoSaveTime, setAutoSaveTime] = useState<string>('');

  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [highlightedCode, setHighlightedCode] = useState<string | null>(null);

  // Modals state
  const [editingItem, setEditingItem] = useState<JardItem | null>(null);
  const [isNewReturnModalOpen, setIsNewReturnModalOpen] = useState<boolean>(false);
  const [isOfflineGuideOpen, setIsOfflineGuideOpen] = useState<boolean>(false);

  // Helper to trigger message
  const showMessage = useCallback((text: string, type: 'success' | 'error' | 'info') => {
    setMessage({ text, type });
    const timer = setTimeout(() => {
      setMessage((current) => (current?.text === text ? null : current));
    }, 4000);
    return () => clearTimeout(timer);
  }, []);

  // Visual screen flash
  const triggerVisualFeedback = useCallback((isSuccess: boolean) => {
    const className = isSuccess ? 'flash-success' : 'flash-error';
    document.body.classList.remove('flash-success', 'flash-error');
    // Trigger reflow
    void document.body.offsetWidth;
    document.body.classList.add(className);
    setTimeout(() => {
      document.body.classList.remove(className);
    }, 500);
  }, []);

  // Sync RTL / LTR document direction
  useEffect(() => {
    document.documentElement.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');
    document.documentElement.setAttribute('lang', lang);
  }, [lang]);

  // Load state from LocalStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(MULTI_RETURNS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.sessions && Array.isArray(parsed.sessions) && parsed.sessions.length > 0) {
          setSessions(parsed.sessions);
          setActiveSessionId(parsed.activeSessionId || parsed.sessions[0].id);
          const timeStr = new Date().toLocaleTimeString(lang === 'ar' ? 'ar-EG' : 'en-US', {
            hour: '2-digit',
            minute: '2-digit',
          });
          setAutoSaveTime(timeStr);
          return;
        }
      }
    } catch {
      // Ignore parse errors
    }

    // Default initial sample session if empty
    const initialDemos = createSampleDemoSessions();
    setSessions(initialDemos);
    setActiveSessionId(initialDemos[0].id);
  }, [lang]);

  // Auto-Save mechanism
  const saveToLocalStorage = useCallback(
    (manual: boolean = false) => {
      if (sessions.length === 0) return;
      try {
        const payload = {
          timestamp: Date.now(),
          activeSessionId,
          sessions,
        };
        localStorage.setItem(MULTI_RETURNS_STORAGE_KEY, JSON.stringify(payload));
        const timeStr = new Date().toLocaleTimeString(lang === 'ar' ? 'ar-EG' : 'en-US', {
          hour: '2-digit',
          minute: '2-digit',
        });
        setAutoSaveTime(timeStr);
        if (manual) {
          showMessage(lang === 'ar' ? '✅ تم حفظ بيانات الأذونات بنجاح' : '✅ Saved successfully', 'success');
        }
      } catch {
        // LocalStorage may be full
      }
    },
    [sessions, activeSessionId, lang, showMessage]
  );

  // Interval auto-save
  useEffect(() => {
    const interval = setInterval(() => {
      saveToLocalStorage(false);
    }, AUTO_SAVE_INTERVAL);

    const handleBeforeUnload = () => {
      saveToLocalStorage(false);
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      clearInterval(interval);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [saveToLocalStorage]);

  // Active Session
  const activeSession = useMemo(() => {
    return sessions.find((s) => s.id === activeSessionId) || sessions[0] || null;
  }, [sessions, activeSessionId]);

  // File Upload Handlers
  const handleFileUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const buffer = evt.target?.result as ArrayBuffer;
        const data = new Uint8Array(buffer);
        const workbook = XLSX.read(data, { type: 'array', cellDates: false });

        let extracted: ReturnType<typeof parseMultiReturnsSheet> = [];
        let recognizedSheetName = '';

        // Try extracting from all sheets in the workbook
        for (const sName of workbook.SheetNames) {
          const worksheet = workbook.Sheets[sName];
          if (!worksheet) continue;
          const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' }) as unknown[][];
          if (!rows || rows.length < 2) continue;

          const res = parseMultiReturnsSheet(rows, sName);
          if (res && res.length > 0) {
            extracted = res;
            recognizedSheetName = sName;
            break;
          }
        }

        if (extracted.length === 0) {
          showMessage(
            lang === 'ar'
              ? 'لم يتم العثور على أصناف فاتورة مبيعات متوافقة في ملف الإكسيل!'
              : 'No valid sales invoice items found in the Excel file!',
            'error'
          );
          return;
        }

        const newSessions = extracted.map((item) => createSessionFromExtracted(item));
        setSessions(newSessions);
        setActiveSessionId(newSessions[0].id);

        if (soundEnabled) playSuccessBeep();
        triggerVisualFeedback(true);

        const firstInv = extracted[0];
        const branchTitle = firstInv.meta.branch || 'فرع المعادي بلس';
        const invNo = firstInv.meta.returnNo ? `#${firstInv.meta.returnNo}` : '';
        const itemCount = Object.keys(firstInv.parsedMap).length;
        const totalPcs = Object.values(firstInv.parsedMap).reduce((s, it) => s + (it.systemQty || 0), 0);
        const totalVal = Object.values(firstInv.parsedMap).reduce((s, it) => s + (it.price * (it.systemQty || 0)), 0);

        if (firstInv.preloadedJardData && Object.keys(firstInv.preloadedJardData).length > 0) {
          let shortages = 0;
          let surpluses = 0;
          let matched = 0;
          Object.values(firstInv.parsedMap).forEach((it) => {
            const j = firstInv.preloadedJardData![it.code.toUpperCase()];
            const diff = (j ? j.countedQty : 0) - it.systemQty;
            if (diff < 0) shortages++;
            else if (diff > 0) surpluses++;
            else matched++;
          });

          showMessage(
            lang === 'ar'
              ? `🎉 تم بنجاح تحليل فاتورة مبيعات [${branchTitle}] ${invNo} (${itemCount} صنف - ${totalPcs} قطعة بقيمة ${totalVal.toLocaleString('en-US', { minimumFractionDigits: 2 })} ج.م) | كشف الفوارق المكتشفة: ${shortages} عجز، ${surpluses} زيادة، ${matched} مطابق!`
              : `🎉 Successfully analyzed sales invoice for [${branchTitle}] ${invNo} (${itemCount} items - ${totalPcs} pcs) | Discrepancies: ${shortages} shortages, ${surpluses} surpluses!`,
            'success'
          );
        } else {
          showMessage(
            lang === 'ar'
              ? `🎉 تم بنجاح قراءة فاتورة مبيعات [${branchTitle}] ${invNo} بالكامل (${itemCount} صنف - ${totalPcs} قطعة بإجمالي ${totalVal.toLocaleString('en-US', { minimumFractionDigits: 2 })} ج.م). جاهز لبدء الاستلام وتدقيق الفوارق فوراً!`
              : `🎉 Successfully recognized sales invoice for [${branchTitle}] ${invNo} (${itemCount} items - ${totalPcs} pcs - ${totalVal.toFixed(2)} EGP). Ready to verify differences!`,
            'success'
          );
        }
      } catch {
        if (soundEnabled) playAlarmSound();
        triggerVisualFeedback(false);
        showMessage(lang === 'ar' ? 'خطأ في قراءة ملف الإكسيل' : 'Error reading Excel file', 'error');
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleMasterUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const buffer = evt.target?.result as ArrayBuffer;
        const data = new Uint8Array(buffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' }) as unknown[][];

        const catalog = parseMasterCatalogSheet(rows);
        setMasterCatalog(catalog);

        // Synchronize and enrich all existing sessions with prices and costs from master catalog
        setSessions((prevSessions) =>
          prevSessions.map((sess) => {
            let hasChanges = false;
            const updatedInv = { ...sess.inventoryMap };
            const updatedJard = { ...sess.jardData };

            Object.keys(updatedInv).forEach((k) => {
              const masterItem = catalog[k];
              if (masterItem) {
                if (masterItem.price > 0 && updatedInv[k].price !== masterItem.price) {
                  updatedInv[k] = { ...updatedInv[k], price: masterItem.price };
                  hasChanges = true;
                }
                if (masterItem.cost !== undefined && masterItem.cost > 0 && updatedInv[k].cost !== masterItem.cost) {
                  updatedInv[k] = { ...updatedInv[k], cost: masterItem.cost };
                  hasChanges = true;
                }
                if (updatedJard[k]) {
                  updatedJard[k] = {
                    ...updatedJard[k],
                    price: masterItem.price > 0 ? masterItem.price : updatedJard[k].price,
                    cost: masterItem.cost !== undefined && masterItem.cost > 0 ? masterItem.cost : updatedJard[k].cost,
                  };
                  hasChanges = true;
                }
              }
            });

            return hasChanges ? { ...sess, inventoryMap: updatedInv, jardData: updatedJard } : sess;
          })
        );

        const count = Object.keys(catalog).length;
        if (soundEnabled) playSuccessBeep();
        triggerVisualFeedback(true);

        showMessage(
          lang === 'ar'
            ? `✅ تم استيراد ماستر الأصناف بنجاح وتحديث أسعار البيع والتكلفة (${count} صنف مسجل)`
            : `✅ Loaded ${count} master catalog items & updated prices`,
          'success'
        );
      } catch {
        if (soundEnabled) playAlarmSound();
        triggerVisualFeedback(false);
        showMessage(lang === 'ar' ? 'خطأ في قراءة شيت الماستر' : 'Error reading master catalog', 'error');
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // Add Item to active session
  const handleAddItem = (
    code: string,
    qty: number,
    isSubtract: boolean = false,
    itemCondition: ItemCondition = 'sound'
  ) => {
    if (!activeSession) return;

    const key = code.trim().toUpperCase();
    let item = activeSession.inventoryMap[key];

    // Check master catalog fallback if not found in active return slip
    if (!item) {
      if (masterCatalog[key]) {
        item = {
          itemName: masterCatalog[key].itemName,
          code: masterCatalog[key].code,
          systemQty: 0,
          price: masterCatalog[key].price,
          cost: masterCatalog[key].cost || 0,
          category: masterCatalog[key].category,
          subcat: masterCatalog[key].subcat || '',
          fullCategory: masterCatalog[key].fullCategory || masterCatalog[key].category,
        };
      } else {
        // Unlisted item
        if (soundEnabled) playAlarmSound();
        triggerVisualFeedback(false);
        showMessage(
          lang === 'ar'
            ? `⚠️ صنف غير مدرج بالإذن أو الماستر: ${code}`
            : `⚠️ Item not in invoice or master catalog: ${code}`,
          'error'
        );
        return;
      }
    }

    setSessions((prev) =>
      prev.map((sess) => {
        if (sess.id !== activeSession.id) return sess;

        // Save current jardData state for undo
        const newUndoStack = [...sess.undoStack];
        if (newUndoStack.length >= 15) newUndoStack.shift();
        newUndoStack.push(JSON.stringify(sess.jardData));

        const updatedInventoryMap = { ...sess.inventoryMap };
        if (!updatedInventoryMap[key]) {
          updatedInventoryMap[key] = item!;
        }

        const existingJard = sess.jardData[key] || {
          itemName: item!.itemName,
          code: item!.code,
          systemQty: item!.systemQty,
          soundQty: 0,
          damagedQty: 0,
          countedQty: 0,
          price: item!.price,
          cost: item!.cost || 0,
          category: item!.category,
          subcat: item!.subcat,
          fullCategory: item!.fullCategory,
          time: Date.now(),
        };

        const targetField = itemCondition === 'damaged' ? 'damagedQty' : 'soundQty';
        let currentTargetVal = existingJard[targetField];

        if (isSubtract) {
          if (currentTargetVal < qty) {
            showMessage(
              lang === 'ar' ? 'الكمية المراد خصمها أكبر من المستلم' : 'Quantity to subtract exceeds count',
              'error'
            );
            return sess;
          }
          currentTargetVal = Math.max(0, currentTargetVal - qty);
        } else {
          currentTargetVal += qty;
        }

        const soundQty = targetField === 'soundQty' ? currentTargetVal : existingJard.soundQty;
        const damagedQty = targetField === 'damagedQty' ? currentTargetVal : existingJard.damagedQty;
        const countedQty = soundQty + damagedQty;

        const updatedJardItem: JardItem = {
          ...existingJard,
          soundQty,
          damagedQty,
          countedQty,
          time: Date.now(),
        };

        return {
          ...sess,
          inventoryMap: updatedInventoryMap,
          jardData: {
            ...sess.jardData,
            [key]: updatedJardItem,
          },
          undoStack: newUndoStack,
        };
      })
    );

    if (soundEnabled) playSuccessBeep();
    triggerVisualFeedback(true);
  };

  // Undo Handler
  const handleUndo = () => {
    if (!activeSession || activeSession.undoStack.length === 0) return;

    setSessions((prev) =>
      prev.map((sess) => {
        if (sess.id !== activeSession.id) return sess;
        const newStack = [...sess.undoStack];
        const lastStateStr = newStack.pop();
        if (!lastStateStr) return sess;

        try {
          const restoredJardData = JSON.parse(lastStateStr);
          return {
            ...sess,
            jardData: restoredJardData,
            undoStack: newStack,
          };
        } catch {
          return sess;
        }
      })
    );

    showMessage(lang === 'ar' ? 'تم التراجع عن آخر إجراء' : 'Action undone', 'info');
  };

  // Edit item counts modal save
  const handleSaveEdit = (code: string, soundQty: number, damagedQty: number) => {
    if (!activeSession) return;
    const key = code.toUpperCase();
    const item = activeSession.inventoryMap[key];
    if (!item) return;

    setSessions((prev) =>
      prev.map((sess) => {
        if (sess.id !== activeSession.id) return sess;

        const newUndoStack = [...sess.undoStack];
        if (newUndoStack.length >= 15) newUndoStack.shift();
        newUndoStack.push(JSON.stringify(sess.jardData));

        const updatedJard: JardItem = {
          itemName: item.itemName,
          code: item.code,
          systemQty: item.systemQty,
          soundQty,
          damagedQty,
          countedQty: soundQty + damagedQty,
          price: item.price,
          cost: item.cost || 0,
          category: item.category,
          subcat: item.subcat,
          fullCategory: item.fullCategory,
          time: Date.now(),
        };

        return {
          ...sess,
          jardData: {
            ...sess.jardData,
            [key]: updatedJard,
          },
          undoStack: newUndoStack,
        };
      })
    );

    setEditingItem(null);
    if (soundEnabled) playSuccessBeep();
    showMessage(lang === 'ar' ? 'تم تعديل كميات الصنف بنجاح' : 'Item updated successfully', 'success');
  };

  // Close session tab
  const handleCloseSession = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (sessions.length <= 1) {
      showMessage(
        lang === 'ar' ? 'يجب الإبقاء على إذن واحد على الأقل مفتوحاً' : 'At least one tab must remain open',
        'info'
      );
      return;
    }

    const sessToClose = sessions.find((s) => s.id === id);
    if (
      window.confirm(
        lang === 'ar'
          ? `هل أنت متأكد من إغلاق (${sessToClose?.title || 'هذا الإذن'})؟`
          : `Close tab (${sessToClose?.title})?`
      )
    ) {
      const remaining = sessions.filter((s) => s.id !== id);
      setSessions(remaining);
      if (activeSessionId === id) {
        setActiveSessionId(remaining[0].id);
      }
    }
  };

  // Add custom manual return session
  const handleAddNewReturn = (meta: ReturnMeta) => {
    const id = 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
    const routeInfo = analyzeTransferRoute(meta.branch, meta.notes);
    const newSession: Session = {
      id,
      title: `${meta.branch} (#${meta.returnNo})`,
      inventoryMap: {},
      jardData: {},
      undoStack: [],
      returnMeta: meta,
      routeInfo,
    };

    setSessions((prev) => [...prev, newSession]);
    setActiveSessionId(id);
    setIsNewReturnModalOpen(false);
    showMessage(lang === 'ar' ? 'تم إنشاء إذن جديد بنجاح' : 'New return slip created', 'success');
  };

  // Reset active session
  const handleResetSession = () => {
    if (!activeSession) return;
    if (
      window.confirm(
        lang === 'ar'
          ? `هل أنت متأكد من تصفير استلام الإذن (${activeSession.title})؟`
          : `Are you sure you want to reset (${activeSession.title})?`
      )
    ) {
      setSessions((prev) =>
        prev.map((s) => {
          if (s.id !== activeSession.id) return s;
          return {
            ...s,
            jardData: {},
            undoStack: [],
          };
        })
      );
      showMessage(lang === 'ar' ? 'تم تصفير استلام هذا الإذن' : 'Return reception reset', 'info');
    }
  };

  // Smart Excel Export
  const handleExportExcel = () => {
    if (!activeSession) return;
    try {
      smartExport(activeSession);
      showMessage(
        lang === 'ar'
          ? `تم تصدير ملف الإكسيل باسم: ${activeSession.returnMeta.branch || 'الفرع'}`
          : 'Excel file exported successfully',
        'success'
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Export failed';
      showMessage(msg, 'error');
    }
  };

  // Print Receipt directly
  const handlePrintReceipt = () => {
    if (!activeSession || Object.keys(activeSession.inventoryMap).length === 0) {
      showMessage(lang === 'ar' ? 'لا توجد بيانات لطبعها في هذا الإذن!' : 'No data to print!', 'error');
      return;
    }
    window.print();
  };

  // Complete, Approve & Auto Download Multi-Sheet Excel (All, Shortages, Surpluses)
  const handleCompleteAndExport = () => {
    if (!activeSession) return;
    const timeStr = new Date().toLocaleTimeString(lang === 'ar' ? 'ar-EG' : 'en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });

    setSessions((prev) =>
      prev.map((s) => (s.id === activeSession.id ? { ...s, isCompleted: true, completedAt: timeStr } : s))
    );

    if (soundEnabled) playSuccessBeep();
    triggerVisualFeedback(true);

    try {
      smartExport(activeSession);
      showMessage(
        lang === 'ar'
          ? `🎉 تم استلام واعتماد إذن [${activeSession.returnMeta.branch || activeSession.title}] وتنزيل شيت الإكسيل بصفحاته الثلاث (المستلم، العجوزات، الزيادة) بنجاح!`
          : `✅ Slip received & approved! Excel workbook downloaded with 3 sheets (All, Shortages, Surpluses).`,
        'success'
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Export failed';
      showMessage(msg, 'error');
    }

    setTimeout(() => {
      saveToLocalStorage(false);
    }, 150);
  };

  // Quick Match All items with invoice quantities (for fast auditor validation)
  const handleQuickMatchAll = () => {
    if (!activeSession) return;
    if (
      window.confirm(
        lang === 'ar'
          ? 'هل تريد اعتماد جميع كميات الفاتورة كمطابقة 100% دفعة واحدة؟ يمكنك بعدها تعديل أي أصناف بها عجز أو زيادة فقط.'
          : 'Mark all items as 100% matched with invoice quantities?'
      )
    ) {
      setSessions((prev) =>
        prev.map((s) => {
          if (s.id !== activeSession.id) return s;
          const newJard: Record<string, JardItem> = {};
          Object.values(s.inventoryMap).forEach((it) => {
            const key = it.code.toUpperCase();
            newJard[key] = {
              itemName: it.itemName,
              code: it.code,
              systemQty: it.systemQty,
              soundQty: it.systemQty,
              damagedQty: 0,
              countedQty: it.systemQty,
              price: it.price,
              cost: it.cost || 0,
              category: it.category,
              subcat: it.subcat,
              fullCategory: it.fullCategory,
              time: Date.now(),
            };
          });
          return { ...s, jardData: newJard };
        })
      );
      if (soundEnabled) playSuccessBeep();
      triggerVisualFeedback(true);
      showMessage(
        lang === 'ar'
          ? '✅ تم اعتماد جميع أصناف الفاتورة كمطابقة 100% بنجاح!'
          : '✅ All invoice items marked as 100% matched',
        'success'
      );
    }
  };

  // Load sample demo data
  const handleLoadDemoData = () => {
    if (
      window.confirm(
        lang === 'ar'
          ? 'هل تريد تحميل فاتورة مبيعات فرع المعادي بلس التجريبية للاختبار الفوري؟'
          : 'Load demo sales invoice for branch testing?'
      )
    ) {
      const demoSessions = createSampleDemoSessions();
      setSessions(demoSessions);
      setActiveSessionId(demoSessions[0].id);
      showMessage(
        lang === 'ar'
          ? '🎉 تم تحميل فاتورة مبيعات فرع المعادي بلس مع كشف الفوارق التجريبية بنجاح!'
          : 'Loaded demo sales invoice with discrepancy breakdown',
        'success'
      );
    }
  };

  return (
    <div className="min-h-screen text-slate-900 pb-20 sm:pb-8">
      {/* Screen Container */}
      <div className="container max-w-7xl mx-auto px-3 sm:px-5 py-3 sm:py-5 no-print">
        {/* Header */}
        <Header
          lang={lang}
          onToggleLang={() => setLang((l) => (l === 'ar' ? 'en' : 'ar'))}
          soundEnabled={soundEnabled}
          onToggleSound={() => setSoundEnabled((s) => !s)}
          onLoadDemoData={handleLoadDemoData}
          onDownloadTemplate={downloadSampleExcelTemplate}
          onOpenOfflineGuide={() => setIsOfflineGuideOpen(true)}
        />

        {/* Sessions & Tabs Bar */}
        <SessionBar
          sessions={sessions}
          activeSessionId={activeSessionId}
          onSelectSession={(id) => setActiveSessionId(id)}
          onCloseSession={handleCloseSession}
          onAddNewSession={() => setIsNewReturnModalOpen(true)}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          lang={lang}
        />

        {/* 1. Import Section */}
        <ImportSection
          session={activeSession}
          onFileUpload={handleFileUpload}
          onMasterUpload={handleMasterUpload}
          masterCatalogCount={Object.keys(masterCatalog).length}
          autoSaveTime={autoSaveTime}
          lang={lang}
        />

        {/* 2. Scanner & Input Section */}
        <ScannerSection
          session={activeSession}
          masterCatalog={masterCatalog}
          condition={condition}
          onConditionChange={setCondition}
          autoAdd={autoAdd}
          onAutoAddChange={setAutoAdd}
          onAddItem={handleAddItem}
          onUndo={handleUndo}
          canUndo={(activeSession?.undoStack.length || 0) > 0}
          message={message}
          lang={lang}
        />

        {/* Stats 7 Cards */}
        <StatsCards session={activeSession} lang={lang} />

        {/* 3. Dedicated Invoice Discrepancy Inspector & Radar */}
        <InvoiceDiscrepancyInspector
          session={activeSession}
          onEditItem={(code) => {
            setHighlightedCode(code);
            const key = code.toUpperCase();
            if (activeSession) {
              const j = activeSession.jardData[key] || {
                itemName: activeSession.inventoryMap[key]?.itemName || code,
                code,
                systemQty: activeSession.inventoryMap[key]?.systemQty || 0,
                soundQty: 0,
                damagedQty: 0,
                countedQty: 0,
                price: activeSession.inventoryMap[key]?.price || 0,
                cost: activeSession.inventoryMap[key]?.cost || 0,
                category: activeSession.inventoryMap[key]?.category || 'عام',
                time: Date.now(),
              };
              setEditingItem(j);
            }
          }}
          onFilterSelect={setActiveFilter}
          currentFilter={activeFilter}
          onQuickMatchAll={handleQuickMatchAll}
          onResetCounts={handleResetSession}
          lang={lang}
        />

        {/* 4. Review & Audit Table (Full Width) */}
        <ReviewTable
          session={activeSession}
          onEditItem={(code) => {
            setHighlightedCode(code);
            const key = code.toUpperCase();
            if (activeSession) {
              const j = activeSession.jardData[key] || {
                itemName: activeSession.inventoryMap[key]?.itemName || code,
                code,
                systemQty: activeSession.inventoryMap[key]?.systemQty || 0,
                soundQty: 0,
                damagedQty: 0,
                countedQty: 0,
                price: activeSession.inventoryMap[key]?.price || 0,
                cost: activeSession.inventoryMap[key]?.cost || 0,
                category: activeSession.inventoryMap[key]?.category || 'عام',
                time: Date.now(),
              };
              setEditingItem(j);
            }
          }}
          onExportExcel={handleExportExcel}
          onPrintReceipt={handlePrintReceipt}
          onCompleteAndExport={handleCompleteAndExport}
          onManualSave={() => saveToLocalStorage(true)}
          onResetSession={handleResetSession}
          highlightedCode={highlightedCode}
          lang={lang}
          filter={activeFilter}
          onFilterChange={setActiveFilter}
        />
      </div>

      {/* Official A4 Print Receipt View (hidden on screen, visible on window.print()) */}
      <PrintReceipt session={activeSession} />

      {/* Mobile Floating Bottom Bar */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-200 px-3 py-2 flex items-center justify-around gap-2 z-40 no-print shadow-lg">
        <button
          type="button"
          onClick={() => {
            const input = document.querySelector('input[type="text"][placeholder*="الباركود"], input[type="text"][placeholder*="barcode"]') as HTMLInputElement;
            input?.focus();
          }}
          className="flex-1 py-2 px-3 rounded-xl font-bold text-xs bg-red-600 text-white text-center shadow-xs cursor-pointer"
        >
          🔍 {lang === 'ar' ? 'مسح' : 'Scan'}
        </button>

        <button
          type="button"
          onClick={() => setCondition((c) => (c === 'sound' ? 'damaged' : 'sound'))}
          className={`py-2 px-3 rounded-xl font-bold text-xs text-center border cursor-pointer ${
            condition === 'sound'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
              : 'bg-rose-50 text-rose-800 border-rose-300'
          }`}
        >
          {condition === 'sound' ? (lang === 'ar' ? 'سليم ✅' : 'Sound ✅') : (lang === 'ar' ? 'متلف ⚠️' : 'Damaged ⚠️')}
        </button>

        <button
          type="button"
          onClick={handlePrintReceipt}
          className="flex-1 py-2 px-3 rounded-xl font-bold text-xs bg-slate-900 text-white text-center shadow-xs cursor-pointer"
        >
          🖨️ {lang === 'ar' ? 'طباعة' : 'Print'}
        </button>
      </div>

      {/* Modals */}
      {editingItem && (
        <EditModal
          item={editingItem}
          onSave={handleSaveEdit}
          onClose={() => setEditingItem(null)}
          lang={lang}
        />
      )}

      {isNewReturnModalOpen && (
        <NewReturnModal
          onAdd={handleAddNewReturn}
          onClose={() => setIsNewReturnModalOpen(false)}
          lang={lang}
        />
      )}

      {/* Offline Mode Indicator Banner */}
      <OfflineIndicator
        onOpenOfflineGuide={() => setIsOfflineGuideOpen(true)}
        lang={lang}
      />

      {/* Offline Guide & Install Assistance Modal */}
      <OfflineGuideModal
        isOpen={isOfflineGuideOpen}
        onClose={() => setIsOfflineGuideOpen(false)}
        lang={lang}
      />
    </div>
  );
}
