import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '../../app/store';
import { createAsset } from '../../features/assets/assetsSlice';
import toast from 'react-hot-toast';
import { Asset, AssetType } from '../../types';

export default function CreateAssetPage() {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const result = await dispatch(createAsset(formData as unknown as Partial<Asset>));
      if (createAsset.fulfilled.match(result)) {
        toast.success('Asset created successfully!');
        navigate(`/assets/${result.payload.id}`);
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

        <div className="card p-6">
          <h2 className="text-lg font-semibold mb-4">Pricing</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Price</label>
                <input
                  type="number"
                  value={formData.pricing_rules[0].price}
                  onChange={(e) => setFormData({
                    ...formData,
                    pricing_rules: [{ ...formData.pricing_rules[0], price: e.target.value }]
                  })}
                  className="input"
                  min="0"
                  step="0.01"
                  required
                />
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
          </div>
        </div>

        <div className="flex justify-end gap-4">
          <button type="button" onClick={() => navigate(-1)} className="btn-secondary">
            Cancel
          </button>
          <button type="submit" disabled={isLoading} className="btn-primary">
            {isLoading ? 'Creating...' : 'Create Asset'}
          </button>
        </div>
      </form>
    </div>
  );
}
