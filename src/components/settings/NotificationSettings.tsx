import React, { useEffect, useState } from 'react';
import { Bell, Save, Mail, MessageSquare, Smartphone, Check } from 'lucide-react';
import { toast } from 'sonner';

interface NotificationPreferences {
    emailLeads: boolean;
    emailDeals: boolean;
    emailActivities: boolean;
    emailSystem: boolean;
    pushLeads: boolean;
    pushDeals: boolean;
    pushActivities: boolean;
    pushMentions: boolean;
    whatsappLeads: boolean;
    whatsappUrgent: boolean;
}

const NotificationSettings: React.FC = () => {
    const [prefs, setPrefs] = useState<NotificationPreferences | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchPreferences();
    }, []);

    const fetchPreferences = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${import.meta.env.VITE_API_URL}/notifications/preferences`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setPrefs(data);
            }
        } catch (error) {
            console.error('Error fetching preferences:', error);
            toast.error('Erro ao carregar preferências');
        } finally {
            setLoading(false);
        }
    };

    const handleToggle = (key: keyof NotificationPreferences) => {
        if (!prefs) return;
        setPrefs({ ...prefs, [key]: !prefs[key] });
    };

    const handleSave = async () => {
        if (!prefs) return;
        setSaving(true);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${import.meta.env.VITE_API_URL}/notifications/preferences`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(prefs)
            });

            if (response.ok) {
                toast.success('Preferências salvas com sucesso!');
            } else {
                toast.error('Erro ao salvar preferências');
            }
        } catch (error) {
            console.error('Error updating preferences:', error);
            toast.error('Erro ao salvar preferências');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-8 text-center text-slate-500">Carregando...</div>;
    if (!prefs) return <div className="p-8 text-center text-slate-500">Erro ao carregar configurações.</div>;

    const sections = [
        {
            title: 'Notificações por Email',
            icon: <Mail size={20} className="text-violet-600" />,
            description: 'Escolha quais emails você deseja receber.',
            items: [
                { key: 'emailLeads', label: 'Novos Leads', desc: 'Quando um novo lead é atribuído a você' },
                { key: 'emailDeals', label: 'Atualizações de Negócios', desc: 'Mudanças de etapa ou novos negócios' },
                { key: 'emailActivities', label: 'Atividades Pendentes', desc: 'Resumo diário de suas tarefas' },
                { key: 'emailSystem', label: 'Avisos do Sistema', desc: 'Atualizações importantes da plataforma' },
            ]
        },
        {
            title: 'Notificações Push / App',
            icon: <Bell size={20} className="text-rose-600" />,
            description: 'Alertas em tempo real no navegador.',
            items: [
                { key: 'pushLeads', label: 'Novos Leads', desc: 'Alerta instantâneo de novos leads' },
                { key: 'pushDeals', label: 'Ganhos e Perdas', desc: 'Quando um negócio é fechado' },
                { key: 'pushActivities', label: 'Lembretes de Atividades', desc: '15 minutos antes de uma tarefa' },
                { key: 'pushMentions', label: 'Menções', desc: 'Quando alguém te menciona em uma nota' },
            ]
        },
        {
            title: 'WhatsApp',
            icon: <MessageSquare size={20} className="text-emerald-600" />,
            description: 'Receba alertas críticos no seu WhatsApp pessoal.',
            items: [
                { key: 'whatsappLeads', label: 'Leads Quentes', desc: 'Apenas leads com alta pontuação' },
                { key: 'whatsappUrgent', label: 'Alertas Urgentes', desc: 'Falhas de sistema ou segurança' },
            ]
        }
    ];

    return (
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm animate-in fade-in duration-300">
            <header className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-xl font-bold text-slate-900">Notificações</h2>
                    <p className="text-slate-500 text-sm mt-1">Gerencie como e quando você quer ser avisado</p>
                </div>
                <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center border border-slate-100">
                    <Bell className="text-slate-400" size={24} />
                </div>
            </header>

            <div className="space-y-8">
                {sections.map((section, idx) => (
                    <div key={idx} className="space-y-4">
                        <div className="flex items-center gap-3 pb-2 border-b border-slate-100">
                            <div className="p-2 bg-slate-50 rounded-lg">{section.icon}</div>
                            <div>
                                <h3 className="font-bold text-slate-800">{section.title}</h3>
                                <p className="text-xs text-slate-500">{section.description}</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {section.items.map((item) => (
                                <div key={item.key} className="flex items-start gap-3 p-4 border border-slate-100 rounded-xl hover:border-slate-200 transition-all bg-slate-50/50">
                                    <button
                                        onClick={() => handleToggle(item.key as keyof NotificationPreferences)}
                                        className={`mt-1 w-10 h-6 rounded-full transition-colors flex items-center px-1 ${prefs[item.key as keyof NotificationPreferences] ? 'bg-emerald-500' : 'bg-slate-300'
                                            }`}
                                    >
                                        <div
                                            className={`w-4 h-4 bg-white rounded-full transition-transform ${prefs[item.key as keyof NotificationPreferences] ? 'translate-x-4' : 'translate-x-0'
                                                }`}
                                        />
                                    </button>
                                    <div>
                                        <h4 className="font-semibold text-sm text-slate-700">{item.label}</h4>
                                        <p className="text-xs text-slate-500 mt-0.5">{item.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}

                <div className="pt-4 border-t border-slate-100 flex justify-end">
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-2 px-6 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100 shadow-lg shadow-rose-200"
                    >
                        {saving ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <Save size={18} />
                        )}
                        Salvar Preferências
                    </button>
                </div>
            </div>
        </div>
    );
};

export default NotificationSettings;
