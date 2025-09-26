'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import {
    Branch,
    addBranch,
    updateBranch,
    deleteBranch,
    subscribeToBranchesChanges,
    convertFileToBase64,
    compressImage
} from '@/lib/firebaseServicesNoStorage';
import AccessWrapper from '@/components/AccessWrapper';

export default function BranchesPage() {
    const [branches, setBranches] = useState<Branch[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        address: '',
        phone: '',
        email: '',
        manager: '',
        openingHours: '',
        isActive: true,
        image: '',
        city: '',
        country: 'UAE'
    });
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        const unsubscribe = subscribeToBranchesChanges(
            (updatedBranches) => {
                setBranches(updatedBranches);
                setLoading(false);
            },
            (error) => {
                console.error('Firebase connection error:', error);
                setLoading(false);
                alert('Firebase connection error. Please check the setup guide.');
            }
        );
        return () => unsubscribe();
    }, []);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
            const reader = new FileReader();
            reader.onload = (e) => {
                setFormData({ ...formData, image: e.target?.result as string });
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name.trim()) return;

        setUploading(true);
        try {
            let imageBase64 = editingBranch?.imageBase64;
            if (imageFile) {
                try {
                    imageBase64 = await compressImage(imageFile, 800, 0.8);
                } catch {
                    imageBase64 = await convertFileToBase64(imageFile);
                }
            }

            if (editingBranch) {
                await updateBranch(editingBranch.id!, {
                    name: formData.name,
                    address: formData.address,
                    phone: formData.phone,
                    email: formData.email,
                    manager: formData.manager,
                    openingHours: formData.openingHours,
                    isActive: formData.isActive,
                    city: formData.city,
                    country: formData.country,
                    imageBase64: imageBase64
                });
            } else {
                await addBranch({
                    name: formData.name,
                    address: formData.address,
                    phone: formData.phone,
                    email: formData.email,
                    manager: formData.manager,
                    openingHours: formData.openingHours,
                    isActive: formData.isActive,
                    city: formData.city,
                    country: formData.country,
                    imageBase64: imageBase64
                });
            }
            resetForm();
        } catch (error) {
            console.error('Error saving branch:', error);
            alert('Error saving branch. Please try again.');
        } finally {
            setUploading(false);
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            address: '',
            phone: '',
            email: '',
            manager: '',
            openingHours: '',
            isActive: true,
            image: '',
            city: '',
            country: 'UAE'
        });
        setImageFile(null);
        setShowModal(false);
        setEditingBranch(null);
    };

    const handleEdit = (branch: Branch) => {
        setEditingBranch(branch);
        setFormData({
            name: branch.name,
            address: branch.address,
            phone: branch.phone,
            email: branch.email,
            manager: branch.manager,
            openingHours: branch.openingHours,
            isActive: branch.isActive,
            image: branch.imageBase64 || '',
            city: branch.city,
            country: branch.country
        });
        setImageFile(null);
        setShowModal(true);
    };

    const handleDelete = async (branch: Branch) => {
        if (confirm('Delete this branch?')) {
            try {
                await deleteBranch(branch.id!);
            } catch (error) {
                console.error('Error deleting branch:', error);
                alert('Error deleting branch. Please try again.');
            }
        }
    };

    const toggleStatus = async (branch: Branch) => {
        try {
            await updateBranch(branch.id!, { isActive: !branch.isActive });
        } catch (error) {
            console.error('Error updating branch status:', error);
            alert('Error updating branch status. Please try again.');
        }
    };

    if (loading) {
        return (
            <AccessWrapper>
                <div className="p-3">
                    <div className="max-w-6xl mx-auto">
                        <div className="flex items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600"></div>
                            <span className="ml-3 text-pink-600">Loading branches...</span>
                        </div>
                    </div>
                </div>
            </AccessWrapper>
        );
    }

    return (
        <AccessWrapper>
            <div className="p-3">
                <div className="max-w-6xl mx-auto">
                    <div className="flex items-center justify-between mb-6">
                        <h1 className="text-2xl font-bold text-gray-900">Branches</h1>
                        <button
                            onClick={() => setShowModal(true)}
                            className="px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors"
                        >
                            Add Branch
                        </button>
                    </div>

                    {branches.length === 0 ? (
                        <p className="text-center text-gray-500 py-12">
                            No branches found. Add your first branch.
                        </p>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {branches.map((branch) => (
                                <BranchCard
                                    key={branch.id}
                                    branch={branch}
                                    onEdit={handleEdit}
                                    onDelete={handleDelete}
                                    onToggleStatus={toggleStatus}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
                        <h2 className="text-xl font-bold mb-4">
                            {editingBranch ? 'Edit Branch' : 'Add New Branch'}
                        </h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <input
                                type="text"
                                placeholder="Branch Name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="w-full p-2 border rounded-lg"
                                required
                            />
                            <input
                                type="text"
                                placeholder="Address"
                                value={formData.address}
                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                className="w-full p-2 border rounded-lg"
                                required
                            />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <input
                                    type="tel"
                                    placeholder="Phone"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    className="w-full p-2 border rounded-lg"
                                />
                                <input
                                    type="email"
                                    placeholder="Email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full p-2 border rounded-lg"
                                />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <input
                                    type="text"
                                    placeholder="Manager"
                                    value={formData.manager}
                                    onChange={(e) => setFormData({ ...formData, manager: e.target.value })}
                                    className="w-full p-2 border rounded-lg"
                                />
                                <input
                                    type="text"
                                    placeholder="Opening Hours"
                                    value={formData.openingHours}
                                    onChange={(e) => setFormData({ ...formData, openingHours: e.target.value })}
                                    className="w-full p-2 border rounded-lg"
                                />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <input
                                    type="text"
                                    placeholder="City"
                                    value={formData.city}
                                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                    className="w-full p-2 border rounded-lg"
                                />
                                <input
                                    type="text"
                                    placeholder="Country"
                                    value={formData.country}
                                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                                    className="w-full p-2 border rounded-lg"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Branch Image</label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                    className="w-full"
                                />
                                {formData.image && (
                                    <div className="mt-2 relative w-32 h-32">
                                        <Image
                                            src={formData.image}
                                            alt="Preview"
                                            fill
                                            className="object-cover rounded-lg"
                                        />
                                    </div>
                                )}
                            </div>
                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    checked={formData.isActive}
                                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                    className="mr-2"
                                />
                                <label>Active Branch</label>
                            </div>
                            <div className="flex justify-end space-x-3">
                                <button
                                    type="button"
                                    onClick={resetForm}
                                    className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={uploading}
                                    className="px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors disabled:opacity-50"
                                >
                                    {uploading ? 'Saving...' : 'Save Branch'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AccessWrapper>
    );
}

function BranchCard({
    branch,
    onEdit,
    onDelete,
    onToggleStatus
}: {
    branch: Branch;
    onEdit: (branch: Branch) => void;
    onDelete: (branch: Branch) => void;
    onToggleStatus: (branch: Branch) => void;
}) {
    return (
        <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow">
            {branch.imageBase64 && (
                <div className="relative h-48 w-full">
                    <Image
                        src={branch.imageBase64}
                        alt={branch.name}
                        fill
                        className="object-cover"
                    />
                </div>
            )}
            <div className="p-4">
                <h3 className="text-lg font-semibold mb-2">{branch.name}</h3>
                <p className="text-sm text-gray-600 mb-1">{branch.address}</p>
                <p className="text-sm text-gray-600 mb-1">{branch.city}, {branch.country}</p>
                <p className="text-sm text-gray-600 mb-1">Manager: {branch.manager}</p>
                <p className="text-sm text-gray-600 mb-1">Phone: {branch.phone}</p>
                <p className="text-sm text-gray-600 mb-1">Email: {branch.email}</p>
                <p className="text-sm text-gray-600 mb-3">Hours: {branch.openingHours}</p>
                <div className="flex justify-between items-center">
                    <button
                        onClick={() => onToggleStatus(branch)}
                        className={`px-3 py-1 rounded-full text-sm ${branch.isActive
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                    >
                        {branch.isActive ? 'Active' : 'Inactive'}
                    </button>
                    <div className="space-x-2">
                        <button
                            onClick={() => onEdit(branch)}
                            className="px-3 py-1 text-sm border rounded-lg hover:bg-gray-50"
                        >
                            Edit
                        </button>
                        <button
                            onClick={() => onDelete(branch)}
                            className="px-3 py-1 text-sm border rounded-lg hover:bg-gray-50 text-red-600"
                        >
                            Delete
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}




