'use client';

import { useState, useEffect, useRef } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc, updateDoc, doc, serverTimestamp, where, Timestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage, isFirebaseConfigured } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import Image from 'next/image';
import AccessWrapper from '@/components/AccessWrapper';

interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderType: 'user' | 'admin';
  content: string;
  type: 'text' | 'image';
  imageUrl?: string;
  imageName?: string;
  timestamp: Timestamp | Date;
  isRead: boolean;
  chatRoomId: string;
}

interface ChatRoom {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  createdAt: Timestamp | Date;
  lastMessageAt: Timestamp | Date;
  lastMessage: string;
  unreadCount: number;
  isActive: boolean;
}

// Main chat component that uses hooks
function ChatComponent() {
  const { user } = useAuth();
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [selectedChatRoom, setSelectedChatRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [notifications, setNotifications] = useState<{id: string, message: string, chatRoomId: string}[]>([]);
  const [hasNewMessage, setHasNewMessage] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const previousMessagesCount = useRef<{[key: string]: number}>({});

  // Initialize notification audio
  useEffect(() => {
    if (typeof window !== 'undefined') {
      audioRef.current = new Audio('/notification.mp3');
      audioRef.current.volume = 0.5;
    }
  }, []);

  // Play notification sound
  const playNotificationSound = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(e => console.log('Could not play notification sound:', e));
    }
  };

  // Show notification
  const showNotification = (chatRoomId: string, senderName: string, message: string) => {
    const notificationId = Date.now().toString();
    const notificationText = `${senderName}: ${message.length > 50 ? message.substring(0, 50) + '...' : message}`;
    
    setNotifications(prev => [...prev, {
      id: notificationId,
      message: notificationText,
      chatRoomId
    }]);

    // Auto-remove notification after 5 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
    }, 5000);

    // Play sound
    playNotificationSound();

    // Browser notification (if permission granted)
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      new Notification('New Message', {
        body: notificationText,
        icon: '/favicon.ico'
      });
    }
  };

  // Request notification permission
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Handle client-side mounting to prevent hydration mismatch
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Set loading timeout to prevent infinite loading
  useEffect(() => {
    loadingTimeoutRef.current = setTimeout(() => {
      if (isLoading) {
        console.warn('Loading timeout reached, stopping loader');
        setIsLoading(false);
        setError('Loading took too long. Please refresh the page.');
      }
    }, 10000); // 10 second timeout

    return () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
    };
  }, [isLoading]);

  // Handle early loading state resolution
  useEffect(() => {
    // If user is null or Firebase is not configured, stop loading immediately
    if (!user || !db) {
      setIsLoading(false);
      if (!user) {
        setError('Please sign in to access the chat.');
      } else if (!db) {
        setError('Database service is not available.');
      }
      return;
    }
  }, [user]);

  // Load chat rooms
  useEffect(() => {
    if (!user || !db) {
      setIsLoading(false);
      return;
    }

    let unsubscribe: (() => void) | null = null;

    const setupChatRooms = async () => {
      try {
        const chatRoomsQuery = query(
          collection(db, 'chatRooms'),
          orderBy('lastMessageAt', 'desc')
        );

        unsubscribe = onSnapshot(chatRoomsQuery, (snapshot) => {
          try {
            const rooms: ChatRoom[] = [];
            snapshot.forEach((doc) => {
              rooms.push({ id: doc.id, ...doc.data() } as ChatRoom);
            });
            
            // Check for new messages in chat rooms
            if (!isLoading && chatRooms.length > 0) {
              rooms.forEach(room => {
                const previousRoom = chatRooms.find(r => r.id === room.id);
                if (previousRoom && room.lastMessage !== previousRoom.lastMessage && 
                    room.lastMessageAt > previousRoom.lastMessageAt) {
                  // New message detected - show notification if not in current chat
                  if (!selectedChatRoom || selectedChatRoom.id !== room.id) {
                    showNotification(room.id, room.userName, room.lastMessage);
                    setHasNewMessage(true);
                  }
                }
              });
            }
            
            setChatRooms(rooms);
            setIsLoading(false);
            setError(null); // Clear any previous errors
            
            // Clear timeout since we successfully loaded
            if (loadingTimeoutRef.current) {
              clearTimeout(loadingTimeoutRef.current);
              loadingTimeoutRef.current = null;
            }
          } catch (err) {
            console.error('Error processing chat rooms snapshot:', err);
            setIsLoading(false);
            setError('Failed to process chat rooms data.');
          }
        }, (error) => {
          console.error('Error loading chat rooms:', error);
          setIsLoading(false);
          setError('Failed to load chat rooms. Please check your connection.');
        });
      } catch (error) {
        console.error('Error setting up chat rooms listener:', error);
        setIsLoading(false);
        setError('Failed to initialize chat rooms.');
      }
    };

    setupChatRooms();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [user]);

  // Load messages for selected chat room
  useEffect(() => {
    if (!selectedChatRoom || !db) {
      setMessages([]);
      return;
    }

    let unsubscribe: (() => void) | null = null;

    const setupMessages = async () => {
      try {
        const messagesQuery = query(
          collection(db, 'messages'),
          where('chatRoomId', '==', selectedChatRoom.id),
          orderBy('timestamp', 'asc')
        );

        unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
          try {
            const msgs: ChatMessage[] = [];
            snapshot.forEach((doc) => {
              msgs.push({ id: doc.id, ...doc.data() } as ChatMessage);
            });
            
            // Check for new messages in current chat
            if (messages.length > 0 && msgs.length > messages.length) {
              const newMessages = msgs.slice(messages.length);
              newMessages.forEach(msg => {
                if (msg.senderType === 'user') {
                  showNotification(selectedChatRoom.id, msg.senderName, msg.content);
                }
              });
            }
            
            setMessages(msgs);
            scrollToBottom();
          } catch (err) {
            console.error('Error processing messages snapshot:', err);
          }
        }, (error) => {
          console.error('Error loading messages:', error);
          // Don't set global error for messages, just log it
        });
      } catch (error) {
        console.error('Error setting up messages listener:', error);
      }
    };

    setupMessages();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [selectedChatRoom]);

  // Auto-scroll when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Send text message
  // Send text message
const sendMessage = async () => {
  if (!newMessage.trim() || !selectedChatRoom || !user || isSending || !db) return;

  setIsSending(true);
  try {
    const messageData = {
      senderId: user.uid,
      senderName: 'Admin',
      senderType: 'admin',
      content: newMessage.trim(),
      type: 'text',
      timestamp: serverTimestamp(),
      isRead: false,
      chatRoomId: selectedChatRoom.id,
    };

    // Save in "messages" collection
    await addDoc(collection(db, 'messages'), messageData);

    // ✅ Also save in "chats" collection (for notifications)
    await addDoc(collection(db, 'chats'), {
      ...messageData,
      createdAt: serverTimestamp(), // for ordering notifications
    });

    // Update chat room with last message
    await updateDoc(doc(db, 'chatRooms', selectedChatRoom.id), {
      lastMessage: newMessage.trim(),
      lastMessageAt: serverTimestamp(),
    });

    setNewMessage('');
  } catch (error) {
    console.error('Error sending message:', error);
    alert('Failed to send message. Please try again.');
  } finally {
    setIsSending(false);
  }
};

  // Handle image upload
  
// Handle image upload
const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
  const file = event.target.files?.[0];
  if (!file || !selectedChatRoom || !user || isSending || !db || !storage) return;

  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/svg+xml'];
  if (!allowedTypes.includes(file.type)) {
    alert('Please select a valid image file (JPG, PNG, or SVG)');
    return;
  }

  if (file.size > 5 * 1024 * 1024) {
    alert('File size must be less than 5MB');
    return;
  }

  setIsUploading(true);
  setIsSending(true);
  try {
    const fileName = `chat_images/admin_${Date.now()}_${file.name}`;
    const storageRef = ref(storage, fileName);
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);

    const messageData = {
      senderId: user.uid,
      senderName: 'Admin',
      senderType: 'admin',
      content: 'Image',
      type: 'image',
      imageUrl: downloadURL,
      imageName: file.name,
      timestamp: serverTimestamp(),
      isRead: false,
      chatRoomId: selectedChatRoom.id,
    };

    // Save in "messages" collection
    await addDoc(collection(db, 'messages'), messageData);

    // ✅ Also save in "chats" collection (for notifications)
    await addDoc(collection(db, 'chats'), {
      ...messageData,
      createdAt: serverTimestamp(),
    });

    await updateDoc(doc(db, 'chatRooms', selectedChatRoom.id), {
      lastMessage: 'Image',
      lastMessageAt: serverTimestamp(),
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  } catch (error) {
    console.error('Error uploading image:', error);
    
    // More detailed error handling
    let errorMessage = 'Failed to upload image. Please try again.';
    
    if (error instanceof Error) {
      if (error.message.includes('storage/unauthorized')) {
        errorMessage = 'Upload failed: Permission denied. Please check Firebase storage rules.';
      } else if (error.message.includes('storage/canceled')) {
        errorMessage = 'Upload was canceled. Please try again.';
      } else if (error.message.includes('storage/unknown')) {
        errorMessage = 'Upload failed due to an unknown error. Please check your internet connection.';
      } else if (error.message.includes('storage/invalid-format')) {
        errorMessage = 'Invalid file format. Please select a valid image file.';
      } else if (error.message.includes('storage/invalid-argument')) {
        errorMessage = 'Invalid file. Please select a different image.';
      }
    }
    
    alert(errorMessage);
  } finally {
    setIsUploading(false);
    setIsSending(false);
  }
};

  // Format timestamp
  const formatTime = (timestamp: Timestamp | Date | null) => {
    if (!timestamp) return '';
    const date = timestamp instanceof Timestamp ? timestamp.toDate() : timestamp;
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (days > 0) {
      return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
    } else if (hours > 0) {
      return `${hours}h ago`;
    } else if (minutes > 0) {
      return `${minutes}m ago`;
    } else {
      return 'Just now';
    }
  };

  // Handle authentication and error states
  if (!isMounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <div className="text-center p-12 bg-white/90 backdrop-blur-md rounded-3xl shadow-2xl border border-white/50">
          <div className="relative mb-8">
            <div className="animate-spin rounded-full h-20 w-20 border-4 border-blue-200 border-t-blue-600 mx-auto"></div>
          </div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent mb-4">
            Loading Chat
          </h2>
          <p className="text-gray-600 font-medium text-lg mb-4">Setting up your conversation space...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <div className="text-center p-8 bg-white/80 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20 max-w-md mx-4">
          <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent mb-4">Access Required</h2>
          <p className="text-gray-600 leading-relaxed">Please sign in to access the chat system and connect with our team.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-pink-50 to-rose-100">
        <div className="text-center p-12 bg-white/90 backdrop-blur-md rounded-3xl shadow-2xl border border-white/50 transform hover:scale-105 transition-all duration-500">
          <div className="w-24 h-24 bg-gradient-to-br from-red-400 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl">
            <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-red-600 to-pink-600 bg-clip-text text-transparent mb-4">Connection Error</h2>
          <p className="text-gray-600 font-medium text-lg mb-6">{error}</p>
          <button 
            onClick={() => {
              setError(null);
              setIsLoading(true);
              window.location.reload();
            }}
            className="px-8 py-4 bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-2xl hover:from-red-600 hover:to-pink-700 transition-all duration-300 font-bold shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <div className="text-center p-12 bg-white/90 backdrop-blur-md rounded-3xl shadow-2xl border border-white/50 transform hover:scale-105 transition-all duration-500">
          <div className="relative mb-8">
            <div className="animate-spin rounded-full h-20 w-20 border-4 border-blue-200 border-t-blue-600 mx-auto"></div>
            <div className="absolute inset-0 rounded-full h-20 w-20 border-4 border-purple-200 border-b-purple-600 mx-auto animate-spin" style={{animationDirection: 'reverse', animationDuration: '1.5s'}}></div>
          </div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent mb-4">
            Loading Chat
          </h2>
          <p className="text-gray-600 font-medium text-lg mb-4">Setting up your conversation space...</p>
          <div className="flex justify-center space-x-2">
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
            <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <AccessWrapper>
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-50/30 to-white relative overflow-hidden">
        {/* Subtle background pattern */}
        <div className="absolute inset-0 opacity-[0.02]">
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#ec4899" strokeWidth="1"/>
              </pattern>
              <pattern id="dots" width="20" height="20" patternUnits="userSpaceOnUse">
                <circle cx="10" cy="10" r="1.5" fill="#f472b6"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
            <rect width="100%" height="100%" fill="url(#dots)" />
          </svg>
        </div>

        {/* Floating decorative elements */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-br from-pink-200/10 to-rose-300/10 rounded-full blur-2xl animate-pulse"></div>
          <div className="absolute top-40 right-20 w-24 h-24 bg-gradient-to-br from-rose-200/15 to-pink-300/15 rounded-full blur-xl animate-pulse" style={{animationDelay: '2s'}}></div>
          <div className="absolute bottom-32 left-1/4 w-20 h-20 bg-gradient-to-br from-pink-100/20 to-rose-200/20 rounded-full blur-lg animate-pulse" style={{animationDelay: '4s'}}></div>
          <div className="absolute bottom-20 right-1/3 w-28 h-28 bg-gradient-to-br from-rose-100/20 to-pink-200/20 rounded-full blur-xl animate-pulse" style={{animationDelay: '6s'}}></div>
        </div>

        <div className="relative z-10 h-screen flex flex-col md:flex-row max-w-7xl mx-auto bg-white/40 backdrop-blur-sm shadow-2xl border border-white/50">

      {/* Chat Rooms Sidebar */}
      <div className={`${!isMounted ? 'block' : selectedChatRoom ? 'hidden sm:block' : 'block'} w-full sm:w-80 bg-gradient-to-br from-white via-pink-50/30 to-pink-100/40 backdrop-blur-xl border-r border-pink-200/50 shadow-2xl`}>

        <div className="p-6 border-b border-pink-200/30 bg-white/60 backdrop-blur-md">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-rose-500 rounded-2xl flex items-center justify-center shadow-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-3.582 8-8 8a8.955 8.955 0 01-3.774-.9L3 21l1.9-6.226A8.955 8.955 0 013 12a8 8 0 018-8 8 8 0 018 8z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">
                Chat Rooms
              </h2>
              <p className="text-sm text-pink-600/80 font-medium">
                {chatRooms.length} active conversations
              </p>
            </div>
          </div>
          
          {/* Search Bar */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search conversations..."
              className="w-full pl-10 pr-4 py-3 bg-white/70 backdrop-blur-sm border border-pink-200/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-400/50 focus:border-pink-400 transition-all duration-300 text-pink-800 placeholder-pink-500/70 font-medium shadow-sm"
            />
          </div>
        </div>

        <div className="overflow-y-auto h-[calc(100vh-200px)] scrollbar-thin scrollbar-thumb-pink-300/50 scrollbar-track-transparent">
          {chatRooms.length === 0 ? (
            <div className="flex items-center justify-center h-full p-8">
              <div className="text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-pink-200/80 to-rose-200/80 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <svg className="w-10 h-10 text-pink-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a2 2 0 01-2-2v-2M5 8h2m0 0V6a2 2 0 012-2h6a2 2 0 012 2v2m-6 0h4" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-pink-700 mb-3">No Conversations Yet</h3>
                <p className="text-sm text-pink-600/80 font-medium leading-relaxed max-w-xs">
                  Chat rooms will appear here when users start conversations with you
                </p>
              </div>
            </div>
          ) : (
            <div className="p-4 space-y-3">
              {chatRooms.map((room) => (
                <div
                  key={room.id}
                  onClick={() => setSelectedChatRoom(room)}
                  className={`group relative p-4 rounded-2xl cursor-pointer transition-all duration-300 transform hover:scale-[1.02] hover:shadow-xl ${
                    selectedChatRoom?.id === room.id 
                      ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-2xl ring-2 ring-pink-300/50' 
                      : 'bg-white/80 backdrop-blur-sm hover:bg-white/90 shadow-lg border border-pink-100/50 hover:border-pink-200/50'
                  }`}
                >
                  {/* Online indicator */}
                  <div className={`absolute top-3 right-3 w-3 h-3 rounded-full ${
                    selectedChatRoom?.id === room.id ? 'bg-white/30' : 'bg-green-400'
                  } animate-pulse`}></div>
                  
                  <div className="flex items-start space-x-4">
                    <div className={`relative w-12 h-12 rounded-2xl flex items-center justify-center text-base font-bold shadow-lg ${
                      selectedChatRoom?.id === room.id 
                        ? 'bg-white/20 text-white' 
                        : 'bg-gradient-to-br from-pink-400 to-rose-500 text-white'
                    }`}>
                      {room.userName.charAt(0).toUpperCase()}
                      {/* Status dot */}
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white shadow-sm"></div>
                    </div>
                    
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className={`font-bold text-base truncate ${
                          selectedChatRoom?.id === room.id ? 'text-white' : 'text-pink-800'
                        }`}>
                          {room.userName}
                        </h3>
                        <span className={`text-xs font-medium ${
                          selectedChatRoom?.id === room.id ? 'text-white/70' : 'text-pink-500'
                        }`}>
                          {formatTime(room.lastMessageAt)}
                        </span>
                      </div>
                      
                      <p className={`text-sm truncate mb-2 ${
                        selectedChatRoom?.id === room.id ? 'text-white/80' : 'text-pink-600/80'
                      }`}>
                        {room.userEmail}
                      </p>
                      
                      <div className="flex items-center justify-between">
                        <p className={`text-sm truncate flex-1 mr-2 ${
                          selectedChatRoom?.id === room.id ? 'text-white/70' : 'text-pink-500'
                        }`}>
                          {room.lastMessage || 'No messages yet'}
                        </p>
                        
                        {room.unreadCount > 0 && (
                          <span className={`inline-flex items-center justify-center px-2 py-1 rounded-full text-xs font-bold min-w-[20px] h-5 ${
                            selectedChatRoom?.id === room.id 
                              ? 'bg-white/20 text-white' 
                              : 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-md'
                          }`}>
                            {room.unreadCount > 99 ? '99+' : room.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Hover effect overlay */}
                  <div className={`absolute inset-0 rounded-2xl transition-opacity duration-300 ${
                    selectedChatRoom?.id === room.id 
                      ? 'bg-white/5 opacity-100' 
                      : 'bg-gradient-to-r from-pink-500/5 to-rose-500/5 opacity-0 group-hover:opacity-100'
                  }`}></div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Chat Messages Area */}
      <div className={`${!isMounted ? 'hidden sm:block' : selectedChatRoom ? 'block' : 'hidden sm:block'} flex-1 flex flex-col bg-gradient-to-br from-pink-50/20 via-white/50 to-rose-50/30 backdrop-blur-sm`}>
        {selectedChatRoom ? (
          <>
            {/* Chat Header */}
            <div className="bg-white/80 backdrop-blur-xl border-b border-pink-200/30 p-6 shadow-lg">
              <div className="flex items-center space-x-4">
                <button 
                  onClick={() => setSelectedChatRoom(null)}
                  className="sm:hidden p-2 rounded-xl hover:bg-pink-100/50 transition-all duration-300 group"
                >
                  <svg className="w-6 h-6 text-pink-600 group-hover:text-pink-700 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <div className="relative w-14 h-14 bg-gradient-to-br from-pink-400 to-rose-500 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-xl">
                  {selectedChatRoom.userName.charAt(0).toUpperCase()}
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-400 rounded-full border-3 border-white shadow-lg animate-pulse"></div>
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-bold text-xl text-pink-800 truncate mb-1">{selectedChatRoom.userName}</h3>
                  <p className="text-sm text-pink-600/80 font-medium truncate mb-2">{selectedChatRoom.userEmail}</p>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse shadow-sm"></div>
                    <span className="text-sm text-green-600 font-semibold">Active now</span>
                  </div>
                </div>
                <div className="hidden sm:flex items-center space-x-2">
                  {/* Call and video icons removed as requested */}
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gradient-to-b from-transparent via-pink-50/10 to-rose-50/20 scrollbar-thin scrollbar-thumb-pink-300/30 scrollbar-track-transparent">
              {messages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center p-8 max-w-md">
                    <div className="w-24 h-24 bg-gradient-to-br from-pink-200/60 to-rose-200/60 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-lg">
                      <svg className="w-12 h-12 text-pink-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-3.582 8-8 8a8.955 8.955 0 01-3.774-.9L3 21l1.9-6.226A8.955 8.955 0 013 12a8 8 0 018-8 8 8 0 018 8z" />
                      </svg>
                    </div>
                    <h3 className="text-2xl font-bold text-pink-700 mb-4">Start the conversation</h3>
                    <p className="text-base text-pink-600/80 leading-relaxed font-medium">
                      Send a message to begin chatting with {selectedChatRoom.userName}
                    </p>
                  </div>
                </div>
              ) : (
                messages.map((message, index) => {
                  const isAdmin = message.senderType === 'admin';
                  const isConsecutive = index > 0 && messages[index - 1].senderType === message.senderType;
                  
                  return (
                    <div
                      key={message.id}
                      className={`flex ${isAdmin ? 'justify-end' : 'justify-start'} ${isConsecutive ? 'mt-2' : 'mt-6'}`}
                    >
                      <div className={`group relative max-w-[75%] ${isAdmin ? 'order-2' : 'order-1'}`}>
                        {/* Message bubble */}
                        <div className={`relative p-4 rounded-2xl shadow-lg transition-all duration-300 hover:shadow-xl transform hover:scale-[1.02] ${
                          isAdmin 
                            ? 'bg-gradient-to-br from-pink-500 to-rose-500 text-white ml-4' 
                            : 'bg-white/90 backdrop-blur-sm text-pink-800 border border-pink-100/50 mr-4'
                        } ${
                          isAdmin 
                            ? 'rounded-br-md' 
                            : 'rounded-bl-md'
                        }`}>
                          
                          {/* Message tail */}
                          <div className={`absolute top-4 w-3 h-3 transform rotate-45 ${
                            isAdmin 
                              ? '-right-1 bg-gradient-to-br from-pink-500 to-rose-500' 
                              : '-left-1 bg-white border-l border-b border-pink-100/50'
                          }`}></div>
                          
                          {message.type === 'text' ? (
                            <p className="text-sm leading-relaxed font-medium break-words">{message.content}</p>
                          ) : (
                            <div className="space-y-3">
                              {message.imageUrl && (
                                <div className="relative w-56 h-40 rounded-xl overflow-hidden shadow-md">
                                  <img
                                    src={message.imageUrl}
                                    alt={message.imageName || 'Shared image'}
                                    className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform duration-300"
                                    onClick={() => window.open(message.imageUrl, '_blank')}
                                  />
                                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-2">
                                    <span className="text-white text-xs font-medium bg-black/30 px-2 py-1 rounded-full backdrop-blur-sm">
                                      Click to view full size
                                    </span>
                                  </div>
                                </div>
                              )}
                              <p className="text-xs opacity-75 font-medium">{message.imageName}</p>
                            </div>
                          )}
                          
                          {/* Message info */}
                          <div className={`flex items-center justify-between mt-3 pt-2 border-t ${
                            isAdmin ? 'border-white/20' : 'border-pink-100/50'
                          }`}>
                            <span className={`text-xs font-medium ${
                              isAdmin ? 'text-white/70' : 'text-pink-500'
                            }`}>
                              {formatTime(message.timestamp)}
                            </span>
                            {isAdmin && (
                              <div className="flex items-center space-x-1">
                                <svg className="w-4 h-4 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                <span className="text-xs text-white/70 font-medium">Sent</span>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {/* Sender avatar for non-consecutive messages */}
                        {!isConsecutive && (
                          <div className={`absolute top-0 w-8 h-8 rounded-full shadow-md ${
                            isAdmin 
                              ? '-right-2 bg-gradient-to-br from-pink-400 to-rose-400' 
                              : '-left-2 bg-gradient-to-br from-gray-400 to-gray-500'
                          } flex items-center justify-center text-white text-xs font-bold`}>
                            {isAdmin ? 'A' : message.senderName.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="bg-white/90 backdrop-blur-xl border-t border-pink-200/30 p-6 shadow-2xl">
              <div className="flex items-end space-x-4 max-w-4xl mx-auto">
                {/* Image upload button */}
                <div className="relative group">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                    accept="image/*"
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="p-3 bg-gradient-to-br from-pink-100 to-rose-100 hover:from-pink-200 hover:to-rose-200 text-pink-600 rounded-2xl transition-all duration-300 hover:shadow-lg hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed group-hover:rotate-12 transform"
                  >
                    {isUploading ? (
                      <div className="w-6 h-6 border-2 border-pink-600 border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <svg className="w-6 h-6 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    )}
                  </button>
                  <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-3 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none whitespace-nowrap">
                    Upload image
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                  </div>
                </div>

                {/* Message input container */}
                <div className="flex-1 relative">
                  <div className="relative bg-gradient-to-r from-pink-50/80 to-rose-50/80 backdrop-blur-sm rounded-2xl border border-pink-200/50 focus-within:border-pink-400/60 focus-within:shadow-lg transition-all duration-300 group">
                    <textarea
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => {
                         if (e.key === 'Enter' && !e.shiftKey) {
                           e.preventDefault();
                           sendMessage();
                         }
                       }}
                      placeholder="Type your message... (Press Enter to send, Shift+Enter for new line)"
                      className="w-full p-4 pr-16 bg-transparent border-none outline-none resize-none text-pink-800 placeholder-pink-400/70 font-medium leading-relaxed min-h-[56px] max-h-32 scrollbar-thin scrollbar-thumb-pink-300/30 scrollbar-track-transparent"
                      rows={1}
                      style={{
                        height: 'auto',
                        minHeight: '56px',
                        maxHeight: '128px'
                      }}
                      onInput={(e) => {
                        const target = e.target as HTMLTextAreaElement;
                        target.style.height = 'auto';
                        target.style.height = Math.min(target.scrollHeight, 128) + 'px';
                      }}
                    />
                    
                    {/* Character count indicator */}
                    {newMessage.length > 0 && (
                      <div className="absolute bottom-2 left-4 text-xs text-pink-400/60 font-medium">
                        {newMessage.length} characters
                      </div>
                    )}
                    
                    {/* Typing indicator */}
                    <div className="absolute top-2 right-2 flex items-center space-x-1 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300">
                      <div className="w-1.5 h-1.5 bg-pink-400 rounded-full animate-bounce"></div>
                      <div className="w-1.5 h-1.5 bg-pink-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                      <div className="w-1.5 h-1.5 bg-pink-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                    </div>
                  </div>
                  
                  {/* Quick emoji reactions */}
                  <div className="absolute -top-12 left-0 flex items-center space-x-2 opacity-0 group-focus-within:opacity-100 transition-all duration-300 transform translate-y-2 group-focus-within:translate-y-0">
                    {['👍', '❤️', '😊', '😂', '🎉'].map((emoji, index) => (
                      <button
                        key={emoji}
                        onClick={() => setNewMessage(prev => prev + emoji)}
                        className="w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full shadow-lg hover:shadow-xl hover:scale-110 transition-all duration-300 flex items-center justify-center text-sm border border-pink-200/50 hover:border-pink-400/60"
                        style={{animationDelay: `${index * 0.1}s`}}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Send button */}
                <div className="relative group">
                  <button
                     onClick={sendMessage}
                     disabled={!newMessage.trim() || isSending}
                    className="p-3 bg-gradient-to-br from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white rounded-2xl transition-all duration-300 hover:shadow-lg hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 group-hover:rotate-12 transform"
                  >
                    {isSending ? (
                      <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <svg className="w-6 h-6 transition-transform group-hover:scale-110 group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                    )}
                  </button>
                  <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-3 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none whitespace-nowrap">
                    Send message
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                  </div>
                </div>
              </div>
              
              {/* Status indicators */}
              <div className="flex items-center justify-between mt-4 px-2">
                <div className="flex items-center space-x-4 text-xs text-pink-500/70">
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="font-medium">Connected</span>
                  </div>
                  {isUploading && (
                    <div className="flex items-center space-x-1">
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                      <span className="font-medium">Uploading image...</span>
                    </div>
                  )}
                  {isSending && (
                    <div className="flex items-center space-x-1">
                      <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                      <span className="font-medium">Sending message...</span>
                    </div>
                  )}
                </div>
                
                <div className="text-xs text-pink-400/60 font-medium">
                  Press Enter to send • Shift+Enter for new line
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-pink-50/50 to-pink-50/50 p-1">
            <div className="text-center p-2 max-w-xs mx-auto">
              <div className="w-6 h-6 bg-gradient-to-br from-pink-400 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-2 shadow-xl">
                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-3.582 8-8 8a8.955 8.955 0 01-3.774-.9L3 21l1.9-6.226A8.955 8.955 0 013 12a8 8 0 018-8 8 8 0 018 8z" />
                </svg>
              </div>
              <h3 className="text-[8px] font-bold bg-gradient-to-r from-pink-600 to-pink-600 bg-clip-text text-transparent mb-1">Select a conversation</h3>
              <p className="text-pink-600 font-medium text-[6px] mb-2">Choose a chat from the sidebar to start messaging</p>
              <div className="p-1 bg-white/60 backdrop-blur-sm rounded-lg border border-white/50 shadow-md">
                <p className="text-[6px] text-pink-500">💬 Professional chat interface for seamless communication</p>
              </div>
            </div>
          </div>
        )}
      </div>
      </div>
    </div>
    
    {/* Notification Toast Container */}
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className="bg-white/95 backdrop-blur-sm border border-pink-200/50 rounded-xl p-4 shadow-2xl transform animate-in slide-in-from-right-5 duration-300 max-w-sm"
        >
          <div className="flex items-start space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-rose-500 rounded-full flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-3.582 8-8 8a8.955 8.955 0 01-3.774-.9L3 21l1.9-6.226A8.955 8.955 0 013 12a8 8 0 018-8 8 8 0 018 8z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-pink-800 mb-1">New Message</p>
              <p className="text-sm text-pink-600/80 break-words">{notification.message}</p>
            </div>
            <button
              onClick={() => setNotifications(prev => prev.filter(n => n.id !== notification.id))}
              className="text-pink-400 hover:text-pink-600 transition-colors duration-200 flex-shrink-0"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      ))}
    </div>
    
    {/* New Message Indicator */}
    {hasNewMessage && (
      <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50">
        <div className="bg-gradient-to-r from-pink-500 to-rose-500 text-white px-6 py-3 rounded-full shadow-2xl animate-bounce">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            <span className="text-sm font-semibold">New messages available</span>
            <button
              onClick={() => setHasNewMessage(false)}
              className="text-white/80 hover:text-white transition-colors duration-200"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    )}
    
    </AccessWrapper>
  );
}

// Wrapper component that handles early returns before any hooks
export default function ChatPage() {
  // Check if Firebase is configured - must be first
  if (!isFirebaseConfigured()) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center p-8 bg-white rounded-lg shadow-md max-w-md">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Chat Service Unavailable</h2>
          <p className="text-gray-600 mb-4">
            Firebase is not configured. Please set up your Firebase environment variables to use the chat feature.
          </p>
          <p className="text-sm text-gray-500">
            Contact your administrator for assistance with Firebase configuration.
          </p>
        </div>
      </div>
       
    );
  }

  // Additional safety check for db and storage
  if (!db || !storage) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center p-8 bg-white rounded-lg shadow-md max-w-md">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Database Service Unavailable</h2>
          <p className="text-gray-600 mb-4">
            Firebase database or storage is not available. Please check your configuration.
          </p>
        </div>
      </div>
     
    );
  }

  // Render the main chat component
  return <ChatComponent />;
}



