
// 'use client';

// import { useState, useEffect, useMemo } from 'react';
// import AccessWrapper from '@/components/AccessWrapper';
// import {
//   collection,
//   query,
//   orderBy,
//   onSnapshot,
//   doc,
//   updateDoc,
//   Timestamp,
//   getDocs,
//   addDoc,
//   serverTimestamp,
//   deleteDoc,
// } from 'firebase/firestore';
// import { db } from '@/lib/firebase';
// import {
//   Calendar,
//   Clock,
//   MapPin,
//   User,
//   CreditCard,
//   Search,
//   CheckCircle,
//   XCircle,
//   AlertCircle,
//   Plus,
//   Trash2,
//   Edit3,
// } from 'lucide-react';
// import { format, isSameDay } from 'date-fns';

// /* ----------------------------- Types ----------------------------- */

// interface BookingService {
//   serviceId?: string;
//   serviceName: string;
//   category: string;
//   duration: number; // minutes
//   price: number; // per unit
//   quantity: number;
// }

// type BookingStatus = 'upcoming' | 'past' | 'cancelled';

// interface Booking {
//   id: string;
//   userId: string;
//   customerName: string;
//   services: BookingService[];
//   bookingDate: Date;
//   bookingTime: string; // "HH:mm"
//   branch: string;
//   staff: string | null; // name string
//   totalPrice: number;
//   totalDuration: number;
//   status: BookingStatus;
//   paymentMethod: string;
//   emailConfirmation: boolean;
//   smsConfirmation: boolean;
//   createdAt: Date;
//   updatedAt: Date;
//   remarks?: string | null;
// }

// interface User {
//   id: string;
//   name: string;
//   email: string;
//   phone: string;
// }

// /* --------------------------- Constants --------------------------- */

// const BRANCH_OPTIONS = ['Al Bustan','Marina','TECOM','AL Muraqabat','IBN Batutta Mall'];
// const CATEGORY_OPTIONS = ['Facial', 'Hair', 'Nails', 'Lashes', 'Massage'];
// const PAYMENT_METHODS = ['cash', 'card'];

// // Fallback staff list (used only if Firestore `staff` collection not available)
// const STAFF_FALLBACK = ['Komal', 'Shameem', 'Do Thi Kim', 'Alishba'];

// /* ------------------------- Helper functions ---------------------- */

// const emptyService: BookingService = {
//   serviceId: '',
//   serviceName: '',
//   category: '',
//   duration: 30,
//   price: 0,
//   quantity: 1,
// };

// function calcTotals(services: BookingService[]) {
//   const totalPrice = services.reduce(
//     (sum, s) => sum + (Number(s.price) || 0) * (Number(s.quantity) || 0),
//     0
//   );
//   const totalDuration = services.reduce(
//     (sum, s) => sum + (Number(s.duration) || 0) * (Number(s.quantity) || 0),
//     0
//   );
//   return { totalPrice, totalDuration };
// }

// function minutesToHHMM(mins: number) {
//   const h = Math.floor(mins / 60)
//     .toString()
//     .padStart(2, '0');
//   const m = (mins % 60).toString().padStart(2, '0');
//   return `${h}:${m}`;
// }

// function toDisplayAMPM(hhmm: string) {
//   const [hStr, m] = hhmm.split(':');
//   let h = Number(hStr);
//   const suffix = h >= 12 ? 'PM' : 'AM';
//   if (h === 0) h = 12;
//   if (h > 12) h = h - 12;
//   return `${h}:${m} ${suffix}`;
// }

// function generateTimeSlots(
//   // start = 10 * 60, // 10:00
//   // end = 22 * 60, // 22:00 (10:00 PM)
//   // step = 15 // 15 mins
//     start = 0, // 10:00
//   end = 12 * 120, // 22:00 (10:00 PM)
//   step = 15 // 15 mins
// ) {
//   const slots: string[] = [];
//   for (let t = start; t <= end; t += step) {
//     slots.push(minutesToHHMM(t));
//   }
//   return slots;
// }

// // EXACT requirement: 10:00 AM → 10:00 PM (15-min steps)
// const TIMESLOTS = generateTimeSlots();

// /* =========================== Component =========================== */

// export default function BookingsPage() {
//   const [bookings, setBookings] = useState<Booking[]>([]);
//   const [users, setUsers] = useState<{ [key: string]: User }>({});
//   const [loading, setLoading] = useState(true);
//   const [searchTerm, setSearchTerm] = useState('');
//   const [statusFilter, setStatusFilter] = useState<string>('all');

//   // Create/Edit modal
//   const [showCreate, setShowCreate] = useState(false);
//   const [saving, setSaving] = useState(false);
//   const [deleting, setDeleting] = useState(false);
//   const [editingId, setEditingId] = useState<string | null>(null);

//   // form state
//   const [branch, setBranch] = useState(BRANCH_OPTIONS[0]);
//   const [serviceDate, setServiceDate] = useState<string>(() =>
//     format(new Date(), 'yyyy-MM-dd')
//   );
//   const [serviceTime, setServiceTime] = useState<string>('10:00'); // "HH:mm"
//   const [customerName, setCustomerName] = useState<string>('');
//   const [paymentMethod, setPaymentMethod] = useState<string>('cash');
//   const [emailConfirmation, setEmailConfirmation] = useState(false);
//   const [smsConfirmation, setSmsConfirmation] = useState(false);
//   const [status, setStatus] = useState<BookingStatus>('upcoming');
//   const [staff, setStaff] = useState<string>('');
//   const [services, setServices] = useState<BookingService[]>([{ ...emptyService }]);
//   const [remarks, setRemarks] = useState<string>('');

//   // Schedule board controls
//   const [scheduleDate, setScheduleDate] = useState<string>(() =>
//     format(new Date(), 'yyyy-MM-dd')
//   );
//   const [scheduleBranch, setScheduleBranch] = useState<string>('all');

//   // Dynamic staff fetched from Firestore
//   const [staffFromDB, setStaffFromDB] = useState<string[]>([]);

//   // Hour enabled/disabled state (keyed by hour string, e.g. "10", "11", "12")
//   const uniqueHours = Array.from(new Set(TIMESLOTS.map((t) => t.split(':')[0]))).sort(
//     (a, b) => Number(a) - Number(b)
//   );
//   const [enabledHours, setEnabledHours] = useState<Record<string, boolean>>(() => {
//     const map: Record<string, boolean> = {};
//     uniqueHours.forEach((h) => (map[h] = true));
//     return map;
//   });

//   /* -------------------- Load Staff from Firebase -------------------- */
//   useEffect(() => {
//     // Will use `staff` collection: each doc should have { name: string, active?: boolean }
//     const loadStaff = async () => {
//       try {
//         const snap = await getDocs(collection(db, 'staff'));
//         const list: string[] = [];
//         snap.forEach((d) => {
//           const data = d.data() as any;
//           if (data?.name) list.push(String(data.name));
//         });
//         // If no staff docs found, we fallback to your previous constants
//         setStaffFromDB(list.length ? list : STAFF_FALLBACK);
//       } catch {
//         // Safe fallback
//         setStaffFromDB(STAFF_FALLBACK);
//       }
//     };
//     loadStaff();
//   }, []);

//   const STAFF_OPTIONS = staffFromDB; // used everywhere below

//   /* -------------------- Load bookings (Realtime) -------------------- */
//   useEffect(() => {
//     const bookingsQuery = query(collection(db, 'bookings'), orderBy('createdAt', 'desc'));

//     const unsubscribe = onSnapshot(bookingsQuery, (snapshot) => {
//       const bookingsData = snapshot.docs.map((d) => {
//         const data = d.data() as any;
//         return {
//           id: d.id,
//           userId: data.userId || '',
//           customerName: data.customerName || '',
//           services: (data.services || []) as BookingService[],
//           bookingDate: data.bookingDate?.toDate() || new Date(),
//           bookingTime: data.bookingTime || '',
//           branch: data.branch || '',
//           staff: data.staff ?? null,
//           totalPrice: data.totalPrice || 0,
//           totalDuration: data.totalDuration || 0,
//           status: (data.status as BookingStatus) || 'upcoming',
//           paymentMethod: data.paymentMethod || 'cash',
//           emailConfirmation: data.emailConfirmation || false,
//           smsConfirmation: data.smsConfirmation || false,
//           createdAt: data.createdAt?.toDate() || new Date(),
//           updatedAt: data.updatedAt?.toDate() || new Date(),
//           remarks: data.remarks ?? null,
//         } as Booking;
//       });
//       setBookings(bookingsData);
//       setLoading(false);
//     });

//     return () => unsubscribe();
//   }, []);

//   /* ------------------------- Load user details ------------------------- */
//   useEffect(() => {
//     const loadUsers = async () => {
//       const usersQuery = query(collection(db, 'users'));
//       const usersSnapshot = await getDocs(usersQuery);
//       const usersData: { [key: string]: User } = {};

//       usersSnapshot.docs.forEach((doc) => {
//         const data = doc.data() as any;
//         usersData[doc.id] = {
//           id: doc.id,
//           name: data.name || data.displayName || 'Unknown User',
//           email: data.email || '',
//           phone: data.phone || data.phoneNumber || '',
//         };
//       });

//       setUsers(usersData);
//     };

//     loadUsers();
//   }, []);

//   /* --------------------------- Filtering logic -------------------------- */
//   const filteredBookings = bookings.filter((booking) => {
//     const q = searchTerm.toLowerCase();
//     const matchesSearch =
//       booking.customerName.toLowerCase().includes(q) ||
//       booking.branch.toLowerCase().includes(q) ||
//       booking.services.some((s) => s.serviceName.toLowerCase().includes(q));

//     const matchesStatus = statusFilter === 'all' || booking.status === (statusFilter as BookingStatus);

//     return matchesSearch && matchesStatus;
//   });

//   /* --------------------------- Update helpers --------------------------- */
//   const updateBookingStatus = async (bookingId: string, newStatus: BookingStatus) => {
//     try {
//       const bookingRef = doc(db, 'bookings', bookingId);
//       await updateDoc(bookingRef, {
//         status: newStatus,
//         updatedAt: serverTimestamp(),
//       });
//     } catch (error) {
//       console.error('Error updating booking status:', error);
//       alert('Failed to update status.');
//     }
//   };

//   const getStatusBadge = (s: string) => {
//     switch (s) {
//       case 'upcoming':
//         return 'bg-blue-100 text-blue-800';
//       case 'past':
//         return 'bg-green-100 text-green-800';
//       case 'cancelled':
//         return 'bg-red-100 text-red-800';
//       default:
//         return 'bg-gray-100 text-gray-800';
//     }
//   };

//   const getStatusBlock = (s: BookingStatus) => {
//     switch (s) {
//       case 'upcoming':
//         return 'bg-emerald-50 border-emerald-300 text-emerald-800';
//       case 'past':
//         return 'bg-gray-50 border-gray-300 text-gray-700';
//       case 'cancelled':
//         return 'bg-rose-50 border-rose-300 text-rose-800 line-through';
//       default:
//         return 'bg-slate-50 border-slate-300 text-slate-800';
//     }
//   };

//   const getPaymentIcon = (method: string) => {
//     switch (method.toLowerCase()) {
//       case 'card':
//       case 'credit':
//       case 'debit':
//         return <CreditCard className="w-4 h-4" />;
//       default:
//         return <CreditCard className="w-4 h-4" />;
//     }
//   };

//   /* -------------------------- Create/Edit Handlers ------------------------- */

//   const resetForm = () => {
//     setBranch(BRANCH_OPTIONS[0]);
//     setServiceDate(format(new Date(), 'yyyy-MM-dd'));
//     setServiceTime('10:00');
//     setCustomerName('');
//     setPaymentMethod('cash');
//     setEmailConfirmation(false);
//     setSmsConfirmation(false);
//     setStatus('upcoming');
//     setStaff('');
//     setServices([{ ...emptyService }]);
//     setRemarks('');
//     setEditingId(null);
//   };

//   const openForCreate = () => {
//     resetForm();
//     setShowCreate(true);
//   };

//   // Open modal to CREATE, but prefill staff+time from a grid cell
//   const openForCreateFromCell = (prefillStaff: string, prefillTime: string) => {
//     // If hour disabled, do nothing
//     const hour = prefillTime.split(':')[0];
//     if (!enabledHours[hour]) return;

//     resetForm();
//     setStaff(prefillStaff);
//     setServiceTime(prefillTime);
//     // Set serviceDate to scheduleDate (board date)
//     setServiceDate(scheduleDate);
//     setShowCreate(true);
//   };

//   const openForEdit = (b: Booking) => {
//     setEditingId(b.id);
//     setBranch(b.branch || BRANCH_OPTIONS[0]);
//     setServiceDate(format(b.bookingDate, 'yyyy-MM-dd'));
//     setServiceTime(b.bookingTime || '10:00');
//     setCustomerName(b.customerName || '');
//     setPaymentMethod(b.paymentMethod || 'cash');
//     setEmailConfirmation(!!b.emailConfirmation);
//     setSmsConfirmation(!!b.smsConfirmation);
//     setStatus(b.status || 'upcoming');
//     setStaff(b.staff || '');
//     setServices(
//       b.services && b.services.length > 0
//         ? b.services.map((s) => ({
//             serviceId: s.serviceId || '',
//             serviceName: s.serviceName || '',
//             category: s.category || '',
//             duration: Number(s.duration) || 0,
//             price: Number(s.price) || 0,
//             quantity: Number(s.quantity) || 1,
//           }))
//         : [{ ...emptyService }]
//     );
//     setRemarks(b.remarks || '');
//     setShowCreate(true);
//   };

//   const handleAddServiceRow = () => {
//     setServices((prev) => [...prev, { ...emptyService }]);
//   };

//   const handleRemoveServiceRow = (index: number) => {
//     setServices((prev) => prev.filter((_, i) => i !== index));
//   };

//   const handleServiceChange = (
//     index: number,
//     field: keyof BookingService,
//     value: string | number
//   ) => {
//     setServices((prev) =>
//       prev.map((s, i) => (i === index ? { ...s, [field]: value } : s))
//     );
//   };

//   const formTotals = calcTotals(services);

//   const validateForm = () => {
//     if (!customerName.trim()) return 'Customer name is required';
//     if (!serviceDate) return 'Service date is required';
//     if (!serviceTime) return 'Service time is required';
//     if (!branch) return 'Branch is required';
//     if (!staff) return 'Staff is required';
//     if (services.length === 0) return 'Add at least one service';
//     const hasName = services.every((s) => s.serviceName.trim().length > 0);
//     if (!hasName) return 'Each service must have a name';
//     // also ensure selected time hour is enabled
//     const selectedHour = serviceTime.split(':')[0];
//     if (!enabledHours[selectedHour]) return 'Selected time falls into a disabled hour';
//     return null;
//   };

//   const saveBooking = async () => {
//     const err = validateForm();
//     if (err) {
//       alert(err);
//       return;
//     }

//     try {
//       setSaving(true);

//       const payload = {
//         userId: '',
//         customerName: customerName.trim(),
//         services: services.map((s) => ({
//           ...s,
//           price: Number(s.price) || 0,
//           duration: Number(s.duration) || 0,
//           quantity: Number(s.quantity) || 0,
//         })),
//         bookingDate: Timestamp.fromDate(new Date(serviceDate + 'T00:00:00')),
//         bookingTime: serviceTime, // "HH:mm"
//         branch,
//         staff: staff || null, // name string
//         totalPrice: formTotals.totalPrice,
//         totalDuration: formTotals.totalDuration,
//         status,
//         paymentMethod,
//         emailConfirmation,
//         smsConfirmation,
//         updatedAt: serverTimestamp(),
//         remarks: remarks || null,
//       };

//       if (editingId) {
//         const ref = doc(db, 'bookings', editingId);
//         await updateDoc(ref, payload);
//       } else {
//         await addDoc(collection(db, 'bookings'), {
//           ...payload,
//           createdAt: serverTimestamp(),
//         });
//       }

//       setShowCreate(false);
//       resetForm();
//     } catch (e) {
//       console.error('Error saving booking:', e);
//       alert('Failed to save booking. Check console for details.');
//     } finally {
//       setSaving(false);
//     }
//   };

//   const deleteBooking = async () => {
//     if (!editingId) return;
//     if (!confirm('Delete this booking? This action cannot be undone.')) return;

//     try {
//       setDeleting(true);
//       await deleteDoc(doc(db, 'bookings', editingId));
//       setShowCreate(false);
//       resetForm();
//     } catch (e) {
//       console.error('Error deleting booking:', e);
//       alert('Failed to delete booking.');
//     } finally {
//       setDeleting(false);
//     }
//   };

//   /* ------------------------------ Schedule Board Data ------------------------------ */

//   const bookingsForSchedule = useMemo(() => {
//     const target = new Date(scheduleDate + 'T00:00:00');
//     return bookings.filter((b) => {
//       const sameDay = isSameDay(b.bookingDate, target);
//       const branchOk = scheduleBranch === 'all' || b.branch === scheduleBranch;
//       return sameDay && branchOk;
//     });
//   }, [bookings, scheduleDate, scheduleBranch]);

//   // fast lookup: { 'HH:mm': { staffName: Booking[] } } but we need single cell show (first booking)
//   const scheduleMatrix = useMemo(() => {
//     const map: Record<string, Record<string, Booking[]>> = {};
//     TIMESLOTS.forEach((t) => {
//       map[t] = {};
//       STAFF_OPTIONS.forEach((s) => (map[t][s] = []));
//     });
//     bookingsForSchedule.forEach((b) => {
//       const t = b.bookingTime;
//       const s = b.staff || '';
//       if (t && s && map[t] && map[t][s] !== undefined) {
//         map[t][s].push(b);
//       }
//     });
//     return map;
//   }, [bookingsForSchedule, STAFF_OPTIONS]);

//   /* ------------------------------- Render ------------------------------ */

//   if (loading) {
//     return (
//       <div className="p-6">
//         <div className="max-w-7xl mx-auto">
//           <div className="flex items-center justify-center py-12">
//             <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600"></div>
//             <span className="ml-3 text-pink-600">Loading bookings...</span>
//           </div>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div>
  
     
//         {/* Header */}
//         <div className="mb-8 flex items-start sm:items-center justify-around gap-4">
//           <div>
//             <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
//               Customers
//             </h1>
//             <p className="text-gray-600 dark:text-white">
//               All Customers Data
//             </p>
//           </div>

          
//         </div>

//         {/* Schedule Board Controls */}
//         <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
//           <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
//             <div className="flex items-center">
//               <Calendar className="w-5 h-5 text-gray-500 mr-2" />
//               <input
//                 type="date"
//                 value={scheduleDate}
//                 onChange={(e) => setScheduleDate(e.target.value)}
//                 className="w-full border rounded-md px-3 py-2"
//               />
//             </div>
//             <div className="flex items-center">
//               <MapPin className="w-5 h-5 text-gray-500 mr-2" />
//               <select
//                 value={scheduleBranch}
//                 onChange={(e) => setScheduleBranch(e.target.value)}
//                 className="w-full border rounded-md px-3 py-2"
//               >
//                 <option value="all">All Branches</option>
//                 {BRANCH_OPTIONS.map((b) => (
//                   <option key={b} value={b}>
//                     {b}
//                   </option>
//                 ))}
//               </select>
//             </div>

//             {/* Hour toggles: minimal UI addition, consistent with existing controls */}
//             <div className="md:col-span-2">
              
//             </div>
//           </div>
//         </div>

//  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
//           <div className="flex flex-col md:flex-row gap-4">
//             <div className="flex-1">
//               <div className="relative">
//                 <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
//                 <input
//                   type="text"
//                   placeholder="Search by customer name, branch, or service..."
//                   value={searchTerm}
//                   onChange={(e) => setSearchTerm(e.target.value)}
//                   className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
//                 />
//               </div>
//             </div>

//             <div className="md:w-48">
//               <select
//                 value={statusFilter}
//                 onChange={(e) => setStatusFilter(e.target.value)}
//                 className="w-full bg-black text-white px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
//               >
//                 <option value="all">All Status</option>
//                 <option value="upcoming">Upcoming</option>
//                 <option value="past">Past</option>
//                 <option value="cancelled">Cancelled</option>
//               </select>
//             </div>
//           </div>
//         </div>

      
          
    

//         {/* ======================== SCHEDULE BOARD (NEW ORIENTATION) ======================== */}
//         <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-x-auto mb-10">
//           {/* Grid: first column is time (sticky left), first row is header with staff (sticky top) */}
//           <div
//             className="min-w-[900px] relative"
//             style={{}}
//           >
//             {/* Header Row: top-left cell + staff names */}
//             <div
//               className="grid sticky top-0 z-20"
//               style={{ gridTemplateColumns: `180px repeat(${STAFF_OPTIONS.length}, 200px)` }}
//             >
//               <div className="bg-gray-100 border-b px-4 py-3 font-semibold sticky left-0 z-30">
//                 Time
//               </div>
//               {STAFF_OPTIONS.map((sName) => (
//                 <div
//                   key={sName}
//                   className="bg-gray-100 border-b px-4 py-3 font-semibold text-center"
//                 >
//                   {sName}
//                 </div>
//               ))}
//             </div>

//             {/* Body: rows for each timeslot */}
//             <div className="">
//               {TIMESLOTS.map((t) => {
//                 const hour = t.split(':')[0];
//                 const hourEnabled = !!enabledHours[hour];

//                 return (
//                 <div
//                   key={t}
//                   className="grid"
//                   style={{ gridTemplateColumns: `180px repeat(${STAFF_OPTIONS.length}, 200px)` }}
//                 >
                  

                         
                    
                  
//                 </div>
//               )})}
//             </div>
//           </div>
//         </div>

//         {/* Filters and Search (List view) */}

//         {/* Bookings Table (click row to edit) */}
//         <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
//           <div className="overflow-x-auto">
//             <table className="min-w-full divide-y divide-gray-200">
//               <thead className="bg-gray-50">
//                 <tr>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                     Customer
//                   </th>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                     Services
//                   </th>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                     Date & Time
//                   </th>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                     Staff
//                   </th>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                     Branch
//                   </th>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                     Payment
//                   </th>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                     Status
//                   </th>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                     Actions
//                   </th>
//                 </tr>
//               </thead>
//               <tbody className="bg-white divide-y divide-gray-200">
//                 {filteredBookings.map((booking) => {
//                   const user = users[booking.userId];
//                   return (
//                     <tr
//                       key={booking.id}
//                       className="hover:bg-gray-50 cursor-pointer"
//                       onClick={() => openForEdit(booking)}
//                     >
//                       <td className="px-6 py-4 whitespace-nowrap">
//                         <div className="flex items-center">
//                           <div className="flex-shrink-0 h-10 w-10">
//                             <div className="h-10 w-10 rounded-full bg-pink-100 flex items-center justify-center">
//                               <User className="h-5 w-5 text-pink-600" />
//                             </div>
//                           </div>
//                           <div className="ml-4">
//                             <div className="text-sm font-medium text-gray-900">
//                               {booking.customerName}
//                             </div>
//                             <div className="text-sm text-gray-500">
//                               {user?.email || 'No email'}
//                             </div>
//                           </div>
//                         </div>
//                       </td>
//                       <td className="px-6 py-4">
//                         <div className="text-sm text-gray-900">
//                           {booking.services.slice(0, 2).map((service, index) => (
//                             <div key={index} className="mb-1">
//                               {service.serviceName}{' '}
//                               {service.quantity > 1 && `(x${service.quantity})`}
//                             </div>
//                           ))}
//                           {booking.services.length > 2 && (
//                             <div className="text-xs text-gray-500">
//                               +{booking.services.length - 2} more
//                             </div>
//                           )}
//                         </div>
//                       </td>
//                       <td className="px-6 py-4 whitespace-nowrap">
//                         <div className="flex items-center text-sm text-gray-900">
//                           <Calendar className="w-4 h-4 mr-2 text-gray-400" />
//                           <div>
//                             <div>{format(booking.bookingDate, 'MMM dd, yyyy')}</div>
//                             <div className="text-xs text-gray-500 flex items-center mt-1">
//                               <Clock className="w-3 h-3 mr-1" />
//                               {toDisplayAMPM(booking.bookingTime)}
//                             </div>
//                           </div>
//                         </div>
//                       </td>
//                       <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
//                         {booking.staff || '—'}
//                       </td>
//                       <td className="px-6 py-4 whitespace-nowrap">
//                         <div className="flex items-center text-sm text-gray-900">
//                           <MapPin className="w-4 h-4 mr-2 text-gray-400" />
//                           {booking.branch}
//                         </div>
//                       </td>
//                       <td className="px-6 py-4 whitespace-nowrap">
//                         <div className="text-sm text-gray-900">
//                           <div className="flex items-center">
//                             {getPaymentIcon(booking.paymentMethod)}
//                             <span className="ml-2">${booking.totalPrice.toFixed(2)}</span>
//                           </div>
//                           <div className="text-xs text-gray-500 capitalize">
//                             {booking.paymentMethod}
//                           </div>
//                         </div>
//                       </td>
//                       <td className="px-6 py-4 whitespace-nowrap">
//                         <span
//                           className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full capitalize ${getStatusBadge(
//                             booking.status
//                           )}`}
//                         >
//                           {booking.status}
//                         </span>
//                       </td>
//                       <td
//                         className="px-6 py-4 whitespace-nowrap text-sm font-medium"
//                         onClick={(e) => e.stopPropagation()}
//                       >
//                         <div className="flex space-x-2">
//                           <button
//                             onClick={() => openForEdit(booking)}
//                             className="text-emerald-700 hover:text-emerald-900"
//                             title="Edit booking"
//                           >
//                             <Edit3 className="w-4 h-4" />
//                           </button>
//                           {booking.status === 'upcoming' && (
//                             <>
//                               <button
//                                 onClick={() => updateBookingStatus(booking.id, 'past')}
//                                 className="text-green-600 hover:text-green-900"
//                                 title="Mark as completed"
//                               >
//                                 <CheckCircle className="w-4 h-4" />
//                               </button>
//                               <button
//                                 onClick={() => updateBookingStatus(booking.id, 'cancelled')}
//                                 className="text-red-600 hover:text-red-900"
//                                 title="Cancel booking"
//                               >
//                                 <XCircle className="w-4 h-4" />
//                               </button>
//                             </>
//                           )}
//                         </div>
//                       </td>
//                     </tr>
//                   );
//                 })}
//               </tbody>
//             </table>
//           </div>

//           {filteredBookings.length === 0 && (
//             <div className="text-center py-12">
//               <Calendar className="mx-auto h-12 w-12 text-gray-400" />
//               <h3 className="mt-2 text-sm font-medium text-gray-900">No bookings found</h3>
//               <p className="mt-1 text-sm text-gray-500">
//                 {searchTerm || statusFilter !== 'all'
//                   ? 'Try adjusting your search or filter criteria.'
//                   : 'No bookings have been made yet.'}
//               </p>
//             </div>
//           )}
//         </div>

//         {/* ===================== CREATE / EDIT MODAL (PURE TAILWIND) ===================== */}
//         {showCreate && (
//           <div className="fixed inset-0 bg-gray-600 bg-opacity-50 z-50 overflow-y-auto h-full w-full">
//             <div className="relative top-10 mx-auto w-11/12 md:w-4/5 lg:w-3/4 xl:w-2/3">
//               <div className="bg-white rounded-lg shadow-xl border">
//                 {/* Header */}
//                 <div className="flex items-center justify-between px-6 py-4 border-b">
//                   <h3 className="text-lg font-semibold">
//                     {editingId ? 'Edit Schedule' : 'Add Schedule'}
//                   </h3>
//                   <div className="flex items-center gap-2">
//                     {editingId && (
//                       <button
//                         onClick={deleteBooking}
//                         disabled={deleting}
//                         className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-white bg-red-600 hover:bg-red-700 disabled:opacity-60"
//                         title="Delete booking"
//                       >
//                         <Trash2 className="w-4 h-4" />
//                         Delete
//                       </button>
//                     )}
//                     <button
//                       onClick={() => {
//                         setShowCreate(false);
//                         resetForm();
//                       }}
//                       className="text-gray-400 hover:text-gray-600"
//                       title="Close"
//                     >
//                       <XCircle className="w-6 h-6" />
//                     </button>
//                   </div>
//                 </div>

//                 {/* Body */}
//                 <div className="p-6 space-y-6">
//                   {/* Top selects */}
//                   <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
//                     <div>
//                       <label className="block text-sm font-medium text-gray-700">Branch</label>
//                       <select
//                         className="mt-1 w-full border rounded-md px-3 py-2"
//                         value={branch}
//                         onChange={(e) => setBranch(e.target.value)}
//                       >
//                         {BRANCH_OPTIONS.map((b) => (
//                           <option key={b} value={b}>
//                             {b}
//                           </option>
//                         ))}
//                       </select>
//                     </div>

//                     <div>
//                       <label className="block text-sm font-medium text-gray-700">Category</label>
//                       <select
//                         className="mt-1 w-full border rounded-md px-3 py-2"
//                         onChange={(e) => {
//                           setServices((prev) =>
//                             prev.map((s, i) => (i === 0 ? { ...s, category: e.target.value } : s))
//                           );
//                         }}
//                       >
//                         <option value="">Select One</option>
//                         {CATEGORY_OPTIONS.map((c) => (
//                           <option key={c} value={c}>
//                             {c}
//                           </option>
//                         ))}
//                       </select>
//                     </div>

//                     <div>
//                       <label className="block text-sm font-medium text-gray-700">Staff</label>
//                       <select
//                         className="mt-1 w-full border rounded-md px-3 py-2"
//                         value={staff}
//                         onChange={(e) => setStaff(e.target.value)}
//                       >
//                         <option value="">Select One</option>
//                         {STAFF_OPTIONS.map((s) => (
//                           <option key={s} value={s}>
//                             {s}
//                           </option>
//                         ))}
//                       </select>
//                     </div>

//                     <div>
//                       <label className="block text-sm font-medium text-gray-700">
//                         Payment Method
//                       </label>
//                       <select
//                         className="mt-1 w-full border rounded-md px-3 py-2"
//                         value={paymentMethod}
//                         onChange={(e) => setPaymentMethod(e.target.value)}
//                       >
//                         {PAYMENT_METHODS.map((p) => (
//                           <option key={p} value={p}>
//                             {p.toUpperCase()}
//                           </option>
//                         ))}
//                       </select>
//                     </div>
//                   </div>

//                   {/* Date & Time */}
//                   <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//                     <div>
//                       <label className="block text-sm font-medium text-gray-700">
//                         Service Date
//                       </label>
//                       <input
//                         type="date"
//                         className="mt-1 w-full border rounded-md px-3 py-2"
//                         value={serviceDate}
//                         onChange={(e) => setServiceDate(e.target.value)}
//                       />
//                     </div>
//                     <div>
//                       <label className="block text-sm font-medium text-gray-700">Time Slot</label>
//                       <select
//                         className="mt-1 w-full border rounded-md px-3 py-2"
//                         value={serviceTime}
//                         onChange={(e) => setServiceTime(e.target.value)}
//                       >
//                         {TIMESLOTS.filter(slot => {
//                           // only show slots whose hour is enabled
//                           const hour = slot.split(':')[0];
//                           return !!enabledHours[hour];
//                         }).map((slot) => (
//                           <option key={slot} value={slot}>
//                             {toDisplayAMPM(slot)}
//                           </option>
//                         ))}
//                       </select>
//                     </div>
//                     <div>
//                       <label className="block text-sm font-medium text-gray-700">Customer</label>
//                       <input
//                         type="text"
//                         placeholder="Customer name"
//                         className="mt-1 w-full border rounded-md px-3 py-2"
//                         value={customerName}
//                         onChange={(e) => setCustomerName(e.target.value)}
//                       />
//                     </div>
//                   </div>

//                   {/* Services table */}
//                   <div className="border rounded-lg">
//                     <div className="grid grid-cols-12 gap-2 px-4 py-3 bg-gray-50 text-xs font-semibold">
//                       <div className="col-span-4">Service</div>
//                       <div className="col-span-2">Category</div>
//                       <div className="col-span-2">Duration (min)</div>
//                       <div className="col-span-2">Price</div>
//                       <div className="col-span-1">Qty</div>
//                       <div className="col-span-1 text-right">—</div>
//                     </div>

//                     {services.map((s, idx) => (
//                       <div key={idx} className="grid grid-cols-12 gap-2 px-4 py-3 border-t">
//                         <div className="col-span-4">
//                           <input
//                             className="w-full border rounded-md px-3 py-2"
//                             placeholder="Service name"
//                             value={s.serviceName}
//                             onChange={(e) => handleServiceChange(idx, 'serviceName', e.target.value)}
//                           />
//                         </div>
//                         <div className="col-span-2">
//                           <select
//                             className="w-full border rounded-md px-3 py-2"
//                             value={s.category}
//                             onChange={(e) => handleServiceChange(idx, 'category', e.target.value)}
//                           >
//                             <option value="">Select</option>
//                             {CATEGORY_OPTIONS.map((c) => (
//                               <option key={c} value={c}>
//                                 {c}
//                               </option>
//                             ))}
//                           </select>
//                         </div>
//                         <div className="col-span-2">
//                           <input
//                             type="number"
//                             min={0}
//                             className="w-full border rounded-md px-3 py-2"
//                             value={s.duration}
//                             onChange={(e) =>
//                               handleServiceChange(idx, 'duration', Number(e.target.value || 0))
//                             }
//                           />
//                         </div>
//                         <div className="col-span-2">
//                           <input
//                             type="number"
//                             min={0}
//                             step="0.01"
//                             className="w-full border rounded-md px-3 py-2"
//                             value={s.price}
//                             onChange={(e) =>
//                               handleServiceChange(idx, 'price', Number(e.target.value || 0))
//                             }
//                           />
//                         </div>
//                         <div className="col-span-1">
//                           <input
//                             type="number"
//                             min={1}
//                             className="w-full border rounded-md px-3 py-2"
//                             value={s.quantity}
//                             onChange={(e) =>
//                               handleServiceChange(idx, 'quantity', Number(e.target.value || 1))
//                             }
//                           />
//                         </div>
//                         <div className="col-span-1 flex justify-end items-center">
//                           {services.length > 1 && (
//                             <button
//                               onClick={() => handleRemoveServiceRow(idx)}
//                               className="p-2 rounded hover:bg-red-50 text-red-600"
//                               title="Remove"
//                             >
//                               <Trash2 className="w-4 h-4" />
//                             </button>
//                           )}
//                         </div>
//                       </div>
//                     ))}

//                     <div className="px-4 py-3 border-t flex justify-between items-center">
//                       <button
//                         onClick={handleAddServiceRow}
//                         className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
//                       >
//                         <Plus className="w-4 h-4" />
//                         Add more service
//                       </button>

//                       <div className="text-sm text-gray-700">
//                         <span className="mr-4">
//                           <strong>Total Duration:</strong> {formTotals.totalDuration} min
//                         </span>
//                         <span>
//                           <strong>Total Price:</strong> ${formTotals.totalPrice.toFixed(2)}
//                         </span>
//                       </div>
//                     </div>
//                   </div>

//                   {/* Remarks & toggles */}
//                   <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//                     <div className="md:col-span-2">
//                       <label className="block text-sm font-medium text-gray-700">
//                         Remarks (optional)
//                       </label>
//                       <textarea
//                         className="mt-1 w-full border rounded-md px-3 py-2 min-h-[80px]"
//                         value={remarks}
//                         onChange={(e) => setRemarks(e.target.value)}
//                       />
//                     </div>
//                     <div className="space-y-4">
//                       <div className="flex items-center justify-between border rounded-md px-3 py-2">
//                         <span className="text-sm">Send booking notification by email</span>
//                         <input
//                           type="checkbox"
//                           checked={emailConfirmation}
//                           onChange={(e) => setEmailConfirmation(e.target.checked)}
//                         />
//                       </div>
//                       <div className="flex items-center justify-between border rounded-md px-3 py-2">
//                         <span className="text-sm">Send booking notification by SMS</span>
//                         <input
//                           type="checkbox"
//                           checked={smsConfirmation}
//                           onChange={(e) => setSmsConfirmation(e.target.checked)}
//                         />
//                       </div>
//                       <div>
//                         <label className="block text-sm font-medium text-gray-700">
//                           Application Status
//                         </label>
//                         <select
//                           className="mt-1 w-full border rounded-md px-3 py-2"
//                           value={status}
//                           onChange={(e) => setStatus(e.target.value as BookingStatus)}
//                         >
//                           <option value="upcoming">Approved (Upcoming)</option>
//                           <option value="past">Completed (Past)</option>
//                           <option value="cancelled">Cancelled</option>
//                         </select>
//                       </div>
//                     </div>
//                   </div>
//                 </div>

//                 {/* Footer */}
//                 <div className="px-6 py-4 border-t flex justify-end gap-3">
//                   <button
//                     onClick={() => {
//                       setShowCreate(false);
//                       resetForm();
//                     }}
//                     className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
//                     disabled={saving || deleting}
//                   >
//                     Close
//                   </button>
//                   <button
//                     onClick={saveBooking}
//                     className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-md hover:bg-emerald-700 disabled:opacity-60"
//                     disabled={saving || deleting}
//                   >
//                     {saving ? (editingId ? 'Updating...' : 'Saving...') : editingId ? 'Update' : 'Save'}
//                   </button>
//                 </div>
//               </div>
//             </div>
//           </div>
//         )}
//         {/* =================== END CREATE / EDIT MODAL =================== */}
//       </div>

   
//   );
// }


// code no 2
// some issue

// 'use client';

// import { useState, useEffect, useMemo } from 'react';
// import AccessWrapper from '@/components/AccessWrapper';
// import {
//   collection,
//   query,
//   orderBy,
//   onSnapshot,
//   doc,
//   updateDoc,
//   Timestamp,
//   getDocs,
//   addDoc,
//   serverTimestamp,
//   deleteDoc,
// } from 'firebase/firestore';
// import { db } from '@/lib/firebase';
// import {
//   Calendar,
//   Clock,
//   MapPin,
//   User,
//   CreditCard,
//   Search,
//   CheckCircle,
//   XCircle,
//   AlertCircle,
//   Plus,
//   Trash2,
//   Edit3,
// } from 'lucide-react';
// import { format, isSameDay } from 'date-fns';

// /* ----------------------------- Types ----------------------------- */

// interface BookingService {
//   serviceId?: string;
//   serviceName: string;
//   category: string;
//   duration: number; // minutes
//   price: number; // per unit
//   quantity: number;
// }

// type BookingStatus = 'upcoming' | 'past' | 'cancelled';

// interface Booking {
//   id: string;
//   userId: string;
//   customerName: string;
//   services: BookingService[];
//   bookingDate: Date;
//   bookingTime: string; // "HH:mm"
//   branch: string;
//   staff: string | null; // name string
//   totalPrice: number;
//   totalDuration: number;
//   status: BookingStatus;
//   paymentMethod: string;
//   emailConfirmation: boolean;
//   smsConfirmation: boolean;
//   createdAt: Date;
//   updatedAt: Date;
//   remarks?: string | null;
// }

// interface User {
//   id: string;
//   name: string;
//   email: string;
//   phone: string;
// }

// /* --------------------------- Constants --------------------------- */

// const BRANCH_OPTIONS = ['Al Bustan','Marina','TECOM','AL Muraqabat','IBN Batutta Mall'];
// const CATEGORY_OPTIONS = ['Facial', 'Hair', 'Nails', 'Lashes', 'Massage'];
// const PAYMENT_METHODS = ['cash', 'card'];

// // Fallback staff list (used only if Firestore `staff` collection not available)
// const STAFF_FALLBACK = ['Komal', 'Shameem', 'Do Thi Kim', 'Alishba'];

// /* ------------------------- Helper functions ---------------------- */

// const emptyService: BookingService = {
//   serviceId: '',
//   serviceName: '',
//   category: '',
//   duration: 30,
//   price: 0,
//   quantity: 1,
// };

// function calcTotals(services: BookingService[]) {
//   const totalPrice = services.reduce(
//     (sum, s) => sum + (Number(s.price) || 0) * (Number(s.quantity) || 0),
//     0
//   );
//   const totalDuration = services.reduce(
//     (sum, s) => sum + (Number(s.duration) || 0) * (Number(s.quantity) || 0),
//     0
//   );
//   return { totalPrice, totalDuration };
// }

// function minutesToHHMM(mins: number) {
//   const h = Math.floor(mins / 60)
//     .toString()
//     .padStart(2, '0');
//   const m = (mins % 60).toString().padStart(2, '0');
//   return `${h}:${m}`;
// }

// function toDisplayAMPM(hhmm: string) {
//   const [hStr, m] = hhmm.split(':');
//   let h = Number(hStr);
//   const suffix = h >= 12 ? 'PM' : 'AM';
//   if (h === 0) h = 12;
//   if (h > 12) h = h - 12;
//   return `${h}:${m} ${suffix}`;
// }

// function generateTimeSlots(
//   // start = 10 * 60, // 10:00
//   // end = 22 * 60, // 22:00 (10:00 PM)
//   // step = 15 // 15 mins
//     start = 0, // 10:00
//   end = 12 * 120, // 22:00 (10:00 PM)
//   step = 15 // 15 mins
// ) {
//   const slots: string[] = [];
//   for (let t = start; t <= end; t += step) {
//     slots.push(minutesToHHMM(t));
//   }
//   return slots;
// }

// // EXACT requirement: 10:00 AM → 10:00 PM (15-min steps)
// const TIMESLOTS = generateTimeSlots();

// /* =========================== Component =========================== */

// export default function BookingsPage() {
//   const [bookings, setBookings] = useState<Booking[]>([]);
//   const [users, setUsers] = useState<{ [key: string]: User }>({});
//   const [loading, setLoading] = useState(true);
//   const [searchTerm, setSearchTerm] = useState('');
//   const [statusFilter, setStatusFilter] = useState<string>('all');

//   // Create/Edit modal
//   const [showCreate, setShowCreate] = useState(false);
//   const [saving, setSaving] = useState(false);
//   const [deleting, setDeleting] = useState(false);
//   const [editingId, setEditingId] = useState<string | null>(null);

//   // form state
//   const [branch, setBranch] = useState(BRANCH_OPTIONS[0]);
//   const [serviceDate, setServiceDate] = useState<string>(() =>
//     format(new Date(), 'yyyy-MM-dd')
//   );
//   const [serviceTime, setServiceTime] = useState<string>('10:00'); // "HH:mm"
//   const [customerName, setCustomerName] = useState<string>('');
//   const [paymentMethod, setPaymentMethod] = useState<string>('cash');
//   const [emailConfirmation, setEmailConfirmation] = useState(false);
//   const [smsConfirmation, setSmsConfirmation] = useState(false);
//   const [status, setStatus] = useState<BookingStatus>('upcoming');
//   const [staff, setStaff] = useState<string>('');
//   const [services, setServices] = useState<BookingService[]>([{ ...emptyService }]);
//   const [remarks, setRemarks] = useState<string>('');
// // new code



// // new code
//   // Schedule board controls
//   const [scheduleDate, setScheduleDate] = useState<string>(() =>
//     format(new Date(), 'yyyy-MM-dd')
//   );
//   const [scheduleBranch, setScheduleBranch] = useState<string>('all');

//   // Dynamic staff fetched from Firestore
//   const [staffFromDB, setStaffFromDB] = useState<string[]>([]);

//   // Hour enabled/disabled state (keyed by hour string, e.g. "10", "11", "12")
//   const uniqueHours = Array.from(new Set(TIMESLOTS.map((t) => t.split(':')[0]))).sort(
//     (a, b) => Number(a) - Number(b)
//   );
//   const [enabledHours, setEnabledHours] = useState<Record<string, boolean>>(() => {
//     const map: Record<string, boolean> = {};
//     uniqueHours.forEach((h) => (map[h] = true));
//     return map;
//   });

//   /* -------------------- Load Staff from Firebase -------------------- */
//   useEffect(() => {
//     // Will use `staff` collection: each doc should have { name: string, active?: boolean }
//     const loadStaff = async () => {
//       try {
//         const snap = await getDocs(collection(db, 'staff'));
//         const list: string[] = [];
//         snap.forEach((d) => {
//           const data = d.data() as any;
//           if (data?.name) list.push(String(data.name));
//         });
//         // If no staff docs found, we fallback to your previous constants
//         setStaffFromDB(list.length ? list : STAFF_FALLBACK);
//       } catch {
//         // Safe fallback
//         setStaffFromDB(STAFF_FALLBACK);
//       }
//     };
//     loadStaff();
//   }, []);

//   const STAFF_OPTIONS = staffFromDB; // used everywhere below

//   /* -------------------- Load bookings (Realtime) -------------------- */
//   useEffect(() => {
//     const bookingsQuery = query(collection(db, 'bookings'), orderBy('createdAt', 'desc'));

//     const unsubscribe = onSnapshot(bookingsQuery, (snapshot) => {
//       const bookingsData = snapshot.docs.map((d) => {
//         const data = d.data() as any;
//         return {
//           id: d.id,
//           userId: data.userId || '',
//           customerName: data.customerName || '',
//           services: (data.services || []) as BookingService[],
//           bookingDate: data.bookingDate?.toDate() || new Date(),
//           bookingTime: data.bookingTime || '',
//           branch: data.branch || '',
//           staff: data.staff ?? null,
//           totalPrice: data.totalPrice || 0,
//           totalDuration: data.totalDuration || 0,
//           status: (data.status as BookingStatus) || 'upcoming',
//           paymentMethod: data.paymentMethod || 'cash',
//           emailConfirmation: data.emailConfirmation || false,
//           smsConfirmation: data.smsConfirmation || false,
//           createdAt: data.createdAt?.toDate() || new Date(),
//           updatedAt: data.updatedAt?.toDate() || new Date(),
//           remarks: data.remarks ?? null,
//         } as Booking;
//       });
//       setBookings(bookingsData);
//       setLoading(false);
//     });

//     return () => unsubscribe();
//   }, []);

//   /* ------------------------- Load user details ------------------------- */
//   useEffect(() => {
//     const loadUsers = async () => {
//       const usersQuery = query(collection(db, 'users'));
//       const usersSnapshot = await getDocs(usersQuery);
//       const usersData: { [key: string]: User } = {};

//       usersSnapshot.docs.forEach((doc) => {
//         const data = doc.data() as any;
//         usersData[doc.id] = {
//           id: doc.id,
//           name: data.name || data.displayName || 'Unknown User',
//           email: data.email || '',
//           phone: data.phone || data.phoneNumber || '',
//         };
//       });

//       setUsers(usersData);
//     };

//     loadUsers();
//   }, []);

//   /* --------------------------- Filtering logic -------------------------- */
//   const filteredBookings = bookings.filter((booking) => {
//     const q = searchTerm.toLowerCase();
//     const matchesSearch =
//       booking.customerName.toLowerCase().includes(q) ||
//       booking.branch.toLowerCase().includes(q) ||
//       booking.services.some((s) => s.serviceName.toLowerCase().includes(q));

//     const matchesStatus = statusFilter === 'all' || booking.status === (statusFilter as BookingStatus);

//     return matchesSearch && matchesStatus;
//   });

//   /* --------------------------- Update helpers --------------------------- */
//   const updateBookingStatus = async (bookingId: string, newStatus: BookingStatus) => {
//     try {
//       const bookingRef = doc(db, 'bookings', bookingId);
//       await updateDoc(bookingRef, {
//         status: newStatus,
//         updatedAt: serverTimestamp(),
//       });
//     } catch (error) {
//       console.error('Error updating booking status:', error);
//       alert('Failed to update status.');
//     }
//   };

//   const getStatusBadge = (s: string) => {
//     switch (s) {
//       case 'upcoming':
//         return 'bg-blue-100 text-blue-800';
//       case 'past':
//         return 'bg-green-100 text-green-800';
//       case 'cancelled':
//         return 'bg-red-100 text-red-800';
//       default:
//         return 'bg-gray-100 text-gray-800';
//     }
//   };

//   const getStatusBlock = (s: BookingStatus) => {
//     switch (s) {
//       case 'upcoming':
//         return 'bg-emerald-50 border-emerald-300 text-emerald-800';
//       case 'past':
//         return 'bg-gray-50 border-gray-300 text-gray-700';
//       case 'cancelled':
//         return 'bg-rose-50 border-rose-300 text-rose-800 line-through';
//       default:
//         return 'bg-slate-50 border-slate-300 text-slate-800';
//     }
//   };

//   const getPaymentIcon = (method: string) => {
//     switch (method.toLowerCase()) {
//       case 'card':
//       case 'credit':
//       case 'debit':
//         return <CreditCard className="w-4 h-4" />;
//       default:
//         return <CreditCard className="w-4 h-4" />;
//     }
//   };

//   /* -------------------------- Create/Edit Handlers ------------------------- */

//   const resetForm = () => {
//     setBranch(BRANCH_OPTIONS[0]);
//     setServiceDate(format(new Date(), 'yyyy-MM-dd'));
//     setServiceTime('10:00');
//     setCustomerName('');
//     setPaymentMethod('cash');
//     setEmailConfirmation(false);
//     setSmsConfirmation(false);
//     setStatus('upcoming');
//     setStaff('');
//     setServices([{ ...emptyService }]);
//     setRemarks('');
//     setEditingId(null);
//   };

//   const openForCreate = () => {
//     resetForm();
//     setShowCreate(true);
//   };

//   // Open modal to CREATE, but prefill staff+time from a grid cell
//   const openForCreateFromCell = (prefillStaff: string, prefillTime: string) => {
//     // If hour disabled, do nothing
//     const hour = prefillTime.split(':')[0];
//     if (!enabledHours[hour]) return;

//     resetForm();
//     setStaff(prefillStaff);
//     setServiceTime(prefillTime);
//     // Set serviceDate to scheduleDate (board date)
//     setServiceDate(scheduleDate);
//     setShowCreate(true);
//   };

//   const openForEdit = (b: Booking) => {
//     setEditingId(b.id);
//     setBranch(b.branch || BRANCH_OPTIONS[0]);
//     setServiceDate(format(b.bookingDate, 'yyyy-MM-dd'));
//     setServiceTime(b.bookingTime || '10:00');
//     setCustomerName(b.customerName || '');
//     setPaymentMethod(b.paymentMethod || 'cash');
//     setEmailConfirmation(!!b.emailConfirmation);
//     setSmsConfirmation(!!b.smsConfirmation);
//     setStatus(b.status || 'upcoming');
//     setStaff(b.staff || '');
//     setServices(
//       b.services && b.services.length > 0
//         ? b.services.map((s) => ({
//             serviceId: s.serviceId || '',
//             serviceName: s.serviceName || '',
//             category: s.category || '',
//             duration: Number(s.duration) || 0,
//             price: Number(s.price) || 0,
//             quantity: Number(s.quantity) || 1,
//           }))
//         : [{ ...emptyService }]
//     );
//     setRemarks(b.remarks || '');
//     setShowCreate(true);
//   };

//   const handleAddServiceRow = () => {
//     setServices((prev) => [...prev, { ...emptyService }]);
//   };

//   const handleRemoveServiceRow = (index: number) => {
//     setServices((prev) => prev.filter((_, i) => i !== index));
//   };

//   const handleServiceChange = (
//     index: number,
//     field: keyof BookingService,
//     value: string | number
//   ) => {
//     setServices((prev) =>
//       prev.map((s, i) => (i === index ? { ...s, [field]: value } : s))
//     );
//   };

//   const formTotals = calcTotals(services);

//   const validateForm = () => {
//     if (!customerName.trim()) return 'Customer name is required';
//     if (!serviceDate) return 'Service date is required';
//     if (!serviceTime) return 'Service time is required';
//     if (!branch) return 'Branch is required';
//     if (!staff) return 'Staff is required';
//     if (services.length === 0) return 'Add at least one service';
//     const hasName = services.every((s) => s.serviceName.trim().length > 0);
//     if (!hasName) return 'Each service must have a name';
//     // also ensure selected time hour is enabled
//     const selectedHour = serviceTime.split(':')[0];
//     if (!enabledHours[selectedHour]) return 'Selected time falls into a disabled hour';
//     return null;
//   };

//   const saveBooking = async () => {
//     const err = validateForm();
//     if (err) {
//       alert(err);
//       return;
//     }

//     try {
//       setSaving(true);

//       const payload = {
//         userId: '',
//         customerName: customerName.trim(),
//         services: services.map((s) => ({
//           ...s,
//           price: Number(s.price) || 0,
//           duration: Number(s.duration) || 0,
//           quantity: Number(s.quantity) || 0,
//         })),
//         bookingDate: Timestamp.fromDate(new Date(serviceDate + 'T00:00:00')),
//         bookingTime: serviceTime, // "HH:mm"
//         branch,
//         staff: staff || null, // name string
//         totalPrice: formTotals.totalPrice,
//         totalDuration: formTotals.totalDuration,
//         status,
//         paymentMethod,
//         emailConfirmation,
//         smsConfirmation,
//         updatedAt: serverTimestamp(),
//         remarks: remarks || null,
//       };

//       if (editingId) {
//         const ref = doc(db, 'bookings', editingId);
//         await updateDoc(ref, payload);
//       } else {
//         await addDoc(collection(db, 'bookings'), {
//           ...payload,
//           createdAt: serverTimestamp(),
//         });
//       }

//       setShowCreate(false);
//       resetForm();
//     } catch (e) {
//       console.error('Error saving booking:', e);
//       alert('Failed to save booking. Check console for details.');
//     } finally {
//       setSaving(false);
//     }
//   };

//   const deleteBooking = async () => {
//     if (!editingId) return;
//     if (!confirm('Delete this booking? This action cannot be undone.')) return;

//     try {
//       setDeleting(true);
//       await deleteDoc(doc(db, 'bookings', editingId));
//       setShowCreate(false);
//       resetForm();
//     } catch (e) {
//       console.error('Error deleting booking:', e);
//       alert('Failed to delete booking.');
//     } finally {
//       setDeleting(false);
//     }
//   };

//   /* ------------------------------ Schedule Board Data ------------------------------ */

//   const bookingsForSchedule = useMemo(() => {
//     const target = new Date(scheduleDate + 'T00:00:00');
//     return bookings.filter((b) => {
//       const sameDay = isSameDay(b.bookingDate, target);
//       const branchOk = scheduleBranch === 'all' || b.branch === scheduleBranch;
//       return sameDay && branchOk;
//     });
//   }, [bookings, scheduleDate, scheduleBranch]);

//   // fast lookup: { 'HH:mm': { staffName: Booking[] } } but we need single cell show (first booking)
//   const scheduleMatrix = useMemo(() => {
//     const map: Record<string, Record<string, Booking[]>> = {};
//     TIMESLOTS.forEach((t) => {
//       map[t] = {};
//       STAFF_OPTIONS.forEach((s) => (map[t][s] = []));
//     });
//     bookingsForSchedule.forEach((b) => {
//       const t = b.bookingTime;
//       const s = b.staff || '';
//       if (t && s && map[t] && map[t][s] !== undefined) {
//         map[t][s].push(b);
//       }
//     });
//     return map;
//   }, [bookingsForSchedule, STAFF_OPTIONS]);

//   /* ------------------------------- Render ------------------------------ */

//   if (loading) {
//     return (
//       <div className="p-6">
//         <div className="max-w-7xl mx-auto">
//           <div className="flex items-center justify-center py-12">
//             <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600"></div>
//             <span className="ml-3 text-pink-600">Loading bookings...</span>
//           </div>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div>
  
     
//         {/* Header */}
//         <div className="mb-8 flex items-start sm:items-center justify-around gap-4">
//           <div>
//             <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
//               Customers
//             </h1>
//             <p className="text-gray-600 dark:text-white">
//               All Customers Data
//             </p>
//           </div>

          
//         </div>

//         {/* Schedule Board Controls */}
//         <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6 w-[1100px]">
//           <div className="grid grid-cols-1 md:grid-cols-4 gap-6 ">
//             <div className="flex items-center">
//               <Calendar className="w-5 h-5 text-gray-500 mr-2" />
//               <input
//                 type="date"
//                 value={scheduleDate}
//                 onChange={(e) => setScheduleDate(e.target.value)}
//                 className="w-full border rounded-md px-3 py-2"
//               />
//             </div>
//             <div className="flex items-center">
//               <MapPin className="w-5 h-5 text-gray-500 mr-2" />
//               <select
//                 value={scheduleBranch}
//                 onChange={(e) => setScheduleBranch(e.target.value)}
//                 className="w-full border rounded-md px-3 py-2"
//               >
//                 <option value="all">All Branches</option>
//                 {BRANCH_OPTIONS.map((b) => (
//                   <option key={b} value={b}>
//                     {b}
//                   </option>
//                 ))}
//               </select>
//             </div>

//             {/* Hour toggles: minimal UI addition, consistent with existing controls */}
//             <div className="md:col-span-2">
              
//             </div>
//           </div>
//         </div>

//  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6 w-[1100px]">
//           <div className="flex flex-col md:flex-row gap-4">
//             <div className="flex-1">
//               <div className="relative">
//                 <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
//                 <input
//                   type="text"
//                   placeholder="Search by customer name, branch, or service..."
//                   value={searchTerm}
//                   onChange={(e) => setSearchTerm(e.target.value)}
//                   className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
//                 />
//               </div>
//             </div>

//             <div className="md:w-48">
//               <select
//                 value={statusFilter}
//                 onChange={(e) => setStatusFilter(e.target.value)}
//                 className="w-full bg-black text-white px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
//               >
//                 <option value="all">All Status</option>
//                 <option value="upcoming">Upcoming</option>
//                 <option value="past">Past</option>
//                 <option value="cancelled">Cancelled</option>
//               </select>
//             </div>
//           </div>
//         </div>

      
          
    

//         {/* ======================== SCHEDULE BOARD (NEW ORIENTATION) ======================== */}
//         <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-x-auto mb-10 w-0">
//           {/* Grid: first column is time (sticky left), first row is header with staff (sticky top) */}
//           <div
//             className="min-w-[900px] relative"
//             style={{}}
//           >
            

//             {/* Body: rows for each timeslot */}
            
//                   <div className="">
//               {TIMESLOTS.map((t) => {
//                 const hour = t.split(':')[0];
//                 const hourEnabled = !!enabledHours[hour];

//                 return (
//                     <div
//                   key={t}
//                   className="grid"
//                   style={{ gridTemplateColumns: `180px repeat(${STAFF_OPTIONS.length}, 200px)` }}
//                 >

                         
                    
                  
//                 </div>
//               )}
//                 )}
//             </div>
//           </div>
//         </div>

//         {/* Filters and Search (List view) */}

//         {/* Bookings Table (click row to edit) */}
//         <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden w-[1150px]">
//           <div className="overflow-x-auto">
//             <table className="min-w-full divide-y divide-gray-200">
//               <thead className="bg-gray-50">
//                 <tr>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                     Customer
//                   </th>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                     Services
//                   </th>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                     Date & Time
//                   </th>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                     Staff
//                   </th>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                     Branch
//                   </th>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                     Payment
//                   </th>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                     Status
//                   </th>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                     Actions
//                   </th>
//                 </tr>
//               </thead>
//               <tbody className="bg-white divide-y divide-gray-200">
//                 {filteredBookings.map((booking) => {
//                   const user = users[booking.userId];
//                   return (
//                     <tr
//                       key={booking.id}
//                       className="hover:bg-gray-50 cursor-pointer"
//                       onClick={() => openForEdit(booking)}
//                     >
//                       <td className="px-6 py-4 whitespace-nowrap">
//                         <div className="flex items-center">
//                           <div className="flex-shrink-0 h-10 w-10">
//                             <div className="h-10 w-10 rounded-full bg-pink-100 flex items-center justify-center">
//                               <User className="h-5 w-5 text-pink-600" />
//                             </div>
//                           </div>
//                           <div className="ml-4">
//                             <div className="text-sm font-medium text-gray-900">
//                               {booking.customerName}
//                             </div>
//                             <div className="text-sm text-gray-500">
//                               {user?.email || 'No email'}
//                             </div>
//                           </div>
//                         </div>
//                       </td>
//                       <td className="px-6 py-4">
//                         <div className="text-sm text-gray-900">
//                           {booking.services.slice(0, 2).map((service, index) => (
//                             <div key={index} className="mb-1">
//                               {service.serviceName}{' '}
//                               {service.quantity > 1 && `(x${service.quantity})`}
//                             </div>
//                           ))}
//                           {booking.services.length > 2 && (
//                             <div className="text-xs text-gray-500">
//                               +{booking.services.length - 2} more
//                             </div>
//                           )}
//                         </div>
//                       </td>
//                       <td className="px-6 py-4 whitespace-nowrap">
//                         <div className="flex items-center text-sm text-gray-900">
//                           <Calendar className="w-4 h-4 mr-2 text-gray-400" />
//                           <div>
//                             <div>{format(booking.bookingDate, 'MMM dd, yyyy')}</div>
//                             <div className="text-xs text-gray-500 flex items-center mt-1">
//                               <Clock className="w-3 h-3 mr-1" />
//                               {toDisplayAMPM(booking.bookingTime)}
//                             </div>
//                           </div>
//                         </div>
//                       </td>
//                       <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
//                         {booking.staff || '—'}
//                       </td>
//                       <td className="px-6 py-4 whitespace-nowrap">
//                         <div className="flex items-center text-sm text-gray-900">
//                           <MapPin className="w-4 h-4 mr-2 text-gray-400" />
//                           {booking.branch}
//                         </div>
//                       </td>
//                       <td className="px-6 py-4 whitespace-nowrap">
//                         <div className="text-sm text-gray-900">
//                           <div className="flex items-center">
//                             {getPaymentIcon(booking.paymentMethod)}
//                             <span className="ml-2">${booking.totalPrice.toFixed(2)}</span>
//                           </div>
//                           <div className="text-xs text-gray-500 capitalize">
//                             {booking.paymentMethod}
//                           </div>
//                         </div>
//                       </td>
//                       <td className="px-6 py-4 whitespace-nowrap">
//                         <span
//                           className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full capitalize ${getStatusBadge(
//                             booking.status
//                           )}`}
//                         >
//                           {booking.status}
//                         </span>
//                       </td>
//                       <td
//                         className="px-6 py-4 whitespace-nowrap text-sm font-medium"
//                         onClick={(e) => e.stopPropagation()}
//                       >
//                         <div className="flex space-x-2">
//                           <button
//                             onClick={() => openForEdit(booking)}
//                             className="text-emerald-700 hover:text-emerald-900"
//                             title="Edit booking"
//                           >
//                             <Edit3 className="w-4 h-4" />
//                           </button>
//                           {booking.status === 'upcoming' && (
//                             <>
//                               <button
//                                 onClick={() => updateBookingStatus(booking.id, 'past')}
//                                 className="text-green-600 hover:text-green-900"
//                                 title="Mark as completed"
//                               >
//                                 <CheckCircle className="w-4 h-4" />
//                               </button>
//                               <button
//                                 onClick={() => updateBookingStatus(booking.id, 'cancelled')}
//                                 className="text-red-600 hover:text-red-900"
//                                 title="Cancel booking"
//                               >
//                                 <XCircle className="w-4 h-4" />
//                               </button>
//                             </>
//                           )}
//                         </div>
//                       </td>
//                     </tr>
//                   );
//                 })}
//               </tbody>
//             </table>
//           </div>

//           {filteredBookings.length === 0 && (
//             <div className="text-center py-12">
//               <Calendar className="mx-auto h-12 w-12 text-gray-400" />
//               <h3 className="mt-2 text-sm font-medium text-gray-900">No bookings found</h3>
//               <p className="mt-1 text-sm text-gray-500">
//                 {searchTerm || statusFilter !== 'all'
//                   ? 'Try adjusting your search or filter criteria.'
//                   : 'No bookings have been made yet.'}
//               </p>
//             </div>
//           )}
//         </div>

//         {/* ===================== CREATE / EDIT MODAL (PURE TAILWIND) ===================== */}
//         {showCreate && (
//           <div className="fixed inset-0 bg-gray-600 bg-opacity-50 z-50 overflow-y-auto h-full w-full">
//             <div className="relative top-10 mx-auto w-11/12 md:w-4/5 lg:w-3/4 xl:w-2/3">
//               <div className="bg-white rounded-lg shadow-xl border">
//                 {/* Header */}
//                 <div className="flex items-center justify-between px-6 py-4 border-b">
//                   <h3 className="text-lg font-semibold">
//                     {editingId ? 'Edit Schedule' : 'Add Schedule'}
//                   </h3>
//                   <div className="flex items-center gap-2">
//                     {editingId && (
//                       <button
//                         onClick={deleteBooking}
//                         disabled={deleting}
//                         className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-white bg-red-600 hover:bg-red-700 disabled:opacity-60"
//                         title="Delete booking"
//                       >
//                         <Trash2 className="w-4 h-4" />
//                         Delete
//                       </button>
//                     )}
//                     <button
//                       onClick={() => {
//                         setShowCreate(false);
//                         resetForm();
//                       }}
//                       className="text-gray-400 hover:text-gray-600"
//                       title="Close"
//                     >
//                       <XCircle className="w-6 h-6" />
//                     </button>
//                   </div>
//                 </div>

//                 {/* Body */}
//                 <div className="p-6 space-y-6">
//                   {/* Top selects */}
//                   <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
//                     <div>
//                       <label className="block text-sm font-medium text-gray-700">Branch</label>
//                       <select
//                         className="mt-1 w-full border rounded-md px-3 py-2"
//                         value={branch}
//                         onChange={(e) => setBranch(e.target.value)}
//                       >
//                         {BRANCH_OPTIONS.map((b) => (
//                           <option key={b} value={b}>
//                             {b}
//                           </option>
//                         ))}
//                       </select>
//                     </div>

//                     <div>
//                       <label className="block text-sm font-medium text-gray-700">Category</label>
//                       <select
//                         className="mt-1 w-full border rounded-md px-3 py-2"
//                         onChange={(e) => {
//                           setServices((prev) =>
//                             prev.map((s, i) => (i === 0 ? { ...s, category: e.target.value } : s))
//                           );
//                         }}
//                       >
//                         <option value="">Select One</option>
//                         {CATEGORY_OPTIONS.map((c) => (
//                           <option key={c} value={c}>
//                             {c}
//                           </option>
//                         ))}
//                       </select>
//                     </div>

//                     <div>
//                       <label className="block text-sm font-medium text-gray-700">Staff</label>
//                       <select
//                         className="mt-1 w-full border rounded-md px-3 py-2"
//                         value={staff}
//                         onChange={(e) => setStaff(e.target.value)}
//                       >
//                         <option value="">Select One</option>
//                         {STAFF_OPTIONS.map((s) => (
//                           <option key={s} value={s}>
//                             {s}
//                           </option>
//                         ))}
//                       </select>
//                     </div>

//                     <div>
//                       <label className="block text-sm font-medium text-gray-700">
//                         Payment Method
//                       </label>
//                       <select
//                         className="mt-1 w-full border rounded-md px-3 py-2"
//                         value={paymentMethod}
//                         onChange={(e) => setPaymentMethod(e.target.value)}
//                       >
//                         {PAYMENT_METHODS.map((p) => (
//                           <option key={p} value={p}>
//                             {p.toUpperCase()}
//                           </option>
//                         ))}
//                       </select>
//                     </div>
//                   </div>

//                   {/* Date & Time */}
//                   <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//                     <div>
//                       <label className="block text-sm font-medium text-gray-700">
//                         Service Date
//                       </label>
//                       <input
//                         type="date"
//                         className="mt-1 w-full border rounded-md px-3 py-2"
//                         value={serviceDate}
//                         onChange={(e) => setServiceDate(e.target.value)}
//                       />
//                     </div>
//                     <div>
//                       <label className="block text-sm font-medium text-gray-700">Time Slot</label>
//                       <select
//                         className="mt-1 w-full border rounded-md px-3 py-2"
//                         value={serviceTime}
//                         onChange={(e) => setServiceTime(e.target.value)}
//                       >
//                         {TIMESLOTS.filter(slot => {
//                           // only show slots whose hour is enabled
//                           const hour = slot.split(':')[0];
//                           return !!enabledHours[hour];
//                         }).map((slot) => (
//                           <option key={slot} value={slot}>
//                             {toDisplayAMPM(slot)}
//                           </option>
//                         ))}
//                       </select>
//                     </div>
//                     <div>
//                       <label className="block text-sm font-medium text-gray-700">Customer</label>
//                       <input
//                         type="text"
//                         placeholder="Customer name"
//                         className="mt-1 w-full border rounded-md px-3 py-2"
//                         value={customerName}
//                         onChange={(e) => setCustomerName(e.target.value)}
//                       />
//                     </div>
//                   </div>

//                   {/* Services table */}
//                   <div className="border rounded-lg">
//                     <div className="grid grid-cols-12 gap-2 px-4 py-3 bg-gray-50 text-xs font-semibold">
//                       <div className="col-span-4">Service</div>
//                       <div className="col-span-2">Category</div>
//                       <div className="col-span-2">Duration (min)</div>
//                       <div className="col-span-2">Price</div>
//                       <div className="col-span-1">Qty</div>
//                       <div className="col-span-1 text-right">—</div>
//                     </div>

//                     {services.map((s, idx) => (
//                       <div key={idx} className="grid grid-cols-12 gap-2 px-4 py-3 border-t">
//                         <div className="col-span-4">
//                           <input
//                             className="w-full border rounded-md px-3 py-2"
//                             placeholder="Service name"
//                             value={s.serviceName}
//                             onChange={(e) => handleServiceChange(idx, 'serviceName', e.target.value)}
//                           />
//                         </div>
//                         <div className="col-span-2">
//                           <select
//                             className="w-full border rounded-md px-3 py-2"
//                             value={s.category}
//                             onChange={(e) => handleServiceChange(idx, 'category', e.target.value)}
//                           >
//                             <option value="">Select</option>
//                             {CATEGORY_OPTIONS.map((c) => (
//                               <option key={c} value={c}>
//                                 {c}
//                               </option>
//                             ))}
//                           </select>
//                         </div>
//                         <div className="col-span-2">
//                           <input
//                             type="number"
//                             min={0}
//                             className="w-full border rounded-md px-3 py-2"
//                             value={s.duration}
//                             onChange={(e) =>
//                               handleServiceChange(idx, 'duration', Number(e.target.value || 0))
//                             }
//                           />
//                         </div>
//                         <div className="col-span-2">
//                           <input
//                             type="number"
//                             min={0}
//                             step="0.01"
//                             className="w-full border rounded-md px-3 py-2"
//                             value={s.price}
//                             onChange={(e) =>
//                               handleServiceChange(idx, 'price', Number(e.target.value || 0))
//                             }
//                           />
//                         </div>
//                         <div className="col-span-1">
//                           <input
//                             type="number"
//                             min={1}
//                             className="w-full border rounded-md px-3 py-2"
//                             value={s.quantity}
//                             onChange={(e) =>
//                               handleServiceChange(idx, 'quantity', Number(e.target.value || 1))
//                             }
//                           />
//                         </div>
//                         <div className="col-span-1 flex justify-end items-center">
//                           {services.length > 1 && (
//                             <button
//                               onClick={() => handleRemoveServiceRow(idx)}
//                               className="p-2 rounded hover:bg-red-50 text-red-600"
//                               title="Remove"
//                             >
//                               <Trash2 className="w-4 h-4" />
//                             </button>
//                           )}
//                         </div>
//                       </div>
//                     ))}

//                     <div className="px-4 py-3 border-t flex justify-between items-center">
//                       <button
//                         onClick={handleAddServiceRow}
//                         className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
//                       >
//                         <Plus className="w-4 h-4" />
//                         Add more service
//                       </button>

//                       <div className="text-sm text-gray-700">
//                         <span className="mr-4">
//                           <strong>Total Duration:</strong> {formTotals.totalDuration} min
//                         </span>
//                         <span>
//                           <strong>Total Price:</strong> ${formTotals.totalPrice.toFixed(2)}
//                         </span>
//                       </div>
//                     </div>
//                   </div>

//                   {/* Remarks & toggles */}
//                   <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//                     <div className="md:col-span-2">
//                       <label className="block text-sm font-medium text-gray-700">
//                         Remarks (optional)
//                       </label>
//                       <textarea
//                         className="mt-1 w-full border rounded-md px-3 py-2 min-h-[80px]"
//                         value={remarks}
//                         onChange={(e) => setRemarks(e.target.value)}
//                       />
//                     </div>
//                     <div className="space-y-4">
//                       <div className="flex items-center justify-between border rounded-md px-3 py-2">
//                         <span className="text-sm">Send booking notification by email</span>
//                         <input
//                           type="checkbox"
//                           checked={emailConfirmation}
//                           onChange={(e) => setEmailConfirmation(e.target.checked)}
//                         />
//                       </div>
//                       <div className="flex items-center justify-between border rounded-md px-3 py-2">
//                         <span className="text-sm">Send booking notification by SMS</span>
//                         <input
//                           type="checkbox"
//                           checked={smsConfirmation}
//                           onChange={(e) => setSmsConfirmation(e.target.checked)}
//                         />
//                       </div>
//                       <div>
//                         <label className="block text-sm font-medium text-gray-700">
//                           Application Status
//                         </label>
//                         <select
//                           className="mt-1 w-full border rounded-md px-3 py-2"
//                           value={status}
//                           onChange={(e) => setStatus(e.target.value as BookingStatus)}
//                         >
//                           <option value="upcoming">Approved (Upcoming)</option>
//                           <option value="past">Completed (Past)</option>
//                           <option value="cancelled">Cancelled</option>
//                         </select>
//                       </div>
//                     </div>
//                   </div>
//                 </div>

//                 {/* Footer */}
//                 <div className="px-6 py-4 border-t flex justify-end gap-3">
//                   <button
//                     onClick={() => {
//                       setShowCreate(false);
//                       resetForm();
//                     }}
//                     className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
//                     disabled={saving || deleting}
//                   >
//                     Close
//                   </button>
//                   <button
//                     onClick={saveBooking}
//                     className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-md hover:bg-emerald-700 disabled:opacity-60"
//                     disabled={saving || deleting}
//                   >
//                     {saving ? (editingId ? 'Updating...' : 'Saving...') : editingId ? 'Update' : 'Save'}
//                   </button>
//                 </div>
//               </div>
//             </div>
//           </div>
//         )}
//         {/* =================== END CREATE / EDIT MODAL =================== */}
//       </div>

   
//   );
// }

// new code

// 'use client';

// import { useState, useEffect, useMemo } from 'react';
// import AccessWrapper from '@/components/AccessWrapper';




// import {
//   collection,
//   query,
//   orderBy,
//   onSnapshot,
//   doc,
//   updateDoc,
//   Timestamp,
//   getDocs,
//   addDoc,
//   serverTimestamp,
//   deleteDoc,
// } from 'firebase/firestore';
// import { db } from '@/lib/firebase';
// import {
//   Calendar,
//   Clock,
//   MapPin,
//   User,
//   CreditCard,
//   Search,
//   CheckCircle,
//   XCircle,
//   AlertCircle,
//   Plus,
//   Trash2,
//   Edit3,
// } from 'lucide-react';
// import { format, isSameDay } from 'date-fns';

// /* ----------------------------- Types ----------------------------- */

// interface BookingService {
//   serviceId?: string;
//   serviceName: string;
//   category: string;
//   duration: number; // minutes
//   price: number; // per unit
//   quantity: number;
// }

// type BookingStatus = 'upcoming' | 'past' | 'cancelled';

// interface Booking {
//   id: string;
//   userId: string;
//   customerName: string;
//   services: BookingService[];
//   bookingDate: Date;
//   bookingTime: string; // "HH:mm"
//   branch: string;
//   staff: string | null; // name string
//   totalPrice: number;
//   totalDuration: number;
//   status: BookingStatus;
//   paymentMethod: string;
//   emailConfirmation: boolean;
//   smsConfirmation: boolean;
//   createdAt: Date;
//   updatedAt: Date;
//   remarks?: string | null;
// }

// interface User {
//   id: string;
//   name: string;
//   email: string;
//   phone: string;
// }

// /* --------------------------- Constants --------------------------- */

// const BRANCH_OPTIONS = ['Al Bustan','Marina','TECOM','AL Muraqabat','IBN Batutta Mall'];
// const CATEGORY_OPTIONS = ['Facial', 'Hair', 'Nails', 'Lashes', 'Massage'];
// const PAYMENT_METHODS = ['cash', 'card'];

// // Fallback staff list (used only if Firestore `staff` collection not available)
// const STAFF_FALLBACK = ['Komal', 'Shameem', 'Do Thi Kim', 'Alishba'];

// /* ------------------------- Helper functions ---------------------- */

// const emptyService: BookingService = {
//   serviceId: '',
//   serviceName: '',
//   category: '',
//   duration: 30,
//   price: 0,
//   quantity: 1,
// };

// function calcTotals(services: BookingService[]) {
//   const totalPrice = services.reduce(
//     (sum, s) => sum + (Number(s.price) || 0) * (Number(s.quantity) || 0),
//     0
//   );
//   const totalDuration = services.reduce(
//     (sum, s) => sum + (Number(s.duration) || 0) * (Number(s.quantity) || 0),
//     0
//   );
//   return { totalPrice, totalDuration };
// }

// function minutesToHHMM(mins: number) {
//   const h = Math.floor(mins / 60)
//     .toString()
//     .padStart(2, '0');
//   const m = (mins % 60).toString().padStart(2, '0');
//   return `${h}:${m}`;
// }

// function toDisplayAMPM(hhmm: string) {
//   const [hStr, m] = hhmm.split(':');
//   let h = Number(hStr);
//   const suffix = h >= 12 ? 'PM' : 'AM';
//   if (h === 0) h = 12;
//   if (h > 12) h = h - 12;
//   return `${h}:${m} ${suffix}`;
// }

// function generateTimeSlots(
//   // start = 10 * 60, // 10:00
//   // end = 22 * 60, // 22:00 (10:00 PM)
//   // step = 15 // 15 mins
//     start = 0, // 10:00
//   end = 12 * 120, // 22:00 (10:00 PM)
//   step = 15 // 15 mins
// ) {
//   const slots: string[] = [];
//   for (let t = start; t <= end; t += step) {
//     slots.push(minutesToHHMM(t));
//   }
//   return slots;
// }

// // EXACT requirement: 10:00 AM → 10:00 PM (15-min steps)
// const TIMESLOTS = generateTimeSlots();

// /* =========================== Component =========================== */

// export default function BookingsPage() {
//   const [bookings, setBookings] = useState<Booking[]>([]);
//   const [users, setUsers] = useState<{ [key: string]: User }>({});
//   const [loading, setLoading] = useState(true);
//   const [searchTerm, setSearchTerm] = useState('');
//   const [statusFilter, setStatusFilter] = useState<string>('all');

//   // Create/Edit modal
//   const [showCreate, setShowCreate] = useState(false);
//   const [saving, setSaving] = useState(false);
//   const [deleting, setDeleting] = useState(false);
//   const [editingId, setEditingId] = useState<string | null>(null);

//   // form state
//   const [branch, setBranch] = useState(BRANCH_OPTIONS[0]);
//   const [serviceDate, setServiceDate] = useState<string>(() =>
//     format(new Date(), 'yyyy-MM-dd')
//   );
//   const [serviceTime, setServiceTime] = useState<string>('10:00'); // "HH:mm"
//   const [customerName, setCustomerName] = useState<string>('');
//   const [paymentMethod, setPaymentMethod] = useState<string>('cash');
//   const [emailConfirmation, setEmailConfirmation] = useState(false);
//   const [smsConfirmation, setSmsConfirmation] = useState(false);
//   const [status, setStatus] = useState<BookingStatus>('upcoming');
//   const [staff, setStaff] = useState<string>('');
//   const [services, setServices] = useState<BookingService[]>([{ ...emptyService }]);
//   const [remarks, setRemarks] = useState<string>('');
// // new code



// // new code
//   // Schedule board controls
//   const [scheduleDate, setScheduleDate] = useState<string>(() =>
//     format(new Date(), 'yyyy-MM-dd')
//   );
//   const [scheduleBranch, setScheduleBranch] = useState<string>('all');

//   // Dynamic staff fetched from Firestore
//   const [staffFromDB, setStaffFromDB] = useState<string[]>([]);

//   // Hour enabled/disabled state (keyed by hour string, e.g. "10", "11", "12")
//   const uniqueHours = Array.from(new Set(TIMESLOTS.map((t) => t.split(':')[0]))).sort(
//     (a, b) => Number(a) - Number(b)
//   );
//   const [enabledHours, setEnabledHours] = useState<Record<string, boolean>>(() => {
//     const map: Record<string, boolean> = {};
//     uniqueHours.forEach((h) => (map[h] = true));
//     return map;
//   });

//   /* -------------------- Load Staff from Firebase -------------------- */
//   useEffect(() => {
//     // Will use `staff` collection: each doc should have { name: string, active?: boolean }
//     const loadStaff = async () => {
//       try {
//         const snap = await getDocs(collection(db, 'staff'));
//         const list: string[] = [];
//         snap.forEach((d) => {
//           const data = d.data() as any;
//           if (data?.name) list.push(String(data.name));
//         });
//         // If no staff docs found, we fallback to your previous constants
//         setStaffFromDB(list.length ? list : STAFF_FALLBACK);
//       } catch {
//         // Safe fallback
//         setStaffFromDB(STAFF_FALLBACK);
//       }
//     };
//     loadStaff();
//   }, []);

//   const STAFF_OPTIONS = staffFromDB; // used everywhere below

//   /* -------------------- Load bookings (Realtime) -------------------- */
//   useEffect(() => {
//     const bookingsQuery = query(collection(db, 'bookings'), orderBy('createdAt', 'desc'));

//     const unsubscribe = onSnapshot(bookingsQuery, (snapshot) => {
//       const bookingsData = snapshot.docs.map((d) => {
//         const data = d.data() as any;
//         return {
//           id: d.id,
//           userId: data.userId || '',
//           customerName: data.customerName || '',
//           services: (data.services || []) as BookingService[],
//           bookingDate: data.bookingDate?.toDate() || new Date(),
//           bookingTime: data.bookingTime || '',
//           branch: data.branch || '',
//           staff: data.staff ?? null,
//           totalPrice: data.totalPrice || 0,
//           totalDuration: data.totalDuration || 0,
//           status: (data.status as BookingStatus) || 'upcoming',
//           paymentMethod: data.paymentMethod || 'cash',
//           emailConfirmation: data.emailConfirmation || false,
//           smsConfirmation: data.smsConfirmation || false,
//           createdAt: data.createdAt?.toDate() || new Date(),
//           updatedAt: data.updatedAt?.toDate() || new Date(),
//           remarks: data.remarks ?? null,
//         } as Booking;
//       });
//       setBookings(bookingsData);
//       setLoading(false);
//     });

//     return () => unsubscribe();
//   }, []);

//   /* ------------------------- Load user details ------------------------- */
//   useEffect(() => {
//     const loadUsers = async () => {
//       const usersQuery = query(collection(db, 'users'));
//       const usersSnapshot = await getDocs(usersQuery);
//       const usersData: { [key: string]: User } = {};

//       usersSnapshot.docs.forEach((doc) => {
//         const data = doc.data() as any;
//         usersData[doc.id] = {
//           id: doc.id,
//           name: data.name || data.displayName || 'Unknown User',
//           email: data.email || '',
//           phone: data.phone || data.phoneNumber || '',
//         };
//       });

//       setUsers(usersData);
//     };

//     loadUsers();
//   }, []);

//   /* --------------------------- Filtering logic -------------------------- */
//   const filteredBookings = bookings.filter((booking) => {
//     const q = searchTerm.toLowerCase();
//     const matchesSearch =
//       booking.customerName.toLowerCase().includes(q) ||
//       booking.branch.toLowerCase().includes(q) ||
//       booking.services.some((s) => s.serviceName.toLowerCase().includes(q));

//     const matchesStatus = statusFilter === 'all' || booking.status === (statusFilter as BookingStatus);

//     return matchesSearch && matchesStatus;
//   });

//   /* --------------------------- Update helpers --------------------------- */
//   const updateBookingStatus = async (bookingId: string, newStatus: BookingStatus) => {
//     try {
//       const bookingRef = doc(db, 'bookings', bookingId);
//       await updateDoc(bookingRef, {
//         status: newStatus,
//         updatedAt: serverTimestamp(),
//       });
//     } catch (error) {
//       console.error('Error updating booking status:', error);
//       alert('Failed to update status.');
//     }
//   };

//   const getStatusBadge = (s: string) => {
//     switch (s) {
//       case 'upcoming':
//         return 'bg-blue-100 text-blue-800';
//       case 'past':
//         return 'bg-green-100 text-green-800';
//       case 'cancelled':
//         return 'bg-red-100 text-red-800';
//       default:
//         return 'bg-gray-100 text-gray-800';
//     }
//   };

//   const getStatusBlock = (s: BookingStatus) => {
//     switch (s) {
//       case 'upcoming':
//         return 'bg-emerald-50 border-emerald-300 text-emerald-800';
//       case 'past':
//         return 'bg-gray-50 border-gray-300 text-gray-700';
//       case 'cancelled':
//         return 'bg-rose-50 border-rose-300 text-rose-800 line-through';
//       default:
//         return 'bg-slate-50 border-slate-300 text-slate-800';
//     }
//   };

//   const getPaymentIcon = (method: string) => {
//     switch (method.toLowerCase()) {
//       case 'card':
//       case 'credit':
//       case 'debit':
//         return <CreditCard className="w-4 h-4" />;
//       default:
//         return <CreditCard className="w-4 h-4" />;
//     }
//   };

//   /* -------------------------- Create/Edit Handlers ------------------------- */

//   const resetForm = () => {
//     setBranch(BRANCH_OPTIONS[0]);
//     setServiceDate(format(new Date(), 'yyyy-MM-dd'));
//     setServiceTime('10:00');
//     setCustomerName('');
//     setPaymentMethod('cash');
//     setEmailConfirmation(false);
//     setSmsConfirmation(false);
//     setStatus('upcoming');
//     setStaff('');
//     setServices([{ ...emptyService }]);
//     setRemarks('');
//     setEditingId(null);
//   };

//   const openForCreate = () => {
//     resetForm();
//     setShowCreate(true);
//   };

//   // Open modal to CREATE, but prefill staff+time from a grid cell
//   const openForCreateFromCell = (prefillStaff: string, prefillTime: string) => {
//     // If hour disabled, do nothing
//     const hour = prefillTime.split(':')[0];
//     if (!enabledHours[hour]) return;

//     resetForm();
//     setStaff(prefillStaff);
//     setServiceTime(prefillTime);
//     // Set serviceDate to scheduleDate (board date)
//     setServiceDate(scheduleDate);
//     setShowCreate(true);
//   };

//   const openForEdit = (b: Booking) => {
//     setEditingId(b.id);
//     setBranch(b.branch || BRANCH_OPTIONS[0]);
//     setServiceDate(format(b.bookingDate, 'yyyy-MM-dd'));
//     setServiceTime(b.bookingTime || '10:00');
//     setCustomerName(b.customerName || '');
//     setPaymentMethod(b.paymentMethod || 'cash');
//     setEmailConfirmation(!!b.emailConfirmation);
//     setSmsConfirmation(!!b.smsConfirmation);
//     setStatus(b.status || 'upcoming');
//     setStaff(b.staff || '');
//     setServices(
//       b.services && b.services.length > 0
//         ? b.services.map((s) => ({
//             serviceId: s.serviceId || '',
//             serviceName: s.serviceName || '',
//             category: s.category || '',
//             duration: Number(s.duration) || 0,
//             price: Number(s.price) || 0,
//             quantity: Number(s.quantity) || 1,
//           }))
//         : [{ ...emptyService }]
//     );
//     setRemarks(b.remarks || '');
//     setShowCreate(true);
//   };

//   const handleAddServiceRow = () => {
//     setServices((prev) => [...prev, { ...emptyService }]);
//   };

//   const handleRemoveServiceRow = (index: number) => {
//     setServices((prev) => prev.filter((_, i) => i !== index));
//   };

//   const handleServiceChange = (
//     index: number,
//     field: keyof BookingService,
//     value: string | number
//   ) => {
//     setServices((prev) =>
//       prev.map((s, i) => (i === index ? { ...s, [field]: value } : s))
//     );
//   };

//   const formTotals = calcTotals(services);

//   const validateForm = () => {
//     if (!customerName.trim()) return 'Customer name is required';
//     if (!serviceDate) return 'Service date is required';
//     if (!serviceTime) return 'Service time is required';
//     if (!branch) return 'Branch is required';
//     if (!staff) return 'Staff is required';
//     if (services.length === 0) return 'Add at least one service';
//     const hasName = services.every((s) => s.serviceName.trim().length > 0);
//     if (!hasName) return 'Each service must have a name';
//     // also ensure selected time hour is enabled
//     const selectedHour = serviceTime.split(':')[0];
//     if (!enabledHours[selectedHour]) return 'Selected time falls into a disabled hour';
//     return null;
//   };
// const saveBooking = async () => {
//   const err = validateForm();
//   if (err) {
//     alert(err);
//     return;
//   }

//   try {
//     setSaving(true);

//     const payload = {
//       userId: users && Object.keys(users).length > 0 ? Object.keys(users)[0] : "", // 👈 ensure userId always saved
//       customerName: customerName.trim(),
//       services: services.map((s) => ({
//         ...s,
//         price: Number(s.price) || 0,
//         duration: Number(s.duration) || 0,
//         quantity: Number(s.quantity) || 0,
//       })),
//       bookingDate: Timestamp.fromDate(new Date(serviceDate + 'T00:00:00')),
//       bookingTime: serviceTime, // "HH:mm"
//       branch,
//       staff: staff || null, // name string
//       totalPrice: formTotals.totalPrice,
//       totalDuration: formTotals.totalDuration,
//       status,
//       paymentMethod,
//       emailConfirmation,
//       smsConfirmation,
//       updatedAt: serverTimestamp(),
//       remarks: remarks || null,
//     };

//     if (editingId) {
//       const ref = doc(db, 'bookings', editingId);
//       await updateDoc(ref, payload);
//     } else {
//       await addDoc(collection(db, 'bookings'), {
//         ...payload,
//         createdAt: serverTimestamp(),
//       });
//     }

//     setShowCreate(false);
//     resetForm();
//   } catch (e) {
//     console.error('Error saving booking:', e);
//     alert('Failed to save booking. Check console for details.');
//   } finally {
//     setSaving(false);
//   }
// };

  

//   const deleteBooking = async () => {
//     if (!editingId) return;
//     if (!confirm('Delete this booking? This action cannot be undone.')) return;

//     try {
//       setDeleting(true);
//       await deleteDoc(doc(db, 'bookings', editingId));
//       setShowCreate(false);
//       resetForm();
//     } catch (e) {
//       console.error('Error deleting booking:', e);
//       alert('Failed to delete booking.');
//     } finally {
//       setDeleting(false);
//     }
//   };

//   /* ------------------------------ Schedule Board Data ------------------------------ */

//   const bookingsForSchedule = useMemo(() => {
//     const target = new Date(scheduleDate + 'T00:00:00');
//     return bookings.filter((b) => {
//       const sameDay = isSameDay(b.bookingDate, target);
//       const branchOk = scheduleBranch === 'all' || b.branch === scheduleBranch;
//       return sameDay && branchOk;
//     });
//   }, [bookings, scheduleDate, scheduleBranch]);

//   // fast lookup: { 'HH:mm': { staffName: Booking[] } } but we need single cell show (first booking)
//   const scheduleMatrix = useMemo(() => {
//     const map: Record<string, Record<string, Booking[]>> = {};
//     TIMESLOTS.forEach((t) => {
//       map[t] = {};
//       STAFF_OPTIONS.forEach((s) => (map[t][s] = []));
//     });
//     bookingsForSchedule.forEach((b) => {
//       const t = b.bookingTime;
//       const s = b.staff || '';
//       if (t && s && map[t] && map[t][s] !== undefined) {
//         map[t][s].push(b);
//       }
//     });
//     return map;
//   }, [bookingsForSchedule, STAFF_OPTIONS]);

//   /* ------------------------------- Render ------------------------------ */

//   if (loading) {
//     return (
//       <div className="p-6">
//         <div className="max-w-7xl mx-auto">
//           <div className="flex items-center justify-center py-12">
//             <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600"></div>
//             <span className="ml-3 text-pink-600">Loading bookings...</span>
//           </div>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div>
  
     
//         {/* Header */}
//         <div className="mb-8 flex items-start sm:items-center justify-around gap-4">
//           <div>
//             <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
//               Customers
//             </h1>
//             <p className="text-gray-600 dark:text-white">
//               All Customers Data
//             </p>
//           </div>

          
//         </div>

//         {/* Schedule Board Controls */}
//         <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6 w-[1100px]">
//           <div className="grid grid-cols-1 md:grid-cols-4 gap-6 ">
//             <div className="flex items-center">
//               <Calendar className="w-5 h-5 text-gray-500 mr-2" />
//               <input
//                 type="date"
//                 value={scheduleDate}
//                 onChange={(e) => setScheduleDate(e.target.value)}
//                 className="w-full border rounded-md px-3 py-2"
//               />
//             </div>
//             <div className="flex items-center">
//               <MapPin className="w-5 h-5 text-gray-500 mr-2" />
//               <select
//                 value={scheduleBranch}
//                 onChange={(e) => setScheduleBranch(e.target.value)}
//                 className="w-full border rounded-md px-3 py-2"
//               >
//                 <option value="all">All Branches</option>
//                 {BRANCH_OPTIONS.map((b) => (
//                   <option key={b} value={b}>
//                     {b}
//                   </option>
//                 ))}
//               </select>
//             </div>

//             {/* Hour toggles: minimal UI addition, consistent with existing controls */}
//             <div className="md:col-span-2">
              
//             </div>
//           </div>
//         </div>

//  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6 w-[1100px]">
//           <div className="flex flex-col md:flex-row gap-4">
//             <div className="flex-1">
//               <div className="relative">
//                 <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
//                 <input
//                   type="text"
//                   placeholder="Search by customer name, branch, or service..."
//                   value={searchTerm}
//                   onChange={(e) => setSearchTerm(e.target.value)}
//                   className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
//                 />
//               </div>
//             </div>

//             <div className="md:w-48">
//               <select
//                 value={statusFilter}
//                 onChange={(e) => setStatusFilter(e.target.value)}
//                 className="w-full bg-black text-white px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
//               >
//                 <option value="all">All Status</option>
//                 <option value="upcoming">Upcoming</option>
//                 <option value="past">Past</option>
//                 <option value="cancelled">Cancelled</option>
//               </select>
//             </div>
//           </div>
//         </div>

      
          
    

//         {/* ======================== SCHEDULE BOARD (NEW ORIENTATION) ======================== */}
//         <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-x-auto mb-10 w-0">
//           {/* Grid: first column is time (sticky left), first row is header with staff (sticky top) */}
//           <div
//             className="min-w-[900px] relative"
//             style={{}}
//           >
            

//             {/* Body: rows for each timeslot */}
            
//                   <div className="">
//               {TIMESLOTS.map((t) => {
//                 const hour = t.split(':')[0];
//                 const hourEnabled = !!enabledHours[hour];

//                 return (
//                     <div
//                   key={t}
//                   className="grid"
//                   style={{ gridTemplateColumns: `180px repeat(${STAFF_OPTIONS.length}, 200px)` }}
//                 >

                         
                    
                  
//                 </div>
//               )}
//                 )}
//             </div>
//           </div>
//         </div>

//         {/* Filters and Search (List view) */}

//         {/* Bookings Table (click row to edit) */}
//         <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden w-[1150px]">
//           <div className="overflow-x-auto">
//             <table className="min-w-full divide-y divide-gray-200">
//               <thead className="bg-gray-50">
//                 <tr>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                     Customer
//                   </th>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                     Services
//                   </th>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                     Date & Time
//                   </th>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                     Staff
//                   </th>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                     Branch
//                   </th>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                     Payment
//                   </th>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                     Status
//                   </th>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                     Actions
//                   </th>
//                 </tr>
//               </thead>
//               <tbody className="bg-white divide-y divide-gray-200">
//                 {filteredBookings.map((booking) => {
//                   const user = users[booking.userId];
//                   return (
//                     <tr
//                       key={booking.id}
//                       className="hover:bg-gray-50 cursor-pointer"
//                       onClick={() => openForEdit(booking)}
//                     >
//                       <td className="px-6 py-4 whitespace-nowrap">
//                         <div className="flex items-center">
//                           <div className="flex-shrink-0 h-10 w-10">
//                             <div className="h-10 w-10 rounded-full bg-pink-100 flex items-center justify-center">
//                               <User className="h-5 w-5 text-pink-600" />
//                             </div>
//                           </div>
//                           <div className="ml-4">
//                             <div className="text-sm font-medium text-gray-900">
//                               {booking.customerName}
//                             </div>
//                             <div className="text-sm text-gray-500">
//                               {user?.email || 'No email'}
//                             </div>
//                           </div>
//                         </div>
//                       </td>
//                       <td className="px-6 py-4">
//                         <div className="text-sm text-gray-900">
//                           {booking.services.slice(0, 2).map((service, index) => (
//                             <div key={index} className="mb-1">
//                               {service.serviceName}{' '}
//                               {service.quantity > 1 && `(x${service.quantity})`}
//                             </div>
//                           ))}
//                           {booking.services.length > 2 && (
//                             <div className="text-xs text-gray-500">
//                               +{booking.services.length - 2} more
//                             </div>
//                           )}
//                         </div>
//                       </td>
//                       <td className="px-6 py-4 whitespace-nowrap">
//                         <div className="flex items-center text-sm text-gray-900">
//                           <Calendar className="w-4 h-4 mr-2 text-gray-400" />
//                           <div>
//                             <div>{format(booking.bookingDate, 'MMM dd, yyyy')}</div>
//                             <div className="text-xs text-gray-500 flex items-center mt-1">
//                               <Clock className="w-3 h-3 mr-1" />
//                               {toDisplayAMPM(booking.bookingTime)}
//                             </div>
//                           </div>
//                         </div>
//                       </td>
//                       <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
//                         {booking.staff || '—'}
//                       </td>
//                       <td className="px-6 py-4 whitespace-nowrap">
//                         <div className="flex items-center text-sm text-gray-900">
//                           <MapPin className="w-4 h-4 mr-2 text-gray-400" />
//                           {booking.branch}
//                         </div>
//                       </td>
//                       <td className="px-6 py-4 whitespace-nowrap">
//                         <div className="text-sm text-gray-900">
//                           <div className="flex items-center">
//                             {getPaymentIcon(booking.paymentMethod)}
//                             <span className="ml-2">${booking.totalPrice.toFixed(2)}</span>
//                           </div>
//                           <div className="text-xs text-gray-500 capitalize">
//                             {booking.paymentMethod}
//                           </div>
//                         </div>
//                       </td>
//                       <td className="px-6 py-4 whitespace-nowrap">
//                         <span
//                           className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full capitalize ${getStatusBadge(
//                             booking.status
//                           )}`}
//                         >
//                           {booking.status}
//                         </span>
//                       </td>
//                       <td
//                         className="px-6 py-4 whitespace-nowrap text-sm font-medium"
//                         onClick={(e) => e.stopPropagation()}
//                       >
//                         <div className="flex space-x-2">
//                           <button
//                             onClick={() => openForEdit(booking)}
//                             className="text-emerald-700 hover:text-emerald-900"
//                             title="Edit booking"
//                           >
//                             <Edit3 className="w-4 h-4" />
//                           </button>
//                           {booking.status === 'upcoming' && (
//                             <>
//                               <button
//                                 onClick={() => updateBookingStatus(booking.id, 'past')}
//                                 className="text-green-600 hover:text-green-900"
//                                 title="Mark as completed"
//                               >
//                                 <CheckCircle className="w-4 h-4" />
//                               </button>
//                               <button
//                                 onClick={() => updateBookingStatus(booking.id, 'cancelled')}
//                                 className="text-red-600 hover:text-red-900"
//                                 title="Cancel booking"
//                               >
//                                 <XCircle className="w-4 h-4" />
//                               </button>
//                             </>
//                           )}
//                         </div>
//                       </td>
//                     </tr>
//                   );
//                 })}
//               </tbody>
//             </table>
//           </div>

//           {filteredBookings.length === 0 && (
//             <div className="text-center py-12">
//               <Calendar className="mx-auto h-12 w-12 text-gray-400" />
//               <h3 className="mt-2 text-sm font-medium text-gray-900">No bookings found</h3>
//               <p className="mt-1 text-sm text-gray-500">
//                 {searchTerm || statusFilter !== 'all'
//                   ? 'Try adjusting your search or filter criteria.'
//                   : 'No bookings have been made yet.'}
//               </p>
//             </div>
//           )}
//         </div>

//         {/* ===================== CREATE / EDIT MODAL (PURE TAILWIND) ===================== */}
//         {showCreate && (
//           <div className="fixed inset-0 bg-gray-600 bg-opacity-50 z-50 overflow-y-auto h-full w-full">
//             <div className="relative top-10 mx-auto w-11/12 md:w-4/5 lg:w-3/4 xl:w-2/3">
//               <div className="bg-white rounded-lg shadow-xl border">
//                 {/* Header */}
//                 <div className="flex items-center justify-between px-6 py-4 border-b">
//                   <h3 className="text-lg font-semibold">
//                     {editingId ? 'Edit Schedule' : 'Add Schedule'}
//                   </h3>
//                   <div className="flex items-center gap-2">
//                     {editingId && (
//                       <button
//                         onClick={deleteBooking}
//                         disabled={deleting}
//                         className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-white bg-red-600 hover:bg-red-700 disabled:opacity-60"
//                         title="Delete booking"
//                       >
//                         <Trash2 className="w-4 h-4" />
//                         Delete
//                       </button>
//                     )}
//                     <button
//                       onClick={() => {
//                         setShowCreate(false);
//                         resetForm();
//                       }}
//                       className="text-gray-400 hover:text-gray-600"
//                       title="Close"
//                     >
//                       <XCircle className="w-6 h-6" />
//                     </button>
//                   </div>
//                 </div>

//                 {/* Body */}
//                 <div className="p-6 space-y-6">
//                   {/* Top selects */}
//                   <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
//                     <div>
//                       <label className="block text-sm font-medium text-gray-700">Branch</label>
//                       <select
//                         className="mt-1 w-full border rounded-md px-3 py-2"
//                         value={branch}
//                         onChange={(e) => setBranch(e.target.value)}
//                       >
//                         {BRANCH_OPTIONS.map((b) => (
//                           <option key={b} value={b}>
//                             {b}
//                           </option>
//                         ))}
//                       </select>
//                     </div>

//                     <div>
//                       <label className="block text-sm font-medium text-gray-700">Category</label>
//                       <select
//                         className="mt-1 w-full border rounded-md px-3 py-2"
//                         onChange={(e) => {
//                           setServices((prev) =>
//                             prev.map((s, i) => (i === 0 ? { ...s, category: e.target.value } : s))
//                           );
//                         }}
//                       >
//                         <option value="">Select One</option>
//                         {CATEGORY_OPTIONS.map((c) => (
//                           <option key={c} value={c}>
//                             {c}
//                           </option>
//                         ))}
//                       </select>
//                     </div>

//                     <div>
//                       <label className="block text-sm font-medium text-gray-700">Staff</label>
//                       <select
//                         className="mt-1 w-full border rounded-md px-3 py-2"
//                         value={staff}
//                         onChange={(e) => setStaff(e.target.value)}
//                       >
//                         <option value="">Select One</option>
//                         {STAFF_OPTIONS.map((s) => (
//                           <option key={s} value={s}>
//                             {s}
//                           </option>
//                         ))}
//                       </select>
//                     </div>

//                     <div>
//                       <label className="block text-sm font-medium text-gray-700">
//                         Payment Method
//                       </label>
//                       <select
//                         className="mt-1 w-full border rounded-md px-3 py-2"
//                         value={paymentMethod}
//                         onChange={(e) => setPaymentMethod(e.target.value)}
//                       >
//                         {PAYMENT_METHODS.map((p) => (
//                           <option key={p} value={p}>
//                             {p.toUpperCase()}
//                           </option>
//                         ))}
//                       </select>
//                     </div>
//                   </div>

//                   {/* Date & Time */}
//                   <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//                     <div>
//                       <label className="block text-sm font-medium text-gray-700">
//                         Service Date
//                       </label>
//                       <input
//                         type="date"
//                         className="mt-1 w-full border rounded-md px-3 py-2"
//                         value={serviceDate}
//                         onChange={(e) => setServiceDate(e.target.value)}
//                       />
//                     </div>
//                     <div>
//                       <label className="block text-sm font-medium text-gray-700">Time Slot</label>
//                       <select
//                         className="mt-1 w-full border rounded-md px-3 py-2"
//                         value={serviceTime}
//                         onChange={(e) => setServiceTime(e.target.value)}
//                       >
//                         {TIMESLOTS.filter(slot => {
//                           // only show slots whose hour is enabled
//                           const hour = slot.split(':')[0];
//                           return !!enabledHours[hour];
//                         }).map((slot) => (
//                           <option key={slot} value={slot}>
//                             {toDisplayAMPM(slot)}
//                           </option>
//                         ))}
//                       </select>
//                     </div>
//                     <div>
//                       <label className="block text-sm font-medium text-gray-700">Customer</label>
//                       <input
//                         type="text"
//                         placeholder="Customer name"
//                         className="mt-1 w-full border rounded-md px-3 py-2"
//                         value={customerName}
//                         onChange={(e) => setCustomerName(e.target.value)}
//                       />
//                     </div>
//                   </div>

//                   {/* Services table */}
//                   <div className="border rounded-lg">
//                     <div className="grid grid-cols-12 gap-2 px-4 py-3 bg-gray-50 text-xs font-semibold">
//                       <div className="col-span-4">Service</div>
//                       <div className="col-span-2">Category</div>
//                       <div className="col-span-2">Duration (min)</div>
//                       <div className="col-span-2">Price</div>
//                       <div className="col-span-1">Qty</div>
//                       <div className="col-span-1 text-right">—</div>
//                     </div>

//                     {services.map((s, idx) => (
//                       <div key={idx} className="grid grid-cols-12 gap-2 px-4 py-3 border-t">
//                         <div className="col-span-4">
//                           <input
//                             className="w-full border rounded-md px-3 py-2"
//                             placeholder="Service name"
//                             value={s.serviceName}
//                             onChange={(e) => handleServiceChange(idx, 'serviceName', e.target.value)}
//                           />
//                         </div>
//                         <div className="col-span-2">
//                           <select
//                             className="w-full border rounded-md px-3 py-2"
//                             value={s.category}
//                             onChange={(e) => handleServiceChange(idx, 'category', e.target.value)}
//                           >
//                             <option value="">Select</option>
//                             {CATEGORY_OPTIONS.map((c) => (
//                               <option key={c} value={c}>
//                                 {c}
//                               </option>
//                             ))}
//                           </select>
//                         </div>
//                         <div className="col-span-2">
//                           <input
//                             type="number"
//                             min={0}
//                             className="w-full border rounded-md px-3 py-2"
//                             value={s.duration}
//                             onChange={(e) =>
//                               handleServiceChange(idx, 'duration', Number(e.target.value || 0))
//                             }
//                           />
//                         </div>
//                         <div className="col-span-2">
//                           <input
//                             type="number"
//                             min={0}
//                             step="0.01"
//                             className="w-full border rounded-md px-3 py-2"
//                             value={s.price}
//                             onChange={(e) =>
//                               handleServiceChange(idx, 'price', Number(e.target.value || 0))
//                             }
//                           />
//                         </div>
//                         <div className="col-span-1">
//                           <input
//                             type="number"
//                             min={1}
//                             className="w-full border rounded-md px-3 py-2"
//                             value={s.quantity}
//                             onChange={(e) =>
//                               handleServiceChange(idx, 'quantity', Number(e.target.value || 1))
//                             }
//                           />
//                         </div>
//                         <div className="col-span-1 flex justify-end items-center">
//                           {services.length > 1 && (
//                             <button
//                               onClick={() => handleRemoveServiceRow(idx)}
//                               className="p-2 rounded hover:bg-red-50 text-red-600"
//                               title="Remove"
//                             >
//                               <Trash2 className="w-4 h-4" />
//                             </button>
//                           )}
//                         </div>
//                       </div>
//                     ))}

//                     <div className="px-4 py-3 border-t flex justify-between items-center">
//                       <button
//                         onClick={handleAddServiceRow}
//                         className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
//                       >
//                         <Plus className="w-4 h-4" />
//                         Add more service
//                       </button>

//                       <div className="text-sm text-gray-700">
//                         <span className="mr-4">
//                           <strong>Total Duration:</strong> {formTotals.totalDuration} min
//                         </span>
//                         <span>
//                           <strong>Total Price:</strong> ${formTotals.totalPrice.toFixed(2)}
//                         </span>
//                       </div>
//                     </div>
//                   </div>

//                   {/* Remarks & toggles */}
//                   <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//                     <div className="md:col-span-2">
//                       <label className="block text-sm font-medium text-gray-700">
//                         Remarks (optional)
//                       </label>
//                       <textarea
//                         className="mt-1 w-full border rounded-md px-3 py-2 min-h-[80px]"
//                         value={remarks}
//                         onChange={(e) => setRemarks(e.target.value)}
//                       />
//                     </div>
//                     <div className="space-y-4">
//                       <div className="flex items-center justify-between border rounded-md px-3 py-2">
//                         <span className="text-sm">Send booking notification by email</span>
//                         <input
//                           type="checkbox"
//                           checked={emailConfirmation}
//                           onChange={(e) => setEmailConfirmation(e.target.checked)}
//                         />
//                       </div>
//                       <div className="flex items-center justify-between border rounded-md px-3 py-2">
//                         <span className="text-sm">Send booking notification by SMS</span>
//                         <input
//                           type="checkbox"
//                           checked={smsConfirmation}
//                           onChange={(e) => setSmsConfirmation(e.target.checked)}
//                         />
//                       </div>
//                       <div>
//                         <label className="block text-sm font-medium text-gray-700">
//                           Application Status
//                         </label>
//                         <select
//                           className="mt-1 w-full border rounded-md px-3 py-2"
//                           value={status}
//                           onChange={(e) => setStatus(e.target.value as BookingStatus)}
//                         >
//                           <option value="upcoming">Approved (Upcoming)</option>
//                           <option value="past">Completed (Past)</option>
//                           <option value="cancelled">Cancelled</option>
//                         </select>
//                       </div>
//                     </div>
//                   </div>
//                 </div>

//                 {/* Footer */}
//                 <div className="px-6 py-4 border-t flex justify-end gap-3">
//                   <button
//                     onClick={() => {
//                       setShowCreate(false);
//                       resetForm();
//                     }}
//                     className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
//                     disabled={saving || deleting}
//                   >
//                     Close
//                   </button>
//                   <button
//                     onClick={saveBooking}
//                     className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-md hover:bg-emerald-700 disabled:opacity-60"
//                     disabled={saving || deleting}
//                   >
//                     {saving ? (editingId ? 'Updating...' : 'Saving...') : editingId ? 'Update' : 'Save'}
//                   </button>
//                 </div>
//               </div>
//             </div>
//           </div>
//         )}
//         {/* =================== END CREATE / EDIT MODAL =================== */}
//       </div>

   
//   );
// }



// new code for upcoming
// 'use client';

// import { useState, useEffect, useMemo } from 'react';
// import AccessWrapper from '@/components/AccessWrapper';

// import { v4 as uuidv4 } from 'uuid';

// import { getAuth } from "firebase/auth";
// //import { Timestamp, addDoc, collection, updateDoc, doc, serverTimestamp } from "firebase/firestore";
// //import { db } from '@/lib/firebase';



// import {
//   collection,
//   query,
//   orderBy,
//   onSnapshot,
//   doc,
//   updateDoc,
//   Timestamp,
//   getDocs,
//   addDoc,
//   serverTimestamp,
//   deleteDoc,
// } from 'firebase/firestore';
// import { db } from '@/lib/firebase';
// import {
//   Calendar,
//   Clock,
//   MapPin,
//   User,
//   CreditCard,
//   Search,
//   CheckCircle,
//   XCircle,
//   AlertCircle,
//   Plus,
//   Trash2,
//   Edit3,
// } from 'lucide-react';
// import { format, isSameDay } from 'date-fns';

// /* ----------------------------- Types ----------------------------- */

// interface BookingService {
//   serviceId?: string;
//   serviceName: string;
//   category: string;
//   duration: number; // minutes
//   price: number; // per unit
//   quantity: number;
// }

// type BookingStatus = 'upcoming' | 'past' | 'cancelled';

// interface Booking {
//   id: string;
//   userId: string;
//   customerName: string;
//    customerEmail?: string;
//   services: BookingService[];
//   bookingDate: Date;
//   bookingTime: string; // "HH:mm"
//   branch: string;
//   staff: string | null; // name string
//   totalPrice: number;
//   totalDuration: number;
//   status: BookingStatus;
//   paymentMethod: string;
//   emailConfirmation: boolean;
//   smsConfirmation: boolean;
//   createdAt: Date;
//   updatedAt: Date;
//   remarks?: string | null;
// }

// interface User {
//   id: string;
//   name: string;
//   email: string;
//   phone: string;
// }

// /* --------------------------- Constants --------------------------- */

// const BRANCH_OPTIONS = ['Al Bustan','Marina','TECOM','AL Muraqabat','IBN Batutta Mall'];
// const CATEGORY_OPTIONS = ['Facial', 'Hair', 'Nails', 'Lashes', 'Massage'];
// const PAYMENT_METHODS = ['cash', 'card'];

// // Fallback staff list (used only if Firestore `staff` collection not available)
// const STAFF_FALLBACK = ['Komal', 'Shameem', 'Do Thi Kim', 'Alishba'];

// /* ------------------------- Helper functions ---------------------- */

// const emptyService: BookingService = {
//   serviceId: '',
//   serviceName: '',
//   category: '',
//   duration: 30,
//   price: 0,
//   quantity: 1,
// };

// function calcTotals(services: BookingService[]) {
//   const totalPrice = services.reduce(
//     (sum, s) => sum + (Number(s.price) || 0) * (Number(s.quantity) || 0),
//     0
//   );
//   const totalDuration = services.reduce(
//     (sum, s) => sum + (Number(s.duration) || 0) * (Number(s.quantity) || 0),
//     0
//   );
//   return { totalPrice, totalDuration };
// }

// function minutesToHHMM(mins: number) {
//   const h = Math.floor(mins / 60)
//     .toString()
//     .padStart(2, '0');
//   const m = (mins % 60).toString().padStart(2, '0');
//   return `${h}:${m}`;
// }

// function toDisplayAMPM(hhmm: string) {
//   const [hStr, m] = hhmm.split(':');
//   let h = Number(hStr);
//   const suffix = h >= 12 ? 'PM' : 'AM';
//   if (h === 0) h = 12;
//   if (h > 12) h = h - 12;
//   return `${h}:${m} ${suffix}`;
// }

// function generateTimeSlots(
//   // start = 10 * 60, // 10:00
//   // end = 22 * 60, // 22:00 (10:00 PM)
//   // step = 15 // 15 mins
//     start = 0, // 10:00
//   end = 12 * 120, // 22:00 (10:00 PM)
//   step = 15 // 15 mins
// ) {
//   const slots: string[] = [];
//   for (let t = start; t <= end; t += step) {
//     slots.push(minutesToHHMM(t));
//   }
//   return slots;
// }

// // EXACT requirement: 10:00 AM → 10:00 PM (15-min steps)
// const TIMESLOTS = generateTimeSlots();

// /* =========================== Component =========================== */

// export default function BookingsPage() {
//   const [bookings, setBookings] = useState<Booking[]>([]);
//   const [users, setUsers] = useState<{ [key: string]: User }>({});
//   const [loading, setLoading] = useState(true);
//   const [searchTerm, setSearchTerm] = useState('');
//   const [statusFilter, setStatusFilter] = useState<string>('all');

//   // Create/Edit modal
//   const [showCreate, setShowCreate] = useState(false);
//   const [saving, setSaving] = useState(false);
//   const [deleting, setDeleting] = useState(false);
//   const [editingId, setEditingId] = useState<string | null>(null);

//   // form state
//   const [branch, setBranch] = useState(BRANCH_OPTIONS[0]);
//   const [serviceDate, setServiceDate] = useState<string>(() =>
//     format(new Date(), 'yyyy-MM-dd')
//   );
//   const [serviceTime, setServiceTime] = useState<string>('10:00'); // "HH:mm"
//   const [customerName, setCustomerName] = useState<string>('');
//   const [paymentMethod, setPaymentMethod] = useState<string>('cash');
//   const [emailConfirmation, setEmailConfirmation] = useState(false);
//   const [smsConfirmation, setSmsConfirmation] = useState(false);
//     const [customerEmail, setCustomerEmail] = useState<string>('');
//   const [status, setStatus] = useState<BookingStatus>('upcoming');
//   // form state


//   const [staff, setStaff] = useState<string>('');
//   const [services, setServices] = useState<BookingService[]>([{ ...emptyService }]);
//   const [remarks, setRemarks] = useState<string>('');
// // new code



// // new code
//   // Schedule board controls
//   const [scheduleDate, setScheduleDate] = useState<string>(() =>
//     format(new Date(), 'yyyy-MM-dd')
//   );
//   const [scheduleBranch, setScheduleBranch] = useState<string>('all');

//   // Dynamic staff fetched from Firestore
//   const [staffFromDB, setStaffFromDB] = useState<string[]>([]);

//   // Hour enabled/disabled state (keyed by hour string, e.g. "10", "11", "12")
//   const uniqueHours = Array.from(new Set(TIMESLOTS.map((t) => t.split(':')[0]))).sort(
//     (a, b) => Number(a) - Number(b)
//   );
//   const [enabledHours, setEnabledHours] = useState<Record<string, boolean>>(() => {
//     const map: Record<string, boolean> = {};
//     uniqueHours.forEach((h) => (map[h] = true));
//     return map;
//   });

//   /* -------------------- Load Staff from Firebase -------------------- */
//   useEffect(() => {
//     // Will use `staff` collection: each doc should have { name: string, active?: boolean }
//     const loadStaff = async () => {
//       try {
//         const snap = await getDocs(collection(db, 'staff'));
//         const list: string[] = [];
//         snap.forEach((d) => {
//           const data = d.data() as any;
//           if (data?.name) list.push(String(data.name));
//         });
//         // If no staff docs found, we fallback to your previous constants
//         setStaffFromDB(list.length ? list : STAFF_FALLBACK);
//       } catch {
//         // Safe fallback
//         setStaffFromDB(STAFF_FALLBACK);
//       }
//     };
//     loadStaff();
//   }, []);

//   const STAFF_OPTIONS = staffFromDB; // used everywhere below

//   /* -------------------- Load bookings (Realtime) -------------------- */
//   useEffect(() => {
//     const bookingsQuery = query(collection(db, 'bookings'), orderBy('createdAt', 'desc'));

//     const unsubscribe = onSnapshot(bookingsQuery, (snapshot) => {
//       const bookingsData = snapshot.docs.map((d) => {
//         const data = d.data() as any;
//         return {
//           id: d.id,
//           userId: data.userId || '',
//           customerName: data.customerName || '',
//           customerEmail: data.customerEmail || '', // ✅ added
//           services: (data.services || []) as BookingService[],
//           bookingDate: data.bookingDate?.toDate() || new Date(),
//           bookingTime: data.bookingTime || '',
//           branch: data.branch || '',
//          // staff: data.staff ?? null,
//          //staff: data.staff || '—', // fallback to '—' if empty
//          //staff: typeof data.staff === 'string' && data.staff.trim() ? data.staff : 'no',
//         // staff:data.staff ||"_",
       
//        staff: (data.staffName || data.staff || '—'), // ✅ fixed

//           totalPrice: data.totalPrice || 0,
//           totalDuration: data.totalDuration || 0,
//           status: (data.status as BookingStatus) || 'upcoming',
//           paymentMethod: data.paymentMethod || 'cash',
//           emailConfirmation: data.emailConfirmation || false,
//           smsConfirmation: data.smsConfirmation || false,
//           createdAt: data.createdAt?.toDate() || new Date(),
//           updatedAt: data.updatedAt?.toDate() || new Date(),
//           remarks: data.remarks ?? null,
//         } as Booking;
//       });
//       setBookings(bookingsData);
//       setLoading(false);
//     });

//     return () => unsubscribe();
//   }, []);

//   /* ------------------------- Load user details ------------------------- */
//   useEffect(() => {
//     const loadUsers = async () => {
//       const usersQuery = query(collection(db, 'users'));
//       const usersSnapshot = await getDocs(usersQuery);
//       const usersData: { [key: string]: User } = {};

//       usersSnapshot.docs.forEach((doc) => {
//         const data = doc.data() as any;
//         usersData[doc.id] = {
//           id: doc.id,
//           name: data.name || data.displayName || 'Unknown User',
//           email: data.email || '',
//           phone: data.phone || data.phoneNumber || '',
//         };
//       });

//       setUsers(usersData);
//     };

//     loadUsers();
//   }, []);

//   /* --------------------------- Filtering logic -------------------------- */
//   const filteredBookings = bookings.filter((booking) => {
//     const q = searchTerm.toLowerCase();
//     const matchesSearch =
//       booking.customerName.toLowerCase().includes(q) ||
//       booking.branch.toLowerCase().includes(q) ||
//       booking.services.some((s) => s.serviceName.toLowerCase().includes(q));

//     const matchesStatus = statusFilter === 'all' || booking.status === (statusFilter as BookingStatus);

//     return matchesSearch && matchesStatus;
//   });

//   /* --------------------------- Update helpers --------------------------- */
//   const updateBookingStatus = async (bookingId: string, newStatus: BookingStatus) => {
//     try {
//       const bookingRef = doc(db, 'bookings', bookingId);
//       await updateDoc(bookingRef, {
//         status: newStatus,
//         updatedAt: serverTimestamp(),
//       });
//     } catch (error) {
//       console.error('Error updating booking status:', error);
//       alert('Failed to update status.');
//     }
//   };

//   const getStatusBadge = (s: string) => {
//     switch (s) {
//       case 'upcoming':
//         return 'bg-blue-100 text-blue-800';
//       case 'past':
//         return 'bg-green-100 text-green-800';
//       case 'cancelled':
//         return 'bg-red-100 text-red-800';
//       default:
//         return 'bg-gray-100 text-gray-800';
//     }
//   };

//   const getStatusBlock = (s: BookingStatus) => {
//     switch (s) {
//       case 'upcoming':
//         return 'bg-emerald-50 border-emerald-300 text-emerald-800';
//       case 'past':
//         return 'bg-gray-50 border-gray-300 text-gray-700';
//       case 'cancelled':
//         return 'bg-rose-50 border-rose-300 text-rose-800 line-through';
//       default:
//         return 'bg-slate-50 border-slate-300 text-slate-800';
//     }
//   };

//   const getPaymentIcon = (method: string) => {
//     switch (method.toLowerCase()) {
//       case 'card':
//       case 'credit':
//       case 'debit':
//         return <CreditCard className="w-4 h-4" />;
//       default:
//         return <CreditCard className="w-4 h-4" />;
//     }
//   };

//   /* -------------------------- Create/Edit Handlers ------------------------- */

//   const resetForm = () => {
//     setBranch(BRANCH_OPTIONS[0]);
//     setCustomerEmail(''); // ✅ reset email
//     setServiceDate(format(new Date(), 'yyyy-MM-dd'));
//     setServiceTime('10:00');
//     setCustomerName('');
//     setPaymentMethod('cash');
//     setEmailConfirmation(false);
//     setSmsConfirmation(false);
//     setStatus('upcoming');
//     setStaff('');
//     setServices([{ ...emptyService }]);
//     setRemarks('');
//     setEditingId(null);
//   };

//   const openForCreate = () => {
//     resetForm();
//     setShowCreate(true);
//   };

//   // Open modal to CREATE, but prefill staff+time from a grid cell
//   const openForCreateFromCell = (prefillStaff: string, prefillTime: string) => {
//     // If hour disabled, do nothing
//     const hour = prefillTime.split(':')[0];
//     if (!enabledHours[hour]) return;

//     resetForm();
//     setStaff(prefillStaff);
//     setServiceTime(prefillTime);
//     // Set serviceDate to scheduleDate (board date)
//     setServiceDate(scheduleDate);
//     setShowCreate(true);
     
//   };

//   const openForEdit = (b: Booking) => {
//     setEditingId(b.id);
//     setBranch(b.branch || BRANCH_OPTIONS[0]);
//     setServiceDate(format(b.bookingDate, 'yyyy-MM-dd'));
//     setServiceTime(b.bookingTime || '10:00');
//     setCustomerName(b.customerName || '');
//     setCustomerEmail((b as any).customerEmail || ''); // ✅ load email
//     setPaymentMethod(b.paymentMethod || 'cash');
//     setEmailConfirmation(!!b.emailConfirmation);
//     setSmsConfirmation(!!b.smsConfirmation);
//     setStatus(b.status || 'upcoming');
//     setStaff(b.staff || '');
//     setServices(
//       b.services && b.services.length > 0
//         ? b.services.map((s) => ({
//             serviceId: s.serviceId || '',
//             serviceName: s.serviceName || '',
//             category: s.category || '',
//             duration: Number(s.duration) || 0,
//             price: Number(s.price) || 0,
//             quantity: Number(s.quantity) || 1,
//           }))
//         : [{ ...emptyService }]
//     );
//     setRemarks(b.remarks || '');
//     setShowCreate(true);
//   };

//   const handleAddServiceRow = () => {
//     setServices((prev) => [...prev, { ...emptyService }]);
//   };

//   const handleRemoveServiceRow = (index: number) => {
//     setServices((prev) => prev.filter((_, i) => i !== index));
//   };

//   const handleServiceChange = (
//     index: number,
//     field: keyof BookingService,
//     value: string | number
//   ) => {
//     setServices((prev) =>
//       prev.map((s, i) => (i === index ? { ...s, [field]: value } : s))
//     );
//   };

//   const formTotals = calcTotals(services);

//   const validateForm = () => {
//     if (!customerName.trim()) return 'Customer name is required';
//     if (!serviceDate) return 'Service date is required';
//     if (!serviceTime) return 'Service time is required';
//     if (!branch) return 'Branch is required';
//     if (!staff) return 'Staff is required';
//     if (services.length === 0) return 'Add at least one service';
//     const hasName = services.every((s) => s.serviceName.trim().length > 0);
//     if (!hasName) return 'Each service must have a name';
//     // also ensure selected time hour is enabled
//     const selectedHour = serviceTime.split(':')[0];
//     if (!enabledHours[selectedHour]) return 'Selected time falls into a disabled hour';
//     return null;
//   };







// const saveBooking = async () => {
//   const err = validateForm();
//   if (err) {
//     alert(err);
//     return;
//   }

//   try {
//     setSaving(true);

//     // Assign userId: existing booking keeps its id, new booking (or empty userId) gets uuid
//     const assignedUserId =
//       editingId
//         ? bookings.find((b) => b.id === editingId)?.userId || uuidv4()
//         : uuidv4();

//     const payload = {
//       userId: assignedUserId, // ✅ now always filled, even for upcoming
//       customerName: customerName.trim(),
     
//        customerEmail: customerEmail?.trim() || '', // ✅ add this
//       services: services.map((s) => ({
//         ...s,
//         price: Number(s.price) || 0,
//         duration: Number(s.duration) || 0,
//         quantity: Number(s.quantity) || 0,
//       })),
//       bookingDate: Timestamp.fromDate(new Date(serviceDate + 'T00:00:00')),
//       bookingTime: serviceTime,
//       branch,
//       staff: staff || null,
//     //staff: typeof data.staff === 'string' && data.staff.trim() ? data.staff : '—',

//       totalPrice: formTotals.totalPrice,
//       totalDuration: formTotals.totalDuration,
//       status, // upcoming / past / cancelled
//       paymentMethod,
//       emailConfirmation,
//       smsConfirmation,
//       updatedAt: serverTimestamp(),
//       remarks: remarks || null,
//     };

//     if (editingId) {
//       const ref = doc(db, 'bookings', editingId);
//       await updateDoc(ref, payload);
//     } else {
//       await addDoc(collection(db, 'bookings'), {
//         ...payload,
//         createdAt: serverTimestamp(),
//       });
//     }

//     setShowCreate(false);
//     resetForm();
//   } catch (e) {
//     console.error('Error saving booking:', e);
//     alert('Failed to save booking. Check console for details.');
//   } finally {
//     setSaving(false);
//   }
// };

  

//   const deleteBooking = async () => {
//     if (!editingId) return;
//     if (!confirm('Delete this booking? This action cannot be undone.')) return;

//     try {
//       setDeleting(true);
//       await deleteDoc(doc(db, 'bookings', editingId));
//       setShowCreate(false);
//       resetForm();
//     } catch (e) {
//       console.error('Error deleting booking:', e);
//       alert('Failed to delete booking.');
//     } finally {
//       setDeleting(false);
//     }
//   };

//   /* ------------------------------ Schedule Board Data ------------------------------ */

//   const bookingsForSchedule = useMemo(() => {
//     const target = new Date(scheduleDate + 'T00:00:00');
//     return bookings.filter((b) => {
//       const sameDay = isSameDay(b.bookingDate, target);
//       const branchOk = scheduleBranch === 'all' || b.branch === scheduleBranch;
//       return sameDay && branchOk;
//     });
//   }, [bookings, scheduleDate, scheduleBranch]);

//   // fast lookup: { 'HH:mm': { staffName: Booking[] } } but we need single cell show (first booking)
//   const scheduleMatrix = useMemo(() => {
//     const map: Record<string, Record<string, Booking[]>> = {};
//     TIMESLOTS.forEach((t) => {
//       map[t] = {};
//       STAFF_OPTIONS.forEach((s) => (map[t][s] = []));
//     });
//     bookingsForSchedule.forEach((b) => {
//       const t = b.bookingTime;
//       const s = b.staff || '';
//       if (t && s && map[t] && map[t][s] !== undefined) {
//         map[t][s].push(b);
//       }
//     });
//     return map;
//   }, [bookingsForSchedule, STAFF_OPTIONS]);

//   /* ------------------------------- Render ------------------------------ */

//   if (loading) {
//     return (
//       <div className="p-6">
//         <div className="max-w-7xl mx-auto">
//           <div className="flex items-center justify-center py-12">
//             <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600"></div>
//             <span className="ml-3 text-pink-600">Loading bookings...</span>
//           </div>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div>
  
     
//         {/* Header */}
//         <div className="mb-8 flex items-start sm:items-center justify-around gap-4 ">
//           <div>
//             <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
//               Customers
//             </h1>
//             <p className="text-gray-600 dark:text-white">
//               All Customers Data
//             </p>
//           </div>

          
//         </div>

//         {/* Schedule Board Controls */}
//         <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6 w-[1100px]">
//           <div className="grid grid-cols-1 md:grid-cols-4 gap-6 ">
//             <div className="flex items-center">
//               <Calendar className="w-5 h-5 text-gray-500 mr-2" />
//               <input
//                 type="date"
//                 value={scheduleDate}
//                 onChange={(e) => setScheduleDate(e.target.value)}
//                 className="w-full border rounded-md px-3 py-2"
//               />
//             </div>
//             <div className="flex items-center">
//               <MapPin className="w-5 h-5 text-gray-500 mr-2" />
//               <select
//                 value={scheduleBranch}
//                 onChange={(e) => setScheduleBranch(e.target.value)}
//                 className="w-full border rounded-md px-3 py-2"
//               >
//                 <option value="all">All Branches</option>
//                 {BRANCH_OPTIONS.map((b) => (
//                   <option key={b} value={b}>
//                     {b}
//                   </option>
//                 ))}
//               </select>
//             </div>

//             {/* Hour toggles: minimal UI addition, consistent with existing controls */}
//             <div className="md:col-span-2">
              
//             </div>
//           </div>
//         </div>

//  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6 w-[1100px]">
//           <div className="flex flex-col md:flex-row gap-4">
//             <div className="flex-1">
//               <div className="relative">
//                 <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
//                 <input
//                   type="text"
//                   placeholder="Search by customer name, branch, or service..."
//                   value={searchTerm}
//                   onChange={(e) => setSearchTerm(e.target.value)}
//                   className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
//                 />
//               </div>
//             </div>

//             <div className="md:w-48">
//               <select
//                 value={statusFilter}
//                 onChange={(e) => setStatusFilter(e.target.value)}
//                 className="w-full bg-black text-white px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
//               >
//                 <option value="all">All Status</option>
//                 <option value="upcoming">Upcoming</option>
//                 <option value="past">Past</option>
//                 <option value="cancelled">Cancelled</option>
//               </select>
//             </div>
//           </div>
//         </div>

      
          
    

//         {/* ======================== SCHEDULE BOARD (NEW ORIENTATION) ======================== */}
//         <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-x-auto mb-10 w-0">
//           {/* Grid: first column is time (sticky left), first row is header with staff (sticky top) */}
//           <div
//             className="min-w-[900px] relative"
//             style={{}}
//           >
            

//             {/* Body: rows for each timeslot */}
            
//                   <div className="">
//               {TIMESLOTS.map((t) => {
//                 const hour = t.split(':')[0];
//                 const hourEnabled = !!enabledHours[hour];

//                 return (
//                     <div
//                   key={t}
//                   className="grid"
//                   style={{ gridTemplateColumns: `180px repeat(${STAFF_OPTIONS.length}, 200px)` }}
//                 >

                         
                    
                  
//                 </div>
//               )}
//                 )}
//             </div>
//           </div>
//         </div>

//         {/* Filters and Search (List view) */}

//         {/* Bookings Table (click row to edit) */}
//         <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden w-[1150px]">
//           <div className="overflow-x-auto">
//             <table className="min-w-full divide-y divide-gray-200">
//               <thead className="bg-gray-50">
//                 <tr>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                     Customer
//                   </th>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                     Services
//                   </th>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                     Date & Time
//                   </th>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                     Staff
//                   </th>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                     Branch
//                   </th>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                     Payment
//                   </th>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                     Status
//                   </th>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                     Actions
//                   </th>
//                 </tr>
//               </thead>
//               <tbody className="bg-white divide-y divide-gray-200">
//                 {filteredBookings.map((booking) => {
//                   const user = users[booking.userId];
//                   return (
//                     <tr
//                       key={booking.id}
//                       className="hover:bg-gray-50 cursor-pointer"
//                       onClick={() => openForEdit(booking)}
//                     >
//                       <td className="px-6 py-4 whitespace-nowrap">
//                         <div className="flex items-center">
//                           <div className="flex-shrink-0 h-10 w-10">
//                             <div className="h-10 w-10 rounded-full bg-pink-100 flex items-center justify-center">
//                               <User className="h-5 w-5 text-pink-600" />
//                             </div>
//                           </div>
//                           <div className="ml-4">
//                             <div className="text-sm font-medium text-gray-900">
//                               {booking.customerName}
//                             </div>
//                              <div className="text-sm text-gray-500">
//                               <div className="text-sm text-gray-500">{booking.customerEmail || 'No email'}</div>
//                             </div> 
//                           </div>
//                         </div>
//                       </td>
//                       <td className="px-6 py-4">
//                         <div className="text-sm text-gray-900">
//                           {booking.services.slice(0, 2).map((service, index) => (
//                             <div key={index} className="mb-1">
//                               {service.serviceName}{' '}
//                               {service.quantity > 1 && `(x${service.quantity})`}
//                             </div>
//                           ))}
//                           {booking.services.length > 2 && (
//                             <div className="text-xs text-gray-500">
//                               +{booking.services.length - 2} more
//                             </div>
//                           )}
//                         </div>
//                       </td>
//                       <td className="px-6 py-4 whitespace-nowrap">
//                         <div className="flex items-center text-sm text-gray-900">
//                           <Calendar className="w-4 h-4 mr-2 text-gray-400" />
//                           <div>
//                             <div>{format(booking.bookingDate, 'MMM dd, yyyy')}</div>
//                             <div className="text-xs text-gray-500 flex items-center mt-1">
//                               <Clock className="w-3 h-3 mr-1" />
//                               {toDisplayAMPM(booking.bookingTime)}
//                             </div>
//                           </div>
//                         </div>
//                       </td>
//                       <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
//                         {booking.staff || '—'}
//                       </td>
//                       <td className="px-6 py-4 whitespace-nowrap">
//                         <div className="flex items-center text-sm text-gray-900">
//                           <MapPin className="w-4 h-4 mr-2 text-gray-400" />
//                           {booking.branch}
//                         </div>
//                       </td>
//                       <td className="px-6 py-4 whitespace-nowrap">
//                         <div className="text-sm text-gray-900">
//                           <div className="flex items-center">
//                             {getPaymentIcon(booking.paymentMethod)}
//                             <span className="ml-2">${booking.totalPrice.toFixed(2)}</span>
//                           </div>
//                           <div className="text-xs text-gray-500 capitalize">
//                             {booking.paymentMethod}
//                           </div>
//                         </div>
//                       </td>
//                       <td className="px-6 py-4 whitespace-nowrap">
//                         <span
//                           className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full capitalize ${getStatusBadge(
//                             booking.status
//                           )}`}
//                         >
//                           {booking.status}
//                         </span>
//                       </td>
//                       <td
//                         className="px-6 py-4 whitespace-nowrap text-sm font-medium"
//                         onClick={(e) => e.stopPropagation()}
//                       >
//                         <div className="flex space-x-2">
//                           <button
//                             onClick={() => openForEdit(booking)}
//                             className="text-emerald-700 hover:text-emerald-900"
//                             title="Edit booking"
//                           >
//                             <Edit3 className="w-4 h-4" />
//                           </button>
//                           {booking.status === 'upcoming' && (
//                             <>
//                               <button
//                                 onClick={() => updateBookingStatus(booking.id, 'past')}
//                                 className="text-green-600 hover:text-green-900"
//                                 title="Mark as completed"
//                               >
//                                 <CheckCircle className="w-4 h-4" />
//                               </button>
//                               <button
//                                 onClick={() => updateBookingStatus(booking.id, 'cancelled')}
//                                 className="text-red-600 hover:text-red-900"
//                                 title="Cancel booking"
//                               >
//                                 <XCircle className="w-4 h-4" />
//                               </button>
//                             </>
//                           )}
//                         </div>
//                       </td>
//                     </tr>
//                   );
//                 })}
//               </tbody>
//             </table>
//           </div>

//           {filteredBookings.length === 0 && (
//             <div className="text-center py-12">
//               <Calendar className="mx-auto h-12 w-12 text-gray-400" />
//               <h3 className="mt-2 text-sm font-medium text-gray-900">No bookings found</h3>
//               <p className="mt-1 text-sm text-gray-500">
//                 {searchTerm || statusFilter !== 'all'
//                   ? 'Try adjusting your search or filter criteria.'
//                   : 'No bookings have been made yet.'}
//               </p>
//             </div>
//           )}
//         </div>

//         {/* ===================== CREATE / EDIT MODAL (PURE TAILWIND) ===================== */}
//         {showCreate && (
//           <div className="fixed inset-0 bg-gray-600 bg-opacity-50 z-50 overflow-y-auto h-full w-full">
//             <div className="relative top-10 mx-auto w-11/12 md:w-4/5 lg:w-3/4 xl:w-2/3">
//               <div className="bg-white rounded-lg shadow-xl border">
//                 {/* Header */}
//                 <div className="flex items-center justify-between px-6 py-4 border-b">
//                   <h3 className="text-lg font-semibold">
//                     {editingId ? 'Edit Schedule' : 'Add Schedule'}
//                   </h3>
//                   <div className="flex items-center gap-2">
//                     {editingId && (
//                       <button
//                         onClick={deleteBooking}
//                         disabled={deleting}
//                         className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-white bg-red-600 hover:bg-red-700 disabled:opacity-60"
//                         title="Delete booking"
//                       >
//                         <Trash2 className="w-4 h-4" />
//                         Delete
//                       </button>
//                     )}
//                     <button
//                       onClick={() => {
//                         setShowCreate(false);
//                         resetForm();
//                       }}
//                       className="text-gray-400 hover:text-gray-600"
//                       title="Close"
//                     >
//                       <XCircle className="w-6 h-6" />
//                     </button>
//                   </div>
//                 </div>

//                 {/* Body */}
//                 <div className="p-6 space-y-6">
//                   {/* Top selects */}
//                   <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
//                     <div>
//                       <label className="block text-sm font-medium text-gray-700">Branch</label>
//                       <select
//                         className="mt-1 w-full border rounded-md px-3 py-2"
//                         value={branch}
//                         onChange={(e) => setBranch(e.target.value)}
//                       >
//                         {BRANCH_OPTIONS.map((b) => (
//                           <option key={b} value={b}>
//                             {b}
//                           </option>
//                         ))}
//                       </select>
//                     </div>

//                     <div>
//                       <label className="block text-sm font-medium text-gray-700">Category</label>
//                       <select
//                         className="mt-1 w-full border rounded-md px-3 py-2"
//                         onChange={(e) => {
//                           setServices((prev) =>
//                             prev.map((s, i) => (i === 0 ? { ...s, category: e.target.value } : s))
//                           );
//                         }}
//                       >
//                         <option value="">Select One</option>
//                         {CATEGORY_OPTIONS.map((c) => (
//                           <option key={c} value={c}>
//                             {c}
//                           </option>
//                         ))}
//                       </select>
//                     </div>

//                     <div>
//                       <label className="block text-sm font-medium text-gray-700">Staff</label>
//                       <select
//                         className="mt-1 w-full border rounded-md px-3 py-2"
//                         value={staff}
//                         onChange={(e) => setStaff(e.target.value)}
//                       >
//                         <option value="">Select One</option>
//                         {STAFF_OPTIONS.map((s) => (
//                           <option key={s} value={s}>
//                             {s}
//                           </option>
//                         ))}
//                       </select>
//                     </div>

//                     <div>
//                       <label className="block text-sm font-medium text-gray-700">
//                         Payment Method
//                       </label>
//                       <select
//                         className="mt-1 w-full border rounded-md px-3 py-2"
//                         value={paymentMethod}
//                         onChange={(e) => setPaymentMethod(e.target.value)}
//                       >
//                         {PAYMENT_METHODS.map((p) => (
//                           <option key={p} value={p}>
//                             {p.toUpperCase()}
//                           </option>
//                         ))}
//                       </select>
//                     </div>
//                   </div>

//                   {/* Date & Time */}
//                   <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//                     <div>
//                       <label className="block text-sm font-medium text-gray-700">
//                         Service Date
//                       </label>
//                       <input
//                         type="date"
//                         className="mt-1 w-full border rounded-md px-3 py-2"
//                         value={serviceDate}
//                         onChange={(e) => setServiceDate(e.target.value)}
//                       />
//                     </div>
//                     <div>
//                       <label className="block text-sm font-medium text-gray-700">Time Slot</label>
//                       <select
//                         className="mt-1 w-full border rounded-md px-3 py-2"
//                         value={serviceTime}
//                         onChange={(e) => setServiceTime(e.target.value)}
//                       >
//                         {TIMESLOTS.filter(slot => {
//                           // only show slots whose hour is enabled
//                           const hour = slot.split(':')[0];
//                           return !!enabledHours[hour];
//                         }).map((slot) => (
//                           <option key={slot} value={slot}>
//                             {toDisplayAMPM(slot)}
//                           </option>
//                         ))}
//                       </select>
//                     </div>
//                     <div>
//                       <label className="block text-sm font-medium text-gray-700">Customer</label>
//                       <input
//                         type="text"
//                         placeholder="Customer name"
//                         className="mt-1 w-full border rounded-md px-3 py-2"
//                         value={customerName}
//                         onChange={(e) => setCustomerName(e.target.value)}
//                       />
//                     </div>
//                   </div>

//                   {/* Services table */}
//                   <div className="border rounded-lg">
//                     <div className="grid grid-cols-12 gap-2 px-4 py-3 bg-gray-50 text-xs font-semibold">
//                       <div className="col-span-4">Service</div>
//                       <div className="col-span-2">Category</div>
//                       <div className="col-span-2">Duration (min)</div>
//                       <div className="col-span-2">Price</div>
//                       <div className="col-span-1">Qty</div>
//                       <div className="col-span-1 text-right">—</div>
//                     </div>

//                     {services.map((s, idx) => (
//                       <div key={idx} className="grid grid-cols-12 gap-2 px-4 py-3 border-t">
//                         <div className="col-span-4">
//                           <input
//                             className="w-full border rounded-md px-3 py-2"
//                             placeholder="Service name"
//                             value={s.serviceName}
//                             onChange={(e) => handleServiceChange(idx, 'serviceName', e.target.value)}
//                           />
//                         </div>
//                         <div className="col-span-2">
//                           <select
//                             className="w-full border rounded-md px-3 py-2"
//                             value={s.category}
//                             onChange={(e) => handleServiceChange(idx, 'category', e.target.value)}
//                           >
//                             <option value="">Select</option>
//                             {CATEGORY_OPTIONS.map((c) => (
//                               <option key={c} value={c}>
//                                 {c}
//                               </option>
//                             ))}
//                           </select>
//                         </div>
//                         <div className="col-span-2">
//                           <input
//                             type="number"
//                             min={0}
//                             className="w-full border rounded-md px-3 py-2"
//                             value={s.duration}
//                             onChange={(e) =>
//                               handleServiceChange(idx, 'duration', Number(e.target.value || 0))
//                             }
//                           />
//                         </div>
//                         <div className="col-span-2">
//                           <input
//                             type="number"
//                             min={0}
//                             step="0.01"
//                             className="w-full border rounded-md px-3 py-2"
//                             value={s.price}
//                             onChange={(e) =>
//                               handleServiceChange(idx, 'price', Number(e.target.value || 0))
//                             }
//                           />
//                         </div>
//                         <div className="col-span-1">
//                           <input
//                             type="number"
//                             min={1}
//                             className="w-full border rounded-md px-3 py-2"
//                             value={s.quantity}
//                             onChange={(e) =>
//                               handleServiceChange(idx, 'quantity', Number(e.target.value || 1))
//                             }
//                           />
//                         </div>
//                         <div className="col-span-1 flex justify-end items-center">
//                           {services.length > 1 && (
//                             <button
//                               onClick={() => handleRemoveServiceRow(idx)}
//                               className="p-2 rounded hover:bg-red-50 text-red-600"
//                               title="Remove"
//                             >
//                               <Trash2 className="w-4 h-4" />
//                             </button>
//                           )}
//                         </div>
//                       </div>
//                     ))}

//                     <div className="px-4 py-3 border-t flex justify-between items-center">
//                       <button
//                         onClick={handleAddServiceRow}
//                         className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
//                       >
//                         <Plus className="w-4 h-4" />
//                         Add more service
//                       </button>

//                       <div className="text-sm text-gray-700">
//                         <span className="mr-4">
//                           <strong>Total Duration:</strong> {formTotals.totalDuration} min
//                         </span>
//                         <span>
//                           <strong>Total Price:</strong> ${formTotals.totalPrice.toFixed(2)}
//                         </span>
//                       </div>
//                     </div>
//                   </div>

//                   {/* Remarks & toggles */}
//                   <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//                     <div className="md:col-span-2">
//                       <label className="block text-sm font-medium text-gray-700">
//                         Remarks (optional)
//                       </label>
//                       <textarea
//                         className="mt-1 w-full border rounded-md px-3 py-2 min-h-[80px]"
//                         value={remarks}
//                         onChange={(e) => setRemarks(e.target.value)}
//                       />
//                     </div>
//                     <div className="space-y-4">
//                       <div className="flex items-center justify-between border rounded-md px-3 py-2">
//                         <span className="text-sm">Send booking notification by email</span>
//                         <input
//                           type="checkbox"
//                           checked={emailConfirmation}
//                           onChange={(e) => setEmailConfirmation(e.target.checked)}
//                         />
//                       </div>
//                       <div className="flex items-center justify-between border rounded-md px-3 py-2">
//                         <span className="text-sm">Send booking notification by SMS</span>
//                         <input
//                           type="checkbox"
//                           checked={smsConfirmation}
//                           onChange={(e) => setSmsConfirmation(e.target.checked)}
//                         />
//                       </div>
//                       <div>
//                         <label className="block text-sm font-medium text-gray-700">
//                           Application Status
//                         </label>
//                         <select
//                           className="mt-1 w-full border rounded-md px-3 py-2"
//                           value={status}
//                           onChange={(e) => setStatus(e.target.value as BookingStatus)}
//                         >
//                           <option value="upcoming">Approved (Upcoming)</option>
//                           <option value="past">Completed (Past)</option>
//                           <option value="cancelled">Cancelled</option>
//                         </select>
//                       </div>
//                     </div>
//                   </div>
//                 </div>

//                 {/* Footer */}
//                 <div className="px-6 py-4 border-t flex justify-end gap-3">
//                   <button
//                     onClick={() => {
//                       setShowCreate(false);
//                       resetForm();
//                     }}
//                     className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
//                     disabled={saving || deleting}
//                   >
//                     Close
//                   </button>
//                   <button
//                     onClick={saveBooking}
//                     className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-md hover:bg-emerald-700 disabled:opacity-60"
//                     disabled={saving || deleting}
//                   >
//                     {saving ? (editingId ? 'Updating...' : 'Saving...') : editingId ? 'Update' : 'Save'}
//                   </button>
//                 </div>
//               </div>
//             </div>
//           </div>
//         )}
//         {/* =================== END CREATE / EDIT MODAL =================== */}
//       </div>

   
//   );
// }




// new code correct code all
// 'use client';

// import { useState, useEffect, useMemo } from 'react';
// import AccessWrapper from '@/components/AccessWrapper';

// import { v4 as uuidv4 } from 'uuid';

// import { getAuth } from "firebase/auth";
// //import { Timestamp, addDoc, collection, updateDoc, doc, serverTimestamp } from "firebase/firestore";
// //import { db } from '@/lib/firebase';



// import {
//   collection,
//   query,
//   orderBy,
//   onSnapshot,
//   doc,
//   updateDoc,
//   Timestamp,
//   getDocs,
//   addDoc,
//   serverTimestamp,
//   deleteDoc,
// } from 'firebase/firestore';
// import { db } from '@/lib/firebase';
// import {
//   Calendar,
//   Clock,
//   MapPin,
//   User,
//   CreditCard,
//   Search,
//   CheckCircle,
//   XCircle,
//   AlertCircle,
//   Plus,
//   Trash2,
//   Edit3,
// } from 'lucide-react';
// import { format, isSameDay } from 'date-fns';

// /* ----------------------------- Types ----------------------------- */

// interface BookingService {
//   serviceId?: string;
//   serviceName: string;
//   category: string;
//   duration: number; // minutes
//   price: number; // per unit
//   quantity: number;
// }

// type BookingStatus = 'upcoming' | 'past' | 'cancelled';

// interface Booking {
//   id: string;
//   userId: string;
//   customerName: string;
//    customerEmail?: string;
//   services: BookingService[];
//   bookingDate: Date;
//   bookingTime: string; // "HH:mm"
//   branch: string;
//   staff: string | null; // name string
//   totalPrice: number;
//   totalDuration: number;
//   status: BookingStatus;
//   paymentMethod: string;
//   emailConfirmation: boolean;
//   smsConfirmation: boolean;
//   createdAt: Date;
//   updatedAt: Date;
//   remarks?: string | null;
// }

// interface User {
//   id: string;
//   name: string;
//   email: string;
//   phone: string;
// }

// /* --------------------------- Constants --------------------------- */

// const BRANCH_OPTIONS = ['Al Bustan','Marina','TECOM','AL Muraqabat','IBN Batutta Mall'];
// const CATEGORY_OPTIONS = ['Facial', 'Hair', 'Nails', 'Lashes', 'Massage'];
// const PAYMENT_METHODS = ['cash', 'card'];

// // Fallback staff list (used only if Firestore `staff` collection not available)
// const STAFF_FALLBACK = ['Komal', 'Shameem', 'Do Thi Kim', 'Alishba'];

// /* ------------------------- Helper functions ---------------------- */

// const emptyService: BookingService = {
//   serviceId: '',
//   serviceName: '',
//   category: '',
//   duration: 30,
//   price: 0,
//   quantity: 1,
// };

// function calcTotals(services: BookingService[]) {
//   const totalPrice = services.reduce(
//     (sum, s) => sum + (Number(s.price) || 0) * (Number(s.quantity) || 0),
//     0
//   );
//   const totalDuration = services.reduce(
//     (sum, s) => sum + (Number(s.duration) || 0) * (Number(s.quantity) || 0),
//     0
//   );
//   return { totalPrice, totalDuration };
// }

// function minutesToHHMM(mins: number) {
//   const h = Math.floor(mins / 60)
//     .toString()
//     .padStart(2, '0');
//   const m = (mins % 60).toString().padStart(2, '0');
//   return `${h}:${m}`;
// }

// function toDisplayAMPM(hhmm: string) {
//   const [hStr, m] = hhmm.split(':');
//   let h = Number(hStr);
//   const suffix = h >= 12 ? 'PM' : 'AM';
//   if (h === 0) h = 12;
//   if (h > 12) h = h - 12;
//   return `${h}:${m} ${suffix}`;
// }

// function generateTimeSlots(
//   // start = 10 * 60, // 10:00
//   // end = 22 * 60, // 22:00 (10:00 PM)
//   // step = 15 // 15 mins
//     start = 0, // 10:00
//   end = 12 * 120, // 22:00 (10:00 PM)
//   step = 15 // 15 mins
// ) {
//   const slots: string[] = [];
//   for (let t = start; t <= end; t += step) {
//     slots.push(minutesToHHMM(t));
//   }
//   return slots;
// }

// // EXACT requirement: 10:00 AM → 10:00 PM (15-min steps)
// const TIMESLOTS = generateTimeSlots();

// /* =========================== Component =========================== */

// export default function BookingsPage() {
//   const [bookings, setBookings] = useState<Booking[]>([]);
//   const [users, setUsers] = useState<{ [key: string]: User }>({});
//   const [loading, setLoading] = useState(true);
//   const [searchTerm, setSearchTerm] = useState('');
//   const [statusFilter, setStatusFilter] = useState<string>('all');

//   // Create/Edit modal
//   const [showCreate, setShowCreate] = useState(false);
//   const [saving, setSaving] = useState(false);
//   const [deleting, setDeleting] = useState(false);
//   const [editingId, setEditingId] = useState<string | null>(null);

//   // form state
//   const [branch, setBranch] = useState(BRANCH_OPTIONS[0]);
//   const [serviceDate, setServiceDate] = useState<string>(() =>
//     format(new Date(), 'yyyy-MM-dd')
//   );
//   const [serviceTime, setServiceTime] = useState<string>('10:00'); // "HH:mm"
//   const [customerName, setCustomerName] = useState<string>('');
//   const [paymentMethod, setPaymentMethod] = useState<string>('cash');
//   const [emailConfirmation, setEmailConfirmation] = useState(false);
//   const [smsConfirmation, setSmsConfirmation] = useState(false);
//     const [customerEmail, setCustomerEmail] = useState<string>('');
//   const [status, setStatus] = useState<BookingStatus>('upcoming');
//   // form state


//   const [staff, setStaff] = useState<string>('');
//   const [services, setServices] = useState<BookingService[]>([{ ...emptyService }]);
//   const [remarks, setRemarks] = useState<string>('');
// // new code



// // new code
//   // Schedule board controls
//   const [scheduleDate, setScheduleDate] = useState<string>(() =>
//     format(new Date(), 'yyyy-MM-dd')
//   );
//   const [scheduleBranch, setScheduleBranch] = useState<string>('all');

//   // Dynamic staff fetched from Firestore
//   const [staffFromDB, setStaffFromDB] = useState<string[]>([]);

//   // Hour enabled/disabled state (keyed by hour string, e.g. "10", "11", "12")
//   const uniqueHours = Array.from(new Set(TIMESLOTS.map((t) => t.split(':')[0]))).sort(
//     (a, b) => Number(a) - Number(b)
//   );
//   const [enabledHours, setEnabledHours] = useState<Record<string, boolean>>(() => {
//     const map: Record<string, boolean> = {};
//     uniqueHours.forEach((h) => (map[h] = true));
//     return map;
//   });

//   /* -------------------- Load Staff from Firebase -------------------- */
//   useEffect(() => {
//     // Will use `staff` collection: each doc should have { name: string, active?: boolean }
//     const loadStaff = async () => {
//       try {
//         const snap = await getDocs(collection(db, 'staff'));
//         const list: string[] = [];
//         snap.forEach((d) => {
//           const data = d.data() as any;
//           if (data?.name) list.push(String(data.name));
//         });
//         // If no staff docs found, we fallback to your previous constants
//         setStaffFromDB(list.length ? list : STAFF_FALLBACK);
//       } catch {
//         // Safe fallback
//         setStaffFromDB(STAFF_FALLBACK);
//       }
//     };
//     loadStaff();
//   }, []);

//   const STAFF_OPTIONS = staffFromDB; // used everywhere below

//   /* -------------------- Load bookings (Realtime) -------------------- */
//   useEffect(() => {
//     const bookingsQuery = query(collection(db, 'bookings'), orderBy('createdAt', 'desc'));

//     const unsubscribe = onSnapshot(bookingsQuery, (snapshot) => {
//       const bookingsData = snapshot.docs.map((d) => {
//         const data = d.data() as any;
//         return {
//           id: d.id,
//           userId: data.userId || '',
//           customerName: data.customerName || '',
//           customerEmail: data.customerEmail || '', // ✅ added
//           services: (data.services || []) as BookingService[],
//           bookingDate: data.bookingDate?.toDate() || new Date(),
//           bookingTime: data.bookingTime || '',
//           branch: data.branch || '',
//          // staff: data.staff ?? null,
//          //staff: data.staff || '—', // fallback to '—' if empty
//          //staff: typeof data.staff === 'string' && data.staff.trim() ? data.staff : 'no',
//         // staff:data.staff ||"_",
       
//        staff: (data.staffName || data.staff || '—'), // ✅ fixed

//           totalPrice: data.totalPrice || 0,
//           totalDuration: data.totalDuration || 0,
//           status: (data.status as BookingStatus) || 'upcoming',
//           paymentMethod: data.paymentMethod || 'cash',
//           emailConfirmation: data.emailConfirmation || false,
//           smsConfirmation: data.smsConfirmation || false,
//           createdAt: data.createdAt?.toDate() || new Date(),
//           updatedAt: data.updatedAt?.toDate() || new Date(),
//           remarks: data.remarks ?? null,
//         } as Booking;
//       });
//       setBookings(bookingsData);
//       setLoading(false);
//     });

//     return () => unsubscribe();
//   }, []);

//   /* ------------------------- Load user details ------------------------- */
//   useEffect(() => {
//     const loadUsers = async () => {
//       const usersQuery = query(collection(db, 'users'));
//       const usersSnapshot = await getDocs(usersQuery);
//       const usersData: { [key: string]: User } = {};

//       usersSnapshot.docs.forEach((doc) => {
//         const data = doc.data() as any;
//         usersData[doc.id] = {
//           id: doc.id,
//           name: data.name || data.displayName || 'Unknown User',
//           email: data.email || '',
//           phone: data.phone || data.phoneNumber || '',
//         };
//       });

//       setUsers(usersData);
//     };

//     loadUsers();
//   }, []);

//   /* --------------------------- Filtering logic -------------------------- */
//   const filteredBookings = bookings.filter((booking) => {
//     const q = searchTerm.toLowerCase();
//     const matchesSearch =
//       booking.customerName.toLowerCase().includes(q) ||
//       booking.branch.toLowerCase().includes(q) ||
//       booking.services.some((s) => s.serviceName.toLowerCase().includes(q));

//     const matchesStatus = statusFilter === 'all' || booking.status === (statusFilter as BookingStatus);

//     return matchesSearch && matchesStatus;
//   });

//   /* --------------------------- Update helpers --------------------------- */
//   const updateBookingStatus = async (bookingId: string, newStatus: BookingStatus) => {
//     try {
//       const bookingRef = doc(db, 'bookings', bookingId);
//       await updateDoc(bookingRef, {
//         status: newStatus,
//         updatedAt: serverTimestamp(),
//       });
//     } catch (error) {
//       console.error('Error updating booking status:', error);
//       alert('Failed to update status.');
//     }
//   };

//   const getStatusBadge = (s: string) => {
//     switch (s) {
//       case 'upcoming':
//         return 'bg-blue-100 text-blue-800';
//       case 'past':
//         return 'bg-green-100 text-green-800';
//       case 'cancelled':
//         return 'bg-red-100 text-red-800';
//       default:
//         return 'bg-gray-100 text-gray-800';
//     }
//   };

//   const getStatusBlock = (s: BookingStatus) => {
//     switch (s) {
//       case 'upcoming':
//         return 'bg-emerald-50 border-emerald-300 text-emerald-800';
//       case 'past':
//         return 'bg-gray-50 border-gray-300 text-gray-700';
//       case 'cancelled':
//         return 'bg-rose-50 border-rose-300 text-rose-800 line-through';
//       default:
//         return 'bg-slate-50 border-slate-300 text-slate-800';
//     }
//   };

//   const getPaymentIcon = (method: string) => {
//     switch (method.toLowerCase()) {
//       case 'card':
//       case 'credit':
//       case 'debit':
//         return <CreditCard className="w-4 h-4" />;
//       default:
//         return <CreditCard className="w-4 h-4" />;
//     }
//   };

//   /* -------------------------- Create/Edit Handlers ------------------------- */

//   const resetForm = () => {
//     setBranch(BRANCH_OPTIONS[0]);
//     setCustomerEmail(''); // ✅ reset email
//     setServiceDate(format(new Date(), 'yyyy-MM-dd'));
//     setServiceTime('10:00');
//     setCustomerName('');
//     setPaymentMethod('cash');
//     setEmailConfirmation(false);
//     setSmsConfirmation(false);
//     setStatus('upcoming');
//     setStaff('');
//     setServices([{ ...emptyService }]);
//     setRemarks('');
//     setEditingId(null);
//   };

//   const openForCreate = () => {
//     resetForm();
//     setShowCreate(true);
//   };

//   // Open modal to CREATE, but prefill staff+time from a grid cell
//   const openForCreateFromCell = (prefillStaff: string, prefillTime: string) => {
//     // If hour disabled, do nothing
//     const hour = prefillTime.split(':')[0];
//     if (!enabledHours[hour]) return;

//     resetForm();
//     setStaff(prefillStaff);
//     setServiceTime(prefillTime);
//     // Set serviceDate to scheduleDate (board date)
//     setServiceDate(scheduleDate);
//     setShowCreate(true);
     
//   };

//   const openForEdit = (b: Booking) => {
//     setEditingId(b.id);
//     setBranch(b.branch || BRANCH_OPTIONS[0]);
//     setServiceDate(format(b.bookingDate, 'yyyy-MM-dd'));
//     setServiceTime(b.bookingTime || '10:00');
//     setCustomerName(b.customerName || '');
//     setCustomerEmail((b as any).customerEmail || ''); // ✅ load email
//     setPaymentMethod(b.paymentMethod || 'cash');
//     setEmailConfirmation(!!b.emailConfirmation);
//     setSmsConfirmation(!!b.smsConfirmation);
//     setStatus(b.status || 'upcoming');
//     setStaff(b.staff || '');
//     setServices(
//       b.services && b.services.length > 0
//         ? b.services.map((s) => ({
//             serviceId: s.serviceId || '',
//             serviceName: s.serviceName || '',
//             category: s.category || '',
//             duration: Number(s.duration) || 0,
//             price: Number(s.price) || 0,
//             quantity: Number(s.quantity) || 1,
//           }))
//         : [{ ...emptyService }]
//     );
//     setRemarks(b.remarks || '');
//     setShowCreate(true);
//   };

//   const handleAddServiceRow = () => {
//     setServices((prev) => [...prev, { ...emptyService }]);
//   };

//   const handleRemoveServiceRow = (index: number) => {
//     setServices((prev) => prev.filter((_, i) => i !== index));
//   };

//   const handleServiceChange = (
//     index: number,
//     field: keyof BookingService,
//     value: string | number
//   ) => {
//     setServices((prev) =>
//       prev.map((s, i) => (i === index ? { ...s, [field]: value } : s))
//     );
//   };

//   const formTotals = calcTotals(services);

//   const validateForm = () => {
//     if (!customerName.trim()) return 'Customer name is required';
//     if (!serviceDate) return 'Service date is required';
//     if (!serviceTime) return 'Service time is required';
//     if (!branch) return 'Branch is required';
//     if (!staff) return 'Staff is required';
//     if (services.length === 0) return 'Add at least one service';
//     const hasName = services.every((s) => s.serviceName.trim().length > 0);
//     if (!hasName) return 'Each service must have a name';
//     // also ensure selected time hour is enabled
//     const selectedHour = serviceTime.split(':')[0];
//     if (!enabledHours[selectedHour]) return 'Selected time falls into a disabled hour';
//     return null;
//   };







// const saveBooking = async () => {
//   const err = validateForm();
//   if (err) {
//     alert(err);
//     return;
//   }

//   try {
//     setSaving(true);

//     // Assign userId: existing booking keeps its id, new booking (or empty userId) gets uuid
//     const assignedUserId =
//       editingId
//         ? bookings.find((b) => b.id === editingId)?.userId || uuidv4()
//         : uuidv4();

//     const payload = {
//       userId: assignedUserId, // ✅ now always filled, even for upcoming
//       customerName: customerName.trim(),
     
//        customerEmail: customerEmail?.trim() || '', // ✅ add this
//       services: services.map((s) => ({
//         ...s,
//         price: Number(s.price) || 0,
//         duration: Number(s.duration) || 0,
//         quantity: Number(s.quantity) || 0,
//       })),
//       bookingDate: Timestamp.fromDate(new Date(serviceDate + 'T00:00:00')),
//       bookingTime: serviceTime,
//       branch,
//       staff: staff || null,
//     //staff: typeof data.staff === 'string' && data.staff.trim() ? data.staff : '—',

//       totalPrice: formTotals.totalPrice,
//       totalDuration: formTotals.totalDuration,
//       status, // upcoming / past / cancelled
//       paymentMethod,
//       emailConfirmation,
//       smsConfirmation,
//       updatedAt: serverTimestamp(),
//       remarks: remarks || null,
//     };

//     if (editingId) {
//       const ref = doc(db, 'bookings', editingId);
//       await updateDoc(ref, payload);
//     } else {
//       await addDoc(collection(db, 'bookings'), {
//         ...payload,
//         createdAt: serverTimestamp(),
//       });
//     }

//     setShowCreate(false);
//     resetForm();
//   } catch (e) {
//     console.error('Error saving booking:', e);
//     alert('Failed to save booking. Check console for details.');
//   } finally {
//     setSaving(false);
//   }
// };

  

//   const deleteBooking = async () => {
//     if (!editingId) return;
//     if (!confirm('Delete this booking? This action cannot be undone.')) return;

//     try {
//       setDeleting(true);
//       await deleteDoc(doc(db, 'bookings', editingId));
//       setShowCreate(false);
//       resetForm();
//     } catch (e) {
//       console.error('Error deleting booking:', e);
//       alert('Failed to delete booking.');
//     } finally {
//       setDeleting(false);
//     }
//   };

//   /* ------------------------------ Schedule Board Data ------------------------------ */

//   const bookingsForSchedule = useMemo(() => {
//     const target = new Date(scheduleDate + 'T00:00:00');
//     return bookings.filter((b) => {
//       const sameDay = isSameDay(b.bookingDate, target);
//       const branchOk = scheduleBranch === 'all' || b.branch === scheduleBranch;
//       return sameDay && branchOk;
//     });
//   }, [bookings, scheduleDate, scheduleBranch]);

//   // fast lookup: { 'HH:mm': { staffName: Booking[] } } but we need single cell show (first booking)
//   const scheduleMatrix = useMemo(() => {
//     const map: Record<string, Record<string, Booking[]>> = {};
//     TIMESLOTS.forEach((t) => {
//       map[t] = {};
//       STAFF_OPTIONS.forEach((s) => (map[t][s] = []));
//     });
//     bookingsForSchedule.forEach((b) => {
//       const t = b.bookingTime;
//       const s = b.staff || '';
//       if (t && s && map[t] && map[t][s] !== undefined) {
//         map[t][s].push(b);
//       }
//     });
//     return map;
//   }, [bookingsForSchedule, STAFF_OPTIONS]);

//   /* ------------------------------- Render ------------------------------ */

//   if (loading) {
//     return (
//       <div className="p-6">
//         <div className="max-w-7xl mx-auto">
//           <div className="flex items-center justify-center py-12">
//             <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600"></div>
//             <span className="ml-3 text-pink-600">Loading bookings...</span>
//           </div>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div>
  
     
//         {/* Header */}
//         <div className="mb-8 flex items-start sm:items-center justify-around gap-4 ">
//           <div>
//             <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
//               Customers
//             </h1>
//             <p className="text-gray-600 dark:text-white">
//               All Customers Data
//             </p>
//           </div>

          
//         </div>

//         {/* Schedule Board Controls */}
//         <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6 w-[1100px]">
//           <div className="grid grid-cols-1 md:grid-cols-4 gap-6 ">
//             <div className="flex items-center">
//               <Calendar className="w-5 h-5 text-gray-500 mr-2" />
//               <input
//                 type="date"
//                 value={scheduleDate}
//                 onChange={(e) => setScheduleDate(e.target.value)}
//                 className="w-full border rounded-md px-3 py-2"
//               />
//             </div>
//             <div className="flex items-center">
//               <MapPin className="w-5 h-5 text-gray-500 mr-2" />
//               <select
//                 value={scheduleBranch}
//                 onChange={(e) => setScheduleBranch(e.target.value)}
//                 className="w-full border rounded-md px-3 py-2"
//               >
//                 <option value="all">All Branches</option>
//                 {BRANCH_OPTIONS.map((b) => (
//                   <option key={b} value={b}>
//                     {b}
//                   </option>
//                 ))}
//               </select>
//             </div>

//             {/* Hour toggles: minimal UI addition, consistent with existing controls */}
//             <div className="md:col-span-2">
              
//             </div>
//           </div>
//         </div>

//  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6 w-[1100px]">
//           <div className="flex flex-col md:flex-row gap-4">
//             <div className="flex-1">
//               <div className="relative">
//                 <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
//                 <input
//                   type="text"
//                   placeholder="Search by customer name, branch, or service..."
//                   value={searchTerm}
//                   onChange={(e) => setSearchTerm(e.target.value)}
//                   className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
//                 />
//               </div>
//             </div>

//             <div className="md:w-48">
//               <select
//                 value={statusFilter}
//                 onChange={(e) => setStatusFilter(e.target.value)}
//                 className="w-full bg-black text-white px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
//               >
//                 <option value="all">All Status</option>
//                 <option value="upcoming">Upcoming</option>
//                 <option value="past">Past</option>
//                 <option value="cancelled">Cancelled</option>
//               </select>
//             </div>
//           </div>
//         </div>

      
          
    

//         {/* ======================== SCHEDULE BOARD (NEW ORIENTATION) ======================== */}
//         <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-x-auto mb-10 w-0">
//           {/* Grid: first column is time (sticky left), first row is header with staff (sticky top) */}
//           <div
//             className="min-w-[900px] relative"
//             style={{}}
//           >
            

//             {/* Body: rows for each timeslot */}
            
//                   <div className="">
//               {TIMESLOTS.map((t) => {
//                 const hour = t.split(':')[0];
//                 const hourEnabled = !!enabledHours[hour];

//                 return (
//                     <div
//                   key={t}
//                   className="grid"
//                   style={{ gridTemplateColumns: `180px repeat(${STAFF_OPTIONS.length}, 200px)` }}
//                 >

                         
                    
                  
//                 </div>
//               )}
//                 )}
//             </div>
//           </div>
//         </div>

//         {/* Filters and Search (List view) */}

//         {/* Bookings Table (click row to edit) */}
//         <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden w-[1150px]">
//           <div className="overflow-x-auto">
//             <table className="min-w-full divide-y divide-gray-200">
//               <thead className="bg-gray-50">
//                 <tr>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                     Customer
//                   </th>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                     Services
//                   </th>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                     Date & Time
//                   </th>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                     Staff
//                   </th>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                     Branch
//                   </th>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                     Payment
//                   </th>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                     Status
//                   </th>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                     Actions
//                   </th>
//                 </tr>
//               </thead>
//               <tbody className="bg-white divide-y divide-gray-200">
//                 {filteredBookings.map((booking) => {
//                   const user = users[booking.userId];
//                   return (
//                     <tr
//                       key={booking.id}
//                       className="hover:bg-gray-50 cursor-pointer"
//                       onClick={() => openForEdit(booking)}
//                     >
//                       <td className="px-6 py-4 whitespace-nowrap">
//                         <div className="flex items-center">
//                           <div className="flex-shrink-0 h-10 w-10">
//                             <div className="h-10 w-10 rounded-full bg-pink-100 flex items-center justify-center">
//                               <User className="h-5 w-5 text-pink-600" />
//                             </div>
//                           </div>
//                           <div className="ml-4">
//                             <div className="text-sm font-medium text-gray-900">
//                               {booking.customerName}
//                             </div>
//                              <div className="text-sm text-gray-500">
//                               <div className="text-sm text-gray-500">{booking.customerEmail || 'No email'}</div>
//                             </div> 
//                           </div>
//                         </div>
//                       </td>
//                       <td className="px-6 py-4">
//                         <div className="text-sm text-gray-900">
//                           {booking.services.slice(0, 2).map((service, index) => (
//                             <div key={index} className="mb-1">
//                               {service.serviceName}{' '}
//                               {service.quantity > 1 && `(x${service.quantity})`}
//                             </div>
//                           ))}
//                           {booking.services.length > 2 && (
//                             <div className="text-xs text-gray-500">
//                               +{booking.services.length - 2} more
//                             </div>
//                           )}
//                         </div>
//                       </td>
//                       <td className="px-6 py-4 whitespace-nowrap">
//                         <div className="flex items-center text-sm text-gray-900">
//                           <Calendar className="w-4 h-4 mr-2 text-gray-400" />
//                           <div>
//                             <div>{format(booking.bookingDate, 'MMM dd, yyyy')}</div>
//                             <div className="text-xs text-gray-500 flex items-center mt-1">
//                               <Clock className="w-3 h-3 mr-1" />
//                               {toDisplayAMPM(booking.bookingTime)}
//                             </div>
//                           </div>
//                         </div>
//                       </td>
//                       <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
//                         {booking.staff || '—'}
//                       </td>
//                       <td className="px-6 py-4 whitespace-nowrap">
//                         <div className="flex items-center text-sm text-gray-900">
//                           <MapPin className="w-4 h-4 mr-2 text-gray-400" />
//                           {booking.branch}
//                         </div>
//                       </td>
//                       <td className="px-6 py-4 whitespace-nowrap">
//                         <div className="text-sm text-gray-900">
//                           <div className="flex items-center">
//                             {getPaymentIcon(booking.paymentMethod)}
//                             <span className="ml-2">${booking.totalPrice.toFixed(2)}</span>
//                           </div>
//                           <div className="text-xs text-gray-500 capitalize">
//                             {booking.paymentMethod}
//                           </div>
//                         </div>
//                       </td>
//                       <td className="px-6 py-4 whitespace-nowrap">
//                         <span
//                           className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full capitalize ${getStatusBadge(
//                             booking.status
//                           )}`}
//                         >
//                           {booking.status}
//                         </span>
//                       </td>
//                       <td
//                         className="px-6 py-4 whitespace-nowrap text-sm font-medium"
//                         onClick={(e) => e.stopPropagation()}
//                       >
//                         <div className="flex space-x-2">
//                           <button
//                             onClick={() => openForEdit(booking)}
//                             className="text-emerald-700 hover:text-emerald-900"
//                             title="Edit booking"
//                           >
//                             <Edit3 className="w-4 h-4" />
//                           </button>
//                           {booking.status === 'upcoming' && (
//                             <>
//                               <button
//                                 onClick={() => updateBookingStatus(booking.id, 'past')}
//                                 className="text-green-600 hover:text-green-900"
//                                 title="Mark as completed"
//                               >
//                                 <CheckCircle className="w-4 h-4" />
//                               </button>
//                               <button
//                                 onClick={() => updateBookingStatus(booking.id, 'cancelled')}
//                                 className="text-red-600 hover:text-red-900"
//                                 title="Cancel booking"
//                               >
//                                 <XCircle className="w-4 h-4" />
//                               </button>
//                             </>
//                           )}
//                         </div>
//                       </td>
//                     </tr>
//                   );
//                 })}
//               </tbody>
//             </table>
//           </div>

//           {filteredBookings.length === 0 && (
//             <div className="text-center py-12">
//               <Calendar className="mx-auto h-12 w-12 text-gray-400" />
//               <h3 className="mt-2 text-sm font-medium text-gray-900">No bookings found</h3>
//               <p className="mt-1 text-sm text-gray-500">
//                 {searchTerm || statusFilter !== 'all'
//                   ? 'Try adjusting your search or filter criteria.'
//                   : 'No bookings have been made yet.'}
//               </p>
//             </div>
//           )}
//         </div>

//         {/* ===================== CREATE / EDIT MODAL (PURE TAILWIND) ===================== */}
//         {showCreate && (
//           <div className="fixed inset-0 bg-gray-600 bg-opacity-50 z-50 overflow-y-auto h-full w-full">
//             <div className="relative top-10 mx-auto w-11/12 md:w-4/5 lg:w-3/4 xl:w-2/3">
//               <div className="bg-white rounded-lg shadow-xl border">
//                 {/* Header */}
//                 <div className="flex items-center justify-between px-6 py-4 border-b">
//                   <h3 className="text-lg font-semibold">
//                     {editingId ? 'Edit Schedule' : 'Add Schedule'}
//                   </h3>
//                   <div className="flex items-center gap-2">
//                     {editingId && (
//                       <button
//                         onClick={deleteBooking}
//                         disabled={deleting}
//                         className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-white bg-red-600 hover:bg-red-700 disabled:opacity-60"
//                         title="Delete booking"
//                       >
//                         <Trash2 className="w-4 h-4" />
//                         Delete
//                       </button>
//                     )}
//                     <button
//                       onClick={() => {
//                         setShowCreate(false);
//                         resetForm();
//                       }}
//                       className="text-gray-400 hover:text-gray-600"
//                       title="Close"
//                     >
//                       <XCircle className="w-6 h-6" />
//                     </button>
//                   </div>
//                 </div>

//                 {/* Body */}
//                 <div className="p-6 space-y-6">
//                   {/* Top selects */}
//                   <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
//                     <div>
//                       <label className="block text-sm font-medium text-gray-700">Branch</label>
//                       <select
//                         className="mt-1 w-full border rounded-md px-3 py-2"
//                         value={branch}
//                         onChange={(e) => setBranch(e.target.value)}
//                       >
//                         {BRANCH_OPTIONS.map((b) => (
//                           <option key={b} value={b}>
//                             {b}
//                           </option>
//                         ))}
//                       </select>
//                     </div>

//                     <div>
//                       <label className="block text-sm font-medium text-gray-700">Category</label>
//                       <select
//                         className="mt-1 w-full border rounded-md px-3 py-2"
//                         onChange={(e) => {
//                           setServices((prev) =>
//                             prev.map((s, i) => (i === 0 ? { ...s, category: e.target.value } : s))
//                           );
//                         }}
//                       >
//                         <option value="">Select One</option>
//                         {CATEGORY_OPTIONS.map((c) => (
//                           <option key={c} value={c}>
//                             {c}
//                           </option>
//                         ))}
//                       </select>
//                     </div>

//                     <div>
//                       <label className="block text-sm font-medium text-gray-700">Staff</label>
//                       <select
//                         className="mt-1 w-full border rounded-md px-3 py-2"
//                         value={staff}
//                         onChange={(e) => setStaff(e.target.value)}
//                       >
//                         <option value="">Select One</option>
//                         {STAFF_OPTIONS.map((s) => (
//                           <option key={s} value={s}>
//                             {s}
//                           </option>
//                         ))}
//                       </select>
//                     </div>

//                     <div>
//                       <label className="block text-sm font-medium text-gray-700">
//                         Payment Method
//                       </label>
//                       <select
//                         className="mt-1 w-full border rounded-md px-3 py-2"
//                         value={paymentMethod}
//                         onChange={(e) => setPaymentMethod(e.target.value)}
//                       >
//                         {PAYMENT_METHODS.map((p) => (
//                           <option key={p} value={p}>
//                             {p.toUpperCase()}
//                           </option>
//                         ))}
//                       </select>
//                     </div>
//                   </div>

//                   {/* Date & Time */}
//                   <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//                     <div>
//                       <label className="block text-sm font-medium text-gray-700">
//                         Service Date
//                       </label>
//                       <input
//                         type="date"
//                         className="mt-1 w-full border rounded-md px-3 py-2"
//                         value={serviceDate}
//                         onChange={(e) => setServiceDate(e.target.value)}
//                       />
//                     </div>
//                     <div>
//                       <label className="block text-sm font-medium text-gray-700">Time Slot</label>
//                       <select
//                         className="mt-1 w-full border rounded-md px-3 py-2"
//                         value={serviceTime}
//                         onChange={(e) => setServiceTime(e.target.value)}
//                       >
//                         {TIMESLOTS.filter(slot => {
//                           // only show slots whose hour is enabled
//                           const hour = slot.split(':')[0];
//                           return !!enabledHours[hour];
//                         }).map((slot) => (
//                           <option key={slot} value={slot}>
//                             {toDisplayAMPM(slot)}
//                           </option>
//                         ))}
//                       </select>
//                     </div>
//                     <div>
//                       <label className="block text-sm font-medium text-gray-700">Customer</label>
//                       <input
//                         type="text"
//                         placeholder="Customer name"
//                         className="mt-1 w-full border rounded-md px-3 py-2"
//                         value={customerName}
//                         onChange={(e) => setCustomerName(e.target.value)}
//                       />
//                     </div>
//                   </div>

//                   {/* Services table */}
//                   <div className="border rounded-lg">
//                     <div className="grid grid-cols-12 gap-2 px-4 py-3 bg-gray-50 text-xs font-semibold">
//                       <div className="col-span-4">Service</div>
//                       <div className="col-span-2">Category</div>
//                       <div className="col-span-2">Duration (min)</div>
//                       <div className="col-span-2">Price</div>
//                       <div className="col-span-1">Qty</div>
//                       <div className="col-span-1 text-right">—</div>
//                     </div>

//                     {services.map((s, idx) => (
//                       <div key={idx} className="grid grid-cols-12 gap-2 px-4 py-3 border-t">
//                         <div className="col-span-4">
//                           <input
//                             className="w-full border rounded-md px-3 py-2"
//                             placeholder="Service name"
//                             value={s.serviceName}
//                             onChange={(e) => handleServiceChange(idx, 'serviceName', e.target.value)}
//                           />
//                         </div>
//                         <div className="col-span-2">
//                           <select
//                             className="w-full border rounded-md px-3 py-2"
//                             value={s.category}
//                             onChange={(e) => handleServiceChange(idx, 'category', e.target.value)}
//                           >
//                             <option value="">Select</option>
//                             {CATEGORY_OPTIONS.map((c) => (
//                               <option key={c} value={c}>
//                                 {c}
//                               </option>
//                             ))}
//                           </select>
//                         </div>
//                         <div className="col-span-2">
//                           <input
//                             type="number"
//                             min={0}
//                             className="w-full border rounded-md px-3 py-2"
//                             value={s.duration}
//                             onChange={(e) =>
//                               handleServiceChange(idx, 'duration', Number(e.target.value || 0))
//                             }
//                           />
//                         </div>
//                         <div className="col-span-2">
//                           <input
//                             type="number"
//                             min={0}
//                             step="0.01"
//                             className="w-full border rounded-md px-3 py-2"
//                             value={s.price}
//                             onChange={(e) =>
//                               handleServiceChange(idx, 'price', Number(e.target.value || 0))
//                             }
//                           />
//                         </div>
//                         <div className="col-span-1">
//                           <input
//                             type="number"
//                             min={1}
//                             className="w-full border rounded-md px-3 py-2"
//                             value={s.quantity}
//                             onChange={(e) =>
//                               handleServiceChange(idx, 'quantity', Number(e.target.value || 1))
//                             }
//                           />
//                         </div>
//                         <div className="col-span-1 flex justify-end items-center">
//                           {services.length > 1 && (
//                             <button
//                               onClick={() => handleRemoveServiceRow(idx)}
//                               className="p-2 rounded hover:bg-red-50 text-red-600"
//                               title="Remove"
//                             >
//                               <Trash2 className="w-4 h-4" />
//                             </button>
//                           )}
//                         </div>
//                       </div>
//                     ))}

//                     <div className="px-4 py-3 border-t flex justify-between items-center">
//                       <button
//                         onClick={handleAddServiceRow}
//                         className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
//                       >
//                         <Plus className="w-4 h-4" />
//                         Add more service
//                       </button>

//                       <div className="text-sm text-gray-700">
//                         <span className="mr-4">
//                           <strong>Total Duration:</strong> {formTotals.totalDuration} min
//                         </span>
//                         <span>
//                           <strong>Total Price:</strong> ${formTotals.totalPrice.toFixed(2)}
//                         </span>
//                       </div>
//                     </div>
//                   </div>

//                   {/* Remarks & toggles */}
//                   <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//                     <div className="md:col-span-2">
//                       <label className="block text-sm font-medium text-gray-700">
//                         Remarks (optional)
//                       </label>
//                       <textarea
//                         className="mt-1 w-full border rounded-md px-3 py-2 min-h-[80px]"
//                         value={remarks}
//                         onChange={(e) => setRemarks(e.target.value)}
//                       />
//                     </div>
//                     <div className="space-y-4">
//                       <div className="flex items-center justify-between border rounded-md px-3 py-2">
//                         <span className="text-sm">Send booking notification by email</span>
//                         <input
//                           type="checkbox"
//                           checked={emailConfirmation}
//                           onChange={(e) => setEmailConfirmation(e.target.checked)}
//                         />
//                       </div>
//                       <div className="flex items-center justify-between border rounded-md px-3 py-2">
//                         <span className="text-sm">Send booking notification by SMS</span>
//                         <input
//                           type="checkbox"
//                           checked={smsConfirmation}
//                           onChange={(e) => setSmsConfirmation(e.target.checked)}
//                         />
//                       </div>
//                       <div>
//                         <label className="block text-sm font-medium text-gray-700">
//                           Application Status
//                         </label>
//                         <select
//                           className="mt-1 w-full border rounded-md px-3 py-2"
//                           value={status}
//                           onChange={(e) => setStatus(e.target.value as BookingStatus)}
//                         >
//                           <option value="upcoming">Approved (Upcoming)</option>
//                           <option value="past">Completed (Past)</option>
//                           <option value="cancelled">Cancelled</option>
//                         </select>
//                       </div>
//                     </div>
//                   </div>
//                 </div>

//                 {/* Footer */}
//                 <div className="px-6 py-4 border-t flex justify-end gap-3">
//                   <button
//                     onClick={() => {
//                       setShowCreate(false);
//                       resetForm();
//                     }}
//                     className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
//                     disabled={saving || deleting}
//                   >
//                     Close
//                   </button>
//                   <button
//                     onClick={saveBooking}
//                     className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-md hover:bg-emerald-700 disabled:opacity-60"
//                     disabled={saving || deleting}
//                   >
//                     {saving ? (editingId ? 'Updating...' : 'Saving...') : editingId ? 'Update' : 'Save'}
//                   </button>
//                 </div>
//               </div>
//             </div>
//           </div>
//         )}
//         {/* =================== END CREATE / EDIT MODAL =================== */}
//       </div>

   
//   );
// }




// invoice code corrected
// 'use client';

// import { useState, useEffect, useMemo } from 'react';
// import AccessWrapper from '@/components/AccessWrapper';
// import { setDoc } from 'firebase/firestore';
// import jsPDF from 'jspdf';
// import autoTable from 'jspdf-autotable';
// import { getStorage, ref, uploadBytes } from 'firebase/storage';

// import { v4 as uuidv4 } from 'uuid';

// import { getAuth } from "firebase/auth";
// import {
//   collection,
//   query,
//   orderBy,
//   onSnapshot,
//   doc,
//   updateDoc,
//   Timestamp,
//   getDocs,
//   addDoc,
//   serverTimestamp,
//   deleteDoc,
// } from 'firebase/firestore';
// import { db } from '@/lib/firebase';
// import 'jspdf-autotable'; 
// import 'jspdf-autotable';

// import {
//   Calendar,
//   Clock,
//   MapPin,
//   User,
//   CreditCard,
//   Search,
//   CheckCircle,
//   XCircle,
//   AlertCircle,
//   Plus,
//   Trash2,
//   Edit3,
// } from 'lucide-react';
// import { format, isSameDay } from 'date-fns';

// /* ----------------------------- Types ----------------------------- */

// interface BookingService {
//   serviceId?: string;
//   serviceName: string;
//   category: string;
//   duration: number; // minutes
//   price: number; // per unit
//   quantity: number;
// }

// type BookingStatus = 'upcoming' | 'past' | 'cancelled';

// interface Booking {
//   id: string;
//   userId: string;
//   customerName: string;
//    customerEmail?: string;
//   services: BookingService[];
//   bookingDate: Date;
//   bookingTime: string; // "HH:mm"
//   branch: string;
//   staff: string | null; // name string
//   totalPrice: number;
//   totalDuration: number;
//   status: BookingStatus;
//   paymentMethod: string;
//   emailConfirmation: boolean;
//   smsConfirmation: boolean;
//   createdAt: Date;
//   updatedAt: Date;
//   remarks?: string | null;
// }

// interface User {
//   id: string;
//   name: string;
//   email: string;
//   phone: string;
// }

// /* --------------------------- Constants --------------------------- */

// const BRANCH_OPTIONS = ['Al Bustan','Marina','TECOM','AL Muraqabat','IBN Batutta Mall'];
// const CATEGORY_OPTIONS = ['Facial', 'Hair', 'Nails', 'Lashes', 'Massage'];
// const PAYMENT_METHODS = ['cash', 'card'];

// // Fallback staff list (used only if Firestore `staff` collection not available)
// const STAFF_FALLBACK = ['Komal', 'Shameem', 'Do Thi Kim', 'Alishba'];

// /* ------------------------- Helper functions ---------------------- */

// const emptyService: BookingService = {
//   serviceId: '',
//   serviceName: '',
//   category: '',
//   duration: 30,
//   price: 0,
//   quantity: 1,
// };

// function calcTotals(services: BookingService[]) {
//   const totalPrice = services.reduce(
//     (sum, s) => sum + (Number(s.price) || 0) * (Number(s.quantity) || 0),
//     0
//   );
//   const totalDuration = services.reduce(
//     (sum, s) => sum + (Number(s.duration) || 0) * (Number(s.quantity) || 0),
//     0
//   );
//   return { totalPrice, totalDuration };
// }

// function minutesToHHMM(mins: number) {
//   const h = Math.floor(mins / 60)
//     .toString()
//     .padStart(2, '0');
//   const m = (mins % 60).toString().padStart(2, '0');
//   return `${h}:${m}`;
// }

// function toDisplayAMPM(hhmm: string) {
//   const [hStr, m] = hhmm.split(':');
//   let h = Number(hStr);
//   const suffix = h >= 12 ? 'PM' : 'AM';
//   if (h === 0) h = 12;
//   if (h > 12) h = h - 12;
//   return `${h}:${m} ${suffix}`;
// }

// function generateTimeSlots(
//   // start = 10 * 60, // 10:00
//   // end = 22 * 60, // 22:00 (10:00 PM)
//   // step = 15 // 15 mins
//     start = 0, // 10:00
//   end = 12 * 120, // 22:00 (10:00 PM)
//   step = 15 // 15 mins
// ) {
//   const slots: string[] = [];
//   for (let t = start; t <= end; t += step) {
//     slots.push(minutesToHHMM(t));
//   }
//   return slots;
// }

// // EXACT requirement: 10:00 AM → 10:00 PM (15-min steps)
// const TIMESLOTS = generateTimeSlots();

// /* =========================== Component =========================== */

// export default function BookingsPage() {
//   const [bookings, setBookings] = useState<Booking[]>([]);
//   const [users, setUsers] = useState<{ [key: string]: User }>({});
//   const [loading, setLoading] = useState(true);
//   const [searchTerm, setSearchTerm] = useState('');
//   const [statusFilter, setStatusFilter] = useState<string>('all');

//   // Create/Edit modal
//   const [showCreate, setShowCreate] = useState(false);
//   const [saving, setSaving] = useState(false);
//   const [deleting, setDeleting] = useState(false);
//   const [editingId, setEditingId] = useState<string | null>(null);

//   // form state
//   const [branch, setBranch] = useState(BRANCH_OPTIONS[0]);
//   const [serviceDate, setServiceDate] = useState<string>(() =>
//     format(new Date(), 'yyyy-MM-dd')
//   );
//   const [serviceTime, setServiceTime] = useState<string>('10:00'); // "HH:mm"
//   const [customerName, setCustomerName] = useState<string>('');
//   const [paymentMethod, setPaymentMethod] = useState<string>('cash');
//   const [emailConfirmation, setEmailConfirmation] = useState(false);
//   const [smsConfirmation, setSmsConfirmation] = useState(false);
//     const [customerEmail, setCustomerEmail] = useState<string>('');
//   const [status, setStatus] = useState<BookingStatus>('upcoming');
//   // form state


//   const [staff, setStaff] = useState<string>('');
//   const [services, setServices] = useState<BookingService[]>([{ ...emptyService }]);
//   const [remarks, setRemarks] = useState<string>('');
// // new code


// // 2️⃣ Add this function inside your component (BookingsPage)


// //firebase


// const saveInvoiceToFirestore = async (booking: Booking) => {
//   try {
//     if (!booking || !booking.services || booking.services.length === 0) {
//       throw new Error('Invalid booking data or empty services');
//     }

//     const serviceTableData = booking.services.map((s) => ({
//       serviceName: s.serviceName || 'N/A',
//       quantity: Number(s.quantity || 0),
//       unitPrice: Number(s.price || 0),
//       total: Number(s.price || 0) * Number(s.quantity || 0),
//     }));

//     const invoiceId = uuidv4();

//     const invoiceData = {
//       invoiceId,
//       customerId: booking.customerId || booking.customerName,
//       customerName: booking.customerName || 'N/A',
//       customerEmail: booking.customerEmail || null,
//       bookingDate: booking.bookingDate || null,
//       bookingTime: booking.bookingTime || null,
//       branch: booking.branch || 'N/A',
//       staff: booking.staff || null,
//       paymentMethod: booking.paymentMethod || 'N/A',
//       remarks: booking.remarks || null,
//       totalDuration: booking.totalDuration || 0,
//       totalPrice: booking.totalPrice || 0,
//       services: serviceTableData,
//       createdAt: serverTimestamp(),
//     };

//     // Save in Firestore
//     await setDoc(doc(collection(db, 'past_invoices'), invoiceId), invoiceData);

//     console.log('Invoice saved successfully with ID:', invoiceId);
//   } catch (error) {
//     console.error('Failed to save invoice:', error);
//   }
// };


// //firebase






// const generateInvoicePDF = (booking: Booking) => {
//   const doc = new jsPDF({ unit: 'pt', format: 'a4', orientation: 'portrait' });

//   const startY = 40;

//   // Header
//   doc.setFontSize(18);
//   doc.text('Invoice', 40, startY);

//   doc.setFontSize(12);
//   doc.text(`Customer: ${booking.customerName}`, 40, startY + 30);
//   doc.text(`Email: ${booking.customerEmail || 'N/A'}`, 40, startY + 50);
//   doc.text(`Booking Date: ${format(booking.bookingDate, 'MMM dd, yyyy')}`, 40, startY + 70);
//   doc.text(`Time: ${toDisplayAMPM(booking.bookingTime)}`, 40, startY + 90);
//   doc.text(`Branch: ${booking.branch}`, 40, startY + 110);
//   doc.text(`Staff: ${booking.staff || '—'}`, 40, startY + 130);
//   doc.text(`Payment Method: ${booking.paymentMethod}`, 40, startY + 150);
//   if (booking.remarks) doc.text(`Remarks: ${booking.remarks}`, 40, startY + 170);

//   // Prepare services table
//   const serviceTableData = booking.services.map((s, idx) => [
//     idx + 1,
//     s.serviceName,
//     s.quantity,
//     `$${Number(s.price).toFixed(2)}`,
//     `$${(Number(s.price) * Number(s.quantity)).toFixed(2)}`,
//   ]);

//   // Use autoTable correctly
//   autoTable(doc, {
//     head: [['#', 'Service', 'Qty', 'Unit Price', 'Total']],
//     body: serviceTableData,
//     startY: startY + 200,
//     theme: 'grid',
//     styles: { fontSize: 10 },
//     headStyles: { fillColor: [230, 230, 230], textColor: 20 },
//     margin: { left: 40, right: 40 },
//   });

//   // Get the final Y position after the table
//   const finalY = (doc as any).lastAutoTable?.finalY || startY + 200;

//   doc.setFontSize(12);
//   doc.text(`Total Duration: ${booking.totalDuration} min`, 40, finalY + 25);
//   doc.text(`Total Price: $${booking.totalPrice.toFixed(2)}`, 40, finalY + 45);

//   doc.save(`Invoice_${booking.customerName.replace(/\s+/g, '_')}.pdf`);
//   saveInvoiceToFirestore(booking);

// };



// // new code
//   // Schedule board controls
//   const [scheduleDate, setScheduleDate] = useState<string>(() =>
//     format(new Date(), 'yyyy-MM-dd')
//   );
//   const [scheduleBranch, setScheduleBranch] = useState<string>('all');

//   // Dynamic staff fetched from Firestore
//   const [staffFromDB, setStaffFromDB] = useState<string[]>([]);

//   // Hour enabled/disabled state (keyed by hour string, e.g. "10", "11", "12")
//   const uniqueHours = Array.from(new Set(TIMESLOTS.map((t) => t.split(':')[0]))).sort(
//     (a, b) => Number(a) - Number(b)
//   );
//   const [enabledHours, setEnabledHours] = useState<Record<string, boolean>>(() => {
//     const map: Record<string, boolean> = {};
//     uniqueHours.forEach((h) => (map[h] = true));
//     return map;
//   });

//   /* -------------------- Load Staff from Firebase -------------------- */
//   useEffect(() => {
//     // Will use `staff` collection: each doc should have { name: string, active?: boolean }
//     const loadStaff = async () => {
//       try {
//         const snap = await getDocs(collection(db, 'staff'));
//         const list: string[] = [];
//         snap.forEach((d) => {
//           const data = d.data() as any;
//           if (data?.name) list.push(String(data.name));
//         });
//         // If no staff docs found, we fallback to your previous constants
//         setStaffFromDB(list.length ? list : STAFF_FALLBACK);
//       } catch {
//         // Safe fallback
//         setStaffFromDB(STAFF_FALLBACK);
//       }
//     };
//     loadStaff();
//   }, []);

//   const STAFF_OPTIONS = staffFromDB; // used everywhere below

//   /* -------------------- Load bookings (Realtime) -------------------- */
//   useEffect(() => {
//     const bookingsQuery = query(collection(db, 'bookings'), orderBy('createdAt', 'desc'));

//     const unsubscribe = onSnapshot(bookingsQuery, (snapshot) => {
//       const bookingsData = snapshot.docs.map((d) => {
//         const data = d.data() as any;
//         return {
//           id: d.id,
//           userId: data.userId || '',
//           customerName: data.customerName || '',
//           customerEmail: data.customerEmail || '', // ✅ added
//           services: (data.services || []) as BookingService[],
//           bookingDate: data.bookingDate?.toDate() || new Date(),
//           bookingTime: data.bookingTime || '',
//           branch: data.branch || '',
//          // staff: data.staff ?? null,
//          //staff: data.staff || '—', // fallback to '—' if empty
//          //staff: typeof data.staff === 'string' && data.staff.trim() ? data.staff : 'no',
//         // staff:data.staff ||"_",
       
//        staff: (data.staffName || data.staff || '—'), // ✅ fixed

//           totalPrice: data.totalPrice || 0,
//           totalDuration: data.totalDuration || 0,
//           status: (data.status as BookingStatus) || 'upcoming',
//           paymentMethod: data.paymentMethod || 'cash',
//           emailConfirmation: data.emailConfirmation || false,
//           smsConfirmation: data.smsConfirmation || false,
//           createdAt: data.createdAt?.toDate() || new Date(),
//           updatedAt: data.updatedAt?.toDate() || new Date(),
//           remarks: data.remarks ?? null,
//         } as Booking;
//       });
//       setBookings(bookingsData);
//       setLoading(false);
//     });

//     return () => unsubscribe();
//   }, []);

//   /* ------------------------- Load user details ------------------------- */
//   useEffect(() => {
//     const loadUsers = async () => {
//       const usersQuery = query(collection(db, 'users'));
//       const usersSnapshot = await getDocs(usersQuery);
//       const usersData: { [key: string]: User } = {};

//       usersSnapshot.docs.forEach((doc) => {
//         const data = doc.data() as any;
//         usersData[doc.id] = {
//           id: doc.id,
//           name: data.name || data.displayName || 'Unknown User',
//           email: data.email || '',
//           phone: data.phone || data.phoneNumber || '',
//         };
//       });

//       setUsers(usersData);
//     };

//     loadUsers();
//   }, []);

//   /* --------------------------- Filtering logic -------------------------- */
//   const filteredBookings = bookings.filter((booking) => {
//     const q = searchTerm.toLowerCase();
//     const matchesSearch =
//       booking.customerName.toLowerCase().includes(q) ||
//       booking.branch.toLowerCase().includes(q) ||
//       booking.services.some((s) => s.serviceName.toLowerCase().includes(q));

//     const matchesStatus = statusFilter === 'all' || booking.status === (statusFilter as BookingStatus);

//     return matchesSearch && matchesStatus;
//   });

//   /* --------------------------- Update helpers --------------------------- */
//   const updateBookingStatus = async (bookingId: string, newStatus: BookingStatus) => {
//     try {
//       const bookingRef = doc(db, 'bookings', bookingId);
//       await updateDoc(bookingRef, {
//         status: newStatus,
//         updatedAt: serverTimestamp(),
//       });
//     } catch (error) {
//       console.error('Error updating booking status:', error);
//       alert('Failed to update status.');
//     }
//   };

//   const getStatusBadge = (s: string) => {
//     switch (s) {
//       case 'upcoming':
//         return 'bg-blue-100 text-blue-800';
//       case 'past':
//         return 'bg-green-100 text-green-800';
//       case 'cancelled':
//         return 'bg-red-100 text-red-800';
//       default:
//         return 'bg-gray-100 text-gray-800';
//     }
//   };

//   const getStatusBlock = (s: BookingStatus) => {
//     switch (s) {
//       case 'upcoming':
//         return 'bg-emerald-50 border-emerald-300 text-emerald-800';
//       case 'past':
//         return 'bg-gray-50 border-gray-300 text-gray-700';
//       case 'cancelled':
//         return 'bg-rose-50 border-rose-300 text-rose-800 line-through';
//       default:
//         return 'bg-slate-50 border-slate-300 text-slate-800';
//     }
//   };

//   const getPaymentIcon = (method: string) => {
//     switch (method.toLowerCase()) {
//       case 'card':
//       case 'credit':
//       case 'debit':
//         return <CreditCard className="w-4 h-4" />;
//       default:
//         return <CreditCard className="w-4 h-4" />;
//     }
//   };

//   /* -------------------------- Create/Edit Handlers ------------------------- */

//   const resetForm = () => {
//     setBranch(BRANCH_OPTIONS[0]);
//     setCustomerEmail(''); // ✅ reset email
//     setServiceDate(format(new Date(), 'yyyy-MM-dd'));
//     setServiceTime('10:00');
//     setCustomerName('');
//     setPaymentMethod('cash');
//     setEmailConfirmation(false);
//     setSmsConfirmation(false);
//     setStatus('upcoming');
//     setStaff('');
//     setServices([{ ...emptyService }]);
//     setRemarks('');
//     setEditingId(null);
//   };

//   const openForCreate = () => {
//     resetForm();
//     setShowCreate(true);
//   };

//   // Open modal to CREATE, but prefill staff+time from a grid cell
//   const openForCreateFromCell = (prefillStaff: string, prefillTime: string) => {
//     // If hour disabled, do nothing
//     const hour = prefillTime.split(':')[0];
//     if (!enabledHours[hour]) return;

//     resetForm();
//     setStaff(prefillStaff);
//     setServiceTime(prefillTime);
//     // Set serviceDate to scheduleDate (board date)
//     setServiceDate(scheduleDate);
//     setShowCreate(true);
     
//   };

//   const openForEdit = (b: Booking) => {
//     setEditingId(b.id);
//     setBranch(b.branch || BRANCH_OPTIONS[0]);
//     setServiceDate(format(b.bookingDate, 'yyyy-MM-dd'));
//     setServiceTime(b.bookingTime || '10:00');
//     setCustomerName(b.customerName || '');
//     setCustomerEmail((b as any).customerEmail || ''); // ✅ load email
//     setPaymentMethod(b.paymentMethod || 'cash');
//     setEmailConfirmation(!!b.emailConfirmation);
//     setSmsConfirmation(!!b.smsConfirmation);
//     setStatus(b.status || 'upcoming');
//     setStaff(b.staff || '');
//     setServices(
//       b.services && b.services.length > 0
//         ? b.services.map((s) => ({
//             serviceId: s.serviceId || '',
//             serviceName: s.serviceName || '',
//             category: s.category || '',
//             duration: Number(s.duration) || 0,
//             price: Number(s.price) || 0,
//             quantity: Number(s.quantity) || 1,
//           }))
//         : [{ ...emptyService }]
//     );
//     setRemarks(b.remarks || '');
//     setShowCreate(true);
//   };

//   const handleAddServiceRow = () => {
//     setServices((prev) => [...prev, { ...emptyService }]);
//   };

//   const handleRemoveServiceRow = (index: number) => {
//     setServices((prev) => prev.filter((_, i) => i !== index));
//   };

//   const handleServiceChange = (
//     index: number,
//     field: keyof BookingService,
//     value: string | number
//   ) => {
//     setServices((prev) =>
//       prev.map((s, i) => (i === index ? { ...s, [field]: value } : s))
//     );
//   };

//   const formTotals = calcTotals(services);

//   const validateForm = () => {
//     if (!customerName.trim()) return 'Customer name is required';
//     if (!serviceDate) return 'Service date is required';
//     if (!serviceTime) return 'Service time is required';
//     if (!branch) return 'Branch is required';
//     if (!staff) return 'Staff is required';
//     if (services.length === 0) return 'Add at least one service';
//     const hasName = services.every((s) => s.serviceName.trim().length > 0);
//     if (!hasName) return 'Each service must have a name';
//     // also ensure selected time hour is enabled
//     const selectedHour = serviceTime.split(':')[0];
//     if (!enabledHours[selectedHour]) return 'Selected time falls into a disabled hour';
//     return null;
//   };







// const saveBooking = async () => {
//   const err = validateForm();
//   if (err) {
//     alert(err);
//     return;
//   }

//   try {
//     setSaving(true);

//     // Assign userId: existing booking keeps its id, new booking (or empty userId) gets uuid
//     const assignedUserId =
//       editingId
//         ? bookings.find((b) => b.id === editingId)?.userId || uuidv4()
//         : uuidv4();

//     const payload = {
//       userId: assignedUserId, // ✅ now always filled, even for upcoming
//       customerName: customerName.trim(),
     
//        customerEmail: customerEmail?.trim() || '', // ✅ add this
//       services: services.map((s) => ({
//         ...s,
//         price: Number(s.price) || 0,
//         duration: Number(s.duration) || 0,
//         quantity: Number(s.quantity) || 0,
//       })),
//       bookingDate: Timestamp.fromDate(new Date(serviceDate + 'T00:00:00')),
//       bookingTime: serviceTime,
//       branch,
//       staff: staff || null,
//     //staff: typeof data.staff === 'string' && data.staff.trim() ? data.staff : '—',

//       totalPrice: formTotals.totalPrice,
//       totalDuration: formTotals.totalDuration,
//       status, // upcoming / past / cancelled
//       paymentMethod,
//       emailConfirmation,
//       smsConfirmation,
//       updatedAt: serverTimestamp(),
//       remarks: remarks || null,
//     };

//     if (editingId) {
//       const ref = doc(db, 'bookings', editingId);
//       await updateDoc(ref, payload);
//     } else {
//       await addDoc(collection(db, 'bookings'), {
//         ...payload,
//         createdAt: serverTimestamp(),
//       });
//     }

//     setShowCreate(false);
//     resetForm();
//   } catch (e) {
//     console.error('Error saving booking:', e);
//     alert('Failed to save booking. Check console for details.');
//   } finally {
//     setSaving(false);
//   }
// };

  

//   const deleteBooking = async () => {
//     if (!editingId) return;
//     if (!confirm('Delete this booking? This action cannot be undone.')) return;

//     try {
//       setDeleting(true);
//       await deleteDoc(doc(db, 'bookings', editingId));
//       setShowCreate(false);
//       resetForm();
//     } catch (e) {
//       console.error('Error deleting booking:', e);
//       alert('Failed to delete booking.');
//     } finally {
//       setDeleting(false);
//     }
//   };

//   /* ------------------------------ Schedule Board Data ------------------------------ */

//   const bookingsForSchedule = useMemo(() => {
//     const target = new Date(scheduleDate + 'T00:00:00');
//     return bookings.filter((b) => {
//       const sameDay = isSameDay(b.bookingDate, target);
//       const branchOk = scheduleBranch === 'all' || b.branch === scheduleBranch;
//       return sameDay && branchOk;
//     });
//   }, [bookings, scheduleDate, scheduleBranch]);

//   // fast lookup: { 'HH:mm': { staffName: Booking[] } } but we need single cell show (first booking)
//   const scheduleMatrix = useMemo(() => {
//     const map: Record<string, Record<string, Booking[]>> = {};
//     TIMESLOTS.forEach((t) => {
//       map[t] = {};
//       STAFF_OPTIONS.forEach((s) => (map[t][s] = []));
//     });
//     bookingsForSchedule.forEach((b) => {
//       const t = b.bookingTime;
//       const s = b.staff || '';
//       if (t && s && map[t] && map[t][s] !== undefined) {
//         map[t][s].push(b);
//       }
//     });
//     return map;
//   }, [bookingsForSchedule, STAFF_OPTIONS]);

//   /* ------------------------------- Render ------------------------------ */

//   if (loading) {
//     return (
//       <div className="p-6">
//         <div className="max-w-7xl mx-auto">
//           <div className="flex items-center justify-center py-12">
//             <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600"></div>
//             <span className="ml-3 text-pink-600">Loading bookings...</span>
//           </div>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div>
  
     
//         {/* Header */}
//         <div className="mb-8 flex items-start sm:items-center justify-around gap-4 ">
//           <div>
//             <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
//               Customers
//             </h1>
//             <p className="text-gray-600 dark:text-white">
//               All Customers Data
//             </p>
//           </div>

          
//         </div>

//         {/* Schedule Board Controls */}
//         <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6 w-[1100px]">
//           <div className="grid grid-cols-1 md:grid-cols-4 gap-6 ">
//             <div className="flex items-center">
//               <Calendar className="w-5 h-5 text-gray-500 mr-2" />
//               <input
//                 type="date"
//                 value={scheduleDate}
//                 onChange={(e) => setScheduleDate(e.target.value)}
//                 className="w-full border rounded-md px-3 py-2"
//               />
//             </div>
//             <div className="flex items-center">
//               <MapPin className="w-5 h-5 text-gray-500 mr-2" />
//               <select
//                 value={scheduleBranch}
//                 onChange={(e) => setScheduleBranch(e.target.value)}
//                 className="w-full border rounded-md px-3 py-2"
//               >
//                 <option value="all">All Branches</option>
//                 {BRANCH_OPTIONS.map((b) => (
//                   <option key={b} value={b}>
//                     {b}
//                   </option>
//                 ))}
//               </select>
//             </div>

//             {/* Hour toggles: minimal UI addition, consistent with existing controls */}
//             <div className="md:col-span-2">
              
//             </div>
//           </div>
//         </div>

//  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6 w-[1100px]">
//           <div className="flex flex-col md:flex-row gap-4">
//             <div className="flex-1">
//               <div className="relative">
//                 <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
//                 <input
//                   type="text"
//                   placeholder="Search by customer name, branch, or service..."
//                   value={searchTerm}
//                   onChange={(e) => setSearchTerm(e.target.value)}
//                   className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
//                 />
//               </div>
//             </div>

//             <div className="md:w-48">
//               <select
//                 value={statusFilter}
//                 onChange={(e) => setStatusFilter(e.target.value)}
//                 className="w-full bg-black text-white px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
//               >
//                 <option value="all">All Status</option>
//                 <option value="upcoming">Upcoming</option>
//                 <option value="past">Past</option>
//                 <option value="cancelled">Cancelled</option>
//               </select>
//             </div>
//           </div>
//         </div>

      
          
    

//         {/* ======================== SCHEDULE BOARD (NEW ORIENTATION) ======================== */}
//         <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-x-auto mb-10 w-0">
//           {/* Grid: first column is time (sticky left), first row is header with staff (sticky top) */}
//           <div
//             className="min-w-[900px] relative"
//             style={{}}
//           >
            

//             {/* Body: rows for each timeslot */}
            
//                   <div className="">
//               {TIMESLOTS.map((t) => {
//                 const hour = t.split(':')[0];
//                 const hourEnabled = !!enabledHours[hour];

//                 return (
//                     <div
//                   key={t}
//                   className="grid"
//                   style={{ gridTemplateColumns: `180px repeat(${STAFF_OPTIONS.length}, 200px)` }}
//                 >

                         
                    
                  
//                 </div>
//               )}
//                 )}
//             </div>
//           </div>
//         </div>

//         {/* Filters and Search (List view) */}

//         {/* Bookings Table (click row to edit) */}
//         <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden w-[1150px]">
//           <div className="overflow-x-auto">
//             <table className="min-w-full divide-y divide-gray-200">
//               <thead className="bg-gray-50">
//                 <tr>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                     Customer
//                   </th>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                     Services
//                   </th>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                     Date & Time
//                   </th>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                     Staff
//                   </th>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                     Branch
//                   </th>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                     Payment
//                   </th>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                     Status
//                   </th>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                     Actions
//                   </th>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//   Invoice
// </th>

//                 </tr>
//               </thead>
//               <tbody className="bg-white divide-y divide-gray-200">
//                 {filteredBookings.map((booking) => {
//                   const user = users[booking.userId];
//                   return (
//                     <tr
//                       key={booking.id}
//                       className="hover:bg-gray-50 cursor-pointer"
//                       onClick={() => openForEdit(booking)}
//                     >
//                       <td className="px-6 py-4 whitespace-nowrap">
//                         <div className="flex items-center">
//                           <div className="flex-shrink-0 h-10 w-10">
//                             <div className="h-10 w-10 rounded-full bg-pink-100 flex items-center justify-center">
//                               <User className="h-5 w-5 text-pink-600" />
//                             </div>
//                           </div>
//                           <div className="ml-4">
//                             <div className="text-sm font-medium text-gray-900">
//                               {booking.customerName}
//                             </div>
//                              <div className="text-sm text-gray-500">
//                               <div className="text-sm text-gray-500">{booking.customerEmail || 'No email'}</div>
//                             </div> 
//                           </div>
//                         </div>
//                       </td>
//                       <td className="px-6 py-4">
//                         <div className="text-sm text-gray-900">
//                           {booking.services.slice(0, 2).map((service, index) => (
//                             <div key={index} className="mb-1">
//                               {service.serviceName}{' '}
//                               {service.quantity > 1 && `(x${service.quantity})`}
//                             </div>
//                           ))}
//                           {booking.services.length > 2 && (
//                             <div className="text-xs text-gray-500">
//                               +{booking.services.length - 2} more
//                             </div>
//                           )}
//                         </div>
//                       </td>
//                       <td className="px-6 py-4 whitespace-nowrap">
//                         <div className="flex items-center text-sm text-gray-900">
//                           <Calendar className="w-4 h-4 mr-2 text-gray-400" />
//                           <div>
//                             <div>{format(booking.bookingDate, 'MMM dd, yyyy')}</div>
//                             <div className="text-xs text-gray-500 flex items-center mt-1">
//                               <Clock className="w-3 h-3 mr-1" />
//                               {toDisplayAMPM(booking.bookingTime)}
//                             </div>
//                           </div>
//                         </div>
//                       </td>
//                       <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
//                         {booking.staff || '—'}
//                       </td>
//                       <td className="px-6 py-4 whitespace-nowrap">
//                         <div className="flex items-center text-sm text-gray-900">
//                           <MapPin className="w-4 h-4 mr-2 text-gray-400" />
//                           {booking.branch}
//                         </div>
//                       </td>
//                       <td className="px-6 py-4 whitespace-nowrap">
//                         <div className="text-sm text-gray-900">
//                           <div className="flex items-center">
//                             {getPaymentIcon(booking.paymentMethod)}
//                             <span className="ml-2">${booking.totalPrice.toFixed(2)}</span>
//                           </div>
//                           <div className="text-xs text-gray-500 capitalize">
//                             {booking.paymentMethod}
//                           </div>
//                         </div>
//                       </td>
//                       <td className="px-6 py-4 whitespace-nowrap">
//                         <span
//                           className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full capitalize ${getStatusBadge(
//                             booking.status
//                           )}`}
//                         >
//                           {booking.status}
//                         </span>
//                       </td>









//                       <td
//                         className="px-6 py-4 whitespace-nowrap text-sm font-medium"
//                         onClick={(e) => e.stopPropagation()}
//                       >
//                         <div className="flex space-x-2">
//                           <button
//                             onClick={() => openForEdit(booking)}
//                             className="text-emerald-700 hover:text-emerald-900"
//                             title="Edit booking"
//                           >
//                             <Edit3 className="w-4 h-4" />
//                           </button>
//                           {booking.status === 'upcoming' && (
//                             <>
//                               <button
//                                 onClick={() => updateBookingStatus(booking.id, 'past')}
//                                 className="text-green-600 hover:text-green-900"
//                                 title="Mark as completed"
//                               >
//                                 <CheckCircle className="w-4 h-4" />
//                               </button>
//                               <button
//                                 onClick={() => updateBookingStatus(booking.id, 'cancelled')}
//                                 className="text-red-600 hover:text-red-900"
//                                 title="Cancel booking"
//                               >
//                                 <XCircle className="w-4 h-4" />
//                               </button>
//                             </>
//                           )}
//                         </div>
//                       </td>


// <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
//   <button
//     onClick={(e) => { e.stopPropagation(); generateInvoicePDF(booking); }}
//     className="px-2 py-1 text-white bg-pink-600 rounded hover:bg-pink-700"
//     title="Download Invoice"
//   >
//     Invoice
//   </button>
// </td>







//                     </tr>
//                   );
//                 })}
//               </tbody>
//             </table>
//           </div>

//           {filteredBookings.length === 0 && (
//             <div className="text-center py-12">
//               <Calendar className="mx-auto h-12 w-12 text-gray-400" />
//               <h3 className="mt-2 text-sm font-medium text-gray-900">No bookings found</h3>
//               <p className="mt-1 text-sm text-gray-500">
//                 {searchTerm || statusFilter !== 'all'
//                   ? 'Try adjusting your search or filter criteria.'
//                   : 'No bookings have been made yet.'}
//               </p>
//             </div>
//           )}
//         </div>

//         {/* ===================== CREATE / EDIT MODAL (PURE TAILWIND) ===================== */}
//         {showCreate && (
//           <div className="fixed inset-0 bg-gray-600 bg-opacity-50 z-50 overflow-y-auto h-full w-full">
//             <div className="relative top-10 mx-auto w-11/12 md:w-4/5 lg:w-3/4 xl:w-2/3">
//               <div className="bg-white rounded-lg shadow-xl border">
//                 {/* Header */}
//                 <div className="flex items-center justify-between px-6 py-4 border-b">
//                   <h3 className="text-lg font-semibold">
//                     {editingId ? 'Edit Schedule' : 'Add Schedule'}
//                   </h3>
//                   <div className="flex items-center gap-2">
//                     {editingId && (
//                       <button
//                         onClick={deleteBooking}
//                         disabled={deleting}
//                         className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-white bg-red-600 hover:bg-red-700 disabled:opacity-60"
//                         title="Delete booking"
//                       >
//                         <Trash2 className="w-4 h-4" />
//                         Delete
//                       </button>
//                     )}
//                     <button
//                       onClick={() => {
//                         setShowCreate(false);
//                         resetForm();
//                       }}
//                       className="text-gray-400 hover:text-gray-600"
//                       title="Close"
//                     >
//                       <XCircle className="w-6 h-6" />
//                     </button>
//                   </div>
//                 </div>

//                 {/* Body */}
//                 <div className="p-6 space-y-6">
//                   {/* Top selects */}
//                   <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
//                     <div>
//                       <label className="block text-sm font-medium text-gray-700">Branch</label>
//                       <select
//                         className="mt-1 w-full border rounded-md px-3 py-2"
//                         value={branch}
//                         onChange={(e) => setBranch(e.target.value)}
//                       >
//                         {BRANCH_OPTIONS.map((b) => (
//                           <option key={b} value={b}>
//                             {b}
//                           </option>
//                         ))}
//                       </select>
//                     </div>

//                     <div>
//                       <label className="block text-sm font-medium text-gray-700">Category</label>
//                       <select
//                         className="mt-1 w-full border rounded-md px-3 py-2"
//                         onChange={(e) => {
//                           setServices((prev) =>
//                             prev.map((s, i) => (i === 0 ? { ...s, category: e.target.value } : s))
//                           );
//                         }}
//                       >
//                         <option value="">Select One</option>
//                         {CATEGORY_OPTIONS.map((c) => (
//                           <option key={c} value={c}>
//                             {c}
//                           </option>
//                         ))}
//                       </select>
//                     </div>

//                     <div>
//                       <label className="block text-sm font-medium text-gray-700">Staff</label>
//                       <select
//                         className="mt-1 w-full border rounded-md px-3 py-2"
//                         value={staff}
//                         onChange={(e) => setStaff(e.target.value)}
//                       >
//                         <option value="">Select One</option>
//                         {STAFF_OPTIONS.map((s) => (
//                           <option key={s} value={s}>
//                             {s}
//                           </option>
//                         ))}
//                       </select>
//                     </div>

//                     <div>
//                       <label className="block text-sm font-medium text-gray-700">
//                         Payment Method
//                       </label>
//                       <select
//                         className="mt-1 w-full border rounded-md px-3 py-2"
//                         value={paymentMethod}
//                         onChange={(e) => setPaymentMethod(e.target.value)}
//                       >
//                         {PAYMENT_METHODS.map((p) => (
//                           <option key={p} value={p}>
//                             {p.toUpperCase()}
//                           </option>
//                         ))}
//                       </select>
//                     </div>
//                   </div>


//                   {/* Date & Time */}
//                   <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//                     <div>
//                       <label className="block text-sm font-medium text-gray-700">
//                         Service Date
//                       </label>
//                       <input
//                         type="date"
//                         className="mt-1 w-full border rounded-md px-3 py-2"
//                         value={serviceDate}
//                         onChange={(e) => setServiceDate(e.target.value)}
//                       />
//                     </div>
//                     <div>
//                       <label className="block text-sm font-medium text-gray-700">Time Slot</label>
//                       <select
//                         className="mt-1 w-full border rounded-md px-3 py-2"
//                         value={serviceTime}
//                         onChange={(e) => setServiceTime(e.target.value)}
//                       >
//                         {TIMESLOTS.filter(slot => {
//                           // only show slots whose hour is enabled
//                           const hour = slot.split(':')[0];
//                           return !!enabledHours[hour];
//                         }).map((slot) => (
//                           <option key={slot} value={slot}>
//                             {toDisplayAMPM(slot)}
//                           </option>
//                         ))}
//                       </select>
//                     </div>
//                     <div>
//                       <label className="block text-sm font-medium text-gray-700">Customer</label>
//                       <input
//                         type="text"
//                         placeholder="Customer name"
//                         className="mt-1 w-full border rounded-md px-3 py-2"
//                         value={customerName}
//                         onChange={(e) => setCustomerName(e.target.value)}
//                       />
//                     </div>
//                     {/*  */}
                    

                    
                  
//                   </div>

//                   {/* Services table */}
//                   <div className="border rounded-lg">
//                     <div className="grid grid-cols-12 gap-2 px-4 py-3 bg-gray-50 text-xs font-semibold">
//                       <div className="col-span-4">Service</div>
//                       <div className="col-span-2">Category</div>
//                       <div className="col-span-2">Duration (min)</div>
//                       <div className="col-span-2">Price</div>
//                       <div className="col-span-1">Qty</div>
//                       <div className="col-span-1 text-right">—</div>
//                     </div>

//                     {services.map((s, idx) => (
//                       <div key={idx} className="grid grid-cols-12 gap-2 px-4 py-3 border-t">
//                         <div className="col-span-4">
//                           <input
//                             className="w-full border rounded-md px-3 py-2"
//                             placeholder="Service name"
//                             value={s.serviceName}
//                             onChange={(e) => handleServiceChange(idx, 'serviceName', e.target.value)}
//                           />
//                         </div>
//                         <div className="col-span-2">
//                           <select
//                             className="w-full border rounded-md px-3 py-2"
//                             value={s.category}
//                             onChange={(e) => handleServiceChange(idx, 'category', e.target.value)}
//                           >
//                             <option value="">Select</option>
//                             {CATEGORY_OPTIONS.map((c) => (
//                               <option key={c} value={c}>
//                                 {c}
//                               </option>
//                             ))}
//                           </select>
//                         </div>
//                         <div className="col-span-2">
//                           <input
//                             type="number"
//                             min={0}
//                             className="w-full border rounded-md px-3 py-2"
//                             value={s.duration}
//                             onChange={(e) =>
//                               handleServiceChange(idx, 'duration', Number(e.target.value || 0))
//                             }
//                           />
//                         </div>
//                         <div className="col-span-2">
//                           <input
//                             type="number"
//                             min={0}
//                             step="0.01"
//                             className="w-full border rounded-md px-3 py-2"
//                             value={s.price}
//                             onChange={(e) =>
//                               handleServiceChange(idx, 'price', Number(e.target.value || 0))
//                             }
//                           />
//                         </div>
//                         <div className="col-span-1">
//                           <input
//                             type="number"
//                             min={1}
//                             className="w-full border rounded-md px-3 py-2"
//                             value={s.quantity}
//                             onChange={(e) =>
//                               handleServiceChange(idx, 'quantity', Number(e.target.value || 1))
//                             }
//                           />
//                         </div>
//                         <div className="col-span-1 flex justify-end items-center">
//                           {services.length > 1 && (
//                             <button
//                               onClick={() => handleRemoveServiceRow(idx)}
//                               className="p-2 rounded hover:bg-red-50 text-red-600"
//                               title="Remove"
//                             >
//                               <Trash2 className="w-4 h-4" />
//                             </button>
//                           )}
//                         </div>
//                       </div>
//                     ))}

//                     <div className="px-4 py-3 border-t flex justify-between items-center">
//                       <button
//                         onClick={handleAddServiceRow}
//                         className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
//                       >
//                         <Plus className="w-4 h-4" />
//                         Add more service
//                       </button>

//                       <div className="text-sm text-gray-700">
//                         <span className="mr-4">
//                           <strong>Total Duration:</strong> {formTotals.totalDuration} min
//                         </span>
//                         <span>
//                           <strong>Total Price:</strong> ${formTotals.totalPrice.toFixed(2)}
//                         </span>
//                       </div>
//                     </div>
//                   </div>

//                   {/* Remarks & toggles */}
//                   <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//                     <div className="md:col-span-2">
//                       <label className="block text-sm font-medium text-gray-700">
//                         Remarks (optional)
//                       </label>
//                       <textarea
//                         className="mt-1 w-full border rounded-md px-3 py-2 min-h-[80px]"
//                         value={remarks}
//                         onChange={(e) => setRemarks(e.target.value)}
//                       />
//                     </div>
//                     <div className="space-y-4">
//                       <div className="flex items-center justify-between border rounded-md px-3 py-2">
//                         <span className="text-sm">Send booking notification by email</span>
//                         <input
//                           type="checkbox"
//                           checked={emailConfirmation}
//                           onChange={(e) => setEmailConfirmation(e.target.checked)}
//                         />
//                       </div>
//                       <div className="flex items-center justify-between border rounded-md px-3 py-2">
//                         <span className="text-sm">Send booking notification by SMS</span>
//                         <input
//                           type="checkbox"
//                           checked={smsConfirmation}
//                           onChange={(e) => setSmsConfirmation(e.target.checked)}
//                         />
//                       </div>
//                       <div>
//                         <label className="block text-sm font-medium text-gray-700">
//                           Application Status
//                         </label>
//                         <select
//                           className="mt-1 w-full border rounded-md px-3 py-2"
//                           value={status}
//                           onChange={(e) => setStatus(e.target.value as BookingStatus)}
//                         >
//                           <option value="upcoming">Approved (Upcoming)</option>
//                           <option value="past">Completed (Past)</option>
//                           <option value="cancelled">Cancelled</option>
//                         </select>
//                       </div>
//                     </div>
//                   </div>
//                 </div>

//                 {/* Footer */}
//                 <div className="px-6 py-4 border-t flex justify-end gap-3">
//                   <button
//                     onClick={() => {
//                       setShowCreate(false);
//                       resetForm();
//                     }}
//                     className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
//                     disabled={saving || deleting}
//                   >
//                     Close
//                   </button>
//                   <button
//                     onClick={saveBooking}
//                     className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-md hover:bg-emerald-700 disabled:opacity-60"
//                     disabled={saving || deleting}
//                   >
//                     {saving ? (editingId ? 'Updating...' : 'Saving...') : editingId ? 'Update' : 'Save'}
//                   </button>
//                 </div>
//               </div>
//             </div>
//           </div>
//         )}
//         {/* =================== END CREATE / EDIT MODAL =================== */}
//       </div>

   
//   );
// }



       
// new code corrected
// 'use client';

// import { useState, useEffect, useMemo } from 'react';
// import jsPDF from 'jspdf';
// import autoTable from 'jspdf-autotable';
// import { v4 as uuidv4 } from 'uuid';
// import {
//   collection,
//   query,
//   orderBy,
//   onSnapshot,
//   doc,
//   updateDoc,
//   Timestamp,
//   getDocs,
//   addDoc,
//   serverTimestamp,
//   deleteDoc,
//   setDoc,
// } from 'firebase/firestore';
// import { db } from '@/lib/firebase';

// import {
//   Calendar,
//   Clock,
//   MapPin,
//   User,
//   CreditCard,
//   Search,
//   CheckCircle,
//   XCircle,
//   Plus,
//   Trash2,
//   Edit3,
//   CircleArrowOutDownRight,
// } from 'lucide-react';
// import { format, isSameDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subDays } from 'date-fns';

// /* ----------------------------- Types ----------------------------- */

// interface BookingService {
//   serviceId?: string;
//   serviceName: string;
//   category: string;
//   duration: number; // minutes
//   price: number; // per unit
//   quantity: number;
// }

// type BookingStatus = 'upcoming' | 'past' | 'cancelled';

// interface Booking {
//   id: string;
//   userId: string;
//   customerName: string;
//   customerEmail?: string;
//   services: BookingService[];
//   bookingDate: Date;
//   bookingTime: string; // "HH:mm"
//   branch: string;
//   staff: string | null; // name string
//   totalPrice: number;
//   totalDuration: number;
//   status: BookingStatus;
//   paymentMethod: string;
//   // finance-related optional fields
//   grossSales?: number;
//   discount?: number;
//   refunds?: number;
//   adjustments?: number;
//   tax?: number;
//   tips?: number;
//   excludedPayments?: number;
//   inHand?: number;
//   paymentDetails?: Record<string, number>;
//   emailConfirmation: boolean;
//   smsConfirmation: boolean;
//   createdAt: Date;
//   updatedAt: Date;
//   remarks?: string | null;
// }

// /* --------------------------- Constants --------------------------- */

// const BRANCH_OPTIONS = ['Al Bustan', 'Marina', 'TECOM', 'AL Muraqabat', 'IBN Batutta Mall'];
// const CATEGORY_OPTIONS = ['Facial', 'Hair', 'Nails', 'Lashes', 'Massage'];
// const PAYMENT_METHODS = ['cash', 'card', 'bank_transfer', 'cobone', 'groupon', 'pay_by_link', 'paypal', 'tabby', 'tamara', 'extra_pay_mode_1', 'extra_pay_mode_2', 'user_balance', 'redeem'];

// const STAFF_FALLBACK = ['Komal', 'Shameem', 'Do Thi Kim', 'Alishba'];

// const TIMELINE_OPTIONS = ['today', 'yesterday', 'this_week', 'this_month', 'custom'] as const;



// /* =========================== Component =========================== */

// export default function BookingsAndFinancePage() {
//   // shared state
//   const [bookings, setBookings] = useState<Booking[]>([]);
//   const [loading, setLoading] = useState(true);

//   // UI state
//   const [view, setView] = useState<'bookings' | 'finance'>('bookings');

//   // filters for schedule/bookings
//   const [searchTerm, setSearchTerm] = useState('');
//   const [statusFilter, setStatusFilter] = useState<string>('all');

//   // create/edit modal states (kept similar to original)
//   const [showCreate, setShowCreate] = useState(false);
//   const [saving, setSaving] = useState(false);
//   const [deleting, setDeleting] = useState(false);
//   const [editingId, setEditingId] = useState<string | null>(null);

//   // form state (shortened)
//   const [branch, setBranch] = useState(BRANCH_OPTIONS[0]);
//   const [serviceDate, setServiceDate] = useState(() => format(new Date(), 'yyyy-MM-dd'));
//   const [serviceTime, setServiceTime] = useState('10:00');
//   const [customerName, setCustomerName] = useState('');
//   const [paymentMethod, setPaymentMethod] = useState('cash');
//   const [emailConfirmation, setEmailConfirmation] = useState(false);
//   const [smsConfirmation, setSmsConfirmation] = useState(false);
//   const [customerEmail, setCustomerEmail] = useState('');
//   const [status, setStatus] = useState<BookingStatus>('upcoming');

//   const [staffFromDB, setStaffFromDB] = useState<string[]>([]);
//   const STAFF_OPTIONS = staffFromDB.length ? staffFromDB : STAFF_FALLBACK;

//   // finance filters
//   const [timeline, setTimeline] = useState<typeof TIMELINE_OPTIONS[number]>('this_month');
//   const [dateFrom, setDateFrom] = useState(() => format(startOfMonth(new Date()), 'yyyy-MM-dd'));
//   const [dateTo, setDateTo] = useState(() => format(endOfMonth(new Date()), 'yyyy-MM-dd'));
//   const [financeBranch, setFinanceBranch] = useState<string>('all');
//   const [financeTimelinePreset, setFinanceTimelinePreset] = useState<string>('this_month');

//   /* -------------------- Load Staff from Firebase -------------------- */
//   useEffect(() => {
//     const loadStaff = async () => {
//       try {
//         const snap = await getDocs(collection(db, 'staff'));
//         const list: string[] = [];
//         snap.forEach((d) => {
//           const data = d.data() as any;
//           if (data?.name) list.push(String(data.name));
//         });
//         setStaffFromDB(list.length ? list : STAFF_FALLBACK);
//       } catch {
//         setStaffFromDB(STAFF_FALLBACK);
//       }
//     };
//     loadStaff();
//   }, []);

//   /* -------------------- Realtime bookings listener -------------------- */
//   useEffect(() => {
//     const q = query(collection(db, 'bookings'), orderBy('createdAt', 'desc'));
//     const unsub = onSnapshot(q, (snap) => {
//       const items: Booking[] = snap.docs.map((d) => {
//         const data = d.data() as any;
//         return {
//           id: d.id,
//           userId: data.userId || '',
//           customerName: data.customerName || '',
//           customerEmail: data.customerEmail || '',
//           services: (data.services || []) as BookingService[],
//           bookingDate: data.bookingDate?.toDate() || new Date(),
//           bookingTime: data.bookingTime || '',
//           branch: data.branch || '',
//           staff: data.staffName || data.staff || '—',
//           totalPrice: Number(data.totalPrice) || 0,
//           totalDuration: Number(data.totalDuration) || 0,
//           status: (data.status as BookingStatus) || 'upcoming',
//           paymentMethod: data.paymentMethod || 'cash',
//           grossSales: Number(data.grossSales) || undefined,
//           discount: Number(data.discount) || undefined,
//           refunds: Number(data.refunds) || undefined,
//           adjustments: Number(data.adjustments) || undefined,
//           tax: Number(data.tax) || undefined,
//           tips: Number(data.tips) || undefined,
//           excludedPayments: Number(data.excludedPayments) || undefined,
//           inHand: Number(data.inHand) || undefined,
//           paymentDetails: data.paymentDetails || undefined,
//           emailConfirmation: !!data.emailConfirmation,
//           smsConfirmation: !!data.smsConfirmation,
//           createdAt: data.createdAt?.toDate() || new Date(),
//           updatedAt: data.updatedAt?.toDate() || new Date(),
//           remarks: data.remarks ?? null,
//         };
//       });
//       setBookings(items);
//       setLoading(false);
//     });

//     return () => unsub();
//   }, []);

//   /* ---------------------- Finance: date presets ---------------------- */
//   useEffect(() => {
//     const now = new Date();
//     switch (timeline) {
//       case 'today':
//         setDateFrom(format(now, 'yyyy-MM-dd'));
//         setDateTo(format(now, 'yyyy-MM-dd'));
//         break;
//       case 'yesterday':
//         const y = subDays(now, 1);
//         setDateFrom(format(y, 'yyyy-MM-dd'));
//         setDateTo(format(y, 'yyyy-MM-dd'));
//         break;
//       case 'this_week':
//         setDateFrom(format(startOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd'));
//         setDateTo(format(endOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd'));
//         break;
//       case 'this_month':
//         setDateFrom(format(startOfMonth(now), 'yyyy-MM-dd'));
//         setDateTo(format(endOfMonth(now), 'yyyy-MM-dd'));
//         break;
//       case 'custom':
//       default:
//         // keep dates as-is
//         break;
//     }
//   }, [timeline]);

//   /* -------------------- Filtered bookings for finance -------------------- */
//   const financeFiltered = useMemo(() => {
//     const from = new Date(dateFrom + 'T00:00:00');
//     const to = new Date(dateTo + 'T23:59:59');
//     return bookings.filter((b) => {
//       const d = b.bookingDate;
//       const inRange = d >= from && d <= to;
//       const branchOk = financeBranch === 'all' || b.branch === financeBranch;
//       return inRange && branchOk;
//     });
//   }, [bookings, dateFrom, dateTo, financeBranch]);

//   /* -------------------- Compute finance aggregates -------------------- */
//   const financeTotals = useMemo(() => {
//     // initialize counters
//     const totals: any = {
//       sales: 0, // net sales
//       grossSales: 0,
//       discount: 0,
//       refunds: 0,
//       adjustments: 0,
//       tax: 0,
//       totalSalesWithTax: 0, // tax + net sales
//       tips: 0,
//       collection: 0, // sales + tips
//       excludedPayments: 0,
//       inHandCollection: 0,
//       paymentMethods: {}, // map method->amount
//     };

//     // initialize payment method keys
//     PAYMENT_METHODS.forEach((m) => (totals.paymentMethods[m] = 0));

//     financeFiltered.forEach((b) => {
//       const gross = Number(b.grossSales ?? b.totalPrice) || 0;
//       const discount = Number(b.discount ?? 0) || 0;
//       const refunds = Number(b.refunds ?? 0) || 0;
//       const adjustments = Number(b.adjustments ?? 0) || 0;
//       const tax = Number(b.tax ?? 0) || 0;
//       const tips = Number(b.tips ?? 0) || 0;
//       const excluded = Number(b.excludedPayments ?? 0) || 0;

//       const netSales = gross - discount - refunds + adjustments; // simple formula

//       totals.grossSales += gross;
//       totals.discount += discount;
//       totals.refunds += refunds;
//       totals.adjustments += adjustments;
//       totals.tax += tax;
//       totals.tips += tips;
//       totals.excludedPayments += excluded;

//       totals.sales += netSales;
//       totals.totalSalesWithTax += netSales + tax;
//       totals.collection += netSales + tips;

//       // in-hand collection logic: if b.inHand provided use it, else assume collection - excluded
//       const inHand = Number(b.inHand ?? Math.max(0, netSales + tips - excluded));
//       totals.inHandCollection += inHand;

//       // payment method breakdown
//       const method = (b.paymentMethod || 'cash').toLowerCase();
//       if (!totals.paymentMethods[method]) totals.paymentMethods[method] = 0;
//       // If booking has paymentDetails (map of methods->amount), prefer that
//       if (b.paymentDetails && typeof b.paymentDetails === 'object') {
//         Object.entries(b.paymentDetails).forEach(([pm, amt]) => {
//           const key = pm.toLowerCase();
//           totals.paymentMethods[key] = (totals.paymentMethods[key] || 0) + Number(amt || 0);
//         });
//       } else {
//         totals.paymentMethods[method] = (totals.paymentMethods[method] || 0) + Number(netSales + tips || 0);
//       }
//     });

//     return totals;
//   }, [financeFiltered]);

//   /* -------------------- Export PDF for finance -------------------- */
//   const exportFinancePDF = () => {
//     const doc = new jsPDF({ unit: 'pt', format: 'a4', orientation: 'landscape' });
//     const title = 'Finance Report';
//     doc.setFontSize(16);
//     doc.text(title, 40, 40);

//     const meta = [`Branch: ${financeBranch}`, `From: ${dateFrom}`, `To: ${dateTo}`];
//     doc.setFontSize(10);
//     doc.text(meta.join('   '), 40, 60);

//     const rows = financeFiltered.map((b) => {
//       const gross = Number(b.grossSales ?? b.totalPrice) || 0;
//       const discount = Number(b.discount ?? 0) || 0;
//       const refunds = Number(b.refunds ?? 0) || 0;
//       const adjustments = Number(b.adjustments ?? 0) || 0;
//       const tax = Number(b.tax ?? 0) || 0;
//       const tips = Number(b.tips ?? 0) || 0;
//       const net = gross - discount - refunds + adjustments;
//       return [
//         b.customerName,
//         format(b.bookingDate, 'yyyy-MM-dd'),
//         b.bookingTime,
//         b.branch,
//         b.staff || '—',
//         `$${gross.toFixed(2)}`,
//         `$${discount.toFixed(2)}`,
//         `$${refunds.toFixed(2)}`,
//         `$${adjustments.toFixed(2)}`,
//         `$${net.toFixed(2)}`,
//         `$${tax.toFixed(2)}`,
//         `$${(net + tax).toFixed(2)}`,
//         `$${tips.toFixed(2)}`,
//         b.paymentMethod,
//       ];
//     });

//     autoTable(doc, {
//       head: [[
//         'Customer', 'Date', 'Time', 'Branch', 'Staff', 'Gross', 'Discount', 'Refunds', 'Adjustments', 'Net Sales', 'Tax', 'Total Sales', 'Tips', 'Payment Method'
//       ]],
//       body: rows,
//       startY: 80,
//       styles: { fontSize: 9 },
//       margin: { left: 20, right: 20 },
//     });

//     doc.save(`Finance_Report_${dateFrom}_to_${dateTo}.pdf`);
//   };

//   /* -------------------- Bookings table filtering -------------------- */
//   const filteredBookings = useMemo(() => {
//     const q = searchTerm.toLowerCase();
//     return bookings.filter((booking) => {
//       const matchesSearch =
//         booking.customerName.toLowerCase().includes(q) ||
//         booking.branch.toLowerCase().includes(q) ||
//         booking.services.some((s) => s.serviceName.toLowerCase().includes(q));
//       const matchesStatus = statusFilter === 'all' || booking.status === (statusFilter as BookingStatus);
//       return matchesSearch && matchesStatus;
//     });
//   }, [bookings, searchTerm, statusFilter]);

//   /* -------------------- Simple booking CRUD helpers (kept minimal) -------------------- */
//   const resetForm = () => {
//     setBranch(BRANCH_OPTIONS[0]);
//     setCustomerEmail('');
//     setServiceDate(format(new Date(), 'yyyy-MM-dd'));
//     setServiceTime('10:00');
//     setCustomerName('');
//     setPaymentMethod('cash');
//     setEmailConfirmation(false);
//     setSmsConfirmation(false);
//     setStatus('upcoming');
//     setStaff('');
//     setEditingId(null);
//   };

//   const openForEdit = (b: Booking) => {
//     setEditingId(b.id);
//     setBranch(b.branch || BRANCH_OPTIONS[0]);
//     setServiceDate(format(b.bookingDate, 'yyyy-MM-dd'));
//     setServiceTime(b.bookingTime || '10:00');
//     setCustomerName(b.customerName || '');
//     setCustomerEmail(b.customerEmail || '');
//     setPaymentMethod(b.paymentMethod || 'cash');
//     setEmailConfirmation(!!b.emailConfirmation);
//     setSmsConfirmation(!!b.smsConfirmation);
//     setStatus(b.status || 'upcoming');
//     setStaff(b.staff || '');
//     setShowCreate(true);
//   };

//   const updateBookingStatus = async (bookingId: string, newStatus: BookingStatus) => {
//     try {
//       const bookingRef = doc(db, 'bookings', bookingId);
//       await updateDoc(bookingRef, {
//         status: newStatus,
//         updatedAt: serverTimestamp(),
//       });
//     } catch (error) {
//       console.error('Error updating booking status:', error);
//       alert('Failed to update status.');
//     }
//   };

//   const generateInvoicePDF = (b: Booking) => {
//     const doc = new jsPDF({ unit: 'pt', format: 'a4', orientation: 'portrait' });
//     const startY = 40;
//     doc.setFontSize(18);
//     doc.text('Invoice', 40, startY);
//     doc.setFontSize(12);
//     doc.text(`Customer: ${b.customerName}`, 40, startY + 30);
//     doc.text(`Email: ${b.customerEmail || 'N/A'}`, 40, startY + 50);
//     doc.text(`Booking Date: ${format(b.bookingDate, 'MMM dd, yyyy')}`, 40, startY + 70);
//     doc.text(`Time: ${b.bookingTime}`, 40, startY + 90);
//     doc.text(`Branch: ${b.branch}`, 40, startY + 110);
//     doc.text(`Staff: ${b.staff || '—'}`, 40, startY + 130);

//     const serviceTableData = b.services.map((s, idx) => [
//       idx + 1,
//       s.serviceName,
//       s.quantity,
//       `$${Number(s.price).toFixed(2)}`,
//       `$${(Number(s.price) * Number(s.quantity)).toFixed(2)}`,
//     ]);

//     autoTable(doc, {
//       head: [['#', 'Service', 'Qty', 'Unit Price', 'Total']],
//       body: serviceTableData,
//       startY: startY + 160,
//       theme: 'grid',
//       styles: { fontSize: 10 },
//       margin: { left: 40, right: 40 },
//     });

//     const finalY = (doc as any).lastAutoTable?.finalY || startY + 160;
//     doc.setFontSize(12);
//     doc.text(`Total Duration: ${b.totalDuration} min`, 40, finalY + 25);
//     doc.text(`Total Price: $${b.totalPrice.toFixed(2)}`, 40, finalY + 45);

//     doc.save(`Invoice_${b.customerName.replace(/\s+/g, '_')}.pdf`);
//   };

//   /* ------------------------------- Render ------------------------------ */
//   if (loading) return (
//     <div className="p-6"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600 mx-auto"></div><p className="text-center mt-2">Loading...</p></div>
//   );

//   return (
//     <div className="p-6 max-w-7xl mx-auto">
//       <div className="flex items-center justify-between mb-6">
//         <div>
//           <h1 className="text-2xl font-bold">Bookings & Finance</h1>
//           <p className="text-sm text-gray-500">Merged bookings UI + Finance reports (realtime from Firestore)</p>
//         </div>
//         <div className="flex space-x-2">
//           <button onClick={() => setView('bookings')} className={`px-3 py-2 rounded ${view==='bookings' ? 'bg-pink-600 text-white' : 'bg-gray-100'}`}>Bookings</button>
//           <button onClick={() => setView('finance')} className={`px-3 py-2 rounded ${view==='finance' ? 'bg-pink-600 text-white' : 'bg-gray-100'}`}>Finance Reports</button>
//         </div>
//       </div>

//       {/* ------------------ BOOKINGS VIEW (original merged) ------------------ */}
//       {view === 'bookings' && (
//         <div>
//           {/* Search & filters */}
//           <div className="bg-white rounded-lg p-4 mb-6 flex gap-4 items-center">
//             <div className="flex-1 relative">
//               <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
//               <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 pr-3 py-2 w-full border rounded" placeholder="Search by customer, branch, service..." />
//             </div>
//             <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="border rounded px-3 py-2">
//               <option value="all">All Status</option>
//               <option value="upcoming">Upcoming</option>
//               <option value="past">Past</option>
//               <option value="cancelled">Cancelled</option>
//             </select>
//             {/* <button onClick={() => { setShowCreate(true); resetForm(); }} className="px-3 py-2 bg-emerald-600 text-white rounded">Add Booking</button> */}
//           </div>

//           {/* bookings table */}
//           <div className="bg-white rounded-lg shadow overflow-x-auto">
//             <table className="min-w-full">
//               <thead className="bg-gray-50">
//                 <tr>
//                   <th className="px-4 py-2 text-left">Customer</th>
//                   <th className="px-4 py-2 text-left">Services</th>
//                   <th className="px-4 py-2 text-left">Date & Time</th>
//                   <th className="px-4 py-2 text-left">Staff</th>
//                   <th className="px-4 py-2 text-left">Branch</th>
//                   <th className="px-4 py-2 text-left">Payment</th>
//                   <th className="px-4 py-2 text-left">Status</th>
//                   <th className="px-4 py-2 text-left">Actions</th>
//                   <th className="px-4 py-2 text-left">Invoice</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {filteredBookings.map((b) => (
//                   <tr key={b.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => openForEdit(b)}>
//                     <td className="px-4 py-3">
//                       <div className="flex items-center gap-3">
//                         <div className="h-10 w-10 rounded-full bg-pink-100 flex items-center justify-center"><User className="w-5 h-5 text-pink-600"/></div>
//                         <div>
//                           <div className="font-medium">{b.customerName}</div>
//                           <div className="text-xs text-gray-500">{b.customerEmail || 'No email'}</div>
//                         </div>
//                       </div>
//                     </td>
//                     <td className="px-4 py-3">
//                       {b.services.slice(0,2).map((s,i)=>(<div key={i}>{s.serviceName} {s.quantity>1 && `(x${s.quantity})`}</div>))}
//                       {b.services.length>2 && <div className="text-xs text-gray-500">+{b.services.length-2} more</div>}
//                     </td>
//                     <td className="px-4 py-3">
//                       <div>{format(b.bookingDate,'MMM dd, yyyy')}</div>
//                       <div className="text-xs text-gray-500">{b.bookingTime}</div>
//                     </td>
//                     <td className="px-4 py-3">{b.staff || '—'}</td>
//                     <td className="px-4 py-3">{b.branch}</td>
//                     <td className="px-4 py-3">AED{b.totalPrice.toFixed(2)} <div className="text-xs text-gray-500">{b.paymentMethod}</div></td>
//                     <td className="px-4 py-3"><span className="px-2 py-1 rounded-full bg-gray-100 text-xs">{b.status}</span></td>
//                     <td className="px-4 py-3" onClick={(e)=>e.stopPropagation()}>
//                      <div className="flex gap-2">
//   <button onClick={() => openForEdit(b)} title="Edit" className="text-emerald-700">
//     <Edit3 className="w-4 h-4" />
//   </button>

//   {/* Ye icons ab har status pr show honge */}
//   <button 
//     onClick={() => updateBookingStatus(b.id, 'past')} 
//     title="Mark as completed" 
//     className="text-green-600"
//   >
//     <CheckCircle className="w-4 h-4" />
//   </button>

//   <button 
//     onClick={() => updateBookingStatus(b.id, 'cancelled')} 
//     title="Cancel" 
//     className="text-red-600"
//   >
//     <XCircle className="w-4 h-4" />
//   </button>

//   <button 
//     onClick={() => updateBookingStatus(b.id, 'upcoming')} 
//     title="Upcoming" 
//     className="text-blue-600"
//   >
//     <CircleArrowOutDownRight className="w-4 h-4" />
//   </button>
// </div>

//                     </td>
//                     <td className="px-4 py-3" onClick={(e)=>e.stopPropagation()}>
//                       <button onClick={()=>generateInvoicePDF(b)} className="px-2 py-1 bg-pink-600 text-white rounded">Invoice</button>
//                     </td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </div>

//           {filteredBookings.length===0 && <div className="text-center py-10 text-gray-500">No bookings found.</div>}

//           {/* Create/Edit Modal (simplified) */}
//           {showCreate && (
//             <div className="fixed inset-0 bg-gray-700 bg-opacity-50 z-50 flex items-start justify-center overflow-y-auto">
//               <div className="bg-white rounded-lg w-11/12 md:w-3/4 mt-10">
//                 <div className="flex justify-between items-center p-4 border-b">
//                   <h3 className="font-semibold">{editingId ? 'Edit Booking' : 'Add Booking'}</h3>
//                   <div className="flex gap-2">
//                     {editingId && <button onClick={async()=>{ if(!confirm('Delete?')) return; setDeleting(true); try{ await deleteDoc(doc(db,'bookings',editingId)); setShowCreate(false); resetForm(); }catch(e){console.error(e); alert('Delete failed'); } finally{ setDeleting(false);} }} className="px-3 py-1 bg-red-600 text-white rounded">Delete</button>}
//                     <button onClick={()=>{ setShowCreate(false); resetForm(); }} className="px-3 py-1">Close</button>
//                   </div>
//                 </div>
//                 <div className="p-4 space-y-4">
//                   <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
//                     <div>
//                       <label className="text-sm">Branch</label>
//                       <select value={branch} onChange={e=>setBranch(e.target.value)} className="w-full border rounded p-2">
//                         {BRANCH_OPTIONS.map(b=> <option key={b} value={b}>{b}</option>)}
//                       </select>
//                     </div>
//                     <div>
//                       <label className="text-sm">Staff</label>
//                       <select value={''} onChange={()=>{}} className="w-full border rounded p-2"><option>—</option></select>
//                     </div>
//                     <div>
//                       <label className="text-sm">Payment</label>
//                       <select value={paymentMethod} onChange={e=>setPaymentMethod(e.target.value)} className="w-full border rounded p-2">{['cash','card'].map(p=> <option key={p} value={p}>{p}</option>)}</select>
//                     </div>
//                   </div>

//                   <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
//                     <div>
//                       <label className="text-sm">Service Date</label>
//                       <input type="date" value={serviceDate} onChange={e=>setServiceDate(e.target.value)} className="w-full border rounded p-2" />
//                     </div>
//                     <div>
//                       <label className="text-sm">Time</label>
//                       <input type="time" value={serviceTime} onChange={e=>setServiceTime(e.target.value)} className="w-full border rounded p-2" />
//                     </div>
//                     <div>
//                       <label className="text-sm">Customer Name</label>
//                       <input value={customerName} onChange={e=>setCustomerName(e.target.value)} className="w-full border rounded p-2" />
//                     </div>
//                   </div>

//                   <div className="flex justify-end gap-2">
//                     <button className="px-3 py-2 bg-gray-100 rounded" onClick={()=>{ setShowCreate(false); resetForm(); }}>Close</button>
//                     <button className="px-3 py-2 bg-emerald-600 text-white rounded" onClick={async()=>{ /* minimal save */ alert('Use back-end saving as needed'); }}>Save</button>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           )}
//         </div>
//       )}

//       {/* ------------------ FINANCE VIEW ------------------ */}
//       {view === 'finance' && (
//         <div>
//           <div className="bg-white rounded-lg p-4 mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
//             <div>
//               <label className="text-sm">Branch</label>
//               <select value={financeBranch} onChange={e=>setFinanceBranch(e.target.value)} className="w-full border rounded p-2">
//                 <option value="all">All Branches</option>
//                 {BRANCH_OPTIONS.map(b=> <option key={b} value={b}>{b}</option>)}
//               </select>
//             </div>
//             <div>
//               <label className="text-sm">Timeline</label>
//               <select value={timeline} onChange={e=>setTimeline(e.target.value as any)} className="w-full border rounded p-2">
//                 <option value="today">Today</option>
//                 <option value="yesterday">Yesterday</option>
//                 <option value="this_week">This Week</option>
//                 <option value="this_month">This Month</option>
//                 <option value="custom">Custom</option>
//               </select>
//             </div>
//             <div>
//               <label className="text-sm">From</label>
//               <input type="date" value={dateFrom} onChange={e=>{ setDateFrom(e.target.value); setTimeline('custom'); }} className="w-full border rounded p-2" />
//             </div>
//             <div>
//               <label className="text-sm">To</label>
//               <input type="date" value={dateTo} onChange={e=>{ setDateTo(e.target.value); setTimeline('custom'); }} className="w-full border rounded p-2" />
//             </div>

//             <div className="md:col-span-4 flex justify-end gap-2 mt-2">
//               <button onClick={exportFinancePDF} className="px-3 py-2 bg-pink-600 text-white rounded">Export PDF</button>
//             </div>
//           </div>

//           {/* Summary cards */}
//           <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
//             <div className="bg-white p-4 rounded shadow">
//               <div className="text-sm text-gray-500">Gross Sales</div>
//               <div className="text-xl font-semibold">AED{financeTotals.grossSales?.toFixed(2) || '0.00'}</div>
//             </div>
//             <div className="bg-white p-4 rounded shadow">
//               <div className="text-sm text-gray-500">Net Sales</div>
//               <div className="text-xl font-semibold">AED{financeTotals.sales?.toFixed(2) || '0.00'}</div>
//             </div>
//             <div className="bg-white p-4 rounded shadow">
//               <div className="text-sm text-gray-500">Tax</div>
//               <div className="text-xl font-semibold">AED{financeTotals.tax?.toFixed(2) || '0.00'}</div>
//             </div>
//             <div className="bg-white p-4 rounded shadow">
//               <div className="text-sm text-gray-500">In-Hand Collection</div>
//               <div className="text-xl font-semibold">AED{financeTotals.inHandCollection?.toFixed(2) || '0.00'}</div>
//             </div>
//           </div>

//           {/* Payment methods breakdown table + totals */}
//           <div className="bg-white rounded shadow overflow-x-auto">
//             <table className="min-w-full">
//               <thead className="bg-gray-50">
//                 <tr>
//                   <th className="px-4 py-2 text-left">Metric / Payment Method</th>
//                   <th className="px-4 py-2 text-right">Amount</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 <tr>
//                   <td className="px-4 py-2">Sales (Net)</td>
//                   <td className="px-4 py-2 text-right">AED{financeTotals.sales?.toFixed(2) || '0.00'}</td>
//                 </tr>
//                 <tr>
//                   <td className="px-4 py-2">Gross Sales</td>
//                   <td className="px-4 py-2 text-right">AED{financeTotals.grossSales?.toFixed(2) || '0.00'}</td>
//                 </tr>
//                 <tr>
//                   <td className="px-4 py-2">Discount</td>
//                   <td className="px-4 py-2 text-right">AED{financeTotals.discount?.toFixed(2) || '0.00'}</td>
//                 </tr>
//                 <tr>
//                   <td className="px-4 py-2">Refunds</td>
//                   <td className="px-4 py-2 text-right">AED{financeTotals.refunds?.toFixed(2) || '0.00'}</td>
//                 </tr>
//                 <tr>
//                   <td className="px-4 py-2">Adjustments</td>
//                   <td className="px-4 py-2 text-right">AED{financeTotals.adjustments?.toFixed(2) || '0.00'}</td>
//                 </tr>
//                 <tr>
//                   <td className="px-4 py-2">Tax</td>
//                   <td className="px-4 py-2 text-right">AED{financeTotals.tax?.toFixed(2) || '0.00'}</td>
//                 </tr>
//                 <tr>
//                   <td className="px-4 py-2">Total Sales (Tax + Net)</td>
//                   <td className="px-4 py-2 text-right">AED{financeTotals.totalSalesWithTax?.toFixed(2) || '0.00'}</td>
//                 </tr>
//                 <tr>
//                   <td className="px-4 py-2">Tips</td>
//                   <td className="px-4 py-2 text-right">AED{financeTotals.tips?.toFixed(2) || '0.00'}</td>
//                 </tr>
//                 <tr>
//                   <td className="px-4 py-2">Collection (Sales + Tips)</td>
//                   <td className="px-4 py-2 text-right">AED{financeTotals.collection?.toFixed(2) || '0.00'}</td>
//                 </tr>
//                 <tr>
//                   <td className="px-4 py-2">Excluded Payments</td>
//                   <td className="px-4 py-2 text-right">AED{financeTotals.excludedPayments?.toFixed(2) || '0.00'}</td>
//                 </tr>
//                 <tr>
//                   <td className="px-4 py-2">In-Hand Collection</td>
//                   <td className="px-4 py-2 text-right">AED{financeTotals.inHandCollection?.toFixed(2) || '0.00'}</td>
//                 </tr>

//                 {/* Payment methods breakdown rows */}
//                 {Object.entries(financeTotals.paymentMethods || {}).map(([pm, amt]) => (
//                   <tr key={pm} className="border-t">
//                     <td className="px-4 py-2 capitalize">{pm.replace(/_/g,' ')}</td>
//                     <td className="px-4 py-2 text-right">AED{(Number(amt)||0).toFixed(2)}</td>
//                   </tr>
//                 ))}

//               </tbody>
//             </table>
//           </div>

//           {/* Detailed bookings list for finance */}
//           <div className="bg-white rounded shadow mt-6 overflow-x-auto">
//             <table className="min-w-full">
//               <thead className="bg-gray-50">
//                 <tr>
//                   <th className="px-4 py-2 text-left">Customer</th>
//                   <th className="px-4 py-2 text-left">Date</th>
//                   <th className="px-4 py-2 text-left">Branch</th>
//                   <th className="px-4 py-2 text-right">Gross</th>
//                   <th className="px-4 py-2 text-right">Discount</th>
//                   <th className="px-4 py-2 text-right">Refunds</th>
//                   <th className="px-4 py-2 text-right">Adjust</th>
//                   <th className="px-4 py-2 text-right">Net</th>
//                   <th className="px-4 py-2 text-right">Tax</th>
//                   <th className="px-4 py-2 text-right">Total</th>
//                   <th className="px-4 py-2 text-right">Tips</th>
//                   <th className="px-4 py-2 text-left">Payment</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {financeFiltered.map((b)=>{
//                   const gross = Number(b.grossSales ?? b.totalPrice) || 0;
//                   const discount = Number(b.discount ?? 0) || 0;
//                   const refunds = Number(b.refunds ?? 0) || 0;
//                   const adjustments = Number(b.adjustments ?? 0) || 0;
//                   const tax = Number(b.tax ?? 0) || 0;
//                   const tips = Number(b.tips ?? 0) || 0;
//                   const net = gross - discount - refunds + adjustments;
//                   return (
//                     <tr key={b.id} className="hover:bg-gray-50 cursor-pointer" onClick={()=>openForEdit(b)}>
//                       <td className="px-4 py-2">{b.customerName}</td>
//                       <td className="px-4 py-2">{format(b.bookingDate,'yyyy-MM-dd')}</td>
//                       <td className="px-4 py-2">{b.branch}</td>
//                       <td className="px-4 py-2 text-right">AED{gross.toFixed(2)}</td>
//                       <td className="px-4 py-2 text-right">AED{discount.toFixed(2)}</td>
//                       <td className="px-4 py-2 text-right">AED{refunds.toFixed(2)}</td>
//                       <td className="px-4 py-2 text-right">AED{adjustments.toFixed(2)}</td>
//                       <td className="px-4 py-2 text-right">AED{net.toFixed(2)}</td>
//                       <td className="px-4 py-2 text-right">AED{tax.toFixed(2)}</td>
//                       <td className="px-4 py-2 text-right">AED{(net+tax).toFixed(2)}</td>
//                       <td className="px-4 py-2 text-right">AED{tips.toFixed(2)}</td>
//                       <td className="px-4 py-2 text-left">{b.paymentMethod}</td>
//                     </tr>
//                   )
//                 })}
//               </tbody>
//             </table>
//           </div>

//         </div>
//       )}

//     </div>
//   );
// }



/// finance 
'use client';

import { useState, useEffect, useMemo } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { v4 as uuidv4 } from 'uuid';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  Timestamp,
  getDocs,
  addDoc,
  serverTimestamp,
  deleteDoc,
  setDoc,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

import {
  Calendar,
  Clock,
  MapPin,
  User,
  CreditCard,
  Search,
  CheckCircle,
  XCircle,
  Plus,
  Trash2,
  Edit3,
  CircleArrowOutDownRight,
} from 'lucide-react';
import { format, isSameDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subDays } from 'date-fns';
import AccessWrapper from '@/components/AccessWrapper';

/* ----------------------------- Types ----------------------------- */

interface BookingService {
  serviceId?: string;
  serviceName: string;
  category: string;
  duration: number; // minutes
  price: number; // per unit
  quantity: number;
}

type BookingStatus = 'upcoming' | 'past' | 'cancelled';

interface Booking {
  id: string;
  userId: string;
  customerName: string;
  customerEmail?: string;
  services: BookingService[];
  bookingDate: Date;
  bookingTime: string; // "HH:mm"
  branch: string;
  staff: string | null; // name string
  totalPrice: number;
  totalDuration: number;
  status: BookingStatus;
  paymentMethod: string;
  // finance-related optional fields
  grossSales?: number;
  discount?: number;
  refunds?: number;
  adjustments?: number;
  tax?: number;
  tips?: number;
  excludedPayments?: number;
  inHand?: number;
  paymentDetails?: Record<string, number>;
  emailConfirmation: boolean;
  smsConfirmation: boolean;
  createdAt: Date;
  updatedAt: Date;
  remarks?: string | null;
}

/* --------------------------- Constants --------------------------- */

const BRANCH_OPTIONS = ['Al Bustan', 'Marina', 'TECOM', 'AL Muraqabat', 'IBN Batutta Mall'];
const CATEGORY_OPTIONS = ['Facial', 'Hair', 'Nails', 'Lashes', 'Massage'];
const PAYMENT_METHODS = ['cash', 'card', 'bank_transfer', 'cobone', 'groupon', 'pay_by_link', 'paypal', 'tabby', 'tamara', 'extra_pay_mode_1', 'extra_pay_mode_2', 'user_balance', 'redeem'];

const STAFF_FALLBACK = ['Komal', 'Shameem', 'Do Thi Kim', 'Alishba'];

const TIMELINE_OPTIONS = ['today', 'yesterday', 'this_week', 'this_month', 'custom'] as const;



/* =========================== Component =========================== */

export default function BookingsAndFinancePage() {
  // shared state
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  // UI state
  const [view, setView] = useState<'bookings' | 'finance'>('bookings');

  // filters for schedule/bookings
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // create/edit modal states (kept similar to original)
  const [showCreate, setShowCreate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // form state (shortened)
  const [branch, setBranch] = useState(BRANCH_OPTIONS[0]);
  const [serviceDate, setServiceDate] = useState(() => format(new Date(), 'yyyy-MM-dd'));
  const [serviceTime, setServiceTime] = useState('10:00');
  const [customerName, setCustomerName] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [emailConfirmation, setEmailConfirmation] = useState(false);
  const [smsConfirmation, setSmsConfirmation] = useState(false);
  const [customerEmail, setCustomerEmail] = useState('');
  const [status, setStatus] = useState<BookingStatus>('upcoming');

  const [staffFromDB, setStaffFromDB] = useState<string[]>([]);
  const STAFF_OPTIONS = staffFromDB.length ? staffFromDB : STAFF_FALLBACK;

  // finance filters
  const [timeline, setTimeline] = useState<typeof TIMELINE_OPTIONS[number]>('this_month');
  const [dateFrom, setDateFrom] = useState(() => format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [dateTo, setDateTo] = useState(() => format(endOfMonth(new Date()), 'yyyy-MM-dd'));
  const [financeBranch, setFinanceBranch] = useState<string>('all');
  const [financeTimelinePreset, setFinanceTimelinePreset] = useState<string>('this_month');

  /* -------------------- Load Staff from Firebase -------------------- */
  useEffect(() => {
    const loadStaff = async () => {
      try {
        const snap = await getDocs(collection(db, 'staff'));
        const list: string[] = [];
        snap.forEach((d) => {
          const data = d.data() as any;
          if (data?.name) list.push(String(data.name));
        });
        setStaffFromDB(list.length ? list : STAFF_FALLBACK);
      } catch {
        setStaffFromDB(STAFF_FALLBACK);
      }
    };
    loadStaff();
  }, []);

  /* -------------------- Realtime bookings listener -------------------- */
  useEffect(() => {
    const q = query(collection(db, 'bookings'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      const items: Booking[] = snap.docs.map((d) => {
        const data = d.data() as any;
        return {
          id: d.id,
          userId: data.userId || '',
          customerName: data.customerName || '',
          customerEmail: data.customerEmail || '',
          services: (data.services || []) as BookingService[],
          bookingDate: data.bookingDate?.toDate() || new Date(),
          bookingTime: data.bookingTime || '',
          branch: data.branch || '',
          staff: data.staffName || data.staff || '—',
          totalPrice: Number(data.totalPrice) || 0,
          totalDuration: Number(data.totalDuration) || 0,
          status: (data.status as BookingStatus) || 'upcoming',
          paymentMethod: data.paymentMethod || 'cash',
          grossSales: Number(data.grossSales) || undefined,
          discount: Number(data.discount) || undefined,
          refunds: Number(data.refunds) || undefined,
          adjustments: Number(data.adjustments) || undefined,
          tax: Number(data.tax) || undefined,
          tips: Number(data.tips) || undefined,
          excludedPayments: Number(data.excludedPayments) || undefined,
          inHand: Number(data.inHand) || undefined,
          paymentDetails: data.paymentDetails || undefined,
          emailConfirmation: !!data.emailConfirmation,
          smsConfirmation: !!data.smsConfirmation,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          remarks: data.remarks ?? null,
        };
      });
      setBookings(items);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  /* ---------------------- Finance: date presets ---------------------- */
  useEffect(() => {
    const now = new Date();
    switch (timeline) {
      case 'today':
        setDateFrom(format(now, 'yyyy-MM-dd'));
        setDateTo(format(now, 'yyyy-MM-dd'));
        break;
      case 'yesterday':
        const y = subDays(now, 1);
        setDateFrom(format(y, 'yyyy-MM-dd'));
        setDateTo(format(y, 'yyyy-MM-dd'));
        break;
      case 'this_week':
        setDateFrom(format(startOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd'));
        setDateTo(format(endOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd'));
        break;
      case 'this_month':
        setDateFrom(format(startOfMonth(now), 'yyyy-MM-dd'));
        setDateTo(format(endOfMonth(now), 'yyyy-MM-dd'));
        break;
      case 'custom':
      default:
        // keep dates as-is
        break;
    }
  }, [timeline]);

  /* -------------------- Filtered bookings for finance -------------------- */
  const financeFiltered = useMemo(() => {
    const from = new Date(dateFrom + 'T00:00:00');
    const to = new Date(dateTo + 'T23:59:59');
    return bookings.filter((b) => {
      const d = b.bookingDate;
      const inRange = d >= from && d <= to;
      const branchOk = financeBranch === 'all' || b.branch === financeBranch;
      return inRange && branchOk;
    });
  }, [bookings, dateFrom, dateTo, financeBranch]);

  /* -------------------- Compute finance aggregates -------------------- */
  const financeTotals = useMemo(() => {
    // initialize counters
    const totals: any = {
      sales: 0, // net sales
      grossSales: 0,
      discount: 0,
      refunds: 0,
      adjustments: 0,
      tax: 0,
      totalSalesWithTax: 0, // tax + net sales
      tips: 0,
      collection: 0, // sales + tips
      excludedPayments: 0,
      inHandCollection: 0,
      paymentMethods: {}, // map method->amount
    };

    // initialize payment method keys
    PAYMENT_METHODS.forEach((m) => (totals.paymentMethods[m] = 0));

    financeFiltered.forEach((b) => {
      const gross = Number(b.grossSales ?? b.totalPrice) || 0;
      const discount = Number(b.discount ?? 0) || 0;
      const refunds = Number(b.refunds ?? 0) || 0;
      const adjustments = Number(b.adjustments ?? 0) || 0;
      const tax = Number(b.tax ?? 0) || 0;
      const tips = Number(b.tips ?? 0) || 0;
      const excluded = Number(b.excludedPayments ?? 0) || 0;

      const netSales = gross - discount - refunds + adjustments; // simple formula

      totals.grossSales += gross;
      totals.discount += discount;
      totals.refunds += refunds;
      totals.adjustments += adjustments;
      totals.tax += tax;
      totals.tips += tips;
      totals.excludedPayments += excluded;

      totals.sales += netSales;
      totals.totalSalesWithTax += netSales + tax;
      totals.collection += netSales + tips;

      // in-hand collection logic: if b.inHand provided use it, else assume collection - excluded
      const inHand = Number(b.inHand ?? Math.max(0, netSales + tips - excluded));
      totals.inHandCollection += inHand;

      // payment method breakdown
      const method = (b.paymentMethod || 'cash').toLowerCase();
      if (!totals.paymentMethods[method]) totals.paymentMethods[method] = 0;
      // If booking has paymentDetails (map of methods->amount), prefer that
      if (b.paymentDetails && typeof b.paymentDetails === 'object') {
        Object.entries(b.paymentDetails).forEach(([pm, amt]) => {
          const key = pm.toLowerCase();
          totals.paymentMethods[key] = (totals.paymentMethods[key] || 0) + Number(amt || 0);
        });
      } else {
        totals.paymentMethods[method] = (totals.paymentMethods[method] || 0) + Number(netSales + tips || 0);
      }
    });

    return totals;
  }, [financeFiltered]);

  /* -------------------- Export PDF for finance -------------------- */
  const exportFinancePDF = () => {
    const doc = new jsPDF({ unit: 'pt', format: 'a4', orientation: 'landscape' });
    const title = 'Finance Report';
    doc.setFontSize(16);
    doc.text(title, 40, 40);

    const meta = [`Branch: ${financeBranch}`, `From: ${dateFrom}`, `To: ${dateTo}`];
    doc.setFontSize(10);
    doc.text(meta.join('   '), 40, 60);

    const rows = financeFiltered.map((b) => {
      const gross = Number(b.grossSales ?? b.totalPrice) || 0;
      const discount = Number(b.discount ?? 0) || 0;
      const refunds = Number(b.refunds ?? 0) || 0;
      const adjustments = Number(b.adjustments ?? 0) || 0;
      const tax = Number(b.tax ?? 0) || 0;
      const tips = Number(b.tips ?? 0) || 0;
      const net = gross - discount - refunds + adjustments;
      return [
        b.customerName,
        format(b.bookingDate, 'yyyy-MM-dd'),
        b.bookingTime,
        b.branch,
        b.staff || '—',
        `$${gross.toFixed(2)}`,
        `$${discount.toFixed(2)}`,
        `$${refunds.toFixed(2)}`,
        `$${adjustments.toFixed(2)}`,
        `$${net.toFixed(2)}`,
        `$${tax.toFixed(2)}`,
        `$${(net + tax).toFixed(2)}`,
        `$${tips.toFixed(2)}`,
        b.paymentMethod,
      ];
    });

    autoTable(doc, {
      head: [[
        'Customer', 'Date', 'Time', 'Branch', 'Staff', 'Gross', 'Discount', 'Refunds', 'Adjustments', 'Net Sales', 'Tax', 'Total Sales', 'Tips', 'Payment Method'
      ]],
      body: rows,
      startY: 80,
      styles: { fontSize: 9 },
      margin: { left: 20, right: 20 },
    });

    doc.save(`Finance_Report_${dateFrom}_to_${dateTo}.pdf`);
  };

  /* -------------------- Bookings table filtering -------------------- */
  const filteredBookings = useMemo(() => {
    const q = searchTerm.toLowerCase();
    return bookings.filter((booking) => {
      const matchesSearch =
        booking.customerName.toLowerCase().includes(q) ||
        booking.branch.toLowerCase().includes(q) ||
        booking.services.some((s) => s.serviceName.toLowerCase().includes(q));
      const matchesStatus = statusFilter === 'all' || booking.status === (statusFilter as BookingStatus);
      return matchesSearch && matchesStatus;
    });
  }, [bookings, searchTerm, statusFilter]);

  /* -------------------- Simple booking CRUD helpers (kept minimal) -------------------- */
  const resetForm = () => {
    setBranch(BRANCH_OPTIONS[0]);
    setCustomerEmail('');
    setServiceDate(format(new Date(), 'yyyy-MM-dd'));
    setServiceTime('10:00');
    setCustomerName('');
    setPaymentMethod('cash');
    setEmailConfirmation(false);
    setSmsConfirmation(false);
    setStatus('upcoming');
    setStaff('');
    setEditingId(null);
  };

  const openForEdit = (b: Booking) => {
    setEditingId(b.id);
    setBranch(b.branch || BRANCH_OPTIONS[0]);
    setServiceDate(format(b.bookingDate, 'yyyy-MM-dd'));
    setServiceTime(b.bookingTime || '10:00');
    setCustomerName(b.customerName || '');
    setCustomerEmail(b.customerEmail || '');
    setPaymentMethod(b.paymentMethod || 'cash');
    setEmailConfirmation(!!b.emailConfirmation);
    setSmsConfirmation(!!b.smsConfirmation);
    setStatus(b.status || 'upcoming');
    setStaff(b.staff || '');
    setShowCreate(true);
  };

  const updateBookingStatus = async (bookingId: string, newStatus: BookingStatus) => {
    try {
      const bookingRef = doc(db, 'bookings', bookingId);
      await updateDoc(bookingRef, {
        status: newStatus,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error updating booking status:', error);
      alert('Failed to update status.');
    }
  };

  const generateInvoicePDF = (b: Booking) => {
    const doc = new jsPDF({ unit: 'pt', format: 'a4', orientation: 'portrait' });
    const startY = 40;
    doc.setFontSize(18);
    doc.text('Invoice', 40, startY);
    doc.setFontSize(12);
    doc.text(`Customer: ${b.customerName}`, 40, startY + 30);
    doc.text(`Email: ${b.customerEmail || 'N/A'}`, 40, startY + 50);
    doc.text(`Booking Date: ${format(b.bookingDate, 'MMM dd, yyyy')}`, 40, startY + 70);
    doc.text(`Time: ${b.bookingTime}`, 40, startY + 90);
    doc.text(`Branch: ${b.branch}`, 40, startY + 110);
    doc.text(`Staff: ${b.staff || '—'}`, 40, startY + 130);

    const serviceTableData = b.services.map((s, idx) => [
      idx + 1,
      s.serviceName,
      s.quantity,
      `$${Number(s.price).toFixed(2)}`,
      `$${(Number(s.price) * Number(s.quantity)).toFixed(2)}`,
    ]);

    autoTable(doc, {
      head: [['#', 'Service', 'Qty', 'Unit Price', 'Total']],
      body: serviceTableData,
      startY: startY + 160,
      theme: 'grid',
      styles: { fontSize: 10 },
      margin: { left: 40, right: 40 },
    });

    const finalY = (doc as any).lastAutoTable?.finalY || startY + 160;
    doc.setFontSize(12);
    doc.text(`Total Duration: ${b.totalDuration} min`, 40, finalY + 25);
    doc.text(`Total Price: $${b.totalPrice.toFixed(2)}`, 40, finalY + 45);

    doc.save(`Invoice_${b.customerName.replace(/\s+/g, '_')}.pdf`);
  };

  /* ------------------------------- Render ------------------------------ */
  if (loading) return (
    <div className="p-6"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600 mx-auto"></div><p className="text-center mt-2">Loading...</p></div>
  );

  return (
    <AccessWrapper>
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Bookings & Finance</h1>
          <p className="text-sm text-gray-500">Merged bookings UI + Finance reports (realtime from Firestore)</p>
        </div>
        <div className="flex space-x-2">
          
          <button onClick={() => setView('finance')} className={`px-3 py-2 rounded ${view==='finance' ? 'bg-pink-600 text-white' : 'bg-gray-100'}`}>Finance Reports</button>
        </div>
      </div>

      {/* ------------------ BOOKINGS VIEW (original merged) ------------------ */}
      

      {/* ------------------ FINANCE VIEW ------------------ */}
      {view === 'finance' && (
        <div>
          <div className="bg-white rounded-lg p-4 mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm">Branch</label>
              <select value={financeBranch} onChange={e=>setFinanceBranch(e.target.value)} className="w-full border rounded p-2">
                <option value="all">All Branches</option>
                {BRANCH_OPTIONS.map(b=> <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm">Timeline</label>
              <select value={timeline} onChange={e=>setTimeline(e.target.value as any)} className="w-full border rounded p-2">
                <option value="today">Today</option>
                <option value="yesterday">Yesterday</option>
                <option value="this_week">This Week</option>
                <option value="this_month">This Month</option>
                <option value="custom">Custom</option>
              </select>
            </div>
            <div>
              <label className="text-sm">From</label>
              <input type="date" value={dateFrom} onChange={e=>{ setDateFrom(e.target.value); setTimeline('custom'); }} className="w-full border rounded p-2" />
            </div>
            <div>
              <label className="text-sm">To</label>
              <input type="date" value={dateTo} onChange={e=>{ setDateTo(e.target.value); setTimeline('custom'); }} className="w-full border rounded p-2" />
            </div>

            <div className="md:col-span-4 flex justify-end gap-2 mt-2">
              <button onClick={exportFinancePDF} className="px-3 py-2 bg-pink-600 text-white rounded">Export PDF</button>
            </div>
          </div>

          {/* Summary cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white p-4 rounded shadow">
              <div className="text-sm text-gray-500">Gross Sales</div>
              <div className="text-xl font-semibold">AED{financeTotals.grossSales?.toFixed(2) || '0.00'}</div>
            </div>
            <div className="bg-white p-4 rounded shadow">
              <div className="text-sm text-gray-500">Net Sales</div>
              <div className="text-xl font-semibold">AED{financeTotals.sales?.toFixed(2) || '0.00'}</div>
            </div>
            <div className="bg-white p-4 rounded shadow">
              <div className="text-sm text-gray-500">Tax</div>
              <div className="text-xl font-semibold">AED{financeTotals.tax?.toFixed(2) || '0.00'}</div>
            </div>
            <div className="bg-white p-4 rounded shadow">
              <div className="text-sm text-gray-500">In-Hand Collection</div>
              <div className="text-xl font-semibold">AED{financeTotals.inHandCollection?.toFixed(2) || '0.00'}</div>
            </div>
          </div>

          {/* Payment methods breakdown table + totals */}
          <div className="bg-white rounded shadow overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left">Metric / Payment Method</th>
                  <th className="px-4 py-2 text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="px-4 py-2">Sales (Net)</td>
                  <td className="px-4 py-2 text-right">AED{financeTotals.sales?.toFixed(2) || '0.00'}</td>
                </tr>
                <tr>
                  <td className="px-4 py-2">Gross Sales</td>
                  <td className="px-4 py-2 text-right">AED{financeTotals.grossSales?.toFixed(2) || '0.00'}</td>
                </tr>
                <tr>
                  <td className="px-4 py-2">Discount</td>
                  <td className="px-4 py-2 text-right">AED{financeTotals.discount?.toFixed(2) || '0.00'}</td>
                </tr>
                <tr>
                  <td className="px-4 py-2">Refunds</td>
                  <td className="px-4 py-2 text-right">AED{financeTotals.refunds?.toFixed(2) || '0.00'}</td>
                </tr>
                <tr>
                  <td className="px-4 py-2">Adjustments</td>
                  <td className="px-4 py-2 text-right">AED{financeTotals.adjustments?.toFixed(2) || '0.00'}</td>
                </tr>
                <tr>
                  <td className="px-4 py-2">Tax</td>
                  <td className="px-4 py-2 text-right">AED{financeTotals.tax?.toFixed(2) || '0.00'}</td>
                </tr>
                <tr>
                  <td className="px-4 py-2">Total Sales (Tax + Net)</td>
                  <td className="px-4 py-2 text-right">AED{financeTotals.totalSalesWithTax?.toFixed(2) || '0.00'}</td>
                </tr>
                <tr>
                  <td className="px-4 py-2">Tips</td>
                  <td className="px-4 py-2 text-right">AED{financeTotals.tips?.toFixed(2) || '0.00'}</td>
                </tr>
                <tr>
                  <td className="px-4 py-2">Collection (Sales + Tips)</td>
                  <td className="px-4 py-2 text-right">AED{financeTotals.collection?.toFixed(2) || '0.00'}</td>
                </tr>
                <tr>
                  <td className="px-4 py-2">Excluded Payments</td>
                  <td className="px-4 py-2 text-right">AED{financeTotals.excludedPayments?.toFixed(2) || '0.00'}</td>
                </tr>
                <tr>
                  <td className="px-4 py-2">In-Hand Collection</td>
                  <td className="px-4 py-2 text-right">AED{financeTotals.inHandCollection?.toFixed(2) || '0.00'}</td>
                </tr>

                {/* Payment methods breakdown rows */}
                {Object.entries(financeTotals.paymentMethods || {}).map(([pm, amt]) => (
                  <tr key={pm} className="border-t">
                    <td className="px-4 py-2 capitalize">{pm.replace(/_/g,' ')}</td>
                    <td className="px-4 py-2 text-right">AED{(Number(amt)||0).toFixed(2)}</td>
                  </tr>
                ))}

              </tbody>
            </table>
          </div>

          {/* Detailed bookings list for finance */}
          <div className="bg-white rounded shadow mt-6 overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left">Customer</th>
                  <th className="px-4 py-2 text-left">Date</th>
                  <th className="px-4 py-2 text-left">Branch</th>
                  <th className="px-4 py-2 text-right">Gross</th>
                  <th className="px-4 py-2 text-right">Discount</th>
                  <th className="px-4 py-2 text-right">Refunds</th>
                  <th className="px-4 py-2 text-right">Adjust</th>
                  <th className="px-4 py-2 text-right">Net</th>
                  <th className="px-4 py-2 text-right">Tax</th>
                  <th className="px-4 py-2 text-right">Total</th>
                  <th className="px-4 py-2 text-right">Tips</th>
                  <th className="px-4 py-2 text-left">Payment</th>
                </tr>
              </thead>
              <tbody>
                {financeFiltered.map((b)=>{
                  const gross = Number(b.grossSales ?? b.totalPrice) || 0;
                  const discount = Number(b.discount ?? 0) || 0;
                  const refunds = Number(b.refunds ?? 0) || 0;
                  const adjustments = Number(b.adjustments ?? 0) || 0;
                  const tax = Number(b.tax ?? 0) || 0;
                  const tips = Number(b.tips ?? 0) || 0;
                  const net = gross - discount - refunds + adjustments;
                  return (
                    <tr key={b.id} className="hover:bg-gray-50 cursor-pointer" onClick={()=>openForEdit(b)}>
                      <td className="px-4 py-2">{b.customerName}</td>
                      <td className="px-4 py-2">{format(b.bookingDate,'yyyy-MM-dd')}</td>
                      <td className="px-4 py-2">{b.branch}</td>
                      <td className="px-4 py-2 text-right">AED{gross.toFixed(2)}</td>
                      <td className="px-4 py-2 text-right">AED{discount.toFixed(2)}</td>
                      <td className="px-4 py-2 text-right">AED{refunds.toFixed(2)}</td>
                      <td className="px-4 py-2 text-right">AED{adjustments.toFixed(2)}</td>
                      <td className="px-4 py-2 text-right">AED{net.toFixed(2)}</td>
                      <td className="px-4 py-2 text-right">AED{tax.toFixed(2)}</td>
                      <td className="px-4 py-2 text-right">AED{(net+tax).toFixed(2)}</td>
                      <td className="px-4 py-2 text-right">AED{tips.toFixed(2)}</td>
                      <td className="px-4 py-2 text-left">{b.paymentMethod}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

        </div>
      )}

    </div>
    </AccessWrapper>
  );
}


