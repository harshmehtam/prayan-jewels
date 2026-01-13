'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { getCurrentUser, signOut, type AuthUser, fetchUserAttributes } from 'aws-amplify/auth';
import { fetchAuthSession } from 'aws-amplify/auth';

// Define user profile type based on Cognito attributes
interface AuthUserProfile {
  userId: string;
  email?: string;
  phone?: string;
  firstName?: string; // givenName
  lastName?: string;  // familyName
  groups?: string[]; // User groups from Cognito
  role?: 'customer' | 'admin' | 'super_admin'; // Derived from groups
}

interface AuthContextType {
  user: AuthUser | null;
  userProfile: AuthUserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signOut: () => Promise<void>;
  refreshUserProfile: () => Promise<void>;
  refreshAuthState: () => Promise<void>;
  // updateUserProfile: (updates: Partial<AuthUserProfile>) => Promise<void>;
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

  const createProfileFromAttributes = async (user: AuthUser, attributes: Record<string, string>): Promise<AuthUserProfile> => {
    // Get user groups from Cognito
    let groups: string[] = [];
    let role: 'customer' | 'admin' | 'super_admin' = 'customer';
    
    try {
      const session = await fetchAuthSession();
      const accessToken = session.tokens?.accessToken;
      if (accessToken) {
        groups = accessToken.payload['cognito:groups'] as string[] || [];
        
        // Determine role based on groups (priority: super_admin > admin > customer)
        if (groups.includes('super_admin')) {
          role = 'super_admin';
        } else if (groups.includes('admin')) {
          role = 'admin';
        } else {
          role = 'customer';
        }
      }
    } catch (error) {
      console.log('Could not fetch user groups:', error);
    }

    return {
      userId: user.userId,
      email: attributes.email,
      phone: attributes.phone_number,
      firstName: attributes.given_name,
      lastName: attributes.family_name,
      groups,
      role,
    };
  };

  const refreshUserProfile = async () => {
    if (user?.userId) {
      try {
        const attributes = await fetchUserAttributes();
        const profile = await createProfileFromAttributes(user, attributes as Record<string, string>);
        setUserProfile(profile);
      } catch (error) {
        setUserProfile(null);
      }
    } else {
      setUserProfile(null);
    }
  };

  // const updateUserProfile = async (updates: Partial<AuthUserProfile>) => {
  //   try {
  //     const attributeUpdates: Record<string, string> = {};
  //     if (updates.firstName !== undefined) attributeUpdates.given_name = updates.firstName || '';
  //     if (updates.lastName !== undefined) attributeUpdates.family_name = updates.lastName || '';
  //     await updateUserAttributes({ userAttributes: attributeUpdates });
      
  //     // Refresh the profile to get updated data
  //     await refreshUserProfile();
  //   } catch (error) {
  //     throw error;
  //   }
  // };

  const handleSignOut = async () => {
    try {
      await signOut();
      setUser(null);
      setUserProfile(null);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const refreshAuthState = async () => {
    try {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
      if (currentUser?.userId) {
        await refreshUserProfile();
      }
    } catch (error) {
      console.log('User not authenticated:', error);
      setUser(null);
      setUserProfile(null);
    }
  };

  useEffect(() => {
    const checkAuthState = async () => {
      try {
        const currentUser = await getCurrentUser();
        setUser(currentUser);
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
    if (user && !isLoading) {
      refreshUserProfile();
    }
  }, [user]);

  const value: AuthContextType = {
    user,
    userProfile,
    isLoading,
    isAuthenticated: !!user,
    signOut: handleSignOut,
    refreshUserProfile,
    refreshAuthState,
    // updateUserProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}