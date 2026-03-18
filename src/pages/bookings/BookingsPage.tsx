import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { AppDispatch, RootState } from '../../app/store';
import { fetchBookings } from '../../features/bookings/bookingsSlice';
import { getMediaUrl } from '../../utils/media';
import { Price } from '../../context/CurrencyContext';
import { Calendar, MapPin, Star, Clock, AlertTriangle, CheckCircle, XCircle, Timer } from 'lucide-react';

/**
 * Determine if a booking is functionally expired:
 * past its end_time and still in a non-terminal status.
 */
function isBookingExpired(booking: { end_time: string; status: string }): boolean {
  const now = new Date();
  const endTime = new Date(booking.end_time);
  const terminalStatuses = ['COMPLETED', 'CANCELLED', 'EXPIRED'];
  return endTime < now && !terminalStatuses.includes(booking.status);
}

/**
 * Get the display status — shows EXPIRED if the booking
 * is past its time but backend hasn't transitioned it yet.
 */
function getDisplayStatus(booking: { end_time: string; status: string }): string {
  if (isBookingExpired(booking)) return 'EXPIRED';
  return booking.status;
}

export default function BookingsPage() {
  const dispatch = useDispatch<AppDispatch>();
  const { bookings = [], isLoading, count = 0 } = useSelector((state: RootState) => state.bookings || {});

  useEffect(() => {
    dispatch(fetchBookings({ role: 'RENTER' }));
  }, [dispatch]);

  const getStatusConfig = (status: string) => {
    const configs: Record<string, { class: string; icon: React.ReactNode; label: string }> = {
      PENDING: {
        class: 'bg-amber-50 text-amber-700 border border-amber-200',
        icon: <Timer className="h-3 w-3" />,
        label: 'Pending',
      },
      CONFIRMED: {
        class: 'bg-blue-50 text-blue-700 border border-blue-200',
        icon: <CheckCircle className="h-3 w-3" />,
        label: 'Confirmed',
      },
      ACTIVE: {
        class: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
        icon: <CheckCircle className="h-3 w-3" />,
        label: 'Active',
      },
      COMPLETED: {
        class: 'bg-green-50 text-green-700 border border-green-200',
        icon: <CheckCircle className="h-3 w-3" />,
        label: 'Completed',
      },
      CANCELLED: {
        class: 'bg-red-50 text-red-700 border border-red-200',
        icon: <XCircle className="h-3 w-3" />,
        label: 'Cancelled',
      },
      EXPIRED: {
        class: 'bg-gray-100 text-gray-600 border border-gray-300',
        icon: <AlertTriangle className="h-3 w-3" />,
        label: 'Expired',
      },
      DISPUTED: {
        class: 'bg-red-100 text-red-800 border border-red-300',
        icon: <AlertTriangle className="h-3 w-3" />,
        label: 'Disputed',
      },
    };
    return configs[status] || configs.PENDING;
  };

  const bookingCount = count || bookings.length;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Bookings</h1>
          {bookingCount > 0 && (
            <p className="text-sm text-gray-500 mt-1">
              {bookingCount} booking{bookingCount !== 1 ? 's' : ''} total
            </p>
          )}
        </div>
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
          {bookings.map((booking) => {
            const displayStatus = getDisplayStatus(booking);
            const statusConfig = getStatusConfig(displayStatus);
            const expired = isBookingExpired(booking);

            return (
              <Link
                key={booking.id}
                to={`/bookings/${booking.id}`}
                className={`card p-6 hover:shadow-md transition-shadow block ${expired ? 'opacity-75 border-l-4 border-l-gray-400' : ''}`}
              >
                <div className="flex items-center gap-4">
                  <div className="w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                    {booking.asset?.photos?.[0] ? (
                      <img
                        src={getMediaUrl(booking.asset.photos[0].url)}
                        alt={booking.asset?.name}
                        className={`w-full h-full object-cover ${expired ? 'grayscale' : ''}`}
                      />
                    ) : (
                      <Calendar className="h-8 w-8 text-gray-400" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-900">{booking.asset?.name || 'Unknown Asset'}</h3>
                        <p className="text-sm text-gray-500 flex items-center mt-1">
                          <MapPin className="h-3.5 w-3.5 mr-1" />
                          {booking.asset?.city || 'N/A'}, {booking.asset?.country || 'N/A'}
                        </p>
                      </div>
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${statusConfig.class}`}>
                        {statusConfig.icon}
                        {statusConfig.label}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center text-sm text-gray-500">
                        <Clock className="h-3.5 w-3.5 mr-1" />
                        {new Date(booking.start_time).toLocaleDateString()} - {new Date(booking.end_time).toLocaleDateString()}
                        {expired && (
                          <span className="ml-2 text-xs text-gray-500 italic">(past due)</span>
                        )}
                      </div>
                      <div className="text-right">
                        <span className="font-semibold text-primary-600">
                          <Price amount={booking.total_price} />
                        </span>
                        <span className="text-sm text-gray-500 ml-1">total</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
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
