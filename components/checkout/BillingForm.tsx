'use client';

import { AddressForm } from './AddressForm';
import type { Address } from '@/types';
import type { SavedAddress } from '@/lib/services/address-service';

interface BillingFormProps {
  onSubmit: (address: Partial<Address>) => void;
  onBack: () => void;
  initialData?: Partial<Address> | null;
  editingAddress?: SavedAddress | null;
}

export function BillingForm({ onSubmit, onBack, initialData, editingAddress }: BillingFormProps) {
  return (
    <AddressForm
      type="billing"
      onSubmit={onSubmit}
      onBack={onBack}
      initialData={initialData}
      editingAddress={editingAddress}
    />
  );
}