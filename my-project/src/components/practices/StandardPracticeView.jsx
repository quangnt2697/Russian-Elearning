import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save, Headphones, PenTool, Mic, BookOpen, Layers, GraduationCap, Info, FileText, CheckSquare, Clock, Volume2 } from 'lucide-react';
import { getResourceUrl, uploadAudioAPI, submitPracticeAPI } from '../../services/api';
import FileViewer from './FileViewer';
import AudioRecorder from './AudioRecorder';

// --- CONSTANTS & HELPERS ---
const HEADER_REGEX = /^(Bài|Part|Phần)\s+\d+|^(Mark the letter|Read the following|Choose the word|Read the passage)/i;

const getIcon = (type) => {
    const t = (type || "").toUpperCase();
    if (t.includes('LISTENING')) return { icon: <Headphones size={24}/>, color: 'bg-green-600' };
    if (t.includes('SPEAKING')) return { icon: <Mic size={24}/>, color: 'bg-purple-600' };
    if (t.includes('READING')) return { icon: <BookOpen size={24}/>, color: 'bg-blue-600' };
    if (t.includes('WRITING')) return { icon: <PenTool size={24}/>, color: 'bg-pink-600' };
    if (t.includes('GRAMMAR')) return { icon: <GraduationCap size={24}/>, color: 'bg-teal-600' };
    return { icon: <Layers size={24}/>, color: 'bg-gray-600' };
};

const StandardPracticeView = ({ practice, onBack, onSaveSuccess }) => {
    // State cơ bản
    const [textAnswer, setTextAnswer] = useState("");
    const [audioBlob, setAudioBlob] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // State cho dạng bài tập tương tác (Reading/Grammar)
    const [questions, setQuestions] = useState([]);
    const [userAnswers, setUserAnswers] = useState({});

    const config = getIcon(practice.type);
    const isSelfStudy = ['READING', 'GRAMMAR', 'VOCABULARY'].includes(practice.type);

    // --- EFFECT: PARSE NỘI DUNG ---
    useEffect(() => {
        if (practice.content) {
            try {
                // Thử parse nội dung xem có phải JSON câu hỏi không
                const parsed = JSON.parse(practice.content);
                if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].type) {
                    setQuestions(parsed);
                } else {
                    setQuestions([]);
                }
            } catch (e) {
                // Nếu lỗi parse (là text thường hoặc URL file), thì bỏ qua
                setQuestions([]);
            }
        }
    }, [practice]);

    // --- HANDLERS ---
    const handleAnswer = (qId, value, subIndex = null) => {
        if (subIndex !== null) {
            // Logic cho câu điền từ (nhiều lỗ trống)
            setUserAnswers(prev => {
                const current = prev[qId] || {};
                return { ...prev, [qId]: { ...current, [subIndex]: value } };
            });
        } else {
            setUserAnswers(prev => ({ ...prev, [qId]: value }));
        }
    };

    const handleSubmit = async () => {
        // Validation
        const hasInteractiveAnswers = Object.keys(userAnswers).length > 0;
        const hasTextOrAudio = textAnswer.trim().length > 0 || audioBlob;

        if (!hasInteractiveAnswers && !hasTextOrAudio) {
            alert("Vui lòng làm bài trước khi lưu.");
            return;
        }

        setIsSubmitting(true);
        try {
            let finalContent = "";

            // Case 1: Dạng bài tương tác -> Lưu JSON kết quả
            if (questions.length > 0) {
                // Tự động chấm điểm sơ bộ (để học viên tham khảo)
                let correctCount = 0;
                let totalCount = 0;

                questions.forEach(q => {
                    // Bỏ qua instruction header
                    if (q.type === 'INSTRUCTION' || (q.text && q.text.match(HEADER_REGEX))) return;
                    totalCount++;

                    const uAns = userAnswers[q.id];
                    if (q.type === 'FILL_BLANK' && q.correct_blanks) {
                        // Logic chấm điền từ
                        let isCorrect = true;
                        if (!uAns) isCorrect = false;
                        else {
                            q.correct_blanks.forEach((ans, idx) => {
                                const val = uAns[idx] || "";
                                if (val.trim().toLowerCase() !== ans.trim().toLowerCase()) isCorrect = false;
                            });
                        }
                        if (isCorrect) correctCount++;
                    } else if (String(uAns) === String(q.correct)) {
                        correctCount++;
                    }
                });

                // Lưu kết quả dưới dạng JSON string để xem lại sau này
                // Kèm theo điểm số tự chấm
                const resultData = {
                    userAnswers: userAnswers,
                    autoScore: `${correctCount}/${totalCount}`,
                    submittedAt: new Date().toISOString()
                };
                finalContent = JSON.stringify(resultData);

                if(isSelfStudy) alert(`Kết quả tự luyện: ${correctCount}/${totalCount} câu đúng!`);
            }
            // Case 2: Dạng bài thường (Upload file/Text) -> Lưu text/audio
            else {
                let uploadedUrl = null;
                if (audioBlob) {
                    const audioFile = new File([audioBlob], `rec_${Date.now()}.webm`, { type: 'audio/webm' });
                    uploadedUrl = await uploadAudioAPI(audioFile);
                }
                finalContent = (uploadedUrl ? `[AUDIO]${uploadedUrl}[/AUDIO]\n` : "") + textAnswer;
            }

            const apiPayload = {
                title: practice.title,
                type: practice.type,
                content: finalContent
            };

            const savedData = await submitPracticeAPI(apiPayload);
            if (onSaveSuccess) onSaveSuccess(savedData);

            if (!isSelfStudy) alert("Nộp bài thành công!");

            setTextAnswer("");
            setAudioBlob(null);
            setUserAnswers({});
            onBack();
        } catch (error) {
            console.error(error);
            alert("Lỗi lưu bài. Vui lòng thử lại.");
        } finally {
            setIsSubmitting(false);
        }
    };

    // --- RENDERERS FOR INTERACTIVE QUESTIONS ---
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
                                className="mx-2 px-2 py-1 border-b-2 border-blue-300 outline-none focus:border-blue-600 bg-blue-50/50 rounded text-blue-800 font-bold min-w-[80px] w-auto inline-block text-center transition-all focus:bg-blue-100"
                                value={(userAnswers[item.id] && userAnswers[item.id][index]) || ''}
                                onChange={(e) => handleAnswer(item.id, e.target.value, index)}
                            />
                        )}
                    </React.Fragment>
                ))}
            </div>
        );
    };

    const renderQuestionItem = (item, index) => {
        const isHeader = item.type === 'INSTRUCTION' || (item.text && item.text.match(HEADER_REGEX));

        if (isHeader) {
            return (
                <div key={item.id} className="bg-blue-50/80 p-5 rounded-xl border border-blue-200 text-blue-900 shadow-sm mt-8 mb-4 first:mt-0">
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

        // Xử lý tiêu đề hiển thị (Bỏ "Câu X:", "Rewrite...", "Arrange...")
        let questionText = item.text.replace(/^(Câu|Question)\s*\d+[:.]\s*/i, '');
        if ((item.type === 'REWRITE' || item.type === 'ERROR_CHECK') && item.original_sentence) {
            questionText = item.original_sentence;
        }
        if (item.type === 'ARRANGE' && item.shuffled_words) {
            questionText = item.shuffled_words.join(' / ');
        }

        return (
            <div key={item.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow relative mb-6">
                {/* Passage */}
                {item.passage && (
                    <div className="mb-6 bg-gray-50 p-5 rounded-xl border-l-4 border-blue-500 text-gray-700 whitespace-pre-line leading-relaxed font-medium text-justify shadow-inner">
                        <span className="font-bold text-blue-600 block mb-3 uppercase text-xs tracking-wider flex items-center gap-2">
                            <FileText size={14}/> Bài đọc tham khảo:
                        </span>
                        {item.passage}
                    </div>
                )}

                {/* Question Audio */}
                {item.mediaSrc && (
                    <div className="mb-4 bg-gray-50 p-2 rounded-lg border border-gray-200 inline-flex items-center gap-3">
                        <div className="bg-blue-600 text-white p-2 rounded-full"><Volume2 size={16}/></div>
                        <audio controls className="h-8 w-64 accent-blue-600" src={getResourceUrl(item.mediaSrc)} />
                    </div>
                )}

                {/* Question Title */}
                <div className="font-bold text-gray-800 mb-4 text-lg flex items-start gap-3">
                    <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-lg text-sm shrink-0 select-none font-bold shadow-sm mt-0.5">
                        Câu {index + 1}
                    </span>
                    {item.type !== 'FILL_BLANK' && <span className="leading-relaxed">{questionText}</span>}
                </div>

                {/* Answer Area */}
                <div className="ml-0 md:ml-2">
                    {/* FILL BLANK */}
                    {item.type === 'FILL_BLANK' && renderFillBlank(item)}

                    {/* QUIZ */}
                    {(item.type === 'QUIZ_SINGLE' || item.type === 'READING' || item.type === 'LISTENING' || !item.type) && (
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

                    {/* TEXT INPUTS (Arrange, Rewrite, Error Check) */}
                    {(item.type === 'ARRANGE' || item.type === 'REWRITE' || item.type === 'ERROR_CHECK') && (
                        <textarea
                            rows="2"
                            className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-gray-800 bg-white text-lg font-medium transition-shadow hover:border-blue-300 placeholder:text-gray-400"
                            placeholder="Nhập câu trả lời của bạn..."
                            value={userAnswers[item.id] || ''}
                            onChange={(e) => handleAnswer(item.id, e.target.value)}
                        />
                    )}
                </div>
            </div>
        );
    };

    // --- MAIN RENDER ---

    // Nếu có câu hỏi tương tác (Reading/Grammar dạng Test)
    if (questions.length > 0) {
        return (
            <div className="w-full min-h-screen container mx-auto px-4 py-8 max-w-[1200px] animate-fade-in pb-24">
                <button onClick={onBack} className="text-blue-600 font-bold mb-6 hover:underline flex items-center gap-2">
                    <ArrowLeft size={20}/> Quay lại danh sách
                </button>

                <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-blue-700 to-indigo-800 p-6 text-white shadow-md">
                        <div className="flex items-center gap-3 mb-2 opacity-90">
                            {config.icon}
                            <span className="text-sm font-bold tracking-wider uppercase">Bài tự luyện</span>
                        </div>
                        <h2 className="text-2xl font-bold">{practice.title}</h2>
                        <p className="text-blue-100 mt-2">{practice.description}</p>
                    </div>

                    {/* Questions List */}
                    <div className="p-6 md:p-10 bg-gray-50/50">
                        {questions.map((q, idx) => renderQuestionItem(q, idx))}
                    </div>

                    {/* Footer Action */}
                    <div className="p-6 bg-white border-t border-gray-200 sticky bottom-0 z-10 shadow-[0_-4px_15px_-3px_rgba(0,0,0,0.1)] flex justify-end">
                        <button
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                            className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-xl shadow-lg transition-all transform hover:-translate-y-0.5 w-full md:w-auto flex items-center justify-center gap-2"
                        >
                            {isSubmitting ? "Đang lưu..." : <><Save size={20}/> Lưu kết quả tự luyện</>}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Nếu không có câu hỏi tương tác -> Render giao diện cũ (File Viewer + Text Area)
    const hasContent = practice.content && practice.content.trim() !== "" && practice.content !== "[]";
    const hasMedia = !!practice.mediaUrl;
    const showLeftColumn = hasContent || hasMedia;

    return (
        <div className="w-full min-h-screen container mx-auto px-4 py-8 max-w-[1600px] animate-fade-in pb-24">
            <button onClick={onBack} className="text-blue-600 font-bold mb-6 hover:underline flex items-center gap-2">
                <ArrowLeft size={20}/> Quay lại danh sách
            </button>

            <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 border border-gray-100">
                <div className="flex items-center gap-4 mb-8 border-b pb-6">
                    <div className={`p-3 rounded-xl text-white shadow-sm ${config.color}`}>{config.icon}</div>
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800">{practice.title}</h2>
                        <p className="text-gray-500">{practice.description}</p>
                    </div>
                </div>

                <div className={`grid gap-8 h-full ${showLeftColumn ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'}`}>
                    {showLeftColumn && (
                        <div className="space-y-6 flex flex-col min-h-[500px]">
                            {hasMedia && (
                                <div className="bg-blue-50 p-4 rounded-xl border border-blue-200 flex items-center gap-4 shrink-0 shadow-sm">
                                    <div className="bg-blue-600 text-white p-3 rounded-full shadow-md"><Headphones size={24}/></div>
                                    <div className="flex-1">
                                        <p className="font-bold text-blue-900 mb-1 text-sm uppercase tracking-wide">Audio Đề bài</p>
                                        <audio controls src={getResourceUrl(practice.mediaUrl)} className="w-full h-8 accent-blue-600"/>
                                    </div>
                                </div>
                            )}
                            {hasContent && (
                                <div className="flex-1 relative h-full bg-gray-100 rounded-xl overflow-hidden border border-gray-200">
                                    <FileViewer content={practice.content} />
                                </div>
                            )}
                        </div>
                    )}

                    <div className={`flex flex-col h-full bg-gray-50 rounded-xl p-6 border border-gray-200 ${showLeftColumn ? 'min-h-[500px]' : 'min-h-[400px]'}`}>
                        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <PenTool size={20} className="text-blue-600"/>
                            {isSelfStudy ? "Khu vực tự luyện" : "Khu vực trả lời"}
                        </h3>

                        {practice.type === 'SPEAKING' && <AudioRecorder onAudioReady={setAudioBlob} />}

                        <div className="flex-1 mb-6">
                            <label className="block font-bold text-gray-700 mb-2 text-sm">
                                {isSelfStudy ? "Ghi chú / Bài làm của bạn (Lưu để xem lại):" : "Bài viết / Câu trả lời:"}
                            </label>
                            <textarea
                                className="w-full h-full p-4 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-base bg-white shadow-inner text-gray-800 resize-none font-medium transition-shadow"
                                placeholder={isSelfStudy ? "Nhập câu trả lời hoặc ghi chú cá nhân..." : "Nhập nội dung trả lời tại đây..."}
                                value={textAnswer}
                                onChange={e => setTextAnswer(e.target.value)}
                            ></textarea>
                        </div>

                        <button
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                            className={`w-full text-white font-bold py-4 rounded-xl shadow-lg transition-all hover:-translate-y-0.5 flex justify-center items-center gap-2 text-lg disabled:opacity-50 ${isSelfStudy ? 'bg-blue-600 hover:bg-blue-700' : 'bg-green-600 hover:bg-green-700'}`}
                        >
                            {isSubmitting ? "Đang xử lý..." : (isSelfStudy ? <><Save size={24}/> Lưu kết quả tự luyện</> : <><Save size={24}/> Nộp bài</>)}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StandardPracticeView;