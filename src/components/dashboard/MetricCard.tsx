/**
 * MetricCard
 * 
 * Reusable metric card for dashboards.
 * Displays icon, title, value, and optional trend.
 */

import React from 'react';
import { LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '../../lib/utils';

interface MetricCardProps {
    icon: LucideIcon;
    title: string;
    value: string | number;
    subtitle?: string;
    trend?: {
        value: number;
        label?: string;
    };
    color?: 'blue' | 'emerald' | 'amber' | 'rose' | 'violet' | 'slate';
    loading?: boolean;
    onClick?: () => void;
}

const COLOR_STYLES = {
    blue: {
        bg: 'bg-blue-50',
        icon: 'bg-blue-100 text-blue-600',
        accent: 'text-blue-600'
    },
    emerald: {
        bg: 'bg-emerald-50',
        icon: 'bg-emerald-100 text-emerald-600',
        accent: 'text-emerald-600'
    },
    amber: {
        bg: 'bg-amber-50',
        icon: 'bg-amber-100 text-amber-600',
        accent: 'text-amber-600'
    },
    rose: {
        bg: 'bg-rose-50',
        icon: 'bg-rose-100 text-rose-600',
        accent: 'text-rose-600'
    },
    violet: {
        bg: 'bg-violet-50',
        icon: 'bg-violet-100 text-violet-600',
        accent: 'text-violet-600'
    },
    slate: {
        bg: 'bg-slate-50',
        icon: 'bg-slate-100 text-slate-600',
        accent: 'text-slate-600'
    }
};

const MetricCard: React.FC<MetricCardProps> = ({
    icon: Icon,
    title,
    value,
    subtitle,
    trend,
    color = 'blue',
    loading = false,
    onClick
}) => {
    const styles = COLOR_STYLES[color];

    // Trend icon and color
    const getTrendDisplay = () => {
        if (!trend) return null;

        const isPositive = trend.value > 0;
        const isNegative = trend.value < 0;
        const TrendIcon = isPositive ? TrendingUp : isNegative ? TrendingDown : Minus;
        const trendColor = isPositive ? 'text-emerald-600' : isNegative ? 'text-rose-600' : 'text-slate-400';

        return (
            <div className={cn('flex items-center gap-1 text-xs font-medium', trendColor)}>
                <TrendIcon size={12} />
                <span>{isPositive ? '+' : ''}{trend.value}%</span>
                {trend.label && <span className="text-slate-400 font-normal">{trend.label}</span>}
            </div>
        );
    };

    if (loading) {
        return (
            <div className="bg-white rounded-2xl border border-slate-100 p-5 animate-pulse">
                <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-slate-100 rounded-xl" />
                    <div className="flex-1 space-y-2">
                        <div className="h-4 bg-slate-100 rounded w-24" />
                        <div className="h-8 bg-slate-100 rounded w-16" />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div
            onClick={onClick}
            className={cn(
                'bg-white rounded-2xl border border-slate-100 p-5 transition-all duration-200',
                'hover:shadow-lg hover:border-slate-200',
                onClick && 'cursor-pointer'
            )}
        >
            <div className="flex items-start gap-4">
                {/* Icon */}
                <div className={cn('p-3 rounded-xl', styles.icon)}>
                    <Icon size={24} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-500 truncate">{title}</p>
                    <p className={cn('text-2xl font-bold mt-1', styles.accent)}>{value}</p>

                    {/* Subtitle or Trend */}
                    <div className="mt-2">
                        {subtitle && <p className="text-xs text-slate-400">{subtitle}</p>}
                        {getTrendDisplay()}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MetricCard;
