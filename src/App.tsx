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
import { useThemeManager } from './hooks/useThemeManager';
import { ThemeSettingsModal } from './components/ThemeSettingsModal';
import { ExeConverterModal } from './components/ExeConverterModal';
import { WhatsAppReportModal } from './components/WhatsAppReportModal';
import { UploadGatekeeper } from './components/UploadGatekeeper';
import { Keyboard } from 'lucide-react';
import {
  saveAppStateOffline,
  loadSyncFallbackState,
  loadAppStateOffline,
  clearOfflineStorage,
} from './utils/offlineStorage';

const AUTO_SAVE_INTERVAL = 30 * 1000; // 30 seconds backup heartbeat (in addition to instant save on every scan)

export default function App() {
  const initialSync = useMemo(() => loadSyncFallbackState(), []);

  const [sessions, setSessions] = useState<Session[]>(() => {
    if (initialSync.sessions && initialSync.sessions.length > 0) {
      return initialSync.sessions;
    }
    return createSampleDemoSessions();
  });
  const [activeSessionId, setActiveSessionId] = useState<string | null>(() => {
    if (initialSync.sessions && initialSync.sessions.length > 0) {
      return initialSync.activeSessionId || initialSync.sessions[0].id;
    }
    return null;
  });
  const [masterCatalog, setMasterCatalog] = useState<Record<string, ReturnItem>>(() => {
    return initialSync.masterCatalog || {};
  });
  const [isHydrated, setIsHydrated] = useState<boolean>(false);

  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [condition, setCondition] = useState<ItemCondition>('sound');
  const [autoAdd, setAutoAdd] = useState<boolean>(true);
  const [quickScanQty, setQuickScanQty] = useState<number>(() => {
    const saved = localStorage.getItem('so_much_quick_scan_qty');
    if (saved) {
      const num = parseInt(saved, 10);
      if ([1, 3, 6, 12].includes(num)) return num;
    }
    return 1;
  });

  const handleQuickScanQtyChange = (qty: number) => {
    setQuickScanQty(qty);
    localStorage.setItem('so_much_quick_scan_qty', String(qty));
  };

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [lang, setLang] = useState<Language>('ar');
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [autoSaveTime, setAutoSaveTime] = useState<string>('');

  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [highlightedCode, setHighlightedCode] = useState<string | null>(null);
  const [lastScannedCode, setLastScannedCode] = useState<string | null>(null);

  // Modals state
  const [editingItem, setEditingItem] = useState<JardItem | null>(null);
  const [isNewReturnModalOpen, setIsNewReturnModalOpen] = useState<boolean>(false);
  const [isOfflineGuideOpen, setIsOfflineGuideOpen] = useState<boolean>(false);
  const [isThemeModalOpen, setIsThemeModalOpen] = useState<boolean>(false);
  const [isExeModalOpen, setIsExeModalOpen] = useState<boolean>(false);
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState<boolean>(false);

  // Animation Toggle State (persisted in LocalStorage)
  const [animationsEnabled, setAnimationsEnabled] = useState<boolean>(() => {
    return localStorage.getItem('so_much_animations_enabled') !== 'false';
  });

  useEffect(() => {
    if (animationsEnabled) {
      document.documentElement.classList.remove('disable-animations');
      document.body.classList.remove('disable-animations');
      localStorage.setItem('so_much_animations_enabled', 'true');
    } else {
      document.documentElement.classList.add('disable-animations');
      document.body.classList.add('disable-animations');
      localStorage.setItem('so_much_animations_enabled', 'false');
    }
  }, [animationsEnabled]);

  const handleToggleAnimations = () => {
    setAnimationsEnabled((prev) => {
      const next = !prev;
      showMessage(
        next
          ? (lang === 'ar' ? '✨ تم تفعيل التأثيرات الحركية (الأنيميشن)' : '✨ Animations enabled')
          : (lang === 'ar' ? '⏸️ تم إيقاف التأثيرات الحركية لتسريع الأداء والاستجابة الفورية' : '⏸️ Animations disabled for maximum speed'),
        'info'
      );
      return next;
    });
  };

  // Theme & Typography Manager
  const {
    config: themeConfig,
    setTheme,
    setFont,
    setFontSize,
    setTabularNums,
    resetDefaults: resetThemeDefaults,
  } = useThemeManager();

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

  // Load full state from IndexedDB + LocalStorage on mount (survives laptop power loss / offline restart)
  useEffect(() => {
    let mounted = true;
    loadAppStateOffline().then((persisted) => {
      if (!mounted) return;
      if (persisted && persisted.sessions && persisted.sessions.length > 0) {
        setSessions(persisted.sessions);
        setActiveSessionId(persisted.activeSessionId || persisted.sessions[0].id);
        if (persisted.masterCatalog && Object.keys(persisted.masterCatalog).length > 0) {
          setMasterCatalog(persisted.masterCatalog);
        }
        const timeStr = new Date(persisted.timestamp || Date.now()).toLocaleTimeString(
          lang === 'ar' ? 'ar-EG' : 'en-US',
          { hour: '2-digit', minute: '2-digit', second: '2-digit' }
        );
        setAutoSaveTime(timeStr);

        // Count how many items were already received across sessions
        const totalReceivedItems = persisted.sessions.reduce(
          (sum, s) => sum + Object.values(s.jardData || {}).filter((j) => j.countedQty > 0).length,
          0
        );
        if (totalReceivedItems > 0) {
          showMessage(
            lang === 'ar'
              ? `🛡️ تم استعادة بيانات الجلسة السابقة تلقائياً (${totalReceivedItems} صنف مستلم) — بياناتك محفوظة بالكامل أوفلاين!`
              : `🛡️ Automatically restored previous session (${totalReceivedItems} received items) — offline data protected!`,
            'info'
          );
        }
      } else if (sessions.length > 0 && !activeSessionId) {
        setActiveSessionId(sessions[0].id);
      }
      setIsHydrated(true);
    });
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Instant Auto-Save mechanism (localStorage + IndexedDB)
  const saveToLocalStorage = useCallback(
    (manual: boolean = false) => {
      if (sessions.length === 0) return;
      void saveAppStateOffline({
        sessions,
        activeSessionId,
        masterCatalog,
      });
      const timeStr = new Date().toLocaleTimeString(lang === 'ar' ? 'ar-EG' : 'en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
      setAutoSaveTime(timeStr);
      if (manual) {
        showMessage(
          lang === 'ar'
            ? '✅ تم حفظ جميع بيانات الفاتورة والماستر والاستلامات فوراً (أوفلاين)'
            : '✅ Saved all invoice, master & count data offline',
          'success'
        );
      }
    },
    [sessions, activeSessionId, masterCatalog, lang, showMessage]
  );

  // Instant save on EVERY change to sessions, activeSessionId, or masterCatalog (zero data loss on power cut!)
  useEffect(() => {
    if (!isHydrated) return;
    saveToLocalStorage(false);
  }, [sessions, activeSessionId, masterCatalog, isHydrated, saveToLocalStorage]);

  // Heartbeat + pagehide / visibilitychange / beforeunload protection
  useEffect(() => {
    const interval = setInterval(() => {
      saveToLocalStorage(false);
    }, AUTO_SAVE_INTERVAL);

    const handleFlushSave = () => {
      saveToLocalStorage(false);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        saveToLocalStorage(false);
      }
    };

    window.addEventListener('beforeunload', handleFlushSave);
    window.addEventListener('pagehide', handleFlushSave);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      window.removeEventListener('beforeunload', handleFlushSave);
      window.removeEventListener('pagehide', handleFlushSave);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
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

        // Check if existing sessions already have scanned jardData that matches this uploaded invoice
        const existingJardMap: Record<string, JardItem> = {};
        sessions.forEach((oldSess) => {
          Object.entries(oldSess.jardData || {}).forEach(([k, v]) => {
            if (v && v.countedQty > 0) {
              existingJardMap[k.toUpperCase()] = v;
            }
          });
        });

        const rawNewSessions = extracted.map((item) => createSessionFromExtracted(item));
        let matchingPreviousCount = 0;
        rawNewSessions.forEach((ns) => {
          Object.keys(ns.inventoryMap).forEach((k) => {
            if (existingJardMap[k.toUpperCase()]) {
              matchingPreviousCount++;
            }
          });
        });

        let shouldMergeExisting = false;
        if (matchingPreviousCount > 0) {
          shouldMergeExisting = window.confirm(
            lang === 'ar'
              ? `🛡️ تنبيه حماية البيانات:\nوجدنا عدد (${matchingPreviousCount}) صنف تم جردها واستلامها مسبقاً في هذه الفاتورة!\n\nاضغط (موافق / OK) للاحتفاظ بالكميات المستلمة سابقاً واستكمال الاستلام دون إعادة من الصفر، أو (إلغاء / Cancel) لتصفيرها والبدء من جديد.`
              : `🛡️ Data Protection:\nFound ${matchingPreviousCount} items already counted for this invoice!\n\nClick OK to keep your previous counts and continue, or Cancel to start from zero.`
          );
        }

        const newSessions = shouldMergeExisting
          ? rawNewSessions.map((ns) => {
              const mergedJard = { ...ns.jardData };
              Object.entries(existingJardMap).forEach(([k, prevJard]) => {
                const invItem = ns.inventoryMap[k];
                if (invItem) {
                  mergedJard[k] = {
                    ...prevJard,
                    itemName: invItem.itemName || prevJard.itemName,
                    systemQty: invItem.systemQty,
                    price: invItem.price || prevJard.price,
                  };
                } else {
                  mergedJard[k] = prevJard;
                }
              });
              return { ...ns, jardData: mergedJard };
            })
          : rawNewSessions;

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

    // Check if both invoice and master sheets are present (empty mode requirement)
    const hasInvoice = Object.keys(activeSession.inventoryMap).length > 0;
    const hasMaster = Object.keys(masterCatalog).length > 0;
    if (!hasInvoice || !hasMaster) {
      if (soundEnabled) playAlarmSound();
      triggerVisualFeedback(false);
      showMessage(
        lang === 'ar'
          ? '🔒 لا يمكن المسح قبل رفع شيت الفاتورة وشيت الماستر أولاً!'
          : 'Cannot scan until Invoice and Master sheets are uploaded!',
        'error'
      );
      return;
    }

    const key = code.trim().toUpperCase();
    setLastScannedCode(key);
    setHighlightedCode(key);

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
    showMessage(lang === 'ar' ? 'تم إنشاء الفاتورة الواردة بنجاح' : 'New inbound invoice tab created', 'success');
  };

  // Reset active session (تصفير الفعلي)
  const handleResetSession = () => {
    if (!activeSession) return;
    if (
      window.confirm(
        lang === 'ar'
          ? `هل أنت متأكد من تصفير الكميات المستلمة (الفعلي) بالكامل للبدء من الصفر؟\nلن يتم حذف بيانات الفاتورة الأصلية (${activeSession.title})، بل سيتم تصفير الأصناف الممسوحة فقط.`
          : `Are you sure you want to reset all actual counted quantities to zero for (${activeSession.title})?`
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
      setLastScannedCode(null);
      showMessage(
        lang === 'ar'
          ? '🔄 تم تصفير الفعلي بالكامل بنجاح للبدء من الصفر'
          : '🔄 Actual counted quantities reset to zero',
        'info'
      );
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

  // Batch intake and register items from WhatsApp message
  const handleBatchApplyItems = useCallback(
    (itemsToAdd: { code: string; qty: number; condition: 'sound' | 'damaged' }[]) => {
      if (!activeSession || itemsToAdd.length === 0) return;

      setSessions((prev) =>
        prev.map((sess) => {
          if (sess.id !== activeSession.id) return sess;

          // Snapshot current jardData for undo
          const newUndoStack = [...sess.undoStack];
          if (newUndoStack.length >= 15) newUndoStack.shift();
          newUndoStack.push(JSON.stringify(sess.jardData));

          const updatedJard = { ...sess.jardData };
          const updatedInv = { ...sess.inventoryMap };

          itemsToAdd.forEach(({ code, qty, condition }) => {
            const key = code.toUpperCase();
            const existing = updatedJard[key];
            const masterItem = masterCatalog[key];

            // If item not yet in inventory map, register it as surplus/received item
            if (!updatedInv[key]) {
              updatedInv[key] = {
                code: key,
                itemName: masterItem ? masterItem.itemName : `صنف واتساب (${key})`,
                systemQty: 0,
                price: masterItem?.price || 0,
                cost: masterItem?.cost || 0,
                category: masterItem?.category || 'واتساب',
              };
            }

            const soundDelta = condition === 'sound' ? qty : 0;
            const damagedDelta = condition === 'damaged' ? qty : 0;

            if (existing) {
              const newSound = existing.soundQty + soundDelta;
              const newDamaged = existing.damagedQty + damagedDelta;
              updatedJard[key] = {
                ...existing,
                soundQty: newSound,
                damagedQty: newDamaged,
                countedQty: newSound + newDamaged,
                time: Date.now(),
              };
            } else {
              const invInfo = updatedInv[key];
              updatedJard[key] = {
                code: key,
                itemName: invInfo?.itemName || `صنف (${key})`,
                systemQty: invInfo?.systemQty || 0,
                soundQty: soundDelta,
                damagedQty: damagedDelta,
                countedQty: soundDelta + damagedDelta,
                price: invInfo?.price || 0,
                cost: invInfo?.cost || 0,
                category: invInfo?.category || 'واتساب',
                time: Date.now(),
              };
            }
          });

          return {
            ...sess,
            inventoryMap: updatedInv,
            jardData: updatedJard,
            undoStack: newUndoStack,
          };
        })
      );

      if (soundEnabled) playSuccessBeep();
      triggerVisualFeedback(true);
      const totalPieces = itemsToAdd.reduce((sum, it) => sum + it.qty, 0);
      showMessage(
        lang === 'ar'
          ? `✅ تم تسجيل ${itemsToAdd.length} صنف بإجمالي ${totalPieces} قطعة بنجاح من رسالة الواتساب!`
          : `✅ Recorded ${itemsToAdd.length} items (${totalPieces} pcs) from WhatsApp message!`,
        'success'
      );
    },
    [activeSession, masterCatalog, soundEnabled, triggerVisualFeedback, showMessage, lang]
  );

  // Global Keyboard Event Listener (Ctrl+S for Save, Ctrl+P for Print, Ctrl+Z for Undo)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isCtrlOrMeta = e.ctrlKey || e.metaKey;
      if (!isCtrlOrMeta) return;

      const key = e.key.toLowerCase();

      // Ctrl+S / Cmd+S: Save current work to LocalStorage
      if (key === 's') {
        e.preventDefault();
        saveToLocalStorage(true);
        return;
      }

      // Ctrl+P / Cmd+P: Print official return/invoice receipt
      if (key === 'p') {
        e.preventDefault();
        handlePrintReceipt();
        return;
      }

      // Ctrl+Z / Cmd+Z: Undo last scan / modification
      if (key === 'z' && !e.shiftKey) {
        const activeElem = document.activeElement as HTMLElement | null;
        // Don't intercept if user is typing text inside an open modal or input field with text
        const isTypingInField =
          activeElem &&
          (activeElem.tagName === 'TEXTAREA' ||
            (activeElem.tagName === 'INPUT' &&
              activeElem.getAttribute('type') !== 'checkbox' &&
              (activeElem as HTMLInputElement).value.length > 0 &&
              activeElem.id !== 'barcode-input'));

        if (!isTypingInField) {
          e.preventDefault();
          handleUndo();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [saveToLocalStorage, handlePrintReceipt, handleUndo]);

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

  // Start pure empty session without any preloaded invoice
  const handleStartEmptySession = () => {
    if (
      window.confirm(
        lang === 'ar'
          ? 'هل تريد بدء جلسة عمل جديدة فارغة؟ سيتم تفريغ الفاتورة الحالية والبدء من الصفر، ولن يقبل البرنامج أي مسح إلا بعد رفع شيت الفاتورة وشيت الماستر.'
          : 'Start a clean empty session? No scans will be accepted until you upload both Invoice and Master sheets.'
      )
    ) {
      const emptySession: Session = {
        id: 'sess_' + Date.now(),
        title: lang === 'ar' ? 'جلسة جديدة (بانتظار الشيتات)' : 'New Session (Pending Sheets)',
        inventoryMap: {},
        jardData: {},
        undoStack: [],
        returnMeta: {
          branch: '',
          returnNo: '',
          keeper: '',
          date: new Date().toISOString().split('T')[0],
          notes: '',
        },
        routeInfo: {
          isTransfer: false,
          isDamaged: false,
          routeType: 'direct',
          fromBranch: '',
          toBranch: '',
          notes: '',
        },
      };

      void clearOfflineStorage();
      setSessions([emptySession]);
      setActiveSessionId(emptySession.id);
      setMasterCatalog({});
      setLastScannedCode(null);
      setHighlightedCode(null);
      showMessage(
        lang === 'ar'
          ? '📄 تم بدء جلسة عمل فارغة بنجاح! يرجى رفع شيت الفاتورة وشيت الماستر للبدء.'
          : '📄 Started clean session! Please upload Invoice and Master sheets to begin.',
        'info'
      );
    }
  };

  const hasInvoice = Boolean(activeSession && Object.keys(activeSession.inventoryMap).length > 0);
  const hasMaster = Boolean(Object.keys(masterCatalog).length > 0);
  const isGateOpen = hasInvoice && hasMaster;
  const isAr = lang === 'ar';

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
          animationsEnabled={animationsEnabled}
          onToggleAnimations={handleToggleAnimations}
          onLoadDemoData={handleLoadDemoData}
          onStartEmptySession={handleStartEmptySession}
          onDownloadTemplate={downloadSampleExcelTemplate}
          onOpenOfflineGuide={() => setIsOfflineGuideOpen(true)}
          onOpenThemeSettings={() => setIsThemeModalOpen(true)}
          onOpenExeConverter={() => setIsExeModalOpen(true)}
          onOpenWhatsApp={() => setIsWhatsAppModalOpen(true)}
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

        {/* 2. Mandatory Upload Gatekeeper OR Unlocked Workbench Screens */}
        {!isGateOpen ? (
          <UploadGatekeeper
            session={activeSession}
            masterCatalogCount={Object.keys(masterCatalog).length}
            onTriggerInvoiceUpload={() => {
              const input = document.getElementById('invoice-file-input') as HTMLInputElement;
              input?.click();
            }}
            onTriggerMasterUpload={() => {
              const input = document.getElementById('master-file-input') as HTMLInputElement;
              input?.click();
            }}
            onLoadDemoData={handleLoadDemoData}
            lang={lang}
          />
        ) : (
          <>
            {/* Gatekeeper Unlocked Status Banner */}
            <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white rounded-2xl p-3 sm:p-4 mb-4 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 animate-fadeIn">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center font-black flex-shrink-0">
                  🔓
                </div>
                <div>
                  <div className="text-xs sm:text-sm font-black flex items-center gap-1.5">
                    <span>
                      {isAr
                        ? 'بوابة التشغيل مفتوحة بالكامل (Upload Gatekeeper Unlocked) ✅'
                        : 'Upload Gatekeeper Unlocked ✅'}
                    </span>
                  </div>
                  <p className="text-[11px] text-emerald-100 font-semibold mt-0.5">
                    {isAr
                      ? `تم التحقق من اكتمال الشيتين معاً بنجاح (الفاتورة: ${Object.keys(activeSession.inventoryMap).length} صنف | الماستر: ${Object.keys(masterCatalog).length} صنف) - شاشات المسح والاستلام والجداول مفعلة بالكامل للعمل.`
                      : `Both sheets verified (Invoice: ${Object.keys(activeSession.inventoryMap).length} items | Master: ${Object.keys(masterCatalog).length} items) - All tools active.`}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto flex-shrink-0">
                <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-amber-300 text-slate-950 shadow-2xs flex items-center gap-1">
                  <span>🛡️</span>
                  <span>
                    {isAr
                      ? `حفظ فوري أوفلاين ضد فصل الجهاز ${autoSaveTime ? `(${autoSaveTime})` : ''}`
                      : `Instant Offline Save ${autoSaveTime ? `(${autoSaveTime})` : ''}`}
                  </span>
                </span>
                <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-full bg-white text-emerald-800 shadow-2xs">
                  {isAr ? 'جاهز للمسح والاستلام' : 'Ready to Scan & Audit'}
                </span>
              </div>
            </div>

            {/* 2. Scanner & Input Section */}
            <ScannerSection
              session={activeSession}
              masterCatalog={masterCatalog}
              condition={condition}
              onConditionChange={setCondition}
              autoAdd={autoAdd}
              onAutoAddChange={setAutoAdd}
              quickScanQty={quickScanQty}
              onQuickScanQtyChange={handleQuickScanQtyChange}
              onAddItem={handleAddItem}
              onUndo={handleUndo}
              canUndo={(activeSession?.undoStack.length || 0) > 0}
              message={message}
              lang={lang}
              hasInvoice={hasInvoice}
              hasMaster={hasMaster}
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
              onOpenWhatsApp={() => setIsWhatsAppModalOpen(true)}
              onResetSession={handleResetSession}
              highlightedCode={highlightedCode}
              lastScannedCode={lastScannedCode}
              lang={lang}
              filter={activeFilter}
              onFilterChange={setActiveFilter}
            />
          </>
        )}
      </div>

      {/* Official A4 Print Receipt View (hidden on screen, visible on window.print()) */}
      <PrintReceipt session={activeSession} />

      {/* Mobile Floating Bottom Bar - only active when Upload Gatekeeper is open */}
      {isGateOpen && (
        <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-200 px-3 py-2 flex items-center justify-around gap-2 z-40 no-print shadow-lg animate-slide-down">
          <button
            type="button"
            onClick={() => {
              const input = document.querySelector('input[type="text"][placeholder*="الباركود"], input[type="text"][placeholder*="barcode"]') as HTMLInputElement;
              input?.focus();
            }}
            className="flex-1 py-2 px-2 rounded-xl font-bold text-xs bg-red-600 text-white text-center shadow-xs cursor-pointer"
          >
            🔍 {lang === 'ar' ? 'مسح' : 'Scan'}
          </button>

          <button
            type="button"
            onClick={() => setCondition((c) => (c === 'sound' ? 'damaged' : 'sound'))}
            className={`py-2 px-2.5 rounded-xl font-bold text-xs text-center border cursor-pointer ${
              condition === 'sound'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                : 'bg-rose-50 text-rose-800 border-rose-300'
            }`}
          >
            {condition === 'sound' ? (lang === 'ar' ? 'سليم ✅' : 'Sound ✅') : (lang === 'ar' ? 'متلف ⚠️' : 'Damaged ⚠️')}
          </button>

          <button
            type="button"
            onClick={() => setIsWhatsAppModalOpen(true)}
            className="flex-1 py-2 px-2 rounded-xl font-bold text-xs bg-emerald-600 text-white text-center shadow-xs cursor-pointer"
          >
            💬 {lang === 'ar' ? 'واتساب' : 'WhatsApp'}
          </button>

          <button
            type="button"
            onClick={handlePrintReceipt}
            className="flex-1 py-2 px-2 rounded-xl font-bold text-xs bg-slate-900 text-white text-center shadow-xs cursor-pointer"
          >
            🖨️ {lang === 'ar' ? 'طباعة' : 'Print'}
          </button>
        </div>
      )}

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

      {/* WhatsApp Report & Record Hub Modal */}
      <WhatsAppReportModal
        isOpen={isWhatsAppModalOpen}
        onClose={() => setIsWhatsAppModalOpen(false)}
        session={activeSession}
        masterCatalog={masterCatalog}
        onBatchApplyItems={handleBatchApplyItems}
        lang={lang}
      />

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

      {/* Theme & Fonts Customizer Modal */}
      <ThemeSettingsModal
        isOpen={isThemeModalOpen}
        onClose={() => setIsThemeModalOpen(false)}
        config={themeConfig}
        onSetTheme={setTheme}
        onSetFont={setFont}
        onSetFontSize={setFontSize}
        onSetTabularNums={setTabularNums}
        onResetDefaults={resetThemeDefaults}
        lang={lang}
      />

      {/* Windows EXE Desktop App Converter Modal */}
      <ExeConverterModal
        isOpen={isExeModalOpen}
        onClose={() => setIsExeModalOpen(false)}
        lang={lang}
      />
    </div>
  );
}
