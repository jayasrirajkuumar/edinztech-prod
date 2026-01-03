import { useState, useEffect } from 'react';
import { Icons } from '../icons';
import Button from '../ui/Button';
import { getQuizzesByProgram, deleteQuiz, publishQuiz, unpublishQuiz } from '../../lib/api';
import QuizForm from '../forms/QuizForm';
import { formatDate, formatDateTime } from '../../lib/dateUtils';

export default function QuizList({ programId }) {
    const [quizzes, setQuizzes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [editingQuiz, setEditingQuiz] = useState(null);

    useEffect(() => {
        fetchQuizzes();
    }, [programId]);

    const fetchQuizzes = async () => {
        try {
            setLoading(true);
            const data = await getQuizzesByProgram(programId);
            setQuizzes(data);
        } catch (error) {
            console.error("Failed to load quizzes", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this quiz?")) return;
        try {
            await deleteQuiz(id);
            // Optimistic update or refetch
            setQuizzes(prev => prev.filter(q => q._id !== id));
        } catch (error) {
            console.error("Failed to delete quiz", error);
            alert("Failed to delete quiz");
        }
    };

    const handleTogglePublish = async (quiz) => {
        try {
            if (quiz.status === 'Published') {
                await unpublishQuiz(quiz._id);
            } else {
                await publishQuiz(quiz._id);
            }
            fetchQuizzes(); // Refetch to get updated status
        } catch (error) {
            console.error("Failed to toggle publish status", error);
            alert("Failed to update status: " + (error.response?.data?.message || "Unknown error"));
        }
    };

    const handleFormSubmit = () => {
        setIsCreating(false);
        setEditingQuiz(null);
        fetchQuizzes();
    };

    if (isCreating || editingQuiz) {
        return (
            <div className="bg-white p-6 rounded-xl border border-gray-100">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-secondary">
                        {editingQuiz ? 'Edit Quiz' : 'Create New Quiz'}
                    </h3>
                    <Button variant="outline" onClick={() => { setIsCreating(false); setEditingQuiz(null); }}>
                        Cancel
                    </Button>
                </div>
                <QuizForm
                    programId={programId}
                    defaultValues={editingQuiz}
                    onSubmit={handleFormSubmit}
                    isEditing={!!editingQuiz}
                />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-secondary">Program Quizzes</h3>
                <Button onClick={() => setIsCreating(true)} className="flex items-center gap-2">
                    <Icons.Plus size={18} />
                    Add Quiz
                </Button>
            </div>

            {loading ? (
                <div className="flex justify-center p-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
            ) : quizzes.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                    <Icons.Quiz className="mx-auto h-12 w-12 text-gray-400 mb-3" />
                    <p className="text-gray-500">No quizzes created for this program yet.</p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {quizzes.map(quiz => (
                        <div key={quiz._id} className="bg-white p-4 rounded-xl border border-gray-100 flex justify-between items-center hover:shadow-sm transition-shadow">
                            <div>
                                <h4 className="font-bold text-secondary">{quiz.title}</h4>
                                <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                                    <span>{quiz.questions?.length || 0} Questions</span>
                                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${quiz.status === 'Published' ? 'bg-green-50 text-success' : 'bg-gray-100 text-gray-500'
                                        }`}>
                                        {quiz.status}
                                    </span>
                                    {quiz.startTime && (
                                        <span className="flex items-center gap-1">
                                            <Icons.Date size={12} />
                                            {formatDateTime(quiz.startTime)}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleTogglePublish(quiz)}
                                    className={quiz.status === 'Published' ? 'text-orange-600 border-orange-200 hover:bg-orange-50' : 'text-green-600 border-green-200 hover:bg-green-50'}
                                >
                                    {quiz.status === 'Published' ? 'Unpublish' : 'Publish'}
                                </Button>
                                <button
                                    onClick={() => setEditingQuiz(quiz)}
                                    className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                                    title="Edit"
                                >
                                    <Icons.Edit size={18} />
                                </button>
                                <button
                                    onClick={() => handleDelete(quiz._id)}
                                    className="p-2 text-gray-400 hover:text-danger transition-colors"
                                    title="Delete"
                                >
                                    <Icons.Trash size={18} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
