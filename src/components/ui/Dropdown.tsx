import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

interface DropdownOption {
    value: string;
    label: string;
    icon?: React.ReactNode;
    color?: string;
}

interface DropdownProps {
    options: DropdownOption[];
    value?: string;
    onChange: (value: string) => void;
    placeholder?: string;
    label?: string;
    disabled?: boolean;
    className?: string;
}

const Dropdown: React.FC<DropdownProps> = ({
    options,
    value,
    onChange,
    placeholder = 'Selecione...',
    label,
    disabled = false,
    className = '',
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const selectedOption = options.find((opt) => opt.value === value);

    // Close on outside click
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (optionValue: string) => {
        onChange(optionValue);
        setIsOpen(false);
    };

    return (
        <div className={`relative ${className}`} ref={dropdownRef}>
            {label && (
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    {label}
                </label>
            )}
            <button
                type="button"
                onClick={() => !disabled && setIsOpen(!isOpen)}
                disabled={disabled}
                className={`
                    w-full flex items-center justify-between gap-2
                    px-3 py-2 text-sm text-left
                    bg-white border border-slate-200 rounded-lg
                    hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500
                    disabled:bg-slate-50 disabled:cursor-not-allowed
                    transition-colors
                `}
            >
                <span className={selectedOption ? 'text-slate-900' : 'text-slate-400'}>
                    {selectedOption ? (
                        <span className="flex items-center gap-2">
                            {selectedOption.icon}
                            {selectedOption.label}
                        </span>
                    ) : (
                        placeholder
                    )}
                </span>
                <ChevronDown
                    size={16}
                    className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                />
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden">
                    {options.map((option) => (
                        <button
                            key={option.value}
                            type="button"
                            onClick={() => handleSelect(option.value)}
                            className={`
                                w-full flex items-center justify-between gap-2
                                px-3 py-2.5 text-sm text-left
                                hover:bg-slate-50 transition-colors
                                ${option.value === value ? 'bg-slate-50' : ''}
                            `}
                        >
                            <span className="flex items-center gap-2">
                                {option.icon}
                                {option.color && (
                                    <span
                                        className="w-2 h-2 rounded-full"
                                        style={{ backgroundColor: option.color }}
                                    />
                                )}
                                {option.label}
                            </span>
                            {option.value === value && (
                                <Check size={16} className="text-blue-500" />
                            )}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Dropdown;
