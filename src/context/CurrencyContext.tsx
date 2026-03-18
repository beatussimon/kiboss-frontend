import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type CurrencyCode = 'TZS' | 'KES';

interface CurrencyInfo {
  code: CurrencyCode;
  symbol: string;
  name: string;
  rate: number; // Rate relative to TZS (TZS is 1.0)
}

const currencies: Record<CurrencyCode, CurrencyInfo> = {
  TZS: { code: 'TZS', symbol: 'TSh', name: 'Tanzanian Shilling', rate: 1 },
  KES: { code: 'KES', symbol: 'KSh', name: 'Kenyan Shilling', rate: 0.054 },
};

interface CurrencyContextType {
  currency: CurrencyInfo;
  setCurrency: (code: CurrencyCode) => void;
  formatPrice: (amount: number | string, fromCurrency?: string) => string;
  convertPrice: (amount: number | string, fromCurrency?: string) => number;
  availableCurrencies: CurrencyInfo[];
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export const CurrencyProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Default to TZS as requested
  const [selectedCode, setSelectedCode] = useState<CurrencyCode>(() => {
    const saved = localStorage.getItem('kiboss_currency');
    return (saved as CurrencyCode) || 'TZS';
  });

  useEffect(() => {
    localStorage.setItem('kiboss_currency', selectedCode);
  }, [selectedCode]);

  const currency = currencies[selectedCode];

  const convertPrice = (amount: number | string, fromCurrency: string = 'TZS'): number => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(numAmount)) return 0;

    // First convert to TZS (base)
    const fromRate = currencies[fromCurrency as CurrencyCode]?.rate || 1;
    const amountInTzs = numAmount / fromRate;

    // Then convert to selected currency
    if (selectedCode === fromCurrency) return numAmount;

    return amountInTzs * currency.rate;
  };

  // Currencies that don't use decimal fractions (whole-number currencies)
  const wholeNumberCurrencies: CurrencyCode[] = ['TZS', 'KES'];

  const formatPrice = (amount: number | string, fromCurrency: string = 'TZS'): string => {
    const converted = convertPrice(amount, fromCurrency);
    const isWholeNumber = wholeNumberCurrencies.includes(selectedCode);

    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: selectedCode,
      currencyDisplay: 'symbol',
      minimumFractionDigits: isWholeNumber ? 0 : 2,
      maximumFractionDigits: isWholeNumber ? 0 : 2,
    }).format(converted).replace(selectedCode, currency.symbol);
  };

  const value = {
    currency,
    setCurrency: (code: CurrencyCode) => setSelectedCode(code),
    formatPrice,
    convertPrice,
    availableCurrencies: Object.values(currencies),
  };

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};

// Helper component for consistent price display
export const Price: React.FC<{ amount: number | string; from?: string; className?: string }> = ({
  amount,
  from = 'TZS',
  className = ''
}) => {
  const { formatPrice } = useCurrency();
  return <span className={className}>{formatPrice(amount, from)}</span>;
};
