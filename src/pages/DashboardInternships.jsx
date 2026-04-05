import { useState, useEffect } from 'react';
import ProgramGrid from '../components/dashboard/ProgramGrid';
import Tabs from '../components/ui/Tabs';
import { getMyEnrollments } from '../lib/api';
import { getProgramStatus } from '../lib/programUtils';

export default function DashboardInternships() {
    const [internships, setInternships] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchInternships = async () => {
            try {
                const enrollments = await getMyEnrollments();
                const myInternships = enrollments
                    .filter(e => {
                        const type = e.programType || e.program?.type;
                        return type === 'Internship';
                    })
                    .map(e => ({
                        ...(e.program || {}),
                        enrollmentStatus: e.status, // rename to avoid conflict with derived status
                        status: e.status, // Keep for legacy
                        derivedStatus: getProgramStatus(e.program), // 'Upcoming', 'Ongoing', 'Completed'
                        progress: (() => {
                            const start = new Date(e.program?.startDate).getTime();
                            const end = new Date(e.program?.validUntil || e.program?.endDate).getTime();
                            const now = new Date().getTime();
                            if (isNaN(start) || isNaN(end)) return 0;
                            if (now < start) return 0;
                            if (now > end) return 100;
                            if (end === start) return 100;
                            return Math.round(((now - start) / (end - start)) * 100);
                        })()
                    }));
                setInternships(myInternships);
            } catch (err) {
                console.error("Failed to load internships", err);
            } finally {
                setLoading(false);
            }
        };

        fetchInternships();
    }, []);

    if (loading) return <div className="p-10 text-center">Loading...</div>;

    // Grouping
    const ongoing = internships.filter(i => i.derivedStatus === 'Ongoing');
    const upcoming = internships.filter(i => i.derivedStatus === 'Upcoming');
    const completed = internships.filter(i => i.derivedStatus === 'Completed');

    const tabs = [
        {
            label: `All (${internships.length})`,
            content: (
                <ProgramGrid
                    title="All Internships"
                    programs={internships}
                    type="internships"
                    emptyMessage="You haven't enrolled in any internships yet."
                />
            )
        },
        {
            label: `Ongoing (${ongoing.length})`,
            content: (
                <ProgramGrid
                    title="Ongoing Internships"
                    programs={ongoing}
                    type="internships"
                    emptyMessage="You have no ongoing internships."
                />
            )
        },
        {
            label: `Upcoming (${upcoming.length})`,
            content: (
                <ProgramGrid
                    title="Upcoming Internships"
                    programs={upcoming}
                    type="internships"
                    emptyMessage="You have no upcoming internships."
                />
            )
        },
        {
            label: `Completed (${completed.length})`,
            content: (
                <ProgramGrid
                    title="Completed Internships"
                    programs={completed}
                    type="internships"
                    emptyMessage="You have no completed internships yet."
                />
            )
        }
    ];

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between mb-4">
                <h1 className="text-2xl font-bold text-secondary">My Internships</h1>
            </div>
            <Tabs tabs={tabs} />
        </div>
    );
}