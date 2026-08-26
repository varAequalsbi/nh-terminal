import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { Activity, BarChart2, Calendar, ChevronDown, Pencil, Search } from 'lucide-react';
import './market.css';
import { dataService, queryKeys } from '../../services/dataService';
import { AsyncBoundary } from '../Common/AsyncStates';
import TradingViewChart from './TradingViewChart';

const tabs = [
  ['chart', 'Chart', BarChart2],
  ['outlook', 'Outlook', Activity],
  ['research', 'Research', Search],
  ['calendar', 'Kalender', Calendar],
];

function MarketHeader({ active, setActive }) {
  return (
    <section className="market-header">
      <div>
        <h1>MARKET</h1>
        <p>Market Overview</p>
      </div>
      <nav>
        {tabs.map(([id, label, Icon]) => (
          <button key={id} className={active === id ? 'active' : ''} onClick={() => setActive(id)}>
            <Icon />
            {label}
          </button>
        ))}
      </nav>
    </section>
  );
}

function ChartView() {
  const [symbol, setSymbol] = useState('XAUUSD');
  const brokerSymbol = `ICMARKETS:${symbol}`;
  return (
    <section className="chart-view market-panel">
      <div className="symbol-tabs">
        {['XAUUSD', 'EURUSD', 'GBPUSD', 'USDJPY', 'BTCUSD'].map((x) => (
          <button onClick={() => setSymbol(x)} className={symbol === x ? 'active' : ''} key={x}>
            {x}
          </button>
        ))}
      </div>
      <div className="chart-tools-hint" role="note">
        <Pencil aria-hidden="true" />
        Use the left toolbar to draw trend lines, levels, shapes, and annotations.
      </div>
      <TradingViewChart symbol={brokerSymbol} drawingTools />
      <a
        className="tradingview-attribution"
        href={`https://www.tradingview.com/symbols/${symbol}/?exchange=ICMARKETS`}
        target="_blank"
        rel="noreferrer"
      >
        {brokerSymbol} chart by TradingView
      </a>
    </section>
  );
}

function OutlookView() {
  const query = useQuery({ queryKey: ['market-outlook'], queryFn: dataService.market.outlook });
  const x = query.data;
  return (
    <AsyncBoundary isLoading={query.isLoading} error={query.error} data={x} onRetry={query.refetch}>
      {x && (
        <section className="outlook-view">
          <div>
            <h2>
              <Calendar /> DAILY OUTLOOK
            </h2>
            <article className="outlook-card">
              <b>{x.author} · Daily Outlook</b>
              <h3>{x.title}</h3>
              <p>{x.body}</p>
              <div className="levels">
                <div>
                  <strong>Support</strong>
                  {x.support.map((v) => (
                    <span key={v}>{v.toLocaleString()}</span>
                  ))}
                </div>
                <i />
                <div>
                  <strong>Resistance</strong>
                  {x.resistance.map((v) => (
                    <span key={v}>{v.toLocaleString()}</span>
                  ))}
                </div>
              </div>
            </article>
          </div>
          <div>
            <h2>
              <Calendar /> MARKET SENTIMENT
            </h2>
            <div className="sentiment-list">
              {x.sentiment.map((item) => (
                <div className="sentiment-row" key={item.symbol}>
                  <b>{item.symbol}</b>
                  <span>
                    <i
                      className={
                        item.label === 'Bearish'
                          ? 'red'
                          : item.label === 'Bullish'
                            ? 'green'
                            : 'yellow'
                      }
                      style={{ width: `${item.value}%` }}
                    />
                  </span>
                  <strong>
                    {item.label} {item.value}%
                  </strong>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </AsyncBoundary>
  );
}

function ResearchView() {
  const query = useQuery({ queryKey: ['market-research'], queryFn: dataService.market.research });
  const x = query.data;
  const [now, setNow] = useState(() => new Date());
  useEffect(() => { const id = setInterval(() => setNow(new Date()), 60_000); return () => clearInterval(id); }, []);
  const wib = new Date(now.getTime() + 7 * 60 * 60 * 1000);
  const minute = wib.getUTCHours() * 60 + wib.getUTCMinutes();
  const definitions = [{ name: 'NEW YORK', start: 19 * 60, end: 4 * 60 }, { name: 'LONDON', start: 14 * 60, end: 23 * 60 }, { name: 'ASIA', start: 7 * 60, end: 16 * 60 }];
  const isOpen = (session) => session.start < session.end ? minute >= session.start && minute < session.end : minute >= session.start || minute < session.end;
  const current = definitions.find(isOpen);
  const next = definitions.map((session) => ({ ...session, wait: (session.start - minute + 1440) % 1440 || 1440 })).sort((a, b) => a.wait - b.wait)[0];
  const countdown = `${String(Math.floor(next.wait / 60)).padStart(2, '0')}h ${String(next.wait % 60).padStart(2, '0')}m`;
  return (
    <AsyncBoundary isLoading={query.isLoading} error={query.error} data={x} onRetry={query.refetch}>
      {x && (
        <section className="research-view">
          <div className="session-cards">
            {x.sessions.map((item) => (
              <article key={item.name}>
                <div>
                  <b>{item.name}</b>
                  <i />
                  <strong className={definitions.find((session) => session.name === item.name && isOpen(session)) ? 'open' : 'upcoming'}>
                    {definitions.find((session) => session.name === item.name && isOpen(session)) ? 'Open' : 'Closed'}
                  </strong>
                  <span>{item.hours}</span>
                </div>
                <hr />
                <h4>Market Overview</h4>
                <p>{item.summary}</p>
              </article>
            ))}
          </div>
          <h2>
            <Calendar /> KEY MARKET DRIVERS
          </h2>
          <div className="driver-tags">
            {x.drivers.map((item) => (
              <button key={item}>
                <BarChart2 />
                {item}
              </button>
            ))}
          </div>
          <h2>
            <Calendar /> SESSION OVERVIEW
          </h2>
          <div className="session-overview">
            <div>
              <h3>Current Session</h3>
              <span>
                {current?.name || 'MARKET BREAK'} <i /> <b>{current ? 'Open' : 'Closed'}</b>
              </span>
            </div>
            <u />
            <div>
              <h3>Next Session</h3>
              <span>
                {next.name} <i /> <b>in {countdown}</b>
              </span>
            </div>
            <u />
            <div className="activity">
              <h3>Market Activity</h3>
              <span>{x.activity}</span>
            </div>
          </div>
        </section>
      )}
    </AsyncBoundary>
  );
}

const countryFlags = { 'United States': '🇺🇸', Germany: '🇩🇪', Japan: '🇯🇵', Australia: '🇦🇺' };
const wibTime = (date) => new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Jakarta', hour: '2-digit', minute: '2-digit', hour12: true }).format(new Date(date));
function Highlight({ text, query }) {
  if (!query) return text;
  const index = text.toLowerCase().indexOf(query.toLowerCase());
  if (index < 0) return text;
  return <>{text.slice(0, index)}<mark>{text.slice(index, index + query.length)}</mark>{text.slice(index + query.length)}</>;
}
function EventRow({ item, expanded, onToggle, search }) {
  return (
    <article className={`market-event ${expanded ? 'expanded' : ''}`} id={`event-${item.id}`}>
      <button className="event-summary" onClick={onToggle} aria-expanded={expanded}>
        <span className="cal-time">{wibTime(item.date)} WIB</span><i />
        <span className="country-flag" role="img" aria-label={item.country}>{countryFlags[item.country] || '🌐'}</span><i />
        <b className={item.impact}>{item.impact.toUpperCase()}</b><i />
        <strong><Highlight text={item.event} query={search} /></strong><i />
        <span>Prev {item.previous || '-'}</span><i />
        <span>Forecast {item.forecast || '-'}</span>
        <div className={`event-bars ${item.impact}`}><u /><u /><u /></div>
        <ChevronDown className="event-chevron" />
      </button>
      {expanded && <div className="event-details"><div><span>Actual</span><b>{item.actual || 'Not released'}</b></div><div><span>Previous</span><b>{item.previous || '-'}</b></div><div><span>Forecast</span><b>{item.forecast || '-'}</b></div><div><span>Source</span><b>{item.source || 'Unavailable'}</b></div><div><span>Revision</span><b>{item.revision || 'None'}</b></div><div><span>Release time</span><b>{new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Jakarta', dateStyle: 'medium', timeStyle: 'short' }).format(new Date(item.date))} WIB</b></div></div>}
    </article>
  );
}
function CalendarView() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [period, setPeriod] = useState('Today');
  const [impact, setImpact] = useState('All');
  const [country, setCountry] = useState('All');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState(searchParams.get('event') || '');
  useEffect(() => { const id = setTimeout(() => setSearch(searchInput.trim()), 350); return () => clearTimeout(id); }, [searchInput]);
  const params = {
    impact: impact === 'All' ? undefined : impact.toLowerCase(),
    country: country === 'All' ? undefined : country,
    search: search || undefined,
    period,
  };
  const query = useQuery({
    queryKey: queryKeys.calendar(params),
    queryFn: () => dataService.market.calendar(params),
  });
  const items = query.data?.items || [];
  return (
    <section className="calendar-view">
      <div className="calendar-filters market-panel">
        <div>
          {['Today', 'Tomorrow', 'This Week'].map((x) => (
            <button className={period === x ? 'active' : ''} onClick={() => setPeriod(x)} key={x}>
              {x}
            </button>
          ))}
          <span />
          {['All', 'High', 'Medium', 'Low'].map((x) => (
            <button
              className={`${impact === x ? 'active ' : ''}compact`}
              onClick={() => setImpact(x)}
              key={x}
            >
              {x}
            </button>
          ))}
        </div>
        <hr />
        <div>
          <label>
            <Search />
            <input
              placeholder="Search Event..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </label>
          <span />
          <select aria-label="Filter by country" value={country} onChange={(e) => setCountry(e.target.value)}><option>All</option>{(query.data?.countries || []).map((item) => <option key={item}>{item}</option>)}</select>
          <select aria-label="Filter by impact" value={impact} onChange={(e) => setImpact(e.target.value)}>{['All', 'High', 'Medium', 'Low'].map((item) => <option key={item}>{item}</option>)}</select>
        </div>
      </div>
      <div className="calendar-data-state"><span>Timezone: WIB</span><span>Updated {query.data?.updatedAt ? new Date(query.data.updatedAt).toLocaleTimeString('en-GB', { timeZone: 'Asia/Jakarta', hour: '2-digit', minute: '2-digit' }) : '—'} WIB</span><span>{query.isFetching ? 'Refreshing…' : 'Data current'}</span></div>
      <AsyncBoundary
        isLoading={query.isLoading}
        error={query.error}
        data={items}
        onRetry={query.refetch}
      >
        <div className="event-list">
          {items.map((item) => (
            <EventRow item={item} search={search} expanded={expanded === item.id} onToggle={() => { const next = expanded === item.id ? '' : item.id; setExpanded(next); const params = new URLSearchParams(searchParams); if (next) params.set('event', next); else params.delete('event'); params.set('tab', 'calendar'); setSearchParams(params); }} key={item.id} />
          ))}
        </div>
      </AsyncBoundary>
    </section>
  );
}

export default function MarketOverview() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  const validTabs = ['chart', 'outlook', 'research', 'calendar'];
  const resolvedTab = tabParam === 'kalender' ? 'calendar' : tabParam;

  const [active, setActive] = useState(() =>
    resolvedTab && validTabs.includes(resolvedTab) ? resolvedTab : 'chart'
  );

  useEffect(() => {
    if (resolvedTab && validTabs.includes(resolvedTab)) {
      setActive(resolvedTab);
    }
  }, [resolvedTab]);

  const handleTabChange = (tabId) => {
    setActive(tabId);
    setSearchParams({ tab: tabId });
  };

  return (
    <div className="market-page">
      <MarketHeader active={active} setActive={handleTabChange} />
      {active === 'chart' && <ChartView />}
      {active === 'outlook' && <OutlookView />}
      {active === 'research' && <ResearchView />}
      {active === 'calendar' && <CalendarView />}
    </div>
  );
}
