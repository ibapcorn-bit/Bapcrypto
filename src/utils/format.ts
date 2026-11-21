export function formatUsd(value: number, compact = false): string {
  if (compact && Math.abs(value) >= 1_000_000) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      notation: 'compact',
      maximumFractionDigits: 2,
    }).format(value);
  }
  const abs = Math.abs(value);
  const sign = value < 0 ? '-' : '';
  if (abs > 0 && abs < 0.01) {
    return `${sign}$${abs.toFixed(6)}`;
  }
  if (abs >= 0.01 && abs < 1) {
    return `${sign}$${abs.toFixed(4)}`;
  }
  return `${sign}${new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(abs)}`;
}

export function formatSignedUsd(value: number): string {
  const prefix = value >= 0 ? '+' : '-';
  return `${prefix}${formatUsd(Math.abs(value))}`;
}

export function formatPct(value: number): string {
  const prefix = value >= 0 ? '+' : '';
  return `${prefix}${value.toFixed(2)}%`;
}

export function formatTokenAmount(amount: number): string {
  const abs = Math.abs(amount);
  if (abs >= 1_000_000_000) {
    return `${(amount / 1_000_000_000).toFixed(2)}B`;
  }
  if (abs >= 1_000_000) {
    return `${(amount / 1_000_000).toFixed(2)}M`;
  }
  if (abs >= 1000) {
    return new Intl.NumberFormat('en-US', {
      maximumFractionDigits: 2,
    }).format(amount);
  }
  if (abs > 0 && abs < 0.001) {
    return amount.toFixed(6);
  }
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 4,
  }).format(amount);
}
