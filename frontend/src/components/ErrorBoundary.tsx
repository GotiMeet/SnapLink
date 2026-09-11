import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Button } from './ui/Button';

interface Props {
  children: ReactNode;
}
interface State {
  error: Error | null;
}

/**
 * Last line of defence for render-time crashes. Network failures are handled by
 * TanStack Query per screen; this catches the programming errors that would
 * otherwise leave a blank white page with no way out.
 *
 * Must stay a class component — React has no hook equivalent for
 * componentDidCatch.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Unhandled render error:', error, info.componentStack);
  }

  private reset = () => {
    this.setState({ error: null });
  };

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-canvas p-md">
        <div className="flex max-w-md flex-col items-center gap-md rounded-lg border border-border-subtle bg-surface-card p-lg text-center shadow-sm">
          <h1 className="text-heading-lg">Something went wrong</h1>
          <p className="text-body-md text-content-secondary">
            The page failed to render. Reloading usually clears it.
          </p>
          <div className="flex gap-xs">
            <Button onClick={this.reset} variant="secondary">
              Try again
            </Button>
            <Button onClick={() => window.location.reload()}>Reload page</Button>
          </div>
        </div>
      </div>
    );
  }
}
