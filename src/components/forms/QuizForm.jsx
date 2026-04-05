import { useState } from 'react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Input } from '../ui/Input';
import Button from '../ui/Button';
import { Icons } from '../icons';
import { createQuiz, updateQuiz, uploadQuizImage } from '../../lib/api';
import DateTimePicker from '../ui/DateTimePicker';

const questionSchema = z.object({
    question: z.string().min(1, 'Question text is required'),
    type: z.enum(['mcq', 'text', 'file_upload']),
    image: z.string().optional(),
    marks: z.coerce.number().min(1),
    // Options required only if type is mcq
    options: z.array(z.string()).optional(),
    correctOption: z.coerce.number().optional(),
    correctAnswer: z.string().optional()
}).refine(data => {
    if (data.type === 'mcq') {
        if (!data.options || data.options.length < 2) return false;
        if (data.correctOption === undefined || data.correctOption === null) return false;
    }
    return true;
}, {
    message: "MCQ must have at least 2 options and a correct answer",
    path: ["options"]
});

const quizSchema = z.object({
    title: z.string().min(3, 'Title is required'),
    description: z.string().optional(),
    programId: z.string().min(1, 'Program is required'),
    passingScore: z.coerce.number().min(1).max(100),
    startTime: z.string().min(1, 'Start time is required'),
    endTime: z.string().optional(),
    questions: z.array(questionSchema).min(1, 'At least one question is required'),
});

export default function QuizForm({ programId, programs, defaultValues, onSubmit, isEditing }) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [uploadingQIndex, setUploadingQIndex] = useState(null);

    const { register, control, handleSubmit, formState: { errors }, setValue, watch, getValues } = useForm({
        resolver: zodResolver(quizSchema),
        defaultValues: defaultValues ? {
            ...defaultValues,
            programId: programId || defaultValues.program,
            // FIX: Use local time string for datetime-local input, NOT UTC
            startTime: defaultValues.startTime ? new Date(defaultValues.startTime).toLocaleString('sv').slice(0, 16).replace(' ', 'T') : '',
            endTime: defaultValues.endTime ? new Date(defaultValues.endTime).toLocaleString('sv').slice(0, 16).replace(' ', 'T') : '',
            questions: defaultValues.questions.map(q => ({
                ...q,
                type: q.type || 'mcq',
                marks: q.marks || 1,
                image: q.image || '',
                correctAnswer: q.correctAnswer || '',
                correctOption: q.correctOption !== undefined && q.correctOption !== null ? String(q.correctOption) : '0'
            }))
        } : {
            title: '',
            description: '',
            programId: programId || '',
            passingScore: 60,
            // Default start time: Now (Local)
            startTime: new Date().toLocaleString('sv').slice(0, 16).replace(' ', 'T'),
            questions: [{ question: '', type: 'mcq', marks: 1, options: ['', '', '', ''], correctOption: 0 }]
        }
    });

    const { fields, append, remove } = useFieldArray({
        control,
        name: "questions"
    });

    const handleFormSubmit = async (data) => {
        setIsSubmitting(true);
        try {
            const payload = {
                ...data,
                // Ensure programId is from data (selected) or prop
                programId: data.programId,
                // Ensure dates are sent correctly or null if empty
                startTime: data.startTime || null,
                endTime: data.endTime || null,
            };

            if (isEditing) {
                await updateQuiz(defaultValues._id || defaultValues.id, payload);
            } else {
                await createQuiz(payload);
            }
            onSubmit();
        } catch (error) {
            console.error("Quiz save error", error);
            alert("Failed to save quiz: " + (error.response?.data?.message || error.message));
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const processData = (data) => {
            const newQuestions = [];
            let errorCount = 0;

            data.forEach((row, index) => {
                // Normalize keys to support slight variations or trim spaces
                // But standard template expects: Question, Answer, Option 1...

                // Basic Validation
                if (!row.Question || !row["Option 1"] || !row["Option 2"]) {
                    errorCount++;
                    return;
                }

                // Determine Correct Option Index
                const options = [
                    row["Option 1"],
                    row["Option 2"],
                    row["Option 3"] || "",
                    row["Option 4"] || ""
                ];

                let correctOption = 0;
                if (row["Answer"]) {
                    const ansMap = { 'A': 0, 'B': 1, 'C': 2, 'D': 3 };
                    const upperAns = row["Answer"].toString().trim().toUpperCase();
                    if (ansMap.hasOwnProperty(upperAns)) {
                        correctOption = ansMap[upperAns];
                    }
                }

                newQuestions.push({
                    question: row.Question,
                    type: 'mcq', // CSV currently supports only MCQ based on template
                    marks: parseInt(row.Marks) || 2,
                    options: options,
                    correctOption: correctOption.toString(), // Store as string for Radio Input matching
                    image: ''
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

        // Reset input
        e.target.value = '';
    };

    return (
        <form onSubmit={handleSubmit(handleFormSubmit, (errors) => console.log("Form Errors:", errors))} className="space-y-8">
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50 p-4 rounded-lg">
                <div className="md:col-span-2">
                    <Input label="Quiz Title" {...register('title')} error={errors.title?.message} placeholder="e.g., React Fundamentals" />
                </div>

                {/* Program Selection Check */}
                {programs && programs.length > 0 && (!programId || isEditing) && (
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Program</label>
                        <select
                            {...register('programId')}
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 outline-none bg-white"
                        >
                            <option value="">Select a Program</option>
                            {programs.map(p => (
                                <option key={p._id || p.id} value={p._id || p.id}>{p.title}</option>
                            ))}
                        </select>
                        {errors.programId && <p className="text-red-500 text-sm mt-1">{errors.programId.message}</p>}
                    </div>
                )}
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                        {...register('description')}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 outline-none"
                        rows={3}
                    />
                </div>
                <div>
                    <Input
                        label="Passing Score (%)"
                        type="number"
                        {...register('passingScore')}
                        error={errors.passingScore?.message}
                    />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Controller
                        name="startTime"
                        control={control}
                        render={({ field }) => (
                            <DateTimePicker
                                label="Start Time"
                                value={field.value}
                                onChange={field.onChange}
                                error={errors.startTime?.message}
                            />
                        )}
                    />
                    <Controller
                        name="endTime"
                        control={control}
                        render={({ field }) => (
                            <DateTimePicker
                                label="End Time"
                                value={field.value}
                                onChange={field.onChange}
                                error={errors.endTime?.message}
                                min={watch('startTime')}
                            />
                        )}
                    />
                </div>
            </div>

            {/* Questions Builder */}
            <div className="space-y-6">
                <div className="flex flex-col gap-2 border-b pb-2">
                    <div className="flex justify-between items-center">
                        <h4 className="text-lg font-bold text-secondary">Questions ({fields.length})</h4>
                        <div className="flex gap-2">
                            <label className="cursor-pointer inline-flex items-center px-3 py-2 border border-blue-500 border-dashed text-sm leading-4 font-medium rounded-md text-blue-700 bg-blue-50 hover:bg-blue-100">
                                <Icons.Upload size={16} className="mr-2" />
                                Import CSV/Excel
                                <input type="file" className="hidden" accept=".csv, .xlsx, .xls" onChange={handleFileUpload} onClick={(e) => { e.target.value = ''; }} />
                            </label>
                            <Button type="button" variant="outline" size="sm" onClick={() => append({ question: '', type: 'mcq', marks: 1, options: ['', '', '', ''], correctOption: 0 })}>
                                <Icons.Plus size={16} className="mr-1" /> Add Question
                            </Button>
                        </div>
                    </div>
                    <div className="bg-blue-50 p-2 rounded text-xs text-blue-800 border border-blue-100">
                        <p className="font-semibold">CSV/Excel Format Required:</p>
                        <code className="block mt-1 bg-white p-1 rounded border border-blue-200">
                            Question, Answer (A/B/C/D), Option 1, Option 2, Option 3, Option 4, Marks
                        </code>
                    </div>
                </div>

                {errors.questions && <p className="text-red-500 text-sm">{errors.questions.message}</p>}

                {fields.map((field, index) => {
                    // Watch field values for conditional rendering
                    const currentType = watch(`questions.${index}.type`);
                    const currentImage = watch(`questions.${index}.image`);

                    const handleImageUpload = async (e) => {
                        const file = e.target.files[0];
                        if (!file) return;

                        setUploadingQIndex(index);
                        try {
                            const res = await uploadQuizImage(file);
                            setValue(`questions.${index}.image`, res.url);
                        } catch (err) {
                            alert("Upload failed");
                        } finally {
                            setUploadingQIndex(null);
                        }
                    };

                    return (
                        <div key={field.id} className="bg-white border rounded-lg p-6 shadow-sm relative group">
                            <button
                                type="button"
                                onClick={() => remove(index)}
                                className="absolute top-4 right-4 text-gray-300 hover:text-red-500 transition-colors"
                            >
                                <Icons.Trash size={18} />
                            </button>

                            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-4">
                                <div className="md:col-span-8">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Question {index + 1}</label>
                                    <Input
                                        {...register(`questions.${index}.question`)}
                                        placeholder="Enter question text..."
                                        error={errors.questions?.[index]?.question?.message}
                                    />

                                    {/* Image Upload Area */}
                                    <div className="mt-2">
                                        {currentImage ? (
                                            <div className="relative inline-block mt-2">
                                                <img src={currentImage} alt="Question" className="h-32 rounded border" />
                                                <button
                                                    type='button'
                                                    onClick={() => setValue(`questions.${index}.image`, '')}
                                                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                                                >
                                                    <Icons.X size={12} />
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="mt-2">
                                                <label className="cursor-pointer inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                                                    <Icons.Upload size={16} className="mr-2" />
                                                    {uploadingQIndex === index ? 'Uploading...' : 'Upload Image'}
                                                    <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                                                </label>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                                    <select
                                        {...register(`questions.${index}.type`)}
                                        className="w-full px-3 py-2 border rounded-lg outline-none bg-white"
                                    >
                                        <option value="mcq">MCQ</option>
                                        <option value="text">Paragraph</option>
                                        <option value="file_upload">File Upload</option>
                                    </select>
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Marks</label>
                                    <Input
                                        type="number"
                                        {...register(`questions.${index}.marks`)}
                                        error={errors.questions?.[index]?.marks?.message}
                                    />
                                </div>
                            </div>

                            {currentType === 'mcq' && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {[0, 1, 2, 3].map((optIndex) => (
                                        <div key={optIndex} className="flex items-center gap-2">
                                            <div className="pt-2">
                                                <input
                                                    type="radio"
                                                    value={optIndex.toString()}
                                                    {...register(`questions.${index}.correctOption`)}
                                                    className="w-4 h-4 text-primary focus:ring-primary"
                                                />
                                            </div>
                                            <div className="flex-grow">
                                                <Input
                                                    placeholder={`Option ${optIndex + 1}`}
                                                    {...register(`questions.${index}.options.${optIndex}`)}
                                                    error={errors.questions?.[index]?.options?.[optIndex]?.message}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {currentType === 'text' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Reference Answer (For Grading)</label>
                                    <textarea
                                        {...register(`questions.${index}.correctAnswer`)}
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 outline-none"
                                        rows={3}
                                        placeholder="Enter the expected answer or keywords for the evaluator..."
                                    />
                                </div>
                            )}

                            {currentType === 'file_upload' && (
                                <div className="col-span-1 md:col-span-12">
                                    <div className="bg-blue-50 border border-blue-200 rounded p-4 text-sm text-blue-800 flex items-start gap-2">
                                        <Icons.Info size={18} className="mt-0.5 flex-shrink-0" />
                                        <div>
                                            <p className="font-semibold">File Upload Question</p>
                                            <p className="mt-1">
                                                Students will be asked to upload a file (PDF, Word, Excel, Zip, Image) as their answer.
                                                <br />
                                                <strong>Max Size:</strong> 5MB per file.
                                                <br />
                                                <em>Note: File upload questions require manual grading.</em>
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            <div className="flex justify-end pt-6 border-t">
                <Button type="submit" isLoading={isSubmitting} size="lg">
                    {isEditing ? 'Update Quiz' : 'Create Quiz'}
                </Button>
            </div>
        </form>
    );
}
