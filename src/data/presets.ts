import { ChartShape, PortfolioPreset, PortfolioState, PriceHistoryEntry, RichGoal, Timeframe, TokenHolding } from '../types/crypto';

export function makeSparkline(trend: number, points = 20, seed = 1): number[] {
  const result: number[] = [];
  let val = 100;
  const stepBias = trend / points;
  for (let i = 0; i < points; i++) {
    const spike = ((i * 7 + seed * 13) % 5 === 0 ? 5.5 : -3.8) * (i % 2 === 0 ? 1 : -1.2);
    val = Math.max(15, val + stepBias * 1.4 + spike);
    result.push(Number(val.toFixed(2)));
  }
  return result;
}

export function buildPriceHistory(
  currentPriceUsd: number,
  change24hPct: number,
  points = 8,
  seed = 1
): PriceHistoryEntry[] {
  const safePrice = Math.max(0.000001, currentPriceUsd);
  const clampedPct = Math.max(-80, Math.min(400, change24hPct));
  const startPrice = safePrice / (1 + clampedPct / 100);
  const delta = safePrice - startPrice;
  const now = Date.now();
  const chronological: PriceHistoryEntry[] = [];

  for (let i = 0; i < points; i++) {
    const t = points === 1 ? 1 : i / (points - 1);
    const wave =
      i === 0 || i === points - 1
        ? 0
        : (((i * 11 + seed * 7) % 9) - 4) * 0.012;
    const price =
      i === points - 1
        ? safePrice
        : Math.max(0.000001, (startPrice + delta * t) * (1 + wave));

    const prevPrice =
      i === 0 ? startPrice : chronological[i - 1]?.priceUsd || startPrice;
    const stepPct =
      prevPrice > 0 ? ((price - prevPrice) / prevPrice) * 100 : 0;

    const ts = new Date(now - (points - 1 - i) * 30 * 60 * 1000);
    chronological.push({
      id: `ph-${seed}-${i}-${Math.round(price * 1e6)}`,
      priceUsd:
        price < 0.01
          ? Number(price.toFixed(8))
          : price < 1
          ? Number(price.toFixed(4))
          : Number(price.toFixed(2)),
      changePct: Number(stepPct.toFixed(2)),
      timestampLabel: ts.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      }),
    });
  }

  return chronological.reverse();
}

export function sparklineFromHistory(
  history: PriceHistoryEntry[],
  fallbackPrice = 1
): number[] {
  if (!history || history.length === 0) {
    return [fallbackPrice, fallbackPrice];
  }
  const chrono = [...history].reverse().map((e) => e.priceUsd);
  if (chrono.length === 1) {
    return [chrono[0], chrono[0]];
  }
  return chrono;
}

export function ensureTokenPriceHistory(token: TokenHolding): PriceHistoryEntry[] {
  if (token.priceHistory && token.priceHistory.length > 0) {
    return token.priceHistory;
  }
  const seed = token.symbol.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return buildPriceHistory(token.priceUsd, token.change24hPct, 8, seed);
}

export function generateChartSeries(
  currentBalance: number,
  changePct: number,
  shape: ChartShape,
  timeframe: Timeframe
): { value: number; label: string }[] {
  const count = 44;
  const safeBalance = Math.max(0, currentBalance);
  const tfMultiplier: Record<Timeframe, number> = {
    '1H': 0.18,
    '1D': 1,
    '1W': 2.3,
    '1M': 4.1,
    '1Y': 8.5,
    ALL: 14,
  };
  const tfSeed: Record<Timeframe, number> = {
    '1H': 1,
    '1D': 2,
    '1W': 3,
    '1M': 4,
    '1Y': 5,
    ALL: 6,
  };

  const effectivePct = changePct * tfMultiplier[timeframe];
  const clampedPct = Math.max(-92, Math.min(800, effectivePct));
  const startBalance =
    clampedPct <= -99 ? safeBalance * 5 : safeBalance / (1 + clampedPct / 100);
  const delta = safeBalance - startBalance;
  const swingScale = Math.max(Math.abs(delta), safeBalance * 0.24);
  const seed = tfSeed[timeframe];

  const now = new Date();
  const points: { value: number; label: string }[] = [];

  for (let i = 0; i < count; i++) {
    const t = i / (count - 1);
    let baseProgress = t;
    let dramaOffset = 0;

    // Sharp alternating jagged noise (sawtooth, never smooth)
    const jagged =
      ((i % 2 === 0 ? 1 : -1) * 0.045 +
        (((i * 17 + seed * 11) % 7) - 3) * 0.025) *
      (i === 0 || i === count - 1 ? 0 : 1);

    // Dramatic "straight to hell" cliff plunges & "straight to heaven" vertical spikes
    const hellZone1 = i === 9 ? -1.15 : i === 10 ? -0.95 : 0;
    const heavenZone1 = i === 18 ? 1.25 : i === 19 ? 1.05 : 0;
    const hellZone2 = i === 27 ? -1.2 : i === 28 ? -0.85 : 0;
    const heavenZone2 = i === 35 ? 1.3 : i === 36 ? 1.1 : 0;

    switch (shape) {
      case 'parabolic':
        baseProgress = t < 0.72 ? t * 0.12 : 0.086 + ((t - 0.72) / 0.28) * 0.914;
        dramaOffset = hellZone1 * 0.35 + (t > 0.7 ? (t - 0.7) * 0.4 : 0) + jagged;
        break;
      case 'steady':
        baseProgress = t;
        dramaOffset = jagged * 0.6;
        break;
      case 'dip_recovery':
        baseProgress = t < 0.48 ? -t * 1.1 : -0.528 + ((t - 0.48) / 0.52) * 1.528;
        dramaOffset = hellZone1 * 0.65 + heavenZone2 * 0.55 + jagged;
        break;
      case 'volatile':
        baseProgress = t;
        dramaOffset =
          (seed % 2 === 0
            ? hellZone1 * 0.85 + heavenZone1 * 0.9 + hellZone2 * 0.95 + heavenZone2 * 0.85
            : heavenZone1 * 0.95 + hellZone1 * 0.85 + heavenZone2 * 0.9 + hellZone2 * 0.8) +
          jagged * 1.6;
        break;
      case 'crash':
        baseProgress = t < 0.35 ? t * 0.15 : 0.05 + ((t - 0.35) / 0.65) * 0.95;
        dramaOffset = heavenZone1 * 0.3 + hellZone2 * 0.75 + jagged;
        break;
      case 'bull':
      default:
        // Mix of straight-to-hell drops and straight-to-heaven spikes depending on timeframe
        baseProgress = t;
        if (seed % 3 === 1) {
          dramaOffset = hellZone1 * 0.7 + heavenZone1 * 0.95 + hellZone2 * 0.5 + jagged * 1.2;
        } else if (seed % 3 === 2) {
          dramaOffset = heavenZone1 * 0.75 + hellZone2 * 0.9 + heavenZone2 * 0.85 + jagged * 1.2;
        } else {
          dramaOffset = hellZone1 * 0.85 + heavenZone2 * 0.95 + jagged * 1.2;
        }
        break;
    }

    let value: number;
    if (i === 0) {
      value = startBalance;
    } else if (i === count - 1) {
      value = safeBalance;
    } else {
      value = Math.max(
        safeBalance * 0.02,
        startBalance + delta * baseProgress + swingScale * dramaOffset
      );
    }

    // Format realistic timestamp per timeframe
    const d = new Date(now.getTime());
    const reverseRatio = 1 - t;
    let label = '';
    if (timeframe === '1H') {
      d.setMinutes(d.getMinutes() - Math.round(reverseRatio * 60));
      label = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (timeframe === '1D') {
      d.setMinutes(d.getMinutes() - Math.round(reverseRatio * 24 * 60));
      label = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (timeframe === '1W') {
      d.setHours(d.getHours() - Math.round(reverseRatio * 7 * 24));
      label = d.toLocaleDateString([], { weekday: 'short', hour: '2-digit' });
    } else if (timeframe === '1M') {
      d.setDate(d.getDate() - Math.round(reverseRatio * 30));
      label = d.toLocaleDateString([], { month: 'short', day: 'numeric' });
    } else if (timeframe === '1Y') {
      d.setDate(d.getDate() - Math.round(reverseRatio * 365));
      label = d.toLocaleDateString([], { month: 'short', day: 'numeric', year: '2-digit' });
    } else {
      d.setDate(d.getDate() - Math.round(reverseRatio * 1095));
      label = d.toLocaleDateString([], { month: 'short', year: 'numeric' });
    }

    points.push({ value, label });
  }

  return points;
}

export interface CandlePoint {
  open: number;
  high: number;
  low: number;
  close: number;
  label: string;
}

export function generateCandleSeries(
  currentBalance: number,
  changePct: number,
  shape: ChartShape,
  timeframe: Timeframe
): CandlePoint[] {
  const count = 30;
  const safeBalance = Math.max(1, currentBalance);
  const tfMultiplier: Record<Timeframe, number> = {
    '1H': 0.18,
    '1D': 1,
    '1W': 2.3,
    '1M': 4.1,
    '1Y': 8.5,
    ALL: 14,
  };
  const tfSeed: Record<Timeframe, number> = {
    '1H': 1,
    '1D': 2,
    '1W': 3,
    '1M': 4,
    '1Y': 5,
    ALL: 6,
  };
  const seed = tfSeed[timeframe];

  const effectivePct = changePct * tfMultiplier[timeframe];
  const clampedPct = Math.max(-85, Math.min(600, effectivePct));
  const startBalance = safeBalance / (1 + clampedPct / 100);
  const delta = safeBalance - startBalance;
  const waveAmp = Math.max(Math.abs(delta) * 0.65, safeBalance * 0.08);

  const now = new Date();
  const closes: { value: number; label: string }[] = [];

  for (let i = 0; i <= count; i++) {
    const t = i / count;
    let wave = 0;

    switch (shape) {
      case 'crash':
        // Drops hard then bounces slightly or slides down
        wave = -Math.sin(t * Math.PI * 0.9) * 0.8 + Math.sin(t * 14 + seed) * 0.15;
        break;
      case 'parabolic':
        // Consolidates low then rips upward across multiple green candles
        wave = -Math.sin(t * Math.PI) * 0.55 + Math.pow(t, 2.2) * 0.5 + Math.sin(t * 12 + seed) * 0.12;
        break;
      case 'dip_recovery':
        // Classic U-shape / cup dip and recovery like TradingView reversals
        wave = -Math.sin(t * Math.PI) * 1.1 + Math.sin(t * 15 + seed) * 0.18;
        break;
      case 'volatile':
        wave = Math.sin(t * Math.PI * 2.5 + seed) * 0.85 + Math.cos(t * 11) * 0.25;
        break;
      case 'steady':
        wave = Math.sin(t * Math.PI * 2 + seed) * 0.22;
        break;
      case 'bull':
      default:
        // Natural multi-candle sell-off into U-bottom and strong rally
        wave = -Math.sin(t * Math.PI * 1.15) * 0.95 + Math.sin(t * 13 + seed) * 0.2;
        break;
    }

    const rawVal =
      i === 0
        ? startBalance
        : i === count
        ? safeBalance
        : startBalance + delta * t + waveAmp * wave;

    const value = Math.max(safeBalance * 0.15, rawVal);

    const d = new Date(now.getTime());
    const reverseRatio = 1 - t;
    let label = '';
    if (timeframe === '1H') {
      d.setMinutes(d.getMinutes() - Math.round(reverseRatio * 60));
      label = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (timeframe === '1D') {
      d.setMinutes(d.getMinutes() - Math.round(reverseRatio * 24 * 60));
      label = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (timeframe === '1W') {
      d.setHours(d.getHours() - Math.round(reverseRatio * 7 * 24));
      label = d.toLocaleDateString([], { weekday: 'short', hour: '2-digit' });
    } else if (timeframe === '1M') {
      d.setDate(d.getDate() - Math.round(reverseRatio * 30));
      label = d.toLocaleDateString([], { month: 'short', day: 'numeric' });
    } else if (timeframe === '1Y') {
      d.setDate(d.getDate() - Math.round(reverseRatio * 365));
      label = d.toLocaleDateString([], { month: 'short', day: 'numeric', year: '2-digit' });
    } else {
      d.setDate(d.getDate() - Math.round(reverseRatio * 1095));
      label = d.toLocaleDateString([], { month: 'short', year: 'numeric' });
    }

    closes.push({ value, label });
  }

  const minVal = Math.min(...closes.map((c) => c.value));
  const maxVal = Math.max(...closes.map((c) => c.value));
  const totalRange = Math.max(safeBalance * 0.04, maxVal - minVal);
  const typicalBody = totalRange / 10;

  const candles: CandlePoint[] = [];
  let prevClose = closes[0].value;

  for (let i = 1; i < closes.length; i++) {
    const isLast = i === closes.length - 1;
    const open = prevClose;
    // Mix subtle pullbacks so rallies include occasional red candles and dips include green bounces
    const pull = ((i * 5 + seed * 3) % 7 === 0 ? -1 : 1) * ((i % 3 === 0 ? -1 : 1) * typicalBody * 0.35);
    let close = isLast ? safeBalance : closes[i].value + pull;

    if (!isLast && Math.abs(close - open) < typicalBody * 0.25) {
      close = open + (pull >= 0 ? typicalBody * 0.45 : -typicalBody * 0.45);
    }

    const bodyTop = Math.max(open, close);
    const bodyBottom = Math.min(open, close);

    const upperWick = typicalBody * (0.2 + (((i * 11 + seed * 5) % 8) / 8) * 0.9);
    const lowerWick = typicalBody * (0.25 + (((i * 13 + seed * 7) % 8) / 8) * 1.1);

    const high = bodyTop + upperWick;
    const low = Math.max(safeBalance * 0.05, bodyBottom - lowerWick);

    candles.push({
      open,
      high,
      low,
      close,
      label: closes[i].label,
    });
    prevClose = close;
  }

  return candles;
}

export const DEFAULT_PORTFOLIO_STATE: PortfolioState = {
  profile: {
    name: 'Main Vault',
    address: '0x71C9...9A4F',
    network: 'Multi-Chain',
    useManualTotal: false,
    manualTotalBalance: 5217.45,
    manualChangeUsd: 199.95,
    manualChangePct: 3.98,
    chartShape: 'bull',
    liveTick: false,
    hideBalances: false,
    stealthMode: false,
    biometricLockEnabled: false,
    biometricMethod: 'faceid',
    uiStyle: 'candles',
  },
  holdings: [
    {
      id: 'btc',
      symbol: 'BTC',
      name: 'Bitcoin',
      network: 'Bitcoin',
      balance: 0.0185,
      priceUsd: 94280.0,
      change24hPct: 5.42,
      color: '#F7931A',
      sparkline: makeSparkline(5.42, 20, 1),
      priceHistory: buildPriceHistory(94280.0, 5.42, 8, 1),
    },
    {
      id: 'eth',
      symbol: 'ETH',
      name: 'Ethereum',
      network: 'Ethereum',
      balance: 0.34,
      priceUsd: 3345.5,
      change24hPct: 8.15,
      color: '#627EEA',
      sparkline: makeSparkline(8.15, 20, 2),
      priceHistory: buildPriceHistory(3345.5, 8.15, 8, 2),
    },
    {
      id: 'sol',
      symbol: 'SOL',
      name: 'Solana',
      network: 'Solana',
      balance: 3.85,
      priceUsd: 214.8,
      change24hPct: 12.64,
      color: '#14F195',
      sparkline: makeSparkline(12.64, 20, 3),
      priceHistory: buildPriceHistory(214.8, 12.64, 8, 3),
    },
    {
      id: 'nvda',
      symbol: 'NVDA',
      name: 'Nvidia',
      network: 'Ondo · Tokenized',
      balance: 2.5,
      priceUsd: 142.8,
      change24hPct: 4.65,
      color: '#76B900',
      sparkline: makeSparkline(4.65, 20, 9),
      priceHistory: buildPriceHistory(142.8, 4.65, 8, 9),
      category: 'stock',
    },
    {
      id: 'usdc',
      symbol: 'USDC',
      name: 'USD Coin',
      network: 'Base',
      balance: 412.5,
      priceUsd: 1.0,
      change24hPct: 0.01,
      color: '#2775CA',
      sparkline: makeSparkline(0.1, 20, 4),
      priceHistory: buildPriceHistory(1.0, 0.01, 8, 4),
    },
    {
      id: 'link',
      symbol: 'LINK',
      name: 'Chainlink',
      network: 'Ethereum',
      balance: 12.5,
      priceUsd: 17.85,
      change24hPct: -1.84,
      color: '#375BD2',
      sparkline: makeSparkline(-1.84, 20, 5),
      priceHistory: buildPriceHistory(17.85, -1.84, 8, 5),
      category: 'defi',
    },
    {
      id: 'pepe',
      symbol: 'PEPE',
      name: 'Pepe',
      network: 'Ethereum',
      balance: 6500000,
      priceUsd: 0.000024,
      change24hPct: 38.4,
      color: '#16A34A',
      sparkline: makeSparkline(38.4, 20, 6),
      priceHistory: buildPriceHistory(0.000024, 38.4, 8, 6),
      category: 'memecoin',
    },
    {
      id: 'doge',
      symbol: 'DOGE',
      name: 'Dogecoin',
      network: 'Dogecoin',
      balance: 420,
      priceUsd: 0.394,
      change24hPct: 16.2,
      color: '#C2A633',
      sparkline: makeSparkline(16.2, 20, 7),
      priceHistory: buildPriceHistory(0.394, 16.2, 8, 7),
      category: 'memecoin',
    },
    {
      id: 'hype',
      symbol: 'HYPE',
      name: 'Hyperliquid',
      network: 'HyperEVM',
      balance: 6.85,
      priceUsd: 28.4,
      change24hPct: 22.8,
      color: '#10B981',
      sparkline: makeSparkline(22.8, 20, 8),
      priceHistory: buildPriceHistory(28.4, 22.8, 8, 8),
      category: 'layer1',
    },
    {
      id: 'xrp',
      symbol: 'XRP',
      name: 'XRP',
      network: 'XRP Ledger',
      balance: 265,
      priceUsd: 1.14,
      change24hPct: 14.8,
      color: '#111827',
      sparkline: makeSparkline(14.8, 20, 11),
      priceHistory: buildPriceHistory(1.14, 14.8, 8, 11),
      category: 'layer1',
    },
    {
      id: 'sui',
      symbol: 'SUI',
      name: 'Sui',
      network: 'Sui',
      balance: 74,
      priceUsd: 3.82,
      change24hPct: 9.6,
      color: '#4DA2FF',
      sparkline: makeSparkline(9.6, 20, 12),
      priceHistory: buildPriceHistory(3.82, 9.6, 8, 12),
      category: 'layer1',
    },
    {
      id: 'ada',
      symbol: 'ADA',
      name: 'Cardano',
      network: 'Cardano',
      balance: 280,
      priceUsd: 0.79,
      change24hPct: 6.4,
      color: '#0033AD',
      sparkline: makeSparkline(6.4, 20, 13),
      priceHistory: buildPriceHistory(0.79, 6.4, 8, 13),
      category: 'layer1',
    },
    {
      id: 'avax',
      symbol: 'AVAX',
      name: 'Avalanche',
      network: 'Avalanche',
      balance: 6.5,
      priceUsd: 36.2,
      change24hPct: 4.2,
      color: '#E84142',
      sparkline: makeSparkline(4.2, 20, 14),
      priceHistory: buildPriceHistory(36.2, 4.2, 8, 14),
      category: 'layer1',
    },
    {
      id: 'ton',
      symbol: 'TON',
      name: 'Toncoin',
      network: 'TON',
      balance: 32,
      priceUsd: 5.62,
      change24hPct: 3.9,
      color: '#0098EA',
      sparkline: makeSparkline(3.9, 20, 15),
      priceHistory: buildPriceHistory(5.62, 3.9, 8, 15),
      category: 'layer1',
    },
    {
      id: 'aave',
      symbol: 'AAVE',
      name: 'Aave',
      network: 'Ethereum',
      balance: 1.15,
      priceUsd: 178.4,
      change24hPct: 7.3,
      color: '#B6509E',
      sparkline: makeSparkline(7.3, 20, 16),
      priceHistory: buildPriceHistory(178.4, 7.3, 8, 16),
      category: 'defi',
    },
    {
      id: 'uni',
      symbol: 'UNI',
      name: 'Uniswap',
      network: 'Ethereum',
      balance: 18,
      priceUsd: 9.45,
      change24hPct: 5.1,
      color: '#FF007A',
      sparkline: makeSparkline(5.1, 20, 17),
      priceHistory: buildPriceHistory(9.45, 5.1, 8, 17),
      category: 'defi',
    },
    {
      id: 'near',
      symbol: 'NEAR',
      name: 'NEAR Protocol',
      network: 'NEAR',
      balance: 26,
      priceUsd: 5.88,
      change24hPct: 8.7,
      color: '#00C08B',
      sparkline: makeSparkline(8.7, 20, 18),
      priceHistory: buildPriceHistory(5.88, 8.7, 8, 18),
      category: 'layer1',
    },
  ],
  transactions: [
    {
      id: 'tx-1',
      type: 'receive',
      symbol: 'SOL',
      amount: 0.85,
      usdValue: 182.58,
      counterparty: 'Coinbase',
      timestampLabel: 'Today, 14:22',
      status: 'Confirmed',
      txHash: '5xK9...m8Qp',
    },
    {
      id: 'tx-2',
      type: 'swap',
      symbol: 'USDC',
      amount: 250.0,
      toSymbol: 'ETH',
      toAmount: 0.0747,
      usdValue: 250.0,
      counterparty: 'Uniswap v4',
      timestampLabel: 'Yesterday, 21:08',
      status: 'Confirmed',
      txHash: '0x94a...11fE',
    },
    {
      id: 'tx-3',
      type: 'buy',
      symbol: 'BTC',
      amount: 0.0016,
      usdValue: 150.85,
      counterparty: 'Apple Pay · MoonPay',
      timestampLabel: 'Nov 16, 09:41',
      status: 'Confirmed',
      txHash: 'bc1q...49zx',
    },
    {
      id: 'tx-4',
      type: 'send',
      symbol: 'ETH',
      amount: 0.045,
      usdValue: 150.55,
      counterparty: '0x44B1...82C0',
      timestampLabel: 'Nov 14, 17:55',
      status: 'Confirmed',
      txHash: '0x31b...88dA',
    },
  ],
  priceAlerts: [
    {
      id: 'alert-btc-100k',
      symbol: 'BTC',
      name: 'Bitcoin',
      targetPriceUsd: 100000,
      condition: 'above',
      active: true,
    },
    {
      id: 'alert-sol-200',
      symbol: 'SOL',
      name: 'Solana',
      targetPriceUsd: 200,
      condition: 'below',
      active: true,
    },
  ],
};

export const PORTFOLIO_PRESETS: PortfolioPreset[] = [
  {
    id: 'default',
    label: 'Everyday Wallet',
    subtitle: '$5.2K Multi-Chain',
    state: DEFAULT_PORTFOLIO_STATE,
  },
  {
    id: 'institutional',
    label: 'Institutional',
    subtitle: '$24.6M Treasury',
    state: {
      profile: {
        name: 'Meridian Custody',
        address: '0x00A8...F92E',
        network: 'Multi-Chain',
        useManualTotal: false,
        manualTotalBalance: 24618400.0,
        manualChangeUsd: 492368.0,
        manualChangePct: 2.04,
        chartShape: 'steady',
        liveTick: false,
        hideBalances: false,
        stealthMode: false,
      },
      holdings: [
        {
          id: 'btc',
          symbol: 'BTC',
          name: 'Bitcoin',
          network: 'Bitcoin',
          balance: 112.5,
          priceUsd: 94280.0,
          change24hPct: 2.18,
          color: '#F7931A',
          sparkline: makeSparkline(2.18, 20, 2),
          priceHistory: buildPriceHistory(94280.0, 2.18, 8, 2),
          category: 'layer1',
        },
        {
          id: 'eth',
          symbol: 'ETH',
          name: 'Ethereum',
          network: 'Ethereum',
          balance: 1640.0,
          priceUsd: 3345.0,
          change24hPct: 1.74,
          color: '#627EEA',
          sparkline: makeSparkline(1.74, 20, 4),
          priceHistory: buildPriceHistory(3345.0, 1.74, 8, 4),
          category: 'layer1',
        },
        {
          id: 'nvda',
          symbol: 'NVDA',
          name: 'Nvidia (Tokenized)',
          network: 'Ethereum',
          balance: 14500.0,
          priceUsd: 138.45,
          change24hPct: 3.12,
          color: '#76B900',
          sparkline: makeSparkline(3.12, 20, 10),
          priceHistory: buildPriceHistory(138.45, 3.12, 8, 10),
          category: 'stock',
        },
        {
          id: 'sol',
          symbol: 'SOL',
          name: 'Solana',
          network: 'Solana',
          balance: 6200.0,
          priceUsd: 214.8,
          change24hPct: 4.15,
          color: '#14F195',
          sparkline: makeSparkline(4.15, 20, 6),
          priceHistory: buildPriceHistory(214.8, 4.15, 8, 6),
          category: 'layer1',
        },
        {
          id: 'link',
          symbol: 'LINK',
          name: 'Chainlink',
          network: 'Ethereum',
          balance: 48000.0,
          priceUsd: 17.85,
          change24hPct: -0.65,
          color: '#375BD2',
          sparkline: makeSparkline(-0.65, 20, 5),
          priceHistory: buildPriceHistory(17.85, -0.65, 8, 5),
          category: 'defi',
        },
        {
          id: 'usdc',
          symbol: 'USDC',
          name: 'USD Coin',
          network: 'Ethereum',
          balance: 4325000.0,
          priceUsd: 1.0,
          change24hPct: 0.01,
          color: '#2775CA',
          sparkline: makeSparkline(0.01, 20, 1),
          priceHistory: buildPriceHistory(1.0, 0.01, 8, 1),
          category: 'stable',
        },
      ],
      transactions: [
        {
          id: 'tx-inst-1',
          type: 'receive',
          symbol: 'USDC',
          amount: 1250000,
          usdValue: 1250000,
          counterparty: 'Circle Mint · Treasury',
          timestampLabel: 'Today, 09:30',
          status: 'Confirmed',
          txHash: '0x88f...c20A',
        },
        {
          id: 'tx-inst-2',
          type: 'buy',
          symbol: 'BTC',
          amount: 14.5,
          usdValue: 1367060,
          counterparty: 'Coinbase Prime OTC',
          timestampLabel: 'Yesterday, 16:45',
          status: 'Confirmed',
          txHash: 'bc1q...91mk',
        },
        {
          id: 'tx-inst-3',
          type: 'swap',
          symbol: 'USDC',
          amount: 450000,
          toSymbol: 'NVDA',
          toAmount: 3250.27,
          usdValue: 450000,
          counterparty: 'Backed RWA Desk',
          timestampLabel: 'Nov 15, 14:12',
          status: 'Confirmed',
          txHash: '0x42c...8b19',
        },
      ],
      priceAlerts: [
        {
          id: 'alert-inst-btc',
          symbol: 'BTC',
          name: 'Bitcoin',
          targetPriceUsd: 100000,
          condition: 'above',
          active: true,
        },
        {
          id: 'alert-inst-eth',
          symbol: 'ETH',
          name: 'Ethereum',
          targetPriceUsd: 3000,
          condition: 'below',
          active: true,
        },
      ],
    },
  },
  {
    id: 'gambler',
    label: 'Degenerate Gambler',
    subtitle: '$68.4K High-Beta',
    state: {
      profile: {
        name: '100x.sol',
        address: '9zQp...420x',
        network: 'Solana',
        useManualTotal: false,
        manualTotalBalance: 68420.0,
        manualChangeUsd: 19840.0,
        manualChangePct: 40.84,
        chartShape: 'volatile',
        liveTick: false,
        hideBalances: false,
        stealthMode: false,
      },
      holdings: [
        {
          id: 'hype',
          symbol: 'HYPE',
          name: 'Hyperliquid',
          network: 'HyperEVM',
          balance: 680.0,
          priceUsd: 28.4,
          change24hPct: 34.6,
          color: '#10B981',
          sparkline: makeSparkline(34.6, 20, 8),
          priceHistory: buildPriceHistory(28.4, 34.6, 8, 8),
          category: 'layer1',
        },
        {
          id: 'pepe',
          symbol: 'PEPE',
          name: 'Pepe',
          network: 'Ethereum',
          balance: 615000000,
          priceUsd: 0.000024,
          change24hPct: 52.4,
          color: '#16A34A',
          sparkline: makeSparkline(52.4, 20, 6),
          priceHistory: buildPriceHistory(0.000024, 52.4, 8, 6),
          category: 'memecoin',
        },
        {
          id: 'wif',
          symbol: 'WIF',
          name: 'dogwifhat',
          network: 'Solana',
          balance: 4120.0,
          priceUsd: 3.12,
          change24hPct: -18.7,
          color: '#A855F7',
          sparkline: makeSparkline(-18.7, 20, 9),
          priceHistory: buildPriceHistory(3.12, -18.7, 8, 9),
          category: 'memecoin',
        },
        {
          id: 'bonk',
          symbol: 'BONK',
          name: 'Bonk',
          network: 'Solana',
          balance: 195000000,
          priceUsd: 0.000042,
          change24hPct: 41.2,
          color: '#F97316',
          sparkline: makeSparkline(41.2, 20, 11),
          priceHistory: buildPriceHistory(0.000042, 41.2, 8, 11),
          category: 'memecoin',
        },
        {
          id: 'popcat',
          symbol: 'POPCAT',
          name: 'Popcat',
          network: 'Solana',
          balance: 4250.0,
          priceUsd: 1.54,
          change24hPct: -24.5,
          color: '#EC4899',
          sparkline: makeSparkline(-24.5, 20, 12),
          priceHistory: buildPriceHistory(1.54, -24.5, 8, 12),
          category: 'memecoin',
        },
        {
          id: 'sol',
          symbol: 'SOL',
          name: 'Solana',
          network: 'Solana',
          balance: 21.5,
          priceUsd: 214.8,
          change24hPct: 8.9,
          color: '#14F195',
          sparkline: makeSparkline(8.9, 20, 3),
          priceHistory: buildPriceHistory(214.8, 8.9, 8, 3),
          category: 'layer1',
        },
        {
          id: 'doge',
          symbol: 'DOGE',
          name: 'Dogecoin',
          network: 'Dogecoin',
          balance: 5400.0,
          priceUsd: 0.394,
          change24hPct: 19.3,
          color: '#C2A633',
          sparkline: makeSparkline(19.3, 20, 7),
          priceHistory: buildPriceHistory(0.394, 19.3, 8, 7),
          category: 'memecoin',
        },
      ],
      transactions: [
        {
          id: 'tx-gam-1',
          type: 'swap',
          symbol: 'SOL',
          amount: 42.5,
          toSymbol: 'PEPE',
          toAmount: 380375000,
          usdValue: 9129,
          counterparty: 'Pump.fun · Raydium',
          timestampLabel: '6m ago',
          status: 'Confirmed',
          txHash: '7kM9...33zX',
        },
        {
          id: 'tx-gam-2',
          type: 'buy',
          symbol: 'HYPE',
          amount: 250,
          usdValue: 7100,
          counterparty: 'Hyperliquid 20x Perp',
          timestampLabel: 'Today, 04:18',
          status: 'Confirmed',
          txHash: '0x9a1...f77C',
        },
        {
          id: 'tx-gam-3',
          type: 'sell',
          symbol: 'WIF',
          amount: 1800,
          usdValue: 5616,
          counterparty: 'Jupiter Aggregator',
          timestampLabel: 'Yesterday, 23:54',
          status: 'Confirmed',
          txHash: '3pQv...90Lm',
        },
      ],
      priceAlerts: [
        {
          id: 'alert-gam-pepe',
          symbol: 'PEPE',
          name: 'Pepe',
          targetPriceUsd: 0.00003,
          condition: 'above',
          active: true,
        },
        {
          id: 'alert-gam-hype',
          symbol: 'HYPE',
          name: 'Hyperliquid',
          targetPriceUsd: 24,
          condition: 'below',
          active: true,
        },
      ],
    },
  },
  {
    id: 'staking',
    label: 'Staking Focused',
    subtitle: '$54.2K Yield & LSTs',
    state: {
      profile: {
        name: 'Validator Vault',
        address: '0x71E4...A890',
        network: 'Ethereum',
        useManualTotal: false,
        manualTotalBalance: 54210.0,
        manualChangeUsd: 1485.0,
        manualChangePct: 2.82,
        chartShape: 'steady',
        liveTick: false,
        hideBalances: false,
        stealthMode: false,
      },
      holdings: [
        {
          id: 'steth',
          symbol: 'STETH',
          name: 'Lido Staked ETH',
          network: 'Ethereum',
          balance: 6.45,
          priceUsd: 3342.0,
          change24hPct: 3.18,
          color: '#00A3FF',
          sparkline: makeSparkline(3.18, 20, 2),
          priceHistory: buildPriceHistory(3342.0, 3.18, 8, 2),
          category: 'defi',
        },
        {
          id: 'jitosol',
          symbol: 'JITOSOL',
          name: 'Jito Staked SOL',
          network: 'Solana',
          balance: 54.0,
          priceUsd: 242.5,
          change24hPct: 5.42,
          color: '#14B8A6',
          sparkline: makeSparkline(5.42, 20, 4),
          priceHistory: buildPriceHistory(242.5, 5.42, 8, 4),
          category: 'defi',
        },
        {
          id: 'eth',
          symbol: 'ETH',
          name: 'Ethereum',
          network: 'Ethereum',
          balance: 2.1,
          priceUsd: 3345.0,
          change24hPct: 3.12,
          color: '#627EEA',
          sparkline: makeSparkline(3.12, 20, 3),
          priceHistory: buildPriceHistory(3345.0, 3.12, 8, 3),
          category: 'layer1',
        },
        {
          id: 'atom',
          symbol: 'ATOM',
          name: 'Cosmos Hub',
          network: 'Cosmos',
          balance: 620.0,
          priceUsd: 7.45,
          change24hPct: 1.85,
          color: '#5064FB',
          sparkline: makeSparkline(1.85, 20, 5),
          priceHistory: buildPriceHistory(7.45, 1.85, 8, 5),
          category: 'layer1',
        },
        {
          id: 'avax',
          symbol: 'AVAX',
          name: 'Avalanche',
          network: 'Avalanche',
          balance: 118.0,
          priceUsd: 36.2,
          change24hPct: 2.45,
          color: '#E84142',
          sparkline: makeSparkline(2.45, 20, 6),
          priceHistory: buildPriceHistory(36.2, 2.45, 8, 6),
          category: 'layer1',
        },
        {
          id: 'link',
          symbol: 'LINK',
          name: 'Chainlink',
          network: 'Ethereum',
          balance: 95.0,
          priceUsd: 17.85,
          change24hPct: -0.92,
          color: '#375BD2',
          sparkline: makeSparkline(-0.92, 20, 7),
          priceHistory: buildPriceHistory(17.85, -0.92, 8, 7),
          category: 'defi',
        },
        {
          id: 'usdc',
          symbol: 'USDC',
          name: 'USD Coin (Aave v3)',
          network: 'Ethereum',
          balance: 1940.0,
          priceUsd: 1.0,
          change24hPct: 0.02,
          color: '#2775CA',
          sparkline: makeSparkline(0.02, 20, 1),
          priceHistory: buildPriceHistory(1.0, 0.02, 8, 1),
          category: 'stable',
        },
      ],
      transactions: [
        {
          id: 'tx-stk-1',
          type: 'receive',
          symbol: 'STETH',
          amount: 0.0184,
          usdValue: 61.49,
          counterparty: 'Lido Validator Rebate',
          timestampLabel: 'Today, 07:00',
          status: 'Confirmed',
          txHash: '0x54d...e80B',
        },
        {
          id: 'tx-stk-2',
          type: 'receive',
          symbol: 'JITOSOL',
          amount: 0.34,
          usdValue: 82.45,
          counterparty: 'Jito MEV Epoch 698',
          timestampLabel: 'Yesterday, 19:15',
          status: 'Confirmed',
          txHash: '8vLk...21Rq',
        },
        {
          id: 'tx-stk-3',
          type: 'swap',
          symbol: 'ETH',
          amount: 1.5,
          toSymbol: 'STETH',
          toAmount: 1.501,
          usdValue: 5017.5,
          counterparty: 'Lido Staking Pool',
          timestampLabel: 'Nov 13, 12:40',
          status: 'Confirmed',
          txHash: '0x21e...99Aa',
        },
      ],
      priceAlerts: [
        {
          id: 'alert-stk-eth',
          symbol: 'STETH',
          name: 'Lido Staked ETH',
          targetPriceUsd: 3600,
          condition: 'above',
          active: true,
        },
        {
          id: 'alert-stk-atom',
          symbol: 'ATOM',
          name: 'Cosmos Hub',
          targetPriceUsd: 6.5,
          condition: 'below',
          active: true,
        },
      ],
    },
  },
  {
    id: 'degen',
    label: 'Solana Degen',
    subtitle: '$428K Memes & SOL',
    state: {
      profile: {
        name: 'trench.sol',
        address: '7xKX...9pQz',
        network: 'Solana',
        useManualTotal: false,
        manualTotalBalance: 428150,
        manualChangeUsd: 94210,
        manualChangePct: 28.2,
        chartShape: 'parabolic',
        liveTick: false,
        hideBalances: false,
        stealthMode: false,
      },
      holdings: [
        {
          id: 'sol',
          symbol: 'SOL',
          name: 'Solana',
          network: 'Solana',
          balance: 940.5,
          priceUsd: 232.4,
          change24hPct: 16.4,
          color: '#14F195',
          sparkline: makeSparkline(16.4, 20, 5),
          priceHistory: buildPriceHistory(232.4, 16.4, 8, 5),
          category: 'layer1',
        },
        {
          id: 'pepe',
          symbol: 'PEPE',
          name: 'Pepe',
          network: 'Solana',
          balance: 4850000000,
          priceUsd: 0.000024,
          change24hPct: 44.8,
          color: '#16A34A',
          sparkline: makeSparkline(32, 20, 7),
          priceHistory: buildPriceHistory(0.000024, 44.8, 8, 7),
          category: 'memecoin',
        },
        {
          id: 'wif',
          symbol: 'WIF',
          name: 'dogwifhat',
          network: 'Solana',
          balance: 24500,
          priceUsd: 3.12,
          change24hPct: 21.5,
          color: '#A855F7',
          sparkline: makeSparkline(21.5, 20, 8),
          priceHistory: buildPriceHistory(3.12, 21.5, 8, 8),
          category: 'memecoin',
        },
        {
          id: 'usdc',
          symbol: 'USDC',
          name: 'USD Coin',
          network: 'Solana',
          balance: 16800,
          priceUsd: 1.0,
          change24hPct: 0.0,
          color: '#2775CA',
          sparkline: makeSparkline(0.0, 20, 2),
          priceHistory: buildPriceHistory(1.0, 0.0, 8, 2),
          category: 'stable',
        },
      ],
      transactions: [
        {
          id: 'tx-d1',
          type: 'swap',
          symbol: 'SOL',
          amount: 120,
          toSymbol: 'WIF',
          toAmount: 8940,
          usdValue: 27888,
          counterparty: 'Jupiter Aggregator',
          timestampLabel: '14m ago',
          status: 'Confirmed',
          txHash: '4nQ2...88zP',
        },
        {
          id: 'tx-d2',
          type: 'receive',
          symbol: 'SOL',
          amount: 250,
          usdValue: 58100,
          counterparty: 'Phantom Vault',
          timestampLabel: 'Today, 08:15',
          status: 'Confirmed',
          txHash: '2mLp...7vQx',
        },
      ],
      priceAlerts: [
        {
          id: 'alert-deg-sol',
          symbol: 'SOL',
          name: 'Solana',
          targetPriceUsd: 250,
          condition: 'above',
          active: true,
        },
      ],
    },
  },
  {
    id: 'rekt',
    label: 'Rekt Mode',
    subtitle: '$142.18 (-78.4%)',
    state: {
      profile: {
        name: 'Margin Account',
        address: '0x99E1...004B',
        network: 'Arbitrum',
        useManualTotal: false,
        manualTotalBalance: 142.18,
        manualChangeUsd: -516.0,
        manualChangePct: -78.4,
        chartShape: 'crash',
        liveTick: false,
        hideBalances: false,
        stealthMode: false,
      },
      holdings: [
        {
          id: 'eth',
          symbol: 'ETH',
          name: 'Ethereum',
          network: 'Arbitrum',
          balance: 0.032,
          priceUsd: 2910.0,
          change24hPct: -14.2,
          color: '#627EEA',
          sparkline: makeSparkline(-14.2, 20, 9),
          priceHistory: buildPriceHistory(2910.0, -14.2, 8, 9),
          category: 'layer1',
        },
        {
          id: 'arb',
          symbol: 'ARB',
          name: 'Arbitrum',
          network: 'Arbitrum',
          balance: 64.5,
          priceUsd: 0.76,
          change24hPct: -26.8,
          color: '#28A0F0',
          sparkline: makeSparkline(-26.8, 20, 3),
          priceHistory: buildPriceHistory(0.76, -26.8, 8, 3),
          category: 'layer1',
        },
      ],
      transactions: [
        {
          id: 'tx-r1',
          type: 'send',
          symbol: 'ETH',
          amount: 4.5,
          usdValue: 13095.0,
          counterparty: 'Hyperliquid Liquidation',
          timestampLabel: 'Today, 03:41',
          status: 'Confirmed',
          txHash: '0xdead...404f',
        },
      ],
      priceAlerts: [],
    },
  },
];

export const MEMECOIN_TEMPLATES: Omit<TokenHolding, 'id' | 'sparkline'>[] = [
  {
    symbol: 'PEPE',
    name: 'Pepe',
    network: 'Ethereum',
    balance: 500000000,
    priceUsd: 0.000024,
    change24hPct: 38.4,
    color: '#16A34A',
    category: 'memecoin',
  },
  {
    symbol: 'DOGE',
    name: 'Dogecoin',
    network: 'Dogecoin',
    balance: 25000,
    priceUsd: 0.394,
    change24hPct: 16.2,
    color: '#C2A633',
    category: 'memecoin',
  },
  {
    symbol: 'WIF',
    name: 'dogwifhat',
    network: 'Solana',
    balance: 8500,
    priceUsd: 3.12,
    change24hPct: 24.5,
    color: '#A855F7',
    category: 'memecoin',
  },
  {
    symbol: 'BONK',
    name: 'Bonk',
    network: 'Solana',
    balance: 450000000,
    priceUsd: 0.000042,
    change24hPct: 31.8,
    color: '#F97316',
    category: 'memecoin',
  },
  {
    symbol: 'POPCAT',
    name: 'Popcat',
    network: 'Solana',
    balance: 14000,
    priceUsd: 1.54,
    change24hPct: 19.4,
    color: '#EC4899',
    category: 'memecoin',
  },
  {
    symbol: 'SHIB',
    name: 'Shiba Inu',
    network: 'Ethereum',
    balance: 320000000,
    priceUsd: 0.000027,
    change24hPct: 11.6,
    color: '#E11D48',
    category: 'memecoin',
  },
  {
    symbol: 'PENGU',
    name: 'Pudgy Penguins',
    network: 'Solana',
    balance: 18000,
    priceUsd: 0.032,
    change24hPct: 27.4,
    color: '#38BDF8',
    category: 'memecoin',
  },
  {
    symbol: 'FARTCOIN',
    name: 'Fartcoin',
    network: 'Solana',
    balance: 1250,
    priceUsd: 0.88,
    change24hPct: -12.6,
    color: '#22C55E',
    category: 'memecoin',
  },
];

export const CRYPTO_TEMPLATES: Omit<TokenHolding, 'id' | 'sparkline'>[] = [
  {
    symbol: 'BTC',
    name: 'Bitcoin',
    network: 'Bitcoin',
    balance: 0.05,
    priceUsd: 94280.0,
    change24hPct: 5.42,
    color: '#F7931A',
    category: 'layer1',
  },
  {
    symbol: 'ETH',
    name: 'Ethereum',
    network: 'Ethereum',
    balance: 1.2,
    priceUsd: 3345.5,
    change24hPct: 8.15,
    color: '#627EEA',
    category: 'layer1',
  },
  {
    symbol: 'SOL',
    name: 'Solana',
    network: 'Solana',
    balance: 12,
    priceUsd: 214.8,
    change24hPct: 12.64,
    color: '#14F195',
    category: 'layer1',
  },
  {
    symbol: 'XRP',
    name: 'XRP',
    network: 'XRP Ledger',
    balance: 450,
    priceUsd: 1.14,
    change24hPct: 14.8,
    color: '#111827',
    category: 'layer1',
  },
  {
    symbol: 'BNB',
    name: 'BNB',
    network: 'BNB Chain',
    balance: 1.5,
    priceUsd: 624.5,
    change24hPct: 2.1,
    color: '#F3BA2F',
    category: 'layer1',
  },
  {
    symbol: 'SUI',
    name: 'Sui',
    network: 'Sui',
    balance: 180,
    priceUsd: 3.82,
    change24hPct: 9.6,
    color: '#4DA2FF',
    category: 'layer1',
  },
  {
    symbol: 'ADA',
    name: 'Cardano',
    network: 'Cardano',
    balance: 650,
    priceUsd: 0.79,
    change24hPct: 6.4,
    color: '#0033AD',
    category: 'layer1',
  },
  {
    symbol: 'AVAX',
    name: 'Avalanche',
    network: 'Avalanche',
    balance: 18,
    priceUsd: 36.2,
    change24hPct: 4.2,
    color: '#E84142',
    category: 'layer1',
  },
  {
    symbol: 'TON',
    name: 'Toncoin',
    network: 'TON',
    balance: 85,
    priceUsd: 5.62,
    change24hPct: 3.9,
    color: '#0098EA',
    category: 'layer1',
  },
  {
    symbol: 'DOT',
    name: 'Polkadot',
    network: 'Polkadot',
    balance: 90,
    priceUsd: 6.15,
    change24hPct: -2.4,
    color: '#E6007A',
    category: 'layer1',
  },
  {
    symbol: 'NEAR',
    name: 'NEAR Protocol',
    network: 'NEAR',
    balance: 75,
    priceUsd: 5.88,
    change24hPct: 8.7,
    color: '#00C08B',
    category: 'layer1',
  },
  {
    symbol: 'APT',
    name: 'Aptos',
    network: 'Aptos',
    balance: 40,
    priceUsd: 11.4,
    change24hPct: 5.3,
    color: '#0EA5E9',
    category: 'layer1',
  },
  {
    symbol: 'SEI',
    name: 'Sei',
    network: 'Sei',
    balance: 600,
    priceUsd: 0.54,
    change24hPct: 11.2,
    color: '#DC2626',
    category: 'layer1',
  },
  {
    symbol: 'ATOM',
    name: 'Cosmos Hub',
    network: 'Cosmos',
    balance: 65,
    priceUsd: 7.45,
    change24hPct: 1.85,
    color: '#5064FB',
    category: 'layer1',
  },
  {
    symbol: 'LTC',
    name: 'Litecoin',
    network: 'Litecoin',
    balance: 6,
    priceUsd: 88.4,
    change24hPct: 3.2,
    color: '#345D9D',
    category: 'layer1',
  },
  {
    symbol: 'TRX',
    name: 'TRON',
    network: 'TRON',
    balance: 2400,
    priceUsd: 0.21,
    change24hPct: 1.9,
    color: '#EF0027',
    category: 'layer1',
  },
  {
    symbol: 'HYPE',
    name: 'Hyperliquid',
    network: 'HyperEVM',
    balance: 20,
    priceUsd: 28.4,
    change24hPct: 22.8,
    color: '#10B981',
    category: 'layer1',
  },
  {
    symbol: 'LINK',
    name: 'Chainlink',
    network: 'Ethereum',
    balance: 30,
    priceUsd: 17.85,
    change24hPct: -1.84,
    color: '#375BD2',
    category: 'defi',
  },
  {
    symbol: 'AAVE',
    name: 'Aave',
    network: 'Ethereum',
    balance: 3.5,
    priceUsd: 178.4,
    change24hPct: 7.3,
    color: '#B6509E',
    category: 'defi',
  },
  {
    symbol: 'UNI',
    name: 'Uniswap',
    network: 'Ethereum',
    balance: 50,
    priceUsd: 9.45,
    change24hPct: 5.1,
    color: '#FF007A',
    category: 'defi',
  },
  {
    symbol: 'ONDO',
    name: 'Ondo Finance',
    network: 'Ethereum',
    balance: 420,
    priceUsd: 1.18,
    change24hPct: 9.4,
    color: '#1E293B',
    category: 'defi',
  },
  {
    symbol: 'ARB',
    name: 'Arbitrum',
    network: 'Arbitrum',
    balance: 500,
    priceUsd: 0.76,
    change24hPct: -3.8,
    color: '#28A0F0',
    category: 'defi',
  },
  {
    symbol: 'OP',
    name: 'Optimism',
    network: 'Optimism',
    balance: 240,
    priceUsd: 1.94,
    change24hPct: 2.7,
    color: '#FF0420',
    category: 'defi',
  },
  {
    symbol: 'STETH',
    name: 'Lido Staked ETH',
    network: 'Ethereum',
    balance: 0.45,
    priceUsd: 3342.0,
    change24hPct: 3.18,
    color: '#00A3FF',
    category: 'defi',
  },
  {
    symbol: 'JITOSOL',
    name: 'Jito Staked SOL',
    network: 'Solana',
    balance: 4.5,
    priceUsd: 242.5,
    change24hPct: 5.42,
    color: '#14B8A6',
    category: 'defi',
  },
  {
    symbol: 'TAO',
    name: 'Bittensor',
    network: 'Bittensor',
    balance: 1.2,
    priceUsd: 492.0,
    change24hPct: 11.4,
    color: '#0F172A',
    category: 'layer1',
  },
  {
    symbol: 'RENDER',
    name: 'Render',
    network: 'Solana',
    balance: 65,
    priceUsd: 7.95,
    change24hPct: 6.8,
    color: '#E11D48',
    category: 'defi',
  },
  {
    symbol: 'USDT',
    name: 'Tether USD',
    network: 'Ethereum',
    balance: 500,
    priceUsd: 1.0,
    change24hPct: 0.01,
    color: '#26A17B',
    category: 'stable',
  },
  {
    symbol: 'USDC',
    name: 'USD Coin',
    network: 'Base',
    balance: 500,
    priceUsd: 1.0,
    change24hPct: 0.01,
    color: '#2775CA',
    category: 'stable',
  },
  {
    symbol: 'NVDA',
    name: 'Nvidia (Tokenized)',
    network: 'Ondo · Tokenized',
    balance: 3,
    priceUsd: 142.8,
    change24hPct: 4.65,
    color: '#76B900',
    category: 'stock',
  },
  ...MEMECOIN_TEMPLATES,
];

export const DEFAULT_RICH_GOALS: RichGoal[] = [
  { id: 'rich-macbook', name: 'MacBook Pro M4 Max Studio', priceUsd: 5500, category: 'Tech' },
  { id: 'rich-cartier', name: 'Cartier Santos Medium', priceUsd: 8500, category: 'Watch' },
  { id: 'rich-rolex-sub', name: 'Rolex Submariner', priceUsd: 15000, category: 'Watch' },
  { id: 'rich-monaco', name: 'Monaco GP Paddock VIP', priceUsd: 25000, category: 'Travel' },
  { id: 'rich-birkin', name: 'Hermes Birkin 25', priceUsd: 30000, category: 'Fashion' },
  { id: 'rich-daytona', name: 'Rolex Daytona Panda', priceUsd: 45000, category: 'Watch' },
  { id: 'rich-world-tour', name: 'First-Class World Tour', priceUsd: 65000, category: 'Travel' },
  { id: 'rich-plaid', name: 'Tesla Model S Plaid', priceUsd: 90000, category: 'Cars' },
  { id: 'rich-porsche-911', name: 'Porsche 911 Carrera', priceUsd: 120000, category: 'Cars' },
  { id: 'rich-patek', name: 'Patek Philippe Nautilus', priceUsd: 160000, category: 'Watch' },
  { id: 'rich-g63', name: 'Mercedes-AMG G63', priceUsd: 195000, category: 'Cars' },
  { id: 'rich-lambo', name: 'Lamborghini Huracan', priceUsd: 250000, category: 'Cars' },
  { id: 'rich-tokyo', name: 'Tokyo Luxury Condo', priceUsd: 320000, category: 'Real Estate' },
  { id: 'rich-ferrari', name: 'Ferrari 296 GTB', priceUsd: 350000, category: 'Cars' },
  { id: 'rich-rolls', name: 'Rolls-Royce Phantom', priceUsd: 500000, category: 'Cars' },
  { id: 'rich-rm', name: 'Richard Mille RM 11-03', priceUsd: 750000, category: 'Watch' },
  { id: 'rich-heli', name: 'Bell 505 Helicopter', priceUsd: 1200000, category: 'Aviation' },
  { id: 'rich-penthouse', name: 'Miami Ocean Penthouse', priceUsd: 1500000, category: 'Real Estate' },
  { id: 'rich-pagani', name: 'Pagani Utopia Hypercar', priceUsd: 2500000, category: 'Cars' },
  { id: 'rich-bugatti', name: 'Bugatti Chiron Super Sport', priceUsd: 3800000, category: 'Cars' },
  { id: 'rich-mansion', name: 'Beverly Hills Mansion', priceUsd: 5000000, category: 'Real Estate' },
  { id: 'rich-citation', name: 'Cessna Citation Private Jet', priceUsd: 8500000, category: 'Aviation' },
  { id: 'rich-yacht', name: '120ft Private Superyacht', priceUsd: 15000000, category: 'Yacht' },
  { id: 'rich-como', name: 'Lake Como Waterfront Villa', priceUsd: 22000000, category: 'Real Estate' },
  { id: 'rich-jet', name: 'Gulfstream G650 Jet', priceUsd: 45000000, category: 'Aviation' },
  { id: 'rich-megayacht', name: '250ft Benetti Megayacht', priceUsd: 80000000, category: 'Yacht' },
  { id: 'rich-island', name: 'Private Caribbean Island', priceUsd: 100000000, category: 'Real Estate' },
];

export const RICH_CATALOG: RichGoal[] = [
  ...DEFAULT_RICH_GOALS,
  { id: 'rich-vision-pro', name: 'Apple Vision Pro + Mac Rig', priceUsd: 6500, category: 'Tech' },
  { id: 'rich-omega', name: 'Omega Speedmaster Moonwatch', priceUsd: 9500, category: 'Watch' },
  { id: 'rich-chanel', name: 'Chanel Classic Double Flap', priceUsd: 11000, category: 'Fashion' },
  { id: 'rich-rig', name: 'Pro 8-Screen Trading Desk', priceUsd: 18000, category: 'Tech' },
  { id: 'rich-maldives', name: 'Maldives Overwater Villa Week', priceUsd: 22000, category: 'Travel' },
  { id: 'rich-ap-royal', name: 'Audemars Piguet Royal Oak', priceUsd: 38000, category: 'Watch' },
  { id: 'rich-lv-trunk', name: 'Louis Vuitton Malle Trunk', priceUsd: 48000, category: 'Fashion' },
  { id: 'rich-chef', name: 'Private Chef (1 Year)', priceUsd: 85000, category: 'Travel' },
  { id: 'rich-cyberbeast', name: 'Tesla Cybertruck Cyberbeast', priceUsd: 105000, category: 'Cars' },
  { id: 'rich-beolab', name: 'Bang & Olufsen Beolab 90', priceUsd: 115000, category: 'Tech' },
  { id: 'rich-antarctica', name: 'Antarctica Private Jet Tour', priceUsd: 135000, category: 'Travel' },
  { id: 'rich-gt3rs', name: 'Porsche 911 GT3 RS', priceUsd: 245000, category: 'Cars' },
  { id: 'rich-mclaren', name: 'McLaren 750S Spider', priceUsd: 335000, category: 'Cars' },
  { id: 'rich-charizard', name: '1st Ed Charizard PSA 10', priceUsd: 420000, category: 'Fashion' },
  { id: 'rich-cullinan', name: 'Rolls-Royce Cullinan Black Badge', priceUsd: 460000, category: 'Cars' },
  { id: 'rich-revuelto', name: 'Lamborghini Revuelto V12', priceUsd: 610000, category: 'Cars' },
  { id: 'rich-yacht-65', name: '65ft Sunseeker Sport Yacht', priceUsd: 2400000, category: 'Yacht' },
  { id: 'rich-jacob', name: 'Jacob & Co. Billionaire Watch', priceUsd: 3500000, category: 'Watch' },
  { id: 'rich-aspen', name: 'Aspen Ski-In Chalet', priceUsd: 4200000, category: 'Real Estate' },
  { id: 'rich-manhattan', name: 'Manhattan Sky Penthouse', priceUsd: 12000000, category: 'Real Estate' },
  { id: 'rich-team', name: 'Pro Sports Team Stake', priceUsd: 25000000, category: 'Travel' },
  { id: 'rich-picasso', name: 'Museum-Grade Picasso Canvas', priceUsd: 35000000, category: 'Fashion' },
  { id: 'rich-spacex', name: 'SpaceX Orbital Flight Seat', priceUsd: 55000000, category: 'Aviation' },
  { id: 'rich-bbj', name: 'Boeing Business Jet 737', priceUsd: 90000000, category: 'Aviation' },
];


