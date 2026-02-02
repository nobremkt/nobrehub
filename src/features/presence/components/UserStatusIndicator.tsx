import React from 'react';
import { UserStatus } from '../hooks/useTeamStatus';

interface UserStatusIndicatorProps {
    status?: UserStatus['state']; // 'online' | 'idle' | 'offline'
    size?: 'sm' | 'md' | 'lg';
    showLabel?: boolean;
}

export const UserStatusIndicator: React.FC<UserStatusIndicatorProps> = ({
    status = 'offline',
    size = 'md',
    showLabel = false
}) => {
    // Cores baseadas no Design System (aproximadas ou usando vars se possível, mas aqui vou hardcodar as vars de cor semânticas)
    // online -> success
    // idle -> warning
    // offline -> muted

    const sizeClasses = {
        sm: 'w-2 h-2',
        md: 'w-3 h-3',
        lg: 'w-4 h-4'
    };

    const colorClasses = {
        online: 'bg-green-500 box-shadow-green',
        idle: 'bg-yellow-500',
        offline: 'bg-gray-400 opacity-50'
    };

    // Status text em pt-BR
    const statusLabel = {
        online: 'Online',
        idle: 'Ausente',
        offline: 'Offline'
    };

    // Estilos inline para garantir as cores se o Tailwind não estiver pegando classes dinâmicas ou personalizadas
    const getStyle = () => {
        switch (status) {
            case 'online': return { backgroundColor: 'var(--color-success-500)', boxShadow: '0 0 4px var(--color-success-500)' };
            case 'idle': return { backgroundColor: 'var(--color-warning-500)' };
            case 'offline':
            default: return { backgroundColor: 'var(--color-text-muted)', opacity: 0.5 };
        }
    };

    const getSize = () => {
        switch (size) {
            case 'sm': return 8;
            case 'lg': return 16;
            case 'md':
            default: return 12;
        }
    };

    const pxSize = getSize();

    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span
                style={{
                    width: pxSize + 'px',
                    height: pxSize + 'px',
                    borderRadius: '50%',
                    display: 'inline-block',
                    ...getStyle()
                }}
                title={statusLabel[status]}
            />
            {showLabel && (
                <span style={{
                    fontSize: '0.75rem',
                    color: 'var(--color-text-secondary)'
                }}>
                    {statusLabel[status]}
                </span>
            )}
        </div>
    );
};
