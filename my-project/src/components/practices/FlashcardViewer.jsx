import React, { useState, useEffect } from 'react';
import { ArrowLeft, ArrowRight, RotateCcw } from 'lucide-react';

const MOCK_FLASHCARDS = [
    { id: 1, word: 'Привет', meaning: 'Xin chào', example: 'Привет, как дела?', ipa: '/prʲɪˈvʲet/' },
    { id: 2, word: 'Спасибо', meaning: 'Cảm ơn', example: 'Большое спасибо!', ipa: '/spɐˈsʲibə/' },
];

const FlashcardViewer = ({ practice, onBack }) => {
    const [vocabList, setVocabList] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);

    useEffect(() => {
        try {
            const parsed = JSON.parse(practice.content || "[]");
            setVocabList(parsed.length > 0 ? parsed : MOCK_FLASHCARDS);
        } catch (e) {
            setVocabList(MOCK_FLASHCARDS);
        }
    }, [practice]);

    const handleNext = () => {
        if (currentIndex < vocabList.length - 1) {
            setIsFlipped(false);
            setTimeout(() => setCurrentIndex(prev => prev + 1), 150);
        }
    };

    const handlePrev = () => {
        if (currentIndex > 0) {
            setIsFlipped(false);
            setTimeout(() => setCurrentIndex(prev => prev - 1), 150);
        }
    };

    if (vocabList.length === 0) return <div className="text-center py-10">Không có dữ liệu.</div>;

    const card = vocabList[currentIndex];
    const progress = ((currentIndex + 1) / vocabList.length) * 100;

    return (
        <div className="w-full min-h-screen bg-gray-50 container mx-auto px-4 py-8">
            <button onClick={onBack} className="text-gray-500 font-bold mb-6 hover:text-orange-600 flex items-center gap-2 transition-colors">
                <ArrowLeft size={20}/> Chọn chủ đề khác
            </button>
            <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-gray-800 mb-2">{practice.title}</h2>
                <p className="text-gray-500">{practice.description}</p>
            </div>

            <div className="flex flex-col items-center w-full max-w-4xl mx-auto py-6">
                {/* Progress */}
                <div className="w-full mb-8 px-4">
                    <div className="flex justify-between text-sm text-gray-500 mb-2 font-bold">
                        <span>Thẻ {currentIndex + 1}</span>
                        <span>{vocabList.length}</span>
                    </div>
                    <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full bg-orange-500 transition-all duration-500 ease-out" style={{ width: `${progress}%` }}></div>
                    </div>
                </div>

                {/* Card */}
                <div className="relative w-full max-w-lg aspect-[3/2] perspective-1000 group cursor-pointer" onClick={() => setIsFlipped(!isFlipped)}>
                    <div className={`w-full h-full relative transition-all duration-500 transform-style-3d ${isFlipped ? 'rotate-y-180' : ''}`}>
                        {/* Front */}
                        <div className="absolute inset-0 w-full h-full bg-white rounded-3xl shadow-xl border-b-4 border-gray-200 flex flex-col items-center justify-center p-8 backface-hidden">
                            <span className="text-sm font-bold text-orange-500 uppercase tracking-widest mb-4">Từ mới</span>
                            <h2 className="text-5xl font-bold text-gray-800 mb-4 text-center">{card.word}</h2>
                            {card.ipa && <span className="text-gray-400 font-serif text-xl">[{card.ipa}]</span>}
                            <p className="absolute bottom-6 text-gray-400 text-xs animate-pulse">Chạm để xem nghĩa</p>
                        </div>
                        {/* Back */}
                        <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-blue-600 to-blue-800 text-white rounded-3xl shadow-xl border-b-4 border-blue-900 flex flex-col items-center justify-center p-8 backface-hidden rotate-y-180">
                            <h3 className="text-3xl font-bold mb-6 text-center">{card.meaning}</h3>
                            <div className="w-16 h-1 bg-white/30 rounded-full mb-6"></div>
                            {card.example && <p className="text-lg italic opacity-90 text-center">"{card.example}"</p>}
                        </div>
                    </div>
                </div>

                {/* Controls */}
                <div className="flex items-center gap-6 mt-10">
                    <button onClick={handlePrev} disabled={currentIndex === 0} className="p-4 rounded-full bg-white text-gray-600 shadow-lg disabled:opacity-30 border"><ArrowLeft size={24} /></button>
                    <button onClick={() => setIsFlipped(!isFlipped)} className="px-8 py-3 rounded-xl bg-blue-600 text-white font-bold shadow-lg flex items-center gap-2"><RotateCcw size={20} /> Lật thẻ</button>
                    <button onClick={handleNext} disabled={currentIndex === vocabList.length - 1} className="p-4 rounded-full bg-white text-gray-600 shadow-lg disabled:opacity-30 border"><ArrowRight size={24} /></button>
                </div>
            </div>
        </div>
    );
};

export default FlashcardViewer;