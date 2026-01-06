'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { getCurrentUser, signOut, type AuthUser, fetchUserAttributes, updateUserAttributes } from 'aws-amplify/auth';

// Define user profile type based on Cognito attributes
interface AuthUserProfile {
  userId: string;
  phone?: string;
  email?: string;
  firstName?: string; // givenName
  lastName?: string;  // familyName
  dateOfBirth?: string; // birthdate
  role?: 'customer' | 'admin' | 'super_admin';
  newsletter?: boolean;
  smsUpdates?: boolean;
  preferredCategories?: string[];
}

interface AuthContextType {
  user: AuthUser | null;
  userProfile: AuthUserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signOut: () => Promise<void>;
  refreshUserProfile: () => Promise<void>;
  refreshAuthState: () => Promise<void>;
  updateUserProfile: (updates: Partial<AuthUserProfile>) => Promise<void>;
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

  const createProfileFromAttributes = (user: AuthUser, attributes: Record<string, string>): AuthUserProfile => {
    return {
      userId: user.userId,
      phone: attributes.phone_number || user.username,
      email: attributes.email,
      firstName: attributes.given_name,
      lastName: attributes.family_name,
      dateOfBirth: attributes.birthdate,
      role: (attributes['custom:role'] as 'customer' | 'admin' | 'super_admin') || 'customer',
      newsletter: attributes['custom:newsletter'] === 'true',
      smsUpdates: attributes['custom:smsUpdates'] === 'true',
      preferredCategories: attributes['custom:preferredCategories'] 
        ? JSON.parse(attributes['custom:preferredCategories']) 
        : [],
    };
  };

  const refreshUserProfile = async () => {
    if (user?.userId) {
      try {
        console.log('📋 Fetching user attributes from Cognito...');
        const attributes = await fetchUserAttributes();
        console.log('👤 User Attributes:', attributes);
        
        const profile = createProfileFromAttributes(user, attributes as Record<string, string>);
        console.log('✅ Created Profile from Cognito Attributes:', profile);
        
        setUserProfile(profile);
      } catch (error) {
        console.error('❌ Error fetching user attributes:', error);
        setUserProfile(null);
      }
    } else {
      setUserProfile(null);
    }
  };

  const updateUserProfile = async (updates: Partial<AuthUserProfile>) => {
    try {
      console.log('🔄 Updating user attributes in Cognito:', updates);
      
      const attributeUpdates: Record<string, string> = {};
      
      if (updates.firstName !== undefined) attributeUpdates.given_name = updates.firstName || '';
      if (updates.lastName !== undefined) attributeUpdates.family_name = updates.lastName || '';
      if (updates.email !== undefined) attributeUpdates.email = updates.email || '';
      if (updates.dateOfBirth !== undefined) attributeUpdates.birthdate = updates.dateOfBirth || '';
      if (updates.role !== undefined) attributeUpdates['custom:role'] = updates.role || 'customer';
      if (updates.newsletter !== undefined) attributeUpdates['custom:newsletter'] = updates.newsletter.toString();
      if (updates.smsUpdates !== undefined) attributeUpdates['custom:smsUpdates'] = updates.smsUpdates.toString();
      if (updates.preferredCategories !== undefined) {
        attributeUpdates['custom:preferredCategories'] = JSON.stringify(updates.preferredCategories || []);
      }

      await updateUserAttributes({ userAttributes: attributeUpdates });
      console.log('✅ User attributes updated successfully');
      
      // Refresh the profile to get updated data
      await refreshUserProfile();
    } catch (error) {
      console.error('❌ Error updating user attributes:', error);
      throw error;
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

  const refreshAuthState = async () => {
    try {
      console.log('🔄 Refreshing Auth State...');
      const currentUser = await getCurrentUser();
      console.log('👤 Current User from Cognito:', {
        userId: currentUser.userId,
        username: currentUser.username,
        signInDetails: currentUser.signInDetails
      });
      
      setUser(currentUser);
      
      // Fetch user profile from Cognito attributes
      if (currentUser?.userId) {
        await refreshUserProfile();
      }
    } catch (error) {
      console.log('❌ User not authenticated:', error);
      // User is not authenticated
      setUser(null);
      setUserProfile(null);
    }
  };

  useEffect(() => {
    const checkAuthState = async () => {
      try {
        const currentUser = await getCurrentUser();
        setUser(currentUser);
        
        // Fetch user profile from Cognito attributes
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
    updateUserProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}