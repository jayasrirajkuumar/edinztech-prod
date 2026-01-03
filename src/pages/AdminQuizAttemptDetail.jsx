import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getQuizAttempt } from '../lib/api';
import { Icons } from '../components/icons';
import Button from '../components/ui/Button';

export default function AdminQuizAttemptDetail() {
    const { id } = useParams(); // attemptId
    const [attempt, setAttempt] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAttempt = async () => {
            try {
                const data = await getQuizAttempt(id);
                setAttempt(data);
            } catch (error) {
                console.error("Failed to load attempt", error);
            } finally {
                setLoading(false);
            }
        };
        fetchAttempt();
    }, [id]);

    if (loading) return <div className="p-12 text-center">Loading assessment data...</div>;
    if (!attempt) return <div className="p-12 text-center">Assessment records not found.</div>;

    const { quiz, user, answers } = attempt;

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link to={`/admin/quizzes/${quiz._id}/reports`} className="text-gray-500 hover:text-gray-700">
                        <Icons.ArrowLeft size={24} />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-secondary">Assessment Result</h1>
                        <p className="text-sm text-gray-500">
                            Student: <span className="font-semibold text-gray-900">{user?.name}</span> ({user?.email})
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className={`px-4 py-2 rounded-lg font-bold text-lg ${attempt.passed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>
                        Score: {Math.round(attempt.score)}%
                    </div>
                </div>
            </div>

            {/* Questions Review */}
            <div className="space-y-6">
                {quiz.questions.map((q, index) => {
                    const studentAnswer = answers.find(a =>
                        a.questionId === q._id ||
                        // Fallback logic in case IDs are string vs objectId mismatch
                        a.questionId?.toString() === q._id?.toString()
                    );

                    const isMCQ = q.type === 'mcq';

                    // For MCQ, we can auto-verify
                    const studentOptionIndex = studentAnswer ? parseInt(studentAnswer.selectedOption) : -1;
                    const isCorrect = isMCQ && studentOptionIndex === q.correctOption;

                    return (
                        <div key={q._id} className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm relative">
                            <div className="absolute top-6 right-6 text-sm font-semibold text-gray-400">
                                {q.marks} Marks
                            </div>

                            <div className="mb-4 pr-12">
                                <span className="text-gray-400 font-bold mr-2">Q{index + 1}.</span>
                                <span className="font-medium text-lg text-secondary">{q.question}</span>
                            </div>

                            {q.image && (
                                <div className="mb-4 ml-8">
                                    <img src={q.image} alt="Question Reference" className="max-w-md rounded-lg border border-gray-200" />
                                </div>
                            )}

                            <div className="ml-8 space-y-3">
                                {isMCQ ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {q.options?.map((opt, optIdx) => {
                                            let optionClass = "p-3 border rounded-lg flex items-center gap-3 ";

                                            // Logic for highlighting
                                            if (optIdx === q.correctOption) {
                                                optionClass += "bg-green-50 border-green-200 text-green-800"; // Correct Answer
                                            } else if (optIdx === studentOptionIndex && !isCorrect) {
                                                optionClass += "bg-red-50 border-red-200 text-red-800"; // Wrong Selection
                                            } else if (optIdx === studentOptionIndex && isCorrect) {
                                                optionClass += "bg-green-50 border-green-200 text-green-800"; // Correct Selection (covered above but explicit)
                                            } else {
                                                optionClass += "bg-white border-gray-200 text-gray-600";
                                            }

                                            return (
                                                <div key={optIdx} className={optionClass}>
                                                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${optIdx === studentOptionIndex ? 'border-current' : 'border-gray-300'
                                                        }`}>
                                                        {optIdx === studentOptionIndex && <div className="w-2 h-2 rounded-full bg-current" />}
                                                    </div>
                                                    {opt}
                                                    {optIdx === q.correctOption && <Icons.CheckCircle size={16} className="ml-auto text-green-600" />}
                                                    {optIdx === studentOptionIndex && !isCorrect && <Icons.X size={16} className="ml-auto text-red-500" />}
                                                </div>
                                            )
                                        })}
                                    </div>
                                ) : q.type === 'file_upload' ? (
                                    <div className="space-y-4">
                                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                            <div className="text-xs font-semibold text-gray-400 uppercase mb-1">Student Upload</div>
                                            {studentAnswer?.textAnswer ? (
                                                <div className="flex items-center gap-3">
                                                    <Icons.File className="text-blue-500 w-8 h-8" />
                                                    <div className="flex-1 overflow-hidden">
                                                        <a
                                                            href={`http://localhost:5000${studentAnswer.textAnswer}`}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="text-blue-600 hover:underline font-medium break-all block"
                                                        >
                                                            {studentAnswer.textAnswer.split('/').pop()}
                                                        </a>
                                                        <p className="text-xs text-gray-400 mt-1">Click to view/download file</p>
                                                    </div>
                                                </div>
                                            ) : (
                                                <span className="italic text-gray-400">No file uploaded</span>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                            <div className="text-xs font-semibold text-gray-400 uppercase mb-1">Student Answer</div>
                                            <p className="text-gray-800 whitespace-pre-wrap">
                                                {studentAnswer?.textAnswer || <span className="italic text-gray-400">No answer provided</span>}
                                            </p>
                                        </div>
                                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                                            <div className="text-xs font-semibold text-blue-400 uppercase mb-1">Reference Answer</div>
                                            <p className="text-blue-800 whitespace-pre-wrap">
                                                {q.correctAnswer || "No reference answer provided."}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
