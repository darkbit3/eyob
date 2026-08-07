import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { revenueData, userActivityData, auctionPerformanceData } from '../../data/mockData';

const PIE_COLORS = ['#3b82f6','#22c55e','#f59e0b','#8b5cf6','#ef4444'];

export default function AdminReports() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-bold text-gray-900">Reports & Analytics</h1>
        <p className="text-gray-500 text-sm">Platform performance overview with mock data.</p>
      </div>

      {/* Revenue */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <h3 className="font-semibold text-gray-900 mb-1">Monthly Revenue (ETB)</h3>
        <p className="text-xs text-gray-400 mb-4">Total platform revenue from credit sales and auction fees.</p>
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={revenueData}>
            <defs>
              <linearGradient id="r1" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="month" tick={{fontSize:11}} />
            <YAxis tick={{fontSize:11}} />
            <Tooltip formatter={(v:number) => [`${v.toLocaleString()} ETB`,'Revenue']} />
            <Area type="monotone" dataKey="revenue" stroke="#3b82f6" fill="url(#r1)" strokeWidth={2} dot={{ r:4 }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Activity */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h3 className="font-semibold text-gray-900 mb-1">User Activity</h3>
          <p className="text-xs text-gray-400 mb-4">New registrations vs active bidders per month.</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={userActivityData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{fontSize:11}} />
              <YAxis tick={{fontSize:11}} />
              <Tooltip />
              <Legend />
              <Bar dataKey="newUsers" name="New Users" fill="#6366f1" radius={[3,3,0,0]} />
              <Bar dataKey="activeBidders" name="Active Bidders" fill="#22c55e" radius={[3,3,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Auction by category */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h3 className="font-semibold text-gray-900 mb-1">Auctions by Category</h3>
          <p className="text-xs text-gray-400 mb-4">Distribution of auctions across product categories.</p>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={auctionPerformanceData} dataKey="auctions" nameKey="name"
                cx="50%" cy="50%" outerRadius={80} label={({name,value}) => `${name}: ${value}`} labelLine={false}>
                {auctionPerformanceData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Performance Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <h3 className="font-semibold text-gray-900 mb-4">Auction Performance by Category</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-500 bg-gray-50">
                <th className="text-left py-2.5 px-3 rounded-tl-lg">Category</th>
                <th className="text-right py-2.5 px-3">Auctions</th>
                <th className="text-right py-2.5 px-3 rounded-tr-lg">Avg Bids</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {auctionPerformanceData.map((row, i) => (
                <tr key={row.name} className="hover:bg-gray-50">
                  <td className="py-2.5 px-3 font-medium text-gray-900 flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full" style={{background: PIE_COLORS[i % PIE_COLORS.length]}} />
                    {row.name}
                  </td>
                  <td className="py-2.5 px-3 text-right text-gray-600">{row.auctions}</td>
                  <td className="py-2.5 px-3 text-right text-gray-600">{row.avgBids}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
