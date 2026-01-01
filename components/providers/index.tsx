'use client';

import { AuthProvider } from './mock-auth-provider';
import { CartProvider } from './cart-provider';

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <AuthProvider>
      <CartProvider>
        {children}
      </CartProvider>
    </AuthProvider>
  );
}