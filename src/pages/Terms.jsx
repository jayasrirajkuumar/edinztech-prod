import { formatDate } from '../lib/dateUtils';

export default function Terms() {
    return (
        <div className="min-h-screen bg-white py-20">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-8">Terms of Service</h1>
                <div className="prose prose-blue max-w-none text-gray-600">
                    <p className="mb-4">Last updated: {formatDate(new Date())}</p>
                    <p>
                        Welcome to EdinzTech. By accessing our website, you agree to be bound by these Terms of Service, all applicable laws and regulations, and agree that you are responsible for compliance with any applicable local laws.
                    </p>
                    {/* Add more content as needed */}
                </div>
            </div>
        </div>
    );
}
