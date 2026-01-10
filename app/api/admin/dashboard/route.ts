// API route for admin dashboard statistics
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/admin-auth';
import { AdminUserService } from '@/lib/services/admin-users';
import { client } from '@/lib/amplify-client';

// GET /api/admin/dashboard - Get dashboard statistics
export async function GET(request: NextRequest) {
  try {
    // Require admin authentication
    const auth = await requireAdmin(request);
    
    // Get user statistics
    const userStats = await AdminUserService.getUserStatistics();
    
    // Get order statistics
    const ordersResponse = await client.models.Order.list({
      limit: 1000, // Adjust as needed
    });
    
    const orders = ordersResponse.data || [];
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const orderStats = {
      totalOrders: orders.length,
      pendingOrders: orders.filter(o => o.status === 'pending').length,
      processingOrders: orders.filter(o => o.status === 'processing').length,
      shippedOrders: orders.filter(o => o.status === 'shipped').length,
      deliveredOrders: orders.filter(o => o.status === 'delivered').length,
      cancelledOrders: orders.filter(o => o.status === 'cancelled').length,
      recentOrders: orders.filter(o => new Date(o.createdAt) > thirtyDaysAgo).length,
      totalRevenue: orders
        .filter(o => o.status !== 'cancelled')
        .reduce((sum, o) => sum + (o.totalAmount || 0), 0),
      monthlyRevenue: orders
        .filter(o => o.status !== 'cancelled' && new Date(o.createdAt) > thirtyDaysAgo)
        .reduce((sum, o) => sum + (o.totalAmount || 0), 0),
    };
    
    // Get product statistics
    const productsResponse = await client.models.Product.list({
      limit: 1000, // Adjust as needed
    });
    
    const products = productsResponse.data || [];
    const productStats = {
      totalProducts: products.length,
      activeProducts: products.filter(p => p.isActive).length,
      inactiveProducts: products.filter(p => !p.isActive).length,
    };
    
    // Inventory tracking is not implemented yet
    const inventoryStats = {
      totalItems: 0,
      lowStockItems: 0,
      outOfStockItems: 0,
    };
    
    return NextResponse.json({
      users: userStats,
      orders: orderStats,
      products: productStats,
      inventory: inventoryStats,
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error in GET /api/admin/dashboard:', error);
    
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
      { error: 'Failed to fetch dashboard statistics' },
      { status: 500 }
    );
  }
}