"use client";

import React, { useEffect, useState } from "react";
import { Plus, Edit2, Trash2, Save, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";

import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

// -------- Types --------
type Membership = {
  id?: string;
  name: string;
  description: string;
  spending: number;
  createdAt?: any;
};

type LoyaltyPoint = {
  id?: string;
  name: string;
  description: string;
  points: number;
  createdAt?: any;
};

type BookingRestriction = {
  id?: string;
  number: number;
  description: string;
  createdAt?: any;
};

export default function MembershipsPage() {
  const { user } = useAuth();
  const router = useRouter();

  // -------- State --------
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [loyaltyPoints, setLoyaltyPoints] = useState<LoyaltyPoint[]>([]);
  const [bookingRestrictions, setBookingRestrictions] = useState<BookingRestriction[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [modalType, setModalType] = useState<"membership" | "loyalty" | "restriction">("membership");
  const [form, setForm] = useState<{ name: string; description: string; spending?: string; points?: string; number?: string }>({
    name: "",
    description: "",
    spending: "",
    points: "",
    number: "",
  });
  const [saving, setSaving] = useState(false);

  // -------- Fetch Data --------
  useEffect(() => {
    if (!db) return;
    
    setLoading(true);
    try {
      // Initialize collection references inside useEffect
      const membershipsRef = collection(db, "memberships");
      const loyaltyPointsRef = collection(db, "loyaltyPoints");
      const bookingRestrictionsRef = collection(db, "bookingRestrictions");

      const q1 = query(membershipsRef, orderBy("createdAt", "asc"));
      const unsub1 = onSnapshot(q1, (snap) => {
        setMemberships(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })));
      });

      const q2 = query(loyaltyPointsRef, orderBy("createdAt", "asc"));
      const unsub2 = onSnapshot(q2, (snap) => {
        setLoyaltyPoints(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })));
      });

      const q3 = query(bookingRestrictionsRef, orderBy("createdAt", "asc"));
      const unsub3 = onSnapshot(q3, (snap) => {
        setBookingRestrictions(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })));
        setLoading(false);
      });

      return () => {
        unsub1();
        unsub2();
        unsub3();
      };
    } catch (err) {
      console.error("subscribe error:", err);
      setLoading(false);
    }
  }, []);

  // -------- Modal Helpers --------
  const openAddModal = (type: "membership" | "loyalty" | "restriction") => {
    setForm({ name: "", description: "", spending: "", points: "", number: "" });
    setEditingId(null);
    setModalType(type);
    setIsModalOpen(true);
  };

  const openEditModal = (item: any, type: "membership" | "loyalty" | "restriction") => {
    setForm({
      name: item.name || "",
      description: item.description || "",
      spending: type === "membership" ? item.spending?.toString() || "" : "",
      points: type === "loyalty" ? item.points?.toString() || "" : "",
      number: type === "restriction" ? item.number?.toString() || "" : "",
    });
    setEditingId(item.id || null);
    setModalType(type);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setForm({ name: "", description: "", spending: "", points: "", number: "" });
    setSaving(false);
  };

  // -------- Save --------
  const handleSave = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (modalType !== "restriction" && !form.name.trim()) {
      alert("Please enter a name.");
      return;
    }

    if (modalType === "membership" && (!form.spending || isNaN(Number(form.spending)))) {
      alert("Please enter a valid spending amount.");
      return;
    }

    if (modalType === "loyalty" && (!form.points || isNaN(Number(form.points)))) {
      alert("Please enter a valid points value.");
      return;
    }

    if (modalType === "restriction" && (!form.number || isNaN(Number(form.number)))) {
      alert("Please enter a valid number for restriction.");
      return;
    }

    setSaving(true);
    try {
      if (modalType === "membership") {
        if (editingId) {
          await updateDoc(doc(db, "memberships", editingId), {
            name: form.name.trim(),
            description: form.description.trim(),
            spending: Number(form.spending),
            updatedAt: serverTimestamp(),
          });
        } else {
          await addDoc(collection(db, "memberships"), {
            name: form.name.trim(),
            description: form.description.trim(),
            spending: Number(form.spending),
            createdAt: serverTimestamp(),
          });
        }
      } else if (modalType === "loyalty") {
        if (editingId) {
          await updateDoc(doc(db, "loyaltyPoints", editingId), {
            name: form.name.trim(),
            description: form.description.trim(),
            points: Number(form.points),
            updatedAt: serverTimestamp(),
          });
        } else {
          await addDoc(collection(db, "loyaltyPoints"), {
            name: form.name.trim(),
            description: form.description.trim(),
            points: Number(form.points),
            createdAt: serverTimestamp(),
          });
        }
      } else if (modalType === "restriction") {
        if (editingId) {
          await updateDoc(doc(db, "bookingRestrictions", editingId), {
            number: Number(form.number),
            description: form.description.trim(),
            updatedAt: serverTimestamp(),
          });
        } else {
          await addDoc(collection(db, "bookingRestrictions"), {
            number: Number(form.number),
            description: form.description.trim(),
            createdAt: serverTimestamp(),
          });
        }
      }
      closeModal();
    } catch (err) {
      console.error("save error:", err);
      alert("Error saving item. See console.");
      setSaving(false);
    }
  };

  // -------- Delete --------
  const handleDelete = async (id?: string, type: "membership" | "loyalty" | "restriction" = "membership") => {
    if (!id) return;
    if (!confirm("Are you sure you want to delete this item?")) return;
    try {
      await deleteDoc(doc(db, type === "membership" ? "memberships" : type === "loyalty" ? "loyaltyPoints" : "bookingRestrictions", id));
    } catch (err) {
      console.error("delete error:", err);
      alert("Error deleting. See console.");
    }
  };

  // -------- Render --------
  return (
    <div className="p-6 max-w-5xl mx-auto space-y-10">
      {/* Memberships Section */}
      {/* ---------- MEMBERSHIPS JSX ---------- */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold text-indigo-600">Memberships</h2>
          <button
            onClick={() => openAddModal("membership")}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-indigo-500 to-indigo-600 text-white shadow-lg hover:scale-[1.01] transition"
          >
            <Plus className="w-4 h-4" />
            Add Membership
          </button>
        </div>

        {loading ? (
          <div className="p-6 rounded-lg bg-white/80">Loading...</div>
        ) : memberships.length === 0 ? (
          <div className="p-6 rounded-lg bg-white/80 text-center">
            No memberships yet. Click "Add Membership" to create one.
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-3">
            {memberships.map((m) => (
              <div
                key={m.id}
                className="bg-white/90 dark:bg-gray-900 p-4 rounded-2xl border border-indigo-100/30 shadow"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-indigo-700">{m.name}</h3>
                    <p className="text-sm text-gray-600 mt-1">{m.description}</p>
                    <p className="text-sm font-medium text-indigo-500 mt-2">Spending: {m.spending}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => openEditModal(m, "membership")} className="p-1 hover:bg-gray-100 rounded-md">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(m.id, "membership")} className="p-1 hover:bg-red-50 rounded-md">
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Loyalty Points Section */}
      {/* ---------- LOYALTY JSX ---------- */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold text-emerald-600">Loyalty Points</h2>
          <button
            onClick={() => openAddModal("loyalty")}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg hover:scale-[1.01] transition"
          >
            <Plus className="w-4 h-4" />
            Add Loyalty
          </button>
        </div>

        {loading ? (
          <div className="p-6 rounded-lg bg-white/80">Loading...</div>
        ) : loyaltyPoints.length === 0 ? (
          <div className="p-6 rounded-lg bg-white/80 text-center">
            No loyalty points yet. Click "Add Loyalty" to create one.
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-3">
            {loyaltyPoints.map((lp) => (
              <div
                key={lp.id}
                className="bg-white/90 dark:bg-gray-900 p-4 rounded-2xl border border-emerald-100/30 shadow"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-emerald-700">{lp.name}</h3>
                    <p className="text-sm text-gray-600 mt-1">{lp.description}</p>
                    <p className="text-sm font-medium text-emerald-500 mt-2">Points: {lp.points}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => openEditModal(lp, "loyalty")} className="p-1 hover:bg-gray-100 rounded-md">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(lp.id, "loyalty")} className="p-1 hover:bg-red-50 rounded-md">
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Booking Restrictions Section */}
      {/* ---------- RESTRICTIONS JSX ---------- */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold text-rose-600">Booking Restrictions</h2>
          <button
            onClick={() => openAddModal("restriction")}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-rose-500 to-rose-600 text-white shadow-lg hover:scale-[1.01] transition"
          >
            <Plus className="w-4 h-4" />
            Add Restriction
          </button>
        </div>

        {loading ? (
          <div className="p-6 rounded-lg bg-white/80">Loading...</div>
        ) : bookingRestrictions.length === 0 ? (
          <div className="p-6 rounded-lg bg-white/80 text-center">
            No restrictions yet. Click "Add Restriction" to create one.
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-3">
            {bookingRestrictions.map((br) => (
              <div
                key={br.id}
                className="bg-white/90 dark:bg-gray-900 p-4 rounded-2xl border border-rose-100/30 shadow"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-rose-700">Limit: {br.number}</h3>
                    <p className="text-sm text-gray-600 mt-1">{br.description}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => openEditModal(br, "restriction")} className="p-1 hover:bg-gray-100 rounded-md">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(br.id, "restriction")} className="p-1 hover:bg-red-50 rounded-md">
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            key="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center"
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={closeModal}
            />

            <motion.form
              key="modal-panel"
              initial={{ y: -20, opacity: 0, scale: 0.98 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 10, opacity: 0, scale: 0.98 }}
              transition={{ type: "spring", stiffness: 400, damping: 28 }}
              onSubmit={handleSave}
              className="relative z-50 w-full max-w-lg bg-white/95 dark:bg-gray-900/95 rounded-2xl p-6 shadow-xl border"
            >
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-medium">
                  {editingId
                    ? `Edit ${modalType === "membership" ? "Membership" : modalType === "loyalty" ? "Loyalty Point" : "Restriction"}`
                    : `New ${modalType === "membership" ? "Membership" : modalType === "loyalty" ? "Loyalty Point" : "Restriction"}`}
                </h4>
                <button type="button" onClick={closeModal} className="p-1 rounded-md hover:bg-gray-100">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3">
                {modalType !== "restriction" && (
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Name</label>
                    <input
                      value={form.name}
                      onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg border bg-white text-sm"
                      placeholder="Enter name"
                      required={modalType !== "restriction"}
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs text-gray-600 mb-1">Description</label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm((s) => ({ ...s, description: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border bg-white text-sm min-h-[80px]"
                    placeholder="Short description"
                  />
                </div>

                {modalType === "membership" && (
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Spending</label>
                    <input
                      type="number"
                      value={form.spending}
                      onChange={(e) => setForm((s) => ({ ...s, spending: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg border bg-white text-sm"
                      placeholder="Enter spending amount"
                      required
                    />
                  </div>
                )}

                {modalType === "loyalty" && (
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Points</label>
                    <input
                      type="number"
                      value={form.points}
                      onChange={(e) => setForm((s) => ({ ...s, points: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg border bg-white text-sm"
                      placeholder="Enter points"
                      required
                    />
                  </div>
                )}

                {modalType === "restriction" && (
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Restriction Limit</label>
                    <input
                      type="number"
                      value={form.number}
                      onChange={(e) => setForm((s) => ({ ...s, number: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg border bg-white text-sm"
                      placeholder="Enter restriction number"
                      required
                    />
                  </div>
                )}
              </div>

              <div className="mt-6 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 text-sm rounded-lg border bg-gray-50 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white shadow hover:bg-indigo-700 disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {saving ? "Saving..." : "Save"}
                </button>
              </div>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
