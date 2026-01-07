import { NextRequest, NextResponse } from 'next/server';
import { CartService } from '@/lib/data/cart';
import { ProductService } from '@/lib/data/products';
import { generateSessionId } from '@/lib/amplify-client';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { productId, quantity } = body;

    if (!productId || !quantity || quantity <= 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid product ID or quantity' 
        },
        { status: 400 }
      );
    }

    // Get product to get the unit price
    const productResult = await ProductService.getProduct(productId);
    if (!productResult.product) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Product not found' 
        },
        { status: 404 }
      );
    }

    const unitPrice = productResult.product.price;

    let cartId;
    
    // Check for authentication or use session
    const authHeader = request.headers.get('authorization');
    const sessionId = request.headers.get('x-session-id') || 
                     body.sessionId || 
                     generateSessionId();
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      // For authenticated users, we would decode JWT and get user ID
      // For now, use session-based approach
      const cartResult = await CartService.getGuestCart(sessionId);
      cartId = cartResult.cart.id;
    } else {
      // Guest user
      const cartResult = await CartService.getGuestCart(sessionId);
      cartId = cartResult.cart.id;
    }

    const result = await CartService.addItemToCart(cartId, productId, quantity, unitPrice);

    if (result.errors) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to add item to cart',
          details: result.errors 
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        cartItem: result.cartItem,
        sessionId
      }
    });

  } catch (error) {
    console.error('Error adding item to cart:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to add item to cart';
    
    return NextResponse.json(
      { 
        success: false, 
        error: errorMessage 
      },
      { status: 500 }
    );
  }
}