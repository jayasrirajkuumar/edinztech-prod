import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import api, { getPrograms, submitPublicFeedback } from '../lib/api';
import { useConfirm } from '../context/ConfirmContext';

const PublicFeedback = () => {
    const { showAlert } = useConfirm();
    const [programs, setPrograms] = useState([]);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const { register, handleSubmit, formState: { errors } } = useForm();

    useEffect(() => {
        const fetchPrograms = async () => {
            try {
                const data = await getPrograms();
                console.log("Programs Data:", data);
                if (Array.isArray(data)) {
                    setPrograms(data);
                } else {
                    console.error("Expected array but got:", data);
                    setPrograms([]); // fallback
                }
            } catch (error) {
                console.error("Failed to load programs", error);
            }
        };
        fetchPrograms();
    }, []);

    const onSubmit = async (data) => {
        setLoading(true);
        try {
            await submitPublicFeedback(data);
            setSuccess(true);
        } catch (error) {
            console.error(error);
            showAlert({
                title: "Feedback Error",
                message: error.response?.data?.message || 'Failed to submit feedback. Check your email and enrollment.',
                severity: "danger"
            });
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="bg-white p-8 rounded-lg shadow-md text-center max-w-md w-full">
                    <div className="text-green-500 text-5xl mb-4">✓</div>
                    <h2 className="text-2xl font-bold mb-2">Thank You!</h2>
                    <p className="text-gray-600 mb-6">Your feedback has been submitted successfully.</p>
                    <p className="text-sm text-green-600 font-medium mb-6 bg-green-50 p-3 rounded border border-green-100">
                        Your certificate will be automatically generated and sent to you shortly.
                    </p>
                    <button
                        onClick={() => window.location.reload()}
                        className="text-blue-600 hover:underline"
                    >
                        Submit another
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto bg-white p-8 rounded-lg shadow-md">
            <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Program Feedback</h1>
                <p className="mt-2 text-gray-600">Share your experience with us. Your feedback helps us improve.</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

                {/* Program Code Manual Input */}
                <div>
                    <label className="block text-sm font-medium text-gray-700">Program Code</label>
                    <input
                        {...register("programId", { required: "Program Code is required" })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-3 border focus:ring-blue-500 focus:border-blue-500 font-mono uppercase"
                        placeholder="e.g. EDZ-2025-INT-001"
                        style={{ textTransform: 'uppercase' }}
                    />
                    <p className="text-xs text-gray-500 mt-1">Enter your unique Program Code (from your dashboard or offer letter).</p>
                    {errors.programId && <p className="text-red-500 text-xs mt-1">{errors.programId.message}</p>}
                </div>

                {/* Name */}
                <div>
                    <label className="block text-sm font-medium text-gray-700">Your Name</label>
                    <input
                        {...register("name", { required: "Name is required" })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-3 border focus:ring-blue-500 focus:border-blue-500"
                        placeholder="John Doe"
                    />
                    {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
                </div>

                {/* Email Verification */}
                <div>
                    <label className="block text-sm font-medium text-gray-700">Registered Email Address</label>
                    <input
                        {...register("email", {
                            required: "Email is required",
                            pattern: {
                                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                message: "Invalid email address"
                            }
                        })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-3 border focus:ring-blue-500 focus:border-blue-500"
                        placeholder="john@example.com"
                    />
                    <p className="text-xs text-gray-500 mt-1">Must match the email used for enrollment.</p>
                    {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
                </div>

                {/* Rating */}
                <div>
                    <label className="block text-sm font-medium text-gray-700">Rating</label>
                    <select
                        {...register("rating")} // Optional in schema currently, but good to have
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-3 border"
                    >
                        <option value="5">⭐⭐⭐⭐⭐ Excellent</option>
                        <option value="4">⭐⭐⭐⭐ Very Good</option>
                        <option value="3">⭐⭐⭐ Good</option>
                        <option value="2">⭐⭐ Fair</option>
                        <option value="1">⭐ Poor</option>
                    </select>
                </div>

                {/* Feedback */}
                <div>
                    <label className="block text-sm font-medium text-gray-700">Your Feedback</label>
                    <textarea
                        {...register("feedback", { required: "Feedback is required" })}
                        rows={5}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-3 border focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Tell us what you liked or how we can improve..."
                    />
                    {errors.feedback && <p className="text-red-500 text-xs mt-1">{errors.feedback.message}</p>}
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400"
                >
                    {loading ? 'Verifying & Submitting...' : 'Submit Feedback'}
                </button>

            </form>
        </div>
    );
};

export default PublicFeedback;
