import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import type { User } from 'firebase/auth';
import { ref, get } from 'firebase/database';
import { auth, database } from '../services/firebase';

interface UserProfile {
  uid: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  role: 'client' | 'worker';
  createdAt: string;
  photoUrl?: string;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  role: 'client' | 'worker' | null;
  loading: boolean;
  setProfileAndRole: (profile: UserProfile | null) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [role, setRole] = useState<'client' | 'worker' | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserProfile = async (uid: string): Promise<UserProfile | null> => {
    try {
      const userRef = ref(database, `users/${uid}`);
      const snapshot = await get(userRef);
      if (snapshot.exists()) {
        return snapshot.val() as UserProfile;
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
    return null;
  };

  const setProfileAndRole = (newProfile: UserProfile | null) => {
    setProfile(newProfile);
    setRole(newProfile ? newProfile.role : null);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        const userProfile = await fetchUserProfile(firebaseUser.uid);
        if (userProfile) {
          setProfile(userProfile);
          setRole(userProfile.role);
        } else {
          setProfile(null);
          setRole(null);
        }
      } else {
        setProfile(null);
        setRole(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const logout = async () => {
    setLoading(true);
    try {
      await firebaseSignOut(auth);
      setUser(null);
      setProfile(null);
      setRole(null);
    } catch (error) {
      console.error('Error signing out:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, profile, role, loading, setProfileAndRole, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
