import { Link, useLocation } from 'react-router-dom';
import logo from '../assets/logo.svg';

export default function Footer() {
    const location = useLocation();
    return (
        <footer className="bg-white border-t border-gray-200 pt-12 pb-8 mt-auto">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-8 mb-8">
                    {/* Brand Section */}
                    <div className="md:col-span-2">
                        <Link to="/" className="inline-block mb-4">
                            <img src={logo} alt="EdinzTech" className="h-12" />
                        </Link>
                        <div className="text-gray-500 mb-6 max-w-sm text-sm space-y-2">
                            <p>
                                EDINZ TECH Private Limited<br />
                                10th Floor, CITIUS A Block, Phase 1,<br />
                                Olympia Tech Park Plot No.1, SIDCO Industrial Estate,<br />
                                Guindy, Tamil Nadu, Chennai- 600032
                            </p>
                            <p>Mobile: +91 8667493679 | 9360505768</p>
                            <p>Email: projects@edinztech.com</p>
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Links</h3>
                        <ul className="space-y-2">
                            <li>
                                <Link to="/" className="text-gray-600 hover:text-primary transition-colors">Home</Link>
                            </li>
                            <li>
                                <Link to="/about" className="text-gray-600 hover:text-primary transition-colors">About Us</Link>
                            </li>
                            <li>
                                <Link to="/services" className="text-gray-600 hover:text-primary transition-colors">Services</Link>
                            </li>
                            <li>
                                <Link to="/process" className="text-gray-600 hover:text-primary transition-colors">Our Process</Link>
                            </li>
                            <li>
                                <Link to="/contact" className="text-gray-600 hover:text-primary transition-colors">Contact Us</Link>
                            </li>
                        </ul>
                    </div>

                    {/* Resources */}
                    <div>
                        <h3 className="text-lg font-bold text-gray-900 mb-4">Programs</h3>
                        <ul className="space-y-2">
                            <li>
                                <Link to="/courses" className="text-gray-600 hover:text-primary transition-colors">Courses</Link>
                            </li>
                            <li>
                                <Link to="/internships" className="text-gray-600 hover:text-primary transition-colors">Internships</Link>
                            </li>
                            <li>
                                <Link to="/workshops" className="text-gray-600 hover:text-primary transition-colors">Workshops</Link>
                            </li>
                        </ul>
                    </div>

                    {/* Verify Section */}
                    {/* Verify Section */}
                    {(location.pathname === '/' || location.pathname === '/contact' || location.pathname.startsWith('/dashboard')) && (
                        <div className="flex flex-col items-start justify-start">
                            <h3 className="text-lg font-bold text-gray-900 mb-4">Verify</h3>
                            <p className="text-sm text-gray-500 mb-4">
                                Validate certificates issued by EdinzTech.
                            </p>
                            <Link
                                to="/verify"
                                className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary text-white font-medium rounded-lg hover:bg-orange-600 transition-colors shadow-sm whitespace-nowrap"
                            >
                                Verify Certificate
                            </Link>
                        </div>
                    )}
                </div>

                {/* Bottom Bar */}
                <div className="border-t border-gray-100 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-gray-500 text-sm">© {new Date().getFullYear()} EdinzTech. All rights reserved.</p>
                    <div className="flex items-center gap-6">
                        <Link to="/terms" className="text-sm text-gray-500 hover:text-primary transition-colors">Terms of Service</Link>
                        <Link to="/privacy" className="text-sm text-gray-500 hover:text-primary transition-colors">Privacy Policy</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
