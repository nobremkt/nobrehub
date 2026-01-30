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

// Buttons & Actions
export { Button } from './Button';
export type { ButtonProps, ButtonVariant, ButtonSize } from './Button';

export { PremiumButton } from './PremiumButton/PremiumButton';
export type { PremiumButtonProps } from './PremiumButton/PremiumButton';

// Form Elements
export { Input } from './Input';
export type { InputProps, InputSize } from './Input';

// Containers
export { Card, CardHeader, CardBody, CardFooter } from './Card';
export type { CardProps, CardHeaderProps } from './Card';

// Overlays
export { Modal } from './Modal';
export type { ModalProps, ModalSize } from './Modal';

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
