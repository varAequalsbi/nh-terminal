// src/components/Dashboard/Dashboard.jsx
import React, { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, Users, Target } from 'lucide-react';
import { useMarketData, useFetch } from '../../hooks';
import { marketService, signalService } from '../../services';
import { formatPrice, formatPercent } from '../../utils/formatters';
import { Card, Badge } from '../Common';
import PriceChart from './PriceChart';
import Announcement from './Announcement';

export default function Dashboard() {
  // Mock price data - Replace with real API when ready
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

  // Mock signals - Replace with real API when ready
  const [signals, setSignals] = useState([
    {
      id: 1,
      type: 'SELL',
      pair: 'XAUUSD',
      session: 'London Session',
      status: 'LIVE',
      entry: 3428.50,
      stopLoss: 3428.50,
      tp1: 3428.50,
      tp2: 3428.50,
      pipsGain: 250,
    },
  ]);

  // Mock calendar - Replace with real API when ready
  const [calendar, setCalendar] = useState([
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

  // Mock sentiment - Replace with real API when ready
  const [sentiment, setSentiment] = useState({
    bullish: 68,
    bearish: 30,
    neutral: 2,
  });

  // Simulate price updates (optional - for real-time effect)
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
    }, 2000); // Update every 2 seconds

    return () => clearInterval(interval);
  }, []);

  const isNegativeChange = priceData.change < 0;

  return (
    <div className="container py-8 space-y-8">
      {/* Price Card Section */}
      <Card className="lg:col-span-2">
        <div className="flex flex-col lg:flex-row justify-between gap-6">
          {/* Left: Price Info */}
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wide">
              {priceData.pair}
            </h3>
            <div className="mt-2">
              <div className="text-5xl font-bold text-color-gold">
                {formatPrice(priceData.price)}
              </div>
              <div className="flex gap-2 mt-2">
                <Badge
                  variant={isNegativeChange ? 'danger' : 'success'}
                  size="sm"
                >
                  {isNegativeChange ? '▼' : '▲'} {formatPercent(priceData.changePercent)} ({formatPrice(priceData.change)})
                </Badge>
                <span className="text-xs text-text-tertiary">
                  LIVE - TODAY UPDATE {priceData.timestamp}
                </span>
              </div>
            </div>

            {/* High/Low/Open */}
            <div className="grid grid-cols-3 gap-4 mt-8">
              <div>
                <span className="text-xs text-text-secondary uppercase">HIGH</span>
                <p className="text-lg font-semibold text-text-primary">
                  {formatPrice(priceData.high)}
                </p>
              </div>
              <div>
                <span className="text-xs text-text-secondary uppercase">LOW</span>
                <p className="text-lg font-semibold text-text-primary">
                  {formatPrice(priceData.low)}
                </p>
              </div>
              <div>
                <span className="text-xs text-text-secondary uppercase">OPEN</span>
                <p className="text-lg font-semibold text-text-primary">
                  {formatPrice(priceData.open)}
                </p>
              </div>
            </div>

            {/* Price Chart */}
            <div className="mt-6">
              <PriceChart 
                data={priceData.history}
                isLoading={false}
                isNegative={isNegativeChange}
              />
            </div>
          </div>

          {/* Right: Stats Boxes */}
          <div className="space-y-4">
            {/* Active Signals */}
            <div className="bg-bg-tertiary rounded-lg p-4 text-center border border-border-color">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Users size={20} className="text-color-gold" />
              </div>
              <div className="text-2xl font-bold text-text-primary">5+</div>
              <p className="text-xs text-text-secondary uppercase">Active Signal</p>
            </div>

            {/* Win Rate */}
            <div className="bg-bg-tertiary rounded-lg p-4 text-center border border-border-color">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Target size={20} className="text-color-success" />
              </div>
              <div className="text-2xl font-bold text-text-primary">100%</div>
              <p className="text-xs text-text-secondary uppercase">Win Rate</p>
            </div>

            {/* Net Pips */}
            <div className="bg-bg-tertiary rounded-lg p-4 text-center border border-border-color">
              <div className="flex items-center justify-center gap-2 mb-2">
                <TrendingUp size={20} className="text-color-gold" />
              </div>
              <div className="text-2xl font-bold text-color-success">+9.3K</div>
              <p className="text-xs text-text-secondary uppercase">Net Pips</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Economic Calendar */}
      <Card>
        <Card.Header 
          title="📅 ECONOMIC CALENDAR" 
          subtitle="High Impact Events"
          action={
            <a href="/market" className="text-color-gold text-xs font-semibold hover:text-opacity-80">
              View All →
            </a>
          }
        />
        <Card.Body className="space-y-3">
          {calendar.map((event, idx) => (
            <div key={idx} className="flex items-center justify-between py-2 border-b border-border-color last:border-0">
              <div className="flex items-center gap-3 flex-1">
                <div className="px-3 py-1 rounded-full border border-border-color text-xs font-semibold min-w-fit">
                  {event.time}
                </div>
                <Badge variant={event.impact === 'HIGH' ? 'danger' : event.impact === 'MEDIUM' ? 'warning' : 'info'}>
                  {event.impact}
                </Badge>
                <span className="text-sm text-text-secondary min-w-fit">{event.currency}</span>
                <span className="text-sm text-text-secondary">{event.event}</span>
              </div>
              <span className="text-text-tertiary ml-4">→</span>
            </div>
          ))}
        </Card.Body>
      </Card>

      {/* Latest Signals */}
      <Card>
        <Card.Header 
          title="📊 LATEST SIGNAL"
          action={
            <a href="/signal" className="text-color-gold text-xs font-semibold hover:text-opacity-80">
              View All →
            </a>
          }
        />
        <Card.Body>
          {signals && signals.length > 0 ? (
            <div className="bg-bg-tertiary rounded-lg p-4 border border-border-color">
              <div className="flex justify-between items-start mb-4 flex-wrap gap-2">
                <div className="flex gap-2 flex-wrap">
                  <Badge variant={signals[0].type === 'BUY' ? 'success' : 'danger'}>
                    {signals[0].type}
                  </Badge>
                  <span className="text-sm text-text-secondary">{signals[0].pair}</span>
                  <span className="text-sm text-text-secondary">•</span>
                  <span className="text-sm text-text-secondary">{signals[0].session}</span>
                  <Badge variant="default" size="sm">
                    {signals[0].status}
                  </Badge>
                </div>
                <Badge variant={signals[0].pipsGain > 0 ? 'success' : 'danger'} size="sm">
                  +{signals[0].pipsGain} Pips
                </Badge>
              </div>

              <div className="grid grid-cols-4 gap-4">
                <div>
                  <span className="text-xs text-text-tertiary">ENTRY</span>
                  <p className="font-semibold text-text-primary">{formatPrice(signals[0].entry)}</p>
                </div>
                <div>
                  <span className="text-xs text-text-tertiary">SL</span>
                  <p className="font-semibold text-color-danger">{formatPrice(signals[0].stopLoss)}</p>
                </div>
                <div>
                  <span className="text-xs text-text-tertiary">TP 1</span>
                  <p className="font-semibold text-color-success">{formatPrice(signals[0].tp1)}</p>
                </div>
                <div>
                  <span className="text-xs text-text-tertiary">TP 2</span>
                  <p className="font-semibold text-color-success">{formatPrice(signals[0].tp2)}</p>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-text-secondary">No signals available</p>
          )}
        </Card.Body>
      </Card>

      {/* Announcements + Market Sentiment */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Announcement />

        {/* Market Sentiment */}
        {sentiment && (
          <Card>
            <Card.Header title="📈 MARKET SENTIMENT" />
            <Card.Body className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-text-secondary">Bullish</span>
                  <span className="font-semibold text-color-success">{sentiment.bullish}%</span>
                </div>
                <div className="w-full bg-bg-tertiary rounded-full h-2">
                  <div
                    className="bg-color-success h-2 rounded-full transition-all"
                    style={{ width: `${sentiment.bullish}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-text-secondary">Bearish</span>
                  <span className="font-semibold text-color-danger">{sentiment.bearish}%</span>
                </div>
                <div className="w-full bg-bg-tertiary rounded-full h-2">
                  <div
                    className="bg-color-danger h-2 rounded-full transition-all"
                    style={{ width: `${sentiment.bearish}%` }}
                  />
                </div>
              </div>

              <div className="text-xs text-text-tertiary pt-2">
                Last Update - 5 Min Ago
              </div>
            </Card.Body>
          </Card>
        )}
      </div>
    </div>
  );
}
