// Hook for automatic admin audit logging
import { useCallback, useEffect } from 'react';
import { AdminAuditService, AdminContext } from '@/lib/services/admin-audit';
import { useRoleAccess } from './useRoleAccess';

export interface UseAdminAuditOptions {
  adminId?: string;
  adminEmail?: string;
  autoStartSession?: boolean;
}

export function useAdminAudit(options: UseAdminAuditOptions = {}) {
  const { userRole, userId } = useRoleAccess();
  
  // Create admin context
  const adminContext: AdminContext = AdminAuditService.getAdminContext(
    options.adminId || userId || 'unknown',
    options.adminEmail
  );

  // Start session on mount if enabled
  useEffect(() => {
    if (options.autoStartSession && adminContext.adminId !== 'unknown') {
      AdminAuditService.startSession(adminContext).catch(console.error);
    }

    // Update session activity periodically
    const interval = setInterval(() => {
      AdminAuditService.updateSessionActivity(adminContext).catch(console.error);
    }, 5 * 60 * 1000); // Every 5 minutes

    return () => {
      clearInterval(interval);
      if (options.autoStartSession) {
        AdminAuditService.endSession(adminContext).catch(console.error);
      }
    };
  }, [adminContext.adminId, options.autoStartSession]);

  // Audit logging functions
  const logUserAction = useCallback(
    async (
      action: 'user_created' | 'user_updated' | 'user_deleted' | 'role_changed' | 'password_reset',
      targetUserId: string,
      targetUserEmail?: string,
      description?: string,
      metadata?: Record<string, any>,
      success: boolean = true,
      errorMessage?: string
    ) => {
      await AdminAuditService.logUserAction(
        adminContext,
        action,
        targetUserId,
        targetUserEmail,
        description,
        metadata,
        success,
        errorMessage
      );
    },
    [adminContext]
  );

  const logProductAction = useCallback(
    async (
      action: 'product_created' | 'product_updated' | 'product_deleted',
      productId: string,
      productName?: string,
      description?: string,
      metadata?: Record<string, any>,
      success: boolean = true,
      errorMessage?: string
    ) => {
      await AdminAuditService.logProductAction(
        adminContext,
        action,
        productId,
        productName,
        description,
        metadata,
        success,
        errorMessage
      );
    },
    [adminContext]
  );

  const logOrderAction = useCallback(
    async (
      orderId: string,
      customerId?: string,
      description?: string,
      metadata?: Record<string, any>,
      success: boolean = true,
      errorMessage?: string
    ) => {
      await AdminAuditService.logOrderAction(
        adminContext,
        orderId,
        customerId,
        description,
        metadata,
        success,
        errorMessage
      );
    },
    [adminContext]
  );

  const logInventoryAction = useCallback(
    async (
      productId: string,
      productName?: string,
      description?: string,
      metadata?: Record<string, any>,
      success: boolean = true,
      errorMessage?: string
    ) => {
      await AdminAuditService.logInventoryAction(
        adminContext,
        productId,
        productName,
        description,
        metadata,
        success,
        errorMessage
      );
    },
    [adminContext]
  );

  const logPermissionDenied = useCallback(
    async (
      resource: 'user' | 'product' | 'order' | 'inventory' | 'system' | 'auth',
      resourceId?: string,
      description?: string,
      metadata?: Record<string, any>
    ) => {
      await AdminAuditService.logPermissionDenied(
        adminContext,
        resource,
        resourceId,
        description,
        metadata
      );
    },
    [adminContext]
  );

  const logBulkOperation = useCallback(
    async (
      resource: 'user' | 'product' | 'order' | 'inventory' | 'system' | 'auth',
      operation: string,
      itemCount: number,
      description?: string,
      metadata?: Record<string, any>,
      success: boolean = true,
      errorMessage?: string
    ) => {
      await AdminAuditService.logBulkOperation(
        adminContext,
        resource,
        operation,
        itemCount,
        description,
        metadata,
        success,
        errorMessage
      );
    },
    [adminContext]
  );

  const logDataExport = useCallback(
    async (
      exportType: string,
      recordCount?: number,
      description?: string,
      metadata?: Record<string, any>,
      success: boolean = true,
      errorMessage?: string
    ) => {
      await AdminAuditService.logDataExport(
        adminContext,
        exportType,
        recordCount,
        description,
        metadata,
        success,
        errorMessage
      );
    },
    [adminContext]
  );

  const logSystemConfigChange = useCallback(
    async (
      configType: string,
      description?: string,
      metadata?: Record<string, any>,
      success: boolean = true,
      errorMessage?: string
    ) => {
      await AdminAuditService.logSystemConfigChange(
        adminContext,
        configType,
        description,
        metadata,
        success,
        errorMessage
      );
    },
    [adminContext]
  );

  // Wrapper function for automatic error logging
  const withAuditLogging = useCallback(
    <T extends any[], R>(
      fn: (...args: T) => Promise<R>,
      logAction: () => Promise<void>
    ) => {
      return async (...args: T): Promise<R> => {
        try {
          const result = await fn(...args);
          await logAction();
          return result;
        } catch (error) {
          await logAction();
          throw error;
        }
      };
    },
    []
  );

  return {
    adminContext,
    logUserAction,
    logProductAction,
    logOrderAction,
    logInventoryAction,
    logPermissionDenied,
    logBulkOperation,
    logDataExport,
    logSystemConfigChange,
    withAuditLogging,
  };
}