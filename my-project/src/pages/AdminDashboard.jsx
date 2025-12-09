import React, { useState, useEffect } from 'react';
import { Users, Upload, List } from 'lucide-react';
import { useToast } from '../components/ToastContext';
import {
    fetchAllStudents, fetchTestsAPI, fetchPracticesAPI, fetchLessonsAPI, fetchDocumentsAPI
} from '../services/api.js';

// Import Sub-Components
import StatsCards from '../components/admin/StatsCards';
import StudentManager from '../components/admin/StudentManager';
import UploadManager from '../components/admin/UploadManager';
import ContentManager from '../components/admin/ContentManager';

const AdminDashboard = ({ onDataChange }) => {
    const toast = useToast();

    // UI Tabs
    const [activeTab, setActiveTab] = useState('students'); // 'students' | 'upload' | 'manage_content'

    // Data State
    const [users, setUsers] = useState([]);
    const [listTests, setListTests] = useState([]);
    const [listPractices, setListPractices] = useState([]);
    const [listLessons, setListLessons] = useState([]);
    const [listDocuments, setListDocuments] = useState([]);

    // Stats State
    const [stats, setStats] = useState({ totalUsers: 0, totalTests: 0, totalLessons: 0, totalDocs: 0 });

    useEffect(() => {
        loadInitialData();
    }, []);

    const loadInitialData = async () => {
        try {
            const [u, t, p, l, d] = await Promise.all([
                fetchAllStudents(),
                fetchTestsAPI(),
                fetchPracticesAPI(),
                fetchLessonsAPI(),
                fetchDocumentsAPI().catch(() => [])
            ]);

            const studentList = u.filter(user => user.role === 'USER');

            setUsers(studentList);
            setListTests(t || []);
            setListPractices(p || []);
            setListLessons(l || []);
            setListDocuments(d || []);

            setStats({
                totalUsers: studentList.length,
                totalTests: t?.length || 0,
                totalLessons: l?.length || 0,
                totalDocs: d?.length || 0
            });
        } catch (e) {
            console.error(e);
            toast.error("Không thể tải dữ liệu hệ thống.");
        }
    };

    const handleDataRefresh = () => {
        loadInitialData();
        if (onDataChange) onDataChange();
    };

    return (
        <div className="container mx-auto px-4 py-8 min-h-screen bg-gray-50 font-sans pb-24">
            <h1 className="text-3xl font-bold mb-6 text-blue-900 border-b pb-4">Trang Quản Trị Hệ Thống</h1>

            {/* 1. STATS ROW */}
            <StatsCards stats={stats} />

            {/* 2. MAIN TABS NAVIGATION */}
            <div className="flex flex-wrap gap-2 mb-8 bg-white p-2 rounded-xl shadow-sm w-fit border border-gray-100">
                <button onClick={() => setActiveTab('students')} className={`px-6 py-3 rounded-lg font-bold flex items-center gap-2 transition-all ${activeTab === 'students' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-100'}`}><Users size={20}/> Quản lý Học viên</button>
                <button onClick={() => setActiveTab('upload')} className={`px-6 py-3 rounded-lg font-bold flex items-center gap-2 transition-all ${activeTab === 'upload' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-100'}`}><Upload size={20}/> Tạo Nội dung</button>
                <button onClick={() => setActiveTab('manage_content')} className={`px-6 py-3 rounded-lg font-bold flex items-center gap-2 transition-all ${activeTab === 'manage_content' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-100'}`}><List size={20}/> Danh sách Nội dung</button>
            </div>

            {/* 3. CONTENT AREA */}
            <div className="bg-white rounded-xl shadow-lg p-6 min-h-[600px] border border-gray-100 relative overflow-hidden">
                {activeTab === 'students' && (
                    <StudentManager users={users} />
                )}

                {activeTab === 'upload' && (
                    <UploadManager onUploadSuccess={handleDataRefresh} />
                )}

                {activeTab === 'manage_content' && (
                    <ContentManager
                        tests={listTests}
                        practices={listPractices}
                        lessons={listLessons}
                        documents={listDocuments}
                        onDataChange={handleDataRefresh}
                    />
                )}
            </div>
        </div>
    );
};

export default AdminDashboard;