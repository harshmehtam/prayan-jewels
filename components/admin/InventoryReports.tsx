// COMMENTED OUT - Inventory reports component - Not needed for now since inventory models are disabled
/*
'use client';

import React, { useState, useEffect } from 'react';
import { Product, InventoryItem } from '@/types';
import { InventoryService } from '@/lib/data/inventory';
import { AdminProductService } from '@/lib/services/admin-products';
import { LoadingSpinner } from '@/components/ui';

// Component implementation commented out since inventory is disabled
*/

// Stub component for build compatibility
export default function InventoryReports({ className = '' }: { className?: string }) {
  return (
    <div className={className}>
      <div className="text-center py-8">
        <h2 className="text-xl font-semibold text-gray-600">Inventory Reports</h2>
        <p className="text-gray-500 mt-2">Inventory reporting is currently disabled</p>
      </div>
    </div>
  );
}