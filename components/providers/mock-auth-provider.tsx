'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

// Mock auth user type
interface MockAuthUser {
  userId: string;
  username: string;
}

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
  user: MockAuthUser | null;
  userProfile: AuthUserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signOut: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, firstName: string, lastName: string) => Promise<void>;
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

// Mock user data
const mockUsers: Array<{
  id: string;
  userId: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  dateOfBirth: string | null;
  newsletter: boolean;
  smsUpdates: boolean;
  preferredCategories: string[];
  role: 'customer' | 'admin' | 'super_admin';
  createdAt: string;
  updatedAt: string;
}> = [
  {
    id: 'user-1',
    userId: 'user-1',
    email: 'john@example.com',
    password: 'password123',
    firstName: 'John',
    lastName: 'Doe',
    phone: '+91 9876543210',
    dateOfBirth: '1990-01-15',
    newsletter: true,
    smsUpdates: false,
    preferredCategories: ['traditional', 'modern'],
    role: 'customer' as const,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'user-2',
    userId: 'user-2',
    email: 'admin@example.com',
    password: 'admin123',
    firstName: 'Admin',
    lastName: 'User',
    phone: '+91 9876543211',
    dateOfBirth: '1985-05-20',
    newsletter: true,
    smsUpdates: true,
    preferredCategories: ['traditional', 'modern', 'designer'],
    role: 'admin' as const,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  }
];

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<MockAuthUser | null>(null);
  const [userProfile, setUserProfile] = useState<AuthUserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Check for existing session on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('mock_auth_user');
    if (storedUser) {
      const userData = JSON.parse(storedUser);
      setUser(userData);
      
      // Find and set user profile
      const profile = mockUsers.find(u => u.userId === userData.userId);
      if (profile) {
        setUserProfile(profile);
      }
    }
  }, []);

  // Helper function to set auth cookie
  const setAuthCookie = (userData: MockAuthUser) => {
    // Set cookie for middleware to access
    document.cookie = `mock_auth_user=${JSON.stringify(userData)}; path=/; max-age=${60 * 60 * 24 * 7}`; // 7 days
  };

  // Helper function to remove auth cookie
  const removeAuthCookie = () => {
    document.cookie = 'mock_auth_user=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
  };

  const handleSignIn = async (email: string, password: string) => {
    setIsLoading(true);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const foundUser = mockUsers.find(u => u.email === email && u.password === password);
    
    if (foundUser) {
      const authUser = {
        userId: foundUser.userId,
        username: foundUser.email,
      };
      
      setUser(authUser);
      setUserProfile(foundUser);
      
      // Store in localStorage and cookie
      localStorage.setItem('mock_auth_user', JSON.stringify(authUser));
      setAuthCookie(authUser);
    } else {
      throw new Error('Invalid email or password');
    }
    
    setIsLoading(false);
  };

  const handleSignUp = async (email: string, password: string, firstName: string, lastName: string) => {
    setIsLoading(true);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Check if user already exists
    const existingUser = mockUsers.find(u => u.email === email);
    if (existingUser) {
      setIsLoading(false);
      throw new Error('User already exists');
    }
    
    // Create new user
    const newUser = {
      id: `user-${Date.now()}`,
      userId: `user-${Date.now()}`,
      email,
      password,
      firstName,
      lastName,
      phone: null as string | null,
      dateOfBirth: null as string | null,
      newsletter: false,
      smsUpdates: false,
      preferredCategories: [] as string[],
      role: 'customer' as const,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    // Add to mock users (in real app, this would be saved to backend)
    mockUsers.push(newUser);
    
    const authUser = {
      userId: newUser.userId,
      username: newUser.email,
    };
    
    setUser(authUser);
    setUserProfile(newUser);
    
    // Store in localStorage and cookie
    localStorage.setItem('mock_auth_user', JSON.stringify(authUser));
    setAuthCookie(authUser);
    
    setIsLoading(false);
  };

  const handleSignOut = async () => {
    setUser(null);
    setUserProfile(null);
    localStorage.removeItem('mock_auth_user');
    removeAuthCookie();
  };

  const refreshUserProfile = async () => {
    if (user?.userId) {
      const profile = mockUsers.find(u => u.userId === user.userId);
      if (profile) {
        setUserProfile(profile);
      }
    }
  };

  const value: AuthContextType = {
    user,
    userProfile,
    isLoading,
    isAuthenticated: !!user,
    signOut: handleSignOut,
    signIn: handleSignIn,
    signUp: handleSignUp,
    refreshUserProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}