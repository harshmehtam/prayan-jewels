'use client';

import { useEffect } from 'react';
import { useAuth } from '@/components/providers/auth-provider';
import { UserService } from '@/lib/data/users';

export function useUserProfile() {
  const { user, userProfile, refreshUserProfile } = useAuth();

  // Create user profile if it doesn't exist
  useEffect(() => {
    const createProfileIfNeeded = async () => {
      if (user?.userId && !userProfile) {
        try {
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

    createProfileIfNeeded();
  }, [user, userProfile, refreshUserProfile]);

  return { user, userProfile, refreshUserProfile };
}