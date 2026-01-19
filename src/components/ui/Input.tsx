import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
}

const Input: React.FC<InputProps> = ({
    label,
    error,
    leftIcon,
    rightIcon,
    className = '',
    id,
    ...props
}) => {
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

    return (
        <div className="flex flex-col gap-1.5">
            {label && (
                <label
                    htmlFor={inputId}
                    className="text-sm font-medium text-slate-700"
                >
                    {label}
                </label>
            )}
            <div className="relative">
                {leftIcon && (
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                        {leftIcon}
                    </div>
                )}
                <input
                    id={inputId}
                    className={`
                        w-full px-3 py-2 
                        bg-white border rounded-lg
                        text-sm text-slate-900 placeholder:text-slate-400
                        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                        disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed
                        ${error ? 'border-red-500' : 'border-slate-200'}
                        ${leftIcon ? 'pl-10' : ''}
                        ${rightIcon ? 'pr-10' : ''}
                        ${className}
                    `}
                    {...props}
                />
                {rightIcon && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                        {rightIcon}
                    </div>
                )}
            </div>
            {error && (
                <p className="text-xs text-red-500">{error}</p>
            )}
        </div>
    );
};

export default Input;
