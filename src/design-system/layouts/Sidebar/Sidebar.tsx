/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * NOBRE HUB - LAYOUT: SIDEBAR
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Sidebar retrátil com hover. Expande ao passar o mouse, retrai ao sair.
 * 
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { NavLink, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    Users,
    Video,
    Package,
    UsersRound,
    Settings,
    LogOut,
    User,
    ChevronDown,
    Kanban,
    Contact,
    Inbox,
    MessagesSquare,
    Building2,
    Palette,
    Tag,
    FileText,
    Plug,
    Shield,
    Briefcase,
    UserCog,
    Moon,
    Bug,
    UserCheck,
    Upload,
    Target,
    CalendarDays,
    Shuffle,
    Lightbulb,
    Share2,
    Database,
    Wand2,
    Film,
    ScrollText,
    Stamp,
    Cat,
    GalleryHorizontalEnd,
    DollarSign,
    TrendingUp,
    ArrowUpDown,
    FolderOpen
} from 'lucide-react';
import { useAuthStore, useUIStore } from '@/stores';
import { ROUTES } from '@/config';
import { getInitials } from '@/utils';
import styles from './Sidebar.module.css';

import { usePermission } from '@/hooks/usePermission';
import { PERMISSIONS } from '@/config/permissions';

interface SubItem {
    id: string;
    label: string;
    path: string;
    icon: React.ReactNode;
    permission?: string;
}

interface NavCategory {
    id: string;
    label: string;
    icon: React.ReactNode;
    path?: string;
    subItems?: SubItem[];
    permission?: string;
}

const navCategories: NavCategory[] = [
    {
        id: 'dashboard',
        label: 'Dashboard',
        icon: <LayoutDashboard size={20} />,
        path: ROUTES.dashboard
    },
    {
        id: 'crm',
        label: 'CRM',
        icon: <Users size={20} />,
        permission: PERMISSIONS.VIEW_CRM,
        subItems: [
            { id: 'kanban', label: 'Kanban', path: ROUTES.crm.kanban, icon: <Kanban size={18} /> },
            { id: 'leads', label: 'Base de Contatos', path: ROUTES.crm.leads, icon: <Contact size={18} /> },
            { id: 'inbox', label: 'Inbox', path: ROUTES.inbox.root, icon: <Inbox size={18} /> },
        ]
    },
    {
        id: 'production',
        label: 'Produção',
        icon: <Video size={20} />,
        permission: PERMISSIONS.VIEW_PRODUCTION,
        path: ROUTES.production.root
    },
    {
        id: 'postSales',
        label: 'Pós-Venda',
        icon: <Package size={20} />,
        permission: PERMISSIONS.VIEW_POST_SALES,
        path: ROUTES.postSales.root
    },
    {
        id: 'team',
        label: 'Equipe',
        icon: <UsersRound size={20} />,
        subItems: [
            { id: 'members', label: 'Membros', path: ROUTES.team.members, icon: <User size={18} /> },
            { id: 'chat', label: 'Chat da Equipe', path: ROUTES.team.chat, icon: <MessagesSquare size={18} /> },
        ]
    },
    {
        id: 'strategic',
        label: 'Estratégico',
        icon: <Lightbulb size={20} />,
        permission: PERMISSIONS.VIEW_STRATEGIC,
        subItems: [
            { id: 'notes', label: 'Anotações', path: ROUTES.strategic.notes, icon: <FileText size={18} /> },
            { id: 'strategicProjects', label: 'Projetos', path: ROUTES.strategic.projects, icon: <Briefcase size={18} /> },
            { id: 'socialMedia', label: 'Social Media', path: ROUTES.strategic.socialMedia, icon: <Share2 size={18} /> },
        ]
    },
    {
        id: 'financial',
        label: 'Financeiro',
        icon: <DollarSign size={20} />,
        permission: PERMISSIONS.VIEW_FINANCIAL,
        subItems: [
            { id: 'cash-flow', label: 'Fluxo de Caixa', path: ROUTES.financial.cashFlow, icon: <TrendingUp size={18} /> },
            { id: 'transactions', label: 'Transações', path: ROUTES.financial.transactions, icon: <ArrowUpDown size={18} /> },
            { id: 'categories', label: 'Categorias', path: ROUTES.financial.categories, icon: <FolderOpen size={18} /> },
        ]
    },
    // TODO: Substituir por permissão real quando o módulo "Estúdio de Criação" sair do beta
    // Por enquanto, usa o mesmo padrão hardcoded de debug (email check no render)
    {
        id: 'studio',
        label: 'Estúdio de Criação',
        icon: <Wand2 size={20} />,
        subItems: [
            { id: 'image-generator', label: 'Gerador de Imagens', path: ROUTES.studio.imageGenerator, icon: <Wand2 size={18} /> },
            { id: 'video-generator', label: 'Gerador de Vídeos', path: ROUTES.studio.videoGenerator, icon: <Film size={18} /> },
            { id: 'script-generator', label: 'Gerador de Roteiros', path: ROUTES.studio.scriptGenerator, icon: <ScrollText size={18} /> },
            { id: 'logos', label: 'Logotipos', path: ROUTES.studio.logos, icon: <Stamp size={18} /> },
            { id: 'mascot', label: 'Mascote', path: ROUTES.studio.mascot, icon: <Cat size={18} /> },
            { id: 'gallery', label: 'Galeria', path: ROUTES.studio.gallery, icon: <GalleryHorizontalEnd size={18} /> },
        ]
    },
    {
        id: 'debug',
        label: 'Debug',
        icon: <Bug size={20} />,
        permission: PERMISSIONS.VIEW_ADMIN, // Restrito a admin
        subItems: [
            { id: 'debug-ui', label: 'DEBUG UI', path: ROUTES.debug_ui, icon: <Palette size={18} /> },
            { id: 'data-import', label: 'Importar Dados', path: ROUTES.data_import, icon: <Upload size={18} /> },
            { id: 'debug-integrations', label: 'Integrações', path: ROUTES.debug_integrations, icon: <Plug size={18} /> },
            { id: 'debug-database', label: 'Banco de Dados', path: ROUTES.debug_database, icon: <Database size={18} /> },
            { id: 'debug-image-styles', label: 'Estilos de Imagem', path: ROUTES.debug_imageStyles, icon: <Palette size={18} /> },
        ]
    },
    {
        id: 'administration',
        label: 'Administração',
        icon: <Shield size={20} />,
        permission: PERMISSIONS.VIEW_ADMIN,
        subItems: [
            // Organização
            { id: 'organization', label: 'Organização', path: ROUTES.settings.organization, icon: <Building2 size={18} /> },

            // Equipe
            { id: 'sectors', label: 'Setores', path: ROUTES.settings.sectors, icon: <Briefcase size={18} /> },
            { id: 'roles', label: 'Cargos', path: ROUTES.settings.roles, icon: <UserCog size={18} /> },
            { id: 'collaborators', label: 'Colaboradores', path: ROUTES.settings.collaborators, icon: <UserCheck size={18} /> },
            { id: 'permissions', label: 'Permissões', path: ROUTES.settings.permissions, icon: <Shield size={18} /> },

            // CRM / Vendas
            { id: 'pipeline', label: 'Pipeline', path: ROUTES.settings.pipeline, icon: <Kanban size={18} /> },
            { id: 'products', label: 'Produtos', path: ROUTES.settings.products, icon: <Tag size={18} /> },
            { id: 'lossReasons', label: 'Motivos de Perda', path: ROUTES.settings.lossReasons, icon: <FileText size={18} /> },
            { id: 'leadDistribution', label: 'Distribuição de Leads', path: ROUTES.settings.leadDistribution, icon: <Shuffle size={18} /> },

            // Operacional
            { id: 'goals', label: 'Metas', path: ROUTES.settings.goals, icon: <Target size={18} /> },
            { id: 'holidays', label: 'Feriados & Folgas', path: ROUTES.settings.holidays, icon: <CalendarDays size={18} /> },

            // Técnico
            { id: 'customFields', label: 'Campos Customizados', path: ROUTES.settings.customFields, icon: <Palette size={18} /> },
        ]
    },
    {
        id: 'settings',
        label: 'Configurações',
        icon: <Settings size={20} />,
        subItems: [
            { id: 'appearance', label: 'Aparência', path: ROUTES.settings.appearance, icon: <Moon size={18} /> },
        ]
    },
];

export function Sidebar() {
    const { user, logout } = useAuthStore();
    const { sidebarCollapsed, setSidebarCollapsed, sidebarExpandedCategories, toggleSidebarCategory } = useUIStore();
    const { can } = usePermission();
    const location = useLocation();

    const handleMouseEnter = () => {
        setSidebarCollapsed(false);
    };

    const handleMouseLeave = () => {
        setSidebarCollapsed(true);
    };

    const handleLogout = async () => {
        try {
            await logout();
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    const isActive = (path: string) => {
        if (path === '/') return location.pathname === '/';
        return location.pathname.startsWith(path);
    };

    const isCategoryActive = (category: NavCategory) => {
        if (category.path) return isActive(category.path);
        return category.subItems?.some(sub => isActive(sub.path)) || false;
    };

    const handleCategoryClick = (categoryId: string) => {
        toggleSidebarCategory(categoryId);
    };

    return (
        <aside
            className={`${styles.sidebar} ${sidebarCollapsed ? styles.collapsed : ''}`}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            {/* Navigation */}
            <nav className={styles.nav}>
                <ul className={styles.navList}>
                    {navCategories.map((category) => {
                        // Check category permission
                        if (category.permission && !can(category.permission)) {
                            return null;
                        }

                        // Hardcode: Hide debug and studio categories for everyone except debug@debug.com
                        // TODO: Substituir por permissão real quando o módulo "Estúdio de Criação" sair do beta
                        if ((category.id === 'debug' || category.id === 'studio') && user?.email !== 'debug@debug.com') {
                            return null;
                        }

                        const active = isCategoryActive(category);
                        const expanded = sidebarExpandedCategories.includes(category.id);

                        return (
                            <li key={category.id} className={styles.category}>
                                {category.subItems ? (
                                    <>
                                        <button
                                            className={`${styles.categoryBtn} ${active ? styles.active : ''}`}
                                            onClick={() => handleCategoryClick(category.id)}
                                            title={sidebarCollapsed ? category.label : undefined}
                                        >
                                            <span className={styles.categoryIcon}>{category.icon}</span>
                                            <span className={styles.categoryLabel}>{category.label}</span>
                                            <ChevronDown
                                                size={16}
                                                className={`${styles.chevron} ${expanded ? styles.expanded : ''}`}
                                            />
                                        </button>

                                        <ul className={`${styles.subList} ${expanded && !sidebarCollapsed ? styles.open : ''}`}>
                                            {category.subItems.map((sub) => {
                                                // Check subitem permission
                                                if (sub.permission && !can(sub.permission)) {
                                                    return null;
                                                }

                                                return (
                                                    <li key={sub.id}>
                                                        <NavLink
                                                            to={sub.path}
                                                            className={`${styles.subItem} ${isActive(sub.path) ? styles.active : ''}`}
                                                        >
                                                            <span className={styles.subIcon}>{sub.icon}</span>
                                                            <span className={styles.subLabel}>{sub.label}</span>
                                                        </NavLink>
                                                    </li>
                                                );
                                            })}
                                        </ul>
                                    </>
                                ) : (
                                    <NavLink
                                        to={category.path!}
                                        className={`${styles.categoryBtn} ${active ? styles.active : ''}`}
                                        title={sidebarCollapsed ? category.label : undefined}
                                    >
                                        <span className={styles.categoryIcon}>{category.icon}</span>
                                        <span className={styles.categoryLabel}>{category.label}</span>
                                    </NavLink>
                                )}
                            </li>
                        );
                    })}
                </ul>
            </nav>

            {/* User Section */}
            <div className={styles.userSection}>
                <div className={styles.userInfo}>
                    <div className={styles.userAvatar}>
                        {user?.avatar ? (
                            <img src={user.avatar} alt={user.name} />
                        ) : (
                            <span>{user ? getInitials(user.name) : <User size={20} />}</span>
                        )}
                    </div>
                    <div className={styles.userDetails}>
                        <span className={styles.userName}>{user?.name || 'Usuário'}</span>
                        <span className={styles.userRole}>{user?.roleName || 'Cargo'}</span>
                    </div>
                </div>
                <button
                    className={styles.logoutBtn}
                    onClick={handleLogout}
                    title="Sair"
                >
                    <LogOut size={18} />
                </button>
            </div>
        </aside>
    );
}
