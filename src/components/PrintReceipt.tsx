import React from 'react';
import { Session, ReturnItem } from '../types';
import { SoMuchLogo } from './SoMuchLogo';

interface PrintReceiptProps {
  session: Session | null;
}

export const PrintReceipt: React.FC<PrintReceiptProps> = ({ session }) => {
  if (!session) return null;

  const items = Object.values(session.inventoryMap) as ReturnItem[];
  const r = session.routeInfo;
  const branch = session.returnMeta.branch || 'غير محدد';
  const returnNo = session.returnMeta.returnNo || '-';
  const dateStr = session.returnMeta.date || new Date().toISOString().slice(0, 10);
  const keeper = session.returnMeta.keeper || '-';

  let totalInvoiceQty = 0;
  let totalSoundQty = 0;
  let totalDamagedQty = 0;
  let totalReceivedQty = 0;
  let totalDiffSum = 0;

  // Shortage & Surplus financial calculation
  let totalShortagePieces = 0;
  let totalShortageCostValue = 0;
  let totalShortageSaleValue = 0;
  let totalSurplusSaleValue = 0;

  // Damaged list
  const damagedList: {
    code: string;
    itemName: string;
    category: string;
    damagedQty: number;
    cost: number;
    price: number;
    totalCost: number;
    totalSale: number;
  }[] = [];

  let grandDamagedCost = 0;
  let grandDamagedSale = 0;

  items.forEach((it) => {
    const key = it.code.toUpperCase();
    const j = session.jardData[key];
    const sound = j ? j.soundQty : 0;
    const damaged = j ? j.damagedQty : 0;
    const recQty = sound + damaged;
    const diff = recQty - it.systemQty;
    const price = it.price || 0;
    const cost = it.cost || 0;

    totalInvoiceQty += it.systemQty;
    totalSoundQty += sound;
    totalDamagedQty += damaged;
    totalReceivedQty += recQty;
    totalDiffSum += diff;

    if (diff < 0) {
      const shortageQty = Math.abs(diff);
      totalShortagePieces += shortageQty;
      totalShortageCostValue += shortageQty * cost;
      totalShortageSaleValue += shortageQty * price;
    } else if (diff > 0) {
      totalSurplusSaleValue += diff * price;
    }

    if (damaged > 0) {
      const dmgCost = damaged * cost;
      const dmgSale = damaged * price;
      grandDamagedCost += dmgCost;
      grandDamagedSale += dmgSale;

      damagedList.push({
        code: it.code,
        itemName: it.itemName,
        category: it.fullCategory || it.category || 'عام',
        damagedQty: damaged,
        cost,
        price,
        totalCost: dmgCost,
        totalSale: dmgSale,
      });
    }
  });

  return (
    <div id="printableReceipt" className="print-only font-['Cairo',sans-serif] text-black bg-white p-4">
      {/* Official Header with SO MUCH Logo */}
      <div className="border-b-2 border-black pb-3 mb-3 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <SoMuchLogo variant="print" className="w-28 sm:w-32 h-10" />
          <div>
            <h1 className="text-xl font-black m-0 leading-tight">
              برنامج الاستلامات للفروع
            </h1>
            <div className="text-xs text-neutral-700 font-bold mt-0.5">
              إذن استلام ومراجعة رسمي معتمد | شركة SO MUCH
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

      {/* Meta Box */}
      <div className="bg-neutral-50 border border-neutral-300 p-2.5 rounded text-xs grid grid-cols-4 gap-2 mb-3">
        <div>
          <b>🏢 الفرع الراسل:</b> {branch}
        </div>
        <div>
          <b>🚚 الوجهة / الاستلام:</b> {r.toBranch}
        </div>
        <div>
          <b>🔢 رقم إذن المردود:</b> {returnNo}
        </div>
        <div>
          <b>📅 تاريخ الإذن:</b> {dateStr}
        </div>
        <div>
          <b>👤 أمين المخزن:</b> {keeper}
        </div>
        <div>
          <b>📦 نوع الحركة:</b> {r.routeType}
        </div>
        <div className="col-span-2">
          <b>📝 الملاحظات:</b> {session.returnMeta.notes || 'لا يوجد'}
        </div>
      </div>

      {/* Financial Shortage & Audit Summary Box */}
      <div className="bg-neutral-100 border border-black p-2 rounded text-xs mb-3 grid grid-cols-4 gap-2 text-center font-bold">
        <div className="border-l border-neutral-300 pl-1">
          <span className="text-[10px] text-neutral-600 block">إجمالي العجز بسعر التكلفة:</span>
          <span className="text-red-700 text-sm">{totalShortageCostValue.toLocaleString()} ج.م</span>
        </div>
        <div className="border-l border-neutral-300 pl-1">
          <span className="text-[10px] text-neutral-600 block">إجمالي العجز بسعر البيع:</span>
          <span className="text-red-700 text-sm">{totalShortageSaleValue.toLocaleString()} ج.م</span>
        </div>
        <div className="border-l border-neutral-300 pl-1">
          <span className="text-[10px] text-neutral-600 block">قطع العجز المحصورة:</span>
          <span className="text-neutral-900 text-sm">{totalShortagePieces} قطعة</span>
        </div>
        <div>
          <span className="text-[10px] text-neutral-600 block">قيمة التوالف بالتكلفة:</span>
          <span className="text-amber-700 text-sm">{grandDamagedCost.toLocaleString()} ج.م</span>
        </div>
      </div>

      {/* Table 1: General Items Receipt & Audit */}
      <h3 className="text-xs font-black mb-1">📋 جدول تدقيق واستلام أصناف الإذن:</h3>
      <table className="w-full border-collapse border border-black text-[11px] mb-4 text-center">
        <thead>
          <tr className="bg-neutral-200">
            <th className="border border-black p-1.5 w-7">م</th>
            <th className="border border-black p-1.5 font-mono">الباركود</th>
            <th className="border border-black p-1.5 text-right">اسم الصنف</th>
            <th className="border border-black p-1.5 w-14">سعر التكلفة</th>
            <th className="border border-black p-1.5 w-14">سعر البيع</th>
            <th className="border border-black p-1.5 w-14">كمية الإذن</th>
            <th className="border border-black p-1.5 w-12">سليم</th>
            <th className="border border-black p-1.5 w-12">متلف</th>
            <th className="border border-black p-1.5 w-14">إجمالي المستلم</th>
            <th className="border border-black p-1.5 w-12">الفرق</th>
            <th className="border border-black p-1.5 w-14">الحالة</th>
          </tr>
        </thead>
        <tbody>
          {items.map((it, idx) => {
            const key = it.code.toUpperCase();
            const j = session.jardData[key];
            const sound = j ? j.soundQty : 0;
            const damaged = j ? j.damagedQty : 0;
            const recQty = sound + damaged;
            const diff = recQty - it.systemQty;

            let status = 'مطابق';
            if (diff < 0) status = 'عجز';
            else if (diff > 0) status = 'فائض';

            return (
              <tr key={it.code}>
                <td className="border border-black p-1">{idx + 1}</td>
                <td className="border border-black p-1 font-mono">{it.code}</td>
                <td className="border border-black p-1 text-right font-medium">{it.itemName}</td>
                <td className="border border-black p-1">{it.cost ?? 0}</td>
                <td className="border border-black p-1 font-bold">{it.price ?? 0}</td>
                <td className="border border-black p-1 font-bold">{it.systemQty}</td>
                <td className="border border-black p-1">{sound}</td>
                <td className={`border border-black p-1 ${damaged > 0 ? 'text-red-700 font-bold' : ''}`}>
                  {damaged}
                </td>
                <td className="border border-black p-1 font-bold">{recQty}</td>
                <td className="border border-black p-1 font-bold">
                  {diff > 0 ? `+${diff}` : diff}
                </td>
                <td className="border border-black p-1">{status}</td>
              </tr>
            );
          })}
          <tr className="bg-neutral-200 font-bold">
            <td colSpan={5} className="border border-black p-1.5">
              الإجمالي الكلي
            </td>
            <td className="border border-black p-1.5">{totalInvoiceQty}</td>
            <td className="border border-black p-1.5">{totalSoundQty}</td>
            <td className="border border-black p-1.5">{totalDamagedQty}</td>
            <td className="border border-black p-1.5">{totalReceivedQty}</td>
            <td className="border border-black p-1.5">
              {totalDiffSum > 0 ? `+${totalDiffSum}` : totalDiffSum}
            </td>
            <td className="border border-black p-1.5">
              {totalDiffSum === 0 ? 'مطابق' : totalDiffSum > 0 ? 'صافي زيادة' : 'صافي عجز'}
            </td>
          </tr>
        </tbody>
      </table>

      {/* Table 2: Separate Table for Damaged Items (if any) */}
      {damagedList.length > 0 && (
        <div className="mb-4">
          <h3 className="text-xs font-black text-red-800 mb-1">
            ⚠️ بيان وحصر القطع المتلفة / التالفة الواردة بالإذن (جدول منفصل للتكهين والمطالبات):
          </h3>
          <table className="w-full border-collapse border border-black text-[11px] text-center">
            <thead>
              <tr className="bg-red-50">
                <th className="border border-black p-1.5 w-7">م</th>
                <th className="border border-black p-1.5 font-mono">الباركود</th>
                <th className="border border-black p-1.5 text-right">اسم الصنف</th>
                <th className="border border-black p-1.5">التصنيف</th>
                <th className="border border-black p-1.5 w-16">عدد المتلف</th>
                <th className="border border-black p-1.5 w-16">سعر التكلفة</th>
                <th className="border border-black p-1.5 w-20">إجمالي التكلفة</th>
                <th className="border border-black p-1.5 w-16">سعر البيع</th>
                <th className="border border-black p-1.5 w-20">إجمالي البيع</th>
              </tr>
            </thead>
            <tbody>
              {damagedList.map((d, index) => (
                <tr key={d.code}>
                  <td className="border border-black p-1">{index + 1}</td>
                  <td className="border border-black p-1 font-mono">{d.code}</td>
                  <td className="border border-black p-1 text-right font-bold">{d.itemName}</td>
                  <td className="border border-black p-1">{d.category}</td>
                  <td className="border border-black p-1 font-black text-red-700">{d.damagedQty}</td>
                  <td className="border border-black p-1">{d.cost}</td>
                  <td className="border border-black p-1 font-bold">{d.totalCost.toLocaleString()} ج.م</td>
                  <td className="border border-black p-1">{d.price}</td>
                  <td className="border border-black p-1 font-bold">{d.totalSale.toLocaleString()} ج.م</td>
                </tr>
              ))}
              <tr className="bg-red-100 font-bold">
                <td colSpan={4} className="border border-black p-1.5">
                  إجمالي القطع المتلفة
                </td>
                <td className="border border-black p-1.5 text-red-900">{totalDamagedQty}</td>
                <td className="border border-black p-1.5">-</td>
                <td className="border border-black p-1.5 text-red-900">{grandDamagedCost.toLocaleString()} ج.م</td>
                <td className="border border-black p-1.5">-</td>
                <td className="border border-black p-1.5 text-red-900">{grandDamagedSale.toLocaleString()} ج.م</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* Official Signatures Blocks */}
      <div className="mt-8 pt-4 border-t border-neutral-400 grid grid-cols-3 gap-4 text-center text-xs">
        <div>
          <p className="font-bold">مندوب الفرع / السائق المسلم</p>
          <div className="h-12"></div>
          <p>الاسم: .......................................</p>
          <p className="mt-1">التوقيع: .....................................</p>
        </div>

        <div>
          <p className="font-bold">أمين المخزن المستلم</p>
          <div className="h-12"></div>
          <p>الاسم: {keeper !== '-' ? keeper : '.......................................'}</p>
          <p className="mt-1">التوقيع: .....................................</p>
        </div>

        <div>
          <p className="font-bold">إدارة المبيعات والمراجعة (SO MUCH)</p>
          <div className="h-12"></div>
          <p>الاسم: .......................................</p>
          <p className="mt-1">الاعتماد: .....................................</p>
        </div>
      </div>
    </div>
  );
};
