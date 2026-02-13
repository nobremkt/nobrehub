import React, { useRef, useState } from 'react';
import { toast } from 'react-toastify';

import { Card, CardHeader, CardBody, Input, Button, Badge } from '@/design-system';
import { useOrganizationStore } from '../stores/useOrganizationStore';
import { Upload, Save, Trash2, Building2, Palette } from 'lucide-react';

export const OrganizationPage: React.FC = () => {
    const {
        companyName,
        logoUrl,
        primaryColor,
        isLoading,
        init,
        setOrganizationConfig,
        resetToDefaults
    } = useOrganizationStore();

    React.useEffect(() => {
        init();
    }, [init]);

    const [tempName, setTempName] = useState(companyName);
    const [tempColor, setTempColor] = useState(primaryColor);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleSave = () => {
        setOrganizationConfig({
            companyName: tempName,
            primaryColor: tempColor
        });
        // Feedback visual poderia ser adicionado aqui (toast)
    };

    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) {
                toast.warn('A imagem deve ter no máximo 2MB.');
                return;
            }

            const reader = new FileReader();
            reader.onloadend = () => {
                setOrganizationConfig({ logoUrl: reader.result as string });
            };
            reader.readAsDataURL(file);
        }
    };

    const handleRemoveLogo = () => {
        setOrganizationConfig({ logoUrl: null });
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-text-primary mb-2">Minha Organização</h1>
                <p className="text-text-muted">Gerencie a identidade visual e dados da sua empresa.</p>
            </div>

            {/* Card de Identidade Visual */}
            <Card>
                <CardHeader
                    title="Identidade Visual"
                    action={<Badge variant="default" content="Visualização em Tempo Real" />}
                />
                <CardBody className="space-y-8">
                    {/* Logo Upload */}
                    <div className="flex flex-col gap-4">
                        <label className="text-sm font-medium text-text-primary">Logotipo</label>
                        <div className="flex items-start gap-6">
                            <div className="w-32 h-32 border-2 border-dashed border-border rounded-lg flex items-center justify-center bg-surface-secondary overflow-hidden relative group transition-colors hover:border-primary-400">
                                {logoUrl ? (
                                    <div className="relative w-full h-full p-2 flex items-center justify-center">
                                        <img
                                            src={logoUrl}
                                            alt="Logo"
                                            className="max-w-full max-h-full object-contain"
                                        />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <Button
                                                variant="danger"
                                                size="sm"
                                                onClick={handleRemoveLogo}
                                                title="Remover Logo"
                                            >
                                                <Trash2 size={16} />
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center text-text-muted gap-2">
                                        <Building2 size={24} />
                                        <span className="text-xs">Sem Logo</span>
                                    </div>
                                )}
                            </div>

                            <div className="flex flex-col gap-3">
                                <div className="text-sm text-text-muted max-w-xs">
                                    Recomendado: PNG transparente, quadrado ou horizontal. Tamanho máximo: 2MB.
                                </div>
                                <div>
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        className="hidden"
                                        accept="image/*"
                                        onChange={handleLogoUpload}
                                    />
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        leftIcon={<Upload size={16} />}
                                        onClick={() => fileInputRef.current?.click()}
                                    >
                                        Carregar Imagem
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <hr className="border-border" />

                    {/* Cores */}
                    <div className="space-y-4">
                        <h3 className="text-base font-semibold text-text-primary flex items-center gap-2">
                            <Palette size={18} />
                            Cores do Tema
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-text-primary">Cor Primária</label>
                                <div className="flex gap-3 items-center">
                                    <input
                                        type="color"
                                        value={tempColor}
                                        onChange={(e) => setTempColor(e.target.value)}
                                        className="w-12 h-12 rounded border border-border cursor-pointer p-1 bg-surface-primary"
                                    />
                                    <Input
                                        placeholder="#000000"
                                        value={tempColor}
                                        onChange={(e) => setTempColor(e.target.value)}
                                        className="font-mono uppercase"
                                    />
                                </div>
                                <p className="text-xs text-text-muted">
                                    Esta cor será usada em botões, links e destaques em todo o sistema.
                                </p>
                            </div>

                            {/* Preview de Componentes */}
                            <div className="space-y-2 p-4 border border-border rounded-lg bg-surface-tertiary">
                                <label className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2 block">Preview</label>
                                <div className="flex flex-wrap gap-2">
                                    {/* Botão Primário Fake */}
                                    <button
                                        className="h-9 px-4 rounded-md font-medium text-sm transition-opacity hover:opacity-90 active:opacity-100"
                                        style={{ backgroundColor: tempColor, color: '#fff' }}
                                    >
                                        Primário
                                    </button>

                                    {/* Botão Secundário Fake */}
                                    <button
                                        className="h-9 px-4 rounded-md font-medium text-sm bg-transparent border transition-colors hover:bg-black/5"
                                        style={{ color: tempColor, borderColor: 'currentColor' }}
                                    >
                                        Secundário
                                    </button>

                                    {/* Badge Fake */}
                                    <span
                                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                                        style={{ backgroundColor: tempColor + '20', color: tempColor }}
                                    >
                                        Badge
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </CardBody>
            </Card>

            {/* Dados da Empresa */}
            <Card>
                <CardHeader title="Informações Gerais" />
                <CardBody className="space-y-4">
                    <Input
                        label="Nome da Empresa (Exibido no sistema)"
                        value={tempName}
                        onChange={(e) => setTempName(e.target.value)}
                    />
                </CardBody>
            </Card>

            {/* Actions */}
            <div className="flex items-center justify-between pt-4">
                <Button
                    variant="ghost"
                    onClick={() => {
                        resetToDefaults();
                        setTempColor('#ef1136');
                        setTempName('Minha Empresa');
                    }}
                >
                    Restaurar Padrões
                </Button>
                <Button
                    variant="primary"
                    leftIcon={<Save size={18} />}
                    onClick={handleSave}
                    className="bg-primary hover:bg-primary-600"
                    isLoading={isLoading}
                    style={{ backgroundColor: tempColor, borderColor: tempColor }}
                >
                    {isLoading ? 'Salvando...' : 'Salvar Alterações'}
                </Button>
            </div>
        </div>
    );
};

