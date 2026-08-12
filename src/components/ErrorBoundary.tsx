import React from 'react';

interface Props { children: React.ReactNode }
interface State { hasError: boolean }

export default class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: any, info: any) {
    // Log to console for debugging; keeps UI intact
    console.error('ErrorBoundary caught error:', error, info);
  }

  render() {
    if (this.state.hasError) return null;
    return this.props.children as React.ReactElement;
  }
}
