import { AssetCategory, OtherFundItem, PlatformRecord, YearData } from '../types/investment';

export const DEFAULT_PLATFORM_CATEGORIES: Record<string, AssetCategory> = {
  'FONDO INDEXADO GLOBAL': 'Otros',
  'BROKER ACCIONES Y ETF': 'Bolsa / Acciones',
  'EXCHANGE CRIPTOMONEDAS': 'Criptomonedas',
  'CROWDLENDING P2P': 'P2P / Crowdlending',
  'INMOBILIARIO CROWDFUNDING': 'Inmobiliario',
  'CUENTA REMUNERADA': 'Otros',
};

export const MONTH_NAMES_ES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

function createDemoPlatform(
  name: string,
  invested: number,
  valuation: number,
  category: AssetCategory = 'Bolsa / Acciones'
): PlatformRecord {
  return {
    id: `demo-${name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Math.random().toString(36).substring(2, 6)}`,
    name,
    category,
    invested,
    valuation,
  };
}

// Sample generic liquidity funds for demonstration
const sampleGenericFunds: OtherFundItem[] = [
  { id: 'fund-demo-1', name: 'Cuenta Corriente / Ahorro', amount: 8000, category: 'Bancos / Ahorro' },
  { id: 'fund-demo-2', name: 'Fondo de Emergencia', amount: 5000, category: 'Bancos / Ahorro' },
];

export const INITIAL_YEARS_DATA: YearData[] = [
  {
    year: 2025,
    months: [
      ...Array.from({ length: 9 }, (_, i) => ({
        id: `2025-${String(i + 1).padStart(2, '0')}`,
        year: 2025,
        month: i + 1,
        monthName: MONTH_NAMES_ES[i],
        platforms: [],
        hasData: false,
        isClosed: false,
      })),
      {
        id: '2025-10',
        year: 2025,
        month: 10,
        monthName: 'Octubre',
        hasData: true,
        isClosed: true,
        platforms: [
          createDemoPlatform('Fondo Indexado Global', 3000, 3120, 'Otros'),
          createDemoPlatform('Broker Acciones y ETF', 2000, 2110, 'Bolsa / Acciones'),
          createDemoPlatform('Exchange Criptomonedas', 1000, 1150, 'Criptomonedas'),
        ],
        otherFunds: sampleGenericFunds,
      },
      {
        id: '2025-11',
        year: 2025,
        month: 11,
        monthName: 'Noviembre',
        hasData: true,
        isClosed: true,
        platforms: [
          createDemoPlatform('Fondo Indexado Global', 3500, 3680, 'Otros'),
          createDemoPlatform('Broker Acciones y ETF', 2500, 2690, 'Bolsa / Acciones'),
          createDemoPlatform('Exchange Criptomonedas', 1000, 1220, 'Criptomonedas'),
        ],
        otherFunds: sampleGenericFunds,
      },
      {
        id: '2025-12',
        year: 2025,
        month: 12,
        monthName: 'Diciembre',
        hasData: true,
        isClosed: true,
        platforms: [
          createDemoPlatform('Fondo Indexado Global', 4000, 4290, 'Otros'),
          createDemoPlatform('Broker Acciones y ETF', 3000, 3240, 'Bolsa / Acciones'),
          createDemoPlatform('Exchange Criptomonedas', 1500, 1780, 'Criptomonedas'),
        ],
        otherFunds: sampleGenericFunds,
      },
    ],
  },
  {
    year: 2026,
    months: [
      {
        id: '2026-01',
        year: 2026,
        month: 1,
        monthName: 'Enero',
        hasData: true,
        isClosed: true,
        platforms: [
          createDemoPlatform('Fondo Indexado Global', 4500, 4890, 'Otros'),
          createDemoPlatform('Broker Acciones y ETF', 3500, 3810, 'Bolsa / Acciones'),
          createDemoPlatform('Exchange Criptomonedas', 1500, 1920, 'Criptomonedas'),
        ],
        otherFunds: sampleGenericFunds,
      },
      {
        id: '2026-02',
        year: 2026,
        month: 2,
        monthName: 'Febrero',
        hasData: true,
        isClosed: true,
        platforms: [
          createDemoPlatform('Fondo Indexado Global', 5000, 5450, 'Otros'),
          createDemoPlatform('Broker Acciones y ETF', 4000, 4390, 'Bolsa / Acciones'),
          createDemoPlatform('Exchange Criptomonedas', 2000, 2450, 'Criptomonedas'),
        ],
        otherFunds: sampleGenericFunds,
      },
      {
        id: '2026-03',
        year: 2026,
        month: 3,
        monthName: 'Marzo',
        hasData: true,
        isClosed: true,
        platforms: [
          createDemoPlatform('Fondo Indexado Global', 5500, 6080, 'Otros'),
          createDemoPlatform('Broker Acciones y ETF', 4500, 4970, 'Bolsa / Acciones'),
          createDemoPlatform('Exchange Criptomonedas', 2000, 2600, 'Criptomonedas'),
        ],
        otherFunds: sampleGenericFunds,
      },
      ...Array.from({ length: 9 }, (_, i) => ({
        id: `2026-${String(i + 4).padStart(2, '0')}`,
        year: 2026,
        month: i + 4,
        monthName: MONTH_NAMES_ES[i + 3],
        platforms: [],
        hasData: false,
        isClosed: false,
      })),
    ],
  },
];
