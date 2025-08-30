import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTranslation } from 'react-i18next';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error; resetError: () => void }>;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // In production, you might want to log this to an error reporting service
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return <this.props.fallback error={this.state.error!} resetError={this.handleReset} />;
      }

      return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
              <CardTitle className="text-xl text-gray-900">Something went wrong</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-gray-600">
                We encountered an unexpected error. Please try refreshing the page or contact support if the problem persists.
              </p>
              <div className="space-y-2">
                <Button 
                  onClick={this.handleReset}
                  className="w-full bg-purple-600 hover:bg-purple-700"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Again
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => window.location.reload()}
                  className="w-full"
                >
                  Refresh Page
                </Button>
              </div>
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="text-left mt-4">
                  <summary className="text-sm text-gray-500 cursor-pointer">Error Details</summary>
                  <pre className="text-xs text-red-600 mt-2 p-2 bg-red-50 rounded overflow-auto">
                    {this.state.error.message}
                  </pre>
                </details>
              )}
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// Functional wrapper to use translations
function ErrorFallback({ error, resetError }: { error: Error; resetError: () => void }) {
  const { t } = useTranslation();
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="h-8 w-8 text-red-600" />
          </div>
          <CardTitle className="text-xl text-gray-900">{t('error.title', 'Something went wrong')}</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-gray-600">
            {t('error.description', 'We encountered an unexpected error. Please try refreshing the page or contact support if the problem persists.')}
          </p>
          <div className="space-y-2">
            <Button 
              onClick={resetError}
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              {t('error.tryAgain', 'Try Again')}
            </Button>
            <Button 
              variant="outline"
              onClick={() => window.location.reload()}
              className="w-full"
            >
              {t('error.refreshPage', 'Refresh Page')}
            </Button>
          </div>
          {process.env.NODE_ENV === 'development' && error && (
            <details className="text-left mt-4">
              <summary className="text-sm text-gray-500 cursor-pointer">{t('error.details', 'Error Details')}</summary>
              <pre className="text-xs text-red-600 mt-2 p-2 bg-red-50 rounded overflow-auto">
                {error.message}
              </pre>
            </details>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Export a wrapper that uses the translated fallback
export default function TranslatedErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary fallback={ErrorFallback}>
      {children}
    </ErrorBoundary>
  );
}