// 'use client';

// import {
//   LayoutDashboard,
//   Users,
//   FolderOpen,
//   Scissors,
//   Tag,
//   Calendar,
//   User,
//   UserCircle,
//   Building2,
//   MessageCircle,
//   ChevronDown,
//   ChevronRight,
// } from 'lucide-react';

// import { usePathname, useRouter } from 'next/navigation';
// import { cn } from '@/lib/utils';
// import { Pacifico } from 'next/font/google';
// import { motion, AnimatePresence } from 'framer-motion';
// import {
//   Tooltip,
//   TooltipContent,
//   TooltipTrigger,
// } from '@/components/ui/tooltip';
// import { useState, useEffect } from 'react';

// const pacifico = Pacifico({
//   subsets: ['latin'],
//   weight: ['400'],
//   variable: '--font-pacifico',
// });

// // ✅ Nav items
// const navItems: {
//   icon: any;
//   label: string;
//   href: string;
//   roles: string[];
//   subItems?: { label: string; href: string }[];
// }[] = [
//   { icon: LayoutDashboard, label: "Dashboard", href: "/", roles: ["admin", "user"] },
//   { icon: FolderOpen, label: "Categories", href: "/catagories", roles: ["admin", "user"], subItems: [] },
//   { icon: Scissors, label: "Services", href: "/services", roles: ["admin", "user"], subItems: [] },
//   { icon: Tag, label: "Offers", href: "/offers", roles: ["admin", "user"], subItems: [] },
//   { icon: Calendar, label: "Bookings", href: "/bookings", roles: ["admin"], subItems: [] },
//   { icon: Users, label: "sales", href: "/sales", roles: ["admin", "user"], subItems: [] },
//   { icon: MessageCircle, label: "Chat", href: "/chat", roles: ["admin"], subItems: [] },
//   { icon: Building2, label: "Branches", href: "/branches", roles: ["admin", "user"], subItems: [] },
// { icon: Building2, label: "membership", href: "/membership", roles: ["admin", "user"], subItems: [] },

//   // 👇 Staff
//   { icon: Users, label: "Staff", href: "/staff", roles: ["admin", "user"], subItems: [] },
//   { icon: Users, label: "reports", href: "/reports", roles: ["admin", "user"], subItems: [] },
//   //sales
  

//   // 👇 ⭐ Customers
//   { icon: UserCircle, label: "Customers", href: "/customers", roles: ["admin", "user"], subItems: [] },

//   { icon: Users, label: "Users", href: "/users", roles: ["admin"], subItems: [] },
//   { icon: User, label: "Profile", href: "/profile", roles: ["admin", "user"], subItems: [] },
// ];

// interface SidebarProps {
//   collapsed: boolean;
// }

// export default function Sidebar({ collapsed }: SidebarProps) {
//   const pathname = usePathname();
//   const router = useRouter();
//   const [openMenus, setOpenMenus] = useState<string[]>([]);
//   const [darkMode, setDarkMode] = useState(false);

//   // ✅ Sync theme from localStorage
//   useEffect(() => {
//     const isDark = localStorage.getItem("theme") === "dark";
//     setDarkMode(isDark);

//     const observer = new MutationObserver(() => {
//       setDarkMode(document.documentElement.classList.contains("dark"));
//     });

//     observer.observe(document.documentElement, {
//       attributes: true,
//       attributeFilter: ["class"],
//     });

//     return () => observer.disconnect();
//   }, []);

//   // ✅ Ab hooks ke baad conditional return
//   if (pathname === "/signin") {
//     return null;
//   }

//   const isMenuItemActive = (href: string) => {
//     if (href === '/dashboard') {
//       return pathname === '/' || pathname === '/dashboard';
//     }
//     return pathname.startsWith(href);
//   };

//   const toggleSubmenu = (href: string) => {
//     setOpenMenus((prev) =>
//       prev.includes(href) ? prev.filter((h) => h !== href) : [...prev, href]
//     );
//   };

//   return (
//     <motion.div
//       initial={false}
//       animate={{
//         width: collapsed ? '54px' : '176px',
//       }}
//       transition={{
//         type: 'spring',
//         stiffness: 500,
//         damping: 30,
//         mass: 0.5,
//       }}
//       className={cn(
//         'fixed left-0 top-0 z-50 flex flex-col h-screen overflow-hidden rounded-r-3xl',
//         darkMode
//           ? 'bg-black border border-white/30 shadow-lg shadow-white/10'
//           : 'bg-gradient-to-br from-white/95 via-pink-50/90 to-white/95 backdrop-blur-xl border border-pink-200/40 shadow-2xl shadow-pink-500/10'
//       )}
//     >
//       {/* Content Container */}
//       <div className="relative z-10 flex flex-col h-full px-2 py-6 items-center">
//         {/* Logo */}
//         <motion.div
//           className={cn(
//             "flex-shrink-0 flex items-center justify-center py-4 mb-4 mx-auto rounded-2xl px-3 shadow-lg transition-all duration-300",
//             darkMode
//               ? "bg-black border border-white/30 shadow-white/10"
//               : "bg-gradient-to-br from-pink-100/50 to-pink-200/30 border border-pink-200/50 shadow-pink-500/20"
//           )}
//           layout
//           transition={{ duration: 0.15 }}>
//             <span className={cn(collapsed ? 'text-base' : 'text-lg',
//               pacifico.className,
//               darkMode
//                 ? "text-white"
//                 : "bg-clip-text text-transparent bg-gradient-to-r from-pink-600 to-pink-500"
//             )}
//           >
//             {collapsed ? 'L' : 'Mirror Salon'}
//           </span>
//         </motion.div>

//         {/* Navigation */}
//         <div className="overflow-y-auto pr-1 flex-1 space-y-0.5 w-full">
//           <nav className="flex flex-col space-y-1">
//             {navItems.map(({ icon: Icon, label, href, subItems = [] }, index) => {
//               const isActive = isMenuItemActive(href);
//               const isOpen = openMenus.includes(href);

//               return (
//                 <div key={index}>
//                   <motion.div whileTap={{ scale: 0.97 }} transition={{ duration: 0.1 }}>
//                     <motion.div
//                       layout
//                       transition={{ duration: 0.15 }}
//                       onClick={() =>
//                         subItems.length ? toggleSubmenu(href) : router.push(href)
//                       }
//                       suppressHydrationWarning
//                       className={cn(
//                         'flex items-center px-2.5 py-1.5 rounded-2xl cursor-pointer transition-all duration-300',
//                         collapsed && 'justify-center',
//                         isActive
//                           ? darkMode
//                             ? 'bg-white/10 text-white border border-white/30 shadow-white/10'
//                             : 'bg-gradient-to-r from-pink-500/25 to-pink-400/20 text-pink-700 shadow-lg shadow-pink-500/25 border border-pink-300/40'
//                           : darkMode
//                             ? 'text-gray-300 hover:text-white hover:bg-white/5'
//                             : 'hover:bg-gradient-to-r hover:from-pink-500/15 hover:to-pink-400/10 text-gray-600 hover:text-pink-600 hover:shadow-md hover:shadow-pink-500/15 hover:border-pink-200/30'
//                       )}
//                     >
//                       <Tooltip>
//                         <TooltipTrigger asChild>
//                           <div className="flex items-center justify-center">
//                             <Icon
//                               className={cn(
//                                 'w-3.5 h-3.5',
//                                 isActive
//                                   ? darkMode ? 'text-white' : 'text-pink-700'
//                                   : darkMode ? 'text-gray-300' : 'text-gray-600'
//                               )}
//                             />
//                           </div>
//                         </TooltipTrigger>
//                         {collapsed && (
//                           <TooltipContent
//                             side="right"
//                             className={cn(
//                               "shadow-lg",
//                               darkMode
//                                 ? "bg-black border border-white/30 text-white"
//                                 : "bg-white border border-pink-200/40"
//                             )}
//                           >
//                             <span>{label}</span>
//                           </TooltipContent>
//                         )}
//                       </Tooltip>

//                       {!collapsed && (
//                         <motion.div
//                           initial={{ opacity: 0, x: -10 }}
//                           animate={{ opacity: 1, x: 0 }}
//                           exit={{ opacity: 0 }}
//                           className="flex items-center justify-between w-full ml-3"
//                         >
//                           <span
//                             className={cn(
//                               'text-[10px] font-medium',
//                               isActive
//                                 ? darkMode ? "text-white" : "text-pink-700"
//                                 : darkMode ? "text-gray-300 hover:text-white" : "text-gray-600 hover:text-pink-600"
//                             )}
//                           >
//                             {label}
//                           </span>

//                           {subItems.length > 0 && (
//                             <span>
//                               {isOpen ? (
//                                 <ChevronDown size={14} className={darkMode ? "text-white" : "text-gray-600"} />
//                               ) : (
//                                 <ChevronRight size={14} className={darkMode ? "text-white" : "text-gray-600"} />
//                               )}
//                             </span>
//                           )}
//                         </motion.div>
//                       )}
//                     </motion.div>
//                   </motion.div>

//                   {/* Submenu */}
//                   <AnimatePresence>
//                     {!collapsed && subItems.length > 0 && isOpen && (
//                       <motion.ul
//                         initial={{ height: 0, opacity: 0 }}
//                         animate={{ height: 'auto', opacity: 1 }}
//                         exit={{ height: 0, opacity: 0 }}
//                         className="ml-8 mt-1 space-y-1 overflow-hidden"
//                       >
//                         {subItems.map((sub, i) => (
//                           <li
//                             key={i}
//                             onClick={() => router.push(sub.href)}
//                             className={cn(
//                               'px-2 py-1 text-[10px] rounded-md cursor-pointer',
//                               pathname === sub.href
//                                 ? darkMode
//                                   ? 'bg-white/10 text-white'
//                                   : 'bg-pink-500/20 text-pink-700'
//                                 : darkMode
//                                   ? 'text-gray-300 hover:text-white hover:bg-white/5'
//                                   : 'hover:bg-pink-500/10 text-gray-600 hover:text-pink-600'
//                             )}
//                           >
//                             {sub.label}
//                           </li>
//                         ))}
//                       </motion.ul>
//                     )}
//                   </AnimatePresence>
//                 </div>
//               );
//             })}
//           </nav>
//         </div>

//         {/* Decorative Element */}
//         <motion.div layout className="mt-4 flex justify-center">
//           <div
//             className={cn(
//               "w-12 h-0.5 rounded-full",
//               darkMode
//                 ? "bg-white/30 shadow-sm shadow-white/10"
//                 : "bg-pink-300/40 shadow-sm shadow-pink-500/20"
//             )}
//           />
//         </motion.div>
//       </div>
//     </motion.div>
//   );
// }


// new dropdown code
"use client";

import {
  LayoutDashboard,
  Users,
  FolderOpen,
  Scissors,
  Tag,
  Calendar,
  User,
  UserCircle,
  Building2,
  MessageCircle,
  ChevronDown,
  ChevronRight,
  ShoppingCart,
  TrendingUp,
  UserCheck,
  FileText,
  CreditCard,
  BarChart3,
  Settings,
  ClipboardList,
} from 'lucide-react';

import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Pacifico } from 'next/font/google';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useState, useEffect } from 'react';

const pacifico = Pacifico({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-pacifico',
});

// ✅ Nav items with professional names and icons
const navItems: {
  icon: any;
  label: string;
  href: string;
  roles: string[];
  subItems?: { label: string; href: string }[];
}[] = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/", roles: ["admin", "user"] },

  // Product Management dropdown (contains Categories, Services, Offers)
  {
    icon: FolderOpen,
    label: "Product Management",
    href: "/products",
    roles: ["admin", "user"],
    subItems: [
      { label: "Categories", href: "/catagories" },
      { label: "Services", href: "/services" },
      { label: "Offers & Promotions", href: "/offers" },
    ],
  },

  { icon: Calendar, label: "Appointment Management", href: "/bookings", roles: ["admin"], subItems: [] },
  { icon: ShoppingCart, label: "E-commerce", href: "/ecommerce", roles: ["admin", "user"], subItems: [] },
  { icon: TrendingUp, label: "Sales Analytics", href: "/sales", roles: ["admin", "user"], subItems: [] },
  { icon: MessageCircle, label: "Customer Support", href: "/chat", roles: ["admin"], subItems: [] },
  { icon: Building2, label: "Branch Management", href: "/branches", roles: ["admin", "user"], subItems: [] },
  { icon: CreditCard, label: "Membership Plans", href: "/membership", roles: ["admin", "user"], subItems: [] },
  { icon: FileText, label: "Membership Reports", href: "/membershipReport", roles: ["admin", "user"], subItems: [] },

  // Staff Management
  { icon: UserCheck, label: "Staff Management", href: "/staff", roles: ["admin", "user"], subItems: [] },
  { icon: ClipboardList, label: "Daily Tasks", href: "/staffDailyTasks", roles: ["admin", "user"], subItems: [] },
  { icon: BarChart3, label: "Business Reports", href: "/reports", roles: ["admin", "user"], subItems: [] },
  
  // Customer Management
  { icon: UserCircle, label: "Customer Management", href: "/customers", roles: ["admin", "user"], subItems: [] },

  { icon: Users, label: "User Administration", href: "/users", roles: ["admin"], subItems: [] },
  { icon: Settings, label: "Profile Settings", href: "/profile", roles: ["admin", "user"], subItems: [] },
];

interface SidebarProps {
  collapsed: boolean;
}

export default function Sidebar({ collapsed }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [openMenus, setOpenMenus] = useState<string[]>([]);
  const [darkMode, setDarkMode] = useState(false);

  // ✅ Sync theme from localStorage
  useEffect(() => {
    const isDark = localStorage.getItem("theme") === "dark";
    setDarkMode(isDark);

    const observer = new MutationObserver(() => {
      setDarkMode(document.documentElement.classList.contains("dark"));
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  // ✅ Ab hooks ke baad conditional return
  if (pathname === "/signin") {
    return null;
  }

  const isMenuItemActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/' || pathname === '/dashboard';
    }
    return pathname.startsWith(href);
  };

  const toggleSubmenu = (href: string) => {
    setOpenMenus((prev) =>
      prev.includes(href) ? prev.filter((h) => h !== href) : [...prev, href]
    );
  };

  return (
    <motion.div
      initial={false}
      animate={{
        width: collapsed ? '56px' : '200px',
        transition: 'width 0.3s ease-out',
      }}
      className={cn(
        'fixed left-0 top-0 z-30 h-full flex flex-col transition-all duration-300 ease-out',
        darkMode
          ? 'bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 border-r border-slate-700/50 shadow-2xl shadow-black/20'
          : 'bg-gradient-to-b from-white via-slate-50/80 to-white border-r border-slate-200/60 shadow-2xl shadow-slate-900/10 backdrop-blur-sm'
      )}
    >
      {/* Professional Header with Brand */}
      <div className="relative z-10 flex flex-col h-full">
        {/* Logo Section */}
        <motion.div
          className={cn(
            "flex-shrink-0 flex items-center justify-center py-4 mb-4 mx-2 mt-2 rounded-xl transition-all duration-300",
            darkMode
              ? "bg-gradient-to-r from-pink-900/50 to-pink-800/50 border border-pink-700/50 shadow-lg shadow-black/20"
              : "bg-gradient-to-r from-pink-50 to-pink-100 border border-pink-200/80 shadow-lg shadow-pink-900/5"
          )}
          layout
          transition={{ duration: 0.2 }}>
          <span
            suppressHydrationWarning
            className={cn(
              collapsed ? 'text-xs font-bold' : 'text-sm font-bold',
              pacifico.className,
              darkMode
                ? "text-pink-200"
                : "bg-clip-text text-transparent bg-gradient-to-r from-pink-600 to-pink-500"
            )}
          >
            {collapsed ? 'M' : 'Mirrors'}
          </span>
        </motion.div>

        {/* Navigation Section */}
        <div className="overflow-y-auto px-3 flex-1 space-y-1">
          <nav className="flex flex-col space-y-2">
            {navItems.map(({ icon: Icon, label, href, subItems = [] }, index) => {
              const isActive = isMenuItemActive(href);
              const isOpen = openMenus.includes(href);

              return (
                <div key={index}>
                  <motion.div 
                    whileHover={{ scale: 1.02 }} 
                    whileTap={{ scale: 0.98 }} 
                    transition={{ duration: 0.15 }}
                  >
                    <motion.div
                      layout
                      transition={{ duration: 0.2 }}
                      onClick={() =>
                        subItems.length ? toggleSubmenu(href) : router.push(href)
                      }
                      suppressHydrationWarning
                      className={cn(
                        'flex items-center px-4 py-3 rounded-xl cursor-pointer transition-all duration-300 group',
                        collapsed && 'justify-center px-3',
                        isActive
                          ? darkMode
                            ? 'bg-gradient-to-r from-[#E60076]/20 to-[#E60076]/30 text-[#E60076] border border-[#E60076]/30 shadow-lg shadow-[#E60076]/10'
                            : 'bg-gradient-to-r from-[#E60076]/10 to-[#E60076]/20 text-[#E60076] border border-[#E60076]/30 shadow-lg shadow-[#E60076]/10'
                          : darkMode
                            ? 'text-slate-300 hover:text-white hover:bg-gradient-to-r hover:from-[#E60076]/10 hover:to-[#E60076]/20 hover:border hover:border-[#E60076]/20'
                            : 'text-slate-600 hover:text-slate-800 hover:bg-gradient-to-r hover:from-[#E60076]/5 hover:to-[#E60076]/10 hover:border hover:border-[#E60076]/20 hover:shadow-md hover:shadow-[#E60076]/5'
                      )}
                    >
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center justify-center">
                            <Icon
                              className={cn(
                                'w-5 h-5 transition-colors duration-300',
                                isActive
                                  ? darkMode ? 'text-[#E60076]' : 'text-[#E60076]'
                                  : darkMode ? 'text-slate-400 group-hover:text-white' : 'text-slate-500 group-hover:text-slate-700'
                              )}
                            />
                          </div>
                        </TooltipTrigger>
                        {collapsed && (
                          <TooltipContent
                            side="right"
                            className={cn(
                              "shadow-xl border-0",
                              darkMode
                                ? "bg-slate-800 text-white shadow-black/20"
                                : "bg-white text-slate-700 shadow-slate-900/10"
                            )}
                          >
                            <span className="font-medium">{label}</span>
                          </TooltipContent>
                        )}
                      </Tooltip>

                      {!collapsed && (
                        <motion.div
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0 }}
                          className="flex items-center justify-between w-full ml-4"
                        >
                          <span
                            className={cn(
                              'text-xs font-medium tracking-wide',
                              isActive
                                ? darkMode ? "text-blue-300" : "text-blue-700"
                                : darkMode ? "text-slate-300 group-hover:text-white" : "text-slate-600 group-hover:text-slate-800"
                            )}
                          >
                            {label}
                          </span>

                          {subItems.length > 0 && (
                            <span className="transition-transform duration-200">
                              {isOpen ? (
                                <ChevronDown size={16} className={cn(
                                  "transition-colors duration-200",
                                  darkMode ? "text-slate-400" : "text-slate-500"
                                )} />
                              ) : (
                                <ChevronRight size={16} className={cn(
                                  "transition-colors duration-200",
                                  darkMode ? "text-slate-400" : "text-slate-500"
                                )} />
                              )}
                            </span>
                          )}
                        </motion.div>
                      )}
                    </motion.div>
                  </motion.div>

                  {/* Professional Submenu */}
                  <AnimatePresence>
                    {!collapsed && subItems.length > 0 && isOpen && (
                      <motion.ul
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="ml-12 mt-2 space-y-1 overflow-hidden"
                      >
                        {subItems.map((sub, i) => (
                          <motion.li
                            key={i}
                            whileHover={{ x: 4 }}
                            transition={{ duration: 0.15 }}
                            onClick={() => router.push(sub.href)}
                            className={cn(
                              'px-3 py-2 text-xs rounded-lg cursor-pointer transition-all duration-200 border',
                              pathname === sub.href
                                ? darkMode
                                  ? 'bg-[#E60076]/20 text-[#E60076] border-[#E60076]/30'
                                  : 'bg-[#E60076]/10 text-[#E60076] border-[#E60076]/30'
                                : darkMode
                                  ? 'text-slate-400 hover:text-white hover:bg-[#E60076]/10 border-transparent hover:border-[#E60076]/20'
                                  : 'text-slate-500 hover:text-slate-700 hover:bg-[#E60076]/5 border-transparent hover:border-[#E60076]/20'
                            )}
                          >
                            {sub.label}
                          </motion.li>
                        ))}
                      </motion.ul>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </nav>
        </div>

        {/* Professional Footer Accent */}
        <motion.div layout className="mt-6 mb-4 flex justify-center">
          <div
            className={cn(
              "w-16 h-1 rounded-full transition-all duration-300",
              darkMode
                ? "bg-gradient-to-r from-slate-600 to-slate-500 shadow-lg shadow-black/20"
                : "bg-gradient-to-r from-slate-300 to-slate-200 shadow-lg shadow-slate-900/10"
            )}
          />
        </motion.div>
      </div>
    </motion.div>
  );
}
