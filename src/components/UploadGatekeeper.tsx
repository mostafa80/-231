import React from 'react';
import {
  Lock,
  Upload,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  Package,
  ShieldAlert,
  Sparkles,
  ArrowRight,
  ArrowLeft,
} from 'lucide-react';
import { Session, Language } from '../types';

interface UploadGatekeeperProps {
  session: Session | null;
  masterCatalogCount: number;
  onTriggerInvoiceUpload: () => void;
  onTriggerMasterUpload: () => void;
  onLoadDemoData: () => void;
  lang: Language;
}

export const UploadGatekeeper: React.FC<UploadGatekeeperProps> = ({
  session,
  masterCatalogCount,
  onTriggerInvoiceUpload,
  onTriggerMasterUpload,
  onLoadDemoData,
  lang,
}) => {
  const isAr = lang === 'ar';

  const invoiceItemsCount = session ? Object.keys(session.inventoryMap).length : 0;
  const hasInvoice = invoiceItemsCount > 0;
  const hasMaster = masterCatalogCount > 0;

  const totalInvoicePieces = session
    ? Object.values(session.inventoryMap).reduce((sum, item) => sum + (item.systemQty || 0), 0)
    : 0;

  const meta = session?.returnMeta;

  return (
    <div className="bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-white rounded-3xl p-5 sm:p-8 shadow-2xl border-2 border-red-500/40 relative overflow-hidden my-6 animate-fadeIn">
      {/* Background Decorative Rings */}
      <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-red-600/10 blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full bg-amber-600/10 blur-3xl pointer-events-none"></div>

      {/* Header Banner */}
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-600 to-rose-700 flex items-center justify-center shadow-lg shadow-red-900/40 border border-red-400/30 flex-shrink-0 animate-pulse">
            <Lock className="w-7 h-7 text-white" />
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/30">
                {isAr ? 'بوابة التشغيل الإلزامية' : 'Mandatory Upload Gatekeeper'}
              </span>
              <span className="text-xs font-bold text-amber-300 flex items-center gap-1">
                <ShieldAlert className="w-3.5 h-3.5" />
                {isAr ? 'شاشات العمل مغلقة مؤقتاً' : 'Workbench Locked'}
              </span>
            </div>

            <h2 className="text-lg sm:text-xl md:text-2xl font-black text-white mt-1">
              {isAr
                ? 'اكتمال رفع الشيتين معاً إلزامي لتفعيل شاشات المسح والاستلام'
                : 'Both Sheets Required to Unlock Scanning & Review'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
              {isAr
                ? 'وفقاً لسياسة الجرد الآمن، لن تفتح شاشات المسح والاستلام، رادار الفوارق، أو جداول المراجعة إلا بعد رفع واعتماد كلاً من (شيت الفاتورة الواردة من المخزن + شيت ماستر الأصناف الرئيسي العام) معاً لمنع تسجيل أي أصناف مجهولة.'
                : 'System policy requires both the Inbound Invoice sheet AND the Master Catalog sheet to be uploaded before accessing scan inputs, discrepancy radar, and review tables.'}
            </p>
          </div>
        </div>

        {/* Quick Demo Test Action */}
        <div className="flex-shrink-0 self-start md:self-auto">
          <button
            type="button"
            onClick={onLoadDemoData}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 shadow-md hover:shadow-lg transition-all active:scale-95 cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-slate-950" />
            <span>{isAr ? 'تحميل بيانات تجريبية جاهزة للاختبار' : 'Load Ready Demo Data'}</span>
          </button>
        </div>
      </div>

      {/* Two Mandatory Sheets Checklist Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mt-6 relative z-10">
        {/* Sheet 1: Inbound Invoice Sheet */}
        <div
          className={`rounded-2xl p-4 sm:p-5 border transition-all ${
            hasInvoice
              ? 'bg-slate-800/80 border-emerald-500/50 shadow-emerald-950/20 shadow-lg'
              : 'bg-slate-800/40 border-red-500/40 hover:border-red-400'
          }`}
        >
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex items-center gap-2.5">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center font-black ${
                  hasInvoice ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'
                }`}
              >
                <Package className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-bold text-slate-400 block">
                  {isAr ? 'المطلب الأول (1/2):' : 'Requirement 1 of 2:'}
                </span>
                <h3 className="text-sm sm:text-base font-black text-white">
                  {isAr ? 'شيت الفاتورة الواردة من المخزن' : 'Inbound Invoice Sheet'}
                </h3>
              </div>
            </div>

            <span
              className={`text-xs font-black px-2.5 py-1 rounded-full flex items-center gap-1 ${
                hasInvoice
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'bg-red-500/20 text-red-300 border border-red-500/40'
              }`}
            >
              {hasInvoice ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{isAr ? 'تم الرفع ✅' : 'Uploaded ✅'}</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>{isAr ? 'مفقود (مطلوب) 🔒' : 'Missing (Required) 🔒'}</span>
                </>
              )}
            </span>
          </div>

          {hasInvoice ? (
            <div className="bg-slate-900/80 rounded-xl p-3 border border-emerald-500/20 space-y-1.5 text-xs">
              <div className="flex items-center justify-between text-slate-300">
                <span>{isAr ? 'الفرع المستلم:' : 'Branch:'}</span>
                <span className="font-bold text-white">{meta?.branch || (isAr ? 'فرع محدد' : 'Active Branch')}</span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span>{isAr ? 'رقم الفاتورة:' : 'Invoice No:'}</span>
                <span className="font-mono font-bold text-amber-300">#{meta?.returnNo || '10842'}</span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span>{isAr ? 'أصناف الفاتورة:' : 'Invoice Items:'}</span>
                <span className="font-bold text-emerald-400">{invoiceItemsCount} صنف</span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span>{isAr ? 'إجمالي القطع الواردة:' : 'Total Pieces:'}</span>
                <span className="font-black text-white">{totalInvoicePieces.toLocaleString()} قطعة</span>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-xs text-slate-300 leading-relaxed">
                {isAr
                  ? 'قم برفع ملف إكسيل الفاتورة الواردة من المخزن الرئيسي إلى الفرع (.xlsx / .xls).'
                  : 'Upload the inbound warehouse-to-branch invoice excel sheet (.xlsx / .xls).'}
              </p>
              <button
                type="button"
                onClick={onTriggerInvoiceUpload}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-black bg-red-600 hover:bg-red-700 active:scale-95 text-white shadow-md transition-all cursor-pointer"
              >
                <Upload className="w-4 h-4" />
                <span>{isAr ? 'رفع شيت الفاتورة الآن 📤' : 'Upload Invoice Sheet Now'}</span>
              </button>
            </div>
          )}
        </div>

        {/* Sheet 2: Master Catalog Sheet */}
        <div
          className={`rounded-2xl p-4 sm:p-5 border transition-all ${
            hasMaster
              ? 'bg-slate-800/80 border-emerald-500/50 shadow-emerald-950/20 shadow-lg'
              : 'bg-slate-800/40 border-amber-500/40 hover:border-amber-400'
          }`}
        >
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex items-center gap-2.5">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center font-black ${
                  hasMaster ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                }`}
              >
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-bold text-slate-400 block">
                  {isAr ? 'المطلب الثاني (2/2):' : 'Requirement 2 of 2:'}
                </span>
                <h3 className="text-sm sm:text-base font-black text-white">
                  {isAr ? 'شيت ماستر الأصناف الرئيسي' : 'Master Catalog Sheet'}
                </h3>
              </div>
            </div>

            <span
              className={`text-xs font-black px-2.5 py-1 rounded-full flex items-center gap-1 ${
                hasMaster
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
              }`}
            >
              {hasMaster ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{isAr ? 'تم الرفع ✅' : 'Uploaded ✅'}</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>{isAr ? 'مفقود (مطلوب) 🔒' : 'Missing (Required) 🔒'}</span>
                </>
              )}
            </span>
          </div>

          {hasMaster ? (
            <div className="bg-slate-900/80 rounded-xl p-3 border border-emerald-500/20 space-y-1.5 text-xs">
              <div className="flex items-center justify-between text-slate-300">
                <span>{isAr ? 'حالة الكتالوج:' : 'Catalog Status:'}</span>
                <span className="font-bold text-emerald-400">{isAr ? 'نشط ومعتمد' : 'Active & Certified'}</span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span>{isAr ? 'الأصناف المسجلة:' : 'Registered Items:'}</span>
                <span className="font-black text-white">{masterCatalogCount.toLocaleString()} صنف</span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span>{isAr ? 'كشف الزيادة والتوالف:' : 'Surplus & Damage:'}</span>
                <span className="font-semibold text-emerald-300">{isAr ? 'مفعّل تلقائياً' : 'Enabled'}</span>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-xs text-slate-300 leading-relaxed">
                {isAr
                  ? 'قم برفع ملف إكسيل ماستر الأصناف العام (Master.xlsx) للتعرف على الأسعار والأصناف الزائدة.'
                  : 'Upload Master.xlsx catalog sheet for universal price lookups and surplus detection.'}
              </p>
              <button
                type="button"
                onClick={onTriggerMasterUpload}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-black bg-amber-600 hover:bg-amber-700 active:scale-95 text-white shadow-md transition-all cursor-pointer"
              >
                <Upload className="w-4 h-4" />
                <span>{isAr ? 'رفع شيت الماستر الآن 📤' : 'Upload Master Sheet Now'}</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Locked Workbench Features Overview */}
      <div className="mt-6 pt-5 border-t border-slate-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-slate-400">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-bold text-slate-300">{isAr ? 'الشاشات المغلقة مؤقتاً:' : 'Locked Screens:'}</span>
          <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">🔒 مسح واستلام الباركود</span>
          <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">🔒 رادار فوارق الفاتورة</span>
          <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">🔒 جدول المراجعة والاعتماد</span>
        </div>

        <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
          <span>{isAr ? 'ستفتح جميع الشاشات تلقائياً فور رفع الشيت المتبقي' : 'Will unlock automatically upon uploading remaining sheet'}</span>
          {isAr ? <ArrowLeft className="w-3.5 h-3.5" /> : <ArrowRight className="w-3.5 h-3.5" />}
        </div>
      </div>
    </div>
  );
};
