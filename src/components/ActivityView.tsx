import React from 'react';
import {
  ArrowDownLeft,
  ArrowUpRight,
  RefreshCw,
  CreditCard,
  DollarSign,
  Flame,
} from 'lucide-react';
import { CryptoTransaction, TokenHolding } from '../types/crypto';
import { UI_THEMES, UiThemeConfig } from '../data/uiThemes';
import { formatPct, formatTokenAmount, formatUsd } from '../utils/format';

interface ActivityViewProps {
  transactions: CryptoTransaction[];
  holdings: TokenHolding[];
  stealthMode: boolean;
  onEditTx: (tx: CryptoTransaction) => void;
  onAddTx: () => void;
  onTriggerMarketHype?: () => void;
  uiTheme?: UiThemeConfig;
}

export const ActivityView: React.FC<ActivityViewProps> = ({
  transactions,
  onEditTx,
  onTriggerMarketHype,
  uiTheme = UI_THEMES.candles,
}) => {
  const renderIcon = (tx: CryptoTransaction) => {
    switch (tx.type) {
      case 'receive':
        return (
          <div className="w-10 h-10 rounded-full bg-emerald-500/12 text-emerald-500 flex items-center justify-center shrink-0">
            <ArrowDownLeft className="w-5 h-5" />
          </div>
        );
      case 'send':
        return (
          <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center shrink-0">
            <ArrowUpRight className="w-5 h-5" />
          </div>
        );
      case 'swap':
        return (
          <div className="w-10 h-10 rounded-full bg-blue-500/12 text-blue-500 flex items-center justify-center shrink-0">
            <RefreshCw className="w-4 h-4" />
          </div>
        );
      case 'buy':
        return (
          <div className="w-10 h-10 rounded-full bg-indigo-500/12 text-indigo-500 flex items-center justify-center shrink-0">
            <CreditCard className="w-4 h-4" />
          </div>
        );
      case 'sell':
        return (
          <div className="w-10 h-10 rounded-full bg-rose-500/12 text-rose-500 flex items-center justify-center shrink-0">
            <DollarSign className="w-4 h-4" />
          </div>
        );
      case 'hype': {
        const isBullish = tx.sentiment !== 'bearish';
        return (
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
              isBullish
                ? 'bg-amber-500/15 text-amber-500'
                : 'bg-rose-500/15 text-rose-500'
            }`}
          >
            <Flame className="w-4 h-4" />
          </div>
        );
      }
    }
  };

  const labelForType = (tx: CryptoTransaction) => {
    if (tx.type === 'hype') return tx.headline || `Market Hype: ${tx.symbol}`;
    if (tx.type === 'receive') return `Received ${tx.symbol}`;
    if (tx.type === 'send') return `Sent ${tx.symbol}`;
    if (tx.type === 'buy') return `Bought ${tx.symbol}`;
    if (tx.type === 'sell') return `Sold ${tx.symbol}`;
    return `Swapped ${tx.symbol}${tx.toSymbol ? ` → ${tx.toSymbol}` : ''}`;
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2 px-1">
        <h2 className="text-sm font-semibold">Recent Activity</h2>
        {onTriggerMarketHype && (
          <button
            type="button"
            onClick={onTriggerMarketHype}
            className={`min-h-[36px] px-3 ${uiTheme.itemRadius} ${uiTheme.cardBg} ${uiTheme.rowHover} text-xs font-semibold flex items-center gap-1.5 text-amber-600 dark:text-amber-400 transition-colors whitespace-nowrap shrink-0`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>Market Hype</span>
          </button>
        )}
      </div>

      {transactions.length === 0 ? (
        <div
          className={`p-8 ${uiTheme.cardRadius} ${uiTheme.cardBg} text-center text-sm text-slate-500 dark:text-slate-400`}
        >
          No transactions yet.
        </div>
      ) : (
        <div
          className={`${uiTheme.cardRadius} ${uiTheme.cardBg} ${uiTheme.divider} overflow-hidden`}
        >
          {transactions.map((tx) => {
            if (tx.type === 'hype') {
              const impact =
                tx.impactPct ??
                (tx.sentiment === 'bearish' ? -Math.abs(tx.amount) : Math.abs(tx.amount));
              const isBullish = impact >= 0;
              return (
                <button
                  key={tx.id}
                  type="button"
                  onClick={() => onEditTx(tx)}
                  className={`w-full min-h-[72px] px-4 py-3 flex items-start justify-between gap-3 text-left ${uiTheme.rowHover} transition-colors`}
                >
                  <div className="flex items-start gap-3 min-w-0">
                    {renderIcon(tx)}
                    <div className="min-w-0 space-y-0.5">
                      <p className="text-sm font-semibold leading-snug line-clamp-2">
                        {labelForType(tx)}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                        {tx.counterparty} · {tx.symbol} · {tx.timestampLabel}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0 pt-0.5">
                    <p
                      className={`text-sm font-semibold tabular-nums ${
                        isBullish ? 'text-emerald-500' : 'text-rose-500'
                      }`}
                    >
                      {formatPct(impact)}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                      {tx.usdValue > 0 ? formatUsd(tx.usdValue) : tx.symbol}
                    </p>
                  </div>
                </button>
              );
            }

            const isPositive = tx.type === 'receive' || tx.type === 'buy';
            return (
              <button
                key={tx.id}
                type="button"
                onClick={() => onEditTx(tx)}
                className={`w-full min-h-[68px] px-4 py-3 flex items-center justify-between gap-3 text-left ${uiTheme.rowHover} transition-colors`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  {renderIcon(tx)}
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate">{labelForType(tx)}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                      {tx.counterparty} · {tx.timestampLabel} · {tx.status}
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <p
                    className={`text-sm font-semibold tabular-nums ${
                      isPositive ? 'text-emerald-500' : ''
                    }`}
                  >
                    {isPositive ? '+' : tx.type === 'send' ? '-' : ''}
                    {formatTokenAmount(tx.amount)} {tx.symbol}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                    {formatUsd(tx.usdValue)}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
