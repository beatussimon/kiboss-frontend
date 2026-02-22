import { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Facebook, Twitter, Instagram, Linkedin, 
  Globe, ChevronDown 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCurrency } from '../../context/CurrencyContext';

export default function Footer() {
  const { currency } = useCurrency();
  const [openSection, setOpenSection] = useState<string | null>(null);

  const toggleSection = (section: string) => {
    setOpenSection(openSection === section ? null : section);
  };

  interface FooterLink {
    label: string;
    href: string;
    badge?: string;
  }

  const footerLinks: Record<string, FooterLink[]> = {
    solutions: [
      { label: 'Rental Assets', href: '/assets' },
      { label: 'Ride Sharing', href: '/rides' },
      { label: 'Business+ PRO', href: '/business', badge: 'PRO' },
    ],
    resources: [
      { label: 'Help Center', href: '/faq' },
      { label: 'How it works', href: '/faq' },
      { label: 'Safety Standards', href: '/help' },
    ],
    company: [
      { label: 'About Us', href: '/about' },
      { label: 'Careers', href: '/careers' },
      { label: 'Press', href: '/press' },
    ]
  };

  return (
    <footer className="bg-white border-t border-gray-100 pt-6 pb-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Brand Section - Centered on Desktop */}
        <div className="flex flex-col items-center text-center mb-4 space-y-3">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="h-10 w-10 bg-primary-600 rounded-xl flex items-center justify-center shadow-lg shadow-primary-200 rotate-3 group-hover:rotate-6 transition-transform duration-300">
              <span className="text-white font-black text-xl -rotate-3">K</span>
            </div>
            <span className="text-2xl font-black tracking-tighter text-gray-900 uppercase">KIBOSS</span>
          </Link>
          <p className="text-gray-500 text-sm font-medium leading-relaxed max-w-lg">
            The universal operating system for rentals and sharing. Empowering communities to list anything and rent everything securely.
          </p>
          <div className="flex gap-4">
            {[Facebook, Twitter, Instagram, Linkedin].map((Icon, i) => (
              <a key={i} href="#" className="h-8 w-8 flex items-center justify-center rounded-full bg-gray-50 text-gray-400 hover:bg-primary-50 hover:text-primary-600 transition-all">
                <Icon className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>

        {/* Desktop Links Grid - Balanced 3 Columns */}
        <div className="hidden lg:grid grid-cols-3 gap-12 mb-6 border-t border-gray-50 pt-6 text-center">
          {Object.entries(footerLinks).map(([key, links]) => (
            <div key={key}>
              <h4 className="font-black text-gray-900 text-[10px] uppercase tracking-[0.2em] mb-3">{key}</h4>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link to={link.href} className="text-sm font-medium text-gray-500 hover:text-primary-600 transition-colors flex items-center justify-center gap-2">
                      {link.label}
                      {link.badge && <span className="bg-primary-50 text-primary-700 text-[9px] font-black px-1.5 py-0.5 rounded">{link.badge}</span>}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Mobile Accordions */}
        <div className="lg:hidden space-y-2 mb-6">
          {Object.entries(footerLinks).map(([key, links]) => (
            <div key={key} className="border-b border-gray-100 last:border-0">
              <button 
                onClick={() => toggleSection(key)}
                className="w-full flex items-center justify-between py-3 text-left group"
              >
                <span className="font-black text-gray-900 text-xs uppercase tracking-wider group-hover:text-primary-600 transition-colors">{key}</span>
                <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform duration-300 ${openSection === key ? 'rotate-180 text-primary-600' : ''}`} />
              </button>
              <AnimatePresence>
                {openSection === key && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <ul className="pb-4 space-y-2">
                      {links.map((link) => (
                        <li key={link.label}>
                          <Link to={link.href} className="text-sm font-medium text-gray-500 hover:text-primary-600 flex items-center gap-2">
                            {link.label}
                            {link.badge && <span className="bg-primary-50 text-primary-700 text-[9px] font-black px-1.5 py-0.5 rounded">{link.badge}</span>}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>

        {/* Bottom Bar */}
        <div className="pt-4 border-t border-gray-100 flex flex-col lg:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap justify-center gap-6">
            <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400">
              <Globe className="h-3.5 w-3.5" />
              <span>English (US)</span>
            </div>
            <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 cursor-pointer hover:text-primary-600">
              <span>{currency.code} ({currency.symbol})</span>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <p className="text-[10px] font-medium text-gray-400">© {new Date().getFullYear()} KIBOSS Inc.</p>
            <div className="hidden sm:flex items-center gap-4 text-gray-300">
              <Link to="/privacy" className="text-[10px] hover:text-gray-900">Privacy</Link>
              <Link to="/terms" className="text-[10px] hover:text-gray-900">Terms</Link>
              <Link to="/sitemap" className="text-[10px] hover:text-gray-900">Sitemap</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
