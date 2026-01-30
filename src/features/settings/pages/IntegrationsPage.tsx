import { AppLayout } from '@/design-system/layouts';
import { Card, CardHeader, CardBody, Input, Button, Badge } from '@/design-system';
import { useSettingsStore } from '../stores/useSettingsStore';
import { useState, useEffect } from 'react';
import { Save, AlertCircle, CheckCircle2 } from 'lucide-react';

export function IntegrationsPage() {
    const { whatsapp, setWhatsappConfig } = useSettingsStore();

    // Local state to handle form fields before saving
    const [baseUrl, setBaseUrl] = useState(whatsapp.baseUrl);
    const [apiKey, setApiKey] = useState(whatsapp.apiKey);
    const [provider, setProvider] = useState(whatsapp.provider);

    // Status simulation for UX
    const [status, setStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');

    // Sync from store on mount
    useEffect(() => {
        setBaseUrl(whatsapp.baseUrl);
        setApiKey(whatsapp.apiKey);
        setProvider(whatsapp.provider);
    }, [whatsapp]);

    const handleSave = () => {
        setStatus('testing');

        // Save to store
        setWhatsappConfig({
            provider: provider,
            baseUrl,
            apiKey
        });

        // Simulate connection test
        setTimeout(() => {
            if (baseUrl && apiKey) {
                setStatus('success');
            } else {
                setStatus('error');
            }
        }, 1500);
    };

    return (
        <AppLayout>
            <div className="max-w-3xl mx-auto space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-text-primary mb-2">Integrações</h1>
                    <p className="text-text-muted">Conecte o Nobre Hub com ferramentas externas.</p>
                </div>

                <Card>
                    <CardHeader
                        title="WhatsApp (360Dialog)"
                        action={
                            status === 'success' ? (
                                <Badge variant="success">Conectado</Badge>
                            ) : status === 'error' ? (
                                <Badge variant="danger">Erro</Badge>
                            ) : (
                                <Badge variant="default">Não configurado</Badge>
                            )
                        }
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

                        <div className="pt-4 flex justify-end">
                            <Button
                                onClick={handleSave}
                                isLoading={status === 'testing'}
                                leftIcon={<Save size={16} />}
                            >
                                Salvar e Testar Conexão
                            </Button>
                        </div>
                    </CardBody>
                </Card>
            </div>
        </AppLayout>
    );
}
