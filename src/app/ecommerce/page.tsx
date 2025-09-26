'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Package, 
  Warehouse, 
  TrendingUp, 
  Plus, 
  Search, 
  Filter,
  BarChart3,
  ShoppingCart,
  AlertTriangle,
  DollarSign,
  Eye,
  Edit,
  Trash2
} from 'lucide-react';

type Section = 'products' | 'inventory' | 'sales';

interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  status: 'active' | 'inactive';
  image?: string;
}

interface InventoryItem {
  id: string;
  productName: string;
  currentStock: number;
  minStock: number;
  maxStock: number;
  lastUpdated: string;
  status: 'in-stock' | 'low-stock' | 'out-of-stock';
}

interface SalesData {
  period: string;
  revenue: number;
  orders: number;
  avgOrderValue: number;
}

export default function EcommercePage() {
  const [activeSection, setActiveSection] = useState<Section>('products');
  const [searchTerm, setSearchTerm] = useState('');

  // Sample data
  const products: Product[] = [
    { id: '1', name: 'Premium Hair Treatment', category: 'Hair Care', price: 150, stock: 25, status: 'active' },
    { id: '2', name: 'Facial Cleansing Kit', category: 'Skincare', price: 89, stock: 12, status: 'active' },
    { id: '3', name: 'Nail Art Set', category: 'Nail Care', price: 45, stock: 0, status: 'inactive' },
    { id: '4', name: 'Massage Oil Bundle', category: 'Body Care', price: 75, stock: 18, status: 'active' },
  ];

  const inventory: InventoryItem[] = [
    { id: '1', productName: 'Premium Hair Treatment', currentStock: 25, minStock: 10, maxStock: 50, lastUpdated: '2024-01-15', status: 'in-stock' },
    { id: '2', productName: 'Facial Cleansing Kit', currentStock: 12, minStock: 15, maxStock: 40, lastUpdated: '2024-01-14', status: 'low-stock' },
    { id: '3', productName: 'Nail Art Set', currentStock: 0, minStock: 5, maxStock: 30, lastUpdated: '2024-01-13', status: 'out-of-stock' },
    { id: '4', productName: 'Massage Oil Bundle', currentStock: 18, minStock: 8, maxStock: 35, lastUpdated: '2024-01-15', status: 'in-stock' },
  ];

  const salesData: SalesData[] = [
    { period: 'This Week', revenue: 2450, orders: 18, avgOrderValue: 136 },
    { period: 'Last Week', revenue: 3200, orders: 24, avgOrderValue: 133 },
    { period: 'This Month', revenue: 12800, orders: 89, avgOrderValue: 144 },
    { period: 'Last Month', revenue: 15600, orders: 112, avgOrderValue: 139 },
  ];

  const navigationItems = [
    { id: 'products', label: 'Products', icon: Package, color: 'bg-blue-500' },
    { id: 'inventory', label: 'Inventory', icon: Warehouse, color: 'bg-green-500' },
    { id: 'sales', label: 'Sales', icon: TrendingUp, color: 'bg-purple-500' },
  ];

  const getStockStatus = (stock: number) => {
    if (stock === 0) return { label: 'Out of Stock', color: 'text-red-600 bg-red-50' };
    if (stock < 15) return { label: 'Low Stock', color: 'text-yellow-600 bg-yellow-50' };
    return { label: 'In Stock', color: 'text-green-600 bg-green-50' };
  };

  const getInventoryStatus = (status: string) => {
    switch (status) {
      case 'out-of-stock': return { label: 'Out of Stock', color: 'text-red-600 bg-red-50' };
      case 'low-stock': return { label: 'Low Stock', color: 'text-yellow-600 bg-yellow-50' };
      default: return { label: 'In Stock', color: 'text-green-600 bg-green-50' };
    }
  };

  const renderProducts = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Products Management</h2>
          <p className="text-gray-600 mt-1">Manage your product catalog and pricing</p>
        </div>
        <button className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
          <Plus className="w-4 h-4" />
          Add Product
        </button>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
          <Filter className="w-4 h-4" />
          Filter
        </button>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product) => {
          const stockStatus = getStockStatus(product.stock);
          return (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <Package className="w-6 h-6 text-white" />
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${stockStatus.color}`}>
                  {stockStatus.label}
                </span>
              </div>
              
              <h3 className="font-semibold text-gray-900 mb-1">{product.name}</h3>
              <p className="text-sm text-gray-600 mb-3">{product.category}</p>
              
              <div className="flex justify-between items-center mb-4">
                <span className="text-2xl font-bold text-gray-900">${product.price}</span>
                <span className="text-sm text-gray-600">{product.stock} in stock</span>
              </div>
              
              <div className="flex gap-2">
                <button className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors">
                  <Eye className="w-4 h-4" />
                  View
                </button>
                <button className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100 transition-colors">
                  <Edit className="w-4 h-4" />
                  Edit
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Inventory Tracking</h2>
          <p className="text-gray-600 mt-1">Monitor stock levels and manage inventory</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors">
            <Plus className="w-4 h-4" />
            Update Stock
          </button>
        </div>
      </div>

      {/* Inventory Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-green-50 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
              <Package className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm text-green-600 font-medium">In Stock</p>
              <p className="text-2xl font-bold text-green-700">
                {inventory.filter(item => item.status === 'in-stock').length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-yellow-50 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-500 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm text-yellow-600 font-medium">Low Stock</p>
              <p className="text-2xl font-bold text-yellow-700">
                {inventory.filter(item => item.status === 'low-stock').length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-red-50 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center">
              <Trash2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm text-red-600 font-medium">Out of Stock</p>
              <p className="text-2xl font-bold text-red-700">
                {inventory.filter(item => item.status === 'out-of-stock').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Current Stock</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Min/Max</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Updated</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {inventory.map((item) => {
                const status = getInventoryStatus(item.status);
                return (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{item.productName}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{item.currentStock}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-600">{item.minStock} / {item.maxStock}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${status.color}`}>
                        {status.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {item.lastUpdated}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button className="text-blue-600 hover:text-blue-900 mr-3">Update</button>
                      <button className="text-gray-600 hover:text-gray-900">View</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderSales = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Sales Reporting</h2>
          <p className="text-gray-600 mt-1">Track revenue and analyze sales performance</p>
        </div>
        <button className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors">
          <BarChart3 className="w-4 h-4" />
          Export Report
        </button>
      </div>

      {/* Sales Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {salesData.map((data, index) => (
          <motion.div
            key={data.period}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-xl border border-gray-200 p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-600">{data.period}</h3>
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-4 h-4 text-purple-600" />
              </div>
            </div>
            
            <div className="space-y-2">
              <div>
                <p className="text-2xl font-bold text-gray-900">${data.revenue.toLocaleString()}</p>
                <p className="text-xs text-gray-500">Revenue</p>
              </div>
              
              <div className="flex justify-between text-sm">
                <div>
                  <p className="font-medium text-gray-900">{data.orders}</p>
                  <p className="text-gray-500">Orders</p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-gray-900">${data.avgOrderValue}</p>
                  <p className="text-gray-500">Avg Order</p>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Sales Chart Placeholder */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Revenue Trend</h3>
          <div className="flex gap-2">
            <button className="px-3 py-1 text-sm bg-purple-100 text-purple-700 rounded-lg">7D</button>
            <button className="px-3 py-1 text-sm text-gray-600 rounded-lg hover:bg-gray-100">30D</button>
            <button className="px-3 py-1 text-sm text-gray-600 rounded-lg hover:bg-gray-100">90D</button>
          </div>
        </div>
        
        {/* Simple Chart Visualization */}
        <div className="h-64 flex items-end justify-between gap-2">
          {[65, 45, 78, 52, 89, 67, 94].map((height, index) => (
            <div key={index} className="flex-1 flex flex-col items-center">
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: `${height}%` }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                className="w-full bg-gradient-to-t from-purple-500 to-purple-300 rounded-t-lg min-h-[20px]"
              />
              <span className="text-xs text-gray-500 mt-2">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][index]}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Top Products */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Selling Products</h3>
        <div className="space-y-3">
          {products.slice(0, 3).map((product, index) => (
            <div key={product.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-sm font-medium">
                  {index + 1}
                </span>
                <div>
                  <p className="font-medium text-gray-900">{product.name}</p>
                  <p className="text-sm text-gray-600">{product.category}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-medium text-gray-900">${product.price}</p>
                <p className="text-sm text-gray-600">{Math.floor(Math.random() * 50) + 10} sold</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">E-commerce Management</h1>
          <p className="text-gray-600">Manage your products, inventory, and track sales performance</p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2 mb-8 bg-white p-2 rounded-xl border border-gray-200">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id as Section)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                  isActive
                    ? 'bg-gray-900 text-white shadow-lg'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="font-medium">{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeSection}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {activeSection === 'products' && renderProducts()}
            {activeSection === 'inventory' && renderInventory()}
            {activeSection === 'sales' && renderSales()}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}