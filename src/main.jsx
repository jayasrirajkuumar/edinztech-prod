import React from 'react';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';

console.log('Main.jsx is executing...');

// Debug: Log environment configuration
if (typeof window !== 'undefined') {
    window.__ENV_CONFIG__ = {
        API_URL: import.meta.env.VITE_API_URL,
        BACKEND_URL: import.meta.env.VITE_BACKEND_URL,
        FRONTEND_URL: import.meta.env.VITE_FRONTEND_URL,
        DEV: import.meta.env.DEV,
        PROD: import.meta.env.PROD,
    };
    console.log('[ENV CONFIG]', window.__ENV_CONFIG__);
}

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Uncaught error:", error, errorInfo);
    this.setState({ error, errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', color: 'red' }}>
          <h1>Something went wrong.</h1>
          <pre>{this.state.error?.toString()}</pre>
          <pre>{this.state.errorInfo?.componentStack}</pre>
        </div>
      );
    }

    return this.props.children;
  }
}

try {
  const root = createRoot(document.getElementById('root'));
  root.render(
    <StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </StrictMode>,
  );
  console.log('Root rendered');
} catch (e) {
  console.error("Root render failed:", e);
  document.body.innerHTML = `<div style="color:red; padding:20px"><h1>Root Render Failed</h1><pre>${e.toString()}</pre></div>`;
}
