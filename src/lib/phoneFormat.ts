/**
 * Phone number formatting utilities
 * Supports Brazilian phone numbers with country code selection
 */

// Country codes with flags
export const COUNTRY_CODES = [
    { code: '+55', country: 'BR', flag: '🇧🇷', label: 'Brasil', format: '## ##### ####' },
    { code: '+1', country: 'US', flag: '🇺🇸', label: 'EUA', format: '### ### ####' },
    { code: '+351', country: 'PT', flag: '🇵🇹', label: 'Portugal', format: '### ### ###' },
    { code: '+54', country: 'AR', flag: '🇦🇷', label: 'Argentina', format: '## #### ####' },
    { code: '+52', country: 'MX', flag: '🇲🇽', label: 'México', format: '## #### ####' },
    { code: '+34', country: 'ES', flag: '🇪🇸', label: 'Espanha', format: '### ## ## ##' },
    { code: '+44', country: 'GB', flag: '🇬🇧', label: 'Reino Unido', format: '#### ### ###' },
] as const;

export type CountryCode = typeof COUNTRY_CODES[number];

/**
 * Format a raw phone number (digits only) with the Brazilian format: XX XXXXX XXXX
 */
export const formatPhoneNumber = (phone: string): string => {
    // Remove all non-digits
    const digits = phone.replace(/\D/g, '');

    // If number starts with country code, extract it
    let nationalNumber = digits;
    let countryCode = '';

    if (digits.startsWith('55') && digits.length > 10) {
        countryCode = '+55 ';
        nationalNumber = digits.slice(2);
    } else if (digits.length > 11) {
        // Assume first 2 digits are country code
        countryCode = `+${digits.slice(0, 2)} `;
        nationalNumber = digits.slice(2);
    }

    // Format Brazilian number: XX XXXXX XXXX (11 digits) or XX XXXX XXXX (10 digits)
    if (nationalNumber.length === 11) {
        // Mobile with 9 digits
        return `${countryCode}${nationalNumber.slice(0, 2)} ${nationalNumber.slice(2, 7)} ${nationalNumber.slice(7)}`;
    } else if (nationalNumber.length === 10) {
        // Landline with 8 digits
        return `${countryCode}${nationalNumber.slice(0, 2)} ${nationalNumber.slice(2, 6)} ${nationalNumber.slice(6)}`;
    } else if (nationalNumber.length === 9) {
        // Mobile without DDD
        return `${countryCode}${nationalNumber.slice(0, 5)} ${nationalNumber.slice(5)}`;
    } else if (nationalNumber.length === 8) {
        // Landline without DDD
        return `${countryCode}${nationalNumber.slice(0, 4)} ${nationalNumber.slice(4)}`;
    }

    // Return with country code if present
    return countryCode + nationalNumber;
};

/**
 * Format phone for display - adds spaces and formatting
 */
export const formatPhoneDisplay = (phone: string | undefined | null): string => {
    if (!phone) return '-';
    return formatPhoneNumber(phone);
};

/**
 * Format phone input as user types - auto-format with mask
 */
export const formatPhoneInput = (value: string, countryCode: string = '+55'): string => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, '');

    if (countryCode === '+55') {
        // Brazilian format: XX XXXXX XXXX
        if (digits.length <= 2) {
            return digits;
        } else if (digits.length <= 7) {
            return `${digits.slice(0, 2)} ${digits.slice(2)}`;
        } else if (digits.length <= 11) {
            return `${digits.slice(0, 2)} ${digits.slice(2, 7)} ${digits.slice(7)}`;
        } else {
            return `${digits.slice(0, 2)} ${digits.slice(2, 7)} ${digits.slice(7, 11)}`;
        }
    }

    // Default: just add space every 4 digits
    return digits.match(/.{1,4}/g)?.join(' ') || digits;
};

/**
 * Extract raw digits from formatted phone
 */
export const extractPhoneDigits = (formattedPhone: string): string => {
    return formattedPhone.replace(/\D/g, '');
};

/**
 * Get full phone number with country code
 */
export const getFullPhoneNumber = (phone: string, countryCode: string = '55'): string => {
    const digits = extractPhoneDigits(phone);
    const code = countryCode.replace('+', '');

    // If phone already has country code, return as-is
    if (digits.startsWith(code)) {
        return digits;
    }

    return `${code}${digits}`;
};
