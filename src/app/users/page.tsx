'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AccessWrapper from '@/components/AccessWrapper';
import { useAuth } from '@/contexts/AuthContext';
import {
  subscribeToUsersChanges,
  updateUserRole,
  deleteUser,
  updateUserAccessPages,
  updateUserProfile,
} from '@/lib/userService';
import { UserRole, createNewUser } from '@/lib/auth';
import {
  Users,
  Shield,
  User,
  Trash2,
  Crown,
  UserCheck,
  Plus,
  Eye,
  EyeOff,
  Save,
  Pencil,
} from 'lucide-react';

export default function UsersPage() {
  const { user, userRole, loading: authLoading } = useAuth();
  const [users, setUsers] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  const [formData, setFormData] = useState({
    uid: '',
    email: '',
    password: '',
    displayName: '',
    role: 'user' as 'admin' | 'user',
    accessPages: [] as string[],
  });

  // Mounted check
  useEffect(() => setMounted(true), []);

  // Subscribe to users changes
  useEffect(() => {
    const unsubscribe = subscribeToUsersChanges((updatedUsers) => {
      setUsers(updatedUsers);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleRoleUpdate = async (uid: string, newRole: 'admin' | 'user') => {
    const { error } = await updateUserRole(uid, newRole);
    if (error) alert('Error updating user role: ' + error);
  };

  const handleDeleteUser = async (uid: string, email: string) => {
    if (confirm(`Delete user ${email}? This action cannot be undone.`)) {
      const { error } = await deleteUser(uid);
      if (error) alert('Error deleting user: ' + error);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setError('');
    setMessage('');

    if (!formData.email || !formData.password) {
      setError('Email and password are required');
      setCreating(false);
      return;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      setCreating(false);
      return;
    }

    const accessPages =
      formData.role === 'admin'
        ? [
            'dashboard',
            'catagories',
            'services',
            'offers',
            'bookings',
            'chat',
            'branches',
            'staff',
            'customers',
            'users',
            'profile',
            'sales',
            'reports',
            'membership',
            'ecommerce',
            'membershipReport'
          ]
        : formData.accessPages;

    const { success, error } = await createNewUser(
      formData.email,
      formData.password,
      formData.displayName,
      formData.role,
      accessPages
    );

    if (success) {
      setMessage('User created successfully!');
      resetForm();
      setTimeout(() => {
        setShowModal(false);
        setMessage('');
      }, 2000);
    } else {
      setError(error || 'Failed to create user');
    }
    setCreating(false);
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setError('');
    setMessage('');

    try {
      const { error } = await updateUserProfile(formData.uid, {
        email: formData.email,
        displayName: formData.displayName,
        role: formData.role,
        accessPages: formData.accessPages,
      });

      if (error) throw new Error(error);

      setMessage('User updated successfully!');
      setTimeout(() => {
        setShowModal(false);
        setMessage('');
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to update user');
    } finally {
      setCreating(false);
    }
  };

  const resetForm = () => {
    setFormData({
      uid: '',
      email: '',
      password: '',
      displayName: '',
      role: 'user',
      accessPages: [],
    });
    setError('');
    setMessage('');
    setShowPassword(false);
    setIsEditing(false);
    setShowModal(false);
  };

  if (loading || !mounted || authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50">
        <div className="p-2 sm:p-3">
          <div className="max-w-6xl mx-auto flex items-center justify-center py-12">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="flex items-center space-x-3"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="rounded-full h-8 w-8 border-4 border-pink-200 border-t-pink-600"
              />
              <span className="text-pink-600 font-medium">Loading users...</span>
            </motion.div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <AccessWrapper>
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50">
        <div className="p-2 sm:p-3">
          <div className="max-w-6xl mx-auto">
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="mb-6 sm:mb-8 flex justify-between items-center"
            >
              <div>
                <motion.h1 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.1 }}
                  className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-pink-600 via-purple-600 to-blue-600 bg-clip-text text-transparent mb-2 flex items-center gap-3"
                >
                  <motion.div
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.5 }}
                    className="p-2 bg-gradient-to-br from-pink-500 to-purple-500 rounded-xl shadow-lg"
                  >
                    <Users className="w-6 h-6 text-white" />
                  </motion.div>
                  User Management
                </motion.h1>
                <motion.p 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  className="text-sm sm:text-base text-gray-600"
                >
                  Manage user accounts and permissions
                </motion.p>
              </div>
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="flex items-center space-x-3"
              >
                <motion.div 
                  whileHover={{ scale: 1.05 }}
                  className="bg-white/80 backdrop-blur-sm px-4 py-2 rounded-xl border border-pink-200/50 shadow-sm"
                >
                  <span className="text-sm font-semibold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
                    {users.length} {users.length === 1 ? 'User' : 'Users'}
                  </span>
                </motion.div>
                <motion.button
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    resetForm();
                    setIsEditing(false);
                    setShowModal(true);
                  }}
                  className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white px-4 py-2 rounded-xl text-sm font-medium transition-all shadow-lg hover:shadow-xl flex items-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span className="hidden sm:inline">Add User</span>
                </motion.button>
              </motion.div>
            </motion.div>

            <motion.div 
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, staggerChildren: 0.1 }}
            >
              <AnimatePresence>
                {users.map((user, index) => (
                  <motion.div
                    key={user.uid}
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: -20 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    whileHover={{ y: -5, scale: 1.02 }}
                    className="bg-white/90 backdrop-blur-xl border border-pink-200/30 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 group"
                  >
                    <div className="p-3 sm:p-4 border-b border-pink-100/50 flex justify-between items-center bg-gradient-to-r from-pink-50/50 to-purple-50/50 rounded-t-2xl">
                      <div className="flex items-center space-x-3">
                        <motion.div
                          whileHover={{ rotate: 360 }}
                          transition={{ duration: 0.5 }}
                          className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center shadow-lg ${
                            user.role === 'admin'
                              ? 'bg-gradient-to-br from-yellow-400 to-orange-500'
                              : 'bg-gradient-to-br from-blue-400 to-purple-500'
                          }`}
                        >
                          {user.role === 'admin' ? (
                            <Crown className="w-5 h-5 text-white" />
                          ) : (
                            <User className="w-5 h-5 text-white" />
                          )}
                        </motion.div>
                        <div>
                          <h3 className="text-sm font-semibold text-gray-900 truncate">
                            {user.displayName || user.email?.split('@')[0]}
                          </h3>
                          <p className="text-xs text-gray-500 truncate">
                            {user.email}
                          </p>
                        </div>
                      </div>
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium shadow-sm border ${
                          user.role === 'admin'
                            ? 'bg-gradient-to-r from-yellow-100 to-orange-100 text-yellow-700 border-yellow-200'
                            : 'bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700 border-blue-200'
                        }`}
                      >
                        {user.role === 'admin' ? 'Admin' : 'User'}
                      </motion.div>
                    </div>

                    <div className="p-3 sm:p-4 border-t border-pink-100/50 flex justify-between items-center bg-gradient-to-r from-gray-50/50 to-pink-50/50 rounded-b-2xl">
                      <div className="flex items-center space-x-1">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() =>
                            handleRoleUpdate(
                              user.uid,
                              user.role === 'admin' ? 'user' : 'admin'
                            )
                          }
                          className={`px-3 py-2 rounded-lg text-xs font-medium transition-all shadow-sm border ${
                            user.role === 'admin'
                              ? 'bg-gradient-to-r from-blue-500/10 to-purple-500/10 text-blue-600 border-blue-200 hover:from-blue-500/20 hover:to-purple-500/20'
                              : 'bg-gradient-to-r from-yellow-500/10 to-orange-500/10 text-yellow-600 border-yellow-200 hover:from-yellow-500/20 hover:to-orange-500/20'
                          }`}
                          title={user.role === 'admin' ? 'Make User' : 'Make Admin'}
                        >
                          {user.role === 'admin' ? (
                            <>
                              <UserCheck className="w-3 h-3 inline mr-1" />
                              Make User
                            </>
                          ) : (
                            <>
                              <Crown className="w-3 h-3 inline mr-1" />
                              Make Admin
                            </>
                          )}
                        </motion.button>
                      </div>

                      <div className="flex items-center space-x-2">
                        <motion.button
                          whileHover={{ scale: 1.1, rotate: 5 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => {
                            setFormData({
                              uid: user.uid,
                              email: user.email,
                              password: '',
                              displayName: user.displayName || '',
                              role: user.role,
                              accessPages: user.accessPages || [],
                            });
                            setIsEditing(true);
                            setShowModal(true);
                          }}
                          className="p-2 rounded-lg text-blue-600 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-all shadow-sm border border-blue-200/50 hover:border-blue-300"
                          title="Edit User"
                        >
                          <Pencil className="w-3 h-3" />
                        </motion.button>

                        <motion.button
                          whileHover={{ scale: 1.1, rotate: -5 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleDeleteUser(user.uid, user.email)}
                          className="p-2 rounded-lg text-red-600 hover:bg-gradient-to-r hover:from-red-50 hover:to-pink-50 transition-all shadow-sm border border-red-200/50 hover:border-red-300"
                          title="Delete User"
                        >
                          <Trash2 className="w-3 h-3" />
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>

            <AnimatePresence>
              {showModal && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 z-50"
                  onClick={(e) => e.target === e.currentTarget && resetForm()}
                >
                  <motion.div 
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    transition={{ type: "spring", damping: 25, stiffness: 300 }}
                    className="bg-white/95 backdrop-blur-xl border border-pink-200/30 rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto"
                  >
                    <div className="p-4">
                      <motion.h3 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="text-lg font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent mb-4 flex items-center gap-2"
                      >
                        {isEditing ? (
                          <><Pencil className="w-4 h-4 text-pink-600" /> Edit User</>
                        ) : (
                          <><Plus className="w-4 h-4 text-pink-600" /> Add New User</>
                        )}
                      </motion.h3>

                      <AnimatePresence>
                        {error && (
                          <motion.div 
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="mb-4 p-3 bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-xl text-red-600 text-sm shadow-sm"
                          >
                            {error}
                          </motion.div>
                        )}
                        {message && (
                          <motion.div 
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="mb-4 p-3 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl text-green-600 text-sm shadow-sm"
                          >
                            {message}
                          </motion.div>
                        )}
                      </AnimatePresence>

                      <form
                        onSubmit={isEditing ? handleUpdateUser : handleCreateUser}
                        className="space-y-4"
                      >
                        <motion.div
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.1 }}
                        >
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Email Address {isEditing ? '' : '*'}
                          </label>
                          <input
                            type="email"
                            value={formData.email}
                            onChange={(e) =>
                              setFormData({ ...formData, email: e.target.value })
                            }
                            className="w-full px-4 py-3 border border-pink-200/50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-pink-400 bg-white/80 backdrop-blur-sm transition-all"
                            placeholder="user@example.com"
                            required={!isEditing}
                            disabled={creating || isEditing}
                          />
                        </motion.div>

                        {!isEditing && (
                          <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2 }}
                          >
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Password *
                            </label>
                            <div className="relative">
                              <input
                                type={showPassword ? 'text' : 'password'}
                                value={formData.password}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    password: e.target.value,
                                  })
                                }
                                className="w-full px-4 py-3 pr-12 border border-pink-200/50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-pink-400 bg-white/80 backdrop-blur-sm transition-all"
                                placeholder="Minimum 6 characters"
                                required
                                disabled={creating}
                              />
                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100"
                              >
                                {showPassword ? (
                                  <EyeOff className="w-4 h-4" />
                                ) : (
                                  <Eye className="w-4 h-4" />
                                )}
                              </motion.button>
                            </div>
                          </motion.div>
                        )}

                        <motion.div
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.3 }}
                        >
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Display Name
                          </label>
                          <input
                            type="text"
                            value={formData.displayName}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                displayName: e.target.value,
                              })
                            }
                            className="w-full px-4 py-3 border border-pink-200/50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-pink-400 bg-white/80 backdrop-blur-sm transition-all"
                            placeholder="Full name (optional)"
                            disabled={creating}
                          />
                        </motion.div>

                        <motion.div
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.4 }}
                        >
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Role
                          </label>
                          <select
                            value={formData.role}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                role: e.target.value as 'admin' | 'user',
                              })
                            }
                            className="w-full px-4 py-3 border border-pink-200/50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-pink-400 bg-white/80 backdrop-blur-sm cursor-pointer transition-all"
                            disabled={creating}
                          >
                            <option value="user">User</option>
                            <option value="admin">Admin</option>
                          </select>
                        </motion.div>

                        <motion.div
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.5 }}
                        >
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            User Access for Pages
                          </label>
                          <select
                            multiple
                            value={formData.accessPages}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                accessPages: Array.from(
                                  e.target.selectedOptions,
                                  (option) => option.value
                                ),
                              })
                            }
                            className="w-full px-4 py-3 border border-pink-200/50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-pink-400 bg-white/80 backdrop-blur-sm cursor-pointer transition-all min-h-[120px]"
                            disabled={creating}
                          >
                            <option value="dashboard">Dashboard</option>
                            <option value="catagories">Catagories</option>
                            <option value="services">Services</option>
                            <option value="offers">Offers</option>
                            <option value="bookings">Bookings</option>
                            <option value="chat">Chat</option>
                            <option value="branches">Branches</option>
                            <option value="staff">Staff</option>
                            <option value="customers">Customers</option>
                            <option value="users">Users</option>
                            <option value="sales">sales</option>
                            <option value="reports">reports</option>
                            <option value="profile">Profile</option>
                            <option value="membership">Membership</option>
                            <option value="membershipReport">Membership Report</option>
                            <option value="ecommerce">Ecommerce Page</option>
                          </select>
                        </motion.div>

                        <motion.div 
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.3 }}
                          className="flex justify-end space-x-3 pt-4 border-t border-gradient-to-r from-pink-100 to-purple-100"
                        >
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            type="button"
                            onClick={resetForm}
                            disabled={creating}
                            className="px-4 py-2 text-pink-600 bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl text-sm font-medium hover:from-pink-100 hover:to-purple-100 transition-all shadow-sm border border-pink-200/50"
                          >
                            Cancel
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            type="submit"
                            disabled={creating}
                            className="px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white rounded-xl text-sm font-medium transition-all flex items-center space-x-2 shadow-lg hover:shadow-xl disabled:opacity-50"
                          >
                            {creating && (
                              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white"></div>
                            )}
                            <Save className="w-4 h-4" />
                            <span>
                              {creating
                                ? isEditing
                                  ? 'Updating...'
                                  : 'Creating...'
                                : isEditing
                                ? 'Update User'
                                : 'Create User'}
                            </span>
                          </motion.button>
                        </motion.div>
                      </form>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </AccessWrapper>
  );
}



