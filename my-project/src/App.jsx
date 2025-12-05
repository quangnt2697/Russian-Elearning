import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';

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
    fetchUserTestHistory,      // API Mới
    fetchUserPracticeHistory   // API Mới
} from './services/api';

// --- COMPONENT: BẢO VỆ ROUTE (Chỉ cho phép User đã login) ---
const ProtectedRoute = ({ user, children, adminOnly = false }) => {
    if (!user) {
        return <Navigate to="/" replace />;
    }
    if (adminOnly && user.role !== 'ADMIN') {
        return <Navigate to="/home" replace />;
    }
    return children;
};

// --- COMPONENT: LAYOUT CHÍNH (Chứa Navbar) ---
const MainLayout = ({ user, onLogout, children }) => {
    const location = useLocation();
    // Chỉ hiển thị Navbar nếu KHÔNG PHẢI trang Landing ('/')
    const showNav = location.pathname !== '/';

    return (
        <div className="w-full min-h-screen bg-gray-50 text-gray-900 flex flex-col">
            {showNav && <Navbar user={user} onLogout={onLogout} />}
            <main className="flex-1 pb-12 w-full">
                {children}
            </main>
        </div>
    );
};

export default function App() {
    const [user, setUser] = useState(null);

    // State dữ liệu chung (Bài học, Đề thi công khai)
    const [lessons, setLessons] = useState([]);
    const [tests, setTests] = useState([]);

    // --- 1. HÀM TẢI DỮ LIỆU CHUNG (Lessons, Tests) ---
    const loadGlobalData = async () => {
        try {
            const [lessonsData, testsData] = await Promise.all([
                fetchLessonsAPI(),
                fetchTestsAPI()
            ]);
            if (lessonsData) setLessons(lessonsData);
            if (testsData) setTests(testsData);
        } catch (error) {
            console.error("Lỗi tải dữ liệu hệ thống:", error);
        }
    };

    // --- 2. HÀM TẢI DỮ LIỆU NGƯỜI DÙNG (User Info + History) ---
    // Đây là hàm quan trọng nhất để fix lỗi mất dữ liệu
    const refreshUserData = async () => {
        try {
            // A. Lấy thông tin cơ bản (Role, Name...)
            const userData = await fetchCurrentUserAPI();

            let fullUser = { ...userData };

            // B. Nếu là Học viên, lấy thêm lịch sử làm bài
            if (userData.role === 'USER') {
                try {
                    const [testHistory, practiceHistory] = await Promise.all([
                        fetchUserTestHistory(),
                        fetchUserPracticeHistory()
                    ]);

                    // Gộp lịch sử vào object User
                    fullUser.results = testHistory || [];
                    fullUser.practiceSubmissions = practiceHistory || [];

                    console.log("Đã tải lịch sử:", fullUser.results.length, "bài thi,", fullUser.practiceSubmissions.length, "bài tập.");
                } catch (historyError) {
                    console.error("Lỗi tải lịch sử cá nhân:", historyError);
                    // Fallback: Để mảng rỗng để không crash UI
                    fullUser.results = [];
                    fullUser.practiceSubmissions = [];
                }
            }

            // C. Cập nhật State và LocalStorage
            setUser(fullUser);
            localStorage.setItem('elearning_user', JSON.stringify(fullUser));

        } catch (error) {
            console.error("Phiên đăng nhập không hợp lệ hoặc đã hết hạn.");
            setUser(null);
            localStorage.removeItem('elearning_user');
        }
    };

    // --- EFFECT: KHỞI TẠO APP ---
    useEffect(() => {
        // 1. Tải dữ liệu chung ngay lập tức
        loadGlobalData();

        // 2. Kiểm tra phiên đăng nhập cũ
        const savedUser = localStorage.getItem('elearning_user');
        if (savedUser) {
            try {
                // Hiển thị tạm dữ liệu cũ để UI render nhanh (Optimistic)
                const parsedUser = JSON.parse(savedUser);
                setUser(parsedUser);

                // Gọi API lấy dữ liệu mới nhất (Background refresh)
                refreshUserData();
            } catch (e) {
                localStorage.removeItem('elearning_user');
            }
        }
    }, []);

    // --- HANDLERS ---
    const handleLoginSuccess = async (basicUserData) => {
        // Lưu tạm user cơ bản
        setUser(basicUserData);
        localStorage.setItem('elearning_user', JSON.stringify(basicUserData));

        // Tải ngay lịch sử đầy đủ
        await refreshUserData();
        loadGlobalData();
    };

    const handleLogout = () => {
        setUser(null);
        localStorage.removeItem('elearning_user');
        window.location.href = '/';
    };

    // Callback khi nộp bài xong -> Tải lại dữ liệu user để cập nhật điểm/trạng thái
    const handleDataUpdate = () => {
        refreshUserData();
    };

    return (
        <BrowserRouter>
            <MainLayout user={user} onLogout={handleLogout}>
                <Routes>
                    {/* TRANG LANDING (LOGIN/REGISTER) */}
                    <Route
                        path="/"
                        element={
                            user ? <Navigate to={user.role === 'ADMIN' ? "/admin" : "/home"} replace />
                                : <LandingPage onLoginSuccess={handleLoginSuccess} />
                        }
                    />

                    {/* TRANG ADMIN */}
                    <Route
                        path="/admin"
                        element={
                            <ProtectedRoute user={user} adminOnly={true}>
                                <AdminDashboard onDataChange={loadGlobalData} />
                            </ProtectedRoute>
                        }
                    />

                    {/* CÁC TRANG HỌC VIÊN */}
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
                                {/* Truyền callback để reload sau khi nộp bài */}
                                <PracticePage user={user} onSavePractice={handleDataUpdate} />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/tests"
                        element={
                            <ProtectedRoute user={user}>
                                {/* Truyền callback để reload sau khi nộp bài */}
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

                    {/* TRANG 404 / REDIRECT */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </MainLayout>
        </BrowserRouter>
    );
}