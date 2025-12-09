import React, { useState, useEffect } from 'react';
import { FileText, Download, File, Music, Loader } from 'lucide-react';
import { fetchDocumentsAPI, getResourceUrl } from '../services/api';

const DocumentsPage = () => {
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);

    // [UPDATED] Lấy dữ liệu thật từ API thay vì MOCK
    useEffect(() => {
        const loadDocs = async () => {
            try {
                const data = await fetchDocumentsAPI();
                setDocuments(data || []);
            } catch (error) {
                console.error("Lỗi tải tài liệu:", error);
                // Fallback nếu API chưa sẵn sàng (để UI không trống trơn)
                setDocuments([]);
            } finally {
                setLoading(false);
            }
        };
        loadDocs();
    }, []);

    // Helper chọn icon
    const getIcon = (type) => {
        if (type === 'AUDIO') return <Music size={24}/>;
        if (type === 'PDF') return <FileText size={24}/>;
        return <File size={24}/>;
    };

    return (
        <div className="w-full min-h-screen container mx-auto px-4 py-8 animate-fade-in pb-20">
            <div className="text-center mb-12">
                <h2 className="text-4xl font-bold text-gray-800">Kho Tài Liệu</h2>
                <p className="text-gray-500 mt-2 text-lg">Tài liệu tham khảo chọn lọc giúp bạn học tốt hơn</p>
            </div>

            {loading ? (
                <div className="flex justify-center items-center py-20 text-blue-600">
                    <Loader className="animate-spin" size={40} />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto">
                    {documents.length > 0 ? (
                        documents.map((doc) => (
                            <div key={doc.id} className="bg-white p-6 rounded-2xl shadow-sm hover:shadow-xl transition-all border border-gray-100 flex items-start justify-between group cursor-pointer hover:-translate-y-1">
                                <div>
                                    <h3 className="text-xl font-bold text-gray-800 flex items-center gap-3 group-hover:text-blue-600 transition-colors">
                                        <div className="p-2 bg-green-100 rounded-lg text-green-700">
                                            {getIcon(doc.type)}
                                        </div>
                                        {doc.title}
                                    </h3>
                                    <p className="text-gray-500 mt-3 leading-relaxed line-clamp-2">{doc.description}</p>
                                    <span className="inline-block mt-4 bg-gray-100 text-gray-600 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">
                                        {doc.type || "DOC"}
                                    </span>
                                </div>
                                <a
                                    href={getResourceUrl(doc.fileUrl || doc.content)}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-blue-500 hover:text-blue-700 font-bold text-sm whitespace-nowrap self-center ml-4 px-4 py-2 bg-blue-50 rounded-lg group-hover:bg-blue-100 transition-colors flex items-center gap-2"
                                >
                                    <Download size={16} /> Tải về
                                </a>
                            </div>
                        ))
                    ) : (
                        <div className="col-span-3 text-center py-10 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                            <p className="text-gray-500">Chưa có tài liệu nào được cập nhật.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default DocumentsPage;