import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../app/store';
import { fetchDashboardStats } from '../../features/admin/adminSlice';
import { Users, DollarSign, ShoppingCart, Star, TrendingUp, AlertCircle } from 'lucide-react';

export default function AdminDashboardPage() {
  const dispatch = useDispatch<AppDispatch>();
  const { stats, isLoading } = useSelector((state: RootState) => state.admin);

  useEffect(() => {
    dispatch(fetchDashboardStats());
  }, [dispatch]);

  if (isLoading) {
    return <div className="animate-pulse p-8">
      <div className="h-8 bg-gray-200 rounded w-1/4 mb-8" />
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="card p-6 h-32" />
        ))}
      </div>
    </div>;
  }

  const statCards = [
    {
      title: 'Total Users',
      value: stats.total_users,
      icon: Users,
      color: 'bg-blue-100 text-blue-600',
      change: '+12%',
    },
    {
      title: 'Active Bookings',
      value: stats.active_bookings,
      icon: ShoppingCart,
      color: 'bg-green-100 text-green-600',
      change: '+8%',
    },
    {
      title: 'Revenue',
      value: `$${stats.revenue.toLocaleString()}`,
      icon: DollarSign,
      color: 'bg-purple-100 text-purple-600',
      change: '+23%',
    },
    {
      title: 'Avg Rating',
      value: stats.avg_rating?.toFixed(1) || 'N/A',
      icon: Star,
      color: 'bg-yellow-100 text-yellow-600',
      change: '+0.2',
    },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <button className="btn-primary">
          <TrendingUp className="h-4 w-4 mr-2" />
          Export Report
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat) => (
          <div key={stat.title} className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-lg ${stat.color}`}>
                <stat.icon className="h-6 w-6" />
              </div>
              <span className="text-sm text-green-600 font-medium">{stat.change}</span>
            </div>
            <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
            <p className="text-sm text-gray-500">{stat.title}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold">Recent Disputes</h2>
          </div>
          <div className="p-6">
            {stats.recent_disputes?.length > 0 ? (
              <div className="space-y-4">
                {stats.recent_disputes.map((dispute: { id: string; booking_id: string; status: string; created_at: string }) => (
                  <div key={dispute.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <AlertCircle className="h-5 w-5 text-red-500" />
                      <div>
                        <p className="font-medium">Booking #{dispute.booking_id}</p>
                        <p className="text-sm text-gray-500">
                          {new Date(dispute.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <span className="badge badge-warning">{dispute.status}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No pending disputes</p>
            )}
          </div>
        </div>

        <div className="card">
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold">Platform Overview</h2>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex justify-between">
              <span className="text-gray-600">Total Assets</span>
              <span className="font-semibold">{stats.total_assets}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Total Rides</span>
              <span className="font-semibold">{stats.total_rides}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Completed Transactions</span>
              <span className="font-semibold">{stats.completed_transactions}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Dispute Rate</span>
              <span className="font-semibold text-red-600">
                {stats.dispute_rate?.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
