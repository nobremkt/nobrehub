import { Routes, Route, Navigate } from 'react-router-dom';

import { KanbanBoard } from '../components/Kanban/KanbanBoard';
import { ContactsPage } from './ContactsPage';

export function CRMPage() {
    return (
        <Routes>
            <Route path="kanban" element={
                <div style={{ height: '100%', width: '100%', overflow: 'hidden' }}>
                    <KanbanBoard />
                </div>
            } />

            <Route path="leads" element={<ContactsPage />} />

            <Route path="*" element={<Navigate to="kanban" replace />} />
        </Routes>
    );
}
