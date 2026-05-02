import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Link, Navigate } from 'react-router-dom';
import { RootState } from '../../app/store';
import api from '../../services/api';
import { getMediaUrl } from '../../utils/media';
import { Price } from '../../context/CurrencyContext';
import { Calendar, MapPin, CheckCircle, XCircle, Timer, ShieldAlert, Sparkles, UserCheck, Activity, ArrowRight, Car, Briefcase, AlertTriangle } from 'lucide-react';
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

export default function IncomingBookingsPage() {
    const { user } = useSelector((state: RootState) => state.auth);
    const [bookings, setBookings] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const accountTier = user?.account_tier || 'FREE';
    const hasInsights = accountTier === 'PLUS' || accountTier === 'BUSINESS';

    useEffect(() => {
        const fetchIncoming = async () => {
            try {
                const response = await api.get('/bookings/incoming/');
                setBookings(response.data.results || response.data);
            } catch (error) {
                console.error('Failed to fetch incoming bookings', error);
                toast.error('Failed to load incoming bookings');
            } finally {
                setIsLoading(false);
            }
        };

        // Only Plus or Business can access this page fully; Free users could technically access it but let's show an upgrade prompt.
        if (hasInsights) {
            fetchIncoming();
        } else {
            setIsLoading(false);
        }
    }, [hasInsights]);

    if (!hasInsights) {
        return (
            <div className="max-w-4xl mx-auto py-20 text-center space-y-6">
                <div className="h-20 w-20 bg-purple-100 text-purple-600 rounded-3xl flex items-center justify-center mx-auto">
                    <Sparkles className="h-10 w-10" />
                </div>
                <h1 className="text-3xl font-black text-gray-900 dark:text-white">Plus Plan Required</h1>
                <p className="text-gray-500 max-w-md mx-auto">
                    Upgrade to the Plus plan to manage incoming bookings and get powerful renter insights.
                </p>
                <Link
                    to="/upgrade"
                    className="inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-primary-600 to-purple-600 text-white font-bold rounded-xl shadow-lg hover:from-primary-700 hover:to-purple-700 transition-all"
                >
                    <Sparkles className="h-5 w-5" />
                    Upgrade Now
                </Link>
            </div>
        );
    }

    const getStatusConfig = (status: string) => {
        const configs: Record<string, { class: string; icon: React.ReactNode; label: string }> = {
            PENDING: {
                class: 'bg-amber-50 text-amber-700 border border-amber-200',
                icon: <Timer className="h-3 w-3" />,
                label: 'Pending',
            },
            CONFIRMED: {
                class: 'bg-primary-50 text-primary-700 border border-primary-200',
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
            DISPUTED: {
                class: 'bg-red-100 text-red-800 border border-red-300',
                icon: <ShieldAlert className="h-3 w-3" />,
                label: 'Disputed',
            },
        };
        return configs[status] || configs.PENDING;
    };

    return (
        <div className="max-w-6xl mx-auto space-y-8 py-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 flex items-center gap-3">
                        Incoming Bookings
                        <span className="px-3 py-1 bg-purple-100 text-purple-700 text-xs font-bold rounded-full uppercase tracking-widest flex items-center gap-1">
                            <Sparkles className="h-3 w-3" /> Plus Feature
                        </span>
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-2">Manage requests for your listings and review renter insights.</p>
                </div>
            </div>

            {isLoading ? (
                <div className="flex justify-center py-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
                </div>
            ) : bookings.length === 0 ? (
                <div className="card p-12 text-center border-dashed border-2 bg-gray-50/50">
                    <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No incoming bookings yet</h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-sm mx-auto">When someone books one of your assets, it will appear here along with their profile insights.</p>
                    <Link to="/assets/create" className="btn-primary">
                        List an Asset
                    </Link>
                </div>
            ) : (
                <div className="grid gap-6">
                    {bookings.map((booking) => {
                        const statusConfig = getStatusConfig(booking.status);
                        const stats = booking.renter_stats;
                        const expired = isBookingExpired(booking);

                        return (
                            <div key={booking.id} className={`card p-0 overflow-hidden shadow-lg border-gray-200/60 transition-all ${expired ? 'opacity-60 grayscale' : 'hover:shadow-xl'}`}>
                                <div className="flex flex-col md:flex-row">
                                    {/* Left side: Booking Info */}
                                    <div className="p-6 md:w-2/3 border-b md:border-b-0 md:border-r border-gray-100 flex flex-col justify-between">
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex items-center gap-4">
                                                <div className="h-16 w-16 bg-gray-100 dark:bg-gray-800 rounded-xl overflow-hidden shrink-0">
                                                    {booking.booking_type === 'RIDE' ? (
                                                        booking.ride_details?.photos?.[0] ? (
                                                            <img src={getMediaUrl(booking.ride_details.photos[0].url)} alt="Ride Details" className="h-full w-full object-cover" />
                                                        ) : (
                                                            <div className="h-full w-full flex items-center justify-center bg-indigo-50">
                                                                <Car className="h-8 w-8 text-indigo-400" />
                                                            </div>
                                                        )
                                                    ) : booking.asset?.photos?.[0] ? (
                                                        <img src={getMediaUrl(booking.asset.photos[0].url)} alt="Asset" className="h-full w-full object-cover" />
                                                    ) : (
                                                        <div className="h-full w-full flex items-center justify-center bg-primary-50 dark:bg-primary-900/20">
                                                            <Briefcase className="h-8 w-8 text-primary-400" />
                                                        </div>
                                                    )}
                                                </div>
                                                <div>
                                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                                                        {booking.booking_type === 'RIDE' 
                                                            ? (booking.ride_details?.origin ? `${booking.ride_details.origin} to ${booking.ride_details.destination}` : 'Ride Booking') 
                                                            : (booking.asset?.name || 'Asset Booking')}
                                                    </h3>
                                                    {booking.booking_type !== 'RIDE' && booking.asset?.city && (
                                                        <p className="text-sm text-gray-500 flex items-center mt-1">
                                                            <MapPin className="h-3.5 w-3.5 mr-1" />
                                                            {booking.asset.city}, {booking.asset.country}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                            {expired ? (
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider shrink-0 bg-gray-100 text-gray-600 border border-gray-300">
                                                    <AlertTriangle className="h-3.5 w-3.5" />
                                                    [ 🕒 Unavailable - Expired ]
                                                </span>
                                            ) : (
                                                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider shrink-0 ${statusConfig.class}`}>
                                                    {statusConfig.icon}
                                                    {statusConfig.label}
                                                </span>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-2 gap-4 mt-6">
                                            <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-xl">
                                                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Duration / Date</p>
                                                <p className="text-sm font-semibold text-gray-900 mt-1">
                                                    {booking.start_time ? new Date(booking.start_time).toLocaleDateString() : (
                                                        booking.ride_details?.departure_time ? new Date(booking.ride_details.departure_time).toLocaleDateString() : 'TBD'
                                                    )} 
                                                    {booking.booking_type !== 'RIDE' && booking.end_time && <><ArrowRight className="h-3 w-3 inline mx-1 text-gray-400" /> {new Date(booking.end_time).toLocaleDateString()}</>}
                                                </p>
                                            </div>
                                            <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-xl text-right">
                                                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Earnings</p>
                                                <p className="text-lg font-black text-green-600 mt-0.5">
                                                    <Price amount={booking.total_price || booking.price || 0} />
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right side: Plus Insights */}
                                    <div className="p-6 md:w-1/3 bg-gradient-to-br from-indigo-50/50 to-purple-50/50">
                                        <div className="flex items-center gap-2 mb-4">
                                            <UserCheck className="h-5 w-5 text-indigo-500" />
                                            <h4 className="font-bold text-gray-900 dark:text-white">Renter Profile</h4>
                                        </div>

                                        <div className="space-y-4">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 bg-indigo-100 text-indigo-700 rounded-full font-bold flex items-center justify-center">
                                                    {booking.renter?.first_name?.[0]}{booking.renter?.last_name?.[0]}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-gray-900 dark:text-white">{booking.renter?.first_name} {booking.renter?.last_name}</p>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">Joined {stats?.member_since ? new Date(stats.member_since).getFullYear() : 'Recently'}</p>
                                                </div>
                                            </div>

                                            {stats ? (
                                                <div className="space-y-3 pt-3 border-t border-indigo-100/50">
                                                    <div className="flex justify-between items-center bg-white/60 p-2.5 rounded-lg border border-indigo-50/50">
                                                        <span className="text-sm text-gray-600 font-medium">Total Previous Bookings</span>
                                                        <span className="font-black text-indigo-700 text-lg">{stats.total_bookings}</span>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-2">
                                                        <div className="bg-white/60 p-2.5 rounded-lg border border-indigo-50/50 text-center">
                                                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Completed</p>
                                                            <p className="font-black text-green-600 dark:text-green-400">{stats.completed_bookings}</p>
                                                        </div>
                                                        <div className="bg-white/60 p-2.5 rounded-lg border border-indigo-50/50 text-center">
                                                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Cancelled</p>
                                                            <p className={`font-black ${stats.cancelled_bookings > 0 ? 'text-red-500' : 'text-gray-900'}`}>{stats.cancelled_bookings}</p>
                                                        </div>
                                                    </div>

                                                    {/* Risk logic display */}
                                                    {stats.cancelled_bookings > stats.completed_bookings && stats.total_bookings > 2 ? (
                                                        <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg flex gap-2 text-xs font-semibold items-start leading-relaxed">
                                                            <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
                                                            High cancellation rate. Consider reviewing carefully before approving.
                                                        </div>
                                                    ) : stats.completed_bookings > 5 ? (
                                                        <div className="bg-green-50 border border-green-200 text-green-700 p-3 rounded-lg flex gap-2 text-xs font-semibold items-center">
                                                            <CheckCircle className="h-4 w-4 shrink-0" />
                                                            Highly reliable renter.
                                                        </div>
                                                    ) : (
                                                        <div className="bg-primary-50 dark:bg-primary-900/20 border border-primary-100 text-primary-700 p-3 rounded-lg flex gap-2 text-xs font-semibold items-center">
                                                            <Activity className="h-4 w-4 shrink-0" />
                                                            Standard renter profile.
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="text-center py-6 text-gray-500 dark:text-gray-400 text-sm">
                                                    Insights unavailable
                                                </div>
                                            )}

                                            {expired ? (
                                                <button disabled className="block w-full py-2.5 bg-gray-100 border-2 border-gray-200 text-gray-400 font-bold text-sm text-center rounded-xl cursor-not-allowed">
                                                    Unavailable
                                                </button>
                                            ) : (
                                                <Link 
                                                    to={booking.booking_type === 'RIDE' 
                                                        ? `/rides/${booking.ride || booking.ride_details?.id}` 
                                                        : `/bookings/${booking.id}`} 
                                                    className="block w-full py-2.5 bg-white dark:bg-gray-800 border-2 border-indigo-100 hover:border-indigo-300 text-indigo-700 font-bold text-sm text-center rounded-xl transition-all shadow-sm"
                                                >
                                                    Review Details
                                                </Link>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
