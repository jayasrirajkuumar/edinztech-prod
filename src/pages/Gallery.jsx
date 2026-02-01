import { useState, useEffect } from 'react';
import { getGallery } from '../lib/api';
import { Icons } from '../components/icons';

export default function Gallery() {
    const [items, setItems] = useState([]);
    const [selectedImage, setSelectedImage] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchGallery = async () => {
            try {
                const data = await getGallery();
                setItems(data);
            } catch (error) {
                console.error("Failed to fetch gallery", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchGallery();
    }, []);

    const openLightbox = (item) => {
        setSelectedImage(item);
        document.body.style.overflow = 'hidden'; // Prevent scrolling
    };

    const closeLightbox = () => {
        setSelectedImage(null);
        document.body.style.overflow = 'unset'; // Restore scrolling
    };

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto space-y-8">
                <div className="text-center">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-sm font-medium mb-4">
                        <Icons.User size={16} />
                        <span>Our Memories</span>
                    </div>
                    <h1 className="text-4xl font-extrabold text-secondary tracking-tight sm:text-5xl mb-4">
                        Photo Gallery
                    </h1>
                    <p className="max-w-2xl mx-auto text-xl text-gray-500">
                        Glimpses of our events, workshops, programs, and student achievements.
                    </p>
                </div>

                {isLoading ? (
                    <div className="flex justify-center p-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {items.map((item) => (
                            <div
                                key={item._id}
                                onClick={() => openLightbox(item)}
                                className="group relative overflow-hidden rounded-2xl shadow-lg bg-white cursor-pointer hover:-translate-y-1 transition-transform duration-300"
                            >
                                <div className="aspect-[4/3] bg-gray-200 relative overflow-hidden">
                                    <img
                                        src={`${import.meta.env.VITE_API_URL.replace('/api', '')}/${item.imageUrl}`}
                                        alt={item.title}
                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                        loading="lazy"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-6">
                                        <h3 className="text-white font-bold text-lg transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                                            {item.title}
                                        </h3>
                                        <p className="text-gray-300 text-sm mt-1 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300 delay-75">
                                            {new Date(item.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                                        </p>
                                    </div>
                                    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                        <div className="bg-white/20 backdrop-blur-sm p-2 rounded-full">
                                            <Icons.ArrowRight className="text-white h-5 w-5" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {!isLoading && items.length === 0 && (
                    <div className="text-center py-20 bg-white rounded-3xl shadow-sm">
                        <Icons.User className="mx-auto h-16 w-16 text-gray-300 mb-4" />
                        <h3 className="text-xl font-medium text-gray-900">No photos yet</h3>
                        <p className="text-gray-500 mt-2">Check back soon for updates!</p>
                    </div>
                )}
            </div>

            {/* Lightbox Modal */}
            {selectedImage && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm transition-opacity duration-300"
                    onClick={closeLightbox}
                >
                    <button
                        onClick={closeLightbox}
                        className="absolute top-6 right-6 text-white/70 hover:text-white transition-colors bg-white/10 hover:bg-white/20 rounded-full p-2"
                    >
                        <Icons.X size={32} />
                    </button>

                    <div
                        className="relative max-w-7xl max-h-[90vh] w-full flex flex-col items-center"
                        onClick={e => e.stopPropagation()} // Prevent close on image click
                    >
                        <img
                            src={`${import.meta.env.VITE_API_URL.replace('/api', '')}/${selectedImage.imageUrl}`}
                            alt={selectedImage.title}
                            className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl"
                        />
                        <div className="mt-6 text-center">
                            <h2 className="text-2xl font-bold text-white mb-2">{selectedImage.title}</h2>
                            <p className="text-gray-300">
                                {new Date(selectedImage.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
