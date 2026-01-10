'use client';

import { usePromotionalCoupons } from './use-promotional-coupons';

export function useHeaderSpacing() {
  const { hasPromotions, loading } = usePromotionalCoupons();
  
  // When there are promotions, header is positioned at top-8 (32px)
  // When there are no promotions, header is positioned at top-0
  // We need to account for the header height plus the promotional banner height
  
  const getHeaderPaddingClasses = () => {
    if (loading) {
      // Default to with promotions while loading to prevent layout shift
      return 'pt-28 sm:pt-32 lg:pt-36';
    }
    
    if (hasPromotions) {
      // Header at top-8 + promotional banner height (32px) + header height
      return 'pt-28 sm:pt-32 lg:pt-36';
    } else {
      // Header at top-0 + header height only
      return 'pt-20 sm:pt-24 lg:pt-28';
    }
  };
  
  const getHeaderTopPosition = () => {
    if (loading) {
      return 'top-8';
    }
    return hasPromotions ? 'top-8' : 'top-0';
  };
  
  return {
    headerPaddingClasses: getHeaderPaddingClasses(),
    headerTopPosition: getHeaderTopPosition(),
    hasPromotions: !loading && hasPromotions,
    loading
  };
}