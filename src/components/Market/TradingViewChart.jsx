import React, { memo, useEffect, useRef } from 'react';

function TradingViewChart({
  symbol = 'ICMARKETS:XAUUSD',
  compact = false,
  drawingTools = !compact,
}) {
  const container = useRef(null);

  useEffect(() => {
    const root = container.current;
    if (!root) return;
    root.innerHTML = '<div class="tradingview-widget-container__widget"></div>';
    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
    script.type = 'text/javascript';
    script.async = true;
    script.text = JSON.stringify({
      autosize: true,
      symbol,
      interval: '1',
      timezone: 'Asia/Jakarta',
      theme: 'dark',
      style: '1',
      locale: 'id',
      backgroundColor: '#080d14',
      gridColor: 'rgba(255,255,255,0.06)',
      // TradingView's left toolbar contains the broker-style drawing tools.
      hide_side_toolbar: !drawingTools,
      hide_top_toolbar: compact,
      hide_legend: false,
      allow_symbol_change: !compact,
      save_image: false,
      calendar: false,
      support_host: 'https://www.tradingview.com',
    });
    root.appendChild(script);
    return () => {
      root.innerHTML = '';
    };
  }, [symbol, compact, drawingTools]);

  return (
    <div ref={container} className={`tradingview-widget-container ${compact ? 'compact' : ''}`} />
  );
}

export default memo(TradingViewChart);
