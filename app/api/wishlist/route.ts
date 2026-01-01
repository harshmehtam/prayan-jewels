import { NextRequest, NextResponse } from 'next/server';
import { WishlistService } from '@/lib/data/wishlist';

export async function GET(request: NextRequest) {
  try {
    // Check for authentication
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Authentication required' 
        },
        { status: 401 }
      );
    }

    // TODO: Decode JWT token to get user ID
    // For now, we'll use a placeholder
    const customerId = 'placeholder-user-id';

    const { searchParams } = new URL(request.url);
    const includeProducts = searchParams.get('includeProducts') === 'true';

    let result;
    if (includeProducts) {
      result = await WishlistService.getWishlistWithProducts(customerId);
    } else {
      result = await WishlistService.getUserWishlist(customerId);
    }

    return NextResponse.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Error fetching wishlist:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch wishlist';
    
    return NextResponse.json(
      { 
        success: false, 
        error: errorMessage 
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check for authentication
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Authentication required' 
        },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { productId } = body;

    if (!productId) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Product ID is required' 
        },
        { status: 400 }
      );
    }

    // TODO: Decode JWT token to get user ID
    const customerId = 'placeholder-user-id';

    const result = await WishlistService.addToWishlist(customerId, productId);

    if (result.errors) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to add to wishlist',
          details: result.errors 
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        item: result.item,
        alreadyExists: result.alreadyExists
      }
    });

  } catch (error) {
    console.error('Error adding to wishlist:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to add to wishlist';
    
    return NextResponse.json(
      { 
        success: false, 
        error: errorMessage 
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Check for authentication
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Authentication required' 
        },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');
    const itemId = searchParams.get('itemId');

    if (!productId && !itemId) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Product ID or Item ID is required' 
        },
        { status: 400 }
      );
    }

    // TODO: Decode JWT token to get user ID
    const customerId = 'placeholder-user-id';

    let result;
    if (itemId) {
      result = await WishlistService.removeWishlistItem(itemId);
    } else if (productId) {
      result = await WishlistService.removeFromWishlist(customerId, productId);
    }

    if (result?.errors) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to remove from wishlist',
          details: result.errors 
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Item removed from wishlist'
    });

  } catch (error) {
    console.error('Error removing from wishlist:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to remove from wishlist';
    
    return NextResponse.json(
      { 
        success: false, 
        error: errorMessage 
      },
      { status: 500 }
    );
  }
}