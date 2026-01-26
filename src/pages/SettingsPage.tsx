import React, { useState } from 'react';
import { Building2, MessageSquare, Bell, Palette, Shield, ChevronRight, Globe, Lock, Package } from 'lucide-react';
import ChannelSettings from '../components/settings/ChannelSettings';
import PermissionsManager from '../components/settings/PermissionsManager';
import ProductsManager from '../components/settings/ProductsManager';
import CompanySettings from '../components/settings/CompanySettings';
import NotificationSettings from '../components/settings/NotificationSettings';
import PipelineSettings from '../components/settings/PipelineSettings';

const SettingsPage: React.FC = () => {
    const [activeSection, setActiveSection] = useState('channels'); // Default to channels as requested

    const sections = [
        { id: 'channels', label: 'Canais', icon: MessageSquare, description: 'WhatsApp, Instagram, Email' },
        { id: 'permissions', label: 'Acessos', icon: Shield, description: 'Cargos e Permissões' },
        { id: 'products', label: 'Produtos', icon: Package, description: 'Catálogo de serviços' },
        { id: 'company', label: 'Empresa', icon: Building2, description: 'Dados organizacionais' },
        { id: 'notifications', label: 'Notificações', icon: Bell, description: 'Alertas e preferências' },
        { id: 'pipeline', label: 'Pipeline', icon: Palette, description: 'Personalização do funil' },
    ];

    return (
        <div className="h-dvh flex flex-col bg-slate-50 overflow-hidden">
            {/* Header */}
            <header className="px-8 py-6 border-b border-slate-200 bg-white flex items-center justify-between z-20">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Configurações</h1>
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">
                        Gerencie canais, acessos e preferências
                    </p>
                </div>
            </header>

            <div className="flex-1 flex overflow-hidden">
                {/* Sidebar */}
                <div className="w-72 border-r border-slate-200 bg-white p-4 overflow-y-auto">
                    <div className="space-y-1">
                        {sections.map((section) => (
                            <button
                                key={section.id}
                                onClick={() => setActiveSection(section.id)}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all group ${activeSection === section.id
                                    ? 'bg-rose-50 text-rose-600 border border-rose-100 shadow-sm'
                                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900 border border-transparent'
                                    }`}
                            >
                                <div className={`p-2 rounded-lg ${activeSection === section.id ? 'bg-rose-100' : 'bg-slate-100 group-hover:bg-slate-200'}`}>
                                    <section.icon size={18} />
                                </div>
                                <div className="text-left">
                                    <div className="font-bold text-sm tracking-tight">{section.label}</div>
                                    <div className="text-[10px] text-slate-400 font-medium truncate max-w-[120px]">{section.description}</div>
                                </div>
                                {activeSection === section.id && <ChevronRight size={14} className="ml-auto" />}
                            </button>
                        ))}
                    </div>

                    <div className="mt-8 px-4 py-4 bg-slate-50 rounded-xl border border-slate-100">
                        <div className="flex items-center gap-2 text-slate-400 mb-2">
                            <Lock size={14} />
                            <span className="text-[10px] font-black uppercase tracking-widest">Segurança</span>
                        </div>
                        <p className="text-xs text-slate-500 leading-relaxed">
                            Algumas configurações sensíveis exigem nível de acesso Administrativo ou Estratégico.
                        </p>
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto bg-slate-50 p-8 md:p-12">
                    <div className="max-w-5xl mx-auto">
                        {activeSection === 'channels' && <ChannelSettings />}

                        {activeSection === 'permissions' && <PermissionsManager />}

                        {activeSection === 'products' && <ProductsManager />}

                        {activeSection === 'company' && <CompanySettings />}

                        {activeSection === 'notifications' && <NotificationSettings />}

                        {activeSection === 'pipeline' && <PipelineSettings />}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SettingsPage;
