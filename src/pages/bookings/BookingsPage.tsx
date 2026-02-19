import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { AppDispatch, RootState } from '../../app/store';
import { fetchBookings } from '../../features/bookings/bookingsSlice';
import { getMediaUrl } from '../../utils/media';
import { Calendar, MapPin, Star, Clock } from 'lucide-react';

export default function BookingsPage() {
  const dispatch = useDispatch<AppDispatch>();
  const { bookings = [], isLoading, count = 0 } = useSelector((state: RootState) => state.bookings || {});
  const { user } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    dispatch(fetchBookings({ role: 'RENTER' }));
  }, [dispatch]);

  const getStatusBadge = (status: string) => {
    const statusClasses: Record<string, string> = {
      PENDING: 'badge-warning',
      CONFIRMED: 'badge-info',
      ACTIVE: 'badge-success',
      COMPLETED: 'badge-success',
      CANCELLED: 'badge-danger',
      EXPIRED: 'badge-warning',
      DISPUTED: 'badge-danger',
    };
    return statusClasses[status] || 'badge-info';
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Bookings</h1>
        <Link to="/assets" className="btn-primary">
          Browse Assets
        </Link>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card p-6 animate-pulse">
              <div className="flex gap-4">
                <div className="w-24 h-24 bg-gray-200 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-1/3" />
                  <div className="h-4 bg-gray-200 rounded w-1/2" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : bookings.length > 0 ? (
        <div className="space-y-4">
          {bookings.map((booking) => (
            <Link
              key={booking.id}
              to={`/bookings/${booking.id}`}
              className="card p-6 hover:shadow-md transition-shadow block"
            >
              <div className="flex items-center gap-4">
                <div className="w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                  {booking.asset.photos?.[0] ? (
                    <img
                      src={getMediaUrl(booking.asset.photos[0].url)}
                      alt={booking.asset.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Calendar className="h-8 w-8 text-gray-400" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900">{booking.asset.name}</h3>
                      <p className="text-sm text-gray-500 flex items-center mt-1">
                        <MapPin className="h-3.5 w-3.5 mr-1" />
                        {booking.asset.city}, {booking.asset.country}
                      </p>
                    </div>
                    <span className={`badge ${getStatusBadge(booking.status)}`}>
                      {booking.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center text-sm text-gray-500">
                      <Clock className="h-3.5 w-3.5 mr-1" />
                      {new Date(booking.start_time).toLocaleDateString()} - {new Date(booking.end_time).toLocaleDateString()}
                    </div>
                    <div className="text-right">
                      <span className="font-semibold text-primary-600">
                        ${booking.total_price}
                      </span>
                      <span className="text-sm text-gray-500 ml-1">total</span>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="card p-12 text-center">
          <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No bookings yet</h3>
          <p className="text-gray-500 mb-4">Start exploring assets and make your first booking!</p>
          <Link to="/assets" className="btn-primary">
            Browse Assets
          </Link>
        </div>
      )}
    </div>
  );
}
