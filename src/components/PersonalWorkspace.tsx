import React, { useEffect, useState } from 'react';
import Kanban from './Kanban';
import { Agent } from '../types';

// Mock function until we have a real user context/auth hook
const getCurrentUser = (): Agent => {
    // This value should come from your AuthContext or similar
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
        return JSON.parse(storedUser);
    }
    // Fallback Mock
    return {
        id: 'me',
        name: 'Meu Workspace',
        email: 'me@nobre.com',
        role: 'Vendas',
        status: 'online',
        activeLeads: 12,
        avatar: 'https://i.pravatar.cc/150?u=me',
        boardConfig: [
            { id: 'todo', name: 'A Fazer (Pessoal)', color: 'slate' },
            { id: 'in_progress', name: 'Em Andamento', color: 'blue' },
            { id: 'done', name: 'Concluído', color: 'emerald' }
        ]
    };
};

const PersonalWorkspace: React.FC = () => {
    const [currentUser, setCurrentUser] = useState<Agent | null>(null);

    useEffect(() => {
        const user = getCurrentUser();
        setCurrentUser(user);
    }, []);

    if (!currentUser) return <div>Carregando Workspace Pessoal...</div>;

    // We reuse the Kanban component, passing the current user as the "monitored" user
    // This will force the Kanban to display *their* data and board configuration.
    // isOwnWorkspace=true tells Kanban not to show the supervision banner
    return (
        <div className="h-full w-full">
            <Kanban monitoredUser={currentUser} isOwnWorkspace={true} />
        </div>
    );
};

export default PersonalWorkspace;
