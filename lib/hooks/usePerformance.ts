'use client';

import { useEffect, useState, useCallback } from 'react';
import { 
  WebVitalsMonitor, 
  measurePagePerformance, 
  getConnectionInfo,
  shouldLoadHighQuality,
  type PerformanceMetrics 
} from '@/lib/utils/performance';

export interface UsePerformanceOptions {
  trackWebVitals?: boolean;
  onMetric?: (name: string, value: number) => void;
}

export function usePerformance(options: UsePerformanceOptions = {}) {
  const { trackWebVitals = true, onMetric } = options;
  const [metrics, setMetrics] = useState<Partial<PerformanceMetrics>>({});
  const [connectionInfo, setConnectionInfo] = useState<ReturnType<typeof getConnectionInfo>>(null);
  const [isSlowConnection, setIsSlowConnection] = useState(false);
  const [shouldUseHighQuality, setShouldUseHighQuality] = useState(true);

  // Initialize performance monitoring
  useEffect(() => {
    if (!trackWebVitals) return;

    const monitor = new WebVitalsMonitor((name, value) => {
      setMetrics(prev => ({
        ...prev,
        [name.toLowerCase()]: value,
      }));
      onMetric?.(name, value);
    });

    // Measure initial page performance
    const pageMetrics = measurePagePerformance();
    if (pageMetrics) {
      setMetrics(prev => ({ ...prev, ...pageMetrics }));
    }

    return () => {
      monitor.disconnect();
    };
  }, [trackWebVitals, onMetric]);

  // Monitor connection information
  useEffect(() => {
    const connection = getConnectionInfo();
    setConnectionInfo(connection);
    
    if (connection) {
      const isSlow = connection.saveData || 
                    connection.effectiveType === 'slow-2g' || 
                    connection.effectiveType === '2g';
      setIsSlowConnection(isSlow);
    }

    setShouldUseHighQuality(shouldLoadHighQuality());

    // Listen for connection changes
    if (typeof window !== 'undefined' && 'navigator' in window) {
      const connection = (navigator as any).connection;
      if (connection && connection.addEventListener) {
        const handleConnectionChange = () => {
          const newConnection = getConnectionInfo();
          setConnectionInfo(newConnection);
          
          if (newConnection) {
            const isSlow = newConnection.saveData || 
                          newConnection.effectiveType === 'slow-2g' || 
                          newConnection.effectiveType === '2g';
            setIsSlowConnection(isSlow);
          }
          
          setShouldUseHighQuality(shouldLoadHighQuality());
        };

        connection.addEventListener('change', handleConnectionChange);
        
        return () => {
          connection.removeEventListener('change', handleConnectionChange);
        };
      }
    }
  }, []);

  const reportMetric = useCallback((name: string, value: number) => {
    setMetrics(prev => ({
      ...prev,
      [name.toLowerCase()]: value,
    }));
    onMetric?.(name, value);
  }, [onMetric]);

  return {
    metrics,
    connectionInfo,
    isSlowConnection,
    shouldUseHighQuality,
    reportMetric,
  };
}

export function useImageOptimization() {
  const { isSlowConnection, shouldUseHighQuality, connectionInfo } = usePerformance({
    trackWebVitals: false,
  });

  const getOptimalImageQuality = useCallback(() => {
    if (isSlowConnection) return 60;
    if (connectionInfo?.effectiveType === '3g') return 75;
    return 85;
  }, [isSlowConnection, connectionInfo]);

  const getOptimalImageFormat = useCallback(() => {
    if (isSlowConnection) return 'webp';
    return 'avif';
  }, [isSlowConnection]);

  const shouldLazyLoad = useCallback((priority: boolean = false) => {
    if (priority) return false;
    return !isSlowConnection; // On slow connections, load images immediately to avoid layout shifts
  }, [isSlowConnection]);

  return {
    isSlowConnection,
    shouldUseHighQuality,
    getOptimalImageQuality,
    getOptimalImageFormat,
    shouldLazyLoad,
  };
}