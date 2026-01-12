'use client';

import { AuthProvider } from './auth-provider';
// import { CartProvider } from './cart-provider';
import { WishlistProvider } from './wishlist-provider';

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <AuthProvider>
      {/* <CartProvider> */}
      <WishlistProvider>
        {children}
      </WishlistProvider>
      {/* </CartProvider> */}
    </AuthProvider>
  );
}