import Sidebar from './Sidebar';
import TopBar from './TopBar';
import './AppLayout.css';

const AppLayout = ({ children }) => {

    return (
        <div className="app-layout">
            <Sidebar />
            <div className="main-content">
                <TopBar />
                <div className="content-area">
                    {children}
                </div>
            </div>
        </div>
    );
};

export default AppLayout;
