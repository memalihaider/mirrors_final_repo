// "use client";

// import React, { useEffect, useState } from "react";
// import { Plus, Edit2, Trash2, Save, X } from "lucide-react";
// import { motion, AnimatePresence } from "framer-motion";
// import { useAuth } from "@/contexts/AuthContext";
// import { useRouter } from "next/navigation";

// import {
//   collection,
//   query,
//   orderBy,
//   onSnapshot,
//   addDoc,
//   updateDoc,
//   deleteDoc,
//   doc,
//   serverTimestamp,
// } from "firebase/firestore";
// import { db } from "@/lib/firebase";
// import AccessWrapper from "@/components/AccessWrapper";

// // -------- Types --------
// type Membership = {
//   id?: string;
//   name: string;
//   description: string;
//   spending: number;
//   createdAt?: any;
// };

// type LoyaltyPoint = {
//   id?: string;
//   name: string;
//   description: string;
//   points: number;
//   createdAt?: any;
// };

// type BookingRestriction = {
//   id?: string;
//   number: number;
//   description: string;
//   createdAt?: any;
// };

// export default function MembershipsPage() {
//   const { user } = useAuth();
//   const router = useRouter();

//   // -------- State --------
//   const [memberships, setMemberships] = useState<Membership[]>([]);
//   const [loyaltyPoints, setLoyaltyPoints] = useState<LoyaltyPoint[]>([]);
//   const [bookingRestrictions, setBookingRestrictions] = useState<BookingRestriction[]>([]);
//   const [loading, setLoading] = useState(true);

//   // Modal states
//   const [isModalOpen, setIsModalOpen] = useState(false);
//   const [editingId, setEditingId] = useState<string | null>(null);
//   const [modalType, setModalType] = useState<"membership" | "loyalty" | "restriction">("membership");
//   const [form, setForm] = useState<{ name: string; description: string; spending?: string; points?: string; number?: string }>({
//     name: "",
//     description: "",
//     spending: "",
//     points: "",
//     number: "",
//   });
//   const [saving, setSaving] = useState(false);

//   // -------- Fetch Data --------
//   useEffect(() => {
//     if (!db) return;
    
//     setLoading(true);
//     try {
//       // Initialize collection references inside useEffect
//       const membershipsRef = collection(db, "memberships");
//       const loyaltyPointsRef = collection(db, "loyaltyPoints");
//       const bookingRestrictionsRef = collection(db, "bookingRestrictions");

//       const q1 = query(membershipsRef, orderBy("createdAt", "asc"));
//       const unsub1 = onSnapshot(q1, (snap) => {
//         setMemberships(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })));
//       });

//       const q2 = query(loyaltyPointsRef, orderBy("createdAt", "asc"));
//       const unsub2 = onSnapshot(q2, (snap) => {
//         setLoyaltyPoints(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })));
//       });

//       const q3 = query(bookingRestrictionsRef, orderBy("createdAt", "asc"));
//       const unsub3 = onSnapshot(q3, (snap) => {
//         setBookingRestrictions(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })));
//         setLoading(false);
//       });

//       return () => {
//         unsub1();
//         unsub2();
//         unsub3();
//       };
//     } catch (err) {
//       console.error("subscribe error:", err);
//       setLoading(false);
//     }
//   }, []);

//   // -------- Modal Helpers --------
//   const openAddModal = (type: "membership" | "loyalty" | "restriction") => {
//     setForm({ name: "", description: "", spending: "", points: "", number: "" });
//     setEditingId(null);
//     setModalType(type);
//     setIsModalOpen(true);
//   };

//   const openEditModal = (item: any, type: "membership" | "loyalty" | "restriction") => {
//     setForm({
//       name: item.name || "",
//       description: item.description || "",
//       spending: type === "membership" ? item.spending?.toString() || "" : "",
//       points: type === "loyalty" ? item.points?.toString() || "" : "",
//       number: type === "restriction" ? item.number?.toString() || "" : "",
//     });
//     setEditingId(item.id || null);
//     setModalType(type);
//     setIsModalOpen(true);
//   };

//   const closeModal = () => {
//     setIsModalOpen(false);
//     setEditingId(null);
//     setForm({ name: "", description: "", spending: "", points: "", number: "" });
//     setSaving(false);
//   };

//   // -------- Save --------
//   const handleSave = async (e?: React.FormEvent) => {
//     e?.preventDefault();
//     if (modalType !== "restriction" && !form.name.trim()) {
//       alert("Please enter a name.");
//       return;
//     }

//     if (modalType === "membership" && (!form.spending || isNaN(Number(form.spending)))) {
//       alert("Please enter a valid spending amount.");
//       return;
//     }

//     if (modalType === "loyalty" && (!form.points || isNaN(Number(form.points)))) {
//       alert("Please enter a valid points value.");
//       return;
//     }

//     if (modalType === "restriction" && (!form.number || isNaN(Number(form.number)))) {
//       alert("Please enter a valid number for restriction.");
//       return;
//     }

//     setSaving(true);
//     try {
//       if (modalType === "membership") {
//         if (editingId) {
//           await updateDoc(doc(db, "memberships", editingId), {
//             name: form.name.trim(),
//             description: form.description.trim(),
//             spending: Number(form.spending),
//             updatedAt: serverTimestamp(),
//           });
//         } else {
//           await addDoc(collection(db, "memberships"), {
//             name: form.name.trim(),
//             description: form.description.trim(),
//             spending: Number(form.spending),
//             createdAt: serverTimestamp(),
//           });
//         }
//       } else if (modalType === "loyalty") {
//         if (editingId) {
//           await updateDoc(doc(db, "loyaltyPoints", editingId), {
//             name: form.name.trim(),
//             description: form.description.trim(),
//             points: Number(form.points),
//             updatedAt: serverTimestamp(),
//           });
//         } else {
//           await addDoc(collection(db, "loyaltyPoints"), {
//             name: form.name.trim(),
//             description: form.description.trim(),
//             points: Number(form.points),
//             createdAt: serverTimestamp(),
//           });
//         }
//       } else if (modalType === "restriction") {
//         if (editingId) {
//           await updateDoc(doc(db, "bookingRestrictions", editingId), {
//             number: Number(form.number),
//             description: form.description.trim(),
//             updatedAt: serverTimestamp(),
//           });
//         } else {
//           await addDoc(collection(db, "bookingRestrictions"), {
//             number: Number(form.number),
//             description: form.description.trim(),
//             createdAt: serverTimestamp(),
//           });
//         }
//       }
//       closeModal();
//     } catch (err) {
//       console.error("save error:", err);
//       alert("Error saving item. See console.");
//       setSaving(false);
//     }
//   };

//   // -------- Delete --------
//   const handleDelete = async (id?: string, type: "membership" | "loyalty" | "restriction" = "membership") => {
//     if (!id) return;
//     if (!confirm("Are you sure you want to delete this item?")) return;
//     try {
//       await deleteDoc(doc(db, type === "membership" ? "memberships" : type === "loyalty" ? "loyaltyPoints" : "bookingRestrictions", id));
//     } catch (err) {
//       console.error("delete error:", err);
//       alert("Error deleting. See console.");
//     }
//   };

//   // -------- Render --------
//   return (
//     <AccessWrapper>
//     <div className="p-6 max-w-5xl mx-auto space-y-10">
//       {/* Memberships Section */}
//       {/* ---------- MEMBERSHIPS JSX ---------- */}
//       <div>
//         <div className="flex items-center justify-between mb-6">
//           <h2 className="text-2xl font-semibold text-indigo-600">Memberships</h2>
//           <button
//             onClick={() => openAddModal("membership")}
//             className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-indigo-500 to-indigo-600 text-white shadow-lg hover:scale-[1.01] transition"
//           >
//             <Plus className="w-4 h-4" />
//             Add Membership
//           </button>
//         </div>

//         {loading ? (
//           <div className="p-6 rounded-lg bg-white/80">Loading...</div>
//         ) : memberships.length === 0 ? (
//           <div className="p-6 rounded-lg bg-white/80 text-center">
//             No memberships yet. Click "Add Membership" to create one.
//           </div>
//         ) : (
//           <div className="grid gap-4 md:grid-cols-3">
//             {memberships.map((m) => (
//               <div
//                 key={m.id}
//                 className="bg-white/90 dark:bg-gray-900 p-4 rounded-2xl border border-indigo-100/30 shadow"
//               >
//                 <div className="flex items-start justify-between">
//                   <div>
//                     <h3 className="text-lg font-semibold text-indigo-700">{m.name}</h3>
//                     <p className="text-sm text-gray-600 mt-1">{m.description}</p>
//                     <p className="text-sm font-medium text-indigo-500 mt-2">Spending: {m.spending}</p>
//                   </div>
//                   <div className="flex items-center gap-2">
//                     <button onClick={() => openEditModal(m, "membership")} className="p-1 hover:bg-gray-100 rounded-md">
//                       <Edit2 className="w-4 h-4" />
//                     </button>
//                     <button onClick={() => handleDelete(m.id, "membership")} className="p-1 hover:bg-red-50 rounded-md">
//                       <Trash2 className="w-4 h-4 text-red-600" />
//                     </button>
//                   </div>
//                 </div>
//               </div>
//             ))}
//           </div>
//         )}
//       </div>

//       {/* Loyalty Points Section */}
//       {/* ---------- LOYALTY JSX ---------- */}
//       <div>
//         <div className="flex items-center justify-between mb-6">
//           <h2 className="text-2xl font-semibold text-emerald-600">Loyalty Points</h2>
//           <button
//             onClick={() => openAddModal("loyalty")}
//             className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg hover:scale-[1.01] transition"
//           >
//             <Plus className="w-4 h-4" />
//             Add Loyalty
//           </button>
//         </div>

//         {loading ? (
//           <div className="p-6 rounded-lg bg-white/80">Loading...</div>
//         ) : loyaltyPoints.length === 0 ? (
//           <div className="p-6 rounded-lg bg-white/80 text-center">
//             No loyalty points yet. Click "Add Loyalty" to create one.
//           </div>
//         ) : (
//           <div className="grid gap-4 md:grid-cols-3">
//             {loyaltyPoints.map((lp) => (
//               <div
//                 key={lp.id}
//                 className="bg-white/90 dark:bg-gray-900 p-4 rounded-2xl border border-emerald-100/30 shadow"
//               >
//                 <div className="flex items-start justify-between">
//                   <div>
//                     <h3 className="text-lg font-semibold text-emerald-700">{lp.name}</h3>
//                     <p className="text-sm text-gray-600 mt-1">{lp.description}</p>
//                     <p className="text-sm font-medium text-emerald-500 mt-2">Points: {lp.points}</p>
//                   </div>
//                   <div className="flex items-center gap-2">
//                     <button onClick={() => openEditModal(lp, "loyalty")} className="p-1 hover:bg-gray-100 rounded-md">
//                       <Edit2 className="w-4 h-4" />
//                     </button>
//                     <button onClick={() => handleDelete(lp.id, "loyalty")} className="p-1 hover:bg-red-50 rounded-md">
//                       <Trash2 className="w-4 h-4 text-red-600" />
//                     </button>
//                   </div>
//                 </div>
//               </div>
//             ))}
//           </div>
//         )}
//       </div>

//       {/* Booking Restrictions Section */}
//       {/* ---------- RESTRICTIONS JSX ---------- */}
//       <div>
//         <div className="flex items-center justify-between mb-6">
//           <h2 className="text-2xl font-semibold text-rose-600">Booking Restrictions</h2>
//           <button
//             onClick={() => openAddModal("restriction")}
//             className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-rose-500 to-rose-600 text-white shadow-lg hover:scale-[1.01] transition"
//           >
//             <Plus className="w-4 h-4" />
//             Add Restriction
//           </button>
//         </div>

//         {loading ? (
//           <div className="p-6 rounded-lg bg-white/80">Loading...</div>
//         ) : bookingRestrictions.length === 0 ? (
//           <div className="p-6 rounded-lg bg-white/80 text-center">
//             No restrictions yet. Click "Add Restriction" to create one.
//           </div>
//         ) : (
//           <div className="grid gap-4 md:grid-cols-3">
//             {bookingRestrictions.map((br) => (
//               <div
//                 key={br.id}
//                 className="bg-white/90 dark:bg-gray-900 p-4 rounded-2xl border border-rose-100/30 shadow"
//               >
//                 <div className="flex items-start justify-between">
//                   <div>
//                     <h3 className="text-lg font-semibold text-rose-700">Limit: {br.number}</h3>
//                     <p className="text-sm text-gray-600 mt-1">{br.description}</p>
//                   </div>
//                   <div className="flex items-center gap-2">
//                     <button onClick={() => openEditModal(br, "restriction")} className="p-1 hover:bg-gray-100 rounded-md">
//                       <Edit2 className="w-4 h-4" />
//                     </button>
//                     <button onClick={() => handleDelete(br.id, "restriction")} className="p-1 hover:bg-red-50 rounded-md">
//                       <Trash2 className="w-4 h-4 text-red-600" />
//                     </button>
//                   </div>
//                 </div>
//               </div>
//             ))}
//           </div>
          
//         )}
//       </div>

//       {/* Modal */}
//       <AnimatePresence>
//         {isModalOpen && (
//           <motion.div
//             key="modal-overlay"
//             initial={{ opacity: 0 }}
//             animate={{ opacity: 1 }}
//             exit={{ opacity: 0 }}
//             className="fixed inset-0 z-50 flex items-center justify-center"
//           >
//             <motion.div
//               initial={{ opacity: 0 }}
//               animate={{ opacity: 1 }}
//               exit={{ opacity: 0 }}
//               className="absolute inset-0 bg-black/40 backdrop-blur-sm"
//               onClick={closeModal}
//             />

//             <motion.form
//               key="modal-panel"
//               initial={{ y: -20, opacity: 0, scale: 0.98 }}
//               animate={{ y: 0, opacity: 1, scale: 1 }}
//               exit={{ y: 10, opacity: 0, scale: 0.98 }}
//               transition={{ type: "spring", stiffness: 400, damping: 28 }}
//               onSubmit={handleSave}
//               className="relative z-50 w-full max-w-lg bg-white/95 dark:bg-gray-900/95 rounded-2xl p-6 shadow-xl border"
//             >
//               <div className="flex items-center justify-between mb-4">
//                 <h4 className="text-sm font-medium">
//                   {editingId
//                     ? `Edit ${modalType === "membership" ? "Membership" : modalType === "loyalty" ? "Loyalty Point" : "Restriction"}`
//                     : `New ${modalType === "membership" ? "Membership" : modalType === "loyalty" ? "Loyalty Point" : "Restriction"}`}
//                 </h4>
//                 <button type="button" onClick={closeModal} className="p-1 rounded-md hover:bg-gray-100">
//                   <X className="w-4 h-4" />
//                 </button>
//               </div>

//               <div className="space-y-3">
//                 {modalType !== "restriction" && (
//                   <div>
//                     <label className="block text-xs text-gray-600 mb-1">Name</label>
//                     <input
//                       value={form.name}
//                       onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
//                       className="w-full px-3 py-2 rounded-lg border bg-white text-sm"
//                       placeholder="Enter name"
//                       required={modalType !== "restriction"}
//                     />
//                   </div>
//                 )}

//                 <div>
//                   <label className="block text-xs text-gray-600 mb-1">Description</label>
//                   <textarea
//                     value={form.description}
//                     onChange={(e) => setForm((s) => ({ ...s, description: e.target.value }))}
//                     className="w-full px-3 py-2 rounded-lg border bg-white text-sm min-h-[80px]"
//                     placeholder="Short description"
//                   />
//                 </div>

//                 {modalType === "membership" && (
//                   <div>
//                     <label className="block text-xs text-gray-600 mb-1">Spending</label>
//                     <input
//                       type="number"
//                       value={form.spending}
//                       onChange={(e) => setForm((s) => ({ ...s, spending: e.target.value }))}
//                       className="w-full px-3 py-2 rounded-lg border bg-white text-sm"
//                       placeholder="Enter spending amount"
//                       required
//                     />
//                   </div>
//                 )}

//                 {modalType === "loyalty" && (
//                   <div>
//                     <label className="block text-xs text-gray-600 mb-1">Points</label>
//                     <input
//                       type="number"
//                       value={form.points}
//                       onChange={(e) => setForm((s) => ({ ...s, points: e.target.value }))}
//                       className="w-full px-3 py-2 rounded-lg border bg-white text-sm"
//                       placeholder="Enter points"
//                       required
//                     />
//                   </div>
//                 )}

//                 {modalType === "restriction" && (
//                   <div>
//                     <label className="block text-xs text-gray-600 mb-1">Restriction Limit</label>
//                     <input
//                       type="number"
//                       value={form.number}
//                       onChange={(e) => setForm((s) => ({ ...s, number: e.target.value }))}
//                       className="w-full px-3 py-2 rounded-lg border bg-white text-sm"
//                       placeholder="Enter restriction number"
//                       required
//                     />
//                   </div>
//                 )}
//               </div>

//               <div className="mt-6 flex items-center justify-end gap-2">
//                 <button
//                   type="button"
//                   onClick={closeModal}
//                   className="px-4 py-2 text-sm rounded-lg border bg-gray-50 hover:bg-gray-100"
//                 >
//                   Cancel
//                 </button>
//                 <button
//                   type="submit"
//                   disabled={saving}
//                   className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white shadow hover:bg-indigo-700 disabled:opacity-50"
//                 >
//                   <Save className="w-4 h-4" />
//                   {saving ? "Saving..." : "Save"}
//                 </button>
//               </div>
//             </motion.form>
//           </motion.div>
//         )}
//       </AnimatePresence>
//     </div>
//     </AccessWrapper>
//   );
// }


// sms content code



// "use client";

// import React, { useEffect, useState } from "react";
// import { Plus, Edit2, Trash2, Save, X } from "lucide-react";
// import { motion, AnimatePresence } from "framer-motion";
// import { useAuth } from "@/contexts/AuthContext";
// import { useRouter } from "next/navigation";

// import {
//   collection,
//   query,
//   orderBy,
//   onSnapshot,
//   addDoc,
//   updateDoc,
//   deleteDoc,
//   doc,
//   serverTimestamp,
// } from "firebase/firestore";
// import { db } from "@/lib/firebase";
// import AccessWrapper from "@/components/AccessWrapper";

// // -------- Types --------
// type Membership = {
//   id?: string;
//   name: string;
//   description: string;
//   spending: number;
//   createdAt?: any;
// };

// type LoyaltyPoint = {
//   id?: string;
//   name: string;
//   description: string;
//   points: number;
//   createdAt?: any;
// };

// type BookingRestriction = {
//   id?: string;
//   number: number;
//   description: string;
//   createdAt?: any;
// };

// type SmsContent = {
//   id?: string;
//   name: string;
//   description: string;
//   createdAt?: any;
// };

// type PaymentMethod = {
//   id?: string;
//   name: string;
//   createdAt?: any;
// };

// export default function MembershipsPage() {
//   const { user } = useAuth();
//   const router = useRouter();

//   // -------- State --------
//   const [memberships, setMemberships] = useState<Membership[]>([]);
//   const [loyaltyPoints, setLoyaltyPoints] = useState<LoyaltyPoint[]>([]);
//   const [bookingRestrictions, setBookingRestrictions] = useState<BookingRestriction[]>([]);
//   const [smsContent, setSmsContent] = useState<SmsContent[]>([]);
//   const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
//   const [loading, setLoading] = useState(true);

//   // Modal states
//   const [isModalOpen, setIsModalOpen] = useState(false);
//   const [editingId, setEditingId] = useState<string | null>(null);
//   const [modalType, setModalType] = useState<
//     "membership" | "loyalty" | "restriction" | "sms" | "payment"
//   >("membership");

//   const [form, setForm] = useState<{
//     name: string;
//     description: string;
//     spending?: string;
//     points?: string;
//     number?: string;
//   }>({
//     name: "",
//     description: "",
//     spending: "",
//     points: "",
//     number: "",
//   });

//   const [saving, setSaving] = useState(false);

//   // -------- Fetch Data --------
//   useEffect(() => {
//     if (!db) return;

//     setLoading(true);
//     try {
//       const membershipsRef = collection(db, "memberships");
//       const loyaltyPointsRef = collection(db, "loyaltyPoints");
//       const bookingRestrictionsRef = collection(db, "bookingRestrictions");
//       const smsContentRef = collection(db, "smsContent");
//       const paymentMethodsRef = collection(db, "paymentMethods");

//       const q1 = query(membershipsRef, orderBy("createdAt", "asc"));
//       const unsub1 = onSnapshot(q1, (snap) => {
//         setMemberships(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })));
//       });

//       const q2 = query(loyaltyPointsRef, orderBy("createdAt", "asc"));
//       const unsub2 = onSnapshot(q2, (snap) => {
//         setLoyaltyPoints(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })));
//       });

//       const q3 = query(bookingRestrictionsRef, orderBy("createdAt", "asc"));
//       const unsub3 = onSnapshot(q3, (snap) => {
//         setBookingRestrictions(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })));
//       });

//       const q4 = query(smsContentRef, orderBy("createdAt", "asc"));
//       const unsub4 = onSnapshot(q4, (snap) => {
//         setSmsContent(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })));
//       });

//       const q5 = query(paymentMethodsRef, orderBy("createdAt", "asc"));
//       const unsub5 = onSnapshot(q5, (snap) => {
//         setPaymentMethods(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })));
//         setLoading(false);
//       });

//       return () => {
//         unsub1();
//         unsub2();
//         unsub3();
//         unsub4();
//         unsub5();
//       };
//     } catch (err) {
//       console.error("subscribe error:", err);
//       setLoading(false);
//     }
//   }, []);

//   // -------- Modal Helpers --------
//   const openAddModal = (type: "membership" | "loyalty" | "restriction" | "sms" | "payment") => {
//     setForm({ name: "", description: "", spending: "", points: "", number: "" });
//     setEditingId(null);
//     setModalType(type);
//     setIsModalOpen(true);
//   };

//   const openEditModal = (item: any, type: "membership" | "loyalty" | "restriction" | "sms" | "payment") => {
//     setForm({
//       name: item.name || "",
//       description: item.description || "",
//       spending: type === "membership" ? item.spending?.toString() || "" : "",
//       points: type === "loyalty" ? item.points?.toString() || "" : "",
//       number: type === "restriction" ? item.number?.toString() || "" : "",
//     });
//     setEditingId(item.id || null);
//     setModalType(type);
//     setIsModalOpen(true);
//   };

//   const closeModal = () => {
//     setIsModalOpen(false);
//     setEditingId(null);
//     setForm({ name: "", description: "", spending: "", points: "", number: "" });
//     setSaving(false);
//   };

//   // -------- Save --------
//   const handleSave = async (e?: React.FormEvent) => {
//     e?.preventDefault();

//     if (!form.name.trim() && modalType !== "restriction") {
//       alert("Please enter a name.");
//       return;
//     }

//     if (modalType === "membership" && (!form.spending || isNaN(Number(form.spending)))) {
//       alert("Please enter a valid spending amount.");
//       return;
//     }

//     if (modalType === "loyalty" && (!form.points || isNaN(Number(form.points)))) {
//       alert("Please enter a valid points value.");
//       return;
//     }

//     if (modalType === "restriction" && (!form.number || isNaN(Number(form.number)))) {
//       alert("Please enter a valid number for restriction.");
//       return;
//     }

//     setSaving(true);
//     try {
//       let collectionName = "";
//       let payload: any = {};

//       switch (modalType) {
//         case "membership":
//           collectionName = "memberships";
//           payload = {
//             name: form.name.trim(),
//             description: form.description.trim(),
//             spending: Number(form.spending),
//           };
//           break;

//         case "loyalty":
//           collectionName = "loyaltyPoints";
//           payload = {
//             name: form.name.trim(),
//             description: form.description.trim(),
//             points: Number(form.points),
//           };
//           break;

//         case "restriction":
//           collectionName = "bookingRestrictions";
//           payload = {
//             number: Number(form.number),
//             description: form.description.trim(),
//           };
//           break;

//         case "sms":
//           collectionName = "smsContent";
//           payload = {
//             name: form.name.trim(),
//             description: form.description.trim(),
//           };
//           break;

//         case "payment":
//           collectionName = "paymentMethods";
//           payload = {
//             name: form.name.trim(),
//           };
//           break;
//       }

//       if (editingId) {
//         await updateDoc(doc(db, collectionName, editingId), {
//           ...payload,
//           updatedAt: serverTimestamp(),
//         });
//       } else {
//         await addDoc(collection(db, collectionName), {
//           ...payload,
//           createdAt: serverTimestamp(),
//         });
//       }

//       closeModal();
//     } catch (err) {
//       console.error("save error:", err);
//       alert("Error saving item. See console.");
//       setSaving(false);
//     }
//   };

//   // -------- Delete --------
//   const handleDelete = async (
//     id?: string,
//     type: "membership" | "loyalty" | "restriction" | "sms" | "payment" = "membership"
//   ) => {
//     if (!id) return;
//     if (!confirm("Are you sure you want to delete this item?")) return;

//     const collectionName =
//       type === "membership"
//         ? "memberships"
//         : type === "loyalty"
//         ? "loyaltyPoints"
//         : type === "restriction"
//         ? "bookingRestrictions"
//         : type === "sms"
//         ? "smsContent"
//         : "paymentMethods";

//     try {
//       await deleteDoc(doc(db, collectionName, id));
//     } catch (err) {
//       console.error("delete error:", err);
//       alert("Error deleting. See console.");
//     }
//   };

//     // -------- UI --------
//   return (
//     <AccessWrapper requiredRole="admin">
//       <div className="p-6 space-y-10">
//         {/* Memberships */}
//         <Section
//           title="Membership Levels"
//           items={memberships}
//           onAdd={() => openAddModal("membership")}
//           onEdit={(item) => openEditModal(item, "membership")}
//           onDelete={(id) => handleDelete(id, "membership")}
//           renderItem={(item) => (
//             <>
//               <div className="font-semibold">{item.name}</div>
//               <div className="text-sm text-gray-400">{item.description}</div>
//               <div className="text-xs text-gray-500">
//                 Spending: ${item.spending}
//               </div>
//             </>
//           )}
//         />

//         {/* Loyalty */}
//         <Section
//           title="Loyalty Points"
//           items={loyaltyPoints}
//           onAdd={() => openAddModal("loyalty")}
//           onEdit={(item) => openEditModal(item, "loyalty")}
//           onDelete={(id) => handleDelete(id, "loyalty")}
//           renderItem={(item) => (
//             <>
//               <div className="font-semibold">{item.name}</div>
//               <div className="text-sm text-gray-400">{item.description}</div>
//               <div className="text-xs text-gray-500">
//                 Points: {item.points}
//               </div>
//             </>
//           )}
//         />

//         {/* Booking Restrictions */}
//         <Section
//           title="Booking Restrictions"
//           items={bookingRestrictions}
//           onAdd={() => openAddModal("restriction")}
//           onEdit={(item) => openEditModal(item, "restriction")}
//           onDelete={(id) => handleDelete(id, "restriction")}
//           renderItem={(item) => (
//             <>
//               <div className="font-semibold">
//                 Restriction #{item.number}
//               </div>
//               <div className="text-sm text-gray-400">{item.description}</div>
//             </>
//           )}
//         />

//         {/* SMS Content */}
//         <Section
//           title="SMS Content"
//           items={smsContent}
//           onAdd={() => openAddModal("sms")}
//           onEdit={(item) => openEditModal(item, "sms")}
//           onDelete={(id) => handleDelete(id, "sms")}
//           renderItem={(item) => (
//             <>
//               <div className="font-semibold">{item.name}</div>
//               <div className="text-sm text-gray-400">{item.description}</div>
//             </>
//           )}
//         />

//         {/* Payment Methods */}
//         <Section
//           title="Payment Methods"
//           items={paymentMethods}
//           onAdd={() => openAddModal("payment")}
//           onEdit={(item) => openEditModal(item, "payment")}
//           onDelete={(id) => handleDelete(id, "payment")}
//           renderItem={(item) => (
//             <>
//               <div className="font-semibold">{item.name}</div>
//             </>
//           )}
//         />
//       </div>

//       {/* Modal */}
//       <AnimatePresence>
//         {isModalOpen && (
//           <motion.div
//             className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
//             initial={{ opacity: 0 }}
//             animate={{ opacity: 1 }}
//             exit={{ opacity: 0 }}
//           >
//             <motion.form
//               onSubmit={handleSave}
//               initial={{ scale: 0.9, opacity: 0 }}
//               animate={{ scale: 1, opacity: 1 }}
//               exit={{ scale: 0.9, opacity: 0 }}
//               className="bg-gray-900 p-6 rounded-2xl w-full max-w-md shadow-xl border border-gray-700 space-y-4"
//             >
//               <h3 className="text-lg font-semibold text-white capitalize">
//                 {editingId ? "Edit" : "Add"}{" "}
//                 {modalType === "membership"
//                   ? "Membership"
//                   : modalType === "loyalty"
//                   ? "Loyalty Point"
//                   : modalType === "restriction"
//                   ? "Booking Restriction"
//                   : modalType === "sms"
//                   ? "SMS Content"
//                   : "Payment Method"}
//               </h3>

//               {(modalType === "membership" ||
//                 modalType === "loyalty" ||
//                 modalType === "sms" ||
//                 modalType === "payment") && (
//                 <div>
//                   <label className="text-sm text-gray-300">Name</label>
//                   <input
//                     type="text"
//                     value={form.name}
//                     onChange={(e) =>
//                       setForm({ ...form, name: e.target.value })
//                     }
//                     className="w-full mt-1 p-2 rounded bg-gray-800 text-white border border-gray-700"
//                   />
//                 </div>
//               )}

//               {(modalType === "membership" ||
//                 modalType === "loyalty" ||
//                 modalType === "sms" ||
//                 modalType === "restriction") && (
//                 <div>
//                   <label className="text-sm text-gray-300">Description</label>
//                   <textarea
//                     value={form.description}
//                     onChange={(e) =>
//                       setForm({ ...form, description: e.target.value })
//                     }
//                     className="w-full mt-1 p-2 rounded bg-gray-800 text-white border border-gray-700"
//                     rows={3}
//                   />
//                 </div>
//               )}

//               {modalType === "membership" && (
//                 <div>
//                   <label className="text-sm text-gray-300">Spending</label>
//                   <input
//                     type="number"
//                     value={form.spending}
//                     onChange={(e) =>
//                       setForm({ ...form, spending: e.target.value })
//                     }
//                     className="w-full mt-1 p-2 rounded bg-gray-800 text-white border border-gray-700"
//                   />
//                 </div>
//               )}

//               {modalType === "loyalty" && (
//                 <div>
//                   <label className="text-sm text-gray-300">Points</label>
//                   <input
//                     type="number"
//                     value={form.points}
//                     onChange={(e) =>
//                       setForm({ ...form, points: e.target.value })
//                     }
//                     className="w-full mt-1 p-2 rounded bg-gray-800 text-white border border-gray-700"
//                   />
//                 </div>
//               )}

//               {modalType === "restriction" && (
//                 <div>
//                   <label className="text-sm text-gray-300">Number</label>
//                   <input
//                     type="number"
//                     value={form.number}
//                     onChange={(e) =>
//                       setForm({ ...form, number: e.target.value })
//                     }
//                     className="w-full mt-1 p-2 rounded bg-gray-800 text-white border border-gray-700"
//                   />
//                 </div>
//               )}

//               <div className="flex justify-end gap-2 pt-4">
//                 <button
//                   type="button"
//                   onClick={closeModal}
//                   className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600"
//                 >
//                   Cancel
//                 </button>
//                 <button
//                   type="submit"
//                   disabled={saving}
//                   className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500"
//                 >
//                   {saving ? "Saving..." : "Save"}
//                 </button>
//               </div>
//             </motion.form>
//           </motion.div>
//         )}
//       </AnimatePresence>
//     </AccessWrapper>
//   );
// }

// // -------- Reusable Section Component --------
// function Section({
//   title,
//   items,
//   onAdd,
//   onEdit,
//   onDelete,
//   renderItem,
// }: {
//   title: string;
//   items: any[];
//   onAdd: () => void;
//   onEdit: (item: any) => void;
//   onDelete: (id?: string) => void;
//   renderItem: (item: any) => React.ReactNode;
// }) {
//   return (
//     <div className="bg-gray-900 p-5 rounded-2xl border border-gray-700 shadow">
//       <div className="flex justify-between items-center mb-4">
//         <h2 className="text-lg font-semibold text-white">{title}</h2>
//         <button
//           onClick={onAdd}
//           className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-lg text-sm"
//         >
//           <Plus size={16} />
//           Add
//         </button>
//       </div>
//       {items.length === 0 ? (
//         <div className="text-gray-400 text-sm italic">No records found.</div>
//       ) : (
//         <div className="space-y-3">
//           {items.map((item) => (
//             <div
//               key={item.id}
//               className="bg-gray-800 p-3 rounded-lg flex justify-between items-center"
//             >
//               <div>{renderItem(item)}</div>
//               <div className="flex items-center gap-2">
//                 <button
//                   onClick={() => onEdit(item)}
//                   className="text-blue-400 hover:text-blue-300"
//                 >
//                   <Edit2 size={16} />
//                 </button>
//                 <button
//                   onClick={() => onDelete(item.id)}
//                   className="text-red-400 hover:text-red-300"
//                 >
//                   <Trash2 size={16} />
//                 </button>
//               </div>
//             </div>
//           ))}
//         </div>
//       )}
//     </div>
//   );
// }







//uui
// "use client";

// import React, { useEffect, useState } from "react";
// import { Plus, Edit2, Trash2, Save, X } from "lucide-react";
// import { motion, AnimatePresence } from "framer-motion";
// import { useAuth } from "@/contexts/AuthContext";
// import { useRouter } from "next/navigation";

// import {
//   collection,
//   query,
//   orderBy,
//   onSnapshot,
//   addDoc,
//   updateDoc,
//   deleteDoc,
//   doc,
//   serverTimestamp,
// } from "firebase/firestore";
// import { db } from "@/lib/firebase";
// import AccessWrapper from "@/components/AccessWrapper";

// // -------- Types --------
// type Membership = { id?: string; name: string; description: string; spending: number; createdAt?: any };
// type LoyaltyPoint = { id?: string; name: string; description: string; points: number; createdAt?: any };
// type BookingRestriction = { id?: string; number: number; description: string; createdAt?: any };
// type SmsContent = { id?: string; name: string; description: string; createdAt?: any };
// type PaymentMethod = { id?: string; name: string; createdAt?: any };

// export default function MembershipsPage() {
//   const { user } = useAuth();
//   const router = useRouter();

//   const [memberships, setMemberships] = useState<Membership[]>([]);
//   const [loyaltyPoints, setLoyaltyPoints] = useState<LoyaltyPoint[]>([]);
//   const [bookingRestrictions, setBookingRestrictions] = useState<BookingRestriction[]>([]);
//   const [smsContents, setSmsContents] = useState<SmsContent[]>([]);
//   const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
//   const [loading, setLoading] = useState(true);

//   const [isModalOpen, setIsModalOpen] = useState(false);
//   const [editingId, setEditingId] = useState<string | null>(null);
//   const [modalType, setModalType] = useState<"membership" | "loyalty" | "restriction" | "sms" | "payment">("membership");
//   const [form, setForm] = useState<{ name: string; description: string; spending?: string; points?: string; number?: string }>({
//     name: "",
//     description: "",
//     spending: "",
//     points: "",
//     number: "",
//   });
//   const [saving, setSaving] = useState(false);

//   // -------- Fetch Data --------
//   useEffect(() => {
//     if (!db) return;

//     setLoading(true);
//     try {
//       const membershipsRef = collection(db, "memberships");
//       const loyaltyPointsRef = collection(db, "loyaltyPoints");
//       const bookingRestrictionsRef = collection(db, "bookingRestrictions");
//       const smsContentsRef = collection(db, "smsContents");
//       const paymentMethodsRef = collection(db, "paymentMethods");

//       const unsub1 = onSnapshot(query(membershipsRef, orderBy("createdAt", "asc")), (snap) =>
//         setMemberships(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })))
//       );
//       const unsub2 = onSnapshot(query(loyaltyPointsRef, orderBy("createdAt", "asc")), (snap) =>
//         setLoyaltyPoints(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })))
//       );
//       const unsub3 = onSnapshot(query(bookingRestrictionsRef, orderBy("createdAt", "asc")), (snap) =>
//         setBookingRestrictions(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })))
//       );
//       const unsub4 = onSnapshot(query(smsContentsRef, orderBy("createdAt", "asc")), (snap) =>
//         setSmsContents(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })))
//       );
//       const unsub5 = onSnapshot(query(paymentMethodsRef, orderBy("createdAt", "asc")), (snap) =>
//         setPaymentMethods(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })))
//       );

//       setLoading(false);
//       return () => {
//         unsub1();
//         unsub2();
//         unsub3();
//         unsub4();
//         unsub5();
//       };
//     } catch (err) {
//       console.error("subscribe error:", err);
//       setLoading(false);
//     }
//   }, []);

//   // -------- Modal Helpers --------
//   const openAddModal = (type: typeof modalType) => {
//     setForm({ name: "", description: "", spending: "", points: "", number: "" });
//     setEditingId(null);
//     setModalType(type);
//     setIsModalOpen(true);
//   };

//   const openEditModal = (item: any, type: typeof modalType) => {
//     setForm({
//       name: item.name || "",
//       description: item.description || "",
//       spending: type === "membership" ? item.spending?.toString() || "" : "",
//       points: type === "loyalty" ? item.points?.toString() || "" : "",
//       number: type === "restriction" ? item.number?.toString() || "" : "",
//     });
//     setEditingId(item.id || null);
//     setModalType(type);
//     setIsModalOpen(true);
//   };

//   const closeModal = () => {
//     setIsModalOpen(false);
//     setEditingId(null);
//     setForm({ name: "", description: "", spending: "", points: "", number: "" });
//     setSaving(false);
//   };

//   // -------- Save --------
//   const handleSave = async (e?: React.FormEvent) => {
//     e?.preventDefault();
//     if (modalType !== "restriction" && !form.name.trim()) {
//       alert("Please enter a name.");
//       return;
//     }

//     setSaving(true);
//     try {
//       const colMap = {
//         membership: "memberships",
//         loyalty: "loyaltyPoints",
//         restriction: "bookingRestrictions",
//         sms: "smsContents",
//         payment: "paymentMethods",
//       };
//       const data: any = {
//         name: form.name.trim(),
//         description: form.description.trim(),
//         createdAt: serverTimestamp(),
//       };

//       if (modalType === "membership") data.spending = Number(form.spending);
//       if (modalType === "loyalty") data.points = Number(form.points);
//       if (modalType === "restriction") {
//         delete data.name;
//         data.number = Number(form.number);
//       }

//       const col = colMap[modalType];
//       if (editingId) await updateDoc(doc(db, col, editingId), { ...data, updatedAt: serverTimestamp() });
//       else await addDoc(collection(db, col), data);
//       closeModal();
//     } catch (err) {
//       console.error("save error:", err);
//       alert("Error saving item. See console.");
//       setSaving(false);
//     }
//   };

//   // -------- Delete --------
//   const handleDelete = async (id?: string, type: typeof modalType = "membership") => {
//     if (!id) return;
//     if (!confirm("Are you sure you want to delete this item?")) return;
//     try {
//       const colMap = {
//         membership: "memberships",
//         loyalty: "loyaltyPoints",
//         restriction: "bookingRestrictions",
//         sms: "smsContents",
//         payment: "paymentMethods",
//       };
//       await deleteDoc(doc(db, colMap[type], id));
//     } catch (err) {
//       console.error("delete error:", err);
//       alert("Error deleting. See console.");
//     }
//   };

//   // -------- Render Section --------
//   const renderSection = (title: string, color: string, type: typeof modalType, items: any[], valueLabel?: string) => (
//     <div>
//       <div className="flex items-center justify-between mb-6">
//         <h2 className={`text-2xl font-semibold ${color}`}>{title}</h2>
//         <button
//           onClick={() => openAddModal(type)}
//           className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-white shadow-lg ${color.replace(
//             "text-",
//             "bg-"
//           )} hover:scale-[1.01] transition`}
//         >
//           <Plus className="w-4 h-4 text-black" />
//           <p className="text-black">Add</p>
//         </button>
//       </div>

//       {loading ? (
//         <div className="p-6 rounded-lg bg-white/80">Loading...</div>
//       ) : items.length === 0 ? (
//         <div className="p-6 rounded-lg bg-white/80 text-center">No items yet. Click “Add” to create one.</div>
//       ) : (
//         <div className="grid gap-4 md:grid-cols-3">
//           {items.map((item) => (
//             <div key={item.id} className="bg-white/90 dark:bg-gray-900 p-4 rounded-2xl border shadow">
//               <div className="flex items-start justify-between">
//                 <div>
//                   {item.name && <h3 className={`text-lg font-semibold ${color}`}>{item.name}</h3>}
//                   {item.number && <h3 className={`text-lg font-semibold ${color}`}>Limit: {item.number}</h3>}
//                   {item.description && <p className="text-sm text-gray-600 mt-1">{item.description}</p>}
//                   {valueLabel && item[valueLabel] !== undefined && (
//                     <p className={`text-sm font-medium ${color} mt-2`}>
//                       {valueLabel.charAt(0).toUpperCase() + valueLabel.slice(1)}: {item[valueLabel]}
//                     </p>
//                   )}
//                 </div>
//                 <div className="flex items-center gap-2">
//                   <button onClick={() => openEditModal(item, type)} className="p-1 hover:bg-gray-100 rounded-md">
//                     <Edit2 className="w-4 h-4" />
//                   </button>
//                   <button onClick={() => handleDelete(item.id, type)} className="p-1 hover:bg-red-50 rounded-md">
//                     <Trash2 className="w-4 h-4 text-red-600" />
//                   </button>
//                 </div>
//               </div>
//             </div>
//           ))}
//         </div>
//       )}
//     </div>
//   );

//   return (
//     <AccessWrapper>
//       <div className="p-6 max-w-5xl mx-auto space-y-10">
//         {renderSection("Memberships", "text-indigo-600", "membership", memberships, "spending")}
//         {renderSection("Loyalty Points", "text-emerald-600", "loyalty", loyaltyPoints, "points")}
//         {renderSection("Booking Restrictions", "text-rose-600", "restriction", bookingRestrictions, "number")}
//         {renderSection("SMS Content", "text-cyan-600", "sms", smsContents)}
//         {renderSection("Payment Methods", "text-amber-600", "payment", paymentMethods)}
//       </div>

//       {/* Modal */}
//       <AnimatePresence>
//         {isModalOpen && (
//           <motion.div
//             key="modal-overlay"
//             initial={{ opacity: 0 }}
//             animate={{ opacity: 1 }}
//             exit={{ opacity: 0 }}
//             className="fixed inset-0 z-50 flex items-center justify-center"
//           >
//             <motion.div
//               initial={{ opacity: 0 }}
//               animate={{ opacity: 1 }}
//               exit={{ opacity: 0 }}
//               className="absolute inset-0 bg-black/40 backdrop-blur-sm"
//               onClick={closeModal}
//             />

//             <motion.form
//               key="modal-panel"
//               initial={{ y: -20, opacity: 0, scale: 0.98 }}
//               animate={{ y: 0, opacity: 1, scale: 1 }}
//               exit={{ y: 10, opacity: 0, scale: 0.98 }}
//               transition={{ type: "spring", stiffness: 400, damping: 28 }}
//               onSubmit={handleSave}
//               className="relative z-50 w-full max-w-lg bg-white/95 dark:bg-gray-900/95 rounded-2xl p-6 shadow-xl border"
//             >
//               <div className="flex items-center justify-between mb-4">
//                 <h4 className="text-sm font-medium">
//                   {editingId ? `Edit ${modalType}` : `New ${modalType}`}
//                 </h4>
//                 <button type="button" onClick={closeModal} className="p-1 rounded-md hover:bg-gray-100">
//                   <X className="w-4 h-4" />
//                 </button>
//               </div>

//               <div className="space-y-3">
//                 {modalType !== "restriction" && modalType !== "payment" && (
//                   <>
//                     <label className="block text-xs text-gray-600 mb-1">Name</label>
//                     <input
//                       value={form.name}
//                       onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
//                       className="w-full px-3 py-2 rounded-lg border bg-white text-sm"
//                       placeholder="Enter name"
//                       required
//                     />
//                   </>
//                 )}
//                 {modalType === "payment" && (
//                   <>
//                     <label className="block text-xs text-gray-600 mb-1">Method Name</label>
//                     <input
//                       value={form.name}
//                       onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
//                       className="w-full px-3 py-2 rounded-lg border bg-white text-sm"
//                       placeholder="Enter payment method"
//                       required
//                     />
//                   </>
//                 )}
//                 {modalType !== "payment" && (
//                   <div>
//                     <label className="block text-xs text-gray-600 mb-1">Description</label>
//                     <textarea
//                       value={form.description}
//                       onChange={(e) => setForm((s) => ({ ...s, description: e.target.value }))}
//                       className="w-full px-3 py-2 rounded-lg border bg-white text-sm min-h-[80px]"
//                       placeholder="Short description"
//                     />
//                   </div>
//                 )}
//                 {modalType === "membership" && (
//                   <input
//                     type="number"
//                     placeholder="Spending"
//                     value={form.spending}
//                     onChange={(e) => setForm((s) => ({ ...s, spending: e.target.value }))}
//                     className="w-full px-3 py-2 rounded-lg border bg-white text-sm"
//                   />
//                 )}
//                 {modalType === "loyalty" && (
//                   <input
//                     type="number"
//                     placeholder="Points"
//                     value={form.points}
//                     onChange={(e) => setForm((s) => ({ ...s, points: e.target.value }))}
//                     className="w-full px-3 py-2 rounded-lg border bg-white text-sm"
//                   />
//                 )}
//                 {modalType === "restriction" && (
//                   <input
//                     type="number"
//                     placeholder="Restriction Limit"
//                     value={form.number}
//                     onChange={(e) => setForm((s) => ({ ...s, number: e.target.value }))}
//                     className="w-full px-3 py-2 rounded-lg border bg-white text-sm"
//                   />
//                 )}
//               </div>

//               <div className="mt-6 flex items-center justify-end gap-2">
//                 <button
//                   type="button"
//                   onClick={closeModal}
//                   className="px-4 py-2 text-sm rounded-lg border bg-gray-50 hover:bg-gray-100"
//                 >
//                   Cancel
//                 </button>
//                 <button
//                   type="submit"
//                   disabled={saving}
//                   className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white shadow hover:bg-indigo-700 disabled:opacity-50"
//                 >
//                   <Save className="w-4 h-4" />
//                   {saving ? "Saving..." : "Save"}
//                 </button>
//               </div>
//             </motion.form>
//           </motion.div>
//         )}
//       </AnimatePresence>
//     </AccessWrapper>
//   );
// }















"use client";

import React, { useEffect, useState } from "react";
import { Plus, Edit2, Trash2, Save, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";

import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import AccessWrapper from "@/components/AccessWrapper";

// -------- Types --------
type Membership = { id?: string; name: string; description: string; spending: number; createdAt?: any };
type LoyaltyPoint = { id?: string; name: string; description: string; points: number; createdAt?: any };
type BookingRestriction = { id?: string; number: number; description: string; createdAt?: any };
type SmsContent = { id?: string; name: string; description: string; createdAt?: any };
type PaymentMethod = { id?: string; name: string; createdAt?: any };
type CashbackProgram = { id?: string; spending: number; discount: number; createdAt?: any };

export default function MembershipsPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [loyaltyPoints, setLoyaltyPoints] = useState<LoyaltyPoint[]>([]);
  const [bookingRestrictions, setBookingRestrictions] = useState<BookingRestriction[]>([]);
  const [smsContents, setSmsContents] = useState<SmsContent[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [cashbackPrograms, setCashbackPrograms] = useState<CashbackProgram[]>([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [modalType, setModalType] = useState<
    "membership" | "loyalty" | "restriction" | "sms" | "payment" | "cashback"
  >("membership");
  const [form, setForm] = useState<{
    name: string;
    description: string;
    spending?: string;
    points?: string;
    number?: string;
    discount?: string;
  }>({
    name: "",
    description: "",
    spending: "",
    points: "",
    number: "",
    discount: "",
  });
  const [saving, setSaving] = useState(false);

  // -------- Fetch Data --------
  useEffect(() => {
    if (!db) return;

    setLoading(true);
    try {
      const membershipsRef = collection(db, "memberships");
      const loyaltyPointsRef = collection(db, "loyaltyPoints");
      const bookingRestrictionsRef = collection(db, "bookingRestrictions");
      const smsContentsRef = collection(db, "smsContents");
      const paymentMethodsRef = collection(db, "paymentMethods");
      const cashbackProgramsRef = collection(db, "cashbackPrograms");

      const unsub1 = onSnapshot(query(membershipsRef, orderBy("createdAt", "asc")), (snap) =>
        setMemberships(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })))
      );
      const unsub2 = onSnapshot(query(loyaltyPointsRef, orderBy("createdAt", "asc")), (snap) =>
        setLoyaltyPoints(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })))
      );
      const unsub3 = onSnapshot(query(bookingRestrictionsRef, orderBy("createdAt", "asc")), (snap) =>
        setBookingRestrictions(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })))
      );
      const unsub4 = onSnapshot(query(smsContentsRef, orderBy("createdAt", "asc")), (snap) =>
        setSmsContents(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })))
      );
      const unsub5 = onSnapshot(query(paymentMethodsRef, orderBy("createdAt", "asc")), (snap) =>
        setPaymentMethods(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })))
      );
      const unsub6 = onSnapshot(query(cashbackProgramsRef, orderBy("createdAt", "asc")), (snap) =>
        setCashbackPrograms(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })))
      );

      setLoading(false);
      return () => {
        unsub1();
        unsub2();
        unsub3();
        unsub4();
        unsub5();
        unsub6();
      };
    } catch (err) {
      console.error("subscribe error:", err);
      setLoading(false);
    }
  }, []);

  // -------- Modal Helpers --------
  const openAddModal = (type: typeof modalType) => {
    setForm({ name: "", description: "", spending: "", points: "", number: "", discount: "" });
    setEditingId(null);
    setModalType(type);
    setIsModalOpen(true);
  };

  const openEditModal = (item: any, type: typeof modalType) => {
    setForm({
      name: item.name || "",
      description: item.description || "",
      spending:
        type === "membership" || type === "cashback" ? item.spending?.toString() || "" : "",
      points: type === "loyalty" ? item.points?.toString() || "" : "",
      number: type === "restriction" ? item.number?.toString() || "" : "",
      discount: type === "cashback" ? item.discount?.toString() || "" : "",
    });
    setEditingId(item.id || null);
    setModalType(type);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setForm({ name: "", description: "", spending: "", points: "", number: "", discount: "" });
    setSaving(false);
  };

  // -------- Save --------
  const handleSave = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!db) return;

    setSaving(true);
    try {
      const colMap = {
        membership: "memberships",
        loyalty: "loyaltyPoints",
        restriction: "bookingRestrictions",
        sms: "smsContents",
        payment: "paymentMethods",
        cashback: "cashbackPrograms",
      };

      const data: any = {
        name: form.name.trim(),
        description: form.description.trim(),
        createdAt: serverTimestamp(),
      };

      if (modalType === "membership") data.spending = Number(form.spending);
      if (modalType === "loyalty") data.points = Number(form.points);
      if (modalType === "restriction") {
        delete data.name;
        data.number = Number(form.number);
      }
      if (modalType === "cashback") {
        delete data.name;
        delete data.description;
        data.spending = Number(form.spending);
        data.discount = Number(form.discount);
      }

      const col = colMap[modalType];
      if (editingId)
        await updateDoc(doc(db, col, editingId), { ...data, updatedAt: serverTimestamp() });
      else await addDoc(collection(db, col), data);
      closeModal();
    } catch (err) {
      console.error("save error:", err);
      alert("Error saving item. See console.");
      setSaving(false);
    }
  };

  // -------- Delete --------
  const handleDelete = async (id?: string, type: typeof modalType = "membership") => {
    if (!id) return;
    if (!confirm("Are you sure you want to delete this item?")) return;
    try {
      const colMap = {
        membership: "memberships",
        loyalty: "loyaltyPoints",
        restriction: "bookingRestrictions",
        sms: "smsContents",
        payment: "paymentMethods",
        cashback: "cashbackPrograms",
      };
      await deleteDoc(doc(db, colMap[type], id));
    } catch (err) {
      console.error("delete error:", err);
      alert("Error deleting. See console.");
    }
  };

  // -------- Render Section --------
  const renderSection = (
    title: string,
    color: string,
    type: typeof modalType,
    items: any[],
    valueLabel?: string
  ) => (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className={`text-2xl font-semibold ${color}`}>{title}</h2>
        <button
          onClick={() => openAddModal(type)}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-white shadow-lg ${color.replace(
            "text-",
            "bg-"
          )} hover:scale-[1.01] transition`}
        >
          <Plus className="w-4 h-4 text-black" />
          <p className="text-black">Add</p>
        </button>
      </div>

      {loading ? (
        <div className="p-6 rounded-lg bg-white/80">Loading...</div>
      ) : items.length === 0 ? (
        <div className="p-6 rounded-lg bg-white/80 text-center">
          No items yet. Click “Add” to create one.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
          {items.map((item) => (
            <div
              key={item.id}
              className="bg-white/90 dark:bg-gray-900 p-4 rounded-2xl border shadow"
            >
              <div className="flex items-start justify-between">
                <div>
                  {item.name && (
                    <h3 className={`text-lg font-semibold ${color}`}>{item.name}</h3>
                  )}
                  {item.number && (
                    <h3 className={`text-lg font-semibold ${color}`}>
                      Limit: {item.number}
                    </h3>
                  )}
                  {item.spending && (
                    <h3 className={`text-lg font-semibold ${color}`}>
                      Spend: {item.spending}
                    </h3>
                  )}
                  {item.discount && (
                    <p className="text-sm text-gray-700 mt-1">
                      Discount: {item.discount}%
                    </p>
                  )}
                  {item.description && (
                    <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                  )}
                  {valueLabel && item[valueLabel] !== undefined && (
                    <p className={`text-sm font-medium ${color} mt-2`}>
                      {valueLabel.charAt(0).toUpperCase() + valueLabel.slice(1)}:{" "}
                      {item[valueLabel]}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openEditModal(item, type)}
                    className="p-1 hover:bg-gray-100 rounded-md"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(item.id, type)}
                    className="p-1 hover:bg-red-50 rounded-md"
                  >
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <AccessWrapper>
      <div className="p-6 max-w-5xl mx-auto space-y-10">
        {renderSection("Memberships", "text-indigo-600", "membership", memberships, "spending")}
        {renderSection("Loyalty Points", "text-emerald-600", "loyalty", loyaltyPoints, "points")}
        {renderSection(
          "Booking Restrictions",
          "text-rose-600",
          "restriction",
          bookingRestrictions,
          "number"
        )}
        {renderSection("SMS Content (COMING SOON)", "text-cyan-600", "sms", smsContents)}
        {renderSection("Payment Methods", "text-amber-600", "payment", paymentMethods)}
        {renderSection("Cashback Programs (COMING SOON)", "text-pink-600", "cashback", cashbackPrograms)}
      </div>

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            key="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center"
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={closeModal}
            />

            <motion.form
              key="modal-panel"
              initial={{ y: -20, opacity: 0, scale: 0.98 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 10, opacity: 0, scale: 0.98 }}
              transition={{ type: "spring", stiffness: 400, damping: 28 }}
              onSubmit={handleSave}
              className="relative z-50 w-full max-w-lg bg-white/95 dark:bg-gray-900/95 rounded-2xl p-6 shadow-xl border"
            >
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-medium">
                  {editingId ? `Edit ${modalType}` : `New ${modalType}`}
                </h4>
                <button
                  type="button"
                  onClick={closeModal}
                  className="p-1 rounded-md hover:bg-gray-100"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3">
                {modalType === "cashback" ? (
                  <>
                    <label className="block text-xs text-gray-600 mb-1">Spending</label>
                    <input
                      type="number"
                      value={form.spending}
                      onChange={(e) =>
                        setForm((s) => ({ ...s, spending: e.target.value }))
                      }
                      className="w-full px-3 py-2 rounded-lg border bg-white text-sm"
                      placeholder="Enter spending amount"
                      required
                    />
                    <label className="block text-xs text-gray-600 mb-1 mt-2">
                      Discount (%)
                    </label>
                    <input
                      type="number"
                      value={form.discount}
                      onChange={(e) =>
                        setForm((s) => ({ ...s, discount: e.target.value }))
                      }
                      className="w-full px-3 py-2 rounded-lg border bg-white text-sm"
                      placeholder="Enter discount percentage"
                      required
                    />
                  </>
                ) : (
                  <>
                    {modalType !== "restriction" && modalType !== "payment" && (
                      <>
                        <label className="block text-xs text-gray-600 mb-1">Name</label>
                        <input
                          value={form.name}
                          onChange={(e) =>
                            setForm((s) => ({ ...s, name: e.target.value }))
                          }
                          className="w-full px-3 py-2 rounded-lg border bg-white text-sm"
                          placeholder="Enter name"
                          required
                        />
                      </>
                    )}
                    {modalType === "payment" && (
                      <>
                        <label className="block text-xs text-gray-600 mb-1">
                          Method Name
                        </label>
                        <input
                          value={form.name}
                          onChange={(e) =>
                            setForm((s) => ({ ...s, name: e.target.value }))
                          }
                          className="w-full px-3 py-2 rounded-lg border bg-white text-sm"
                          placeholder="Enter payment method"
                          required
                        />
                      </>
                    )}
                    {modalType !== "payment" && (
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">
                          Description
                        </label>
                        <textarea
                          value={form.description}
                          onChange={(e) =>
                            setForm((s) => ({ ...s, description: e.target.value }))
                          }
                          className="w-full px-3 py-2 rounded-lg border bg-white text-sm min-h-[80px]"
                          placeholder="Short description"
                        />
                      </div>
                    )}
                    {modalType === "membership" && (
                      <input
                        type="number"
                        placeholder="Spending"
                        value={form.spending}
                        onChange={(e) =>
                          setForm((s) => ({ ...s, spending: e.target.value }))
                        }
                        className="w-full px-3 py-2 rounded-lg border bg-white text-sm"
                      />
                    )}
                    {modalType === "loyalty" && (
                      <input
                        type="number"
                        placeholder="Points"
                        value={form.points}
                        onChange={(e) =>
                          setForm((s) => ({ ...s, points: e.target.value }))
                        }
                        className="w-full px-3 py-2 rounded-lg border bg-white text-sm"
                      />
                    )}
                    {modalType === "restriction" && (
                      <input
                        type="number"
                        placeholder="Restriction Limit"
                        value={form.number}
                        onChange={(e) =>
                          setForm((s) => ({ ...s, number: e.target.value }))
                        }
                        className="w-full px-3 py-2 rounded-lg border bg-white text-sm"
                      />
                    )}
                  </>
                )}
              </div>

              <div className="mt-6 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 text-sm rounded-lg border bg-gray-50 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 text-sm rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
                >
                  {saving ? "Saving..." : editingId ? "Update" : "Save"}
                </button>
              </div>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>
    </AccessWrapper>
  );
}
