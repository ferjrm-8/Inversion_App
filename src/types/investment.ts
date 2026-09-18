export type AssetCategory = 'Bolsa / Acciones' | 'Criptomonedas' | 'P2P / Crowdlending' | 'Inmobiliario' | 'Otros';

export interface PlatformRecord {
  id: string;
  name: string;
  category: AssetCategory;
  invested: number;
  valuation: number;
}

export interface OtherFundItem {
  id: string;
  name: string;
  amount: number;
  category?: string;
  notes?: string;
}

export interface MonthRecord {
  id: string; // e.g. "2024-03"
  year: number;
  month: number; // 1 to 12
  monthName: string;
  platforms: PlatformRecord[];
  otherFunds?: OtherFundItem[];
  notes?: string;
  hasData: boolean;
  isClosed?: boolean;
}

export interface YearData {
  year: number;
  months: MonthRecord[];
  notes?: string;
}

export interface InvestmentStore {
  years: YearData[];
  selectedYear: number;
  selectedMonth: number;
  customPlatforms: string[];
}

export interface UserAccount {
  userId: string;
  emailOrUsername: string;
  displayName: string;
  lastSyncedAt?: string;
}
