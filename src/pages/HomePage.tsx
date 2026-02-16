import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../app/store';
import { fetchAssets } from '../features/assets/assetsSlice';
import { fetchRides } from '../features/rides/ridesSlice';
import { Home, MapPin, Star, ArrowRight, Search, Shield, Clock, CreditCard } from 'lucide-react';

export default function HomePage() {
  const dispatch = useDispatch<AppDispatch>();
  const { assets, isLoading: assetsLoading } = useSelector((state: RootState) => state.assets);
  const { rides, isLoading: ridesLoading } = useSelector((state: RootState) => state.rides);
  const { user } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    dispatch(fetchAssets({ page_size: 6 }));
    dispatch(fetchRides({}));
  }, [dispatch]);

  const features = [
    {
      icon: Shield,
      title: 'Secure Payments',
      description: 'Escrow protection for all transactions',
    },
    {
      icon: Clock,
      title: 'Instant Booking',
      description: 'Real-time availability and confirmation',
    },
    {
      icon: Star,
      title: 'Verified Reviews',
      description: 'Honest ratings from real users',
    },
    {
      icon: CreditCard,
      title: 'Easy Payments',
      description: 'Multiple payment options supported',
    },
  ];

  return (
    <div>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 rounded-2xl overflow-hidden mb-12">
        <div className="absolute inset-0 bg-black/20" />
        <div className="relative px-8 py-16 md:py-24">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              {user ? `Welcome back, ${user.first_name}!` : 'Rent Anything, Go Anywhere'}
            </h1>
            <p className="text-xl text-white/90 mb-8">
              The universal platform for asset rentals and ride-sharing. 
              Discover unique spaces, tools, vehicles, and more.
            </p>
            
            {/* Search Bar */}
            <div className="bg-white rounded-xl p-2 shadow-lg">
              <div className="flex flex-col md:flex-row gap-2">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="What are you looking for?"
                    className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <Link
                  to="/assets"
                  className="btn-primary py-3 px-8"
                >
                  Search
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Actions */}
      <section className="mb-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link
            to="/assets?asset_type=ROOM"
            className="card p-6 hover:shadow-md transition-shadow text-center group"
          >
            <div className="w-12 h-12 mx-auto mb-3 bg-primary-100 rounded-xl flex items-center justify-center group-hover:bg-primary-200 transition-colors">
              <Home className="h-6 w-6 text-primary-600" />
            </div>
            <h3 className="font-semibold text-gray-900">Rent a Space</h3>
            <p className="text-sm text-gray-500 mt-1">Rooms, apartments & more</p>
          </Link>
          
          <Link
            to="/assets?asset_type=VEHICLE"
            className="card p-6 hover:shadow-md transition-shadow text-center group"
          >
            <div className="w-12 h-12 mx-auto mb-3 bg-green-100 rounded-xl flex items-center justify-center group-hover:bg-green-200 transition-colors">
              <MapPin className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="font-semibold text-gray-900">Rent a Vehicle</h3>
            <p className="text-sm text-gray-500 mt-1">Cars, bikes & equipment</p>
          </Link>
          
          <Link
            to="/rides"
            className="card p-6 hover:shadow-md transition-shadow text-center group"
          >
            <div className="w-12 h-12 mx-auto mb-3 bg-blue-100 rounded-xl flex items-center justify-center group-hover:bg-blue-200 transition-colors">
              <ArrowRight className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="font-semibold text-gray-900">Find a Ride</h3>
            <p className="text-sm text-gray-500 mt-1">Carpool & travel together</p>
          </Link>
          
          <Link
            to="/assets/create"
            className="card p-6 hover:shadow-md transition-shadow text-center group"
          >
            <div className="w-12 h-12 mx-auto mb-3 bg-purple-100 rounded-xl flex items-center justify-center group-hover:bg-purple-200 transition-colors">
              <Star className="h-6 w-6 text-purple-600" />
            </div>
            <h3 className="font-semibold text-gray-900">List Your Asset</h3>
            <p className="text-sm text-gray-500 mt-1">Earn money renting out</p>
          </Link>
        </div>
      </section>

      {/* Featured Assets */}
      <section className="mb-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Featured Assets</h2>
          <Link to="/assets" className="text-primary-600 hover:text-primary-700 font-medium flex items-center">
            View all
            <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </div>
        
        {assetsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="card animate-pulse">
                <div className="h-48 bg-gray-200 rounded-t-xl" />
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-4 bg-gray-200 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : (assets && assets.length > 0) ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(assets || []).slice(0, 6).map((asset) => (
              <Link key={asset.id} to={`/assets/${asset.id}`} className="card group hover:shadow-lg transition-shadow">
                <div className="aspect-video relative overflow-hidden rounded-t-xl">
                  {asset.photos?.[0] ? (
                    <img
                      src={asset.photos[0].url}
                      alt={asset.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                      <Home className="h-12 w-12 text-gray-400" />
                    </div>
                  )}
                  <div className="absolute top-3 left-3">
                    <span className="badge-info">
                      {asset.asset_type}
                    </span>
                  </div>
                  {asset.is_verified && (
                    <div className="absolute top-3 right-3">
                      <span className="badge-success">
                        <Shield className="h-3 w-3 mr-1" />
                        Verified
                      </span>
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 group-hover:text-primary-600 transition-colors line-clamp-1">
                    {asset.name}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1 flex items-center">
                    <MapPin className="h-3.5 w-3.5 mr-1" />
                    {asset.city}, {asset.country}
                  </p>
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center space-x-1">
                      <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                      <span className="text-sm font-medium text-gray-900">{asset.average_rating || 'N/A'}</span>
                      <span className="text-sm text-gray-500">({asset.total_reviews || 0})</span>
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-bold text-primary-600">
                        ${asset.pricing_rules?.[0]?.price || '0'}
                      </span>
                      <span className="text-sm text-gray-500">/{asset.pricing_rules?.[0]?.unit_type?.toLowerCase() || 'hr'}</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="card p-12 text-center">
            <Home className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No assets available</h3>
            <p className="text-gray-500 mb-4">Be the first to list an asset!</p>
            <Link to="/assets/create" className="btn-primary">
              List Your Asset
            </Link>
          </div>
        )}
      </section>

      {/* Popular Rides */}
      <section className="mb-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Popular Rides</h2>
          <Link to="/rides" className="text-primary-600 hover:text-primary-700 font-medium flex items-center">
            View all
            <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </div>
        
        {ridesLoading ? (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="card p-4 animate-pulse">
                <div className="flex gap-4">
                  <div className="w-16 h-16 bg-gray-200 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-1/3" />
                    <div className="h-4 bg-gray-200 rounded w-1/2" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (rides && rides.length > 0) ? (
          <div className="space-y-4">
            {(rides || []).slice(0, 5).map((ride) => (
              <Link key={ride.id} to={`/rides/${ride.id}`} className="card p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                    <ArrowRight className="h-8 w-8 text-primary-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{ride.route_name}</h3>
                    <div className="flex items-center text-sm text-gray-500 mt-1">
                      <MapPin className="h-3.5 w-3.5 mr-1" />
                      {ride.origin} → {ride.destination}
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-sm text-gray-500">
                        {new Date(ride.departure_time).toLocaleDateString()}
                      </span>
                      <div className="flex items-center space-x-2">
                        <span className="badge-info">
                          {ride.available_seats} seats left
                        </span>
                        <span className="font-semibold text-primary-600">
                          ${ride.seat_price}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="card p-12 text-center">
            <MapPin className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No rides available</h3>
            <p className="text-gray-500">Check back later for available rides.</p>
          </div>
        )}
      </section>

      {/* Features Section */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">Why Choose KIBOSS?</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {features.map((feature) => (
            <div key={feature.title} className="text-center">
              <div className="w-14 h-14 mx-auto mb-4 bg-primary-100 rounded-xl flex items-center justify-center">
                <feature.icon className="h-7 w-7 text-primary-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">{feature.title}</h3>
              <p className="text-sm text-gray-500">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="card bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl p-8 md:p-12 text-center">
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
          Ready to Start Earning?
        </h2>
        <p className="text-lg text-white/90 mb-6 max-w-2xl mx-auto">
          List your asset or vehicle on KIBOSS and connect with thousands of verified users.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/assets/create"
            className="btn bg-white text-primary-700 hover:bg-gray-100 py-3 px-8"
          >
            List Your Asset
          </Link>
          <Link
            to="/help"
            className="btn border-2 border-white text-white hover:bg-white/10 py-3 px-8"
          >
            Learn More
          </Link>
        </div>
      </section>
    </div>
  );
}
