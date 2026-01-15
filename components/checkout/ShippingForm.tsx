import { AddressForm } from './AddressForm';
import type { Address } from '@/types';
import type { SavedAddress } from '@/lib/services/address-service';

interface ShippingFormProps {
  onSubmit: (address: Partial<Address>) => void;
  sameAsShipping: boolean;
  onSameAsShippingChange: (same: boolean) => void;
  initialData?: Partial<Address> | null;
  editingAddress?: SavedAddress | null;
}

export function ShippingForm({ 
  onSubmit, 
  sameAsShipping, 
  onSameAsShippingChange, 
  initialData,
  editingAddress
}: ShippingFormProps) {
  return (
    <AddressForm
      type="shipping"
      onSubmit={onSubmit}
      sameAsShipping={sameAsShipping}
      onSameAsShippingChange={onSameAsShippingChange}
      initialData={initialData}
      editingAddress={editingAddress}
    />
  );
}