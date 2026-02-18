import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../app/store';
import { createBooking } from '../../features/bookings/bookingsSlice';
import { fetchAsset } from '../../features/assets/assetsSlice';
import { Calendar, Clock, AlertCircle, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function CreateBookingPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { currentAsset: asset, isLoading: assetLoading } = useSelector((state: RootState) => state.assets);
  const { isLoading: bookingLoading } = useSelector((state: RootState) => state.bookings);
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  
  const assetId = searchParams.get('asset_id');
  
  const [formData, setFormData] = useState({
    start_time: '',
    end_time: '',
    quantity: 1,
    renter_notes: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!isAuthenticated) {
      toast.error('Please login to make a booking');
      navigate('/login');
      return;
    }
    
    if (assetId) {
      dispatch(fetchAsset(assetId));
    }
  }, [dispatch, assetId, isAuthenticated, navigate]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.start_time) {
      newErrors.start_time = 'Start time is required';
    }
    if (!formData.end_time) {
      newErrors.end_time = 'End time is required';
    }
    if (formData.start_time && formData.end_time) {
      const start = new Date(formData.start_time);
      const end = new Date(formData.end_time);
      if (end <= start) {
        newErrors.end_time = 'End time must be after start time';
      }
      if (start < new Date()) {
        newErrors.start_time = 'Start time cannot be in the past';
      }
    }
    if (formData.quantity < 1) {
      newErrors.quantity = 'Quantity must be at least 1';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || !assetId) {
      return;
    }

    try {
      const result = await dispatch(createBooking({
        asset_id: assetId,
        start_time: formData.start_time,
        end_time: formData.end_time,
        quantity: formData.quantity,
        payment_method: 'card',
        renter_notes: formData.renter_notes,
      })).unwrap();
      
      toast.success('Booking created successfully!');
      navigate(`/bookings/${result.id}`);
    } catch (error) {
      toast.error(error as string || 'Failed to create booking');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'quantity' ? parseInt(value) || 1 : value,
    }));
    // Clear error when user types
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Calculate estimated price
  const calculatePrice = () => {
    if (!asset?.pricing_rules?.[0] || !formData.start_time || !formData.end_time) {
      return null;
    }
    
    const start = new Date(formData.start_time);
    const end = new Date(formData.end_time);
    const hours = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60)));
    const pricePerUnit = typeof asset.pricing_rules[0].price === 'string' 
      ? parseFloat(asset.pricing_rules[0].price) 
      : asset.pricing_rules[0].price || 0;
    
    return {
      hours,
      subtotal: hours * pricePerUnit * formData.quantity,
      pricePerUnit,
    };
  };

  const priceInfo = calculatePrice();

  if (assetLoading) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="animate-pulse card p-8 h-96" />
      </div>
    );
  }

  if (!asset) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="card p-8 text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Asset Not Found</h2>
          <p className="text-gray-500 mb-4">The asset you're trying to book doesn't exist or has been removed.</p>
          <Link to="/assets" className="btn-primary">
            Browse Assets
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Link to={`/assets/${assetId}`} className="text-primary-600 hover:text-primary-700 mb-4 inline-block">
        ← Back to Asset
      </Link>

      <h1 className="text-2xl font-bold text-gray-900 mb-6">Book {asset.name}</h1>

      <div className="grid gap-6">
        {/* Asset Summary */}
        <div className="card p-6">
          <div className="flex gap-4">
            <div className="w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
              {asset.photos?.[0] ? (
                <img src={asset.photos[0].url} alt={asset.name} className="w-full h-full object-cover" />
              ) : (
                <Calendar className="h-8 w-8 text-gray-400" />
              )}
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">{asset.name}</h2>
              <p className="text-sm text-gray-500">{asset.city}, {asset.country}</p>
              <p className="text-lg font-bold text-primary-600 mt-2">
                ${asset.pricing_rules?.[0]?.price || '0'}/{asset.pricing_rules?.[0]?.unit_type?.toLowerCase() || 'hour'}
              </p>
            </div>
          </div>
        </div>

        {/* Booking Form */}
        <form onSubmit={handleSubmit} className="card p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Time <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                name="start_time"
                value={formData.start_time}
                onChange={handleInputChange}
                className={`input ${errors.start_time ? 'border-red-500' : ''}`}
                min={new Date().toISOString().slice(0, 16)}
              />
              {errors.start_time && (
                <p className="text-sm text-red-500 mt-1">{errors.start_time}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Time <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                name="end_time"
                value={formData.end_time}
                onChange={handleInputChange}
                className={`input ${errors.end_time ? 'border-red-500' : ''}`}
                min={formData.start_time || new Date().toISOString().slice(0, 16)}
              />
              {errors.end_time && (
                <p className="text-sm text-red-500 mt-1">{errors.end_time}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Quantity
            </label>
            <input
              type="number"
              name="quantity"
              value={formData.quantity}
              onChange={handleInputChange}
              className={`input w-32 ${errors.quantity ? 'border-red-500' : ''}`}
              min="1"
              max="10"
            />
            {errors.quantity && (
              <p className="text-sm text-red-500 mt-1">{errors.quantity}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes (optional)
            </label>
            <textarea
              name="renter_notes"
              value={formData.renter_notes}
              onChange={handleInputChange}
              className="input"
              rows={3}
              placeholder="Any special requests or notes for the owner..."
            />
          </div>

          {/* Price Estimate */}
          {priceInfo && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-2">Price Estimate</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">
                    ${priceInfo.pricePerUnit} × {priceInfo.hours} hours × {formData.quantity} unit(s)
                  </span>
                  <span>${priceInfo.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg pt-2 border-t">
                  <span>Estimated Total</span>
                  <span className="text-primary-600">${priceInfo.subtotal.toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={bookingLoading}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            {bookingLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Creating Booking...
              </>
            ) : (
              <>
                <Calendar className="h-4 w-4" />
                Create Booking
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
