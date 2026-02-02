import 'react-phone-number-input/style.css';
import React from 'react';
import PhoneInputLib from 'react-phone-number-input';
import pt from 'react-phone-number-input/locale/pt'; // Português
import styles from './PhoneInput.module.css';

interface PhoneInputProps {
    value?: string;
    onChange: (value: string) => void;
    placeholder?: string;
    label?: string;
    error?: string;
    disabled?: boolean;
    required?: boolean;
    className?: string;
}

export const PhoneInput: React.FC<PhoneInputProps> = ({
    value,
    onChange,
    placeholder = '(00) 00000-0000',
    label,
    error,
    disabled = false,
    required = false,
    className,
}) => {
    return (
        <div className={`${styles.container} ${className || ''} ${disabled ? styles.disabled : ''}`}>
            {label && (
                <label className={styles.label}>
                    {label} {required && <span className={styles.required}>*</span>}
                </label>
            )}

            <div className={`${styles.inputWrapper} ${error ? styles.hasError : ''}`}>
                <PhoneInputLib
                    international
                    defaultCountry="BR"
                    value={value}
                    onChange={(val) => onChange(val || '')}
                    placeholder={placeholder}
                    disabled={disabled}
                    labels={pt}
                    className={styles.libInput}
                    numberInputProps={{
                        className: styles.nativeInput
                    }}
                />
            </div>

            {error && <span className={styles.errorText}>{error}</span>}
        </div>
    );
};
