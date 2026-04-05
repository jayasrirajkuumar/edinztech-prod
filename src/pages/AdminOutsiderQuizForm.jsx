import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';

// ... imports ...

// ... inside component ...

const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const processData = (data) => {
        const newQuestions = [];
        let errorCount = 0;

        data.forEach((row) => {
            // Basic Validation
            if (!row.Question || !row["Option 1"] || !row["Option 2"]) {
                errorCount++;
                return;
            }

            // Options Map
            const options = [
                row["Option 1"],
                row["Option 2"],
                row["Option 3"] || "",
                row["Option 4"] || ""
            ];

            // Determine Correct Option Index
            let correctOptionIndex = '0'; // Default
            if (row["Answer"]) {
                const ansMap = { 'A': '0', 'B': '1', 'C': '2', 'D': '3' };
                const upperAns = row["Answer"].toString().trim().toUpperCase();
                if (ansMap.hasOwnProperty(upperAns)) {
                    correctOptionIndex = ansMap[upperAns];
                }
            }

            newQuestions.push({
                questionText: row.Question,
                options: options,
                correctOptionIndex: correctOptionIndex,
                marks: parseInt(row.Marks) || 1
            });
        });

        if (newQuestions.length > 0) {
            append(newQuestions);
            alert(`Successfully imported ${newQuestions.length} questions!`);
        }

        if (errorCount > 0) {
            alert(`Skipped ${errorCount} rows due to missing data.`);
        }
    };

    const fileExt = file.name.split('.').pop().toLowerCase();

    if (fileExt === 'csv') {
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => processData(results.data),
            error: (err) => alert("Failed to parse CSV: " + err.message)
        });
    } else if (fileExt === 'xlsx' || fileExt === 'xls') {
        const reader = new FileReader();
        reader.onload = (evt) => {
            const bstr = evt.target.result;
            const wb = XLSX.read(bstr, { type: 'binary' });
            const wsname = wb.SheetNames[0];
            const ws = wb.Sheets[wsname];
            const data = XLSX.utils.sheet_to_json(ws);
            processData(data);
        };
        reader.readAsBinaryString(file);
    } else {
        alert("Unsupported file type. Please upload CSV or Excel.");
    }
    e.target.value = null;
};

// ... inside render: Update input accept and label

<label className="cursor-pointer inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
    <Icons.Upload size={16} className="mr-2" />
    Import CSV/Excel
    <input type="file" className="hidden" accept=".csv, .xlsx, .xls" onChange={handleFileUpload} />
</label>
import { createOutsiderQuiz, getOutsiderQuizAdmin, updateOutsiderQuiz, uploadOutsiderQuizTemplate } from '../lib/api';
import Button from '../components/ui/Button';
import { Icons } from '../components/icons';

const SimpleFileUploader = ({ file, setFile, currentUrl }) => {
    const [preview, setPreview] = useState(null);

    useEffect(() => {
        if (file) {
            const url = URL.createObjectURL(file);
            setPreview(url);
            return () => URL.revokeObjectURL(url);
        } else if (currentUrl) {
            const fullUrl = currentUrl.startsWith('http') ? currentUrl : `${import.meta.env.VITE_API_URL.replace('/api', '')}/${currentUrl}`;
            setPreview(fullUrl);
        } else {
            setPreview(null);
        }
    }, [file, currentUrl]);

    return (
        <div className="border border-dashed border-gray-300 p-4 rounded-lg text-center relative">
            {preview ? (
                <div className="relative inline-block group">
                    <img src={preview} alt="Preview" className="h-32 object-contain border bg-white rounded-md" />
                    <button
                        type="button"
                        onClick={() => { setFile(null); }}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 w-6 h-6 flex items-center justify-center text-xs shadow-md z-10 hover:bg-red-600"
                    >X</button>
                    {(file) && <p className="text-xs text-gray-500 mt-1 absolute -bottom-5 left-0 right-0 truncate">{file.name}</p>}
                </div>
            ) : (
                <div className="text-gray-500 text-sm py-4">
                    <div className="flex justify-center mb-2"><Icons.Upload className="text-gray-400" /></div>
                    <span className="font-medium text-blue-600">Click to upload</span> or drag and drop
                </div>
            )}
            <input
                type="file"
                accept="image/*"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                onChange={(e) => {
                    if (e.target.files?.[0]) setFile(e.target.files[0]);
                }}
            />
        </div>
    );
};

export default function AdminOutsiderQuizForm() {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEdit = !!id;
    const [loading, setLoading] = useState(false);

    const [templateFile, setTemplateFile] = useState(null);
    const [currentTemplateUrl, setCurrentTemplateUrl] = useState('');

    const { register, control, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm({
        defaultValues: {
            title: '',
            description: '',
            certificateTemplate: '',
            timeLimit: 0,
            questions: [{ questionText: '', options: ['', '', '', ''], correctOptionIndex: null, marks: 1 }]
        }
    });

    const { fields, append, remove } = useFieldArray({
        control,
        name: "questions"
    });

    useEffect(() => {
        if (isEdit) {
            loadQuiz();
        }
    }, [id]);

    const loadQuiz = async () => {
        try {
            const data = await getOutsiderQuizAdmin(id);
            if (data.certificateTemplate) setCurrentTemplateUrl(data.certificateTemplate);

            // Map backend schema to form state
            const questionsWithIndex = data.questions.map(q => {
                return {
                    questionText: q.question, // Backend 'question' -> Form 'questionText'
                    options: q.options,
                    marks: q.marks,
                    correctOptionIndex: q.correctOption !== undefined ? q.correctOption.toString() : '0'
                };
            });

            reset({ ...data, questions: questionsWithIndex });
        } catch (error) {
            console.error("Failed to load quiz", error);
        }
    };

    const handleCSVUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                const newQuestions = [];
                let errorCount = 0;

                results.data.forEach((row) => {
                    // Basic Validation
                    if (!row.Question || !row["Option 1"] || !row["Option 2"]) {
                        errorCount++;
                        return;
                    }

                    // Options Map
                    const options = [
                        row["Option 1"],
                        row["Option 2"],
                        row["Option 3"] || "",
                        row["Option 4"] || ""
                    ];

                    // Determine Correct Option Index
                    let correctOptionIndex = '0'; // Default
                    if (row["Answer"]) {
                        const ansMap = { 'A': '0', 'B': '1', 'C': '2', 'D': '3' };
                        const upperAns = row["Answer"].toString().trim().toUpperCase();
                        if (ansMap.hasOwnProperty(upperAns)) {
                            correctOptionIndex = ansMap[upperAns];
                        }
                    }

                    newQuestions.push({
                        questionText: row.Question,
                        options: options,
                        correctOptionIndex: correctOptionIndex,
                        marks: parseInt(row.Marks) || 1
                    });
                });

                if (newQuestions.length > 0) {
                    append(newQuestions);
                    alert(`Successfully imported ${newQuestions.length} questions!`);
                }

                if (errorCount > 0) {
                    alert(`Skipped ${errorCount} rows due to missing data.`);
                }
            },
            error: (err) => {
                alert("Failed to parse CSV: " + err.message);
            }
        });
        e.target.value = '';
    };

    const onSubmit = async (data) => {
        setLoading(true);
        try {
            // Transform questions back to backend format
            const formattedQuestions = data.questions.map(q => ({
                question: q.questionText,
                options: q.options,
                marks: q.marks,
                type: 'mcq',
                correctOption: Number(q.correctOptionIndex)
            }));

            const payload = { ...data, questions: formattedQuestions };

            let quizId = id;
            if (isEdit) {
                await updateOutsiderQuiz(id, payload);
            } else {
                const res = await createOutsiderQuiz(payload);
                quizId = res._id;
            }

            if (templateFile && quizId) {
                await uploadOutsiderQuizTemplate(quizId, templateFile);
            }

            navigate('/admin/outsider-quizzes');
        } catch (error) {
            console.error(error);
            const msg = error.response?.data?.message || error.message || 'Failed to save quiz';
            alert(`Error: ${msg}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-20">
            <h1 className="text-2xl font-bold text-gray-900">{isEdit ? 'Edit Quiz' : 'Create New Outsider Quiz'}</h1>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                {/* Basic Info */}
                <div className="bg-white p-6 rounded-xl border border-gray-100 space-y-4">
                    <h2 className="text-lg font-semibold text-gray-800">Quiz Details</h2>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Quiz Title</label>
                        <input
                            {...register("title", { required: "Title is required" })}
                            className="mt-1 w-full p-2 border rounded-md"
                            placeholder="e.g., General Knowledge 2024"
                        />
                        {errors.title && <p className="text-red-500 text-xs">{errors.title.message}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Description</label>
                        <textarea
                            {...register("description")}
                            className="mt-1 w-full p-2 border rounded-md"
                            rows={3}
                            placeholder="Brief description for participants..."
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Time Limit (mins) - 0 for none</label>
                            <input
                                type="number"
                                {...register("timeLimit")}
                                className="mt-1 w-full p-2 border rounded-md"
                            />
                        </div>
                        <div className="flex flex-col gap-4">

                            <div className="flex items-center gap-2 mt-4 ml-1">
                                <input
                                    type="checkbox"
                                    id="enableCertificates"
                                    {...register("enableCertificates")}
                                    className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                />
                                <label htmlFor="enableCertificates" className="text-sm font-medium text-gray-700">Enable Automatic Certificate Generation</label>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Certificate Template Image</label>
                                <SimpleFileUploader
                                    file={templateFile}
                                    setFile={setTemplateFile}
                                    currentUrl={currentTemplateUrl}
                                />
                                <p className="text-xs text-gray-500 mt-1">Upload an image (JPG/PNG) used as the certificate background.</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Questions */}
                <div className="space-y-4">
                    <div className="flex flex-col gap-2">
                        <div className="flex justify-between items-center">
                            <h2 className="text-lg font-semibold text-gray-800">Questions</h2>
                            <div className="flex gap-2">
                                <label className="cursor-pointer inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                                    <Icons.Upload size={16} className="mr-2" />
                                    Import CSV
                                    <input type="file" className="hidden" accept=".csv" onChange={handleCSVUpload} onClick={(e) => { e.target.value = ''; }} />
                                </label>
                                <Button type="button" variant="outline" size="sm" onClick={() => append({ questionText: '', options: ['', '', '', ''], correctOptionIndex: '0', marks: 1 })}>
                                    <Icons.Plus size={16} className="mr-1" /> Add Question
                                </Button>
                            </div>
                        </div>
                        <div className="bg-gray-50 p-2 rounded text-xs text-gray-600 border border-gray-200">
                            <p className="font-semibold">CSV Format Required:</p>
                            <code className="block mt-1 bg-white p-1 rounded border border-gray-300">
                                Question, Answer (A/B/C/D), Option 1, Option 2, Option 3, Option 4, Marks
                            </code>
                        </div>
                    </div>

                    {fields.map((field, index) => (
                        <div key={field.id} className="bg-white p-6 rounded-xl border border-gray-100 relative group">
                            <button
                                type="button"
                                onClick={() => remove(index)}
                                className="absolute top-4 right-4 text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <Icons.Trash size={18} />
                            </button>

                            <div className="space-y-4">
                                <div className="flex gap-4">
                                    <div className="flex-grow">
                                        <label className="block text-xs font-bold text-gray-500 uppercase">Question {index + 1}</label>
                                        <input
                                            {...register(`questions.${index}.questionText`, { required: true })}
                                            className="mt-1 w-full p-2 border rounded-md font-medium"
                                            placeholder="Enter question text"
                                        />
                                    </div>
                                    <div className="w-24">
                                        <label className="block text-xs font-bold text-gray-500 uppercase">Marks</label>
                                        <input
                                            type="number"
                                            {...register(`questions.${index}.marks`)}
                                            className="mt-1 w-full p-2 border rounded-md"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <label className="block text-xs font-bold text-gray-500 uppercase">Options & Correct Answer</label>
                                    <div className="space-y-2">
                                        {[0, 1, 2, 3].map(optIndex => (
                                            <div key={optIndex} className="flex items-center gap-3">
                                                <div className="pt-1">
                                                    <input
                                                        type="radio"
                                                        value={optIndex.toString()}
                                                        {...register(`questions.${index}.correctOptionIndex`, { required: "Select correct answer" })}
                                                        className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                                                    />
                                                </div>
                                                <div className="flex-grow">
                                                    <input
                                                        {...register(`questions.${index}.options.${optIndex}`, { required: true })}
                                                        className={`w-full p-2 border rounded-md text-sm ${
                                                            // Highlight border if selected? Optional visual cue
                                                            watch(`questions.${index}.correctOptionIndex`) == optIndex ? 'border-blue-500 ring-1 ring-blue-500' : 'border-gray-300'
                                                            }`}
                                                        placeholder={`Option ${optIndex + 1}`}
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    {errors.questions?.[index]?.correctOptionIndex && (
                                        <p className="text-red-500 text-xs">Please select the correct answer.</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="flex justify-end gap-4">
                    <Button type="button" variant="ghost" onClick={() => navigate('/admin/outsider-quizzes')}>Cancel</Button>
                    <Button type="submit" disabled={loading}>
                        {loading ? 'Saving...' : (isEdit ? 'Update Quiz' : 'Create Quiz')}
                    </Button>
                </div>
            </form>
        </div>
    );
}
