import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Icons } from '../components/icons/index';
import Button from '../components/ui/Button';
import api from '../lib/api';
import { formatDate } from '../lib/dateUtils';

export default function DashboardCertificates() {
    const [certificates, setCertificates] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCertificates = async () => {
            try {
                const { data } = await api.get('/certificates/me');
                const filtered = data.filter(item =>
                    item.certificateId &&
                    !item.certificateId.startsWith('OFFER-') &&
                    item.metadata?.type !== 'offer-letter'
                );
                setCertificates(filtered);
            } catch (err) {
                console.error("Failed to load certificates", err);
            } finally {
                setLoading(false);
            }
        };
        fetchCertificates();
    }, []);

    if (loading) return <div className="p-12 text-center text-gray-500">Loading certificates...</div>;

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-secondary">My Certificates</h1>
                <Link to="/verify">
                    <Button size="sm" className="flex items-center gap-2">
                        <Icons.Verify size={16} />
                        Verify Certificate
                    </Button>
                </Link>
            </div>

            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 rounded-r">
                <p className="text-xs text-yellow-800">
                    <strong>Important:</strong> Ensure your <strong>Register Number, Name, and College Name</strong> are correct in your profile settings. These details will be printed on your certificate.
                </p>
            </div>

            {certificates.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {certificates.map(cert => (
                        <div key={cert._id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
                            <div className="h-40 bg-gray-100 flex items-center justify-center relative">
                                <Icons.Award className="text-gray-300 w-16 h-16" />
                                <div className="absolute inset-0 bg-black/5 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                                    {/* Link to view/verify logic later */}
                                    <Button size="sm" variant="secondary">View Details</Button>
                                </div>
                            </div>
                            <div className="p-4">
                                <h3 className="font-bold text-lg text-secondary line-clamp-1">{cert.program?.title || 'Certificate'}</h3>
                                <p className="text-sm text-gray-500 mt-1">Issued on {formatDate(cert.issueDate)}</p>
                                <p className="text-xs text-gray-400 font-mono mt-1">{cert.certificateId}</p>
                                <div className="mt-4 flex gap-2">
                                    <Button
                                        size="sm"
                                        className="w-full flex items-center justify-center gap-2"
                                        onClick={() => window.open(`/certificate/view/${cert.certificateId}`, '_blank')}
                                    >
                                        <Icons.Download size={16} />
                                        Download
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-12 bg-white rounded-lg border border-dashed border-gray-300">
                    <Icons.Award className="mx-auto h-12 w-12 text-gray-300" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No certificates yet</h3>
                    <p className="mt-1 text-sm text-gray-500">Complete a program to earn your first certificate.</p>
                </div>
            )}
        </div>
    );
}
