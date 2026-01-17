import { useEffect } from 'react';

interface UseBodyScrollLockProps {
  isLocked: boolean;
}

export const useBodyScrollLock = ({ isLocked }: UseBodyScrollLockProps) => {
  useEffect(() => {
    if (isLocked) {
      const scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';

      return () => {
        const scrollY = document.body.style.top;
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        document.body.style.overflow = '';
        
        if (scrollY) {
          window.scrollTo(0, parseInt(scrollY || '0') * -1);
        }
      };
    }
    
    // Cleanup function to ensure scroll is always restored when component unmounts
    return () => {
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      document.body.style.overflow = '';
    };
  }, [isLocked]);
};
