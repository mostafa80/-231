import * as XLSX from 'xlsx';
import { DedicatedReturnItem, DedicatedReturnSlip } from '../types';

export function exportReturnsToExcel(
  items: DedicatedReturnItem[],
  activeSlip?: DedicatedReturnSlip | null,
  allSlips?: DedicatedReturnSlip[]
): void {
  if (!items || items.length === 0) {
    throw new Error('لا توجد أصناف مرتجعة لتصديرها');
  }

  const wb = XLSX.utils.book_new();

  const branchName = activeSlip?.branch || (items[0]?.branch ? items[0].branch : 'مجمع_الفروع');
  const returnNo = activeSlip?.slipNo || (items[0]?.returnNo ? items[0].returnNo : 'متعدد');
  const dateStr = activeSlip?.date || new Date().toISOString().slice(0, 10);
  const keeper = activeSlip?.keeper || 'أمين المخزن المستلم';

  // Financial Totals
  const totalQty = items.reduce((sum, it) => sum + (it.qty || 0), 0);
  const totalCost = items.reduce((sum, it) => sum + (it.totalCost || 0), 0);
  const totalSelling = items.reduce((sum, it) => sum + (it.totalSelling || 0), 0);
  const totalProfitDiff = totalSelling - totalCost;

  const totalSound = items.filter((it) => it.condition === 'sound').reduce((sum, it) => sum + it.qty, 0);
  const totalDamaged = items.filter((it) => it.condition === 'damaged').reduce((sum, it) => sum + it.qty, 0);
  const totalDefect = items.filter((it) => it.condition === 'defect').reduce((sum, it) => sum + it.qty, 0);

  // Headers
  const sheet1Headers = [
    'م',
    'باركود الصنف',
    'اسم الصنف',
    'التصنيف',
    'الفرع الراسل',
    'رقم المردود',
    'حالة الصنف',
    'الكمية المرتجعة',
    'سعر التكلفة (ج.م)',
    'إجمالي التكلفة (ج.م)',
    'سعر البيع (ج.م)',
    'إجمالي البيع (ج.م)',
    'الفارق (البيع - التكلفة)',
    'ملاحظات الفحص',
  ];

  const sheet1Data: (string | number)[][] = [
    ['🦅 شركة SO MUCH | محضر استلام ومطابقة مردودات الفروع للمخزن'],
    [`🏢 الفرع: ${branchName}`, `🔢 رقم المردود: ${returnNo}`, `📅 التاريخ: ${dateStr}`],
    [`👤 أمين المخزن: ${keeper}`, `📦 إجمالي القطع: ${totalQty} قطعة`, `🏷️ عدد البنود: ${items.length} صنف`],
    [''],
    [
      `💰 إجمالي التكلفة: ${Math.round(totalCost).toLocaleString()} ج.م`,
      `💵 إجمالي البيع: ${Math.round(totalSelling).toLocaleString()} ج.م`,
      `📊 الفارق المالي: ${Math.round(totalProfitDiff).toLocaleString()} ج.م`,
      `🟢 سليم: ${totalSound} | 🔴 تالف: ${totalDamaged} | 🟠 عيب صناعة: ${totalDefect}`,
    ],
    [''],
    sheet1Headers,
  ];

  items.forEach((it, idx) => {
    const condLabel =
      it.condition === 'sound' ? 'سليم' : it.condition === 'damaged' ? 'تالف / كسر' : 'عيب صناعة';
    const profitDiff = (it.totalSelling || 0) - (it.totalCost || 0);

    sheet1Data.push([
      idx + 1,
      it.code,
      it.itemName,
      it.category || 'عام',
      it.branch || branchName,
      it.returnNo || returnNo,
      condLabel,
      it.qty,
      it.costPrice,
      Math.round(it.totalCost * 100) / 100,
      it.sellingPrice,
      Math.round(it.totalSelling * 100) / 100,
      Math.round(profitDiff * 100) / 100,
      it.notes || '-',
    ]);
  });

  // Total summary row
  sheet1Data.push([
    'الإجمالي',
    '-',
    '-',
    '-',
    '-',
    '-',
    '-',
    totalQty,
    '-',
    Math.round(totalCost * 100) / 100,
    '-',
    Math.round(totalSelling * 100) / 100,
    Math.round(totalProfitDiff * 100) / 100,
    '-',
  ]);

  sheet1Data.push(['']);
  sheet1Data.push([
    'توقيع أمين المخزن المستلم: ..........................',
    '',
    'توقيع قسم المراجعة والتدقيق: ..........................',
    '',
    'توقيع مندوب الفرع المسلم: ..........................',
  ]);

  const ws1 = XLSX.utils.aoa_to_sheet(sheet1Data);

  ws1['!cols'] = [
    { wch: 6 },
    { wch: 18 },
    { wch: 35 },
    { wch: 16 },
    { wch: 18 },
    { wch: 14 },
    { wch: 14 },
    { wch: 14 },
    { wch: 16 },
    { wch: 18 },
    { wch: 16 },
    { wch: 18 },
    { wch: 20 },
    { wch: 25 },
  ];

  XLSX.utils.book_append_sheet(wb, ws1, 'كشف_المرتجعات_التفصيلي');

  // Sheet 2: Summary by branch / return slips if multiple exist
  if (allSlips && allSlips.length > 0) {
    const sheet2Headers = [
      'م',
      'رقم المردود',
      'اسم الفرع',
      'التاريخ',
      'المستلم',
      'عدد البنود',
      'إجمالي القطع',
      'إجمالي التكلفة (ج.م)',
      'إجمالي البيع (ج.م)',
      'الفارق المالي (ج.م)',
    ];

    const sheet2Data: (string | number)[][] = [
      ['ملخص أذونات المردودات المستلمة'],
      [''],
      sheet2Headers,
    ];

    allSlips.forEach((s, i) => {
      const slipQty = s.items.reduce((sum, it) => sum + (it.qty || 0), 0);
      const slipCost = s.items.reduce((sum, it) => sum + (it.totalCost || 0), 0);
      const slipSale = s.items.reduce((sum, it) => sum + (it.totalSelling || 0), 0);
      sheet2Data.push([
        i + 1,
        s.slipNo,
        s.branch,
        s.date,
        s.keeper,
        s.items.length,
        slipQty,
        Math.round(slipCost),
        Math.round(slipSale),
        Math.round(slipSale - slipCost),
      ]);
    });

    const ws2 = XLSX.utils.aoa_to_sheet(sheet2Data);
    ws2['!cols'] = [
      { wch: 6 },
      { wch: 16 },
      { wch: 22 },
      { wch: 14 },
      { wch: 18 },
      { wch: 12 },
      { wch: 14 },
      { wch: 18 },
      { wch: 18 },
      { wch: 18 },
    ];
    XLSX.utils.book_append_sheet(wb, ws2, 'ملخص_الأذونات');
  }

  const cleanBranch = branchName.replace(/[\\/:?*[\]]/g, '_').trim();
  const fileReturnNo = returnNo ? `_مردود_${returnNo}` : '';
  const fileName = `مرتجعات_${cleanBranch}${fileReturnNo}_${dateStr}.xlsx`;

  XLSX.writeFile(wb, fileName);
}

/**
 * Generates and downloads a clean sample Master Sheet Excel file (شيت مستر)
 * with cost price and selling price.
 */
export function downloadMasterCatalogTemplate(): void {
  const wb = XLSX.utils.book_new();

  const headers = [
    'باركود الصنف',
    'اسم الصنف',
    'سعر التكلفة',
    'سعر البيع',
    'التصنيف الرئيسي',
    'التصنيف الفرعي',
  ];

  const sampleRows: (string | number)[][] = [
    headers,
    ['6223012631039', 'شان كريم يد بزبدة الشيا 60جم', 65, 100, 'عناية بالبشرة', 'كريمات'],
    ['4902470171036', 'موس حواجب فلامنجو', 170, 265, 'مستحضرات تجميل', 'شفرات'],
    ['6974712244134', '203ay88 اظافر', 85, 135, 'اكسسوارات', 'أظافر'],
    ['6224001455247', 'capixy lash serum 10ml', 360, 550, 'سيرم شعر', 'عناية'],
    ['A7713', 'مستورد روج25', 16, 25, 'مكياج', 'روج'],
    ['E4091', 'ميدالية 155', 95, 155, 'اكسسوارات', 'ميداليات'],
    ['3014260262709', 'جيليت سموت 4 شفرات', 310, 475, 'شفرات', 'جيليت'],
    ['6221155114938', 'اكس اسبراي جولد 150مل', 115, 180, 'رجالي', 'اسبراي'],
    ['4059729371652', 'ess. 8h matte liquid lipstick 01', 145, 225, 'مكياج', 'روج مط'],
  ];

  const ws = XLSX.utils.aoa_to_sheet(sampleRows);
  ws['!cols'] = [
    { wch: 18 },
    { wch: 38 },
    { wch: 14 },
    { wch: 14 },
    { wch: 18 },
    { wch: 16 },
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'الأصناف_والأسعار');
  XLSX.writeFile(wb, 'نموذج_شيت_الماستر_العام_للأصناف.xlsx');
}

/**
 * Generates and downloads a clean sample Consolidated Multi-Branch Returns Excel file
 * (شيت مجمع فيه كل المردودات لكذا فرع)
 */
export function downloadConsolidatedReturnsTemplate(): void {
  const wb = XLSX.utils.book_new();

  const headers = [
    'الفرع',
    'رقم المردود',
    'التاريخ',
    'باركود الصنف',
    'اسم الصنف',
    'الكمية',
    'سعر التكلفة',
    'سعر البيع',
    'حالة الصنف',
    'ملاحظات',
    'أمين المخزن المستلم',
  ];

  const today = new Date().toISOString().slice(0, 10);

  const sampleRows: (string | number)[][] = [
    headers,
    // Branch 1: فرع المعادي بلس
    ['فرع المعادي بلس', '4476', today, '6223012631039', 'شان كريم يد بزبدة الشيا 60جم', 12, 65, 100, 'سليم', 'مرتجع فائض مخزون', 'محمد مصطفى'],
    ['فرع المعادي بلس', '4476', today, '4902470171036', 'موس حواجب فلامنجو', 5, 170, 265, 'سليم', 'سليم وجاهز للتسكين', 'محمد مصطفى'],
    ['فرع المعادي بلس', '4476', today, 'A7713', 'مستورد روج25', 8, 16, 25, 'سليم', 'جاهز لإعادة الصرف', 'محمد مصطفى'],
    ['فرع المعادي بلس', '4476', today, 'E4091', 'ميدالية 155', 2, 95, 155, 'تالف', 'كسر في العلبة', 'محمد مصطفى'],

    // Branch 2: فرع مدينة نصر
    ['فرع مدينة نصر', '5120', today, '6974712244134', '203ay88 اظافر', 15, 85, 135, 'سليم', 'مرتجع دوري شهري', 'أحمد سامي'],
    ['فرع مدينة نصر', '5120', today, '6224001455247', 'capixy lash serum 10ml', 4, 360, 550, 'سليم', 'سليم', 'أحمد سامي'],
    ['فرع مدينة نصر', '5120', today, '3014260262709', 'جيليت سموت 4 شفرات', 3, 310, 475, 'عيب صناعة', 'عيب تغليف مصنع', 'أحمد سامي'],

    // Branch 3: فرع المهندسين
    ['فرع المهندسين', '6890', today, '6221155114938', 'اكس اسبراي جولد 150مل', 10, 115, 180, 'سليم', 'مرتجع نقل فرع', 'كريم عادل'],
    ['فرع المهندسين', '6890', today, '4059729371652', 'ess. 8h matte liquid lipstick 01', 6, 145, 225, 'سليم', 'سليم', 'كريم عادل'],
    ['فرع المهندسين', '6890', today, 'A7713', 'مستورد روج25', 4, 16, 25, 'تالف', 'تالف بالشحن', 'كريم عادل'],
  ];

  const ws = XLSX.utils.aoa_to_sheet(sampleRows);
  ws['!cols'] = [
    { wch: 18 },
    { wch: 14 },
    { wch: 14 },
    { wch: 18 },
    { wch: 35 },
    { wch: 10 },
    { wch: 14 },
    { wch: 14 },
    { wch: 14 },
    { wch: 22 },
    { wch: 20 },
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'مردودات_الفروع_المجمعة');
  XLSX.writeFile(wb, 'نموذج_شيت_المردودات_المجمع_لكافة_الفروع.xlsx');
}

