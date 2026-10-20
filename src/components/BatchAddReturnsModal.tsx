import React, { useState } from 'react';
import { X, Plus, Trash2, CheckCircle2, Sparkles, Building2, FileText, Layers, AlertCircle } from 'lucide-react';
import { DedicatedReturnItem, ReturnConditionType, ReturnItem } from '../types';

interface BatchAddReturnsModalProps {
  onClose: () => void;
  onSaveBatch: (items: DedicatedReturnItem[], branch: string, returnNo: string) => void;
  masterCatalog: Record<string, ReturnItem>;
  existingBranches: string[];
}

interface BatchRow {
  id: string;
  code: string;
  itemName: string;
  category: string;
  qty: number;
  costPrice: number;
  sellingPrice: number;
  condition: ReturnConditionType;
  notes: string;
}

export const BatchAddReturnsModal: React.FC<BatchAddReturnsModalProps> = ({
  onClose,
  onSaveBatch,
  masterCatalog,
  existingBranches,
}) => {
  const [branch, setBranch] = useState<string>(existingBranches[0] || 'فرع المعادي');
  const [returnNo, setReturnNo] = useState<string>(`RTN-${Math.floor(1000 + Math.random() * 9000)}`);
  const [rows, setRows] = useState<BatchRow[]>([
    {
      id: '1',
      code: '',
      itemName: '',
      category: 'عام',
      qty: 1,
      costPrice: 0,
      sellingPrice: 0,
      condition: 'sound',
      notes: '',
    },
    {
      id: '2',
      code: '',
      itemName: '',
      category: 'عام',
      qty: 1,
      costPrice: 0,
      sellingPrice: 0,
      condition: 'sound',
      notes: '',
    },
    {
      id: '3',
      code: '',
      itemName: '',
      category: 'عام',
      qty: 1,
      costPrice: 0,
      sellingPrice: 0,
      condition: 'sound',
      notes: '',
    },
  ]);

  const [bulkText, setBulkText] = useState('');
  const [showBulkPaste, setShowBulkPaste] = useState(false);

  // Add a blank row
  const handleAddRow = () => {
    setRows((prev) => [
      ...prev,
      {
        id: String(Date.now() + Math.random()),
        code: '',
        itemName: '',
        category: 'عام',
        qty: 1,
        costPrice: 0,
        sellingPrice: 0,
        condition: 'sound',
        notes: '',
      },
    ]);
  };

  // Add 5 blank rows
  const handleAdd5Rows = () => {
    const newRows: BatchRow[] = Array.from({ length: 5 }, (_, i) => ({
      id: String(Date.now() + i),
      code: '',
      itemName: '',
      category: 'عام',
      qty: 1,
      costPrice: 0,
      sellingPrice: 0,
      condition: 'sound',
      notes: '',
    }));
    setRows((prev) => [...prev, ...newRows]);
  };

  // Update a row with auto catalog lookup
  const handleUpdateRow = (id: string, field: keyof BatchRow, value: any) => {
    setRows((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;
        const updated = { ...r, [field]: value };

        // When code is changed, check if exists in masterCatalog
        if (field === 'code') {
          const trimmed = String(value).trim().toUpperCase();
          const match = masterCatalog[trimmed];
          if (match) {
            updated.itemName = match.itemName || updated.itemName;
            updated.category = match.category || updated.category;
            updated.sellingPrice = match.price || updated.sellingPrice;
            updated.costPrice = match.cost || updated.costPrice || Math.round(match.price * 0.65);
          }
        }
        return updated;
      })
    );
  };

  const handleRemoveRow = (id: string) => {
    if (rows.length <= 1) return;
    setRows((prev) => prev.filter((r) => r.id !== id));
  };

  // Process bulk paste (one barcode per line or barcode,qty)
  const handleProcessBulkPaste = () => {
    if (!bulkText.trim()) return;
    const lines = bulkText.split('\n');
    const newItems: BatchRow[] = [];

    lines.forEach((line) => {
      const parts = line.split(/[,\t ]+/).map((p) => p.trim()).filter(Boolean);
      if (parts.length === 0) return;

      const code = parts[0].toUpperCase();
      const qty = parseInt(parts[1], 10) || 1;
      const match = masterCatalog[code];

      newItems.push({
        id: String(Date.now() + Math.random()),
        code,
        itemName: match ? match.itemName : `صنف ${code}`,
        category: match ? match.category : 'عام',
        qty: Math.max(1, qty),
        costPrice: match ? (match.cost || Math.round(match.price * 0.65)) : 0,
        sellingPrice: match ? match.price : 0,
        condition: 'sound',
        notes: '',
      });
    });

    if (newItems.length > 0) {
      setRows((prev) => [...prev.filter((r) => r.code.trim() !== ''), ...newItems]);
      setBulkText('');
      setShowBulkPaste(false);
    }
  };

  const handleSave = () => {
    const validRows = rows.filter((r) => r.code.trim() !== '');
    if (validRows.length === 0) {
      alert('يرجى إدخال كود صنف واحد على الأقل في الجدول!');
      return;
    }

    const branchClean = branch.trim() || 'فرع المعادي';
    const returnNoClean = returnNo.trim() || `RTN-${Date.now().toString().slice(-4)}`;
    const now = Date.now();
    const dateStr = new Date().toISOString().slice(0, 10);

    const formattedItems: DedicatedReturnItem[] = validRows.map((r, i) => {
      const qty = Math.max(1, Number(r.qty) || 1);
      const cost = Math.max(0, Number(r.costPrice) || 0);
      const price = Math.max(0, Number(r.sellingPrice) || 0);

      return {
        id: `ret-${now}-${i}`,
        code: r.code.trim().toUpperCase(),
        itemName: r.itemName.trim() || `صنف #${r.code.trim()}`,
        category: r.category.trim() || 'عام',
        qty,
        costPrice: cost,
        sellingPrice: price,
        totalCost: cost * qty,
        totalSelling: price * qty,
        condition: r.condition,
        branch: branchClean,
        returnNo: returnNoClean,
        date: dateStr,
        notes: r.notes.trim(),
        timestamp: now + i,
      };
    });

    onSaveBatch(formattedItems, branchClean, returnNoClean);
    onClose();
  };

  // Totals of valid rows
  const validRows = rows.filter((r) => r.code.trim() !== '');
  const totalQty = validRows.reduce((sum, r) => sum + (Number(r.qty) || 0), 0);
  const totalCost = validRows.reduce((sum, r) => sum + (Number(r.costPrice) || 0) * (Number(r.qty) || 0), 0);
  const totalSale = validRows.reduce((sum, r) => sum + (Number(r.sellingPrice) || 0) * (Number(r.qty) || 0), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto animate-fadeIn">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-5xl w-full p-4 sm:p-6 my-auto text-right rtl:text-right ltr:text-left flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 mb-4 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black shadow-xs">
              <Layers className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-black text-slate-900 text-base sm:text-lg">
                إضافة مرتجعات متعددة دفعة واحدة (بالتكلفة والبيع)
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                إدخال سريع لمجموعة أصناف مرتجعة لنفس الفرع ورقم المردود مع تحديد سعر التكلفة والبيع
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Slip Branch & Return No Meta */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 mb-4 grid grid-cols-1 sm:grid-cols-2 gap-3 flex-shrink-0">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-indigo-600" />
              <span>اسم الفرع الراسل للمرتجع:</span>
            </label>
            <input
              type="text"
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
              placeholder="مثال: فرع المعادي بلس، فرع سيتي ستارز"
              className="w-full text-xs font-semibold py-2 px-3 bg-white border border-slate-200 rounded-lg focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-indigo-600" />
              <span>رقم المردود / إذن المرتجع:</span>
            </label>
            <input
              type="text"
              value={returnNo}
              onChange={(e) => setReturnNo(e.target.value)}
              placeholder="مثال: 4476 أو RTN-101"
              className="w-full text-xs font-semibold py-2 px-3 bg-white border border-slate-200 rounded-lg focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 outline-hidden font-mono"
            />
          </div>
        </div>

        {/* Bulk Paste Toggle Bar */}
        <div className="flex items-center justify-between gap-2 mb-3 flex-shrink-0">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowBulkPaste((p) => !p)}
              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 transition-all cursor-pointer inline-flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>{showBulkPaste ? 'إغلاق اللصق المجمع' : '📋 لصق قائمة باركودات مجمعة'}</span>
            </button>

            <button
              type="button"
              onClick={handleAddRow}
              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 transition-all cursor-pointer inline-flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5 text-slate-500" />
              <span>إضافة صف صنف</span>
            </button>

            <button
              type="button"
              onClick={handleAdd5Rows}
              className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 transition-all cursor-pointer"
            >
              +5 صفوف
            </button>
          </div>

          {/* Quick Metrics Bar */}
          <div className="flex items-center gap-3 text-xs font-bold bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
            <span>القطع: <b className="text-slate-900">{totalQty}</b></span>
            <span>التكلفة: <b className="text-indigo-700">{Math.round(totalCost).toLocaleString()} ج.م</b></span>
            <span>البيع: <b className="text-emerald-700">{Math.round(totalSale).toLocaleString()} ج.م</b></span>
          </div>
        </div>

        {/* Bulk Paste Panel */}
        {showBulkPaste && (
          <div className="bg-indigo-50/70 border border-indigo-200 rounded-xl p-3 mb-3 flex-shrink-0 animate-fadeIn">
            <label className="block text-xs font-bold text-indigo-950 mb-1">
              الصق الباركودات هنا (كل باركود في سطر، أو الباركود والكمية مفصولين بمسافة):
            </label>
            <textarea
              rows={3}
              value={bulkText}
              onChange={(e) => setBulkText(e.target.value)}
              placeholder="مثال:&#10;6223001234567 2&#10;A7713 1&#10;E4091 5"
              className="w-full text-xs font-mono p-2.5 bg-white border border-indigo-200 rounded-lg outline-hidden focus:ring-2 focus:ring-indigo-200"
            />
            <div className="flex justify-end gap-2 mt-2">
              <button
                type="button"
                onClick={handleProcessBulkPaste}
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all cursor-pointer"
              >
                تحويل وإضافة للأصناف
              </button>
            </div>
          </div>
        )}

        {/* Batch Spreadsheet Table (Scrollable) */}
        <div className="flex-1 overflow-y-auto border border-slate-200 rounded-xl min-h-[220px]">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-100 sticky top-0 z-10 border-b border-slate-200 font-bold text-slate-700">
              <tr>
                <th className="p-2 w-8 text-center">م</th>
                <th className="p-2 w-32">الباركود / الكود *</th>
                <th className="p-2">اسم الصنف</th>
                <th className="p-2 w-24">التصنيف</th>
                <th className="p-2 w-16 text-center">الكمية</th>
                <th className="p-2 w-24 text-center">سعر التكلفة</th>
                <th className="p-2 w-24 text-center">سعر البيع</th>
                <th className="p-2 w-28">الحالة</th>
                <th className="p-2 w-28">ملاحظات</th>
                <th className="p-2 w-10 text-center">حذف</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((row, index) => (
                <tr key={row.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="p-2 text-center text-slate-400 font-bold">{index + 1}</td>
                  <td className="p-1.5">
                    <input
                      type="text"
                      value={row.code}
                      onChange={(e) => handleUpdateRow(row.id, 'code', e.target.value)}
                      placeholder="الكود"
                      className="w-full font-mono text-xs font-bold py-1 px-2 border border-slate-200 rounded focus:border-indigo-600 outline-hidden"
                    />
                  </td>
                  <td className="p-1.5">
                    <input
                      type="text"
                      value={row.itemName}
                      onChange={(e) => handleUpdateRow(row.id, 'itemName', e.target.value)}
                      placeholder="اسم الصنف"
                      className="w-full text-xs font-semibold py-1 px-2 border border-slate-200 rounded focus:border-indigo-600 outline-hidden"
                    />
                  </td>
                  <td className="p-1.5">
                    <input
                      type="text"
                      value={row.category}
                      onChange={(e) => handleUpdateRow(row.id, 'category', e.target.value)}
                      placeholder="التصنيف"
                      className="w-full text-xs py-1 px-2 border border-slate-200 rounded focus:border-indigo-600 outline-hidden"
                    />
                  </td>
                  <td className="p-1.5">
                    <input
                      type="number"
                      min={1}
                      max={999}
                      value={row.qty}
                      onChange={(e) => handleUpdateRow(row.id, 'qty', parseInt(e.target.value, 10) || 1)}
                      className="w-full text-center text-xs font-black py-1 px-1 border border-slate-200 rounded focus:border-indigo-600 outline-hidden"
                    />
                  </td>
                  <td className="p-1.5">
                    <input
                      type="number"
                      min={0}
                      step="any"
                      value={row.costPrice}
                      onChange={(e) => handleUpdateRow(row.id, 'costPrice', parseFloat(e.target.value) || 0)}
                      placeholder="التكلفة"
                      className="w-full text-center text-xs font-bold py-1 px-1 border border-slate-200 rounded focus:border-indigo-600 outline-hidden text-indigo-700 bg-indigo-50/30"
                    />
                  </td>
                  <td className="p-1.5">
                    <input
                      type="number"
                      min={0}
                      step="any"
                      value={row.sellingPrice}
                      onChange={(e) => handleUpdateRow(row.id, 'sellingPrice', parseFloat(e.target.value) || 0)}
                      placeholder="البيع"
                      className="w-full text-center text-xs font-bold py-1 px-1 border border-slate-200 rounded focus:border-indigo-600 outline-hidden text-emerald-700 bg-emerald-50/30"
                    />
                  </td>
                  <td className="p-1.5">
                    <select
                      value={row.condition}
                      onChange={(e) => handleUpdateRow(row.id, 'condition', e.target.value as ReturnConditionType)}
                      className="w-full text-xs font-semibold py-1 px-1 border border-slate-200 rounded focus:border-indigo-600 outline-hidden cursor-pointer"
                    >
                      <option value="sound">🟢 سليم</option>
                      <option value="damaged">🔴 تالف / كسر</option>
                      <option value="defect">🟠 عيب صناعة</option>
                    </select>
                  </td>
                  <td className="p-1.5">
                    <input
                      type="text"
                      value={row.notes}
                      onChange={(e) => handleUpdateRow(row.id, 'notes', e.target.value)}
                      placeholder="ملاحظة"
                      className="w-full text-xs py-1 px-1.5 border border-slate-200 rounded focus:border-indigo-600 outline-hidden"
                    />
                  </td>
                  <td className="p-1.5 text-center">
                    <button
                      type="button"
                      onClick={() => handleRemoveRow(row.id)}
                      disabled={rows.length <= 1}
                      className="p-1 rounded text-slate-300 hover:text-rose-600 transition-colors cursor-pointer disabled:opacity-20"
                    >
                      <Trash2 className="w-3.5 h-3.5 mx-auto" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Modal Actions Footer */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3 mt-3 flex-shrink-0">
          <div className="text-xs text-slate-500 font-medium">
            عدد الأصناف الجاهزة للإضافة: <b className="text-slate-900">{validRows.length}</b> صنف
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all cursor-pointer"
            >
              إلغاء
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-6 py-2.5 rounded-xl text-xs font-extrabold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>اعتماد وإضافة كافة المرتجعات ({validRows.length})</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
