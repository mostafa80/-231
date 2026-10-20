import React from 'react';
import { DedicatedReturnItem, DedicatedReturnSlip } from '../types';
import { SoMuchLogo } from './SoMuchLogo';

interface PrintReturnsReceiptProps {
  slip: DedicatedReturnSlip | null;
  items: DedicatedReturnItem[];
}

export const PrintReturnsReceipt: React.FC<PrintReturnsReceiptProps> = ({ slip, items }) => {
  if (!items || items.length === 0) return null;

  const branchName = slip?.branch || items[0]?.branch || 'فرع غير محدد';
  const returnNo = slip?.slipNo || items[0]?.returnNo || '-';
  const dateStr = slip?.date || new Date().toISOString().slice(0, 10);
  const keeper = slip?.keeper || 'أمين المخزن المستلم';
  const notes = slip?.notes || 'لا يوجد';

  const totalQty = items.reduce((sum, it) => sum + (it.qty || 0), 0);
  const totalCost = items.reduce((sum, it) => sum + (it.totalCost || 0), 0);
  const totalSelling = items.reduce((sum, it) => sum + (it.totalSelling || 0), 0);
  const totalSound = items.filter((it) => it.condition === 'sound').reduce((sum, it) => sum + it.qty, 0);
  const totalDamaged = items.filter((it) => it.condition === 'damaged').reduce((sum, it) => sum + it.qty, 0);
  const totalDefect = items.filter((it) => it.condition === 'defect').reduce((sum, it) => sum + it.qty, 0);

  return (
    <div id="printableReturnsReceipt" className="print-only font-['Cairo',sans-serif] text-black bg-white p-5">
      {/* Official Header with SO MUCH Logo */}
      <div className="border-b-2 border-black pb-3 mb-3 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <SoMuchLogo variant="print" className="w-28 sm:w-32 h-10" />
          <div>
            <h1 className="text-xl font-black m-0 leading-tight">
              محضر استلام ومطابقة مردودات الفروع
            </h1>
            <div className="text-xs text-neutral-800 font-bold mt-0.5">
              إذن مرتجع مخزن رسمي معتمد بالتكلفة والبيع | شركة SO MUCH
            </div>
          </div>
        </div>
        <div className="text-left text-xs font-semibold">
          <div>
            <b>تاريخ الطباعة:</b> {new Date().toLocaleDateString('ar-EG')}
          </div>
          <div>
            <b>الوقت:</b> {new Date().toLocaleTimeString('ar-EG')}
          </div>
        </div>
      </div>

      {/* Meta Box: Highlighting Branch Name & Return Number prominently */}
      <div className="bg-neutral-50 border-2 border-black p-3 rounded-lg text-xs grid grid-cols-4 gap-2.5 mb-3 shadow-none">
        <div className="bg-white p-1.5 border border-black/40 rounded">
          <span className="text-[11px] text-neutral-600 block font-bold">🏢 اسم الفرع الراسل:</span>
          <span className="text-sm font-black text-black block">{branchName}</span>
        </div>
        <div className="bg-white p-1.5 border border-black/40 rounded">
          <span className="text-[11px] text-neutral-600 block font-bold">🔢 رقم المردود / الإذن:</span>
          <span className="text-sm font-black text-black block font-mono">#{returnNo}</span>
        </div>
        <div className="bg-white p-1.5 border border-black/40 rounded">
          <span className="text-[11px] text-neutral-600 block font-bold">📅 تاريخ الإذن:</span>
          <span className="text-xs font-bold text-black block">{dateStr}</span>
        </div>
        <div className="bg-white p-1.5 border border-black/40 rounded">
          <span className="text-[11px] text-neutral-600 block font-bold">👤 أمين المخزن المستلم:</span>
          <span className="text-xs font-bold text-black block">{keeper}</span>
        </div>
        <div className="col-span-4 bg-white p-1.5 border border-black/40 rounded">
          <span className="font-bold text-neutral-700">📝 ملاحظات المردود والحركة: </span>
          <span>{notes}</span>
        </div>
      </div>

      {/* Financial Cost & Sale Summary Box */}
      <div className="bg-neutral-100 border-2 border-black p-2.5 rounded-lg text-xs mb-3 grid grid-cols-5 gap-2 text-center font-bold">
        <div className="border-l border-neutral-400 pl-1">
          <span className="text-[10px] text-neutral-600 block">إجمالي القطع المرتجعة:</span>
          <span className="text-base font-black text-black">{totalQty.toLocaleString()} قطعة</span>
        </div>
        <div className="border-l border-neutral-400 pl-1">
          <span className="text-[10px] text-neutral-600 block">إجمالي المرتجع بسعر التكلفة:</span>
          <span className="text-base font-black text-neutral-900">{Math.round(totalCost).toLocaleString()} ج.م</span>
        </div>
        <div className="border-l border-neutral-400 pl-1">
          <span className="text-[10px] text-neutral-600 block">إجمالي المرتجع بسعر البيع:</span>
          <span className="text-base font-black text-black">{Math.round(totalSelling).toLocaleString()} ج.م</span>
        </div>
        <div className="border-l border-neutral-400 pl-1">
          <span className="text-[10px] text-neutral-600 block">فارق القيمة (هامش الربح):</span>
          <span className="text-sm font-black text-emerald-800">
            {Math.round(totalSelling - totalCost).toLocaleString()} ج.م
          </span>
        </div>
        <div>
          <span className="text-[10px] text-neutral-600 block">تفصيل الحالات:</span>
          <span className="text-[11px] font-bold block text-neutral-800">
            سليم: {totalSound} | تالف: {totalDamaged} | عيب: {totalDefect}
          </span>
        </div>
      </div>

      {/* Detailed Items Table with Cost & Selling Prices */}
      <table className="w-full text-center border-collapse border border-black text-[11px] mb-4">
        <thead>
          <tr className="bg-neutral-200 font-black">
            <th className="border border-black p-1.5 w-7">م</th>
            <th className="border border-black p-1.5 w-24">الباركود</th>
            <th className="border border-black p-1.5 text-right">اسم الصنف المرتجع</th>
            <th className="border border-black p-1.5 w-16">التصنيف</th>
            <th className="border border-black p-1.5 w-14">الحالة</th>
            <th className="border border-black p-1.5 w-12">الكمية</th>
            <th className="border border-black p-1.5 w-16 bg-neutral-100">سعر التكلفة</th>
            <th className="border border-black p-1.5 w-20 bg-neutral-100">إجمالي التكلفة</th>
            <th className="border border-black p-1.5 w-16 bg-neutral-200">سعر البيع</th>
            <th className="border border-black p-1.5 w-20 bg-neutral-200">إجمالي البيع</th>
            <th className="border border-black p-1.5 w-24">ملاحظات</th>
          </tr>
        </thead>
        <tbody>
          {items.map((it, idx) => {
            const condLabel =
              it.condition === 'sound'
                ? 'سليم'
                : it.condition === 'damaged'
                ? 'تالف'
                : 'عيب صناعة';
            return (
              <tr key={it.id || idx} className="hover:bg-neutral-50">
                <td className="border border-black p-1">{idx + 1}</td>
                <td className="border border-black p-1 font-mono font-bold">{it.code}</td>
                <td className="border border-black p-1 text-right font-bold">{it.itemName}</td>
                <td className="border border-black p-1">{it.category || 'عام'}</td>
                <td className="border border-black p-1 font-bold">{condLabel}</td>
                <td className="border border-black p-1 font-black">{it.qty}</td>
                <td className="border border-black p-1 bg-neutral-50/50">{it.costPrice}</td>
                <td className="border border-black p-1 font-bold bg-neutral-50/50">
                  {Math.round(it.totalCost).toLocaleString()} ج.م
                </td>
                <td className="border border-black p-1 bg-neutral-100/50">{it.sellingPrice}</td>
                <td className="border border-black p-1 font-bold bg-neutral-100/50">
                  {Math.round(it.totalSelling).toLocaleString()} ج.م
                </td>
                <td className="border border-black p-1 text-[10px]">{it.notes || '-'}</td>
              </tr>
            );
          })}
          {/* Summary Row */}
          <tr className="bg-neutral-300 font-black text-xs">
            <td colSpan={5} className="border border-black p-1.5 text-right font-black">
              الإجمالي العام لكافة أصناف المردود
            </td>
            <td className="border border-black p-1.5 font-black">{totalQty}</td>
            <td className="border border-black p-1.5">-</td>
            <td className="border border-black p-1.5 font-black">
              {Math.round(totalCost).toLocaleString()} ج.م
            </td>
            <td className="border border-black p-1.5">-</td>
            <td className="border border-black p-1.5 font-black">
              {Math.round(totalSelling).toLocaleString()} ج.م
            </td>
            <td className="border border-black p-1.5">-</td>
          </tr>
        </tbody>
      </table>

      {/* Official Signatures Blocks Requested By User */}
      <div className="mt-8 pt-4 border-t-2 border-black grid grid-cols-3 gap-6 text-center text-xs">
        {/* Signature 1: Receiver / Storekeeper */}
        <div className="border border-black p-3 rounded-lg bg-neutral-50">
          <p className="font-black text-sm text-black">توقيع واعتماد المستلم / أمين المخزن</p>
          <div className="h-14 flex items-center justify-center text-neutral-400 text-[10px]">
            (مكان الختم والتوقيع)
          </div>
          <p className="text-right">
            <b>الاسم:</b> {keeper !== '-' ? keeper : '...........................................'}
          </p>
          <p className="text-right mt-1.5">
            <b>التوقيع:</b> ...........................................
          </p>
          <p className="text-right mt-1.5">
            <b>التاريخ:</b> {dateStr}
          </p>
        </div>

        {/* Signature 2: Audit & Review Department */}
        <div className="border border-black p-3 rounded-lg bg-neutral-50">
          <p className="font-black text-sm text-black">اعتماد قسم المراجعة والتدقيق المالي</p>
          <div className="h-14 flex items-center justify-center text-neutral-400 text-[10px]">
            (خاتم الإدارة المالية والمطابقة)
          </div>
          <p className="text-right">
            <b>اسم المراجع:</b> ...........................................
          </p>
          <p className="text-right mt-1.5">
            <b>التوقيع:</b> ...........................................
          </p>
          <p className="text-right mt-1.5">
            <b>الحالة:</b> [✓] مطابق ومعتمد للتسوية
          </p>
        </div>

        {/* Signature 3: Branch Dispatch / Driver */}
        <div className="border border-black p-3 rounded-lg bg-neutral-50">
          <p className="font-black text-sm text-black">مندوب الفرع الراسل / السائق المسلّم</p>
          <div className="h-14 flex items-center justify-center text-neutral-400 text-[10px]">
            (توقيع المسلّم)
          </div>
          <p className="text-right">
            <b>اسم المندوب:</b> ...........................................
          </p>
          <p className="text-right mt-1.5">
            <b>التوقيع:</b> ...........................................
          </p>
          <p className="text-right mt-1.5">
            <b>الفرع:</b> {branchName}
          </p>
        </div>
      </div>
    </div>
  );
};
