import { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '../../app/store';
import { CheckCircle, Copy, Timer, Upload, AlertCircle, SimpleUpload, Image as ImageIcon } from 'lucide-react';
import { Price } from '../../context/CurrencyContext';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { fetchBooking } from '../../features/bookings/bookingsSlice';

interface CheckoutPaymentProps {
  bookingId: string;
  bookingType: 'ASSET' | 'RIDE';
  amount: number | string;
  currency?: string;
  onSuccess?: () => void;
}

export default function CheckoutPayment({ bookingId, bookingType, amount, currency = 'TZS', onSuccess }: CheckoutPaymentProps) {
  const dispatch = useDispatch<AppDispatch>();
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [methods, setMethods] = useState<any[]>([]);
  const [selectedMethod, setSelectedMethod] = useState<any | null>(null);
  
  const [timeLeft, setTimeLeft] = useState(15 * 60); // 15 mins
  
  // Form State
  const [senderPhone, setSenderPhone] = useState('');
  const [txnRef, setTxnRef] = useState('');
  const [receiptImage, setReceiptImage] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Fetch system-wide and applicable payment methods
    api.get('/payments/offline-methods/')
      .then(res => setMethods(res.data.results || res.data))
      .catch(() => toast.error('Failed to load payment methods'));
  }, []);

  // Timer Countdown
  useEffect(() => {
    if (step >= 2 && timeLeft > 0) {
      const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
      return () => clearInterval(timer);
    }
  }, [step, timeLeft]);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied!`);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMethod || !receiptImage) {
      toast.error('Please complete all requirements');
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('booking_id', bookingId);
      formData.append('booking_type', bookingType);
      formData.append('amount', amount.toString());
      formData.append('currency', currency);
      formData.append('payment_method', selectedMethod.id);
      formData.append('sender_phone_number', senderPhone);
      formData.append('transaction_reference', txnRef);
      formData.append('receipt_image', receiptImage);

      await api.post('/payments/manual-payments/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      toast.success('Payment submitted successfully!');
      if (onSuccess) onSuccess();
      else {
        // Refresh booking
        dispatch(fetchBooking(bookingId));
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to submit payment');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="card overflow-hidden border-2 border-primary-100 shadow-xl max-w-2xl mx-auto">
      {/* Steps Header */}
      <div className="bg-gray-50 border-b border-gray-100 p-4">
        <div className="flex items-center justify-between relative">
           <div className="absolute left-0 top-1/2 w-full h-0.5 bg-gray-200 -z-10 -translate-y-1/2" />
           {[1, 2, 3, 4].map((num) => (
             <div key={num} className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-sm border-2 bg-white ${step >= num ? 'border-primary-600 text-primary-600' : 'border-gray-200 text-gray-400'}`}>
               {step > num ? <CheckCircle className="h-5 w-5 fill-current text-white bg-primary-600 rounded-full border-none" /> : num}
             </div>
           ))}
        </div>
      </div>

      <div className="p-6">
        {step === 1 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            <h3 className="text-xl font-bold text-gray-900 mb-4 text-center">Confirm Payment Amount</h3>
            <div className="bg-primary-50 p-6 rounded-2xl text-center mb-6">
               <p className="text-sm font-bold text-primary-600 uppercase tracking-widest mb-1">Total Due</p>
               <p className="text-4xl font-black text-gray-900"><Price amount={amount} /></p>
            </div>
            <p className="text-gray-500 text-sm text-center mb-6">You have 15 minutes to complete this transaction after proceeding to secure your booking.</p>
            <button onClick={() => setStep(2)} className="btn-primary w-full py-3 text-lg">Proceed to Checkout</button>
          </div>
        )}

        {step === 2 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="flex justify-between items-end mb-4">
               <div>
                  <h3 className="text-xl font-bold text-gray-900">Select Payment Method</h3>
                  <p className="text-gray-500 text-sm">Choose how you want to pay</p>
               </div>
               <div className="text-right">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Time Left</p>
                  <p className={`font-mono font-bold text-lg ${timeLeft < 300 ? 'text-red-500' : 'text-gray-900'}`}>{formatTime(timeLeft)}</p>
               </div>
            </div>

            <div className="space-y-3 mb-6">
              {methods.map(method => (
                <button
                  key={method.id}
                  onClick={() => { setSelectedMethod(method); setStep(3); }}
                  className="w-full text-left p-4 rounded-xl border-2 border-gray-100 hover:border-primary-300 hover:bg-primary-50 transition-all flex items-center justify-between group"
                >
                  <div>
                    <p className="font-bold text-gray-900 text-lg group-hover:text-primary-700">{method.name}</p>
                    <p className="text-sm text-gray-500">Manual Transfer</p>
                  </div>
                  {method.is_system_wide && (
                    <span className="bg-gray-100 text-gray-600 text-[10px] uppercase font-bold px-2 py-1 rounded">Official</span>
                  )}
                </button>
              ))}
              {methods.length === 0 && (
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                  <p className="text-gray-500">No payment methods available right now.</p>
                </div>
              )}
            </div>
            <button onClick={() => setStep(1)} className="text-sm font-bold text-gray-500 hover:text-gray-900">← Back</button>
          </div>
        )}

        {step === 3 && selectedMethod && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
             <div className="flex justify-between items-end mb-4">
               <div>
                  <h3 className="text-xl font-bold text-gray-900">Payment Instructions</h3>
                  <p className="text-gray-500 text-sm">Send exactly <span className="font-bold text-gray-900"><Price amount={amount} /></span> via {selectedMethod.name}</p>
               </div>
               <div className="text-right">
                  <p className={`font-mono font-bold text-lg ${timeLeft < 300 ? 'text-red-500 animate-pulse' : 'text-gray-900'}`}>
                    <Timer className="h-4 w-4 inline mr-1 text-gray-400" />
                    {formatTime(timeLeft)}
                  </p>
               </div>
            </div>

            <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-5 mb-6 space-y-4">
               {selectedMethod.lipa_namba && (
                 <div className="flex items-center justify-between bg-white rounded-lg p-3 shadow-sm">
                   <div>
                     <p className="text-[10px] uppercase font-bold text-gray-400 mb-0.5">Lipa Namba / Till Number</p>
                     <p className="font-mono text-xl font-black text-indigo-900">{selectedMethod.lipa_namba}</p>
                   </div>
                   <button onClick={() => copyToClipboard(selectedMethod.lipa_namba, 'Lipa Namba')} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors">
                     <Copy className="h-5 w-5" />
                   </button>
                 </div>
               )}
               
               <div className="flex items-center justify-between bg-white rounded-lg p-3 shadow-sm">
                   <div>
                     <p className="text-[10px] uppercase font-bold text-gray-400 mb-0.5">Account Name</p>
                     <p className="font-bold text-gray-900">{selectedMethod.account_name || 'N/A'}</p>
                   </div>
                </div>

                {selectedMethod.instructions && (
                  <div className="bg-white rounded-lg p-3 shadow-sm">
                     <p className="text-[10px] uppercase font-bold text-gray-400 mb-1">Instructions</p>
                     <p className="text-sm text-gray-700 whitespace-pre-wrap">{selectedMethod.instructions}</p>
                  </div>
                )}
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep(2)} className="btn-secondary py-3 flex-1">Back</button>
              <button onClick={() => setStep(4)} className="btn-primary py-3 flex-[2]">I Have Paid</button>
            </div>
          </div>
        )}

        {step === 4 && selectedMethod && (
           <div className="animate-in fade-in slide-in-from-right-4 duration-300">
             <div className="mb-6">
                <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                   Submit Verification
                   <CheckCircle className="h-5 w-5 text-green-500" />
                </h3>
                <p className="text-gray-500 text-sm">Upload your payment confirmation receipt</p>
             </div>

             <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                   <div>
                     <label className="block text-sm font-bold text-gray-700 mb-1">Sender Phone</label>
                     <input 
                       type="text" 
                       required 
                       value={senderPhone} 
                       onChange={e => setSenderPhone(e.target.value)} 
                       className="input w-full font-mono text-sm" 
                       placeholder="e.g. 0712345678" 
                     />
                   </div>
                   <div>
                     <label className="block text-sm font-bold text-gray-700 mb-1">Transaction Ref (Optional)</label>
                     <input 
                       type="text" 
                       value={txnRef} 
                       onChange={e => setTxnRef(e.target.value)} 
                       className="input w-full font-mono text-sm uppercase" 
                       placeholder="e.g. TRC12345" 
                     />
                   </div>
                </div>

                <div>
                   <label className="block text-sm font-bold text-gray-700 mb-1">Receipt Screenshot *</label>
                   <div className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-xl transition-colors ${receiptImage ? 'border-green-300 bg-green-50' : 'border-gray-300 hover:border-primary-400 hover:bg-primary-50/30'}`}>
                      <div className="space-y-1 text-center">
                        {receiptImage ? (
                           <ImageIcon className="mx-auto h-12 w-12 text-green-500" />
                        ) : (
                           <Upload className="mx-auto h-12 w-12 text-gray-400" />
                        )}
                        <div className="flex text-sm text-gray-600 mt-2">
                           <label className="relative cursor-pointer rounded-md font-bold text-primary-600 hover:text-primary-500 focus-within:outline-none">
                              <span>{receiptImage ? 'Change Image' : 'Upload a file'}</span>
                              <input type="file" required accept="image/*" className="sr-only" onChange={e => {
                                 if (e.target.files?.[0]) setReceiptImage(e.target.files[0]);
                              }} />
                           </label>
                           {!receiptImage && <p className="pl-1">or drag and drop</p>}
                        </div>
                        <p className="text-xs text-gray-500">
                           {receiptImage ? receiptImage.name : 'PNG, JPG, GIF up to 10MB'}
                        </p>
                      </div>
                   </div>
                </div>

                <div className="bg-amber-50 rounded-lg p-3 text-sm text-amber-800 flex items-start gap-2 border border-amber-200 mt-2">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <p>Fake receipts or manipulation will result in immediate account termination and legal action.</p>
                </div>

                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={() => setStep(3)} className="btn-secondary py-3">Back</button>
                  <button type="submit" disabled={isSubmitting} className="btn-primary flex-1 py-3 text-lg shadow-lg">
                    {isSubmitting ? 'Uploading...' : 'Submit Receipt'}
                  </button>
                </div>
             </form>
           </div>
        )}
      </div>
    </div>
  );
}
