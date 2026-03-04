import { useState, useEffect } from 'react';
import { getAdminEnrollments, getStudentCredentials, resendStudentCredentials, resetStudentPassword, exportEnrollments, updateStudentDetails, regenerateCertificate, publishSingleCertificate } from '../lib/api'; // Updated import
import { formatDate } from '../lib/dateUtils';
import { Icons } from '../components/icons';
import Card from '../components/ui/Card';
import { useConfirm } from '../context/ConfirmContext';

export default function AdminEnrollments() {
    const { showAlert, showConfirm } = useConfirm();
    const [enrollments, setEnrollments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterType, setFilterType] = useState('All');
    const [filterProgram, setFilterProgram] = useState('All');
    const [searchTerm, setSearchTerm] = useState('');

    const [selectedStudent, setSelectedStudent] = useState(null); // For credentials modal
    const [editingStudent, setEditingStudent] = useState(null); // For edit modal
    const [editForm, setEditForm] = useState({ name: '', email: '', phone: '' });

    // Selection State
    const [selectedEnrollments, setSelectedEnrollments] = useState(new Set());
    const [isBulkPublishing, setIsBulkPublishing] = useState(false);

    // Toggle Selection
    const toggleSelection = (id) => {
        const newSet = new Set(selectedEnrollments);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setSelectedEnrollments(newSet);
    };

    const toggleSelectAll = (filteredData) => {
        if (selectedEnrollments.size === filteredData.length) {
            setSelectedEnrollments(new Set());
        } else {
            setSelectedEnrollments(new Set(filteredData.map(e => e._id)));
        }
    };

    // Single Publish
    const handlePublishSingle = async (enrollment) => {
        if (!enrollment.hasTemplate) {
            showAlert({
                title: "Template Required",
                message: "Please update/upload the certificate template for this program before publishing.",
                severity: "warning"
            });
            return;
        }

        if (!enrollment.isFeedbackSubmitted) {
            const force = await showConfirm({
                title: "Feedback Pending",
                message: `Warning: ${enrollment.studentName} has NOT submitted feedback.\nDo you want to force publish?`,
                severity: "warning"
            });
            if (!force) return;
        }

        const confirmed = await showConfirm({
            title: "Confirm Publication",
            message: `Publish certificate for ${enrollment.studentName}?`,
            severity: "info"
        });
        if (!confirmed) return;

        try {
            await publishSingleCertificate(enrollment._id, !enrollment.isFeedbackSubmitted); // Pass force=true if confirmed despite pending
            showAlert({
                title: "Success",
                message: "Certificate Published!",
                severity: "success"
            });
            fetchEnrollments();
        } catch (error) {
            showAlert({
                title: "Failed",
                message: error.response?.data?.message || "Failed to publish",
                severity: "danger"
            });
        }
    };

    // Bulk Publish
    const handleBulkPublish = async () => {
        const withTemplate = Array.from(selectedEnrollments).filter(id => {
            const e = enrollments.find(enroll => enroll._id === id);
            return e?.hasTemplate;
        });

        if (withTemplate.length === 0) {
            showAlert({
                title: "No Templates",
                message: "None of the selected students have a certificate template uploaded for their program.",
                severity: "warning"
            });
            return;
        }

        if (withTemplate.length < selectedEnrollments.size) {
            const proceed = await showConfirm({
                title: "Mixed Templates",
                message: `${selectedEnrollments.size - withTemplate.length} selected students belong to programs WITHOUT a certificate template.\nThey will be skipped. Proceed with the remaining ${withTemplate.length}?`,
                severity: "warning"
            });
            if (!proceed) return;
        }

        const confirmed = await showConfirm({
            title: "Bulk Publish",
            message: `Publish certificates for ${withTemplate.length} students?`,
            severity: "info"
        });
        if (!confirmed) return;

        setIsBulkPublishing(true);
        let success = 0;
        let diff = 0; // failed

        for (const id of withTemplate) {
            try {
                await publishSingleCertificate(id); // Standard publish (obeys gating)
                success++;
            } catch (e) {
                diff++;
            }
        }
        setIsBulkPublishing(false);
        showAlert({
            title: "Bulk Process Completed",
            message: `Success: ${success}\nFailed/Skipped (Pending Feedback): ${diff}`,
            severity: success > 0 ? "success" : "info"
        });
        fetchEnrollments();
        setSelectedEnrollments(new Set());
    };

    const handleResendCertificate = async (enrollmentId) => {
        const confirmed = await showConfirm({
            title: "Regenerate Certificate",
            message: "Are you sure you want to regenerate and resend this certificate?",
            severity: "warning"
        });
        if (!confirmed) return;
        try {
            await regenerateCertificate(enrollmentId);
            showAlert({
                title: "Success",
                message: "Certificate Regenerated and Sent!",
                severity: "success"
            });
        } catch (e) {
            showAlert({
                title: "Failed",
                message: e.response?.data?.message || "Failed to resend certificate",
                severity: "danger"
            });
        }
    };

    const [adminPassword, setAdminPassword] = useState('');
    const [credentials, setCredentials] = useState(null);
    const [credentialError, setCredentialError] = useState('');
    const [resendStatus, setResendStatus] = useState('');

    // Reset Password State
    const [isResetting, setIsResetting] = useState(false);
    const [newPassword, setNewPassword] = useState('');

    useEffect(() => {
        fetchEnrollments();
    }, [filterType, searchTerm]);

    const fetchEnrollments = async () => {
        setLoading(true);
        try {
            const data = await getAdminEnrollments({ type: filterType, search: searchTerm });
            setEnrollments(data);
        } catch (error) {
            console.error("Failed to fetch enrollments", error);
        } finally {
            setLoading(false);
        }
    };

    const handleExport = async () => {
        try {
            const response = await exportEnrollments({ type: filterType, search: searchTerm });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'enrollments.csv');
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err) {
            console.error("Export failed", err);
            alert("Failed to export enrollments");
        }
    };

    const handleViewCredentials = (student) => {
        setSelectedStudent(student);
        setCredentials(null);
        setAdminPassword('');
        setCredentialError('');
        setIsResetting(false); // Reset UI state
    };

    const handleEditStudent = (student) => {
        setEditingStudent(student);
        setEditForm({
            name: student.studentName,
            email: student.email,
            phone: student.phone !== 'N/A' ? student.phone : '',
            year: student.year || '',
            department: student.department || '',
            registerNumber: student.registerNumber || '',
            institutionName: student.institutionName || '',
            state: student.state || '',
            city: student.city || '',
            pincode: student.pincode || ''
        });
    };

    const handleUpdateStudent = async (e) => {
        e.preventDefault();
        if (!editingStudent) return;

        try {
            await updateStudentDetails(editingStudent.userId, editForm);
            alert('Student details updated successfully!');
            setEditingStudent(null);
            fetchEnrollments(); // Refresh list
        } catch (error) {
            console.error("Update failed", error);
            alert('Failed to update: ' + (error.response?.data?.message || 'Server Error'));
        }
    };

    const handleResendCredentials = async () => {
        setResendStatus('Sending...');
        try {
            await resendStudentCredentials(selectedStudent.userId, adminPassword);
            setResendStatus('Email Sent Successfully!');
            setTimeout(() => setResendStatus(''), 5000);
        } catch (err) {
            setResendStatus('Failed: ' + (err.response?.data?.message || 'Server Error'));
        }
    };

    const handleResetPassword = async () => {
        if (!newPassword || newPassword.length < 6) {
            alert("Password must be at least 6 characters.");
            return;
        }
        if (!window.confirm("Are you sure? This will change the user's password immediately.")) return;

        setResendStatus('Resetting...');
        try {
            await resetStudentPassword(selectedStudent.userId, newPassword, adminPassword);
            setResendStatus('Password Reset Successful!');
            setIsResetting(false);

            // Refresh credentials view locally so admin sees the new password immediately
            setCredentials(prev => ({
                ...prev,
                password: newPassword // Optimistic update
            }));

            setTimeout(() => setResendStatus(''), 5000);
        } catch (err) {
            setResendStatus('Reset Failed: ' + (err.response?.data?.message || 'Server Error'));
        }
    };

    const submitCredentialsView = async (e) => {
        e.preventDefault();
        setCredentialError('');
        try {
            const data = await getStudentCredentials(selectedStudent.userId, adminPassword);
            setCredentials(data);
        } catch (err) {
            setCredentialError(err.response?.data?.message || 'Verification Failed');
        }
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Enrolled Students</h1>
                <button
                    onClick={handleExport}
                    className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700 bg-white"
                >
                    <Icons.Download size={18} /> Export List
                </button>
                {selectedEnrollments.size > 0 && (
                    <button
                        onClick={handleBulkPublish}
                        disabled={isBulkPublishing}
                        className="flex items-center gap-2 px-4 py-2 border border-green-600 rounded-lg hover:bg-green-50 text-green-700 bg-white ml-2"
                    >
                        {isBulkPublishing ? 'Processing...' : `Publish Selected (${selectedEnrollments.size})`}
                    </button>
                )}
            </div>

            {/* Filters */}
            <div className="flex gap-4 mb-6">
                <select
                    className="p-2 border rounded"
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                >
                    <option value="All">All Types</option>
                    <option value="Course">Course</option>
                    <option value="Internship">Internship</option>
                    <option value="Workshop">Workshop</option>
                </select>

                <select
                    className="p-2 border rounded max-w-[200px]"
                    value={filterProgram}
                    onChange={(e) => setFilterProgram(e.target.value)}
                >
                    <option value="All">All Programs</option>
                    {/* Unique Programs */}
                    {[...new Set(enrollments.map(e => e.programName))].filter(Boolean).sort().map(name => (
                        <option key={name} value={name}>{name}</option>
                    ))}
                </select>

                <input
                    type="text"
                    placeholder="Search student or program..."
                    className="p-2 border rounded w-64"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {/* Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden overflow-x-auto">
                <table className="min-w-full">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left">
                                <input
                                    type="checkbox"
                                    onChange={() => toggleSelectAll(enrollments.filter(e => filterProgram === 'All' || e.programName === filterProgram))}
                                    checked={enrollments.length > 0 && selectedEnrollments.size === enrollments.filter(e => filterProgram === 'All' || e.programName === filterProgram).length}
                                />
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User ID</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email / Phone</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Program</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Feedback</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cert Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cert ID</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {loading ? (
                            <tr><td colSpan="9" className="text-center py-4">Loading...</td></tr>
                        ) : enrollments.length === 0 ? (
                            <tr><td colSpan="9" className="text-center py-4">No enrollments found.</td></tr>
                        ) : (
                            enrollments
                                .filter(e => filterProgram === 'All' || e.programName === filterProgram)
                                .map((enrollment, index) => {
                                    if (index === 0) console.log('DEBUG FRONTEND:', enrollment);
                                    return (
                                        <tr key={enrollment._id} className={selectedEnrollments.has(enrollment._id) ? 'bg-blue-50' : ''}>
                                            <td className="px-6 py-4">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedEnrollments.has(enrollment._id)}
                                                    onChange={() => toggleSelection(enrollment._id)}
                                                />
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                {enrollment.userCode || 'N/A'}
                                            </td>
                                            <td className="px-6 py-4 text-sm font-medium text-gray-900">
                                                {enrollment.studentName}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-500">
                                                <div>{enrollment.email}</div>
                                                <div className="text-xs">{enrollment.phone}</div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-500">
                                                {enrollment.programName}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                            ${enrollment.programType === 'Internship' ? 'bg-purple-100 text-purple-800' :
                                                        enrollment.programType === 'Workshop' ? 'bg-orange-100 text-orange-800' :
                                                            'bg-blue-100 text-blue-800'}`}>
                                                    {enrollment.programType}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {enrollment.amount}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                <span className="capitalize">{enrollment.status}</span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {enrollment.isFeedbackSubmitted ? (
                                                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                                        Submitted
                                                    </span>
                                                ) : (
                                                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                                                        Pending
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${enrollment.certificateStatus === 'PUBLISHED' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                                    {enrollment.certificateStatus === 'PUBLISHED' ? 'Published' : 'Yet to Publish'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                                                {enrollment.certificateStatus === 'PUBLISHED' ? (
                                                    <span
                                                        className="cursor-pointer hover:bg-gray-100 px-1 rounded"
                                                        onClick={() => navigator.clipboard.writeText(enrollment.certificateId)}
                                                        title="Click to copy"
                                                    >
                                                        {enrollment.certificateId}
                                                    </span>
                                                ) : '-'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {formatDate(enrollment.enrolledAt)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium flex gap-2">
                                                <button
                                                    onClick={() => handleViewCredentials(enrollment)}
                                                    className="text-indigo-600 hover:text-indigo-900 bg-indigo-50 px-3 py-1 rounded"
                                                >
                                                    View Credentials
                                                </button>
                                                <button
                                                    onClick={() => handleEditStudent(enrollment)}
                                                    className="text-blue-600 hover:text-blue-900 bg-blue-50 px-3 py-1 rounded"
                                                >
                                                    Edit
                                                </button>
                                                {enrollment.certificateStatus === 'PUBLISHED' && (
                                                    <button
                                                        onClick={() => handleResendCertificate(enrollment._id)}
                                                        className="text-purple-600 hover:text-purple-900 bg-purple-50 px-3 py-1 rounded"
                                                        title="Re-Generate PDF & Resend Email"
                                                    >
                                                        Re-Send
                                                    </button>
                                                )}
                                                {enrollment.certificateStatus !== 'PUBLISHED' && (
                                                    <button
                                                        onClick={() => handlePublishSingle(enrollment)}
                                                        className="text-green-600 hover:text-green-900 bg-green-50 px-3 py-1 rounded"
                                                        title="Publish Certificate"
                                                    >
                                                        Publish
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })
                        )}
                    </tbody>
                </table>
            </div>

            {/* Edit Student Modal */}
            {editingStudent && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full">
                        <h3 className="text-lg font-bold mb-4">Edit Student Details</h3>
                        <form onSubmit={handleUpdateStudent} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Name</label>
                                <input
                                    type="text"
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                    value={editForm.name}
                                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Email</label>
                                <input
                                    type="email"
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                    value={editForm.email}
                                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Phone</label>
                                <input
                                    type="text"
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                    value={editForm.phone}
                                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Institution Name</label>
                                    <input
                                        type="text"
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                        value={editForm.institutionName}
                                        onChange={(e) => setEditForm({ ...editForm, institutionName: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Department</label>
                                    <input
                                        type="text"
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                        value={editForm.department}
                                        onChange={(e) => setEditForm({ ...editForm, department: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Year</label>
                                    <input
                                        type="text"
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                        value={editForm.year}
                                        onChange={(e) => setEditForm({ ...editForm, year: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Register Number</label>
                                    <input
                                        type="text"
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                        value={editForm.registerNumber}
                                        onChange={(e) => setEditForm({ ...editForm, registerNumber: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-2">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">City</label>
                                    <input
                                        type="text"
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                        value={editForm.city}
                                        onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">State</label>
                                    <input
                                        type="text"
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                        value={editForm.state}
                                        onChange={(e) => setEditForm({ ...editForm, state: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Pincode</label>
                                    <input
                                        type="text"
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                        value={editForm.pincode}
                                        onChange={(e) => setEditForm({ ...editForm, pincode: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end gap-2 mt-4">
                                <button
                                    type="button"
                                    onClick={() => setEditingStudent(null)}
                                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                                >
                                    Save Changes
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Credential Modal */}
            {selectedStudent && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full">
                        <h3 className="text-lg font-bold mb-4">
                            {credentials ? 'Student Credentials' : 'Verify Admin Access'}
                        </h3>

                        {!credentials ? (
                            <form onSubmit={submitCredentialsView}>
                                <p className="mb-4 text-sm text-gray-600">
                                    Enter your admin password to view credentials for <b>{selectedStudent.studentName}</b>.
                                </p>
                                <input
                                    type="password"
                                    className="w-full border p-2 rounded mb-4"
                                    placeholder="Admin Password"
                                    value={adminPassword}
                                    onChange={e => setAdminPassword(e.target.value)}
                                    autoFocus
                                />
                                {credentialError && <p className="text-red-500 text-sm mb-4">{credentialError}</p>}
                                <div className="flex justify-end gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setSelectedStudent(null)}
                                        className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                                    >
                                        Verify & View
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <div className="space-y-3">
                                <div className="bg-gray-50 p-4 rounded border">
                                    <p className="text-sm text-gray-500">User ID</p>
                                    <p className="font-mono font-bold">{credentials.userCode}</p>
                                </div>
                                <div className="bg-gray-50 p-4 rounded border">
                                    <p className="text-sm text-gray-500">Username</p>
                                    <p className="font-mono">{credentials.username}</p>
                                </div>
                                <div className="bg-gray-50 p-4 rounded border">
                                    <p className="text-sm text-gray-500">Password</p>
                                    <div className="flex flex-col">
                                        <p className={`font-mono text-lg ${credentials.password === 'Not Available' || credentials.password?.startsWith('Error') ? 'text-gray-500 italic' : 'text-indigo-700 font-bold tracking-wider'}`}>
                                            {credentials.password}
                                        </p>
                                        {credentials.password === 'Not Available' && (
                                            <p className="text-xs text-gray-400 mt-1">
                                                This user set their own password, so it is encrypted and cannot be viewed.
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {isResetting ? (
                                    <div className="bg-red-50 p-4 rounded border border-red-200 mt-4">
                                        <h4 className="text-sm font-bold text-red-800 mb-2">Reset Password Override</h4>
                                        <p className="text-xs text-red-600 mb-3">
                                            This will change the student's password and save a copy for you to view later.
                                        </p>
                                        <input
                                            type="password"
                                            placeholder="Enter New Password (min 6 chars)"
                                            className="w-full border p-2 rounded mb-2 text-sm"
                                            value={newPassword}
                                            onChange={e => setNewPassword(e.target.value)}
                                        />
                                        <div className="flex justify-end gap-2 mt-2">
                                            <button
                                                onClick={() => setIsResetting(false)}
                                                className="px-3 py-1 text-xs text-gray-600 hover:bg-gray-200 rounded"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                onClick={handleResetPassword}
                                                className="px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
                                            >
                                                Confirm Reset
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-right mt-2">
                                        <button
                                            onClick={() => { setIsResetting(true); setNewPassword(''); }}
                                            className="text-xs text-red-600 hover:underline"
                                        >
                                            Reset / Override Password
                                        </button>
                                    </div>
                                )}

                                <div className="flex justify-between items-center mt-6">
                                    <div className="text-sm">
                                        {resendStatus && (
                                            <span className={resendStatus.includes('Failed') ? 'text-red-600' : 'text-green-600'}>
                                                {resendStatus}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={handleResendCredentials}
                                            className="px-4 py-2 border border-indigo-600 text-indigo-600 rounded hover:bg-indigo-50"
                                        >
                                            Resend Email
                                        </button>
                                        <button
                                            onClick={() => setSelectedStudent(null)}
                                            className="px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-900"
                                        >
                                            Close
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
