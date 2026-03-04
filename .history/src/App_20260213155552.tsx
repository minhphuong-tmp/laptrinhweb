import { Navigate, Route, BrowserRouter as Router, Routes, useLocation } from 'react-router-dom';
import './App.css';
import ErrorBoundary from './components/ErrorBoundary';
import Header from './components/Header';
import AppLayout from './components/AppLayout';
import RightSidebar from './components/RightSidebar';
import Loading from './components/Loading';
import { AuthProvider, useAuth } from './context/AuthContext';
import Chat from './pages/Chat';
import ChatList from './pages/ChatList';
import Home from './pages/Home';
import Login from './pages/Login';
import NewChat from './pages/NewChat';
import Notifications from './pages/Notifications';
import Posts from './pages/Posts';
import Profile from './pages/Profile';
import PostDetails from './pages/PostDetails';
import SignUp from './pages/SignUp';
import Stats from './pages/Stats';
import Todo from './pages/Todo';
// CLB Tin học KMA pages
import Members from './pages/Members';
import Activities from './pages/Activities';
import Documents from './pages/Documents';
import Statistics from './pages/Statistics';
import Announcements from './pages/Announcements';
import Leaderboard from './pages/Leaderboard';
import Curriculum from './pages/Curriculum';
import GradesLogin from './pages/GradesLogin';
import GlobalCallListener from './components/GlobalCallListener';
import { useSmoothScroll } from './hooks/useSmoothScroll';

function AppContent() {
    const location = useLocation();
    const isAuthPage = location.pathname === '/login' || location.pathname === '/signup';

    // Tích hợp smooth scroll với Lenis
    useSmoothScroll({
        duration: 1.2,
        smoothWheel: true,
        wheelMultiplier: 1,
        smoothTouch: true,
        touchMultiplier: 2
    });

    return (
        <div className="App">
            <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<SignUp />} />
                <Route path="/" element={<Navigate to="/home" replace />} />
                <Route path="/home" element={<ProtectedRoute><Home /></ProtectedRoute>} />
                <Route path="/posts" element={<ProtectedRoute><Posts /></ProtectedRoute>} />
                <Route path="/todo" element={<ProtectedRoute><Todo /></ProtectedRoute>} />
                <Route path="/notes" element={<Navigate to="/todo" replace />} />
                <Route path="/stats" element={<ProtectedRoute><Stats /></ProtectedRoute>} />
                <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
                <Route path="/profile/:userId?" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                <Route path="/post/:id" element={<ProtectedRoute><PostDetails /></ProtectedRoute>} />
                <Route path="/chat" element={<ProtectedRoute><ChatList /></ProtectedRoute>} />
                <Route path="/chat/:id" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
                <Route path="/new-chat" element={<ProtectedRoute><NewChat /></ProtectedRoute>} />
                {/* CLB Tin học KMA routes */}
                <Route path="/members" element={<ProtectedRoute><Members /></ProtectedRoute>} />
                <Route path="/activities" element={<ProtectedRoute><Activities /></ProtectedRoute>} />
                <Route path="/documents" element={<ProtectedRoute><Documents /></ProtectedRoute>} />
                <Route path="/statistics" element={<ProtectedRoute><Statistics /></ProtectedRoute>} />
                <Route path="/announcements" element={<ProtectedRoute><Announcements /></ProtectedRoute>} />
                <Route path="/curriculum" element={<ProtectedRoute><Curriculum /></ProtectedRoute>} />
                <Route path="/leaderboard" element={<ProtectedRoute><Leaderboard /></ProtectedRoute>} />
                <Route path="/grades" element={<ProtectedRoute><GradesLogin /></ProtectedRoute>} />
            </Routes>

            {!isAuthPage && <RightSidebar />}
            {!isAuthPage && <GlobalCallListener />}
        </div>
    );
}

function App() {
    return (
        <ErrorBoundary>
            <AuthProvider>
                <Router>
                    <AppContent />
                </Router>
            </AuthProvider>
        </ErrorBoundary>
    );
}

interface ProtectedRouteProps {
    children: React.ReactNode;
}

function ProtectedRoute({ children }: ProtectedRouteProps) {
    const { user, loading } = useAuth() as { user: any; loading: boolean };

    if (loading) {
        console.log('Still loading...');
        return <Loading size="fullscreen" text="Đang khởi tạo ứng dụng..." />;
    }

    // Kiểm tra user hợp lệ - phải có id và (name hoặc email)
    const isValidUser = user && user.id && (user.name || user.email);

    if (!isValidUser) {
        console.log('No valid user, redirecting to login. User:', user);
        return <Navigate to="/login" replace />;
    }

    // Các trang sử dụng AppLayout (có sidebar trái, phải và header)
    const pagesWithAppLayout = ['/members', '/activities', '/documents', '/statistics', '/announcements', '/curriculum', '/leaderboard', '/grades'];
    const currentPath = window.location.pathname;

    if (pagesWithAppLayout.includes(currentPath)) {
        return <AppLayout>{children}</AppLayout>;
    }

    // Các trang không cần Header (đã có Sidebar và TopBar riêng)
    const pagesWithoutHeader = ['/', '/home', '/posts', '/todo', '/stats', '/profile', '/chat'];
    const needsHeader = !pagesWithoutHeader.includes(currentPath);

    if (needsHeader) {
        return (
            <div className="app-layout">
                <Header />
                <main className="main-content">
                    {children}
                </main>
            </div>
        );
    }

    // Các trang chính sử dụng Facebook layout (Home)
    return (
        <div className="facebook-layout">
            {children}
        </div>
    );
}

export default App;