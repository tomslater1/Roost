import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  /** Optional fallback to render instead of the default error UI */
  fallback?: ReactNode;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    console.error("[ErrorBoundary] Uncaught render error:", error, info.componentStack);
  }

  reset = () => this.setState({ error: null });

  render() {
    const { error } = this.state;
    const { children, fallback } = this.props;

    if (!error) return children;
    if (fallback) return fallback;

    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 p-8 text-center">
        <p className="text-sm font-medium text-foreground">Something went wrong</p>
        <p className="text-xs text-muted-foreground max-w-xs">
          {error.message || "An unexpected error occurred."}
        </p>
        <button
          onClick={this.reset}
          className="text-xs px-3 py-1.5 rounded-md bg-muted text-muted-foreground hover:bg-muted/80 transition-colors"
        >
          Try again
        </button>
      </div>
    );
  }
}
