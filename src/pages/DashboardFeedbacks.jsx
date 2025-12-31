import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Icons } from '../components/icons';
import Button from '../components/ui/Button';


export default function DashboardFeedbacks() {

    const handleRedirect = () => {
        if (window.confirm("IMPORTANT:\n\n1. Ensure you enter your REGISTERED EMAIL ID exactly.\n2. Select the CORRECT PROGRAM you completed.\n\nYou will be logged out to verify these details. Continue?")) {
            localStorage.removeItem('userInfo');
            window.location.href = '/feedback/public';
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Program Feedback</h1>
                <p className="text-gray-500">Share your thoughts on the programs you've enrolled in.</p>
            </div>

            <div className="bg-white rounded-xl p-8 border border-dashed border-gray-300 flex flex-col items-center text-center max-w-lg mx-auto mt-12">
                <div className="bg-blue-50 p-4 rounded-full mb-4">
                    <Icons.MessageSquare className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Submit Your Feedback</h3>
                <p className="text-gray-500 mb-6">
                    Click the button below to go to the public feedback form.
                    <br /><span className="text-sm text-orange-600 font-medium mt-2 block bg-orange-50 p-2 rounded border border-orange-100">
                        ⚠ Please use your <b>Enrolled Email ID</b> and select the <b>Correct Program</b> to ensure your certificate is generated.
                    </span>
                    <br /><span className="text-xs text-gray-400">(You will be logged out)</span>
                </p>

                <Button onClick={handleRedirect} className="w-full sm:w-auto px-8 gap-2">
                    Proceed to Feedback Form <Icons.ArrowRight size={16} />
                </Button>
            </div>
        </div>
    );
}
