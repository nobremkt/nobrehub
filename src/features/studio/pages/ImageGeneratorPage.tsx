import { useState, useRef, useEffect, useCallback } from 'react';
import { Button, Spinner, Dropdown, ColorPicker } from '@/design-system';
import { useSettingsStore } from '@/features/settings/stores/useSettingsStore';
import { useAuthStore } from '@/stores';
import { uploadGeneratedImage } from '../services/galleryService';
import { Wand2, Download, AlertCircle, KeyRound, ImageIcon, User, Mountain, Tag, X, Palette, Ratio, Sparkles, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ROUTES } from '@/config';
import styles from './ImageGeneratorPage.module.css';
import { MiniSelect } from '../components/MiniSelect';

const ASPECT_RATIO_OPTIONS = [
    { value: '1:1', label: '1:1' },
    { value: '9:16', label: '9:16' },
    { value: '16:9', label: '16:9' },
    { value: '2:3', label: '2:3' },
    { value: '4:5', label: '4:5' },
    { value: '3:4', label: '3:4' },
    { value: '3:2', label: '3:2' },
];

const QUALITY_OPTIONS = [
    { value: '1K', label: '1K' },
    { value: '2K', label: '2K' },
    { value: '4K', label: '4K' },
];

type InputTab = 'prompt' | 'roteiro';

interface GeneratedImage {
    base64: string;
    mimeType: string;
}

interface HistoryItem {
    dataUrl: string;
    timestamp: number;
    image: GeneratedImage;
}

interface ReferenceImage {
    base64: string;
    mimeType: string;
    preview: string; // data URL for thumbnail
}

type RefSlot = 'character' | 'scenery' | 'logo';

const REF_SLOTS: { key: RefSlot; label: string; icon: typeof User; hint: string }[] = [
    { key: 'character', label: 'Personagem', icon: User, hint: 'Foto/ilustração do personagem' },
    { key: 'scenery', label: 'Cenário', icon: Mountain, hint: 'Imagem de fundo/ambiente' },
    { key: 'logo', label: 'Logotipo', icon: Tag, hint: 'Logo da marca' },
];

const REF_LABELS: Record<RefSlot, string> = {
    character: 'Use this image as the MAIN CHARACTER reference for the scene. Maintain the character appearance, features and style:',
    scenery: 'Use this image as the BACKGROUND/SCENERY reference. Match the environment, lighting and atmosphere:',
    logo: 'Include this LOGO/BRAND in the generated image. Place it naturally in the composition:',
};

// ── Color name mapping ──
import colorNamer from 'color-namer';

function hexToColorName(hex: string): string {
    const result = colorNamer(hex);
    const name = result.ntc[0]?.name || 'Color';
    return `${name} ${hex}`;
}

export function ImageGeneratorPage() {
    const { gemini, openai, aiModels, imageStyles, loadAISettings } = useSettingsStore();

    useEffect(() => { loadAISettings(); }, [loadAISettings]);
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
    const [bgColor, setBgColor] = useState('#ffffff');

    // Session history
    const [sessionHistory, setSessionHistory] = useState<HistoryItem[]>([]);

    // Reference images
    const [refs, setRefs] = useState<Record<RefSlot, ReferenceImage | null>>({
        character: null,
        scenery: null,
        logo: null,
    });
    const fileInputRefs = useRef<Record<RefSlot, HTMLInputElement | null>>({
        character: null,
        scenery: null,
        logo: null,
    });

    const selectedModel = aiModels.find((m) => m.id === selectedModelId);
    const selectedStyle = imageStyles.find((s) => s.id === selectedStyleId);
    const hasApiKey = selectedModel
        ? selectedModel.provider === 'gemini' ? Boolean(gemini.apiKey) : Boolean(openai.apiKey)
        : false;

    // Only Gemini generateContent models support reference images (not Imagen, not OpenAI)
    const supportsRefs = selectedModel?.provider === 'gemini' && !selectedModel.modelId.startsWith('imagen');

    const handleRefUpload = useCallback((slot: RefSlot, file: File) => {
        const reader = new FileReader();
        reader.onload = () => {
            const dataUrl = reader.result as string;
            // Extract base64 from data URL
            const base64 = dataUrl.split(',')[1];
            setRefs((prev) => ({
                ...prev,
                [slot]: { base64, mimeType: file.type, preview: dataUrl },
            }));
        };
        reader.readAsDataURL(file);
    }, []);

    const removeRef = useCallback((slot: RefSlot) => {
        setRefs((prev) => ({ ...prev, [slot]: null }));
        if (fileInputRefs.current[slot]) {
            fileInputRefs.current[slot]!.value = '';
        }
    }, []);

    // Build final prompt: replace {user_prompt} and {background_color} in style template
    const buildFinalPrompt = (): string => {
        const userText = activeTab === 'prompt' ? prompt : roteiro;
        const colorValue = hexToColorName(bgColor);
        let result: string;
        if (selectedStyle) {
            if (selectedStyle.prompt.includes('{user_prompt}')) {
                result = selectedStyle.prompt.replace(/\{user_prompt\}/g, userText);
            } else {
                result = `${selectedStyle.prompt}\n\n${userText}`;
            }
        } else {
            result = userText;
        }
        // Replace {background_color} everywhere in the final prompt
        result = result.replace(/\{background_color\}/g, colorValue);
        return result;
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
            // Push to session history
            const result = generatedImageRef.current;
            if (result) {
                const dataUrl = `data:${result.mimeType};base64,${result.base64}`;
                setSessionHistory((prev) => [
                    { dataUrl, timestamp: Date.now(), image: result },
                    ...prev,
                ].slice(0, 20));
            }
        }
    };

    const generateWithGemini = async (modelId: string, promptText: string) => {
        const isImagen = modelId.startsWith('imagen');

        // Build multimodal parts with labeled reference images
        const buildParts = (): any[] => {
            const parts: any[] = [];

            // Add reference images with labels (only for non-Imagen models)
            if (!isImagen) {
                for (const slot of REF_SLOTS) {
                    const refImg = refs[slot.key];
                    if (refImg) {
                        parts.push({ text: REF_LABELS[slot.key] });
                        parts.push({
                            inlineData: {
                                mimeType: refImg.mimeType,
                                data: refImg.base64,
                            },
                        });
                    }
                }
            }

            // Add the main prompt
            parts.push({ text: promptText });
            return parts;
        };

        const body = isImagen
            ? {
                instances: [{ prompt: promptText }],
                parameters: { aspectRatio, sampleCount: 1 },
            }
            : {
                contents: [{ parts: buildParts() }],
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

                {/* Compact chips: Proportion + Style + Quality */}
                <div className={styles.chipRow}>
                    <MiniSelect
                        options={ASPECT_RATIO_OPTIONS}
                        value={aspectRatio}
                        onChange={setAspectRatio}
                        disabled={isGenerating}
                        icon={<Ratio size={12} />}
                    />
                    <MiniSelect
                        options={styleDropdownOptions}
                        value={selectedStyleId}
                        onChange={setSelectedStyleId}
                        disabled={isGenerating}
                        icon={<Palette size={12} />}
                    />
                    <MiniSelect
                        options={QUALITY_OPTIONS}
                        value={quality}
                        onChange={setQuality}
                        disabled={isGenerating}
                        icon={<Sparkles size={12} />}
                    />
                </div>

                {/* Reference Images — only for Gemini generateContent models */}
                {supportsRefs && (
                    <div className={styles.section}>
                        <label className={styles.sectionLabel}>Referências</label>
                        <div className={styles.refGrid}>
                            {REF_SLOTS.map((slot) => {
                                const SlotIcon = slot.icon;
                                const refData = refs[slot.key];
                                return (
                                    <div key={slot.key} className={styles.refSlot}>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            className={styles.refFileInput}
                                            ref={(el) => { fileInputRefs.current[slot.key] = el; }}
                                            onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                if (file) handleRefUpload(slot.key, file);
                                            }}
                                            disabled={isGenerating}
                                        />
                                        {refData ? (
                                            <div className={styles.refPreview}>
                                                <img src={refData.preview} alt={slot.label} />
                                                <button
                                                    className={styles.refRemoveBtn}
                                                    onClick={() => removeRef(slot.key)}
                                                    title="Remover"
                                                >
                                                    <X size={12} />
                                                </button>
                                            </div>
                                        ) : (
                                            <button
                                                className={styles.refUploadBtn}
                                                onClick={() => fileInputRefs.current[slot.key]?.click()}
                                                disabled={isGenerating}
                                            >
                                                <SlotIcon size={18} />
                                            </button>
                                        )}
                                        <span className={styles.refLabel}>{slot.label}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

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
                {/* Background Color — only when the selected style uses {background_color} */}
                {selectedStyle?.prompt.includes('{background_color}') && (
                    <div className={styles.section}>
                        <label className={styles.sectionLabel}>
                            <Palette size={14} />
                            Cor de Fundo
                        </label>
                        <ColorPicker
                            value={bgColor}
                            onChange={setBgColor}
                            disabled={isGenerating}
                        />
                        <span className={styles.colorName}>{hexToColorName(bgColor)}</span>
                    </div>
                )}

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

                {/* Session History */}
                {sessionHistory.length > 0 && (
                    <div className={styles.historyStrip}>
                        <div className={styles.historyHeader}>
                            <Clock size={12} />
                            <span>Recentes</span>
                        </div>
                        <div className={styles.historyScroll}>
                            {sessionHistory.map((item) => (
                                <button
                                    key={item.timestamp}
                                    className={`${styles.historyThumb} ${generatedImage?.base64 === item.image.base64 ? styles.historyThumbActive : ''
                                        }`}
                                    onClick={() => setGeneratedImage(item.image)}
                                    title={new Date(item.timestamp).toLocaleTimeString()}
                                >
                                    <img src={item.dataUrl} alt="" />
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
