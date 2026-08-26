import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, BarChart2, Bell, Calendar, Clock, Crosshair, DollarSign } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { dataService, queryKeys } from '../../services/dataService';
import { AsyncBoundary } from '../Common/AsyncStates';
import TradingViewChart from '../Market/TradingViewChart';
import './dashboard.css';

function StatCard({ icon: Icon, value, label }) {
  return (
    <div className="dash-stat">
      <Icon />
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}
function SectionTitle({ icon: Icon, title, subtitle, action = true, href }) {
  const navigate = useNavigate();
  return (
    <div className="dash-section-title">
      <div>
        <h2>
          <Icon />
          {title}
        </h2>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {action && (
        <button onClick={() => navigate(href)}>
          View All <ArrowRight />
        </button>
      )}
    </div>
  );
}
function CalendarRow({ item }) {
  const navigate = useNavigate();
  return (
    <button className="calendar-row" onClick={() => navigate(`/market?tab=calendar&event=${encodeURIComponent(item.id)}`)}>
      <span className="event-time">
        {new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Jakarta', hour: '2-digit', minute: '2-digit', hour12: true }).format(new Date(item.date))} WIB
      </span>
      <i />
      <b className={item.impact}>{item.impact.toUpperCase()}</b>
      <span>{item.currency}</span>
      <i />
      <span>{item.event}</span>
      <div className={`impact-bars ${item.impact}`}>
        <u />
        <u />
        <u />
      </div>
    </button>
  );
}
function Metric({ title, value, tone }) {
  return (
    <div className="dash-signal-metric">
      <em>{title}</em>
      <strong className={tone || ''}>{value ?? '-'}</strong>
      <span>$↗</span>
    </div>
  );
}
function Announcement({ item }) {
  return (
    <article className="announcement-card">
      <div>
        <h3>{item.title}</h3>
        <span>{new Date(item.publishedAt).toLocaleString()}</span>
      </div>
      <hr />
      <p>{item.body}</p>
      <small>
        <Clock /> {item.author}
      </small>
    </article>
  );
}
function SentimentChart({ type, percent, positive }) {
  const path = positive
    ? 'M0 36 L58 28 L116 39 L177 24 L220 38'
    : 'M0 22 L58 12 L116 43 L177 52 L220 57 L258 15';
  return (
    <div className="sentiment-item">
      <span>
        <i>{type}</i>
        <b>{percent}%</b>
      </span>
      <svg viewBox="0 0 258 72" preserveAspectRatio="none">
        <path d={path} fill="none" stroke={positive ? '#54ea53' : '#e00008'} strokeWidth="2.5" />
      </svg>
    </div>
  );
}
export default function Dashboard() {
  const signals = useQuery({
    queryKey: queryKeys.signals(),
    queryFn: () => dataService.signals.list(),
  });
  const calendar = useQuery({
    queryKey: queryKeys.calendar({ period: 'Today' }),
    queryFn: () => dataService.market.calendar({ period: 'Today' }),
  });
  const announcements = useQuery({
    queryKey: queryKeys.announcements,
    queryFn: () => dataService.announcements.list(),
  });
  const sentiment = useQuery({
    queryKey: ['sentiment', 'XAUUSD'],
    queryFn: () => dataService.market.sentiment('XAUUSD'),
  });
  const all = signals.data?.items || [];
  const active = all.filter((x) => x.status === 'running');
  const completed = all.filter((x) => x.status === 'completed');
  const wins = completed.filter((x) => x.result === 'win').length;
  const net = all.reduce((sum, x) => sum + (x.pips || 0), 0);
  const latest = all[0];
  const loading = [signals, calendar, announcements, sentiment].some((x) => x.isLoading);
  const error = [signals, calendar, announcements, sentiment].find((x) => x.error)?.error;
  return (
    <AsyncBoundary
      isLoading={loading}
      error={error}
      data={signals.data}
      onRetry={() => location.reload()}
    >
      <div className="dashboard-page">
        <section className="market-hero">
          <div className="market-card">
            <TradingViewChart symbol="ICMARKETS:XAUUSD" compact />
          </div>
          <div className="stats-column">
            <StatCard icon={Crosshair} value={active.length} label="ACTIVE SIGNAL" />
            <StatCard
              icon={BarChart2}
              value={completed.length ? `${Math.round((wins / completed.length) * 100)}%` : '-'}
              label="WIN RATE"
            />
            <StatCard icon={DollarSign} value={`${net >= 0 ? '+' : ''}${net}`} label="NET PIPS" />
          </div>
        </section>
        <section className="calendar-section">
          <SectionTitle
            icon={Calendar}
            title="ECONOMIC CALENDAR"
            href="/market?tab=calendar"
            subtitle="Upcoming Events"
          />
          <div className="calendar-list">
            {(calendar.data?.items || []).slice(0, 3).map((item) => (
              <CalendarRow item={item} key={item.id} />
            ))}
          </div>
        </section>
        {latest && (
          <section className="latest-section">
            <SectionTitle icon={Crosshair} title="LATEST SIGNAL" href="/signal" />
            <div className="latest-card">
              <div className="latest-meta">
                <b>{latest.direction}</b>
                <i />
                <strong>{latest.symbol}</strong>
                <i />
                <em>{latest.session} Session</em>
                <span>● {latest.status.toUpperCase()}</span>
              </div>
              <div className="latest-metrics">
                <Metric title="ENTRY" value={latest.entry} />
                <Metric title="SL" value={latest.stopLoss} tone="red" />
                <Metric title="TP 1" value={latest.targets?.[0]} tone="green" />
                <Metric title="TP 2" value={latest.targets?.[1]} tone="green" />
              </div>
            </div>
          </section>
        )}
        <section className="news-sentiment">
          <div className="announcements">
            <SectionTitle icon={Bell} title="ANNOUNCEMENT" href="/community?tab=info" />
            {(announcements.data?.items || []).slice(0, 2).map((item) => (
              <Announcement item={item} key={item.id} />
            ))}
          </div>
          <div className="sentiment">
            <SectionTitle icon={ArrowRight} title="MARKET SENTIMENT" action={false} />
            <div className="sentiment-card">
              <SentimentChart type="Bullish" percent={sentiment.data?.bullish} positive />
              <SentimentChart type="Bearish" percent={sentiment.data?.bearish} />
              <small>
                <Clock /> {sentiment.data?.source}
              </small>
            </div>
          </div>
        </section>
      </div>
    </AsyncBoundary>
  );
}
