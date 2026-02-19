import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '../../app/store';
import { createAsset } from '../../features/assets/assetsSlice';
import toast from 'react-hot-toast';
import { Asset, AssetType } from '../../types';
import ImageUpload from '../../components/upload/ImageUpload';
import { Upload, Loader2 } from 'lucide-react';
import api from '../../services/api';

export default function CreateAssetPage() {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [images, setImages] = useState<File[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    asset_type: 'ROOM' as AssetType,
    address: '',
    city: '',
    country: '',
    currency: 'TZS',
    is_listed: true,
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
      await api.post(`/assets/${assetId}/images/`, formData, {
        headers: {
          'Content-Type': null as unknown as string,
        },
      });
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
        toast.error('Failed to create asset');
      }
    } catch {
      toast.error('An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">List Your Asset</h1>
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
                <option value="ROOM">Room</option>
                <option value="TOOL">Tool</option>
                <option value="VEHICLE">Vehicle</option>
                <option value="SEAT_SERVICE">Seat Service</option>
                <option value="TIME_SERVICE">Time Service</option>
              </select>
            </div>
          </div>
        </div>

        {/* Room Specific Features */}
        {formData.asset_type === 'ROOM' && (
          <div className="card p-6">
            <h2 className="text-lg font-semibold mb-4">Stay Details</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Guests</label>
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
            </div>
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Check-in After</label>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Check-out Before</label>
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
                <select
                  id="country"
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  className="input"
                  required
                >
                  <option value="">Select Country</option>
                  <option value="US">United States</option>
                  <option value="CA">Canada</option>
                  <option value="GB">United Kingdom</option>
                  <option value="AU">Australia</option>
                  <option value="DE">Germany</option>
                  <option value="FR">France</option>
                </select>
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
    </div>
  );
}
