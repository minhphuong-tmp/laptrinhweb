import './Loading.css';

const Loading = ({ size = 'medium', text = 'Đang tải...' }) => {
    return (
        <div className={`loading-container ${size}`}>
            <div className="loading-spinner">
                <div className="spinner"></div>
            </div>
            <div className="loading-text">{text}</div>
        </div>
    );
};

export default Loading;

