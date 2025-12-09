import React, { useState, useEffect, useRef } from 'react';
import {
    ArrowLeft, BookOpen, Volume2, PlayCircle, FileText, Download,
    Presentation, FileType, PenTool, Eraser, StickyNote, X,
    Maximize2, Minimize2, Trash2, MousePointer2
} from 'lucide-react';
import { fetchLessonsAPI, getResourceUrl } from '../services/api';

const LessonsPage = () => {
    const [lessons, setLessons] = useState([]);
    const [selectedLesson, setSelectedLesson] = useState(null);

    // --- STATE CHO DRAWING & NOTES (Dữ liệu tạm thời, không lưu DB) ---
    const [isDrawingMode, setIsDrawingMode] = useState(false); // Bật/tắt chế độ vẽ
    const [currentTool, setCurrentTool] = useState('pen'); // 'pen' | 'eraser'
    const [showNotePanel, setShowNotePanel] = useState(false); // Bật/tắt sidebar ghi chú
    const [userNote, setUserNote] = useState(''); // Nội dung ghi chú text (Tạm thời)
    const [isFullscreen, setIsFullscreen] = useState(false);

    // Canvas Refs
    const canvasRef = useRef(null);
    const contextRef = useRef(null);
    const [isDrawing, setIsDrawing] = useState(false);

    useEffect(() => {
        const load = async () => {
            try {
                const data = await fetchLessonsAPI();
                setLessons(data || []);
            } catch (error) { console.error("Lỗi tải bài giảng", error); }
        };
        load();
    }, []);

    // --- SETUP CANVAS KHI VÀO BÀI HỌC ---
    // Canvas sẽ được reset mỗi khi đổi bài học hoặc resize
    useEffect(() => {
        if (selectedLesson && canvasRef.current) {
            const canvas = canvasRef.current;
            // Tăng mật độ điểm ảnh cho nét vẽ sắc nét trên màn hình Retina/HighDPI
            const ratio = window.devicePixelRatio || 1;
            canvas.width = canvas.offsetWidth * ratio;
            canvas.height = canvas.offsetHeight * ratio;
            canvas.style.width = `${canvas.offsetWidth}px`;
            canvas.style.height = `${canvas.offsetHeight}px`;

            const context = canvas.getContext("2d");
            context.scale(ratio, ratio);
            context.lineCap = "round";
            context.lineJoin = "round";
            context.lineWidth = 3;
            contextRef.current = context;
        }
    }, [selectedLesson, isFullscreen, showNotePanel]);

    // --- LOGIC VẼ (Chỉ vẽ lên Canvas, không lưu) ---
    const startDrawing = ({ nativeEvent }) => {
        if (!isDrawingMode) return;
        const { offsetX, offsetY } = nativeEvent;
        contextRef.current.beginPath();
        contextRef.current.moveTo(offsetX, offsetY);
        setIsDrawing(true);
    };

    const finishDrawing = () => {
        contextRef.current.closePath();
        setIsDrawing(false);
    };

    const draw = ({ nativeEvent }) => {
        if (!isDrawing || !isDrawingMode) return;
        const { offsetX, offsetY } = nativeEvent;

        if (currentTool === 'eraser') {
            contextRef.current.globalCompositeOperation = 'destination-out'; // Xóa (làm trong suốt pixel)
            contextRef.current.lineWidth = 20;
        } else {
            contextRef.current.globalCompositeOperation = 'source-over'; // Vẽ đè lên
            contextRef.current.strokeStyle = "red"; // Màu bút mặc định là Đỏ
            contextRef.current.lineWidth = 3;
        }

        contextRef.current.lineTo(offsetX, offsetY);
        contextRef.current.stroke();
    };

    const clearCanvas = () => {
        const canvas = canvasRef.current;
        const context = canvas.getContext("2d");
        context.clearRect(0, 0, canvas.width, canvas.height);
    };

    // Helper: Render nội dung file (Iframe Viewer)
    const renderFileContent = (lesson) => {
        const fullFileUrl = getResourceUrl(lesson.fileUrl);
        let content = null;

        if (!fullFileUrl) {
            content = (
                <div className="prose max-w-none p-6 bg-white h-full overflow-y-auto">
                    <div className="whitespace-pre-line text-lg text-gray-800 leading-relaxed">
                        {lesson.theory || "Nội dung đang cập nhật..."}
                    </div>
                </div>
            );
        } else {
            let type = lesson.fileType ? lesson.fileType.toUpperCase() : '';
            if (!type) {
                const extension = fullFileUrl.split('.').pop();
                if (extension) type = extension.toUpperCase();
            }

            if (type === 'PDF') {
                content = <iframe src={`${fullFileUrl}#toolbar=0`} className="w-full h-full border-none" title="Lesson PDF" />;
            } else if (['DOC', 'DOCX', 'PPT', 'PPTX', 'XLS', 'XLSX'].includes(type)) {
                const encodedUrl = encodeURIComponent(fullFileUrl);
                const viewerUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encodedUrl}`;
                content = <iframe src={viewerUrl} className="w-full h-full border-none bg-white" title="Document Viewer" />;
            } else {
                content = (
                    <div className="text-center py-12 bg-gray-50 h-full flex flex-col items-center justify-center">
                        <Download size={48} className="text-blue-500 mb-4"/>
                        <p className="text-gray-500 mb-4">File này cần tải về để xem.</p>
                        <a href={fullFileUrl} target="_blank" rel="noreferrer" className="px-6 py-2 bg-blue-600 text-white rounded-lg">Tải về</a>
                    </div>
                );
            }
        }

        return (
            <div className="relative w-full h-full group">
                {/* LỚP 1: NỘI DUNG TÀI LIỆU (IFRAME) */}
                <div className="w-full h-full absolute inset-0 z-0">
                    {content}
                </div>

                {/* LỚP 2: BẢNG VẼ (CANVAS) - Nằm đè lên Iframe */}
                <canvas
                    ref={canvasRef}
                    onMouseDown={startDrawing}
                    onMouseUp={finishDrawing}
                    onMouseMove={draw}
                    onMouseLeave={finishDrawing}
                    className={`absolute inset-0 z-10 w-full h-full transition-all duration-200 
                        ${isDrawingMode ? 'cursor-crosshair pointer-events-auto bg-transparent' : 'pointer-events-none'}`}
                />

                {/* TOOLBAR ĐIỀU KHIỂN VẼ */}
                <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-20 flex items-center gap-2 bg-white/90 backdrop-blur shadow-lg p-2 rounded-full border border-gray-200 transition-opacity opacity-0 group-hover:opacity-100 hover:opacity-100">
                    <button
                        onClick={() => setIsDrawingMode(false)}
                        className={`p-2 rounded-full transition-colors ${!isDrawingMode ? 'bg-blue-600 text-white' : 'hover:bg-gray-100 text-gray-600'}`}
                        title="Chế độ cuộn/xem (Tắt vẽ)"
                    >
                        <MousePointer2 size={18} />
                    </button>
                    <div className="w-px h-6 bg-gray-300 mx-1"></div>
                    <button
                        onClick={() => { setIsDrawingMode(true); setCurrentTool('pen'); }}
                        className={`p-2 rounded-full transition-colors ${isDrawingMode && currentTool === 'pen' ? 'bg-red-100 text-red-600 ring-2 ring-red-500' : 'hover:bg-gray-100 text-gray-600'}`}
                        title="Bút vẽ"
                    >
                        <PenTool size={18} />
                    </button>
                    <button
                        onClick={() => { setIsDrawingMode(true); setCurrentTool('eraser'); }}
                        className={`p-2 rounded-full transition-colors ${isDrawingMode && currentTool === 'eraser' ? 'bg-gray-200 text-gray-800 ring-2 ring-gray-400' : 'hover:bg-gray-100 text-gray-600'}`}
                        title="Tẩy"
                    >
                        <Eraser size={18} />
                    </button>
                    <button
                        onClick={clearCanvas}
                        className="p-2 rounded-full hover:bg-red-50 text-red-500 transition-colors"
                        title="Xóa tất cả nét vẽ"
                    >
                        <Trash2 size={18} />
                    </button>
                </div>

                {/* NÚT MỞ GHI CHÚ KHI FULLSCREEN */}
                {isFullscreen && !showNotePanel && (
                    <button
                        onClick={() => setShowNotePanel(true)}
                        className="absolute top-4 right-4 z-20 bg-yellow-400 hover:bg-yellow-500 text-blue-900 px-4 py-2 rounded-lg shadow-lg font-bold flex items-center gap-2 transition-transform hover:scale-105"
                    >
                        <StickyNote size={18}/> Ghi chú
                    </button>
                )}
            </div>
        );
    };

    if (selectedLesson) {
        return (
            <div className={`w-full min-h-screen bg-gray-50 flex flex-col ${isFullscreen ? 'fixed inset-0 z-50' : 'container mx-auto px-4 py-8 max-w-[1600px]'}`}>
                {/* Header Navigation (Ẩn khi Fullscreen) */}
                {!isFullscreen && (
                    <button
                        onClick={() => setSelectedLesson(null)}
                        className="flex items-center gap-2 text-white font-bold mb-4 w-fit px-5 py-2.5 rounded-full shadow-lg transition-transform hover:-translate-x-1 bg-gradient-to-r from-blue-600 to-blue-500"
                    >
                        <ArrowLeft size={20} /> Quay lại
                    </button>
                )}

                {/* KHUNG HIỂN THỊ CHÍNH */}
                <div className={`flex-1 flex overflow-hidden bg-white shadow-xl border border-gray-200 ${isFullscreen ? '' : 'rounded-2xl h-[80vh]'}`}>

                    {/* CỘT TRÁI: NỘI DUNG BÀI HỌC */}
                    <div className="flex-1 flex flex-col relative">
                        {/* Toolbar Header */}
                        <div className="h-14 border-b flex items-center justify-between px-4 bg-gray-50 shrink-0">
                            <h2 className="font-bold text-gray-700 line-clamp-1 flex items-center gap-2">
                                {selectedLesson.fileType?.includes('PPT') ? <Presentation size={18} className="text-orange-500"/> : <FileType size={18} className="text-blue-500"/>}
                                {selectedLesson.title}
                            </h2>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setShowNotePanel(!showNotePanel)}
                                    className={`p-2 rounded-lg flex items-center gap-2 text-sm font-bold transition-colors ${showNotePanel ? 'bg-yellow-100 text-yellow-700' : 'hover:bg-gray-200 text-gray-600'}`}
                                >
                                    <StickyNote size={18}/> <span className="hidden sm:inline">Ghi chú</span>
                                </button>
                                <div className="w-px h-4 bg-gray-300 mx-1"></div>
                                <button
                                    onClick={() => setIsFullscreen(!isFullscreen)}
                                    className="p-2 hover:bg-gray-200 rounded-lg text-gray-600 transition-colors"
                                    title={isFullscreen ? "Thoát toàn màn hình" : "Toàn màn hình"}
                                >
                                    {isFullscreen ? <Minimize2 size={20}/> : <Maximize2 size={20}/>}
                                </button>
                            </div>
                        </div>

                        {/* Vùng hiển thị File & Canvas */}
                        <div className="flex-1 relative bg-gray-100 overflow-hidden">
                            {renderFileContent(selectedLesson)}
                        </div>
                    </div>

                    {/* CỘT PHẢI: GHI CHÚ (Ẩn/Hiện) */}
                    {showNotePanel && (
                        <div className="w-80 border-l border-gray-200 bg-yellow-50 flex flex-col shadow-2xl transition-all duration-300 absolute md:static right-0 top-0 bottom-0 z-30 h-full">
                            <div className="p-4 border-b border-yellow-200 flex justify-between items-center bg-yellow-100">
                                <h3 className="font-bold text-yellow-800 flex items-center gap-2">
                                    <StickyNote size={18}/> Ghi chú nhanh
                                </h3>
                                <button onClick={() => setShowNotePanel(false)} className="hover:bg-yellow-200 p-1 rounded-full text-yellow-800"><X size={18}/></button>
                            </div>
                            <div className="flex-1 p-4 overflow-y-auto">
                                <textarea
                                    className="w-full h-full bg-transparent resize-none outline-none text-gray-700 leading-relaxed font-medium placeholder-yellow-700/50"
                                    placeholder="Nhập ghi chú cho bài học này tại đây..."
                                    value={userNote}
                                    onChange={(e) => setUserNote(e.target.value)}
                                    autoFocus
                                ></textarea>
                            </div>
                            {/* Thông báo dữ liệu tạm thời */}
                            <div className="p-3 border-t border-yellow-200 bg-yellow-100 text-xs text-yellow-700 text-center font-medium">
                                Ghi chú sẽ bị xóa khi tải lại trang.
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // GIAO DIỆN DANH SÁCH BÀI HỌC (Giữ nguyên)
    return (
        <div className="w-full min-h-screen container max-w-[1600px] mx-auto px-4 py-8 animate-fade-in pb-24">
            <div className="text-center mb-16 mt-8">
                <span className="text-blue-600 font-bold tracking-wider uppercase text-sm mb-2 block">Thư viện kiến thức</span>
                <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">Kho Bài Giảng</h2>
                <p className="text-gray-500 max-w-2xl mx-auto text-lg">Hệ thống bài học đa phương tiện.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {lessons.map((lesson) => {
                    const type = lesson.fileType ? lesson.fileType.toUpperCase() : 'TEXT';
                    const isPPT = type.includes('PPT');
                    return (
                        <div key={lesson.id} className="group bg-white rounded-2xl shadow-sm hover:shadow-2xl transition-all duration-300 border border-gray-100 flex flex-col overflow-hidden h-full cursor-pointer relative" onClick={() => setSelectedLesson(lesson)}>
                            <div className={`h-48 relative flex items-center justify-center overflow-hidden ${isPPT ? 'bg-orange-50' : 'bg-blue-50'}`}>
                                <PlayCircle className="text-white relative z-10 drop-shadow-2xl group-hover:scale-125 transition-transform duration-300 bg-black/20 rounded-full" size={64}/>
                            </div>
                            <div className="p-6 flex-1 flex flex-col">
                                <span className="text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wide bg-gray-100 w-fit mb-2">{type}</span>
                                <h3 className="text-xl font-bold text-gray-800 mb-3 line-clamp-2">{lesson.title}</h3>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default LessonsPage;