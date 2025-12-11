import React, { useState, useEffect, useRef } from 'react';
import {
    ArrowLeft, Presentation, FileType, StickyNote,
    X, Maximize2, Minimize2, PenTool, Eraser,
    MousePointer2, Trash2, Download, MonitorPlay, Loader2,
    FileText
} from 'lucide-react';
import { fetchLessonsAPI, getResourceUrl } from '../services/api';

const LessonsPage = () => {
    const [lessons, setLessons] = useState([]);
    const [selectedLesson, setSelectedLesson] = useState(null);

    // State hiển thị
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [showNotePanel, setShowNotePanel] = useState(false);

    // State Drawing
    const [isDrawingMode, setIsDrawingMode] = useState(false);
    const [currentTool, setCurrentTool] = useState('pen');
    const [userNote, setUserNote] = useState('');

    // Refs
    const canvasRef = useRef(null);
    const contextRef = useRef(null);
    const containerRef = useRef(null);
    const [isDrawing, setIsDrawing] = useState(false);

    useEffect(() => {
        const load = async () => {
            try {
                const data = await fetchLessonsAPI();
                setLessons(data || []);
            } catch (error) { console.error("Error loading lessons", error); }
        };
        load();
    }, []);

    // --- HELPER: XÁC ĐỊNH LOẠI FILE ---
    const getFileInfo = (lesson) => {
        if (!lesson) return { type: 'UNKNOWN', color: 'slate', icon: FileText };

        let type = 'UNKNOWN';

        // 1. Ưu tiên lấy từ DB
        if (lesson.fileType && lesson.fileType !== 'UNKNOWN') {
            type = lesson.fileType.toUpperCase();
        }

        // 2. Nếu DB lỗi, đoán từ URL
        else if (lesson.fileUrl) {
            const ext = lesson.fileUrl.split('.').pop().split('?')[0].toUpperCase();
            if (['DOC', 'DOCX'].includes(ext)) type = 'DOCX';
            else if (['PPT', 'PPTX'].includes(ext)) type = 'PPTX';
            else if (['XLS', 'XLSX'].includes(ext)) type = 'XLSX';
            else if (['PDF'].includes(ext)) type = 'PDF';
            else if (['MP4', 'WEBM'].includes(ext)) type = 'VIDEO';
        }

        // Config giao diện theo type
        switch (type) {
            case 'PPTX': case 'PPT':
                return { type: 'PPTX', color: 'from-orange-400 to-red-500', text: 'text-orange-600', bg: 'bg-orange-50', icon: Presentation };
            case 'VIDEO':
                return {type: 'VIDEO', color: 'from-orange-400 to-red-500', text: 'text-orange-600', bg: 'bg-orange-50', icon: Presentation};
            case 'DOCX': case 'DOC':
                return { type: 'DOCX', color: 'from-blue-400 to-indigo-500', text: 'text-blue-600', bg: 'bg-blue-50', icon: FileType };
            case 'PDF':
                return { type: 'PDF', color: 'from-red-400 to-rose-500', text: 'text-red-600', bg: 'bg-red-50', icon: FileText };
            case 'XLSX': case 'XLS':
                return { type: 'XLSX', color: 'from-emerald-400 to-green-500', text: 'text-emerald-600', bg: 'bg-emerald-50', icon: FileText };
            default:
                return { type: 'UNKNOWN', color: 'from-slate-400 to-gray-500', text: 'text-slate-600', bg: 'bg-slate-50', icon: FileText };
        }
    };

    // --- SETUP CANVAS ---
    useEffect(() => {
        if (selectedLesson && canvasRef.current && containerRef.current) {
            const canvas = canvasRef.current;
            const parent = containerRef.current;
            canvas.width = parent.offsetWidth;
            canvas.height = parent.offsetHeight;
            const context = canvas.getContext("2d");
            context.lineCap = "round";
            context.lineJoin = "round";
            context.lineWidth = 3;
            contextRef.current = context;
        }
    }, [selectedLesson, isFullscreen, showNotePanel]);

    // --- LOGIC VẼ ---
    const startDrawing = ({ nativeEvent }) => {
        if (!isDrawingMode) return;
        const { offsetX, offsetY } = nativeEvent;
        contextRef.current.beginPath();
        contextRef.current.moveTo(offsetX, offsetY);
        setIsDrawing(true);
    };
    const finishDrawing = () => { contextRef.current.closePath(); setIsDrawing(false); };
    const draw = ({ nativeEvent }) => {
        if (!isDrawing || !isDrawingMode) return;
        const { offsetX, offsetY } = nativeEvent;
        if (currentTool === 'eraser') {
            contextRef.current.globalCompositeOperation = 'destination-out';
            contextRef.current.lineWidth = 20;
        } else {
            contextRef.current.globalCompositeOperation = 'source-over';
            contextRef.current.strokeStyle = "red";
            contextRef.current.lineWidth = 3;
        }
        contextRef.current.lineTo(offsetX, offsetY);
        contextRef.current.stroke();
    };
    const clearCanvas = () => {
        const canvas = canvasRef.current;
        canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
    };

    // --- FULLSCREEN ---
    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            containerRef.current.requestFullscreen().catch(err => alert(err.message));
            setIsFullscreen(true);
        } else {
            document.exitFullscreen();
            setIsFullscreen(false);
        }
    };
    useEffect(() => {
        const handleChange = () => setIsFullscreen(!!document.fullscreenElement);
        document.addEventListener('fullscreenchange', handleChange);
        return () => document.removeEventListener('fullscreenchange', handleChange);
    }, []);

    // --- RENDER VIEWER ---
    const renderFileViewer = () => {
        if (!selectedLesson) return null;
        const fileUrl = getResourceUrl(selectedLesson.fileUrl);
        const { type } = getFileInfo(selectedLesson);

        // Debug log để kiểm tra URL trên Console
        console.log("Viewing File:", { title: selectedLesson.title, type, fileUrl });

        if (!fileUrl)
            return <div className="flex items-center justify-center h-full"><Loader2 className="animate-spin text-blue-500" size={40}/></div>;

        // 2. Xử lý PDF (Native Viewer)
        if (type === 'PDF') {
            return <iframe src={`${fileUrl}#toolbar=0&navpanes=0&scrollbar=0`} className="w-full h-full border-none" title="PDF Viewer" />;
        }

        // 3. Xử lý OFFICE (DOCX, PPTX, XLSX)
        if (['DOCX', 'DOC', 'PPT', 'PPTX', 'XLSX', 'XLS'].includes(type)) {
            // Encode URL để tránh lỗi ký tự đặc biệt
            const encodedUrl = encodeURIComponent(fileUrl);
            // return <iframe src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodedUrl}&wdAr=1.77`} className="w-full h-full border-none bg-white" title="Office Viewer" loading="lazy" />;

            // Dùng Microsoft Office Online Viewer
            return (
                <div className="w-full h-full relative group">
                    {/* Placeholder Loading trong khi iframe tải */}
                    <div className="absolute inset-0 flex items-center justify-center bg-slate-50 -z-10">
                        <Loader2 className="animate-spin text-blue-500" size={32} />
                        <span className="ml-2 text-slate-500 text-sm">Đang tải tài liệu...</span>
                    </div>

                    <iframe
                        src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodedUrl}&wdAr=1.77`}
                        className="w-full h-full border-none bg-transparent" // bg-transparent để thấy loader bên dưới nếu cần
                        title="Office Viewer"
                        loading="lazy"
                    />
                </div>
            );
        }

        // 4. Fallback cho file không hỗ trợ
        return (
            <div className="w-full h-full flex flex-col items-center justify-center bg-slate-50 text-slate-500">
                <Download size={32} className="text-slate-400 mb-4"/>
                <p className="mb-6 font-medium text-slate-400">Định dạng file ({type}) này cần được tải về để xem.</p>
                <a href={fileUrl} className="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-all shadow-lg" target="_blank" rel="noreferrer">
                    Tải về máy ngay
                </a>
            </div>
        );
    };

    // === GIAO DIỆN CHI TIẾT BÀI HỌC (ĐÃ FIX NAVBAR) ===
    if (selectedLesson) {
        const fileInfo = getFileInfo(selectedLesson);
        const FileIcon = fileInfo.icon;

        return (
            <div
                className={`
                    fixed left-0 right-0 bottom-0 bg-slate-50 flex flex-col overflow-hidden font-sans transition-all duration-300
                    ${isFullscreen
                    ? 'top-0 z-[60]' // Fullscreen: Che Navbar
                    : 'top-16 z-40'  // Normal: Nằm dưới Navbar
                }
                `}
            >
                {/* --- SUB-HEADER --- */}
                {!isFullscreen && (
                    <div className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-6 shadow-sm shrink-0 relative z-30">
                        {/* 1. Back & Info */}
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => setSelectedLesson(null)}
                                className="group flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold transition-all"
                            >
                                <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform"/>
                                <span className="hidden sm:inline text-sm">Quay lại</span>
                            </button>

                            <div className="h-6 w-px bg-slate-300 mx-2 hidden sm:block"></div>

                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${fileInfo.color} flex items-center justify-center shadow-sm text-white`}>
                                    <FileIcon size={20} strokeWidth={2.5}/>
                                </div>
                                <div className="flex flex-col">
                                    <h2 className="text-base font-bold text-slate-800 line-clamp-1 max-w-[200px] sm:max-w-md">
                                        {selectedLesson.title}
                                    </h2>
                                    <span className={`text-[10px] font-bold uppercase tracking-wider ${fileInfo.text}`}>
                                        {fileInfo.type}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* 2. Action Toggle Note */}
                        <div>
                            <button
                                onClick={() => setShowNotePanel(!showNotePanel)}
                                className={`
                                    flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-all duration-300 shadow-sm
                                    ${showNotePanel
                                    ? 'bg-amber-100 text-amber-700 ring-1 ring-amber-400'
                                    : 'bg-gradient-to-r from-amber-400 to-orange-500 text-white hover:shadow-orange-200 hover:shadow-md'
                                }
                                `}
                            >
                                <StickyNote size={16} className={showNotePanel ? "fill-amber-500 text-amber-500" : ""}/>
                                <span className="hidden sm:inline">Ghi chú</span>
                            </button>
                        </div>
                    </div>
                )}

                {/* --- MAIN CONTENT AREA --- */}
                {/* Loại bỏ gap-4 ở đây để xử lý width mượt mà hơn */}
                <div className="flex-1 flex overflow-hidden relative bg-slate-100">

                    {/* 1. VIEWER CONTAINER */}
                    <div
                        className={`
                            flex-1 flex flex-col relative transition-all duration-500 ease-in-out
                            ${showNotePanel ? 'pr-0' : ''} /* Khi mở note thì bỏ padding phải để dính vào note panel */
                        `}
                    >
                        {/* Wrapper để tạo khoảng hở (padding) xung quanh Viewer */}
                        <div className={`w-full h-full flex flex-col ${isFullscreen ? 'p-0' : 'p-3 sm:p-5'}`}>

                            <div
                                ref={containerRef}
                                className={`
                                    relative flex-1 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col
                                    ${isFullscreen ? 'fixed inset-0 z-50 rounded-none w-full h-full m-0 border-none' : 'w-full h-full mx-auto'} 
                                    /* mx-auto giúp căn giữa nếu container có max-width, ở đây flex-1 sẽ fill full width */
                                `}
                            >
                                {/* Floating Toolbar (Control vẽ) */}
                                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-slate-900/90 backdrop-blur-md text-white p-1.5 rounded-full shadow-xl border border-white/10 opacity-0 hover:opacity-100 transition-opacity duration-300">
                                    {fileInfo.type === 'PPTX' && (
                                        <button onClick={toggleFullscreen} className="p-2 hover:bg-white/10 rounded-full text-orange-400 transition-colors" title="Trình chiếu">
                                            {isFullscreen ? <Minimize2 size={18}/> : <MonitorPlay size={18}/>}
                                        </button>
                                    )}
                                    <div className="w-px h-4 bg-white/20 mx-1"></div>
                                    <button onClick={() => setIsDrawingMode(false)} className={`p-2 rounded-full ${!isDrawingMode ? 'bg-white/20 text-blue-300' : 'hover:bg-white/10'}`}>
                                        <MousePointer2 size={18}/>
                                    </button>
                                    <button onClick={() => { setIsDrawingMode(true); setCurrentTool('pen'); }} className={`p-2 rounded-full ${isDrawingMode && currentTool === 'pen' ? 'bg-red-500' : 'hover:bg-white/10'}`}>
                                        <PenTool size={18}/>
                                    </button>
                                    <button onClick={() => { setIsDrawingMode(true); setCurrentTool('eraser'); }} className={`p-2 rounded-full ${isDrawingMode && currentTool === 'eraser' ? 'bg-slate-500' : 'hover:bg-white/10'}`}>
                                        <Eraser size={18}/>
                                    </button>
                                    <button onClick={clearCanvas} className="p-2 hover:text-red-400 rounded-full">
                                        <Trash2 size={18}/>
                                    </button>
                                    {fileInfo.type !== 'PPTX' && (
                                        <>
                                            <div className="w-px h-4 bg-white/20 mx-1"></div>
                                            <button onClick={toggleFullscreen} className="p-2 hover:bg-white/10 rounded-full">
                                                {isFullscreen ? <Minimize2 size={18}/> : <Maximize2 size={18}/>}
                                            </button>
                                        </>
                                    )}
                                </div>

                                {/* Layers */}
                                <div className="absolute inset-0 z-0 bg-slate-50">{renderFileViewer()}</div>
                                <canvas
                                    ref={canvasRef}
                                    onMouseDown={startDrawing}
                                    onMouseUp={finishDrawing}
                                    onMouseMove={draw}
                                    onMouseLeave={finishDrawing}
                                    className={`absolute inset-0 z-40 ${isDrawingMode ? 'cursor-crosshair pointer-events-auto' : 'pointer-events-none'}`}
                                />
                            </div>
                        </div>
                    </div>

                    {/* 2. NOTE PANEL (Sidebar) */}
                    <div className={`
                        relative bg-white border-l border-slate-200 shadow-xl z-20 transition-all duration-500 ease-in-out flex flex-col
                        ${showNotePanel ? 'w-96 translate-x-0 opacity-100' : 'w-0 translate-x-full opacity-0 overflow-hidden border-none'}
                    `}>
                        {/* Chỉ render nội dung khi có width để tránh vỡ layout khi đóng */}
                        <div className="w-96 h-full flex flex-col">
                            <div className="p-4 bg-amber-50 border-b border-amber-100 flex justify-between items-center shrink-0">
                                <h3 className="font-bold text-amber-800 flex items-center gap-2 text-sm uppercase tracking-wide">
                                    <StickyNote size={16} className="fill-amber-500 text-amber-600"/> Ghi chú nhanh
                                </h3>
                                <button onClick={() => setShowNotePanel(false)} className="p-1 hover:bg-amber-200 rounded text-amber-700 transition-colors">
                                    <X size={18}/>
                                </button>
                            </div>
                            <div className="flex-1 p-0 bg-amber-50/10 relative">
                                <textarea
                                    className="w-full h-full bg-transparent p-4 resize-none outline-none text-slate-700 leading-relaxed text-sm font-medium placeholder-slate-400 focus:bg-amber-50/30 transition-all"
                                    placeholder="Nhập ghi chú của bạn tại đây..."
                                    value={userNote}
                                    onChange={e => setUserNote(e.target.value)}
                                />
                            </div>
                            <div className="p-3 bg-white border-t border-slate-100 text-center">
                                <span className="text-[10px] text-slate-400 font-semibold uppercase">Tự động lưu tạm thời</span>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        );
    }

    // --- LIST VIEW (Giữ nguyên) ---
    return (
        <div className="w-full min-h-screen bg-slate-50 py-8 px-4 overflow-x-hidden">
            <div className="max-w-[1600px] mx-auto">
                <div className="text-center mb-8 mt-4">
                    <h2 className="text-3xl font-bold text-slate-800">Kho Tài Liệu</h2>
                    <p className="text-slate-500 mt-2 text-sm">Chọn bài giảng để bắt đầu học tập</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {lessons.map((lesson) => {
                        const info = getFileInfo(lesson);
                        const Icon = info.icon;

                        return (
                            <div
                                key={lesson.id}
                                onClick={() => setSelectedLesson(lesson)}
                                className="bg-white rounded-xl shadow-sm hover:shadow-xl border border-slate-100 cursor-pointer overflow-hidden group transition-all duration-300 hover:-translate-y-1"
                            >
                                <div className={`h-40 flex items-center justify-center relative overflow-hidden bg-gradient-to-br ${info.bg} to-white`}>
                                    <div className={`transform transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3 ${info.text}`}>
                                        <Icon size={56} strokeWidth={1.5} className="drop-shadow-sm"/>
                                    </div>
                                </div>
                                <div className="p-5">
                                    <div className="flex justify-between items-start mb-2">
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider bg-slate-100 ${info.text}`}>
                                            {info.type}
                                        </span>
                                    </div>
                                    <h3 className="text-base font-bold text-slate-800 leading-snug line-clamp-2 group-hover:text-blue-600 transition-colors">
                                        {lesson.title}
                                    </h3>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default LessonsPage;
