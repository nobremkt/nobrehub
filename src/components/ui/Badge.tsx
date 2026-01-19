import React from 'react';

interface BadgeProps {
    children: React.ReactNode;
    variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info';
    size?: 'sm' | 'md';
    dot?: boolean;
    className?: string;
}

const Badge: React.FC<BadgeProps> = ({
    children,
    variant = 'default',
    size = 'sm',
    dot = false,
    className = '',
}) => {
    const variants = {
        default: 'bg-slate-100 text-slate-700',
        primary: 'bg-blue-100 text-blue-700',
        success: 'bg-emerald-100 text-emerald-700',
        warning: 'bg-amber-100 text-amber-700',
        danger: 'bg-red-100 text-red-700',
        info: 'bg-cyan-100 text-cyan-700',
    };

    const sizes = {
        sm: 'text-xs px-2 py-0.5',
        md: 'text-sm px-2.5 py-1',
    };

    const dotColors = {
        default: 'bg-slate-500',
        primary: 'bg-blue-500',
        success: 'bg-emerald-500',
        warning: 'bg-amber-500',
        danger: 'bg-red-500',
        info: 'bg-cyan-500',
    };

    return (
        <span
            className={`
                inline-flex items-center gap-1.5
                font-medium rounded-full
                ${variants[variant]}
                ${sizes[size]}
                ${className}
            `}
        >
            {dot && (
                <span className={`w-1.5 h-1.5 rounded-full ${dotColors[variant]}`} />
            )}
            {children}
        </span>
    );
};

export default Badge;
