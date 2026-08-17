// src/components/Signals/SignalsPage.jsx
import React, { useState, useMemo } from 'react';
import { Plus, Minus } from 'lucide-react';
import SignalFilters from './SignalFilters';
import SignalCard from './SignalCard';
import SignalForm from './SignalForm';

// Mock signals data - Replace with API call when ready
const MOCK_SIGNALS = [
  {
    id: 1,
    type: 'SELL',
    pair: 'XAU/USD',
    session: 'London Session',
    status: 'LIVE',
    entry: '3428.50',
    stopLoss: '3428.50',
    tp1: '3428.50',
    tp2: '3428.50',
    pipsGain: 200,
    published: '09:45 WIB - 5 Menit Lalu',
    technicalAnalysis: 'Resistance H4 Kuat, Divergence Bearish H1',
  },
  {
    id: 2,
    type: 'BUY',
    pair: 'XAU/USD',
    session: 'London Session',
    status: 'Running',
    entry: '3428.50',
    stopLoss: '3428.50',
    tp1: '3428.50',
    tp2: '3428.50',
    pipsGain: 250,
    published: '09:45 WIB - 5 Menit Lalu',
    technicalAnalysis: 'Resistance H4 Kuat, Divergence Bearish H1',
  },
  {
    id: 3,
    type: 'SELL',
    pair: 'XAU/USD',
    session: 'London Session',
    status: 'Running',
    entry: '3428.50',
    stopLoss: '3428.50',
    tp1: '3428.50',
    tp2: '3428.50',
    pipsGain: -90,
    published: '09:45 WIB - 5 Menit Lalu',
    technicalAnalysis: 'Resistance H4 Kuat, Divergence Bearish H1',
  },
  {
    id: 4,
    type: 'SELL',
    pair: 'XAU/USD',
    session: 'London Session',
    status: 'Running',
    entry: '3428.50',
    stopLoss: '3428.50',
    tp1: '3428.50',
    tp2: '3428.50',
    pipsGain: 200,
    published: '09:45 WIB - 5 Menit Lalu',
    technicalAnalysis: 'Resistance H4 Kuat, Divergence Bearish H1',
  },
  {
    id: 5,
    type: 'BUY',
    pair: 'XAU/USD',
    session: 'London Session',
    status: 'Running',
    entry: '3428.50',
    stopLoss: '3428.50',
    tp1: '3428.50',
    tp2: '3428.50',
    pipsGain: 250,
    published: '09:45 WIB - 5 Menit Lalu',
    technicalAnalysis: 'Resistance H4 Kuat, Divergence Bearish H1',
  },
  {
    id: 6,
    type: 'SELL',
    pair: 'XAU/USD',
    session: 'London Session',
    status: 'LIVE',
    entry: '3428.50',
    stopLoss: '3428.50',
    tp1: '3428.50',
    tp2: '3428.50',
    pipsGain: 200,
    published: '09:45 WIB - 5 Menit Lalu',
    technicalAnalysis: 'Resistance H4 Kuat, Divergence Bearish H1',
  },
  {
    id: 7,
    type: 'SELL',
    pair: 'XAU/USD',
    session: 'London Session',
    status: 'Running',
    entry: '3428.50',
    stopLoss: '3428.50',
    tp1: '3428.50',
    tp2: '3428.50',
    pipsGain: -90,
    published: '09:45 WIB - 5 Menit Lalu',
    technicalAnalysis: 'Resistance H4 Kuat, Divergence Bearish H1',
  },
  {
    id: 8,
    type: 'SELL',
    pair: 'XAU/USD',
    session: 'London Session',
    status: 'Running',
    entry: '3428.50',
    stopLoss: '3428.50',
    tp1: '3428.50',
    tp2: '3428.50',
    pipsGain: 200,
    published: '09:45 WIB - 5 Menit Lalu',
    technicalAnalysis: 'Resistance H4 Kuat, Divergence Bearish H1',
  },
  {
    id: 9,
    type: 'SELL',
    pair: 'XAU/USD',
    session: 'London Session',
    status: 'Running',
    entry: '3428.50',
    stopLoss: '3428.50',
    tp1: '3428.50',
    tp2: '3428.50',
    pipsGain: -90,
    published: '09:45 WIB - 5 Menit Lalu',
    technicalAnalysis: 'Resistance H4 Kuat, Divergence Bearish H1',
  },
  {
    id: 10,
    type: 'SELL',
    pair: 'XAU/USD',
    session: 'London Session',
    status: 'Running',
    entry: '3428.50',
    stopLoss: '3428.50',
    tp1: '3428.50',
    tp2: '3428.50',
    pipsGain: 200,
    published: '09:45 WIB - 5 Menit Lalu',
    technicalAnalysis: 'Resistance H4 Kuat, Divergence Bearish H1',
  },
];

export default function SignalsPage() {
  const [activeTab, setActiveTab] = useState('TIM EXPERT'); // 'TIM EXPERT' or 'AI REAL-TIME'
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [signals, setSignals] = useState(MOCK_SIGNALS);
  const [filters, setFilters] = useState({
    search: '',
    session: '',
    status: '',
    result: '',
    newest: '',
  });

  // Filter signals based on active filters
  const filteredSignals = useMemo(() => {
    return signals.filter(signal => {
      if (filters.search && !signal.pair.toLowerCase().includes(filters.search.toLowerCase())) {
        return false;
      }
      // Additional filter logic can be added here
      return true;
    });
  }, [signals, filters]);

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
  };

  const handleCreateSignal = (newSignal) => {
    const signal = {
      id: signals.length + 1,
      pair: 'XAU/USD',
      session: 'London Session',
      status: 'LIVE',
      pipsGain: 0,
      published: 'Just now',
      technicalAnalysis: newSignal.notes || 'No analysis provided',
      ...newSignal,
    };
    setSignals(prev => [signal, ...prev]);
    setShowCreateForm(false);
  };

  return (
    <div className="bg-bg-primary min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="bg-bg-secondary border-2 border-cyan-500 p-6 mb-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-text-primary italic">SIGNALS</h1>
              <p className="text-color-gold text-sm mt-1">Live Trading Signals</p>
            </div>

            <div className="flex gap-3">
              <button className="px-4 py-2 bg-bg-tertiary border border-border-color text-text-primary text-sm font-semibold hover:border-cyan-500 transition-colors">
                View History
              </button>
              <button
                onClick={() => setShowCreateForm(!showCreateForm)}
                className="px-4 py-2 bg-bg-tertiary border border-color-gold text-color-gold text-sm font-semibold hover:bg-color-gold hover:bg-opacity-10 transition-colors flex items-center gap-2"
              >
                {showCreateForm ? (
                  <>
                    <Minus size={16} />
                    Tutup
                  </>
                ) : (
                  <>
                    <Plus size={16} />
                    Tambah Signal (Admin)
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Tabs Row */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mt-6">
            <div className="flex gap-3">
              <button
                onClick={() => setActiveTab('TIM EXPERT')}
                className={`px-6 py-3 border-2 text-sm font-bold flex items-center gap-2 transition-colors ${
                  activeTab === 'TIM EXPERT'
                    ? 'border-color-gold text-color-gold bg-color-gold bg-opacity-10'
                    : 'border-border-color text-text-secondary'
                }`}
              >
                <span>👑</span>
                TIM EXPERT
              </button>
              <button
                onClick={() => setActiveTab('AI REAL-TIME')}
                className={`px-6 py-3 border-2 text-sm font-bold flex items-center gap-2 transition-colors ${
                  activeTab === 'AI REAL-TIME'
                    ? 'border-color-gold text-color-gold bg-color-gold bg-opacity-10'
                    : 'border-border-color text-text-secondary'
                }`}
              >
                <span>◐</span>
                AI REAL-TIME
              </button>
            </div>

            <div className="px-4 py-2 bg-bg-tertiary border border-border-color text-text-primary text-sm font-semibold">
              {filteredSignals.length} Signals
            </div>
          </div>
        </div>

        {/* Create Signal Form (Conditional) */}
        {showCreateForm && (
          <SignalForm
            onClose={() => setShowCreateForm(false)}
            onSubmit={handleCreateSignal}
          />
        )}

        {/* Filters */}
        <SignalFilters onFilterChange={handleFilterChange} />

        {/* Signals Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredSignals.map((signal) => (
            <SignalCard key={signal.id} signal={signal} />
          ))}
        </div>

        {/* Empty State */}
        {filteredSignals.length === 0 && (
          <div className="bg-bg-secondary border-2 border-cyan-500 p-12 text-center">
            <p className="text-text-secondary">No signals found matching your filters.</p>
          </div>
        )}
      </div>
    </div>
  );
}
