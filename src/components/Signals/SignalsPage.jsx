import React, { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Archive,
  CheckCircle2,
  Cpu,
  Crosshair,
  Lightbulb,
  PlusCircle,
  Search,
  X,
} from 'lucide-react';
import './signals.css';
import { useUrlState } from '../../hooks/useUrlState';
import { dataService, queryKeys } from '../../services/dataService';
import { AsyncBoundary } from '../Common/AsyncStates';
import TradingViewChart from '../Market/TradingViewChart';
import { readSession } from '../../auth/session';

const symbols = ['XAUUSD', 'EURUSD', 'GBPUSD', 'USDJPY', 'BTCUSD'];
const sessions = ['Asia', 'London', 'New York'];
const messageFor = (error) =>
  error.response?.data?.message || error.message || 'Something went wrong.';

function Metric({ label, value, tone = '' }) {
  return (
    <div className="signal-metric">
      <span>{label}</span>
      <strong className={tone}>{value}</strong>
      <span className="metric-watermark">$↗</span>
    </div>
  );
}
function SignalCard({ item, onOpen }) {
  const positive = item.direction === 'BUY';
  return (
    <article
      className="signal-card"
      tabIndex="0"
      onClick={() => onOpen(item)}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onOpen(item)}
    >
      <div className="signal-card-top">
        <div className="signal-meta">
          <span className={`trade-pill ${positive ? 'buy' : 'sell'}`}>{item.direction}</span>
          <i />
          <span>{item.symbol}</span>
          <i />
          <span>{item.session} Session</span>
          {item.status === 'running' && !item.historicalSample && (
            <>
              <b className="live-dot" />
              <em>RUNNING</em>
            </>
          )}
          {item.historicalSample && <em className="historical-marker">HISTORICAL</em>}
        </div>
        {item.demo && <span className="signal-sample-badge">SAMPLE</span>}
        {['completed', 'stopped'].includes(item.status) && (
          <span className={`pips ${item.pips < 0 ? 'loss' : ''}`}>
            {item.pips > 0 ? '+' : ''}
            {item.pips || 0} Pips
          </span>
        )}
      </div>
      <div className="published">
        <span>
          {item.source === 'expert' && item.authorName ? `${item.authorName} · ` : ''}
          Published {new Date(item.createdAt).toLocaleString()}
        </span>
        <small>
          {item.archived ? 'archived' : item.historicalSample ? 'old sample' : item.status}
        </small>
      </div>
      <div className="card-data">
        <div className="metrics-grid">
          <Metric label="ENTRY" value={item.entry} />
          <Metric label="SL" value={item.stopLoss} tone="red" />
          <Metric label="TP 1" value={item.targets?.[0] ?? '-'} tone="green" />
          <Metric label="TP 2" value={item.targets?.[1] ?? '-'} tone="green" />
        </div>
      </div>
      <div className="signal-note">
        <Lightbulb />
        <span>{item.analysis}</span>
      </div>
    </article>
  );
}
function SignalForm({ onPublish, pending }) {
  const [direction, setDirection] = useState('BUY');
  const [form, setForm] = useState({
    symbol: 'XAUUSD',
    session: 'London',
    entry: '',
    stopLoss: '',
    tp1: '',
    tp2: '',
    analysis: '',
  });
  const [error, setError] = useState('');
  const [review, setReview] = useState(null);
  const update = (key) => (event) => {
    setReview(null);
    setForm({ ...form, [key]: event.target.value });
  };
  const submit = (event) => {
    event.preventDefault();
    const input = {
      symbol: form.symbol,
      session: form.session,
      direction,
      entry: Number(form.entry),
      stopLoss: Number(form.stopLoss),
      targets: [Number(form.tp1), form.tp2 ? Number(form.tp2) : null].filter((x) => x !== null),
      analysis: form.analysis.trim(),
    };
    if (!form.entry || !form.stopLoss || !form.tp1 || !input.analysis)
      return setError('Entry, stop loss, TP1, and analysis are required.');
    if (
      direction === 'BUY' &&
      !(input.stopLoss < input.entry && input.targets.every((x) => x > input.entry))
    )
      return setError('BUY requires stop loss below entry and targets above entry.');
    if (
      direction === 'SELL' &&
      !(input.stopLoss > input.entry && input.targets.every((x) => x < input.entry))
    )
      return setError('SELL requires stop loss above entry and targets below entry.');
    setError('');
    if (review) onPublish(review);
    else setReview(input);
  };
  return (
    <form className="new-signal-panel" onSubmit={submit}>
      <header className="signal-form-header">
        <span>TEAM EXPERT</span>
        <h2>New signal</h2>
        <p>Set the trade levels and explain the idea before sharing it with members.</p>
      </header>
      <div className="signal-form-layout">
        <section className="signal-direction-panel" aria-labelledby="signal-direction-title">
          <h3 id="signal-direction-title">Direction</h3>
          <p>Select the trade direction.</p>
          <div className="signal-direction-options">
            <button
              type="button"
              className={direction === 'BUY' ? 'selected-buy' : ''}
              aria-pressed={direction === 'BUY'}
              onClick={() => {
                setDirection('BUY');
                setReview(null);
              }}
            >
              BUY
            </button>
            <button
              type="button"
              className={direction === 'SELL' ? 'selected-sell' : ''}
              aria-pressed={direction === 'SELL'}
              onClick={() => {
                setDirection('SELL');
                setReview(null);
              }}
            >
              SELL
            </button>
          </div>
        </section>
        <div className="signal-form-main">
          <section className="signal-field-group" aria-labelledby="signal-market-title">
            <h3 id="signal-market-title">Market</h3>
            <div className="signal-field-grid">
              <label>
                Symbol
                <select value={form.symbol} onChange={update('symbol')}>
                  {symbols.map((x) => (
                    <option key={x}>{x}</option>
                  ))}
                </select>
              </label>
              <label>
                Session
                <select value={form.session} onChange={update('session')}>
                  {sessions.map((x) => (
                    <option key={x}>{x}</option>
                  ))}
                </select>
              </label>
            </div>
          </section>
          <section className="signal-field-group" aria-labelledby="signal-levels-title">
            <h3 id="signal-levels-title">Price levels</h3>
            <div className="signal-field-grid">
              <label>
                Entry
                <input type="number" step="any" value={form.entry} onChange={update('entry')} />
              </label>
              <label>
                Stop Loss
                <input
                  type="number"
                  step="any"
                  value={form.stopLoss}
                  onChange={update('stopLoss')}
                />
              </label>
              <label>
                TP 1
                <input type="number" step="any" value={form.tp1} onChange={update('tp1')} />
              </label>
              <label>
                TP 2 (Optional)
                <input type="number" step="any" value={form.tp2} onChange={update('tp2')} />
              </label>
            </div>
          </section>
          <section className="signal-field-group">
            <h3 id="signal-analysis-title">Analysis</h3>
            <label className="signal-analysis-field">
              Trade idea and context
              <textarea
                aria-label="Analysis"
                value={form.analysis}
                onChange={update('analysis')}
                maxLength="500"
              />
            </label>
          </section>
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          {review && (
            <div className="signal-review" role="status">
              <strong>Review before publishing</strong>
              <span>
                {review.direction} {review.symbol} · {review.session} session
              </span>
              <span>
                Entry {review.entry} · Stop {review.stopLoss} · Targets {review.targets.join(', ')}
              </span>
              <p>{review.analysis}</p>
              <button type="button" onClick={() => setReview(null)}>
                Back to edit
              </button>
            </div>
          )}
          <div className="signal-form-actions">
            <p>
              {review
                ? 'Ready to share this signal with members.'
                : 'Review every level before publishing.'}
            </p>
            <button className="publish-button" disabled={pending}>
              {pending ? 'PUBLISHING…' : review ? 'CONFIRM PUBLISH' : 'REVIEW SIGNAL'}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}
function SignalDetail({ item, canEdit, canArchive, pending, onClose, onAction }) {
  const [actionMode, setActionMode] = useState(null);
  const [draft, setDraft] = useState({ analysis: item.analysis, exitPrice: '', note: '' });
  const [formError, setFormError] = useState('');
  useEffect(() => {
    setActionMode(null);
    setFormError('');
  }, [item.updatedAt]);
  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);
  const openAction = (mode) => {
    setActionMode(mode);
    setFormError('');
    setDraft({ analysis: item.analysis, exitPrice: '', note: '' });
  };
  const submitAction = (event) => {
    event.preventDefault();
    const note = draft.note.trim();
    if (actionMode === 'edit') {
      if (!draft.analysis.trim()) return setFormError('Analysis is required.');
      onAction('update', { analysis: draft.analysis.trim() });
      return;
    }
    if (note.length < 3) return setFormError('Give a short reason or closing note.');
    if (actionMode === 'close') {
      const exitPrice = Number(draft.exitPrice);
      if (!draft.exitPrice || !Number.isFinite(exitPrice) || exitPrice <= 0)
        return setFormError('Enter a valid executed exit price.');
      onAction('update', { status: 'completed', exitPrice, note });
    } else if (actionMode === 'cancel') {
      onAction('update', { status: 'cancelled', note });
    } else if (actionMode === 'archive') {
      onAction('archive', { reason: note });
    }
  };
  const history = item.history?.length
    ? item.history
    : [{ status: item.status, at: item.createdAt, note: 'Signal published' }];
  return (
    <div
      className="signal-modal-backdrop"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <section
        className="signal-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="signal-detail-title"
      >
        <header>
          <div>
            <span className={`trade-pill ${item.direction === 'BUY' ? 'buy' : 'sell'}`}>
              {item.direction}
            </span>
            <h2 id="signal-detail-title">
              {item.symbol} · {item.session}
            </h2>
            {item.source === 'expert' && item.authorName && (
              <p className="signal-author">Published by {item.authorName}</p>
            )}
          </div>
          <button onClick={onClose} aria-label="Close signal details">
            <X />
          </button>
        </header>
        {item.demo && (
          <p className="signal-demo-notice">
            {item.historicalSample
              ? 'Historical sample signal. Its recorded running status is not a current trade recommendation.'
              : 'Sample signal for preview. Its performance is not from a live trading service.'}
          </p>
        )}
        <div className="detail-chart">
          <TradingViewChart symbol={`ICMARKETS:${item.symbol}`} compact />
        </div>
        <div className="detail-metrics">
          <Metric label="ENTRY" value={item.entry} />
          <Metric label="STOP LOSS" value={item.stopLoss} tone="red" />
          <Metric label="TP 1" value={item.targets?.[0] ?? '-'} tone="green" />
          <Metric label="TP 2" value={item.targets?.[1] ?? '-'} tone="green" />
        </div>
        {['completed', 'stopped'].includes(item.status) && (
          <p className="signal-result">
            Result: {item.result} · {item.pips > 0 ? '+' : ''}
            {item.pips || 0} Pips
          </p>
        )}
        <p className="detail-analysis">
          <Lightbulb />
          {item.analysis}
        </p>
        <h3>Status history</h3>
        <ol className="status-history">
          {history.map((entry, index) => (
            <li key={`${entry.at}-${index}`}>
              <b>{entry.status}</b>
              <span>{new Date(entry.at).toLocaleString()}</span>
              <small>
                {entry.actorName ? `${entry.actorName}: ` : ''}
                {entry.note}
              </small>
            </li>
          ))}
        </ol>
        {(canEdit || canArchive) && (
          <footer>
            {canEdit && <button onClick={() => openAction('edit')}>Edit analysis</button>}
            {canEdit && item.status === 'running' && (
              <>
                <button onClick={() => openAction('close')}>Close signal</button>
                <button onClick={() => openAction('cancel')}>Cancel signal</button>
              </>
            )}
            {canArchive && (
              <button className="danger" onClick={() => openAction('archive')}>
                <Archive /> Archive
              </button>
            )}
          </footer>
        )}
        {actionMode && (
          <form className="signal-action-form" onSubmit={submitAction}>
            <h3>
              {actionMode === 'edit'
                ? 'Edit analysis'
                : actionMode === 'close'
                  ? 'Close signal'
                  : actionMode === 'cancel'
                    ? 'Cancel signal'
                    : 'Archive signal'}
            </h3>
            {actionMode === 'edit' && (
              <label>
                Analysis
                <textarea
                  value={draft.analysis}
                  maxLength="2000"
                  onChange={(event) => setDraft({ ...draft, analysis: event.target.value })}
                />
              </label>
            )}
            {actionMode === 'close' && (
              <label>
                Executed exit price
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={draft.exitPrice}
                  onChange={(event) => setDraft({ ...draft, exitPrice: event.target.value })}
                />
              </label>
            )}
            {actionMode !== 'edit' && (
              <label>
                {actionMode === 'archive' ? 'Reason for archive' : 'Reason or closing note'}
                <textarea
                  value={draft.note}
                  maxLength="500"
                  onChange={(event) => setDraft({ ...draft, note: event.target.value })}
                />
              </label>
            )}
            {actionMode === 'archive' && (
              <p>
                This removes the signal from member feeds while preserving its record and history.
              </p>
            )}
            {formError && (
              <p role="alert" className="form-error">
                {formError}
              </p>
            )}
            <div className="signal-action-buttons">
              <button type="button" onClick={() => setActionMode(null)} disabled={pending}>
                Back
              </button>
              <button type="submit" disabled={pending}>
                {pending ? 'Saving…' : 'Confirm'}
              </button>
            </div>
          </form>
        )}
      </section>
    </div>
  );
}
function Toast({ toast, onClose }) {
  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(onClose, 4000);
    return () => clearTimeout(id);
  }, [toast, onClose]);
  return (
    toast && (
      <div className={`signal-toast ${toast.type}`} role="status">
        {toast.type === 'success' && <CheckCircle2 />}
        {toast.message}
        <button onClick={onClose}>
          <X />
        </button>
      </div>
    )
  );
}
export default function SignalsPage() {
  const [view, setView, resetView] = useUrlState({
    mode: 'ai',
    query: '',
    history: 'false',
    archived: 'false',
    session: 'all',
    status: 'all',
    result: 'all',
    sort: 'newest',
  });
  const [searchInput, setSearchInput] = useState(view.query || '');
  const [showAdminForm, setShowAdminForm] = useState(false);
  const [selected, setSelected] = useState(null);
  const [toast, setToast] = useState(null);
  const queryClient = useQueryClient();
  const session = readSession();
  const role = session?.user?.role;
  const isAdmin = role === 'admin' || role === 'super-admin';
  const canPublish = isAdmin || role === 'expert';
  const mode = view.mode === 'expert' ? 'expert' : 'ai';
  const history = view.history === 'true';
  const archived = isAdmin && view.archived === 'true';
  useEffect(() => {
    const id = setTimeout(() => setView({ query: searchInput }), 350);
    return () => clearTimeout(id);
  }, [searchInput, setView]);
  useEffect(() => setSearchInput(view.query || ''), [view.query]);
  const params = {
    source: mode,
    archived: archived || undefined,
    search: view.query || undefined,
    history: (history && !archived) || undefined,
    session: view.session !== 'all' ? view.session : undefined,
    status: !history && !archived && view.status !== 'all' ? view.status : undefined,
    result: view.result !== 'all' ? view.result : undefined,
  };
  const signalsQuery = useQuery({
    queryKey: queryKeys.signals(params),
    queryFn: () => dataService.signals.list(params),
    refetchInterval: 60_000,
  });
  const mutation = useMutation({
    mutationFn: ({ type, id, data }) =>
      type === 'create'
        ? dataService.signals.create(data)
        : type === 'archive'
          ? dataService.signals.archive(id, data.reason)
          : dataService.signals.update(id, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['signals'] });
      setShowAdminForm(false);
      if (variables.type === 'archive') setSelected(null);
      else if (variables.type !== 'create') setSelected(data);
      setToast({
        type: 'success',
        message:
          variables.type === 'create'
            ? 'Signal published.'
            : variables.type === 'archive'
              ? 'Signal archived. Its history was preserved.'
              : 'Signal updated.',
      });
    },
    onError: (error) => setToast({ type: 'error', message: messageFor(error) }),
  });
  const cards = useMemo(() => {
    const result = signalsQuery.data?.items || [];
    return view.sort === 'oldest' ? [...result].reverse() : result;
  }, [signalsQuery.data, view.sort]);
  const hasFilters =
    searchInput ||
    history ||
    archived ||
    mode !== 'ai' ||
    view.session !== 'all' ||
    view.status !== 'all' ||
    view.result !== 'all' ||
    view.sort !== 'newest';
  const reset = () => {
    resetView();
    setSearchInput('');
  };
  return (
    <div className="signals-page">
      <section className="signals-heading">
        <div>
          <h1>SIGNALS</h1>
          <p>
            {mode === 'expert' ? 'Team Expert signals' : 'AI demo signals'} · list checks for
            updates every minute
          </p>
        </div>
        <div className="heading-actions">
          <button
            onClick={() =>
              setView({ history: String(!history && !archived), archived: 'false', status: 'all' })
            }
          >
            {history || archived ? 'View Active' : 'View History'}
          </button>
          {isAdmin && (
            <button
              onClick={() =>
                setView({ mode: 'expert', archived: 'true', history: 'false', status: 'all' })
              }
            >
              Archived
            </button>
          )}
          {canPublish && (
            <button
              className="admin-button"
              aria-label={showAdminForm ? 'Close signal form' : 'Add Signal'}
              onClick={() => {
                setView({ mode: 'expert' });
                setShowAdminForm(!showAdminForm);
              }}
            >
              {showAdminForm ? <X /> : <PlusCircle />}
              <span>{showAdminForm ? 'Close' : 'Add Signal'}</span>
            </button>
          )}
        </div>
      </section>
      {(mode === 'ai' || cards.some((item) => item.demo)) && (
        <p className="signal-feed-notice">
          Sample signals are historical examples. They do not use live market updates or represent
          current trade recommendations.
        </p>
      )}
      {showAdminForm && (
        <SignalForm
          pending={mutation.isPending}
          onPublish={(data) => mutation.mutate({ type: 'create', data })}
        />
      )}
      <section className="mode-bar">
        <div className="mode-buttons">
          <button
            className={mode === 'expert' ? 'active-mode' : ''}
            onClick={() => setView({ mode: 'expert' })}
          >
            <Crosshair /> TEAM EXPERT
          </button>
          <button
            className={mode === 'ai' ? 'active-mode' : ''}
            onClick={() => setView({ mode: 'ai' })}
          >
            <Cpu /> AI DEMO
          </button>
        </div>
        <span className="signal-count">{signalsQuery.data?.total ?? 0} Signals</span>
      </section>
      <section className="filters-section">
        <h2>
          <Search /> FILTER SIGNALS
        </h2>
        <div className="filters-bar">
          <label className="search-field">
            <Search />
            <input
              placeholder="Search symbol or analysis…"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
            {searchInput && (
              <button type="button" onClick={() => setSearchInput('')} aria-label="Clear search">
                <X />
              </button>
            )}
          </label>
          <select
            aria-label="Session"
            value={view.session}
            onChange={(e) => setView({ session: e.target.value })}
          >
            <option value="all">All Sessions</option>
            {sessions.map((x) => (
              <option key={x} value={x}>
                {x}
              </option>
            ))}
          </select>
          <select
            aria-label="Status"
            value={history ? 'history' : view.status}
            disabled={history}
            onChange={(e) => setView({ status: e.target.value })}
          >
            <option value="all">All Statuses</option>
            <option value="running">Running</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
            <option value="expired">Expired</option>
            {history && <option value="history">History</option>}
          </select>
          <select
            aria-label="Result"
            value={view.result}
            onChange={(e) => setView({ result: e.target.value })}
          >
            <option value="all">All Results</option>
            <option value="win">Win</option>
            <option value="loss">Loss</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <select
            aria-label="Sort order"
            value={view.sort}
            onChange={(e) => setView({ sort: e.target.value })}
          >
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
          </select>
          {hasFilters && (
            <button className="reset-filter" onClick={reset}>
              Reset
            </button>
          )}
        </div>
      </section>
      <AsyncBoundary
        isLoading={signalsQuery.isLoading}
        error={signalsQuery.error}
        data={cards}
        onRetry={signalsQuery.refetch}
      >
        <section className="signals-grid">
          {cards.map((item) => (
            <SignalCard item={item} onOpen={setSelected} key={item.id} />
          ))}
        </section>
      </AsyncBoundary>
      {selected && (
        <SignalDetail
          item={selected}
          canEdit={
            !selected.archived &&
            (isAdmin || (role === 'expert' && selected.authorId === session?.user?.id))
          }
          canArchive={
            isAdmin &&
            !selected.archived &&
            ['completed', 'stopped', 'cancelled', 'expired'].includes(selected.status)
          }
          pending={mutation.isPending}
          onClose={() => setSelected(null)}
          onAction={(type, data) => mutation.mutate({ type, id: selected.id, data })}
        />
      )}
      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}
