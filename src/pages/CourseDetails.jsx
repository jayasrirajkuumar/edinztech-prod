import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getProgram, createPaymentOrder, enrollFree } from '../lib/api';
import { getImageUrl } from '../lib/utils';
import { isRegistrationOpen } from '../lib/programUtils';
import { formatDate } from '../lib/dateUtils';
import { Icons } from '../components/icons';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import GuestEnrollmentForm from '../components/forms/GuestEnrollmentForm';

export default function CourseDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [program, setProgram] = useState(null);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [showEnrollForm, setShowEnrollForm] = useState(false);

    // Auth check
    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
    const user = userInfo.user || userInfo;
    const isAuthenticated = !!user.email;

    useEffect(() => {
        // Load Razorpay script
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.async = true;
        document.body.appendChild(script);

        const fetchProgram = async () => {
            try {
                const data = await getProgram(id);
                setProgram(data);
            } catch (err) {
                console.error("Failed to fetch program", err);
            } finally {
                setLoading(false);
            }
        };

        fetchProgram();

        return () => {
            document.body.removeChild(script);
        };
    }, [id]);

    const handleEnroll = () => {
        setShowEnrollForm(true);
    };

    if (loading) return <div className="p-10 text-center">Loading...</div>;
    if (!program) return <div className="p-10 text-center">Program not found</div>;

    const tags = ["Beginner Friendly", "Certificate", "Live Support"]; // Mock tags for now if DB logic missing tags

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-5 duration-500 relative">
            {showEnrollForm && (
                <GuestEnrollmentForm
                    program={program}
                    onClose={() => setShowEnrollForm(false)}
                />
            )}

            {/* Left Content */}
            <div className="lg:col-span-2 space-y-8">
                <div>
                    <span className="inline-block px-3 py-1 rounded-full bg-blue-50 text-secondary text-sm font-semibold mb-4">
                        {program.type}
                    </span>
                    <h1 className="text-4xl font-bold text-secondary mb-4">{program.title}</h1>

                    {/* Banner Image */}
                    {program.bannerImage && (
                        <div className="mb-8 rounded-xl overflow-hidden shadow-lg border border-gray-100">
                            <img
                                src={getImageUrl(program.bannerImage)}
                                alt={program.title}
                                className="w-full h-auto object-cover"
                            />
                        </div>
                    )}


                </div>

                <Card>
                    <h3 className="text-xl font-bold text-secondary mb-4 border-b border-gray-100 pb-2">About this Program</h3>
                    <div className="text-text-light leading-relaxed mb-6 whitespace-pre-line">
                        {program.description}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <h4 className="font-semibold text-secondary col-span-2">Highlights:</h4>
                        {tags.map(tag => (
                            <div key={tag} className="flex items-center gap-2 text-text-light">
                                <Icons.Success size={18} /> {tag}
                            </div>
                        ))}
                    </div>
                </Card>

                <Card>
                    <h3 className="text-xl font-bold text-secondary mb-4 border-b border-gray-100 pb-2">Curriculum Overview</h3>
                    <div className="space-y-4">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="flex gap-4 p-4 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors">
                                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 text-secondary flex items-center justify-center font-bold">
                                    {i}
                                </div>
                                <div>
                                    <h4 className="font-bold text-secondary">Module {i}</h4>
                                    <p className="text-sm text-text-light mt-1">Detailed module content goes here.</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>

            {/* Right Sidebar */}
            <div className="space-y-6">
                <Card className="sticky top-24 border-t-4 border-t-primary">
                    <div className="mb-6">
                        <p className="text-sm text-text-light mb-1">Program Fee</p>
                        <h2 className="text-3xl font-bold text-primary">₹{program.fee}</h2>
                    </div>

                    <div className="space-y-4 mb-8">
                        <div className="flex justify-between items-center py-2 border-b border-gray-50">
                            <div className="flex items-center gap-3 text-text-light">
                                <Icons.Duration size={20} className="text-primary" />
                                <span>Duration</span>
                            </div>
                            <span className="font-semibold text-secondary">{program.durationDays ? `${program.durationDays} Days` : 'Self-paced'}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-gray-50">
                            <div className="flex items-center gap-3 text-text-light">
                                <Icons.Home size={20} className="text-primary" />
                                <span>Mode</span>
                            </div>
                            <span className="font-semibold text-secondary">{program.mode}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-gray-50">
                            <div className="flex items-center gap-3 text-text-light">
                                <Icons.Date size={20} className="text-primary" />
                                <span>Start Date</span>
                            </div>
                            <span className="font-semibold text-secondary">{formatDate(program.startDate)}</span>
                        </div>
                    </div>

                    <Button
                        onClick={handleEnroll}
                        disabled={processing || !isRegistrationOpen(program)}
                        className="w-full py-4 text-lg shadow-lg shadow-orange-100 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {processing ? 'Processing...' : (!isRegistrationOpen(program) ? 'Registration Closed' : 'Enroll Now')}
                    </Button>

                    {program.registrationDeadline &&
                        new Date(program.registrationDeadline) > new Date() &&
                        (new Date(program.registrationDeadline) - new Date()) / (1000 * 60 * 60 * 24) <= 2 && (
                            <div className="mt-3 text-center animate-pulse">
                                <span className="text-sm font-semibold text-red-600 bg-red-50 px-2 py-1 rounded border border-red-100">
                                    Registration closes on {formatDate(program.registrationDeadline, { day: 'numeric', month: 'long', year: 'numeric' })}
                                </span>
                            </div>
                        )}
                    <p className="text-xs text-center text-gray-400 mt-4">30-day money-back guarantee</p>
                </Card>
            </div>

        </div>
    );
}