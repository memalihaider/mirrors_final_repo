// 'use client';

// import { useEffect, useMemo, useState } from 'react';
// import { collection, onSnapshot } from 'firebase/firestore';
// import { db } from '@/lib/firebase';
// import AccessWrapper from '@/components/AccessWrapper';
// import { Search, DollarSign, Calendar as CalendarIcon, TrendingUp, BarChart3, Filter, Users, CreditCard, ChevronLeft, ChevronRight } from 'lucide-react';
// import { format, isWithinInterval } from 'date-fns';

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
//   'Al Bustan',
//   'Marina',
//   'TECOM',
//   'AL Muraqabat',
//   'IBN Batutta Mall',
// ];
// const STATUS_OPTIONS = ['Pending', 'Confirmed', 'Completed', 'Rejected'];
// const PAYMENT_OPTIONS = ['Cash', 'Card', 'Online'];

// /* ========================= Component ========================= */
// export default function SalesReportPage() {
//   /* ---------------------------- State ---------------------------- */
//   const [bookings, setBookings] = useState<BookingDocLite[]>([]);

//   // Dropdown options from Firebase
//   const [staffOptions, setStaffOptions] = useState<string[]>([]);
//   const [serviceOptions, setServiceOptions] = useState<string[]>([]);
//   const [categoryOptions, setCategoryOptions] = useState<string[]>([]);

//   // Filters
//   const [search, setSearch] = useState('');
//   const [branchFilter, setBranchFilter] = useState('');
//   const [staffFilter, setStaffFilter] = useState('');
//   const [serviceFilter, setServiceFilter] = useState('');
//   const [categoryFilter, setCategoryFilter] = useState('');
//   const [paymentFilter, setPaymentFilter] = useState('');
//   const [statusFilter, setStatusFilter] = useState('');
//   const [startDate, setStartDate] = useState('');
//   const [endDate, setEndDate] = useState('');
//   const [perPage, setPerPage] = useState(10);
//   const [page, setPage] = useState(1);

//   /* -------------------- Realtime: Bookings -------------------- */
//   useEffect(() => {
//     const unsub = onSnapshot(collection(db, 'bookings'), (snap) => {
//       const list: BookingDocLite[] = snap.docs.map((d) => {
//         const data = d.data() as any;
//         return {
//           id: d.id,
//           customerName: data.customerName || '',
//           services: (data.services || []).map((s: any) => ({
//             serviceName: s.serviceName || '',
//             category: s.category || '',
//             price: Number(s.price) || 0,
//             discountAmount: Number(s.discountAmount) || 0,
//             tipAmount: Number(s.tipAmount) || 0,
//           })),
//           bookingDate: data.bookingDate?.toDate?.() || new Date(),
//           bookingTime: data.bookingTime || '',
//           branch: data.branch || '',
//           staff: data.staff ?? null,
//           status: data.status || 'Pending',
//           paymentMethod: data.paymentMethod || '',
//           cardAuthCode: data.cardAuthCode || '',
//         } as BookingDocLite;
//       });
//       setBookings(list);
//     });
//     return () => unsub();
//   }, []);

//   /* -------------------- Realtime: Staff -------------------- */
//   useEffect(() => {
//     const unsub = onSnapshot(collection(db, 'staff'), (snap) => {
//       setStaffOptions(snap.docs.map((d) => d.data().name));
//     });
//     return () => unsub();
//   }, []);

//   /* -------------------- Realtime: Services -------------------- */
//   useEffect(() => {
//     const unsub = onSnapshot(collection(db, 'services'), (snap) => {
//       setServiceOptions(snap.docs.map((d) => d.data().name));
//     });
//     return () => unsub();
//   }, []);

//   /* -------------------- Realtime: Categories -------------------- */
//   useEffect(() => {
//     const unsub = onSnapshot(collection(db, 'categories'), (snap) => {
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
//       if (staffFilter && (b.staff || '').toLowerCase() !== staffFilter.toLowerCase()) return false;
//       if (serviceFilter && !b.services.some((s) => s.serviceName === serviceFilter)) return false;
//       if (categoryFilter && !b.services.some((s) => s.category === categoryFilter)) return false;
//       if (paymentFilter && b.paymentMethod !== paymentFilter) return false;
//       if (statusFilter && b.status !== statusFilter) return false;

//       if (startDate && endDate) {
//         const start = new Date(startDate + 'T00:00:00');
//         const end = new Date(endDate + 'T23:59:59');
//         if (!isWithinInterval(b.bookingDate, { start, end })) return false;
//       }

//       return true;
//     });
//   }, [bookings, search, branchFilter, staffFilter, serviceFilter, categoryFilter, paymentFilter, statusFilter, startDate, endDate]);

//   /* ----------------------------- Pagination ----------------------------- */
//   const totalPages = Math.ceil(filteredBookings.length / perPage);
//   const paginatedBookings = filteredBookings.slice((page - 1) * perPage, page * perPage);

//   /* ----------------------------- Stats ----------------------------- */
//   const totalRevenue = filteredBookings.reduce((sum, b) => {
//     const serviceFees = b.services.reduce((s, sv) => s + (sv.price || 0), 0);
//     const discount = b.services.reduce((s, sv) => s + (sv.discountAmount || 0), 0);
//     const tip = b.services.reduce((s, sv) => s + (sv.tipAmount || 0), 0);
//     return sum + (serviceFees - discount + tip);
//   }, 0);

//   const selectedPaymentTotal = filteredBookings.reduce((sum, b) => {
//     const paid = b.paymentMethod ? b.services.reduce((s, sv) => s + (sv.price || 0), 0) : 0;
//     return sum + paid;
//   }, 0);

//   /* ------------------------------ Render ------------------------------ */
//   return (
//     <AccessWrapper>
//       <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-6 relative overflow-hidden">
//         {/* Animated Background Elements */}
//         <div className="absolute inset-0 overflow-hidden pointer-events-none">
//           <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl animate-pulse"></div>
//           <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
//           <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-blue-300/10 to-purple-300/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '4s'}}></div>
//         </div>
        
//         <div className="max-w-7xl mx-auto dark:text-white relative z-10">
//           {/* Header */}
//           <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 p-8 mb-8 shadow-2xl animate-fade-in">
//             <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20"></div>
//             <div className="absolute top-4 right-4 w-32 h-32 bg-white/10 rounded-full animate-float"></div>
//             <div className="absolute bottom-4 left-4 w-24 h-24 bg-white/10 rounded-full animate-bounce-subtle"></div>
            
//             <div className="relative flex items-center gap-4">
//               <div className="p-4 rounded-2xl bg-white/20 backdrop-blur-sm shadow-lg animate-pulse-slow">
//                 <DollarSign className="w-8 h-8 text-white" />
//               </div>
//               <div>
//                 <h1 className="text-4xl font-bold text-white mb-2">Sales Report</h1>
//                 <p className="text-white/80 text-lg">Comprehensive sales analytics and revenue insights</p>
//               </div>
//               <div className="ml-auto flex items-center gap-3">
//                 <div className="p-3 rounded-xl bg-white/10 backdrop-blur-sm animate-float-delay">
//                   <TrendingUp className="w-6 h-6 text-white" />
//                 </div>
//                 <div className="p-3 rounded-xl bg-white/10 backdrop-blur-sm animate-bounce-gentle">
//                   <BarChart3 className="w-6 h-6 text-white" />
//                 </div>
//               </div>
//             </div>
//           </div>

//           {/* Filters */}
//           <div className="relative overflow-hidden rounded-2xl bg-white/70 backdrop-blur-lg shadow-xl border border-white/20 p-8 mb-8 animate-fade-in">
//             <div className="absolute inset-0 bg-gradient-to-r from-blue-50/50 via-purple-50/50 to-pink-50/50"></div>
//             <div className="absolute top-4 right-4 w-20 h-20 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full animate-float"></div>
            
//             <div className="relative">
//               <div className="flex items-center gap-3 mb-6">
//                 <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg">
//                   <Filter className="w-5 h-5 text-white" />
//                 </div>
//                 <h2 className="text-xl font-semibold text-gray-800">Advanced Filters</h2>
//               </div>

//               <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
//                 <div className="relative group">
//                   <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-blue-500 transition-colors" />
//                   <input
//                     type="text"
//                     placeholder="Search bookings..."
//                     value={search}
//                     onChange={(e) => setSearch(e.target.value)}
//                     className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl bg-white/80 backdrop-blur-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 hover:shadow-md"
//                   />
//                 </div>

//                 <div className="relative group">
//                   <div className="flex items-center gap-3 p-3 border border-gray-200 rounded-xl bg-white/80 backdrop-blur-sm focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent transition-all duration-300 hover:shadow-md">
//                     <CalendarIcon className="w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
//                     <input 
//                       type="date" 
//                       value={startDate} 
//                       onChange={(e) => setStartDate(e.target.value)} 
//                       className="flex-1 bg-transparent outline-none text-gray-700" 
//                     />
//                     <span className="text-gray-400 text-sm">to</span>
//                     <input 
//                       type="date" 
//                       value={endDate} 
//                       onChange={(e) => setEndDate(e.target.value)} 
//                       className="flex-1 bg-transparent outline-none text-gray-700" 
//                     />
//                   </div>
//                 </div>

//                 <div className="relative">
//                   <select 
//                     className="w-full appearance-none px-4 py-3 border border-gray-200 rounded-xl bg-white/80 backdrop-blur-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 hover:shadow-md cursor-pointer" 
//                     value={branchFilter} 
//                     onChange={(e) => setBranchFilter(e.target.value)}
//                   >
//                     <option value="">All Branches</option>
//                     {BRANCH_OPTIONS.map((b) => <option key={b}>{b}</option>)}
//                   </select>
//                   <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
//                     <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-400"></div>
//                   </div>
//                 </div>
//               </div>

//               <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
//                 <div className="relative">
//                   <Users className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
//                   <select 
//                     className="w-full appearance-none pl-10 pr-8 py-3 border border-gray-200 rounded-xl bg-white/80 backdrop-blur-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 hover:shadow-md cursor-pointer text-sm" 
//                     value={staffFilter} 
//                     onChange={(e) => setStaffFilter(e.target.value)}
//                   >
//                     <option value="">All Staff</option>
//                     {staffOptions.map((s) => <option key={s}>{s}</option>)}
//                   </select>
//                   <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
//                     <div className="w-0 h-0 border-l-3 border-r-3 border-t-3 border-l-transparent border-r-transparent border-t-gray-400"></div>
//                   </div>
//                 </div>

//                 <select 
//                   className="w-full appearance-none px-4 py-3 border border-gray-200 rounded-xl bg-white/80 backdrop-blur-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 hover:shadow-md cursor-pointer text-sm" 
//                   value={serviceFilter} 
//                   onChange={(e) => setServiceFilter(e.target.value)}
//                 >
//                   <option value="">All Services</option>
//                   {serviceOptions.map((s) => <option key={s}>{s}</option>)}
//                 </select>

//                 <select 
//                   className="w-full appearance-none px-4 py-3 border border-gray-200 rounded-xl bg-white/80 backdrop-blur-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 hover:shadow-md cursor-pointer text-sm" 
//                   value={categoryFilter} 
//                   onChange={(e) => setCategoryFilter(e.target.value)}
//                 >
//                   <option value="">All Categories</option>
//                   {categoryOptions.map((c) => <option key={c}>{c}</option>)}
//                 </select>

//                 <div className="relative">
//                   <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
//                   <select 
//                     className="w-full appearance-none pl-10 pr-8 py-3 border border-gray-200 rounded-xl bg-white/80 backdrop-blur-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 hover:shadow-md cursor-pointer text-sm" 
//                     value={paymentFilter} 
//                     onChange={(e) => setPaymentFilter(e.target.value)}
//                   >
//                     <option value="">All Payments</option>
//                     {PAYMENT_OPTIONS.map((p) => <option key={p}>{p}</option>)}
//                   </select>
//                   <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
//                     <div className="w-0 h-0 border-l-3 border-r-3 border-t-3 border-l-transparent border-r-transparent border-t-gray-400"></div>
//                   </div>
//                 </div>

//                 <select 
//                   className="w-full appearance-none px-4 py-3 border border-gray-200 rounded-xl bg-white/80 backdrop-blur-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 hover:shadow-md cursor-pointer text-sm" 
//                   value={statusFilter} 
//                   onChange={(e) => setStatusFilter(e.target.value)}
//                 >
//                   <option value="">All Status</option>
//                   {STATUS_OPTIONS.map((s) => <option key={s}>{s}</option>)}
//                 </select>

//                 <select 
//                   className="w-full appearance-none px-4 py-3 border border-gray-200 rounded-xl bg-white/80 backdrop-blur-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 hover:shadow-md cursor-pointer text-sm" 
//                   value={perPage} 
//                   onChange={(e) => { setPerPage(Number(e.target.value)); setPage(1); }}
//                 >
//                   {[10, 20, 50,10000].map((n) => <option key={n} value={n}>{n} per page</option>)}
//                 </select>
//               </div>
//             </div>
//           </div>

//           {/* Stats */}
//           <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
//             <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-700 p-6 shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 animate-fade-in">
//               <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent"></div>
//               <div className="absolute top-4 right-4 w-16 h-16 bg-white/10 rounded-full animate-pulse-slow"></div>
              
//               <div className="relative">
//                 <div className="flex items-center justify-between mb-4">
//                   <div className="p-3 rounded-xl bg-white/20 backdrop-blur-sm group-hover:scale-110 transition-transform duration-300">
//                     <BarChart3 className="w-6 h-6 text-white" />
//                   </div>
//                   <div className="text-white/60 text-sm font-medium">Total</div>
//                 </div>
//                 <p className="text-white/80 text-sm font-medium mb-2">Total Bookings</p>
//                 <p className="text-3xl font-bold text-white group-hover:scale-105 transition-transform duration-300">{filteredBookings.length}</p>
//               </div>
//             </div>

//             <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 via-green-600 to-teal-700 p-6 shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 animate-fade-in animate-delay-200">
//               <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent"></div>
//               <div className="absolute top-4 right-4 w-16 h-16 bg-white/10 rounded-full animate-float"></div>
              
//               <div className="relative">
//                 <div className="flex items-center justify-between mb-4">
//                   <div className="p-3 rounded-xl bg-white/20 backdrop-blur-sm group-hover:scale-110 transition-transform duration-300">
//                     <TrendingUp className="w-6 h-6 text-white" />
//                   </div>
//                   <div className="text-white/60 text-sm font-medium">Revenue</div>
//                 </div>
//                 <p className="text-white/80 text-sm font-medium mb-2">Total Revenue</p>
//                 <p className="text-3xl font-bold text-white group-hover:scale-105 transition-transform duration-300">AED {totalRevenue.toLocaleString()}</p>
//               </div>
//             </div>

//             <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-500 via-violet-600 to-indigo-700 p-6 shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 animate-fade-in animate-delay-400">
//               <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent"></div>
//               <div className="absolute top-4 right-4 w-16 h-16 bg-white/10 rounded-full animate-bounce-subtle"></div>
              
//               <div className="relative">
//                 <div className="flex items-center justify-between mb-4">
//                   <div className="p-3 rounded-xl bg-white/20 backdrop-blur-sm group-hover:scale-110 transition-transform duration-300">
//                     <CreditCard className="w-6 h-6 text-white" />
//                   </div>
//                   <div className="text-white/60 text-sm font-medium">Payments</div>
//                 </div>
//                 <p className="text-white/80 text-sm font-medium mb-2">Selected Payment Total</p>
//                 <p className="text-3xl font-bold text-white group-hover:scale-105 transition-transform duration-300">AED {selectedPaymentTotal.toLocaleString()}</p>
//               </div>
//             </div>
//           </div>

//           {/* Table */}
//           <div className="relative overflow-hidden rounded-2xl bg-white/80 backdrop-blur-lg shadow-2xl border border-white/20 animate-fade-in">
//             <div className="absolute inset-0 bg-gradient-to-r from-blue-50/30 via-purple-50/30 to-pink-50/30"></div>
            
//             <div className="relative overflow-x-auto">
//               <table className="min-w-full text-sm">
//                 <thead className="bg-gradient-to-r from-slate-800 via-gray-900 to-slate-800 text-white text-xs uppercase sticky top-0 shadow-lg">
//                   <tr>
//                     {['Booking ID','Date','Time','Customer','Staff','Branch','Services','Category','Payment','Card/Auth','Status','Service Fees','Discount','Tip','Total','Adjusted','Payable','Paid','Due'].map((h, index) => (
//                       <th key={h} className="px-6 py-4 text-left font-semibold tracking-wider border-r border-gray-700 last:border-r-0 hover:bg-white/10 transition-colors duration-200">
//                         {h}
//                       </th>
//                     ))}
//                   </tr>
//                 </thead>
//                 <tbody className="divide-y divide-gray-100">
//                   {paginatedBookings.map((b, index) => {
//                     const serviceFees = b.services.reduce((s, sv) => s + (sv.price || 0), 0);
//                     const discount = b.services.reduce((s, sv) => s + (sv.discountAmount || 0), 0);
//                     const tip = b.services.reduce((s, sv) => s + (sv.tipAmount || 0), 0);
//                     const total = serviceFees - discount + tip;
//                     const adjusted = 0;
//                     const payable = total - discount;
//                     const paid = b.paymentMethod ? total : 0;
//                     const due = payable - paid;

//                     return (
//                       <tr key={b.id} className={`group hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-purple-50/50 transition-all duration-300 hover:shadow-md ${index % 2 === 0 ? 'bg-white/50' : 'bg-gray-50/50'}`}>
//                         <td className="px-6 py-4 font-medium text-gray-900 group-hover:text-blue-700 transition-colors">{b.id}</td>
//                         <td className="px-6 py-4 text-gray-700">{format(b.bookingDate, 'MMM dd, yyyy')}</td>
//                         <td className="px-6 py-4 text-gray-700">{b.bookingTime}</td>
//                         <td className="px-6 py-4 font-medium text-gray-900">{b.customerName}</td>
//                         <td className="px-6 py-4 text-gray-700">{b.staff || '—'}</td>
//                         <td className="px-6 py-4 text-gray-700">{b.branch || '—'}</td>
//                         <td className="px-6 py-4 text-gray-700 max-w-xs truncate" title={b.services.map((s) => s.serviceName).join(', ')}>{b.services.map((s) => s.serviceName).join(', ')}</td>
//                         <td className="px-6 py-4 text-gray-700">{b.services.map((s) => s.category).join(', ')}</td>
//                         <td className="px-6 py-4">
//                           <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
//                             b.paymentMethod === 'Cash' ? 'bg-green-100 text-green-800' :
//                             b.paymentMethod === 'Card' ? 'bg-blue-100 text-blue-800' :
//                             b.paymentMethod === 'Online' ? 'bg-purple-100 text-purple-800' :
//                             'bg-gray-100 text-gray-800'
//                           }`}>
//                             {b.paymentMethod || '—'}
//                           </span>
//                         </td>
//                         <td className="px-6 py-4 text-gray-700 font-mono text-xs">{b.cardAuthCode || '—'}</td>
//                         <td className="px-6 py-4">
//                           <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
//                             b.status === 'Completed' ? 'bg-green-100 text-green-800' :
//                             b.status === 'Confirmed' ? 'bg-blue-100 text-blue-800' :
//                             b.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
//                             'bg-red-100 text-red-800'
//                           }`}>
//                             {b.status}
//                           </span>
//                         </td>
//                         <td className="px-6 py-4 font-semibold text-gray-900">AED {serviceFees.toLocaleString()}</td>
//                         <td className="px-6 py-4 text-red-600 font-medium">AED {discount.toLocaleString()}</td>
//                         <td className="px-6 py-4 text-green-600 font-medium">AED {tip.toLocaleString()}</td>
//                         <td className="px-6 py-4 font-bold text-gray-900">AED {total.toLocaleString()}</td>
//                         <td className="px-6 py-4 text-gray-700">AED {adjusted.toLocaleString()}</td>
//                         <td className="px-6 py-4 font-semibold text-blue-600">AED {payable.toLocaleString()}</td>
//                         <td className="px-6 py-4 font-semibold text-green-600">AED {paid.toLocaleString()}</td>
//                         <td className="px-6 py-4 font-semibold text-red-600">AED {due.toLocaleString()}</td>
//                       </tr>
//                     );
//                   })}
//                 </tbody>
//               </table>
//             </div>

//             {/* Pagination */}
//             <div className="relative bg-gradient-to-r from-gray-50 to-white border-t border-gray-200 px-6 py-4">
//               <div className="flex justify-between items-center">
//                 <div className="flex items-center gap-2">
//                   <div className="p-2 rounded-lg bg-blue-100">
//                     <BarChart3 className="w-4 h-4 text-blue-600" />
//                   </div>
//                   <p className="text-sm font-medium text-gray-700">
//                     Showing <span className="font-bold text-blue-600">{(page - 1) * perPage + 1}–{Math.min(page * perPage, filteredBookings.length)}</span> of <span className="font-bold text-gray-900">{filteredBookings.length}</span> results
//                   </p>
//                 </div>
//                 <div className="flex items-center gap-3">
//                   <button 
//                     disabled={page === 1} 
//                     onClick={() => setPage((p) => p - 1)} 
//                     className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md"
//                   >
//                     <ChevronLeft className="w-4 h-4" />
//                     Previous
//                   </button>
//                   <div className="flex items-center gap-1">
//                     <span className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium">{page}</span>
//                     <span className="text-gray-400 text-sm">of</span>
//                     <span className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium">{totalPages}</span>
//                   </div>
//                   <button 
//                     disabled={page === totalPages} 
//                     onClick={() => setPage((p) => p + 1)} 
//                     className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md"
//                   >
//                     Next
//                     <ChevronRight className="w-4 h-4" />
//                   </button>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>
      
//       <style jsx>{`
//         @keyframes fade-in {
//           from { opacity: 0; transform: translateY(20px); }
//           to { opacity: 1; transform: translateY(0); }
//         }
        
//         @keyframes slide-down {
//           from { opacity: 0; transform: translateY(-30px); }
//           to { opacity: 1; transform: translateY(0); }
//         }
        
//         @keyframes bounce-subtle {
//           0%, 100% { transform: translateY(0); }
//           50% { transform: translateY(-5px); }
//         }
        
//         @keyframes float {
//           0%, 100% { transform: translateY(0px) rotate(0deg); }
//           50% { transform: translateY(-10px) rotate(5deg); }
//         }
        
//         @keyframes float-delay {
//           0%, 100% { transform: translateY(0px) rotate(0deg); }
//           50% { transform: translateY(-8px) rotate(-3deg); }
//         }
        
//         @keyframes bounce-gentle {
//           0%, 100% { transform: scale(1); }
//           50% { transform: scale(1.05); }
//         }
        
//         @keyframes pulse-slow {
//           0%, 100% { opacity: 1; }
//           50% { opacity: 0.8; }
//         }
        
//         .animate-fade-in {
//           animation: fade-in 0.6s ease-out;
//         }
        
//         .animate-slide-down {
//           animation: slide-down 0.8s ease-out;
//         }
        
//         .animate-bounce-subtle {
//           animation: bounce-subtle 3s ease-in-out infinite;
//         }
        
//         .animate-float {
//           animation: float 6s ease-in-out infinite;
//         }
        
//         .animate-float-delay {
//           animation: float-delay 6s ease-in-out infinite 2s;
//         }
        
//         .animate-bounce-gentle {
//           animation: bounce-gentle 4s ease-in-out infinite;
//         }
        
//         .animate-pulse-slow {
//           animation: pulse-slow 3s ease-in-out infinite;
//         }
//       `}</style>
//     </AccessWrapper>
//   );
// }









// pdf 


'use client';

import { useEffect, useMemo, useState } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from "jspdf-autotable";

import 'jspdf-autotable';
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












// inside your component:
const exportToExcel = () => {
  const data = filteredBookings.map(b => {
    const serviceFees = b.services.reduce((s, sv) => s + (sv.price || 0), 0);
    const discount = b.services.reduce((s, sv) => s + (sv.discountAmount || 0), 0);
    const tip = b.services.reduce((s, sv) => s + (sv.tipAmount || 0), 0);
    const total = serviceFees - discount + tip;
    return {
      'Booking ID': b.id,
      Date: format(b.bookingDate, 'MMM dd, yyyy'),
      Time: b.bookingTime,
      Customer: b.customerName,
      Staff: b.staff || '—',
      Branch: b.branch || '—',
      Services: b.services.map(s => s.serviceName).join(', '),
      Category: b.services.map(s => s.category).join(', '),
      Payment: b.paymentMethod,
      'Card/Auth': b.cardAuthCode || '—',
      Status: b.status,
      'Service Fees': serviceFees,
      Discount: discount,
      Tip: tip,
      Total: total
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Sales Report");
  XLSX.writeFile(workbook, "sales_report.xlsx");
};




const exportToPDF = () => {
  const doc = new jsPDF("landscape"); // Landscape mode for more width

  // Title
  doc.setFontSize(18);
  doc.text("Sales Report", 14, 15);

  // Date Range
  const dateRange =
    startDate && endDate
      ? `From: ${startDate} To: ${endDate}`
      : `Generated on: ${format(new Date(), "MMM dd, yyyy")}`;
  doc.setFontSize(11);
  doc.text(dateRange, 14, 22);

  const head = [['Booking ID','Date','Time','Customer','Staff','Branch','Services','Category','Payment','Card/Auth','Status','Service Fees','Discount','Tip','Total']];

  const body = filteredBookings.map(b => {
    const serviceFees = b.services.reduce((s, sv) => s + (sv.price || 0), 0);
    const discount = b.services.reduce((s, sv) => s + (sv.discountAmount || 0), 0);
    const tip = b.services.reduce((s, sv) => s + (sv.tipAmount || 0), 0);
    const total = serviceFees - discount + tip;
    return [
      b.id,
      format(b.bookingDate, 'MMM dd, yyyy'),
      b.bookingTime,
      b.customerName,
      b.staff || '—',
      b.branch || '—',
      b.services.map(s => s.serviceName).join(', '),
      b.services.map(s => s.category).join(', '),
      b.paymentMethod || '—',
      b.cardAuthCode || '—',
      b.status,
      serviceFees.toFixed(2),
      discount.toFixed(2),
      tip.toFixed(2),
      total.toFixed(2)
    ];
  });

  autoTable(doc, {
    head,
    body,
    startY: 30,
    theme: "grid",
    headStyles: { fillColor: [41, 128, 185], textColor: 255 },
    alternateRowStyles: { fillColor: [245, 245, 245] },
    styles: { fontSize: 8 },
    margin: { top: 30, left: 10, right: 10 },
    tableWidth: 'auto',
    columnStyles: {
      0: { cellWidth: 25 },  // Booking ID
      1: { cellWidth: 20 },  // Date
      2: { cellWidth: 15 },  // Time
      3: { cellWidth: 40 },  // Customer
      4: { cellWidth: 30 },  // Staff
      5: { cellWidth: 25 },  // Branch
      6: { cellWidth: 50 },  // Services
      7: { cellWidth: 30 },  // Category
      8: { cellWidth: 20 },  // Payment
      9: { cellWidth: 25 },  // Card/Auth
      10: { cellWidth: 20 }, // Status
      11: { cellWidth: 20 },
      12: { cellWidth: 20 },
      13: { cellWidth: 20 },
      14: { cellWidth: 25 },
    },
    didDrawPage: (data) => {
      // Add page number footer
      const pageCount = doc.getNumberOfPages();
      doc.setFontSize(10);
      doc.text(`Page ${doc.getCurrentPageInfo().pageNumber} of ${pageCount}`, doc.internal.pageSize.getWidth() - 20, doc.internal.pageSize.getHeight() - 10);
    }
  });

  // Footer with total revenue
  const totalRevenuePDF = filteredBookings.reduce((sum, b) => {
    const serviceFees = b.services.reduce((s, sv) => s + (sv.price || 0), 0);
    const discount = b.services.reduce((s, sv) => s + (sv.discountAmount || 0), 0);
    const tip = b.services.reduce((s, sv) => s + (sv.tipAmount || 0), 0);
    return sum + (serviceFees - discount + tip);
  }, 0);

  doc.setFontSize(12);
  doc.text(`Total Revenue: AED ${totalRevenuePDF.toFixed(2)}`, 14, doc.lastAutoTable.finalY + 10);

  doc.save("sales_report.pdf");
};








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
              <div className="flex gap-4 mb-4">
  <button
    onClick={exportToExcel}
    className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
  >
    Download Excel
  </button>
  <button
    onClick={exportToPDF}
    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
  >
    Download PDF
  </button>
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
                  {[10, 20, 50,10000].map((n) => <option key={n} value={n}>{n} per page</option>)}
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
















