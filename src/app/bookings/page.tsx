'use client';

import { useState, useEffect, useMemo } from 'react';
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
  AlertCircle,
  Plus,
  Trash2,
  Edit3,
} from 'lucide-react';
import { format, isSameDay } from 'date-fns';

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
  services: BookingService[];
  bookingDate: Date;
  bookingTime: string; // "HH:mm"
  branch: string;
  staff: string | null; // name string
  totalPrice: number;
  totalDuration: number;
  status: BookingStatus;
  paymentMethod: string;
  emailConfirmation: boolean;
  smsConfirmation: boolean;
  createdAt: Date;
  updatedAt: Date;
  remarks?: string | null;
}

interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
}

/* --------------------------- Constants --------------------------- */

const BRANCH_OPTIONS = ['Al Bustan','Marina','TECOM','AL Muraqabat','IBN Batutta Mall'];
const CATEGORY_OPTIONS = ['Facial', 'Hair', 'Nails', 'Lashes', 'Massage'];
const PAYMENT_METHODS = ['cash', 'card'];

// Fallback staff list (used only if Firestore `staff` collection not available)
const STAFF_FALLBACK = ['Komal', 'Shameem', 'Do Thi Kim', 'Alishba'];

/* ------------------------- Helper functions ---------------------- */

const emptyService: BookingService = {
  serviceId: '',
  serviceName: '',
  category: '',
  duration: 30,
  price: 0,
  quantity: 1,
};

function calcTotals(services: BookingService[]) {
  const totalPrice = services.reduce(
    (sum, s) => sum + (Number(s.price) || 0) * (Number(s.quantity) || 0),
    0
  );
  const totalDuration = services.reduce(
    (sum, s) => sum + (Number(s.duration) || 0) * (Number(s.quantity) || 0),
    0
  );
  return { totalPrice, totalDuration };
}

function minutesToHHMM(mins: number) {
  const h = Math.floor(mins / 60)
    .toString()
    .padStart(2, '0');
  const m = (mins % 60).toString().padStart(2, '0');
  return `${h}:${m}`;
}

function toDisplayAMPM(hhmm: string) {
  const [hStr, m] = hhmm.split(':');
  let h = Number(hStr);
  const suffix = h >= 12 ? 'PM' : 'AM';
  if (h === 0) h = 12;
  if (h > 12) h = h - 12;
  return `${h}:${m} ${suffix}`;
}

function generateTimeSlots(
  start = 10 * 60, // 10:00
  end = 22 * 60, // 22:00 (10:00 PM)
  step = 30 // 30 mins
) {
  const slots: string[] = [];
  for (let t = start; t <= end; t += step) {
    slots.push(minutesToHHMM(t));
  }
  return slots;
}

// EXACT requirement: 10:00 AM → 10:00 PM (30-min steps)
const TIMESLOTS = generateTimeSlots();

/* =========================== Component =========================== */

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [users, setUsers] = useState<{ [key: string]: User }>({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Create/Edit modal
  const [showCreate, setShowCreate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // form state
  const [branch, setBranch] = useState(BRANCH_OPTIONS[0]);
  const [serviceDate, setServiceDate] = useState<string>(() =>
    format(new Date(), 'yyyy-MM-dd')
  );
  const [serviceTime, setServiceTime] = useState<string>('10:00'); // "HH:mm"
  const [customerName, setCustomerName] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<string>('cash');
  const [emailConfirmation, setEmailConfirmation] = useState(false);
  const [smsConfirmation, setSmsConfirmation] = useState(false);
  const [status, setStatus] = useState<BookingStatus>('upcoming');
  const [staff, setStaff] = useState<string>('');
  const [services, setServices] = useState<BookingService[]>([{ ...emptyService }]);
  const [remarks, setRemarks] = useState<string>('');

  // Schedule board controls
  const [scheduleDate, setScheduleDate] = useState<string>(() =>
    format(new Date(), 'yyyy-MM-dd')
  );
  const [scheduleBranch, setScheduleBranch] = useState<string>('all');

  // Dynamic staff fetched from Firestore
  const [staffFromDB, setStaffFromDB] = useState<string[]>([]);

  /* -------------------- Load Staff from Firebase -------------------- */
  useEffect(() => {
    // Will use `staff` collection: each doc should have { name: string, active?: boolean }
    const loadStaff = async () => {
      try {
        const snap = await getDocs(collection(db, 'staff'));
        const list: string[] = [];
        snap.forEach((d) => {
          const data = d.data() as any;
          if (data?.name) list.push(String(data.name));
        });
        // If no staff docs found, we fallback to your previous constants
        setStaffFromDB(list.length ? list : STAFF_FALLBACK);
      } catch {
        // Safe fallback
        setStaffFromDB(STAFF_FALLBACK);
      }
    };
    loadStaff();
  }, []);

  const STAFF_OPTIONS = staffFromDB; // used everywhere below

  /* -------------------- Load bookings (Realtime) -------------------- */
  useEffect(() => {
    const bookingsQuery = query(collection(db, 'bookings'), orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(bookingsQuery, (snapshot) => {
      const bookingsData = snapshot.docs.map((d) => {
        const data = d.data() as any;
        return {
          id: d.id,
          userId: data.userId || '',
          customerName: data.customerName || '',
          services: (data.services || []) as BookingService[],
          bookingDate: data.bookingDate?.toDate() || new Date(),
          bookingTime: data.bookingTime || '',
          branch: data.branch || '',
          staff: data.staff ?? null,
          totalPrice: data.totalPrice || 0,
          totalDuration: data.totalDuration || 0,
          status: (data.status as BookingStatus) || 'upcoming',
          paymentMethod: data.paymentMethod || 'cash',
          emailConfirmation: data.emailConfirmation || false,
          smsConfirmation: data.smsConfirmation || false,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          remarks: data.remarks ?? null,
        } as Booking;
      });
      setBookings(bookingsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  /* ------------------------- Load user details ------------------------- */
  useEffect(() => {
    const loadUsers = async () => {
      const usersQuery = query(collection(db, 'users'));
      const usersSnapshot = await getDocs(usersQuery);
      const usersData: { [key: string]: User } = {};

      usersSnapshot.docs.forEach((doc) => {
        const data = doc.data() as any;
        usersData[doc.id] = {
          id: doc.id,
          name: data.name || data.displayName || 'Unknown User',
          email: data.email || '',
          phone: data.phone || data.phoneNumber || '',
        };
      });

      setUsers(usersData);
    };

    loadUsers();
  }, []);

  /* --------------------------- Filtering logic -------------------------- */
  const filteredBookings = bookings.filter((booking) => {
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      booking.customerName.toLowerCase().includes(q) ||
      booking.branch.toLowerCase().includes(q) ||
      booking.services.some((s) => s.serviceName.toLowerCase().includes(q));

    const matchesStatus = statusFilter === 'all' || booking.status === (statusFilter as BookingStatus);

    return matchesSearch && matchesStatus;
  });

  /* --------------------------- Update helpers --------------------------- */
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

  const getStatusBadge = (s: string) => {
    switch (s) {
      case 'upcoming':
        return 'bg-blue-100 text-blue-800';
      case 'past':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusBlock = (s: BookingStatus) => {
    switch (s) {
      case 'upcoming':
        return 'bg-emerald-50 border-emerald-300 text-emerald-800';
      case 'past':
        return 'bg-gray-50 border-gray-300 text-gray-700';
      case 'cancelled':
        return 'bg-rose-50 border-rose-300 text-rose-800 line-through';
      default:
        return 'bg-slate-50 border-slate-300 text-slate-800';
    }
  };

  const getPaymentIcon = (method: string) => {
    switch (method.toLowerCase()) {
      case 'card':
      case 'credit':
      case 'debit':
        return <CreditCard className="w-4 h-4" />;
      default:
        return <CreditCard className="w-4 h-4" />;
    }
  };

  /* -------------------------- Create/Edit Handlers ------------------------- */

  const resetForm = () => {
    setBranch(BRANCH_OPTIONS[0]);
    setServiceDate(format(new Date(), 'yyyy-MM-dd'));
    setServiceTime('10:00');
    setCustomerName('');
    setPaymentMethod('cash');
    setEmailConfirmation(false);
    setSmsConfirmation(false);
    setStatus('upcoming');
    setStaff('');
    setServices([{ ...emptyService }]);
    setRemarks('');
    setEditingId(null);
  };

  const openForCreate = () => {
    resetForm();
    setShowCreate(true);
  };

  // Open modal to CREATE, but prefill staff+time from a grid cell
  const openForCreateFromCell = (prefillStaff: string, prefillTime: string) => {
    resetForm();
    setStaff(prefillStaff);
    setServiceTime(prefillTime);
    // Set serviceDate to scheduleDate (board date)
    setServiceDate(scheduleDate);
    setShowCreate(true);
  };

  const openForEdit = (b: Booking) => {
    setEditingId(b.id);
    setBranch(b.branch || BRANCH_OPTIONS[0]);
    setServiceDate(format(b.bookingDate, 'yyyy-MM-dd'));
    setServiceTime(b.bookingTime || '10:00');
    setCustomerName(b.customerName || '');
    setPaymentMethod(b.paymentMethod || 'cash');
    setEmailConfirmation(!!b.emailConfirmation);
    setSmsConfirmation(!!b.smsConfirmation);
    setStatus(b.status || 'upcoming');
    setStaff(b.staff || '');
    setServices(
      b.services && b.services.length > 0
        ? b.services.map((s) => ({
            serviceId: s.serviceId || '',
            serviceName: s.serviceName || '',
            category: s.category || '',
            duration: Number(s.duration) || 0,
            price: Number(s.price) || 0,
            quantity: Number(s.quantity) || 1,
          }))
        : [{ ...emptyService }]
    );
    setRemarks(b.remarks || '');
    setShowCreate(true);
  };

  const handleAddServiceRow = () => {
    setServices((prev) => [...prev, { ...emptyService }]);
  };

  const handleRemoveServiceRow = (index: number) => {
    setServices((prev) => prev.filter((_, i) => i !== index));
  };

  const handleServiceChange = (
    index: number,
    field: keyof BookingService,
    value: string | number
  ) => {
    setServices((prev) =>
      prev.map((s, i) => (i === index ? { ...s, [field]: value } : s))
    );
  };

  const formTotals = calcTotals(services);

  const validateForm = () => {
    if (!customerName.trim()) return 'Customer name is required';
    if (!serviceDate) return 'Service date is required';
    if (!serviceTime) return 'Service time is required';
    if (!branch) return 'Branch is required';
    if (!staff) return 'Staff is required';
    if (services.length === 0) return 'Add at least one service';
    const hasName = services.every((s) => s.serviceName.trim().length > 0);
    if (!hasName) return 'Each service must have a name';
    return null;
  };

  const saveBooking = async () => {
    const err = validateForm();
    if (err) {
      alert(err);
      return;
    }

    try {
      setSaving(true);

      const payload = {
        userId: '',
        customerName: customerName.trim(),
        services: services.map((s) => ({
          ...s,
          price: Number(s.price) || 0,
          duration: Number(s.duration) || 0,
          quantity: Number(s.quantity) || 0,
        })),
        bookingDate: Timestamp.fromDate(new Date(serviceDate + 'T00:00:00')),
        bookingTime: serviceTime, // "HH:mm"
        branch,
        staff: staff || null, // name string
        totalPrice: formTotals.totalPrice,
        totalDuration: formTotals.totalDuration,
        status,
        paymentMethod,
        emailConfirmation,
        smsConfirmation,
        updatedAt: serverTimestamp(),
        remarks: remarks || null,
      };

      if (editingId) {
        const ref = doc(db, 'bookings', editingId);
        await updateDoc(ref, payload);
      } else {
        await addDoc(collection(db, 'bookings'), {
          ...payload,
          createdAt: serverTimestamp(),
        });
      }

      setShowCreate(false);
      resetForm();
    } catch (e) {
      console.error('Error saving booking:', e);
      alert('Failed to save booking. Check console for details.');
    } finally {
      setSaving(false);
    }
  };

  const deleteBooking = async () => {
    if (!editingId) return;
    if (!confirm('Delete this booking? This action cannot be undone.')) return;

    try {
      setDeleting(true);
      await deleteDoc(doc(db, 'bookings', editingId));
      setShowCreate(false);
      resetForm();
    } catch (e) {
      console.error('Error deleting booking:', e);
      alert('Failed to delete booking.');
    } finally {
      setDeleting(false);
    }
  };

  /* ------------------------------ Schedule Board Data ------------------------------ */

  const bookingsForSchedule = useMemo(() => {
    const target = new Date(scheduleDate + 'T00:00:00');
    return bookings.filter((b) => {
      const sameDay = isSameDay(b.bookingDate, target);
      const branchOk = scheduleBranch === 'all' || b.branch === scheduleBranch;
      return sameDay && branchOk;
    });
  }, [bookings, scheduleDate, scheduleBranch]);

  // fast lookup: { 'HH:mm': { staffName: Booking[] } } but we need single cell show (first booking)
  const scheduleMatrix = useMemo(() => {
    const map: Record<string, Record<string, Booking[]>> = {};
    TIMESLOTS.forEach((t) => {
      map[t] = {};
      STAFF_OPTIONS.forEach((s) => (map[t][s] = []));
    });
    bookingsForSchedule.forEach((b) => {
      const t = b.bookingTime;
      const s = b.staff || '';
      if (t && s && map[t] && map[t][s] !== undefined) {
        map[t][s].push(b);
      }
    });
    return map;
  }, [bookingsForSchedule, STAFF_OPTIONS]);

  /* ------------------------------- Render ------------------------------ */

  if (loading) {
    return (
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600"></div>
            <span className="ml-3 text-pink-600">Loading bookings...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="max-w-6xl mx-auto dark:text-white">
        {/* Header */}
        <div className="mb-8 flex items-start sm:items-center justify-around gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Bookings Management
            </h1>
            <p className="text-gray-600 dark:text-white">
              Manage all customer bookings and appointments
            </p>
          </div>

          <button
            onClick={openForCreate}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 shadow"
          >
            <Plus className="w-3 h-3" />
            Add Schedule
          </button>
        </div>

        {/* Schedule Board Controls */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="flex items-center">
              <Calendar className="w-5 h-5 text-gray-500 mr-2" />
              <input
                type="date"
                value={scheduleDate}
                onChange={(e) => setScheduleDate(e.target.value)}
                className="w-full border rounded-md px-3 py-2"
              />
            </div>
            <div className="flex items-center">
              <MapPin className="w-5 h-5 text-gray-500 mr-2" />
              <select
                value={scheduleBranch}
                onChange={(e) => setScheduleBranch(e.target.value)}
                className="w-full border rounded-md px-3 py-2"
              >
                <option value="all">All Branches</option>
                {BRANCH_OPTIONS.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>
          
          </div>
        </div>

 <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search by customer name, branch, or service..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="md:w-48">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full bg-black text-white px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="upcoming">Upcoming</option>
                <option value="past">Past</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Bookings</p>
                <p className="text-2xl font-bold text-gray-900">{bookings.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Upcoming</p>
                <p className="text-2xl font-bold text-gray-900">
                  {bookings.filter((b) => b.status === 'upcoming').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <AlertCircle className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Past</p>
                <p className="text-2xl font-bold text-gray-900">
                  {bookings.filter((b) => b.status === 'past').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <XCircle className="w-6 h-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Cancelled</p>
                <p className="text-2xl font-bold text-gray-900">
                  {bookings.filter((b) => b.status === 'cancelled').length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ======================== SCHEDULE BOARD (NEW ORIENTATION) ======================== */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-x-auto mb-10">
          {/* Grid: first column is time (sticky left), first row is header with staff (sticky top) */}
          <div
            className="min-w-[900px] relative"
            style={{}}
          >
            {/* Header Row: top-left cell + staff names */}
            <div
              className="grid sticky top-0 z-20"
              style={{ gridTemplateColumns: `180px repeat(${STAFF_OPTIONS.length}, 200px)` }}
            >
              <div className="bg-gray-100 border-b px-4 py-3 font-semibold sticky left-0 z-30">
                Time
              </div>
              {STAFF_OPTIONS.map((sName) => (
                <div
                  key={sName}
                  className="bg-gray-100 border-b px-4 py-3 font-semibold text-center"
                >
                  {sName}
                </div>
              ))}
            </div>

            {/* Body: rows for each timeslot */}
            <div className="">
              {TIMESLOTS.map((t) => (
                <div
                  key={t}
                  className="grid"
                  style={{ gridTemplateColumns: `180px repeat(${STAFF_OPTIONS.length}, 200px)` }}
                >
                  {/* Left Time Cell (sticky) */}
                  <div className="sticky left-0 z-10 bg-gray-50 border-t border-b px-4 py-3 font-medium">
                    {toDisplayAMPM(t)}
                  </div>

                  {/* Cells for each staff at this time */}
                  {STAFF_OPTIONS.map((sName) => {
                    const items = scheduleMatrix[t]?.[sName] || [];
                    // We show stacked bookings, each clickable
                    return (
                      <div
                        key={`${t}-${sName}`}
                        className="border-t border-b border-l px-2 py-2 min-h-[64px]"
                        onClick={(e) => {
                          // If clicking on empty cell, open create with prefilled staff & time
                          if (items.length === 0) {
                            openForCreateFromCell(sName, t);
                          }
                        }}
                      >
                        <div className="space-y-2">
                          {items.map((b) => (
                            <button
                              key={b.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                openForEdit(b);
                              }}
                              className={`w-full text-left text-xs rounded-md border px-2 py-2 hover:shadow transition ${getStatusBlock(
                                b.status
                              )}`}
                              title={`${b.customerName} @ ${b.bookingTime}`}
                            >
                              <div className="font-semibold truncate">{b.customerName}</div>
                              <div className="truncate">
                                {b.services.map((s) => s.serviceName).join(', ')}
                              </div>
                              <div className="flex items-center text-[11px] opacity-80 mt-1">
                                <Clock className="w-3 h-3 mr-1" />
                                {toDisplayAMPM(b.bookingTime)} • {b.totalDuration}m
                              </div>
                            </button>
                          ))}

                          {/* Empty state hint */}
                          {items.length === 0 && (
                            <div className="w-full h-full flex items-center justify-center">
                              <button
                                className="text-[11px] text-emerald-700 hover:text-emerald-900 underline"
                                onClick={() => openForCreateFromCell(sName, t)}
                              >
                                Add here
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Filters and Search (List view) */}
       
        {/* Bookings Table (click row to edit) */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Services
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date & Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Staff
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Branch
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payment
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredBookings.map((booking) => {
                  const user = users[booking.userId];
                  return (
                    <tr
                      key={booking.id}
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => openForEdit(booking)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-pink-100 flex items-center justify-center">
                              <User className="h-5 w-5 text-pink-600" />
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {booking.customerName}
                            </div>
                            <div className="text-sm text-gray-500">
                              {user?.email || 'No email'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {booking.services.slice(0, 2).map((service, index) => (
                            <div key={index} className="mb-1">
                              {service.serviceName}{' '}
                              {service.quantity > 1 && `(x${service.quantity})`}
                            </div>
                          ))}
                          {booking.services.length > 2 && (
                            <div className="text-xs text-gray-500">
                              +{booking.services.length - 2} more
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-gray-900">
                          <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                          <div>
                            <div>{format(booking.bookingDate, 'MMM dd, yyyy')}</div>
                            <div className="text-xs text-gray-500 flex items-center mt-1">
                              <Clock className="w-3 h-3 mr-1" />
                              {toDisplayAMPM(booking.bookingTime)}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {booking.staff || '—'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-gray-900">
                          <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                          {booking.branch}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          <div className="flex items-center">
                            {getPaymentIcon(booking.paymentMethod)}
                            <span className="ml-2">${booking.totalPrice.toFixed(2)}</span>
                          </div>
                          <div className="text-xs text-gray-500 capitalize">
                            {booking.paymentMethod}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full capitalize ${getStatusBadge(
                            booking.status
                          )}`}
                        >
                          {booking.status}
                        </span>
                      </td>
                      <td
                        className="px-6 py-4 whitespace-nowrap text-sm font-medium"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex space-x-2">
                          <button
                            onClick={() => openForEdit(booking)}
                            className="text-emerald-700 hover:text-emerald-900"
                            title="Edit booking"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          {booking.status === 'upcoming' && (
                            <>
                              <button
                                onClick={() => updateBookingStatus(booking.id, 'past')}
                                className="text-green-600 hover:text-green-900"
                                title="Mark as completed"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => updateBookingStatus(booking.id, 'cancelled')}
                                className="text-red-600 hover:text-red-900"
                                title="Cancel booking"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {filteredBookings.length === 0 && (
            <div className="text-center py-12">
              <Calendar className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No bookings found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm || statusFilter !== 'all'
                  ? 'Try adjusting your search or filter criteria.'
                  : 'No bookings have been made yet.'}
              </p>
            </div>
          )}
        </div>

        {/* ===================== CREATE / EDIT MODAL (PURE TAILWIND) ===================== */}
        {showCreate && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 z-50 overflow-y-auto h-full w-full">
            <div className="relative top-10 mx-auto w-11/12 md:w-4/5 lg:w-3/4 xl:w-2/3">
              <div className="bg-white rounded-lg shadow-xl border">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b">
                  <h3 className="text-lg font-semibold">
                    {editingId ? 'Edit Schedule' : 'Add Schedule'}
                  </h3>
                  <div className="flex items-center gap-2">
                    {editingId && (
                      <button
                        onClick={deleteBooking}
                        disabled={deleting}
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-white bg-red-600 hover:bg-red-700 disabled:opacity-60"
                        title="Delete booking"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setShowCreate(false);
                        resetForm();
                      }}
                      className="text-gray-400 hover:text-gray-600"
                      title="Close"
                    >
                      <XCircle className="w-6 h-6" />
                    </button>
                  </div>
                </div>

                {/* Body */}
                <div className="p-6 space-y-6">
                  {/* Top selects */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Branch</label>
                      <select
                        className="mt-1 w-full border rounded-md px-3 py-2"
                        value={branch}
                        onChange={(e) => setBranch(e.target.value)}
                      >
                        {BRANCH_OPTIONS.map((b) => (
                          <option key={b} value={b}>
                            {b}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Category</label>
                      <select
                        className="mt-1 w-full border rounded-md px-3 py-2"
                        onChange={(e) => {
                          setServices((prev) =>
                            prev.map((s, i) => (i === 0 ? { ...s, category: e.target.value } : s))
                          );
                        }}
                      >
                        <option value="">Select One</option>
                        {CATEGORY_OPTIONS.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Staff</label>
                      <select
                        className="mt-1 w-full border rounded-md px-3 py-2"
                        value={staff}
                        onChange={(e) => setStaff(e.target.value)}
                      >
                        <option value="">Select One</option>
                        {STAFF_OPTIONS.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Payment Method
                      </label>
                      <select
                        className="mt-1 w-full border rounded-md px-3 py-2"
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                      >
                        {PAYMENT_METHODS.map((p) => (
                          <option key={p} value={p}>
                            {p.toUpperCase()}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Date & Time */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Service Date
                      </label>
                      <input
                        type="date"
                        className="mt-1 w-full border rounded-md px-3 py-2"
                        value={serviceDate}
                        onChange={(e) => setServiceDate(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Time Slot</label>
                      <select
                        className="mt-1 w-full border rounded-md px-3 py-2"
                        value={serviceTime}
                        onChange={(e) => setServiceTime(e.target.value)}
                      >
                        {TIMESLOTS.map((slot) => (
                          <option key={slot} value={slot}>
                            {toDisplayAMPM(slot)}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Customer</label>
                      <input
                        type="text"
                        placeholder="Customer name"
                        className="mt-1 w-full border rounded-md px-3 py-2"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Services table */}
                  <div className="border rounded-lg">
                    <div className="grid grid-cols-12 gap-2 px-4 py-3 bg-gray-50 text-xs font-semibold">
                      <div className="col-span-4">Service</div>
                      <div className="col-span-2">Category</div>
                      <div className="col-span-2">Duration (min)</div>
                      <div className="col-span-2">Price</div>
                      <div className="col-span-1">Qty</div>
                      <div className="col-span-1 text-right">—</div>
                    </div>

                    {services.map((s, idx) => (
                      <div key={idx} className="grid grid-cols-12 gap-2 px-4 py-3 border-t">
                        <div className="col-span-4">
                          <input
                            className="w-full border rounded-md px-3 py-2"
                            placeholder="Service name"
                            value={s.serviceName}
                            onChange={(e) => handleServiceChange(idx, 'serviceName', e.target.value)}
                          />
                        </div>
                        <div className="col-span-2">
                          <select
                            className="w-full border rounded-md px-3 py-2"
                            value={s.category}
                            onChange={(e) => handleServiceChange(idx, 'category', e.target.value)}
                          >
                            <option value="">Select</option>
                            {CATEGORY_OPTIONS.map((c) => (
                              <option key={c} value={c}>
                                {c}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="col-span-2">
                          <input
                            type="number"
                            min={0}
                            className="w-full border rounded-md px-3 py-2"
                            value={s.duration}
                            onChange={(e) =>
                              handleServiceChange(idx, 'duration', Number(e.target.value || 0))
                            }
                          />
                        </div>
                        <div className="col-span-2">
                          <input
                            type="number"
                            min={0}
                            step="0.01"
                            className="w-full border rounded-md px-3 py-2"
                            value={s.price}
                            onChange={(e) =>
                              handleServiceChange(idx, 'price', Number(e.target.value || 0))
                            }
                          />
                        </div>
                        <div className="col-span-1">
                          <input
                            type="number"
                            min={1}
                            className="w-full border rounded-md px-3 py-2"
                            value={s.quantity}
                            onChange={(e) =>
                              handleServiceChange(idx, 'quantity', Number(e.target.value || 1))
                            }
                          />
                        </div>
                        <div className="col-span-1 flex justify-end items-center">
                          {services.length > 1 && (
                            <button
                              onClick={() => handleRemoveServiceRow(idx)}
                              className="p-2 rounded hover:bg-red-50 text-red-600"
                              title="Remove"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}

                    <div className="px-4 py-3 border-t flex justify-between items-center">
                      <button
                        onClick={handleAddServiceRow}
                        className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                      >
                        <Plus className="w-4 h-4" />
                        Add more service
                      </button>

                      <div className="text-sm text-gray-700">
                        <span className="mr-4">
                          <strong>Total Duration:</strong> {formTotals.totalDuration} min
                        </span>
                        <span>
                          <strong>Total Price:</strong> ${formTotals.totalPrice.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Remarks & toggles */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Remarks (optional)
                      </label>
                      <textarea
                        className="mt-1 w-full border rounded-md px-3 py-2 min-h-[80px]"
                        value={remarks}
                        onChange={(e) => setRemarks(e.target.value)}
                      />
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between border rounded-md px-3 py-2">
                        <span className="text-sm">Send booking notification by email</span>
                        <input
                          type="checkbox"
                          checked={emailConfirmation}
                          onChange={(e) => setEmailConfirmation(e.target.checked)}
                        />
                      </div>
                      <div className="flex items-center justify-between border rounded-md px-3 py-2">
                        <span className="text-sm">Send booking notification by SMS</span>
                        <input
                          type="checkbox"
                          checked={smsConfirmation}
                          onChange={(e) => setSmsConfirmation(e.target.checked)}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Application Status
                        </label>
                        <select
                          className="mt-1 w-full border rounded-md px-3 py-2"
                          value={status}
                          onChange={(e) => setStatus(e.target.value as BookingStatus)}
                        >
                          <option value="upcoming">Approved (Upcoming)</option>
                          <option value="past">Completed (Past)</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t flex justify-end gap-3">
                  <button
                    onClick={() => {
                      setShowCreate(false);
                      resetForm();
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                    disabled={saving || deleting}
                  >
                    Close
                  </button>
                  <button
                    onClick={saveBooking}
                    className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-md hover:bg-emerald-700 disabled:opacity-60"
                    disabled={saving || deleting}
                  >
                    {saving ? (editingId ? 'Updating...' : 'Saving...') : editingId ? 'Update' : 'Save'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        {/* =================== END CREATE / EDIT MODAL =================== */}
      </div>
    </div>
  );
}






