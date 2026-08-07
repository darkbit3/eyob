import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Search, UserCheck, UserX, Shield } from 'lucide-react';

export default function AdminUsers() {
  const { users, setUsers } = useApp();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  const filtered = users
    .filter(u => roleFilter === 'all' || u.role === roleFilter)
    .filter(u => u.name.toLowerCase().includes(search.toLowerCase()) || u.phone.toLowerCase().includes(search.toLowerCase()));

  function toggleStatus(id: string) {
    setUsers(prev => prev.map(u => u.id === id
      ? { ...u, status: u.status === 'active' ? 'suspended' : 'active' } : u));
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-bold text-gray-900">User Management</h1>
        <p className="text-gray-500 text-sm">{users.length} registered users</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            className="input-field pl-9" placeholder="Search by name or phone..." />
        </div>
        <div className="flex gap-2">
          {['all','customer','admin'].map(r => (
            <button key={r} onClick={() => setRoleFilter(r)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors capitalize
                ${roleFilter===r ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              {r}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-500 bg-gray-50 border-b border-gray-100">
                <th className="text-left py-3 px-4">User</th>
                <th className="text-left py-3 px-4">Phone</th>
                <th className="text-left py-3 px-4">Role</th>
                <th className="text-right py-3 px-4">Credits</th>
                <th className="text-right py-3 px-4">Wallet</th>
                <th className="text-left py-3 px-4">Joined</th>
                <th className="text-left py-3 px-4">Status</th>
                <th className="text-center py-3 px-4">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(u => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center text-white text-xs font-bold">
                        {u.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{u.name}</p>
                        <p className="text-xs text-gray-400">{u.phone}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-gray-500 text-xs">{u.phone}</td>
                  <td className="py-3 px-4">
                    <span className={`flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full w-fit
                      ${u.role==='admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                      {u.role==='admin' && <Shield className="w-3 h-3" />}
                      {u.role}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right font-medium text-gray-700">{u.credits}</td>
                  <td className="py-3 px-4 text-right font-medium text-gray-700">{u.walletBalance.toLocaleString()}</td>
                  <td className="py-3 px-4 text-gray-400 text-xs">{u.joinedAt}</td>
                  <td className="py-3 px-4">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold
                      ${u.status==='active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {u.status}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <button onClick={() => toggleStatus(u.id)}
                      disabled={u.role==='admin'}
                      className={`flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed
                        ${u.status==='active' ? 'text-red-600 bg-red-50 hover:bg-red-100' : 'text-green-600 bg-green-50 hover:bg-green-100'}`}>
                      {u.status==='active' ? <><UserX className="w-3 h-3" /> Suspend</> : <><UserCheck className="w-3 h-3" /> Activate</>}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
