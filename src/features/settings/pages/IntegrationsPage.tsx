import { Card, CardHeader, CardBody, Input, Button, Badge, Switch } from '@/design-system';
import { useSettingsStore } from '../stores/useSettingsStore';
import { useState, useEffect } from 'react';
import { Save, AlertCircle, CheckCircle2, XCircle, Sparkles, Bot } from 'lucide-react';

export function IntegrationsPage() {
    const {
        whatsapp, setWhatsappConfig,
        gemini, setGeminiApiKey,
        openai, setOpenaiApiKey,
        aiModels, toggleModel,
    } = useSettingsStore();

    // WhatsApp local state
    const [baseUrl, setBaseUrl] = useState(whatsapp.baseUrl);
    const [apiKey, setApiKey] = useState(whatsapp.apiKey);
    const [provider, setProvider] = useState(whatsapp.provider);

    // WhatsApp testing
    const [isTesting, setIsTesting] = useState(false);
    const [lastTestResult, setLastTestResult] = useState<'success' | 'error' | null>(null);

    // Gemini local state
    const [geminiApiKey, setGeminiApiKeyLocal] = useState(gemini.apiKey);
    const [isTestingGemini, setIsTestingGemini] = useState(false);
    const [geminiTestResult, setGeminiTestResult] = useState<'success' | 'error' | null>(null);

    // OpenAI local state
    const [openaiApiKey, setOpenaiApiKeyLocal] = useState(openai.apiKey);
    const [isTestingOpenai, setIsTestingOpenai] = useState(false);
    const [openaiTestResult, setOpenaiTestResult] = useState<'success' | 'error' | null>(null);

    const isConfigured = Boolean(whatsapp.baseUrl && whatsapp.apiKey && whatsapp.provider === '360dialog');
    const isGeminiConfigured = Boolean(gemini.apiKey);
    const isOpenaiConfigured = Boolean(openai.apiKey);

    useEffect(() => {
        setBaseUrl(whatsapp.baseUrl);
        setApiKey(whatsapp.apiKey);
        setProvider(whatsapp.provider);
    }, [whatsapp]);

    useEffect(() => { setGeminiApiKeyLocal(gemini.apiKey); }, [gemini]);
    useEffect(() => { setOpenaiApiKeyLocal(openai.apiKey); }, [openai]);

    // Gemini models & OpenAI models
    const geminiModels = aiModels.filter((m) => m.provider === 'gemini');
    const openaiModels = aiModels.filter((m) => m.provider === 'openai');

    const handleSave = async () => {
        setIsTesting(true);
        setLastTestResult(null);
        if (!baseUrl || !apiKey) { setLastTestResult('error'); setIsTesting(false); return; }
        setWhatsappConfig({ provider, baseUrl, apiKey });
        try {
            const response = await fetch('/api/get-templates', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ apiKey, baseUrl })
            });
            if (response.ok) {
                const data = await response.json();
                setLastTestResult(data.waba_templates !== undefined ? 'success' : 'error');
            } else { setLastTestResult('error'); }
        } catch { setLastTestResult('error'); }
        finally { setIsTesting(false); }
    };

    const handleSaveGemini = async () => {
        setIsTestingGemini(true);
        setGeminiTestResult(null);
        if (!geminiApiKey) { setGeminiTestResult('error'); setIsTestingGemini(false); return; }
        setGeminiApiKey(geminiApiKey);
        try {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${geminiApiKey}`);
            setGeminiTestResult(response.ok ? 'success' : 'error');
        } catch { setGeminiTestResult('error'); }
        finally { setIsTestingGemini(false); }
    };

    const handleSaveOpenai = async () => {
        setIsTestingOpenai(true);
        setOpenaiTestResult(null);
        if (!openaiApiKey) { setOpenaiTestResult('error'); setIsTestingOpenai(false); return; }
        setOpenaiApiKey(openaiApiKey);
        try {
            const response = await fetch('https://api.openai.com/v1/models', {
                headers: { 'Authorization': `Bearer ${openaiApiKey}` }
            });
            setOpenaiTestResult(response.ok ? 'success' : 'error');
        } catch { setOpenaiTestResult('error'); }
        finally { setIsTestingOpenai(false); }
    };

    const getBadgeStatus = () => {
        if (isTesting) return <Badge variant="warning" content="Testando..." />;
        if (lastTestResult === 'success') return <Badge variant="success" content="Conectado" />;
        if (lastTestResult === 'error') return <Badge variant="danger" content="Erro" />;
        if (isConfigured) return <Badge variant="success" content="Configurado" />;
        return <Badge variant="default" content="Não configurado" />;
    };

    const getGeminiBadge = () => {
        if (isTestingGemini) return <Badge variant="warning" content="Testando..." />;
        if (geminiTestResult === 'success') return <Badge variant="success" content="Conectado" />;
        if (geminiTestResult === 'error') return <Badge variant="danger" content="Erro" />;
        if (isGeminiConfigured) return <Badge variant="success" content="Configurado" />;
        return <Badge variant="default" content="Não configurado" />;
    };

    const getOpenaiBadge = () => {
        if (isTestingOpenai) return <Badge variant="warning" content="Testando..." />;
        if (openaiTestResult === 'success') return <Badge variant="success" content="Conectado" />;
        if (openaiTestResult === 'error') return <Badge variant="danger" content="Erro" />;
        if (isOpenaiConfigured) return <Badge variant="success" content="Configurado" />;
        return <Badge variant="default" content="Não configurado" />;
    };

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-text-primary mb-2">Integrações</h1>
                <p className="text-text-muted">Conecte o Nobre Hub com ferramentas externas.</p>
            </div>

            {/* WhatsApp */}
            <Card>
                <CardHeader title="WhatsApp (360Dialog)" action={getBadgeStatus()} />
                <CardBody className="space-y-6">
                    <div className="flex gap-4 p-4 bg-surface-tertiary rounded-lg border border-border">
                        <AlertCircle className="text-primary mt-1" size={20} />
                        <div className="text-sm text-text-muted">
                            <p className="font-medium text-text-primary mb-1">Integração Oficial</p>
                            <p>O Nobre Hub via <strong>360Dialog API</strong>. Insira sua D360-API-KEY e a URL base abaixo.</p>
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
                            <Input label="Base URL" placeholder="https://waba-v2.360dialog.io" value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)} />
                            <span className="text-xs text-text-muted">Geralmente: https://waba-v2.360dialog.io</span>
                        </div>
                        <div className="space-y-1">
                            <Input label="API Key (D360-API-KEY)" type="password" placeholder="Copie sua chave D360 aqui..." value={apiKey} onChange={(e) => setApiKey(e.target.value)} />
                            <span className="text-xs text-text-muted">Sua chave secreta da 360Dialog.</span>
                        </div>
                    </div>
                    {lastTestResult && (
                        <div className={`flex items-center gap-2 p-3 rounded-lg ${lastTestResult === 'success' ? 'bg-success-500/10 text-success-500' : 'bg-danger-500/10 text-danger-500'}`}>
                            {lastTestResult === 'success' ? <><CheckCircle2 size={18} /><span className="text-sm font-medium">Conexão estabelecida com sucesso!</span></> : <><XCircle size={18} /><span className="text-sm font-medium">Falha na conexão.</span></>}
                        </div>
                    )}
                    <div className="pt-4 flex justify-end">
                        <Button onClick={handleSave} isLoading={isTesting} leftIcon={<Save size={16} />}>Salvar e Testar</Button>
                    </div>
                </CardBody>
            </Card>

            {/* Gemini API */}
            <Card>
                <CardHeader title="Google Gemini API" action={getGeminiBadge()} />
                <CardBody className="space-y-6">
                    <div className="flex gap-4 p-4 bg-surface-tertiary rounded-lg border border-border">
                        <Sparkles className="text-primary mt-1" size={20} />
                        <div className="text-sm text-text-muted">
                            <p className="font-medium text-text-primary mb-1">Inteligência Artificial — Google</p>
                            <p>
                                API do <strong>Google Gemini</strong> para geração de imagens. Obtenha sua API Key em{' '}
                                <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-primary-500)', textDecoration: 'underline' }}>aistudio.google.com</a>.
                            </p>
                        </div>
                    </div>
                    <div className="space-y-1">
                        <Input label="API Key" type="password" placeholder="Cole sua API Key do Gemini..." value={geminiApiKey} onChange={(e) => setGeminiApiKeyLocal(e.target.value)} />
                        <span className="text-xs text-text-muted">Sua chave de API do Google AI Studio.</span>
                    </div>

                    {/* Gemini Models */}
                    <div className="space-y-3">
                        <label className="text-sm font-medium text-text-primary">Modelos Gemini</label>
                        <div className="space-y-2">
                            {geminiModels.map((model) => (
                                <div key={model.id} className="flex items-center justify-between p-3 rounded-lg border border-border bg-surface-primary">
                                    <div>
                                        <span className="text-sm font-medium text-text-primary">{model.name}</span>
                                        <p className="text-xs text-text-muted" style={{ fontFamily: 'monospace' }}>{model.modelId}</p>
                                    </div>
                                    <Switch checked={model.enabled} onChange={() => toggleModel(model.id)} />
                                </div>
                            ))}
                        </div>
                    </div>

                    {geminiTestResult && (
                        <div className={`flex items-center gap-2 p-3 rounded-lg ${geminiTestResult === 'success' ? 'bg-success-500/10 text-success-500' : 'bg-danger-500/10 text-danger-500'}`}>
                            {geminiTestResult === 'success' ? <><CheckCircle2 size={18} /><span className="text-sm font-medium">API Key válida!</span></> : <><XCircle size={18} /><span className="text-sm font-medium">API Key inválida.</span></>}
                        </div>
                    )}
                    <div className="pt-2 flex justify-end">
                        <Button onClick={handleSaveGemini} isLoading={isTestingGemini} leftIcon={<Save size={16} />}>Salvar e Testar</Button>
                    </div>
                </CardBody>
            </Card>

            {/* OpenAI API */}
            <Card>
                <CardHeader title="OpenAI API" action={getOpenaiBadge()} />
                <CardBody className="space-y-6">
                    <div className="flex gap-4 p-4 bg-surface-tertiary rounded-lg border border-border">
                        <Bot className="text-primary mt-1" size={20} />
                        <div className="text-sm text-text-muted">
                            <p className="font-medium text-text-primary mb-1">Inteligência Artificial — OpenAI</p>
                            <p>
                                API da <strong>OpenAI</strong> para geração de imagens. Obtenha sua API Key em{' '}
                                <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-primary-500)', textDecoration: 'underline' }}>platform.openai.com</a>.
                            </p>
                        </div>
                    </div>
                    <div className="space-y-1">
                        <Input label="API Key" type="password" placeholder="Cole sua API Key da OpenAI..." value={openaiApiKey} onChange={(e) => setOpenaiApiKeyLocal(e.target.value)} />
                        <span className="text-xs text-text-muted">Sua chave secreta da OpenAI (sk-...).</span>
                    </div>

                    {/* OpenAI Models */}
                    <div className="space-y-3">
                        <label className="text-sm font-medium text-text-primary">Modelos OpenAI</label>
                        <div className="space-y-2">
                            {openaiModels.map((model) => (
                                <div key={model.id} className="flex items-center justify-between p-3 rounded-lg border border-border bg-surface-primary">
                                    <div>
                                        <span className="text-sm font-medium text-text-primary">{model.name}</span>
                                        <p className="text-xs text-text-muted" style={{ fontFamily: 'monospace' }}>{model.modelId}</p>
                                    </div>
                                    <Switch checked={model.enabled} onChange={() => toggleModel(model.id)} />
                                </div>
                            ))}
                        </div>
                    </div>

                    {openaiTestResult && (
                        <div className={`flex items-center gap-2 p-3 rounded-lg ${openaiTestResult === 'success' ? 'bg-success-500/10 text-success-500' : 'bg-danger-500/10 text-danger-500'}`}>
                            {openaiTestResult === 'success' ? <><CheckCircle2 size={18} /><span className="text-sm font-medium">API Key válida!</span></> : <><XCircle size={18} /><span className="text-sm font-medium">API Key inválida.</span></>}
                        </div>
                    )}
                    <div className="pt-2 flex justify-end">
                        <Button onClick={handleSaveOpenai} isLoading={isTestingOpenai} leftIcon={<Save size={16} />}>Salvar e Testar</Button>
                    </div>
                </CardBody>
            </Card>

            <div className="text-xs text-text-muted text-center">
                As configurações são salvas localmente no navegador (localStorage).
            </div>
        </div>
    );
}
