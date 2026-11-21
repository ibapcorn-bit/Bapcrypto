export type Timeframe = '1H' | '1D' | '1W' | '1M' | '1Y' | 'ALL';

export type ChartShape =
  | 'bull'
  | 'parabolic'
  | 'steady'
  | 'dip_recovery'
  | 'volatile'
  | 'crash';

export type NetworkType =
  | 'Multi-Chain'
  | 'Ethereum'
  | 'Solana'
  | 'Bitcoin'
  | 'Base'
  | 'Arbitrum';

export interface PriceHistoryEntry {
  id: string;
  priceUsd: number;
  changePct: number;
  timestampLabel: string;
}

export interface TokenHolding {
  id: string;
  symbol: string;
  name: string;
  network: string;
  balance: number;
  priceUsd: number;
  change24hPct: number;
  color: string;
  sparkline: number[];
  priceHistory?: PriceHistoryEntry[];
  category?: 'layer1' | 'stable' | 'defi' | 'memecoin' | 'stock';
}

export type TransactionType = 'receive' | 'send' | 'swap' | 'buy' | 'sell' | 'hype';

export interface CryptoTransaction {
  id: string;
  type: TransactionType;
  symbol: string;
  amount: number;
  usdValue: number;
  toSymbol?: string;
  toAmount?: number;
  counterparty: string;
  timestampLabel: string;
  status: 'Confirmed' | 'Pending';
  txHash: string;
  headline?: string;
  sentiment?: 'bullish' | 'bearish';
  impactPct?: number;
}

export type WalletUiStyle =
  | 'candles'
  | 'phantom'
  | 'coinbase'
  | 'neurobro'
  | 'exodus'
  | 'mt5'
  | 'okx';

export interface WalletProfile {
  name: string;
  address: string;
  network: NetworkType;
  useManualTotal: boolean;
  manualTotalBalance: number;
  manualChangeUsd: number;
  manualChangePct: number;
  chartShape: ChartShape;
  liveTick: boolean;
  hideBalances: boolean;
  stealthMode: boolean;
  biometricLockEnabled?: boolean;
  biometricMethod?: 'faceid' | 'fingerprint';
  uiStyle?: WalletUiStyle;
}

export interface PriceAlert {
  id: string;
  symbol: string;
  name: string;
  targetPriceUsd: number;
  condition: 'above' | 'below';
  active: boolean;
  triggeredAt?: string;
}

export interface RichGoal {
  id: string;
  name: string;
  priceUsd: number;
  category: string;
}

export interface PortfolioState {
  profile: WalletProfile;
  holdings: TokenHolding[];
  transactions: CryptoTransaction[];
  priceAlerts?: PriceAlert[];
  richGoals?: RichGoal[];
}

export interface PortfolioPreset {
  id: string;
  label: string;
  subtitle: string;
  state: PortfolioState;
}
