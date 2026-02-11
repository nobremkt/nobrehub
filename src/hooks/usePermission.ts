import { useAuthStore } from '@/stores/useAuthStore';


export const usePermission = () => {
    const { user } = useAuthStore();

    const can = (permissionId: string) => {
        if (!user) return false;

        // Debug user always has full access
        if (user.email === 'debug@debug.com') return true;

        // Check permissions array (populated from role_permissions table)
        return user.permissions?.includes(permissionId) || false;
    };

    return {
        can,
        permissions: user?.permissions || []
    };
};
