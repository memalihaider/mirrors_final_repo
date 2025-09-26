'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import AccessWrapper from '@/components/AccessWrapper';
import {
  Users,
  UserPlus,
  Phone,
  Building2,
  LogIn,
  LogOut,
  CheckCircle,
  XCircle,
  Edit3,
  Trash2,
  Search,
  Calendar,
  Clock,
  Mail,
  UserCheck,
  UserX,
  TrendingUp,
  Filter,
} from 'lucide-react';
import { format, startOfDay, endOfDay } from 'date-fns';
import { motion } from 'framer-motion';

/* ----------------------------- Types ----------------------------- */

type AttendanceStatus = 'present' | 'absent';

interface StaffDoc {
  id: string;
  name: string;
  phone?: string;
  branch?: string;
  email?: string;
  dateOfBirth?: string;
  active: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

interface AttendanceDoc {
  id: string;
  staffId: string;
  day: string;
  status: AttendanceStatus;
  checkIn?: string | null;
  checkOut?: string | null;
  notes?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

interface BookingServiceLite {
  serviceName: string;
}

interface BookingDocLite {
  id: string;
  customerName: string;
  services: BookingServiceLite[];
  bookingDate: Date;
  bookingTime: string;
  branch?: string;
  staffId?: string;
  staff?: string | null;
}

/* --------------------------- Constants --------------------------- */

const BRANCH_OPTIONS = ['Al Bustan', 'Marina', 'TECOM', 'AL Muraqabat', 'IBN Battuta Mall'];

/* ========================= Component ========================= */

export default function StaffManagementPage() {
  const [staff, setStaff] = useState<StaffDoc[]>([]);
  const [search, setSearch] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('');
  const [selectedDay, setSelectedDay] = useState<string>(() => format(new Date(), 'yyyy-MM-dd'));
  const [attendance, setAttendance] = useState<Record<string, AttendanceDoc>>({});
  const [bookingsToday, setBookingsToday] = useState<BookingDocLite[]>([]);
  const [openModal, setOpenModal] = useState(false);
  const [editingStaffId, setEditingStaffId] = useState<string | null>(null);
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formBranch, setFormBranch] = useState('');
  const [formActive, setFormActive] = useState(true);
  const [formEmail, setFormEmail] = useState('');
  const [formDOB, setFormDOB] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  /* -------------------- Realtime: Staff list -------------------- */
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'staff'), (snap) => {
      const list: StaffDoc[] = snap.docs.map((d) => {
        const data = d.data() as any;
        return {
          id: d.id,
          name: data.name || '',
          phone: data.phone || '',
          branch: data.branch || '',
          email: data.email || '',
          dateOfBirth: data.dateOfBirth || '',
          active: data.active !== false,
          createdAt: data.createdAt?.toDate?.() || undefined,
          updatedAt: data.updatedAt?.toDate?.() || undefined,
        };
      });
      list.sort((a, b) => a.name.localeCompare(b.name));
      setStaff(list);
    });
    return () => unsub();
  }, []);

  /* ------------- Realtime: Attendance for selected day ---------- */
  useEffect(() => {
    const day = selectedDay;
    const q = query(collection(db, 'attendance'), where('day', '==', day));
    const unsub = onSnapshot(q, (snap) => {
      const map: Record<string, AttendanceDoc> = {};
      snap.forEach((d) => {
        const data = d.data() as any;
        map[String(data.staffId)] = {
          id: d.id,
          staffId: String(data.staffId),
          day: String(data.day),
          status: (data.status as AttendanceStatus) || 'present',
          checkIn: data.checkIn ?? null,
          checkOut: data.checkOut ?? null,
          notes: data.notes ?? null,
          createdAt: data.createdAt?.toDate?.() || undefined,
          updatedAt: data.updatedAt?.toDate?.() || undefined,
        };
      });
      setAttendance(map);
    });
    return () => unsub();
  }, [selectedDay]);

  /* ------------- Realtime: Today's bookings (for tasks) ---------- */
  useEffect(() => {
    const start = startOfDay(new Date(selectedDay + 'T00:00:00'));
    const end = endOfDay(new Date(selectedDay + 'T00:00:00'));
    const qBookings = query(
      collection(db, 'bookings'),
      where('bookingDate', '>=', Timestamp.fromDate(start)),
      where('bookingDate', '<=', Timestamp.fromDate(end))
    );
    const unsub = onSnapshot(qBookings, (snap) => {
      const list: BookingDocLite[] = snap.docs.map((d) => {
        const data = d.data() as any;
        return {
          id: d.id,
          customerName: data.customerName || '',
          services: (data.services || []).map((s: any) => ({ serviceName: s.serviceName || '' })),
          bookingDate: data.bookingDate?.toDate?.() || new Date(),
          bookingTime: data.bookingTime || '',
          branch: data.branch || '',
          staffId: data.staffId || undefined,
          staff: data.staff ?? null,
        };
      });
      setBookingsToday(list);
    });
    return () => unsub();
  }, [selectedDay]);

  /* -------------------- Filtering staff -------------------- */
  const staffFiltered = useMemo(() => {
    let list = staff;
    if (selectedBranch) list = list.filter((s) => s.branch === selectedBranch);
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          (s.branch || '').toLowerCase().includes(q) ||
          (s.phone || '').toLowerCase().includes(q) ||
          (s.email || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [search, staff, selectedBranch]);

  /* --------------------- Attendance Actions --------------------- */
  const ensureAttendanceDoc = async (staffId: string): Promise<string> => {
    const a = attendance[staffId];
    if (a) return a.id;
    const newDoc = await addDoc(collection(db, 'attendance'), {
      staffId,
      day: selectedDay,
      status: 'present',
      checkIn: null,
      checkOut: null,
      notes: null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return newDoc.id;
  };

  const nowHHMM = () => {
    const d = new Date();
    const h = String(d.getHours()).padStart(2, '0');
    const m = String(d.getMinutes()).padStart(2, '0');
    return `${h}:${m}`;
  };

  const markPresent = async (staffId: string) => {
    const id = attendance[staffId]?.id || (await ensureAttendanceDoc(staffId));
    await updateDoc(doc(db, 'attendance', id), { status: 'present', updatedAt: serverTimestamp() });
  };

  const markAbsent = async (staffId: string) => {
    const id = attendance[staffId]?.id || (await ensureAttendanceDoc(staffId));
    await updateDoc(doc(db, 'attendance', id), { status: 'absent', updatedAt: serverTimestamp() });
  };

  const setCheckIn = async (staffId: string) => {
    const id = attendance[staffId]?.id || (await ensureAttendanceDoc(staffId));
    await updateDoc(doc(db, 'attendance', id), { checkIn: nowHHMM(), updatedAt: serverTimestamp() });
  };

  const setCheckOut = async (staffId: string) => {
    const id = attendance[staffId]?.id || (await ensureAttendanceDoc(staffId));
    await updateDoc(doc(db, 'attendance', id), { checkOut: nowHHMM(), updatedAt: serverTimestamp() });
  };

  /* --------------------- Form Actions --------------------- */
  const resetForm = () => {
    setEditingStaffId(null);
    setFormName('');
    setFormPhone('');
    setFormBranch('');
    setFormActive(true);
    setFormEmail('');
    setFormDOB('');
  };

  const openCreate = () => {
    resetForm();
    setOpenModal(true);
  };

  const openEdit = (s: StaffDoc) => {
    setEditingStaffId(s.id);
    setFormName(s.name || '');
    setFormPhone(s.phone || '');
    setFormBranch(s.branch || '');
    setFormActive(s.active !== false);
    setFormEmail(s.email || '');
    setFormDOB(s.dateOfBirth || '');
    setOpenModal(true);
  };

  const saveStaff = async () => {
    if (!formName.trim()) return alert('Name is required');
    try {
      setSaving(true);
      const payload = {
        name: formName.trim(),
        phone: formPhone.trim() || null,
        branch: formBranch || null,
        active: !!formActive,
        email: formEmail.trim() || null,
        dateOfBirth: formDOB || null,
        updatedAt: serverTimestamp(),
      } as any;

      if (editingStaffId) await updateDoc(doc(db, 'staff', editingStaffId), payload);
      else await addDoc(collection(db, 'staff'), { ...payload, createdAt: serverTimestamp() });

      setOpenModal(false);
      resetForm();
    } catch (e) {
      console.error('Error saving staff', e);
      alert('Failed to save staff');
    } finally {
      setSaving(false);
    }
  };

  const removeStaff = async (id: string) => {
    if (!confirm('Delete this staff member?')) return;
    try {
      setDeleting(true);
      await deleteDoc(doc(db, 'staff', id));
    } catch (e) {
      console.error('Error deleting staff', e);
      alert('Failed to delete');
    } finally {
      setDeleting(false);
    }
  };

  /* ------------------------------ Render ------------------------------ */

  return (
    <AccessWrapper>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <div className="p-6">
          <div className="max-w-7xl mx-auto">
            {/* Enhanced Header */}
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mb-8"
            >
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8">
                <div className="flex items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-600 shadow-lg">
                      <Users className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                        Staff Management
                      </h1>
                      <p className="text-gray-600 mt-1 text-lg">
                        Daily attendance • Today's tasks • Realtime synced with Bookings
                      </p>
                    </div>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={openCreate}
                    className="inline-flex items-center gap-3 px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-700 hover:to-teal-700 shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    <UserPlus className="w-5 h-5" /> Add Staff
                  </motion.button>
                </div>
              </div>
            </motion.div>

            {/* Enhanced Search and Filters */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6 mb-8"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search staff by name, branch, phone, email..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent bg-white/50 backdrop-blur-sm transition-all duration-200"
                  />
                </div>
                <div className="relative">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="date"
                    value={selectedDay}
                    onChange={(e) => setSelectedDay(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent bg-white/50 backdrop-blur-sm"
                    title="Attendance day & Today's tasks date"
                  />
                </div>
                <div className="relative">
                  <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <select
                    className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent bg-white/50 backdrop-blur-sm appearance-none"
                    value={selectedBranch}
                    onChange={(e) => setSelectedBranch(e.target.value)}
                  >
                    <option value="">All Branches</option>
                    {BRANCH_OPTIONS.map((b) => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>
              </div>
            </motion.div>

            {/* Enhanced Statistics Cards */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
            >
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6 hover:shadow-xl transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">Total Staff</p>
                    <p className="text-3xl font-bold text-gray-900">{staff.length}</p>
                    <p className="text-xs text-gray-500 mt-1">Active: {staff.filter(s => s.active).length}</p>
                  </div>
                  <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>
              
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6 hover:shadow-xl transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">Present Today</p>
                    <p className="text-3xl font-bold text-emerald-600">{Object.values(attendance).filter(a => a.status === 'present').length}</p>
                    <p className="text-xs text-emerald-500 mt-1">On duty</p>
                  </div>
                  <div className="p-3 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl">
                    <UserCheck className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>
              
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6 hover:shadow-xl transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">Absent Today</p>
                    <p className="text-3xl font-bold text-amber-600">{Object.values(attendance).filter(a => a.status === 'absent').length}</p>
                    <p className="text-xs text-amber-500 mt-1">Not present</p>
                  </div>
                  <div className="p-3 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl">
                    <UserX className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>
              
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6 hover:shadow-xl transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">Tasks Today</p>
                    <p className="text-3xl font-bold text-purple-600">{bookingsToday.length}</p>
                    <p className="text-xs text-purple-500 mt-1">Bookings</p>
                  </div>
                  <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl">
                    <TrendingUp className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Enhanced Staff Table */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
                <h3 className="text-lg font-semibold text-gray-900">Staff Directory</h3>
                <p className="text-sm text-gray-600">Manage your team members and track attendance</p>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Staff Member</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Contact</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Branch</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Attendance</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Time Tracking</th>
                      <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white/50 divide-y divide-gray-200">
                    {staffFiltered.map((s, index) => {
                      const a = attendance[s.id];
                      const status = a?.status || '-';
                      return (
                        <motion.tr 
                          key={s.id} 
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.3, delay: index * 0.05 }}
                          className="hover:bg-white/80 transition-all duration-200"
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-12 w-12">
                                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center text-white font-semibold text-lg">
                                  {s.name.charAt(0).toUpperCase()}
                                </div>
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-semibold text-gray-900">{s.name}</div>
                                <div className="flex items-center mt-1">
                                  <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${s.active ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-600'}`}>
                                    {s.active ? 'Active' : 'Inactive'}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="space-y-1">
                              <div className="flex items-center text-sm text-gray-900">
                                <Mail className="w-4 h-4 mr-2 text-gray-400" />
                                {s.email || '—'}
                              </div>
                              <div className="flex items-center text-sm text-gray-900">
                                <Phone className="w-4 h-4 mr-2 text-gray-400" />
                                {s.phone || '—'}
                              </div>
                              {s.dateOfBirth && (
                                <div className="text-xs text-gray-500">
                                  DOB: {s.dateOfBirth}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center text-sm text-gray-900">
                              <Building2 className="w-4 h-4 mr-2 text-gray-400" />
                              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-lg text-xs font-medium">
                                {s.branch || '—'}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => markPresent(s.id)}
                                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all duration-200 ${
                                  status === 'present' 
                                    ? 'bg-emerald-500 text-white shadow-md' 
                                    : 'bg-gray-200 text-gray-600 hover:bg-emerald-100 hover:text-emerald-700'
                                }`}
                              >
                                Present
                              </motion.button>
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => markAbsent(s.id)}
                                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all duration-200 ${
                                  status === 'absent' 
                                    ? 'bg-amber-500 text-white shadow-md' 
                                    : 'bg-gray-200 text-gray-600 hover:bg-amber-100 hover:text-amber-700'
                                }`}
                              >
                                Absent
                              </motion.button>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => setCheckIn(s.id)}
                                className="flex items-center gap-1 px-3 py-1 rounded-lg bg-blue-500 text-white text-xs font-medium hover:bg-blue-600 transition-all duration-200"
                              >
                                <LogIn className="w-3 h-3" />
                                {a?.checkIn || 'Check In'}
                              </motion.button>
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => setCheckOut(s.id)}
                                className="flex items-center gap-1 px-3 py-1 rounded-lg bg-purple-500 text-white text-xs font-medium hover:bg-purple-600 transition-all duration-200"
                              >
                                <LogOut className="w-3 h-3" />
                                {a?.checkOut || 'Check Out'}
                              </motion.button>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <div className="flex items-center justify-center gap-2">
                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => openEdit(s)}
                                className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-all duration-200"
                                title="Edit staff member"
                              >
                                <Edit3 className="w-4 h-4" />
                              </motion.button>
                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => removeStaff(s.id)}
                                className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-all duration-200"
                                title="Delete staff member"
                              >
                                <Trash2 className="w-4 h-4" />
                              </motion.button>
                            </div>
                          </td>
                        </motion.tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              
              {staffFiltered.length === 0 && (
                <div className="text-center py-16">
                  <div className="mx-auto h-24 w-24 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center mb-4">
                    <Users className="h-12 w-12 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No staff found</h3>
                  <p className="text-gray-500 mb-6">Try adjusting your search or filters, or add new staff members.</p>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={openCreate}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-all duration-200"
                  >
                    <UserPlus className="w-4 h-4" /> Add First Staff Member
                  </motion.button>
                </div>
              )}
            </motion.div>

            {/* Enhanced Modal */}
            {openModal && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 overflow-y-auto h-full w-full flex items-center justify-center p-4"
              >
                <motion.div 
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  className="bg-white rounded-2xl shadow-2xl border border-white/20 w-full max-w-2xl"
                >
                  <div className="flex items-center justify-between px-8 py-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100 rounded-t-2xl">
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900">
                        {editingStaffId ? 'Edit Staff Member' : 'Add New Staff Member'}
                      </h3>
                      <p className="text-gray-600 mt-1">
                        {editingStaffId ? 'Update staff information' : 'Enter staff member details'}
                      </p>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => { setOpenModal(false); resetForm(); }}
                      className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all duration-200"
                      title="Close"
                    >
                      <XCircle className="w-6 h-6" />
                    </motion.button>
                  </div>

                  <div className="p-8 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name *</label>
                        <input
                          className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all duration-200"
                          value={formName}
                          onChange={(e) => setFormName(e.target.value)}
                          placeholder="e.g. Aimen Khan"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
                        <input
                          className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all duration-200"
                          type="email"
                          value={formEmail}
                          onChange={(e) => setFormEmail(e.target.value)}
                          placeholder="e.g. aimen@mirrorlounge.com"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Phone Number</label>
                        <input
                          className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all duration-200"
                          value={formPhone}
                          onChange={(e) => setFormPhone(e.target.value)}
                          placeholder="e.g. +971 50 123 4567"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Date of Birth</label>
                        <input
                          className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all duration-200"
                          type="date"
                          value={formDOB}
                          onChange={(e) => setFormDOB(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Branch Location</label>
                        <select
                          className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all duration-200"
                          value={formBranch}
                          onChange={(e) => setFormBranch(e.target.value)}
                        >
                          <option value="">Select Branch</option>
                          {BRANCH_OPTIONS.map((b) => (
                            <option key={b} value={b}>{b}</option>
                          ))}
                        </select>
                      </div>
                      <div className="flex items-center gap-3 pt-8">
                        <input 
                          id="active" 
                          type="checkbox" 
                          checked={formActive} 
                          onChange={(e) => setFormActive(e.target.checked)}
                          className="w-5 h-5 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                        />
                        <label htmlFor="active" className="text-sm font-semibold text-gray-700">
                          Active Staff Member
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="px-8 py-6 border-t border-gray-200 flex justify-end gap-4 bg-gray-50 rounded-b-2xl">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => { setOpenModal(false); resetForm(); }}
                      className="px-6 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-all duration-200"
                      disabled={saving || deleting}
                    >
                      Cancel
                    </motion.button>
                    {editingStaffId && (
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => editingStaffId && removeStaff(editingStaffId)}
                        className="px-6 py-3 text-sm font-medium text-white bg-red-600 rounded-xl hover:bg-red-700 disabled:opacity-60 transition-all duration-200"
                        disabled={saving || deleting}
                      >
                        {deleting ? 'Deleting...' : 'Delete'}
                      </motion.button>
                    )}
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={saveStaff}
                      className="px-6 py-3 text-sm font-medium text-white bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl hover:from-emerald-700 hover:to-teal-700 disabled:opacity-60 transition-all duration-200"
                      disabled={saving || deleting}
                    >
                      {saving ? (editingStaffId ? 'Updating...' : 'Saving...') : editingStaffId ? 'Update Staff' : 'Add Staff'}
                    </motion.button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </AccessWrapper>
  );
}
