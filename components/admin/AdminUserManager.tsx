// Admin user management component
'use client';

import React, { useState, useEffect } from 'react';
import { AdminUserService, AdminUserListItem, AdminUserSearchFilters } from '@/lib/services/admin-users';
import { UserRole, getRoleDisplayName, getAssignableRoles, canAssignRole } from '@/lib/auth/roles';
import { useRoleAccess } from '@/lib/hooks/useRoleAccess';
import { useAdminAudit } from '@/lib/hooks/useAdminAudit';
import { PermissionGate } from '@/components/auth/AdminRoute';

interface AdminUserManagerProps {
  className?: string;
}

export default function AdminUserManager({ className = '' }: AdminUserManagerProps) {
  const { userRole, isSuperAdmin, userId } = useRoleAccess();
  const { adminContext, logUserAction, logPermissionDenied } = useAdminAudit({
    adminId: userId || 'unknown',
    autoStartSession: true,
  });
  const [users, setUsers] = useState<AdminUserListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | ''>('');
  const [selectedUser, setSelectedUser] = useState<AdminUserListItem | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // Form state for editing user
  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: '',
    role: '' as UserRole | '',
  });

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);

      const filters: AdminUserSearchFilters = {};
      if (searchQuery.trim()) {
        filters.searchQuery = searchQuery.trim();
      }
      if (roleFilter) {
        filters.role = roleFilter;
      }

      const response = await AdminUserService.getAllAdminUsers(filters);
      setUsers(response.users);
    } catch (err) {
      console.error('Error loading users:', err);
      setError(err instanceof Error ? err.message : 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [searchQuery, roleFilter]);

  const handleEditUser = (user: AdminUserListItem) => {
    setSelectedUser(user);
    setEditForm({
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      role: user.role || '',
    });
    setIsEditModalOpen(true);
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedUser) return;

    setIsUpdating(true);
    setError(null);

    try {
      const result = await AdminUserService.updateAdminUser(
        {
          userId: selectedUser.userId,
          firstName: editForm.firstName.trim() || undefined,
          lastName: editForm.lastName.trim() || undefined,
          role: editForm.role || undefined,
        },
        userRole,
        adminContext
      );

      if (result.success) {
        // Update the user in the list
        setUsers(prev => prev.map(u => 
          u.userId === selectedUser.userId 
            ? { ...u, ...result.user }
            : u
        ));
        setIsEditModalOpen(false);
        setSelectedUser(null);
      } else {
        setError(result.error || 'Failed to update user');
      }
    } catch (err) {
      console.error('Error updating user:', err);
      setError(err instanceof Error ? err.message : 'Failed to update user');
    } finally {
      setIsUpdating(false);
    }
  };

  const getRoleColor = (role: UserRole | null) => {
    switch (role) {
      case 'super_admin':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'admin':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'customer':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const assignableRoles = getAssignableRoles(userRole);

  return (
    <PermissionGate resource="admin/users" action="read">
      <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Admin User Management</h2>
          
          {/* Search and Filter Controls */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="sm:w-48">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value as UserRole | '')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Roles</option>
                <option value="admin">Admin</option>
                <option value="super_admin">Super Admin</option>
              </select>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-4 bg-red-50 border-b border-red-200">
            <div className="flex">
              <svg className="h-5 w-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Users List */}
        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <svg className="animate-spin h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span className="ml-2 text-gray-600">Loading users...</span>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-8">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No users found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchQuery || roleFilter ? 'Try adjusting your search criteria.' : 'No admin users available.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                              <span className="text-sm font-medium text-gray-700">
                                {user.firstName?.[0]?.toUpperCase() || user.lastName?.[0]?.toUpperCase() || 'U'}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {user.firstName} {user.lastName}
                            </div>
                            <div className="text-sm text-gray-500">
                              {user.email || 'No email available'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getRoleColor(user.role)}`}>
                          {getRoleDisplayName(user.role)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <PermissionGate resource="admin/users" action="update">
                          <button
                            onClick={() => handleEditUser(user)}
                            className="text-blue-600 hover:text-blue-900 mr-4"
                          >
                            Edit
                          </button>
                        </PermissionGate>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Edit User Modal */}
        {isEditModalOpen && selectedUser && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Edit User: {selectedUser.firstName} {selectedUser.lastName}
                </h3>
                
                <form onSubmit={handleUpdateUser} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      First Name
                    </label>
                    <input
                      type="text"
                      value={editForm.firstName}
                      onChange={(e) => setEditForm(prev => ({ ...prev, firstName: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      disabled={isUpdating}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Last Name
                    </label>
                    <input
                      type="text"
                      value={editForm.lastName}
                      onChange={(e) => setEditForm(prev => ({ ...prev, lastName: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      disabled={isUpdating}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Role
                    </label>
                    <select
                      value={editForm.role}
                      onChange={(e) => setEditForm(prev => ({ ...prev, role: e.target.value as UserRole }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      disabled={isUpdating}
                    >
                      <option value="">Select Role</option>
                      {assignableRoles.map(role => (
                        <option key={role} value={role}>
                          {getRoleDisplayName(role)}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditModalOpen(false);
                        setSelectedUser(null);
                        setError(null);
                      }}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                      disabled={isUpdating}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isUpdating}
                      className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isUpdating ? 'Updating...' : 'Update User'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </PermissionGate>
  );
}