// Admin dashboard with role-based access control
'use client';

import React, { useState, useEffect } from 'react';
import { useRoleAccess } from '@/lib/hooks/useRoleAccess';
import { OrderService } from '@/lib/data/orders';
import { PermissionGate } from '@/components/auth/AdminRoute';
import { getRoleDisplayName } from '@/lib/auth/roles';

interface DashboardStats {
  totalOrders: number;
  totalRevenue: number;
  pendingOrders: number;
  processingOrders: number;
  shippedOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
}

interface AdminDashboardProps {
  className?: string;
}

export default function AdminDashboard({ className = '' }: AdminDashboardProps) {
  const { userRole, userProfile, isAdmin, isSuperAdmin, canManageAdmins } = useRoleAccess();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStats = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const orderStats = await OrderService.getOrderStatistics();
      
      if (orderStats.errors) {
        throw new Error('Failed to load order statistics');
      }
      
      setStats({
        totalOrders: orderStats.stats.totalOrders,
        totalRevenue: orderStats.stats.totalRevenue,
        pendingOrders: orderStats.stats.pendingOrders,
        processingOrders: orderStats.stats.processingOrders,
        shippedOrders: orderStats.stats.shippedOrders,
        deliveredOrders: orderStats.stats.deliveredOrders,
        cancelledOrders: orderStats.stats.cancelledOrders,
      });
    } catch (err) {
      console.error('Error loading dashboard stats:', err);
      setError(err instanceof Error ? err.message : 'Failed to load dashboard statistics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  const StatCard = ({ 
    title, 
    value, 
    icon, 
    color = 'blue' 
  }: { 
    title: string; 
    value: number | string; 
    icon: React.ReactNode; 
    color?: 'blue' | 'green' | 'purple' | 'yellow' | 'red' | 'orange';
  }) => {
    const colorClasses = {
      blue: 'bg-blue-50 text-blue-600 border-blue-200',
      green: 'bg-green-50 text-green-600 border-green-200',
      purple: 'bg-purple-50 text-purple-600 border-purple-200',
      yellow: 'bg-yellow-50 text-yellow-600 border-yellow-200',
      red: 'bg-red-50 text-red-600 border-red-200',
      orange: 'bg-orange-50 text-orange-600 border-orange-200',
    };

    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
        <div className="flex items-center">
          <div className={`flex-shrink-0 p-2 sm:p-3 rounded-lg border ${colorClasses[color]}`}>
            {icon}
          </div>
          <div className="ml-3 sm:ml-4 min-w-0 flex-1">
            <p className="text-responsive-xs font-medium text-gray-600 truncate">{title}</p>
            <p className="text-lg sm:text-2xl font-semibold text-gray-900">{value}</p>
          </div>
        </div>
      </div>
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  return (
    <div className={`space-responsive-y ${className}`}>
      {/* Welcome Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-responsive">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h1 className="text-responsive-xl font-bold text-gray-900">
              Welcome to Admin Dashboard
            </h1>
            <p className="text-gray-600 mt-1 text-responsive-sm">
              Logged in as: {userProfile?.firstName} {userProfile?.lastName} 
              <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                {getRoleDisplayName(userRole)}
              </span>
            </p>
          </div>
          <div className="flex items-center space-x-2 flex-shrink-0">
            <svg className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <svg className="h-5 w-5 text-red-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="ml-3">
              <p className="text-responsive-xs text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Statistics Cards */}
      <PermissionGate resource="admin/analytics" action="read">
        <div className="grid grid-responsive-1-2-4 gap-4 sm:gap-6">
          {loading ? (
            // Loading skeletons
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
                <div className="animate-pulse">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 p-3 rounded-lg bg-gray-200 w-10 h-10 sm:w-12 sm:h-12"></div>
                    <div className="ml-4 space-y-2 flex-1">
                      <div className="h-3 sm:h-4 bg-gray-200 rounded w-16 sm:w-20"></div>
                      <div className="h-4 sm:h-6 bg-gray-200 rounded w-8 sm:w-12"></div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : stats ? (
            <>
              <StatCard
                title="Total Orders"
                value={stats.totalOrders}
                color="blue"
                icon={
                  <svg className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                }
              />
              <StatCard
                title="Total Revenue"
                value={formatCurrency(stats.totalRevenue)}
                color="green"
                icon={
                  <svg className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                }
              />
              <StatCard
                title="Pending Orders"
                value={stats.pendingOrders}
                color="yellow"
                icon={
                  <svg className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                }
              />
              <StatCard
                title="Processing Orders"
                value={stats.processingOrders}
                color="orange"
                icon={
                  <svg className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                }
              />
              <StatCard
                title="Shipped Orders"
                value={stats.shippedOrders}
                color="purple"
                icon={
                  <svg className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                }
              />
              <StatCard
                title="Delivered Orders"
                value={stats.deliveredOrders}
                color="green"
                icon={
                  <svg className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                }
              />
            </>
          ) : null}
        </div>
      </PermissionGate>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-responsive">
        <h2 className="text-responsive-base font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-responsive-1-2-3 gap-4">
          
          <PermissionGate resource="admin/products" action="read">
            <a
              href="/admin/products"
              className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors focus-ring"
            >
              <div className="flex-shrink-0 p-2 bg-blue-100 rounded-lg">
                <svg className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <div className="ml-3 min-w-0 flex-1">
                <p className="text-responsive-xs font-medium text-gray-900 truncate">Manage Products</p>
                <p className="text-xs text-gray-500 truncate">Add, edit, and organize products</p>
              </div>
            </a>
          </PermissionGate>

          <PermissionGate resource="admin/orders" action="read">
            <a
              href="/admin/orders"
              className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors focus-ring"
            >
              <div className="flex-shrink-0 p-2 bg-green-100 rounded-lg">
                <svg className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div className="ml-3 min-w-0 flex-1">
                <p className="text-responsive-xs font-medium text-gray-900 truncate">Manage Orders</p>
                <p className="text-xs text-gray-500 truncate">View and update order status</p>
              </div>
            </a>
          </PermissionGate>

          <PermissionGate resource="admin/products" action="read">
            <a
              href="/admin/coupons"
              className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors focus-ring"
            >
              <div className="flex-shrink-0 p-2 bg-purple-100 rounded-lg">
                <svg className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
              </div>
              <div className="ml-3 min-w-0 flex-1">
                <p className="text-responsive-xs font-medium text-gray-900 truncate">Manage Coupons</p>
                <p className="text-xs text-gray-500 truncate">Create and manage discount coupons</p>
              </div>
            </a>
          </PermissionGate>

          <PermissionGate resource="admin/inventory" action="read">
            <a
              href="/admin/inventory"
              className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors focus-ring"
            >
              <div className="flex-shrink-0 p-2 bg-yellow-100 rounded-lg">
                <svg className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div className="ml-3 min-w-0 flex-1">
                <p className="text-responsive-xs font-medium text-gray-900 truncate">Inventory Control</p>
                <p className="text-xs text-gray-500 truncate">Monitor stock levels and alerts</p>
              </div>
            </a>
          </PermissionGate>

          {canManageAdmins && (
            <PermissionGate resource="admin/audit" action="read">
              <a
                href="/admin/audit"
                className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors focus-ring"
              >
                <div className="flex-shrink-0 p-2 bg-red-100 rounded-lg">
                  <svg className="h-5 w-5 sm:h-6 sm:w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="ml-3 min-w-0 flex-1">
                  <p className="text-responsive-xs font-medium text-gray-900 truncate">Audit Logs</p>
                  <p className="text-xs text-gray-500 truncate">View system activity and logs</p>
                </div>
              </a>
            </PermissionGate>
          )}

          <PermissionGate resource="admin/analytics" action="read">
            <a
              href="/admin/analytics"
              className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors focus-ring"
            >
              <div className="flex-shrink-0 p-2 bg-indigo-100 rounded-lg">
                <svg className="h-5 w-5 sm:h-6 sm:w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div className="ml-3 min-w-0 flex-1">
                <p className="text-responsive-xs font-medium text-gray-900 truncate">Analytics</p>
                <p className="text-xs text-gray-500 truncate">View sales and performance data</p>
              </div>
            </a>
          </PermissionGate>
        </div>
      </div>

      {/* Role Information */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex">
          <svg className="h-5 w-5 text-blue-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="ml-3">
            <h3 className="text-responsive-xs font-medium text-blue-800">Your Access Level</h3>
            <div className="mt-2 text-responsive-xs text-blue-700">
              <p>
                You are logged in as a <strong>{getRoleDisplayName(userRole)}</strong>.
                {isSuperAdmin && ' You have full access to all admin features including audit logs.'}
                {isAdmin && !isSuperAdmin && ' You have access to product, order, and inventory management.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}