// new code
"use client";

import { useState, useEffect, useMemo } from "react";
import AccessWrapper from "@/components/AccessWrapper";
import { toPng } from "html-to-image";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { v4 as uuidv4 } from "uuid";
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
} from "firebase/firestore";
import { db } from "@/lib/firebase";
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
} from "lucide-react";
import { format, isSameDay } from "date-fns";

/* ----------------------------- Types ----------------------------- */

interface BookingService {
  serviceId?: string;
  serviceName: string;
  category: string;
  duration: number; // minutes
  price: number; // per unit
  quantity: number;
}

type BookingStatus = "upcoming" | "past" | "cancelled";

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
  customerEmail?: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
}

/* --------------------------- Constants --------------------------- */

const BRANCH_OPTIONS = [
  "Al Bustan",
  "Marina",
  "TECOM",
  "AL Muraqabat",
  "IBN Batutta Mall",
];
const CATEGORY_OPTIONS = ["Facial", "Hair", "Nails", "Lashes", "Massage"];
const PAYMENT_METHODS = ["cash", "card"];

// Fallback staff list (used only if Firestore `staff` collection not available)
const STAFF_FALLBACK = ["Komal", "Shameem", "Do Thi Kim", "Alishba"];

/* ------------------------- Helper functions ---------------------- */

const emptyService: BookingService = {
  serviceId: "",
  serviceName: "",
  category: "",
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
    .padStart(2, "0");
  const m = (mins % 60).toString().padStart(2, "0");
  return `${h}:${m}`;
}

function toDisplayAMPM(hhmm: string) {
  const [hStr, m] = hhmm.split(":");
  let h = Number(hStr);
  const suffix = h >= 12 ? "PM" : "AM";
  if (h === 0) h = 12;
  if (h > 12) h = h - 12;
  return `${h}:${m} ${suffix}`;
}

function generateTimeSlots(start = 0, end = 12 * 120, step = 15) {
  const slots: string[] = [];
  for (let t = start; t <= end; t += step) {
    slots.push(minutesToHHMM(t));
  }
  return slots;
}

const TIMESLOTS = generateTimeSlots();

/* =========================== Component =========================== */

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [users, setUsers] = useState<{ [key: string]: User }>({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Create/Edit modal
  const [showCreate, setShowCreate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Invoice modal state
  const [showInvoice, setShowInvoice] = useState(false);
  const [invoiceData, setInvoiceData] = useState<Booking | null>(null);

  // form state
  const [branch, setBranch] = useState(BRANCH_OPTIONS[0]);
  const [serviceDate, setServiceDate] = useState<string>(() =>
    format(new Date(), "yyyy-MM-dd")
  );
  const [serviceTime, setServiceTime] = useState<string>("10:00"); // "HH:mm"
  const [customerName, setCustomerName] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<string>("cash");

  const [emailConfirmation, setEmailConfirmation] = useState(false);
  const [smsConfirmation, setSmsConfirmation] = useState(false);
  const [status, setStatus] = useState<BookingStatus>("upcoming");
  const [staff, setStaff] = useState<string>("");
  const [services, setServices] = useState<BookingService[]>([
    { ...emptyService },
  ]);
  const [remarks, setRemarks] = useState<string>("");
  const [customerEmail, setCustomerEmail] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const staffPerPage = 4; // show 4 staff per page

  // Schedule board controls
 const [scheduleDate, setScheduleDate] = useState(
  new Date().toISOString().split("T")[0]
);

  const [scheduleBranch, setScheduleBranch] = useState<string>("all");
 
const [serviceOptions, setServiceOptions] = useState<any[]>([]);

  const fetchServices = async () => {
    try {
      const servicesCollection = collection(db, "services");
      const snapshot = await getDocs(servicesCollection);
      const servicesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setServiceOptions(servicesData);
    } catch (error) {
      console.error("Error fetching services:", error);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);
  // Dynamic staff fetched from Firestore
  const [staffFromDB, setStaffFromDB] = useState<string[]>([]);

  // Hour enabled/disabled state (keyed by hour string, e.g. "10", "11", "12")
  const uniqueHours = Array.from(
    new Set(TIMESLOTS.map((t) => t.split(":")[0]))
  ).sort((a, b) => Number(a) - Number(b));
  const [enabledHours, setEnabledHours] = useState<Record<string, boolean>>(
    () => {
      const map: Record<string, boolean> = {};
      uniqueHours.forEach((h) => (map[h] = true));
      return map;
    }
  );

  /* -------------------- Load Staff from Firebase -------------------- */
  useEffect(() => {
    const loadStaff = async () => {
      try {
        const snap = await getDocs(collection(db, "staff"));
        const list: string[] = [];
        snap.forEach((d) => {
          const data = d.data() as any;
          if (data?.name) list.push(String(data.name));
        });
        // If no staff docs found, we fallback to constants
        setStaffFromDB(list.length ? list : STAFF_FALLBACK);
      } catch {
        setStaffFromDB(STAFF_FALLBACK);
      }
    };
    loadStaff();
  }, []);

  const STAFF_OPTIONS = staffFromDB; // used everywhere below

  /* -------------------- Load bookings (Realtime) -------------------- */

  /* -------------------- Load bookings (Realtime) -------------------- */
 

 

      useEffect(() => {
  const bookingsQuery = query(
    collection(db, "bookings"),
    orderBy("createdAt", "desc")
  );

  const unsubscribe = onSnapshot(bookingsQuery, (snapshot) => {
    const bookingsData = snapshot.docs.map((d) => {
      const data = d.data() as any;

      // Normalize bookingDate into a Date object
      let bookingDate: Date;
      if (data.bookingDate?.toDate) {
        bookingDate = data.bookingDate.toDate(); // Firestore Timestamp
      } else if (typeof data.bookingDate === "string") {
        bookingDate = new Date(data.bookingDate); // String date
      } else if (data.bookingDate?.seconds) {
        bookingDate = new Date(data.bookingDate.seconds * 1000); // Firestore Timestamp format
      } else {
        bookingDate = new Date(); // fallback
      }

      return {
        id: d.id,
        userId: data.userId || "",
        customerName: data.customerName || "",
        services: (data.services || []) as BookingService[],
        bookingDate,
        bookingTime: data.bookingTime || "",
        branch: data.branch || "",
        staff: data.staff?.trim() || data.staffName?.trim() || "Unassigned",
        totalPrice: data.totalPrice || 0,
        totalDuration: data.totalDuration || 0,
        status: (data.status as BookingStatus) || "upcoming",
        paymentMethod: data.paymentMethod || "cash",
        emailConfirmation: data.emailConfirmation || false,
        smsConfirmation: data.smsConfirmation || false,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
        updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(),
        remarks: data.remarks ?? null,
        customerEmail: data.customerEmail || "",
        source: data.source || (data.bookingDate ? "mobile" : "web"),
        loyaltyPointsEarned: data.loyaltyPointsEarned || 0,
        loyaltyPointsUsed: data.loyaltyPointsUsed || 0,
        tipAmount: data.tipAmount || 0,
        rawData: data,
      } as Booking;
    });

    setBookings(bookingsData);
    setLoading(false);
  });

  return () => unsubscribe();
}, []);


useEffect(() => {
  const fetchServices = async () => {
    const servicesCol = collection(db, "services");
    const serviceSnapshot = await getDocs(servicesCol);
    const servicesList = serviceSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as any[];
    setServiceOptions(servicesList);
  };

  fetchServices();
}, []);

  /* ------------------------- Load user details ------------------------- */
  useEffect(() => {
    const loadUsers = async () => {
      const usersQuery = query(collection(db, "users"));
      const usersSnapshot = await getDocs(usersQuery);
      const usersData: { [key: string]: User } = {};

      usersSnapshot.docs.forEach((doc) => {
        const data = doc.data() as any;
        usersData[doc.id] = {
          id: doc.id,
          name: data.name || data.displayName || "Unknown User",
          email: data.email || "",
          phone: data.phone || data.phoneNumber || "",
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

    const matchesStatus =
      statusFilter === "all" ||
      booking.status === (statusFilter as BookingStatus);

    return matchesSearch && matchesStatus;
  });

  // const saveInvoiceToFirebase = async (invoiceData) => {
  //   try {
  //     await addDoc(collection(db, "invoices"), {
  //       ...invoiceData,
  //       createdAt: new Date(),
  //     });
  //     console.log("Invoice saved to Firebase!");
  //   } catch (err) {
  //     console.error("Error saving invoice:", err);
  //   }
  // };
  const saveInvoiceToFirebase = async (invoiceData) => {
    try {
      // Agar userId empty ho, to random UUID generate karo
      const userId = invoiceData.userId || uuidv4();

      await addDoc(collection(db, "invoices"), {
        ...invoiceData,
        userId, // yaha ensure kar rahe ke hamesha value ho
         bookingId: invoiceData.id, // ✅ Add this line
        createdAt: new Date(),
      });
      console.log("Invoice saved to Firebase with userId:", userId);
    } catch (err) {
      console.error("Error saving invoice:", err);
    }
  };

  /* --------------------------- Update helpers --------------------------- */
  const updateBookingStatus = async (
    bookingId: string,
    newStatus: BookingStatus
  ) => {
    try {
      const bookingRef = doc(db, "bookings", bookingId);
      await updateDoc(bookingRef, {
        status: newStatus,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error updating booking status:", error);
      alert("Failed to update status.");
    }
  };

  const getStatusBadge = (s: string) => {
    switch (s) {
      case "upcoming":
        return "bg-blue-100 text-blue-800";
      case "past":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusBlock = (s: BookingStatus) => {
    switch (s) {
      case "upcoming":
        return "bg-emerald-50 border-emerald-300 text-emerald-800";
      case "past":
        return "bg-gray-50 border-gray-300 text-gray-700";
      case "cancelled":
        return "bg-rose-50 border-rose-300 text-rose-800 line-through";
      default:
        return "bg-slate-50 border-slate-300 text-slate-800";
    }
  };

  const getPaymentIcon = (method: string) => {
    switch (method.toLowerCase()) {
      case "card":
      case "credit":
      case "debit":
        return <CreditCard className="w-4 h-4" />;
      default:
        return <CreditCard className="w-4 h-4" />;
    }
  };

  /* -------------------------- Create/Edit Handlers ------------------------- */

  const resetForm = () => {
    setBranch(BRANCH_OPTIONS[0]);
    setServiceDate(format(new Date(), "yyyy-MM-dd"));
    setServiceTime("10:00");
    setCustomerName("");
    setPaymentMethod("cash");
    setEmailConfirmation(false);
    setSmsConfirmation(false);
    setStatus("upcoming");
    setStaff("");
    setServices([{ ...emptyService }]);
    setRemarks("");
    setEditingId(null);
    setCustomerEmail("");
  };

  const openForCreate = () => {
    resetForm();
    setShowCreate(true);
  };

  // Open modal to CREATE, but prefill staff+time from a grid cell
  const openForCreateFromCell = (prefillStaff: string, prefillTime: string) => {
    // If hour disabled, do nothing
    const hour = prefillTime.split(":")[0];
    if (!enabledHours[hour]) return;

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
    setServiceDate(format(b.bookingDate, "yyyy-MM-dd"));
    setServiceTime(b.bookingTime || "10:00");
    setCustomerName(b.customerName || "");
    setPaymentMethod(b.paymentMethod || "cash");
    setEmailConfirmation(!!b.emailConfirmation);
    setSmsConfirmation(!!b.smsConfirmation);
    setStatus(b.status || "upcoming");
    setStaff(b.staff || "");
    setServices(
      b.services && b.services.length > 0
        ? b.services.map((s) => ({
            serviceId: s.serviceId || "",
            serviceName: s.serviceName || "",
            category: s.category || "",
            duration: Number(s.duration) || 0,
            price: Number(s.price) || 0,
            quantity: Number(s.quantity) || 1,
          }))
        : [{ ...emptyService }]
    );
    setRemarks(b.remarks || "");
    setCustomerEmail(b.customerEmail || "");
    setShowCreate(true);
  };

  const handleAddServiceRow = () => {
    setServices((prev) => [...prev, { ...emptyService }]);
  };

  const handleRemoveServiceRow = (index: number) => {
    setServices((prev) => prev.filter((_, i) => i !== index));
  };

//   const handleServiceChange = (
//     index: number,
//     field: keyof BookingService,
//     value: string | number
//   ) => {
//     setServices((prev) =>
//       prev.map((s, i) => (i === index ? { ...s, [field]: value } : s))
//     );
//   };
const handleServiceChange = (idx: number, field: string, value: any) => {
  setServices((prev) =>
    prev.map((s, i) => {
      if (i !== idx) return s;

      // If serviceName is changed, auto-fill price & duration
      if (field === "serviceName") {
        const selectedService = serviceOptions.find(
          (service) => service.name === value
        );
        if (selectedService) {
          return {
            ...s,
            serviceName: value,
            duration: selectedService.duration || 0,
            price: selectedService.price || 0,
            category: selectedService.category || s.category,
          };
        }
      }

      // If category or other fields are changed, just update normally
      return { ...s, [field]: value };
    })
  );
};


  const formTotals = calcTotals(services);

  const validateForm = () => {
    if (!customerName.trim()) return "Customer name is required";
    if (!serviceDate) return "Service date is required";
    if (!serviceTime) return "Service time is required";
    if (!branch) return "Branch is required";
    if (!staff) return "Staff is required";
    if (services.length === 0) return "Add at least one service";
    const hasName = services.every((s) => s.serviceName.trim().length > 0);
    if (!hasName) return "Each service must have a name";
    // also ensure selected time hour is enabled
    const selectedHour = serviceTime.split(":")[0];
    if (!enabledHours[selectedHour])
      return "Selected time falls into a disabled hour";
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
        //userId: "",
         userId: uuidv4(), 
        customerName: customerName.trim(),
        services: services.map((s) => ({
          ...s,
          price: Number(s.price) || 0,
          duration: Number(s.duration) || 0,
          quantity: Number(s.quantity) || 0,
        })),
        bookingDate: Timestamp.fromDate(new Date(serviceDate + "T00:00:00")),
        bookingTime: serviceTime, // "HH:mm"
        branch,
        customerEmail: customerEmail.trim(), // add this
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
        const ref = doc(db, "bookings", editingId);
        await updateDoc(ref, payload);
      } else {
        await addDoc(collection(db, "bookings"), {
          ...payload,
          createdAt: serverTimestamp(),
        });
      }

      setShowCreate(false);
      resetForm();
    } catch (e) {
      console.error("Error saving booking:", e);
      alert("Failed to save booking. Check console for details.");
    } finally {
      setSaving(false);
    }
  };

  const deleteBooking = async () => {
    if (!editingId) return;
    if (!confirm("Delete this booking? This action cannot be undone.")) return;

    try {
      setDeleting(true);
      await deleteDoc(doc(db, "bookings", editingId));
      setShowCreate(false);
      resetForm();
    } catch (e) {
      console.error("Error deleting booking:", e);
      alert("Failed to delete booking.");
    } finally {
      setDeleting(false);
    }
  };

  /* ------------------------------ Schedule Board Data ------------------------------ */

  const bookingsForSchedule = useMemo(() => {
    const target = new Date(scheduleDate + "T00:00:00");
    return bookings.filter((b) => {
      const sameDay = isSameDay(b.bookingDate, target);
      const branchOk = scheduleBranch === "all" || b.branch === scheduleBranch;
      return sameDay && branchOk;
    });
  }, [bookings, scheduleDate, scheduleBranch]);

  // fast lookup: { 'HH:mm': { staffName: Booking[] } }
 
const scheduleMatrix = useMemo(() => {
  const map: Record<string, Record<string, Booking[]>> = {};

  // Initialize empty slots
  TIMESLOTS.forEach((t) => {
    map[t] = {};
    STAFF_OPTIONS.forEach((s) => (map[t][s] = []));
    map[t]["Unassigned"] = [];
  });
bookings.forEach((b) => {
  let bookingDateObj: Date;

  if (b.bookingDate instanceof Date) {
    bookingDateObj = b.bookingDate;
  } else if (typeof b.bookingDate === "string") {
    bookingDateObj = new Date(b.bookingDate);
  } else if (b.bookingDate?.seconds) {
    // Firestore timestamp object
    bookingDateObj = new Date(b.bookingDate.seconds * 1000);
  } else {
    console.error("Invalid bookingDate:", b.bookingDate);
    return; // skip invalid booking
  }

  const matchDate = format(bookingDateObj, "yyyy-MM-dd") === scheduleDate;
  const matchBranch = scheduleBranch === "all" || b.branch === scheduleBranch;
  const hour = b.bookingTime?.split(":")[0] ?? "";
  const hourEnabled = !!enabledHours[hour];

  if (!matchDate || !matchBranch || !hourEnabled) return;

  const t = b.bookingTime;
  const sName =
    b.staff && STAFF_OPTIONS.includes(b.staff) ? b.staff : "Unassigned";

  if (!map[t]) map[t] = {};
  if (!map[t][sName]) map[t][sName] = [];

  map[t][sName].push(b);
});

return map;
}, [bookings, scheduleDate, scheduleBranch, STAFF_OPTIONS, enabledHours]);

  

  /* -------------------------- Invoice Helpers ------------------------- */

  const openInvoice = (booking: Booking) => {
    setInvoiceData(booking);
    setShowInvoice(true);
  };

  const downloadInvoicePDF = async () => {
    const input = document.getElementById("invoice-content");
    if (!input) return;

    const imgData = await toPng(input, { cacheBust: true });

    // Custom smaller page size in mm (e.g., 150 x 200)
    const pdfWidth = 150;
    const pdfHeight = 180;
    const pdf = new jsPDF({
      orientation: "p",
      unit: "mm",
      format: [pdfWidth, pdfHeight],
    });

    // Fit content inside smaller page
    const contentWidth = pdfWidth - 10; // small margin
    const contentHeight =
      (input.offsetHeight * contentWidth) / input.offsetWidth;

    const x = 5; // horizontal margin
    const y = 5; // vertical margin

    pdf.addImage(imgData, "PNG", x, y, contentWidth, contentHeight);
   // pdf.save(`invoice_${Date.now()}.pdf`);
   pdf.save(`invoice_${invoiceData?.id || Date.now()}.pdf`);

    await saveInvoiceToFirebase(invoiceData);
  };
  const today = new Date().toISOString().split("T")[0]; // "YYYY-MM-DD"



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
    <AccessWrapper>
      <div>
        <div className="max-w-6xl mx-auto dark:text-white">
          {/* Header */}
          <div className="relative mb-8 overflow-hidden rounded-2xl bg-gradient-to-br from-purple-600 via-pink-600 to-blue-600 animate-gradient-x">
            <div className="absolute inset-0 bg-black/20"></div>
            <div className="relative px-8 py-12">
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 animate-float">
                      <Calendar className="w-8 h-8 text-white animate-pulse-slow" />
                    </div>
                    <div>
                      <h1 className="text-4xl lg:text-5xl font-bold text-white mb-2 animate-fade-in">
                        Bookings Management
                      </h1>
                      <div className="h-1 w-32 bg-gradient-to-r from-yellow-400 to-pink-400 rounded-full animate-slide-up"></div>
                    </div>
                  </div>
                  <p className="text-white/90 text-lg max-w-2xl leading-relaxed animate-fade-in-delay">
                    Streamline your appointment scheduling with our comprehensive booking management system. 
                    Track, organize, and optimize all customer appointments effortlessly.
                  </p>
                  <div className="flex items-center gap-4 text-white/80 text-sm animate-slide-down">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                      <span>Real-time Updates</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                      <span>Multi-branch Support</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
                      <span>Smart Scheduling</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 animate-float-delay">
                  <button
                    onClick={openForCreate}
                    className="group relative px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 animate-bounce-gentle"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-teal-700 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="relative flex items-center gap-2">
                      <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
                      <span>Add Schedule</span>
                    </div>
                    <div className="absolute inset-0 rounded-xl bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-pulse"></div>
                  </button>
                </div>
              </div>
            </div>
            
            {/* Decorative Elements */}
            <div className="absolute top-4 right-4 w-20 h-20 bg-white/10 rounded-full animate-float"></div>
            <div className="absolute bottom-4 left-4 w-16 h-16 bg-white/5 rounded-full animate-float-delay"></div>
            <div className="absolute top-1/2 right-1/4 w-12 h-12 bg-white/5 rounded-full animate-bounce-subtle"></div>
          </div>

          {/* Schedule Board Controls */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-50 via-white to-purple-50 border border-white/20 shadow-xl backdrop-blur-sm p-6 mb-6 w-[1000px] animate-fade-in">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-pink-500/5"></div>
            
            {/* Header */}
            <div className="relative mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 shadow-lg animate-float">
                  <Clock className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800">Schedule Controls</h3>
                <div className="flex-1 h-px bg-gradient-to-r from-indigo-200 via-purple-200 to-transparent"></div>
              </div>
            </div>

            <div className="relative grid grid-cols-1 md:grid-cols-4 gap-6">
              {/* Date Filter */}
              <div className="group">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  Schedule Date
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={scheduleDate}
                    onChange={(e) => setScheduleDate(e.target.value)}
                    className="w-full px-4 py-3 bg-white/70 backdrop-blur-sm border border-white/30 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 focus:bg-white/90 transition-all duration-300 shadow-lg hover:shadow-xl group-hover:scale-105"
                  />
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/10 to-purple-500/10 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                </div>
              </div>

              {/* Branch Filter */}
              <div className="group">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <MapPin className="w-4 h-4 inline mr-1" />
                  Branch Location
                </label>
                <div className="relative">
                  <select
                    value={scheduleBranch}
                    onChange={(e) => setScheduleBranch(e.target.value)}
                    className="w-full appearance-none px-4 py-3 bg-gradient-to-r from-gray-800 to-gray-900 text-white rounded-xl border border-gray-600 focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all duration-300 shadow-lg hover:shadow-xl cursor-pointer group-hover:scale-105"
                  >
                    <option value="all">All Branches</option>
                    {BRANCH_OPTIONS.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <svg className="w-5 h-5 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Hour Toggles */}
              <div className="md:col-span-2">
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-orange-600 shadow-md animate-pulse-slow">
                    <Clock className="w-4 h-4 text-white" />
                  </div>
                  <h4 className="text-sm font-medium text-gray-700">Available Hours</h4>
                  <div className="flex-1 h-px bg-gradient-to-r from-amber-200 to-transparent"></div>
                </div>
                
                <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-2">
                  {uniqueHours.map((h, index) => (
                    <label key={h} className="group relative cursor-pointer animate-fade-in-delay" style={{ animationDelay: `${index * 50}ms` }}>
                      <input
                        type="checkbox"
                        checked={!!enabledHours[h]}
                        onChange={(e) =>
                          setEnabledHours((prev) => ({
                            ...prev,
                            [h]: e.target.checked,
                          }))
                        }
                        className="sr-only"
                      />
                      <div className={`
                        relative px-3 py-2 rounded-xl text-xs font-medium text-center transition-all duration-300 transform
                        ${enabledHours[h] 
                          ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg scale-105 animate-bounce-gentle' 
                          : 'bg-white/60 text-gray-600 border border-gray-200 hover:bg-gray-50 hover:scale-105'
                        }
                        group-hover:shadow-xl
                      `}>
                        <div className="flex items-center justify-center gap-1">
                          {enabledHours[h] && (
                            <CheckCircle className="w-3 h-3 animate-spin-slow" />
                          )}
                          <span>{toDisplayAMPM(`${h}:00`)}</span>
                        </div>
                        
                        {/* Toggle indicator */}
                        <div className={`
                          absolute -top-1 -right-1 w-3 h-3 rounded-full transition-all duration-300
                          ${enabledHours[h] 
                            ? 'bg-green-400 animate-ping' 
                            : 'bg-gray-300 opacity-0 group-hover:opacity-100'
                          }
                        `}></div>
                      </div>
                    </label>
                  ))}
                </div>
                
                {/* Toggle All Controls */}
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => setEnabledHours(Object.fromEntries(uniqueHours.map(h => [h, true])))}
                    className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-xs rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105 animate-fade-in-delay-2"
                  >
                    Enable All
                  </button>
                  <button
                    onClick={() => setEnabledHours(Object.fromEntries(uniqueHours.map(h => [h, false])))}
                    className="px-4 py-2 bg-gradient-to-r from-red-500 to-rose-600 text-white text-xs rounded-lg hover:from-red-600 hover:to-rose-700 transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105 animate-fade-in-delay-3"
                  >
                    Disable All
                  </button>
                </div>
              </div>
            </div>
            
            {/* Decorative Elements */}
             <div className="absolute top-2 right-2 w-16 h-16 bg-gradient-to-br from-indigo-400/20 to-purple-400/20 rounded-full animate-float-delay"></div>
             <div className="absolute bottom-2 left-2 w-12 h-12 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full animate-bounce-subtle"></div>
           </div>

          <div className="relative mb-6 overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-50 via-white to-purple-50 border border-white/20 shadow-xl backdrop-blur-sm w-[1000px] animate-fade-in">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-pink-500/5"></div>
            <div className="relative p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 shadow-lg animate-float">
                  <Search className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800">Search & Filter</h3>
                <div className="flex-1 h-px bg-gradient-to-r from-blue-200 via-purple-200 to-transparent"></div>
              </div>
              
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative group">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-blue-500 transition-colors duration-300" />
                    <input
                      type="text"
                      placeholder="Search by customer name, branch, or service..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 bg-white/70 backdrop-blur-sm border border-white/30 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 focus:bg-white/90 transition-all duration-300 placeholder-gray-500 shadow-lg hover:shadow-xl"
                    />
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/10 to-purple-500/10 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                  </div>
                </div>

                <div className="md:w-48">
                  <div className="relative group">
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="w-full appearance-none bg-gradient-to-r from-gray-800 to-gray-900 text-white px-4 py-3 rounded-xl border border-gray-600 focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all duration-300 shadow-lg hover:shadow-xl cursor-pointer"
                    >
                      <option value="all">All Status</option>
                      <option value="upcoming">Upcoming</option>
                      <option value="past">Past</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <svg className="w-5 h-5 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Decorative Elements */}
            <div className="absolute top-2 right-2 w-16 h-16 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full animate-float-delay"></div>
            <div className="absolute bottom-2 left-2 w-12 h-12 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full animate-bounce-subtle"></div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8 w-[1000px]">
            <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-50 via-white to-blue-100 border border-blue-200/50 shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 animate-fade-in">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-cyan-500/5"></div>
              <div className="relative p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300 animate-float">
                    <Calendar className="w-6 h-6 text-white" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 group-hover:text-blue-700 transition-colors duration-300">
                      Total Bookings
                    </p>
                    <p className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent animate-pulse-slow">
                      {bookings.length}
                    </p>
                  </div>
                </div>
              </div>
              <div className="absolute top-2 right-2 w-12 h-12 bg-gradient-to-br from-blue-400/20 to-cyan-400/20 rounded-full animate-bounce-subtle"></div>
            </div>

            <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-green-50 via-white to-emerald-100 border border-green-200/50 shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 animate-fade-in-delay">
              <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 to-emerald-500/5"></div>
              <div className="relative p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300 animate-float-delay">
                    <CheckCircle className="w-6 h-6 text-white" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 group-hover:text-green-700 transition-colors duration-300">Upcoming</p>
                    <p className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent animate-pulse-slow">
                      {bookings.filter((b) => b.status === "upcoming").length}
                    </p>
                  </div>
                </div>
              </div>
              <div className="absolute top-2 right-2 w-12 h-12 bg-gradient-to-br from-green-400/20 to-emerald-400/20 rounded-full animate-bounce-subtle"></div>
            </div>

            <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-50 via-white to-yellow-100 border border-amber-200/50 shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 animate-fade-in-delay-2">
              <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 to-yellow-500/5"></div>
              <div className="relative p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-gradient-to-r from-amber-500 to-yellow-600 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300 animate-float">
                    <AlertCircle className="w-6 h-6 text-white" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 group-hover:text-amber-700 transition-colors duration-300">Past</p>
                    <p className="text-3xl font-bold bg-gradient-to-r from-amber-600 to-yellow-600 bg-clip-text text-transparent animate-pulse-slow">
                      {bookings.filter((b) => b.status === "past").length}
                    </p>
                  </div>
                </div>
              </div>
              <div className="absolute top-2 right-2 w-12 h-12 bg-gradient-to-br from-amber-400/20 to-yellow-400/20 rounded-full animate-bounce-subtle"></div>
            </div>

            <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-red-50 via-white to-rose-100 border border-red-200/50 shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 animate-fade-in-delay-3">
              <div className="absolute inset-0 bg-gradient-to-r from-red-500/5 to-rose-500/5"></div>
              <div className="relative p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-gradient-to-r from-red-500 to-rose-600 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300 animate-float-delay">
                    <XCircle className="w-6 h-6 text-white" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 group-hover:text-red-700 transition-colors duration-300">Cancelled</p>
                    <p className="text-3xl font-bold bg-gradient-to-r from-red-600 to-rose-600 bg-clip-text text-transparent animate-pulse-slow">
                      {bookings.filter((b) => b.status === "cancelled").length}
                    </p>
                  </div>
                </div>
              </div>
              <div className="absolute top-2 right-2 w-12 h-12 bg-gradient-to-br from-red-400/20 to-rose-400/20 rounded-full animate-bounce-subtle"></div>
            </div>
          </div>

          {/* Schedule Board */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-50 via-white to-gray-100 border border-white/20 shadow-2xl backdrop-blur-sm mb-10 w-[1000px] animate-fade-in">
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 via-purple-500/5 to-pink-500/5"></div>
            
            {/* Header with title and decorative elements */}
            <div className="relative p-6 border-b border-gray-200/50 bg-gradient-to-r from-gray-50 to-white">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 shadow-lg animate-float">
                  <Calendar className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-800">Schedule Board</h3>
                <div className="flex-1 h-px bg-gradient-to-r from-indigo-200 via-purple-200 to-transparent"></div>
              </div>
              <div className="absolute top-2 right-2 w-12 h-12 bg-gradient-to-br from-indigo-400/20 to-purple-400/20 rounded-full animate-bounce-subtle"></div>
            </div>

            <div className="relative overflow-x-auto">
              <div className="min-w-[900px] relative">
                <div
                  className="grid sticky top-0 z-20"
                  style={{
                    gridTemplateColumns: `180px repeat(${STAFF_OPTIONS.length}, 200px)`,
                  }}
                >
                  <div className="bg-gradient-to-r from-gray-800 to-gray-900 text-white border-b border-gray-600 px-4 py-4 font-bold sticky left-0 z-30 shadow-lg">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Time
                    </div>
                  </div>
                  {STAFF_OPTIONS.map((sName, index) => (
                    <div
                      key={sName}
                      className={`bg-gradient-to-r ${
                        index % 2 === 0 
                          ? 'from-blue-500 to-indigo-600' 
                          : 'from-purple-500 to-pink-600'
                      } text-white border-b border-white/20 px-4 py-4 font-bold text-center shadow-lg animate-fade-in-delay`}
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <div className="flex items-center justify-center gap-2">
                        <User className="w-4 h-4" />
                        {sName}
                      </div>
                    </div>
                  ))}
                </div>
    </div>

    <div>
      {TIMESLOTS.map((t) => {
        const hour = t.split(":")[0].padStart(2, "0"); // normalize hour
        const hourEnabled = !!enabledHours[hour];

        return (
          <div
            key={t}
            className="grid"
            style={{
              gridTemplateColumns: `180px repeat(${STAFF_OPTIONS.length}, 200px)`,
            }}
          >
            <div className="sticky left-0 z-10 bg-gray-50 border-t border-b px-4 py-3 font-medium">
              {toDisplayAMPM(t)}
            </div>

            {STAFF_OPTIONS.map((sName) => {
               





const normalizedScheduleDate = new Date(scheduleDate)
  .toISOString()
  .split("T")[0];

const allItems = bookings.filter((b) => {
  const bookingDay = new Date(b.bookingDate)
    .toISOString()
    .split("T")[0]; // normalize YYYY-MM-DD

  const normalizeTime = (timeStr: string) => {
    if (!timeStr) return "";

    let [hh, mm] = timeStr.split(":");

    if (!mm) mm = "00";

    // Handle AM/PM
    const lowerTime = timeStr.toLowerCase();
    const isPM = lowerTime.includes("pm");
    const isAM = lowerTime.includes("am");

    hh = hh.replace(/\D/g, ""); // remove any letters like AM/PM

    let hourNum = parseInt(hh, 10);
    if (isPM && hourNum !== 12) hourNum += 12;
    if (isAM && hourNum === 12) hourNum = 0;

    return `${hourNum.toString().padStart(2, "0")}:${mm.substring(0, 2)}`;
  };

  const normalizedBookingTime = normalizeTime(b.bookingTime);
  const normalizedSlotTime = normalizeTime(t);

  const staffMatch = b.staff ? b.staff === sName : true;

//   console.log("filter check", {
//     bookingDay,
//     normalizedScheduleDate,
//     normalizedBookingTime,
//     normalizedSlotTime,
//     staffMatch,
//   });

  return (
    staffMatch &&
    bookingDay === normalizedScheduleDate &&
    normalizedBookingTime === normalizedSlotTime
  );
});



              return (
                <div
                  key={`${t}-${sName}`}
                  className={`border-t border-b border-l px-2 py-2 min-h-[64px] ${
                    !hourEnabled
                      ? "bg-gray-50 opacity-70 pointer-events-none"
                      : ""
                  }`}
                  onClick={(e) => {
                    if (!hourEnabled) return;
                    if (allItems.length === 0) {
                      openForCreateFromCell(sName, t);
                    }
                  }}
                >
                  <div className="space-y-2">
                    {allItems.map((b) => (
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
                        <div className="flex justify-between items-start">
                          <div className="font-semibold truncate">
                            {b.customerName}
                          </div>
                          <div className="flex items-center gap-2">
                            <button onClick={(ev) => {
                                ev.stopPropagation();
                                openInvoice(b);
                              }}
                              className="text-xs px-2 py-0.5 rounded bg-indigo-100 text-indigo-700"
                              title="Generate Invoice"
                            >
                              Invoice
                            </button>
                            <span className="text-[11px] opacity-80">
                              {toDisplayAMPM(b.bookingTime)}
                            </span>
                          </div>
                        </div>
                        <div className="truncate text-[12px]">
                          {b.services.map((s) => s.serviceName).join(", ")}
                        </div>
                        <div className="flex items-center text-[11px] opacity-80 mt-1">
                          <Clock className="w-3 h-3 mr-1" />
                          {toDisplayAMPM(b.bookingTime)} • {b.totalDuration}m
                        </div>
                      </button>
                    ))}

                    {allItems.length === 0 && hourEnabled && (
                      <div className="w-full h-full flex items-center justify-center">
                        <button
                          className="text-[11px] text-emerald-700 hover:text-emerald-900 underline"
                          onClick={() => openForCreateFromCell(sName, t)}
                        >
                          Add here
                        </button>
                      </div>
                    )}

                    {allItems.length === 0 && !hourEnabled && (
                      <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">
                        Disabled
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  </div>
</div>

                     
          {filteredBookings.length === 0 && (
            <div className="text-center py-12">
              <Calendar className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                No bookings found
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm || statusFilter !== "all"
                  ? "Try adjusting your search or filter criteria."
                  : "No bookings have been made yet."}
              </p>
            </div>
          )}
        </div>

        {/* ===================== CREATE / EDIT MODAL ===================== */}
        {showCreate && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 z-50 overflow-y-auto h-full w-full">
            <div className="relative top-10 mx-auto w-11/12 md:w-4/5 lg:w-3/4 xl:w-2/3">
              <div className="bg-white rounded-lg shadow-xl border">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b">
                  <h3 className="text-lg font-semibold">
                    {editingId ? "Edit Schedule" : "Add Schedule"}
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
                    {editingId && (
                      <button
                        onClick={() => {
                          const booking = bookings.find(
                            (b) => b.id === editingId
                          );
                          if (booking) openInvoice(booking);
                        }}
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                        title="Generate Invoice"
                      >
                        Invoice
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
                      <label className="block text-sm font-medium text-gray-700">
                        Branch
                      </label>
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
                      <label className="block text-sm font-medium text-gray-700">
                        Customer Email
                      </label>
                      <input
                        type="email"
                        placeholder="Customer email"
                        className="mt-1 w-full border rounded-md px-3 py-2"
                        value={customerEmail}
                        onChange={(e) => setCustomerEmail(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Category
                      </label>
                     <select
  className="mt-1 w-full border rounded-md px-3 py-2"
  onChange={(e) => {
    setServices((prev) =>
      prev.map((s, i) =>
        i === 0 ? { ...s, category: e.target.value } : s
      )
    );
  }}
>
  <option value="">Select One</option>
  {Array.from(new Set(serviceOptions.map(s => s.category))).map(c => (
    <option key={c} value={c}>
      {c}
    </option>
  ))}
</select>

                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Staff
                      </label>
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
                      <label className="block text-sm font-medium text-gray-700">
                        Time Slot
                      </label>
                      <select
                        className="mt-1 w-full border rounded-md px-3 py-2"
                        value={serviceTime}
                        onChange={(e) => setServiceTime(e.target.value)}
                      >
                        {TIMESLOTS.filter((slot) => {
                          const hour = slot.split(":")[0];
                          return !!enabledHours[hour];
                        }).map((slot) => (
                          <option key={slot} value={slot}>
                            {toDisplayAMPM(slot)}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Customer
                      </label>
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
                      <div
                        key={idx}
                        className="grid grid-cols-12 gap-2 px-4 py-3 border-t"
                      >
                       <div className="col-span-4">
  <select
    className="w-full border rounded-md px-3 py-2"
    value={s.serviceName}
    onChange={(e) =>
      handleServiceChange(idx, "serviceName", e.target.value)
    }
  >
    <option value="">Select a service</option>
    {serviceOptions.map((service) => (
      <option key={service.id} value={service.name}>
        {service.name}
      </option>
    ))}
  </select>
</div>

                        <div className="col-span-2">
                          <select
                            className="w-full border rounded-md px-3 py-2"
                            value={s.category}
                            onChange={(e) =>
                              handleServiceChange(
                                idx,
                                "category",
                                e.target.value
                              )
                            }
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
                              handleServiceChange(
                                idx,
                                "duration",
                                Number(e.target.value || 0)
                              )
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
                              handleServiceChange(
                                idx,
                                "price",
                                Number(e.target.value || 0)
                              )
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
                              handleServiceChange(
                                idx,
                                "quantity",
                                Number(e.target.value || 1)
                              )
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
                          <strong>Total Duration:</strong>{" "}
                          {formTotals.totalDuration} min
                        </span>
                        <span>
                          <strong>Total Price:</strong> $
                          {formTotals.totalPrice.toFixed(2)}
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
                      {/* <div className="flex items-center justify-between border rounded-md px-3 py-2">
                       <span className="text-sm">
                          Send booking notification by email
                        </span> 
                        <input
                          type="checkbox"
                          checked={emailConfirmation}
                          onChange={(e) =>
                            setEmailConfirmation(e.target.checked)
                          }
                        />
                      </div> */}
                      {/* <div className="flex items-center justify-between border rounded-md px-3 py-2">
                        <span className="text-sm">
                          Send booking notification by SMS
                        </span> 
                        <input
                          type="checkbox"
                          checked={smsConfirmation}
                          onChange={(e) => setSmsConfirmation(e.target.checked)}
                        />
                      </div> */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Application Status
                        </label>
                        <select
                          className="mt-1 w-full border rounded-md px-3 py-2"
                          value={status}
                          onChange={(e) =>
                            setStatus(e.target.value as BookingStatus)
                          }
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
                    {saving
                      ? editingId
                        ? "Updating..."
                        : "Saving..."
                      : editingId
                      ? "Update"
                      : "Save"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        {/* =================== END CREATE / EDIT MODAL =================== */}

        {/* =================== INVOICE MODAL =================== */}

        {/* =================== INVOICE MODAL =================== */}
        {invoiceData && (
          <div
            className={`fixed inset-0 flex items-center justify-center bg-black/50 z-50 p-4 transition-opacity ${
              showInvoice ? "opacity-100 visible" : "opacity-0 invisible"
            }`}
          >
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl p-6 relative">
              <button
                className="absolute top-4 right-4 text-gray-500 hover:text-gray-800"
                onClick={() => setShowInvoice(false)}
                title="Close"
              >
                ✖
              </button>

              {/* Invoice content */}
              <div
                id="invoice-content"
                className="p-6 bg-white rounded-lg shadow-md"
              >
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-indigo-700">
                      Invoice Receipt
                    </h2>
                    <p className="text-sm text-gray-500">
                      Booking ID: {invoiceData.id}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">MirrorBeautyLounge</p>
                    {/*<p className="text-sm text-gray-500">Address line 1</p>
            <p className="text-sm text-gray-500">Phone: +971-XXX-XXXX</p>*/}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 text-sm">
                  <div>
                    <p>
                      <strong>Customer:</strong> {invoiceData.customerName}
                    </p>
                    <p>
                      <strong>Email:</strong>{" "}
                      {invoiceData.customerEmail ||
                        users[invoiceData.userId]?.email ||
                        "N/A"}
                    </p>
                    <p>
                      <strong>Phone:</strong>{" "}
                      {users[invoiceData.userId]?.phone || "-"}
                    </p>
                  </div>
                  <div>
                    <p>
                      <strong>Branch:</strong> {invoiceData.branch}
                    </p>
                    <p>
                      <strong>Date:</strong>{" "}
                      {format(invoiceData.bookingDate, "dd MMM yyyy")}
                    </p>
                    <p>
                      <strong>Time:</strong>{" "}
                      {toDisplayAMPM(invoiceData.bookingTime)}
                    </p>
                    <p>
                      <strong>Staff:</strong> {invoiceData.staff || "-"}
                    </p>
                  </div>
                </div>

                <div className="overflow-hidden rounded border">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="p-3 text-left">Service</th>
                        <th className="p-3 text-center">Qty</th>
                        <th className="p-3 text-right">Price</th>
                        <th className="p-3 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoiceData.services
                        .slice(
                          (currentPage - 1) * staffPerPage,
                          currentPage * staffPerPage
                        )
                        .map((s, i) => (
                          <tr key={i} className="border-t">
                            <td className="p-3">{s.serviceName}</td>
                            <td className="p-3 text-center">{s.quantity}</td>
                            <td className="p-3 text-right">
                              AED {Number(s.price).toFixed(2)}
                            </td>
                            <td className="p-3 text-right">
                              AED{" "}
                              {(Number(s.price) * Number(s.quantity)).toFixed(
                                2
                              )}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>

                <div className="mt-4 flex justify-end items-center gap-6">
                  <div className="text-right">
                    <div className="text-sm text-gray-600">Subtotal</div>
                    <div className="text-xl font-bold text-indigo-700">
                      AED {Number(invoiceData.totalPrice).toFixed(2)}
                    </div>
                  </div>
                </div>

                <div className="mt-6 text-center text-sm text-gray-500">
                  Thank you for your booking! We look forward to serving you.
                </div>
              </div>

              {/* Actions */}
              <div className="mt-4 flex justify-end gap-3">
                <button
                  onClick={() => setShowInvoice(false)}
                  className="px-4 py-2 bg-gray-100 rounded-md"
                >
                  Close
                </button>
                <button
                  onClick={downloadInvoicePDF}
                  className="px-4 py-2 bg-pink-600 text-white rounded-md"
                >
                  Download PDF
                </button>
              </div>
            </div>
          </div>
        )}
        {/* =================== END INVOICE MODAL =================== */}

        {/* =================== END INVOICE MODAL =================== */}
        {/* =================== STAFF LIST WITH PAGINATION =================== */}

        {invoiceData && invoiceData.services && (
          <div className="mt-4 flex justify-between items-center">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className={`px-4 py-2 rounded-md ${
                currentPage === 1
                  ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                  : "bg-indigo-600 text-white hover:bg-indigo-700"
              }`}
            >
              Previous
            </button>

            <span className="text-sm text-gray-700">
              Page {currentPage} of{" "}
              {Math.ceil(invoiceData.services.length / staffPerPage)}
            </span>

            <button
              onClick={() =>
                setCurrentPage((prev) =>
                  Math.min(
                    prev + 1,
                    Math.ceil(invoiceData.services.length / staffPerPage)
                  )
                )
              }
              disabled={
                currentPage ===
                Math.ceil(invoiceData.services.length / staffPerPage)
              }
              className={`px-4 py-2 rounded-md ${
                currentPage ===
                Math.ceil(invoiceData.services.length / staffPerPage)
                  ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                  : "bg-indigo-600 text-white hover:bg-indigo-700"
              }`}
            >
              Next
            </button>
          </div>
        )}

        {/* =================== END STAFF LIST =================== */}
      </div>
    </AccessWrapper>

  );
}




















