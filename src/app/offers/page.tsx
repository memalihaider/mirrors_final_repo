
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
// import AccessWrapper from '@/components/AccessWrapper';
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
//   referralCode?: string;
//   branches: { id: string; name: string }[];
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
//   const [activeTab, setActiveTab] = useState<'offers' | 'referrals'>('offers');

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
//         referralCode: '',
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

//   // Helpers for multi-select (real-time dropdowns)
//   const handleBranchesChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
//     const selectedIds = Array.from(e.target.selectedOptions).map((o) => o.value);
//     const selected = branches.filter((b) => selectedIds.includes(b.id));
//     setFormData({ ...formData, branches: selected });
//   };

//   const handleServicesChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
//     const selectedIds = Array.from(e.target.selectedOptions).map((o) => o.value);
//     const selected = services.filter((s) => selectedIds.includes(s.id));
//     setFormData({ ...formData, services: selected });
//   };

//   // Submit form (original logic unchanged)
//   // const handleSubmit = async (e: React.FormEvent) => {
//   //   e.preventDefault();

//   //   // format branches and services (id + name only)
//   //   const formattedData = {
//   //     ...formData,
//   //     branches:
//   //       formData.branches?.map((b: any) => ({
//   //         id: b.id,
//   //         name: b.name,
//   //       })) || [],
//   //     services:
//   //       formData.services?.map((s: any) => ({
//   //         id: s.id,
//   //         name: s.name,
//   //       })) || [],
//   //   };

//   //   if (modalType === 'offer') {
//   //     if (editingItem?.id) {
//   //       await updateOffer(editingItem.id, formattedData);
//   //     } else {
//   //       await addOffer(formattedData);
//   //     }
//   //   } else {
//   //     if (editingItem?.id) {
//   //       await updateReferral(editingItem.id, formattedData);
//   //     } else {
//   //       await addReferral(formattedData);
//   //     }
//   //   }
//   //   closeModal();
//   // };
  
    
// const handleSubmit = async (e: React.FormEvent) => {
//   e.preventDefault();

//   try {
//     // Ensure numeric fields are numbers
//     const discount = Number(formData.discount) || 0;
//     const usageLimit = Number(formData.usageLimit) || 0;

//     // Ensure arrays are valid
//     const branchesArray = Array.isArray(formData.branches)
//       ? formData.branches.map((b: any) => ({ id: b.id, name: b.name }))
//       : [];
//     const servicesArray = Array.isArray(formData.services)
//       ? formData.services.map((s: any) => ({ id: s.id, name: s.name }))
//       : [];

//     // Build payload
//     const payload = {
//       name: formData.name || '',
//       description: formData.description || '',
//       discount,
//       usageLimit,
//       startDate: formData.startDate || '',
//       endDate: formData.endDate || '',
//       isActive: !!formData.isActive,
//       image: formData.image || '',
//       branches: branchesArray,
//       services: servicesArray,
//     };

//     if (modalType === 'offer') {
//       if (editingItem?.id) {
//         await updateOffer(editingItem.id, payload);
//       } else {
//         await addOffer(payload);
//       }
//     } else {
//       // referral logic stays the same
//       const referralPayload = {
//         ...payload,
//         referralCode: formData.referralCode || '',
//       };
//       if (editingItem?.id) {
//         await updateReferral(editingItem.id, referralPayload);
//       } else {
//         await addReferral(referralPayload);
//       }
//     }

//     closeModal();
//   } catch (err) {
//     console.error('Error saving offer/referral:', err);
//     alert('Failed to save offer/referral. Check console for details.');
//   }
// };


//   // Delete (original logic unchanged)
//   const handleDelete = async (type: 'offer' | 'referral', id: string) => {
//     if (!confirm('Are you sure you want to delete this item?')) return;
//     if (type === 'offer') {
//       await deleteOffer(id);
//     } else {
//       await deleteReferral(id);
//     }
//   };

//   return (
//     <AccessWrapper>
//     <div className="p-6 space-y-6">
//       {/* Header actions */}
//       <div className="flex flex-wrap items-center justify-between gap-3">
//         <div className="text-2xl font-semibold text-pink-700">Offers & Referrals</div>
//         <div className="flex gap-3">
//           <button
//             onClick={() => openModal('offer')}
//             className="px-4 py-2 rounded-2xl bg-pink-500 text-white shadow-md hover:bg-pink-600 active:scale-95 transition"
//           >
//             + Add Offer
//           </button>
//           <button
//             onClick={() => openModal('referral')}
//             className="px-4 py-2 rounded-2xl bg-pink-400 text-white shadow-md hover:bg-pink-500 active:scale-95 transition"
//           >
//             + Add Referral
//           </button>
//         </div>
//       </div>

//       {/* Tabs */}
//       <div className="flex gap-2 bg-pink-50 p-1 rounded-2xl border border-pink-100 w-fit">
//         <button
//           className={`px-4 py-2 rounded-2xl text-sm font-medium transition ${
//             activeTab === 'offers'
//               ? 'bg-white shadow text-pink-700'
//               : 'text-pink-600 hover:bg-pink-100'
//           }`}
//           onClick={() => setActiveTab('offers')}
//         >
//           Offers
//         </button>
//         <button
//           className={`px-4 py-2 rounded-2xl text-sm font-medium transition ${
//             activeTab === 'referrals'
//               ? 'bg-white shadow text-pink-700'
//               : 'text-pink-600 hover:bg-pink-100'
//           }`}
//           onClick={() => setActiveTab('referrals')}
//         >
//           Referrals
//         </button>
//       </div>

//       {/* Grid of Cards */}
//       {activeTab === 'offers' ? (
//         <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
//           {offers.map((offer) => (
//             <div
//               key={offer.id}
//               className="rounded-2xl border border-pink-100 bg-white shadow-sm hover:shadow-md transition overflow-hidden"
//             >
//               <div className="relative h-40 w-full bg-pink-100">
//                 {offer.image ? (
//                   <Image
//                     src={offer.image}
//                     alt={offer.name}
//                     fill
//                     className="object-cover"
//                   />
//                 ) : (
//                   <div className="h-full w-full flex items-center justify-center text-pink-600">
//                     No Image
//                   </div>
//                 )}
//               </div>

//               <div className="p-4 space-y-2">
//                 <div className="flex items-start justify-between gap-3">
//                   <h3 className="font-semibold text-pink-700 line-clamp-2">{offer.name}</h3>
//                   <span
//                     className={`text-xs px-2 py-1 rounded-full ${
//                       offer.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
//                     }`}
//                   >
//                     {offer.isActive ? 'Active' : 'Inactive'}
//                   </span>
//                 </div>

//                 <p className="text-sm text-gray-600 line-clamp-3">{offer.description}</p>

//                 <div className="text-sm">
//                   <div className="flex items-center justify-between">
//                     <span className="text-gray-500">Discount</span>
//                     <span className="font-medium text-pink-700">{offer.discount}%</span>
//                   </div>
//                   <div className="flex items-center justify-between">
//                     <span className="text-gray-500">Usage Limit</span>
//                     <span className="font-medium">{offer.usageLimit}</span>
//                   </div>
//                 </div>

//                 <div className="text-xs text-gray-600 space-y-1">
//                   <div>
//                     <span className="text-gray-500">Start:</span> {offer.startDate}
//                   </div>
//                   <div>
//                     <span className="text-gray-500">End:</span> {offer.endDate}
//                   </div>
//                 </div>

//                 {offer.branches?.length > 0 && (
//                   <div className="text-xs">
//                     <div className="text-gray-500 mb-1">Branches</div>
//                     <div className="flex flex-wrap gap-1">
//                       {offer.branches.map((b) => (
//                         <span
//                           key={b.id}
//                           className="px-2 py-0.5 rounded-full bg-pink-50 text-pink-700 border border-pink-100"
//                         >
//                           {b.name}
//                         </span>
//                       ))}
//                     </div>
//                   </div>
//                 )}

//                 {offer.services?.length > 0 && (
//                   <div className="text-xs">
//                     <div className="text-gray-500 mb-1">Services</div>
//                     <div className="flex flex-wrap gap-1">
//                       {offer.services.map((s) => (
//                         <span
//                           key={s.id}
//                           className="px-2 py-0.5 rounded-full bg-pink-50 text-pink-700 border border-pink-100"
//                         >
//                           {s.name}
//                         </span>
//                       ))}
//                     </div>
//                   </div>
//                 )}

//                 <div className="pt-2 flex justify-end gap-2">
//                   <button
//                     onClick={() => openModal('offer', offer)}
//                     className="p-2 rounded-xl bg-pink-100 hover:bg-pink-200 transition"
//                     title="Edit"
//                   >
//                     <Pencil size={16} className="text-pink-700" />
//                   </button>
//                   <button
//                     onClick={() => handleDelete('offer', offer.id!)}
//                     className="p-2 rounded-xl bg-red-100 hover:bg-red-200 transition"
//                     title="Delete"
//                   >
//                     <Trash2 size={16} className="text-red-600" />
//                   </button>
//                 </div>
//               </div>
//             </div>
//           ))}
//           {offers.length === 0 && (
//             <div className="text-gray-500">No offers found.</div>
//           )}
//         </div>
//       ) : (
//         <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
//           {referrals.map((ref) => (
//             <div
//               key={ref.id}
//               className="rounded-2xl border border-pink-100 bg-white shadow-sm hover:shadow-md transition overflow-hidden"
//             >
//               <div className="p-4 space-y-2">
//                 <div className="flex items-start justify-between gap-3">
//                   <h3 className="font-semibold text-pink-700 line-clamp-2">{ref.name}</h3>
//                   <span
//                     className={`text-xs px-2 py-1 rounded-full ${
//                       ref.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
//                     }`}
//                   >
//                     {ref.isActive ? 'Active' : 'Inactive'}
//                   </span>
//                 </div>

//                 <p className="text-sm text-gray-600 line-clamp-3">{ref.description}</p>

//                 <div className="text-sm">
//                   <div className="flex items-center justify-between">
//                     <span className="text-gray-500">Discount</span>
//                     <span className="font-medium text-pink-700">{ref.discount}%</span>
//                   </div>
//                   <div className="flex items-center justify-between">
//                     <span className="text-gray-500">Usage Limit</span>
//                     <span className="font-medium">{ref.usageLimit}</span>
//                   </div>
//                 </div>

//                 <div className="text-xs text-gray-600 space-y-1">
//                   <div>
//                     <span className="text-gray-500">Start:</span> {ref.startDate}
//                   </div>
//                   <div>
//                     <span className="text-gray-500">End:</span> {ref.endDate}
//                   </div>
//                   {ref.referralCode && (
//                     <div>
//                       <span className="text-gray-500">Code:</span> {ref.referralCode}
//                     </div>
//                   )}
//                 </div>

//                 {ref.branches?.length > 0 && (
//                   <div className="text-xs">
//                     <div className="text-gray-500 mb-1">Branches</div>
//                     <div className="flex flex-wrap gap-1">
//                       {ref.branches.map((b) => (
//                         <span
//                           key={b.id}
//                           className="px-2 py-0.5 rounded-full bg-pink-50 text-pink-700 border border-pink-100"
//                         >
//                           {b.name}
//                         </span>
//                       ))}
//                     </div>
//                   </div>
//                 )}

//                 {ref.services?.length > 0 && (
//                   <div className="text-xs">
//                     <div className="text-gray-500 mb-1">Services</div>
//                     <div className="flex flex-wrap gap-1">
//                       {ref.services.map((s) => (
//                         <span
//                           key={s.id}
//                           className="px-2 py-0.5 rounded-full bg-pink-50 text-pink-700 border border-pink-100"
//                         >
//                           {s.name}
//                         </span>
//                       ))}
//                     </div>
//                   </div>
//                 )}

//                 <div className="pt-2 flex justify-end gap-2">
//                   <button
//                     onClick={() => openModal('referral', ref)}
//                     className="p-2 rounded-xl bg-pink-100 hover:bg-pink-200 transition"
//                     title="Edit"
//                   >
//                     <Pencil size={16} className="text-pink-700" />
//                   </button>
//                   <button
//                     onClick={() => handleDelete('referral', ref.id!)}
//                     className="p-2 rounded-xl bg-red-100 hover:bg-red-200 transition"
//                     title="Delete"
//                   >
//                     <Trash2 size={16} className="text-red-600" />
//                   </button>
//                 </div>
//               </div>
//             </div>
//           ))}
//           {referrals.length === 0 && (
//             <div className="text-gray-500">No referrals found.</div>
//           )}
//         </div>
//       )}

//       {/* Modal */}
//       {isOpen && (
//         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-3">
//           <div className="w-full max-w-2xl rounded-2xl bg-white shadow-xl">
//             {/* Modal Header */}
//             <div className="flex items-center justify-between border-b p-4">
//               <h2 className="text-lg font-semibold text-pink-700">
//                 {editingItem ? 'Edit' : 'Create'} {modalType === 'offer' ? 'Offer' : 'Referral'}
//               </h2>
//               <button
//                 onClick={closeModal}
//                 className="px-3 py-1 rounded-xl bg-gray-100 hover:bg-gray-200"
//               >
//                 Close
//               </button>
//             </div>

//             {/* Modal Body (Scrollable) */}
//             <div className="max-h-[70vh] overflow-y-auto p-4">
//               <form onSubmit={handleSubmit} className="space-y-4">
//                 {/* Name */}
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
//                   <input
//                     type="text"
//                     placeholder="Title"
//                     value={formData.name || ''}
//                     onChange={(e) => setFormData({ ...formData, name: e.target.value })}
//                     className="w-full border rounded-xl p-2 focus:outline-none focus:ring-2 focus:ring-pink-300"
//                     required
//                   />
//                 </div>

//                 {/* Description */}
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-1">
//                     Description
//                   </label>
//                   <textarea
//                     placeholder="Description"
//                     value={formData.description || ''}
//                     onChange={(e) => setFormData({ ...formData, description: e.target.value })}
//                     className="w-full border rounded-xl p-2 focus:outline-none focus:ring-2 focus:ring-pink-300"
//                     required
//                   />
//                 </div>

//                 {/* Discount + Usage Limit */}
//                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
//                   <div>
//                     <label className="block text-sm font-medium text-gray-700 mb-1">
//                       Discount %
//                     </label>
//                     <input
//                       type="number"
//                       placeholder="Discount %"
//                       value={formData.discount ?? ''}
//                       onChange={(e) =>
//                         setFormData({ ...formData, discount: Number(e.target.value) })
//                       }
//                       className="w-full border rounded-xl p-2 focus:outline-none focus:ring-2 focus:ring-pink-300"
//                       required
//                     />
//                   </div>
//                   <div>
//                     <label className="block text-sm font-medium text-gray-700 mb-1">
//                       Usage Limit
//                     </label>
//                     <input
//                       type="number"
//                       placeholder="Usage Limit"
//                       value={formData.usageLimit ?? ''}
//                       onChange={(e) =>
//                         setFormData({ ...formData, usageLimit: Number(e.target.value) })
//                       }
//                       className="w-full border rounded-xl p-2 focus:outline-none focus:ring-2 focus:ring-pink-300"
//                       required
//                     />
//                   </div>
//                 </div>

//                 {/* Dates */}
//                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
//                   <div>
//                     <label className="block text-sm font-medium text-gray-700 mb-1">
//                       Start Date
//                     </label>
//                     <input
//                       type="date"
//                       value={formData.startDate || ''}
//                       onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
//                       className="w-full border rounded-xl p-2 focus:outline-none focus:ring-2 focus:ring-pink-300"
//                       required
//                     />
//                   </div>
//                   <div>
//                     <label className="block text-sm font-medium text-gray-700 mb-1">
//                       End Date
//                     </label>
//                     <input
//                       type="date"
//                       value={formData.endDate || ''}
//                       onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
//                       className="w-full border rounded-xl p-2 focus:outline-none focus:ring-2 focus:ring-pink-300"
//                       required
//                     />
//                   </div>
//                 </div>

//                 {/* Image Input + NEW: Gallery Option */}
//                 {modalType === 'offer' && (
//                   <div>
//                     <label className="block text-sm font-medium text-gray-700 mb-1">Image</label>
//                     <div className="flex items-center gap-3">
//                       <input
//                         type="text"
//                         placeholder="Image URL"
//                         value={formData.image || ''}
//                         onChange={(e) => setFormData({ ...formData, image: e.target.value })}
//                         className="flex-1 border rounded-xl p-2 focus:outline-none focus:ring-2 focus:ring-pink-300"
//                       />
//                       {/* NEW: File Picker */}
//                       <input
//                         type="file"
//                         accept="image/*"
//                         onChange={(e) => {
//                           const file = e.target.files?.[0];
//                           if (file) {
//                             const reader = new FileReader();
//                             reader.onloadend = () => {
//                               setFormData({ ...formData, image: reader.result as string });
//                             };
//                             reader.readAsDataURL(file);
//                           }
//                         }}
//                         className="text-sm"
//                       />
//                     </div>
//                   </div>
//                 )}

//                 {/* Referral Code (referral only) */}
//                 {modalType === 'referral' && (
//                   <div>
//                     <label className="block text-sm font-medium text-gray-700 mb-1">
//                       Referral Code
//                     </label>
//                     <input
//                       type="text"
//                       placeholder="Referral Code"
//                       value={formData.referralCode || ''}
//                       onChange={(e) =>
//                         setFormData({ ...formData, referralCode: e.target.value })
//                       }
//                       className="w-full border rounded-xl p-2 focus:outline-none focus:ring-2 focus:ring-pink-300"
//                     />
//                   </div>
//                 )}

//                 {/* Branches */}
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-1">Branches</label>
//                   <select
//                     multiple
//                     value={formData.branches?.map((b: any) => b.id) || []}
//                     onChange={handleBranchesChange}
//                     className="w-full border rounded-xl p-2 focus:outline-none focus:ring-2 focus:ring-pink-300"
//                   >
//                     {branches.map((b) => (
//                       <option key={b.id} value={b.id}>
//                         {b.name}
//                       </option>
//                     ))}
//                   </select>
//                 </div>

//                 {/* Services */}
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-1">Services</label>
//                   <select
//                     multiple
//                     value={formData.services?.map((s: any) => s.id) || []}
//                     onChange={handleServicesChange}
//                     className="w-full border rounded-xl p-2 focus:outline-none focus:ring-2 focus:ring-pink-300"
//                   >
//                     {services.map((s) => (
//                       <option key={s.id} value={s.id}>
//                         {s.name}
//                       </option>
//                     ))}
//                   </select>
//                 </div>

//                 {/* Active Toggle */}
//                 <div className="flex items-center gap-2">
//                   <input
//                     type="checkbox"
//                     checked={formData.isActive || false}
//                     onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
//                   />
//                   <span className="text-sm text-gray-700">Active</span>
//                 </div>

//                 {/* Submit */}
//                 <div className="flex justify-end pt-2">
//                   <button
//                     type="submit"
//                     className="px-5 py-2 rounded-2xl bg-pink-500 text-white shadow-md hover:bg-pink-600 active:scale-95 transition"
//                   >
//                     {editingItem ? 'Update' : 'Create'}
//                   </button>
//                 </div>
//               </form>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//     </AccessWrapper>
//   );
// }

//wrap
// 'use client';

// import { useState, useEffect } from 'react';
// import Image from 'next/image';
// import AccessWrapper from '@/components/AccessWrapper';
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
//   referralCode?: string;
//   branches: { id: string; name: string }[];
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
//   const [activeTab, setActiveTab] = useState<'offers' | 'referrals'>('offers');

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
//         referralCode: '',
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

//   // Helpers for multi-select (real-time dropdowns)
//   const handleBranchesChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
//     const selectedIds = Array.from(e.target.selectedOptions).map((o) => o.value);
//     const selected = branches.filter((b) => selectedIds.includes(b.id));
//     setFormData({ ...formData, branches: selected });
//   };

//   const handleServicesChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
//     const selectedIds = Array.from(e.target.selectedOptions).map((o) => o.value);
//     const selected = services.filter((s) => selectedIds.includes(s.id));
//     setFormData({ ...formData, services: selected });
//   };

//   // Submit form
//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();

//     // format branches and services
//     const formattedData = {
//       ...formData,
//       branches:
//         formData.branches?.map((b: any) => ({ id: b.id, name: b.name })) || [],
//       services:
//         formData.services?.map((s: any) => ({ id: s.id, name: s.name })) || [],
//     };

//     if (modalType === 'offer') {
//       if (editingItem?.id) await updateOffer(editingItem.id, formattedData);
//       else await addOffer(formattedData);
//     } else {
//       if (editingItem?.id) await updateReferral(editingItem.id, formattedData);
//       else await addReferral(formattedData);
//     }
//     closeModal();
//   };

//   // Delete
//   const handleDelete = async (type: 'offer' | 'referral', id: string) => {
//     if (!confirm('Are you sure you want to delete this item?')) return;
//     if (type === 'offer') await deleteOffer(id);
//     else await deleteReferral(id);
//   };

//   return (
//     <AccessWrapper>
//       <div className="p-6 space-y-6">
//         {/* Header actions */}
//         <div className="flex flex-wrap items-center justify-between gap-3">
//           <div className="text-2xl font-semibold text-pink-700">Offers & Referrals</div>
//           <div className="flex gap-3">
//             <button
//               onClick={() => openModal('offer')}
//               className="px-4 py-2 rounded-2xl bg-pink-500 text-white shadow-md hover:bg-pink-600 active:scale-95 transition"
//             >
//               + Add Offer
//             </button>
//             <button
//               onClick={() => openModal('referral')}
//               className="px-4 py-2 rounded-2xl bg-pink-400 text-white shadow-md hover:bg-pink-500 active:scale-95 transition"
//             >
//               + Add Referral
//             </button>
//           </div>
//         </div>

//         {/* Tabs */}
//         <div className="flex gap-2 bg-pink-50 p-1 rounded-2xl border border-pink-100 w-fit">
//           <button
//             className={`px-4 py-2 rounded-2xl text-sm font-medium transition ${
//               activeTab === 'offers'
//                 ? 'bg-white shadow text-pink-700'
//                 : 'text-pink-600 hover:bg-pink-100'
//             }`}
//             onClick={() => setActiveTab('offers')}
//           >
//             Offers
//           </button>
//           <button
//             className={`px-4 py-2 rounded-2xl text-sm font-medium transition ${
//               activeTab === 'referrals'
//                 ? 'bg-white shadow text-pink-700'
//                 : 'text-pink-600 hover:bg-pink-100'
//             }`}
//             onClick={() => setActiveTab('referrals')}
//           >
//             Referrals
//           </button>
//         </div>
//         {/* Grid of Cards */}
//         {activeTab === 'offers' ? (
//           <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
//             {offers.map((offer) => (
//               <div
//                 key={offer.id}
//                 className="rounded-2xl border border-pink-100 bg-white shadow-sm hover:shadow-md transition overflow-hidden"
//               >
//                 <div className="relative h-40 w-full bg-pink-100">
//                   {offer.image ? (
//                     <Image
//                       src={offer.image}
//                       alt={offer.name}
//                       fill
//                       className="object-cover"
//                     />
//                   ) : (
//                     <div className="h-full w-full flex items-center justify-center text-pink-600">
//                       No Image
//                     </div>
//                   )}
//                 </div>

//                 <div className="p-4 space-y-2">
//                   <div className="flex items-start justify-between gap-3">
//                     <h3 className="font-semibold text-pink-700 line-clamp-2">{offer.name}</h3>
//                     <span
//                       className={`text-xs px-2 py-1 rounded-full ${
//                         offer.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
//                       }`}
//                     >
//                       {offer.isActive ? 'Active' : 'Inactive'}
//                     </span>
//                   </div>

//                   <p className="text-sm text-gray-600 line-clamp-3">{offer.description}</p>

//                   <div className="text-sm">
//                     <div className="flex items-center justify-between">
//                       <span className="text-gray-500">Discount</span>
//                       <span className="font-medium text-pink-700">{offer.discount}%</span>
//                     </div>
//                     <div className="flex items-center justify-between">
//                       <span className="text-gray-500">Usage Limit</span>
//                       <span className="font-medium">{offer.usageLimit}</span>
//                     </div>
//                   </div>

//                   <div className="text-xs text-gray-600 space-y-1">
//                     <div>
//                       <span className="text-gray-500">Start:</span> {offer.startDate}
//                     </div>
//                     <div>
//                       <span className="text-gray-500">End:</span> {offer.endDate}
//                     </div>
//                   </div>

//                   {offer.branches?.length > 0 && (
//                     <div className="text-xs">
//                       <div className="text-gray-500 mb-1">Branches</div>
//                       <div className="flex flex-wrap gap-1">
//                         {offer.branches.map((b) => (
//                           <span
//                             key={b.id}
//                             className="px-2 py-0.5 rounded-full bg-pink-50 text-pink-700 border border-pink-100"
//                           >
//                             {b.name}
//                           </span>
//                         ))}
//                       </div>
//                     </div>
//                   )}

//                   {offer.services?.length > 0 && (
//                     <div className="text-xs">
//                       <div className="text-gray-500 mb-1">Services</div>
//                       <div className="flex flex-wrap gap-1">
//                         {offer.services.map((s) => (
//                           <span
//                             key={s.id}
//                             className="px-2 py-0.5 rounded-full bg-pink-50 text-pink-700 border border-pink-100"
//                           >
//                             {s.name}
//                           </span>
//                         ))}
//                       </div>
//                     </div>
//                   )}

//                   <div className="pt-2 flex justify-end gap-2">
//                     <button
//                       onClick={() => openModal('offer', offer)}
//                       className="p-2 rounded-xl bg-pink-100 hover:bg-pink-200 transition"
//                       title="Edit"
//                     >
//                       <Pencil size={16} className="text-pink-700" />
//                     </button>
//                     <button
//                       onClick={() => handleDelete('offer', offer.id!)}
//                       className="p-2 rounded-xl bg-red-100 hover:bg-red-200 transition"
//                       title="Delete"
//                     >
//                       <Trash2 size={16} className="text-red-600" />
//                     </button>
//                   </div>
//                 </div>
//               </div>
//             ))}
//             {offers.length === 0 && <div className="text-gray-500">No offers found.</div>}
//           </div>
//         ) : (
//           <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
//             {referrals.map((ref) => (
//               <div
//                 key={ref.id}
//                 className="rounded-2xl border border-pink-100 bg-white shadow-sm hover:shadow-md transition overflow-hidden"
//               >
//                 <div className="p-4 space-y-2">
//                   <div className="flex items-start justify-between gap-3">
//                     <h3 className="font-semibold text-pink-700 line-clamp-2">{ref.name}</h3>
//                     <span
//                       className={`text-xs px-2 py-1 rounded-full ${
//                         ref.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
//                       }`}
//                     >
//                       {ref.isActive ? 'Active' : 'Inactive'}
//                     </span>
//                   </div>

//                   <p className="text-sm text-gray-600 line-clamp-3">{ref.description}</p>

//                   <div className="text-sm">
//                     <div className="flex items-center justify-between">
//                       <span className="text-gray-500">Discount</span>
//                       <span className="font-medium text-pink-700">{ref.discount}%</span>
//                     </div>
//                     <div className="flex items-center justify-between">
//                       <span className="text-gray-500">Usage Limit</span>
//                       <span className="font-medium">{ref.usageLimit}</span>
//                     </div>
//                   </div>

//                   <div className="text-xs text-gray-600 space-y-1">
//                     <div>
//                       <span className="text-gray-500">Start:</span> {ref.startDate}
//                     </div>
//                     <div>
//                       <span className="text-gray-500">End:</span> {ref.endDate}
//                     </div>
//                     {ref.referralCode && (
//                       <div>
//                         <span className="text-gray-500">Code:</span> {ref.referralCode}
//                       </div>
//                     )}
//                   </div>

//                   {ref.branches?.length > 0 && (
//                     <div className="text-xs">
//                       <div className="text-gray-500 mb-1">Branches</div>
//                       <div className="flex flex-wrap gap-1">
//                         {ref.branches.map((b) => (
//                           <span
//                             key={b.id}
//                             className="px-2 py-0.5 rounded-full bg-pink-50 text-pink-700 border border-pink-100"
//                           >
//                             {b.name}
//                           </span>
//                         ))}
//                       </div>
//                     </div>
//                   )}

//                   {ref.services?.length > 0 && (
//                     <div className="text-xs">
//                       <div className="text-gray-500 mb-1">Services</div>
//                       <div className="flex flex-wrap gap-1">
//                         {ref.services.map((s) => (
//                           <span
//                             key={s.id}
//                             className="px-2 py-0.5 rounded-full bg-pink-50 text-pink-700 border border-pink-100"
//                           >
//                             {s.name}
//                           </span>
//                         ))}
//                       </div>
//                     </div>
//                   )}

//                   <div className="pt-2 flex justify-end gap-2">
//                     <button
//                       onClick={() => openModal('referral', ref)}
//                       className="p-2 rounded-xl bg-pink-100 hover:bg-pink-200 transition"
//                       title="Edit"
//                     >
//                       <Pencil size={16} className="text-pink-700" />
//                     </button>
//                     <button
//                       onClick={() => handleDelete('referral', ref.id!)}
//                       className="p-2 rounded-xl bg-red-100 hover:bg-red-200 transition"
//                       title="Delete"
//                     >
//                       <Trash2 size={16} className="text-red-600" />
//                     </button>
//                   </div>
//                 </div>
//               </div>
//             ))}
//             {referrals.length === 0 && <div className="text-gray-500">No referrals found.</div>}
//           </div>
//         )}

//         {/* Modal */}
//         {isOpen && (
//           <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-3">
//             <div className="w-full max-w-2xl rounded-2xl bg-white shadow-xl">
//               {/* Modal Header */}
//               <div className="flex items-center justify-between border-b p-4">
//                 <h2 className="text-lg font-semibold text-pink-700">
//                   {editingItem ? 'Edit' : 'Create'} {modalType === 'offer' ? 'Offer' : 'Referral'}
//                 </h2>
//                 <button
//                   onClick={closeModal}
//                   className="px-3 py-1 rounded-xl bg-gray-100 hover:bg-gray-200"
//                 >
//                   Close
//                 </button>
//               </div>

//               {/* Modal Body (Scrollable) */}
//               <div className="max-h-[70vh] overflow-y-auto p-4">
//                 <form onSubmit={handleSubmit} className="space-y-4">
//                   {/* Name, Description, Discount, Dates, Image, Branches, Services, ReferralCode */}
//                   {/* All logic same as original Part 1 including gallery input */}
//                 </form>
//               </div>
//             </div>
//           </div>
//         )}
//       </div>
//     </AccessWrapper>
//   );
// }

// 100% correct code

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
// import AccessWrapper from '@/components/AccessWrapper';
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
//   referralCode?: string;
//   branches: { id: string; name: string }[];
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
//   const [activeTab, setActiveTab] = useState<'offers' | 'referrals'>('offers');

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
//         referralCode: '',
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

//   // Helpers for multi-select
//   const handleBranchesChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
//     const selectedIds = Array.from(e.target.selectedOptions).map((o) => o.value);
//     const selected = branches.filter((b) => selectedIds.includes(b.id));
//     setFormData({ ...formData, branches: selected });
//   };

//   const handleServicesChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
//     const selectedIds = Array.from(e.target.selectedOptions).map((o) => o.value);
//     const selected = services.filter((s) => selectedIds.includes(s.id));
//     setFormData({ ...formData, services: selected });
//   };

//   // Submit form
//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();

//     try {
//       // Ensure numeric fields are numbers
//       const discount = Number(formData.discount) || 0;
//       const usageLimit = Number(formData.usageLimit) || 0;

//       // Ensure arrays are valid
//       const branchesArray = Array.isArray(formData.branches)
//         ? formData.branches.map((b: any) => ({ id: b.id, name: b.name }))
//         : [];
//       const servicesArray = Array.isArray(formData.services)
//         ? formData.services.map((s: any) => ({ id: s.id, name: s.name }))
//         : [];

//       if (modalType === 'offer') {
//         const offerPayload: Offer = {
//           name: formData.name || '',
//           description: formData.description || '',
//           discount,
//           usageLimit,
//           startDate: formData.startDate || '',
//           endDate: formData.endDate || '',
//           isActive: !!formData.isActive,
//           branches: branchesArray,
//           services: servicesArray,
//         };
//         if (formData.image) offerPayload.image = formData.image;

//         if (editingItem?.id) {
//           await updateOffer(editingItem.id, offerPayload);
//         } else {
//           await addOffer(offerPayload);
//         }
//       } else {
//         const referralPayload: Referral = {
//           name: formData.name || '',
//           description: formData.description || '',
//           discount,
//           usageLimit,
//           startDate: formData.startDate || '',
//           endDate: formData.endDate || '',
//           isActive: !!formData.isActive,
//           referralCode: formData.referralCode || '',
//           branches: branchesArray,
//           services: servicesArray,
//         };

//         if (editingItem?.id) {
//           await updateReferral(editingItem.id, referralPayload);
//         } else {
//           await addReferral(referralPayload);
//         }
//       }

//       closeModal();
//     } catch (err) {
//       console.error('Error saving offer/referral:', err);
//       alert('Failed to save offer/referral. Check console for details.');
//     }
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
//     <AccessWrapper>
//       <div className="p-6 space-y-6">
//         {/* Header actions */}
//         <div className="flex flex-wrap items-center justify-between gap-3">
//           <div className="text-2xl font-semibold text-pink-700">Offers & Referrals</div>
//           <div className="flex gap-3">
//             <button
//               onClick={() => openModal('offer')}
//               className="px-4 py-2 rounded-2xl bg-pink-500 text-white shadow-md hover:bg-pink-600 active:scale-95 transition"
//             >
//               + Add Offer
//             </button>
//             <button
//               onClick={() => openModal('referral')}
//               className="px-4 py-2 rounded-2xl bg-pink-400 text-white shadow-md hover:bg-pink-500 active:scale-95 transition"
//             >
//               + Add Referral
//             </button>
//           </div>
//         </div>

//         {/* Tabs */}
//         <div className="flex gap-2 bg-pink-50 p-1 rounded-2xl border border-pink-100 w-fit">
//           <button
//             className={`px-4 py-2 rounded-2xl text-sm font-medium transition ${
//               activeTab === 'offers'
//                 ? 'bg-white shadow text-pink-700'
//                 : 'text-pink-600 hover:bg-pink-100'
//             }`}
//             onClick={() => setActiveTab('offers')}
//           >
//             Offers
//           </button>
//           <button
//             className={`px-4 py-2 rounded-2xl text-sm font-medium transition ${
//               activeTab === 'referrals'
//                 ? 'bg-white shadow text-pink-700'
//                 : 'text-pink-600 hover:bg-pink-100'
//             }`}
//             onClick={() => setActiveTab('referrals')}
//           >
//             Referrals
//           </button>
//         </div>

//         {/* Grid of Cards */}
//         {activeTab === 'offers' ? (
//           <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
//             {offers.map((offer) => (
//               <div
//                 key={offer.id}
//                 className="rounded-2xl border border-pink-100 bg-white shadow-sm hover:shadow-md transition overflow-hidden"
//               >
//                 <div className="relative h-40 w-full bg-pink-100">
//                   {offer.image ? (
//                     <Image
//                       src={offer.image}
//                       alt={offer.name}
//                       fill
//                       className="object-cover"
//                     />
//                   ) : (
//                     <div className="h-full w-full flex items-center justify-center text-pink-600">
//                       No Image
//                     </div>
//                   )}
//                 </div>

//                 <div className="p-4 space-y-2">
//                   <div className="flex items-start justify-between gap-3">
//                     <h3 className="font-semibold text-pink-700 line-clamp-2">{offer.name}</h3>
//                     <span
//                       className={`text-xs px-2 py-1 rounded-full ${
//                         offer.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
//                       }`}
//                     >
//                       {offer.isActive ? 'Active' : 'Inactive'}
//                     </span>
//                   </div>

//                   <p className="text-sm text-gray-600 line-clamp-3">{offer.description}</p>

//                   <div className="text-sm">
//                     <div className="flex items-center justify-between">
//                       <span className="text-gray-500">Discount</span>
//                       <span className="font-medium text-pink-700">{offer.discount}%</span>
//                     </div>
//                     <div className="flex items-center justify-between">
//                       <span className="text-gray-500">Usage Limit</span>
//                       <span className="font-medium">{offer.usageLimit}</span>
//                     </div>
//                   </div>

//                   <div className="text-xs text-gray-600 space-y-1">
//                     <div>
//                       <span className="text-gray-500">Start:</span> {offer.startDate}
//                     </div>
//                     <div>
//                       <span className="text-gray-500">End:</span> {offer.endDate}
//                     </div>
//                   </div>

//                   {offer.branches?.length > 0 && (
//                     <div className="text-xs">
//                       <div className="text-gray-500 mb-1">Branches</div>
//                       <div className="flex flex-wrap gap-1">
//                         {offer.branches.map((b) => (
//                           <span
//                             key={b.id}
//                             className="px-2 py-0.5 rounded-full bg-pink-50 text-pink-700 border border-pink-100"
//                           >
//                             {b.name}
//                           </span>
//                         ))}
//                       </div>
//                     </div>
//                   )}

//                   {offer.services?.length > 0 && (
//                     <div className="text-xs">
//                       <div className="text-gray-500 mb-1">Services</div>
//                       <div className="flex flex-wrap gap-1">
//                         {offer.services.map((s) => (
//                           <span
//                             key={s.id}
//                             className="px-2 py-0.5 rounded-full bg-pink-50 text-pink-700 border border-pink-100"
//                           >
//                             {s.name}
//                           </span>
//                         ))}
//                       </div>
//                     </div>
//                   )}

//                   <div className="pt-2 flex justify-end gap-2">
//                     <button
//                       onClick={() => openModal('offer', offer)}
//                       className="p-2 rounded-xl bg-pink-100 hover:bg-pink-200 transition"
//                       title="Edit"
//                     >
//                       <Pencil size={16} className="text-pink-700" />
//                     </button>
//                     <button
//                       onClick={() => handleDelete('offer', offer.id!)}
//                       className="p-2 rounded-xl bg-red-100 hover:bg-red-200 transition"
//                       title="Delete"
//                     >
//                       <Trash2 size={16} className="text-red-600" />
//                     </button>
//                   </div>
//                 </div>
//               </div>
//             ))}
//             {offers.length === 0 && <div className="text-gray-500">No offers found.</div>}
//           </div>
//         ) : (
//           <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
//             {referrals.map((ref) => (
//               <div
//                 key={ref.id}
//                 className="rounded-2xl border border-pink-100 bg-white shadow-sm hover:shadow-md transition overflow-hidden"
//               >
//                 <div className="p-4 space-y-2">
//                   <div className="flex items-start justify-between gap-3">
//                     <h3 className="font-semibold text-pink-700 line-clamp-2">{ref.name}</h3>
//                     <span
//                       className={`text-xs px-2 py-1 rounded-full ${
//                         ref.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
//                       }`}
//                     >
//                       {ref.isActive ? 'Active' : 'Inactive'}
//                     </span>
//                   </div>

//                   <p className="text-sm text-gray-600 line-clamp-3">{ref.description}</p>

//                   <div className="text-sm">
//                     <div className="flex items-center justify-between">
//                       <span className="text-gray-500">Discount</span>
//                       <span className="font-medium text-pink-700">{ref.discount}%</span>
//                     </div>
//                     <div className="flex items-center justify-between">
//                       <span className="text-gray-500">Usage Limit</span>
//                       <span className="font-medium">{ref.usageLimit}</span>
//                     </div>
//                   </div>

//                   <div className="text-xs text-gray-600 space-y-1">
//                     <div>
//                       <span className="text-gray-500">Start:</span> {ref.startDate}
//                     </div>
//                     <div>
//                       <span className="text-gray-500">End:</span> {ref.endDate}
//                     </div>
//                     {ref.referralCode && (
//                       <div>
//                         <span className="text-gray-500">Code:</span> {ref.referralCode}
//                       </div>
//                     )}
//                   </div>

//                   {ref.branches?.length > 0 && (
//                     <div className="text-xs">
//                       <div className="text-gray-500 mb-1">Branches</div>
//                       <div className="flex flex-wrap gap-1">
//                         {ref.branches.map((b) => (
//                           <span
//                             key={b.id}
//                             className="px-2 py-0.5 rounded-full bg-pink-50 text-pink-700 border border-pink-100"
//                           >
//                             {b.name}
//                           </span>
//                         ))}
//                       </div>
//                     </div>
//                   )}

//                   {ref.services?.length > 0 && (
//                     <div className="text-xs">
//                       <div className="text-gray-500 mb-1">Services</div>
//                       <div className="flex flex-wrap gap-1">
//                         {ref.services.map((s) => (
//                           <span
//                             key={s.id}
//                             className="px-2 py-0.5 rounded-full bg-pink-50 text-pink-700 border border-pink-100"
//                           >
//                             {s.name}
//                           </span>
//                         ))}
//                       </div>
//                     </div>
//                   )}

//                   <div className="pt-2 flex justify-end gap-2">
//                     <button
//                       onClick={() => openModal('referral', ref)}
//                       className="p-2 rounded-xl bg-pink-100 hover:bg-pink-200 transition"
//                       title="Edit"
//                     >
//                       <Pencil size={16} className="text-pink-700" />
//                     </button>
//                     <button
//                       onClick={() => handleDelete('referral', ref.id!)}
//                       className="p-2 rounded-xl bg-red-100 hover:bg-red-200 transition"
//                       title="Delete"
//                     >
//                       <Trash2 size={16} className="text-red-600" />
//                     </button>
//                   </div>
//                 </div>
//               </div>
//             ))}
//             {referrals.length === 0 && <div className="text-gray-500">No referrals found.</div>}
//           </div>
//         )}

//         {/* Modal */}
//         {isOpen && (
//           <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-3">
//             <div className="w-full max-w-2xl rounded-2xl bg-white shadow-xl">
//               {/* Modal Header */}
//               <div className="flex items-center justify-between border-b p-4">
//                 <h2 className="text-lg font-semibold text-pink-700">
//                   {editingItem ? 'Edit' : 'Create'} {modalType === 'offer' ? 'Offer' : 'Referral'}
//                 </h2>
//                 <button
//                   onClick={closeModal}
//                   className="px-3 py-1 rounded-xl bg-gray-100 hover:bg-gray-200"
//                 >
//                   Close
//                 </button>
//               </div>

//               {/* Modal Body */}
//               <div className="max-h-[70vh] overflow-y-auto p-4">
//                 <form onSubmit={handleSubmit} className="space-y-4">
//                   {/* Name */}
//                   <div>
//                     <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
//                     <input
//                       type="text"
//                       placeholder="Title"
//                       value={formData.name || ''}
//                       onChange={(e) => setFormData({ ...formData, name: e.target.value })}
//                       className="w-full border rounded-xl p-2 focus:outline-none focus:ring-2 focus:ring-pink-300"
//                       required
//                     />
//                   </div>

//                   {/* Description */}
//                   <div>
//                     <label className="block text-sm font-medium text-gray-700 mb-1">
//                       Description
//                     </label>
//                     <textarea
//                       placeholder="Description"
//                       value={formData.description || ''}
//                       onChange={(e) => setFormData({ ...formData, description: e.target.value })}
//                       className="w-full border rounded-xl p-2 focus:outline-none focus:ring-2 focus:ring-pink-300"
//                       rows={3}
//                       required
//                     />
//                   </div>

//                   {/* Discount */}
//                   <div>
//                     <label className="block text-sm font-medium text-gray-700 mb-1">Discount</label>
//                     <input
//                       type="number"
//                       placeholder="Discount in %"
//                       value={formData.discount || 0}
//                       onChange={(e) =>
//                         setFormData({ ...formData, discount: Number(e.target.value) })
//                       }
//                       className="w-full border rounded-xl p-2 focus:outline-none focus:ring-2 focus:ring-pink-300"
//                       min={0}
//                       max={100}
//                       required
//                     />
//                   </div>

//                   {/* Usage Limit */}
//                   <div>
//                     <label className="block text-sm font-medium text-gray-700 mb-1">
//                       Usage Limit
//                     </label>
//                     <input
//                       type="number"
//                       placeholder="Usage Limit"
//                       value={formData.usageLimit || 0}
//                       onChange={(e) =>
//                         setFormData({ ...formData, usageLimit: Number(e.target.value) })
//                       }
//                       className="w-full border rounded-xl p-2 focus:outline-none focus:ring-2 focus:ring-pink-300"
//                       min={0}
//                       required
//                     />
//                   </div>

//                   {/* Referral Code */}
//                   {modalType === 'referral' && (
//                     <div>
//                       <label className="block text-sm font-medium text-gray-700 mb-1">
//                         Referral Code
//                       </label>
//                       <input
//                         type="text"
//                         placeholder="Referral Code"
//                         value={formData.referralCode || ''}
//                         onChange={(e) =>
//                           setFormData({ ...formData, referralCode: e.target.value })
//                         }
//                         className="w-full border rounded-xl p-2 focus:outline-none focus:ring-2 focus:ring-pink-300"
//                       />
//                     </div>
//                   )}

//                   {/* Start & End Date */}
//                   <div className="grid grid-cols-2 gap-2">
//                     <div>
//                       <label className="block text-sm font-medium text-gray-700 mb-1">
//                         Start Date
//                       </label>
//                       <input
//                         type="date"
//                         value={formData.startDate || ''}
//                         onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
//                         className="w-full border rounded-xl p-2 focus:outline-none focus:ring-2 focus:ring-pink-300"
//                         required
//                       />
//                     </div>
//                     <div>
//                       <label className="block text-sm font-medium text-gray-700 mb-1">
//                         End Date
//                       </label>
//                       <input
//                         type="date"
//                         value={formData.endDate || ''}
//                         onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
//                         className="w-full border rounded-xl p-2 focus:outline-none focus:ring-2 focus:ring-pink-300"
//                         required
//                       />
//                     </div>
//                   </div>

//                   {/* Image */}
//                   {modalType === 'offer' && (
//                     <div>
//                       <label className="block text-sm font-medium text-gray-700 mb-1">
//                         Image URL
//                       </label>
//                       <input
//                         type="text"
//                         placeholder="Image URL"
//                         value={formData.image || ''}
//                         onChange={(e) => setFormData({ ...formData, image: e.target.value })}
//                         className="w-full border rounded-xl p-2 focus:outline-none focus:ring-2 focus:ring-pink-300"
//                       />
//                     </div>
//                   )}

//                   {/* Branches */}
//                   <div>
//                     <label className="block text-sm font-medium text-gray-700 mb-1">Branches</label>
//                     <select
//                       multiple
//                       value={(formData.branches || []).map((b: any) => b.id)}
//                       onChange={handleBranchesChange}
//                       className="w-full border rounded-xl p-2 focus:outline-none focus:ring-2 focus:ring-pink-300"
//                     >
//                       {branches.map((b) => (
//                         <option key={b.id} value={b.id}>
//                           {b.name}
//                         </option>
//                       ))}
//                     </select>
//                   </div>

//                   {/* Services */}
//                   <div>
//                     <label className="block text-sm font-medium text-gray-700 mb-1">Services</label>
//                     <select
//                       multiple
//                       value={(formData.services || []).map((s: any) => s.id)}
//                       onChange={handleServicesChange}
//                       className="w-full border rounded-xl p-2 focus:outline-none focus:ring-2 focus:ring-pink-300"
//                     >
//                       {services.map((s) => (
//                         <option key={s.id} value={s.id}>
//                           {s.name}
//                         </option>
//                       ))}
//                     </select>
//                   </div>

//                   {/* Is Active */}
//                   <div className="flex items-center gap-2">
//                     <input
//                       type="checkbox"
//                       checked={formData.isActive || false}
//                       onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
//                       id="isActive"
//                     />
//                     <label htmlFor="isActive" className="text-sm text-gray-700">
//                       Active
//                     </label>
//                   </div>

//                   {/* Submit */}
//                   <div className="flex justify-end">
//                     <button
//                       type="submit"
//                       className="px-6 py-2 rounded-2xl bg-pink-500 text-white hover:bg-pink-600 transition"
//                     >
//                       Save
//                     </button>
//                   </div>
//                 </form>
//               </div>
//             </div>
//           </div>
//         )}
//       </div>
//     </AccessWrapper>
//   );
// }


// fiter
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
import AccessWrapper from '@/components/AccessWrapper';
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
  image?: string;
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
  const [activeTab, setActiveTab] = useState<'offers' | 'referrals'>('offers');
  const [selectedBranchFilter, setSelectedBranchFilter] = useState<string>('');

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

  const filteredOffers = selectedBranchFilter
    ? offers.filter((o) => o.branches.some((b) => b.id === selectedBranchFilter))
    : offers;

  const filteredReferrals = selectedBranchFilter
    ? referrals.filter((r) => r.branches.some((b) => b.id === selectedBranchFilter))
    : referrals;

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

  const handleBranchesChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedIds = Array.from(e.target.selectedOptions).map((o) => o.value);
    const selected = branches.filter((b) => selectedIds.includes(b.id));
    setFormData({ ...formData, branches: selected });
  };

  const handleServicesChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedIds = Array.from(e.target.selectedOptions).map((o) => o.value);
    const selected = services.filter((s) => selectedIds.includes(s.id));
    setFormData({ ...formData, services: selected });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const discount = Number(formData.discount) || 0;
      const usageLimit = Number(formData.usageLimit) || 0;
      const branchesArray = Array.isArray(formData.branches)
        ? formData.branches.map((b: any) => ({ id: b.id, name: b.name }))
        : [];
      const servicesArray = Array.isArray(formData.services)
        ? formData.services.map((s: any) => ({ id: s.id, name: s.name }))
        : [];

      if (modalType === 'offer') {
        const offerPayload: Offer = {
          name: formData.name || '',
          description: formData.description || '',
          discount,
          usageLimit,
          startDate: formData.startDate || '',
          endDate: formData.endDate || '',
          isActive: !!formData.isActive,
          branches: branchesArray,
          services: servicesArray,
        };
        if (formData.image) offerPayload.image = formData.image;

        if (editingItem?.id) await updateOffer(editingItem.id, offerPayload);
        else await addOffer(offerPayload);
      } else {
        const referralPayload: Referral = {
          name: formData.name || '',
          description: formData.description || '',
          discount,
          usageLimit,
          startDate: formData.startDate || '',
          endDate: formData.endDate || '',
          isActive: !!formData.isActive,
          referralCode: formData.referralCode || '',
          branches: branchesArray,
          services: servicesArray,
        };
       

        if (editingItem?.id) await updateReferral(editingItem.id, referralPayload);
        else await addReferral(referralPayload);
      }

      closeModal();
    } catch (err) {
      console.error('Error saving offer/referral:', err);
      alert('Failed to save offer/referral. Check console for details.');
    }
  };

  const handleDelete = async (type: 'offer' | 'referral', id: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;
    if (type === 'offer') await deleteOffer(id);
    else await deleteReferral(id);
  };

  return (
    <AccessWrapper>
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 animate-gradient-x">
        {/* Enhanced Header */}
        <div className="relative overflow-hidden bg-gradient-to-r from-pink-600 via-pink-500 to-purple-600 text-white animate-gradient-x">
          <div className="absolute inset-0 bg-black/10 animate-pulse-slow"></div>
          <div className="relative p-8 animate-fade-in">
            <div className="max-w-7xl mx-auto">
              <div className="flex flex-wrap items-center justify-between gap-6">
                <div className="space-y-2 animate-slide-up">
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-pink-100 bg-clip-text text-transparent animate-text-shimmer">
                    Offers & Referrals
                  </h1>
                  <p className="text-pink-100 text-lg animate-fade-in-delay">Manage your promotional campaigns and referral programs</p>
                </div>

                <div className="flex items-center gap-4 animate-slide-down">
                  {/* Enhanced Branch Filter */}
                  <div className="relative animate-bounce-subtle">
                    <select
                      value={selectedBranchFilter}
                      onChange={(e) => setSelectedBranchFilter(e.target.value)}
                      className="appearance-none bg-white/20 backdrop-blur-sm border border-white/30 rounded-2xl px-4 py-3 pr-10 text-white placeholder-pink-100 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 transition-all duration-200 hover:bg-white/30 hover:scale-105"
                    >
                      <option value="" className="text-gray-800">All Branches</option>
                      {branches.map((b) => (
                        <option key={b.id} value={b.id} className="text-gray-800">
                          {b.name}
                        </option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <svg className="w-5 h-5 text-white/70 animate-bounce-gentle" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>

                  {/* Enhanced Add Buttons */}
                  <button
                    onClick={() => openModal('offer')}
                    className="group relative px-6 py-3 bg-white/20 backdrop-blur-sm border border-white/30 rounded-2xl text-white font-medium hover:bg-white/30 hover:scale-105 active:scale-95 transition-all duration-200 shadow-lg hover:shadow-xl animate-float"
                  >
                    <span className="flex items-center gap-2">
                      <svg className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Add Offer
                    </span>
                  </button>
                  <button
                    onClick={() => openModal('referral')}
                    className="group relative px-6 py-3 bg-white/20 backdrop-blur-sm border border-white/30 rounded-2xl text-white font-medium hover:bg-white/30 hover:scale-105 active:scale-95 transition-all duration-200 shadow-lg hover:shadow-xl animate-float-delay"
                  >
                    <span className="flex items-center gap-2">
                      <svg className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Add Referral
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto p-8 space-y-8 animate-fade-in-up">

        {/* Enhanced Tabs */}
        <div className="flex justify-center animate-slide-up-delay">
          <div className="inline-flex gap-1 bg-white/80 backdrop-blur-sm p-1.5 rounded-3xl border border-pink-200/50 shadow-lg animate-glow">
            <button
              className={`relative px-8 py-3 rounded-2xl text-sm font-semibold transition-all duration-300 ${
                activeTab === 'offers'
                  ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-lg transform scale-105 animate-pulse-glow'
                  : 'text-pink-600 hover:bg-pink-50 hover:text-pink-700 hover:scale-105'
              }`}
              onClick={() => setActiveTab('offers')}
            >
              <span className="relative z-10 flex items-center gap-2">
                <svg className="w-4 h-4 animate-spin-slow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
                Offers
              </span>
              {activeTab === 'offers' && (
                <div className="absolute inset-0 bg-gradient-to-r from-pink-500 to-purple-500 rounded-2xl opacity-20 animate-pulse"></div>
              )}
            </button>
            <button
              className={`relative px-8 py-3 rounded-2xl text-sm font-semibold transition-all duration-300 ${
                activeTab === 'referrals'
                  ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-lg transform scale-105'
                  : 'text-pink-600 hover:bg-pink-50 hover:text-pink-700'
              }`}
              onClick={() => setActiveTab('referrals')}
            >
              <span className="relative z-10 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                Referrals
              </span>
              {activeTab === 'referrals' && (
                <div className="absolute inset-0 bg-gradient-to-r from-pink-500 to-purple-500 rounded-2xl opacity-20 animate-pulse"></div>
              )}
            </button>
          </div>
        </div>

        {/* Enhanced Cards Grid */}
        {activeTab === 'offers' ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 animate-fade-in-content">
            {filteredOffers.map((offer, index) => (
              <div key={offer.id} className="group relative bg-white/80 backdrop-blur-sm rounded-3xl border border-pink-200/50 shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden hover:scale-105 animate-bounce-in" style={{animationDelay: `${index * 0.1}s`}}>
                {/* Card Header with Image */}
                <div className="relative h-48 w-full overflow-hidden rounded-t-3xl">
                  {offer.image ? (
                    <Image src={offer.image} alt={offer.name} fill className="object-cover group-hover:scale-110 transition-transform duration-500" />
                  ) : (
                    <div className="h-full w-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center">
                      <svg className="w-16 h-16 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                      </svg>
                    </div>
                  )}
                  {/* Status Badge */}
                  <div className="absolute top-4 right-4">
                    <span className={`px-3 py-1.5 rounded-full text-xs font-semibold backdrop-blur-sm ${
                      offer.isActive 
                        ? 'bg-green-500/90 text-white shadow-lg' 
                        : 'bg-gray-500/90 text-white shadow-lg'
                    }`}>
                      {offer.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  {/* Discount Badge */}
                  <div className="absolute top-4 left-4">
                    <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-3 py-1.5 rounded-full text-sm font-bold shadow-lg">
                      {offer.discount}% OFF
                    </div>
                  </div>
                </div>

                {/* Card Content */}
                <div className="p-6 space-y-4">
                  <div className="space-y-2">
                    <h3 className="font-bold text-xl text-gray-800 line-clamp-2 group-hover:text-pink-600 transition-colors">
                      {offer.name}
                    </h3>
                    <p className="text-gray-600 text-sm line-clamp-3 leading-relaxed">{offer.description}</p>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-pink-50 rounded-2xl p-3 text-center">
                      <div className="text-2xl font-bold text-pink-600">{offer.discount}%</div>
                      <div className="text-xs text-pink-500 font-medium">Discount</div>
                    </div>
                    <div className="bg-purple-50 rounded-2xl p-3 text-center">
                      <div className="text-2xl font-bold text-purple-600">{offer.usageLimit}</div>
                      <div className="text-xs text-purple-500 font-medium">Usage Limit</div>
                    </div>
                  </div>

                  {/* Dates */}
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="font-medium">Start:</span> {offer.startDate}
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="font-medium">End:</span> {offer.endDate}
                    </div>
                  </div>

                  {/* Tags */}
                  {offer.branches?.length > 0 && (
                    <div className="space-y-2">
                      <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Branches</div>
                      <div className="flex flex-wrap gap-1">
                        {offer.branches.map((b) => (
                          <span key={b.id} className="px-2 py-1 rounded-full bg-gradient-to-r from-pink-100 to-purple-100 text-pink-700 text-xs font-medium border border-pink-200">
                            {b.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {offer.services?.length > 0 && (
                    <div className="space-y-2">
                      <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Services</div>
                      <div className="flex flex-wrap gap-1">
                        {offer.services.map((s) => (
                          <span key={s.id} className="px-2 py-1 rounded-full bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 text-xs font-medium border border-blue-200">
                            {s.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="pt-4 flex justify-end gap-3">
                    <button 
                      onClick={() => openModal('offer', offer)} 
                      className="group/btn p-3 rounded-2xl bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-110" 
                      title="Edit"
                    >
                      <Pencil size={16} className="text-white group-hover/btn:scale-110 transition-transform" />
                    </button>
                    <button 
                      onClick={() => handleDelete('offer', offer.id!)} 
                      className="group/btn p-3 rounded-2xl bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-110" 
                      title="Delete"
                    >
                      <Trash2 size={16} className="text-white group-hover/btn:scale-110 transition-transform" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {filteredOffers.length === 0 && (
              <div className="col-span-full text-center py-16">
                <div className="text-gray-400 text-lg">No offers found</div>
                <p className="text-gray-500 text-sm mt-2">Create your first offer to get started</p>
              </div>
            )}
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 animate-fade-in-content">
            {filteredReferrals.map((ref, index) => (
              <div key={ref.id} className="group relative bg-white/80 backdrop-blur-sm rounded-3xl border border-pink-200/50 shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden hover:scale-105 animate-bounce-in" style={{animationDelay: `${index * 0.1}s`}}>
                {/* Card Header */}
                <div className="relative h-32 w-full bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center">
                  <svg className="w-16 h-16 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  
                  {/* Status Badge */}
                  <div className="absolute top-4 right-4">
                    <span className={`px-3 py-1.5 rounded-full text-xs font-semibold backdrop-blur-sm ${
                      ref.isActive 
                        ? 'bg-green-500/90 text-white shadow-lg' 
                        : 'bg-gray-500/90 text-white shadow-lg'
                    }`}>
                      {ref.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  
                  {/* Discount Badge */}
                  <div className="absolute top-4 left-4">
                    <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-3 py-1.5 rounded-full text-sm font-bold shadow-lg">
                      {ref.discount}% OFF
                    </div>
                  </div>
                </div>

                {/* Card Content */}
                <div className="p-6 space-y-4">
                  <div className="space-y-2">
                    <h3 className="font-bold text-xl text-gray-800 line-clamp-2 group-hover:text-purple-600 transition-colors">
                      {ref.name}
                    </h3>
                    <p className="text-gray-600 text-sm line-clamp-3 leading-relaxed">{ref.description}</p>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-purple-50 rounded-2xl p-3 text-center">
                      <div className="text-2xl font-bold text-purple-600">{ref.discount}%</div>
                      <div className="text-xs text-purple-500 font-medium">Discount</div>
                    </div>
                    <div className="bg-pink-50 rounded-2xl p-3 text-center">
                      <div className="text-2xl font-bold text-pink-600">{ref.usageLimit}</div>
                      <div className="text-xs text-pink-500 font-medium">Usage Limit</div>
                    </div>
                  </div>

                  {/* Dates and Code */}
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="font-medium">Start:</span> {ref.startDate}
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="font-medium">End:</span> {ref.endDate}
                    </div>
                    {ref.referralCode && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                        </svg>
                        <span className="font-medium">Code:</span> 
                        <span className="bg-gradient-to-r from-blue-100 to-purple-100 px-2 py-1 rounded-lg font-mono text-blue-700 border border-blue-200">
                          {ref.referralCode}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Tags */}
                  {ref.branches?.length > 0 && (
                    <div className="space-y-2">
                      <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Branches</div>
                      <div className="flex flex-wrap gap-1">
                        {ref.branches.map((b) => (
                          <span key={b.id} className="px-2 py-1 rounded-full bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 text-xs font-medium border border-purple-200">
                            {b.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {ref.services?.length > 0 && (
                    <div className="space-y-2">
                      <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Services</div>
                      <div className="flex flex-wrap gap-1">
                        {ref.services.map((s) => (
                          <span key={s.id} className="px-2 py-1 rounded-full bg-gradient-to-r from-indigo-100 to-blue-100 text-indigo-700 text-xs font-medium border border-indigo-200">
                            {s.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="pt-4 flex justify-end gap-3">
                    <button 
                      onClick={() => openModal('referral', ref)} 
                      className="group/btn p-3 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-110" 
                      title="Edit"
                    >
                      <Pencil size={16} className="text-white group-hover/btn:scale-110 transition-transform" />
                    </button>
                    <button 
                      onClick={() => handleDelete('referral', ref.id!)} 
                      className="group/btn p-3 rounded-2xl bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-110" 
                      title="Delete"
                    >
                      <Trash2 size={16} className="text-white group-hover/btn:scale-110 transition-transform" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {filteredReferrals.length === 0 && (
              <div className="col-span-full text-center py-16">
                <div className="text-gray-400 text-lg">No referrals found</div>
                <p className="text-gray-500 text-sm mt-2">Create your first referral program to get started</p>
              </div>
            )}
          </div>
        )}

        {/* Close main content div */}
        </div>
      </div>

        {/* Modal */}
        
        {/* Modal */}
{isOpen && (
  <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 px-3">
    <div className="bg-white rounded-2xl w-full max-w-lg max-h-[80vh] overflow-y-auto p-6">
      <h2 className="text-xl font-semibold text-pink-700 mb-4">
        {editingItem ? 'Edit' : 'Add'} {modalType === 'offer' ? 'Offer' : 'Referral'}
      </h2>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Name"
          value={formData.name || ''}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full border rounded-2xl px-3 py-2"
          required
        />
        <textarea
          placeholder="Description"
          value={formData.description || ''}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="w-full border rounded-2xl px-3 py-2"
        />
        <div className="flex gap-2">
          <input
            type="number"
            placeholder="Discount %"
            value={formData.discount || ''}
            onChange={(e) => setFormData({ ...formData, discount: e.target.value })}
            className="w-1/2 border rounded-2xl px-3 py-2"
          />
          <input
            type="number"
            placeholder="Usage Limit"
            value={formData.usageLimit || ''}
            onChange={(e) => setFormData({ ...formData, usageLimit: e.target.value })}
            className="w-1/2 border rounded-2xl px-3 py-2"
          />
        </div>
        <div className="flex gap-2">
          <input
            type="date"
            placeholder="Start Date"
            value={formData.startDate || ''}
            onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
            className="w-1/2 border rounded-2xl px-3 py-2"
          />
          <input
            type="date"
            placeholder="End Date"
            value={formData.endDate || ''}
            onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
            className="w-1/2 border rounded-2xl px-3 py-2"
          />
        </div>
        {modalType === 'offer' && (
  <div>
    <label className="text-sm text-gray-500">Add Image</label>
    <input
      type="file"
      accept="image/*"
      onChange={(e) => {
        const file = e.target.files?.[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = () => {
            setFormData({ ...formData, image: reader.result });
          };
          reader.readAsDataURL(file);
        }
      }}
      className="w-full border rounded-2xl px-3 py-2 mt-1"
    />
    {formData.image && (
      <div className="mt-2">
        <img src={formData.image} alt="Preview" className="w-full h-auto rounded-lg" />
      </div>
    )}
  </div>
)}

        {modalType === 'referral' && (
          <input
            type="text"
            placeholder="Referral Code"
            value={formData.referralCode || ''}
            onChange={(e) => setFormData({ ...formData, referralCode: e.target.value })}
            className="w-full border rounded-2xl px-3 py-2"
          />
        )}
        <div>
          <label className="text-sm text-gray-500">Branches</label>
          <select
            multiple
            value={formData.branches?.map((b: any) => b.id) || []}
            onChange={handleBranchesChange}
            className="w-full border rounded-2xl px-3 py-2 mt-1"
          >
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-sm text-gray-500">Services</label>
          <select
            multiple
            value={formData.services?.map((s: any) => s.id) || []}
            onChange={handleServicesChange}
            className="w-full border rounded-2xl px-3 py-2 mt-1"
          >
            {services.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
           
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button
            type="button"
            onClick={closeModal}
            className="group px-6 py-3 rounded-2xl border-2 border-gray-300 text-gray-700 font-medium hover:border-gray-400 hover:bg-gray-50 hover:scale-105 active:scale-95 transition-all duration-200 shadow-md hover:shadow-lg"
          >
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Cancel
            </span>
          </button>
          <button
            type="submit"
            className="group px-6 py-3 rounded-2xl bg-gradient-to-r from-pink-500 to-purple-500 text-white font-medium hover:from-pink-600 hover:to-purple-600 hover:scale-105 active:scale-95 transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              {editingItem ? 'Update' : 'Add'}
            </span>
          </button>
        </div>
      </form>
    </div>
  </div>
)}

      
    </AccessWrapper>
  );
}
