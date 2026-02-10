import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
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
    required?: boolean;
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
    required = false,
    disabled = false,
    className,
    error,
    noSound = false,
}: DropdownProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [menuPosition, setMenuPosition] = useState<{ top?: number; bottom?: number; left: number; width: number }>({ left: 0, width: 0 });
    const triggerRef = useRef<HTMLButtonElement>(null);
    const { playSound } = useUISound();

    const selectedOption = options.find((opt) => opt.value === value);

    const updatePosition = useCallback(() => {
        if (isOpen && triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect();
            const spaceBelow = window.innerHeight - rect.bottom;
            const MENU_MAX_HEIGHT = 250; // Approximated from CSS
            const GAP = 4;

            // Decide direction: if strict space below < max height AND more space above, open up
            const shouldOpenUp = spaceBelow < MENU_MAX_HEIGHT && rect.top > spaceBelow;

            if (shouldOpenUp) {
                setMenuPosition({
                    bottom: window.innerHeight - rect.top + GAP,
                    left: rect.left,
                    width: rect.width,
                    top: undefined,
                });
            } else {
                setMenuPosition({
                    top: rect.bottom + GAP,
                    left: rect.left,
                    width: rect.width,
                    bottom: undefined,
                });
            }
        }
    }, [isOpen]);

    // Handler para scroll que ignora scrolls dentro do menu
    const handleExternalScroll = useCallback((event: Event) => {
        const menu = document.getElementById('dropdown-menu-portal');
        // Ignora scroll se originado dentro do menu (scroll da própria lista)
        if (menu && menu.contains(event.target as Node)) {
            return;
        }
        updatePosition();
    }, [updatePosition]);

    useEffect(() => {
        updatePosition();
        window.addEventListener('resize', updatePosition);
        window.addEventListener('scroll', handleExternalScroll, true);

        return () => {
            window.removeEventListener('resize', updatePosition);
            window.removeEventListener('scroll', handleExternalScroll, true);
        };
    }, [updatePosition, handleExternalScroll]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (triggerRef.current && !triggerRef.current.contains(event.target as Node)) {
                // Verificar se o clique não foi dentro do menu (que está no portal)
                const menu = document.getElementById('dropdown-menu-portal');
                if (menu && !menu.contains(event.target as Node)) {
                    setIsOpen(false);
                }
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

    // Portal Menu Component
    const MenuPortal = () => {
        if (!isOpen) return null;

        return createPortal(
            <div
                id="dropdown-menu-portal"
                className={styles.menuPortal}
                style={{
                    top: menuPosition.top,
                    bottom: menuPosition.bottom,
                    left: menuPosition.left,
                    width: menuPosition.width,
                }}
            >
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
            </div>,
            document.body
        );
    };

    return (
        <div className={clsx(styles.container, className)}>
            {label && (
                <label className={styles.label}>
                    {label}
                    {required && <span className={styles.required}>*</span>}
                </label>
            )}
            <div className={styles.relative}>
                <button
                    ref={triggerRef}
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

                <MenuPortal />
            </div>
            {error && <p className={styles.errorText}>{error}</p>}
        </div>
    );
}
