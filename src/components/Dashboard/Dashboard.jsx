import React from 'react';
import { ArrowRight, BarChart2, Bell, Calendar, Clock, Crosshair, DollarSign } from 'lucide-react';
import './dashboard.css';

function PriceGraph() {
  return <svg className="price-graph" viewBox="0 0 720 220" preserveAspectRatio="none" aria-label="XAU/USD intraday price chart">
    <defs><linearGradient id="priceFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#df0007" stopOpacity=".23"/><stop offset="1" stopColor="#df0007" stopOpacity=".08"/></linearGradient></defs>
    <path d="M0 28 L96 127 L116 103 L160 155 L173 22 L209 58 L219 104 L257 150 L311 181 L335 122 L354 116 L371 64 L401 54 L432 10 L447 29 L463 116 L482 137 L495 121 L503 176 L520 149 L554 205 L579 171 L603 159 L630 91 L657 55 L672 18 L691 120 L704 134 L713 205 L720 220 L0 220Z" fill="url(#priceFill)"/>
    <path d="M0 28 L96 127 L116 103 L160 155 L173 22 L209 58 L219 104 L257 150 L311 181 L335 122 L354 116 L371 64 L401 54 L432 10 L447 29 L463 116 L482 137 L495 121 L503 176 L520 149 L554 205 L579 171 L603 159 L630 91 L657 55 L672 18 L691 120 L704 134 L713 205" fill="none" stroke="#e1060c" strokeWidth="4"/>
  </svg>;
}

function StatCard({ icon: Icon, value, label }) {
  return <div className="dash-stat"><Icon/><strong>{value}</strong><span>{label}</span></div>;
}

function SectionTitle({ icon: Icon, title, subtitle, action = true }) {
  return <div className="dash-section-title"><div><h2><Icon/>{title}</h2>{subtitle&&<p>{subtitle}</p>}</div>{action&&<button>View All <ArrowRight/></button>}</div>;
}

const events=[['15:30','HIGH','US','Non-Farm Payrolls','high'],['15:30','MEDIUM','US','Unemployment Rate','medium'],['15:30','LOW','US','Unemployment Rate','low']];
function CalendarRow({ item }) { const [time,impact,country,event,tone]=item; return <div className="calendar-row"><span className="event-time">{time}</span><i/><b className={tone}>{impact}</b><span>{country}</span><i/><span>{event}</span><div className={`impact-bars ${tone}`}><u/><u/><u/></div></div> }

function SignalMetric({ title, value, tone, chart }) { return <div className="dash-signal-metric"><em>{title}</em><strong className={tone||''}>{value}</strong><span>{chart?'▥':'$↗'}</span></div> }

function Announcement() { return <article className="announcement-card"><div><h3>High Impact News Today</h3><span>Hari Ini 15:30 WIB</span></div><hr/><p>Volatilitas Estimasi 80–150 Pips. Rekomen Close Posisi<br/>Atau Perlebar SL Minimal 50 Pips.</p><small><Clock/> 2 Jam Lalu</small></article> }

function SentimentChart({ type, percent, positive }) { const path=positive?'M0 36 L58 28 L116 39 L177 24 L220 38':'M0 22 L58 12 L116 43 L177 52 L220 57 L258 15'; return <div className="sentiment-item"><span><i>{type}</i><b>{percent}</b></span><svg viewBox="0 0 258 72" preserveAspectRatio="none"><defs><linearGradient id={positive?'sentGreen':'sentRed'} x1="0" y1="0" x2="0" y2="1"><stop stopColor={positive?'#46df4e':'#d90008'} stopOpacity=".25"/><stop offset="1" stopColor={positive?'#46df4e':'#d90008'} stopOpacity=".06"/></linearGradient></defs><path d={`${path} L258 72 L0 72Z`} fill={`url(#${positive?'sentGreen':'sentRed'})`}/><path d={path} fill="none" stroke={positive?'#54ea53':'#e00008'} strokeWidth="2.5"/></svg></div> }

export default function Dashboard(){return <div className="dashboard-page">
  <section className="market-hero">
    <div className="market-card"><div className="market-copy"><div><span>XAU/USD</span><div className="current-price">3427.20 <b>▼ -2.30</b></div><small>LIVE - TODAY-UPDATE <i>11:38 WIB</i></small></div><div className="ohlc"><span><i>HIGH</i> <b>3434.50</b></span><span><i>LOW</i> <b>3420.30</b></span><span><i>OPEN</i> <b>3428.20</b></span></div></div><PriceGraph/></div>
    <div className="stats-column"><StatCard icon={Crosshair} value="5+" label="ACTIVE SIGNAL"/><StatCard icon={BarChart2} value="100%" label="WIN RATE"/><StatCard icon={DollarSign} value="+9.3K" label="NET PIPS"/></div>
  </section>

  <section className="calendar-section"><SectionTitle icon={Calendar} title="ECONOMIC CALENDAR" subtitle="High Impact Events"/><div className="calendar-list">{events.map((x,i)=><CalendarRow item={x} key={i}/>)}</div></section>

  <section className="latest-section"><SectionTitle icon={Crosshair} title="LATEST SIGNAL"/><div className="latest-card"><div className="latest-meta"><b>SELL</b><i/><strong>XAUUSD</strong><i/><em>London Session - 09:45 WIB</em><span>● LIVE</span></div><div className="latest-metrics"><SignalMetric title="ENTRY" value="3428.50" chart/><SignalMetric title="SL" value="3428.50" tone="red"/><SignalMetric title="TP 1" value="3428.50" tone="green"/><SignalMetric title="TP 2" value="3428.50" tone="green"/></div></div></section>

  <section className="news-sentiment"><div className="announcements"><SectionTitle icon={Bell} title="ANNOUNCEMENT"/><Announcement/><Announcement/></div><div className="sentiment"><SectionTitle icon={ArrowRight} title="MARKET SENTIMENT" action={false}/><div className="sentiment-card"><SentimentChart type="Bullish" percent="68%" positive/><SentimentChart type="Bearish" percent="30%"/><small><Clock/> Last Update - 5 Min Ago</small></div></div></section>
 </div>}
