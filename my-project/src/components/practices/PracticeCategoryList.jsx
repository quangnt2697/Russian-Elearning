import React from 'react';
import { ArrowRight, Mic, BookOpen, PenTool, Headphones, Layers, GraduationCap } from 'lucide-react';

const CATEGORIES = [
    { id: 'LISTENING', label: 'Luyện Nghe', icon: <Headphones size={32}/>, color: 'bg-green-600' },
    { id: 'SPEAKING', label: 'Luyện Nói', icon: <Mic size={32}/>, color: 'bg-purple-600' },
    { id: 'READING', label: 'Luyện Đọc', icon: <BookOpen size={32}/>, color: 'bg-blue-600' },
    { id: 'WRITING', label: 'Luyện Viết', icon: <PenTool size={32}/>, color: 'bg-pink-600' },
    { id: 'VOCABULARY', label: 'Từ Vựng', icon: <Layers size={32}/>, color: 'bg-orange-500' },
    { id: 'GRAMMAR', label: 'Ngữ Pháp', icon: <GraduationCap size={32}/>, color: 'bg-teal-600' },
];

const PracticeCategoryList = ({ onSelectCategory }) => {
    return (
        <div className="w-full min-h-screen container mx-auto px-4 py-8 pb-24">
            <div className="text-center mb-12">
                <h2 className="text-4xl font-bold text-gray-800">Trung Tâm Luyện Tập</h2>
                <p className="text-gray-500 mt-2 text-lg">Chọn kỹ năng bạn muốn rèn luyện hôm nay</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
                {CATEGORIES.map((cat) => (
                    <div key={cat.id} onClick={() => onSelectCategory(cat.id)} className="bg-white rounded-2xl shadow-sm hover:shadow-xl cursor-pointer transition-all duration-300 p-8 flex flex-col items-center text-center group border border-gray-100 hover:-translate-y-1">
                        <div className={`p-5 rounded-full ${cat.color} text-white mb-6 group-hover:scale-110 transition-transform shadow-lg`}>
                            {cat.icon}
                        </div>
                        <h3 className="text-xl font-bold text-gray-800 mb-2">{cat.label}</h3>
                        <p className="text-blue-500 font-bold text-sm mt-auto opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0 flex items-center gap-1">
                            Bắt đầu ngay <ArrowRight size={16}/>
                        </p>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default PracticeCategoryList;