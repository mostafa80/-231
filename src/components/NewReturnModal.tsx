import React, { useState } from 'react';
import { X, PlusCircle } from 'lucide-react';
import { ReturnMeta, Language } from '../types';

interface NewReturnModalProps {
  onAdd: (meta: ReturnMeta) => void;
  onClose: () => void;
  lang: Language;
}

export const NewReturnModal: React.FC<NewReturnModalProps> = ({ onAdd, onClose, lang }) => {
  const [branch, setBranch] = useState('');
  const [returnNo, setReturnNo] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [keeper, setKeeper] = useState('');
  const [notes, setNotes] = useState('');

  const isAr = lang === 'ar';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!branch.trim()) return;

    onAdd({
      branch: branch.trim(),
      returnNo: returnNo.trim() || `RTN-${Date.now().toString().slice(-4)}`,
      date: date || new Date().toISOString().slice(0, 10),
      keeper: keeper.trim() || 'أمين المخزن',
      notes: notes.trim(),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-5 text-right rtl:text-right ltr:text-left">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <h3 className="font-extrabold text-slate-900 text-sm">
            {isAr ? 'إنشاء إذن مرتجع / تحويل يدوي جديد' : 'Create Custom Return / Transfer Slip'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {isAr ? 'اسم الفرع الراسل *:' : 'Branch Name *:'}
            </label>
            <input
              type="text"
              required
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
              placeholder={isAr ? 'مثال: فرع سيتي ستارز - ملابس' : 'e.g. Citystars Branch'}
              className="w-full text-xs font-semibold py-2 px-3 border border-slate-200 rounded-xl focus:border-red-600 focus:ring-2 focus:ring-red-100 outline-hidden"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {isAr ? 'رقم الإذن:' : 'Slip No:'}
              </label>
              <input
                type="text"
                value={returnNo}
                onChange={(e) => setReturnNo(e.target.value)}
                placeholder="4476"
                className="w-full text-xs font-semibold py-2 px-3 border border-slate-200 rounded-xl focus:border-red-600 focus:ring-2 focus:ring-red-100 outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {isAr ? 'تاريخ الإذن:' : 'Date:'}
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full text-xs font-semibold py-2 px-3 border border-slate-200 rounded-xl focus:border-red-600 focus:ring-2 focus:ring-red-100 outline-hidden"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {isAr ? 'أمين المخزن المستلم:' : 'Receiving Keeper:'}
            </label>
            <input
              type="text"
              value={keeper}
              onChange={(e) => setKeeper(e.target.value)}
              placeholder={isAr ? 'مثال: محمد السيد' : 'Keeper name'}
              className="w-full text-xs font-semibold py-2 px-3 border border-slate-200 rounded-xl focus:border-red-600 focus:ring-2 focus:ring-red-100 outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {isAr ? 'ملاحظات الحركة والمسار:' : 'Transfer & Route Notes:'}
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={isAr ? 'مثال: تحويل مباشر لفرع مدينتي أو مرتجع للمكتب الرئيسي' : 'e.g. Transfer to Madinaty'}
              className="w-full text-xs font-semibold py-2 px-3 border border-slate-200 rounded-xl focus:border-red-600 focus:ring-2 focus:ring-red-100 outline-hidden"
            />
          </div>

          <div className="pt-2 flex items-center gap-2">
            <button
              type="submit"
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl font-extrabold text-xs bg-red-600 hover:bg-red-700 text-white shadow-xs cursor-pointer active:scale-95 transition-all"
            >
              <PlusCircle className="w-4 h-4" />
              <span>{isAr ? 'إنشاء وبدء الاستلام' : 'Create & Open Tab'}</span>
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
