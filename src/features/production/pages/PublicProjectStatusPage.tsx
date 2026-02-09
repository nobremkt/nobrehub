import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
    AlertTriangle,
    CheckCircle2,
    ClipboardCheck,
    Clock3,
    Loader2,
    RefreshCcw,
    Rocket,
    ShieldCheck,
    Sparkles,
    Truck
} from 'lucide-react';
import { ProjectStatus } from '@/types/project.types';
import {
    ProjectStatusPageService,
    PublicProjectStatus
} from '@/features/production/services/ProjectStatusPageService';
import styles from './PublicProjectStatusPage.module.css';

type FlowStep = {
    status: Exclude<ProjectStatus, 'alteracao'>;
    title: string;
    subtitle: string;
};

const FLOW: FlowStep[] = [
    {
        status: 'aguardando',
        title: 'Projeto recebido',
        subtitle: 'Pedido confirmado e fila iniciada'
    },
    {
        status: 'em-producao',
        title: 'Em producao',
        subtitle: 'Equipe trabalhando no material'
    },
    {
        status: 'a-revisar',
        title: 'Em revisao',
        subtitle: 'Conferencia interna de qualidade'
    },
    {
        status: 'revisado',
        title: 'Pronto',
        subtitle: 'Projeto finalizado internamente'
    },
    {
        status: 'entregue',
        title: 'Entregue',
        subtitle: 'Material enviado para voce'
    },
    {
        status: 'concluido',
        title: 'Concluido',
        subtitle: 'Fluxo encerrado com sucesso'
    }
];

const STATUS_LABELS: Record<ProjectStatus, string> = {
    aguardando: 'Aguardando',
    'em-producao': 'Em producao',
    'a-revisar': 'A revisar',
    revisado: 'Revisado',
    alteracao: 'Em alteracao',
    entregue: 'Entregue',
    concluido: 'Concluido'
};

const STATUS_MESSAGES: Record<ProjectStatus, string> = {
    aguardando: 'Seu projeto foi recebido e esta aguardando inicio da equipe.',
    'em-producao': 'Estamos produzindo o seu material agora.',
    'a-revisar': 'Seu projeto esta em revisao interna de qualidade.',
    revisado: 'Projeto revisado e pronto para a etapa de entrega.',
    alteracao: 'Recebemos um pedido de ajuste e o projeto voltou para alteracao.',
    entregue: 'Projeto entregue. Estamos aguardando seu retorno.',
    concluido: 'Projeto finalizado. Obrigado por confiar no time Nobre Hub.'
};

const getProgressIndex = (status: ProjectStatus): number => {
    if (status === 'alteracao') {
        return FLOW.findIndex((step) => step.status === 'em-producao');
    }

    const index = FLOW.findIndex((step) => step.status === status);
    return index >= 0 ? index : 0;
};

const formatDate = (value?: Date): string => {
    if (!value) return '-';
    return new Intl.DateTimeFormat('pt-BR', {
        dateStyle: 'long',
        timeStyle: 'short'
    }).format(value);
};

export const PublicProjectStatusPage = () => {
    const { token = '' } = useParams<{ token: string }>();
    const [projectStatus, setProjectStatus] = useState<PublicProjectStatus | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [hasResolvedFirstLoad, setHasResolvedFirstLoad] = useState(false);

    useEffect(() => {
        const normalizedToken = token.trim();
        if (!normalizedToken) {
            setProjectStatus(null);
            setIsLoading(false);
            setHasResolvedFirstLoad(true);
            return;
        }

        let isMounted = true;
        setIsLoading(true);

        ProjectStatusPageService.getByToken(normalizedToken)
            .then((statusData) => {
                if (!isMounted) return;
                setProjectStatus(statusData);
                setHasResolvedFirstLoad(true);
                setIsLoading(false);
            })
            .catch(() => {
                if (!isMounted) return;
                setProjectStatus(null);
                setHasResolvedFirstLoad(true);
                setIsLoading(false);
            });

        const unsubscribe = ProjectStatusPageService.subscribeByToken(normalizedToken, (statusData) => {
            if (!isMounted) return;
            setProjectStatus(statusData);
            setIsLoading(false);
        });

        return () => {
            isMounted = false;
            unsubscribe();
        };
    }, [token]);

    const progressIndex = useMemo(
        () => (projectStatus ? getProgressIndex(projectStatus.status) : 0),
        [projectStatus]
    );

    const isDelayed = useMemo(() => {
        if (!projectStatus?.dueDate) return false;
        const finishedStatuses: ProjectStatus[] = ['entregue', 'concluido'];
        return !finishedStatuses.includes(projectStatus.status) && projectStatus.dueDate.getTime() < Date.now();
    }, [projectStatus]);

    const headerIcon = useMemo(() => {
        if (!projectStatus) return Sparkles;

        if (projectStatus.status === 'concluido') return ShieldCheck;
        if (projectStatus.status === 'entregue') return Truck;
        if (projectStatus.status === 'alteracao') return RefreshCcw;
        if (projectStatus.status === 'revisado') return ClipboardCheck;
        if (projectStatus.status === 'em-producao') return Rocket;
        return Clock3;
    }, [projectStatus]);

    if (isLoading && !projectStatus) {
        return (
            <main className={styles.page}>
                <div className={styles.backdrop} />
                <section className={styles.loadingCard}>
                    <Loader2 className={styles.spinner} size={28} />
                    <h1>Carregando status do projeto</h1>
                    <p>Aguarde um instante...</p>
                </section>
            </main>
        );
    }

    if (!projectStatus && hasResolvedFirstLoad) {
        return (
            <main className={styles.page}>
                <div className={styles.backdrop} />
                <section className={styles.emptyCard}>
                    <AlertTriangle size={28} />
                    <h1>Status nao encontrado</h1>
                    <p>Este link pode estar invalido ou ter expirado.</p>
                </section>
            </main>
        );
    }

    if (!projectStatus) return null;

    const HeaderIcon = headerIcon;

    return (
        <main className={styles.page}>
            <div className={styles.backdrop} />
            <section className={styles.card}>
                <header className={styles.header}>
                    <div className={styles.titleArea}>
                        <span className={styles.kicker}>Nobre Hub | Status em tempo real</span>
                        <h1>{projectStatus.projectName}</h1>
                        <p>Cliente: {projectStatus.leadName}</p>
                    </div>
                    <div className={styles.statusChip}>
                        <HeaderIcon size={18} />
                        <span>{STATUS_LABELS[projectStatus.status]}</span>
                    </div>
                </header>

                <section className={styles.highlight}>
                    <h2>Atualizacao atual</h2>
                    <p>{STATUS_MESSAGES[projectStatus.status]}</p>
                    <div className={styles.metaGrid}>
                        <div>
                            <span>Ultima atualizacao</span>
                            <strong>{formatDate(projectStatus.updatedAt)}</strong>
                        </div>
                        <div>
                            <span>Prazo previsto</span>
                            <strong>{formatDate(projectStatus.dueDate)}</strong>
                        </div>
                        <div>
                            <span>Responsavel atual</span>
                            <strong>{projectStatus.producerName || 'Equipe Nobre Hub'}</strong>
                        </div>
                    </div>
                    {isDelayed && (
                        <div className={styles.delayAlert}>
                            <AlertTriangle size={16} />
                            <span>Projeto em andamento fora do prazo previsto. O time ja esta atuando nisso.</span>
                        </div>
                    )}
                </section>

                <section className={styles.timelineSection}>
                    <h2>Andamento</h2>
                    <div className={styles.timeline}>
                        {FLOW.map((step, index) => {
                            const completed = index < progressIndex;
                            const active = index === progressIndex;

                            return (
                                <div
                                    key={step.status}
                                    className={`${styles.timelineItem} ${completed ? styles.completed : ''} ${active ? styles.active : ''}`}
                                >
                                    <div className={styles.marker}>
                                        {completed ? <CheckCircle2 size={15} /> : <span />}
                                    </div>
                                    <div className={styles.itemContent}>
                                        <strong>{step.title}</strong>
                                        <span>{step.subtitle}</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </section>

                <footer className={styles.footer}>
                    <span className={styles.realtimeDot} />
                    <span>Atualizacao automatica em tempo real</span>
                </footer>
            </section>
        </main>
    );
};

