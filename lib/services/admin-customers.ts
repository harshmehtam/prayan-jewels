// Admin customer management service
import { client } from '@/lib/amplify-client';
import { UserProfile, Order, Address } from '@/types';
import { UserRole } from '@/lib/auth/roles';
import { AdminAuditService, AdminContext } from './admin-audit';

export interface CustomerListItem {
  id: string;
  userId: string;
  firstName?: string | null;
  lastName?: string | null;
  email?: string;
  phone?: string | null;
  role: UserRole | null;
  newsletter: boolean | null;
  smsUpdates: boolean | null;
  preferredCategories?: string[] | null;
  totalOrders: number;
  totalSpent: number;
  lastOrderDate?: string;
  createdAt: string;
  lastLogin?: string;
  isActive: boolean;
}

export interface CustomerDetails extends CustomerListItem {
  addresses: Address[];
  orders: Order[];
  accountActivity: CustomerActivity[];
}

export interface CustomerActivity {
  id: string;
  type: 'login' | 'order_placed' | 'profile_updated' | 'password_reset' | 'admin_action';
  description: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface CustomerSearchFilters {
  searchQuery?: string;
  role?: UserRole;
  hasOrders?: boolean;
  registeredAfter?: string;
  registeredBefore?: string;
  totalSpentMin?: number;
  totalSpentMax?: number;
  isActive?: boolean;
}

export interface UpdateCustomerInput {
  userId: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  newsletter?: boolean;
  smsUpdates?: boolean;
  preferredCategories?: string[];
  isActive?: boolean;
}

export interface CustomerPasswordResetInput {
  userId: string;
  adminId: string;
  reason: string;
}

export class AdminCustomerService {
  /**
   * Get all customers with filtering and search
   */
  static async getCustomers(
    filters?: CustomerSearchFilters,
    limit: number = 50,
    offset: number = 0
  ): Promise<{ customers: CustomerListItem[]; totalCount: number }> {
    try {
      // Build filter conditions for customer role
      const filterConditions: any = {
        role: { eq: 'customer' }
      };

      // Apply additional filters
      if (filters?.role && filters.role !== 'customer') {
        filterConditions.role = { eq: filters.role };
      }

      const response = await client.models.UserProfile.list({
        filter: filterConditions,
        limit: Math.min(limit, 100),
      });

      if (!response.data) {
        return { customers: [], totalCount: 0 };
      }

      // Get order statistics for each customer
      const customersWithStats = await Promise.all(
        response.data.map(async (profile) => {
          const orderStats = await this.getCustomerOrderStats(profile.userId);
          
          return {
            id: profile.id,
            userId: profile.userId,
            firstName: profile.firstName,
            lastName: profile.lastName,
            email: undefined, // Would need to fetch from Cognito
            phone: profile.phone,
            role: profile.role as UserRole,
            newsletter: profile.newsletter,
            smsUpdates: profile.smsUpdates,
            preferredCategories: profile.preferredCategories,
            totalOrders: orderStats.totalOrders,
            totalSpent: orderStats.totalSpent,
            lastOrderDate: orderStats.lastOrderDate,
            createdAt: profile.createdAt,
            lastLogin: undefined, // Would need to track this separately
            isActive: true, // Would need to implement this field
          } as CustomerListItem;
        })
      );

      // Apply client-side filters
      let filteredCustomers = customersWithStats;

      if (filters?.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        filteredCustomers = customersWithStats.filter(customer =>
          customer.firstName?.toLowerCase().includes(query) ||
          customer.lastName?.toLowerCase().includes(query) ||
          customer.email?.toLowerCase().includes(query) ||
          customer.phone?.toLowerCase().includes(query)
        );
      }

      if (filters?.hasOrders !== undefined) {
        filteredCustomers = filteredCustomers.filter(customer =>
          filters.hasOrders ? customer.totalOrders > 0 : customer.totalOrders === 0
        );
      }

      if (filters?.registeredAfter) {
        const afterDate = new Date(filters.registeredAfter);
        filteredCustomers = filteredCustomers.filter(customer =>
          new Date(customer.createdAt) >= afterDate
        );
      }

      if (filters?.registeredBefore) {
        const beforeDate = new Date(filters.registeredBefore);
        filteredCustomers = filteredCustomers.filter(customer =>
          new Date(customer.createdAt) <= beforeDate
        );
      }

      if (filters?.totalSpentMin !== undefined) {
        filteredCustomers = filteredCustomers.filter(customer =>
          customer.totalSpent >= filters.totalSpentMin!
        );
      }

      if (filters?.totalSpentMax !== undefined) {
        filteredCustomers = filteredCustomers.filter(customer =>
          customer.totalSpent <= filters.totalSpentMax!
        );
      }

      // Sort by creation date (newest first)
      filteredCustomers.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      // Apply pagination
      const totalCount = filteredCustomers.length;
      const paginatedCustomers = filteredCustomers.slice(offset, offset + limit);

      return {
        customers: paginatedCustomers,
        totalCount
      };
    } catch (error) {
      console.error('Error fetching customers:', error);
      throw new Error('Failed to fetch customers');
    }
  }

  /**
   * Get detailed customer information including orders and addresses
   */
  static async getCustomerDetails(userId: string): Promise<CustomerDetails | null> {
    try {
      // Get customer profile
      const profileResponse = await client.models.UserProfile.list({
        filter: { userId: { eq: userId } },
      });

      if (!profileResponse.data || profileResponse.data.length === 0) {
        return null;
      }

      const profile = profileResponse.data[0];

      // Get customer addresses
      const addressesResponse = await client.models.Address.list({
        filter: { userId: { eq: userId } },
      });

      // Get customer orders
      const ordersResponse = await client.models.Order.list({
        filter: { customerId: { eq: userId } },
      });

      // Convert Amplify orders to our Order type
      const orders: Order[] = (ordersResponse.data || []).map(order => ({
        id: order.id,
        customerId: order.customerId,
        subtotal: order.subtotal,
        tax: order.tax || 0,
        shipping: order.shipping || 0,
        totalAmount: order.totalAmount,
        status: order.status as Order['status'],
        confirmationNumber: order.confirmationNumber || undefined,
        paymentOrderId: order.paymentOrderId || undefined,
        trackingNumber: order.trackingNumber || undefined,
        estimatedDelivery: order.estimatedDelivery || undefined,
        shippingFirstName: order.shippingFirstName,
        shippingLastName: order.shippingLastName,
        shippingAddressLine1: order.shippingAddressLine1,
        shippingAddressLine2: order.shippingAddressLine2 || undefined,
        shippingCity: order.shippingCity,
        shippingState: order.shippingState,
        shippingPostalCode: order.shippingPostalCode,
        shippingCountry: order.shippingCountry,
        billingFirstName: order.billingFirstName,
        billingLastName: order.billingLastName,
        billingAddressLine1: order.billingAddressLine1,
        billingAddressLine2: order.billingAddressLine2 || undefined,
        billingCity: order.billingCity,
        billingState: order.billingState,
        billingPostalCode: order.billingPostalCode,
        billingCountry: order.billingCountry,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
      }));

      // Get order statistics
      const orderStats = await this.getCustomerOrderStats(userId);

      // Get account activity (mock implementation)
      const accountActivity = await this.getCustomerActivity(userId);

      const customerDetails: CustomerDetails = {
        id: profile.id,
        userId: profile.userId,
        firstName: profile.firstName,
        lastName: profile.lastName,
        email: undefined, // Would need to fetch from Cognito
        phone: profile.phone,
        role: profile.role as UserRole,
        newsletter: profile.newsletter,
        smsUpdates: profile.smsUpdates,
        preferredCategories: profile.preferredCategories?.filter((cat): cat is string => cat !== null) || [],
        totalOrders: orderStats.totalOrders,
        totalSpent: orderStats.totalSpent,
        lastOrderDate: orderStats.lastOrderDate,
        createdAt: profile.createdAt,
        lastLogin: undefined, // Would need to track this separately
        isActive: true, // Would need to implement this field
        addresses: addressesResponse.data || [],
        orders: orders,
        accountActivity,
      };

      return customerDetails;
    } catch (error) {
      console.error('Error fetching customer details:', error);
      throw new Error('Failed to fetch customer details');
    }
  }

  /**
   * Update customer profile information
   */
  static async updateCustomer(
    input: UpdateCustomerInput,
    adminContext: AdminContext
  ): Promise<{ success: boolean; customer?: CustomerListItem; error?: string }> {
    try {
      // Get existing profile
      const existingResponse = await client.models.UserProfile.list({
        filter: { userId: { eq: input.userId } },
      });

      if (!existingResponse.data || existingResponse.data.length === 0) {
        // Log failed attempt
        await AdminAuditService.logUserAction(
          adminContext,
          'user_updated',
          input.userId,
          undefined,
          'Failed to update customer - customer not found',
          { updateData: input },
          false,
          'Customer not found'
        );
        return { success: false, error: 'Customer not found' };
      }

      const existingProfile = existingResponse.data[0];

      // Update the profile
      const updateData: any = {};
      if (input.firstName !== undefined) updateData.firstName = input.firstName;
      if (input.lastName !== undefined) updateData.lastName = input.lastName;
      if (input.phone !== undefined) updateData.phone = input.phone;
      if (input.newsletter !== undefined) updateData.newsletter = input.newsletter;
      if (input.smsUpdates !== undefined) updateData.smsUpdates = input.smsUpdates;
      if (input.preferredCategories !== undefined) updateData.preferredCategories = input.preferredCategories;

      const response = await client.models.UserProfile.update({
        id: existingProfile.id,
        ...updateData,
      });

      if (!response.data) {
        // Log failed update
        await AdminAuditService.logUserAction(
          adminContext,
          'user_updated',
          input.userId,
          undefined,
          'Failed to update customer profile',
          { updateData },
          false,
          'Database update failed'
        );
        return { success: false, error: 'Failed to update customer' };
      }

      // Log successful update
      await AdminAuditService.logUserAction(
        adminContext,
        'user_updated',
        input.userId,
        undefined,
        'Customer profile updated by admin',
        { 
          updatedFields: Object.keys(updateData),
          updateData 
        },
        true
      );

      // Get updated customer with stats
      const orderStats = await this.getCustomerOrderStats(input.userId);

      const updatedCustomer: CustomerListItem = {
        id: response.data.id,
        userId: response.data.userId,
        firstName: response.data.firstName,
        lastName: response.data.lastName,
        email: undefined,
        phone: response.data.phone,
        role: response.data.role as UserRole,
        newsletter: response.data.newsletter,
        smsUpdates: response.data.smsUpdates,
        preferredCategories: response.data.preferredCategories?.filter((cat): cat is string => cat !== null) || [],
        totalOrders: orderStats.totalOrders,
        totalSpent: orderStats.totalSpent,
        lastOrderDate: orderStats.lastOrderDate,
        createdAt: response.data.createdAt,
        lastLogin: undefined,
        isActive: true,
      };

      return { success: true, customer: updatedCustomer };
    } catch (error) {
      console.error('Error updating customer:', error);
      
      // Log error
      await AdminAuditService.logUserAction(
        adminContext,
        'user_updated',
        input.userId,
        undefined,
        'Error updating customer profile',
        { updateData: input },
        false,
        error instanceof Error ? error.message : 'Unknown error'
      );
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update customer'
      };
    }
  }

  /**
   * Reset customer password (admin action)
   */
  static async resetCustomerPassword(
    input: CustomerPasswordResetInput,
    adminContext: AdminContext
  ): Promise<{ success: boolean; temporaryPassword?: string; error?: string }> {
    try {
      // In a real implementation, this would use AWS Cognito Admin APIs
      // to reset the user's password and generate a temporary password
      
      // Mock implementation - generate a temporary password
      const temporaryPassword = this.generateTemporaryPassword();
      
      console.log(`Password reset initiated for user ${input.userId} by admin ${input.adminId}`);
      console.log(`Reason: ${input.reason}`);
      console.log(`Temporary password: ${temporaryPassword}`);

      // Log admin action
      await AdminAuditService.logUserAction(
        adminContext,
        'password_reset',
        input.userId,
        undefined,
        `Password reset by admin. Reason: ${input.reason}`,
        { reason: input.reason },
        true
      );

      // In a real app, you would:
      // 1. Use AWS Cognito AdminSetUserPassword API
      // 2. Send email notification to customer
      // 3. Set password to temporary state requiring change on next login

      return {
        success: true,
        temporaryPassword,
      };
    } catch (error) {
      console.error('Error resetting customer password:', error);
      
      // Log failed attempt
      await AdminAuditService.logUserAction(
        adminContext,
        'password_reset',
        input.userId,
        undefined,
        `Failed to reset password. Reason: ${input.reason}`,
        { reason: input.reason },
        false,
        error instanceof Error ? error.message : 'Unknown error'
      );
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to reset password'
      };
    }
  }

  /**
   * Get customer statistics for admin dashboard
   */
  static async getCustomerStatistics(): Promise<{
    totalCustomers: number;
    activeCustomers: number;
    newCustomersThisMonth: number;
    customersWithOrders: number;
    averageOrderValue: number;
    topCustomers: CustomerListItem[];
  }> {
    try {
      const response = await client.models.UserProfile.list({
        filter: { role: { eq: 'customer' } },
        limit: 1000,
      });

      if (!response.data) {
        return {
          totalCustomers: 0,
          activeCustomers: 0,
          newCustomersThisMonth: 0,
          customersWithOrders: 0,
          averageOrderValue: 0,
          topCustomers: [],
        };
      }

      const customers = response.data;
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      // Get customers with order statistics
      const customersWithStats = await Promise.all(
        customers.slice(0, 20).map(async (profile) => {
          const orderStats = await this.getCustomerOrderStats(profile.userId);
          
          return {
            id: profile.id,
            userId: profile.userId,
            firstName: profile.firstName,
            lastName: profile.lastName,
            email: undefined,
            phone: profile.phone,
            role: profile.role as UserRole,
            newsletter: profile.newsletter,
            smsUpdates: profile.smsUpdates,
            preferredCategories: profile.preferredCategories,
            totalOrders: orderStats.totalOrders,
            totalSpent: orderStats.totalSpent,
            lastOrderDate: orderStats.lastOrderDate,
            createdAt: profile.createdAt,
            lastLogin: undefined,
            isActive: true,
          } as CustomerListItem;
        })
      );

      const stats = {
        totalCustomers: customers.length,
        activeCustomers: customers.length, // Would need to implement active tracking
        newCustomersThisMonth: customers.filter(c => 
          new Date(c.createdAt) >= startOfMonth
        ).length,
        customersWithOrders: customersWithStats.filter(c => c.totalOrders > 0).length,
        averageOrderValue: customersWithStats.reduce((sum, c) => 
          sum + (c.totalOrders > 0 ? c.totalSpent / c.totalOrders : 0), 0
        ) / Math.max(customersWithStats.filter(c => c.totalOrders > 0).length, 1),
        topCustomers: customersWithStats
          .sort((a, b) => b.totalSpent - a.totalSpent)
          .slice(0, 10),
      };

      return stats;
    } catch (error) {
      console.error('Error fetching customer statistics:', error);
      throw new Error('Failed to fetch customer statistics');
    }
  }

  /**
   * Get customer order statistics
   */
  private static async getCustomerOrderStats(customerId: string): Promise<{
    totalOrders: number;
    totalSpent: number;
    lastOrderDate?: string;
  }> {
    try {
      const ordersResponse = await client.models.Order.list({
        filter: { customerId: { eq: customerId } },
      });

      if (!ordersResponse.data || ordersResponse.data.length === 0) {
        return { totalOrders: 0, totalSpent: 0 };
      }

      const orders = ordersResponse.data;
      const totalOrders = orders.length;
      const totalSpent = orders.reduce((sum, order) => sum + order.totalAmount, 0);
      const lastOrderDate = orders
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]
        ?.createdAt;

      return { totalOrders, totalSpent, lastOrderDate };
    } catch (error) {
      console.error('Error fetching customer order stats:', error);
      return { totalOrders: 0, totalSpent: 0 };
    }
  }

  /**
   * Get customer account activity (mock implementation)
   */
  private static async getCustomerActivity(userId: string): Promise<CustomerActivity[]> {
    // Mock implementation - in a real app, this would query an audit log table
    const mockActivities: CustomerActivity[] = [
      {
        id: 'activity-1',
        type: 'login',
        description: 'Customer logged in',
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'activity-2',
        type: 'order_placed',
        description: 'Order placed - CONF-001',
        timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        metadata: { orderId: 'order-1', amount: 2950 },
      },
      {
        id: 'activity-3',
        type: 'profile_updated',
        description: 'Profile information updated',
        timestamp: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ];

    return mockActivities;
  }

  /**
   * Log admin action for audit trail
   */
  private static async logAdminAction(action: {
    adminId: string;
    customerId: string;
    action: string;
    description: string;
    metadata?: Record<string, any>;
  }): Promise<void> {
    try {
      // Use the new audit logging service
      const { AuditLoggingService } = await import('./audit-logging');
      
      await AuditLoggingService.logAdminAction({
        adminId: action.adminId,
        targetUserId: action.customerId,
        action: action.action as any,
        resource: 'user',
        resourceId: action.customerId,
        description: action.description,
        metadata: action.metadata,
      });
    } catch (error) {
      console.error('Error logging admin action:', error);
      // Don't throw error as this is logging - shouldn't break main functionality
    }
  }

  /**
   * Generate temporary password for password resets
   */
  private static generateTemporaryPassword(): string {
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }

  /**
   * Search customers by various criteria
   */
  static async searchCustomers(
    query: string,
    searchType: 'name' | 'email' | 'phone' | 'all' = 'all'
  ): Promise<CustomerListItem[]> {
    try {
      const response = await client.models.UserProfile.list({
        filter: { role: { eq: 'customer' } },
        limit: 50,
      });

      if (!response.data) {
        return [];
      }

      const searchQuery = query.toLowerCase();
      
      const filteredProfiles = response.data.filter(profile => {
        switch (searchType) {
          case 'name':
            return profile.firstName?.toLowerCase().includes(searchQuery) ||
                   profile.lastName?.toLowerCase().includes(searchQuery);
          case 'phone':
            return profile.phone?.toLowerCase().includes(searchQuery);
          case 'email':
            // Would need to search Cognito user attributes
            return false;
          case 'all':
          default:
            return profile.firstName?.toLowerCase().includes(searchQuery) ||
                   profile.lastName?.toLowerCase().includes(searchQuery) ||
                   profile.phone?.toLowerCase().includes(searchQuery);
        }
      });

      // Convert to CustomerListItem with order stats
      const customersWithStats = await Promise.all(
        filteredProfiles.map(async (profile) => {
          const orderStats = await this.getCustomerOrderStats(profile.userId);
          
          return {
            id: profile.id,
            userId: profile.userId,
            firstName: profile.firstName,
            lastName: profile.lastName,
            email: undefined,
            phone: profile.phone,
            role: profile.role as UserRole,
            newsletter: profile.newsletter,
            smsUpdates: profile.smsUpdates,
            preferredCategories: profile.preferredCategories,
            totalOrders: orderStats.totalOrders,
            totalSpent: orderStats.totalSpent,
            lastOrderDate: orderStats.lastOrderDate,
            createdAt: profile.createdAt,
            lastLogin: undefined,
            isActive: true,
          } as CustomerListItem;
        })
      );

      return customersWithStats;
    } catch (error) {
      console.error('Error searching customers:', error);
      throw new Error('Failed to search customers');
    }
  }
}