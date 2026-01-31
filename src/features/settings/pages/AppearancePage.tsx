/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * NOBRE HUB - SETTINGS: APPEARANCE
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { Card, CardHeader, CardBody, Switch } from '@/design-system';
import { useUIStore } from '@/stores';

export function AppearancePage() {
    const { theme, setTheme } = useUIStore();

    const isSystem = theme === 'system';
    const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

    const handleSystemChange = (checked: boolean) => {
        if (checked) {
            setTheme('system');
        } else {
            // Se sair do modo sistema, mantém a aparência visual atual mas como manual
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            setTheme(prefersDark ? 'dark' : 'light');
        }
    };

    const handleDarkChange = (checked: boolean) => {
        setTheme(checked ? 'dark' : 'light');
    };

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-text-primary mb-2">Aparência</h1>
                <p className="text-text-muted">Personalize como o Nobre Hub se parece para você.</p>
            </div>

            <Card>
                <CardHeader title="Tema" />
                <CardBody className="space-y-6">

                    {/* System Theme */}
                    <div className="flex items-center justify-between">
                        <div className="flex flex-col">
                            <span className="text-sm font-medium text-text-primary">
                                Usar configurações do sistema
                            </span>
                            <span className="text-sm text-text-muted">
                                Ajustar automaticamente conforme o tema do seu dispositivo
                            </span>
                        </div>
                        <Switch
                            checked={isSystem}
                            onChange={handleSystemChange}
                        />
                    </div>

                    <div className="h-px bg-border my-4" />

                    {/* Dark Mode */}
                    <div className="flex items-center justify-between font-medium">
                        <div className="flex flex-col">
                            <span className={`text-sm font-medium ${isSystem ? 'text-text-muted' : 'text-text-primary'}`}>
                                Modo Escuro
                            </span>
                            <span className="text-sm text-text-muted">
                                Reduz o cansaço visual em ambientes com pouca luz
                            </span>
                        </div>
                        <Switch
                            checked={isDark}
                            onChange={handleDarkChange}
                            disabled={isSystem}
                        />
                    </div>

                </CardBody>
            </Card>
        </div>
    );
}

// Default export for lazy loading if needed, but named is safer for now
export default AppearancePage;
