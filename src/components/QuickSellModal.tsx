import React from 'react';
import { Zap } from 'lucide-react';
import { BottomSheet } from './BottomSheet';
import { TokenHolding } from '../types/crypto';
import { TokenIcon } from './TokenIcon';
import { formatTokenAmount, formatUsd } from '../utils/format';

interface QuickSellModalProps {
  open: boolean;
  onClose: () => void;
  holdings: TokenHolding[];
  onQuickSell: (symbol: string, amount: number) => void;
  onQuickSellAllPortfolio: () => void;
}

export const QuickSellModal: React.FC<QuickSellModalProps> = ({
  open,
  onClose,
  holdings,
  onQuickSell,
  onQuickSellAllPortfolio,
}) => {
  const sellable = holdings.filter((h) => h.balance > 0);
  const totalSellableUsd = sellable.reduce(
    (sum, h) => sum + h.balance * h.priceUsd,
    0
  );

  return (
    <BottomSheet open={open} onClose={onClose} title="Quick Sell">
      <div className="space-y-4">
        <div className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/70">
          <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
            <Zap className="w-4 h-4 text-rose-500 shrink-0" />
            <span>Tap a percentage for instant 1-tap sell</span>
          </div>
          <span className="text-xs font-semibold tabular-nums">
            {formatUsd(totalSellableUsd)}
          </span>
        </div>

        {sellable.length === 0 ? (
          <div className="py-10 text-center text-sm text-slate-500 dark:text-slate-400">
            No holdings with balance to sell.
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800/70 rounded-2xl border border-slate-200/70 dark:border-slate-800/80 overflow-hidden">
            {sellable.map((token) => {
              const valueUsd = token.balance * token.priceUsd;
              return (
                <div
                  key={token.id}
                  className="px-3.5 py-3 bg-white dark:bg-[#12161F] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <TokenIcon
                      symbol={token.symbol}
                      color={token.color}
                      size={36}
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-semibold truncate">
                          {token.symbol}
                        </span>
                        <span className="text-xs text-slate-500 dark:text-slate-400 truncate">
                          {token.name}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                        {formatTokenAmount(token.balance)} · {formatUsd(valueUsd)}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-1.5 shrink-0">
                    {(
                      [
                        { label: '25%', pct: 0.25 },
                        { label: '50%', pct: 0.5 },
                        { label: 'All', pct: 1 },
                      ] as const
                    ).map((opt) => (
                      <button
                        key={opt.label}
                        type="button"
                        onClick={() => {
                          const amt =
                            opt.pct === 1
                              ? token.balance
                              : Number((token.balance * opt.pct).toFixed(6));
                          if (amt > 0) {
                            onQuickSell(token.symbol, amt);
                          }
                        }}
                        className={`min-h-[38px] px-3 rounded-xl text-xs font-semibold transition-colors whitespace-nowrap ${
                          opt.pct === 1
                            ? 'bg-rose-600 hover:bg-rose-500 text-white'
                            : 'bg-rose-500/12 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {sellable.length > 1 && (
          <button
            type="button"
            onClick={() => {
              onQuickSellAllPortfolio();
              onClose();
            }}
            className="w-full h-12 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-sm flex items-center justify-center gap-2 transition-colors"
          >
            <Zap className="w-4 h-4" />
            Quick Sell All ({formatUsd(totalSellableUsd)})
          </button>
        )}
      </div>
    </BottomSheet>
  );
};
