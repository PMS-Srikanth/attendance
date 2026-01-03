import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from 'firebase/auth';
import { onAuthChange, logOut as firebaseLogout } from '@/services/firebase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({ 
  user: null, 
  loading: true,
  logout: async () => {} 
});

export const useAuth = () => useContext(AuthContext);

// Helper to get user-specific storage key
export const getUserStorageKey = (key: string, userEmail?: string | null): string => {
  if (!userEmail) return key;
  return `${userEmail}:${key}`;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthChange((newUser) => {
      const previousEmail = localStorage.getItem('currentUserEmail');
      const newEmail = newUser?.email || null;
      
      // If user changed (different email), trigger a page reload to rehydrate stores
      if (previousEmail && newEmail && previousEmail !== newEmail) {
        console.log('[Auth] User changed, reloading stores...');
        localStorage.setItem('currentUserEmail', newEmail);
        // Force reload to rehydrate all stores with new user data
        window.location.reload();
        return;
      }
      
      setUser(newUser);
      setLoading(false);
      
      // Store user email for storage utility
      if (newEmail) {
        localStorage.setItem('currentUserEmail', newEmail);
      } else {
        localStorage.removeItem('currentUserEmail');
      }
    });

    return () => unsubscribe();
  }, []);

  const logout = async () => {
    // Clear all user-specific data from localStorage
    if (user?.email) {
      const keysToRemove = [
        'attendance-storage',
        'timetable-storage',
        'calendar-storage',
        'planner-storage',
        'timetableMetadata',
        'originalTimeSlots',
        'originalTimetable',
        'currentAttendance'
      ];
      
      keysToRemove.forEach(key => {
        localStorage.removeItem(getUserStorageKey(key, user.email));
      });
    }
    
    // Clear user email marker
    localStorage.removeItem('currentUserEmail');
    
    // Logout from Firebase
    await firebaseLogout();
    
    // Reload page to clear all in-memory state
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ user, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
