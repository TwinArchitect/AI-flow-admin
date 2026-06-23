import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center px-4">
          <div className="text-5xl">💥</div>
          <h2 className="text-xl font-semibold text-[var(--color-text-primary)]">
            页面出现了错误
          </h2>
          <p className="text-sm text-[var(--color-text-secondary)] max-w-md">
            {this.state.error?.message ?? '未知错误，请尝试刷新页面'}
          </p>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => window.location.reload()}>
              刷新页面
            </Button>
            <Button onClick={this.handleReset}>
              重试
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
