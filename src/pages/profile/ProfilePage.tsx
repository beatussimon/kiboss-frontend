import { useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../app/store';
import { fetchCurrentUser, updateProfile } from '../../features/auth/authSlice';
import { User, Mail, Phone, Camera, Save, X, Shield, Award, MapPin, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import VerificationBadge from '../../components/ui/VerificationBadge';

export default function ProfilePage() {
  const dispatch = useDispatch<AppDispatch>();
  const { user, isLoading } = useSelector((state: RootState) => state.auth);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    bio: '',
    city: '',
    country: '',
  });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setFetchError(null);
        await dispatch(fetchCurrentUser()).unwrap();
      } catch (error) {
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
        city: user.profile?.city || '',
        country: user.profile?.country || '',
      });
      if (user.profile?.avatar) {
        setAvatarPreview(user.profile.avatar);
      }
    }
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image must be less than 5MB');
        return;
      }
      
      setAvatarFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveAvatar = () => {
    setAvatarFile(null);
    setAvatarPreview(user?.profile?.avatar || null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const uploadAvatar = async (file: File): Promise<string | null> => {
    try {
      setIsUploading(true);
      const formDataObj = new FormData();
      formDataObj.append('avatar', file);
      
      const response = await api.patch('/users/me/', formDataObj, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      return response.data?.profile?.avatar || null;
    } catch (error) {
      console.error('Failed to upload avatar:', error);
      toast.error('Failed to upload avatar');
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Upload avatar first if changed
      if (avatarFile) {
        const avatarUrl = await uploadAvatar(avatarFile);
        if (avatarUrl) {
          setAvatarPreview(avatarUrl);
        }
      }
      
      // Update profile data
      await dispatch(updateProfile(formData)).unwrap();
      toast.success('Profile updated successfully');
      setIsEditing(false);
      setAvatarFile(null);
    } catch (error) {
      toast.error('Failed to update profile');
    }
  };

  const handleCancel = () => {
    // Reset form data
    if (user) {
      setFormData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        phone: user.profile?.phone || '',
        bio: user.profile?.bio || '',
        city: user.profile?.city || '',
        country: user.profile?.country || '',
      });
      setAvatarPreview(user.profile?.avatar || null);
    }
    setAvatarFile(null);
    setIsEditing(false);
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
          <div className="flex gap-2">
            {isEditing ? (
              <>
                <button
                  onClick={handleCancel}
                  className="btn-secondary"
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  className="btn-primary"
                  disabled={isUploading}
                >
                  <Save className="h-4 w-4 mr-2" />
                  {isUploading ? 'Saving...' : 'Save'}
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="btn-primary"
              >
                Edit Profile
              </button>
            )}
          </div>
        </div>

        {/* Avatar Section */}
        <div className="flex items-center gap-6 mb-8">
          <div className="relative">
            <div className="w-24 h-24 bg-gray-200 rounded-full overflow-hidden">
              {avatarPreview ? (
                <img src={avatarPreview} alt={user?.first_name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-primary-100">
                  <User className="h-12 w-12 text-primary-600" />
                </div>
              )}
            </div>
            {isEditing && (
              <div className="absolute bottom-0 right-0 flex gap-1">
                <button 
                  className="p-2 bg-primary-600 text-white rounded-full hover:bg-primary-700"
                  onClick={() => fileInputRef.current?.click()}
                  type="button"
                >
                  <Camera className="h-4 w-4" />
                </button>
                {avatarFile && (
                  <button 
                    className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600"
                    onClick={handleRemoveAvatar}
                    type="button"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              className="hidden"
            />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {user?.first_name} {user?.last_name}
            </h2>
            <p className="text-gray-500">@{user?.email?.split('@')[0]}</p>
            <div className="flex items-center gap-2 mt-2">
              <VerificationBadge 
                tier={user?.verification_badge?.tier}
                color={user?.verification_badge?.color}
                size="md"
              />
              <span className={`badge ${user?.is_email_verified ? 'badge-success' : 'badge-warning'}`}>
                {user?.is_email_verified ? 'Email Verified' : 'Email Unverified'}
              </span>
              {user?.is_identity_verified && (
                <span className="badge badge-success">
                  <Shield className="h-3 w-3 mr-1" />
                  Identity Verified
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Trust Score */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Award className="h-5 w-5 text-primary-600" />
              <span className="font-medium text-gray-900">Trust Score</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-primary-600">{user?.trust_score || '50.00'}</span>
              <span className="text-sm text-gray-500">({user?.total_ratings_count || 0} ratings)</span>
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
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleInputChange}
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
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleInputChange}
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
            <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <div className="relative">
              <Phone className="h-5 w-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                disabled={!isEditing}
                className="input pl-10"
                placeholder="+254 7XX XXX XXX"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
              <div className="relative">
                <MapPin className="h-5 w-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className="input pl-10"
                  placeholder="Nairobi"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
              <div className="relative">
                <MapPin className="h-5 w-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  name="country"
                  value={formData.country}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className="input pl-10"
                  placeholder="Kenya"
                />
              </div>
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
            <div className="relative">
              <FileText className="h-5 w-5 absolute left-3 top-3 text-gray-400" />
              <textarea
                name="bio"
                value={formData.bio}
                onChange={handleInputChange}
                disabled={!isEditing}
                rows={4}
                className="input pl-10"
                placeholder="Tell us about yourself..."
              />
            </div>
          </div>

          {isEditing && (
            <div className="flex gap-3">
              <button type="submit" className="btn-primary flex-1" disabled={isUploading}>
                <Save className="h-4 w-4 mr-2" />
                {isUploading ? 'Saving...' : 'Save Changes'}
              </button>
              <button type="button" onClick={handleCancel} className="btn-secondary">
                Cancel
              </button>
            </div>
          )}
        </form>
      </div>

      {/* Verification Section */}
      <div className="card p-6 mt-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Verification</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <Mail className={`h-5 w-5 ${user?.is_email_verified ? 'text-green-500' : 'text-gray-400'}`} />
              <div>
                <p className="font-medium">Email Verification</p>
                <p className="text-sm text-gray-500">{user?.email}</p>
              </div>
            </div>
            <span className={`badge ${user?.is_email_verified ? 'badge-success' : 'badge-warning'}`}>
              {user?.is_email_verified ? 'Verified' : 'Pending'}
            </span>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <Phone className={`h-5 w-5 ${user?.is_phone_verified ? 'text-green-500' : 'text-gray-400'}`} />
              <div>
                <p className="font-medium">Phone Verification</p>
                <p className="text-sm text-gray-500">{user?.profile?.phone || 'Not provided'}</p>
              </div>
            </div>
            <span className={`badge ${user?.is_phone_verified ? 'badge-success' : 'badge-warning'}`}>
              {user?.is_phone_verified ? 'Verified' : 'Pending'}
            </span>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <Shield className={`h-5 w-5 ${user?.is_identity_verified ? 'text-green-500' : 'text-gray-400'}`} />
              <div>
                <p className="font-medium">Identity Verification</p>
                <p className="text-sm text-gray-500">Government ID verification</p>
              </div>
            </div>
            <span className={`badge ${user?.is_identity_verified ? 'badge-success' : 'badge-warning'}`}>
              {user?.is_identity_verified ? 'Verified' : 'Pending'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
