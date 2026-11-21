import React, { useCallback, useEffect, useRef, useState } from 'react';
import jsQR from 'jsqr';
import {
  Trash2,
  Copy,
  Check,
  ArrowDownLeft,
  Bell,
  ScanLine,
  Camera,
  X,
  ImagePlus,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  RotateCcw,
  Sun,
  Moon,
  Search,
} from 'lucide-react';
import { BottomSheet } from './BottomSheet';
import {
  ChartShape,
  CryptoTransaction,
  NetworkType,
  PriceHistoryEntry,
  TokenHolding,
  TransactionType,
  WalletProfile,
  WalletUiStyle,
} from '../types/crypto';
import {
  buildPriceHistory,
  CRYPTO_TEMPLATES,
  ensureTokenPriceHistory,
  makeSparkline,
  MEMECOIN_TEMPLATES,
  sparklineFromHistory,
} from '../data/presets';
import { UI_THEME_LIST } from '../data/uiThemes';
import { TokenIcon } from './TokenIcon';
import { Sparkline } from './Sparkline';
import { formatTokenAmount, formatUsd } from '../utils/format';

interface WalletEditModalProps {
  open: boolean;
  onClose: () => void;
  profile: WalletProfile;
  calculatedTotal: number;
  calculatedChangeUsd: number;
  calculatedChangePct: number;
  onSave: (updated: WalletProfile) => void;
  onPreviewUiStyle?: (style: WalletUiStyle) => void;
  isDark?: boolean;
  onToggleTheme?: () => void;
}

const CHART_SHAPES: { id: ChartShape; label: string }[] = [
  { id: 'bull', label: 'Bull Run' },
  { id: 'parabolic', label: 'Parabolic' },
  { id: 'steady', label: 'Steady Climb' },
  { id: 'dip_recovery', label: 'Dip & Bounce' },
  { id: 'volatile', label: 'Volatile' },
  { id: 'crash', label: 'Crash' },
];

const NETWORKS: NetworkType[] = [
  'Multi-Chain',
  'Ethereum',
  'Solana',
  'Bitcoin',
  'Base',
  'Arbitrum',
];

export const WalletEditModal: React.FC<WalletEditModalProps> = ({
  open,
  onClose,
  profile,
  calculatedTotal,
  calculatedChangeUsd,
  calculatedChangePct,
  onSave,
  onPreviewUiStyle,
  isDark = true,
  onToggleTheme,
}) => {
  const [form, setForm] = useState<WalletProfile>(profile);
  const wasOpenRef = useRef(false);

  useEffect(() => {
    if (open && !wasOpenRef.current) {
      setForm(profile);
    }
    wasOpenRef.current = open;
  }, [open, profile]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(form);
    onClose();
  };

  const activeUiStyle: WalletUiStyle = form.uiStyle || 'candles';

  return (
    <BottomSheet open={open} onClose={onClose} title="Account & Interface">
      <form onSubmit={handleSubmit} className="space-y-4">
        {onToggleTheme && (
          <button
            type="button"
            onClick={onToggleTheme}
            className="w-full min-h-[44px] px-3 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-100/80 dark:bg-slate-800/60 hover:bg-slate-200/70 dark:hover:bg-slate-800 text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
          >
            {isDark ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-indigo-500" />
            )}
            <span>Theme: {isDark ? 'Dark Mode' : 'Light Mode'}</span>
          </button>
        )}

        <div>
          <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">
            Interface UI Style
          </label>
          <div className="grid grid-cols-2 gap-2">
            {UI_THEME_LIST.map((theme) => {
              const selected = activeUiStyle === theme.id;
              return (
                <button
                  key={theme.id}
                  type="button"
                  onClick={() => {
                    setForm((prev) => ({ ...prev, uiStyle: theme.id }));
                    onPreviewUiStyle?.(theme.id);
                  }}
                  className={`min-h-[54px] p-2.5 rounded-xl border text-left transition-all flex items-center gap-2.5 ${
                    selected
                      ? 'border-blue-500 bg-blue-600/10 ring-1 ring-blue-500/40'
                      : 'border-slate-200 dark:border-slate-700/80 bg-slate-100/80 dark:bg-slate-800/60 hover:bg-slate-200/60 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="flex flex-col gap-1 shrink-0" aria-hidden="true">
                    <span
                      className="w-5 h-2.5 rounded-sm border border-black/15"
                      style={{ backgroundColor: theme.swatches[0] }}
                    />
                    <div className="flex gap-1">
                      <span
                        className="w-2.5 h-2 rounded-sm"
                        style={{ backgroundColor: theme.swatches[1] }}
                      />
                      <span
                        className="w-2 h-2 rounded-sm"
                        style={{ backgroundColor: theme.swatches[2] }}
                      />
                    </div>
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold truncate">
                      {theme.label}
                    </p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                      {theme.tagline}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">
              Wallet Name
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full h-11 px-3 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">
              Address Label
            </label>
            <input
              type="text"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              className="w-full h-11 px-3 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">
            Primary Network
          </label>
          <div className="grid grid-cols-3 gap-2">
            {NETWORKS.map((net) => (
              <button
                key={net}
                type="button"
                onClick={() => setForm({ ...form, network: net })}
                className={`min-h-[40px] px-2 rounded-xl text-xs font-medium transition-colors border ${
                  form.network === net
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-slate-100 dark:bg-slate-800/70 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700/70'
                }`}
              >
                {net}
              </button>
            ))}
          </div>
        </div>

        <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm font-medium">Custom Total Override</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {form.useManualTotal
                  ? 'Set any headline balance regardless of token sum'
                  : `Auto-summed from holdings (${formatUsd(calculatedTotal)})`}
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                setForm({
                  ...form,
                  useManualTotal: !form.useManualTotal,
                  manualTotalBalance: form.useManualTotal
                    ? form.manualTotalBalance
                    : Number(calculatedTotal.toFixed(2)),
                  manualChangeUsd: form.useManualTotal
                    ? form.manualChangeUsd
                    : Number(calculatedChangeUsd.toFixed(2)),
                  manualChangePct: form.useManualTotal
                    ? form.manualChangePct
                    : Number(calculatedChangePct.toFixed(2)),
                })
              }
              className={`min-w-[52px] h-8 rounded-full p-1 transition-colors flex items-center ${
                form.useManualTotal
                  ? 'bg-blue-600 justify-end'
                  : 'bg-slate-300 dark:bg-slate-700 justify-start'
              }`}
              aria-label="Toggle custom balance override"
            >
              <span className="w-6 h-6 rounded-full bg-white shadow-sm" />
            </button>
          </div>

          {form.useManualTotal && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">
                  Headline Balance (USD)
                </label>
                <input
                  type="number"
                  step="any"
                  value={form.manualTotalBalance}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      manualTotalBalance: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-full h-11 px-3 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-base font-mono tabular-nums focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">
                    24h Change ($)
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={form.manualChangeUsd}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        manualChangeUsd: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full h-11 px-3 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-sm font-mono tabular-nums focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">
                    24h Change (%)
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={form.manualChangePct}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        manualChangePct: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full h-11 px-3 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-sm font-mono tabular-nums focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">
            Chart Curve Pattern
          </label>
          <div className="grid grid-cols-3 gap-2">
            {CHART_SHAPES.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setForm({ ...form, chartShape: s.id })}
                className={`min-h-[40px] px-2 rounded-xl text-xs font-medium transition-colors border ${
                  form.chartShape === s.id
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-slate-100 dark:bg-slate-800/70 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700/70'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <button
          type="submit"
          className="w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm transition-colors"
        >
          Apply Changes
        </button>
      </form>
    </BottomSheet>
  );
};

interface TokenEditModalProps {
  open: boolean;
  onClose: () => void;
  token: TokenHolding | null;
  onSave: (token: TokenHolding) => void;
  onDelete?: (id: string) => void;
  onOpenPriceAlert?: (symbol: string) => void;
}

const TOKEN_COLORS = [
  '#F7931A',
  '#627EEA',
  '#14F195',
  '#2775CA',
  '#375BD2',
  '#EC4899',
  '#A855F7',
  '#10B981',
];

export const TokenEditModal: React.FC<TokenEditModalProps> = ({
  open,
  onClose,
  token,
  onSave,
  onDelete,
  onOpenPriceAlert,
}) => {
  const isNew = !token;
  const [symbol, setSymbol] = useState('PEPE');
  const [name, setName] = useState('Pepe');
  const [network, setNetwork] = useState('Ethereum');
  const [balance, setBalance] = useState('1000');
  const [priceUsd, setPriceUsd] = useState('1.00');
  const [change24hPct, setChange24hPct] = useState('12.5');
  const [color, setColor] = useState('#10B981');
  const [priceHistory, setPriceHistory] = useState<PriceHistoryEntry[]>([]);
  const [templateCat, setTemplateCat] = useState<'all' | 'layer1' | 'defi' | 'memecoin'>('all');
  const [templateSearch, setTemplateSearch] = useState('');
  const wasOpenRef = useRef(false);
  const lastTokenIdRef = useRef<string | null>(null);

  useEffect(() => {
    const currentId = token?.id || null;
    if (open && (!wasOpenRef.current || lastTokenIdRef.current !== currentId)) {
      if (token) {
        setSymbol(token.symbol);
        setName(token.name);
        setNetwork(token.network);
        setBalance(String(token.balance));
        setPriceUsd(String(token.priceUsd));
        setChange24hPct(String(token.change24hPct));
        setColor(token.color);
        setPriceHistory(ensureTokenPriceHistory(token));
      } else {
        setSymbol('SUI');
        setName('Sui');
        setNetwork('Sui Network');
        setBalance('4500');
        setPriceUsd('3.85');
        setChange24hPct('14.2');
        setColor('#3B82F6');
        setPriceHistory(buildPriceHistory(3.85, 14.2, 8, 83));
      }
    }
    wasOpenRef.current = open;
    lastTokenIdRef.current = currentId;
  }, [open, token]);

  const parsedBalance = parseFloat(balance) || 0;
  const parsedPrice = parseFloat(priceUsd) || 0;
  const parsedChange = parseFloat(change24hPct) || 0;
  const previewValue = parsedBalance * parsedPrice;
  const previewSparkline =
    priceHistory.length > 0
      ? sparklineFromHistory(priceHistory, parsedPrice)
      : makeSparkline(parsedChange, 12, symbol.charCodeAt(0) || 1);

  const buildUpdatedToken = (
    nextHistory: PriceHistoryEntry[],
    nextPrice: number,
    nextChange: number
  ): TokenHolding => {
    const cleanSymbol = symbol.trim().toUpperCase() || 'TOKEN';
    const isMeme =
      token?.category === 'memecoin' ||
      MEMECOIN_TEMPLATES.some((m) => m.symbol === cleanSymbol);
    const nextSparkline =
      nextHistory.length > 0
        ? sparklineFromHistory(nextHistory, nextPrice)
        : makeSparkline(nextChange, 20, cleanSymbol.charCodeAt(0));
    return {
      id: token?.id || `token-${Date.now()}`,
      symbol: cleanSymbol,
      name: name.trim() || cleanSymbol,
      network: network.trim() || 'Ethereum',
      balance: parsedBalance,
      priceUsd: nextPrice,
      change24hPct: nextChange,
      color,
      sparkline: nextSparkline,
      priceHistory: nextHistory,
      category: isMeme
        ? 'memecoin'
        : cleanSymbol === 'NVDA' || cleanSymbol === 'NVDAX'
        ? 'stock'
        : token?.category,
    };
  };

  const handleDeleteHistoryEntry = (entryId: string, idx: number) => {
    const nextHistory = priceHistory.filter((item) => item.id !== entryId);
    let nextPrice = parsedPrice;
    let nextChange = parsedChange;

    if (nextHistory.length > 0) {
      if (idx === 0) {
        nextPrice = nextHistory[0].priceUsd;
        setPriceUsd(String(nextPrice));
      }
      if (nextHistory.length >= 2) {
        const oldest = nextHistory[nextHistory.length - 1].priceUsd;
        const newest = nextHistory[0].priceUsd;
        if (oldest > 0) {
          nextChange = Number((((newest - oldest) / oldest) * 100).toFixed(2));
          setChange24hPct(String(nextChange));
        }
      } else {
        nextChange = nextHistory[0].changePct;
        setChange24hPct(String(nextChange));
      }
    }

    setPriceHistory(nextHistory);

    if (!isNew && token) {
      onSave(buildUpdatedToken(nextHistory, nextPrice, nextChange));
    }
  };

  const handleResetHistory = () => {
    const seed =
      (symbol.charCodeAt(0) || 7) + Math.floor(Math.random() * 40);
    const nextHistory = buildPriceHistory(parsedPrice, parsedChange, 8, seed);
    setPriceHistory(nextHistory);
    if (!isNew && token) {
      onSave(buildUpdatedToken(nextHistory, parsedPrice, parsedChange));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(buildUpdatedToken(priceHistory, parsedPrice, parsedChange));
    onClose();
  };

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title={isNew ? 'Add Custom Token' : `Edit ${token?.symbol}`}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {isNew && (
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Quick Add Crypto
              </p>
              <div className="flex items-center gap-1">
                {(
                  [
                    { id: 'all', label: 'All' },
                    { id: 'layer1', label: 'L1' },
                    { id: 'defi', label: 'DeFi' },
                    { id: 'memecoin', label: 'Memes' },
                  ] as const
                ).map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setTemplateCat(c.id)}
                    className={`px-2 py-1 rounded-lg text-[11px] font-semibold transition-colors ${
                      templateCat === c.id
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={templateSearch}
                onChange={(e) => setTemplateSearch(e.target.value)}
                placeholder="Search crypto to add (BTC, SUI, TAO, PEPE...)"
                className="w-full h-9 pl-8 pr-8 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {templateSearch && (
                <button
                  type="button"
                  onClick={() => setTemplateSearch('')}
                  aria-label="Clear crypto search"
                  className="w-6 h-6 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-600 absolute right-1.5 top-1/2 -translate-y-1/2"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
              {CRYPTO_TEMPLATES.filter((t) => {
                const matchCat =
                  templateCat === 'all' || t.category === templateCat;
                const q = templateSearch.trim().toLowerCase();
                if (!matchCat) return false;
                if (!q) return true;
                return (
                  t.symbol.toLowerCase().includes(q) ||
                  t.name.toLowerCase().includes(q)
                );
              }).map((m) => (
                <button
                  key={m.symbol}
                  type="button"
                  onClick={() => {
                    setSymbol(m.symbol);
                    setName(m.name);
                    setNetwork(m.network);
                    setBalance(String(m.balance));
                    setPriceUsd(String(m.priceUsd));
                    setChange24hPct(String(m.change24hPct));
                    setColor(m.color);
                    setPriceHistory(
                      buildPriceHistory(
                        m.priceUsd,
                        m.change24hPct,
                        8,
                        m.symbol.charCodeAt(0) || 1
                      )
                    );
                  }}
                  className="h-9 px-3 rounded-xl bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-800 text-xs font-semibold flex items-center gap-1.5 shrink-0 transition-colors"
                >
                  <TokenIcon symbol={m.symbol} color={m.color} size={20} />
                  {m.symbol}
                </button>
              ))}
            </div>
          </div>
        )}
        <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800/70">
          <div className="flex items-center gap-3">
            <TokenIcon symbol={symbol || 'T'} color={color} size={40} />
            <div>
              <p className="text-sm font-semibold">{name || 'Token Name'}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {formatTokenAmount(parsedBalance)} {symbol.toUpperCase() || 'SYM'}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-base font-semibold tabular-nums">
              {formatUsd(previewValue)}
            </p>
            <p
              className={`text-xs font-medium tabular-nums ${
                parsedChange >= 0 ? 'text-emerald-500' : 'text-rose-500'
              }`}
            >
              {parsedChange >= 0 ? '+' : ''}
              {parsedChange.toFixed(2)}%
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">
              Ticker Symbol
            </label>
            <input
              type="text"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value.toUpperCase())}
              className="w-full h-11 px-3 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-sm font-semibold uppercase focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">
              Token Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full h-11 px-3 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">
              Quantity Held
            </label>
            <input
              type="number"
              step="any"
              value={balance}
              onChange={(e) => setBalance(e.target.value)}
              className="w-full h-11 px-3 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-sm font-mono tabular-nums focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">
              Price (USD)
            </label>
            <input
              type="number"
              step="any"
              value={priceUsd}
              onChange={(e) => setPriceUsd(e.target.value)}
              className="w-full h-11 px-3 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-sm font-mono tabular-nums focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">
              24h Change (%)
            </label>
            <input
              type="number"
              step="any"
              value={change24hPct}
              onChange={(e) => setChange24hPct(e.target.value)}
              className="w-full h-11 px-3 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-sm font-mono tabular-nums focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">
              Network
            </label>
            <input
              type="text"
              value={network}
              onChange={(e) => setNetwork(e.target.value)}
              className="w-full h-11 px-3 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">
            Badge Accent Color
          </label>
          <div className="flex items-center gap-2.5">
            {TOKEN_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                style={{ backgroundColor: c }}
                className={`w-8 h-8 rounded-full transition-transform ${
                  color === c ? 'ring-2 ring-offset-2 ring-blue-500 scale-110 dark:ring-offset-[#12161F]' : ''
                }`}
                aria-label={`Select color ${c}`}
              />
            ))}
          </div>
        </div>

        {/* Simulated Price History Section */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-100">
                Price History
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 tabular-nums">
                {priceHistory.length}{' '}
                {priceHistory.length === 1 ? 'movement' : 'movements'} · Tap entry to delete
              </p>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              <Sparkline
                data={previewSparkline}
                positive={parsedChange >= 0}
                width={56}
                height={20}
              />
              <button
                type="button"
                onClick={handleResetHistory}
                aria-label="Regenerate price history"
                className="min-h-[34px] px-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-[11px] font-medium text-slate-600 dark:text-slate-300 flex items-center gap-1 transition-colors whitespace-nowrap"
              >
                <RotateCcw className="w-3 h-3" />
                Reset
              </button>
            </div>
          </div>

          {priceHistory.length === 0 ? (
            <div className="p-4 rounded-xl bg-slate-100/80 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/70 text-center text-xs text-slate-500 dark:text-slate-400">
              All price history entries removed.
            </div>
          ) : (
            <div className="max-h-48 overflow-y-auto rounded-xl bg-slate-100/80 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/70 divide-y divide-slate-200/70 dark:divide-slate-700/60">
              {priceHistory.map((entry, idx) => {
                const up = entry.changePct >= 0;
                return (
                  <button
                    key={entry.id}
                    type="button"
                    onClick={() => handleDeleteHistoryEntry(entry.id, idx)}
                    aria-label={`Delete price movement at ${entry.timestampLabel}`}
                    className="w-full min-h-[44px] px-3 py-2 flex items-center justify-between gap-2 text-left hover:bg-rose-500/10 active:bg-rose-500/15 transition-colors group"
                  >
                    <span className="text-xs text-slate-500 dark:text-slate-400 tabular-nums shrink-0">
                      {entry.timestampLabel}
                    </span>

                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-xs font-semibold font-mono tabular-nums truncate">
                        {formatUsd(entry.priceUsd)}
                      </span>
                      <span
                        className={`text-[11px] font-medium tabular-nums inline-flex items-center gap-0.5 shrink-0 ${
                          up ? 'text-emerald-500' : 'text-rose-500'
                        }`}
                      >
                        {up ? (
                          <ArrowUpRight className="w-3 h-3" />
                        ) : (
                          <ArrowDownRight className="w-3 h-3" />
                        )}
                        {up ? '+' : ''}
                        {entry.changePct.toFixed(2)}%
                      </span>
                      <Trash2 className="w-3.5 h-3.5 text-slate-400 group-hover:text-rose-500 transition-colors shrink-0" />
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2.5 pt-2">
          {!isNew && onDelete && token && (
            <button
              type="button"
              onClick={() => {
                onDelete(token.id);
                onClose();
              }}
              className="h-12 px-3.5 rounded-xl bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 font-medium text-sm flex items-center justify-center gap-1.5 transition-colors"
              aria-label="Remove asset"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
          {!isNew && onOpenPriceAlert && token && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenPriceAlert(token.symbol);
              }}
              className="h-12 px-3.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 font-medium text-xs flex items-center justify-center gap-1.5 transition-colors shrink-0"
            >
              <Bell className="w-4 h-4 text-blue-500" />
              Alert
            </button>
          )}
          <button
            type="submit"
            className="flex-1 h-12 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm transition-colors"
          >
            {isNew ? 'Add Asset' : 'Save Asset'}
          </button>
        </div>
      </form>
    </BottomSheet>
  );
};

interface TxEditModalProps {
  open: boolean;
  onClose: () => void;
  tx: CryptoTransaction | null;
  holdings: TokenHolding[];
  onSave: (tx: CryptoTransaction) => void;
  onDelete?: (id: string) => void;
}

export const TxEditModal: React.FC<TxEditModalProps> = ({
  open,
  onClose,
  tx,
  holdings,
  onSave,
  onDelete,
}) => {
  const isNew = !tx;
  const [type, setType] = useState<TransactionType>('receive');
  const [symbol, setSymbol] = useState(holdings[0]?.symbol || 'SOL');
  const [amount, setAmount] = useState('100');
  const [usdValue, setUsdValue] = useState('21480');
  const [counterparty, setCounterparty] = useState('Coinbase Custody');
  const [timestampLabel, setTimestampLabel] = useState('Just now');
  const [status, setStatus] = useState<'Confirmed' | 'Pending'>('Confirmed');
  const [headline, setHeadline] = useState('');

  useEffect(() => {
    if (open) {
      if (tx) {
        setType(tx.type);
        setSymbol(tx.symbol);
        setAmount(String(tx.amount));
        setUsdValue(String(tx.usdValue));
        setCounterparty(tx.counterparty);
        setTimestampLabel(tx.timestampLabel);
        setStatus(tx.status);
        setHeadline(tx.headline || '');
      } else {
        setType('receive');
        const first = holdings[0];
        setSymbol(first?.symbol || 'SOL');
        setAmount('50');
        setUsdValue(String(Math.round((first?.priceUsd || 200) * 50)));
        setCounterparty('Coinbase Prime');
        setTimestampLabel('Just now');
        setStatus('Confirmed');
        setHeadline('');
      }
    }
  }, [open, tx, holdings]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanHeadline = headline.trim();
    const numericImpact = parseFloat(amount) || 0;
    onSave({
      id: tx?.id || `tx-${Date.now()}`,
      type,
      symbol: symbol.trim().toUpperCase() || 'ETH',
      amount: numericImpact,
      usdValue: parseFloat(usdValue) || 0,
      toSymbol: tx?.toSymbol,
      toAmount: tx?.toAmount,
      counterparty: counterparty.trim() || '0x71C...9A4F',
      timestampLabel: timestampLabel.trim() || 'Just now',
      status,
      txHash: tx?.txHash || `0x${Math.random().toString(16).slice(2, 6)}...${Math.random().toString(16).slice(2, 6)}`,
      headline: type === 'hype' ? cleanHeadline || tx?.headline : tx?.headline,
      sentiment:
        type === 'hype'
          ? tx?.sentiment || (numericImpact >= 0 ? 'bullish' : 'bearish')
          : tx?.sentiment,
      impactPct: type === 'hype' ? tx?.impactPct ?? numericImpact : tx?.impactPct,
    });
    onClose();
  };

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title={isNew ? 'Add Transaction' : 'Edit Transaction'}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">
            Type
          </label>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
            {(['receive', 'send', 'swap', 'buy', 'sell', 'hype'] as TransactionType[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className={`min-h-[40px] rounded-xl text-xs font-medium capitalize border transition-colors ${
                  type === t
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-slate-100 dark:bg-slate-800/70 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700/70'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {type === 'hype' && (
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">
              Market Hype Headline
            </label>
            <input
              type="text"
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              placeholder="Market Hype: Institutional Inflows Propel Breakout"
              className="w-full h-11 px-3 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">
              Token Symbol
            </label>
            <input
              type="text"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value.toUpperCase())}
              className="w-full h-11 px-3 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-sm font-semibold uppercase focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">
              Token Amount
            </label>
            <input
              type="number"
              step="any"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full h-11 px-3 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-sm font-mono tabular-nums focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">
              USD Value ($)
            </label>
            <input
              type="number"
              step="any"
              value={usdValue}
              onChange={(e) => setUsdValue(e.target.value)}
              className="w-full h-11 px-3 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-sm font-mono tabular-nums focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">
              Time Label
            </label>
            <input
              type="text"
              value={timestampLabel}
              onChange={(e) => setTimestampLabel(e.target.value)}
              className="w-full h-11 px-3 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">
              From / To Label
            </label>
            <input
              type="text"
              value={counterparty}
              onChange={(e) => setCounterparty(e.target.value)}
              className="w-full h-11 px-3 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">
              Status
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(['Confirmed', 'Pending'] as const).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatus(st)}
                  className={`h-11 rounded-xl text-xs font-medium border transition-colors ${
                    status === st
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'bg-slate-100 dark:bg-slate-800/70 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700/70'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 pt-2">
          {!isNew && onDelete && tx && (
            <button
              type="button"
              onClick={() => {
                onDelete(tx.id);
                onClose();
              }}
              className="h-12 px-4 rounded-xl bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 font-medium text-sm flex items-center justify-center gap-1.5 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
          )}
          <button
            type="submit"
            className="flex-1 h-12 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm transition-colors"
          >
            {isNew ? 'Add to Activity' : 'Save Transaction'}
          </button>
        </div>
      </form>
    </BottomSheet>
  );
};

interface ReceiveModalProps {
  open: boolean;
  onClose: () => void;
  address: string;
  network: string;
  holdings: TokenHolding[];
  onSimulateDeposit: (symbol: string, amount: number, from: string) => void;
  onImportAddress: (newAddress: string) => void;
  initialScannerOpen?: boolean;
}

const SAMPLE_SCAN_ADDRESSES = [
  { label: 'Ethereum Vault', address: '0x9F2a...48C1' },
  { label: 'Solana Trench', address: '7xKX...9pQz' },
  { label: 'Bitcoin Cold', address: 'bc1q...91mk' },
];

function extractScannedAddress(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return '';
  const withoutScheme = trimmed.replace(/^[a-zA-Z][a-zA-Z0-9+.-]*:(?:\/\/)?/, '');
  const addressPart = withoutScheme.split(/[?@/#]/)[0]?.trim();
  return addressPart || trimmed;
}

export const ReceiveModal: React.FC<ReceiveModalProps> = ({
  open,
  onClose,
  address,
  network,
  holdings,
  onSimulateDeposit,
  onImportAddress,
  initialScannerOpen = false,
}) => {
  const [copied, setCopied] = useState(false);
  const [simSymbol, setSimSymbol] = useState(holdings[0]?.symbol || 'ETH');
  const [simAmount, setSimAmount] = useState('5');
  const [scannerOpen, setScannerOpen] = useState(Boolean(open && initialScannerOpen));
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraLoading, setCameraLoading] = useState(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [customScanAddr, setCustomScanAddr] = useState('0x4E8b...71D2');
  const [scanDetected, setScanDetected] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastScanTsRef = useRef<number>(0);

  useEffect(() => {
    if (open) {
      setScannerOpen(Boolean(initialScannerOpen));
    } else {
      setScannerOpen(false);
    }
  }, [open, initialScannerOpen]);

  useEffect(() => {
    if (open && holdings[0]) {
      setSimSymbol((prev) =>
        holdings.some((h) => h.symbol === prev) ? prev : holdings[0].symbol
      );
    }
  }, [open, holdings]);

  const stopCamera = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
    setCameraLoading(false);
  }, []);

  const startLiveCamera = useCallback(
    async (preferredFacing: 'environment' | 'user' = 'environment') => {
      stopCamera();
      setCameraError(null);
      setCameraLoading(true);

      if (
        typeof navigator === 'undefined' ||
        !navigator.mediaDevices?.getUserMedia
      ) {
        setCameraLoading(false);
        setCameraError('Camera unavailable — upload a QR photo or enter address below');
        return;
      }

      try {
        let stream: MediaStream;
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: { ideal: preferredFacing },
              width: { ideal: 1280 },
              height: { ideal: 720 },
            },
            audio: false,
          });
        } catch {
          // Fallback when device doesn't support facingMode / resolution constraints
          stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false,
          });
        }

        streamRef.current = stream;
        setCameraActive(true);
        setCameraLoading(false);

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
      } catch (err) {
        setCameraLoading(false);
        const msg =
          err instanceof DOMException && err.name === 'NotAllowedError'
            ? 'Camera access blocked — allow camera permission or scan a QR photo'
            : 'Camera unavailable — scan a QR photo or tap a preset below';
        setCameraError(msg);
      }
    },
    [stopCamera]
  );

  useEffect(() => {
    if (scannerOpen) {
      startLiveCamera('environment');
    } else {
      stopCamera();
      setCameraError(null);
      setScanDetected(null);
    }
    return () => {
      stopCamera();
    };
  }, [scannerOpen, startLiveCamera, stopCamera]);

  useEffect(() => {
    if (cameraActive && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch(() => {});
    }
  }, [cameraActive]);

  const handleCloseScanner = useCallback(() => {
    stopCamera();
    setScannerOpen(false);
    if (initialScannerOpen) {
      onClose();
    }
  }, [initialScannerOpen, onClose, stopCamera]);

  const triggerSimulatedScan = useCallback(
    (targetAddr: string) => {
      const clean = extractScannedAddress(targetAddr);
      if (!clean) return;
      setScanDetected(clean);
      stopCamera();
      setTimeout(() => {
        onImportAddress(clean);
        setScanDetected(null);
        setScannerOpen(false);
        if (initialScannerOpen) {
          onClose();
        }
      }, 480);
    },
    [initialScannerOpen, onClose, onImportAddress, stopCamera]
  );

  // Real-time QR code decoding loop over live video frames
  useEffect(() => {
    if (!scannerOpen || !cameraActive || scanDetected) return;

    let active = true;

    const scanFrame = (timestamp: number) => {
      if (!active) return;

      if (timestamp - lastScanTsRef.current >= 140) {
        lastScanTsRef.current = timestamp;
        const video = videoRef.current;
        const canvas = canvasRef.current;

        if (
          video &&
          canvas &&
          video.readyState >= HTMLMediaElement.HAVE_ENOUGH_DATA &&
          video.videoWidth > 0 &&
          video.videoHeight > 0
        ) {
          const maxDim = 720;
          const scale = Math.min(
            1,
            maxDim / Math.max(video.videoWidth, video.videoHeight)
          );
          const w = Math.max(1, Math.round(video.videoWidth * scale));
          const h = Math.max(1, Math.round(video.videoHeight * scale));

          if (canvas.width !== w || canvas.height !== h) {
            canvas.width = w;
            canvas.height = h;
          }

          const ctx = canvas.getContext('2d', { willReadFrequently: true });
          if (ctx) {
            ctx.drawImage(video, 0, 0, w, h);
            const imageData = ctx.getImageData(0, 0, w, h);
            const decoded = jsQR(imageData.data, w, h, {
              inversionAttempts: 'attemptBoth',
            });
            if (decoded?.data) {
              triggerSimulatedScan(decoded.data);
              return;
            }
          }
        }
      }

      rafRef.current = requestAnimationFrame(scanFrame);
    };

    rafRef.current = requestAnimationFrame(scanFrame);

    return () => {
      active = false;
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [scannerOpen, cameraActive, scanDetected, triggerSimulatedScan]);

  const handleScanImageFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setCameraError(null);
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const maxDim = 1024;
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
        const w = Math.max(1, Math.round(img.width * scale));
        const h = Math.max(1, Math.round(img.height * scale));
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) return;
        ctx.drawImage(img, 0, 0, w, h);
        const imageData = ctx.getImageData(0, 0, w, h);
        const decoded = jsQR(imageData.data, w, h, {
          inversionAttempts: 'attemptBoth',
        });
        if (decoded?.data) {
          triggerSimulatedScan(decoded.data);
        } else {
          setCameraError('No QR code found in that image — try a clearer photo');
        }
      };
      img.onerror = () => {
        setCameraError('Could not read selected image');
      };
      if (typeof reader.result === 'string') {
        img.src = reader.result;
      }
    };
    reader.readAsDataURL(file);
  };

  const handleCopy = () => {
    navigator.clipboard?.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <>
      <BottomSheet
        open={open && !initialScannerOpen}
        onClose={onClose}
        title={`Receive on ${network}`}
      >
        <div className="flex flex-col items-center text-center space-y-4">
          {/* Clean crisp SVG QR visual */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
            <svg
              viewBox="0 0 120 120"
              className="w-40 h-40 text-slate-900"
              fill="currentColor"
            >
              <rect x="8" y="8" width="28" height="28" rx="4" fill="none" stroke="currentColor" strokeWidth="6" />
              <rect x="16" y="16" width="12" height="12" rx="2" />
              <rect x="84" y="8" width="28" height="28" rx="4" fill="none" stroke="currentColor" strokeWidth="6" />
              <rect x="92" y="16" width="12" height="12" rx="2" />
              <rect x="8" y="84" width="28" height="28" rx="4" fill="none" stroke="currentColor" strokeWidth="6" />
              <rect x="16" y="92" width="12" height="12" rx="2" />
              <rect x="46" y="12" width="8" height="8" />
              <rect x="60" y="12" width="14" height="8" />
              <rect x="46" y="26" width="16" height="8" />
              <rect x="68" y="26" width="8" height="16" />
              <rect x="12" y="46" width="8" height="16" />
              <rect x="26" y="52" width="14" height="8" />
              <rect x="46" y="46" width="24" height="24" rx="4" />
              <rect x="52" y="52" width="12" height="12" rx="2" fill="#ffffff" />
              <rect x="78" y="48" width="12" height="8" />
              <rect x="98" y="48" width="14" height="14" />
              <rect x="46" y="78" width="10" height="14" />
              <rect x="64" y="78" width="18" height="8" />
              <rect x="88" y="78" width="24" height="10" />
              <rect x="46" y="100" width="22" height="12" />
              <rect x="76" y="96" width="14" height="16" />
              <rect x="98" y="96" width="14" height="16" />
            </svg>
          </div>

          <div className="w-full p-3 rounded-xl bg-slate-100 dark:bg-slate-800/80 flex items-center justify-between gap-2">
            <span className="font-mono text-sm truncate">{address}</span>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => setScannerOpen(true)}
                aria-label="Scan QR code"
                className="min-h-[36px] px-2.5 rounded-lg bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-100 text-xs font-medium flex items-center gap-1.5 transition-colors"
              >
                <ScanLine className="w-3.5 h-3.5" />
                Scan
              </button>
              <button
                type="button"
                onClick={handleCopy}
                className="min-h-[36px] px-3 rounded-lg bg-blue-600 text-white text-xs font-medium flex items-center gap-1.5"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
          </div>

          <div className="w-full pt-3 border-t border-slate-100 dark:border-slate-800 text-left space-y-2.5">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Simulate Incoming Deposit
            </p>
            <div className="flex gap-2">
              <select
                value={simSymbol}
                onChange={(e) => setSimSymbol(e.target.value)}
                className="h-11 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-medium"
              >
                {holdings.map((h) => (
                  <option key={h.id} value={h.symbol}>
                    {h.symbol}
                  </option>
                ))}
              </select>
              <input
                type="number"
                step="any"
                value={simAmount}
                onChange={(e) => setSimAmount(e.target.value)}
                className="flex-1 h-11 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-mono tabular-nums"
                placeholder="Amount"
              />
              <button
                type="button"
                onClick={() => {
                  onSimulateDeposit(simSymbol, parseFloat(simAmount) || 0, 'External Wallet');
                  onClose();
                }}
                className="h-11 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold flex items-center gap-1.5 shrink-0"
              >
                <ArrowDownLeft className="w-4 h-4" />
                Credit
              </button>
            </div>
          </div>
        </div>
      </BottomSheet>

      {/* Camera QR Scanner Overlay */}
      {scannerOpen && (
        <div
          className="fixed inset-0 z-[60] bg-[#07090E] text-white flex flex-col justify-between overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-label="QR code scanner"
        >
          {/* Hidden Canvas & File Picker for QR Decoding */}
          <canvas ref={canvasRef} className="hidden" />
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleScanImageFile}
            className="hidden"
          />

          {/* Live camera feed when active */}
          {cameraActive ? (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="fixed inset-0 w-full h-full object-cover"
            />
          ) : (
            <div className="fixed inset-0 bg-[radial-gradient(circle_at_center,rgba(30,41,59,0.55)_0%,rgba(7,9,14,0.98)_70%)] pointer-events-none" />
          )}

          {/* Subtle dark vignette for legibility over live video */}
          {cameraActive && (
            <div className="fixed inset-0 bg-black/25 pointer-events-none" />
          )}

          {/* Scanner Top Controls */}
          <div className="relative z-10 flex items-center justify-between px-4 py-2.5 sm:py-3 bg-gradient-to-b from-black/75 to-transparent gap-2 shrink-0">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => {
                  if (cameraActive) {
                    const next = facingMode === 'environment' ? 'user' : 'environment';
                    setFacingMode(next);
                    startLiveCamera(next);
                  } else {
                    startLiveCamera(facingMode);
                  }
                }}
                disabled={cameraLoading}
                className="min-h-[44px] px-3 rounded-xl bg-white/15 hover:bg-white/20 backdrop-blur-md text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap"
              >
                {cameraActive ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5" />
                    Flip
                  </>
                ) : (
                  <>
                    <Camera className="w-4 h-4" />
                    {cameraLoading ? 'Starting...' : 'Retry Camera'}
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="min-h-[44px] px-3 rounded-xl bg-white/15 hover:bg-white/20 backdrop-blur-md text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap"
              >
                <ImagePlus className="w-3.5 h-3.5" />
                Photo
              </button>
            </div>

            <span className="text-sm font-semibold tracking-tight truncate">
              Scan Address QR
            </span>

            <button
              type="button"
              onClick={handleCloseScanner}
              aria-label="Close scanner"
              className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full bg-white/15 hover:bg-white/25 backdrop-blur-md transition-colors shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Center Viewfinder Reticle */}
          <div className="relative z-10 flex flex-col items-center justify-center px-6 py-3 shrink-0">
            <div className="relative w-44 h-44 sm:w-60 sm:h-60 flex items-center justify-center">
              {/* Subtle simulated target QR in viewfinder when camera is off */}
              {!cameraActive && (
                <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-xl bg-white/10 border border-white/15 p-3 flex items-center justify-center opacity-45">
                  <svg viewBox="0 0 60 60" className="w-full h-full text-white" fill="currentColor">
                    <rect x="4" y="4" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="3" />
                    <rect x="9" y="9" width="6" height="6" />
                    <rect x="40" y="4" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="3" />
                    <rect x="45" y="9" width="6" height="6" />
                    <rect x="4" y="40" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="3" />
                    <rect x="9" y="45" width="6" height="6" />
                    <rect x="26" y="10" width="8" height="8" />
                    <rect x="26" y="26" width="12" height="12" />
                    <rect x="44" y="28" width="8" height="16" />
                    <rect x="26" y="44" width="14" height="8" />
                  </svg>
                </div>
              )}

              {/* Corner Brackets */}
              <span
                className={`absolute top-0 left-0 w-8 h-8 border-t-3 border-l-3 rounded-tl-xl transition-colors ${
                  scanDetected ? 'border-emerald-400' : 'border-blue-400'
                }`}
              />
              <span
                className={`absolute top-0 right-0 w-8 h-8 border-t-3 border-r-3 rounded-tr-xl transition-colors ${
                  scanDetected ? 'border-emerald-400' : 'border-blue-400'
                }`}
              />
              <span
                className={`absolute bottom-0 left-0 w-8 h-8 border-b-3 border-l-3 rounded-bl-xl transition-colors ${
                  scanDetected ? 'border-emerald-400' : 'border-blue-400'
                }`}
              />
              <span
                className={`absolute bottom-0 right-0 w-8 h-8 border-b-3 border-r-3 rounded-br-xl transition-colors ${
                  scanDetected ? 'border-emerald-400' : 'border-blue-400'
                }`}
              />

              {/* Sweeping Scan Line */}
              <div
                className={`absolute top-0 left-3 right-3 h-0.5 shadow-[0_0_12px_rgba(59,130,246,0.9)] animate-qr-scan ${
                  scanDetected ? 'bg-emerald-400' : 'bg-blue-400'
                }`}
              />
            </div>

            <p className="mt-5 text-xs text-slate-200 text-center max-w-xs drop-shadow">
              {scanDetected
                ? `Detected ${scanDetected} — importing address`
                : cameraError ||
                  (cameraActive
                    ? 'Point camera at any wallet QR code to scan automatically'
                    : cameraLoading
                    ? 'Starting camera...'
                    : 'Align QR code inside frame or tap a target below')}
            </p>
          </div>

          {/* Bottom Simulate Scan Controls */}
          <div className="relative z-10 p-4 sm:p-5 bg-gradient-to-t from-black via-black/90 to-transparent">
            <div className="max-w-md mx-auto space-y-3">
              <div className="grid grid-cols-3 gap-2">
                {SAMPLE_SCAN_ADDRESSES.map((item) => (
                  <button
                    key={item.address}
                    type="button"
                    onClick={() => triggerSimulatedScan(item.address)}
                    className="p-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-left transition-colors"
                  >
                    <p className="text-[11px] font-semibold truncate">{item.label}</p>
                    <p className="text-[10px] font-mono text-slate-300 truncate">
                      {item.address}
                    </p>
                  </button>
                ))}
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  triggerSimulatedScan(customScanAddr);
                }}
                className="flex gap-2"
              >
                <input
                  type="text"
                  value={customScanAddr}
                  onChange={(e) => setCustomScanAddr(e.target.value)}
                  placeholder="Enter address to scan..."
                  className="flex-1 h-11 px-3 rounded-xl bg-white/10 border border-white/15 text-sm font-mono text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="submit"
                  className="h-11 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 shrink-0 transition-colors"
                >
                  <ScanLine className="w-4 h-4" />
                  Capture
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

interface SendBuyModalProps {
  open: boolean;
  mode: 'send' | 'buy' | 'sell';
  onClose: () => void;
  holdings: TokenHolding[];
  onConfirm: (mode: 'send' | 'buy' | 'sell', symbol: string, amount: number, counterparty: string) => void;
}

export const SendBuyModal: React.FC<SendBuyModalProps> = ({
  open,
  mode,
  onClose,
  holdings,
  onConfirm,
}) => {
  const [symbol, setSymbol] = useState(holdings[0]?.symbol || 'BTC');
  const [amount, setAmount] = useState('0.5');
  const [recipient, setRecipient] = useState('0x82A4...31F9');
  const wasOpenRef = useRef(false);
  const lastModeRef = useRef(mode);

  const tradeableAssets = React.useMemo(() => {
    const seen = new Set(holdings.map((h) => h.symbol.toUpperCase()));
    const extras = CRYPTO_TEMPLATES.filter(
      (t) => !seen.has(t.symbol.toUpperCase())
    ).map((t) => ({
      id: `tpl-${t.symbol.toLowerCase()}`,
      symbol: t.symbol,
      name: t.name,
      network: t.network,
      balance: 0,
      priceUsd: t.priceUsd,
      change24hPct: t.change24hPct,
      color: t.color,
      sparkline: [],
      category: t.category,
    }));
    return [...holdings, ...extras];
  }, [holdings]);

  useEffect(() => {
    if (open && (!wasOpenRef.current || lastModeRef.current !== mode)) {
      const firstSym = holdings[0]?.symbol || CRYPTO_TEMPLATES[0]?.symbol || 'BTC';
      setSymbol(firstSym);
      setAmount(mode === 'buy' ? '1.0' : '0.25');
    }
    wasOpenRef.current = open;
    lastModeRef.current = mode;
  }, [open, mode, holdings]);

  const activeToken =
    tradeableAssets.find((h) => h.symbol.toUpperCase() === symbol.toUpperCase()) ||
    tradeableAssets[0];
  const parsedAmount = parseFloat(amount) || 0;
  const usdTotal = parsedAmount * (activeToken?.priceUsd || 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const label =
      mode === 'buy'
        ? 'Apple Pay · Instant'
        : mode === 'sell'
        ? 'Bank · Instant Payout'
        : recipient || '0x82A4...31F9';
    onConfirm(mode, activeToken?.symbol || symbol, parsedAmount, label);
    onClose();
  };

  const title =
    mode === 'buy' ? 'Buy Crypto' : mode === 'sell' ? 'Sell Crypto' : 'Send Asset';

  return (
    <BottomSheet open={open} onClose={onClose} title={title}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Select Crypto
            </label>
            {activeToken && (
              <span className="text-xs font-mono text-slate-500 dark:text-slate-400 tabular-nums">
                {formatUsd(activeToken.priceUsd)}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
            {tradeableAssets.map((asset) => {
              const selected =
                asset.symbol.toUpperCase() === (activeToken?.symbol || symbol).toUpperCase();
              return (
                <button
                  key={asset.id}
                  type="button"
                  onClick={() => setSymbol(asset.symbol)}
                  className={`h-9 px-2.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 shrink-0 transition-colors ${
                    selected
                      ? 'border-blue-500 bg-blue-600/12 text-blue-600 dark:text-blue-400'
                      : 'border-slate-200 dark:border-slate-700/80 bg-slate-100/80 dark:bg-slate-800/70 hover:bg-slate-200/70 dark:hover:bg-slate-800'
                  }`}
                >
                  <TokenIcon symbol={asset.symbol} color={asset.color} size={20} />
                  <span>{asset.symbol}</span>
                </button>
              );
            })}
          </div>

          {activeToken && (
            <div className="flex items-center justify-between gap-2.5 pt-0.5">
              <div className="flex items-center gap-2.5 min-w-0">
                <TokenIcon
                  symbol={activeToken.symbol}
                  color={activeToken.color}
                  size={34}
                />
                <span className="text-sm font-semibold truncate">
                  {activeToken.name}
                </span>
              </div>
              <span className="text-xs font-mono font-medium text-slate-600 dark:text-slate-300 tabular-nums shrink-0">
                {formatTokenAmount(activeToken.balance)} {activeToken.symbol} held
              </span>
            </div>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Amount ({activeToken?.symbol || symbol})
            </label>
            {(mode === 'send' || mode === 'sell') && activeToken && activeToken.balance > 0 && (
              <button
                type="button"
                onClick={() => setAmount(String(activeToken.balance))}
                className="text-xs font-semibold text-blue-500"
              >
                Max ({formatTokenAmount(activeToken.balance)})
              </button>
            )}
          </div>
          <input
            type="number"
            step="any"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full h-12 px-3.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-lg font-mono tabular-nums focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 tabular-nums">
            ≈ {formatUsd(usdTotal)}
          </p>
          {(mode === 'sell' || mode === 'send') && activeToken && activeToken.balance > 0 && (
            <div className="grid grid-cols-4 gap-2 mt-2.5">
              {(
                [
                  { label: '25%', pct: 0.25 },
                  { label: '50%', pct: 0.5 },
                  { label: '75%', pct: 0.75 },
                  { label: 'Max', pct: 1 },
                ] as const
              ).map((chip) => (
                <button
                  key={chip.label}
                  type="button"
                  onClick={() =>
                    setAmount(
                      chip.pct === 1
                        ? String(activeToken.balance)
                        : String(Number((activeToken.balance * chip.pct).toFixed(6)))
                    )
                  }
                  className="h-9 rounded-lg bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-800 text-xs font-semibold transition-colors"
                >
                  {chip.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {mode === 'send' && (
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">
              Recipient Address or ENS
            </label>
            <input
              type="text"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              className="w-full h-11 px-3 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )}

        <button
          type="submit"
          className={`w-full h-12 rounded-xl text-white font-semibold text-sm transition-colors ${
            mode === 'sell'
              ? 'bg-rose-600 hover:bg-rose-500'
              : 'bg-blue-600 hover:bg-blue-500'
          }`}
        >
          {mode === 'buy'
            ? `Buy ${formatTokenAmount(parsedAmount)} ${activeToken?.symbol || symbol}`
            : mode === 'sell'
            ? `Sell ${formatTokenAmount(parsedAmount)} ${activeToken?.symbol || symbol}`
            : `Send ${formatTokenAmount(parsedAmount)} ${activeToken?.symbol || symbol}`}
        </button>
      </form>
    </BottomSheet>
  );
};
