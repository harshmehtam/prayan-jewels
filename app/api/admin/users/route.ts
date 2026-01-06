// API route for admin user management
import { NextRequest, NextResponse } from 'next/server';
import { AdminUserService } from '@/lib/services/admin-users';
import { requireSuperAdmin, createAdminContext } from '@/lib/auth/admin-auth';

// GET /api/admin/users - Get all admin users (Super Admin only)
export async function GET(request: NextRequest) {
  try {
    // Require super admin authentication
    const auth = await requireSuperAdmin(request);
    
    // Get search parameters
    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role') as any;
    const searchQuery = searchParams.get('search');

    const filters: any = {};
    if (role) filters.role = role;
    if (searchQuery) filters.searchQuery = searchQuery;

    const result = await AdminUserService.getAllAdminUsers(filters);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in GET /api/admin/users:', error);
    
    if (error instanceof Error) {
      if (error.message === 'Authentication required') {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        );
      }
      if (error.message === 'Super admin access required') {
        return NextResponse.json(
          { error: 'Super admin access required' },
          { status: 403 }
        );
      }
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/users - Update user role/details (Super Admin only)
export async function PUT(request: NextRequest) {
  try {
    // Require super admin authentication
    const auth = await requireSuperAdmin(request);
    const adminContext = createAdminContext(auth, request);
    
    const body = await request.json();
    const { userId, firstName, lastName, role } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const result = await AdminUserService.updateAdminUser(
      {
        userId,
        firstName,
        lastName,
        role,
      },
      auth.userRole,
      adminContext
    );

    if (result.success) {
      return NextResponse.json(result.user);
    } else {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error in PUT /api/admin/users:', error);
    
    if (error instanceof Error) {
      if (error.message === 'Authentication required') {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        );
      }
      if (error.message === 'Super admin access required') {
        return NextResponse.json(
          { error: 'Super admin access required' },
          { status: 403 }
        );
      }
    }
    
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    );
  }
}