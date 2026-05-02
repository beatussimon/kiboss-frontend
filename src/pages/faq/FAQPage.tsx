import { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, HelpCircle, Send } from 'lucide-react';
import FeedbackForm from '../../components/common/FeedbackForm';
import api from '../../services/api';

interface FAQItem {
  id?: number;
  question: string;
  answer: string;
}

export default function FAQPage() {
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({});
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [faqs, setFaqs] = useState<FAQItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchFaqs = async () => {
      try {
        const response = await api.get('/common/faq/');
        setFaqs(response.data.results || response.data);
      } catch (error) {
        console.error('Failed to fetch FAQs:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchFaqs();
  }, []);

  const toggleItem = (itemIndex: number) => {
    const key = `item-${itemIndex}`;
    setOpenItems(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  return (
    <div className="max-w-4xl mx-auto py-10 px-4">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-black text-gray-900 tracking-tighter mb-4">Frequently Asked Questions</h1>
        <p className="text-gray-500 font-medium">Find answers to common questions about using KIBOSS</p>
      </div>

      <div className="space-y-6">
        {isLoading ? (
          <div className="flex justify-center p-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : faqs.length === 0 ? (
          <div className="text-center p-12 text-gray-500 dark:text-gray-400">
            No FAQs available at the moment. Please check back later.
          </div>
        ) : (
          <div className="card overflow-hidden border-none shadow-sm ring-1 ring-gray-100">
            <div className="bg-gray-50 dark:bg-gray-900 px-6 py-4 border-b border-gray-100 dark:border-gray-800">
              <h2 className="text-sm font-black text-gray-900 uppercase tracking-widest flex items-center gap-2">
                <HelpCircle className="h-5 w-5" />
                General Questions
              </h2>
            </div>
            <div className="divide-y divide-gray-50">
              {faqs.map((item, itemIndex) => {
                const isOpen = openItems[`item-${itemIndex}`];
                return (
                  <div key={itemIndex} className="border-gray-100 dark:border-gray-800">
                    <button
                      onClick={() => toggleItem(itemIndex)}
                      className="w-full px-6 py-5 text-left flex items-center justify-between hover:bg-gray-50/50 transition-colors"
                    >
                      <span className="font-bold text-gray-700 dark:text-gray-200">{item.question}</span>
                      {isOpen ? (
                        <ChevronUp className="h-4 w-4 text-primary-600 flex-shrink-0" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-gray-400 flex-shrink-0" />
                      )}
                    </button>
                    {isOpen && (
                      <div className="px-6 pb-6 animate-in fade-in slide-in-from-top-1">
                        <p className="text-sm text-gray-500 font-medium leading-relaxed whitespace-pre-wrap">{item.answer}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <div className="card p-10 mt-12 text-center bg-primary-900 text-white border-none shadow-2xl relative overflow-hidden rounded-[2.5rem]">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary-600/20 rounded-full blur-3xl -mr-32 -mt-32" />
        <div className="relative space-y-6">
          <h3 className="text-2xl font-black tracking-tighter">Still have questions?</h3>
          <p className="text-primary-100 font-medium max-w-lg mx-auto">Can't find the answer you're looking for? Message our team directly and we'll help you out.</p>
          <button 
            onClick={() => setIsFeedbackOpen(true)}
            className="btn-primary bg-white text-primary-900 hover:bg-gray-100 border-none px-10 py-4 rounded-2xl flex items-center gap-2 mx-auto shadow-xl"
          >
            <Send className="h-5 w-5" />
            <span className="font-black uppercase tracking-widest">Message Us Now</span>
          </button>
        </div>
      </div>

      <FeedbackForm 
        isOpen={isFeedbackOpen} 
        onClose={() => setIsFeedbackOpen(false)} 
      />
    </div>
  );
}
