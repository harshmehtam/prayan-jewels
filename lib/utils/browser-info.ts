// Browser information and session utilities for audit logging
export interface BrowserInfo {
  userAgent: string;
  ipAddress?: string;
  sessionId: string;
  location?: string;
}

export class BrowserInfoService {
  /**
   * Get browser information for audit logging
   */
  static getBrowserInfo(): BrowserInfo {
    const userAgent = typeof window !== 'undefined' ? window.navigator.userAgent : 'Server';
    const sessionId = this.getOrCreateSessionId();
    
    return {
      userAgent,
      sessionId,
      // IP address would be obtained from server-side or API
      // Location would be obtained from geolocation API if permitted
    };
  }

  /**
   * Get or create a session ID for tracking
   */
  private static getOrCreateSessionId(): string {
    if (typeof window === 'undefined') {
      return 'server-session';
    }

    const storageKey = 'admin-session-id';
    let sessionId = sessionStorage.getItem(storageKey);
    
    if (!sessionId) {
      sessionId = this.generateSessionId();
      sessionStorage.setItem(storageKey, sessionId);
    }
    
    return sessionId;
  }

  /**
   * Generate a unique session ID
   */
  private static generateSessionId(): string {
    const timestamp = Date.now().toString(36);
    const randomPart = Math.random().toString(36).substring(2);
    return `session_${timestamp}_${randomPart}`;
  }

  /**
   * Clear session ID (on logout)
   */
  static clearSessionId(): void {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('admin-session-id');
    }
  }

  /**
   * Get simplified browser name from user agent
   */
  static getBrowserName(userAgent: string): string {
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    if (userAgent.includes('Opera')) return 'Opera';
    return 'Unknown';
  }

  /**
   * Get operating system from user agent
   */
  static getOperatingSystem(userAgent: string): string {
    if (userAgent.includes('Windows')) return 'Windows';
    if (userAgent.includes('Mac OS')) return 'macOS';
    if (userAgent.includes('Linux')) return 'Linux';
    if (userAgent.includes('Android')) return 'Android';
    if (userAgent.includes('iOS')) return 'iOS';
    return 'Unknown';
  }

  /**
   * Check if the browser/session appears suspicious
   */
  static isSuspiciousBrowser(userAgent: string): boolean {
    const suspiciousPatterns = [
      /bot/i,
      /crawler/i,
      /spider/i,
      /scraper/i,
      /automated/i,
      /headless/i,
    ];

    return suspiciousPatterns.some(pattern => pattern.test(userAgent));
  }

  /**
   * Get device type from user agent
   */
  static getDeviceType(userAgent: string): 'desktop' | 'mobile' | 'tablet' | 'unknown' {
    if (/Mobile|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent)) {
      if (/iPad|Tablet/i.test(userAgent)) {
        return 'tablet';
      }
      return 'mobile';
    }
    if (/Windows|Mac|Linux/i.test(userAgent)) {
      return 'desktop';
    }
    return 'unknown';
  }

  /**
   * Format browser info for display
   */
  static formatBrowserInfo(userAgent: string): string {
    const browser = this.getBrowserName(userAgent);
    const os = this.getOperatingSystem(userAgent);
    const device = this.getDeviceType(userAgent);
    
    return `${browser} on ${os} (${device})`;
  }

  /**
   * Detect if user is using a VPN or proxy (basic check)
   */
  static async detectVPN(ipAddress: string): Promise<boolean> {
    // This would require integration with a VPN detection service
    // For now, return false as a placeholder
    return false;
  }

  /**
   * Get approximate location from IP (would require geolocation service)
   */
  static async getLocationFromIP(ipAddress: string): Promise<string | null> {
    // This would require integration with a geolocation service like MaxMind
    // For now, return null as a placeholder
    return null;
  }
}