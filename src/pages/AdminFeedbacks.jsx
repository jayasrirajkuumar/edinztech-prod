import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form'; // Not strictly needed unless editing
import { Link } from 'react-router-dom';
import { Icons } from '../components/icons/index';
import Button from '../components/ui/Button';
import AdminTable from '../components/AdminTable';
import api from '../lib/api';

export default function AdminFeedbacks() {
    const [feedbacks, setFeedbacks] = useState([]);
    const [programs, setPrograms] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedProgram, setSelectedProgram] = useState('');

    useEffect(() => {
        fetchPrograms();
    }, []);

    useEffect(() => {
        fetchFeedbacks();
    }, [searchTerm, selectedProgram]);

    const fetchPrograms = async () => {
        try {
            const { data } = await api.get('/programs');
            setPrograms(data);
        } catch (error) {
            console.error("Failed to fetch programs", error);
        }
    };

    const fetchFeedbacks = async () => {
        try {
            setIsLoading(true);
            const params = { keyword: searchTerm };
            if (selectedProgram) params.programId = selectedProgram;

            const { data } = await api.get('/feedback/admin/default', { params });
            setFeedbacks(data);
        } catch (error) {
            console.error("Failed to fetch feedbacks", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleExport = async () => {
        try {
            const params = {};
            if (selectedProgram) params.programId = selectedProgram;

            const response = await api.get('/feedback/admin/default/export', {
                params,
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'student-feedbacks.csv');
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error("Export failed", error);
            alert("Failed to export");
        }
    };

    const copyPublicLink = () => {
        navigator.clipboard.writeText(`${window.location.origin}/feedback/public`);
        alert("Public Feedback Link copied to clipboard!");
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-secondary">Student Feedbacks</h1>
                    <p className="text-gray-500 text-sm">View responses from the Public Feedback form.</p>
                </div>

                <div className="flex gap-2">
                    <Button variant="outline" onClick={copyPublicLink} className="gap-2 bg-white border-gray-300 text-gray-700 hover:bg-gray-50">
                        <Icons.Link size={18} /> Copy Public Link
                    </Button>
                    <Button onClick={handleExport} className="gap-2">
                        <Icons.Download size={18} /> Export CSV
                    </Button>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4">
                <div className="relative flex-grow">
                    <Icons.Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search by name, email, or feedback content..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    />
                </div>
                <div className="w-full md:w-64">
                    <select
                        value={selectedProgram}
                        onChange={(e) => setSelectedProgram(e.target.value)}
                        className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    >
                        <option value="">All Programs</option>
                        {programs.map(p => (
                            <option key={p._id} value={p._id}>{p.title} ({p.type})</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Table */}
            <AdminTable headers={['Student', 'Program', 'Feedback', 'Date', 'Type']}>
                {feedbacks.length > 0 ? (
                    feedbacks.map((fb) => (
                        <tr key={fb._id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4">
                                <div className="font-medium text-gray-900">{fb.name}</div>
                                <div className="text-xs text-gray-500">{fb.email}</div>
                            </td>
                            <td className="px-6 py-4">
                                <div className="text-sm text-gray-700 max-w-[200px] truncate" title={fb.programId?.title}>
                                    {fb.programId?.title || 'Unknown Program'}
                                </div>
                            </td>
                            <td className="px-6 py-4">
                                <div className="text-sm text-gray-600 max-w-[300px] truncate" title={fb.feedback}>
                                    {fb.feedback}
                                </div>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500">
                                {new Date(fb.submittedAt).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4">
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                    {fb.inspireId === 'Public' ? 'Public' : 'Student'}
                                </span>
                            </td>
                        </tr>
                    ))
                ) : (
                    <tr>
                        <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                            No feedbacks found.
                        </td>
                    </tr>
                )}
            </AdminTable>
        </div>
    );
}
