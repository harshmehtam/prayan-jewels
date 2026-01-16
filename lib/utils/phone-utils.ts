/**
 * Client-safe phone number utility functions
 * These can be safely imported in both client and server components
 */

export const formatPhoneForCognito = (phoneNumber: string): string => {
  const cleanPhone = phoneNumber.replace(/\D/g, '');
  
  if (cleanPhone.length === 10) {
    return `+91${cleanPhone}`;
  } else if (cleanPhone.length === 12 && cleanPhone.startsWith('91')) {
    return `+${cleanPhone}`;
  } else if (phoneNumber.startsWith('+91') && cleanPhone.length === 12) {
    return phoneNumber;
  }
  
  return `+91${cleanPhone}`;
};

export const formatPhoneForDisplay = (phoneNumber: string): string => {
  const cleanPhone = phoneNumber.replace(/\D/g, '');
  if (cleanPhone.length === 10) {
    return `+91 ${cleanPhone.slice(0, 5)} ${cleanPhone.slice(5)}`;
  } else if (cleanPhone.length === 12 && cleanPhone.startsWith('91')) {
    const number = cleanPhone.slice(2);
    return `+91 ${number.slice(0, 5)} ${number.slice(5)}`;
  }
  return phoneNumber;
};

export const validatePhoneNumber = (phoneNumber: string): boolean => {
  if (!phoneNumber || typeof phoneNumber !== 'string') {
    return false;
  }

  const cleanPhone = phoneNumber.replace(/\D/g, '');
  
  if (cleanPhone.length === 10) {
    return /^[6-9]\d{9}$/.test(cleanPhone);
  }
  
  if (cleanPhone.length === 12 && cleanPhone.startsWith('91')) {
    const number = cleanPhone.slice(2);
    return /^[6-9]\d{9}$/.test(number);
  }
  
  if (phoneNumber.startsWith('+91') && cleanPhone.length === 12) {
    const number = cleanPhone.slice(2);
    return /^[6-9]\d{9}$/.test(number);
  }
  
  return false;
};

export const formatPhoneInput = (value: string): string => {
  const cleaned = value.replace(/\D/g, '');
  if (cleaned.length <= 10) {
    return cleaned.replace(/(\d{5})(\d{0,5})/, '$1 $2').trim();
  }
  return cleaned.slice(0, 10).replace(/(\d{5})(\d{5})/, '$1 $2');
};
