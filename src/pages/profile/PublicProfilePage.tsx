import { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../app/store';
import { fetchPublicProfile, followUser, unfollowUser } from '../../features/social/socialSlice';
import { getMediaUrl } from '../../utils/media';
import { User, MapPin, Calendar, Star, MessageCircle, Edit } from 'lucide-react';
import { useState } from 'react';
import { PublicUser } from '../../types';
import VerificationBadge from '../../components/ui/VerificationBadge';

export default function PublicProfilePage() {
  const { userId } = useParams<{ userId: string }>();
  const dispatch = useDispatch<AppDispatch>();
  const { publicProfile: user, isLoading } = useSelector((state: RootState) => state.social);
  const { isAuthenticated, user: currentUser } = useSelector((state: RootState) => state.auth);
  const [activeTab, setActiveTab] = useState<'listings' | 'rides' | 'reviews'>('listings');

  // Check if viewing own profile
  const isOwnProfile = isAuthenticated && currentUser?.id === userId;

  useEffect(() => {
    if (userId) {
      dispatch(fetchPublicProfile(userId));
    }
  }, [dispatch, userId]);

  const handleFollow = async () => {
    if (!userId) return;
    if (user?.is_following) {
      await dispatch(unfollowUser(userId));
    } else {
      await dispatch(followUser(userId));
    }
  };

  if (isLoading || !user) {
    return <div className="animate-pulse card p-8 h-96" />;
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="card p-8 mb-6">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="w-32 h-32 bg-gray-200 rounded-full overflow-hidden flex-shrink-0">
            {user.avatar ? (
              <img src={getMediaUrl(user.avatar)} alt={user.first_name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-primary-100">
                <User className="h-16 w-16 text-primary-600" />
              </div>
            )}
          </div>
          
          <div className="flex-1">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  {user.first_name} {user.last_name}
                  <VerificationBadge 
                    tier={user.verification_badge?.tier} 
                    color={user.verification_badge?.color} 
                  />
                </h1>
                <p className="text-gray-500">@{user.username || user.email?.split('@')[0]}</p>
              </div>
              <div className="flex gap-2">
                {isOwnProfile ? (
                  <Link to="/profile" className="btn-primary">
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Profile
                  </Link>
                ) : (
                  <button
                    onClick={handleFollow}
                    className={user.is_following ? 'btn-secondary' : 'btn-primary'}
                  >
                    {user.is_following ? 'Following' : 'Follow'}
                  </button>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-4 mt-4 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                {user.location || 'Location not set'}
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                Joined {new Date(user.date_joined).toLocaleDateString()}
              </div>
              {user.rating > 0 && (
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                  {user.rating.toFixed(1)} ({user.review_count} reviews)
                </div>
              )}
            </div>

            {user.bio && (
              <p className="mt-4 text-gray-700">{user.bio}</p>
            )}
          </div>
        </div>
      </div>

      {/* Own Profile Notice */}
      {isOwnProfile && (
        <div className="card p-4 mb-6 bg-blue-50 border-blue-200">
          <p className="text-blue-800">
            This is your public profile. Others will see this when they view your page.
          </p>
        </div>
      )}

      <div className="card">
        <div className="border-b">
          <nav className="flex">
            {['listings', 'rides', 'reviews'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as typeof activeTab)}
                className={`px-6 py-4 text-sm font-medium capitalize ${
                  activeTab === tab
                    ? 'border-b-2 border-primary-600 text-primary-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'listings' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {user.listings?.length > 0 ? (
                user.listings.map((listing) => (
                  <Link 
                    key={listing.id} 
                    to={`/assets/${listing.id}`}
                    className="card overflow-hidden hover:shadow-md transition-shadow"
                  >
                    <div className="h-40 bg-gray-200" />
                    <div className="p-4">
                      <h3 className="font-semibold">{listing.title}</h3>
                      <p className="text-sm text-gray-500">{listing.type}</p>
                      <p className="text-primary-600 font-bold mt-2">${listing.price}/day</p>
                    </div>
                  </Link>
                ))
              ) : (
                <p className="text-gray-500 col-span-3 text-center py-8">No listings yet</p>
              )}
            </div>
          )}

          {activeTab === 'rides' && (
            <div className="space-y-4">
              {user.rides?.length > 0 ? (
                user.rides.map((ride) => (
                  <Link 
                    key={ride.id} 
                    to={`/rides/${ride.id}`}
                    className="card p-4 hover:shadow-md transition-shadow block"
                  >
                    <div className="flex justify-between">
                      <div>
                        <p className="font-medium">{ride.origin} → {ride.destination}</p>
                        <p className="text-sm text-gray-500">
                          {new Date(ride.departure_time).toLocaleString()}
                        </p>
                      </div>
                      <p className="text-primary-600 font-bold">${ride.price}/seat</p>
                    </div>
                  </Link>
                ))
              ) : (
                <p className="text-gray-500 text-center py-8">No rides yet</p>
              )}
            </div>
          )}

          {activeTab === 'reviews' && (
            <div className="space-y-4">
              {user.reviews?.length > 0 ? (
                user.reviews.map((review) => (
                  <div key={review.id} className="card p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`h-4 w-4 ${
                              star <= review.rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-sm text-gray-500">
                        {review.reviewer.first_name}
                      </span>
                    </div>
                    <p className="text-gray-700">{review.comment}</p>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-8">No reviews yet</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
