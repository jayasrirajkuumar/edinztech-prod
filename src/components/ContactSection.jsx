import { useState } from 'react';
import { Icons } from './icons';
import Button from './ui/Button';
import { sendContactQuery } from '../lib/api';

export default function ContactSection() {
    return (
        <section className="bg-white py-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16 space-y-4">
                    <h1 className="text-4xl font-extrabold text-gray-900">
                        Contact <span className="text-blue-600">Us</span>
                    </h1>
                    <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                        Have a project in mind or need assistance? Our team is here to help you.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
                    {/* Contact Info */}
                    <div className="space-y-8">
                        <div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-6">Get in Touch</h3>
                            <p className="text-gray-600 mb-8 leading-relaxed">
                                Whether you're looking for consultancy, development services, or training solutions, reach out to us. We serve clients across industries with tailored IT solutions.
                            </p>
                        </div>

                        <div className="space-y-6">
                            <div className="flex items-start gap-4">
                                <div className="mt-1 w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <Icons.Home size={20} className="text-blue-600" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-gray-900">Our Office</h4>
                                    <p className="text-gray-600 text-sm leading-relaxed">
                                        EDINZ TECH Private Limited<br />
                                        10th Floor, CITIUS A Block, Phase 1,<br />
                                        Olympia Tech Park Plot No.1, SIDCO Industrial Estate,<br />
                                        Guindy, Tamil Nadu, Chennai- 600032
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-4">
                                <div className="mt-1 w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <Icons.Verify size={20} className="text-blue-600" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-gray-900">Email Us</h4>
                                    <p className="text-gray-600">projects@edinztech.com</p>
                                </div>
                            </div>

                            <div className="flex items-start">
                                <Icons.Contact className="w-6 h-6 text-primary mt-1 mr-4" />
                                <div>
                                    <h3 className="font-semibold text-gray-800">Phone</h3>
                                    <p className="text-gray-600">+91 8667493679 | 9360505768</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Contact Form */}
                    <div className="bg-gray-50 p-8 rounded-2xl border border-gray-100 shadow-sm">
                        <h3 className="text-2xl font-bold text-gray-900 mb-6">Send us a Message</h3>
                        <ContactForm />
                    </div>
                </div>
            </div>
        </section>
    );
}

function ContactForm() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        message: ''
    });
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState(null); // 'success' | 'error' | null

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setStatus(null);

        try {
            await sendContactQuery(formData);
            setStatus('success');
            setFormData({ name: '', email: '', phone: '', message: '' });
        } catch (error) {
            console.error(error);
            setStatus('error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form className="space-y-6" onSubmit={handleSubmit}>
            {status === 'success' && (
                <div className="p-4 bg-green-50 text-green-700 rounded-lg">
                    Message sent successfully! We will get back to you soon.
                </div>
            )}
            {status === 'error' && (
                <div className="p-4 bg-red-50 text-red-700 rounded-lg">
                    Failed to send message. Please try again later.
                </div>
            )}

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                <input
                    type="text"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    placeholder="Your Name"
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                <input
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    placeholder="you@example.com"
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    placeholder="+91 98765 43210"
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
                <textarea
                    rows="4"
                    name="message"
                    required
                    value={formData.message}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    placeholder="How can we help you?"
                ></textarea>
            </div>
            <Button
                disabled={loading}
                className="w-full py-3 text-lg bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-70 disabled:cursor-not-allowed"
            >
                {loading ? 'Sending...' : 'Send Message'}
            </Button>
        </form>
    );
}
