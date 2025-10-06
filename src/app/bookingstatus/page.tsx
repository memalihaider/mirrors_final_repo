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
          <button onClick={() => setView('bookings')} className={`px-3 py-2 rounded ${view==='bookings' ? 'bg-pink-600 text-white' : 'bg-gray-100'}`}>Bookings</button>
   
        </div>
      </div>

      {/* ------------------ BOOKINGS VIEW (original merged) ------------------ */}
      {view === 'bookings' && (
        <div>
          {/* Search & filters */}
          <div className="bg-white rounded-lg p-4 mb-6 flex gap-4 items-center">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 pr-3 py-2 w-full border rounded" placeholder="Search by customer, branch, service..." />
            </div>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="border rounded px-3 py-2">
              <option value="all">All Status</option>
              <option value="upcoming">Upcoming</option>
              <option value="past">Past</option>
              <option value="cancelled">Cancelled</option>
            </select>
            {/* <button onClick={() => { setShowCreate(true); resetForm(); }} className="px-3 py-2 bg-emerald-600 text-white rounded">Add Booking</button> */}
          </div>

          {/* bookings table */}
          <div className="bg-white rounded-lg shadow overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left">Customer</th>
                  <th className="px-4 py-2 text-left">Services</th>
                  <th className="px-4 py-2 text-left">Date & Time</th>
                  <th className="px-4 py-2 text-left">Staff</th>
                  <th className="px-4 py-2 text-left">Branch</th>
                  <th className="px-4 py-2 text-left">Payment</th>
                  <th className="px-4 py-2 text-left">Status</th>
                  <th className="px-4 py-2 text-left">Actions</th>
                  <th className="px-4 py-2 text-left">Invoice</th>
                </tr>
              </thead>
              <tbody>
                {filteredBookings.map((b) => (
                  <tr key={b.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => openForEdit(b)}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-pink-100 flex items-center justify-center"><User className="w-5 h-5 text-pink-600"/></div>
                        <div>
                          <div className="font-medium">{b.customerName}</div>
                          <div className="text-xs text-gray-500">{b.customerEmail || 'No email'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {b.services.slice(0,2).map((s,i)=>(<div key={i}>{s.serviceName} {s.quantity>1 && `(x${s.quantity})`}</div>))}
                      {b.services.length>2 && <div className="text-xs text-gray-500">+{b.services.length-2} more</div>}
                    </td>
                    <td className="px-4 py-3">
                      <div>{format(b.bookingDate,'MMM dd, yyyy')}</div>
                      <div className="text-xs text-gray-500">{b.bookingTime}</div>
                    </td>
                    <td className="px-4 py-3">{b.staff || '—'}</td>
                    <td className="px-4 py-3">{b.branch}</td>
                    <td className="px-4 py-3">AED{b.totalPrice.toFixed(2)} <div className="text-xs text-gray-500">{b.paymentMethod}</div></td>
                    <td className="px-4 py-3"><span className="px-2 py-1 rounded-full bg-gray-100 text-xs">{b.status}</span></td>
                    <td className="px-4 py-3" onClick={(e)=>e.stopPropagation()}>
                     <div className="flex gap-2">
  {/* <button onClick={() => openForEdit(b)} title="Edit" className="text-emerald-700">
    <Edit3 className="w-4 h-4" />
  </button> */}

  {/* Ye icons ab har status pr show honge */}
  <button 
    onClick={() => updateBookingStatus(b.id, 'past')} 
    title="Mark as completed" 
    className="text-green-600"
  >
    <CheckCircle className="w-4 h-4" />
  </button>

  <button 
    onClick={() => updateBookingStatus(b.id, 'cancelled')} 
    title="Cancel" 
    className="text-red-600"
  >
    <XCircle className="w-4 h-4" />
  </button>

  <button 
    onClick={() => updateBookingStatus(b.id, 'upcoming')} 
    title="Upcoming" 
    className="text-blue-600"
  >
    <CircleArrowOutDownRight className="w-4 h-4" />
  </button>
</div>

                    </td>
                    <td className="px-4 py-3" onClick={(e)=>e.stopPropagation()}>
                      <button onClick={()=>generateInvoicePDF(b)} className="px-2 py-1 bg-pink-600 text-white rounded">Invoice</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredBookings.length===0 && <div className="text-center py-10 text-gray-500">No bookings found.</div>}

          {/* Create/Edit Modal (simplified) */}
          {showCreate && (
            <div className="fixed inset-0 bg-gray-700 bg-opacity-50 z-50 flex items-start justify-center overflow-y-auto">
              <div className="bg-white rounded-lg w-11/12 md:w-3/4 mt-10">
                <div className="flex justify-between items-center p-4 border-b">
                  <h3 className="font-semibold">{editingId ? 'Edit Booking' : 'Add Booking'}</h3>
                  <div className="flex gap-2">
                    {editingId && <button onClick={async()=>{ if(!confirm('Delete?')) return; setDeleting(true); try{ await deleteDoc(doc(db,'bookings',editingId)); setShowCreate(false); resetForm(); }catch(e){console.error(e); alert('Delete failed'); } finally{ setDeleting(false);} }} className="px-3 py-1 bg-red-600 text-white rounded">Delete</button>}
                    <button onClick={()=>{ setShowCreate(false); resetForm(); }} className="px-3 py-1">Close</button>
                  </div>
                </div>
                <div className="p-4 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="text-sm">Branch</label>
                      <select value={branch} onChange={e=>setBranch(e.target.value)} className="w-full border rounded p-2">
                        {BRANCH_OPTIONS.map(b=> <option key={b} value={b}>{b}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-sm">Staff</label>
                      <select value={''} onChange={()=>{}} className="w-full border rounded p-2"><option>—</option></select>
                    </div>
                    <div>
                      <label className="text-sm">Payment</label>
                      <select value={paymentMethod} onChange={e=>setPaymentMethod(e.target.value)} className="w-full border rounded p-2">{['cash','card'].map(p=> <option key={p} value={p}>{p}</option>)}</select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="text-sm">Service Date</label>
                      <input type="date" value={serviceDate} onChange={e=>setServiceDate(e.target.value)} className="w-full border rounded p-2" />
                    </div>
                    <div>
                      <label className="text-sm">Time</label>
                      <input type="time" value={serviceTime} onChange={e=>setServiceTime(e.target.value)} className="w-full border rounded p-2" />
                    </div>
                    <div>
                      <label className="text-sm">Customer Name</label>
                      <input value={customerName} onChange={e=>setCustomerName(e.target.value)} className="w-full border rounded p-2" />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2">
                    <button className="px-3 py-2 bg-gray-100 rounded" onClick={()=>{ setShowCreate(false); resetForm(); }}>Close</button>
                    <button className="px-3 py-2 bg-emerald-600 text-white rounded" onClick={async()=>{ /* minimal save */ alert('Use back-end saving as needed'); }}>Save</button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ------------------ FINANCE VIEW ------------------ */}
      

    </div>
    </AccessWrapper>
  );
}


