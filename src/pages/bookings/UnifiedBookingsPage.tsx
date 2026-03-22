import { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link, useSearchParams } from 'react-router-dom';
import { RootState, AppDispatch } from '../../app/store';
import api from '../../services/api';
import { fetchBookings } from '../../features/bookings/bookingsSlice';
import { getMediaUrl } from '../../utils/media';
import { Price } from '../../context/CurrencyContext';
import { Calendar, MapPin, Clock, AlertTriangle, CheckCircle, XCircle, Timer, ShieldAlert, Car, Briefcase, Filter } from 'lucide-react';
import toast from 'react-hot-toast';

function isBookingExpired(booking: any): boolean {
  const now = new Date();
  const terminalStatuses = ['COMPLETED', 'CANCELLED'];
  if (terminalStatuses.includes(booking.status)) return false;

  if (booking.booking_type === 'RIDE' || booking.booking_category === 'ride') {
    if (booking.ride_details?.departure_time) {
      return new Date(booking.ride_details.departure_time) < now;
    }
  } else if (booking.end_time) {
    return new Date(booking.end_time) < now;
  }
  return false;
}

function getDisplayStatus(booking: { end_time: string; status: string }): string {
  if (isBookingExpired(booking)) return 'EXPIRED';
  return booking.status;
}

const getStatusConfig = (status: string) => {
  const configs: Record<string, { class: string; icon: React.ReactNode; label: string }> = {
    PENDING: { class: 'bg-amber-50 text-amber-700 border border-amber-200', icon: <Timer className="h-3 w-3" />, label: 'Pending' },
    CONFIRMED: { class: 'bg-blue-50 text-blue-700 border border-blue-200', icon: <CheckCircle className="h-3 w-3" />, label: 'Confirmed' },
    ACTIVE: { class: 'bg-emerald-50 text-emerald-700 border border-emerald-200', icon: <CheckCircle className="h-3 w-3" />, label: 'Active' },
    COMPLETED: { class: 'bg-green-50 text-green-700 border border-green-200', icon: <CheckCircle className="h-3 w-3" />, label: 'Completed' },
    CANCELLED: { class: 'bg-red-50 text-red-700 border border-red-200', icon: <XCircle className="h-3 w-3" />, label: 'Cancelled' },
    EXPIRED: { class: 'bg-gray-100 text-gray-600 border border-gray-300', icon: <AlertTriangle className="h-3 w-3" />, label: 'Expired' },
    DISPUTED: { class: 'bg-red-100 text-red-800 border border-red-300', icon: <ShieldAlert className="h-3 w-3" />, label: 'Disputed' },
  };
  return configs[status] || configs.PENDING;
};

export default function UnifiedBookingsPage() {
  const dispatch = useDispatch<AppDispatch>();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useSelector((state: RootState) => state.auth);
  const { bookings: myBookings = [], isLoading: isLoadingMyBookings } = useSelector((state: RootState) => state.bookings || {});
  
  const [incomingBookings, setIncomingBookings] = useState<any[]>([]);
  const [isLoadingIncoming, setIsLoadingIncoming] = useState(false);
  
  const currentTab = searchParams.get('tab') || 'my_bookings';
  const filterType = searchParams.get('type') || 'ALL'; // ALL, RIDES, ASSETS

  useEffect(() => {
    if (currentTab === 'my_bookings') {
      dispatch(fetchBookings({ role: 'RENTER' }));
    } else {
      setIsLoadingIncoming(true);
      api.get('/bookings/incoming/')
        .then(res => setIncomingBookings(res.data.results || res.data))
        .catch(() => toast.error('Failed to load incoming bookings'))
        .finally(() => setIsLoadingIncoming(false));
    }
  }, [dispatch, currentTab]);

  const handleTabChange = (tab: string) => {
    setSearchParams({ tab, type: filterType });
  };

  const handleFilterChange = (type: string) => {
    setSearchParams({ tab: currentTab, type });
  };

  const currentBookings = currentTab === 'my_bookings' ? myBookings : incomingBookings;
  const isLoading = currentTab === 'my_bookings' ? isLoadingMyBookings : isLoadingIncoming;

  const filteredBookings = currentBookings.filter((b: any) => {
    const isRide = b.booking_type === 'RIDE' || b.booking_category === 'ride';
    if (filterType === 'RIDES') return isRide;
    if (filterType === 'ASSETS') return !isRide;
    return true; // ALL
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Calendar className="h-6 w-6 text-primary-600" />
            Bookings Dashboard
          </h1>
          <p className="text-gray-500 mt-1">Manage your bookings and incoming requests.</p>
        </div>
      </div>

      <div className="card p-0 overflow-hidden">
        {/* Top Tabs */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => handleTabChange('my_bookings')}
            className={`flex-1 py-4 text-center font-bold text-sm transition-colors ${
              currentTab === 'my_bookings' ? 'bg-primary-50 text-primary-700 border-b-2 border-primary-600' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
            }`}
          >
            My Bookings (As Customer)
          </button>
          <button
            onClick={() => handleTabChange('incoming_bookings')}
            className={`flex-1 py-4 text-center font-bold text-sm transition-colors ${
              currentTab === 'incoming_bookings' ? 'bg-primary-50 text-primary-700 border-b-2 border-primary-600' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
            }`}
          >
            Incoming Bookings (As Provider)
          </button>
        </div>

        {/* Sub-filters */}
        <div className="p-4 bg-gray-50 border-b border-gray-100 flex items-center gap-4">
          <span className="text-sm font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1">
            <Filter className="h-4 w-4" /> Filter
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => handleFilterChange('ALL')}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${filterType === 'ALL' ? 'bg-gray-900 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-100'}`}
            >
              All Types
            </button>
            <button
              onClick={() => handleFilterChange('RIDES')}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors flex items-center gap-1 ${filterType === 'RIDES' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-100'}`}
            >
              <Car className="h-3.5 w-3.5" /> Rides
            </button>
            <button
              onClick={() => handleFilterChange('ASSETS')}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors flex items-center gap-1 ${filterType === 'ASSETS' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-100'}`}
            >
              <Briefcase className="h-3.5 w-3.5" /> Assets
            </button>
          </div>
        </div>

        {/* List Content */}
        <div className="p-6">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse bg-gray-100 h-32 rounded-xl" />
              ))}
            </div>
          ) : filteredBookings.length > 0 ? (
            <div className="space-y-4">
              {filteredBookings.map((booking: any) => {
                const displayStatus = getDisplayStatus(booking);
                const statusConfig = getStatusConfig(displayStatus);
                const expired = isBookingExpired(booking);
                const isRide = booking.booking_type === 'RIDE' || booking.booking_category === 'ride';

                const CardWrapper = expired ? 'div' : Link;
                // For ride bookings: `booking.ride` is the FK UUID from SeatBookingSerializer
                // `booking.ride_id` does NOT exist — never fall back to booking.id (seat booking UUID)
                const rideId = booking.ride || booking.ride_details?.id;
                const bookingTypeParam = booking.weight ? 'cargo' : 'seat'; // weight is present on CargoBooking, or we can use booking_category if it exists
                const wrapperProps = expired
                  ? { className: "block bg-white border border-gray-200 rounded-xl p-5 transition-all opacity-60 grayscale cursor-not-allowed" }
                  : {
                      to: isRide ? `/rides/bookings/${booking.id}?type=${bookingTypeParam}` : `/bookings/${booking.id}`,
                      className: "block bg-white border border-gray-200 rounded-xl p-5 hover:border-primary-300 hover:shadow-md transition-all cursor-pointer"
                    };

                return (
                  <CardWrapper key={booking.id} {...(wrapperProps as any)}>
                    <div className="flex flex-col md:flex-row gap-5">
                      {/* Image Thumbnail */}
                      <div className="w-full md:w-32 h-32 bg-gray-100 rounded-lg overflow-hidden shrink-0 relative">
                        {isRide ? (
                          booking.ride_details?.photos?.[0] ? (
                            <img
                              src={getMediaUrl(booking.ride_details.photos[0].url)}
                              alt="Ride Vehicle"
                              className={`w-full h-full object-cover ${expired ? 'grayscale' : ''}`}
                            />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center bg-indigo-50">
                              <Car className="h-10 w-10 text-indigo-400" />
                            </div>
                          )
                        ) : booking.asset?.photos?.[0] ? (
                          <img
                            src={getMediaUrl(booking.asset.photos[0].url)}
                            alt={booking.asset?.name}
                            className={`w-full h-full object-cover ${expired ? 'grayscale' : ''}`}
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center bg-blue-50">
                             <Briefcase className="h-10 w-10 text-blue-400" />
                          </div>
                        )}
                        <span className={`absolute top-2 left-2 px-2 py-0.5 text-[10px] uppercase font-black tracking-wider rounded border ${isRide ? 'bg-indigo-100 text-indigo-800 border-indigo-200' : 'bg-blue-100 text-blue-800 border-blue-200'}`}>
                          {isRide ? 'Ride' : 'Asset'}
                        </span>
                      </div>

                      <div className="flex-1 flex flex-col justify-between">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-bold text-gray-900 text-lg">
                              {isRide ? (booking.ride_details?.origin ? `${booking.ride_details.origin} to ${booking.ride_details.destination}` : 'Ride Booking') : (booking.asset?.name || 'Asset Booking')}
                            </h3>
                            {!isRide && booking.asset?.city && (
                              <p className="text-sm text-gray-500 flex items-center mt-1">
                                <MapPin className="h-3.5 w-3.5 mr-1" />
                                {booking.asset.city}, {booking.asset.country}
                              </p>
                            )}
                          </div>
                          {expired ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-full bg-gray-100 text-gray-600 border border-gray-300 shrink-0">
                              <AlertTriangle className="h-3 w-3" />
                              [ 🕒 Unavailable - Expired ]
                            </span>
                          ) : (
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-full shrink-0 ${statusConfig.class}`}>
                              {statusConfig.icon}
                              {statusConfig.label}
                            </span>
                          )}
                        </div>

                        <div className="flex justify-between items-end mt-4 pt-4 border-t border-gray-100">
                          <div className="space-y-1">
                            {currentTab === 'incoming_bookings' && booking.renter && (
                               <p className="text-xs text-gray-500 font-bold flex items-center gap-1">
                                  <span className="text-gray-400 uppercase tracking-widest text-[10px]">Customer:</span> {booking.renter.first_name || booking.renter.email}
                               </p>
                            )}
                            <div className="flex items-center text-sm text-gray-600 font-medium">
                              <Calendar className="h-4 w-4 mr-1.5 text-gray-400" />
                              {booking.start_time ? new Date(booking.start_time).toLocaleDateString() : (
                                booking.ride_details?.departure_time ? new Date(booking.ride_details.departure_time).toLocaleDateString() : 'TBD'
                              )} 
                              {!isRide && booking.end_time && ` - ${new Date(booking.end_time).toLocaleDateString()}`}
                            </div>
                          </div>
                          <div className="text-right">
                             <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">{currentTab === 'my_bookings' ? 'Total Cost' : 'Earnings'}</p>
                             <p className="text-lg font-black text-gray-900 leading-none mt-1">
                               <Price amount={booking.total_price || booking.price || 0} />
                             </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardWrapper>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-16">
              <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">No bookings found</h3>
              <p className="text-gray-500">You don't have any {filterType.toLowerCase() !== 'all' ? filterType.toLowerCase() : ''} bookings in this category.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
