import { Component, type ErrorInfo, type ReactNode } from 'react';
import { HeartHandshake, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  errorMessage: string;
}

export class ElderlyErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    errorMessage: '',
  };

  public static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      errorMessage: error.message || '',
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error caught by ElderlyErrorBoundary:", error, errorInfo);
  }

  private handleRetry = () => {
    this.setState({ hasError: false, errorMessage: '' });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div
          role="alert"
          className="max-w-2xl mx-auto my-12 p-8 bg-amber-50 border-4 border-amber-300 rounded-3xl shadow-xl text-center"
        >
          <div className="w-20 h-20 mx-auto mb-4 bg-amber-200 rounded-full flex items-center justify-center text-amber-900">
            <HeartHandshake className="w-12 h-12" aria-hidden="true" />
          </div>

          <h2 className="text-2xl font-black text-amber-950 mb-3">
            Take a Gentle Breath
          </h2>

          <p className="text-xl text-amber-900 leading-relaxed mb-6 font-medium">
            I'm having a little trouble reading that right now; let's take a deep breath and try reading it together.
          </p>

          <button
            type="button"
            onClick={this.handleRetry}
            className="inline-flex items-center gap-3 px-8 py-4 bg-amber-800 hover:bg-amber-900 text-white rounded-2xl text-xl font-bold shadow-lg min-h-[56px] focus-visible:ring-4"
          >
            <RefreshCw className="w-6 h-6" aria-hidden="true" />
            <span>Let's Try Again</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
