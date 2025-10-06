"use client";

import { useEffect, useState } from "react";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { motion } from "framer-motion";
import {
  Loader2,
  Users,
  Calendar,
  Mail,
  User,
  TrendingUp,
  Download,
  Hash,
  RefreshCcw,
  MessageSquare,
  Award
} from "lucide-react";
import AccessWrapper from "@/components/AccessWrapper";

type FeedbackRecord = {
  id: string;
  bookingDate?: any;
  bookingId?: string;
  bookingTime?: string;
  branch?: string;
  createdAt?: any;
  message?: string;
  serviceName?: string;
  userEmail?: string;
  userId?: string;
  userName?: string;
};

export default function FeedbackReportsPage() {
  const [records, setRecords] = useState<FeedbackRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const ref = collection(db, "feedback");
    const q = query(ref, orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      const data: FeedbackRecord[] = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as any),
      }));
      setRecords(data);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  // Stats
  const totalFeedbacks = records.length;
  const uniqueUsers = new Set(records.map((r) => r.userId)).size;
  const uniqueBranches = new Set(records.map((r) => r.branch)).size;

  // Export CSV
  const handleExport = () => {
    if (records.length === 0) {
      alert("No data to export");
      return;
    }

    const headers = [
      "Booking Date",
      "Booking ID",
      "Booking Time",
      "Branch",
      "Created At",
      "Message",
      "Service Name",
      "User Email",
      "User ID",
      "User Name",
    ];

    const csvData = records.map((rec) => [
      rec.bookingDate?.toDate
        ? rec.bookingDate.toDate().toLocaleString()
        : "-",
      rec.bookingId || "-",
      rec.bookingTime || "-",
      rec.branch || "-",
      rec.createdAt?.toDate
        ? rec.createdAt.toDate().toLocaleString()
        : "-",
      rec.message || "-",
      rec.serviceName || "-",
      rec.userEmail || "-",
      rec.userId || "-",
      rec.userName || "-",
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
      `feedback-reports-${new Date().toISOString().split("T")[0]}.csv`
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
                  <MessageSquare className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
                    Feedback Reports
                  </h1>
                  <p className="text-gray-600 mt-1">
                    View and analyze customer feedback data
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

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">
                      Total Feedbacks
                    </p>
                    <p className="text-3xl font-bold text-gray-900 mt-1">
                      {totalFeedbacks}
                    </p>
                  </div>
                  <div className="p-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg">
                    <MessageSquare className="w-6 h-6 text-white" />
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">
                      Unique Users
                    </p>
                    <p className="text-3xl font-bold text-gray-900 mt-1">
                      {uniqueUsers}
                    </p>
                  </div>
                  <div className="p-3 bg-gradient-to-r from-green-500 to-green-600 rounded-lg">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">
                      Branches
                    </p>
                    <p className="text-3xl font-bold text-gray-900 mt-1">
                      {uniqueBranches}
                    </p>
                  </div>
                  <div className="p-3 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg">
                    <Calendar className="w-6 h-6 text-white" />
                  </div>
                </div>
              </motion.div>
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
                Feedback Records
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                List of all feedback collected from users
              </p>
            </div>

            <div className="overflow-x-auto">
              {loading ? (
                <div className="p-16 flex flex-col items-center justify-center">
                  <Loader2 className="w-8 h-8 text-pink-600 animate-spin mb-4" />
                  <p className="text-gray-500">Loading feedback reports...</p>
                </div>
              ) : records.length === 0 ? (
                <div className="p-16 text-center">
                  <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No feedback found
                  </h3>
                  <p className="text-gray-500">
                    Feedback will appear here once users submit them.
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
                        <Calendar className="w-4 h-4 inline mr-2" /> Booking Date
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold">
                        <Hash className="w-4 h-4 inline mr-2" /> Booking ID
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold">
                        <Calendar className="w-4 h-4 inline mr-2" /> Booking Time
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold">
                        <Calendar className="w-4 h-4 inline mr-2" /> Branch
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold">
                        <Calendar className="w-4 h-4 inline mr-2" /> Created At
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold">
                        <MessageSquare className="w-4 h-4 inline mr-2" /> Message
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold">
                        <Award className="w-4 h-4 inline mr-2" /> Service Name
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold">
                        <Mail className="w-4 h-4 inline mr-2" /> User Email
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold">
                        <User className="w-4 h-4 inline mr-2" /> User Name
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
                        <td className="px-6 py-4">
                          {rec.bookingDate?.toDate
                            ? rec.bookingDate.toDate().toLocaleDateString()
                            : "-"}
                        </td>
                        <td className="px-6 py-4">{rec.bookingId || "-"}</td>
                        <td className="px-6 py-4">{rec.bookingTime || "-"}</td>
                        <td className="px-6 py-4">{rec.branch || "-"}</td>
                        <td className="px-6 py-4">
                          {rec.createdAt?.toDate
                            ? rec.createdAt.toDate().toLocaleString()
                            : "-"}
                        </td>
                        <td className="px-6 py-4">{rec.message || "-"}</td>
                        <td className="px-6 py-4">{rec.serviceName || "-"}</td>
                        <td className="px-6 py-4">{rec.userEmail || "-"}</td>
                        <td className="px-6 py-4">{rec.userName || "-"}</td>
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
