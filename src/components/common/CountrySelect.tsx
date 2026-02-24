import React, { useState, useEffect } from 'react';
import { useCurrency, CurrencyCode } from '../../context/CurrencyContext';

interface Country {
    name: { common: string };
    cca2: string;
    currencies?: Record<string, { name: string; symbol: string }>;
}

interface CountrySelectProps {
    value: string;
    onChange: (country: string) => void;
    className?: string;
    id?: string;
    name?: string;
}

export const CountrySelect: React.FC<CountrySelectProps> = ({
    value,
    onChange,
    className = '',
    id = 'country',
    name = 'country'
}) => {
    const [countries, setCountries] = useState<Country[]>([]);
    const [loading, setLoading] = useState(true);
    const { setCurrency, availableCurrencies } = useCurrency();

    useEffect(() => {
        // Fetch countries from REST Countries API
        const fetchCountries = async () => {
            try {
                // The ?fields parameter might cause 400 errors for some CDNs so fetching all and parsing
                const response = await fetch('https://restcountries.com/v3.1/all');
                if (!response.ok) throw new Error('Failed to fetch countries');

                const data: Country[] = await response.json();

                // Sort alphabetically by common name
                const sortedData = data.sort((a, b) =>
                    a.name.common.localeCompare(b.name.common)
                );

                setCountries(sortedData);
            } catch (error) {
                console.error('Error fetching countries:', error);
                // Heavy fallback list if API fails
                const fallbackCountries: Country[] = [
                    { name: { common: 'Tanzania' }, cca2: 'TZ', currencies: { TZS: { name: 'Tanzanian Shilling', symbol: 'TSh' } } },
                    { name: { common: 'Kenya' }, cca2: 'KE', currencies: { KES: { name: 'Kenyan Shilling', symbol: 'KSh' } } },
                    { name: { common: 'Uganda' }, cca2: 'UG', currencies: { UGX: { name: 'Ugandan Shilling', symbol: 'USh' } } },
                    { name: { common: 'Rwanda' }, cca2: 'RW', currencies: { RWF: { name: 'Rwandan Franc', symbol: 'FRw' } } },
                    { name: { common: 'Burundi' }, cca2: 'BI', currencies: { BIF: { name: 'Burundian Franc', symbol: 'FBu' } } },
                    { name: { common: 'South Africa' }, cca2: 'ZA', currencies: { ZAR: { name: 'South African Rand', symbol: 'R' } } },
                    { name: { common: 'Nigeria' }, cca2: 'NG', currencies: { NGN: { name: 'Nigerian Naira', symbol: '₦' } } },
                    { name: { common: 'Ghana' }, cca2: 'GH', currencies: { GHS: { name: 'Ghanaian Cedi', symbol: 'GH₵' } } },
                    { name: { common: 'Egypt' }, cca2: 'EG', currencies: { EGP: { name: 'Egyptian Pound', symbol: 'E£' } } },
                    { name: { common: 'Morocco' }, cca2: 'MA', currencies: { MAD: { name: 'Moroccan Dirham', symbol: 'MAD' } } },
                    { name: { common: 'United States' }, cca2: 'US', currencies: { USD: { name: 'US Dollar', symbol: '$' } } },
                    { name: { common: 'Canada' }, cca2: 'CA', currencies: { CAD: { name: 'Canadian Dollar', symbol: '$' } } },
                    { name: { common: 'United Kingdom' }, cca2: 'GB', currencies: { GBP: { name: 'British Pound', symbol: '£' } } },
                    { name: { common: 'Australia' }, cca2: 'AU', currencies: { AUD: { name: 'Australian Dollar', symbol: '$' } } },
                    { name: { common: 'India' }, cca2: 'IN', currencies: { INR: { name: 'Indian Rupee', symbol: '₹' } } },
                    { name: { common: 'China' }, cca2: 'CN', currencies: { CNY: { name: 'Chinese Yuan', symbol: '¥' } } },
                    { name: { common: 'Japan' }, cca2: 'JP', currencies: { JPY: { name: 'Japanese Yen', symbol: '¥' } } },
                    { name: { common: 'Germany' }, cca2: 'DE', currencies: { EUR: { name: 'Euro', symbol: '€' } } },
                    { name: { common: 'France' }, cca2: 'FR', currencies: { EUR: { name: 'Euro', symbol: '€' } } },
                    { name: { common: 'Italy' }, cca2: 'IT', currencies: { EUR: { name: 'Euro', symbol: '€' } } },
                    { name: { common: 'Spain' }, cca2: 'ES', currencies: { EUR: { name: 'Euro', symbol: '€' } } },
                    { name: { common: 'Brazil' }, cca2: 'BR', currencies: { BRL: { name: 'Brazilian Real', symbol: 'R$' } } },
                    { name: { common: 'Mexico' }, cca2: 'MX', currencies: { MXN: { name: 'Mexican Peso', symbol: '$' } } },
                    { name: { common: 'United Arab Emirates' }, cca2: 'AE', currencies: { AED: { name: 'UAE Dirham', symbol: 'د.إ' } } },
                    { name: { common: 'Saudi Arabia' }, cca2: 'SA', currencies: { SAR: { name: 'Saudi Riyal', symbol: '﷼' } } },
                ];
                setCountries(fallbackCountries.sort((a, b) => a.name.common.localeCompare(b.name.common)));
            } finally {
                setLoading(false);
            }
        };

        fetchCountries();
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedCountryName = e.target.value;
        onChange(selectedCountryName);

        // Find the country object to extract currency
        const selectedCountry = countries.find(c => c.name.common === selectedCountryName);

        if (selectedCountry && selectedCountry.currencies) {
            // Get the first currency code (e.g., 'TZS', 'USD')
            const currencyCode = Object.keys(selectedCountry.currencies)[0];

            // Check if this currency is supported by our app before switching
            const isSupported = availableCurrencies.some(c => c.code === currencyCode);
            if (isSupported) {
                setCurrency(currencyCode as CurrencyCode);
            }
        }
    };

    if (loading) {
        return (
            <select
                className={`${className} opacity-50 cursor-wait`}
                disabled
                value="loading"
                onChange={() => { }}
            >
                <option value="loading">Loading countries...</option>
            </select>
        );
    }

    return (
        <select
            id={id}
            name={name}
            value={value || 'Tanzania'}
            onChange={handleChange}
            className={className}
        >
            <option value="" disabled>Select a country</option>
            {countries.map((country) => (
                <option key={country.cca2} value={country.name.common}>
                    {country.name.common}
                </option>
            ))}
        </select>
    );
};
