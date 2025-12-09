import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, Trophy, FileText, CheckCircle, History, PlayCircle, CheckSquare, List, Info, Volume2 } from 'lucide-react';
// Import chính xác file api.js với đuôi mở rộng để tránh lỗi resolve
import { submitTestAPI, getResourceUrl } from '../services/api.js';

const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
};

const HEADER_REGEX = /^(Bài|Part|Phần)\s+\d+|^(Mark the letter|Read the following|Choose the word|Read the passage)/i;

const TestsPage = ({ tests, user, onSaveResult }) => {
    const navigate = useNavigate();
    const [activeTest, setActiveTest] = useState(null);
    const [isDoing, setIsDoing] = useState(false);
    const [timeLeft, setTimeLeft] = useState(0);
    const [userAnswers, setUserAnswers] = useState({});

    useEffect(() => {
        let timer;
        if (isDoing && timeLeft > 0) {
            timer = setInterval(() => {
                setTimeLeft((prev) => {
                    if (prev <= 1) {
                        handleForceSubmit();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [isDoing, timeLeft]);

    const handleStartTest = (test) => {
        let parsedTest = { ...test };
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

    const handleAnswer = (qId, value, subIndex = null) => {
        if (subIndex !== null) {
            // Logic cho câu hỏi nhiều input (Fill Blank)
            setUserAnswers(prev => {
                const current = prev[qId] || {};
                return { ...prev, [qId]: { ...current, [subIndex]: value } };
            });
        } else {
            setUserAnswers(prev => ({ ...prev, [qId]: value }));
        }
    };

    const handleForceSubmit = async () => {
        setIsDoing(false);
        if (!activeTest) return;

        let score = 0;
        const realQuestions = activeTest.questions.filter(q => {
            const isInstruction = q.type === 'INSTRUCTION' || (q.text && q.text.match(HEADER_REGEX));
            return !isInstruction;
        });

        activeTest.questions.forEach(q => {
            if (q.type === 'INSTRUCTION' || (q.text && q.text.match(HEADER_REGEX))) return;

            const userAns = userAnswers[q.id];

            // 1. Chấm điểm Trắc nghiệm
            if ((q.type === 'QUIZ_SINGLE' || q.type === 'READING' || q.type === 'LISTENING' || q.type === 'QUIZ_MULTI') && String(userAns) === String(q.correct)) {
                score++;
            }
            // 2. Chấm điểm Fill Blank (Tự động)
            else if (q.type === 'FILL_BLANK' && q.correct_blanks) {
                let isCorrect = true;
                if (!userAns) isCorrect = false;
                else {
                    q.correct_blanks.forEach((ans, idx) => {
                        const userVal = userAns[idx] || "";
                        if (userVal.trim().toLowerCase() !== ans.trim().toLowerCase()) {
                            isCorrect = false;
                        }
                    });
                }
                if (isCorrect) score++;
            }
        });

        const total = realQuestions.length;
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
                questions: activeTest.questions
                    .filter(q => q.type !== 'INSTRUCTION' && !(q.text && q.text.match(HEADER_REGEX)))
                    .map(q => ({
                        ...q,
                        userAnswer: userAnswers[q.id]
                    }))
            };
            onSaveResult(resultData);
            alert(`Nộp bài thành công!\nĐiểm sơ bộ: ${finalScore}/100`);
        } catch (error) {
            console.error("Lỗi nộp bài:", error);
            alert("Đã có lỗi xảy ra khi lưu kết quả!");
        } finally {
            setActiveTest(null);
        }
    };

    // --- RENDER FILL BLANK ---
    const renderFillBlank = (item) => {
        let parts = [];
        if (item.text_processed) {
            parts = item.text_processed.split("___");
        } else {
            parts = item.text.split(/\{[^}]+\}/);
        }

        return (
            <div className="leading-loose text-lg text-gray-800">
                {parts.map((part, index) => (
                    <React.Fragment key={index}>
                        <span>{part}</span>
                        {index < parts.length - 1 && (
                            <input
                                type="text"
                                className="mx-2 px-2 py-1 border-b-2 border-blue-300 outline-none focus:border-blue-600 bg-blue-50/50 rounded text-blue-800 font-bold min-w-[80px] w-auto inline-block text-center"
                                value={(userAnswers[item.id] && userAnswers[item.id][index]) || ''}
                                onChange={(e) => handleAnswer(item.id, e.target.value, index)}
                            />
                        )}
                    </React.Fragment>
                ))}
            </div>
        );
    };

    const renderContentItem = (item, index, realIndex) => {
        const isHeader = item.type === 'INSTRUCTION' || (item.text && item.text.match(HEADER_REGEX));

        if (isHeader) {
            return (
                <div key={item.id} className="bg-blue-50/80 p-5 rounded-xl border border-blue-200 text-blue-900 shadow-sm mt-8 mb-4 first:mt-0 animate-fade-in">
                    <div className="flex items-start gap-3">
                        <Info className="shrink-0 mt-1 text-blue-600" size={22} />
                        <span className="font-bold text-lg leading-relaxed whitespace-pre-line">{item.text}</span>
                    </div>
                    {item.mediaSrc && (
                        <div className="mt-3 ml-8">
                            <audio controls className="h-8 w-64 accent-blue-600" src={getResourceUrl(item.mediaSrc)} />
                        </div>
                    )}
                </div>
            );
        }

        // --- LOGIC XỬ LÝ TIÊU ĐỀ THÔNG MINH ---
        let questionText = item.text.replace(/^(Câu|Question)\s*\d+[:.]\s*/i, '');

        // 1. Với bài REWRITE hoặc ERROR_CHECK: Dùng luôn câu gốc làm tiêu đề
        if ((item.type === 'REWRITE' || item.type === 'ERROR_CHECK') && item.original_sentence) {
            questionText = item.original_sentence;
        }

        // 2. Với bài ARRANGE: Dùng luôn các từ xáo trộn làm tiêu đề
        if (item.type === 'ARRANGE' && item.shuffled_words) {
            questionText = item.shuffled_words.join(' / ');
        }

        return (
            <div key={item.id} className="bg-white p-5 md:p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow relative mb-6">
                {/* Passage */}
                {item.showPassage && item.passage && (
                    <div className="mb-6 bg-gray-50 p-5 rounded-xl border-l-4 border-blue-500 text-gray-700 whitespace-pre-line leading-relaxed font-medium text-justify shadow-inner">
                        <span className="font-bold text-blue-600 block mb-3 uppercase text-xs tracking-wider flex items-center gap-2">
                            <FileText size={14}/> Bài đọc tham khảo:
                        </span>
                        {item.passage}
                    </div>
                )}

                {/* Audio riêng của câu hỏi */}
                {item.mediaSrc && (
                    <div className="mb-4 bg-gray-50 p-2 rounded-lg border border-gray-200 inline-flex items-center gap-3">
                        <div className="bg-blue-600 text-white p-2 rounded-full"><Volume2 size={16}/></div>
                        <audio controls className="h-8 w-64 accent-blue-600" src={getResourceUrl(item.mediaSrc)} />
                    </div>
                )}

                <div className="font-bold text-gray-800 mb-4 text-base md:text-xl flex items-start gap-3">
                    <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-lg text-sm shrink-0 select-none font-bold shadow-sm h-fit mt-1">
                        Câu {realIndex}
                    </span>
                    {/* Hiển thị nội dung câu hỏi (Câu hỏi trắc nghiệm / Câu gốc / Từ xáo trộn) */}
                    {item.type !== 'FILL_BLANK' && (
                        <span className="leading-relaxed">{questionText}</span>
                    )}
                </div>

                <div className="ml-0 md:ml-2">
                    {/* A. FILL BLANK */}
                    {item.type === 'FILL_BLANK' && renderFillBlank(item)}

                    {/* B. TRẮC NGHIỆM */}
                    {(item.type === 'QUIZ_SINGLE' || item.type === 'READING' || item.type === 'LISTENING' || item.type === 'AUDIO' || item.type === 'quiz' || !item.type) && (
                        <div className="grid grid-cols-1 gap-3">
                            {item.options && item.options.map((opt, i) => (
                                <label key={i} className={`flex items-center p-3.5 rounded-xl border-2 cursor-pointer transition-all hover:bg-gray-50 group ${String(userAnswers[item.id]) === String(i) ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500' : 'border-gray-100'}`}>
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mr-3 shrink-0 transition-colors ${String(userAnswers[item.id]) === String(i) ? 'border-blue-600' : 'border-gray-300 group-hover:border-blue-400'}`}>
                                        {String(userAnswers[item.id]) === String(i) && <div className="w-2.5 h-2.5 bg-blue-600 rounded-full" />}
                                    </div>
                                    <input type="radio" name={`q-${item.id}`} className="hidden" checked={String(userAnswers[item.id]) === String(i)} onChange={() => handleAnswer(item.id, i)} />
                                    <span className="text-gray-700 font-medium">{opt}</span>
                                </label>
                            ))}
                        </div>
                    )}

                    {/* C. MULTI CHOICE */}
                    {item.type === 'QUIZ_MULTI' && (
                        <div className="grid grid-cols-1 gap-3">
                            <p className="text-xs text-gray-500 italic mb-1 font-medium">(Chọn tất cả đáp án đúng)</p>
                            {item.options && item.options.map((opt, i) => {
                                const currentAns = userAnswers[item.id] || [];
                                const isChecked = Array.isArray(currentAns) && currentAns.includes(i);
                                return (
                                    <label key={i} className={`flex items-center p-3.5 rounded-xl border-2 cursor-pointer transition-all hover:bg-gray-50 ${isChecked ? 'border-blue-500 bg-blue-50' : 'border-gray-100'}`}>
                                        <input type="checkbox" className="w-5 h-5 text-blue-600 accent-blue-600 rounded mr-3 shrink-0" checked={isChecked} onChange={(e) => {
                                            const newAns = e.target.checked ? [...currentAns, i] : currentAns.filter(x => x !== i);
                                            handleAnswer(item.id, newAns);
                                        }} />
                                        <span className="text-gray-700 font-medium">{opt}</span>
                                    </label>
                                );
                            })}
                        </div>
                    )}

                    {/* D. CÁC DẠNG TỰ LUẬN (ARRANGE, REWRITE, ERROR_CHECK) - ĐÃ CẬP NHẬT GIAO DIỆN */}
                    {(item.type === 'ARRANGE' || item.type === 'REWRITE' || item.type === 'ERROR_CHECK') && (
                        <div className="space-y-2">
                            {/* Input nhập câu trả lời - Gọn gàng, không có label thừa */}
                            <textarea
                                rows="2"
                                className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-gray-800 bg-white text-lg placeholder:text-sm placeholder:text-gray-400 font-medium transition-shadow hover:border-blue-300"
                                placeholder="Nhập câu trả lời của bạn..."
                                value={userAnswers[item.id] || ''}
                                onChange={(e) => handleAnswer(item.id, e.target.value)}
                            />
                        </div>
                    )}
                </div>
            </div>
        );
    };

    if (isDoing && activeTest) {
        const realQuestionCount = activeTest.questions.filter(q =>
            q.type !== 'INSTRUCTION' && !(q.text && q.text.match(HEADER_REGEX))
        ).length;
        return (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-0 md:p-4 animate-fade-in">
                <div className="bg-white h-full md:h-auto md:max-h-[95vh] w-full md:max-w-5xl md:rounded-2xl shadow-2xl flex flex-col overflow-hidden">
                    <div className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white p-4 md:p-5 flex justify-between items-center shrink-0 shadow-lg z-10">
                        <div>
                            <h2 className="font-bold text-lg md:text-2xl line-clamp-1">{activeTest.title}</h2>
                            <p className="text-blue-200 text-xs md:text-sm mt-1 flex items-center gap-2">
                                <List size={14}/> Tổng câu hỏi: {realQuestionCount}
                            </p>
                        </div>
                        <div className={`flex items-center gap-2 font-mono text-xl md:text-2xl font-bold bg-white/10 px-4 py-2 rounded-xl backdrop-blur-md border border-white/20 shadow-inner ${timeLeft < 60 ? 'text-red-300 animate-pulse border-red-400 bg-red-900/20' : ''}`}>
                            <Clock size={24}/> {formatTime(timeLeft)}
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-gray-50 custom-scrollbar scroll-smooth">
                        {activeTest.audioUrl && (
                            <div className="mb-8 bg-white p-5 rounded-2xl shadow-sm border border-blue-100 sticky top-0 z-20">
                                <p className="font-bold text-blue-800 mb-3 flex items-center gap-2 text-sm uppercase tracking-wider">
                                    <PlayCircle size={18}/> Audio Đề Thi Chung
                                </p>
                                <audio controls className="w-full h-12 accent-blue-600 shadow-sm rounded-lg" src={getResourceUrl(activeTest.audioUrl)}>Trình duyệt không hỗ trợ audio.</audio>
                            </div>
                        )}
                        <div className="space-y-2 pb-10">
                            {(() => {
                                let realQuestionIndex = 0;
                                return activeTest.questions.map((item, index) => {
                                    const prevItem = activeTest.questions[index - 1];
                                    if (item.type === 'READING' && item.passage) {
                                        const prevPassage = prevItem?.type === 'READING' ? prevItem.passage : null;
                                        item.showPassage = item.passage !== prevPassage;
                                    }
                                    const isHeader = item.type === 'INSTRUCTION' || (item.text && item.text.match(HEADER_REGEX));
                                    if (!isHeader) realQuestionIndex++;
                                    return renderContentItem(item, index, realQuestionIndex);
                                });
                            })()}
                        </div>
                    </div>

                    <div className="p-4 bg-white border-t border-gray-200 shrink-0 flex justify-between items-center shadow-[0_-4px_15px_-3px_rgba(0,0,0,0.1)] z-10">
                        <div className="text-sm text-gray-500 hidden md:flex items-center gap-2 font-medium bg-gray-100 px-3 py-1.5 rounded-lg">
                            <CheckSquare size={16} className="text-green-600"/>
                            Đã làm: <span className="font-bold text-blue-600">{Object.keys(userAnswers).length}</span> / {realQuestionCount}
                        </div>
                        <div className="flex gap-3 w-full md:w-auto justify-end">
                            <button onClick={() => { if(window.confirm("Hủy bài làm và thoát?")) setIsDoing(false); }} className="px-6 py-3 rounded-xl font-bold text-gray-600 hover:bg-gray-100 transition-colors w-1/3 md:w-auto">Thoát</button>
                            <button onClick={() => { if (window.confirm("Bạn chắc chắn muốn nộp bài?")) handleForceSubmit(); }} className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-xl shadow-lg transition-all w-2/3 md:w-auto flex items-center justify-center gap-2"><CheckCircle size={20}/> Nộp bài</button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // LIST VIEW
    return (
        <div className="container mx-auto px-4 py-8 max-w-[1600px] animate-fade-in pb-24">
            <div className="text-center mb-10">
                <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">Kiểm Tra Năng Lực</h2>
                <p className="text-gray-500">Chọn bài thi phù hợp để đánh giá trình độ của bạn</p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-4">
                    <h3 className="font-bold text-xl text-blue-800 mb-4 flex items-center gap-2 border-b pb-2"><FileText className="text-blue-600"/> Đề thi hiện có</h3>
                    {(!tests || tests.length === 0) ? <div className="text-center py-12 bg-gray-50 rounded-xl border-dashed border-gray-300 text-gray-500">Hiện chưa có đề thi nào.</div> : tests.map((test) => (
                        <div key={test.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-lg transition-all flex flex-col md:flex-row justify-between items-center gap-4 group">
                            <div className="flex-1">
                                <h4 className="font-bold text-lg text-gray-800 group-hover:text-blue-700 transition-colors line-clamp-1">{test.title}</h4>
                                <p className="text-gray-500 text-sm mt-1 line-clamp-2">{test.description || "Không có mô tả"}</p>
                                <div className="flex items-center gap-3 mt-3">
                                    <span className="inline-flex items-center gap-1 text-xs font-bold bg-blue-50 text-blue-700 px-2 py-1 rounded border border-blue-100"><Clock size={12}/> {test.duration ? Math.floor(test.duration / 60) : 0} phút</span>
                                </div>
                            </div>
                            <button onClick={() => handleStartTest(test)} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-bold shadow-md transition-all hover:-translate-y-0.5 whitespace-nowrap w-full md:w-auto">Làm bài</button>
                        </div>
                    ))}
                </div>
                <div className="h-fit sticky top-24">
                    <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
                        <h3 className="font-bold text-xl text-gray-800 mb-4 flex items-center gap-2 border-b pb-2"><History className="text-orange-500"/> Lịch sử làm bài</h3>
                        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1 custom-scrollbar">
                            {(!user?.results || user.results.length === 0) ? <p className="text-gray-500 text-sm text-center py-8">Chưa có kết quả nào.</p> : user.results.map((result) => (
                                <div key={result.id} className="group border-b border-gray-100 last:border-0 pb-3 hover:bg-gray-50 p-2 rounded transition-colors cursor-pointer" onClick={() => navigate('/test-review', { state: { result } })}>
                                    <div className="flex justify-between items-start mb-1">
                                        <h4 className="font-bold text-gray-800 text-sm line-clamp-1 group-hover:text-blue-600 w-2/3">{result.testTitle || "Bài kiểm tra"}</h4>
                                        <span className={`text-sm font-bold ${result.score >= 50 ? 'text-green-600' : 'text-red-500'}`}>{result.score}đ</span>
                                    </div>
                                    <div className="flex justify-between text-xs text-gray-500">
                                        <span>{result.date || new Date(result.createdAt).toLocaleDateString()}</span>
                                        <span className={`px-2 py-0.5 rounded ${result.isReviewed ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{result.isReviewed ? 'Đã chấm' : 'Chờ chấm'}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TestsPage;