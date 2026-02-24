import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../app/store';
import { createAsset } from '../../features/assets/assetsSlice';
import toast from 'react-hot-toast';
import { Asset, AssetType } from '../../types';
import ImageUpload from '../../components/upload/ImageUpload';
import { Upload, Loader2, Building2, MapPin, Info, AlertCircle } from 'lucide-react';
import api from '../../services/api';
import { CountrySelect } from '../../components/common/CountrySelect';

export default function CreateAssetPage() {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useSelector((state: RootState) => state.auth);

  const queryParams = new URLSearchParams(location.search);
  const parentId = queryParams.get('parent');
  const mode = queryParams.get('mode'); // 'business' (parent) or 'service' (child)

  const isBusinessTier = user?.verification_tier === 'business';

  const [isLoading, setIsLoading] = useState(false);
  const [images, setImages] = useState<File[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    asset_type: (mode === 'business' ? 'HOTEL' : parentId ? 'HOTEL_ROOM' : 'ROOM') as AssetType,
    address: '',
    city: '',
    country: 'Tanzania',
    currency: 'TZS',
    is_listed: true,
    parent: parentId || null,
    pricing_rules: [{ name: 'Standard Rate', unit_type: 'HOUR', price: '1000', min_duration_minutes: 60, priority: 0 }],
    properties: {
      guests: 2,
      bedrooms: 1,
      beds: 1,
      baths: 1,
      check_in_after: '14:00',
      check_out_before: '11:00',
      amenities: [] as string[],
    }
  });

  useEffect(() => {
    if (mode === 'business') {
      setFormData(prev => ({ ...prev, asset_type: 'HOTEL' }));
    } else if (parentId) {
      setFormData(prev => ({ ...prev, asset_type: 'HOTEL_ROOM' }));
    }
  }, [mode, parentId]);

  const uploadImages = async (assetId: string, files: File[]) => {
    if (files.length === 0) return;

    const formData = new FormData();
    files.forEach((file, index) => {
      formData.append('images', file);
      if (index === 0) {
        formData.append('is_primary', 'true');
      }
    });

    try {
      // Allow the browser to set Content-Type with the correct boundary for FormData
      await api.post(`/assets/${assetId}/upload_photos/`, formData);
    } catch (error) {
      console.error('Failed to upload images:', error);
      toast.error('Asset created but image upload failed');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const payload = {
        ...formData,
        pricing_rules: formData.pricing_rules.map(rule => ({
          ...rule,
          price: rule.price
        }))
      };

      const result = await dispatch(createAsset(payload as any));
      if (createAsset.fulfilled.match(result)) {
        const assetId = result.payload.id;

        // Upload images if any
        if (images.length > 0) {
          await uploadImages(assetId, images);
        }

        toast.success('Asset created successfully!');
        navigate(`/assets/${assetId}`);
      } else {
        // Extract and show specific error message from the payload
        const errorMsg = result.payload as string;
        toast.error(errorMsg || 'Failed to create asset');
      }
    } catch (error: any) {
      console.error('Asset creation error:', error);
      toast.error('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto pb-20">
      <h1 className="text-3xl font-black text-gray-900 mb-2 tracking-tighter uppercase">List Your Asset</h1>
      <p className="text-gray-500 font-medium mb-8">Share your resources with the KIBOSS community.</p>

      {isBusinessTier && (
        <div className="bg-indigo-50 border-2 border-indigo-100 rounded-3xl p-6 mb-8 flex gap-4 shadow-sm shadow-indigo-100/50">
          <div className="h-12 w-12 bg-white rounded-2xl flex items-center justify-center shadow-sm flex-shrink-0">
            <Building2 className="h-6 w-6 text-indigo-600" />
          </div>
          <div>
            <p className="text-sm font-black text-indigo-900 uppercase tracking-tight mb-1">Business Listing Policy</p>
            <p className="text-xs font-medium text-indigo-800 leading-relaxed">
              As a verified business, all your assets (Hotels, Restaurants, and Services) must undergo manual verification by our operations team before they appear in public search results.
            </p>
          </div>
        </div>
      )}

      {user?.corporate_profile?.verification_status === 'REJECTED' && (
        <div className="bg-red-50 border-2 border-red-100 rounded-3xl p-6 mb-8 flex gap-4 shadow-sm shadow-red-100/50">
          <div className="h-12 w-12 bg-white rounded-2xl flex items-center justify-center shadow-sm flex-shrink-0">
            <AlertCircle className="h-6 w-6 text-red-600" />
          </div>
          <div>
            <p className="text-sm font-black text-red-900 uppercase tracking-tight mb-1">Corporate Account Rejected</p>
            <p className="text-xs font-medium text-red-800 leading-relaxed">
              Your business application was rejected by compliance. You cannot list new corporate properties until your business account is in good standing. Please return to the Business Dashboard to appeal or update your documents.
            </p>
            <div className="mt-4">
              <button
                onClick={() => navigate('/business/dashboard')}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-black uppercase tracking-widest rounded-xl transition-colors"
              >
                Go to Business Dashboard
              </button>
            </div>
          </div>
        </div>
      )}

      {user?.corporate_profile?.verification_status !== 'REJECTED' && (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Images Section */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Images
            </h2>
            <p className="text-sm text-gray-500 mb-4">
              Add up to 5 images. The first image will be used as the primary image.
            </p>
            <ImageUpload
              images={images}
              onChange={setImages}
              maxImages={5}
              maxSizeMB={5}
            />
          </div>

          {/* Basic Information */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold mb-4">Basic Information</h2>
            <div className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Asset Name</label>
                <input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input"
                  placeholder="e.g., Modern Downtown Apartment"
                  required
                />
              </div>
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="input"
                  rows={4}
                  placeholder="Describe your asset..."
                  required
                />
              </div>
              <div>
                <label htmlFor="asset_type" className="block text-sm font-medium text-gray-700 mb-1">Asset Type</label>
                <select
                  id="asset_type"
                  value={formData.asset_type}
                  onChange={(e) => setFormData({ ...formData, asset_type: e.target.value as AssetType })}
                  className="input"
                >
                  <optgroup label="Individuals">
                    <option value="ROOM">Individual Room/Space</option>
                    <option value="TOOL">Tool/Equipment</option>
                    <option value="VEHICLE">Vehicle</option>
                    <option value="SEAT_SERVICE">Seat Service</option>
                    <option value="TIME_SERVICE">Time Service</option>
                  </optgroup>
                  <optgroup label="Corporate Properties">
                    <option value="HOTEL">Hotel Property</option>
                    <option value="RESTAURANT">Restaurant Property</option>
                  </optgroup>
                  <optgroup label="Corporate Services">
                    <option value="HOTEL_ROOM" disabled={!formData.parent}>Hotel Room</option>
                    <option value="CONFERENCE_HALL" disabled={!formData.parent}>Conference Hall</option>
                    <option value="DINING_TABLE" disabled={!formData.parent}>Dining Table</option>
                  </optgroup>
                </select>
              </div>

              {formData.parent && (
                <div className="p-4 bg-primary-50 rounded-2xl border border-primary-100 flex gap-3">
                  <Info className="h-5 w-5 text-primary-600 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-primary-900 uppercase">Service Context</p>
                    <p className="text-[11px] text-primary-700 font-medium leading-relaxed">
                      This service will be automatically linked to your parent property. Verification status will be inherited.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Room / Hall Specific Features */}
          {(formData.asset_type === 'ROOM' || formData.asset_type === 'HOTEL_ROOM' || formData.asset_type === 'CONFERENCE_HALL') && (
            <div className="card p-6">
              <h2 className="text-lg font-semibold mb-4">{formData.asset_type === 'CONFERENCE_HALL' ? 'Venue Capacity' : 'Stay Details'}</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max Guests</label>
                  <input
                    type="number"
                    value={formData.properties.guests}
                    onChange={(e) => setFormData({
                      ...formData,
                      properties: { ...formData.properties, guests: parseInt(e.target.value) || 1 }
                    })}
                    className="input"
                    min="1"
                  />
                </div>
                {formData.asset_type !== 'CONFERENCE_HALL' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Bedrooms</label>
                      <input
                        type="number"
                        value={formData.properties.bedrooms}
                        onChange={(e) => setFormData({
                          ...formData,
                          properties: { ...formData.properties, bedrooms: parseInt(e.target.value) || 1 }
                        })}
                        className="input"
                        min="1"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Beds</label>
                      <input
                        type="number"
                        value={formData.properties.beds}
                        onChange={(e) => setFormData({
                          ...formData,
                          properties: { ...formData.properties, beds: parseInt(e.target.value) || 1 }
                        })}
                        className="input"
                        min="1"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Baths</label>
                      <input
                        type="number"
                        value={formData.properties.baths}
                        onChange={(e) => setFormData({
                          ...formData,
                          properties: { ...formData.properties, baths: parseInt(e.target.value) || 1 }
                        })}
                        className="input"
                        min="1"
                      />
                    </div>
                  </>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Available From</label>
                  <input
                    type="time"
                    value={formData.properties.check_in_after}
                    onChange={(e) => setFormData({
                      ...formData,
                      properties: { ...formData.properties, check_in_after: e.target.value }
                    })}
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Available Until</label>
                  <input
                    type="time"
                    value={formData.properties.check_out_before}
                    onChange={(e) => setFormData({
                      ...formData,
                      properties: { ...formData.properties, check_out_before: e.target.value }
                    })}
                    className="input"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Restaurant Specific Features */}
          {formData.asset_type === 'DINING_TABLE' && (
            <div className="card p-6">
              <h2 className="text-lg font-semibold mb-4">Dining Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Seating Capacity</label>
                  <input
                    type="number"
                    value={formData.properties.guests}
                    onChange={(e) => setFormData({
                      ...formData,
                      properties: { ...formData.properties, guests: parseInt(e.target.value) || 1 }
                    })}
                    className="input"
                    min="1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Table Number/Location</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="e.g., Table 5, Terrace"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Location */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold mb-4">Location</h2>
            <div className="space-y-4">
              <div>
                <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <input
                  id="address"
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="input"
                  placeholder="123 Main St"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">City</label>
                  <input
                    id="city"
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="input"
                    placeholder="New York"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                  <CountrySelect
                    id="country"
                    name="country"
                    value={formData.country}
                    onChange={(country) => setFormData({ ...formData, country })}
                    className="input"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold mb-4">Pricing</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold">
                      {(formData as any).currency === 'USD' ? '$' :
                        (formData as any).currency === 'EUR' ? '€' :
                          (formData as any).currency === 'CNY' ? '¥' : 'TSh'}
                    </span>
                    <input
                      type="number"
                      value={formData.pricing_rules[0].price}
                      onChange={(e) => setFormData({
                        ...formData,
                        pricing_rules: [{ ...formData.pricing_rules[0], price: e.target.value }]
                      })}
                      className="input pl-12"
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                  <select
                    value={(formData as any).currency || 'TZS'}
                    onChange={(e) => setFormData({
                      ...formData,
                      currency: e.target.value
                    } as any)}
                    className="input"
                  >
                    <option value="TZS">TZS (Tanzanian Shilling)</option>
                    <option value="KES">KES (Kenyan Shilling)</option>
                    <option value="USD">USD (US Dollar)</option>
                    <option value="EUR">EUR (Euro)</option>
                    <option value="CNY">CNY (Chinese Yuan)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Unit Type</label>
                  <select
                    value={formData.pricing_rules[0].unit_type}
                    onChange={(e) => setFormData({
                      ...formData,
                      pricing_rules: [{ ...formData.pricing_rules[0], unit_type: e.target.value }]
                    })}
                    className="input"
                  >
                    <option value="HOUR">Per Hour</option>
                    <option value="DAY">Per Day</option>
                    <option value="WEEK">Per Week</option>
                    <option value="MONTH">Per Month</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Duration (minutes)</label>
                <input
                  type="number"
                  value={formData.pricing_rules[0].min_duration_minutes}
                  onChange={(e) => setFormData({
                    ...formData,
                    pricing_rules: [{ ...formData.pricing_rules[0], min_duration_minutes: parseInt(e.target.value) || 0 }]
                  })}
                  className="input"
                  min="0"
                  step="15"
                />
              </div>
            </div>
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
                'Create Asset'
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
