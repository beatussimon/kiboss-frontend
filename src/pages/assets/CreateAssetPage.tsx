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
  const [formData, setFormData] = useState<{
    name: string;
    description: string;
    asset_type: AssetType;
    address: string;
    city: string;
    country: string;
    pricing_rules: { name: string; unit_type: string; price: string; min_duration_minutes: number; priority: number }[];
  }>({
    name: '',
    description: '',
    asset_type: 'ROOM',
    address: '',
    city: '',
    country: '',
    pricing_rules: [{ name: 'Standard Rate', unit_type: 'HOUR', price: '50.00', min_duration_minutes: 60, priority: 0 }],
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
      await api.post(`/assets/${assetId}/images/`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
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
      const result = await dispatch(createAsset(formData as unknown as Partial<Asset>));
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Asset Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="input"
                placeholder="e.g., Modern Downtown Apartment"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="input"
                rows={4}
                placeholder="Describe your asset..."
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Asset Type</label>
              <select
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

        {/* Location */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold mb-4">Location</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
              <input
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
                <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="input"
                  placeholder="New York"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                <input
                  type="text"
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  className="input"
                  placeholder="USA"
                  required
                />
              </div>
            </div>
          </div>
        </div>

        {/* Pricing */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold mb-4">Pricing</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Price</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                  <input
                    type="number"
                    value={formData.pricing_rules[0].price}
                    onChange={(e) => setFormData({
                      ...formData,
                      pricing_rules: [{ ...formData.pricing_rules[0], price: e.target.value }]
                    })}
                    className="input pl-7"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>
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
