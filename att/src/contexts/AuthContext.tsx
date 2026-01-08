import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from 'firebase/auth';
import { onAuthChange, logOut as firebaseLogout } from '@/services/firebase';
import { useAttendanceStore } from '@/store/useAttendanceStore';
import { useCalendarStore } from '@/store/useCalendarStore';
import { usePlannerStore } from '@/store/usePlannerStore';
import { useTimetableStore } from '@/store/useTimetableStore';

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

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthChange((newUser) => {
      const previousEmail = localStorage.getItem('currentUserEmail');
      const newEmail = newUser?.email || null;

      setUser(newUser);
      setLoading(false);
      
      // Store user email for storage utility
      if (newEmail) {
        localStorage.setItem('currentUserEmail', newEmail);

        // When switching accounts, Zustand persist won't necessarily overwrite in-memory
        // state if the new user's storage key doesn't exist (storage.getItem returns null).
        // That can cause user A's timetable/data to appear for user B.
        //
        // Fix: for each store, if the new user has persisted state, rehydrate;
        // otherwise clear the store to a safe empty state.
        const hasUserStorageKey = (baseKey: string): boolean => {
          try {
            return localStorage.getItem(`${newEmail}:${baseKey}`) != null;
          } catch {
            return false;
          }
        };

        // Force Zustand persist stores to rehydrate using the now-known email.
        // This avoids "vanishing" data when stores initialize before auth resolves.
        try {
          if (hasUserStorageKey('attendance-storage')) {
            useAttendanceStore.persist?.rehydrate?.();
          } else {
            useAttendanceStore.getState().clearAttendance();
          }

          if (hasUserStorageKey('calendar-storage')) {
            useCalendarStore.persist?.rehydrate?.();
          } else {
            useCalendarStore.getState().clearCalendar();
          }

          if (hasUserStorageKey('timetable-storage')) {
            useTimetableStore.persist?.rehydrate?.();
          } else {
            useTimetableStore.getState().clearTimetable();
          }

          if (hasUserStorageKey('planner-storage')) {
            usePlannerStore.persist?.rehydrate?.();
          } else {
            const planner = usePlannerStore.getState();
            planner.clearPlannedRecords();
            planner.clearWarnings();
          }
        } catch (e) {
          console.warn('[Auth] Store rehydrate failed:', e);
        }

        if (previousEmail && previousEmail !== newEmail) {
          if (import.meta.env.DEV) {
            console.log('[Auth] User changed, stores rehydrated for new user');
          }
        }
      } else {
        localStorage.removeItem('currentUserEmail');
      }
    });

    return () => unsubscribe();
  }, []);

  const logout = async () => {
    // NOTE: Do not delete persisted user data on logout.
    // Users expect their uploaded data + custom calendar changes (holidays / Saturday overrides)
    // to still be present after refresh and after signing back in.
    //
    // If you ever need a "privacy mode" for shared devices, implement an explicit
    // "Clear my local data" action instead of doing it implicitly here.

    // Clear user email marker (used only for keying persisted data during this session)
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
