import React from 'react';

interface CardProps {
    children: React.ReactNode;
    className?: string;
    padding?: 'none' | 'sm' | 'md' | 'lg';
    hover?: boolean;
    onClick?: () => void;
}

const Card: React.FC<CardProps> = ({
    children,
    className = '',
    padding = 'md',
    hover = false,
    onClick,
}) => {
    const paddings = {
        none: '',
        sm: 'p-3',
        md: 'p-4',
        lg: 'p-6',
    };

    return (
        <div
            className={`
                bg-white rounded-xl border border-slate-200
                ${paddings[padding]}
                ${hover ? 'hover:shadow-md hover:border-slate-300 transition-all cursor-pointer' : 'shadow-sm'}
                ${className}
            `}
            onClick={onClick}
            role={onClick ? 'button' : undefined}
            tabIndex={onClick ? 0 : undefined}
        >
            {children}
        </div>
    );
};

// Card Header
interface CardHeaderProps {
    children: React.ReactNode;
    className?: string;
}

const CardHeader: React.FC<CardHeaderProps> = ({ children, className = '' }) => (
    <div className={`flex items-center justify-between pb-3 border-b border-slate-100 ${className}`}>
        {children}
    </div>
);

// Card Title
interface CardTitleProps {
    children: React.ReactNode;
    className?: string;
}

const CardTitle: React.FC<CardTitleProps> = ({ children, className = '' }) => (
    <h3 className={`text-base font-semibold text-slate-900 ${className}`}>
        {children}
    </h3>
);

// Card Content
interface CardContentProps {
    children: React.ReactNode;
    className?: string;
}

const CardContent: React.FC<CardContentProps> = ({ children, className = '' }) => (
    <div className={`pt-3 ${className}`}>
        {children}
    </div>
);

export { Card, CardHeader, CardTitle, CardContent };
export default Card;
