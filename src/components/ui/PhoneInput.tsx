import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { COUNTRY_CODES, CountryCode, formatPhoneInput, extractPhoneDigits } from '../../lib/phoneFormat';
import { cn } from '../../lib/utils';

interface PhoneInputProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
    disabled?: boolean;
    id?: string;
    name?: string;
    required?: boolean;
}

/**
 * Phone input with country code selector and auto-formatting
 * Default: Brazil (+55) with format XX XXXXX XXXX
 */
const PhoneInput: React.FC<PhoneInputProps> = ({
    value,
    onChange,
    placeholder = 'Telefone',
    className,
    disabled = false,
    id,
    name,
    required = false
}) => {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [selectedCountry, setSelectedCountry] = useState<CountryCode>(COUNTRY_CODES[0]); // Default: Brazil
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Parse value to extract country code if present
    useEffect(() => {
        const digits = extractPhoneDigits(value);
        // Try to match country code from value
        for (const country of COUNTRY_CODES) {
            const code = country.code.replace('+', '');
            if (digits.startsWith(code)) {
                setSelectedCountry(country);
                break;
            }
        }
    }, []); // Only run once on mount

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setIsDropdownOpen(false);
            }
        };

        if (isDropdownOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isDropdownOpen]);

    const handleCountrySelect = (country: CountryCode) => {
        setSelectedCountry(country);
        setIsDropdownOpen(false);
        // Keep the phone number but update formatting
        const digits = extractPhoneDigits(value);
        // Remove old country code if present
        let nationalNumber = digits;
        for (const c of COUNTRY_CODES) {
            const code = c.code.replace('+', '');
            if (digits.startsWith(code)) {
                nationalNumber = digits.slice(code.length);
                break;
            }
        }
        const formatted = formatPhoneInput(nationalNumber, country.code);
        onChange(formatted);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const rawValue = e.target.value;
        const formatted = formatPhoneInput(rawValue, selectedCountry.code);
        onChange(formatted);
    };

    // Get display value (without country code, just the formatted number)
    const getDisplayValue = () => {
        const digits = extractPhoneDigits(value);
        const countryCode = selectedCountry.code.replace('+', '');

        // If value starts with country code, remove it
        let nationalNumber = digits;
        if (digits.startsWith(countryCode)) {
            nationalNumber = digits.slice(countryCode.length);
        }

        return formatPhoneInput(nationalNumber, selectedCountry.code);
    };

    return (
        <div className={cn('relative flex', className)} ref={dropdownRef}>
            {/* Country Code Selector */}
            <button
                type="button"
                onClick={() => !disabled && setIsDropdownOpen(!isDropdownOpen)}
                disabled={disabled}
                className={cn(
                    'flex items-center gap-1 px-3 py-2 border border-r-0 border-slate-200 rounded-l-lg bg-slate-50 text-sm',
                    'hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-violet-500 focus:z-10',
                    disabled && 'opacity-50 cursor-not-allowed'
                )}
            >
                <span className="text-lg">{selectedCountry.flag}</span>
                <span className="text-slate-600">{selectedCountry.code}</span>
                <ChevronDown
                    size={14}
                    className={cn(
                        'text-slate-400 transition-transform',
                        isDropdownOpen && 'rotate-180'
                    )}
                />
            </button>

            {/* Phone Number Input */}
            <input
                type="tel"
                id={id}
                name={name}
                value={getDisplayValue()}
                onChange={handleInputChange}
                placeholder={placeholder}
                disabled={disabled}
                required={required}
                className={cn(
                    'flex-1 px-3 py-2 border border-slate-200 rounded-r-lg text-sm text-slate-900',
                    'focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500',
                    'placeholder:text-slate-400',
                    disabled && 'opacity-50 cursor-not-allowed bg-slate-50'
                )}
            />

            {/* Country Dropdown */}
            {isDropdownOpen && (
                <div
                    className={cn(
                        'absolute top-full left-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-xl z-50',
                        'max-h-60 overflow-y-auto min-w-[200px] animate-in fade-in slide-in-from-top-2 duration-200'
                    )}
                >
                    {COUNTRY_CODES.map((country) => (
                        <button
                            key={country.code}
                            type="button"
                            onClick={() => handleCountrySelect(country)}
                            className={cn(
                                'w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-slate-50 transition-colors',
                                selectedCountry.code === country.code && 'bg-violet-50'
                            )}
                        >
                            <span className="text-lg">{country.flag}</span>
                            <span className="text-sm text-slate-700 flex-1">{country.label}</span>
                            <span className="text-xs text-slate-400">{country.code}</span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export default PhoneInput;
