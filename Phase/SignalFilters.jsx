// src/components/Signals/SignalFilters.jsx
import React, { useState } from 'react';
import { Search, ChevronDown } from 'lucide-react';

export default function SignalFilters({ onFilterChange }) {
  const [filters, setFilters] = useState({
    search: '',
    session: '',
    status: '',
    result: '',
    newest: '',
  });

  const handleChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    if (onFilterChange) onFilterChange(newFilters);
  };

  return (
    <div className="bg-bg-secondary border-2 border-cyan-500 p-6 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <div className="text-cyan-400">⊕</div>
        <h2 className="text-lg font-bold text-text-primary italic">FILTER SIGNALS</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
        {/* Search */}
        <div className="md:col-span-1 relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
          <input
            type="text"
            placeholder="Search XAUUSD..."
            value={filters.search}
            onChange={(e) => handleChange('search', e.target.value)}
            className="w-full bg-bg-tertiary border border-border-color pl-9 pr-3 py-2 text-sm text-text-primary placeholder-text-tertiary focus:outline-none focus:border-cyan-500"
          />
        </div>

        {/* Session */}
        <div className="relative">
          <select
            value={filters.session}
            onChange={(e) => handleChange('session', e.target.value)}
            className="w-full bg-bg-tertiary border border-border-color px-3 py-2 text-sm text-text-primary appearance-none focus:outline-none focus:border-cyan-500 cursor-pointer"
          >
            <option value="">Session</option>
            <option value="london">London Session</option>
            <option value="asia">Asia Session</option>
            <option value="newyork">New York Session</option>
          </select>
          <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary pointer-events-none" />
        </div>

        {/* Status */}
        <div className="relative">
          <select
            value={filters.status}
            onChange={(e) => handleChange('status', e.target.value)}
            className="w-full bg-bg-tertiary border border-border-color px-3 py-2 text-sm text-text-primary appearance-none focus:outline-none focus:border-cyan-500 cursor-pointer"
          >
            <option value="">Status</option>
            <option value="running">Running</option>
            <option value="closed">Closed</option>
            <option value="pending">Pending</option>
          </select>
          <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary pointer-events-none" />
        </div>

        {/* Result */}
        <div className="relative">
          <select
            value={filters.result}
            onChange={(e) => handleChange('result', e.target.value)}
            className="w-full bg-bg-tertiary border border-border-color px-3 py-2 text-sm text-text-primary appearance-none focus:outline-none focus:border-cyan-500 cursor-pointer"
          >
            <option value="">Result</option>
            <option value="win">Win</option>
            <option value="loss">Loss</option>
            <option value="breakeven">Breakeven</option>
          </select>
          <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary pointer-events-none" />
        </div>

        {/* Newest */}
        <div className="relative">
          <select
            value={filters.newest}
            onChange={(e) => handleChange('newest', e.target.value)}
            className="w-full bg-bg-tertiary border border-border-color px-3 py-2 text-sm text-text-primary appearance-none focus:outline-none focus:border-cyan-500 cursor-pointer"
          >
            <option value="">Newest</option>
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
          </select>
          <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary pointer-events-none" />
        </div>
      </div>
    </div>
  );
}
