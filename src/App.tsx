import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowDownLeft,
  ArrowUpRight,
  ArrowDownRight,
  CreditCard,
  Eye,
  EyeOff,
  Home,
  LineChart,
  RefreshCw,
  Clock,
  Copy,
  Check,
  Wallet,
  Sun,
  Moon,
  Monitor,
  Smartphone,
  Bell,
  X,
  DollarSign,
  ScanLine,
  ScanFace,
  Lock,
  Newspaper,
  Zap,
  Crown,
} from 'lucide-react';
import {
  ChartShape,
  CryptoTransaction,
  PortfolioPreset,
  PortfolioState,
  PriceAlert,
  PriceHistoryEntry,
  RichGoal,
  Timeframe,
  TokenHolding,
  WalletProfile,
} from './types/crypto';
import {
  buildPriceHistory,
  CRYPTO_TEMPLATES,
  DEFAULT_PORTFOLIO_STATE,
  DEFAULT_RICH_GOALS,
  PORTFOLIO_PRESETS,
  ensureTokenPriceHistory,
  makeSparkline,
  sparklineFromHistory,
} from './data/presets';
import { UI_THEMES } from './data/uiThemes';
import {
  formatPct,
  formatSignedUsd,
  formatTokenAmount,
  formatUsd,
} from './utils/format';
import {
  applyDailyMarketHype,
  generateDailyMarketHype,
  getTodayDateKey,
} from './utils/marketHype';
import { TokenIcon } from './components/TokenIcon';
import { Sparkline } from './components/Sparkline';
import { PortfolioChart } from './components/PortfolioChart';
import {
  ReceiveModal,
  SendBuyModal,
  TokenEditModal,
  TxEditModal,
  WalletEditModal,
} from './components/EditModals';
import { SwapView } from './components/SwapView';
import { ActivityView } from './components/ActivityView';
import { MarketsView } from './components/MarketsView';
import { NewsView } from './components/NewsView';
import { BottomSheet } from './components/BottomSheet';
import { PriceAlertsModal } from './components/PriceAlertsModal';
import { QuickSellModal } from './components/QuickSellModal';
import { RichGoalsModal } from './components/RichGoalsModal';
import { BiometricLockScreen } from './components/BiometricLockScreen';
import {
  OfflineIndicator,
  PWAInstallButton,
} from './components/PWAInstallControls';

type NavTab = 'home' | 'swap' | 'news' | 'activity' | 'markets';

const STORAGE_KEY = 'vaultx_larp_portfolio_v1';
const THEME_STORAGE_KEY = 'vaultx_theme';
const THEME_COLOR_STORAGE_KEY = 'vaultx_theme_color';
const MEMECOIN_SEED_KEY = 'vaultx_memecoin_seed_v1';
const HYPE_SEED_KEY = 'vaultx_hype_seed_v1';
const REALISTIC_BAL_SEED_KEY = 'vaultx_realistic_bal_v1';
const NVDA_SEED_KEY = 'vaultx_nvda_seed_v1';
const RICH_GOALS_SEED_KEY = 'vaultx_rich_goals_v2';
const DAILY_HYPE_DATE_KEY = 'vaultx_daily_hype_date_v1';
const TIMEFRAMES: Timeframe[] = ['1H', '1D', '1W', '1M', '1Y', 'ALL'];

export default function App() {
  const [state, setState] = useState<PortfolioState>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        let parsed = JSON.parse(saved) as PortfolioState;
        const alreadySeeded = localStorage.getItem(MEMECOIN_SEED_KEY);
        if (!alreadySeeded) {
          localStorage.setItem(MEMECOIN_SEED_KEY, '1');
          const hasMeme = parsed.holdings.some((h) =>
            ['PEPE', 'DOGE', 'WIF', 'BONK', 'POPCAT', 'SHIB'].includes(
              h.symbol.toUpperCase()
            )
          );
          if (!hasMeme) {
            const defaultMemes = DEFAULT_PORTFOLIO_STATE.holdings.filter(
              (h) => h.category === 'memecoin'
            );
            parsed = {
              ...parsed,
              holdings: [...parsed.holdings, ...defaultMemes],
            };
          }
        }
        const hypeSeeded = localStorage.getItem(HYPE_SEED_KEY);
        if (!hypeSeeded) {
          localStorage.setItem(HYPE_SEED_KEY, '1');
          const hasHype = parsed.holdings.some(
            (h) => h.symbol.toUpperCase() === 'HYPE'
          );
          if (!hasHype) {
            const defaultHype = DEFAULT_PORTFOLIO_STATE.holdings.find(
              (h) => h.symbol === 'HYPE'
            );
            if (defaultHype) {
              parsed = {
                ...parsed,
                holdings: [...parsed.holdings, defaultHype],
              };
            }
          }
        }
        const realisticSeeded = localStorage.getItem(REALISTIC_BAL_SEED_KEY);
        if (!realisticSeeded) {
          localStorage.setItem(REALISTIC_BAL_SEED_KEY, '1');
          parsed = {
            ...parsed,
            profile: {
              ...parsed.profile,
              manualTotalBalance:
                DEFAULT_PORTFOLIO_STATE.profile.manualTotalBalance,
              manualChangeUsd: DEFAULT_PORTFOLIO_STATE.profile.manualChangeUsd,
              manualChangePct: DEFAULT_PORTFOLIO_STATE.profile.manualChangePct,
            },
            holdings: DEFAULT_PORTFOLIO_STATE.holdings,
            transactions: DEFAULT_PORTFOLIO_STATE.transactions,
          };
        }
        const nvdaSeeded = localStorage.getItem(NVDA_SEED_KEY);
        if (!nvdaSeeded) {
          localStorage.setItem(NVDA_SEED_KEY, '1');
          const hasNvda = parsed.holdings.some(
            (h) => h.symbol.toUpperCase() === 'NVDA'
          );
          if (!hasNvda) {
            const defaultNvda = DEFAULT_PORTFOLIO_STATE.holdings.find(
              (h) => h.symbol === 'NVDA'
            );
            if (defaultNvda) {
              parsed = {
                ...parsed,
                holdings: [...parsed.holdings, defaultNvda],
              };
            }
          }
        }
        const richSeeded = localStorage.getItem(RICH_GOALS_SEED_KEY);
        if (!richSeeded) {
          localStorage.setItem(RICH_GOALS_SEED_KEY, '1');
          const existing = parsed.richGoals ?? [];
          const existingIds = new Set(existing.map((g) => g.id));
          const merged = [
            ...existing,
            ...DEFAULT_RICH_GOALS.filter((g) => !existingIds.has(g.id)),
          ];
          parsed = {
            ...parsed,
            richGoals: merged,
          };
        }
        if (
          parsed.profile?.uiStyle &&
          !UI_THEMES[parsed.profile.uiStyle]
        ) {
          parsed = {
            ...parsed,
            profile: {
              ...parsed.profile,
              uiStyle: 'candles',
            },
          };
        }
        return parsed;
      }
      localStorage.setItem(MEMECOIN_SEED_KEY, '1');
      localStorage.setItem(HYPE_SEED_KEY, '1');
      localStorage.setItem(REALISTIC_BAL_SEED_KEY, '1');
      localStorage.setItem(NVDA_SEED_KEY, '1');
      localStorage.setItem(RICH_GOALS_SEED_KEY, '1');
    } catch {
      // ignore storage errors
    }
    return DEFAULT_PORTFOLIO_STATE;
  });

  const [isDark, setIsDark] = useState<boolean>(() => {
    try {
      const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
      if (savedTheme === 'light') return false;
      if (savedTheme === 'dark') return true;
      return true;
    } catch {
      return true;
    }
  });

  const [activeTab, setActiveTab] = useState<NavTab>('home');
  const [timeframe, setTimeframe] = useState<Timeframe>('1D');
  const [hoverPoint, setHoverPoint] = useState<{
    value: number;
    label: string;
  } | null>(null);
  const [phonePreview, setPhonePreview] = useState(false);
  const [copiedAddr, setCopiedAddr] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Modals
  const [walletModalOpen, setWalletModalOpen] = useState(false);
  const [studioSheetOpen, setStudioSheetOpen] = useState(false);
  const [tokenModalState, setTokenModalState] = useState<{
    open: boolean;
    token: TokenHolding | null;
  }>({ open: false, token: null });
  const [txModalState, setTxModalState] = useState<{
    open: boolean;
    tx: CryptoTransaction | null;
  }>({ open: false, tx: null });
  const [receiveState, setReceiveState] = useState<{
    open: boolean;
    scannerDirect: boolean;
  }>({ open: false, scannerDirect: false });
  const [sendBuyState, setSendBuyState] = useState<{
    open: boolean;
    mode: 'send' | 'buy' | 'sell';
  }>({ open: false, mode: 'buy' });
  const [quickSellOpen, setQuickSellOpen] = useState(false);
  const [richGoalsOpen, setRichGoalsOpen] = useState(false);
  const [alertsModalState, setAlertsModalState] = useState<{
    open: boolean;
    initialSymbol: string | null;
  }>({ open: false, initialSymbol: null });
  const [alertBanner, setAlertBanner] = useState<{
    symbol: string;
    priceUsd: number;
    targetPriceUsd: number;
    condition: 'above' | 'below';
  } | null>(null);
  const [richBanner, setRichBanner] = useState<{
    goal: RichGoal;
    currentBalance: number;
  } | null>(null);
  const prevRichBalanceRef = useRef<number | null>(null);
  const [isLocked, setIsLocked] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as PortfolioState;
        return Boolean(parsed.profile?.biometricLockEnabled);
      }
    } catch {
      // ignore
    }
    return false;
  });
  const [liveTickSeq, setLiveTickSeq] = useState(0);
  const holdingsRef = useRef<TokenHolding[]>(state.holdings);
  holdingsRef.current = state.holdings;
  const hypeVariationRef = useRef<number>(0);
  const lastAutoHypeDateRef = useRef<string | null>(null);

  const activeThemeColor = useMemo(() => {
    const activeUi =
      UI_THEMES[state.profile.uiStyle || 'candles'] || UI_THEMES.candles;
    return isDark ? activeUi.themeColorDark : activeUi.themeColorLight;
  }, [isDark, state.profile.uiStyle]);

  const applyThemeToDocument = (dark: boolean, themeColor: string) => {
    const root = document.documentElement;
    if (dark) {
      root.classList.add('dark');
      root.style.colorScheme = 'dark';
    } else {
      root.classList.remove('dark');
      root.style.colorScheme = 'light';
    }

    const themeColorMetas = document.querySelectorAll('meta[name="theme-color"]');
    if (themeColorMetas.length > 0) {
      themeColorMetas.forEach((meta) => {
        meta.setAttribute('content', themeColor);
      });
    } else {
      const meta = document.createElement('meta');
      meta.setAttribute('name', 'theme-color');
      meta.setAttribute('content', themeColor);
      document.head.appendChild(meta);
    }

    const appleBarMeta = document.querySelector(
      'meta[name="apple-mobile-web-app-status-bar-style"]'
    );
    if (appleBarMeta) {
      appleBarMeta.setAttribute(
        'content',
        dark ? 'black-translucent' : 'default'
      );
    }

    try {
      localStorage.setItem(THEME_STORAGE_KEY, dark ? 'dark' : 'light');
      localStorage.setItem(THEME_COLOR_STORAGE_KEY, themeColor);
    } catch {
      // ignore
    }
  };

  // Sync dark mode class, color-scheme, and browser theme-color meta tag
  useEffect(() => {
    applyThemeToDocument(isDark, activeThemeColor);
  }, [isDark, activeThemeColor]);

  const toggleTheme = () => {
    setIsDark((prev) => {
      const nextDark = !prev;
      const activeUi =
        UI_THEMES[state.profile.uiStyle || 'candles'] || UI_THEMES.candles;
      const nextColor = nextDark
        ? activeUi.themeColorDark
        : activeUi.themeColorLight;
      applyThemeToDocument(nextDark, nextColor);
      return nextDark;
    });
  };

  // Persist portfolio state
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // ignore
    }
  }, [state]);

  // Live random market movement when enabled (auto-starts on Buy / Sell)
  useEffect(() => {
    if (!state.profile.liveTick) return;
    const timer = setInterval(() => {
      const marketImpulse =
        (Math.random() < 0.5 ? 1 : -1) *
        (Math.random() < 0.25
          ? 0.015 + Math.random() * 0.035
          : 0.004 + Math.random() * 0.016);

      const nowLabel = new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });

      setState((prev) => {
        const nextHoldings = prev.holdings.map((h) => {
          if (h.symbol === 'USDC' || h.symbol === 'USDT') return h;
          const coinSwing =
            marketImpulse * 0.65 + (Math.random() - 0.5) * 0.032;
          const jitter = Math.max(0.25, 1 + coinSwing);
          const deltaPct = coinSwing * 100;
          const nextPrice = Math.max(0.000001, h.priceUsd * jitter);
          const prevHist = ensureTokenPriceHistory(h);
          const newEntry: PriceHistoryEntry = {
            id: `ph-${Date.now()}-${h.symbol}-${Math.random().toString(36).slice(2, 6)}`,
            priceUsd:
              nextPrice < 0.01
                ? Number(nextPrice.toFixed(8))
                : nextPrice < 1
                ? Number(nextPrice.toFixed(4))
                : Number(nextPrice.toFixed(2)),
            changePct: Number(deltaPct.toFixed(2)),
            timestampLabel: nowLabel,
          };
          const nextHistory = [newEntry, ...prevHist].slice(0, 24);
          return {
            ...h,
            priceUsd: nextPrice,
            change24hPct: Number((h.change24hPct + deltaPct).toFixed(2)),
            priceHistory: nextHistory,
            sparkline: sparklineFromHistory(nextHistory, nextPrice),
          };
        });

        let nextProfile = prev.profile;
        if (prev.profile.useManualTotal) {
          const prevBal = prev.profile.manualTotalBalance;
          const deltaUsd = prevBal * marketImpulse;
          nextProfile = {
            ...prev.profile,
            manualTotalBalance: Math.max(
              0.01,
              Number((prevBal + deltaUsd).toFixed(2))
            ),
            manualChangeUsd: Number(
              (prev.profile.manualChangeUsd + deltaUsd).toFixed(2)
            ),
            manualChangePct: Number(
              (prev.profile.manualChangePct + marketImpulse * 100).toFixed(2)
            ),
          };
        }

        return {
          ...prev,
          profile: nextProfile,
          holdings: nextHoldings,
        };
      });

      setLiveTickSeq((n) => n + 1);
    }, 750);
    return () => clearInterval(timer);
  }, [state.profile.liveTick]);

  const triggerDailyMarketHype = useRef<(auto?: boolean) => void>(() => {});
  triggerDailyMarketHype.current = (auto = false) => {
    const now = new Date();
    const todayKey = getTodayDateKey(now);
    const variation = hypeVariationRef.current;
    hypeVariationRef.current += 1;

    const hype = generateDailyMarketHype(
      holdingsRef.current,
      now,
      auto ? 0 : variation + 1
    );

    try {
      localStorage.setItem(DAILY_HYPE_DATE_KEY, todayKey);
    } catch {
      // ignore storage errors
    }
    lastAutoHypeDateRef.current = todayKey;

    setState((prev) => applyDailyMarketHype(prev, hype).nextState);
    setLiveTickSeq((n) => n + 1);
    showToast(
      `Market Hype: ${hype.targetSymbol} ${formatPct(hype.impactPct)} pushed to Activity`
    );
  };

  // Automatically generate and push a daily Market Hype headline once per calendar day
  useEffect(() => {
    const checkDailyHype = () => {
      const todayKey = getTodayDateKey();
      if (lastAutoHypeDateRef.current === todayKey) return;
      try {
        if (localStorage.getItem(DAILY_HYPE_DATE_KEY) === todayKey) {
          lastAutoHypeDateRef.current = todayKey;
          return;
        }
      } catch {
        // ignore
      }
      lastAutoHypeDateRef.current = todayKey;
      triggerDailyMarketHype.current(true);
    };

    checkDailyHype();
    const timer = setInterval(checkDailyHype, 60_000);
    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        checkDailyHype();
      }
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);

  // Evaluate active price alerts whenever token prices change
  useEffect(() => {
    const alerts = state.priceAlerts || [];
    if (alerts.length === 0) return;

    const triggeredIds: string[] = [];
    let firstHit: {
      symbol: string;
      priceUsd: number;
      targetPriceUsd: number;
      condition: 'above' | 'below';
    } | null = null;

    for (const alert of alerts) {
      if (!alert.active) continue;
      const holding = state.holdings.find((h) => h.symbol === alert.symbol);
      if (!holding) continue;

      const hit =
        (alert.condition === 'above' &&
          holding.priceUsd >= alert.targetPriceUsd) ||
        (alert.condition === 'below' &&
          holding.priceUsd <= alert.targetPriceUsd);

      if (hit) {
        triggeredIds.push(alert.id);
        if (!firstHit) {
          firstHit = {
            symbol: holding.symbol,
            priceUsd: holding.priceUsd,
            targetPriceUsd: alert.targetPriceUsd,
            condition: alert.condition,
          };
        }
      }
    }

    if (triggeredIds.length > 0 && firstHit) {
      const nowLabel = new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      });
      setState((prev) => ({
        ...prev,
        priceAlerts: (prev.priceAlerts || []).map((a) =>
          triggeredIds.includes(a.id)
            ? { ...a, active: false, triggeredAt: nowLabel }
            : a
        ),
      }));

      setAlertBanner(firstHit);
      if (
        typeof Notification !== 'undefined' &&
        Notification.permission === 'granted'
      ) {
        try {
          new Notification(`${firstHit.symbol} Price Alert`, {
            body: `${firstHit.symbol} ${
              firstHit.condition === 'above' ? 'rose above' : 'dropped below'
            } ${formatUsd(firstHit.targetPriceUsd)} (now ${formatUsd(
              firstHit.priceUsd
            )})`,
          });
        } catch {
          // ignore notification errors
        }
      }
    }
  }, [state.holdings, state.priceAlerts]);

  useEffect(() => {
    if (!alertBanner) return;
    const t = setTimeout(() => setAlertBanner(null), 6000);
    return () => clearTimeout(t);
  }, [alertBanner]);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => {
      setToastMsg((curr) => (curr === msg ? null : curr));
    }, 2200);
  };

  // Calculated sums from holdings
  const { calculatedTotal, calculatedChangeUsd, calculatedChangePct } =
    useMemo(() => {
      let total = 0;
      let prevTotal = 0;
      for (const h of state.holdings) {
        const val = h.balance * h.priceUsd;
        total += val;
        const prev = val / (1 + h.change24hPct / 100);
        prevTotal += Number.isFinite(prev) ? prev : val;
      }
      const diffUsd = total - prevTotal;
      const diffPct = prevTotal > 0 ? (diffUsd / prevTotal) * 100 : 0;
      return {
        calculatedTotal: total,
        calculatedChangeUsd: diffUsd,
        calculatedChangePct: diffPct,
      };
    }, [state.holdings]);

  const headlineBalance = state.profile.useManualTotal
    ? state.profile.manualTotalBalance
    : calculatedTotal;
  const headlineChangeUsd = state.profile.useManualTotal
    ? state.profile.manualChangeUsd
    : calculatedChangeUsd;
  const headlineChangePct = state.profile.useManualTotal
    ? state.profile.manualChangePct
    : calculatedChangePct;

  const richGoals = state.richGoals ?? DEFAULT_RICH_GOALS;

  // Show a top popup whenever portfolio balance rises to hit a rich-thing threshold
  useEffect(() => {
    if (prevRichBalanceRef.current === null) {
      prevRichBalanceRef.current = headlineBalance;
      return;
    }
    const prevBal = prevRichBalanceRef.current;
    prevRichBalanceRef.current = headlineBalance;

    if (headlineBalance > prevBal) {
      const newlyUnlocked = richGoals
        .filter((g) => prevBal < g.priceUsd && headlineBalance >= g.priceUsd)
        .sort((a, b) => b.priceUsd - a.priceUsd);

      if (newlyUnlocked.length > 0) {
        const topGoal = newlyUnlocked[0];
        setRichBanner({ goal: topGoal, currentBalance: headlineBalance });
        if (
          typeof Notification !== 'undefined' &&
          Notification.permission === 'granted'
        ) {
          try {
            new Notification(`Unlocked: ${topGoal.name}`, {
              body: `Your money hit ${formatUsd(topGoal.priceUsd)} — now ${formatUsd(
                headlineBalance
              )}!`,
            });
          } catch {
            // ignore notification errors
          }
        }
      }
    }
  }, [headlineBalance, richGoals]);

  useEffect(() => {
    if (!richBanner) return;
    const t = setTimeout(() => setRichBanner(null), 6500);
    return () => clearTimeout(t);
  }, [richBanner]);

  const displayedBalance = hoverPoint ? hoverPoint.value : headlineBalance;
  const isGain = headlineChangeUsd >= 0;
  const uiTheme =
    UI_THEMES[state.profile.uiStyle || 'candles'] || UI_THEMES.candles;

  const allocationItems = useMemo(() => {
    const items = state.holdings
      .map((h) => ({
        id: h.id,
        symbol: h.symbol,
        name: h.name,
        color: h.color,
        valueUsd: Math.max(0, h.balance * h.priceUsd),
      }))
      .filter((item) => item.valueUsd > 0)
      .sort((a, b) => b.valueUsd - a.valueUsd);
    const total = items.reduce((sum, item) => sum + item.valueUsd, 0);
    return items.map((item) => ({
      ...item,
      pct: total > 0 ? (item.valueUsd / total) * 100 : 0,
    }));
  }, [state.holdings]);

  const updateProfile = (patch: Partial<WalletProfile>) => {
    setState((prev) => ({
      ...prev,
      profile: { ...prev.profile, ...patch },
    }));
  };

  const applyPreset = (preset: PortfolioPreset) => {
    setHoverPoint(null);
    setState((prev) => ({
      ...preset.state,
      profile: {
        ...preset.state.profile,
        biometricLockEnabled: prev.profile.biometricLockEnabled,
        biometricMethod: prev.profile.biometricMethod,
        uiStyle: prev.profile.uiStyle,
      },
      priceAlerts: preset.state.priceAlerts ?? prev.priceAlerts ?? [],
      richGoals: prev.richGoals,
    }));
    showToast(`Loaded ${preset.label}`);
  };

  const handleSaveToken = (token: TokenHolding) => {
    setState((prev) => {
      const exists = prev.holdings.some((h) => h.id === token.id);
      const nextHoldings = exists
        ? prev.holdings.map((h) => (h.id === token.id ? token : h))
        : [token, ...prev.holdings];
      return { ...prev, holdings: nextHoldings };
    });
  };

  const handleDeleteToken = (id: string) => {
    setState((prev) => ({
      ...prev,
      holdings: prev.holdings.filter((h) => h.id !== id),
    }));
  };

  const handleSaveTx = (tx: CryptoTransaction) => {
    setState((prev) => {
      const exists = prev.transactions.some((t) => t.id === tx.id);
      const nextTxs = exists
        ? prev.transactions.map((t) => (t.id === tx.id ? tx : t))
        : [tx, ...prev.transactions];
      return { ...prev, transactions: nextTxs };
    });
  };

  const handleDeleteTx = (id: string) => {
    setState((prev) => ({
      ...prev,
      transactions: prev.transactions.filter((t) => t.id !== id),
    }));
  };

  const handleAddAlert = (alert: PriceAlert) => {
    setState((prev) => ({
      ...prev,
      priceAlerts: [alert, ...(prev.priceAlerts || [])],
    }));
    showToast(`Alert set for ${alert.symbol}`);
  };

  const handleUpdateAlert = (updated: PriceAlert) => {
    setState((prev) => ({
      ...prev,
      priceAlerts: (prev.priceAlerts || []).map((a) =>
        a.id === updated.id ? updated : a
      ),
    }));
    showToast(`Alert updated to ${updated.symbol}`);
  };

  const handleToggleAlert = (id: string) => {
    setState((prev) => ({
      ...prev,
      priceAlerts: (prev.priceAlerts || []).map((a) =>
        a.id === id
          ? {
              ...a,
              active: a.triggeredAt ? true : !a.active,
              triggeredAt: undefined,
            }
          : a
      ),
    }));
  };

  const handleDeleteAlert = (id: string) => {
    setState((prev) => ({
      ...prev,
      priceAlerts: (prev.priceAlerts || []).filter((a) => a.id !== id),
    }));
  };

  const priceAlerts = state.priceAlerts || [];
  const triggeredAlertsCount = priceAlerts.filter((a) => Boolean(a.triggeredAt)).length;

  const handleSimulateDeposit = (
    symbol: string,
    amount: number,
    from: string
  ) => {
    if (amount <= 0) return;
    setState((prev) => {
      const target = prev.holdings.find((h) => h.symbol === symbol);
      const price = target?.priceUsd || 1;
      const nextHoldings = prev.holdings.map((h) =>
        h.symbol === symbol ? { ...h, balance: h.balance + amount } : h
      );
      const newTx: CryptoTransaction = {
        id: `tx-${Date.now()}`,
        type: 'receive',
        symbol,
        amount,
        usdValue: amount * price,
        counterparty: from,
        timestampLabel: 'Just now',
        status: 'Confirmed',
        txHash: `0x${Math.random().toString(16).slice(2, 6)}...${Math.random().toString(16).slice(2, 6)}`,
      };
      return {
        ...prev,
        holdings: nextHoldings,
        transactions: [newTx, ...prev.transactions],
      };
    });
    showToast(`Received +${formatTokenAmount(amount)} ${symbol}`);
  };

  const handleSendOrBuy = (
    mode: 'send' | 'buy' | 'sell',
    symbol: string,
    amount: number,
    counterparty: string
  ) => {
    if (amount <= 0) return;

    // On Buy or Sell, randomly send the market straight up or straight down
    const isTrade = mode === 'buy' || mode === 'sell';
    const goesUp = Math.random() < 0.5;
    const pctDelta = isTrade
      ? (goesUp ? 1 : -1) * (10 + Math.random() * 32)
      : 0;
    const priceMultiplier = 1 + pctDelta / 100;

    setState((prev) => {
      const target = prev.holdings.find(
        (h) => h.symbol.toUpperCase() === symbol.toUpperCase()
      );
      const template = CRYPTO_TEMPLATES.find(
        (t) => t.symbol.toUpperCase() === symbol.toUpperCase()
      );
      const price = target?.priceUsd || template?.priceUsd || 1;

      const buildTradeHolding = (h: TokenHolding): TokenHolding => {
        const nextBal =
          mode === 'buy'
            ? h.balance + amount
            : Math.max(0, h.balance - amount);

        if (!isTrade) {
          return { ...h, balance: nextBal };
        }

        const nextPrice = Math.max(0.000001, h.priceUsd * priceMultiplier);
        const nextChange = Number((h.change24hPct + pctDelta).toFixed(2));
        const prevHist = ensureTokenPriceHistory(h);
        const tradeEntry: PriceHistoryEntry = {
          id: `ph-trade-${Date.now()}-${h.symbol}`,
          priceUsd:
            nextPrice < 0.01
              ? Number(nextPrice.toFixed(8))
              : nextPrice < 1
              ? Number(nextPrice.toFixed(4))
              : Number(nextPrice.toFixed(2)),
          changePct: Number(pctDelta.toFixed(2)),
          timestampLabel: new Date().toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          }),
        };
        const nextHistory = [tradeEntry, ...prevHist].slice(0, 24);
        return {
          ...h,
          balance: nextBal,
          priceUsd: nextPrice,
          change24hPct: nextChange,
          priceHistory: nextHistory,
          sparkline: sparklineFromHistory(nextHistory, nextPrice),
        };
      };

      let nextHoldings = prev.holdings.map((h) =>
        h.symbol.toUpperCase() === symbol.toUpperCase() ? buildTradeHolding(h) : h
      );

      if (!target && template) {
        const seed = template.symbol.charCodeAt(0) || 1;
        const baseHist = buildPriceHistory(
          template.priceUsd,
          template.change24hPct,
          8,
          seed
        );
        const baseToken: TokenHolding = {
          id: `${template.symbol.toLowerCase()}-${Date.now()}`,
          symbol: template.symbol,
          name: template.name,
          network: template.network,
          balance: 0,
          priceUsd: template.priceUsd,
          change24hPct: template.change24hPct,
          color: template.color,
          category: template.category,
          priceHistory: baseHist,
          sparkline: makeSparkline(template.change24hPct, 20, seed),
        };
        nextHoldings = [buildTradeHolding(baseToken), ...nextHoldings];
      }

      const nextChartShape: ChartShape = isTrade
        ? goesUp
          ? Math.random() < 0.5
            ? 'parabolic'
            : 'bull'
          : Math.random() < 0.5
          ? 'crash'
          : 'dip_recovery'
        : prev.profile.chartShape;

      let nextProfile = {
        ...prev.profile,
        chartShape: nextChartShape,
        liveTick: isTrade ? true : prev.profile.liveTick,
      };

      if (isTrade && prev.profile.useManualTotal) {
        const tradeDeltaUsd =
          prev.profile.manualTotalBalance * (pctDelta / 100);
        nextProfile = {
          ...nextProfile,
          manualTotalBalance: Math.max(
            0,
            Number((prev.profile.manualTotalBalance + tradeDeltaUsd).toFixed(2))
          ),
          manualChangeUsd: Number(
            (prev.profile.manualChangeUsd + tradeDeltaUsd).toFixed(2)
          ),
          manualChangePct: Number(
            (prev.profile.manualChangePct + pctDelta).toFixed(2)
          ),
        };
      }

      const newTx: CryptoTransaction = {
        id: `tx-${Date.now()}`,
        type: mode,
        symbol,
        amount,
        usdValue: amount * price,
        counterparty,
        timestampLabel: 'Just now',
        status: 'Confirmed',
        txHash: `0x${Math.random().toString(16).slice(2, 6)}...${Math.random().toString(16).slice(2, 6)}`,
      };
      return {
        ...prev,
        profile: nextProfile,
        holdings: nextHoldings,
        transactions: [newTx, ...prev.transactions],
      };
    });

    if (isTrade) {
      setLiveTickSeq((n) => n + 1);
    }

    showToast(
      mode === 'buy'
        ? `Bought ${formatTokenAmount(amount)} ${symbol}`
        : mode === 'sell'
        ? `Sold ${formatTokenAmount(amount)} ${symbol}`
        : `Sent ${formatTokenAmount(amount)} ${symbol}`
    );
  };

  const handleQuickSellAllPortfolio = () => {
    const sellable = state.holdings.filter((h) => h.balance > 0);
    if (sellable.length === 0) return;

    const totalSoldUsd = sellable.reduce(
      (sum, h) => sum + h.balance * h.priceUsd,
      0
    );

    setState((prev) => {
      const sellTxs: CryptoTransaction[] = prev.holdings
        .filter((h) => h.balance > 0)
        .map((h, i) => ({
          id: `tx-qsell-${Date.now()}-${i}`,
          type: 'sell',
          symbol: h.symbol,
          amount: h.balance,
          usdValue: h.balance * h.priceUsd,
          counterparty: 'Quick Sell · Instant',
          timestampLabel: 'Just now',
          status: 'Confirmed',
          txHash: `0x${Math.random().toString(16).slice(2, 6)}...${Math.random().toString(16).slice(2, 6)}`,
        }));

      return {
        ...prev,
        holdings: prev.holdings.map((h) => ({ ...h, balance: 0 })),
        transactions: [...sellTxs, ...prev.transactions],
      };
    });

    showToast(`Quick sold all holdings (${formatUsd(totalSoldUsd)})`);
  };

  const handleAddRichGoal = (goal: RichGoal) => {
    setState((prev) => ({
      ...prev,
      richGoals: [...(prev.richGoals ?? DEFAULT_RICH_GOALS), goal],
    }));
    showToast(`Added goal: ${goal.name}`);
  };

  const handleDeleteRichGoal = (id: string) => {
    setState((prev) => ({
      ...prev,
      richGoals: (prev.richGoals ?? DEFAULT_RICH_GOALS).filter(
        (g) => g.id !== id
      ),
    }));
  };

  const handleResetRichGoals = () => {
    setState((prev) => ({
      ...prev,
      richGoals: DEFAULT_RICH_GOALS,
    }));
    showToast('Reset rich goals');
  };

  const handleExecuteSwap = (
    fromSymbol: string,
    fromAmount: number,
    toSymbol: string,
    toAmount: number
  ) => {
    setState((prev) => {
      const fromToken = prev.holdings.find((h) => h.symbol === fromSymbol);
      const usdVal = fromAmount * (fromToken?.priceUsd || 0);
      const nextHoldings = prev.holdings.map((h) => {
        if (h.symbol === fromSymbol && h.symbol === toSymbol) {
          return { ...h, balance: Math.max(0, h.balance - fromAmount + toAmount) };
        }
        if (h.symbol === fromSymbol) {
          return { ...h, balance: Math.max(0, h.balance - fromAmount) };
        }
        if (h.symbol === toSymbol) {
          return { ...h, balance: h.balance + toAmount };
        }
        return h;
      });
      const newTx: CryptoTransaction = {
        id: `tx-${Date.now()}`,
        type: 'swap',
        symbol: fromSymbol,
        amount: fromAmount,
        toSymbol,
        toAmount,
        usdValue: usdVal,
        counterparty: 'Vaultx Router',
        timestampLabel: 'Just now',
        status: 'Confirmed',
        txHash: `0x${Math.random().toString(16).slice(2, 6)}...${Math.random().toString(16).slice(2, 6)}`,
      };
      return {
        ...prev,
        holdings: nextHoldings,
        transactions: [newTx, ...prev.transactions],
      };
    });
    showToast(`Swapped ${fromSymbol} → ${toSymbol}`);
  };

  const copyAddress = () => {
    navigator.clipboard?.writeText(state.profile.address);
    setCopiedAddr(true);
    setTimeout(() => setCopiedAddr(false), 1600);
  };

  const walletAppContent = (
    <div
      className={`flex flex-col min-h-full ${uiTheme.pageBg} ${
        phonePreview ? 'h-full overflow-y-auto no-scrollbar pb-20' : 'pb-20 md:pb-8'
      }`}
    >
      {/* Compact Sticky Mobile & Small-Landscape Top App Bar */}
      <header
        className={`sticky top-0 z-30 h-[48px] sm:h-[52px] px-3 sm:px-4 flex items-center justify-between border-b ${uiTheme.barBg} ${
          phonePreview ? '' : 'md:hidden'
        }`}
      >
        <button
          type="button"
          onClick={() => setWalletModalOpen(true)}
          onDoubleClick={() => setStudioSheetOpen(true)}
          className="min-h-[44px] flex items-center gap-2 text-left min-w-0 flex-1"
        >
          <div
            className={`w-8 h-8 rounded-full ${uiTheme.avatarBg} flex items-center justify-center text-xs font-bold shrink-0`}
          >
            {state.profile.name.slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold leading-tight truncate">
              {state.profile.name}
            </p>
            <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400 leading-tight truncate">
              {state.profile.address}
            </p>
          </div>
        </button>

        <div className="flex items-center gap-0.5 shrink-0">
          {/* Invisible change-number / studio trigger */}
          <button
            type="button"
            onClick={() => setStudioSheetOpen(true)}
            aria-label="Open options"
            className="w-6 min-h-[44px] opacity-0 cursor-default"
          />
          <PWAInstallButton compact />
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors"
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-500" />}
          </button>
          <button
            type="button"
            onClick={() => setRichGoalsOpen(true)}
            aria-label="Rich goals"
            title="Rich goals"
            className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full text-amber-500 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors"
          >
            <Crown className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() =>
              setAlertsModalState({ open: true, initialSymbol: null })
            }
            aria-label="Price alerts"
            className="relative min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors"
          >
            <Bell className="w-4 h-4" />
            {triggeredAlertsCount > 0 && (
              <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-blue-500" />
            )}
          </button>
          <button
            type="button"
            onClick={() =>
              updateProfile({ hideBalances: !state.profile.hideBalances })
            }
            aria-label={
              state.profile.hideBalances ? 'Show balances' : 'Hide balances'
            }
            className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors"
          >
            {state.profile.hideBalances ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
          </button>
        </div>
      </header>

      {/* Main Content Body */}
      <div className="px-3.5 pt-3.5 sm:px-5 md:px-0 md:pt-0 space-y-4 sm:space-y-5 flex-1">
        {activeTab === 'home' && (
          <>
            {/* Portfolio Hero & Interactive Chart Card */}
            <section className={`${uiTheme.cardRadius} ${uiTheme.cardBg} p-4 sm:p-5 space-y-3.5 sm:space-y-4`}>
              {/* Wallet Header inside card on Tablet / Landscape / PC */}
              <div className={phonePreview ? 'hidden' : 'hidden md:flex items-center justify-between'}>
                <button
                  type="button"
                  onClick={() => setWalletModalOpen(true)}
                  className="flex items-center gap-3 text-left"
                >
                  <div
                    className={`w-9 h-9 rounded-full ${uiTheme.avatarBg} flex items-center justify-center text-xs font-bold shrink-0`}
                  >
                    {state.profile.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <span className="text-sm font-semibold block">
                      {state.profile.name}
                    </span>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                      {state.profile.network} · {state.profile.address}
                    </p>
                  </div>
                </button>

                <div className="flex items-center gap-1">
                  {/* Invisible studio trigger on desktop card */}
                  <button
                    type="button"
                    onClick={() => setStudioSheetOpen(true)}
                    aria-label="Open options"
                    className="w-9 h-9 opacity-0 cursor-default"
                  />
                  <button
                    type="button"
                    onClick={copyAddress}
                    className="h-9 px-3 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1.5 transition-colors"
                  >
                    {copiedAddr ? (
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    {copiedAddr ? 'Copied' : 'Copy'}
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      updateProfile({
                        hideBalances: !state.profile.hideBalances,
                      })
                    }
                    aria-label="Toggle privacy mask"
                    className="w-9 h-9 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center transition-colors"
                  >
                    {state.profile.hideBalances ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Balance Headline (Invisibly tap-to-edit) */}
              <div>
                <div className="flex items-baseline justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => setWalletModalOpen(true)}
                    className="text-left focus:outline-none cursor-default"
                  >
                    <p
                      className={`text-[34px] sm:text-[40px] ${uiTheme.balanceFont} leading-none tabular-nums`}
                    >
                      {state.profile.hideBalances
                        ? '••••••••'
                        : formatUsd(displayedBalance)}
                    </p>
                  </button>
                </div>

                <div className="mt-2 flex items-center gap-2 text-sm font-medium tabular-nums">
                  {hoverPoint ? (
                    <span className="text-slate-500 dark:text-slate-400 text-xs">
                      {hoverPoint.label}
                    </span>
                  ) : state.profile.hideBalances ? (
                    <span className="text-slate-500 dark:text-slate-400 text-xs">
                      Balances hidden
                    </span>
                  ) : (
                    <>
                      <span
                        className={`inline-flex items-center gap-0.5 ${
                          isGain ? 'text-emerald-500' : 'text-rose-500'
                        }`}
                      >
                        {isGain ? (
                          <ArrowUpRight className="w-4 h-4" />
                        ) : (
                          <ArrowDownRight className="w-4 h-4" />
                        )}
                        {formatSignedUsd(headlineChangeUsd)} (
                        {formatPct(headlineChangePct)})
                      </span>
                      <span className="text-slate-400 dark:text-slate-500 text-xs font-normal">
                        {timeframe === '1D' ? 'Today' : timeframe}
                      </span>
                    </>
                  )}
                </div>
              </div>

              {uiTheme.showMt5QuoteBar && (
                <div className="flex items-center justify-between text-[11px] font-mono tabular-nums text-slate-500 dark:text-slate-400 border-y border-slate-200/80 dark:border-[#243247] py-1.5">
                  <span>
                    {state.holdings[0]?.symbol || 'BTC'}USD · {timeframe}
                  </span>
                  <span>
                    Bid {formatUsd((state.holdings[0]?.priceUsd || 94280) * 0.9994)}{' '}
                    / Ask {formatUsd(state.holdings[0]?.priceUsd || 94280)}
                  </span>
                </div>
              )}

              {/* Scrubbable Chart */}
              <PortfolioChart
                totalBalance={headlineBalance}
                changePct={headlineChangePct}
                shape={state.profile.chartShape}
                timeframe={timeframe}
                onHoverPoint={setHoverPoint}
                bullColor={uiTheme.bullHex}
                bearColor={uiTheme.bearHex}
                showGrid={uiTheme.showChartGrid}
                gridColor={uiTheme.chartGridColor}
                liveTickSeq={liveTickSeq}
              />

              {/* Timeframe Segmented Buttons */}
              <div className="flex items-center justify-between gap-1 pt-1">
                {TIMEFRAMES.map((tf) => (
                  <button
                    key={tf}
                    type="button"
                    onClick={() => setTimeframe(tf)}
                    className={`flex-1 min-h-[36px] ${uiTheme.itemRadius} text-xs font-semibold transition-colors whitespace-nowrap ${
                      timeframe === tf
                        ? uiTheme.activeTimeframeBg
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    {tf}
                  </button>
                ))}
              </div>
            </section>

            {/* Primary Thumb Actions Row */}
            <section className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 sm:gap-2.5">
              {(
                [
                  {
                    id: 'buy',
                    label: 'Buy',
                    icon: CreditCard,
                    onClick: () => setSendBuyState({ open: true, mode: 'buy' }),
                  },
                  {
                    id: 'sell',
                    label: 'Sell',
                    icon: DollarSign,
                    onClick: () => setSendBuyState({ open: true, mode: 'sell' }),
                  },
                  {
                    id: 'quick-sell',
                    label: 'Quick Sell',
                    icon: Zap,
                    onClick: () => setQuickSellOpen(true),
                  },
                  {
                    id: 'send',
                    label: 'Send',
                    icon: ArrowUpRight,
                    onClick: () => setSendBuyState({ open: true, mode: 'send' }),
                  },
                  {
                    id: 'receive',
                    label: 'Receive',
                    icon: ArrowDownLeft,
                    onClick: () =>
                      setReceiveState({ open: true, scannerDirect: false }),
                  },
                  {
                    id: 'swap',
                    label: 'Swap',
                    icon: RefreshCw,
                    onClick: () => setActiveTab('swap'),
                  },
                ] as const
              ).map((act) => {
                const Icon = act.icon;
                const isQuickSell = act.id === 'quick-sell';
                return (
                  <button
                    key={act.id}
                    type="button"
                    onClick={act.onClick}
                    className={`min-h-[60px] sm:min-h-[70px] py-2 sm:py-2.5 px-1.5 ${uiTheme.itemRadius} ${uiTheme.cardBg} ${uiTheme.rowHover} active:scale-[0.97] flex flex-col items-center justify-center gap-1 sm:gap-1.5 transition-all`}
                  >
                    <div
                      className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center ${
                        isQuickSell
                          ? 'bg-rose-500/15 text-rose-500'
                          : uiTheme.accentIconBox
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-[11px] sm:text-xs font-semibold whitespace-nowrap">
                      {act.label}
                    </span>
                  </button>
                );
              })}
            </section>

            {/* Holdings List */}
            <section className="space-y-2.5">
              <div className="flex items-center justify-between px-1">
                <h2 className="text-sm font-semibold">Assets</h2>
                <button
                  type="button"
                  onClick={() => setQuickSellOpen(true)}
                  className="text-xs font-semibold text-rose-500 hover:text-rose-400 flex items-center gap-1 transition-colors"
                >
                  <Zap className="w-3.5 h-3.5" />
                  Quick Sell
                </button>
              </div>

              <div
                className={`${uiTheme.cardRadius} ${uiTheme.cardBg} ${uiTheme.divider} overflow-hidden`}
              >
                {state.holdings.length === 0 ? (
                  <div className="p-8 text-center text-sm text-slate-500 dark:text-slate-400">
                    No assets in wallet.
                  </div>
                ) : (
                  state.holdings.map((token) => {
                    const valueUsd = token.balance * token.priceUsd;
                    const up = token.change24hPct >= 0;
                    return (
                      <button
                        key={token.id}
                        type="button"
                        onClick={() =>
                          setTokenModalState({ open: true, token })
                        }
                        className={`w-full min-h-[68px] px-4 py-3.5 flex items-center justify-between gap-3 text-left ${uiTheme.rowHover} transition-colors`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <TokenIcon
                            symbol={token.symbol}
                            color={token.color}
                            size={40}
                          />
                          <div className="min-w-0">
                            <p className="text-sm font-semibold truncate">
                              {token.name}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 tabular-nums truncate">
                              {state.profile.hideBalances
                                ? `•••• ${token.symbol}`
                                : `${formatTokenAmount(token.balance)} ${token.symbol}`}
                            </p>
                          </div>
                        </div>

                        <div className="hidden sm:block">
                          <Sparkline data={token.sparkline} positive={up} />
                        </div>

                        <div className="text-right shrink-0">
                          <p className="text-sm font-semibold tabular-nums">
                            {state.profile.hideBalances
                              ? '••••••'
                              : formatUsd(valueUsd)}
                          </p>
                          <p
                            className={`text-xs font-medium tabular-nums inline-flex items-center justify-end gap-0.5 ${
                              up ? 'text-emerald-500' : 'text-rose-500'
                            }`}
                          >
                            {up ? (
                              <ArrowUpRight className="w-3 h-3" />
                            ) : (
                              <ArrowDownRight className="w-3 h-3" />
                            )}
                            {formatPct(token.change24hPct)}
                          </p>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </section>
          </>
        )}

        {activeTab === 'swap' && (
          <SwapView
            holdings={state.holdings}
            onExecuteSwap={handleExecuteSwap}
            uiTheme={uiTheme}
          />
        )}

        {activeTab === 'activity' && (
          <ActivityView
            transactions={state.transactions}
            holdings={state.holdings}
            stealthMode={true}
            onEditTx={(tx) => setTxModalState({ open: true, tx })}
            onAddTx={() => setTxModalState({ open: true, tx: null })}
            onTriggerMarketHype={() => triggerDailyMarketHype.current(false)}
            uiTheme={uiTheme}
          />
        )}

        {activeTab === 'markets' && (
          <MarketsView
            holdings={state.holdings}
            stealthMode={true}
            onEditToken={(token) =>
              setTokenModalState({ open: true, token })
            }
            onAddToken={() => setTokenModalState({ open: true, token: null })}
            onQuickAddToken={(token) => {
              handleSaveToken(token);
              showToast(`Added ${token.symbol} to portfolio`);
            }}
            uiTheme={uiTheme}
          />
        )}

        {activeTab === 'news' && (
          <NewsView
            uiTheme={uiTheme}
            holdings={state.holdings}
            hypeItems={state.transactions.filter((t) => t.type === 'hype')}
            onTriggerMarketHype={() => triggerDailyMarketHype.current(false)}
          />
        )}
      </div>

      {/* Fixed Bottom Mobile & Small-Landscape Tab Bar */}
      <nav
        aria-label="Primary mobile navigation"
        className={`${
          phonePreview ? 'sticky bottom-0 mt-auto' : 'fixed bottom-0 left-0 right-0 md:hidden'
        } z-40 border-t ${uiTheme.barBg} pb-safe`}
      >
        <div className={`grid grid-cols-5 items-center ${phonePreview ? 'h-[60px]' : 'h-[50px] sm:h-[58px]'}`}>
          {(
            [
              { id: 'home', label: 'Home', icon: Home },
              { id: 'swap', label: 'Swap', icon: RefreshCw },
              { id: 'news', label: 'News', icon: Newspaper },
              { id: 'activity', label: 'Activity', icon: Clock },
              { id: 'markets', label: 'Markets', icon: LineChart },
            ] as const
          ).map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`min-h-[44px] flex ${
                  phonePreview ? 'flex-col gap-1' : 'flex-col sm:flex-row gap-0.5 sm:gap-1.5'
                } items-center justify-center transition-colors whitespace-nowrap ${
                  active
                    ? uiTheme.activeTabText
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <Icon className="w-[19px] h-[19px] sm:w-[20px] sm:h-[20px]" strokeWidth={active ? 2.4 : 1.8} />
                <span className="text-[10px] sm:text-xs font-semibold tracking-tight whitespace-nowrap">
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );

  return (
    <div className={`min-h-screen ${uiTheme.outerBg}`}>
      {/* Desktop & Wide-Landscape Top Navigation Bar (Clean 3-zone header) */}
      <header className="hidden md:flex items-center justify-between gap-4 lg:gap-8 max-w-7xl mx-auto px-5 lg:px-8 h-14 lg:h-16 border-b border-slate-200/70 dark:border-slate-800/70">
        <button
          type="button"
          onClick={() => setActiveTab('home')}
          onDoubleClick={() => setStudioSheetOpen(true)}
          className="text-base lg:text-lg font-bold tracking-tight whitespace-nowrap shrink-0 flex items-center gap-2.5"
        >
          <span
            className={`w-8 h-8 rounded-xl ${uiTheme.avatarBg} flex items-center justify-center`}
          >
            <Wallet className="w-4 h-4" />
          </span>
          <span>{uiTheme.brandTitle}</span>
        </button>

        <nav className="flex items-center gap-4 lg:gap-7 text-sm font-medium">
          {(
            [
              { id: 'home', label: 'Portfolio' },
              { id: 'swap', label: 'Swap' },
              { id: 'news', label: 'News' },
              { id: 'activity', label: 'Activity' },
              { id: 'markets', label: 'Markets' },
            ] as const
          ).map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveTab(item.id)}
              className={`whitespace-nowrap shrink-0 py-1 border-b-2 transition-colors ${
                activeTab === item.id
                  ? `${uiTheme.activeDesktopBorder} font-semibold`
                  : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-1.5 lg:gap-2 shrink-0">
          {/* Invisible change-number trigger */}
          <button
            type="button"
            onClick={() => setStudioSheetOpen(true)}
            aria-label="Open options"
            className="w-16 h-10 opacity-0 cursor-default"
          />
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            className="h-10 px-2.5 lg:px-3 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-800 flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
          >
            {isDark ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-indigo-500" />
            )}
            <span className="hidden xl:inline">{isDark ? 'Light' : 'Dark'}</span>
          </button>
          <button
            type="button"
            onClick={() => setRichGoalsOpen(true)}
            aria-label="Rich goals"
            title="Rich goals"
            className="w-10 h-10 rounded-xl text-amber-500 hover:bg-slate-200/70 dark:hover:bg-slate-800 flex items-center justify-center transition-colors"
          >
            <Crown className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() =>
              setAlertsModalState({ open: true, initialSymbol: null })
            }
            aria-label="Price alerts"
            className="relative w-10 h-10 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-800 flex items-center justify-center transition-colors"
          >
            <Bell className="w-4 h-4" />
            {triggeredAlertsCount > 0 && (
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-blue-500" />
            )}
          </button>
          <button
            type="button"
            onClick={() => setSendBuyState({ open: true, mode: 'buy' })}
            className={`px-4 py-2 text-xs font-semibold rounded-xl ${uiTheme.accentBg} transition-colors whitespace-nowrap shrink-0`}
          >
            Buy Crypto
          </button>
        </div>
      </header>

      {/* Optional Phone Frame View on Desktop */}
      {phonePreview ? (
        <div className="hidden lg:flex flex-col items-center justify-center py-8 px-4 gap-4">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPhonePreview(false)}
              className="h-9 px-3.5 rounded-xl bg-white dark:bg-[#12161F] border border-slate-200 dark:border-slate-800 text-xs font-medium flex items-center gap-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              <Monitor className="w-3.5 h-3.5" />
              Exit Phone View
            </button>
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
              className="h-9 px-3.5 rounded-xl bg-white dark:bg-[#12161F] border border-slate-200 dark:border-slate-800 text-xs font-medium flex items-center gap-1.5"
            >
              {isDark ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
            </button>
          </div>

          <div
            className={`relative w-[390px] h-[780px] rounded-[44px] border-[8px] border-slate-900 dark:border-slate-800 shadow-2xl overflow-hidden ${uiTheme.pageBg} flex flex-col`}
          >
            {walletAppContent}
            {activeTab === 'home' && !isLocked && (
              <button
                type="button"
                onClick={() =>
                  setReceiveState({ open: true, scannerDirect: true })
                }
                aria-label="Scan QR code"
                title="Scan QR code"
                className={`absolute bottom-[76px] right-4 z-30 w-14 h-14 rounded-full ${uiTheme.fabBg} active:scale-95 shadow-lg flex items-center justify-center transition-all`}
              >
                <ScanLine className="w-6 h-6" />
              </button>
            )}
            <BiometricLockScreen
              open={isLocked}
              contained={true}
              walletName={state.profile.name}
              method={state.profile.biometricMethod || 'faceid'}
              onChangeMethod={(method) =>
                updateProfile({ biometricMethod: method })
              }
              onUnlock={() => setIsLocked(false)}
            />
          </div>
        </div>
      ) : null}

      <main
        className={`${
          phonePreview ? 'lg:hidden' : ''
        } max-w-7xl mx-auto md:px-5 lg:px-8 md:py-5 lg:py-6`}
      >
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 lg:gap-6 items-start">
          {/* Left / Main Crypto App Column */}
          <div className="md:col-span-7 lg:col-span-8">{walletAppContent}</div>

          {/* Right Native Allocation & Activity Column on Tablet Landscape & PC */}
          <aside className="hidden md:block md:col-span-5 lg:col-span-4 space-y-5 sticky top-5 lg:top-6">
            {/* Portfolio Allocation Breakdown */}
            <section className={`${uiTheme.cardRadius} ${uiTheme.cardBg} p-4 sm:p-5 space-y-3.5`}>
              <div className="flex items-baseline justify-between gap-2">
                <h2 className="text-sm font-semibold">Allocation</h2>
                <span className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                  {state.holdings.length} assets · {state.profile.network}
                </span>
              </div>

              {allocationItems.length === 0 ? (
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  No positive balances yet.
                </p>
              ) : (
                <>
                  <div className="h-2.5 w-full rounded-full bg-slate-200/80 dark:bg-slate-800 overflow-hidden flex gap-0.5">
                    {allocationItems.map((item) => (
                      <div
                        key={item.id}
                        style={{
                          width: `${Math.max(2, item.pct)}%`,
                          backgroundColor: item.color,
                        }}
                        title={`${item.symbol} ${item.pct.toFixed(1)}%`}
                        className="h-full first:rounded-l-full last:rounded-r-full transition-all"
                      />
                    ))}
                  </div>

                  <div className="space-y-2 pt-0.5">
                    {allocationItems.slice(0, 5).map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between gap-2 text-xs"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: item.color }}
                          />
                          <span className="font-semibold truncate">{item.symbol}</span>
                          <span className="text-slate-500 dark:text-slate-400 truncate">
                            {item.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-2.5 shrink-0 tabular-nums">
                          <span className="text-slate-500 dark:text-slate-400">
                            {state.profile.hideBalances
                              ? '••••'
                              : formatUsd(item.valueUsd)}
                          </span>
                          <span className="font-semibold w-11 text-right">
                            {item.pct.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </section>

            {activeTab !== 'activity' && (
              <ActivityView
                transactions={state.transactions}
                holdings={state.holdings}
                stealthMode={true}
                onEditTx={(tx) => setTxModalState({ open: true, tx })}
                onAddTx={() => setTxModalState({ open: true, tx: null })}
                onTriggerMarketHype={() => triggerDailyMarketHype.current(false)}
                uiTheme={uiTheme}
              />
            )}
          </aside>
        </div>
      </main>

      {/* Hidden Customizer Bottom Sheet (triggered invisibly or via double-tap) */}
      <BottomSheet
        open={studioSheetOpen}
        onClose={() => setStudioSheetOpen(false)}
        title="Wallet Options"
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <span className="text-sm font-medium">Appearance</span>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => {
                  setStudioSheetOpen(false);
                  setPhonePreview(!phonePreview);
                }}
                className="hidden lg:flex h-10 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold items-center gap-1.5"
              >
                <Smartphone className="w-4 h-4" />
                {phonePreview ? 'Desktop View' : 'Phone View'}
              </button>
              <button
                type="button"
                onClick={toggleTheme}
                aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
                className="h-10 px-3.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold flex items-center gap-1.5"
              >
                {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-500" />}
                {isDark ? 'Light' : 'Dark'}
              </button>
            </div>
          </div>

          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">
              Portfolio Presets
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {PORTFOLIO_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => {
                    applyPreset(preset);
                    setStudioSheetOpen(false);
                  }}
                  className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200/80 dark:hover:bg-slate-800 text-left transition-colors"
                >
                  <p className="text-xs font-semibold truncate">{preset.label}</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 tabular-nums truncate">
                    {preset.subtitle}
                  </p>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              type="button"
              onClick={() => {
                setStudioSheetOpen(false);
                setWalletModalOpen(true);
              }}
              className="h-11 rounded-xl bg-blue-600 text-white text-xs font-semibold"
            >
              Edit Total Balance
            </button>
            <button
              type="button"
              onClick={() => {
                setStudioSheetOpen(false);
                setTokenModalState({ open: true, token: null });
              }}
              className="h-11 rounded-xl bg-slate-200 dark:bg-slate-800 text-xs font-semibold"
            >
              Add Custom Coin
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                setStudioSheetOpen(false);
                setTxModalState({ open: true, tx: null });
              }}
              className="h-11 rounded-xl bg-slate-100 dark:bg-slate-800/70 text-xs font-medium"
            >
              Add Transaction
            </button>
            <button
              type="button"
              onClick={() => updateProfile({ liveTick: !state.profile.liveTick })}
              className="h-11 rounded-xl bg-slate-100 dark:bg-slate-800/70 text-xs font-medium"
            >
              Live Tick: {state.profile.liveTick ? 'On' : 'Off'}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                const nextEnabled = !state.profile.biometricLockEnabled;
                updateProfile({ biometricLockEnabled: nextEnabled });
                if (!nextEnabled) {
                  setIsLocked(false);
                }
                showToast(
                  nextEnabled
                    ? 'Face ID / Fingerprint lock enabled'
                    : 'Face ID / Fingerprint lock disabled'
                );
              }}
              className={`flex-1 h-11 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors ${
                state.profile.biometricLockEnabled
                  ? 'bg-blue-600/15 text-blue-600 dark:text-blue-400 border border-blue-500/30'
                  : 'bg-slate-100 dark:bg-slate-800/70 text-slate-700 dark:text-slate-200'
              }`}
            >
              <ScanFace className="w-4 h-4 shrink-0" />
              <span className="truncate">
                Face ID / Fingerprint:{' '}
                {state.profile.biometricLockEnabled ? 'On' : 'Off'}
              </span>
            </button>
            {state.profile.biometricLockEnabled && (
              <button
                type="button"
                onClick={() => {
                  setStudioSheetOpen(false);
                  setIsLocked(true);
                }}
                className="h-11 px-3.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-semibold flex items-center justify-center gap-1.5 shrink-0 whitespace-nowrap"
              >
                <Lock className="w-3.5 h-3.5" />
                Lock Now
              </button>
            )}
          </div>

          <PWAInstallButton onDone={() => setStudioSheetOpen(false)} />

          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => {
                setStudioSheetOpen(false);
                setAlertsModalState({ open: true, initialSymbol: null });
              }}
              className="h-10 rounded-xl bg-slate-100 dark:bg-slate-800/70 text-xs font-medium"
            >
              Alerts ({priceAlerts.length})
            </button>
            <button
              type="button"
              onClick={() => {
                setStudioSheetOpen(false);
                setRichGoalsOpen(true);
              }}
              className="h-10 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 text-xs font-semibold flex items-center justify-center gap-1"
            >
              <Crown className="w-3.5 h-3.5" />
              Rich Goals
            </button>
            <button
              type="button"
              onClick={() => {
                setState(DEFAULT_PORTFOLIO_STATE);
                setIsLocked(false);
                setStudioSheetOpen(false);
                showToast('Reset to default');
              }}
              className="h-10 rounded-xl bg-slate-100 dark:bg-slate-800/70 text-xs font-medium text-rose-500"
            >
              Reset All
            </button>
          </div>
        </div>
      </BottomSheet>

      {/* Modals */}
      <WalletEditModal
        open={walletModalOpen}
        onClose={() => setWalletModalOpen(false)}
        profile={state.profile}
        calculatedTotal={calculatedTotal}
        calculatedChangeUsd={calculatedChangeUsd}
        calculatedChangePct={calculatedChangePct}
        onSave={(updated) => updateProfile(updated)}
        onPreviewUiStyle={(uiStyle) => {
          updateProfile({ uiStyle });
          showToast(`UI: ${UI_THEMES[uiStyle].label}`);
        }}
        isDark={isDark}
        onToggleTheme={toggleTheme}
      />

      <TokenEditModal
        open={tokenModalState.open}
        onClose={() => setTokenModalState({ open: false, token: null })}
        token={tokenModalState.token}
        onSave={handleSaveToken}
        onDelete={handleDeleteToken}
        onOpenPriceAlert={(sym) =>
          setAlertsModalState({ open: true, initialSymbol: sym })
        }
      />

      <TxEditModal
        open={txModalState.open}
        onClose={() => setTxModalState({ open: false, tx: null })}
        tx={txModalState.tx}
        holdings={state.holdings}
        onSave={handleSaveTx}
        onDelete={handleDeleteTx}
      />

      <ReceiveModal
        open={receiveState.open}
        initialScannerOpen={receiveState.scannerDirect}
        onClose={() => setReceiveState({ open: false, scannerDirect: false })}
        address={state.profile.address}
        network={state.profile.network}
        holdings={state.holdings}
        onSimulateDeposit={handleSimulateDeposit}
        onImportAddress={(newAddress) => {
          updateProfile({ address: newAddress });
          showToast(`Imported ${newAddress}`);
        }}
      />

      {/* Home Floating Action Button for Direct QR Address Scan */}
      {activeTab === 'home' && !isLocked && (
        <button
          type="button"
          onClick={() => setReceiveState({ open: true, scannerDirect: true })}
          aria-label="Scan QR code"
          title="Scan QR code"
          className={`${
            phonePreview ? 'lg:hidden' : ''
          } fixed bottom-[64px] sm:bottom-[72px] right-4 md:bottom-8 md:right-8 z-30 w-12 h-12 sm:w-14 sm:h-14 rounded-full ${uiTheme.fabBg} active:scale-95 shadow-lg flex items-center justify-center transition-all`}
        >
          <ScanLine className="w-6 h-6" />
        </button>
      )}

      {/* Biometric Authentication Lock Overlay (standard & mobile view) */}
      {!phonePreview && (
        <BiometricLockScreen
          open={isLocked}
          walletName={state.profile.name}
          method={state.profile.biometricMethod || 'faceid'}
          onChangeMethod={(method) =>
            updateProfile({ biometricMethod: method })
          }
          onUnlock={() => setIsLocked(false)}
        />
      )}

      <SendBuyModal
        open={sendBuyState.open}
        mode={sendBuyState.mode}
        onClose={() => setSendBuyState({ ...sendBuyState, open: false })}
        holdings={state.holdings}
        onConfirm={handleSendOrBuy}
      />

      <QuickSellModal
        open={quickSellOpen}
        onClose={() => setQuickSellOpen(false)}
        holdings={state.holdings}
        onQuickSell={(sym, amt) =>
          handleSendOrBuy('sell', sym, amt, 'Quick Sell · Instant')
        }
        onQuickSellAllPortfolio={handleQuickSellAllPortfolio}
      />

      <RichGoalsModal
        open={richGoalsOpen}
        onClose={() => setRichGoalsOpen(false)}
        currentBalance={headlineBalance}
        goals={richGoals}
        onAddGoal={handleAddRichGoal}
        onDeleteGoal={handleDeleteRichGoal}
        onResetGoals={handleResetRichGoals}
        onTestPopup={(goal) => {
          setRichGoalsOpen(false);
          setRichBanner({ goal, currentBalance: headlineBalance });
        }}
      />

      <PriceAlertsModal
        open={alertsModalState.open}
        onClose={() =>
          setAlertsModalState({ open: false, initialSymbol: null })
        }
        holdings={state.holdings}
        alerts={priceAlerts}
        initialSymbol={alertsModalState.initialSymbol}
        onAddAlert={handleAddAlert}
        onUpdateAlert={handleUpdateAlert}
        onToggleAlert={handleToggleAlert}
        onDeleteAlert={handleDeleteAlert}
      />

      {/* Rich Thing Milestone Top Popup Banner */}
      {richBanner && (
        <div
          role="status"
          className="fixed top-4 left-1/2 -translate-x-1/2 z-[60] w-[calc(100%-2rem)] max-w-md rounded-2xl bg-white dark:bg-[#161B26] border border-amber-400/50 dark:border-amber-500/40 shadow-2xl p-3.5 flex items-center justify-between gap-3"
        >
          <button
            type="button"
            onClick={() => {
              setRichBanner(null);
              setRichGoalsOpen(true);
            }}
            className="flex items-center gap-3 text-left min-w-0 flex-1"
          >
            <div className="w-10 h-10 rounded-full bg-amber-500/20 text-amber-500 flex items-center justify-center shrink-0">
              <Crown className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-amber-600 dark:text-amber-400 truncate">
                You can now buy: {richBanner.goal.name}
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-300 tabular-nums truncate">
                Goal {formatUsd(richBanner.goal.priceUsd)} hit · Balance{' '}
                {formatUsd(richBanner.currentBalance)}
              </p>
            </div>
          </button>
          <button
            type="button"
            onClick={() => setRichBanner(null)}
            aria-label="Dismiss milestone popup"
            className="min-w-[36px] min-h-[36px] flex items-center justify-center rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Triggered Price Alert Push Banner */}
      {alertBanner && (
        <div
          className={`fixed left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-sm rounded-2xl bg-white dark:bg-[#181D29] border border-slate-200 dark:border-slate-700 shadow-2xl p-3.5 flex items-center justify-between gap-3 ${
            richBanner ? 'top-24' : 'top-4'
          }`}
        >
          <button
            type="button"
            onClick={() => {
              setAlertBanner(null);
              setAlertsModalState({
                open: true,
                initialSymbol: alertBanner.symbol,
              });
            }}
            className="flex items-center gap-3 text-left min-w-0 flex-1"
          >
            <div className="w-9 h-9 rounded-full bg-blue-600/15 text-blue-500 flex items-center justify-center shrink-0">
              <Bell className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold truncate">
                {alertBanner.symbol} Price Alert Triggered
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 tabular-nums truncate">
                {alertBanner.condition === 'above'
                  ? 'Reached above'
                  : 'Dropped below'}{' '}
                {formatUsd(alertBanner.targetPriceUsd)} · Now{' '}
                {formatUsd(alertBanner.priceUsd)}
              </p>
            </div>
          </button>
          <button
            type="button"
            onClick={() => setAlertBanner(null)}
            aria-label="Dismiss alert"
            className="min-w-[36px] min-h-[36px] flex items-center justify-center rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Subtle Toast Confirmation */}
      {toastMsg && (
        <div
          className={`fixed left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-semibold shadow-lg pointer-events-none ${
            richBanner || alertBanner ? 'top-24' : 'top-16'
          }`}
        >
          {toastMsg}
        </div>
      )}

      <OfflineIndicator />
    </div>
  );
}
