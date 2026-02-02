
import { useState } from 'react';
import { useProductionStore } from '../stores/useProductionStore';
import { useCollaboratorStore } from '@/features/settings/stores/useCollaboratorStore';
import {
    Modal,
    Input,
    Button,
    Dropdown,
    // DateInput, // Assuming we might use native date input or Design System if available
} from '@/design-system';
import { ProjectStatus } from '@/types/project.types';
import { toast } from 'react-toastify';

interface CreateProjectModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const PROJECT_STATUS_OPTIONS = [
    { value: 'aguardando', label: 'Aguardando' },
    { value: 'em-producao', label: 'Em Produção' },
    { value: 'a-revisar', label: 'A Revisar' },
    { value: 'revisado', label: 'Revisado' },
    { value: 'alteracao', label: 'Em Alteração' },
];

export const CreateProjectModal = ({ isOpen, onClose }: CreateProjectModalProps) => {
    const { addProject, selectedProducerId, isLoading } = useProductionStore();
    const { collaborators } = useCollaboratorStore();

    // Form State
    const [name, setName] = useState('');
    const [leadName, setLeadName] = useState('');
    const [status, setStatus] = useState<ProjectStatus>('aguardando');
    const [dueDate, setDueDate] = useState('');
    const [driveLink, setDriveLink] = useState('');
    const [notes, setNotes] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedProducerId) {
            toast.error('Produtor não selecionado.');
            return;
        }

        if (!name || !leadName || !dueDate) {
            toast.error('Preencha os campos obrigatórios (Nome, Cliente, Prazo).');
            return;
        }

        const producer = collaborators.find(c => c.id === selectedProducerId);

        try {
            await addProject({
                name,
                leadId: 'manual', // Placeholder since we don't have lead selection yet
                leadName,
                status,
                dueDate: new Date(dueDate),
                driveLink,
                notes,
                checklist: [], // Empty initially
                producerId: selectedProducerId,
                producerName: producer?.name || 'Desconhecido', // Fallback name
                source: 'manual',
            });
            onClose();
            // Reset form
            setName('');
            setLeadName('');
            setStatus('aguardando');
            setDueDate('');
            setDriveLink('');
            setNotes('');
        } catch (error) {
            console.error(error);
            // Error handled in store
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Novo Projeto"
            size="md"
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                    label="Nome do Projeto"
                    placeholder="Ex: Vídeo Institucional"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    fullWidth
                />

                <Input
                    label="Nome do Cliente (Lead)"
                    placeholder="Ex: Empresa X"
                    value={leadName}
                    onChange={(e) => setLeadName(e.target.value)}
                    required
                    fullWidth
                />

                <div className="grid grid-cols-2 gap-4">
                    <Dropdown
                        label="Status Inicial"
                        options={PROJECT_STATUS_OPTIONS}
                        value={status}
                        onChange={(val) => setStatus(val as ProjectStatus)}
                    />

                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium text-text-secondary">
                            Prazo de Entrega <span className="text-danger-500">*</span>
                        </label>
                        <input
                            type="date"
                            className="bg-surface-primary border border-border rounded-md px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                            value={dueDate}
                            onChange={(e) => setDueDate(e.target.value)}
                            required
                        />
                    </div>
                </div>

                <Input
                    label="Link do Drive"
                    placeholder="https://drive.google.com/..."
                    value={driveLink}
                    onChange={(e) => setDriveLink(e.target.value)}
                    fullWidth
                />

                <div>
                    <label className="text-sm font-medium text-text-secondary mb-1.5 block">
                        Observações
                    </label>
                    <textarea
                        className="w-full bg-surface-primary border border-border rounded-md px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all resize-none h-24"
                        placeholder="Detalhes adicionais do projeto..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                    />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-border mt-6">
                    <Button variant="ghost" onClick={onClose} type="button">
                        Cancelar
                    </Button>
                    <Button variant="primary" type="submit" isLoading={isLoading}>
                        Criar Projeto
                    </Button>
                </div>
            </form>
        </Modal>
    );
};
