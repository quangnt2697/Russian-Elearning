import React, { useState } from 'react';
import { Search, Trash2, Clock } from 'lucide-react';
import { deleteTestAPI, deletePracticeAPI, deleteLessonAPI, deleteDocumentAPI } from '../../services/api';
import { useToast } from '../ToastContext';

const ContentManager = ({ tests, practices, lessons, documents, onDataChange }) => {
    const toast = useToast();
    const [manageTab, setManageTab] = useState('tests'); // 'tests' | 'practices' | 'lessons' | 'documents'
    const [searchTerm, setSearchTerm] = useState('');

    const handleDeleteContent = async (id, type) => {
        if (!window.confirm("Bạn chắc chắn muốn xóa nội dung này? Hành động này không thể hoàn tác.")) return;
        try {
            if (type === 'test') await deleteTestAPI(id);
            else if (type === 'practice') await deletePracticeAPI(id);
            else if (type === 'lesson') await deleteLessonAPI(id);
            else if (type === 'document') await deleteDocumentAPI(id);

            toast.success("Đã xóa thành công!");
            if (onDataChange) onDataChange();
        } catch (e) {
            toast.error("Lỗi khi xóa: " + e.message);
        }
    };

    const getFilteredData = (dataList) => {
        if (!searchTerm) return dataList;
        const lowerTerm = searchTerm.toLowerCase();
        return dataList.filter(item =>
            (item.title && item.title.toLowerCase().includes(lowerTerm))
        );
    };

    const renderContentList = () => {
        let rawData = [], typeLabel = "", deleteType = "", colorClass = "";
        if (manageTab === 'tests') { rawData = tests; typeLabel = "ĐỀ THI"; deleteType = "test"; colorClass="text-blue-600 bg-blue-50 border-blue-200"; }
        else if (manageTab === 'practices') { rawData = practices; deleteType = "practice"; colorClass="text-purple-600 bg-purple-50 border-purple-200"; }
        else if (manageTab === 'lessons') { rawData = lessons; typeLabel = "BÀI GIẢNG"; deleteType = "lesson"; colorClass="text-green-600 bg-green-50 border-green-200"; }
        else if (manageTab === 'documents') { rawData = documents; typeLabel = "TÀI LIỆU"; deleteType = "document"; colorClass="text-orange-600 bg-orange-50 border-orange-200"; }

        const data = getFilteredData(rawData);

        if (data.length === 0) return <div className="text-center py-12 text-gray-400 italic">Không tìm thấy dữ liệu.</div>;

        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
                {data.map((item) => (
                    <div key={item.id} className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all relative group hover:-translate-y-1">
                        <div className="flex justify-between items-start mb-3">
                            <span className={`px-2 py-1 rounded text-xs font-bold uppercase tracking-wide border ${colorClass}`}>
                                {manageTab === 'practices' ? item.type : (item.type || typeLabel)}
                            </span>
                            <button onClick={() => handleDeleteContent(item.id, deleteType)} className="text-gray-400 hover:text-red-500 p-1 transition-colors" title="Xóa"><Trash2 size={18}/></button>
                        </div>
                        <h4 className="font-bold text-gray-800 text-lg mb-2 line-clamp-2" title={item.title}>{item.title}</h4>
                        <p className="text-sm text-gray-500 mb-4 line-clamp-2 min-h-[40px]">{item.description || "(Không có mô tả)"}</p>
                        <div className="text-xs text-gray-400 border-t pt-3 flex items-center gap-2">
                            <Clock size={12}/> {item.date ? new Date(item.date).toLocaleDateString('vi-VN') : "Mới cập nhật"}
                            <span className="ml-auto bg-gray-100 px-2 py-0.5 rounded text-gray-600 font-mono">#{item.id}</span>
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div className="flex flex-col h-full">
            <div className="flex justify-between items-center mb-6">
                <div className="flex gap-2 bg-gray-100 p-1 rounded-lg">
                    {[
                        {id: 'tests', label: 'Đề thi'},
                        {id: 'practices', label: 'Luyện tập'},
                        {id: 'lessons', label: 'Bài giảng'},
                        {id: 'documents', label: 'Tài liệu'}
                    ].map(t => (
                        <button key={t.id} onClick={() => setManageTab(t.id)} className={`px-4 py-1.5 rounded-md font-bold text-sm transition-all ${manageTab === t.id ? 'bg-white text-blue-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                            {t.label}
                        </button>
                    ))}
                </div>
                <div className="relative w-72">
                    <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                    <input type="text" placeholder="Tìm nội dung..." className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                </div>
            </div>
            {renderContentList()}
        </div>
    );
};

export default ContentManager;