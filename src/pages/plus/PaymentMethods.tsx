import { useState, useEffect } from 'react';
import api from '../../services/api';
import { CreditCard, Plus, Trash2, Edit3, Save, X, Phone, User, QrCode, Star, Info } from 'lucide-react';
import toast from 'react-hot-toast';
import { useSelector } from 'react-redux';
import { RootState } from '../../app/store';
import { getMediaUrl } from '../../utils/media';

interface UserPaymentMethod {
  id: string;
  payment_type: string;
  account_name: string;
  account_number: string;
  instructions: string;
  qr_code: string | null;
  is_active: boolean;
  is_default: boolean;
}

const PAYMENT_TYPES = [
  { value: 'MPESA', label: 'Vodacom M-Pesa' },
  { value: 'TIGO_PESA', label: 'Tigo Pesa' },
  { value: 'AIRTEL_MONEY', label: 'Airtel Money' },
  { value: 'HALOPESA', label: 'Halo Pesa' },
  { value: 'AZAM_PESA', label: 'Azam Pesa' },
  { value: 'CRDB', label: 'CRDB Bank' },
  { value: 'NMB', label: 'NMB Bank' },
  { value: 'OTHER', label: 'Other' },
];

const emptyForm = {
  payment_type: 'MPESA',
  account_name: '',
  account_number: '',
  instructions: '',
  is_active: true,
  is_default: false,
};

export default function PaymentMethods() {
  const { user } = useSelector((state: RootState) => state.auth);
  const [methods, setMethods] = useState<UserPaymentMethod[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState<any>(emptyForm);
  const [qrFile, setQrFile] = useState<File | null>(null);

  const fetchMethods = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/payments/user-payment-methods/');
      setMethods(res.data.results || res.data);
    } catch {
      toast.error('Failed to load payment methods');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchMethods(); }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const fd = new FormData();
      Object.entries(formData).forEach(([k, v]) => fd.append(k, String(v)));
      if (qrFile) fd.append('qr_code', qrFile);

      if (isEditing) {
        await api.patch(`/payments/user-payment-methods/${isEditing}/`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        toast.success('Payment method updated');
      } else {
        await api.post('/payments/user-payment-methods/', fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        toast.success('Payment method added');
      }
      setIsEditing(null);
      setIsAdding(false);
      setFormData(emptyForm);
      setQrFile(null);
      fetchMethods();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to save');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Remove this payment method?')) return;
    try {
      await api.delete(`/payments/user-payment-methods/${id}/`);
      toast.success('Removed');
      fetchMethods();
    } catch {
      toast.error('Failed to remove');
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      await api.patch(`/payments/user-payment-methods/${id}/`, { is_default: true });
      fetchMethods();
    } catch {
      toast.error('Failed to set default');
    }
  };

  const startEdit = (m: UserPaymentMethod) => {
    setFormData({ ...m });
    setIsEditing(m.id);
    setIsAdding(false);
    setQrFile(null);
  };

  const cancelForm = () => {
    setIsAdding(false);
    setIsEditing(null);
    setFormData(emptyForm);
    setQrFile(null);
  };

  const getTypeLabel = (type: string) => PAYMENT_TYPES.find(t => t.value === type)?.label || type;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="card p-8 border-none shadow-lg bg-gradient-to-br from-indigo-50 to-white">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-xl font-black text-gray-900 tracking-tight flex items-center gap-2">
              <CreditCard className="h-6 w-6 text-indigo-500" />
              My Payment Methods
            </h2>
            <p className="text-gray-500 dark:text-gray-400 mt-1 max-w-xl text-sm">
              Add your Lipa Namba, mobile money, or bank account details. Customers booking your assets will use these details to pay you directly.
            </p>
          </div>
          {!isAdding && !isEditing && (
            <button onClick={() => setIsAdding(true)} className="btn-primary py-2 flex items-center gap-2">
              <Plus className="h-4 w-4" /> Add Method
            </button>
          )}
        </div>

        {/* Form */}
        {(isAdding || isEditing) && (
          <form onSubmit={handleSave} className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-indigo-100 mb-8 max-w-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">{isEditing ? 'Edit Method' : 'Add Payment Method'}</h3>
              <button type="button" onClick={cancelForm} className="p-1 hover:bg-gray-100 dark:bg-gray-800 rounded-lg"><X className="h-4 w-4 text-gray-400" /></button>
            </div>
            <div className="space-y-4">
              {/* Provider Type */}
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-1">Payment Provider *</label>
                <select
                  required
                  value={formData.payment_type}
                  onChange={e => setFormData({ ...formData, payment_type: e.target.value })}
                  className="input w-full"
                >
                  {PAYMENT_TYPES.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-1">Lipa Namba / Account No. *</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. 0712345678 or 123456"
                      value={formData.account_number}
                      onChange={e => setFormData({ ...formData, account_number: e.target.value })}
                      className="input w-full pl-10 font-mono"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-1">Account Name *</label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Juma Rashid"
                      value={formData.account_name}
                      onChange={e => setFormData({ ...formData, account_name: e.target.value })}
                      className="input w-full pl-10"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-1">Payment Instructions</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Dial *150*00# → Lipa → Namba..."
                  value={formData.instructions}
                  onChange={e => setFormData({ ...formData, instructions: e.target.value })}
                  className="input w-full resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-1 flex items-center gap-1">
                  <QrCode className="h-4 w-4" /> QR Code Image (Optional)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={e => setQrFile(e.target.files?.[0] || null)}
                  className="block w-full text-sm text-gray-500 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-bold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
                />
              </div>

              <div className="flex items-center gap-4 mt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={formData.is_active} onChange={e => setFormData({ ...formData, is_active: e.target.checked })} className="h-4 w-4 text-primary-600 rounded border-gray-300" />
                  <span className="text-sm font-bold text-gray-700 dark:text-gray-200">Active</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={formData.is_default} onChange={e => setFormData({ ...formData, is_default: e.target.checked })} className="h-4 w-4 text-primary-600 rounded border-gray-300" />
                  <span className="text-sm font-bold text-gray-700 dark:text-gray-200">Set as Default</span>
                </label>
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
                <button type="button" onClick={cancelForm} className="btn-secondary py-2 flex-1">Cancel</button>
                <button type="submit" className="btn-primary py-2 flex-[2] flex items-center justify-center gap-2">
                  <Save className="h-4 w-4" /> Save Method
                </button>
              </div>
            </div>
          </form>
        )}

        {/* List */}
        <div className="space-y-4 max-w-2xl">
          {isLoading ? (
            <div className="text-center py-6 text-gray-400">Loading...</div>
          ) : methods.length > 0 ? (
            methods.map(method => (
              <div key={method.id} className={`bg-white dark:bg-gray-800 p-5 rounded-xl border-2 flex flex-col md:flex-row justify-between gap-4 group hover:border-indigo-300 transition-colors ${method.is_default ? 'border-indigo-400' : 'border-indigo-100'}`}>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-black text-gray-900 text-lg">{getTypeLabel(method.payment_type)}</h4>
                    {method.is_default && <span className="bg-indigo-100 text-indigo-700 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-widest flex items-center gap-1"><Star className="h-2.5 w-2.5 fill-current" />Default</span>}
                    {method.is_active ? (
                      <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-widest">Active</span>
                    ) : (
                      <span className="bg-gray-100 text-gray-500 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-widest">Inactive</span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm mt-2 flex-wrap">
                    <div className="font-mono bg-gray-50 dark:bg-gray-900 px-2 py-1 rounded text-primary-700 font-bold border border-gray-100 dark:border-gray-800">
                      {method.account_number}
                    </div>
                    <span className="text-gray-500 font-medium">Name: <span className="text-gray-900 font-bold">{method.account_name}</span></span>
                  </div>
                  {method.qr_code && (
                    <img src={getMediaUrl(method.qr_code)} alt="QR Code" className="mt-2 h-20 w-20 object-contain rounded-lg border border-gray-100 dark:border-gray-800" />
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {!method.is_default && (
                    <button onClick={() => handleSetDefault(method.id)} className="p-2 text-yellow-500 hover:bg-yellow-50 rounded-lg transition-colors" title="Set as default">
                      <Star className="h-5 w-5" />
                    </button>
                  )}
                  <button onClick={() => startEdit(method)} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="Edit">
                    <Edit3 className="h-5 w-5" />
                  </button>
                  <button onClick={() => handleDelete(method.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white dark:bg-gray-800 border-2 border-dashed border-indigo-200 rounded-xl p-8 text-center">
              <CreditCard className="h-12 w-12 text-indigo-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium max-w-sm mx-auto">
                You haven't added any payment methods yet. Add your M-Pesa, Tigo Pesa, or bank account so customers can pay you directly.
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-6 border border-gray-200 flex items-start gap-3">
        <Info className="h-5 w-5 text-gray-400 shrink-0 mt-0.5" />
        <p className="text-sm text-gray-600 font-medium leading-relaxed">
          Your Lipa Namba and payment details will be shown to customers when they checkout a booking for your assets or rides. Setting up your own payment methods ensures <strong>100% direct payment</strong> straight to your mobile wallet or bank account.
        </p>
      </div>
    </div>
  );
}
