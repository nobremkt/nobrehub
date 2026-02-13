import React, { useState, useMemo } from 'react';
import { AsYouType, getCountryCallingCode, parsePhoneNumberFromString, CountryCode } from 'libphonenumber-js';
import { Dropdown } from '../Dropdown';
import styles from './PhoneInput.module.css';

// Lista de países com emoji flags
const COUNTRIES: { code: CountryCode; name: string; flag: string }[] = [
    { code: 'BR', name: 'Brasil', flag: '🇧🇷' },
    { code: 'US', name: 'Estados Unidos', flag: '🇺🇸' },
    { code: 'PT', name: 'Portugal', flag: '🇵🇹' },
    { code: 'ES', name: 'Espanha', flag: '🇪🇸' },
    { code: 'AR', name: 'Argentina', flag: '🇦🇷' },
    { code: 'MX', name: 'México', flag: '🇲🇽' },
    { code: 'FR', name: 'França', flag: '🇫🇷' },
    { code: 'DE', name: 'Alemanha', flag: '🇩🇪' },
    { code: 'IT', name: 'Itália', flag: '🇮🇹' },
    { code: 'GB', name: 'Reino Unido', flag: '🇬🇧' },
    { code: 'CA', name: 'Canadá', flag: '🇨🇦' },
    { code: 'JP', name: 'Japão', flag: '🇯🇵' },
    { code: 'CN', name: 'China', flag: '🇨🇳' },
    { code: 'IN', name: 'Índia', flag: '🇮🇳' },
    { code: 'AU', name: 'Austrália', flag: '🇦🇺' },
    { code: 'CL', name: 'Chile', flag: '🇨🇱' },
    { code: 'CO', name: 'Colômbia', flag: '🇨🇴' },
    { code: 'PE', name: 'Peru', flag: '🇵🇪' },
    { code: 'UY', name: 'Uruguai', flag: '🇺🇾' },
    { code: 'PY', name: 'Paraguai', flag: '🇵🇾' },
];

// Máximo de dígitos nacionais por país (sem DDI)
const MAX_NATIONAL_DIGITS: Record<string, number> = {
    BR: 11, // (11) 99999-9999
    US: 10, // (201) 555-0123
    PT: 9,  // 912 345 678
    ES: 9,  // 612 345 678
    AR: 10, // 11 1234-5678
    MX: 10, // 55 1234 5678
    FR: 9,  // 06 12 34 56 78
    DE: 11, // 0151 12345678
    IT: 10, // 312 345 6789
    GB: 10, // 07911 123456
    CA: 10, // (204) 555-0123
    JP: 10, // 090-1234-5678
    CN: 11, // 131 2345 6789
    IN: 10, // 98765 43210
    AU: 9,  // 412 345 678
    CL: 9,  // 9 1234 5678
    CO: 10, // 321 1234567
    PE: 9,  // 912 345 678
    UY: 8,  // 9123 4567
    PY: 9,  // 0981 123456
};

const DEFAULT_MAX_DIGITS = 12;

interface PhoneInputProps {
    value?: string;
    onChange: (value: string) => void;
    placeholder?: string;
    label?: string;
    error?: string;
    disabled?: boolean;
    required?: boolean;
    className?: string;
    defaultCountry?: CountryCode;
}

export const PhoneInput: React.FC<PhoneInputProps> = ({
    value = '',
    onChange,
    placeholder,
    label,
    error,
    disabled = false,
    required = false,
    className,
    defaultCountry = 'BR',
}) => {
    const [country, setCountry] = useState<CountryCode>(defaultCountry);

    const maxDigits = MAX_NATIONAL_DIGITS[country] ?? DEFAULT_MAX_DIGITS;

    // Opções do dropdown com flags
    const countryOptions = useMemo(() =>
        COUNTRIES.map(c => ({
            value: c.code,
            label: `+${getCountryCallingCode(c.code)}`,
            icon: <span style={{ fontSize: '1.25rem', lineHeight: 1 }}>{c.flag}</span>,
        })),
        []);

    // Formatação as-you-type
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const rawInput = e.target.value;

        // Remove tudo que não é número
        let digits = rawInput.replace(/\D/g, '');

        // Limite dinâmico baseado no país selecionado
        if (digits.length > maxDigits) {
            digits = digits.slice(0, maxDigits);
        }

        // Valor completo com DDI para salvar
        const callingCode = getCountryCallingCode(country);
        const fullValue = digits ? `+${callingCode}${digits}` : '';

        onChange(fullValue);
    };

    // Formatação manual para Brasil (resolve o bug do AsYouType que trava no 5-4)
    const formatBrazilianPhone = (digits: string): string => {
        if (digits.length <= 2) return digits;

        const areaCode = digits.slice(0, 2);
        const subscriber = digits.slice(2);

        if (subscriber.length === 0) return `(${areaCode})`;
        if (subscriber.length <= 4) return `(${areaCode}) ${subscriber}`;

        // 10 dígitos = fixo (4-4) | 11 dígitos = celular (5-4)
        if (digits.length <= 10) {
            // Formato fixo: (XX) XXXX-XXXX
            return `(${areaCode}) ${subscriber.slice(0, 4)}-${subscriber.slice(4)}`;
        } else {
            // Formato celular: (XX) XXXXX-XXXX
            return `(${areaCode}) ${subscriber.slice(0, 5)}-${subscriber.slice(5)}`;
        }
    };

    // Extrai apenas os dígitos locais do valor completo para exibição
    const displayValue = useMemo(() => {
        if (!value) return '';

        const callingCode = getCountryCallingCode(country);
        let digits = value.replace(/\D/g, '');

        // Remove o DDI se presente
        if (digits.startsWith(callingCode)) {
            digits = digits.slice(callingCode.length);
        }

        // Número completo → usa parsePhoneNumber pra formatação precisa (qualquer país)
        const countryMax = MAX_NATIONAL_DIGITS[country] ?? DEFAULT_MAX_DIGITS;
        if (digits.length >= countryMax) {
            try {
                const parsed = parsePhoneNumberFromString(`+${callingCode}${digits}`, country);
                if (parsed) return parsed.formatNational();
            } catch { /* fallback abaixo */ }
        }

        // Número parcial — Brasil usa formatação manual (4-4 vs 5-4)
        if (country === 'BR') {
            return formatBrazilianPhone(digits);
        }

        // Número parcial — outros países usam AsYouType
        const formatter = new AsYouType(country);
        return formatter.input(digits);
    }, [value, country]);

    // Placeholder dinâmico baseado no país
    const dynamicPlaceholder = useMemo(() => {
        if (placeholder) return placeholder;

        // Exemplos de formato por país
        const examples: Record<string, string> = {
            BR: '(11) 99999-9999',
            US: '(201) 555-0123',
            PT: '912 345 678',
            default: '000 000 0000',
        };

        return examples[country] || examples.default;
    }, [country, placeholder]);

    const handleCountryChange = (newCountry: string | number) => {
        setCountry(newCountry as CountryCode);
        // Limpa o valor ao mudar de país para evitar formatação incorreta
        onChange('');
    };

    return (
        <div className={`${styles.container} ${className || ''} ${disabled ? styles.disabled : ''}`}>
            {label && (
                <label className={styles.label}>
                    {label} {required && <span className={styles.required}>*</span>}
                </label>
            )}

            <div className={`${styles.inputWrapper} ${error ? styles.hasError : ''}`}>
                {/* Country Dropdown */}
                <div className={styles.countryDropdown}>
                    <Dropdown
                        options={countryOptions}
                        value={country}
                        onChange={handleCountryChange}
                        disabled={disabled}
                        noSound
                    />
                </div>

                {/* Phone Input */}
                <input
                    type="tel"
                    className={styles.input}
                    value={displayValue}
                    onChange={handleInputChange}
                    placeholder={dynamicPlaceholder}
                    disabled={disabled}
                    maxLength={20}
                />
            </div>

            {error && <span className={styles.errorText}>{error}</span>}
        </div>
    );
};
