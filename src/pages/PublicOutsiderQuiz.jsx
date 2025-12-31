import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { getPublicOutsiderQuiz, submitPublicOutsiderQuiz } from '../lib/api';
import Navbar from '../components/Navbar'; // Re-use main navbar or specific one? Public pages usually have main navbar.
import Footer from '../components/Footer';

export default function PublicOutsiderQuiz() {
    const { id } = useParams();
    const [quiz, setQuiz] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [step, setStep] = useState('details'); // details, quiz, success
    const [submitting, setSubmitting] = useState(false);
    const [userAnswers, setUserAnswers] = useState({}); // { questionId: option }
    const [userDetails, setUserDetails] = useState(null);

    // Form for User Details
    const { register, handleSubmit, formState: { errors } } = useForm();

    useEffect(() => {
        loadQuiz();
    }, [id]);

    const loadQuiz = async () => {
        try {
            setLoading(true);
            const data = await getPublicOutsiderQuiz(id);
            setQuiz(data);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load quiz');
        } finally {
            setLoading(false);
        }
    };

    const onDetailsSubmit = (data) => {
        setUserDetails(data);
        setStep('quiz');
        window.scrollTo(0, 0);
    };

    const handleOptionSelect = (questionId, option) => {
        setUserAnswers(prev => ({
            ...prev,
            [questionId]: option
        }));
    };

    const submitQuiz = async () => {
        // Validate all answers? Or allow partial? Usually require all.
        const unanswered = quiz.questions.filter(q => !userAnswers[q._id]);
        if (unanswered.length > 0) {
            alert(`Please answer all questions. (${unanswered.length} remaining)`);
            return;
        }

        if (!window.confirm("Are you sure you want to submit?")) return;

        setSubmitting(true);
        try {
            const formattedAnswers = Object.entries(userAnswers).map(([qId, ans]) => ({
                questionId: qId,
                answer: ans
            }));

            const payload = {
                studentName: userDetails.name,
                email: userDetails.email,
                phone: userDetails.phone,
                college: userDetails.college,
                answers: formattedAnswers
            };

            await submitPublicOutsiderQuiz(id, payload);
            setStep('success');
            window.scrollTo(0, 0);
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to submit quiz');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="p-10 text-center">Loading Quiz...</div>;
    if (error) return <div className="p-10 text-center text-red-500">Error: {error}</div>;

    return (
        <div className="min-h-screen flex flex-col bg-gray-50">
            {/* Not using Navbar here to keep it focused or use minimal header? 
               User requested "Outsider Quiz" - usually standalone. 
               But let's include Navbar for branding consistency if desired. 
               Let's include it but maybe simpler. */}
            <div className="bg-white shadow py-4 px-6 mb-4">
                <div className="max-w-4xl mx-auto flex justify-between items-center">
                    <img src="/logo.png" alt="Logo" className="h-10" />
                    <h1 className="text-xl font-bold text-gray-800">{quiz.title}</h1>
                </div>
            </div>

            <main className="flex-grow container mx-auto px-4 py-8 max-w-3xl">

                {step === 'details' && (
                    <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
                        <div className="text-center mb-8">
                            <h2 className="text-2xl font-bold text-gray-900">Welcome!</h2>
                            <p className="text-gray-600 mt-2">{quiz.description}</p>
                            <div className="mt-4 flex justify-center gap-4 text-sm text-gray-500">
                                <span>Questions: {quiz.questions.length}</span>
                                {quiz.timeLimit > 0 && <span>Time Limit: {quiz.timeLimit} mins</span>}
                            </div>
                        </div>

                        <form onSubmit={handleSubmit(onDetailsSubmit)} className="space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Full Name</label>
                                <input
                                    {...register("name", { required: "Name is required" })}
                                    className="mt-1 w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="Enter your full name"
                                />
                                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">Email Address</label>
                                <input
                                    {...register("email", {
                                        required: "Email is required",
                                        pattern: { value: /^\S+@\S+$/i, message: "Invalid email" }
                                    })}
                                    className="mt-1 w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="For certificate delivery"
                                />
                                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">Phone Number</label>
                                <input
                                    {...register("phone", { required: "Phone is required" })}
                                    className="mt-1 w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="Your contact number"
                                />
                                {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">College / Organization</label>
                                <input
                                    {...register("college", { required: "College/Organization is required" })}
                                    className="mt-1 w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="Where do you study or work?"
                                />
                                {errors.college && <p className="text-red-500 text-xs mt-1">{errors.college.message}</p>}
                            </div>

                            <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors mt-4">
                                Start Quiz
                            </button>
                        </form>
                    </div>
                )}

                {step === 'quiz' && (
                    <div className="space-y-8">
                        {quiz.questions.map((q, index) => (
                            <div key={q._id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                                <h3 className="text-lg font-medium text-gray-900 mb-4">
                                    <span className="text-blue-600 mr-2">{index + 1}.</span>
                                    {q.questionText}
                                </h3>
                                <div className="space-y-2">
                                    {q.options.map(option => (
                                        <label key={option}
                                            className={`flex items-center p-3 rounded-lg border cursor-pointer hover:bg-gray-50 transition-colors ${userAnswers[q._id] === option ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500' : 'border-gray-200'}`}
                                        >
                                            <input
                                                type="radio"
                                                name={`q-${q._id}`}
                                                value={option}
                                                checked={userAnswers[q._id] === option}
                                                onChange={() => handleOptionSelect(q._id, option)}
                                                className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                                            />
                                            <span className="ml-3 text-gray-700">{option}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        ))}

                        <div className="flex justify-end pt-4 pb-8">
                            <button
                                onClick={submitQuiz}
                                disabled={submitting}
                                className="px-8 py-3 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 shadow-lg disabled:opacity-50"
                            >
                                {submitting ? 'Unsubmitting...' : 'Submit Quiz'}
                            </button>
                        </div>
                    </div>
                )}

                {step === 'success' && (
                    <div className="bg-white p-12 rounded-xl shadow-sm border border-gray-100 text-center">
                        <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl">
                            ✓
                        </div>
                        <h2 className="text-3xl font-bold text-gray-900 mb-4">Quiz Completed!</h2>
                        <p className="text-lg text-gray-600 mb-8">
                            Thank you for participating. Your certificate has been generated and sent to <span className="font-semibold">{userDetails.email}</span>.
                        </p>
                        <p className="text-sm text-gray-500 mb-8">
                            Please check your inbox (and spam folder) for the certificate.
                        </p>
                        <button
                            onClick={() => window.location.reload()}
                            className="text-blue-600 hover:text-blue-800 font-medium"
                        >
                            Take Quiz Again
                        </button>
                    </div>
                )}

            </main>

            <div className="bg-gray-100 py-4 text-center text-sm text-gray-500">
                &copy; {new Date().getFullYear()} Edinz Tech. All rights reserved.
            </div>
        </div>
    );
}
