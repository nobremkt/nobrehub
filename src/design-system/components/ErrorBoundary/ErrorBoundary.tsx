/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * ERROR BOUNDARY — Catches render errors and shows a fallback UI
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import styles from './ErrorBoundary.module.css';

interface ErrorBoundaryProps {
    children: React.ReactNode;
    fallback?: React.ReactNode;
}

interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, info: React.ErrorInfo) {
        console.error('[ErrorBoundary]', error, info.componentStack);
    }

    handleRetry = () => {
        this.setState({ hasError: false, error: null });
    };

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) return this.props.fallback;

            return (
                <div className={styles.container}>
                    <div className={styles.card}>
                        <AlertTriangle size={40} className={styles.icon} />
                        <h2 className={styles.title}>Algo deu errado</h2>
                        <p className={styles.message}>
                            Ocorreu um erro inesperado. Tente recarregar a página.
                        </p>
                        {this.state.error && (
                            <pre className={styles.details}>
                                {this.state.error.message}
                            </pre>
                        )}
                        <div className={styles.actions}>
                            <button
                                className={styles.retryButton}
                                onClick={this.handleRetry}
                            >
                                <RefreshCw size={16} />
                                Tentar novamente
                            </button>
                            <button
                                className={styles.reloadButton}
                                onClick={() => window.location.reload()}
                            >
                                Recarregar página
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
