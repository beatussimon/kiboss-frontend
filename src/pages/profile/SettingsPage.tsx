import { useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../app/store';
import { Settings, Bell, Lock, Shield, Eye, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const { user } = useSelector((state: RootState) => state.auth);
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    sms: false,
    marketing: false,
  });

  const handleToggle = (key: keyof typeof notifications) => {
    setNotifications(prev => ({ ...prev, [key]: !prev[key] }));
    toast.success('Preference updated');
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-primary-100 rounded-xl">
          <Settings className="h-6 w-6 text-primary-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Account Settings</h1>
          <p className="text-gray-500">Manage your account preferences and security</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Sidebar */}
        <div className="space-y-1">
          <button className="w-full flex items-center gap-3 px-4 py-2 text-sm font-medium text-primary-700 bg-primary-50 rounded-lg">
            <Bell className="h-4 w-4" />
            Notifications
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-lg">
            <Lock className="h-4 w-4" />
            Security
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-lg">
            <Shield className="h-4 w-4" />
            Privacy
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg">
            <Trash2 className="h-4 w-4" />
            Delete Account
          </button>
        </div>

        {/* Content */}
        <div className="md:col-span-2 space-y-6">
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Notification Preferences</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">Email Notifications</p>
                  <p className="text-sm text-gray-500">Receive booking updates via email</p>
                </div>
                <button 
                  onClick={() => handleToggle('email')}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${notifications.email ? 'bg-primary-600' : 'bg-gray-200'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${notifications.email ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">Push Notifications</p>
                  <p className="text-sm text-gray-500">Receive real-time alerts on your device</p>
                </div>
                <button 
                  onClick={() => handleToggle('push')}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${notifications.push ? 'bg-primary-600' : 'bg-gray-200'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${notifications.push ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">SMS Notifications</p>
                  <p className="text-sm text-gray-500">Important alerts via text message</p>
                </div>
                <button 
                  onClick={() => handleToggle('sms')}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${notifications.sms ? 'bg-primary-600' : 'bg-gray-200'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${notifications.sms ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Security</h2>
            <button className="btn-secondary w-full justify-center">
              Change Password
            </button>
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-100 rounded-lg flex gap-3">
              <Shield className="h-5 w-5 text-yellow-600 flex-shrink-0" />
              <p className="text-sm text-yellow-700">
                Two-factor authentication is not enabled. Enable it to add an extra layer of security to your account.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
