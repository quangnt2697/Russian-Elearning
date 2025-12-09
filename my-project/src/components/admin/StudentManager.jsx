import React, { useState } from 'react';
import { Search, GraduationCap, Clock, CheckSquare, Users, MessageSquare, Headphones, X, Save, PenTool } from 'lucide-react';
import { fetchStudentResults, fetchStudentPractices, sendTestFeedback, sendPracticeFeedback, getResourceUrl } from '../../services/api';
import { useToast } from '../ToastContext';

const StudentManager = ({ users }) => {
    const toast = useToast();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedUser, setSelectedUser] = useState(null);
    const [userItems, setUserItems] = useState({ type: '', data: [] });

    // State cho Modal Feedback
    const [selectedItem, setSelectedItem] = useState(null);
    const [feedbackText, setFeedbackText] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Filter Users
    const filteredUsers = users.filter(u =>
        u.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.username.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleViewStudent = async (user, type) => {
        setSelectedUser(user);
        setSelectedItem(null);
        try {
            let data = [];
            if (type === 'results') {
                data = await fetchStudentResults(user.id);
                setUserItems({ type: 'results', data: data || [] });
            } else {
                data = await fetchStudentPractices(user.id);
                setUserItems({ type: 'practices', data: data || [] });
            }
        } catch (e) { console.error(e); toast.error("Lỗi tải bài làm của học viên"); }
    };

    const submitFeedback = async () => {
        if (!selectedItem) return;
        setIsSubmitting(true);
        try {
            if (userItems.type === 'results') await sendTestFeedback(selectedItem.id, feedbackText);
            else await sendPracticeFeedback(selectedItem.id, feedbackText);

            toast.success("Đã lưu nhận xét!");
            setSelectedItem(null);
            // Refresh lại list
            handleViewStudent(selectedUser, userItems.type);
        } catch (e) {
            toast.error("Lỗi gửi feedback");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
            {/* LEFT: LIST USERS */}
            <div className="lg:col-span-1 border-r pr-6 flex flex-col h-[700px]">
                <div className="relative mb-4">
                    <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                    <input type="text" placeholder="Tìm kiếm học viên..." className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                </div>
                <div className="space-y-3 overflow-y-auto pr-2 custom-scrollbar flex-1">
                    {filteredUsers.map(u => (
                        <div key={u.id} onClick={() => handleViewStudent(u, 'results')} className={`p-4 border rounded-xl cursor-pointer hover:bg-blue-50 transition-all ${selectedUser?.id === u.id ? 'bg-blue-50 border-blue-400 ring-1 ring-blue-400' : 'border-gray-200'}`}>
                            <div className="flex items-center gap-3">
                                <div className="bg-blue-100 p-2 rounded-full text-blue-600 font-bold w-10 h-10 flex items-center justify-center">{u.fullName.charAt(0)}</div>
                                <div>
                                    <p className="font-bold text-gray-800">{u.fullName}</p>
                                    <p className="text-xs text-gray-500">{u.username}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* RIGHT: DETAILS */}
            <div className="lg:col-span-2 pl-6 h-[700px] flex flex-col">
                {selectedUser ? (
                    <>
                        <h3 className="font-bold text-xl mb-6 text-blue-900 border-b pb-2 flex items-center gap-2">
                            <GraduationCap /> Kết quả: {selectedUser.fullName}
                        </h3>
                        <div className="flex gap-2 mb-4">
                            <button onClick={() => handleViewStudent(selectedUser, 'results')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${userItems.type === 'results' ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>Điểm thi</button>
                            <button onClick={() => handleViewStudent(selectedUser, 'practices')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${userItems.type === 'practices' ? 'bg-purple-600 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>Bài luyện tập</button>
                        </div>
                        <div className="space-y-3 overflow-y-auto pr-2 custom-scrollbar flex-1">
                            {userItems.data?.length > 0 ? userItems.data.map(item => (
                                <div key={item.id} className="border p-4 rounded-xl flex justify-between items-center hover:shadow-md bg-white transition-shadow">
                                    <div>
                                        <p className="font-bold text-gray-800 text-lg mb-1">{item.testTitle || item.title || "Bài làm không tên"}</p>
                                        <div className="flex gap-3 text-xs text-gray-500">
                                            <span className="flex items-center gap-1"><Clock size={12}/> {item.date || item.createdAt || "N/A"}</span>
                                            {item.score !== undefined && <span className={`font-bold ${item.score >= 50 ? 'text-green-600' : 'text-red-600'}`}>Điểm: {item.score}</span>}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        {(item.isReviewed || item.reviewed) ?
                                            <span className="text-green-600 bg-green-50 px-3 py-1 rounded-lg text-xs font-bold border border-green-200 flex items-center gap-1"><CheckSquare size={14}/> Đã chấm</span>
                                            : <span className="text-yellow-600 bg-yellow-50 px-3 py-1 rounded-lg text-xs font-bold border border-yellow-200">Chờ chấm</span>
                                        }
                                        <button onClick={() => { setSelectedItem(item); setFeedbackText(item.adminFeedback || item.feedback || ""); }} className="text-white bg-blue-600 px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-700 shadow-sm transition-transform hover:-translate-y-0.5">
                                            Chấm bài
                                        </button>
                                    </div>
                                </div>
                            )) : <div className="text-center py-10 text-gray-400 bg-gray-50 rounded-xl border border-dashed">Chưa có dữ liệu bài làm.</div>}
                        </div>
                    </>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-gray-400 bg-gray-50 rounded-xl border-2 border-dashed">
                        <Users size={64} className="mb-4 opacity-20"/>
                        <p className="text-lg">Chọn học viên bên trái để xem chi tiết</p>
                    </div>
                )}
            </div>

            {/* FEEDBACK MODAL */}
            {selectedItem && (
                <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="bg-blue-800 text-white p-4 flex justify-between items-center shrink-0">
                            <h3 className="font-bold text-lg flex items-center gap-2"><MessageSquare size={20}/> Chấm bài & Nhận xét</h3>
                            <button onClick={() => setSelectedItem(null)} className="hover:bg-white/20 p-1 rounded-full"><X size={20}/></button>
                        </div>
                        <div className="p-6 overflow-y-auto flex-1">
                            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 mb-6">
                                <p className="text-xs font-bold text-blue-600 uppercase mb-2">Nội dung bài làm:</p>
                                {selectedItem.audioUrl || (selectedItem.content && selectedItem.content.includes('[AUDIO]')) ? (
                                    <div className="flex items-center gap-3">
                                        <Headphones size={20} className="text-blue-600"/>
                                        <audio controls src={getResourceUrl(selectedItem.audioUrl)} className="w-full"/>
                                    </div>
                                ) : (
                                    <div className="bg-white p-3 rounded border border-blue-200 text-gray-800 whitespace-pre-wrap font-serif">
                                        {selectedItem.content || "(Không có nội dung)"}
                                    </div>
                                )}
                            </div>
                            <div>
                                <label className="block font-bold text-gray-800 mb-2 flex items-center gap-2"><PenTool size={16}/> Nhận xét của giáo viên:</label>
                                <textarea rows="5" className="w-full border border-gray-300 p-4 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-gray-800 bg-white" placeholder="Nhập nhận xét chi tiết, lời khuyên..." value={feedbackText} onChange={e => setFeedbackText(e.target.value)}></textarea>
                            </div>
                        </div>
                        <div className="p-4 border-t bg-gray-50 flex justify-end gap-3 shrink-0">
                            <button onClick={() => setSelectedItem(null)} className="px-5 py-2.5 bg-white border border-gray-300 text-gray-700 font-bold rounded-lg hover:bg-gray-100">Hủy</button>
                            <button onClick={submitFeedback} disabled={isSubmitting} className="px-5 py-2.5 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 shadow-md flex items-center gap-2 disabled:bg-gray-400">
                                {isSubmitting ? "Đang lưu..." : <><Save size={18}/> Lưu Kết Quả</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StudentManager;