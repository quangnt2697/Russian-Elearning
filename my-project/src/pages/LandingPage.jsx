import React, { useState } from 'react';
import { BookOpen, Users, Trophy, ArrowRight, X } from 'lucide-react';
import { loginAPI, registerAPI } from '../services/api';

const LandingPage = ({ onLoginSuccess }) => {
    const [showModal, setShowModal] = useState(false);
    const [isLogin, setIsLogin] = useState(true);
    const [formData, setFormData] = useState({ fullName: '', username: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            let user;
            if (isLogin) {
                user = await loginAPI(formData.username, formData.password);
            } else {
                user = await registerAPI(formData.fullName, formData.username, formData.password);
                alert("Đăng ký thành công! Vui lòng đăng nhập.");
                setIsLogin(true);
                setLoading(false);
                return;
            }
            onLoginSuccess(user);
        } catch (err) {
            setError(err.response?.data || "Có lỗi xảy ra, vui lòng thử lại.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 font-sans">
            {/* Hero Section */}
            <div className="container mx-auto px-6 py-20 flex flex-col md:flex-row items-center">
                <div className="md:w-1/2 mb-10 md:mb-0">
                    <h1 className="text-5xl md:text-6xl font-extrabold text-blue-900 mb-6 leading-tight">
                        Chinh phục <br/><span className="text-blue-600">Tiếng Nga</span> dễ dàng
                    </h1>
                    <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                        Nền tảng học tập trực tuyến toàn diện với lộ trình bài bản,
                        bài tập tương tác và hệ thống đánh giá năng lực chuẩn xác.
                    </p>
                    <button
                        onClick={() => setShowModal(true)}
                        className="bg-yellow-400 hover:bg-yellow-500 text-blue-900 font-bold py-4 px-8 rounded-full text-lg shadow-xl hover:shadow-2xl transition transform hover:-translate-y-1 flex items-center gap-2"
                    >
                        Bắt đầu học ngay <ArrowRight size={24}/>
                    </button>
                </div>
                <div className="md:w-1/2 flex justify-center">
                    {/* Placeholder hình ảnh minh họa */}
                    <div className="relative w-full max-w-lg aspect-square bg-blue-100 rounded-full flex items-center justify-center opacity-80 animate-pulse">
                        <BookOpen size={120} className="text-blue-300"/>
                        <div className="absolute top-0 right-10 bg-white p-4 rounded-xl shadow-lg animate-bounce">
                            <Trophy className="text-yellow-500 w-8 h-8"/>
                        </div>
                        <div className="absolute bottom-10 left-0 bg-white p-4 rounded-xl shadow-lg">
                            <Users className="text-green-500 w-8 h-8"/>
                        </div>
                    </div>
                </div>
            </div>

            {/* Features Section */}
            <div className="bg-white py-20">
                <div className="container mx-auto px-6">
                    <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">Tại sao chọn Russian Master?</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[
                            { icon: <BookOpen size={32}/>, title: "Bài giảng chi tiết", desc: "Hệ thống lý thuyết ngữ pháp và từ vựng được biên soạn kỹ lưỡng." },
                            { icon: <Trophy size={32}/>, title: "Kiểm tra đánh giá", desc: "Ngân hàng đề thi phong phú giúp bạn tự đánh giá năng lực thường xuyên." },
                            { icon: <Users size={32}/>, title: "Cộng đồng học tập", desc: "Trao đổi, thảo luận và nhận hỗ trợ từ giáo viên và bạn bè." }
                        ].map((item, idx) => (
                            <div key={idx} className="p-8 rounded-2xl bg-gray-50 hover:bg-blue-50 transition-colors text-center border border-gray-100">
                                <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center text-blue-600 mx-auto mb-4">
                                    {item.icon}
                                </div>
                                <h3 className="text-xl font-bold text-gray-800 mb-2">{item.title}</h3>
                                <p className="text-gray-500">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Modal Đăng nhập/Đăng ký */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fade-in">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden relative">
                        <button onClick={() => setShowModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><X size={24}/></button>

                        <div className="p-8">
                            <h2 className="text-2xl font-bold text-gray-800 text-center mb-6">
                                {isLogin ? "Chào mừng trở lại!" : "Tạo tài khoản mới"}
                            </h2>

                            {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm text-center">{error}</div>}

                            <form onSubmit={handleSubmit} className="space-y-4">
                                {!isLogin && (
                                    <div>
                                        <label className="block text-xl font-medium text-gray-700 mb-1">Họ và tên</label>
                                        <input
                                            type="text" required
                                            className="w-full border-2 border-gray-200 px-4 py-2.5 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all font-medium text-white"
                                            value={formData.fullName}
                                            onChange={e => setFormData({...formData, fullName: e.target.value})}
                                            placeholder="Nguyễn Văn A"
                                        />
                                    </div>
                                )}
                                <div>
                                    <label className="block text-xl font-medium text-gray-700 mb-1">Tên đăng nhập</label>
                                    <input
                                        type="text" required
                                        className="w-full border-2 border-gray-200 px-4 py-2.5 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all font-medium text-white"
                                        value={formData.username}
                                        onChange={e => setFormData({...formData, username: e.target.value})}
                                        placeholder="user123"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xl font-medium text-gray-700 mb-1">Mật khẩu</label>
                                    <input
                                        type="password" required
                                        className="w-full border-2 border-gray-200 px-4 py-2.5 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all font-medium text-white"
                                        value={formData.password}
                                        onChange={e => setFormData({...formData, password: e.target.value})}
                                        placeholder="••••••••"
                                    />
                                </div>

                                <button
                                    type="submit" disabled={loading}
                                    className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition-colors mt-2 disabled:bg-gray-400"
                                >
                                    {loading ? "Đang xử lý..." : (isLogin ? "Đăng nhập" : "Đăng ký")}
                                </button>
                            </form>

                            <div className="mt-6 text-center text-sm text-gray-500">
                                {isLogin ? "Chưa có tài khoản? " : "Đã có tài khoản? "}
                                <button onClick={() => { setIsLogin(!isLogin); setError(''); }} className="bg-blue-600 text-white hover:bg-blue-700 font-bold">
                                    {isLogin ? "Đăng ký ngay" : "Đăng nhập ngay"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LandingPage;
