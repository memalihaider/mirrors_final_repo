

// 'use client';

// import React, { createContext, useContext, useEffect, useState } from 'react';
// import { User } from 'firebase/auth';
// import { onAuthStateChange, getUserRole, setUserRole as createUserRole, UserRole } from '@/lib/auth';
// import { auth, initializeFirebase } from '@/lib/firebase';

// interface AuthContextType {
//   user: User | null;
//   userRole: UserRole | null;
//   loading: boolean;
//   isAdmin: boolean;
//   error: string | null;
// }

// const AuthContext = createContext<AuthContextType>({
//   user: null,
//   userRole: null,
//   loading: true,
//   isAdmin: false,
//   error: null,
// });

// export const useAuth = () => {
//   const context = useContext(AuthContext);
//   if (!context) {
//     throw new Error('useAuth must be used within an AuthProvider');
//   }
//   return context;
// };

// export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
//   const [user, setUser] = useState<User | null>(null);
//   const [userRole, setUserRole] = useState<UserRole | null>(null);
//   const [loading, setLoading] = useState(false); // Start with false to prevent infinite loading
//   const [error, setError] = useState<string | null>(null);

//   console.log('🔐 AuthProvider: State - loading:', loading, 'user:', user?.email || 'null', 'userRole:', userRole?.role || 'null', 'error:', error);

//   // Simple authentication setup that works around hydration issues
//   useEffect(() => {
//     console.log('🔐 AuthProvider: useEffect started');
    
//     // If we're on server side, just return
//     if (typeof window === 'undefined') {
//       console.log('🔐 AuthProvider: Server side detected, skipping auth setup');
//       return;
//     }
    
//     console.log('🔐 AuthProvider: Client side detected, setting up auth');
    
//     let isMounted = true;
//     let unsubscribe: (() => void) | undefined;
    
//     // Use a timeout to ensure this runs after hydration
//     const timeoutId = setTimeout(async () => {
//       if (!isMounted) return;
      
//       try {
//         console.log('🔐 AuthProvider: Initializing Firebase');
//         setLoading(true);
//         await initializeFirebase();
        
//         if (!isMounted) return;
        
//         console.log('🔐 AuthProvider: Setting up auth listener');
//         unsubscribe = onAuthStateChange(async (user) => {
//           if (!isMounted) return;
          
//           console.log('🔐 AuthProvider: Auth state changed, user:', user ? user.email : 'null');
//           setUser(user);
//           setError(null);

//           if (user) {
//             try {
//               console.log('🔐 AuthProvider: Getting user role for:', user.email);
//               let role = await getUserRole(user.uid);
              
//               // Create user role if it doesn't exist
//               if (!role && user.email) {
//                 const defaultRole = user.email === 'ahmadxeikh786@gmail.com' ? 'admin' : 'user';
//                 console.log('🔐 AuthProvider: Creating role:', defaultRole);
//                 await createUserRole(user.uid, user.email, defaultRole, user.displayName || undefined);
//                 role = await getUserRole(user.uid);
//               }

//               // Ensure admin role for specific email
//               if (user.email === 'ahmadxeikh786@gmail.com' && (!role || role.role !== 'admin')) {
//                 console.log('🔐 AuthProvider: Ensuring admin role');
//                 await createUserRole(user.uid, user.email, 'admin', user.displayName || undefined);
//                 role = await getUserRole(user.uid);
//               }

//               if (isMounted) {
//                 setUserRole(role);
//                 console.log('🔐 AuthProvider: Set user role:', role?.role);
//               }
//             } catch (error) {
//               console.error('🔐 AuthProvider: Error getting user role:', error);
//               if (isMounted) {
//                 setError('Failed to load user role');
//               }
//             }
//           } else {
//             if (isMounted) {
//               setUserRole(null);
//               console.log('🔐 AuthProvider: Cleared user role');
//             }
//           }

//           if (isMounted) {
//             setLoading(false);
//             console.log('🔐 AuthProvider: Loading complete, user:', user ? 'authenticated' : 'not authenticated');
//           }
//         });

//       } catch (error) {
//         console.error('🔐 AuthProvider: Firebase initialization error:', error);
//         if (isMounted) {
//           setError('Failed to initialize authentication');
//           setLoading(false);
//         }
//       }
//     }, 1000); // Longer delay to ensure hydration is complete
    
//     return () => {
//       isMounted = false;
//       clearTimeout(timeoutId);
//       if (unsubscribe) {
//         console.log('🔐 AuthProvider: Cleaning up auth listener');
//         unsubscribe();
//       }
//     };
//   }, []);

//   const isAdmin = userRole?.role === 'admin';

//   return (
//     <AuthContext.Provider value={{ user, userRole, loading, isAdmin, error }}>
//       {children}
//     </AuthContext.Provider>
//   );
// };

// code no 2
// 'use client';

// import React, { createContext, useContext, useEffect, useState } from 'react';
// import { User } from 'firebase/auth';
// import {
//   onAuthStateChange,
//   getUserRole,
//   setUserRole as createUserRole,
//   UserRole
// } from '@/lib/auth';
// import { auth, initializeFirebase } from '@/lib/firebase';

// interface AuthContextType {
//   user: User | null;
//   userRole: UserRole | null;
//   loading: boolean;
//   isAdmin: boolean;
//   error: string | null;
//   hasPageAccess: (page: string) => boolean;
// }

// const AuthContext = createContext<AuthContextType>({
//   user: null,
//   userRole: null,
//   loading: true,
//   isAdmin: false,
//   error: null,
//   hasPageAccess: () => false,
// });

// export const useAuth = () => {
//   const context = useContext(AuthContext);
//   if (!context) {
//     throw new Error('useAuth must be used within an AuthProvider');
//   }
//   return context;
// };

// export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
//   const [user, setUser] = useState<User | null>(null);
//   const [userRole, setUserRole] = useState<UserRole & { accessPages?: string[] } | null>(null);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState<string | null>(null);

//   console.log(
//     '🔐 AuthProvider: State - loading:',
//     loading,
//     'user:',
//     user?.email || 'null',
//     'userRole:',
//     userRole?.role || 'null',
//     'error:',
//     error
//   );

//   useEffect(() => {
//     if (typeof window === 'undefined') return;

//     let isMounted = true;
//     let unsubscribe: (() => void) | undefined;

//     const timeoutId = setTimeout(async () => {
//       if (!isMounted) return;

//       try {
//         setLoading(true);
//         await initializeFirebase();

//         if (!isMounted) return;

//         unsubscribe = onAuthStateChange(async (firebaseUser) => {
//           if (!isMounted) return;

//           setUser(firebaseUser);
//           setError(null);

//           if (firebaseUser) {
//             try {
//               let role = await getUserRole(firebaseUser.uid);

//               // Create role if not exist
//               if (!role && firebaseUser.email) {
//                 const defaultRole = firebaseUser.email === 'ahmadxeikh786@gmail.com' ? 'admin' : 'user';
//                 await createUserRole(
//                   firebaseUser.uid,
//                   firebaseUser.email,
//                   defaultRole,
//                   firebaseUser.displayName || undefined
//                 );
//                 role = await getUserRole(firebaseUser.uid);
//               }

//               // Ensure admin role for specific email
//               if (firebaseUser.email === 'ahmadxeikh786@gmail.com' && (!role || role.role !== 'admin')) {
//                 await createUserRole(
//                   firebaseUser.uid,
//                   firebaseUser.email,
//                   'admin',
//                   firebaseUser.displayName || undefined
//                 );
//                 role = await getUserRole(firebaseUser.uid);
//               }

//               if (isMounted) {
//                 setUserRole(role);
//               }
//             } catch (error) {
//               console.error('🔐 AuthProvider: Error getting user role:', error);
//               if (isMounted) setError('Failed to load user role');
//             }
//           } else {
//             if (isMounted) setUserRole(null);
//           }

//           if (isMounted) setLoading(false);
//         });
//       } catch (error) {
//         console.error('🔐 AuthProvider: Firebase initialization error:', error);
//         if (isMounted) {
//           setError('Failed to initialize authentication');
//           setLoading(false);
//         }
//       }
//     }, 1000);

//     return () => {
//       isMounted = false;
//       clearTimeout(timeoutId);
//       if (unsubscribe) unsubscribe();
//     };
//   }, []);

//   const isAdmin = userRole?.role === 'admin';

//   // Check if user has access to a specific page
//   const hasPageAccess = (page: string) => {
//     if (isAdmin) return true; // Admin can access all pages
//     if (!userRole?.accessPages || userRole.accessPages.length === 0) return false;
//     return userRole.accessPages.includes(page);
//   };

//   return (
//     <AuthContext.Provider value={{ user, userRole, loading, isAdmin, error, hasPageAccess }}>
//       {children}
//     </AuthContext.Provider>
//   );
// };

// code no 3
// 'use client';

// import React, { createContext, useContext, useEffect, useState } from 'react';
// import { User } from 'firebase/auth';
// import { onAuthStateChange, getUserRole, setUserRole as createUserRole, UserRole } from '@/lib/auth';
// import { auth, initializeFirebase } from '@/lib/firebase';

// interface AuthContextType {
//   user: User | null;
//   userRole: UserRole | null;
//   loading: boolean;
//   isAdmin: boolean;
//   error: string | null;
//   accessiblePages: string[];
//   canAccessPage: (page: string) => boolean;
// }

// const AuthContext = createContext<AuthContextType>({
//   user: null,
//   userRole: null,
//   loading: true,
//   isAdmin: false,
//   error: null,
//   accessiblePages: [],
//   canAccessPage: () => false,
// });

// export const useAuth = () => useContext(AuthContext);

// export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
//   const [user, setUser] = useState<User | null>(null);
//   const [userRole, setUserRole] = useState<UserRole | null>(null);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState<string | null>(null);
//   const [accessiblePages, setAccessiblePages] = useState<string[]>([]);

//   const canAccessPage = (page: string) => {
//     if (!userRole) return false;
//     if (userRole.role === 'admin') return true;
//     return accessiblePages.includes(page);
//   };

//   useEffect(() => {
//     if (typeof window === 'undefined') return;
//     let isMounted = true;
//     let unsubscribe: (() => void) | undefined;

//     const timeoutId = setTimeout(async () => {
//       if (!isMounted) return;
//       try {
//         setLoading(true);
//         await initializeFirebase();

//         unsubscribe = onAuthStateChange(async (user) => {
//           if (!isMounted) return;
//           setUser(user);
//           setError(null);

//           if (user) {
//             try {
//               let role = await getUserRole(user.uid);

//               // Create default role if not exist
//               if (!role && user.email) {
//                 const defaultRole = user.email === 'ahmadxeikh786@gmail.com' ? 'admin' : 'user';
//                 await createUserRole(user.uid, user.email, defaultRole, user.displayName || undefined, []);
//                 role = await getUserRole(user.uid);
//               }

//               // Ensure admin email
//               if (user.email === 'ahmadxeikh786@gmail.com' && (!role || role.role !== 'admin')) {
//                 await createUserRole(user.uid, user.email, 'admin', user.displayName || undefined, []);
//                 role = await getUserRole(user.uid);
//               }

//               if (isMounted) {
//                 setUserRole(role);
//                 setAccessiblePages(role?.accessPages || []);
//               }
//             } catch (error) {
//               console.error('Error getting user role:', error);
//               if (isMounted) setError('Failed to load user role');
//             }
//           } else {
//             if (isMounted) {
//               setUserRole(null);
//               setAccessiblePages([]);
//             }
//           }

//           if (isMounted) setLoading(false);
//         });
//       } catch (error) {
//         console.error('Firebase initialization error:', error);
//         if (isMounted) {
//           setError('Failed to initialize authentication');
//           setLoading(false);
//         }
//       }
//     }, 1000);

//     return () => {
//       isMounted = false;
//       clearTimeout(timeoutId);
//       if (unsubscribe) unsubscribe();
//     };
//   }, []);

//   const isAdmin = userRole?.role === 'admin';

//   return (
//     <AuthContext.Provider value={{ user, userRole, loading, isAdmin, error, accessiblePages, canAccessPage }}>
//       {children}
//     </AuthContext.Provider>
//   );
// };


// new code
'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from 'firebase/auth';
import { onAuthStateChange, getUserRole, setUserRole as createUserRole, UserRole } from '@/lib/auth';
import { auth, initializeFirebase } from '@/lib/firebase';

interface AuthContextType {
  user: User | null;
  userRole: UserRole | null;
  loading: boolean;
  isAdmin: boolean;
  error: string | null;
  accessiblePages: string[];
  canAccessPage: (page: string) => boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userRole: null,
  loading: true,
  isAdmin: false,
  error: null,
  accessiblePages: [],
  canAccessPage: () => false,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true); // ✅ Start with true
  const [error, setError] = useState<string | null>(null);
  const [accessiblePages, setAccessiblePages] = useState<string[]>([]);

  const canAccessPage = (page: string) => {
    if (!userRole) return false;
    if (userRole.role === 'admin') return true; // ✅ Admin bypass
    return accessiblePages.includes(page);
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;
    let isMounted = true;
    let unsubscribe: (() => void) | undefined;

    const init = async () => {
      try {
        setLoading(true);
        await initializeFirebase();

        unsubscribe = onAuthStateChange(async (user) => {
          if (!isMounted) return;
          setUser(user);
          setError(null);

          if (user) {
            try {
              let role = await getUserRole(user.uid);

              // ✅ If no role exists, create one
              if (!role && user.email) {
                const defaultRole = user.email === 'ahmadxeikh786@gmail.com' ? 'admin' : 'user';
                await createUserRole(
                  user.uid,
                  user.email,
                  defaultRole,
                  user.displayName || undefined,
                  []
                );
                role = await getUserRole(user.uid);
              }

              // ✅ Ensure admin stays admin
              if (role?.role !== 'admin' && user.email === 'ahmadxeikh786@gmail.com') {
                await createUserRole(
                  user.uid,
                  user.email,
                  'admin',
                  user.displayName || undefined,
                  []
                );
                role = await getUserRole(user.uid);
              }

              if (isMounted) {
                setUserRole(role);
                setAccessiblePages(role?.accessPages || []);
              }
            } catch (error) {
              console.error('Error getting user role:', error);
              if (isMounted) setError('Failed to load user role');
            }
          } else {
            if (isMounted) {
              setUserRole(null);
              setAccessiblePages([]);
            }
          }

          if (isMounted) setLoading(false);
        });
      } catch (error) {
        console.error('Firebase initialization error:', error);
        if (isMounted) {
          setError('Failed to initialize authentication');
          setLoading(false);
        }
      }
    };

    init();

    return () => {
      isMounted = false;
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const isAdmin = userRole?.role === 'admin';

  return (
    <AuthContext.Provider
      value={{ user, userRole, loading, isAdmin, error, accessiblePages, canAccessPage }}
    >
      {children}
    </AuthContext.Provider>
  );
};
