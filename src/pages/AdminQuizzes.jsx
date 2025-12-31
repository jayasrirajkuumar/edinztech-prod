import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Icons } from '../components/icons';
import Button from '../components/ui/Button';
import { getAllQuizzes, deleteQuiz, publishQuiz, unpublishQuiz } from '../lib/api';

export default function AdminQuizzes() {
    const [quizzes, setQuizzes] = useState([]);
    const [loading, setLoading] = useState(true);

    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('All');

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchQuizzes();
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm, filterStatus]);

    const fetchQuizzes = async () => {
        try {
            setLoading(true); // Ensure loading state triggered on refresh
            const params = {};
            if (searchTerm) params.keyword = searchTerm;
            if (filterStatus !== 'All') params.status = filterStatus;

            const data = await getAllQuizzes(params);
            setQuizzes(data);
        } catch (error) {
            console.error("Failed to fetch quizzes", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this quiz?")) return;
        try {
            await deleteQuiz(id);
            setQuizzes(quizzes.filter(q => q._id !== id));
        } catch (error) {
            console.error("Failed to delete quiz", error);
            alert("Failed to delete quiz");
        }
    }; // Close handleDelete properly

    const handleTogglePublish = async (quiz) => {
        try {
            if (quiz.status === 'Published') { // Assuming 'Published' is the status string
                if (!window.confirm("Unpublish this quiz? Students won't be able to see it.")) return;
                await unpublishQuiz(quiz._id);
            } else {
                await publishQuiz(quiz._id);
            }
            // Update local state
            // Refresh entire list to ensure DB consistency status
            await fetchQuizzes();
            // Optional: alert user
            // alert(`Quiz ${quiz.status === 'Published' ? 'Unpublished' : 'Published'} successfully`);
        } catch (error) {
            console.error("Failed to toggle publish status", error);
            const msg = error.response?.data?.message || "Failed to update quiz status";
            alert(msg);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* ... existing header ... */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                    <Icons.Quiz className="text-secondary bg-orange-50 p-1.5 rounded-lg w-10 h-10" />
                    <div>
                        <h1 className="text-2xl font-bold text-secondary">Quiz Management</h1>
                        <p className="text-sm text-gray-500">Create and manage assessments for programs.</p>
                    </div>
                </div>
                <Link to="/admin/quizzes/new">
                    <Button className="flex items-center gap-2">
                        <Icons.Plus size={18} />
                        Create Quiz
                    </Button>
                </Link>
            </div>

            {loading ? (
                <div className="flex justify-center p-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
            ) : quizzes.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
                    <Icons.Quiz className="mx-auto h-12 w-12 text-gray-400 mb-3" />
                    <h3 className="text-lg font-medium text-gray-900">No quizzes found</h3>
                    <p className="text-gray-500 mb-4">Get started by creating a new quiz.</p>
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Quiz Title</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Program</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Questions</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Status</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {quizzes.map(quiz => (
                                <tr key={quiz._id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 font-medium text-gray-900">{quiz.title}</td>
                                    <td className="px-6 py-4 text-sm text-gray-500">
                                        {quiz.program?.title || 'Unknown Program'}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500 text-center w-24 bg-gray-50 rounded-lg">
                                        {quiz.questions?.length || 0}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${quiz.status === 'Published' ? 'bg-green-50 text-success' : 'bg-gray-100 text-gray-500'
                                            }`}>
                                            {quiz.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            {/* Publish Toggle */}
                                            <button
                                                onClick={() => handleTogglePublish(quiz)}
                                                className={`p-2 transition-colors ${quiz.status === 'Published' ? 'text-green-600 hover:text-green-800' : 'text-gray-400 hover:text-green-600'}`}
                                                title={quiz.status === 'Published' ? "Unpublish" : "Publish"}
                                            >
                                                <Icons.Rocket size={18} />
                                            </button>

                                            <Link
                                                to={`/admin/quizzes/${quiz._id}/reports`}
                                                className="p-2 text-gray-400 hover:text-primary transition-colors"
                                                title="View Reports"
                                            >
                                                <Icons.FileText size={18} />
                                            </Link>
                                            <Link
                                                to={`/admin/quizzes/${quiz._id}/edit`}
                                                className="p-2 text-gray-400 hover:text-blue-500 transition-colors"
                                                title="Edit Quiz"
                                            >
                                                <Icons.Edit size={18} />
                                            </Link>
                                            <button
                                                onClick={() => handleDelete(quiz._id)}
                                                className="p-2 text-gray-400 hover:text-danger transition-colors"
                                                title="Delete"
                                            >
                                                <Icons.Trash size={18} />
                                            </button>
                                        </div>
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
