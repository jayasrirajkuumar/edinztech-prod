import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { Html5Qrcode } from 'html5-qrcode';
import { Icons } from '../components/icons';

import Button from '../components/ui/Button';
import { formatDate } from '../lib/dateUtils';

export default function Verify() {
    const [searchParams] = useSearchParams();
    const codeFromUrl = searchParams.get('id') || searchParams.get('code');
    const [code, setCode] = useState(codeFromUrl || '');
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const [showScanner, setShowScanner] = useState(false);
    const scannerRef = useRef(null);

    useEffect(() => {
        if (codeFromUrl) {
            setCode(codeFromUrl);
            handleVerify(codeFromUrl);
        }
    }, [codeFromUrl]);

    // Handle QR Scanner Lifecycle (Core API)
    useEffect(() => {
        if (showScanner && !scannerRef.current) {
            const html5QrCode = new Html5Qrcode("reader");
            scannerRef.current = html5QrCode;

            const config = {
                fps: 15, // Smooth scanning
                qrbox: { width: 300, height: 300 }, // Larger scanning area
                experimentalFeatures: {
                    useBarCodeDetectorIfSupported: true
                }
            };

            // Auto-start camera
            html5QrCode.start(
                { facingMode: "environment" },
                config,
                onScanSuccess,
                onScanFailure
            ).catch(err => {
                console.error("Error starting scanner", err);
                setError("Camera access denied. Please ensure you are on HTTPS/localhost and grant permissions.");
                setShowScanner(false);
            });
        }

        return () => {
            // Cleanup handled via "Stop Scanning" button or unmount
        };
    }, [showScanner]);

    const stopScanner = async () => {
        if (scannerRef.current) {
            try {
                if (scannerRef.current.isScanning) {
                    await scannerRef.current.stop();
                }
                scannerRef.current.clear();
            } catch (err) {
                console.error("Failed to stop scanner", err);
            }
            scannerRef.current = null;
        }
        setShowScanner(false);
    };

    const [legacyInput, setLegacyInput] = useState('');

    const onScanSuccess = (decodedText) => {
        stopScanner(); // Stop scanning immediately on success

        console.log("Scanned:", decodedText);

        // 1. Check for URL format (e.g. http://.../verify?id=EDZ-...)
        // 1. Check for URL format (e.g. http://.../verify?id=EDZ-...)
        if (decodedText.includes('/verify')) {
            try {
                // Try parsing as URL first
                let certId = null;
                if (decodedText.startsWith('http')) {
                    const urlObj = new URL(decodedText);
                    certId = urlObj.searchParams.get('id') || urlObj.searchParams.get('certificateId');
                }

                // Fallback for simple string if URL parsing fails or partial
                if (!certId) {
                    if (decodedText.includes('id=')) certId = decodedText.split('id=')[1].split('&')[0];
                    else if (decodedText.includes('certificateId=')) certId = decodedText.split('certificateId=')[1].split('&')[0];
                }

                if (certId) {
                    setCode(certId);
                    // Decide which handler to use based on prefix
                    if (certId.startsWith('EDZ-')) {
                        handleVerifyNewArch(certId);
                    } else {
                        // CERT- and ISS- and others -> Unified Handler
                        handleVerify(certId);
                    }
                    return;
                }
            } catch (e) {
                console.error("QR Parse Error", e);
            }
        }

        // 2. New Architecture Strict QR Check (CERT: prefix)
        // If it starts with CERT:, it might be legacy or new, safer to route to Unified if format matches CERT-
        if (decodedText.startsWith('CERT:')) {
            const certId = decodedText.replace('CERT:', '');
            setCode(certId);
            if (certId.startsWith('EDZ-')) {
                handleVerifyNewArch(certId);
            } else {
                handleVerify(certId);
            }
            return;
        }

        // Reject everything else (Legacy ISS, etc.)
        setError("Invalid QR Code. Please scan a valid EdinzTech certificate.");
    };

    const onScanFailure = (error) => {
        // console.warn(`QR scan error = ${error}`);
    };

    const resolveAndVerifyLegacy = async (e) => {
        e.preventDefault();
        if (!legacyInput) return;

        setLoading(true);
        setError(null);
        setResult(null);

        try {
            const apiUrl = import.meta.env.VITE_API_URL || '';
            // Step 1: Resolve (Legacy -> ISS ID)
            const resolveRes = await axios.post(`${apiUrl}/api/certificates/resolve`, { qrInput: legacyInput });
            const resolvedId = resolveRes.data.certificateId;

            // Step 2: Verify
            // Update the MAIN code state so the result view shows the correct ID
            setCode(resolvedId);
            handleVerify(resolvedId);
        } catch (err) {
            setError("Could not find a valid certificate for this reference.");
            setLoading(false);
        }
    };

    const handleVerifyNew = (e) => {
        e.preventDefault();

        // Smart Routing
        const cleanInput = code.replace(/\s/g, '');
        // EDZ- goes to Strict New Arch (Certificate Collection Only)
        // CERT- and ISS- go to Unified (Enrollment + Legacy Collection)
        if (cleanInput.startsWith('EDZ-')) {
            handleVerifyNewArch(cleanInput);
        } else if (cleanInput.startsWith('ISS-') || cleanInput.startsWith('CERT-')) {
            handleVerify(cleanInput);
        } else {
            setError("Invalid Format. Please enter a valid ID starting with 'CERT-', 'EDZ-' or 'ISS-'.");
        }
    };

    const handleVerifyNewArch = async (certId) => {
        if (!certId) return;
        const cleanId = certId.replace(/\s/g, ''); // Remove ALL spaces
        setLoading(true);
        setError(null);
        setResult(null);

        try {
            const baseUrl = import.meta.env.VITE_API_URL || '';
            const apiUrl = baseUrl.endsWith('/api') ? baseUrl : `${baseUrl}/api`;
            const response = await axios.get(`${apiUrl}/certificates/new-certificates/verify/${cleanId}`);

            if (response.data.valid) {
                setResult(response.data);
            } else {
                setError('Invalid Certificate');
            }
        } catch (err) {
            setError(err.response?.data?.message || err.message || "Network Error");
        } finally {
            setLoading(false);
        }
    };

    const [debugInfo, setDebugInfo] = useState(null);

    const handleVerify = async (codeToVerify) => {
        if (!codeToVerify) return;
        const cleanCode = codeToVerify.replace(/[\s\u00A0]+/g, '').toUpperCase(); // Robust trim & Uppercase
        setLoading(true);
        setError(null);
        setResult(null);
        setDebugInfo(null);

        try {
            const baseUrl = import.meta.env.VITE_API_URL || '';
            const apiUrl = baseUrl.endsWith('/api') ? baseUrl : `${baseUrl}/api`;
            const requestUrl = `${apiUrl}/certificates/verify/${cleanCode}`;

            // console.log("Calling API:", requestUrl);
            const response = await axios.get(requestUrl);

            // Fix: Check for 'status' (Legacy/Unified) OR 'valid' (New Arch compat)
            if (response.data.status === 'VALID' || response.data.valid) {
                setResult(response.data);
            } else {
                setError(response.data.message || 'Invalid Certificate');
            }
        } catch (err) {
            const errorMsg = err.response?.data?.message || err.message || "Network Error";
            setError(errorMsg);
            setDebugInfo({
                url: `${import.meta.env.VITE_API_URL || ''}/api/certificates/verify/${cleanCode}`,
                status: err.response?.status,
                data: err.response?.data,
                message: err.message
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="max-w-xl w-full bg-white rounded-xl shadow-lg run-animation overflow-hidden">
                {/* Header */}
                <div className="bg-primary p-6 text-center text-white relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-700 opacity-90"></div>
                    <div className="relative z-10">
                        <Icons.Shield size={48} className="mx-auto mb-4" />
                        <h1 className="text-2xl font-bold">Certificate Verification</h1>
                        <p className="text-white/80 mt-2">Verify the authenticity of EdinzTech credentials</p>
                    </div>
                </div>

                <div className="p-8">
                    {/* Result View (Shared) */}
                    {result ? (
                        <div className="mt-2 animate-in slide-in-from-bottom-5 duration-500">
                            <div className="text-center mb-6">
                                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
                                    <Icons.CheckCircle className="w-8 h-8 text-green-600" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900">Verified & Authentic</h3>
                                <p className="text-gray-500 text-sm">Issued by EdinzTech</p>
                            </div>

                            <div className="bg-gray-50 rounded-lg border border-gray-200 divide-y divide-gray-200">
                                <div className="p-4 flex justify-between items-center">
                                    <span className="text-gray-500 text-sm">Student Name</span>
                                    <span className="font-semibold text-gray-900">{result.studentName}</span>
                                </div>
                                <div className="p-4 flex justify-between items-center">
                                    <span className="text-gray-500 text-sm">Course</span>
                                    <span className="font-semibold text-gray-900 text-right max-w-[60%]">{result.programName || result.courseName}</span>
                                </div>
                                <div className="p-4 flex justify-between items-center">
                                    <span className="text-gray-500 text-sm">Course Duration</span>
                                    <span className="font-medium text-gray-900">
                                        {result.courseStartDate && result.courseEndDate
                                            ? `${formatDate(result.courseStartDate, { day: '2-digit', month: 'short', year: 'numeric' })} - ${formatDate(result.courseEndDate, { day: '2-digit', month: 'short', year: 'numeric' })}`
                                            : formatDate(result.issueDate)}
                                    </span>
                                </div>
                                <div className="p-4 flex justify-between items-center">
                                    <span className="text-gray-500 text-sm">Certificate ID</span>
                                    <span className="font-mono text-sm bg-gray-200 px-2 py-1 rounded">{result.certificateId}</span>
                                </div>
                                {result.status === 'revoked' && (
                                    <div className="p-4 bg-red-50 text-red-700 text-center font-bold">
                                        REVOKED
                                    </div>
                                )}
                            </div>

                            <div className="mt-6 flex gap-3">
                                <Button variant="outline" className="flex-1" onClick={() => { setResult(null); setCode(''); setLegacyInput(''); }}>
                                    Verify Another
                                </Button>
                                {result.downloadUrl && (
                                    <a href={result.downloadUrl} target="_blank" rel="noopener noreferrer" className="flex-1">
                                        <Button className="w-full">
                                            Download PDF
                                        </Button>
                                    </a>
                                )}
                            </div>
                        </div>
                    ) : (
                        /* Input Sections */
                        <>
                            {showScanner ? (
                                <div className="mb-6 bg-black rounded-lg overflow-hidden relative animate-in fade-in">
                                    <div id="reader" className="w-full h-64 bg-black"></div>
                                    <Button
                                        variant="danger"
                                        size="sm"
                                        className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10"
                                        onClick={stopScanner}
                                    >
                                        Stop Scanning
                                    </Button>
                                </div>
                            ) : (
                                <div className="space-y-8">
                                    {/* Section 1: Verify New Certificate */}
                                    <div className="space-y-4">
                                        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                            <Icons.Award className="w-5 h-5 text-blue-600" />
                                            Verify New Certificate
                                        </h2>
                                        <form onSubmit={handleVerifyNew} className="space-y-3">
                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    value={code}
                                                    onChange={(e) => setCode(e.target.value)}
                                                    placeholder="Enter Certificate ID (EDZ-... or ISS-...)"
                                                    className="flex-1 px-4 py-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-blue-50/30"
                                                    required
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowScanner(true)}
                                                    className="p-2 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors bg-white text-blue-600"
                                                    title="Scan New QR Code"
                                                >
                                                    <Icons.QrCode className="w-6 h-6" />
                                                </button>
                                            </div>
                                            <Button type="submit" className="w-full">
                                                Verify
                                            </Button>
                                        </form>
                                    </div>

                                    <div className="relative">
                                        <div className="absolute inset-0 flex items-center">
                                            <span className="w-full border-t border-gray-200" />
                                        </div>
                                        <div className="relative flex justify-center text-xs uppercase">
                                            <span className="bg-white px-2 text-gray-500">OR</span>
                                        </div>
                                    </div>

                                    {/* Section 2: Find Your Old Certificate */}
                                    <div className="space-y-4">
                                        <h2 className="text-lg font-semibold text-gray-600 flex items-center gap-2">
                                            <Icons.History className="w-5 h-5 text-gray-500" />
                                            Find Your Old Certificate (Legacy)
                                        </h2>
                                        <form onSubmit={resolveAndVerifyLegacy} className="space-y-3">
                                            <input
                                                type="text"
                                                value={legacyInput}
                                                onChange={(e) => setLegacyInput(e.target.value)}
                                                placeholder="Enter your old certificate reference"
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-400 focus:border-gray-400 outline-none transition-all bg-gray-50"
                                                required
                                            />
                                            <Button type="submit" variant="secondary" className="w-full text-gray-700 bg-gray-200 hover:bg-gray-300">
                                                Resolve & Verify
                                            </Button>
                                        </form>
                                    </div>
                                </div>
                            )}

                            {/* Error Display */}
                            {error && (
                                <div className="mt-6 text-center animate-in zoom-in-95 duration-300">
                                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-100 mb-2">
                                        <Icons.XCircle className="w-6 h-6 text-red-600" />
                                    </div>
                                    <p className="text-red-600 font-medium">{error}</p>

                                    {debugInfo && (
                                        <div className="mt-4 p-3 bg-gray-100 rounded text-left text-xs font-mono text-gray-700 overflow-x-auto">
                                            <p className="font-bold text-gray-900 mb-1">Debug Info:</p>
                                            <p>URL: {debugInfo.url}</p>
                                            <p>Status: {debugInfo.status}</p>
                                            <p>Message: {debugInfo.message}</p>
                                            <pre className="mt-1">{JSON.stringify(debugInfo.data, null, 2)}</pre>
                                        </div>
                                    )}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}