import { NextRequest, NextResponse } from 'next/server';
import { ProductService } from '@/lib/data/products';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 5;

    if (!query || query.trim().length < 2) {
      return NextResponse.json({
        success: true,
        data: { suggestions: [] }
      });
    }

    // Get products matching the search query
    const result = await ProductService.searchProducts(query.trim(), {}, limit);
    
    // Extract unique product names as suggestions
    const suggestions = [...new Set(result.products.map(product => product.name))].slice(0, limit);

    return NextResponse.json({
      success: true,
      data: { suggestions }
    });

  } catch (error) {
    console.error('Error fetching search suggestions:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch suggestions';
    
    return NextResponse.json(
      { 
        success: false, 
        error: errorMessage 
      },
      { status: 500 }
    );
  }
}