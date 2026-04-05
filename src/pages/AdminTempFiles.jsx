import { useState, useEffect } from 'react';
import { listTempFiles, deleteTempFiles } from '../lib/api';
import { Icons } from '../components/icons';
import Button from '../components/ui/Button';

export default function AdminTempFiles() {
    const [files, setFiles] = useState([]);
    const [stats, setStats] = useState({ count: 0, totalSize: '0.00 MB' });
    const [isLoading, setIsLoading] = useState(true);
    const [selectedFiles, setSelectedFiles] = useState(new Set());
    const [isDeleting, setIsDeleting] = useState(false);

    const fetchFiles = async () => {
        setIsLoading(true);
        try {
            const data = await listTempFiles();
            setFiles(data.files || []);
            setStats({
                count: data.count || 0,
                totalSize: data.totalSize || '0.00 MB'
            });
            setSelectedFiles(new Set()); // Reset selection on refresh
        } catch (error) {
            console.error("Failed to load temp files", error);
            alert("Failed to load file list");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchFiles();
    }, []);

    const toggleSelectAll = () => {
        if (selectedFiles.size === files.length) {
            setSelectedFiles(new Set());
        } else {
            const all = new Set(files.map(f => f.name));
            setSelectedFiles(all);
        }
    };

    const toggleSelect = (name) => {
        const newSet = new Set(selectedFiles);
        if (newSet.has(name)) {
            newSet.delete(name);
        } else {
            newSet.add(name);
        }
        setSelectedFiles(newSet);
    };

    const handleDelete = async () => {
        if (selectedFiles.size === 0) return;
        if (!confirm(`Are you sure you want to delete ${selectedFiles.size} files? This cannot be undone.`)) return;

        setIsDeleting(true);
        try {
            const filesToDelete = Array.from(selectedFiles);
            const res = await deleteTempFiles(filesToDelete);
            alert(res.message);
            fetchFiles(); // Refresh list
        } catch (error) {
            console.error("Delete failed", error);
            alert("Failed to delete selected files");
            setIsDeleting(false);
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleString();
    };

    if (isLoading) {
        return <div className="p-8 text-center text-gray-500">Loading system buffer...</div>;
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-2">
                    <Icons.Settings className="text-secondary bg-blue-50 p-1.5 rounded-lg w-10 h-10" />
                    <div>
                        <h1 className="text-2xl font-bold text-secondary">System Buffer</h1>
                        <p className="text-sm text-gray-500">Manage temporary files and cached certificates</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        onClick={fetchFiles}
                        className="flex items-center gap-2"
                    >
                        <Icons.Refresh size={16} /> Refresh
                    </Button>
                    {selectedFiles.size > 0 && (
                        <Button
                            className="bg-red-600 hover:bg-red-700 text-white flex items-center gap-2"
                            onClick={handleDelete}
                            disabled={isDeleting}
                        >
                            <Icons.Trash size={16} /> Delete Selected ({selectedFiles.size})
                        </Button>
                    )}
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-sm text-gray-500">Total Cached Files</p>
                        <p className="text-2xl font-bold text-gray-800">{stats.count}</p>
                    </div>
                    <div className="p-3 bg-blue-50 rounded-full text-blue-600">
                        <Icons.FileText size={20} />
                    </div>
                </div>
                <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-sm text-gray-500">Total Storage Used</p>
                        <p className="text-2xl font-bold text-gray-800">{stats.totalSize}</p>
                    </div>
                    <div className="p-3 bg-orange-50 rounded-full text-orange-600">
                        <Icons.Database size={20} /> {/* Assuming Database icon implies storage */}
                    </div>
                </div>
            </div>

            {/* File List Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto h-[400px] overflow-y-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b sticky top-0 z-10 shadow-sm">
                            <tr>
                                <th className="px-6 py-3 w-10">
                                    <input
                                        type="checkbox"
                                        checked={files.length > 0 && selectedFiles.size === files.length}
                                        onChange={toggleSelectAll}
                                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" // Tailwind forms plugin recommended
                                    />
                                </th>
                                <th className="px-6 py-3">File Name</th>
                                <th className="px-6 py-3">Size</th>
                                <th className="px-6 py-3">Created At</th>
                                <th className="px-6 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {files.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                                        No temporary files found. System is clean.
                                    </td>
                                </tr>
                            ) : (
                                files.map((file) => (
                                    <tr key={file.name} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <input
                                                type="checkbox"
                                                checked={selectedFiles.has(file.name)}
                                                onChange={() => toggleSelect(file.name)}
                                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                            />
                                        </td>
                                        <td className="px-6 py-4 font-medium text-gray-900 truncate max-w-xs" title={file.name}>
                                            {file.name}
                                        </td>
                                        <td className="px-6 py-4 text-gray-600 font-mono">
                                            {file.size}
                                        </td>
                                        <td className="px-6 py-4 text-gray-600">
                                            {formatDate(file.created)}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={async () => {
                                                    if (confirm(`Delete ${file.name}?`)) {
                                                        await deleteTempFiles([file.name]);
                                                        fetchFiles();
                                                    }
                                                }}
                                                className="text-red-600 hover:text-red-900 font-medium text-xs border border-red-200 hover:bg-red-50 px-2 py-1 rounded"
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex gap-3">
                    <Icons.AlertCircle className="text-yellow-600 flex-shrink-0" />
                    <div>
                        <h4 className="font-medium text-yellow-800">Note regarding cleanup</h4>
                        <p className="text-sm text-yellow-700 mt-1">
                            Deleting files here does NOT delete the certificate record from the database.
                            You can always regenerate any certificate from the Enrollments page.
                            These are just temporary cached copies.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
