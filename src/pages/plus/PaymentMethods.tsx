import { useState, useEffect } from 'react';
import api from '../../services/api';
import { CreditCard, Plus, Trash2, Edit3, Save, X, Phone, User, Info, Building2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useSelector } from 'react-redux';
import { RootState } from '../../app/store';

interface PaymentMethod {
  id: string;
  name: string;
  lipa_namba: string | null;
  account_name: string | null;
  instructions: string | null;
  is_active: boolean;
  is_system_wide: boolean;
  owner?: string | null;
}

export default function PaymentMethods() {
  const { user } = useSelector((state: RootState) => state.auth);
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState<Partial<PaymentMethod>>({
    name: 'M-Pesa / Tigo Pesa',
    lipa_namba: '',
    account_name: '',
    instructions: '',
    is_active: true
  });

  const fetchMethods = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/payments/offline-methods/');
      setMethods(res.data.results || res.data);
    } catch (err) {
      toast.error('Failed to load payment methods');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMethods();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isEditing) {
        await api.patch(`/payments/offline-methods/${isEditing}/`, formData);
        toast.success('Payment method updated');
      } else {
        await api.post('/payments/offline-methods/', formData);
        toast.success('Payment method added successfully');
      }
      setIsEditing(null);
      setIsAdding(false);
      setFormData({ name: 'M-Pesa / Tigo Pesa', lipa_namba: '', account_name: '', instructions: '', is_active: true });
      fetchMethods();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to save payment method');
    }
  };

  const handleDelete = async (id: string) => {
     if (confirm('Are you sure you want to disable this payment method?')) {
        try {
           await api.patch(`/payments/offline-methods/${id}/`, { is_active: false });
           toast.success('Payment method disabled');
           fetchMethods();
        } catch (err) {
           toast.error('Failed to disable method');
        }
     }
  };

  const myMethods = methods.filter(m => m.owner);
  const systemMethods = methods.filter(m => m.is_system_wide);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
       <div className="card p-8 border-none shadow-lg bg-gradient-to-br from-indigo-50 to-white">
          <div className="flex items-start justify-between mb-6">
              <div>
                  <h2 className="text-xl font-black text-gray-900 tracking-tight flex items-center gap-2">
                      <CreditCard className="h-6 w-6 text-indigo-500" />
                      Manual Payment Methods
                  </h2>
                  <p className="text-gray-500 mt-1 max-w-xl text-sm">
                      Set up your personal Mobile Money or Bank details. When customers book your assets, they will be given these instructions to pay you directly.
                  </p>
              </div>
              {!isAdding && !isEditing && (
                 <button onClick={() => setIsAdding(true)} className="btn-primary py-2 flex items-center gap-2">
                    <Plus className="h-4 w-4" /> Add Method
                 </button>
              )}
          </div>

          {(isAdding || isEditing) && (
              <form onSubmit={handleSave} className="bg-white p-6 rounded-2xl shadow-sm border border-indigo-100 mb-8 max-w-2xl">
                 <h3 className="text-lg font-bold text-gray-900 mb-4">{isEditing ? 'Edit Method' : 'Add Payment Method'}</h3>
                 
                 <div className="space-y-4">
                    <div>
                       <label className="block text-sm font-bold text-gray-700 mb-1">Provider Name / Type *</label>
                       <input 
                          type="text" 
                          required 
                          placeholder="e.g. M-Pesa / Tigo Pesa / CRDB Bank" 
                          value={formData.name || ''}
                          onChange={e => setFormData({...formData, name: e.target.value})}
                          className="input w-full" 
                       />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       <div>
                         <label className="block text-sm font-bold text-gray-700 mb-1">Lipa Namba / Till *</label>
                         <div className="relative">
                            <Building2 className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                            <input 
                               type="text" 
                               required 
                               placeholder="e.g. 123456" 
                               value={formData.lipa_namba || ''}
                               onChange={e => setFormData({...formData, lipa_namba: e.target.value})}
                               className="input w-full pl-10 font-mono" 
                            />
                         </div>
                       </div>
                       <div>
                         <label className="block text-sm font-bold text-gray-700 mb-1">Account Name *</label>
                         <div className="relative">
                            <User className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                            <input 
                               type="text" 
                               required 
                               placeholder="e.g. Kiboss Co." 
                               value={formData.account_name || ''}
                               onChange={e => setFormData({...formData, account_name: e.target.value})}
                               className="input w-full pl-10" 
                            />
                         </div>
                       </div>
                    </div>

                    <div>
                       <label className="block text-sm font-bold text-gray-700 mb-1">Payment Instructions</label>
                       <textarea 
                          rows={3}
                          placeholder="Provide specific instructions on how to pay. E.g. 'Dial *150*00# and choose Pay Bill...'" 
                          value={formData.instructions || ''}
                          onChange={e => setFormData({...formData, instructions: e.target.value})}
                          className="input w-full resize-none" 
                       />
                    </div>
                    
                    <div className="flex items-center gap-2 mt-2">
                       <input 
                          type="checkbox" 
                          id="isActive"
                          checked={formData.is_active} 
                          onChange={e => setFormData({...formData, is_active: e.target.checked})}
                          className="h-4 w-4 text-primary-600 rounded border-gray-300"
                       />
                       <label htmlFor="isActive" className="text-sm font-bold text-gray-700">Set as Active</label>
                    </div>

                    <div className="flex gap-3 pt-4 border-t border-gray-100">
                       <button type="button" onClick={() => { setIsAdding(false); setIsEditing(null); }} className="btn-secondary py-2 flex-1">
                          Cancel
                       </button>
                       <button type="submit" className="btn-primary py-2 flex-[2] flex items-center justify-center gap-2">
                          <Save className="h-4 w-4" /> Save Method
                       </button>
                    </div>
                 </div>
              </form>
          )}

          {/* List of User's Payment Methods */}
          <div className="space-y-4 max-w-2xl">
              <h3 className="font-bold text-gray-900 text-lg uppercase tracking-wider mb-2">My Payment Methods</h3>
              
              {isLoading ? (
                 <div className="text-center py-6">Loading methods...</div>
              ) : myMethods.length > 0 ? (
                 myMethods.map(method => (
                    <div key={method.id} className="bg-white p-5 rounded-xl border-2 border-indigo-100 flex flex-col md:flex-row justify-between gap-4 group hover:border-indigo-300 transition-colors">
                       <div>
                          <div className="flex items-center gap-2 mb-1">
                             <h4 className="font-black text-gray-900 text-lg">{method.name}</h4>
                             {method.is_active ? (
                                <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-widest">Active</span>
                             ) : (
                                <span className="bg-gray-100 text-gray-500 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-widest">Disabled</span>
                             )}
                          </div>
                          <div className="flex items-center gap-4 text-sm mt-2">
                              <div className="font-mono bg-gray-50 px-2 py-1 rounded text-primary-700 font-bold border border-gray-100">
                                 {method.lipa_namba}
                              </div>
                              <span className="text-gray-500 font-medium">Name: <span className="text-gray-900 font-bold">{method.account_name}</span></span>
                          </div>
                       </div>
                       
                       <div className="flex items-center gap-2">
                          <button 
                             onClick={() => { setFormData(method); setIsEditing(method.id); setIsAdding(false); }}
                             className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                             title="Edit"
                          >
                             <Edit3 className="h-5 w-5" />
                          </button>
                          <button 
                             onClick={() => handleDelete(method.id)}
                             className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                             title="Disable"
                          >
                             <Trash2 className="h-5 w-5" />
                          </button>
                       </div>
                    </div>
                 ))
              ) : (
                 <div className="bg-white border-2 border-dashed border-indigo-200 rounded-xl p-8 text-center">
                    <CreditCard className="h-12 w-12 text-indigo-300 mx-auto mb-3" />
                    <p className="text-gray-500 font-medium max-w-sm mx-auto">
                       You haven't added any personal payment methods. Customers will fall back to using official platform payment methods.
                    </p>
                 </div>
              )}
          </div>
       </div>

       {/* System Wide Info */}
       <div className="bg-gray-50 rounded-xl p-6 border border-gray-200 flex items-start gap-3">
          <Info className="h-5 w-5 text-gray-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-gray-600 font-medium leading-relaxed">
               If you do not provide active payment methods, KIBOSS official payment methods will cover the transaction. You will be able to withdraw these earnings from your wallet minus a platform handling fee. Setting up your own payment methods ensures 100% direct payment.
            </p>
          </div>
       </div>
    </div>
  );
}
