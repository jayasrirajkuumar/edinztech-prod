import { Icons } from '../components/icons';
import Team from '../components/Team';

export default function About() {
    return (
        <div className="space-y-16 py-12">
            {/* Hero Section */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 text-blue-600 font-medium text-sm mb-4">
                    <Icons.Rocket size={16} />
                    <span>Driving Digital Transformation</span>
                </div>
                <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 leading-tight">
                    About <span className="text-blue-600">EdinzTech</span>
                </h1>
                <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                    We are a premier IT consulting and software development firm dedicated to delivering cutting-edge technology solutions that empower businesses to thrive in the digital age.
                </p>
            </section>

            {/* Overview Section */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                <div className="space-y-6">
                    <h2 className="text-3xl font-bold text-gray-900">Who We Are</h2>
                    <p className="text-gray-600 leading-relaxed text-lg">
                        At EdinzTech, we combine technical expertise with industry insight to solve complex business challenges. Our team of skilled engineers, designers, and strategists works collaboratively to build robust, scalable, and user-centric digital products.
                    </p>
                    <p className="text-gray-600 leading-relaxed text-lg">
                        From startups to enterprises, we partner with organizations to modernize their infrastructure, optimize operations, and create innovative customer experiences.
                    </p>
                </div>
                <div className="bg-gray-100 rounded-2xl h-80 flex items-center justify-center">
                    <Icons.Rocket size={80} className="text-gray-300" />
                </div>
            </section>

            {/* Vision & Mission */}
            <section className="bg-gray-50 py-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-6">
                            <Icons.Rocket className="text-blue-600" size={24} />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-4">Our Vision</h3>
                        <p className="text-gray-600">
                            To be the global partner of choice for digital innovation, recognized for our ability to turn visionary ideas into reality through technology excellence and human-centric design.
                        </p>
                    </div>
                    <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
                        <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-6">
                            <Icons.Rocket className="text-orange-600" size={24} />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-4">Our Mission</h3>
                        <p className="text-gray-600">
                            To deliver high-impact technology solutions that drive efficiency, growth, and competitive advantage for our clients, while fostering a culture of continuous learning and innovation.
                        </p>
                    </div>
                </div>
            </section>

            <Team />

            {/* Core Values */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center pb-12">
                <h2 className="text-3xl font-bold text-gray-900 mb-12">Our Core Values</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {[
                        { title: "Innovation", desc: "We constantly explore new technologies to stay ahead of the curve.", icon: Icons.Rocket, styles: "bg-blue-50 text-blue-600" },
                        { title: "Quality", desc: "We are committed to excellence in every line of code we write.", icon: Icons.CheckCircle, styles: "bg-orange-50 text-orange-600" },
                        { title: "Reliability", desc: "We build trusted relationships through consistent delivery and support.", icon: Icons.ShieldCheck, styles: "bg-green-50 text-green-600" }
                    ].map((value, idx) => (
                        <div key={idx} className="p-8 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 group hover:-translate-y-2">
                            <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 ${value.styles}`}>
                                <value.icon size={32} />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-3">{value.title}</h3>
                            <p className="text-gray-600 leading-relaxed">{value.desc}</p>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
}
