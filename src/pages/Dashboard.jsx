import { useState, useEffect } from 'react';
import { getDashboardOverview } from '../lib/api';
import { Link } from 'react-router-dom';
import { Icons } from '../components/icons';
import Card from '../components/ui/Card';

export default function Dashboard() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadDashboard = async () => {
            try {
                const res = await getDashboardOverview();
                setData(res);
            } catch (error) {
                console.error("Failed to load dashboard", error);
            } finally {
                setLoading(false);
            }
        };
        loadDashboard();
    }, []);

    if (loading) return <div className="p-8 text-center">Loading dashboard...</div>;

    if (!data || !data.programs || data.programs.length === 0) {
        return (
            <div className="p-8 max-w-4xl mx-auto text-center">
                <h1 className="text-3xl font-bold mb-4">Welcome, {data?.user?.name || 'Student'}</h1>
                <Card className="p-12">
                    <Icons.BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h2 className="text-xl font-semibold mb-2">Not Enrolled Yet</h2>
                    <p className="text-gray-600 mb-6">You are not enrolled in any active programs.</p>
                    <Link to="/courses" className="bg-primary text-white px-6 py-2 rounded-lg">Browse Courses</Link>
                </Card>
            </div>
        );
    }

    return (
        <div className="p-8 max-w-6xl mx-auto">
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-gray-800">My Dashboard</h1>
                <p className="text-gray-600">Welcome back, {data.user.name}</p>
            </header>

            <div className="space-y-12">
                {/* Ongoing Section */}
                <div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                        <Icons.Clock className="text-primary" />
                        Ongoing Programs
                    </h2>
                    {data.programs.filter(p => p.enrollmentStatus === 'active').length > 0 ? (
                        <div className="space-y-8">
                            {data.programs.filter(p => p.enrollmentStatus === 'active').map((prog) => (
                                <Card key={prog.programId} className="border-l-4 border-l-primary overflow-hidden">
                                    <div className="p-6">
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <span className={`text-xs font-bold px-2 py-1 rounded-full uppercase tracking-wider mb-2 inline-block
                                                    ${prog.type === 'Internship' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`}>
                                                    {prog.type}
                                                </span>
                                                <h2 className="text-2xl font-bold text-gray-900">{prog.title}</h2>
                                                <p className="text-sm text-gray-500">
                                                    Status: <span className="capitalize font-medium text-green-600">{prog.enrollmentStatus}</span> •
                                                    Valid until: {new Date(prog.validUntil).toLocaleDateString()}
                                                </p>

                                                {/* Progress Bar */}
                                                <div className="mt-4 w-full md:w-96">
                                                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                                                        <span>Start: {new Date(prog.startDate).toLocaleDateString()}</span>
                                                        <span>End: {new Date(prog.validUntil).toLocaleDateString()}</span>
                                                    </div>
                                                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                                                        <div
                                                            className="bg-primary h-2.5 rounded-full transition-all duration-1000"
                                                            style={{
                                                                width: `${(() => {
                                                                    const start = new Date(prog.startDate).getTime();
                                                                    const end = new Date(prog.validUntil).getTime();
                                                                    const now = new Date().getTime();
                                                                    if (now < start) return 0;
                                                                    if (now > end) return 100;
                                                                    if (end === start) return 100;
                                                                    return Math.round(((now - start) / (end - start)) * 100);
                                                                })()}%`
                                                            }}
                                                        ></div>
                                                    </div>
                                                    <div className="text-right text-xs text-primary font-medium mt-1">
                                                        {(() => {
                                                            const start = new Date(prog.startDate).getTime();
                                                            const end = new Date(prog.validUntil).getTime();
                                                            const now = new Date().getTime();
                                                            if (now < start) return 'Starting Soon';
                                                            if (now > end) return 'Completed';
                                                            if (end === start) return '100%';
                                                            return `${Math.round(((now - start) / (end - start)) * 100)}% Complete`;
                                                        })()}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid md:grid-cols-2 gap-6 mt-6">
                                            {/* Quizzes Section */}
                                            <div className="bg-gray-50 rounded-lg p-4">
                                                <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                                                    <Icons.Quiz size={18} /> Quizzes ({prog.quizzes.length})
                                                </h3>
                                                {prog.quizzes.length > 0 ? (
                                                    <ul className="space-y-2">
                                                        {prog.quizzes.map(q => (
                                                            <li key={q._id} className="bg-white p-3 rounded shadow-sm border border-gray-100 flex justify-between items-center">
                                                                <div>
                                                                    <p className="font-medium text-sm">{q.title}</p>
                                                                    <p className="text-xs text-gray-500">Due: {new Date(q.endTime).toLocaleDateString()}</p>
                                                                </div>
                                                                <Link to={`/dashboard/quizzes`} className="text-xs bg-primary text-white px-2 py-1 rounded hover:bg-primary/90">
                                                                    Attempt
                                                                </Link>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                ) : (
                                                    <p className="text-sm text-gray-400 italic">No active quizzes.</p>
                                                )}
                                            </div>

                                            {/* Feedback Section */}
                                            <div className="bg-gray-50 rounded-lg p-4">
                                                <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                                                    <Icons.MessageSquare size={18} /> Feedback
                                                </h3>
                                                {prog.feedbacks && prog.feedbacks.length > 0 ? (
                                                    <ul className="space-y-2">
                                                        {prog.feedbacks.map(f => (
                                                            <li key={f._id} className="bg-white p-3 rounded shadow-sm border border-gray-100 flex justify-between items-center">
                                                                <p className="font-medium text-sm">{f.title}</p>
                                                                <Link
                                                                    to={f.isDefault ? '/dashboard/feedbacks' : `/dashboard/feedbacks/${f._id}`}
                                                                    className="text-xs bg-secondary text-white px-2 py-1 rounded hover:bg-secondary/90"
                                                                >
                                                                    Give Feedback
                                                                </Link>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                ) : (
                                                    <p className="text-sm text-gray-400 italic">No pending feedback.</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center p-8 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                            <p className="text-gray-500">No ongoing programs.</p>
                            <Link to="/courses" className="text-primary hover:underline mt-2 inline-block">Browse Courses</Link>
                        </div>
                    )}
                </div>

                {/* Previous Section */}
                {data.programs.filter(p => p.enrollmentStatus !== 'active').length > 0 && (
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2 mt-8">
                            <Icons.Award className="text-gray-400" />
                            Previous Programs
                        </h2>
                        <div className="space-y-6 opacity-75 hover:opacity-100 transition-opacity">
                            {data.programs.filter(p => p.enrollmentStatus !== 'active').map((prog) => (
                                <Card key={prog.programId} className="bg-gray-50">
                                    <div className="p-6">
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <h2 className="text-xl font-bold text-gray-700">{prog.title}</h2>
                                                <p className="text-sm text-gray-500">
                                                    Status: <span className="capitalize font-medium">{prog.enrollmentStatus}</span>
                                                </p>
                                            </div>
                                            {prog.enrollmentStatus === 'completed' && (
                                                <Link to="/dashboard/certificates" className="text-sm bg-white border border-gray-200 text-gray-700 px-3 py-2 rounded hover:bg-gray-50 flex items-center gap-2">
                                                    <Icons.Award size={16} /> View Certificate
                                                </Link>
                                            )}
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}