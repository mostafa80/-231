import React, { useState } from 'react';
import { X, Check } from 'lucide-react';
import { JardItem, Language } from '../types';

interface EditModalProps {
  item: JardItem | null;
  onSave: (code: string, soundQty: number, damagedQty: number) => void;
  onClose: () => void;
  lang: Language;
}

export const EditModal: React.FC<EditModalProps> = ({ item, onSave, onClose, lang }) => {
  const [sound, setSound] = useState(item?.soundQty ?? 0);
  const [damaged, setDamaged] = useState(item?.damagedQty ?? 0);

  const isAr = lang === 'ar';

  if (!item) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(item.code, Math.max(0, sound), Math.max(0, damaged));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-sm w-full p-5 text-right rtl:text-right ltr:text-left">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <h3 className="font-extrabold text-slate-900 text-sm">
            {isAr ? 'تعديل كميات استلام الصنف' : 'Edit Item Counts'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="mb-4 bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs">
          <div className="font-bold text-slate-900">{item.itemName}</div>
          <div className="text-slate-500 font-mono mt-0.5">{item.code}</div>
          <div className="text-slate-600 font-semibold mt-1">
            {isAr ? `الكمية المقيدة بالإذن: ${item.systemQty}` : `Invoice Expected: ${item.systemQty}`}
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-600 mt-1.5 border-t border-slate-200/60 pt-1">
            <span>{isAr ? 'سعر التكلفة:' : 'Cost:'} <b className="text-emerald-700">{item.cost ?? 0} ج.م</b></span>
            <span>{isAr ? 'سعر البيع:' : 'Sale:'} <b className="text-sky-700">{item.price ?? 0} ج.م</b></span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-emerald-800 mb-1">
              {isAr ? 'الكمية المستلمة سليمة ✅:' : 'Sound Received ✅:'}
            </label>
            <input
              type="number"
              min="0"
              value={sound}
              onChange={(e) => setSound(parseInt(e.target.value) || 0)}
              className="w-full text-sm font-bold text-center py-2 border border-slate-200 rounded-xl focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-rose-800 mb-1">
              {isAr ? 'الكمية المستلمة متلفة / تالفة ⚠️:' : 'Damaged / Defect Received ⚠️:'}
            </label>
            <input
              type="number"
              min="0"
              value={damaged}
              onChange={(e) => setDamaged(parseInt(e.target.value) || 0)}
              className="w-full text-sm font-bold text-center py-2 border border-slate-200 rounded-xl focus:border-rose-600 focus:ring-2 focus:ring-rose-100 outline-hidden"
            />
          </div>

          <div className="pt-2 flex items-center gap-2">
            <button
              type="submit"
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl font-extrabold text-xs bg-red-600 hover:bg-red-700 text-white shadow-xs cursor-pointer active:scale-95 transition-all"
            >
              <Check className="w-4 h-4" />
              <span>{isAr ? 'حفظ التعديل' : 'Save Changes'}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl font-bold text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer transition-all"
            >
              {isAr ? 'إلغاء' : 'Cancel'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
