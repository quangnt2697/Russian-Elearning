import axios from 'axios';

const PRODUCTION_URL = 'https://russian-elearning.onrender.com/api';
const LOCAL_URL = 'http://localhost:8080/api';

const API_URL = import.meta.env.MODE === 'production' ? PRODUCTION_URL : LOCAL_URL;; // lên prod thì thay url prod vào


// Helper để lấy full URL cho Audio/Image từ đường dẫn tương đối
export const getResourceUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    return `${rootUrl}${path.startsWith('/') ? '' : '/'}${path}`;
};

const api = axios.create({
    baseURL: API_URL,
    headers: { 'Content-Type': 'application/json' },
    withCredentials: true // Quan trọng: Để gửi Cookie Session đi kèm request
});

// Interceptor: Tự động xử lý khi Backend trả về lỗi
api.interceptors.response.use(
    response => response,
    error => {
        // Nếu lỗi 401 (Chưa đăng nhập) hoặc 403 (Hết phiên/Không có quyền)
        if (error.response && (error.response.status === 401 || error.response.status === 403)) {
            // Không xóa localStorage ngay ở đây để App.jsx xử lý logic refresh state
            // Chỉ trả về lỗi để component gọi API biết
            return Promise.reject(error);
        }
        return Promise.reject(error);
    }
);

// --- AUTH & USER ---
export const loginAPI = async (username, password) => (await api.post('/auth/login', { username, password })).data;
export const registerAPI = async (fullName, username, password) => (await api.post('/auth/register', { fullName, username, password })).data;
export const fetchCurrentUserAPI = async () => (await api.get('/auth/me')).data;

// --- USER HISTORY (MỚI: Lấy lịch sử của chính user đang login) ---
export const fetchUserTestHistory = async () => (await api.get('/tests/history')).data;
export const fetchUserPracticeHistory = async () => (await api.get('/practices/history')).data;

// --- PUBLIC DATA ---
export const fetchLessonsAPI = async () => (await api.get('/lessons')).data;
export const fetchTestsAPI = async () => (await api.get('/tests')).data;
export const fetchPracticesAPI = async () => (await api.get('/practices')).data;

// --- SUBMIT (Nộp bài) ---
export const submitTestAPI = async (data) => (await api.post('/tests/submit', data)).data;
export const submitPracticeAPI = async (data) => (await api.post('/practices/submit', data)).data;

// --- ADMIN FEATURES ---
export const fetchAllStudents = async () => (await api.get('/admin/users')).data;
export const fetchStudentResults = async (id) => (await api.get(`/admin/users/${id}/results`)).data;
export const fetchStudentPractices = async (id) => (await api.get(`/admin/users/${id}/practices`)).data;
export const sendTestFeedback = async (id, feedback) => api.post(`/admin/feedback/result/${id}`, { feedback });
export const sendPracticeFeedback = async (id, feedback) => api.post(`/admin/feedback/practice/${id}`, { feedback });
export const createPracticeAPI = async (data) => (await api.post('/admin/practices', data)).data;
export const deleteTestAPI = async (id) => api.delete(`/admin/tests/${id}`);
export const deletePracticeAPI = async (id) => api.delete(`/admin/practices/${id}`);
export const deleteLessonAPI = async (id) => api.delete(`/admin/lessons/${id}`);

// --- UPLOAD & IMPORT ---
export const uploadAudioAPI = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return (await api.post('/upload/audio', formData, { headers: { 'Content-Type': 'multipart/form-data' } })).data;
};

export const importTestFileAPI = async (file, audio, title, duration) => {
    const formData = new FormData();
    formData.append('file', file);
    if(audio) formData.append('audio', audio);
    formData.append('title', title);
    formData.append('duration', duration);
    return await api.post('/admin/tests/import', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
};

export const importLessonFileAPI = async (file, audio, title, description) => {
    const formData = new FormData();
    formData.append('file', file);
    if(audio) formData.append('audio', audio);
    formData.append('title', title);
    formData.append('description', description);
    return await api.post('/admin/lessons/import', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
};

