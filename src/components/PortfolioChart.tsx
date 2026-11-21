import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ChartShape, Timeframe } from '../types/crypto';
import { CandlePoint, generateCandleSeries } from '../data/presets';

interface PortfolioChartProps {
  totalBalance: number;
  changePct: number;
  shape: ChartShape;
  timeframe: Timeframe;
  onHoverPoint: (point: { value: number; label: string } | null) => void;
  bullColor?: string;
  bearColor?: string;
  showGrid?: boolean;
  gridColor?: string;
  liveTickSeq?: number;
}

export const PortfolioChart: React.FC<PortfolioChartProps> = ({
  totalBalance,
  changePct,
  shape,
  timeframe,
  onHoverPoint,
  bullColor = '#24B87E',
  bearColor = '#E53945',
  showGrid = false,
  gridColor = 'rgba(148, 163, 184, 0.18)',
  liveTickSeq = 0,
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const [candles, setCandles] = useState<CandlePoint[]>(() =>
    generateCandleSeries(totalBalance, changePct, shape, timeframe)
  );
  const prevTimeframeRef = useRef<Timeframe>(timeframe);
  const prevShapeRef = useRef<ChartShape>(shape);
  const prevTickSeqRef = useRef<number>(liveTickSeq);
  const prevBalanceRef = useRef<number>(totalBalance);
  const prevChangePctRef = useRef<number>(changePct);
  const subTickRef = useRef<number>(0);

  useEffect(() => {
    const tfChanged = timeframe !== prevTimeframeRef.current;
    const shapeChanged = shape !== prevShapeRef.current;
    const tickAdvanced = liveTickSeq > prevTickSeqRef.current;
    const balanceChanged =
      Math.abs(totalBalance - prevBalanceRef.current) > 0.0001;
    const pctChanged =
      Math.abs(changePct - prevChangePctRef.current) > 0.01;

    prevTimeframeRef.current = timeframe;
    prevShapeRef.current = shape;
    prevTickSeqRef.current = liveTickSeq;
    prevBalanceRef.current = totalBalance;
    prevChangePctRef.current = changePct;

    if (tfChanged) {
      subTickRef.current = 0;
      setCandles(
        generateCandleSeries(totalBalance, changePct, shape, timeframe)
      );
      return;
    }

    if (tickAdvanced) {
      subTickRef.current += 1;
      const pushNewCandle = subTickRef.current % 2 === 0;
      const nowLabel = new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });

      setCandles((prev) => {
        if (prev.length === 0) {
          return generateCandleSeries(totalBalance, changePct, shape, timeframe);
        }
        const safePrice = Math.max(0.01, totalBalance);
        const last = prev[prev.length - 1];

        if (pushNewCandle) {
          const open = last.close;
          const close = safePrice;
          const bodySpan = Math.abs(close - open);
          const wickPad = Math.max(safePrice * 0.003, bodySpan * 0.35);
          const nextCandle: CandlePoint = {
            open,
            close,
            high: Math.max(open, close) + wickPad * (0.4 + Math.random() * 0.8),
            low: Math.max(
              safePrice * 0.05,
              Math.min(open, close) - wickPad * (0.4 + Math.random() * 0.8)
            ),
            label: nowLabel,
          };
          return [...prev.slice(1), nextCandle];
        }

        const updatedLast: CandlePoint = {
          ...last,
          close: safePrice,
          high: Math.max(last.high, safePrice),
          low: Math.max(safePrice * 0.05, Math.min(last.low, safePrice)),
          label: nowLabel,
        };
        return [...prev.slice(0, -1), updatedLast];
      });
      return;
    }

    if (shapeChanged || balanceChanged || pctChanged) {
      subTickRef.current = 0;
      setCandles(
        generateCandleSeries(totalBalance, changePct, shape, timeframe)
      );
    }
  }, [totalBalance, changePct, shape, timeframe, liveTickSeq]);

  const width = 400;
  const height = 176;
  const padY = 10;

  const { plotted, lastCloseY, lastBull } = useMemo(() => {
    const highs = candles.map((c) => c.high);
    const lows = candles.map((c) => c.low);
    const max = Math.max(...highs);
    const min = Math.min(...lows);
    const range = max - min || Math.max(1, max * 0.05);

    const toY = (val: number) =>
      height - padY - ((val - min) / range) * (height - padY * 2);

    const slotW = width / candles.length;
    const bodyW = Math.max(4, slotW * 0.62);

    const items = candles.map((c, i) => {
      const cx = i * slotW + slotW / 2;
      const yOpen = toY(c.open);
      const yClose = toY(c.close);
      const yHigh = toY(c.high);
      const yLow = toY(c.low);
      const isBull = c.close >= c.open;
      const bodyTop = Math.min(yOpen, yClose);
      const bodyHeight = Math.max(2, Math.abs(yClose - yOpen));

      return {
        ...c,
        cx,
        xBody: cx - bodyW / 2,
        bodyW,
        bodyTop,
        bodyHeight,
        yHigh,
        yLow,
        yClose,
        isBull,
        color: isBull ? bullColor : bearColor,
      };
    });

    const last = items[items.length - 1];
    return {
      plotted: items,
      lastCloseY: last ? last.yClose : height / 2,
      lastBull: last ? last.isBull : true,
    };
  }, [candles, bullColor, bearColor]);

  const handlePointer = (clientX: number) => {
    if (!svgRef.current || plotted.length === 0) return;
    const rect = svgRef.current.getBoundingClientRect();
    const relX = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const idx = Math.min(
      plotted.length - 1,
      Math.max(0, Math.floor(relX * plotted.length))
    );
    setActiveIndex(idx);
    onHoverPoint({
      value: plotted[idx].close,
      label: plotted[idx].label,
    });
  };

  const clearPointer = () => {
    setActiveIndex(null);
    onHoverPoint(null);
  };

  const activeCandle = activeIndex !== null ? plotted[activeIndex] : null;

  return (
    <div className="relative w-full select-none touch-none">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        className="w-full h-40 sm:h-48 lg:h-60 xl:h-72 overflow-visible cursor-crosshair"
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          handlePointer(e.clientX);
        }}
        onPointerMove={(e) => {
          if (e.buttons > 0 || e.pointerType === 'mouse') {
            handlePointer(e.clientX);
          }
        }}
        onPointerUp={clearPointer}
        onPointerLeave={clearPointer}
      >
        {/* Optional terminal gridlines (e.g. MetaTrader 5 / NeuroBro) */}
        {showGrid && (
          <g stroke={gridColor} strokeWidth="1" strokeDasharray="2 3">
            {[0.2, 0.4, 0.6, 0.8].map((r) => (
              <line
                key={`h-${r}`}
                x1="0"
                y1={height * r}
                x2={width}
                y2={height * r}
                vectorEffect="non-scaling-stroke"
              />
            ))}
            {[0.2, 0.4, 0.6, 0.8].map((r) => (
              <line
                key={`v-${r}`}
                x1={width * r}
                y1="0"
                x2={width * r}
                y2={height}
                vectorEffect="non-scaling-stroke"
              />
            ))}
          </g>
        )}

        {/* Subtle live close dashed line */}
        <line
          x1="0"
          y1={lastCloseY}
          x2={width}
          y2={lastCloseY}
          stroke={lastBull ? bullColor : bearColor}
          strokeOpacity="0.35"
          strokeDasharray="3 3"
          strokeWidth="1"
          vectorEffect="non-scaling-stroke"
        />

        {/* Crosshair on scrub */}
        {activeCandle && (
          <line
            x1={activeCandle.cx}
            y1={0}
            x2={activeCandle.cx}
            y2={height}
            stroke="currentColor"
            strokeOpacity="0.28"
            strokeWidth="1"
            strokeDasharray="2 3"
            vectorEffect="non-scaling-stroke"
          />
        )}

        {/* Sharp OHLC Candlesticks */}
        {plotted.map((c, idx) => {
          const isHovered = activeIndex === idx;
          return (
            <g
              key={idx}
              opacity={activeIndex !== null && !isHovered ? 0.55 : 1}
            >
              {/* Thin high-low wick */}
              <line
                x1={c.cx}
                y1={c.yHigh}
                x2={c.cx}
                y2={c.yLow}
                stroke={c.color}
                strokeWidth="1.25"
                vectorEffect="non-scaling-stroke"
              />
              {/* Sharp rectangular candle body */}
              <rect
                x={c.xBody}
                y={c.bodyTop}
                width={c.bodyW}
                height={c.bodyHeight}
                fill={c.color}
              />
            </g>
          );
        })}
      </svg>
    </div>
  );
};
