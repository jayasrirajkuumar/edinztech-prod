import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getDashboardOverview } from '../lib/api';
import { formatDate, formatDateTime } from '../lib/dateUtils';
import { Icons } from '../components/icons';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';

export default function DashboardProgramDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [prog, setProg] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const loadProgram = async () => {
            try {
                const res = await getDashboardOverview();
                const foundProgram = res.programs.find(p => p.programId === id);
                if (foundProgram) {
                    setProg(foundProgram);
                } else {
                    setError('Program not found or not enrolled.');
                }
            } catch (err) {
                console.error("Failed to load program details", err);
                setError('Failed to load program details.');
            } finally {
                setLoading(false);
            }
        };
        loadProgram();
    }, [id]);

    if (loading) return <div className="p-8 text-center text-gray-500">Loading program details...</div>;
    if (error) return <div className="p-8 text-center text-red-500">{error}</div>;
    if (!prog) return null;

    return (
        <div className="p-8 max-w-4xl mx-auto">
            <button
                onClick={() => navigate(-1)}
                className="mb-6 flex items-center text-sm font-medium text-gray-600 hover:text-primary transition-colors focus:outline-none"
            >
                <Icons.ArrowLeft size={16} className="mr-2" /> Back
            </button>

            <Card className="border-t-4 border-t-primary overflow-hidden shadow-lg">
                <div className="p-6 md:p-8">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <span className={`text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-2 inline-block
                                ${prog.type === 'Internship' ? 'bg-indigo-50 text-indigo-700' : 'bg-blue-50 text-blue-700'}`}>
                                {prog.type}
                            </span>
                            <h1 className="text-3xl font-extrabold text-gray-900 mt-2">{prog.title}</h1>
                            <p className="text-sm text-gray-500 mt-1">
                                Status: <span className="capitalize font-medium text-green-600">{prog.enrollmentStatus}</span>
                            </p>
                        </div>
                        {prog.enrollmentStatus === 'completed' && (
                            <Link to="/dashboard/certificates">
                                <Button variant="outline" className="flex items-center gap-2 border-green-500 text-green-600 hover:bg-green-50">
                                    <Icons.Award size={18} /> View Certificate
                                </Button>
                            </Link>
                        )}
                    </div>

                    {/* Progress Bar Container */}
                    <div className="bg-gray-50 p-6 rounded-xl border border-gray-100 mb-8">
                        <div className="flex justify-between text-sm text-gray-600 mb-2 font-medium">
                            <span>Start: {formatDate(prog.startDate)}</span>
                            <span>End: {formatDate(prog.validUntil)}</span>
                        </div>
                        <div className="mt-4">
                            <div className="flex justify-between items-center text-xs text-gray-500 mb-2">
                                <span>Timeline Start: {prog.startTime ? formatDateTime(prog.startTime) : 'N/A'}</span>
                                <span>Timeline End: {prog.endTime ? formatDateTime(prog.endTime) : 'N/A'}</span>
                            </div>

                            {(() => {
                                const start = prog.startTime ? new Date(prog.startTime).getTime() : 0;
                                const end = prog.endTime ? new Date(prog.endTime).getTime() : 0;
                                const now = new Date().getTime();
                                let percentage = 0;
                                let colorClass = 'bg-yellow-500';
                                let statusText = 'Ongoing';

                                if (!prog.startTime || !prog.endTime) {
                                    return <span className="text-sm text-gray-400 block mt-2">Flexible Timeline</span>;
                                }

                                if (now < start) {
                                    percentage = 0;
                                    colorClass = 'bg-green-500';
                                    statusText = 'Yet to Start';
                                } else if (now > end || prog.enrollmentStatus === 'completed') {
                                    percentage = 100;
                                    colorClass = 'bg-primary';
                                    statusText = 'Completed';
                                } else {
                                    percentage = Math.round(((now - start) / (end - start)) * 100);
                                    if (percentage < 0) percentage = 0;
                                    if (percentage > 100) percentage = 100;
                                    statusText = `${percentage}% Complete`;
                                }

                                return (
                                    <>
                                        <div className="w-full bg-gray-200 rounded-full h-3 mt-1 overflow-hidden">
                                            <div
                                                className={`${colorClass} h-3 rounded-full transition-all duration-1000`}
                                                style={{ width: `${percentage}%` }}
                                            ></div>
                                        </div>
                                        <p className={`text-right text-sm mt-2 font-bold ${colorClass.replace('bg-', 'text-')}`}>
                                            {statusText}
                                        </p>
                                    </>
                                );
                            })()}
                        </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8">
                        {/* Quizzes Section */}
                        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                            <div className="border-b border-gray-100 pb-4 mb-4 flex justify-between items-center">
                                <h3 className="font-bold text-gray-800 flex items-center gap-2">
                                    <Icons.Rocket className="text-primary" size={20} /> Quizzes
                                </h3>
                                <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full font-bold">
                                    {prog.quizzes?.length || 0}
                                </span>
                            </div>
                            
                            {prog.quizzes && prog.quizzes.length > 0 ? (
                                <ul className="space-y-3">
                                    {prog.quizzes.map(q => (
                                        <li key={q._id} className="bg-gray-50 hover:bg-gray-100 transition-colors p-4 rounded-lg border border-gray-100 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                                            <div>
                                                <p className="font-semibold text-gray-900">{q.title}</p>
                                                <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                                                    <Icons.Clock size={12} /> Due: {formatDateTime(q.endTime) || 'No deadline'}
                                                </p>
                                            </div>
                                            <Link to={`/dashboard/quizzes`} className="shrink-0">
                                                <Button size="sm" variant="primary" className="w-full sm:w-auto">
                                                    Attempt Quiz
                                                </Button>
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <div className="text-center py-6">
                                    <Icons.BookOpen className="mx-auto text-gray-300 mb-2" size={32} />
                                    <p className="text-sm text-gray-500">No active quizzes at the moment.</p>
                                </div>
                            )}
                        </div>

                        {/* Feedback Section */}
                        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                            <div className="border-b border-gray-100 pb-4 mb-4 flex justify-between items-center">
                                <h3 className="font-bold text-gray-800 flex items-center gap-2">
                                    <Icons.MessageSquare className="text-primary" size={20} /> Feedback
                                </h3>
                                <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full font-bold">
                                    {prog.feedbacks?.length || 0}
                                </span>
                            </div>

                            {!prog.enableFeedback ? (
                                <div className="text-center py-6 bg-orange-50 rounded-lg border border-orange-100">
                                    <Icons.Clock className="mx-auto text-orange-400 mb-2" size={24} />
                                    <p className="text-sm text-orange-700 font-medium">Feedback not yet available.</p>
                                </div>
                            ) : prog.feedbacks && prog.feedbacks.length > 0 ? (
                                <ul className="space-y-3">
                                    {prog.feedbacks.map(f => (
                                        <li key={f._id} className="bg-gray-50 p-4 rounded-lg border border-gray-100 flex flex-col gap-3">
                                            <p className="font-semibold text-gray-900">{f.title}</p>
                                            <div className="flex justify-end">
                                                {f.isSubmitted ? (
                                                    <span className="text-sm text-green-600 font-semibold bg-green-50 px-3 py-1.5 rounded-md flex items-center gap-1 border border-green-200">
                                                        <Icons.CheckCircle size={14} /> Submitted
                                                    </span>
                                                ) : (
                                                    <Link to={f.isDefault ? '/dashboard/feedbacks' : `/dashboard/feedbacks/${f._id}`}>
                                                        <Button size="sm" variant="outline" className="w-full sm:w-auto border-secondary text-secondary hover:bg-secondary hover:text-white">
                                                            Give Feedback
                                                        </Button>
                                                    </Link>
                                                )}
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <div className="text-center py-6 text-gray-500 italic text-sm">
                                    No pending feedback requests.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </Card>
        </div>
    );
}
