import { Component, type ReactNode } from "react";
import { ErrorState } from "./States";

type Props = { children: ReactNode };
type State = { error: Error | null };

export class RouteErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <main className="page" id="content">
          <ErrorState error={this.state.error} onRetry={() => this.setState({ error: null })} />
        </main>
      );
    }
    return this.props.children;
  }
}
