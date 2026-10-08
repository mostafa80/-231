import React, { useRef } from 'react';
import { Upload, FileSpreadsheet, Building2, Calendar, User, FileText, ArrowLeft, ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { Session, Language } from '../types';

interface ImportSectionProps {
  session: Session | null;
  onFileUpload: (file: File) => void;
  onMasterUpload: (file: File) => void;
  masterCatalogCount: number;
  autoSaveTime: string;
  lang: Language;
}

export const ImportSection: React.FC<ImportSectionProps> = ({
  session,
  onFileUpload,
  onMasterUpload,
  masterCatalogCount,
  autoSaveTime,
  lang,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const masterInputRef = useRef<HTMLInputElement>(null);
  const isAr = lang === 'ar';

  const route = session?.routeInfo;
  const meta = session?.returnMeta;
  const itemsCount = session ? Object.keys(session.inventoryMap).length : 0;

  return (
    <section className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-4 sm:p-5 mb-4">
      {/* Title & Auto-Save Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 mb-3 border-b border-slate-100 gap-2">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-red-100 text-red-700 flex items-center justify-center font-bold text-xs">
            1
          </div>
          <h2 className="text-sm sm:text-base font-bold text-slate-900">
            {isAr
              ? 'استيراد فاتورة البيع أو شيت الاستلام (فاتورة لفرع واحد أو مجمع)'
              : 'Import Sales Invoice or Delivery Sheet (Single Branch or Multi)'}
          </h2>
        </div>

        {/* Auto-Save Indicator */}
        <div className="flex items-center gap-2 text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-50 border border-slate-200 text-slate-600 self-start sm:self-auto">
          <span className="w-2 h-2 rounded-full bg-emerald-500 pulse-dot"></span>
          <span>{isAr ? `الحفظ التلقائي: ${autoSaveTime || 'نشط'}` : `Auto-Saved: ${autoSaveTime || 'Active'}`}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4">
        {/* Main Returns Sheet Uploader */}
        <div className="lg:col-span-7 bg-rose-50/60 border border-rose-200/80 rounded-xl p-3 sm:p-4 transition-all">
          <label className="block text-xs font-bold text-red-800 mb-1.5 flex items-center gap-1.5">
            <Upload className="w-4 h-4 text-red-600" />
            <span>{isAr ? 'تحميل فاتورة البيع أو شيت الاستلام (.xlsx / .xls):' : 'Upload Sales Invoice / Slip (.xlsx, .xls):'}</span>
          </label>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) onFileUpload(file);
              }}
              className="text-xs text-slate-600 file:mr-2 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-red-600 file:text-white hover:file:bg-red-700 cursor-pointer bg-white border border-rose-200 rounded-lg p-1.5 flex-1"
            />
          </div>

          {itemsCount > 0 && session && (
            <div className="mt-2.5 flex items-center gap-1.5 text-xs font-bold text-red-700 bg-white/80 px-2.5 py-1.5 rounded-lg border border-rose-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>
                {session.returnMeta.branch ? `[${session.returnMeta.branch}] - ` : ''}
                {isAr ? `(${itemsCount} صنف معتمد بالفاتورة)` : `(${itemsCount} items in invoice)`}
              </span>
            </div>
          )}

          <p className="text-[11px] text-slate-600 mt-2 leading-relaxed">
            ✨{' '}
            <b>{isAr ? 'قراءة ذكية فائقة للفاتورة:' : 'Smart Invoice Parser:'}</b>{' '}
            {isAr
              ? 'يتعرف البرنامج تلقائياً على اسم الفرع، رقم فاتورة البيع، الأصناف، والكميات المسجلة، ويحسب لك فوراً الفوارق بين كميات الفاتورة والمستلم الفعلي (عجز / زيادة).'
              : 'Automatically detects branch name, invoice #, items, expected quantities, and computes shortages / surpluses instantly.'}
          </p>
        </div>

        {/* Master Catalog Uploader */}
        <div className="lg:col-span-5 bg-amber-50/60 border border-amber-200/80 rounded-xl p-3 sm:p-4 flex flex-col justify-between">
          <div>
            <label className="block text-xs font-bold text-amber-900 mb-1.5 flex items-center gap-1.5">
              <FileSpreadsheet className="w-4 h-4 text-amber-700" />
              <span>{isAr ? 'تحميل شيت ماستر عام للأصناف (Master.xlsx - اختياري):' : 'Master Catalog (Master.xlsx - Optional):'}</span>
            </label>
            <input
              ref={masterInputRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) onMasterUpload(file);
              }}
              className="text-xs text-slate-600 file:mr-2 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-amber-600 file:text-white hover:file:bg-amber-700 cursor-pointer bg-white border border-amber-200 rounded-lg p-1.5 w-full"
            />
          </div>

          {masterCatalogCount > 0 ? (
            <div className="mt-2 text-xs font-bold text-emerald-700 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>
                {isAr
                  ? `تم اعتماد الماستر العام (${masterCatalogCount} صنف مسجل)`
                  : `Master Catalog Loaded (${masterCatalogCount} items)`}
              </span>
            </div>
          ) : (
            <p className="text-[11px] text-amber-800/80 mt-2">
              {isAr
                ? 'يفيد في التعرف الفوري على أي صنف غير مسجل بإذن المرتجع.'
                : 'Helps identify any extra scanned item not listed in return invoice.'}
            </p>
          )}
        </div>
      </div>

      {/* Return Meta Box & Smart Route Banner */}
      {session && (meta?.branch || meta?.returnNo) && (
        <div className="mt-4 bg-gradient-to-r from-rose-50/80 via-white to-rose-50/50 border border-rose-200/90 rounded-xl p-3.5 sm:p-4 space-y-3">
          {/* Approval Banner if Completed */}
          {session?.isCompleted && (
            <div className="flex items-center justify-between bg-emerald-600 text-white px-3 py-2 rounded-lg text-xs font-bold shadow-sm">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-200 flex-shrink-0" />
                <span>
                  {isAr
                    ? `✅ تم استلام واعتماد هذا الإذن بنجاح ${session.completedAt ? `(الساعة ${session.completedAt})` : ''}`
                    : `✅ Slip received & approved successfully ${session.completedAt ? `at ${session.completedAt}` : ''}`}
                </span>
              </div>
              <span className="text-[11px] bg-emerald-800 text-emerald-100 px-2 py-0.5 rounded font-black">
                {isAr ? 'معتمد ومطبوع' : 'Approved & Printed'}
              </span>
            </div>
          )}

          {/* Movement Route Banner */}
          {route && (
            <div className="flex flex-wrap items-center justify-between gap-2 bg-white border border-rose-200 rounded-lg p-2.5 shadow-2xs">
              <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm font-bold">
                {route.isTransfer ? (
                  <span className="px-2.5 py-1 rounded-md bg-sky-100 text-sky-800 border border-sky-200">
                    🚚 {isAr ? 'تحويل بين الفروع' : 'Branch Transfer'}
                  </span>
                ) : (
                  <span className="px-2.5 py-1 rounded-md bg-rose-100 text-rose-800 border border-rose-200">
                    📦 {isAr ? 'مرتجع للمخزن' : 'Warehouse Return'}
                  </span>
                )}

                {route.isDamaged && (
                  <span className="px-2.5 py-1 rounded-md bg-amber-100 text-amber-800 border border-amber-200">
                    ⚠️ {isAr ? 'إذن توالف وتكهين' : 'Damaged / Defect Slip'}
                  </span>
                )}

                <span className="text-slate-300">|</span>

                <span className="text-slate-600">
                  {isAr ? 'من:' : 'From:'} <b className="text-slate-900">{route.fromBranch}</b>
                </span>

                {isAr ? (
                  <ArrowLeft className="w-4 h-4 text-rose-600" />
                ) : (
                  <ArrowRight className="w-4 h-4 text-rose-600" />
                )}

                <span className="text-slate-600">
                  {isAr ? 'إلى:' : 'To:'} <b className="text-red-700">{route.toBranch}</b>
                </span>
              </div>

              <div className="text-[11px] font-semibold text-slate-500">
                {isAr ? 'الإذن النشط حالياً' : 'Active Return Session'}
              </div>
            </div>
          )}

          {/* Metadata Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
            <div className="bg-white/80 p-2 rounded-lg border border-rose-100">
              <span className="text-[11px] font-bold text-rose-800 flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5" />
                {isAr ? 'الفرع الراسل:' : 'Sending Branch:'}
              </span>
              <span className="font-extrabold text-slate-900 block mt-0.5 truncate">{meta?.branch || '-'}</span>
            </div>

            <div className="bg-white/80 p-2 rounded-lg border border-rose-100">
              <span className="text-[11px] font-bold text-rose-800 flex items-center gap-1">
                <FileText className="w-3.5 h-3.5" />
                {isAr ? 'رقم إذن المردودات:' : 'Return Slip No:'}
              </span>
              <span className="font-extrabold text-red-700 block mt-0.5">{meta?.returnNo || '-'}</span>
            </div>

            <div className="bg-white/80 p-2 rounded-lg border border-rose-100">
              <span className="text-[11px] font-bold text-rose-800 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {isAr ? 'تاريخ الإذن:' : 'Date:'}
              </span>
              <span className="font-extrabold text-slate-800 block mt-0.5">{meta?.date || '-'}</span>
            </div>

            <div className="bg-white/80 p-2 rounded-lg border border-rose-100">
              <span className="text-[11px] font-bold text-rose-800 flex items-center gap-1">
                <User className="w-3.5 h-3.5" />
                {isAr ? 'أمين المخزن:' : 'Storekeeper:'}
              </span>
              <span className="font-extrabold text-slate-800 block mt-0.5 truncate">{meta?.keeper || '-'}</span>
            </div>
          </div>

          {meta?.notes && (
            <div className="bg-white/90 p-2.5 rounded-lg border border-rose-100 text-xs text-slate-700">
              <span className="font-bold text-rose-800">{isAr ? '📝 الملاحظات الأصلية:' : 'Original Notes:'} </span>
              <span>{meta.notes}</span>
            </div>
          )}
        </div>
      )}
    </section>
  );
};
