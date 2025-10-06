// // new dropdown code
// "use client";

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
//   ShoppingCart,
//   TrendingUp,
//   UserCheck,
//   FileText,
//   CreditCard,
//   BarChart3,
//   Settings,
//   ClipboardList,
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

// // Navigation items
// const navItems: {
//   icon: any;
//   label: string;
//   href: string;
//   roles: string[];
//   subItems?: { label: string; href: string; description?: string; icon?: any }[];
// }[] = [
//   { icon: LayoutDashboard, label: "Dashboard", href: "/", roles: ["admin", "user"] },

//   // Product Management
//   {
//     icon: FolderOpen,
//     label: "Product Management",
//     href: "/products",
//     roles: ["admin", "user"],
//     subItems: [
//       { label: "Categories", href: "/catagories" },
//       { label: "Services", href: "/services" },
//       { label: "Offers & Promotions", href: "/offers" },
//     ],
//   },

//   { icon: Calendar, label: "Appointment Management", href: "/bookings", roles: ["admin"], subItems: [] },
//   { icon: ShoppingCart, label: "E-commerce", href: "/ecommerce", roles: ["admin", "user"], subItems: [] },
//   { icon: TrendingUp, label: "Sales Analytics", href: "/sales", roles: ["admin", "user"], subItems: [] },
//   { icon: MessageCircle, label: "Customer Support", href: "/chat", roles: ["admin"], subItems: [] },
//   { icon: Building2, label: "Branch Management", href: "/branches", roles: ["admin", "user"], subItems: [] },
//   { icon: CreditCard, label: "Membership Plans", href: "/membership", roles: ["admin", "user"], subItems: [] },
//   { icon: FileText, label: "Membership & LoyaltyPoints Reports", href: "/membershipReport", roles: ["admin", "user"], subItems: [] },

//   // Staff Management
//   { icon: UserCheck, label: "Staff Management", href: "/staff", roles: ["admin", "user"], subItems: [] },
//   { icon: UserCheck, label: "Booking Approval Page", href: "/bookingstatus", roles: ["admin", "user"], subItems: [] },
//   { icon: ClipboardList, label: "Daily Tasks", href: "/staffDailyTasks", roles: ["admin", "user"], subItems: [] },
//   { icon: BarChart3, label: "Business Reports", href: "/reports", roles: ["admin", "user"], subItems: [] },
  
//   // Customer Management
//   { icon: UserCircle, label: "Customer Management", href: "/customers", roles: ["admin", "user"], subItems: [] },

//   { icon: Users, label: "User Administration", href: "/users", roles: ["admin"], subItems: [] },
//   { icon: Settings, label: "Profile Settings", href: "/profile", roles: ["admin", "user"], subItems: [] },
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
//         width: collapsed ? '56px' : '280px',
//       }}
//       transition={{ duration: 0.3, ease: 'easeInOut' }}
//       className={cn(
//         'fixed left-0 top-0 h-full z-30 flex flex-col',
//         'bg-gradient-to-b from-white via-white to-pink-50/30',
//         'dark:from-slate-900 dark:via-slate-900 dark:to-slate-800/50',
//         'border-r border-pink-100/50 dark:border-slate-700/50',
//         'shadow-xl shadow-pink-100/20 dark:shadow-slate-900/50'
//       )}
//     >
//       {/* Header */}
//       <div className="flex items-center justify-center h-16 px-4 border-b border-pink-100/50 dark:border-slate-700/50">
//         <motion.div
//           animate={{ opacity: collapsed ? 0 : 1 }}
//           transition={{ duration: 0.2 }}
//           className={cn(
//             'flex items-center gap-3',
//             collapsed && 'pointer-events-none'
//           )}
//         >
//           <div className="w-8 h-8 bg-gradient-to-br from-pink-500 to-pink-600 rounded-lg flex items-center justify-center shadow-lg">
//             <span className={cn('text-white font-bold text-sm', pacifico.className)}>
//               L
//             </span>
//           </div>
//           <div className="flex flex-col">
//             <h1 className="text-sm font-semibold text-pink-600 dark:text-pink-400">
//               Mirrors Beauty Lounge
//             </h1>
//             <p className="text-xs text-slate-500 dark:text-slate-400">
//               Welcome to Your Salon
//             </p>
//           </div>
//         </motion.div>
//       </div>

//       {/* Navigation */}
//       <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
//         {navItems.map(({ icon: Icon, label, href, subItems = [] }) => {
//           const isActive = isMenuItemActive(href);
//           const hasSubItems = subItems.length > 0;
//           const isOpen = openMenus.includes(href);

//           return (
//             <div key={href}>
//               <Tooltip>
//                 <TooltipTrigger asChild>
//                   <motion.div
//                     whileHover={{ x: collapsed ? 0 : 4 }}
//                     whileTap={{ scale: 0.98 }}
//                     transition={{ duration: 0.15 }}
//                     onClick={() => {
//                       if (hasSubItems) {
//                         toggleSubmenu(href);
//                       } else {
//                         router.push(href);
//                       }
//                     }}
//                     className={cn(
//                       'flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-200 group',
//                       isActive
//                         ? darkMode
//                           ? 'bg-gradient-to-r from-[#E60076]/20 to-[#E60076]/10 text-[#E60076] shadow-lg shadow-[#E60076]/10'
//                           : 'bg-gradient-to-r from-[#E60076]/15 to-[#E60076]/5 text-[#E60076] shadow-lg shadow-[#E60076]/10'
//                         : darkMode
//                           ? 'text-slate-400 hover:text-white hover:bg-gradient-to-r hover:from-[#E60076]/10 hover:to-[#E60076]/5'
//                           : 'text-slate-600 hover:text-slate-800 hover:bg-gradient-to-r hover:from-[#E60076]/8 hover:to-[#E60076]/3'
//                     )}
//                   >
//                     <Icon className={cn('w-5 h-5 flex-shrink-0', isActive && 'drop-shadow-sm')} />
                    
//                     <motion.span
//                       animate={{ opacity: collapsed ? 0 : 1 }}
//                       transition={{ duration: 0.2 }}
//                       className={cn(
//                         'font-medium text-sm flex-1',
//                         collapsed && 'pointer-events-none'
//                       )}
//                     >
//                       {label}
//                     </motion.span>

//                     {hasSubItems && !collapsed && (
//                       <motion.div
//                         animate={{ rotate: isOpen ? 90 : 0 }}
//                         transition={{ duration: 0.2 }}
//                       >
//                         <ChevronRight className="w-4 h-4" />
//                       </motion.div>
//                     )}
//                   </motion.div>
//                 </TooltipTrigger>
//                 <TooltipContent side="right" className={collapsed ? '' : 'hidden'}>
//                   <p>{label}</p>
//                 </TooltipContent>
//               </Tooltip>

//               {/* Submenu */}
//               <AnimatePresence>
//                 {hasSubItems && isOpen && !collapsed && (
//                   <motion.div
//                     initial={{ height: 0, opacity: 0 }}
//                     animate={{ height: 'auto', opacity: 1 }}
//                     exit={{ height: 0, opacity: 0 }}
//                     transition={{ duration: 0.2 }}
//                     className="overflow-hidden"
//                   >
//                     <motion.ul
//                       initial={{ height: 0, opacity: 0 }}
//                       animate={{ height: 'auto', opacity: 1 }}
//                       exit={{ height: 0, opacity: 0 }}
//                       transition={{ duration: 0.2 }}
//                       className="ml-12 mt-2 space-y-1 overflow-hidden"
//                     >
//                       {subItems.map((sub, i) => (
//                         <motion.li
//                           key={i}
//                           whileHover={{ x: 4 }}
//                           transition={{ duration: 0.15 }}
//                           onClick={() => router.push(sub.href)}
//                           className={cn(
//                             'px-3 py-2 text-xs rounded-lg cursor-pointer transition-all duration-200 border flex items-center gap-2',
//                             pathname === sub.href
//                               ? darkMode
//                                 ? 'bg-[#E60076]/20 text-[#E60076] border-[#E60076]/30'
//                                 : 'bg-[#E60076]/10 text-[#E60076] border-[#E60076]/30'
//                               : darkMode
//                                 ? 'text-slate-400 hover:text-white hover:bg-[#E60076]/10 border-transparent hover:border-[#E60076]/20'
//                                 : 'text-slate-500 hover:text-slate-700 hover:bg-[#E60076]/5 border-transparent hover:border-[#E60076]/20'
//                           )}
//                         >
//                           <span>{sub.label}</span>
//                         </motion.li>
//                       ))}
//                     </motion.ul>
//                   </motion.div>
//                 )}
//               </AnimatePresence>
//             </div>
//           );
//         })}
//       </div>
//     </motion.div>
//   );
// }

// invoice
// new dropdown code
// new dropdown code
"use client";

import {
  LayoutDashboard,
  Users,
  FolderOpen,
  Calendar,
  UserCircle,
  Building2,
  MessageCircle,
  ChevronRight,
  ShoppingCart,
  TrendingUp,
  UserCheck,
  FileText,
  CreditCard,
  BarChart3,
  Settings,
  ClipboardList,
  Receipt,
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

// Navigation items
const navItems: {
  icon: any;
  label: string;
  href: string;
  roles: string[];
  subItems?: { label: string; href: string; description?: string; icon?: any }[];
}[] = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/", roles: ["admin", "user"] },

  // ✅ Invoice Management Added
  {
    icon: Receipt,
    label: "Invoice Management",
    href: "/invoice-generator",
    roles: ["admin", "user"],
    subItems: [
      { label: "Create Invoice", href: "/invoice-generator" },
      
    ],
  },

  // Product Management
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
  { icon: FileText, label: "Membership & LoyaltyPoints Reports", href: "/membershipReport", roles: ["admin", "user"], subItems: [] },
  { icon: FileText, label: "Feedback Report", href: "/feedback", roles: ["admin", "user"], subItems: [] },

  // Staff Management
  { icon: UserCheck, label: "Staff Management", href: "/staff", roles: ["admin", "user"], subItems: [] },
  { icon: UserCheck, label: "Booking Approval Page", href: "/bookingstatus", roles: ["admin", "user"], subItems: [] },
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
        width: collapsed ? '56px' : '280px',
      }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className={cn(
        'fixed left-0 top-0 h-full z-30 flex flex-col',
        'bg-gradient-to-b from-white via-white to-pink-50/30',
        'dark:from-slate-900 dark:via-slate-900 dark:to-slate-800/50',
        'border-r border-pink-100/50 dark:border-slate-700/50',
        'shadow-xl shadow-pink-100/20 dark:shadow-slate-900/50'
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-center h-16 px-4 border-b border-pink-100/50 dark:border-slate-700/50">
        <motion.div
          animate={{ opacity: collapsed ? 0 : 1 }}
          transition={{ duration: 0.2 }}
          className={cn(
            'flex items-center gap-3',
            collapsed && 'pointer-events-none'
          )}
        >
          <div className="w-8 h-8 bg-gradient-to-br from-pink-500 to-pink-600 rounded-lg flex items-center justify-center shadow-lg">
            <span className={cn('text-white font-bold text-sm', pacifico.className)}>
              M
            </span>
          </div>
          <div className="flex flex-col">
            <h1 className="text-sm font-semibold text-pink-600 dark:text-pink-400">
              Mirrors Beauty Lounge
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Welcome to Your Salon
            </p>
          </div>
        </motion.div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {navItems.map(({ icon: Icon, label, href, subItems = [] }) => {
          const isActive = isMenuItemActive(href);
          const hasSubItems = subItems.length > 0;
          const isOpen = openMenus.includes(href);

          return (
            <div key={href}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <motion.div
                    whileHover={{ x: collapsed ? 0 : 4 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ duration: 0.15 }}
                    onClick={() => {
                      if (hasSubItems) {
                        toggleSubmenu(href);
                      } else {
                        router.push(href);
                      }
                    }}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-200 group',
                      isActive
                        ? darkMode
                          ? 'bg-gradient-to-r from-[#E60076]/20 to-[#E60076]/10 text-[#E60076] shadow-lg shadow-[#E60076]/10'
                          : 'bg-gradient-to-r from-[#E60076]/15 to-[#E60076]/5 text-[#E60076] shadow-lg shadow-[#E60076]/10'
                        : darkMode
                          ? 'text-slate-400 hover:text-white hover:bg-gradient-to-r hover:from-[#E60076]/10 hover:to-[#E60076]/5'
                          : 'text-slate-600 hover:text-slate-800 hover:bg-gradient-to-r hover:from-[#E60076]/8 hover:to-[#E60076]/3'
                    )}
                  >
                    <Icon className={cn('w-5 h-5 flex-shrink-0', isActive && 'drop-shadow-sm')} />
                    
                    <motion.span
                      animate={{ opacity: collapsed ? 0 : 1 }}
                      transition={{ duration: 0.2 }}
                      className={cn(
                        'font-medium text-sm flex-1',
                        collapsed && 'pointer-events-none'
                      )}
                    >
                      {label}
                    </motion.span>

                    {hasSubItems && !collapsed && (
                      <motion.div
                        animate={{ rotate: isOpen ? 90 : 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <ChevronRight className="w-4 h-4" />
                      </motion.div>
                    )}
                  </motion.div>
                </TooltipTrigger>
                <TooltipContent side="right" className={collapsed ? '' : 'hidden'}>
                  <p>{label}</p>
                </TooltipContent>
              </Tooltip>

              {/* Submenu */}
              <AnimatePresence>
                {hasSubItems && isOpen && !collapsed && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
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
                            'px-3 py-2 text-xs rounded-lg cursor-pointer transition-all duration-200 border flex items-center gap-2',
                            pathname === sub.href
                              ? darkMode
                                ? 'bg-[#E60076]/20 text-[#E60076] border-[#E60076]/30'
                                : 'bg-[#E60076]/10 text-[#E60076] border-[#E60076]/30'
                              : darkMode
                                ? 'text-slate-400 hover:text-white hover:bg-[#E60076]/10 border-transparent hover:border-[#E60076]/20'
                                : 'text-slate-500 hover:text-slate-700 hover:bg-[#E60076]/5 border-transparent hover:border-[#E60076]/20'
                          )}
                        >
                          <span>{sub.label}</span>
                        </motion.li>
                      ))}
                    </motion.ul>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
