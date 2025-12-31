import { NavLink } from 'react-router-dom';
import { Icons } from './icons';

const SidebarItem = ({ to, icon: Icon, children, end }) => (
    <NavLink
        to={to}
        end={end}
        className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors duration-200 mb-1 ${isActive
                ? 'bg-blue-50 text-secondary font-medium border-r-2 border-secondary'
                : 'text-text hover:bg-gray-50 hover:text-secondary'
            }`
        }
    >
        {Icon && <Icon size={20} />}
        <span>{children}</span>
    </NavLink>
);

export default function AdminSidebar({ isOpen, onClose }) {
    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
    const user = userInfo.user || userInfo; // Handle nested structure

    return (
        <>
            {/* Mobile Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={onClose}
                />
            )}

            <aside className={`
                w-64 bg-white border-r border-gray-200 min-h-[calc(100vh-5rem)] lg:min-h-screen p-6 
                fixed lg:relative top-20 lg:top-0 left-0 z-40 h-[calc(100vh-5rem)] lg:h-screen overflow-y-auto transition-transform duration-300 ease-in-out
                ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
            `}>
                <div className="mb-8 flex items-center justify-between px-2">
                    <div className="flex items-center gap-2">
                        <Icons.ShieldCheck className="text-secondary" size={24} />
                        <h2 className="text-xl font-bold text-accent">Admin Panel</h2>
                    </div>
                    {/* Close button for mobile */}
                    <button onClick={onClose} className="lg:hidden text-gray-500 hover:text-gray-700">
                        <Icons.X size={20} />
                    </button>
                </div>
                <nav>
                    <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-2">Management</div>
                    <SidebarItem to="/admin" end icon={Icons.Home}>Dashboard</SidebarItem>
                    <SidebarItem to="/admin/programs" icon={Icons.Courses}>Programs</SidebarItem>
                    <SidebarItem to="/admin/invite" icon={Icons.UserPlus}>Invite Student</SidebarItem>
                    <SidebarItem to="/admin/enrollments" icon={Icons.Users}>Enrolled Students</SidebarItem>

                    <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 mt-6 px-2">Assessment</div>
                    <SidebarItem to="/admin/quizzes" icon={Icons.Quiz}>Quizzes</SidebarItem>

                    <SidebarItem to="/admin/feedbacks" icon={Icons.MessageSquare}>Feedbacks</SidebarItem>
                    <SidebarItem to="/admin/certificates" icon={Icons.Certificate}>Certificates</SidebarItem>

                    <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 mt-6 px-2">System</div>
                    <SidebarItem to="/admin/notifications" icon={Icons.Info}>Notifications</SidebarItem>
                </nav>


            </aside>
        </>
    );
}
