import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  FileText,
  CheckCircle,
  CreditCard,
  ChevronRight,
  ChevronLeft,
  Upload,
  ShieldCheck,
  Zap,
  Star,
  Info,
  Loader2,
  Clock
} from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { Price } from '../../context/CurrencyContext';

interface BusinessConfig {
  monthly_price: number;
  yearly_price: number;
  registration_fee: number;
  terms: string;
}

interface Props {
  initialPlan?: 'MONTHLY' | 'YEARLY';
  onCancel?: () => void;
}

export default function BusinessRegistrationForm({ initialPlan = 'MONTHLY', onCancel }: Props) {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isConfigLoading, setIsConfigLoading] = useState(true);
  const [config, setConfig] = useState<BusinessConfig | null>(null);

  const [formData, setFormData] = useState({
    company_name: '',
    registration_number: '',
    tax_id: '',
    country: 'Tanzania',
    plan_type: initialPlan,
    payment_reference: '',
    agreed_to_terms: false
  });

  const [documents, setDocuments] = useState<File[]>([]);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const res = await api.get('/users/business/config/');
      setConfig(res.data);
    } catch (error) {
      console.error('Failed to fetch business config:', error);
      toast.error('Unable to load subscription plans');
    } finally {
      setIsConfigLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setDocuments(prev => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const handleSubmit = async () => {
    if (!formData.agreed_to_terms) {
      toast.error('Please agree to the business terms and conditions');
      return;
    }

    if (documents.length === 0) {
      toast.error('Please upload legal proof of registration');
      return;
    }

    if (!formData.payment_reference) {
      toast.error('Payment reference is required');
      return;
    }

    setIsLoading(true);
    try {
      // 1. Prepare Multipart Form Data
      const finalFormData = new FormData();
      finalFormData.append('company_name', formData.company_name);
      finalFormData.append('registration_number', formData.registration_number);
      finalFormData.append('tax_id', formData.tax_id);
      finalFormData.append('country', formData.country);
      finalFormData.append('plan_type', formData.plan_type);
      finalFormData.append('payment_reference', formData.payment_reference);

      documents.forEach(doc => {
        finalFormData.append('documents', doc);
      });

      // 2. Submit everything in one atomic request
      await api.post('/users/business/register/', finalFormData);

      toast.success('Business application submitted successfully!');
      // Navigate to dashboard where they can see the pending status
      navigate('/business/dashboard');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Submission failed');
    } finally {
      setIsLoading(false);
    }
  };

  if (isConfigLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600 mb-4"></div>
        <p className="text-gray-500 font-bold uppercase tracking-widest text-[10px]">Loading Pricing Plans...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-4 md:py-10 px-4">
      {/* Progress Stepper */}
      <div className="flex items-center justify-center mb-8 overflow-x-auto no-scrollbar pb-2">
        {[
          { s: 1, label: 'Terms', icon: ShieldCheck },
          { s: 2, label: 'Identity', icon: Building2 },
          { s: 3, label: 'Legal', icon: FileText },
          { s: 4, label: 'Payment', icon: CreditCard }
        ].map((item, idx) => (
          <div key={item.s} className="flex items-center flex-shrink-0">
            <div className={`flex flex-col items-center group`}>
              <div className={`h-9 w-9 md:h-12 md:w-12 rounded-xl md:rounded-2xl flex items-center justify-center transition-all ${step >= item.s ? 'bg-primary-600 text-white shadow-lg md:shadow-xl shadow-primary-200' : 'bg-white text-gray-300 border-2 border-gray-100'
                }`}>
                <item.icon className="h-4 w-4 md:h-5 md:w-5" />
              </div>
              <span className={`text-[7px] md:text-[10px] font-black uppercase mt-1.5 tracking-widest ${step >= item.s ? 'text-gray-900' : 'text-gray-300'
                }`}>{item.label}</span>
            </div>
            {idx < 3 && <div className={`w-6 md:w-24 h-0.5 md:h-1 mx-2 md:mx-4 rounded-full ${step > item.s ? 'bg-primary-600' : 'bg-gray-100'}`} />}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-12 items-start">
        {/* Main Form Content */}
        <div className="lg:col-span-7">
          <div className="card p-5 md:p-10 border-none shadow-2xl bg-white min-h-[450px] flex flex-col rounded-[1.5rem] md:rounded-[3rem]">
            {step === 1 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div>
                  <h2 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tighter mb-1">Terms of Business</h2>
                  <p className="text-gray-500 text-xs md:text-sm font-medium">Accept policies before proceeding.</p>
                </div>

                <div className="bg-gray-50 p-4 md:p-6 rounded-xl md:rounded-2xl border-2 border-gray-100 h-48 md:h-64 overflow-y-auto text-[11px] md:text-sm text-gray-600 leading-relaxed space-y-3 font-medium custom-scrollbar">
                  <p className="font-bold text-gray-900 uppercase">1. Verification Standard</p>
                  <p>{config?.terms}</p>
                  <p className="font-bold text-gray-900 uppercase">2. Service Continuity</p>
                  <p>Business accounts require an active subscription. Interruption in payment may lead to immediate delisting of corporate assets.</p>
                  <p className="font-bold text-gray-900 uppercase">3. Legal Responsibility</p>
                  <p>The business entity assumes full legal liability for all services listed. All documentation provided must be authentic.</p>
                </div>

                <div className="flex items-start gap-2 p-4 md:p-6 bg-primary-50 rounded-xl md:rounded-2xl border border-primary-100">
                  <input
                    type="checkbox"
                    id="terms"
                    className="mt-0.5 md:mt-1 h-4 w-4 md:h-5 md:w-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
                    checked={formData.agreed_to_terms}
                    onChange={(e) => setFormData({ ...formData, agreed_to_terms: e.target.checked })}
                  />
                  <label htmlFor="terms" className="text-xs md:text-sm text-primary-900 font-bold leading-tight cursor-pointer">
                    I agree to the Terms & Conditions and the manual verification protocol.
                  </label>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                <div>
                  <h2 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tighter mb-1">Company Identity</h2>
                  <p className="text-gray-500 text-xs md:text-sm font-medium">Enter your official business details.</p>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-[9px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block">Official Company Name</label>
                    <input
                      type="text"
                      className="input py-3 md:py-4 font-bold text-base md:text-lg"
                      placeholder="e.g. Grand Plaza Hotels Ltd"
                      value={formData.company_name}
                      onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[9px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block">Reg. Number</label>
                      <input
                        type="text"
                        className="input font-bold"
                        placeholder="Business License ID"
                        value={formData.registration_number}
                        onChange={(e) => setFormData({ ...formData, registration_number: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="text-[9px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block">Tax ID / TIN</label>
                      <input
                        type="text"
                        className="input font-bold"
                        placeholder="VAT Number"
                        value={formData.tax_id}
                        onChange={(e) => setFormData({ ...formData, tax_id: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                <div>
                  <h2 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tighter mb-1">Legal Compliance</h2>
                  <p className="text-gray-500 text-xs md:text-sm font-medium">Upload proof of authorization stamped by a lawyer.</p>
                </div>
                <div className="space-y-4">
                  <div className="p-6 md:p-8 border-4 border-dashed border-gray-100 rounded-2xl md:rounded-[2.5rem] bg-gray-50/50 text-center group hover:border-primary-200 transition-all">
                    <input
                      type="file"
                      id="doc-upload"
                      multiple
                      className="hidden"
                      onChange={handleFileChange}
                    />
                    <label htmlFor="doc-upload" className="cursor-pointer flex flex-col items-center">
                      <div className="h-12 w-12 md:h-16 md:w-16 bg-white rounded-2xl md:rounded-3xl flex items-center justify-center mb-3 md:mb-4 shadow-sm group-hover:scale-110 transition-transform">
                        <Upload className="h-6 w-6 md:h-8 md:w-8 text-primary-600" />
                      </div>
                      <p className="text-xs md:text-sm font-black text-gray-900 tracking-tight">Browse Files</p>
                      <p className="text-[8px] md:text-[10px] text-gray-400 font-bold mt-1.5 uppercase">PDF, JPG, or PNG (Max 10MB)</p>
                    </label>
                  </div>

                  {documents.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-[9px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Ready for upload ({documents.length})</p>
                      {documents.map((doc, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 md:p-4 bg-white border-2 border-gray-50 rounded-xl md:rounded-2xl">
                          <div className="flex items-center gap-2 md:gap-3 overflow-hidden">
                            <FileText className="h-4 w-4 md:h-5 md:w-5 text-primary-600 flex-shrink-0" />
                            <span className="text-[10px] md:text-xs font-bold text-gray-700 truncate">{doc.name}</span>
                          </div>
                          <CheckCircle className="h-3.5 w-3.5 md:h-4 md:w-4 text-emerald-500 flex-shrink-0" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
                <div>
                  <h2 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tighter mb-1">Payment Verification</h2>
                  <p className="text-gray-500 text-xs md:text-sm font-medium">Complete {formData.plan_type.toLowerCase()} plan via Zenopay.</p>
                </div>

                <div className="p-5 md:p-8 bg-gray-900 rounded-2xl md:rounded-[2.5rem] text-white relative overflow-hidden shadow-2xl">
                  <div className="absolute top-0 right-0 w-40 h-40 bg-primary-600/20 rounded-full blur-3xl -mr-20 -mt-20" />
                  <div className="relative space-y-4 md:space-y-6">
                    <div className="flex justify-between items-center border-b border-white/10 pb-4 md:pb-6">
                      <div>
                        <p className="text-[8px] md:text-[10px] font-black text-primary-400 uppercase tracking-widest">Plan</p>
                        <h3 className="text-lg md:text-2xl font-black">{formData.plan_type}</h3>
                      </div>
                      <div className="text-right">
                        <p className="text-[8px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest">Due</p>
                        <p className="text-lg md:text-2xl font-black text-emerald-400">
                          <Price amount={formData.plan_type === 'MONTHLY' ? config?.monthly_price || 0 : config?.yearly_price || 0} />
                        </p>
                      </div>
                    </div>

                    <div className="space-y-3 md:space-y-4">
                      <p className="text-[10px] md:text-xs text-gray-400 leading-relaxed italic">
                        Transfer total to KIBOSS Corporate account. Enter transaction reference below.
                      </p>
                      <div>
                        <label className="text-[9px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block">Zenopay Transaction Reference</label>
                        <input
                          type="text"
                          className="w-full bg-white/5 border border-white/10 rounded-xl md:rounded-2xl p-3 md:p-4 text-primary-400 font-black text-base md:text-lg focus:ring-2 focus:ring-primary-500 focus:outline-none placeholder:text-gray-700"
                          placeholder="e.g. ZNP-882-991-X"
                          value={formData.payment_reference}
                          onChange={(e) => setFormData({ ...formData, payment_reference: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-auto pt-8 flex gap-3 flex-col sm:flex-row">
              <button
                onClick={() => step === 1 ? (onCancel ? onCancel() : navigate(-1)) : setStep(step - 1)}
                className="order-2 sm:order-1 px-6 py-3 md:py-4 bg-white border-2 border-gray-100 rounded-xl md:rounded-2xl font-black text-gray-400 uppercase tracking-widest hover:bg-gray-50 transition-all flex items-center justify-center gap-2 text-xs"
              >
                <ChevronLeft className="h-3 w-3 md:h-4 md:w-4" /> {step === 1 ? 'Cancel' : 'Back'}
              </button>

              {step < 4 ? (
                <button
                  onClick={() => {
                    if (step === 1 && !formData.agreed_to_terms) {
                      toast.error('Please accept the terms to continue');
                      return;
                    }
                    if (step === 2 && (!formData.company_name || !formData.registration_number)) {
                      toast.error('Please fill in company details');
                      return;
                    }
                    setStep(step + 1);
                  }}
                  className="order-1 sm:order-2 btn-primary flex-1 py-3 md:py-4 text-xs md:text-sm font-black uppercase tracking-widest shadow-xl shadow-primary-500/20 flex items-center justify-center gap-2"
                >
                  Continue <ChevronRight className="h-3 w-3 md:h-4 md:w-4" />
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={isLoading}
                  className="order-1 sm:order-2 btn-primary flex-1 py-3 md:py-4 text-xs md:text-sm font-black uppercase tracking-widest shadow-xl shadow-primary-500/20 flex items-center justify-center gap-3"
                >
                  {isLoading ? <div className="animate-spin rounded-full h-4 w-4 md:h-5 md:w-5 border-b-2 border-white"></div> : <ShieldCheck className="h-4 w-4 md:h-5 md:w-5" />}
                  Submit Application
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar Info */}
        <div className="hidden lg:block lg:col-span-5 space-y-6">
          <div className="card p-8 border-none bg-primary-900 text-white overflow-hidden relative shadow-2xl rounded-[3rem]">
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-primary-600/20 to-transparent" />
            <div className="relative space-y-6">
              <h3 className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-primary-400" /> Business Benefits
              </h3>
              <ul className="space-y-4">
                {[
                  { t: "Institutional Trust", d: "Get the indigo 'Business' badge on all your listings." },
                  { t: "Parent-Child Hierarchy", d: "Manage rooms, halls, and dining within properties." },
                  { t: "Priority Ops Review", d: "Corporate assets get fast-tracked during verification." }
                ].map((item, idx) => (
                  <li key={idx} className="flex gap-3">
                    <div className="h-5 w-5 bg-primary-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <CheckCircle className="h-3 w-3 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-black tracking-tight">{item.t}</p>
                      <p className="text-xs text-primary-200 font-medium leading-relaxed">{item.d}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="card p-8 border-none bg-gray-50 border border-gray-100 space-y-4 rounded-[3rem]">
            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Compliance Notice</h4>
            <div className="flex gap-3">
              <Info className="h-5 w-5 text-gray-400 flex-shrink-0" />
              <p className="text-[11px] text-gray-500 font-medium leading-relaxed">
                All legal proof must be stamped by an authorized legal professional. Applications with missing stamps or blurred documents will be rejected automatically.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
