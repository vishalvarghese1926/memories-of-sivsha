"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class CanvasErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("[CanvasErrorBoundary] Caught WebGL/Canvas error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <div className="absolute inset-0 flex items-center justify-center bg-[#07050d] text-[#f4edea] p-6 text-center z-10">
          <div className="max-w-md bg-[#161224]/80 backdrop-blur-md p-6 rounded-2xl border border-rose-500/20">
            <h3 className="font-serif text-lg text-rose-300 mb-2">Atmospheric Renderer Notice</h3>
            <p className="text-xs text-rose-200/80 mb-4">
              Your device encountered a minor graphic shader issue. The story timeline remains fully accessible.
            </p>
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              className="px-4 py-1.5 rounded-full text-xs font-mono uppercase bg-rose-500/20 border border-rose-400/40 hover:bg-rose-500/30 transition-colors"
            >
              Retry Canvas
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
