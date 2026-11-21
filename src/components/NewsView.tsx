import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ExternalLink,
  Flame,
  Newspaper,
  RefreshCw,
  Search,
  AlertCircle,
} from 'lucide-react';
import { CryptoTransaction, TokenHolding } from '../types/crypto';
import { UI_THEMES, UiThemeConfig } from '../data/uiThemes';
import { formatPct, formatUsd } from '../utils/format';
import { BottomSheet } from './BottomSheet';

export interface CryptoNewsArticle {
  id: string;
  title: string;
  summary: string;
  url: string;
  source: string;
  author?: string;
  publishedAt: number;
  imageUrl?: string;
  category: 'Bitcoin' | 'Markets' | 'DeFi' | 'Policy';
}

interface NewsViewProps {
  uiTheme?: UiThemeConfig;
  holdings: TokenHolding[];
  hypeItems?: CryptoTransaction[];
  onTriggerMarketHype?: () => void;
}

type NewsFilter = 'all' | 'portfolio' | 'Bitcoin' | 'Markets' | 'DeFi' | 'Policy';

const RSS_SOURCES = [
  {
    name: 'CoinDesk',
    rssUrl: 'https://www.coindesk.com/arc/outboundfeeds/rss/',
  },
  {
    name: 'Cointelegraph',
    rssUrl: 'https://cointelegraph.com/rss',
  },
  {
    name: 'Decrypt',
    rssUrl: 'https://decrypt.co/feed',
  },
];

function decodeHtmlAndStrip(raw: string): string {
  if (!raw) return '';
  const withoutTags = raw.replace(/<[^>]*>/g, ' ');
  const txt = document.createElement('textarea');
  txt.innerHTML = withoutTags;
  return txt.value.replace(/\s+/g, ' ').trim();
}

function extractImageFromHtml(html: string): string | undefined {
  if (!html) return undefined;
  const match = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  return match?.[1]?.replace(/&amp;/g, '&');
}

function classifyArticle(
  title: string,
  categories: string[] = []
): CryptoNewsArticle['category'] {
  const hay = `${title} ${categories.join(' ')}`.toLowerCase();
  if (
    hay.includes('sec') ||
    hay.includes('policy') ||
    hay.includes('court') ||
    hay.includes('law') ||
    hay.includes('regulation') ||
    hay.includes('cftc') ||
    hay.includes('senate')
  ) {
    return 'Policy';
  }
  if (
    hay.includes('defi') ||
    hay.includes('ethereum') ||
    hay.includes('solana') ||
    hay.includes('uniswap') ||
    hay.includes('onchain') ||
    hay.includes('layer') ||
    hay.includes('hyperliquid') ||
    hay.includes('bnb chain')
  ) {
    return 'DeFi';
  }
  if (hay.includes('bitcoin') || hay.includes('btc')) {
    return 'Bitcoin';
  }
  return 'Markets';
}

function parseTimestamp(dateStr?: string): number {
  if (!dateStr) return Date.now();
  const normalized = dateStr.includes('T')
    ? dateStr
    : `${dateStr.replace(' ', 'T')}Z`;
  const parsed = Date.parse(normalized);
  if (!Number.isNaN(parsed)) return parsed;
  const fallback = Date.parse(dateStr);
  return Number.isNaN(fallback) ? Date.now() : fallback;
}

function formatRelativeTime(ts: number): string {
  const diffSec = Math.max(1, Math.floor((Date.now() - ts) / 1000));
  if (diffSec < 60) return 'Just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d ago`;
  return new Date(ts).toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
  });
}

interface Rss2JsonItem {
  title?: string;
  pubDate?: string;
  link?: string;
  guid?: string;
  author?: string;
  thumbnail?: string;
  description?: string;
  content?: string;
  enclosure?: { link?: string; thumbnail?: string };
  categories?: string[];
}

interface Rss2JsonResponse {
  status?: string;
  items?: Rss2JsonItem[];
}

interface BlockchairItem {
  title?: string;
  source?: string;
  link?: string;
  time?: string;
  tags?: string;
  description?: string;
  hash?: string;
}

interface BlockchairResponse {
  data?: BlockchairItem[];
}

const ArticleThumbnail: React.FC<{
  src?: string;
  alt: string;
  radiusClass: string;
  sizeClass?: string;
}> = ({ src, alt, radiusClass, sizeClass = 'w-20 h-20' }) => {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div
        className={`${sizeClass} ${radiusClass} shrink-0 bg-slate-100 dark:bg-slate-800/80 border border-slate-200/70 dark:border-slate-700/60 flex items-center justify-center text-slate-400 dark:text-slate-500`}
        aria-hidden="true"
      >
        <Newspaper className="w-6 h-6" />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={`${sizeClass} ${radiusClass} shrink-0 object-cover bg-slate-100 dark:bg-slate-800`}
      loading="lazy"
    />
  );
};

export const NewsView: React.FC<NewsViewProps> = ({
  uiTheme = UI_THEMES.candles,
  holdings,
  hypeItems = [],
  onTriggerMarketHype,
}) => {
  const [articles, setArticles] = useState<CryptoNewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [filter, setFilter] = useState<NewsFilter>('all');
  const [query, setQuery] = useState('');
  const [selectedArticle, setSelectedArticle] =
    useState<CryptoNewsArticle | null>(null);

  const fetchNews = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const results = await Promise.allSettled(
        RSS_SOURCES.map(async (src) => {
          const endpoint = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(
            src.rssUrl
          )}`;
          const res = await fetch(endpoint);
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const data = (await res.json()) as Rss2JsonResponse;
          if (data.status !== 'ok' || !Array.isArray(data.items)) {
            throw new Error('Invalid feed payload');
          }
          return data.items.map((item, idx): CryptoNewsArticle => {
            const rawTitle = decodeHtmlAndStrip(item.title || 'Untitled');
            const rawDesc = item.description || item.content || '';
            const cleanSummary = decodeHtmlAndStrip(rawDesc);
            const img =
              item.enclosure?.link?.replace(/&amp;/g, '&') ||
              item.thumbnail?.replace(/&amp;/g, '&') ||
              item.enclosure?.thumbnail?.replace(/&amp;/g, '&') ||
              extractImageFromHtml(rawDesc);

            return {
              id: item.guid || item.link || `${src.name}-${idx}`,
              title: rawTitle,
              summary:
                cleanSummary ||
                'Tap Read Full Article to view the complete report from the publisher.',
              url: item.link || '#',
              source: src.name,
              author: item.author ? decodeHtmlAndStrip(item.author) : undefined,
              publishedAt: parseTimestamp(item.pubDate),
              imageUrl: img,
              category: classifyArticle(rawTitle, item.categories),
            };
          });
        })
      );

      let merged: CryptoNewsArticle[] = [];
      for (const r of results) {
        if (r.status === 'fulfilled') {
          merged.push(...r.value);
        }
      }

      // Secondary public API fallback if primary feeds are unavailable
      if (merged.length === 0) {
        const bcRes = await fetch(
          'https://api.blockchair.com/news?q=language(en)&limit=25'
        );
        if (!bcRes.ok) {
          throw new Error('Unable to reach crypto news feeds right now.');
        }
        const bcData = (await bcRes.json()) as BlockchairResponse;
        if (Array.isArray(bcData.data)) {
          merged = bcData.data.map((item, idx): CryptoNewsArticle => {
            const title = decodeHtmlAndStrip(item.title || 'Crypto Update');
            const tags = item.tags ? item.tags.split(',') : [];
            return {
              id: item.hash || item.link || `bc-${idx}`,
              title,
              summary: decodeHtmlAndStrip(item.description || ''),
              url: item.link || '#',
              source: item.source || 'Blockchair News',
              publishedAt: parseTimestamp(item.time),
              category: classifyArticle(title, tags),
            };
          });
        }
      }

      if (merged.length === 0) {
        throw new Error('No live articles available right now.');
      }

      // Deduplicate by normalized title, keep crypto-focused articles, and sort newest first
      const CRYPTO_RE =
        /\b(crypto|bitcoin|btc|ethereum|eth|solana|sol|defi|blockchain|token|stablecoin|usdc|usdt|binance|coinbase|kraken|okx|sec|cftc|etf|memecoin|doge|pepe|xrp|cardano|web3|onchain|wallet|miner|mining|hyperliquid|altcoin|nft|satoshi|halving|exchange|liquidat)\b/i;
      const seen = new Set<string>();
      const uniqueSorted = merged
        .filter((a) => {
          if (
            a.source !== 'CoinDesk' &&
            a.source !== 'Cointelegraph' &&
            !CRYPTO_RE.test(`${a.title} ${a.summary}`)
          ) {
            return false;
          }
          const key = a.title.toLowerCase().slice(0, 60);
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        })
        .sort((a, b) => b.publishedAt - a.publishedAt);

      setArticles(uniqueSorted);
      setLastUpdated(
        new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        })
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to load live cryptocurrency news.'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchNews(false);
  }, [fetchNews]);

  const portfolioTerms = useMemo(() => {
    const terms: string[] = [];
    for (const h of holdings) {
      if (h.symbol.toUpperCase() === 'USDC') continue;
      terms.push(h.symbol.toLowerCase());
      terms.push(h.name.toLowerCase());
    }
    return terms;
  }, [holdings]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return articles.filter((a) => {
      const matchesQuery =
        !q ||
        a.title.toLowerCase().includes(q) ||
        a.summary.toLowerCase().includes(q) ||
        a.source.toLowerCase().includes(q);
      if (!matchesQuery) return false;

      if (filter === 'all') return true;
      if (filter === 'portfolio') {
        const hay = `${a.title} ${a.summary}`.toLowerCase();
        return portfolioTerms.some((term) => hay.includes(term));
      }
      return a.category === filter;
    });
  }, [articles, filter, query, portfolioTerms]);

  const filterTabs: { id: NewsFilter; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'portfolio', label: 'My Coins' },
    { id: 'Bitcoin', label: 'Bitcoin' },
    { id: 'Markets', label: 'Markets' },
    { id: 'DeFi', label: 'DeFi' },
    { id: 'Policy', label: 'Policy' },
  ];

  return (
    <div className="space-y-3">
      {/* Header Row */}
      <div className="flex items-center justify-between px-1">
        <div>
          <h2 className="text-base font-bold tracking-tight">Crypto News</h2>
          {lastUpdated && (
            <p className="text-[11px] text-slate-500 dark:text-slate-400 tabular-nums">
              Real-time crypto feed · Updated {lastUpdated}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={() => fetchNews(true)}
          disabled={refreshing || loading}
          aria-label="Refresh news"
          className={`min-h-[44px] px-3 ${uiTheme.itemRadius} ${uiTheme.cardBg} ${uiTheme.rowHover} text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-60 whitespace-nowrap shrink-0`}
        >
          <RefreshCw
            className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`}
          />
          <span>Refresh</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search headlines, BTC, ETH, DeFi..."
          className={`w-full h-11 pl-10 pr-4 ${uiTheme.itemRadius} ${uiTheme.cardBg} text-sm focus:outline-none focus:ring-2 focus:ring-blue-500`}
        />
      </div>

      {/* Category Filter Tabs */}
      <div
        className={`flex items-center gap-1 p-1 ${uiTheme.itemRadius} ${uiTheme.cardBg} overflow-x-auto no-scrollbar`}
      >
        {filterTabs.map((tab) => (
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

      {/* Daily Market Hype Pulse */}
      {(hypeItems.length > 0 || onTriggerMarketHype) && (
        <div
          className={`${uiTheme.cardRadius} ${uiTheme.cardBg} p-4 space-y-2.5 border-amber-500/25`}
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-full bg-amber-500/15 text-amber-500 flex items-center justify-center shrink-0">
                <Flame className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h3 className="text-xs font-bold tracking-tight truncate">
                  Daily Market Hype
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                  Auto-pushed to Activity to simulate sentiment moves
                </p>
              </div>
            </div>
            {onTriggerMarketHype && (
              <button
                type="button"
                onClick={onTriggerMarketHype}
                className="min-h-[36px] px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center gap-1 shrink-0 transition-colors"
              >
                <Flame className="w-3.5 h-3.5" />
                <span>Push Hype</span>
              </button>
            )}
          </div>

          {hypeItems.length > 0 && (
            <div className="divide-y divide-slate-100 dark:divide-slate-800/70 rounded-xl border border-slate-200/70 dark:border-slate-800/80 overflow-hidden">
              {hypeItems.slice(0, 3).map((item) => {
                const impact =
                  item.impactPct ??
                  (item.sentiment === 'bearish'
                    ? -Math.abs(item.amount)
                    : Math.abs(item.amount));
                const isBullish = impact >= 0;
                return (
                  <div
                    key={item.id}
                    className="px-3 py-2.5 flex items-start justify-between gap-3 bg-slate-50/70 dark:bg-slate-900/40"
                  >
                    <div className="min-w-0 space-y-0.5">
                      <p className="text-xs font-semibold leading-snug line-clamp-2">
                        {item.headline || item.counterparty}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                        {item.symbol} · {item.timestampLabel}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p
                        className={`text-xs font-bold tabular-nums ${
                          isBullish ? 'text-emerald-500' : 'text-rose-500'
                        }`}
                      >
                        {formatPct(impact)}
                      </p>
                      {item.usdValue > 0 && (
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 tabular-nums">
                          {formatUsd(item.usdValue)}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Loading Skeleton */}
      {loading && (
        <div
          className={`${uiTheme.cardRadius} ${uiTheme.cardBg} ${uiTheme.divider} overflow-hidden`}
        >
          {Array.from({ length: 5 }).map((_, idx) => (
            <div key={idx} className="p-4 flex items-start gap-3.5 animate-pulse">
              <div className="flex-1 space-y-2">
                <div className="h-3 w-32 rounded bg-slate-200 dark:bg-slate-800" />
                <div className="h-4 w-full rounded bg-slate-200 dark:bg-slate-800" />
                <div className="h-4 w-3/4 rounded bg-slate-200 dark:bg-slate-800" />
              </div>
              <div
                className={`w-20 h-20 ${uiTheme.itemRadius} bg-slate-200 dark:bg-slate-800 shrink-0`}
              />
            </div>
          ))}
        </div>
      )}

      {/* Error State */}
      {!loading && error && (
        <div
          className={`${uiTheme.cardRadius} ${uiTheme.cardBg} p-6 text-center space-y-3`}
        >
          <div className="w-10 h-10 rounded-full bg-rose-500/12 text-rose-500 flex items-center justify-center mx-auto">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-semibold">Couldn't load live news</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">{error}</p>
          </div>
          <button
            type="button"
            onClick={() => fetchNews(true)}
            className={`min-h-[44px] px-5 ${uiTheme.itemRadius} ${uiTheme.accentBg} text-xs font-semibold inline-flex items-center justify-center gap-1.5`}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Try Again
          </button>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && filtered.length === 0 && (
        <div
          className={`${uiTheme.cardRadius} ${uiTheme.cardBg} p-8 text-center text-sm text-slate-500 dark:text-slate-400`}
        >
          No articles match your current filter.
        </div>
      )}

      {/* News Feed List */}
      {!loading && !error && filtered.length > 0 && (
        <div
          className={`${uiTheme.cardRadius} ${uiTheme.cardBg} ${uiTheme.divider} overflow-hidden`}
        >
          {filtered.map((article) => (
            <button
              key={article.id}
              type="button"
              onClick={() => setSelectedArticle(article)}
              className={`w-full p-4 flex items-start justify-between gap-3.5 text-left ${uiTheme.rowHover} transition-colors`}
            >
              <div className="min-w-0 flex-1 space-y-1.5">
                <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 tabular-nums truncate">
                  <span className={uiTheme.accentText}>{article.source}</span>
                  <span aria-hidden="true"> · </span>
                  <span>{formatRelativeTime(article.publishedAt)}</span>
                  <span aria-hidden="true"> · </span>
                  <span>{article.category}</span>
                </p>

                <h3 className="text-sm font-semibold leading-snug line-clamp-2">
                  {article.title}
                </h3>

                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2">
                  {article.summary}
                </p>
              </div>

              <ArticleThumbnail
                src={article.imageUrl}
                alt={article.title}
                radiusClass={uiTheme.itemRadius}
              />
            </button>
          ))}
        </div>
      )}

      {/* In-App Article Reader Drawer */}
      <BottomSheet
        open={Boolean(selectedArticle)}
        onClose={() => setSelectedArticle(null)}
        title={selectedArticle?.source || 'Article'}
      >
        {selectedArticle && (
          <div className="space-y-4">
            {selectedArticle.imageUrl && (
              <ArticleThumbnail
                src={selectedArticle.imageUrl}
                alt={selectedArticle.title}
                radiusClass="rounded-2xl"
                sizeClass="w-full h-44"
              />
            )}

            <div className="space-y-2">
              <p className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                <span className={`font-semibold ${uiTheme.accentText}`}>
                  {selectedArticle.source}
                </span>
                {selectedArticle.author ? (
                  <>
                    <span aria-hidden="true"> · </span>
                    <span>{selectedArticle.author}</span>
                  </>
                ) : null}
                <span aria-hidden="true"> · </span>
                <span>{formatRelativeTime(selectedArticle.publishedAt)}</span>
                <span aria-hidden="true"> · </span>
                <span>{selectedArticle.category}</span>
              </p>

              <h3 className="text-base font-bold leading-snug text-balance">
                {selectedArticle.title}
              </h3>

              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                {selectedArticle.summary}
              </p>
            </div>

            <a
              href={selectedArticle.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`w-full h-12 rounded-2xl ${uiTheme.accentBg} text-sm font-semibold flex items-center justify-center gap-2 transition-colors`}
            >
              <span>Read Full Article</span>
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        )}
      </BottomSheet>
    </div>
  );
};
