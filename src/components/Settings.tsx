
import React, { useState } from 'react';
import { Settings as SettingsIcon, Building2, MessageSquare, Bell, Palette, Shield, Save, Check, ChevronRight, Globe, Clock, ToggleLeft, ToggleRight } from 'lucide-react';

interface SettingToggleProps {
    label: string;
    description: string;
    enabled: boolean;
    onToggle: () => void;
}

const SettingToggle: React.FC<SettingToggleProps> = ({ label, description, enabled, onToggle }) => (
    <div className="flex items-center justify-between py-4 border-b border-white/5 last:border-0">
        <div>
            <div className="text-white font-bold text-sm">{label}</div>
            <div className="text-white/40 text-xs mt-1">{description}</div>
        </div>
        <button onClick={onToggle} className="text-rose-500">
            {enabled ? <ToggleRight size={32} /> : <ToggleLeft size={32} className="text-white/20" />}
        </button>
    </div>
);

const Settings: React.FC = () => {
    const [activeSection, setActiveSection] = useState('empresa');
    const [saved, setSaved] = useState(false);

    // Settings state
    const [settings, setSettings] = useState({
        // Empresa
        companyName: 'Nobre Marketing',
        companyEmail: 'contato@nobremarketing.com.br',
        companyPhone: '(35) 98856-079',
        // WhatsApp
        welcomeMessage: 'Olá! Obrigado por entrar em contato com a Nobre Marketing. Em que podemos ajudar?',
        autoReply: true,
        workingHours: '08:00 - 18:00',
        // Notificações
        emailNotifications: true,
        soundNotifications: true,
        browserNotifications: false,
        // Pipeline
        autoAssignment: true,
        roundRobin: true,
    });

    const updateSetting = (key: string, value: any) => {
        setSettings(prev => ({ ...prev, [key]: value }));
        setSaved(false);
    };

    const handleSave = () => {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
    };

    const sections = [
        { id: 'empresa', label: 'Empresa', icon: Building2 },
        { id: 'whatsapp', label: 'WhatsApp', icon: MessageSquare },
        { id: 'notificacoes', label: 'Notificações', icon: Bell },
        { id: 'pipeline', label: 'Pipeline', icon: Palette },
    ];

    return (
        <div className="h-screen flex flex-col bg-[#0b0b0e] overflow-hidden animate-in fade-in duration-700">
            <header className="px-10 py-8 border-b border-white/5 bg-[#12121a]/30 backdrop-blur-md z-20 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-white tracking-tight uppercase">Configurações</h1>
                    <p className="text-white/30 text-xs font-bold uppercase tracking-widest mt-1">Personalize sua experiência</p>
                </div>
                <button
                    onClick={handleSave}
                    className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${saved
                            ? 'bg-emerald-600 text-white'
                            : 'bg-rose-600 hover:bg-rose-700 text-white shadow-2xl shadow-rose-900/30'
                        }`}
                >
                    {saved ? <Check size={18} /> : <Save size={18} />}
                    {saved ? 'Salvo!' : 'Salvar Alterações'}
                </button>
            </header>

            <div className="flex-1 flex overflow-hidden">
                {/* Sidebar */}
                <div className="w-80 border-r border-white/5 bg-[#12121a]/50 p-6">
                    <div className="space-y-2">
                        {sections.map((section) => (
                            <button
                                key={section.id}
                                onClick={() => setActiveSection(section.id)}
                                className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all ${activeSection === section.id
                                        ? 'bg-rose-600 text-white shadow-lg shadow-rose-900/30'
                                        : 'text-white/40 hover:text-white hover:bg-white/5'
                                    }`}
                            >
                                <section.icon size={20} />
                                <span className="font-bold text-sm">{section.label}</span>
                                <ChevronRight size={16} className="ml-auto" />
                            </button>
                        ))}
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-10 no-scrollbar">
                    {activeSection === 'empresa' && (
                        <div className="max-w-2xl">
                            <h2 className="text-lg font-black text-white mb-6">Dados da Empresa</h2>
                            <div className="bg-[#12121a] border border-white/5 rounded-3xl p-8 space-y-6">
                                <div>
                                    <label className="block text-[10px] font-black text-white/40 uppercase tracking-widest mb-2">Nome da Empresa</label>
                                    <input
                                        type="text"
                                        value={settings.companyName}
                                        onChange={(e) => updateSetting('companyName', e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-rose-500 focus:outline-none transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-white/40 uppercase tracking-widest mb-2">Email de Contato</label>
                                    <input
                                        type="email"
                                        value={settings.companyEmail}
                                        onChange={(e) => updateSetting('companyEmail', e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-rose-500 focus:outline-none transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-white/40 uppercase tracking-widest mb-2">Telefone</label>
                                    <input
                                        type="text"
                                        value={settings.companyPhone}
                                        onChange={(e) => updateSetting('companyPhone', e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-rose-500 focus:outline-none transition-all"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {activeSection === 'whatsapp' && (
                        <div className="max-w-2xl">
                            <h2 className="text-lg font-black text-white mb-6">Configurações do WhatsApp</h2>
                            <div className="bg-[#12121a] border border-white/5 rounded-3xl p-8 space-y-6">
                                <div>
                                    <label className="block text-[10px] font-black text-white/40 uppercase tracking-widest mb-2">Mensagem de Boas-vindas</label>
                                    <textarea
                                        value={settings.welcomeMessage}
                                        onChange={(e) => updateSetting('welcomeMessage', e.target.value)}
                                        rows={3}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-rose-500 focus:outline-none transition-all resize-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-white/40 uppercase tracking-widest mb-2">Horário de Atendimento</label>
                                    <div className="flex items-center gap-3">
                                        <Clock size={18} className="text-white/40" />
                                        <input
                                            type="text"
                                            value={settings.workingHours}
                                            onChange={(e) => updateSetting('workingHours', e.target.value)}
                                            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-rose-500 focus:outline-none transition-all"
                                        />
                                    </div>
                                </div>
                                <div className="pt-4 border-t border-white/5">
                                    <SettingToggle
                                        label="Resposta Automática"
                                        description="Enviar mensagem automática fora do horário de atendimento"
                                        enabled={settings.autoReply}
                                        onToggle={() => updateSetting('autoReply', !settings.autoReply)}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {activeSection === 'notificacoes' && (
                        <div className="max-w-2xl">
                            <h2 className="text-lg font-black text-white mb-6">Preferências de Notificação</h2>
                            <div className="bg-[#12121a] border border-white/5 rounded-3xl p-8">
                                <SettingToggle
                                    label="Notificações por Email"
                                    description="Receber alertas de novos leads e mensagens por email"
                                    enabled={settings.emailNotifications}
                                    onToggle={() => updateSetting('emailNotifications', !settings.emailNotifications)}
                                />
                                <SettingToggle
                                    label="Sons de Notificação"
                                    description="Reproduzir som ao receber novas mensagens"
                                    enabled={settings.soundNotifications}
                                    onToggle={() => updateSetting('soundNotifications', !settings.soundNotifications)}
                                />
                                <SettingToggle
                                    label="Notificações do Navegador"
                                    description="Exibir notificações push no navegador"
                                    enabled={settings.browserNotifications}
                                    onToggle={() => updateSetting('browserNotifications', !settings.browserNotifications)}
                                />
                            </div>
                        </div>
                    )}

                    {activeSection === 'pipeline' && (
                        <div className="max-w-2xl">
                            <h2 className="text-lg font-black text-white mb-6">Configurações do Pipeline</h2>
                            <div className="bg-[#12121a] border border-white/5 rounded-3xl p-8">
                                <SettingToggle
                                    label="Atribuição Automática"
                                    description="Atribuir leads automaticamente aos closers disponíveis"
                                    enabled={settings.autoAssignment}
                                    onToggle={() => updateSetting('autoAssignment', !settings.autoAssignment)}
                                />
                                <SettingToggle
                                    label="Distribuição Round Robin"
                                    description="Distribuir leads igualmente entre os closers"
                                    enabled={settings.roundRobin}
                                    onToggle={() => updateSetting('roundRobin', !settings.roundRobin)}
                                />
                            </div>

                            <h3 className="text-sm font-black text-white/60 mt-8 mb-4">Status do Pipeline High Ticket</h3>
                            <div className="bg-[#12121a] border border-white/5 rounded-3xl p-6">
                                <div className="flex flex-wrap gap-2">
                                    {['Novo', 'Qualificado', 'Call Agendada', 'Proposta', 'Negociação', 'Fechado', 'Perdido'].map((status, i) => (
                                        <span
                                            key={status}
                                            className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white/60 text-xs font-bold"
                                        >
                                            {i + 1}. {status}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Settings;
