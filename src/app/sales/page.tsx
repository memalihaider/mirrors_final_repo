// 'use client';

// import { useEffect, useMemo, useState } from 'react';
// import {
//   collection,
//   onSnapshot,
//   addDoc,
//   updateDoc,
//   deleteDoc,
//   doc,
//   query,
//   where,
//   serverTimestamp,
//   Timestamp,
// } from 'firebase/firestore';
// import { db } from '@/lib/firebase';
// import AccessWrapper from '@/components/AccessWrapper';
// import {
//   Users,
//   UserPlus,
//   Search,
//   Building2,
//   Phone,
//   Calendar as CalendarIcon,
//   Clock,
//   CheckCircle,
//   XCircle,
//   Edit3,
//   Trash2,
//   LogIn,
//   LogOut,
//   ListChecks,
// } from 'lucide-react';
// import {
//   format,
//   startOfDay,
//   endOfDay,
//   isSameDay,
//   parse,
// } from 'date-fns';

// /* ----------------------------- Types ----------------------------- */

// type AttendanceStatus = 'present' | 'absent';

// interface StaffDoc {
//   id: string;
//   name: string;
//   role?: string;
//   phone?: string;
//   branch?: string;
//   active: boolean;
//   createdAt?: Date;
//   updatedAt?: Date;
// }

// interface AttendanceDoc {
//   id: string;
//   staffId: string;
//   day: string; // 'yyyy-MM-dd'
//   status: AttendanceStatus;
//   checkIn?: string | null; // 'HH:mm'
//   checkOut?: string | null; // 'HH:mm'
//   notes?: string | null;
//   createdAt?: Date;
//   updatedAt?: Date;
// }

// interface BookingServiceLite {
//   serviceName: string;
// }

// interface BookingDocLite {
//   id: string;
//   customerName: string;
//   services: BookingServiceLite[];
//   bookingDate: Date; // Firestore Timestamp -> Date
//   bookingTime: string; // 'HH:mm'
//   branch?: string;
//   staffId?: string; // new schema
//   staff?: string | null; // legacy name
// }

// /* --------------------------- Constants --------------------------- */

// const BRANCH_OPTIONS = ['Al Bustan', 'Marina', 'TECOM', 'AL Muraqabat', 'IBN Batutta Mall'];

// /* --------------------------- Helpers ----------------------------- */

// function nowHHMM() {
//   const d = new Date();
//   const h = String(d.getHours()).padStart(2, '0');
//   const m = String(d.getMinutes()).padStart(2, '0');
//   return `${h}:${m}`;
// }

// function toDisplayAMPM(hhmm: string) {
//   if (!hhmm) return '';
//   const [hStr, m] = hhmm.split(':');
//   let h = Number(hStr);
//   const suffix = h >= 12 ? 'PM' : 'AM';
//   if (h === 0) h = 12;
//   if (h > 12) h = h - 12;
//   return `${h}:${m} ${suffix}`;
// }

// /* ========================= Component ========================= */

// export default function StaffManagementPage() {
//   /* ---------------------------- State ---------------------------- */
//   const [staff, setStaff] = useState<StaffDoc[]>([]);
//   const [search, setSearch] = useState('');
//   const [selectedDay, setSelectedDay] = useState<string>(() => format(new Date(), 'yyyy-MM-dd'));

//   // Attendance for selected day -> quick map by staffId
//   const [attendance, setAttendance] = useState<Record<string, AttendanceDoc>>({});

//   // Today tasks (bookings) grouped by staffId
//   const [bookingsToday, setBookingsToday] = useState<BookingDocLite[]>([]);

//   // Modal state (Create/Edit Staff)
//   const [openModal, setOpenModal] = useState(false);
//   const [editingStaffId, setEditingStaffId] = useState<string | null>(null);
//   const [formName, setFormName] = useState('');
//   const [formRole, setFormRole] = useState('');
//   const [formPhone, setFormPhone] = useState('');
//   const [formBranch, setFormBranch] = useState<string>('');
//   const [formActive, setFormActive] = useState(true);
//   const [saving, setSaving] = useState(false);
//   const [deleting, setDeleting] = useState(false);

//   /* -------------------- Realtime: Staff list -------------------- */
//   useEffect(() => {
//     const unsub = onSnapshot(collection(db, 'staff'), (snap) => {
//       const list: StaffDoc[] = snap.docs.map((d) => {
//         const data = d.data() as any;
//         return {
//           id: d.id,
//           name: data.name || '',
//           role: data.role || '',
//           phone: data.phone || '',
//           branch: data.branch || '',
//           active: data.active !== false,
//           createdAt: data.createdAt?.toDate?.() || undefined,
//           updatedAt: data.updatedAt?.toDate?.() || undefined,
//         } as StaffDoc;
//       });
//       // Sort by name asc for predictable UI
//       list.sort((a, b) => a.name.localeCompare(b.name));
//       setStaff(list);
//     });
//     return () => unsub();
//   }, []);

//   /* ------------- Realtime: Attendance for selected day ---------- */
//   useEffect(() => {
//     const day = selectedDay; // 'yyyy-MM-dd'
//     const q = query(collection(db, 'attendance'), where('day', '==', day));
//     const unsub = onSnapshot(q, (snap) => {
//       const map: Record<string, AttendanceDoc> = {};
//       snap.forEach((d) => {
//         const data = d.data() as any;
//         const a: AttendanceDoc = {
//           id: d.id,
//           staffId: String(data.staffId),
//           day: String(data.day),
//           status: (data.status as AttendanceStatus) || 'present',
//           checkIn: data.checkIn ?? null,
//           checkOut: data.checkOut ?? null,
//           notes: data.notes ?? null,
//           createdAt: data.createdAt?.toDate?.() || undefined,
//           updatedAt: data.updatedAt?.toDate?.() || undefined,
//         };
//         map[a.staffId] = a;
//       });
//       setAttendance(map);
//     });
//     return () => unsub();
//   }, [selectedDay]);

//   /* ------------- Realtime: Today's bookings (for tasks) ---------- */
//   useEffect(() => {
//     // Convert selectedDay to start/end
//     const start = startOfDay(new Date(selectedDay + 'T00:00:00'));
//     const end = endOfDay(new Date(selectedDay + 'T00:00:00'));
//     const qBookings = query(
//       collection(db, 'bookings'),
//       where('bookingDate', '>=', Timestamp.fromDate(start)),
//       where('bookingDate', '<=', Timestamp.fromDate(end))
//     );
//     const unsub = onSnapshot(qBookings, (snap) => {
//       const list: BookingDocLite[] = snap.docs.map((d) => {
//         const data = d.data() as any;
//         return {
//           id: d.id,
//           customerName: data.customerName || '',
//           services: (data.services || []).map((s: any) => ({ serviceName: s.serviceName || '' })),
//           bookingDate: data.bookingDate?.toDate?.() || new Date(),
//           bookingTime: data.bookingTime || '',
//           branch: data.branch || '',
//           staffId: data.staffId || undefined,
//           staff: data.staff ?? null, // legacy name support
//         } as BookingDocLite;
//       });
//       setBookingsToday(list);
//     });
//     return () => unsub();
//   }, [selectedDay]);

//   /* ----------------------------- Derived ----------------------------- */
//   const staffFiltered = useMemo(() => {
//     const q = search.trim().toLowerCase();
//     if (!q) return staff;
//     return staff.filter(
//       (s) =>
//         s.name.toLowerCase().includes(q) ||
//         (s.role || '').toLowerCase().includes(q) ||
//         (s.branch || '').toLowerCase().includes(q) ||
//         (s.phone || '').toLowerCase().includes(q)
//     );
//   }, [search, staff]);

//   const presentCount = useMemo(() => Object.values(attendance).filter((a) => a.status === 'present').length, [attendance]);
//   const absentCount = useMemo(() => Object.values(attendance).filter((a) => a.status === 'absent').length, [attendance]);

//   // Build maps for tasks: by staffId and also by legacy staff name (to support old bookings)
//   const staffIdByName = useMemo(() => {
//     const map: Record<string, string> = {};
//     staff.forEach((s) => {
//       map[(s.name || '').toLowerCase()] = s.id;
//     });
//     return map;
//   }, [staff]);

//   const tasksRows = useMemo(() => {
//     // Normalize each booking to a staffId
//     const rows = bookingsToday.map((b) => {
//       let sid = b.staffId;
//       if (!sid && b.staff) {
//         sid = staffIdByName[(b.staff || '').toLowerCase()];
//       }
//       return { ...b, _staffId: sid } as BookingDocLite & { _staffId?: string };
//     });
//     // Sort by time ascending
//     rows.sort((a, b) => (a.bookingTime || '').localeCompare(b.bookingTime || ''));
//     return rows;
//   }, [bookingsToday, staffIdByName]);

//   /* ------------------------- Staff CRUD ------------------------- */
//   const resetForm = () => {
//     setEditingStaffId(null);
//     setFormName('');
//     setFormRole('');
//     setFormPhone('');
//     setFormBranch('');
//     setFormActive(true);
//   };

//   const openCreate = () => {
//     resetForm();
//     setOpenModal(true);
//   };

//   const openEdit = (s: StaffDoc) => {
//     setEditingStaffId(s.id);
//     setFormName(s.name || '');
//     setFormRole(s.role || '');
//     setFormPhone(s.phone || '');
//     setFormBranch(s.branch || '');
//     setFormActive(s.active !== false);
//     setOpenModal(true);
//   };

//   const saveStaff = async () => {
//     if (!formName.trim()) {
//       alert('Name is required');
//       return;
//     }
//     try {
//       setSaving(true);
//       const payload = {
//         name: formName.trim(),
//         role: formRole.trim() || null,
//         phone: formPhone.trim() || null,
//         branch: formBranch || null,
//         active: !!formActive,
//         updatedAt: serverTimestamp(),
//       } as any;

//       if (editingStaffId) {
//         await updateDoc(doc(db, 'staff', editingStaffId), payload);
//       } else {
//         await addDoc(collection(db, 'staff'), { ...payload, createdAt: serverTimestamp() });
//       }
//       setOpenModal(false);
//       resetForm();
//     } catch (e) {
//       console.error('Error saving staff', e);
//       alert('Failed to save staff');
//     } finally {
//       setSaving(false);
//     }
//   };

//   const removeStaff = async (id: string) => {
//     if (!confirm('Delete this staff member?')) return;
//     try {
//       setDeleting(true);
//       await deleteDoc(doc(db, 'staff', id));
//     } catch (e) {
//       console.error('Error deleting staff', e);
//       alert('Failed to delete');
//     } finally {
//       setDeleting(false);
//     }
//   };

//   /* --------------------- Attendance Actions --------------------- */
//   const ensureAttendanceDoc = async (staffId: string): Promise<string> => {
//     const a = attendance[staffId];
//     if (a) return a.id;
//     const newDoc = await addDoc(collection(db, 'attendance'), {
//       staffId,
//       day: selectedDay,
//       status: 'present',
//       checkIn: null,
//       checkOut: null,
//       notes: null,
//       createdAt: serverTimestamp(),
//       updatedAt: serverTimestamp(),
//     });
//     return newDoc.id;
//   };

//   const markPresent = async (staffId: string) => {
//     const id = attendance[staffId]?.id || (await ensureAttendanceDoc(staffId));
//     await updateDoc(doc(db, 'attendance', id), { status: 'present', updatedAt: serverTimestamp() });
//   };

//   const markAbsent = async (staffId: string) => {
//     const id = attendance[staffId]?.id || (await ensureAttendanceDoc(staffId));
//     await updateDoc(doc(db, 'attendance', id), { status: 'absent', updatedAt: serverTimestamp() });
//   };

//   const setCheckIn = async (staffId: string) => {
//     const id = attendance[staffId]?.id || (await ensureAttendanceDoc(staffId));
//     await updateDoc(doc(db, 'attendance', id), { checkIn: nowHHMM(), updatedAt: serverTimestamp() });
//   };

//   const setCheckOut = async (staffId: string) => {
//     const id = attendance[staffId]?.id || (await ensureAttendanceDoc(staffId));
//     await updateDoc(doc(db, 'attendance', id), { checkOut: nowHHMM(), updatedAt: serverTimestamp() });
//   };

//   /* ------------------------------ Render ------------------------------ */
//   return (
//     <AccessWrapper>

//    <div className="p-6">
//       <div className="max-w-7xl mx-auto dark:text-white">
//         {/* Header */}
//         <div className="mb-8 flex items-start sm:items-center justify-between gap-4">
//           <div className="flex items-center gap-3">
//             <div className="p-2 rounded-xl bg-pink-100">
//               <Users className="w-6 h-6 text-pink-600" />
//             </div>
//             <div className='text-center justify-center'>
//               <h1 className="text-3xl font-bold text-gray-900 dark:text-white text-center justify-center">Staff Daily Task</h1>

//             </div>
//           </div>

//         </div>

//         {/* Controls */}
//         <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
//           <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//             <div className="relative">
//               <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
//               <input
//                 type="text"
//                 placeholder="Search staff by name, role, branch, phone..."
//                 value={search}
//                 onChange={(e) => setSearch(e.target.value)}
//                 className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
//               />
//             </div>
//             <div className="flex items-center">
//               <CalendarIcon className="w-5 h-5 text-gray-500 mr-2" />
//               <input
//                 type="date"
//                 value={selectedDay}
//                 onChange={(e) => setSelectedDay(e.target.value)}
//                 className="w-full border rounded-md px-3 py-2"
//                 title="Attendance day & Today’s tasks date"
//               />
//             </div>
//             {/* <div className="flex items-center">
//               <Building2 className="w-5 h-5 text-gray-500 mr-2" />
//               <select
//                 className="w-full border rounded-md px-3 py-2"
//                 value={''}
//                 onChange={() => {}}
//                 disabled
//                 title="Global branch filter can be added later"
//               >
//                 <option>All Branches</option>
//               </select>
//             </div> */}
//           </div>
//         </div>

//         {/* Stats */}
//          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
//           <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
//             <div className="flex items-center">
//               <div className="p-2 bg-blue-100 rounded-lg">
//                 <Users className="w-6 h-6 text-blue-600" />
//               </div>
//               <div className="ml-4">
//                 <p className="text-sm font-medium text-gray-600">Total Staff</p>
//                 <p className="text-2xl font-bold text-gray-900">{staff.length}</p>
//               </div>
//             </div>
//           </div>
//           <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
//             <div className="flex items-center">
//               <div className="p-2 bg-green-100 rounded-lg">
//                 <CheckCircle className="w-6 h-6 text-green-600" />
//               </div>
//               <div className="ml-4">
//                 <p className="text-sm font-medium text-gray-600">Present Today</p>
//                 <p className="text-2xl font-bold text-gray-900">{presentCount}</p>
//               </div>
//             </div>
//           </div>
//           <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
//             <div className="flex items-center">
//               <div className="p-2 bg-yellow-100 rounded-lg">
//                 <XCircle className="w-6 h-6 text-yellow-600" />
//               </div>
//               <div className="ml-4">
//                 <p className="text-sm font-medium text-gray-600">Absent Today</p>
//                 <p className="text-2xl font-bold text-gray-900">{absentCount}</p>
//               </div>
//             </div>
//           </div>
//           <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
//             <div className="flex items-center">
//               <div className="p-2 bg-purple-100 rounded-lg">
//                 <ListChecks className="w-6 h-6 text-purple-600" />
//               </div>
//               <div className="ml-4">
//                 <p className="text-sm font-medium text-gray-600">Tasks Today</p>
//                 <p className="text-2xl font-bold text-gray-900">{bookingsToday.length}</p>
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* Staff Table */}

//         {/* Today\'s Tasks */}
//         <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
//           <div className="px-6 py-4 border-b flex items-center justify-between">
//             <div>
//               <h2 className="text-lg font-semibold">Today\'s Tasks</h2>
//               <p className="text-sm text-gray-600">Auto-synced from bookings on {format(new Date(selectedDay + 'T00:00:00'), 'MMM dd, yyyy')}</p>
//             </div>
//           </div>

//           <div className="overflow-x-auto">
//             <table className="min-w-full divide-y divide-gray-200">
//               <thead className="bg-gray-50">
//                 <tr>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Staff</th>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Services</th>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Branch</th>
//                 </tr>
//               </thead>
//               <tbody className="bg-white divide-y divide-gray-200">
//                 {tasksRows.map((b) => {
//                   const s = b._staffId ? staff.find((x) => x.id === b._staffId) : staff.find((x) => (x.name || '').toLowerCase() === (b.staff || '').toLowerCase());
//                   return (
//                     <tr key={b.id}>
//                       <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-900">
//                         <div className="flex items-center">
//                           <Clock className="w-4 h-4 mr-2 text-gray-400" /> {toDisplayAMPM(b.bookingTime)}
//                         </div>
//                       </td>
//                       <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-900">{s?.name || b.staff || '—'}</td>
//                       <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-900">{b.customerName}</td>
//                       <td className="px-6 py-3 text-sm text-gray-900">
//                         {(b.services || []).map((sv, i) => (
//                           <span key={i} className="inline-block mr-1 mb-1 px-2 py-0.5 rounded-full bg-pink-50 text-pink-700 text-xs border border-pink-100">
//                             {sv.serviceName}
//                           </span>
//                         ))}
//                       </td>
//                       <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-900">{b.branch || '—'}</td>
//                     </tr>
//                   );
//                 })}
//               </tbody>
//             </table>
//           </div>

//           {tasksRows.length === 0 && (
//             <div className="text-center py-12">
//               <CalendarIcon className="mx-auto h-12 w-12 text-gray-400" />
//               <h3 className="mt-2 text-sm font-medium text-gray-900">No tasks for this day</h3>
//               <p className="mt-1 text-sm text-gray-500">Create a booking and assign a staff to see tasks here.</p>
//             </div>
//           )}
//         </div>

//         {/* ===================== CREATE / EDIT STAFF MODAL ===================== */}
//         {openModal && (
//           <div className="fixed inset-0 bg-gray-600/50 z-50 overflow-y-auto h-full w-full">
//             <div className="relative top-10 mx-auto w-11/12 md:w-4/5 lg:w-3/4 xl:w-2/3">
//               <div className="bg-white rounded-lg shadow-xl border">
//                 <div className="flex items-center justify-between px-6 py-4 border-b">
//                   <h3 className="text-lg font-semibold">{editingStaffId ? 'Edit Staff' : 'Add Staff'}</h3>
//                   <button
//                     onClick={() => {
//                       setOpenModal(false);
//                       resetForm();
//                     }}
//                     className="text-gray-400 hover:text-gray-600"
//                     title="Close"
//                   >
//                     <XCircle className="w-6 h-6" />
//                   </button>
//                 </div>

//                 <div className="p-6 space-y-6">
//                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                     <div>
//                       <label className="block text-sm font-medium text-gray-700">Name</label>
//                       <input
//                         className="mt-1 w-full border rounded-md px-3 py-2"
//                         value={formName}
//                         onChange={(e) => setFormName(e.target.value)}
//                         placeholder="e.g. Aimen"
//                       />
//                     </div>
//                     <div>
//                       <label className="block text-sm font-medium text-gray-700">Role</label>
//                       <input
//                         className="mt-1 w-full border rounded-md px-3 py-2"
//                         value={formRole}
//                         onChange={(e) => setFormRole(e.target.value)}
//                         placeholder="e.g. Hair Stylist"
//                       />
//                     </div>
//                     <div>
//                       <label className="block text-sm font-medium text-gray-700">Phone</label>
//                       <input
//                         className="mt-1 w-full border rounded-md px-3 py-2"
//                         value={formPhone}
//                         onChange={(e) => setFormPhone(e.target.value)}
//                         placeholder="e.g. 0300-1234567"
//                       />
//                     </div>
//                     <div>
//                       <label className="block text-sm font-medium text-gray-700">Branch</label>
//                       <select
//                         className="mt-1 w-full border rounded-md px-3 py-2"
//                         value={formBranch}
//                         onChange={(e) => setFormBranch(e.target.value)}
//                       >
//                         <option value="">Select One</option>
//                         {BRANCH_OPTIONS.map((b) => (
//                           <option key={b} value={b}>{b}</option>
//                         ))}
//                       </select>
//                     </div>
//                     <div className="flex items-center gap-2">
//                       <input id="active" type="checkbox" checked={formActive} onChange={(e) => setFormActive(e.target.checked)} />
//                       <label htmlFor="active" className="text-sm text-gray-700">Active</label>
//                     </div>
//                   </div>
//                 </div>

//                 <div className="px-6 py-4 border-t flex justify-end gap-3">
//                   <button
//                     onClick={() => {
//                       setOpenModal(false);
//                       resetForm();
//                     }}
//                     className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
//                     disabled={saving || deleting}
//                   >
//                     Close
//                   </button>
//                   {editingStaffId && (
//                     <button
//                       onClick={() => editingStaffId && removeStaff(editingStaffId)}
//                       className="px-4 py-2 text-sm font-medium text-white bg-rose-600 rounded-md hover:bg-rose-700 disabled:opacity-60"
//                       disabled={saving || deleting}
//                     >
//                       Delete
//                     </button>
//                   )}
//                   <button
//                     onClick={saveStaff}
//                     className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-md hover:bg-emerald-700 disabled:opacity-60"
//                     disabled={saving || deleting}
//                   >
//                     {saving ? (editingStaffId ? 'Updating...' : 'Saving...') : editingStaffId ? 'Update' : 'Save'}
//                   </button>
//                 </div>
//               </div>
//             </div>
//           </div>
//         )}
//         {/* ===================== END MODAL ===================== */}
//       </div>
//     </div>
//     </AccessWrapper>
//   );
// }

// sales report
// 'use client';

// import { useEffect, useMemo, useState } from 'react';
// import {
//   collection,
//   onSnapshot,
//   Timestamp,
// } from 'firebase/firestore';
// import { db } from '@/lib/firebase';
// import AccessWrapper from '@/components/AccessWrapper';
// import {
//   Search,
//   Building2,
//   Calendar as CalendarIcon,
//   Users,
//   ListChecks,
//   DollarSign,
// } from 'lucide-react';
// import { format, isWithinInterval } from 'date-fns';

// /* ----------------------------- Types ----------------------------- */

// interface BookingServiceLite {
//   serviceName: string;
//   price?: number;
// }

// interface BookingDocLite {
//   id: string;
//   customerName: string;
//   services: BookingServiceLite[];
//   bookingDate: Date; // Firestore Timestamp -> Date
//   bookingTime: string; // 'HH:mm'
//   branch?: string;
//   staffId?: string;
//   staff?: string | null; // legacy name
// }

// /* --------------------------- Constants --------------------------- */
// const BRANCH_OPTIONS = ['Al Bustan', 'Marina', 'TECOM', 'AL Muraqabat', 'IBN Batutta Mall'];

// /* ========================= Component ========================= */
// export default function SalesReportPage() {
//   /* ---------------------------- State ---------------------------- */
//   const [bookings, setBookings] = useState<BookingDocLite[]>([]);
//   const [search, setSearch] = useState('');
//   const [branchFilter, setBranchFilter] = useState('');
//   const [staffFilter, setStaffFilter] = useState('');
//   const [serviceFilter, setServiceFilter] = useState('');
//   const [startDate, setStartDate] = useState('');
//   const [endDate, setEndDate] = useState('');

//   /* -------------------- Realtime: Bookings list -------------------- */
//   useEffect(() => {
//     const unsub = onSnapshot(collection(db, 'bookings'), (snap) => {
//       const list: BookingDocLite[] = snap.docs.map((d) => {
//         const data = d.data() as any;
//         return {
//           id: d.id,
//           customerName: data.customerName || '',
//           services: (data.services || []).map((s: any) => ({
//             serviceName: s.serviceName || '',
//             price: s.price || 0,
//           })),
//           bookingDate: data.bookingDate?.toDate?.() || new Date(),
//           bookingTime: data.bookingTime || '',
//           branch: data.branch || '',
//           staffId: data.staffId || undefined,
//           staff: data.staff ?? null,
//         } as BookingDocLite;
//       });
//       setBookings(list);
//     });
//     return () => unsub();
//   }, []);

//   /* ----------------------------- Filtering ----------------------------- */
//   const filteredBookings = useMemo(() => {
//     return bookings.filter((b) => {
//       // Search
//       const q = search.trim().toLowerCase();
//       if (
//         q &&
//         !b.customerName.toLowerCase().includes(q) &&
//         !b.branch?.toLowerCase().includes(q) &&
//         !b.staff?.toLowerCase().includes(q) &&
//         !b.services.some((s) => s.serviceName.toLowerCase().includes(q))
//       ) {
//         return false;
//       }

//       // Branch filter
//       if (branchFilter && b.branch !== branchFilter) return false;

//       // Staff filter
//       if (staffFilter && (b.staff || '').toLowerCase() !== staffFilter.toLowerCase()) return false;

//       // Service filter
//       if (serviceFilter && !b.services.some((s) => s.serviceName === serviceFilter)) return false;

//       // Date range filter
//       if (startDate && endDate) {
//         const start = new Date(startDate + 'T00:00:00');
//         const end = new Date(endDate + 'T23:59:59');
//         if (!isWithinInterval(b.bookingDate, { start, end })) return false;
//       }

//       return true;
//     });
//   }, [bookings, search, branchFilter, staffFilter, serviceFilter, startDate, endDate]);

//   /* ----------------------------- Stats ----------------------------- */
//   const totalBookings = filteredBookings.length;
//   const totalRevenue = filteredBookings.reduce(
//     (sum, b) => sum + b.services.reduce((s, sv) => s + (sv.price || 0), 0),
//     0
//   );

//   /* ------------------------------ Render ------------------------------ */
//   return (
//     <AccessWrapper>
//       <div className="p-6">
//         <div className="max-w-7xl mx-auto dark:text-white">
//           {/* Header */}
//           <div className="mb-8 flex items-start sm:items-center justify-between gap-4">
//             <div className="flex items-center gap-3">
//               <div className="p-2 rounded-xl bg-pink-100">
//                 <DollarSign className="w-6 h-6 text-pink-600" />
//               </div>
//               <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
//                 Sales Report
//               </h1>
//             </div>
//           </div>

//           {/* Controls */}
//           <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
//             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//               <div className="relative">
//                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
//                 <input
//                   type="text"
//                   placeholder="Search by customer, staff, service..."
//                   value={search}
//                   onChange={(e) => setSearch(e.target.value)}
//                   className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
//                 />
//               </div>

//               <div className="flex items-center gap-2">
//                 <CalendarIcon className="w-5 h-5 text-gray-500" />
//                 <input
//                   type="date"
//                   value={startDate}
//                   onChange={(e) => setStartDate(e.target.value)}
//                   className="border rounded-md px-3 py-2 w-full"
//                 />
//                 <span>to</span>
//                 <input
//                   type="date"
//                   value={endDate}
//                   onChange={(e) => setEndDate(e.target.value)}
//                   className="border rounded-md px-3 py-2 w-full"
//                 />
//               </div>

//               <select
//                 className="w-full border rounded-md px-3 py-2"
//                 value={branchFilter}
//                 onChange={(e) => setBranchFilter(e.target.value)}
//               >
//                 <option value="">All Branches</option>
//                 {BRANCH_OPTIONS.map((b) => (
//                   <option key={b} value={b}>
//                     {b}
//                   </option>
//                 ))}
//               </select>
//             </div>

//             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
//               <input
//                 type="text"
//                 placeholder="Filter by staff name..."
//                 value={staffFilter}
//                 onChange={(e) => setStaffFilter(e.target.value)}
//                 className="w-full border rounded-md px-3 py-2"
//               />
//               <input
//                 type="text"
//                 placeholder="Filter by service..."
//                 value={serviceFilter}
//                 onChange={(e) => setServiceFilter(e.target.value)}
//                 className="w-full border rounded-md px-3 py-2"
//               />
//             </div>
//           </div>

//           {/* Stats */}
//           <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
//             <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 flex items-center">
//               <div className="p-2 bg-blue-100 rounded-lg">
//                 <ListChecks className="w-6 h-6 text-blue-600" />
//               </div>
//               <div className="ml-4">
//                 <p className="text-sm font-medium text-gray-600">Total Bookings</p>
//                 <p className="text-2xl font-bold text-gray-900">{totalBookings}</p>
//               </div>
//             </div>

//             <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 flex items-center">
//               <div className="p-2 bg-green-100 rounded-lg">
//                 <DollarSign className="w-6 h-6 text-green-600" />
//               </div>
//               <div className="ml-4">
//                 <p className="text-sm font-medium text-gray-600">Total Revenue</p>
//                 <p className="text-2xl font-bold text-gray-900">
//                   AED {totalRevenue.toLocaleString()}
//                 </p>
//               </div>
//             </div>

//             <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 flex items-center">
//               <div className="p-2 bg-purple-100 rounded-lg">
//                 <Users className="w-6 h-6 text-purple-600" />
//               </div>
//               <div className="ml-4">
//                 <p className="text-sm font-medium text-gray-600">Unique Customers</p>
//                 <p className="text-2xl font-bold text-gray-900">
//                   {new Set(filteredBookings.map((b) => b.customerName)).size}
//                 </p>
//               </div>
//             </div>
//           </div>

//           {/* Table */}
//           <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
//             <div className="px-6 py-4 border-b">
//               <h2 className="text-lg font-semibold">Filtered Bookings</h2>
//               <p className="text-sm text-gray-600">
//                 Showing {filteredBookings.length} bookings
//               </p>
//             </div>

//             <div className="overflow-x-auto">
//               <table className="min-w-full divide-y divide-gray-200">
//                 <thead className="bg-gray-50">
//                   <tr>
//                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                       Date
//                     </th>
//                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                       Time
//                     </th>
//                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                       Customer
//                     </th>
//                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                       Staff
//                     </th>
//                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                       Services
//                     </th>
//                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                       Branch
//                     </th>
//                   </tr>
//                 </thead>
//                 <tbody className="bg-white divide-y divide-gray-200">
//                   {filteredBookings.map((b) => (
//                     <tr key={b.id}>
//                       <td className="px-6 py-3 text-sm text-gray-900">
//                         {format(b.bookingDate, 'MMM dd, yyyy')}
//                       </td>
//                       <td className="px-6 py-3 text-sm text-gray-900">{b.bookingTime}</td>
//                       <td className="px-6 py-3 text-sm text-gray-900">{b.customerName}</td>
//                       <td className="px-6 py-3 text-sm text-gray-900">{b.staff || '—'}</td>
//                       <td className="px-6 py-3 text-sm text-gray-900">
//                         {(b.services || []).map((sv, i) => (
//                           <span
//                             key={i}
//                             className="inline-block mr-1 mb-1 px-2 py-0.5 rounded-full bg-pink-50 text-pink-700 text-xs border border-pink-100"
//                           >
//                             {sv.serviceName}
//                           </span>
//                         ))}
//                       </td>
//                       <td className="px-6 py-3 text-sm text-gray-900">{b.branch || '—'}</td>
//                     </tr>
//                   ))}
//                 </tbody>
//               </table>
//             </div>

//             {filteredBookings.length === 0 && (
//               <div className="text-center py-12">
//                 <CalendarIcon className="mx-auto h-12 w-12 text-gray-400" />
//                 <h3 className="mt-2 text-sm font-medium text-gray-900">
//                   No bookings match filters
//                 </h3>
//               </div>
//             )}
//           </div>
//         </div>
//       </div>
//     </AccessWrapper>
//   );
// }

// newly code again
// "use client";

// import { useEffect, useMemo, useState } from "react";
// import { collection, onSnapshot } from "firebase/firestore";
// import { db } from "@/lib/firebase";
// import AccessWrapper from "@/components/AccessWrapper";
// import { Search, DollarSign, Calendar as CalendarIcon } from "lucide-react";
// import { format, isWithinInterval } from "date-fns";

// /* ----------------------------- Types ----------------------------- */
// interface BookingServiceLite {
//   serviceName: string;
//   category?: string;
//   price?: number;
//   discountAmount?: number;
//   tipAmount?: number;
// }

// interface BookingDocLite {
//   id: string;
//   customerName: string;
//   services: BookingServiceLite[];
//   bookingDate: Date;
//   bookingTime: string;
//   branch?: string;
//   staff?: string | null;
//   status?: string;
//   paymentMethod?: string;
//   cardAuthCode?: string;
// }

// /* --------------------------- Constants --------------------------- */
// const BRANCH_OPTIONS = [
//   "Al Bustan",
//   "Marina",
//   "TECOM",
//   "AL Muraqabat",
//   "IBN Batutta Mall",
// ];
// const STATUS_OPTIONS = ["Pending", "Confirmed", "Completed", "Rejected"];
// const PAYMENT_OPTIONS = ["Cash", "Card", "Online"];

// /* ========================= Component ========================= */
// export default function SalesReportPage() {
//   /* ---------------------------- State ---------------------------- */
//   const [bookings, setBookings] = useState<BookingDocLite[]>([]);

//   // Dropdown options from Firebase
//   const [staffOptions, setStaffOptions] = useState<string[]>([]);
//   const [serviceOptions, setServiceOptions] = useState<string[]>([]);
//   const [categoryOptions, setCategoryOptions] = useState<string[]>([]);

//   // Filters
//   const [search, setSearch] = useState("");
//   const [branchFilter, setBranchFilter] = useState("");
//   const [staffFilter, setStaffFilter] = useState("");
//   const [serviceFilter, setServiceFilter] = useState("");
//   const [categoryFilter, setCategoryFilter] = useState("");
//   const [paymentFilter, setPaymentFilter] = useState("");
//   const [statusFilter, setStatusFilter] = useState("");
//   const [startDate, setStartDate] = useState("");
//   const [endDate, setEndDate] = useState("");
//   const [perPage, setPerPage] = useState(10);
//   const [page, setPage] = useState(1);

//   /* -------------------- Realtime: Bookings list -------------------- */
//   useEffect(() => {
//     const unsub = onSnapshot(collection(db, "bookings"), (snap) => {
//       const list: BookingDocLite[] = snap.docs.map((d) => {
//         const data = d.data() as any;
//         return {
//           id: d.id,
//           customerName: data.customerName || "",
//           services: (data.services || []).map((s: any) => ({
//             serviceName: s.serviceName || "",
//             category: s.category || "",
//             price: Number(s.price) || 0,
//             discountAmount: Number(s.discountAmount) || 0,
//             tipAmount: Number(s.tipAmount) || 0,
//           })),
//           bookingDate: data.bookingDate?.toDate?.() || new Date(),
//           bookingTime: data.bookingTime || "",
//           branch: data.branch || "",
//           staff: data.staff ?? null,
//           status: data.status || "Pending",
//           paymentMethod: data.paymentMethod || "",
//           cardAuthCode: data.cardAuthCode || "",
//         } as BookingDocLite;
//       });
//       setBookings(list);
//     });
//     return () => unsub();
//   }, []);

//   /* -------------------- Realtime: Staff -------------------- */
//   useEffect(() => {
//     const unsub = onSnapshot(collection(db, "staff"), (snap) => {
//       setStaffOptions(snap.docs.map((d) => d.data().name));
//     });
//     return () => unsub();
//   }, []);

//   /* -------------------- Realtime: Services -------------------- */
//   useEffect(() => {
//     const unsub = onSnapshot(collection(db, "services"), (snap) => {
//       setServiceOptions(snap.docs.map((d) => d.data().name));
//     });
//     return () => unsub();
//   }, []);

//   /* -------------------- Realtime: Categories -------------------- */
//   useEffect(() => {
//     const unsub = onSnapshot(collection(db, "categories"), (snap) => {
//       setCategoryOptions(snap.docs.map((d) => d.data().name));
//     });
//     return () => unsub();
//   }, []);

//   /* ----------------------------- Filtering ----------------------------- */
//   const filteredBookings = useMemo(() => {
//     return bookings.filter((b) => {
//       const q = search.trim().toLowerCase();
//       if (
//         q &&
//         !b.customerName.toLowerCase().includes(q) &&
//         !b.branch?.toLowerCase().includes(q) &&
//         !b.staff?.toLowerCase().includes(q) &&
//         !b.services.some((s) => s.serviceName.toLowerCase().includes(q))
//       ) {
//         return false;
//       }

//       if (branchFilter && b.branch !== branchFilter) return false;
//       if (
//         staffFilter &&
//         (b.staff || "").toLowerCase() !== staffFilter.toLowerCase()
//       )
//         return false;
//       if (
//         serviceFilter &&
//         !b.services.some((s) => s.serviceName === serviceFilter)
//       )
//         return false;
//       if (
//         categoryFilter &&
//         !b.services.some((s) => s.category === categoryFilter)
//       )
//         return false;
//       if (paymentFilter && b.paymentMethod !== paymentFilter) return false;
//       if (statusFilter && b.status !== statusFilter) return false;

//       if (startDate && endDate) {
//         const start = new Date(startDate + "T00:00:00");
//         const end = new Date(endDate + "T23:59:59");
//         if (!isWithinInterval(b.bookingDate, { start, end })) return false;
//       }

//       return true;
//     });
//   }, [
//     bookings,
//     search,
//     branchFilter,
//     staffFilter,
//     serviceFilter,
//     categoryFilter,
//     paymentFilter,
//     statusFilter,
//     startDate,
//     endDate,
//   ]);

//   /* ----------------------------- Pagination ----------------------------- */
//   const totalPages = Math.ceil(filteredBookings.length / perPage);
//   const paginatedBookings = filteredBookings.slice(
//     (page - 1) * perPage,
//     page * perPage
//   );

//   /* ----------------------------- Stats ----------------------------- */
//   const totalRevenue = filteredBookings.reduce((sum, b) => {
//     const serviceFees = b.services.reduce((s, sv) => s + (sv.price || 0), 0);
//     const discount = b.services.reduce(
//       (s, sv) => s + (sv.discountAmount || 0),
//       0
//     );
//     const tip = b.services.reduce((s, sv) => s + (sv.tipAmount || 0), 0);
//     return sum + (serviceFees - discount + tip);
//   }, 0);

//   const selectedPaymentTotal = filteredBookings.reduce((sum, b) => {
//     const paid = b.paymentMethod
//       ? b.services.reduce((s, sv) => s + (sv.price || 0), 0)
//       : 0;
//     return sum + paid;
//   }, 0);

//   /* ------------------------------ Render ------------------------------ */
//   return (
//     <AccessWrapper>
//       <div className="p-6">
//         <div className="max-w-7xl mx-auto dark:text-white">
//           {/* Header */}
//           <div className="mb-8 flex items-center gap-3">
//             <div className="p-2 rounded-xl bg-pink-100">
//               <DollarSign className="w-6 h-6 text-pink-600" />
//             </div>
//             <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
//               Sales Report
//             </h1>
//           </div>
//           {/* Filters */}
//           <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
//             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//               <div className="relative">
//                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
//                 <input
//                   type="text"
//                   placeholder="Search..."
//                   value={search}
//                   onChange={(e) => setSearch(e.target.value)}
//                   className="w-full pl-10 pr-4 py-2 border rounded-lg"
//                 />
//               </div>

//               <div className="flex items-center gap-2">
//                 <CalendarIcon className="w-5 h-5 text-gray-500" />
//                 <input
//                   type="date"
//                   value={startDate}
//                   onChange={(e) => setStartDate(e.target.value)}
//                   className="border rounded-md px-3 py-2 w-full"
//                 />
//                 <span>to</span>
//                 <input
//                   type="date"
//                   value={endDate}
//                   onChange={(e) => setEndDate(e.target.value)}
//                   className="border rounded-md px-3 py-2 w-full"
//                 />
//               </div>

//               <select
//                 className="w-full border rounded-md px-3 py-2"
//                 value={branchFilter}
//                 onChange={(e) => setBranchFilter(e.target.value)}
//               >
//                 <option value="">All Branches</option>
//                 {BRANCH_OPTIONS.map((b) => (
//                   <option key={b}>{b}</option>
//                 ))}
//               </select>
//             </div>

//             <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
//               {/* Staff Dropdown */}
//               <select
//                 className="w-full border rounded-md px-3 py-2"
//                 value={staffFilter}
//                 onChange={(e) => setStaffFilter(e.target.value)}
//               >
//                 <option value="">All Staff</option>
//                 {staffOptions.map((s) => (
//                   <option key={s}>{s}</option>
//                 ))}
//               </select>

//               {/* Services Dropdown */}
//               <select
//                 className="w-full border rounded-md px-3 py-2"
//                 value={serviceFilter}
//                 onChange={(e) => setServiceFilter(e.target.value)}
//               >
//                 <option value="">All Services</option>
//                 {serviceOptions.map((s) => (
//                   <option key={s}>{s}</option>
//                 ))}
//               </select>

//               {/* Categories Dropdown */}
//               <select
//                 className="w-full border rounded-md px-3 py-2"
//                 value={categoryFilter}
//                 onChange={(e) => setCategoryFilter(e.target.value)}
//               >
//                 <option value="">All Categories</option>
//                 {categoryOptions.map((c) => (
//                   <option key={c}>{c}</option>
//                 ))}
//               </select>

//               <select
//                 className="w-full border rounded-md px-3 py-2"
//                 value={paymentFilter}
//                 onChange={(e) => setPaymentFilter(e.target.value)}
//               >
//                 <option value="">All Payments</option>
//                 {PAYMENT_OPTIONS.map((p) => (
//                   <option key={p}>{p}</option>
//                 ))}
//               </select>

//               <select
//                 className="w-full border rounded-md px-3 py-2"
//                 value={statusFilter}
//                 onChange={(e) => setStatusFilter(e.target.value)}
//               >
//                 <option value="">All Status</option>
//                 {STATUS_OPTIONS.map((s) => (
//                   <option key={s}>{s}</option>
//                 ))}
//               </select>

//               <select
//                 className="w-full border rounded-md px-3 py-2"
//                 value={perPage}
//                 onChange={(e) => {
//                   setPerPage(Number(e.target.value));
//                   setPage(1);
//                 }}
//               >
//                 {[10, 20, 50].map((n) => (
//                   <option key={n} value={n}>
//                     {n} per page
//                   </option>
//                 ))}
//               </select>
//             </div>
//           </div>
//           {/* Stats */}{" "}
//           <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
//             {" "}
//             <div className="bg-white rounded-lg shadow p-6">
//               {" "}
//               <p className="text-sm text-gray-600">Total Bookings</p>{" "}
//               <p className="text-2xl font-bold">{filteredBookings.length}</p>{" "}
//             </div>{" "}
//             <div className="bg-white rounded-lg shadow p-6">
//               {" "}
//               <p className="text-sm text-gray-600">Total Revenue</p>{" "}
//               <p className="text-2xl font-bold">
//                 AED {totalRevenue.toLocaleString()}
//               </p>{" "}
//             </div>{" "}
//             <div className="bg-white rounded-lg shadow p-6">
//               {" "}
//               <p className="text-sm text-gray-600">
//                 Selected Payment Total
//               </p>{" "}
//               <p className="text-2xl font-bold">
//                 AED {selectedPaymentTotal.toLocaleString()}
//               </p>{" "}
//             </div>{" "}
//           </div>{" "}
//           {/* Table */}{" "}
//           <div className="bg-white rounded-lg shadow overflow-hidden">
//             {" "}
//             <div className="overflow-x-auto">
//               {" "}
//               <table className="min-w-full text-sm">
//                 {" "}
//                 <thead className="bg-gray-100 text-gray-600 text-xs uppercase sticky top-0">
//                   {" "}
//                   <tr>
//                     {" "}
//                     {[
//                       "Booking ID",
//                       "Date",
//                       "Time",
//                       "Customer",
//                       "Staff",
//                       "Branch",
//                       "Services",
//                       "Category",
//                       "Payment",
//                       "Card/Auth",
//                       "Status",
//                       "Service Fees",
//                       "Discount",
//                       "Tip",
//                       "Total",
//                       "Adjusted",
//                       "Payable",
//                       "Paid",
//                       "Due",
//                     ].map((h) => (
//                       <th key={h} className="px-4 py-2 text-left">
//                         {h}
//                       </th>
//                     ))}{" "}
//                   </tr>{" "}
//                 </thead>{" "}
//                 <tbody className="divide-y divide-gray-200">
//                   {" "}
//                   {paginatedBookings.map((b) => {
//                     const serviceFees = b.services.reduce(
//                       (s, sv) => s + (sv.price || 0),
//                       0
//                     );
//                     const discount = b.services.reduce(
//                       (s, sv) => s + (sv.discountAmount || 0),
//                       0
//                     );
//                     const tip = b.services.reduce(
//                       (s, sv) => s + (sv.tipAmount || 0),
//                       0
//                     );
//                     const total = serviceFees - discount + tip;
//                     const adjusted = 0;
//                     const payable = total - discount;
//                     const paid = b.paymentMethod ? total : 0;
//                     const due = payable - paid;
//                     return (
//                       <tr key={b.id} className="hover:bg-gray-50">
//                         {" "}
//                         <td className="px-4 py-2">{b.id}</td>{" "}
//                         <td className="px-4 py-2">
//                           {format(b.bookingDate, "MMM dd, yyyy")}
//                         </td>{" "}
//                         <td className="px-4 py-2">{b.bookingTime}</td>{" "}
//                         <td className="px-4 py-2">{b.customerName}</td>{" "}
//                         <td className="px-4 py-2">{b.staff || "—"}</td>{" "}
//                         <td className="px-4 py-2">{b.branch || "—"}</td>{" "}
//                         <td className="px-4 py-2">
//                           {b.services.map((s) => s.serviceName).join(", ")}
//                         </td>{" "}
//                         <td className="px-4 py-2">
//                           {b.services.map((s) => s.category).join(", ")}
//                         </td>{" "}
//                         <td className="px-4 py-2">{b.paymentMethod || "—"}</td>{" "}
//                         <td className="px-4 py-2">{b.cardAuthCode || "—"}</td>{" "}
//                         <td className="px-4 py-2">{b.status}</td>{" "}
//                         <td className="px-4 py-2">AED {serviceFees}</td>{" "}
//                         <td className="px-4 py-2">AED {discount}</td>{" "}
//                         <td className="px-4 py-2">AED {tip}</td>{" "}
//                         <td className="px-4 py-2">AED {total}</td>{" "}
//                         <td className="px-4 py-2">AED {adjusted}</td>{" "}
//                         <td className="px-4 py-2">AED {payable}</td>{" "}
//                         <td className="px-4 py-2">AED {paid}</td>{" "}
//                         <td className="px-4 py-2">AED {due}</td>{" "}
//                       </tr>
//                     );
//                   })}{" "}
//                 </tbody>{" "}
//               </table>{" "}
//             </div>{" "}
//             {/* Pagination */}{" "}
//             <div className="flex justify-between items-center p-4 border-t">
//               {" "}
//               <p className="text-sm text-gray-600">
//                 {" "}
//                 Showing {(page - 1) * perPage + 1}–{" "}
//                 {Math.min(page * perPage, filteredBookings.length)} of{" "}
//                 {filteredBookings.length}{" "}
//               </p>{" "}
//               <div className="flex gap-2">
//                 {" "}
//                 <button
//                   disabled={page === 1}
//                   onClick={() => setPage((p) => p - 1)}
//                   className="px-3 py-1 border rounded disabled:opacity-50"
//                 >
//                   Prev
//                 </button>{" "}
//                 <button
//                   disabled={page === totalPages}
//                   onClick={() => setPage((p) => p + 1)}
//                   className="px-3 py-1 border rounded disabled:opacity-50"
//                 >
//                   Next
//                 </button>{" "}
//               </div>{" "}
//             </div>{" "}
//           </div>{" "}
//         </div>{" "}
//       </div>
//     </AccessWrapper>
//   );
// }

'use client';

import { useEffect, useMemo, useState } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import AccessWrapper from '@/components/AccessWrapper';
import { Search, DollarSign, Calendar as CalendarIcon, TrendingUp, BarChart3, Filter, Users, CreditCard, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, isWithinInterval } from 'date-fns';

/* ----------------------------- Types ----------------------------- */
interface BookingServiceLite {
  serviceName: string;
  category?: string;
  price?: number;
  discountAmount?: number;
  tipAmount?: number;
}

interface BookingDocLite {
  id: string;
  customerName: string;
  services: BookingServiceLite[];
  bookingDate: Date;
  bookingTime: string;
  branch?: string;
  staff?: string | null;
  status?: string;
  paymentMethod?: string;
  cardAuthCode?: string;
}

/* --------------------------- Constants --------------------------- */
const BRANCH_OPTIONS = [
  'Al Bustan',
  'Marina',
  'TECOM',
  'AL Muraqabat',
  'IBN Batutta Mall',
];
const STATUS_OPTIONS = ['Pending', 'Confirmed', 'Completed', 'Rejected'];
const PAYMENT_OPTIONS = ['Cash', 'Card', 'Online'];

/* ========================= Component ========================= */
export default function SalesReportPage() {
  /* ---------------------------- State ---------------------------- */
  const [bookings, setBookings] = useState<BookingDocLite[]>([]);

  // Dropdown options from Firebase
  const [staffOptions, setStaffOptions] = useState<string[]>([]);
  const [serviceOptions, setServiceOptions] = useState<string[]>([]);
  const [categoryOptions, setCategoryOptions] = useState<string[]>([]);

  // Filters
  const [search, setSearch] = useState('');
  const [branchFilter, setBranchFilter] = useState('');
  const [staffFilter, setStaffFilter] = useState('');
  const [serviceFilter, setServiceFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [perPage, setPerPage] = useState(10);
  const [page, setPage] = useState(1);

  /* -------------------- Realtime: Bookings -------------------- */
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'bookings'), (snap) => {
      const list: BookingDocLite[] = snap.docs.map((d) => {
        const data = d.data() as any;
        return {
          id: d.id,
          customerName: data.customerName || '',
          services: (data.services || []).map((s: any) => ({
            serviceName: s.serviceName || '',
            category: s.category || '',
            price: Number(s.price) || 0,
            discountAmount: Number(s.discountAmount) || 0,
            tipAmount: Number(s.tipAmount) || 0,
          })),
          bookingDate: data.bookingDate?.toDate?.() || new Date(),
          bookingTime: data.bookingTime || '',
          branch: data.branch || '',
          staff: data.staff ?? null,
          status: data.status || 'Pending',
          paymentMethod: data.paymentMethod || '',
          cardAuthCode: data.cardAuthCode || '',
        } as BookingDocLite;
      });
      setBookings(list);
    });
    return () => unsub();
  }, []);

  /* -------------------- Realtime: Staff -------------------- */
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'staff'), (snap) => {
      setStaffOptions(snap.docs.map((d) => d.data().name));
    });
    return () => unsub();
  }, []);

  /* -------------------- Realtime: Services -------------------- */
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'services'), (snap) => {
      setServiceOptions(snap.docs.map((d) => d.data().name));
    });
    return () => unsub();
  }, []);

  /* -------------------- Realtime: Categories -------------------- */
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'categories'), (snap) => {
      setCategoryOptions(snap.docs.map((d) => d.data().name));
    });
    return () => unsub();
  }, []);

  /* ----------------------------- Filtering ----------------------------- */
  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      const q = search.trim().toLowerCase();
      if (
        q &&
        !b.customerName.toLowerCase().includes(q) &&
        !b.branch?.toLowerCase().includes(q) &&
        !b.staff?.toLowerCase().includes(q) &&
        !b.services.some((s) => s.serviceName.toLowerCase().includes(q))
      ) {
        return false;
      }

      if (branchFilter && b.branch !== branchFilter) return false;
      if (staffFilter && (b.staff || '').toLowerCase() !== staffFilter.toLowerCase()) return false;
      if (serviceFilter && !b.services.some((s) => s.serviceName === serviceFilter)) return false;
      if (categoryFilter && !b.services.some((s) => s.category === categoryFilter)) return false;
      if (paymentFilter && b.paymentMethod !== paymentFilter) return false;
      if (statusFilter && b.status !== statusFilter) return false;

      if (startDate && endDate) {
        const start = new Date(startDate + 'T00:00:00');
        const end = new Date(endDate + 'T23:59:59');
        if (!isWithinInterval(b.bookingDate, { start, end })) return false;
      }

      return true;
    });
  }, [bookings, search, branchFilter, staffFilter, serviceFilter, categoryFilter, paymentFilter, statusFilter, startDate, endDate]);

  /* ----------------------------- Pagination ----------------------------- */
  const totalPages = Math.ceil(filteredBookings.length / perPage);
  const paginatedBookings = filteredBookings.slice((page - 1) * perPage, page * perPage);

  /* ----------------------------- Stats ----------------------------- */
  const totalRevenue = filteredBookings.reduce((sum, b) => {
    const serviceFees = b.services.reduce((s, sv) => s + (sv.price || 0), 0);
    const discount = b.services.reduce((s, sv) => s + (sv.discountAmount || 0), 0);
    const tip = b.services.reduce((s, sv) => s + (sv.tipAmount || 0), 0);
    return sum + (serviceFees - discount + tip);
  }, 0);

  const selectedPaymentTotal = filteredBookings.reduce((sum, b) => {
    const paid = b.paymentMethod ? b.services.reduce((s, sv) => s + (sv.price || 0), 0) : 0;
    return sum + paid;
  }, 0);

  /* ------------------------------ Render ------------------------------ */
  return (
    <AccessWrapper>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-6 relative overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-blue-300/10 to-purple-300/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '4s'}}></div>
        </div>
        
        <div className="max-w-7xl mx-auto dark:text-white relative z-10">
          {/* Header */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 p-8 mb-8 shadow-2xl animate-fade-in">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20"></div>
            <div className="absolute top-4 right-4 w-32 h-32 bg-white/10 rounded-full animate-float"></div>
            <div className="absolute bottom-4 left-4 w-24 h-24 bg-white/10 rounded-full animate-bounce-subtle"></div>
            
            <div className="relative flex items-center gap-4">
              <div className="p-4 rounded-2xl bg-white/20 backdrop-blur-sm shadow-lg animate-pulse-slow">
                <DollarSign className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-white mb-2">Sales Report</h1>
                <p className="text-white/80 text-lg">Comprehensive sales analytics and revenue insights</p>
              </div>
              <div className="ml-auto flex items-center gap-3">
                <div className="p-3 rounded-xl bg-white/10 backdrop-blur-sm animate-float-delay">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <div className="p-3 rounded-xl bg-white/10 backdrop-blur-sm animate-bounce-gentle">
                  <BarChart3 className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="relative overflow-hidden rounded-2xl bg-white/70 backdrop-blur-lg shadow-xl border border-white/20 p-8 mb-8 animate-fade-in">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-50/50 via-purple-50/50 to-pink-50/50"></div>
            <div className="absolute top-4 right-4 w-20 h-20 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full animate-float"></div>
            
            <div className="relative">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg">
                  <Filter className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-xl font-semibold text-gray-800">Advanced Filters</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="relative group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-blue-500 transition-colors" />
                  <input
                    type="text"
                    placeholder="Search bookings..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl bg-white/80 backdrop-blur-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 hover:shadow-md"
                  />
                </div>

                <div className="relative group">
                  <div className="flex items-center gap-3 p-3 border border-gray-200 rounded-xl bg-white/80 backdrop-blur-sm focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent transition-all duration-300 hover:shadow-md">
                    <CalendarIcon className="w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                    <input 
                      type="date" 
                      value={startDate} 
                      onChange={(e) => setStartDate(e.target.value)} 
                      className="flex-1 bg-transparent outline-none text-gray-700" 
                    />
                    <span className="text-gray-400 text-sm">to</span>
                    <input 
                      type="date" 
                      value={endDate} 
                      onChange={(e) => setEndDate(e.target.value)} 
                      className="flex-1 bg-transparent outline-none text-gray-700" 
                    />
                  </div>
                </div>

                <div className="relative">
                  <select 
                    className="w-full appearance-none px-4 py-3 border border-gray-200 rounded-xl bg-white/80 backdrop-blur-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 hover:shadow-md cursor-pointer" 
                    value={branchFilter} 
                    onChange={(e) => setBranchFilter(e.target.value)}
                  >
                    <option value="">All Branches</option>
                    {BRANCH_OPTIONS.map((b) => <option key={b}>{b}</option>)}
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                    <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-400"></div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <select 
                    className="w-full appearance-none pl-10 pr-8 py-3 border border-gray-200 rounded-xl bg-white/80 backdrop-blur-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 hover:shadow-md cursor-pointer text-sm" 
                    value={staffFilter} 
                    onChange={(e) => setStaffFilter(e.target.value)}
                  >
                    <option value="">All Staff</option>
                    {staffOptions.map((s) => <option key={s}>{s}</option>)}
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                    <div className="w-0 h-0 border-l-3 border-r-3 border-t-3 border-l-transparent border-r-transparent border-t-gray-400"></div>
                  </div>
                </div>

                <select 
                  className="w-full appearance-none px-4 py-3 border border-gray-200 rounded-xl bg-white/80 backdrop-blur-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 hover:shadow-md cursor-pointer text-sm" 
                  value={serviceFilter} 
                  onChange={(e) => setServiceFilter(e.target.value)}
                >
                  <option value="">All Services</option>
                  {serviceOptions.map((s) => <option key={s}>{s}</option>)}
                </select>

                <select 
                  className="w-full appearance-none px-4 py-3 border border-gray-200 rounded-xl bg-white/80 backdrop-blur-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 hover:shadow-md cursor-pointer text-sm" 
                  value={categoryFilter} 
                  onChange={(e) => setCategoryFilter(e.target.value)}
                >
                  <option value="">All Categories</option>
                  {categoryOptions.map((c) => <option key={c}>{c}</option>)}
                </select>

                <div className="relative">
                  <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <select 
                    className="w-full appearance-none pl-10 pr-8 py-3 border border-gray-200 rounded-xl bg-white/80 backdrop-blur-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 hover:shadow-md cursor-pointer text-sm" 
                    value={paymentFilter} 
                    onChange={(e) => setPaymentFilter(e.target.value)}
                  >
                    <option value="">All Payments</option>
                    {PAYMENT_OPTIONS.map((p) => <option key={p}>{p}</option>)}
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                    <div className="w-0 h-0 border-l-3 border-r-3 border-t-3 border-l-transparent border-r-transparent border-t-gray-400"></div>
                  </div>
                </div>

                <select 
                  className="w-full appearance-none px-4 py-3 border border-gray-200 rounded-xl bg-white/80 backdrop-blur-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 hover:shadow-md cursor-pointer text-sm" 
                  value={statusFilter} 
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="">All Status</option>
                  {STATUS_OPTIONS.map((s) => <option key={s}>{s}</option>)}
                </select>

                <select 
                  className="w-full appearance-none px-4 py-3 border border-gray-200 rounded-xl bg-white/80 backdrop-blur-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 hover:shadow-md cursor-pointer text-sm" 
                  value={perPage} 
                  onChange={(e) => { setPerPage(Number(e.target.value)); setPage(1); }}
                >
                  {[10, 20, 50].map((n) => <option key={n} value={n}>{n} per page</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
            <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-700 p-6 shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 animate-fade-in">
              <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent"></div>
              <div className="absolute top-4 right-4 w-16 h-16 bg-white/10 rounded-full animate-pulse-slow"></div>
              
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-xl bg-white/20 backdrop-blur-sm group-hover:scale-110 transition-transform duration-300">
                    <BarChart3 className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-white/60 text-sm font-medium">Total</div>
                </div>
                <p className="text-white/80 text-sm font-medium mb-2">Total Bookings</p>
                <p className="text-3xl font-bold text-white group-hover:scale-105 transition-transform duration-300">{filteredBookings.length}</p>
              </div>
            </div>

            <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 via-green-600 to-teal-700 p-6 shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 animate-fade-in animate-delay-200">
              <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent"></div>
              <div className="absolute top-4 right-4 w-16 h-16 bg-white/10 rounded-full animate-float"></div>
              
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-xl bg-white/20 backdrop-blur-sm group-hover:scale-110 transition-transform duration-300">
                    <TrendingUp className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-white/60 text-sm font-medium">Revenue</div>
                </div>
                <p className="text-white/80 text-sm font-medium mb-2">Total Revenue</p>
                <p className="text-3xl font-bold text-white group-hover:scale-105 transition-transform duration-300">AED {totalRevenue.toLocaleString()}</p>
              </div>
            </div>

            <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-500 via-violet-600 to-indigo-700 p-6 shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 animate-fade-in animate-delay-400">
              <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent"></div>
              <div className="absolute top-4 right-4 w-16 h-16 bg-white/10 rounded-full animate-bounce-subtle"></div>
              
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-xl bg-white/20 backdrop-blur-sm group-hover:scale-110 transition-transform duration-300">
                    <CreditCard className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-white/60 text-sm font-medium">Payments</div>
                </div>
                <p className="text-white/80 text-sm font-medium mb-2">Selected Payment Total</p>
                <p className="text-3xl font-bold text-white group-hover:scale-105 transition-transform duration-300">AED {selectedPaymentTotal.toLocaleString()}</p>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="relative overflow-hidden rounded-2xl bg-white/80 backdrop-blur-lg shadow-2xl border border-white/20 animate-fade-in">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-50/30 via-purple-50/30 to-pink-50/30"></div>
            
            <div className="relative overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gradient-to-r from-slate-800 via-gray-900 to-slate-800 text-white text-xs uppercase sticky top-0 shadow-lg">
                  <tr>
                    {['Booking ID','Date','Time','Customer','Staff','Branch','Services','Category','Payment','Card/Auth','Status','Service Fees','Discount','Tip','Total','Adjusted','Payable','Paid','Due'].map((h, index) => (
                      <th key={h} className="px-6 py-4 text-left font-semibold tracking-wider border-r border-gray-700 last:border-r-0 hover:bg-white/10 transition-colors duration-200">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {paginatedBookings.map((b, index) => {
                    const serviceFees = b.services.reduce((s, sv) => s + (sv.price || 0), 0);
                    const discount = b.services.reduce((s, sv) => s + (sv.discountAmount || 0), 0);
                    const tip = b.services.reduce((s, sv) => s + (sv.tipAmount || 0), 0);
                    const total = serviceFees - discount + tip;
                    const adjusted = 0;
                    const payable = total - discount;
                    const paid = b.paymentMethod ? total : 0;
                    const due = payable - paid;

                    return (
                      <tr key={b.id} className={`group hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-purple-50/50 transition-all duration-300 hover:shadow-md ${index % 2 === 0 ? 'bg-white/50' : 'bg-gray-50/50'}`}>
                        <td className="px-6 py-4 font-medium text-gray-900 group-hover:text-blue-700 transition-colors">{b.id}</td>
                        <td className="px-6 py-4 text-gray-700">{format(b.bookingDate, 'MMM dd, yyyy')}</td>
                        <td className="px-6 py-4 text-gray-700">{b.bookingTime}</td>
                        <td className="px-6 py-4 font-medium text-gray-900">{b.customerName}</td>
                        <td className="px-6 py-4 text-gray-700">{b.staff || '—'}</td>
                        <td className="px-6 py-4 text-gray-700">{b.branch || '—'}</td>
                        <td className="px-6 py-4 text-gray-700 max-w-xs truncate" title={b.services.map((s) => s.serviceName).join(', ')}>{b.services.map((s) => s.serviceName).join(', ')}</td>
                        <td className="px-6 py-4 text-gray-700">{b.services.map((s) => s.category).join(', ')}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
                            b.paymentMethod === 'Cash' ? 'bg-green-100 text-green-800' :
                            b.paymentMethod === 'Card' ? 'bg-blue-100 text-blue-800' :
                            b.paymentMethod === 'Online' ? 'bg-purple-100 text-purple-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {b.paymentMethod || '—'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-700 font-mono text-xs">{b.cardAuthCode || '—'}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
                            b.status === 'Completed' ? 'bg-green-100 text-green-800' :
                            b.status === 'Confirmed' ? 'bg-blue-100 text-blue-800' :
                            b.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {b.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-semibold text-gray-900">AED {serviceFees.toLocaleString()}</td>
                        <td className="px-6 py-4 text-red-600 font-medium">AED {discount.toLocaleString()}</td>
                        <td className="px-6 py-4 text-green-600 font-medium">AED {tip.toLocaleString()}</td>
                        <td className="px-6 py-4 font-bold text-gray-900">AED {total.toLocaleString()}</td>
                        <td className="px-6 py-4 text-gray-700">AED {adjusted.toLocaleString()}</td>
                        <td className="px-6 py-4 font-semibold text-blue-600">AED {payable.toLocaleString()}</td>
                        <td className="px-6 py-4 font-semibold text-green-600">AED {paid.toLocaleString()}</td>
                        <td className="px-6 py-4 font-semibold text-red-600">AED {due.toLocaleString()}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="relative bg-gradient-to-r from-gray-50 to-white border-t border-gray-200 px-6 py-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-blue-100">
                    <BarChart3 className="w-4 h-4 text-blue-600" />
                  </div>
                  <p className="text-sm font-medium text-gray-700">
                    Showing <span className="font-bold text-blue-600">{(page - 1) * perPage + 1}–{Math.min(page * perPage, filteredBookings.length)}</span> of <span className="font-bold text-gray-900">{filteredBookings.length}</span> results
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button 
                    disabled={page === 1} 
                    onClick={() => setPage((p) => p - 1)} 
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                  </button>
                  <div className="flex items-center gap-1">
                    <span className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium">{page}</span>
                    <span className="text-gray-400 text-sm">of</span>
                    <span className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium">{totalPages}</span>
                  </div>
                  <button 
                    disabled={page === totalPages} 
                    onClick={() => setPage((p) => p + 1)} 
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md"
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes slide-down {
          from { opacity: 0; transform: translateY(-30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes bounce-subtle {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-10px) rotate(5deg); }
        }
        
        @keyframes float-delay {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-8px) rotate(-3deg); }
        }
        
        @keyframes bounce-gentle {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        
        @keyframes pulse-slow {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.8; }
        }
        
        .animate-fade-in {
          animation: fade-in 0.6s ease-out;
        }
        
        .animate-slide-down {
          animation: slide-down 0.8s ease-out;
        }
        
        .animate-bounce-subtle {
          animation: bounce-subtle 3s ease-in-out infinite;
        }
        
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        
        .animate-float-delay {
          animation: float-delay 6s ease-in-out infinite 2s;
        }
        
        .animate-bounce-gentle {
          animation: bounce-gentle 4s ease-in-out infinite;
        }
        
        .animate-pulse-slow {
          animation: pulse-slow 3s ease-in-out infinite;
        }
      `}</style>
    </AccessWrapper>
  );
}
