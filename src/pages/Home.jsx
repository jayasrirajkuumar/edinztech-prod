import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getPrograms } from '../lib/api';
import ProgramCard from '../components/ProgramCard';
import Button from '../components/ui/Button';
import { Icons } from '../components/icons';
import Team from '../components/Team'; // Integrated Team component
import ContactSection from '../components/ContactSection';
import GalleryCarousel from '../components/GalleryCarousel';

export default function Home() {
    const [featuredPrograms, setFeaturedPrograms] = useState([]);

    useEffect(() => {
        const fetchFeatured = async () => {
            try {
                // Fetch all programs (or add a specific 'featured' endpoint/param later)
                // For now, take first 3 active programs
                const data = await getPrograms();
                setFeaturedPrograms(data.slice(0, 3));
            } catch (err) {
                console.error("Failed to load featured programs", err);
            }
        };
        fetchFeatured();
    }, []);

    return (
        <div className="space-y-16">
            {/* Hero Section */}
            {/* Hero Section */}
            <section className="relative pt-32 pb-64 overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white">
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#4b5563_1px,transparent_1px)] [background-size:16px_16px]"></div>

                <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
                    <div className="animate-in slide-in-from-bottom-5 fade-in duration-700 delay-100 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-400/20 text-blue-300 font-medium text-sm backdrop-blur-sm">
                        <Icons.Rocket size={16} className="text-blue-400" />
                        <span>Innovative Tech Solutions</span>
                    </div>

                    <h1 className="animate-in slide-in-from-bottom-5 fade-in duration-700 delay-200 text-5xl md:text-7xl font-extrabold tracking-tight max-w-5xl mx-auto leading-tight">
                        Powering Business Growth Through <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">Technology</span>
                    </h1>

                    <p className="animate-in slide-in-from-bottom-5 fade-in duration-700 delay-300 text-xl text-blue-100/80 max-w-2xl mx-auto leading-relaxed">
                        We deliver enterprise-grade software development, cloud infrastructure, and digital transformation services to help your business stay ahead.
                    </p>

                    <div className="animate-in slide-in-from-bottom-5 fade-in duration-700 delay-500 flex flex-col sm:flex-row justify-center gap-4 pt-8">
                        <Link to="/internships">
                            <Button size="lg" className="rounded-full px-8 py-4 text-lg w-full sm:w-auto shadow-xl !bg-blue-600 hover:!bg-blue-500 text-white border-none transition-all hover:scale-105">Get Started</Button>
                        </Link>
                        <Link to="/services">
                            <Button variant="ghost" size="lg" className="rounded-full px-8 py-4 text-lg w-full sm:w-auto border border-blue-400/30 !text-white hover:!bg-blue-800/50 hover:!text-white backdrop-blur-sm transition-all hover:scale-105">Our Services</Button>
                        </Link>
                    </div>
                </div>

                {/* Curved Bottom Divider */}
                <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-[0]">
                    <svg className="relative block w-[calc(100%+1.3px)] h-[150px]" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none">
                        <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z" className="fill-white"></path>
                    </svg>
                </div>
            </section>

            {/* Who We Are */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                    <div>
                        <h2 className="text-3xl font-bold text-gray-900 mb-6">Who We Are</h2>
                        <p className="text-lg text-gray-600 leading-relaxed mb-4">
                            EdinzTech is a forward-thinking technology consulting firm. We believe in the power of digital innovation to solve complex challenges.
                        </p>
                        <p className="text-lg text-gray-600 leading-relaxed">
                            Our team of experts works closely with clients to understand their unique needs and deliver tailored solutions that drive efficiency, scalability, and measurable results.
                        </p>
                    </div>
                    <div className="bg-blue-50 rounded-2xl p-8 flex items-center justify-center">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white p-4 rounded-lg shadow-sm text-center">
                                <h4 className="text-2xl font-bold text-blue-600">50+</h4>
                                <p className="text-sm text-gray-500">Clients Served</p>
                            </div>
                            <div className="bg-white p-4 rounded-lg shadow-sm text-center">
                                <h4 className="text-2xl font-bold text-blue-600">100+</h4>
                                <p className="text-sm text-gray-500">Projects Delivered</p>
                            </div>
                            <div className="bg-white p-4 rounded-lg shadow-sm text-center col-span-2">
                                <h4 className="text-2xl font-bold text-blue-600">5+ Years</h4>
                                <p className="text-sm text-gray-500">Industry Excellence</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <Team />

            {/* Our Services Summary */}
            <section className="bg-gray-50 py-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold text-gray-900 mb-4">Expert IT Services</h2>
                        <p className="text-gray-600 max-w-xl mx-auto">End-to-end technology solutions for modern enterprises.</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[
                            { title: "Software Development", desc: "Custom web and mobile applications tailored to your business goals." },
                            { title: "Cloud Strategy", desc: "Secure and scalable cloud migration and management services." },
                            { title: "Data & AI", desc: "Actionable insights through advanced analytics and machine learning." },
                        ].map((service, idx) => (
                            <div key={idx} className="bg-white p-8 rounded-xl shadow-sm hover:shadow-md transition-all border border-gray-100">
                                <h3 className="text-xl font-bold text-gray-900 mb-3">{service.title}</h3>
                                <p className="text-gray-600">{service.desc}</p>
                            </div>
                        ))}
                    </div>
                    <div className="text-center mt-10">
                        <Link to="/services" className="text-blue-600 font-medium hover:underline inline-flex items-center gap-1">
                            View All Services <Icons.ChevronRight size={16} />
                        </Link>
                    </div>
                </div>
            </section>

            {/* Gallery Carousel */}
            <GalleryCarousel />

            {/* Industries We Serve */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                <h2 className="text-3xl font-bold text-gray-900 mb-10">Industries We Serve</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    {['Healthcare', 'Finance', 'Education', 'Retail', 'Manufacturing', 'Logistics', 'Startups', 'Real Estate'].map((ind, i) => (
                        <div key={i} className="p-4 bg-white border border-gray-200 rounded-lg font-medium text-gray-700 hover:border-blue-500 hover:text-blue-600 transition-colors cursor-default">
                            {ind}
                        </div>
                    ))}
                </div>
            </section>

            {/* Why Choose Us */}
            <section className="bg-gray-900 text-white py-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                        <div>
                            <h2 className="text-3xl font-bold mb-6">Why Choose EdinzTech?</h2>
                            <p className="text-gray-400 text-lg leading-relaxed mb-6">
                                We don't just write code; we build partnerships. Our agile methodology, transparent communication, and technical prowess ensure your project is delivered on time, within budget, and above expectations.
                            </p>
                            <Link to="/contact">
                                <Button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg">Get in Touch</Button>
                            </Link>
                        </div>
                        <div className="space-y-6">
                            {[
                                { title: "Client-Centric Approach", desc: "Your success is our priority. We listen, adapt, and deliver." },
                                { title: "Technical Excellence", desc: "Top-tier talent using the latest frameworks and best practices." },
                                { title: "End-to-End Support", desc: "From ideation to deployment and maintenance, we are with you." }
                            ].map((item, idx) => (
                                <div key={idx} className="flex gap-4">
                                    <div className="mt-1 w-2 h-2 rounded-full bg-blue-500 flex-shrink-0"></div>
                                    <div>
                                        <h4 className="font-bold text-lg">{item.title}</h4>
                                        <p className="text-gray-400 text-sm">{item.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* Featured Training Programs (Preserved but demoted as per 'Hybrid' nature logic) */}
            {/* User instructions were specific about 'Replacing' sections, but also 'DO NOT touch Courses page'. */}
            {/* The Home page can link to them. I will keep a small section for Training at the bottom */}
            <section className="py-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-end mb-8 border-b border-gray-100 pb-4">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">Our Training Division</h2>
                            <p className="text-gray-600 mt-2">Upskilling the next generation of tech talent</p>
                        </div>
                        <Link to="/courses" className="text-blue-600 font-medium hover:underline flex items-center gap-1 group">
                            Explore Academy <Icons.ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                        </Link>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* Reusing existing logic if we had valid featuredPrograms, but to be safe and static I'll just link to categories */}
                        <Link to="/courses" className="group block bg-white p-6 rounded-xl border border-gray-200 hover:border-blue-500 transition-all">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-blue-50 rounded-lg text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                    <Icons.Courses size={24} />
                                </div>
                                <Icons.ChevronRight className="text-gray-300 group-hover:text-blue-600" />
                            </div>
                            <h3 className="font-bold text-lg text-gray-900 mb-2">Professional Courses</h3>
                            <p className="text-gray-500 text-sm">Master in-demand skills with expert-led curriculum.</p>
                        </Link>
                        <Link to="/internships" className="group block bg-white p-6 rounded-xl border border-gray-200 hover:border-purple-500 transition-all">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-purple-50 rounded-lg text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                                    <Icons.Internships size={24} />
                                </div>
                                <Icons.ChevronRight className="text-gray-300 group-hover:text-purple-600" />
                            </div>
                            <h3 className="font-bold text-lg text-gray-900 mb-2">Internship Program</h3>
                            <p className="text-gray-500 text-sm">Gain work experience on live industry projects.</p>
                        </Link>
                        <Link to="/workshops" className="group block bg-white p-6 rounded-xl border border-gray-200 hover:border-orange-500 transition-all">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-orange-50 rounded-lg text-orange-600 group-hover:bg-orange-600 group-hover:text-white transition-colors">
                                    <Icons.Workshops size={24} />
                                </div>
                                <Icons.ChevronRight className="text-gray-300 group-hover:text-orange-600" />
                            </div>
                            <h3 className="font-bold text-lg text-gray-900 mb-2">Workshops</h3>
                            <p className="text-gray-500 text-sm">Intensive bootcamps on specific technologies.</p>
                        </Link>
                    </div>
                </div>
            </section>
            {/* Contact Section */}
            <ContactSection />
        </div>
    );
}