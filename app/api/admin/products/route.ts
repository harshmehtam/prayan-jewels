// API route for admin product management
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, createAdminContext } from '@/lib/auth/admin-auth';
import { client } from '@/lib/amplify-client';

// GET /api/admin/products - Get all products for admin management
export async function GET(request: NextRequest) {
  try {
    // Require admin authentication
    const auth = await requireAdmin(request);
    
    // Get search parameters
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const isActive = searchParams.get('isActive');
    const limit = parseInt(searchParams.get('limit') || '50');

    // Build filter conditions
    const filterConditions: any = {};
    if (category) {
      filterConditions.category = { eq: category };
    }
    if (isActive !== null) {
      filterConditions.isActive = { eq: isActive === 'true' };
    }

    const response = await client.models.Product.list({
      filter: filterConditions,
      limit,
    });

    if (!response.data) {
      return NextResponse.json({ products: [], totalCount: 0 });
    }

    return NextResponse.json({
      products: response.data,
      totalCount: response.data.length,
    });
  } catch (error) {
    console.error('Error in GET /api/admin/products:', error);
    
    if (error instanceof Error) {
      if (error.message === 'Authentication required') {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        );
      }
      if (error.message === 'Admin access required') {
        return NextResponse.json(
          { error: 'Admin access required' },
          { status: 403 }
        );
      }
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}

// POST /api/admin/products - Create new product
export async function POST(request: NextRequest) {
  try {
    // Require admin authentication
    const auth = await requireAdmin(request);
    const adminContext = createAdminContext(auth, request);
    
    const body = await request.json();
    const {
      name,
      description,
      price,
      images,
      category,
      material,
      weight,
      length,
      style,
      occasion,
      metaTitle,
      metaDescription,
      keywords,
      isActive = true,
    } = body;

    // Validate required fields
    if (!name || !description || !price || !images || images.length === 0) {
      return NextResponse.json(
        { error: 'Name, description, price, and at least one image are required' },
        { status: 400 }
      );
    }

    // Create the product
    const response = await client.models.Product.create({
      name,
      description,
      price,
      images,
      category,
      material: material || 'silver',
      weight,
      length,
      style,
      occasion: occasion || [],
      metaTitle,
      metaDescription,
      keywords: keywords || [],
      isActive,
    });

    if (!response.data) {
      return NextResponse.json(
        { error: 'Failed to create product' },
        { status: 500 }
      );
    }

    // Log the admin action
    try {
      const { AdminAuditService } = await import('@/lib/services/admin-audit');
      await AdminAuditService.logProductAction(
        adminContext,
        'product_created',
        response.data.id,
        name,
        `Product "${name}" created`,
        { productData: body },
        true
      );
    } catch (auditError) {
      console.error('Failed to log admin action:', auditError);
    }

    return NextResponse.json({
      success: true,
      product: response.data,
    });
  } catch (error) {
    console.error('Error in POST /api/admin/products:', error);
    
    if (error instanceof Error) {
      if (error.message === 'Authentication required') {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        );
      }
      if (error.message === 'Admin access required') {
        return NextResponse.json(
          { error: 'Admin access required' },
          { status: 403 }
        );
      }
    }
    
    return NextResponse.json(
      { error: 'Failed to create product' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/products - Update product
export async function PUT(request: NextRequest) {
  try {
    // Require admin authentication
    const auth = await requireAdmin(request);
    const adminContext = createAdminContext(auth, request);
    
    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      );
    }

    // Update the product
    const response = await client.models.Product.update({
      id,
      ...updateData,
    });

    if (!response.data) {
      return NextResponse.json(
        { error: 'Failed to update product' },
        { status: 500 }
      );
    }

    // Log the admin action
    try {
      const { AdminAuditService } = await import('@/lib/services/admin-audit');
      await AdminAuditService.logProductAction(
        adminContext,
        'product_updated',
        id,
        response.data.name,
        `Product "${response.data.name}" updated`,
        { updateData },
        true
      );
    } catch (auditError) {
      console.error('Failed to log admin action:', auditError);
    }

    return NextResponse.json({
      success: true,
      product: response.data,
    });
  } catch (error) {
    console.error('Error in PUT /api/admin/products:', error);
    
    if (error instanceof Error) {
      if (error.message === 'Authentication required') {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        );
      }
      if (error.message === 'Admin access required') {
        return NextResponse.json(
          { error: 'Admin access required' },
          { status: 403 }
        );
      }
    }
    
    return NextResponse.json(
      { error: 'Failed to update product' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/products - Delete product
export async function DELETE(request: NextRequest) {
  try {
    // Require admin authentication
    const auth = await requireAdmin(request);
    const adminContext = createAdminContext(auth, request);
    
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      );
    }

    // Get product name for logging
    const existingProduct = await client.models.Product.get({ id });
    const productName = existingProduct.data?.name || 'Unknown';

    // Delete the product
    const response = await client.models.Product.delete({ id });

    if (!response.data) {
      return NextResponse.json(
        { error: 'Failed to delete product' },
        { status: 500 }
      );
    }

    // Log the admin action
    try {
      const { AdminAuditService } = await import('@/lib/services/admin-audit');
      await AdminAuditService.logProductAction(
        adminContext,
        'product_deleted',
        id,
        productName,
        `Product "${productName}" deleted`,
        { productId: id },
        true
      );
    } catch (auditError) {
      console.error('Failed to log admin action:', auditError);
    }

    return NextResponse.json({
      success: true,
      message: 'Product deleted successfully',
    });
  } catch (error) {
    console.error('Error in DELETE /api/admin/products:', error);
    
    if (error instanceof Error) {
      if (error.message === 'Authentication required') {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        );
      }
      if (error.message === 'Admin access required') {
        return NextResponse.json(
          { error: 'Admin access required' },
          { status: 403 }
        );
      }
    }
    
    return NextResponse.json(
      { error: 'Failed to delete product' },
      { status: 500 }
    );
  }
}