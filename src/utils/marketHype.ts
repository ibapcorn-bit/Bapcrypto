import {
  buildPriceHistory,
  ensureTokenPriceHistory,
  sparklineFromHistory,
} from '../data/presets';
import {
  ChartShape,
  CryptoTransaction,
  PortfolioState,
  PriceHistoryEntry,
  TokenHolding,
} from '../types/crypto';

export interface DailyMarketHype {
  id: string;
  dateKey: string;
  headline: string;
  summary: string;
  targetSymbol: string;
  targetName: string;
  sentiment: 'bullish' | 'bearish';
  impactPct: number;
  createdAt: number;
}

interface HypeTemplate {
  sentiment: 'bullish' | 'bearish';
  minPct: number;
  maxPct: number;
  buildHeadline: (name: string, symbol: string) => string;
  buildSummary: (name: string, symbol: string) => string;
}

const MARKET_HYPE_TEMPLATES: HypeTemplate[] = [
  {
    sentiment: 'bullish',
    minPct: 8,
    maxPct: 19,
    buildHeadline: (name, symbol) =>
      `Market Hype: Sovereign Desk Accumulates ${name} (${symbol}) Ahead of Liquidity Expansion`,
    buildSummary: (_name, symbol) =>
      `Heavy OTC inflows and rising perpetual funding spark aggressive ${symbol} spot buying.`,
  },
  {
    sentiment: 'bullish',
    minPct: 10,
    maxPct: 24,
    buildHeadline: (name, symbol) =>
      `Market Hype: Record Institutional Inflows Propel ${symbol} Breakout on Spot Desks`,
    buildSummary: (name, symbol) =>
      `Net inflows across major custody venues drive a sharp sentiment rally in ${name} (${symbol}).`,
  },
  {
    sentiment: 'bullish',
    minPct: 6,
    maxPct: 15,
    buildHeadline: (name, symbol) =>
      `Market Hype: ${name} Ecosystem Upgrade Triggers Viral On-Chain Activity Surge`,
    buildSummary: (_name, symbol) =>
      `Active addresses and DEX volumes spike, squeezing short positioning across ${symbol} pairs.`,
  },
  {
    sentiment: 'bullish',
    minPct: 7,
    maxPct: 18,
    buildHeadline: (name, symbol) =>
      `Market Hype: Whale Wallets Pull $420M in ${symbol} Off Exchanges in Supply Crunch`,
    buildSummary: (name, symbol) =>
      `Exchange reserves hit multi-month lows as long-term ${name} (${symbol}) holders lock supply.`,
  },
  {
    sentiment: 'bullish',
    minPct: 9,
    maxPct: 21,
    buildHeadline: (name, symbol) =>
      `Market Hype: Major Treasury Allocation Names ${name} (${symbol}) Top Reserve Asset`,
    buildSummary: (_name, symbol) =>
      `Corporate treasury disclosure ignites broad risk-on momentum across ${symbol} markets.`,
  },
  {
    sentiment: 'bullish',
    minPct: 6,
    maxPct: 14,
    buildHeadline: (name, symbol) =>
      `Market Hype: Macro Risk-On Pivot Sends ${symbol} Short Squeeze Past Key Resistance`,
    buildSummary: (name, symbol) =>
      `Forced short liquidations amplify upside price discovery for ${name} (${symbol}).`,
  },
  {
    sentiment: 'bearish',
    minPct: -15,
    maxPct: -6,
    buildHeadline: (name, symbol) =>
      `Market Hype: Sudden Whale Deposit Spooks ${symbol} Bulls, Triggering Leverage Flush`,
    buildSummary: (name, symbol) =>
      `Elevated exchange inflows cool overheated ${name} (${symbol}) open interest.`,
  },
  {
    sentiment: 'bearish',
    minPct: -13,
    maxPct: -5,
    buildHeadline: (name, symbol) =>
      `Market Hype: Hot Macro Print Sparks Risk-Off Pullback Across ${name} (${symbol})`,
    buildSummary: (_name, symbol) =>
      `Short-term momentum traders trim ${symbol} exposure ahead of derivatives expiry.`,
  },
  {
    sentiment: 'bearish',
    minPct: -17,
    maxPct: -7,
    buildHeadline: (name, symbol) =>
      `Market Hype: Profit-Taking Wave Hits ${symbol} After Multi-Day Euphoric Run`,
    buildSummary: (name, symbol) =>
      `High-leverage longs unwind rapidly as ${name} (${symbol}) tests lower support.`,
  },
];

export function getTodayDateKey(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function hashSeed(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function seededUnit(seed: number, salt: number): number {
  const x = Math.sin(seed + salt * 9301 + 49297) * 233280;
  return x - Math.floor(x);
}

/**
 * Generates a daily "Market Hype" news headline and sentiment-driven price impact
 * tailored to the user's current holdings.
 */
export function generateDailyMarketHype(
  holdings: TokenHolding[],
  date: Date = new Date(),
  variation = 0
): DailyMarketHype {
  const dateKey = getTodayDateKey(date);
  const candidates = holdings.filter(
    (h) => h.symbol.toUpperCase() !== 'USDC' && h.symbol.toUpperCase() !== 'USDT'
  );
  const pool = candidates.length > 0 ? candidates : holdings;
  const seed = hashSeed(`${dateKey}-hype-${variation}`);

  const target =
    pool[seed % Math.max(1, pool.length)] || {
      symbol: 'BTC',
      name: 'Bitcoin',
    };

  const templateIdx =
    Math.floor(seededUnit(seed, 1) * MARKET_HYPE_TEMPLATES.length) %
    MARKET_HYPE_TEMPLATES.length;
  const tpl = MARKET_HYPE_TEMPLATES[templateIdx];

  const unit = seededUnit(seed, 2);
  const rawPct = tpl.minPct + unit * (tpl.maxPct - tpl.minPct);
  const impactPct = Number(rawPct.toFixed(2));

  return {
    id: `hype-${dateKey}-${variation}-${seed.toString(36)}`,
    dateKey,
    headline: tpl.buildHeadline(target.name, target.symbol),
    summary: tpl.buildSummary(target.name, target.symbol),
    targetSymbol: target.symbol,
    targetName: target.name,
    sentiment: tpl.sentiment,
    impactPct,
    createdAt: date.getTime(),
  };
}

function formatPriceForPrecision(price: number): number {
  if (price < 0.01) return Number(price.toFixed(8));
  if (price < 1) return Number(price.toFixed(4));
  return Number(price.toFixed(2));
}

/**
 * Applies sentiment-driven price action from a Market Hype headline to portfolio holdings
 * and automatically prepends the Market Hype item to the activity feed.
 */
export function applyDailyMarketHype(
  prev: PortfolioState,
  hype: DailyMarketHype
): { nextState: PortfolioState; hypeTx: CryptoTransaction } {
  const nowLabel = new Date(hype.createdAt).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  let updatedTargetPrice = 0;

  const nextHoldings = prev.holdings.map((h, idx) => {
    const upper = h.symbol.toUpperCase();
    if (upper === 'USDC' || upper === 'USDT') return h;

    const isTarget = upper === hype.targetSymbol.toUpperCase();
    const ripplePct = isTarget
      ? hype.impactPct
      : Number((hype.impactPct * (0.28 + ((idx % 3) * 0.08))).toFixed(2));

    const multiplier = Math.max(0.2, 1 + ripplePct / 100);
    const nextPrice = Math.max(0.000001, h.priceUsd * multiplier);
    if (isTarget) {
      updatedTargetPrice = nextPrice;
    }

    const baseHistory =
      h.priceHistory && h.priceHistory.length > 0
        ? ensureTokenPriceHistory(h)
        : buildPriceHistory(h.priceUsd, h.change24hPct, 8, idx + 1);

    const newEntry: PriceHistoryEntry = {
      id: `ph-hype-${hype.id}-${h.symbol}`,
      priceUsd: formatPriceForPrecision(nextPrice),
      changePct: ripplePct,
      timestampLabel: nowLabel,
    };

    const nextHistory = [newEntry, ...baseHistory].slice(0, 24);
    return {
      ...h,
      priceUsd: nextPrice,
      change24hPct: Number((h.change24hPct + ripplePct).toFixed(2)),
      priceHistory: nextHistory,
      sparkline: sparklineFromHistory(nextHistory, nextPrice),
    };
  });

  if (updatedTargetPrice <= 0) {
    const matched = nextHoldings.find(
      (h) => h.symbol.toUpperCase() === hype.targetSymbol.toUpperCase()
    );
    updatedTargetPrice = matched?.priceUsd || 0;
  }

  const nextChartShape: ChartShape =
    hype.sentiment === 'bullish'
      ? Math.abs(hype.impactPct) >= 14
        ? 'parabolic'
        : 'bull'
      : Math.abs(hype.impactPct) >= 12
      ? 'crash'
      : 'dip_recovery';

  let nextProfile = {
    ...prev.profile,
    chartShape: nextChartShape,
  };

  if (prev.profile.useManualTotal) {
    const portfolioImpactPct = hype.impactPct * 0.45;
    const deltaUsd = prev.profile.manualTotalBalance * (portfolioImpactPct / 100);
    nextProfile = {
      ...nextProfile,
      manualTotalBalance: Math.max(
        0.01,
        Number((prev.profile.manualTotalBalance + deltaUsd).toFixed(2))
      ),
      manualChangeUsd: Number(
        (prev.profile.manualChangeUsd + deltaUsd).toFixed(2)
      ),
      manualChangePct: Number(
        (prev.profile.manualChangePct + portfolioImpactPct).toFixed(2)
      ),
    };
  }

  const hypeTx: CryptoTransaction = {
    id: `tx-${hype.id}`,
    type: 'hype',
    symbol: hype.targetSymbol,
    amount: Math.abs(hype.impactPct),
    usdValue: updatedTargetPrice,
    counterparty:
      hype.sentiment === 'bullish'
        ? 'Market Hype · Bullish Catalyst'
        : 'Market Hype · Bearish Catalyst',
    timestampLabel: nowLabel,
    status: 'Confirmed',
    txHash: hype.summary,
    headline: hype.headline,
    sentiment: hype.sentiment,
    impactPct: hype.impactPct,
  };

  return {
    nextState: {
      ...prev,
      profile: nextProfile,
      holdings: nextHoldings,
      transactions: [hypeTx, ...prev.transactions],
    },
    hypeTx,
  };
}
