import { useState, useEffect } from 'react';
import { getCurrentUser } from 'aws-amplify/auth';

/**
 * Determines the appropriate auth mode based on user authentication status
 * - Returns 'userPool' for authenticated users
 * - Returns 'iam' for guest users (unauthenticated)
 */
export const getAuthMode = async (): Promise<'userPool' | 'iam'> => {
  try {
    await getCurrentUser();
    // User is authenticated, use userPool mode
    return 'userPool';
  } catch (error) {
    // User is not authenticated, use iam mode for guest access
    return 'iam';
  }
};

/**
 * Hook to get auth mode reactively
 */
export const useAuthMode = () => {
  const [authMode, setAuthMode] = useState<'userPool' | 'iam'>('iam');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const determineAuthMode = async () => {
      try {
        const mode = await getAuthMode();
        setAuthMode(mode);
      } catch (error) {
        console.error('Error determining auth mode:', error);
        setAuthMode('iam'); // Default to guest mode on error
      } finally {
        setLoading(false);
      }
    };

    determineAuthMode();
  }, []);

  return { authMode, loading };
};