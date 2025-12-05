import React, { useState, useEffect, useRef } from 'react';
import {
    ArrowLeft, ArrowRight, Mic, StopCircle, Save,
    Headphones, BookOpen, PenTool, PlayCircle, Trash2, FileText,
    Maximize2, Minimize2, X, Layers, GraduationCap, ChevronLeft, ChevronRight,
    RotateCcw, Volume2
} from 'lucide-react';
// SỬA: Đổi đường dẫn import để phù hợp với môi trường file phẳng
import { fetchPracticesAPI, uploadAudioAPI, submitPracticeAPI, getResourceUrl, fetchUserPracticeHistory } from '../services/api';

// --- MOCK DATA DỰ PHÒNG ---
const MOCK_FLASHCARDS = [
    { id: 1, word: 'Привет', meaning: 'Xin chào', example: 'Привет, как дела? (Chào, bạn khỏe không?)', ipa: '/prʲɪˈvʲet/' },
    { id: 2, word: 'Спасибо', meaning: 'Cảm ơn', example: 'Большое спасибо! (Cảm ơn nhiều!)', ipa: '/spɐˈsʲibə/' },
    { id: 3, word: 'Друг', meaning: 'Bạn bè', example: 'Это мой лучший друг. (Đây là bạn thân của tôi.)', ipa: '/druk/' },
    { id: 4, word: 'Семья', meaning: 'Gia đình', example: 'Я люблю свою семью. (Tôi yêu gia đình mình.)', ipa: '/sʲɪˈmʲja/' },
    { id: 5, word: 'Работа', meaning: 'Công việc', example: 'У меня много работы. (Tôi có nhiều việc phải làm.)', ipa: '/rɐˈbotə/' },
];

const PracticePage = ({ user, onSavePractice }) => {
    // --- STATE DATA ---
    const [allPractices, setAllPractices] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [selectedPractice, setSelectedPractice] = useState(null);

    // --- STATE LÀM BÀI ---
    const [textAnswer, setTextAnswer] = useState("");
    const [isRecording, setIsRecording] = useState(false);
    const [audioUrl, setAudioUrl] = useState(null);
    const [audioBlob, setAudioBlob] = useState(null);
    const mediaRecorderRef = useRef(null);

    // --- STATE UI TỔNG QUÁT ---
    const [isFullscreenView, setIsFullscreenView] = useState(false);
    const [isDrawingMode, setIsDrawingMode] = useState(false);
    const contentContainerRef = useRef(null);
    const [grammarContent, setGrammarContent] = useState("");

    // --- STATE FLASHCARD (NÂNG CẤP) ---
    const [vocabList, setVocabList] = useState([]);
    const [currentCardIndex, setCurrentCardIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false); // Trạng thái lật thẻ
    const [isAutoPlay, setIsAutoPlay] = useState(false); // Tự động chuyển thẻ

    // --- LOAD DATA ---
    useEffect(() => {
        const load = async () => {
            try {
                const practices = await fetchPracticesAPI();
                setAllPractices(practices || []);
            } catch (error) {
                console.error("Lỗi tải danh sách bài tập:", error);
            }
        };
        load();
    }, []);

    // --- LOAD CONTENT KHI CHỌN BÀI ---
    useEffect(() => {
        if (!selectedPractice) return;

        // Reset states
        setTextAnswer("");
        setAudioUrl(null);
        setAudioBlob(null);

        // 1. Xử lý Từ vựng
        if (selectedPractice.type === 'VOCABULARY') {
            try {
                // Parse dữ liệu từ vựng từ JSON string trong DB
                // Format mong đợi: [{"word": "...", "meaning": "...", "example": "..."}]
                const parsedVocab = JSON.parse(selectedPractice.content || "[]");
                setVocabList(parsedVocab.length > 0 ? parsedVocab : MOCK_FLASHCARDS);
                setCurrentCardIndex(0);
                setIsFlipped(false);
            } catch (e) {
                console.error("Lỗi parse từ vựng:", e);
                setVocabList(MOCK_FLASHCARDS);
            }
        }

        // 2. Xử lý Ngữ pháp (Load file text nếu có)
        if (selectedPractice.type === 'GRAMMAR' && selectedPractice.content) {
            const url = selectedPractice.content;
            if (url.startsWith('/uploads/') && (url.endsWith('.txt') || url.endsWith('.json'))) {
                fetch(getResourceUrl(url))
                    .then(res => res.text())
                    .then(text => setGrammarContent(text))
                    .catch(err => console.error("Lỗi tải file ngữ pháp:", err));
            } else {
                setGrammarContent(selectedPractice.content);
            }
        }
    }, [selectedPractice]);

    // --- ICONS CONFIG ---
    const getSkillConfig = (type) => {
        const t = (type || "").toUpperCase();
        if (t.includes('LISTENING')) return { icon: <Headphones size={32}/>, color: 'bg-green-600', label: 'Luyện Nghe' };
        if (t.includes('SPEAKING')) return { icon: <Mic size={32}/>, color: 'bg-purple-600', label: 'Luyện Nói' };
        if (t.includes('READING')) return { icon: <BookOpen size={32}/>, color: 'bg-blue-600', label: 'Luyện Đọc' };
        if (t.includes('WRITING')) return { icon: <PenTool size={32}/>, color: 'bg-pink-600', label: 'Luyện Viết' };
        if (t.includes('VOCABULARY')) return { icon: <Layers size={32}/>, color: 'bg-orange-500', label: 'Từ Vựng' };
        if (t.includes('GRAMMAR')) return { icon: <GraduationCap size={32}/>, color: 'bg-teal-600', label: 'Ngữ Pháp' };
        return { icon: <BookOpen size={32}/>, color: 'bg-gray-600', label: 'Khác' };
    };

    // --- RECORDING LOGIC ---
    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorderRef.current = new MediaRecorder(stream);
            const chunks = [];
            mediaRecorderRef.current.ondataavailable = e => chunks.push(e.data);
            mediaRecorderRef.current.onstop = () => {
                const blob = new Blob(chunks, { type: 'audio/webm' });
                setAudioBlob(blob);
                setAudioUrl(URL.createObjectURL(blob));
            };
            mediaRecorderRef.current.start();
            setIsRecording(true);
        } catch (err) { alert("Lỗi Microphone: " + err.message); }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current) mediaRecorderRef.current.stop();
        setIsRecording(false);
    };

    // --- SUBMIT LOGIC ---
    const handleSubmit = async () => {
        if (!textAnswer && !audioBlob) {
            alert("Vui lòng làm bài trước khi nộp.");
            return;
        }
        try {
            let uploadedUrl = null;
            if (audioBlob) {
                const audioFile = new File([audioBlob], `rec_${Date.now()}.webm`, { type: 'audio/webm' });
                uploadedUrl = await uploadAudioAPI(audioFile);
            }

            const contentToSubmit = (uploadedUrl ? `[AUDIO]${uploadedUrl}[/AUDIO]\n` : "") + textAnswer;

            const apiPayload = {
                title: selectedPractice.title,
                type: selectedPractice.type,
                content: contentToSubmit
            };

            const savedData = await submitPracticeAPI(apiPayload);

            // Gọi callback để App cập nhật lại dữ liệu user
            if (onSavePractice) onSavePractice(savedData);

            alert("Nộp bài thành công!");
            // Reset form
            setTextAnswer(""); setAudioUrl(null); setAudioBlob(null);

            // Nếu không phải từ vựng thì quay lại danh sách
            if (selectedCategory !== 'VOCABULARY') setSelectedPractice(null);
        } catch (error) {
            console.error(error);
            alert("Lỗi nộp bài. Vui lòng thử lại.");
        }
    };

    // --- COMPONENT: FLASHCARD VIEW (NEW DESIGN) ---
    const FlashcardView = () => {
        if (vocabList.length === 0) return <div className="text-center text-gray-500 mt-10">Chưa có dữ liệu từ vựng.</div>;

        const card = vocabList[currentCardIndex];
        const progress = ((currentCardIndex + 1) / vocabList.length) * 100;

        const handleNext = (e) => {
            e?.stopPropagation();
            if (currentCardIndex < vocabList.length - 1) {
                setIsFlipped(false);
                setTimeout(() => setCurrentCardIndex(prev => prev + 1), 150);
            }
        };

        const handlePrev = (e) => {
            e?.stopPropagation();
            if (currentCardIndex > 0) {
                setIsFlipped(false);
                setTimeout(() => setCurrentCardIndex(prev => prev - 1), 150);
            }
        };

        const handleFlip = () => setIsFlipped(!isFlipped);

        // Xử lý phím mũi tên
        useEffect(() => {
            const handleKeyDown = (e) => {
                if (e.key === 'ArrowRight') handleNext();
                if (e.key === 'ArrowLeft') handlePrev();
                if (e.key === ' ' || e.key === 'Enter') handleFlip();
            };
            window.addEventListener('keydown', handleKeyDown);
            return () => window.removeEventListener('keydown', handleKeyDown);
        }, [currentCardIndex]);

        return (
            <div className="flex flex-col items-center w-full max-w-4xl mx-auto py-6">
                {/* 1. Progress Bar */}
                <div className="w-full mb-8 px-4">
                    <div className="flex justify-between text-sm text-gray-500 mb-2 font-bold">
                        <span>Thẻ {currentCardIndex + 1}</span>
                        <span>{vocabList.length}</span>
                    </div>
                    <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-orange-500 transition-all duration-500 ease-out"
                            style={{ width: `${progress}%` }}
                        ></div>
                    </div>
                </div>

                {/* 2. Main Card Area */}
                <div className="relative w-full max-w-lg aspect-[4/3] md:aspect-[3/2] perspective-1000 group cursor-pointer" onClick={handleFlip}>
                    <div className={`w-full h-full relative transition-all duration-500 transform-style-3d ${isFlipped ? 'rotate-y-180' : ''}`}>

                        {/* --- FRONT SIDE --- */}
                        <div className="absolute inset-0 w-full h-full bg-white rounded-3xl shadow-xl border-b-4 border-gray-200 flex flex-col items-center justify-center p-8 backface-hidden">
                            <div className="absolute top-6 right-6 text-gray-300">
                                <RotateCcw size={24} />
                            </div>
                            <span className="text-sm font-bold text-orange-500 uppercase tracking-widest mb-4">Từ mới</span>

                            <h2 className="text-5xl md:text-6xl font-bold text-gray-800 mb-4 text-center">{card.word}</h2>

                            {/* Pronunciation / IPA */}
                            {card.ipa && (
                                <span className="text-gray-400 font-serif text-xl mb-6">[{card.ipa}]</span>
                            )}

                            <button
                                onClick={(e) => { e.stopPropagation(); /* Play audio logic here */ }}
                                className="mt-4 p-3 rounded-full bg-orange-50 text-orange-600 hover:bg-orange-100 transition-colors"
                            >
                                <Volume2 size={24} />
                            </button>

                            <p className="absolute bottom-6 text-gray-400 text-xs animate-pulse">Chạm để xem nghĩa</p>
                        </div>

                        {/* --- BACK SIDE --- */}
                        <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-blue-600 to-blue-800 text-white rounded-3xl shadow-xl border-b-4 border-blue-900 flex flex-col items-center justify-center p-8 backface-hidden rotate-y-180">
                            <h3 className="text-3xl md:text-4xl font-bold mb-6 text-center">{card.meaning}</h3>

                            <div className="w-16 h-1 bg-white/30 rounded-full mb-6"></div>

                            {card.example && (
                                <div className="text-center bg-white/10 p-4 rounded-xl backdrop-blur-sm w-full">
                                    <p className="text-lg italic font-medium opacity-90">"{card.example}"</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* 3. Controls */}
                <div className="flex items-center gap-6 mt-10">
                    <button
                        onClick={handlePrev}
                        disabled={currentCardIndex === 0}
                        className="p-4 rounded-full bg-white text-gray-600 shadow-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95 border border-gray-100"
                    >
                        <ArrowLeft size={28} />
                    </button>

                    <button
                        onClick={handleFlip}
                        className="px-8 py-3 rounded-xl bg-blue-600 text-white font-bold shadow-lg hover:bg-blue-700 transition-all active:scale-95 flex items-center gap-2"
                    >
                        <RotateCcw size={20} />
                        {isFlipped ? "Xem từ" : "Xem nghĩa"}
                    </button>

                    <button
                        onClick={handleNext}
                        disabled={currentCardIndex === vocabList.length - 1}
                        className="p-4 rounded-full bg-white text-gray-600 shadow-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95 border border-gray-100"
                    >
                        <ArrowRight size={28} />
                    </button>
                </div>

                <p className="mt-6 text-gray-400 text-sm">Mẹo: Dùng phím mũi tên &lt; &gt; để chuyển thẻ</p>
            </div>
        );
    };

    // --- RENDER CONTENT CHO CÁC BÀI TẬP KHÁC ---
    const renderStandardContent = () => {
        const isFile = selectedPractice.content && selectedPractice.content.startsWith('/uploads/');
        const ext = isFile ? selectedPractice.content.split('.').pop().toLowerCase() : '';

        return (
            <div className="w-full h-full bg-gray-50 rounded-xl border border-gray-200 overflow-hidden relative min-h-[400px]">
                {/* Thanh công cụ */}
                <div className="bg-white p-2 border-b flex justify-between items-center shadow-sm">
                    <span className="text-xs font-bold text-gray-500 uppercase px-2">Tài liệu tham khảo</span>
                    <div className="flex gap-1">
                        <button onClick={() => setIsDrawingMode(!isDrawingMode)} className={`p-1.5 rounded transition-colors ${isDrawingMode ? 'bg-orange-100 text-orange-600' : 'hover:bg-gray-100 text-gray-600'}`}>
                            <PenTool size={18}/>
                        </button>
                        <button onClick={() => setIsFullscreenView(!isFullscreenView)} className="p-1.5 hover:bg-gray-100 text-gray-600 rounded">
                            {isFullscreenView ? <Minimize2 size={18}/> : <Maximize2 size={18}/>}
                        </button>
                    </div>
                </div>

                {/* Nội dung chính */}
                <div className={`w-full h-full overflow-auto p-6 ${isFullscreenView ? 'fixed inset-0 z-50 bg-white' : ''}`}>
                    {isFullscreenView && (
                        <button onClick={() => setIsFullscreenView(false)} className="absolute top-4 right-4 bg-gray-100 p-2 rounded-full hover:bg-red-100 hover:text-red-600 transition-colors">
                            <X size={24}/>
                        </button>
                    )}

                    {isFile ? (
                        ext === 'pdf' ? (
                            <iframe src={`${getResourceUrl(selectedPractice.content)}#toolbar=0`} className="w-full h-full min-h-[80vh]" title="Document"/>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-center text-gray-500">
                                <FileText size={64} className="mb-4 text-blue-200"/>
                                <p>File tài liệu: <b>{selectedPractice.content.split('/').pop()}</b></p>
                                <a href={getResourceUrl(selectedPractice.content)} target="_blank" rel="noreferrer" className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Tải xuống</a>
                            </div>
                        )
                    ) : (
                        <div className="prose max-w-none">
                            <pre className="whitespace-pre-wrap font-serif text-lg leading-relaxed text-gray-800">{grammarContent || selectedPractice.content}</pre>
                        </div>
                    )}
                </div>
            </div>
        );
    };


    // --- VIEW 1: SELECT CATEGORY ---
    if (!selectedCategory) {
        return (
            <div className="w-full min-h-screen container mx-auto px-4 py-8 pb-24">
                <div className="text-center mb-12">
                    <h2 className="text-4xl font-bold text-gray-800">Trung Tâm Luyện Tập</h2>
                    <p className="text-gray-500 mt-2 text-lg">Chọn kỹ năng bạn muốn rèn luyện hôm nay</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
                    {['LISTENING', 'SPEAKING', 'READING', 'WRITING', 'VOCABULARY', 'GRAMMAR'].map((id) => {
                        const config = getSkillConfig(id);
                        return (
                            <div key={id} onClick={() => setSelectedCategory(id)} className="bg-white rounded-2xl shadow-sm hover:shadow-xl cursor-pointer transition-all duration-300 p-8 flex flex-col items-center text-center group border border-gray-100 hover:-translate-y-1">
                                <div className={`p-5 rounded-full ${config.color} text-white mb-6 group-hover:scale-110 transition-transform shadow-lg`}>
                                    {config.icon}
                                </div>
                                <h3 className="text-xl font-bold text-gray-800 mb-2">{config.label}</h3>
                                <p className="text-blue-500 font-bold text-sm mt-auto flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0">
                                    Bắt đầu ngay <ArrowRight size={16}/>
                                </p>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    }

    // --- VIEW 2: SELECT TOPIC ---
    if (!selectedPractice) {
        const filteredList = allPractices.filter(p => p.type === selectedCategory);
        const config = getSkillConfig(selectedCategory);

        return (
            <div className="w-full min-h-screen container mx-auto px-4 py-8 max-w-7xl">
                <button onClick={() => setSelectedCategory(null)} className= "text-white font-bold mb-8 flex items-center gap-2 transition-transform hover:-translate-x-1">
                    <ArrowLeft size={20}/> Quay lại
                </button>

                <div className="flex items-center gap-6 mb-10 border-b border-gray-200 pb-6">
                    <div className={`p-4 rounded-2xl text-white shadow-lg ${config.color}`}>{config.icon}</div>
                    <div>
                        <h2 className="text-3xl font-bold text-gray-800">Chủ đề {config.label}</h2>
                        <p className="text-gray-500 mt-1">Chọn một chủ đề bên dưới để bắt đầu luyện tập</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredList.map(practice => (
                        <div key={practice.id} onClick={() => setSelectedPractice(practice)} className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md border border-gray-100 cursor-pointer transition-all flex justify-between items-center group hover:border-blue-200">
                            <div>
                                <h4 className="text-xl font-bold text-gray-800 group-hover:text-blue-600 transition-colors mb-1">
                                    {practice.title}
                                </h4>
                                <p className="text-gray-500 text-sm line-clamp-1">{practice.description || "Bài luyện tập thực hành"}</p>
                            </div>
                            <div className="bg-gray-50 p-3 rounded-full text-gray-400 group-hover:bg-blue-100 group-hover:text-blue-600 transition-all">
                                <PlayCircle size={24}/>
                            </div>
                        </div>
                    ))}
                    {filteredList.length === 0 && (
                        <div className="col-span-full text-center py-20 bg-gray-50 rounded-2xl border border-dashed border-gray-300">
                            <p className="text-gray-400 font-medium">Chưa có bài tập nào trong mục này.</p>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // --- VIEW 3: DOING PRACTICE ---
    const config = getSkillConfig(selectedCategory);

    // MÀN HÌNH RIÊNG CHO FLASHCARD
    if (selectedCategory === 'VOCABULARY') {
        return (
            <div className="w-full min-h-screen bg-gray-50">
                <div className="container mx-auto px-4 py-8 max-w-6xl">
                    <button onClick={() => setSelectedPractice(null)} className="text-gray-500 font-bold mb-6 hover:text-orange-600 flex items-center gap-2 transition-colors">
                        <ArrowLeft size={20}/> Chọn chủ đề khác
                    </button>

                    <div className="text-center mb-8">
                        <h2 className="text-3xl font-bold text-gray-800 mb-2">{selectedPractice.title}</h2>
                        <p className="text-gray-500">{selectedPractice.description}</p>
                    </div>

                    <FlashcardView />
                </div>
            </div>
        );
    }

    // MÀN HÌNH CHO CÁC KỸ NĂNG KHÁC (NGHE/NÓI/ĐỌC/VIẾT)
    return (
        <div className="w-full min-h-screen container mx-auto px-4 py-8 max-w-[1600px] animate-fade-in pb-24">
            <button onClick={() => setSelectedPractice(null)} className="text-blue-600 font-bold mb-6 hover:underline flex items-center gap-2">
                <ArrowLeft size={20}/> Quay lại danh sách
            </button>

            <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 border border-gray-100">
                <div className="flex items-center gap-4 mb-8 border-b pb-6">
                    <div className={`p-3 rounded-xl text-white shadow-sm ${config.color}`}>{config.icon}</div>
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800">{selectedPractice.title}</h2>
                        <p className="text-gray-500">{selectedPractice.description}</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">
                    {/* LEFT COL: CONTENT */}
                    <div className="space-y-6 flex flex-col">
                        {selectedPractice.mediaUrl && (
                            <div className="bg-blue-50 p-4 rounded-xl border border-blue-200 flex items-center gap-4">
                                <div className="bg-blue-600 text-white p-3 rounded-full shadow-md"><Headphones size={24}/></div>
                                <div className="flex-1">
                                    <p className="font-bold text-blue-900 mb-1 text-sm uppercase tracking-wide">Audio Đề bài</p>
                                    <audio controls src={getResourceUrl(selectedPractice.mediaUrl)} className="w-full h-8 accent-blue-600"/>
                                </div>
                            </div>
                        )}
                        <div className="flex-1">
                            {renderStandardContent()}
                        </div>
                    </div>

                    {/* RIGHT COL: ANSWER */}
                    <div className="flex flex-col h-full bg-gray-50 rounded-xl p-6 border border-gray-200">
                        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <PenTool size={20} className="text-blue-600"/> Khu vực trả lời
                        </h3>

                        {selectedCategory === 'SPEAKING' && (
                            <div className="mb-6 bg-white p-6 rounded-xl border border-gray-200 shadow-sm text-center">
                                <p className="mb-4 font-bold text-gray-700">Ghi âm câu trả lời của bạn</p>
                                <div className="flex flex-col items-center gap-4">
                                    {!isRecording ? (
                                        <div className="flex gap-4">
                                            <button onClick={startRecording} className="bg-red-500 hover:bg-red-600 text-white p-4 rounded-full shadow-lg transition-transform hover:scale-110 group">
                                                <Mic size={32} className="group-hover:animate-pulse"/>
                                            </button>
                                            {audioUrl && (
                                                <button onClick={() => { setAudioUrl(null); setAudioBlob(null); }} className="bg-gray-200 hover:bg-gray-300 text-gray-600 p-4 rounded-full shadow-md transition-colors">
                                                    <Trash2 size={24} />
                                                </button>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center gap-2">
                                            <div className="animate-pulse text-red-500 font-bold text-sm">Đang ghi âm...</div>
                                            <button onClick={stopRecording} className="bg-gray-800 hover:bg-black text-white p-4 rounded-full shadow-lg animate-pulse">
                                                <StopCircle size={32} />
                                            </button>
                                        </div>
                                    )}

                                    {audioUrl && (
                                        <div className="w-full mt-2 p-2 bg-gray-100 rounded-lg">
                                            <audio controls src={audioUrl} className="w-full h-8" />
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        <div className="flex-1 mb-6">
                            <label className="block font-bold text-gray-700 mb-2 text-sm">
                                {selectedCategory === 'GRAMMAR' ? "Nhập đáp án bài tập:" : "Bài viết / Ghi chú:"}
                            </label>
                            <textarea
                                className="w-full h-full p-4 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-base bg-white shadow-inner text-gray-800 resize-none font-medium"
                                placeholder="Nhập nội dung trả lời tại đây..."
                                value={textAnswer}
                                onChange={e => setTextAnswer(e.target.value)}
                            ></textarea>
                        </div>

                        <button onClick={handleSubmit} className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-xl shadow-lg transition-all hover:-translate-y-0.5 flex justify-center items-center gap-2 text-lg">
                            <Save size={24}/> Nộp bài
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PracticePage;