import { useState, useEffect } from 'react';
import { Modal, Input, Button } from '@/design-system';
import { useCollaboratorStore } from '../stores/useCollaboratorStore';
import { toast } from 'react-toastify';
import { Lock } from 'lucide-react';

interface BulkPasswordModalProps {
    isOpen: boolean;
    onClose: () => void;
    selectedIds: string[];
}

export const BulkPasswordModal = ({ isOpen, onClose, selectedIds }: BulkPasswordModalProps) => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const { updateCollaborator, fetchCollaborators } = useCollaboratorStore();

    // Reset form when modal opens/closes
    useEffect(() => {
        if (isOpen) {
            setPassword('');
            setConfirmPassword('');
            setError('');
        }
    }, [isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (password.length < 6) {
            setError('A senha deve ter pelo menos 6 caracteres');
            return;
        }

        if (password !== confirmPassword) {
            setError('As senhas não coincidem');
            return;
        }

        setIsLoading(true);
        let successCount = 0;
        let failCount = 0;

        for (const id of selectedIds) {
            try {
                await updateCollaborator(id, { password });
                successCount++;
            } catch {
                failCount++;
            }
        }

        await fetchCollaborators();
        setIsLoading(false);

        if (failCount === 0) {
            toast.success(`Senha alterada para ${successCount} colaborador(es)`);
        } else {
            toast.warning(`${successCount} alteradas, ${failCount} falharam`);
        }

        setPassword('');
        setConfirmPassword('');
        onClose();
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Alterar Senha em Massa"
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                <p className="text-sm text-text-muted">
                    A nova senha será aplicada para <strong className="text-text-primary">{selectedIds.length}</strong> colaborador(es).
                </p>

                <Input
                    label="Nova Senha"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    leftIcon={<Lock size={16} />}
                    placeholder="Mínimo 6 caracteres"
                    required
                />

                <Input
                    label="Confirmar Senha"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    leftIcon={<Lock size={16} />}
                    placeholder="Repita a senha"
                    required
                />

                {error && (
                    <p className="text-sm text-danger-500">{error}</p>
                )}

                <div className="flex justify-end gap-3 pt-2">
                    <Button variant="ghost" onClick={onClose} type="button">
                        Cancelar
                    </Button>
                    <Button type="submit" isLoading={isLoading}>
                        Aplicar para {selectedIds.length} colaborador(es)
                    </Button>
                </div>
            </form>
        </Modal>
    );
};
