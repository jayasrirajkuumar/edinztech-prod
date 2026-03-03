import { useState, useEffect } from 'react';
import { formatDateTime } from '../lib/dateUtils';
import { Icons } from '../components/icons';
import Button from '../components/ui/Button';
import { getMyQuizzes } from '../lib/api';
import { Link } from 'react-router-dom';

export default function DashboardQuizzes() {
    const [quizzes, setQuizzes] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchQuizzes = async () => {
            try {
                const data = await getMyQuizzes();
                console.log("Fetched Quizzes:", data);
                if (Array.isArray(data)) {
                    setQuizzes(data);
                } else {
                    console.error("Quizzes data is not an array:", data);
                    setQuizzes([]);
                }
            } catch (error) {
                console.error("Failed to load quizzes", error);
            } finally {
                setLoading(false);
            }
        };

        fetchQuizzes();
    }, []);

    // Helper to determine status based on time
    const getQuizStatus = (quiz) => {
        const now = new Date();
        const start = quiz.startTime ? new Date(quiz.startTime) : null;
        const end = quiz.endTime ? new Date(quiz.endTime) : null;

        if (start && now < start) return 'Scheduled';
        if (end && now > end) return 'Closed';
        return 'Available';
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center gap-2 mb-2">
                <Icons.Quiz className="text-secondary bg-orange-50 p-1.5 rounded-lg w-10 h-10" />
                <div>
                    <h1 className="text-2xl font-bold text-secondary">Quizzes & Assessments</h1>
                    <p className="text-sm text-gray-500">Assessments for your enrolled programs.</p>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center p-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
            ) : quizzes.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-xl border border-dashed border-gray-300">
                    <Icons.Quiz className="mx-auto h-16 w-16 text-gray-300 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900">No quizzes available</h3>
                    <p className="text-gray-500 max-w-sm mx-auto mt-2">
                        You don't have any pending quizzes at the moment. Check back later!
                    </p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {quizzes.map(quiz => {
                        const status = getQuizStatus(quiz);
                        return (
                            <div key={quiz._id} className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-xs font-semibold text-primary uppercase tracking-wider">
                                                {quiz.program?.title || 'Program Quiz'}
                                            </span>
                                            {status === 'Scheduled' && (
                                                <span className="bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded-full font-medium">Coming Soon</span>
                                            )}
                                            {status === 'Closed' && (
                                                <span className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full font-medium">Closed</span>
                                            )}
                                            {status === 'Available' && (
                                                <span className="bg-green-50 text-green-700 text-xs px-2 py-0.5 rounded-full font-medium flex items-center gap-1 animate-pulse">
                                                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                                                    Live Now
                                                </span>
                                            )}
                                        </div>
                                        <h3 className="text-xl font-bold text-secondary mb-2">{quiz.title}</h3>
                                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                                            <div className="flex items-center gap-1">
                                                <Icons.HelpCircle size={14} />
                                                <span>{quiz.questions?.length} Questions</span>
                                            </div>
                                            {quiz.startTime && (
                                                <div className="flex items-center gap-1">
                                                    <Icons.Date size={14} />
                                                    <span>Start: {formatDateTime(quiz.startTime)}</span>
                                                </div>
                                            )}
                                            {quiz.endTime && (
                                                <div className="flex items-center gap-1">
                                                    <Icons.Date size={14} />
                                                    <span>End: {formatDateTime(quiz.endTime)}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div>
                                        {quiz.isAttempted ? (
                                            <Link to={`/dashboard/quizzes/${quiz._id}`}>
                                                <Button variant="outline" className="w-full md:w-auto text-orange-600 border-orange-200 bg-orange-50 hover:bg-orange-100">
                                                    View Submission <Icons.ChevronRight size={18} className="ml-1" />
                                                </Button>
                                            </Link>
                                        ) : status === 'Available' ? (
                                            <Link to={`/dashboard/quizzes/${quiz._id}`}>
                                                <Button size="lg" className="w-full md:w-auto shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all">
                                                    {quiz.questions?.some(q => q.type === 'file_upload') ? 'Start Assignment' : 'Start Quiz'}
                                                    <Icons.ChevronRight size={18} className="ml-1" />
                                                </Button>
                                            </Link>
                                        ) : (
                                            <Button disabled variant="outline" className="w-full md:w-auto opacity-50 cursor-not-allowed">
                                                {status === 'Scheduled' ? 'Not Started' : 'Expired'}
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
