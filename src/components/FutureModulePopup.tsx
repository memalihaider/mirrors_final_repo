'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, MessageCircle, Star, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';

interface FutureModulePopupProps {
  isOpen: boolean;
  onClose: () => void;
  moduleTitle: string;
  moduleDescription: string;
}

export default function FutureModulePopup({ 
  isOpen, 
  onClose, 
  moduleTitle, 
  moduleDescription 
}: FutureModulePopupProps) {
  const [darkMode, setDarkMode] = useState(false);

  // Sync theme from localStorage
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

  const services = [
    { name: "SEO", icon: "🔍" },
    { name: "Digital Marketing", icon: "📱" },
    { name: "Software Development", icon: "💻" },
    { name: "Video Editing", icon: "🎬" },
    { name: "Other Professional Services", icon: "⚡" }
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />
          
          {/* Popup */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div
              className={cn(
                "relative w-full max-w-md rounded-2xl shadow-2xl border overflow-hidden",
                darkMode
                  ? "bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border-slate-700/50"
                  : "bg-gradient-to-br from-white via-slate-50 to-white border-slate-200/60"
              )}
            >
              {/* Header with close button */}
              <div className="relative p-6 pb-4">
                <button
                  onClick={onClose}
                  className={cn(
                    "absolute top-4 right-4 p-2 rounded-full transition-all duration-200 hover:scale-110",
                    darkMode
                      ? "text-slate-400 hover:text-white hover:bg-slate-700/50"
                      : "text-slate-500 hover:text-slate-700 hover:bg-slate-100"
                  )}
                >
                  <X size={20} />
                </button>

                {/* Future Module Badge */}
                <div className="flex items-center gap-2 mb-4">
                  <div className={cn(
                    "p-2 rounded-xl",
                    darkMode
                      ? "bg-gradient-to-r from-[#E60076]/20 to-purple-600/20"
                      : "bg-gradient-to-r from-[#E60076]/10 to-purple-600/10"
                  )}>
                    <Sparkles className="w-5 h-5 text-[#E60076]" />
                  </div>
                  <span className={cn(
                    "text-sm font-semibold px-3 py-1 rounded-full",
                    darkMode
                      ? "bg-[#E60076]/20 text-[#E60076] border border-[#E60076]/30"
                      : "bg-[#E60076]/10 text-[#E60076] border border-[#E60076]/30"
                  )}>
                    Coming Soon
                  </span>
                </div>

                {/* Module Title */}
                <h2 className={cn(
                  "text-xl font-bold mb-2",
                  darkMode ? "text-white" : "text-slate-800"
                )}>
                  {moduleTitle}
                </h2>

                {/* Module Description */}
                <p className={cn(
                  "text-sm leading-relaxed",
                  darkMode ? "text-slate-300" : "text-slate-600"
                )}>
                  {moduleDescription}
                </p>
              </div>

              {/* Future Module Notice */}
              <div className={cn(
                "mx-6 p-4 rounded-xl border-l-4 border-[#E60076]",
                darkMode
                  ? "bg-gradient-to-r from-[#E60076]/10 to-purple-600/10 border-r border-t border-b border-[#E60076]/20"
                  : "bg-gradient-to-r from-[#E60076]/5 to-purple-600/5 border-r border-t border-b border-[#E60076]/20"
              )}>
                <div className="flex items-center gap-2 mb-2">
                  <Star className="w-4 h-4 text-[#E60076]" />
                  <span className={cn(
                    "font-semibold text-sm",
                    darkMode ? "text-white" : "text-slate-800"
                  )}>
                    This is a Future Module
                  </span>
                </div>
                <p className={cn(
                  "text-xs leading-relaxed",
                  darkMode ? "text-slate-300" : "text-slate-600"
                )}>
                  This feature is currently under development and will be available in upcoming releases.
                </p>
              </div>

              {/* Contact Information */}
              <div className="p-6 pt-4">
                <h3 className={cn(
                  "font-semibold mb-4 text-sm",
                  darkMode ? "text-white" : "text-slate-800"
                )}>
                  Need Custom Integration?
                </h3>

                <div className="space-y-3 mb-6">
                  {/* Email */}
                  <div className={cn(
                    "flex items-center gap-3 p-3 rounded-xl transition-all duration-200 hover:scale-[1.02]",
                    darkMode
                      ? "bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700/50"
                      : "bg-slate-50 hover:bg-slate-100 border border-slate-200/50"
                  )}>
                    <div className={cn(
                      "p-2 rounded-lg",
                      darkMode ? "bg-blue-900/30" : "bg-blue-100"
                    )}>
                      <Mail className="w-4 h-4 text-blue-500" />
                    </div>
                    <div>
                      <p className={cn(
                        "text-xs font-medium",
                        darkMode ? "text-slate-300" : "text-slate-600"
                      )}>
                        Email
                      </p>
                      <p className={cn(
                        "text-sm font-semibold",
                        darkMode ? "text-white" : "text-slate-800"
                      )}>
                        Largifysolutions.com
                      </p>
                    </div>
                  </div>

                  {/* WhatsApp */}
                  <div className={cn(
                    "flex items-center gap-3 p-3 rounded-xl transition-all duration-200 hover:scale-[1.02]",
                    darkMode
                      ? "bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700/50"
                      : "bg-slate-50 hover:bg-slate-100 border border-slate-200/50"
                  )}>
                    <div className={cn(
                      "p-2 rounded-lg",
                      darkMode ? "bg-green-900/30" : "bg-green-100"
                    )}>
                      <MessageCircle className="w-4 h-4 text-green-500" />
                    </div>
                    <div>
                      <p className={cn(
                        "text-xs font-medium",
                        darkMode ? "text-slate-300" : "text-slate-600"
                      )}>
                        WhatsApp
                      </p>
                      <p className={cn(
                        "text-sm font-semibold",
                        darkMode ? "text-white" : "text-slate-800"
                      )}>
                        +966 59 736 9443
                      </p>
                    </div>
                  </div>
                </div>

                {/* Services */}
                <div>
                  <h4 className={cn(
                    "font-semibold mb-3 text-sm",
                    darkMode ? "text-white" : "text-slate-800"
                  )}>
                    Largify Solutions Services
                  </h4>
                  <div className="grid grid-cols-1 gap-2">
                    {services.map((service, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className={cn(
                          "flex items-center gap-3 p-2 rounded-lg transition-all duration-200",
                          darkMode
                            ? "hover:bg-slate-800/30"
                            : "hover:bg-slate-50"
                        )}
                      >
                        <span className="text-lg">{service.icon}</span>
                        <span className={cn(
                          "text-sm font-medium",
                          darkMode ? "text-slate-300" : "text-slate-700"
                        )}>
                          {service.name}
                        </span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}