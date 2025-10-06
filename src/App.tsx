import { Navigate, Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import './App.css';
import Header from './components/Header';
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
import SignUp from './pages/SignUp';
import Stats from './pages/Stats';
import Todo from './pages/Todo';

function App() {
    return (
        <AuthProvider>
            <Router>
                <div className="App">
                    <Routes>
                        <Route path="/login" element={<Login />} />
                        <Route path="/signup" element={<SignUp />} />
                        <Route path="/" element={<Navigate to="/home" replace />} />
                        <Route path="/home" element={<ProtectedRoute><Home /></ProtectedRoute>} />
                        <Route path="/posts" element={<ProtectedRoute><Posts /></ProtectedRoute>} />
                        <Route path="/todo" element={<ProtectedRoute><Todo /></ProtectedRoute>} />
                        <Route path="/stats" element={<ProtectedRoute><Stats /></ProtectedRoute>} />
                        <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
                        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                        <Route path="/chat" element={<ProtectedRoute><ChatList /></ProtectedRoute>} />
                        <Route path="/chat/:id" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
                        <Route path="/new-chat" element={<ProtectedRoute><NewChat /></ProtectedRoute>} />
                    </Routes>
                </div>
            </Router>
        </AuthProvider>
    );
}

function ProtectedRoute({ children }) {
    const { user, loading } = useAuth();

    console.log('ProtectedRoute - user:', user, 'loading:', loading);

    if (loading) {
        console.log('Still loading...');
        return <Loading size="fullscreen" text="Đang khởi tạo ứng dụng..." />;
    }

    if (!user) {
        console.log('No user, redirecting to login');
        return <Navigate to="/login" replace />;
    }

    console.log('User exists, rendering children');
    return (
        <div className="app-layout">
            <Header />
            <main className="main-content">
                {children}
            </main>
        </div>
    );
}

export default App;