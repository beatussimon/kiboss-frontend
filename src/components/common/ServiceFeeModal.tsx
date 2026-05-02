import React, { useState } from 'react';
import { Info, X, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

interface ServiceFeeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ServiceFeeModal({ isOpen, onClose }: ServiceFeeModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md overflow-hidden relative animate-in zoom-in-95 duration-300">
        <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-2 text-gray-900 dark:text-white">
            <ShieldCheck className="h-5 w-5 text-primary-600" />
            <h3 className="font-bold text-lg">Service Fee Details</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:bg-gray-200 hover:text-gray-600 rounded-full transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="p-6">
          <p className="text-gray-700 leading-relaxed text-sm mb-6">
            The service fee is for incase someone boorrows then causes damage or issues with a rental and is refundable when giving back a rental.
          </p>
          
          <div className="bg-primary-50 text-primary-800 p-4 rounded-xl text-sm font-medium border border-primary-100 mb-6">
            This fee helps us maintain a secure platform and provide reliable support for both owners and renters.
          </div>
          
          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              Close
            </button>
            <Link
              to="/faq"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl font-bold text-white bg-primary-600 hover:bg-primary-700 transition-colors shadow-sm"
            >
              Learn More
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ServiceFeeTrigger() {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="text-gray-500 hover:text-primary-600 flex items-center gap-1 transition-colors border-b border-dashed border-gray-400 hover:border-primary-400 group focus:outline-none"
      >
        Service fee
        <Info className="h-3.5 w-3.5 text-gray-400 group-hover:text-primary-500" />
      </button>
      <ServiceFeeModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
