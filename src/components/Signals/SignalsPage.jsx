import React, { useMemo, useState } from 'react';
import {
  ChevronDown, PlusCircle, Cpu, ImageDown, Lightbulb,
  Search, Crosshair, X,
} from 'lucide-react';
import './signals.css';

const signalSeed = [
  ['SELL', 200, true], ['BUY', 250, false], ['SELL', -90, false],
  ['SELL', 200, false], ['BUY', 250, false], ['SELL', 200, true],
  ['SELL', -90, false], ['SELL', 200, false], ['SELL', -90, false],
  ['SELL', 200, false],
];

function MiniChart({ positive }) {
  const path = positive
    ? 'M0 8 L31 48 L45 35 L61 67 L72 19 L91 79 L111 27 L122 70 L132 51 L140 95'
    : 'M0 8 L31 48 L45 35 L61 67 L72 19 L91 79 L111 27 L122 70 L132 51 L140 95';
  return (
    <svg viewBox="0 0 140 104" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id={positive ? 'greenFill' : 'redFill'} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={positive ? '#35d94a' : '#e00008'} stopOpacity=".28" />
          <stop offset="1" stopColor={positive ? '#35d94a' : '#e00008'} stopOpacity=".06" />
        </linearGradient>
      </defs>
      <path d={`${path} L140 104 L0 104 Z`} fill={`url(#${positive ? 'greenFill' : 'redFill'})`} />
      <path d={path} fill="none" stroke={positive ? '#50f15b' : '#ef0008'} strokeWidth="2.2" />
    </svg>
  );
}

function Metric({ label, value, tone = 'white' }) {
  return (
    <div className="signal-metric">
      <span>{label}</span>
      <strong className={tone}>{value}</strong>
      <span className="metric-watermark">$↗</span>
    </div>
  );
}

function SignalCard({ item }) {
  const [type, pips, live] = item;
  const positive = type === 'BUY';
  return (
    <article className="signal-card">
      <div className="signal-card-top">
        <div className="signal-meta">
          <span className={`trade-pill ${positive ? 'buy' : 'sell'}`}>{type}</span>
          <i /> <span>XAU/USD</span> <i /> <span>London Session</span>
          {live && <><b className="live-dot" /><em>LIVE</em></>}
        </div>
        <span className={`pips ${pips < 0 ? 'loss' : ''}`}>{pips > 0 ? '+' : ''}{pips} Pips</span>
      </div>
      <div className="published"><span>Published - 09:45 WIB - 5 Menit Lalu</span><small>Running</small></div>
      <div className="card-data">
        <div className="metrics-grid">
          <Metric label="ENTRY" value="3428.50" />
          <Metric label="SL" value="3428.50" tone="red" />
          <Metric label="TP 1" value="3428.50" tone="green" />
          <Metric label="TP 2" value="3428.50" tone="green" />
        </div>
        <div className="mini-chart"><MiniChart positive={positive} /></div>
      </div>
      <div className="signal-note"><Lightbulb size={17} /> <span>Resistance H4 Kuat, Divergence Bearish H1</span></div>
    </article>
  );
}

function SignalForm() {
  return (
    <section className="new-signal-panel">
      <h2>SIGNAL BARU</h2>
      <div className="signal-form-grid">
        <div className="signal-type">
          <label>SIGNAL TYPE</label>
          <button className="selected-buy">BUY</button>
          <button>SELL</button>
        </div>
        <div className="form-divider" />
        <div className="field-column">
          <label>Entry</label><input aria-label="Entry" />
          <label>Stop Loss</label><input aria-label="Stop Loss" />
          <label>TP 1</label><input aria-label="TP 1" />
          <label>TP 2 (Opsional)</label><input aria-label="TP 2" />
        </div>
        <div className="form-divider" />
        <div className="field-column publish-column">
          <label>Entry</label><input aria-label="Second entry" />
          <label>Catatan / Analisa</label><input aria-label="Catatan" />
          <label>Upload Chart</label>
          <div className="upload-row">
            <button className="upload-button" aria-label="Upload chart"><ImageDown size={54} /></button>
            <button className="publish-button">PUBLISH SIGNAL</button>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function SignalsPage() {
  const [mode, setMode] = useState('ai');
  const cards = useMemo(() => signalSeed.slice(0, mode === 'expert' ? 6 : 10), [mode]);

  return (
    <div className="signals-page">
      <section className="signals-heading">
        <div><h1>SIGNALS</h1><p>Live Trading Signals</p></div>
        <div className="heading-actions">
          <button>View History</button>
          {mode === 'ai'
            ? <button className="admin-button"><PlusCircle size={17} /> Tambah Signal (Admin)</button>
            : <button className="admin-button"><X size={17} /> Tutup</button>}
        </div>
      </section>

      {mode === 'expert' && <SignalForm />}

      <section className="mode-bar">
        <div className="mode-buttons">
          <button className={mode === 'expert' ? 'active-mode' : ''} onClick={() => setMode('expert')}><Crosshair /> TIM EXPERT</button>
          <button className={mode === 'ai' ? 'active-mode neutral' : ''} onClick={() => setMode('ai')}><Cpu /> AI REAL-TIME</button>
        </div>
        <span className="signal-count">128 Signals</span>
      </section>

      <section className="filters-section">
        <h2><Search /> FILTER SIGNALS</h2>
        <div className="filters-bar">
          <label className="search-field"><Search /><input placeholder="Search XAUUSD..." /></label>
          {['Session', 'Status', 'Result', 'Newest'].map((filter) => (
            <button key={filter}>{filter}<ChevronDown size={18} fill="currentColor" /></button>
          ))}
        </div>
      </section>

      <section className="signals-grid">
        {cards.map((item, index) => <SignalCard item={item} key={index} />)}
      </section>
    </div>
  );
}
