import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import api, { createPaymentOrder, checkUser } from '../../lib/api';
import Modal from '../ui/Modal';
import { Icons } from '../icons';

const GuestEnrollmentForm = ({ program, onClose }) => {
    const { register, handleSubmit, setValue, formState: { errors } } = useForm();
    const [processing, setProcessing] = useState(false);
    const [userFound, setUserFound] = useState(false);
    const [statusModal, setStatusModal] = useState({ isOpen: false, type: 'success', message: '' });

    const handleEmailBlur = async (email) => {
        if (!email || !/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(email)) return;

        try {
            const data = await checkUser(email);
            if (data.exists && data.user) {
                // Auto-fill and Disable
                setUserFound(true);
                setValue('name', data.user.name);
                setValue('phone', data.user.phone);
                setValue('institutionName', data.user.institutionName);
                setValue('registerNumber', data.user.registerNumber);
                setValue('year', data.user.year);
                setValue('department', data.user.department);
                setValue('city', data.user.city);
                setValue('state', data.user.state);
                setValue('pincode', data.user.pincode);
            } else {
                setUserFound(false);
                // Optional: Clear fields if mistakenly entered existing email then changed to new? 
                // Better to leave as is so user doesn't lose typed data.
            }
        } catch (error) {
            console.error("Failed to check user", error);
        }
    };

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

            if (order.isFree) {
                setStatusModal({ isOpen: true, type: 'success', message: 'Enrolled successfully for free! Check your email for login credentials.' });
                setProcessing(false);
                return;
            }

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
                        setStatusModal({
                            isOpen: true,
                            type: 'success',
                            message: 'Payment Successful and Verified! Check your email for login credentials.'
                        });
                    } catch (e) {
                        console.error("Verification Call Failed", e);
                        setStatusModal({
                            isOpen: true,
                            type: 'error',
                            message: 'Payment successful but verification failed. Please contact support.'
                        });
                    }
                    // onClose(); // Delay this until modal close?
                },
                theme: {
                    color: "#F37254"
                }
            };

            const rzp1 = new window.Razorpay(options);
            rzp1.on('payment.failed', function (response) {
                setStatusModal({
                    isOpen: true,
                    type: 'error',
                    message: response.error.description || "Payment Failed"
                });
            });
            rzp1.open();

        } catch (error) {
            console.error("Enrollment error:", error);
            setStatusModal({
                isOpen: true,
                type: 'error',
                message: error.response?.data?.message || "Failed to initiate payment. Please try again."
            });
        } finally {
            setProcessing(false);
        }
    };

    const handleModalClose = () => {
        const isSuccess = statusModal.type === 'success';
        setStatusModal({ ...statusModal, isOpen: false });
        if (isSuccess) {
            window.location.reload();
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
                            className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border ${userFound ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                            placeholder="John Doe"
                            readOnly={userFound}
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
                                },
                                onBlur: (e) => handleEmailBlur(e.target.value)
                            })}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
                            placeholder="john@example.com"
                        />
                        {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
                        {userFound && (
                            <div className="mt-2 p-2 bg-blue-50 text-blue-700 text-xs rounded border border-blue-100">
                                <strong>User Found!</strong> Basic details have been auto-filled.
                                <br />
                                To update your profile, please login to your <a href="/dashboard" className="underline font-bold">Student Dashboard</a> and click "Edit Profile".
                            </div>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Phone Number</label>
                        <input
                            {...register("phone", { required: "Phone is required" })}
                            className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border ${userFound ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                            placeholder="9876543210"
                            readOnly={userFound}
                        />
                        {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>}
                    </div>

                    {/* Extended Profile Info */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Institution Name</label>
                            <input
                                {...register("institutionName")} // Optional
                                className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border ${userFound ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                placeholder="University"
                                readOnly={userFound}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Register No</label>
                            <input
                                {...register("registerNumber")} // Optional
                                className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border ${userFound ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                placeholder="Roll No"
                                readOnly={userFound}
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Department</label>
                            <input {...register("department")} className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border ${userFound ? 'bg-gray-100 cursor-not-allowed' : ''}`} placeholder="Dept" readOnly={userFound} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Year</label>
                            <input {...register("year")} className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border ${userFound ? 'bg-gray-100 cursor-not-allowed' : ''}`} placeholder="Year" readOnly={userFound} />
                        </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                        <div className="col-span-1">
                            <label className="block text-sm font-medium text-gray-700">City</label>
                            <input {...register("city")} className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border ${userFound ? 'bg-gray-100 cursor-not-allowed' : ''}`} readOnly={userFound} />
                        </div>
                        <div className="col-span-1">
                            <label className="block text-sm font-medium text-gray-700">State</label>
                            <input {...register("state")} className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border ${userFound ? 'bg-gray-100 cursor-not-allowed' : ''}`} readOnly={userFound} />
                        </div>
                        <div className="col-span-1">
                            <label className="block text-sm font-medium text-gray-700">Pincode</label>
                            <input {...register("pincode")} className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border ${userFound ? 'bg-gray-100 cursor-not-allowed' : ''}`} readOnly={userFound} />
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

            {/* Status Modal */}
            <Modal
                isOpen={statusModal.isOpen}
                onClose={handleModalClose}
                title={statusModal.type === 'success' ? 'Success' : 'Attention'}
            >
                <div className="flex flex-col items-center text-center space-y-4">
                    {statusModal.type === 'success' ? (
                        <Icons.Success size={48} className="text-success" />
                    ) : (
                        <Icons.AlertCircle size={48} className="text-danger" />
                    )}
                    <p className="text-gray-600 font-medium">{statusModal.message}</p>
                    <button
                        onClick={handleModalClose}
                        className={`px-6 py-2 rounded-lg text-white font-semibold transition-colors
                            ${statusModal.type === 'success' ? 'bg-success hover:bg-success/90' : 'bg-danger hover:bg-danger/90'}`}
                    >
                        {statusModal.type === 'success' ? 'OK' : 'Try Again'}
                    </button>
                </div>
            </Modal>
        </div>
    );
};

export default GuestEnrollmentForm;
