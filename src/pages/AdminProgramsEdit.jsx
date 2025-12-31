import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ProgramForm from '../components/forms/ProgramForm';
import QuizList from '../components/admin/QuizList';
import { Icons } from '../components/icons';
import { getProgram, updateProgram } from '../lib/api';

export default function AdminProgramsEdit() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [program, setProgram] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchProgram = async () => {
            try {
                const data = await getProgram(id);
                setProgram(data);
            } catch (err) {
                console.error("Failed to fetch program", err);
                setError("Failed to load program details");
            } finally {
                setIsLoading(false);
            }
        };

        fetchProgram();
    }, [id]);

    const handleSubmit = async (data) => {
        try {
            await updateProgram(id, data);
            alert('Program Updated Successfully!');
            navigate('/admin/programs');
        } catch (err) {
            console.error("Failed to update program", err);
            alert("Failed to update program: " + (err.response?.data?.message || err.message));
        }
    };

    // Tab State
    const [activeTab, setActiveTab] = useState('basic');

    if (isLoading) return <div className="p-8">Loading program...</div>;
    if (error) return <div className="p-8 text-red-500">{error}</div>;
    if (!program) return <div className="p-8">Program not found</div>;

    const defaultValues = {
        title: program.title,
        description: program.description,
        type: program.type || program.category,
        mode: program.mode,
        paymentMode: program.paymentMode || 'Paid',
        fee: program.fee ? String(program.fee) : '',
        startDate: program.startDate ? new Date(program.startDate).toISOString().split('T')[0] : '',
        endDate: program.endDate ? new Date(program.endDate).toISOString().split('T')[0] : '',
        registrationDeadline: program.registrationDeadline ? new Date(program.registrationDeadline).toISOString().split('T')[0] : '',
        durationDays: program.durationDays,
        offerLetterTemplate: program.offerLetterTemplate,
        certificateTemplate: program.certificateTemplate,
        code: program.code, // CRITICAL: Preserve code to prevent auto-gen collision
        templateType: program.templateType || 'edinz', // Add templateType default
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-2">
                    <Icons.Edit className="text-secondary bg-blue-50 p-1.5 rounded-lg w-10 h-10" />
                    <div>
                        <h1 className="text-2xl font-bold text-secondary">Edit Program</h1>
                        <p className="text-sm text-gray-500">Update details for <span className="font-semibold text-primary">{program.title}</span></p>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-200 mb-6 overflow-x-auto">
                {['Basic', 'Quizzes'].map((tab) => {
                    const key = tab.toLowerCase();
                    const isActive = activeTab === key;
                    return (
                        <button
                            key={key}
                            onClick={() => setActiveTab(key)}
                            className={`px-6 py-3 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${isActive
                                ? 'border-primary text-primary'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                        >
                            {tab}
                        </button>
                    );
                })}
            </div>

            {/* Content */}
            {activeTab === 'basic' && (
                <ProgramForm programId={id} onSubmit={handleSubmit} defaultValues={defaultValues} isEditing />
            )}

            {activeTab === 'quizzes' && (
                // Dynamic import or direct component? Direct is fine.
                // Pass programId to list quizzes
                <div className="animate-in slide-in-from-left-2 duration-300">
                    <QuizList programId={id} />
                </div>
            )}
        </div>
    );
}
