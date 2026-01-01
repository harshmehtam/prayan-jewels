// High-level admin audit service that integrates with existing services
import { AuditLoggingService, AuditAction, AuditResource, AuditSeverity } from './audit-logging';
import { BrowserInfoService } from '@/lib/utils/browser-info';

export interface AdminContext {
  adminId: string;
  adminEmail?: string;
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
}

export class AdminAuditService {
  /**
   * Get admin context from current session
   */
  static getAdminContext(adminId: string, adminEmail?: string): AdminContext {
    const browserInfo = BrowserInfoService.getBrowserInfo();
    
    return {
      adminId,
      adminEmail,
      userAgent: browserInfo.userAgent,
      sessionId: browserInfo.sessionId,
      // IP address would be obtained from server-side context
    };
  }

  /**
   * Log user management actions
   */
  static async logUserAction(
    context: AdminContext,
    action: 'user_created' | 'user_updated' | 'user_deleted' | 'role_changed' | 'password_reset',
    targetUserId: string,
    targetUserEmail?: string,
    description?: string,
    metadata?: Record<string, any>,
    success: boolean = true,
    errorMessage?: string
  ): Promise<void> {
    const severity: AuditSeverity = action === 'user_deleted' || action === 'role_changed' ? 'high' : 'medium';
    
    await AuditLoggingService.logAdminAction({
      adminId: context.adminId,
      adminEmail: context.adminEmail,
      targetUserId,
      targetUserEmail,
      action,
      resource: 'user',
      resourceId: targetUserId,
      description: description || this.getDefaultDescription(action, targetUserId),
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      sessionId: context.sessionId,
      severity,
      metadata,
      success,
      errorMessage,
    });
  }

  /**
   * Log product management actions
   */
  static async logProductAction(
    context: AdminContext,
    action: 'product_created' | 'product_updated' | 'product_deleted',
    productId: string,
    productName?: string,
    description?: string,
    metadata?: Record<string, any>,
    success: boolean = true,
    errorMessage?: string
  ): Promise<void> {
    const severity: AuditSeverity = action === 'product_deleted' ? 'medium' : 'low';
    
    await AuditLoggingService.logAdminAction({
      adminId: context.adminId,
      adminEmail: context.adminEmail,
      action,
      resource: 'product',
      resourceId: productId,
      description: description || this.getDefaultDescription(action, productId, productName),
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      sessionId: context.sessionId,
      severity,
      metadata,
      success,
      errorMessage,
    });
  }

  /**
   * Log order management actions
   */
  static async logOrderAction(
    context: AdminContext,
    orderId: string,
    customerId?: string,
    description?: string,
    metadata?: Record<string, any>,
    success: boolean = true,
    errorMessage?: string
  ): Promise<void> {
    await AuditLoggingService.logAdminAction({
      adminId: context.adminId,
      adminEmail: context.adminEmail,
      targetUserId: customerId,
      action: 'order_updated',
      resource: 'order',
      resourceId: orderId,
      description: description || `Order ${orderId} updated`,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      sessionId: context.sessionId,
      severity: 'low',
      metadata,
      success,
      errorMessage,
    });
  }

  /**
   * Log inventory management actions
   */
  static async logInventoryAction(
    context: AdminContext,
    productId: string,
    productName?: string,
    description?: string,
    metadata?: Record<string, any>,
    success: boolean = true,
    errorMessage?: string
  ): Promise<void> {
    await AuditLoggingService.logAdminAction({
      adminId: context.adminId,
      adminEmail: context.adminEmail,
      action: 'inventory_updated',
      resource: 'inventory',
      resourceId: productId,
      description: description || `Inventory updated for product ${productName || productId}`,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      sessionId: context.sessionId,
      severity: 'low',
      metadata,
      success,
      errorMessage,
    });
  }

  /**
   * Log authentication events
   */
  static async logAuthEvent(
    context: AdminContext,
    action: 'login_attempt' | 'login_success' | 'login_failure',
    description?: string,
    metadata?: Record<string, any>,
    errorMessage?: string
  ): Promise<void> {
    const success = action === 'login_success';
    const severity: AuditSeverity = action === 'login_failure' ? 'medium' : 'low';
    
    await AuditLoggingService.logAdminAction({
      adminId: context.adminId,
      adminEmail: context.adminEmail,
      action,
      resource: 'auth',
      description: description || this.getDefaultDescription(action),
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      sessionId: context.sessionId,
      severity,
      metadata,
      success,
      errorMessage,
    });
  }

  /**
   * Log permission denied events
   */
  static async logPermissionDenied(
    context: AdminContext,
    resource: AuditResource,
    resourceId?: string,
    description?: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    await AuditLoggingService.logAdminAction({
      adminId: context.adminId,
      adminEmail: context.adminEmail,
      action: 'permission_denied',
      resource,
      resourceId,
      description: description || `Permission denied for ${resource} access`,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      sessionId: context.sessionId,
      severity: 'medium',
      metadata,
      success: false,
    });
  }

  /**
   * Log bulk operations
   */
  static async logBulkOperation(
    context: AdminContext,
    resource: AuditResource,
    operation: string,
    itemCount: number,
    description?: string,
    metadata?: Record<string, any>,
    success: boolean = true,
    errorMessage?: string
  ): Promise<void> {
    await AuditLoggingService.logAdminAction({
      adminId: context.adminId,
      adminEmail: context.adminEmail,
      action: 'bulk_operation',
      resource,
      description: description || `Bulk ${operation} on ${itemCount} ${resource}(s)`,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      sessionId: context.sessionId,
      severity: itemCount > 10 ? 'high' : 'medium',
      metadata: { ...metadata, operation, itemCount },
      success,
      errorMessage,
    });
  }

  /**
   * Log data export operations
   */
  static async logDataExport(
    context: AdminContext,
    exportType: string,
    recordCount?: number,
    description?: string,
    metadata?: Record<string, any>,
    success: boolean = true,
    errorMessage?: string
  ): Promise<void> {
    await AuditLoggingService.logAdminAction({
      adminId: context.adminId,
      adminEmail: context.adminEmail,
      action: 'data_export',
      resource: 'system',
      description: description || `Data export: ${exportType}`,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      sessionId: context.sessionId,
      severity: 'high', // Data exports are always high severity for compliance
      metadata: { ...metadata, exportType, recordCount },
      success,
      errorMessage,
    });
  }

  /**
   * Log system configuration changes
   */
  static async logSystemConfigChange(
    context: AdminContext,
    configType: string,
    description?: string,
    metadata?: Record<string, any>,
    success: boolean = true,
    errorMessage?: string
  ): Promise<void> {
    await AuditLoggingService.logAdminAction({
      adminId: context.adminId,
      adminEmail: context.adminEmail,
      action: 'system_config_changed',
      resource: 'system',
      description: description || `System configuration changed: ${configType}`,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      sessionId: context.sessionId,
      severity: 'critical', // System config changes are critical
      metadata: { ...metadata, configType },
      success,
      errorMessage,
    });
  }

  /**
   * Start admin session tracking
   */
  static async startSession(context: AdminContext): Promise<void> {
    await AuditLoggingService.startAdminSession({
      adminId: context.adminId,
      adminEmail: context.adminEmail,
      sessionId: context.sessionId!,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      loginTime: new Date().toISOString(),
    });

    // Log successful login
    await this.logAuthEvent(context, 'login_success', 'Admin session started');
  }

  /**
   * End admin session tracking
   */
  static async endSession(context: AdminContext): Promise<void> {
    await AuditLoggingService.endAdminSession(context.sessionId!);
    
    // Clear browser session info
    BrowserInfoService.clearSessionId();
  }

  /**
   * Update session activity
   */
  static async updateSessionActivity(context: AdminContext): Promise<void> {
    if (context.sessionId) {
      await AuditLoggingService.updateAdminSession(context.sessionId);
    }
  }

  /**
   * Check for suspicious activity and create security events
   */
  static async checkSuspiciousActivity(): Promise<void> {
    try {
      const { suspiciousPatterns } = await AuditLoggingService.detectSuspiciousActivity();
      
      // Create security events for detected patterns
      for (const pattern of suspiciousPatterns) {
        await AuditLoggingService.logSecurityEvent({
          eventType: 'suspicious_activity',
          adminId: pattern.adminId,
          severity: pattern.severity,
          description: `${pattern.type}: ${pattern.description}`,
          metadata: {
            patternType: pattern.type,
            evidence: pattern.evidence,
          },
        });
      }
    } catch (error) {
      console.error('Error checking suspicious activity:', error);
    }
  }

  /**
   * Get default description for actions
   */
  private static getDefaultDescription(
    action: AuditAction,
    resourceId?: string,
    resourceName?: string
  ): string {
    const resource = resourceName || resourceId || 'resource';
    
    switch (action) {
      case 'user_created':
        return `User ${resource} created`;
      case 'user_updated':
        return `User ${resource} updated`;
      case 'user_deleted':
        return `User ${resource} deleted`;
      case 'role_changed':
        return `Role changed for user ${resource}`;
      case 'password_reset':
        return `Password reset for user ${resource}`;
      case 'product_created':
        return `Product ${resource} created`;
      case 'product_updated':
        return `Product ${resource} updated`;
      case 'product_deleted':
        return `Product ${resource} deleted`;
      case 'order_updated':
        return `Order ${resource} updated`;
      case 'inventory_updated':
        return `Inventory updated for ${resource}`;
      case 'login_attempt':
        return 'Admin login attempted';
      case 'login_success':
        return 'Admin login successful';
      case 'login_failure':
        return 'Admin login failed';
      case 'permission_denied':
        return 'Permission denied';
      case 'data_export':
        return 'Data exported';
      case 'bulk_operation':
        return 'Bulk operation performed';
      case 'system_config_changed':
        return 'System configuration changed';
      case 'security_alert':
        return 'Security alert triggered';
      default:
        return `Action ${action} performed`;
    }
  }

  /**
   * Validate admin action before logging
   */
  static validateAction(
    action: AuditAction,
    resource: AuditResource,
    adminId: string
  ): { valid: boolean; error?: string } {
    if (!adminId) {
      return { valid: false, error: 'Admin ID is required' };
    }

    // Add validation rules as needed
    const validCombinations: Record<AuditAction, AuditResource[]> = {
      user_created: ['user'],
      user_updated: ['user'],
      user_deleted: ['user'],
      role_changed: ['user'],
      password_reset: ['user'],
      product_created: ['product'],
      product_updated: ['product'],
      product_deleted: ['product'],
      order_updated: ['order'],
      inventory_updated: ['inventory'],
      login_attempt: ['auth'],
      login_success: ['auth'],
      login_failure: ['auth'],
      permission_denied: ['user', 'product', 'order', 'inventory', 'system', 'auth'],
      data_export: ['system'],
      bulk_operation: ['user', 'product', 'order', 'inventory'],
      system_config_changed: ['system'],
      security_alert: ['system'],
    };

    const validResources = validCombinations[action];
    if (validResources && !validResources.includes(resource)) {
      return {
        valid: false,
        error: `Invalid resource '${resource}' for action '${action}'`
      };
    }

    return { valid: true };
  }
}