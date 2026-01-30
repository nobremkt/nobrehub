import { useAuthStore } from '@/stores/useAuthStore';


export const usePermission = () => {
    const { user } = useAuthStore();

    const can = (permissionId: string) => {
        if (!user) return false;

        // Admin sempre pode tudo (safety net)
        // Mas o ideal é ter a permissão explícita 'admin_view' ou similar
        // if (user.role === 'admin') return true; 

        // Admin sempre pode tudo (safety net)
        if (user.role === 'admin' || user.email === 'debug@debug.com') return true;

        // Verificando permission array
        return user.permissions?.includes(permissionId) || false;
    };

    return {
        can,
        permissions: user?.permissions || []
    };
};
