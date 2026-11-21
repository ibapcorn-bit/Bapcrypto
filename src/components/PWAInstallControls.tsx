import React, { useState } from 'react';
import { Download, Smartphone, WifiOff } from 'lucide-react';
import { useOnlineStatus, usePWAInstall } from '../hooks/usePWAInstall';
import { BottomSheet } from './BottomSheet';

interface PWAInstallOptionProps {
  onDone?: () => void;
  compact?: boolean;
}

export const PWAInstallButton: React.FC<PWAInstallOptionProps> = ({
  onDone,
  compact = false,
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [guideOpen, setGuideOpen] = useState(false);

  if (isInstalled) {
    return null;
  }

  const handleClick = async () => {
    if (isInstallable) {
      const accepted = await install();
      if (accepted && onDone) {
        onDone();
      }
      return;
    }
    setGuideOpen(true);
  };

  if (compact) {
    if (!isInstallable && !isIOS) return null;
    return (
      <>
        <button
          type="button"
          onClick={handleClick}
          aria-label="Install app"
          className="min-h-[36px] px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
        >
          <Download className="w-3.5 h-3.5" />
          Install App
        </button>

        <InstallGuideSheet
          open={guideOpen}
          onClose={() => setGuideOpen(false)}
          isIOS={isIOS}
        />
      </>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        className="w-full h-11 px-3.5 rounded-xl bg-slate-100 dark:bg-slate-800/70 hover:bg-slate-200/70 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs font-semibold flex items-center justify-center gap-2 transition-colors whitespace-nowrap"
      >
        <Smartphone className="w-4 h-4 text-blue-500 shrink-0" />
        {isInstallable
          ? 'Install Android / Desktop App'
          : 'Install as Mobile App'}
      </button>

      <InstallGuideSheet
        open={guideOpen}
        onClose={() => setGuideOpen(false)}
        isIOS={isIOS}
      />
    </>
  );
};

const InstallGuideSheet: React.FC<{
  open: boolean;
  onClose: () => void;
  isIOS: boolean;
}> = ({ open, onClose, isIOS }) => (
  <BottomSheet open={open} onClose={onClose} title="Install Vaultx App">
    <div className="space-y-4 text-sm text-slate-700 dark:text-slate-300">
      <p className="text-xs text-slate-500 dark:text-slate-400">
        Vaultx is configured as an installable standalone app with offline
        caching and home-screen launch.
      </p>

      {isIOS ? (
        <div className="p-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800/80 space-y-1.5">
          <p className="text-xs font-semibold text-slate-900 dark:text-white">
            On iPhone / iPad (Safari)
          </p>
          <p className="text-xs">
            1. Tap the <strong>Share</strong> icon in Safari&apos;s toolbar.
          </p>
          <p className="text-xs">
            2. Scroll down and tap <strong>Add to Home Screen</strong>.
          </p>
        </div>
      ) : (
        <div className="p-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800/80 space-y-1.5">
          <p className="text-xs font-semibold text-slate-900 dark:text-white">
            On Android (Chrome)
          </p>
          <p className="text-xs">
            1. Open this app URL directly in Chrome on your Android device.
          </p>
          <p className="text-xs">
            2. Tap the <strong>Menu (⋮)</strong> button in the top-right corner.
          </p>
          <p className="text-xs">
            3. Tap <strong>Install app</strong> or{' '}
            <strong>Add to Home screen</strong> to install Vaultx as a
            standalone app.
          </p>
        </div>
      )}

      <button
        type="button"
        onClick={onClose}
        className="w-full h-11 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-colors"
      >
        Got It
      </button>
    </div>
  </BottomSheet>
);

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div
      role="status"
      className="fixed bottom-[72px] left-4 lg:bottom-6 lg:left-6 z-40 flex items-center gap-2 rounded-xl bg-amber-500 px-3 py-2 text-xs font-semibold text-white shadow-lg"
    >
      <WifiOff className="w-3.5 h-3.5 shrink-0" />
      <span>Offline Mode — Cached wallet active</span>
    </div>
  );
};
