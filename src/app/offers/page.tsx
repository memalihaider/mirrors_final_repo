// 'use client';

// import { useState, useEffect } from 'react';
// import Image from 'next/image';
// import {
//   addOffer,
//   updateOffer,
//   deleteOffer,
//   subscribeToOffersChanges,
//   subscribeToBranchesChanges,
//   subscribeToServicesChanges,
//   compressImage,
//   type Offer,
//   type Branch,
//   type Service
// } from '@/lib/firebaseServicesNoStorage';
// import ConfirmationModal from '@/components/ConfirmationModal';

// /** Local helper: convert File → base64 (fallback if compress fails) */
// async function convertFileToBase64(file: File): Promise<string> {
//   return new Promise((resolve, reject) => {
//     const reader = new FileReader();
//     reader.onload = () => resolve(reader.result as string);
//     reader.onerror = reject;
//     reader.readAsDataURL(file);
//   });
// }

// /** New: what we will embed in Firestore for branches/services */
// type BranchRef = { id: string; name: string };
// type ServiceRef = { id: string; name: string };

// /** New: helpers to map selected IDs → [{id, name}] using cached lists */
// function makeBranchRefs(selectedIds: string[], allBranches: Branch[]): BranchRef[] {
//   const byId = new Map(allBranches.filter(b => b.id).map(b => [b.id!, b]));
//   return selectedIds
//     .map(id => {
//       const b = byId.get(id);
//       return b ? { id, name: b.name ?? 'Unnamed Branch' } : { id, name: 'Unknown' };
//     })
//     .filter((x, idx, arr) => x && arr.findIndex(y => y.id === x.id) === idx);
// }

// function makeServiceRefs(selectedIds: string[], allServices: Service[]): ServiceRef[] {
//   const byId = new Map(allServices.filter(s => s.id).map(s => [s.id!, s]));
//   return selectedIds
//     .map(id => {
//       const s = byId.get(id);
//       return s ? { id, name: s.name ?? 'Unnamed Service' } : { id, name: 'Unknown' };
//     })
//     .filter((x, idx, arr) => x && arr.findIndex(y => y.id === x.id) === idx);
// }

// /** New: normalize offer.targetBranches / targetServices from either ID[] or Ref[] → ID[] for the form */
// function toIdArray<T extends { id?: string }>(value: string[] | T[] | undefined): string[] {
//   if (!value) return [];
//   if (Array.isArray(value) && value.length > 0 && typeof (value as any)[0] === 'object') {
//     return (value as T[]).map(v => v.id!).filter(Boolean);
//   }
//   return value as string[];
// }

// export default function OffersPage() {
//   const [offers, setOffers] = useState<Offer[]>([]);
//   const [branches, setBranches] = useState<Branch[]>([]);
//   const [services, setServices] = useState<Service[]>([]);
//   const [loading, setLoading] = useState(true);

//   // Modal (Create/Edit)
//   const [showModal, setShowModal] = useState(false);
//   const [editingOffer, setEditingOffer] = useState<Offer | null>(null);

//   /** NOTE: keep formData strictly in sync with what the form actually edits */
//   const [formData, setFormData] = useState({
//     title: '',
//     description: '',
//     discountType: 'percentage' as 'percentage' | 'fixed',
//     discountValue: 0,
//     validFrom: '',
//     validTo: '',
//     isActive: true,
//     usageLimit: null as number | null,
//     image: '', // preview (base64 string)
//     targetBranches: [] as string[], // keep IDs in UI state
//     targetServices: [] as string[]  // keep IDs in UI state
//   });

//   const [imageFile, setImageFile] = useState<File | null>(null);
//   const [uploading, setUploading] = useState(false);

//   // Delete confirmation modal
//   const [showDeleteModal, setShowDeleteModal] = useState(false);
//   const [offerToDelete, setOfferToDelete] = useState<Offer | null>(null);
//   const [deleting, setDeleting] = useState(false);

//   // Subscribe to real-time updates
//   useEffect(() => {
//     const unsubscribeOffers = subscribeToOffersChanges(
//       (updatedOffers) => {
//         setOffers(updatedOffers);
//         setLoading(false);
//       },
//       (error) => {
//         console.error('Firebase connection error:', error);
//         setLoading(false);
//         alert('Firebase connection error. Please check the setup guide.');
//       }
//     );

//     const unsubscribeBranches = subscribeToBranchesChanges(
//       (branchesData) => setBranches(branchesData),
//       (error) => console.error('Error fetching branches:', error)
//     );

//     const unsubscribeServices = subscribeToServicesChanges(
//       (servicesData) => setServices(servicesData),
//       (error) => console.error('Error fetching services:', error)
//     );

//     return () => {
//       unsubscribeOffers();
//       unsubscribeBranches();
//       unsubscribeServices();
//     };
//   }, []);

//   // IMAGE UPLOAD
//   const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const file = e.target.files?.[0];
//     if (!file) return;
//     setImageFile(file);
//     const reader = new FileReader();
//     reader.onload = (ev) => {
//       setFormData((prev) => ({ ...prev, image: ev.target?.result as string }));
//     };
//     reader.readAsDataURL(file);
//   };

//   // Branch selection
//   const handleBranchSelection = (branchId: string) => {
//     setFormData((prev) => ({
//       ...prev,
//       targetBranches: prev.targetBranches.includes(branchId)
//         ? prev.targetBranches.filter((id) => id !== branchId)
//         : [...prev.targetBranches, branchId]
//     }));
//   };

//   // Service selection
//   const handleServiceSelection = (serviceId: string) => {
//     setFormData((prev) => ({
//       ...prev,
//       targetServices: prev.targetServices.includes(serviceId)
//         ? prev.targetServices.filter((id) => id !== serviceId)
//         : [...prev.targetServices, serviceId]
//     }));
//   };

//   // CREATE / UPDATE
//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     if (!formData.title.trim()) return;

//     setUploading(true);
//     try {
//       let imageBase64: string | undefined = editingOffer?.imageBase64;

//       // If user selected a new file, compress or convert to base64
//       if (imageFile) {
//         try {
//           imageBase64 = await compressImage(imageFile, 800, 0.8);
//         } catch {
//           imageBase64 = await convertFileToBase64(imageFile);
//         }
//       }

//       // Build embedded refs for Firestore (id + name)
//       const branchRefs: BranchRef[] = makeBranchRefs(formData.targetBranches, branches);
//       const serviceRefs: ServiceRef[] = makeServiceRefs(formData.targetServices, services);

//       if (editingOffer && editingOffer.id) {
//         // Update existing offer
//         const updateData: Partial<Offer> & {
//           targetBranches?: BranchRef[];
//           targetServices?: ServiceRef[];
//         } = {
//           title: formData.title,
//           description: formData.description,
//           discountType: formData.discountType,
//           discountValue: formData.discountValue,
//           validFrom: formData.validFrom,
//           validTo: formData.validTo,
//           isActive: formData.isActive,
//           imageBase64: imageBase64 ?? editingOffer.imageBase64,
//           usageLimit: formData.usageLimit ?? null,
//           // save embedded objects instead of only IDs
//           targetBranches: branchRefs as any,
//           targetServices: serviceRefs as any
//         };

//         await updateOffer(editingOffer.id, updateData as any);
//       } else {
//         // Add new offer
//         const offerData: Omit<Offer, 'id' | 'createdAt' | 'updatedAt'> & {
//           targetBranches: BranchRef[];
//           targetServices: ServiceRef[];
//         } = {
//           title: formData.title,
//           description: formData.description,
//           discountType: formData.discountType,
//           discountValue: formData.discountValue,
//           validFrom: formData.validFrom,
//           validTo: formData.validTo,
//           isActive: formData.isActive,
//           usedCount: 0,
//           imageBase64: imageBase64,
//           // save embedded objects instead of only IDs
//           targetBranches: branchRefs as any,
//           targetServices: serviceRefs as any,
//           ...(formData.usageLimit ? { usageLimit: formData.usageLimit } : {})
//         };
//         await addOffer(offerData as any);
//       }

//       resetForm();
//     } catch (error) {
//       console.error('Error saving offer:', error);
//       alert('Error saving offer. Please try again.');
//     } finally {
//       setUploading(false);
//     }
//   };

//   const resetForm = () => {
//     setFormData({
//       title: '',
//       description: '',
//       discountType: 'percentage',
//       discountValue: 0,
//       validFrom: '',
//       validTo: '',
//       isActive: true,
//       usageLimit: null,
//       image: '',
//       targetBranches: [],
//       targetServices: []
//     });
//     setImageFile(null);
//     setShowModal(false);
//     setEditingOffer(null);
//   };

//   // EDIT
//   const handleEdit = (offer: Offer) => {
//     setEditingOffer(offer);

//     // Accept both legacy (ID[]) and new ({id,name}[]) shapes:
//     const branchIds = toIdArray<{ id: string }>(
//       (offer as any).targetBranches || (offer as any).selectedBranches
//     );
//     const serviceIds = toIdArray<{ id: string }>(
//       (offer as any).targetServices || (offer as any).selectedServices
//     );

//     setFormData({
//       title: offer.title ?? '',
//       description: offer.description ?? '',
//       discountType: (offer.discountType as any) ?? 'percentage',
//       discountValue: typeof offer.discountValue === 'number' ? offer.discountValue : 0,
//       validFrom: (offer as any).validFrom ?? '',
//       validTo: (offer as any).validTo ?? '',
//       isActive: !!offer.isActive,
//       usageLimit: (offer as any).usageLimit ?? null,
//       // preview: use existing imageBase64 if present
//       image: (offer as any).imageBase64 || '',
//       targetBranches: branchIds,
//       targetServices: serviceIds
//     });
//     setShowModal(true);
//   };

//   // DELETE
//   const handleDelete = (offer: Offer) => {
//     if (!offer || !(offer as any).id) {
//       alert('Invalid offer. Cannot delete.');
//       return;
//     }
//     setOfferToDelete(offer);
//     setShowDeleteModal(true);
//   };

//   const confirmDelete = async () => {
//     if (!(offerToDelete as any)?.id) {
//       setShowDeleteModal(false);
//       setOfferToDelete(null);
//       return;
//     }

//     setDeleting(true);
//     try {
//       await deleteOffer((offerToDelete as any).id);
//       // Realtime subscription will refresh the list
//       setShowDeleteModal(false);
//       setOfferToDelete(null);
//     } catch (error) {
//       console.error('Error deleting offer:', error);
//       alert('Error deleting offer. Please try again.');
//     } finally {
//       setDeleting(false);
//     }
//   };

//   const cancelDelete = () => {
//     setShowDeleteModal(false);
//     setOfferToDelete(null);
//   };

//   const toggleStatus = async (offer: Offer) => {
//     const id = (offer as any).id;
//     if (!id) return;
//     try {
//       await updateOffer(id, { isActive: !offer.isActive } as any);
//     } catch (error) {
//       console.error('Error updating offer status:', error);
//       alert('Error updating offer status. Please try again.');
//     }
//   };

//   // UI helpers
//   const formatDiscount = (offer: Offer) =>
//     (offer as any).discountType === 'percentage'
//       ? `${(offer as any).discountValue}%`
//       : `AED ${(offer as any).discountValue}`;

//   const isExpired = (validTo: string) => {
//     if (!validTo) return false;
//     return new Date(validTo) < new Date();
//   };

//   const getOfferGradient = (index: number) => {
//     const gradients = [
//       'from-pink-400 to-rose-400',
//       'from-rose-400 to-pink-400',
//       'from-yellow-400 to-amber-400',
//       'from-amber-400 to-yellow-400',
//       'from-pink-300 to-yellow-300',
//       'from-rose-300 to-amber-300'
//     ];
//     return gradients[index % gradients.length];
//   };

//   if (loading) {
//     return (
//       <div className="p-3">
//         <div className="max-w-5xl mx-auto">
//           <div className="flex items-center justify-center py-12">
//             <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600"></div>
//             <span className="ml-3 text-pink-600">Loading offers...</span>
//           </div>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="p-2 sm:p-3">
//       <div className="max-w-5xl mx-auto">
//         {/* Header */}
//         <div className="mb-3 sm:mb-4">
//           <div className="flex justify-between items-center">
//             <div>
//               <h1 className="text-base sm:text-lg font-medium text-pink-600 mb-1">Special Offers</h1>
//               <p className="text-xs text-pink-500">Create and manage promotional banners</p>
//             </div>
//             <button
//               onClick={() => setShowModal(true)}
//               className="bg-pink-500/10 hover:bg-pink-500/20 text-pink-600 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs font-medium transition-all border border-pink-200/50 hover:border-pink-300/50"
//             >
//               <span className="hidden sm:inline">Create Offer</span>
//               <span className="sm:hidden">Create</span>
//             </button>
//           </div>
//         </div>

//         {/* Offers List */}
//         <div className="space-y-2 sm:space-y-3">
//           {offers.map((offer, index) => {
//             // Backward + forward compatible:
//             // offer.targetBranches may be string[] or {id,name}[]
//             const branchIds =
//               toIdArray<{ id: string }>((offer as any).targetBranches || (offer as any).selectedBranches);
//             const serviceIds =
//               toIdArray<{ id: string }>((offer as any).targetServices || (offer as any).selectedServices);

//             return (
//               <div
//                 key={(offer as any).id ?? `${(offer as any).title}-${index}`}
//                 className="bg-white/90 backdrop-blur-xl border border-pink-200/30 rounded-xl sm:rounded-2xl overflow-hidden shadow-[0_8px_30px_rgb(233,30,99,0.15)] transition-all duration-300 hover:shadow-[0_12px_40px_rgb(233,30,99,0.25)] hover:scale-[1.01] group"
//               >
//                 <div className="relative h-16 sm:h-20 overflow-hidden">
//                   {(offer as any).imageBase64 ? (
//                     <div className="relative h-full">
//                       <Image
//                         src={(offer as any).imageBase64}
//                         alt={(offer as any).title || 'Offer'}
//                         fill
//                         className="object-cover transition-transform duration-300 group-hover:scale-105"
//                       />
//                       <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-transparent" />
//                     </div>
//                   ) : (
//                     <div className={`h-full bg-gradient-to-r ${getOfferGradient(index)} relative`}>
//                       <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent" />
//                     </div>
//                   )}

//                   {/* Discount */}
//                   <div className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2">
//                     <div className="bg-white/95 backdrop-blur-sm rounded-lg sm:rounded-xl px-2 sm:px-3 py-1 sm:py-2 shadow-lg">
//                       <div className="text-sm sm:text-lg font-bold text-pink-600">
//                         {formatDiscount(offer)}
//                       </div>
//                       <div className="text-xs text-pink-500 uppercase tracking-wide font-medium">OFF</div>
//                     </div>
//                   </div>

//                   {/* Title/Description */}
//                   <div className="absolute left-16 sm:left-24 top-1/2 -translate-y-1/2 text-white right-16 sm:right-20">
//                     <h2 className="text-xs sm:text-sm font-bold mb-1 drop-shadow-lg truncate">
//                       {(offer as any).title}
//                     </h2>
//                     <p className="text-xs opacity-90 drop-shadow-md truncate">{(offer as any).description}</p>
//                   </div>

//                   {/* Action buttons */}
//                   <div className="absolute top-1 sm:top-2 right-1 sm:right-2 flex space-x-1 opacity-0 group-hover:opacity-100 transition-all duration-200">
//                     <button
//                       onClick={() => handleEdit(offer)}
//                       className="w-5 h-5 sm:w-6 sm:h-6 bg-white/95 backdrop-blur-sm rounded-md flex items-center justify-center text-pink-600 hover:bg-white hover:scale-110 text-xs transition-all shadow-md"
//                       aria-label="Edit offer"
//                     >
//                       ✎
//                     </button>
//                     <button
//                       onClick={() => handleDelete(offer)}
//                       className="w-5 h-5 sm:w-6 sm:h-6 bg-white/95 backdrop-blur-sm rounded-md flex items-center justify-center text-pink-600 hover:bg-red-50 hover:text-red-600 hover:scale-110 text-xs transition-all shadow-md"
//                       aria-label="Delete offer"
//                     >
//                       ×
//                     </button>
//                   </div>

//                   {/* Status */}
//                   <div className="absolute top-1 sm:top-2 left-1 sm:left-2">
//                     <button
//                       onClick={() => toggleStatus(offer)}
//                       className={`px-1 sm:px-1.5 py-0.5 rounded-full font-medium transition-all duration-300 shadow-sm backdrop-blur-sm border ${
//                         (offer as any).isActive && !isExpired((offer as any).validTo)
//                           ? 'bg-emerald-500/90 text-white hover:bg-emerald-600/90 border-emerald-400/30'
//                           : isExpired((offer as any).validTo)
//                           ? 'bg-gray-500/90 text-white border-gray-400/30'
//                           : 'bg-rose-500/90 text-white hover:bg-rose-600/90 border-rose-400/30'
//                       }`}
//                       style={{ fontSize: '8px' }}
//                     >
//                       {isExpired((offer as any).validTo) ? 'Expired' : (offer as any).isActive ? 'Active' : 'Inactive'}
//                     </button>
//                   </div>
//                 </div>

//                 {/* Footer */}
//                 <div className="p-1.5 sm:p-2 bg-gradient-to-r from-pink-50/50 to-transparent">
//                   <div className="space-y-1">
//                     <div className="flex items-center justify-between text-xs">
//                       <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-3 space-y-1 sm:space-y-0">
//                         <span className="text-pink-600 text-xs">
//                           <strong>Valid:</strong>{' '}
//                           {(offer as any).validFrom ? new Date((offer as any).validFrom).toLocaleDateString() : '—'} -{' '}
//                           {(offer as any).validTo ? new Date((offer as any).validTo).toLocaleDateString() : '—'}
//                         </span>
//                         {typeof (offer as any).usageLimit === 'number' && (
//                           <span className="text-pink-600 text-xs">
//                             <strong>Usage:</strong> {(offer as any).usedCount ?? 0}/{(offer as any).usageLimit}
//                           </span>
//                         )}
//                       </div>

//                       <div className="flex items-center space-x-1 sm:space-x-2">
//                         {typeof (offer as any).usageLimit === 'number' && (
//                           <div className="w-12 sm:w-16 bg-pink-200 rounded-full h-1">
//                             <div
//                               className="h-1 rounded-full bg-pink-500"
//                               style={{
//                                 width: `${
//                                   Math.min(
//                                     (((offer as any).usedCount ?? 0) / ((offer as any).usageLimit || 1)) * 100,
//                                     100
//                                   ) || 0
//                                 }%`
//                               }}
//                             ></div>
//                           </div>
//                         )}
//                         <span className="text-pink-500 font-medium text-xs">
//                           {(offer as any).usedCount ?? 0} uses
//                         </span>
//                       </div>
//                     </div>

//                     {(branchIds.length > 0 || serviceIds.length > 0) && (
//                       <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-1 sm:space-y-0 text-xs">
//                         {branchIds.length > 0 && (
//                           <div className="flex items-center space-x-1">
//                             <span className="text-pink-600 font-medium">Branches:</span>
//                             <div className="flex flex-wrap gap-1">
//                               {branchIds.slice(0, 2).map((branchId) => {
//                                 const branch = branches.find((b) => b.id === branchId);
//                                 return (
//                                   <span
//                                     key={branchId}
//                                     className="bg-pink-100/80 text-pink-700 px-1.5 py-0.5 rounded text-xs"
//                                   >
//                                     {branch?.name || 'Unknown'}
//                                   </span>
//                                 );
//                               })}
//                               {branchIds.length > 2 && (
//                                 <span className="text-pink-500 text-xs">
//                                   +{branchIds.length - 2} more
//                                 </span>
//                               )}
//                             </div>
//                           </div>
//                         )}

//                         {serviceIds.length > 0 && (
//                           <div className="flex items-center space-x-1">
//                             <span className="text-blue-600 font-medium">Services:</span>
//                             <div className="flex flex-wrap gap-1">
//                               {serviceIds.slice(0, 2).map((serviceId) => {
//                                 const service = services.find((s) => s.id === serviceId);
//                                 return (
//                                   <span
//                                     key={serviceId}
//                                     className="bg-blue-100/80 text-blue-700 px-1.5 py-0.5 rounded text-xs"
//                                   >
//                                     {service?.name || 'Unknown'}
//                                   </span>
//                                 );
//                               })}
//                               {serviceIds.length > 2 && (
//                                 <span className="text-blue-500 text-xs">
//                                   +{serviceIds.length - 2} more
//                                 </span>
//                               )}
//                             </div>
//                           </div>
//                         )}
//                       </div>
//                     )}
//                   </div>
//                 </div>
//               </div>
//             );
//           })}
//         </div>

//         {/* Empty state */}
//         {offers.length === 0 && !loading && (
//           <div className="text-center py-4 sm:py-6">
//             <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-pink-200 to-pink-300 rounded-xl flex items-center justify-center mx-auto mb-2">
//               <div className="text-xs sm:text-sm text-pink-600">🏷️</div>
//             </div>
//             <h3 className="text-xs font-semibold text-pink-700 mb-1">No offers yet</h3>
//             <p className="text-xs text-pink-500 mb-3 px-4">Create your first promotional offer</p>
//             <button
//               onClick={() => setShowModal(true)}
//               className="bg-pink-500/10 hover:bg-pink-500/20 text-pink-600 px-3 py-1.5 rounded-lg text-xs font-medium border border-pink-200/50"
//             >
//               Create Offer
//             </button>
//           </div>
//         )}

//         {/* Create/Edit Modal */}
//         {showModal && (
//           <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 z-50">
//             <div className="bg-white/90 backdrop-blur-xl border border-pink-200/30 rounded-xl sm:rounded-2xl shadow-[0_20px_50px_rgb(233,30,99,0.35)] w-full max-w-sm max-h-[90vh] overflow-y-auto">
//               <div className="p-3 sm:p-4">
//                 <h3 className="text-sm font-semibold text-pink-700 mb-3 sm:mb-4">
//                   {editingOffer ? 'Edit Offer' : 'Create Offer'}
//                 </h3>
//                 <form onSubmit={handleSubmit} className="space-y-2 sm:space-y-3">
//                   {/* Image */}
//                   <div>
//                     <label className="block text-xs font-medium text-pink-600 mb-1">Image</label>
//                     <div className="relative">
//                       {formData.image ? (
//                         <div className="relative w-full h-14 sm:h-16 rounded-lg overflow-hidden border border-pink-200/50">
//                           <Image
//                             src={formData.image}
//                             alt="Banner preview"
//                             fill
//                             className="object-cover"
//                           />
//                           <button
//                             type="button"
//                             onClick={() => {
//                               setFormData((p) => ({ ...p, image: '' }));
//                               setImageFile(null);
//                             }}
//                             className="absolute top-1 right-1 w-5 h-5 bg-white/90 rounded-full flex items-center justify-center text-pink-600 hover:bg-white text-xs"
//                           >
//                             ×
//                           </button>
//                         </div>
//                       ) : (
//                         <label className="flex flex-col items-center justify-center w-full h-14 sm:h-16 border-2 border-pink-200/50 border-dashed rounded-lg cursor-pointer bg-pink-50/30 hover:bg-pink-50/50 transition-all">
//                           <div className="flex flex-col items-center justify-center">
//                             <div className="w-5 h-5 sm:w-6 sm:h-6 bg-pink-100 rounded-md flex items-center justify-center mb-1">
//                               <span className="text-pink-500 text-xs">🏷️</span>
//                             </div>
//                             <p className="text-xs text-pink-600 font-medium">Upload</p>
//                           </div>
//                           <input
//                             type="file"
//                             className="hidden"
//                             accept="image/*"
//                             onChange={handleImageUpload}
//                           />
//                         </label>
//                       )}
//                     </div>
//                   </div>

//                   {/* Title */}
//                   <div>
//                     <label className="block text-xs font-medium text-pink-600 mb-1">Title</label>
//                     <input
//                       type="text"
//                       value={formData.title}
//                       onChange={(e) => setFormData({ ...formData, title: e.target.value })}
//                       className="w-full px-2 sm:px-3 py-2 border border-pink-200/50 rounded-lg focus:outline-none focus:ring-1 focus:ring-pink-400 focus:border-pink-400 transition-all text-xs"
//                       placeholder="Offer title"
//                       required
//                     />
//                   </div>

//                   {/* Description */}
//                   <div>
//                     <label className="block text-xs font-medium text-pink-600 mb-1">
//                       Description
//                     </label>
//                     <textarea
//                       value={formData.description}
//                       onChange={(e) => setFormData({ ...formData, description: e.target.value })}
//                       className="w-full px-2 sm:px-3 py-2 border border-pink-200/50 rounded-lg focus:outline-none focus:ring-1 focus:ring-pink-400 focus:border-pink-400 transition-all resize-none text-xs"
//                       rows={2}
//                       placeholder="Description"
//                       required
//                     />
//                   </div>

//                   {/* Discount */}
//                   <div className="grid grid-cols-2 gap-2">
//                     <div>
//                       <label className="block text-xs font-medium text-pink-600 mb-1">Type</label>
//                       <div className="relative">
//                         <select
//                           value={formData.discountType}
//                           onChange={(e) =>
//                             setFormData({
//                               ...formData,
//                               discountType: e.target.value as 'percentage' | 'fixed'
//                             })
//                           }
//                           className="w-full px-2 sm:px-3 py-2 border border-pink-200/50 rounded-lg focus:outline-none focus:ring-1 focus:ring-pink-400 focus:border-pink-400 transition-all text-xs appearance-none bg-white cursor-pointer"
//                         >
//                           <option value="percentage">%</option>
//                           <option value="fixed">AED</option>
//                         </select>
//                         <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
//                           <svg
//                             className="w-3 h-3 text-pink-400"
//                             fill="none"
//                             stroke="currentColor"
//                             viewBox="0 0 24 24"
//                           >
//                             <path
//                               strokeLinecap="round"
//                               strokeLinejoin="round"
//                               strokeWidth={2}
//                               d="M19 9l-7 7-7-7"
//                             />
//                           </svg>
//                         </div>
//                       </div>
//                     </div>
//                     <div>
//                       <label className="block text-xs font-medium text-pink-600 mb-1">Value</label>
//                       <input
//                         type="number"
//                         value={formData.discountValue || 0}
//                         onChange={(e) => {
//                           const v = e.target.value;
//                           if (v === '' || parseFloat(v) >= 0) {
//                             setFormData({
//                               ...formData,
//                               discountValue: v === '' ? 0 : parseFloat(v)
//                             });
//                           }
//                         }}
//                         className="w-full px-2 sm:px-3 py-2 border border-pink-200/50 rounded-lg focus:outline-none focus:ring-1 focus:ring-pink-400 focus:border-pink-400 transition-all text-xs [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
//                         min="0"
//                         step={formData.discountType === 'percentage' ? '1' : '0.01'}
//                         placeholder="0"
//                         required
//                       />
//                     </div>
//                   </div>

//                   {/* Dates */}
//                   <div className="grid grid-cols-2 gap-2">
//                     <div>
//                       <label className="block text-xs font-medium text-pink-600 mb-1">From</label>
//                       <input
//                         type="date"
//                         value={formData.validFrom}
//                         onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
//                         className="w-full px-2 sm:px-3 py-2 border border-pink-200/50 rounded-lg focus:outline-none focus:ring-1 focus:ring-pink-400 focus:border-pink-400 transition-all text-xs"
//                         required
//                       />
//                     </div>
//                     <div>
//                       <label className="block text-xs font-medium text-pink-600 mb-1">To</label>
//                       <input
//                         type="date"
//                         value={formData.validTo}
//                         onChange={(e) => setFormData({ ...formData, validTo: e.target.value })}
//                         className="w-full px-2 sm:px-3 py-2 border border-pink-200/50 rounded-lg focus:outline-none focus:ring-1 focus:ring-pink-400 focus:border-pink-400 transition-all text-xs"
//                         required
//                       />
//                     </div>
//                   </div>

//                   {/* Usage Limit */}
//                   <div>
//                     <label className="block text-xs font-medium text-pink-600 mb-1">
//                       Usage Limit
//                     </label>
//                     <input
//                       type="number"
//                       value={formData.usageLimit ?? ''}
//                       onChange={(e) => {
//                         const v = e.target.value;
//                         if (v === '' || parseInt(v) >= 0) {
//                           setFormData({
//                             ...formData,
//                             usageLimit: v === '' ? null : parseInt(v)
//                           });
//                         }
//                       }}
//                       className="w-full px-2 sm:px-3 py-2 border border-pink-200/50 rounded-lg focus:outline-none focus:ring-1 focus:ring-pink-400 focus:border-pink-400 transition-all text-xs [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
//                       min="1"
//                       placeholder="Unlimited"
//                     />
//                   </div>

//                   {/* Branches */}
//                   <div>
//                     <label className="block text-xs font-medium text-pink-600 mb-1">
//                       Target Branches
//                     </label>
//                     <div className="relative">
//                       <select
//                         onChange={(e) => {
//                           const branchId = e.target.value;
//                           if (branchId && !formData.targetBranches.includes(branchId)) {
//                             handleBranchSelection(branchId);
//                           }
//                           e.target.value = '';
//                         }}
//                         className="w-full px-2 sm:px-3 py-2 border border-pink-200/50 rounded-lg focus:outline-none focus:ring-1 focus:ring-pink-400 focus:border-pink-400 transition-all text-xs appearance-none bg-white cursor-pointer"
//                       >
//                         <option value="">Select branches...</option>
//                         {branches
//                           .filter((b) => b.id && !formData.targetBranches.includes(b.id))
//                           .map((branch) => (
//                             <option key={branch.id} value={branch.id!}>
//                               {branch.name}
//                             </option>
//                           ))}
//                       </select>
//                       <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
//                         <svg
//                           className="w-3 h-3 text-pink-400"
//                           fill="none"
//                           stroke="currentColor"
//                           viewBox="0 0 24 24"
//                         >
//                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
//                         </svg>
//                       </div>
//                     </div>

//                     {formData.targetBranches.length > 0 && (
//                       <div className="flex flex-wrap gap-1 mt-2">
//                         {formData.targetBranches.map((branchId) => {
//                           const branch = branches.find((b) => b.id === branchId);
//                           return (
//                             <div
//                               key={branchId}
//                               className="flex items-center bg-pink-100/60 text-pink-700 px-2 py-1 rounded-md text-xs"
//                             >
//                               <span className="mr-1">{branch?.name || 'Unknown'}</span>
//                               <button
//                                 type="button"
//                                 onClick={() => handleBranchSelection(branchId)}
//                                 className="text-pink-500 hover:text-pink-700 ml-1"
//                               >
//                                 ×
//                               </button>
//                             </div>
//                           );
//                         })}
//                       </div>
//                     )}
//                   </div>

//                   {/* Services */}
//                   <div>
//                     <label className="block text-xs font-medium text-pink-600 mb-1">
//                       Target Services
//                     </label>
//                     <div className="relative">
//                       <select
//                         onChange={(e) => {
//                           const serviceId = e.target.value;
//                           if (serviceId && !formData.targetServices.includes(serviceId)) {
//                             handleServiceSelection(serviceId);
//                           }
//                           e.target.value = '';
//                         }}
//                         className="w-full px-2 sm:px-3 py-2 border border-pink-200/50 rounded-lg focus:outline-none focus:ring-1 focus:ring-pink-400 focus:border-pink-400 transition-all text-xs appearance-none bg-white cursor-pointer"
//                       >
//                         <option value="">Select services...</option>
//                         {services
//                           .filter((s) => s.id && !formData.targetServices.includes(s.id))
//                           .map((service) => (
//                             <option key={service.id} value={service.id!}>
//                               {service.name}
//                             </option>
//                           ))}
//                       </select>
//                       <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
//                         <svg
//                           className="w-3 h-3 text-pink-400"
//                           fill="none"
//                           stroke="currentColor"
//                           viewBox="0 0 24 24"
//                         >
//                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
//                         </svg>
//                       </div>
//                     </div>

//                     {formData.targetServices.length > 0 && (
//                       <div className="flex flex-wrap gap-1 mt-2">
//                         {formData.targetServices.map((serviceId) => {
//                           const service = services.find((s) => s.id === serviceId);
//                           return (
//                             <div
//                               key={serviceId}
//                               className="flex items-center bg-blue-100/60 text-blue-700 px-2 py-1 rounded-md text-xs"
//                             >
//                               <span className="mr-1">{service?.name || 'Unknown'}</span>
//                               <button
//                                 type="button"
//                                 onClick={() => handleServiceSelection(serviceId)}
//                                 className="text-blue-500 hover:text-blue-700 ml-1"
//                               >
//                                 ×
//                               </button>
//                             </div>
//                           );
//                         })}
//                       </div>
//                     )}
//                   </div>

//                   {/* Active */}
//                   <div>
//                     <label className="flex items-center space-x-2">
//                       <input
//                         type="checkbox"
//                         checked={formData.isActive}
//                         onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
//                         className="w-3 h-3 text-pink-600 bg-gray-100 border-gray-300 rounded focus:ring-pink-500 focus:ring-1"
//                       />
//                       <span className="text-xs font-medium text-pink-600">Active</span>
//                     </label>
//                   </div>

//                   {/* Actions */}
//                   <div className="flex justify-end space-x-2 pt-2 sm:pt-3 border-t border-pink-100">
//                     <button
//                       type="button"
//                       onClick={resetForm}
//                       disabled={uploading}
//                       className="px-2 sm:px-3 py-1.5 text-pink-600 bg-pink-50/60 rounded-lg text-xs font-medium hover:bg-pink-100/60 transition-all disabled:opacity-50"
//                     >
//                       Cancel
//                     </button>
//                     <button
//                       type="submit"
//                       disabled={uploading}
//                       className="px-2 sm:px-3 py-1.5 bg-pink-500/10 hover:bg-pink-500/20 text-pink-600 rounded-lg text-xs font-medium border border-pink-200/50 hover:border-pink-300/50 transition-all disabled:opacity-50 flex items-center space-x-1"
//                     >
//                       {uploading && (
//                         <div className="animate-spin rounded-full h-3 w-3 border-b border-pink-600"></div>
//                       )}
//                       <span>{editingOffer ? 'Update' : 'Create'}</span>
//                     </button>
//                   </div>
//                 </form>
//               </div>
//             </div>
//           </div>
//         )}
//       </div>

//       {/* Delete Confirmation Modal */}
//       <ConfirmationModal
//         isOpen={showDeleteModal}
//         onClose={cancelDelete}
//         onConfirm={confirmDelete}
//         title="Delete Offer"
//         message={`Are you sure you want to delete "${(offerToDelete as any)?.title || ''}"? This action cannot be undone.`}
//         confirmText="Delete"
//         cancelText="Cancel"
//         type="danger"
//         loading={deleting}
//       />
//     </div>
//   );
// }





//firebase stored code
//updated code



// 'use client';

// import { useState, useEffect } from 'react';
// import {
//   addOffer,
//   updateOffer,
//   deleteOffer,
//   subscribeToOffersChanges,
//   addReferral,
//   updateReferral,
//   deleteReferral,
//   subscribeToReferralsChanges,
// } from '@/lib/firebaseServicesNoStorage';

// interface Offer {
//   id?: string;
//   name: string;
//   description: string;
//   discount: number;
//   startDate: string;
//   endDate: string;
// }

// interface Referral extends Offer {
//   referralCode: string;
// }

// export default function Dashboard() {
//   // ====== Offer states ======
//   const [offers, setOffers] = useState<Offer[]>([]);
//   const [showOfferModal, setShowOfferModal] = useState(false);
//   const [offerData, setOfferData] = useState<Offer>({
//     name: '',
//     description: '',
//     discount: 0,
//     startDate: '',
//     endDate: '',
//   });

//   // ====== Referral states ======
//   const [referrals, setReferrals] = useState<Referral[]>([]);
//   const [showReferralModal, setShowReferralModal] = useState(false);
//   const [referralData, setReferralData] = useState<Referral>({
//     name: '',
//     description: '',
//     discount: 0,
//     startDate: '',
//     endDate: '',
//     referralCode: '',
//   });

//   // ====== Firestore realtime listeners ======
//   useEffect(() => {
//     const unsubOffers = subscribeToOffersChanges(setOffers);
//     const unsubReferrals = subscribeToReferralsChanges(setReferrals);
//     return () => {
//       unsubOffers();
//       unsubReferrals();
//     };
//   }, []);

//   // ====== Offer handlers ======
//   const handleOfferSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     try {
//       await addOffer(offerData);
//       setOfferData({ name: '', description: '', discount: 0, startDate: '', endDate: '' });
//       setShowOfferModal(false);
//     } catch (err) {
//       console.error('Error saving offer', err);
//     }
//   };

//   // ====== Referral handlers ======
//   const handleReferralSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     try {
//       await addReferral(referralData);
//       setReferralData({ name: '', description: '', discount: 0, startDate: '', endDate: '', referralCode: '' });
//       setShowReferralModal(false);
//     } catch (err) {
//       console.error('Error saving referral', err);
//     }
//   };

//   return (
//     <div className="p-6">
//       {/* Header buttons */}
//       <div className="flex gap-2 mb-6">
//         <button
//           onClick={() => setShowOfferModal(true)}
//           className="px-4 py-2 bg-blue-500 text-white rounded-lg"
//         >
//           Create Offer
//         </button>
//         <button
//           onClick={() => setShowReferralModal(true)}
//           className="px-4 py-2 bg-green-600 text-white rounded-lg"
//         >
//           Add Referral
//         </button>
//       </div>

//       {/* ===== Offers List ===== */}
//       <h2 className="text-lg font-semibold mb-2">Offers</h2>
//       <ul className="space-y-2 mb-6">
//         {offers.map((offer) => (
//           <li key={offer.id} className="border p-3 rounded-lg">
//             <p className="font-medium">{offer.name}</p>
//             <p className="text-sm">{offer.description}</p>
//             <p className="text-sm text-gray-600">
//               Discount: {offer.discount}% | {offer.startDate} → {offer.endDate}
//             </p>
//           </li>
//         ))}
//       </ul>

//       {/* ===== Referrals List ===== */}
//       <h2 className="text-lg font-semibold mb-2">Referrals</h2>
//       <ul className="space-y-2">
//         {referrals.map((ref) => (
//           <li key={ref.id} className="border p-3 rounded-lg">
//             <p className="font-medium">{ref.name}</p>
//             <p className="text-sm">{ref.description}</p>
//             <p className="text-sm text-gray-600">
//               Discount: {ref.discount}% | {ref.startDate} → {ref.endDate}
//             </p>
//             <p className="text-sm font-semibold">Code: {ref.referralCode}</p>
//           </li>
//         ))}
//       </ul>

//       {/* ===== Offer Modal ===== */}
//       {showOfferModal && (
//         <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
//           <div className="bg-white p-6 rounded-xl w-96">
//             <h2 className="text-lg font-semibold mb-4">Create Offer</h2>
//             <form onSubmit={handleOfferSubmit} className="space-y-3">
//               <input
//                 type="text"
//                 placeholder="Offer Name"
//                 value={offerData.name}
//                 onChange={(e) => setOfferData({ ...offerData, name: e.target.value })}
//                 className="w-full border p-2 rounded"
//                 required
//               />
//               <textarea
//                 placeholder="Description"
//                 value={offerData.description}
//                 onChange={(e) => setOfferData({ ...offerData, description: e.target.value })}
//                 className="w-full border p-2 rounded"
//                 required
//               />
//               <input
//                 type="number"
//                 placeholder="Discount"
//                 value={offerData.discount}
//                 onChange={(e) => setOfferData({ ...offerData, discount: Number(e.target.value) })}
//                 className="w-full border p-2 rounded"
//                 required
//               />
//               <input
//                 type="date"
//                 value={offerData.startDate}
//                 onChange={(e) => setOfferData({ ...offerData, startDate: e.target.value })}
//                 className="w-full border p-2 rounded"
//                 required
//               />
//               <input
//                 type="date"
//                 value={offerData.endDate}
//                 onChange={(e) => setOfferData({ ...offerData, endDate: e.target.value })}
//                 className="w-full border p-2 rounded"
//                 required
//               />

//               <div className="flex justify-end gap-2 mt-4">
//                 <button
//                   type="button"
//                   onClick={() => setShowOfferModal(false)}
//                   className="px-4 py-2 bg-gray-300 rounded"
//                 >
//                   Cancel
//                 </button>
//                 <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">
//                   Save Offer
//                 </button>
//               </div>
//             </form>
//           </div>
//         </div>
//       )}

//       {/* ===== Referral Modal ===== */}
//       {showReferralModal && (
//         <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
//           <div className="bg-white p-6 rounded-xl w-96">
//             <h2 className="text-lg font-semibold mb-4">Add Referral</h2>
//             <form onSubmit={handleReferralSubmit} className="space-y-3">
//               <input
//                 type="text"
//                 placeholder="Referral Name"
//                 value={referralData.name}
//                 onChange={(e) => setReferralData({ ...referralData, name: e.target.value })}
//                 className="w-full border p-2 rounded"
//                 required
//               />
//               <textarea
//                 placeholder="Description"
//                 value={referralData.description}
//                 onChange={(e) => setReferralData({ ...referralData, description: e.target.value })}
//                 className="w-full border p-2 rounded"
//                 required
//               />
//               <input
//                 type="number"
//                 placeholder="Discount"
//                 value={referralData.discount}
//                 onChange={(e) => setReferralData({ ...referralData, discount: Number(e.target.value) })}
//                 className="w-full border p-2 rounded"
//                 required
//               />
//               <input
//                 type="date"
//                 value={referralData.startDate}
//                 onChange={(e) => setReferralData({ ...referralData, startDate: e.target.value })}
//                 className="w-full border p-2 rounded"
//                 required
//               />
//               <input
//                 type="date"
//                 value={referralData.endDate}
//                 onChange={(e) => setReferralData({ ...referralData, endDate: e.target.value })}
//                 className="w-full border p-2 rounded"
//                 required
//               />
//               {/* Extra field */}
//               <input
//                 type="text"
//                 placeholder="Referral Code"
//                 value={referralData.referralCode}
//                 onChange={(e) => setReferralData({ ...referralData, referralCode: e.target.value })}
//                 className="w-full border p-2 rounded"
//                 required
//               />

//               <div className="flex justify-end gap-2 mt-4">
//                 <button
//                   type="button"
//                   onClick={() => setShowReferralModal(false)}
//                   className="px-4 py-2 bg-gray-300 rounded"
//                 >
//                   Cancel
//                 </button>
//                 <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded">
//                   Save Referral
//                 </button>
//               </div>
//             </form>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }




//new code
// 'use client';

// import { useState, useEffect } from 'react';
// import {
//   addOffer,
//   deleteOffer,
//   subscribeToOffersChanges,
//   addReferral,
//   deleteReferral,
//   subscribeToReferralsChanges,
// } from '@/lib/firebaseServicesNoStorage';

// interface Offer {
//   id?: string;
//   name: string;
//   description: string;
//   discount: number;
//   startDate: string;
//   endDate: string;
// }

// interface Referral extends Offer {
//   referralCode: string;
// }

// export default function Dashboard() {
//   // ====== Offer states ======
//   const [offers, setOffers] = useState<Offer[]>([]);
//   const [showOfferModal, setShowOfferModal] = useState(false);
//   const [offerData, setOfferData] = useState<Offer>({
//     name: '',
//     description: '',
//     discount: 0,
//     startDate: '',
//     endDate: '',
//   });

//   // ====== Referral states ======
//   const [referrals, setReferrals] = useState<Referral[]>([]);
//   const [showReferralModal, setShowReferralModal] = useState(false);
//   const [referralData, setReferralData] = useState<Referral>({
//     name: '',
//     description: '',
//     discount: 0,
//     startDate: '',
//     endDate: '',
//     referralCode: '',
//   });

//   // ====== Firestore realtime listeners ======
//   useEffect(() => {
//     const unsubOffers = subscribeToOffersChanges(setOffers);
//     const unsubReferrals = subscribeToReferralsChanges(setReferrals);
//     return () => {
//       unsubOffers();
//       unsubReferrals();
//     };
//   }, []);

//   // ====== Offer handlers ======
//   const handleOfferSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     try {
//       await addOffer(offerData);
//       setOfferData({ name: '', description: '', discount: 0, startDate: '', endDate: '' });
//       setShowOfferModal(false);
//     } catch (err) {
//       console.error('Error saving offer', err);
//     }
//   };

//   // ====== Referral handlers ======
//   const handleReferralSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     try {
//       await addReferral(referralData);
//       setReferralData({ name: '', description: '', discount: 0, startDate: '', endDate: '', referralCode: '' });
//       setShowReferralModal(false);
//     } catch (err) {
//       console.error('Error saving referral', err);
//     }
//   };

//   return (
//     <div className="p-6">
//       {/* Header buttons */}
//       <div className="flex gap-2 mb-6">
//         <button
//           onClick={() => setShowOfferModal(true)}
//           className="px-4 py-2 bg-blue-500 text-white rounded-lg"
//         >
//           Create Offer
//         </button>
//         <button
//           onClick={() => setShowReferralModal(true)}
//           className="px-4 py-2 bg-green-600 text-white rounded-lg"
//         >
//           Add Referral
//         </button>
//       </div>

//       {/* ===== Offers List ===== */}
//       <h2 className="text-lg font-semibold mb-2">Offers</h2>
//       <ul className="space-y-2 mb-6">
//         {offers.map((offer) => (
//           <li key={offer.id} className="border p-3 rounded-lg flex justify-between items-center">
//             <div>
//               <p className="font-medium">{offer.name}</p>
//               <p className="text-sm">{offer.description}</p>
//               <p className="text-sm text-gray-600">
//                 Discount: {offer.discount}% | {offer.startDate} → {offer.endDate}
//               </p>
//             </div>
//             <button
//               onClick={() => offer.id && deleteOffer(offer.id)}
//               className="px-2 py-1 bg-red-500 text-white rounded text-xs"
//             >
//               Delete
//             </button>
//           </li>
//         ))}
//       </ul>

//       {/* ===== Referrals List ===== */}
//       <h2 className="text-lg font-semibold mb-2">Referrals</h2>
//       <ul className="space-y-2">
//         {referrals.map((ref) => (
//           <li key={ref.id} className="border p-3 rounded-lg flex justify-between items-center">
//             <div>
//               <p className="font-medium">{ref.name}</p>
//               <p className="text-sm">{ref.description}</p>
//               <p className="text-sm text-gray-600">
//                 Discount: {ref.discount}% | {ref.startDate} → {ref.endDate}
//               </p>
//               <p className="text-sm font-semibold">Code: {ref.referralCode}</p>
//             </div>
//             <button
//               onClick={() => ref.id && deleteReferral(ref.id)}
//               className="px-2 py-1 bg-red-500 text-white rounded text-xs"
//             >
//               Delete
//             </button>
//           </li>
//         ))}
//       </ul>

//       {/* ===== Offer Modal ===== */}
//       {showOfferModal && (
//         <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
//           <div className="bg-white p-6 rounded-xl w-96">
//             <h2 className="text-lg font-semibold mb-4">Create Offer</h2>
//             <form onSubmit={handleOfferSubmit} className="space-y-3">
//               <input
//                 type="text"
//                 placeholder="Offer Name"
//                 value={offerData.name}
//                 onChange={(e) => setOfferData({ ...offerData, name: e.target.value })}
//                 className="w-full border p-2 rounded"
//                 required
//               />
//               <textarea
//                 placeholder="Description"
//                 value={offerData.description}
//                 onChange={(e) => setOfferData({ ...offerData, description: e.target.value })}
//                 className="w-full border p-2 rounded"
//                 required
//               />
//               <input
//                 type="number"
//                 placeholder="Discount %"
//                 value={offerData.discount}
//                 onChange={(e) => setOfferData({ ...offerData, discount: Number(e.target.value) })}
//                 className="w-full border p-2 rounded"
//                 required
//               />
//               <input
//                 type="date"
//                 value={offerData.startDate}
//                 onChange={(e) => setOfferData({ ...offerData, startDate: e.target.value })}
//                 className="w-full border p-2 rounded"
//                 required
//               />
//               <input
//                 type="date"
//                 value={offerData.endDate}
//                 onChange={(e) => setOfferData({ ...offerData, endDate: e.target.value })}
//                 className="w-full border p-2 rounded"
//                 required
//               />

//               <div className="flex justify-end gap-2 mt-4">
//                 <button
//                   type="button"
//                   onClick={() => setShowOfferModal(false)}
//                   className="px-4 py-2 bg-gray-300 rounded"
//                 >
//                   Cancel
//                 </button>
//                 <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">
//                   Save Offer
//                 </button>
//               </div>
//             </form>
//           </div>
//         </div>
//       )}

//       {/* ===== Referral Modal ===== */}
//       {showReferralModal && (
//         <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
//           <div className="bg-white p-6 rounded-xl w-96">
//             <h2 className="text-lg font-semibold mb-4">Add Referral</h2>
//             <form onSubmit={handleReferralSubmit} className="space-y-3">
//               <input
//                 type="text"
//                 placeholder="Referral Name"
//                 value={referralData.name}
//                 onChange={(e) => setReferralData({ ...referralData, name: e.target.value })}
//                 className="w-full border p-2 rounded"
//                 required
//               />
//               <textarea
//                 placeholder="Description"
//                 value={referralData.description}
//                 onChange={(e) => setReferralData({ ...referralData, description: e.target.value })}
//                 className="w-full border p-2 rounded"
//                 required
//               />
//               <input
//                 type="number"
//                 placeholder="Discount"
//                 value={referralData.discount}
//                 onChange={(e) => setReferralData({ ...referralData, discount: Number(e.target.value) })}
//                 className="w-full border p-2 rounded"
//                 required
//               />
//               <input
//                 type="date"
//                 value={referralData.startDate}
//                 onChange={(e) => setReferralData({ ...referralData, startDate: e.target.value })}
//                 className="w-full border p-2 rounded"
//                 required
//               />
//               <input
//                 type="date"
//                 value={referralData.endDate}
//                 onChange={(e) => setReferralData({ ...referralData, endDate: e.target.value })}
//                 className="w-full border p-2 rounded"
//                 required
//               />
//               <input
//                 type="text"
//                 placeholder="Referral Code"
//                 value={referralData.referralCode}
//                 onChange={(e) => setReferralData({ ...referralData, referralCode: e.target.value })}
//                 className="w-full border p-2 rounded"
//                 required
//               />

//               <div className="flex justify-end gap-2 mt-4">
//                 <button
//                   type="button"
//                   onClick={() => setShowReferralModal(false)}
//                   className="px-4 py-2 bg-gray-300 rounded"
//                 >
//                   Cancel
//                 </button>
//                 <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded">
//                   Save Referral
//                 </button>
//               </div>
//             </form>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }






/// new ai code inshallah last code
// 'use client';

// import { useState, useEffect } from 'react';
// import {
//   addOffer,
//   deleteOffer,
//   subscribeToOffersChanges,
//   addReferral,
//   deleteReferral,
//   subscribeToReferralsChanges,
//   subscribeToBranchesChanges,
//   subscribeToServicesChanges,
// } from '@/lib/firebaseServicesNoStorage';

// // ====== Interfaces ======
// interface Branch {
//   id: string;
//   name: string;
// }
// interface Service {
//   id: string;
//   name: string;
// }
// interface Offer {
//   id?: string;
//   name: string;
//   description: string;
//   discountType: 'percentage' | 'flat';
//   discountValue: number;
//   startDate: string;
//   endDate: string;
//   usageLimit: number;
//   branches: { id: string; name: string }[];
//   services: { id: string; name: string }[];
//   isActive: boolean;
//   image?: string;
// }
// interface Referral extends Offer {
//   referralCode: string;
// }

// // ====== Reusable Modal Component ======
// function OfferReferralModal({
//   type,
//   data,
//   setData,
//   onClose,
//   onSubmit,
//   branches,
//   services,
// }: {
//   type: 'offer' | 'referral';
//   data: Offer | Referral;
//   setData: (d: any) => void;
//   onClose: () => void;
//   onSubmit: (e: React.FormEvent) => void;
//   branches: Branch[];
//   services: Service[];
// }) {
//   return (
//     <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
//       <div className="bg-white p-6 rounded-xl w-[500px] max-h-[90vh] overflow-y-auto shadow-xl">
//         <h2 className="text-lg font-semibold mb-4">
//           {type === 'offer' ? 'Create Offer' : 'Add Referral'}
//         </h2>

//         <form onSubmit={onSubmit} className="space-y-3">
//           {/* Image Upload */}
//           <input
//             type="file"
//             accept="image/*"
//             onChange={(e) => {
//               const file = e.target.files?.[0];
//               if (file) {
//                 const reader = new FileReader();
//                 reader.onloadend = () =>
//                   setData({ ...data, image: reader.result as string });
//                 reader.readAsDataURL(file);
//               }
//             }}
//             className="w-full border p-2 rounded"
//           />
//           {data.image && (
//             <img
//               src={data.image}
//               alt="preview"
//               className="w-24 h-24 object-cover rounded-md"
//             />
//           )}

//           {/* Name */}
//           <input
//             type="text"
//             placeholder="Name"
//             value={data.name}
//             onChange={(e) => setData({ ...data, name: e.target.value })}
//             className="w-full border p-2 rounded"
//             required
//           />

//           {/* Description */}
//           <textarea
//             placeholder="Description"
//             value={data.description}
//             onChange={(e) => setData({ ...data, description: e.target.value })}
//             className="w-full border p-2 rounded"
//             required
//           />

//           {/* Discount Type + Value */}
//           <div className="flex gap-2">
//             <select
//               value={data.discountType}
//               onChange={(e) =>
//                 setData({ ...data, discountType: e.target.value as 'percentage' | 'flat' })
//               }
//               className="border p-2 rounded w-1/2"
//               required
//             >
//               <option value="percentage">Percentage</option>
//               <option value="flat">Flat</option>
//             </select>
//             <input
//               type="number"
//               placeholder="Value"
//               value={data.discountValue}
//               onChange={(e) =>
//                 setData({ ...data, discountValue: Number(e.target.value) })
//               }
//               className="border p-2 rounded w-1/2"
//               required
//             />
//           </div>

//           {/* Dates */}
//           <div className="flex gap-2">
//             <input
//               type="date"
//               value={data.startDate}
//               onChange={(e) => setData({ ...data, startDate: e.target.value })}
//               className="w-1/2 border p-2 rounded"
//               required
//             />
//             <input
//               type="date"
//               value={data.endDate}
//               onChange={(e) => setData({ ...data, endDate: e.target.value })}
//               className="w-1/2 border p-2 rounded"
//               required
//             />
//           </div>

//           {/* Usage Limit */}
//           <input
//             type="number"
//             placeholder="Usage Limit"
//             value={data.usageLimit}
//             onChange={(e) => setData({ ...data, usageLimit: Number(e.target.value) })}
//             className="w-full border p-2 rounded"
//             required
//           />

//           {/* Branches */}
//           <label className="block font-medium">Target Branches</label>
//           <select
//             multiple
//             value={data.branches.map((b) => b.id)}
//             onChange={(e) =>
//               setData({
//                 ...data,
//                 branches: Array.from(e.target.selectedOptions, (o) => {
//                   const branch = branches.find((b) => b.id === o.value);
//                   return branch ? { id: branch.id, name: branch.name } : { id: o.value, name: o.value };
//                 }),
//               })
//             }
//             className="w-full border p-2 rounded h-24"
//           >
//             {branches.map((b) => (
//               <option key={b.id} value={b.id}>
//                 {b.name}
//               </option>
//             ))}
//           </select>

//           {/* Services */}
//           <label className="block font-medium">Target Services</label>
//           <select
//             multiple
//             value={data.services.map((s) => s.id)}
//             onChange={(e) =>
//               setData({
//                 ...data,
//                 services: Array.from(e.target.selectedOptions, (o) => {
//                   const service = services.find((s) => s.id === o.value);
//                   return service ? { id: service.id, name: service.name } : { id: o.value, name: o.value };
//                 }),
//               })
//             }
//             className="w-full border p-2 rounded h-24"
//           >
//             {services.map((s) => (
//               <option key={s.id} value={s.id}>
//                 {s.name}
//               </option>
//             ))}
//           </select>

//           {/* Active Toggle */}
//           <label className="flex items-center gap-2">
//             <input
//               type="checkbox"
//               checked={data.isActive}
//               onChange={(e) => setData({ ...data, isActive: e.target.checked })}
//             />
//             Active
//           </label>

//           {/* Referral Field */}
//           {type === 'referral' && (
//             <input
//               type="text"
//               placeholder="Referral Code"
//               value={(data as Referral).referralCode}
//               onChange={(e) =>
//                 setData({ ...data, referralCode: e.target.value })
//               }
//               className="w-full border p-2 rounded"
//               required
//             />
//           )}

//           {/* Buttons */}
//           <div className="flex justify-end gap-2 mt-4">
//             <button
//               type="button"
//               onClick={onClose}
//               className="px-4 py-2 bg-gray-300 rounded"
//             >
//               Cancel
//             </button>
//             <button
//               type="submit"
//               className={`px-4 py-2 rounded text-white ${
//                 type === 'offer' ? 'bg-blue-600' : 'bg-green-600'
//               }`}
//             >
//               {type === 'offer' ? 'Save Offer' : 'Save Referral'}
//             </button>
//           </div>
//         </form>
//       </div>
//     </div>
//   );
// }

// // ====== Main Page ======
// export default function Dashboard() {
//   const [offers, setOffers] = useState<Offer[]>([]);
//   const [referrals, setReferrals] = useState<Referral[]>([]);
//   const [branches, setBranches] = useState<Branch[]>([]);
//   const [services, setServices] = useState<Service[]>([]);
//   const [showModal, setShowModal] = useState<null | 'offer' | 'referral'>(null);

//   // Empty templates
//   const emptyOffer: Offer = {
//     name: '',
//     description: '',
//     discountType: 'percentage',
//     discountValue: 0,
//     startDate: '',
//     endDate: '',
//     usageLimit: 0,
//     branches: [],
//     services: [],
//     isActive: true,
//     image: '',
//   };
//   const emptyReferral: Referral = { ...emptyOffer, referralCode: '' };

//   const [offerData, setOfferData] = useState<Offer>(emptyOffer);
//   const [referralData, setReferralData] = useState<Referral>(emptyReferral);

//   // Firestore Listeners
//   useEffect(() => {
//     const unsubOffers = subscribeToOffersChanges(setOffers);
//     const unsubReferrals = subscribeToReferralsChanges(setReferrals);
//     const unsubBranches = subscribeToBranchesChanges(setBranches);
//     const unsubServices = subscribeToServicesChanges(setServices);
//     return () => {
//       unsubOffers();
//       unsubReferrals();
//       unsubBranches();
//       unsubServices();
//     };
//   }, []);

//   // Submit Handlers
//   const handleOfferSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     await addOffer(offerData);
//     setOfferData(emptyOffer);
//     setShowModal(null);
//   };

//   const handleReferralSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     await addReferral(referralData);
//     setReferralData(emptyReferral);
//     setShowModal(null);
//   };

//   return (
//     <div className="p-6">
//       {/* Buttons */}
//       <div className="flex gap-2 mb-6">
//         <button
//           onClick={() => setShowModal('offer')}
//           className="px-4 py-2 bg-blue-500 text-white rounded-lg"
//         >
//           Create Offer
//         </button>
//         <button
//           onClick={() => setShowModal('referral')}
//           className="px-4 py-2 bg-green-600 text-white rounded-lg"
//         >
//           Add Referral
//         </button>
//       </div>

//       {/* Offers List */}
//       <h2 className="text-lg font-semibold mb-2">Offers</h2>
//       <ul className="space-y-2 mb-6">
//         {offers.map((offer) => (
//           <li
//             key={offer.id}
//             className="border p-3 rounded-lg flex justify-between items-center"
//           >
//             <div>
//               <p className="font-medium">{offer.name}</p>
//               <p className="text-sm">{offer.description}</p>
//               <p className="text-sm text-gray-600">
//                 {offer.discountType === 'percentage'
//                   ? `${offer.discountValue}%`
//                   : `Rs. ${offer.discountValue}`}{' '}
//                 | {offer.startDate} → {offer.endDate}
//               </p>
//               <p className="text-xs text-gray-500">
//                 Branches: {offer.branches.map((b) => b.name).join(', ')}
//               </p>
//               <p className="text-xs text-gray-500">
//                 Services: {offer.services.map((s) => s.name).join(', ')}
//               </p>
//               <p className="text-xs text-gray-500">
//                 Active: {offer.isActive ? 'Yes' : 'No'}
//               </p>
//             </div>
//             <button
//               onClick={() => offer.id && deleteOffer(offer.id)}
//               className="px-2 py-1 bg-red-500 text-white rounded text-xs"
//             >
//               Delete
//             </button>
//           </li>
//         ))}
//       </ul>

//       {/* Referrals List */}
//       <h2 className="text-lg font-semibold mb-2">Referrals</h2>
//       <ul className="space-y-2">
//         {referrals.map((ref) => (
//           <li
//             key={ref.id}
//             className="border p-3 rounded-lg flex justify-between items-center"
//           >
//             <div>
//               <p className="font-medium">{ref.name}</p>
//               <p className="text-sm">{ref.description}</p>
//               <p className="text-sm text-gray-600">
//                 {ref.discountType === 'percentage'
//                   ? `${ref.discountValue}%`
//                   : `Rs. ${ref.discountValue}`}{' '}
//                 | {ref.startDate} → {ref.endDate}
//               </p>
//               <p className="text-sm font-semibold">Code: {ref.referralCode}</p>
//               <p className="text-xs text-gray-500">
//                 Branches: {ref.branches.map((b) => b.name).join(', ')}
//               </p>
//               <p className="text-xs text-gray-500">
//                 Services: {ref.services.map((s) => s.name).join(', ')}
//               </p>
//               <p className="text-xs text-gray-500">
//                 Active: {ref.isActive ? 'Yes' : 'No'}
//               </p>
//             </div>
//             <button
//               onClick={() => ref.id && deleteReferral(ref.id)}
//               className="px-2 py-1 bg-red-500 text-white rounded text-xs"
//             >
//               Delete
//             </button>
//           </li>
//         ))}
//       </ul>

//       {/* Modal */}
//       {showModal === 'offer' && (
//         <OfferReferralModal
//           type="offer"
//           data={offerData}
//           setData={setOfferData}
//           onClose={() => setShowModal(null)}
//           onSubmit={handleOfferSubmit}
//           branches={branches}
//           services={services}
//         />
//       )}
//       {showModal === 'referral' && (
//         <OfferReferralModal
//           type="referral"
//           data={referralData}
//           setData={setReferralData}
//           onClose={() => setShowModal(null)}
//           onSubmit={handleReferralSubmit}
//           branches={branches}
//           services={services}
//         />
//       )}
//     </div>
//   );
// }


//new popup code
// 'use client';

// import { useState, useEffect } from 'react';
// import {
//   addOffer,
//   updateOffer,
//   deleteOffer,
//   subscribeToOffersChanges,
//   addReferral,
//   updateReferral,
//   deleteReferral,
//   subscribeToReferralsChanges,
//   subscribeToBranchesChanges,
//   subscribeToServicesChanges,
// } from '@/lib/firebaseServicesNoStorage';

// interface Branch {
//   id: string;
//   name: string;
// }

// interface Service {
//   id: string;
//   name: string;
// }

// interface Offer {
//   id?: string;
//   name: string;
//   description: string;
//   discount: number;
//   discountType: 'percentage' | 'flat';
//   startDate: string;
//   endDate: string;
//   usageLimit: number;
//   branches: Branch[];
//   services: Service[];
//   active: boolean;
//   image?: string;
// }

// interface Referral {
//   id?: string;
//   name: string;
//   description: string;
//   discount: number;
//   discountType: 'percentage' | 'flat';
//   startDate: string;
//   endDate: string;
//   usageLimit: number;
//   services: Service[];
//   active: boolean;
//   referralCode: string;
// }

// export default function Page() {
//   const [offers, setOffers] = useState<Offer[]>([]);
//   const [referrals, setReferrals] = useState<Referral[]>([]);
//   const [branches, setBranches] = useState<Branch[]>([]);
//   const [services, setServices] = useState<Service[]>([]);
//   const [showModal, setShowModal] = useState(false);
//   const [modalType, setModalType] = useState<'offer' | 'referral'>('offer');
//   const [formData, setFormData] = useState<any>({});

//   useEffect(() => {
//     const unsubOffers = subscribeToOffersChanges(setOffers);
//     const unsubReferrals = subscribeToReferralsChanges(setReferrals);
//     const unsubBranches = subscribeToBranchesChanges(setBranches);
//     const unsubServices = subscribeToServicesChanges(setServices);
//     return () => {
//       unsubOffers();
//       unsubReferrals();
//       unsubBranches();
//       unsubServices();
//     };
//   }, []);

//   const openModal = (type: 'offer' | 'referral', data: any = null) => {
//     setModalType(type);
//     if (data) setFormData(data);
//     else {
//       setFormData({
//         name: '',
//         description: '',
//         discount: 0,
//         discountType: 'percentage',
//         startDate: '',
//         endDate: '',
//         usageLimit: 0,
//         branches: [],
//         services: [],
//         active: true,
//         ...(type === 'referral' ? { referralCode: '' } : { image: '' }),
//       });
//     }
//     setShowModal(true);
//   };

//   const handleSubmit = async () => {
//     if (modalType === 'offer') {
//       if (formData.id) await updateOffer(formData.id, formData);
//       else await addOffer(formData);
//     } else {
//       if (formData.id) await updateReferral(formData.id, formData);
//       else await addReferral(formData);
//     }
//     setShowModal(false);
//   };

//   return (
//     <div className="p-6">
//       {/* Action Buttons */}
//       <div className="flex gap-4 mb-6">
//         <button
//           className="px-4 py-2 bg-blue-600 text-white rounded-lg"
//           onClick={() => openModal('offer')}
//         >
//           Create Offer
//         </button>
//         <button
//           className="px-4 py-2 bg-green-600 text-white rounded-lg"
//           onClick={() => openModal('referral')}
//         >
//           Create Referral
//         </button>
//       </div>

//       {/* Offers List */}
//       <h2 className="text-xl font-semibold mb-2">Offers</h2>
//       <ul className="space-y-2 mb-6">
//         {offers.map((offer) => (
//           <li
//             key={offer.id}
//             className="border p-4 rounded-lg flex justify-between items-center"
//           >
//             <div>
//               <h3 className="font-bold">{offer.name}</h3>
//               <p>{offer.description}</p>
//             </div>
//             <div className="flex gap-2">
//               <button
//                 className="px-3 py-1 bg-yellow-500 text-white rounded"
//                 onClick={() => openModal('offer', offer)}
//               >
//                 Edit
//               </button>
//               <button
//                 className="px-3 py-1 bg-red-500 text-white rounded"
//                 onClick={() => offer.id && deleteOffer(offer.id)}
//               >
//                 Delete
//               </button>
//             </div>
//           </li>
//         ))}
//       </ul>

//       {/* Referrals List */}
//       <h2 className="text-xl font-semibold mb-2">Referrals</h2>
//       <ul className="space-y-2">
//         {referrals.map((ref) => (
//           <li
//             key={ref.id}
//             className="border p-4 rounded-lg flex justify-between items-center"
//           >
//             <div>
//               <h3 className="font-bold">{ref.name}</h3>
//               <p>{ref.description}</p>
//               <p className="text-sm text-gray-500">Code: {ref.referralCode}</p>
//             </div>
//             <div className="flex gap-2">
//               <button
//                 className="px-3 py-1 bg-yellow-500 text-white rounded"
//                 onClick={() => openModal('referral', ref)}
//               >
//                 Edit
//               </button>
//               <button
//                 className="px-3 py-1 bg-red-500 text-white rounded"
//                 onClick={() => ref.id && deleteReferral(ref.id)}
//               >
//                 Delete
//               </button>
//             </div>
//           </li>
//         ))}
//       </ul>

//       {/* Modal */}
//       {showModal && (
//         <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
//           <div className="bg-white rounded-xl shadow-lg w-full max-w-2xl p-6 overflow-y-auto max-h-[90vh]">
//             <h2 className="text-lg font-semibold mb-4">
//               {modalType === 'offer'
//                 ? formData.id
//                   ? 'Edit Offer'
//                   : 'Create Offer'
//                 : formData.id
//                 ? 'Edit Referral'
//                 : 'Create Referral'}
//             </h2>

//             <div className="space-y-4">
//               {/* Image - Only for Offer */}
//               {modalType === 'offer' && (
//                 <div>
//                   <label className="block font-medium mb-1">Image</label>
//                   <input
//                     type="file"
//                     accept="image/*"
//                     onChange={async (e) => {
//                       const file = e.target.files?.[0];
//                       if (file) {
//                         const reader = new FileReader();
//                         reader.onload = () =>
//                           setFormData({ ...formData, image: reader.result });
//                         reader.readAsDataURL(file);
//                       }
//                     }}
//                     className="w-full border rounded px-3 py-2"
//                   />
//                   {formData.image && (
//                     <img
//                       src={formData.image}
//                       alt="preview"
//                       className="mt-2 h-20 rounded"
//                     />
//                   )}
//                 </div>
//               )}

//               {/* Common Fields */}
//               <input
//                 type="text"
//                 placeholder="Name"
//                 className="w-full border rounded px-3 py-2"
//                 value={formData.name}
//                 onChange={(e) =>
//                   setFormData({ ...formData, name: e.target.value })
//                 }
//               />
//               <textarea
//                 placeholder="Description"
//                 className="w-full border rounded px-3 py-2"
//                 value={formData.description}
//                 onChange={(e) =>
//                   setFormData({ ...formData, description: e.target.value })
//                 }
//               />

//               <div className="flex gap-4">
//                 <select
//                   className="border rounded px-3 py-2"
//                   value={formData.discountType}
//                   onChange={(e) =>
//                     setFormData({ ...formData, discountType: e.target.value })
//                   }
//                 >
//                   <option value="percentage">Percentage</option>
//                   <option value="flat">Flat</option>
//                 </select>
//                 <input
//                   type="number"
//                   placeholder="Discount"
//                   className="border rounded px-3 py-2 flex-1"
//                   value={formData.discount}
//                   onChange={(e) =>
//                     setFormData({
//                       ...formData,
//                       discount: Number(e.target.value),
//                     })
//                   }
//                 />
//               </div>

//               <div className="flex gap-4">
//                 <input
//                   type="date"
//                   className="border rounded px-3 py-2 flex-1"
//                   value={formData.startDate}
//                   onChange={(e) =>
//                     setFormData({ ...formData, startDate: e.target.value })
//                   }
//                 />
//                 <input
//                   type="date"
//                   className="border rounded px-3 py-2 flex-1"
//                   value={formData.endDate}
//                   onChange={(e) =>
//                     setFormData({ ...formData, endDate: e.target.value })
//                   }
//                 />
//               </div>

//               <input
//                 type="number"
//                 placeholder="Usage Limit"
//                 className="w-full border rounded px-3 py-2"
//                 value={formData.usageLimit}
//                 onChange={(e) =>
//                   setFormData({ ...formData, usageLimit: Number(e.target.value) })
//                 }
//               />

//               {/* Branches - Only for Offer */}
//               {modalType === 'offer' && (
//                 <div>
//                   <label className="block font-medium mb-1">Branches</label>
//                   <select
//                     multiple
//                     className="w-full border rounded px-3 py-2"
//                     value={formData.branches.map((b: Branch) => b.id)}
//                     onChange={(e) => {
//                       const selected = Array.from(
//                         e.target.selectedOptions
//                       ).map((o) => {
//                         const branch = branches.find((b) => b.id === o.value);
//                         return branch ? { id: branch.id, name: branch.name } : null;
//                       });
//                       setFormData({
//                         ...formData,
//                         branches: selected.filter((b) => b !== null),
//                       });
//                     }}
//                   >
//                     {branches.map((b) => (
//                       <option key={b.id} value={b.id}>
//                         {b.name}
//                       </option>
//                     ))}
//                   </select>
//                 </div>
//               )}

//               {/* Services - For both */}
//               <div>
//                 <label className="block font-medium mb-1">Services</label>
//                 <select
//                   multiple
//                   className="w-full border rounded px-3 py-2"
//                   value={formData.services.map((s: Service) => s.id)}
//                   onChange={(e) => {
//                     const selected = Array.from(e.target.selectedOptions).map(
//                       (o) => {
//                         const service = services.find((s) => s.id === o.value);
//                         return service ? { id: service.id, name: service.name } : null;
//                       }
//                     );
//                     setFormData({
//                       ...formData,
//                       services: selected.filter((s) => s !== null),
//                     });
//                   }}
//                 >
//                   {services.map((s) => (
//                     <option key={s.id} value={s.id}>
//                       {s.name}
//                     </option>
//                   ))}
//                 </select>
//               </div>

//               {/* Referral Code - Only for Referral */}
//               {modalType === 'referral' && (
//                 <input
//                   type="text"
//                   placeholder="Referral Code"
//                   className="w-full border rounded px-3 py-2"
//                   value={formData.referralCode}
//                   onChange={(e) =>
//                     setFormData({ ...formData, referralCode: e.target.value })
//                   }
//                 />
//               )}

//               {/* Active Toggle */}
//               <label className="flex items-center gap-2">
//                 <input
//                   type="checkbox"
//                   checked={formData.active}
//                   onChange={(e) =>
//                     setFormData({ ...formData, active: e.target.checked })
//                   }
//                 />
//                 Active
//               </label>
//             </div>

//             {/* Actions */}
//             <div className="mt-6 flex justify-end gap-3">
//               <button
//                 className="px-4 py-2 rounded bg-gray-300"
//                 onClick={() => setShowModal(false)}
//               >
//                 Cancel
//               </button>
//               <button
//                 className="px-4 py-2 rounded bg-blue-600 text-white"
//                 onClick={handleSubmit}
//               >
//                 {formData.id ? 'Update' : 'Create'}
//               </button>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }


// final code inshallah
// branch fetch issue
// 'use client';

// import { useState, useEffect } from 'react';
// import Image from 'next/image';
// import {
//   addOffer,
//   updateOffer,
//   deleteOffer,
//   subscribeToOffersChanges,
//   addReferral,
//   updateReferral,
//   deleteReferral,
//   subscribeToReferralsChanges,
//   subscribeToBranchesChanges,
//   subscribeToServicesChanges,
// } from '@/lib/firebaseServicesNoStorage';
// import { Pencil, Trash2 } from 'lucide-react';

// // Interfaces
// interface Offer {
//   id?: string;
//   name: string;
//   description: string;
//   discount: number;
//   usageLimit: number;
//   startDate: string;
//   endDate: string;
//   isActive: boolean;
//   image?: string;
//   branches: { id: string; name: string }[];
//   services: { id: string; name: string }[];
// }

// interface Referral {
//   id?: string;
//   name: string;
//   description: string;
//   discount: number;
//   usageLimit: number;
//   startDate: string;
//   endDate: string;
//   isActive: boolean;
//   services: { id: string; name: string }[];
// }

// interface Branch {
//   id: string;
//   name: string;
// }

// interface Service {
//   id: string;
//   name: string;
// }

// export default function Page() {
//   const [offers, setOffers] = useState<Offer[]>([]);
//   const [referrals, setReferrals] = useState<Referral[]>([]);
//   const [branches, setBranches] = useState<Branch[]>([]);
//   const [services, setServices] = useState<Service[]>([]);
//   const [isOpen, setIsOpen] = useState(false);
//   const [modalType, setModalType] = useState<'offer' | 'referral'>('offer');
//   const [editingItem, setEditingItem] = useState<Offer | Referral | null>(null);
//   const [formData, setFormData] = useState<any>({});

//   // Fetch realtime data
//   useEffect(() => {
//     const unsubOffers = subscribeToOffersChanges(setOffers);
//     const unsubReferrals = subscribeToReferralsChanges(setReferrals);
//     const unsubBranches = subscribeToBranchesChanges(setBranches);
//     const unsubServices = subscribeToServicesChanges(setServices);
//     return () => {
//       unsubOffers();
//       unsubReferrals();
//       unsubBranches();
//       unsubServices();
//     };
//   }, []);

//   // Open popup
//   const openModal = (type: 'offer' | 'referral', item: any = null) => {
//     setModalType(type);
//     setEditingItem(item);
//     setFormData(
//       item || {
//         name: '',
//         description: '',
//         discount: 0,
//         usageLimit: 0,
//         startDate: '',
//         endDate: '',
//         isActive: true,
//         image: '',
//         branches: [],
//         services: [],
//       }
//     );
//     setIsOpen(true);
//   };

//   const closeModal = () => {
//     setIsOpen(false);
//     setEditingItem(null);
//     setFormData({});
//   };

//   // Submit form
//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     if (modalType === 'offer') {
//       if (editingItem?.id) {
//         await updateOffer(editingItem.id, formData);
//       } else {
//         await addOffer(formData);
//       }
//     } else {
//       if (editingItem?.id) {
//         await updateReferral(editingItem.id, formData);
//       } else {
//         await addReferral(formData);
//       }
//     }
//     closeModal();
//   };

//   // Delete
//   const handleDelete = async (type: 'offer' | 'referral', id: string) => {
//     if (!confirm('Are you sure you want to delete this item?')) return;
//     if (type === 'offer') {
//       await deleteOffer(id);
//     } else {
//       await deleteReferral(id);
//     }
//   };

//   return (
//     <div className="p-6 space-y-10">
//       {/* Action buttons */}
//       <div className="flex gap-4">
//         <button
//           onClick={() => openModal('offer')}
//           className="px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700"
//         >
//           + Create Offer
//         </button>
//         <button
//           onClick={() => openModal('referral')}
//           className="px-4 py-2 bg-green-600 text-white rounded-lg shadow hover:bg-green-700"
//         >
//           + Create Referral
//         </button>
//       </div>

//       {/* Offers Table */}
//       <div>
//         <h2 className="text-xl font-semibold mb-4">Offers</h2>
//         <div className="overflow-x-auto rounded-lg shadow">
//           <table className="min-w-full bg-white border">
//             <thead className="bg-gray-100">
//               <tr>
//                 <th className="p-3 border">Image</th>
//                 <th className="p-3 border">Title</th>
//                 <th className="p-3 border">Description</th>
//                 <th className="p-3 border">Discount</th>
//                 <th className="p-3 border">Usage Limit</th>
//                 <th className="p-3 border">Start Date</th>
//                 <th className="p-3 border">End Date</th>
//                 <th className="p-3 border">Active</th>
//                 <th className="p-3 border">Branches</th>
//                 <th className="p-3 border">Services</th>
//                 <th className="p-3 border">Actions</th>
//               </tr>
//             </thead>
//             <tbody>
//               {offers.map((offer) => (
//                 <tr key={offer.id} className="border-t hover:bg-gray-50">
//                   <td className="p-2 border">
//                     {offer.image && (
//                       <Image
//                         src={offer.image}
//                         alt={offer.name}
//                         width={60}
//                         height={60}
//                         className="rounded"
//                       />
//                     )}
//                   </td>
//                   <td className="p-2 border">{offer.name}</td>
//                   <td className="p-2 border">{offer.description}</td>
//                   <td className="p-2 border">{offer.discount}%</td>
//                   <td className="p-2 border">{offer.usageLimit}</td>
//                   <td className="p-2 border">{offer.startDate}</td>
//                   <td className="p-2 border">{offer.endDate}</td>
//                   <td className="p-2 border">{offer.isActive ? 'Yes' : 'No'}</td>
//                   <td className="p-2 border">
//                     {offer.branches.map((b) => b.name).join(', ')}
//                   </td>
//                   <td className="p-2 border">
//                     {offer.services.map((s) => s.name).join(', ')}
//                   </td>
//                   <td className="p-2 border flex gap-2">
//                     <button
//                       onClick={() => openModal('offer', offer)}
//                       className="p-2 rounded bg-blue-100 hover:bg-blue-200"
//                     >
//                       <Pencil size={16} className="text-blue-600" />
//                     </button>
//                     <button
//                       onClick={() => handleDelete('offer', offer.id!)}
//                       className="p-2 rounded bg-red-100 hover:bg-red-200"
//                     >
//                       <Trash2 size={16} className="text-red-600" />
//                     </button>
//                   </td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </div>
//       </div>

//       {/* Referrals Table */}
//       <div>
//         <h2 className="text-xl font-semibold mb-4">Referrals</h2>
//         <div className="overflow-x-auto rounded-lg shadow">
//           <table className="min-w-full bg-white border">
//             <thead className="bg-gray-100">
//               <tr>
//                 <th className="p-3 border">Title</th>
//                 <th className="p-3 border">Description</th>
//                 <th className="p-3 border">Discount</th>
//                 <th className="p-3 border">Usage Limit</th>
//                 <th className="p-3 border">Start Date</th>
//                 <th className="p-3 border">End Date</th>
//                 <th className="p-3 border">Active</th>
//                 <th className="p-3 border">Services</th>
//                 <th className="p-3 border">Actions</th>
//               </tr>
//             </thead>
//             <tbody>
//               {referrals.map((ref) => (
//                 <tr key={ref.id} className="border-t hover:bg-gray-50">
//                   <td className="p-2 border">{ref.name}</td>
//                   <td className="p-2 border">{ref.description}</td>
//                   <td className="p-2 border">{ref.discount}%</td>
//                   <td className="p-2 border">{ref.usageLimit}</td>
//                   <td className="p-2 border">{ref.startDate}</td>
//                   <td className="p-2 border">{ref.endDate}</td>
//                   <td className="p-2 border">{ref.isActive ? 'Yes' : 'No'}</td>
//                   <td className="p-2 border">
//                     {ref.services.map((s) => s.name).join(', ')}
//                   </td>
//                   <td className="p-2 border flex gap-2">
//                     <button
//                       onClick={() => openModal('referral', ref)}
//                       className="p-2 rounded bg-blue-100 hover:bg-blue-200"
//                     >
//                       <Pencil size={16} className="text-blue-600" />
//                     </button>
//                     <button
//                       onClick={() => handleDelete('referral', ref.id!)}
//                       className="p-2 rounded bg-red-100 hover:bg-red-200"
//                     >
//                       <Trash2 size={16} className="text-red-600" />
//                     </button>
//                   </td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </div>
//       </div>

//       {/* Modal */}
//       {isOpen && (
//         <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
//           <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl p-6 max-h-[80vh] overflow-y-auto">
//             <h2 className="text-lg font-semibold mb-4">
//               {editingItem ? 'Edit' : 'Create'}{' '}
//               {modalType === 'offer' ? 'Offer' : 'Referral'}
//             </h2>
//             <form onSubmit={handleSubmit} className="space-y-4">
//               {/* Name */}
//               <input
//                 type="text"
//                 placeholder="Title"
//                 value={formData.name || ''}
//                 onChange={(e) =>
//                   setFormData({ ...formData, name: e.target.value })
//                 }
//                 className="w-full border p-2 rounded"
//                 required
//               />
//               {/* Description */}
//               <textarea
//                 placeholder="Description"
//                 value={formData.description || ''}
//                 onChange={(e) =>
//                   setFormData({ ...formData, description: e.target.value })
//                 }
//                 className="w-full border p-2 rounded"
//                 required
//               />
//               {/* Discount */}
//               <input
//                 type="number"
//                 placeholder="Discount %"
//                 value={formData.discount || ''}
//                 onChange={(e) =>
//                   setFormData({ ...formData, discount: Number(e.target.value) })
//                 }
//                 className="w-full border p-2 rounded"
//                 required
//               />
//               {/* Usage Limit */}
//               <input
//                 type="number"
//                 placeholder="Usage Limit"
//                 value={formData.usageLimit || ''}
//                 onChange={(e) =>
//                   setFormData({
//                     ...formData,
//                     usageLimit: Number(e.target.value),
//                   })
//                 }
//                 className="w-full border p-2 rounded"
//                 required
//               />
//               {/* Dates */}
//               <div className="flex gap-4">
//                 <input
//                   type="date"
//                   value={formData.startDate || ''}
//                   onChange={(e) =>
//                     setFormData({ ...formData, startDate: e.target.value })
//                   }
//                   className="w-full border p-2 rounded"
//                   required
//                 />
//                 <input
//                   type="date"
//                   value={formData.endDate || ''}
//                   onChange={(e) =>
//                     setFormData({ ...formData, endDate: e.target.value })
//                   }
//                   className="w-full border p-2 rounded"
//                   required
//                 />
//               </div>
//               {/* Active */}
//               <label className="flex items-center gap-2">
//                 <input
//                   type="checkbox"
//                   checked={formData.isActive || false}
//                   onChange={(e) =>
//                     setFormData({ ...formData, isActive: e.target.checked })
//                   }
//                 />
//                 Active
//               </label>

//               {/* Only for Offers */}
//               {modalType === 'offer' && (
//                 <>
//                   {/* Image */}
//                   <input
//                     type="text"
//                     placeholder="Image URL"
//                     value={formData.image || ''}
//                     onChange={(e) =>
//                       setFormData({ ...formData, image: e.target.value })
//                     }
//                     className="w-full border p-2 rounded"
//                   />
//                   {/* Branches */}
//                   <div>
//                     <label className="block font-medium">Branches</label>
//                     <div className="flex flex-wrap gap-2">
//                       {branches.map((b) => (
//                         <label key={b.id} className="flex items-center gap-1">
//                           <input
//                             type="checkbox"
//                             checked={formData.branches?.some(
//                               (br: any) => br.id === b.id
//                             )}
//                             onChange={(e) => {
//                               const updated = e.target.checked
//                                 ? [...formData.branches, b]
//                                 : formData.branches.filter(
//                                     (br: any) => br.id !== b.id
//                                   );
//                               setFormData({ ...formData, branches: updated });
//                             }}
//                           />
//                           {b.name}
//                         </label>
//                       ))}
//                     </div>
//                   </div>
//                 </>
//               )}

//               {/* Services */}
//               <div>
//                 <label className="block font-medium">Services</label>
//                 <div className="flex flex-wrap gap-2">
//                   {services.map((s) => (
//                     <label key={s.id} className="flex items-center gap-1">
//                       <input
//                         type="checkbox"
//                         checked={formData.services?.some(
//                           (sv: any) => sv.id === s.id
//                         )}
//                         onChange={(e) => {
//                           const updated = e.target.checked
//                             ? [...formData.services, s]
//                             : formData.services.filter(
//                                 (sv: any) => sv.id !== s.id
//                               );
//                           setFormData({ ...formData, services: updated });
//                         }}
//                       />
//                       {s.name}
//                     </label>
//                   ))}
//                 </div>
//               </div>

//               {/* Buttons */}
//               <div className="flex justify-end gap-2 pt-4">
//                 <button
//                   type="button"
//                   onClick={closeModal}
//                   className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300"
//                 >
//                   Cancel
//                 </button>
//                 <button
//                   type="submit"
//                   className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
//                 >
//                   {editingItem ? 'Update' : 'Create'}
//                 </button>
//               </div>
//             </form>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }
// 'use client';

// import { useState, useEffect } from 'react';
// import Image from 'next/image';
// import {
//   addOffer,
//   updateOffer,
//   deleteOffer,
//   subscribeToOffersChanges,
//   addReferral,
//   updateReferral,
//   deleteReferral,
//   subscribeToReferralsChanges,
//   subscribeToBranchesChanges,
//   subscribeToServicesChanges,
// } from '@/lib/firebaseServicesNoStorage';
// import { Pencil, Trash2 } from 'lucide-react';

// // Interfaces
// interface Offer {
//   id?: string;
//   name: string;
//   description: string;
//   discount: number;
//   usageLimit: number;
//   startDate: string;
//   endDate: string;
//   isActive: boolean;
//   image?: string;
//   branches?: { id: string; name: string }[];   // ✅ id + name
//   services?: { id: string; name: string }[];   // ✅ id + name
// }

// interface Referral {
//   id?: string;
//   name: string;
//   description: string;
//   discount: number;
//   usageLimit: number;
//   startDate: string;
//   endDate: string;
//   isActive: boolean;
//   services?: { id: string; name: string }[];   // ✅ id + name
// }

// interface Branch {
//   id: string;
//   name: string;
// }

// interface Service {
//   id: string;
//   name: string;
// }

// export default function Page() {
//   const [offers, setOffers] = useState<Offer[]>([]);
//   const [referrals, setReferrals] = useState<Referral[]>([]);
//   const [branches, setBranches] = useState<Branch[]>([]);
//   const [services, setServices] = useState<Service[]>([]);
//   const [isOpen, setIsOpen] = useState(false);
//   const [modalType, setModalType] = useState<'offer' | 'referral'>('offer');
//   const [editingItem, setEditingItem] = useState<Offer | Referral | null>(null);
//   const [formData, setFormData] = useState<any>({});

//   // Fetch realtime data
//   useEffect(() => {
//     const unsubOffers = subscribeToOffersChanges(setOffers);
//     const unsubReferrals = subscribeToReferralsChanges(setReferrals);
//     const unsubBranches = subscribeToBranchesChanges(setBranches);
//     const unsubServices = subscribeToServicesChanges(setServices);
//     return () => {
//       unsubOffers();
//       unsubReferrals();
//       unsubBranches();
//       unsubServices();
//     };
//   }, []);

//   // Open popup
//   const openModal = (type: 'offer' | 'referral', item: any = null) => {
//     setModalType(type);
//     setEditingItem(item);
//     setFormData(
//       item || {
//         name: '',
//         description: '',
//         discount: 0,
//         usageLimit: 0,
//         startDate: '',
//         endDate: '',
//         isActive: true,
//         image: '',
//         branches: [],
//         services: [],
//       }
//     );
//     setIsOpen(true);
//   };

//   const closeModal = () => {
//     setIsOpen(false);
//     setEditingItem(null);
//     setFormData({});
//   };

//   // Submit form
//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();

//     // ✅ Ab sirf { id, name } save hoga Firebase me
//     const dataToSave = {
//       ...formData,
//       branches: formData.branches?.map((bName: string) => {
//         const branchObj = branches.find((br) => br.name === bName);
//         return branchObj ? { id: branchObj.id, name: branchObj.name } : { id: '', name: bName };
//       }),
//       services: formData.services?.map((sName: string) => {
//         const serviceObj = services.find((sv) => sv.name === sName);
//         return serviceObj ? { id: serviceObj.id, name: serviceObj.name } : { id: '', name: sName };
//       }),
//     };

//     if (modalType === 'offer') {
//       if (editingItem?.id) {
//         await updateOffer(editingItem.id, dataToSave);
//       } else {
//         await addOffer(dataToSave);
//       }
//     } else {
//       if (editingItem?.id) {
//         await updateReferral(editingItem.id, dataToSave);
//       } else {
//         await addReferral(dataToSave);
//       }
//     }
//     closeModal();
//   };

//   // Delete
//   const handleDelete = async (type: 'offer' | 'referral', id: string) => {
//     if (!confirm('Are you sure you want to delete this item?')) return;
//     if (type === 'offer') {
//       await deleteOffer(id);
//     } else {
//       await deleteReferral(id);
//     }
//   };

//   return (
//     <div className="p-6 space-y-10">
//       {/* Action buttons */}
//       <div className="flex gap-4">
//         <button
//           onClick={() => openModal('offer')}
//           className="px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700"
//         >
//           + Create Offer
//         </button>
//         <button
//           onClick={() => openModal('referral')}
//           className="px-4 py-2 bg-green-600 text-white rounded-lg shadow hover:bg-green-700"
//         >
//           + Create Referral
//         </button>
//       </div>

//       {/* Offers Table */}
//       <div>
//         <h2 className="text-xl font-semibold mb-4">Offers</h2>
//         <div className="overflow-x-auto rounded-lg shadow">
//           <table className="min-w-full bg-white border">
//             <thead className="bg-gray-100">
//               <tr>
//                 <th className="p-3 border">Image</th>
//                 <th className="p-3 border">Title</th>
//                 <th className="p-3 border">Description</th>
//                 <th className="p-3 border">Discount</th>
//                 <th className="p-3 border">Usage Limit</th>
//                 <th className="p-3 border">Start Date</th>
//                 <th className="p-3 border">End Date</th>
//                 <th className="p-3 border">Active</th>
//                 <th className="p-3 border">Branches</th>
//                 <th className="p-3 border">Services</th>
//                 <th className="p-3 border">Actions</th>
//               </tr>
//             </thead>
//             <tbody>
//               {offers.map((offer) => (
//                 <tr key={offer.id} className="border-t hover:bg-gray-50">
//                   <td className="p-2 border">
//                     {offer.image && (
//                       <Image
//                         src={offer.image}
//                         alt={offer.name}
//                         width={60}
//                         height={60}
//                         className="rounded"
//                       />
//                     )}
//                   </td>
//                   <td className="p-2 border">{offer.name}</td>
//                   <td className="p-2 border">{offer.description}</td>
//                   <td className="p-2 border">{offer.discount}%</td>
//                   <td className="p-2 border">{offer.usageLimit}</td>
//                   <td className="p-2 border">{offer.startDate}</td>
//                   <td className="p-2 border">{offer.endDate}</td>
//                   <td className="p-2 border">{offer.isActive ? 'Yes' : 'No'}</td>
//                   <td className="p-2 border">
//                     {offer.branches && offer.branches.length > 0
//                       ? offer.branches.map((b) => b.name).join(', ')
//                       : '-'}
//                   </td>
//                   <td className="p-2 border">
//                     {offer.services && offer.services.length > 0
//                       ? offer.services.map((s) => s.name).join(', ')
//                       : '-'}
//                   </td>
//                   <td className="p-2 border flex gap-2">
//                     <button
//                       onClick={() => openModal('offer', offer)}
//                       className="p-2 rounded bg-blue-100 hover:bg-blue-200"
//                     >
//                       <Pencil size={16} className="text-blue-600" />
//                     </button>
//                     <button
//                       onClick={() => handleDelete('offer', offer.id!)}
//                       className="p-2 rounded bg-red-100 hover:bg-red-200"
//                     >
//                       <Trash2 size={16} className="text-red-600" />
//                     </button>
//                   </td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </div>
//       </div>

//       {/* Referrals Table */}
//       <div>
//         <h2 className="text-xl font-semibold mb-4">Referrals</h2>
//         <div className="overflow-x-auto rounded-lg shadow">
//           <table className="min-w-full bg-white border">
//             <thead className="bg-gray-100">
//               <tr>
//                 <th className="p-3 border">Title</th>
//                 <th className="p-3 border">Description</th>
//                 <th className="p-3 border">Discount</th>
//                 <th className="p-3 border">Usage Limit</th>
//                 <th className="p-3 border">Start Date</th>
//                 <th className="p-3 border">End Date</th>
//                 <th className="p-3 border">Active</th>
//                 <th className="p-3 border">Services</th>
//                 <th className="p-3 border">Actions</th>
//               </tr>
//             </thead>
//             <tbody>
//               {referrals.map((ref) => (
//                 <tr key={ref.id} className="border-t hover:bg-gray-50">
//                   <td className="p-2 border">{ref.name}</td>
//                   <td className="p-2 border">{ref.description}</td>
//                   <td className="p-2 border">{ref.discount}%</td>
//                   <td className="p-2 border">{ref.usageLimit}</td>
//                   <td className="p-2 border">{ref.startDate}</td>
//                   <td className="p-2 border">{ref.endDate}</td>
//                   <td className="p-2 border">{ref.isActive ? 'Yes' : 'No'}</td>
//                   <td className="p-2 border">
//                     {ref.services && ref.services.length > 0
//                       ? ref.services.map((s) => s.name).join(', ')
//                       : '-'}
//                   </td>
//                   <td className="p-2 border flex gap-2">
//                     <button
//                       onClick={() => openModal('referral', ref)}
//                       className="p-2 rounded bg-blue-100 hover:bg-blue-200"
//                     >
//                       <Pencil size={16} className="text-blue-600" />
//                     </button>
//                     <button
//                       onClick={() => handleDelete('referral', ref.id!)}
//                       className="p-2 rounded bg-red-100 hover:bg-red-200"
//                     >
//                       <Trash2 size={16} className="text-red-600" />
//                     </button>
//                   </td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </div>
//       </div>

//       {/* Modal */}
//       {isOpen && (
//         <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
//           <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl p-6 max-h-[80vh] overflow-y-auto">
//             <h2 className="text-lg font-semibold mb-4">
//               {editingItem ? 'Edit' : 'Create'}{' '}
//               {modalType === 'offer' ? 'Offer' : 'Referral'}
//             </h2>
//             <form onSubmit={handleSubmit} className="space-y-4">
//               {/* Name */}
//               <input
//                 type="text"
//                 placeholder="Title"
//                 value={formData.name || ''}
//                 onChange={(e) =>
//                   setFormData({ ...formData, name: e.target.value })
//                 }
//                 className="w-full border p-2 rounded"
//                 required
//               />
//               {/* Description */}
//               <textarea
//                 placeholder="Description"
//                 value={formData.description || ''}
//                 onChange={(e) =>
//                   setFormData({ ...formData, description: e.target.value })
//                 }
//                 className="w-full border p-2 rounded"
//                 required
//               />
//               {/* Discount */}
//               <input
//                 type="number"
//                 placeholder="Discount %"
//                 value={formData.discount || ''}
//                 onChange={(e) =>
//                   setFormData({ ...formData, discount: Number(e.target.value) })
//                 }
//                 className="w-full border p-2 rounded"
//                 required
//               />
//               {/* Usage Limit */}
//               <input
//                 type="number"
//                 placeholder="Usage Limit"
//                 value={formData.usageLimit || ''}
//                 onChange={(e) =>
//                   setFormData({
//                     ...formData,
//                     usageLimit: Number(e.target.value),
//                   })
//                 }
//                 className="w-full border p-2 rounded"
//                 required
//               />
//               {/* Dates */}
//               <div className="flex gap-4">
//                 <input
//                   type="date"
//                   value={formData.startDate || ''}
//                   onChange={(e) =>
//                     setFormData({ ...formData, startDate: e.target.value })
//                   }
//                   className="w-full border p-2 rounded"
//                   required
//                 />
//                 <input
//                   type="date"
//                   value={formData.endDate || ''}
//                   onChange={(e) =>
//                     setFormData({ ...formData, endDate: e.target.value })
//                   }
//                   className="w-full border p-2 rounded"
//                   required
//                 />
//               </div>
//               {/* Active */}
//               <label className="flex items-center gap-2">
//                 <input
//                   type="checkbox"
//                   checked={formData.isActive || false}
//                   onChange={(e) =>
//                     setFormData({ ...formData, isActive: e.target.checked })
//                   }
//                 />
//                 Active
//               </label>

//               {/* Only for Offers */}
//               {modalType === 'offer' && (
//                 <>
//                   {/* Image */}
//                   <input
//                     type="text"
//                     placeholder="Image URL"
//                     value={formData.image || ''}
//                     onChange={(e) =>
//                       setFormData({ ...formData, image: e.target.value })
//                     }
//                     className="w-full border p-2 rounded"
//                   />
//                   {/* Branches */}
//                   <div>
//                     <label className="block font-medium">Branches</label>
//                     <div className="flex flex-wrap gap-2">
//                       {branches.map((b) => (
//                         <label key={b.id} className="flex items-center gap-1">
//                           <input
//                             type="checkbox"
//                             checked={formData.branches?.includes(b.name)}
//                             onChange={(e) => {
//                               const updated = e.target.checked
//                                 ? [...formData.branches, b.name]
//                                 : formData.branches.filter(
//                                     (br: string) => br !== b.name
//                                   );
//                               setFormData({ ...formData, branches: updated });
//                             }}
//                           />
//                           {b.name}
//                         </label>
//                       ))}
//                     </div>
//                   </div>
//                 </>
//               )}

//               {/* Services */}
//               <div>
//                 <label className="block font-medium">Services</label>
//                 <div className="flex flex-wrap gap-2">
//                   {services.map((s) => (
//                     <label key={s.id} className="flex items-center gap-1">
//                       <input
//                         type="checkbox"
//                         checked={formData.services?.includes(s.name)}
//                         onChange={(e) => {
//                           const updated = e.target.checked
//                             ? [...formData.services, s.name]
//                             : formData.services.filter(
//                                 (sv: string) => sv !== s.name
//                               );
//                           setFormData({ ...formData, services: updated });
//                         }}
//                       />
//                       {s.name}
//                     </label>
//                   ))}
//                 </div>
//               </div>

//               {/* Buttons */}
//               <div className="flex justify-end gap-2 pt-4">
//                 <button
//                   type="button"
//                   onClick={closeModal}
//                   className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300"
//                 >
//                   Cancel
//                 </button>
//                 <button
//                   type="submit"
//                   className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
//                 >
//                   {editingItem ? 'Update' : 'Create'}
//                 </button>
//               </div>
//             </form>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }
'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import {
  addOffer,
  updateOffer,
  deleteOffer,
  subscribeToOffersChanges,
  addReferral,
  updateReferral,
  deleteReferral,
  subscribeToReferralsChanges,
  subscribeToBranchesChanges,
  subscribeToServicesChanges,
} from '@/lib/firebaseServicesNoStorage';
import { Pencil, Trash2 } from 'lucide-react';

// Interfaces
interface Offer {
  id?: string;
  name: string;
  description: string;
  discount: number;
  usageLimit: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  image?: string;
  branches: { id: string; name: string }[];
  services: { id: string; name: string }[];
}

interface Referral {
  id?: string;
  name: string;
  description: string;
  discount: number;
  usageLimit: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  referralCode?: string;
  branches: { id: string; name: string }[];
  services: { id: string; name: string }[];
}

interface Branch {
  id: string;
  name: string;
}

interface Service {
  id: string;
  name: string;
}

export default function Page() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [modalType, setModalType] = useState<'offer' | 'referral'>('offer');
  const [editingItem, setEditingItem] = useState<Offer | Referral | null>(null);
  const [formData, setFormData] = useState<any>({});

  // Fetch realtime data
  useEffect(() => {
    const unsubOffers = subscribeToOffersChanges(setOffers);
    const unsubReferrals = subscribeToReferralsChanges(setReferrals);
    const unsubBranches = subscribeToBranchesChanges(setBranches);
    const unsubServices = subscribeToServicesChanges(setServices);
    return () => {
      unsubOffers();
      unsubReferrals();
      unsubBranches();
      unsubServices();
    };
  }, []);

  // Open popup
  const openModal = (type: 'offer' | 'referral', item: any = null) => {
    setModalType(type);
    setEditingItem(item);
    setFormData(
      item || {
        name: '',
        description: '',
        discount: 0,
        usageLimit: 0,
        startDate: '',
        endDate: '',
        isActive: true,
        image: '',
        referralCode: '',
        branches: [],
        services: [],
      }
    );
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
    setEditingItem(null);
    setFormData({});
  };

  // Submit form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // format branches and services (id + name only)
    const formattedData = {
      ...formData,
      branches: formData.branches?.map((b: any) => ({
        id: b.id,
        name: b.name,
      })) || [],
      services: formData.services?.map((s: any) => ({
        id: s.id,
        name: s.name,
      })) || [],
    };

    if (modalType === 'offer') {
      if (editingItem?.id) {
        await updateOffer(editingItem.id, formattedData);
      } else {
        await addOffer(formattedData);
      }
    } else {
      if (editingItem?.id) {
        await updateReferral(editingItem.id, formattedData);
      } else {
        await addReferral(formattedData);
      }
    }
    closeModal();
  };

  // Delete
  const handleDelete = async (type: 'offer' | 'referral', id: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;
    if (type === 'offer') {
      await deleteOffer(id);
    } else {
      await deleteReferral(id);
    }
  };

  return (
    <div className="p-6 space-y-10">
      {/* Action buttons */}
      <div className="flex gap-4">
        <button
          onClick={() => openModal('offer')}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700"
        >
          + Create Offer
        </button>
        <button
          onClick={() => openModal('referral')}
          className="px-4 py-2 bg-green-600 text-white rounded-lg shadow hover:bg-green-700"
        >
          + Create Referral
        </button>
      </div>

      {/* Offers Table */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Offers</h2>
        <div className="overflow-x-auto rounded-lg shadow">
          <table className="min-w-full bg-white border">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-3 border">Image</th>
                <th className="p-3 border">Title</th>
                <th className="p-3 border">Description</th>
                <th className="p-3 border">Discount</th>
                <th className="p-3 border">Usage Limit</th>
                <th className="p-3 border">Start Date</th>
                <th className="p-3 border">End Date</th>
                <th className="p-3 border">Active</th>
                <th className="p-3 border">Branches</th>
                <th className="p-3 border">Services</th>
                <th className="p-3 border">Actions</th>
              </tr>
            </thead>
            <tbody>
              {offers.map((offer) => (
                <tr key={offer.id} className="border-t hover:bg-gray-50">
                  <td className="p-2 border">
                    {offer.image && (
                      <Image
                        src={offer.image}
                        alt={offer.name}
                        width={60}
                        height={60}
                        className="rounded"
                      />
                    )}
                  </td>
                  <td className="p-2 border">{offer.name}</td>
                  <td className="p-2 border">{offer.description}</td>
                  <td className="p-2 border">{offer.discount}%</td>
                  <td className="p-2 border">{offer.usageLimit}</td>
                  <td className="p-2 border">{offer.startDate}</td>
                  <td className="p-2 border">{offer.endDate}</td>
                  <td className="p-2 border">{offer.isActive ? 'Yes' : 'No'}</td>
                  <td className="p-2 border">
                    {offer.branches.map((b) => b.name).join(', ')}
                  </td>
                  <td className="p-2 border">
                    {offer.services.map((s) => s.name).join(', ')}
                  </td>
                  <td className="p-2 border flex gap-2">
                    <button
                      onClick={() => openModal('offer', offer)}
                      className="p-2 rounded bg-blue-100 hover:bg-blue-200"
                    >
                      <Pencil size={16} className="text-blue-600" />
                    </button>
                    <button
                      onClick={() => handleDelete('offer', offer.id!)}
                      className="p-2 rounded bg-red-100 hover:bg-red-200"
                    >
                      <Trash2 size={16} className="text-red-600" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Referrals Table */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Referrals</h2>
        <div className="overflow-x-auto rounded-lg shadow">
          <table className="min-w-full bg-white border">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-3 border">Title</th>
                <th className="p-3 border">Description</th>
                <th className="p-3 border">Discount</th>
                <th className="p-3 border">Usage Limit</th>
                <th className="p-3 border">Start Date</th>
                <th className="p-3 border">End Date</th>
                <th className="p-3 border">Active</th>
                <th className="p-3 border">Referral Code</th>
                <th className="p-3 border">Branches</th>
                <th className="p-3 border">Services</th>
                <th className="p-3 border">Actions</th>
              </tr>
            </thead>
            <tbody>
              {referrals.map((ref) => (
                <tr key={ref.id} className="border-t hover:bg-gray-50">
                  <td className="p-2 border">{ref.name}</td>
                  <td className="p-2 border">{ref.description}</td>
                  <td className="p-2 border">{ref.discount}%</td>
                  <td className="p-2 border">{ref.usageLimit}</td>
                  <td className="p-2 border">{ref.startDate}</td>
                  <td className="p-2 border">{ref.endDate}</td>
                  <td className="p-2 border">{ref.isActive ? 'Yes' : 'No'}</td>
                  <td className="p-2 border">{ref.referralCode}</td>
                  <td className="p-2 border">
                    {ref.branches?.map((b) => b.name).join(', ')}
                  </td>
                  <td className="p-2 border">
                    {ref.services.map((s) => s.name).join(', ')}
                  </td>
                  <td className="p-2 border flex gap-2">
                    <button
                      onClick={() => openModal('referral', ref)}
                      className="p-2 rounded bg-blue-100 hover:bg-blue-200"
                    >
                      <Pencil size={16} className="text-blue-600" />
                    </button>
                    <button
                      onClick={() => handleDelete('referral', ref.id!)}
                      className="p-2 rounded bg-red-100 hover:bg-red-200"
                    >
                      <Trash2 size={16} className="text-red-600" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl p-6 max-h-[80vh] overflow-y-auto">
            <h2 className="text-lg font-semibold mb-4">
              {editingItem ? 'Edit' : 'Create'}{' '}
              {modalType === 'offer' ? 'Offer' : 'Referral'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name */}
              <input
                type="text"
                placeholder="Title"
                value={formData.name || ''}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full border p-2 rounded"
                required
              />
              {/* Description */}
              <textarea
                placeholder="Description"
                value={formData.description || ''}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="w-full border p-2 rounded"
                required
              />
              {/* Discount */}
              <input
                type="number"
                placeholder="Discount %"
                value={formData.discount || ''}
                onChange={(e) =>
                  setFormData({ ...formData, discount: Number(e.target.value) })
                }
                className="w-full border p-2 rounded"
                required
              />
              {/* Usage Limit */}
              <input
                type="number"
                placeholder="Usage Limit"
                value={formData.usageLimit || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    usageLimit: Number(e.target.value),
                  })
                }
                className="w-full border p-2 rounded"
                required
              />
              {/* Dates */}
              <div className="flex gap-4">
                <input
                  type="date"
                  value={formData.startDate || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, startDate: e.target.value })
                  }
                  className="w-full border p-2 rounded"
                  required
                />
                <input
                  type="date"
                  value={formData.endDate || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, endDate: e.target.value })
                  }
                  className="w-full border p-2 rounded"
                  required
                />
              </div>
              {/* Active */}
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.isActive || false}
                  onChange={(e) =>
                    setFormData({ ...formData, isActive: e.target.checked })
                  }
                />
                Active
              </label>

              {/* Referral Code (only for Referral) */}
              {modalType === 'referral' && (
                <input
                  type="text"
                  placeholder="Referral Code"
                  value={formData.referralCode || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, referralCode: e.target.value })
                  }
                  className="w-full border p-2 rounded"
                />
              )}

              {/* Only for Offers */}
              {modalType === 'offer' && (
                <>
                  {/* Image */}
                  <input
                    type="text"
                    placeholder="Image URL"
                    value={formData.image || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, image: e.target.value })
                    }
                    className="w-full border p-2 rounded"
                  />
                  {/* Branches */}
                  <div>
                    <label className="block font-medium">Branches</label>
                    <div className="flex flex-wrap gap-2">
                      {branches.map((b) => (
                        <label key={b.id} className="flex items-center gap-1">
                          <input
                            type="checkbox"
                            checked={formData.branches?.some(
                              (br: any) => br.id === b.id
                            )}
                            onChange={(e) => {
                              const updated = e.target.checked
                                ? [...formData.branches, b]
                                : formData.branches.filter(
                                    (br: any) => br.id !== b.id
                                  );
                              setFormData({ ...formData, branches: updated });
                            }}
                          />
                          {b.name}
                        </label>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* Services */}
              <div>
                <label className="block font-medium">Services</label>
                <div className="flex flex-wrap gap-2">
                  {services.map((s) => (
                    <label key={s.id} className="flex items-center gap-1">
                      <input
                        type="checkbox"
                        checked={formData.services?.some(
                          (sv: any) => sv.id === s.id
                        )}
                        onChange={(e) => {
                          const updated = e.target.checked
                            ? [...formData.services, s]
                            : formData.services.filter(
                                (sv: any) => sv.id !== s.id
                              );
                          setFormData({ ...formData, services: updated });
                        }}
                      />
                      {s.name}
                    </label>
                  ))}
                </div>
              </div>

              {/* Buttons */}
              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
                >
                  {editingItem ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
