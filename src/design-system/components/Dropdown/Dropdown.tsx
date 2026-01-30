import { useState, useRef, useEffect, useCallback } from 'react';
import clsx from 'clsx';
import { ChevronDown } from 'lucide-react';
import styles from './Dropdown.module.css';
import { useUISound } from '@/hooks';

interface DropdownOption {
    label: string;
    value: string | number;
    icon?: React.ReactNode;
}

export interface DropdownProps {
    options: DropdownOption[];
    value?: string | number;
    onChange: (value: string | number) => void;
    placeholder?: string;
    label?: string;
    disabled?: boolean;
    className?: string;
    error?: string;
    /** Desabilitar sons */
    noSound?: boolean;
}

export function Dropdown({
    options,
    value,
    onChange,
    placeholder = 'Selecione...',
    label,
    disabled = false,
    className,
    error,
    noSound = false,
}: DropdownProps) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const { playSound } = useUISound();

    const selectedOption = options.find((opt) => opt.value === value);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleToggle = useCallback(() => {
        if (disabled) return;

        if (!noSound) {
            playSound('click');
        }
        setIsOpen((prev) => !prev);
    }, [disabled, noSound, playSound]);

    const handleSelect = useCallback((optionValue: string | number) => {
        if (!noSound) {
            playSound('click');
        }
        onChange(optionValue);
        setIsOpen(false);
    }, [noSound, playSound, onChange]);

    const handleOptionHover = useCallback(() => {
        if (!noSound) {
            playSound('hover');
        }
    }, [noSound, playSound]);

    return (
        <div className={clsx(styles.container, className)} ref={containerRef}>
            {label && <label className={styles.label}>{label}</label>}
            <div className={styles.relative}>
                <button
                    type="button"
                    className={clsx(styles.trigger, {
                        [styles.isOpen]: isOpen,
                        [styles.disabled]: disabled,
                        [styles.hasError]: !!error,
                    })}
                    onClick={handleToggle}
                    disabled={disabled}
                >
                    <span className={styles.value}>
                        {selectedOption ? (
                            <>
                                {selectedOption.icon && <span className={styles.icon}>{selectedOption.icon}</span>}
                                {selectedOption.label}
                            </>
                        ) : (
                            <span className={styles.placeholder}>{placeholder}</span>
                        )}
                    </span>
                    <ChevronDown className={clsx(styles.chevron, { [styles.chevronUp]: isOpen })} size={18} />
                </button>

                {isOpen && (
                    <div className={styles.menu}>
                        <ul className={styles.list}>
                            {options.map((option) => (
                                <li
                                    key={option.value}
                                    className={clsx(styles.option, {
                                        [styles.selected]: option.value === value,
                                    })}
                                    onClick={() => handleSelect(option.value)}
                                    onMouseEnter={handleOptionHover}
                                >
                                    {option.icon && <span className={styles.optionIcon}>{option.icon}</span>}
                                    {option.label}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
            {error && <p className={styles.errorText}>{error}</p>}
        </div>
    );
}
