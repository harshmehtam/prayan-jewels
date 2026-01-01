// Comprehensive audit logging and security tracking service
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '@/amplify/data/resource';

const client = generateClient<Schema>();

export type AuditAction = 
  | 'user_created' | 'user_updated' | 'user_deleted' | 'role_changed' | 'password_reset'
  | 'product_created' | 'product_updated' | 'product_deleted'
  | 'order_updated' | 'inventory_updated'
  | 'login_attempt' | 'login_success' | 'login_failure'
  | 'permission_denied' | 'data_export' | 'bulk_operation'
  | 'system_config_changed' | 'security_alert';

export type AuditResource = 'user' | 'product' | 'order' | 'inventory' | 'system' | 'auth';

export type AuditSeverity = 'low' | 'medium' | 'high' | 'critical';

export type SecurityEventType = 
  | 'failed_login_attempts' | 'suspicious_activity' | 'privilege_escalation'
  | 'data_breach_attempt' | 'unauthorized_access' | 'account_lockout'
  | 'password_policy_violation' | 'session_hijacking' | 'brute_force_attack';

export interface AuditLogEntry {
  id?: string;
  adminId: string;
  adminEmail?: string;
  targetUserId?: string;
  targetUserEmail?: string;
  action: AuditAction;
  resource: AuditResource;
  resourceId?: string;
  description: string;
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
  severity?: AuditSeverity;
  metadata?: Record<string, any>;
  success?: boolean;
  errorMessage?: string;
  createdAt?: string;
}

export interface SecurityEventEntry {
  id?: string;
  eventType: SecurityEventType;
  userId?: string;
  adminId?: string;
  severity: AuditSeverity;
  description: string;
  ipAddress?: string;
  userAgent?: string;
  location?: string;
  resolved?: boolean;
  resolvedBy?: string;
  resolvedAt?: string;
  resolutionNotes?: string;
  metadata?: Record<string, any>;
  createdAt?: string;
}

export interface AdminSessionEntry {
  id?: string;
  adminId: string;
  adminEmail?: string;
  sessionId: string;
  ipAddress?: string;
  userAgent?: string;
  location?: string;
  loginTime: string;
  logoutTime?: string;
  lastActivity?: string;
  isActive?: boolean;
  actionsPerformed?: number;
  metadata?: Record<string, any>;
}

export interface AuditLogFilters {
  adminId?: string;
  targetUserId?: string;
  action?: AuditAction;
  resource?: AuditResource;
  severity?: AuditSeverity;
  dateFrom?: string;
  dateTo?: string;
  success?: boolean;
  searchQuery?: string;
}

export interface SecurityEventFilters {
  eventType?: SecurityEventType;
  severity?: AuditSeverity;
  resolved?: boolean;
  dateFrom?: string;
  dateTo?: string;
  userId?: string;
  adminId?: string;
}

export class AuditLoggingService {
  /**
   * Log an admin action for audit trail
   */
  static async logAdminAction(entry: Omit<AuditLogEntry, 'id' | 'createdAt'>): Promise<void> {
    try {
      await client.models.AuditLog.create({
        adminId: entry.adminId,
        adminEmail: entry.adminEmail,
        targetUserId: entry.targetUserId,
        targetUserEmail: entry.targetUserEmail,
        action: entry.action,
        resource: entry.resource,
        resourceId: entry.resourceId,
        description: entry.description,
        ipAddress: entry.ipAddress,
        userAgent: entry.userAgent,
        sessionId: entry.sessionId,
        severity: entry.severity || 'low',
        metadata: entry.metadata ? JSON.stringify(entry.metadata) : undefined,
        success: entry.success ?? true,
        errorMessage: entry.errorMessage,
      });
    } catch (error) {
      console.error('Failed to log audit entry:', error);
      // Don't throw error as audit logging shouldn't break main functionality
      // But we should have a fallback logging mechanism in production
    }
  }

  /**
   * Log a security event
   */
  static async logSecurityEvent(event: Omit<SecurityEventEntry, 'id' | 'createdAt'>): Promise<void> {
    try {
      await client.models.SecurityEvent.create({
        eventType: event.eventType,
        userId: event.userId,
        adminId: event.adminId,
        severity: event.severity,
        description: event.description,
        ipAddress: event.ipAddress,
        userAgent: event.userAgent,
        location: event.location,
        resolved: event.resolved ?? false,
        resolvedBy: event.resolvedBy,
        resolvedAt: event.resolvedAt,
        resolutionNotes: event.resolutionNotes,
        metadata: event.metadata ? JSON.stringify(event.metadata) : undefined,
      });
    } catch (error) {
      console.error('Failed to log security event:', error);
    }
  }

  /**
   * Start an admin session
   */
  static async startAdminSession(session: Omit<AdminSessionEntry, 'id'>): Promise<string | null> {
    try {
      const result = await client.models.AdminSession.create({
        adminId: session.adminId,
        adminEmail: session.adminEmail,
        sessionId: session.sessionId,
        ipAddress: session.ipAddress,
        userAgent: session.userAgent,
        location: session.location,
        loginTime: session.loginTime,
        lastActivity: session.loginTime,
        isActive: true,
        actionsPerformed: 0,
        metadata: session.metadata ? JSON.stringify(session.metadata) : undefined,
      });

      return result.data?.id || null;
    } catch (error) {
      console.error('Failed to start admin session:', error);
      return null;
    }
  }

  /**
   * Update admin session activity
   */
  static async updateAdminSession(sessionId: string, actionsPerformed?: number): Promise<void> {
    try {
      // Find the session by sessionId
      const sessions = await client.models.AdminSession.list({
        filter: { sessionId: { eq: sessionId } }
      });

      const session = sessions.data?.[0];
      if (!session) return;

      await client.models.AdminSession.update({
        id: session.id,
        lastActivity: new Date().toISOString(),
        actionsPerformed: actionsPerformed ?? (session.actionsPerformed || 0) + 1,
      });
    } catch (error) {
      console.error('Failed to update admin session:', error);
    }
  }

  /**
   * End an admin session
   */
  static async endAdminSession(sessionId: string): Promise<void> {
    try {
      const sessions = await client.models.AdminSession.list({
        filter: { sessionId: { eq: sessionId } }
      });

      const session = sessions.data?.[0];
      if (!session) return;

      await client.models.AdminSession.update({
        id: session.id,
        logoutTime: new Date().toISOString(),
        isActive: false,
      });
    } catch (error) {
      console.error('Failed to end admin session:', error);
    }
  }

  /**
   * Get audit logs with filtering and pagination
   */
  static async getAuditLogs(
    filters?: AuditLogFilters,
    limit: number = 50,
    nextToken?: string
  ): Promise<{
    logs: AuditLogEntry[];
    nextToken?: string;
    totalCount: number;
  }> {
    try {
      // Build filter conditions
      const filterConditions: any = {};

      if (filters?.adminId) {
        filterConditions.adminId = { eq: filters.adminId };
      }

      if (filters?.targetUserId) {
        filterConditions.targetUserId = { eq: filters.targetUserId };
      }

      if (filters?.action) {
        filterConditions.action = { eq: filters.action };
      }

      if (filters?.resource) {
        filterConditions.resource = { eq: filters.resource };
      }

      if (filters?.severity) {
        filterConditions.severity = { eq: filters.severity };
      }

      if (filters?.success !== undefined) {
        filterConditions.success = { eq: filters.success };
      }

      const response = await client.models.AuditLog.list({
        filter: Object.keys(filterConditions).length > 0 ? filterConditions : undefined,
        limit,
        nextToken,
      });

      let logs = response.data || [];

      // Apply client-side filters for complex queries
      if (filters?.dateFrom) {
        const fromDate = new Date(filters.dateFrom);
        logs = logs.filter(log => new Date(log.createdAt) >= fromDate);
      }

      if (filters?.dateTo) {
        const toDate = new Date(filters.dateTo);
        toDate.setHours(23, 59, 59, 999);
        logs = logs.filter(log => new Date(log.createdAt) <= toDate);
      }

      if (filters?.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        logs = logs.filter(log =>
          log.description.toLowerCase().includes(query) ||
          log.adminEmail?.toLowerCase().includes(query) ||
          log.targetUserEmail?.toLowerCase().includes(query) ||
          log.resourceId?.toLowerCase().includes(query)
        );
      }

      // Sort by creation date (newest first)
      logs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      // Parse metadata for each log
      const parsedLogs: AuditLogEntry[] = logs.map(log => ({
        id: log.id,
        adminId: log.adminId,
        adminEmail: log.adminEmail || undefined,
        targetUserId: log.targetUserId || undefined,
        targetUserEmail: log.targetUserEmail || undefined,
        action: log.action as AuditAction,
        resource: log.resource as any,
        resourceId: log.resourceId || undefined,
        description: log.description,
        ipAddress: log.ipAddress || undefined,
        userAgent: log.userAgent || undefined,
        sessionId: log.sessionId || undefined,
        severity: log.severity as AuditSeverity || 'low',
        success: log.success ?? true,
        errorMessage: log.errorMessage || undefined,
        createdAt: log.createdAt,
        metadata: log.metadata ? JSON.parse(log.metadata as string) : undefined,
      }));

      return {
        logs: parsedLogs,
        nextToken: response.nextToken || undefined,
        totalCount: parsedLogs.length,
      };
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      return {
        logs: [],
        totalCount: 0,
      };
    }
  }

  /**
   * Get security events with filtering
   */
  static async getSecurityEvents(
    filters?: SecurityEventFilters,
    limit: number = 50
  ): Promise<{
    events: SecurityEventEntry[];
    totalCount: number;
  }> {
    try {
      const filterConditions: any = {};

      if (filters?.eventType) {
        filterConditions.eventType = { eq: filters.eventType };
      }

      if (filters?.severity) {
        filterConditions.severity = { eq: filters.severity };
      }

      if (filters?.resolved !== undefined) {
        filterConditions.resolved = { eq: filters.resolved };
      }

      if (filters?.userId) {
        filterConditions.userId = { eq: filters.userId };
      }

      if (filters?.adminId) {
        filterConditions.adminId = { eq: filters.adminId };
      }

      const response = await client.models.SecurityEvent.list({
        filter: Object.keys(filterConditions).length > 0 ? filterConditions : undefined,
        limit,
      });

      let events = response.data || [];

      // Apply date filters
      if (filters?.dateFrom) {
        const fromDate = new Date(filters.dateFrom);
        events = events.filter(event => new Date(event.createdAt) >= fromDate);
      }

      if (filters?.dateTo) {
        const toDate = new Date(filters.dateTo);
        toDate.setHours(23, 59, 59, 999);
        events = events.filter(event => new Date(event.createdAt) <= toDate);
      }

      // Sort by creation date (newest first)
      events.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      // Parse metadata
      const parsedEvents: SecurityEventEntry[] = events.map(event => ({
        id: event.id,
        eventType: event.eventType as SecurityEventType,
        userId: event.userId || undefined,
        adminId: event.adminId || undefined,
        severity: event.severity as AuditSeverity,
        description: event.description,
        ipAddress: event.ipAddress || undefined,
        userAgent: event.userAgent || undefined,
        location: event.location || undefined,
        resolved: event.resolved ?? false,
        resolvedBy: event.resolvedBy || undefined,
        resolvedAt: event.resolvedAt || undefined,
        resolutionNotes: event.resolutionNotes || undefined,
        createdAt: event.createdAt,
        metadata: event.metadata ? JSON.parse(event.metadata as string) : undefined,
      }));

      return {
        events: parsedEvents,
        totalCount: parsedEvents.length,
      };
    } catch (error) {
      console.error('Error fetching security events:', error);
      return {
        events: [],
        totalCount: 0,
      };
    }
  }

  /**
   * Get admin sessions with filtering
   */
  static async getAdminSessions(
    adminId?: string,
    isActive?: boolean,
    limit: number = 50
  ): Promise<{
    sessions: AdminSessionEntry[];
    totalCount: number;
  }> {
    try {
      const filterConditions: any = {};

      if (adminId) {
        filterConditions.adminId = { eq: adminId };
      }

      if (isActive !== undefined) {
        filterConditions.isActive = { eq: isActive };
      }

      const response = await client.models.AdminSession.list({
        filter: Object.keys(filterConditions).length > 0 ? filterConditions : undefined,
        limit,
      });

      const sessions = response.data || [];

      // Sort by login time (newest first)
      sessions.sort((a, b) => new Date(b.loginTime).getTime() - new Date(a.loginTime).getTime());

      // Parse metadata
      const parsedSessions: AdminSessionEntry[] = sessions.map(session => ({
        id: session.id,
        adminId: session.adminId,
        adminEmail: session.adminEmail || undefined,
        sessionId: session.sessionId,
        ipAddress: session.ipAddress || undefined,
        userAgent: session.userAgent || undefined,
        location: session.location || undefined,
        loginTime: session.loginTime,
        logoutTime: session.logoutTime || undefined,
        lastActivity: session.lastActivity || undefined,
        isActive: session.isActive ?? true,
        actionsPerformed: session.actionsPerformed ?? 0,
        metadata: session.metadata ? JSON.parse(session.metadata as string) : undefined,
      }));

      return {
        sessions: parsedSessions,
        totalCount: parsedSessions.length,
      };
    } catch (error) {
      console.error('Error fetching admin sessions:', error);
      return {
        sessions: [],
        totalCount: 0,
      };
    }
  }

  /**
   * Resolve a security event
   */
  static async resolveSecurityEvent(
    eventId: string,
    resolvedBy: string,
    resolutionNotes: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const result = await client.models.SecurityEvent.update({
        id: eventId,
        resolved: true,
        resolvedBy,
        resolvedAt: new Date().toISOString(),
        resolutionNotes,
      });

      if (!result.data) {
        return { success: false, error: 'Failed to resolve security event' };
      }

      // Log the resolution action
      await this.logAdminAction({
        adminId: resolvedBy,
        action: 'security_alert',
        resource: 'system',
        resourceId: eventId,
        description: `Security event resolved: ${resolutionNotes}`,
        severity: 'medium',
      });

      return { success: true };
    } catch (error) {
      console.error('Error resolving security event:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to resolve security event'
      };
    }
  }

  /**
   * Get audit statistics for dashboard
   */
  static async getAuditStatistics(dateFrom?: string, dateTo?: string): Promise<{
    totalActions: number;
    failedActions: number;
    securityEvents: number;
    unresolvedSecurityEvents: number;
    activeAdminSessions: number;
    actionsByType: Record<AuditAction, number>;
    actionsByResource: Record<AuditResource, number>;
    actionsBySeverity: Record<AuditSeverity, number>;
    topAdmins: Array<{ adminId: string; adminEmail?: string; actionCount: number }>;
  }> {
    try {
      const [auditLogs, securityEvents, adminSessions] = await Promise.all([
        this.getAuditLogs({ dateFrom, dateTo }, 1000),
        this.getSecurityEvents({ dateFrom, dateTo }, 1000),
        this.getAdminSessions(undefined, true, 100),
      ]);

      const logs = auditLogs.logs;
      const events = securityEvents.events;
      const sessions = adminSessions.sessions;

      // Calculate statistics
      const totalActions = logs.length;
      const failedActions = logs.filter(log => !log.success).length;
      const securityEventsCount = events.length;
      const unresolvedSecurityEvents = events.filter(event => !event.resolved).length;
      const activeAdminSessions = sessions.length;

      // Actions by type
      const actionsByType: Record<AuditAction, number> = {} as Record<AuditAction, number>;
      logs.forEach(log => {
        actionsByType[log.action] = (actionsByType[log.action] || 0) + 1;
      });

      // Actions by resource
      const actionsByResource: Record<AuditResource, number> = {} as Record<AuditResource, number>;
      logs.forEach(log => {
        actionsByResource[log.resource] = (actionsByResource[log.resource] || 0) + 1;
      });

      // Actions by severity
      const actionsBySeverity: Record<AuditSeverity, number> = {} as Record<AuditSeverity, number>;
      logs.forEach(log => {
        const severity = log.severity || 'low';
        actionsBySeverity[severity] = (actionsBySeverity[severity] || 0) + 1;
      });

      // Top admins by action count
      const adminActionCounts = new Map<string, { adminEmail?: string; count: number }>();
      logs.forEach(log => {
        const existing = adminActionCounts.get(log.adminId) || { count: 0 };
        existing.count += 1;
        if (log.adminEmail) existing.adminEmail = log.adminEmail;
        adminActionCounts.set(log.adminId, existing);
      });

      const topAdmins = Array.from(adminActionCounts.entries())
        .map(([adminId, data]) => ({
          adminId,
          adminEmail: data.adminEmail,
          actionCount: data.count,
        }))
        .sort((a, b) => b.actionCount - a.actionCount)
        .slice(0, 10);

      return {
        totalActions,
        failedActions,
        securityEvents: securityEventsCount,
        unresolvedSecurityEvents,
        activeAdminSessions,
        actionsByType,
        actionsByResource,
        actionsBySeverity,
        topAdmins,
      };
    } catch (error) {
      console.error('Error fetching audit statistics:', error);
      return {
        totalActions: 0,
        failedActions: 0,
        securityEvents: 0,
        unresolvedSecurityEvents: 0,
        activeAdminSessions: 0,
        actionsByType: {} as Record<AuditAction, number>,
        actionsByResource: {} as Record<AuditResource, number>,
        actionsBySeverity: {} as Record<AuditSeverity, number>,
        topAdmins: [],
      };
    }
  }

  /**
   * Export audit logs for compliance (returns CSV format)
   */
  static async exportAuditLogs(
    filters?: AuditLogFilters,
    adminId?: string
  ): Promise<{ success: boolean; csvData?: string; error?: string }> {
    try {
      // Log the export action
      if (adminId) {
        await this.logAdminAction({
          adminId,
          action: 'data_export',
          resource: 'system',
          description: 'Audit logs exported for compliance',
          severity: 'medium',
          metadata: { filters },
        });
      }

      const { logs } = await this.getAuditLogs(filters, 10000); // Large limit for export

      // Convert to CSV
      const headers = [
        'Timestamp',
        'Admin ID',
        'Admin Email',
        'Action',
        'Resource',
        'Resource ID',
        'Target User ID',
        'Target User Email',
        'Description',
        'Success',
        'Severity',
        'IP Address',
        'User Agent',
        'Session ID',
        'Error Message',
      ];

      const csvRows = [
        headers.join(','),
        ...logs.map(log => [
          log.createdAt,
          log.adminId,
          log.adminEmail || '',
          log.action,
          log.resource,
          log.resourceId || '',
          log.targetUserId || '',
          log.targetUserEmail || '',
          `"${log.description.replace(/"/g, '""')}"`, // Escape quotes in description
          log.success ? 'true' : 'false',
          log.severity || 'low',
          log.ipAddress || '',
          log.userAgent || '',
          log.sessionId || '',
          log.errorMessage || '',
        ].join(','))
      ];

      const csvData = csvRows.join('\n');

      return { success: true, csvData };
    } catch (error) {
      console.error('Error exporting audit logs:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to export audit logs'
      };
    }
  }

  /**
   * Get user activity timeline (for customer support)
   */
  static async getUserActivityTimeline(
    userId: string,
    limit: number = 100
  ): Promise<AuditLogEntry[]> {
    try {
      const { logs } = await this.getAuditLogs(
        { targetUserId: userId },
        limit
      );

      return logs;
    } catch (error) {
      console.error('Error fetching user activity timeline:', error);
      return [];
    }
  }

  /**
   * Detect suspicious admin activity patterns
   */
  static async detectSuspiciousActivity(): Promise<{
    suspiciousPatterns: Array<{
      type: string;
      description: string;
      severity: AuditSeverity;
      adminId: string;
      adminEmail?: string;
      evidence: any[];
    }>;
  }> {
    try {
      const { logs } = await this.getAuditLogs(
        { dateFrom: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() }, // Last 24 hours
        1000
      );

      const suspiciousPatterns: Array<{
        type: string;
        description: string;
        severity: AuditSeverity;
        adminId: string;
        adminEmail?: string;
        evidence: any[];
      }> = [];

      // Group logs by admin
      const adminLogs = new Map<string, AuditLogEntry[]>();
      logs.forEach(log => {
        const existing = adminLogs.get(log.adminId) || [];
        existing.push(log);
        adminLogs.set(log.adminId, existing);
      });

      // Analyze patterns for each admin
      adminLogs.forEach((adminLogEntries, adminId) => {
        const adminEmail = adminLogEntries[0]?.adminEmail;

        // Pattern 1: High volume of failed actions
        const failedActions = adminLogEntries.filter(log => !log.success);
        if (failedActions.length > 10) {
          suspiciousPatterns.push({
            type: 'high_failure_rate',
            description: `Admin has ${failedActions.length} failed actions in the last 24 hours`,
            severity: 'high',
            adminId,
            adminEmail,
            evidence: failedActions.slice(0, 5), // First 5 as evidence
          });
        }

        // Pattern 2: Unusual activity hours (outside 9 AM - 6 PM)
        const offHoursActions = adminLogEntries.filter(log => {
          const hour = new Date(log.createdAt!).getHours();
          return hour < 9 || hour > 18;
        });
        if (offHoursActions.length > 5) {
          suspiciousPatterns.push({
            type: 'off_hours_activity',
            description: `Admin has ${offHoursActions.length} actions outside normal business hours`,
            severity: 'medium',
            adminId,
            adminEmail,
            evidence: offHoursActions.slice(0, 3),
          });
        }

        // Pattern 3: Rapid succession of high-privilege actions
        const highPrivilegeActions = adminLogEntries.filter(log =>
          ['user_deleted', 'role_changed', 'system_config_changed'].includes(log.action)
        );
        if (highPrivilegeActions.length > 3) {
          // Check if they happened within a short time window
          const timeWindow = 10 * 60 * 1000; // 10 minutes
          let rapidActions = 0;
          for (let i = 1; i < highPrivilegeActions.length; i++) {
            const timeDiff = new Date(highPrivilegeActions[i].createdAt!).getTime() - 
                            new Date(highPrivilegeActions[i-1].createdAt!).getTime();
            if (timeDiff < timeWindow) {
              rapidActions++;
            }
          }
          
          if (rapidActions > 2) {
            suspiciousPatterns.push({
              type: 'rapid_privilege_actions',
              description: `Admin performed ${rapidActions} high-privilege actions in rapid succession`,
              severity: 'critical',
              adminId,
              adminEmail,
              evidence: highPrivilegeActions,
            });
          }
        }

        // Pattern 4: Multiple IP addresses
        const uniqueIPs = new Set(adminLogEntries.map(log => log.ipAddress).filter(Boolean));
        if (uniqueIPs.size > 3) {
          suspiciousPatterns.push({
            type: 'multiple_ip_addresses',
            description: `Admin accessed from ${uniqueIPs.size} different IP addresses`,
            severity: 'medium',
            adminId,
            adminEmail,
            evidence: Array.from(uniqueIPs).map(ip => ({ ipAddress: ip })),
          });
        }
      });

      return { suspiciousPatterns };
    } catch (error) {
      console.error('Error detecting suspicious activity:', error);
      return { suspiciousPatterns: [] };
    }
  }
}