import React from 'react'

interface State {
  hasError: boolean
}

export default class ErrorBoundary extends React.Component<{}, State> {
  constructor(props: {}) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error: any, info: any) {
    // eslint-disable-next-line no-console
    console.error('ErrorBoundary caught', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background text-white">
          <div className="text-center">
            <h1 className="text-2xl font-bold">App error</h1>
            <p className="mt-2 text-sm text-white/70">Se ha producido un error en la aplicación. Recarga la página.</p>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
