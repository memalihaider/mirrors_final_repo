// "use client";

// import { useState, useEffect } from "react";
// import jsPDF from "jspdf";
// import autoTable from "jspdf-autotable";
// import { db } from "@/lib/firebase";
// import { collection, onSnapshot } from "firebase/firestore";
// import AccessWrapper from "@/components/AccessWrapper";

// interface Service {
//   id: string;
//   name: string;
//   price: number;
// }

// interface InvoiceData {
//   bookingId: string;
//   name: string;
//   email: string;
//   phone: string;
//   service: string;
//   category: string;
//   branch: string;
//   date: string;
//   time: string;
//   staff: string;
//   price: number;
//   brandEmail: string;
//   brandPhone: string;
// }

// export default function InvoicePage() {
//   const [form, setForm] = useState<InvoiceData>({
//     bookingId: Math.random().toString(36).substring(2, 12).toUpperCase(),
//     name: "",
//     email: "",
//     phone: "",
//     service: "",
//     category: "",
//     branch: "",
//     date: "",
//     time: "",
//     staff: "",
//     price: 0,
//     brandEmail: "mirrorbeauty@gmail.com",
//     brandPhone: "+971-50-1234567",
//   });

//   const [services, setServices] = useState<Service[]>([]);
//   const [categories, setCategories] = useState<string[]>([]);
//   const [branches, setBranches] = useState<string[]>([]);
//   const [staffList, setStaffList] = useState<string[]>([]);
//   const [history, setHistory] = useState<InvoiceData[]>([]);
//   const [showHistory, setShowHistory] = useState(false);

//   // 🔥 Fetch realtime from Firebase
//   useEffect(() => {
//     const unsubServices = onSnapshot(collection(db, "services"), (snap) => {
//       const srv = snap.docs.map((doc) => ({
//         id: doc.id,
//         ...doc.data(),
//       })) as Service[];
//       setServices(srv);
//     });
//     const unsubCategories = onSnapshot(collection(db, "categories"), (snap) => {
//       setCategories(snap.docs.map((doc) => doc.data().name));
//     });
//     const unsubBranches = onSnapshot(collection(db, "branches"), (snap) => {
//       setBranches(snap.docs.map((doc) => doc.data().name));
//     });
//     const unsubStaff = onSnapshot(collection(db, "staff"), (snap) => {
//       setStaffList(snap.docs.map((doc) => doc.data().name));
//     });

//     return () => {
//       unsubServices();
//       unsubCategories();
//       unsubBranches();
//       unsubStaff();
//     };
//   }, []);

//   const handleChange = (
//     e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
//   ) => {
//     const { name, value } = e.target;

//     if (name === "service") {
//       const selected = services.find((s) => s.name === value);
//       setForm({ ...form, service: value, price: selected ? selected.price : 0 });
//     } else {
//       setForm({ ...form, [name]: value });
//     }
//   };

//   const generateInvoicePDF = (invoice: InvoiceData, download = true) => {
//     const doc = new jsPDF("p", "mm", [148, 210]); // Small A5 size

//     // ✅ Brand Info Header
//     doc.setFont("helvetica", "bold");
//     doc.setFontSize(16);
//     doc.text("Mirror Beauty Lounge", 74, 18, { align: "center" });

//     doc.setFont("helvetica", "normal");
//     doc.setFontSize(10);
//     doc.text(`Email: ${invoice.brandEmail}`, 74, 25, { align: "center" });
//     doc.text(`Phone: ${invoice.brandPhone}`, 74, 30, { align: "center" });

//     doc.setFontSize(12);
//     doc.text("Invoice Receipt", 74, 38, { align: "center" });

//     // Customer Info
//     let y = 50;
//     doc.setFontSize(10);
//     doc.text(`Booking ID: ${invoice.bookingId}`, 20, y);
//     doc.text(`Customer: ${invoice.name}`, 20, (y += 7));
//     doc.text(`Email: ${invoice.email}`, 20, (y += 7));
//     doc.text(`Phone: ${invoice.phone || "-"}`, 20, (y += 7));
//     doc.text(`Branch: ${invoice.branch}`, 20, (y += 7));
//     doc.text(`Date: ${invoice.date}`, 20, (y += 7));
//     doc.text(`Time: ${invoice.time}`, 20, (y += 7));
//     doc.text(`Staff: ${invoice.staff}`, 20, (y += 7));

//     // Services Table
//     autoTable(doc, {
//       startY: y + 10,
//       theme: "grid",
//       head: [["Service", "Qty", "Price (AED)", "Total (AED)"]],
//       body: [
//         [
//           invoice.service,
//           "1",
//           `AED ${invoice.price.toFixed(2)}`,
//           `AED ${invoice.price.toFixed(2)}`,
//         ],
//       ],
//       styles: { fontSize: 10 },
//       headStyles: { fillColor: [0, 123, 255] },
//       margin: { left: 15, right: 15 },
//     });

//     // Footer
//     doc.setFontSize(10);
//     doc.text(
//       "Thank you for your booking! We look forward to serving you.",
//       74,
//       doc.internal.pageSize.height - 20,
//       { align: "center" }
//     );

//     if (download) {
//       doc.save(`Invoice_${invoice.bookingId}.pdf`);
//     }
//     return doc;
//   };

//   const generateInvoice = () => {
//     setHistory((prev) => [...prev, form]);
//     generateInvoicePDF(form, true);
//     setForm({
//       bookingId: Math.random().toString(36).substring(2, 12).toUpperCase(),
//       name: "",
//       email: "",
//       phone: "",
//       service: "",
//       category: "",
//       branch: "",
//       date: "",
//       time: "",
//       staff: "",
//       price: 0,
//       brandEmail: "mirrorbeauty@gmail.com",
//       brandPhone: "+971-50-1234567",
//     });
//   };

//   return (
//     <AccessWrapper>
//     <div className="p-6 max-w-6xl mx-auto">
//       <h1 className="text-2xl font-bold mb-6 text-center">
//         Generate Invoice Receipt
//       </h1>

//       {/* Form */}
//       <div className="grid grid-cols-1 gap-4 bg-white shadow p-4 rounded-lg mb-8">
//         <input
//           type="text"
//           name="name"
//           placeholder="Customer Name"
//           value={form.name}
//           onChange={handleChange}
//           className="p-3 border rounded-lg"
//         />
//         <input
//           type="email"
//           name="email"
//           placeholder="Email Address"
//           value={form.email}
//           onChange={handleChange}
//           className="p-3 border rounded-lg"
//         />
//         <input
//           type="text"
//           name="phone"
//           placeholder="Phone"
//           value={form.phone}
//           onChange={handleChange}
//           className="p-3 border rounded-lg"
//         />

//         {/* ✅ Brand Info */}
//         <input
//           type="email"
//           name="brandEmail"
//           placeholder="Brand Email"
//           value={form.brandEmail}
//           onChange={handleChange}
//           className="p-3 border rounded-lg"
//         />
//         <input
//           type="text"
//           name="brandPhone"
//           placeholder="Brand Phone"
//           value={form.brandPhone}
//           onChange={handleChange}
//           className="p-3 border rounded-lg"
//         />

//         <select
//           name="service"
//           value={form.service}
//           onChange={handleChange}
//           className="p-3 border rounded-lg"
//         >
//           <option value="">Select Service</option>
//           {services.map((srv) => (
//             <option key={srv.id} value={srv.name}>
//               {srv.name} - AED {srv.price}
//             </option>
//           ))}
//         </select>

//         <select
//           name="category"
//           value={form.category}
//           onChange={handleChange}
//           className="p-3 border rounded-lg"
//         >
//           <option value="">Select Category</option>
//           {categories.map((cat, i) => (
//             <option key={i} value={cat}>
//               {cat}
//             </option>
//           ))}
//         </select>

//         <select
//           name="branch"
//           value={form.branch}
//           onChange={handleChange}
//           className="p-3 border rounded-lg"
//         >
//           <option value="">Select Branch</option>
//           {branches.map((br, i) => (
//             <option key={i} value={br}>
//               {br}
//             </option>
//           ))}
//         </select>

//         <input
//           type="date"
//           name="date"
//           value={form.date}
//           onChange={handleChange}
//           className="p-3 border rounded-lg"
//         />
//         <input
//           type="time"
//           name="time"
//           value={form.time}
//           onChange={handleChange}
//           className="p-3 border rounded-lg"
//         />

//         <select
//           name="staff"
//           value={form.staff}
//           onChange={handleChange}
//           className="p-3 border rounded-lg"
//         >
//           <option value="">Select Staff</option>
//           {staffList.map((stf, i) => (
//             <option key={i} value={stf}>
//               {stf}
//             </option>
//           ))}
//         </select>

//         <button
//           onClick={generateInvoice}
//           className="mt-4 py-3 px-6 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
//         >
//           Generate PDF Invoice
//         </button>
//       </div>

//       {/* 🔘 History Button */}
//       <div className="mb-6 text-center">
//         <button
//           onClick={() => setShowHistory(!showHistory)}
//           className="py-2 px-6 bg-gray-700 text-white rounded-lg hover:bg-gray-800"
//         >
//           {showHistory ? "Hide Invoice History" : "Show Invoice History"}
//         </button>
//       </div>

//       {/* 📜 Invoice History List */}
//       {showHistory && (
//         <div className="bg-white shadow p-6 rounded-lg">
//           <h2 className="text-xl font-semibold mb-4">Invoice History</h2>
//           {history.length === 0 ? (
//             <p className="text-gray-500">No invoices generated yet.</p>
//           ) : (
//             <table className="w-full border">
//               <thead>
//                 <tr className="bg-gray-100">
//                   <th className="border p-2">Booking ID</th>
//                   <th className="border p-2">Customer</th>
//                   <th className="border p-2">Email</th>
//                   <th className="border p-2">Phone</th>
//                   <th className="border p-2">Service</th>
//                   <th className="border p-2">Price</th>
//                   <th className="border p-2">Branch</th>
//                   <th className="border p-2">Date</th>
//                   <th className="border p-2">Time</th>
//                   <th className="border p-2">Staff</th>
//                   <th className="border p-2">Brand Email</th>
//                   <th className="border p-2">Brand Phone</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {history.map((inv, i) => (
//                   <tr key={i}>
//                     <td className="border p-2">{inv.bookingId}</td>
//                     <td className="border p-2">{inv.name}</td>
//                     <td className="border p-2">{inv.email}</td>
//                     <td className="border p-2">{inv.phone}</td>
//                     <td className="border p-2">{inv.service}</td>
//                     <td className="border p-2">AED {inv.price}</td>
//                     <td className="border p-2">{inv.branch}</td>
//                     <td className="border p-2">{inv.date}</td>
//                     <td className="border p-2">{inv.time}</td>
//                     <td className="border p-2">{inv.staff}</td>
//                     <td className="border p-2">{inv.brandEmail}</td>
//                     <td className="border p-2">{inv.brandPhone}</td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           )}
//         </div>
//       )}
//     </div>
//     </AccessWrapper>
//   );
// }





//eww
"use client";

import { useState, useEffect } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, addDoc, serverTimestamp } from "firebase/firestore";
import AccessWrapper from "@/components/AccessWrapper";

interface Service {
  id: string;
  name: string;
  price: number;
}

interface InvoiceData {
  bookingId: string;
  name: string;
  email: string;
  phone: string;
  service: string;
  category: string;
  branch: string;
  date: string;
  time: string;
  staff: string;
  price: number;
  brandEmail: string;
  brandPhone: string;
}

export default function InvoicePage() {
  const [form, setForm] = useState<InvoiceData>({
    bookingId: Math.random().toString(36).substring(2, 12).toUpperCase(),
    name: "",
    email: "",
    phone: "",
    service: "",
    category: "",
    branch: "",
    date: "",
    time: "",
    staff: "",
    price: 0,
    brandEmail: "mirrorbeauty@gmail.com",
    brandPhone: "+971-50-1234567",
  });

  const [services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [branches, setBranches] = useState<string[]>([]);
  const [staffList, setStaffList] = useState<string[]>([]);
  const [history, setHistory] = useState<InvoiceData[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  // 🔥 Fetch realtime from Firebase
  useEffect(() => {
    const unsubServices = onSnapshot(collection(db, "services"), (snap) => {
      const srv = snap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Service[];
      setServices(srv);
    });
    const unsubCategories = onSnapshot(collection(db, "categories"), (snap) => {
      setCategories(snap.docs.map((doc) => doc.data().name));
    });
    const unsubBranches = onSnapshot(collection(db, "branches"), (snap) => {
      setBranches(snap.docs.map((doc) => doc.data().name));
    });
    const unsubStaff = onSnapshot(collection(db, "staff"), (snap) => {
      setStaffList(snap.docs.map((doc) => doc.data().name));
    });

    return () => {
      unsubServices();
      unsubCategories();
      unsubBranches();
      unsubStaff();
    };
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    if (name === "service") {
      const selected = services.find((s) => s.name === value);
      setForm({ ...form, service: value, price: selected ? selected.price : 0 });
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const generateInvoicePDF = (invoice: InvoiceData, download = true) => {
    const doc = new jsPDF("p", "mm", [148, 210]); // Small A5 size

    // ✅ Brand Info Header
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("Mirror Beauty Lounge", 74, 18, { align: "center" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Email: ${invoice.brandEmail}`, 74, 25, { align: "center" });
    doc.text(`Phone: ${invoice.brandPhone}`, 74, 30, { align: "center" });

    doc.setFontSize(12);
    doc.text("Invoice Receipt", 74, 38, { align: "center" });

    // Customer Info
    let y = 50;
    doc.setFontSize(10);
    doc.text(`Booking ID: ${invoice.bookingId}`, 20, y);
    doc.text(`Customer: ${invoice.name}`, 20, (y += 7));
    doc.text(`Email: ${invoice.email}`, 20, (y += 7));
    doc.text(`Phone: ${invoice.phone || "-"}`, 20, (y += 7));
    doc.text(`Branch: ${invoice.branch}`, 20, (y += 7));
    doc.text(`Date: ${invoice.date}`, 20, (y += 7));
    doc.text(`Time: ${invoice.time}`, 20, (y += 7));
    doc.text(`Staff: ${invoice.staff}`, 20, (y += 7));

    // Services Table
    autoTable(doc, {
      startY: y + 10,
      theme: "grid",
      head: [["Service", "Qty", "Price (AED)", "Total (AED)"]],
      body: [
        [
          invoice.service,
          "1",
          `AED ${invoice.price.toFixed(2)}`,
          `AED ${invoice.price.toFixed(2)}`,
        ],
      ],
      styles: { fontSize: 10 },
      headStyles: { fillColor: [0, 123, 255] },
      margin: { left: 15, right: 15 },
    });

    // Footer
    doc.setFontSize(10);
    doc.text(
      "Thank you for your booking! We look forward to serving you.",
      74,
      doc.internal.pageSize.height - 20,
      { align: "center" }
    );

    if (download) {
      doc.save(`Invoice_${invoice.bookingId}.pdf`);
    }
    return doc;
  };

  const generateInvoice = async () => {
    try {
      // 1. Save invoice to history state
      setHistory((prev) => [...prev, form]);

      // 2. Save invoice to Firestore collection "customInvoices"
      await addDoc(collection(db, "customInvoices"), {
        ...form,
        createdAt: serverTimestamp(),
      });

      // 3. Generate & download PDF
      generateInvoicePDF(form, true);

      // 4. Reset form
      setForm({
        bookingId: Math.random().toString(36).substring(2, 12).toUpperCase(),
        name: "",
        email: "",
        phone: "",
        service: "",
        category: "",
        branch: "",
        date: "",
        time: "",
        staff: "",
        price: 0,
        brandEmail: "mirrorbeauty@gmail.com",
        brandPhone: "+971-50-1234567",
      });
    } catch (error) {
      console.error("Error saving invoice:", error);
      alert("Failed to save invoice. Please try again.");
    }
  };

  return (
    <AccessWrapper>
      <div className="p-6 max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold mb-6 text-center">
          Generate Invoice Receipt
        </h1>

        {/* Form */}
        <div className="grid grid-cols-1 gap-4 bg-white shadow p-4 rounded-lg mb-8">
          <input
            type="text"
            name="name"
            placeholder="Customer Name"
            value={form.name}
            onChange={handleChange}
            className="p-3 border rounded-lg"
          />
          <input
            type="email"
            name="email"
            placeholder="Email Address"
            value={form.email}
            onChange={handleChange}
            className="p-3 border rounded-lg"
          />
          <input
            type="text"
            name="phone"
            placeholder="Phone"
            value={form.phone}
            onChange={handleChange}
            className="p-3 border rounded-lg"
          />

          {/* ✅ Brand Info */}
          <input
            type="email"
            name="brandEmail"
            placeholder="Brand Email"
            value={form.brandEmail}
            onChange={handleChange}
            className="p-3 border rounded-lg"
          />
          <input
            type="text"
            name="brandPhone"
            placeholder="Brand Phone"
            value={form.brandPhone}
            onChange={handleChange}
            className="p-3 border rounded-lg"
          />

          <select
            name="service"
            value={form.service}
            onChange={handleChange}
            className="p-3 border rounded-lg"
          >
            <option value="">Select Service</option>
            {services.map((srv) => (
              <option key={srv.id} value={srv.name}>
                {srv.name} - AED {srv.price}
              </option>
            ))}
          </select>

          <select
            name="category"
            value={form.category}
            onChange={handleChange}
            className="p-3 border rounded-lg"
          >
            <option value="">Select Category</option>
            {categories.map((cat, i) => (
              <option key={i} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          <select
            name="branch"
            value={form.branch}
            onChange={handleChange}
            className="p-3 border rounded-lg"
          >
            <option value="">Select Branch</option>
            {branches.map((br, i) => (
              <option key={i} value={br}>
                {br}
              </option>
            ))}
          </select>

          <input
            type="date"
            name="date"
            value={form.date}
            onChange={handleChange}
            className="p-3 border rounded-lg"
          />
          <input
            type="time"
            name="time"
            value={form.time}
            onChange={handleChange}
            className="p-3 border rounded-lg"
          />

          <select
            name="staff"
            value={form.staff}
            onChange={handleChange}
            className="p-3 border rounded-lg"
          >
            <option value="">Select Staff</option>
            {staffList.map((stf, i) => (
              <option key={i} value={stf}>
                {stf}
              </option>
            ))}
          </select>

          <button
            onClick={generateInvoice}
            className="mt-4 py-3 px-6 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Generate PDF Invoice
          </button>
        </div>

        {/* 🔘 History Button */}
        <div className="mb-6 text-center">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="py-2 px-6 bg-gray-700 text-white rounded-lg hover:bg-gray-800"
          >
            {showHistory ? "Hide Invoice History" : "Show Invoice History"}
          </button>
        </div>

        {/* 📜 Invoice History List */}
        {showHistory && (
          <div className="bg-white shadow p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Invoice History</h2>
            {history.length === 0 ? (
              <p className="text-gray-500">No invoices generated yet.</p>
            ) : (
              <table className="w-full border">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border p-2">Booking ID</th>
                    <th className="border p-2">Customer</th>
                    <th className="border p-2">Email</th>
                    <th className="border p-2">Phone</th>
                    <th className="border p-2">Service</th>
                    <th className="border p-2">Price</th>
                    <th className="border p-2">Branch</th>
                    <th className="border p-2">Date</th>
                    <th className="border p-2">Time</th>
                    <th className="border p-2">Staff</th>
                   
                  </tr>
                </thead>
                <tbody>
                  {history.map((inv, i) => (
                    <tr key={i}>
                      <td className="border p-2">{inv.bookingId}</td>
                      <td className="border p-2">{inv.name}</td>
                      <td className="border p-2">{inv.email}</td>
                      <td className="border p-2">{inv.phone}</td>
                      <td className="border p-2">{inv.service}</td>
                      <td className="border p-2">AED {inv.price}</td>
                      <td className="border p-2">{inv.branch}</td>
                      <td className="border p-2">{inv.date}</td>
                      <td className="border p-2">{inv.time}</td>
                      <td className="border p-2">{inv.staff}</td>
                     
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </AccessWrapper>
  );
}
































