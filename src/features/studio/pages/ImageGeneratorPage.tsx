import { useState, useRef } from 'react';
import { Button, Spinner, Dropdown } from '@/design-system';
import { useSettingsStore } from '@/features/settings/stores/useSettingsStore';
import { useAuthStore } from '@/stores';
import { uploadGeneratedImage } from '../services/galleryService';
import { Wand2, Download, AlertCircle, KeyRound, ImageIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ROUTES } from '@/config';
import styles from './ImageGeneratorPage.module.css';

const ASPECT_RATIOS = [
    { value: '1:1', label: '1:1', icon: '⬜' },
    { value: '9:16', label: '9:16', icon: '▯' },
    { value: '16:9', label: '16:9', icon: '▭' },
    { value: '2:3', label: '2:3', icon: '▯' },
    { value: '4:5', label: '4:5', icon: '▯' },
] as const;

const QUALITY_OPTIONS = [
    { value: '1K', label: '1K', description: 'Rápido' },
    { value: '2K', label: '2K', description: 'Balanceado' },
    { value: '4K', label: '4K', description: 'Alta qualidade' },
] as const;

type InputTab = 'prompt' | 'roteiro';

interface GeneratedImage {
    base64: string;
    mimeType: string;
}

export function ImageGeneratorPage() {
    const { gemini, openai, aiModels, imageStyles } = useSettingsStore();
    const user = useAuthStore((s) => s.user);

    const enabledModels = aiModels.filter((m) => m.enabled);

    const [selectedModelId, setSelectedModelId] = useState<string>(
        enabledModels[0]?.id || ''
    );
    const [activeTab, setActiveTab] = useState<InputTab>('prompt');
    const [prompt, setPrompt] = useState('');
    const [roteiro, setRoteiro] = useState('');
    const [selectedStyleId, setSelectedStyleId] = useState<string>('none');
    const [aspectRatio, setAspectRatio] = useState('1:1');
    const [quality, setQuality] = useState('2K');
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedImage, setGeneratedImage] = useState<GeneratedImage | null>(null);
    const generatedImageRef = useRef<GeneratedImage | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    const selectedModel = aiModels.find((m) => m.id === selectedModelId);
    const selectedStyle = imageStyles.find((s) => s.id === selectedStyleId);
    const hasApiKey = selectedModel
        ? selectedModel.provider === 'gemini' ? Boolean(gemini.apiKey) : Boolean(openai.apiKey)
        : false;

    // Build final prompt: replace {user_prompt} in style template, or just use raw text
    const buildFinalPrompt = (): string => {
        const userText = activeTab === 'prompt' ? prompt : roteiro;
        if (selectedStyle) {
            if (selectedStyle.prompt.includes('{user_prompt}')) {
                return selectedStyle.prompt.replace(/\{user_prompt\}/g, userText);
            }
            // Fallback: append user text if no placeholder
            return `${selectedStyle.prompt}\n\n${userText}`;
        }
        return userText;
    };

    const handleGenerate = async () => {
        const userText = activeTab === 'prompt' ? prompt : roteiro;
        if (!userText.trim() || !hasApiKey || !selectedModel) return;

        setIsGenerating(true);
        setError(null);
        setGeneratedImage(null);

        const finalPrompt = buildFinalPrompt();

        try {
            let result: GeneratedImage | null = null;

            if (selectedModel.provider === 'gemini') {
                await generateWithGemini(selectedModel.modelId, finalPrompt);
            } else {
                await generateWithOpenai(selectedModel.modelId, finalPrompt);
            }

            // After successful generation, save to gallery
            result = generatedImageRef.current;
            const userId = user?.id || user?.authUid;
            if (result && user && userId) {
                setIsSaving(true);
                try {
                    await uploadGeneratedImage({
                        base64: result.base64,
                        mimeType: result.mimeType,
                        prompt: userText,
                        styleName: selectedStyle?.name ?? null,
                        model: selectedModel.name,
                        quality,
                        aspectRatio,
                        user: {
                            id: userId,
                            name: user.name,
                            profilePhotoUrl: user.profilePhotoUrl,
                        },
                    });
                } catch (uploadErr) {
                    console.warn('Falha ao salvar na galeria:', uploadErr);
                } finally {
                    setIsSaving(false);
                }
            }
        } catch (err: any) {
            setError(err.message || 'Erro ao gerar imagem.');
        } finally {
            setIsGenerating(false);
        }
    };

    const generateWithGemini = async (modelId: string, promptText: string) => {
        const isImagen = modelId.startsWith('imagen');

        const body = isImagen
            ? {
                instances: [{ prompt: promptText }],
                parameters: { aspectRatio, sampleCount: 1 },
            }
            : {
                contents: [{ parts: [{ text: promptText }] }],
                generationConfig: {
                    responseModalities: ['TEXT', 'IMAGE'],
                    imageConfig: {
                        aspectRatio,
                        imageSize: quality,
                    },
                },
            };

        const endpoint = isImagen
            ? `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:predict?key=${gemini.apiKey}`
            : `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${gemini.apiKey}`;

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => null);
            throw new Error(errorData?.error?.message || `Erro da API (${response.status})`);
        }

        const data = await response.json();

        if (isImagen) {
            const predictions = data.predictions;
            if (!predictions || predictions.length === 0) throw new Error('Nenhum resultado retornado.');
            const imgResult = {
                base64: predictions[0].bytesBase64Encoded,
                mimeType: predictions[0].mimeType || 'image/png',
            };
            generatedImageRef.current = imgResult;
            setGeneratedImage(imgResult);
        } else {
            const candidates = data.candidates;
            if (!candidates || candidates.length === 0) throw new Error('Nenhum resultado retornado.');
            const parts = candidates[0].content?.parts || [];
            const imagePart = parts.find((p: any) => p.inlineData);
            if (!imagePart) throw new Error('A API não retornou uma imagem. Tente reformular seu prompt.');
            const imgResult = {
                base64: imagePart.inlineData.data,
                mimeType: imagePart.inlineData.mimeType,
            };
            generatedImageRef.current = imgResult;
            setGeneratedImage(imgResult);
        }
    };

    const generateWithOpenai = async (modelId: string, promptText: string) => {
        const response = await fetch('https://api.openai.com/v1/images/generations', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${openai.apiKey}`,
            },
            body: JSON.stringify({
                model: modelId,
                prompt: promptText,
                n: 1,
                response_format: 'b64_json',
            }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => null);
            throw new Error(errorData?.error?.message || `Erro da API OpenAI (${response.status})`);
        }

        const data = await response.json();
        if (!data.data || data.data.length === 0) throw new Error('Nenhum resultado retornado pela OpenAI.');

        const imgResult = {
            base64: data.data[0].b64_json,
            mimeType: 'image/png',
        };
        generatedImageRef.current = imgResult;
        setGeneratedImage(imgResult);
    };

    const handleDownload = () => {
        if (!generatedImage) return;
        const link = document.createElement('a');
        link.href = `data:${generatedImage.mimeType};base64,${generatedImage.base64}`;
        link.download = `nobre-studio-${Date.now()}.png`;
        link.click();
    };

    const modelDropdownOptions = enabledModels.map((m) => ({
        value: m.id,
        label: m.name,
    }));

    const styleDropdownOptions = [
        { value: 'none', label: 'Sem estilo' },
        ...imageStyles.map((s) => ({ value: s.id, label: s.name })),
    ];

    const noModelsEnabled = enabledModels.length === 0;
    const currentText = activeTab === 'prompt' ? prompt : roteiro;

    return (
        <div className={styles.page}>
            {/* Left Panel */}
            <aside className={styles.leftPanel}>
                <div className={styles.panelHeader}>
                    <div className={styles.titleRow}>
                        <Wand2 size={20} className={styles.titleIcon} />
                        <h1>Gerador de Imagens</h1>
                    </div>
                </div>

                {noModelsEnabled && (
                    <div className={styles.noApiKey}>
                        <AlertCircle size={14} />
                        <span>
                            Nenhum modelo ativado.{' '}
                            <Link to={ROUTES.debug_integrations}>Ativar nas Integrações</Link>
                        </span>
                    </div>
                )}

                {!noModelsEnabled && !hasApiKey && (
                    <div className={styles.noApiKey}>
                        <KeyRound size={14} />
                        <span>
                            API Key não configurada.{' '}
                            <Link to={ROUTES.debug_integrations}>Configurar</Link>
                        </span>
                    </div>
                )}

                {/* Model Selection */}
                <div className={styles.section}>
                    <label className={styles.sectionLabel}>Modelo</label>
                    <Dropdown
                        options={modelDropdownOptions}
                        value={selectedModelId}
                        onChange={(val) => setSelectedModelId(val as string)}
                        placeholder="Selecione um modelo..."
                        disabled={noModelsEnabled || isGenerating}
                    />
                </div>

                {/* Style Selection */}
                <div className={styles.section}>
                    <label className={styles.sectionLabel}>Estilo</label>
                    <Dropdown
                        options={styleDropdownOptions}
                        value={selectedStyleId}
                        onChange={(val) => setSelectedStyleId(val as string)}
                        placeholder="Selecione um estilo..."
                        disabled={isGenerating}
                    />
                </div>

                {/* Tabs + Input */}
                <div className={styles.section}>
                    <div className={styles.tabs}>
                        <button
                            className={`${styles.tab} ${activeTab === 'prompt' ? styles.tabActive : ''}`}
                            onClick={() => setActiveTab('prompt')}
                        >
                            Prompt
                        </button>
                        <button
                            className={`${styles.tab} ${activeTab === 'roteiro' ? styles.tabActive : ''}`}
                            onClick={() => setActiveTab('roteiro')}
                        >
                            Roteiro
                        </button>
                    </div>

                    {activeTab === 'prompt' ? (
                        <textarea
                            className={styles.promptTextarea}
                            placeholder="Descreva a imagem que deseja gerar..."
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            rows={3}
                            disabled={noModelsEnabled || !hasApiKey || isGenerating}
                        />
                    ) : (
                        <textarea
                            className={`${styles.promptTextarea} ${styles.roteiroTextarea}`}
                            placeholder="Cole ou escreva o roteiro completo aqui. A lógica de processamento será implementada futuramente..."
                            value={roteiro}
                            onChange={(e) => setRoteiro(e.target.value)}
                            rows={8}
                            disabled={noModelsEnabled || !hasApiKey || isGenerating}
                        />
                    )}
                </div>

                {/* Aspect Ratio */}
                <div className={styles.section}>
                    <label className={styles.sectionLabel}>Proporção</label>
                    <div className={styles.optionGrid}>
                        {ASPECT_RATIOS.map((ratio) => (
                            <button
                                key={ratio.value}
                                className={`${styles.optionBtn} ${aspectRatio === ratio.value ? styles.optionActive : ''}`}
                                onClick={() => setAspectRatio(ratio.value)}
                                disabled={isGenerating}
                            >
                                <span className={styles.optionIcon}>{ratio.icon}</span>
                                <span className={styles.optionLabel}>{ratio.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Quality */}
                <div className={styles.section}>
                    <label className={styles.sectionLabel}>Qualidade</label>
                    <div className={styles.qualityGrid}>
                        {QUALITY_OPTIONS.map((opt) => (
                            <button
                                key={opt.value}
                                className={`${styles.qualityBtn} ${quality === opt.value ? styles.qualityActive : ''}`}
                                onClick={() => setQuality(opt.value)}
                                disabled={isGenerating}
                            >
                                <span className={styles.qualityLabel}>{opt.label}</span>
                                <span className={styles.qualityDesc}>{opt.description}</span>
                            </button>
                        ))}
                    </div>
                </div>

                <div className={styles.divider} />

                {error && (
                    <div className={styles.errorState}>
                        <AlertCircle size={14} />
                        <span>{error}</span>
                    </div>
                )}

                <div className={styles.actions}>
                    <Button
                        onClick={handleGenerate}
                        isLoading={isGenerating}
                        disabled={!currentText.trim() || !hasApiKey || noModelsEnabled}
                        leftIcon={<Wand2 size={16} />}
                        className={styles.generateBtn}
                    >
                        Gerar Imagem
                    </Button>

                </div>
            </aside>

            {/* Right Panel */}
            <main className={styles.rightPanel}>
                {!isGenerating && !generatedImage && !error && (
                    <div className={styles.emptyState}>
                        <div className={styles.emptyIcon}>
                            <ImageIcon size={48} />
                        </div>
                        <p>A imagem gerada aparecerá aqui</p>
                    </div>
                )}

                {isGenerating && (
                    <div className={styles.loadingState}>
                        <Spinner size="lg" />
                        <p>Gerando imagem...</p>
                    </div>
                )}

                {generatedImage && !isGenerating && (
                    <div className={styles.imageContainer}>
                        <img
                            src={`data:${generatedImage.mimeType};base64,${generatedImage.base64}`}
                            alt="Imagem gerada por IA"
                        />
                        <button
                            className={styles.downloadOverlay}
                            onClick={handleDownload}
                            title="Baixar imagem"
                        >
                            <Download size={18} />
                        </button>
                        {isSaving && (
                            <div className={styles.savingIndicator}>
                                <Spinner size="sm" />
                                <span>Salvando na galeria...</span>
                            </div>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
}
