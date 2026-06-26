import { Component, type ErrorInfo, type ReactNode } from "react";
import { reportClientError } from "../../utils/clientDiagnostics";

interface ErrorBoundaryProps {
  children: ReactNode;
  title?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public override state: ErrorBoundaryState = { hasError: false };

  public static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  public override componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    reportClientError("Error capturado por ErrorBoundary.", { error: error.message, componentStack: errorInfo.componentStack });
  }

  public override render(): ReactNode {
    if (!this.state.hasError) return this.props.children;

    return (
      <section className="panel error-boundary-panel">
        <h2>{this.props.title ?? "Algo salió mal al cargar esta sección"}</h2>
        <p className="muted">La sección no pudo renderizarse correctamente. Puedes reintentar sin perder el resto de la aplicación.</p>
        <button type="button" className="secondary-link" onClick={() => this.setState({ hasError: false })}>
          Reintentar
        </button>
      </section>
    );
  }
}
