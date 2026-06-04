import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

window.addEventListener('error', (event) => {
  alert("Global Error: " + event.message + "\nEn: " + event.filename + ":" + event.lineno);
});

window.addEventListener('unhandledrejection', (event) => {
  alert("Unhandled Promise Rejection: " + event.reason);
});


class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '2rem', background: '#000', minHeight: '100vh', fontFamily: 'monospace', color: '#fff' }}>
          <h2 style={{ color: '#ff4d4d' }}>🚨 Algo salió mal (Error de Renderizado)</h2>
          <p>La aplicación se colgó al intentar renderizar esta pantalla:</p>
          <pre style={{ background: '#222', padding: '1rem', color: '#ff4d4d', borderRadius: '8px', overflowX: 'auto', border: '1px solid #ff4d4d' }}>
            {this.state.error?.toString()}
          </pre>
          <pre style={{ background: '#111', padding: '1rem', color: '#aaa', borderRadius: '8px', overflowX: 'auto', marginTop: '1rem' }}>
            {this.state.error?.stack}
          </pre>
          <button 
            onClick={() => {
              localStorage.clear();
              window.location.href = window.location.origin + window.location.pathname;
            }} 
            style={{ marginTop: '1rem', padding: '0.75rem 1.5rem', background: '#ff4d4d', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
          >
            Limpiar Caché y Reiniciar
          </button>
        </div>
      );
    }

    return this.props.children;
  }

}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
)

