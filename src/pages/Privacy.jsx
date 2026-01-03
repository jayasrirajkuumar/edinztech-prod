import { formatDate } from '../lib/dateUtils';

export default function Privacy() {
    return (
        <div className="min-h-screen bg-white py-20">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-8">Privacy Policy</h1>
                <div className="prose prose-blue max-w-none text-gray-600">
                    <p className="mb-4">Last updated: {formatDate(new Date())}</p>
                    <p>
                        At EdinzTech, accessible from our website, one of our main priorities is the privacy of our visitors. This Privacy Policy document contains types of information that is collected and recorded by EdinzTech and how we use it.
                    </p>
                    {/* Add more content as needed */}
                </div>
            </div>
        </div>
    );
}
