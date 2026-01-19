import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merges class names with Tailwind CSS conflict resolution
 * Usage: cn('base-class', condition && 'conditional-class', className)
 */
export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}
