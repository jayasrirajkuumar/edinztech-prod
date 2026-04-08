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
    const [imgError, setImgError] = useState(false);

    useEffect(() => {
        const fetchCertificate = async () => {
            try {
                if (!code) {
                    setError('Certificate code is missing from the URL.');
                    setLoading(false);
                    return;
                }

                const { data } = await api.get(`/certificates/verify/${code}`);
                
                // Validate response structure
                if (!data?.certificate) {
                    setError('Invalid certificate data received from server.');
                    setLoading(false);
                    return;
                }

                // Ensure critical fields exist
                if (!data.certificate.user || !data.certificate.program) {
                    setError('Certificate data is incomplete. Please try again or contact support.');
                    setLoading(false);
                    return;
                }

                setCertificate(data.certificate);
            } catch (err) {
                console.error("Failed to load certificate", err);
                
                if (err.response?.status === 404) {
                    setError('Certificate not found. Please check the certificate code and try again.');
                } else if (err.response?.status === 400) {
                    setError('Invalid certificate code.');
                } else if (err.message === 'Network Error') {
                    setError('Network error. Please check your internet connection and try again.');
                } else {
                    setError(err.response?.data?.message || 'Failed to load certificate. Please try again.');
                }
            } finally {
                setLoading(false);
            }
        };
        
        fetchCertificate();
    }, [code]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-100">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
                    <p className="text-gray-600">Loading Certificate...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-100">
                <div className="bg-white rounded-lg shadow-lg p-8 max-w-md text-center">
                    <Icons.AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
                    <h2 className="text-xl font-bold text-gray-800 mb-2">Certificate Error</h2>
                    <p className="text-gray-600 mb-6">{error}</p>
                    <div className="flex gap-2 justify-center">
                        <Button variant="outline" onClick={() => window.history.back()}>Go Back</Button>
                        <Button onClick={() => window.location.href = '/'}>Home</Button>
                    </div>
                </div>
            </div>
        );
    }

    // Additional safety check after loading completes
    if (!certificate) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-100">
                <div className="bg-white rounded-lg shadow-lg p-8 max-w-md text-center">
                    <Icons.AlertCircle className="mx-auto h-12 w-12 text-orange-500 mb-4" />
                    <h2 className="text-xl font-bold text-gray-800 mb-2">Unable to Display Certificate</h2>
                    <p className="text-gray-600 mb-6">The certificate data could not be loaded properly.</p>
                    <Button onClick={() => window.history.back()}>Go Back</Button>
                </div>
            </div>
        );
    }

    // Safe data extraction with fallbacks
    const cert = certificate;
    const user = cert.user || {};
    const program = cert.program || {};
    
    // Normalize certificate template path
    let templatePath = program.certificateTemplate;
    if (templatePath) {
        templatePath = templatePath.replace(/\\/g, '/');
        if (!templatePath.startsWith('/') && !templatePath.startsWith('http')) {
            templatePath = '/' + templatePath;
        }
    }

    const config = program.certificateConfig || {};

    // Helper for percentage based positioning
    const getStyle = (fieldConfig) => {
        if (!fieldConfig || fieldConfig.show === false) return { display: 'none' };
        return {
            position: 'absolute',
            left: `${fieldConfig.x || 0}%`,
            top: `${fieldConfig.y || 0}%`,
            fontSize: `${fieldConfig.fontSize || 16}px`,
            color: fieldConfig.color || '#000',
            transform: 'translate(-50%, -50%)',
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

                {/* Display Generated PDF if available */}
                {cert.fileUrl ? (
                    <div className="w-full h-screen">
                        <iframe
                            src={cert.fileUrl}
                            className="w-full h-full border-none"
                            title="Certificate"
                            onError={() => setImgError(true)}
                        />
                        {imgError && (
                            <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                                <p className="text-gray-600">Unable to load certificate PDF</p>
                            </div>
                        )}
                    </div>
                ) : (
                    /* Fallback Design */
                    <div className="w-full aspect-[1.414/1] relative p-12 text-center border-8 border-secondary/10 flex flex-col items-center justify-center select-none bg-white">
                        <div className="absolute top-8 left-8">
                            <div className="flex items-center gap-2 text-2xl font-bold text-primary">
                                <Icons.Award size={32} /> EdinzTech
                            </div>
                        </div>

                        <div className="absolute top-8 right-8 text-right">
                            <p className="text-gray-400 text-sm">Certificate ID</p>
                            <p className="font-mono text-gray-600 font-bold">{cert.certificateId || 'N/A'}</p>
                        </div>

                        <div className="space-y-6 max-w-3xl mx-auto z-10 w-full">
                            <h1 className="text-5xl font-serif text-secondary font-bold tracking-wide">CERTIFICATE</h1>
                            <p className="text-xl text-gray-500 uppercase tracking-widest">Of Completion</p>

                            <p className="text-gray-600 mt-8">This verifies that</p>
                            <h2 className="text-4xl font-bold text-primary italic font-serif my-4">
                                {user.name || "Student Name"}
                            </h2>

                            <p className="text-gray-600 text-lg">Has successfully completed the program</p>
                            <h3 className="text-3xl font-bold text-secondary my-4">
                                {program.title || "Program Title"}
                            </h3>

                            {program.code && (
                                <p className="text-gray-500 text-sm font-mono">
                                    Program Code: <span className="font-bold">{program.code}</span>
                                </p>
                            )}

                            <div className="grid grid-cols-2 gap-12 mt-12 text-center pt-12">
                                <div className="border-t border-gray-400 pt-2">
                                    <p className="font-bold text-gray-800 text-sm">
                                        {cert.issueDate ? formatDate(cert.issueDate) : new Date().toLocaleDateString()}
                                    </p>
                                    <p className="text-xs text-gray-500">Date Issued</p>
                                </div>
                                <div className="border-t border-gray-400 pt-2">
                                    <img 
                                        src="/signature-placeholder.png" 
                                        className="h-8 mx-auto opacity-50 mb-1" 
                                        alt="Signature" 
                                        onError={(e) => e.target.style.display = 'none'} 
                                    />
                                    <p className="text-xs text-gray-400 font-mono mt-1">{cert.certificateId || 'ID'}</p>
                                </div>
                            </div>
                        </div>

                        {/* QR Code */}
                        <div className="absolute bottom-8 right-8 w-24 h-24">
                            <img 
                                src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(window.location.href)}`} 
                                className="w-full h-full" 
                                alt="QR Code"
                                onError={(e) => e.target.style.display = 'none'}
                            />
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
