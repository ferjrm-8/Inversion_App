export type AssetCategory = 'Bolsa / Acciones' | 'Criptomonedas' | 'P2P / Crowdlending' | 'Inmobiliario' | 'Otros';

export interface PlatformRecord {
  id: string;
  name: string;
  category: AssetCategory;
  invested: number;
  valuation: number;
  // profit is calculated as valuation - invested
  // profitPercentage is calculated as ((valuation - invested) / invested) * 100
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
  otherFunds?: OtherFundItem[]; // bank accounts, cash, car, etc.
  notes?: string;
  hasData: boolean;
  isClosed?: boolean; // When false or undefined on the current month, month is in progress (in-course)
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
