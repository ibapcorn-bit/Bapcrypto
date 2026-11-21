import { WalletUiStyle } from '../types/crypto';

export interface UiThemeConfig {
  id: WalletUiStyle;
  label: string;
  tagline: string;
  brandTitle: string;
  swatches: [string, string, string];
  pageBg: string;
  outerBg: string;
  barBg: string;
  cardBg: string;
  cardRadius: string;
  itemRadius: string;
  divider: string;
  rowHover: string;
  avatarBg: string;
  accentBg: string;
  accentText: string;
  accentIconBox: string;
  activeTabText: string;
  activeDesktopBorder: string;
  activeTimeframeBg: string;
  fabBg: string;
  balanceFont: string;
  bullHex: string;
  bearHex: string;
  showChartGrid: boolean;
  chartGridColor: string;
  showMt5QuoteBar: boolean;
  themeColorLight: string;
  themeColorDark: string;
}

export const UI_THEMES: Record<WalletUiStyle, UiThemeConfig> = {
  candles: {
    id: 'candles',
    label: 'Candles',
    tagline: 'Sharp OHLC dark terminal',
    brandTitle: 'Vaultx',
    swatches: ['#090B10', '#2563EB', '#24B87E'],
    pageBg: 'bg-slate-50 dark:bg-[#090B10] text-slate-900 dark:text-slate-50',
    outerBg: 'bg-slate-100 dark:bg-[#090B10] text-slate-900 dark:text-slate-50',
    barBg:
      'bg-slate-50/90 dark:bg-[#0D1017]/90 backdrop-blur-md border-slate-200/80 dark:border-slate-800/80',
    cardBg:
      'bg-white dark:bg-[#12161F] border border-slate-200/80 dark:border-slate-800/80',
    cardRadius: 'rounded-3xl',
    itemRadius: 'rounded-2xl',
    divider: 'divide-y divide-slate-100 dark:divide-slate-800/70',
    rowHover: 'hover:bg-slate-50 dark:hover:bg-slate-800/40',
    avatarBg: 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white',
    accentBg: 'bg-blue-600 hover:bg-blue-500 text-white',
    accentText: 'text-blue-600 dark:text-blue-400',
    accentIconBox: 'bg-blue-600/12 text-blue-600 dark:text-blue-400',
    activeTabText: 'text-blue-600 dark:text-blue-400',
    activeDesktopBorder: 'border-blue-600 text-slate-900 dark:text-white',
    activeTimeframeBg: 'bg-slate-900 text-white dark:bg-slate-800 dark:text-white',
    fabBg: 'bg-blue-600 hover:bg-blue-500 shadow-blue-600/30 text-white',
    balanceFont: 'font-bold tracking-tight',
    bullHex: '#24B87E',
    bearHex: '#E53945',
    showChartGrid: false,
    chartGridColor: 'rgba(148, 163, 184, 0.14)',
    showMt5QuoteBar: false,
    themeColorLight: '#F8FAFC',
    themeColorDark: '#090B10',
  },
  phantom: {
    id: 'phantom',
    label: 'Phantom',
    tagline: 'Velvet dark & lavender glow',
    brandTitle: 'Phantom',
    swatches: ['#181420', '#AB9FF2', '#26D9A3'],
    pageBg: 'bg-[#F5F3FF] dark:bg-[#14111B] text-slate-900 dark:text-[#F8F7FC]',
    outerBg: 'bg-[#EDE9FE] dark:bg-[#100D16] text-slate-900 dark:text-[#F8F7FC]',
    barBg:
      'bg-[#F5F3FF]/90 dark:bg-[#1B1626]/90 backdrop-blur-md border-purple-200/70 dark:border-[#2E2640]',
    cardBg:
      'bg-white dark:bg-[#1E192B] border border-purple-200/70 dark:border-[#2F2742]',
    cardRadius: 'rounded-[28px]',
    itemRadius: 'rounded-2xl',
    divider: 'divide-y divide-purple-100 dark:divide-[#2A233B]',
    rowHover: 'hover:bg-purple-50/70 dark:hover:bg-[#272038]',
    avatarBg: 'bg-[#AB9FF2] text-[#181420]',
    accentBg: 'bg-[#8B5CF6] hover:bg-[#7C3AED] text-white',
    accentText: 'text-[#7C3AED] dark:text-[#AB9FF2]',
    accentIconBox: 'bg-[#AB9FF2]/18 text-[#7C3AED] dark:text-[#AB9FF2]',
    activeTabText: 'text-[#7C3AED] dark:text-[#AB9FF2]',
    activeDesktopBorder: 'border-[#AB9FF2] text-slate-900 dark:text-white',
    activeTimeframeBg: 'bg-[#7C3AED] text-white dark:bg-[#AB9FF2] dark:text-[#181420]',
    fabBg: 'bg-[#8B5CF6] hover:bg-[#7C3AED] shadow-violet-600/35 text-white',
    balanceFont: 'font-bold tracking-tight',
    bullHex: '#26D9A3',
    bearHex: '#FF5C77',
    showChartGrid: false,
    chartGridColor: 'rgba(171, 159, 242, 0.14)',
    showMt5QuoteBar: false,
    themeColorLight: '#F5F3FF',
    themeColorDark: '#14111B',
  },
  coinbase: {
    id: 'coinbase',
    label: 'Coinbase',
    tagline: 'Crisp institutional #0052FF',
    brandTitle: 'Coinbase',
    swatches: ['#0A0B0D', '#0052FF', '#05B169'],
    pageBg: 'bg-white dark:bg-[#0A0B0D] text-[#0A0B0D] dark:text-white',
    outerBg: 'bg-[#F7F8FA] dark:bg-[#07080A] text-[#0A0B0D] dark:text-white',
    barBg:
      'bg-white/95 dark:bg-[#0A0B0D]/95 backdrop-blur-md border-slate-200 dark:border-[#1E2025]',
    cardBg:
      'bg-[#F7F8FA] dark:bg-[#141519] border border-slate-200/90 dark:border-[#23252C]',
    cardRadius: 'rounded-2xl',
    itemRadius: 'rounded-full',
    divider: 'divide-y divide-slate-200/80 dark:divide-[#23252C]',
    rowHover: 'hover:bg-slate-100/70 dark:hover:bg-[#1C1E24]',
    avatarBg: 'bg-[#0052FF] text-white',
    accentBg: 'bg-[#0052FF] hover:bg-[#0045D8] text-white',
    accentText: 'text-[#0052FF] dark:text-[#4D88FF]',
    accentIconBox: 'bg-[#0052FF] text-white',
    activeTabText: 'text-[#0052FF] dark:text-[#4D88FF]',
    activeDesktopBorder: 'border-[#0052FF] text-[#0A0B0D] dark:text-white',
    activeTimeframeBg: 'bg-[#0052FF]/12 text-[#0052FF] dark:bg-[#0052FF] dark:text-white',
    fabBg: 'bg-[#0052FF] hover:bg-[#0045D8] shadow-[#0052FF]/30 text-white',
    balanceFont: 'font-bold tracking-tight',
    bullHex: '#05B169',
    bearHex: '#DF5F67',
    showChartGrid: false,
    chartGridColor: 'rgba(0, 82, 255, 0.12)',
    showMt5QuoteBar: false,
    themeColorLight: '#FFFFFF',
    themeColorDark: '#0A0B0D',
  },
  neurobro: {
    id: 'neurobro',
    label: 'NeuroBro',
    tagline: 'Quant cyan & obsidian matrix',
    brandTitle: 'NeuroBro',
    swatches: ['#05080F', '#00E5B0', '#38BDF8'],
    pageBg: 'bg-slate-50 dark:bg-[#05080F] text-slate-900 dark:text-[#E6F4F1]',
    outerBg: 'bg-slate-100 dark:bg-[#03050A] text-slate-900 dark:text-[#E6F4F1]',
    barBg:
      'bg-white/90 dark:bg-[#090F1A]/90 backdrop-blur-md border-cyan-200/60 dark:border-cyan-950',
    cardBg:
      'bg-white dark:bg-[#0B121E] border border-cyan-200/70 dark:border-cyan-900/60',
    cardRadius: 'rounded-xl',
    itemRadius: 'rounded-xl',
    divider: 'divide-y divide-slate-100 dark:divide-cyan-950/80',
    rowHover: 'hover:bg-cyan-50/40 dark:hover:bg-cyan-950/40',
    avatarBg: 'bg-gradient-to-br from-[#00E5B0] to-[#0EA5E9] text-slate-950',
    accentBg: 'bg-[#00C896] hover:bg-[#00B386] text-slate-950',
    accentText: 'text-[#0284C7] dark:text-[#00E5B0]',
    accentIconBox: 'bg-[#00E5B0]/14 text-[#0284C7] dark:text-[#00E5B0]',
    activeTabText: 'text-[#0284C7] dark:text-[#00E5B0]',
    activeDesktopBorder: 'border-[#00E5B0] text-slate-900 dark:text-white',
    activeTimeframeBg: 'bg-[#0EA5E9] text-white dark:bg-[#00E5B0] dark:text-slate-950',
    fabBg: 'bg-[#0EA5E9] hover:bg-[#0284C7] shadow-cyan-500/30 text-white',
    balanceFont: 'font-bold tracking-tight font-mono',
    bullHex: '#00E5B0',
    bearHex: '#FB4D6D',
    showChartGrid: true,
    chartGridColor: 'rgba(56, 189, 248, 0.14)',
    showMt5QuoteBar: false,
    themeColorLight: '#F8FAFC',
    themeColorDark: '#05080F',
  },
  exodus: {
    id: 'exodus',
    label: 'Exodus',
    tagline: 'Cosmic sapphire & neon iris',
    brandTitle: 'Exodus',
    swatches: ['#14122B', '#7C5CFF', '#00D2FF'],
    pageBg: 'bg-[#F4F5FB] dark:bg-[#110F24] text-slate-900 dark:text-white',
    outerBg: 'bg-[#ECEEF8] dark:bg-[#0C0A1B] text-slate-900 dark:text-white',
    barBg:
      'bg-[#F4F5FB]/90 dark:bg-[#171430]/90 backdrop-blur-md border-indigo-200/70 dark:border-indigo-900/60',
    cardBg:
      'bg-white dark:bg-gradient-to-b dark:from-[#1E1A3B] dark:to-[#16132E] border border-indigo-200/70 dark:border-indigo-800/50',
    cardRadius: 'rounded-3xl',
    itemRadius: 'rounded-2xl',
    divider: 'divide-y divide-indigo-100 dark:divide-indigo-900/50',
    rowHover: 'hover:bg-indigo-50/70 dark:hover:bg-indigo-900/30',
    avatarBg: 'bg-gradient-to-br from-[#7C5CFF] to-[#00D2FF] text-white',
    accentBg: 'bg-gradient-to-r from-[#7C5CFF] to-[#4F8BFF] hover:opacity-95 text-white',
    accentText: 'text-[#6344FF] dark:text-[#38BDF8]',
    accentIconBox: 'bg-[#7C5CFF]/18 text-[#6344FF] dark:text-[#9D85FF]',
    activeTabText: 'text-[#6344FF] dark:text-[#00D2FF]',
    activeDesktopBorder: 'border-[#7C5CFF] text-slate-900 dark:text-white',
    activeTimeframeBg: 'bg-[#6344FF] text-white dark:bg-[#7C5CFF] dark:text-white',
    fabBg: 'bg-gradient-to-br from-[#7C5CFF] to-[#00D2FF] shadow-indigo-500/35 text-white',
    balanceFont: 'font-bold tracking-tight',
    bullHex: '#00E096',
    bearHex: '#FF4F7B',
    showChartGrid: false,
    chartGridColor: 'rgba(124, 92, 255, 0.16)',
    showMt5QuoteBar: false,
    themeColorLight: '#F4F5FB',
    themeColorDark: '#110F24',
  },
  mt5: {
    id: 'mt5',
    label: 'MetaTrader 5',
    tagline: 'Classic FX/crypto order terminal',
    brandTitle: 'MetaTrader 5',
    swatches: ['#0E1724', '#1976D2', '#00C853'],
    pageBg: 'bg-[#F0F3F7] dark:bg-[#0D141F] text-slate-900 dark:text-[#E5ECF4]',
    outerBg: 'bg-[#E5EAF1] dark:bg-[#090E17] text-slate-900 dark:text-[#E5ECF4]',
    barBg:
      'bg-[#F8FAFC]/95 dark:bg-[#131C2A]/95 backdrop-blur-md border-slate-300 dark:border-[#243247]',
    cardBg:
      'bg-white dark:bg-[#141E2C] border border-slate-300/90 dark:border-[#25354B]',
    cardRadius: 'rounded-lg',
    itemRadius: 'rounded-md',
    divider: 'divide-y divide-slate-200 dark:divide-[#223044]',
    rowHover: 'hover:bg-slate-100 dark:hover:bg-[#1B283B]',
    avatarBg: 'bg-[#1976D2] text-white',
    accentBg: 'bg-[#1976D2] hover:bg-[#1565C0] text-white',
    accentText: 'text-[#1976D2] dark:text-[#4CA6FF]',
    accentIconBox: 'bg-[#1976D2]/15 text-[#1976D2] dark:text-[#4CA6FF]',
    activeTabText: 'text-[#1976D2] dark:text-[#4CA6FF]',
    activeDesktopBorder: 'border-[#1976D2] text-slate-900 dark:text-white',
    activeTimeframeBg: 'bg-[#1976D2] text-white',
    fabBg: 'bg-[#1976D2] hover:bg-[#1565C0] shadow-blue-700/30 text-white',
    balanceFont: 'font-bold tracking-tight font-mono',
    bullHex: '#00C853',
    bearHex: '#FF3D00',
    showChartGrid: true,
    chartGridColor: 'rgba(100, 116, 139, 0.24)',
    showMt5QuoteBar: true,
    themeColorLight: '#F0F3F7',
    themeColorDark: '#0D141F',
  },
  okx: {
    id: 'okx',
    label: 'OKX',
    tagline: 'Pure black & crisp exchange UI',
    brandTitle: 'OKX',
    swatches: ['#000000', '#FFFFFF', '#00C076'],
    pageBg: 'bg-[#F5F5F5] dark:bg-[#000000] text-neutral-950 dark:text-white',
    outerBg: 'bg-[#EBEBEB] dark:bg-[#000000] text-neutral-950 dark:text-white',
    barBg:
      'bg-white/95 dark:bg-[#0A0A0A]/95 backdrop-blur-md border-neutral-200 dark:border-[#1F1F1F]',
    cardBg:
      'bg-white dark:bg-[#121212] border border-neutral-200 dark:border-[#242424]',
    cardRadius: 'rounded-2xl',
    itemRadius: 'rounded-xl',
    divider: 'divide-y divide-neutral-200/80 dark:divide-[#1F1F1F]',
    rowHover: 'hover:bg-neutral-100 dark:hover:bg-[#1A1A1A]',
    avatarBg: 'bg-neutral-950 text-white dark:bg-white dark:text-black',
    accentBg:
      'bg-neutral-950 hover:bg-neutral-800 text-white dark:bg-white dark:hover:bg-neutral-200 dark:text-black',
    accentText: 'text-neutral-950 dark:text-white',
    accentIconBox:
      'bg-neutral-950/10 text-neutral-950 dark:bg-white/12 dark:text-white',
    activeTabText: 'text-neutral-950 dark:text-white',
    activeDesktopBorder:
      'border-neutral-950 dark:border-white text-neutral-950 dark:text-white',
    activeTimeframeBg:
      'bg-neutral-950 text-white dark:bg-white dark:text-black',
    fabBg:
      'bg-neutral-950 hover:bg-neutral-800 text-white dark:bg-white dark:hover:bg-neutral-200 dark:text-black shadow-black/30',
    balanceFont: 'font-bold tracking-tight',
    bullHex: '#00C076',
    bearHex: '#F6465D',
    showChartGrid: false,
    chartGridColor: 'rgba(255, 255, 255, 0.1)',
    showMt5QuoteBar: false,
    themeColorLight: '#F5F5F5',
    themeColorDark: '#000000',
  },
};

export const UI_THEME_LIST: UiThemeConfig[] = [
  UI_THEMES.candles,
  UI_THEMES.phantom,
  UI_THEMES.coinbase,
  UI_THEMES.neurobro,
  UI_THEMES.exodus,
  UI_THEMES.mt5,
  UI_THEMES.okx,
];
