import React, { useState, useMemo } from 'react';
import { AsYouType, getCountryCallingCode, CountryCode } from 'libphonenumber-js';
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

        // Limite de 15 dígitos (padrão ITU-T E.164 sem DDI)
        if (digits.length > 15) {
            digits = digits.slice(0, 15);
        }

        // Valor completo com DDI para salvar
        const callingCode = getCountryCallingCode(country);
        const fullValue = digits ? `+${callingCode}${digits}` : '';

        onChange(fullValue);
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

        // Formata para exibição
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
