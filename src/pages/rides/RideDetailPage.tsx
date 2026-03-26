import { useEffect, useState, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../app/store';
import { fetchRide, fetchSeatAvailability, bookSeat, bulkBookSeats, bookCargo, fetchMyBookings, clearRideError } from '../../features/rides/ridesSlice';
import { getMediaUrl } from '../../utils/media';
import { Price } from '../../context/CurrencyContext';
import { MapPin, Users, ArrowRight, Clock, Star, Edit, List, ChevronLeft, ChevronRight, Home, Car, User, Calendar, Shield, Package, Phone } from 'lucide-react';
import toast from 'react-hot-toast';
import VerificationBadge from '../../components/ui/VerificationBadge';
import ContactButton from '../../components/messaging/ContactButton';
import ImageModal from '../../components/ui/ImageModal';
import { ServiceFeeTrigger } from '../../components/common/ServiceFeeModal';

export default function RideDetailPage() {
  const { id } = useParams<{ id: string }>();
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { currentRide: ride, seatAvailability, isLoading, error, myBookings } = useSelector((state: RootState) => state.rides);
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);
  const [selectedSeats, setSelectedSeats] = useState<number[]>([]);
  const [businessSeats, setBusinessSeats] = useState<number>(1);
  const [cargoWeight, setCargoWeight] = useState<number | ''>('');
  const [activeTab, setActiveTab] = useState<'SEATS' | 'CARGO'>('SEATS');
  const [isBooking, setIsBooking] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [hasCargoBooking, setHasCargoBooking] = useState(false);

  // Use a ref to track which ride ID we last fetched — prevents StrictMode double-fire
  const fetchedForId = useRef<string | null>(null);

  useEffect(() => {
    if (!id) return;
    // If we already initiated a fetch for this exact ride ID, skip
    if (fetchedForId.current === id) return;
    fetchedForId.current = id;

    // Reset stale 404 state when navigating to a new ride
    dispatch(clearRideError());

    dispatch(fetchRide(id));
    dispatch(fetchSeatAvailability(id));
    if (isAuthenticated) {
      dispatch(fetchMyBookings());
      import('../../services/api').then(({ default: api }) => {
        api.get(`/rides/cargo-bookings/`, { params: { ride: id, sender: 'me' } })
          .then(res => {
            const bookings = res.data?.results || res.data || [];
            if (bookings.some((b: any) => b.status === 'CONFIRMED' || b.status === 'PENDING')) {
              setHasCargoBooking(true);
            }
          })
          .catch(console.error);
      });
    }
  }, [dispatch, id, isAuthenticated]);

  const nextImage = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (ride?.photos && ride.photos.length > 0) {
      setCurrentImageIndex((prev) => (prev + 1) % ride.photos.length);
    }
  };

  const prevImage = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (ride?.photos && ride.photos.length > 0) {
      setCurrentImageIndex((prev) => (prev - 1 + ride.photos.length) % ride.photos.length);
    }
  };

  const toggleSeat = (seatNumber: number, status: string) => {
    if (status !== 'AVAILABLE') return;

    setSelectedSeats(prev =>
      prev.includes(seatNumber)
        ? prev.filter(s => s !== seatNumber)
        : [...prev, seatNumber]
    );
  };

  const handleBookNow = async () => {
    const rideId = id!;
    if (!rideId || (!isAuthenticated && activeTab !== 'CARGO')) {
      if (!isAuthenticated) {
        toast.error('Please login to book');
        return;
      }
    }

    setIsBooking(true);
    
    // Front-end validation to prevent unnecessary 400 Bad Request network errors
    if (ride && new Date(ride.departure_time) < new Date()) {
      toast.error('This ride has already departed and cannot be booked.');
      setIsBooking(false);
      return;
    }

    try {
      if (activeTab === 'CARGO') {
        const weight = Number(cargoWeight);
        if (weight <= 0) {
          toast.error('Please enter a valid weight');
          setIsBooking(false);
          return;
        }
        const bookedCargo = await dispatch(bookCargo({
          ride_id: rideId,
          weight: weight,
        })).unwrap();
        toast.success(`Cargo space reserved. Please complete payment.`);
        navigate(`/rides/bookings/${bookedCargo.id}?type=cargo`);
      } else {
        if (ride?.ride_type === 'BUSINESS') {
          if (businessSeats <= 0) {
            toast.error('Please enter a valid number of seats');
            setIsBooking(false);
            return;
          }
          await dispatch(bulkBookSeats({
            rideId: rideId,
            data: { quantity: businessSeats }
          })).unwrap();
          toast.success(`${businessSeats} seat(s) reserved. Please complete payment.`);
          navigate('/bookings?tab=my_bookings');
        } else {
          if (selectedSeats.length === 0) {
            toast.error('Please select at least one seat');
            setIsBooking(false);
            return;
          }
          const bookingPromises = selectedSeats.map(seatNumber =>
            dispatch(bookSeat({
              rideId: rideId,
              data: {
                seat_number: seatNumber,
                payment_method: 'card'
              }
            })).unwrap()
          );
          const results = await Promise.all(bookingPromises);
          toast.success(`${selectedSeats.length} seat(s) reserved. Please complete payment.`);
          
          if (results.length === 1 && results[0]?.id) {
            navigate(`/rides/bookings/${results[0].id}?type=seat`);
          } else {
            navigate('/bookings?tab=my_bookings');
          }
        }
      }

      // Refresh seat/cargo availability
      dispatch(fetchRide(rideId));
      if (activeTab === 'SEATS' && ride?.ride_type === 'PERSONAL') {
        dispatch(fetchSeatAvailability(rideId));
      }
    } catch (err) {
      const errorMessage = typeof err === 'string' ? err : 'Failed to process booking. Please try again.';
      
      let displayMessage = errorMessage;
      const prefixesToRemove = ['ride_id:', 'non_field_errors:', 'seat_number:', 'cargo_weight_kg:', 'weight:'];
      for (const prefix of prefixesToRemove) {
        if (displayMessage.toLowerCase().startsWith(prefix)) {
          displayMessage = displayMessage.substring(prefix.length).trim();
        }
      }
      
      // Capitalize first letter if it got lowercased by the prefix removal
      if (displayMessage.length > 0) {
        displayMessage = displayMessage.charAt(0).toUpperCase() + displayMessage.slice(1);
      }
      
      if (displayMessage.toLowerCase().includes('already departed')) {
        toast.error('This ride has already departed and cannot be booked.');
        dispatch(fetchRide(rideId));
      } else {
        toast.error(displayMessage);
      }
    } finally {
      setIsBooking(false);
    }
  };

  if (isLoading) {
    return <div className="animate-pulse card p-8 h-64" />;
  }

  if (error) {
    const fallbackBooking = myBookings?.find(b => String(b.ride_id || b.ride) === id);
    if (error.includes('not found') || fallbackBooking) {
      return (
        <div className="card p-8 border-none shadow-2xl bg-white text-center max-w-2xl mx-auto mt-12">
          <Car className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-2xl font-black text-gray-900 mb-2">This ride is no longer available</h2>
          <p className="text-gray-500 mb-6">The provider may have cancelled or deleted it.</p>
          
          {fallbackBooking && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-left mb-6">
              <h3 className="text-amber-800 font-bold mb-2 flex items-center gap-2">
                <Shield className="h-5 w-5" /> Booking Protection
              </h3>
              <p className="text-amber-700 text-sm mb-4">You have a booking associated with this ride. Our escrow protects your payment.</p>
              
              <div className="bg-white rounded-xl p-4 shadow-sm border border-amber-100 flex justify-between items-center">
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Booking Status</p>
                  <p className="font-bold text-gray-900">{fallbackBooking.status || 'Unknown'}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Receipt</p>
                  <p className="font-black text-primary-600"><Price amount={fallbackBooking.price || fallbackBooking.total_price || 0} /></p>
                </div>
              </div>
            </div>
          )}
          
          <Link to="/rides" className="btn-primary inline-flex">
            ← Find Other Rides
          </Link>
        </div>
      );
    }

    return (
      <div className="card p-8 bg-red-50 border-red-100 max-w-2xl mx-auto mt-12">
        <p className="text-red-600 mb-4 font-bold">{error}</p>
        <Link to="/rides" className="text-primary-600 font-bold hover:text-primary-700 flex items-center gap-2">
          ← Back to Rides
        </Link>
      </div>
    );
  }

  if (!ride) {
    return (
      <div className="card p-8 bg-gray-50 border-gray-100 text-center">
        <p className="text-gray-600 mb-4 font-bold text-lg">Ride not found</p>
        <Link to="/rides" className="btn-secondary inline-flex">
          ← Back to Rides
        </Link>
      </div>
    );
  }

  // Check if current user is the driver
  const isDriver = isAuthenticated && user?.id === ride.driver?.id;

  const hasConfirmedBooking = isDriver || hasCargoBooking || myBookings?.some(b =>
    b.ride_id === id && (b.status === 'CONFIRMED' || b.status === 'PENDING')
  );

  const imageModalPhotos = ride.photos ? ride.photos.map((p, i) => ({ id: p.id || i, url: getMediaUrl(p.url) })) : [];

  return (
    <div>
      <ImageModal
        isOpen={isImageModalOpen}
        onClose={() => setIsImageModalOpen(false)}
        images={imageModalPhotos}
        initialIndex={currentImageIndex}
      />

      <Link to="/rides" className="text-primary-600 font-bold hover:text-primary-700 mb-6 inline-flex border border-primary-100 bg-primary-50 px-4 py-2 rounded-full text-sm items-center gap-2 hover:bg-primary-100 transition-colors">
        ← Back to Rides
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Image Gallery */}
          <div className="space-y-4">
            <div
              className="aspect-video relative rounded-[2rem] overflow-hidden bg-gray-900 group cursor-pointer shadow-xl border border-gray-800"
              onClick={() => setIsImageModalOpen(true)}
            >
              {ride.photos && ride.photos.length > 0 ? (
                <>
                  <img
                    src={getMediaUrl(ride.photos?.[currentImageIndex]?.url)}
                    alt={`${ride.route_name} - ${currentImageIndex + 1}`}
                    onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/800x450/e2e8f0/64748b?text=Image+Unavailable'; }}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/10 transition-opacity group-hover:bg-transparent" />

                  {/* Navigation Arrows */}
                  {ride.photos.length > 1 && (
                    <>
                      <button
                        onClick={prevImage}
                        className="absolute left-6 top-1/2 -translate-y-1/2 p-3 bg-black/40 hover:bg-black/60 backdrop-blur-md rounded-full text-white transition-all opacity-0 group-hover:opacity-100 border border-white/20 hover:scale-110"
                      >
                        <ChevronLeft className="h-6 w-6" />
                      </button>
                      <button
                        onClick={nextImage}
                        className="absolute right-6 top-1/2 -translate-y-1/2 p-3 bg-black/40 hover:bg-black/60 backdrop-blur-md rounded-full text-white transition-all opacity-0 group-hover:opacity-100 border border-white/20 hover:scale-110"
                      >
                        <ChevronRight className="h-6 w-6" />
                      </button>

                      {/* Image Counter */}
                      <div className="absolute bottom-6 right-6 px-4 py-1.5 bg-black/60 backdrop-blur-md rounded-full text-white text-xs font-bold border border-white/20 shadow-lg tracking-widest uppercase">
                        {currentImageIndex + 1} / {ride.photos.length}
                      </div>
                    </>
                  )}
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Car className="h-24 w-24 text-gray-700" />
                </div>
              )}
            </div>

            {/* Thumbnails */}
            {ride.photos && ride.photos.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-4 no-scrollbar">
                {ride.photos.map((photo, index) => (
                  <button
                    key={photo.id}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`relative w-32 h-20 rounded-xl overflow-hidden flex-shrink-0 transition-all shadow-sm ${currentImageIndex === index ? 'ring-2 ring-primary-500 scale-105 shadow-primary-500/30' : 'opacity-60 hover:opacity-100 hover:scale-105 bg-gray-100'
                      }`}
                  >
                    <img src={getMediaUrl(photo?.url)} alt="" onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/128x80/e2e8f0/64748b?text=NA'; }} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="card p-8 border-none shadow-xl bg-gradient-to-br from-white to-gray-50">
            <div className="flex items-start justify-between mb-8">
              <div>
                <p className="text-[10px] font-black  tracking-[0.2em] text-primary-600 mb-2 tracking-widest">Confirmed Ride</p>
                <h1 className="text-3xl font-black text-gray-900 leading-tight">{ride.route_name}</h1>
              </div>
              {/* Driver Actions */}
              {isDriver && (
                <div className="flex gap-2">
                  <Link to={`/rides/${ride.id}/edit`} className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-all text-gray-600">
                    <Edit className="h-5 w-5" />
                  </Link>
                  <Link to={`/rides/${ride.id}/bookings`} className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-all text-gray-600">
                    <List className="h-5 w-5" />
                  </Link>
                </div>
              )}
            </div>

            {/* Visual Route */}
            <div className="relative py-10 px-6 bg-gray-900 rounded-3xl mb-8 overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />
              <div className="relative flex flex-col md:flex-row items-center justify-between gap-8 md:gap-6">
                <div className="text-center md:text-left flex-1">
                  <p className="text-[10px] font-bold text-primary-400  tracking-widest mb-1">Origin</p>
                  <h3 className="text-xl font-black text-white break-words">{ride.origin}</h3>
                </div>

                <div className="flex items-center gap-4 w-full md:w-auto px-2">
                  <div className="w-3 h-3 rounded-full bg-primary-500 shadow-[0_0_15px_rgba(37,99,235,0.8)] flex-shrink-0" />
                  <div className="flex-1 md:w-24 h-1 bg-gradient-to-r from-primary-500 to-gray-700 rounded-full" />
                  <ArrowRight className="h-6 w-6 text-white animate-pulse flex-shrink-0" />
                  <div className="flex-1 md:w-24 h-1 bg-gradient-to-r from-gray-700 to-white/20 rounded-full" />
                  <div className="w-3 h-3 rounded-full bg-white/20 flex-shrink-0" />
                </div>

                <div className="text-center md:text-right flex-1">
                  <p className="text-[10px] font-bold text-gray-400  tracking-widest mb-1">Destination</p>
                  <h3 className="text-xl font-black text-white break-words">{ride.destination}</h3>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8 pt-6 border-t border-gray-100">
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Departure</p>
                <div className="flex items-center gap-2 text-gray-900">
                  <Clock className="h-4 w-4 text-primary-600" />
                  <span className="font-bold text-sm">{new Date(ride.departure_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Date</p>
                <div className="flex items-center gap-2 text-gray-900">
                  <Calendar className="h-4 w-4 text-primary-600" />
                  <span className="font-bold text-sm">{new Date(ride.departure_time).toLocaleDateString()}</span>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Seats</p>
                <div className="flex items-center gap-2 text-gray-900">
                  <Users className="h-4 w-4 text-primary-600" />
                  <span className="font-bold text-sm">{ride.available_seats} / {ride.total_seats}</span>
                </div>
              </div>
              {ride.cargo_enabled ? (
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Cargo (kg)</p>
                  <div className="flex items-center gap-2 text-gray-900">
                    <Package className="h-4 w-4 text-primary-600" />
                    <span className="font-bold text-sm">{ride.available_cargo} / {ride.total_cargo}</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Price</p>
                  <p className="text-lg font-black text-primary-600 leading-none"><Price amount={ride.seat_price} /></p>
                </div>
              )}
            </div>

            {/* Driver/Business Info - Clickable to profile */}
            <Link
              to={`/users/${ride.driver.id}`}
              className="flex items-center gap-4 p-5 bg-white border border-gray-100/80 rounded-2xl hover:shadow-xl hover:border-primary-100 transition-all duration-300 group mt-8"
            >
              <div className="relative">
                <div className="w-16 h-16 rounded-[1.25rem] bg-gradient-to-br from-primary-100/50 to-primary-50/50 flex flex-col items-center justify-center overflow-hidden ring-4 ring-white shadow-sm group-hover:ring-primary-50 transition-all duration-300">
                  {ride.driver.profile?.avatar ? (
                    <img
                      src={getMediaUrl(ride.driver.profile.avatar)}
                      alt={ride.driver.corporate_profile?.verification_status === 'VERIFIED' ? ride.driver.corporate_profile.company_name : ride.driver.first_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-xl font-black text-primary-700 uppercase tracking-tighter">
                      {ride.driver.corporate_profile?.verification_status === 'VERIFIED'
                        ? ride.driver.corporate_profile.company_name?.[0]
                        : `${ride.driver.first_name?.[0] || ''}${ride.driver.last_name?.[0] || ''}`}
                    </span>
                  )}
                </div>
                <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow-sm">
                  {ride.driver.corporate_profile?.verification_status === 'VERIFIED' ? (
                    <VerificationBadge
                      tier="business"
                      color="indigo"
                      size="xs"
                      checkmarkData={(ride.driver as any).checkmark_data}
                    />
                  ) : (
                    <VerificationBadge
                      tier={ride.driver.verification_badge?.tier}
                      color={ride.driver.verification_badge?.color}
                      size="xs"
                      checkmarkData={(ride.driver as any).checkmark_data}
                    />
                  )}
                </div>
              </div>
              <div className="flex-1">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5">
                  {ride.driver.corporate_profile?.verification_status === 'VERIFIED' ? 'Transport Provider' : 'Driver'}
                </p>
                <div className="flex items-center gap-2">
                  <p className="font-bold text-lg text-gray-900 group-hover:text-primary-600 transition-colors leading-tight">
                    {ride.driver.corporate_profile?.verification_status === 'VERIFIED'
                      ? ride.driver.corporate_profile.company_name
                      : `${ride.driver.first_name} ${ride.driver.last_name}`}
                  </p>
                </div>
                <div className="flex items-center gap-3 mt-1.5">
                  <p className="text-xs font-bold text-gray-500 flex items-center gap-1 bg-gray-50 px-2 py-0.5 rounded-md border border-gray-100/50">
                    <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                    {ride.driver.trust_score} Trust
                  </p>
                  <p className="text-[10px] font-bold text-gray-400">
                    {ride.driver.total_ratings_count} {ride.driver.corporate_profile?.verification_status === 'VERIFIED' ? 'Trips' : 'Rides'}
                  </p>
                </div>
              </div>
              <div className="w-10 h-10 rounded-full bg-gray-50 group-hover:bg-primary-50 flex items-center justify-center transition-colors">
                <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-primary-600 group-hover:translate-x-0.5 transition-all" />
              </div>
            </Link>
          </div>

          {/* Vehicle Info */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold mb-4">Vehicle</h2>
            <p className="text-gray-600">
              {ride.vehicle_asset?.name || ride.vehicle_description || 'Vehicle info not available'} · {ride.vehicle_asset?.asset_type || ride.vehicle_color || ''}
            </p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Unified Booking Card */}
          {!isDriver && (
            <div className="card p-0 sticky top-24 border-none shadow-2xl overflow-hidden bg-white">
              {ride.cargo_enabled && (
                <div className="flex border-b border-gray-200">
                  <button
                    onClick={() => setActiveTab('SEATS')}
                    className={`flex-1 py-4 text-sm font-black uppercase tracking-widest transition-colors ${activeTab === 'SEATS' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                  >
                    <Users className="h-4 w-4 inline-block mr-2 -mt-1" />
                    Seats
                  </button>
                  <button
                    onClick={() => setActiveTab('CARGO')}
                    className={`flex-1 py-4 text-sm font-black uppercase tracking-widest transition-colors ${activeTab === 'CARGO' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                  >
                    <Package className="h-4 w-4 inline-block mr-2 -mt-1" />
                    Cargo
                  </button>
                </div>
              )}
              <div className="bg-gray-900 p-6 text-white rounded-t-lg">
                <div className="flex justify-between items-center mb-2">
                  <p className="text-[10px] font-black uppercase tracking-widest text-primary-400">
                    {activeTab === 'SEATS' ? 'Reserve Seats' : 'Book Cargo'}
                  </p>
                  <div className="px-2 py-1 bg-primary-600 rounded text-[10px] font-bold tracking-tighter">Instant Booking</div>
                </div>
                <div className="flex justify-between items-end">
                  <div>
                    <span className="text-3xl font-black">
                      <Price amount={activeTab === 'SEATS' ? ride.seat_price : (ride.cargo_price || 0)} />
                    </span>
                    <span className="text-xs font-bold text-gray-400 ml-1">
                      / {activeTab === 'SEATS' ? 'seat' : 'kg'}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Available</p>
                    <p className="text-lg font-black text-primary-400 leading-none">
                      {activeTab === 'SEATS' ? `${ride.available_seats} seats` : `${ride.available_cargo} kg`}
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-8">
                {activeTab === 'SEATS' ? (
                  ride.ride_type === 'BUSINESS' ? (
                    <div className="space-y-4">
                      <label className="block text-sm font-bold text-gray-700">Number of Seats to Book</label>
                      <input
                        type="number"
                        min="1"
                        max={ride.available_seats}
                        value={businessSeats}
                        onChange={(e) => setBusinessSeats(parseInt(e.target.value) || 0)}
                        className="input text-lg font-black p-4 text-center"
                        placeholder="e.g. 2"
                      />
                      {businessSeats > 0 && businessSeats <= ride.available_seats && (
                        <div className="p-5 bg-gray-50 rounded-2xl border border-gray-100 space-y-3">
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-500">Subtotal ({businessSeats} Seats)</span>
                            <span className="font-bold"><Price amount={ride.seat_price * businessSeats} /></span>
                          </div>
                          <div className="flex justify-between items-center text-sm">
                            <ServiceFeeTrigger />
                            <span className="font-bold"><Price amount={0} /></span>
                          </div>
                          <div className="pt-3 border-t border-gray-200 flex justify-between items-center text-lg font-black text-gray-900">
                            <span>Total</span>
                            <span className="text-primary-600"><Price amount={ride.seat_price * businessSeats} /></span>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    /* Realistic Seat Map for Personal Rides */
                    seatAvailability && (
                      <div className="space-y-6">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-black tracking-widest text-gray-400 uppercase">Select Seats</p>
                          <div className="flex gap-2">
                            <div className="flex items-center gap-1 text-[8px] font-bold text-gray-400 uppercase">
                              <div className="w-2 h-2 bg-white border border-gray-200 rounded-sm" /> Free
                            </div>
                            <div className="flex items-center gap-1 text-[8px] font-bold text-gray-400 uppercase">
                              <div className="w-2 h-2 bg-primary-600 rounded-sm" /> Yours
                            </div>
                            <div className="flex items-center gap-1 text-[8px] font-bold text-gray-400 uppercase">
                              <div className="w-2 h-2 bg-gray-200 rounded-sm" /> Taken
                            </div>
                          </div>
                        </div>

                        <div className="relative max-w-[180px] mx-auto bg-gray-50 rounded-[3rem] p-6 border-2 border-gray-100 shadow-inner">
                          {/* Dashboard / Windshield Area */}
                          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2/3 h-1 bg-gray-200 rounded-full mt-2" />

                          {/* Front Row */}
                          <div className="flex justify-between mb-10">
                            {/* Driver Seat (Placeholder) */}
                            <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center opacity-50">
                              <User className="h-5 w-5 text-gray-400" />
                            </div>

                            {/* Front Passenger Seat (Seat 1) */}
                            {ride.total_seats >= 1 && (() => {
                              const seat = seatAvailability.seats.find(s => s.seat_number === 1);
                              const isSelected = selectedSeats.includes(1);
                              const isBooked = seat?.status === 'BOOKED' || seat?.status === 'BLOCKED';
                              return (
                                <button
                                  disabled={isBooked}
                                  onClick={() => toggleSeat(1, seat?.status || 'AVAILABLE')}
                                  className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all shadow-sm ${isBooked ? 'bg-gray-100 text-gray-300' :
                                    isSelected ? 'bg-primary-600 text-white scale-110 shadow-primary-200' :
                                      'bg-white text-primary-600 border border-primary-50 hover:border-primary-600'
                                    }`}
                                >
                                  <span className="font-bold text-xs">1</span>
                                </button>
                              );
                            })()}
                          </div>

                          {/* Back Rows (Dynamic generation based on total_seats) */}
                          <div className="grid grid-cols-3 gap-3">
                            {[2, 3, 4, 5, 6, 7, 8, 9].filter(n => n <= ride.total_seats).map((num) => {
                              const seat = seatAvailability.seats.find(s => s.seat_number === num);
                              const isSelected = selectedSeats.includes(num);
                              const isBooked = seat?.status === 'BOOKED' || seat?.status === 'BLOCKED';
                              return (
                                <button
                                  key={num}
                                  disabled={isBooked}
                                  onClick={() => toggleSeat(num, seat?.status || 'AVAILABLE')}
                                  className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all shadow-sm ${isBooked ? 'bg-gray-100 text-gray-300' :
                                    isSelected ? 'bg-primary-600 text-white scale-110 shadow-primary-200' :
                                      'bg-white text-primary-600 border border-primary-50 hover:border-primary-600'
                                    }`}
                                >
                                  <span className="font-bold text-xs">{num}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {selectedSeats.length > 0 && (
                          <div className="p-5 bg-gray-50 rounded-2xl border border-gray-100 space-y-3 animate-in zoom-in-95 duration-200">
                            <div className="flex justify-between items-center text-sm">
                              <span className="text-gray-500">Subtotal ({selectedSeats.length} Seats)</span>
                              <span className="font-bold"><Price amount={ride.seat_price * selectedSeats.length} /></span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                              <ServiceFeeTrigger />
                              <span className="font-bold"><Price amount={0} /></span>
                            </div>
                            <div className="pt-3 border-t border-gray-200 flex justify-between items-center text-lg font-black text-gray-900">
                              <span>Total</span>
                              <span className="text-primary-600"><Price amount={ride.seat_price * selectedSeats.length} /></span>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  )
                ) : (
                  <div className="space-y-4">
                    <label className="block text-sm font-bold text-gray-700">Cargo Weight (kg)</label>
                    <input
                      type="number"
                      min="1"
                      max={ride.available_cargo}
                      value={cargoWeight}
                      onChange={(e) => setCargoWeight(e.target.value === '' ? '' : Number(e.target.value))}
                      className="input text-lg font-black p-4 text-center"
                      placeholder="e.g. 5"
                    />
                    {Number(cargoWeight) > 0 && Number(cargoWeight) <= (ride.available_cargo || 0) && (
                      <div className="p-5 bg-gray-50 rounded-2xl border border-gray-100 space-y-3">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-500">Subtotal ({cargoWeight} kg)</span>
                          <span className="font-bold"><Price amount={(ride.cargo_price || 0) * Number(cargoWeight)} /></span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <ServiceFeeTrigger />
                          <span className="font-bold"><Price amount={0} /></span>
                        </div>
                        <div className="pt-3 border-t border-gray-200 flex justify-between items-center text-lg font-black text-gray-900">
                          <span>Total</span>
                          <span className="text-primary-600"><Price amount={(ride.cargo_price || 0) * Number(cargoWeight)} /></span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="space-y-3 pt-4 border-t border-gray-50">
                  <button
                    onClick={handleBookNow}
                    disabled={isBooking || ride.status === 'DEPARTED' || ride.status === 'CANCELLED' || ride.status === 'COMPLETED' || (activeTab === 'SEATS' ? ride.available_seats === 0 : ride.available_cargo === 0)}
                    className="btn-primary w-full py-4 text-sm font-black uppercase tracking-widest shadow-xl shadow-primary-500/20 disabled:opacity-50"
                  >
                    {isBooking ? 'Processing...' : ['DEPARTED', 'CANCELLED', 'COMPLETED'].includes(ride.status) ? `Ride ${ride.status}` : `Complete Booking`}
                  </button>

                  {hasConfirmedBooking && ride.driver.profile?.phone && (
                    <a
                      href={`tel:${ride.driver.profile.phone}`}
                      className="btn-secondary w-full py-4 text-sm font-black uppercase tracking-widest shadow-xl flex items-center justify-center gap-2 border-green-200 bg-green-50 text-green-700 hover:bg-green-100 hover:border-green-300"
                    >
                      <Phone className="h-5 w-5" />
                      Call Now
                    </a>
                  )}

                  <div className="w-full flex items-center gap-3">
                    <div className="flex-1 h-px bg-gray-100" />
                    <span className="text-[10px] font-bold text-gray-300 uppercase">Or</span>
                    <div className="flex-1 h-px bg-gray-100" />
                  </div>

                  {isAuthenticated && user && (
                    <ContactButton
                      targetUserId={ride.driver.id}
                      label="Inquiry / Message Driver"
                      threadType="RIDE"
                      rideId={ride.id}
                      subject={`Ride Inquiry: ${ride.origin} → ${ride.destination}`}
                      variant="outline"
                      className="w-full justify-center py-3 text-xs font-bold uppercase tracking-widest"
                      initialMessage={`Hi, I have a question about the ride from ${ride.origin} to ${ride.destination}.`}
                    />
                  )}
                </div>

                <p className="text-[9px] text-gray-400 font-bold uppercase tracking-tighter text-center px-4">
                  Escrow Protection Active. Payment released 24h after trip completion.
                </p>
              </div>
            </div>
          )}

          {/* Driver Info Card */}
          {isDriver && (
            <div className="card p-8 bg-gray-900 border-none shadow-2xl text-white overflow-hidden relative">
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary-600/10 rounded-full blur-3xl -mr-32 -mt-32" />
              <div className="relative">
                <h3 className="text-xl font-black mb-2 flex items-center gap-2">
                  <Star className="h-5 w-5 text-primary-400 fill-primary-400" />
                  Driver Console
                </h3>
                <p className="text-gray-400 text-sm mb-6 font-medium">Manage your trip settings, view passenger list, or update route details.</p>
                <div className="grid grid-cols-1 gap-3">
                  <Link to={`/rides/${ride.id}/edit`} className="w-full py-3 bg-white text-gray-900 rounded-xl font-bold text-sm text-center hover:bg-gray-100 transition-all flex items-center justify-center gap-2">
                    <Edit className="h-4 w-4" />
                    Edit Trip Details
                  </Link>
                  <Link to={`/rides/${ride.id}/manifest`} className="w-full py-3 bg-gray-800 text-white border border-gray-700 rounded-xl font-bold text-sm text-center hover:bg-gray-700 transition-all flex items-center justify-center gap-2">
                    <Users className="h-4 w-4" />
                    View Passenger Manifest
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
