'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { 
  Service,
  addService,
  updateService,
  deleteService,
  subscribeToServicesChanges,
  convertFileToBase64,
  compressImage,
  Category,
  subscribeToCategoriesChanges
} from '@/lib/firebaseServicesNoStorage';
import { collection, getDocs } from "firebase/firestore";
import { db } from '@/lib/firebase';
import AccessWrapper from '@/components/AccessWrapper';

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [branches, setBranches] = useState<string[]>([]);   // ✅ branches state
  const [selectedBranch, setSelectedBranch] = useState<string>(''); 
  const [searchQuery, setSearchQuery] = useState<string>(''); // ✅ search state
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    duration: 30,
    price: 0,
    description: '',
    branch: '',    // ✅ added branch in form
    isActive: true,
    image: ''
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  // Fetch branches
  const fetchBranches = async () => {
    try {
      const snapshot = await getDocs(collection(db, "branches"));
      const branchList = snapshot.docs.map(doc => doc.data().name);
      setBranches(branchList);
    } catch (error) {
      console.error("Error fetching branches:", error);
    }
  };

  useEffect(() => { fetchBranches(); }, []);

  // Subscribe to services & categories
  useEffect(() => {
    let loadingCount = 2;
    const checkLoadingComplete = () => { loadingCount--; if(loadingCount===0)setLoading(false); }

    const servicesUnsubscribe = subscribeToServicesChanges(
      (updatedServices) => { setServices(updatedServices); checkLoadingComplete(); },
      (error) => { console.error(error); checkLoadingComplete(); }
    );

    const categoriesUnsubscribe = subscribeToCategoriesChanges(
      (updatedCategories) => { 
        setCategories(updatedCategories); 
        if(updatedCategories.length>0 && !formData.category){
          setFormData(prev => ({...prev, category: updatedCategories[0].name}));
        }
        checkLoadingComplete(); 
      },
      (error) => { console.error(error); checkLoadingComplete(); }
    );

    return () => { servicesUnsubscribe(); categoriesUnsubscribe(); };
  }, [formData.category]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if(file){
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (e) => { setFormData({...formData, image: e.target?.result as string}); }
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if(!formData.name.trim() || !formData.branch) return;   // ✅ branch required
    setUploading(true);

    try {
      let imageBase64 = editingService?.imageBase64;
      if(imageFile){
        try { imageBase64 = await compressImage(imageFile, 800, 0.8); }
        catch { imageBase64 = await convertFileToBase64(imageFile); }
      }

      const serviceData = {
        name: formData.name,
        category: formData.category,
        duration: formData.duration,
        price: formData.price,
        description: formData.description,
        branch: formData.branch,    // ✅ branch saved
        isActive: formData.isActive,
        imageBase64: imageBase64
      };

      if(editingService){
        await updateService(editingService.id!, serviceData);
      } else {
        await addService(serviceData);
      }

      resetForm();
    } catch (error) {
      console.error('Error saving service:', error);
      alert('Error saving service. Please try again.');
    } finally { setUploading(false); }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      category: categories.length>0 ? categories[0].name : '',
      duration: 30,
      price: 0,
      description: '',
      branch: '',   // ✅ reset branch
      isActive: true,
      image: ''
    });
    setImageFile(null);
    setShowModal(false);
    setEditingService(null);
  };

  const handleEdit = (service: Service) => {
    setEditingService(service);
    setFormData({
      name: service.name,
      category: service.category,
      duration: service.duration,
      price: service.price,
      description: service.description,
      branch: service.branch || '',   // ✅ branch prefilled in edit
      isActive: service.isActive,
      image: service.imageBase64 || ''
    });
    setImageFile(null);
    setShowModal(true);
  };

  const handleDelete = async (service: Service) => {
    if(confirm('Delete this service?')) {
      try { await deleteService(service.id!); } 
      catch (error) { console.error(error); alert('Error deleting service.'); }
    }
  };

  const toggleStatus = async (service: Service) => {
    try { await updateService(service.id!, { isActive: !service.isActive }); }
    catch(error){ console.error(error); alert('Error updating status.'); }
  };

  const getCategoryColor = (categoryName: string) => {
    const category = categories.find(cat => cat.name === categoryName);
    return category ? category.color : 'from-pink-400 to-pink-500';
  };

  if(loading){
    return <div className="p-3"><div className="max-w-5xl mx-auto"><div className="flex items-center justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600"></div><span className="ml-3 text-pink-600">Loading services...</span></div></div></div>
  }

  // Filter services by selected branch and search query
  const filteredServices = services.filter(service => {
    // Branch filter
    const branchMatch = selectedBranch ? service.branch === selectedBranch : true;
    
    // Search filter
    const searchMatch = searchQuery ? (
      service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      service.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      service.description.toLowerCase().includes(searchQuery.toLowerCase())
    ) : true;
    
    return branchMatch && searchMatch;
  });

  return (
    <AccessWrapper>
      <div className="p-2 sm:p-3">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="mb-3 sm:mb-4 flex justify-between items-center">
            <div>
              <h1 className="text-base sm:text-lg font-medium text-pink-600 mb-1">Services</h1>
              <p className="text-xs text-pink-500">Manage salon services and pricing</p>
            </div>
            <div className="flex items-center space-x-2">
              {/* Branch Filter */}
              <select 
                value={selectedBranch} 
                onChange={(e) => setSelectedBranch(e.target.value)}
                className="text-xs sm:text-sm px-2 py-1 border border-pink-200/50 rounded-lg bg-white/90 dark:bg-black/80 text-pink-600 dark:text-pink-200 shadow-sm"
              >
                <option value="">All Branches</option>
                {branches.map((b,i)=><option key={i} value={b}>{b}</option>)}
              </select>

              {/* Add Service Button */}
              <button onClick={()=>setShowModal(true)} className="bg-pink-500/10 hover:bg-pink-500/20 text-pink-600 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs font-medium transition-all border border-pink-200/50 hover:border-pink-300/50">
                <span className="hidden sm:inline">Add Service</span>
                <span className="sm:hidden">Add</span>
              </button>
            </div>
          </div>

          {/* Beautiful Search Bar */}
          <div className="mb-4 sm:mb-6">
            <div className="relative max-w-md mx-auto">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-4 w-4 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search services by name, category, or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-sm bg-white/90 dark:bg-black/80 border border-pink-200/50 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-400 transition-all duration-200 text-pink-700 dark:text-pink-200 placeholder-pink-400"
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                <div className="h-4 w-px bg-pink-200/50"></div>
                <button className="ml-2 p-1 text-pink-400 hover:text-pink-600 transition-colors">
                  <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Services Grid */}
          {['men','women'].map(gender => {
            const genderCategories = categories.filter(c=>c.gender===gender);
            const genderServices = filteredServices.filter(s=>{
              const serviceCategory = categories.find(c=>c.name===s.category);
              return serviceCategory?.gender===gender;
            });
            if(genderCategories.length===0 || genderServices.length===0) return null;
            return (
              <div key={gender} className="mb-6 sm:mb-8">
                <h2 className={`text-lg sm:text-2xl font-bold ${gender==='men'?'text-blue-600':'text-pink-600'} mb-3 sm:mb-4`}>
                  {gender==='men'?'Men Services':'Women Services'}
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-4">
                  {genderServices.map(service => (
                    <ServiceCard key={service.id} service={service} onEdit={handleEdit} onDelete={handleDelete} onToggleStatus={toggleStatus} getCategoryColor={getCategoryColor}/>
                  ))}
                </div>
              </div>
            );
          })}

          {/* Modal */}
          {showModal && (
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 z-50">
              <div className="bg-white/90 backdrop-blur-xl border border-pink-200/30 rounded-xl sm:rounded-2xl shadow-[0_20px_50px_rgb(233,30,99,0.35)] w-full max-w-md max-h-[90vh] overflow-y-auto">
                <div className="p-3 sm:p-4">
                  <h3 className="text-sm font-semibold text-pink-700 mb-3 sm:mb-4">
                    {editingService ? 'Edit Service' : 'Add Service'}
                  </h3>
                  <form onSubmit={handleSubmit} className="space-y-2 sm:space-y-3">
                    {/* Image */}
                    <div>
                      <label className="block text-xs font-medium text-pink-600 mb-1">Service Image</label>
                      <div className="relative">
                        {formData.image ? (
                          <div className="relative w-full h-14 sm:h-16 rounded-lg overflow-hidden border border-pink-200/50">
                            <Image src={formData.image} alt="Service" fill className="object-cover"/>
                            <button type="button" onClick={()=>{ setFormData({...formData,image:''}); setImageFile(null);}} className="absolute top-1 right-1 w-5 h-5 bg-white/90 rounded-full flex items-center justify-center text-pink-600 hover:bg-white text-xs">×</button>
                          </div>
                        ) : (
                          <label className="flex flex-col items-center justify-center w-full h-14 sm:h-16 border-2 border-pink-200/50 border-dashed rounded-lg cursor-pointer bg-pink-50/30 hover:bg-pink-50/50 transition-all">
                            <div className="flex flex-col items-center justify-center">
                              <div className="w-5 h-5 sm:w-6 sm:h-6 bg-pink-100 rounded-md flex items-center justify-center mb-1"><span className="text-pink-500 text-xs">📷</span></div>
                              <p className="text-xs text-pink-600 font-medium">Upload</p>
                            </div>
                            <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload}/>
                          </label>
                        )}
                      </div>
                    </div>

                    {/* Name */}
                    <div>
                      <label className="block text-xs font-medium text-pink-600 mb-1">Service Name</label>
                      <input type="text" value={formData.name} onChange={(e)=>setFormData({...formData,name:e.target.value})} className="w-full px-2 sm:px-3 py-2 border border-pink-200/50 rounded-lg focus:outline-none focus:ring-1 focus:ring-pink-400 focus:border-pink-400 transition-all text-xs" required/>
                    </div>

                    {/* Category */}
                    <div>
                      <label className="block text-xs font-medium text-pink-600 mb-1">Category</label>
                      <select value={formData.category} onChange={(e)=>setFormData({...formData,category:e.target.value})} className="w-full px-2 sm:px-3 py-2 border border-pink-200/50 rounded-lg text-xs sm:text-sm cursor-pointer" required>
                        <option value="">Select a category</option>
                        {categories.map(c=><option key={c.id} value={c.name}>{c.name} ({c.gender})</option>)}
                      </select>
                    </div>

                    {/* Duration & Price */}
                    <div className="grid grid-cols-2 gap-2 sm:gap-3">
                      <div>
                        <label className="block text-xs font-medium text-pink-600 mb-1">Duration (min)</label>
                        <input type="number" value={formData.duration} onChange={(e)=>setFormData({...formData,duration:parseInt(e.target.value)})} className="w-full px-2 sm:px-3 py-2 border border-pink-200/50 rounded-lg text-xs" min={0}
      max={9999}/>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-pink-600 mb-1">Price (AED)</label>
                        <input type="number" value={formData.price} onChange={(e)=>setFormData({...formData,price:parseFloat(e.target.value)})} className="w-full px-2 sm:px-3 py-2 border border-pink-200/50 rounded-lg text-xs" min={0} step={0.01}/>
                      </div>
                    </div>

                    {/* Description */}
                    <div>
                      <label className="block text-xs font-medium text-pink-600 mb-1">Description</label>
                      <textarea value={formData.description} onChange={(e)=>setFormData({...formData,description:e.target.value})} className="w-full px-2 sm:px-3 py-2 border border-pink-200/50 rounded-lg text-xs" rows={2}></textarea>
                    </div>

                    {/* Branch */}
                    <div>
                      <label className="block text-xs font-medium text-pink-600 mb-1">Branch</label>
                      <select
                        value={formData.branch}
                        onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                        className="w-full px-2 sm:px-3 py-2 border border-pink-200/50 rounded-lg text-xs sm:text-sm cursor-pointer"
                        required
                      >
                        <option value="">Select a branch</option>
                        {branches.map((b, i) => (
                          <option key={i} value={b}>{b}</option>
                        ))}
                      </select>
                    </div>

                    {/* Active */}
                    <div>
                      <label className="flex items-center space-x-2">
                        <input type="checkbox" checked={formData.isActive} onChange={(e)=>setFormData({...formData,isActive:e.target.checked})} className="w-4 h-4 text-pink-600 bg-gray-100 border-gray-300 rounded focus:ring-pink-500 focus:ring-1"/>
                        <span className="text-xs font-medium text-pink-600">Active service</span>
                      </label>
                    </div>

                    {/* Buttons */}
                    <div className="flex justify-end space-x-2 pt-2 border-t border-pink-100">
                      <button type="button" onClick={resetForm} disabled={uploading} className="px-2 sm:px-3 py-1.5 text-pink-600 bg-pink-50/60 rounded-lg text-xs font-medium hover:bg-pink-100/60">Cancel</button>
                      <button type="submit" disabled={uploading} className="px-2 sm:px-3 py-1.5 bg-pink-500/10 hover:bg-pink-500/20 text-pink-600 rounded-lg text-xs font-medium border border-pink-200/50 hover:border-pink-300/50 flex items-center space-x-1">
                        {uploading && <div className="animate-spin rounded-full h-3 w-3 border-b border-pink-600"></div>}
                        <span>{editingService?'Update':'Create'}</span>
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </AccessWrapper>
  );
}

// Service Card Component
function ServiceCard({ service, onEdit, onDelete, onToggleStatus, getCategoryColor }: { 
  service: Service, 
  onEdit: (service: Service) => void, 
  onDelete: (service: Service) => void,
  onToggleStatus: (service: Service) => void,
  getCategoryColor: (categoryName: string) => string 
}) {
  return (
    <div className="bg-white/90 backdrop-blur-xl border border-pink-200/30 rounded-xl sm:rounded-2xl overflow-hidden shadow-[0_8px_30px_rgb(233,30,99,0.15)] transition-all duration-300 hover:shadow-[0_12px_40px_rgb(233,30,99,0.25)] hover:scale-[1.02] group">
      <div className="relative h-20 sm:h-24 overflow-hidden">
        {service.imageBase64 ? (
          <Image src={service.imageBase64} alt={service.name} fill className="object-cover"/>
        ) : (
          <div className={`h-full bg-gradient-to-br ${getCategoryColor(service.category)} relative`}></div>
        )}
      </div>

      <div className="p-2 sm:p-3">
        <h3 className="text-xs sm:text-sm font-semibold text-gray-800 truncate mb-1">{service.name}</h3>
        <p className="text-[10px] sm:text-xs text-gray-500 line-clamp-2 mb-2">{service.description}</p>

        {/* Price & Duration */}
        <div className="flex justify-between items-center text-[10px] sm:text-xs mb-2">
          <span className="text-pink-600 font-medium">{service.price.toFixed(2)} AED</span>
          <span className="text-gray-500">{service.duration} min</span>
        </div>

        {/* Branch */}
        <p className="text-[10px] sm:text-xs text-gray-400 mb-2">Branch: <span className="font-medium">{service.branch || 'N/A'}</span></p>

        <div className="flex justify-between items-center">
          <span className={`px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-medium ${service.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
            {service.isActive ? 'Active' : 'Inactive'}
          </span>
          <div className="flex space-x-1">
            <button onClick={()=>onEdit(service)} className="text-blue-500 hover:text-blue-700 text-xs">Edit</button>
            <button onClick={()=>onDelete(service)} className="text-red-500 hover:text-red-700 text-xs">Delete</button>
          </div>
        </div>
      </div>
    </div>
  );
}

