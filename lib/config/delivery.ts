// Delivery configuration - centralized place to manage delivery settings
const ESTIMATED_DELIVERY_DAYS = 7;

interface DeliveryConfig {
  estimatedDeliveryDays: number;
  getDeliveryMessage: (days?: number) => string;
  expressDeliveryDays: number;
  freeShippingThreshold: number;
  standardShippingCost: number;
}

export const DELIVERY_CONFIG: DeliveryConfig = {
  // Estimated delivery days from order date
  estimatedDeliveryDays: ESTIMATED_DELIVERY_DAYS,
  
  // Delivery message template
  getDeliveryMessage: (days?: number) => {
    const deliveryDays = days || ESTIMATED_DELIVERY_DAYS;
    const deliveryDate = new Date();
    deliveryDate.setDate(deliveryDate.getDate() + deliveryDays);
    
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    };
    
    return `Estimated delivery by ${deliveryDate.toLocaleDateString('en-US', options)}`;
  },
  
  // Express delivery options (if needed in future)
  expressDeliveryDays: 3,
  
  // Free shipping threshold
  freeShippingThreshold: 999,
  
  // Shipping cost for orders below threshold
  standardShippingCost: 99
};