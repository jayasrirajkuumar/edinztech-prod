import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getQuizReports, getMyQuiz } from '../lib/api'; // getMyQuiz might need admin equivalent, using getMyQuiz for now or need new endpoint
// Actually admin needs specific quiz fetch or just rely on reports including quiz info?
// Let's use getQuizReports and maybe fetch quiz details if needed.
import { Icons } from '../components/icons';
import { formatDate, formatDateTime } from '../lib/dateUtils';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';

export default function AdminQuizReports() {
    const { id } = useParams();
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchReports();
    }, [id]);

    const fetchReports = async () => {
        try {
            const data = await getQuizReports(id);
            setReports(data);
        } catch (error) {
            console.error("Failed to fetch reports", error);
        } finally {
            setLoading(false);
        }
    };

    const handleExport = () => {
        if (!reports.length) return;

        const headers = ["Student Name", "Email", "Score (%)", "Status", "Date"];
        const csvContent = [
            headers.join(","),
            ...reports.map(r => [
                r.user?.name || "Unknown",
                r.user?.email || "",
                r.score ? Math.round(r.score) : 0,
                r.status || (r.passed ? 'Passed' : 'Failed'),
                formatDateTime(r.attemptedAt)
            ].map(e => `"${e}"`).join(","))
        ].join("\n");

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `quiz_report_${id}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link to="/admin/quizzes" className="text-gray-500 hover:text-gray-700">
                        <Icons.ArrowLeft size={24} />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-secondary">Quiz Reports</h1>
                        <p className="text-sm text-gray-500">View student performance and grade text answers.</p>
                    </div>
                </div>
                <Button onClick={handleExport} variant="outline" className="flex items-center gap-2">
                    <Icons.Download size={18} />
                    Export CSV
                </Button>
            </div>

            {loading ? (
                <div className="text-center py-12">Loading...</div>
            ) : reports.length === 0 ? (
                <Card className="p-12 text-center text-gray-500">
                    No attempts found for this quiz yet.
                </Card>
            ) : (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Student</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Email</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Score</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Status</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Date</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {reports.map((attempt) => (
                                <tr key={attempt._id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 font-medium text-gray-900">{attempt.user?.name || 'Unknown'}</td>
                                    <td className="px-6 py-4 text-sm text-gray-500">{attempt.user?.email}</td>
                                    <td className="px-6 py-4 text-sm">
                                        <span className="font-bold">{attempt.score ? Math.round(attempt.score) : 0}%</span>
                                        <span className="text-gray-400 text-xs ml-1">
                                            ({Math.round((attempt.score / 100) * attempt.totalMaxScore)}/{attempt.totalMaxScore})
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${attempt.status === 'Graded' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                                            }`}>
                                            {attempt.status || (attempt.passed ? 'Passed' : 'Failed')}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500">
                                        {formatDateTime(attempt.attemptedAt)}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <Link to={`/admin/quizzes/attempt/${attempt._id}`}>
                                            <Button size="sm" variant="outline">View</Button>
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
