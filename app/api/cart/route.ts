import { NextRequest, NextResponse } from 'next/server';
import { CartService } from '@/lib/data/cart';
import { generateSessionId } from '@/lib/amplify-client';

export async function GET(request: NextRequest) {
  try {
    let cart;
    
    // Check for authentication header or session
    const authHeader = request.headers.get('authorization');
    const sessionId = request.headers.get('x-session-id') || 
                     new URL(request.url).searchParams.get('sessionId') || 
                     generateSessionId();
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      // For authenticated users, we would need to decode the JWT token
      // For now, we'll use session-based approach
      try {
        const result = await CartService.getGuestCart(sessionId);
        cart = result.cart;
      } catch (error) {
        console.error('Error getting cart:', error);
        const result = await CartService.getGuestCart(generateSessionId());
        cart = result.cart;
      }
    } else {
      // Guest user
      const result = await CartService.getGuestCart(sessionId);
      cart = result.cart;
    }

    // Get cart items
    const itemsResult = await CartService.getCartItems(cart.id);
    
    return NextResponse.json({
      success: true,
      data: {
        cart,
        items: itemsResult.items,
        sessionId: cart.sessionId || sessionId
      }
    });

  } catch (error) {
    console.error('Error fetching cart:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch cart';
    
    return NextResponse.json(
      { 
        success: false, 
        error: errorMessage 
      },
      { status: 500 }
    );
  }
}