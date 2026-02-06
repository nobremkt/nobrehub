/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * NOBRE HUB - FEATURE: STRATEGIC - PROJECTS PAGE
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Página de projetos estratégicos com sidebar e visualização detalhada.
 * Sidebar mostra lista de projetos, área principal mostra projeto selecionado.
 * 
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { useEffect, useState } from 'react';
import { useStrategicProjectsStore } from '../stores/useStrategicProjectsStore';
import { ProjectsSidebar } from '../components/ProjectsSidebar';
import { ProjectDetail } from '../components/ProjectDetail';
import { CreateProjectModal } from '../components/CreateProjectModal';
import styles from './StrategicProjectsPage.module.css';

export const StrategicProjectsPage = () => {
    const { init, cleanup } = useStrategicProjectsStore();
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    // Initialize store on mount
    useEffect(() => {
        init();
        return () => cleanup();
    }, [init, cleanup]);

    return (
        <div className={styles.pageContainer}>
            <ProjectsSidebar onCreateProject={() => setIsCreateModalOpen(true)} />
            <ProjectDetail />

            <CreateProjectModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
            />
        </div>
    );
};
