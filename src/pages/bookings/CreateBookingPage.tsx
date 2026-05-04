import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../app/store';
import { createBooking } from '../../features/bookings/bookingsSlice';
import { fetchAsset } from '../../features/assets/assetsSlice';
import { getMediaUrl } from '../../utils/media';
import { Calendar, Clock, AlertCircle, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { Price } from '../../context/CurrencyContext';

export default function CreateBookingPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { currentAsset: asset, isLoading: assetLoading } = useSelector((state: RootState) => state.assets);
  const { isLoading: bookingLoading } = useSelector((state: RootState) => state.bookings);
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);

  const assetId = searchParams.get('asset_id');

  const prefillCheckIn = searchParams.get('check_in');
  const prefillCheckOut = searchParams.get('check_out');
  const prefillStart = searchParams.get('start_time') || (prefillCheckIn ? `${prefillCheckIn}T14:00` : '');
  const prefillEnd = searchParams.get('end_time') || (prefillCheckOut ? `${prefillCheckOut}T11:00` : '');
  const prefillGuests = searchParams.get('guests') ? Number(searchParams.get('guests')) : 1;

  const [formData, setFormData] = useState({
    start_time: prefillStart,
    end_time: prefillEnd,
    quantity: prefillGuests,
    renter_notes: '',
    driver_license_number: '',
    driving_experience_years: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [availabilityError, setAvailabilityError] = useState<string | null>(null);
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);
  const [agreesToTerms, setAgreesToTerms] = useState(false);
  const [priceInfo, setPriceInfo] = useState<any>(null);
  const [isCalculatingPrice, setIsCalculatingPrice] = useState(false);

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

    if (asset?.asset_type === 'VEHICLE') {
      if (!formData.driver_license_number) {
        newErrors.driver_license_number = "Driver's License Number is required for vehicles";
      }
      if (formData.driving_experience_years === '') {
        newErrors.driving_experience_years = "Driving experience is required for vehicles";
      } else if (parseInt(formData.driving_experience_years as string) < 0) {
        newErrors.driving_experience_years = "Experience cannot be negative";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  useEffect(() => {
    const checkAvailabilityAndPrice = async () => {
      if (!assetId || !formData.start_time || !formData.end_time || formData.quantity < 1) {
        setAvailabilityError(null);
        setPriceInfo(null);
        return;
      }

      const start = new Date(formData.start_time);
      const end = new Date(formData.end_time);
      if (end <= start || start < new Date()) {
        setPriceInfo(null);
        return; 
      }

      setIsCheckingAvailability(true);
      setIsCalculatingPrice(true);
      setAvailabilityError(null);
      try {
        const queryParams = new URLSearchParams({
          asset_id: assetId,
          start_time: new Date(formData.start_time).toISOString(),
          end_time: new Date(formData.end_time).toISOString(),
          quantity: formData.quantity.toString()
        });
        
        // Check availability
        const availRes = await api.get(`/assets/${assetId}/check_availability/?${queryParams.toString()}`);
        if (!availRes.data.is_available) {
          if (availRes.data.conflict_info?.error) {
            setAvailabilityError(availRes.data.conflict_info.error);
          } else {
            setAvailabilityError('Asset is not available for the selected dates and quantity.');
          }
        }
        
        // Calculate price
        const priceRes = await api.get(`/bookings/calculate_price/?${queryParams.toString()}`);
        setPriceInfo(priceRes.data);
      } catch (err: any) {
        console.error('Failed to check availability or price', err);
        setPriceInfo(null);
      } finally {
        setIsCheckingAvailability(false);
        setIsCalculatingPrice(false);
      }
    };

    const timeoutId = setTimeout(checkAvailabilityAndPrice, 500);
    return () => clearTimeout(timeoutId);
  }, [assetId, formData.start_time, formData.end_time, formData.quantity]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm() || !assetId || availabilityError || !agreesToTerms) {
      if (!agreesToTerms) {
        toast.error('You must agree to the terms to proceed.');
      }
      return;
    }

    try {
      const payload: any = {
        asset_id: assetId,
        start_time: new Date(formData.start_time).toISOString(),
        end_time: new Date(formData.end_time).toISOString(),
        quantity: formData.quantity,
        renter_notes: formData.renter_notes,
      };

      if (asset?.asset_type === 'VEHICLE') {
        payload.driver_license_number = formData.driver_license_number;
        payload.driving_experience_years = parseInt(formData.driving_experience_years as string) || 0;
      }

      const result = await dispatch(createBooking(payload)).unwrap();

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

  const isOwner = user?.id === asset?.owner?.id;

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
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Asset Not Found</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-4">The asset you're trying to book doesn't exist or has been removed.</p>
          <Link to="/assets" className="btn-primary">
            Browse Assets
          </Link>
        </div>
      </div>
    );
  }

  if (isOwner) {
    return (
      <div className="max-w-2xl mx-auto">
        <Link to={`/assets/${assetId}`} className="text-primary-600 hover:text-primary-700 mb-4 inline-block">
          ← Back to Asset
        </Link>
        <div className="card p-8 text-center bg-yellow-50 border-yellow-100">
          <AlertCircle className="h-12 w-12 text-yellow-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">This is your asset</h2>
          <p className="text-gray-600 mb-6">You cannot book your own asset. You can manage availability and pricing from the dashboard.</p>
          <Link to="/profile" className="btn-primary">
            Go to Dashboard
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

      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Book {asset.name}</h1>

      <div className="grid gap-6">
        {/* Asset Summary */}
        <div className="card p-6">
          <div className="flex gap-4">
            <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center overflow-hidden">
              {asset.photos?.[0] ? (
                <img src={getMediaUrl(asset.photos[0].url)} alt={asset.name} className="w-full h-full object-cover" />
              ) : (
                <Calendar className="h-8 w-8 text-gray-400" />
              )}
            </div>
            <div>
              <h2 className="font-semibold text-gray-900 dark:text-white">{asset.name}</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">{asset.city}, {asset.country}</p>
              <p className="text-lg font-bold text-primary-600 mt-2">
                ${asset.pricing_rules?.[0]?.price || '0'}/{asset.pricing_rules?.[0]?.unit_type?.toLowerCase() || 'hour'}
              </p>
            </div>
          </div>
        </div>

        {(prefillStart && prefillEnd) && (
          <div className="bg-primary-50 dark:bg-primary-900/20 rounded-xl p-4 mb-6 border border-primary-100 dark:border-primary-800 flex items-start justify-between">
            <div>
              <p className="text-xs font-black text-primary-600 uppercase tracking-widest mb-1">Selected Dates</p>
              <p className="text-sm font-bold text-gray-900 dark:text-white">
                {new Date(prefillStart).toLocaleDateString()} → {new Date(prefillEnd).toLocaleDateString()}
              </p>
            </div>
            <button onClick={(e) => { e.preventDefault(); setFormData(p => ({...p, start_time: '', end_time: ''})); }}
              className="text-xs text-primary-600 font-bold hover:underline">Change</button>
          </div>
        )}

        {/* Booking Form */}
        <form onSubmit={handleSubmit} className="card p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
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
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
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
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
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

          {asset.asset_type === 'VEHICLE' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800">
              <div className="md:col-span-2">
                <h3 className="font-bold text-gray-900 dark:text-white mb-1">Driver Qualifications</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">Please provide your driver's license details to rent this vehicle.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                  Driver's License Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="driver_license_number"
                  value={formData.driver_license_number}
                  onChange={handleInputChange}
                  className={`input ${errors.driver_license_number ? 'border-red-500' : ''}`}
                  placeholder="e.g. DL-12345678"
                />
                {errors.driver_license_number && (
                  <p className="text-sm text-red-500 mt-1">{errors.driver_license_number}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                  Driving Experience (Years) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="driving_experience_years"
                  value={formData.driving_experience_years}
                  onChange={handleInputChange}
                  className={`input ${errors.driving_experience_years ? 'border-red-500' : ''}`}
                  min="0"
                />
                {errors.driving_experience_years && (
                  <p className="text-sm text-red-500 mt-1">{errors.driving_experience_years}</p>
                )}
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
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
          {isCalculatingPrice ? (
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 animate-pulse flex items-center justify-center h-24">
              <Loader2 className="h-6 w-6 text-primary-400 animate-spin" />
            </div>
          ) : priceInfo && (
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 dark:text-white mb-2">Price Estimate</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Base Price</span>
                  <span><Price amount={priceInfo.base_price} from={priceInfo.currency} /></span>
                </div>
                {Number(priceInfo.service_fee) > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Service Fee</span>
                    <span><Price amount={priceInfo.service_fee} from={priceInfo.currency} /></span>
                  </div>
                )}
                {Number(priceInfo.taxes) > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Taxes ({(priceInfo.tax_rate * 100).toFixed(1)}%)</span>
                    <span><Price amount={priceInfo.taxes} from={priceInfo.currency} /></span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-lg pt-2 border-t">
                  <span>Estimated Total</span>
                  <span className="text-primary-600"><Price amount={priceInfo.total} from={priceInfo.currency} /></span>
                </div>
              </div>
            </div>
          )}

          <div className="pt-4 border-t border-gray-100 mt-6">
            <div className="mb-6 flex flex-col gap-2">
              <label className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-900 border-2 rounded-xl border-gray-100 hover:border-gray-200 cursor-pointer transition-all">
                <input
                  type="checkbox"
                  checked={agreesToTerms}
                  onChange={(e) => setAgreesToTerms(e.target.checked)}
                  className="mt-1 w-4 h-4 text-primary-600 rounded focus:ring-primary-500 cursor-pointer border-2 border-gray-300"
                />
                <span className="text-sm text-gray-700 dark:text-gray-200">
                  I agree to the <Link to="/terms" target="_blank" className="text-primary-600 font-medium hover:underline">Standard Terms and Conditions</Link>, including the cancellation and late return policies for this asset. A digital contract will be generated upon booking.
                </span>
              </label>
            </div>

            {availabilityError && (
              <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm flex items-start gap-2 border border-red-100 shadow-sm">
                <AlertCircle className="h-5 w-5 shrink-0" />
                <span>{availabilityError}</span>
              </div>
            )}
            
            <button
              type="submit"
              disabled={bookingLoading || isCheckingAvailability || isCalculatingPrice || !!availabilityError || !agreesToTerms}
              className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {bookingLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating Booking...
                </>
              ) : isCheckingAvailability || isCalculatingPrice ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Checking Details...
                </>
              ) : (
                <>
                  <Calendar className="h-4 w-4" />
                  Create Booking
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
