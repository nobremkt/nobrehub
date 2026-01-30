import { useState } from 'react';
import { AppLayout } from '@/design-system/layouts';
import {
    Badge,
    Button,
    Card,
    CardBody,
    CardHeader,
    Input,
    Modal,
    Spinner,
    Switch,
    Tag,
    Checkbox,
    Dropdown,
    ScrollArea,
    PremiumButton
} from '@/design-system';
import { useUIStore } from '@/stores';
import { Sun, Moon, User, Settings, Mail } from 'lucide-react';

export function DebugUIPage() {
    const { theme, setTheme } = useUIStore();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [switchValue, setSwitchValue] = useState(false);
    const [checkboxValue, setCheckboxValue] = useState(false);
    const [dropdownValue, setDropdownValue] = useState<string | number>('');

    const toggleTheme = () => {
        setTheme(theme === 'dark' ? 'light' : 'dark');
    };

    const dropdownOptions = [
        { label: 'Perfil do Usuário', value: 'profile', icon: <User size={16} /> },
        { label: 'Configurações', value: 'settings', icon: <Settings size={16} /> },
        { label: 'Mensagens', value: 'messages', icon: <Mail size={16} /> },
    ];

    return (
        <AppLayout>
            <div className="p-8 space-y-8" style={{ padding: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0 }}>Debug UI Components</h1>
                    <Button
                        variant="ghost"
                        onClick={toggleTheme}
                        leftIcon={theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                    >
                        Trocar para {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                    </Button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '2rem' }}>
                    {/* Buttons */}
                    <Card>
                        <CardHeader title="Buttons" />
                        <CardBody>
                            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                                <Button variant="primary">Primary</Button>
                                <PremiumButton>Premium</PremiumButton>
                                <Button variant="secondary">Secondary</Button>
                                <Button variant="ghost">Ghost</Button>
                                <Button variant="danger">Danger</Button>
                                <Button disabled>Disabled</Button>
                                <Button isLoading>Loading</Button>
                                <Button size="sm">Small</Button>
                                <Button size="lg">Large</Button>
                            </div>
                        </CardBody>
                    </Card>

                    {/* Display Elements: Badges & Tags */}
                    <Card>
                        <CardHeader title="Display Elements" />
                        <CardBody>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

                                {/* Badges Section */}
                                <div>
                                    <h4 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        Badges <span style={{ fontSize: '0.75rem', fontWeight: 400, opacity: 0.7 }}>(Status & Counters)</span>
                                    </h4>
                                    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                                        <Badge variant="primary" content="New" />
                                        <Badge variant="success" content="Completed" />
                                        <Badge variant="warning" content="99+" />
                                        <Badge variant="danger" content="Error" />
                                        <Badge variant="default" content="Draft" />
                                        {/* Dot variants */}
                                        <div style={{ borderLeft: '1px solid var(--color-border)', paddingLeft: '1rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Dots:</span>
                                            <Badge dot variant="success" />
                                            <Badge dot variant="warning" />
                                            <Badge dot variant="danger" />
                                        </div>
                                    </div>

                                    <div style={{ marginTop: '1rem' }}>
                                        <h5 style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                            On Elements
                                        </h5>
                                        <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
                                            <Badge content={3} variant="danger">
                                                <Button variant="secondary" size="sm">Notifications</Button>
                                            </Badge>

                                            <Badge content={150} max={99} variant="primary">
                                                <Button variant="ghost" size="sm">Inbox</Button>
                                            </Badge>

                                            <Badge dot variant="success">
                                                <div style={{ width: '32px', height: '32px', background: '#ccc', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    <User size={16} />
                                                </div>
                                            </Badge>
                                        </div>
                                    </div>
                                </div>

                                {/* Divider */}
                                <div style={{ height: '1px', background: 'var(--color-border)' }} />

                                {/* Tags Section */}
                                <div>
                                    <h4 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        Tags <span style={{ fontSize: '0.75rem', fontWeight: 400, opacity: 0.7 }}>(Categorization & Labels)</span>
                                    </h4>
                                    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                                        <Tag variant="primary">Technology</Tag>
                                        <Tag variant="success">Confirmed</Tag>
                                        <Tag variant="warning">Pending</Tag>
                                        <Tag variant="danger">High Priority</Tag>
                                        <Tag variant="info">Documentation</Tag>
                                        <Tag variant="default">General</Tag>
                                    </div>
                                </div>

                            </div>
                        </CardBody>
                    </Card>

                    {/* Form Controls */}
                    <Card style={{ gridColumn: 'span 2' }}>
                        <CardHeader title="Form Controls" />
                        <CardBody>
                            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(250px, 1fr) 1fr', gap: '2rem' }}>
                                {/* Inputs Column */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Inputs</h3>
                                    <Input placeholder="Default Input" />
                                    <Input label="Com Label" placeholder="Digite algo..." />
                                    <Input label="Com Erro" error="Este campo é obrigatório" />
                                    <Input label="Desabilitado" disabled placeholder="Não editável" />
                                </div>

                                {/* Selects & Toggles Column */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                    <div>
                                        <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '0.5rem' }}>Dropdown</h3>
                                        <Dropdown
                                            label="Selecione uma opção"
                                            options={dropdownOptions}
                                            value={dropdownValue}
                                            onChange={setDropdownValue}
                                            placeholder="Escolha..."
                                        />
                                    </div>

                                    <div style={{ display: 'flex', gap: '3rem' }}>
                                        <div>
                                            <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '0.5rem' }}>Switch</h3>
                                            <Switch
                                                checked={switchValue}
                                                onChange={setSwitchValue}
                                                label={switchValue ? 'Ligado' : 'Desligado'}
                                            />
                                        </div>
                                        <div>
                                            <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '0.5rem' }}>Checkbox</h3>
                                            <Checkbox
                                                label="Confirmar opção"
                                                checked={checkboxValue}
                                                onChange={(e) => setCheckboxValue(e.target.checked)}
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '0.5rem' }}>Checkbox Desabilitado</h3>
                                        <div style={{ display: 'flex', gap: '2rem' }}>
                                            <Checkbox label="On" checked disabled />
                                            <Checkbox label="Off" disabled />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardBody>
                    </Card>

                    {/* Feedback & Interactivity */}
                    <Card>
                        <CardHeader title="Feedback & Interactivity" />
                        <CardBody>
                            <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
                                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                    <Spinner size="sm" />
                                    <Spinner size="md" />
                                    <Spinner size="lg" />
                                </div>
                                <Button onClick={() => setIsModalOpen(true)}>Abrir Modal</Button>
                            </div>
                        </CardBody>
                    </Card>

                    {/* Cards Showcase */}
                    <div style={{ gridColumn: 'span 2' }}>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>Cards Showcase</h2>
                        <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1.5rem' }}>Variantes</p>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
                            <Card variant="default">
                                <CardHeader title="Default" />
                                <CardBody>Borda sutil, sem sombra.</CardBody>
                            </Card>
                            <Card variant="elevated">
                                <CardHeader title="Elevated" />
                                <CardBody>Com sombra e destaque.</CardBody>
                            </Card>
                            <Card variant="outlined">
                                <CardHeader title="Outlined" />
                                <CardBody>Borda mais forte, fundo transparente.</CardBody>
                            </Card>
                        </div>
                    </div>

                    {/* Scroll Area Showcase */}
                    <Card style={{ gridColumn: 'span 2' }}>
                        <CardHeader title="Scroll Area - Custom Scrollbar Showcase" />
                        <CardBody>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem' }}>
                                {/* Default */}
                                <div>
                                    <h4 style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                        Default
                                    </h4>
                                    <ScrollArea
                                        maxHeight={200}
                                        style={{
                                            background: 'var(--color-bg-secondary)',
                                            borderRadius: 'var(--radius-lg)',
                                            padding: '1rem',
                                            border: '1px solid var(--color-border)'
                                        }}
                                    >
                                        <div style={{ paddingRight: '0.5rem' }}>
                                            {Array.from({ length: 15 }).map((_, i) => (
                                                <p key={i} style={{ marginBottom: '0.75rem', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                                                    {i + 1}. Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                                                </p>
                                            ))}
                                        </div>
                                    </ScrollArea>
                                </div>

                                {/* Thin */}
                                <div>
                                    <h4 style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                        Thin
                                    </h4>
                                    <ScrollArea
                                        maxHeight={200}
                                        size="thin"
                                        style={{
                                            background: 'var(--color-bg-secondary)',
                                            borderRadius: 'var(--radius-lg)',
                                            padding: '1rem',
                                            border: '1px solid var(--color-border)'
                                        }}
                                    >
                                        <div style={{ paddingRight: '0.5rem' }}>
                                            {Array.from({ length: 15 }).map((_, i) => (
                                                <p key={i} style={{ marginBottom: '0.75rem', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                                                    {i + 1}. Scrollbar mais fina e elegante.
                                                </p>
                                            ))}
                                        </div>
                                    </ScrollArea>
                                </div>

                                {/* Thick */}
                                <div>
                                    <h4 style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                        Thick
                                    </h4>
                                    <ScrollArea
                                        maxHeight={200}
                                        size="thick"
                                        style={{
                                            background: 'var(--color-bg-secondary)',
                                            borderRadius: 'var(--radius-lg)',
                                            padding: '1rem',
                                            border: '1px solid var(--color-border)'
                                        }}
                                    >
                                        <div style={{ paddingRight: '0.5rem' }}>
                                            {Array.from({ length: 15 }).map((_, i) => (
                                                <p key={i} style={{ marginBottom: '0.75rem', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                                                    {i + 1}. Scrollbar mais grossa e visível.
                                                </p>
                                            ))}
                                        </div>
                                    </ScrollArea>
                                </div>

                                {/* Auto-Hide */}
                                <div>
                                    <h4 style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                        Auto-Hide
                                    </h4>
                                    <ScrollArea
                                        maxHeight={200}
                                        autoHide
                                        style={{
                                            background: 'var(--color-bg-secondary)',
                                            borderRadius: 'var(--radius-lg)',
                                            padding: '1rem',
                                            border: '1px solid var(--color-border)'
                                        }}
                                    >
                                        <div style={{ paddingRight: '0.5rem' }}>
                                            {Array.from({ length: 15 }).map((_, i) => (
                                                <p key={i} style={{ marginBottom: '0.75rem', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                                                    {i + 1}. Hover para ver a scrollbar!
                                                </p>
                                            ))}
                                        </div>
                                    </ScrollArea>
                                </div>
                            </div>
                        </CardBody>
                    </Card>
                </div>

                {/* Modal Demo */}
                <Modal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    title="Exemplo de Modal"
                >
                    <div style={{ padding: '1.25rem' }}>
                        <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1.5rem' }}>
                            Este é o nosso componente de modal. Ele centraliza o conteúdo e escurece o fundo de forma suave.
                        </p>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                            <Button variant="ghost" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                            <Button variant="primary" onClick={() => setIsModalOpen(false)}>Entendido</Button>
                        </div>
                    </div>
                </Modal>
            </div>
        </AppLayout>
    );
}
