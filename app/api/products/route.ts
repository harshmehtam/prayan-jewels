import { NextRequest, NextResponse } from 'next/server';
import { ProductService } from '@/lib/services/product-service';
import type { ProductFilters } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Parse query parameters
    const minPrice = searchParams.get('minPrice') ? parseFloat(searchParams.get('minPrice')!) : undefined;
    const maxPrice = searchParams.get('maxPrice') ? parseFloat(searchParams.get('maxPrice')!) : undefined;
    const searchQuery = searchParams.get('search') || undefined;
    const sortBy = searchParams.get('sortBy') || undefined;
    const inStock = searchParams.get('inStock') === 'true';
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 20;
    const nextToken = searchParams.get('nextToken') || undefined;

    const filters: ProductFilters = {
      minPrice,
      maxPrice,
      searchQuery,
      sortBy: sortBy as ProductFilters['sortBy'],
      inStock: inStock || undefined
    };

    const result = await ProductService.getProducts(filters, limit);

    return NextResponse.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Error fetching products:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch products';
    
    return NextResponse.json(
      { 
        success: false, 
        error: errorMessage 
      },
      { status: 500 }
    );
  }
}