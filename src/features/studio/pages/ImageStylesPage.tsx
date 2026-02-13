import { useState, useEffect } from 'react';
import { Card, CardBody, Button, Input, Modal } from '@/design-system';
import { useSettingsStore, ImageStyle } from '@/features/settings/stores/useSettingsStore';
import { Plus, Pencil, Trash2, Palette } from 'lucide-react';
import styles from './ImageStylesPage.module.css';

export function ImageStylesPage() {
    const { imageStyles, addImageStyle, updateImageStyle, removeImageStyle, loadAISettings } = useSettingsStore();

    useEffect(() => { loadAISettings(); }, [loadAISettings]);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingStyle, setEditingStyle] = useState<ImageStyle | null>(null);
    const [formName, setFormName] = useState('');
    const [formPrompt, setFormPrompt] = useState('');
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

    const openCreate = () => {
        setEditingStyle(null);
        setFormName('');
        setFormPrompt('');
        setIsModalOpen(true);
    };

    const openEdit = (style: ImageStyle) => {
        setEditingStyle(style);
        setFormName(style.name);
        setFormPrompt(style.prompt);
        setIsModalOpen(true);
    };

    const handleSave = () => {
        if (!formName.trim() || !formPrompt.trim()) return;

        if (editingStyle) {
            updateImageStyle(editingStyle.id, { name: formName.trim(), prompt: formPrompt.trim() });
        } else {
            const id = `style-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
            addImageStyle({ id, name: formName.trim(), prompt: formPrompt.trim() });
        }

        setIsModalOpen(false);
        setEditingStyle(null);
        setFormName('');
        setFormPrompt('');
    };

    const handleDelete = (id: string) => {
        removeImageStyle(id);
        setDeleteConfirm(null);
    };

    return (
        <div className={styles.page}>
            <div className={styles.header}>
                <div>
                    <h1>Estilos de Imagem</h1>
                    <p>Gerencie estilos visuais para o Gerador de Imagens. Cada estilo contém instruções que são enviadas junto com o prompt.</p>
                </div>
                <Button onClick={openCreate} leftIcon={<Plus size={16} />}>
                    Novo Estilo
                </Button>
            </div>

            <div className={styles.grid}>
                {imageStyles.map((style) => (
                    <Card key={style.id}>
                        <CardBody>
                            <div className={styles.styleCard}>
                                <div className={styles.styleIcon}>
                                    <Palette size={20} />
                                </div>
                                <div className={styles.styleInfo}>
                                    <h3>{style.name}</h3>
                                    <p className={styles.stylePrompt}>{style.prompt}</p>
                                </div>
                                <div className={styles.styleActions}>
                                    <button className={styles.iconBtn} onClick={() => openEdit(style)} title="Editar">
                                        <Pencil size={14} />
                                    </button>
                                    {deleteConfirm === style.id ? (
                                        <div className={styles.confirmDelete}>
                                            <span>Apagar?</span>
                                            <button className={styles.confirmYes} onClick={() => handleDelete(style.id)}>Sim</button>
                                            <button className={styles.confirmNo} onClick={() => setDeleteConfirm(null)}>Não</button>
                                        </div>
                                    ) : (
                                        <button className={styles.iconBtn} onClick={() => setDeleteConfirm(style.id)} title="Remover">
                                            <Trash2 size={14} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </CardBody>
                    </Card>
                ))}

                {imageStyles.length === 0 && (
                    <div className={styles.emptyState}>
                        <Palette size={32} />
                        <p>Nenhum estilo criado ainda.</p>
                        <Button variant="secondary" onClick={openCreate} leftIcon={<Plus size={16} />}>
                            Criar primeiro estilo
                        </Button>
                    </div>
                )}
            </div>

            {/* Create / Edit Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingStyle ? 'Editar Estilo' : 'Novo Estilo'}
            >
                <div className={styles.modalForm}>
                    <Input
                        label="Nome do Estilo"
                        placeholder="Ex: Realista, Cartoon 3D, Aquarela..."
                        value={formName}
                        onChange={(e) => setFormName(e.target.value)}
                    />

                    <div className={styles.promptField}>
                        <label className={styles.fieldLabel}>Instruções / Prompt do Sistema</label>
                        <textarea
                            className={styles.promptInput}
                            placeholder="Ex: Generate a photorealistic image with cinematic lighting. Subject: {user_prompt}"
                            value={formPrompt}
                            onChange={(e) => setFormPrompt(e.target.value)}
                            rows={8}
                        />
                        <span className={styles.fieldHint}>
                            Use <code style={{ background: 'var(--color-surface)', padding: '1px 4px', borderRadius: '3px' }}>{'{user_prompt}'}</code> onde o prompt do usuário deve ser inserido. Se omitido, o prompt será adicionado ao final.
                        </span>
                    </div>

                    <div className={styles.modalActions}>
                        <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
                            Cancelar
                        </Button>
                        <Button onClick={handleSave} disabled={!formName.trim() || !formPrompt.trim()}>
                            {editingStyle ? 'Salvar Alterações' : 'Criar Estilo'}
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
