import { useState } from 'react';
import { ChevronDown, ChevronUp, HelpCircle, Car, Home, CreditCard, Shield, MessageCircle, User, Briefcase, Send } from 'lucide-react';
import FeedbackForm from '../../components/common/FeedbackForm';

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQCategory {
  title: string;
  icon: React.ReactNode;
  items: FAQItem[];
}

const faqCategories: FAQCategory[] = [
  {
    title: 'Business & Verification',
    icon: <Briefcase className="h-5 w-5" />,
    items: [
      {
        question: 'How do I register as a business?',
        answer: 'Navigate to the "Business" section in your dashboard. You can choose a subscription plan and provide your company details, including registration number and tax ID.'
      },
      {
        question: 'What documents are required for business verification?',
        answer: 'You need to upload clear, stamped copies of your Business License, Tax Clearance, and proof of authorization. Our team manually reviews these documents.'
      },
      {
        question: 'How long does verification take?',
        answer: 'Identity and vehicle verifications typically take 24-48 hours. Business applications may take 3-5 business days depending on the complexity of the documentation.'
      },
      {
        question: 'Can I edit my info while verification is in progress?',
        answer: 'Yes! You can go to your Business Dashboard and click "Edit Application" to update your company details if you notice any errors while your review is still pending.'
      }
    ]
  },
  {
    title: 'General',
    icon: <HelpCircle className="h-5 w-5" />,
    items: [
      {
        question: 'What is KIBOSS?',
        answer: 'KIBOSS is a universal rental and sharing platform that allows you to list, discover, and book various assets including rooms, tools, vehicles, and ride-sharing services.'
      },
      {
        question: 'How do I create an account?',
        answer: 'Click the "Sign Up" button in the navigation bar and fill in your details. You\'ll need to verify your email address before you can start using the platform.'
      },
      {
        question: 'Is KIBOSS free to use?',
        answer: 'Creating an account and browsing listings is free. KIBOSS charges a small service fee on completed bookings to maintain the platform.'
      }
    ]
  },
  {
    title: 'Listings & Assets',
    icon: <Home className="h-5 w-5" />,
    items: [
      {
        question: 'How do I list my asset?',
        answer: 'Navigate to "Create Asset" from your dashboard. Fill in the details about your asset including location, pricing, availability, and photos.'
      },
      {
        question: 'What types of assets can I list?',
        answer: 'You can list various types of assets including Rooms/Spaces, Tools/Equipment, Vehicles, and Time-based Services.'
      }
    ]
  },
  {
    title: 'Ride-Sharing',
    icon: <Car className="h-5 w-5" />,
    items: [
      {
        question: 'How do I offer a ride?',
        answer: 'Click "Offer a Ride" from the navigation menu. Enter your route details, departure time, available seats, and price per seat.'
      },
      {
        question: 'How do I book a seat in a ride?',
        answer: 'Browse available rides from the Rides page. Select a ride, choose your seat(s), and complete the booking with payment.'
      }
    ]
  },
  {
    title: 'Bookings & Payments',
    icon: <CreditCard className="h-5 w-5" />,
    items: [
      {
        question: 'How does the booking process work?',
        answer: 'Select an asset or ride, choose your dates/time, and submit a request. For rides, booking is instant if seats are available.'
      },
      {
        question: 'Are my payments secure?',
        answer: 'Yes, all payments are processed through secure, encrypted payment gateways. Payments are held in escrow until the booking is complete.'
      }
    ]
  },
  {
    title: 'Trust & Safety',
    icon: <Shield className="h-5 w-5" />,
    items: [
      {
        question: 'How does the verification system work?',
        answer: 'Users can verify their identity through email, phone number, and government ID. Verified users get a badge on their profile.'
      },
      {
        question: 'How do I report a problem?',
        answer: 'You can report problems through the booking details page or by contacting support. All reports are reviewed within 24 hours.'
      }
    ]
  }
];

export default function FAQPage() {
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({});
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);

  const toggleItem = (categoryIndex: number, itemIndex: number) => {
    const key = `${categoryIndex}-${itemIndex}`;
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
        {faqCategories.map((category, categoryIndex) => (
          <div key={categoryIndex} className="card overflow-hidden border-none shadow-sm ring-1 ring-gray-100">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-100">
              <h2 className="text-sm font-black text-gray-900 uppercase tracking-widest flex items-center gap-2">
                {category.icon}
                {category.title}
              </h2>
            </div>
            <div className="divide-y divide-gray-50">
              {category.items.map((item, itemIndex) => {
                const isOpen = openItems[`${categoryIndex}-${itemIndex}`];
                return (
                  <div key={itemIndex} className="border-gray-100">
                    <button
                      onClick={() => toggleItem(categoryIndex, itemIndex)}
                      className="w-full px-6 py-5 text-left flex items-center justify-between hover:bg-gray-50/50 transition-colors"
                    >
                      <span className="font-bold text-gray-700">{item.question}</span>
                      {isOpen ? (
                        <ChevronUp className="h-4 w-4 text-primary-600 flex-shrink-0" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-gray-400 flex-shrink-0" />
                      )}
                    </button>
                    {isOpen && (
                      <div className="px-6 pb-6 animate-in fade-in slide-in-from-top-1">
                        <p className="text-sm text-gray-500 font-medium leading-relaxed">{item.answer}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
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
