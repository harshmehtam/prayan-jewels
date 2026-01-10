// COMMENTED OUT - Admin inventory manager component - Not needed for now since inventory models are disabled
/*
'use client';

import React, { useState, useEffect } from 'react';
import { Product, InventoryItem, InventoryAlert } from '@/types';
import { InventoryService } from '@/lib/data/inventory';
import { AdminProductService } from '@/lib/services/admin-products';
import { PermissionGate } from '@/components/auth/AdminRoute';

// Component implementation commented out since inventory is disabled
*/

// Stub component for build compatibility
export default function AdminInventoryManager({ className = '' }: { className?: string }) {
  return (
    <div className={className}>
      <div className="text-center py-8">
        <h2 className="text-xl font-semibold text-gray-600">Inventory Manager</h2>
        <p className="text-gray-500 mt-2">Inventory management is currently disabled</p>
      </div>
    </div>
  );
}