import React, { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, ArrowRight, RotateCcw, Volume2, Sparkles, X } from 'lucide-react';

const MOCK_FLASHCARDS = [
    { id: 1, word: 'Привет', meaning: 'Xin chào', example: 'Привет, как дела?', ipa: '/prʲɪˈvʲet/' },
    { id: 2, word: 'Спасибо', meaning: 'Cảm ơn', example: 'Большое спасибо!', ipa: '/spɐˈsʲibə/' },
    { id: 3, word: 'Любовь', meaning: 'Tình yêu', example: 'Я верю в любовь', ipa: '/lʲuˈbofʲ/' },
];

const FlashcardViewer = ({ practice = {}, onBack }) => {
    const [vocabList, setVocabList] = useState([]);

    useEffect(() => {
        try {
            const content = practice.content;
            const parsed = typeof content === 'string' ? JSON.parse(content) : content;
            setVocabList(Array.isArray(parsed) && parsed.length > 0 ? parsed : MOCK_FLASHCARDS);
        } catch (e) {
            setVocabList(MOCK_FLASHCARDS);
        }
    }, [practice]);

    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [direction, setDirection] = useState(0);

    const card = vocabList[currentIndex];
    const progress = Math.round(((currentIndex + 1) / vocabList.length) * 100);

    const playAudio = (e) => {
        e.stopPropagation();
        if (!card) return;
        const utterance = new SpeechSynthesisUtterance(card.word);
        utterance.lang = 'ru-RU';
        utterance.rate = 0.8;
        window.speechSynthesis.speak(utterance);
    };

    const handleNext = useCallback(() => {
        if (currentIndex < vocabList.length - 1) {
            setIsFlipped(false);
            setDirection(1);
            setTimeout(() => {
                setCurrentIndex(prev => prev + 1);
                setDirection(0);
            }, 300);
        }
    }, [currentIndex, vocabList.length]);

    const handlePrev = useCallback(() => {
        if (currentIndex > 0) {
            setIsFlipped(false);
            setDirection(-1);
            setTimeout(() => {
                setCurrentIndex(prev => prev - 1);
                setDirection(0);
            }, 300);
        }
    }, [currentIndex]);

    const handleFlip = useCallback(() => {
        setIsFlipped(prev => !prev);
    }, []);

    // Phím tắt
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.code === 'Space') { e.preventDefault(); handleFlip(); }
            else if (e.code === 'ArrowRight') handleNext();
            else if (e.code === 'ArrowLeft') handlePrev();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleFlip, handleNext, handlePrev]);

    if (vocabList.length === 0) return null;

    return (
        // NỀN TRẮNG CHÍNH CỦA WEBSITE
        <div className="w-full min-h-screen bg-white flex flex-col font-sans text-slate-700">

            {/* Header đơn giản */}
            <div className="max-w-5xl mx-auto w-full px-6 py-6 flex items-center justify-between">
                <button
                    onClick={onBack}
                    className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 transition-colors"
                >
                    <X size={24} />
                </button>

                {/* Progress Bar với Gradient nổi bật */}
                <div className="flex-1 mx-8 max-w-md">
                    <div className="h-4 bg-slate-100 rounded-full overflow-hidden relative border border-slate-200">
                        {/* Hiệu ứng bóng sáng trên thanh progress */}
                        <div className="absolute top-0 left-0 w-full h-1/2 bg-white/30 z-10"></div>
                        <div
                            className="h-full bg-gradient-to-r from-indigo-400 via-purple-500 to-pink-500 transition-all duration-500 ease-out relative"
                            style={{ width: `${progress}%` }}
                        >
                            {/* Hiệu ứng hạt lấp lánh nhẹ ở đầu thanh */}
                            <div className="absolute right-0 top-0 bottom-0 w-2 bg-white/50 blur-[2px]"></div>
                        </div>
                    </div>
                    <div className="flex justify-between mt-2 text-xs font-bold text-slate-400 uppercase tracking-wide">
                        <span>Bắt đầu</span>
                        <span>{currentIndex + 1} / {vocabList.length}</span>
                    </div>
                </div>

                <div className="w-10"></div> {/* Spacer */}
            </div>

            {/* MAIN CONTENT ZONE */}
            <div className="flex-1 flex flex-col items-center justify-center p-4 relative overflow-hidden">

                {/* BACKGROUND DECORATION (Làm nền trắng bớt nhàm chán) */}
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse"></div>
                    <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse" style={{animationDelay: '1s'}}></div>
                </div>

                {/* --- FLASHCARD --- */}
                <div className="w-full max-w-xl perspective-1000 z-10">
                    <div
                        className={`relative w-full aspect-[4/3] cursor-pointer transition-all duration-500 transform-style-3d 
                            ${isFlipped ? 'rotate-y-180' : ''} 
                            ${direction === 1 ? 'translate-x-20 opacity-0 rotate-12' : direction === -1 ? '-translate-x-20 opacity-0 -rotate-12' : 'translate-x-0 opacity-100 rotate-0'}
                        `}
                        onClick={handleFlip}
                    >
                        {/* === FRONT (Tiếng Nga) === */}
                        {/* Thiết kế: Nền trắng, Viền màu tím dày (3D), Đổ bóng sâu */}
                        <div className="absolute inset-0 w-full h-full bg-white rounded-3xl border-2 border-indigo-100 border-b-8 flex flex-col items-center justify-center p-8 backface-hidden shadow-[0_10px_40px_-10px_rgba(0,0,0,0.08)] group hover:-translate-y-1 hover:shadow-[0_20px_40px_-10px_rgba(99,102,241,0.2)] transition-all duration-300">

                            {/* Loa nghe */}
                            <button
                                onClick={playAudio}
                                className="absolute top-6 right-6 p-3 rounded-2xl bg-indigo-50 text-indigo-600 hover:bg-indigo-500 hover:text-white hover:scale-110 transition-all border-b-4 border-indigo-200 hover:border-indigo-700 active:border-b-0 active:translate-y-1"
                            >
                                <Volume2 size={24} />
                            </button>

                            <div className="flex items-center gap-2 mb-6 opacity-60">
                                <Sparkles size={16} className="text-yellow-500" />
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Từ vựng</span>
                            </div>

                            <h2 className="text-6xl md:text-7xl font-bold text-slate-800 mb-3 text-center tracking-tight">
                                {card.word}
                            </h2>

                            {card.ipa && (
                                <span className="px-4 py-2 bg-slate-100 rounded-lg text-slate-500 font-serif text-xl italic">
                                    /{card.ipa}/
                                </span>
                            )}

                            <div className="absolute bottom-6 text-indigo-400 text-sm font-bold animate-bounce mt-4">
                                Chạm để xem nghĩa
                            </div>
                        </div>

                        {/* === BACK (Tiếng Việt) === */}
                        {/* Thiết kế: Gradient rực rỡ từ Tím sang Hồng để nổi bật trên nền trắng */}
                        <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-violet-600 to-indigo-600 text-white rounded-3xl border-2 border-violet-500 border-b-8 flex flex-col items-center justify-center p-8 backface-hidden rotate-y-180 shadow-2xl">

                            <div className="w-16 h-2 bg-white/20 rounded-full mb-8"></div>

                            <h3 className="text-4xl md:text-5xl font-bold mb-6 text-center drop-shadow-md">
                                {card.meaning}
                            </h3>

                            {card.example && (
                                <div className="bg-white/10 backdrop-blur-md rounded-xl p-5 border border-white/20 max-w-sm">
                                    <p className="text-lg text-center font-medium leading-relaxed text-indigo-50">
                                        "{card.example}"
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* --- CONTROLS --- */}
                <div className="mt-12 flex items-center gap-6 z-10">
                    <button
                        onClick={handlePrev}
                        disabled={currentIndex === 0}
                        className="group w-16 h-16 rounded-2xl bg-white border-2 border-slate-200 border-b-4 text-slate-400 flex items-center justify-center hover:bg-slate-50 hover:text-indigo-500 hover:border-indigo-200 active:border-b-2 active:translate-y-[2px] transition-all disabled:opacity-40 disabled:active:translate-y-0 disabled:active:border-b-4 disabled:cursor-not-allowed"
                    >
                        <ArrowLeft size={28} className="group-hover:scale-110 transition-transform"/>
                    </button>

                    <button
                        onClick={handleFlip}
                        className="px-8 py-4 rounded-2xl bg-indigo-600 text-white font-bold text-lg border-b-4 border-indigo-800 hover:bg-indigo-500 hover:border-indigo-700 active:border-b-0 active:translate-y-1 transition-all shadow-lg shadow-indigo-200 flex items-center gap-2"
                    >
                        <RotateCcw size={20} />
                        Lật thẻ
                    </button>

                    <button
                        onClick={handleNext}
                        disabled={currentIndex === vocabList.length - 1}
                        className="group w-16 h-16 rounded-2xl bg-white border-2 border-slate-200 border-b-4 text-slate-400 flex items-center justify-center hover:bg-slate-50 hover:text-indigo-500 hover:border-indigo-200 active:border-b-2 active:translate-y-[2px] transition-all disabled:opacity-40 disabled:active:translate-y-0 disabled:active:border-b-4 disabled:cursor-not-allowed"
                    >
                        <ArrowRight size={28} className="group-hover:scale-110 transition-transform"/>
                    </button>
                </div>

            </div>
        </div>
    );
};

export default FlashcardViewer;