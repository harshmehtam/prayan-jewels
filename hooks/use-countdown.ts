import { useState, useEffect } from 'react';

interface UseCountdownReturn {
  countdown: number;
  startCountdown: (seconds: number) => void;
  resetCountdown: () => void;
}

export const useCountdown = (initialSeconds: number = 0): UseCountdownReturn => {
  const [countdown, setCountdown] = useState(initialSeconds);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const startCountdown = (seconds: number) => {
    setCountdown(seconds);
  };

  const resetCountdown = () => {
    setCountdown(0);
  };

  return { countdown, startCountdown, resetCountdown };
};
