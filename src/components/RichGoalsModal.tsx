import React, { useMemo, useState } from 'react';
import {
  CheckCircle2,
  Crown,
  Plus,
  RotateCcw,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import { BottomSheet } from './BottomSheet';
import { RichGoal } from '../types/crypto';
import { RICH_CATALOG } from '../data/presets';
import { formatUsd } from '../utils/format';

interface RichGoalsModalProps {
  open: boolean;
  onClose: () => void;
  currentBalance: number;
  goals: RichGoal[];
  onAddGoal: (goal: RichGoal) => void;
  onDeleteGoal: (id: string) => void;
  onResetGoals: () => void;
  onTestPopup?: (goal: RichGoal) => void;
}

const CATEGORIES = [
  'All',
  'Cars',
  'Watch',
  'Real Estate',
  'Yacht',
  'Aviation',
  'Travel',
  'Fashion',
  'Tech',
] as const;

export const RichGoalsModal: React.FC<RichGoalsModalProps> = ({
  open,
  onClose,
  currentBalance,
  goals,
  onAddGoal,
  onDeleteGoal,
  onResetGoals,
  onTestPopup,
}) => {
  const [query, setQuery] = useState('');
  const [selectedCat, setSelectedCat] = useState<string>('All');
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('Cars');

  const sortedGoals = useMemo(
    () => [...goals].sort((a, b) => a.priceUsd - b.priceUsd),
    [goals]
  );

  const nextGoal = sortedGoals.find((g) => g.priceUsd > currentBalance) || null;
  const unlockedCount = sortedGoals.filter(
    (g) => currentBalance >= g.priceUsd
  ).length;
  const nextProgressPct = nextGoal
    ? Math.min(100, Math.max(0, (currentBalance / nextGoal.priceUsd) * 100))
    : 100;

  const cleanQuery = query.trim().toLowerCase();

  const matchesSearchAndCat = (g: RichGoal) => {
    const matchCat =
      selectedCat === 'All' ||
      g.category.toLowerCase() === selectedCat.toLowerCase() ||
      (selectedCat === 'Cars' && g.category.toLowerCase() === 'supercar');
    if (!matchCat) return false;
    if (!cleanQuery) return true;
    return (
      g.name.toLowerCase().includes(cleanQuery) ||
      g.category.toLowerCase().includes(cleanQuery) ||
      String(g.priceUsd).includes(cleanQuery)
    );
  };

  const filteredActiveGoals = useMemo(
    () => sortedGoals.filter(matchesSearchAndCat),
    [sortedGoals, cleanQuery, selectedCat]
  );

  const discoverCatalog = useMemo(() => {
    const activeIds = new Set(goals.map((g) => g.id));
    const activeNames = new Set(goals.map((g) => g.name.toLowerCase()));
    return RICH_CATALOG.filter(
      (item) =>
        !activeIds.has(item.id) &&
        !activeNames.has(item.name.toLowerCase()) &&
        matchesSearchAndCat(item)
    ).sort((a, b) => a.priceUsd - b.priceUsd);
  }, [goals, cleanQuery, selectedCat]);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const numeric = parseFloat(price);
    const cleanName = name.trim();
    if (!cleanName || !Number.isFinite(numeric) || numeric <= 0) return;

    onAddGoal({
      id: `rich-custom-${Date.now()}`,
      name: cleanName,
      priceUsd: numeric,
      category: category.trim() || 'Luxury',
    });
    setName('');
    setPrice('');
  };

  return (
    <BottomSheet open={open} onClose={onClose} title="Rich Goals">
      <div className="space-y-4">
        {/* Progress Summary */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/12 via-yellow-500/5 to-transparent border border-amber-500/25 space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-500 flex items-center justify-center shrink-0">
                <Crown className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-semibold">
                  {unlockedCount} / {sortedGoals.length} Rich Things Unlocked
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 tabular-nums">
                  Your money: {formatUsd(currentBalance)}
                </p>
              </div>
            </div>
            {nextGoal && (
              <span className="text-xs font-bold text-amber-500 tabular-nums">
                {nextProgressPct.toFixed(0)}%
              </span>
            )}
          </div>

          {nextGoal ? (
            <>
              <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                <div
                  className="h-full rounded-full bg-amber-500 transition-all duration-300"
                  style={{ width: `${nextProgressPct}%` }}
                />
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 tabular-nums">
                Next: <span className="font-semibold">{nextGoal.name}</span> ({formatUsd(nextGoal.priceUsd)}) · Need{' '}
                <span className="font-semibold text-amber-500">
                  {formatUsd(Math.max(0, nextGoal.priceUsd - currentBalance))}
                </span>
              </p>
            </>
          ) : (
            <p className="text-xs text-emerald-500 font-semibold">
              Every luxury milestone unlocked! Search or add a custom target below.
            </p>
          )}
        </div>

        {/* Search & Category Filter */}
        <div className="space-y-2">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search rich things (Bugatti, Rolex, Jet, Yacht...)"
              className="w-full h-11 pl-10 pr-9 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                aria-label="Clear search"
                className="w-7 h-7 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 absolute right-2 top-1/2 -translate-y-1/2"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCat(cat)}
                className={`h-8 px-3 rounded-lg text-xs font-semibold shrink-0 transition-colors whitespace-nowrap ${
                  selectedCat === cat
                    ? 'bg-amber-500 text-slate-950'
                    : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Search Catalog to Add More Rich Things */}
        {discoverCatalog.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">
                Add More Rich Things ({discoverCatalog.length})
              </span>
              {cleanQuery && (
                <button
                  type="button"
                  onClick={() => setName(query.trim())}
                  className="text-xs font-semibold text-blue-500 hover:text-blue-400"
                >
                  Use "{query.trim()}" as custom
                </button>
              )}
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800/70 rounded-2xl border border-amber-500/25 overflow-hidden max-h-52 overflow-y-auto">
              {discoverCatalog.map((item) => (
                <div
                  key={item.id}
                  className="px-3.5 py-2.5 bg-white dark:bg-[#12161F] flex items-center justify-between gap-2.5"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-amber-500/15 text-amber-500 flex items-center justify-center shrink-0">
                      <Crown className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate">{item.name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 tabular-nums truncate">
                        {item.category} · {formatUsd(item.priceUsd)}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onAddGoal(item)}
                    className="h-8 px-3 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center gap-1 shrink-0 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Active Milestones List */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Your Active Goals ({filteredActiveGoals.length})
            </span>
            <button
              type="button"
              onClick={onResetGoals}
              className="text-xs font-medium text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              Reset
            </button>
          </div>

          {filteredActiveGoals.length === 0 ? (
            <div className="p-4 rounded-2xl bg-slate-100/70 dark:bg-slate-800/40 text-center space-y-2">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                No active goals match "{query || selectedCat}".
              </p>
              {cleanQuery && (
                <button
                  type="button"
                  onClick={() => setName(query.trim())}
                  className="h-8 px-3 rounded-lg bg-amber-500 text-slate-950 text-xs font-bold inline-flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Create "{query.trim()}" below
                </button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800/70 rounded-2xl border border-slate-200/70 dark:border-slate-800/80 overflow-hidden max-h-60 overflow-y-auto">
              {filteredActiveGoals.map((goal) => {
                const canBuy = currentBalance >= goal.priceUsd;
                return (
                  <div
                    key={goal.id}
                    className="px-3.5 py-2.5 bg-white dark:bg-[#12161F] flex items-center justify-between gap-2.5"
                  >
                    <button
                      type="button"
                      onClick={() => onTestPopup?.(goal)}
                      className="flex items-center gap-2.5 min-w-0 flex-1 text-left"
                      title="Tap to preview top popup"
                    >
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                          canBuy
                            ? 'bg-emerald-500/15 text-emerald-500'
                            : 'bg-slate-200 dark:bg-slate-800 text-slate-400'
                        }`}
                      >
                        {canBuy ? (
                          <CheckCircle2 className="w-4 h-4" />
                        ) : (
                          <Crown className="w-4 h-4" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold truncate">
                          {goal.name}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 tabular-nums truncate">
                          {goal.category} · {formatUsd(goal.priceUsd)}
                        </p>
                      </div>
                    </button>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span
                        className={`text-[11px] font-semibold tabular-nums ${
                          canBuy
                            ? 'text-emerald-500'
                            : 'text-slate-400 dark:text-slate-500'
                        }`}
                      >
                        {canBuy ? 'Can Buy' : 'Locked'}
                      </span>
                      <button
                        type="button"
                        onClick={() => onDeleteGoal(goal.id)}
                        aria-label={`Delete ${goal.name}`}
                        className="min-w-[32px] min-h-[32px] flex items-center justify-center rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Add Custom Rich Item */}
        <form
          onSubmit={handleAdd}
          className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2.5"
        >
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Add Custom Rich Thing
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Porsche GT3 RS"
              className="sm:col-span-2 h-11 px-3 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              required
            />
            <input
              type="number"
              step="any"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="Price ($)"
              className="h-11 px-3 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-sm font-mono tabular-nums focus:outline-none focus:ring-2 focus:ring-amber-500"
              required
            />
          </div>
          <div className="flex gap-2">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="h-10 px-3 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs font-medium"
            >
              {['Cars', 'Watch', 'Real Estate', 'Yacht', 'Aviation', 'Travel', 'Fashion', 'Tech', 'Luxury'].map(
                (c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                )
              )}
            </select>
            <button
              type="submit"
              className="flex-1 h-10 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Rich Goal
            </button>
          </div>
        </form>
      </div>
    </BottomSheet>
  );
};
