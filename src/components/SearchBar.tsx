"use client";

import { useState, useEffect, useRef } from 'react';
import { Search, X, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

// Navigation items data structure (matching Sidebar.tsx and including Future Modules)
const searchableItems = [
  { label: "Dashboard", href: "/", keywords: ["dashboard", "home", "overview", "main"] },
  
  // Product Management
  { label: "Product Management", href: "/products", keywords: ["products", "product management", "inventory"] },
  { label: "Categories", href: "/catagories", keywords: ["categories", "category", "product categories", "classification"] },
  { label: "Services", href: "/services", keywords: ["services", "salon services", "treatments", "beauty services"] },
  { label: "Offers & Promotions", href: "/offers", keywords: ["offers", "promotions", "deals", "discounts", "special offers"] },
  
  // Core Management
  { label: "Appointment Management", href: "/bookings", keywords: ["appointments", "bookings", "schedule", "calendar", "reservations"] },
  { label: "E-commerce", href: "/ecommerce", keywords: ["ecommerce", "shop", "online store", "products", "shopping"] },
  { label: "Invoice", href: "/invoice-generator", keywords: ["invoice", "generate"] },
  { label: "Sales Analytics", href: "/sales", keywords: ["sales", "analytics", "revenue", "reports", "performance"] },
  { label: "Customer Support", href: "/chat", keywords: ["chat", "support", "messages", "customer service", "help"] },
  { label: "Branch Management", href: "/branches", keywords: ["branches", "locations", "stores", "outlets"] },
  
  // Membership & Loyalty
  { label: "Membership Plans", href: "/membership", keywords: ["membership", "plans", "subscriptions", "loyalty"] },
  { label: "Membership & LoyaltyPoints Reports", href: "/membershipReport", keywords: ["membership reports", "member analytics", "loyalty reports", "points"] },
  
  // Staff Management
  { label: "Staff Management", href: "/staff", keywords: ["staff", "employees", "team", "workers", "personnel"] },
  { label: "Booking Approval Page", href: "/bookingstatus", keywords: ["booking approval", "approval", "booking status", "confirmation"] },
  { label: "Daily Tasks", href: "/staffDailyTasks", keywords: ["tasks", "daily tasks", "staff tasks", "assignments", "todo"] },
  { label: "Business Reports", href: "/reports", keywords: ["reports", "business reports", "analytics", "insights"] },
  
  // Customer & User Management
  { label: "Customer Management", href: "/customers", keywords: ["customers", "clients", "customer database", "client management"] },
  { label: "User Administration", href: "/users", keywords: ["users", "administration", "user management", "accounts"] },
  { label: "Profile Settings", href: "/profile", keywords: ["profile", "settings", "account", "preferences", "configuration"] },
  
  // Future Modules (from navbar)
  { label: "Payroll & Commission Management", href: "#future", keywords: ["payroll", "commission", "salary", "wages", "compensation", "staff payment"], isFuture: true },
  { label: "AI Product Performance Analytics", href: "#future", keywords: ["ai analytics", "product performance", "artificial intelligence", "smart analytics", "ai insights"], isFuture: true },
  { label: "AI Expense Tracking", href: "#future", keywords: ["ai expense", "expense tracking", "intelligent expenses", "smart tracking", "automated expenses"], isFuture: true },
  { label: "Audit Trail & Activity Logs", href: "#future", keywords: ["audit trail", "activity logs", "monitoring", "tracking", "security logs"], isFuture: true },
];

interface SearchBarProps {
  className?: string;
}

export default function SearchBar({ className }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [results, setResults] = useState<typeof searchableItems>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  
  const router = useRouter();
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filter results based on query
  useEffect(() => {
    if (query.trim() === '') {
      setResults([]);
      setSelectedIndex(-1);
      return;
    }

    const filtered = searchableItems.filter(item => {
      const searchTerm = query.toLowerCase();
      return (
        item.label.toLowerCase().includes(searchTerm) ||
        item.keywords.some(keyword => keyword.toLowerCase().includes(searchTerm))
      );
    });

    setResults(filtered);
    setSelectedIndex(-1);
  }, [query]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === 'ArrowDown') {
        setIsOpen(true);
      }
      return;
    }

    if (results.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < results.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : results.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && results[selectedIndex]) {
          const item = results[selectedIndex];
          handleNavigation(item.href, item.isFuture);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        inputRef.current?.blur();
        break;
    }
  };

  // Handle global keyboard events
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
        inputRef.current?.blur();
      }
    };

    document.addEventListener('keydown', handleGlobalKeyDown);
    return () => document.removeEventListener('keydown', handleGlobalKeyDown);
  }, [isOpen]);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNavigation = (href: string, isFuture?: boolean) => {
    if (isFuture) {
      // Show a "Coming Soon" message for future modules
      alert("This feature is coming soon! Stay tuned for updates.");
      setQuery('');
      setIsOpen(false);
      inputRef.current?.blur();
      return;
    }
    
    router.push(href);
    setQuery('');
    setIsOpen(false);
    inputRef.current?.blur();
  };

  const clearSearch = () => {
    setQuery('');
    setResults([]);
    setIsOpen(false);
    inputRef.current?.focus();
  };

  const highlightMatch = (text: string, query: string) => {
    if (!query) return text;
    
    const regex = new RegExp(`(${query})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <span key={index} className="bg-[#E60076]/20 text-[#E60076] font-medium">
          {part}
        </span>
      ) : part
    );
  };

  return (
    <div ref={searchRef} className={cn("relative", className)}>
      {/* Search Input */}
      <div className="relative w-full max-w-md mx-auto">
        <div
          className={cn(
            "relative flex items-center w-full",
            "bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm",
            "border border-gray-200 dark:border-gray-700",
            "rounded-xl shadow-sm hover:shadow-md transition-all duration-200",
            isOpen && "ring-2 ring-pink-500/20 border-pink-300 dark:border-pink-600",
            className
          )}
        >
          <Search className="absolute left-3 w-4 h-4 text-gray-400 dark:text-gray-500 pointer-events-none" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search pages..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setIsOpen(true)}
            onKeyDown={handleKeyDown}
            className={cn(
              "w-full pl-10 pr-10 py-2.5 sm:py-3",
              "text-sm sm:text-base text-gray-900 dark:text-gray-100",
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
              <X className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400 dark:text-gray-500" />
            </button>
          )}
        </div>
      </div>

      {/* Search Results Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full mt-2 w-full bg-white dark:bg-gray-900 border border-gray-200 
                       dark:border-gray-700 rounded-xl shadow-xl z-50 overflow-hidden max-h-80 overflow-y-auto"
          >
            {results.length > 0 ? (
              <div className="py-2">
                {results.map((item, index) => (
                  <div
                    key={item.href}
                    onClick={() => handleNavigation(item.href, item.isFuture)}
                    className={cn(
                      "px-3 sm:px-4 py-2.5 sm:py-3 cursor-pointer transition-all duration-200",
                      "hover:bg-pink-50 dark:hover:bg-pink-900/20",
                      "border-l-4 border-transparent hover:border-pink-500",
                      selectedIndex === index && "bg-pink-50 dark:bg-pink-900/20 border-pink-500",
                      item.isFuture && "opacity-75"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          <Search className="w-4 h-4 sm:w-5 sm:h-5 text-pink-600 dark:text-pink-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            <p className="text-sm sm:text-base font-medium text-gray-900 dark:text-gray-100 truncate">
                              {highlightMatch(item.label, query)}
                            </p>
                            {item.isFuture && (
                              <span className="px-2 py-0.5 text-xs font-medium bg-pink-100 dark:bg-pink-900/30 
                                                 text-pink-700 dark:text-pink-300 rounded-full">
                                Coming Soon
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                    </div>
                  </div>
                ))}
              </div>
            ) : query ? (
              <div className="px-4 py-6 text-center">
                <Search className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                <p className="text-sm text-gray-500 dark:text-gray-400">No results found</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  Try searching with different keywords
                </p>
              </div>
            ) : null}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}