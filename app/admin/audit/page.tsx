// Admin audit dashboard page
import { AdminAuditDashboard } from '@/components/admin';

export default function AdminAuditPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Audit & Security</h1>
        <p className="text-gray-600">
          Monitor admin activities, security events, and system access logs
        </p>
      </div>
      
      <AdminAuditDashboard />
    </div>
  );
}