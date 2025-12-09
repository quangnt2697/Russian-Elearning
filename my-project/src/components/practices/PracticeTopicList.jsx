import React from 'react';
import { ArrowLeft, PlayCircle, Headphones, Mic, BookOpen, PenTool, Layers, GraduationCap } from 'lucide-react';

const getIconConfig = (type) => {
    const t = (type || "").toUpperCase();
    if (t.includes('LISTENING')) return { icon: <Headphones size={24}/>, color: 'bg-green-600', label: 'Luyện Nghe' };
    if (t.includes('SPEAKING')) return { icon: <Mic size={24}/>, color: 'bg-purple-600', label: 'Luyện Nói' };
    if (t.includes('READING')) return { icon: <BookOpen size={24}/>, color: 'bg-blue-600', label: 'Luyện Đọc' };
    if (t.includes('WRITING')) return { icon: <PenTool size={24}/>, color: 'bg-pink-600', label: 'Luyện Viết' };
    if (t.includes('VOCABULARY')) return { icon: <Layers size={24}/>, color: 'bg-orange-500', label: 'Từ Vựng' };
    if (t.includes('GRAMMAR')) return { icon: <GraduationCap size={24}/>, color: 'bg-teal-600', label: 'Ngữ Pháp' };
    return { icon: <BookOpen size={24}/>, color: 'bg-gray-600', label: 'Khác' };
};

const PracticeTopicList = ({ practices, category, onSelectPractice, onBack }) => {
    const filteredList = practices.filter(p => p.type === category);
    const config = getIconConfig(category);

    return (
        <div className="w-full min-h-screen container mx-auto px-4 py-8 max-w-7xl">
            <button onClick={onBack} className="text-blue-600 font-bold mb-8 flex items-center gap-2 hover:underline">
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
                    <div key={practice.id} onClick={() => onSelectPractice(practice)} className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md border border-gray-100 cursor-pointer transition-all flex justify-between items-center group">
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
                    <div className="col-span-full text-center py-20 bg-gray-50 rounded-2xl border border-dashed text-gray-400">
                        Chưa có bài tập nào.
                    </div>
                )}
            </div>
        </div>
    );
};

export default PracticeTopicList;