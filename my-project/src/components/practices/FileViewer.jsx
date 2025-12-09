import React, { useState } from 'react';
import { FileText, Download, Maximize2, Minimize2 } from 'lucide-react';
import { getResourceUrl } from '../../services/api';

const FileViewer = ({ content }) => {
    const [isFullscreen, setIsFullscreen] = useState(false);

    // 1. Trường hợp nội dung là Text thuần (Ngữ pháp, hoặc đề bài ngắn)
    if (!content || (!content.includes('/uploads/') && !content.startsWith('http'))) {
        return (
            <div className="w-full h-full bg-white rounded-xl border border-gray-200 p-6 overflow-y-auto min-h-[400px]">
                <div className="prose max-w-none">
                    <pre className="whitespace-pre-wrap font-serif text-lg leading-relaxed text-gray-800">
                        {content || "Không có nội dung đề bài."}
                    </pre>
                </div>
            </div>
        );
    }

    // 2. Trường hợp là File
    const fullFileUrl = getResourceUrl(content);
    let extension = '';
    try { extension = content.split('.').pop().toLowerCase(); } catch (e) {}
    const type = extension.toUpperCase();

    return (
        <div className={`w-full h-full bg-gray-50 rounded-xl border border-gray-200 overflow-hidden relative flex flex-col ${isFullscreen ? 'fixed inset-0 z-50 bg-white' : 'min-h-[500px]'}`}>
            <div className="bg-white p-2 border-b flex justify-between items-center shadow-sm shrink-0">
                <span className="text-xs font-bold text-gray-500 uppercase px-2 flex items-center gap-1">
                    <FileText size={14}/> Tài liệu tham khảo ({type})
                </span>
                <div className="flex gap-2">
                    <a href={fullFileUrl} target="_blank" rel="noreferrer" className="p-1.5 hover:bg-gray-100 text-blue-600 rounded" title="Tải về"><Download size={18}/></a>
                    <button onClick={() => setIsFullscreen(!isFullscreen)} className="p-1.5 hover:bg-gray-100 text-gray-600 rounded">
                        {isFullscreen ? <Minimize2 size={18}/> : <Maximize2 size={18}/>}
                    </button>
                </div>
            </div>

            <div className="flex-1 w-full h-full bg-gray-100 relative">
                {type === 'PDF' ? (
                    <iframe src={`${fullFileUrl}#toolbar=0`} className="w-full h-full border-none" title="PDF Viewer"/>
                ) : ['DOC', 'DOCX', 'PPT', 'PPTX', 'XLS', 'XLSX'].includes(type) ? (
                    <iframe
                        src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(fullFileUrl)}`}
                        className="w-full h-full border-none bg-white"
                        title="Office Viewer"
                    />
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 p-8">
                        {['JPG', 'JPEG', 'PNG', 'GIF'].includes(type) ? (
                            <img src={fullFileUrl} alt="Content" className="max-w-full max-h-full object-contain shadow-lg rounded-lg"/>
                        ) : (
                            <>
                                <FileText size={64} className="mb-4 text-blue-200"/>
                                <p className="mb-2">Định dạng file <b>{type}</b> không hỗ trợ xem trực tiếp.</p>
                                <a href={fullFileUrl} target="_blank" rel="noreferrer" className="mt-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold shadow-md">Tải xuống để xem</a>
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default FileViewer;