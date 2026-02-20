import { Component } from 'react'
import type { ReactNode, ErrorInfo } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ThrustCurves] Unhandled error:', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center py-20 gap-6 text-center">
          <div className="w-14 h-14 rounded-full border-2 border-signal/40 bg-signal-dim flex items-center justify-center">
            <svg
              className="w-7 h-7 text-signal-hi"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
              />
            </svg>
          </div>
          <div>
            <p className="font-display text-xl font-semibold tracking-wider uppercase text-signal-hi mb-1">
              System Fault
            </p>
            <p className="font-data text-sm text-label max-w-xs">
              An unexpected error occurred. Reload the page to continue.
            </p>
            {this.state.error && (
              <p className="font-data text-xs text-muted-txt mt-3 max-w-md break-words">
                {this.state.error.message}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="px-5 py-2 rounded-lg border border-signal/40 bg-signal-dim hover:bg-signal/20 transition-colors font-display text-sm font-semibold tracking-widest uppercase text-signal-hi"
          >
            Reload
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
