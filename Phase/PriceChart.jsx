// src/components/Dashboard/PriceChart.jsx
import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

/**
 * PriceChart Component
 * Displays a real-time area chart of price history
 * 
 * Props:
 * - data: Array of price data points [{ time: string, price: number }, ...]
 * - isLoading: Boolean to show loading state
 * - isNegative: Boolean to determine chart color (red if negative)
 */
export default function PriceChart({ data = [], isLoading = false, isNegative = false }) {
  // Default mock data if no data provided
  const chartData = data.length > 0 ? data : [
    { name: '1', value: 3427.20 },
    { name: '2', value: 3428.50 },
    { name: '3', value: 3426.30 },
    { name: '4', value: 3429.10 },
    { name: '5', value: 3425.80 },
    { name: '6', value: 3430.20 },
    { name: '7', value: 3427.90 },
  ];

  if (isLoading) {
    return (
      <div className="w-full h-32 bg-bg-tertiary rounded-lg flex items-center justify-center animate-pulse">
        <span className="text-text-tertiary text-sm">Loading chart...</span>
      </div>
    );
  }

  return (
    <div className="w-full h-32 bg-bg-tertiary rounded-lg">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={chartData}
          margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
        >
          {/* No visible grid - clean look */}
          <defs>
            {/* Red gradient for area fill */}
            <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={isNegative ? '#ef4444' : '#22c55e'} stopOpacity={0.3} />
              <stop offset="95%" stopColor={isNegative ? '#ef4444' : '#22c55e'} stopOpacity={0} />
            </linearGradient>
          </defs>

          {/* No axes - keep it minimal */}
          <XAxis dataKey="name" hide={true} />
          <YAxis hide={true} domain="dataMin" />

          {/* Tooltip shows price on hover */}
          <Tooltip
            contentStyle={{
              backgroundColor: '#1a1f2e',
              border: '1px solid #2d3748',
              borderRadius: '6px',
              color: '#ffffff',
            }}
            formatter={(value) => [`$${value.toFixed(2)}`, 'Price']}
            labelStyle={{ color: '#d4a574' }}
          />

          {/* Area chart with gradient */}
          <Area
            type="monotone"
            dataKey="value"
            stroke={isNegative ? '#ef4444' : '#22c55e'}
            strokeWidth={2}
            fill="url(#priceGradient)"
            dot={false}
            isAnimationActive={true}
            animationDuration={800}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
