// src/components/Dashboard/Dashboard.jsx
import React, { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, Users, Target, Calendar, MessageSquare, TrendingUpIcon, BarChart3 } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { formatPrice, formatPercent } from '../../utils/formatters';

export default function Dashboard() {
  // Mock price data
  const [priceData, setPriceData] = useState({
    pair: 'XAU/USD',
    price: 3427.20,
    change: -10.50,
    changePercent: -0.0067,
    high: 3434.50,
    low: 3412.30,
    open: 3428.20,
    timestamp: '11:38 WIB',
    history: [
      { name: '1', value: 3427.20 },
      { name: '2', value: 3428.50 },
      { name: '3', value: 3426.30 },
      { name: '4', value: 3429.10 },
      { name: '5', value: 3425.80 },
      { name: '6', value: 3430.20 },
      { name: '7', value: 3427.90 },
    ],
  });

  const [signals] = useState([
    {
      id: 1,
      type: 'SELL',
      pair: 'XAUUSD',
      session: 'London Session - 09:45 WIB',
      status: 'LIVE',
      entry: 3428.50,
      stopLoss: 3428.50,
      tp1: 3428.50,
      tp2: 3428.50,
      pipsGain: 250,
    },
  ]);

  const [calendar] = useState([
    {
      id: 1,
      time: '15:30',
      impact: 'HIGH',
      currency: 'US',
      event: 'Non-Farm Payrolls',
    },
    {
      id: 2,
      time: '15:30',
      impact: 'MEDIUM',
      currency: 'US',
      event: 'Unemployment Rate',
    },
    {
      id: 3,
      time: '15:30',
      impact: 'LOW',
      currency: 'US',
      event: 'Unemployment Rate',
    },
  ]);

  // Sentiment chart data
  const [bullishData] = useState([
    { name: '1', value: 60 },
    { name: '2', value: 62 },
    { name: '3', value: 65 },
    { name: '4', value: 63 },
    { name: '5', value: 66 },
    { name: '6', value: 68 },
  ]);

  const [bearishData] = useState([
    { name: '1', value: 35 },
    { name: '2', value: 33 },
    { name: '3', value: 30 },
    { name: '4', value: 32 },
    { name: '5', value: 29 },
    { name: '6', value: 30 },
  ]);

  const [announcements] = useState([
    {
      id: 1,
      title: 'High Impact News Today',
      content: 'Volatilitas Estimasi 80-150 Pips. Rekomendasi Close Posisi Atau Perlebar SL Minimal 50 Pips.',
      time: '2 Jam Lalu',
      author: 'Admin NH',
      timestamp: 'Hari Ini 15:30 WIB',
    },
    {
      id: 2,
      title: 'High Impact News Today',
      content: 'Volatilitas Estimasi 80-150 Pips. Rekomendasi Close Posisi Atau Perlebar SL Minimal 50 Pips.',
      time: '2 Jam Lalu',
      author: 'Admin NH',
      timestamp: 'Hari Ini 15:30 WIB',
    },
  ]);

  // Simulate price updates
  useEffect(() => {
    const interval = setInterval(() => {
      setPriceData(prev => {
        const change = (Math.random() - 0.5) * 5;
        const newPrice = Math.max(3400, Math.min(3450, prev.price + change));
        const newHistory = [...prev.history.slice(1), { name: '7', value: newPrice }];
        
        return {
          ...prev,
          price: newPrice,
          change: newPrice - prev.open,
          changePercent: (newPrice - prev.open) / prev.open,
          history: newHistory,
        };
      });
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const isNegativeChange = priceData.change < 0;

  return (
    <div className="bg-bg-primary min-h-screen p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Price Card Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Price Card - Takes 2 columns */}
          <div className="lg:col-span-2 bg-bg-secondary border-2 border-cyan-500">
            <div className="p-6 space-y-4">
              {/* Header */}
              <div>
                <div className="text-sm font-semibold text-text-secondary uppercase tracking-wide">
                  {priceData.pair}
                </div>
                <div className="mt-3 flex items-baseline gap-4">
                  <div className="text-6xl font-bold text-color-gold">
                    {formatPrice(priceData.price)}
                  </div>
                  <div className="flex gap-2 items-center">
                    <span className={`text-lg font-bold ${isNegativeChange ? 'text-color-danger' : 'text-color-success'}`}>
                      {isNegativeChange ? '▼' : '▲'} {formatPercent(priceData.changePercent)}
                    </span>
                    <span className="text-xs text-text-tertiary">
                      LIVE - TODAY UPDATE {priceData.timestamp}
                    </span>
                  </div>
                </div>
              </div>

              {/* High/Low/Open Grid */}
              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-bg-tertiary">
                <div>
                  <span className="text-xs text-text-secondary uppercase font-semibold">HIGH</span>
                  <p className="text-xl font-semibold text-color-gold mt-1">{formatPrice(priceData.high)}</p>
                </div>
                <div>
                  <span className="text-xs text-text-secondary uppercase font-semibold">LOW</span>
                  <p className="text-xl font-semibold text-color-gold mt-1">{formatPrice(priceData.low)}</p>
                </div>
                <div>
                  <span className="text-xs text-text-secondary uppercase font-semibold">OPEN</span>
                  <p className="text-xl font-semibold text-color-gold mt-1">{formatPrice(priceData.open)}</p>
                </div>
              </div>

              {/* Chart - Placeholder */}
              <div className="pt-4 border-t border-bg-tertiary">
                <div className="h-32 bg-bg-tertiary border border-dashed border-text-tertiary flex items-center justify-center">
                  <div className="text-center">
                    <BarChart3 size={32} className="text-text-tertiary mx-auto mb-2" />
                    <p className="text-sm text-text-tertiary">[Chart Visualization]</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Boxes - Right Column */}
          <div className="space-y-4">
            {/* Active Signals */}
            <div className="bg-bg-secondary border-2 border-cyan-500 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-text-secondary uppercase">Active Signal</div>
                  <div className="text-3xl font-bold text-text-primary mt-1">5+</div>
                </div>
                <Users size={32} className="text-cyan-400" />
              </div>
            </div>

            {/* Win Rate */}
            <div className="bg-bg-secondary border-2 border-cyan-500 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-text-secondary uppercase">Win Rate</div>
                  <div className="text-3xl font-bold text-color-success mt-1">100%</div>
                </div>
                <Target size={32} className="text-cyan-400" />
              </div>
            </div>

            {/* Net Pips */}
            <div className="bg-bg-secondary border-2 border-cyan-500 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-text-secondary uppercase">Net Pips</div>
                  <div className="text-3xl font-bold text-color-success mt-1">+9.3K</div>
                </div>
                <TrendingUp size={32} className="text-cyan-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Economic Calendar */}
        <div className="bg-bg-secondary border-2 border-cyan-500">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Calendar size={20} className="text-cyan-400" />
                <h2 className="text-xl font-bold text-text-primary">ECONOMIC CALENDAR</h2>
              </div>
              <a href="/market" className="text-color-gold text-sm font-semibold hover:text-opacity-80">
                View All →
              </a>
            </div>
            <div className="text-xs text-text-secondary mb-4">High Impact Events</div>

            <div className="space-y-3">
              {calendar.map((event, idx) => (
                <div key={idx} className="flex items-center gap-4 pb-3 border-b border-bg-tertiary last:border-0">
                  <div className="px-3 py-1 bg-bg-tertiary border border-text-tertiary text-xs font-semibold min-w-fit">
                    {event.time}
                  </div>
                  <div className={`px-3 py-1 font-bold text-white text-xs min-w-fit ${
                    event.impact === 'HIGH' ? 'bg-color-danger' : 
                    event.impact === 'MEDIUM' ? 'bg-color-warning' : 
                    'bg-cyan-600'
                  }`}>
                    {event.impact}
                  </div>
                  <div className="text-xs text-text-secondary min-w-fit">{event.currency}</div>
                  <div className="flex-1 text-sm text-text-secondary">{event.event}</div>
                  <div className="flex gap-1 text-color-danger">
                    |||
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Latest Signal */}
        <div className="bg-bg-secondary border-2 border-cyan-500">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <MessageSquare size={20} className="text-cyan-400" />
                <h2 className="text-xl font-bold text-text-primary">LATEST SIGNAL</h2>
              </div>
              <a href="/signal" className="text-color-gold text-sm font-semibold hover:text-opacity-80">
                View All →
              </a>
            </div>

            {signals && signals.length > 0 ? (
              <div className="space-y-4">
                <div className="flex items-center gap-4 pb-4 border-b border-bg-tertiary">
                  <div className={`px-4 py-1 font-bold text-white text-sm ${
                    signals[0].type === 'BUY' ? 'bg-color-success' : 'bg-color-danger'
                  }`}>
                    {signals[0].type}
                  </div>
                  <div className="text-sm font-semibold text-text-primary">{signals[0].pair}</div>
                  <div className="text-sm text-text-secondary">•</div>
                  <div className="text-sm text-text-secondary">{signals[0].session}</div>
                  <div className="ml-auto">
                    <span className="text-xs font-semibold text-cyan-400">• LIVE</span>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-6">
                  <div>
                    <div className="text-xs text-text-secondary uppercase font-semibold mb-2">ENTRY</div>
                    <p className="text-lg font-semibold text-text-primary">{formatPrice(signals[0].entry)}</p>
                    <div className="h-8 bg-bg-tertiary mt-2 flex items-center justify-center">
                      <span className="text-xs text-text-tertiary">[Chart]</span>
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-text-secondary uppercase font-semibold mb-2">SL</div>
                    <p className="text-lg font-semibold text-color-danger">{formatPrice(signals[0].stopLoss)}</p>
                    <div className="h-8 bg-bg-tertiary mt-2 flex items-center justify-center">
                      <span className="text-xs text-text-tertiary">[Chart]</span>
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-text-secondary uppercase font-semibold mb-2">TP 1</div>
                    <p className="text-lg font-semibold text-color-success">{formatPrice(signals[0].tp1)}</p>
                    <div className="h-8 bg-bg-tertiary mt-2 flex items-center justify-center">
                      <span className="text-xs text-text-tertiary">[Chart]</span>
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-text-secondary uppercase font-semibold mb-2">TP 2</div>
                    <p className="text-lg font-semibold text-color-success">{formatPrice(signals[0].tp2)}</p>
                    <div className="h-8 bg-bg-tertiary mt-2 flex items-center justify-center">
                      <span className="text-xs text-text-tertiary">[Chart]</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-text-secondary">No signals available</p>
            )}
          </div>
        </div>

        {/* Announcements + Market Sentiment */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Announcements */}
          <div className="bg-bg-secondary border-2 border-cyan-500">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <MessageSquare size={20} className="text-cyan-400" />
                  <h2 className="text-xl font-bold text-text-primary">ANNOUNCEMENT</h2>
                </div>
                <a href="/community" className="text-color-gold text-sm font-semibold hover:text-opacity-80">
                  View All →
                </a>
              </div>

              <div className="space-y-4">
                {announcements.map((announcement, idx) => (
                  <div key={idx} className="pb-4 border-b border-bg-tertiary last:border-0">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-sm font-semibold text-text-primary">{announcement.title}</h3>
                      <span className="text-xs text-text-tertiary ml-2">{announcement.timestamp}</span>
                    </div>
                    <p className="text-xs text-text-secondary mb-3 line-clamp-2">{announcement.content}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-bg-tertiary rounded-full flex items-center justify-center text-xs">
                          👤
                        </div>
                        <span className="text-xs text-text-tertiary">{announcement.time}</span>
                      </div>
                      <span className="text-xs text-text-tertiary">{announcement.author}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Market Sentiment with Charts */}
          <div className="bg-bg-secondary border-2 border-cyan-500">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <BarChart3 size={20} className="text-cyan-400" />
                  <h2 className="text-xl font-bold text-text-primary">MARKET SENTIMENT</h2>
                </div>
              </div>

              <div className="space-y-6">
                {/* Bullish */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-text-secondary">Bullish</span>
                    <span className="text-sm font-bold text-color-success">68%</span>
                  </div>
                  <div className="h-16 bg-bg-tertiary">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={bullishData}>
                        <defs>
                          <linearGradient id="bullishGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <Area
                          type="monotone"
                          dataKey="value"
                          stroke="#22c55e"
                          strokeWidth={2}
                          fill="url(#bullishGradient)"
                          dot={false}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Bearish */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-text-secondary">Bearish</span>
                    <span className="text-sm font-bold text-color-danger">30%</span>
                  </div>
                  <div className="h-16 bg-bg-tertiary">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={bearishData}>
                        <defs>
                          <linearGradient id="bearishGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <Area
                          type="monotone"
                          dataKey="value"
                          stroke="#ef4444"
                          strokeWidth={2}
                          fill="url(#bearishGradient)"
                          dot={false}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="text-xs text-text-tertiary text-center pt-2 border-t border-bg-tertiary">
                  Last Update - 5 Min Ago
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
