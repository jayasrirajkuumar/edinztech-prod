import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Icons } from '../components/icons';
import QuizForm from '../components/forms/QuizForm';
import { getPrograms, getQuiz } from '../lib/api';

export default function AdminQuizEdit() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [quiz, setQuiz] = useState(null);
    const [programs, setPrograms] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [programsData, quizData] = await Promise.all([
                    getPrograms(),
                    getQuiz(id)
                ]);
                setPrograms(programsData);
                setQuiz(quizData);
            } catch (error) {
                console.error("Failed to load data", error);
                alert("Failed to load quiz data");
                navigate('/admin/quizzes');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id, navigate]);

    const handleSubmit = () => {
        alert('Quiz Updated Successfully!');
        navigate('/admin/quizzes');
    };

    if (loading) return <div className="p-8 text-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div></div>;

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center gap-2 mb-6">
                <Icons.Settings className="text-secondary bg-blue-50 p-1.5 rounded-lg w-10 h-10" />
                <div>
                    <h1 className="text-2xl font-bold text-secondary">Edit Quiz</h1>
                    <p className="text-sm text-gray-500">Update quiz details, questions, and settings.</p>
                </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-100">
                {quiz && (
                    <QuizForm
                        isEditing={true}
                        defaultValues={quiz}
                        programs={programs}
                        onSubmit={handleSubmit}
                        programId={quiz.program?._id || quiz.program} // Pass initial program ID
                    />
                )}
            </div>
        </div>
    );
}
