import React from "react";

export default class ErrorBoundary extends React.Component {
  state = { error: null };
  static getDerivedStateFromError(error) {
    return { error };
  }
  render() {
    if (this.state.error) {
      return (
        <pre style={{ padding: 16, color: "red", whiteSpace: "pre-wrap" }}>
          {String(this.state.error)}
        </pre>
      );
    }
    return this.props.children;
  }
}
