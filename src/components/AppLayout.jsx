import Sidebar from './Sidebar';
import TopBar from './TopBar';
import ThreeDLayout from './3DLayout';
import { useLocation } from 'react-router-dom';
import './AppLayout.css';

const AppLayout = ({ children }) => {
    const location = useLocation();
    
    // Only use 3D layout for specific pages
    const pagesWith3D = ['/leaderboard', '/finance', '/support'];
    const use3D = pagesWith3D.includes(location.pathname);
    
    if (use3D) {
        return (
            <ThreeDLayout>
                {children}
            </ThreeDLayout>
        );
    }

    // Fallback to 2D layout for other pages
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
