export interface ReturnItem {
  code: string;
  itemName: string;
  systemQty: number;
  price: number;
  cost?: number;
  category: string;
  subcat?: string;
  fullCategory?: string;
  serialNo?: number;
  total?: number;
}

export interface JardItem {
  itemName: string;
  code: string;
  systemQty: number;
  soundQty: number;
  damagedQty: number;
  countedQty: number;
  price: number;
  cost: number;
  category: string;
  subcat?: string;
  fullCategory?: string;
  time: number;
  serialNo?: number;
  total?: number;
}

export interface ReturnMeta {
  branch: string;
  returnNo: string;
  date: string;
  keeper: string;
  notes: string;
}

export interface RouteInfo {
  isTransfer: boolean;
  isDamaged: boolean;
  routeType: string;
  fromBranch: string;
  toBranch: string;
  notes: string;
}

export interface Session {
  id: string;
  title: string;
  inventoryMap: Record<string, ReturnItem>;
  jardData: Record<string, JardItem>;
  undoStack: string[];
  returnMeta: ReturnMeta;
  routeInfo: RouteInfo;
  isCompleted?: boolean;
  completedAt?: string;
}

export type FilterType = 'all' | 'match' | 'extra' | 'less' | 'counted' | 'damaged';
export type ItemCondition = 'sound' | 'damaged';
export type Language = 'ar' | 'en';
export type AppMode = 'inbound_invoice' | 'returns_hub';

export type ReturnConditionType = 'sound' | 'damaged' | 'defect';

export interface DedicatedReturnItem {
  id: string;
  code: string;
  itemName: string;
  category: string;
  qty: number;
  costPrice: number;
  sellingPrice: number;
  totalCost: number;
  totalSelling: number;
  condition: ReturnConditionType;
  branch: string;
  returnNo: string;
  date: string;
  notes?: string;
  timestamp: number;
}

export interface DedicatedReturnSlip {
  id: string;
  slipNo: string;
  branch: string;
  date: string;
  keeper: string;
  notes: string;
  items: DedicatedReturnItem[];
  isLocked?: boolean;
  createdAt: number;
}
