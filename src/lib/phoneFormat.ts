/**
 * Phone number formatting utilities
 * Supports Brazilian phone numbers with country code selection
 */

// Country codes with ISO codes for flag images
export const COUNTRY_CODES = [
    { code: '+55', country: 'BR', iso: 'br', label: 'Brasil', format: '## ##### ####' },
    { code: '+1', country: 'US', iso: 'us', label: 'Estados Unidos', format: '### ### ####' },
    { code: '+351', country: 'PT', iso: 'pt', label: 'Portugal', format: '### ### ###' },
    { code: '+54', country: 'AR', iso: 'ar', label: 'Argentina', format: '## #### ####' },
    { code: '+52', country: 'MX', iso: 'mx', label: 'México', format: '## #### ####' },
    { code: '+34', country: 'ES', iso: 'es', label: 'Espanha', format: '### ## ## ##' },
    { code: '+44', country: 'GB', iso: 'gb', label: 'Reino Unido', format: '#### ### ###' },
    { code: '+49', country: 'DE', iso: 'de', label: 'Alemanha', format: '### ### ####' },
    { code: '+33', country: 'FR', iso: 'fr', label: 'França', format: '# ## ## ## ##' },
    { code: '+39', country: 'IT', iso: 'it', label: 'Itália', format: '### ### ####' },
    { code: '+81', country: 'JP', iso: 'jp', label: 'Japão', format: '## #### ####' },
    { code: '+86', country: 'CN', iso: 'cn', label: 'China', format: '### #### ####' },
    { code: '+91', country: 'IN', iso: 'in', label: 'Índia', format: '##### #####' },
    { code: '+7', country: 'RU', iso: 'ru', label: 'Rússia', format: '### ### ## ##' },
    { code: '+971', country: 'AE', iso: 'ae', label: 'Emirados Árabes', format: '## ### ####' },
] as const;

export type CountryCode = typeof COUNTRY_CODES[number];

/**
 * Get flag image URL from flagcdn.com
 */
export const getFlagUrl = (iso: string, size: 'w20' | 'w40' | 'w80' = 'w20'): string => {
    return `https://flagcdn.com/${size}/${iso.toLowerCase()}.png`;
};

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
        // Brazilian format: (XX) XXXXX-XXXX
        if (digits.length <= 2) {
            return digits;
        } else if (digits.length <= 6) {
            return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
        } else if (digits.length <= 10) {
            return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
        } else {
            return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
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
