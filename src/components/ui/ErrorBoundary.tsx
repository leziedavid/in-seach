"use client";

import React, { Component, ReactNode } from "react";

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
    onError?: (error: Error, info: React.ErrorInfo) => void;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

/**
 * ErrorBoundary — isole les erreurs d'un sous-arbre React.
 * Un composant cassé n'interrompt plus toute la page.
 *
 * Usage :
 *   <ErrorBoundary fallback={<p>Erreur dans cette section</p>}>
 *     <MonComposantLourd />
 *   </ErrorBoundary>
 */
export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, info: React.ErrorInfo) {
        this.props.onError?.(error, info);
        if (process.env.NODE_ENV === "development") {
            console.error("[ErrorBoundary]", error, info.componentStack);
        }
    }

    render() {
        if (this.state.hasError) {
            return this.props.fallback ?? (
                <div className="flex flex-col items-center justify-center p-8 text-center gap-3">
                    <p className="text-sm text-muted-foreground">
                        Une erreur est survenue dans cette section.
                    </p>
                    <button
                        onClick={() => this.setState({ hasError: false, error: null })}
                        className="text-xs underline text-primary hover:text-primary/80"
                    >
                        Réessayer
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}
