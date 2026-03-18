import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../app/store';
import { fetchRide, updateRide } from '../../features/rides/ridesSlice';
import toast from 'react-hot-toast';
import { Ride } from '../../types';
import { Loader2, MapPin, Clock, Save, ChevronLeft, AlertCircle, Ban } from 'lucide-react';

export default function RideEditPage() {
  const { id } = useParams<{ id: string }>();
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { currentRide: ride, isLoading: isFetching } = useSelector((state: RootState) => state.rides);
  const { user } = useSelector((state: RootState) => state.auth);
  
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    route_name: '',
    origin: '',
    destination: '',
    departure_time: '',
    estimated_arrival: '',
    total_seats: 4,
    seat_price: '',
    currency: 'TZS',
    driver_notes: '',
    status: '' as any,
  });

  useEffect(() => {
    if (id) {
      dispatch(fetchRide(id));
    }
  }, [dispatch, id]);

  useEffect(() => {
    if (ride) {
      // Check if user is the driver
      if (user && ride.driver.id !== user.id && !user.is_superuser) {
        toast.error('You do not have permission to edit this ride');
        navigate(`/rides/${id}`);
        return;
      }

      setFormData({
        route_name: ride.route_name || '',
        origin: ride.origin || '',
        destination: ride.destination || '',
        departure_time: ride.departure_time ? new Date(ride.departure_time).toISOString().slice(0, 16) : '',
        estimated_arrival: ride.estimated_arrival ? new Date(ride.estimated_arrival).toISOString().slice(0, 16) : '',
        total_seats: ride.total_seats || 4,
        seat_price: ride.seat_price?.toString() || '',
        currency: ride.currency || 'TZS',
        driver_notes: ride.driver_notes || '',
        status: ride.status || 'OPEN',
      });
    }
  }, [ride, user, id, navigate]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    // Basic validation
    if (!formData.origin || !formData.destination || !formData.departure_time) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsLoading(true);
    try {
      const updateData: Partial<Ride> = {
        route_name: formData.route_name,
        origin: formData.origin,
        destination: formData.destination,
        departure_time: formData.departure_time,
        estimated_arrival: formData.estimated_arrival || undefined,
        total_seats: formData.total_seats,
        seat_price: parseFloat(formData.seat_price) || 0,
        currency: formData.currency,
        driver_notes: formData.driver_notes,
        status: formData.status,
      };

      const result = await dispatch(updateRide({ id, data: updateData }));
      if (updateRide.fulfilled.match(result)) {
        toast.success('Ride updated successfully!');
        navigate(`/rides/${id}`);
      } else {
        toast.error(result.payload as string || 'Failed to update ride');
      }
    } catch (error) {
      toast.error('An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetching && !ride) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh]">
        <Loader2 className="h-12 w-12 animate-spin text-primary-600 mb-4" />
        <p className="text-gray-500 font-bold  tracking-widest text-xs">Loading trip details...</p>
      </div>
    );
  }

  if (!ride) return null;

  return (
    <div className="max-w-3xl mx-auto pb-20">
      <div className="flex items-center justify-between mb-8">
        <div>
          <Link to={`/rides/${id}`} className="flex items-center gap-2 text-primary-600 hover:text-primary-700 font-bold text-sm mb-2 transition-all">
            <ChevronLeft className="h-4 w-4" /> Back to Ride Details
          </Link>
          <h1 className="text-3xl font-black text-gray-900 tracking-tighter ">Edit Trip</h1>
        </div>
        <div className="px-4 py-2 bg-gray-100 rounded-2xl border border-gray-200">
           <p className="text-[10px] font-black text-gray-400  tracking-widest">Current Status</p>
           <p className="text-sm font-black text-primary-600 ">{ride.status}</p>
        </div>
      </div>

      <div className="bg-amber-50 border-2 border-amber-100 rounded-3xl p-6 mb-8 flex gap-4">
        <AlertCircle className="h-6 w-6 text-amber-600 flex-shrink-0" />
        <div>
          <p className="text-sm font-bold text-amber-900  tracking-tight mb-1">Important Note</p>
          <p className="text-xs font-medium text-amber-800 leading-relaxed">
            Major changes to route or departure time may affect existing passengers. We recommend messaging your passengers before making significant updates.
          </p>
        </div>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Status Control */}
        <div className="card p-8 border-none shadow-xl bg-white">
          <h2 className="text-xl font-black text-gray-900 mb-6 flex items-center gap-2  tracking-tight">
            <Ban className="w-5 h-5 text-primary-600" />
            Trip Lifecycle
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-[10px] font-black text-gray-400  tracking-widest mb-2 block">Trip Status</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl p-4 text-sm font-black focus:ring-2 focus:ring-primary-500 focus:outline-none transition-all "
              >
                <option value="OPEN">Open for Booking</option>
                <option value="FULL">Mark as Full</option>
                <option value="DEPARTED">Departed</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
          </div>
        </div>

        {/* Route Information */}
        <div className="card p-8 border-none shadow-xl bg-white">
          <h2 className="text-xl font-black text-gray-900 mb-6 flex items-center gap-2  tracking-tight">
            <MapPin className="w-5 h-5 text-primary-600" />
            Route Details
          </h2>
          <div className="space-y-6">
            <div>
              <label className="text-[10px] font-black text-gray-400  tracking-widest mb-2 block">Route Display Name</label>
              <input
                type="text"
                name="route_name"
                value={formData.route_name}
                onChange={handleInputChange}
                className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-primary-500 focus:outline-none transition-all"
                placeholder="e.g., Nairobi to Mombasa Express"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-[10px] font-black text-gray-400  tracking-widest mb-2 block">Origin</label>
                <input
                  type="text"
                  name="origin"
                  value={formData.origin}
                  onChange={handleInputChange}
                  className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-primary-500 focus:outline-none transition-all"
                  required
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-gray-400  tracking-widest mb-2 block">Destination</label>
                <input
                  type="text"
                  name="destination"
                  value={formData.destination}
                  onChange={handleInputChange}
                  className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-primary-500 focus:outline-none transition-all"
                  required
                />
              </div>
            </div>
          </div>
        </div>

        {/* Schedule */}
        <div className="card p-8 border-none shadow-xl bg-white">
          <h2 className="text-xl font-black text-gray-900 mb-6 flex items-center gap-2  tracking-tight">
            <Clock className="w-5 h-5 text-primary-600" />
            Schedule
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-[10px] font-black text-gray-400  tracking-widest mb-2 block">Departure Time</label>
              <input
                type="datetime-local"
                name="departure_time"
                value={formData.departure_time}
                onChange={handleInputChange}
                className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-primary-500 focus:outline-none transition-all"
                required
              />
            </div>
            <div>
              <label className="text-[10px] font-black text-gray-400  tracking-widest mb-2 block">Est. Arrival</label>
              <input
                type="datetime-local"
                name="estimated_arrival"
                value={formData.estimated_arrival}
                onChange={handleInputChange}
                className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-primary-500 focus:outline-none transition-all"
              />
            </div>
          </div>
        </div>

        {/* Pricing */}
        <div className="card p-8 border-none shadow-xl bg-white">
          <h2 className="text-xl font-black text-gray-900 mb-6 flex items-center gap-2  tracking-tight">
            Seats & Pricing
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="text-[10px] font-black text-gray-400  tracking-widest mb-2 block">Total Seats</label>
              <input
                type="number"
                name="total_seats"
                value={formData.total_seats}
                onChange={handleInputChange}
                className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-primary-500 focus:outline-none transition-all"
                min="1"
                required
              />
            </div>
            <div>
              <label className="text-[10px] font-black text-gray-400  tracking-widest mb-2 block">Price per Seat</label>
              <input
                type="number"
                name="seat_price"
                value={formData.seat_price}
                onChange={handleInputChange}
                className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-primary-500 focus:outline-none transition-all"
                step="0.01"
                required
              />
            </div>
            <div>
              <label className="text-[10px] font-black text-gray-400  tracking-widest mb-2 block">Currency</label>
              <select
                name="currency"
                value={formData.currency}
                onChange={handleInputChange}
                className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-primary-500 focus:outline-none transition-all"
              >
                <option value="TZS">TZS</option>
                <option value="KES">KES</option>
              </select>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="card p-8 border-none shadow-xl bg-white">
          <h2 className="text-xl font-black text-gray-900 mb-6 flex items-center gap-2  tracking-tight">
            Driver Notes
          </h2>
          <textarea
            name="driver_notes"
            value={formData.driver_notes}
            onChange={handleInputChange}
            className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl p-4 text-sm font-medium focus:ring-2 focus:ring-primary-500 focus:outline-none transition-all min-h-[120px]"
            placeholder="Additional trip details..."
          />
        </div>

        {/* Actions */}
        <div className="flex gap-4 sticky bottom-8">
          <button 
            type="submit" 
            disabled={isLoading}
            className="btn-primary flex-1 py-4 text-lg font-black  tracking-widest shadow-2xl shadow-primary-500/40 flex items-center justify-center gap-3"
          >
            {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : <Save className="h-6 w-6" />}
            Save Changes
          </button>
          <button 
            type="button" 
            onClick={() => navigate(-1)} 
            className="px-8 bg-white border-2 border-gray-100 rounded-2xl font-black text-gray-400  tracking-widest hover:bg-gray-50 transition-all"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
