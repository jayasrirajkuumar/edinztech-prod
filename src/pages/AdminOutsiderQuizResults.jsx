import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getOutsiderQuizResults, getOutsiderQuizAdmin } from '../lib/api';
import AdminTable from '../components/AdminTable';
import { Icons } from '../components/icons';

export default function AdminOutsiderQuizResults() {
    const { id } = useParams();
    const [results, setResults] = useState([]);
    const [quiz, setQuiz] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            try {
                const [q, r] = await Promise.all([
                    getOutsiderQuizAdmin(id),
                    getOutsiderQuizResults(id)
                ]);
                setQuiz(q);
                setResults(r);
            } catch (error) {
                console.error("Failed to load results", error);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [id]);

    const handleExport = () => {
        // Simple CSV Export logic can be added here similar to Feedbacks
        const csvContent = "data:text/csv;charset=utf-8,"
            + "Name,Email,Phone,College,Education,Score,Total,Date\n"
            + results.map(r => `${r.userDetails?.name},${r.userDetails?.email},${r.userDetails?.phone},${r.userDetails?.college},${r.userDetails?.education},${r.score},${r.totalMaxScore},${new Date(r.attemptedAt || r.createdAt).toISOString()}`).join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `quiz_results_${id}.csv`);
        document.body.appendChild(link);
        link.click();
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                        <Link to="/admin/outsider-quizzes" className="hover:underline">Outsider Quizzes</Link>
                        <Icons.ChevronRight size={14} />
                        <span>Results</span>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">{quiz?.title} - Results</h1>
                </div>
                <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2 border rounded-md hover:bg-gray-50">
                    <Icons.Download size={18} /> Export CSV
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-lg border shadow-sm">
                    <div className="text-sm text-gray-500">Total Attempts</div>
                    <div className="text-2xl font-bold">{results.length}</div>
                </div>
                <div className="bg-white p-4 rounded-lg border shadow-sm">
                    <div className="text-sm text-gray-500">Avg Score</div>
                    <div className="text-2xl font-bold">
                        {results.length > 0 ? (results.reduce((acc, curr) => acc + curr.score, 0) / results.length).toFixed(1) : 0}
                    </div>
                </div>
            </div>

            <AdminTable headers={['Student Name', 'Email', 'Phone', 'College', 'Education', 'Score', 'Submitted At']}>
                {results.length > 0 ? (
                    results.map((res) => (
                        <tr key={res._id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 font-medium text-gray-900">{res.userDetails?.name}</td>
                            <td className="px-6 py-4 text-gray-500">{res.userDetails?.email}</td>
                            <td className="px-6 py-4 text-gray-500">{res.userDetails?.phone}</td>
                            <td className="px-6 py-4 text-gray-500">{res.userDetails?.college}</td>
                            <td className="px-6 py-4 text-gray-500">{res.userDetails?.education}</td>
                            <td className="px-6 py-4 font-bold text-gray-900">
                                {res.score.toFixed(1)} / {res.totalMaxScore || quiz?.questions.reduce((a, b) => a + b.marks, 0)}
                            </td>
                            <td className="px-6 py-4 text-gray-500 text-sm">
                                {new Date(res.attemptedAt || res.createdAt).toLocaleString()}
                            </td>
                        </tr>
                    ))
                ) : (
                    <tr>
                        <td colSpan="7" className="px-6 py-8 text-center text-gray-500">No attempts yet.</td>
                    </tr>
                )}
            </AdminTable>
        </div>
    );
}
