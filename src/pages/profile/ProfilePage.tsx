import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../app/store';
import { fetchCurrentUser, updateProfile } from '../../features/auth/authSlice';
import { User, Mail, Phone, Camera, Save } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const dispatch = useDispatch<AppDispatch>();
  const { user, isLoading } = useSelector((state: RootState) => state.auth);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    bio: '',
    avatar: null as File | null,
  });
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setFetchError(null);
        await dispatch(fetchCurrentUser()).unwrap();
      } catch (error) {
        // Don't log out - just show error state
        setFetchError('Failed to load profile. Please try again.');
      }
    };
    fetchUser();
  }, [dispatch]);

  useEffect(() => {
    if (user) {
      setFormData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        phone: user.profile?.phone || '',
        bio: user.profile?.bio || '',
        avatar: null,
      });
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await dispatch(updateProfile(formData)).unwrap();
      toast.success('Profile updated successfully');
      setIsEditing(false);
    } catch (error) {
      toast.error('Failed to update profile');
    }
  };

  if (isLoading || (!user && !fetchError)) {
    return <div className="animate-pulse card p-8 h-96" />;
  }

  if (fetchError && !user) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="card p-8 text-center">
          <p className="text-red-600 mb-4">{fetchError}</p>
          <button
            onClick={() => window.location.reload()}
            className="btn-primary"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="card p-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className={isEditing ? 'btn-secondary' : 'btn-primary'}
          >
            {isEditing ? 'Cancel' : 'Edit Profile'}
          </button>
        </div>

        <div className="flex items-center gap-6 mb-8">
          <div className="relative">
            <div className="w-24 h-24 bg-gray-200 rounded-full overflow-hidden">
              {user?.profile?.avatar ? (
                <img src={user.profile.avatar} alt={user.first_name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-primary-100">
                  <User className="h-12 w-12 text-primary-600" />
                </div>
              )}
            </div>
            {isEditing && (
              <button className="absolute bottom-0 right-0 p-2 bg-primary-600 text-white rounded-full">
                <Camera className="h-4 w-4" />
              </button>
            )}
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {user?.first_name} {user?.last_name}
            </h2>
            <p className="text-gray-500">@{user?.email?.split('@')[0]}</p>
            <div className="flex items-center gap-2 mt-2">
              <span className={`badge ${user?.is_email_verified ? 'badge-success' : 'badge-warning'}`}>
                {user?.is_email_verified ? 'Verified' : 'Unverified'}
              </span>
              <span className={`badge ${user?.is_identity_verified ? 'badge-success' : 'badge-warning'}`}>
                {user?.is_identity_verified ? 'Identity Verified' : 'Unverified'}
              </span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
              <div className="relative">
                <User className="h-5 w-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  disabled={!isEditing}
                  className="input pl-10"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
              <div className="relative">
                <User className="h-5 w-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  disabled={!isEditing}
                  className="input pl-10"
                />
              </div>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <div className="relative">
              <Mail className="h-5 w-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className="input pl-10 bg-gray-50"
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <div className="relative">
              <Phone className="h-5 w-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                disabled={!isEditing}
                className="input pl-10"
              />
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
            <textarea
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              disabled={!isEditing}
              rows={4}
              className="input"
              placeholder="Tell us about yourself..."
            />
          </div>

          {isEditing && (
            <button type="submit" className="btn-primary w-full">
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </button>
          )}
        </form>
      </div>
    </div>
  );
}
