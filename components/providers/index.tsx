'use client';

import { Amplify } from 'aws-amplify';
import { AuthProvider } from './auth-provider';
import { CartProvider } from './cart-provider';
import { WishlistProvider } from './wishlist-provider';
import outputs from '@/amplify_outputs.json';

// Configure Amplify
Amplify.configure(outputs, { ssr: true });

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <AuthProvider>
      <CartProvider>
        <WishlistProvider>
          {children}
        </WishlistProvider>
      </CartProvider>
    </AuthProvider>
  );
}