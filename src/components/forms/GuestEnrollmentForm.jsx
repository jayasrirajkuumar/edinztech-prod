import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import api, { createPaymentOrder } from '../../lib/api';

const GuestEnrollmentForm = ({ program, onClose }) => {
    const { register, handleSubmit, formState: { errors } } = useForm();
    const [processing, setProcessing] = useState(false);

    const onSubmit = async (data) => {
        setProcessing(true);
        try {
            // 1. Create Order (Guest Flow)
            const orderData = {
                programId: program._id,
                programType: program.type,
                name: data.name,
                email: data.email,
                phone: data.phone,
                year: data.year,
                department: data.department,
                registerNumber: data.registerNumber,
                institutionName: data.institutionName,
                state: data.state,
                city: data.city,
                pincode: data.pincode
            };

            const order = await createPaymentOrder(orderData);

            // 2. Open Razorpay
            const options = {
                key: import.meta.env.VITE_RAZORPAY_KEY_ID,
                amount: order.amount,
                currency: order.currency,
                name: "EdinzTech",
                description: `Enrollment for ${program.title}`,
                order_id: order.id,
                prefill: {
                    name: data.name,
                    email: data.email,
                    contact: data.phone
                },
                handler: async function (response) {
                    try {
                        await import('../../lib/api').then(mod => mod.verifyPayment({
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature
                        }));
                        alert('Payment Successful and Verified! Check your email for login credentials.');
                        window.location.reload(); // Refresh to show enrollment
                    } catch (e) {
                        console.error("Verification Call Failed", e);
                        alert('Payment successful but verification failed. Please contact support.');
                    }
                    onClose();
                },
                theme: {
                    color: "#F37254"
                }
            };

            const rzp1 = new window.Razorpay(options);
            rzp1.on('payment.failed', function (response) {
                alert(response.error.description || "Payment Failed");
            });
            rzp1.open();

        } catch (error) {
            console.error("Enrollment error:", error);
            alert(error.response?.data?.message || "Failed to initiate payment. Please try again.");
        } finally {
            setProcessing(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md relative">
                <button
                    onClick={onClose}
                    className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
                >
                    ✕
                </button>
                <h2 className="text-xl font-bold mb-4">Enroll in {program.title}</h2>
                <p className="text-sm text-gray-600 mb-4">Enter your details to proceed to payment.</p>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Full Name</label>
                        <input
                            {...register("name", { required: "Name is required" })}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
                            placeholder="John Doe"
                        />
                        {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Email Address</label>
                        <input
                            {...register("email", {
                                required: "Email is required",
                                pattern: {
                                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                    message: "Invalid email address"
                                }
                            })}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
                            placeholder="john@example.com"
                        />
                        {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Phone Number</label>
                        <input
                            {...register("phone", { required: "Phone is required" })}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
                            placeholder="9876543210"
                        />
                        {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>}
                    </div>

                    {/* Extended Profile Info */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Institution Name</label>
                            <input
                                {...register("institutionName", { required: "Institution Name is required" })}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
                                placeholder="University"
                            />
                            {errors.institutionName && <p className="text-red-500 text-xs mt-1">{errors.institutionName.message}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Register No</label>
                            <input
                                {...register("registerNumber", { required: "Register Number is required" })}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
                                placeholder="Roll No"
                            />
                            {errors.registerNumber && <p className="text-red-500 text-xs mt-1">{errors.registerNumber.message}</p>}
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Department</label>
                            <input {...register("department")} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border" placeholder="Dept" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Year</label>
                            <input {...register("year")} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border" placeholder="Year" />
                        </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                        <div className="col-span-1">
                            <label className="block text-sm font-medium text-gray-700">City</label>
                            <input {...register("city")} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border" />
                        </div>
                        <div className="col-span-1">
                            <label className="block text-sm font-medium text-gray-700">State</label>
                            <input {...register("state")} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border" />
                        </div>
                        <div className="col-span-1">
                            <label className="block text-sm font-medium text-gray-700">Pincode</label>
                            <input {...register("pincode")} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border" />
                        </div>
                    </div>

                    <div className="pt-2">
                        <button
                            type="submit"
                            disabled={processing}
                            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400"
                        >
                            {processing ? 'Processing...' : `Pay ₹${program.fee}`}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default GuestEnrollmentForm;
