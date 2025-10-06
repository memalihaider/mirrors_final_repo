'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import SidebarWrapper from './SidebarWrapper';
import Navbar from './Navbar';
import { AuthProvider } from '@/contexts/AuthContext';
import ProtectedRoute from './ProtectedRoute';

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // 👉 Separate mobile sidebar open state vs desktop collapse state
  const [sidebarOpen, setSidebarOpen] = useState(false); // for mobile overlay
  const [collapsed, setCollapsed] = useState(false); // for desktop collapsed/expanded
  const [isMobile, setIsMobile] = useState(false);

  // Public pages
  const isPublicPage = pathname === '/signin' || pathname === '/test';

  // Detect mobile vs desktop
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768; // md breakpoint
      setIsMobile(mobile);

      if (mobile) {
        setSidebarOpen(false); // always closed on load
      } else {
        // Always start with sidebar expanded on desktop (non-sticky)
        setCollapsed(false);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Toggle sidebar (mobile opens overlay, desktop toggles collapse)
  const toggleSidebar = () => {
    if (isMobile) {
      setSidebarOpen((prev) => !prev);
    } else {
      // Toggle collapse state without saving to localStorage (non-sticky)
      setCollapsed((prev) => !prev);
    }
  };

  // Close sidebar overlay on mobile
  const closeSidebar = () => {
    if (isMobile && sidebarOpen) {
      setSidebarOpen(false);
    }
  };

  // Test page - no wrappers
  if (pathname === '/test') {
    return children;
  }

  return (
    <AuthProvider>
      {isPublicPage ? (
        children
      ) : (
        <ProtectedRoute>
          <div className="min-h-screen bg-white">
            {/* Mobile overlay */}
            {isMobile && sidebarOpen && (
              <div
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden transition-opacity duration-300"
                onClick={closeSidebar}
                style={{ touchAction: 'none' }}
              />
            )}

            {/* Navbar */}
            <Navbar
              onToggleSidebar={toggleSidebar}
              sidebarOpen={isMobile ? sidebarOpen : !collapsed}
              isMobile={isMobile}
            />

            {/* Sidebar */}
            <SidebarWrapper
              collapsed={collapsed}
              setCollapsed={setCollapsed}
              isMobile={isMobile}
              isOpen={sidebarOpen}
              onClose={closeSidebar}
            />

            {/* Main content */}
            <main
              className={`
                transition-all duration-300 ease-out 
                pt-16 pb-4 px-1
                sm:pt-16 sm:pb-6 sm:px-2
                md:pt-16 md:pb-6 md:px-4
                ${
                  isMobile
                    ? 'ml-0'
                    : collapsed
                    ? 'ml-14' // collapsed sidebar (56px)
                    : 'ml-72' // expanded sidebar (280px)
                }
              `}
            >
              <div className="content-container max-w-full">{children}</div>
            </main>
          </div>
        </ProtectedRoute>
      )}
    </AuthProvider>
  );
}
