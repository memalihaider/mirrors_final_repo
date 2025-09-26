"use client";

import React, { useState, useEffect, useRef } from "react";
import { Menu, User, LogIn, LogOut, Bell, Sun, Moon } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Pacifico } from "next/font/google";
import SearchBar from './SearchBar';
import { useAuth } from "@/contexts/AuthContext";
import { signOutUser } from "@/lib/auth";
import { useRouter, usePathname } from "next/navigation";

const pacifico = Pacifico({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-pacifico",
});

type Notification = {
  id: string;
  type: "booking" | "chat";
  message: string;
  createdAt?: any;
};

type HeaderProps = {
  onToggleSidebar?: () => void;
  sidebarOpen?: boolean;
  isMobile?: boolean;
};

export default function Header({ onToggleSidebar, sidebarOpen, isMobile }: HeaderProps) {
  const router = useRouter();
  const { user, userRole } = useAuth();
  const pathname = usePathname();

  if (pathname === "/signin") return null;

  const [scrolled, setScrolled] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unread, setUnread] = useState<Notification[]>([]);
  const [showNotificationMenu, setShowNotificationMenu] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);
  const notifyRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Theme setup
  useEffect(() => {
    const saved = localStorage.getItem("theme") || "light";
    const isDark = saved === "dark";
    setDarkMode(isDark);
    document.documentElement.classList.toggle("dark", isDark);
  }, []);

  // Handle scroll shadow
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close menus on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
      if (notifyRef.current && !notifyRef.current.contains(event.target as Node)) {
        setShowNotificationMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showUserMenu, showNotificationMenu]);

  // Handle sign out
  const handleSignOut = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    setShowUserMenu(false);

    try {
      console.log("🔐 Navbar: Starting sign out process...");
      const { error } = await signOutUser();
      
      if (error) {
        console.error("🔐 Navbar: Sign out error:", error);
        alert("Error signing out: " + error);
      } else {
        console.log("🔐 Navbar: Sign out successful, redirecting to signin...");
        // Clear any local storage or session data if needed
        localStorage.removeItem('theme'); // Optional: reset theme on logout
        router.push("/signin");
      }
    } catch (error) {
      console.error("🔐 Navbar: Unexpected sign out error:", error);
      alert("Error signing out: " + error);
    }
  };

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.23, 0.86, 0.39, 0.96] }}
      className={cn(
        "fixed top-0 left-0 right-0 z-40 transition-all duration-300 ease-out",
        "bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-b border-[#E60076]/30 dark:border-[#E60076]/40",
        scrolled ? "shadow-lg" : "shadow-sm",
        // Responsive positioning based on sidebar state
        isMobile 
          ? "ml-0" 
          : sidebarOpen 
            ? "ml-50" // expanded sidebar width (200px)
            : "ml-14" // collapsed sidebar width (56px)
      )}
    >
      <div className="flex items-center justify-between h-14 px-4 sm:px-6">
        {/* Left Section */}
        <div className="flex items-center space-x-3">
          {onToggleSidebar && (
            <button
              onClick={onToggleSidebar}
              className="p-2 rounded-lg bg-[#E60076]/10 dark:bg-[#E60076]/20 hover:bg-[#E60076]/20 dark:hover:bg-[#E60076]/30 transition-colors"
              title="Toggle Sidebar"
              type="button"
            >
              <Menu className="w-4 h-4 text-[#E60076] dark:text-[#E60076]" />
            </button>
          )}
          <div className="flex flex-col">
            <h1 className="text-sm font-semibold text-[#E60076] dark:text-gray-200">
              Mirrors
            </h1>
            <div className="text-[10px] text-gray-600 dark:text-gray-400 hidden sm:block">
              Welcome to{" "}
              <span
                className={cn(
                  "relative bg-gradient-to-r from-[#E60076] via-[#E60076] to-[#E60076] text-transparent bg-clip-text",
                  pacifico.className
                )}
              >
                Your Salon
              </span>
            </div>
          </div>
        </div>

        {/* Center Section - Search Bar */}
        <div className="flex-1 max-w-md mx-4 hidden md:block">
          <SearchBar />
        </div>

        {/* Right Section */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Notifications */}
          <div className="relative" ref={notifyRef}>
            <button
              onClick={() => setShowNotificationMenu(!showNotificationMenu)}
              className="relative p-2 rounded-lg bg-[#E60076]/10 dark:bg-[#E60076]/20 hover:bg-[#E60076]/20 dark:hover:bg-[#E60076]/30 transition-colors"
            >
              <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-[#E60076] dark:text-[#E60076]" />
              {(unread.length > 0 || notifications.length > 0) && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full"></span>
              )}
            </button>

            {showNotificationMenu && (
              <div className="absolute right-0 mt-2 w-64 sm:w-80 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border border-[#E60076]/30 dark:border-[#E60076]/40 rounded-xl shadow-lg z-50">
                <div className="p-3 border-b border-[#E60076]/20 dark:border-[#E60076]/40">
                  <p className="text-xs font-medium text-gray-600 dark:text-gray-300">
                    Notifications
                  </p>
                </div>
                {notifications.length === 0 ? (
                  <div className="p-3 text-xs text-gray-500 dark:text-gray-400">
                    No new notifications
                  </div>
                ) : (
                  <ul className="max-h-60 overflow-y-auto">
                    {notifications.map((n) => (
                      <li
                        key={n.id}
                        className={`px-3 py-2 text-xs ${
                          n.type === "booking"
                            ? "text-[#E60076] dark:text-[#E60076]"
                            : "text-blue-700 dark:text-blue-300"
                        } hover:bg-gray-50 dark:hover:bg-gray-800/40 cursor-pointer border-b border-gray-100 dark:border-gray-700/40 last:border-b-0`}
                      >
                        {n.message}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>

          {/* Profile Section */}
          <div className="relative flex items-center" ref={menuRef}>
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-2 px-2 sm:px-3 py-1.5 rounded-lg border border-[#E60076]/40 
                             bg-[#E60076]/10 dark:bg-[#E60076]/20 hover:bg-[#E60076]/20 dark:hover:bg-[#E60076]/30 
                             shadow-sm transition-colors"
                >
                  <div className="h-6 w-6 rounded-full bg-gradient-to-br from-[#E60076]/20 to-[#E60076]/30 
                                  flex items-center justify-center border border-[#E60076]/50">
                    <User className="h-3.5 w-3.5 text-[#E60076]" />
                  </div>
                  <span className="hidden sm:inline text-xs font-medium text-gray-900 dark:text-gray-200 max-w-24 truncate">
                    {user.displayName || user.email}
                  </span>
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-52 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl 
                                  border border-[#E60076]/30 dark:border-[#E60076]/40 rounded-xl shadow-lg z-50">
                    <div className="p-3 border-b border-[#E60076]/20 dark:border-[#E60076]/40">
                      <p className="text-xs font-medium text-gray-900 dark:text-gray-200 truncate">
                        {user.displayName || user.email?.split("@")[0]}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {user.email}
                      </p>
                      {userRole && (
                        <span className="inline-block mt-1 px-2 py-0.5 text-[10px] font-medium bg-[#E60076]/10 dark:bg-[#E60076]/30 text-[#E60076] dark:text-[#E60076] rounded-full">
                          {userRole.role}
                        </span>
                      )}
                    </div>
                    <div className="p-1">
                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          router.push("/profile");
                        }}
                        className="w-full text-left px-3 py-2 text-xs text-gray-700 dark:text-gray-300 hover:bg-[#E60076]/5 dark:hover:bg-[#E60076]/20 rounded-lg transition-colors"
                      >
                        Profile Settings
                      </button>
                      <button
                        onClick={handleSignOut}
                        className="w-full text-left px-3 py-2 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      >
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => router.push("/signin")}
                className="flex items-center space-x-2 px-3 py-1.5 rounded-lg border border-[#E60076]/40 
                           bg-[#E60076]/10 dark:bg-[#E60076]/20 hover:bg-[#E60076]/20 dark:hover:bg-[#E60076]/30 
                           shadow-sm transition-colors"
              >
                <LogIn className="h-4 w-4 text-[#E60076] dark:text-[#E60076]" />
                <span className="hidden sm:inline text-xs font-medium text-gray-900 dark:text-gray-200">
                  Sign In
                </span>
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.header>
  );
}


