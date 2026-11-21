import React from 'react';
import {
  Sparkles,
  RotateCcw,
  EyeOff,
  Activity,
  Plus,
  Smartphone,
  Monitor,
  Sun,
  Moon,
} from 'lucide-react';
import { ChartShape, PortfolioPreset, WalletProfile } from '../types/crypto';
import { PORTFOLIO_PRESETS } from '../data/presets';
import { formatUsd } from '../utils/format';

interface CustomizePanelProps {
  profile: WalletProfile;
  calculatedTotal: number;
  calculatedChangeUsd: number;
  calculatedChangePct: number;
  isDark: boolean;
  phonePreview: boolean;
  onToggleTheme: () => void;
  onTogglePhonePreview: () => void;
  onUpdateProfile: (patch: Partial<WalletProfile>) => void;
  onApplyPreset: (preset: PortfolioPreset) => void;
  onAddToken: () => void;
  onAddTx: () => void;
  onReset: () => void;
}

const CHART_SHAPES: { id: ChartShape; label: string }[] = [
  { id: 'bull', label: 'Bull Run' },
  { id: 'parabolic', label: 'Parabolic' },
  { id: 'steady', label: 'Steady' },
  { id: 'dip_recovery', label: 'Dip & Bounce' },
  { id: 'volatile', label: 'Volatile' },
  { id: 'crash', label: 'Crash' },
];

export const CustomizePanel: React.FC<CustomizePanelProps> = ({
  profile,
  calculatedTotal,
  calculatedChangeUsd,
  calculatedChangePct,
  isDark,
  phonePreview,
  onToggleTheme,
  onTogglePhonePreview,
  onUpdateProfile,
  onApplyPreset,
  onAddToken,
  onAddTx,
  onReset,
}) => {
  return (
    <div className="space-y-4">
      <div className="p-5 rounded-3xl bg-white dark:bg-[#12161F] border border-slate-200/80 dark:border-slate-800/80 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold">Portfolio Studio</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Tap any number on screen or tweak live here
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={onToggleTheme}
              title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <button
              type="button"
              onClick={onTogglePhonePreview}
              title={phonePreview ? 'Full Desktop View' : 'Phone Screenshot Frame'}
              className={`h-9 px-2.5 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors ${
                phonePreview
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {phonePreview ? (
                <>
                  <Monitor className="w-3.5 h-3.5" />
                  <span>Full</span>
                </>
              ) : (
                <>
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>Phone</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Quick Scenarios */}
        <div>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">
            Instant Scenarios
          </p>
          <div className="grid grid-cols-2 gap-2">
            {PORTFOLIO_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => onApplyPreset(preset)}
                className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/70 dark:border-slate-700/60 text-left transition-colors"
              >
                <p className="text-xs font-semibold truncate">{preset.label}</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate tabular-nums">
                  {preset.subtitle}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Quick Override */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium">Custom Total Balance</span>
            <button
              type="button"
              onClick={() =>
                onUpdateProfile({
                  useManualTotal: !profile.useManualTotal,
                  manualTotalBalance: profile.useManualTotal
                    ? profile.manualTotalBalance
                    : Number(calculatedTotal.toFixed(2)),
                  manualChangeUsd: profile.useManualTotal
                    ? profile.manualChangeUsd
                    : Number(calculatedChangeUsd.toFixed(2)),
                  manualChangePct: profile.useManualTotal
                    ? profile.manualChangePct
                    : Number(calculatedChangePct.toFixed(2)),
                })
              }
              className={`w-11 h-6 rounded-full p-0.5 transition-colors flex items-center ${
                profile.useManualTotal
                  ? 'bg-blue-600 justify-end'
                  : 'bg-slate-300 dark:bg-slate-700 justify-start'
              }`}
              aria-label="Toggle custom balance override"
            >
              <span className="w-5 h-5 rounded-full bg-white shadow-sm" />
            </button>
          </div>

          {profile.useManualTotal ? (
            <div className="space-y-2.5">
              <div>
                <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1">
                  Balance ($)
                </label>
                <input
                  type="number"
                  step="any"
                  value={profile.manualTotalBalance}
                  onChange={(e) =>
                    onUpdateProfile({
                      manualTotalBalance: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-full h-10 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-mono tabular-nums focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1">
                    24h ($)
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={profile.manualChangeUsd}
                    onChange={(e) =>
                      onUpdateProfile({
                        manualChangeUsd: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full h-10 px-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono tabular-nums focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1">
                    24h (%)
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={profile.manualChangePct}
                    onChange={(e) =>
                      onUpdateProfile({
                        manualChangePct: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full h-10 px-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono tabular-nums focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
              Summing from holdings: {formatUsd(calculatedTotal)}. Toggle above to type any arbitrary number.
            </p>
          )}
        </div>

        {/* Chart Curve */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">
            Chart Shape
          </p>
          <div className="grid grid-cols-3 gap-1.5">
            {CHART_SHAPES.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => onUpdateProfile({ chartShape: s.id })}
                className={`h-8 px-2 rounded-lg text-[11px] font-medium border transition-colors ${
                  profile.chartShape === s.id
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 border-slate-200/70 dark:border-slate-700/70'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Toggles */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 space-y-2">
          <button
            type="button"
            onClick={() => onUpdateProfile({ liveTick: !profile.liveTick })}
            className="w-full h-10 px-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-between text-xs font-medium transition-colors"
          >
            <span className="flex items-center gap-2">
              <Activity className="w-3.5 h-3.5 text-emerald-500" />
              Live Price Ticker
            </span>
            <span className={profile.liveTick ? 'text-emerald-500 font-semibold' : 'text-slate-400'}>
              {profile.liveTick ? 'On' : 'Off'}
            </span>
          </button>

          <button
            type="button"
            onClick={() => onUpdateProfile({ stealthMode: !profile.stealthMode })}
            className="w-full h-10 px-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-between text-xs font-medium transition-colors"
          >
            <span className="flex items-center gap-2">
              <EyeOff className="w-3.5 h-3.5 text-blue-500" />
              Clean Screenshot Mode
            </span>
            <span className={profile.stealthMode ? 'text-blue-500 font-semibold' : 'text-slate-400'}>
              {profile.stealthMode ? 'On' : 'Off'}
            </span>
          </button>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-2 pt-2">
          <button
            type="button"
            onClick={onAddToken}
            className="h-10 rounded-xl bg-blue-600/10 hover:bg-blue-600/20 text-blue-600 dark:text-blue-400 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Coin
          </button>
          <button
            type="button"
            onClick={onAddTx}
            className="h-10 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Add Tx
          </button>
        </div>

        <button
          type="button"
          onClick={onReset}
          className="w-full h-9 rounded-xl text-xs text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 flex items-center justify-center gap-1.5 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reset to Default
        </button>
      </div>
    </div>
  );
};
