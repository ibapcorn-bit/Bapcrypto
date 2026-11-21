import React, { useState } from 'react';
import { ArrowUpDown, ArrowRight } from 'lucide-react';
import { TokenHolding } from '../types/crypto';
import { UI_THEMES, UiThemeConfig } from '../data/uiThemes';
import { TokenIcon } from './TokenIcon';
import { formatTokenAmount, formatUsd } from '../utils/format';

interface SwapViewProps {
  holdings: TokenHolding[];
  onExecuteSwap: (
    fromSymbol: string,
    fromAmount: number,
    toSymbol: string,
    toAmount: number
  ) => void;
  uiTheme?: UiThemeConfig;
}

export const SwapView: React.FC<SwapViewProps> = ({
  holdings,
  onExecuteSwap,
  uiTheme = UI_THEMES.candles,
}) => {
  const [fromSymbol, setFromSymbol] = useState(holdings[0]?.symbol || 'BTC');
  const [toSymbol, setToSymbol] = useState(holdings[1]?.symbol || holdings[0]?.symbol || 'ETH');
  const [fromAmountStr, setFromAmountStr] = useState('0.25');
  const [customRate, setCustomRate] = useState<string>('');
  const [justSwapped, setJustSwapped] = useState(false);

  const fromToken = holdings.find((h) => h.symbol === fromSymbol) || holdings[0];
  const toToken = holdings.find((h) => h.symbol === toSymbol) || holdings[1] || holdings[0];

  const fromAmount = parseFloat(fromAmountStr) || 0;
  const naturalRate =
    fromToken && toToken && toToken.priceUsd > 0
      ? fromToken.priceUsd / toToken.priceUsd
      : 1;
  const effectiveRate =
    customRate.trim() !== '' && parseFloat(customRate) > 0
      ? parseFloat(customRate)
      : naturalRate;
  const toAmount = fromAmount * effectiveRate;
  const usdValue = fromAmount * (fromToken?.priceUsd || 0);

  const handleFlip = () => {
    setFromSymbol(toSymbol);
    setToSymbol(fromSymbol);
    setCustomRate('');
  };

  const handleSwap = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fromToken || !toToken || fromAmount <= 0) return;
    onExecuteSwap(fromToken.symbol, fromAmount, toToken.symbol, toAmount);
    setJustSwapped(true);
    setTimeout(() => setJustSwapped(false), 2200);
  };

  if (holdings.length < 1) {
    return (
      <div className="py-12 text-center text-sm text-slate-500 dark:text-slate-400">
        Add at least one token in Home to use Swap.
      </div>
    );
  }

  return (
    <form onSubmit={handleSwap} className="space-y-3">
      <div className={`p-4 ${uiTheme.cardRadius} ${uiTheme.cardBg}`}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
            You pay
          </span>
          {fromToken && (
            <button
              type="button"
              onClick={() => setFromAmountStr(String(fromToken.balance))}
              className={`text-xs font-medium ${uiTheme.accentText} tabular-nums`}
            >
              Balance: {formatTokenAmount(fromToken.balance)} {fromToken.symbol}
            </button>
          )}
        </div>

        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 shrink-0">
            {fromToken && (
              <TokenIcon symbol={fromToken.symbol} color={fromToken.color} size={36} />
            )}
            <select
              value={fromSymbol}
              onChange={(e) => {
                setFromSymbol(e.target.value);
                setCustomRate('');
              }}
              className="h-10 pr-2 bg-transparent text-base font-bold focus:outline-none cursor-pointer"
              aria-label="Pay token"
            >
              {holdings.map((h) => (
                <option key={h.id} value={h.symbol} className="bg-white dark:bg-[#12161F]">
                  {h.symbol}
                </option>
              ))}
            </select>
          </div>

          <input
            type="number"
            step="any"
            value={fromAmountStr}
            onChange={(e) => setFromAmountStr(e.target.value)}
            className="w-full text-right text-2xl font-semibold tabular-nums bg-transparent focus:outline-none"
            placeholder="0.00"
          />
        </div>

        <div className="flex justify-end mt-1">
          <span className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
            {formatUsd(usdValue)}
          </span>
        </div>
      </div>

      <div className="flex justify-center -my-5 relative z-10">
        <button
          type="button"
          onClick={handleFlip}
          aria-label="Flip swap tokens"
          className="w-11 h-11 rounded-full bg-white dark:bg-[#1A202E] border border-slate-200 dark:border-slate-700 flex items-center justify-center shadow-sm hover:scale-105 active:scale-95 transition-transform"
        >
          <ArrowUpDown className="w-4 h-4 text-slate-700 dark:text-slate-200" />
        </button>
      </div>

      <div className={`p-4 ${uiTheme.cardRadius} ${uiTheme.cardBg}`}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
            You receive
          </span>
          {toToken && (
            <span className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
              Balance: {formatTokenAmount(toToken.balance)} {toToken.symbol}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 shrink-0">
            {toToken && (
              <TokenIcon symbol={toToken.symbol} color={toToken.color} size={36} />
            )}
            <select
              value={toSymbol}
              onChange={(e) => {
                setToSymbol(e.target.value);
                setCustomRate('');
              }}
              className="h-10 pr-2 bg-transparent text-base font-bold focus:outline-none cursor-pointer"
              aria-label="Receive token"
            >
              {holdings.map((h) => (
                <option key={h.id} value={h.symbol} className="bg-white dark:bg-[#12161F]">
                  {h.symbol}
                </option>
              ))}
            </select>
          </div>

          <div className="text-right text-2xl font-semibold tabular-nums truncate">
            {formatTokenAmount(toAmount)}
          </div>
        </div>

        <div className="flex justify-end mt-1">
          <span className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
            {formatUsd(toAmount * (toToken?.priceUsd || 0))}
          </span>
        </div>
      </div>

      <div className={`p-3.5 ${uiTheme.cardRadius} ${uiTheme.cardBg} space-y-2 text-xs`}>
        <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
          <span>Rate</span>
          <span className="font-mono tabular-nums">
            1 {fromToken?.symbol} = {formatTokenAmount(effectiveRate)} {toToken?.symbol}
          </span>
        </div>
        <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
          <span>Estimated Network Fee</span>
          <span className="font-mono tabular-nums">$0.42</span>
        </div>
        <div className="flex items-center justify-between gap-3 pt-1">
          <span className="text-slate-500 dark:text-slate-400 shrink-0">
            Custom Rate Override
          </span>
          <input
            type="number"
            step="any"
            value={customRate}
            onChange={(e) => setCustomRate(e.target.value)}
            placeholder={naturalRate.toFixed(4)}
            className="w-28 h-8 px-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-right font-mono text-xs tabular-nums focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <button
        type="submit"
        className={`w-full h-12 rounded-xl ${uiTheme.accentBg} active:scale-[0.99] font-semibold text-sm flex items-center justify-center gap-2 transition-all`}
      >
        {justSwapped ? (
          <span>Swap Confirmed</span>
        ) : (
          <>
            <span>Review & Swap</span>
            <ArrowRight className="w-4 h-4" />
          </>
        )}
      </button>
    </form>
  );
};
