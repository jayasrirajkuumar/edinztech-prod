import { useState, useEffect, useMemo } from 'react';
import ProgramCard from '../components/ProgramCard';
import { Icons } from '../components/icons';
import { getProgramsByType } from '../lib/api';
import { getProgramStatus, getRegistrationStatus } from '../lib/programUtils';
import ContactSection from '../components/ContactSection';

export default function Projects() {
    const [programs, setPrograms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('All'); // 'All', 'Ongoing', 'Upcoming', 'Completed'

    // Filters
    const [regStatus, setRegStatus] = useState('All');
    // const [domain, setDomain] = useState('All'); // Future: Domain filter if we add it to schema

    useEffect(() => {
        const fetchPrograms = async () => {
            try {
                const data = await getProgramsByType('Project');
                setPrograms(data);
            } catch (err) {
                console.error("Failed to load projects", err);
            } finally {
                setLoading(false);
            }
        };

        fetchPrograms();
    }, []);

    // Filter Logic
    const filteredPrograms = useMemo(() => {
        return programs.filter(program => {
            // 1. Tab Filter
            const status = getProgramStatus(program);
            if (activeTab !== 'All' && status !== activeTab) return false;

            // 2. Registration Status Filter
            if (regStatus !== 'All') {
                const pRegStatus = getRegistrationStatus(program);
                if (pRegStatus !== regStatus) return false;
            }

            return true;
        });
    }, [programs, activeTab, regStatus]);

    const tabs = [
        { id: 'All', label: 'All Projects' },
        { id: 'Ongoing', label: 'Ongoing' },
        { id: 'Upcoming', label: 'Upcoming' },
        { id: 'Completed', label: 'Completed' }
    ];

    const services = [
        {
            title: "College Project Support",
            description: "End-to-end guidance for final year and mini projects across various domains.",
            icon: Icons.GraduationCap
        },
        {
            title: "IEEE Paper Publication",
            description: "Expert assistance in writing, reviewing, and publishing research papers in IEEE conferences and journals.",
            icon: Icons.FileText
        },
        {
            title: "Conference Support",
            description: "Comprehensive support for presenting your work at national and international conferences.",
            icon: Icons.Presentation
        },
        {
            title: "Industry Guidance",
            description: "Mentorship from industry professionals to ensure your project meets current market standards.",
            icon: Icons.Rocket
        },
        {
            title: "Project Expertise",
            description: "Gain hands-on experience and specialized knowledge in cutting-edge technologies.",
            icon: Icons.ShieldCheck
        }
    ];

    return (
        <div className="bg-gray-50 min-h-screen">
            {/* Hero Section */}
            <section className="relative pt-32 pb-48 overflow-hidden bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 text-white">
                <div className="absolute inset-0 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:20px_20px] opacity-10"></div>
                <div className="relative z-10 max-w-7xl mx-auto px-4 text-center">
                    <h1 className="text-4xl md:text-5xl font-bold mb-6 animate-fade-in-up">
                        Academic & Research Projects
                    </h1>
                    <p className="text-xl text-blue-100 max-w-2xl mx-auto mb-8 animate-fade-in-up delay-100">
                        Turn your ideas into reality with our expert guidance and technical support.
                    </p>
                </div>
                {/* Curved Bottom */}
                <div className="absolute bottom-0 left-0 right-0">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320" className="w-full h-auto text-gray-50 fill-current">
                        <path fillOpacity="1" d="M0,96L48,112C96,128,192,160,288,160C384,160,480,128,576,112C672,96,768,96,864,112C960,128,1056,160,1152,160C1248,160,1344,128,1392,112L1440,96L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
                    </svg>
                </div>
            </section>

            {/* Dynamic Programs List Section */}
            <section className="py-12 px-4 -mt-20 relative z-20">
                <div className="max-w-7xl mx-auto">
                    {/* Controls */}
                    <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-xl shadow-lg border border-gray-100">
                        {/* Tabs */}
                        <div className="flex bg-gray-100 p-1 rounded-lg overflow-x-auto max-w-full">
                            {tabs.map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap ${activeTab === tab.id
                                        ? 'bg-white text-blue-700 shadow-sm'
                                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200'
                                        }`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        {/* Filters */}
                        <div className="flex gap-2">
                            <select
                                value={regStatus}
                                onChange={(e) => setRegStatus(e.target.value)}
                                className="bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-lg px-3 py-2 outline-none focus:border-blue-500"
                            >
                                <option value="All">Registration: All</option>
                                <option value="Open">Open</option>
                                <option value="Closing Soon">Closing Soon</option>
                                <option value="Closed">Closed</option>
                            </select>
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex justify-center py-20">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                        </div>
                    ) : filteredPrograms.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {filteredPrograms.map((program) => (
                                <ProgramCard key={program._id || program.id} program={program} showStatus={true} />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-300">
                            <div className="mx-auto h-12 w-12 text-gray-300 mb-3">
                                <Icons.Search size={48} />
                            </div>
                            <h3 className="text-lg font-medium text-gray-900">No projects found currently</h3>
                            <p className="text-gray-500">Check back later or browse our services below.</p>
                            <button
                                onClick={() => { setActiveTab('All'); setRegStatus('All'); }}
                                className="mt-4 text-blue-600 font-medium hover:text-blue-700"
                            >
                                Clear filters
                            </button>
                        </div>
                    )}
                </div>
            </section>

            {/* Services Grid (Static Info) */}
            <section className="py-20 px-4">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold text-gray-900 mb-4">How We Support You</h2>
                        <p className="text-gray-600 max-w-2xl mx-auto">
                            Comprehensive assistance for every stage of your academic research and project development.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {services.map((service, index) => (
                            <div key={index} className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-300 border border-gray-100 group">
                                <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mb-6 group-hover:bg-blue-600 transition-colors duration-300">
                                    <service.icon size={24} className="text-blue-600 group-hover:text-white transition-colors duration-300" />
                                </div>
                                <h3 className="text-xl font-semibold text-gray-900 mb-3">{service.title}</h3>
                                <p className="text-gray-600 leading-relaxed">
                                    {service.description}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA / Enquiry Section */}
            <section className="py-12 bg-white">
                <div className="max-w-4xl mx-auto px-4">
                    <div className="bg-gradient-to-r from-blue-900 to-indigo-900 rounded-2xl p-8 md:p-12 text-center text-white relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -mr-32 -mt-32"></div>
                        <div className="absolute bottom-0 left-0 w-64 h-64 bg-white opacity-5 rounded-full -ml-32 -mb-32"></div>

                        <h2 className="text-3xl font-bold mb-4 relative z-10">Start Your Project Today</h2>
                        <p className="text-blue-100 mb-8 relative z-10">
                            Have a project idea or need guidance? Fill out the form below and let's discuss how we can help you succeed.
                        </p>
                    </div>
                </div>
            </section>

            <div id="enquiry-form">
                <ContactSection showHeader={false} />
            </div>
        </div>
    );
};
