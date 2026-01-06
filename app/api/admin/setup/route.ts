// API route for admin setup and role management
import { NextRequest, NextResponse } from 'next/server';
import { requireSuperAdmin, authenticateAdmin, createAdminContext } from '@/lib/auth/admin-auth';
import { createAdminUser, hasSuperAdmin, promoteToAdmin } from '@/lib/auth/admin-setup';

// GET /api/admin/setup - Check if initial setup is needed
export async function GET(request: NextRequest) {
  try {
    const hasSuper = await hasSuperAdmin();
    
    return NextResponse.json({
      needsSetup: !hasSuper,
      hasSuperAdmin: hasSuper,
    });
  } catch (error) {
    console.error('Error in GET /api/admin/setup:', error);
    return NextResponse.json(
      { error: 'Failed to check setup status' },
      { status: 500 }
    );
  }
}

// POST /api/admin/setup - Create initial super admin or promote user
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, email, firstName, lastName, role = 'super_admin', isInitialSetup = false } = body;

    if (!userId || !email || !firstName || !lastName) {
      return NextResponse.json(
        { error: 'All user details are required' },
        { status: 400 }
      );
    }

    // For initial setup, allow creating super admin without authentication
    if (isInitialSetup) {
      const hasSuper = await hasSuperAdmin();
      if (hasSuper) {
        return NextResponse.json(
          { error: 'Initial setup already completed' },
          { status: 400 }
        );
      }
      
      const result = await createAdminUser({
        userId,
        email,
        firstName,
        lastName,
        role: 'super_admin',
      });
      
      if (result.success) {
        return NextResponse.json({
          success: true,
          message: 'Initial super admin created successfully',
          profile: result.profile,
        });
      } else {
        return NextResponse.json(
          { error: result.error },
          { status: 500 }
        );
      }
    }

    // For regular admin creation, require super admin authentication
    const auth = await requireSuperAdmin(request);
    const adminContext = createAdminContext(auth, request);
    
    const result = await promoteToAdmin(userId, role as 'admin' | 'super_admin', auth.userRole);
    
    if (result.success) {
      // Log the admin action
      try {
        const { AdminAuditService } = await import('@/lib/services/admin-audit');
        await AdminAuditService.logUserAction(
          adminContext,
          'role_changed',
          userId,
          email,
          `User promoted to ${role}`,
          { newRole: role },
          true
        );
      } catch (auditError) {
        console.error('Failed to log admin action:', auditError);
      }
      
      return NextResponse.json({
        success: true,
        message: `User promoted to ${role} successfully`,
      });
    } else {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error in POST /api/admin/setup:', error);
    
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
      { error: 'Failed to setup admin user' },
      { status: 500 }
    );
  }
}