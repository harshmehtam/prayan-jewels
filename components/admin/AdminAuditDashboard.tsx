// COMMENTED OUT - Admin audit dashboard component - Not needed for now since audit logging is disabled
/*
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
  // Component implementation commented out since audit logging is disabled
  return (
    <div className={className}>
      <div className="text-center py-8">
        <h2 className="text-xl font-semibold text-gray-600">Audit Dashboard</h2>
        <p className="text-gray-500 mt-2">Audit logging is currently disabled</p>
      </div>
    </div>
  );
}
*/

// Stub component for build compatibility
export default function AdminAuditDashboard({ className = '' }: { className?: string }) {
  return (
    <div className={className}>
      <div className="text-center py-8">
        <h2 className="text-xl font-semibold text-gray-600">Audit Dashboard</h2>
        <p className="text-gray-500 mt-2">Audit logging is currently disabled</p>
      </div>
    </div>
  );
}