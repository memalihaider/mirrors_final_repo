'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, Upload, Trash2, Eye, X, Users, UserCheck, UserPlus, Crown, Sparkles, Phone, Mail, Calendar } from 'lucide-react';
import { Customer, CustomerFilter, CustomerStats } from '../../types/customer';
import { getCustomers, searchCustomers, deleteCustomer, getCustomerStats } from '../../lib/customerService';
import AccessWrapper from '@/components/AccessWrapper';
import DataImport from '../../components/DataImport';
import { motion, AnimatePresence } from 'framer-motion';

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter] = useState<CustomerFilter>({ status: 'all' });
  const [showImport, setShowImport] = useState(false);
  const [usingCachedData, setUsingCachedData] = useState(false);
  const [stats, setStats] = useState<CustomerStats>({
    totalCustomers: 0,
    activeCustomers: 0,
    newCustomersThisMonth: 0,
    topSpenders: [],
    membershipDistribution: {
      bronze: 0,
      silver: 0,
      gold: 0,
      platinum: 0
    }
  });

  // Fetch customers
  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getCustomers(filter);
      if (result.success && result.data) {
        setCustomers(result.data.customers);
        setFilteredCustomers(result.data.customers);
        setUsingCachedData(result.fromCache || false);
      } else {
        console.error('Failed to fetch customers:', result.error);
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  // Fetch stats
  const fetchStats = useCallback(async () => {
    try {
      const result = await getCustomerStats();
      if (result.success && result.data) {
        setStats(result.data);
      } else {
        console.error('Failed to fetch stats:', result.error);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  }, []);

  // Search customers
  const handleSearch = async (term: string) => {
    setSearchTerm(term);
    if (!term.trim()) {
      setFilteredCustomers(customers);
      return;
    }

    try {
      const result = await searchCustomers(term);
      if (result.success && result.data) {
        setFilteredCustomers(result.data);
      } else {
        const filtered = customers.filter(customer =>
          customer.name.toLowerCase().includes(term.toLowerCase()) ||
          customer.email.toLowerCase().includes(term.toLowerCase()) ||
          customer.phone.includes(term)
        );
        setFilteredCustomers(filtered);
      }
    } catch (error) {
      console.error('Error searching customers:', error);
      const filtered = customers.filter(customer =>
        customer.name.toLowerCase().includes(term.toLowerCase()) ||
        customer.email.toLowerCase().includes(term.toLowerCase()) ||
        customer.phone.includes(term)
      );
      setFilteredCustomers(filtered);
    }
  };

  // Delete customer
  const handleDeleteCustomer = async (id: string) => {
    if (!confirm('Are you sure you want to delete this customer?')) return;

    try {
      const result = await deleteCustomer(id);
      if (result.success) {
        fetchCustomers();
        fetchStats();
      } else {
        console.error('Failed to delete customer:', result.error);
      }
    } catch (error) {
      console.error('Error deleting customer:', error);
    }
  };

  useEffect(() => {
    fetchCustomers();
    fetchStats();
  }, [filter, fetchCustomers, fetchStats]);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5
      }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.4
      }
    }
  };

  return (
    <AccessWrapper>
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-rose-100 relative overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-pink-200/30 to-purple-200/30 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-rose-200/30 to-pink-200/30 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-purple-100/20 to-pink-100/20 rounded-full blur-3xl animate-pulse delay-500"></div>
        </div>

        <motion.div 
          className="relative z-10 p-4"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <div className="max-w-7xl mx-auto">
            {/* Enhanced Header */}
            <motion.div 
              className="mb-8 text-center"
              variants={itemVariants}
            >
              <div className="inline-flex items-center gap-3 mb-4">
                <div className="p-3 bg-gradient-to-br from-pink-500 to-purple-600 rounded-2xl shadow-lg">
                  <Users className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-5xl font-bold bg-gradient-to-r from-pink-600 via-purple-600 to-rose-600 bg-clip-text text-transparent">
                    Customer Management
                  </h1>
                  <div className="flex items-center gap-2 mt-2">
                    <Sparkles className="h-4 w-4 text-pink-500" />
                    <p className="text-gray-600 font-medium">Manage your beauty salon customers with elegance</p>
                    <Sparkles className="h-4 w-4 text-purple-500" />
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Enhanced Stats Cards */}
            <motion.div 
              className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
              variants={containerVariants}
            >
              <motion.div 
                className="group relative overflow-hidden"
                variants={cardVariants}
                whileHover={{ scale: 1.02, y: -5 }}
                transition={{ duration: 0.2 }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-pink-500/10 to-purple-500/10 backdrop-blur-sm"></div>
                <div className="relative bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6 hover:shadow-2xl transition-all duration-300">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-gray-600 mb-1">Total Customers</p>
                      <motion.p 
                        className="text-3xl font-bold text-gray-900"
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.5, duration: 0.5 }}
                      >
                        {stats.totalCustomers}
                      </motion.p>
                    </div>
                    <div className="relative">
                      <div className="h-14 w-14 bg-gradient-to-br from-pink-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                        <Users className="h-7 w-7 text-white" />
                      </div>
                      <div className="absolute -top-1 -right-1 h-4 w-4 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full animate-pulse"></div>
                    </div>
                  </div>
                </div>
              </motion.div>
              
              <motion.div 
                className="group relative overflow-hidden"
                variants={cardVariants}
                whileHover={{ scale: 1.02, y: -5 }}
                transition={{ duration: 0.2 }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-emerald-500/10 backdrop-blur-sm"></div>
                <div className="relative bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6 hover:shadow-2xl transition-all duration-300">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-gray-600 mb-1">Active Customers</p>
                      <motion.p 
                        className="text-3xl font-bold text-green-600"
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.6, duration: 0.5 }}
                      >
                        {stats.activeCustomers}
                      </motion.p>
                    </div>
                    <div className="relative">
                      <div className="h-14 w-14 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                        <UserCheck className="h-7 w-7 text-white" />
                      </div>
                      <div className="absolute -top-1 -right-1 h-4 w-4 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full animate-pulse"></div>
                    </div>
                  </div>
                </div>
              </motion.div>
              
              <motion.div 
                className="group relative overflow-hidden"
                variants={cardVariants}
                whileHover={{ scale: 1.02, y: -5 }}
                transition={{ duration: 0.2 }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 backdrop-blur-sm"></div>
                <div className="relative bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6 hover:shadow-2xl transition-all duration-300">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-gray-600 mb-1">New This Month</p>
                      <motion.p 
                        className="text-3xl font-bold text-blue-600"
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.7, duration: 0.5 }}
                      >
                        {stats.newCustomersThisMonth}
                      </motion.p>
                    </div>
                    <div className="relative">
                      <div className="h-14 w-14 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                        <UserPlus className="h-7 w-7 text-white" />
                      </div>
                      <div className="absolute -top-1 -right-1 h-4 w-4 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-full animate-pulse"></div>
                    </div>
                  </div>
                </div>
              </motion.div>
              
              <motion.div 
                className="group relative overflow-hidden"
                variants={cardVariants}
                whileHover={{ scale: 1.02, y: -5 }}
                transition={{ duration: 0.2 }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-pink-500/10 backdrop-blur-sm"></div>
                <div className="relative bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6 hover:shadow-2xl transition-all duration-300">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-gray-600 mb-1">Platinum Members</p>
                      <motion.p 
                        className="text-3xl font-bold text-purple-600"
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.8, duration: 0.5 }}
                      >
                        {stats.membershipDistribution.platinum}
                      </motion.p>
                    </div>
                    <div className="relative">
                      <div className="h-14 w-14 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                        <Crown className="h-7 w-7 text-white" />
                      </div>
                      <div className="absolute -top-1 -right-1 h-4 w-4 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full animate-pulse"></div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>

            {/* Cached Data Badge */}
            <AnimatePresence>
              {usingCachedData && (
                <motion.div 
                  className="mb-6"
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="flex items-center justify-between bg-gradient-to-r from-yellow-100 to-orange-100 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-xl shadow-sm">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 bg-yellow-500 rounded-full animate-pulse"></div>
                      <span className="text-sm font-medium">Showing cached data</span>
                    </div>
                    <button 
                      onClick={() => setUsingCachedData(false)} 
                      className="text-yellow-800 hover:text-yellow-900 transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Enhanced Actions Bar */}
            <motion.div 
              className="mb-8"
              variants={itemVariants}
            >
              <div className="relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-white/40 to-white/60 backdrop-blur-sm"></div>
                <div className="relative bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6">
                  <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                    <div className="flex-1 max-w-md">
                      <div className="relative group">
                        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5 group-focus-within:text-pink-500 transition-colors" />
                        <input
                          type="text"
                          placeholder="Search customers by name, email, or phone..."
                          value={searchTerm}
                          onChange={(e) => handleSearch(e.target.value)}
                          className="w-full pl-12 pr-4 py-3 bg-white/50 backdrop-blur-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all duration-300 placeholder-gray-400"
                        />
                      </div>
                    </div>
                    
                    <div className="flex gap-3">
                      <motion.button
                        onClick={() => setShowImport(true)}
                        className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-600 text-white rounded-xl hover:from-blue-600 hover:to-cyan-700 transition-all duration-300 shadow-lg hover:shadow-xl font-medium"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Upload className="h-4 w-4" />
                        Import Customers
                      </motion.button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Enhanced Customers Table */}
            <motion.div 
              className="relative overflow-hidden"
              variants={itemVariants}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/40 to-white/60 backdrop-blur-sm"></div>
              <div className="relative bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gradient-to-r from-gray-50/80 to-gray-100/80 backdrop-blur-sm">
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Customer</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Contact</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200/50">
                      <AnimatePresence>
                        {loading ? (
                          <motion.tr
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                          >
                            <td colSpan={3} className="px-6 py-12 text-center">
                              <div className="flex flex-col items-center gap-3">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500"></div>
                                <span className="text-gray-500 font-medium">Loading customers...</span>
                              </div>
                            </td>
                          </motion.tr>
                        ) : filteredCustomers.length === 0 ? (
                          <motion.tr
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                          >
                            <td colSpan={3} className="px-6 py-12 text-center">
                              <div className="flex flex-col items-center gap-3">
                                <div className="h-16 w-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center">
                                  <Users className="h-8 w-8 text-gray-400" />
                                </div>
                                <span className="text-gray-500 font-medium">No customers found</span>
                              </div>
                            </td>
                          </motion.tr>
                        ) : (
                          filteredCustomers.map((customer, index) => (
                            <motion.tr 
                              key={customer.id} 
                              className="hover:bg-white/50 transition-all duration-200 group"
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -20 }}
                              transition={{ delay: index * 0.05 }}
                            >
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-4">
                                  <div className="h-12 w-12 bg-gradient-to-br from-pink-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                                    <span className="text-white font-bold text-lg">
                                      {customer.name.charAt(0).toUpperCase()}
                                    </span>
                                  </div>
                                  <div>
                                    <div className="text-sm font-bold text-gray-900 group-hover:text-pink-600 transition-colors">
                                      {customer.name}
                                    </div>
                                    <div className="flex items-center gap-1 text-sm text-gray-500">
                                      <Mail className="h-3 w-3" />
                                      {customer.email}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-1 text-sm text-gray-900">
                                  <Phone className="h-3 w-3 text-gray-400" />
                                  {customer.phone}
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex gap-2">
                                  <motion.button
                                    onClick={() => customer.id && handleDeleteCustomer(customer.id)}
                                    className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all duration-200"
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </motion.button>
                                </div>
                              </td>
                            </motion.tr>
                          ))
                        )}
                      </AnimatePresence>
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Enhanced Import Modal */}
          <AnimatePresence>
            {showImport && (
              <motion.div
                className="fixed inset-0 z-50 flex items-center justify-center p-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowImport(false)}></div>
                <motion.div
                  className="relative bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20 max-w-2xl w-full max-h-[90vh] overflow-hidden"
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <DataImport
                    onImportComplete={() => {
                      setShowImport(false);
                      fetchCustomers();
                      fetchStats();
                    }}
                    onClose={() => setShowImport(false)}
                  />
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </AccessWrapper>
  );
}
