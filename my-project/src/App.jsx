import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Loader } from 'lucide-react';
import { ToastProvider } from './components/ToastContext';

// Import Components
import Navbar from './components/Navbar';
import LandingPage from './pages/LandingPage';
import HomePage from './pages/HomePage';
import LessonsPage from './pages/LessonsPage';
import PracticePage from './pages/PracticePage';
import TestsPage from './pages/TestsPage';
import TestReviewPage from './pages/TestReviewPage';
import DocumentsPage from './pages/DocumentsPage';
import AdminDashboard from './pages/AdminDashboard';

// Import API Services
import {
    fetchLessonsAPI,
    fetchTestsAPI,
    fetchCurrentUserAPI,
    fetchUserTestHistory,
    fetchUserPracticeHistory,
    logoutAPI // [NEW] Import hàm logout
} from './services/api';

const ProtectedRoute = ({ user, children, adminOnly = false }) => {
    if (!user) {
        return <Navigate to="/" replace />;
    }
    if (adminOnly && user.role !== 'ADMIN') {
        return <Navigate to="/home" replace />;
    }
    return children;
};

const MainLayout = ({ user, onLogout, children }) => {
    const location = useLocation();
    const showNav = location.pathname !== '/';

    return (
        <div className="w-full min-h-screen bg-gray-50 text-gray-900 flex flex-col font-sans">
            {showNav && <Navbar user={user} onLogout={onLogout} />}
            <main className="flex-1 w-full">
                {children}
            </main>
        </div>
    );
};

export default function App() {
    // --- KHAI BÁO STATE ---
    const [user, setUser] = useState(null);
    const [isCheckingAuth, setIsCheckingAuth] = useState(true);

    const [lessons, setLessons] = useState([]);
    const [tests, setTests] = useState([]);

    const loadGlobalData = async () => {
        try {
            const [lessonsData, testsData] = await Promise.all([
                fetchLessonsAPI().catch(() => []),
                fetchTestsAPI().catch(() => [])
            ]);
            setLessons(lessonsData || []);
            setTests(testsData || []);
        } catch (error) {
            console.error("Lỗi tải dữ liệu hệ thống:", error);
        }
    };

    const refreshUserData = async () => {
        try {
            const userData = await fetchCurrentUserAPI();
            let fullUser = { ...userData };

            if (userData.role === 'USER') {
                try {
                    const [testHistory, practiceHistory] = await Promise.all([
                        fetchUserTestHistory(),
                        fetchUserPracticeHistory()
                    ]);
                    fullUser.results = testHistory || [];
                    fullUser.practiceSubmissions = practiceHistory || [];
                } catch (err) {
                    console.warn("Không tải được lịch sử user:", err);
                }
            }

            setUser(fullUser);
            localStorage.setItem('elearning_user', JSON.stringify(fullUser));
        } catch (error) {
            setUser(null);
            localStorage.removeItem('elearning_user');
        } finally {
            setIsCheckingAuth(false);
        }
    };

    useEffect(() => {
        const initApp = async () => {
            setIsCheckingAuth(true);
            loadGlobalData();

            const savedUser = localStorage.getItem('elearning_user');
            if (savedUser) {
                setUser(JSON.parse(savedUser));
                await refreshUserData();
            } else {
                await refreshUserData();
            }
        };

        initApp();
    }, []);

    const handleLoginSuccess = async (basicUserData) => {
        setUser(basicUserData);
        localStorage.setItem('elearning_user', JSON.stringify(basicUserData));
        await refreshUserData();
        loadGlobalData();
    };

    // [UPDATED] Hàm đăng xuất chuẩn: Gọi Server -> Xóa Client -> Chuyển trang
    const handleLogout = async () => {
        try {
            // 1. Báo cho Backend hủy session và xóa cookie JSESSIONID
            await logoutAPI();
        } catch (error) {
            console.error("Lỗi khi gọi API đăng xuất:", error);
        } finally {
            // 2. Dù API thành công hay lỗi, luôn xóa dữ liệu ở Client để thoát
            setUser(null);
            localStorage.removeItem('elearning_user');
            window.location.href = '/';
        }
    };

    const handleDataUpdate = () => {
        refreshUserData();
    };

    if (isCheckingAuth && !user) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-blue-50 gap-4">
                <Loader className="animate-spin text-blue-600" size={48} />
                <p className="text-blue-800 font-medium animate-pulse">Đang khởi động Russian Master...</p>
            </div>
        );
    }

    return (
        <ToastProvider>
            <BrowserRouter>
                <MainLayout user={user} onLogout={handleLogout}>
                    <Routes>
                        <Route
                            path="/"
                            element={
                                user ? <Navigate to={user.role === 'ADMIN' ? "/admin" : "/home"} replace />
                                    : <LandingPage onLoginSuccess={handleLoginSuccess} />
                            }
                        />

                        <Route
                            path="/admin"
                            element={
                                <ProtectedRoute user={user} adminOnly={true}>
                                    <AdminDashboard onDataChange={loadGlobalData} />
                                </ProtectedRoute>
                            }
                        />

                        <Route
                            path="/home"
                            element={
                                <ProtectedRoute user={user}>
                                    <HomePage user={user} lessons={lessons} tests={tests} />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/lessons"
                            element={
                                <ProtectedRoute user={user}>
                                    <LessonsPage lessons={lessons} />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/practices"
                            element={
                                <ProtectedRoute user={user}>
                                    <PracticePage user={user} onSavePractice={handleDataUpdate} />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/tests"
                            element={
                                <ProtectedRoute user={user}>
                                    <TestsPage tests={tests} user={user} onSaveResult={handleDataUpdate} />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/test-review"
                            element={
                                <ProtectedRoute user={user}>
                                    <TestReviewPage />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/documents"
                            element={
                                <ProtectedRoute user={user}>
                                    <DocumentsPage />
                                </ProtectedRoute>
                            }
                        />

                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                </MainLayout>
            </BrowserRouter>
        </ToastProvider>
    );
}