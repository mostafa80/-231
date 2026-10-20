import React, { useRef } from 'react';
import { Upload, FileSpreadsheet, Building2, Calendar, User, FileText, ArrowLeft, ArrowRight, ShieldCheck, CheckCircle2, Package } from 'lucide-react';
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

  const totalInvoicePieces = session
    ? Object.values(session.inventoryMap).reduce((sum, item) => sum + (item.systemQty || 0), 0)
    : 0;
  const totalInvoiceAmount = session
    ? Object.values(session.inventoryMap).reduce((sum, item) => sum + ((item.systemQty || 0) * (item.price || 0)), 0)
    : 0;
  const totalCountedPieces = session
    ? Object.values(session.jardData || {}).reduce((sum, j) => sum + (j.countedQty || 0), 0)
    : 0;

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

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4 h-[275.25px]">
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

          {itemsCount > 0 && session ? (
            <div className="mt-2.5 flex items-center gap-1.5 text-xs font-bold text-red-700 bg-white/80 px-2.5 py-1.5 rounded-lg border border-rose-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>
                {session.returnMeta.branch ? `[${session.returnMeta.branch}] - ` : ''}
                {isAr ? `(${itemsCount} صنف معتمد بالفاتورة)` : `(${itemsCount} items in invoice)`}
              </span>
            </div>
          ) : (
            <div className="mt-2.5 flex items-center gap-1.5 text-xs font-bold text-amber-900 bg-amber-100/80 px-2.5 py-1.5 rounded-lg border border-amber-300">
              <span className="text-amber-700">⚠️</span>
              <span>{isAr ? 'لم يتم رفع شيت الفاتورة بعد (مطلوب لبدء المسح)' : 'Invoice sheet not uploaded yet (required to scan)'}</span>
            </div>
          )}

          <p className="text-[11px] text-slate-600 mt-2 leading-relaxed">
            ✨{' '}
            <b>{isAr ? 'قراءة ذكية فائقة للفاتورة:' : 'Smart Invoice Parser:'}</b>{' '}
            {isAr
              ? 'يتعرف البرنامج تلقائياً على اسم الفرع، رقم فاتورة البيع، الأصناف، والكميات المسجلة، ويحسب لك فوراً الفوارق بين كميات الفاتورة والمستلم الفعلي (عجز / زيادة).'
              : 'Automatically detects branch name, invoice #, items, expected quantities, and computes shortages / surpluses instantly.'}
          </p>

          <div className="mt-2.5 p-2 sm:p-2.5 bg-[#d2d2d2] border border-rose-300 rounded-lg text-[11px] text-[#16077e]">
            <div className="font-bold flex items-center gap-1.5 mb-1 text-[#060606]">
              <span>📋</span>
              <span>{isAr ? 'ترتيب أعمدة نموذج فاتورة البيع المعتمد:' : 'Sales Invoice Column Mapping:'}</span>
            </div>
            <div className="flex flex-wrap items-center gap-1.5 font-bold h-[38px] w-[630.156px]">
              <span className="bg-white px-2 py-0.5 rounded border border-rose-300 font-mono text-red-700">
                B = Total Price {isAr ? '(الإجمالي)' : ''}
              </span>
              <span className="bg-white px-2 py-0.5 rounded border border-rose-300 font-mono text-red-700">
                C = Item Price {isAr ? '(السعر)' : ''}
              </span>
              <span className="bg-white px-2 py-0.5 rounded border border-rose-300 font-mono text-red-700">
                D = Quantity {isAr ? '(الكمية)' : ''}
              </span>
              <span className="bg-white px-2 py-0.5 rounded border border-rose-300 font-mono text-red-700">
                E = Item Name {isAr ? '(اسم الصنف)' : ''}
              </span>
              <span className="bg-white px-2 py-0.5 rounded border border-rose-300 font-mono text-red-700">
                F = Barcode {isAr ? '(الباركود)' : ''}
              </span>
              <span className="text-[#ff0000] font-medium">
                {isAr ? '• (يتم التغاضي عن أي عمود آخر تلقائياً)' : '• (Any other columns are ignored)'}
              </span>
            </div>
          </div>
        </div>

        {/* Master Catalog Uploader */}
        <div className="lg:col-span-5 bg-amber-50/60 border border-[#ff0000] text-[#4d2121] rounded-xl p-3 sm:p-4 flex flex-col justify-between">
          <div>
            <label className="block text-xs font-bold text-amber-900 mb-1.5 flex items-center gap-1.5">
              <FileSpreadsheet className="w-4 h-4 text-amber-700" />
              <span className="bg-[#ffffff] text-[#265626] h-[22px] w-[364.406px] text-center no-underline leading-[17px] text-[15px] inline-block">{isAr ? 'تحميل شيت ماستر عام للأصناف (Master.xlsx - اختياري):' : 'Master Catalog (Master.xlsx - Optional):'}</span>
            </label>
            <input
              ref={masterInputRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) onMasterUpload(file);
              }}
              className="text-xs text-slate-600 file:mr-2 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-amber-600 file:text-white hover:file:bg-amber-700 cursor-pointer bg-[#ffffff] border border-amber-200 rounded-lg p-1.5 w-full"
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
            <div className="mt-2 text-xs font-bold text-amber-900 bg-amber-100/80 px-2.5 py-1.5 rounded-lg border border-amber-300 flex items-center gap-1.5">
              <span>⚠️</span>
              <span>
                {isAr
                  ? 'لم يتم رفع شيت الماستر بعد (مطلوب لبدء المسح)'
                  : 'Master catalog not uploaded yet (required to scan)'}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Return Meta Box & Smart Route Banner & Inbound Invoice Totals */}
      {session && (itemsCount > 0 || meta?.branch || meta?.returnNo) && (
        <div className="mt-4 bg-gradient-to-r from-rose-50/80 via-white to-rose-50/50 border border-rose-200/90 rounded-xl p-3.5 sm:p-4 space-y-3">
          {/* 📦 Highlight Card: إجمالي الفاتورة الواردة من المخزن برقمها أول ما يتم رفع الشيت */}
          <div className="bg-gradient-to-l from-red-700 via-rose-700 to-red-800 text-white rounded-xl p-3.5 sm:p-4 shadow-md border border-red-500/30">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-white/15 backdrop-blur-xs flex items-center justify-center font-black flex-shrink-0 border border-white/20 shadow-inner">
                  <Package className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#000000] border border-white/30 text-rose-50">
                      {isAr ? 'فاتورة واردة من المخزن إلى الفرع' : 'Inbound Invoice (Warehouse to Branch)'}
                    </span>
                    <span className="text-[20px] font-black tracking-wide font-mono bg-white text-red-700 px-3 py-0.5 rounded-lg shadow-xs">
                      {meta?.returnNo ? `#${meta.returnNo}` : (isAr ? 'بدون رقم' : 'No #')}
                    </span>
                  </div>
                  <div className="text-xs text-rose-100 font-semibold mt-1">
                    {meta?.branch ? (
                      <span className="text-center text-[16px] font-bold no-underline text-[#ffffff]">{isAr ? `الفرع المستلم: ${meta.branch}` : `Branch: ${meta.branch}`}</span>
                    ) : null}
                    {meta?.date ? <span className="mx-1.5">• {isAr ? `بتاريخ: ${meta.date}` : `Date: ${meta.date}`}</span> : null}
                  </div>
                </div>
              </div>

              {/* Big Metrics Grid */}
              <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 bg-black/25 backdrop-blur-xs px-3.5 py-2.5 rounded-xl border border-white/10 self-start lg:self-auto">
                <div>
                  <span className="text-[11px] text-[#f1f1f1] block font-bold">
                    {isAr ? 'إجمالي الفاتورة الواردة من المخزن:' : 'Total Inbound Pieces:'}
                  </span>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span className="text-xl sm:text-2xl font-black text-white">
                      {totalInvoicePieces.toLocaleString()}
                    </span>
                    <span className="text-center text-[15px] leading-[19px] font-bold text-rose-200">
                      {isAr ? 'قطعة' : 'pcs'}
                    </span>
                  </div>
                </div>

                <div className="w-px h-8 bg-white/20"></div>

                <div>
                  <span className="text-[11px] text-rose-200 block font-bold">
                    {isAr ? 'عدد الأصناف:' : 'Items Count:'}
                  </span>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span className="text-lg sm:text-xl font-black text-white">
                      {itemsCount.toLocaleString()}
                    </span>
                    <span className="text-xs font-bold text-rose-200">
                      {isAr ? 'صنف' : 'items'}
                    </span>
                  </div>
                </div>

                <div className="w-px h-8 bg-white/20"></div>

                <div>
                  <span className="text-[11px] text-rose-200 block font-bold">
                    {isAr ? 'المستلم الفعلي حتى الآن:' : 'Counted So Far:'}
                  </span>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span className="text-lg sm:text-xl font-black text-emerald-300">
                      {totalCountedPieces.toLocaleString()}
                    </span>
                    <span className="text-xs font-bold text-rose-200">
                      {isAr ? 'قطعة' : 'pcs'}
                    </span>
                  </div>
                </div>

                {totalInvoiceAmount > 0 && (
                  <>
                    <div className="w-px h-8 bg-white/20 hidden xl:block"></div>
                    <div className="hidden xl:block">
                      <span className="text-[11px] text-rose-200 block font-bold">
                        {isAr ? 'إجمالي القيمة:' : 'Total Value:'}
                      </span>
                      <div className="flex items-baseline gap-1 mt-0.5">
                        <span className="text-base sm:text-lg font-black text-amber-200">
                          {Math.round(totalInvoiceAmount).toLocaleString()}
                        </span>
                        <span className="text-[11px] font-bold text-rose-200">
                          {isAr ? 'ج.م' : 'EGP'}
                        </span>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Approval Banner if Completed */}
          {session?.isCompleted && (
            <div className="flex items-center justify-between bg-emerald-600 text-white px-3 py-2 rounded-lg text-xs font-bold shadow-sm">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-200 flex-shrink-0" />
                <span>
                  {isAr
                    ? `✅ تم استلام واعتماد هذه الفاتورة بنجاح ${session.completedAt ? `(الساعة ${session.completedAt})` : ''}`
                    : `✅ Invoice received & approved successfully ${session.completedAt ? `at ${session.completedAt}` : ''}`}
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
                    📦 {isAr ? 'فاتورة واردة من المخزن الى الفرع' : 'Inbound Invoice (Warehouse to Branch)'}
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
                {isAr ? 'الفاتورة النشطة حالياً' : 'Active Inbound Invoice'}
              </div>
            </div>
          )}

          {/* Metadata Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
            <div className="bg-white/80 p-2 rounded-lg border border-rose-100">
              <span className="text-[11px] font-bold text-rose-800 flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5" />
                {isAr ? 'الفرع المستلم:' : 'Branch:'}
              </span>
              <span className="font-extrabold text-slate-900 block mt-0.5 truncate">{meta?.branch || '-'}</span>
            </div>

            <div className="bg-white/80 p-2 rounded-lg border border-rose-100">
              <span className="text-[11px] font-bold text-rose-800 flex items-center gap-1">
                <FileText className="w-3.5 h-3.5" />
                {isAr ? 'رقم الفاتورة الواردة:' : 'Inbound Invoice No:'}
              </span>
              <span className="font-extrabold text-red-700 block mt-0.5">{meta?.returnNo || '-'}</span>
            </div>

            <div className="bg-white/80 p-2 rounded-lg border border-rose-100">
              <span className="text-[11px] font-bold text-rose-800 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {isAr ? 'تاريخ الفاتورة:' : 'Invoice Date:'}
              </span>
              <span className="font-extrabold text-slate-800 block mt-0.5">{meta?.date || '-'}</span>
            </div>

            <div className="bg-white/80 p-2 rounded-lg border border-rose-100">
              <span className="text-[11px] font-bold text-rose-800 flex items-center gap-1">
                <User className="w-3.5 h-3.5" />
                {isAr ? 'المستلم / أمين العهدة:' : 'Storekeeper:'}
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
