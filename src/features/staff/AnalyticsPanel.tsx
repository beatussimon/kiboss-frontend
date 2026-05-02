import { DollarSign, User, Calendar, Layers, TrendingUp, PieChart as PieChartIcon, Activity } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { Price } from '../../context/CurrencyContext';

export default function AnalyticsPanel({ analytics }: { analytics: any }) {
  if (!analytics) return null;
  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
  const assetPieData = Object.entries(analytics.assets.by_type).map(([name, value]) => ({ name, value }));

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card p-6 bg-gradient-to-br from-primary-600 to-primary-700 text-white border-none shadow-primary-200/50">
          <div className="flex justify-between items-start mb-4"><div className="p-2 bg-white/20 rounded-lg"><DollarSign className="h-6 w-6" /></div><TrendingUp className="h-4 w-4 text-primary-200" /></div>
          <p className="text-primary-100 text-xs font-black uppercase tracking-widest mb-1">Total Volume</p>
          <h3 className="text-3xl font-black tracking-tighter"><Price amount={analytics.financials.total_volume} /></h3>
        </div>
        <div className="card p-6 bg-gradient-to-br from-emerald-600 to-emerald-700 text-white border-none shadow-emerald-200/50">
          <div className="flex justify-between items-start mb-4"><div className="p-2 bg-white/20 rounded-lg"><User className="h-6 w-6" /></div><Activity className="h-4 w-4 text-emerald-200" /></div>
          <p className="text-emerald-100 text-xs font-black uppercase tracking-widest mb-1">Total Users</p>
          <h3 className="text-3xl font-black tracking-tighter">{analytics.users.total.toLocaleString()}</h3>
        </div>
        <div className="card p-6 bg-gradient-to-br from-orange-600 to-orange-700 text-white border-none shadow-orange-200/50">
          <div className="flex justify-between items-start mb-4"><div className="p-2 bg-white/20 rounded-lg"><Calendar className="h-6 w-6" /></div><TrendingUp className="h-4 w-4 text-orange-200" /></div>
          <p className="text-orange-100 text-xs font-black uppercase tracking-widest mb-1">Bookings</p>
          <h3 className="text-3xl font-black tracking-tighter">{analytics.performance.total_bookings.toLocaleString()}</h3>
        </div>
        <div className="card p-6 bg-gradient-to-br from-gray-800 to-gray-900 text-white border-none shadow-gray-200/50">
          <div className="flex justify-between items-start mb-4"><div className="p-2 bg-white/20 rounded-lg"><Layers className="h-6 w-6" /></div><Activity className="h-4 w-4 text-gray-400" /></div>
          <p className="text-gray-400 text-xs font-black uppercase tracking-widest mb-1">Total Assets</p>
          <h3 className="text-3xl font-black tracking-tighter">{analytics.assets.total.toLocaleString()}</h3>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 card p-8">
          <h3 className="text-lg font-black text-gray-900 tracking-tight flex items-center gap-2 mb-8"><TrendingUp className="h-5 w-5 text-primary-600" /> Growth Trajectory</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={analytics.growth}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" /><XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 600 }} dy={10} /><YAxis hide /><Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={4} dot={{ r: 6, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 8 }} />
                <Line type="monotone" dataKey="users" stroke="#10b981" strokeWidth={4} dot={{ r: 6, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="card p-8">
          <h3 className="text-lg font-black text-gray-900 tracking-tight mb-8 flex items-center gap-2"><PieChartIcon className="h-5 w-5 text-primary-600" /> Inventory Mix</h3>
          <div className="h-[250px] w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart><Pie data={assetPieData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">{assetPieData.map((entry, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />))}</Pie><Tooltip /></PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}