"use client";

import { useState, useEffect, useRef } from 'react';
import { Search, X, Filter, SortAsc, SortDesc } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  status: string;
  image?: string;
  sold?: number;
}

interface ProductSearchBarProps {
  products: Product[];
  onFilteredProducts: (filteredProducts: Product[]) => void;
  className?: string;
}

export default function ProductSearchBar({ 
  products, 
  onFilteredProducts, 
  className 
}: ProductSearchBarProps) {
  const [query, setQuery] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'stock' | 'category'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [priceRange, setPriceRange] = useState<{ min: string; max: string }>({ min: '', max: '' });
  const [stockFilter, setStockFilter] = useState<'all' | 'in-stock' | 'low-stock' | 'out-of-stock'>('all');
  
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Get unique categories from products
  const categories = Array.from(new Set(products.map(p => p.category))).filter(Boolean);

  // Filter and sort products
  useEffect(() => {
    let filtered = [...products];

    // Text search
    if (query.trim()) {
      const searchTerm = query.toLowerCase();
      filtered = filtered.filter(product => 
        product.name.toLowerCase().includes(searchTerm) ||
        product.category.toLowerCase().includes(searchTerm)
      );
    }

    // Category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(product => product.category === selectedCategory);
    }

    // Price range filter
    if (priceRange.min) {
      filtered = filtered.filter(product => product.price >= Number(priceRange.min));
    }
    if (priceRange.max) {
      filtered = filtered.filter(product => product.price <= Number(priceRange.max));
    }

    // Stock filter
    if (stockFilter !== 'all') {
      filtered = filtered.filter(product => {
        switch (stockFilter) {
          case 'in-stock':
            return product.stock >= 15;
          case 'low-stock':
            return product.stock > 0 && product.stock < 15;
          case 'out-of-stock':
            return product.stock === 0;
          default:
            return true;
        }
      });
    }

    // Sort products
    filtered.sort((a, b) => {
      let aValue: any = a[sortBy];
      let bValue: any = b[sortBy];

      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    onFilteredProducts(filtered);
  }, [query, selectedCategory, priceRange, stockFilter, sortBy, sortOrder, products, onFilteredProducts]);

  // Handle click outside to close filter
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsFilterOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const clearSearch = () => {
    setQuery('');
    inputRef.current?.focus();
  };

  const clearAllFilters = () => {
    setQuery('');
    setSelectedCategory('all');
    setPriceRange({ min: '', max: '' });
    setStockFilter('all');
    setSortBy('name');
    setSortOrder('asc');
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (selectedCategory !== 'all') count++;
    if (priceRange.min || priceRange.max) count++;
    if (stockFilter !== 'all') count++;
    return count;
  };

  return (
    <div ref={searchRef} className={cn("relative w-full", className)}>
      <div className="flex gap-3 items-center">
        {/* Search Input */}
        <div className="flex-1 relative">
          <div
            className={cn(
              "relative flex items-center w-full",
              "bg-white dark:bg-gray-800 backdrop-blur-sm",
              "border border-gray-200 dark:border-gray-700",
              "rounded-xl shadow-sm hover:shadow-md transition-all duration-200",
              "focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-300 dark:focus-within:border-blue-600"
            )}
          >
            <Search className="absolute left-3 w-4 h-4 text-gray-400 dark:text-gray-500 pointer-events-none" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Search products by name or category..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className={cn(
                "w-full pl-10 pr-10 py-3",
                "text-sm text-gray-900 dark:text-gray-100",
                "placeholder-gray-500 dark:placeholder-gray-400",
                "bg-transparent border-0 outline-none",
                "rounded-xl"
              )}
            />
            {query && (
              <button
                onClick={clearSearch}
                className="absolute right-3 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 
                           transition-colors duration-200"
              >
                <X className="w-4 h-4 text-gray-400 dark:text-gray-500" />
              </button>
            )}
          </div>
        </div>

        {/* Filter Button */}
        <button
          onClick={() => setIsFilterOpen(!isFilterOpen)}
          className={cn(
            "relative flex items-center gap-2 px-4 py-3 rounded-xl border transition-all duration-200",
            "bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700",
            "border-gray-200 dark:border-gray-700",
            isFilterOpen && "ring-2 ring-blue-500/20 border-blue-300 dark:border-blue-600"
          )}
        >
          <Filter className="w-4 h-4" />
          <span className="text-sm font-medium">Filters</span>
          {getActiveFiltersCount() > 0 && (
            <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {getActiveFiltersCount()}
            </span>
          )}
        </button>

        {/* Sort Button */}
        <div className="flex items-center gap-1">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-3 rounded-l-xl border border-r-0 border-gray-200 dark:border-gray-700 
                       bg-white dark:bg-gray-800 text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="name">Name</option>
            <option value="price">Price</option>
            <option value="stock">Stock</option>
            <option value="category">Category</option>
          </select>
          <button
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="px-3 py-3 rounded-r-xl border border-gray-200 dark:border-gray-700 
                       bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 
                       transition-colors duration-200"
          >
            {sortOrder === 'asc' ? (
              <SortAsc className="w-4 h-4" />
            ) : (
              <SortDesc className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Filter Panel */}
      <AnimatePresence>
        {isFilterOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full mt-2 w-full bg-white dark:bg-gray-900 border border-gray-200 
                       dark:border-gray-700 rounded-xl shadow-xl z-50 p-4"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Category Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Category
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg 
                             bg-white dark:bg-gray-800 text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="all">All Categories</option>
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>

              {/* Price Range Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Price Range (AED)
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="Min"
                    value={priceRange.min}
                    onChange={(e) => setPriceRange({ ...priceRange, min: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg 
                               bg-white dark:bg-gray-800 text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                  <input
                    type="number"
                    placeholder="Max"
                    value={priceRange.max}
                    onChange={(e) => setPriceRange({ ...priceRange, max: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg 
                               bg-white dark:bg-gray-800 text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              {/* Stock Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Stock Status
                </label>
                <select
                  value={stockFilter}
                  onChange={(e) => setStockFilter(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg 
                             bg-white dark:bg-gray-800 text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="all">All Stock Levels</option>
                  <option value="in-stock">In Stock (15+)</option>
                  <option value="low-stock">Low Stock (1-14)</option>
                  <option value="out-of-stock">Out of Stock (0)</option>
                </select>
              </div>
            </div>

            {/* Filter Actions */}
            <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {getActiveFiltersCount()} filter{getActiveFiltersCount() !== 1 ? 's' : ''} active
              </span>
              <div className="flex gap-2">
                <button
                  onClick={clearAllFilters}
                  className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 
                             dark:hover:text-gray-200 transition-colors duration-200"
                >
                  Clear All
                </button>
                <button
                  onClick={() => setIsFilterOpen(false)}
                  className="px-4 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 
                             transition-colors duration-200"
                >
                  Apply
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}