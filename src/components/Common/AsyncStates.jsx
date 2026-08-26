import React from 'react';
import { AlertTriangle, Ban, CloudOff, Construction, Inbox, Loader2, RefreshCw } from 'lucide-react';

const states = {
  empty: [Inbox, 'Nothing here yet', 'New content will appear here when it is available.'],
  error: [AlertTriangle, 'Something went wrong', 'The request could not be completed.'],
  offline: [CloudOff, 'You are offline', 'Reconnect to the internet and try again.'],
  forbidden: [Ban, 'Access denied', 'Your account does not have permission to view this page.'],
  maintenance: [Construction, 'Maintenance in progress', 'NH Terminal will be available again shortly.'],
  loading: [Loader2, 'Loading', 'Please wait while the latest information is prepared.'],
};

export function StateScreen({ state = 'error', title, message, onRetry }) {
  const [Icon, defaultTitle, defaultMessage] = states[state] || states.error;
  return <section className={`app-state app-state-${state}`} role={state === 'error' ? 'alert' : 'status'} aria-live="polite">
    <Icon className={state === 'loading' ? 'state-spinner' : ''} aria-hidden="true" />
    <h1>{title || defaultTitle}</h1><p>{message || defaultMessage}</p>
    {onRetry && <button onClick={onRetry}><RefreshCw aria-hidden="true" /> Try again</button>}
  </section>;
}

export function RouteSkeleton({ route = 'page' }) {
  return <div className={`route-skeleton route-skeleton-${route}`} role="status" aria-label="Loading page">
    <div className="skeleton-heading"/><div className="skeleton-grid">{[0,1,2,3].map(x=><div key={x}/>)}</div>
  </div>;
}

export function AsyncBoundary({ isLoading, error, data, onRetry, children }) {
  if (isLoading) return <StateScreen state="loading" />;
  if (error) return <StateScreen state={navigator.onLine ? 'error' : 'offline'} onRetry={onRetry} />;
  if (Array.isArray(data) && !data.length) return <StateScreen state="empty" />;
  return children;
}
