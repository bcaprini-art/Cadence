import { Component } from 'react'

/**
 * ErrorBoundary — catches unhandled React errors and shows a sport-themed
 * fallback UI instead of a blank white page.
 *
 * Usage:
 *   <ErrorBoundary>
 *     <YourComponent />
 *   </ErrorBoundary>
 *
 * In development mode (import.meta.env.DEV) the raw error message is shown.
 */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
    this.handleReset = this.handleReset.bind(this)
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo })
    // You could log to an error reporting service here (Sentry, etc.)
    console.error('[ErrorBoundary] Caught error:', error, errorInfo)
  }

  handleReset() {
    this.setState({ hasError: false, error: null, errorInfo: null })
  }

  render() {
    if (!this.state.hasError) {
      return this.props.children
    }

    const isDev = typeof import.meta !== 'undefined' && import.meta.env?.DEV

    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950 px-4">
        <div className="max-w-md w-full text-center space-y-6">
          {/* Sport icon */}
          <div className="text-6xl select-none" aria-hidden="true">🏟️</div>

          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-white">
              Something went wrong
            </h1>
            <p className="text-gray-400 text-sm">
              The app hit an unexpected error. Don't worry — your data is safe.
            </p>
          </div>

          {/* Development error details */}
          {isDev && this.state.error && (
            <div className="bg-red-950 border border-red-700 rounded-lg p-4 text-left space-y-2">
              <p className="text-red-400 font-semibold text-xs uppercase tracking-wide">
                Dev mode — error details
              </p>
              <pre className="text-red-300 text-xs overflow-auto whitespace-pre-wrap break-all">
                {this.state.error.toString()}
              </pre>
              {this.state.errorInfo?.componentStack && (
                <pre className="text-red-400/70 text-xs overflow-auto whitespace-pre-wrap break-all">
                  {this.state.errorInfo.componentStack}
                </pre>
              )}
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={this.handleReset}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg transition-colors"
            >
              Try again
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2.5 bg-gray-700 hover:bg-gray-600 text-gray-200 font-semibold rounded-lg transition-colors"
            >
              Reload page
            </button>
          </div>

          <p className="text-gray-600 text-xs">
            If this keeps happening, try clearing your browser cache or contact support.
          </p>
        </div>
      </div>
    )
  }
}

export default ErrorBoundary
