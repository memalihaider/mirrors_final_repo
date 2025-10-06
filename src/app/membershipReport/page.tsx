// "use client";

// import { useEffect, useState } from "react";
// import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
// import { db } from "@/lib/firebase";
// import { motion } from "framer-motion";
// import { Loader2, Users, Award, Calendar, Mail, User, TrendingUp, Download } from "lucide-react";
// import AccessWrapper from "@/components/AccessWrapper";

// type UserMembership = {
//   id: string;
//   membershipName: string;
//   userId: string;
//   userName: string;
//   userEmail: string;
//   createdAt?: any;
//   achievedAt?: any;
// };

// export default function MembershipReportsPage() {
//   const [records, setRecords] = useState<UserMembership[]>([]);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     const ref = collection(db, "userMemberships");
//     const q = query(ref, orderBy("createdAt", "desc"));
//     const unsub = onSnapshot(q, (snap) => {
//       const data: UserMembership[] = snap.docs.map((d) => ({
//         id: d.id,
//         ...(d.data() as any),
//       }));
//       setRecords(data);
//       setLoading(false);
//     });

//     return () => unsub();
//   }, []);

//   // Calculate stats
//   const totalMemberships = records.length;
//   const uniqueUsers = new Set(records.map(r => r.userId)).size;
//   const membershipTypes = new Set(records.map(r => r.membershipName)).size;

//   // Export functionality
//   const handleExport = () => {
//     if (records.length === 0) {
//       alert("No data to export");
//       return;
//     }

//     // Prepare CSV data
//     const headers = ["User Name", "Email", "Membership", "Achieved At", "Created At"];
//     const csvData = records.map(rec => [
//       rec.userName || "Unknown User",
//       rec.userEmail,
//       rec.membershipName,
//       rec.achievedAt?.toDate ? rec.achievedAt.toDate().toLocaleDateString('en-US', {
//         year: 'numeric',
//         month: 'short',
//         day: 'numeric',
//         hour: '2-digit',
//         minute: '2-digit'
//       }) : "-",
//       rec.createdAt?.toDate ? rec.createdAt.toDate().toLocaleDateString('en-US', {
//         year: 'numeric',
//         month: 'short',
//         day: 'numeric',
//         hour: '2-digit',
//         minute: '2-digit'
//       }) : "-"
//     ]);

//     // Convert to CSV format
//     const csvContent = [
//       headers.join(","),
//       ...csvData.map(row => row.map(field => `"${field}"`).join(","))
//     ].join("\n");

//     // Create and download file
//     const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
//     const link = document.createElement("a");
//     const url = URL.createObjectURL(blob);
//     link.setAttribute("href", url);
//     link.setAttribute("download", `membership-reports-${new Date().toISOString().split('T')[0]}.csv`);
//     link.style.visibility = "hidden";
//     document.body.appendChild(link);
//     link.click();
//     document.body.removeChild(link);
//   };

//   return (
//     <AccessWrapper>
//     <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50">
//       <div className="p-6 max-w-7xl mx-auto">
//         {/* Enhanced Header */}
//         <motion.div 
//           initial={{ opacity: 0, y: -20 }}
//           animate={{ opacity: 1, y: 0 }}
//           className="mb-8"
//         >
//           <div className="flex items-center justify-between mb-4">
//             <div className="flex items-center space-x-3">
//               <div className="p-3 bg-gradient-to-r from-pink-500 to-purple-600 rounded-xl shadow-lg">
//                 <TrendingUp className="w-8 h-8 text-white" />
//               </div>
//               <div>
//                 <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
//                   Membership Reports
//                 </h1>
//                 <p className="text-gray-600 mt-1">Track and analyze user membership achievements</p>
//               </div>
//             </div>
//             <div className="flex space-x-3">
//               <button 
//                 onClick={handleExport}
//                 disabled={loading || records.length === 0}
//                 className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg hover:from-pink-600 hover:to-purple-700 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
//               >
//                 <Download className="w-4 h-4" />
//                 <span>Export CSV</span>
//               </button>
//             </div>
//           </div>

//           {/* Stats Cards */}
//           <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
//             <motion.div 
//               initial={{ opacity: 0, y: 20 }}
//               animate={{ opacity: 1, y: 0 }}
//               transition={{ delay: 0.1 }}
//               className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow"
//             >
//               <div className="flex items-center justify-between">
//                 <div>
//                   <p className="text-gray-600 text-sm font-medium">Total Memberships</p>
//                   <p className="text-3xl font-bold text-gray-900 mt-1">{totalMemberships}</p>
//                 </div>
//                 <div className="p-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg">
//                   <Award className="w-6 h-6 text-white" />
//                 </div>
//               </div>
//             </motion.div>

//             <motion.div 
//               initial={{ opacity: 0, y: 20 }}
//               animate={{ opacity: 1, y: 0 }}
//               transition={{ delay: 0.2 }}
//               className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow"
//             >
//               <div className="flex items-center justify-between">
//                 <div>
//                   <p className="text-gray-600 text-sm font-medium">Unique Users</p>
//                   <p className="text-3xl font-bold text-gray-900 mt-1">{uniqueUsers}</p>
//                 </div>
//                 <div className="p-3 bg-gradient-to-r from-green-500 to-green-600 rounded-lg">
//                   <Users className="w-6 h-6 text-white" />
//                 </div>
//               </div>
//             </motion.div>

//             <motion.div 
//               initial={{ opacity: 0, y: 20 }}
//               animate={{ opacity: 1, y: 0 }}
//               transition={{ delay: 0.3 }}
//               className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow"
//             >
//               <div className="flex items-center justify-between">
//                 <div>
//                   <p className="text-gray-600 text-sm font-medium">Membership Types</p>
//                   <p className="text-3xl font-bold text-gray-900 mt-1">{membershipTypes}</p>
//                 </div>
//                 <div className="p-3 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg">
//                   <TrendingUp className="w-6 h-6 text-white" />
//                 </div>
//               </div>
//             </motion.div>
//           </div>
//         </motion.div>

//         {/* Enhanced Table */}
//         <motion.div 
//           initial={{ opacity: 0, y: 20 }}
//           animate={{ opacity: 1, y: 0 }}
//           transition={{ delay: 0.4 }}
//           className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden"
//         >
//           <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
//             <h2 className="text-lg font-semibold text-gray-800">Membership Records</h2>
//             <p className="text-sm text-gray-600 mt-1">Complete list of user memberships and achievements</p>
//           </div>
          
//           <div className="overflow-x-auto">
//             {loading ? (
//               <div className="p-16 flex flex-col items-center justify-center">
//                 <Loader2 className="w-8 h-8 text-pink-600 animate-spin mb-4" />
//                 <p className="text-gray-500">Loading membership reports...</p>
//               </div>
//             ) : records.length === 0 ? (
//               <div className="p-16 text-center">
//                 <Award className="w-16 h-16 text-gray-300 mx-auto mb-4" />
//                 <h3 className="text-lg font-medium text-gray-900 mb-2">No membership reports yet</h3>
//                 <p className="text-gray-500">Membership achievements will appear here once users start earning them.</p>
//               </div>
//             ) : (
//               <motion.table
//                 initial={{ opacity: 0 }}
//                 animate={{ opacity: 1 }}
//                 transition={{ delay: 0.5 }}
//                 className="min-w-full"
//               >
//                 <thead className="bg-gradient-to-r from-pink-600 to-purple-600 text-white">
//                   <tr>
//                     <th className="px-6 py-4 text-left text-sm font-semibold">
//                       <div className="flex items-center space-x-2">
//                         <User className="w-4 h-4" />
//                         <span>User</span>
//                       </div>
//                     </th>
//                     <th className="px-6 py-4 text-left text-sm font-semibold">
//                       <div className="flex items-center space-x-2">
//                         <Mail className="w-4 h-4" />
//                         <span>Email</span>
//                       </div>
//                     </th>
//                     <th className="px-6 py-4 text-left text-sm font-semibold">
//                       <div className="flex items-center space-x-2">
//                         <Award className="w-4 h-4" />
//                         <span>Membership</span>
//                       </div>
//                     </th>
//                     <th className="px-6 py-4 text-left text-sm font-semibold">
//                       <div className="flex items-center space-x-2">
//                         <Calendar className="w-4 h-4" />
//                         <span>Achieved At</span>
//                       </div>
//                     </th>
//                     <th className="px-6 py-4 text-left text-sm font-semibold">
//                       <div className="flex items-center space-x-2">
//                         <Calendar className="w-4 h-4" />
//                         <span>Created At</span>
//                       </div>
//                     </th>
//                   </tr>
//                 </thead>
//                 <tbody className="divide-y divide-gray-100">
//                   {records.map((rec, idx) => (
//                     <motion.tr
//                       key={rec.id}
//                       initial={{ opacity: 0, x: -20 }}
//                       animate={{ opacity: 1, x: 0 }}
//                       transition={{ delay: 0.1 * idx }}
//                       className="hover:bg-gradient-to-r hover:from-pink-50 hover:to-purple-50 transition-all duration-200"
//                     >
//                       <td className="px-6 py-4">
//                         <div className="flex items-center space-x-3">
//                           <div className="w-10 h-10 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full flex items-center justify-center">
//                             <span className="text-white font-semibold text-sm">
//                               {(rec.userName || rec.userEmail)?.[0]?.toUpperCase() || "U"}
//                             </span>
//                           </div>
//                           <div>
//                             <p className="font-semibold text-gray-900">{rec.userName || "Unknown User"}</p>
//                           </div>
//                         </div>
//                       </td>
//                       <td className="px-6 py-4">
//                         <span className="text-gray-700">{rec.userEmail}</span>
//                       </td>
//                       <td className="px-6 py-4">
//                         <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gradient-to-r from-pink-100 to-purple-100 text-pink-800 border border-pink-200">
//                           <Award className="w-4 h-4 mr-1" />
//                           {rec.membershipName}
//                         </span>
//                       </td>
//                       <td className="px-6 py-4 text-gray-600">
//                         {rec.achievedAt?.toDate
//                           ? rec.achievedAt.toDate().toLocaleDateString('en-US', {
//                               year: 'numeric',
//                               month: 'short',
//                               day: 'numeric',
//                               hour: '2-digit',
//                               minute: '2-digit'
//                             })
//                           : "-"}
//                       </td>
//                       <td className="px-6 py-4 text-gray-600">
//                         {rec.createdAt?.toDate
//                           ? rec.createdAt.toDate().toLocaleDateString('en-US', {
//                               year: 'numeric',
//                               month: 'short',
//                               day: 'numeric',
//                               hour: '2-digit',
//                               minute: '2-digit'
//                             })
//                           : "-"}
//                       </td>
//                     </motion.tr>
//                   ))}
//                 </tbody>
//               </motion.table>
//             )}
//           </div>
//         </motion.div>
//       </div>
//     </div>
//     </AccessWrapper>
//   );
// }


// loyalty code

"use client";

import { useEffect, useState } from "react";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { motion } from "framer-motion";
import {
  Loader2,
  Users,
  Award,
  Calendar,
  Mail,
  User,
  TrendingUp,
  Download,
  DollarSign,
  Star,
  Hash,
  RefreshCcw,
} from "lucide-react";
import AccessWrapper from "@/components/AccessWrapper";
import { Monda } from "next/font/google";

type UserMembership = {
  id: string;
  membershipName: string;
  membershipId?: string;
  userId: string;
  userName: string;
  userEmail: string;
  loyaltyPoints?: number;
  totalSpending?: number;
  createdAt?: any;
  achievedAt?: any;
  updatedAt?: any;
};

export default function MembershipReportsPage() {
  const [records, setRecords] = useState<UserMembership[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const ref = collection(db, "userMemberships");
    const q = query(ref, orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      const data: UserMembership[] = snap.docs.map((d) => ({
        id: d.id,
        
        ...(d.data() as any),
      }));
      setRecords(data);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  // Calculate stats
  const totalMemberships = records.length;
  const uniqueUsers = new Set(records.map((r) => r.userId)).size;
  const membershipTypes = new Set(records.map((r) => r.membershipName)).size;

  // Export functionality
  const handleExport = () => {
    if (records.length === 0) {
      alert("No data to export");
      return;
    }

    // Prepare CSV data
    const headers = [
      "User Name",
      "Email",
      "Membership ID",
      "Membership Name",
      "Loyalty Points",
      "Total Spending",
      "Achieved At",
      "Created At",
      "Updated At",
    ];

    const csvData = records.map((rec) => [
      rec.userName || "Unknown User",
      rec.userEmail,
      rec.membershipId || "-",
      rec.membershipName,
      rec.loyaltyPoints ?? 0,
      rec.totalSpending ?? 0,
      rec.achievedAt?.toDate
        ? rec.achievedAt.toDate().toLocaleString()
        : "-",
      rec.createdAt?.toDate
        ? rec.createdAt.toDate().toLocaleString()
        : "-",
      rec.updatedAt?.toDate
        ? rec.updatedAt.toDate().toLocaleString()
        : "-",
    ]);

    const csvContent = [
      headers.join(","),
      ...csvData.map((row) => row.map((f) => `"${f}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `membership-reports-${new Date().toISOString().split("T")[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <AccessWrapper>
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50">
        <div className="p-6 max-w-7xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-gradient-to-r from-pink-500 to-purple-600 rounded-xl shadow-lg">
                  <TrendingUp className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
                    Membership Reports
                  </h1>
                  <p className="text-gray-600 mt-1">
                    Track and analyze user membership achievements
                  </p>
                </div>
              </div>
              <button
                onClick={handleExport}
                disabled={loading || records.length === 0}
                className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg hover:from-pink-600 hover:to-purple-700 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download className="w-4 h-4" />
                <span>Export CSV</span>
              </button>
            </div>
          </motion.div>

          {/* Table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden"
          >
            <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800">
                Membership Records
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Complete list of user memberships and achievements
              </p>
            </div>

            <div className="overflow-x-auto">
              {loading ? (
                <div className="p-16 flex flex-col items-center justify-center">
                  <Loader2 className="w-8 h-8 text-pink-600 animate-spin mb-4" />
                  <p className="text-gray-500">Loading membership reports...</p>
                </div>
              ) : records.length === 0 ? (
                <div className="p-16 text-center">
                  <Award className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No membership reports yet
                  </h3>
                  <p className="text-gray-500">
                    Membership achievements will appear here once users start
                    earning them.
                  </p>
                </div>
              ) : (
                <motion.table
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="min-w-full"
                >
                  <thead className="bg-gradient-to-r from-pink-600 to-purple-600 text-white">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold">
                        <User className="w-4 h-4 inline mr-2" /> User
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold">
                        <Mail className="w-4 h-4 inline mr-2" /> Email
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold">
                        <Hash className="w-4 h-4 inline mr-2" /> Membership ID
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold">
                        <Award className="w-4 h-4 inline mr-2" /> Membership
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold">
                        <Star className="w-4 h-4 inline mr-2" /> Loyalty Points
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold">
                        <Star className="w-4 h-4 inline mr-2" /> Total
                        Spending
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold">
                        <Calendar className="w-4 h-4 inline mr-2" /> Achieved At
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold">
                        <Calendar className="w-4 h-4 inline mr-2" /> Created At
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold">
                        <RefreshCcw className="w-4 h-4 inline mr-2" /> Updated At
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {records.map((rec, idx) => (
                      <motion.tr
                        key={rec.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.05 * idx }}
                        className="hover:bg-gradient-to-r hover:from-pink-50 hover:to-purple-50 transition-all duration-200"
                      >
                        <td className="px-6 py-4">{rec.userName || "Unknown"}</td>
                        <td className="px-6 py-4">{rec.userEmail}</td>
                        <td className="px-6 py-4">{rec.membershipId || "-"}</td>
                        <td className="px-6 py-4">{rec.membershipName}</td>
                        <td className="px-6 py-4">{rec.loyaltyPoints ?? 0}</td>
                        <td className="px-6 py-4">
                          AED{rec.totalSpending?.toFixed(2) ?? "0.00"}
                        </td>
                        <td className="px-6 py-4">
                          {rec.achievedAt?.toDate
                            ? rec.achievedAt.toDate().toLocaleString()
                            : "-"}
                        </td>
                        <td className="px-6 py-4">
                          {rec.createdAt?.toDate
                            ? rec.createdAt.toDate().toLocaleString()
                            : "-"}
                        </td>
                        <td className="px-6 py-4">
                          {rec.updatedAt?.toDate
                            ? rec.updatedAt.toDate().toLocaleString()
                            : "-"}
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </motion.table>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </AccessWrapper>
  );
}

