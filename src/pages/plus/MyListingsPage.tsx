import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { RootState } from '../../app/store';
import api from '../../services/api';
import { Briefcase, Car, Calendar, Plus, Star, Users, MapPin, Eye, Zap } from 'lucide-react';
import { Price } from '../../context/CurrencyContext';
import { getMediaUrl } from '../../utils/media';

export default function MyListingsPage() {
  const { user } = useSelector((state: RootState) => state.auth);
  const [activeTab, setActiveTab] = useState<'ASSETS' | 'RIDES'>('ASSETS');
  
  const [assets, setAssets] = useState<any[]>([]);
  const [rides, setRides] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchListings = async () => {
      setIsLoading(true);
      try {
        const [assetsRes, ridesRes] = await Promise.all([
          api.get('/assets/?owner=me'),
          api.get('/rides/?driver=me')
        ]);
        
        setAssets(assetsRes.data.results || []);
        
        // Filter out fully booked rides if status is FULL or available_seats is 0
        const activeRides = (ridesRes.data.results || []).filter((r: any) => 
          r.status !== 'FULL' && r.available_seats > 0
        );
        setRides(activeRides);
      } catch (error) {
        console.error("Failed to fetch listings", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    if (user) fetchListings();
  }, [user]);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Briefcase className="h-6 w-6 text-primary-600" />
            My Listings
          </h1>
          <p className="text-gray-500 mt-1">Manage your available assets and upcoming rides.</p>
        </div>
        <div className="flex gap-2">
          <Link to="/assets/create" className="btn-secondary whitespace-nowrap">
            <Plus className="h-4 w-4 mr-2" /> List Asset
          </Link>
          <Link to="/rides/create" className="btn-primary whitespace-nowrap">
            <Car className="h-4 w-4 mr-2" /> Offer Ride
          </Link>
        </div>
      </div>

      <div className="card p-4">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('ASSETS')}
              className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                activeTab === 'ASSETS'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Briefcase className="h-4 w-4" />
              My Assets
              <span className={`ml-2 py-0.5 px-2.5 rounded-full text-xs font-medium ${
                activeTab === 'ASSETS' ? 'bg-primary-100 text-primary-600' : 'bg-gray-100 text-gray-600'
              }`}>
                {assets.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('RIDES')}
              className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                activeTab === 'RIDES'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Car className="h-4 w-4" />
              Upcoming Rides
              <span className={`ml-2 py-0.5 px-2.5 rounded-full text-xs font-medium ${
                activeTab === 'RIDES' ? 'bg-primary-100 text-primary-600' : 'bg-gray-100 text-gray-600'
              }`}>
                {rides.length}
              </span>
            </button>
          </nav>
        </div>

        <div className="mt-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
            </div>
          ) : activeTab === 'ASSETS' ? (
            assets.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {assets.map((asset) => (
                  <Link key={asset.id} to={`/assets/${asset.id}`} className="group cursor-pointer">
                    <div className="aspect-[4/3] relative rounded-2xl overflow-hidden mb-3">
                      <img
                        src={asset.photos?.[0] ? getMediaUrl(asset.photos[0].url) : "https://images.unsplash.com/photo-1460317442991-0ec209397118"}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        alt={asset.name}
                      />
                      <div className={`absolute top-3 left-3 px-2 py-1 rounded-lg text-[10px] font-bold ${asset.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                        {asset.is_active ? 'ACTIVE' : 'INACTIVE'}
                      </div>
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 leading-tight group-hover:text-primary-600 transition-colors">
                        {asset.name}
                      </h3>
                      <p className="text-sm text-gray-500">{asset.city}, {asset.country}</p>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                       <p className="text-sm">
                        <span className="font-bold"><Price amount={asset.pricing_rules?.[0]?.price || '0'} /></span>
                        <span className="text-gray-500"> / {asset.pricing_rules?.[0]?.unit_type?.toLowerCase() || 'hr'}</span>
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                <Briefcase className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No assets yet</h3>
                <p className="text-gray-500 mb-4">You haven't listed any assets.</p>
                <Link to="/assets/create" className="btn-primary hidden md:inline-flex">
                  List Your First Asset
                </Link>
              </div>
            )
          ) : (
            rides.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {rides.map((ride) => (
                  <div key={ride.id} className="card p-5 border border-gray-200 hover:border-primary-300 transition-colors">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-gray-900 text-lg">{ride.origin}</span>
                          <span className="text-gray-400">→</span>
                          <span className="font-bold text-gray-900 text-lg">{ride.destination}</span>
                        </div>
                        <p className="text-sm text-gray-500 flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {new Date(ride.departure_time).toLocaleString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-lg font-black text-primary-600">
                          <Price amount={ride.seat_price || 0} />
                        </span>
                        <span className="block text-[10px] text-gray-400 font-bold uppercase tracking-wider">/ seat</span>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-2 mb-4">
                      <span className="badge badge-success">
                        <Users className="h-3 w-3 mr-1" />
                        {ride.available_seats} / {ride.total_seats} seats left
                      </span>
                    </div>

                    <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
                       <Link to={`/rides/${ride.id}/manifest`} className="btn-secondary py-1.5 px-3 text-xs">
                        Manifest
                      </Link>
                      <Link to={`/rides/${ride.id}/edit`} className="btn-primary py-1.5 px-3 text-xs">
                        Manage
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                <Car className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No upcoming rides</h3>
                <p className="text-gray-500 mb-4">You are not offering any rides right now.</p>
                <Link to="/rides/create" className="btn-primary inline-flex">
                  Offer a Ride
                </Link>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}
