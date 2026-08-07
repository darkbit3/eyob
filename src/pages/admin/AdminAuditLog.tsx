import { mockAuditLogs } from '../../data/mockData';
import { formatDate } from '../../utils/countdown';
import { ClipboardList } from 'lucide-react';

export default function AdminAuditLog() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-bold text-gray-900">Audit Log</h1>
        <p className="text-gray-500 text-sm">A record of all admin actions on the platform.</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-3.5 border-b border-gray-100">
          <ClipboardList className="w-4 h-4 text-gray-500" />
          <span className="font-semibold text-gray-700 text-sm">{mockAuditLogs.length} entries</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-500 bg-gray-50 border-b border-gray-100">
                <th className="text-left py-2.5 px-4">Timestamp</th>
                <th className="text-left py-2.5 px-4">Admin</th>
                <th className="text-left py-2.5 px-4">Action</th>
                <th className="text-left py-2.5 px-4">Target</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {[...mockAuditLogs].reverse().map(log => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="py-3 px-4 text-gray-400 text-xs whitespace-nowrap">{formatDate(log.timestamp)}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center text-purple-700 text-xs font-bold">
                        {log.adminName.charAt(0)}
                      </div>
                      <span className="font-medium text-gray-900 text-xs">{log.adminName}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-xs font-semibold px-2 py-1 bg-blue-50 text-blue-700 rounded-full">{log.action}</span>
                  </td>
                  <td className="py-3 px-4 text-gray-600 text-xs">{log.target}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
