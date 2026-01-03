import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../lib/api';
import { formatDate } from '../lib/dateUtils';
import { Icons } from '../components/icons/index';
import Button from '../components/ui/Button';

export default function CertificateView() {
    const { code } = useParams();
    const [certificate, setCertificate] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [imgError, setImgError] = useState(false); // Moved to top

    useEffect(() => {
        const fetchCertificate = async () => {
            try {
                // Use the verify endpoint as it returns the public data needed for the view
                const { data } = await api.get(`/certificates/verify/${code}`);
                setCertificate(data.certificate);
            } catch (err) {
                console.error("Failed to load certificate", err);
                setError("Certificate not found or invalid.");
            } finally {
                setLoading(false);
            }
        };
        fetchCertificate();
    }, [code]);

    if (loading) return <div className="flex items-center justify-center min-h-screen">Loading Certificate...</div>;
    if (error) return <div className="flex items-center justify-center min-h-screen text-red-500">{error}</div>;

    const cert = certificate;
    // Normalize path: handle backslashes and ensure logical root
    let templatePath = cert.program?.certificateTemplate;
    if (templatePath) {
        templatePath = templatePath.replace(/\\/g, '/');
        if (!templatePath.startsWith('/') && !templatePath.startsWith('http')) {
            templatePath = '/' + templatePath;
        }
    }

    const config = cert.program?.certificateConfig || {};

    // Helper for percentage based positioning
    const getStyle = (fieldConfig) => {
        if (!fieldConfig || fieldConfig.show === false) return { display: 'none' };
        return {
            position: 'absolute',
            left: `${fieldConfig.x}%`,
            top: `${fieldConfig.y}%`,
            fontSize: `${fieldConfig.fontSize}px`,
            color: fieldConfig.color || '#000',
            transform: 'translate(-50%, -50%)', // Center based on x/y
            whiteSpace: 'nowrap'
        };
    };

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4 print:p-0 print:bg-white">
            <div className="mb-4 print:hidden flex gap-4">
                <Button onClick={() => window.print()}>Print / Save as PDF</Button>
                <Button variant="outline" onClick={() => window.close()}>Close</Button>
            </div>

            {/* Certificate Container */}
            <div className="relative w-full max-w-[1123px] bg-white shadow-2xl print:shadow-none print:w-[100vw] print:h-[100vh] overflow-hidden group">

                {/* New Method: Display Generated PDF */}
                {cert.fileUrl ? (
                    <div className="w-full h-screen">
                        <iframe
                            src={cert.fileUrl}
                            className="w-full h-full border-none"
                            title="Certificate"
                        />
                    </div>
                ) : (
                    /* Fallback: Standard Design if no PDF is generated yet */
                    <div className="w-full aspect-[1.414/1] relative p-12 text-center border-8 border-secondary/10 flex flex-col items-center justify-center select-none bg-white">
                        <div className="absolute top-8 left-8">
                            <div className="flex items-center gap-2 text-2xl font-bold text-primary">
                                <Icons.Award size={32} /> EdinzTech
                            </div>
                        </div>

                        <div className="absolute top-8 right-8 text-right">
                            <p className="text-gray-400 text-sm">Certificate ID</p>
                            <p className="font-mono text-gray-600 font-bold">{cert.certificateId}</p>
                        </div>

                        <div className="space-y-6 max-w-3xl mx-auto z-10 w-full">
                            <h1 className="text-5xl font-serif text-secondary font-bold tracking-wide">CERTIFICATE</h1>
                            <p className="text-xl text-gray-500 uppercase tracking-widest">Of Completion</p>

                            <p className="text-gray-600 mt-8">This verifies that</p>
                            <h2 className="text-4xl font-bold text-primary italic font-serif my-4">
                                {cert.user?.name || "Student Name"}
                            </h2>

                            <p className="text-gray-600 text-lg">Has successfully completed the program</p>
                            <h3 className="text-3xl font-bold text-secondary my-4">
                                {cert.program?.title || "Program Title"}
                            </h3>

                            <div className="grid grid-cols-2 gap-12 mt-12 text-center pt-12">
                                <div className="border-t border-gray-400 pt-2">
                                    <p className="font-bold text-gray-800 text-sm">{formatDate(cert.issueDate)}</p>
                                    <p className="text-xs text-gray-500">Date Issued</p>
                                </div>
                                <div className="border-t border-gray-400 pt-2">
                                    <img src="/signature-placeholder.png" className="h-8 mx-auto opacity-50 mb-1" alt="" onError={(e) => e.target.style.display = 'none'} />
                                    <p className="text-xs text-gray-400 font-mono mt-1">{cert.certificateId}</p>
                                </div>
                            </div>
                        </div>

                        {/* Fallback QR */}
                        <div className="absolute bottom-8 right-8 w-24 h-24">
                            <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(window.location.href)}`} className="w-full h-full" alt="QR" />
                        </div>

                        {/* Decorative Elements */}
                        <div className="absolute bottom-0 left-0 w-full h-4 bg-primary"></div>
                        <div className="absolute bottom-4 left-0 w-full h-1 bg-secondary mx-auto w-[98%]"></div>
                    </div>
                )}
            </div>
        </div>
    );
}
