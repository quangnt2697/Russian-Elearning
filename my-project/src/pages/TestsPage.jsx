import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, Trophy, FileText, CheckCircle, History, PlayCircle } from 'lucide-react';
// Import API
import { submitTestAPI, getResourceUrl } from '../services/api';

// Helper: Format thời gian giây -> MM:SS
const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
};

const TestsPage = ({ tests, user, onSaveResult }) => {
    const navigate = useNavigate();

    const [activeTest, setActiveTest] = useState(null);
    const [isDoing, setIsDoing] = useState(false);
    const [timeLeft, setTimeLeft] = useState(0);
    const [userAnswers, setUserAnswers] = useState({});

    // --- EFFECT: ĐẾM NGƯỢC THỜI GIAN ---
    useEffect(() => {
        let timer;
        if (isDoing && timeLeft > 0) {
            timer = setInterval(() => {
                setTimeLeft((prev) => {
                    if (prev <= 1) {
                        handleForceSubmit(); // Hết giờ tự nộp
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [isDoing, timeLeft]);

    // --- HANDLER: BẮT ĐẦU LÀM BÀI ---
    const handleStartTest = (test) => {
        let parsedTest = { ...test };

        // Parse questionsData từ JSON string nếu cần
        if (typeof test.questionsData === 'string') {
            try {
                parsedTest.questions = JSON.parse(test.questionsData);
            } catch (e) {
                console.error("Lỗi parse câu hỏi:", e);
                parsedTest.questions = [];
            }
        } else if (test.questions) {
            parsedTest.questions = test.questions;
        }

        if (!parsedTest.questions || parsedTest.questions.length === 0) {
            alert("Đề thi này chưa có câu hỏi hoặc dữ liệu bị lỗi!");
            return;
        }

        setActiveTest(parsedTest);
        setTimeLeft(parsedTest.duration || 600);
        setUserAnswers({});
        setIsDoing(true);
    };

    // --- HANDLER: CHỌN ĐÁP ÁN ---
    const handleAnswer = (qId, value) => {
        setUserAnswers(prev => ({ ...prev, [qId]: value }));
    };

    // --- HANDLER: NỘP BÀI ---
    const handleForceSubmit = async () => {
        setIsDoing(false);
        if (!activeTest) return;

        let score = 0;
        let total = activeTest.questions.length;
        activeTest.questions.forEach(q => {
            if (q.type === 'quiz' && String(userAnswers[q.id]) === String(q.correct)) {
                score++;
            }
        });
        const finalScore = total === 0 ? 0 : Math.round((score / total) * 100);

        try {
            const payload = {
                testId: activeTest.id,
                score: finalScore,
                userAnswers: JSON.stringify(userAnswers)
            };

            await submitTestAPI(payload);

            const resultData = {
                id: Date.now(),
                testId: activeTest.id,
                testTitle: activeTest.title,
                score: finalScore,
                total: 100,
                date: new Date().toLocaleDateString('vi-VN'),
                isReviewed: false,
                questions: activeTest.questions.map(q => ({
                    ...q,
                    userAnswer: userAnswers[q.id]
                }))
            };

            onSaveResult(resultData);
            alert(`Nộp bài thành công!\nĐiểm số của bạn: ${finalScore}/100`);

        } catch (error) {
            console.error("Lỗi nộp bài:", error);
            alert("Đã có lỗi xảy ra khi lưu kết quả. Vui lòng kiểm tra kết nối!");
        } finally {
            setActiveTest(null);
        }
    };

    const handleSubmitButton = () => {
        if (window.confirm("Bạn chắc chắn muốn nộp bài?")) {
            handleForceSubmit();
        }
    };

    // --- VIEW: MÀN HÌNH LÀM BÀI ---
    if (isDoing && activeTest) {
        return (
            <div className="fixed inset-0 z-50  bg-black/60 backdrop-blur-sm flex items-center justify-center p-0 md:p-4 animate-fade-in">
                <div className="bg-white h-full md:h-auto md:max-h-[90vh] md:max-w-6xl md:rounded-2xl shadow-2xl flex flex-col overflow-hidden">
                    {/* Header */}
                    <div className="bg-blue-700 text-white p-4 flex justify-between items-center shrink-0 shadow-md z-10">
                        <div>
                            <h2 className="font-bold text-lg md:text-xl line-clamp-1">{activeTest.title}</h2>
                            <p className="text-blue-100 text-xs md:text-sm">Tổng câu hỏi: {activeTest.questions.length}</p>
                        </div>
                        <div className={`flex items-center gap-2 font-mono text-xl font-bold bg-white/20 px-4 py-2 rounded-lg border border-white/30 ${timeLeft < 60 ? 'text-red-300 animate-pulse border-red-400' : ''}`}>
                            <Clock size={20}/> {formatTime(timeLeft)}
                        </div>
                    </div>

                    {/* Nội dung */}
                    <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-gray-50 custom-scrollbar">
                        {activeTest.audioUrl && (
                            <div className="mb-6 bg-white p-4 rounded-xl shadow-sm border border-blue-100 sticky top-0 z-20">
                                <p className="font-bold text-blue-800 mb-2 flex items-center gap-2">
                                    <PlayCircle size={20}/> Nghe đoạn hội thoại:
                                </p>
                                <audio controls className="w-full h-10 accent-blue-600" src={getResourceUrl(activeTest.audioUrl)}>
                                    Trình duyệt không hỗ trợ audio.
                                </audio>
                            </div>
                        )}

                        <div className="space-y-6">
                            {activeTest.questions.map((q, index) => (
                                <div key={q.id} className="bg-white p-5 md:p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                                    <p className="font-bold text-gray-800 mb-4 text-base md:text-lg">
                                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm mr-2 select-none">Câu {index + 1}</span>
                                        {q.text}
                                    </p>

                                    {q.type === 'quiz' ? (
                                        <div className="grid grid-cols-1 gap-3">
                                            {q.options.map((opt, i) => (
                                                <label key={i} className={`flex items-center p-3 rounded-lg border-2 cursor-pointer transition-all hover:bg-gray-50 ${String(userAnswers[q.id]) === String(i) ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500' : 'border-gray-200'}`}>
                                                    <input
                                                        type="radio"
                                                        name={`q-${q.id}`}
                                                        className="w-5 h-5 text-blue-600 accent-blue-600"
                                                        checked={String(userAnswers[q.id]) === String(i)}
                                                        onChange={() => handleAnswer(q.id, i)}
                                                    />
                                                    <span className="ml-3 text-gray-700">{opt}</span>
                                                </label>
                                            ))}
                                        </div>
                                    ) : (
                                        <textarea
                                            rows="4"
                                            className="w-full p-4 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-gray-800 bg-gray-50 focus:bg-white transition-colors"
                                            placeholder="Nhập câu trả lời của bạn..."
                                            value={userAnswers[q.id] || ''}
                                            onChange={(e) => handleAnswer(q.id, e.target.value)}
                                        ></textarea>
                                    )}
                                </div>
                            ))}
                        </div>
                        <div className="h-6"></div>
                    </div>

                    {/* Footer */}
                    <div className="p-4 bg-white border-t border-gray-200 shrink-0 flex justify-between items-center shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-10">
                        <div className="text-sm text-gray-500 hidden md:block font-medium">
                            Đã làm: <span className="font-bold text-blue-600">{Object.keys(userAnswers).length}</span>/{activeTest.questions.length} câu
                        </div>
                        <div className="flex gap-3 w-full md:w-auto justify-end">
                            <button
                                onClick={() => { if(window.confirm("Hủy bài làm và thoát?")) setIsDoing(false); }}
                                className="px-6 py-2.5 rounded-lg font-bold text-gray-600 hover:bg-gray-100 transition-colors w-1/3 md:w-auto"
                            >
                                Thoát
                            </button>
                            <button
                                onClick={handleSubmitButton}
                                className="bg-green-600 hover:bg-green-700 text-white font-bold py-2.5 px-8 rounded-lg shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5 active:translate-y-0 w-2/3 md:w-auto flex items-center justify-center gap-2"
                            >
                                <CheckCircle size={20}/> Nộp bài
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // --- VIEW: DANH SÁCH BÀI THI ---
    return (
        <div className="container mx-auto px-4 py-8 max-w-[1600px] animate-fade-in pb-24">
            <div className="text-center mb-10">
                <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">Kiểm Tra Năng Lực</h2>
                <p className="text-gray-500">Chọn bài thi phù hợp để đánh giá trình độ của bạn</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Danh sách đề thi */}
                <div className="lg:col-span-2 space-y-4">
                    <h3 className="font-bold text-xl text-blue-800 mb-4 flex items-center gap-2 border-b pb-2">
                        <FileText className="text-blue-600"/> Đề thi hiện có
                    </h3>

                    {(!tests || tests.length === 0) ? (
                        <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                            <p className="text-gray-500">Hiện chưa có đề thi nào.</p>
                        </div>
                    ) : (
                        tests.map((test) => (
                            <div key={test.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-lg transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-4 group">
                                <div className="flex-1">
                                    <h4 className="font-bold text-lg text-gray-800 group-hover:text-blue-700 transition-colors line-clamp-1">
                                        {test.title}
                                    </h4>
                                    <p className="text-gray-500 text-sm mt-1 line-clamp-2">
                                        {test.description || "Không có mô tả"}
                                    </p>
                                    <div className="flex items-center gap-3 mt-3">
                                        <span className="inline-flex items-center gap-1 text-xs font-bold bg-blue-50 text-blue-700 px-2 py-1 rounded border border-blue-100">
                                            <Clock size={12}/> {test.duration ? Math.floor(test.duration / 60) : 0} phút
                                        </span>
                                        <span className="text-xs text-gray-400">|</span>
                                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                            {test.questionsData ? (
                                                (() => { try { return JSON.parse(test.questionsData).length; } catch { return 0; } })()
                                            ) : 0} câu hỏi
                                        </span>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleStartTest(test)}
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-bold shadow-md transition-all hover:-translate-y-0.5 whitespace-nowrap w-full md:w-auto"
                                >
                                    Làm bài
                                </button>
                            </div>
                        ))
                    )}
                </div>

                {/* Cột Phải: Lịch sử làm bài */}
                <div className="h-fit sticky top-24">
                    <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
                        <h3 className="font-bold text-xl text-gray-800 mb-4 flex items-center gap-2 border-b pb-2">
                            <History className="text-orange-500"/> Lịch sử làm bài
                        </h3>
                        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1 custom-scrollbar">
                            {(!user?.results || user.results.length === 0) ? (
                                <p className="text-gray-500 text-sm text-center py-8 bg-gray-50 rounded-lg">Chưa có kết quả nào.</p>
                            ) : (
                                user.results.map((result) => {
                                    // LOGIC SỬA LỖI HIỂN THỊ
                                    // Kiểm tra cả 2 trường hợp: Dữ liệu RAM (testTitle) và Dữ liệu DB (test.title)
                                    const displayTitle = result.testTitle || result.test?.title || "Bài kiểm tra";
                                    const displayDate = result.date || (result.createdAt ? new Date(result.createdAt).toLocaleDateString('vi-VN') : "N/A");
                                    // Xử lý isReviewed (Backend có thể trả về 'reviewed' thay vì 'isReviewed')
                                    const isReviewed = result.isReviewed !== undefined ? result.isReviewed : (result.reviewed !== undefined ? result.reviewed : false);

                                    return (
                                        <div
                                            key={result.id}
                                            className="group border-b border-gray-100 last:border-0 pb-3 last:pb-0 hover:bg-gray-50 p-2 rounded transition-colors cursor-pointer"
                                            onClick={() => navigate('/test-review', { state: { result } })}
                                            title="Bấm để xem chi tiết"
                                        >
                                            <div className="flex justify-between items-start mb-1">
                                                <h4 className="font-bold text-gray-800 text-sm line-clamp-1 group-hover:text-blue-600 transition-colors w-2/3">
                                                    {displayTitle}
                                                </h4>
                                                <span className={`text-sm font-bold ${result.score >= 50 ? 'text-green-600' : 'text-red-500'}`}>
                                                    {result.score}đ
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center text-xs text-gray-500">
                                                <span>{displayDate}</span>
                                                <span className={`px-2 py-0.5 rounded ${isReviewed ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                                    {isReviewed ? 'Đã chấm' : 'Chờ chấm'}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TestsPage;