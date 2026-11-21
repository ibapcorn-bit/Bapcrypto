import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Bell,
  BellRing,
  Trash2,
  ArrowUpRight,
  ArrowDownRight,
  Pencil,
} from 'lucide-react';
import { BottomSheet } from './BottomSheet';
import { PriceAlert, TokenHolding } from '../types/crypto';
import { CRYPTO_TEMPLATES } from '../data/presets';
import { TokenIcon } from './TokenIcon';
import { formatUsd } from '../utils/format';

interface PriceAlertsModalProps {
  open: boolean;
  onClose: () => void;
  holdings: TokenHolding[];
  alerts: PriceAlert[];
  initialSymbol?: string | null;
  onAddAlert: (alert: PriceAlert) => void;
  onUpdateAlert?: (alert: PriceAlert) => void;
  onToggleAlert: (id: string) => void;
  onDeleteAlert: (id: string) => void;
}

export const PriceAlertsModal: React.FC<PriceAlertsModalProps> = ({
  open,
  onClose,
  holdings,
  alerts,
  initialSymbol,
  onAddAlert,
  onUpdateAlert,
  onToggleAlert,
  onDeleteAlert,
}) => {
  const [symbol, setSymbol] = useState(
    initialSymbol || holdings[0]?.symbol || 'BTC'
  );
  const [condition, setCondition] = useState<'above' | 'below'>('above');
  const [targetPrice, setTargetPrice] = useState('');
  const [editingAlertId, setEditingAlertId] = useState<string | null>(null);
  const [notifPerm, setNotifPerm] = useState<string>(() =>
    typeof Notification !== 'undefined' ? Notification.permission : 'denied'
  );
  const wasOpenRef = useRef(false);
  const lastInitialRef = useRef<string | null | undefined>(initialSymbol);

  const allAssets = useMemo(() => {
    const seen = new Set(holdings.map((h) => h.symbol.toUpperCase()));
    const extras = CRYPTO_TEMPLATES.filter(
      (t) => !seen.has(t.symbol.toUpperCase())
    ).map((t) => ({
      id: `tpl-${t.symbol.toLowerCase()}`,
      symbol: t.symbol,
      name: t.name,
      priceUsd: t.priceUsd,
      color: t.color,
    }));
    return [
      ...holdings.map((h) => ({
        id: h.id,
        symbol: h.symbol,
        name: h.name,
        priceUsd: h.priceUsd,
        color: h.color,
      })),
      ...extras,
    ];
  }, [holdings]);

  const selectedToken =
    allAssets.find((h) => h.symbol.toUpperCase() === symbol.toUpperCase()) ||
    allAssets[0];

  useEffect(() => {
    if (open && (!wasOpenRef.current || lastInitialRef.current !== initialSymbol)) {
      setEditingAlertId(null);
      const targetSym = initialSymbol || allAssets[0]?.symbol || 'BTC';
      setSymbol(targetSym);
      const token =
        allAssets.find((h) => h.symbol.toUpperCase() === targetSym.toUpperCase()) ||
        allAssets[0];
      if (token) {
        const defaultTarget =
          token.priceUsd >= 1
            ? Number((token.priceUsd * 1.05).toFixed(2))
            : Number((token.priceUsd * 1.05).toFixed(6));
        setTargetPrice(String(defaultTarget));
        setCondition('above');
      }
    }
    wasOpenRef.current = open;
    lastInitialRef.current = initialSymbol;
  }, [open, initialSymbol, allAssets]);

  const handleSymbolChange = (nextSym: string) => {
    setSymbol(nextSym);
    const token = allAssets.find(
      (h) => h.symbol.toUpperCase() === nextSym.toUpperCase()
    );
    if (token) {
      const factor = condition === 'above' ? 1.05 : 0.95;
      const val =
        token.priceUsd >= 1
          ? Number((token.priceUsd * factor).toFixed(2))
          : Number((token.priceUsd * factor).toFixed(6));
      setTargetPrice(String(val));
    }
  };

  const applyPresetOffset = (pct: number) => {
    if (!selectedToken) return;
    const raw = selectedToken.priceUsd * (1 + pct / 100);
    const formatted =
      raw >= 1 ? Number(raw.toFixed(2)) : Number(raw.toFixed(6));
    setTargetPrice(String(formatted));
    setCondition(pct >= 0 ? 'above' : 'below');
  };

  const startEditingAlert = (alert: PriceAlert) => {
    setEditingAlertId(alert.id);
    setSymbol(alert.symbol);
    setCondition(alert.condition);
    setTargetPrice(String(alert.targetPriceUsd));
  };

  const cancelEditing = () => {
    setEditingAlertId(null);
    if (selectedToken) {
      const defaultTarget =
        selectedToken.priceUsd >= 1
          ? Number((selectedToken.priceUsd * 1.05).toFixed(2))
          : Number((selectedToken.priceUsd * 1.05).toFixed(6));
      setTargetPrice(String(defaultTarget));
      setCondition('above');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numericTarget = parseFloat(targetPrice);
    if (!selectedToken || !Number.isFinite(numericTarget) || numericTarget <= 0) {
      return;
    }

    if (editingAlertId && onUpdateAlert) {
      onUpdateAlert({
        id: editingAlertId,
        symbol: selectedToken.symbol,
        name: selectedToken.name,
        targetPriceUsd: numericTarget,
        condition,
        active: true,
        triggeredAt: undefined,
      });
      setEditingAlertId(null);
      return;
    }

    onAddAlert({
      id: `alert-${Date.now()}`,
      symbol: selectedToken.symbol,
      name: selectedToken.name,
      targetPriceUsd: numericTarget,
      condition,
      active: true,
    });

    const nextFactor = condition === 'above' ? 1.1 : 0.9;
    const nextSuggested =
      selectedToken.priceUsd >= 1
        ? Number((selectedToken.priceUsd * nextFactor).toFixed(2))
        : Number((selectedToken.priceUsd * nextFactor).toFixed(6));
    setTargetPrice(String(nextSuggested));
  };

  const requestNotifications = async () => {
    if (typeof Notification === 'undefined') return;
    try {
      const res = await Notification.requestPermission();
      setNotifPerm(res);
    } catch {
      // ignore
    }
  };

  return (
    <BottomSheet open={open} onClose={onClose} title="Price Alerts">
      <div className="space-y-5">
        {/* Create or Edit Alert Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          {editingAlertId && (
            <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-blue-600/10 border border-blue-500/30 text-xs">
              <span className="font-semibold text-blue-600 dark:text-blue-400">
                Editing notification — pick new crypto or target
              </span>
              <button
                type="button"
                onClick={cancelEditing}
                className="font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-300"
              >
                Cancel
              </button>
            </div>
          )}

          {/* Quick-Pick Crypto Strip */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
            {allAssets.map((asset) => {
              const selected =
                asset.symbol.toUpperCase() === (selectedToken?.symbol || symbol).toUpperCase();
              return (
                <button
                  key={asset.id}
                  type="button"
                  onClick={() => handleSymbolChange(asset.symbol)}
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

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">
                Crypto Asset
              </label>
              <select
                value={selectedToken?.symbol || symbol}
                onChange={(e) => handleSymbolChange(e.target.value)}
                className="w-full h-11 px-3 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-sm font-semibold"
              >
                {allAssets.map((h) => (
                  <option key={h.id} value={h.symbol}>
                    {h.symbol} ({formatUsd(h.priceUsd)})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">
                Condition
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {(
                  [
                    { id: 'above', label: 'Above' },
                    { id: 'below', label: 'Below' },
                  ] as const
                ).map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setCondition(c.id)}
                    className={`h-11 rounded-xl text-xs font-semibold border transition-colors ${
                      condition === c.id
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-slate-100 dark:bg-slate-800/70 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700/70'
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Target Price (USD)
              </label>
              {selectedToken && (
                <span className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                  Current: {formatUsd(selectedToken.priceUsd)}
                </span>
              )}
            </div>
            <input
              type="number"
              step="any"
              value={targetPrice}
              onChange={(e) => setTargetPrice(e.target.value)}
              placeholder="0.00"
              className="w-full h-11 px-3.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-base font-mono tabular-nums focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div className="flex items-center gap-2">
            {[-10, -5, 5, 10, 25].map((pct) => (
              <button
                key={pct}
                type="button"
                onClick={() => applyPresetOffset(pct)}
                className="flex-1 h-9 rounded-lg bg-slate-100 dark:bg-slate-800/70 hover:bg-slate-200 dark:hover:bg-slate-800 text-xs font-medium tabular-nums transition-colors"
              >
                {pct > 0 ? `+${pct}%` : `${pct}%`}
              </button>
            ))}
          </div>

          <button
            type="submit"
            disabled={allAssets.length === 0}
            className="w-full h-11 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold text-sm flex items-center justify-center gap-2 transition-colors"
          >
            <Bell className="w-4 h-4" />
            {editingAlertId
              ? `Update ${selectedToken?.symbol || symbol} Alert`
              : `Create ${selectedToken?.symbol || symbol} Alert`}
          </button>
        </form>

        {/* Optional Native Browser Notifications Opt-in */}
        {typeof Notification !== 'undefined' && notifPerm === 'default' && (
          <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-100 dark:bg-slate-800/60">
            <span className="text-xs text-slate-600 dark:text-slate-300">
              Enable device push alerts when targets hit
            </span>
            <button
              type="button"
              onClick={requestNotifications}
              className="h-9 px-3 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-semibold shrink-0"
            >
              Enable
            </button>
          </div>
        )}

        {/* Active & Triggered Alerts List */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2.5">
          <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            Configured Alerts ({alerts.length})
          </h3>

          {alerts.length === 0 ? (
            <p className="py-6 text-center text-xs text-slate-500 dark:text-slate-400">
              No price alerts set yet.
            </p>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800/70 rounded-2xl border border-slate-200/70 dark:border-slate-800/80 overflow-hidden">
              {alerts.map((alert) => {
                const token = allAssets.find(
                  (h) => h.symbol.toUpperCase() === alert.symbol.toUpperCase()
                );
                const isAbove = alert.condition === 'above';
                const statusLabel = alert.triggeredAt
                  ? `Triggered · ${alert.triggeredAt}`
                  : alert.active
                  ? 'Active'
                  : 'Paused';
                const isEditing = editingAlertId === alert.id;

                return (
                  <div
                    key={alert.id}
                    className={`px-3.5 py-3 flex items-center justify-between gap-3 transition-colors ${
                      isEditing
                        ? 'bg-blue-600/8 dark:bg-blue-500/10'
                        : 'bg-white dark:bg-[#12161F]'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => startEditingAlert(alert)}
                      className="flex items-center gap-3 min-w-0 flex-1 text-left"
                      title="Change crypto or target price"
                    >
                      <TokenIcon
                        symbol={alert.symbol}
                        color={token?.color || '#3B82F6'}
                        size={36}
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 text-sm font-semibold tabular-nums">
                          <span>{alert.symbol}</span>
                          {isAbove ? (
                            <ArrowUpRight className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          ) : (
                            <ArrowDownRight className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                          )}
                          <span className="truncate">
                            {formatUsd(alert.targetPriceUsd)}
                          </span>
                        </div>
                        <p
                          className={`text-xs truncate ${
                            alert.triggeredAt
                              ? 'text-emerald-500 font-medium'
                              : 'text-slate-500 dark:text-slate-400'
                          }`}
                        >
                          {isAbove ? 'Rises above' : 'Drops below'} · {statusLabel}
                        </p>
                      </div>
                    </button>

                    <div className="flex items-center gap-1 shrink-0">
                      {onUpdateAlert && (
                        <button
                          type="button"
                          onClick={() => startEditingAlert(alert)}
                          aria-label={`Change ${alert.symbol} alert`}
                          className="min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg text-slate-400 hover:text-blue-500 hover:bg-blue-500/10 transition-colors"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => onToggleAlert(alert.id)}
                        className="min-h-[36px] px-2.5 rounded-lg text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-500/10 flex items-center gap-1 transition-colors"
                      >
                        {alert.triggeredAt ? (
                          <>
                            <BellRing className="w-3.5 h-3.5" />
                            Re-arm
                          </>
                        ) : alert.active ? (
                          'Pause'
                        ) : (
                          'Resume'
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (editingAlertId === alert.id) {
                            setEditingAlertId(null);
                          }
                          onDeleteAlert(alert.id);
                        }}
                        aria-label={`Delete ${alert.symbol} alert`}
                        className="min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </BottomSheet>
  );
};
