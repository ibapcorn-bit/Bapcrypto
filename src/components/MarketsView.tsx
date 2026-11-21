import React, { useMemo, useState } from 'react';
import { Search, ArrowUpRight, ArrowDownRight, Plus } from 'lucide-react';
import { TokenHolding } from '../types/crypto';
import { UI_THEMES, UiThemeConfig } from '../data/uiThemes';
import {
  buildPriceHistory,
  CRYPTO_TEMPLATES,
  makeSparkline,
  sparklineFromHistory,
} from '../data/presets';
import { TokenIcon } from './TokenIcon';
import { Sparkline } from './Sparkline';
import { formatPct, formatUsd } from '../utils/format';

interface MarketsViewProps {
  holdings: TokenHolding[];
  stealthMode: boolean;
  onEditToken: (token: TokenHolding) => void;
  onAddToken: () => void;
  onQuickAddToken?: (token: TokenHolding) => void;
  uiTheme?: UiThemeConfig;
}

const MEMECOIN_SYMBOLS = [
  'PEPE',
  'DOGE',
  'WIF',
  'BONK',
  'POPCAT',
  'SHIB',
  'FLOKI',
  'BRETT',
  'SPX',
  'FARTCOIN',
  'PENGU',
];

export const MarketsView: React.FC<MarketsViewProps> = ({
  holdings,
  onEditToken,
  onQuickAddToken,
  uiTheme = UI_THEMES.candles,
}) => {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<
    'all' | 'layer1' | 'defi' | 'memecoins' | 'gainers' | 'losers'
  >('all');

  const matchesFilter = (t: {
    symbol: string;
    name: string;
    change24hPct: number;
    category?: TokenHolding['category'];
  }) => {
    const matchQuery =
      t.name.toLowerCase().includes(query.toLowerCase()) ||
      t.symbol.toLowerCase().includes(query.toLowerCase());
    if (!matchQuery) return false;
    if (filter === 'memecoins') {
      return (
        t.category === 'memecoin' ||
        MEMECOIN_SYMBOLS.includes(t.symbol.toUpperCase())
      );
    }
    if (filter === 'layer1') return t.category === 'layer1';
    if (filter === 'defi') return t.category === 'defi';
    if (filter === 'gainers') return t.change24hPct >= 0;
    if (filter === 'losers') return t.change24hPct < 0;
    return true;
  };

  const filtered = useMemo(() => {
    return holdings.filter(matchesFilter);
  }, [holdings, query, filter]);

  const discoverable = useMemo(() => {
    const ownedSymbols = new Set(holdings.map((h) => h.symbol.toUpperCase()));
    return CRYPTO_TEMPLATES.filter(
      (t) => !ownedSymbols.has(t.symbol.toUpperCase()) && matchesFilter(t)
    );
  }, [holdings, query, filter]);

  const handleQuickAdd = (template: (typeof CRYPTO_TEMPLATES)[number]) => {
    const seed = template.symbol.charCodeAt(0) || 7;
    const priceHistory = buildPriceHistory(
      template.priceUsd,
      template.change24hPct,
      8,
      seed
    );
    const newToken: TokenHolding = {
      id: `${template.symbol.toLowerCase()}-${Date.now()}`,
      symbol: template.symbol,
      name: template.name,
      network: template.network,
      balance: template.balance,
      priceUsd: template.priceUsd,
      change24hPct: template.change24hPct,
      color: template.color,
      category: template.category,
      priceHistory,
      sparkline:
        priceHistory.length > 0
          ? sparklineFromHistory(priceHistory, template.priceUsd)
          : makeSparkline(template.change24hPct, 20, seed),
    };
    onQuickAddToken?.(newToken);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search tokens (BTC, XRP, SUI, TAO, PEPE...)"
            className={`w-full h-11 pl-10 pr-4 ${uiTheme.itemRadius} ${uiTheme.cardBg} text-sm focus:outline-none focus:ring-2 focus:ring-blue-500`}
          />
        </div>
      </div>

      <div
        className={`flex items-center gap-1 p-1 ${uiTheme.itemRadius} ${uiTheme.cardBg} overflow-x-auto no-scrollbar`}
      >
        {(
          [
            { id: 'all', label: 'All' },
            { id: 'layer1', label: 'Layer 1' },
            { id: 'defi', label: 'DeFi' },
            { id: 'memecoins', label: 'Memecoins' },
            { id: 'gainers', label: 'Gainers' },
            { id: 'losers', label: 'Decliners' },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setFilter(tab.id)}
            className={`flex-1 min-h-[36px] px-2.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
              filter === tab.id
                ? `${uiTheme.activeTimeframeBg} shadow-sm`
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div
        className={`${uiTheme.cardRadius} ${uiTheme.cardBg} ${uiTheme.divider} overflow-hidden`}
      >
        {filtered.length === 0 && discoverable.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500 dark:text-slate-400">
            No matching tokens found.
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-500 dark:text-slate-400">
            None of your current holdings match this filter — browse more assets below.
          </div>
        ) : (
          filtered.map((token) => {
            const up = token.change24hPct >= 0;
            return (
              <button
                key={token.id}
                type="button"
                onClick={() => onEditToken(token)}
                className={`w-full min-h-[64px] px-4 py-3 flex items-center justify-between gap-3 text-left ${uiTheme.rowHover} transition-colors`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <TokenIcon symbol={token.symbol} color={token.color} size={38} />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate">{token.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {token.symbol} · {token.network}
                    </p>
                  </div>
                </div>

                <div className="hidden sm:block">
                  <Sparkline data={token.sparkline} positive={up} />
                </div>

                <div className="text-right shrink-0">
                  <p className="text-sm font-semibold tabular-nums">
                    {formatUsd(token.priceUsd)}
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

      {discoverable.length > 0 && (
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              More Crypto Assets
            </h3>
            <span className="text-[11px] text-slate-400 dark:text-slate-500 tabular-nums">
              {discoverable.length} available
            </span>
          </div>
          <div
            className={`${uiTheme.cardRadius} ${uiTheme.cardBg} ${uiTheme.divider} overflow-hidden`}
          >
            {discoverable.map((item) => {
              const up = item.change24hPct >= 0;
              const spark = makeSparkline(
                item.change24hPct,
                20,
                item.symbol.charCodeAt(0) || 1
              );
              return (
                <div
                  key={item.symbol}
                  className={`w-full min-h-[64px] px-4 py-3 flex items-center justify-between gap-3 ${uiTheme.rowHover} transition-colors`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <TokenIcon symbol={item.symbol} color={item.color} size={38} />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate">{item.name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {item.symbol} · {item.network}
                      </p>
                    </div>
                  </div>

                  <div className="hidden sm:block">
                    <Sparkline data={spark} positive={up} />
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <p className="text-sm font-semibold tabular-nums">
                        {formatUsd(item.priceUsd)}
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
                        {formatPct(item.change24hPct)}
                      </p>
                    </div>

                    {onQuickAddToken && (
                      <button
                        type="button"
                        onClick={() => handleQuickAdd(item)}
                        aria-label={`Add ${item.symbol} to portfolio`}
                        className={`min-h-[36px] px-2.5 ${uiTheme.itemRadius} ${uiTheme.accentBg} text-xs font-semibold inline-flex items-center gap-1 transition-colors shrink-0`}
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Add
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
