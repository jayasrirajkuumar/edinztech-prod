import { useState, useEffect } from 'react';
import ProgramGrid from '../components/dashboard/ProgramGrid';
import { getMyEnrollments } from '../lib/api';

export default function DashboardCourses() {
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCourses = async () => {
            try {
                const enrollments = await getMyEnrollments();
                // Filter for courses only? Or showing all Programs?
                // Assuming "Courses" tab shows Courses. "Internships" shows Internships.
                // Filter by type
                const myCourses = enrollments
                    .filter(e => e.program && e.program.type === 'Course')
                    .map(e => ({
                        ...e.program,
                        // Add enrollment specific fields if ProgramGrid supports them
                        status: e.status,
                        // Calculate Progress
                        progress: (() => {
                            const start = new Date(e.program.startDate).getTime();
                            const end = new Date(e.program.validUntil || e.program.endDate).getTime();
                            const now = new Date().getTime();
                            if (now < start) return 0;
                            if (now > end) return 100;
                            if (end === start) return 100;
                            return Math.round(((now - start) / (end - start)) * 100);
                        })()
                    }));

                setCourses(myCourses);
            } catch (err) {
                console.error("Failed to load courses", err);
            } finally {
                setLoading(false);
            }
        };

        fetchCourses();
    }, []);

    if (loading) return <div className="p-10 text-center">Loading...</div>;

    return (
        <ProgramGrid
            title="My Courses"
            programs={courses}
            type="courses"
            emptyMessage="You haven't enrolled in any courses yet."
        />
    );
}