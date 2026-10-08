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
