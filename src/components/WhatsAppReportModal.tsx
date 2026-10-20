import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Send,
  MessageSquare,
  Copy,
  Check,
  Phone,
  FileText,
  AlertTriangle,
  Package,
  Sparkles,
  ClipboardPaste,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';
import { Session, JardItem, ReturnItem, Language } from '../types';

interface WhatsAppReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: Session | null;
  masterCatalog: Record<string, ReturnItem>;
  onBatchApplyItems: (itemsToAdd: { code: string; qty: number; condition: 'sound' | 'damaged' }[]) => void;
  lang: Language;
}

export const WhatsAppReportModal: React.FC<WhatsAppReportModalProps> = ({
  isOpen,
  onClose,
  session,
  masterCatalog,
  onBatchApplyItems,
  lang,
}) => {
  const isAr = lang === 'ar';
  const [activeTab, setActiveTab] = useState<'send' | 'record'>('send');

  // WhatsApp Recipient Phone State
  const [phone, setPhone] = useState<string>(() => {
    return localStorage.getItem('so_much_whatsapp_recipient') || '';
  });
  const [reportType, setReportType] = useState<'summary' | 'detailed'>('summary');
  const [copied, setCopied] = useState(false);

  // Paste & Record from WhatsApp State
  const [pastedText, setPastedText] = useState('');
  const [parsedPreview, setParsedPreview] = useState<{
    code: string;
    qty: number;
    itemName: string;
    matched: boolean;
    systemQty: number;
  }[]>([]);
  const [recordCondition, setRecordCondition] = useState<'sound' | 'damaged'>('sound');

  // Save recipient phone on change
  useEffect(() => {
    if (phone.trim()) {
      localStorage.setItem('so_much_whatsapp_recipient', phone.trim());
    }
  }, [phone]);

  // Clean and format recipient phone for WhatsApp international link
  const cleanPhone = useMemo(() => {
    let p = phone.replace(/[^\d+]/g, '').trim();
    if (!p) return '';
    // Egyptian numbers starting with 01
    if (p.startsWith('01') && p.length === 11) {
      p = '2' + p;
    } else if (p.startsWith('+')) {
      p = p.slice(1);
    }
    return p;
  }, [phone]);

  // Compute session metrics for the WhatsApp report
  const metrics = useMemo(() => {
    if (!session || Object.keys(session.inventoryMap).length === 0) return null;

    const items = Object.values(session.inventoryMap);
    const totalLines = items.length;
    let totalSystemQty = 0;
    let totalCountedPieces = 0;
    let totalSoundPieces = 0;
    let totalDamagedPieces = 0;

    let shortageLines = 0;
    let shortagePieces = 0;
    let shortageAmount = 0;

    let surplusLines = 0;
    let surplusPieces = 0;

    let matchedLines = 0;
    const discrepancies: {
      name: string;
      code: string;
      system: number;
      actual: number;
      diff: number;
      price: number;
    }[] = [];

    items.forEach((it) => {
      const key = it.code.toUpperCase();
      const j = session.jardData[key];
      const sound = j?.soundQty || 0;
      const damaged = j?.damagedQty || 0;
      const counted = sound + damaged;
      const diff = counted - it.systemQty;

      totalSystemQty += it.systemQty;
      totalCountedPieces += counted;
      totalSoundPieces += sound;
      totalDamagedPieces += damaged;

      if (diff === 0 && counted > 0) {
        matchedLines++;
      } else if (diff < 0) {
        shortageLines++;
        const deficit = Math.abs(diff);
        shortagePieces += deficit;
        shortageAmount += deficit * (it.price || 0);
        discrepancies.push({
          name: it.itemName,
          code: it.code,
          system: it.systemQty,
          actual: counted,
          diff,
          price: it.price || 0,
        });
      } else if (diff > 0) {
        surplusLines++;
        surplusPieces += diff;
        discrepancies.push({
          name: it.itemName,
          code: it.code,
          system: it.systemQty,
          actual: counted,
          diff,
          price: it.price || 0,
        });
      }
    });

    const completionRate = totalSystemQty > 0 ? Math.min(100, Math.round((totalCountedPieces / totalSystemQty) * 100)) : 0;

    return {
      totalLines,
      totalSystemQty,
      totalCountedPieces,
      totalSoundPieces,
      totalDamagedPieces,
      shortageLines,
      shortagePieces,
      shortageAmount,
      surplusLines,
      surplusPieces,
      matchedLines,
      completionRate,
      discrepancies,
    };
  }, [session]);

  // Build the formatted WhatsApp report text message
  const reportMessage = useMemo(() => {
    if (!session || !metrics) return '';

    const branch = session.returnMeta.branch || session.title || 'الفرع';
    const invNo = session.returnMeta.returnNo || '-';
    const dateStr = session.returnMeta.date || new Date().toISOString().slice(0, 10);
    const keeper = session.returnMeta.keeper || 'المستلم';
    const timeNow = new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });

    let msg = `*📦 تقرير استلام فاتورة واردة من المخزن الى الفرع*\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `🏢 *الفرع:* ${branch}\n`;
    msg += `🔢 *رقم الفاتورة:* #${invNo}\n`;
    msg += `📅 *تاريخ الاستلام:* ${dateStr} (${timeNow})\n`;
    msg += `👤 *المستلم:* ${keeper}\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━━\n\n`;

    msg += `*📊 ملخص الأرقام والكميات:*\n`;
    msg += `▫️ إجمالي كمية الفاتورة: *${metrics.totalSystemQty} قطعة* (${metrics.totalLines} صنف)\n`;
    msg += `▫️ المستلم الفعلي: *${metrics.totalCountedPieces} قطعة* (نسبة الإنجاز: ${metrics.completionRate}%)\n`;
    msg += `▫️ سليم معتمد: *${metrics.totalSoundPieces} قطعة*\n`;
    if (metrics.totalDamagedPieces > 0) {
      msg += `⚠️ توالف / مرتجع تالف: *${metrics.totalDamagedPieces} قطعة*\n`;
    }
    msg += `\n`;

    if (metrics.shortagePieces === 0 && metrics.surplusPieces === 0 && metrics.totalCountedPieces === metrics.totalSystemQty) {
      msg += `✅ *حالة الفاتورة:* مطابقة بالكامل 100% ولا توجد أي فوارق ظاهرة.\n`;
    } else {
      msg += `*⚖️ حالة الفوارق:*\n`;
      if (metrics.shortagePieces > 0) {
        msg += `🔴 *العجز:* -${metrics.shortagePieces} قطعة في ${metrics.shortageLines} صنف (بقيمة ~${Math.round(metrics.shortageAmount).toLocaleString()} ج.م)\n`;
      } else {
        msg += `🟢 لا يوجد عجز في الأصناف المسجلة.\n`;
      }

      if (metrics.surplusPieces > 0) {
        msg += `🟡 *الزيادة / الفائض:* +${metrics.surplusPieces} قطعة في ${metrics.surplusLines} صنف\n`;
      }
    }

    if (reportType === 'detailed' && metrics.discrepancies.length > 0) {
      msg += `\n━━━━━━━━━━━━━━━━━━━━━\n`;
      msg += `*📋 تفاصيل أبرز الأصناف التي بها فوارق:*\n`;
      metrics.discrepancies.slice(0, 15).forEach((d, idx) => {
        const sign = d.diff > 0 ? `+${d.diff}` : `${d.diff}`;
        const icon = d.diff < 0 ? '🔴' : '🟡';
        msg += `${idx + 1}. ${icon} *${d.name}*\n   باركود: \`${d.code}\` | فاتورة: ${d.system} | مستلم: ${d.actual} (${sign})\n`;
      });

      if (metrics.discrepancies.length > 15) {
        msg += `... ومتبقي ${metrics.discrepancies.length - 15} صنف آخر في شيت الإكسيل التفصيلي.\n`;
      }
    }

    msg += `\n━━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `_تم توليد هذا التقرير آلياً عبر برنامج استلامات SO MUCH الرسمي_ ✨`;

    return msg;
  }, [session, metrics, reportType]);

  // Handle Copy to Clipboard
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(reportMessage);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // fallback
    }
  };

  // Handle direct WhatsApp launch
  const handleSendWhatsApp = () => {
    const encoded = encodeURIComponent(reportMessage);
    const url = cleanPhone
      ? `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encoded}`
      : `https://api.whatsapp.com/send?text=${encoded}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // Parser: Extract items from pasted WhatsApp message
  const handleParseWhatsAppText = () => {
    if (!pastedText.trim() || !session) {
      setParsedPreview([]);
      return;
    }

    const lines = pastedText.split('\n');
    const results: {
      code: string;
      qty: number;
      itemName: string;
      matched: boolean;
      systemQty: number;
    }[] = [];

    // Pattern matching barcodes and quantities
    // e.g. "622300123456 : 5", "A7713 - 10", "باركود 123456 كمية 4", "123456789 2"
    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line) continue;

      // Extract barcode SKU (alphanumeric 3-18 chars)
      const barcodeMatch = line.match(/([A-Za-z0-9\-_]{3,20})/);
      // Extract quantity (1 to 999)
      const qtyMatch = line.match(/(?:(?:كمية|الكمية|عدد|قطعة|قطع|x|X|:|-)\s*)?(\d{1,4})(?:\s*(?:قطعة|قطع|pcs))?$/) ||
                       line.match(/(?:^|\s)(\d{1,4})(?:\s*(?:قطعة|قطع|pcs))?(?:\s*[-:]|$)/);

      if (barcodeMatch) {
        const potentialCode = barcodeMatch[1].toUpperCase();
        let qty = 1;
        if (qtyMatch) {
          const parsedQty = parseInt(qtyMatch[1], 10);
          if (!isNaN(parsedQty) && parsedQty > 0) {
            qty = parsedQty;
          }
        }

        const invItem = session.inventoryMap[potentialCode];
        const masterItem = masterCatalog[potentialCode];
        const itemInfo = invItem || masterItem;

        results.push({
          code: potentialCode,
          qty,
          itemName: itemInfo ? itemInfo.itemName : 'صنف جديد غير مسجل',
          matched: Boolean(itemInfo),
          systemQty: invItem ? invItem.systemQty : 0,
        });
      }
    }

    setParsedPreview(results);
  };

  // Apply parsed items directly to session
  const handleApplyPastedItems = () => {
    if (parsedPreview.length === 0) return;

    const toApply = parsedPreview.map((p) => ({
      code: p.code,
      qty: p.qty,
      condition: recordCondition,
    }));

    onBatchApplyItems(toApply);
    setPastedText('');
    setParsedPreview([]);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full flex flex-col max-h-[90vh] overflow-hidden text-right rtl:text-right ltr:text-left animate-modal">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-100 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center font-black">
              <MessageSquare className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-black text-sm sm:text-base">
                {isAr ? 'خدمات واتساب الذكية | تقارير وتسجيل استلام' : 'Smart WhatsApp Hub'}
              </h3>
              <p className="text-[11px] text-emerald-100 font-semibold mt-0.5">
                {isAr
                  ? 'إرسال تقرير الاستلام مباشرة لأي رقم أو استيراد كميات من رسائل الواتساب'
                  : 'Send direct reports to WhatsApp or record items from WhatsApp messages'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-emerald-100 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50 p-1.5 gap-1.5 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('send')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl transition-all cursor-pointer ${
              activeTab === 'send'
                ? 'bg-white text-emerald-800 shadow-xs border border-emerald-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Send className="w-3.5 h-3.5 text-emerald-600" />
            <span>{isAr ? '📤 إرسال التقرير لرقم واتساب' : 'Send Report to WhatsApp'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('record')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl transition-all cursor-pointer ${
              activeTab === 'record'
                ? 'bg-white text-emerald-800 shadow-xs border border-emerald-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <ClipboardPaste className="w-3.5 h-3.5 text-teal-600" />
            <span>{isAr ? '📥 تسجيل استلام من رسالة واتساب' : 'Record from WhatsApp Text'}</span>
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          {activeTab === 'send' ? (
            <div className="space-y-4">
              {/* Recipient Phone Box */}
              <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3.5 space-y-2">
                <label className="block text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-emerald-700" />
                  <span>{isAr ? 'رقم هاتف المستلم (مدير الفرع / مسئول المخزن):' : 'Recipient Phone Number:'}</span>
                </label>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder={isAr ? 'مثال: 01012345678 أو 201012345678' : 'e.g. +201012345678'}
                      className="w-full text-xs sm:text-sm font-mono font-bold bg-white border border-emerald-300 rounded-lg py-2 px-3 focus:outline-hidden focus:ring-2 focus:ring-emerald-400 text-slate-900"
                    />
                  </div>

                  <div className="flex items-center gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => setReportType('summary')}
                      className={`px-2.5 py-2 rounded-lg font-bold border transition-all cursor-pointer ${
                        reportType === 'summary'
                          ? 'bg-emerald-700 text-white border-emerald-700 shadow-2xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {isAr ? 'ملخص تنفيذي' : 'Summary'}
                    </button>

                    <button
                      type="button"
                      onClick={() => setReportType('detailed')}
                      className={`px-2.5 py-2 rounded-lg font-bold border transition-all cursor-pointer ${
                        reportType === 'detailed'
                          ? 'bg-emerald-700 text-white border-emerald-700 shadow-2xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {isAr ? 'تفصيلي بالفوارق' : 'Detailed'}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-emerald-800">
                  <span>
                    {isAr
                      ? cleanPhone
                        ? `✅ الرقم جاهز للإرسال: +${cleanPhone}`
                        : '💡 سيتم فتح واتساب مع نص التقرير جاهزاً، يمكنك اختيار جهة الاتصال يدوياً إذا لم تحدد رقماً.'
                      : cleanPhone
                        ? `Target: +${cleanPhone}`
                        : 'Leave blank to pick contact inside WhatsApp'}
                  </span>
                  {cleanPhone && (
                    <span className="font-semibold text-emerald-700">
                      {isAr ? 'محفوظ تلقائياً 💾' : 'Auto-saved 💾'}
                    </span>
                  )}
                </div>
              </div>

              {/* Message Live Preview */}
              <div>
                <div className="flex items-center justify-between mb-1.5 text-xs font-bold text-slate-700">
                  <span className="flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{isAr ? 'معاينة نص الرسالة المرسلة:' : 'Live WhatsApp Message Preview:'}</span>
                  </span>

                  <button
                    type="button"
                    onClick={handleCopy}
                    className="inline-flex items-center gap-1 text-emerald-700 hover:text-emerald-900 bg-emerald-50 px-2 py-1 rounded border border-emerald-200 transition-all cursor-pointer"
                  >
                    {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    <span>{copied ? (isAr ? 'تم النسخ!' : 'Copied!') : (isAr ? 'نسخ النص' : 'Copy')}</span>
                  </button>
                </div>

                <textarea
                  readOnly
                  rows={8}
                  value={reportMessage}
                  className="w-full text-xs font-mono leading-relaxed bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 focus:outline-hidden focus:bg-white select-all resize-y"
                />
              </div>

              {/* Direct Actions */}
              <div className="flex flex-col sm:flex-row items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleSendWhatsApp}
                  className="w-full sm:flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-black text-sm bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white shadow-md hover:shadow-lg transition-all cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>
                    {isAr
                      ? cleanPhone
                        ? `إرسال إلى واتساب مباشرة (+${cleanPhone}) 🚀`
                        : 'فتح واتساب لإرسال التقرير 🚀'
                      : 'Send via WhatsApp 🚀'}
                  </span>
                  <ExternalLink className="w-3.5 h-3.5 text-emerald-200" />
                </button>

                <button
                  type="button"
                  onClick={handleCopy}
                  className="w-full sm:w-auto px-4 py-3 rounded-xl font-bold text-xs bg-slate-100 hover:bg-slate-200 text-slate-800 transition-all cursor-pointer"
                >
                  {isAr ? 'نسخ التقرير فقط' : 'Copy Only'}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Record from WhatsApp Text Instruction */}
              <div className="bg-teal-50/80 border border-teal-200 rounded-xl p-3 text-xs text-teal-950 space-y-1">
                <div className="font-black flex items-center gap-1.5 text-teal-900">
                  <Sparkles className="w-4 h-4 text-teal-600" />
                  <span>{isAr ? 'طريقة تسجيل الاستلام عبر رسائل الواتساب:' : 'How to import WhatsApp text:'}</span>
                </div>
                <p className="text-[11px] text-teal-900/90 leading-relaxed">
                  {isAr
                    ? 'انسخ النص أو القائمة المرسلة إليك في محادثة الواتساب والصقها في المربع أدناه (يقبل البرنامج الباركود متبوعاً بالكمية مثل: 622300123: 5 أو A7713 - 10). سنقوم بفحصها وإضافتها فوراً للجرد الفعلي.'
                    : 'Paste the message copied from WhatsApp below. The parser extracts barcodes and quantities.'}
                </p>
              </div>

              {/* Condition Selection */}
              <div className="flex items-center justify-between gap-2 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold">
                <span className="text-slate-700">
                  {isAr ? 'حالة الأصناف المستوردة من الواتساب:' : 'Condition for imported items:'}
                </span>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setRecordCondition('sound')}
                    className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                      recordCondition === 'sound'
                        ? 'bg-emerald-600 text-white shadow-2xs'
                        : 'bg-white text-slate-700 border border-slate-200'
                    }`}
                  >
                    {isAr ? 'سليم معتمد ✅' : 'Sound ✅'}
                  </button>

                  <button
                    type="button"
                    onClick={() => setRecordCondition('damaged')}
                    className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                      recordCondition === 'damaged'
                        ? 'bg-rose-600 text-white shadow-2xs'
                        : 'bg-white text-slate-700 border border-slate-200'
                    }`}
                  >
                    {isAr ? 'متلف / تالف ⚠️' : 'Damaged ⚠️'}
                  </button>
                </div>
              </div>

              {/* Paste Box */}
              <div>
                <textarea
                  rows={5}
                  value={pastedText}
                  onChange={(e) => setPastedText(e.target.value)}
                  placeholder={
                    isAr
                      ? 'الصق رسالة الواتساب هنا...\nمثال:\n622301140021 : 10\nA7713 : 5\n203ay88 : 12'
                      : 'Paste WhatsApp message here...'
                  }
                  className="w-full text-xs font-mono bg-white border border-slate-300 rounded-xl p-3 focus:outline-hidden focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                />

                <div className="flex justify-end mt-2">
                  <button
                    type="button"
                    onClick={handleParseWhatsAppText}
                    disabled={!pastedText.trim()}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black bg-teal-600 hover:bg-teal-700 text-white shadow-xs disabled:opacity-50 cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{isAr ? 'فحص واستخراج الأصناف 🔍' : 'Parse Items 🔍'}</span>
                  </button>
                </div>
              </div>

              {/* Parsed Items Preview */}
              {parsedPreview.length > 0 && (
                <div className="space-y-2 animate-fadeIn border-t border-slate-100 pt-3">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                    <span>
                      {isAr
                        ? `تم استخراج ${parsedPreview.length} صنف من الرسالة:`
                        : `Extracted ${parsedPreview.length} items:`}
                    </span>
                    <span className="text-emerald-700 font-black">
                      {isAr
                        ? `إجمالي القطع: ${parsedPreview.reduce((acc, it) => acc + it.qty, 0)} قطعة`
                        : `Total Pieces: ${parsedPreview.reduce((acc, it) => acc + it.qty, 0)}`}
                    </span>
                  </div>

                  <div className="max-h-48 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-xl bg-slate-50/50">
                    {parsedPreview.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 text-xs">
                        <div>
                          <div className="font-bold text-slate-900 flex items-center gap-1.5">
                            <span className="font-mono text-slate-600">{item.code}</span>
                            <span>- {item.itemName}</span>
                          </div>
                          <span className="text-[10px] text-slate-500">
                            {item.matched
                              ? isAr
                                ? `كمية الفاتورة: ${item.systemQty}`
                                : `Invoice: ${item.systemQty}`
                              : isAr
                                ? '⚠️ غير مسجل بالفاتورة (سيضاف كصنف زائد)'
                                : 'Surplus item'}
                          </span>
                        </div>

                        <span className="font-black px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                          +{item.qty} {isAr ? 'قطعة' : 'pcs'}
                        </span>
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={handleApplyPastedItems}
                    className="w-full flex items-center justify-center gap-1.5 py-3 rounded-xl font-black text-sm bg-teal-600 hover:bg-teal-700 active:scale-95 text-white shadow-md transition-all cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>
                      {isAr
                        ? `تأكيد وإضافة ${parsedPreview.length} صنف للجرد الفعلي فوراً ✅`
                        : `Confirm & Add ${parsedPreview.length} items to Actual ✅`}
                    </span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
