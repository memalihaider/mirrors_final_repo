// 'use client';

// import React, { useEffect, useState } from "react";
// import { motion, AnimatePresence } from "framer-motion";
// import {
//   Package,
//   Warehouse,
//   TrendingUp,
//   Plus,
//   Edit,
//   Trash2,
//   X,
//   Save
// } from "lucide-react";
// import ProductSearchBar from '@/components/ProductSearchBar';
// import {
//   collection,
//   query,
//   orderBy,
//   onSnapshot,
//   addDoc,
//   updateDoc,
//   deleteDoc,
//   doc,
//   serverTimestamp,
// } from "firebase/firestore";
// import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
// import { db, storage } from "@/lib/firebase";
// import AccessWrapper from "@/components/AccessWrapper";

// export default function EcommercePage() {
//   const [activeSection, setActiveSection] = useState("products");
//   const [products, setProducts] = useState([]);
//   const [filteredProducts, setFilteredProducts] = useState([]);
//   const [loading, setLoading] = useState(true);

//   const [isModalOpen, setIsModalOpen] = useState(false);
//   const [editingId, setEditingId] = useState(null);
//   const [form, setForm] = useState({
//     name: "",
//     category: "",
   
//     price: "",
//     stock: "",
//     status: "active",
//     image: "",
//     imageFile: null,
//   });
//   const [saving, setSaving] = useState(false);

//   useEffect(() => {
//     if (!db) return;
//     setLoading(true);
//     const productsRef = collection(db, "products");
//     const q = query(productsRef, orderBy("createdAt", "asc"));
//     const unsub = onSnapshot(q, (snap) => {
//       const productsData = snap.docs.map((d) => ({ id: d.id, ...(d.data()) }));
//       setProducts(productsData);
//       setFilteredProducts(productsData);
//       setLoading(false);
//     });
//     return () => unsub();
//   }, []);

//   const openAddModal = () => {
//     setForm({
//       name: "",
//       category: "",
//       price: "",
//       stock: "",
//       status: "active",
//       image: "",
//       imageFile: null,
     
//     });
//     setEditingId(null);
//     setIsModalOpen(true);
//   };

//   const openEditModal = (item) => {
//     setForm({
//       name: item.name || "",
//       category: item.category || "",
//       price: item.price?.toString() || "",
//       stock: item.stock?.toString() || "",
//       status: item.status || "active",
//       image: item.image || "",
//       imageFile: null,
//     });
//     setEditingId(item.id || null);
//     setIsModalOpen(true);
//   };

//   const closeModal = () => {
//     setIsModalOpen(false);
//     setEditingId(null);
//     setForm({
//       name: "",
//       category: "",
//       price: "",
//       stock: "",
//       status: "active",
//       image: "",
//       imageFile: null,
//     });
//     setSaving(false);
//   };

//   const handleSave = async (e) => {
//     e?.preventDefault();
//     if (!form.name.trim() || !form.category.trim()) {
//       alert("Please fill all required fields.");
//       return;
//     }
//     if (!form.price || isNaN(Number(form.price))) {
//       alert("Please enter valid price.");
//       return;
//     }
//     if (!form.stock || isNaN(Number(form.stock))) {
//       alert("Please enter valid stock.");
//       return;
//     }

//     setSaving(true);
//     try {
//       let imageUrl = form.image || "";

//       // ✅ Upload new image if file selected
//       if (form.imageFile) {
//         try {
//           const fileRef = ref(storage, `products/${Date.now()}-${form.imageFile.name}`);
//           await uploadBytes(fileRef, form.imageFile);
//           imageUrl = await getDownloadURL(fileRef);
//           console.log("✅ Image uploaded:", imageUrl);
//         } catch (err) {
//           console.error("❌ Image upload failed:", err);
//           alert("Image upload failed. Check Firebase Storage rules.");
//           setSaving(false);
//           return;
//         }
//       }

//       if (editingId) {
//         await updateDoc(doc(db, "products", editingId), {
//           name: form.name.trim(),
//           category: form.category.trim(),
//           price: Number(form.price),
//           stock: Number(form.stock),
//           status: form.status,
//           image: imageUrl,
//           updatedAt: serverTimestamp(),
//         });
//       } else {
//         await addDoc(collection(db, "products"), {
//           name: form.name.trim(),
//           category: form.category.trim(),
//           price: Number(form.price),
//           stock: Number(form.stock),
//           status: form.status,
//           image: imageUrl,
//           sold: 0,
//           createdAt: serverTimestamp(),
//         });
//       }
//       closeModal();
//     } catch (err) {
//       console.error("Error saving product:", err);
//       alert("Error saving product.");
//       setSaving(false);
//     }
//   };

//   const handleDelete = async (id) => {
//     if (!id || !confirm("Are you sure you want to delete this product?")) return;
//     try {
//       await deleteDoc(doc(db, "products", id));
//     } catch (err) {
//       console.error(err);
//     }
//   };

//   const getStockStatus = (stock) => {
//     if (stock === 0)
//       return { label: "Out of Stock", color: "text-red-600 bg-red-50" };
//     if (stock < 15)
//       return { label: "Low Stock", color: "text-yellow-600 bg-yellow-50" };
//     return { label: "In Stock", color: "text-green-600 bg-green-50" };
//   };

//   const totalRevenue = products.reduce(
//     (sum, p) => sum + (p.sold || 0) * p.price,
//     0
//   );

//   const navigationItems = [
//     { id: "products", label: "Products", icon: Package, color: "bg-blue-500" },
//     { id: "inventory", label: "Inventory", icon: Warehouse, color: "bg-green-500" },
//     { id: "sales", label: "Sales", icon: TrendingUp, color: "bg-purple-500" },
//   ];

//   const renderProducts = () => (
//     <div className="space-y-6">
//       <div className="flex justify-between items-center">
//         <h2 className="text-2xl font-bold">Products</h2>
//         <button
//           onClick={openAddModal}
//           className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg"
//         >
//           <Plus /> Add Product
//         </button>
//       </div>
//       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
//         {filteredProducts.map((product) => {
//           const stockStatus = getStockStatus(product.stock);
//           return (
//             <motion.div
//               key={product.id}
//               initial={{ opacity: 0, y: 20 }}
//               animate={{ opacity: 1, y: 0 }}
//               className="bg-white rounded-xl border p-6"
//             >
//               <div className="flex justify-between mb-4">
//                 <div className="font-semibold text-lg">{product.name}</div>
                 
//                 <span
//                   className={`px-2 py-1 rounded-full text-xs font-medium ${stockStatus.color}`}
//                 >
//                   {stockStatus.label}
//                 </span>
//               </div>
//               <div>AED{product.price}</div>
//               <div>{product.stock} in stock</div>
//               {product.image && (
//                 <img
//                   src={product.image}
//                   alt={product.name}
//                   className="mt-2 w-full h-32 object-cover rounded"
//                 />
//               )}
//               <div className="flex gap-2 mt-4">
//                 <button
//                   onClick={() => openEditModal(product)}
//                   className="bg-yellow-500 px-3 py-1 rounded text-white flex items-center gap-1"
//                 >
//                   <Edit /> Edit
//                 </button>
//                 <button
//                   onClick={() => handleDelete(product.id)}
//                   className="bg-red-600 px-3 py-1 rounded text-white flex items-center gap-1"
//                 >
//                   <Trash2 /> Delete
//                 </button>
//               </div>
//             </motion.div>
//           );
//         })}
//       </div>
//     </div>
//   );

//   const renderInventory = () => (
//     <div className="space-y-6">
//       <h2 className="text-2xl font-bold">Inventory</h2>
//       <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//         {filteredProducts.map((p) => {
//           const stockStatus = getStockStatus(p.stock);
//           return (
//             <div key={p.id} className="bg-white p-4 rounded-lg border">
//               <div className="flex justify-between">
//                 <span>{p.name}</span>
//                 <span className={stockStatus.color}>{stockStatus.label}</span>
//               </div>
//               <div>{p.stock} in stock</div>
//             </div>
//           );
//         })}
//       </div>
//     </div>
//   );

//   const renderSales = () => (
//     <div className="space-y-6">
//       <h2 className="text-2xl font-bold">Sales</h2>
//       <div className="bg-white p-6 rounded-lg border">
//         Total Revenue: AED{totalRevenue}
//       </div>
//     </div>
//   );

//   return (
//     <AccessWrapper>
//       <div className="min-h-screen bg-gray-50 p-6">
//         <h1 className="text-3xl font-bold mb-4">E-Commerce Dashboard</h1>
        
//         {/* Search Bar - Only show on products and inventory sections */}
//         {(activeSection === "products" || activeSection === "inventory") && (
//           <div className="mb-6">
//             <ProductSearchBar 
//               products={products}
//               onFilteredProducts={setFilteredProducts}
//             />
//           </div>
//         )}
        
//         <div className="flex gap-2 mb-6">
//           {navigationItems.map((item) => (
//             <button
//               key={item.id}
//               onClick={() => setActiveSection(item.id)}
//               className={`px-4 py-2 rounded ${
//                 activeSection === item.id
//                   ? "bg-gray-900 text-white"
//                   : "bg-white text-gray-900 border"
//               }`}
//             >
//               <item.icon className="inline-block w-4 h-4 mr-1" /> {item.label}
//             </button>
//           ))}
//         </div>
//         <AnimatePresence mode="wait">
//           <motion.div
//             key={activeSection}
//             initial={{ opacity: 0 }}
//             animate={{ opacity: 1 }}
//             exit={{ opacity: 0 }}
//           >
//             {activeSection === "products" && renderProducts()}
//             {activeSection === "inventory" && renderInventory()}
//             {activeSection === "sales" && renderSales()}
//           </motion.div>
//         </AnimatePresence>

//         <AnimatePresence>
//           {isModalOpen && (
//             <motion.div
//               className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50"
//               initial={{ opacity: 0 }}
//               animate={{ opacity: 1 }}
//               exit={{ opacity: 0 }}
//             >
//               <motion.div
//                 className="bg-white p-6 rounded-lg w-96"
//                 initial={{ scale: 0.9 }}
//                 animate={{ scale: 1 }}
//                 exit={{ scale: 0.9 }}
//               >
//                 <h2 className="text-lg font-bold mb-4">
//                   {editingId ? "Edit Product" : "Add Product"}
//                 </h2>
//                 <form onSubmit={handleSave} className="space-y-3">
//                   <input
//                     type="text"
//                     placeholder="Name"
//                     value={form.name}
//                     onChange={(e) =>
//                       setForm({ ...form, name: e.target.value })
//                     }
//                     className="w-full border p-2"
//                   />
//                   <input
//                     type="text"
//                     placeholder="Category"
//                     value={form.category}
//                     onChange={(e) =>
//                       setForm({ ...form, category: e.target.value })
//                     }
//                     className="w-full border p-2"
//                   />
//                   <input
//                     type="number"
//                     placeholder="Price"
//                     value={form.price}
//                     onChange={(e) =>
//                       setForm({ ...form, price: e.target.value })
//                     }
//                     className="w-full border p-2"
//                   />
//                   <input
//                     type="number"
//                     placeholder="Stock"
//                     value={form.stock}
//                     onChange={(e) =>
//                       setForm({ ...form, stock: e.target.value })
//                     }
//                     className="w-full border p-2"
//                   />
//                   <select
//                     value={form.status}
//                     onChange={(e) =>
//                       setForm({ ...form, status: e.target.value })
//                     }
//                     className="w-full border p-2"
//                   >
//                     <option value="active">Active</option>
//                     <option value="inactive">Inactive</option>
//                   </select>

//                   {/* Image Upload */}
//                   <input
//                     type="file"
//                     accept="image/*"
//                     onChange={(e) => {
//                       const file = e.target.files?.[0];
//                       if (file) {
//                         setForm({ ...form, imageFile: file });
//                       }
//                     }}
//                     className="w-full border p-2"
//                   />

//                   <div className="flex justify-end gap-2">
//                     <button
//                       type="button"
//                       onClick={closeModal}
//                       className="px-3 py-1 bg-gray-300 rounded"
//                     >
//                       <X />
//                     </button>
//                     <button
//                       type="submit"
//                       disabled={saving}
//                       className="px-3 py-1 bg-blue-600 text-white rounded"
//                     >
//                       <Save />
//                     </button>
//                   </div>
//                 </form>
//               </motion.div>
//             </motion.div>
//           )}
//         </AnimatePresence>
//       </div>
//     </AccessWrapper>
//   );
// }


// new desc final code
// 'use client';

// import React, { useEffect, useState } from "react";
// import { motion, AnimatePresence } from "framer-motion";
// import {
//   Package,
//   Warehouse,
//   TrendingUp,
//   Plus,
//   Edit,
//   Trash2,
//   X,
//   Save
// } from "lucide-react";
// import ProductSearchBar from '@/components/ProductSearchBar';
// import {
//   collection,
//   query,
//   orderBy,
//   onSnapshot,
//   addDoc,
//   updateDoc,
//   deleteDoc,
//   doc,
//   serverTimestamp,
// } from "firebase/firestore";
// import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
// import { db, storage } from "@/lib/firebase";
// import AccessWrapper from "@/components/AccessWrapper";

// export default function EcommercePage() {
//   const [activeSection, setActiveSection] = useState("products");
//   const [products, setProducts] = useState([]);
//   const [filteredProducts, setFilteredProducts] = useState([]);
//   const [loading, setLoading] = useState(true);

//   const [isModalOpen, setIsModalOpen] = useState(false);
//   const [editingId, setEditingId] = useState(null);
//   const [form, setForm] = useState({
//     name: "",
//     category: "",
//     price: "",
//     stock: "",
//     status: "active",
//     image: "",
//     imageFile: null,
//     description: "", // ✅ new field
//   });
//   const [saving, setSaving] = useState(false);

//   // ✅ track which product description is expanded
//   const [expanded, setExpanded] = useState({});

//   useEffect(() => {
//     if (!db) return;
//     setLoading(true);
//     const productsRef = collection(db, "products");
//     const q = query(productsRef, orderBy("createdAt", "asc"));
//     const unsub = onSnapshot(q, (snap) => {
//       const productsData = snap.docs.map((d) => ({ id: d.id, ...(d.data()) }));
//       setProducts(productsData);
//       setFilteredProducts(productsData);
//       setLoading(false);
//     });
//     return () => unsub();
//   }, []);

//   const openAddModal = () => {
//     setForm({
//       name: "",
//       category: "",
//       price: "",
//       stock: "",
//       status: "active",
//       image: "",
//       imageFile: null,
//       description: "", // ✅ reset
//     });
//     setEditingId(null);
//     setIsModalOpen(true);
//   };

//   const openEditModal = (item) => {
//     setForm({
//       name: item.name || "",
//       category: item.category || "",
//       price: item.price?.toString() || "",
//       stock: item.stock?.toString() || "",
//       status: item.status || "active",
//       image: item.image || "",
//       imageFile: null,
//       description: item.description || "", // ✅ load
//     });
//     setEditingId(item.id || null);
//     setIsModalOpen(true);
//   };

//   const closeModal = () => {
//     setIsModalOpen(false);
//     setEditingId(null);
//     setForm({
//       name: "",
//       category: "",
//       price: "",
//       stock: "",
//       status: "active",
//       image: "",
//       imageFile: null,
//       description: "", // ✅ reset
//     });
//     setSaving(false);
//   };

//   const handleSave = async (e) => {
//     e?.preventDefault();
//     if (!form.name.trim() || !form.category.trim()) {
//       alert("Please fill all required fields.");
//       return;
//     }
//     if (!form.price || isNaN(Number(form.price))) {
//       alert("Please enter valid price.");
//       return;
//     }
//     if (!form.stock || isNaN(Number(form.stock))) {
//       alert("Please enter valid stock.");
//       return;
//     }

//     setSaving(true);
//     try {
//       let imageUrl = form.image || "";

//       if (form.imageFile) {
//         try {
//           const fileRef = ref(storage, `products/${Date.now()}-${form.imageFile.name}`);
//           await uploadBytes(fileRef, form.imageFile);
//           imageUrl = await getDownloadURL(fileRef);
//           console.log("✅ Image uploaded:", imageUrl);
//         } catch (err) {
//           console.error("❌ Image upload failed:", err);
//           alert("Image upload failed. Check Firebase Storage rules.");
//           setSaving(false);
//           return;
//         }
//       }

//       if (editingId) {
//         await updateDoc(doc(db, "products", editingId), {
//           name: form.name.trim(),
//           category: form.category.trim(),
//           price: Number(form.price),
//           stock: Number(form.stock),
//           status: form.status,
//           image: imageUrl,
//           description: form.description.trim(), // ✅ save
//           updatedAt: serverTimestamp(),
//         });
//       } else {
//         await addDoc(collection(db, "products"), {
//           name: form.name.trim(),
//           category: form.category.trim(),
//           price: Number(form.price),
//           stock: Number(form.stock),
//           status: form.status,
//           image: imageUrl,
//           description: form.description.trim(), // ✅ save
//           sold: 0,
//           createdAt: serverTimestamp(),
//         });
//       }
//       closeModal();
//     } catch (err) {
//       console.error("Error saving product:", err);
//       alert("Error saving product.");
//       setSaving(false);
//     }
//   };

//   const handleDelete = async (id) => {
//     if (!id || !confirm("Are you sure you want to delete this product?")) return;
//     try {
//       await deleteDoc(doc(db, "products", id));
//     } catch (err) {
//       console.error(err);
//     }
//   };

//   const getStockStatus = (stock) => {
//     if (stock === 0)
//       return { label: "Out of Stock", color: "text-red-600 bg-red-50" };
//     if (stock < 15)
//       return { label: "Low Stock", color: "text-yellow-600 bg-yellow-50" };
//     return { label: "In Stock", color: "text-green-600 bg-green-50" };
//   };

//   const totalRevenue = products.reduce(
//     (sum, p) => sum + (p.sold || 0) * p.price,
//     0
//   );

//   const navigationItems = [
//     { id: "products", label: "Products", icon: Package, color: "bg-blue-500" },
//     { id: "inventory", label: "Inventory", icon: Warehouse, color: "bg-green-500" },
//     { id: "sales", label: "Sales", icon: TrendingUp, color: "bg-purple-500" },
//   ];

//   const renderProducts = () => (
//     <div className="space-y-6">
//       <div className="flex justify-between items-center">
//         <h2 className="text-2xl font-bold">Products</h2>
//         <button
//           onClick={openAddModal}
//           className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg"
//         >
//           <Plus /> Add Product
//         </button>
//       </div>
//       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
//         {filteredProducts.map((product) => {
//           const stockStatus = getStockStatus(product.stock);
//           const isExpanded = expanded[product.id];
//           const desc = product.description || "";

//           return (
//             <motion.div
//               key={product.id}
//               initial={{ opacity: 0, y: 20 }}
//               animate={{ opacity: 1, y: 0 }}
//               className="bg-white rounded-xl border p-6"
//             >
//               <div className="flex justify-between mb-4">
//                 <div className="font-semibold text-lg">{product.name}</div>
//                 <span
//                   className={`px-2 py-1 rounded-full text-xs font-medium ${stockStatus.color}`}
//                 >
//                   {stockStatus.label}
//                 </span>
//               </div>

//               {/* ✅ Description with truncate + toggle */}
//               {desc && (
//                 <div className="text-gray-700 text-sm mb-2">
//                   {isExpanded ? desc : desc.slice(0, 100)}
//                   {desc.length > 100 && (
//                     <button
//                       onClick={() =>
//                         setExpanded((prev) => ({
//                           ...prev,
//                           [product.id]: !isExpanded,
//                         }))
//                       }
//                       className="text-blue-600 ml-1"
//                     >
//                       {isExpanded ? "Show Less" : "Read More"}
//                     </button>
//                   )}
//                 </div>
//               )}

//               <div>AED{product.price}</div>
//               <div>{product.stock} in stock</div>
//               {product.image && (
//                 <img
//                   src={product.image}
//                   alt={product.name}
//                   className="mt-2 w-full h-32 object-cover rounded"
//                 />
//               )}
//               <div className="flex gap-2 mt-4">
//                 <button
//                   onClick={() => openEditModal(product)}
//                   className="bg-yellow-500 px-3 py-1 rounded text-white flex items-center gap-1"
//                 >
//                   <Edit /> Edit
//                 </button>
//                 <button
//                   onClick={() => handleDelete(product.id)}
//                   className="bg-red-600 px-3 py-1 rounded text-white flex items-center gap-1"
//                 >
//                   <Trash2 /> Delete
//                 </button>
//               </div>
//             </motion.div>
//           );
//         })}
//       </div>
//     </div>
//   );

//   const renderInventory = () => (
//     <div className="space-y-6">
//       <h2 className="text-2xl font-bold">Inventory</h2>
//       <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//         {filteredProducts.map((p) => {
//           const stockStatus = getStockStatus(p.stock);
//           return (
//             <div key={p.id} className="bg-white p-4 rounded-lg border">
//               <div className="flex justify-between">
//                 <span>{p.name}</span>
//                 <span className={stockStatus.color}>{stockStatus.label}</span>
//               </div>
//               <div>{p.stock} in stock</div>
//             </div>
//           );
//         })}
//       </div>
//     </div>
//   );

//   const renderSales = () => (
//     <div className="space-y-6">
//       <h2 className="text-2xl font-bold">Sales</h2>
//       <div className="bg-white p-6 rounded-lg border">
//         Total Revenue: AED{totalRevenue}
//       </div>
//     </div>
//   );

//   return (
//     <AccessWrapper>
//       <div className="min-h-screen bg-gray-50 p-6">
//         <h1 className="text-3xl font-bold mb-4">E-Commerce Dashboard</h1>
        
//         {(activeSection === "products" || activeSection === "inventory") && (
//           <div className="mb-6">
//             <ProductSearchBar 
//               products={products}
//               onFilteredProducts={setFilteredProducts}
//             />
//           </div>
//         )}
        
//         <div className="flex gap-2 mb-6">
//           {navigationItems.map((item) => (
//             <button
//               key={item.id}
//               onClick={() => setActiveSection(item.id)}
//               className={`px-4 py-2 rounded ${
//                 activeSection === item.id
//                   ? "bg-gray-900 text-white"
//                   : "bg-white text-gray-900 border"
//               }`}
//             >
//               <item.icon className="inline-block w-4 h-4 mr-1" /> {item.label}
//             </button>
//           ))}
//         </div>
//         <AnimatePresence mode="wait">
//           <motion.div
//             key={activeSection}
//             initial={{ opacity: 0 }}
//             animate={{ opacity: 1 }}
//             exit={{ opacity: 0 }}
//           >
//             {activeSection === "products" && renderProducts()}
//             {activeSection === "inventory" && renderInventory()}
//             {activeSection === "sales" && renderSales()}
//           </motion.div>
//         </AnimatePresence>

//         <AnimatePresence>
//           {isModalOpen && (
//             <motion.div
//               className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50"
//               initial={{ opacity: 0 }}
//               animate={{ opacity: 1 }}
//               exit={{ opacity: 0 }}
//             >
//               <motion.div
//                 className="bg-white p-6 rounded-lg w-96"
//                 initial={{ scale: 0.9 }}
//                 animate={{ scale: 1 }}
//                 exit={{ scale: 0.9 }}
//               >
//                 <h2 className="text-lg font-bold mb-4">
//                   {editingId ? "Edit Product" : "Add Product"}
//                 </h2>
//                 <form onSubmit={handleSave} className="space-y-3">
//                   <input
//                     type="text"
//                     placeholder="Name"
//                     value={form.name}
//                     onChange={(e) =>
//                       setForm({ ...form, name: e.target.value })
//                     }
//                     className="w-full border p-2"
//                   />
//                   <input
//                     type="text"
//                     placeholder="Category"
//                     value={form.category}
//                     onChange={(e) =>
//                       setForm({ ...form, category: e.target.value })
//                     }
//                     className="w-full border p-2"
//                   />
//                   <input
//                     type="number"
//                     placeholder="Price"
//                     value={form.price}
//                     onChange={(e) =>
//                       setForm({ ...form, price: e.target.value })
//                     }
//                     className="w-full border p-2"
//                   />
//                   <input
//                     type="number"
//                     placeholder="Stock"
//                     value={form.stock}
//                     onChange={(e) =>
//                       setForm({ ...form, stock: e.target.value })
//                     }
//                     className="w-full border p-2"
//                   />

//                   {/* ✅ Description Field */}
//                   <textarea
//                     placeholder="Description"
//                     value={form.description}
//                     onChange={(e) =>
//                       setForm({ ...form, description: e.target.value })
//                     }
//                     className="w-full border p-2"
//                     rows={3}
//                   />

//                   <select
//                     value={form.status}
//                     onChange={(e) =>
//                       setForm({ ...form, status: e.target.value })
//                     }
//                     className="w-full border p-2"
//                   >
//                     <option value="active">Active</option>
//                     <option value="inactive">Inactive</option>
//                   </select>

//                   <input
//                     type="file"
//                     accept="image/*"
//                     onChange={(e) => {
//                       const file = e.target.files?.[0];
//                       if (file) {
//                         setForm({ ...form, imageFile: file });
//                       }
//                     }}
//                     className="w-full border p-2"
//                   />

//                   <div className="flex justify-end gap-2">
//                     <button
//                       type="button"
//                       onClick={closeModal}
//                       className="px-3 py-1 bg-gray-300 rounded"
//                     >
//                       <X />
//                     </button>
//                     <button
//                       type="submit"
//                       disabled={saving}
//                       className="px-3 py-1 bg-blue-600 text-white rounded"
//                     >
//                       <Save />
//                     </button>
//                   </div>
//                 </form>
//               </motion.div>
//             </motion.div>
//           )}
//         </AnimatePresence>
//       </div>
//     </AccessWrapper>
//   );
// }







// new
// OrdersPage.tsx
// 'use client';

// import { useEffect, useState } from 'react';
// import { 
//   collection, 
//   query, 
//   orderBy, 
//   onSnapshot, 
//   doc, 
//   updateDoc, 
//   getDocs, 
//   where,
//   Timestamp
// } from 'firebase/firestore';
// import { db } from '@/lib/firebase';
// import AccessWrapper from '@/components/AccessWrapper';
// import Image from 'next/image';

// type OrderProduct = {
//   id?: string;
//   name?: string;
//   category?: string;
//   image?: string;
//   price?: number;
//   quantity?: number;
//   subtotal?: number;
//   status?: string; // if individual product has its own status
//   [k: string]: any;
// };

// type ProductOrder = {
//   id?: string;
//   customerName?: string;
//   customerEmail?: string;
//   deliveryAddress?: string;
//   orderType?: string;
//   paymentMethod?: string;
//   products?: OrderProduct[];
//   status?: string;
//   createdAt?: any;
//   totalAmount?: number;
//   [k: string]: any;
// };

// export default function OrdersPage() {
//   const [orders, setOrders] = useState<ProductOrder[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [updatingIds, setUpdatingIds] = useState<Record<string, boolean>>({});

//   useEffect(() => {
//     if (!db) return;
//     const col = collection(db, 'productOrders');
//     const q = query(col, orderBy('createdAt', 'desc'));
//     const unsubscribe = onSnapshot(q, (snap) => {
//       const arr: ProductOrder[] = snap.docs.map(d => ({ id: d.id, ...d.data() }) as ProductOrder);
//       setOrders(arr);
//       setLoading(false);
//     }, err => {
//       console.error('Orders snapshot error', err);
//       setLoading(false);
//     });

//     return () => unsubscribe();
//   }, []);

//   const updateOrderStatus = async (orderId: string | undefined, newStatus: string) => {
//     if (!orderId) return;
//     setUpdatingIds(prev => ({ ...prev, [orderId]: true }));
//     try {
//       const orderRef = doc(db, 'productOrders', orderId);
//       await updateDoc(orderRef, { status: newStatus, updatedAt: Timestamp.now() });
//     } catch (err) {
//       console.error('Failed to update order status', err);
//       alert('Could not update status. Check console.');
//     } finally {
//       setUpdatingIds(prev => ({ ...prev, [orderId]: false }));
//     }
//   };

//   // Optional: If you want to change individual product status inside an order (if products have status)
//   const updateProductStatusInsideOrder = async (order: ProductOrder, productIndex: number, newStatus: string) => {
//     if (!order.id) return;
//     setUpdatingIds(prev => ({ ...prev, [order.id!]: true }));
//     try {
//       const products = Array.isArray(order.products) ? [...order.products] : [];
//       if (!products[productIndex]) throw new Error('Product not found');
//       products[productIndex] = { ...products[productIndex], status: newStatus };
//       const orderRef = doc(db, 'productOrders', order.id);
//       await updateDoc(orderRef, { products, updatedAt: Timestamp.now() });
//     } catch (err) {
//       console.error('Failed to update product status in order', err);
//       alert('Could not update product status.');
//     } finally {
//       setUpdatingIds(prev => ({ ...prev, [order.id!]: false }));
//     }
//   };

//   const formatDate = (ts: any) => {
//     try {
//       if (!ts) return '—';
//       if (ts.toDate) return ts.toDate().toLocaleString();
//       if (ts.seconds) return new Date(ts.seconds * 1000).toLocaleString();
//       return new Date(ts).toLocaleString();
//     } catch {
//       return '—';
//     }
//   };

//   if (loading) {
//     return (
//       <AccessWrapper>
//         <div className="p-6 text-center">
//           <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600 mx-auto mb-3"></div>
//           <p className="text-sm text-gray-600">Loading orders...</p>
//         </div>
//       </AccessWrapper>
//     );
//   }

//   return (
//     <AccessWrapper>
      // <div className="p-4 max-w-6xl mx-auto">
      //   <h1 className="text-xl font-semibold mb-4 text-pink-600">Product Orders</h1>

      //   {orders.length === 0 && (
      //     <div className="text-center py-10 text-gray-500">No product orders found.</div>
      //   )}

      //   <div className="space-y-4">
      //     {orders.map(order => (
      //       <div key={order.id} className="bg-white rounded-xl shadow-md border p-4">
      //         {/* Header */}
      //         <div className="flex items-start justify-between gap-4">
      //           <div>
      //             <h2 className="text-sm font-semibold">{order.customerName || 'Customer'}</h2>
      //             <p className="text-xs text-gray-500">{order.customerEmail}</p>
      //             <p className="text-xs text-gray-500 mt-1">Order type: <span className="font-medium">{order.orderType}</span></p>
      //             <p className="text-xs text-gray-500">Payment: <span className="font-medium">{order.paymentMethod}</span></p>
      //           </div>

      //           <div className="text-right">
      //             <p className="text-xs text-gray-500">Placed</p>
      //             <p className="text-sm font-medium">{formatDate(order.createdAt)}</p>
      //             <p className="text-xs mt-1">Status: <span className={`px-2 py-0.5 rounded-full text-[12px] ${order.status === 'cancelled' ? 'bg-red-100 text-red-700' : order.status === 'delivered' ? 'bg-green-100 text-green-700' : 'bg-yellow-50 text-yellow-700'}`}>{order.status || 'order'}</span></p>
      //           </div>
      //         </div>

      //         {/* Products grid */}
      //         <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
      //           {(order.products || []).map((p, idx) => (
      //             <div key={p.id || idx} className="flex items-center gap-3 border rounded-lg p-2">
      //               <div className="w-16 h-16 bg-gray-100 rounded-md overflow-hidden relative flex-shrink-0">
      //                 {p.image ? (
      //                   // Next/Image requires domain config; fallback to img if not configured
      //                   <Image src={p.image} alt={p.name} fill className="object-cover" />
      //                 ) : (
      //                   <div className="w-full h-full flex items-center justify-center text-xs text-gray-500">No image</div>
      //                 )}
      //               </div>
      //               <div className="flex-1">
      //                 <div className="flex items-center justify-between">
      //                   <h3 className="text-sm font-medium">{p.name}</h3>
      //                   <span className="text-xs text-gray-500">{(p.price ?? 0).toFixed ? (p.price ?? 0).toFixed(2) : p.price} AED</span>
      //                 </div>
      //                 <p className="text-xs text-gray-500">Qty: {p.quantity ?? 1}</p>
      //                 <p className="text-xs text-gray-400 mt-1">Category: {p.category || '—'}</p>

      //                 {/* If you want per-product status buttons (optional) */}
      //                 {/* <div className="mt-2 flex gap-2">
      //                   <button onClick={() => updateProductStatusInsideOrder(order, idx, 'delivered')} className="text-xs px-2 py-1 rounded bg-green-50 text-green-700">Delivered</button>
      //                   <button onClick={() => updateProductStatusInsideOrder(order, idx, 'cancelled')} className="text-xs px-2 py-1 rounded bg-red-50 text-red-700">Cancel</button>
      //                 </div> */}
      //               </div>
      //             </div>
      //           ))}
      //         </div>

      //         {/* Footer: totals + actions */}
      //         <div className="mt-3 flex items-center justify-between">
      //           <div className="text-sm">
      //             <p className="text-xs text-gray-500">Delivery address</p>
      //             <p className="text-sm">{order.deliveryAddress || '—'}</p>
      //           </div>

      //           <div className="text-right">
      //             <p className="text-xs text-gray-500">Total</p>
      //             <p className="text-lg font-semibold">{(order.totalAmount ?? 0).toString().startsWith('-') ? ((order.totalAmount ?? 0) * -1).toFixed(2) : (order.totalAmount ?? 0).toFixed(2)} AED</p>
      //             <div className="mt-2 flex gap-2 justify-end">
      //               <button
      //                 disabled={updatingIds[order.id || '']}
      //                 onClick={() => updateOrderStatus(order.id, 'cancelled')}
      //                 className="px-3 py-1 text-xs rounded bg-red-50 text-red-700 border border-red-100 disabled:opacity-50"
      //               >
      //                 Cancel
      //               </button>

      //               <button
      //                 disabled={updatingIds[order.id || '']}
      //                 onClick={() => updateOrderStatus(order.id, 'delivered')}
      //                 className="px-3 py-1 text-xs rounded bg-green-50 text-green-700 border border-green-100 disabled:opacity-50"
      //               >
      //                 Deliver
      //               </button>

      //               <button
      //                 disabled={updatingIds[order.id || '']}
      //                 onClick={() => updateOrderStatus(order.id, 'past')}
      //                 className="px-3 py-1 text-xs rounded bg-gray-50 text-gray-700 border border-gray-100 disabled:opacity-50"
      //               >
      //                 Past
      //               </button>

      //               <button
      //                 disabled={updatingIds[order.id || '']}
      //                 onClick={() => updateOrderStatus(order.id, 'upcoming')}
      //                 className="px-3 py-1 text-xs rounded bg-indigo-50 text-indigo-700 border border-indigo-100 disabled:opacity-50"
      //               >
      //                 Upcoming
      //               </button>
      //             </div>
      //           </div>
      //         </div>
      //       </div>
      //     ))}
      //   </div>
      // </div>
//     </AccessWrapper>
//   );
// }








// merge code
'use client';

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Package,
  Warehouse,
  TrendingUp,
  Plus,
  Edit,
  Trash2,
  X,
  Save
} from "lucide-react";
import ProductSearchBar from '@/components/ProductSearchBar';
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
  Timestamp
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "@/lib/firebase";
import AccessWrapper from "@/components/AccessWrapper";
import Image from "next/image";

type OrderProduct = {
  id?: string;
  name?: string;
  category?: string;
  image?: string;
  price?: number;
  quantity?: number;
  subtotal?: number;
  status?: string; // if individual product has its own status
  [k: string]: any;
};

type ProductOrder = {
  id?: string;
  customerName?: string;
  customerEmail?: string;
  deliveryAddress?: string;
  orderType?: string;
  paymentMethod?: string;
  products?: OrderProduct[];
  status?: string;
  createdAt?: any;
  totalAmount?: number;
  [k: string]: any;
};

type Product = {
  id?: string;
  name?: string;
  category?: string;
  price?: number;
  stock?: number;
  status?: string;
  image?: string;
  description?: string;
  sold?: number;
  [k: string]: any;
};

export default function EcommercePage() {
  const [activeSection, setActiveSection] = useState("products");
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<any>({
    name: "",
    category: "",
    price: "",
    stock: "",
    status: "active",
    image: "",
    imageFile: null,
    description: "",
  });
  const [saving, setSaving] = useState(false);

  // product description expand tracking
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  // Orders
  const [orders, setOrders] = useState<ProductOrder[]>([]);
  const [updatingIds, setUpdatingIds] = useState<Record<string, boolean>>({});

  // Navigation items (now includes Orders)
  const navigationItems = [
    { id: "products", label: "Products", icon: Package, color: "bg-blue-500" },
    { id: "inventory", label: "Inventory", icon: Warehouse, color: "bg-green-500" },
    { id: "sales", label: "Sales", icon: TrendingUp, color: "bg-purple-500" },
    { id: "orders", label: "Orders", icon: Plus, color: "bg-indigo-500" } // icon can be changed
  ];

  // ------------------- FETCH PRODUCTS -------------------
  useEffect(() => {
    if (!db) return;
    setLoading(true);
    const productsRef = collection(db, "products");
    const q = query(productsRef, orderBy("createdAt", "asc"));
    const unsub = onSnapshot(q, (snap) => {
      const productsData = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as Product[];
      setProducts(productsData);
      // initialize filteredProducts (so ProductSearchBar has data to operate on)
      setFilteredProducts(productsData);
      setLoading(false);
    }, (err) => {
      console.error('Products snapshot error', err);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // ------------------- FETCH ORDERS -------------------
  useEffect(() => {
    if (!db) return;
    const col = collection(db, 'productOrders');
    const q = query(col, orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snap) => {
      const arr: ProductOrder[] = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })) as ProductOrder[];
      setOrders(arr);
    }, (err) => {
      console.error('Orders snapshot error', err);
    });

    return () => unsubscribe();
  }, []);

  // ------------------- PRODUCT MODALS / CRUD -------------------
  const openAddModal = () => {
    setForm({
      name: "",
      category: "",
      price: "",
      stock: "",
      status: "active",
      image: "",
      imageFile: null,
      description: "",
    });
    setEditingId(null);
    setIsModalOpen(true);
  };

  const openEditModal = (item: Product) => {
    setForm({
      name: item.name || "",
      category: item.category || "",
      price: item.price?.toString() ?? "",
      stock: item.stock?.toString() ?? "",
      status: item.status || "active",
      image: item.image || "",
      imageFile: null,
      description: item.description || "",
    });
    setEditingId(item.id || null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setForm({
      name: "",
      category: "",
      price: "",
      stock: "",
      status: "active",
      image: "",
      imageFile: null,
      description: "",
    });
    setSaving(false);
  };

  const handleSave = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!form.name?.trim() || !form.category?.trim()) {
      alert("Please fill all required fields.");
      return;
    }
    if (!form.price || isNaN(Number(form.price))) {
      alert("Please enter valid price.");
      return;
    }
    if (!form.stock || isNaN(Number(form.stock))) {
      alert("Please enter valid stock.");
      return;
    }

    setSaving(true);
    try {
      let imageUrl = form.image || "";

      if (form.imageFile) {
        try {
          const fileRef = ref(storage, `products/${Date.now()}-${form.imageFile.name}`);
          await uploadBytes(fileRef, form.imageFile);
          imageUrl = await getDownloadURL(fileRef);
          console.log("✅ Image uploaded:", imageUrl);
        } catch (err) {
          console.error("❌ Image upload failed:", err);
          alert("Image upload failed. Check Firebase Storage rules.");
          setSaving(false);
          return;
        }
      }

      if (editingId) {
        await updateDoc(doc(db, "products", editingId), {
          name: form.name.trim(),
          category: form.category.trim(),
          price: Number(form.price),
          stock: Number(form.stock),
          status: form.status,
          image: imageUrl,
          description: form.description?.trim() || '',
          updatedAt: serverTimestamp(),
        });
      } else {
        await addDoc(collection(db, "products"), {
          name: form.name.trim(),
          category: form.category.trim(),
          price: Number(form.price),
          stock: Number(form.stock),
          status: form.status,
          image: imageUrl,
          description: form.description?.trim() || '',
          sold: 0,
          createdAt: serverTimestamp(),
        });
      }
      closeModal();
    } catch (err) {
      console.error("Error saving product:", err);
      alert("Error saving product.");
      setSaving(false);
    }
  };

  const handleDelete = async (id?: string) => {
    if (!id || !confirm("Are you sure you want to delete this product?")) return;
    try {
      await deleteDoc(doc(db, "products", id));
    } catch (err) {
      console.error(err);
      alert('Error deleting product.');
    }
  };

  // ------------------- ORDERS UPDATES -------------------
  const updateOrderStatus = async (orderId: string | undefined, newStatus: string) => {
    if (!orderId) return;
    setUpdatingIds(prev => ({ ...prev, [orderId]: true }));
    try {
      const orderRef = doc(db, 'productOrders', orderId);
      await updateDoc(orderRef, { status: newStatus, updatedAt: Timestamp.now() });
    } catch (err) {
      console.error('Failed to update order status', err);
      alert('Could not update status. Check console.');
    } finally {
      setUpdatingIds(prev => ({ ...prev, [orderId]: false }));
    }
  };

  const updateProductStatusInsideOrder = async (order: ProductOrder, productIndex: number, newStatus: string) => {
    if (!order.id) return;
    setUpdatingIds(prev => ({ ...prev, [order.id!]: true }));
    try {
      const productsArr = Array.isArray(order.products) ? [...order.products] : [];
      if (!productsArr[productIndex]) throw new Error('Product not found');
      productsArr[productIndex] = { ...productsArr[productIndex], status: newStatus };
      const orderRef = doc(db, 'productOrders', order.id);
      await updateDoc(orderRef, { products: productsArr, updatedAt: Timestamp.now() });
    } catch (err) {
      console.error('Failed to update product status in order', err);
      alert('Could not update product status.');
    } finally {
      setUpdatingIds(prev => ({ ...prev, [order.id!]: false }));
    }
  };

  const formatDate = (ts: any) => {
    try {
      if (!ts) return '—';
      if (ts.toDate) return ts.toDate().toLocaleString();
      if (ts.seconds) return new Date(ts.seconds * 1000).toLocaleString();
      return new Date(ts).toLocaleString();
    } catch {
      return '—';
    }
  };

  // ------------------- HELPERS -------------------
  const getStockStatus = (stock?: number) => {
    const s = stock ?? 0;
    if (s === 0) return { label: "Out of Stock", color: "text-red-600 bg-red-50" };
    if (s < 15) return { label: "Low Stock", color: "text-yellow-600 bg-yellow-50" };
    return { label: "In Stock", color: "text-green-600 bg-green-50" };
  };

  const totalRevenue = products.reduce((sum, p) => sum + ((p.sold || 0) * (p.price || 0)), 0);

  // ------------------- RENDER FUNCTIONS -------------------
  const renderProducts = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Products</h2>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg"
        >
          <Plus /> Add Product
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProducts.map((product) => {
          const stockStatus = getStockStatus(product.stock);
          const isExpanded = !!expanded[product.id || ''];
          const desc = product.description || "";

          return (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl border p-6"
            >
              <div className="flex justify-between mb-4">
                <div className="font-semibold text-lg">{product.name}</div>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${stockStatus.color}`}
                >
                  {stockStatus.label}
                </span>
              </div>

              {/* Description with truncate + toggle */}
              {desc && (
                <div className="text-gray-700 text-sm mb-2">
                  {isExpanded ? desc : desc.slice(0, 100)}
                  {desc.length > 100 && (
                    <button
                      onClick={() =>
                        setExpanded((prev) => ({
                          ...prev,
                          [product.id || '']: !isExpanded,
                        }))
                      }
                      className="text-blue-600 ml-1"
                    >
                      {isExpanded ? "Show Less" : "Read More"}
                    </button>
                  )}
                </div>
              )}

              <div>AED{product.price}</div>
              <div>{product.stock} in stock</div>
              {product.image && (
                <img
                  src={product.image}
                  alt={product.name}
                  className="mt-2 w-full h-32 object-cover rounded"
                />
              )}
              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => openEditModal(product)}
                  className="bg-yellow-500 px-3 py-1 rounded text-white flex items-center gap-1"
                >
                  <Edit /> Edit
                </button>
                <button
                  onClick={() => handleDelete(product.id)}
                  className="bg-red-600 px-3 py-1 rounded text-white flex items-center gap-1"
                >
                  <Trash2 /> Delete
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );

  const renderInventory = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Inventory</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {filteredProducts.map((p) => {
          const stockStatus = getStockStatus(p.stock);
          return (
            <div key={p.id} className="bg-white p-4 rounded-lg border">
              <div className="flex justify-between">
                <span>{p.name}</span>
                <span className={stockStatus.color}>{stockStatus.label}</span>
              </div>
              <div>{p.stock} in stock</div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderSales = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Sales</h2>
      <div className="bg-white p-6 rounded-lg border">
        Total Revenue: AED{totalRevenue}
      </div>
    </div>
  );

  const renderOrders = () => (
    <div className="p-4 max-w-6xl mx-auto">
      <h1 className="text-xl font-semibold mb-4 text-pink-600">Product Orders</h1>

      {orders.length === 0 && (
        <div className="text-center py-10 text-gray-500">No product orders found.</div>
      )}

      <div className="space-y-4">
        {orders.map(order => (
          <div key={order.id} className="bg-white rounded-xl shadow-md border p-4">
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-sm font-semibold">{order.customerName || 'Customer'}</h2>
                <p className="text-xs text-gray-500">{order.customerEmail}</p>
                <p className="text-xs text-gray-500 mt-1">Order type: <span className="font-medium">{order.orderType}</span></p>
                <p className="text-xs text-gray-500">Payment: <span className="font-medium">{order.paymentMethod}</span></p>
              </div>

              <div className="text-right">
                <p className="text-xs text-gray-500">Placed</p>
                <p className="text-sm font-medium">{formatDate(order.createdAt)}</p>
                <p className="text-xs mt-1">Status: <span className={`px-2 py-0.5 rounded-full text-[12px] ${order.status === 'cancelled' ? 'bg-red-100 text-red-700' : order.status === 'delivered' ? 'bg-green-100 text-green-700' : 'bg-yellow-50 text-yellow-700'}`}>{order.status || 'order'}</span></p>
              </div>
            </div>

            {/* Products grid */}
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(order.products || []).map((p, idx) => (
                <div key={p.id || idx} className="flex items-center gap-3 border rounded-lg p-2">
                  <div className="w-16 h-16 bg-gray-100 rounded-md overflow-hidden relative flex-shrink-0">
                    {p.image ? (
                      <Image src={p.image} alt={p.name} fill className="object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs text-gray-500">No image</div>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium">{p.name}</h3>
                      <span className="text-xs text-gray-500">{(p.price ?? 0).toFixed ? (p.price ?? 0).toFixed(2) : p.price} AED</span>
                    </div>
                    <p className="text-xs text-gray-500">Qty: {p.quantity ?? 1}</p>
                    <p className="text-xs text-gray-400 mt-1">Category: {p.category || '—'}</p>
                    {/* Optional per-product buttons commented out in original */}
                  </div>
                </div>
              ))}
            </div>

            {/* Footer: totals + actions */}
            <div className="mt-3 flex items-center justify-between">
              <div className="text-sm">
                <p className="text-xs text-gray-500">Delivery address</p>
                <p className="text-sm">{order.deliveryAddress || '—'}</p>
              </div>

              <div className="text-right">
                <p className="text-xs text-gray-500">Total</p>
                <p className="text-lg font-semibold">{(order.totalAmount ?? 0).toString().startsWith('-') ? ((order.totalAmount ?? 0) * -1).toFixed(2) : (order.totalAmount ?? 0).toFixed(2)} AED</p>
                <div className="mt-2 flex gap-2 justify-end">
                  <button
                    disabled={updatingIds[order.id || '']}
                    onClick={() => updateOrderStatus(order.id, 'cancelled')}
                    className="px-3 py-1 text-xs rounded bg-red-50 text-red-700 border border-red-100 disabled:opacity-50"
                  >
                    Cancel
                  </button>

                  <button
                    disabled={updatingIds[order.id || '']}
                    onClick={() => updateOrderStatus(order.id, 'delivered')}
                    className="px-3 py-1 text-xs rounded bg-green-50 text-green-700 border border-green-100 disabled:opacity-50"
                  >
                    Deliver
                  </button>

                  <button
                    disabled={updatingIds[order.id || '']}
                    onClick={() => updateOrderStatus(order.id, 'past')}
                    className="px-3 py-1 text-xs rounded bg-gray-50 text-gray-700 border border-gray-100 disabled:opacity-50"
                  >
                    Past
                  </button>

                  <button
                    disabled={updatingIds[order.id || '']}
                    onClick={() => updateOrderStatus(order.id, 'upcoming')}
                    className="px-3 py-1 text-xs rounded bg-indigo-50 text-indigo-700 border border-indigo-100 disabled:opacity-50"
                  >
                    Upcoming
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // ------------------- MAIN RETURN -------------------
  return (
    <AccessWrapper>
      <div className="min-h-screen bg-gray-50 p-6">
        <h1 className="text-3xl font-bold mb-4">E-Commerce Dashboard</h1>

        {(activeSection === "products" || activeSection === "inventory") && (
          <div className="mb-6">
            <ProductSearchBar
              products={products}
              onFilteredProducts={setFilteredProducts}
            />
          </div>
        )}

        <div className="flex gap-2 mb-6">
          {navigationItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id)}
              className={`px-4 py-2 rounded ${activeSection === item.id ? "bg-gray-900 text-white" : "bg-white text-gray-900 border"}`}
            >
              <item.icon className="inline-block w-4 h-4 mr-1" /> {item.label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={activeSection} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {activeSection === "products" && renderProducts()}
            {activeSection === "inventory" && renderInventory()}
            {activeSection === "sales" && renderSales()}
            {activeSection === "orders" && renderOrders()}
          </motion.div>
        </AnimatePresence>

        {/* Modal */}
        <AnimatePresence>
          {isModalOpen && (
            <motion.div
              className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="bg-white p-6 rounded-lg w-96"
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.9 }}
              >
                <h2 className="text-lg font-bold mb-4">
                  {editingId ? "Edit Product" : "Add Product"}
                </h2>
                <form onSubmit={(e) => { handleSave(e); }} className="space-y-3">
                  <input
                    type="text"
                    placeholder="Name"
                    value={form.name || ''}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full border p-2"
                  />
                  <input
                    type="text"
                    placeholder="Category"
                    value={form.category || ''}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full border p-2"
                  />
                  <input
                    type="number"
                    placeholder="Price"
                    value={form.price || ''}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    className="w-full border p-2"
                  />
                  <input
                    type="number"
                    placeholder="Stock"
                    value={form.stock || ''}
                    onChange={(e) => setForm({ ...form, stock: e.target.value })}
                    className="w-full border p-2"
                  />

                  <textarea
                    placeholder="Description"
                    value={form.description || ''}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    className="w-full border p-2"
                    rows={3}
                  />

                  <select
                    value={form.status || 'active'}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                    className="w-full border p-2"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>

                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) setForm({ ...form, imageFile: file });
                    }}
                    className="w-full border p-2"
                  />

                  <div className="flex justify-end gap-2">
                    <button type="button" onClick={closeModal} className="px-3 py-1 bg-gray-300 rounded">
                      <X />
                    </button>
                    <button type="submit" disabled={saving} className="px-3 py-1 bg-blue-600 text-white rounded">
                      <Save />
                    </button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AccessWrapper>
  );
}
