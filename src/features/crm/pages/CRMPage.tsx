import { Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from '@/design-system/layouts';
import { KanbanBoard } from '../components/Kanban/KanbanBoard';

export function CRMPage() {
    return (
        <AppLayout>
            <Routes>
                <Route path="kanban" element={
                    <div style={{ height: '100%', width: '100%', overflow: 'hidden' }}>
                        <KanbanBoard />
                    </div>
                } />

                <Route path="leads" element={
                    <div className="flex flex-col items-center justify-center h-[calc(100vh-80px)] text-center">
                        <h1 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '0.5rem' }}>Base de Contatos</h1>
                        <p style={{ color: 'var(--color-text-muted)' }}>
                            Página em desenvolvimento
                        </p>
                    </div>
                } />

                <Route path="*" element={<Navigate to="kanban" replace />} />
            </Routes>
        </AppLayout>
    );
}
