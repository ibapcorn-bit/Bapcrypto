import React, { useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  Check,
  Delete,
  Fingerprint,
  Lock,
  ScanFace,
  Wallet,
} from 'lucide-react';

interface BiometricLockScreenProps {
  open: boolean;
  walletName: string;
  method: 'faceid' | 'fingerprint';
  contained?: boolean;
  onChangeMethod: (method: 'faceid' | 'fingerprint') => void;
  onUnlock: () => void;
}

type AuthStatus = 'idle' | 'scanning' | 'verified' | 'failed';

const DEFAULT_PASSCODE = '1234';

export const BiometricLockScreen: React.FC<BiometricLockScreenProps> = ({
  open,
  walletName,
  method,
  contained = false,
  onChangeMethod,
  onUnlock,
}) => {
  const [status, setStatus] = useState<AuthStatus>('idle');
  const [passcodeMode, setPasscodeMode] = useState(false);
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState(false);

  const scanTimerRef = useRef<number | null>(null);
  const unlockTimerRef = useRef<number | null>(null);

  const clearTimers = () => {
    if (scanTimerRef.current !== null) {
      window.clearTimeout(scanTimerRef.current);
      scanTimerRef.current = null;
    }
    if (unlockTimerRef.current !== null) {
      window.clearTimeout(unlockTimerRef.current);
      unlockTimerRef.current = null;
    }
  };

  useEffect(() => {
    if (!open) {
      clearTimers();
      setStatus('idle');
      setPasscodeMode(false);
      setPin('');
      setPinError(false);
    }
    return () => clearTimers();
  }, [open]);

  if (!open) return null;

  const startBiometricScan = () => {
    if (status === 'scanning' || status === 'verified') return;
    clearTimers();
    setStatus('scanning');

    scanTimerRef.current = window.setTimeout(() => {
      setStatus('verified');
      unlockTimerRef.current = window.setTimeout(() => {
        onUnlock();
      }, 420);
    }, 850);
  };

  const handleMethodSwitch = (nextMethod: 'faceid' | 'fingerprint') => {
    clearTimers();
    setStatus('idle');
    setPasscodeMode(false);
    setPin('');
    setPinError(false);
    onChangeMethod(nextMethod);
  };

  const handleDigitPress = (digit: string) => {
    if (status === 'verified' || pin.length >= 4) return;
    setPinError(false);
    const nextPin = pin + digit;
    setPin(nextPin);

    if (nextPin.length === 4) {
      if (nextPin === DEFAULT_PASSCODE) {
        setStatus('verified');
        unlockTimerRef.current = window.setTimeout(() => {
          onUnlock();
        }, 360);
      } else {
        setPinError(true);
        setStatus('failed');
        scanTimerRef.current = window.setTimeout(() => {
          setPin('');
          setPinError(false);
          setStatus('idle');
        }, 700);
      }
    }
  };

  const handleBackspace = () => {
    if (status === 'verified') return;
    setPinError(false);
    setPin((prev) => prev.slice(0, -1));
  };

  const isFaceId = method === 'faceid';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Wallet authentication"
      className={`${
        contained ? 'absolute inset-0' : 'fixed inset-0'
      } z-[70] bg-slate-50/95 dark:bg-[#090B10]/95 backdrop-blur-2xl text-slate-900 dark:text-slate-50 flex flex-col justify-between p-4 sm:p-6 overflow-y-auto`}
    >
      {/* Top Brand & Wallet Lock Identity */}
      <div className="flex flex-col items-center text-center pt-2 sm:pt-8 space-y-1.5 sm:space-y-2">
        <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-600/20">
          <Wallet className="w-5 h-5" />
        </div>
        <div className="space-y-0.5">
          <h2 className="text-base font-bold tracking-tight">Vaultx</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {walletName} <span aria-hidden="true">·</span> Locked
          </p>
        </div>
      </div>

      {/* Center Biometric Sensor or Passcode Keypad */}
      <div className="w-full max-w-xs mx-auto my-auto py-3 sm:py-6 flex flex-col items-center space-y-4 sm:space-y-6">
        {!passcodeMode ? (
          <>
            {/* Biometric Method Segmented Switcher */}
            <div
              role="group"
              aria-label="Biometric method"
              className="grid grid-cols-2 gap-1 p-1 w-full rounded-xl bg-slate-200/80 dark:bg-slate-800/80"
            >
              <button
                type="button"
                onClick={() => handleMethodSwitch('faceid')}
                className={`min-h-[44px] px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap shrink-0 ${
                  isFaceId
                    ? 'bg-white dark:bg-[#12161F] text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <ScanFace className="w-4 h-4" />
                Face ID
              </button>
              <button
                type="button"
                onClick={() => handleMethodSwitch('fingerprint')}
                className={`min-h-[44px] px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap shrink-0 ${
                  !isFaceId
                    ? 'bg-white dark:bg-[#12161F] text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <Fingerprint className="w-4 h-4" />
                Fingerprint
              </button>
            </div>

            {/* Tactile Biometric Sensor Target */}
            <button
              type="button"
              onClick={startBiometricScan}
              disabled={status === 'scanning' || status === 'verified'}
              aria-label={
                isFaceId
                  ? 'Authenticate with Face ID'
                  : 'Authenticate with Fingerprint'
              }
              className={`relative w-28 h-28 sm:w-36 sm:h-36 ${
                isFaceId ? 'rounded-3xl' : 'rounded-full'
              } bg-white dark:bg-[#12161F] border flex items-center justify-center transition-all active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                status === 'verified'
                  ? 'border-emerald-500/70 text-emerald-500 shadow-lg shadow-emerald-500/10'
                  : status === 'failed'
                  ? 'border-rose-500/70 text-rose-500'
                  : status === 'scanning'
                  ? 'border-blue-500/70 text-blue-600 dark:text-blue-400 shadow-lg shadow-blue-600/15'
                  : 'border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 hover:border-blue-500/50'
              }`}
            >
              {/* Subtle corner frame marks for Face ID */}
              {isFaceId && (
                <>
                  <span className="absolute top-3 left-3 w-4 h-4 border-t-2 border-l-2 border-current rounded-tl-md opacity-45" />
                  <span className="absolute top-3 right-3 w-4 h-4 border-t-2 border-r-2 border-current rounded-tr-md opacity-45" />
                  <span className="absolute bottom-3 left-3 w-4 h-4 border-b-2 border-l-2 border-current rounded-bl-md opacity-45" />
                  <span className="absolute bottom-3 right-3 w-4 h-4 border-b-2 border-r-2 border-current rounded-br-md opacity-45" />
                </>
              )}

              {status === 'verified' ? (
                <Check className="w-14 h-14" strokeWidth={2.2} />
              ) : status === 'failed' ? (
                <AlertCircle className="w-14 h-14" strokeWidth={1.8} />
              ) : isFaceId ? (
                <ScanFace className="w-14 h-14" strokeWidth={1.6} />
              ) : (
                <Fingerprint className="w-14 h-14" strokeWidth={1.6} />
              )}

              {/* Sweeping verification beam during scan */}
              {status === 'scanning' && (
                <div
                  aria-hidden="true"
                  className="absolute left-5 right-5 h-0.5 bg-blue-500 shadow-[0_0_12px_rgba(59,130,246,0.85)] animate-bio-scan pointer-events-none"
                />
              )}
            </button>

            <div className="text-center space-y-1">
              <p className="text-sm font-semibold">
                {status === 'verified'
                  ? 'Identity Verified'
                  : status === 'scanning'
                  ? isFaceId
                    ? 'Verifying Face ID...'
                    : 'Reading Fingerprint...'
                  : status === 'failed'
                  ? 'Not Recognized'
                  : isFaceId
                  ? 'Face ID Required'
                  : 'Fingerprint Required'}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {status === 'verified'
                  ? 'Unlocking your wallet'
                  : status === 'scanning'
                  ? 'Hold steady to authenticate'
                  : 'Tap the sensor or button below to unlock'}
              </p>
            </div>

            <button
              type="button"
              onClick={startBiometricScan}
              disabled={status === 'scanning' || status === 'verified'}
              className="w-full min-h-[48px] px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 disabled:opacity-70 active:scale-[0.98] text-white text-sm font-semibold flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 transition-all whitespace-nowrap shrink-0"
            >
              {status === 'verified' ? (
                <>
                  <Check className="w-4 h-4" />
                  Unlocked
                </>
              ) : isFaceId ? (
                <>
                  <ScanFace className="w-4 h-4" />
                  {status === 'scanning' ? 'Scanning...' : 'Unlock with Face ID'}
                </>
              ) : (
                <>
                  <Fingerprint className="w-4 h-4" />
                  {status === 'scanning'
                    ? 'Scanning...'
                    : 'Unlock with Fingerprint'}
                </>
              )}
            </button>
          </>
        ) : (
          /* Fallback 4-Digit Passcode Mode */
          <div className="w-full flex flex-col items-center space-y-5">
            <div className="text-center space-y-1">
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-slate-200/80 dark:bg-slate-800 text-slate-700 dark:text-slate-200 mb-1">
                <Lock className="w-4 h-4" />
              </div>
              <p className="text-sm font-semibold">Enter Passcode</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {pinError
                  ? 'Incorrect passcode (default: 1234)'
                  : 'Default passcode: 1234'}
              </p>
            </div>

            {/* PIN Indicator Dots */}
            <div className="flex items-center gap-3.5 py-1" aria-hidden="true">
              {[0, 1, 2, 3].map((idx) => {
                const filled = idx < pin.length;
                return (
                  <span
                    key={idx}
                    className={`w-3.5 h-3.5 rounded-full border transition-colors ${
                      pinError
                        ? 'bg-rose-500 border-rose-500'
                        : status === 'verified'
                        ? 'bg-emerald-500 border-emerald-500'
                        : filled
                        ? 'bg-blue-600 border-blue-600'
                        : 'border-slate-300 dark:border-slate-700 bg-transparent'
                    }`}
                  />
                );
              })}
            </div>

            {/* Numeric Keypad */}
            <div className="grid grid-cols-3 gap-2.5 w-full max-w-[240px]">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                <button
                  key={digit}
                  type="button"
                  onClick={() => handleDigitPress(digit)}
                  className="h-14 rounded-2xl bg-white dark:bg-[#12161F] border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-95 text-lg font-semibold tabular-nums transition-all"
                >
                  {digit}
                </button>
              ))}
              <div />
              <button
                type="button"
                onClick={() => handleDigitPress('0')}
                className="h-14 rounded-2xl bg-white dark:bg-[#12161F] border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-95 text-lg font-semibold tabular-nums transition-all"
              >
                0
              </button>
              <button
                type="button"
                onClick={handleBackspace}
                aria-label="Delete digit"
                className="h-14 rounded-2xl bg-transparent hover:bg-slate-200/70 dark:hover:bg-slate-800/70 active:scale-95 flex items-center justify-center text-slate-600 dark:text-slate-300 transition-all"
              >
                <Delete className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Secondary Switch */}
      <div className="flex justify-center pb-2">
        <button
          type="button"
          onClick={() => {
            clearTimers();
            setStatus('idle');
            setPin('');
            setPinError(false);
            setPasscodeMode((prev) => !prev);
          }}
          className="min-h-[44px] px-4 rounded-xl text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition-colors whitespace-nowrap shrink-0"
        >
          {passcodeMode
            ? `Use ${isFaceId ? 'Face ID' : 'Fingerprint'} Instead`
            : 'Use Passcode'}
        </button>
      </div>
    </div>
  );
};
