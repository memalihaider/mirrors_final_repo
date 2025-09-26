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
import { motion } from 'framer-motion';
import {
  Users,
  UserPlus,
  Search,
  Building2,
  Phone,
  Calendar as CalendarIcon,
  Clock,
  CheckCircle,
  XCircle,
  Edit3,
  Trash2,
  LogIn,
  LogOut,
  ListChecks,
  TrendingUp,
  Star,
  Award,
} from 'lucide-react';
import {
  format,
  startOfDay,
  endOfDay,
  isSameDay,
  parse,
} from 'date-fns';

/* ----------------------------- Types ----------------------------- */

type AttendanceStatus = 'present' | 'absent';

interface StaffDoc {
  id: string;
  name: string;
  role?: string;
  phone?: string;
  branch?: string;
  active: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

interface AttendanceDoc {
  id: string;
  staffId: string;
  day: string; // 'yyyy-MM-dd'
  status: AttendanceStatus;
  checkIn?: string | null; // 'HH:mm'
  checkOut?: string | null; // 'HH:mm'
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
  bookingDate: Date; // Firestore Timestamp -> Date
  bookingTime: string; // 'HH:mm'
  branch?: string;
  staffId?: string; // new schema
  staff?: string | null; // legacy name
}

/* --------------------------- Constants --------------------------- */

const BRANCH_OPTIONS = ['Al Bustan', 'Marina', 'TECOM', 'AL Muraqabat', 'IBN Batutta Mall'];

/* --------------------------- Helpers ----------------------------- */

function nowHHMM() {
  const d = new Date();
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

function toDisplayAMPM(hhmm: string) {
  if (!hhmm) return '';
  const [hStr, m] = hhmm.split(':');
  let h = Number(hStr);
  const suffix = h >= 12 ? 'PM' : 'AM';
  if (h === 0) h = 12;
  if (h > 12) h = h - 12;
  return `${h}:${m} ${suffix}`;
}

/* ========================= Component ========================= */

export default function StaffManagementPage() {
  /* ---------------------------- State ---------------------------- */
  const [staff, setStaff] = useState<StaffDoc[]>([]);
  const [search, setSearch] = useState('');
  const [selectedDay, setSelectedDay] = useState<string>(() => format(new Date(), 'yyyy-MM-dd'));

  // Attendance for selected day -> quick map by staffId
  const [attendance, setAttendance] = useState<Record<string, AttendanceDoc>>({});

  // Today tasks (bookings) grouped by staffId
  const [bookingsToday, setBookingsToday] = useState<BookingDocLite[]>([]);

  // Modal state (Create/Edit Staff)
  const [openModal, setOpenModal] = useState(false);
  const [editingStaffId, setEditingStaffId] = useState<string | null>(null);
  const [formName, setFormName] = useState('');
  const [formRole, setFormRole] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formBranch, setFormBranch] = useState<string>('');
  const [formActive, setFormActive] = useState(true);
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
          role: data.role || '',
          phone: data.phone || '',
          branch: data.branch || '',
          active: data.active !== false,
          createdAt: data.createdAt?.toDate?.() || undefined,
          updatedAt: data.updatedAt?.toDate?.() || undefined,
        } as StaffDoc;
      });
      // Sort by name asc for predictable UI
      list.sort((a, b) => a.name.localeCompare(b.name));
      setStaff(list);
    });
    return () => unsub();
  }, []);

  /* ------------- Realtime: Attendance for selected day ---------- */
  useEffect(() => {
    const day = selectedDay; // 'yyyy-MM-dd'
    const q = query(collection(db, 'attendance'), where('day', '==', day));
    const unsub = onSnapshot(q, (snap) => {
      const map: Record<string, AttendanceDoc> = {};
      snap.forEach((d) => {
        const data = d.data() as any;
        const a: AttendanceDoc = {
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
        map[a.staffId] = a;
      });
      setAttendance(map);
    });
    return () => unsub();
  }, [selectedDay]);

  /* ------------- Realtime: Today's bookings (for tasks) ---------- */
  useEffect(() => {
    // Convert selectedDay to start/end
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
          staff: data.staff ?? null, // legacy name support
        } as BookingDocLite;
      });
      setBookingsToday(list);
    });
    return () => unsub();
  }, [selectedDay]);

  /* ----------------------------- Derived ----------------------------- */
  const staffFiltered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return staff;
    return staff.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        (s.role || '').toLowerCase().includes(q) ||
        (s.branch || '').toLowerCase().includes(q) ||
        (s.phone || '').toLowerCase().includes(q)
    );
  }, [search, staff]);

  const presentCount = useMemo(() => Object.values(attendance).filter((a) => a.status === 'present').length, [attendance]);
  const absentCount = useMemo(() => Object.values(attendance).filter((a) => a.status === 'absent').length, [attendance]);

  // Build maps for tasks: by staffId and also by legacy staff name (to support old bookings)
  const staffIdByName = useMemo(() => {
    const map: Record<string, string> = {};
    staff.forEach((s) => {
      map[(s.name || '').toLowerCase()] = s.id;
    });
    return map;
  }, [staff]);

  const tasksRows = useMemo(() => {
    // Normalize each booking to a staffId
    const rows = bookingsToday.map((b) => {
      let sid = b.staffId;
      if (!sid && b.staff) {
        sid = staffIdByName[(b.staff || '').toLowerCase()];
      }
      return { ...b, _staffId: sid } as BookingDocLite & { _staffId?: string };
    });
    // Sort by time ascending
    rows.sort((a, b) => (a.bookingTime || '').localeCompare(b.bookingTime || ''));
    return rows;
  }, [bookingsToday, staffIdByName]);

  /* ------------------------- Staff CRUD ------------------------- */
  const resetForm = () => {
    setEditingStaffId(null);
    setFormName('');
    setFormRole('');
    setFormPhone('');
    setFormBranch('');
    setFormActive(true);
  };

  const openCreate = () => {
    resetForm();
    setOpenModal(true);
  };

  const openEdit = (s: StaffDoc) => {
    setEditingStaffId(s.id);
    setFormName(s.name || '');
    setFormRole(s.role || '');
    setFormPhone(s.phone || '');
    setFormBranch(s.branch || '');
    setFormActive(s.active !== false);
    setOpenModal(true);
  };

  const saveStaff = async () => {
    if (!formName.trim()) {
      alert('Name is required');
      return;
    }
    try {
      setSaving(true);
      const payload = {
        name: formName.trim(),
        role: formRole.trim() || null,
        phone: formPhone.trim() || null,
        branch: formBranch || null,
        active: !!formActive,
        updatedAt: serverTimestamp(),
      } as any;

      if (editingStaffId) {
        await updateDoc(doc(db, 'staff', editingStaffId), payload);
      } else {
        await addDoc(collection(db, 'staff'), { ...payload, createdAt: serverTimestamp() });
      }
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

  /* ------------------------------ Render ------------------------------ */
  return (
    <AccessWrapper>
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 dark:from-gray-900 dark:via-purple-900 dark:to-indigo-900">
        <div className="p-6">
          <div className="max-w-7xl mx-auto dark:text-white">
            {/* Enhanced Header */}
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="mb-8"
            >
              <div className="bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 rounded-2xl p-8 text-white shadow-2xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <motion.div 
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      className="p-3 bg-white/20 backdrop-blur-sm rounded-xl"
                    >
                      <ListChecks className="w-8 h-8" />
                    </motion.div>
                    <div>
                      <h1 className="text-4xl font-bold mb-2">Staff Daily Tasks</h1>
                      <p className="text-pink-100 text-lg">Manage daily tasks and track staff performance</p>
                    </div>
                  </div>
                  <motion.div 
                    whileHover={{ scale: 1.05 }}
                    className="hidden md:flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2"
                  >
                    <Award className="w-5 h-5" />
                    <span className="font-medium">Task Management</span>
                  </motion.div>
                </div>
              </div>
            </motion.div>

            {/* Enhanced Controls */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="bg-white/80 backdrop-blur-sm dark:bg-gray-800/80 rounded-2xl shadow-xl border border-white/20 p-6 mb-8"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <motion.div 
                  whileHover={{ scale: 1.02 }}
                  className="relative group"
                >
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 group-hover:text-pink-500 transition-colors" />
                  <input
                    type="text"
                    placeholder="Search staff by name, role, branch, phone..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent bg-white/50 dark:bg-gray-700/50 backdrop-blur-sm transition-all duration-300 hover:shadow-lg"
                  />
                </motion.div>
                <motion.div 
                  whileHover={{ scale: 1.02 }}
                  className="flex items-center gap-3 group"
                >
                  <CalendarIcon className="w-6 h-6 text-gray-500 group-hover:text-purple-500 transition-colors" />
                  <input
                    type="date"
                    value={selectedDay}
                    onChange={(e) => setSelectedDay(e.target.value)}
                    className="flex-1 border-2 border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white/50 dark:bg-gray-700/50 backdrop-blur-sm transition-all duration-300 hover:shadow-lg"
                    title="Attendance day & Today's tasks date"
                  />
                </motion.div>
              </div>
            </motion.div>

            {/* Enhanced Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              {[
                { 
                  icon: Users, 
                  label: 'Total Staff', 
                  value: staff.length, 
                  color: 'blue',
                  gradient: 'from-blue-500 to-cyan-500'
                },
                { 
                  icon: CheckCircle, 
                  label: 'Present Today', 
                  value: presentCount, 
                  color: 'green',
                  gradient: 'from-green-500 to-emerald-500'
                },
                { 
                  icon: XCircle, 
                  label: 'Absent Today', 
                  value: absentCount, 
                  color: 'yellow',
                  gradient: 'from-yellow-500 to-orange-500'
                },
                { 
                  icon: ListChecks, 
                  label: 'Tasks Today', 
                  value: bookingsToday.length, 
                  color: 'purple',
                  gradient: 'from-purple-500 to-pink-500'
                }
              ].map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 + index * 0.1 }}
                  whileHover={{ scale: 1.05, y: -5 }}
                  className="group"
                >
                  <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6 hover:shadow-2xl transition-all duration-300">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <motion.div 
                          whileHover={{ rotate: 360 }}
                          transition={{ duration: 0.6 }}
                          className={`p-3 bg-gradient-to-r ${stat.gradient} rounded-xl shadow-lg`}
                        >
                          <stat.icon className="w-6 h-6 text-white" />
                        </motion.div>
                        <div>
                          <p className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">{stat.label}</p>
                          <motion.p 
                            key={stat.value}
                            initial={{ scale: 0.8 }}
                            animate={{ scale: 1 }}
                            className="text-3xl font-bold text-gray-900 dark:text-white"
                          >
                            {stat.value}
                          </motion.p>
                        </div>
                      </div>
                      <TrendingUp className="w-5 h-5 text-gray-400 group-hover:text-green-500 transition-colors" />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Enhanced Today's Tasks */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 overflow-hidden"
            >
              <div className="px-8 py-6 border-b border-gray-200/50 dark:border-gray-700/50 bg-gradient-to-r from-pink-500/10 to-purple-500/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <motion.div 
                      whileHover={{ rotate: 180 }}
                      className="p-2 bg-gradient-to-r from-pink-500 to-purple-500 rounded-lg"
                    >
                      <ListChecks className="w-6 h-6 text-white" />
                    </motion.div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Today's Tasks</h2>
                      <p className="text-gray-600 dark:text-gray-300">
                        Auto-synced from bookings on {format(new Date(selectedDay + 'T00:00:00'), 'MMM dd, yyyy')}
                      </p>
                    </div>
                  </div>
                  <motion.div 
                    whileHover={{ scale: 1.1 }}
                    className="bg-gradient-to-r from-pink-500 to-purple-500 text-white px-4 py-2 rounded-xl font-medium shadow-lg"
                  >
                    {tasksRows.length} Tasks
                  </motion.div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800">
                    <tr>
                      {['Time', 'Staff', 'Customer', 'Services', 'Branch'].map((header) => (
                        <th key={header} className="px-8 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200/50 dark:divide-gray-700/50">
                    {tasksRows.map((b, index) => {
                      const s = b._staffId ? staff.find((x) => x.id === b._staffId) : staff.find((x) => (x.name || '').toLowerCase() === (b.staff || '').toLowerCase());
                      return (
                        <motion.tr 
                          key={b.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.4, delay: index * 0.05 }}
                          whileHover={{ backgroundColor: 'rgba(236, 72, 153, 0.05)' }}
                          className="hover:shadow-lg transition-all duration-300"
                        >
                          <td className="px-8 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              <motion.div 
                                whileHover={{ scale: 1.2 }}
                                className="p-2 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg"
                              >
                                <Clock className="w-4 h-4 text-white" />
                              </motion.div>
                              <span className="text-sm font-medium text-gray-900 dark:text-white">
                                {toDisplayAMPM(b.bookingTime)}
                              </span>
                            </div>
                          </td>
                          <td className="px-8 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                                {(s?.name || b.staff || '—').charAt(0).toUpperCase()}
                              </div>
                              <span className="text-sm font-medium text-gray-900 dark:text-white">
                                {s?.name || b.staff || '—'}
                              </span>
                            </div>
                          </td>
                          <td className="px-8 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                            {b.customerName}
                          </td>
                          <td className="px-8 py-4">
                            <div className="flex flex-wrap gap-2">
                              {(b.services || []).map((sv, i) => (
                                <motion.span 
                                  key={i}
                                  whileHover={{ scale: 1.05 }}
                                  className="inline-block px-3 py-1 rounded-full bg-gradient-to-r from-pink-100 to-purple-100 dark:from-pink-900/30 dark:to-purple-900/30 text-pink-700 dark:text-pink-300 text-xs font-medium border border-pink-200 dark:border-pink-700 shadow-sm"
                                >
                                  {sv.serviceName}
                                </motion.span>
                              ))}
                            </div>
                          </td>
                          <td className="px-8 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <Building2 className="w-4 h-4 text-gray-400" />
                              <span className="text-sm text-gray-900 dark:text-white">
                                {b.branch || '—'}
                              </span>
                            </div>
                          </td>
                        </motion.tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {tasksRows.length === 0 && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-16"
                >
                  <motion.div
                    animate={{ 
                      y: [0, -10, 0],
                      rotate: [0, 5, -5, 0]
                    }}
                    transition={{ 
                      duration: 3,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  >
                    <CalendarIcon className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                  </motion.div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No tasks for this day</h3>
                  <p className="text-gray-500 dark:text-gray-400">Create a booking and assign a staff to see tasks here.</p>
                </motion.div>
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
                  className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-white/20 w-full max-w-2xl"
                >
                  <div className="flex items-center justify-between px-8 py-6 border-b border-gray-200/50 dark:border-gray-700/50 bg-gradient-to-r from-pink-500/10 to-purple-500/10">
                    <div className="flex items-center gap-3">
                      <motion.div 
                        whileHover={{ rotate: 180 }}
                        className="p-2 bg-gradient-to-r from-pink-500 to-purple-500 rounded-lg"
                      >
                        <UserPlus className="w-6 h-6 text-white" />
                      </motion.div>
                      <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                        {editingStaffId ? 'Edit Staff' : 'Add Staff'}
                      </h3>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.1, rotate: 90 }}
                      onClick={() => {
                        setOpenModal(false);
                        resetForm();
                      }}
                      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
                      title="Close"
                    >
                      <XCircle className="w-6 h-6" />
                    </motion.button>
                  </div>

                  <div className="p-8 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {[
                        { label: 'Name', value: formName, setter: setFormName, placeholder: 'e.g. Aimen', type: 'text' },
                        { label: 'Role', value: formRole, setter: setFormRole, placeholder: 'e.g. Hair Stylist', type: 'text' },
                        { label: 'Phone', value: formPhone, setter: setFormPhone, placeholder: 'e.g. 0300-1234567', type: 'text' },
                      ].map((field, index) => (
                        <motion.div 
                          key={field.label}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="group"
                        >
                          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            {field.label}
                          </label>
                          <input
                            type={field.type}
                            className="w-full border-2 border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 focus:ring-2 focus:ring-pink-500 focus:border-transparent bg-white/50 dark:bg-gray-700/50 backdrop-blur-sm transition-all duration-300 hover:shadow-lg group-hover:border-pink-300"
                            value={field.value}
                            onChange={(e) => field.setter(e.target.value)}
                            placeholder={field.placeholder}
                          />
                        </motion.div>
                      ))}
                      <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="group"
                      >
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                          Branch
                        </label>
                        <select
                          className="w-full border-2 border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 focus:ring-2 focus:ring-pink-500 focus:border-transparent bg-white/50 dark:bg-gray-700/50 backdrop-blur-sm transition-all duration-300 hover:shadow-lg group-hover:border-pink-300"
                          value={formBranch}
                          onChange={(e) => setFormBranch(e.target.value)}
                        >
                          <option value="">Select One</option>
                          {BRANCH_OPTIONS.map((b) => (
                            <option key={b} value={b}>{b}</option>
                          ))}
                        </select>
                      </motion.div>
                      <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl"
                      >
                        <input 
                          id="active" 
                          type="checkbox" 
                          checked={formActive} 
                          onChange={(e) => setFormActive(e.target.checked)}
                          className="w-5 h-5 text-pink-600 bg-gray-100 border-gray-300 rounded focus:ring-pink-500 focus:ring-2"
                        />
                        <label htmlFor="active" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Active Staff Member
                        </label>
                      </motion.div>
                    </div>
                  </div>

                  <div className="px-8 py-6 border-t border-gray-200/50 dark:border-gray-700/50 flex justify-end gap-4 bg-gray-50/50 dark:bg-gray-800/50">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        setOpenModal(false);
                        resetForm();
                      }}
                      className="px-6 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-600 transition-all duration-300 shadow-sm"
                      disabled={saving || deleting}
                    >
                      Close
                    </motion.button>
                    {editingStaffId && (
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => editingStaffId && removeStaff(editingStaffId)}
                        className="px-6 py-3 text-sm font-medium text-white bg-gradient-to-r from-red-500 to-rose-500 rounded-xl hover:from-red-600 hover:to-rose-600 disabled:opacity-60 transition-all duration-300 shadow-lg"
                        disabled={saving || deleting}
                      >
                        {deleting ? 'Deleting...' : 'Delete'}
                      </motion.button>
                    )}
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={saveStaff}
                      className="px-6 py-3 text-sm font-medium text-white bg-gradient-to-r from-pink-500 to-purple-500 rounded-xl hover:from-pink-600 hover:to-purple-600 disabled:opacity-60 transition-all duration-300 shadow-lg"
                      disabled={saving || deleting}
                    >
                      {saving ? (editingStaffId ? 'Updating...' : 'Saving...') : editingStaffId ? 'Update' : 'Save'}
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