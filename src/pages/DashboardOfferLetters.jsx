import { useState, useEffect } from 'react';
import { Icons } from '../components/icons/index';
import Button from '../components/ui/Button';
import api from '../lib/api';

export default function DashboardOfferLetters() {
    const [offerLetters, setOfferLetters] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchOfferLetters = async () => {
            try {
                const { data } = await api.get('/certificates/me');
                // Filter for offer letters
                const filtered = data.filter(item =>
                    item.certificateId &&
                    (item.certificateId.startsWith('OFFER-') || item.certificateId.startsWith('ACCEPT-') ||
                        item.metadata?.type === 'offer-letter' || item.metadata?.type === 'acceptance-letter')
                );
                setOfferLetters(filtered);
            } catch (err) {
                console.error("Failed to load offer letters", err);
            } finally {
                setLoading(false);
            }
        };
        fetchOfferLetters();
    }, []);

    if (loading) return <div className="p-12 text-center text-gray-500">Loading offer letters...</div>;

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <h1 className="text-2xl font-bold text-secondary">My Offer & Acceptance Letters</h1>

            {offerLetters.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {offerLetters.map(letter => {
                        const isAcceptance = letter.certificateId?.startsWith('ACCEPT-') || letter.metadata?.type === 'acceptance-letter';
                        return (
                            <div key={letter._id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
                                <div className={`h-40 ${isAcceptance ? 'bg-blue-50' : 'bg-orange-50'} flex items-center justify-center relative`}>
                                    <Icons.FileText className={`${isAcceptance ? 'text-blue-300' : 'text-orange-300'} w-16 h-16`} />
                                    <div className="absolute inset-0 bg-black/5 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <Button size="sm" variant="secondary" onClick={() => window.open(letter.metadata?.fileUrl || '#', '_blank')}>
                                            View PDF
                                        </Button>
                                    </div>
                                </div>
                                <div className="p-4">
                                    <div className="flex justify-between items-start">
                                        <h3 className="font-bold text-lg text-secondary line-clamp-1">{letter.program?.title || (isAcceptance ? 'Project Acceptance' : 'Internship Offer')}</h3>
                                        <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full">Active</span>
                                    </div>
                                    <p className="text-xs font-medium text-gray-500 mt-0.5 mb-2">{isAcceptance ? 'Acceptance Letter' : 'Offer Letter'}</p>
                                    <p className="text-sm text-gray-500 mt-1">Issued on {new Date(letter.createdAt).toLocaleDateString()}</p>
                                    <p className="text-xs text-gray-400 font-mono mt-1">{letter.certificateId}</p>
                                    <div className="mt-4 flex gap-2">
                                        <Button
                                            size="sm"
                                            className="w-full flex items-center justify-center gap-2"
                                            onClick={() => {
                                                if (letter.metadata?.fileUrl) {
                                                    window.open(letter.metadata.fileUrl, '_blank');
                                                } else {
                                                    alert("File URL not found. Please contact support.");
                                                }
                                            }}
                                        >
                                            <Icons.Download size={16} />
                                            Download
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="text-center py-12 bg-white rounded-lg border border-dashed border-gray-300">
                    <Icons.FileText className="mx-auto h-12 w-12 text-gray-300" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No letters found</h3>
                    <p className="mt-1 text-sm text-gray-500">You haven't received any offer or acceptance letters yet.</p>
                </div>
            )}
        </div>
    );
}
