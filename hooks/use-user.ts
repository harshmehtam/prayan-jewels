'use client';

import { useState, useEffect } from 'react';
import { getCurrentUser } from '@/app/actions/auth-actions';
import type { AuthUserProfile } from '@/lib/services/auth-service';

interface UseUserReturn {
  user: AuthUserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  refreshUser: () => Promise<void>;
}

/**
 * Client-side hook to access user data
 * Fetches user from server action on mount
 */
export function useUser(): UseUserReturn {
  const [user, setUser] = useState<AuthUserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUser = async () => {
    try {
      const userData = await getCurrentUser();
      setUser(userData);
    } catch (error) {
      console.error('Error fetching user:', error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    refreshUser: fetchUser,
  };
}
