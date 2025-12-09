import React, { useState } from 'react';
import { FileText, Mic, BookOpen, File, Upload, Save } from 'lucide-react';
// Import API
import {
    importTestFileAPI,
    importLessonFileAPI,
    importDocumentAPI,
    createPracticeAPI,
    uploadAudioAPI,
    importPracticeFileAPI
} from '../../services/api.js';
import { useToast } from '../ToastContext';

const UploadManager = ({ onUploadSuccess }) => {
    const toast = useToast();
    const [uploadTab, setUploadTab] = useState('test'); // 'test' | 'practice' | 'lesson' | 'document'
    const [loading, setLoading] = useState(false);

    // State chung cho form import file
    const [importData, setImportData] = useState({
        title: '', desc: '', duration: 600,
        file: null, audio: null, docType: 'PDF'
    });

    // State riêng cho form Practice
    const [practiceData, setPracticeData] = useState({
        title: '', type: 'LISTENING', description: '',
        content: '', audioFile: null, docFile: null, vocabInput: ''
    });

    const handleImportSubmit = async (type) => {
        setLoading(true);
        try {
            // 1. Upload Đề Thi
            if (type === 'test') {
                if (!importData.file) throw new Error("Vui lòng chọn file đề thi (PDF/Word)!");
                if (!importData.title) throw new Error("Vui lòng nhập tiêu đề!");
                await importTestFileAPI(importData.file, importData.audio, importData.title, importData.duration);
            }
            // 2. Upload Bài Giảng
            else if (type === 'lesson') {
                if (!importData.file) throw new Error("Vui lòng chọn file nội dung!");
                if (!importData.title) throw new Error("Vui lòng nhập tiêu đề!");
                await importLessonFileAPI(importData.file, importData.audio, importData.title, importData.desc);
            }
            // 3. Upload Tài Liệu
            else if (type === 'document') {
                if (!importData.file) throw new Error("Vui lòng chọn file tài liệu!");
                if (!importData.title) throw new Error("Vui lòng nhập tên tài liệu!");
                await importDocumentAPI(importData.file, importData.title, importData.desc, importData.docType);
            }
            // 4. Tạo Bài Tập (Practice)
            else if (type === 'practice') {
                if (!practiceData.title) throw new Error("Vui lòng nhập tiêu đề bài tập!");

                // CASE A: Import từ file Docx (Reading/Grammar...) -> Dùng API Import để parse ra câu hỏi
                // Điều kiện: Có file DOCX và thuộc các loại bài có thể làm tương tác
                const isInteractiveType = ['READING', 'GRAMMAR', 'LISTENING', 'WRITING'].includes(practiceData.type);
                // Kiểm tra đuôi file an toàn hơn
                const isDocxFile = practiceData.docFile && practiceData.docFile.name.toLowerCase().endsWith('.docx');

                if (isInteractiveType && isDocxFile) {
                    await importPracticeFileAPI(
                        practiceData.docFile,
                        practiceData.audioFile,
                        practiceData.title,
                        practiceData.type,
                        practiceData.description
                    );
                }
                // CASE B: Các trường hợp khác (Vocab, nhập tay, hoặc file PDF/PPTX không cần parse)
                else {
                    let mediaUrl = null;
                    let contentUrl = practiceData.content;

                    // Xử lý Vocab
                    if (practiceData.type === 'VOCABULARY') {
                        let finalVocab = [];
                        if (practiceData.docFile) {
                            const text = await practiceData.docFile.text();
                            text.split('\n').forEach(line => {
                                const [word, meaning] = line.split(':');
                                if (word && meaning) finalVocab.push({ word: word.trim(), meaning: meaning.trim() });
                            });
                        } else if (practiceData.vocabInput) {
                            practiceData.vocabInput.split('\n').forEach(line => {
                                const [word, meaning] = line.split(':');
                                if (word && meaning) finalVocab.push({ word: word.trim(), meaning: meaning.trim() });
                            });
                        }
                        if (finalVocab.length === 0) throw new Error("Dữ liệu từ vựng trống hoặc sai định dạng (word:meaning)!");
                        contentUrl = JSON.stringify(finalVocab);
                    }
                    // Xử lý các loại bài khác (PDF, PPTX, hoặc Text nhập tay)
                    else {
                        if (practiceData.audioFile) mediaUrl = await uploadAudioAPI(practiceData.audioFile);

                        // Nếu có file tài liệu (PDF, PPTX...) mà không phải Docx để parse
                        // thì upload lên lấy URL để hiển thị bằng FileViewer
                        if (practiceData.docFile) {
                            contentUrl = await uploadAudioAPI(practiceData.docFile);
                        }
                    }

                    await createPracticeAPI({ ...practiceData, mediaUrl, content: contentUrl });
                }
            }

            toast.success("Thao tác thành công!");
            // Reset Form
            setImportData({ title: '', desc: '', duration: 600, file: null, audio: null, docType: 'PDF' });
            setPracticeData({ title: '', type: 'LISTENING', description: '', content: '', audioFile: null, docFile: null, vocabInput: '' });

            // Callback để parent update data
            if (onUploadSuccess) onUploadSuccess();
        } catch (e) {
            const serverMsg = e.response?.data || e.message;
            toast.error(`Lỗi: ${typeof serverMsg === 'string' ? serverMsg : JSON.stringify(serverMsg)}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto animate-fade-in relative">
            {loading && (
                <div className="absolute inset-0 bg-white/80 z-50 flex items-center justify-center flex-col gap-3 backdrop-blur-sm rounded-xl">
                    <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <p className="font-bold text-blue-800 animate-pulse">Đang xử lý upload...</p>
                </div>
            )}

            <div className="flex justify-center gap-2 mb-8 border-b pb-4 overflow-x-auto">
                {[
                    {id: 'test', label: 'Đề Thi', icon: <FileText size={18}/>},
                    {id: 'practice', label: 'Luyện Tập', icon: <Mic size={18}/>},
                    {id: 'lesson', label: 'Bài Giảng', icon: <BookOpen size={18}/>},
                    {id: 'document', label: 'Tài Liệu', icon: <File size={18}/>}
                ].map(type => (
                    <button key={type.id} onClick={() => setUploadTab(type.id)} className={`px-6 py-2.5 rounded-lg font-bold text-sm transition-all flex items-center gap-2 whitespace-nowrap ${uploadTab === type.id ? 'bg-blue-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-100'}`}>
                        {type.icon} {type.label}
                    </button>
                ))}
            </div>

            {/* FORM: TEST */}
            {uploadTab === 'test' && (
                <div className="space-y-6 bg-white border p-8 rounded-2xl shadow-sm">
                    <h3 className="font-bold text-xl text-gray-800 border-b pb-2">Upload Đề Thi Mới</h3>
                    <div className="space-y-4">
                        <input type="text" placeholder="Tiêu đề đề thi" className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" value={importData.title} onChange={e => setImportData({...importData, title: e.target.value})} />
                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-bold mb-1 text-gray-700">File Đề (PDF/Word)</label>
                                <input type="file" className="w-full p-2 border rounded bg-gray-50" onChange={e => setImportData({...importData, file: e.target.files[0]})}/>
                            </div>
                            <div>
                                <label className="block text-sm font-bold mb-1 text-gray-700">File Nghe (MP3 - Optional)</label>
                                <input type="file" accept="audio/*" className="w-full p-2 border rounded bg-gray-50" onChange={e => setImportData({...importData, audio: e.target.files[0]})}/>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-bold mb-1 text-gray-700">Thời gian làm bài (Phút)</label>
                            <input type="number" className="w-full p-3 border rounded-lg" value={importData.duration / 60} onChange={e => setImportData({...importData, duration: e.target.value * 60})}/>
                        </div>
                        <button onClick={() => handleImportSubmit('test')} className="w-full bg-blue-600 text-white p-3 rounded-xl font-bold hover:bg-blue-700 shadow-md flex justify-center items-center gap-2 mt-4"><Upload size={20}/> Upload Ngay</button>
                    </div>
                </div>
            )}

            {/* FORM: PRACTICE */}
            {uploadTab === 'practice' && (
                <div className="space-y-6 bg-white border p-8 rounded-2xl shadow-sm">
                    <h3 className="font-bold text-xl text-gray-800 border-b pb-2">Tạo Bài Luyện Tập</h3>
                    <div className="space-y-4">
                        <select className="w-full p-3 border rounded-lg bg-gray-50 font-bold text-gray-800" value={practiceData.type} onChange={e => setPracticeData({...practiceData, type: e.target.value})}>
                            <option value="LISTENING"> 🎧  Luyện Nghe (Listening)</option>
                            <option value="SPEAKING"> 🎙 ️ Luyện Nói (Speaking)</option>
                            <option value="READING"> 📖  Luyện Đọc (Reading)</option>
                            <option value="WRITING"> ✍ ️ Luyện Viết (Writing)</option>
                            <option value="VOCABULARY"> 🔤  Học Từ Vựng (Flashcard)</option>
                            <option value="GRAMMAR"> 🎓  Ngữ Pháp</option>
                        </select>
                        <input type="text" placeholder="Tiêu đề bài tập" className="w-full p-3 border rounded-lg" value={practiceData.title} onChange={e => setPracticeData({...practiceData, title: e.target.value})} />
                        <input type="text" placeholder="Mô tả ngắn" className="w-full p-3 border rounded-lg" value={practiceData.description} onChange={e => setPracticeData({...practiceData, description: e.target.value})} />

                        {practiceData.type === 'VOCABULARY' ? (
                            <div className="bg-orange-50 p-6 rounded-xl border border-orange-200 grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-bold mb-2 text-orange-800">Cách 1: Nhập tay (word:meaning)</label>
                                    <textarea placeholder={"Ví dụ:\nHello: Xin chào\nBye: Tạm biệt"} className="w-full h-32 p-3 border rounded-lg" value={practiceData.vocabInput} onChange={e => setPracticeData({...practiceData, vocabInput: e.target.value})}></textarea>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold mb-2 text-orange-800">Cách 2: Upload file .txt</label>
                                    <input type="file" accept=".txt" className="w-full p-2 border rounded bg-white" onChange={e => setPracticeData({...practiceData, docFile: e.target.files[0]})}/>
                                    <p className="text-xs text-orange-600 mt-2">*Mỗi dòng 1 từ, định dạng: từ : nghĩa</p>
                                </div>
                            </div>
                        ) : (
                            <>
                                <textarea placeholder="Nội dung chi tiết (Text) hoặc Ghi chú" className="w-full p-3 border rounded-lg h-32 font-mono text-sm" value={practiceData.content} onChange={e => setPracticeData({...practiceData, content: e.target.value})} />
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl">
                                    {practiceData.type === 'LISTENING' && <div><label className="block text-sm font-bold mb-1">File Nghe (MP3)</label><input type="file" accept="audio/*" className="w-full p-2 border rounded-lg bg-white" onChange={e => setPracticeData({...practiceData, audioFile: e.target.files[0]})}/></div>}
                                    <div className={practiceData.type === 'LISTENING' ? '' : 'col-span-2'}>
                                        <label className="block text-sm font-bold mb-1">File Tài liệu/Đề bài (PDF/Word/PPT)</label>
                                        <input type="file" className="w-full p-2 border rounded-lg bg-white" onChange={e => setPracticeData({...practiceData, docFile: e.target.files[0]})}/>
                                        <p className="text-xs text-gray-500 mt-1 italic">
                                            *Mẹo: Upload file <b>.docx</b> đúng định dạng đề thi để hệ thống tự tạo bài tập tương tác.
                                        </p>
                                    </div>
                                </div>
                            </>
                        )}
                        <button onClick={() => handleImportSubmit('practice')} className="w-full bg-purple-600 text-white p-3 rounded-xl font-bold hover:bg-purple-700 shadow-md flex justify-center items-center gap-2 mt-4"><Save size={20}/> Tạo Bài Tập</button>
                    </div>
                </div>
            )}

            {/* FORM: LESSON */}
            {uploadTab === 'lesson' && (
                <div className="space-y-6 bg-white border p-8 rounded-2xl shadow-sm">
                    <h3 className="font-bold text-xl text-gray-800 border-b pb-2">Soạn Bài Giảng</h3>
                    <div className="space-y-4">
                        <input type="text" placeholder="Tên bài học" className="w-full p-3 border rounded-lg" value={importData.title} onChange={e => setImportData({...importData, title: e.target.value})} />
                        <textarea placeholder="Mô tả nội dung" className="w-full p-3 border rounded-lg" rows="3" value={importData.desc} onChange={e => setImportData({...importData, desc: e.target.value})}></textarea>
                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-bold mb-1 text-gray-700">File Nội dung (Word/PDF/PPTX)</label>
                                <input
                                    type="file"
                                    accept=".pdf,.doc,.docx,.ppt,.pptx"
                                    className="w-full p-2 border rounded bg-gray-50"
                                    onChange={e => setImportData({...importData, file: e.target.files[0]})}
                                />
                                <p className="text-xs text-blue-600 mt-1">*Hỗ trợ hiển thị trực tiếp PDF và PowerPoint</p>
                            </div>
                            <div>
                                <label className="block text-sm font-bold mb-1 text-gray-700">Audio bài giảng (MP3)</label>
                                <input type="file" accept="audio/*" className="w-full p-2 border rounded bg-gray-50" onChange={e => setImportData({...importData, audio: e.target.files[0]})}/>
                            </div>
                        </div>
                        <button onClick={() => handleImportSubmit('lesson')} className="w-full bg-green-600 text-white p-3 rounded-xl font-bold hover:bg-green-700 shadow-md flex justify-center items-center gap-2 mt-4"><Upload size={20}/> Lưu Bài Giảng</button>
                    </div>
                </div>
            )}

            {/* FORM: DOCUMENT */}
            {uploadTab === 'document' && (
                <div className="space-y-6 bg-white border p-8 rounded-2xl shadow-sm border-orange-100">
                    <h3 className="font-bold text-xl text-orange-800 border-b pb-2">Upload Tài Liệu Tham Khảo</h3>
                    <div className="space-y-4">
                        <input type="text" placeholder="Tên tài liệu" className="w-full p-3 border rounded-lg" value={importData.title} onChange={e => setImportData({...importData, title: e.target.value})} />
                        <input type="text" placeholder="Mô tả ngắn" className="w-full p-3 border rounded-lg" value={importData.desc} onChange={e => setImportData({...importData, desc: e.target.value})} />
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold mb-1 text-gray-700">Loại file</label>
                                <select className="w-full p-3 border rounded-lg bg-gray-50" value={importData.docType} onChange={e => setImportData({...importData, docType: e.target.value})}>
                                    <option value="PDF">PDF Document</option><option value="DOCX">Word Document</option><option value="AUDIO">Audio File</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-bold mb-1 text-gray-700">Chọn File</label>
                                <input type="file" className="w-full p-2 border rounded bg-gray-50" onChange={e => setImportData({...importData, file: e.target.files[0]})}/>
                            </div>
                        </div>
                        <button onClick={() => handleImportSubmit('document')} className="w-full bg-orange-600 text-white p-3 rounded-xl font-bold hover:bg-orange-700 shadow-md flex justify-center items-center gap-2 mt-4"><Upload size={20}/> Upload Tài Liệu</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UploadManager;