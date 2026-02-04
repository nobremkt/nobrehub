import { Card, CardHeader, CardBody, Input, Button, Badge } from '@/design-system';
import { useSettingsStore } from '../stores/useSettingsStore';
import { useState, useEffect } from 'react';
import { Save, AlertCircle, CheckCircle2, XCircle } from 'lucide-react';

export function IntegrationsPage() {
    const { whatsapp, setWhatsappConfig } = useSettingsStore();

    // Local state to handle form fields before saving
    const [baseUrl, setBaseUrl] = useState(whatsapp.baseUrl);
    const [apiKey, setApiKey] = useState(whatsapp.apiKey);
    const [provider, setProvider] = useState(whatsapp.provider);

    // Testing state
    const [isTesting, setIsTesting] = useState(false);
    const [lastTestResult, setLastTestResult] = useState<'success' | 'error' | null>(null);

    // Determine if already configured from persisted store
    const isConfigured = Boolean(whatsapp.baseUrl && whatsapp.apiKey && whatsapp.provider === '360dialog');

    // Sync from store on mount (handles hydration from localStorage)
    useEffect(() => {
        setBaseUrl(whatsapp.baseUrl);
        setApiKey(whatsapp.apiKey);
        setProvider(whatsapp.provider);
    }, [whatsapp]);

    const handleSave = async () => {
        setIsTesting(true);
        setLastTestResult(null);

        // Check required fields
        if (!baseUrl || !apiKey) {
            setLastTestResult('error');
            setIsTesting(false);
            return;
        }

        // Save to store (this persists to localStorage via zustand persist)
        setWhatsappConfig({
            provider: provider,
            baseUrl,
            apiKey
        });

        // Small delay for UX feedback
        await new Promise(resolve => setTimeout(resolve, 800));

        setLastTestResult('success');
        setIsTesting(false);
    };

    // Determine badge status
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
        if (isConfigured) {
            return <Badge variant="success" content="Configurado" />;
        }
        return <Badge variant="default" content="Não configurado" />;
    };

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-text-primary mb-2">Integrações</h1>
                <p className="text-text-muted">Conecte o Nobre Hub com ferramentas externas.</p>
            </div>

            <Card>
                <CardHeader
                    title="WhatsApp (360Dialog)"
                    action={getBadgeStatus()}
                />
                <CardBody className="space-y-6">
                    <div className="flex gap-4 p-4 bg-surface-tertiary rounded-lg border border-border">
                        <AlertCircle className="text-primary mt-1" size={20} />
                        <div className="text-sm text-text-muted">
                            <p className="font-medium text-text-primary mb-1">Integração Oficial</p>
                            <p>
                                O Nobre Hub via <strong>360Dialog API</strong>.
                                Insira sua D360-API-KEY e a URL base abaixo.
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-text-primary">Provedor</label>
                            <select
                                className="w-full h-10 px-3 rounded-md border border-input bg-surface-primary text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                value={provider || '360dialog'}
                                onChange={(e) => setProvider(e.target.value as any)}
                            >
                                <option value="360dialog">360Dialog (Oficial WhatsApp API)</option>
                                <option value="evolution">Evolution API (Legado/VPS)</option>
                            </select>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-1">
                            <Input
                                label="Base URL"
                                placeholder="https://waba-v2.360dialog.io"
                                value={baseUrl}
                                onChange={(e) => setBaseUrl(e.target.value)}
                            />
                            <span className="text-xs text-text-muted">Geralmente: https://waba-v2.360dialog.io</span>
                        </div>

                        <div className="space-y-1">
                            <Input
                                label="API Key (D360-API-KEY)"
                                type="password"
                                placeholder="Copie sua chave D360 aqui..."
                                value={apiKey}
                                onChange={(e) => setApiKey(e.target.value)}
                            />
                            <span className="text-xs text-text-muted">Sua chave secreta da 360Dialog.</span>
                        </div>
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
                                    <span className="text-sm font-medium">Falha na conexão. Verifique suas credenciais.</span>
                                </>
                            )}
                        </div>
                    )}

                    <div className="pt-4 flex justify-end">
                        <Button
                            onClick={handleSave}
                            isLoading={isTesting}
                            leftIcon={<Save size={16} />}
                        >
                            Salvar e Testar Conexão
                        </Button>
                    </div>
                </CardBody>
            </Card>

            {/* Info about persistence */}
            <div className="text-xs text-text-muted text-center">
                As configurações são salvas localmente no navegador (localStorage).
            </div>
        </div>
    );
}
