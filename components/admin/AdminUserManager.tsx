// Admin user management component - Currently disabled
'use client';

import { PermissionGate } from '@/components/auth/AdminRoute';

interface AdminUserManagerProps {
  className?: string;
}

export default function AdminUserManager({ className = '' }: AdminUserManagerProps) {
  return (
    <PermissionGate resource="admin/users" action="read">
      <div className={`space-y-6 ${className}`}>
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">User Management</h1>
          <p className="text-gray-600">Manage admin users and their roles</p>
        </div>

        {/* Notice about user management being unavailable */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <div className="flex">
            <svg className="h-6 w-6 text-yellow-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="ml-3">
              <h3 className="text-lg font-medium text-yellow-800">User Management Currently Unavailable</h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>
                  User management features are currently not available because user profiles are not stored in the database. 
                  Users are managed through AWS Cognito authentication system.
                </p>
                <div className="mt-4">
                  <h4 className="font-medium">Current user management is handled through:</h4>
                  <ul className="mt-2 list-disc list-inside space-y-1">
                    <li>AWS Cognito User Pools for authentication</li>
                    <li>Cognito Groups for role assignment (admin, super_admin)</li>
                    <li>Role-based access control through the auth provider</li>
                  </ul>
                </div>
                <div className="mt-4">
                  <h4 className="font-medium">To manage users:</h4>
                  <ul className="mt-2 list-disc list-inside space-y-1">
                    <li>Use the AWS Cognito console to manage users</li>
                    <li>Assign users to 'admin' or 'super_admin' groups in Cognito</li>
                    <li>Users will automatically get the appropriate permissions when they log in</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Future enhancement notice */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex">
            <svg className="h-6 w-6 text-blue-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="ml-3">
              <h3 className="text-lg font-medium text-blue-800">Future Enhancement</h3>
              <div className="mt-2 text-sm text-blue-700">
                <p>
                  To enable full user management features, you would need to:
                </p>
                <ul className="mt-2 list-disc list-inside space-y-1">
                  <li>Add a UserProfile model to your Amplify data schema</li>
                  <li>Create user profiles when users sign up</li>
                  <li>Implement user management APIs and UI components</li>
                  <li>Add user search and filtering capabilities</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PermissionGate>
  );
}