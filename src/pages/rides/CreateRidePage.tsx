import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '../../app/store';
import { createRide } from '../../features/rides/ridesSlice';
import toast from 'react-hot-toast';
import { Ride } from '../../types';
import ImageUpload from '../../components/upload/ImageUpload';
import { Upload, Loader2, Plus, Trash2, MapPin, Clock, Car } from 'lucide-react';
import api from '../../services/api';

interface StopFormData {
  name: string;
  address: string;
  stop_type: 'PICKUP' | 'DROPOFF' | 'BOTH';
  estimated_arrival: string;
  departure_time: string;
  notes: string;
}

export default function CreateRidePage() {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [images, setImages] = useState<File[]>([]);
  const [formData, setFormData] = useState({
    route_name: '',
    origin: '',
    destination: '',
    departure_time: '',
    estimated_arrival: '',
    total_seats: 4,
    seat_price: '',
    currency: 'KES',
    vehicle_description: '',
    vehicle_color: '',
    vehicle_license_plate: '',
    driver_notes: '',
  });
  const [stops, setStops] = useState<StopFormData[]>([]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const addStop = () => {
    setStops(prev => [...prev, {
      name: '',
      address: '',
      stop_type: 'BOTH',
      estimated_arrival: '',
      departure_time: '',
      notes: '',
    }]);
  };

  const removeStop = (index: number) => {
    setStops(prev => prev.filter((_, i) => i !== index));
  };

  const updateStop = (index: number, field: keyof StopFormData, value: string) => {
    setStops(prev => prev.map((stop, i) => 
      i === index ? { ...stop, [field]: value } : stop
    ));
  };

  const uploadImages = async (rideId: string, files: File[]) => {
    if (files.length === 0) return;
    
    const formData = new FormData();
    files.forEach((file, index) => {
      formData.append('images', file);
      if (index === 0) {
        formData.append('is_primary', 'true');
      }
    });

    try {
      await api.post(`/rides/${rideId}/images/`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    } catch (error) {
      console.error('Failed to upload images:', error);
      toast.error('Ride created but image upload failed');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.origin || !formData.destination || !formData.departure_time) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (formData.total_seats < 1) {
      toast.error('At least one seat is required');
      return;
    }

    setIsLoading(true);
    try {
      const rideData: Partial<Ride> = {
        route_name: formData.route_name || `${formData.origin} → ${formData.destination}`,
        origin: formData.origin,
        destination: formData.destination,
        departure_time: formData.departure_time,
        estimated_arrival: formData.estimated_arrival || undefined,
        total_seats: formData.total_seats,
        seat_price: parseFloat(formData.seat_price) || 0,
        currency: formData.currency,
        vehicle_description: formData.vehicle_description || undefined,
        vehicle_color: formData.vehicle_color || undefined,
        vehicle_license_plate: formData.vehicle_license_plate || undefined,
        driver_notes: formData.driver_notes || undefined,
        stops_data: stops.map((stop, index) => ({
          stop_type: stop.stop_type,
          name: stop.name,
          address: stop.address,
          stop_order: index + 1,
          latitude: 0, // Will be geocoded on backend
          longitude: 0,
          estimated_arrival: stop.estimated_arrival || undefined,
          departure_time: stop.departure_time || undefined,
          notes: stop.notes || undefined,
        })),
      };

      const result = await dispatch(createRide(rideData));
      if (createRide.fulfilled.match(result)) {
        const rideId = result.payload.id;
        
        // Upload images if any
        if (images.length > 0) {
          await uploadImages(rideId, images);
        }
        
        toast.success('Ride created successfully!');
        navigate(`/rides/${rideId}`);
      } else {
        toast.error(result.payload as string || 'Failed to create ride');
      }
    } catch (error) {
      toast.error('An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Offer a Ride</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Images Section */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Vehicle Photos
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            Add photos of your vehicle to help passengers identify it.
          </p>
          <ImageUpload
            images={images}
            onChange={setImages}
            maxImages={5}
            maxSizeMB={5}
          />
        </div>

        {/* Route Information */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Route Details
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Route Name <span className="text-gray-400">(optional)</span>
              </label>
              <input
                type="text"
                name="route_name"
                value={formData.route_name}
                onChange={handleInputChange}
                className="input"
                placeholder="e.g., Nairobi to Mombasa Express"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Origin <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="origin"
                  value={formData.origin}
                  onChange={handleInputChange}
                  className="input"
                  placeholder="e.g., Nairobi CBD"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Destination <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="destination"
                  value={formData.destination}
                  onChange={handleInputChange}
                  className="input"
                  placeholder="e.g., Mombasa"
                  required
                />
              </div>
            </div>
          </div>
        </div>

        {/* Schedule */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Schedule
          </h2>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Departure Time <span className="text-red-500">*</span>
                </label>
                <input
                  type="datetime-local"
                  name="departure_time"
                  value={formData.departure_time}
                  onChange={handleInputChange}
                  className="input"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Estimated Arrival <span className="text-gray-400">(optional)</span>
                </label>
                <input
                  type="datetime-local"
                  name="estimated_arrival"
                  value={formData.estimated_arrival}
                  onChange={handleInputChange}
                  className="input"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Vehicle Information */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Car className="w-5 h-5" />
            Vehicle Information
          </h2>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Vehicle Description
                </label>
                <input
                  type="text"
                  name="vehicle_description"
                  value={formData.vehicle_description}
                  onChange={handleInputChange}
                  className="input"
                  placeholder="e.g., Toyota Hiace"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Color
                </label>
                <input
                  type="text"
                  name="vehicle_color"
                  value={formData.vehicle_color}
                  onChange={handleInputChange}
                  className="input"
                  placeholder="e.g., White"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  License Plate
                </label>
                <input
                  type="text"
                  name="vehicle_license_plate"
                  value={formData.vehicle_license_plate}
                  onChange={handleInputChange}
                  className="input"
                  placeholder="e.g., KAA 123A"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Seats and Pricing */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold mb-4">Seats & Pricing</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Total Seats <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="total_seats"
                  value={formData.total_seats}
                  onChange={handleInputChange}
                  className="input"
                  min="1"
                  max="50"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Price per Seat <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                    {formData.currency === 'KES' ? 'KSh' : formData.currency === 'USD' ? '$' : formData.currency}
                  </span>
                  <input
                    type="number"
                    name="seat_price"
                    value={formData.seat_price}
                    onChange={handleInputChange}
                    className="input pl-12"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Currency
                </label>
                <select
                  name="currency"
                  value={formData.currency}
                  onChange={handleInputChange}
                  className="input"
                >
                  <option value="KES">KES (Kenyan Shilling)</option>
                  <option value="USD">USD (US Dollar)</option>
                  <option value="EUR">EUR (Euro)</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Stops */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Intermediate Stops</h2>
            <button
              type="button"
              onClick={addStop}
              className="btn-secondary text-sm flex items-center gap-1"
            >
              <Plus className="w-4 h-4" />
              Add Stop
            </button>
          </div>
          
          {stops.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">
              No intermediate stops added. Add stops if your route has pickup/dropoff points along the way.
            </p>
          ) : (
            <div className="space-y-4">
              {stops.map((stop, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4 relative">
                  <button
                    type="button"
                    onClick={() => removeStop(index)}
                    className="absolute top-2 right-2 p-1 text-gray-400 hover:text-red-500"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  
                  <p className="text-sm font-medium text-gray-700 mb-3">Stop {index + 1}</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Name</label>
                      <input
                        type="text"
                        value={stop.name}
                        onChange={(e) => updateStop(index, 'name', e.target.value)}
                        className="input text-sm"
                        placeholder="e.g., Nakuru"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Type</label>
                      <select
                        value={stop.stop_type}
                        onChange={(e) => updateStop(index, 'stop_type', e.target.value)}
                        className="input text-sm"
                      >
                        <option value="PICKUP">Pickup Only</option>
                        <option value="DROPOFF">Dropoff Only</option>
                        <option value="BOTH">Pickup & Dropoff</option>
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs font-medium text-gray-600 mb-1">Address</label>
                      <input
                        type="text"
                        value={stop.address}
                        onChange={(e) => updateStop(index, 'address', e.target.value)}
                        className="input text-sm"
                        placeholder="e.g., Nakuru Bus Stage"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Additional Notes */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold mb-4">Additional Notes</h2>
          <textarea
            name="driver_notes"
            value={formData.driver_notes}
            onChange={handleInputChange}
            className="input"
            rows={3}
            placeholder="Any additional information for passengers (e.g., luggage restrictions, meeting point details)..."
          />
        </div>

        {/* Submit Buttons */}
        <div className="flex justify-end gap-4">
          <button type="button" onClick={() => navigate(-1)} className="btn-secondary">
            Cancel
          </button>
          <button type="submit" disabled={isLoading} className="btn-primary flex items-center gap-2">
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Creating...
              </>
            ) : (
              'Offer Ride'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
