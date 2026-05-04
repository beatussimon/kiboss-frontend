import { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';
import { RootState, AppDispatch } from '../../app/store';
import { 
  Settings, Bell, Lock, Shield, Eye, Trash2, Moon, Sun, Laptop, 
  LogOut, User, ChevronRight, AlertCircle, ShieldCheck, Key
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useTheme } from '../../context/ThemeContext';
import api from '../../services/api';
import { logout } from '../../features/auth/authSlice';
import { ConfirmModal } from '../../components/ui/ConfirmModal';

export default function SettingsPage() {
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);
  const { theme, setTheme } = useTheme();
  
  const [activeSection, setActiveSection] = useState<'notifications' | 'security' | 'appearance' | 'account'>('notifications');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  const [notifications, setNotifications] = useState({
    email: (user as any)?.preferences?.email ?? true,
    push: (user as any)?.preferences?.push ?? true,
    sms: (user as any)?.preferences?.sms ?? false,
    marketing: (user as any)?.preferences?.marketing ?? false,
  });

  const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' });

  const handleToggle = async (key: keyof typeof notifications) => {
    const newValue = !notifications[key];
    setNotifications(prev => ({ ...prev, [key]: newValue }));
    try {
      await api.patch('/users/me/', {
        preferences: {
          ...(user as any)?.preferences,
          [key]: newValue
        }
      });
      toast.success('Preference updated');
    } catch (err) {
      setNotifications(prev => ({ ...prev, [key]: !newValue }));
      toast.error('Failed to sync preference');
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pwForm.next !== pwForm.confirm) {
      toast.error('Passwords do not match');
      return;
    }
    setIsProcessing(true);
    try {
      await api.post('/users/change-password/', {
        current_password: pwForm.current,
        new_password: pwForm.next
      });
      toast.success('Password changed successfully');
      setPwForm({ current: '', next: '', confirm: '' });
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to change password');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleLogout = () => {
    dispatch(logout());
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') {
      toast.error('Please type DELETE to confirm');
      return;
    }
    setIsProcessing(true);
    try {
      await api.delete('/users/me/');
      toast.success('Account deleted');
      dispatch(logout());
    } catch (err) {
      toast.error('Failed to delete account');
    } finally {
      setIsProcessing(false);
    }
  };

  const sidebarItems = [
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Lock },
    { id: 'appearance', label: 'Appearance', icon: Moon },
    { id: 'account', label: 'Account', icon: User },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-10">
        <div className="p-3.5 bg-primary-100 dark:bg-primary-900/30 rounded-2xl shadow-sm">
          <Settings className="h-7 w-7 text-primary-600 dark:text-primary-400" />
        </div>
        <div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">Settings</h1>
          <p className="text-gray-500 dark:text-gray-400 font-medium">Manage your KIBOSS experience</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-1.5">
          {sidebarItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id as any)}
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-black uppercase tracking-widest rounded-xl transition-all ${
                activeSection === item.id
                  ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/20'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </button>
          ))}
          <div className="pt-4 mt-4 border-t border-gray-100 dark:border-gray-800">
             <button onClick={() => setIsDeleteModalOpen(true)}
               className="w-full flex items-center gap-3 px-4 py-3 text-sm font-black uppercase tracking-widest text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-xl transition-all">
                <Trash2 className="h-4 w-4" />
                Delete Account
             </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="lg:col-span-3 space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
          {activeSection === 'notifications' && (
            <div className="space-y-6">
              <h2 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Notifications</h2>
              <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl divide-y divide-gray-50 dark:divide-gray-800 overflow-hidden shadow-sm">
                {[
                  { key: 'email', label: 'Email Notifications', desc: 'Booking confirmations and critical updates' },
                  { key: 'push', label: 'Push Notifications', desc: 'Real-time alerts for messages and activity' },
                  { key: 'sms', label: 'SMS Alerts', desc: 'Urgent mobile notifications (fees may apply)' },
                  { key: 'marketing', label: 'Marketing Emails', desc: 'Tips, offers, and platform announcements' },
                ].map((item) => (
                  <div key={item.key} className="flex items-center justify-between px-6 py-5">
                    <div>
                      <p className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tight">{item.label}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{item.desc}</p>
                    </div>
                    <button 
                      onClick={() => handleToggle(item.key as any)}
                      className={`relative h-6 w-11 rounded-full transition-colors flex-shrink-0 ${notifications[item.key as keyof typeof notifications] ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-700'}`}
                    >
                      <span className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${notifications[item.key as keyof typeof notifications] ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeSection === 'security' && (
            <div className="space-y-6">
              <h2 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Security</h2>
              
              <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-6">
                   <Key className="h-5 w-5 text-primary-500" />
                   <h3 className="text-base font-black uppercase tracking-tight">Update Password</h3>
                </div>
                <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-gray-400 ml-1">Current Password</label>
                    <input type="password" value={pwForm.current}
                      onChange={e => setPwForm(p => ({...p, current: e.target.value}))}
                      className="w-full input py-3 text-sm font-bold" required />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-gray-400 ml-1">New Password</label>
                    <input type="password" value={pwForm.next}
                      onChange={e => setPwForm(p => ({...p, next: e.target.value}))}
                      className="w-full input py-3 text-sm font-bold" required minLength={8} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-gray-400 ml-1">Confirm New Password</label>
                    <input type="password" value={pwForm.confirm}
                      onChange={e => setPwForm(p => ({...p, confirm: e.target.value}))}
                      className="w-full input py-3 text-sm font-bold" required />
                  </div>
                  <button type="submit" disabled={isProcessing} className="btn-primary w-full py-3 font-black uppercase tracking-widest text-xs">
                    {isProcessing ? 'Updating...' : 'Change Password'}
                  </button>
                </form>
              </div>

              <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-800/50 rounded-3xl p-6 flex gap-4">
                <div className="h-10 w-10 bg-amber-100 dark:bg-amber-800/30 rounded-xl flex items-center justify-center shrink-0">
                  <ShieldCheck className="h-6 w-6 text-amber-600" />
                </div>
                <div>
                  <h3 className="font-black text-amber-900 dark:text-amber-200 uppercase tracking-tight text-sm">Two-Factor Authentication</h3>
                  <p className="text-xs text-amber-700 dark:text-amber-400 mt-1 leading-relaxed">
                    2FA is not yet enabled for your account. This feature will be available in a future update to provide extra security.
                  </p>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl p-6 shadow-sm">
                <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tight mb-2">Active Sessions</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-4 font-medium">You are currently logged in on this browser. For your protection, you can sign out of all active sessions.</p>
                <button onClick={handleLogout} className="flex items-center gap-2 text-xs font-black text-red-600 hover:text-red-700 uppercase tracking-widest transition-colors">
                  <LogOut className="h-4 w-4" /> Sign out everywhere
                </button>
              </div>
            </div>
          )}

          {activeSection === 'appearance' && (
            <div className="space-y-6">
              <h2 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Appearance</h2>
              <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl p-8 shadow-sm">
                <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-6 text-center">Interface Theme</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {[
                    { value: 'light', label: 'Light', icon: Sun },
                    { value: 'dark', label: 'Dark', icon: Moon },
                    { value: 'system', label: 'System', icon: Laptop },
                  ].map(t => (
                    <button key={t.value} onClick={() => setTheme(t.value as any)}
                      className={`flex flex-col items-center gap-4 p-6 rounded-2xl border-2 transition-all ${
                        theme === t.value
                          ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20 shadow-lg shadow-primary-500/10'
                          : 'border-gray-100 dark:border-gray-800 hover:border-gray-200'
                      }`}>
                      <t.icon className={`h-8 w-8 ${theme === t.value ? 'text-primary-600' : 'text-gray-300'}`} />
                      <span className={`text-xs font-black uppercase tracking-widest ${theme === t.value ? 'text-primary-600' : 'text-gray-500'}`}>{t.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeSection === 'account' && (
            <div className="space-y-6">
              <h2 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Account</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl p-6 shadow-sm">
                   <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1">Account Tier</p>
                   <div className="flex items-center gap-2 mb-4">
                      <h3 className="text-xl font-black uppercase">{user?.account_tier}</h3>
                      {user?.account_tier === 'FREE' && <span className="px-2 py-0.5 bg-gray-100 rounded text-[9px] font-black">STANDARD</span>}
                   </div>
                   <Link to="/subscription" className="btn-secondary w-full py-2.5 text-xs font-black uppercase flex items-center justify-center gap-2">
                      Manage Subscription <ChevronRight className="h-3.5 w-3.5" />
                   </Link>
                </div>
                <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl p-6 shadow-sm">
                   <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1">Verification Status</p>
                   <div className="flex items-center gap-2 mb-4">
                      <h3 className="text-xl font-black uppercase">{user?.verification_tier !== 'none' ? 'Verified' : 'Unverified'}</h3>
                      {user?.verification_tier !== 'none' ? <ShieldCheck className="h-5 w-5 text-green-500" /> : <AlertCircle className="h-5 w-5 text-gray-300" />}
                   </div>
                   <Link to="/profile" className="btn-secondary w-full py-2.5 text-xs font-black uppercase flex items-center justify-center gap-2">
                      View Profile <ChevronRight className="h-3.5 w-3.5" />
                   </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        title="Delete Account"
        message="This action is permanent and cannot be undone. All your listings, bookings, and data will be permanently removed from KIBOSS."
        onConfirm={handleDeleteAccount}
        onCancel={() => setIsDeleteModalOpen(false)}
      >
        <div className="mt-4">
          <p className="text-xs text-gray-500 mb-2">Please type <span className="font-black text-red-600">DELETE</span> to confirm:</p>
          <input 
            type="text" 
            value={deleteConfirmText} 
            onChange={e => setDeleteConfirmText(e.target.value)}
            className="w-full input py-2.5 text-center font-black uppercase text-sm border-red-100 focus:ring-red-500"
            placeholder="DELETE"
          />
        </div>
      </ConfirmModal>
    </div>
  );
}
