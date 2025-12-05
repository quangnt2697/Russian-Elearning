import React, { useState, useEffect } from 'react';
import { ArrowLeft, MessageSquare, CheckCircle, XCircle } from 'lucide-react';
import { useLocation, useNavigate, Navigate } from 'react-router-dom';

const TestReviewPage = () => {
    const location = useLocation();
    const navigate = useNavigate();

    // Lấy dữ liệu result được truyền qua navigation state
    const result = location.state?.result;

    const [processedQuestions, setProcessedQuestions] = useState([]);

    // Logic xử lý dữ liệu (Parsing JSON từ DB hoặc dùng dữ liệu có sẵn)
    useEffect(() => {
        if (!result) return;

        // TRƯỜNG HỢP 1: Dữ liệu từ lúc vừa nộp bài (đã có sẵn mảng questions)
        if (result.questions && Array.isArray(result.questions)) {
            setProcessedQuestions(result.questions);
        }
        // TRƯỜNG HỢP 2: Dữ liệu từ Lịch sử/Database (Cần giải mã chuỗi JSON)
        else if (result.test) {
            try {
                let questions = [];
                let userAnsObj = {};

                // 1. Parse danh sách câu hỏi gốc
                const rawQuestions = result.test.questionsData || result.test.questions;
                if (typeof rawQuestions === 'string') {
                    try { questions = JSON.parse(rawQuestions); } catch (e) { console.error("Lỗi parse câu hỏi:", e); }
                } else if (Array.isArray(rawQuestions)) {
                    questions = rawQuestions;
                }

                // 2. Parse đáp án người dùng
                if (typeof result.userAnswers === 'string') {
                    try { userAnsObj = JSON.parse(result.userAnswers); } catch (e) { console.error("Lỗi parse đáp án:", e); }
                } else if (typeof result.userAnswers === 'object' && result.userAnswers !== null) {
                    userAnsObj = result.userAnswers;
                }

                // 3. Ghép lại
                if (questions.length > 0) {
                    const mergedData = questions.map(q => ({
                        ...q,
                        userAnswer: userAnsObj ? userAnsObj[q.id] : undefined
                    }));
                    setProcessedQuestions(mergedData);
                }
            } catch (error) {
                console.error("Lỗi xử lý dữ liệu bài thi:", error);
            }
        }
    }, [result]);

    // Redirect nếu không có dữ liệu
    if (!result) {
        return <Navigate to="/home" replace />;
    }

    // Xử lý hiển thị thông tin chung
    const displayTitle = result.testTitle || result.test?.title || "Chi tiết bài làm";
    const displayDate = result.date || (result.createdAt ? new Date(result.createdAt).toLocaleDateString('vi-VN') : "N/A");

    // Kiểm tra trạng thái đã chấm (Backend có thể trả về isReviewed hoặc reviewed)
    const isReviewed = result.isReviewed !== undefined ? result.isReviewed : (result.reviewed !== undefined ? result.reviewed : false);

    // Lấy nội dung feedback (Ưu tiên adminFeedback từ DB)
    const feedbackContent = result.adminFeedback || result.feedback;

    return (
        <div className="w-full min-h-screen bg-gray-50 py-8 animate-fade-in">
            <div className="container mx-auto px-4 max-w-4xl">
                {/* Nút Quay lại */}
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-white font-bold mb-6 bg-white px-4 py-2 rounded-lg shadow-sm w-fit transition-transform hover:-translate-x-1"
                >
                    <ArrowLeft size={20} /> Quay lại
                </button>

                {/* Thông tin chung */}
                <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100 mb-8">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-100 pb-6 mb-6">
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
                                {displayTitle}
                            </h1>
                            <p className="text-gray-500 mt-2">
                                Ngày làm bài: <span className="font-medium text-gray-700">{displayDate}</span>
                            </p>
                        </div>
                        <div className="flex flex-col items-center bg-blue-50 px-6 py-3 rounded-xl border border-blue-100 min-w-[120px]">
                            <span className="text-xs text-blue-600 font-bold uppercase tracking-wider mb-1">Điểm số</span>
                            <span className={`text-4xl font-bold ${result.score >= 50 ? 'text-green-600' : 'text-red-500'}`}>
                                {result.score}
                            </span>
                        </div>
                    </div>

                    {/* --- PHẦN HIỂN THỊ FEEDBACK (MỚI) --- */}
                    {isReviewed && (
                        <div className="bg-green-50 border border-green-200 p-5 rounded-xl flex gap-4 animate-fade-in">
                            <div className="bg-white p-2.5 rounded-full h-fit text-green-600 shadow-sm shrink-0">
                                <MessageSquare size={24} />
                            </div>
                            <div>
                                <h3 className="font-bold text-green-800 text-lg mb-1">Nhận xét của giáo viên</h3>
                                <p className="text-gray-700 leading-relaxed whitespace-pre-line text-base">
                                    {feedbackContent || "Chưa có nội dung nhận xét chi tiết."}
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Danh sách câu hỏi */}
                <div className="space-y-6">
                    {processedQuestions.map((q, index) => {
                        const isQuiz = q.type === 'quiz';
                        const isCorrect = isQuiz && String(q.userAnswer) === String(q.correct);

                        return (
                            <div key={index} className={`bg-white p-6 rounded-xl shadow-sm border-2 transition-all ${isCorrect ? 'border-green-100' : 'border-red-50'}`}>
                                <div className="flex gap-3 mb-4">
                                    <span className={`flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full font-bold text-sm ${isCorrect ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                        {index + 1}
                                    </span>
                                    <div className="flex-1">
                                        <p className="font-bold text-gray-800 text-lg">{q.text}</p>
                                    </div>
                                </div>

                                {isQuiz ? (
                                    <div className="ml-11 grid gap-3">
                                        {q.options && q.options.map((opt, i) => {
                                            let optionClass = "p-3 rounded-lg border flex items-center gap-3 transition-colors ";
                                            const isSelected = String(q.userAnswer) === String(i);
                                            const isKey = String(q.correct) === String(i);

                                            if (isKey) {
                                                optionClass += "bg-green-50 border-green-500 text-green-800 font-medium ring-1 ring-green-500";
                                            } else if (isSelected && !isKey) {
                                                optionClass += "bg-red-50 border-red-300 text-red-800";
                                            } else {
                                                optionClass += "bg-white border-gray-200 text-gray-500 opacity-60";
                                            }

                                            return (
                                                <div key={i} className={optionClass}>
                                                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${isKey ? 'border-green-600 bg-green-600 text-white' : (isSelected ? 'border-red-500 bg-red-500 text-white' : 'border-gray-300')}`}>
                                                        {isKey && <CheckCircle size={12} />}
                                                        {isSelected && !isKey && <XCircle size={12} />}
                                                    </div>
                                                    <span className="flex-1">{opt}</span>
                                                    {isKey && <span className="text-[10px] font-bold text-green-600 uppercase px-2 py-0.5 bg-green-100 rounded border border-green-200">Đúng</span>}
                                                    {isSelected && !isKey && <span className="text-[10px] font-bold text-red-600 uppercase px-2 py-0.5 bg-red-100 rounded border border-red-200">Bạn chọn</span>}
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="ml-11">
                                        <div className="mb-2">
                                            <span className="text-xs font-bold text-gray-500 uppercase">Câu trả lời của bạn:</span>
                                            <div className="mt-1 p-4 bg-gray-50 border rounded-lg text-gray-800 italic whitespace-pre-wrap">
                                                {q.userAnswer || "(Không trả lời)"}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}

                    {processedQuestions.length === 0 && (
                        <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
                            <p className="text-gray-500">Đang tải nội dung bài làm hoặc dữ liệu không khả dụng...</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TestReviewPage;