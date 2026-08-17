// src/components/Signals/SignalCard.jsx
import React from 'react';

export default function SignalCard({ signal }) {
  const isLive = signal.status === 'LIVE';
  const isBuy = signal.type === 'BUY';
  const isPositivePips = signal.pipsGain > 0;

  return (
    <div className="bg-bg-secondary border-2 border-cyan-500 p-4">
      {/* Header Row */}
      <div className="flex items-center justify-between mb-4 pb-4 border-b border-bg-tertiary">
        <div className="flex items-center gap-2">
          {/* Type Badge */}
          <div className={`px-3 py-1 font-bold text-white text-xs ${
            isBuy ? 'bg-color-success' : 'bg-color-danger'
          }`}>
            {signal.type}
          </div>
          
          {/* Pair */}
          <span className="text-sm font-semibold text-text-primary">{signal.pair}</span>
          
          {/* Session */}
          <span className="text-xs text-text-secondary">{signal.session}</span>
          
          {/* Live Badge */}
          {isLive && (
            <span className="text-xs font-semibold text-cyan-400">● LIVE</span>
          )}
        </div>

        {/* Pips Badge */}
        <div className={`px-3 py-1 font-bold text-white text-xs border ${
          isPositivePips 
            ? 'bg-color-success bg-opacity-20 border-color-success text-color-success' 
            : 'bg-color-danger bg-opacity-20 border-color-danger text-color-danger'
        }`}>
          {isPositivePips ? '+' : ''}{signal.pipsGain} Pips
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        {/* Left: Prices */}
        <div className="space-y-2">
          <div>
            <div className="text-xs text-text-secondary uppercase font-semibold">ENTRY</div>
            <div className="text-sm font-semibold text-text-primary">{signal.entry}</div>
          </div>
          <div>
            <div className="text-xs text-text-secondary uppercase font-semibold">SL</div>
            <div className="text-sm font-semibold text-color-danger">{signal.stopLoss}</div>
          </div>
          <div>
            <div className="text-xs text-text-secondary uppercase font-semibold">TP 1</div>
            <div className="text-sm font-semibold text-color-success">{signal.tp1}</div>
          </div>
          <div>
            <div className="text-xs text-text-secondary uppercase font-semibold">TP 2</div>
            <div className="text-sm font-semibold text-color-success">{signal.tp2}</div>
          </div>
        </div>

        {/* Right: Chart Placeholder */}
        <div className="h-32 bg-bg-tertiary border border-dashed border-text-tertiary flex items-center justify-center">
          <div className="w-full h-full flex items-center justify-center">
            {isBuy ? (
              <svg viewBox="0 0 100 100" className="w-full h-full p-2" preserveAspectRatio="none">
                <polyline
                  points="5,80 15,60 25,65 35,40 45,50 55,30 65,45 75,20 85,35 95,10"
                  fill="none"
                  stroke="#22c55e"
                  strokeWidth="2"
                  vectorEffect="non-scaling-stroke"
                />
                <defs>
                  <linearGradient id={`gradient-buy-${signal.id}`} x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#22c55e" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#22c55e" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <polygon
                  points="5,80 15,60 25,65 35,40 45,50 55,30 65,45 75,20 85,35 95,10 95,100 5,100"
                  fill={`url(#gradient-buy-${signal.id})`}
                />
              </svg>
            ) : (
              <svg viewBox="0 0 100 100" className="w-full h-full p-2" preserveAspectRatio="none">
                <polyline
                  points="5,20 15,40 25,35 35,60 45,50 55,70 65,55 75,80 85,65 95,90"
                  fill="none"
                  stroke="#ef4444"
                  strokeWidth="2"
                  vectorEffect="non-scaling-stroke"
                />
                <defs>
                  <linearGradient id={`gradient-sell-${signal.id}`} x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#ef4444" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <polygon
                  points="5,20 15,40 25,35 35,60 45,50 55,70 65,55 75,80 85,65 95,90 95,100 5,100"
                  fill={`url(#gradient-sell-${signal.id})`}
                />
              </svg>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="pt-4 border-t border-bg-tertiary">
        <div className="flex items-center justify-between text-xs">
          <div>
            <div className="text-text-secondary mb-1">
              Published - {signal.published}
            </div>
            <div className="flex items-center gap-1 text-text-tertiary">
              <span>●</span>
              <span>{signal.status === 'LIVE' ? 'Running' : signal.status}</span>
            </div>
          </div>
        </div>

        {/* Technical Info */}
        <div className="mt-3 pt-3 border-t border-bg-tertiary">
          <div className="text-xs text-text-secondary flex items-center gap-1">
            <span>◐</span>
            <span>{signal.technicalAnalysis}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
