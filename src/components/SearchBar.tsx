"use client";

import { useState, useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

// Navigation items data structure (matching Sidebar.tsx)
const searchableItems = [
  { label: "Dashboard", href: "/", keywords: ["dashboard", "home", "overview"] },
  { label: "Categories", href: "/catagories", keywords: ["categories", "category", "product categories"] },
  { label: "Services", href: "/services", keywords: ["services", "salon services", "treatments"] },
  { label: "Offers & Promotions", href: "/offers", keywords: ["offers", "promotions", "deals", "discounts"] },
  { label: "Appointment Management", href: "/bookings", keywords: ["appointments", "bookings", "schedule", "calendar"] },
  { label: "E-commerce", href: "/ecommerce", keywords: ["ecommerce", "shop", "online store", "products"] },
  { label: "Sales Analytics", href: "/sales", keywords: ["sales", "analytics", "revenue", "reports"] },
  { label: "Customer Support", href: "/chat", keywords: ["chat", "support", "messages", "customer service"] },
  { label: "Branch Management", href: "/branches", keywords: ["branches", "locations", "stores"] },
  { label: "Membership Plans", href: "/membership", keywords: ["membership", "plans", "subscriptions"] },
  { label: "Membership Reports", href: "/membershipReport", keywords: ["membership reports", "member analytics"] },
  { label: "Staff Management", href: "/staff", keywords: ["staff", "employees", "team", "workers"] },
  { label: "Daily Tasks", href: "/staffDailyTasks", keywords: ["tasks", "daily tasks", "staff tasks", "assignments"] },
  { label: "Business Reports", href: "/reports", keywords: ["reports", "business reports", "analytics"] },
  { label: "Customer Management", href: "/customers", keywords: ["customers", "clients", "customer database"] },
  { label: "User Administration", href: "/users", keywords: ["users", "administration", "user management"] },
  { label: "Profile Settings", href: "/profile", keywords: ["profile", "settings", "account", "preferences"] },
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
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen || results.length === 0) return;

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
            handleNavigation(results[selectedIndex].href);
          }
          break;
        case 'Escape':
          setIsOpen(false);
          inputRef.current?.blur();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, results, selectedIndex]);

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

  const handleNavigation = (href: string) => {
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
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-gray-400 dark:text-gray-500" />
        </div>
        
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="Search pages..."
          className={cn(
            "w-full pl-10 pr-10 py-2 text-sm",
            "bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm",
            "border border-gray-200/50 dark:border-gray-700/50",
            "rounded-lg shadow-sm",
            "focus:outline-none focus:ring-2 focus:ring-[#E60076]/20 focus:border-[#E60076]/50",
            "placeholder-gray-400 dark:placeholder-gray-500",
            "text-gray-900 dark:text-gray-100",
            "transition-all duration-200"
          )}
          aria-label="Search pages"
          aria-expanded={isOpen && results.length > 0}
          aria-haspopup="listbox"
          role="combobox"
        />

        {query && (
          <button
            onClick={clearSearch}
            className="absolute inset-y-0 right-0 pr-3 flex items-center hover:text-[#E60076] transition-colors"
            aria-label="Clear search"
          >
            <X className="h-4 w-4 text-gray-400 dark:text-gray-500" />
          </button>
        )}
      </div>

      {/* Search Results Dropdown */}
      <AnimatePresence>
        {isOpen && results.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className={cn(
              "absolute top-full left-0 right-0 mt-2 z-50",
              "bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl",
              "border border-gray-200/50 dark:border-gray-700/50",
              "rounded-lg shadow-lg",
              "max-h-80 overflow-y-auto"
            )}
            role="listbox"
          >
            {results.map((item, index) => (
              <motion.div
                key={item.href}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => handleNavigation(item.href)}
                className={cn(
                  "px-4 py-3 cursor-pointer transition-all duration-150",
                  "border-b border-gray-100/50 dark:border-gray-800/50 last:border-b-0",
                  selectedIndex === index
                    ? "bg-[#E60076]/10 dark:bg-[#E60076]/20 text-[#E60076]"
                    : "hover:bg-gray-50/50 dark:hover:bg-gray-800/50 text-gray-700 dark:text-gray-300"
                )}
                role="option"
                aria-selected={selectedIndex === index}
              >
                <div className="flex items-center space-x-3">
                  <Search className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                  <div>
                    <div className="font-medium text-sm">
                      {highlightMatch(item.label, query)}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {item.href}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* No Results */}
      <AnimatePresence>
        {isOpen && query && results.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={cn(
              "absolute top-full left-0 right-0 mt-2 z-50",
              "bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl",
              "border border-gray-200/50 dark:border-gray-700/50",
              "rounded-lg shadow-lg",
              "px-4 py-6 text-center"
            )}
          >
            <div className="text-gray-500 dark:text-gray-400 text-sm">
              No pages found for "{query}"
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}