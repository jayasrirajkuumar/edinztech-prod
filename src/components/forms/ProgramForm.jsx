import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Input, TextArea } from '../ui/Input';
import Select from '../ui/Select';
import TimePicker from '../ui/TimePicker';
import Button from '../ui/Button';
import { Icons } from '../icons/index';
import { createProgram, uploadProgramTemplate, getWhatsAppTemplates, registerWhatsAppTemplate, uploadProgramBanner } from '../../lib/api';
import Modal from '../ui/Modal';
import { useNavigate } from 'react-router-dom';

// Helper Component for Template Upload
const TemplateUploader = ({ label, file, setFile, initialUrl, onRemove }) => {
    const [preview, setPreview] = useState(null);
    const [isImage, setIsImage] = useState(true);
    const [isDismissed, setIsDismissed] = useState(false);

    // Reset dismissed state if initialUrl changes (e.g. loading different program)
    useEffect(() => {
        setIsDismissed(false);
    }, [initialUrl]);

    // Effect to generate preview URL
    useEffect(() => {
        if (file) {
            // New file selected
            const objectUrl = URL.createObjectURL(file);
            setPreview(objectUrl);
            const isImg = file.type.startsWith('image/');
            setIsImage(isImg);
            return () => URL.revokeObjectURL(objectUrl);
        } else if (initialUrl && typeof initialUrl === 'string' && !isDismissed) {
            // Existing file from server
            let url = initialUrl.replace(/\\/g, '/');

            // Handle relative 'uploads/' path by prepending backend URL
            // This bypasses potential Vite proxy issues
            if (!url.startsWith('http')) {
                const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
                const SERVER_URL = API_URL.replace('/api', ''); // Get root 'http://localhost:5000'

                if (url.startsWith('/')) {
                    url = `${SERVER_URL}${url}`;
                } else {
                    url = `${SERVER_URL}/${url}`;
                }
            }

            setPreview(url);
            const lowerUrl = url.toLowerCase();
            setIsImage(lowerUrl.endsWith('.jpg') || lowerUrl.endsWith('.jpeg') || lowerUrl.endsWith('.png') || lowerUrl.endsWith('.webp'));
        } else {
            // No file (or dismissed)
            setPreview(null);
        }
    }, [file, initialUrl, label, isDismissed]);

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            // If user uploads a file, we are no longer in "dismissed" state for *that* file, 
            // but effectively we are ignoring initialUrl anyway because file takes precedence.
        }
    };

    const handleRemove = () => {
        setFile(null);
        setIsDismissed(true); // Don't show initialUrl anymore
        if (onRemove) onRemove();
    };

    // If we have a preview (either new file or existing), show it
    if (preview) {
        return (
            <div className="border border-gray-200 p-4 rounded-lg text-center relative bg-gray-50">
                <h4 className="font-medium text-gray-900 mb-2">{label}</h4>
                <div className="relative inline-block group">
                    {isImage ? (
                        <img
                            src={`${preview}${preview.startsWith('blob:') ? '' : `?v=${Date.now()}`}`}
                            alt={`${label} Preview`}
                            className="h-48 object-contain rounded-md border border-gray-300 bg-white"
                            onError={(e) => {
                                e.target.onerror = null;
                                setIsImage(false); // Fallback to file icon if image fails
                            }}
                        />
                    ) : (
                        <div className="h-48 w-48 flex flex-col items-center justify-center bg-white border border-gray-300 rounded-md">
                            <Icons.FileText size={48} className="text-blue-500 mb-2" />
                            <span className="text-sm text-gray-600 px-2 truncate w-full">
                                {file ? file.name : 'Document Template'}
                            </span>
                        </div>
                    )}
                    <button
                        type="button"
                        onClick={handleRemove}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600 transition-colors"
                        title="Remove File"
                    >
                        <Icons.Close size={16} />
                    </button>
                </div>
                <p className="text-xs text-gray-400 mt-2 truncate w-full px-2">
                    {file ? file.name : (initialUrl ? initialUrl.split(/[/\\]/).pop() : 'Current Template')}
                </p>
                {/* Add a specific "Change/Delete" hint if needed, but the X button works */}
            </div>
        );
    }

    // Default Upload State
    return (
        <div className="border border-dashed border-gray-300 p-6 rounded-lg text-center hover:bg-gray-50 transition-colors">
            <Icons.Certificate className="mx-auto h-10 w-10 text-gray-300 mb-2" />
            <h4 className="font-medium text-gray-900">{label}</h4>
            <p className="text-sm text-gray-500 mb-4">
                Upload template (JPG, PNG, DOC, DOCX)
            </p>
            <input
                type="file"
                accept=".jpg,.jpeg,.png,.doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                onChange={handleFileChange}
                className="hidden"
                id={`upload-${label.replace(/\s+/g, '-').toLowerCase()}`}
            />
            <label htmlFor={`upload-${label.replace(/\s+/g, '-').toLowerCase()}`}>
                <span className="inline-flex items-center justify-center font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 px-3 py-1.5 text-sm cursor-pointer shadow-sm">
                    Upload File
                </span>
            </label>
        </div>
    );
};

// --- Zod Schemas per Step ---

const step1Schema = z.object({
    title: z.string().min(3, 'Title is required (min 3 chars)'),
    description: z.string().min(10, 'Description is required (min 10 chars)'),
    type: z.enum(['Course', 'Internship', 'Workshop', 'Project']),
    code: z.string().optional(),
    startDate: z.string().min(1, 'Start Date is required'),
    endDate: z.string().min(1, 'End Date is required'),
    mode: z.enum(['Online', 'Offline', 'Hybrid']),
    startTime: z.string().optional(),
    endTime: z.string().optional(),
    registrationDeadline: z.string().optional(), // Last Date to Register
    extendedDate: z.string().optional(), // New Field: Extended Registration Date
});

const step2Schema = z.object({
    paymentMode: z.enum(['Paid', 'Free', 'Invite Only']),
    fee: z.union([z.string(), z.number()]).transform(val => String(val || '')).optional(),
    registrationLink: z.string().optional().or(z.literal('')),
}).refine((data) => {
    if (data.paymentMode === 'Paid') {
        return !!data.fee && !!data.registrationLink;
    }
    return true;
}, {
    message: "Fee and Registration Link are required for Paid programs",
    path: ["fee"], // Mark error on fee logic
});

const step3Schema = z.object({
    templateType: z.string().optional(),
});

const step4Schema = z.object({
    whatsappMessage: z.string().optional(),
    whatsappGroupLink: z.string().optional().or(z.literal('')),
    emailSubject: z.string().optional(),
    emailBody: z.string().optional(),
    welcomeEmailContent: z.string().optional(), // New field
    // WhatsApp Config Schema (Loose validation as structure is complex)
    whatsappConfig: z.any().optional()
});

// Combined Schema for final submission check if needed, but we rely on steps
const fullSchema = z.any(); // We validate per step

export default function ProgramForm({ defaultValues: initialValues, onSubmit: parentSubmit, isEditing = false, programId }) {
    const navigate = useNavigate();
    const [currentStep, setCurrentStep] = useState(0); // 0: Basic, 1: Payment, 2: Templates, 3: Communication
    const [bannerFile, setBannerFile] = useState(null); // New State
    const [offerLetterFile, setOfferLetterFile] = useState(null);
    const [certificateFile, setCertificateFile] = useState(null);
    const [waTemplates, setWaTemplates] = useState([]);

    useEffect(() => {
        const fetchTemplates = async () => {
            try {
                const data = await getWhatsAppTemplates();
                setWaTemplates(data);
            } catch (error) {
                console.warn("Failed to fetch WA templates:", error);
            }
        };
        fetchTemplates();
    }, []);
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        watch,
        control,
        setValue,
        trigger,
        getValues
    } = useForm({
        resolver: zodResolver(step1Schema.merge(step2Schema).merge(step3Schema).merge(step4Schema)),
        mode: 'onChange',
        shouldUnregister: false,
        defaultValues: initialValues || {
            type: 'Course',
            paymentMode: 'Paid',
            mode: 'Online',
            code: '',
            // Default Time: Current Time
            startTime: new Date().toLocaleTimeString('en-GB', { hour12: false, hour: '2-digit', minute: '2-digit' }),
            endTime: new Date(new Date().getTime() + 60 * 60 * 1000).toLocaleTimeString('en-GB', { hour12: false, hour: '2-digit', minute: '2-digit' })
        }
    });

    const programType = watch('type');
    const paymentMode = watch('paymentMode');

    // Sync Handler
    // Template Registration Handler
    const [isAddTemplateOpen, setIsAddTemplateOpen] = useState(false);
    const [newTemplate, setNewTemplate] = useState({ name: '', bodyPreview: '' });

    const handleAddTemplate = async (e) => {
        e.preventDefault();
        try {
            // Basic extraction of {{1}} for variables
            const matches = newTemplate.bodyPreview.match(/{{(\d+)}}/g);
            const variables = matches ? [...new Set(matches.map(m => m.replace(/{{|}}/g, '')))] : [];

            await registerWhatsAppTemplate({
                name: newTemplate.name,
                bodyPreview: newTemplate.bodyPreview,
                variables
            });

            // Refresh
            const data = await getWhatsAppTemplates();
            setWaTemplates(data);
            setIsAddTemplateOpen(false);
            setNewTemplate({ name: '', bodyPreview: '' });
            alert('Template added successfully!');
        } catch (err) {
            console.error(err);
            alert('Failed to add template');
        }
    };

    // Steps Configuration
    const steps = [
        { id: 'basic', label: 'Basic Info', icon: Icons.Info },
        { id: 'payment', label: 'Payment & Fee', icon: Icons.Fee },
        { id: 'templates', label: 'Templates', icon: Icons.Certificate },
        { id: 'communication', label: 'Communication', icon: Icons.Menu },
    ];

    const handleNext = async (e) => {
        e?.preventDefault(); // Prevent form submission

        let isValid = false;

        // Validating per step manually to avoid stale resolver closure issues
        if (currentStep === 0) {
            isValid = await trigger(['title', 'description', 'type', 'startDate', 'endDate', 'mode', 'startTime', 'endTime']);

            // Manual Date Logic Check
            if (isValid) {
                const sDate = getValues('startDate');
                const eDate = getValues('endDate');
                if (sDate && eDate) {
                    if (new Date(eDate) < new Date(sDate)) {
                        alert("Invalid Date Range: End Date cannot be before Start Date.");
                        return; // Stop here
                    }
                }
            }
        } else if (currentStep === 1) {
            isValid = await trigger(['paymentMode', 'fee']);
            // Manual check for Paid mode safety:
            if (isValid && paymentMode === 'Paid') {
                if (!getValues('fee')) {
                    await trigger('fee');
                    return;
                }
            }
        } else if (currentStep === 2) {
            // Updated logic for Project Acceptance Letter
            if ((programType === 'Internship' || programType === 'Project') && !offerLetterFile && !isEditing) {
                // For editing, we might already have a template, so strictly enforcing file upload might block updates without changing file.
                // Ideally we check if field is populated, but file input is uncontrolled.
                // We'll relax this for edit or assume user knows.
                // For now, keep strict for NEW, relax for EDIT if needed, or simple warning.
                // alert("Please upload an Offer Letter template for Internships.");
                // return;
            }
            isValid = true;
        }

        if (isValid) {
            setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
        }
    };

    const handleBack = () => {
        setCurrentStep((prev) => Math.max(prev - 1, 0));
    };

    const onSubmit = async (data) => {
        try {
            // 0. Manual Validation for Critical Fields (Dates)
            // Sometimes date inputs might trigger invalid date errors if not caught by schema on previous steps
            const start = new Date(data.startDate);
            const end = new Date(data.endDate);

            if (!data.startDate || isNaN(start.getTime())) {
                alert("Start Date is invalid or missing. Please check Basic Info.");
                setCurrentStep(0);
                return;
            }
            if (!data.endDate || isNaN(end.getTime())) {
                alert("End Date is invalid or missing. Please check Basic Info.");
                setCurrentStep(0);
                return;
            }

            // CRITICAL: Validate End Date must be after Start Date
            if (end < start) {
                alert("Invalid Date Range: End Date cannot be before Start Date.");
                setCurrentStep(0);
                return;
            }

            // 1. Prepare Data
            const payload = {
                ...data,
                fee: data.fee ? Number(data.fee) : 0,
                startDate: start.toISOString(), // Ensure ISO format
                endDate: end.toISOString(),
                // Unnested schedule fields to match Schema
                startTime: data.startTime,
                endTime: data.endTime,
                registrationDeadline: data.registrationDeadline ? new Date(data.registrationDeadline).toISOString() : null,
                communication: {
                    whatsappGroupLink: data.whatsappGroupLink,
                    whatsappMessage: data.whatsappMessage,
                    emailSubject: data.emailSubject,
                    emailBody: data.emailBody
                }
            };

            // Fix: Mongoose Map casting error if variableMapping is an array
            const fixMapping = (config) => {
                if (config && config.variableMapping) {
                    if (Array.isArray(config.variableMapping)) {
                        const map = {};
                        config.variableMapping.forEach((val, idx) => {
                            if (val) map[String(idx)] = val;
                        });
                        config.variableMapping = map;
                    }
                }
            };
            if (payload.whatsappConfig?.onEnrolled) fixMapping(payload.whatsappConfig.onEnrolled);
            if (payload.whatsappConfig?.onCompletion) fixMapping(payload.whatsappConfig.onCompletion);

            // IF PARENT SUBMIT PROVIDED (Edit Mode or Custom Handler)
            // IF PARENT SUBMIT PROVIDED (Edit Mode or Custom Handler)
            if (parentSubmit) {
                // Handle Uploads for Edit Mode
                if (isEditing && programId) {
                    if (offerLetterFile) {
                        try {
                            const uploadRes = await uploadProgramTemplate(programId, offerLetterFile);
                            if (uploadRes.path) {
                                payload.offerLetterTemplate = uploadRes.path;
                            }
                        } catch (err) {
                            console.error("Failed to upload offer letter", err);
                            // Optional: Alert user but continue? Or throw?
                        }
                    }
                    if (certificateFile) {
                        try {
                            const uploadRes = await uploadProgramTemplate(programId, certificateFile);
                            if (uploadRes.path) {
                                payload.certificateTemplate = uploadRes.path;
                            }
                        } catch (err) {
                            console.error("Failed to upload certificate", err);
                            alert("Certificate Upload Failed: " + (err.response?.data?.message || err.message));
                            return; // Stop submission
                        }
                    }
                    if (bannerFile) {
                        try {
                            await uploadProgramBanner(programId, bannerFile);
                            // Payload doesn't need to carry this as it's a separate endpoint/update usually, 
                            // unless we want to ensure it's set in state before parentSubmit closes modal?
                            // Since banner upload updates the program in DB directly via controller, we are good.
                        } catch (err) {
                            console.error("Failed to upload banner", err);
                        }
                    }
                }

                await parentSubmit(payload);
                return;
            }

            // --- DEFAULT CREATE LOGIC ---

            // 2. Create Program
            const response = await createProgram(payload); // Expects { success: true, program: {...} } or just program
            const newProgramId = response._id || response.program?._id;

            if (!newProgramId) throw new Error("Failed to get Program ID");

            // 3. Upload Templates & Update Program
            const updates = {};

            if (offerLetterFile) {
                const uploadRes = await uploadProgramTemplate(newProgramId, offerLetterFile);
                if (uploadRes.path) {
                    updates.offerLetterTemplate = uploadRes.path;
                }
            }
            if (certificateFile) {
                const uploadRes = await uploadProgramTemplate(newProgramId, certificateFile);
                if (uploadRes.path) {
                    updates.certificateTemplate = uploadRes.path;
                }
            }
            if (bannerFile) {
                const uploadRes = await uploadProgramBanner(newProgramId, bannerFile);
                if (uploadRes.bannerImage) { // assuming controller returns updated program
                    // updates.bannerImage = uploadRes.bannerImage; // Not needed if controller updates program directly, but good for consistency/if we were doing updateProgram call separately
                }
            }

            // If we have template updates, save them
            if (Object.keys(updates).length > 0) {
                // We need to import updateProgram at the top
                const { updateProgram } = await import('../../lib/api');
                await updateProgram(newProgramId, updates);
            }

            // 4. Redirect
            navigate('/admin/programs');
        } catch (error) {
            console.error("Submission Error:", error);
            alert("Failed to save program: " + (error.response?.data?.message || error.message));
        }
    };

    // Auto-generate Program Code if missing
    const currentCode = watch('code');
    useEffect(() => {
        if (programType && !currentCode) {
            const date = new Date();
            const typeCode = programType.toUpperCase().slice(0, 3);
            const uniqueNum = Math.floor(100 + Math.random() * 900); // Random 3-digit number
            const code = `EDZ-${date.getFullYear()}-${typeCode}-${uniqueNum}`;
            setValue('code', code, { shouldDirty: true, shouldTouch: true });
        }
    }, [programType, currentCode, setValue]);

    return (
        <div className="space-y-8 animate-in fade-in">

            {/* Step Indicators */}
            <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8 overflow-x-auto">
                    {steps.map((step, index) => {
                        const isCompleted = index < currentStep;
                        const isCurrent = index === currentStep;
                        return (
                            <div
                                key={step.id}
                                onClick={() => {
                                    if (index < currentStep || isEditing) {
                                        setCurrentStep(index);
                                    }
                                }}
                                className={`
                                    whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors
                                    ${(index < currentStep || isEditing) ? 'cursor-pointer hover:text-gray-700' : 'cursor-default'}
                                    ${isCurrent ? 'border-primary text-primary' :
                                        isCompleted ? 'border-success text-success' : 'border-transparent text-gray-400'}
                                `}
                            >
                                <step.icon size={16} />
                                {step.label}
                                {isCompleted && <Icons.Success size={14} />}
                            </div>
                        );
                    })}
                </nav>
            </div>

            {/* Form Content */}
            <form onSubmit={handleSubmit(onSubmit)} className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm min-h-[400px]">

                {/* Step 1: Basic Info */}
                {currentStep === 0 && (
                    <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Controller
                                name="type"
                                control={control}
                                render={({ field }) => (
                                    <Select
                                        label="Program Type"
                                        options={['Course', 'Internship', 'Workshop', 'Project']}
                                        error={errors.type?.message}
                                        {...field}
                                    />
                                )}
                            />
                            <Input
                                label="Program Code"
                                {...register('code')}
                                value={watch('code') || ''}
                                disabled
                                className="bg-gray-50 bg-opacity-50 text-gray-500 cursor-not-allowed"
                            />
                        </div>

                        <Input
                            label="Program Title"
                            {...register('title')}
                            error={errors.title?.message}
                        />

                        {/* Banner Image Upload */}
                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                            <h4 className="font-medium text-gray-900 mb-2">Program Banner / Poster (Optional)</h4>
                            <TemplateUploader
                                label="Banner Image"
                                file={bannerFile}
                                setFile={setBannerFile}
                                initialUrl={initialValues?.bannerImage}
                                onRemove={() => setBannerFile(null)}
                            />
                        </div>

                        <TextArea
                            label="Description"
                            {...register('description')}
                            rows={4}
                            error={errors.description?.message}
                        />

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <Input type="date" label="Start Date" {...register('startDate')} error={errors.startDate?.message} />
                            <Input type="date" label="End Date" {...register('endDate')} error={errors.endDate?.message} min={watch('startDate')} />
                            <Input
                                type="date"
                                label="Registration Deadline"
                                {...register('registrationDeadline')}
                                min={watch('startDate')}
                                max={watch('endDate')}
                            />
                            <Controller
                                name="mode"
                                control={control}
                                render={({ field }) => (
                                    <Select
                                        label="Mode"
                                        options={['Online', 'Offline', 'Hybrid']}
                                        error={errors.mode?.message}
                                        {...field}
                                    />
                                )}
                            />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Controller
                                name="startTime"
                                control={control}
                                render={({ field }) => (
                                    <TimePicker
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
                                    <TimePicker
                                        label="End Time"
                                        value={field.value}
                                        onChange={field.onChange}
                                        error={errors.endTime?.message}
                                    />
                                )}
                            />
                        </div>
                    </div>
                )}

                {/* Step 2: Payment */}
                {currentStep === 1 && (
                    <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                        <Controller
                            name="paymentMode"
                            control={control}
                            render={({ field }) => (
                                <Select
                                    label="Payment Mode"
                                    options={['Paid', 'Free', 'Invite Only']}
                                    {...field}
                                />
                            )}
                        />

                        {paymentMode === 'Paid' && (
                            <>
                                <Input
                                    label="Program Fee (₹)"
                                    type="number"
                                    {...register('fee')}
                                    error={errors.fee?.message}
                                />
                                <div className="bg-blue-50 text-blue-700 p-4 rounded-lg text-sm flex items-start gap-2">
                                    <Icons.Info className="w-5 h-5 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <p className="font-medium">Automatic Payment Processing</p>
                                        <p className="mt-1 text-blue-600">
                                            Payments are processed automatically via Razorpay during checkout.
                                            No manual payment links are required.
                                        </p>
                                    </div>
                                </div>
                            </>
                        )}
                        {errors.fee && <p className="text-danger text-sm">{errors.fee.message}</p>}
                    </div>
                )}

                {/* Step 3: Templates */}
                {currentStep === 2 && (
                    <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
                        {(programType === 'Internship' || programType === 'Project') && (
                            <TemplateUploader
                                label={programType === 'Internship' ? "Offer Letter Template" : "Acceptance Letter Template"}
                                file={offerLetterFile}
                                setFile={setOfferLetterFile}
                                initialUrl={initialValues?.offerLetterTemplate}
                                onRemove={() => {
                                    setOfferLetterFile(null);
                                }}
                            />
                        )}

                        <div className="space-y-4">
                            <TemplateUploader
                                label="Certificate Template"
                                file={certificateFile}
                                setFile={setCertificateFile}
                                initialUrl={initialValues?.certificateTemplate}
                                onRemove={() => setCertificateFile(null)}
                            />

                            {(programType === 'Internship' || programType === 'Project') && (
                                <div className="bg-white p-4 rounded-lg border border-gray-200">
                                    <h4 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
                                        <Icons.Settings size={16} /> Document Branding
                                    </h4>
                                    <p className="text-sm text-gray-500 mb-4">
                                        Select the underlying branding template for Offer/Acceptance Letters.
                                        (Used if no custom file is uploaded)
                                    </p>
                                    <div className="space-y-1">
                                        <label className="block text-sm font-medium text-gray-700">Template Branding</label>
                                        <select
                                            {...register('templateType')}
                                            className="w-full rounded-lg border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm p-2.5 border"
                                        >
                                            <option value="edinz">Edinz (Default)</option>
                                            <option value="inspire">Inspire</option>
                                            <option value="igreen">IGreen</option>
                                            <option value="ats">ATS</option>
                                        </select>
                                        <p className="text-xs text-gray-500">Auto-selects background for generated PDFs.</p>
                                    </div>
                                </div>
                            )}

                            {/* Live Preview Overlay */}
                            {(certificateFile || initialValues?.certificateTemplate) && (
                                <div className="mt-4 border rounded-lg p-2 bg-gray-50 text-center">
                                    <h4 className="text-sm font-medium text-gray-500 mb-2">Live Preview (Approximation)</h4>
                                    <div className="relative inline-block max-w-full overflow-hidden border shadow-sm mx-auto" style={{ width: '600px', aspectRatio: '1.414' }}>
                                        {/* Background Image: We need to get the preview URL again effectively. 
                                            Since TemplateUploader manages its own preview state, we should probably refactor or just regenerate the URL here for the preview.
                                            For simplicity, let's regenerate or use a helper if possible.
                                            Ideally, TemplateUploader should lift the preview URL up, but for now duplicate logic for preview:
                                        */}
                                        <img
                                            src={certificateFile ? URL.createObjectURL(certificateFile) : (initialValues?.certificateTemplate?.startsWith('http') ? initialValues.certificateTemplate : (initialValues?.certificateTemplate ? (initialValues.certificateTemplate.replace(/\\/g, '/').startsWith('/') ? initialValues.certificateTemplate.replace(/\\/g, '/') : '/' + initialValues.certificateTemplate.replace(/\\/g, '/')) : ''))}
                                            alt="Certificate Preview"
                                            className="w-full h-full object-contain"
                                        />

                                        {/* Name Overlay */}
                                        <div
                                            className="absolute transform -translate-x-1/2 -translate-y-1/2 whitespace-nowrap pointer-events-none"
                                            style={{
                                                left: `${watch('certificateConfig.name.x')}%`,
                                                top: `${watch('certificateConfig.name.y')}%`,
                                                fontSize: `${Math.max(10, (watch('certificateConfig.name.fontSize') / 2))}px`, // Scale down font for preview (assuming preview width ~600 vs actual 2000 => 30% ratio)
                                                color: watch('certificateConfig.name.color'),
                                                fontWeight: 'bold',
                                                fontFamily: 'sans-serif'
                                            }}
                                        >
                                            [Student Name]
                                        </div>

                                        {/* Program Name Overlay */}
                                        {watch('certificateConfig.programName.show') && (
                                            <div
                                                className="absolute transform -translate-x-1/2 -translate-y-1/2 whitespace-nowrap pointer-events-none"
                                                style={{
                                                    left: `${watch('certificateConfig.programName.x')}%`,
                                                    top: `${watch('certificateConfig.programName.y')}%`,
                                                    fontSize: `${Math.max(10, (watch('certificateConfig.programName.fontSize') / 2))}px`,
                                                    color: watch('certificateConfig.programName.color'),
                                                    fontWeight: 'bold',
                                                    fontFamily: 'sans-serif'
                                                }}
                                            >
                                                [Program Title]
                                            </div>
                                        )}

                                        {/* Reg Number Overlay */}
                                        {watch('certificateConfig.registrationNumber.show') && (
                                            <div
                                                className="absolute transform -translate-x-1/2 -translate-y-1/2 whitespace-nowrap pointer-events-none"
                                                style={{
                                                    left: `${watch('certificateConfig.registrationNumber.x')}%`,
                                                    top: `${watch('certificateConfig.registrationNumber.y')}%`,
                                                    fontSize: `${Math.max(8, (watch('certificateConfig.registrationNumber.fontSize') / 2))}px`,
                                                    color: watch('certificateConfig.registrationNumber.color'),
                                                    fontFamily: 'sans-serif'
                                                }}
                                            >
                                                [Reg. No]
                                            </div>
                                        )}

                                        {/* QR Overlay */}
                                        {watch('certificateConfig.qr.show') && (
                                            <div
                                                className="absolute border-2 border-dashed border-gray-400 bg-white/50 flex items-center justify-center text-xs text-gray-500"
                                                style={{
                                                    left: `${watch('certificateConfig.qr.x')}%`, // x is usually left edge? sharp uses left/top.
                                                    top: `${watch('certificateConfig.qr.y')}%`,
                                                    width: '45px', // Approx scaled size (150px * 0.3)
                                                    height: '45px'
                                                }}
                                            >
                                                QR
                                            </div>
                                        )}
                                    </div>
                                    <p className="text-xs text-gray-400 mt-1">Preview scales down font size for display.</p>
                                </div>
                            )}
                        </div>

                        {/* Certificate Configuration Designer */}
                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                            <h4 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
                                <Icons.Settings size={16} /> Certificate Layout Configuration
                            </h4>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <Input
                                    label="Name X Position (%)"
                                    type="number"
                                    {...register('certificateConfig.name.x', { valueAsNumber: true })}
                                    defaultValue={initialValues?.certificateConfig?.name?.x || 50}
                                />
                                <Input
                                    label="Name Y Position (%)"
                                    type="number"
                                    {...register('certificateConfig.name.y', { valueAsNumber: true })}
                                    defaultValue={initialValues?.certificateConfig?.name?.y || 40}
                                />
                                <Input
                                    label="Font Size (px)"
                                    type="number"
                                    {...register('certificateConfig.name.fontSize', { valueAsNumber: true })}
                                    defaultValue={initialValues?.certificateConfig?.name?.fontSize || 60}
                                />
                                <div className="flex flex-col gap-1">
                                    <label className="text-sm font-medium text-gray-700">Text Color</label>
                                    <input
                                        type="color"
                                        className="h-10 w-full rounded border cursor-pointer"
                                        {...register('certificateConfig.name.color')}
                                        defaultValue={initialValues?.certificateConfig?.name?.color || '#000000'}
                                    />
                                </div>
                            </div>

                            {/* Program Name Config */}
                            <div className="mt-4 border-t pt-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <input
                                        type="checkbox"
                                        id="showProg"
                                        {...register('certificateConfig.programName.show')}
                                        defaultChecked={initialValues?.certificateConfig?.programName?.show ?? false}
                                        className="rounded border-gray-300 text-primary focus:ring-primary"
                                    />
                                    <label htmlFor="showProg" className="text-sm font-medium text-gray-700">Include Program Name</label>
                                </div>
                                {watch('certificateConfig.programName.show') && (
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-in fade-in slide-in-from-top-2">
                                        <Input
                                            label="Prog Name X (%)"
                                            type="number"
                                            {...register('certificateConfig.programName.x', { valueAsNumber: true })}
                                            defaultValue={initialValues?.certificateConfig?.programName?.x || 50}
                                        />
                                        <Input
                                            label="Prog Name Y (%)"
                                            type="number"
                                            {...register('certificateConfig.programName.y', { valueAsNumber: true })}
                                            defaultValue={initialValues?.certificateConfig?.programName?.y || 55}
                                        />
                                        <Input
                                            label="Font Size (px)"
                                            type="number"
                                            {...register('certificateConfig.programName.fontSize', { valueAsNumber: true })}
                                            defaultValue={initialValues?.certificateConfig?.programName?.fontSize || 40}
                                        />
                                        <div className="flex flex-col gap-1">
                                            <label className="text-sm font-medium text-gray-700">Color</label>
                                            <input
                                                type="color"
                                                className="h-10 w-full rounded border cursor-pointer"
                                                {...register('certificateConfig.programName.color')}
                                                defaultValue={initialValues?.certificateConfig?.programName?.color || '#000000'}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Registration Number Config */}
                            <div className="mt-4 border-t pt-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <input
                                        type="checkbox"
                                        id="showReg"
                                        {...register('certificateConfig.registrationNumber.show')}
                                        defaultChecked={initialValues?.certificateConfig?.registrationNumber?.show ?? false}
                                        className="rounded border-gray-300 text-primary focus:ring-primary"
                                    />
                                    <label htmlFor="showReg" className="text-sm font-medium text-gray-700">Include Registration Number</label>
                                </div>
                                {watch('certificateConfig.registrationNumber.show') && (
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-in fade-in slide-in-from-top-2">
                                        <Input
                                            label="Reg No X (%)"
                                            type="number"
                                            {...register('certificateConfig.registrationNumber.x', { valueAsNumber: true })}
                                            defaultValue={initialValues?.certificateConfig?.registrationNumber?.x || 50}
                                        />
                                        <Input
                                            label="Reg No Y (%)"
                                            type="number"
                                            {...register('certificateConfig.registrationNumber.y', { valueAsNumber: true })}
                                            defaultValue={initialValues?.certificateConfig?.registrationNumber?.y || 60}
                                        />
                                        <Input
                                            label="Font Size (px)"
                                            type="number"
                                            {...register('certificateConfig.registrationNumber.fontSize', { valueAsNumber: true })}
                                            defaultValue={initialValues?.certificateConfig?.registrationNumber?.fontSize || 20}
                                        />
                                        <div className="flex flex-col gap-1">
                                            <label className="text-sm font-medium text-gray-700">Color</label>
                                            <input
                                                type="color"
                                                className="h-10 w-full rounded border cursor-pointer"
                                                {...register('certificateConfig.registrationNumber.color')}
                                                defaultValue={initialValues?.certificateConfig?.registrationNumber?.color || '#000000'}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="mt-4 border-t pt-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <input
                                        type="checkbox"
                                        id="showQr"
                                        {...register('certificateConfig.qr.show')}
                                        defaultChecked={initialValues?.certificateConfig?.qr?.show ?? true}
                                        className="rounded border-gray-300 text-primary focus:ring-primary"
                                    />
                                    <label htmlFor="showQr" className="text-sm font-medium text-gray-700">Include Verification QR Code</label>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <Input
                                        label="QR X Position (%)"
                                        type="number"
                                        {...register('certificateConfig.qr.x', { valueAsNumber: true })}
                                        defaultValue={initialValues?.certificateConfig?.qr?.x || 10}
                                    />
                                    <Input
                                        label="QR Y Position (%)"
                                        type="number"
                                        {...register('certificateConfig.qr.y', { valueAsNumber: true })}
                                        defaultValue={initialValues?.certificateConfig?.qr?.y || 75}
                                    />
                                </div>
                            </div>
                            <p className="text-xs text-gray-500 mt-2">
                                * Adjust percentages to position elements relative to the total image size.
                            </p>
                        </div>
                    </div>
                )
                }

                {/* Step 4: Communication */}
                {
                    currentStep === 3 && (
                        <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                            {/* WhatsApp Config Section */}
                            <div className="bg-green-50/50 p-4 border border-green-100 rounded-lg">
                                <div className="flex items-center gap-2 mb-4">
                                    <Icons.MessageSquare size={18} className="text-green-600" />
                                    <h4 className="font-medium text-green-900">WhatsApp Automation</h4>
                                </div>

                                <div className="space-y-4">
                                    {/* Enable Toggle */}
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            id="wa-enabled"
                                            {...register('whatsappConfig.onEnrolled.enabled')}
                                            className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                                        />
                                        <label htmlFor="wa-enabled" className="text-sm font-medium text-gray-700">
                                            Send Message on Enrollment
                                        </label>
                                    </div>

                                    {/* Show config if enabled */}
                                    {watch('whatsappConfig.onEnrolled.enabled') && (
                                        <div className="pl-6 space-y-4 animate-in fade-in slide-in-from-top-2">
                                            {/* Template Selector */}
                                            <div>
                                                <div className="flex justify-between items-center mb-1">
                                                    <label className="block text-sm font-medium text-gray-700">Select Template</label>
                                                    <button
                                                        type="button"
                                                        onClick={() => setIsAddTemplateOpen(true)}
                                                        className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
                                                        title="Manually Add Approved Template"
                                                    >
                                                        <Icons.Plus size={14} /> Add Template
                                                    </button>
                                                </div>
                                                <select
                                                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
                                                    {...register('whatsappConfig.onEnrolled.templateId')}
                                                >
                                                    <option value="">-- Select a Template --</option>
                                                    {waTemplates.map(t => (
                                                        <option key={t._id} value={t._id}>
                                                            {t.name}
                                                        </option>
                                                    ))}
                                                </select>
                                                {waTemplates.length === 0 && (
                                                    <p className="text-xs text-gray-500 mt-1">No templates found. Add one to get started.</p>
                                                )}
                                            </div>

                                            {/* Variable Mapping */}
                                            {watch('whatsappConfig.onEnrolled.templateId') && (() => {
                                                const selectedId = watch('whatsappConfig.onEnrolled.templateId');
                                                const template = waTemplates.find(t => t._id === selectedId);
                                                if (!template || !template.variables || template.variables.length === 0) return null;

                                                return (
                                                    <div className="bg-white p-3 rounded border border-gray-200">
                                                        <h5 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Map Variables</h5>
                                                        <div className="grid grid-cols-1 gap-2">
                                                            {template.variables.map((v, idx) => (
                                                                <div key={idx} className="flex items-center gap-2">
                                                                    <span className="text-sm text-gray-600 w-24 flex-shrink-0">
                                                                        {{
                                                                            // Try to be smart about variable display
                                                                            '1': '{{1}}', '2': '{{2}}'
                                                                        }[v] || `{{${v}}}`}
                                                                    </span>
                                                                    <span className="text-gray-400">→</span>
                                                                    <select
                                                                        className="flex-1 rounded-md border-gray-300 text-sm focus:border-green-500 focus:ring-green-500"
                                                                        {...register(`whatsappConfig.onEnrolled.variableMapping.${v}`)}
                                                                    >
                                                                        <option value="">-- Select Data Source --</option>
                                                                        <option value="student.name">Student Name</option>
                                                                        <option value="student.email">Student Email</option>
                                                                        <option value="program.title">Program Title</option>
                                                                        <option value="program.startDate">Start Date</option>
                                                                        <option value="program.whatsappGroupLink">WhatsApp Group Link</option>
                                                                    </select>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                );
                                            })()}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* WhatsApp Inputs Removed */}
                            <div className="border-t border-gray-100 my-4 pt-4">
                                <h4 className="font-medium text-secondary mb-3">Welcome Email Content</h4>
                                <p className="text-xs text-gray-500 mb-2">This content will be appended to the enrollment confirmation email.</p>
                                <TextArea
                                    label="Message Body"
                                    {...register('welcomeEmailContent')}
                                    placeholder="Enter any additional welcome message, instructions, or links here..."
                                    rows={6}
                                    className="mt-2"
                                />
                            </div>
                        </div>
                    )
                }

                {/* Navigation Actions */}
                <div className="flex items-center justify-end gap-4 mt-8 pt-6 border-t border-gray-100">
                    {currentStep > 0 && (
                        <Button type="button" variant="ghost" onClick={handleBack}>
                            Back
                        </Button>
                    )}

                    {currentStep < steps.length - 1 ? (
                        <Button type="button" onClick={handleNext}>
                            Next &rarr;
                        </Button>
                    ) : (
                        <Button type="submit" isLoading={isSubmitting}>
                            {isEditing ? 'Update Program' : 'Create Program'}
                        </Button>
                    )}
                </div>

            </form >
            {/* Add Template Modal */}
            <Modal isOpen={isAddTemplateOpen} onClose={() => setIsAddTemplateOpen(false)} title="Add WhatsApp Template">
                <form onSubmit={handleAddTemplate} className="space-y-4">
                    <div className="bg-yellow-50 text-yellow-800 p-3 rounded text-sm mb-4">
                        <strong>Important:</strong> Only add templates that are <b>APPROVED</b> in your 2desh Dashboard.
                        <br />Variable syntax: <code>{'{{1}}'}</code>, <code>{'{{2}}'}</code>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Template Name</label>
                        <input
                            type="text"
                            required
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                            value={newTemplate.name}
                            onChange={e => setNewTemplate({ ...newTemplate, name: e.target.value })}
                            placeholder="e.g. dec_intern"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Template Body</label>
                        <textarea
                            required
                            rows={3}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                            value={newTemplate.bodyPreview}
                            onChange={e => setNewTemplate({ ...newTemplate, bodyPreview: e.target.value })}
                            placeholder="Hello {{1}}, welcome to {{2}}..."
                        />
                    </div>
                    <div className="flex justify-end gap-2 mt-4">
                        <Button type="button" variant="ghost" onClick={() => setIsAddTemplateOpen(false)}>Cancel</Button>
                        <Button type="submit">Add Template</Button>
                    </div>
                </form>
            </Modal>
        </div >
    );
}
