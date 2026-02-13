import { useState, useRef, useEffect, useCallback } from 'react';
import { HexColorPicker } from 'react-colorful';
import styles from './ColorPicker.module.css';

interface ColorPickerProps {
    value: string;
    onChange: (color: string) => void;
    disabled?: boolean;
    label?: string;
}

export function ColorPicker({ value, onChange, disabled, label }: ColorPickerProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [hexInput, setHexInput] = useState(value);
    const popoverRef = useRef<HTMLDivElement>(null);
    const swatchRef = useRef<HTMLButtonElement>(null);

    // Sync hex input when value changes externally
    useEffect(() => {
        setHexInput(value);
    }, [value]);

    // Close popover on outside click
    useEffect(() => {
        if (!isOpen) return;

        const handleClick = (e: MouseEvent) => {
            if (
                popoverRef.current && !popoverRef.current.contains(e.target as Node) &&
                swatchRef.current && !swatchRef.current.contains(e.target as Node)
            ) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, [isOpen]);

    const handleHexChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value;
        setHexInput(raw);

        // Only set color if valid hex
        const cleaned = raw.startsWith('#') ? raw : `#${raw}`;
        if (/^#[0-9a-fA-F]{6}$/.test(cleaned)) {
            onChange(cleaned.toLowerCase());
        }
    }, [onChange]);

    const handleHexBlur = useCallback(() => {
        // Reset to current value if invalid
        setHexInput(value);
    }, [value]);

    return (
        <div className={styles.wrapper}>
            <button
                ref={swatchRef}
                className={styles.swatch}
                onClick={() => !disabled && setIsOpen(!isOpen)}
                disabled={disabled}
                type="button"
                aria-label={label || 'Escolher cor'}
            >
                <span
                    className={styles.swatchColor}
                    style={{ backgroundColor: value }}
                />
            </button>

            <input
                className={styles.hexInput}
                value={hexInput}
                onChange={handleHexChange}
                onBlur={handleHexBlur}
                disabled={disabled}
                maxLength={7}
                spellCheck={false}
                placeholder="#000000"
            />

            {isOpen && (
                <div ref={popoverRef} className={styles.popover}>
                    <HexColorPicker color={value} onChange={onChange} />
                </div>
            )}
        </div>
    );
}
