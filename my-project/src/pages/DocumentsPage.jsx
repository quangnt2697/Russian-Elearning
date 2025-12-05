import React from 'react';
import { FileText } from 'lucide-react';
import { MOCK_DOCUMENTS } from '../data/mockData';

const DocumentsPage = () => {
    return (
        <div className="w-full min-h-screen container mx-auto px-4 py-8 animate-fade-in pb-20">
            <div className="text-center mb-12">
                <h2 className="text-4xl font-bold text-gray-800">Kho Tài Liệu</h2>
                <p className="text-gray-500 mt-2 text-lg">Tài liệu tham khảo chọn lọc giúp bạn học tốt hơn</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto">
                {MOCK_DOCUMENTS.map((doc) => (
                    <div key={doc.id} className="bg-white p-6 rounded-2xl shadow-sm hover:shadow-xl transition-all border border-gray-100 flex items-start justify-between group cursor-pointer hover:-translate-y-1">
                        <div>
                            <h3 className="text-xl font-bold text-gray-800 flex items-center gap-3 group-hover:text-blue-600 transition-colors">
                                <div className="p-2 bg-green-100 rounded-lg text-green-700">
                                    <FileText size={24}/>
                                </div>
                                {doc.title}
                            </h3>
                            <p className="text-gray-500 mt-3 leading-relaxed">{doc.description}</p>
                            <span className="inline-block mt-4 bg-gray-100 text-gray-600 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">
                                {doc.type}
                            </span>
                        </div>
                        <button className="text-blue-500 hover:text-blue-700 font-bold text-sm whitespace-nowrap self-center ml-4 px-4 py-2 bg-blue-50 rounded-lg group-hover:bg-blue-100 transition-colors">
                            Tải về
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default DocumentsPage;