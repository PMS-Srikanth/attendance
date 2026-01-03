/**
 * User-specific storage utility for Zustand persist
 * Ensures each logged-in user has isolated data
 */

import { StateStorage } from 'zustand/middleware';
import { getAuth } from 'firebase/auth';

// Get current user email from Firebase auth
export const getCurrentUserEmail = (): string | null => {
  // First try localStorage (set by AuthContext)
  try {
    const storedEmail = localStorage.getItem('currentUserEmail');
    if (storedEmail) {
      return storedEmail;
    }
  } catch (e) {
    console.error('Error reading currentUserEmail from localStorage:', e);
  }
  
  // Fallback to Firebase auth
  try {
    const auth = getAuth();
    const user = auth.currentUser;
    if (user?.email) {
      return user.email;
    }
  } catch (e) {
    console.error('Error getting current user from Firebase:', e);
  }
  
  return null;
};

// Create user-specific storage key
export const getUserStorageKey = (baseKey: string, userEmail?: string | null): string => {
  const email = userEmail || getCurrentUserEmail();
  if (!email) {
    console.warn(`No user email found for key: ${baseKey}, using non-user-specific key`);
    return baseKey;
  }
  return `${email}:${baseKey}`;
};

// Custom storage that prefixes keys with user email
export const createUserStorage = (baseName: string): StateStorage => {
  let currentUserEmail: string | null = null;
  
  return {
    getItem: (name: string): string | null => {
      const email = getCurrentUserEmail();
      const key = getUserStorageKey(baseName, email);
      
      // Track email changes
      if (currentUserEmail && email && currentUserEmail !== email) {
        console.log(`[Storage] User changed from ${currentUserEmail} to ${email} for ${baseName}`);
      }
      currentUserEmail = email;
      
      const value = localStorage.getItem(key);
      console.log(`[Storage] GET ${key}:`, value ? 'found' : 'not found');
      return value;
    },
    setItem: (name: string, value: string): void => {
      const email = getCurrentUserEmail();
      const key = getUserStorageKey(baseName, email);
      currentUserEmail = email;
      console.log(`[Storage] SET ${key}`);
      localStorage.setItem(key, value);
    },
    removeItem: (name: string): void => {
      const email = getCurrentUserEmail();
      const key = getUserStorageKey(baseName, email);
      console.log(`[Storage] REMOVE ${key}`);
      localStorage.removeItem(key);
    },
  };
};

// Helper functions for direct localStorage access with user-specific keys
export const userLocalStorage = {
  getItem: (key: string): string | null => {
    const userKey = getUserStorageKey(key);
    return localStorage.getItem(userKey);
  },
  setItem: (key: string, value: string): void => {
    const userKey = getUserStorageKey(key);
    localStorage.setItem(userKey, value);
  },
  removeItem: (key: string): void => {
    const userKey = getUserStorageKey(key);
    localStorage.removeItem(userKey);
  },
  getAllUserData: (): Record<string, any> => {
    const email = getCurrentUserEmail();
    if (!email) return {};
    
    const userData: Record<string, any> = {};
    const prefix = `${email}:`;
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(prefix)) {
        const value = localStorage.getItem(key);
        if (value) {
          try {
            userData[key.substring(prefix.length)] = JSON.parse(value);
          } catch {
            userData[key.substring(prefix.length)] = value;
          }
        }
      }
    }
    
    return userData;
  },
};
