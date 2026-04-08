import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Icons } from './icons';
import logo from '../assets/logo.svg';
import inspire from '../assets/inspire.svg';

export default function AdminNavbar({ onToggleSidebar }) {
    const [user, setUser] = useState(null);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const navigate = useNavigate();
    const dropdownRef = useRef(null);

    useEffect(() => {
        const checkUser = () => {
            const userInfoString = localStorage.getItem('userInfo');
            if (userInfoString) {
                const userInfo = JSON.parse(userInfoString);
                setUser(userInfo?.user || userInfo);
            }
        };

        checkUser();
    }, []);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsProfileOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('userInfo');
        localStorage.removeItem('token');
        setUser(null);
        setIsProfileOpen(false);
        navigate('/login');
    };

    return (
        <nav className="w-full bg-white shadow-sm border-b border-gray-100 z-40 sticky top-0">
            <div className="w-full px-4 sm:px-6 lg:px-12">
                <div className="flex justify-between h-20">
                    <div className="flex items-center gap-6">
                        <button
                            onClick={onToggleSidebar}
                            className="lg:hidden text-gray-500 hover:text-primary focus:outline-none"
                        >
                            <Icons.Menu size={24} />
                        </button>
                        <Link to="/admin" className="flex items-center gap-2">
                            <img src={logo} alt="EdinzTech" className="h-16" />
                        </Link>
                        <span className="hidden lg:block text-xl font-bold text-gray-700">
                            Welcome to Admin Dashboard
                        </span>
                    </div>

                    <div className="flex items-center">
                        <div className="relative" ref={dropdownRef}>
                            <button
                                onClick={() => setIsProfileOpen(!isProfileOpen)}
                                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-text hover:text-primary transition-colors focus:outline-none"
                            >
                                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                    <Icons.User size={18} />
                                </div>
                                <div className="flex flex-col items-start hidden md:flex">
                                    <span className="leading-none">{user?.name || 'Admin'}</span>
                                </div>
                                <Icons.ChevronDown size={16} className={`transition-transform ${isProfileOpen ? 'rotate-180' : ''}`} />
                            </button>

                            {isProfileOpen && (
                                <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-100 py-2 z-50">
                                    <div className="px-4 py-3 border-b border-gray-50 bg-gray-50/50">
                                        <p className="text-sm font-medium text-gray-900">{user?.name || 'Admin'}</p>
                                        <p className="text-xs text-gray-500 mt-0.5">{user?.email || 'admin@edinztech.com'}</p>
                                    </div>

                                    <div className="border-t border-gray-100 mt-1 pt-1">
                                        <button
                                            onClick={handleLogout}
                                            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                                        >
                                            <Icons.LogOut size={16} />
                                            Logout
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="ml-4 pl-4 border-l border-gray-200 hidden md:block">
                            <button
                                onClick={() => {
                                    if (window.confirm('If you go back to the website, your account will be logged out. Are you sure?')) {
                                        localStorage.removeItem('userInfo');
                                        localStorage.removeItem('token');
                                        setUser(null);
                                        navigate('/');
                                    }
                                }}
                                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary bg-primary/10 rounded-full hover:bg-primary/20 transition-colors"
                            >
                                <Icons.ArrowLeft size={16} />
                                Back to Website
                            </button>
                        </div>

                        <div className="ml-4 pl-4 border-l border-gray-200 h-10 flex items-center hidden md:flex">
                            <img src={inspire} alt="Inspire" className="h-12" />
                        </div>
                    </div>
                </div>
            </div>
        </nav>
    );
}
