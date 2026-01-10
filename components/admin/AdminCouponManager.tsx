'use client';

import React, { useState, useEffect } from 'react';
import { AdminCouponService, CreateCouponInput, UpdateCouponInput, CouponFilters } from '@/lib/services/admin-coupons';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
// import { Switch } from '@/components/ui/switch';
// import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Plus, Edit, Trash2, Search, Filter, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRoleAccess } from '@/lib/hooks/useRoleAccess';

interface Coupon {
  id: string;
  code: string;
  name: string;
  description?: string;
  type: 'percentage' | 'fixed_amount';
  value: number;
  minimumOrderAmount?: number;
  maximumDiscountAmount?: number;
  usageLimit?: number | null;
  usageCount: number;
  userUsageLimit?: number | null;
  isActive: boolean;
  validFrom: string;
  validUntil: string;
  applicableProducts?: string[];
  excludedProducts?: string[];
  allowedUsers?: string[];
  excludedUsers?: string[];
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export default function AdminCouponManager() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<CouponFilters>({});
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const { toast } = useToast();
  const { hasPermission, userId, userRole, userProfile } = useRoleAccess();

  // Debug logging
  useEffect(() => {
    console.log('AdminCouponManager - User Role:', userRole);
    console.log('AdminCouponManager - User Profile:', userProfile);
    console.log('AdminCouponManager - Can Update Coupons:', hasPermission('admin/coupons', 'update'));
    console.log('AdminCouponManager - Can Delete Coupons:', hasPermission('admin/coupons', 'delete'));
  }, [userRole, userProfile, hasPermission]);

  // Debug editingCoupon state changes
  useEffect(() => {
    console.log('editingCoupon state changed:', editingCoupon?.id || 'null');
  }, [editingCoupon]);

  const [formData, setFormData] = useState<CreateCouponInput>({
    code: '',
    name: '',
    description: '',
    type: 'percentage',
    value: 0,
    minimumOrderAmount: 0,
    maximumDiscountAmount: undefined,
    usageLimit: null,
    userUsageLimit: null, // No default limit (unlimited)
    validFrom: '',
    validUntil: '',
    applicableProducts: [],
    excludedProducts: [],
    allowedUsers: [],
    excludedUsers: [],
  });

  useEffect(() => {
    loadCoupons();
  }, [filters]);

  const loadCoupons = async () => {
    try {
      setLoading(true);
      const data = await AdminCouponService.getCoupons(filters);
      setCoupons(data as Coupon[]);
    } catch (error) {
      console.error('Error loading coupons:', error);
      toast({
        title: 'Error',
        description: 'Failed to load coupons',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCoupon = async () => {
    try {
      if (!userId) {
        toast({
          title: 'Error',
          description: 'Admin ID not found',
          variant: 'destructive',
        });
        return;
      }

      // Validate dates
      if (!formData.validFrom || !formData.validUntil) {
        toast({
          title: 'Error',
          description: 'Please select valid from and until dates',
          variant: 'destructive',
        });
        return;
      }

      // Convert date strings to datetime format
      const couponData = {
        ...formData,
        validFrom: new Date(formData.validFrom + 'T00:00:00.000Z').toISOString(),
        validUntil: new Date(formData.validUntil + 'T23:59:59.999Z').toISOString(),
      };

      await AdminCouponService.createCoupon(couponData, userId);
      toast({
        title: 'Success',
        description: 'Coupon created successfully',
      });
      setIsCreateDialogOpen(false);
      resetForm();
      loadCoupons();
    } catch (error) {
      console.error('Error creating coupon:', error);
      toast({
        title: 'Error',
        description: 'Failed to create coupon',
        variant: 'destructive',
      });
    }
  };

  const handleUpdateCoupon = async () => {
    try {
      if (!editingCoupon) return;

      // Validate dates
      if (!formData.validFrom || !formData.validUntil) {
        toast({
          title: 'Error',
          description: 'Please select valid from and until dates',
          variant: 'destructive',
        });
        return;
      }

      // Convert date strings to datetime format
      const updateData: UpdateCouponInput = {
        id: editingCoupon.id,
        ...formData,
        validFrom: new Date(formData.validFrom + 'T00:00:00.000Z').toISOString(),
        validUntil: new Date(formData.validUntil + 'T23:59:59.999Z').toISOString(),
      };

      // Debug: Log the form data and update data
      console.log('HandleUpdateCoupon - Form data:', formData);
      console.log('HandleUpdateCoupon - Update data:', updateData);
      console.log('HandleUpdateCoupon - usageLimit value:', formData.usageLimit, typeof formData.usageLimit);

      await AdminCouponService.updateCoupon(updateData);
      toast({
        title: 'Success',
        description: 'Coupon updated successfully',
      });
      setEditingCoupon(null);
      resetForm();
      loadCoupons();
    } catch (error) {
      console.error('Error updating coupon:', error);
      toast({
        title: 'Error',
        description: 'Failed to update coupon',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteCoupon = async (id: string) => {
    try {
      await AdminCouponService.deleteCoupon(id);
      toast({
        title: 'Success',
        description: 'Coupon deleted successfully',
      });
      loadCoupons();
    } catch (error) {
      console.error('Error deleting coupon:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete coupon',
        variant: 'destructive',
      });
    }
  };

  const handleToggleStatus = async (id: string, isActive: boolean) => {
    try {
      await AdminCouponService.toggleCouponStatus(id, isActive);
      toast({
        title: 'Success',
        description: `Coupon ${isActive ? 'activated' : 'deactivated'} successfully`,
      });
      loadCoupons();
    } catch (error) {
      console.error('Error toggling coupon status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update coupon status',
        variant: 'destructive',
      });
    }
  };

  const resetForm = () => {
    setFormData({
      code: '',
      name: '',
      description: '',
      type: 'percentage',
      value: 0,
      minimumOrderAmount: 0,
      maximumDiscountAmount: undefined,
      usageLimit: null,
      userUsageLimit: null, // No default limit (unlimited)
      validFrom: '',
      validUntil: '',
      applicableProducts: [],
      excludedProducts: [],
      allowedUsers: [],
      excludedUsers: [],
    });
  };

  const openEditDialog = (coupon: Coupon) => {
    console.log('openEditDialog called with coupon:', coupon.id, coupon.name);
    setEditingCoupon(coupon);
    console.log('setEditingCoupon called, new state should be:', coupon.id);
    setFormData({
      code: coupon.code,
      name: coupon.name,
      description: coupon.description || '',
      type: coupon.type,
      value: coupon.value,
      minimumOrderAmount: coupon.minimumOrderAmount || 0,
      maximumDiscountAmount: coupon.maximumDiscountAmount,
      usageLimit: coupon.usageLimit,
      userUsageLimit: coupon.userUsageLimit || null,
      validFrom: coupon.validFrom.split('T')[0],
      validUntil: coupon.validUntil.split('T')[0],
      applicableProducts: coupon.applicableProducts || [],
      excludedProducts: coupon.excludedProducts || [],
      allowedUsers: coupon.allowedUsers || [],
      excludedUsers: coupon.excludedUsers || [],
    });
    console.log('Form data set for editing');
  };

  const filteredCoupons = coupons.filter(coupon =>
    coupon.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    coupon.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (coupon.description && coupon.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const isExpired = (dateString: string) => {
    return new Date(dateString) < new Date();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Coupon Management</h2>
          <p className="text-muted-foreground">Create and manage discount coupons</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger 
            className={buttonVariants({ variant: "default", size: "default" })}
            onClick={resetForm}
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Coupon
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Coupon</DialogTitle>
              <DialogDescription>
                Create a new discount coupon for your customers
              </DialogDescription>
            </DialogHeader>
            <CouponForm
              formData={formData}
              setFormData={setFormData}
              onSubmit={handleCreateCoupon}
              onCancel={() => setIsCreateDialogOpen(false)}
              isEditing={false}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search by code, name, or description..."
                  value={searchTerm}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Label>Status</Label>
              <Select
                value={filters.isActive?.toString() || 'all'}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => 
                  setFilters(prev => ({
                    ...prev,
                    isActive: e.target.value === 'all' ? undefined : e.target.value === 'true'
                  }))
                }
              >
                <option value="all">All</option>
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </Select>
            </div>
            <div>
              <Label>Type</Label>
              <Select
                value={filters.type || 'all'}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => 
                  setFilters(prev => ({
                    ...prev,
                    type: e.target.value === 'all' ? undefined : e.target.value as 'percentage' | 'fixed_amount'
                  }))
                }
              >
                <option value="all">All Types</option>
                <option value="percentage">Percentage</option>
                <option value="fixed_amount">Fixed Amount</option>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Coupons List */}
      <div className="grid gap-4">
        {loading ? (
          <div className="text-center py-8">Loading coupons...</div>
        ) : filteredCoupons.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No coupons found
          </div>
        ) : (
          filteredCoupons.map((coupon) => (
            <Card key={coupon.id}>
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold">{coupon.name}</h3>
                      <Badge variant={coupon.isActive ? 'default' : 'secondary'}>
                        {coupon.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                      {isExpired(coupon.validUntil) && (
                        <Badge variant="destructive">Expired</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="font-mono bg-muted px-2 py-1 rounded">
                        {coupon.code}
                      </span>
                      <span>
                        {coupon.type === 'percentage' 
                          ? `${coupon.value}% OFF`
                          : `₹${coupon.value} OFF`
                        }
                      </span>
                      <span>
                        Used: {coupon.usageCount}
                        {coupon.usageLimit && ` / ${coupon.usageLimit}`}
                      </span>
                    </div>
                    {coupon.description && (
                      <p className="text-sm text-muted-foreground">
                        {coupon.description}
                      </p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>Valid: {formatDate(coupon.validFrom)} - {formatDate(coupon.validUntil)}</span>
                      {coupon.minimumOrderAmount && (
                        <span>Min order: ₹{coupon.minimumOrderAmount}</span>
                      )}
                      {coupon.maximumDiscountAmount && (
                        <span>Max discount: ₹{coupon.maximumDiscountAmount}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleStatus(coupon.id, !coupon.isActive)}
                    >
                      {coupon.isActive ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                    {userRole && (userRole === 'admin' || userRole === 'super_admin') ? (
                      <Dialog open={editingCoupon?.id === coupon.id} onOpenChange={(open) => {
                        console.log('Dialog onOpenChange called:', open, 'for coupon:', coupon.id);
                        if (!open) setEditingCoupon(null);
                      }}>
                        <DialogTrigger
                          className={buttonVariants({ variant: "outline", size: "sm" })}
                          onClick={() => {
                            console.log('Edit button clicked for coupon:', coupon.id);
                            console.log('Current editingCoupon:', editingCoupon?.id);
                            openEditDialog(coupon);
                            console.log('After openEditDialog, editingCoupon should be:', coupon.id);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>Edit Coupon</DialogTitle>
                            <DialogDescription>
                              Update coupon details
                            </DialogDescription>
                          </DialogHeader>
                          <CouponForm
                            formData={formData}
                            setFormData={setFormData}
                            onSubmit={handleUpdateCoupon}
                            onCancel={() => setEditingCoupon(null)}
                            isEditing={true}
                          />
                        </DialogContent>
                      </Dialog>
                    ) : (
                      <div className="text-xs text-red-500">No edit permission (Role: {userRole})</div>
                    )}
                    {/* Only super_admin can delete coupons */}
                    {userRole === 'super_admin' && (
                      <AlertDialog>
                        <AlertDialogTrigger className={buttonVariants({ variant: "outline", size: "sm" })}>
                          <Trash2 className="h-4 w-4" />
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Coupon</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete this coupon? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteCoupon(coupon.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

interface CouponFormProps {
  formData: CreateCouponInput;
  setFormData: React.Dispatch<React.SetStateAction<CreateCouponInput>>;
  onSubmit: () => void;
  onCancel: () => void;
  isEditing: boolean;
}

function CouponForm({ formData, setFormData, onSubmit, onCancel, isEditing }: CouponFormProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="code">Coupon Code *</Label>
          <Input
            id="code"
            value={formData.code}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
            placeholder="SAVE20"
            required
          />
        </div>
        <div>
          <Label htmlFor="name">Display Name *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            placeholder="20% Off Sale"
            required
          />
        </div>
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          placeholder="Get 20% off on all products"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="type">Discount Type *</Label>
          <Select
            value={formData.type}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => 
              setFormData(prev => ({ ...prev, type: e.target.value as 'percentage' | 'fixed_amount' }))
            }
          >
            <option value="percentage">Percentage</option>
            <option value="fixed_amount">Fixed Amount</option>
          </Select>
        </div>
        <div>
          <Label htmlFor="value">
            Discount Value * {formData.type === 'percentage' ? '(%)' : '(₹)'}
          </Label>
          <Input
            id="value"
            type="number"
            min="0"
            step={formData.type === 'percentage' ? '0.01' : '1'}
            max={formData.type === 'percentage' ? '100' : undefined}
            value={formData.value}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, value: parseFloat(e.target.value) || 0 }))}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="minimumOrderAmount">Minimum Order Amount (₹)</Label>
          <Input
            id="minimumOrderAmount"
            type="number"
            min="0"
            value={formData.minimumOrderAmount}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ 
              ...prev, 
              minimumOrderAmount: parseFloat(e.target.value) || 0 
            }))}
          />
        </div>
        {formData.type === 'percentage' && (
          <div>
            <Label htmlFor="maximumDiscountAmount">Maximum Discount Amount (₹)</Label>
            <Input
              id="maximumDiscountAmount"
              type="number"
              min="0"
              value={formData.maximumDiscountAmount || ''}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ 
                ...prev, 
                maximumDiscountAmount: e.target.value ? parseFloat(e.target.value) : undefined
              }))}
            />
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="usageLimit">Total Usage Limit</Label>
          <Input
            id="usageLimit"
            type="number"
            min="1"
            value={formData.usageLimit || ''}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ 
              ...prev, 
              usageLimit: e.target.value ? parseInt(e.target.value) : null
            }))}
            placeholder="Unlimited"
          />
        </div>
        <div>
          <Label htmlFor="userUsageLimit">Per User Usage Limit</Label>
          <Input
            id="userUsageLimit"
            type="number"
            min="1"
            value={formData.userUsageLimit || ''}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ 
              ...prev, 
              userUsageLimit: e.target.value ? parseInt(e.target.value) : null
            }))}
            placeholder="Unlimited"
          />
          <p className="text-xs text-gray-500 mt-1">
            How many times each user can use this coupon. Leave empty for unlimited usage per user.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="validFrom">Valid From *</Label>
          <Input
            id="validFrom"
            type="date"
            value={formData.validFrom}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, validFrom: e.target.value }))}
            required
          />
        </div>
        <div>
          <Label htmlFor="validUntil">Valid Until *</Label>
          <Input
            id="validUntil"
            type="date"
            value={formData.validUntil}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, validUntil: e.target.value }))}
            required
          />
        </div>
      </div>

      {/* User Restrictions */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium text-gray-900">User Restrictions (Optional)</h4>
        <div className="grid grid-cols-1 gap-4">
          <div>
            <Label htmlFor="allowedUsers">Allowed Users (User IDs)</Label>
            <Textarea
              id="allowedUsers"
              placeholder="Enter user IDs separated by commas (leave empty for all users)"
              value={formData.allowedUsers?.join(', ') || ''}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => 
                setFormData(prev => ({ 
                  ...prev, 
                  allowedUsers: e.target.value ? e.target.value.split(',').map(id => id.trim()).filter(id => id) : []
                }))
              }
              rows={2}
            />
            <p className="text-xs text-gray-500 mt-1">
              If specified, only these users can use this coupon. Leave empty to allow all users.
            </p>
          </div>
          <div>
            <Label htmlFor="excludedUsers">Excluded Users (User IDs)</Label>
            <Textarea
              id="excludedUsers"
              placeholder="Enter user IDs separated by commas"
              value={formData.excludedUsers?.join(', ') || ''}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => 
                setFormData(prev => ({ 
                  ...prev, 
                  excludedUsers: e.target.value ? e.target.value.split(',').map(id => id.trim()).filter(id => id) : []
                }))
              }
              rows={2}
            />
            <p className="text-xs text-gray-500 mt-1">
              These users will not be able to use this coupon.
            </p>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          {isEditing ? 'Update Coupon' : 'Create Coupon'}
        </Button>
      </div>
    </form>
  );
}