'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import {
  Category,
  addCategory,
  updateCategory,
  deleteCategory,
  subscribeToCategoriesChanges,
  convertFileToBase64,
  compressImage
} from '@/lib/firebaseServicesNoStorage';
import AccessWrapper from '@/components/AccessWrapper';

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState<string>("all");

  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: 'from-pink-400 to-pink-500',
    image: '',
    gender: 'men' as 'men' | 'women' | 'unisex',
    branch: '' // ✅ new field
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  // Subscribe to categories changes
  useEffect(() => {
    const unsubscribe = subscribeToCategoriesChanges((updatedCategories) => {
      setCategories(updatedCategories);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = () => setFormData({ ...formData, image: reader.result as string });
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.branch) return;

    setUploading(true);
    try {
      let imageBase64 = formData.image;
      
      if (imageFile) {
        imageBase64 = await compressImage(imageFile, 800, 0.8);
      }

      const categoryData = {
        name: formData.name,
        description: formData.description,
        color: formData.color,
        imageBase64: imageBase64,
        gender: formData.gender,
        branch: formData.branch,
        serviceCount: editingCategory?.serviceCount || 0,
        createdAt: editingCategory?.createdAt || new Date(),
        updatedAt: new Date()
      };

      if (editingCategory) {
        await updateCategory(editingCategory.id, categoryData);
      } else {
        await addCategory(categoryData);
      }

      resetForm();
    } catch (error) {
      console.error('Error saving category:', error);
    } finally {
      setUploading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      color: 'from-pink-400 to-pink-500',
      image: '',
      gender: 'men',
      branch: ''
    });
    setImageFile(null);
    setEditingCategory(null);
    setShowModal(false);
  };

  const handleEdit = (category: Category) => {
    setFormData({
      name: category.name,
      description: category.description || '',
      color: category.color || 'from-pink-400 to-pink-500',
      image: category.image || '',
      gender: category.gender,
      branch: category.branch || ''
    });
    setEditingCategory(category);
    setShowModal(true);
  };

  const handleDelete = async (category: Category) => {
    if (window.confirm(`Are you sure you want to delete "${category.name}"?`)) {
      try {
        await deleteCategory(category.id);
      } catch (error) {
        console.error('Error deleting category:', error);
      }
    }
  };

  const openAddModal = () => {
    setFormData({
      name: '',
      description: '',
      color: 'from-pink-400 to-pink-500',
      image: '',
      gender: 'men',
      branch: ''
    });
    setEditingCategory(null);
    setShowModal(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 via-white to-purple-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading categories...</p>
        </div>
      </div>
    );
  }

  return (
    <AccessWrapper>
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50">
        <div className="p-2 sm:p-6">
          <div className="max-w-7xl mx-auto">
            {/* Enhanced Header */}
            <div className="mb-8 relative">
              <div className="bg-gradient-to-r from-pink-500 via-purple-500 to-pink-600 rounded-3xl p-6 sm:p-8 shadow-2xl">
                <div className="absolute inset-0 bg-gradient-to-r from-pink-500/20 via-purple-500/20 to-pink-600/20 rounded-3xl backdrop-blur-sm"></div>
                <div className="relative z-10">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2 tracking-tight">
                        Service Categories
                      </h1>
                      <p className="text-pink-100 text-sm sm:text-base font-medium">
                        Organize and manage your beauty services with style
                      </p>
                      <div className="flex items-center gap-4 mt-3">
                        <div className="flex items-center gap-2 text-pink-100">
                          <div className="w-2 h-2 bg-pink-200 rounded-full animate-pulse"></div>
                          <span className="text-xs font-medium">{categories.length} Categories</span>
                        </div>
                        <div className="flex items-center gap-2 text-pink-100">
                          <div className="w-2 h-2 bg-purple-200 rounded-full animate-pulse"></div>
                          <span className="text-xs font-medium">
                            {categories.reduce((sum, cat) => sum + (cat.serviceCount || 0), 0)} Services
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {/* Branch Filter */}
                      <div className="relative">
                        <select
                          value={selectedBranch}
                          onChange={(e) => setSelectedBranch(e.target.value)}
                          className="appearance-none bg-white/20 backdrop-blur-md border border-white/30 rounded-xl px-4 py-2.5 text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 cursor-pointer pr-10 min-w-[140px]"
                        >
                          <option value="all" className="text-gray-800">All Branches</option>
                          <option value="Marina" className="text-gray-800">Marina</option>
                          <option value="IBN Battuta Mall" className="text-gray-800">IBN Battuta Mall</option>
                          <option value="AI Bustaan" className="text-gray-800">AI Bustaan</option>
                          <option value="TECOM" className="text-gray-800">TECOM</option>
                          <option value="AI Muraqqabat" className="text-gray-800">AI Muraqqabat</option>
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                          <svg className="w-4 h-4 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>

                      {/* Add Category Button */}
                      <button
                        onClick={openAddModal}
                        className="group bg-white/20 backdrop-blur-md hover:bg-white/30 text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 border border-white/30 hover:border-white/50 hover:scale-105 hover:shadow-lg flex items-center gap-2"
                      >
                        <div className="w-5 h-5 rounded-full bg-white/30 flex items-center justify-center group-hover:rotate-90 transition-transform duration-300">
                          <span className="text-xs">+</span>
                        </div>
                        <span className="hidden sm:inline">Add Category</span>
                        <span className="sm:hidden">Add</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Men's Categories Section */}
            <section className="mb-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                    <span className="text-white text-sm font-bold">♂</span>
                  </div>
                  <h2 className="text-xl font-bold text-gray-800">Men's Categories</h2>
                </div>
                <div className="flex-1 h-px bg-gradient-to-r from-blue-200 to-transparent"></div>
                <span className="text-sm text-blue-600 font-medium bg-blue-50 px-3 py-1 rounded-full">
                  {categories.filter((cat) => cat.gender === 'men').filter((cat) => selectedBranch === 'all' || cat.branch === selectedBranch).length} categories
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6">
                {categories
                  .filter((cat) => cat.gender === 'men')
                  .filter((cat) => selectedBranch === 'all' || cat.branch === selectedBranch)
                  .map((category) => (
                    <CategoryCard
                      key={category.id}
                      category={category}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                    />
                  ))}
              </div>
            </section>

            {/* Women's Categories Section */}
            <section className="mb-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gradient-to-r from-pink-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg">
                    <span className="text-white text-sm font-bold">♀</span>
                  </div>
                  <h2 className="text-xl font-bold text-gray-800">Women's Categories</h2>
                </div>
                <div className="flex-1 h-px bg-gradient-to-r from-pink-200 to-transparent"></div>
                <span className="text-sm text-pink-600 font-medium bg-pink-50 px-3 py-1 rounded-full">
                  {categories.filter((cat) => cat.gender === 'women').filter((cat) => selectedBranch === 'all' || cat.branch === selectedBranch).length} categories
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6">
                {categories
                  .filter((cat) => cat.gender === 'women')
                  .filter((cat) => selectedBranch === 'all' || cat.branch === selectedBranch)
                  .map((category) => (
                    <CategoryCard
                      key={category.id}
                      category={category}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                    />
                  ))}
              </div>
            </section>

            {/* Empty State */}
            {categories.length === 0 && (
              <div className="text-center py-4 sm:py-6">
                <div className="w-8 sm:w-10 h-8 sm:h-10 bg-gradient-to-br from-pink-200 to-pink-300 rounded-xl flex items-center justify-center mx-auto mb-2">
                  <div className="text-xs sm:text-sm text-pink-600">📂</div>
                </div>
                <h3 className="text-xs font-semibold text-pink-700 mb-1">No categories yet</h3>
                <p className="text-xs text-pink-500 mb-3">Create your first category</p>
                <button
                  onClick={openAddModal}
                  className="bg-pink-500/10 hover:bg-pink-500/20 text-pink-600 px-3 py-1.5 rounded-lg text-xs font-medium border border-pink-200/50"
                >
                  Create Category
                </button>
              </div>
            )}

            {/* Modal */}
            {showModal && (
              <CategoryModal
                formData={formData}
                setFormData={setFormData}
                handleImageUpload={handleImageUpload}
                handleSubmit={handleSubmit}
                resetForm={resetForm}
                uploading={uploading}
                editingCategory={editingCategory}
              />
            )}
          </div>
        </div>
      </div>
    </AccessWrapper>
  );
}

// Category Modal component
function CategoryModal({ formData, setFormData, handleImageUpload, handleSubmit, resetForm, uploading, editingCategory }: any) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-300">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md transform animate-in slide-in-from-bottom-4 duration-500">
        {/* Header */}
        <div className="bg-gradient-to-r from-pink-500 via-purple-500 to-pink-600 rounded-t-3xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-white mb-1">
                {editingCategory ? 'Edit Category' : 'Create New Category'}
              </h3>
              <p className="text-pink-100 text-sm">
                {editingCategory ? 'Update category information' : 'Add a new service category'}
              </p>
            </div>
            <button
              onClick={resetForm}
              className="bg-white/20 hover:bg-white/30 rounded-full p-2 text-white transition-all duration-200 hover:scale-110"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Form */}
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Image Upload */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">Category Image</label>
              <div className="relative">
                {formData.image ? (
                  <div className="relative w-full h-32 rounded-xl overflow-hidden border-2 border-gray-200 group">
                    <Image src={formData.image} alt="Category preview" fill className="object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, image: '' })}
                        className="bg-white/90 hover:bg-white rounded-full p-2 text-red-500 hover:text-red-600 transition-all duration-200 hover:scale-110"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer bg-gray-50 hover:bg-gray-100 transition-all duration-200 group">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <div className="w-12 h-12 bg-gradient-to-r from-pink-500 to-purple-500 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-200">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <p className="text-sm font-medium text-gray-600">Upload Category Image</p>
                      <p className="text-xs text-gray-400">PNG, JPG up to 10MB</p>
                    </div>
                    <input
                      type="file"
                      onChange={handleImageUpload}
                      accept="image/*"
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>

            {/* Name */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Category Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all duration-200 text-sm"
                placeholder="Enter category name"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all duration-200 resize-none text-sm"
                rows={3}
                placeholder="Describe this category"
              />
            </div>

            {/* Branch and Gender */}
            <div className="grid grid-cols-2 gap-4">
              {/* Branch */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Branch</label>
                <select
                  value={formData.branch}
                  onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all duration-200 text-sm bg-white cursor-pointer"
                  required
                >
                  <option value="">Select Branch</option>
                  <option value="Marina">Marina</option>
                  <option value="IBN Battuta Mall">IBN Battuta Mall</option>
                  <option value="AI Bustaan">AI Bustaan</option>
                  <option value="TECOM">TECOM</option>
                  <option value="AI Muraqqabat">AI Muraqqabat</option>
                </select>
              </div>

              {/* Gender */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Gender</label>
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value as 'men' | 'women' })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all duration-200 text-sm bg-white cursor-pointer"
                >
                  <option value="men">♂ Men</option>
                  <option value="women">♀ Women</option>
                </select>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 pt-6 border-t border-gray-100">
              <button
                type="button"
                onClick={resetForm}
                disabled={uploading}
                className="px-6 py-3 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl font-medium transition-all duration-200 disabled:opacity-50 hover:scale-105"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={uploading}
                className="px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white rounded-xl font-semibold transition-all duration-200 disabled:opacity-50 flex items-center space-x-2 hover:scale-105 shadow-lg hover:shadow-xl"
              >
                {uploading && (
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                )}
                <span>{editingCategory ? 'Update Category' : 'Create Category'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// Category Card component
function CategoryCard({ category, onEdit, onDelete }: {
  category: Category,
  onEdit: (cat: Category) => void,
  onDelete: (cat: Category) => void
}) {
  const getGenderBadgeColor = (gender: string) => {
    switch (gender) {
      case 'men': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'women': return 'bg-pink-100 text-pink-800 border-pink-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getBranchBadgeColor = (branch: string) => {
    const colors = [
      'bg-purple-100 text-purple-800 border-purple-200',
      'bg-indigo-100 text-indigo-800 border-indigo-200',
      'bg-teal-100 text-teal-800 border-teal-200',
      'bg-orange-100 text-orange-800 border-orange-200',
      'bg-emerald-100 text-emerald-800 border-emerald-200'
    ];
    const index = branch ? branch.length % colors.length : 0;
    return colors[index];
  };

  return (
    <div className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-100 hover:border-pink-200 hover:-translate-y-1">
      {/* Image Section */}
      <div className="relative h-32 sm:h-36 overflow-hidden bg-gradient-to-br from-pink-50 to-purple-50">
        {category.imageBase64 ? (
          <Image
            src={category.imageBase64}
            alt={category.name}
            fill
            className="object-cover group-hover:scale-110 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="w-12 h-12 bg-gradient-to-r from-pink-400 to-purple-500 rounded-xl flex items-center justify-center">
              <span className="text-white text-lg font-bold">
                {category.name.charAt(0).toUpperCase()}
              </span>
            </div>
          </div>
        )}
        
        {/* Hover Actions */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center gap-2">
          <button
            onClick={() => onEdit(category)}
            className="bg-white/90 hover:bg-white rounded-full p-2 text-blue-600 hover:text-blue-700 transition-all duration-200 hover:scale-110 shadow-lg"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button
            onClick={() => onDelete(category)}
            className="bg-white/90 hover:bg-white rounded-full p-2 text-red-500 hover:text-red-600 transition-all duration-200 hover:scale-110 shadow-lg"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Content Section */}
      <div className="p-4">
        {/* Title */}
        <h3 className="font-bold text-gray-900 text-sm sm:text-base mb-2 line-clamp-1 group-hover:text-pink-600 transition-colors duration-200">
          {category.name}
        </h3>

        {/* Description */}
        {category.description && (
          <p className="text-gray-600 text-xs sm:text-sm mb-3 line-clamp-2 leading-relaxed">
            {category.description}
          </p>
        )}

        {/* Badges */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getGenderBadgeColor(category.gender)}`}>
            {category.gender === 'men' ? '♂ Men' : '♀ Women'}
          </span>
          {category.branch && (
            <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getBranchBadgeColor(category.branch)}`}>
              {category.branch}
            </span>
          )}
        </div>

        {/* Service Count */}
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 bg-pink-400 rounded-full"></div>
            {category.serviceCount || 0} services
          </span>
          <span className="text-gray-400">
            {category.createdAt ? new Date(category.createdAt.seconds * 1000).toLocaleDateString() : 'Recently'}
          </span>
        </div>
      </div>
    </div>
  );
}
