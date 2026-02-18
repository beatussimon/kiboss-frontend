import { useState } from 'react';
import { ChevronDown, ChevronUp, HelpCircle, Car, Home, CreditCard, Shield, MessageCircle, User } from 'lucide-react';

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
    title: 'General',
    icon: <HelpCircle className="h-5 w-5" />,
    items: [
      {
        question: 'What is KIBOSS?',
        answer: 'KIBOSS is a universal rental and sharing platform that allows you to list, discover, and book various assets including rooms, tools, vehicles, and ride-sharing services. Our platform connects owners with renters in a secure and trusted environment.'
      },
      {
        question: 'How do I create an account?',
        answer: 'Click the "Sign Up" button in the navigation bar and fill in your details. You\'ll need to verify your email address before you can start using the platform. After verification, you can complete your profile to build trust with other users.'
      },
      {
        question: 'Is KIBOSS free to use?',
        answer: 'Creating an account and browsing listings is free. KIBOSS charges a small service fee on completed bookings to maintain the platform and provide secure payment processing. The exact fee is displayed before you confirm any booking.'
      },
      {
        question: 'What payment methods are accepted?',
        answer: 'We accept major credit and debit cards, mobile money (M-Pesa, etc.), and bank transfers in supported regions. All payments are processed securely through our platform.'
      }
    ]
  },
  {
    title: 'Listings & Assets',
    icon: <Home className="h-5 w-5" />,
    items: [
      {
        question: 'How do I list my asset?',
        answer: 'Navigate to "Create Asset" from your dashboard or the navigation menu. Fill in the details about your asset including location, pricing, availability, and photos. Your listing will be reviewed and verified before going live.'
      },
      {
        question: 'What types of assets can I list?',
        answer: 'You can list various types of assets including: Rooms/Spaces (apartments, offices, event venues), Tools/Equipment (construction tools, electronics), Vehicles (cars, bikes, boats), and Time-based Services (consultations, lessons).'
      },
      {
        question: 'How do I edit or remove my listing?',
        answer: 'Go to your profile page, find the listing you want to modify, and click "Edit". You can update any details or deactivate the listing temporarily. To permanently remove a listing, click "Delete" from the edit page.'
      },
      {
        question: 'Why is my listing not showing?',
        answer: 'Listings need to be verified before they appear in search results. This usually takes 24-48 hours. Make sure your listing has all required information and clear photos. Contact support if your listing hasn\'t been approved after 48 hours.'
      }
    ]
  },
  {
    title: 'Ride-Sharing',
    icon: <Car className="h-5 w-5" />,
    items: [
      {
        question: 'How do I offer a ride?',
        answer: 'Click "Offer a Ride" from the navigation menu. Enter your route details, departure time, available seats, and price per seat. You can also add intermediate stops along your route. Passengers can then book available seats.'
      },
      {
        question: 'How do I book a seat in a ride?',
        answer: 'Browse available rides from the Rides page. Select a ride that matches your route and schedule, choose your seat(s), and complete the booking with payment. You\'ll receive the driver\'s contact information after booking.'
      },
      {
        question: 'Can I cancel a ride booking?',
        answer: 'Yes, you can cancel a booking up to the cutoff time set by the driver (usually 2 hours before departure). Go to your bookings, find the ride, and click "Cancel". Refund policies vary based on cancellation timing.'
      },
      {
        question: 'What if the driver doesn\'t show up?',
        answer: 'If a driver doesn\'t show up, you can report the incident through your booking. You\'ll receive a full refund, and the driver may face penalties. Always communicate with the driver through our platform for documentation.'
      }
    ]
  },
  {
    title: 'Bookings & Payments',
    icon: <CreditCard className="h-5 w-5" />,
    items: [
      {
        question: 'How does the booking process work?',
        answer: 'Select an asset or ride, choose your dates/time, and submit a booking request. For assets, the owner must approve your request. For rides, booking is instant if seats are available. Payment is held securely until the booking is completed.'
      },
      {
        question: 'When am I charged for a booking?',
        answer: 'For instant bookings (rides), you\'re charged immediately. For request-based bookings (assets), you\'re charged only after the owner approves your request. Payment is held in escrow until the service is completed.'
      },
      {
        question: 'How do refunds work?',
        answer: 'Refunds are processed based on the cancellation policy of each listing. If you cancel within the free cancellation period, you\'ll receive a full refund. Refunds typically take 5-7 business days to appear in your account.'
      },
      {
        question: 'Are my payments secure?',
        answer: 'Yes, all payments are processed through secure, encrypted payment gateways. We never store your full card details. Payments are held in escrow until both parties confirm the booking is complete.'
      }
    ]
  },
  {
    title: 'Trust & Safety',
    icon: <Shield className="h-5 w-5" />,
    items: [
      {
        question: 'How does the verification system work?',
        answer: 'Users can verify their identity through email, phone number, and government ID. Verified users get a badge on their profile. Higher verification levels unlock more features and build trust with other users.'
      },
      {
        question: 'What is the trust score?',
        answer: 'Your trust score is calculated based on reviews, verification status, booking history, and response rate. A higher trust score makes your listings more visible and helps other users feel confident booking with you.'
      },
      {
        question: 'How do I report a problem?',
        answer: 'You can report problems through the booking details page or by contacting support. For safety concerns, use the "Report" button on user profiles. All reports are reviewed within 24 hours.'
      },
      {
        question: 'What happens if something is damaged?',
        answer: 'Report damage immediately through the platform. Our dispute resolution team will review the case. We recommend taking photos before and after rentals. Security deposits may be used to cover damages.'
      }
    ]
  },
  {
    title: 'Messaging',
    icon: <MessageCircle className="h-5 w-5" />,
    items: [
      {
        question: 'How do I contact a listing owner?',
        answer: 'Click "Contact Owner" or "Message Seller" on any listing to start a conversation. All messages are sent through our secure messaging system. You\'ll need to be logged in to send messages.'
      },
      {
        question: 'Can I share my contact details?',
        answer: 'For your safety, we recommend keeping all communication on the platform until a booking is confirmed. Sharing personal contact information before booking is at your own risk.'
      },
      {
        question: 'Why can\'t I send a message?',
        answer: 'Messaging requires a verified account. Make sure your email is verified. Some users may have messaging restrictions based on their account status. Contact support if you continue to have issues.'
      }
    ]
  },
  {
    title: 'Account & Profile',
    icon: <User className="h-5 w-5" />,
    items: [
      {
        question: 'How do I update my profile?',
        answer: 'Click on your profile picture in the navigation bar and select "Profile". From there, you can edit your personal information, add a bio, update your location, and upload a profile photo.'
      },
      {
        question: 'How do I change my password?',
        answer: 'Go to your profile settings and click "Change Password". You\'ll need to enter your current password and the new password. If you\'ve forgotten your password, use the "Forgot Password" link on the login page.'
      },
      {
        question: 'Can I delete my account?',
        answer: 'Yes, you can request account deletion from your profile settings. Note that this action is irreversible. Make sure to complete any pending bookings before requesting deletion. Some data may be retained for legal purposes.'
      },
      {
        question: 'How do I become a verified user?',
        answer: 'Go to your profile and click "Get Verified". Complete the verification steps including email verification, phone verification, and optionally ID verification. Each verification level increases your trust score and visibility.'
      }
    ]
  }
];

export default function FAQPage() {
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({});

  const toggleItem = (categoryIndex: number, itemIndex: number) => {
    const key = `${categoryIndex}-${itemIndex}`;
    setOpenItems(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h1>
        <p className="text-gray-600">Find answers to common questions about using KIBOSS</p>
      </div>

      <div className="space-y-6">
        {faqCategories.map((category, categoryIndex) => (
          <div key={categoryIndex} className="card overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                {category.icon}
                {category.title}
              </h2>
            </div>
            <div className="divide-y">
              {category.items.map((item, itemIndex) => {
                const isOpen = openItems[`${categoryIndex}-${itemIndex}`];
                return (
                  <div key={itemIndex} className="border-gray-100">
                    <button
                      onClick={() => toggleItem(categoryIndex, itemIndex)}
                      className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
                    >
                      <span className="font-medium text-gray-900">{item.question}</span>
                      {isOpen ? (
                        <ChevronUp className="h-5 w-5 text-gray-500 flex-shrink-0" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-gray-500 flex-shrink-0" />
                      )}
                    </button>
                    {isOpen && (
                      <div className="px-6 pb-4">
                        <p className="text-gray-600">{item.answer}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="card p-6 mt-8 text-center">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Still have questions?</h3>
        <p className="text-gray-600 mb-4">Can't find the answer you're looking for? Please contact our support team.</p>
        <a href="mailto:support@kiboss.com" className="btn-primary inline-block">
          Contact Support
        </a>
      </div>
    </div>
  );
}
