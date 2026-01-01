// Admin customer management component
'use client';

import React, { useState, useEffect } from 'react';
import { 
  AdminCustomerService, 
  CustomerListItem, 
  CustomerDetails,
  CustomerSearchFilters,
  UpdateCustomerInput,
  CustomerPasswordResetInput 
} from '@/lib/services/admin-customers';
import { useRoleAccess } from '@/lib/hooks/useRoleAccess';
import { useAdminAudit } from '@/lib/hooks/useAdminAudit';
import { PermissionGate } from '@/components/auth/AdminRoute';

interface AdminCustomerManagerProps {
  className?: string;
}

export default function AdminCustomerManager({ className = '' }: AdminCustomerManagerProps) {
  const { userRole, userId, userProfile } = useRoleAccess();
  const { adminContext } = useAdminAudit({
    adminId: userId || 'unknown',
    adminEmail: userProfile?.email,
    autoStartSession: true,
  });
  const [customers, setCustomers] = useState<CustomerListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerDetails | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPasswordResetModalOpen, setIsPasswordResetModalOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<CustomerSearchFilters>({});
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Form states
  const [editForm, setEditForm] = useState<UpdateCustomerInput>({
    userId: '',
    firstName: '',
    lastName: '',
    phone: '',
    newsletter: false,
    smsUpdates: false,
    preferredCategories: [],
  });

  const [passwordResetForm, setPasswordResetForm] = useState<CustomerPasswordResetInput>({
    userId: '',
    adminId: userId || '',
    reason: '',
  });

  const [temporaryPassword, setTemporaryPassword] = useState<string>('');

  const loadCustomers = async () => {
    try {
      setLoading(true);
      setError(null);

      const searchFilters: CustomerSearchFilters = {
        ...filters,
        searchQuery: searchQuery.trim() || undefined,
      };

      const response = await AdminCustomerService.getCustomers(searchFilters, 50, 0);
      setCustomers(response.customers);
    } catch (err) {
      console.error('Error loading customers:', err);
      setError(err instanceof Error ? err.message : 'Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, [searchQuery, filters]);

  const handleViewCustomer = async (customer: CustomerListItem) => {
    try {
      setLoading(true);
      const details = await AdminCustomerService.getCustomerDetails(customer.userId);
      if (details) {
        setSelectedCustomer(details);
        setIsDetailModalOpen(true);
      }
    } catch (err) {
      console.error('Error loading customer details:', err);
      setError(err instanceof Error ? err.message : 'Failed to load customer details');
    } finally {
      setLoading(false);
    }
  };

  const handleEditCustomer = (customer: CustomerListItem) => {
    setEditForm({
      userId: customer.userId,
      firstName: customer.firstName || '',
      lastName: customer.lastName || '',
      phone: customer.phone || '',
      newsletter: customer.newsletter || false,
      smsUpdates: customer.smsUpdates || false,
      preferredCategories: customer.preferredCategories || [],
    });
    setIsEditModalOpen(true);
  };

  const handleUpdateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userId) {
      setError('Admin user ID not available');
      return;
    }

    setIsUpdating(true);
    setError(null);

    try {
      const result = await AdminCustomerService.updateCustomer(editForm, adminContext);

      if (result.success && result.customer) {
        // Update the customer in the list
        setCustomers(prev => prev.map(c => 
          c.userId === editForm.userId ? result.customer! : c
        ));
        setIsEditModalOpen(false);
        setError(null);
      } else {
        setError(result.error || 'Failed to update customer');
      }
    } catch (err) {
      console.error('Error updating customer:', err);
      setError(err instanceof Error ? err.message : 'Failed to update customer');
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePasswordReset = async (customer: CustomerListItem) => {
    setPasswordResetForm({
      userId: customer.userId,
      adminId: userId || '',
      reason: '',
    });
    setTemporaryPassword('');
    setIsPasswordResetModalOpen(true);
  };

  const handleSubmitPasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!passwordResetForm.reason.trim()) {
      setError('Please provide a reason for the password reset');
      return;
    }

    setIsUpdating(true);
    setError(null);

    try {
      const result = await AdminCustomerService.resetCustomerPassword(passwordResetForm, adminContext);

      if (result.success) {
        setTemporaryPassword(result.temporaryPassword || '');
        setError(null);
      } else {
        setError(result.error || 'Failed to reset password');
      }
    } catch (err) {
      console.error('Error resetting password:', err);
      setError(err instanceof Error ? err.message : 'Failed to reset password');
    } finally {
      setIsUpdating(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <PermissionGate resource="admin/customers" action="read">
      <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Customer Account Management</h2>
          
          {/* Search and Filter Controls */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Search customers by name, phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <button
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              >
                {showAdvancedFilters ? 'Hide Filters' : 'Show Filters'}
              </button>
            </div>

            {/* Advanced Filters */}
            {showAdvancedFilters && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Has Orders
                  </label>
                  <select
                    value={filters.hasOrders === undefined ? '' : filters.hasOrders.toString()}
                    onChange={(e) => setFilters(prev => ({
                      ...prev,
                      hasOrders: e.target.value === '' ? undefined : e.target.value === 'true'
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">All Customers</option>
                    <option value="true">With Orders</option>
                    <option value="false">Without Orders</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Min Total Spent
                  </label>
                  <input
                    type="number"
                    placeholder="0"
                    value={filters.totalSpentMin || ''}
                    onChange={(e) => setFilters(prev => ({
                      ...prev,
                      totalSpentMin: e.target.value ? Number(e.target.value) : undefined
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Registered After
                  </label>
                  <input
                    type="date"
                    value={filters.registeredAfter || ''}
                    onChange={(e) => setFilters(prev => ({
                      ...prev,
                      registeredAfter: e.target.value || undefined
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            )}
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

        {/* Customers List */}
        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <svg className="animate-spin h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span className="ml-2 text-gray-600">Loading customers...</span>
            </div>
          ) : customers.length === 0 ? (
            <div className="text-center py-8">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No customers found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchQuery || Object.keys(filters).length > 0 ? 'Try adjusting your search criteria.' : 'No customers available.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Orders
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Spent
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Registered
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {customers.map((customer) => (
                    <tr key={customer.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                              <span className="text-sm font-medium text-blue-700">
                                {customer.firstName?.[0]?.toUpperCase() || customer.lastName?.[0]?.toUpperCase() || 'C'}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {customer.firstName} {customer.lastName}
                            </div>
                            <div className="text-sm text-gray-500">
                              ID: {customer.userId.slice(-8)}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {customer.email || 'No email'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {customer.phone || 'No phone'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {customer.totalOrders} orders
                        </div>
                        {customer.lastOrderDate && (
                          <div className="text-sm text-gray-500">
                            Last: {formatDate(customer.lastOrderDate)}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(customer.totalSpent)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(customer.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                        <button
                          onClick={() => handleViewCustomer(customer)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          View
                        </button>
                        <PermissionGate resource="admin/customers" action="update">
                          <button
                            onClick={() => handleEditCustomer(customer)}
                            className="text-green-600 hover:text-green-900"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handlePasswordReset(customer)}
                            className="text-orange-600 hover:text-orange-900"
                          >
                            Reset Password
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

        {/* Customer Details Modal */}
        {isDetailModalOpen && selectedCustomer && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-10 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Customer Details: {selectedCustomer.firstName} {selectedCustomer.lastName}
                </h3>
                <button
                  onClick={() => {
                    setIsDetailModalOpen(false);
                    setSelectedCustomer(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Customer Information */}
                <div className="space-y-4">
                  <div>
                    <h4 className="text-md font-medium text-gray-900 mb-2">Customer Information</h4>
                    <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                      <div><strong>Name:</strong> {selectedCustomer.firstName} {selectedCustomer.lastName}</div>
                      <div><strong>Email:</strong> {selectedCustomer.email || 'Not available'}</div>
                      <div><strong>Phone:</strong> {selectedCustomer.phone || 'Not provided'}</div>
                      <div><strong>Newsletter:</strong> {selectedCustomer.newsletter ? 'Subscribed' : 'Not subscribed'}</div>
                      <div><strong>SMS Updates:</strong> {selectedCustomer.smsUpdates ? 'Enabled' : 'Disabled'}</div>
                      <div><strong>Registered:</strong> {formatDate(selectedCustomer.createdAt)}</div>
                    </div>
                  </div>

                  {/* Addresses */}
                  <div>
                    <h4 className="text-md font-medium text-gray-900 mb-2">Addresses</h4>
                    <div className="space-y-2">
                      {selectedCustomer.addresses.length === 0 ? (
                        <p className="text-sm text-gray-500">No addresses on file</p>
                      ) : (
                        selectedCustomer.addresses.map((address) => (
                          <div key={address.id} className="bg-gray-50 p-3 rounded-lg">
                            <div className="text-sm">
                              <div className="font-medium">{address.type?.toUpperCase()} Address</div>
                              <div>{address.firstName} {address.lastName}</div>
                              <div>{address.addressLine1}</div>
                              {address.addressLine2 && <div>{address.addressLine2}</div>}
                              <div>{address.city}, {address.state} {address.postalCode}</div>
                              <div>{address.country}</div>
                              {address.isDefault && <div className="text-blue-600 font-medium">Default</div>}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                {/* Order History and Activity */}
                <div className="space-y-4">
                  <div>
                    <h4 className="text-md font-medium text-gray-900 mb-2">Order Summary</h4>
                    <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                      <div><strong>Total Orders:</strong> {selectedCustomer.totalOrders}</div>
                      <div><strong>Total Spent:</strong> {formatCurrency(selectedCustomer.totalSpent)}</div>
                      {selectedCustomer.lastOrderDate && (
                        <div><strong>Last Order:</strong> {formatDate(selectedCustomer.lastOrderDate)}</div>
                      )}
                    </div>
                  </div>

                  {/* Recent Orders */}
                  <div>
                    <h4 className="text-md font-medium text-gray-900 mb-2">Recent Orders</h4>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {selectedCustomer.orders.length === 0 ? (
                        <p className="text-sm text-gray-500">No orders found</p>
                      ) : (
                        selectedCustomer.orders.slice(0, 5).map((order) => (
                          <div key={order.id} className="bg-gray-50 p-3 rounded-lg">
                            <div className="text-sm">
                              <div className="font-medium">Order #{order.confirmationNumber}</div>
                              <div className="text-gray-600">
                                {formatCurrency(order.totalAmount)} • {order.status} • {formatDate(order.createdAt)}
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Account Activity */}
                  <div>
                    <h4 className="text-md font-medium text-gray-900 mb-2">Recent Activity</h4>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {selectedCustomer.accountActivity.map((activity) => (
                        <div key={activity.id} className="bg-gray-50 p-3 rounded-lg">
                          <div className="text-sm">
                            <div className="font-medium">{activity.description}</div>
                            <div className="text-gray-600">{formatDate(activity.timestamp)}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit Customer Modal */}
        {isEditModalOpen && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Edit Customer
                </h3>
                
                <form onSubmit={handleUpdateCustomer} className="space-y-4">
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
                      Phone
                    </label>
                    <input
                      type="tel"
                      value={editForm.phone}
                      onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      disabled={isUpdating}
                    />
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="newsletter"
                      checked={editForm.newsletter}
                      onChange={(e) => setEditForm(prev => ({ ...prev, newsletter: e.target.checked }))}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      disabled={isUpdating}
                    />
                    <label htmlFor="newsletter" className="ml-2 block text-sm text-gray-900">
                      Newsletter subscription
                    </label>
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="smsUpdates"
                      checked={editForm.smsUpdates}
                      onChange={(e) => setEditForm(prev => ({ ...prev, smsUpdates: e.target.checked }))}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      disabled={isUpdating}
                    />
                    <label htmlFor="smsUpdates" className="ml-2 block text-sm text-gray-900">
                      SMS updates
                    </label>
                  </div>
                  
                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditModalOpen(false);
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
                      {isUpdating ? 'Updating...' : 'Update Customer'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Password Reset Modal */}
        {isPasswordResetModalOpen && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Reset Customer Password
                </h3>
                
                {temporaryPassword ? (
                  <div className="space-y-4">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex">
                        <svg className="h-5 w-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <div className="ml-3">
                          <h4 className="text-sm font-medium text-green-800">Password Reset Successful</h4>
                          <div className="mt-2 text-sm text-green-700">
                            <p>Temporary password has been generated:</p>
                            <div className="mt-2 p-2 bg-white border border-green-300 rounded font-mono text-lg">
                              {temporaryPassword}
                            </div>
                            <p className="mt-2 text-xs">
                              Please provide this password to the customer. They will be required to change it on their next login.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex justify-end">
                      <button
                        onClick={() => {
                          setIsPasswordResetModalOpen(false);
                          setTemporaryPassword('');
                          setPasswordResetForm(prev => ({ ...prev, reason: '' }));
                        }}
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleSubmitPasswordReset} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Reason for Password Reset *
                      </label>
                      <textarea
                        value={passwordResetForm.reason}
                        onChange={(e) => setPasswordResetForm(prev => ({ ...prev, reason: e.target.value }))}
                        placeholder="e.g., Customer forgot password, security concern, etc."
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        disabled={isUpdating}
                        required
                      />
                    </div>
                    
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <div className="flex">
                        <svg className="h-5 w-5 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                        <div className="ml-3">
                          <p className="text-sm text-yellow-700">
                            This action will generate a temporary password and invalidate the customer's current password. 
                            The customer will need to change their password on their next login.
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex justify-end space-x-3 pt-4">
                      <button
                        type="button"
                        onClick={() => {
                          setIsPasswordResetModalOpen(false);
                          setPasswordResetForm(prev => ({ ...prev, reason: '' }));
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
                        className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isUpdating ? 'Resetting...' : 'Reset Password'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </PermissionGate>
  );
}