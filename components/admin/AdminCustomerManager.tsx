// Admin customer management component
'use client';

import React from 'react';
import { PermissionGate } from '@/components/auth/AdminRoute';

export default function AdminCustomerManager() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customer Management</h1>
          <p className="text-gray-600 mt-1">Manage customer accounts and profiles</p>
        </div>
      </div>

      {/* Information Notice */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex">
          <svg className="h-6 w-6 text-blue-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="ml-3">
            <h3 className="text-lg font-medium text-blue-900">Customer Management via AWS Cognito</h3>
            <div className="mt-2 text-blue-700">
              <p className="mb-3">
                Customer accounts are managed through AWS Cognito User Pools. This provides:
              </p>
              <ul className="list-disc list-inside space-y-1 mb-4">
                <li>Secure user authentication and authorization</li>
                <li>Built-in password policies and security features</li>
                <li>Email verification and password recovery</li>
                <li>User group management for role-based access</li>
                <li>Compliance with security standards</li>
              </ul>
              <p className="text-sm">
                To manage customer accounts, access the AWS Cognito console or use the AWS CLI.
                Customer data such as orders and addresses are still managed through this admin panel.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Related Management</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <PermissionGate resource="admin/orders" action="read">
            <div className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
              <h4 className="font-medium text-gray-900 mb-2">Order Management</h4>
              <p className="text-sm text-gray-600 mb-3">View and manage customer orders</p>
              <a 
                href="/admin/orders" 
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                Manage Orders →
              </a>
            </div>
          </PermissionGate>

          <PermissionGate resource="admin/analytics" action="read">
            <div className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
              <h4 className="font-medium text-gray-900 mb-2">Customer Analytics</h4>
              <p className="text-sm text-gray-600 mb-3">View customer behavior and statistics</p>
              <a 
                href="/admin/analytics" 
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                View Analytics →
              </a>
            </div>
          </PermissionGate>

          <div className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
            <h4 className="font-medium text-gray-900 mb-2">AWS Cognito Console</h4>
            <p className="text-sm text-gray-600 mb-3">Manage user accounts directly</p>
            <a 
              href="https://console.aws.amazon.com/cognito/" 
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              Open Cognito Console →
            </a>
          </div>
        </div>
      </div>

      {/* Documentation */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Documentation</h3>
        <div className="space-y-3">
          <div>
            <h4 className="font-medium text-gray-900">Managing User Groups</h4>
            <p className="text-sm text-gray-600">
              Use AWS Cognito groups to assign roles (customer, admin, super_admin) to users.
            </p>
          </div>
          <div>
            <h4 className="font-medium text-gray-900">User Authentication</h4>
            <p className="text-sm text-gray-600">
              Users authenticate through the application's login system, which integrates with Cognito.
            </p>
          </div>
          <div>
            <h4 className="font-medium text-gray-900">Data Management</h4>
            <p className="text-sm text-gray-600">
              Customer orders, addresses, and preferences are managed through the application database.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}