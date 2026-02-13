import { Card, CardHeader, CardBody, Input, Button, Badge, Switch, Dropdown } from '@/design-system';
import { useSettingsStore } from '../stores/useSettingsStore';
import { useState, useEffect } from 'react';
import { Save, AlertCircle, CheckCircle2, XCircle, Wifi, WifiOff } from 'lucide-react';

const PROVIDER_OPTIONS = [
    { label: '360Dialog (Oficial WhatsApp API)', value: '360dialog' },
    { label: 'Meta Cloud API (Futuro)', value: 'meta_cloud' },
];

export function IntegrationsPage() {
    const { whatsapp, loadSettings, saveSettings } = useSettingsStore();

    // Local state for form fields
    const [baseUrl, setBaseUrl] = useState('');
    const [provider, setProvider] = useState<'360dialog' | 'meta_cloud'>('360dialog');
    const [enabled, setEnabled] = useState(false);

    // Testing state
    const [isTesting, setIsTesting] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [lastTestResult, setLastTestResult] = useState<'success' | 'error' | null>(null);

    // Load settings on mount
    useEffect(() => {
        if (!whatsapp.isLoaded) {
            loadSettings();
        }
    }, [whatsapp.isLoaded, loadSettings]);

    // Sync local state from store when loaded
    useEffect(() => {
        if (whatsapp.isLoaded) {
            setBaseUrl(whatsapp.baseUrl);
            setProvider(whatsapp.provider);
            setEnabled(whatsapp.enabled);
        }
    }, [whatsapp.isLoaded, whatsapp.baseUrl, whatsapp.provider, whatsapp.enabled]);

    const handleSave = async () => {
        if (!baseUrl) {
            setLastTestResult('error');
            return;
        }

        setIsSaving(true);
        setLastTestResult(null);

        await saveSettings({ provider, baseUrl, enabled });
        setIsSaving(false);
    };

    const handleTestConnection = async () => {
        setIsTesting(true);
        setLastTestResult(null);

        try {
            const response = await fetch('/api/get-templates', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({}),
            });

            if (response.ok) {
                const data = await response.json();
                if (data.waba_templates !== undefined) {
                    setLastTestResult('success');
                } else {
                    setLastTestResult('error');
                }
            } else {
                console.error('API Error:', await response.text());
                setLastTestResult('error');
            }
        } catch (error) {
            console.error('Connection test failed:', error);
            setLastTestResult('error');
        } finally {
            setIsTesting(false);
        }
    };

    const handleToggleEnabled = async (newEnabled: boolean) => {
        setEnabled(newEnabled);
        await saveSettings({ enabled: newEnabled });
    };

    const getBadgeStatus = () => {
        if (isTesting) {
            return <Badge variant="warning" content="Testando..." />;
        }
        if (lastTestResult === 'success') {
            return <Badge variant="success" content="Conectado" />;
        }
        if (lastTestResult === 'error') {
            return <Badge variant="danger" content="Erro na conexão" />;
        }
        if (enabled) {
            return <Badge variant="success" content="Ativo" />;
        }
        return <Badge variant="default" content="Desativado" />;
    };

    if (whatsapp.isLoading && !whatsapp.isLoaded) {
        return (
            <div className="max-w-3xl mx-auto space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-text-primary mb-2">Integrações</h1>
                    <p className="text-text-muted">Carregando configurações...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-text-primary mb-2">Integrações</h1>
                <p className="text-text-muted">Conecte o Nobre Hub com ferramentas externas.</p>
            </div>

            <Card>
                <CardHeader
                    title="WhatsApp"
                    action={getBadgeStatus()}
                />
                <CardBody className="space-y-6">
                    {/* Enable/Disable Toggle */}
                    <div className="flex items-center justify-between p-4 bg-surface-tertiary rounded-lg border border-border">
                        <div className="flex items-center gap-3">
                            {enabled ? (
                                <Wifi className="text-success-500" size={20} />
                            ) : (
                                <WifiOff className="text-text-muted" size={20} />
                            )}
                            <div>
                                <p className="text-sm font-medium text-text-primary">
                                    Integração WhatsApp
                                </p>
                                <p className="text-xs text-text-muted">
                                    {enabled
                                        ? 'Mensagens são enviadas via WhatsApp API'
                                        : 'Mensagens ficarão salvas localmente, sem envio real'}
                                </p>
                            </div>
                        </div>
                        <Switch
                            checked={enabled}
                            onChange={handleToggleEnabled}
                        />
                    </div>

                    {/* Info Box */}
                    <div className="flex gap-4 p-4 bg-surface-tertiary rounded-lg border border-border">
                        <AlertCircle className="text-primary mt-1 shrink-0" size={20} />
                        <div className="text-sm text-text-muted">
                            <p className="font-medium text-text-primary mb-1">Configuração</p>
                            <p>
                                O Nobre Hub usa a <strong>360Dialog API</strong> para enviar e receber mensagens.
                                A chave API (D360-API-KEY) é configurada como variável de ambiente no servidor
                                — ela <strong>não é armazenada no navegador</strong>.
                            </p>
                        </div>
                    </div>

                    {/* Provider Selection */}
                    <Dropdown
                        label="Provedor"
                        options={PROVIDER_OPTIONS}
                        value={provider}
                        onChange={(val) => setProvider(val as '360dialog' | 'meta_cloud')}
                        disabled={provider === 'meta_cloud'}
                    />

                    {provider === 'meta_cloud' && (
                        <div className="p-3 rounded-lg bg-warning-500/10 text-warning-500 text-sm">
                            Meta Cloud API será configurada em breve. Use 360Dialog por enquanto.
                        </div>
                    )}

                    {/* Base URL */}
                    <div className="space-y-1">
                        <Input
                            label="Base URL"
                            placeholder="https://waba-v2.360dialog.io"
                            value={baseUrl}
                            onChange={(e) => setBaseUrl(e.target.value)}
                        />
                        <span className="text-xs text-text-muted">
                            Padrão: https://waba-v2.360dialog.io
                        </span>
                    </div>

                    {/* API Key Info */}
                    <div className="space-y-1">
                        <label className="text-sm font-medium text-text-primary">
                            API Key (D360-API-KEY)
                        </label>
                        <div className="flex items-center gap-2 h-10 px-3 rounded-md border border-border bg-surface-primary text-text-muted text-sm">
                            <span>••••••••••••••••••••••••••</span>
                        </div>
                        <span className="text-xs text-text-muted">
                            Configurada como variável de ambiente no servidor (D360_API_KEY).
                            Para alterar, atualize a env var no painel do Vercel.
                        </span>
                    </div>

                    {/* Test Result Feedback */}
                    {lastTestResult && (
                        <div className={`flex items-center gap-2 p-3 rounded-lg ${lastTestResult === 'success'
                            ? 'bg-success-500/10 text-success-500'
                            : 'bg-danger-500/10 text-danger-500'
                            }`}>
                            {lastTestResult === 'success' ? (
                                <>
                                    <CheckCircle2 size={18} />
                                    <span className="text-sm font-medium">Conexão estabelecida com sucesso!</span>
                                </>
                            ) : (
                                <>
                                    <XCircle size={18} />
                                    <span className="text-sm font-medium">Falha na conexão. Verifique as credenciais no servidor.</span>
                                </>
                            )}
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="pt-4 flex justify-end gap-3">
                        <Button
                            variant="ghost"
                            onClick={handleTestConnection}
                            isLoading={isTesting}
                            leftIcon={<Wifi size={16} />}
                        >
                            Testar Conexão
                        </Button>
                        <Button
                            onClick={handleSave}
                            isLoading={isSaving}
                            leftIcon={<Save size={16} />}
                        >
                            Salvar Configurações
                        </Button>
                    </div>
                </CardBody>
            </Card>

            {/* Info about storage */}
            <div className="text-xs text-text-muted text-center">
                As configurações são salvas no banco de dados (Supabase). A chave API é armazenada como variável de ambiente no servidor.
            </div>
        </div>
    );
}
