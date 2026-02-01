import { useState, useEffect } from 'react';
import { getGalleries } from '../lib/api';

export default function GalleryCarousel() {
    const [images, setImages] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchImages = async () => {
            try {
                const galleries = await getGalleries();
                // The API returns a flat list of images directly
                const allImages = Array.isArray(galleries) ? galleries.map(item => item.imageUrl) : [];
                setImages(allImages.slice(0, 15));
            } catch (err) {
                console.error("Failed to load gallery images", err);
            } finally {
                setLoading(false);
            }
        };
        fetchImages();
    }, []);

    if (loading || images.length === 0) return null;

    return (
        <section className="py-12 bg-white overflow-hidden">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8 text-center">
                <h2 className="text-3xl font-bold text-gray-900">Life at EdinzTech</h2>
                <p className="text-gray-600 mt-2">Glimpses of our events, workshops, and team culture.</p>
            </div>

            <div className="relative w-full overflow-hidden">
                {/* Gradient Masks */}
                <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none"></div>
                <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none"></div>

                <div className="flex gap-4 animate-scroll whitespace-nowrap hover:pause">
                    {/* Double the list for seamless looping */}
                    {[...images, ...images].map((img, idx) => (
                        <div key={idx} className="flex-shrink-0 w-72 h-48 rounded-xl overflow-hidden shadow-sm border border-gray-100">
                            <img
                                src={`${import.meta.env.VITE_API_URL.replace('/api', '')}${img.startsWith('/') ? '' : '/'}${img}`}
                                alt="Gallery Moment"
                                className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
                            />
                        </div>
                    ))}
                </div>
            </div>

            <style>{`
                .animate-scroll {
                    animation: scroll 40s linear infinite;
                }
                .hover\\:pause:hover {
                    animation-play-state: paused;
                }
                @keyframes scroll {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(-50%); }
                }
            `}</style>
        </section>
    );
}
