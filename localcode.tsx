

'use client';

import { useState, useEffect, useMemo } from 'react';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  doc, 
  updateDoc,
  deleteDoc,
  addDoc,
  Timestamp,
  getDocs
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  User, 
  CreditCard, 
  Search,
  Eye,
  Check,
  X
} from 'lucide-react';
import { format, isSameDay } from 'date-fns';

interface Booking {
  id: string;
  customerName: string;
  bookingDate: Date;
  time: string;
  services: { serviceName: string; price: number }[];
  branch: string;
  staff?: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
}

const BRANCH_OPTIONS = ['Branch A', 'Branch B', 'Branch C'];
const STAFF_OPTIONS = ['Ali', 'Sara', 'John', 'Zain'];

export default function BookingManager() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [branchFilter, setBranchFilter] = useState('all');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  
  // Schedule board controls
  const [scheduleDate, setScheduleDate] = useState<string>(() =>
    format(new Date(), 'yyyy-MM-dd')
  );
  const [scheduleBranch, setScheduleBranch] = useState<string>('all');
  const [scheduleStaff, setScheduleStaff] = useState<string>('all'); // ✅ NEW state

  useEffect(() => {
    const q = query(collection(db, 'bookings'), orderBy('bookingDate', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => {
        const d = doc.data();
        return {
          id: doc.id,
          customerName: d.customerName,
          bookingDate: d.bookingDate?.toDate() || new Date(),
          time: d.time,
          services: d.services || [],
          branch: d.branch || '',
          staff: d.staff || '',
          status: d.status || 'pending',
        } as Booking;
      });
      setBookings(data);
    });
    return () => unsubscribe();
  }, []);

  // ✅ Bookings filtered for list
  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      const matchesSearch =
        !searchTerm ||
        b.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.services.some((s) =>
          s.serviceName.toLowerCase().includes(searchTerm.toLowerCase())
        );

      const matchesStatus = statusFilter === 'all' || b.status === statusFilter;
      const matchesBranch = branchFilter === 'all' || b.branch === branchFilter;
      const matchesStaff = scheduleStaff === 'all' || (b.staff || '') === scheduleStaff; // ✅ Staff filter

      return matchesSearch && matchesStatus && matchesBranch && matchesStaff;
    });
  }, [bookings, searchTerm, statusFilter, branchFilter, scheduleStaff]);

  // ✅ Bookings filtered for schedule board
  const bookingsForSchedule = useMemo(() => {
    const target = new Date(scheduleDate + 'T00:00:00');
    return bookings.filter((b) => {
      const sameDay = isSameDay(b.bookingDate, target);
      const branchOk = scheduleBranch === 'all' || b.branch === scheduleBranch;
      const staffOk = scheduleStaff === 'all' || (b.staff || '') === scheduleStaff;
      return sameDay && branchOk && staffOk;
    });
  }, [bookings, scheduleDate, scheduleBranch, scheduleStaff]);

  return (
    <div className="p-6 space-y-6">
      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-center">
        <div className="flex items-center border rounded-md px-3 py-2">
          <Search className="w-4 h-4 text-gray-500 mr-2" />
          <input
            type="text"
            placeholder="Search bookings..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="outline-none"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border rounded-md px-3 py-2"
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>

        <select
          value={branchFilter}
          onChange={(e) => setBranchFilter(e.target.value)}
          className="border rounded-md px-3 py-2"
        >
          <option value="all">All Branches</option>
          {BRANCH_OPTIONS.map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </select>

        {/* ✅ NEW Staff filter dropdown */}
        <select
          value={scheduleStaff}
          onChange={(e) => setScheduleStaff(e.target.value)}
          className="border rounded-md px-3 py-2"
        >
          <option value="all">All Staff</option>
          {STAFF_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {/* Bookings List */}
      <div className="border rounded-lg shadow">
        <table className="w-full border-collapse">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3 text-left">Customer</th>
              <th className="p-3 text-left">Date</th>
              <th className="p-3 text-left">Time</th>
              <th className="p-3 text-left">Branch</th>
              <th className="p-3 text-left">Staff</th>
              <th className="p-3 text-left">Services</th>
              <th className="p-3 text-left">Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredBookings.map((b) => (
              <tr key={b.id} className="border-t">
                <td className="p-3">{b.customerName}</td>
                <td className="p-3">{format(b.bookingDate, 'yyyy-MM-dd')}</td>
                <td className="p-3">{b.time}</td>
                <td className="p-3">{b.branch}</td>
                <td className="p-3">{b.staff}</td>
                <td className="p-3">
                  {b.services.map((s) => s.serviceName).join(', ')}
                </td>
                <td className="p-3 capitalize">{b.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Schedule Board Controls */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
        <div className="flex items-center">
          <User className="w-5 h-5 text-gray-500 mr-2" />
          <select
            value={scheduleStaff}
            onChange={(e) => setScheduleStaff(e.target.value)}
            className="w-full border rounded-md px-3 py-2"
          >
            <option value="all">All Staff</option>
            {STAFF_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Schedule Board */}
      <div className="border rounded-lg shadow">
        <div className="grid" style={{ gridTemplateColumns: `220px repeat(12, 140px)` }}>
          {/* Header Row */}
          <div className="sticky left-0 z-10 bg-gray-100 px-4 py-2 font-medium border-b border-r">
            Staff
          </div>
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="px-4 py-2 font-medium border-b border-r">
              {10 + i}:00
            </div>
          ))}

          {/* Staff Rows */}
          {STAFF_OPTIONS.map((staffName) => (
            <div
              key={staffName}
              className="contents"
            >
              <div className="sticky left-0 z-10 bg-gray-50 border-r px-4 py-3 font-medium">
                {staffName}
              </div>
              {Array.from({ length: 12 }).map((_, i) => {
                const slot = `${10 + i}:00`;
                const booking = bookingsForSchedule.find(
                  (b) => b.staff === staffName && b.time === slot
                );
                return (
                  <div
                    key={i}
                    className={`border-r px-2 py-3 text-sm ${
                      booking ? 'bg-blue-100' : 'bg-white'
                    }`}
                  >
                    {booking ? booking.customerName : ''}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
