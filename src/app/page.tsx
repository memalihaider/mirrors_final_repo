// 'use client';

// import { useState, useEffect } from 'react';
// import Link from 'next/link';

// import { 
//   Category,
//   Service,
//   Branch,
//   Offer,
//   subscribeToCategoriesChanges,
//   subscribeToServicesChanges,
//   subscribeToBranchesChanges,
//   subscribeToOffersChanges
// } from '@/lib/firebaseServicesNoStorage';

// export default function Dashboard() {
//   const [categories, setCategories] = useState<Category[]>([]);
//   const [services, setServices] = useState<Service[]>([]);
//   const [branches, setBranches] = useState<Branch[]>([]);
//   const [offers, setOffers] = useState<Offer[]>([]);
//   const [loading, setLoading] = useState(true);

//   // Subscribe to real-time updates
//   useEffect(() => {
//     console.log('📊 Dashboard: Starting Firebase subscriptions');
//     let loadedCount = 0;
//     const totalCollections = 4;

//     const checkAllLoaded = () => {
//       loadedCount++;
//       console.log(`📊 Dashboard: Collection loaded (${loadedCount}/${totalCollections})`);
//       if (loadedCount === totalCollections) {
//         console.log('📊 Dashboard: All collections loaded, setting loading to false');
//         setLoading(false);
//       }
//     };

//     const unsubscribeCategories = subscribeToCategoriesChanges(
//       (updatedCategories) => {
//         console.log('📊 Dashboard: Categories data received:', updatedCategories.length, 'items');
//         setCategories(updatedCategories);
//         checkAllLoaded();
//       },
//       (error) => {
//         console.error('📊 Dashboard: Categories error:', error);
//         checkAllLoaded();
//       }
//     );

//     const unsubscribeServices = subscribeToServicesChanges(
//       (updatedServices) => {
//         console.log('📊 Dashboard: Services data received:', updatedServices.length, 'items');
//         setServices(updatedServices);
//         checkAllLoaded();
//       },
//       (error) => {
//         console.error('📊 Dashboard: Services error:', error);
//         checkAllLoaded();
//       }
//     );

//     const unsubscribeBranches = subscribeToBranchesChanges(
//       (updatedBranches) => {
//         console.log('📊 Dashboard: Branches data received:', updatedBranches.length, 'items');
//         setBranches(updatedBranches);
//         checkAllLoaded();
//       },
//       (error) => {
//         console.error('📊 Dashboard: Branches error:', error);
//         checkAllLoaded();
//       }
//     );

//     const unsubscribeOffers = subscribeToOffersChanges(
//       (updatedOffers) => {
//         console.log('📊 Dashboard: Offers data received:', updatedOffers.length, 'items');
//         setOffers(updatedOffers);
//         checkAllLoaded();
//       },
//       (error) => {
//         console.error('📊 Dashboard: Offers error:', error);
//         checkAllLoaded();
//       }
//     );

//     return () => {
//       console.log('📊 Dashboard: Cleaning up Firebase subscriptions');
//       unsubscribeCategories();
//       unsubscribeServices();
//       unsubscribeBranches();
//       unsubscribeOffers();
//     };
//   }, []);

//   // Stats calculations
//   const menServices = services.filter(service => service.category.toLowerCase().includes('men'));
//   const womenServices = services.filter(service => service.category.toLowerCase().includes('women'));
//   const activeServices = services.filter(service => service.isActive);
//   const activeOffers = offers.filter(offer => offer.isActive && new Date(offer.validTo) >= new Date());
//   const totalRevenue = services.reduce((sum, service) => sum + (service.price || 0), 0);

//   const stats = [
//     { 
//       name: 'Total Services', 
//       value: services.length.toString(), 
//       change: `${activeServices.length} active`,
//       color: 'pink'
//     },
//     { 
//       name: 'Categories', 
//       value: categories.length.toString(), 
//       change: `${categories.filter(cat => cat.serviceCount > 0).length} with services`,
//       color: 'blue'
//     },
//     { 
//       name: 'Active Offers', 
//       value: activeOffers.length.toString(), 
//       change: `AED ${totalRevenue.toFixed(0)} total value`,
//       color: 'purple'
//     },
//     { 
//       name: 'Services by Gender', 
//       value: `${menServices.length}M / ${womenServices.length}F`, 
//       change: 'Gender split',
//       color: 'green'
//     }
//   ];

//   // Recent activity
//   const recentActivity = [
//     ...services.slice(0, 2).map(service => ({
//       action: 'Service added',
//       item: service.name,
//       time: service.createdAt ? getTimeAgo(service.createdAt.toDate()) : 'Recently',
//       type: 'service'
//     })),
//     ...categories.slice(0, 2).map(category => ({
//       action: 'Category added',
//       item: category.name,
//       time: category.createdAt ? getTimeAgo(category.createdAt.toDate()) : 'Recently',
//       type: 'category'
//     })),
//     ...branches.slice(0, 1).map(branch => ({
//       action: 'Branch added',
//       item: branch.name,
//       time: branch.createdAt ? getTimeAgo(branch.createdAt.toDate()) : 'Recently',
//       type: 'branch'
//     }))
//   ].slice(0, 5);

//   const quickActions = [
//     { name: 'Add Service', href: '/services', icon: '✂' },
//     { name: 'Add Category', href: '/catagories', icon: '📂' },
//     { name: 'Create Offer', href: '/offers', icon: '🏷' },
//   ];

//   // Time ago
//   function getTimeAgo(date: Date): string {
//     const now = new Date();
//     const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
//     if (diffInSeconds < 60) return 'Just now';
//     if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
//     if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
//     return `${Math.floor(diffInSeconds / 86400)}d ago`;
//   }

//   return (
//     <div className="p-6">
//       <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

//       {/* Stats Section */}
//       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
//         {(loading ? Array.from({ length: 4 }) : stats).map((stat, index) => (
//           <div
//             key={index}
//             className={`rounded-xl p-4 shadow-md border bg-white animate-fade-in`}
//             style={{ animationDelay: `${index * 200}ms` }}
//           >
//             {loading ? (
//               <div className="animate-pulse space-y-3">
//                 <div className="h-4 bg-gray-200 rounded w-1/3"></div>
//                 <div className="h-6 bg-gray-300 rounded w-1/2"></div>
//                 <div className="h-3 bg-gray-200 rounded w-1/4"></div>
//               </div>
//             ) : (
//               <>
//                 <p className="text-sm font-medium text-gray-500">{stat.name}</p>
//                 <p className="text-2xl font-bold mt-2">{stat.value}</p>
//                 <p className="text-xs text-gray-400 mt-1">{stat.change}</p>
//               </>
//             )}
//           </div>
//         ))}
//       </div>

//       {/* Quick Actions */}
//       <div className="mb-8">
//         <h2 className="text-lg font-semibold mb-3">Quick Actions</h2>
//         <div className="flex gap-4">
//           {quickActions.map((action, i) => (
//             <Link
//               key={i}
//               href={action.href}
//               className="px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition"
//             >
//               {action.icon} {action.name}
//             </Link>
//           ))}
//         </div>
//       </div>

//       {/* Recent Activity */}
//       <div>
//         <h2 className="text-lg font-semibold mb-3">Recent Activity</h2>
//         <div className="space-y-3">
//           {loading ? (
//             Array.from({ length: 3 }).map((_, idx) => (
//               <div
//                 key={idx}
//                 className="animate-pulse h-12 bg-gray-200 rounded-md"
//                 style={{ animationDelay: `${idx * 150}ms` }}
//               />
//             ))
//           ) : (
//             recentActivity.map((activity, idx) => (
//               <div
//                 key={idx}
//                 className="p-4 bg-white rounded-lg border shadow-sm flex justify-between"
//                 style={{ animationDelay: `${idx * 150}ms` }}
//               >
//                 <span>{activity.action}: <b>{activity.item}</b></span>
//                 <span className="text-sm text-gray-400">{activity.time}</span>
//               </div>
//             ))
//           )}
//         </div>
//       </div>
//     </div>
//   );
// }

// code no 2
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

import { 
  Category,
  Service,
  Branch,
  Offer,
  subscribeToCategoriesChanges,
  subscribeToServicesChanges,
  subscribeToBranchesChanges,
  subscribeToOffersChanges
} from '@/lib/firebaseServicesNoStorage';

export default function Dashboard() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);

  // Subscribe to real-time updates
  useEffect(() => {
    let loadedCount = 0;
    const totalCollections = 4;
    const checkAllLoaded = () => {
      loadedCount++;
      if (loadedCount === totalCollections) setLoading(false);
    };

    const unsubscribeCategories = subscribeToCategoriesChanges(
      (updatedCategories) => { setCategories(updatedCategories); checkAllLoaded(); }
    );

    const unsubscribeServices = subscribeToServicesChanges(
      (updatedServices) => { setServices(updatedServices); checkAllLoaded(); }
    );

    const unsubscribeBranches = subscribeToBranchesChanges(
      (updatedBranches) => { setBranches(updatedBranches); checkAllLoaded(); }
    );

    const unsubscribeOffers = subscribeToOffersChanges(
      (updatedOffers) => { setOffers(updatedOffers); checkAllLoaded(); }
    );

    return () => {
      unsubscribeCategories();
      unsubscribeServices();
      unsubscribeBranches();
      unsubscribeOffers();
    };
  }, []);

  // Stats calculations (real-time)
  const menServices = services.filter(service => service.category.toLowerCase().includes('men'));
  const womenServices = services.filter(service => service.category.toLowerCase().includes('women'));
  const activeServices = services.filter(service => service.isActive);
  const activeOffers = offers.filter(offer => offer.isActive && new Date(offer.validTo) >= new Date());
  const totalRevenue = services.reduce((sum, service) => sum + (service.price || 0), 0);

  const stats = [
    { 
      name: 'Total Services', 
      value: services.length.toString(), 
      change: `${activeServices.length} active`, 
      color: 'from-pink-500 to-rose-500',
      icon: '✂️',
      bgIcon: '🎯'
    },
    { 
      name: 'Categories', 
      value: categories.length.toString(), 
      change: `${categories.filter(cat => cat.serviceCount > 0).length} with services`, 
      color: 'from-blue-500 to-cyan-500',
      icon: '📂',
      bgIcon: '📊'
    },
    { 
      name: 'Active Offers', 
      value: offers.length.toString(), 
      change: `AED ${totalRevenue.toFixed(0)} total value`, 
      color: 'from-purple-500 to-indigo-500',
      icon: '🏷️',
      bgIcon: '💎'
    },
    { 
      name: 'Branches', 
      value: branches.length.toString(), 
      change: `${branches.filter(b => b.isActive).length} active locations`, 
      color: 'from-green-500 to-emerald-500',
      icon: '🏢',
      bgIcon: '🌟'
    }
  ];

  // Recent activity
  const recentActivity = [
    ...services.slice(0, 2).map(service => ({ 
      action: 'Service added', 
      item: service.name, 
      time: service.createdAt ? getTimeAgo(service.createdAt.toDate()) : 'Recently', 
      type: 'service',
      icon: '✂️',
      color: 'text-pink-600 bg-pink-50'
    })),
    ...categories.slice(0, 2).map(category => ({ 
      action: 'Category added', 
      item: category.name, 
      time: category.createdAt ? getTimeAgo(category.createdAt.toDate()) : 'Recently', 
      type: 'category',
      icon: '📂',
      color: 'text-blue-600 bg-blue-50'
    })),
    ...branches.slice(0, 1).map(branch => ({ 
      action: 'Branch added', 
      item: branch.name, 
      time: branch.createdAt ? getTimeAgo(branch.createdAt.toDate()) : 'Recently', 
      type: 'branch',
      icon: '🏢',
      color: 'text-green-600 bg-green-50'
    }))
  ].slice(0, 5);

  const quickActions = [
    { 
      name: 'Add Service', 
      href: '/services', 
      icon: '✂️', 
      color: 'from-pink-500 to-rose-500',
      description: 'Create new beauty service'
    },
    { 
      name: 'Add Category', 
      href: '/catagories', 
      icon: '📂', 
      color: 'from-blue-500 to-cyan-500',
      description: 'Organize your services'
    },
    { 
      name: 'Create Offer', 
      href: '/offers', 
      icon: '🏷️', 
      color: 'from-purple-500 to-indigo-500',
      description: 'Special promotions'
    },
  ];

  function getTimeAgo(date: Date): string {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  }

  const getCurrentGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      {/* Enhanced Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative px-6 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2 tracking-tight">
                {getCurrentGreeting()}! 👋
              </h1>
              <p className="text-lg text-white/90 font-medium">
                Welcome to Mirror Beauty Lounge Dashboard
              </p>
              <p className="text-sm text-white/70 mt-1">
                Manage your beauty services, track performance, and grow your business
              </p>
            </div>
            <div className="hidden md:block">
              <div className="text-6xl opacity-20">💄</div>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent"></div>
      </div>

      <div className="p-6 space-y-8">
        {/* Enhanced Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {(loading ? Array.from({ length: 4 }) : stats).map((stat, index) => (
            <div
              key={index}
              className="group relative overflow-hidden rounded-2xl bg-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {loading ? (
                <div className="p-6 animate-pulse space-y-4">
                  <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 rounded-full w-2/3"></div>
                  <div className="h-8 bg-gradient-to-r from-gray-300 to-gray-400 rounded-full w-1/2"></div>
                  <div className="h-3 bg-gradient-to-r from-gray-200 to-gray-300 rounded-full w-3/4"></div>
                </div>
              ) : (
                <>
                  {/* Background Pattern */}
                  <div className="absolute top-0 right-0 -mt-4 -mr-4 text-6xl opacity-5">
                    {stat.bgIcon}
                  </div>
                  
                  {/* Gradient Border */}
                  <div className={`absolute inset-0 bg-gradient-to-r ${stat.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300 rounded-2xl`}></div>
                  
                  <div className="relative p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${stat.color} flex items-center justify-center text-white text-xl shadow-lg`}>
                        {stat.icon}
                      </div>
                      <div className={`px-3 py-1 rounded-full bg-gradient-to-r ${stat.color} text-white text-xs font-semibold opacity-90`}>
                        Live
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                        {stat.name}
                      </p>
                      <p className="text-3xl font-bold text-gray-900 leading-none">
                        {stat.value}
                      </p>
                      <p className="text-sm text-gray-500 font-medium">
                        {stat.change}
                      </p>
                    </div>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>

        {/* Enhanced Quick Actions */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center mb-6">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center text-white mr-3">
              ⚡
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Quick Actions</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {quickActions.map((action, i) => (
              <Link
                key={i}
                href={action.href}
                className="group relative overflow-hidden rounded-xl p-6 bg-gradient-to-br from-white to-gray-50 border border-gray-200 hover:border-transparent hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
              >
                <div className={`absolute inset-0 bg-gradient-to-r ${action.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}></div>
                
                <div className="relative">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${action.color} flex items-center justify-center text-white text-xl mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    {action.icon}
                  </div>
                  
                  <h3 className="font-bold text-gray-900 mb-2 group-hover:text-gray-800">
                    {action.name}
                  </h3>
                  
                  <p className="text-sm text-gray-600 group-hover:text-gray-700">
                    {action.description}
                  </p>
                  
                  <div className="mt-4 flex items-center text-sm font-semibold text-gray-400 group-hover:text-gray-600">
                    Get started
                    <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Enhanced Recent Activity */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center text-white mr-3">
                📈
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Recent Activity</h2>
            </div>
            <div className="text-sm text-gray-500 font-medium">
              Last 24 hours
            </div>
          </div>
          
          <div className="space-y-3">
            {loading ? (
              Array.from({ length: 3 }).map((_, idx) => (
                <div
                  key={idx}
                  className="animate-pulse rounded-xl p-4 bg-gradient-to-r from-gray-100 to-gray-200"
                  style={{ animationDelay: `${idx * 150}ms` }}
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-gray-300 rounded-lg"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-300 rounded w-1/2"></div>
                    </div>
                  </div>
                </div>
              ))
            ) : recentActivity.length > 0 ? (
              recentActivity.map((activity, idx) => (
                <div
                  key={idx}
                  className="group rounded-xl p-4 bg-gradient-to-r from-gray-50 to-white border border-gray-100 hover:border-gray-200 hover:shadow-md transition-all duration-300"
                  style={{ animationDelay: `${idx * 100}ms` }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className={`w-10 h-10 rounded-lg ${activity.color} flex items-center justify-center text-lg font-semibold`}>
                        {activity.icon}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">
                          {activity.action}: <span className="text-gray-700">{activity.item}</span>
                        </div>
                        <div className="text-sm text-gray-500 mt-1">
                          {activity.time}
                        </div>
                      </div>
                    </div>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <div className="text-6xl mb-4 opacity-20">📊</div>
                <p className="text-gray-500 font-medium">No recent activity</p>
                <p className="text-sm text-gray-400 mt-1">Activity will appear here as you use the system</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
