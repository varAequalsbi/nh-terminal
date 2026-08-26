import React from 'react';
import { StateScreen } from './AsyncStates';

export default class AppErrorBoundary extends React.Component {
  state = { error: null };
  static getDerivedStateFromError(error) { return { error }; }
  componentDidCatch(error, info) { if (import.meta.env.DEV) console.error('Application error boundary', error, info); }
  render() {
    if (this.state.error) return <StateScreen state="error" title="NH Terminal hit an unexpected error" onRetry={() => this.setState({ error: null })} />;
    return this.props.children;
  }
}
