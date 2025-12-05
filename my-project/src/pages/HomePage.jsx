import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Trophy, Mic, Eye, CheckCircle, MessageSquare, PlayCircle, BookOpen,
    FileText, PenTool, Headphones, X, Clock
} from 'lucide-react';
// Import helper lấy URL file
import { getResourceUrl } from '../services/api';

const HomePage = ({ user, lessons, tests }) => {
    const navigate = useNavigate();

    // State cho Modal chi tiết bài luyện tập
    const [selectedPractice, setSelectedPractice] = useState(null);
    // State cho bộ lọc kỹ năng luyện tập ('ALL', 'SPEAKING', 'WRITING', 'READING', 'LISTENING')
    const [activeSkillTab, setActiveSkillTab] = useState('ALL');

    // --- SAFETY CHECK ---
    const safeTests = tests || [];
    const userResults = user?.results || [];
    const userPractices = user?.practiceSubmissions || [];

    // Thống kê
    const studentStats = {
        totalTests: safeTests.length,
        completedTests: userResults.length,
        avgScore: userResults.length > 0 ? (userResults.reduce((sum, r) => sum + r.score, 0) / userResults.length).toFixed(1) : '0',
    };

    // Hàm chuyển hướng đến trang xem lại bài thi
    const handleReviewClick = (result) => {
        navigate('/test-review', { state: { result } });
    };

    // Helper: Lọc bài luyện tập theo kỹ năng
    const getFilteredPractices = () => {
        if (activeSkillTab === 'ALL') return userPractices;
        return userPractices.filter(p => {
            const type = (p.type || "").toUpperCase();
            // Map các từ khóa tiếng Anh/Việt sang tab tương ứng
            if (activeSkillTab === 'SPEAKING') return type.includes('SPEAKING') || type.includes('NÓI');
            if (activeSkillTab === 'WRITING') return type.includes('WRITING') || type.includes('VIẾT');
            if (activeSkillTab === 'READING') return type.includes('READING') || type.includes('ĐỌC');
            if (activeSkillTab === 'LISTENING') return type.includes('LISTENING') || type.includes('NGHE');
            return false;
        });
    };

    const filteredPractices = getFilteredPractices();

    // Helper: Icon cho từng loại bài
    const getPracticeIcon = (type) => {
        const t = (type || "").toUpperCase();
        if (t.includes('SPEAKING') || t.includes('NÓI')) return <Mic size={18} className="text-purple-600"/>;
        if (t.includes('WRITING') || t.includes('VIẾT')) return <PenTool size={18} className="text-pink-600"/>;
        if (t.includes('READING') || t.includes('ĐỌC')) return <BookOpen size={18} className="text-blue-600"/>;
        return <Headphones size={18} className="text-green-600"/>;
    };

    // Component con: Thẻ thống kê
    const StatCard = ({ title, value, color, text, icon }) => (
        <div className={`p-4 rounded-xl shadow-md flex items-center space-x-4 ${color} hover:shadow-lg transition-shadow`}>
            <div className={`p-3 rounded-full ${text} bg-white bg-opacity-60`}>
                {icon}
            </div>
            <div>
                <p className={`text-sm font-medium ${text} opacity-80`}>{title}</p>
                <p className={`text-2xl font-bold ${text}`}>{value}</p>
            </div>
        </div>
    );

    return (
        <div className="container mx-auto max-w-[1600px] px-4 py-8 animate-fade-in pb-24">
            {/* 1. WELCOME BANNER */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-6 md:p-10 text-white shadow-xl relative overflow-hidden mb-8">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
                <div className="relative z-10">
                    <h1 className="text-3xl md:text-4xl font-bold mb-2">
                        Xin chào, {user?.fullName || 'Học viên'}! 👋
                    </h1>
                    <p className="text-blue-100 mb-6 text-lg max-w-2xl">
                        Tiếp tục hành trình chinh phục tiếng Nga của bạn hôm nay nhé.
                    </p>
                    <div className="flex flex-wrap gap-4">
                        <button onClick={() => navigate('/lessons')} className="bg-white text-blue-700 px-6 py-2.5 rounded-full font-bold hover:bg-yellow-400 hover:text-blue-900 transition-all shadow-md flex items-center gap-2">
                            <BookOpen size={20}/> Học bài mới
                        </button>
                        <button onClick={() => navigate('/tests')} className="bg-blue-800 bg-opacity-40 text-white px-6 py-2.5 rounded-full font-bold hover:bg-opacity-60 transition-all border border-blue-400 flex items-center gap-2">
                            <FileText size={20}/> Làm bài kiểm tra
                        </button>
                    </div>
                </div>
            </div>

            {/* 2. STATS GRID */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <StatCard title="Điểm trung bình" value={studentStats.avgScore} color="bg-green-100" text="text-green-700" icon={<Trophy size={24} />} />
                <StatCard title="Bài kiểm tra đã làm" value={`${studentStats.completedTests}/${studentStats.totalTests}`} color="bg-blue-100" text="text-blue-700" icon={<CheckCircle size={24} />} />
                <StatCard title="Bài luyện tập đã nộp" value={userPractices.length} color="bg-purple-100" text="text-purple-700" icon={<Mic size={24} />} />
            </div>

            {/* 3. MAIN CONTENT GRID */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                {/* --- CỘT TRÁI: KẾT QUẢ THI --- */}
                <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100 h-fit">
                    <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2 border-b pb-2">
                        <Trophy className="text-yellow-500" size={24}/> Kết quả thi gần đây
                    </h3>
                    <div className="space-y-4">
                        {userResults.length === 0 ? (
                            <p className="text-gray-500 italic text-center py-4">Bạn chưa làm bài kiểm tra nào.</p>
                        ) : (
                            userResults.slice(0, 5).map((result) => {
                                // Xử lý dữ liệu hiển thị (tương tự TestsPage)
                                const displayTitle = result.testTitle || result.test?.title || "Bài kiểm tra";
                                const displayDate = result.date || (result.createdAt ? new Date(result.createdAt).toLocaleDateString('vi-VN') : "N/A");
                                // Fix lỗi isReviewed cho bài thi (nếu có)
                                const isReviewed = result.isReviewed !== undefined ? result.isReviewed : (result.reviewed !== undefined ? result.reviewed : false);

                                return (
                                    <div key={result.id} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg hover:bg-blue-50 transition-colors border border-gray-100 group cursor-pointer" onClick={() => handleReviewClick(result)}>
                                        <div className="flex-1">
                                            <h4 className="font-bold text-gray-800 line-clamp-1 group-hover:text-blue-600 transition-colors">{displayTitle}</h4>
                                            <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                                                <span className="flex items-center gap-1"><Clock size={12}/> {displayDate}</span>
                                                <span className={`px-2 py-0.5 rounded font-bold ${isReviewed ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                                    {isReviewed ? 'Đã chấm' : 'Chờ chấm'}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
                                            <span className={`font-bold text-xl ${result.score >= 50 ? 'text-green-600' : 'text-red-500'}`}>
                                                {result.score}
                                            </span>
                                            <Eye size={20} className="text-gray-400 group-hover:text-blue-500" />
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* --- CỘT PHẢI: PHẢN HỒI LUYỆN TẬP --- */}
                <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100 h-fit min-h-[400px]">
                    <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2 border-b pb-2">
                        <MessageSquare className="text-purple-500" size={24}/> Phản hồi Luyện tập
                    </h3>

                    {/* Bộ lọc kỹ năng */}
                    <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
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
                                className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors border ${activeSkillTab === tab.id ? 'bg-purple-600 text-white border-purple-600' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Danh sách bài tập */}
                    <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                        {filteredPractices.length === 0 ? (
                            <p className="text-gray-500 italic text-center py-8">Chưa có bài tập nào mục này.</p>
                        ) : (
                            filteredPractices.map((prac) => {
                                // SỬA LỖI 1: Kiểm tra cả 2 trường hợp tên biến
                                const isReviewed = prac.isReviewed !== undefined ? prac.isReviewed : (prac.reviewed !== undefined ? prac.reviewed : false);

                                return (
                                    <div
                                        key={prac.id}
                                        onClick={() => setSelectedPractice(prac)}
                                        className="p-3 border rounded-xl bg-gray-50 hover:bg-purple-50 transition-colors cursor-pointer group relative"
                                    >
                                        <div className="flex justify-between items-center">
                                            <div className="flex items-center gap-2">
                                                <div className="bg-white p-1.5 rounded-full shadow-sm">
                                                    {getPracticeIcon(prac.type)}
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-gray-800 text-sm group-hover:text-purple-700 transition-colors line-clamp-1">{prac.title}</h4>
                                                    <p className="text-xs text-gray-500">{prac.date ? new Date(prac.date).toLocaleDateString('vi-VN') : 'Vừa xong'}</p>
                                                </div>
                                            </div>
                                            {/* Status Badge */}
                                            {isReviewed ? (
                                                <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1 border border-green-200 whitespace-nowrap">
                                                    <CheckCircle size={10}/> Đã chấm
                                                </span>
                                            ) : (
                                                <span className="bg-yellow-100 text-yellow-700 text-[10px] font-bold px-2 py-0.5 rounded border border-yellow-200 whitespace-nowrap">
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

            {/* --- POPUP CHI TIẾT BÀI LUYỆN TẬP --- */}
            {selectedPractice && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
                        {/* Popup Header */}
                        <div className="bg-purple-600 text-white p-4 flex justify-between items-center shrink-0">
                            <h3 className="font-bold text-lg flex items-center gap-2">
                                {getPracticeIcon(selectedPractice.type)} Chi tiết bài làm
                            </h3>
                            <button onClick={() => setSelectedPractice(null)} className="text-white/80 hover:text-white bg-white/10 p-1 rounded-full"><X size={20}/></button>
                        </div>

                        {/* Popup Content */}
                        <div className="flex-1 overflow-y-auto p-6">
                            <div className="mb-4">
                                <p className="text-xs font-bold text-gray-500 uppercase mb-1">Đề tài:</p>
                                <p className="font-bold text-gray-800 text-lg">{selectedPractice.title}</p>
                                <div className="flex gap-2 mt-1">
                                    <span className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-600">{selectedPractice.type}</span>
                                    <span className="text-xs text-gray-500 py-1">{selectedPractice.date || selectedPractice.createdAt}</span>
                                </div>
                            </div>

                            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 mb-6">
                                {/* Logic xác định là audio */}
                                {(() => {
                                    const isAudio = selectedPractice.content?.startsWith('/uploads/') ||
                                        selectedPractice.type?.toUpperCase().includes('SPEAKING') ||
                                        selectedPractice.type?.toUpperCase().includes('NÓI') ||
                                        selectedPractice.type?.toUpperCase().includes('READING') ||
                                        selectedPractice.type?.toUpperCase().includes('ĐỌC');

                                    return (
                                        <>
                                            <p className="text-xs font-bold text-blue-600 uppercase mb-2 flex items-center gap-2">
                                                {isAudio ? <Mic size={14}/> : <PenTool size={14}/>} Bài làm của bạn:
                                            </p>

                                            {isAudio ? (
                                                <div className="mt-2 bg-white p-3 rounded-lg border border-blue-100 flex items-center gap-3">
                                                    <div className="bg-blue-100 p-2 rounded-full text-blue-600">
                                                        <PlayCircle size={24}/>
                                                    </div>
                                                    <div className="flex-1">
                                                        <p className="text-xs font-bold text-gray-500 mb-1">File ghi âm</p>
                                                        {/* Sử dụng content làm src vì database lưu URL trong field content */}
                                                        <audio controls src={getResourceUrl(selectedPractice.content)} className="w-full h-8" />
                                                    </div>
                                                </div>
                                            ) : (
                                                <p className="text-gray-800 whitespace-pre-wrap font-serif leading-relaxed bg-white p-3 rounded border border-gray-200">
                                                    {selectedPractice.content || "(Không có nội dung)"}
                                                </p>
                                            )}
                                        </>
                                    );
                                })()}
                            </div>

                            {/* Feedback Section (SỬA LỖI 2: Tính toán lại biến isReviewed cho Popup) */}
                            {(() => {
                                const isPopupReviewed = selectedPractice.isReviewed !== undefined
                                    ? selectedPractice.isReviewed
                                    : (selectedPractice.reviewed !== undefined ? selectedPractice.reviewed : false);

                                return isPopupReviewed ? (
                                    <div className="p-4 rounded-xl border bg-green-50 border-green-200 animate-fade-in">
                                        <div className="flex items-center gap-2 mb-2">
                                            <MessageSquare size={18} className="text-green-600"/>
                                            <span className="font-bold text-green-800">Nhận xét của Giáo viên:</span>
                                        </div>
                                        <p className="text-gray-700 leading-relaxed whitespace-pre-line bg-white p-3 rounded border border-green-100">
                                            {selectedPractice.feedback || selectedPractice.adminFeedback}
                                        </p>
                                    </div>
                                ) : (
                                    <div className="p-4 rounded-xl border bg-yellow-50 border-yellow-200">
                                        <div className="flex items-center gap-2 mb-1">
                                            <Clock size={18} className="text-yellow-600"/>
                                            <span className="font-bold text-yellow-800">Trạng thái: Đang chờ chấm</span>
                                        </div>
                                        <p className="text-gray-500 italic text-sm pl-6">
                                            Bài làm của bạn đang được giáo viên xem xét. Vui lòng quay lại sau để xem nhận xét.
                                        </p>
                                    </div>
                                );
                            })()}
                        </div>

                        {/* Popup Footer */}
                        <div className="p-4 border-t bg-gray-50 flex justify-end">
                            <button onClick={() => setSelectedPractice(null)} className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold rounded-lg transition-colors">Đóng</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HomePage;