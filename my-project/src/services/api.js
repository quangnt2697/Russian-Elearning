import axios from 'axios';

// Cấu hình URL cơ sở
const PRODUCTION_URL = 'https://russian-elearning.onrender.com/api';
const LOCAL_URL = 'http://localhost:8080/api';

// Tự động chọn URL dựa trên môi trường build (Vite hỗ trợ import.meta.env)
const API_URL = import.meta.env.MODE === 'production' ? PRODUCTION_URL : LOCAL_URL;

// Base URL cho tài nguyên (bỏ /api ở cuối để trỏ về root static files)
// Ví dụ API: http://localhost:8080/api -> Resource: http://localhost:8080
const RESOURCE_BASE_URL = API_URL.replace('/api', '');

// --- HELPER QUAN TRỌNG: Lấy full URL cho Audio/Image ---
export const getResourceUrl = (path) => {
    if (!path) return null;

    // Nếu path đã là full URL (ví dụ link ngoài hoặc Supabase trả về full path)
    if (path.startsWith('http://') || path.startsWith('https://')) {
        return path;
    }

    // Nếu path là relative (ví dụ: /uploads/abc.mp3)
    // Đảm bảo có dấu / ở đầu
    const cleanPath = path.startsWith('/') ? path : `/${path}`;

    // Trả về: http://domain:port/uploads/filename
    return `${RESOURCE_BASE_URL}${cleanPath}`;
};

const api = axios.create({
    baseURL: API_URL,
    headers: { 'Content-Type': 'application/json' },
    withCredentials: true
});

api.interceptors.response.use(
    response => response,
    error => Promise.reject(error)
);

// --- AUTH ---
export const loginAPI = async (username, password) => (await api.post('/auth/login', { username, password })).data;
export const registerAPI = async (fullName, username, password) => (await api.post('/auth/register', { fullName, username, password })).data;
export const fetchCurrentUserAPI = async () => (await api.get('/auth/me')).data;
export const logoutAPI = async () => await api.post('/auth/logout');

// --- USER HISTORY ---
export const fetchUserTestHistory = async () => (await api.get('/tests/history')).data;
export const fetchUserPracticeHistory = async () => (await api.get('/practices/history')).data;

// --- PUBLIC DATA ---
export const fetchLessonsAPI = async () => (await api.get('/lessons')).data;
export const fetchTestsAPI = async () => (await api.get('/tests')).data;
export const fetchPracticesAPI = async () => (await api.get('/practices')).data;
export const fetchDocumentsAPI = async () => (await api.get('/documents')).data;

// --- SUBMIT ---
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
export const deleteDocumentAPI = async (id) => api.delete(`/admin/documents/${id}`);

// --- UPLOAD ---
export const uploadAudioAPI = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return (await api.post('/upload/audio', formData, { headers: { 'Content-Type': 'multipart/form-data' } })).data;
};

// [NEW] API IMPORT PRACTICE TỪ FILE
// Gọi tới endpoint @PostMapping("/practices/import") trong AdminController
export const importPracticeFileAPI = async (file, audio, title, type, description) => {
    const formData = new FormData();
    formData.append('file', file);
    if(audio) formData.append('audio', audio);
    formData.append('title', title);
    formData.append('type', type);
    formData.append('description', description);

    return await api.post('/admin/practices/import', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
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

export const importDocumentAPI = async (file, title, description, type) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', title);
    formData.append('description', description);
    formData.append('type', type);
    return await api.post('/admin/documents/import', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
};