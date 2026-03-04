import React from 'react';
import './ErrorBoundary.css';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        // Update state so the next render will show the fallback UI
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        // Log error to console and potentially to error reporting service
        console.error('ErrorBoundary caught an error:', error, errorInfo);
        
        this.setState({
            error: error,
            errorInfo: errorInfo
        });
    }

    render() {
        if (this.state.hasError) {
            // Fallback UI
            return (
                <div className="error-boundary">
                    <div className="error-content">
                        <h2>😵 Oops! Có lỗi xảy ra</h2>
                        <p>Ứng dụng gặp phải một lỗi không mong muốn. Vui lòng thử lại sau.</p>
                        
                        {process.env.NODE_ENV === 'development' && (
                            <details className="error-details">
                                <summary>Chi tiết lỗi (Development)</summary>
                                <pre>{this.state.error && this.state.error.toString()}</pre>
                                <pre>{this.state.errorInfo && this.state.errorInfo.componentStack}</pre>
                            </details>
                        )}
                        
                        <button 
                            className="retry-button"
                            onClick={() => {
                                this.setState({ hasError: false, error: null, errorInfo: null });
                                window.location.reload();
                            }}
                        >
                            🔄 Thử lại
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
