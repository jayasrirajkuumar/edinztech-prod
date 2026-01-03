import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { formatDate } from '../lib/dateUtils';
import { Icons } from '../components/icons/index';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import api, { publishCertificates, publishOfferLetters, exportPrograms, toggleProgramFeedback, deleteProgram } from '../lib/api';
import AdminTable from '../components/AdminTable';
import PublishResultsModal from '../components/PublishResultsModal';
import { getProgramStatus, getRegistrationStatus } from '../lib/programUtils';

export default function AdminPrograms() {
    const [searchTerm, setSearchTerm] = useState('');
    const [programs, setPrograms] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // Filters
    const [filterType, setFilterType] = useState('All');
    const [filterStatus, setFilterStatus] = useState('All');
    const [filterReg, setFilterReg] = useState('All');
    const [filterCert, setFilterCert] = useState('All');
    const [filterOffer, setFilterOffer] = useState('All');

    // Modal State
    const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
    const [publishResults, setPublishResults] = useState(null);

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            fetchPrograms();
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm]); // Removed filterType from here, filtering client-side for speed/derived logic

    const fetchPrograms = async () => {
        try {
            setIsLoading(true);
            const params = {};
            if (searchTerm) params.keyword = searchTerm;
            // Removed backend type filter to allow full client-side filtering with derived stats

            const { data } = await api.get('/programs', { params });
            setPrograms(data);
            setError(null);
        } catch (err) {
            console.error("Failed to fetch programs", err);
            setError("Failed to load programs");
        } finally {
            setIsLoading(false);
        }
    };

    // Derived Logic & Filtering
    const filteredPrograms = useMemo(() => {
        return programs.map(p => {
            // Enrich with derived data
            const status = getProgramStatus(p); // Upcoming, Ongoing, Completed
            const regStatus = getRegistrationStatus(p); // Open, Closing Soon, Closed

            const totalEnrollments = p.enrolledCount || 0;
            const publishedCount = p.publishedCertificatesCount || 0;
            let certStatus = 'Not Published';
            if (totalEnrollments > 0 && publishedCount === totalEnrollments) certStatus = 'Published';
            else if (publishedCount > 0) certStatus = 'Partially Published';

            const issuedOfferCount = p.issuedOfferLettersCount || 0;
            const offerStatus = issuedOfferCount > 0 ? 'Issued' : 'Not Issued';

            return { ...p, derived: { status, regStatus, certStatus, offerStatus } };
        }).filter(p => {
            // Apply Filters
            if (filterType !== 'All' && p.type !== filterType) return false;

            // Map 'Expired' filter to 'Completed' derived status
            if (filterStatus !== 'All') {
                if (filterStatus === 'Expired' && p.derived.status !== 'Completed') return false;
                if (filterStatus !== 'Expired' && p.derived.status !== filterStatus) return false;
            }

            if (filterReg !== 'All') {
                if (filterReg === 'Registration Open' && p.derived.regStatus === 'Closed') return false;
                if (filterReg === 'Registration Closed' && p.derived.regStatus !== 'Closed') return false;
            }

            if (filterCert !== 'All') {
                if (filterCert === 'Certificates Published' && p.derived.certStatus !== 'Published') return false;
                if (filterCert === 'Certificates Not Published' && p.derived.certStatus === 'Published') return false;
            }

            if (filterOffer !== 'All') {
                if (p.type !== 'Internship' && p.type !== 'Project') return true; // Offer/Acceptance filter
                if (filterOffer === 'Issued' && p.derived.offerStatus !== 'Issued') return false;
                if (filterOffer === 'Not Issued' && p.derived.offerStatus === 'Issued') return false;
            }

            return true;
        });
    }, [programs, filterType, filterStatus, filterReg, filterCert, filterOffer]);


    const handleExport = async () => {
        try {
            const response = await exportPrograms();
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'programs.csv');
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err) {
            console.error("Export failed", err);
            alert("Failed to export programs");
        }
    };

    const handlePublishCertificate = async (program) => {
        // 1. Check Gating Status
        if (!program.isFeedbackEnabled) {
            const enableGating = window.confirm(
                `Feedback Gating is currently DISABLED for "${program.title}".\n\n` +
                `Do you want to ENABLE it now?\n` +
                `• OK: Enable Gating (Certificates will be generated ONLY after feedback)\n` +
                `• Cancel: Keep Disabled (Certificates issued IMMEDIATELY to everyone)`
            );

            if (enableGating) {
                try {
                    await toggleProgramFeedback(program._id || program.id);
                    // Manually update local state to reflect change immediately for this transaction
                    program.isFeedbackEnabled = true;

                    // Also update the UI list
                    setPrograms(programs.map(p => {
                        if ((p._id || p.id) === (program._id || program.id)) {
                            return { ...p, isFeedbackEnabled: true };
                        }
                        return p;
                    }));
                    alert("Feedback Gating Enabled. Proceeding to Publish check...");
                } catch (e) {
                    console.error("Failed to enable gating", e);
                    alert("Failed to enable gating. Aborting.");
                    return;
                }
            } else {
                // If they cancelled, confirm they really want to publish UNGATED
                if (!window.confirm(`⚠️ FINAL WARNING: You are publishing WITHOUT feedback check.\n\nEveryone will get a certificate immediately. Are you sure?`)) {
                    return;
                }
            }
        } else {
            if (!window.confirm(`Are you sure you want to publish certificates for "${program.title}"?\n\nStudents without feedback will be marked as 'Pending'.`)) return;
        }

        try {
            const res = await publishCertificates(program._id || program.id);
            setPublishResults(res);
            setIsPublishModalOpen(true);
        } catch (err) {
            console.error("Failed to publish certificates", err);
            alert(err.response?.data?.message || 'Failed to publish certificates');
        }
    };

    const handlePublishOfferLetter = async (programId, title) => {
        if (!window.confirm(`Are you sure you want to publish Offer/Acceptance Letters for "${title}"?`)) return;

        const force = window.confirm("Do you want to REGENERATE existing offer letters? (Click Cancel to skip existing)");

        try {
            const res = await publishOfferLetters(programId, force);
            let msg = `${res.message} (Regen: ${force})`;
            if (res.failures && res.failures.length > 0) {
                msg += `\n\nFailures:\n${res.failures.join('\n')}`;
            }
            alert(msg);
        } catch (err) {
            console.error("Failed to publish offer letters", err);
            alert(err.response?.data?.message || 'Failed to publish offer letters');
        }
    };

    const handleToggleFeedback = async (program) => {
        const action = program.enableFeedback ? "DISABLE" : "ENABLE";
        if (!window.confirm(`Do you want to ${action} feedback submission for "${program.title}"?`)) return;

        try {
            await toggleProgramFeedback(program._id || program.id);
            setPrograms(programs.map(p => {
                if ((p._id || p.id) === (program._id || program.id)) {
                    return { ...p, enableFeedback: !p.enableFeedback };
                }
                return p;
            }));
        } catch (error) {
            console.error("Failed to toggle feedback", error);
            alert("Failed to update status");
        }
    };

    const handleDelete = async (id, title) => {
        if (!window.confirm(`Are you sure you want to delete the program "${title}"? This action cannot be undone.`)) return;

        try {
            await deleteProgram(id);
            setPrograms(programs.filter(p => (p._id || p.id) !== id));
            alert("Program deleted successfully");
        } catch (err) {
            console.error("Failed to delete program", err);
            alert("Failed to delete program: " + (err.response?.data?.message || err.message));
        }
    };

    if (isLoading && !programs.length) {
        return (
            <div className="space-y-6 animate-in fade-in duration-500">
                <div className="flex justify-between items-center contents-start">
                    <h1 className="text-2xl font-bold text-secondary">All Programs</h1>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => {
                            navigator.clipboard.writeText(`${window.location.origin}/feedback/public`);
                            alert("Public Feedback Link copied to clipboard!");
                        }} className="gap-2 border-gray-300 text-gray-700 bg-white hover:bg-gray-50">
                            <Icons.Link size={18} /> Feedback Link
                        </Button>
                        <Button variant="outline" onClick={handleExport} className="gap-2 border-gray-300 text-gray-700 bg-white hover:bg-gray-50">
                            <Icons.Download size={18} /> Export
                        </Button>
                        <Link to="/admin/programs/new">
                            <Button className="gap-2">
                                <Icons.Plus size={18} /> Add Program
                            </Button>
                        </Link>
                    </div>
                </div>
                <p>Loading programs...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="space-y-6 animate-in fade-in duration-500">
                <div className="flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-secondary">All Programs</h1>
                    <Link to="/admin/programs/new">
                        <Button className="gap-2">
                            <Icons.Plus size={18} /> Add Program
                        </Button>
                    </Link>
                </div>
                <p className="text-red-500">{error}</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h1 className="text-2xl font-bold text-secondary">All Programs</h1>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => {
                        navigator.clipboard.writeText(`${window.location.origin}/feedback/public`);
                        alert("Public Feedback Link copied to clipboard!");
                    }} className="gap-2 border-gray-300 text-gray-700 bg-white hover:bg-gray-50">
                        <Icons.Link size={18} /> Feedback Link
                    </Button>
                    <Button variant="outline" onClick={handleExport} className="gap-2 border-gray-300 text-gray-700 bg-white hover:bg-gray-50">
                        <Icons.Download size={18} /> Export
                    </Button>
                    <Link to="/admin/programs/new">
                        <Button className="gap-2">
                            <Icons.Plus size={18} /> Add Program
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col gap-4 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                <div className="flex gap-4">
                    <div className="relative flex-1">
                        <Icons.Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search programs..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="px-3 py-2 rounded-lg border border-gray-200 text-sm">
                        <option value="All">All Types</option>
                        <option value="Course">Courses</option>
                        <option value="Internship">Internships</option>
                        <option value="Workshop">Workshops</option>
                        <option value="Project">Projects</option>
                    </select>
                    <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="px-3 py-2 rounded-lg border border-gray-200 text-sm">
                        <option value="All">All Statuses</option>
                        <option value="Upcoming">Upcoming</option>
                        <option value="Ongoing">Ongoing</option>
                        <option value="Expired">Expired</option>
                    </select>
                    <select value={filterReg} onChange={(e) => setFilterReg(e.target.value)} className="px-3 py-2 rounded-lg border border-gray-200 text-sm">
                        <option value="All">Registration</option>
                        <option value="Registration Open">Open</option>
                        <option value="Registration Closed">Closed</option>
                    </select>
                    <select value={filterCert} onChange={(e) => setFilterCert(e.target.value)} className="px-3 py-2 rounded-lg border border-gray-200 text-sm">
                        <option value="All">Certificates</option>
                        <option value="Certificates Published">Published</option>
                        <option value="Certificates Not Published">Not Published</option>
                    </select>
                    {/* Only show/enable Offer filter if Internship is selected or mixed? Keep always visible for clarity. */}
                    <select value={filterOffer} onChange={(e) => setFilterOffer(e.target.value)} className="px-3 py-2 rounded-lg border border-gray-200 text-sm">
                        <option value="All">Letters (Offer/Acc)</option>
                        <option value="Issued">Issued</option>
                        <option value="Not Issued">Not Issued</option>
                    </select>
                </div>
            </div>

            <AdminTable headers={['Program Name', 'Status', 'Type', 'Enrolled', 'Cert Status', 'Offer Status', 'Template', 'Actions']}>
                {filteredPrograms.map(program => {
                    // Helpers for badges
                    const statusColors = {
                        'Upcoming': 'bg-blue-50 text-blue-600',
                        'Ongoing': 'bg-green-50 text-green-600',
                        'Completed': 'bg-gray-100 text-gray-600' // Expired status
                    };
                    const statusLabel = program.derived.status === 'Completed' ? 'Expired' : program.derived.status;

                    const regBadges = {
                        'Open': <span className="ml-2 text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded border border-green-200">Reg Open</span>,
                        'Closing Soon': <span className="ml-2 text-[10px] bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded border border-orange-200">Closing Soon</span>,
                        'Closed': <span className="ml-2 text-[10px] bg-red-50 text-red-700 px-1.5 py-0.5 rounded border border-red-100">Reg Closed</span>
                    };

                    const totalEnrollments = program.enrolledCount || 0;
                    const isExpired = program.derived.status === 'Completed';

                    // Certificate Badge
                    let certStatusBadge;
                    if (totalEnrollments === 0) {
                        certStatusBadge = <span className="text-xs font-medium text-gray-500 bg-white border border-gray-200 px-2 py-1 rounded-full">No Enrolls</span>;
                    } else if (program.derived.certStatus === 'Published') {
                        certStatusBadge = <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full border border-green-100">Published</span>;
                    } else if (program.derived.certStatus === 'Partially Published') {
                        certStatusBadge = <span className="text-xs font-medium text-orange-600 bg-orange-50 px-2 py-1 rounded-full border border-orange-100">Partial</span>;
                    } else {
                        certStatusBadge = <span className="text-xs font-medium text-gray-500 bg-gray-50 px-2 py-1 rounded-full border border-gray-200">Pending</span>;
                    }

                    // Disable Actions if Expired or no enrollments
                    const isCertActionDisabled = isExpired || totalEnrollments === 0 || program.derived.certStatus === 'Published';
                    const isOfferActionDisabled = isExpired || totalEnrollments === 0; // Offer can be re-issued usually, but sticking to "Disable actions if Expired" constraint.

                    return (
                        <tr key={program._id || program.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4">
                                <div className="flex items-center">
                                    <div className="font-medium text-secondary">{program.title}</div>
                                </div>


                                <div className="text-xs text-text-light mt-1">
                                    {formatDate(program.startDate)} - {formatDate(program.endDate)}
                                </div>
                            </td>
                            {/* Status Column */}
                            <td className="px-6 py-4">
                                <span className={`px-2 py-1 rounded text-xs font-semibold ${statusColors[program.derived.status] || 'bg-gray-50'}`}>
                                    {statusLabel}
                                </span>
                                <div className="mt-1">
                                    {regBadges[program.derived.regStatus]}
                                </div>
                                {program.registrationDeadline && new Date(program.registrationDeadline) > new Date() && (
                                    <div className="mt-1">
                                        <span className="text-[10px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded border border-purple-200 block w-fit font-medium">
                                            Ext. Open: {formatDate(program.registrationDeadline)}
                                        </span>
                                    </div>
                                )}
                            </td>
                            <td className="px-6 py-4">
                                <span className="text-sm text-text-light">{program.type}</span>
                                <div className="text-xs text-gray-400 mt-0.5">{program.mode} • {program.paymentMode === 'Paid' ? `₹${program.fee}` : 'Free'}</div>
                            </td>
                            <td className="px-6 py-4 text-sm text-text-light font-medium">{totalEnrollments}</td>

                            {/* Certificate Status Column */}
                            <td className="px-6 py-4">
                                {certStatusBadge}
                            </td>

                            {/* Offer/Acceptance Letter Status Column */}
                            <td className="px-6 py-4">
                                {['Internship', 'Project'].includes(program.type) ? (
                                    program.derived.offerStatus === 'Issued' ? (
                                        <span className={`text-xs font-medium px-2 py-1 rounded-full border ${program.type === 'Project' ? 'text-blue-600 bg-blue-50 border-blue-100' : 'text-green-600 bg-green-50 border-green-100'}`}>
                                            Issued
                                        </span>
                                    ) : (
                                        <span className="text-xs font-medium text-gray-400 bg-gray-50 px-2 py-1 rounded-full border border-gray-200">Not Issued</span>
                                    )
                                ) : (
                                    <span className="text-gray-300">-</span>
                                )}
                            </td>

                            {/* Template Column */}
                            <td className="px-6 py-4">
                                {['Internship', 'Project'].includes(program.type) && program.templateType ? (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 border-gray-300 border uppercase">
                                        {program.templateType}
                                    </span>
                                ) : (
                                    <span className="text-gray-300">-</span>
                                )}
                            </td>

                            <td className="px-6 py-4">
                                <div className="flex gap-2">
                                    <Link to={`/admin/programs/${program._id || program.id}/edit`}>
                                        <button className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-100" title="Edit Program">
                                            <Icons.Edit size={14} /> Edit
                                        </button>
                                    </Link>

                                    <button
                                        onClick={() => handleDelete(program._id || program.id, program.title)}
                                        className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium text-red-700 bg-red-50 border border-red-200 hover:bg-red-100"
                                        title="Delete Program"
                                    >
                                        <Icons.Trash size={14} /> Delete
                                    </button>

                                    {/* Certificate Publish Action */}
                                    <button
                                        onClick={() => !isCertActionDisabled && handlePublishCertificate(program)}
                                        className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium border transition-colors ${isCertActionDisabled ? 'text-gray-300 border-gray-100 cursor-not-allowed bg-gray-50' : 'text-yellow-700 bg-yellow-50 border-yellow-200 hover:bg-yellow-100'}`}
                                        title={isExpired ? "Program Expired" : "Publish Certificates"}
                                        disabled={isCertActionDisabled}
                                    >
                                        <Icons.Award size={14} /> Cert
                                    </button>

                                    <button
                                        onClick={() => handleToggleFeedback(program)}
                                        className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium border transition-all duration-200 ${program.enableFeedback
                                            ? 'bg-purple-600 text-white border-purple-600'
                                            : 'text-gray-500 bg-white border-gray-200 hover:bg-gray-50'
                                            }`}
                                        title="Toggle Feedback"
                                    >
                                        {program.enableFeedback ? <Icons.MessageCircle size={14} /> : <Icons.MessageSquare size={14} />} Feedback
                                    </button>

                                    {/* Offer/Acceptance Letter Action */}
                                    {['Internship', 'Project'].includes(program.type) && (
                                        <button
                                            onClick={() => !isOfferActionDisabled && handlePublishOfferLetter(program._id || program.id, program.title)}
                                            className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium border transition-colors ${isOfferActionDisabled ? 'text-gray-300 border-gray-100 cursor-not-allowed bg-gray-50' : 'text-purple-700 bg-purple-50 border-purple-200 hover:bg-purple-100'}`}
                                            title={isExpired ? "Program Expired" : `Publish ${program.type === 'Project' ? 'Acceptance' : 'Offer'} Letters`}
                                            disabled={isOfferActionDisabled}
                                        >
                                            <Icons.FileText size={14} /> {program.type === 'Project' ? 'Accept' : 'Offer'}
                                        </button>
                                    )}
                                </div>
                            </td>
                        </tr>
                    )
                })}
            </AdminTable>

            <PublishResultsModal
                isOpen={isPublishModalOpen}
                onClose={() => setIsPublishModalOpen(false)}
                results={publishResults}
            />

        </div>
    );
}