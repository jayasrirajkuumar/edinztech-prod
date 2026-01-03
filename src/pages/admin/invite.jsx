import { useState, useEffect } from 'react';
import InviteForm from '../../components/forms/InviteForm';
import { Icons } from '../../components/icons';
import api from '../../lib/api';
import { formatDate } from '../../lib/dateUtils';

export default function AdminInvitePage() {
    const [invitedStudents, setInvitedStudents] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchInvitedStudents();
    }, []);

    const fetchInvitedStudents = async () => {
        try {
            const { data } = await api.get('/admin/enrollments', { params: { source: 'invite' } });
            setInvitedStudents(data);
        } catch (error) {
            console.error("Failed to fetch invited students", error);
        } finally {
            setIsLoading(false);
        }
    };

    const filteredStudents = invitedStudents.filter(student =>
        student.studentName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.programName?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center gap-2 mb-2">
                <Icons.UserPlus className="text-primary bg-orange-50 p-1.5 rounded-lg w-10 h-10" />
                <div>
                    <h1 className="text-2xl font-bold text-secondary">Invite Student</h1>
                    <p className="text-sm text-gray-500">Add new users directly to programs.</p>
                </div>
            </div>

            <InviteForm onSuccess={fetchInvitedStudents} />

            {/* Invited Students Table */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden mt-8">
                <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-2">
                        <Icons.Users className="text-gray-400" size={20} />
                        <h2 className="font-semibold text-lg text-secondary">Invited Students History</h2>
                    </div>
                    <div className="relative">
                        <Icons.Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input
                            type="text"
                            placeholder="Search by name or email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9 pr-3 py-1.5 border border-gray-200 rounded-lg text-sm w-full sm:w-64 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50/50 text-xs uppercase text-gray-500 font-semibold">
                            <tr>
                                <th className="px-6 py-3">Name</th>
                                <th className="px-6 py-3">Email</th>
                                <th className="px-6 py-3">Program</th>
                                <th className="px-6 py-3">Invited Date</th>
                                <th className="px-6 py-3">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-sm">
                            {isLoading ? (
                                <tr><td colSpan="5" className="px-6 py-8 text-center text-gray-400">Loading history...</td></tr>
                            ) : filteredStudents.length === 0 ? (
                                <tr><td colSpan="5" className="px-6 py-8 text-center text-gray-400">No invited students found yet.</td></tr>
                            ) : (
                                filteredStudents.map((enrollment) => (
                                    <tr key={enrollment._id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-3 font-medium text-gray-900">
                                            {enrollment.studentName || <span className="text-gray-400 italic">Unknown</span>}
                                        </td>
                                        <td className="px-6 py-3 text-gray-500">{enrollment.email || '-'}</td>
                                        <td className="px-6 py-3">
                                            <span className="text-blue-600 bg-blue-50 px-2 py-0.5 rounded text-xs font-medium border border-blue-100">
                                                {enrollment.programName || 'Unknown Program'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-3 text-gray-500">
                                            {enrollment.enrolledAt ? formatDate(enrollment.enrolledAt) : '-'}
                                        </td>
                                        <td className="px-6 py-3">
                                            <span className="bg-green-50 text-green-700 border border-green-200 px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 w-fit">
                                                <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span> Invited
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
