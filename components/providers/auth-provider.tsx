'use client';

import '@/lib/amplify-config'; // Ensure Amplify is configured
import React, { createContext, useContext, useEffect, useState } from 'react';
import { getCurrentUser, signOut, type AuthUser, fetchUserAttributes } from 'aws-amplify/auth';
import { UserService } from '@/lib/data/users';

// Define a simplified user profile type for the auth context
interface AuthUserProfile {
  id: string;
  userId: string;
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
  dateOfBirth?: string | null;
  newsletter?: boolean | null;
  smsUpdates?: boolean | null;
  preferredCategories?: (string | null)[] | null;
  role?: 'customer' | 'admin' | 'super_admin' | null;
  createdAt: string;
  updatedAt: string;
}

interface AuthContextType {
  user: AuthUser | null;
  userProfile: AuthUserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signOut: () => Promise<void>;
  refreshUserProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [userProfile, setUserProfile] = useState<AuthUserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUserProfile = async () => {
    if (user?.userId) {
      try {
        const profileResponse = await UserService.getUserProfile(user.userId);
        if (profileResponse.profile) {
          // Convert the Amplify types to our simplified types
          setUserProfile({
            id: profileResponse.profile.id,
            userId: profileResponse.profile.userId,
            firstName: profileResponse.profile.firstName,
            lastName: profileResponse.profile.lastName,
            phone: profileResponse.profile.phone,
            dateOfBirth: profileResponse.profile.dateOfBirth,
            newsletter: profileResponse.profile.newsletter,
            smsUpdates: profileResponse.profile.smsUpdates,
            preferredCategories: profileResponse.profile.preferredCategories,
            role: profileResponse.profile.role,
            createdAt: profileResponse.profile.createdAt,
            updatedAt: profileResponse.profile.updatedAt,
          });
        } else {
          setUserProfile(null);
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
        setUserProfile(null);
      }
    } else {
      setUserProfile(null);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      setUser(null);
      setUserProfile(null);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  useEffect(() => {
    const checkAuthState = async () => {
      try {
        const currentUser = await getCurrentUser();
        setUser(currentUser);
        
        // Fetch user profile
        if (currentUser?.userId) {
          await refreshUserProfile();
        }
      } catch (error) {
        // User is not authenticated
        setUser(null);
        setUserProfile(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthState();
  }, []);

  // Refresh user profile when user changes
  useEffect(() => {
    if (user) {
      refreshUserProfile();
    }
  }, [user]);

  // Create user profile if it doesn't exist after authentication
  useEffect(() => {
    const createProfileIfNeeded = async () => {
      if (user?.userId && !userProfile) {
        try {
          // Wait a bit for the profile to load first
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Check if profile exists
          const existingProfile = await UserService.getUserProfile(user.userId);
          
          if (!existingProfile.profile) {
            // Create a basic profile
            await UserService.createUserProfile(user.userId, {
              role: 'customer',
              newsletter: false,
              smsUpdates: false,
              preferredCategories: [],
            });
            
            // Refresh the profile
            await refreshUserProfile();
          }
        } catch (error) {
          console.error('Error creating user profile:', error);
        }
      }
    };

    if (user && !userProfile) {
      createProfileIfNeeded();
    }
  }, [user, userProfile, refreshUserProfile]);

  const value: AuthContextType = {
    user,
    userProfile,
    isLoading,
    isAuthenticated: !!user,
    signOut: handleSignOut,
    refreshUserProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}