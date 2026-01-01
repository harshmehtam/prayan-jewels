// API route for admin user management
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from 'aws-amplify/auth/server';
import { cookies } from 'next/headers';
import { AdminUserService } from '@/lib/services/admin-users';
import { UserService } from '@/lib/data/users';
import { isAdmin, isSuperAdmin } from '@/lib/auth/roles';

// GET /api/admin/users - Get all admin users
export async function GET(request: NextRequest) {
  try {
    // Get current user from cookies/session
    const cookieStore = cookies();
    
    // For now, we'll use a simple approach - in production you'd want proper session management
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

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
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/users - Update user role/details
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, firstName, lastName, role } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // For now, we'll assume admin access - in production you'd verify the current user's role
    const result = await AdminUserService.updateAdminUser(
      {
        userId,
        firstName,
        lastName,
        role,
      },
      'super_admin' // This should come from the authenticated user's role
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
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    );
  }
}