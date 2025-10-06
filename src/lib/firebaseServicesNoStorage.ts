

//category and services work offers do not
// import { 
//   collection, 
//   addDoc, 
//   updateDoc, 
//   deleteDoc, 
//   doc, 
//   getDocs, 
//   onSnapshot,
//   query,
//   orderBy,
//   Timestamp ,
//   CollectionReference
// } from 'firebase/firestore';
// import { db, isFirebaseConfigured } from './firebase';

// // Category interface - using base64 images instead of Storage URLs
// export interface Category {
//   id?: string;
//   name: string;
//   description: string;
//   serviceCount: number;
//   color: string;
//   imageBase64?: string; // Store image as base64 string
//   gender: 'men' | 'women' | 'unisex';
//   createdAt?: Timestamp;
//   updatedAt?: Timestamp;
// }

// // Categories collection reference - will be initialized when Firebase is configured
// let categoriesCollection: CollectionReference | null = null;
// if (isFirebaseConfigured() && db) {
//   categoriesCollection = collection(db, 'categories');
// }

// // Convert file to base64 string
// export const convertFileToBase64 = (file: File): Promise<string> => {
//   return new Promise((resolve, reject) => {
//     const reader = new FileReader();
//     reader.onload = () => {
//       if (reader.result) {
//         resolve(reader.result as string);
//       } else {
//         reject(new Error('Failed to convert file to base64'));
//       }
//     };
//     reader.onerror = () => reject(new Error('Error reading file'));
//     reader.readAsDataURL(file);
//   });
// };

// // Compress image to reduce size (optional - for better performance)
// export const compressImage = (file: File, maxWidth: number = 800, quality: number = 0.8): Promise<string> => {
//   return new Promise((resolve, reject) => {
//     const canvas = document.createElement('canvas');
//     const ctx = canvas.getContext('2d');
//     const img = new Image();
    
//     img.onload = () => {
//       // Calculate new dimensions
//       const ratio = Math.min(maxWidth / img.width, maxWidth / img.height);
//       canvas.width = img.width * ratio;
//       canvas.height = img.height * ratio;
      
//       // Draw and compress
//       ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
//       const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
//       resolve(compressedBase64);
//     };
    
//     img.onerror = () => reject(new Error('Error loading image'));
//     img.src = URL.createObjectURL(file);
//   });
// };

// // Add new category
// export const addCategory = async (categoryData: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
//   try {
//     if (!isFirebaseConfigured() || !db || !categoriesCollection) {
//       throw new Error('Firebase is not configured. Please set up your Firebase environment variables.');
//     }

//     const docRef = await addDoc(categoriesCollection, {
//       ...categoryData,
//       createdAt: Timestamp.now(),
//       updatedAt: Timestamp.now()
//     });
//     return docRef.id;
//   } catch (error) {
//     console.error('Error adding category:', error);
//     throw error;
//   }
// };

// // Update category
// export const updateCategory = async (categoryId: string, categoryData: Partial<Category>): Promise<void> => {
//   try {
//     if (!isFirebaseConfigured() || !db) {
//       throw new Error('Firebase is not configured. Please set up your Firebase environment variables.');
//     }

//     const categoryRef = doc(db, 'categories', categoryId);
//     await updateDoc(categoryRef, {
//       ...categoryData,
//       updatedAt: Timestamp.now()
//     });
//   } catch (error) {
//     console.error('Error updating category:', error);
//     throw error;
//   }
// };

// // Delete category
// export const deleteCategory = async (categoryId: string): Promise<void> => {
//   try {
//     if (!isFirebaseConfigured() || !db) {
//       throw new Error('Firebase is not configured. Please set up your Firebase environment variables.');
//     }

//     const categoryRef = doc(db, 'categories', categoryId);
//     await deleteDoc(categoryRef);
//   } catch (error) {
//     console.error('Error deleting category:', error);
//     throw error;
//   }
// };

// // Get all categories
// export const getCategories = async (): Promise<Category[]> => {
//   try {
//     if (!isFirebaseConfigured() || !db || !categoriesCollection) {
//       console.warn('Firebase is not configured, returning empty categories list');
//       return [];
//     }

//     const q = query(categoriesCollection, orderBy('createdAt', 'desc'));
//     const querySnapshot = await getDocs(q);
//     const categories: Category[] = [];
    
//     querySnapshot.forEach((doc) => {
//       categories.push({
//         id: doc.id,
//         ...doc.data()
//       } as Category);
//     });
    
//     return categories;
//   } catch (error) {
//     console.error('Error getting categories:', error);
//     throw error;
//   }
// };

// // Listen to categories changes (real-time)
// export const subscribeToCategoriesChanges = (
//   callback: (categories: Category[]) => void,
//   errorCallback?: (error: Error) => void
// ) => {
//   if (!isFirebaseConfigured() || !db || !categoriesCollection) {
//     console.warn('Firebase is not configured, skipping categories subscription');
//     return () => {}; // Return empty unsubscribe function
//   }

//   const q = query(categoriesCollection, orderBy('createdAt', 'desc'));
  
//   return onSnapshot(q, (querySnapshot) => {
//     const categories: Category[] = [];
//     querySnapshot.forEach((doc) => {
//       categories.push({
//         id: doc.id,
//         ...doc.data()
//       } as Category);
//     });
//     callback(categories);
//   }, (error) => {
//     console.error('Error listening to categories:', error);
//     if (errorCallback) {
//       errorCallback(error);
//     }
//   });
// };

// // ==================== SERVICES FUNCTIONS ====================

// // Service interface
// export interface Service {
//   id?: string;
//   name: string;
//   category: string;
//   duration: number;
//   price: number;
//   description: string;
//   isActive: boolean;
//   imageBase64?: string;
//   createdAt?: Timestamp;
//   updatedAt?: Timestamp;
// }

// // Services collection reference - will be initialized when Firebase is configured
// let servicesCollection: CollectionReference | null = null;
// if (isFirebaseConfigured() && db) {
//   servicesCollection = collection(db, 'services');
// }

// // Add new service
// export const addService = async (serviceData: Omit<Service, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
//   try {
//     if (!isFirebaseConfigured() || !db || !servicesCollection) {
//       throw new Error('Firebase is not configured. Please set up your Firebase environment variables.');
//     }

//     const docRef = await addDoc(servicesCollection, {
//       ...serviceData,
//       createdAt: Timestamp.now(),
//       updatedAt: Timestamp.now()
//     });
//     return docRef.id;
//   } catch (error) {
//     console.error('Error adding service:', error);
//     throw error;
//   }
// };

// // Update service
// export const updateService = async (serviceId: string, serviceData: Partial<Service>): Promise<void> => {
//   try {
//     if (!isFirebaseConfigured() || !db) {
//       throw new Error('Firebase is not configured. Please set up your Firebase environment variables.');
//     }

//     const serviceRef = doc(db, 'services', serviceId);
//     await updateDoc(serviceRef, {
//       ...serviceData,
//       updatedAt: Timestamp.now()
//     });
//   } catch (error) {
//     console.error('Error updating service:', error);
//     throw error;
//   }
// };

// // Delete service
// export const deleteService = async (serviceId: string): Promise<void> => {
//   try {
//     if (!isFirebaseConfigured() || !db) {
//       throw new Error('Firebase is not configured. Please set up your Firebase environment variables.');
//     }

//     const serviceRef = doc(db, 'services', serviceId);
//     await deleteDoc(serviceRef);
//   } catch (error) {
//     console.error('Error deleting service:', error);
//     throw error;
//   }
// };

// // Get all services
// export const getServices = async (): Promise<Service[]> => {
//   try {
//     if (!isFirebaseConfigured() || !db || !servicesCollection) {
//       console.warn('Firebase is not configured, returning empty services list');
//       return [];
//     }

//     const q = query(servicesCollection, orderBy('createdAt', 'desc'));
//     const querySnapshot = await getDocs(q);
//     const services: Service[] = [];
    
//     querySnapshot.forEach((doc) => {
//       services.push({
//         id: doc.id,
//         ...doc.data()
//       } as Service);
//     });
    
//     return services;
//   } catch (error) {
//     console.error('Error getting services:', error);
//     throw error;
//   }
// };

// // Listen to services changes (real-time)
// export const subscribeToServicesChanges = (
//   callback: (services: Service[]) => void,
//   errorCallback?: (error: Error) => void
// ) => {
//   if (!isFirebaseConfigured() || !db || !servicesCollection) {
//     console.warn('Firebase is not configured, skipping services subscription');
//     return () => {}; // Return empty unsubscribe function
//   }

//   const q = query(servicesCollection, orderBy('createdAt', 'desc'));
  
//   return onSnapshot(q, (querySnapshot) => {
//     const services: Service[] = [];
//     querySnapshot.forEach((doc) => {
//       services.push({
//         id: doc.id,
//         ...doc.data()
//       } as Service);
//     });
//     callback(services);
//   }, (error) => {
//     console.error('Error listening to services:', error);
//     if (errorCallback) {
//       errorCallback(error);
//     }
//   });
// };

// // ==================== BRANCHES FUNCTIONS ====================

// // Branch interface
// export interface Branch {
//   id?: string;
//   name: string;
//   address: string;
//   phone: string;
//   email: string;
//   manager: string;
//   openingHours: string;
//   isActive: boolean;
//   imageBase64?: string;
//   city: string;
//   country: string;
//   createdAt?: Timestamp;
//   updatedAt?: Timestamp;
// }

// // Branches collection reference - will be initialized when Firebase is configured
// let branchesCollection: CollectionReference | null = null;
// if (isFirebaseConfigured() && db) {
//   branchesCollection = collection(db, 'branches');
// }

// // Add new branch
// export const addBranch = async (branchData: Omit<Branch, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
//   try {
//     if (!isFirebaseConfigured() || !db || !branchesCollection) {
//       throw new Error('Firebase is not configured. Please set up your Firebase environment variables.');
//     }

//     const docRef = await addDoc(branchesCollection, {
//       ...branchData,
//       createdAt: Timestamp.now(),
//       updatedAt: Timestamp.now()
//     });
//     return docRef.id;
//   } catch (error) {
//     console.error('Error adding branch:', error);
//     throw error;
//   }
// };

// // Update branch
// export const updateBranch = async (branchId: string, branchData: Partial<Branch>): Promise<void> => {
//   try {
//     if (!isFirebaseConfigured() || !db) {
//       throw new Error('Firebase is not configured. Please set up your Firebase environment variables.');
//     }

//     const branchRef = doc(db, 'branches', branchId);
//     await updateDoc(branchRef, {
//       ...branchData,
//       updatedAt: Timestamp.now()
//     });
//   } catch (error) {
//     console.error('Error updating branch:', error);
//     throw error;
//   }
// };

// // Delete branch
// export const deleteBranch = async (branchId: string): Promise<void> => {
//   try {
//     if (!isFirebaseConfigured() || !db) {
//       throw new Error('Firebase is not configured. Please set up your Firebase environment variables.');
//     }

//     const branchRef = doc(db, 'branches', branchId);
//     await deleteDoc(branchRef);
//   } catch (error) {
//     console.error('Error deleting branch:', error);
//     throw error;
//   }
// };

// // Get all branches
// export const getBranches = async (): Promise<Branch[]> => {
//   try {
//     if (!isFirebaseConfigured() || !db || !branchesCollection) {
//       console.warn('Firebase is not configured, returning empty branches list');
//       return [];
//     }

//     const q = query(branchesCollection, orderBy('createdAt', 'desc'));
//     const querySnapshot = await getDocs(q);
//     const branches: Branch[] = [];
    
//     querySnapshot.forEach((doc) => {
//       branches.push({
//         id: doc.id,
//         ...doc.data()
//       } as Branch);
//     });
    
//     return branches;
//   } catch (error) {
//     console.error('Error getting branches:', error);
//     throw error;
//   }
// };

// // Listen to branches changes (real-time)
// export const subscribeToBranchesChanges = (
//   callback: (branches: Branch[]) => void,
//   errorCallback?: (error: Error) => void
// ) => {
//   if (!isFirebaseConfigured() || !db || !branchesCollection) {
//     console.warn('Firebase is not configured, skipping branches subscription');
//     return () => {}; // Return empty unsubscribe function
//   }

//   const q = query(branchesCollection, orderBy('createdAt', 'desc'));
  
//   return onSnapshot(q, (querySnapshot) => {
//     const branches: Branch[] = [];
//     querySnapshot.forEach((doc) => {
//       branches.push({
//         id: doc.id,
//         ...doc.data()
//       } as Branch);
//     });
//     callback(branches);
//   }, (error) => {
//     console.error('Error listening to branches:', error);
//     if (errorCallback) {
//       errorCallback(error);
//     }
//   });
// };

// // ==================== OFFERS FUNCTIONS ====================

// // Offer interface
// export interface Offer {
//   id?: string;
//   title: string;
//   description: string;
//   discountType: 'percentage' | 'fixed';
//   discountValue: number;
//   validFrom: string;
//   validTo: string;
//   isActive: boolean;
//   usageLimit?: number;
//   usedCount: number;
//   imageBase64?: string;
//   selectedBranches: string[]; // Array of branch IDs
//   selectedServices: string[]; // Array of service IDs
//   createdAt?: Timestamp;
//   updatedAt?: Timestamp;
// }

// // Offers collection reference - will be initialized when Firebase is configured
// let offersCollection: CollectionReference | null = null;
// if (isFirebaseConfigured() && db) {
//   offersCollection = collection(db, 'offers');
// }

// // Add new offer
// export const addOffer = async (offerData: Omit<Offer, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
//   try {
//     if (!isFirebaseConfigured() || !db || !offersCollection) {
//       throw new Error('Firebase is not configured. Please set up your Firebase environment variables.');
//     }

//     const docRef = await addDoc(offersCollection, {
//       ...offerData,
//       createdAt: Timestamp.now(),
//       updatedAt: Timestamp.now()
//     });
//     return docRef.id;
//   } catch (error) {
//     console.error('Error adding offer:', error);
//     throw error;
//   }
// };

// // Update offer
// export const updateOffer = async (offerId: string, offerData: Partial<Offer>): Promise<void> => {
//   try {
//     if (!isFirebaseConfigured() || !db) {
//       throw new Error('Firebase is not configured. Please set up your Firebase environment variables.');
//     }

//     const offerRef = doc(db, 'offers', offerId);
//     await updateDoc(offerRef, {
//       ...offerData,
//       updatedAt: Timestamp.now()
//     });
//   } catch (error) {
//     console.error('Error updating offer:', error);
//     throw error;
//   }
// };

// // Delete offer
// export const deleteOffer = async (offerId: string): Promise<void> => {
//   try {
//     if (!isFirebaseConfigured() || !db) {
//       throw new Error('Firebase is not configured. Please set up your Firebase environment variables.');
//     }

//     const offerRef = doc(db, 'offers', offerId);
//     await deleteDoc(offerRef);
//   } catch (error) {
//     console.error('Error deleting offer:', error);
//     throw error;
//   }
// };

// // Get all offers
// export const getOffers = async (): Promise<Offer[]> => {
//   try {
//     if (!isFirebaseConfigured() || !db || !offersCollection) {
//       console.warn('Firebase is not configured, returning empty offers list');
//       return [];
//     }

//     const q = query(offersCollection, orderBy('createdAt', 'desc'));
//     const querySnapshot = await getDocs(q);
//     const offers: Offer[] = [];
    
//     querySnapshot.forEach((doc) => {
//       offers.push({
//         id: doc.id,
//         ...doc.data()
//       } as Offer);
//     });
    
//     return offers;
//   } catch (error) {
//     console.error('Error getting offers:', error);
//     throw error;
//   }
// };

// // Listen to offers changes (real-time)
// export const subscribeToOffersChanges = (
//   callback: (offers: Offer[]) => void,
//   errorCallback?: (error: Error) => void
// ) => {
//   const q = query(offersCollection, orderBy('createdAt', 'desc'));
  
//   return onSnapshot(q, (querySnapshot) => {
//     const offers: Offer[] = [];
//     querySnapshot.forEach((doc) => {
//       offers.push({
//         id: doc.id,
//         ...doc.data()
//       } as Offer);
//     });
//     callback(offers);
//   }, (error) => {
//     console.error('Error listening to offers:', error);
//     if (errorCallback) {
//       errorCallback(error);
//     }
//   });
// };






//categories and services no but offers work
// import {
//   collection,
//   addDoc,
//   updateDoc,
//   deleteDoc,
//   doc,
//   onSnapshot,
//   query,
//   orderBy,
//   Timestamp,
//   CollectionReference,
// } from "firebase/firestore";
// import { db, isFirebaseConfigured } from "./firebase";

// // Interfaces
// export interface Offer {
//   id?: string;
//   title: string;
//   description: string;
//   price: number;
//   imageUrl?: string;
//   createdAt?: Timestamp;
// }

// export interface Referral {
//   id?: string;
//   name: string;
//   discount: number;
//   createdAt?: Timestamp;
// }

// export interface Category {
//   id?: string;
//   name: string;
//   createdAt?: Timestamp;
// }

// export interface Service {
//   id?: string;
//   name: string;
//   price: number;
//   categoryId: string;
//   createdAt?: Timestamp;
// }

// export interface Branch {
//   id?: string;
//   name: string;
//   location: string;
// }

// // Firestore collections
// let offersCollection: CollectionReference | null = null;
// let referralsCollection: CollectionReference | null = null;
// let categoriesCollection: CollectionReference | null = null;
// let servicesCollection: CollectionReference | null = null;
// let branchesCollection: CollectionReference | null = null;

// if (isFirebaseConfigured() && db) {
//   offersCollection = collection(db, "offers");
//   referralsCollection = collection(db, "referrals");
//   categoriesCollection = collection(db, "categories");
//   servicesCollection = collection(db, "services");
//   branchesCollection = collection(db, "branches");
// }

// // -------------------------
// // Offers
// // -------------------------
// export const addOffer = async (offer: Offer) => {
//   if (!offersCollection) return;
//   await addDoc(offersCollection, { ...offer, createdAt: Timestamp.now() });
// };

// export const updateOffer = async (id: string, offer: Partial<Offer>) => {
//   if (!db) return;
//   const offerRef = doc(db, "offers", id);
//   await updateDoc(offerRef, offer);
// };

// export const deleteOffer = async (id: string) => {
//   if (!db) return;
//   const offerRef = doc(db, "offers", id);
//   await deleteDoc(offerRef);
// };

// export const subscribeToOffersChanges = (callback: (offers: Offer[]) => void) => {
//   if (!offersCollection) return () => {};
//   const q = query(offersCollection, orderBy("createdAt", "desc"));
//   return onSnapshot(q, (snapshot) => {
//     const offers: Offer[] = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as Offer[];
//     callback(offers);
//   });
// };

// // -------------------------
// // Referrals
// // -------------------------
// export const addReferral = async (referral: Referral) => {
//   if (!referralsCollection) return;
//   await addDoc(referralsCollection, { ...referral, createdAt: Timestamp.now() });
// };

// export const updateReferral = async (id: string, referral: Partial<Referral>) => {
//   if (!db) return;
//   const referralRef = doc(db, "referrals", id);
//   await updateDoc(referralRef, referral);
// };

// export const deleteReferral = async (id: string) => {
//   if (!db) return;
//   const referralRef = doc(db, "referrals", id);
//   await deleteDoc(referralRef);
// };

// export const subscribeToReferralsChanges = (callback: (referrals: Referral[]) => void) => {
//   if (!referralsCollection) return () => {};
//   return onSnapshot(referralsCollection, (snapshot) => {
//     const referrals: Referral[] = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as Referral[];
//     callback(referrals);
//   });
// };

// // -------------------------
// // Categories
// // -------------------------
// export const addCategory = async (category: Category) => {
//   if (!categoriesCollection) return null;
//   try {
//     const docRef = await addDoc(categoriesCollection, { ...category, createdAt: Timestamp.now() });
//     return { id: docRef.id, ...category };
//   } catch (error) {
//     console.error("Error adding category:", error);
//     return null;
//   }
// };

// export const updateCategory = async (id: string, category: Partial<Category>) => {
//   if (!db) return;
//   const categoryRef = doc(db, "categories", id);
//   await updateDoc(categoryRef, category);
// };

// export const deleteCategory = async (id: string) => {
//   if (!db) return;
//   const categoryRef = doc(db, "categories", id);
//   await deleteDoc(categoryRef);
// };

// export const subscribeToCategoriesChanges = (callback: (categories: Category[]) => void) => {
//   if (!categoriesCollection) return () => {};
//   return onSnapshot(categoriesCollection, (snapshot) => {
//     const categories: Category[] = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as Category[];
//     callback(categories);
//   });
// };

// // -------------------------
// // Services
// // -------------------------
// //Services (Fixed Add/Edit/Delete)
// // -------------------------
// export const addService = async (service: Service) => {
//   if (!isFirebaseConfigured() || !db || !servicesCollection) return;
//   await addDoc(servicesCollection, { ...service, createdAt: Timestamp.now() });
// };

// export const updateService = async (id: string, service: Partial<Service>) => {
//   if (!isFirebaseConfigured() || !db) return;
//   const serviceRef = doc(db, "services", id);
//   await updateDoc(serviceRef, service);
// };

// export const deleteService = async (id: string) => {
//   if (!isFirebaseConfigured() || !db) return;
//   const serviceRef = doc(db, "services", id);
//   await deleteDoc(serviceRef);
// };

// export const subscribeToServicesChanges = (callback: (services: Service[]) => void) => {
//   if (!isFirebaseConfigured() || !db || !servicesCollection) return () => {};
//   return onSnapshot(servicesCollection, (snapshot) => {
//     const services: Service[] = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as Service[];
//     callback(services);
//   });
// };

// // -------------------------
// // Branches
// // -------------------------
// export const subscribeToBranchesChanges = (callback: (branches: Branch[]) => void) => {
//   if (!branchesCollection) return () => {};
//   return onSnapshot(branchesCollection, (snapshot) => {
//     const branches: Branch[] = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as Branch[];
//     callback(branches);
//   });
// };


// updated merge code  10000% corrrected code
// import { 
//   collection, 
//   addDoc, 
//   updateDoc, 
//   deleteDoc, 
//   doc, 
//   getDocs, 
//   onSnapshot,
//   query,
//   orderBy,
//   Timestamp ,
//   CollectionReference
// } from 'firebase/firestore';
// import { db, isFirebaseConfigured } from './firebase';

// // ==================== CATEGORY ====================

// export interface Category {
//   id?: string;
//   name: string;
//   description: string;
//   serviceCount: number;
//   color: string;
//   imageBase64?: string; 
//   gender: 'men' | 'women' | 'unisex';
//   createdAt?: Timestamp;
//   updatedAt?: Timestamp;
// }

// let categoriesCollection: CollectionReference | null = null;
// if (isFirebaseConfigured() && db) {
//   categoriesCollection = collection(db, 'categories');
// }

// export const convertFileToBase64 = (file: File): Promise<string> => {
//   return new Promise((resolve, reject) => {
//     const reader = new FileReader();
//     reader.onload = () => {
//       if (reader.result) resolve(reader.result as string);
//       else reject(new Error('Failed to convert file to base64'));
//     };
//     reader.onerror = () => reject(new Error('Error reading file'));
//     reader.readAsDataURL(file);
//   });
// };

// export const compressImage = (file: File, maxWidth: number = 800, quality: number = 0.8): Promise<string> => {
//   return new Promise((resolve, reject) => {
//     const canvas = document.createElement('canvas');
//     const ctx = canvas.getContext('2d');
//     const img = new Image();
    
//     img.onload = () => {
//       const ratio = Math.min(maxWidth / img.width, maxWidth / img.height);
//       canvas.width = img.width * ratio;
//       canvas.height = img.height * ratio;
//       ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
//       const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
//       resolve(compressedBase64);
//     };
    
//     img.onerror = () => reject(new Error('Error loading image'));
//     img.src = URL.createObjectURL(file);
//   });
// };

// // ---------------- Add Category with defaults ----------------
// export const addCategory = async (
//   categoryData: Partial<Omit<Category, 'id' | 'createdAt' | 'updatedAt'>>
// ): Promise<string> => {
//   try {
//     if (!categoriesCollection) throw new Error('Categories collection not initialized');
//     const docRef = await addDoc(categoriesCollection, {
//       name: categoryData.name || 'Unnamed Category',
//       description: categoryData.description || '',
//       serviceCount: categoryData.serviceCount ?? 0,
//       color: categoryData.color || '#ffffff',
//       gender: categoryData.gender || 'unisex',
//       imageBase64: categoryData.imageBase64 || '',
//       createdAt: Timestamp.now(),
//       updatedAt: Timestamp.now()
//     });
//     return docRef.id;
//   } catch (error) {
//     console.error('Error adding category:', error);
//     throw error;
//   }
// };

// export const updateCategory = async (categoryId: string, categoryData: Partial<Category>): Promise<void> => {
//   try {
//     if (!isFirebaseConfigured() || !db) throw new Error('Firebase is not configured');
//     const categoryRef = doc(db, 'categories', categoryId);
//     await updateDoc(categoryRef, { ...categoryData, updatedAt: Timestamp.now() });
//   } catch (error) {
//     console.error('Error updating category:', error);
//     throw error;
//   }
// };

// export const deleteCategory = async (categoryId: string): Promise<void> => {
//   try {
//     if (!isFirebaseConfigured() || !db) throw new Error('Firebase is not configured');
//     const categoryRef = doc(db, 'categories', categoryId);
//     await deleteDoc(categoryRef);
//   } catch (error) {
//     console.error('Error deleting category:', error);
//     throw error;
//   }
// };

// export const getCategories = async (): Promise<Category[]> => {
//   try {
//     if (!categoriesCollection) return [];
//     const q = query(categoriesCollection, orderBy('createdAt', 'desc'));
//     const snapshot = await getDocs(q);
//     return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category));
//   } catch (error) {
//     console.error('Error getting categories:', error);
//     throw error;
//   }
// };

// export const subscribeToCategoriesChanges = (callback: (categories: Category[]) => void, errorCallback?: (error: Error) => void) => {
//   if (!categoriesCollection) return () => {};
//   const q = query(categoriesCollection, orderBy('createdAt', 'desc'));
//   return onSnapshot(q, snapshot => {
//     const categories: Category[] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category));
//     callback(categories);
//   }, error => {
//     console.error('Error listening to categories:', error);
//     if (errorCallback) errorCallback(error);
//   });
// };

// // ==================== SERVICE ====================

// export interface Service {
//   id?: string;
//   name: string;
//   category: string;
//   duration: number;
//   price: number;
//   description: string;
//   isActive: boolean;
//   imageBase64?: string;
//   createdAt?: Timestamp;
//   updatedAt?: Timestamp;
// }

// let servicesCollection: CollectionReference | null = null;
// if (isFirebaseConfigured() && db) {
//   servicesCollection = collection(db, 'services');
// }

// // ---------------- Add Service with defaults ----------------
// export const addService = async (
//   serviceData: Partial<Omit<Service, 'id' | 'createdAt' | 'updatedAt'>>
// ): Promise<string> => {
//   try {
//     if (!servicesCollection) throw new Error('Services collection not initialized');
//     const docRef = await addDoc(servicesCollection, {
//       name: serviceData.name || 'Unnamed Service',
//       category: serviceData.category || '',
//       duration: serviceData.duration ?? 0,
//       price: serviceData.price ?? 0,
//       description: serviceData.description || '',
//       isActive: serviceData.isActive ?? true,
//       imageBase64: serviceData.imageBase64 || '',
//       createdAt: Timestamp.now(),
//       updatedAt: Timestamp.now()
//     });
//     return docRef.id;
//   } catch (error) {
//     console.error('Error adding service:', error);
//     throw error;
//   }
// };

// export const updateService = async (serviceId: string, serviceData: Partial<Service>): Promise<void> => {
//   try {
//     if (!isFirebaseConfigured() || !db) throw new Error('Firebase is not configured');
//     const serviceRef = doc(db, 'services', serviceId);
//     await updateDoc(serviceRef, { ...serviceData, updatedAt: Timestamp.now() });
//   } catch (error) {
//     console.error('Error updating service:', error);
//     throw error;
//   }
// };

// export const deleteService = async (serviceId: string): Promise<void> => {
//   try {
//     if (!isFirebaseConfigured() || !db) throw new Error('Firebase is not configured');
//     const serviceRef = doc(db, 'services', serviceId);
//     await deleteDoc(serviceRef);
//   } catch (error) {
//     console.error('Error deleting service:', error);
//     throw error;
//   }
// };

// export const getServices = async (): Promise<Service[]> => {
//   try {
//     if (!servicesCollection) return [];
//     const q = query(servicesCollection, orderBy('createdAt', 'desc'));
//     const snapshot = await getDocs(q);
//     return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Service));
//   } catch (error) {
//     console.error('Error getting services:', error);
//     throw error;
//   }
// };

// export const subscribeToServicesChanges = (callback: (services: Service[]) => void, errorCallback?: (error: Error) => void) => {
//   if (!servicesCollection) return () => {};
//   const q = query(servicesCollection, orderBy('createdAt', 'desc'));
//   return onSnapshot(q, snapshot => {
//     const services: Service[] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Service));
//     callback(services);
//   }, error => {
//     console.error('Error listening to services:', error);
//     if (errorCallback) errorCallback(error);
//   });
// };

// // ==================== BRANCHES ====================

// export interface Branch {
//   id?: string;
//   name: string;
//   address: string;
//   phone: string;
//   email: string;
//   manager: string;
//   openingHours: string;
//   isActive: boolean;
//   imageBase64?: string;
//   city: string;
//   country: string;
//   createdAt?: Timestamp;
//   updatedAt?: Timestamp;
// }

// let branchesCollection: CollectionReference | null = null;
// if (isFirebaseConfigured() && db) {
//   branchesCollection = collection(db, 'branches');
// }

// export const addBranch = async (branchData: Omit<Branch, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
//   if (!branchesCollection) throw new Error('Branches collection not initialized');
//   const docRef = await addDoc(branchesCollection, { ...branchData, createdAt: Timestamp.now(), updatedAt: Timestamp.now() });
//   return docRef.id;
// };

// export const updateBranch = async (branchId: string, branchData: Partial<Branch>) => {
//   if (!db) throw new Error('Firebase is not configured');
//   const branchRef = doc(db, 'branches', branchId);
//   await updateDoc(branchRef, { ...branchData, updatedAt: Timestamp.now() });
// };

// export const deleteBranch = async (branchId: string) => {
//   if (!db) throw new Error('Firebase is not configured');
//   const branchRef = doc(db, 'branches', branchId);
//   await deleteDoc(branchRef);
// };

// export const getBranches = async (): Promise<Branch[]> => {
//   if (!branchesCollection) return [];
//   const snapshot = await getDocs(query(branchesCollection, orderBy('createdAt', 'desc')));
//   return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Branch));
// };

// export const subscribeToBranchesChanges = (callback: (branches: Branch[]) => void) => {
//   if (!branchesCollection) return () => {};
//   return onSnapshot(branchesCollection, snapshot => {
//     const branches: Branch[] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Branch));
//     callback(branches);
//   });
// };

// // ==================== OFFERS ====================

// export interface Offer {
//   id?: string;
//   title: string;
//   description: string;
//   discountType: 'percentage' | 'fixed';
//   discountValue: number;
//   validFrom: string;
//   validTo: string;
//   isActive: boolean;
//   usageLimit?: number;
//   usedCount: number;
//   imageBase64?: string;
//   selectedBranches: string[];
//   selectedServices: string[];
//   createdAt?: Timestamp;
//   updatedAt?: Timestamp;
// }

// let offersCollection: CollectionReference | null = null;
// if (isFirebaseConfigured() && db) {
//   offersCollection = collection(db, 'offers');
// }

// export const addOffer = async (offerData: Omit<Offer, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
//   if (!offersCollection) throw new Error('Offers collection not initialized');
//   const docRef = await addDoc(offersCollection, { ...offerData, createdAt: Timestamp.now(), updatedAt: Timestamp.now() });
//   return docRef.id;
// };

// export const updateOffer = async (offerId: string, offerData: Partial<Offer>) => {
//   if (!db) throw new Error('Firebase is not configured');
//   const offerRef = doc(db, 'offers', offerId);
//   await updateDoc(offerRef, { ...offerData, updatedAt: Timestamp.now() });
// };

// export const deleteOffer = async (offerId: string) => {
//   if (!db) throw new Error('Firebase is not configured');
//   const offerRef = doc(db, 'offers', offerId);
//   await deleteDoc(offerRef);
// };

// export const getOffers = async (): Promise<Offer[]> => {
//   if (!offersCollection) return [];
//   const snapshot = await getDocs(query(offersCollection, orderBy('createdAt', 'desc')));
//   return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Offer));
// };

// export const subscribeToOffersChanges = (callback: (offers: Offer[]) => void) => {
//   if (!offersCollection) return () => {};
//   return onSnapshot(offersCollection, snapshot => {
//     const offers: Offer[] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Offer));
//     callback(offers);
//   });
// };

// // ==================== REFERRALS ====================

// export interface Referral {
//   id?: string;
//   name: string;
//   discount: number;
//   createdAt?: Timestamp;
// }

// let referralsCollection: CollectionReference | null = null;
// if (isFirebaseConfigured() && db) {
//   referralsCollection = collection(db, 'referrals');
// }

// export const addReferral = async (referralData: Omit<Referral, 'id' | 'createdAt'>): Promise<string> => {
//   if (!referralsCollection) throw new Error('Referrals collection not initialized');
//   const docRef = await addDoc(referralsCollection, { ...referralData, createdAt: Timestamp.now() });
//   return docRef.id;
// };

// export const updateReferral = async (referralId: string, referralData: Partial<Referral>) => {
//   if (!db) throw new Error('Firebase is not configured');
//   const referralRef = doc(db, 'referrals', referralId);
//   await updateDoc(referralRef, referralData);
// };

// export const deleteReferral = async (referralId: string) => {
//   if (!db) throw new Error('Firebase is not configured');
//   const referralRef = doc(db, 'referrals', referralId);
//   await deleteDoc(referralRef);
// };

// export const subscribeToReferralsChanges = (callback: (referrals: Referral[]) => void) => {
//   if (!referralsCollection) return () => {};
//   return onSnapshot(referralsCollection, snapshot => {
//     const referrals: Referral[] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Referral));
//     callback(referrals);
//   });
// };


// category branch add

// import { 
//   collection, 
//   addDoc, 
//   updateDoc, 
//   deleteDoc, 
//   doc, 
//   getDocs, 
//   onSnapshot,
//   query,
//   orderBy,
//   Timestamp ,
//   CollectionReference
// } from 'firebase/firestore';
// import { db, isFirebaseConfigured } from './firebase';

// // ==================== CATEGORY ====================

// export interface Category {
//   id?: string;
//   name: string;
//   description: string;
//   serviceCount: number;
//   color: string;
//   imageBase64?: string; 
//   gender: 'men' | 'women' | 'unisex';
//    branch?: string; // ✅ branch field add ki
//   createdAt?: Timestamp;
//   updatedAt?: Timestamp;
// }

// let categoriesCollection: CollectionReference | null = null;
// if (isFirebaseConfigured() && db) {
//   categoriesCollection = collection(db, 'categories');
// }

// export const convertFileToBase64 = (file: File): Promise<string> => {
//   return new Promise((resolve, reject) => {
//     const reader = new FileReader();
//     reader.onload = () => {
//       if (reader.result) resolve(reader.result as string);
//       else reject(new Error('Failed to convert file to base64'));
//     };
//     reader.onerror = () => reject(new Error('Error reading file'));
//     reader.readAsDataURL(file);
//   });
// };

// export const compressImage = (file: File, maxWidth: number = 800, quality: number = 0.8): Promise<string> => {
//   return new Promise((resolve, reject) => {
//     const canvas = document.createElement('canvas');
//     const ctx = canvas.getContext('2d');
//     const img = new Image();
    
//     img.onload = () => {
//       const ratio = Math.min(maxWidth / img.width, maxWidth / img.height);
//       canvas.width = img.width * ratio;
//       canvas.height = img.height * ratio;
//       ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
//       const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
//       resolve(compressedBase64);
//     };
    
//     img.onerror = () => reject(new Error('Error loading image'));
//     img.src = URL.createObjectURL(file);
//   });
// };

// // ---------------- Add Category with defaults ----------------
// export const addCategory = async (
//   categoryData: Partial<Omit<Category, 'id' | 'createdAt' | 'updatedAt'>>
// ): Promise<string> => {
//   try {
//     if (!categoriesCollection) throw new Error('Categories collection not initialized');
//     const docRef = await addDoc(categoriesCollection, {
//       name: categoryData.name || 'Unnamed Category',
//       description: categoryData.description || '',
//       serviceCount: categoryData.serviceCount ?? 0,
//       color: categoryData.color || '#ffffff',
//       gender: categoryData.gender || 'unisex',
//        branch: categoryData.branch || '', // ✅ branch save
//       imageBase64: categoryData.imageBase64 || '',
//       createdAt: Timestamp.now(),
//       updatedAt: Timestamp.now()
//     });
//     return docRef.id;
//   } catch (error) {
//     console.error('Error adding category:', error);
//     throw error;
//   }
// };

// export const updateCategory = async (categoryId: string, categoryData: Partial<Category>): Promise<void> => {
//   try {
//     if (!isFirebaseConfigured() || !db) throw new Error('Firebase is not configured');
//     const categoryRef = doc(db, 'categories', categoryId);
//     await updateDoc(categoryRef, { ...categoryData, branch: categoryData.branch || '',  updatedAt: Timestamp.now() });
   
//   } catch (error) {
//     console.error('Error updating category:', error);
//     throw error;
//   }
// };

// export const deleteCategory = async (categoryId: string): Promise<void> => {
//   try {
//     if (!isFirebaseConfigured() || !db) throw new Error('Firebase is not configured');
//     const categoryRef = doc(db, 'categories', categoryId);
//     await deleteDoc(categoryRef);
//   } catch (error) {
//     console.error('Error deleting category:', error);
//     throw error;
//   }
// };

// export const getCategories = async (): Promise<Category[]> => {
//   try {
//     if (!categoriesCollection) return [];
//     const q = query(categoriesCollection, orderBy('createdAt', 'desc'));
//     const snapshot = await getDocs(q);
//     return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category));
//   } catch (error) {
//     console.error('Error getting categories:', error);
//     throw error;
//   }
// };

// export const subscribeToCategoriesChanges = (callback: (categories: Category[]) => void, errorCallback?: (error: Error) => void) => {
//   if (!categoriesCollection) return () => {};
//   const q = query(categoriesCollection, orderBy('createdAt', 'desc'));
//   return onSnapshot(q, snapshot => {
//     const categories: Category[] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category));
//     callback(categories);
//   }, error => {
//     console.error('Error listening to categories:', error);
//     if (errorCallback) errorCallback(error);
//   });
// };

// // ==================== SERVICE ====================

// export interface Service {
//   id?: string;
//   name: string;
//   category: string;
//   duration: number;
//   price: number;
//   description: string;
//    branch?: string;  // ✅ branch field add
//   isActive: boolean;
//   imageBase64?: string;
//   createdAt?: Timestamp;
//   updatedAt?: Timestamp;
// }

// let servicesCollection: CollectionReference | null = null;
// if (isFirebaseConfigured() && db) {
//   servicesCollection = collection(db, 'services');
// }

// // ---------------- Add Service with defaults ----------------
// export const addService = async (
//   serviceData: Partial<Omit<Service, 'id' | 'createdAt' | 'updatedAt'>>
// ): Promise<string> => {
//   try {
//     if (!servicesCollection) throw new Error('Services collection not initialized');
//     const docRef = await addDoc(servicesCollection, {
//       name: serviceData.name || 'Unnamed Service',
//       category: serviceData.category || '',
//       duration: serviceData.duration ?? 0,
//       price: serviceData.price ?? 0,
//       description: serviceData.description || '',
//       isActive: serviceData.isActive ?? true,
//        branch: serviceData.branch , // ✅ branch save
//       imageBase64: serviceData.imageBase64 || '',
//       createdAt: Timestamp.now(),
//       updatedAt: Timestamp.now()
//     });
//     return docRef.id;
//   } catch (error) {
//     console.error('Error adding service:', error);
//     throw error;
//   }
// };

// export const updateService = async (serviceId: string, serviceData: Partial<Service>): Promise<void> => {
//   try {
//     if (!isFirebaseConfigured() || !db) throw new Error('Firebase is not configured');
//     const serviceRef = doc(db, 'services', serviceId);
//     await updateDoc(serviceRef, { ...serviceData, branch: serviceData.branch , updatedAt: Timestamp.now() });
//   } catch (error) {
//     console.error('Error updating service:', error);
//     throw error;
//   }
// };

// export const deleteService = async (serviceId: string): Promise<void> => {
//   try {
//     if (!isFirebaseConfigured() || !db) throw new Error('Firebase is not configured');
//     const serviceRef = doc(db, 'services', serviceId);
//     await deleteDoc(serviceRef);
//   } catch (error) {
//     console.error('Error deleting service:', error);
//     throw error;
//   }
// };

// export const getServices = async (): Promise<Service[]> => {
//   try {
//     if (!servicesCollection) return [];
//     const q = query(servicesCollection, orderBy('createdAt', 'desc'));
//     const snapshot = await getDocs(q);
//     return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Service));
//   } catch (error) {
//     console.error('Error getting services:', error);
//     throw error;
//   }
// };

// export const subscribeToServicesChanges = (callback: (services: Service[]) => void, errorCallback?: (error: Error) => void) => {
//   if (!servicesCollection) return () => {};
//   const q = query(servicesCollection, orderBy('createdAt', 'desc'));
//   return onSnapshot(q, snapshot => {
//     const services: Service[] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Service));
//     callback(services);
//   }, error => {
//     console.error('Error listening to services:', error);
//     if (errorCallback) errorCallback(error);
//   });
// };

// // ==================== BRANCHES ====================

// export interface Branch {
//   id?: string;
//   name: string;
//   address: string;
//   phone: string;
//   email: string;
//   manager: string;
//   openingHours: string;
//   isActive: boolean;
//   imageBase64?: string;
//   city: string;
//   country: string;
//   createdAt?: Timestamp;
//   updatedAt?: Timestamp;
// }

// let branchesCollection: CollectionReference | null = null;
// if (isFirebaseConfigured() && db) {
//   branchesCollection = collection(db, 'branches');
// }

// export const addBranch = async (branchData: Omit<Branch, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
//   if (!branchesCollection) throw new Error('Branches collection not initialized');
//   const docRef = await addDoc(branchesCollection, { ...branchData, createdAt: Timestamp.now(), updatedAt: Timestamp.now() });
//   return docRef.id;
// };

// export const updateBranch = async (branchId: string, branchData: Partial<Branch>) => {
//   if (!db) throw new Error('Firebase is not configured');
//   const branchRef = doc(db, 'branches', branchId);
//   await updateDoc(branchRef, { ...branchData, updatedAt: Timestamp.now() });
// };

// export const deleteBranch = async (branchId: string) => {
//   if (!db) throw new Error('Firebase is not configured');
//   const branchRef = doc(db, 'branches', branchId);
//   await deleteDoc(branchRef);
// };

// export const getBranches = async (): Promise<Branch[]> => {
//   if (!branchesCollection) return [];
//   const snapshot = await getDocs(query(branchesCollection, orderBy('createdAt', 'desc')));
//   return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Branch));
// };

// export const subscribeToBranchesChanges = (callback: (branches: Branch[]) => void) => {
//   if (!branchesCollection) return () => {};
//   return onSnapshot(branchesCollection, snapshot => {
//     const branches: Branch[] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Branch));
//     callback(branches);
//   });
// };

// // ==================== OFFERS ====================

// export interface Offer {
//   id?: string;
//   title: string;
//   description: string;
//   discountType: 'percentage' | 'fixed';
//   discountValue: number;
//   validFrom: string;
//   validTo: string;
//   isActive: boolean;
//   usageLimit?: number;
//   usedCount: number;
//   imageBase64?: string;
//   selectedBranches: string[];
//   selectedServices: string[];
//   createdAt?: Timestamp;
//   updatedAt?: Timestamp;
// }

// let offersCollection: CollectionReference | null = null;
// if (isFirebaseConfigured() && db) {
//   offersCollection = collection(db, 'offers');
// }

// export const addOffer = async (offerData: Omit<Offer, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
//   if (!offersCollection) throw new Error('Offers collection not initialized');
//   const docRef = await addDoc(offersCollection, { ...offerData, createdAt: Timestamp.now(), updatedAt: Timestamp.now() });
//   return docRef.id;
// };

// export const updateOffer = async (offerId: string, offerData: Partial<Offer>) => {
//   if (!db) throw new Error('Firebase is not configured');
//   const offerRef = doc(db, 'offers', offerId);
//   await updateDoc(offerRef, { ...offerData, updatedAt: Timestamp.now() });
// };

// export const deleteOffer = async (offerId: string) => {
//   if (!db) throw new Error('Firebase is not configured');
//   const offerRef = doc(db, 'offers', offerId);
//   await deleteDoc(offerRef);
// };

// export const getOffers = async (): Promise<Offer[]> => {
//   if (!offersCollection) return [];
//   const snapshot = await getDocs(query(offersCollection, orderBy('createdAt', 'desc')));
//   return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Offer));
// };

// export const subscribeToOffersChanges = (callback: (offers: Offer[]) => void) => {
//   if (!offersCollection) return () => {};
//   return onSnapshot(offersCollection, snapshot => {
//     const offers: Offer[] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Offer));
//     callback(offers);
//   });
// };

// // ==================== REFERRALS ====================

// export interface Referral {
//   id?: string;
//   name: string;
//   discount: number;
//   createdAt?: Timestamp;
// }

// let referralsCollection: CollectionReference | null = null;
// if (isFirebaseConfigured() && db) {
//   referralsCollection = collection(db, 'referrals');
// }

// export const addReferral = async (referralData: Omit<Referral, 'id' | 'createdAt'>): Promise<string> => {
//   if (!referralsCollection) throw new Error('Referrals collection not initialized');
//   const docRef = await addDoc(referralsCollection, { ...referralData, createdAt: Timestamp.now() });
//   return docRef.id;
// };

// export const updateReferral = async (referralId: string, referralData: Partial<Referral>) => {
//   if (!db) throw new Error('Firebase is not configured');
//   const referralRef = doc(db, 'referrals', referralId);
//   await updateDoc(referralRef, referralData);
// };

// export const deleteReferral = async (referralId: string) => {
//   if (!db) throw new Error('Firebase is not configured');
//   const referralRef = doc(db, 'referrals', referralId);
//   await deleteDoc(referralRef);
// };

// export const subscribeToReferralsChanges = (callback: (referrals: Referral[]) => void) => {
//   if (!referralsCollection) return () => {};
//   return onSnapshot(referralsCollection, snapshot => {
//     const referrals: Referral[] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Referral));
//     callback(referrals);
//   });
// };




// new
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDocs, 
  onSnapshot,
  query,
  orderBy,
  Timestamp ,
  CollectionReference,
   where,
  increment
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from './firebase';

// ==================== CATEGORY ====================

export interface Category {
  id?: string;
  name: string;
  description: string;
  serviceCount: number;
  color: string;
  imageBase64?: string; 
  gender: 'men' | 'women' | 'unisex';
   branch?: string; // ✅ branch field add ki
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

let categoriesCollection: CollectionReference | null = null;
if (isFirebaseConfigured() && db) {
  categoriesCollection = collection(db, 'categories');
}

export const convertFileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (reader.result) resolve(reader.result as string);
      else reject(new Error('Failed to convert file to base64'));
    };
    reader.onerror = () => reject(new Error('Error reading file'));
    reader.readAsDataURL(file);
  });
};

export const compressImage = (file: File, maxWidth: number = 800, quality: number = 0.8): Promise<string> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      const ratio = Math.min(maxWidth / img.width, maxWidth / img.height);
      canvas.width = img.width * ratio;
      canvas.height = img.height * ratio;
      ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
      const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
      resolve(compressedBase64);
    };
    
    img.onerror = () => reject(new Error('Error loading image'));
    img.src = URL.createObjectURL(file);
  });
};

// ---------------- Add Category with defaults ----------------
export const addCategory = async (
  categoryData: Partial<Omit<Category, 'id' | 'createdAt' | 'updatedAt'>>
): Promise<string> => {
  try {
    if (!categoriesCollection) throw new Error('Categories collection not initialized');
    const docRef = await addDoc(categoriesCollection, {
      name: categoryData.name || 'Unnamed Category',
      description: categoryData.description || '',
      serviceCount: categoryData.serviceCount ?? 0,
      color: categoryData.color || '#ffffff',
      gender: categoryData.gender || 'unisex',
       branch: categoryData.branch || '', // ✅ branch save
      imageBase64: categoryData.imageBase64 || '',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error adding category:', error);
    throw error;
  }
};

export const updateCategory = async (categoryId: string, categoryData: Partial<Category>): Promise<void> => {
  try {
    if (!isFirebaseConfigured() || !db) throw new Error('Firebase is not configured');
    const categoryRef = doc(db, 'categories', categoryId);
    await updateDoc(categoryRef, { ...categoryData, branch: categoryData.branch || '',  updatedAt: Timestamp.now() });
   
  } catch (error) {
    console.error('Error updating category:', error);
    throw error;
  }
};

export const deleteCategory = async (categoryId: string): Promise<void> => {
  try {
    if (!isFirebaseConfigured() || !db) throw new Error('Firebase is not configured');
    const categoryRef = doc(db, 'categories', categoryId);
    await deleteDoc(categoryRef);
  } catch (error) {
    console.error('Error deleting category:', error);
    throw error;
  }
};

export const getCategories = async (): Promise<Category[]> => {
  try {
    if (!categoriesCollection) return [];
    const q = query(categoriesCollection, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category));
  } catch (error) {
    console.error('Error getting categories:', error);
    throw error;
  }
};

export const subscribeToCategoriesChanges = (callback: (categories: Category[]) => void, errorCallback?: (error: Error) => void) => {
  if (!categoriesCollection) return () => {};
  const q = query(categoriesCollection, orderBy('createdAt', 'desc'));
  return onSnapshot(q, snapshot => {
    const categories: Category[] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category));
    callback(categories);
  }, error => {
    console.error('Error listening to categories:', error);
    if (errorCallback) errorCallback(error);
  });
};


// helper: get category id by its name
const getCategoryIdByName = async (categoryName: string): Promise<string | null> => {
  if (!categoriesCollection) return null;
  const q = query(categoriesCollection, where("name", "==", categoryName));
  const snapshot = await getDocs(q);
  if (!snapshot.empty) {
    return snapshot.docs[0].id;
  }
  return null;
};

// ==================== SERVICE ====================

export interface Service {
  id?: string;
  name: string;
  category: string;
  categoryId?: string;  // category id
  duration: number;
  price: number;
  description: string;
   branch?: string;  // ✅ branch field add
  isActive: boolean;
  imageBase64?: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

let servicesCollection: CollectionReference | null = null;
if (isFirebaseConfigured() && db) {
  servicesCollection = collection(db, 'services');
}

// ---------------- Add Service with defaults ----------------
export const addService = async (
  serviceData: Partial<Omit<Service, 'id' | 'createdAt' | 'updatedAt'>>
): Promise<string> => {
  try {
    if (!servicesCollection) throw new Error('Services collection not initialized');

    // 🔎 categoryId find by category name
    let categoryId: string | null = null;
    if (serviceData.category) {
      categoryId = await getCategoryIdByName(serviceData.category);
    }

    // service save with BOTH name + id
    const docRef = await addDoc(servicesCollection, {
      name: serviceData.name || 'Unnamed Service',
      category: serviceData.category || '',       // ✅ category name
      categoryId: categoryId || '',               // ✅ category id
      duration: serviceData.duration ?? 0,
      price: serviceData.price ?? 0,
      description: serviceData.description || '',
      isActive: serviceData.isActive ?? true,
      branch: serviceData.branch,
      imageBase64: serviceData.imageBase64 || '',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });

    // ✅ category ka serviceCount +1
    if (categoryId) {
      const categoryRef = doc(db, 'categories', categoryId);
      await updateDoc(categoryRef, { serviceCount: increment(1) });
    }

    return docRef.id;
  } catch (error) {
    console.error('Error adding service:', error);
    throw error;
  }
};



export const updateService = async (serviceId: string, serviceData: Partial<Service>): Promise<void> => {
  try {
    if (!isFirebaseConfigured() || !db) throw new Error('Firebase is not configured');
    const serviceRef = doc(db, 'services', serviceId);
    await updateDoc(serviceRef, { ...serviceData, branch: serviceData.branch , updatedAt: Timestamp.now() });
  } catch (error) {
    console.error('Error updating service:', error);
    throw error;
  }
};

export const deleteService = async (
  serviceId: string,
  categoryName?: string,
  categoryIdFromService?: string
): Promise<void> => {
  try {
    if (!isFirebaseConfigured() || !db) throw new Error('Firebase is not configured');

    const serviceRef = doc(db, 'services', serviceId);
    await deleteDoc(serviceRef);

    // ✅ category ka serviceCount -1
    let categoryId = categoryIdFromService;
    if (!categoryId && categoryName) {
      categoryId = await getCategoryIdByName(categoryName);
    }

    if (categoryId) {
      const categoryRef = doc(db, 'categories', categoryId);
      await updateDoc(categoryRef, { serviceCount: increment(-1) });
    }
  } catch (error) {
    console.error('Error deleting service:', error);
    throw error;
  }
};



export const getServices = async (): Promise<Service[]> => {
  try {
    if (!servicesCollection) return [];
    const q = query(servicesCollection, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Service));
  } catch (error) {
    console.error('Error getting services:', error);
    throw error;
  }
};

export const subscribeToServicesChanges = (callback: (services: Service[]) => void, errorCallback?: (error: Error) => void) => {
  if (!servicesCollection) return () => {};
  const q = query(servicesCollection, orderBy('createdAt', 'desc'));
  return onSnapshot(q, snapshot => {
    const services: Service[] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Service));
    callback(services);
  }, error => {
    console.error('Error listening to services:', error);
    if (errorCallback) errorCallback(error);
  });
};

// ==================== BRANCHES ====================

export interface Branch {
  id?: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  manager: string;
  openingHours: string;
  isActive: boolean;
  imageBase64?: string;
  city: string;
  country: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

let branchesCollection: CollectionReference | null = null;
if (isFirebaseConfigured() && db) {
  branchesCollection = collection(db, 'branches');
}

export const addBranch = async (branchData: Omit<Branch, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  if (!branchesCollection) throw new Error('Branches collection not initialized');
  const docRef = await addDoc(branchesCollection, { ...branchData, createdAt: Timestamp.now(), updatedAt: Timestamp.now() });
  return docRef.id;
};

export const updateBranch = async (branchId: string, branchData: Partial<Branch>) => {
  if (!db) throw new Error('Firebase is not configured');
  const branchRef = doc(db, 'branches', branchId);
  await updateDoc(branchRef, { ...branchData, updatedAt: Timestamp.now() });
};

export const deleteBranch = async (branchId: string) => {
  if (!db) throw new Error('Firebase is not configured');
  const branchRef = doc(db, 'branches', branchId);
  await deleteDoc(branchRef);
};

export const getBranches = async (): Promise<Branch[]> => {
  if (!branchesCollection) return [];
  const snapshot = await getDocs(query(branchesCollection, orderBy('createdAt', 'desc')));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Branch));
};

export const subscribeToBranchesChanges = (callback: (branches: Branch[]) => void) => {
  if (!branchesCollection) return () => {};
  return onSnapshot(branchesCollection, snapshot => {
    const branches: Branch[] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Branch));
    callback(branches);
  });
};

// ==================== OFFERS ====================

export interface Offer {
  id?: string;
  title: string;
  description: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  validFrom: string;
  validTo: string;
  isActive: boolean;
  usageLimit?: number;
  usedCount: number;
  imageBase64?: string;
  selectedBranches: string[];
  selectedServices: string[];
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

let offersCollection: CollectionReference | null = null;
if (isFirebaseConfigured() && db) {
  offersCollection = collection(db, 'offers');
}

export const addOffer = async (offerData: Omit<Offer, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  if (!offersCollection) throw new Error('Offers collection not initialized');
  const docRef = await addDoc(offersCollection, { ...offerData, createdAt: Timestamp.now(), updatedAt: Timestamp.now() });
  return docRef.id;
};

export const updateOffer = async (offerId: string, offerData: Partial<Offer>) => {
  if (!db) throw new Error('Firebase is not configured');
  const offerRef = doc(db, 'offers', offerId);
  await updateDoc(offerRef, { ...offerData, updatedAt: Timestamp.now() });
};

export const deleteOffer = async (offerId: string) => {
  if (!db) throw new Error('Firebase is not configured');
  const offerRef = doc(db, 'offers', offerId);
  await deleteDoc(offerRef);
};

export const getOffers = async (): Promise<Offer[]> => {
  if (!offersCollection) return [];
  const snapshot = await getDocs(query(offersCollection, orderBy('createdAt', 'desc')));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Offer));
};

export const subscribeToOffersChanges = (callback: (offers: Offer[]) => void) => {
  if (!offersCollection) return () => {};
  return onSnapshot(offersCollection, snapshot => {
    const offers: Offer[] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Offer));
    callback(offers);
  });
};

// ==================== REFERRALS ====================

export interface Referral {
  id?: string;
  name: string;
  discount: number;
  createdAt?: Timestamp;
}

let referralsCollection: CollectionReference | null = null;
if (isFirebaseConfigured() && db) {
  referralsCollection = collection(db, 'referrals');
}

export const addReferral = async (referralData: Omit<Referral, 'id' | 'createdAt'>): Promise<string> => {
  if (!referralsCollection) throw new Error('Referrals collection not initialized');
  const docRef = await addDoc(referralsCollection, { ...referralData, createdAt: Timestamp.now() });
  return docRef.id;
};

export const updateReferral = async (referralId: string, referralData: Partial<Referral>) => {
  if (!db) throw new Error('Firebase is not configured');
  const referralRef = doc(db, 'referrals', referralId);
  await updateDoc(referralRef, referralData);
};

export const deleteReferral = async (referralId: string) => {
  if (!db) throw new Error('Firebase is not configured');
  const referralRef = doc(db, 'referrals', referralId);
  await deleteDoc(referralRef);
};

export const subscribeToReferralsChanges = (callback: (referrals: Referral[]) => void) => {
  if (!referralsCollection) return () => {};
  return onSnapshot(referralsCollection, snapshot => {
    const referrals: Referral[] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Referral));
    callback(referrals);
  });
};
