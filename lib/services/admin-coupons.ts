import { generateClient } from 'aws-amplify/data';
import type { Schema } from '@/amplify/data/resource';

// Admin operations require authentication
const client = generateClient<Schema>();

export interface CreateCouponInput {
  code: string;
  name: string;
  description?: string;
  type: 'percentage' | 'fixed_amount';
  value: number;
  minimumOrderAmount?: number;
  maximumDiscountAmount?: number;
  usageLimit?: number | null;
  userUsageLimit?: number | null;
  showOnHeader?: boolean;
  validFrom: string;
  validUntil: string;
  applicableProducts?: string[];
  excludedProducts?: string[];
  allowedUsers?: string[];
  excludedUsers?: string[];
}

export interface UpdateCouponInput extends Partial<CreateCouponInput> {
  id: string;
}

export interface CouponFilters {
  isActive?: boolean;
  type?: 'percentage' | 'fixed_amount';
  search?: string;
}

export class AdminCouponService {
  static async createCoupon(input: CreateCouponInput, adminId: string) {
    try {
      const { data, errors } = await client.models.Coupon.create({
        ...input,
        createdBy: adminId,
        isActive: true,
        usageCount: 0,
      });

      if (errors) {
        throw new Error(`Failed to create coupon: ${errors.map(e => e.message).join(', ')}`);
      }

      return data;
    } catch (error) {
      console.error('Error creating coupon:', error);
      throw error;
    }
  }

  static async updateCoupon(input: UpdateCouponInput) {
    try {
      const { id, ...updateData } = input;
      
      // Filter out undefined values but keep null values (to explicitly clear fields)
      const cleanUpdateData = Object.fromEntries(
        Object.entries(updateData).filter(([_, value]) => value !== undefined)
      );
      
      // Debug: Log the update data
      console.log('UpdateCoupon - Raw input:', input);
      console.log('UpdateCoupon - Cleaned update data:', cleanUpdateData);
      
      const { data, errors } = await client.models.Coupon.update({
        id,
        ...cleanUpdateData,
      });

      if (errors) {
        throw new Error(`Failed to update coupon: ${errors.map(e => e.message).join(', ')}`);
      }

      return data;
    } catch (error) {
      console.error('Error updating coupon:', error);
      throw error;
    }
  }

  static async deleteCoupon(id: string) {
    try {
      const { data, errors } = await client.models.Coupon.delete({ id });

      if (errors) {
        throw new Error(`Failed to delete coupon: ${errors.map(e => e.message).join(', ')}`);
      }

      return data;
    } catch (error) {
      console.error('Error deleting coupon:', error);
      throw error;
    }
  }

  static async getCoupons(filters?: CouponFilters) {
    try {
      let query = client.models.Coupon.list();

      const { data, errors } = await query;

      if (errors) {
        throw new Error(`Failed to fetch coupons: ${errors.map(e => e.message).join(', ')}`);
      }

      let filteredData = data || [];

      // Apply filters
      if (filters?.isActive !== undefined) {
        filteredData = filteredData.filter(coupon => coupon.isActive === filters.isActive);
      }

      if (filters?.type) {
        filteredData = filteredData.filter(coupon => coupon.type === filters.type);
      }

      if (filters?.search) {
        const searchLower = filters.search.toLowerCase();
        filteredData = filteredData.filter(coupon => 
          coupon.code.toLowerCase().includes(searchLower) ||
          coupon.name.toLowerCase().includes(searchLower) ||
          (coupon.description && coupon.description.toLowerCase().includes(searchLower))
        );
      }

      return filteredData;
    } catch (error) {
      console.error('Error fetching coupons:', error);
      throw error;
    }
  }

  static async getCouponById(id: string) {
    try {
      const { data, errors } = await client.models.Coupon.get({ id });

      if (errors) {
        throw new Error(`Failed to fetch coupon: ${errors.map(e => e.message).join(', ')}`);
      }

      return data;
    } catch (error) {
      console.error('Error fetching coupon:', error);
      throw error;
    }
  }

  static async getCouponByCode(code: string) {
    try {
      const { data, errors } = await client.models.Coupon.list({
        filter: { code: { eq: code } }
      });

      if (errors) {
        throw new Error(`Failed to fetch coupon: ${errors.map(e => e.message).join(', ')}`);
      }

      return data?.[0] || null;
    } catch (error) {
      console.error('Error fetching coupon by code:', error);
      throw error;
    }
  }

  static async toggleCouponStatus(id: string, isActive: boolean) {
    try {
      const { data, errors } = await client.models.Coupon.update({
        id,
        isActive,
      });

      if (errors) {
        throw new Error(`Failed to toggle coupon status: ${errors.map(e => e.message).join(', ')}`);
      }

      return data;
    } catch (error) {
      console.error('Error toggling coupon status:', error);
      throw error;
    }
  }

  static async incrementCouponUsage(id: string) {
    try {
      // First get the current coupon
      const coupon = await this.getCouponById(id);
      if (!coupon) {
        throw new Error('Coupon not found');
      }

      const { data, errors } = await client.models.Coupon.update({
        id,
        usageCount: (coupon.usageCount || 0) + 1,
      });

      if (errors) {
        throw new Error(`Failed to increment coupon usage: ${errors.map(e => e.message).join(', ')}`);
      }

      return data;
    } catch (error) {
      console.error('Error incrementing coupon usage:', error);
      throw error;
    }
  }

  static async getActiveCoupons() {
    try {
      const now = new Date().toISOString();
      const { data, errors } = await client.models.Coupon.list({
        filter: {
          isActive: { eq: true },
          validFrom: { le: now },
          validUntil: { ge: now },
        }
      });

      if (errors) {
        throw new Error(`Failed to fetch active coupons: ${errors.map(e => e.message).join(', ')}`);
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching active coupons:', error);
      throw error;
    }
  }
}