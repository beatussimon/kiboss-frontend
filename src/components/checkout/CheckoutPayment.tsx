import { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '../../app/store';
import { CheckCircle, Copy, Timer, Upload, AlertCircle, Image as ImageIcon, Smartphone, Building2, QrCode, Banknote } from 'lucide-react';
import { Price } from '../../context/CurrencyContext';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { fetchBooking } from '../../features/bookings/bookingsSlice';
import { getMediaUrl } from '../../utils/media';

interface CheckoutPaymentProps {
  bookingId: string;
  bookingType: 'ASSET' | 'RIDE';
  amount: number | string;
  currency?: string;
  ownerId?: string;
  onSuccess?: () => void;
}

interface PaymentOption {
  id: string;
  label: string;
  lipaNamba?: string;
  accountName?: string;
  instructions?: string;
  qrCode?: string | null;
  isSystem?: boolean;
  source: 'system' | 'owner' | 'cash';
}

export default function CheckoutPayment({
  bookingId, bookingType, amount, currency = 'TZS', ownerId, onSuccess
}: CheckoutPaymentProps) {
  const dispatch = useDispatch<AppDispatch>();
  const [step, setStep] = useState<1 | 2>(1);
  const [options, setOptions] = useState<PaymentOption[]>([]);
  const [selectedOption, setSelectedOption] = useState<PaymentOption | null>(null);
  const [timeLeft, setTimeLeft] = useState(15 * 60);
  const [senderPhone, setSenderPhone] = useState('');
  const [txnRef, setTxnRef] = useState('');
  const [receiptImage, setReceiptImage] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingMethods, setIsLoadingMethods] = useState(true);

  useEffect(() => {
    const load = async () => {
      setIsLoadingMethods(true);
      try {
        const sysRes = await api.get('/payments/offline-methods/');
        const sysData: any[] = sysRes.data.results || sysRes.data || [];
        const sysOptions: PaymentOption[] = sysData
          .filter((m: any) => m.is_system_wide && m.is_active)
          .map((m: any) => ({
            id: m.id,
            label: m.name || m.network_name,
            lipaNamba: m.lipa_namba || m.payment_number,
            accountName: m.account_name,
            instructions: m.instructions,
            qrCode: m.qr_code_image || m.qr_code,
            isSystem: true,
            source: 'system',
          }));

        let ownerOptions: PaymentOption[] = [];
        if (ownerId) {
          try {
            const ownerRes = await api.get(`/payments/user-payment-methods/?owner=${ownerId}`);
            const ownerData: any[] = ownerRes.data.results || ownerRes.data || [];
            ownerOptions = ownerData
              .filter((m: any) => m.is_active)
              .map((m: any) => ({
                id: m.id,
                label: `${m.payment_type} — ${m.account_name}`,
                lipaNamba: m.account_number,
                accountName: m.account_name,
                instructions: m.instructions,
                qrCode: m.qr_code,
                isSystem: false,
                source: 'owner',
              }));
          } catch { /* owner has no methods — that's fine */ }
        }

        const cashOption: PaymentOption = {
          id: 'CASH',
          label: 'Pay in Person (Cash)',
          instructions: 'You will pay the owner/driver directly in cash upon meeting. An invoice will be generated to secure your booking.',
          source: 'cash',
        };

        setOptions([...sysOptions, ...ownerOptions, cashOption]);
      } catch {
        toast.error('Failed to load payment methods');
      } finally {
        setIsLoadingMethods(false);
      }
    };
    load();
  }, [ownerId]);

  useEffect(() => {
    if (step === 2 && timeLeft > 0) {
      const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
      return () => clearInterval(timer);
    }
  }, [step, timeLeft]);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied!`);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOption) return;
    
    const isCash = selectedOption.source === 'cash';
    if (!isCash && !receiptImage) {
      toast.error('Please attach your receipt screenshot');
      return;
    }
    
    setIsSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('booking_id', bookingId);
      fd.append('booking_type', bookingType);
      fd.append('amount', amount.toString());
      fd.append('currency', currency);
      
      if (isCash) {
        fd.append('is_cash', 'true');
        // We pass the generic 'CASH' marker as confirmation
        fd.append('manual_confirmation', 'CASH_PAYMENT_SELECTED');
      } else {
        if (selectedOption.source === 'system') {
          fd.append('payment_method', selectedOption.id);
        } else {
          fd.append('user_payment_method', selectedOption.id);
        }
        fd.append('sender_phone_number', senderPhone);
        if (txnRef) fd.append('transaction_reference', txnRef);
        if (receiptImage) fd.append('receipt_image', receiptImage);
      }

      await api.post('/payments/manual-payments/', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      toast.success(isCash ? 'Invoice generated! Pay the provider upon meeting.' : 'Payment submitted! We will verify shortly.');
      if (onSuccess) onSuccess();
      else dispatch(fetchBooking(bookingId));
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to submit payment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const PAYMENT_TYPE_LABELS: Record<string, string> = {
    MPESA: 'Vodacom M-Pesa',
    TIGO_PESA: 'Tigo Pesa',
    AIRTEL_MONEY: 'Airtel Money',
    HALOPESA: 'Halo Pesa',
    AZAM_PESA: 'Azam Pesa',
    CRDB: 'CRDB Bank',
    NMB: 'NMB Bank',
    OTHER: 'Other',
  };

  const getFriendlyLabel = (opt: PaymentOption) => {
    if (opt.source === 'cash') return opt.label;
    const parts = opt.label.split(' — ');
    const typeLabel = PAYMENT_TYPE_LABELS[parts[0]] || parts[0];
    return parts.length > 1 ? `${typeLabel} — ${parts[1]}` : opt.label;
  };

  return (
    <div className="card overflow-hidden border-2 border-primary-100 shadow-xl max-w-2xl mx-auto">
      {/* Steps indicator */}
      <div className="bg-gray-50 dark:bg-gray-900 border-b border-gray-100 p-4">
        <div className="flex items-center justify-between relative px-8">
          <div className="absolute left-8 right-8 top-1/2 h-0.5 bg-gray-200 -z-10 -trangray-y-1/2" />
          {[1, 2].map((num) => (
            <div key={num} className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-sm border-2 bg-white ${step >= num ? 'border-primary-600 text-primary-600' : 'border-gray-200 text-gray-400'}`}>
              {step > num ? <CheckCircle className="h-5 w-5 fill-current text-white bg-primary-600 rounded-full border-none" /> : num}
            </div>
          ))}
        </div>
        <div className="flex justify-between px-6 mt-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
           <span>Select Method</span>
           <span>Confirm & Pay</span>
        </div>
      </div>

      <div className="p-6">
        {/* Step 1 — Select Method */}
        {step === 1 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 text-center">How would you like to pay?</h3>
            <div className="bg-primary-50 p-4 rounded-2xl text-center mb-6">
              <p className="text-xs font-bold text-primary-600 uppercase tracking-widest mb-1">Total Due</p>
              <p className="text-3xl font-black text-gray-900 dark:text-white"><Price amount={amount} /></p>
            </div>

            {isLoadingMethods ? (
              <div className="text-center py-8 text-gray-400">Loading payment methods...</div>
            ) : (
              <div className="space-y-3 mb-6">
                {options.length > 0 ? options.map(opt => (
                  <button
                    key={opt.id}
                    onClick={() => { setSelectedOption(opt); setStep(2); }}
                    className="w-full text-left p-4 rounded-xl border-2 border-gray-100 hover:border-primary-300 hover:bg-primary-50 transition-all flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-3">
                      {opt.source === 'system' ? (
                        <Building2 className="h-5 w-5 text-gray-400 shrink-0" />
                      ) : opt.source === 'cash' ? (
                        <Banknote className="h-5 w-5 text-green-500 shrink-0" />
                      ) : (
                        <Smartphone className="h-5 w-5 text-primary-500 shrink-0" />
                      )}
                      <div>
                        <p className="font-bold text-gray-900 group-hover:text-primary-700">{getFriendlyLabel(opt)}</p>
                        {opt.lipaNamba && <p className="text-xs font-mono text-gray-500 dark:text-gray-400">{opt.lipaNamba}</p>}
                      </div>
                    </div>
                    {opt.isSystem && <span className="bg-gray-100 text-gray-600 text-[10px] uppercase font-bold px-2 py-1 rounded">Official</span>}
                    {opt.source === 'cash' && <span className="bg-green-100 text-green-700 text-[10px] uppercase font-bold px-2 py-1 rounded">In Person</span>}
                  </button>
                )) : (
                  <div className="text-center py-10 bg-amber-50 rounded-xl border border-amber-100">
                    <AlertCircle className="h-10 w-10 text-amber-400 mx-auto mb-3" />
                    <p className="text-amber-800 font-bold">No payment methods available.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Step 2 — Pay & Upload (or Confirm Invoice for Cash) */}
        {step === 2 && selectedOption && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="flex justify-between items-end mb-6">
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">{selectedOption.source === 'cash' ? 'Confirm Payment' : 'Complete Payment'}</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                   {selectedOption.source === 'cash' ? 'Review invoice details' : `Send exactly `}
                   {selectedOption.source !== 'cash' && <span className="font-bold text-gray-900 dark:text-white"><Price amount={amount} /></span>}
                </p>
              </div>
              <p className={`font-mono font-bold text-lg ${timeLeft < 300 ? 'text-red-500 animate-pulse' : 'text-gray-900'}`}>
                <Timer className="h-4 w-4 inline mr-1 text-gray-400" />{formatTime(timeLeft)}
              </p>
            </div>

            {selectedOption.source === 'cash' ? (
               <div className="bg-green-50 border border-green-100 rounded-xl p-6 text-center mb-6">
                 <Banknote className="h-12 w-12 text-green-500 mx-auto mb-4" />
                 <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Pay in Person Selected</h4>
                 <p className="text-sm text-gray-600 mb-4">{selectedOption.instructions}</p>
                 <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm inline-block mx-auto">
                    <p className="text-xs font-bold text-gray-400 uppercase mb-1">Amount to pay</p>
                    <p className="text-2xl font-black text-green-600 dark:text-green-400"><Price amount={amount} /></p>
                 </div>
               </div>
            ) : (
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                 {/* Instructions Panel */}
                 <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-5 space-y-4">
                   <h4 className="text-sm font-black text-indigo-900 uppercase tracking-widest flex items-center gap-2"><Building2 className="h-4 w-4" /> Details</h4>
                   {selectedOption.lipaNamba && (
                     <div className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm">
                       <div>
                         <p className="text-[10px] uppercase font-bold text-gray-400 mb-0.5">Lipa Namba / Number</p>
                         <p className="font-mono text-lg font-black text-indigo-900">{selectedOption.lipaNamba}</p>
                       </div>
                       <button onClick={() => copyToClipboard(selectedOption.lipaNamba!, 'Number')} className="p-2 hover:bg-gray-100 dark:bg-gray-800 rounded-lg text-gray-500 transition-colors"><Copy className="h-5 w-5" /></button>
                     </div>
                   )}
                   <div className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm">
                     <p className="text-[10px] uppercase font-bold text-gray-400 mb-0.5">Account Name</p>
                     <p className="font-bold text-gray-900 dark:text-white">{selectedOption.accountName || 'N/A'}</p>
                   </div>
                   {selectedOption.instructions && (
                     <div className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm">
                       <p className="text-[10px] uppercase font-bold text-gray-400 mb-1">Instructions</p>
                       <p className="text-xs text-gray-700 whitespace-pre-wrap">{selectedOption.instructions}</p>
                     </div>
                   )}
                   {selectedOption.qrCode && (
                     <div className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm text-center">
                       <p className="text-[10px] uppercase font-bold text-gray-400 mb-2 flex items-center justify-center gap-1"><QrCode className="h-3 w-3" /> Scan QR Code</p>
                       <img src={getMediaUrl(selectedOption.qrCode)} alt="QR Code" className="h-32 w-32 object-contain mx-auto rounded-lg" />
                     </div>
                   )}
                 </div>

                 {/* Upload Form */}
                 <div>
                    <h4 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-4 flex items-center gap-2"><Upload className="h-4 w-4 text-primary-600" /> Verify</h4>
                    <form id="payment-form" onSubmit={handleSubmit} className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-700 dark:text-gray-200 mb-1 uppercase tracking-wider">Sender Phone <span className="text-red-500">*</span></label>
                        <input type="text" required value={senderPhone} onChange={e => setSenderPhone(e.target.value)} className="input w-full font-mono text-sm py-2 px-3" placeholder="e.g. 0712345678" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-700 dark:text-gray-200 mb-1 uppercase tracking-wider">Txn Ref (Optional)</label>
                        <input type="text" value={txnRef} onChange={e => setTxnRef(e.target.value)} className="input w-full font-mono text-sm uppercase py-2 px-3" placeholder="e.g. TRC12345" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-700 dark:text-gray-200 mb-1 uppercase tracking-wider">Receipt Screenshot <span className="text-red-500">*</span></label>
                        <div className={`mt-1 flex justify-center px-4 py-4 border-2 border-dashed rounded-xl transition-colors ${receiptImage ? 'border-green-300 bg-green-50' : 'border-gray-300 hover:border-primary-400 hover:bg-primary-50/30'}`}>
                          <div className="space-y-1 text-center">
                            {receiptImage ? <ImageIcon className="mx-auto h-8 w-8 text-green-500" /> : <Upload className="mx-auto h-8 w-8 text-gray-400" />}
                            <div className="flex text-sm text-gray-600 mt-2">
                              <label className="relative cursor-pointer rounded-md font-bold text-primary-600 hover:text-primary-500 focus-within:outline-none">
                                <span>{receiptImage ? 'Change Image' : 'Upload file'}</span>
                                <input type="file" required accept="image/*" className="sr-only" onChange={e => { if (e.target.files?.[0]) setReceiptImage(e.target.files[0]); }} />
                              </label>
                            </div>
                            <p className="text-[10px] text-gray-500 dark:text-gray-400">{receiptImage ? receiptImage.name : 'PNG, JPG up to 10MB'}</p>
                          </div>
                        </div>
                      </div>
                    </form>
                 </div>
               </div>
            )}

            <div className="flex gap-3 pt-2">
              <button onClick={() => setStep(1)} className="btn-secondary py-3 px-6 font-bold text-gray-600 dark:text-gray-300">Back</button>
              <button type="submit" form={selectedOption.source !== 'cash' ? "payment-form" : undefined} onClick={selectedOption.source === 'cash' ? handleSubmit : undefined} disabled={isSubmitting} className="btn-primary flex-1 py-3 text-lg shadow-lg flex items-center justify-center gap-2">
                {isSubmitting ? <span className="animate-pulse">Processing...</span> : selectedOption.source === 'cash' ? <><CheckCircle className="h-5 w-5" /> Generate Invoice</> : <><CheckCircle className="h-5 w-5" /> Submit Payment</>}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
