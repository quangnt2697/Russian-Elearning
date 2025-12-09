import React from 'react';
import { BookOpen, LogOut, Home, Book, PenTool, FileText } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';

const Navbar = ({ user, onLogout }) => {
    const navigate = useNavigate();
    const location = useLocation();

    // Hàm xử lý khi bấm vào Logo
    const handleLogoClick = () => {
        if (user && user.role === 'ADMIN') {
            navigate('/admin');
        } else {
            navigate('/home');
        }
    };

    // Helper để kiểm tra đường dẫn đang active để highlight
    const isActive = (path) => {
        return location.pathname === path
            ? "text-yellow-300 font-bold bg-blue-800/50 px-3 py-1 rounded-lg"
            : "hover:text-blue-200 px-3 py-1 transition-colors";
    };

    return (
        <nav className="bg-blue-700 text-white shadow-lg sticky top-0 z-50 w-full transition-all">
            <div className="container mx-auto px-4">
                <div className="flex justify-between items-center h-16">
                    {/* LOGO */}
                    <div className="flex items-center gap-2 cursor-pointer group" onClick={handleLogoClick}>
                        <BookOpen size={28} className="text-yellow-400 group-hover:scale-110 transition-transform" />
                        <span className="font-bold text-xl hidden md:block tracking-wide group-hover:text-yellow-100">RUSSIAN MASTER</span>
                    </div>

                    {/* NAVIGATION LINKS (Chỉ hiện khi đã login và không phải Admin) */}
                    {user && user.role !== 'ADMIN' && (
                        <div className="hidden md:flex items-center gap-2 text-sm font-medium">
                            <Link to="/home" className={isActive('/home')}>
                                <div className="flex items-center gap-1"><Home size={18} /> Trang chủ</div>
                            </Link>
                            <Link to="/lessons" className={isActive('/lessons')}>
                                <div className="flex items-center gap-1"><Book size={18} /> Bài học</div>
                            </Link>
                            <Link to="/practices" className={isActive('/practices')}>
                                <div className="flex items-center gap-1"><PenTool size={18} /> Luyện tập</div>
                            </Link>
                            <Link to="/tests" className={isActive('/tests')}>
                                <div className="flex items-center gap-1"><FileText size={18} /> Kiểm tra</div>
                            </Link>
                            <Link to="/documents" className={isActive('/documents')}>
                                <div className="flex items-center gap-1"><BookOpen size={18} /> Tài liệu</div>
                            </Link>
                        </div>
                    )}

                    {/* USER INFO & LOGOUT */}
                    <div className="flex items-center gap-4">
                        {user ? (
                            <div className="flex items-center gap-3 pl-4 border-l border-blue-500">
                                <div className="hidden md:block text-right">
                                    <p className="font-bold text-sm leading-none text-white">{user.fullName}</p>
                                    <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded mt-1 inline-block ${user.role === 'ADMIN' ? 'bg-red-500' : 'bg-yellow-500 text-blue-900'}`}>
                                        {user.role === 'ADMIN' ? 'Admin' : 'Học viên'}
                                    </span>
                                </div>
                                <button
                                    onClick={onLogout}
                                    className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-full shadow-md transition-all hover:scale-105 active:scale-95"
                                    title="Đăng xuất"
                                >
                                    <LogOut size={18} />
                                </button>
                            </div>
                        ) : (
                            <Link
                                to="/"
                                className="bg-white text-blue-700 hover:bg-yellow-400 hover:text-blue-900 px-6 py-2 rounded-full font-bold text-sm shadow-lg transition-all transform hover:-translate-y-0.5"
                            >
                                Đăng nhập
                            </Link>
                        )}
                    </div>
                </div>
            </div>

            {/* MOBILE MENU (Optional: Có thể thêm logic menu mobile ở đây nếu cần) */}
        </nav>
    );
};

export default Navbar;