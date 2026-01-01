// Admin audit dashboard component for viewing audit logs and security events
'use client';

import React, { useState, useEffect } from 'react';
import { AuditLoggingService, AuditLogEntry, SecurityEventEntry, AuditLogFilters, SecurityEventFilters } from '@/lib/services/audit-logging';
import { AdminAuditService } from '@/lib/services/admin-audit';
import { useRoleAccess } from '@/lib/hooks/useRoleAccess';
import { PermissionGate } from '@/components/auth/AdminRoute';

interface AdminAuditDashboardProps {
  className?: string;
}

type TabType = 'overview' | 'audit_logs' | 'security_events' | 'sessions' | 'export';

export default function AdminAuditDashboard({ className = '' }: AdminAuditDashboardProps) {
  const { userRole, isSuperAdmin, userId, userProfile } = useRoleAccess();
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Overview data
  const [statistics, setStatistics] = useState<any>(null);
  const [suspiciousActivity, setSuspiciousActivity] = useState<any[]>([]);

  // Audit logs
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [auditFilters, setAuditFilters] = useState<AuditLogFilters>({});

  // Security events
  const [securityEvents, setSecurityEvents] = useState<SecurityEventEntry[]>([]);
  const [securityFilters, setSecurityFilters] = useState<SecurityEventFilters>({});

  // Admin sessions
  const [adminSessions, setAdminSessions] = useState<any[]>([]);

  // Load overview data
  const loadOverview = async () => {
    try {
      setLoading(true);
      setError(null);

      const [stats, suspicious] = await Promise.all([
        AuditLoggingService.getAuditStatistics(),
        AuditLoggingService.detectSuspiciousActivity(),
      ]);

      setStatistics(stats);
      setSuspiciousActivity(suspicious.suspiciousPatterns);
    } catch (err) {
      console.error('Error loading overview:', err);
      setError(err instanceof Error ? err.message : 'Failed to load overview');
    } finally {
      setLoading(false);
    }
  };

  // Load audit logs
  const loadAuditLogs = async () => {
    try {
      setLoading(true);
      setError(null);

      const { logs } = await AuditLoggingService.getAuditLogs(auditFilters, 100);
      setAuditLogs(logs);
    } catch (err) {
      console.error('Error loading audit logs:', err);
      setError(err instanceof Error ? err.message : 'Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  };

  // Load security events
  const loadSecurityEvents = async () => {
    try {
      setLoading(true);
      setError(null);

      const { events } = await AuditLoggingService.getSecurityEvents(securityFilters, 100);
      setSecurityEvents(events);
    } catch (err) {
      console.error('Error loading security events:', err);
      setError(err instanceof Error ? err.message : 'Failed to load security events');
    } finally {
      setLoading(false);
    }
  };

  // Load admin sessions
  const loadAdminSessions = async () => {
    try {
      setLoading(true);
      setError(null);

      const { sessions } = await AuditLoggingService.getAdminSessions(undefined, undefined, 50);
      setAdminSessions(sessions);
    } catch (err) {
      console.error('Error loading admin sessions:', err);
      setError(err instanceof Error ? err.message : 'Failed to load admin sessions');
    } finally {
      setLoading(false);
    }
  };

  // Export audit logs
  const handleExport = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get admin context for logging
      const adminContext = AdminAuditService.getAdminContext(
        userId || 'unknown',
        userProfile?.email
      );
      
      const result = await AuditLoggingService.exportAuditLogs(auditFilters, adminContext.adminId);
      
      if (result.success && result.csvData) {
        // Create and download CSV file
        const blob = new Blob([result.csvData], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      } else {
        setError(result.error || 'Failed to export audit logs');
      }
    } catch (err) {
      console.error('Error exporting audit logs:', err);
      setError(err instanceof Error ? err.message : 'Failed to export audit logs');
    } finally {
      setLoading(false);
    }
  };

  // Resolve security event
  const handleResolveSecurityEvent = async (eventId: string, resolutionNotes: string) => {
    try {
      const adminContext = AdminAuditService.getAdminContext(
        userId || 'unknown',
        userProfile?.email
      );
      
      const result = await AuditLoggingService.resolveSecurityEvent(
        eventId,
        adminContext.adminId,
        resolutionNotes
      );

      if (result.success) {
        // Refresh security events
        await loadSecurityEvents();
      } else {
        setError(result.error || 'Failed to resolve security event');
      }
    } catch (err) {
      console.error('Error resolving security event:', err);
      setError(err instanceof Error ? err.message : 'Failed to resolve security event');
    }
  };

  // Load data based on active tab
  useEffect(() => {
    switch (activeTab) {
      case 'overview':
        loadOverview();
        break;
      case 'audit_logs':
        loadAuditLogs();
        break;
      case 'security_events':
        loadSecurityEvents();
        break;
      case 'sessions':
        loadAdminSessions();
        break;
    }
  }, [activeTab, auditFilters, securityFilters]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getActionColor = (action: string) => {
    if (action.includes('delete') || action.includes('failure')) {
      return 'bg-red-100 text-red-800';
    }
    if (action.includes('create') || action.includes('success')) {
      return 'bg-green-100 text-green-800';
    }
    if (action.includes('update') || action.includes('change')) {
      return 'bg-blue-100 text-blue-800';
    }
    return 'bg-gray-100 text-gray-800';
  };

  return (
    <PermissionGate resource="admin/audit" action="read">
      <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Audit & Security Dashboard</h2>
          <p className="text-sm text-gray-600 mt-1">
            Monitor admin activities, security events, and system access
          </p>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            {[
              { id: 'overview', name: 'Overview', icon: '📊' },
              { id: 'audit_logs', name: 'Audit Logs', icon: '📋' },
              { id: 'security_events', name: 'Security Events', icon: '🔒' },
              { id: 'sessions', name: 'Admin Sessions', icon: '👥' },
              { id: 'export', name: 'Export', icon: '📤' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-4 bg-red-50 border-b border-red-200">
            <div className="flex">
              <svg className="h-5 w-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <svg className="animate-spin h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span className="ml-2 text-gray-600">Loading...</span>
            </div>
          ) : (
            <>
              {/* Overview Tab */}
              {activeTab === 'overview' && statistics && (
                <div className="space-y-6">
                  {/* Statistics Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                      <div className="text-2xl font-bold text-blue-900">{statistics.totalActions}</div>
                      <div className="text-sm text-blue-700">Total Actions</div>
                    </div>
                    <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                      <div className="text-2xl font-bold text-red-900">{statistics.failedActions}</div>
                      <div className="text-sm text-red-700">Failed Actions</div>
                    </div>
                    <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                      <div className="text-2xl font-bold text-yellow-900">{statistics.securityEvents}</div>
                      <div className="text-sm text-yellow-700">Security Events</div>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                      <div className="text-2xl font-bold text-green-900">{statistics.activeAdminSessions}</div>
                      <div className="text-sm text-green-700">Active Sessions</div>
                    </div>
                  </div>

                  {/* Suspicious Activity Alerts */}
                  {suspiciousActivity.length > 0 && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <h3 className="text-lg font-medium text-red-900 mb-3">🚨 Suspicious Activity Detected</h3>
                      <div className="space-y-2">
                        {suspiciousActivity.slice(0, 5).map((pattern, index) => (
                          <div key={index} className="flex items-center justify-between bg-white p-3 rounded border">
                            <div>
                              <div className="font-medium text-gray-900">{pattern.type.replace(/_/g, ' ').toUpperCase()}</div>
                              <div className="text-sm text-gray-600">{pattern.description}</div>
                              <div className="text-xs text-gray-500">Admin: {pattern.adminEmail || pattern.adminId}</div>
                            </div>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getSeverityColor(pattern.severity)}`}>
                              {pattern.severity.toUpperCase()}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Top Admins */}
                  {statistics.topAdmins.length > 0 && (
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-3">Most Active Admins</h3>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="space-y-2">
                          {statistics.topAdmins.slice(0, 5).map((admin: any, index: number) => (
                            <div key={admin.adminId} className="flex items-center justify-between">
                              <div>
                                <div className="font-medium text-gray-900">
                                  {admin.adminEmail || admin.adminId}
                                </div>
                              </div>
                              <div className="text-sm text-gray-600">
                                {admin.actionCount} actions
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Audit Logs Tab */}
              {activeTab === 'audit_logs' && (
                <div className="space-y-4">
                  {/* Filters */}
                  <div className="flex flex-wrap gap-4 p-4 bg-gray-50 rounded-lg">
                    <select
                      value={auditFilters.action || ''}
                      onChange={(e) => setAuditFilters(prev => ({ ...prev, action: e.target.value as any || undefined }))}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">All Actions</option>
                      <option value="user_created">User Created</option>
                      <option value="user_updated">User Updated</option>
                      <option value="user_deleted">User Deleted</option>
                      <option value="role_changed">Role Changed</option>
                      <option value="password_reset">Password Reset</option>
                      <option value="product_created">Product Created</option>
                      <option value="product_updated">Product Updated</option>
                      <option value="login_success">Login Success</option>
                      <option value="login_failure">Login Failure</option>
                    </select>

                    <select
                      value={auditFilters.severity || ''}
                      onChange={(e) => setAuditFilters(prev => ({ ...prev, severity: e.target.value as any || undefined }))}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">All Severities</option>
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="critical">Critical</option>
                    </select>

                    <input
                      type="date"
                      value={auditFilters.dateFrom || ''}
                      onChange={(e) => setAuditFilters(prev => ({ ...prev, dateFrom: e.target.value || undefined }))}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="From Date"
                    />

                    <input
                      type="date"
                      value={auditFilters.dateTo || ''}
                      onChange={(e) => setAuditFilters(prev => ({ ...prev, dateTo: e.target.value || undefined }))}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="To Date"
                    />

                    <button
                      onClick={() => setAuditFilters({})}
                      className="px-4 py-2 text-sm text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      Clear Filters
                    </button>
                  </div>

                  {/* Audit Logs Table */}
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Timestamp
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Admin
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Action
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Description
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Severity
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {auditLogs.map((log) => (
                          <tr key={log.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {new Date(log.createdAt!).toLocaleString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {log.adminEmail || log.adminId}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getActionColor(log.action)}`}>
                                {log.action.replace(/_/g, ' ')}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                              {log.description}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getSeverityColor(log.severity || 'low')}`}>
                                {(log.severity || 'low').toUpperCase()}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                log.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                              }`}>
                                {log.success ? 'Success' : 'Failed'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {auditLogs.length === 0 && (
                    <div className="text-center py-8">
                      <div className="text-gray-500">No audit logs found</div>
                    </div>
                  )}
                </div>
              )}

              {/* Security Events Tab */}
              {activeTab === 'security_events' && (
                <div className="space-y-4">
                  {/* Security Events List */}
                  <div className="space-y-4">
                    {securityEvents.map((event) => (
                      <div key={event.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getSeverityColor(event.severity)}`}>
                                {event.severity.toUpperCase()}
                              </span>
                              <span className="text-sm text-gray-500">
                                {event.eventType.replace(/_/g, ' ').toUpperCase()}
                              </span>
                              <span className="text-sm text-gray-500">
                                {new Date(event.createdAt!).toLocaleString()}
                              </span>
                            </div>
                            <div className="text-sm text-gray-900 mb-2">
                              {event.description}
                            </div>
                            {event.ipAddress && (
                              <div className="text-xs text-gray-500">
                                IP: {event.ipAddress}
                              </div>
                            )}
                          </div>
                          <div className="ml-4">
                            {event.resolved ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                Resolved
                              </span>
                            ) : (
                              <button
                                onClick={() => {
                                  const notes = prompt('Resolution notes:');
                                  if (notes) {
                                    handleResolveSecurityEvent(event.id!, notes);
                                  }
                                }}
                                className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded text-white bg-red-600 hover:bg-red-700"
                              >
                                Resolve
                              </button>
                            )}
                          </div>
                        </div>
                        {event.resolved && event.resolutionNotes && (
                          <div className="mt-2 p-2 bg-green-50 rounded text-sm text-green-800">
                            <strong>Resolution:</strong> {event.resolutionNotes}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {securityEvents.length === 0 && (
                    <div className="text-center py-8">
                      <div className="text-gray-500">No security events found</div>
                    </div>
                  )}
                </div>
              )}

              {/* Admin Sessions Tab */}
              {activeTab === 'sessions' && (
                <div className="space-y-4">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Admin
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Login Time
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Last Activity
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            IP Address
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {adminSessions.map((session) => (
                          <tr key={session.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {session.adminEmail || session.adminId}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {new Date(session.loginTime).toLocaleString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {session.lastActivity ? new Date(session.lastActivity).toLocaleString() : '-'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {session.actionsPerformed || 0}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                session.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                              }`}>
                                {session.isActive ? 'Active' : 'Ended'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {session.ipAddress || '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {adminSessions.length === 0 && (
                    <div className="text-center py-8">
                      <div className="text-gray-500">No admin sessions found</div>
                    </div>
                  )}
                </div>
              )}

              {/* Export Tab */}
              {activeTab === 'export' && (
                <div className="space-y-6">
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex">
                      <svg className="h-5 w-5 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-yellow-800">
                          Compliance Export
                        </h3>
                        <div className="mt-2 text-sm text-yellow-700">
                          <p>
                            Exporting audit logs will create a record of this action for compliance purposes.
                            The export will include all audit logs matching the current filters.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Export Audit Logs</h3>
                      <p className="text-sm text-gray-600 mb-4">
                        Export audit logs as CSV for compliance reporting and external analysis.
                      </p>
                      
                      <button
                        onClick={handleExport}
                        disabled={loading}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        {loading ? 'Exporting...' : 'Export to CSV'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </PermissionGate>
  );
}