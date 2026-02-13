import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import styles from './MiniSelect.module.css';

interface MiniSelectOption {
    value: string;
    label: string;
}

interface MiniSelectProps {
    options: MiniSelectOption[];
    value: string;
    onChange: (value: string) => void;
    disabled?: boolean;
    icon?: React.ReactNode;
}

export function MiniSelect({ options, value, onChange, disabled, icon }: MiniSelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    const selected = options.find((o) => o.value === value);

    // Close on outside click
    useEffect(() => {
        if (!isOpen) return;
        const handler = (e: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [isOpen]);

    return (
        <div ref={wrapperRef} className={styles.wrapper}>
            <button
                type="button"
                className={`${styles.trigger} ${isOpen ? styles.triggerOpen : ''}`}
                onClick={() => !disabled && setIsOpen(!isOpen)}
                disabled={disabled}
            >
                {icon && <span className={styles.triggerIcon}>{icon}</span>}
                <span className={styles.triggerValue}>{selected?.label ?? value}</span>
                <ChevronDown size={12} className={styles.chevron} />
            </button>

            {isOpen && (
                <div className={styles.menu}>
                    {options.map((opt) => (
                        <button
                            key={opt.value}
                            type="button"
                            className={`${styles.menuItem} ${opt.value === value ? styles.menuItemActive : ''}`}
                            onClick={() => {
                                onChange(opt.value);
                                setIsOpen(false);
                            }}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
