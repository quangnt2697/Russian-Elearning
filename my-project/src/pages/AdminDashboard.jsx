import React, { useState, useEffect } from 'react';
import {
    Users, FileText, BookOpen, Upload, Save, Eye, MessageSquare,
    PenTool, Mic, X, CheckCircle, XCircle, PlayCircle, Trash2,
    List, Edit, Layers, GraduationCap, Download, FileJson, Headphones, LayoutGrid, Clock
} from 'lucide-react';
import {
    fetchAllStudents, fetchStudentResults, fetchStudentPractices,
    importTestFileAPI, importLessonFileAPI, createPracticeAPI,
    sendTestFeedback, sendPracticeFeedback, getResourceUrl,
    fetchTestsAPI, fetchPracticesAPI, fetchLessonsAPI,
    deleteTestAPI, deletePracticeAPI, deleteLessonAPI,
    uploadAudioAPI
} from '../services/api.js';

const AdminDashboard = ({ onDataChange }) => {
    // --- STATE QUẢN LÝ TABS ---
    const [activeTab, setActiveTab] = useState('students');
    const [uploadTab, setUploadTab] = useState('test'); // 'test' | 'practice' | 'lesson'
    const [manageTab, setManageTab] = useState('tests');

    // --- STATE DỮ LIỆU ---
    const [users, setUsers] = useState([]);
    const [listTests, setListTests] = useState([]);
    const [listPractices, setListPractices] = useState([]);
    const [listLessons, setListLessons] = useState([]);

    // --- STATE CHO MODAL FEEDBACK ---
    const [selectedUser, setSelectedUser] = useState(null);
    const [userItems, setUserItems] = useState([]);
    const [selectedItem, setSelectedItem] = useState(null);
    const [feedbackText, setFeedbackText] = useState("");

    // --- STATE FORM UPLOAD ---
    const [importData, setImportData] = useState({ title: '', desc: '', duration: 600, file: null, audio: null });

    // State cho Practice (Gộp cả Vocab/Grammar vào đây)
    // type options: LISTENING, SPEAKING, READING, WRITING, VOCABULARY, GRAMMAR
    const [practiceData, setPracticeData] = useState({
        title: '',
        type: 'LISTENING',
        description: '',
        content: '',
        audioFile: null,
        docFile: null,
        vocabInput: '' // Dùng riêng cho nhập từ vựng thủ công
    });

    // --- EFFECTS ---
    useEffect(() => {
        if (activeTab === 'students') {
            loadStudents();
            loadContentLists(); // Cần load list practices để tính toán tiến độ từ vựng
        }
        if (activeTab === 'manage_content') loadContentLists();
    }, [activeTab]);

    // --- API CALLS: LOAD DATA ---
    const loadStudents = async () => {
        try {
            const data = await fetchAllStudents();
            setUsers(data.filter(u => u.role === 'USER'));
        } catch (e) { console.error("Lỗi tải danh sách học viên:", e); }
    };

    const loadContentLists = async () => {
        try {
            const [t, p, l] = await Promise.all([
                fetchTestsAPI(),
                fetchPracticesAPI(),
                fetchLessonsAPI()
            ]);
            setListTests(t || []);
            setListPractices(p || []);
            setListLessons(l || []);
        } catch (e) { console.error("Lỗi tải danh sách nội dung:", e); }
    };

    // --- HELPER: TÍNH TIẾN ĐỘ TỪ VỰNG ---
    const calculateVocabProgress = (user) => {
        const totalVocabTopics = listPractices.filter(p => p.type === 'VOCABULARY').length;
        if (totalVocabTopics === 0) return { learned: 0, total: 0, percent: 0 };
        const completedCount = user.practiceSubmissions ? user.practiceSubmissions.filter(p => p.type === 'VOCABULARY').length : 0;
        return {
            learned: completedCount,
            total: totalVocabTopics,
            percent: Math.round((completedCount / totalVocabTopics) * 100)
        };
    };

    // --- API CALLS: ACTIONS ---
    const handleDeleteContent = async (id, type) => {
        if (!window.confirm("Bạn chắc chắn muốn xóa nội dung này? Hành động này không thể hoàn tác.")) return;
        try {
            if (type === 'test') await deleteTestAPI(id);
            else if (type === 'practice') await deletePracticeAPI(id);
            else if (type === 'lesson') await deleteLessonAPI(id);

            alert("Đã xóa thành công!");
            loadContentLists();
            if (onDataChange) onDataChange();
        } catch (e) {
            console.error(e);
            alert("Lỗi khi xóa.");
        }
    };

    const handleViewStudent = async (user, type) => {
        setSelectedUser(user);
        setSelectedItem(null);
        try {
            if (type === 'results') {
                const data = await fetchStudentResults(user.id);
                setUserItems({ type: 'results', data });
            } else {
                const data = await fetchStudentPractices(user.id);
                setUserItems({ type: 'practices', data: data || [] });
            }
        } catch (e) { console.error(e); }
    };

    const handleImportSubmit = async (type) => {
        try {
            if (type === 'lesson') {
                if (!importData.file) { alert("Vui lòng chọn file nội dung!"); return; }
                await importLessonFileAPI(importData.file, importData.audio, importData.title, importData.desc);
            } else if (type === 'test') {
                if (!importData.file) { alert("Vui lòng chọn file đề thi!"); return; }
                await importTestFileAPI(importData.file, importData.audio, importData.title, importData.duration);
            }
            else if (type === 'practice') {
                if (!practiceData.title) { alert("Vui lòng nhập tiêu đề!"); return; }

                let mediaUrl = null;
                let contentUrl = practiceData.content;

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
                    if (finalVocab.length === 0) { alert("Dữ liệu từ vựng trống hoặc sai định dạng!"); return; }
                    contentUrl = JSON.stringify(finalVocab);
                }
                else {
                    if (practiceData.audioFile) {
                        mediaUrl = await uploadAudioAPI(practiceData.audioFile);
                    }
                    if (practiceData.docFile) {
                        contentUrl = await uploadAudioAPI(practiceData.docFile);
                    }
                }

                await createPracticeAPI({
                    ...practiceData,
                    mediaUrl,
                    content: contentUrl
                });
            }

            alert("Upload thành công!");
            setImportData({ title: '', desc: '', duration: 600, file: null, audio: null });
            setPracticeData({ title: '', type: 'LISTENING', description: '', content: '', audioFile: null, docFile: null, vocabInput: '' });
            if (onDataChange) onDataChange();
        } catch (e) { alert("Lỗi: " + e.message); }
    };

    const submitFeedback = async () => {
        if (!selectedItem) return;
        try {
            if (userItems.type === 'results') await sendTestFeedback(selectedItem.id, feedbackText);
            else await sendPracticeFeedback(selectedItem.id, feedbackText);

            alert("Đã gửi phản hồi thành công!");
            setSelectedItem(null);
            handleViewStudent(selectedUser, userItems.type);
        } catch (e) { alert("Lỗi gửi feedback"); }
    };

    // --- RENDER HELPER: POPUP CONTENT ---
    const renderSubmissionContent = (item, type) => {
        if (type === 'practices') {
            return (
                <div className="space-y-4">
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <p className="text-sm font-bold text-gray-500 uppercase mb-2">Đề bài:</p>
                        <p className="text-gray-800 font-medium text-lg">{item.title}</p>
                        <span className="inline-block mt-2 px-2 py-1 rounded bg-purple-100 text-purple-700 text-xs font-bold border border-purple-200">{item.type}</span>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-blue-200 shadow-sm">
                        <p className="text-sm font-bold text-blue-600 uppercase mb-3 flex items-center gap-2">
                            {item.audioUrl ? <Mic size={16}/> : <PenTool size={16}/>} Bài làm của học viên:
                        </p>
                        {item.audioUrl ? (
                            <audio controls src={getResourceUrl(item.audioUrl)} className="w-full mt-1"/>
                        ) : (
                            <p className="whitespace-pre-wrap text-gray-800 font-serif leading-relaxed">{item.content}</p>
                        )}
                    </div>
                </div>
            );
        }
        if (type === 'results') {
            return <p>Chi tiết bài thi...</p>;
        }
    };

    // --- RENDER HELPER: CONTENT LIST (Giao diện Card cho tất cả) ---
    const renderContentList = () => {
        let data = [];
        let typeLabel = "";
        let typeColorClass = "";
        let deleteType = "";

        if (manageTab === 'tests') {
            data = listTests;
            typeLabel = "ĐỀ THI";
            typeColorClass = "bg-blue-50 text-blue-700 border-blue-200";
            deleteType = "test";
        } else if (manageTab === 'practices') {
            data = listPractices;
            // typeLabel được set động trong loop
            deleteType = "practice";
        } else if (manageTab === 'lessons') {
            data = listLessons;
            typeLabel = "BÀI GIẢNG";
            typeColorClass = "bg-green-50 text-green-700 border-green-200";
            deleteType = "lesson";
        }

        if (data.length === 0) {
            return (
                <div className="bg-white border rounded-xl p-10 text-center text-gray-400 italic shadow-sm">
                    Chưa có dữ liệu nào.
                </div>
            );
        }

        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
                {data.map((item) => {
                    // Cấu hình hiển thị Badge
                    let badgeClass = typeColorClass;
                    let badgeText = typeLabel;

                    if (manageTab === 'practices') {
                        badgeText = item.type;
                        if (item.type === 'VOCABULARY') badgeClass = 'bg-orange-50 text-orange-700 border-orange-200';
                        else if (item.type === 'GRAMMAR') badgeClass = 'bg-teal-50 text-teal-700 border-teal-200';
                        else badgeClass = 'bg-purple-50 text-purple-700 border-purple-200';
                    }

                    return (
                        <div key={item.id} className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow relative group flex flex-col h-full">
                            {/* Header Card: Badge + Delete Button */}
                            <div className="flex justify-between items-start mb-3">
                                <span className={`px-2 py-1 rounded text-xs font-bold uppercase tracking-wide border ${badgeClass}`}>
                                    {badgeText}
                                </span>
                                <button
                                    onClick={() => handleDeleteContent(item.id, deleteType)}
                                    className="text-gray-400 hover:text-red-500 transition-colors p-1"
                                    title="Xóa nội dung này"
                                >
                                    <Trash2 size={18}/>
                                </button>
                            </div>

                            {/* Content */}
                            <h4 className="font-bold text-gray-800 text-lg mb-2 line-clamp-2" title={item.title}>
                                {item.title}
                            </h4>

                            <p className="text-sm text-gray-500 mb-4 line-clamp-3 flex-1">
                                {item.description || "(Không có mô tả chi tiết)"}
                            </p>

                            {/* Footer Info */}
                            <div className="flex items-center gap-3 text-xs text-gray-400 border-t pt-3 mt-auto">
                                <span className="font-mono bg-gray-50 px-1.5 py-0.5 rounded text-gray-500">#{item.id}</span>

                                {manageTab === 'tests' && (
                                    <>
                                        <span className="flex items-center gap-1 bg-blue-50 text-blue-600 px-2 py-0.5 rounded"><Clock size={12}/> {item.duration ? Math.floor(item.duration/60) + " phút" : "N/A"}</span>
                                        {item.audioUrl && <span className="flex items-center gap-1 bg-green-50 text-green-600 px-2 py-0.5 rounded"><Headphones size={12}/> Audio</span>}
                                    </>
                                )}

                                {manageTab === 'practices' && (
                                    <>
                                        {item.mediaUrl && <span className="flex items-center gap-1 bg-blue-50 text-blue-600 px-2 py-0.5 rounded"><Headphones size={12}/> Audio</span>}
                                        {item.content && item.content.startsWith('/uploads/') && <span className="flex items-center gap-1 bg-gray-100 text-gray-600 px-2 py-0.5 rounded"><FileText size={12}/> File</span>}
                                        {item.type === 'VOCABULARY' && <span className="flex items-center gap-1 bg-orange-50 text-orange-600 px-2 py-0.5 rounded"><Layers size={12}/> Flashcard</span>}
                                    </>
                                )}

                                {manageTab === 'lessons' && (
                                    <>
                                        {item.audioUrl && <span className="flex items-center gap-1 bg-blue-50 text-blue-600 px-2 py-0.5 rounded"><Headphones size={12}/> Audio</span>}
                                        <span className="flex items-center gap-1 bg-gray-100 text-gray-600 px-2 py-0.5 rounded"><FileText size={12}/> Bài học</span>
                                    </>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <div className="container mx-auto px-4 py-8 min-h-screen bg-gray-50">
            <h1 className="text-3xl font-bold mb-8 text-blue-900 border-b pb-4">Trang Quản Trị</h1>

            {/* --- MAIN TABS --- */}
            <div className="flex flex-wrap gap-2 mb-8 bg-white p-2 rounded-xl shadow-sm w-fit border border-gray-100">
                <button onClick={() => setActiveTab('students')} className={`px-6 py-3 rounded-lg font-bold flex items-center gap-2 transition-all ${activeTab === 'students' ? 'bg-blue-600 text-white shadow-md' : 'text-white hover:bg-gray-100 hover:text-gray-600'}`}>
                    <Users size={20}/> Quản lý Học viên
                </button>
                <button onClick={() => setActiveTab('upload')} className={`px-6 py-3 rounded-lg font-bold flex items-center gap-2 transition-all ${activeTab === 'upload' ? 'bg-blue-600 text-white shadow-md' : 'text-white hover:bg-gray-100 hover:text-gray-600'}`}>
                    <Upload size={20}/> Tạo Nội dung
                </button>
                <button onClick={() => setActiveTab('manage_content')} className={`px-6 py-3 rounded-lg font-bold flex items-center gap-2 transition-all ${activeTab === 'manage_content' ? 'bg-blue-600 text-white shadow-md' : 'text-white hover:bg-gray-100 hover:text-gray-600'}`}>
                    <List size={20}/> Danh sách nội dung
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 min-h-[600px] border border-gray-100">

                {/* === TAB 1: STUDENTS === */}
                {activeTab === 'students' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* List Students */}
                        <div className="lg:col-span-1 border-r pr-6">
                            <h3 className="font-bold text-lg mb-4 text-gray-700">Danh sách học viên</h3>
                            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                                {users.map(u => {
                                    const vocabStats = calculateVocabProgress(u);
                                    return (
                                        <div key={u.id} className={`p-4 border rounded-xl cursor-pointer hover:bg-blue-50 transition-all ${selectedUser?.id === u.id ? 'bg-blue-50 border-blue-400 ring-1 ring-blue-400' : 'border-gray-200'}`}>
                                            <div className="flex justify-between items-start mb-2">
                                                <div onClick={() => handleViewStudent(u, 'results')} className="flex-1">
                                                    <p className="font-bold text-gray-800 text-lg">{u.fullName}</p>
                                                    <p className="text-sm text-gray-500">{u.username}</p>
                                                </div>
                                            </div>

                                            <div className="mt-2">
                                                <div className="flex justify-between text-xs text-gray-600 mb-1">
                                                    <span>Tiến độ Từ vựng:</span>
                                                    <span className="font-bold">{vocabStats.learned}/{vocabStats.total} chủ đề</span>
                                                </div>
                                                <div className="w-full bg-gray-200 rounded-full h-1.5">
                                                    <div className="bg-orange-500 h-1.5 rounded-full" style={{ width: `${vocabStats.percent}%` }}></div>
                                                </div>
                                            </div>

                                            <div className="flex gap-2 mt-4">
                                                <button onClick={() => handleViewStudent(u, 'results')} className="flex-1 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm font-bold hover:bg-blue-200 flex justify-center gap-2"><FileText size={16}/> Điểm thi</button>
                                                <button onClick={() => handleViewStudent(u, 'practices')} className="flex-1 py-2 bg-purple-100 text-purple-700 rounded-lg text-sm font-bold hover:bg-purple-200 flex justify-center gap-2"><Mic size={16}/> Bài tập</button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Detail View */}
                        <div className="lg:col-span-2 pl-6">
                            {selectedUser ? (
                                <>
                                    <h3 className="font-bold text-lg mb-4 text-blue-800 flex items-center gap-2 border-b pb-2">
                                        {userItems.type === 'results' ? <FileText size={20}/> : <Mic size={20}/>}
                                        Bài làm của: <span className="text-black">{selectedUser.fullName}</span>
                                    </h3>

                                    {userItems.data && userItems.data.length > 0 ? (
                                        <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                                            {userItems.data.map(item => {
                                                const displayTitle = item.testTitle || item.test?.title || item.title || "Bài làm không tên";
                                                const displayDate = item.date || (item.createdAt ? new Date(item.createdAt).toLocaleDateString('vi-VN') : "N/A");
                                                const isReviewed = item.isReviewed || item.reviewed;

                                                return (
                                                    <div key={item.id} className="border p-4 rounded-lg hover:shadow-md transition-shadow bg-white">
                                                        <div className="flex justify-between items-start mb-2">
                                                            <span className="font-bold text-gray-800 line-clamp-1 w-3/4">{displayTitle}</span>
                                                            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">{displayDate}</span>
                                                        </div>
                                                        {userItems.type === 'results' && <p className="text-sm text-gray-600 mb-2">Điểm: <span className={`font-bold ${item.score >= 50 ? 'text-green-600' : 'text-red-600'}`}>{item.score}</span></p>}

                                                        <div className="mt-2 flex justify-between items-center pt-2 border-t border-gray-100">
                                                            <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded ${isReviewed ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{isReviewed ? 'Đã chấm' : 'Chờ chấm'}</span>
                                                            <button onClick={() => { setSelectedItem(item); setFeedbackText(item.adminFeedback || item.feedback || ""); }} className="text-blue-600 text-xs font-bold hover:underline flex items-center gap-1 bg-blue-50 px-3 py-1.5 rounded-lg"><MessageSquare size={14}/> Chấm bài</button>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ) : <div className="text-center py-10 bg-gray-50 rounded-xl border border-dashed text-gray-500">Chưa có dữ liệu.</div>}
                                </>
                            ) : <div className="flex flex-col items-center justify-center h-full text-gray-400 mt-10"><Users size={64} className="mb-4 opacity-20"/><p>Chọn học viên để xem chi tiết.</p></div>}
                        </div>
                    </div>
                )}

                {/* === TAB 2: UPLOAD CONTENT === */}
                {activeTab === 'upload' && (
                    <div className="max-w-4xl mx-auto animate-fade-in">
                        <div className="flex justify-center gap-2 mb-8 border-b">
                            <button onClick={() => setUploadTab('test')} className={`px-6 py-3 rounded-lg font-bold flex items-center gap-2 transition-all ${uploadTab === 'test' ? 'bg-blue-600 text-white shadow-md' : 'text-white hover:bg-gray-100 hover:text-gray-600'}`}>Đề Thi</button>
                            <button onClick={() => setUploadTab('practice')} className={`px-6 py-3 rounded-lg font-bold flex items-center gap-2 transition-all ${uploadTab === 'practice' ? 'bg-blue-600 text-white shadow-md' : 'text-white hover:bg-gray-100 hover:text-gray-600'}`}>Luyện Tập</button>
                            <button onClick={() => setUploadTab('lesson')} className={`px-6 py-3 rounded-lg font-bold flex items-center gap-2 transition-all ${uploadTab === 'lesson' ? 'bg-blue-600 text-white shadow-md' : 'text-white hover:bg-gray-100 hover:text-gray-600'}`}>Bài Giảng</button>
                        </div>

                        {/* 1. Upload Test */}
                        {uploadTab === 'test' && (
                            <div className="space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <input type="text" placeholder="Tiêu đề đề thi" className="col-span-2 p-3 border rounded-lg text-white" value={importData.title} onChange={e => setImportData({...importData, title: e.target.value})} />
                                    <div>
                                        <label className="block text-sm font-bold mb-1">File Đề (DOCX/PDF)</label>
                                        <input type="file" className="w-full text-sm p-2 border rounded" onChange={e => setImportData({...importData, file: e.target.files[0]})}/>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold mb-1">File Audio (MP3)</label>
                                        <input type="file" accept="audio/*" className="w-full text-sm p-2 border rounded" onChange={e => setImportData({...importData, audio: e.target.files[0]})}/>
                                    </div>
                                    <div className="col-span-2">
                                        <label className="block text-sm font-bold mb-1">Thời gian làm bài (phút)</label>
                                        <input type="number" className="w-full p-3 border rounded-lg text-white" value={importData.duration / 60} onChange={e => setImportData({...importData, duration: e.target.value * 60})}/>
                                    </div>
                                </div>
                                <button onClick={() => handleImportSubmit('test')} className="w-full bg-blue-600 text-white p-3 rounded-lg font-bold hover:bg-blue-700 flex justify-center items-center gap-2 mt-4"><Upload size={20}/> Upload Đề Thi</button>
                            </div>
                        )}

                        {/* 2. Upload Practice (ALL TYPES) */}
                        {uploadTab === 'practice' && (
                            <div className="space-y-6 bg-white border p-6 rounded-xl shadow-sm">
                                <h3 className="font-bold text-lg text-gray-700 mb-2">Soạn nội dung luyện tập mới</h3>

                                <div>
                                    <label className="block text-sm font-bold mb-1 text-gray-700">Loại bài tập:</label>
                                    <select
                                        className="w-full p-3 border rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none font-bold text-gray-800"
                                        value={practiceData.type}
                                        onChange={e => setPracticeData({...practiceData, type: e.target.value})}
                                    >
                                        <option value="LISTENING">🎧 Luyện Nghe (Listening)</option>
                                        <option value="SPEAKING">🎙️ Luyện Nói (Speaking)</option>
                                        <option value="READING">📖 Luyện Đọc (Reading)</option>
                                        <option value="WRITING">✍️ Luyện Viết (Writing)</option>
                                        <option value="VOCABULARY">🔤 Học Từ Vựng (Vocabulary)</option>
                                        <option value="GRAMMAR">🎓 Ngữ Pháp (Grammar)</option>
                                    </select>
                                </div>

                                <input type="text" placeholder="Tiêu đề luyện tập" className="w-full p-3 border rounded-lg text-white"
                                       value={practiceData.title} onChange={e => setPracticeData({...practiceData, title: e.target.value})} />

                                <input type="text" placeholder="Mô tả" className="w-full p-3 border rounded-lg text-white"
                                       value={practiceData.description} onChange={e => setPracticeData({...practiceData, description: e.target.value})} />

                                {practiceData.type === 'VOCABULARY' ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-orange-50 rounded-lg border border-orange-100">
                                        <div>
                                            <label className="block font-bold text-gray-700 mb-2">Nhập từ vựng (Thủ công)</label>
                                            <textarea
                                                placeholder={"Định dạng: từ : nghĩa\nVí dụ:\nмама : mẹ\nпапа : bố"}
                                                className="w-full h-40 p-3 border rounded-lg font-mono text-sm bg-white"
                                                value={practiceData.vocabInput}
                                                onChange={e => setPracticeData({...practiceData, vocabInput: e.target.value})}
                                            ></textarea>
                                        </div>
                                        <div>
                                            <label className="block font-bold text-gray-700 mb-2">Hoặc Upload File (.txt)</label>
                                            <input
                                                type="file"
                                                accept=".txt"
                                                className="w-full text-sm p-2 border rounded bg-white"
                                                onChange={e => setPracticeData({...practiceData, docFile: e.target.files[0]})}
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <textarea placeholder="Nội dung văn bản chi tiết" className="w-full p-3 border rounded-lg font-mono text-sm h-32 text-white"
                                                  value={practiceData.content} onChange={e => setPracticeData({...practiceData, content: e.target.value})} />

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg border border-gray-100">
                                            {practiceData.type === 'LISTENING' && (
                                                <div>
                                                    <label className="block text-sm font-bold mb-1 text-gray-700 flex items-center gap-2"><Headphones size={16}/> File Nghe (Audio MP3)</label>
                                                    <input type="file" accept="audio/*" className="w-full p-2 border rounded-lg bg-white text-sm" onChange={e => setPracticeData({...practiceData, audioFile: e.target.files[0]})}/>
                                                </div>
                                            )}
                                            <div className={practiceData.type === 'LISTENING' ? '' : 'col-span-2'}>
                                                <label className="block text-sm font-bold mb-1 text-gray-700 flex items-center gap-2"><FileText size={16}/> File Tài liệu / Đề bài (Word/PDF)</label>
                                                <input type="file" accept=".doc,.docx,.pdf" className="w-full p-2 border rounded-lg bg-white text-sm" onChange={e => setPracticeData({...practiceData, docFile: e.target.files[0]})}/>
                                            </div>
                                        </div>
                                    </>
                                )}

                                <button onClick={() => handleImportSubmit('practice')} className="w-full bg-green-600 text-white p-3 rounded-lg font-bold hover:bg-green-700 flex justify-center items-center gap-2 mt-4"><Save size={20}/> Lưu Nội Dung</button>
                            </div>
                        )}

                        {/* 3. Upload Lesson */}
                        {uploadTab === 'lesson' && (
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <input type="text" placeholder="Tiêu đề bài giảng" className="col-span-2 p-3 border rounded-lg text-white" value={importData.title} onChange={e => setImportData({...importData, title: e.target.value})} />
                                    <textarea placeholder="Mô tả" className="col-span-2 p-3 border rounded-lg text-white" rows="3" value={importData.desc} onChange={e => setImportData({...importData, desc: e.target.value})}></textarea>
                                    <div>
                                        <label className="block text-sm font-bold mb-1">File Nội dung (DOCX/PDF)</label>
                                        <input type="file" className="w-full p-2 border rounded" onChange={e => setImportData({...importData, file: e.target.files[0]})}/>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold mb-1">Audio Bài giảng (MP3)</label>
                                        <input type="file" accept="audio/*" className="w-full p-2 border rounded" onChange={e => setImportData({...importData, audio: e.target.files[0]})}/>
                                    </div>
                                </div>
                                <button onClick={() => handleImportSubmit('lesson')} className="w-full bg-purple-600 text-white p-3 rounded-lg font-bold hover:bg-purple-700 flex justify-center items-center gap-2 mt-4"><Upload size={20}/> Upload Bài Giảng</button>
                            </div>
                        )}
                    </div>
                )}

                {/* === TAB 3: MANAGE CONTENT LIST === */}
                {activeTab === 'manage_content' && (
                    <div className="max-w-6xl mx-auto animate-fade-in">
                        <div className="flex gap-4 mb-6">
                            <button onClick={() => setManageTab('tests')} className={`px-4 py-2 rounded-lg font-bold flex items-center gap-2 ${manageTab === 'tests' ? 'bg-blue-100 text-blue-700 border border-blue-300' : 'bg-white border text-gray-600'}`}>
                                <FileText size={18}/> Đề thi ({listTests.length})
                            </button>
                            <button onClick={() => setManageTab('practices')} className={`px-4 py-2 rounded-lg font-bold flex items-center gap-2 ${manageTab === 'practices' ? 'bg-purple-100 text-purple-700 border border-purple-300' : 'bg-white border text-gray-600'}`}>
                                <LayoutGrid size={18}/> Luyện tập ({listPractices.length})
                            </button>
                            <button onClick={() => setManageTab('lessons')} className={`px-4 py-2 rounded-lg font-bold flex items-center gap-2 ${manageTab === 'lessons' ? 'bg-green-100 text-green-700 border border-green-300' : 'bg-white border text-gray-600'}`}>
                                <BookOpen size={18}/> Bài giảng ({listLessons.length})
                            </button>
                        </div>

                        {renderContentList()}
                    </div>
                )}

                {/* --- FEEDBACK POPUP (Giữ nguyên) --- */}
                {selectedItem && (
                    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
                        <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
                            <div className="bg-blue-700 text-white p-4 flex justify-between items-center shrink-0">
                                <h3 className="font-bold text-lg flex items-center gap-2"><MessageSquare size={20}/> Chấm bài & Nhận xét</h3>
                                <button onClick={() => setSelectedItem(null)} className="text-white/80 hover:text-white bg-white/10 p-1 rounded-full"><X size={20}/></button>
                            </div>
                            <div className="flex-1 overflow-y-auto p-6">
                                <div className="mb-6">
                                    <h4 className="font-bold text-gray-800 mb-3 border-b pb-2">Nội dung bài làm</h4>
                                    {renderSubmissionContent(selectedItem, userItems.type)}
                                </div>
                                <div>
                                    <label className="block font-bold text-gray-800 mb-2 flex items-center gap-2"><PenTool size={18} className="text-blue-600"/> Ghi chú & Nhận xét:</label>
                                    <textarea rows="5" className="w-full border border-gray-300 p-4 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-gray-800 bg-gray-50 focus:bg-white" placeholder="Nhập nhận xét chi tiết..." value={feedbackText} onChange={e => setFeedbackText(e.target.value)}></textarea>
                                </div>
                            </div>
                            <div className="p-4 border-t bg-gray-50 flex justify-end gap-3 shrink-0">
                                <button onClick={() => setSelectedItem(null)} className="px-5 py-2.5 text-gray-600 font-bold hover:bg-gray-200 rounded-lg">Hủy bỏ</button>
                                <button onClick={submitFeedback} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2.5 px-6 rounded-lg shadow-md flex items-center gap-2"><Save size={18}/> Lưu & Gửi</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminDashboard;