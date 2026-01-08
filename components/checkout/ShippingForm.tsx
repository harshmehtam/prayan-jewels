'use client';

import React from 'react';
import { AddressForm } from './AddressForm';
import type { Address } from '@/types';

interface ShippingFormProps {
  onSubmit: (address: Partial<Address>) => void;
  sameAsShipping: boolean;
  onSameAsShippingChange: (same: boolean) => void;
  initialData?: Partial<Address> | null;
}

export function ShippingForm({ 
  onSubmit, 
  sameAsShipping, 
  onSameAsShippingChange, 
  initialData 
}: ShippingFormProps) {
  return (
    <AddressForm
      type="shipping"
      onSubmit={onSubmit}
      sameAsShipping={sameAsShipping}
      onSameAsShippingChange={onSameAsShippingChange}
      initialData={initialData}
    />
  );
}