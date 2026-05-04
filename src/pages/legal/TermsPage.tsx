import React from 'react';

export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto py-12 px-6">
      <div className="mb-10">
        <h1 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Terms & Conditions</h1>
        <p className="text-gray-400 mt-2 font-medium">Last updated: January 2025</p>
      </div>
      
      {[
        {
          title: '1. Platform Role',
          body: 'KIBOSS is a marketplace platform that connects users who wish to rent goods, services, and transport. KIBOSS acts solely as an intermediary. We do not own, operate, or control any of the listings, vehicles, properties, or services offered through the platform.'
        },
        {
          title: '2. User Liability',
          body: 'All users are fully and solely responsible for their own actions, listings, bookings, and interactions with other users. By using KIBOSS, you agree that you are engaging with other users at your own risk and that any disputes, damages, losses, or issues arising from a rental or booking are your responsibility to resolve directly with the other party.'
        },
        {
          title: '3. No Liability',
          body: 'KIBOSS, its directors, employees, agents, and affiliates accept no liability whatsoever for: loss or damage to property, personal injury, financial loss, missed appointments, service failures, or any other outcome arising from use of the platform. We provide the technology — users are responsible for exercising their own judgment, conducting their own due diligence, and taking appropriate precautions.'
        },
        {
          title: '4. Payments',
          body: 'All payments are made directly between users via offline methods (M-Pesa, bank transfer, or cash). KIBOSS does not process, hold, or transfer any funds. Payment confirmation and disputes are between the relevant parties. KIBOSS may assist in dispute resolution as a neutral third party but is not obligated to do so.'
        },
        {
          title: '5. Verification',
          body: 'KIBOSS may offer optional identity and asset verification services. Verified status does not constitute a guarantee, endorsement, or warranty of any kind. Verification reduces risk but does not eliminate it.'
        },
        {
          title: '6. Listings Accuracy',
          body: 'Owners are responsible for the accuracy, truthfulness, and legality of their listings. KIBOSS reserves the right to remove any listing without notice.'
        },
        {
          title: '7. Governing Law',
          body: 'These terms are governed by the laws of the United Republic of Tanzania. Any disputes shall be resolved under Tanzanian jurisdiction.'
        },
        {
          title: '8. Acceptance',
          body: 'By creating an account or making a booking, you confirm that you have read, understood, and agree to these terms in full.'
        }
      ].map(section => (
        <div key={section.title} className="mb-8">
          <h2 className="text-base font-black text-gray-900 dark:text-white uppercase tracking-tight mb-2">{section.title}</h2>
          <p className="text-gray-600 dark:text-gray-300 leading-relaxed font-medium text-sm">{section.body}</p>
        </div>
      ))}
    </div>
  );
}
