/*
 * ═══════════════════════════════════════════════════════════════════════════════
 * NOBRE HUB - DESIGN SYSTEM COMPONENTS
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Export central de todos os componentes do Design System.
 * Use: import { Button, Input, Card } from '@/design-system/components';
 * 
 * ═══════════════════════════════════════════════════════════════════════════════
 */

// Display
export { Avatar } from './Avatar';
export type { AvatarProps } from './Avatar';

// Buttons & Actions
export { Button } from './Button';
export type { ButtonProps, ButtonVariant, ButtonSize } from './Button';

export { PremiumButton } from './PremiumButton/PremiumButton';
export type { PremiumButtonProps } from './PremiumButton/PremiumButton';

// Form Elements
export { Input } from './Input';
export type { InputProps, InputSize } from './Input';

export { NumberInput } from './NumberInput';
export type { NumberInputProps } from './NumberInput';

export { PhoneInput } from './PhoneInput/PhoneInput';


// Containers
export { Card, CardHeader, CardBody, CardFooter } from './Card';
export type { CardProps, CardHeaderProps } from './Card';

// Overlays
export { Modal } from './Modal';
export type { ModalProps, ModalSize } from './Modal';

export { ConfirmModal } from './ConfirmModal';
export type { ConfirmModalProps, ConfirmVariant } from './ConfirmModal';

// Display
export { Tag } from './Tag';
export type { TagProps, TagVariant, TagSize } from './Tag';

export { Badge } from './Badge';
export type { BadgeProps, BadgeVariant } from './Badge';


// Feedback
export { Spinner } from './Spinner';
export type { SpinnerProps, SpinnerSize } from './Spinner';

// Inputs
export { Switch } from './Switch';
export type { SwitchProps } from './Switch';

export { Checkbox } from './Checkbox';
export type { CheckboxProps } from './Checkbox';

export { Dropdown } from './Dropdown';
export type { DropdownProps } from './Dropdown';

export { ScrollArea } from './ScrollArea';
export type { ScrollAreaProps } from './ScrollArea';

export { PersonCard } from './PersonCard';
export type { PersonCardProps } from './PersonCard';

export { LazyImage } from './LazyImage';
export type { LazyImageProps } from './LazyImage';

// Navigation
export { Tabs } from './Tabs';
export type { TabsProps, TabItem } from './Tabs';

// Feedback
export { ProgressBar } from './ProgressBar';
export type { ProgressBarProps } from './ProgressBar';

export { EmptyState } from './EmptyState';
export type { EmptyStateProps } from './EmptyState';

export { Skeleton } from './Skeleton';
export type { SkeletonProps } from './Skeleton';

export { Tooltip } from './Tooltip';
export type { TooltipProps } from './Tooltip';

// Form Elements
export { Textarea } from './Textarea';
export type { TextareaProps } from './Textarea';
