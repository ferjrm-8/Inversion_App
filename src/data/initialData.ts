import { AssetCategory, OtherFundItem, PlatformRecord, YearData } from '../types/investment';

export const DEFAULT_PLATFORM_CATEGORIES: Record<string, AssetCategory> = {
  ETORO: 'Bolsa / Acciones',
  HUOBI: 'Criptomonedas',
  MINTOS: 'P2P / Crowdlending',
  NIBBLE: 'P2P / Crowdlending',
  EVOESTATE: 'Inmobiliario',
  BITPANDA: 'Criptomonedas',
  ROBOCASH: 'P2P / Crowdlending',
  PEERBERRY: 'P2P / Crowdlending',
  VAINVEST: 'P2P / Crowdlending',
  VIAINVEST: 'P2P / Crowdlending',
  BINANCE: 'Criptomonedas',
  TRADE: 'Bolsa / Acciones',
};

export const MONTH_NAMES_ES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

function p(name: string, invested: number, valuation: number, category?: AssetCategory): PlatformRecord {
  const cat = category || DEFAULT_PLATFORM_CATEGORIES[name.toUpperCase()] || 'Otros';
  return {
    id: `${name.toLowerCase()}-${Math.random().toString(36).substring(2, 7)}`,
    name,
    category: cat,
    invested,
    valuation,
  };
}

// Preloaded funds breakdown (page 7 of PDF)
const sampleOtherFunds: OtherFundItem[] = [
  { id: 'f-evo', name: 'Cuenta EVO Banco', amount: 30400, category: 'Bancos / Ahorro' },
  { id: 'f-ing', name: 'Cuenta ING Direct', amount: 6925, category: 'Bancos / Ahorro' },
  { id: 'f-car', name: 'Vehículos / Coches', amount: 4177, category: 'Bienes / Otros' },
  { id: 'f-inv', name: 'Fondos Externos / Investing', amount: 6100, category: 'Fondos' },
];

export const INITIAL_YEARS_DATA: YearData[] = [
  {
    year: 2021,
    months: [
      ...Array.from({ length: 11 }, (_, i) => ({
        id: `2021-${String(i + 1).padStart(2, '0')}`,
        year: 2021,
        month: i + 1,
        monthName: MONTH_NAMES_ES[i],
        platforms: [],
        hasData: false,
      })),
      {
        id: '2021-12',
        year: 2021,
        month: 12,
        monthName: 'Diciembre',
        hasData: true,
        platforms: [
          p('ETORO', 750, 945, 'Bolsa / Acciones'),
          p('HUOBI', 400, 366, 'Criptomonedas'),
          p('MINTOS', 400, 419, 'P2P / Crowdlending'),
          p('NIBBLE', 500, 522, 'P2P / Crowdlending'),
          p('EVOESTATE', 200, 209, 'Inmobiliario'),
        ],
        otherFunds: sampleOtherFunds,
      },
    ],
  },
  {
    year: 2022,
    months: [
      {
        id: '2022-01', year: 2022, month: 1, monthName: 'Enero', hasData: true,
        platforms: [
          p('ETORO', 750, 641), p('HUOBI', 500, 313), p('MINTOS', 400, 422),
          p('NIBBLE', 600, 627), p('EVOESTATE', 200, 210),
        ],
      },
      {
        id: '2022-02', year: 2022, month: 2, monthName: 'Febrero', hasData: true,
        platforms: [
          p('ETORO', 750, 720), p('HUOBI', 600, 422), p('MINTOS', 400, 425),
          p('NIBBLE', 700, 732), p('EVOESTATE', 200, 211),
        ],
      },
      {
        id: '2022-03', year: 2022, month: 3, monthName: 'Marzo', hasData: true,
        platforms: [
          p('ETORO', 750, 763), p('HUOBI', 700, 560), p('MINTOS', 500, 527),
          p('NIBBLE', 800, 840), p('EVOESTATE', 200, 212),
        ],
      },
      {
        id: '2022-04', year: 2022, month: 4, monthName: 'Abril', hasData: true,
        platforms: [
          p('ETORO', 750, 620), p('HUOBI', 800, 531), p('MINTOS', 500, 531),
          p('NIBBLE', 900, 948), p('EVOESTATE', 200, 213),
        ],
      },
      {
        id: '2022-05', year: 2022, month: 5, monthName: 'Mayo', hasData: true,
        platforms: [
          p('ETORO', 750, 385), p('HUOBI', 800, 357), p('MINTOS', 500, 535),
          p('NIBBLE', 900, 955), p('EVOESTATE', 200, 214), p('BITPANDA', 100, 63),
          p('ROBOCASH', 100, 102),
        ],
      },
      {
        id: '2022-06', year: 2022, month: 6, monthName: 'Junio', hasData: true,
        platforms: [
          p('ETORO', 850, 407), p('HUOBI', 800, 258), p('MINTOS', 500, 537),
          p('NIBBLE', 900, 963), p('EVOESTATE', 200, 215), p('BITPANDA', 200, 108),
          p('ROBOCASH', 200, 202),
        ],
      },
      {
        id: '2022-07', year: 2022, month: 7, monthName: 'Julio', hasData: true,
        platforms: [
          p('ETORO', 1050, 723), p('HUOBI', 800, 343), p('MINTOS', 500, 540),
          p('NIBBLE', 900, 971), p('EVOESTATE', 200, 217), p('BITPANDA', 300, 268),
          p('ROBOCASH', 400, 405),
        ],
      },
      {
        id: '2022-08', year: 2022, month: 8, monthName: 'Agosto', hasData: true,
        platforms: [
          p('ETORO', 1150, 787), p('HUOBI', 800, 299), p('MINTOS', 500, 543),
          p('NIBBLE', 900, 980), p('EVOESTATE', 200, 218), p('BITPANDA', 400, 327),
          p('ROBOCASH', 500, 509),
        ],
      },
      {
        id: '2022-09', year: 2022, month: 9, monthName: 'Septiembre', hasData: true,
        platforms: [
          p('ETORO', 1250, 846), p('HUOBI', 800, 297), p('MINTOS', 500, 547),
          p('NIBBLE', 500, 531), p('PEERBERRY', 400, 452), p('EVOESTATE', 200, 219),
          p('BITPANDA', 500, 408), p('ROBOCASH', 600, 614),
        ],
      },
      {
        id: '2022-10', year: 2022, month: 10, monthName: 'Octubre', hasData: true,
        platforms: [
          p('ETORO', 1250, 889), p('HUOBI', 800, 316), p('MINTOS', 500, 551),
          p('NIBBLE', 500, 533), p('PEERBERRY', 500, 555), p('EVOESTATE', 200, 220),
          p('BITPANDA', 600, 552), p('ROBOCASH', 700, 722),
        ],
      },
      {
        id: '2022-11', year: 2022, month: 11, monthName: 'Noviembre', hasData: true,
        platforms: [
          p('ETORO', 1350, 837), p('HUOBI', 800, 240), p('MINTOS', 500, 555),
          p('NIBBLE', 500, 542), p('PEERBERRY', 600, 661), p('EVOESTATE', 200, 225),
          p('BITPANDA', 700, 500), p('ROBOCASH', 700, 729),
        ],
      },
      {
        id: '2022-12', year: 2022, month: 12, monthName: 'Diciembre', hasData: true,
        platforms: [
          p('ETORO', 1350, 733), p('HUOBI', 800, 204), p('MINTOS', 500, 558),
          p('NIBBLE', 500, 545), p('PEERBERRY', 600, 668), p('EVOESTATE', 200, 226),
          p('BITPANDA', 700, 439), p('ROBOCASH', 700, 737), p('VIAINVEST', 300, 300),
        ],
      },
    ],
  },
  {
    year: 2023,
    months: [
      {
        id: '2023-01', year: 2023, month: 1, monthName: 'Enero', hasData: true,
        platforms: [
          p('ETORO', 1450, 1017), p('HUOBI', 800, 289), p('MINTOS', 500, 562),
          p('NIBBLE', 200, 229), p('PEERBERRY', 600, 673), p('EVOESTATE', 200, 228),
          p('BITPANDA', 700, 615), p('ROBOCASH', 700, 744), p('VIAINVEST', 700, 730),
        ],
      },
      {
        id: '2023-02', year: 2023, month: 2, monthName: 'Febrero', hasData: true,
        platforms: [
          p('ETORO', 1450, 1081), p('HUOBI', 800, 299), p('MINTOS', 500, 566),
          p('NIBBLE', 150, 171), p('PEERBERRY', 600, 679), p('EVOESTATE', 200, 228),
          p('BITPANDA', 700, 630), p('ROBOCASH', 700, 751), p('VIAINVEST', 700, 737),
        ],
      },
      {
        id: '2023-03', year: 2023, month: 3, monthName: 'Marzo', hasData: true,
        platforms: [
          p('ETORO', 1450, 1082), p('HUOBI', 800, 310), p('MINTOS', 500, 571),
          p('NIBBLE', 150, 171), p('PEERBERRY', 600, 686), p('EVOESTATE', 200, 230),
          p('BITPANDA', 700, 677), p('ROBOCASH', 700, 758), p('VIAINVEST', 700, 744),
        ],
      },
      {
        id: '2023-04', year: 2023, month: 4, monthName: 'Abril', hasData: true,
        platforms: [
          p('ETORO', 1600, 1162), p('HUOBI', 800, 295), p('MINTOS', 500, 575),
          p('NIBBLE', 150, 175), p('PEERBERRY', 600, 691), p('EVOESTATE', 200, 231),
          p('BITPANDA', 700, 648), p('ROBOCASH', 700, 765), p('VIAINVEST', 850, 902),
        ],
      },
      {
        id: '2023-05', year: 2023, month: 5, monthName: 'Mayo', hasData: true,
        platforms: [
          p('ETORO', 1750, 1358), p('HUOBI', 800, 292), p('MINTOS', 500, 580),
          p('PEERBERRY', 750, 873), p('EVOESTATE', 200, 232), p('BITPANDA', 700, 637),
          p('ROBOCASH', 850, 922), p('VIAINVEST', 850, 910),
        ],
      },
      {
        id: '2023-06', year: 2023, month: 6, monthName: 'Junio', hasData: true,
        platforms: [
          p('ETORO', 1900, 1509), p('HUOBI', 800, 288), p('MINTOS', 500, 584),
          p('PEERBERRY', 900, 1032), p('EVOESTATE', 200, 236), p('BITPANDA', 700, 660),
          p('ROBOCASH', 850, 931), p('VIAINVEST', 850, 919),
        ],
      },
      {
        id: '2023-07', year: 2023, month: 7, monthName: 'Julio', hasData: true,
        platforms: [
          p('ETORO', 1900, 1604), p('MINTOS', 500, 588), p('PEERBERRY', 900, 1038),
          p('EVOESTATE', 200, 236), p('BITPANDA', 700, 647), p('ROBOCASH', 850, 939),
          p('VIAINVEST', 850, 928), p('BINANCE', 1400, 889),
        ],
      },
      {
        id: '2023-08', year: 2023, month: 8, monthName: 'Agosto', hasData: true,
        platforms: [
          p('ETORO', 2200, 1807), p('MINTOS', 500, 593), p('PEERBERRY', 900, 1048),
          p('EVOESTATE', 200, 236), p('BITPANDA', 700, 576), p('ROBOCASH', 1050, 1148),
          p('VIAINVEST', 1050, 1138), p('BINANCE', 1400, 812),
        ],
      },
      {
        id: '2023-09', year: 2023, month: 9, monthName: 'Septiembre', hasData: true,
        platforms: [
          p('ETORO', 2200, 1788), p('BINANCE', 1400, 881), p('MINTOS', 500, 597),
          p('PEERBERRY', 900, 1056), p('EVOESTATE', 200, 240), p('BITPANDA', 700, 630),
          p('ROBOCASH', 1050, 1158), p('VIAINVEST', 1050, 1151),
        ],
      },
      {
        id: '2023-10', year: 2023, month: 10, monthName: 'Octubre', hasData: true,
        platforms: [
          p('ETORO', 2200, 1769), p('BINANCE', 1400, 1005), p('MINTOS', 500, 600),
          p('PEERBERRY', 900, 1062), p('EVOESTATE', 200, 240), p('BITPANDA', 700, 721),
          p('ROBOCASH', 1050, 1169), p('VIAINVEST', 1050, 1160),
        ],
      },
      {
        id: '2023-11', year: 2023, month: 11, monthName: 'Noviembre', hasData: true,
        platforms: [
          p('ETORO', 2700, 2432), p('BINANCE', 1400, 1109), p('MINTOS', 500, 604),
          p('PEERBERRY', 900, 1071), p('EVOESTATE', 200, 240), p('BITPANDA', 700, 799),
          p('ROBOCASH', 1550, 1679), p('VIAINVEST', 1050, 1172),
        ],
      },
      {
        id: '2023-12', year: 2023, month: 12, monthName: 'Diciembre', hasData: true,
        platforms: [
          p('ETORO', 2700, 2617), p('BINANCE', 1400, 1259), p('MINTOS', 500, 607),
          p('PEERBERRY', 900, 1080), p('EVOESTATE', 200, 240), p('BITPANDA', 700, 926),
          p('ROBOCASH', 1550, 1693), p('VIAINVEST', 1050, 1183),
        ],
      },
    ],
  },
  {
    year: 2024,
    months: [
      {
        id: '2024-01', year: 2024, month: 1, monthName: 'Enero', hasData: true,
        platforms: [
          p('ETORO', 2950, 2838), p('BINANCE', 1400, 1245), p('MINTOS', 500, 611),
          p('PEERBERRY', 900, 1089), p('BITPANDA', 950, 1156), p('ROBOCASH', 1800, 1957),
          p('VIAINVEST', 1500, 1686),
        ],
        otherFunds: [
          { id: 'f-tot-24-1', name: 'Patrimonio Total Declarado', amount: 53090, category: 'Total Global' }
        ]
      },
      {
        id: '2024-02', year: 2024, month: 2, monthName: 'Febrero', hasData: true,
        platforms: [
          p('ETORO', 2950, 3259), p('BINANCE', 1400, 1767), p('MINTOS', 500, 614),
          p('PEERBERRY', 900, 1097), p('BITPANDA', 950, 1636), p('ROBOCASH', 1800, 1971),
          p('VIAINVEST', 1500, 1703),
        ],
        otherFunds: [{ id: 'f-tot-24-2', name: 'Patrimonio Total Declarado', amount: 53731, category: 'Total Global' }]
      },
      {
        id: '2024-03', year: 2024, month: 3, monthName: 'Marzo', hasData: true,
        platforms: [
          p('ETORO', 3300, 4079), p('BINANCE', 1400, 2345), p('MINTOS', 500, 617),
          p('PEERBERRY', 900, 1105), p('BITPANDA', 1250, 2144), p('ROBOCASH', 2150, 2337),
          p('VIAINVEST', 1500, 1719),
        ],
        otherFunds: [{ id: 'f-tot-24-3', name: 'Patrimonio Total Declarado', amount: 55170, category: 'Total Global' }]
      },
      {
        id: '2024-04', year: 2024, month: 4, monthName: 'Abril', hasData: true,
        platforms: [
          p('ETORO', 3500, 3805), p('BINANCE', 1400, 1846), p('MINTOS', 500, 621),
          p('PEERBERRY', 900, 1114), p('BITPANDA', 1350, 1824), p('ROBOCASH', 2350, 2555),
          p('VIAINVEST', 1500, 1737),
        ],
        otherFunds: [{ id: 'f-tot-24-4', name: 'Patrimonio Total Declarado', amount: 53811, category: 'Total Global' }]
      },
      {
        id: '2024-05', year: 2024, month: 5, monthName: 'Mayo', hasData: true,
        platforms: [
          p('ETORO', 3600, 4225), p('BINANCE', 1400, 2208), p('MINTOS', 500, 625),
          p('PEERBERRY', 1000, 1223), p('BITPANDA', 1450, 2276), p('ROBOCASH', 2350, 2577),
          p('VIAINVEST', 1500, 1754),
        ],
        otherFunds: [{ id: 'f-tot-24-5', name: 'Patrimonio Total Declarado', amount: 55402, category: 'Total Global' }]
      },
      {
        id: '2024-06', year: 2024, month: 6, monthName: 'Junio', hasData: true,
        platforms: [
          p('ETORO', 3700, 4154), p('BINANCE', 1400, 1916), p('MINTOS', 500, 628),
          p('PEERBERRY', 1100, 1332), p('BITPANDA', 1550, 2195), p('ROBOCASH', 2350, 2598),
          p('VIAINVEST', 1500, 1771),
        ],
        otherFunds: [{ id: 'f-tot-24-6', name: 'Patrimonio Total Declarado', amount: 55247, category: 'Total Global' }]
      },
      {
        id: '2024-07', year: 2024, month: 7, monthName: 'Julio', hasData: true,
        platforms: [
          p('ETORO', 3800, 4225), p('BINANCE', 1400, 1856), p('MINTOS', 500, 631),
          p('PEERBERRY', 1200, 1443), p('BITPANDA', 1650, 2201), p('ROBOCASH', 2350, 2621),
          p('VIAINVEST', 1500, 1787),
        ],
        otherFunds: [{ id: 'f-tot-24-7', name: 'Patrimonio Total Declarado', amount: 60248, category: 'Total Global' }]
      },
      {
        id: '2024-08', year: 2024, month: 8, monthName: 'Agosto', hasData: true,
        platforms: [
          p('ETORO', 3900, 4093), p('BINANCE', 1400, 1589), p('MINTOS', 500, 635),
          p('PEERBERRY', 1300, 1554), p('BITPANDA', 1750, 1961), p('ROBOCASH', 2350, 2644),
          p('VIAINVEST', 1500, 1806),
        ],
        otherFunds: [{ id: 'f-tot-24-8', name: 'Patrimonio Total Declarado', amount: 60438, category: 'Total Global' }]
      },
      {
        id: '2024-09', year: 2024, month: 9, monthName: 'Septiembre', hasData: true,
        platforms: [
          p('ETORO', 4000, 4358), p('BINANCE', 1400, 1743), p('MINTOS', 500, 638),
          p('PEERBERRY', 1400, 1667), p('BITPANDA', 1850, 2170), p('ROBOCASH', 2350, 2665),
          p('VIAINVEST', 1500, 1823),
        ],
      },
      {
        id: '2024-10', year: 2024, month: 10, monthName: 'Octubre', hasData: true,
        platforms: [
          p('ETORO', 4100, 4546), p('BINANCE', 1400, 1900), p('MINTOS', 500, 642),
          p('PEERBERRY', 1500, 1779), p('BITPANDA', 1950, 2457), p('ROBOCASH', 2350, 2687),
          p('VIAINVEST', 1500, 1839),
        ],
      },
      {
        id: '2024-11', year: 2024, month: 11, monthName: 'Noviembre', hasData: true,
        platforms: [
          p('ETORO', 4800, 6262), p('BINANCE', 1400, 2947), p('MINTOS', 500, 646),
          p('PEERBERRY', 2200, 2493), p('BITPANDA', 2650, 4423), p('ROBOCASH', 2350, 2709),
          p('VIAINVEST', 1500, 1856),
        ],
      },
      {
        id: '2024-12', year: 2024, month: 12, monthName: 'Diciembre', hasData: true,
        platforms: [
          p('ETORO', 4900, 6159), p('BINANCE', 1400, 2640), p('MINTOS', 500, 650),
          p('PEERBERRY', 2300, 2608), p('BITPANDA', 2750, 4381), p('ROBOCASH', 2350, 2731),
          p('VIAINVEST', 1500, 1874),
        ],
      },
    ],
  },
  {
    year: 2025,
    months: [
      {
        id: '2025-01', year: 2025, month: 1, monthName: 'Enero', hasData: true,
        platforms: [
          p('ETORO', 5200, 6783), p('BINANCE', 1400, 2785), p('MINTOS', 500, 654),
          p('PEERBERRY', 2300, 2624), p('BITPANDA', 3050, 4992), p('ROBOCASH', 2650, 3053),
          p('VIAINVEST', 1500, 1890),
        ],
        otherFunds: [{ id: 'f-25-1', name: 'Patrimonio Resto de Fondos', amount: 61559 - 22782, category: 'Resto de fondos' }]
      },
      {
        id: '2025-02', year: 2025, month: 2, monthName: 'Febrero', hasData: true,
        platforms: [
          p('ETORO', 5250, 6335), p('BINANCE', 1400, 2146), p('MINTOS', 500, 658),
          p('PEERBERRY', 2300, 2638), p('BITPANDA', 3150, 4013), p('ROBOCASH', 2750, 3171),
          p('VIAINVEST', 1500, 1907),
        ],
        otherFunds: [{ id: 'f-25-2', name: 'Patrimonio Resto de Fondos', amount: 58424 - 20868, category: 'Resto de fondos' }]
      },
      {
        id: '2025-03', year: 2025, month: 3, monthName: 'Marzo', hasData: true,
        platforms: [
          p('ETORO', 5300, 5876), p('BINANCE', 1400, 1991), p('MINTOS', 500, 663),
          p('PEERBERRY', 2300, 2660), p('BITPANDA', 3250, 3817), p('ROBOCASH', 2850, 3298),
          p('VIAINVEST', 1500, 1922),
        ],
        otherFunds: [{ id: 'f-25-3', name: 'Patrimonio Resto de Fondos', amount: 59733 - 20228, category: 'Resto de fondos' }]
      },
      {
        id: '2025-04', year: 2025, month: 4, monthName: 'Abril', hasData: true,
        platforms: [
          p('ETORO', 5650, 6083), p('BINANCE', 1400, 2089), p('MINTOS', 500, 668),
          p('PEERBERRY', 2300, 2680), p('BITPANDA', 3750, 4555), p('ROBOCASH', 3250, 3720),
          p('VIAINVEST', 1500, 1940),
        ],
        otherFunds: [{ id: 'f-25-4', name: 'Patrimonio Resto de Fondos', amount: 65178 - 21735, category: 'Resto de fondos' }]
      },
      {
        id: '2025-05', year: 2025, month: 5, monthName: 'Mayo', hasData: true,
        platforms: [
          p('ETORO', 6600, 7505), p('BINANCE', 1400, 2266), p('MINTOS', 500, 674),
          p('PEERBERRY', 3300, 3704), p('BITPANDA', 4750, 6288), p('ROBOCASH', 3250, 3750),
          p('VIAINVEST', 1500, 1957),
        ],
        otherFunds: [{ id: 'f-25-5', name: 'Patrimonio Resto de Fondos', amount: 68389 - 26143, category: 'Resto de fondos' }]
      },
      {
        id: '2025-06', year: 2025, month: 6, monthName: 'Junio', hasData: true,
        platforms: [
          p('ETORO', 6750, 7738), p('BINANCE', 1400, 2185), p('MINTOS', 700, 878),
          p('PEERBERRY', 3300, 3730), p('BITPANDA', 4950, 6350), p('ROBOCASH', 3250, 3777),
          p('VIAINVEST', 1500, 1974),
        ],
        otherFunds: [{ id: 'f-25-6', name: 'Patrimonio Resto de Fondos', amount: 70114 - 26633, category: 'Resto de fondos' }]
      },
      {
        id: '2025-07', year: 2025, month: 7, monthName: 'Julio', hasData: true,
        platforms: [
          p('ETORO', 7000, 8581), p('BINANCE', 1400, 2553), p('MINTOS', 1000, 1185),
          p('PEERBERRY', 3300, 3757), p('BITPANDA', 5250, 7907), p('ROBOCASH', 3250, 3808),
          p('VIAINVEST', 1500, 1991),
        ],
        otherFunds: [{ id: 'f-25-7', name: 'Patrimonio Resto de Fondos', amount: 73971 - 29782, category: 'Resto de fondos' }]
      },
      {
        id: '2025-08', year: 2025, month: 8, monthName: 'Agosto', hasData: true,
        platforms: [
          p('ETORO', 7250, 8811), p('BINANCE', 1400, 2448), p('MINTOS', 1300, 1493),
          p('PEERBERRY', 3300, 3784), p('BITPANDA', 5550, 7970), p('ROBOCASH', 3250, 3838),
          p('VIAINVEST', 1500, 2008),
        ],
        otherFunds: [{ id: 'f-25-8', name: 'Patrimonio Resto de Fondos', amount: 75203 - 30351, category: 'Resto de fondos' }]
      },
      {
        id: '2025-09', year: 2025, month: 9, monthName: 'Septiembre', hasData: true,
        platforms: [
          p('ETORO', 7500, 9347), p('BINANCE', 1400, 2516), p('MINTOS', 1300, 1502),
          p('PEERBERRY', 3300, 3810), p('BITPANDA', 5850, 8453), p('ROBOCASH', 3250, 3867),
          p('VIAINVEST', 1800, 2328),
        ],
        otherFunds: [{ id: 'f-25-9', name: 'Patrimonio Resto de Fondos', amount: 77678 - 31823, category: 'Resto de fondos' }]
      },
      {
        id: '2025-10', year: 2025, month: 10, monthName: 'Octubre', hasData: true,
        platforms: [
          p('ETORO', 7500, 9744), p('BINANCE', 1400, 2409), p('MINTOS', 1300, 1511),
          p('PEERBERRY', 3300, 3837), p('BITPANDA', 6150, 8475), p('ROBOCASH', 3250, 3897),
          p('VIAINVEST', 2100, 2650), p('TRADE', 2000, 1988),
        ],
        otherFunds: [{ id: 'f-25-10', name: 'Patrimonio Resto de Fondos', amount: 78519 - 34510, category: 'Resto de fondos' }]
      },
      {
        id: '2025-11', year: 2025, month: 11, monthName: 'Noviembre', hasData: true,
        platforms: [
          p('ETORO', 8000, 9592), p('BINANCE', 1400, 1852), p('MINTOS', 1600, 1823),
          p('PEERBERRY', 3300, 3864), p('BITPANDA', 6450, 6732), p('ROBOCASH', 3250, 3925),
          p('VIAINVEST', 2100, 2673), p('TRADE', 2000, 2016),
        ],
        otherFunds: [{ id: 'f-25-11', name: 'Patrimonio Resto de Fondos', amount: 76748 - 32477, category: 'Resto de fondos' }]
      },
      {
        id: '2025-12', year: 2025, month: 12, monthName: 'Diciembre', hasData: true,
        platforms: [
          p('ETORO', 8250, 9818), p('BINANCE', 1400, 1840), p('MINTOS', 1900, 2134),
          p('PEERBERRY', 3300, 3891), p('BITPANDA', 6750, 7125), p('ROBOCASH', 3250, 3957),
          p('VIAINVEST', 2100, 2695), p('TRADE', 2000, 2011),
        ],
        otherFunds: [{ id: 'f-25-12', name: 'Patrimonio Resto de Fondos', amount: 79256 - 33471, category: 'Resto de fondos' }]
      },
    ],
  },
  {
    year: 2026,
    months: [
      {
        id: '2026-01', year: 2026, month: 1, monthName: 'Enero', hasData: true,
        platforms: [
          p('ETORO', 8500, 9916), p('BINANCE', 1400, 1613), p('MINTOS', 1900, 2147),
          p('PEERBERRY', 3300, 3918), p('BITPANDA', 7050, 6380), p('ROBOCASH', 3550, 4264),
          p('VIAINVEST', 2100, 2718), p('TRADE', 2000, 2045),
        ],
        otherFunds: [{ id: 'f-26-1', name: 'Patrimonio Resto de Fondos', amount: 79603 - 33001, category: 'Resto de fondos' }]
      },
      {
        id: '2026-02', year: 2026, month: 2, monthName: 'Febrero', hasData: true,
        platforms: [
          p('ETORO', 8750, 9953), p('BINANCE', 1400, 1377), p('MINTOS', 2200, 2462),
          p('PEERBERRY', 3300, 3945), p('BITPANDA', 7350, 5689), p('ROBOCASH', 3550, 4293),
          p('VIAINVEST', 2100, 2741), p('TRADE', 2000, 2118),
        ],
        otherFunds: [{ id: 'f-26-2', name: 'Patrimonio Resto de Fondos', amount: 79757 - 32578, category: 'Resto de fondos' }]
      },
      {
        id: '2026-03', year: 2026, month: 3, monthName: 'Marzo', hasData: true,
        platforms: [
          p('ETORO', 9000, 9922), p('BINANCE', 1400, 1434), p('MINTOS', 2500, 2776),
          p('PEERBERRY', 3300, 3973), p('BITPANDA', 7650, 6261), p('ROBOCASH', 3550, 4326),
          p('VIAINVEST', 2100, 2762), p('TRADE', 2000, 2077),
        ],
        otherFunds: [{ id: 'f-26-3', name: 'Patrimonio Resto de Fondos', amount: 82598 - 33531, category: 'Resto de fondos' }]
      },
      {
        id: '2026-04', year: 2026, month: 4, monthName: 'Abril', hasData: true,
        platforms: [
          p('ETORO', 9250, 10746), p('BINANCE', 1400, 1565), p('MINTOS', 2800, 3094),
          p('PEERBERRY', 3300, 4000), p('BITPANDA', 7950, 7243), p('ROBOCASH', 3550, 4358),
          p('VIAINVEST', 2100, 2786), p('TRADE', 2000, 2094),
        ],
        otherFunds: [
          { id: 'f-evo-26', name: 'EVO Banco', amount: 30400, category: 'Bancos' },
          { id: 'f-ing-26', name: 'ING Direct', amount: 6925, category: 'Bancos' },
          { id: 'f-car-26', name: 'Coches / Vehículos', amount: 4177, category: 'Bienes' },
          { id: 'f-inv-26', name: 'Investing / Fondos', amount: 6100, category: 'Fondos' },
        ]
      },
      {
        id: '2026-05', year: 2026, month: 5, monthName: 'Mayo', hasData: true,
        platforms: [
          p('ETORO', 9500, 11271), p('BINANCE', 1400, 1488), p('MINTOS', 3100, 3413),
          p('PEERBERRY', 3300, 4028), p('BITPANDA', 8250, 7063), p('ROBOCASH', 3550, 4391),
          p('VIAINVEST', 2100, 2808), p('TRADE', 3000, 3140),
        ],
        otherFunds: [{ id: 'f-26-5', name: 'Patrimonio Resto de Fondos', amount: 87163 - 37602, category: 'Resto de fondos' }]
      },
      {
        id: '2026-06', year: 2026, month: 6, monthName: 'Junio', hasData: true,
        platforms: [
          p('ETORO', 9800, 11337), p('BINANCE', 1400, 1212), p('MINTOS', 3400, 3735),
          p('PEERBERRY', 3300, 4057), p('BITPANDA', 8550, 6022), p('ROBOCASH', 3550, 4427),
          p('VIAINVEST', 2100, 2832), p('TRADE', 3000, 3371),
        ],
        otherFunds: [{ id: 'f-26-6', name: 'Patrimonio Resto de Fondos', amount: 87740 - 36993, category: 'Resto de fondos' }]
      },
      {
        id: '2026-07', year: 2026, month: 7, monthName: 'Julio', hasData: true,
        platforms: [
          p('ETORO', 10050, 11893), p('BINANCE', 1400, 1306), p('MINTOS', 3400, 3761),
          p('PEERBERRY', 3600, 4386), p('BITPANDA', 8850, 6863), p('ROBOCASH', 3550, 4457),
          p('VIAINVEST', 2100, 2855), p('TRADE', 3000, 3134),
        ],
        otherFunds: [{ id: 'f-26-7', name: 'Patrimonio Resto de Fondos', amount: 91041 - 38655, category: 'Resto de fondos' }]
      },
      {
        id: '2026-08', year: 2026, month: 8, monthName: 'Agosto', hasData: true,
        platforms: [
          p('ETORO', 10300, 12702),
          p('MINTOS', 3700, 4088),
          p('PEERBERRY', 3600, 4417),
          p('BITPANDA', 10550, 10632),
          p('ROBOCASH', 3550, 4492),
          p('VIAINVEST', 2100, 2879),
          p('TRADE', 4107, 4393),
        ],
        otherFunds: [{ id: 'f-26-8', name: 'Patrimonio Resto de Fondos', amount: 95061 - 43603, category: 'Resto de fondos' }]
      },
      {
        id: '2026-09', year: 2026, month: 9, monthName: 'Septiembre', hasData: true, isClosed: false,
        platforms: [
          p('ETORO', 10600, 10600),
          p('MINTOS', 3700, 3700),
          p('PEERBERRY', 3600, 3600),
          p('BITPANDA', 10700, 10700),
          p('ROBOCASH', 3850, 3850),
          p('VIAINVEST', 2100, 2100),
          p('TRADE', 4267, 4267),
        ],
        otherFunds: [{ id: 'f-26-9', name: 'Patrimonio Resto de Fondos', amount: 95061 - 43603, category: 'Resto de fondos' }]
      },
      {
        id: '2026-10', year: 2026, month: 10, monthName: 'Octubre', hasData: false,
        platforms: [],
      },
      {
        id: '2026-11', year: 2026, month: 11, monthName: 'Noviembre', hasData: false,
        platforms: [],
      },
      {
        id: '2026-12', year: 2026, month: 12, monthName: 'Diciembre', hasData: false,
        platforms: [],
      },
    ],
  },
];
