'use client';

import React from 'react';
import { AddressForm } from './AddressForm';
import type { Address } from '@/types';

interface BillingFormProps {
  onSubmit: (address: Partial<Address>) => void;
  onBack: () => void;
  initialData?: Partial<Address> | null;
}

export function BillingForm({ onSubmit, onBack, initialData }: BillingFormProps) {
  return (
    <AddressForm
      type="billing"
      onSubmit={onSubmit}
      onBack={onBack}
      initialData={initialData}
    />
  );
}