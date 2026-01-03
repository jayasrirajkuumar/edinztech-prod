import React from 'react';
import Modal from './ui/Modal';
import { regenerateCertificate } from '../lib/api';
import { formatDate } from '../lib/dateUtils';

export default function PublishResultsModal({ isOpen, onClose, results }) {
    if (!results) return null;

    const { newlyPublished = [], alreadyPublished = [], errors = [] } = results;

    const hasNew = newlyPublished.length > 0;
    const hasExisting = alreadyPublished.length > 0;
    const hasErrors = errors.length > 0;

    const handleResend = async (enrollmentId) => {
        if (!window.confirm("Are you sure you want to regenerate and resend this certificate?")) return;
        try {
            await regenerateCertificate(enrollmentId);
            alert("Certificate resent successfully!");
        } catch (error) {
            alert(error.response?.data?.message || "Failed to resend");
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Certificate Publish Results">
            <div className="space-y-6 max-h-[70vh] overflow-y-auto">

                {/* 1. New Certificates */}
                {hasNew && (
                    <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                        <h3 className="text-green-800 font-bold mb-2 flex items-center gap-2">
                            ✅ Certificates Published Successfully ({newlyPublished.length})
                        </h3>
                        <ul className="space-y-2 text-sm text-green-700">
                            {newlyPublished.map((item, idx) => (
                                <li key={idx} className="flex justify-between border-b border-green-200 pb-1 last:border-0 last:pb-0">
                                    <span>{item.studentName}</span>
                                    <span className="font-mono bg-white px-1 rounded border border-green-200 text-xs">
                                        {item.certificateId}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* 2. Already Issued */}
                {hasExisting && (
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                        <h3 className="text-blue-800 font-bold mb-2 flex items-center gap-2">
                            ℹ️ Certificates Already Issued ({alreadyPublished.length})
                        </h3>
                        <div className="text-xs text-blue-600 mb-2 italic">
                            These certificates were not re-generated.
                        </div>
                        <ul className="space-y-2 text-sm text-blue-700">
                            {alreadyPublished.map((item, idx) => (
                                <li key={idx} className="flex justify-between items-center border-b border-blue-200 pb-1 last:border-0 last:pb-0">
                                    <span>{item.studentName}</span>
                                    <div className="flex items-center gap-2">
                                        <div className="text-right">
                                            <div className="font-mono bg-white px-1 rounded border border-blue-200 text-xs inline-block">
                                                {item.certificateId}
                                            </div>
                                            <div className="text-[10px] text-blue-500">
                                                Issued: {formatDate(item.issuedAt)}
                                            </div>
                                        </div>
                                        {item.enrollmentId && (
                                            <button
                                                onClick={() => handleResend(item.enrollmentId)}
                                                className="bg-blue-600 hover:bg-blue-700 text-white text-[10px] px-2 py-1 rounded transition-colors"
                                            >
                                                Re-Send
                                            </button>
                                        )}
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* 3. Errors */}
                {hasErrors && (
                    <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                        <h3 className="text-red-800 font-bold mb-2">❌ Errors ({errors.length})</h3>
                        <ul className="list-disc list-inside text-sm text-red-600">
                            {errors.map((err, idx) => (
                                <li key={idx}>{err}</li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* 4. Pending Feedback (Gated) */}
                {results.pendingFeedback && results.pendingFeedback.length > 0 && (
                    <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                        <h3 className="text-yellow-800 font-bold mb-2 flex items-center gap-2">
                            ⚠️ Pending Feedback ({results.pendingFeedback.length})
                        </h3>
                        <div className="text-xs text-yellow-700 mb-2 italic">
                            These students have not submitted feedback. Certificates will be generated automatically once they submit.
                        </div>
                        <ul className="space-y-1 text-sm text-yellow-800">
                            {results.pendingFeedback.map((item, idx) => (
                                <li key={idx} className="flex justify-between border-b border-yellow-200 pb-1 last:border-0 last:pb-0">
                                    <span>{item.name} ({item.email})</span>
                                    <span className="text-xs opacity-70">Waiting for feedback</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Empty State */}
                {!hasNew && !hasExisting && !hasErrors && (!results.pendingFeedback || results.pendingFeedback.length === 0) && (
                    <div className="text-center text-gray-500 py-4">
                        No active enrollments found to process.
                    </div>
                )}

                <div className="flex justify-end pt-4">
                    <button
                        onClick={onClose}
                        className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </Modal>
    );
}
