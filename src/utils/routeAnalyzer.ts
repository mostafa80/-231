import { RouteInfo } from '../types';

export function analyzeTransferRoute(branch: string = '', notes: string = ''): RouteInfo {
  const notesClean = (notes || '').trim();
  const isTransfer = /تحويل|مباشر|اونلاين|نقل|من فرع/i.test(notesClean);
  const isDamaged = /توالف|تالف|منتهي الصلاحية|تستر|عيوب صناعة|كسر|مرتجع تالف/i.test(notesClean);

  let dest = 'المكتب / المخزن الرئيسي';
  let routeType = 'مرتجع مخزن';

  if (isTransfer) {
    routeType = 'تحويل بين الفروع';
    if (/للمعادي|للمعادى|المعادي|المعادى/i.test(notesClean)) dest = 'فرع المعادي';
    else if (/حدايق الاهرام|حدائق الاهرام|الاهرام/i.test(notesClean)) dest = 'فرع حدائق الأهرام';
    else if (/مدينتي|مدينتى/i.test(notesClean)) dest = 'فرع مدينتي';
    else if (/جنينة|مول جنينة/i.test(notesClean)) dest = 'فرع جنينة مول';
    else if (/سيتى ستارز|سيتي ستارز|ستارز/i.test(notesClean)) dest = 'فرع سيتي ستارز';
    else if (/احمد اونلاين|اونلاين|online/i.test(notesClean)) dest = 'مبيعات أونلاين (أحمد)';
    else if (/المكتب|المخزن/i.test(notesClean)) {
      dest = 'المكتب / المخزن الرئيسي';
      routeType = 'مرتجع مخزن';
    }
  }

  return {
    isTransfer,
    isDamaged,
    routeType,
    fromBranch: branch || 'غير محدد',
    toBranch: dest,
    notes: notesClean,
  };
}
