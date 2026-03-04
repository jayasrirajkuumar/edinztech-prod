import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Icons } from '../components/icons';
import Button from '../components/ui/Button';
import { getFeedbackForSubmission, submitFeedback } from '../lib/api';
import { useConfirm } from '../context/ConfirmContext';

export default function FeedbackAttempt() {
    const { showAlert } = useConfirm();
    const { id } = useParams();
    const navigate = useNavigate();
    const [feedback, setFeedback] = useState(null);
    const [loading, setLoading] = useState(true);
    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const data = await getFeedbackForSubmission(id);
                setFeedback(data);
            } catch (error) {
                console.error("Failed to load feedback", error);
                showAlert({
                    title: "Access Denied",
                    message: "Failed to load feedback. You might have already submitted it or it is not available.",
                    severity: "warning"
                });
                navigate('/dashboard/feedbacks');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id, navigate]);

    const onSubmit = async (data) => {
        // Transform form data to match API expectation: { answers: [{ questionId, value }] }
        const answers = Object.keys(data).map(key => ({
            questionId: key,
            value: data[key]
        }));

        try {
            await submitFeedback(id, answers);
            navigate('/success', {
                state: {
                    title: "Feedback Submitted",
                    message: "Thank you for your feedback! Your response has been recorded.",
                    redirect: "/dashboard/feedbacks"
                }
            });
        } catch (error) {
            console.error("Submission failed", error);
            showAlert({
                title: "Submission Error",
                message: "Failed to submit feedback",
                severity: "danger"
            });
        }
    };

    if (loading) return <div className="p-12 text-center">Loading...</div>;

    return (
        <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in duration-500">
            <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">
                <div className="mb-8 text-center">
                    <div className="w-16 h-16 bg-purple-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Icons.MessageSquare className="text-secondary w-8 h-8" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">{feedback.title}</h1>
                    <p className="text-gray-500">{feedback.description}</p>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                    {feedback.questions.map((q, idx) => (
                        <div key={q.id} className="space-y-4">
                            <label className="block text-base font-semibold text-gray-800">
                                <span className="text-gray-400 mr-2">{idx + 1}.</span>
                                {q.text}
                                {q.required && <span className="text-danger ml-1">*</span>}
                            </label>

                            {q.type === 'text' && (
                                <textarea
                                    {...register(q.id, { required: q.required })}
                                    rows="4"
                                    className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none resize-none"
                                    placeholder="Type your answer here..."
                                />
                            )}

                            {q.type === 'rating' && (
                                <div className="flex items-center gap-4">
                                    {[1, 2, 3, 4, 5].map(num => (
                                        <label key={num} className="cursor-pointer group">
                                            <input
                                                type="radio"
                                                value={num}
                                                {...register(q.id, { required: q.required })}
                                                className="peer sr-only"
                                            />
                                            <div className="w-12 h-12 rounded-lg border-2 border-gray-200 peer-checked:border-primary peer-checked:bg-primary/5 flex items-center justify-center transition-all group-hover:border-primary/50">
                                                <span className="text-lg font-medium text-gray-500 peer-checked:text-primary">{num}</span>
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            )}

                            {q.type === 'single-select' && (
                                <div className="space-y-2">
                                    {q.options.map((opt, i) => (
                                        <label key={i} className="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                                            <input
                                                type="radio"
                                                value={opt}
                                                {...register(q.id, { required: q.required })}
                                                className="w-4 h-4 text-primary border-gray-300 focus:ring-primary"
                                            />
                                            <span className="ml-3 text-gray-700">{opt}</span>
                                        </label>
                                    ))}
                                </div>
                            )}

                            {q.type === 'multi-select' && (
                                <div className="space-y-2">
                                    {q.options.map((opt, i) => (
                                        <label key={i} className="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                                            <input
                                                type="checkbox"
                                                value={opt}
                                                {...register(q.id, { required: q.required })}
                                                className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                                            />
                                            <span className="ml-3 text-gray-700">{opt}</span>
                                        </label>
                                    ))}
                                </div>
                            )}

                            {errors[q.id] && <p className="text-sm text-danger">This field is required</p>}
                        </div>
                    ))}

                    <div className="pt-8 border-t border-gray-100 flex justify-end">
                        <Button type="submit" size="lg" isLoading={isSubmitting}>
                            Submit Feedback
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
