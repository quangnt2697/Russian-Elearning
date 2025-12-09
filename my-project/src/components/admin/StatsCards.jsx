import React from 'react';
import { Users, FileText, BookOpen, File } from 'lucide-react';

const StatCard = ({ title, value, icon, color }) => (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 hover:shadow-md transition-all hover:-translate-y-1">
        <div className={`p-4 rounded-xl ${color} text-white shadow-lg`}>{icon}</div>
        <div>
            <p className="text-gray-500 text-sm font-medium uppercase tracking-wide">{title}</p>
            <p className="text-3xl font-bold text-gray-800">{value}</p>
        </div>
    </div>
);

const StatsCards = ({ stats }) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            <StatCard title="Tổng Học viên" value={stats.totalUsers || 0} icon={<Users size={28}/>} color="bg-blue-600" />
            <StatCard title="Kho Đề thi" value={stats.totalTests || 0} icon={<FileText size={28}/>} color="bg-purple-600" />
            <StatCard title="Bài giảng" value={stats.totalLessons || 0} icon={<BookOpen size={28}/>} color="bg-green-600" />
            <StatCard title="Tài liệu" value={stats.totalDocs || 0} icon={<File size={28}/>} color="bg-orange-600" />
        </div>
    );
};

export default StatsCards;