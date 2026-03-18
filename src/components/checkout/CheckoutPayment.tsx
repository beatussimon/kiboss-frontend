import { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '../../app/store';
import { CheckCircle, Copy, Timer, Upload, AlertCircle, Image as ImageIcon, Smartphone, Building2, QrCode } from 'lucide-react';
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
  ownerId?: string;       // asset owner or ride driver — fetch their personal methods
  onSuccess?: () => void;
}

interface PaymentOption {
  id: string;
  label: string;          // display name
  lipaNamba?: string;     // phone / till number
  accountName?: string;
  instructions?: string;
  qrCode?: string | null; // URL
  isSystem?: boolean;
  source: 'system' | 'owner';
}

export default function CheckoutPayment({
  bookingId, bookingType, amount, currency = 'TZS', ownerId, onSuccess
}: CheckoutPaymentProps) {
  const dispatch = useDispatch<AppDispatch>();
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
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
        // 1. System-wide offline methods
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

        // 2. Owner's personal UserPaymentMethods (if ownerId provided)
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

        setOptions([...sysOptions, ...ownerOptions]);
      } catch {
        toast.error('Failed to load payment methods');
      } finally {
        setIsLoadingMethods(false);
      }
    };
    load();
  }, [ownerId]);

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
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOption || !receiptImage) {
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
      // Pass either system method or user method id appropriately
      if (selectedOption.source === 'system') {
        fd.append('payment_method', selectedOption.id);
      } else {
        fd.append('user_payment_method', selectedOption.id);
      }
      fd.append('sender_phone_number', senderPhone);
      if (txnRef) fd.append('transaction_reference', txnRef);
      fd.append('receipt_image', receiptImage);

      await api.post('/payments/manual-payments/', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      toast.success('Payment submitted! We will verify shortly.');
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
    const parts = opt.label.split(' — ');
    const typeLabel = PAYMENT_TYPE_LABELS[parts[0]] || parts[0];
    return parts.length > 1 ? `${typeLabel} — ${parts[1]}` : opt.label;
  };

  return (
    <div className="card overflow-hidden border-2 border-primary-100 shadow-xl max-w-2xl mx-auto">
      {/* Steps */}
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
        {/* Step 1 — Amount Confirmation */}
        {step === 1 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            <h3 className="text-xl font-bold text-gray-900 mb-4 text-center">Confirm Payment Amount</h3>
            <div className="bg-primary-50 p-6 rounded-2xl text-center mb-6">
              <p className="text-sm font-bold text-primary-600 uppercase tracking-widest mb-1">Total Due</p>
              <p className="text-4xl font-black text-gray-900"><Price amount={amount} /></p>
            </div>
            <p className="text-gray-500 text-sm text-center mb-6">
              You have 15 minutes to complete this transaction after proceeding.
            </p>
            <button onClick={() => setStep(2)} className="btn-primary w-full py-3 text-lg">Proceed to Checkout</button>
          </div>
        )}

        {/* Step 2 — Select Method */}
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

            {isLoadingMethods ? (
              <div className="text-center py-8 text-gray-400">Loading payment methods...</div>
            ) : (
              <div className="space-y-3 mb-6">
                {options.length > 0 ? options.map(opt => (
                  <button
                    key={opt.id}
                    onClick={() => { setSelectedOption(opt); setStep(3); }}
                    className="w-full text-left p-4 rounded-xl border-2 border-gray-100 hover:border-primary-300 hover:bg-primary-50 transition-all flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-3">
                      {opt.source === 'system' ? (
                        <Building2 className="h-5 w-5 text-gray-400 shrink-0" />
                      ) : (
                        <Smartphone className="h-5 w-5 text-primary-500 shrink-0" />
                      )}
                      <div>
                        <p className="font-bold text-gray-900 group-hover:text-primary-700">{getFriendlyLabel(opt)}</p>
                        {opt.lipaNamba && <p className="text-xs font-mono text-gray-500">{opt.lipaNamba}</p>}
                      </div>
                    </div>
                    {opt.isSystem && (
                      <span className="bg-gray-100 text-gray-600 text-[10px] uppercase font-bold px-2 py-1 rounded">Official</span>
                    )}
                  </button>
                )) : (
                  <div className="text-center py-10 bg-amber-50 rounded-xl border border-amber-100">
                    <AlertCircle className="h-10 w-10 text-amber-400 mx-auto mb-3" />
                    <p className="text-amber-800 font-bold">No payment methods available right now.</p>
                    <p className="text-amber-600 text-sm mt-1">Please contact support or the asset owner directly to arrange payment.</p>
                  </div>
                )}
              </div>
            )}
            <button onClick={() => setStep(1)} className="text-sm font-bold text-gray-500 hover:text-gray-900">← Back</button>
          </div>
        )}

        {/* Step 3 — Payment Instructions */}
        {step === 3 && selectedOption && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="flex justify-between items-end mb-4">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Payment Instructions</h3>
                <p className="text-gray-500 text-sm">Send exactly <span className="font-bold text-gray-900"><Price amount={amount} /></span> via {getFriendlyLabel(selectedOption)}</p>
              </div>
              <p className={`font-mono font-bold text-lg ${timeLeft < 300 ? 'text-red-500 animate-pulse' : 'text-gray-900'}`}>
                <Timer className="h-4 w-4 inline mr-1 text-gray-400" />{formatTime(timeLeft)}
              </p>
            </div>

            <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-5 mb-6 space-y-4">
              {selectedOption.lipaNamba && (
                <div className="flex items-center justify-between bg-white rounded-lg p-3 shadow-sm">
                  <div>
                    <p className="text-[10px] uppercase font-bold text-gray-400 mb-0.5">Lipa Namba / Number</p>
                    <p className="font-mono text-xl font-black text-indigo-900">{selectedOption.lipaNamba}</p>
                  </div>
                  <button onClick={() => copyToClipboard(selectedOption.lipaNamba!, 'Number')} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors">
                    <Copy className="h-5 w-5" />
                  </button>
                </div>
              )}
              <div className="flex items-center justify-between bg-white rounded-lg p-3 shadow-sm">
                <div>
                  <p className="text-[10px] uppercase font-bold text-gray-400 mb-0.5">Account Name</p>
                  <p className="font-bold text-gray-900">{selectedOption.accountName || 'N/A'}</p>
                </div>
              </div>
              {selectedOption.instructions && (
                <div className="bg-white rounded-lg p-3 shadow-sm">
                  <p className="text-[10px] uppercase font-bold text-gray-400 mb-1">Instructions</p>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{selectedOption.instructions}</p>
                </div>
              )}
              {selectedOption.qrCode && (
                <div className="bg-white rounded-lg p-3 shadow-sm text-center">
                  <p className="text-[10px] uppercase font-bold text-gray-400 mb-2 flex items-center justify-center gap-1"><QrCode className="h-3 w-3" /> Scan QR Code</p>
                  <img src={getMediaUrl(selectedOption.qrCode)} alt="QR Code" className="h-40 w-40 object-contain mx-auto rounded-lg" />
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep(2)} className="btn-secondary py-3 flex-1">Back</button>
              <button onClick={() => setStep(4)} className="btn-primary py-3 flex-[2]">I Have Paid ✓</button>
            </div>
          </div>
        )}

        {/* Step 4 — Submit Receipt */}
        {step === 4 && selectedOption && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="mb-6">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                Submit Verification <CheckCircle className="h-5 w-5 text-green-500" />
              </h3>
              <p className="text-gray-500 text-sm">Upload your payment confirmation receipt</p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Sender Phone *</label>
                  <input type="text" required value={senderPhone} onChange={e => setSenderPhone(e.target.value)} className="input w-full font-mono text-sm" placeholder="e.g. 0712345678" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Transaction Ref (Optional)</label>
                  <input type="text" value={txnRef} onChange={e => setTxnRef(e.target.value)} className="input w-full font-mono text-sm uppercase" placeholder="e.g. TRC12345" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Receipt Screenshot *</label>
                <div className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-xl transition-colors ${receiptImage ? 'border-green-300 bg-green-50' : 'border-gray-300 hover:border-primary-400 hover:bg-primary-50/30'}`}>
                  <div className="space-y-1 text-center">
                    {receiptImage ? <ImageIcon className="mx-auto h-12 w-12 text-green-500" /> : <Upload className="mx-auto h-12 w-12 text-gray-400" />}
                    <div className="flex text-sm text-gray-600 mt-2">
                      <label className="relative cursor-pointer rounded-md font-bold text-primary-600 hover:text-primary-500 focus-within:outline-none">
                        <span>{receiptImage ? 'Change Image' : 'Upload a file'}</span>
                        <input type="file" required accept="image/*" className="sr-only" onChange={e => { if (e.target.files?.[0]) setReceiptImage(e.target.files[0]); }} />
                      </label>
                      {!receiptImage && <p className="pl-1">or drag and drop</p>}
                    </div>
                    <p className="text-xs text-gray-500">{receiptImage ? receiptImage.name : 'PNG, JPG up to 10MB'}</p>
                  </div>
                </div>
              </div>

              <div className="bg-amber-50 rounded-lg p-3 text-sm text-amber-800 flex items-start gap-2 border border-amber-200 mt-2">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <p>Fake receipts will result in immediate account termination and legal action.</p>
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
