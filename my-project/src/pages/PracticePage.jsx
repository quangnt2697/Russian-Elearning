import React, { useState, useEffect } from 'react';
import { fetchPracticesAPI } from '../services/api';

// Import các Component con đã tách
import PracticeCategoryList from '../components/practices/PracticeCategoryList';
import PracticeTopicList from '../components/practices/PracticeTopicList';
import FlashcardViewer from '../components/practices/FlashcardViewer';
import StandardPracticeView from '../components/practices/StandardPracticeView';

const PracticePage = ({ user, onSavePractice }) => {
    // --- STATE DỮ LIỆU ---
    const [allPractices, setAllPractices] = useState([]);

    // --- STATE ĐIỀU HƯỚNG ---
    // viewState: 'CATEGORIES' (Chọn kỹ năng) -> 'TOPICS' (Chọn bài) -> 'DOING' (Làm bài)
    const [viewState, setViewState] = useState('CATEGORIES');
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [selectedPractice, setSelectedPractice] = useState(null);

    // --- EFFECT: TẢI DỮ LIỆU BAN ĐẦU ---
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

    // --- HANDLERS: XỬ LÝ CHUYỂN MÀN HÌNH ---

    // 1. Chọn danh mục (Listening, Speaking...)
    const handleSelectCategory = (catId) => {
        setSelectedCategory(catId);
        setViewState('TOPICS');
    };

    // 2. Chọn bài tập cụ thể
    const handleSelectPractice = (practice) => {
        setSelectedPractice(practice);
        setViewState('DOING');
    };

    // 3. Quay lại từ danh sách bài tập (về màn hình danh mục)
    const handleBackFromTopics = () => {
        setSelectedCategory(null);
        setViewState('CATEGORIES');
    };

    // 4. Quay lại từ màn hình làm bài (về danh sách bài tập)
    const handleBackFromDoing = () => {
        setSelectedPractice(null);
        setViewState('TOPICS');
    };

    // 5. Xử lý khi nộp bài thành công (Update data ra ngoài App nếu cần)
    const handleSaveSuccess = (data) => {
        if (onSavePractice) onSavePractice(data);
    };

    // --- RENDER: ĐIỀU HƯỚNG HIỂN THỊ ---

    // MÀN HÌNH 3: LÀM BÀI (DOING)
    if (viewState === 'DOING' && selectedPractice) {
        // Nếu là bài học từ vựng -> Hiển thị giao diện Flashcard
        if (selectedPractice.type === 'VOCABULARY') {
            return (
                <FlashcardViewer
                    practice={selectedPractice}
                    onBack={handleBackFromDoing}
                />
            );
        }
        // Các dạng bài khác (Nghe/Nói/Đọc/Viết) -> Hiển thị giao diện chuẩn
        return (
            <StandardPracticeView
                practice={selectedPractice}
                onBack={handleBackFromDoing}
                onSaveSuccess={handleSaveSuccess}
            />
        );
    }

    // MÀN HÌNH 2: DANH SÁCH CHỦ ĐỀ (TOPICS)
    if (viewState === 'TOPICS' && selectedCategory) {
        return (
            <PracticeTopicList
                practices={allPractices}
                category={selectedCategory}
                onSelectPractice={handleSelectPractice}
                onBack={handleBackFromTopics}
            />
        );
    }

    // MÀN HÌNH 1: DANH MỤC KỸ NĂNG (CATEGORIES - Mặc định)
    return (
        <PracticeCategoryList
            onSelectCategory={handleSelectCategory}
        />
    );
};

export default PracticePage;