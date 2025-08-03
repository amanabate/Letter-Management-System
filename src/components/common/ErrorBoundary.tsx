import React from "react";
import { FrownOutlined } from "@ant-design/icons";

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // You can log error info here if needed
    // console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[300px] w-full p-8">
          <span className="inline-block p-6 rounded-full bg-gradient-to-tr from-pink-400 via-purple-400 to-blue-400 animate-pulse shadow-2xl mb-4">
            <FrownOutlined className="text-white text-5xl animate-bounce" />
          </span>
          <div className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-600 via-purple-600 to-blue-600 mb-2">
            Oops! Something went wrong.
          </div>
          <div className="text-gray-400 text-md mb-4">
            {this.state.error?.message || "An unexpected error occurred."}
          </div>
          <button
            className="px-6 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-pink-500 text-white font-semibold shadow hover:from-pink-500 hover:to-blue-500 transition-all"
            onClick={this.handleRetry}
          >
            Retry
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
