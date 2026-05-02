import { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../app/store';
import { fetchRide, fetchRideManifest, confirmSeatBooking, cancelSeatBooking } from '../../features/rides/ridesSlice';
import { getMediaUrl } from '../../utils/media';
import toast from 'react-hot-toast';
import { User, Phone, MessageSquare, ChevronLeft, MapPin, Luggage, Clock, CheckCircle, Users } from 'lucide-react';
import ContactButton from '../../components/messaging/ContactButton';

export default function RideManifestPage() {
  const { id } = useParams<{ id: string }>();
  const dispatch = useDispatch<AppDispatch>();
  const { currentRide: ride, rideManifest, isLoading, error } = useSelector((state: RootState) => state.rides);
  const bookings = Array.isArray(rideManifest) ? rideManifest : [];

  useEffect(() => {
    if (id) {
      dispatch(fetchRide(id));
      dispatch(fetchRideManifest(id));
    }
  }, [dispatch, id]);

  const handleApprove = async (seatBookingId: string) => {
    try {
      await dispatch(confirmSeatBooking({ seatBookingId })).unwrap();
      toast.success('Passenger approved');
    } catch (err) {
      toast.error(typeof err === 'string' ? err : 'Failed to approve passenger');
    }
  };

  const handleReject = async (seatBookingId: string) => {
    try {
      await dispatch(cancelSeatBooking({ rideId: id!, seatBookingId, reason: 'Driver rejected' })).unwrap();
      toast.success('Passenger rejected');
    } catch (err) {
      toast.error(typeof err === 'string' ? err : 'Failed to reject passenger');
    }
  };

  if (isLoading && !ride) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!ride) {
    return (
      <div className="card p-8 text-center">
        <p className="text-gray-600 mb-4">Ride not found</p>
        <Link to="/rides" className="btn-primary">Back to Rides</Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <Link to={`/rides/${id}`} className="flex items-center gap-2 text-primary-600 hover:text-primary-700 font-bold text-sm mb-2 transition-all">
            <ChevronLeft className="h-4 w-4" /> Back to Ride Details
          </Link>
          <h1 className="text-3xl font-black text-gray-900 tracking-tighter">Passenger Manifest</h1>
          <p className="text-gray-500 font-medium">Trip: {ride.origin} → {ride.destination}</p>
        </div>
        <div className="flex gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-2xl">
           <div className="px-4 py-2 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200/50">
             <p className="text-[10px] font-black text-gray-400 tracking-widest">Booked</p>
             <p className="text-xl font-black text-primary-600">{bookings.length} / {ride.total_seats}</p>
           </div>
           <div className="px-4 py-2 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200/50">
             <p className="text-[10px] font-black text-gray-400 tracking-widest">Remaining</p>
             <p className="text-xl font-black text-orange-600">{ride.total_seats - bookings.length}</p>
           </div>
        </div>
      </div>

      {bookings.length === 0 ? (
        <div className="card p-12 text-center bg-gray-50 dark:bg-gray-900 border-dashed border-2">
          <div className="w-20 h-20 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
            <Users className="h-10 w-10 text-gray-200" />
          </div>
          <h2 className="text-xl font-black text-gray-900 dark:text-white mb-1 tracking-tight">No passengers yet</h2>
          <p className="text-gray-400 text-sm font-medium">Your trip is currently empty. We'll notify you when someone books a seat.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {bookings.map((booking) => (
            <div key={booking.id} className="card p-6 hover:shadow-xl transition-all border-none bg-white relative group overflow-hidden">
              <div className={`absolute top-0 left-0 w-1 h-full ${booking.status === 'CONFIRMED' ? 'bg-emerald-500' : 'bg-orange-500'}`} />
              
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-gray-100 overflow-hidden ring-4 ring-gray-50 group-hover:ring-primary-50 transition-all">
                    {booking.passenger.profile?.avatar ? (
                      <img src={getMediaUrl(booking.passenger.profile.avatar)} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <User className="h-8 w-8 text-gray-300" />
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg font-black text-gray-900 dark:text-white">{booking.passenger.first_name} {booking.passenger.last_name}</h3>
                      <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${
                        booking.status === 'CONFIRMED' ? 'bg-emerald-100 text-emerald-600' : 'bg-orange-100 text-orange-600'
                      }`}>
                        {booking.status}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-4 text-xs font-bold text-gray-400 uppercase tracking-widest">
                      <div className="flex items-center gap-1.5">
                        <div className="w-5 h-5 rounded-md bg-primary-50 text-primary-600 flex items-center justify-center text-[10px]">
                          {booking.seat_number}
                        </div>
                        Seat Number
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Luggage className="h-3.5 w-3.5" />
                        {booking.luggage_count} Bags
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1 max-w-md">
                   <div className="space-y-3">
                      <div>
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Pickup Location</p>
                        <div className="flex items-start gap-2">
                          <MapPin className="h-3 w-3 text-primary-600 mt-0.5 flex-shrink-0" />
                          <p className="text-xs font-bold text-gray-700 leading-tight">{booking.pickup_stop?.name || ride.origin}</p>
                        </div>
                      </div>
                      <div>
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Dropoff Location</p>
                        <div className="flex items-start gap-2">
                          <MapPin className="h-3 w-3 text-emerald-600 mt-0.5 flex-shrink-0" />
                          <p className="text-xs font-bold text-gray-700 leading-tight">{booking.dropoff_stop?.name || ride.destination}</p>
                        </div>
                      </div>
                   </div>
                   
                   {booking.passenger_notes && (
                     <div className="p-3 bg-primary-50 rounded-xl border border-primary-100/50">
                        <p className="text-[9px] font-black text-primary-600 uppercase tracking-widest mb-1 flex items-center gap-1">
                          <MessageSquare className="h-2.5 w-2.5" /> Passenger Note
                        </p>
                        <p className="text-[11px] font-medium text-primary-900 leading-relaxed italic">"{booking.passenger_notes}"</p>
                     </div>
                   )}
                </div>

                <div className="flex flex-row md:flex-col gap-2">
                  {booking.status === 'RESERVED' && (
                    <>
                      <button
                        onClick={() => handleApprove(booking.id)}
                        className="flex-1 md:w-32 py-2.5 btn-success rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleReject(booking.id)}
                        className="flex-1 md:w-32 py-2.5 btn-danger rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm"
                      >
                        Reject
                      </button>
                    </>
                  )}
                  <ContactButton
                    targetUserId={booking.passenger.id}
                    label="Message"
                    threadType="RIDE"
                    rideId={ride.id}
                    subject={`Ride Manifest Message: ${ride.route_name}`}
                    variant="primary"
                    className="flex-1 md:w-32 justify-center py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg shadow-primary-200"
                  />
                  {booking.passenger.profile?.phone ? (
                    <a 
                      href={`tel:${booking.passenger.profile.phone}`}
                      className="flex-1 md:w-32 py-2.5 bg-white dark:bg-gray-800 border-2 border-gray-100 text-gray-900 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
                    >
                      <Phone className="h-3 w-3 text-primary-600" />
                      Call
                    </a>
                  ) : (
                    <button 
                      disabled
                      title="No phone number provided"
                      className="flex-1 md:w-32 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-100 text-gray-300 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 cursor-not-allowed"
                    >
                      <Phone className="h-3 w-3" />
                      No Num
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Safety & Checklist */}
      <div className="card p-8 bg-gray-900 text-white border-none shadow-2xl overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary-600/20 rounded-full blur-3xl -mr-32 -mt-32" />
        <div className="relative">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-primary-600 rounded-2xl shadow-lg shadow-primary-600/40">
              <CheckCircle className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-black tracking-tight leading-none uppercase">Pre-Trip Checklist</h2>
              <p className="text-primary-400 text-[10px] font-bold uppercase tracking-widest mt-1">Driver Safety Protocol</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { title: "Verify Identity", desc: "Check passenger government ID before boarding." },
              { title: "Safety Gear", desc: "Ensure all passengers have seatbelts fastened." },
              { title: "Digital Check-in", desc: "Mark passengers as 'Boarded' in the system." }
            ].map((item, idx) => (
              <div key={idx} className="p-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all">
                <p className="text-xs font-black mb-1 uppercase tracking-tight">{item.title}</p>
                <p className="text-[11px] text-gray-400 font-medium leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
