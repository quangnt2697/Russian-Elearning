import React, { useState, useEffect } from 'react';
import { ArrowLeft, BookOpen, Volume2, PlayCircle } from 'lucide-react';
import { fetchLessonsAPI } from '../services/api';

const LessonsPage = () => {
    const [lessons, setLessons] = useState([]);
    const [selectedLesson, setSelectedLesson] = useState(null);

    useEffect(() => {
        const load = async () => {
            try {
                const data = await fetchLessonsAPI();
                setLessons(data);
            } catch (error) { console.error("Lỗi tải bài giảng", error); }
        };
        load();
    }, []);

    // Giao diện chi tiết bài học
    if (selectedLesson) {
        return (
            <div className="w-full min-h-screen container mx-auto px-4 py-8 animate-fade-in max-w-[1600px]">
                <button onClick={() => setSelectedLesson(null)} className="flex items-center gap-2 text-white font-medium mb-6 sticky top-4 backdrop-blur-sm py-2 rounded-lg z-10 w-fit px-4 border border-blue-100 shadow-sm transition-transform hover:-translate-x-1">
                    <ArrowLeft size={20} /> Quay lại
                </button>

                <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-8">
                    <div className="bg-gradient-to-r from-blue-700 to-blue-500 p-8 text-white">
                        <div className="flex items-center gap-4 mb-4">
                            <span className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
                                <BookOpen size={32} />
                            </span>
                            <span className="uppercase tracking-wider text-sm font-bold bg-yellow-400 text-blue-900 px-3 py-1 rounded-full shadow-sm">Bài học</span>
                        </div>
                        <h1 className="text-3xl md:text-4xl font-bold mb-4">{selectedLesson.title}</h1>
                        <p className="text-blue-100 text-lg">{selectedLesson.description}</p>
                    </div>

                    <div className="p-8">
                        {selectedLesson.audioUrl && (
                            <div className="mb-8 bg-gray-50 p-6 rounded-xl border border-gray-200 flex items-center gap-4 shadow-inner">
                                <div className="bg-blue-600 p-3 rounded-full text-white shadow-lg shadow-blue-200">
                                    <Volume2 size={24} />
                                </div>
                                <div className="flex-1">
                                    <p className="font-bold text-gray-700 mb-2">Nghe bài giảng audio</p>
                                    <audio controls className="w-full h-10 accent-blue-600">
                                        <source src={`http://localhost:8080${selectedLesson.audioUrl}`} type="audio/mpeg" />
                                        Trình duyệt không hỗ trợ audio.
                                    </audio>
                                </div>
                            </div>
                        )}

                        <div className="prose max-w-none text-gray-800 leading-relaxed bg-white">
                            {/* Hiển thị nội dung bài học (có thể chứa HTML hoặc text) */}
                            <div className="whitespace-pre-line text-lg">
                                {selectedLesson.theory || "Nội dung chi tiết đang được cập nhật..."}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Giao diện danh sách
    return (
        <div className="w-full min-h-screen container max-w-[1600px] mx-auto px-4 py-8 animate-fade-in pb-20">
            <div className="text-center mb-12">
                <h2 className="text-4xl font-bold text-gray-800 mb-4">Kho Bài Giảng</h2>
                <p className="text-gray-500 max-w-2xl mx-auto text-lg">Hệ thống bài học được thiết kế bài bản từ cơ bản đến nâng cao, giúp bạn nắm vững kiến thức một cách dễ dàng.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {lessons.map((lesson) => (
                    <div key={lesson.id} className="group bg-white rounded-2xl shadow-sm hover:shadow-2xl transition-all duration-300 border border-gray-100 flex flex-col overflow-hidden hover:-translate-y-1 h-full cursor-pointer">
                        <div className="h-48 bg-gradient-to-br from-blue-400 to-indigo-600 relative flex items-center justify-center">
                            <BookOpen className="text-white/20 absolute -right-4 -bottom-4 transform -rotate-12" size={120} />
                            <PlayCircle className="text-white relative z-10 drop-shadow-lg group-hover:scale-110 transition-transform cursor-pointer" size={60} onClick={() => setSelectedLesson(lesson)}/>
                        </div>

                        <div className="p-6 flex-1 flex flex-col">
                            <h3 className="text-xl font-bold text-gray-800 mb-2 line-clamp-2 group-hover:text-blue-700 transition-colors">
                                {lesson.title}
                            </h3>
                            <p className="text-gray-600 text-sm line-clamp-3 mb-6 flex-1 font-medium">
                                {lesson.description || "Nội dung đang cập nhật..."}
                            </p>

                            <button
                                onClick={() => setSelectedLesson(lesson)}
                                className="w-full bg-blue-100 hover:bg-blue-600 text-blue-700 hover:text-white font-bold py-3 rounded-xl transition-all duration-300 mt-auto"
                            >
                                Học ngay
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default LessonsPage;