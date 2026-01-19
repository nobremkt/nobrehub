import React from 'react';
import { User } from 'lucide-react';

interface AvatarProps {
    src?: string | null;
    alt?: string;
    name?: string;
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
    className?: string;
}

const Avatar: React.FC<AvatarProps> = ({
    src,
    alt = 'Avatar',
    name,
    size = 'md',
    className = '',
}) => {
    const sizes = {
        xs: 'w-6 h-6 text-xs',
        sm: 'w-8 h-8 text-sm',
        md: 'w-10 h-10 text-base',
        lg: 'w-12 h-12 text-lg',
        xl: 'w-16 h-16 text-xl',
    };

    const iconSizes = {
        xs: 12,
        sm: 14,
        md: 16,
        lg: 20,
        xl: 24,
    };

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    const bgColors = [
        'bg-blue-500',
        'bg-emerald-500',
        'bg-amber-500',
        'bg-purple-500',
        'bg-rose-500',
        'bg-cyan-500',
    ];

    const getColorFromName = (name?: string) => {
        if (!name) return 'bg-slate-400';
        const index = name.charCodeAt(0) % bgColors.length;
        return bgColors[index];
    };

    if (src) {
        return (
            <img
                src={src}
                alt={alt}
                className={`
                    ${sizes[size]}
                    rounded-full object-cover
                    border-2 border-white shadow-sm
                    ${className}
                `}
            />
        );
    }

    if (name) {
        return (
            <div
                className={`
                    ${sizes[size]}
                    ${getColorFromName(name)}
                    rounded-full flex items-center justify-center
                    text-white font-semibold
                    border-2 border-white shadow-sm
                    ${className}
                `}
            >
                {getInitials(name)}
            </div>
        );
    }

    return (
        <div
            className={`
                ${sizes[size]}
                bg-slate-200 rounded-full
                flex items-center justify-center
                text-slate-500
                border-2 border-white shadow-sm
                ${className}
            `}
        >
            <User size={iconSizes[size]} />
        </div>
    );
};

export default Avatar;
