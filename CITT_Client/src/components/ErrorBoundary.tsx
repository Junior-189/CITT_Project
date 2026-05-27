import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
          <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
            <div className="text-red-500 text-5xl mb-4">!</div>
            <h1 className="text-xl font-bold text-gray-800 mb-3">Something went wrong</h1>
            <p className="text-gray-600 mb-6 text-sm">
              An unexpected error occurred. Please try refreshing the page.
            </p>
            <p className="text-gray-400 text-xs mb-4 font-mono bg-gray-100 p-2 rounded break-all">
              {this.state.error?.message}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export function LoadingSpinner({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-3" />
      <p className="text-gray-500 text-sm">{message}</p>
    </div>
  );
}

export function LoadingPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <LoadingSpinner message="Loading CITT..." />
    </div>
  );
}

export function EmptyState({
  icon = '?',
  title = 'No data found',
  description = 'There is nothing to display at this time.',
}: {
  icon?: string;
  title?: string;
  description?: string;
}) {
  return (
    <div className="text-center py-12 px-4">
      <div className="text-4xl mb-4 opacity-50">{icon}</div>
      <h3 className="text-lg font-semibold text-gray-700 mb-2">{title}</h3>
      <p className="text-gray-500 text-sm max-w-md mx-auto">{description}</p>
    </div>
  );
}
