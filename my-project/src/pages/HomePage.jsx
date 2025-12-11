import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Trophy, Mic, Eye, CheckCircle, MessageSquare, PlayCircle, BookOpen,
    FileText, PenTool, Headphones, X, Clock, Star, Activity, BarChart2
} from 'lucide-react';
// Import helper lấy URL file
import { getResourceUrl } from '../services/api';

const HomePage = ({ user, lessons, tests }) => {
    const navigate = useNavigate();

    // State cho Modal chi tiết bài luyện tập
    const [selectedPractice, setSelectedPractice] = useState(null);
    // State cho bộ lọc kỹ năng luyện tập
    const [activeSkillTab, setActiveSkillTab] = useState('ALL');

    // --- SAFETY CHECK & DATA PROCESSING ---
    const safeTests = tests || [];
    const userResults = user?.results || [];
    const userPractices = user?.practiceSubmissions || [];

    // --- 1. LOGIC TÍNH TOÁN LEVEL VÀ THỐNG KÊ (MỚI) ---
    const statsData = useMemo(() => {
        const totalAttempts = userResults.length;

        // Tính điểm trung bình (Ưu tiên dùng weightedScore nếu có, không thì dùng score thường)
        const avgScore = totalAttempts > 0
            ? (userResults.reduce((sum, r) => sum + (r.totalWeightedScore || r.score || 0), 0) / totalAttempts).toFixed(1)
            : 0;

        // Tìm điểm cao nhất
        const maxScore = totalAttempts > 0
            ? Math.max(...userResults.map(r => r.totalWeightedScore || r.score || 0))
            : 0;

        // Logic quy đổi CEFR (Khớp với Backend)
        const getLevelInfo = (score) => {
            if (score >= 95) return { label: 'C2', name: 'Mastery', color: 'bg-fuchsia-600', text: 'text-fuchsia-600', gradient: 'from-fuchsia-500 to-pink-600' };
            if (score >= 80) return { label: 'C1', name: 'Advanced', color: 'bg-purple-600', text: 'text-purple-600', gradient: 'from-purple-500 to-indigo-600' };
            if (score >= 60) return { label: 'B2', name: 'Upper Intermediate', color: 'bg-indigo-600', text: 'text-indigo-600', gradient: 'from-indigo-500 to-blue-600' };
            if (score >= 40) return { label: 'B1', name: 'Intermediate', color: 'bg-blue-500', text: 'text-blue-600', gradient: 'from-blue-400 to-cyan-500' };
            if (score >= 20) return { label: 'A2', name: 'Elementary', color: 'bg-green-500', text: 'text-green-600', gradient: 'from-green-400 to-emerald-500' };
            return { label: 'A1', name: 'Beginner', color: 'bg-yellow-500', text: 'text-yellow-600', gradient: 'from-yellow-400 to-orange-500' };
        };

        const currentLevel = getLevelInfo(maxScore);

        return {
            totalAttempts,
            avgScore,
            maxScore,
            currentLevel
        };
    }, [userResults]);

    // Hàm chuyển hướng đến trang xem lại bài thi
    const handleReviewClick = (result) => {
        navigate('/test-review', { state: { result } });
    };

    // Helper: Lọc bài luyện tập
    const getFilteredPractices = () => {
        if (activeSkillTab === 'ALL') return userPractices;
        return userPractices.filter(p => {
            const type = (p.type || "").toUpperCase();
            if (activeSkillTab === 'SPEAKING') return type.includes('SPEAKING') || type.includes('NÓI');
            if (activeSkillTab === 'WRITING') return type.includes('WRITING') || type.includes('VIẾT');
            if (activeSkillTab === 'READING') return type.includes('READING') || type.includes('ĐỌC');
            if (activeSkillTab === 'LISTENING') return type.includes('LISTENING') || type.includes('NGHE');
            return false;
        });
    };
    const filteredPractices = getFilteredPractices();

    const getPracticeIcon = (type) => {
        const t = (type || "").toUpperCase();
        if (t.includes('SPEAKING') || t.includes('NÓI')) return <Mic size={18} className="text-purple-600"/>;
        if (t.includes('WRITING') || t.includes('VIẾT')) return <PenTool size={18} className="text-pink-600"/>;
        if (t.includes('READING') || t.includes('ĐỌC')) return <BookOpen size={18} className="text-blue-600"/>;
        return <Headphones size={18} className="text-green-600"/>;
    };

    // --- SUB-COMPONENT: STAT CARD ---
    const StatCard = ({ title, value, subtext, icon, colorClass }) => (
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow flex items-start gap-4">
            <div className={`p-3 rounded-xl ${colorClass} bg-opacity-10`}>
                {React.cloneElement(icon, { className: colorClass })}
            </div>
            <div>
                <p className="text-gray-500 text-sm font-medium mb-1">{title}</p>
                <h4 className="text-2xl font-bold text-gray-800">{value}</h4>
                {subtext && <p className="text-xs text-gray-400 mt-1">{subtext}</p>}
            </div>
        </div>
    );

    return (
        <div className="container mx-auto max-w-[1600px] px-4 py-8 animate-fade-in pb-24">

            {/* 1. WELCOME BANNER & LEVEL BADGE */}
            <div className={`bg-gradient-to-r ${statsData.currentLevel.gradient} rounded-3xl p-8 text-white shadow-xl relative overflow-hidden mb-10`}>
                <div className="absolute top-0 right-0 w-96 h-96 bg-white opacity-10 rounded-full blur-3xl transform translate-x-1/3 -translate-y-1/2"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-black opacity-5 rounded-full blur-2xl transform -translate-x-1/2 translate-y-1/2"></div>

                <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <span className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border border-white/30">
                                Dashboard học viên
                            </span>
                        </div>
                        <h1 className="text-3xl md:text-5xl font-bold mb-4">
                            Xin chào, {user?.fullName || 'Bạn'}! 👋
                        </h1>
                        <p className="text-white/90 text-lg max-w-xl leading-relaxed">
                            Hôm nay là một ngày tuyệt vời để nâng trình độ tiếng Nga của bạn lên một tầm cao mới.
                        </p>
                        <div className="flex flex-wrap gap-3 mt-6">
                            <button onClick={() => navigate('/lessons')} className="bg-white text-gray-900 px-6 py-3 rounded-xl font-bold hover:bg-yellow-400 transition-all shadow-lg flex items-center gap-2">
                                <BookOpen size={20}/> Học bài mới
                            </button>
                            <button onClick={() => navigate('/tests')} className="bg-black/20 hover:bg-black/30 text-white px-6 py-3 rounded-xl font-bold transition-all border border-white/30 backdrop-blur-sm flex items-center gap-2">
                                <FileText size={20}/> Làm bài kiểm tra
                            </button>
                        </div>
                    </div>

                    {/* LEVEL DISPLAY CARD */}
                    <div className="bg-white/10 backdrop-blur-md border border-white/20 p-6 rounded-2xl flex flex-col items-center min-w-[200px] text-center shadow-lg transform hover:scale-105 transition-transform">
                        <p className="text-sm font-medium text-white/80 uppercase tracking-widest mb-2">Trình độ hiện tại</p>
                        <div className="text-6xl font-black text-white drop-shadow-md mb-1">
                            {statsData.currentLevel.label}
                        </div>
                        <div className="bg-white text-gray-900 px-3 py-1 rounded-full text-xs font-bold shadow-sm">
                            {statsData.currentLevel.name}
                        </div>
                    </div>
                </div>
            </div>

            {/* 2. STATS GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                <StatCard
                    title="Tổng số bài thi"
                    value={statsData.totalAttempts}
                    subtext="Lần làm bài kiểm tra"
                    icon={<Activity size={24} />}
                    colorClass="text-blue-600"
                />
                <StatCard
                    title="Điểm trung bình"
                    value={statsData.avgScore}
                    subtext="Trên thang điểm 100"
                    icon={<BarChart2 size={24} />}
                    colorClass="text-green-600"
                />
                <StatCard
                    title="Điểm cao nhất"
                    value={statsData.maxScore}
                    subtext={`Đạt mức ${statsData.currentLevel.label}`}
                    icon={<Trophy size={24} />}
                    colorClass="text-yellow-500"
                />
                <StatCard
                    title="Bài luyện tập"
                    value={userPractices.length}
                    subtext="Đã nộp cho giáo viên"
                    icon={<Mic size={24} />}
                    colorClass="text-purple-600"
                />
            </div>

            {/* 3. MAIN CONTENT GRID */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                {/* --- CỘT TRÁI: LỊCH SỬ THI & TIẾN ĐỘ --- */}
                <div className="space-y-6">
                    {/* Progress Chart Visualization */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                        <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                            <Activity className="text-blue-500" size={20}/> Biểu đồ năng lực
                        </h3>
                        {/* Thanh CEFR mô phỏng */}
                        <div className="relative pt-6 pb-2">
                            <div className="h-4 bg-gray-100 rounded-full overflow-hidden flex">
                                <div className="w-[20%] bg-yellow-400/30 border-r border-white"></div> {/* A1 */}
                                <div className="w-[20%] bg-green-400/30 border-r border-white"></div> {/* A2 */}
                                <div className="w-[20%] bg-blue-400/30 border-r border-white"></div> {/* B1 */}
                                <div className="w-[20%] bg-indigo-400/30 border-r border-white"></div> {/* B2 */}
                                <div className="w-[20%] bg-purple-400/30"></div> {/* C1/C2 */}
                            </div>

                            {/* Indicator con trỏ điểm */}
                            <div
                                className="absolute top-0 transition-all duration-1000 ease-out flex flex-col items-center"
                                style={{ left: `${Math.min(statsData.maxScore, 100)}%`, transform: 'translateX(-50%)' }}
                            >
                                <div className="bg-gray-800 text-white text-[10px] font-bold px-2 py-1 rounded mb-1 whitespace-nowrap">
                                    {statsData.maxScore} điểm
                                </div>
                                <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-gray-800"></div>
                            </div>

                            <div className="flex justify-between text-xs font-bold text-gray-400 mt-2 px-1">
                                <span>A1</span>
                                <span>A2</span>
                                <span>B1</span>
                                <span>B2</span>
                                <span>C1+</span>
                            </div>
                        </div>
                    </div>

                    {/* Danh sách kết quả thi */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <Clock className="text-gray-500" size={20}/> Lịch sử làm bài
                        </h3>
                        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                            {userResults.length === 0 ? (
                                <div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                                    <p className="text-gray-500 mb-2">Chưa có dữ liệu bài thi</p>
                                    <button onClick={() => navigate('/tests')} className="text-blue-600 font-bold text-sm hover:underline">Làm bài test ngay</button>
                                </div>
                            ) : (
                                [...userResults].reverse().map((result, index) => {
                                    const displayTitle = result.testTitle || result.test?.title || "Bài kiểm tra năng lực";
                                    const displayDate = result.date || (result.createdAt ? new Date(result.createdAt).toLocaleDateString('vi-VN') : "N/A");
                                    const score = result.totalWeightedScore || result.score || 0;
                                    // Xác định màu điểm số
                                    let scoreColor = score >= 80 ? 'text-green-600' : score >= 50 ? 'text-blue-600' : 'text-orange-500';

                                    return (
                                        <div key={result.id || index} className="flex justify-between items-center p-4 bg-gray-50 rounded-xl hover:bg-blue-50/50 transition-all border border-gray-100 group cursor-pointer" onClick={() => handleReviewClick(result)}>
                                            <div>
                                                <h4 className="font-bold text-gray-800 text-sm group-hover:text-blue-600 transition-colors">{displayTitle}</h4>
                                                <p className="text-xs text-gray-400 mt-1">{displayDate}</p>
                                            </div>
                                            <div className="text-right">
                                                <div className={`text-xl font-black ${scoreColor}`}>
                                                    {score}
                                                </div>
                                                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Điểm số</div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>

                {/* --- CỘT PHẢI: PHẢN HỒI LUYỆN TẬP (GIỮ NGUYÊN CODE CŨ CÓ CẢI TIẾN UI) --- */}
                <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100 h-fit">
                    <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
                        <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                            <MessageSquare className="text-purple-500" size={20}/> Luyện tập & Phản hồi
                        </h3>
                        <span className="bg-purple-100 text-purple-700 text-xs font-bold px-2 py-1 rounded-full">{userPractices.length} bài</span>
                    </div>

                    {/* Bộ lọc kỹ năng */}
                    <div className="flex gap-2 mb-4 overflow-x-auto pb-2 scrollbar-hide">
                        {[
                            { id: 'ALL', label: 'Tất cả' },
                            { id: 'SPEAKING', label: 'Nói' },
                            { id: 'LISTENING', label: 'Nghe' },
                            { id: 'READING', label: 'Đọc' },
                            { id: 'WRITING', label: 'Viết' }
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveSkillTab(tab.id)}
                                className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all border ${activeSkillTab === tab.id ? 'bg-gray-900 text-white border-gray-900 shadow-md' : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'}`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Danh sách bài tập */}
                    <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                        {filteredPractices.length === 0 ? (
                            <div className="text-center py-10">
                                <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
                                    <PenTool className="text-gray-300" size={24}/>
                                </div>
                                <p className="text-gray-400 text-sm">Chưa có bài tập nào ở mục này.</p>
                            </div>
                        ) : (
                            filteredPractices.map((prac) => {
                                const isReviewed = prac.isReviewed !== undefined ? prac.isReviewed : (prac.reviewed !== undefined ? prac.reviewed : false);

                                return (
                                    <div
                                        key={prac.id}
                                        onClick={() => setSelectedPractice(prac)}
                                        className="p-4 border border-gray-100 rounded-xl bg-white hover:border-purple-200 hover:shadow-md transition-all cursor-pointer group"
                                    >
                                        <div className="flex justify-between items-start">
                                            <div className="flex gap-3">
                                                <div className="bg-gray-50 p-2.5 rounded-lg h-fit group-hover:bg-purple-50 transition-colors">
                                                    {getPracticeIcon(prac.type)}
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-gray-800 text-sm group-hover:text-purple-700 transition-colors line-clamp-1 mb-1">{prac.title}</h4>
                                                    <p className="text-xs text-gray-400">{prac.date ? new Date(prac.date).toLocaleDateString('vi-VN') : 'Vừa xong'}</p>
                                                </div>
                                            </div>
                                            {isReviewed ? (
                                                <span className="bg-green-50 text-green-700 text-[10px] font-bold px-2 py-1 rounded border border-green-100 flex items-center gap-1">
                                                    <CheckCircle size={10}/> Đã chấm
                                                </span>
                                            ) : (
                                                <span className="bg-yellow-50 text-yellow-700 text-[10px] font-bold px-2 py-1 rounded border border-yellow-100">
                                                    Chờ chấm
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>

            {/* --- POPUP MODAL (Giữ nguyên logic cũ nhưng làm đẹp hơn) --- */}
            {selectedPractice && (
                <div className="fixed inset-0 bg-gray-900/40 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
                        <div className="bg-white p-5 border-b border-gray-100 flex justify-between items-center">
                            <h3 className="font-bold text-xl flex items-center gap-2 text-gray-800">
                                {getPracticeIcon(selectedPractice.type)} Chi tiết bài làm
                            </h3>
                            <button onClick={() => setSelectedPractice(null)} className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-full transition-colors"><X size={20}/></button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 bg-gray-50/50">
                            {/* Nội dung popup giữ nguyên logic hiển thị audio/text */}
                            <div className="mb-6">
                                <h4 className="font-bold text-gray-900 text-lg mb-1">{selectedPractice.title}</h4>
                                <div className="flex gap-2">
                                    <span className="text-xs bg-gray-200 px-2 py-1 rounded text-gray-600 font-medium">{selectedPractice.type}</span>
                                    <span className="text-xs text-gray-400 py-1">{selectedPractice.date}</span>
                                </div>
                            </div>

                            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm mb-6">
                                {(() => {
                                    const isAudio = selectedPractice.content?.startsWith('/uploads/') ||
                                        (selectedPractice.type || "").toUpperCase().includes('SPEAKING') ||
                                        (selectedPractice.type || "").toUpperCase().includes('NÓI');

                                    return (
                                        <>
                                            <p className="text-xs font-bold text-gray-400 uppercase mb-3 flex items-center gap-2">
                                                Nội dung bài làm
                                            </p>
                                            {isAudio ? (
                                                <div className="flex items-center gap-3 bg-blue-50 p-3 rounded-lg border border-blue-100">
                                                    <div className="bg-blue-500 text-white p-2 rounded-full"><PlayCircle size={20}/></div>
                                                    <audio controls src={getResourceUrl(selectedPractice.content)} className="w-full h-8" />
                                                </div>
                                            ) : (
                                                <p className="text-gray-800 whitespace-pre-wrap font-serif leading-relaxed">
                                                    {selectedPractice.content || "(Không có nội dung)"}
                                                </p>
                                            )}
                                        </>
                                    );
                                })()}
                            </div>

                            {(() => {
                                const isPopupReviewed = selectedPractice.isReviewed !== undefined ? selectedPractice.isReviewed : (selectedPractice.reviewed !== undefined ? selectedPractice.reviewed : false);
                                return isPopupReviewed ? (
                                    <div className="p-5 rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 border border-green-100">
                                        <div className="flex items-center gap-2 mb-3">
                                            <Star size={18} className="text-green-600 fill-green-600"/>
                                            <span className="font-bold text-green-800">Nhận xét của Giáo viên</span>
                                        </div>
                                        <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                                            {selectedPractice.feedback || selectedPractice.adminFeedback}
                                        </p>
                                    </div>
                                ) : (
                                    <div className="p-5 rounded-xl bg-yellow-50 border border-yellow-100 flex items-start gap-3">
                                        <Clock size={20} className="text-yellow-600 mt-1"/>
                                        <div>
                                            <span className="font-bold text-yellow-800 block mb-1">Đang chờ chấm</span>
                                            <p className="text-yellow-700/80 text-sm">
                                                Giáo viên sẽ sớm xem bài và gửi phản hồi cho bạn.
                                            </p>
                                        </div>
                                    </div>
                                );
                            })()}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HomePage;