import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../app/store';
import { fetchRide, fetchSeatAvailability, bookSeat } from '../../features/rides/ridesSlice';
import { getMediaUrl } from '../../utils/media';
import { Price } from '../../context/CurrencyContext';
import { MapPin, Users, ArrowRight, Clock, Star, Edit, List, ChevronLeft, ChevronRight, Home, Car, User, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';
import VerificationBadge from '../../components/ui/VerificationBadge';
import ContactButton from '../../components/messaging/ContactButton';

export default function RideDetailPage() {
  const { id } = useParams<{ id: string }>();
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { currentRide: ride, seatAvailability, isLoading, error } = useSelector((state: RootState) => state.rides);
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);
  const [selectedSeats, setSelectedSeats] = useState<number[]>([]);
  const [isBooking, setIsBooking] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    if (id) {
      dispatch(fetchRide(id));
      dispatch(fetchSeatAvailability(id));
    }
  }, [dispatch, id]);

  const nextImage = () => {
    if (ride?.photos && ride.photos.length > 0) {
      setCurrentImageIndex((prev) => (prev + 1) % ride.photos.length);
    }
  };

  const prevImage = () => {
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
    if (!id || selectedSeats.length === 0) {
      toast.error('Please select at least one seat');
      return;
    }

    if (!isAuthenticated) {
      toast.error('Please login to book a seat');
      return;
    }

    setIsBooking(true);
    try {
      // Book each selected seat
      const bookingPromises = selectedSeats.map(seatNumber => 
        dispatch(bookSeat({
          rideId: id,
          data: {
            seat_number: seatNumber,
            payment_method: 'card'
          }
        })).unwrap()
      );
      
      await Promise.all(bookingPromises);
      toast.success(`${selectedSeats.length} seat(s) booked successfully!`);
      setSelectedSeats([]);
      // Refresh seat availability
      dispatch(fetchSeatAvailability(id));
    } catch (err) {
      toast.error('Failed to book seat(s). Please try again.');
    } finally {
      setIsBooking(false);
    }
  };

  if (isLoading) {
    return <div className="animate-pulse card p-8 h-64" />;
  }

  if (error) {
    return (
      <div className="card p-8">
        <p className="text-red-600 mb-4">{error}</p>
        <Link to="/rides" className="text-primary-600 hover:text-primary-700">
          ← Back to Rides
        </Link>
      </div>
    );
  }

  if (!ride) {
    return (
      <div className="card p-8">
        <p className="text-gray-600 mb-4">Ride not found</p>
        <Link to="/rides" className="text-primary-600 hover:text-primary-700">
          ← Back to Rides
        </Link>
      </div>
    );
  }

  // Check if current user is the driver
  const isDriver = isAuthenticated && user?.id === ride.driver?.id;

  return (
    <div>
      <Link to="/rides" className="text-primary-600 hover:text-primary-700 mb-4 inline-block">
        ← Back to Rides
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Image Gallery */}
          <div className="space-y-4">
            <div className="aspect-video relative rounded-2xl overflow-hidden bg-gray-900 group">
              {ride.photos && ride.photos.length > 0 ? (
                <>
                  <img 
                    src={getMediaUrl(ride.photos[currentImageIndex].url)} 
                    alt={`${ride.route_name} - ${currentImageIndex + 1}`} 
                    className="w-full h-full object-contain" 
                  />
                  
                  {/* Navigation Arrows */}
                  {ride.photos.length > 1 && (
                    <>
                      <button 
                        onClick={prevImage}
                        className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-white/20 hover:bg-white/40 backdrop-blur-md rounded-full text-white transition-all opacity-0 group-hover:opacity-100"
                      >
                        <ChevronLeft className="h-6 w-6" />
                      </button>
                      <button 
                        onClick={nextImage}
                        className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-white/20 hover:bg-white/40 backdrop-blur-md rounded-full text-white transition-all opacity-0 group-hover:opacity-100"
                      >
                        <ChevronRight className="h-6 w-6" />
                      </button>
                      
                      {/* Image Counter */}
                      <div className="absolute bottom-4 right-4 px-3 py-1 bg-black/50 backdrop-blur-md rounded-full text-white text-xs font-bold">
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
              <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                {ride.photos.map((photo, index) => (
                  <button
                    key={photo.id}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`relative w-24 h-16 rounded-lg overflow-hidden flex-shrink-0 transition-all ${
                      currentImageIndex === index ? 'ring-2 ring-primary-600 opacity-100' : 'opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img src={getMediaUrl(photo.url)} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="card p-8 border-none shadow-xl bg-gradient-to-br from-white to-gray-50">
            <div className="flex items-start justify-between mb-8">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary-600 mb-2 tracking-widest">Confirmed Ride</p>
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
                  <p className="text-[10px] font-bold text-primary-400 uppercase tracking-widest mb-1">Origin</p>
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
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Destination</p>
                  <h3 className="text-xl font-black text-white break-words">{ride.destination}</h3>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8 pt-6 border-t border-gray-100">
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-gray-400 uppercase">Departure</p>
                <div className="flex items-center gap-2 text-gray-900">
                  <Clock className="h-4 w-4 text-primary-600" />
                  <span className="font-bold text-sm">{new Date(ride.departure_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-gray-400 uppercase">Date</p>
                <div className="flex items-center gap-2 text-gray-900">
                  <Calendar className="h-4 w-4 text-primary-600" />
                  <span className="font-bold text-sm">{new Date(ride.departure_time).toLocaleDateString()}</span>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-gray-400 uppercase">Availability</p>
                <div className="flex items-center gap-2 text-gray-900">
                  <Users className="h-4 w-4 text-primary-600" />
                  <span className="font-bold text-sm">{ride.available_seats} / {ride.total_seats}</span>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-gray-400 uppercase">Price</p>
                <p className="text-lg font-black text-primary-600 leading-none"><Price amount={ride.seat_price} /></p>
              </div>
            </div>

            {/* Driver Info - Clickable to profile */}
            <Link 
              to={`/users/${ride.driver.id}`} 
              className="flex items-center gap-4 p-5 bg-white border border-gray-100 rounded-2xl hover:shadow-lg hover:border-primary-100 transition-all group"
            >
              <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden ring-4 ring-gray-50 group-hover:ring-primary-50 transition-all">
                {ride.driver.profile?.avatar ? (
                  <img 
                    src={getMediaUrl(ride.driver.profile.avatar)} 
                    alt={ride.driver.first_name}
                    className="w-full h-full object-cover" 
                  />
                ) : (
                  <User className="h-7 w-7 text-gray-400" />
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-black text-gray-900 group-hover:text-primary-600 transition-colors">
                    {ride.driver.first_name} {ride.driver.last_name}
                  </p>
                  <VerificationBadge 
                    tier={ride.driver.verification_badge?.tier}
                    color={ride.driver.verification_badge?.color}
                    size="xs"
                  />
                </div>
                <p className="text-xs font-bold text-gray-400 flex items-center gap-1 mt-0.5 uppercase tracking-tighter">
                  <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />
                  {ride.driver.trust_score} Trust Score · {ride.driver.total_ratings_count} Positive Rides
                </p>
              </div>
              <ArrowRight className="h-5 w-5 text-gray-300 group-hover:text-primary-600 group-hover:translate-x-1 transition-all" />
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
              <div className="bg-gray-900 p-6 text-white">
                <div className="flex justify-between items-center mb-2">
                  <p className="text-[10px] font-black uppercase tracking-widest text-primary-400">Reserve Seats</p>
                  <div className="px-2 py-1 bg-primary-600 rounded text-[10px] font-bold uppercase tracking-tighter">Instant Booking</div>
                </div>
                <div className="flex justify-between items-end">
                  <div>
                    <span className="text-3xl font-black"><Price amount={ride.seat_price} /></span>
                    <span className="text-xs font-bold text-gray-400 ml-1">/ seat</span>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-gray-400 uppercase">Available</p>
                    <p className="text-lg font-black text-primary-400 leading-none">{ride.available_seats} seats</p>
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-8">
                {/* Realistic Seat Map */}
                {seatAvailability && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-black uppercase tracking-widest text-gray-400">Select Seats</p>
                      <div className="flex gap-2">
                        <div className="flex items-center gap-1 text-[8px] font-bold uppercase text-gray-400">
                          <div className="w-2 h-2 bg-white border border-gray-200 rounded-sm" /> Free
                        </div>
                        <div className="flex items-center gap-1 text-[8px] font-bold uppercase text-gray-400">
                          <div className="w-2 h-2 bg-primary-600 rounded-sm" /> Yours
                        </div>
                        <div className="flex items-center gap-1 text-[8px] font-bold uppercase text-gray-400">
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
                              className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all shadow-sm ${
                                isBooked ? 'bg-gray-100 text-gray-300' :
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
                              className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all shadow-sm ${
                                isBooked ? 'bg-gray-100 text-gray-300' :
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
                      <div className="p-4 bg-primary-600 rounded-2xl text-white shadow-lg shadow-primary-200 animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center text-sm font-black">
                          <span className="uppercase tracking-widest text-[10px]">Total ({selectedSeats.length} Seats)</span>
                          <span><Price amount={ride.seat_price * selectedSeats.length} /></span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="space-y-3 pt-4 border-t border-gray-50">
                  <button 
                    onClick={handleBookNow}
                    disabled={selectedSeats.length === 0 || isBooking || ride.available_seats === 0}
                    className="btn-primary w-full py-4 text-sm font-black uppercase tracking-widest shadow-xl shadow-primary-500/20 disabled:opacity-50"
                  >
                    {isBooking ? 'Processing...' : 'Complete Booking'}
                  </button>

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
                  <Link to={`/rides/${ride.id}/edit`} className="w-full py-3 bg-white text-gray-900 rounded-xl font-bold text-sm text-center hover:bg-gray-100 transition-all">
                    Edit Trip Details
                  </Link>
                  <Link to={`/rides/${ride.id}/bookings`} className="w-full py-3 bg-gray-800 text-white border border-gray-700 rounded-xl font-bold text-sm text-center hover:bg-gray-700 transition-all">
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
