import React, { useEffect, useState } from 'react';

interface TokenIconProps {
  symbol: string;
  color: string;
  size?: number;
}

interface LogoEntry {
  src: string;
  bg?: string;
  padPct?: number;
}

const TOKEN_LOGOS: Record<string, LogoEntry> = {
  BTC: { src: '/assets/coins/btc.png' },
  ETH: { src: '/assets/coins/eth.png', bg: '#FFFFFF', padPct: 12 },
  SOL: { src: '/assets/coins/sol.png', bg: '#0B101B', padPct: 18 },
  USDT: { src: '/assets/coins/usdt.png' },
  USDC: { src: '/assets/coins/usdc.png' },
  BNB: { src: '/assets/coins/bnb.png' },
  XRP: { src: '/assets/coins/xrp.png', bg: '#FFFFFF', padPct: 18 },
  TRX: { src: '/assets/coins/trx.png' },
  STETH: { src: '/assets/coins/steth.png' },
  HYPE: { src: '/assets/coins/hype.jpg' },
  DOGE: { src: '/assets/coins/doge.png' },
  LINK: { src: '/assets/coins/link.png' },
  ADA: { src: '/assets/coins/ada.png', bg: '#FFFFFF', padPct: 14 },
  NEAR: { src: '/assets/coins/near.jpg' },
  LTC: { src: '/assets/coins/ltc.png' },
  AVAX: { src: '/assets/coins/avax.png' },
  UNI: { src: '/assets/coins/uni.png', bg: '#FFFFFF', padPct: 12 },
  TON: { src: '/assets/coins/ton.png' },
  SUI: { src: '/assets/coins/sui.png', bg: '#FFFFFF', padPct: 15 },
  SHIB: { src: '/assets/coins/shib.png', bg: '#FFFFFF', padPct: 8 },
  TAO: { src: '/assets/coins/tao.jpg' },
  AAVE: { src: '/assets/coins/aave.png' },
  PEPE: { src: '/assets/coins/pepe.jpg' },
  ONDO: { src: '/assets/coins/ondo.png', bg: '#FFFFFF', padPct: 14 },
  DOT: { src: '/assets/coins/dot.jpg' },
  ARB: { src: '/assets/coins/arb.jpg' },
  RENDER: { src: '/assets/coins/render.png' },
  RNDR: { src: '/assets/coins/render.png' },
  JITOSOL: { src: '/assets/coins/jitosol.png' },
  ATOM: { src: '/assets/coins/atom.png' },
  APT: { src: '/assets/coins/apt.png' },
  PENGU: { src: '/assets/coins/pengu.png' },
  SPX: { src: '/assets/coins/spx.png' },
  SEI: { src: '/assets/coins/sei.png', bg: '#FFFFFF', padPct: 6 },
  BONK: { src: '/assets/coins/bonk.jpg' },
  OP: { src: '/assets/coins/op.png' },
  FLOKI: { src: '/assets/coins/floki.png', bg: '#FFFFFF', padPct: 8 },
  WIF: { src: '/assets/coins/wif.jpg' },
  NVDA: { src: '/assets/coins/nvda.png' },
  NVDAX: { src: '/assets/coins/nvda.png' },
  FARTCOIN: { src: '/assets/coins/fartcoin.jpg' },
  POPCAT: { src: '/assets/coins/popcat.jpg' },
  BRETT: { src: '/assets/coins/brett.jpg' },
};

export const TokenIcon: React.FC<TokenIconProps> = ({ symbol, color, size = 40 }) => {
  const sym = symbol.toUpperCase().trim();
  const logo = TOKEN_LOGOS[sym];
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setImgError(false);
  }, [sym]);

  if (logo && !imgError) {
    const padPx = logo.padPct ? Math.round((size * logo.padPct) / 100) : 0;
    return (
      <div
        style={{
          width: size,
          height: size,
          backgroundColor: logo.bg || 'transparent',
          padding: padPx || undefined,
        }}
        className="rounded-full overflow-hidden flex items-center justify-center shrink-0 shadow-sm ring-1 ring-black/5 dark:ring-white/10"
      >
        <img
          src={logo.src}
          alt={`${sym} logo`}
          draggable={false}
          onError={() => setImgError(true)}
          className={`w-full h-full select-none ${
            logo.padPct ? 'object-contain' : 'object-cover'
          }`}
        />
      </div>
    );
  }

  return (
    <div
      style={{ width: size, height: size, backgroundColor: color || '#3B82F6' }}
      className="rounded-full flex items-center justify-center shrink-0 text-white font-bold tracking-tight shadow-sm"
    >
      <span style={{ fontSize: Math.round(size * 0.34) }}>
        {sym.slice(0, 3) || '?'}
      </span>
    </div>
  );
};
