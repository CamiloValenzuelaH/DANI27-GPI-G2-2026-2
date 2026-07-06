import React from 'react'
import { IntlShape, useIntl } from 'react-intl'

interface State {
  hasError: boolean
}

interface Props {
  intl: IntlShape
  children?: React.ReactNode
}

class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
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
      const { intl } = this.props
      return (
        <div className="min-h-screen flex items-center justify-center bg-background text-white">
          <div className="text-center">
            <h1 className="text-2xl font-bold">{intl.formatMessage({ id: 'errorBoundary.title', defaultMessage: 'App error' })}</h1>
            <p className="mt-2 text-sm text-white/70">{intl.formatMessage({ id: 'errorBoundary.message', defaultMessage: 'An application error occurred. Reload the page.' })}</p>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default function ErrorBoundaryWithIntl(props: { children?: React.ReactNode }) {
  const intl = useIntl()
  return <ErrorBoundary intl={intl}>{props.children}</ErrorBoundary>
}
