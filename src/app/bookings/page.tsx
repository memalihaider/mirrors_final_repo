// "use client";

// import { useState, useEffect, useMemo } from "react";
// import AccessWrapper from "@/components/AccessWrapper";
// import { toPng } from "html-to-image";
// import jsPDF from "jspdf";
// import html2canvas from "html2canvas";
// import { v4 as uuidv4 } from "uuid";
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
// } from "firebase/firestore";
// import { db } from "@/lib/firebase";
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
// } from "lucide-react";
// import { format, isSameDay } from "date-fns";

// /* ----------------------------- Types ----------------------------- */

// interface BookingService {
//   serviceId?: string;
//   serviceName: string;
//   category: string;
//   duration: number; // minutes
//   price: number; // per unit
//   quantity: number;
// }

// type BookingStatus = "upcoming" | "past" | "cancelled";

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
//   customerEmail?: string;
// }

// interface User {
//   id: string;
//   name: string;
//   email: string;
//   phone: string;
// }

// /* --------------------------- Constants --------------------------- */

// const BRANCH_OPTIONS = [
//   "AI Bustaan",
//   "Marina",
//   "TECOM",
//   "AL Muraqabat",
//   "IBN Batutta Mall",
// ];
// const CATEGORY_OPTIONS = ["Facial", "Hair", "Nails", "Lashes", "Massage"];
// const PAYMENT_METHODS = ["cash", "card", "tabby", "tamara", "apple pay","google pay","samsung wallet","paypal","american express","ewallet STC pay","bank transfer","cash on delivery","other"];

// // Fallback staff list (used only if Firestore `staff` collection not available)
// const STAFF_FALLBACK = ["Komal", "Shameem", "Do Thi Kim", "Alishba"];

// /* ------------------------- Helper functions ---------------------- */

// const emptyService: BookingService = {
//   serviceId: "",
//   serviceName: "",
//   category: "",
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
//     .padStart(2, "0");
//   const m = (mins % 60).toString().padStart(2, "0");
//   return `${h}:${m}`;
// }

// function toDisplayAMPM(hhmm: string) {
//   const [hStr, m] = hhmm.split(":");
//   let h = Number(hStr);
//   const suffix = h >= 12 ? "PM" : "AM";
//   if (h === 0) h = 12;
//   if (h > 12) h = h - 12;
//   return `${h}:${m} ${suffix}`;
// }

// function generateTimeSlots(start = 0, end = 12 * 120, step = 15) {
//   const slots: string[] = [];
//   for (let t = start; t <= end; t += step) {
//     slots.push(minutesToHHMM(t));
//   }
//   return slots;
// }

// const TIMESLOTS = generateTimeSlots();

// /* =========================== Component =========================== */

// export default function BookingsPage() {
//   const [bookings, setBookings] = useState<Booking[]>([]);
//   const [users, setUsers] = useState<{ [key: string]: User }>({});
//   const [loading, setLoading] = useState(true);
//   const [searchTerm, setSearchTerm] = useState("");
  
//   const [statusFilter, setStatusFilter] = useState<string>("all");
//   // Create/Edit modal
//   const [showCreate, setShowCreate] = useState(false);
//   const [isEditing, setIsEditing] = useState(false);

//   const [saving, setSaving] = useState(false);
//   const [deleting, setDeleting] = useState(false);
//   const [selectedCategory, setSelectedCategory] = useState("");

//   const [editingId, setEditingId] = useState<string | null>(null);

//   // Invoice modal state
//   const [showInvoice, setShowInvoice] = useState(false);
//   const [invoiceData, setInvoiceData] = useState<Booking | null>(null);

//   // form state
//   const [branch, setBranch] = useState(BRANCH_OPTIONS[0]);
//   const [serviceDate, setServiceDate] = useState<string>(() =>
//     format(new Date(), "yyyy-MM-dd")
//   );
//   const [serviceTime, setServiceTime] = useState<string>("10:00"); // "HH:mm"
//   const [customerName, setCustomerName] = useState<string>("");
//   const [paymentMethod, setPaymentMethod] = useState<string>("cash");
//   const [customPaymentMethod, setCustomPaymentMethod] = useState<string>("");

//   const [emailConfirmation, setEmailConfirmation] = useState(false);
//   const [smsConfirmation, setSmsConfirmation] = useState(false);
//   const [status, setStatus] = useState<BookingStatus>("upcoming");
//   const [staff, setStaff] = useState<string>("");
//   const [services, setServices] = useState<BookingService[]>([
//     { ...emptyService },
//   ]);
//   const [remarks, setRemarks] = useState<string>("");
//   const [customerEmail, setCustomerEmail] = useState("");

//   const [currentPage, setCurrentPage] = useState(1);
//   const staffPerPage = 4; // show 4 staff per page

//   // Schedule board controls
//  const [scheduleDate, setScheduleDate] = useState(
//   new Date().toISOString().split("T")[0]
// );

//   const [scheduleBranch, setScheduleBranch] = useState<string>("all");
 
// const [serviceOptions, setServiceOptions] = useState<any[]>([]);

//   const fetchServices = async () => {
//     try {
//       const servicesCollection = collection(db, "services");
//       const snapshot = await getDocs(servicesCollection);
//       const servicesData = snapshot.docs.map(doc => ({
//         id: doc.id,
//         ...doc.data()
//       }));
//       setServiceOptions(servicesData);
//     } catch (error) {
//       console.error("Error fetching services:", error);
//     }
//   };

//   useEffect(() => {
//     fetchServices();
//   }, []);
//   // Dynamic staff fetched from Firestore
//   const [staffFromDB, setStaffFromDB] = useState<string[]>([]);

//   // Hour enabled/disabled state (keyed by hour string, e.g. "10", "11", "12")
//   const uniqueHours = Array.from(
//     new Set(TIMESLOTS.map((t) => t.split(":")[0]))
//   ).sort((a, b) => Number(a) - Number(b));
//   const [enabledHours, setEnabledHours] = useState<Record<string, boolean>>(
//     () => {
//       const map: Record<string, boolean> = {};
//       uniqueHours.forEach((h) => (map[h] = true));
//       return map;
//     }
//   );

//   /* -------------------- Load Staff from Firebase -------------------- */
//   useEffect(() => {
//     const loadStaff = async () => {
//       try {
//         const snap = await getDocs(collection(db, "staff"));
//         const list: string[] = [];
//         snap.forEach((d) => {
//           const data = d.data() as any;
//           if (data?.name) list.push(String(data.name));
//         });
//         // If no staff docs found, we fallback to constants
//         setStaffFromDB(list.length ? list : STAFF_FALLBACK);
//       } catch {
//         setStaffFromDB(STAFF_FALLBACK);
//       }
//     };
//     loadStaff();
//   }, []);

//   const STAFF_OPTIONS = staffFromDB; // used everywhere below

//   /* -------------------- NEW: Branches & Filters -------------------- */

//   // Branches from Firestore
//   const [branchesFromDB, setBranchesFromDB] = useState<string[]>([]);

//   // Filter states (do not conflict with existing 'staff' state)
//   const [selectedBranch, setSelectedBranch] = useState<string>("");
//   const [selectedStaffFilter, setSelectedStaffFilter] = useState<string>("");
//   const [selectedDateFilter, setSelectedDateFilter] = useState<string>("");
//   const [selectedCustomerFilter, setSelectedCustomerFilter] = useState<string>("");
//   const [selectedTimeInterval, setSelectedTimeInterval] = useState<string>("");

//   // Unique booking times (populate time dropdown)
//   const uniqueTimes = useMemo(() => {
//     const times = bookings.map((b) => b.bookingTime).filter(Boolean);
//     return Array.from(new Set(times)).sort();
//   }, [bookings]);

//   useEffect(() => {
//     const loadBranches = async () => {
//       try {
//         const snap = await getDocs(collection(db, "branches"));
//         const list: string[] = [];
//         snap.forEach((d) => {
//           const data = d.data() as any;
//           if (data?.name) list.push(String(data.name));
//         });
//         setBranchesFromDB(list);
//       } catch (e) {
//         console.error("Error loading branches:", e);
//         setBranchesFromDB(BRANCH_OPTIONS); // fallback to your constant list
//       }
//     };

//     // Also ensure staff collection (as full objects) for dropdown too
//     // (you already load staff names above into STAFF_OPTIONS, this is just to keep a structured list)
//     // but we also fetch staff docs as objects for dropdown ordering if desired
//     const loadStaffObjects = async () => {
//       try {
//         const snap = await getDocs(collection(db, "staff"));
//         // no need to overwrite your staffFromDB which is used elsewhere
//       } catch (e) {
//         // ignore
//       }
//     };

//     loadBranches();
//     loadStaffObjects();
//   }, []);

//   /* -------------------- Load bookings (Realtime) -------------------- */

//   useEffect(() => {
//   const bookingsQuery = query(
//     collection(db, "bookings"),
//     orderBy("createdAt", "desc")
//   );

//   const unsubscribe = onSnapshot(bookingsQuery, (snapshot) => {
//     const bookingsData = snapshot.docs.map((d) => {
//       const data = d.data() as any;

//       // Normalize bookingDate into a Date object
//       let bookingDate: Date;
//       if (data.bookingDate?.toDate) {
//         bookingDate = data.bookingDate.toDate(); // Firestore Timestamp
//       } else if (typeof data.bookingDate === "string") {
//         bookingDate = new Date(data.bookingDate); // String date
//       } else if (data.bookingDate?.seconds) {
//         bookingDate = new Date(data.bookingDate.seconds * 1000); // Firestore Timestamp format
//       } else {
//         bookingDate = new Date(); // fallback
//       }

//       return {
//         id: d.id,
//         userId: data.userId || "",
//         customerName: data.customerName || "",
//         services: (data.services || []) as BookingService[],
//         bookingDate,
//         bookingTime: data.bookingTime || "",
//         branch: data.branch || "",
//         staff: data.staff?.trim() || data.staffName?.trim() || "Unassigned",
//         totalPrice: data.totalPrice || 0,
//         totalDuration: data.totalDuration || 0,
//         status: (data.status as BookingStatus) || "upcoming",
//         paymentMethod: data.paymentMethod || "cash",
//         emailConfirmation: data.emailConfirmation || false,
//         smsConfirmation: data.smsConfirmation || false,
//         createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
//         updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(),
//         remarks: data.remarks ?? null,
//         customerEmail: data.customerEmail || "",
//         source: data.source || (data.bookingDate ? "mobile" : "web"),
//         loyaltyPointsEarned: data.loyaltyPointsEarned || 0,
//         loyaltyPointsUsed: data.loyaltyPointsUsed || 0,
//         tipAmount: data.tipAmount || 0,
//         rawData: data,
//       } as Booking;
//     });

//     setBookings(bookingsData);
//     setLoading(false);
//   });

//   return () => unsubscribe();
// }, []);


// useEffect(() => {
//   const fetchServices = async () => {
//     const servicesCol = collection(db, "services");
//     const serviceSnapshot = await getDocs(servicesCol);
//     const servicesList = serviceSnapshot.docs.map(doc => ({
//       id: doc.id,
//       ...doc.data()
//     })) as any[];
//     setServiceOptions(servicesList);
//   };

//   fetchServices();
// }, []);

// /* ------------------------- Load user details ------------------------- */
// useEffect(() => {
//   const loadUsers = async () => {
//     const usersQuery = query(collection(db, "users"));
//     const usersSnapshot = await getDocs(usersQuery);
//     const usersData: { [key: string]: User } = {};

//     usersSnapshot.docs.forEach((doc) => {
//       const data = doc.data() as any;
//       usersData[doc.id] = {
//         id: doc.id,
//         name: data.name || data.displayName || "Unknown User",
//         email: data.email || "",
//         phone: data.phone || data.phoneNumber || "",
//       };
//     });

//     setUsers(usersData);
//   };

//   loadUsers();
// }, []);

// /* --------------------------- Filtering logic -------------------------- */
// // Extended filtering: search/status + new filter bar values
// const filteredBookings = bookings.filter((booking) => {
//   const q = searchTerm.toLowerCase();
//   const matchesSearch =
//     booking.customerName.toLowerCase().includes(q) ||
//     booking.branch.toLowerCase().includes(q) ||
//     booking.services.some((s) => s.serviceName.toLowerCase().includes(q));

//   const matchesStatus =
//     statusFilter === "all" ||
//     booking.status === (statusFilter as BookingStatus);

//   const matchesBranch =
//     !selectedBranch || selectedBranch === "" || booking.branch === selectedBranch;

//   const matchesStaff =
//     !selectedStaffFilter || selectedStaffFilter === "" || (booking.staff ? booking.staff === selectedStaffFilter : false);

//   const matchesDate =
//     !selectedDateFilter ||
//     selectedDateFilter === "" ||
//     format(booking.bookingDate, "yyyy-MM-dd") === selectedDateFilter;

//   const matchesCustomer =
//     !selectedCustomerFilter ||
//     selectedCustomerFilter === "" ||
//     booking.customerName.toLowerCase().includes(selectedCustomerFilter.toLowerCase());

//   const matchesTime =
//     !selectedTimeInterval ||
//     selectedTimeInterval === "" ||
//     booking.bookingTime === selectedTimeInterval;

//   return matchesSearch && matchesStatus && matchesBranch && matchesStaff && matchesDate && matchesCustomer && matchesTime;
// });

// /* ------------------------- rest of your existing code continues ------------------------- */

// // const saveInvoiceToFirebase = async (invoiceData) => {
// //   try {
// //     await addDoc(collection(db, "invoices"), {
// //       ...invoiceData,
// //       createdAt: new Date(),
// //     });
// //     console.log("Invoice saved to Firebase!");
// //   } catch (err) {
// //     console.error("Error saving invoice:", err);
// //   }
// // };
// const saveInvoiceToFirebase = async (invoiceData) => {
//   try {
//     // Agar userId empty ho, to random UUID generate karo
//     const userId = invoiceData.userId || uuidv4();

//     await addDoc(collection(db, "invoices"), {
//       ...invoiceData,
//       userId, // yaha ensure kar rahe ke hamesha value ho
//        bookingId: invoiceData.id, // ✅ Add this line
//       createdAt: new Date(),
//     });
//     console.log("Invoice saved to Firebase with userId:", userId);
//   } catch (err) {
//     console.error("Error saving invoice:", err);
//   }
// };

// /* --------------------------- Update helpers --------------------------- */
// const updateBookingStatus = async (
//   bookingId: string,
//   newStatus: BookingStatus
// ) => {
//   try {
//     const bookingRef = doc(db, "bookings", bookingId);
//     await updateDoc(bookingRef, {
//       status: newStatus,
//       updatedAt: serverTimestamp(),
//     });
//   } catch (error) {
//     console.error("Error updating booking status:", error);
//     alert("Failed to update status.");
//   }
// };

// const getStatusBadge = (s: string) => {
//   switch (s) {
//     case "upcoming":
//       return "bg-blue-100 text-blue-800";
//     case "past":
//       return "bg-green-100 text-green-800";
//     case "cancelled":
//       return "bg-red-100 text-red-800";
//     default:
//       return "bg-gray-100 text-gray-800";
//   }
// };

// const getStatusBlock = (s: BookingStatus) => {
//   switch (s) {
//     case "upcoming":
//       return "bg-emerald-50 border-emerald-300 text-emerald-800";
//     case "past":
//       return "bg-gray-50 border-gray-300 text-gray-700";
//     case "cancelled":
//       return "bg-rose-50 border-rose-300 text-rose-800 line-through";
//     default:
//       return "bg-slate-50 border-slate-300 text-slate-800";
//   }
// };

// const getPaymentIcon = (method: string) => {
//   switch (method.toLowerCase()) {
//     case "card":
//     case "credit":
//     case "debit":
//       return <CreditCard className="w-4 h-4" />;
//     default:
//       return <CreditCard className="w-4 h-4" />;
//   }
// };

// /* -------------------------- Create/Edit Handlers ------------------------- */

// const resetForm = () => {
//   setBranch(BRANCH_OPTIONS[0]);
//   setServiceDate(format(new Date(), "yyyy-MM-dd"));
//   setServiceTime("10:00");
//   setCustomerName("");
//   setPaymentMethod("cash");
//   setCustomPaymentMethod("");
//   setEmailConfirmation(false);
//   setSmsConfirmation(false);
//   setStatus("upcoming");
//   setStaff("");
//   setServices([{ ...emptyService }]);
//   setRemarks("");
//   setEditingId(null);
//   setCustomerEmail("");
// };

// const openForCreate = () => {
//   resetForm();
//   setShowCreate(true);
// };

// // Open modal to CREATE, but prefill staff+time from a grid cell
// const openForCreateFromCell = (prefillStaff: string, prefillTime: string) => {
//   // If hour disabled, do nothing
//   const hour = prefillTime.split(":")[0];
//   if (!enabledHours[hour]) return;

//   resetForm();
//   setStaff(prefillStaff);
//   setServiceTime(prefillTime);
//   // Set serviceDate to scheduleDate (board date)
//   setServiceDate(scheduleDate);
//   setShowCreate(true);
// };

// const openForEdit = (b: Booking) => {
//   setEditingId(b.id);
//   setBranch(b.branch || BRANCH_OPTIONS[0]);
//   setServiceDate(format(b.bookingDate, "yyyy-MM-dd"));
//   setServiceTime(b.bookingTime || "10:00");
//   setCustomerName(b.customerName || "");
//   setPaymentMethod(b.paymentMethod || "cash");
//   setEmailConfirmation(!!b.emailConfirmation);
//   setSmsConfirmation(!!b.smsConfirmation);
//   setStatus(b.status || "upcoming");
//   setStaff(b.staff || "");
//   setServices(
//     b.services && b.services.length > 0
//       ? b.services.map((s) => ({
//           serviceId: s.serviceId || "",
//           serviceName: s.serviceName || "",
//           category: s.category || "",
//           duration: Number(s.duration) || 0,
//           price: Number(s.price) || 0,
//           quantity: Number(s.quantity) || 1,
//         }))
//       : [{ ...emptyService }]
//   );
//   setRemarks(b.remarks || "");
//   setCustomerEmail(b.customerEmail || "");
//   setShowCreate(true);
// };

// const handleAddServiceRow = () => {
//   setServices((prev) => [...prev, { ...emptyService }]);
// };

// const handleRemoveServiceRow = (index: number) => {
//   setServices((prev) => prev.filter((_, i) => i !== index));
// };

// const handleServiceChange = (idx: number, field: string, value: any) => {
//   setServices((prev) =>
//     prev.map((s, i) => {
//       if (i !== idx) return s;

//       // If serviceName is changed, auto-fill price & duration
//       if (field === "serviceName") {
//         const selectedService = serviceOptions.find(
//           (service) => service.name === value
//         );
//         if (selectedService) {
//           return {
//             ...s,
//             serviceName: value,
//             duration: selectedService.duration || 0,
//             price: selectedService.price || 0,
//             category: selectedService.category || s.category,
//           };
//         }
//       }

//       // If category or other fields are changed, just update normally
//       return { ...s, [field]: value };
//     })
//   );
// };


// const formTotals = calcTotals(services);

// const validateForm = () => {
//   if (!customerName.trim()) return "Customer name is required";
//   if (!serviceDate) return "Service date is required";
//   if (!serviceTime) return "Service time is required";
//   if (!branch) return "Branch is required";
//   if (!staff) return "Staff is required";
//   if (services.length === 0) return "Add at least one service";
//   const hasName = services.every((s) => s.serviceName.trim().length > 0);
//   if (!hasName) return "Each service must have a name";
//   // also ensure selected time hour is enabled
//   const selectedHour = serviceTime.split(":")[0];
//   if (!enabledHours[selectedHour])
//     return "Selected time falls into a disabled hour";
//   return null;
// };

// const saveBooking = async () => {
//   const err = validateForm();
//   if (err) {
//     alert(err);
//     return;
//   }

//   try {
//     setSaving(true);

//     const payload = {
//       //userId: "",
//        userId: uuidv4(), 
//       customerName: customerName.trim(),
//       services: services.map((s) => ({
//         ...s,
//         price: Number(s.price) || 0,
//         duration: Number(s.duration) || 0,
//         quantity: Number(s.quantity) || 0,
//       })),
//       bookingDate: Timestamp.fromDate(new Date(serviceDate + "T00:00:00")),
//       bookingTime: serviceTime, // "HH:mm"
//       branch,
//       customerEmail: customerEmail.trim(), // add this
//       staff: staff || null, // name string
//       totalPrice: formTotals.totalPrice,
//       totalDuration: formTotals.totalDuration,
//       status,
//       paymentMethod: paymentMethod === "custom" ? customPaymentMethod : paymentMethod,
//       emailConfirmation,
//       smsConfirmation,
//       updatedAt: serverTimestamp(),
//       remarks: remarks || null,
//     };

//     if (editingId) {
//       const ref = doc(db, "bookings", editingId);
//       await updateDoc(ref, payload);
//     } else {
//       await addDoc(collection(db, "bookings"), {
//         ...payload,
//         createdAt: serverTimestamp(),
//       });
//     }

//     setShowCreate(false);
//     resetForm();
//   } catch (e) {
//     console.error("Error saving booking:", e);
//     alert("Failed to save booking. Check console for details.");
//   } finally {
//     setSaving(false);
//   }
// };

// const deleteBooking = async () => {
//   if (!editingId) return;
//   if (!confirm("Delete this booking? This action cannot be undone.")) return;

//   try {
//     setDeleting(true);
//     await deleteDoc(doc(db, "bookings", editingId));
//     setShowCreate(false);
//     resetForm();
//   } catch (e) {
//     console.error("Error deleting booking:", e);
//     alert("Failed to delete booking.");
//   } finally {
//     setDeleting(false);
//   }
// };

// /* ------------------------------ Schedule Board Data ------------------------------ */

// const bookingsForSchedule = useMemo(() => {
//   const target = new Date(scheduleDate + "T00:00:00");
//   return filteredBookings.filter((b) => {
//     const sameDay = isSameDay(b.bookingDate, target);
//     const branchOk = scheduleBranch === "all" || b.branch === scheduleBranch;
//     return sameDay && branchOk;
//   });
// }, [filteredBookings, scheduleDate, scheduleBranch]);

// // fast lookup: { 'HH:mm': { staffName: Booking[] } }

// const scheduleMatrix = useMemo(() => {
//   const map: Record<string, Record<string, Booking[]>> = {};

//   // Initialize empty slots
//   TIMESLOTS.forEach((t) => {
//     map[t] = {};
//     STAFF_OPTIONS.forEach((s) => (map[t][s] = []));
//     map[t]["Unassigned"] = [];
//   });
// filteredBookings.forEach((b) => {
//   let bookingDateObj: Date;

//   if (b.bookingDate instanceof Date) {
//     bookingDateObj = b.bookingDate;
//   } else if (typeof b.bookingDate === "string") {
//     bookingDateObj = new Date(b.bookingDate);
//   } else if (b.bookingDate?.seconds) {
//     // Firestore timestamp object
//     bookingDateObj = new Date(b.bookingDate.seconds * 1000);
//   } else {
//     console.error("Invalid bookingDate:", b.bookingDate);
//     return; // skip invalid booking
//   }

//   const matchDate = format(bookingDateObj, "yyyy-MM-dd") === scheduleDate;
//   const matchBranch = scheduleBranch === "all" || b.branch === scheduleBranch;
//   const hour = b.bookingTime?.split(":")[0] ?? "";
//   const hourEnabled = !!enabledHours[hour];

//   if (!matchDate || !matchBranch || !hourEnabled) return;

//   const t = b.bookingTime;
//   const sName =
//     b.staff && STAFF_OPTIONS.includes(b.staff) ? b.staff : "Unassigned";

//   if (!map[t]) map[t] = {};
//   if (!map[t][sName]) map[t][sName] = [];

//   map[t][sName].push(b);
// });

// return map;
// }, [filteredBookings, scheduleDate, scheduleBranch, STAFF_OPTIONS, enabledHours]);


//   /* -------------------------- Invoice Helpers ------------------------- */

//   const openInvoice = (booking: Booking) => {
//     setInvoiceData(booking);
//     setShowInvoice(true);
//   };

//   const downloadInvoicePDF = async () => {
//     const input = document.getElementById("invoice-content");
//     if (!input) return;

//     const imgData = await toPng(input, { cacheBust: true });

//     // Custom smaller page size in mm (e.g., 150 x 200)
//     const pdfWidth = 150;
//     const pdfHeight = 180;
//     const pdf = new jsPDF({
//       orientation: "p",
//       unit: "mm",
//       format: [pdfWidth, pdfHeight],
//     });

//     // Fit content inside smaller page
//     const contentWidth = pdfWidth - 10; // small margin
//     const contentHeight =
//       (input.offsetHeight * contentWidth) / input.offsetWidth;

//     const x = 5; // horizontal margin
//     const y = 5; // vertical margin

//     pdf.addImage(imgData, "PNG", x, y, contentWidth, contentHeight);
//    // pdf.save(`invoice_${Date.now()}.pdf`);
//    pdf.save(`invoice_${invoiceData?.id || Date.now()}.pdf`);

//     await saveInvoiceToFirebase(invoiceData);
//   };
//   const today = new Date().toISOString().split("T")[0]; // "YYYY-MM-DD"



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
//     <AccessWrapper>
//       <div>
//         <div className="max-w-6xl mx-auto dark:text-white ">
//           {/* Header */}
//           <div className="relative mb-8 overflow-hidden rounded-2xl bg-gradient-to-br from-purple-600 via-pink-600 to-blue-600 animate-gradient-x">
//             <div className="absolute inset-0 bg-black/20"></div>
//             <div className="relative px-8 py-12">
//               <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
//                 <div className="space-y-4">
//                   <div className="flex items-center gap-3">
//                     <div className="p-3 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 animate-float">
//                       <Calendar className="w-8 h-8 text-white animate-pulse-slow" />
//                     </div>
//                     <div>
//                       <h1 className="text-4xl lg:text-5xl font-bold text-white mb-2 animate-fade-in">
//                         Bookings Management
//                       </h1>
//                       <div className="h-1 w-32 bg-gradient-to-r from-yellow-400 to-pink-400 rounded-full animate-slide-up"></div>
//                     </div>
//                   </div>
//                   <p className="text-white/90 text-lg max-w-2xl leading-relaxed animate-fade-in-delay">
//                     Streamline your appointment scheduling with our comprehensive booking management system. 
//                     Track, organize, and optimize all customer appointments effortlessly.
//                   </p>
//                   <div className="flex items-center gap-4 text-white/80 text-sm animate-slide-down">
//                     <div className="flex items-center gap-2">
//                       <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
//                       <span>Real-time Updates</span>
//                     </div>
//                     <div className="flex items-center gap-2">
//                       <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
//                       <span>Multi-branch Support</span>
//                     </div>
//                     <div className="flex items-center gap-2">
//                       <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
//                       <span>Smart Scheduling</span>
//                     </div>
//                   </div>
//                 </div>

//                 <div className="flex flex-col sm:flex-row gap-3 animate-float-delay">
//                   <button
//                     onClick={openForCreate}
//                     className="group relative px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 animate-bounce-gentle"
//                   >
//                     <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-teal-700 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
//                     <div className="relative flex items-center gap-2">
//                       <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
//                       <span>Add Schedule</span>
//                     </div>
//                     <div className="absolute inset-0 rounded-xl bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-pulse"></div>
//                   </button>
//                 </div>
//               </div>
//             </div>
            
//             {/* Decorative Elements */}
//             <div className="absolute top-4 right-4 w-20 h-20 bg-white/10 rounded-full animate-float"></div>
//             <div className="absolute bottom-4 left-4 w-16 h-16 bg-white/5 rounded-full animate-float-delay"></div>
//             <div className="absolute top-1/2 right-1/4 w-12 h-12 bg-white/5 rounded-full animate-bounce-subtle"></div>
//           </div>

//           {/* 🔽 FILTER BAR (ADDED) 🔽 */}
//           <div className="mb-6">
//             <div className="w-full flex flex-wrap items-center gap-3 mb-4 bg-white/80 dark:bg-slate-800/60 p-4 rounded-2xl shadow-sm">
//               {/* Branch */}
//               <div>
//                 <label className="text-xs block mb-1">Branch</label>
//                 <select
//                   value={selectedBranch}
//                   onChange={(e) => setSelectedBranch(e.target.value)}
//                   className="border rounded-lg px-3 py-2"
//                 >
//                   <option value="">All Branches</option>
//                   {/* prefer DB branches; fallback to BRANCH_OPTIONS */}
//                   {(branchesFromDB.length ? branchesFromDB : BRANCH_OPTIONS).map((b) => (
//                     <option key={b} value={b}>{b}</option>
//                   ))}
//                 </select>
//               </div>

//               {/* Staff */}
//               <div>
//                 <label className="text-xs block mb-1">Staff</label>
//                 <select
//                   value={selectedStaffFilter}
//                   onChange={(e) => setSelectedStaffFilter(e.target.value)}
//                   className="border rounded-lg px-3 py-2"
//                 >
//                   <option value="">All Staff</option>
//                   {STAFF_OPTIONS.map((s) => (
//                     <option key={s} value={s}>{s}</option>
//                   ))}
//                 </select>
//               </div>

//               {/* Date */}
//               <div>
//                 <label className="text-xs block mb-1">Date</label>
//                 <input
//                   type="date"
//                   value={selectedDateFilter}
//                   onChange={(e) => setSelectedDateFilter(e.target.value)}
//                   className="border rounded-lg px-3 py-2"
//                 />
//               </div>

//               {/* Customer */}
//               <div className="flex-1 min-w-[200px]">
//                 <label className="text-xs block mb-1">Customer</label>
//                 <input
//                   type="text"
//                   placeholder="Search customer"
//                   value={selectedCustomerFilter}
//                   onChange={(e) => setSelectedCustomerFilter(e.target.value)}
//                   className="border rounded-lg px-3 py-2 w-full"
//                 />
//               </div>

//               {/* Time Interval */}
//               <div>
//                 <label className="text-xs block mb-1">Time</label>
//                 <select
//                   value={selectedTimeInterval}
//                   onChange={(e) => setSelectedTimeInterval(e.target.value)}
//                   className="border rounded-lg px-3 py-2"
//                 >
//                   <option value="">All Times</option>
//                   {uniqueTimes.map((time) => (
//                     <option key={time} value={time}>
//                       {toDisplayAMPM(time)} ({time})
//                     </option>
//                   ))}
//                 </select>
//               </div>

//               {/* Clear filters button */}
//               <div className="ml-auto self-end">
//                 <button
//                   onClick={() => {
//                     setSelectedBranch("");
//                     setSelectedStaffFilter("");
//                     setSelectedDateFilter("");
//                     setSelectedCustomerFilter("");
//                     setSelectedTimeInterval("");
//                   }}
//                   className="px-3 py-2 bg-gray-100 rounded-md text-sm hover:bg-gray-200"
//                 >
//                   Clear Filters
//                 </button>
//               </div>
//             </div>
//           </div>
//           {/* 🔼 FILTER BAR (ADDED) 🔼 */}

//           {/* Unified Schedule Dashboard & Statistics */}
//           <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-50 via-white to-purple-50 border border-white/20 shadow-xl backdrop-blur-sm p-6 mb-6 w-[1000px] animate-fade-in">
//             <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-pink-500/5"></div>
            
//             {/* Header */}
//             <div className="relative mb-6">
//               <div className="flex items-center gap-3">
//                 <div className="p-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 shadow-lg animate-float">
//                   <Calendar className="w-5 h-5 text-white" />
//                 </div>
//                 <h3 className="text-lg font-semibold text-gray-800">Schedule Dashboard & Controls</h3>
//                 <div className="flex-1 h-px bg-gradient-to-r from-indigo-200 via-purple-200 to-transparent"></div>
//               </div>
//             </div>

//             {/* Stats Cards Section */}
//             <div className="relative mb-8">
//               <div className="flex items-center gap-2 mb-4">
//                 <div className="p-1.5 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-600 shadow-md animate-pulse-slow">
//                   <CheckCircle className="w-4 h-4 text-white" />
//                 </div>
//                 <h4 className="text-sm font-medium text-gray-700">Booking Statistics</h4>
//                 <div className="flex-1 h-px bg-gradient-to-r from-blue-200 to-transparent"></div>
//               </div>
              
//               <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
//                 <div className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-blue-50 via-white to-blue-100 border border-blue-200/50 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
//                   <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-cyan-500/5"></div>
//                   <div className="relative p-4">
//                     <div className="flex items-center">
//                       <div className="p-2 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-lg shadow-md group-hover:scale-110 transition-transform duration-300">
//                         <Calendar className="w-4 h-4 text-white" />
//                       </div>
//                       <div className="ml-3">
//                         <p className="text-xs font-medium text-gray-600 group-hover:text-blue-700 transition-colors duration-300">
//                           Total Bookings
//                         </p>
//                         <p className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
//                           {filteredBookings.length}
//                         </p>
//                       </div>
//                     </div>
//                   </div>
//                 </div>

//                 <div className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-green-50 via-white to-emerald-100 border border-green-200/50 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
//                   <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 to-emerald-500/5"></div>
//                   <div className="relative p-4">
//                     <div className="flex items-center">
//                       <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg shadow-md group-hover:scale-110 transition-transform duration-300">
//                         <CheckCircle className="w-4 h-4 text-white" />
//                       </div>
//                       <div className="ml-3">
//                         <p className="text-xs font-medium text-gray-600 group-hover:text-green-700 transition-colors duration-300">Upcoming</p>
//                         <p className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
//                           {filteredBookings.filter((b) => b.status === "upcoming").length}
//                         </p>
//                       </div>
//                     </div>
//                   </div>
//                 </div>

//                 <div className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-amber-50 via-white to-yellow-100 border border-amber-200/50 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
//                   <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 to-yellow-500/5"></div>
//                   <div className="relative p-4">
//                     <div className="flex items-center">
//                       <div className="p-2 bg-gradient-to-r from-amber-500 to-yellow-600 rounded-lg shadow-md group-hover:scale-110 transition-transform duration-300">
//                         <AlertCircle className="w-4 h-4 text-white" />
//                       </div>
//                       <div className="ml-3">
//                         <p className="text-xs font-medium text-gray-600 group-hover:text-amber-700 transition-colors duration-300">Past</p>
//                         <p className="text-2xl font-bold bg-gradient-to-r from-amber-600 to-yellow-600 bg-clip-text text-transparent">
//                           {filteredBookings.filter((b) => b.status === "past").length}
//                         </p>
//                       </div>
//                     </div>
//                   </div>
//                 </div>

//                 <div className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-red-50 via-white to-rose-100 border border-red-200/50 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
//                   <div className="absolute inset-0 bg-gradient-to-r from-red-500/5 to-rose-500/5"></div>
//                   <div className="relative p-4">
//                     <div className="flex items-center">
//                       <div className="p-2 bg-gradient-to-r from-red-500 to-rose-600 rounded-lg shadow-md group-hover:scale-110 transition-transform duration-300">
//                         <XCircle className="w-4 h-4 text-white" />
//                       </div>
//                       <div className="ml-3">
//                         <p className="text-xs font-medium text-gray-600 group-hover:text-red-700 transition-colors duration-300">Cancelled</p>
//                         <p className="text-2xl font-bold bg-gradient-to-r from-red-600 to-rose-600 bg-clip-text text-transparent">
//                           {filteredBookings.filter((b) => b.status === "cancelled").length}
//                         </p>
//                       </div>
//                     </div>
//                   </div>
//                 </div>
//               </div>
//             </div>

//             {/* Schedule Controls Section */}
//             <div className="relative">
//               <div className="flex items-center gap-2 mb-4">
//                 <div className="p-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-orange-600 shadow-md animate-pulse-slow">
//                   <Clock className="w-4 h-4 text-white" />
//                 </div>
//                 <h4 className="text-sm font-medium text-gray-700">Available Hours</h4>
//                 <div className="flex-1 h-px bg-gradient-to-r from-amber-200 to-transparent"></div>
//               </div>
              
//               <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-2">
//                 {uniqueHours.map((h, index) => (
//                   <label key={h} className="group relative cursor-pointer animate-fade-in-delay" style={{ animationDelay: `${index * 50}ms` }}>
//                     <input
//                       type="checkbox"
//                       checked={!!enabledHours[h]}
//                       onChange={(e) =>
//                         setEnabledHours((prev) => ({
//                           ...prev,
//                           [h]: e.target.checked,
//                         }))
//                       }
//                       className="sr-only"
//                     />
//                     <div className={`
//                       relative px-3 py-2 rounded-xl text-xs font-medium text-center transition-all duration-300 transform
//                       ${enabledHours[h] 
//                         ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg scale-105 animate-bounce-gentle' 
//                         : 'bg-white/60 text-gray-600 border border-gray-200 hover:bg-gray-50 hover:scale-105'
//                       }
//                       group-hover:shadow-xl
//                     `}>
//                       <div className="flex items-center justify-center gap-1">
//                         {enabledHours[h] && (
//                           <CheckCircle className="w-3 h-3 animate-spin-slow" />
//                         )}
//                         <span>{toDisplayAMPM(`${h}:00`)}</span>
//                       </div>
                      
//                       {/* Toggle indicator */}
//                       <div className={`
//                         absolute -top-1 -right-1 w-3 h-3 rounded-full transition-all duration-300
//                         ${enabledHours[h] 
//                           ? 'bg-green-400 animate-ping' 
//                           : 'bg-gray-300 opacity-0 group-hover:opacity-100'
//                         }
//                       `}></div>
//                     </div>
//                   </label>
//                 ))}
//               </div>
              
//               {/* Toggle All Controls */}
//               <div className="flex gap-2 mt-4">
//                 <button
//                   onClick={() => setEnabledHours(Object.fromEntries(uniqueHours.map(h => [h, true])))}
//                   className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-xs rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105 animate-fade-in-delay-2"
//                 >
//                   Enable All
//                 </button>
//                 <button
//                   onClick={() => setEnabledHours(Object.fromEntries(uniqueHours.map(h => [h, false])))}
//                   className="px-4 py-2 bg-gradient-to-r from-red-500 to-rose-600 text-white text-xs rounded-lg hover:from-red-600 hover:to-rose-700 transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105 animate-fade-in-delay-3"
//                 >
//                   Disable All
//                 </button>
//               </div>
//             </div>
            
//             {/* Decorative Elements */}
//             <div className="absolute top-2 right-2 w-16 h-16 bg-gradient-to-br from-indigo-400/20 to-purple-400/20 rounded-full animate-float-delay"></div>
//             <div className="absolute bottom-2 left-2 w-12 h-12 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full animate-bounce-subtle"></div>
//           </div>

          
              
//               <div className="flex flex-col md:flex-row gap-4">
//                 <div className="flex-1">
//                   <div className="relative group">

//                     <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/10 to-purple-500/10 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                 
              
//               </div>
//             </div>
            
//             {/* Decorative Elements */}
//             <div className="absolute top-2 right-2 w-16 h-16 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full animate-float-delay"></div>
//             <div className="absolute bottom-2 left-2 w-12 h-12 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full animate-bounce-subtle"></div>
//           </div>



//           {/* Schedule Board */}
//           <div className="  relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-50 via-white to-gray-100 border border-white/20 shadow-2xl backdrop-blur-sm mb-10  animate-fade-in">
//             <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 via-purple-500/5 to-pink-500/5"></div>
            
//             {/* Header with title and decorative elements */}
//             <div className="relative p-6 border-b border-gray-200/50 bg-gradient-to-r from-gray-50 to-white">
//               <div className="flex items-center gap-3">
//                 <div className="p-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 shadow-lg animate-float">
//                   <Calendar className="w-5 h-5 text-white" />
//                 </div>
//                 <h3 className="text-xl font-bold text-gray-800">Schedule Board</h3>
//                 <div className="flex-1 h-px bg-gradient-to-r from-indigo-200 via-purple-200 to-transparent"></div>
//               </div>
//               <div className="absolute top-2 right-2 w-12 h-12 bg-gradient-to-br from-indigo-400/20 to-purple-400/20 rounded-full animate-bounce-subtle"></div>
//             </div>

//             <div className="relative overflow-x-auto w-full">
//               <div className="w-full relative">
//                 <div
//                   className="grid sticky top-0 z-20"
//                   style={{
//                     gridTemplateColumns: `180px repeat(${STAFF_OPTIONS.length},  200px)`,
//                   }}
//                 >
//                   <div className="bg-gradient-to-r from-gray-800 to-gray-900 text-white border-b border-gray-600 px-4 py-4 font-bold sticky left-0 z-30 shadow-lg">
//                     <div className="flex items-center gap-2">
//                       <Clock className="w-4 h-4" />
//                       Time
//                     </div>
//                   </div>
//                   {STAFF_OPTIONS.map((sName, index) => (
//                     <div
//                       key={sName}
//                       className={`bg-gradient-to-r ${
//                         index % 2 === 0 
//                           ? 'from-blue-500 to-indigo-600' 
//                           : 'from-purple-500 to-pink-600'
//                       } text-white border-b border-white/20 px-4 py-4 font-bold text-center shadow-lg animate-fade-in-delay`}
//                       style={{ animationDelay: `${index * 100}ms` }}
//                     >
//                       <div className="flex items-center justify-center gap-2">
//                         <User className="w-4 h-4" />
//                         {sName}
//                       </div>
//                     </div>
//                   ))}
//                 </div>
//     </div>

//     <div>
//       {TIMESLOTS.map((t) => {
//         const hour = t.split(":")[0].padStart(2, "0"); // normalize hour
//         const hourEnabled = !!enabledHours[hour];

//         return (
//           <div
//             key={t}
//             className="grid"
//             style={{
//               gridTemplateColumns: `180px repeat(${STAFF_OPTIONS.length}, 200px)`,
//             }}
//           >
//             <div className="sticky left-0 z-10 bg-gray-50 border-t border-b px-4 py-3 font-medium">
//               {toDisplayAMPM(t)}
//             </div>

//             {STAFF_OPTIONS.map((sName) => {
               
// // helper: normalize date string to YYYY-MM-DD safely (without timezone shift)
// const formatDate = (dateStr: string | Date) => {
//   const d = new Date(dateStr);
//   return `${d.getFullYear()}-${(d.getMonth() + 1)
//     .toString()
//     .padStart(2, "0")}-${d.getDate().toString().padStart(2, "0")}`;
// };

// // get today's and yesterday's local date
// const today = new Date();
// const yesterday = new Date();
// yesterday.setDate(today.getDate() - 1);

// const allowedDates = [formatDate(yesterday), formatDate(today)];

// const allItems = filteredBookings.filter((b) => {
//   const bookingDay = formatDate(b.bookingDate);

//   const normalizeTime = (timeStr: string) => {
//     if (!timeStr) return "";
//     let [hh, mm] = timeStr.split(":");
//     if (!mm) mm = "00";
//     const lowerTime = timeStr.toLowerCase();
//     const isPM = lowerTime.includes("pm");
//     const isAM = lowerTime.includes("am");
//     hh = hh.replace(/\D/g, "");
//     let hourNum = parseInt(hh, 10);
//     if (isPM && hourNum !== 12) hourNum += 12;
//     if (isAM && hourNum === 12) hourNum = 0;
//     return `${hourNum.toString().padStart(2, "0")}:${mm.substring(0, 2)}`;
//   };

//   const normalizedBookingTime = normalizeTime(b.bookingTime);

//   // booking start and end (minutes from midnight)
//   const [startHour, startMin] = normalizedBookingTime.split(":").map(Number);
//   const bookingStart = startHour * 60 + startMin;
//   const bookingEnd = bookingStart + (b.totalDuration || 30); // default 30 min

//   // current slot in minutes
//   const normalizedSlotTime = normalizeTime(t);
//   const [slotHour, slotMin] = normalizedSlotTime.split(":").map(Number);
//   const slotMinutes = slotHour * 60 + slotMin;

//   const staffMatch = b.staff ? b.staff === sName : true;

//   // ⬇️ NEW CONDITION
//   return (
//     staffMatch &&
//     allowedDates.includes(bookingDay) &&
//     slotMinutes >= bookingStart &&
//     slotMinutes < bookingEnd
//   );
// });

  
//               return (
//                 <div
//                   key={`${t}-${sName}`}
//                   className={`border-t border-b border-l px-2 py-2 min-h-[64px] ${
//                     !hourEnabled
//                       ? "bg-gray-50 opacity-70 pointer-events-none"
//                       : ""
//                   }`}
//                   onClick={(e) => {
//                     if (!hourEnabled) return;
//                     if (allItems.length === 0) {
//                       openForCreateFromCell(sName, t);
//                     }
//                   }}
//                 >
//                   <div className="space-y-2">
//                     {allItems.map((b) => (
//                       <button
//                         key={b.id}
//                         onClick={(e) => {
//                           e.stopPropagation();
//                           openForEdit(b);
//                         }}
//                         className={`w-full text-left text-xs rounded-md border px-2 py-2 hover:shadow transition ${getStatusBlock(
//                           b.status
//                         )}`}
//                         title={`${b.customerName} @ ${b.bookingTime}`}
//                       >
//                         <div className="flex justify-between items-start">
//                           <div className="font-semibold truncate">
//                             {b.customerName}
//                           </div>
//                           <div className="flex items-center gap-2">
//                             <button onClick={(ev) => {
//                                 ev.stopPropagation();
//                                 openInvoice(b);
//                               }}
//                               className="text-xs px-2 py-0.5 rounded bg-indigo-100 text-indigo-700"
//                               title="Generate Invoice"
//                             >
//                               Invoice
//                             </button>
//                             <span className="text-[11px] opacity-80">
//                               {toDisplayAMPM(b.bookingTime)}
//                             </span>
//                           </div>
//                         </div>
//                         <div className="truncate text-[12px]">
//                           {b.services.map((s) => s.serviceName).join(", ")}
//                         </div>
//                         <div className="flex items-center text-[11px] opacity-80 mt-1">
//                           <Clock className="w-3 h-3 mr-1" />
//                           {toDisplayAMPM(b.bookingTime)} • {b.totalDuration}m
//                         </div>
//                         <div className="flex items-center text-[11px] opacity-80 mt-1">
//                           <CreditCard className="w-3 h-3 mr-1" />
//                           {b.paymentMethod || "cash"}
//                         </div>
//                       </button>
//                     ))}

//                     {allItems.length === 0 && hourEnabled && (
//                       <div className="w-full h-full flex items-center justify-center">
//                         <button
//                           className="text-[11px] text-emerald-700 hover:text-emerald-900 underline"
//                           onClick={() => openForCreateFromCell(sName, t)}
//                         >
//                           Add here
//                         </button>
//                       </div>
//                     )}

//                     {allItems.length === 0 && !hourEnabled && (
//                       <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">
//                         Disabled
//                       </div>
//                     )}
//                   </div>
//                 </div>
//               );
//             })}
//           </div>
//         );
//       })}
//     </div>
//   </div>
// </div>

                     

//           {filteredBookings.length === 0 && (
//             <div className="text-center py-12">
//               <Calendar className="mx-auto h-12 w-12 text-gray-400" />
//               <h3 className="mt-2 text-sm font-medium text-gray-900">
//                 No bookings found
//               </h3>
//               <p className="mt-1 text-sm text-gray-500">
//                 {searchTerm || statusFilter !== "all"
//                   ? "Try adjusting your search or filter criteria."
//                   : "No bookings have been made yet."}
//               </p>
//             </div>
//           )}
//         </div>

//         {/* ===================== CREATE / EDIT MODAL ===================== */}
//         {showCreate && (
//   <div className="fixed inset-0 bg-gray-600 bg-opacity-50 z-50 overflow-y-auto h-full w-full">
//     <div className="relative top-10 mx-auto w-11/12 md:w-4/5 lg:w-3/4 xl:w-2/3">
//       <div className="bg-white rounded-lg shadow-xl border">
//         {/* Header */}
//         <div className="flex items-center justify-between px-6 py-4 border-b">
//           <h3 className="text-lg font-semibold">
//             {editingId ? "Edit Schedule" : "Add Schedule"}
//           </h3>
//           <div className="flex items-center gap-2">
//             {editingId && (
//               <button
//                 onClick={deleteBooking}
//                 disabled={deleting}
//                 className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-white bg-red-600 hover:bg-red-700 disabled:opacity-60"
//                 title="Delete booking"
//               >
//                 <Trash2 className="w-4 h-4" />
//                 Delete
//               </button>
//             )}
//             {editingId && (
//               <button
//                 onClick={() => {
//                   const booking = bookings.find((b) => b.id === editingId);
//                   if (booking) openInvoice(booking);
//                 }}
//                 className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
//                 title="Generate Invoice"
//               >
//                 Invoice
//               </button>
//             )}
//             <button
//               onClick={() => {
//                 setShowCreate(false);
//                 resetForm();
//               }}
//               className="text-gray-400 hover:text-gray-600"
//               title="Close"
//             >
//               <XCircle className="w-6 h-6" />
//             </button>
//           </div>
//         </div>

//         {/* Body */}
//         <div className="p-6 space-y-6">
//           {/* Top selects */}
//           <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
//             <div>
//               <label className="block text-sm font-medium text-gray-700">
//                 Branch
//               </label>
//               <select
//                 className="mt-1 w-full border rounded-md px-3 py-2"
//                 value={branch}
//                 onChange={(e) => setBranch(e.target.value)}
//               >
//                 {BRANCH_OPTIONS.map((b) => (
//                   <option key={b} value={b}>
//                     {b}
//                   </option>
//                 ))}
//               </select>
//             </div>

//             <div>
//               <label className="block text-sm font-medium text-gray-700">
//                 Customer Email
//               </label>
//               <input
//                 type="email"
//                 placeholder="Customer email"
//                 className="mt-1 w-full border rounded-md px-3 py-2"
//                 value={customerEmail}
//                 onChange={(e) => setCustomerEmail(e.target.value)}
//               />
//             </div>

//             {/* Category Select */}
//             <div>
//               <label className="block text-sm font-medium text-gray-700">
//                 Category
//               </label>
//               <select
//                 className="mt-1 w-full border rounded-md px-3 py-2"
//                 value={selectedCategory}
//                 onChange={(e) => setSelectedCategory(e.target.value)}
//               >
//                 <option value="">Select One</option>
//                 {Array.from(new Set(serviceOptions.map((s) => s.category))).map(
//                   (c) => (
//                     <option key={c} value={c}>
//                       {c}
//                     </option>
//                   )
//                 )}
//               </select>
//             </div>

//             <div>
//               <label className="block text-sm font-medium text-gray-700">
//                 Staff
//               </label>
//               <select
//                 className="mt-1 w-full border rounded-md px-3 py-2"
//                 value={staff}
//                 onChange={(e) => setStaff(e.target.value)}
//               >
//                 <option value="">Select One</option>
//                 {STAFF_OPTIONS.map((s) => (
//                   <option key={s} value={s}>
//                     {s}
//                   </option>
//                 ))}
//               </select>
//             </div>

//             {/* Payment Method */}
            

//  <div>
//               <label className="block text-sm font-medium text-gray-700">
//                 Payment Method
//               </label>
//               <select
//                 className="mt-1 w-full border rounded-md px-3 py-2"
//                 value={paymentMethod}
//                 onChange={(e) => {
//                   setPaymentMethod(e.target.value);
//                   if (e.target.value !== "custom") {
//                     setCustomPaymentMethod("");
//                   }
//                 }}
//               >
//                 {PAYMENT_METHODS.map((p) => (
//                   <option key={p} value={p}>
//                     {p.toUpperCase()}
//                   </option>
//                 ))}
//               </select>

//               {paymentMethod === "custom" && (
//                 <div className="mt-2">
//                   <label className="block text-sm font-medium text-gray-700">
//                     Custom Payment Method
//                   </label>
//                   <input
//                     type="text"
//                     className="mt-1 w-full border rounded-md px-3 py-2"
//                     placeholder="Enter custom payment method"
//                     value={customPaymentMethod}
//                     onChange={(e) => setCustomPaymentMethod(e.target.value)}
//                   />
//                 </div>
//               )}
//             </div>
//           </div>
  



//           {/* Date & Time */}
//           <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//             <div>
//               <label className="block text-sm font-medium text-gray-700">
//                 Service Date
//               </label>
//               <input
//                 type="date"
//                 className="mt-1 w-full border rounded-md px-3 py-2"
//                 value={serviceDate}
//                 onChange={(e) => setServiceDate(e.target.value)}
//               />
//             </div>
//             <div>
//               <label className="block text-sm font-medium text-gray-700">
//                 Time Slot
//               </label>
//               <select
//                 className="mt-1 w-full border rounded-md px-3 py-2"
//                 value={serviceTime}
//                 onChange={(e) => setServiceTime(e.target.value)}
//               >
//                 {TIMESLOTS.filter((slot) => {
//                   const hour = slot.split(":")[0];
//                   return !!enabledHours[hour];
//                 }).map((slot) => (
//                   <option key={slot} value={slot}>
//                     {toDisplayAMPM(slot)}
//                   </option>
//                 ))}
//               </select>
//             </div>
//             <div>
//               <label className="block text-sm font-medium text-gray-700">
//                 Customer
//               </label>
//               <input
//                 type="text"
//                 placeholder="Customer name"
//                 className="mt-1 w-full border rounded-md px-3 py-2"
//                 value={customerName}
//                 onChange={(e) => setCustomerName(e.target.value)}
//               />
//             </div>
//           </div>

//           {/* Services table */}
//           <div className="border rounded-lg">
//             <div className="grid grid-cols-12 gap-2 px-4 py-3 bg-gray-50 text-xs font-semibold">
//               <div className="col-span-4">Service</div>
//               <div className="col-span-2">Duration (min)</div>
//               <div className="col-span-2">Price</div>
//               <div className="col-span-1">Qty</div>
//               <div className="col-span-1 text-right">—</div>
//             </div>

//             {services.map((s, idx) => (
//               <div
//                 key={idx}
//                 className="grid grid-cols-12 gap-2 px-4 py-3 border-t"
//               >
//                 <div className="col-span-4">
//                   <select
//                     className="w-full border rounded-md px-3 py-2"
//                     value={s.serviceName}
//                     onChange={(e) =>
//                       handleServiceChange(idx, "serviceName", e.target.value)
//                     }
//                   >
//                     <option value="">Select a service</option>
//                     {serviceOptions
//                       .filter((service) =>
//                         selectedCategory
//                           ? service.category === selectedCategory
//                           : true
//                       )
//                       .map((service) => (
//                         <option key={service.id} value={service.name}>
//                           {service.name}
//                         </option>
//                       ))}
//                   </select>
//                 </div>
//                 <div className="col-span-2">
//                   <input
//                     type="number"
//                     min={0}
//                     className="w-full border rounded-md px-3 py-2"
//                     value={s.duration}
//                     onChange={(e) =>
//                       handleServiceChange(
//                         idx,
//                         "duration",
//                         Number(e.target.value || 0)
//                       )
//                     }
//                   />
//                 </div>
//                 <div className="col-span-2">
//                   <input
//                     type="number"
//                     min={0}
//                     step="0.01"
//                     className="w-full border rounded-md px-3 py-2"
//                     value={s.price}
//                     onChange={(e) =>
//                       handleServiceChange(
//                         idx,
//                         "price",
//                         Number(e.target.value || 0)
//                       )
//                     }
//                   />
//                 </div>
//                 <div className="col-span-1">
//                   <input
//                     type="number"
//                     min={1}
//                     className="w-full border rounded-md px-3 py-2"
//                     value={s.quantity}
//                     onChange={(e) =>
//                       handleServiceChange(
//                         idx,
//                         "quantity",
//                         Number(e.target.value || 1)
//                       )
//                     }
//                   />
//                 </div>
//                 <div className="col-span-1 flex justify-end items-center">
//                   {services.length > 1 && (
//                     <button
//                       onClick={() => handleRemoveServiceRow(idx)}
//                       className="p-2 rounded hover:bg-red-50 text-red-600"
//                       title="Remove"
//                     >
//                       <Trash2 className="w-4 h-4" />
//                     </button>
//                   )}
//                 </div>
//               </div>
//             ))}

//             <div className="px-4 py-3 border-t flex justify-between items-center">
//               <button
//                 onClick={handleAddServiceRow}
//                 className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
//               >
//                 <Plus className="w-4 h-4" />
//                 Add more service
//               </button>

//               <div className="text-sm text-gray-700">
//                 <span className="mr-4">
//                   <strong>Total Duration:</strong> {formTotals.totalDuration} min
//                 </span>
//                 <span>
//                   <strong>Total Price:</strong> AED
//                   {formTotals.totalPrice.toFixed(2)}
//                 </span>
//               </div>
//             </div>
//           </div>

//           {/* Remarks & toggles */}
//           <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//             <div className="md:col-span-2">
//               <label className="block text-sm font-medium text-gray-700">
//                 Remarks (optional)
//               </label>
//               <textarea
//                 className="mt-1 w-full border rounded-md px-3 py-2 min-h-[80px]"
//                 value={remarks}
//                 onChange={(e) => setRemarks(e.target.value)}
//               />
//             </div>
//             <div className="space-y-4">
//               <div>
//                 <label className="block text-sm font-medium text-gray-700">
//                   Application Status
//                 </label>
//                 <select
//                   className="mt-1 w-full border rounded-md px-3 py-2"
//                   value={status}
//                   onChange={(e) =>
//                     setStatus(e.target.value as BookingStatus)
//                   }
//                 >
//                   <option value="upcoming">Approved (Upcoming)</option>
//                   <option value="past">Completed (Past)</option>
//                   <option value="cancelled">Cancelled</option>
//                 </select>
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* Footer */}
//         <div className="px-6 py-4 border-t flex justify-end gap-3">
//           <button
//             onClick={() => {
//               setShowCreate(false);
//               resetForm();
//             }}
//             className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
//             disabled={saving || deleting}
//           >
//             Close
//           </button>
//           <button
//             onClick={saveBooking}
//             className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-md hover:bg-emerald-700 disabled:opacity-60"
//             disabled={saving || deleting}
//           >
//             {saving
//               ? editingId
//                 ? "Updating..."
//                 : "Saving..."
//               : editingId
//               ? "Update"
//               : "Save"}
//           </button>
//         </div>
//       </div>
//     </div>
//   </div>
// )}

//         {/* =================== END CREATE / EDIT MODAL =================== */}

//         {/* =================== INVOICE MODAL =================== */}

//         {/* =================== INVOICE MODAL =================== */}
      

// {invoiceData && (
//   <div
//     className={`fixed inset-0 flex items-center justify-center bg-black/50 z-50 p-4 transition-opacity ${
//       showInvoice ? "opacity-100 visible" : "opacity-0 invisible"
//     }`}
//   >
//     <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl p-6 relative">
//       <button
//         className="absolute top-4 right-4 text-gray-500 hover:text-gray-800"
//         onClick={() => setShowInvoice(false)}
//         title="Close"
//       >
//         ✖
//       </button>

//       {/* Invoice content */}
//       <div id="invoice-content" className="p-6 bg-white rounded-lg shadow-md">
//         <div className="flex justify-between items-center mb-6">
//           <div>
//             <h2
//               className="text-2xl font-bold text-indigo-700"
//               contentEditable={isEditing}
//               suppressContentEditableWarning={true}
//               onBlur={(e) =>
//                 setInvoiceData((prev) => ({
//                   ...prev,
//                   title: e.target.innerText || "Invoice Receipt",
//                 }))
//               }
//             >
//               {invoiceData.title || "Invoice Receipt"}
//             </h2>
//             <p className="text-sm text-gray-500">
//               Booking ID: {invoiceData.id}
//             </p>
//           </div>
//           <div className="text-right">
//             <p
//               className="font-semibold"
//               contentEditable={isEditing}
//               suppressContentEditableWarning={true}
//               onBlur={(e) =>
//                 setInvoiceData((prev) => ({
//                   ...prev,
//                   businessName: e.target.innerText || "MirrorBeautyLounge",
//                 }))
//               }
//             >
//               {invoiceData.businessName || "MirrorBeautyLounge"}
//             </p>
//             <p
//               className="text-sm text-gray-500"
//               contentEditable={isEditing}
//               suppressContentEditableWarning={true}
//               onBlur={(e) =>
//                 setInvoiceData((prev) => ({
//                   ...prev,
//                   businessEmail: e.target.innerText || "mirrorbeauty@email.com",
//                 }))
//               }
//             >
//               {invoiceData.businessEmail || "mirrorbeauty@email.com"}
//             </p>
//             <p
//               className="text-sm text-gray-500"
//               contentEditable={isEditing}
//               suppressContentEditableWarning={true}
//               onBlur={(e) =>
//                 setInvoiceData((prev) => ({
//                   ...prev,
//                   businessPhone: e.target.innerText || "+971-XXX-XXXX",
//                 }))
//               }
//             >
//               {invoiceData.businessPhone || "+971-XXX-XXXX"}
//             </p>
//           </div>
//         </div>

//         <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 text-sm">
//           <div>
//             <p contentEditable={isEditing} suppressContentEditableWarning={true}>
//               <strong>Customer:</strong> {invoiceData.customerName}
//             </p>
//             <p contentEditable={isEditing} suppressContentEditableWarning={true}>
//               <strong>Email:</strong>{" "}
//               {invoiceData.customerEmail ||
//                 users[invoiceData.userId]?.email ||
//                 "N/A"}
//             </p>
//             <p contentEditable={isEditing} suppressContentEditableWarning={true}>
//               <strong>Phone:</strong>{" "}
//               {users[invoiceData.userId]?.phone || "-"}
//             </p>
//           </div>
//           <div>
//             <p contentEditable={isEditing} suppressContentEditableWarning={true}>
//               <strong>Branch:</strong> {invoiceData.branch}
//             </p>
//             <p contentEditable={isEditing} suppressContentEditableWarning={true}>
//               <strong>Date:</strong>{" "}
//               {format(invoiceData.bookingDate, "dd MMM yyyy")}
//             </p>
//             <p contentEditable={isEditing} suppressContentEditableWarning={true}>
//               <strong>Time:</strong>{" "}
//               {toDisplayAMPM(invoiceData.bookingTime)}
//             </p>
//             <p contentEditable={isEditing} suppressContentEditableWarning={true}>
//               <strong>Staff:</strong> {invoiceData.staff || "-"}
//             </p>
//             <p contentEditable={isEditing} suppressContentEditableWarning={true}>
//               <strong>Payment Method:</strong>{" "}
//               {invoiceData.paymentMethod || "cash"}
//             </p>
//           </div>
//         </div>

//         <div className="overflow-hidden rounded border">
//           <table className="w-full text-sm">
//             <thead className="bg-gray-100">
//               <tr>
//                 <th className="p-3 text-left">Service</th>
//                 <th className="p-3 text-center">Qty</th>
//                 <th className="p-3 text-right">Price</th>
//                 <th className="p-3 text-right">Total</th>
//               </tr>
//             </thead>
//             <tbody>
//               {invoiceData.services
//                 .slice(
//                   (currentPage - 1) * staffPerPage,
//                   currentPage * staffPerPage
//                 )
//                 .map((s, i) => (
//                   <tr key={i} className="border-t">
//                     <td
//                       className="p-3"
//                       contentEditable={isEditing}
//                       suppressContentEditableWarning={true}
//                       onBlur={(e) => {
//                         const updated = [...invoiceData.services];
//                         updated[i].serviceName = e.target.innerText;
//                         setInvoiceData({ ...invoiceData, services: updated });
//                       }}
//                     >
//                       {s.serviceName}
//                     </td>
//                     <td
//                       className="p-3 text-center"
//                       contentEditable={isEditing}
//                       suppressContentEditableWarning={true}
//                       onBlur={(e) => {
//                         const updated = [...invoiceData.services];
//                         updated[i].quantity = e.target.innerText;
//                         setInvoiceData({ ...invoiceData, services: updated });
//                       }}
//                     >
//                       {s.quantity}
//                     </td>
//                     <td
//                       className="p-3 text-right"
//                       contentEditable={isEditing}
//                       suppressContentEditableWarning={true}
//                       onBlur={(e) => {
//                         const updated = [...invoiceData.services];
//                         updated[i].price = e.target.innerText;
//                         setInvoiceData({ ...invoiceData, services: updated });
//                       }}
//                     >
//                       AED {Number(s.price).toFixed(2)}
//                     </td>
//                     <td className="p-3 text-right">
//                       AED {(Number(s.price) * Number(s.quantity)).toFixed(2)}
//                     </td>
//                   </tr>
//                 ))}
//             </tbody>
//           </table>
//         </div>

//         <div className="mt-4 flex justify-end items-center gap-6">
//           <div className="text-right">
//             <div className="text-sm text-gray-600">Subtotal</div>
//             <div
//               className="text-xl font-bold text-indigo-700"
//               contentEditable={isEditing}
//               suppressContentEditableWarning={true}
//               onBlur={(e) =>
//                 setInvoiceData((prev) => ({
//                   ...prev,
//                   totalPrice: e.target.innerText.replace(/[^\d.]/g, ""),
//                 }))
//               }
//             >
//               AED {Number(invoiceData.totalPrice).toFixed(2)}
//             </div>
//           </div>
//         </div>

//         <div
//           className="mt-6 text-center text-sm text-gray-500"
//           contentEditable={isEditing}
//           suppressContentEditableWarning={true}
//         >
//           {invoiceData.footerText ||
//             "Thank you for your booking! We look forward to serving you."}
//         </div>
//       </div>

//       {/* Actions */}
//       <div className="mt-4 flex justify-end gap-3">
//         <button
//           onClick={() => setShowInvoice(false)}
//           className="px-4 py-2 bg-gray-100 rounded-md"
//         >
//           Close
//         </button>
//         <button
//           onClick={() => setIsEditing(!isEditing)}
//           className={`px-4 py-2 rounded-md ${
//             isEditing
//               ? "bg-green-600 text-white"
//               : "bg-blue-600 text-white"
//           }`}
//         >
//           {isEditing ? "Save Invoice" : "Edit Invoice"}
//         </button>
//         <button
//           onClick={downloadInvoicePDF}
//           className="px-4 py-2 bg-pink-600 text-white rounded-md"
//         >
//           Download PDF
//         </button>
//       </div>
//     </div>
//   </div>
// )}

             
//         {/* =================== END INVOICE MODAL =================== */}

//         {/* =================== END INVOICE MODAL =================== */}
//         {/* =================== STAFF LIST WITH PAGINATION =================== */}

//         {invoiceData && invoiceData.services && (
//           <div className="mt-4 flex justify-between items-center">
//             <button
//               onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
//               disabled={currentPage === 1}
//               className={`px-4 py-2 rounded-md ${
//                 currentPage === 1
//                   ? "bg-gray-200 text-gray-500 cursor-not-allowed"
//                   : "bg-indigo-600 text-white hover:bg-indigo-700"
//               }`}
//             >
//               Previous
//             </button>

//             <span className="text-sm text-gray-700">
//               Page {currentPage} of{" "}
//               {Math.ceil(invoiceData.services.length / staffPerPage)}
//             </span>

//             <button
//               onClick={() =>
//                 setCurrentPage((prev) =>
//                   Math.min(
//                     prev + 1,
//                     Math.ceil(invoiceData.services.length / staffPerPage)
//                   )
//                 )
//               }
//               disabled={
//                 currentPage ===
//                 Math.ceil(invoiceData.services.length / staffPerPage)
//               }
//               className={`px-4 py-2 rounded-md ${
//                 currentPage ===
//                 Math.ceil(invoiceData.services.length / staffPerPage)
//                   ? "bg-gray-200 text-gray-500 cursor-not-allowed"
//                   : "bg-indigo-600 text-white hover:bg-indigo-700"
//               }`}
//             >
//               Next
//             </button>
//           </div>
//         )}

//         {/* =================== END STAFF LIST =================== */}
//       </div>
//     </AccessWrapper>

//   );
// }














// new codee






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
  "AI Bustaan",
  "Marina",
  "TECOM",
  "AL Muraqabat",
  "IBN Batutta Mall",
];
const CATEGORY_OPTIONS = ["Facial", "Hair", "Nails", "Lashes", "Massage"];
const PAYMENT_METHODS = ["cash", "card", "tabby", "tamara", "apple pay","google pay","samsung wallet","paypal","american express","ewallet STC pay","bank transfer","cash on delivery","other"];

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


  // 👇 Added for Tip / Discount / Payment Methods
const [tip, setTip] = useState(0);
const [discount, setDiscount] = useState(0);
const [paymentMethods, setPaymentMethods] = useState([]);

  const [searchTerm, setSearchTerm] = useState("");
  
  const [statusFilter, setStatusFilter] = useState<string>("all");
  // Create/Edit modal
  const [showCreate, setShowCreate] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("");

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
  const [customPaymentMethod, setCustomPaymentMethod] = useState<string>("");

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

  /* -------------------- NEW: Branches & Filters -------------------- */
  // 👇 Added: Fetch payment methods from Firestore
useEffect(() => {
  const fetchPaymentMethods = async () => {
    try {
      const snapshot = await getDocs(collection(db, "paymentMethods"));
      const methods = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setPaymentMethods(methods);
    } catch (error) {
      console.error("Error fetching payment methods:", error);
    }
  };
  fetchPaymentMethods();
}, []);


  // Branches from Firestore
  const [branchesFromDB, setBranchesFromDB] = useState<string[]>([]);

  // Filter states (do not conflict with existing 'staff' state)
  const [selectedBranch, setSelectedBranch] = useState<string>("");
  const [selectedStaffFilter, setSelectedStaffFilter] = useState<string>("");
  const [selectedDateFilter, setSelectedDateFilter] = useState<string>("");
  const [selectedCustomerFilter, setSelectedCustomerFilter] = useState<string>("");
  const [selectedTimeInterval, setSelectedTimeInterval] = useState<string>("");

  // Unique booking times (populate time dropdown)
  const uniqueTimes = useMemo(() => {
    const times = bookings.map((b) => b.bookingTime).filter(Boolean);
    return Array.from(new Set(times)).sort();
  }, [bookings]);

  useEffect(() => {
    const loadBranches = async () => {
      try {
        const snap = await getDocs(collection(db, "branches"));
        const list: string[] = [];
        snap.forEach((d) => {
          const data = d.data() as any;
          if (data?.name) list.push(String(data.name));
        });
        setBranchesFromDB(list);
      } catch (e) {
        console.error("Error loading branches:", e);
        setBranchesFromDB(BRANCH_OPTIONS); // fallback to your constant list
      }
    };

   
    const loadStaffObjects = async () => {
      try {
        const snap = await getDocs(collection(db, "staff"));
        // no need to overwrite your staffFromDB which is used elsewhere
      } catch (e) {
        // ignore
      }
    };

    loadBranches();
    loadStaffObjects();
  }, []);

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
        discount: data.discount || 0, // ✅ Add here

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
// Extended filtering: search/status + new filter bar values
const filteredBookings = bookings.filter((booking) => {
  const q = searchTerm.toLowerCase();
  const matchesSearch =
    booking.customerName.toLowerCase().includes(q) ||
    booking.branch.toLowerCase().includes(q) ||
    booking.services.some((s) => s.serviceName.toLowerCase().includes(q));

  const matchesStatus =
    statusFilter === "all" ||
    booking.status === (statusFilter as BookingStatus);

  const matchesBranch =
    !selectedBranch || selectedBranch === "" || booking.branch === selectedBranch;

  const matchesStaff =
    !selectedStaffFilter || selectedStaffFilter === "" || (booking.staff ? booking.staff === selectedStaffFilter : false);

  const matchesDate =
    !selectedDateFilter ||
    selectedDateFilter === "" ||
    format(booking.bookingDate, "yyyy-MM-dd") === selectedDateFilter;

  const matchesCustomer =
    !selectedCustomerFilter ||
    selectedCustomerFilter === "" ||
    booking.customerName.toLowerCase().includes(selectedCustomerFilter.toLowerCase());

  const matchesTime =
    !selectedTimeInterval ||
    selectedTimeInterval === "" ||
    booking.bookingTime === selectedTimeInterval;

  return matchesSearch && matchesStatus && matchesBranch && matchesStaff && matchesDate && matchesCustomer && matchesTime;
});

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
  setCustomPaymentMethod("");
  setEmailConfirmation(false);
  setSmsConfirmation(false);
  setStatus("upcoming");
  setStaff("");
  setServices([{ ...emptyService }]);
  setRemarks("");
  setEditingId(null);
  setCustomerEmail("");
  setTip("");
  setDiscount("");
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
  setShowCreate(true); // OPEN MODAL FIRST

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

  setTip(b.tipAmount ?? 0);
  setDiscount(b.discount ?? 0);
};

useEffect(() => {
  if (showCreate && editingId) {
    const booking = bookings.find((b) => b.id === editingId);
    if (booking) {
      setDiscount(booking.discount ?? 0);
      setTip(booking.tipAmount ?? 0);
    }
  }
}, [showCreate, editingId]);



const handleAddServiceRow = () => {
  setServices((prev) => [...prev, { ...emptyService }]);
};

const handleRemoveServiceRow = (index: number) => {
  setServices((prev) => prev.filter((_, i) => i !== index));
};

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
      paymentMethod: paymentMethod === "custom" ? customPaymentMethod : paymentMethod,
      emailConfirmation,
      smsConfirmation,
      updatedAt: serverTimestamp(),
      remarks: remarks || null,
     tipAmount: Number(tip) || 0,
discount: Number(discount) || 0,

      

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
  return filteredBookings.filter((b) => {
    const sameDay = isSameDay(b.bookingDate, target);
    const branchOk = scheduleBranch === "all" || b.branch === scheduleBranch;
    return sameDay && branchOk;
  });
}, [filteredBookings, scheduleDate, scheduleBranch]);

// fast lookup: { 'HH:mm': { staffName: Booking[] } }

const scheduleMatrix = useMemo(() => {
  const map: Record<string, Record<string, Booking[]>> = {};

  // Initialize empty slots
  TIMESLOTS.forEach((t) => {
    map[t] = {};
    STAFF_OPTIONS.forEach((s) => (map[t][s] = []));
    map[t]["Unassigned"] = [];
  });
filteredBookings.forEach((b) => {
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
}, [filteredBookings, scheduleDate, scheduleBranch, STAFF_OPTIONS, enabledHours]);


  /* -------------------------- Invoice Helpers ------------------------- */

  // const openInvoice = (booking: Booking) => {
  //   setInvoiceData(booking);
  //   setShowInvoice(true);
  // };


const openInvoice = (booking: Booking) => {
  setInvoiceData({
    ...booking,
    tip: booking.tipAmount || 0,      // rename to match invoice JSX
    discount: booking.discount || 0,  // ensure discount exists
    totalPrice: booking.totalPrice || 0,
  });
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
        <div className="max-w-6xl mx-auto dark:text-white ">
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

          {/* 🔽 FILTER BAR (ADDED) 🔽 */}
          <div className="mb-6">
            <div className="w-full flex flex-wrap items-center gap-3 mb-4 bg-white/80 dark:bg-slate-800/60 p-4 rounded-2xl shadow-sm">
              {/* Branch */}
              <div>
                <label className="text-xs block mb-1">Branch</label>
                <select
                  value={selectedBranch}
                  onChange={(e) => setSelectedBranch(e.target.value)}
                  className="border rounded-lg px-3 py-2"
                >
                  <option value="">All Branches</option>
                  {/* prefer DB branches; fallback to BRANCH_OPTIONS */}
                  {(branchesFromDB.length ? branchesFromDB : BRANCH_OPTIONS).map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>

              {/* Staff */}
              <div>
                <label className="text-xs block mb-1">Staff</label>
                <select
                  value={selectedStaffFilter}
                  onChange={(e) => setSelectedStaffFilter(e.target.value)}
                  className="border rounded-lg px-3 py-2"
                >
                  <option value="">All Staff</option>
                  {STAFF_OPTIONS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              {/* Date */}
              <div>
                <label className="text-xs block mb-1">Date</label>
                <input
                  type="date"
                  value={selectedDateFilter}
                  onChange={(e) => setSelectedDateFilter(e.target.value)}
                  className="border rounded-lg px-3 py-2"
                />
              </div>

              {/* Customer */}
              <div className="flex-1 min-w-[200px]">
                <label className="text-xs block mb-1">Customer</label>
                <input
                  type="text"
                  placeholder="Search customer"
                  value={selectedCustomerFilter}
                  onChange={(e) => setSelectedCustomerFilter(e.target.value)}
                  className="border rounded-lg px-3 py-2 w-full"
                />
              </div>

              {/* Time Interval */}
              <div>
                <label className="text-xs block mb-1">Time</label>
                <select
                  value={selectedTimeInterval}
                  onChange={(e) => setSelectedTimeInterval(e.target.value)}
                  className="border rounded-lg px-3 py-2"
                >
                  <option value="">All Times</option>
                  {uniqueTimes.map((time) => (
                    <option key={time} value={time}>
                      {toDisplayAMPM(time)} ({time})
                    </option>
                  ))}
                </select>
              </div>

              {/* Clear filters button */}
              <div className="ml-auto self-end">
                <button
                  onClick={() => {
                    setSelectedBranch("");
                    setSelectedStaffFilter("");
                    setSelectedDateFilter("");
                    setSelectedCustomerFilter("");
                    setSelectedTimeInterval("");
                  }}
                  className="px-3 py-2 bg-gray-100 rounded-md text-sm hover:bg-gray-200"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          </div>
          {/* 🔼 FILTER BAR (ADDED) 🔼 */}

          {/* Unified Schedule Dashboard & Statistics */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-50 via-white to-purple-50 border border-white/20 shadow-xl backdrop-blur-sm p-6 mb-6 w-[1000px] animate-fade-in">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-pink-500/5"></div>
            
            {/* Header */}
            <div className="relative mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 shadow-lg animate-float">
                  <Calendar className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800">Schedule Dashboard & Controls</h3>
                <div className="flex-1 h-px bg-gradient-to-r from-indigo-200 via-purple-200 to-transparent"></div>
              </div>
            </div>

            {/* Stats Cards Section */}
            <div className="relative mb-8">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-1.5 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-600 shadow-md animate-pulse-slow">
                  <CheckCircle className="w-4 h-4 text-white" />
                </div>
                <h4 className="text-sm font-medium text-gray-700">Booking Statistics</h4>
                <div className="flex-1 h-px bg-gradient-to-r from-blue-200 to-transparent"></div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-blue-50 via-white to-blue-100 border border-blue-200/50 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-cyan-500/5"></div>
                  <div className="relative p-4">
                    <div className="flex items-center">
                      <div className="p-2 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-lg shadow-md group-hover:scale-110 transition-transform duration-300">
                        <Calendar className="w-4 h-4 text-white" />
                      </div>
                      <div className="ml-3">
                        <p className="text-xs font-medium text-gray-600 group-hover:text-blue-700 transition-colors duration-300">
                          Total Bookings
                        </p>
                        <p className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                          {filteredBookings.length}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-green-50 via-white to-emerald-100 border border-green-200/50 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                  <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 to-emerald-500/5"></div>
                  <div className="relative p-4">
                    <div className="flex items-center">
                      <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg shadow-md group-hover:scale-110 transition-transform duration-300">
                        <CheckCircle className="w-4 h-4 text-white" />
                      </div>
                      <div className="ml-3">
                        <p className="text-xs font-medium text-gray-600 group-hover:text-green-700 transition-colors duration-300">Upcoming</p>
                        <p className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                          {filteredBookings.filter((b) => b.status === "upcoming").length}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-amber-50 via-white to-yellow-100 border border-amber-200/50 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                  <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 to-yellow-500/5"></div>
                  <div className="relative p-4">
                    <div className="flex items-center">
                      <div className="p-2 bg-gradient-to-r from-amber-500 to-yellow-600 rounded-lg shadow-md group-hover:scale-110 transition-transform duration-300">
                        <AlertCircle className="w-4 h-4 text-white" />
                      </div>
                      <div className="ml-3">
                        <p className="text-xs font-medium text-gray-600 group-hover:text-amber-700 transition-colors duration-300">Past</p>
                        <p className="text-2xl font-bold bg-gradient-to-r from-amber-600 to-yellow-600 bg-clip-text text-transparent">
                          {filteredBookings.filter((b) => b.status === "past").length}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-red-50 via-white to-rose-100 border border-red-200/50 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                  <div className="absolute inset-0 bg-gradient-to-r from-red-500/5 to-rose-500/5"></div>
                  <div className="relative p-4">
                    <div className="flex items-center">
                      <div className="p-2 bg-gradient-to-r from-red-500 to-rose-600 rounded-lg shadow-md group-hover:scale-110 transition-transform duration-300">
                        <XCircle className="w-4 h-4 text-white" />
                      </div>
                      <div className="ml-3">
                        <p className="text-xs font-medium text-gray-600 group-hover:text-red-700 transition-colors duration-300">Cancelled</p>
                        <p className="text-2xl font-bold bg-gradient-to-r from-red-600 to-rose-600 bg-clip-text text-transparent">
                          {filteredBookings.filter((b) => b.status === "cancelled").length}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Schedule Controls Section */}
            <div className="relative">
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
            
            {/* Decorative Elements */}
            <div className="absolute top-2 right-2 w-16 h-16 bg-gradient-to-br from-indigo-400/20 to-purple-400/20 rounded-full animate-float-delay"></div>
            <div className="absolute bottom-2 left-2 w-12 h-12 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full animate-bounce-subtle"></div>
          </div>

          
              
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative group">

                    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/10 to-purple-500/10 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                 
              
              </div>
            </div>
            
            {/* Decorative Elements */}
            <div className="absolute top-2 right-2 w-16 h-16 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full animate-float-delay"></div>
            <div className="absolute bottom-2 left-2 w-12 h-12 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full animate-bounce-subtle"></div>
          </div>



          {/* Schedule Board */}
          <div className="  relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-50 via-white to-gray-100 border border-white/20 shadow-2xl backdrop-blur-sm mb-10  animate-fade-in">
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

            <div className="relative overflow-x-auto w-full">
              <div className="w-full relative">
                <div
                  className="grid sticky top-0 z-20"
                  style={{
                    gridTemplateColumns: `180px repeat(${STAFF_OPTIONS.length},  200px)`,
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
               
// helper: normalize date string to YYYY-MM-DD safely (without timezone shift)
const formatDate = (dateStr: string | Date) => {
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${(d.getMonth() + 1)
    .toString()
    .padStart(2, "0")}-${d.getDate().toString().padStart(2, "0")}`;
};

// get today's and yesterday's local date
const today = new Date();
const yesterday = new Date();
yesterday.setDate(today.getDate() - 1);

const allowedDates = [formatDate(yesterday), formatDate(today)];

const allItems = filteredBookings.filter((b) => {
  const bookingDay = formatDate(b.bookingDate);

  const normalizeTime = (timeStr: string) => {
    if (!timeStr) return "";
    let [hh, mm] = timeStr.split(":");
    if (!mm) mm = "00";
    const lowerTime = timeStr.toLowerCase();
    const isPM = lowerTime.includes("pm");
    const isAM = lowerTime.includes("am");
    hh = hh.replace(/\D/g, "");
    let hourNum = parseInt(hh, 10);
    if (isPM && hourNum !== 12) hourNum += 12;
    if (isAM && hourNum === 12) hourNum = 0;
    return `${hourNum.toString().padStart(2, "0")}:${mm.substring(0, 2)}`;
  };

  const normalizedBookingTime = normalizeTime(b.bookingTime);

  // booking start and end (minutes from midnight)
  const [startHour, startMin] = normalizedBookingTime.split(":").map(Number);
  const bookingStart = startHour * 60 + startMin;
  const bookingEnd = bookingStart + (b.totalDuration || 30); // default 30 min

  // current slot in minutes
  const normalizedSlotTime = normalizeTime(t);
  const [slotHour, slotMin] = normalizedSlotTime.split(":").map(Number);
  const slotMinutes = slotHour * 60 + slotMin;

  const staffMatch = b.staff ? b.staff === sName : true;

  // ⬇️ NEW CONDITION
  return (
    staffMatch &&
    allowedDates.includes(bookingDay) &&
    slotMinutes >= bookingStart &&
    slotMinutes < bookingEnd
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
                        <div className="flex items-center text-[11px] opacity-80 mt-1">
                          <CreditCard className="w-3 h-3 mr-1" />
                          {b.paymentMethod || "cash"}
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
{/* =================== CREATE / EDIT SCHEDULE MODAL =================== */}
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
                  const booking = bookings.find((b) => b.id === editingId);
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

            {/* Category Select */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Category
              </label>
              <select
                className="mt-1 w-full border rounded-md px-3 py-2"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <option value="">Select One</option>
                {Array.from(new Set(serviceOptions.map((s) => s.category))).map(
                  (c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  )
                )}
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

            {/* Payment Method */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Payment Method
              </label>
              <select
                className="mt-1 w-full border rounded-md px-3 py-2"
                value={paymentMethod}
                onChange={(e) => {
                  setPaymentMethod(e.target.value);
                  if (e.target.value !== "custom") {
                    setCustomPaymentMethod("");
                  }
                }}
              >
                {PAYMENT_METHODS.map((p) => (
                  <option key={p} value={p}>
                    {p.toUpperCase()}
                  </option>
                ))}
              </select>

              {paymentMethod === "custom" && (
                <div className="mt-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Custom Payment Method
                  </label>
                  <input
                    type="text"
                    className="mt-1 w-full border rounded-md px-3 py-2"
                    placeholder="Enter custom payment method"
                    value={customPaymentMethod}
                    onChange={(e) => setCustomPaymentMethod(e.target.value)}
                  />
                </div>
              )}
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
                    {serviceOptions
                      .filter((service) =>
                        selectedCategory
                          ? service.category === selectedCategory
                          : true
                      )
                      .map((service) => (
                        <option key={service.id} value={service.name}>
                          {service.name}
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

            {/* Tip + Discount + Total */}
            <div className="px-4 py-3 border-t space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Tip Amount (AED)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className="mt-1 w-full border rounded-md px-3 py-2"
                    placeholder="Enter tip"
                    value={tip || ""}
                    onChange={(e) => setTip(Number(e.target.value) || 0)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Discount (AED)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className="mt-1 w-full border rounded-md px-3 py-2"
                    placeholder="Enter discount"
                    value={discount || ""}
                    onChange={(e) => setDiscount(Number(e.target.value) || 0)}
                  />
                </div>

                <div className="flex flex-col justify-end">
                  <div className="text-sm font-semibold text-gray-800">
                    Final Total: AED{" "}
                    {(
                      formTotals.totalPrice + (tip || 0) - (discount || 0)
                    ).toFixed(2)}
                  </div>
                </div>
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
              
{invoiceData && (
  <div
    className={`fixed inset-0 flex items-center justify-center bg-black/50 z-50 p-4 transition-opacity ${
      showInvoice ? "opacity-100 visible" : "opacity-0 invisible"
    }`}
  >
    <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl p-4 relative max-h-[90vh] overflow-auto">
      {/* Close Button */}
      <button
        className="absolute top-4 right-4 text-gray-500 hover:text-gray-800"
        onClick={() => setShowInvoice(false)}
        title="Close"
      >
        ✖
      </button>

      {/* Dropdown Selection Section */}
      <div className="p-4 border-b border-gray-200 rounded mb-4">
        <h3 className="font-semibold text-lg mb-2">Select Branch Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Brand Email Dropdown */}
          <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-700 mb-1">Brand Email</label>
            <select
              className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={invoiceData.businessEmail}
              onChange={(e) =>
                setInvoiceData((prev) => ({ ...prev, businessEmail: e.target.value }))
              }
            >
              <option value="branch@mirrosalon.ae">branch@mirrosalon.ae</option>
              <option value="marina@mirrosalon.ae">marina@mirrosalon.ae</option>
              <option value="ibnbattuta@mirrosalon.ae">ibnbattuta@mirrosalon.ae</option>
              <option value="albustan@mirrosalon.ae">albustan@mirrosalon.ae</option>
              <option value="tecom@mirrosalon.ae">tecom@mirrosalon.ae</option>
            </select>
          </div>

          {/* Brand Phone Dropdown */}
          <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-700 mb-1">Brand Phone</label>
            <select
              className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={invoiceData.businessPhone}
              onChange={(e) =>
                setInvoiceData((prev) => ({ ...prev, businessPhone: e.target.value }))
              }
            >
              <option value="+971 56 300 5629">Marina Phone: +971 56 300 5629</option>
              <option value="+971 54 321 0758">IBN Battuta Mall Phone: +971 54 321 0758</option>
              <option value="+971 50 545 8263">AI Bustaan Phone: +971 50 545 8263</option>
              <option value="+971 4 568 6219">TECOM Phone: +971 4 568 6219</option>
              <option value="+971 4 269 1449">AI Muraqqabat Phone: +971 4 269 1449</option>
            </select>
          </div>

          {/* Brand Address Dropdown */}
          <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-700 mb-1">Brand Address</label>
            <select
              className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={invoiceData.businessAddress}
              onChange={(e) =>
                setInvoiceData((prev) => ({ ...prev, businessAddress: e.target.value }))
              }
            >
              <option value="Marina Jannah Hotel, Marina - Ground Floor, Shop - 2 Jannah Pl - Dubai Marina - Dubai - United Arab Emirates">
                Marina Jannah Hotel, Dubai Marina
              </option>
              <option value="IBN Battuta Mall, Metro link area - Sheikh Zayed Rd - Dubai - United Arab Emirates">
                IBN Battuta Mall, Dubai
              </option>
              <option value="Al Bustan Centre & Residence Al Nahda Road, Qusais, 20107 - Dubai - United Arab Emirates">
                AI Bustaan, Dubai
              </option>
              <option value="New API Building - Ground Floor - beside Fahad Tower 1 - Barsha Heights - Dubai - United Arab Emirates">
                TECOM, Dubai
              </option>
              <option value="Dominos Pizza Building, Buhaleeba plaza - M02 - Al Muraqqabat - Dubai - United Arab Emirates">
                AI Muraqqabat, Dubai
              </option>
            </select>
          </div>
        </div>
      </div>

      {/* Invoice Content */}
      <div id="invoice-content" className="p-4 bg-white rounded-lg shadow-md">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2
              className="text-2xl font-bold text-indigo-700"
              contentEditable={isEditing}
              suppressContentEditableWarning={true}
              onBlur={(e) =>
                setInvoiceData((prev) => ({ ...prev, title: e.target.innerText }))
              }
            >
              {invoiceData.title || "Invoice Receipt"}
            </h2>
            <p className="text-sm text-gray-500">
              Booking ID:{" "}
              <span
                contentEditable={isEditing}
                suppressContentEditableWarning={true}
                onBlur={(e) =>
                  setInvoiceData((prev) => ({ ...prev, id: e.target.innerText }))
                }
              >
                {invoiceData.id}
              </span>
            </p>
          </div>

          <div className="text-right">
            <p
              className="font-semibold"
              contentEditable={isEditing}
              suppressContentEditableWarning={true}
              onBlur={(e) =>
                setInvoiceData((prev) => ({ ...prev, businessName: e.target.innerText }))
              }
            >
              {invoiceData.businessName || "MirrorBeautyLounge"}
            </p>
            <p
              className="text-sm text-gray-500"
              contentEditable={isEditing}
              suppressContentEditableWarning={true}
              onBlur={(e) =>
                setInvoiceData((prev) => ({ ...prev, businessEmail: e.target.innerText }))
              }
            >
              {invoiceData.businessEmail}
            </p>
            <p
              className="text-sm text-gray-500"
              contentEditable={isEditing}
              suppressContentEditableWarning={true}
              onBlur={(e) =>
                setInvoiceData((prev) => ({ ...prev, businessPhone: e.target.innerText }))
              }
            >
              {invoiceData.businessPhone}
            </p>
            <p
              className="text-sm text-gray-500"
              contentEditable={isEditing}
              suppressContentEditableWarning={true}
              onBlur={(e) =>
                setInvoiceData((prev) => ({ ...prev, businessAddress: e.target.innerText }))
              }
            >
              {invoiceData.businessAddress}
            </p>
          </div>
        </div>

        {/* Customer Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 text-sm">
          <div>
            <p>
              <strong>Customer:</strong>{" "}
              <span
                contentEditable={isEditing}
                suppressContentEditableWarning={true}
                onBlur={(e) =>
                  setInvoiceData((prev) => ({ ...prev, customerName: e.target.innerText }))
                }
              >
                {invoiceData.customerName}
              </span>
            </p>
            <p>
              <strong>Email:</strong>{" "}
              <span
                contentEditable={isEditing}
                suppressContentEditableWarning={true}
                onBlur={(e) =>
                  setInvoiceData((prev) => ({ ...prev, customerEmail: e.target.innerText }))
                }
              >
                {invoiceData.customerEmail || "N/A"}
              </span>
            </p>
            <p>
              <strong>Phone:</strong>{" "}
              <span
                contentEditable={isEditing}
                suppressContentEditableWarning={true}
                onBlur={(e) =>
                  setInvoiceData((prev) => ({
                    ...prev,
                    customerPhone: e.target.innerText,
                  }))
                }
              >
                {users[invoiceData.userId]?.phone || "-"}
              </span>
            </p>
          </div>
          <div>
            <p>
              <strong>Branch:</strong>{" "}
              <span
                contentEditable={isEditing}
                suppressContentEditableWarning={true}
                onBlur={(e) =>
                  setInvoiceData((prev) => ({ ...prev, branch: e.target.innerText }))
                }
              >
                {invoiceData.branch}
              </span>
            </p>
            <p>
              <strong>Date:</strong>{" "}
              <span
                contentEditable={isEditing}
                suppressContentEditableWarning={true}
                onBlur={(e) =>
                  setInvoiceData((prev) => ({ ...prev, bookingDate: e.target.innerText }))
                }
              >
                {format(invoiceData.bookingDate, "dd MMM yyyy")}
              </span>
            </p>
            <p>
              <strong>Time:</strong>{" "}
              <span
                contentEditable={isEditing}
                suppressContentEditableWarning={true}
                onBlur={(e) =>
                  setInvoiceData((prev) => ({ ...prev, bookingTime: e.target.innerText }))
                }
              >
                {toDisplayAMPM(invoiceData.bookingTime)}
              </span>
            </p>
            <p>
              <strong>Staff:</strong>{" "}
              <span
                contentEditable={isEditing}
                suppressContentEditableWarning={true}
                onBlur={(e) =>
                  setInvoiceData((prev) => ({ ...prev, staff: e.target.innerText }))
                }
              >
                {invoiceData.staff || "-"}
              </span>
            </p>
            <p>
              <strong>Payment Method:</strong>{" "}
              <span
                contentEditable={isEditing}
                suppressContentEditableWarning={true}
                onBlur={(e) =>
                  setInvoiceData((prev) => ({ ...prev, paymentMethod: e.target.innerText }))
                }
              >
                {invoiceData.paymentMethod || "cash"}
              </span>
            </p>
          </div>
        </div>

        {/* Services Table */}
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
              {invoiceData.services.map((s, i) => (
                <tr key={i} className="border-t">
                  <td
                    className="p-3"
                    contentEditable={isEditing}
                    suppressContentEditableWarning={true}
                    onBlur={(e) =>
                      setInvoiceData((prev) => {
                        const services = [...prev.services];
                        services[i].serviceName = e.target.innerText;
                        return { ...prev, services };
                      })
                    }
                  >
                    {s.serviceName}
                  </td>
                  <td
                    className="p-3 text-center"
                    contentEditable={isEditing}
                    suppressContentEditableWarning={true}
                    onBlur={(e) =>
                      setInvoiceData((prev) => {
                        const services = [...prev.services];
                        services[i].quantity = Number(e.target.innerText) || 0;
                        return { ...prev, services };
                      })
                    }
                  >
                    {s.quantity}
                  </td>
                  <td
                    className="p-3 text-right"
                    contentEditable={isEditing}
                    suppressContentEditableWarning={true}
                    onBlur={(e) =>
                      setInvoiceData((prev) => {
                        const services = [...prev.services];
                        services[i].price = Number(e.target.innerText) || 0;
                        return { ...prev, services };
                      })
                    }
                  >
                    AED {Number(s.price).toFixed(2)}
                  </td>
                  <td className="p-3 text-right">
                    AED {(Number(s.price) * Number(s.quantity)).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="mt-6 flex flex-col items-end gap-2 text-sm">
          <div className="flex justify-between w-64">
            <span className="text-gray-600">Subtotal:</span>
            <span
              className="font-semibold"
              contentEditable={isEditing}
              suppressContentEditableWarning={true}
              onBlur={(e) =>
                setInvoiceData((prev) => ({
                  ...prev,
                  totalPrice: Number(e.target.innerText.replace(/[^0-9.]/g, "")) || 0,
                }))
              }
            >
              AED {Number(invoiceData.totalPrice || 0).toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between w-64">
            <span className="text-gray-600">Tip Added:</span>
            <span
              className="font-semibold text-green-600"
              contentEditable={isEditing}
              suppressContentEditableWarning={true}
              onBlur={(e) =>
                setInvoiceData((prev) => ({
                  ...prev,
                  tip: Number(e.target.innerText.replace(/[^0-9.]/g, "")) || 0,
                }))
              }
            >
              AED {Number(invoiceData.tip || 0).toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between w-64">
            <span className="text-gray-600">Discount Applied:</span>
            <span
              className="font-semibold text-red-600"
              contentEditable={isEditing}
              suppressContentEditableWarning={true}
              onBlur={(e) =>
                setInvoiceData((prev) => ({
                  ...prev,
                  discount: Number(e.target.innerText.replace(/[^0-9.]/g, "")) || 0,
                }))
              }
            >
              AED {Number(invoiceData.discount || 0).toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between w-64 border-t pt-2 text-base font-bold">
            <span>Grand Total (AED):</span>
            <span>
              AED{" "}
              {(
                Number(invoiceData.totalPrice || 0) +
                Number(invoiceData.tip || 0) -
                Number(invoiceData.discount || 0)
              ).toFixed(2)}
            </span>
          </div>
        </div>

        <div
          className="mt-6 text-center text-sm text-gray-500"
          contentEditable={isEditing}
          suppressContentEditableWarning={true}
          onBlur={(e) =>
            setInvoiceData((prev) => ({ ...prev, footerText: e.target.innerText }))
          }
        >
          {invoiceData.footerText || "Thank you for your booking! We look forward to serving you."}
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
          onClick={() => setIsEditing(!isEditing)}
          className={`px-4 py-2 rounded-md ${
            isEditing ? "bg-green-600 text-white" : "bg-blue-600 text-white"
          }`}
        >
          {isEditing ? "Save Invoice" : "Edit Invoice"}
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
        {/* =================== END STAFF LIST =================== */}
      </div>
    </AccessWrapper>

  );
}
















