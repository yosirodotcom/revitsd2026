import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary caught error]', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 text-center bg-slate-900 border border-slate-800 rounded-3xl max-w-lg mx-auto my-12 shadow-2xl">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-4 animate-bounce" />
          <h2 className="text-xl font-bold text-white mb-2">Terjadi Kesalahan Tampilan</h2>
          <p className="text-xs text-slate-400 mb-6 bg-slate-950 p-4 rounded-xl text-rose-400 font-mono text-left overflow-x-auto max-h-32">
            {this.state.error?.toString() || 'Unknown Error'}
          </p>
          <button
            onClick={() => {
              this.setState({ hasError: false, error: null });
              if (this.props.onReset) this.props.onReset();
            }}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg cursor-pointer flex items-center justify-center gap-2 mx-auto"
          >
            <RefreshCw className="w-4 h-4" /> Coba Muat Ulang Tampilan
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
