import * as XLSX from 'xlsx';
import { Session } from '../types';

export function smartExport(sess: Session): void {
  if (!sess || Object.keys(sess.inventoryMap).length === 0) {
    throw new Error('لا توجد بيانات لتصديرها في هذا الإذن');
  }

  const items = Object.values(sess.inventoryMap);
  const r = sess.routeInfo;

  const sortedItems = [...items].sort((a, b) => {
    const catA = (a.category || '').localeCompare(b.category || '', 'ar');
    if (catA !== 0) return catA;
    const subA = (a.subcat || '').localeCompare(b.subcat || '', 'ar');
    if (subA !== 0) return subA;
    return (a.itemName || '').localeCompare(b.itemName || '', 'ar');
  });

  const branchName = sess.returnMeta.branch || 'فرع_عام';
  const returnNoStr = sess.returnMeta.returnNo || '-';
  const returnDateStr = sess.returnMeta.date || new Date().toISOString().slice(0, 10);
  const keeperStr = sess.returnMeta.keeper || '-';

  // Calculate stats based purely on Selling Price (بدون سعر التكلفة)
  let totalShortagePieces = 0;
  let totalShortageSaleValue = 0;

  let totalSurplusPieces = 0;
  let totalSurplusSaleValue = 0;

  let grandTotalDamagedPieces = 0;
  let grandTotalDamagedSaleValue = 0;

  const shortageItemsList: {
    code: string;
    itemName: string;
    category: string;
    systemQty: number;
    countedQty: number;
    soundQty: number;
    damagedQty: number;
    shortageQty: number;
    price: number;
    totalShortageValue: number;
  }[] = [];

  const surplusItemsList: {
    code: string;
    itemName: string;
    category: string;
    systemQty: number;
    countedQty: number;
    soundQty: number;
    damagedQty: number;
    surplusQty: number;
    price: number;
    totalSurplusValue: number;
  }[] = [];

  const damagedItemsList: {
    code: string;
    itemName: string;
    category: string;
    damagedQty: number;
    price: number;
    totalSale: number;
  }[] = [];

  sortedItems.forEach((it) => {
    const key = it.code.toUpperCase();
    const j = sess.jardData[key];
    const sound = j ? j.soundQty : 0;
    const damaged = j ? j.damagedQty : 0;
    const recQty = sound + damaged;
    const diff = recQty - it.systemQty;
    const price = it.price || 0;

    if (diff < 0) {
      const shortageQty = Math.abs(diff);
      const val = Number((shortageQty * price).toFixed(2));
      totalShortagePieces += shortageQty;
      totalShortageSaleValue += val;

      shortageItemsList.push({
        code: it.code,
        itemName: it.itemName,
        category: it.fullCategory || it.category || 'عام',
        systemQty: it.systemQty,
        countedQty: recQty,
        soundQty: sound,
        damagedQty: damaged,
        shortageQty,
        price,
        totalShortageValue: val,
      });
    } else if (diff > 0) {
      const surplusQty = diff;
      const val = Number((surplusQty * price).toFixed(2));
      totalSurplusPieces += surplusQty;
      totalSurplusSaleValue += val;

      surplusItemsList.push({
        code: it.code,
        itemName: it.itemName,
        category: it.fullCategory || it.category || 'عام',
        systemQty: it.systemQty,
        countedQty: recQty,
        soundQty: sound,
        damagedQty: damaged,
        surplusQty,
        price,
        totalSurplusValue: val,
      });
    }

    if (damaged > 0) {
      grandTotalDamagedPieces += damaged;
      const dmgSale = Number((damaged * price).toFixed(2));
      grandTotalDamagedSaleValue += dmgSale;

      damagedItemsList.push({
        code: it.code,
        itemName: it.itemName,
        category: it.fullCategory || it.category || 'عام',
        damagedQty: damaged,
        price,
        totalSale: dmgSale,
      });
    }
  });

  const wb = XLSX.utils.book_new();

  // -------------------------------------------------------------
  // صفحة 1: جميع الأصناف المستلمة (كشف الاستلام الكامل بدون سعر التكلفة)
  // -------------------------------------------------------------
  const sheet1Headers = [
    'إجمالي قيمة الفرق بالبيع (ج.م)',
    'سعر البيع (ج.م)',
    'اسم الصنف',
    'المستلم سليم',
    'المستلم متلف',
    'إجمالي المستلم',
    'كمية الإذن الأصلية',
    'الفارق',
    'حالة الصنف',
    'باركود الصنف',
    'التصنيف',
    'ملاحظات الفحص',
  ];

  const sheet1Meta: (string | number)[][] = [
    ['🦅 برنامج الاستلامات للفروع | تقرير الاستلام الشامل'],
    [`🏢 الفرع الراسل: ${branchName}`, `🚚 الوجهة: ${r.toBranch}`, `🔢 رقم الإذن: ${returnNoStr}`],
    [`📅 تاريخ الإذن: ${returnDateStr}`, `👤 أمين المخزن المستلم: ${keeperStr}`, `📦 نوع الحركة: ${r.routeType}`],
    [`📝 الملاحظات: ${sess.returnMeta.notes || '-'}`],
    [''],
    [
      `🔴 إجمالي العجز المالي بالبيع: ${totalShortageSaleValue.toLocaleString()} ج.م (${totalShortagePieces} قطعة)`,
      `🟡 إجمالي الفائض بالبيع: ${totalSurplusSaleValue.toLocaleString()} ج.م (${totalSurplusPieces} قطعة)`,
      `⚠️ قطع تالفة: ${grandTotalDamagedPieces} قطعة (${grandTotalDamagedSaleValue.toLocaleString()} ج.م)`,
    ],
    [''],
    sheet1Headers,
  ];

  let grandTotalDiffSale = 0;
  let grandSound = 0;
  let grandDamaged = 0;
  let grandRec = 0;
  let grandSys = 0;
  let grandDiff = 0;

  sortedItems.forEach((it) => {
    const key = it.code.toUpperCase();
    const j = sess.jardData[key];
    const sound = j ? j.soundQty : 0;
    const damaged = j ? j.damagedQty : 0;
    const recQty = sound + damaged;
    const diff = recQty - it.systemQty;
    const price = it.price || 0;
    const diffSaleValue = Number((diff * price).toFixed(2));

    let status = 'مطابق';
    if (diff < 0) status = 'عجز';
    else if (diff > 0) status = 'فائض / زيادة';

    sheet1Meta.push([
      diffSaleValue,
      price,
      it.itemName,
      sound,
      damaged,
      recQty,
      it.systemQty,
      diff,
      status,
      it.code,
      it.fullCategory || it.category || 'عام',
      damaged > 0 ? `يحتوي على ${damaged} قطعة متلفة` : '',
    ]);

    grandTotalDiffSale += diffSaleValue;
    grandSound += sound;
    grandDamaged += damaged;
    grandRec += recQty;
    grandSys += it.systemQty;
    grandDiff += diff;
  });

  // Summary row Sheet 1
  sheet1Meta.push([
    Number(grandTotalDiffSale.toFixed(2)),
    '',
    '⭐ الإجمالي العام للإذن',
    grandSound,
    grandDamaged,
    grandRec,
    grandSys,
    grandDiff,
    grandDiff === 0 ? 'مطابق بالكامل' : grandDiff > 0 ? 'صافي زيادة' : 'صافي عجز',
    '',
    '',
    '',
  ]);

  const ws1 = XLSX.utils.aoa_to_sheet(sheet1Meta);
  ws1['!cols'] = [
    { wch: 22 },
    { wch: 14 },
    { wch: 42 },
    { wch: 14 },
    { wch: 14 },
    { wch: 16 },
    { wch: 18 },
    { wch: 12 },
    { wch: 16 },
    { wch: 22 },
    { wch: 24 },
    { wch: 26 },
  ];
  XLSX.utils.book_append_sheet(wb, ws1, 'جميع_الأصناف_المستلمة');

  // -------------------------------------------------------------
  // صفحة 2: كشف العجوزات فقط (Shortages Only)
  // -------------------------------------------------------------
  const sheet2Headers = [
    'م',
    'باركود الصنف',
    'اسم الصنف',
    'التصنيف',
    'كمية الإذن المسجلة',
    'المستلم الفعلي',
    'كمية العجز',
    'سعر البيع للقطعة (ج.م)',
    'إجمالي قيمة العجز بالبيع (ج.م)',
    'ملاحظات الفحص',
  ];

  const sheet2Data: (string | number)[][] = [
    [`🔴 برنامج الاستلامات للفروع | كشف العجوزات فقط`],
    [`🏢 الفرع: ${branchName}`, `🔢 رقم الإذن: ${returnNoStr}`, `📅 التاريخ: ${returnDateStr}`],
    [`👤 أمين المخزن: ${keeperStr}`, `إجمالي عدد بنود العجز: ${shortageItemsList.length} صنف`],
    [''],
    sheet2Headers,
  ];

  shortageItemsList.forEach((s, idx) => {
    sheet2Data.push([
      idx + 1,
      s.code,
      s.itemName,
      s.category,
      s.systemQty,
      s.countedQty,
      s.shortageQty,
      s.price,
      s.totalShortageValue,
      `عجز مقداره ${s.shortageQty} قطعة`,
    ]);
  });

  // Shortage Summary Row
  sheet2Data.push([
    'الإجمالي',
    '',
    '⭐ إجمالي العجز الكلي بالإذن',
    '',
    '',
    '',
    totalShortagePieces,
    '',
    Number(totalShortageSaleValue.toFixed(2)),
    `${shortageItemsList.length} صنف عجز`,
  ]);

  const ws2 = XLSX.utils.aoa_to_sheet(sheet2Data);
  ws2['!cols'] = [
    { wch: 6 },
    { wch: 20 },
    { wch: 42 },
    { wch: 22 },
    { wch: 18 },
    { wch: 16 },
    { wch: 16 },
    { wch: 18 },
    { wch: 24 },
    { wch: 26 },
  ];
  XLSX.utils.book_append_sheet(wb, ws2, 'العجوزات_فقط');

  // -------------------------------------------------------------
  // صفحة 3: كشف الزيادة فقط (Surpluses Only)
  // -------------------------------------------------------------
  const sheet3Headers = [
    'م',
    'باركود الصنف',
    'اسم الصنف',
    'التصنيف',
    'كمية الإذن المسجلة',
    'المستلم الفعلي',
    'كمية الزيادة (الفائض)',
    'سعر البيع للقطعة (ج.م)',
    'إجمالي قيمة الزيادة بالبيع (ج.م)',
    'ملاحظات الفحص',
  ];

  const sheet3Data: (string | number)[][] = [
    [`🟡 برنامج الاستلامات للفروع | كشف الزيادة والفائض فقط`],
    [`🏢 الفرع: ${branchName}`, `🔢 رقم الإذن: ${returnNoStr}`, `📅 التاريخ: ${returnDateStr}`],
    [`👤 أمين المخزن: ${keeperStr}`, `إجمالي عدد بنود الزيادة: ${surplusItemsList.length} صنف`],
    [''],
    sheet3Headers,
  ];

  surplusItemsList.forEach((s, idx) => {
    sheet3Data.push([
      idx + 1,
      s.code,
      s.itemName,
      s.category,
      s.systemQty,
      s.countedQty,
      s.surplusQty,
      s.price,
      s.totalSurplusValue,
      `زيادة مستلمة مقدارها ${s.surplusQty} قطعة`,
    ]);
  });

  // Surplus Summary Row
  sheet3Data.push([
    'الإجمالي',
    '',
    '⭐ إجمالي الزيادة الكلية بالإذن',
    '',
    '',
    '',
    totalSurplusPieces,
    '',
    Number(totalSurplusSaleValue.toFixed(2)),
    `${surplusItemsList.length} صنف زيادة`,
  ]);

  const ws3 = XLSX.utils.aoa_to_sheet(sheet3Data);
  ws3['!cols'] = [
    { wch: 6 },
    { wch: 20 },
    { wch: 42 },
    { wch: 22 },
    { wch: 18 },
    { wch: 16 },
    { wch: 20 },
    { wch: 18 },
    { wch: 24 },
    { wch: 26 },
  ];
  XLSX.utils.book_append_sheet(wb, ws3, 'الزيادة_فقط');

  // -------------------------------------------------------------
  // صفحة 4: كشف القطع التالفة والمتلفة (إن وجدت)
  // -------------------------------------------------------------
  if (damagedItemsList.length > 0) {
    const sheet4Headers = [
      'م',
      'باركود الصنف',
      'اسم الصنف',
      'التصنيف',
      'عدد القطع التالفة',
      'سعر البيع للقطعة (ج.م)',
      'إجمالي قيمة البيع للتالف (ج.م)',
      'الإجراء والتوجيه',
    ];

    const sheet4Data: (string | number)[][] = [
      [`⚠️ برنامج الاستلامات للفروع | كشف القطع التالفة والمتلفة`],
      [`🏢 الفرع: ${branchName}`, `🔢 رقم الإذن: ${returnNoStr}`, `📅 التاريخ: ${returnDateStr}`],
      [''],
      sheet4Headers,
    ];

    damagedItemsList.forEach((dmg, idx) => {
      sheet4Data.push([
        idx + 1,
        dmg.code,
        dmg.itemName,
        dmg.category,
        dmg.damagedQty,
        dmg.price,
        dmg.totalSale,
        'قطع معيبة / متلفة معتمدة للتكهين',
      ]);
    });

    sheet4Data.push([
      'الإجمالي',
      '',
      '⭐ إجمالي التوالف المعتمدة',
      '',
      grandTotalDamagedPieces,
      '',
      Number(grandTotalDamagedSaleValue.toFixed(2)),
      'معتمد',
    ]);

    const ws4 = XLSX.utils.aoa_to_sheet(sheet4Data);
    ws4['!cols'] = [
      { wch: 6 },
      { wch: 20 },
      { wch: 42 },
      { wch: 22 },
      { wch: 18 },
      { wch: 18 },
      { wch: 24 },
      { wch: 26 },
    ];
    XLSX.utils.book_append_sheet(wb, ws4, 'القطع_التالفة');
  }

  const cleanBranch = branchName.replace(/[\\/:?*[\]]/g, '_').trim();
  const fileReturnNo = sess.returnMeta.returnNo ? `_إذن_${sess.returnMeta.returnNo}` : '';
  const fileName = `استلامات_${cleanBranch}${fileReturnNo}_${returnDateStr}.xlsx`;

  XLSX.writeFile(wb, fileName);
}

export function downloadSampleExcelTemplate(): void {
  const sampleData: (string | number)[][] = [
    [
      'فاتوره مبيعات',
      'اسم العميل : فرع المعادي بلس',
      '',
      'رقم الفاتوره: 3,925',
      '26/10/08 12:00:00 AM',
      'التاريخ :',
      'سامح',
      'مندوب البيع',
      'رقم الصنف',
      'الاجمالي',
      'السعر',
      'الكميه',
      'أسم الصنف',
      'الباركود',
    ],
    [1, 600.0, 100.0, 6.0, 'شان كريم يد بزبدة الشيا 60جم', '6223012631039'],
    [2, 5300.0, 265.0, 20.0, 'موس حواجب فلامنجو', '4902470171036'],
    [3, 3240.0, 135.0, 24.0, '203ay88 اظافر', '6974712244134'],
    [4, 2200.0, 550.0, 4.0, 'capixy lash serum 10ml', '6224001455247'],
    [5, 630.0, 315.0, 2.0, 'شيلدم ليب ونت تتشلي', '6973474683687'],
    [6, 948.0, 79.0, 12.0, '243ay164 بودية ستان', '6791326326601'],
    [7, 560.0, 280.0, 2.0, 'شيدلم قلم حواجب شوكولاته2دوبل', '6978931640807'],
    [8, 585.0, 195.0, 3.0, 'روز جولد ايشادو 306', '6977674201603'],
    [9, 465.0, 155.0, 3.0, 'لاست لوك ايشادو 1859', '795697171859'],
    [10, 300.0, 25.0, 12.0, 'مستورد روج25', 'A7713'],
    [11, 495.0, 165.0, 3.0, 'روز جولد ايشادو 960', '6977674205960'],
    [12, 930.0, 155.0, 6.0, 'ميدالية 155', 'E4091'],
    [13, 1900.0, 475.0, 4.0, 'جيليت سموت 4 شفرات', '3014260262709'],
    [14, 2780.0, 695.0, 4.0, 'جيليت فينوس بريز 34 2*1', '7702018886364'],
    [15, 700.0, 175.0, 4.0, 'كارتيته سيرم شعر زبده الشيا 60مل', '6224010687318'],
    [16, 420.0, 105.0, 4.0, 'الوفيرا جل صبار سوفت 500مل', '6224007432242'],
    [17, 780.0, 65.0, 12.0, 'قلم كحل روز بيري 9223', '6930236309223'],
    [18, 720.0, 180.0, 4.0, 'اكس اسبراي جولد 150مل', '6221155114938'],
    [19, 720.0, 180.0, 4.0, 'اكس اسبراي دارك شوكولات 150مل', '6221155114969'],
    [20, 720.0, 180.0, 4.0, 'اكس اسبراي بلاك دايت 150مل', '6221155115089'],
    [21, 720.0, 180.0, 4.0, 'اكس اسبراي ليزر كوكيز 150مل', '6221155114983'],
    [22, 720.0, 180.0, 4.0, 'اكس اسبراي ايس تشيل 150مل', '6221155115027'],
    [23, 1125.0, 225.0, 5.0, 'ess. 8h matte liquid lipstick 01', '4059729371652'],
    [24, 470.0, 470.0, 1.0, 'شيدلم جلوس لوك اير 510', '6978931642610'],
    [25, 2700.0, 450.0, 6.0, 'SHEER UP NEW SLS-002 SO YOU', '8682536012003'],
    [26, 2700.0, 450.0, 6.0, 'SHEER UP NEW SLS-001 HARMONY', '8682536011990'],
    [27, 2700.0, 450.0, 6.0, 'SHEER UP NEW SLS-018 ENCHANTED KISS', '8682536097864'],
    [28, 2700.0, 450.0, 6.0, 'FLORMAR SHEER UP LIPSTICK 013 GAIA', '8682536012119'],
    [29, 2700.0, 450.0, 6.0, 'flormar SHEER UP NEW SLS-012 INTENSE LOVE', '8682536012102'],
    [30, 2700.0, 450.0, 6.0, 'SHEER UP NEW SLS-019 MYSTIC ROSE', '8682536097888'],
    [31, 2700.0, 450.0, 6.0, 'flormar SHEER UP NEW SLS-010 THULIAN PINK', '8682536012089'],
    [32, 2700.0, 450.0, 6.0, 'FLORMAR SHEER UP LIPSTICK 011 ROSE LUSY', '8682536012096'],
    [33, 2700.0, 450.0, 6.0, 'SHEER UP NEW SLS-022 DARING WHISPER', '8682536097949'],
    [34, 2700.0, 450.0, 6.0, 'SHEER UP NEW SLS-020 HIDDEN DESIRE', '8682536097901'],
    [35, 720.0, 120.0, 6.0, 'شان جل ملطف للجلد 60جم', '6223012630971'],
    [36, 960.0, 160.0, 6.0, 'شان نيل كير هيالورونيك 4مل', '6224010337589'],
    [37, 1360.0, 340.0, 4.0, 'كانتري كريم ليف ان 300جم', '6223012632197'],
    [38, 1280.0, 320.0, 4.0, 'ستارفيل هيالورونيك اسيد سيرم 30مل', '6224010337947'],
    [39, 1280.0, 320.0, 4.0, 'ستارفيل سيرم للوجه والرقبة فيتامين سي 30مل', '6224008073338'],
    [40, 600.0, 100.0, 6.0, 'شان مرطب للشفاه 5جم', '6224008073956'],
    [41, 600.0, 100.0, 6.0, 'شان مرطب للشفاه روز 5جم', '6223012631121'],
    [42, 600.0, 100.0, 6.0, 'شان مرطب للشفاه فراولة 5جم', '6223012631107'],
    [43, 600.0, 100.0, 6.0, 'شان مرطب للشفاه شيري 5جم', '6223012631114'],
    [44, 760.0, 190.0, 4.0, 'شان جل مرطب للبشره 120جم', '6224008073390'],
    [45, 1035.0, 345.0, 3.0, 'كانتري بلسم بالهيا والكافيار 300مل', '6224008073659'],
    [46, 1320.0, 330.0, 4.0, 'كانتري شامبو بزيت الارجان 300مل', '6224008073666'],
    [47, 1050.0, 175.0, 6.0, 'شان غسول فيتامين سي 250مل', '6224008073383'],
    [48, 1035.0, 345.0, 3.0, 'كويسلر + بلانشر كريمي روز بيري 3184', '6930236303184'],
    [49, 1428.0, 119.0, 12.0, 'esse long lasting pen1', '4250035246942'],
    [50, 1134.0, 189.0, 6.0, 'ess line n STAIN! TATTOO LIP LINER 01', '4059729518507'],
    [51, 2065.0, 295.0, 7.0, 'ess call me queen mas', '4059729441973'],
    [52, 1134.0, 189.0, 6.0, 'ess line n STAIN! TATTOO LIP LINER 02', '4059729518521'],
    [53, 1074.0, 179.0, 6.0, 'ess extreme shine volume lipgloss 16', '4059729542991'],
    [54, 1074.0, 179.0, 6.0, 'ess. extreme shine volume lipgloss 102', '4059729302908'],
    [55, 2700.0, 225.0, 12.0, 'ess i extreme crazy mas vol', '4250587739084'],
    [56, 294.0, 49.0, 6.0, 'كوكو اكلادور 114', '6224011253529'],
    [57, 1560.0, 390.0, 4.0, 'كانتري ماسك لفروه الراس 300مل', '6224010337824'],
    [
      80691.0,
      'قيمه القسط',
      'عدد الاقساط 1.00',
      80691.0,
      'باقي المبلغ',
      'المبلغ المسدد 0.00',
      0.0,
      'الخصم',
      '######',
      'صافي الفات الاجمالي',
      '######',
      'فقط و قدره ثمانون الف وستمائة وواحد وتسعون جنيهاً',
      'ادارة المبيعات توقيع العميل',
    ],
  ];

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(sampleData);
  ws['!cols'] = [
    { wch: 8 },
    { wch: 14 },
    { wch: 12 },
    { wch: 10 },
    { wch: 34 },
    { wch: 18 },
  ];
  XLSX.utils.book_append_sheet(wb, ws, 'فاتورة_مبيعات');
  XLSX.writeFile(wb, 'نموذج_فاتورة_مبيعات_فرع_المعادي_بلس_3925.xlsx');
}
