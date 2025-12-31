import { Link } from 'react-router-dom';
import { Icons } from './icons';
import Button from './ui/Button';
import Card from './ui/Card';
import { getProgramStatus, getRegistrationStatus, getDurationString } from '../lib/programUtils';

export default function ProgramCard({ program, showStatus = false }) {
    // Backend API uses _id, type (instead of category)
    const id = program._id || program.id;
    const category = program.type || program.category || 'Course';

    // Format Price
    const price = program.paymentMode === 'Free'
        ? 'Free'
        : (program.fee ? `₹${program.fee}` : 'Paid');

    // Derived Data
    const durationString = getDurationString(program);
    const lifecycleStatus = getProgramStatus(program); // Upcoming, Ongoing, Completed
    const regStatus = getRegistrationStatus(program); // Open, Closing Soon, Closed

    // Determine Badge Color & Text based on priority
    // Priority: Completed > Registration Closed > Closing Soon > Upcoming/Ongoing default
    let badge = null;

    if (showStatus) {
        if (lifecycleStatus === 'Completed') {
            badge = <span className="bg-gray-100 text-gray-600 text-xs font-bold px-2 py-1 rounded">Completed</span>;
        } else if (regStatus === 'Closed') {
            badge = <span className="bg-red-50 text-red-600 text-xs font-bold px-2 py-1 rounded">reg. closed</span>;
        } else if (regStatus === 'Extended') {
            badge = <span className="bg-purple-100 text-purple-600 text-xs font-bold px-2 py-1 rounded border border-purple-200">Extended</span>;
        } else if (regStatus === 'Closing Soon') {
            badge = <span className="bg-orange-50 text-orange-600 text-xs font-bold px-2 py-1 rounded">Closing Soon</span>;
        } else if (lifecycleStatus === 'Ongoing') {
            badge = <span className="bg-green-50 text-green-600 text-xs font-bold px-2 py-1 rounded">In Progress</span>;
        } else {
            // Default for upcoming/open
            badge = <span className="bg-blue-50 text-blue-600 text-xs font-bold px-2 py-1 rounded">Open</span>;
        }
    }

    return (
        <Card className="hover:shadow-md transition-all duration-300 hover:-translate-y-1 h-full flex flex-col border-t-4 border-t-primary">
            <div className="flex justify-between items-start mb-4">
                <div className="flex gap-2">
                    <span className={`px-2 py-1 rounded text-xs font-semibold uppercase tracking-wide ${category === 'Course' ? 'bg-blue-50 text-blue-600' :
                        category === 'Internship' ? 'bg-indigo-50 text-indigo-600' : // Purple-ish for internships
                            'bg-orange-50 text-orange-600'
                        }`}>
                        {category}
                    </span>
                    {badge}
                </div>
                <div className="flex items-center gap-1 text-orange-400 text-sm font-medium">
                    <span>★</span>
                    <span>{program.rating || '4.8'}</span>
                </div>
            </div>
            <h3 className="text-xl font-bold text-secondary mb-2">{program.title}</h3>
            <p className="text-text-light text-sm mb-6 line-clamp-2 flex-grow">{program.description}</p>

            <div className="space-y-3 mb-6 pb-6 border-b border-gray-100">
                <div className="flex items-center gap-3 text-sm text-text-light">
                    <Icons.Duration size={16} className="text-primary" />
                    <span>{durationString}</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-text-light">
                    <Icons.Home size={16} className="text-primary" />
                    <span>{program.mode}</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-text-light">
                    <Icons.Fee size={16} className="text-primary" />
                    <span className="font-semibold text-secondary">{price}</span>
                </div>
                {/* Show Start Date if relevant */}
                {program.startDate && (
                    <div className="flex items-center gap-3 text-sm text-text-light">
                        <Icons.Date size={16} className="text-primary" />
                        <span>Starts {new Date(program.startDate).toLocaleDateString()}</span>
                    </div>
                )}
            </div>

            {/* Progress Bar (if available) */}
            {typeof program.progress === 'number' && (
                <div className="mb-4">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span>Progress</span>
                        <span className="font-semibold text-primary">{program.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden border border-gray-100">
                        <div
                            className="bg-primary h-full rounded-full transition-all duration-1000"
                            style={{ width: `${Math.min(100, Math.max(0, program.progress))}%` }}
                        ></div>
                    </div>
                </div>
            )}

            <Link to={`/programs/${id}`} className="w-full mt-auto">
                <Button
                    className={`w-full justify-between group ${regStatus === 'Closed' && lifecycleStatus !== 'Completed' ? 'opacity-80' : ''}`}
                    variant={regStatus === 'Closed' ? 'outline' : 'primary'}
                >
                    {lifecycleStatus === 'Completed' ? 'View Details' : (regStatus === 'Closed' ? 'View Details (Closed)' : 'View Details')}
                    <Icons.ChevronRight size={16} className={`group-hover:translate-x-1 transition-transform ${regStatus === 'Closed' ? 'text-gray-500' : 'text-white'}`} />
                </Button>
            </Link>
        </Card>
    );
}
