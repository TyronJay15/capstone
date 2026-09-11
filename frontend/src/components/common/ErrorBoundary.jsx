import React from 'react';
import './common.css';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // eslint-disable-next-line no-console
    console.error('UI ErrorBoundary caught an error:', error, info);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.handleReset);
      }
      return (
        <div className="gp-error-boundary" role="alert">
          <div className="gp-empty-icon" aria-hidden="true">⚠️</div>
          <h2>Something went wrong</h2>
          <p>This section failed to load. You can retry or reload the page.</p>
          <div className="gp-row" style={{ justifyContent: 'center', marginTop: '1rem' }}>
            <button type="button" className="btn btn-primary" onClick={this.handleReset}>
              Try Again
            </button>
            <button type="button" className="btn btn-secondary" onClick={() => window.location.reload()}>
              Reload Page
            </button>
          </div>
          {process.env.NODE_ENV !== 'production' && this.state.error ? (
            <pre>{String(this.state.error?.stack || this.state.error)}</pre>
          ) : null}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
