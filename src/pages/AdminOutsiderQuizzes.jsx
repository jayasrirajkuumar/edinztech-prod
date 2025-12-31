import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Icons } from '../components/icons';
import Button from '../components/ui/Button';
import AdminTable from '../components/AdminTable';
import { getOutsiderQuizzes, updateOutsiderQuiz } from '../lib/api';

export default function AdminOutsiderQuizzes() {
    const [quizzes, setQuizzes] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchQuizzes();
    }, []);

    const fetchQuizzes = async () => {
        try {
            setIsLoading(true);
            const data = await getOutsiderQuizzes();
            setQuizzes(data);
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const copyLink = (id) => {
        const url = `${window.location.origin}/quiz/public/${id}`;
        navigator.clipboard.writeText(url);
        alert('Public Quiz Link copied to clipboard!');
    };

    const toggleStatus = async (quiz) => {
        try {
            await updateOutsiderQuiz(quiz._id, { isActive: !quiz.isActive });
            fetchQuizzes(); // Refresh
        } catch (error) {
            alert('Failed to update status');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Outsider Quizzes</h1>
                    <p className="text-gray-500">Manage public quizzes for external participants</p>
                </div>
                <Link to="/admin/outsider-quizzes/new">
                    <Button className="gap-2">
                        <Icons.Plus size={18} /> Create Quiz
                    </Button>
                </Link>
            </div>

            <AdminTable headers={['Title', 'Questions', 'Status', 'Cert Template', 'Created At', 'Actions']}>
                {quizzes.length > 0 ? (
                    quizzes.map((quiz) => (
                        <tr key={quiz._id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 font-medium text-gray-900">
                                {quiz.title}
                                <div className="text-xs text-gray-500 font-normal truncate max-w-xs">{quiz.description}</div>
                            </td>
                            <td className="px-6 py-4 text-gray-500">
                                {quiz.questions?.length || 0}
                            </td>
                            <td className="px-6 py-4">
                                <span className={`px-2 py-1 rounded text-xs font-semibold ${quiz.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                    {quiz.isActive ? 'Active' : 'Inactive'}
                                </span>
                            </td>
                            <td className="px-6 py-4 text-gray-500 text-xs">
                                {quiz.certificateTemplate ? 'Has Template' : 'Default'}
                            </td>
                            <td className="px-6 py-4 text-gray-500">
                                {new Date(quiz.createdAt).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4">
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => copyLink(quiz._id)}
                                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                                        title="Copy Public Link"
                                    >
                                        <Icons.Link size={18} />
                                    </button>
                                    <Link to={`/admin/outsider-quizzes/${quiz._id}/results`} className="text-green-600 hover:text-green-800" title="View Results">
                                        <Icons.BarChart size={18} />
                                    </Link>
                                    <Link to={`/admin/outsider-quizzes/${quiz._id}/edit`} className="text-gray-600 hover:text-gray-800" title="Edit">
                                        <Icons.Edit size={18} />
                                    </Link>
                                    <button
                                        onClick={() => toggleStatus(quiz)}
                                        className={`${quiz.isActive ? 'text-red-500' : 'text-green-500'}`}
                                        title={quiz.isActive ? 'Deactivate' : 'Activate'}
                                    >
                                        <Icons.Power size={18} />
                                        {/* Assuming Power icon exists or use generic */}
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))
                ) : (
                    <tr>
                        <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                            No quizzes found. Create one to get started.
                        </td>
                    </tr>
                )}
            </AdminTable>
        </div>
    );
}
