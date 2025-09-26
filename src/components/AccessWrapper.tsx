// 'use client';

// import { ReactNode, useEffect, useState } from 'react';
// import { useAuth } from '@/contexts/AuthContext';
// import { usePathname, useRouter } from 'next/navigation';

// interface AccessWrapperProps {
//   children: ReactNode;
// }

// export default function AccessWrapper({ children }: AccessWrapperProps) {
//   const { userRole, loading } = useAuth();
//   const pathname = usePathname();
//   const router = useRouter();
//   const [allowed, setAllowed] = useState(false);

//   useEffect(() => {
//     if (!loading && userRole) {
//       const currentPage = pathname.split('/')[1] || 'dashboard';
//       const accessPages = userRole.accessPages || [];

//       // Admin gets full access
//       if (userRole.role === 'admin' || accessPages.includes(currentPage)) {
//         setAllowed(true);
//       } else {
//         setAllowed(false);
//         router.replace('/access-denied'); // redirect to a page that shows "Access Denied"
//       }
//     }
//   }, [loading, userRole, pathname, router]);

//   if (loading || !userRole) {
//     return (
//       <div className="flex justify-center items-center h-screen">
//         <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600"></div>
//         <span className="ml-3 text-pink-600">Checking access...</span>
//       </div>
//     );
//   }

//   if (!allowed) {
//     return null; // Or a fallback UI
//   }

//   return <>{children}</>;
// }

// // new code
// // 'use client';

// // import { ReactNode, useEffect, useState } from 'react';
// // import { useAuth } from '@/contexts/AuthContext';
// // import { usePathname, useRouter } from 'next/navigation';

// // interface AccessWrapperProps {
// //   children: ReactNode;
// // }

// // export default function AccessWrapper({ children }: AccessWrapperProps) {
// //   const { userRole, loading } = useAuth();
// //   const pathname = usePathname();
// //   const router = useRouter();
// //   const [allowed, setAllowed] = useState(false);

// //   useEffect(() => {
// //     if (!loading && userRole) {
// //       const currentPage = pathname.split('/')[1] || 'dashboard';
// //       const accessPages = userRole.accessPages || [];

// //       // ✅ Admin has full access
// //       if (userRole.role === 'admin' || accessPages.includes(currentPage)) {
// //         setAllowed(true);
// //       } else {
// //         setAllowed(false);
// //         router.replace('/access-denied'); // redirect if not allowed
// //       }
// //     }
// //   }, [loading, userRole, pathname, router]);

// //   if (loading || !userRole) {
// //     return (
// //       <div className="flex justify-center items-center h-screen">
// //         <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600"></div>
// //         <span className="ml-3 text-pink-600">Checking access...</span>
// //       </div>
// //     );
// //   }

// //   if (!allowed) {
// //     return null;
// //   }

// //   return <>{children}</>;
// // }


// new code
// 'use client';

// import { ReactNode, useEffect, useState } from 'react';
// import { useAuth } from '@/contexts/AuthContext';
// import { usePathname, useRouter } from 'next/navigation';

// interface AccessWrapperProps {
//   children: ReactNode;
// }

// export default function AccessWrapper({ children }: AccessWrapperProps) {
//   const { userRole, loading } = useAuth();
//   const pathname = usePathname();
//   const router = useRouter();
//   const [allowed, setAllowed] = useState(false);

//   useEffect(() => {
//     if (!loading && userRole) {
//       const currentPage = pathname.split('/')[1] || 'dashboard';
//       const accessPages = userRole.accessPages || [];

//       if (userRole.role === 'admin') {
//         // ✅ Admin ko hamesha full access
//         setAllowed(true);
//       } else if (accessPages.includes(currentPage)) {
//         // ✅ Normal user sirf allowed pages access kare
//         setAllowed(true);
//       } else {
//         setAllowed(false);
//         router.replace('/access-denied');
//       }
//     }
//   }, [loading, userRole, pathname, router]);

//   if (loading || !userRole) {
//     return (
//       <div className="flex justify-center items-center h-screen">
//         <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600"></div>
//         <span className="ml-3 text-pink-600">Checking access...</span>
//       </div>
//     );
//   }

//   if (!allowed) {
//     return null;
//   }

//   return <>{children}</>;
// }

// correct code
'use client';

import { ReactNode, useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { usePathname, useRouter } from 'next/navigation';

interface AccessWrapperProps {
  children: ReactNode;
}

export default function AccessWrapper({ children }: AccessWrapperProps) {
  const { userRole, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    if (!loading && userRole) {
      // page ka naam nikal lo
      const currentPage = pathname.split('/')[1] || 'dashboard';
      const accessPages = userRole.accessPages || [];

      // ✅ Admin = full access
      if (userRole.role === 'admin') {
        setAllowed(true);
      } else {
        // ✅ Normal user = sirf selected pages ka access
        if (accessPages.includes(currentPage)) {
          setAllowed(true);
        } else {
          setAllowed(false);
          router.replace('/access-denied'); // block aur redirect
        }
      }
    }
  }, [loading, userRole, pathname, router]);

  if (loading || !userRole) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600"></div>
        <span className="ml-3 text-pink-600">Checking access...</span>
      </div>
    );
  }

  if (!allowed) {
    return null; // jab tak redirect hota hai tab blank
  }

  return <>{children}</>;
}
