import { useState, useEffect } from 'react';
import { getGallery, addGalleryItem, deleteGalleryItem } from '../lib/api';
import Button from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import { Icons } from '../components/icons';

export default function AdminGallery() {
    const [items, setItems] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newItem, setNewItem] = useState({ title: '', file: null });

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

    useEffect(() => {
        fetchGallery();
    }, []);

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setNewItem({ ...newItem, file: e.target.files[0] });
        }
    };

    const handleSubmit = async () => {
        if (!newItem.title || !newItem.file) {
            alert("Title and Image are required");
            return;
        }

        const formData = new FormData();
        formData.append('title', newItem.title);
        formData.append('image', newItem.file);

        try {
            await addGalleryItem(formData);
            alert("Gallery Item Added");
            setIsModalOpen(false);
            setNewItem({ title: '', file: null });
            fetchGallery();
        } catch (error) {
            alert("Failed to add item: " + error.message);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this photo?")) return;
        try {
            await deleteGalleryItem(id);
            fetchGallery();
        } catch (error) {
            alert("Failed to delete item");
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-secondary">Gallery Management</h1>
                <Button onClick={() => setIsModalOpen(true)} icon={Icons.Plus}>Add New Photo</Button>
            </div>

            {isLoading ? (
                <div>Loading...</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {items.map((item) => (
                        <div key={item._id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden group relative">
                            <div className="aspect-video bg-gray-100 relative">
                                <img
                                    src={`${import.meta.env.VITE_API_URL.replace('/api', '')}/${item.imageUrl}`}
                                    alt={item.title}
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <button
                                        onClick={() => handleDelete(item._id)}
                                        className="bg-red-600 text-white p-2 rounded-full hover:bg-red-700"
                                    >
                                        <Icons.Trash size={20} />
                                    </button>
                                </div>
                            </div>
                            <div className="p-4">
                                <h3 className="font-medium text-gray-900 truncate" title={item.title}>{item.title}</h3>
                                <p className="text-xs text-gray-500 mt-1">{new Date(item.createdAt).toLocaleDateString()}</p>
                            </div>
                        </div>
                    ))}
                    {items.length === 0 && (
                        <div className="col-span-full py-12 text-center text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                            No photos in gallery. Add one to get started.
                        </div>
                    )}
                </div>
            )}

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Add New Photo"
            >
                <div className="space-y-4">
                    <Input
                        label="Photo Title"
                        value={newItem.title}
                        onChange={(e) => setNewItem({ ...newItem, title: e.target.value })}
                        placeholder="e.g. Workshop Session 2024"
                    />
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Upload Image</label>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-primary-dark"
                        />
                    </div>
                    <div className="flex justify-end gap-3 mt-6">
                        <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                        <Button onClick={handleSubmit}>Upload</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
