import { useState } from 'react';
import { MessageSquare, X, Send, CheckCircle } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  initialSubject?: string;
  category?: 'VERIFICATION' | 'TECHNICAL' | 'BILLING' | 'SUGGESTION' | 'OTHER';
}

export default function FeedbackForm({ isOpen, onClose, initialSubject = '', category = 'OTHER' }: Props) {
  const [formData, setFormData] = useState({
    subject: initialSubject,
    message: '',
    category: category
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.post('/common/feedbacks/', formData);
      setIsSuccess(true);
      toast.success('Message sent to our team!');
      setTimeout(() => {
        onClose();
        setIsSuccess(false);
        setFormData({ ...formData, message: '' });
      }, 2000);
    } catch (error) {
      toast.error('Failed to send message. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden relative border border-gray-100 dark:border-gray-800">
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 p-2 text-gray-400 hover:text-gray-600 bg-gray-50 dark:bg-gray-900 rounded-xl transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="p-10">
          {isSuccess ? (
            <div className="text-center py-10 space-y-4 animate-in zoom-in-95 duration-500">
              <div className="h-20 w-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="h-10 w-10" />
              </div>
              <h3 className="text-2xl font-black text-gray-900 tracking-tighter">Message Received</h3>
              <p className="text-gray-500 font-medium">Our feedback team will review your inquiry and update the FAQ accordingly.</p>
            </div>
          ) : (
            <div className="space-y-8">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-primary-600">
                  <MessageSquare className="h-5 w-5" />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em]">Feedback & Support</span>
                </div>
                <h2 className="text-3xl font-black text-gray-900 tracking-tighter leading-none">How can we help?</h2>
                <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Your input helps us improve KIBOSS for everyone.</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Subject</label>
                  <input 
                    type="text" 
                    className="input font-bold"
                    placeholder="Brief summary of your inquiry"
                    value={formData.subject}
                    onChange={e => setFormData({...formData, subject: e.target.value})}
                    required
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Category</label>
                  <select 
                    className="input font-bold"
                    value={formData.category}
                    onChange={e => setFormData({...formData, category: e.target.value as any})}
                  >
                    <option value="VERIFICATION">Verification Issue</option>
                    <option value="TECHNICAL">Technical Problem</option>
                    <option value="BILLING">Billing/Payment</option>
                    <option value="SUGGESTION">Suggestion</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Message</label>
                  <textarea 
                    className="input min-h-[120px] font-medium py-4"
                    placeholder="Tell us more about what's happening..."
                    value={formData.message}
                    onChange={e => setFormData({...formData, message: e.target.value})}
                    required
                  />
                </div>

                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full btn-primary py-4 rounded-2xl flex items-center justify-center gap-3 shadow-xl shadow-primary-500/20"
                >
                  {isSubmitting ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  ) : (
                    <>
                      <Send className="h-5 w-5" />
                      <span className="font-black uppercase tracking-widest">Send Message</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
