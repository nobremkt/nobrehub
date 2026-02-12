import { useState } from 'react';

import {
    Avatar,
    Badge,
    Button,
    Card,
    CardBody,
    CardHeader,
    Checkbox,
    ConfirmModal,
    Dropdown,
    EmptyState,
    Input,
    LazyImage,
    Modal,
    NumberInput,
    PersonCard,
    PhoneInput,
    PremiumButton,
    ProgressBar,
    ScrollArea,
    Skeleton,
    Spinner,
    Switch,
    Tabs,
    Tag,
    Textarea,
    Tooltip,
    AudioPlayer,
    ChatBubble,
    ChatInput,
    ChatDateDivider,
} from '@/design-system';
import { useUIStore } from '@/stores';
import { Sun, Moon, User, Settings, Mail, ImageIcon, FileText, Inbox, Search, AlertTriangle } from 'lucide-react';

export function DebugUIPage() {
    const { theme, setTheme } = useUIStore();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [switchValue, setSwitchValue] = useState(false);
    const [checkboxValue, setCheckboxValue] = useState(false);
    const [dropdownValue, setDropdownValue] = useState<string | number>('');

    // ConfirmModal states
    const [confirmDanger, setConfirmDanger] = useState(false);
    const [confirmWarning, setConfirmWarning] = useState(false);
    const [confirmInfo, setConfirmInfo] = useState(false);
    const [confirmSuccess, setConfirmSuccess] = useState(false);

    // NumberInput state
    const [numberValue, setNumberValue] = useState('5');
    const [numberValueDisabled] = useState('10');

    // PhoneInput state
    const [phoneValue, setPhoneValue] = useState('');

    // ChatInput state
    const [chatInputValue, setChatInputValue] = useState('');
    const [chatIsRecording, setChatIsRecording] = useState(false);

    // Tabs state
    const [activeTab, setActiveTab] = useState('overview');
    const [activeTabPills, setActiveTabPills] = useState('all');

    // Textarea state
    const [textareaValue, setTextareaValue] = useState('');
    const [textareaAutoValue, setTextareaAutoValue] = useState('Este textarea cresce automaticamente conforme você digita...');

    const toggleTheme = () => {
        setTheme(theme === 'dark' ? 'light' : 'dark');
    };

    const dropdownOptions = [
        { label: 'Perfil do Usuário', value: 'profile', icon: <User size={16} /> },
        { label: 'Configurações', value: 'settings', icon: <Settings size={16} /> },
        { label: 'Mensagens', value: 'messages', icon: <Mail size={16} /> },
    ];

    return (
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

                {/* ═══════════════════════════════════════════════════ */}
                {/* AVATAR - NEW */}
                {/* ═══════════════════════════════════════════════════ */}
                <Card>
                    <CardHeader title="Avatar" />
                    <CardBody>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            {/* Sizes */}
                            <div>
                                <h4 style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    Sizes (Fallback Initials)
                                </h4>
                                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                    <Avatar size="sm" fallback="SM" alt="Small" />
                                    <Avatar size="md" fallback="MD" alt="Medium" />
                                    <Avatar size="lg" fallback="LG" alt="Large" />
                                    <Avatar size="xl" fallback="XL" alt="Extra Large" />
                                </div>
                            </div>

                            {/* With Image */}
                            <div>
                                <h4 style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    With Image
                                </h4>
                                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                    <Avatar size="sm" src="https://i.pravatar.cc/64?img=1" alt="User 1" />
                                    <Avatar size="md" src="https://i.pravatar.cc/96?img=2" alt="User 2" />
                                    <Avatar size="lg" src="https://i.pravatar.cc/128?img=3" alt="User 3" />
                                    <Avatar size="xl" src="https://i.pravatar.cc/150?img=4" alt="User 4" />
                                </div>
                            </div>

                            {/* No src, no fallback */}
                            <div>
                                <h4 style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    No Image / No Fallback
                                </h4>
                                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                    <Avatar size="md" alt="Unknown" />
                                    <Avatar size="md" alt="Jo" fallback="JD" />
                                </div>
                            </div>
                        </div>
                    </CardBody>
                </Card>

                {/* ═══════════════════════════════════════════════════ */}
                {/* LAZY IMAGE - NEW */}
                {/* ═══════════════════════════════════════════════════ */}
                <Card>
                    <CardHeader title="LazyImage" />
                    <CardBody>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <h4 style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                Lazy Loading with Skeleton + Fade-in
                            </h4>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                                <LazyImage
                                    src="https://picsum.photos/200/150?random=1"
                                    alt="Demo 1"
                                    style={{ width: '100%', borderRadius: 'var(--radius-md)', objectFit: 'cover' }}
                                />
                                <LazyImage
                                    src="https://picsum.photos/200/150?random=2"
                                    alt="Demo 2"
                                    style={{ width: '100%', borderRadius: 'var(--radius-md)', objectFit: 'cover' }}
                                />
                                <LazyImage
                                    src="https://picsum.photos/200/150?random=3"
                                    alt="Demo 3"
                                    style={{ width: '100%', borderRadius: 'var(--radius-md)', objectFit: 'cover' }}
                                />
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

                {/* ═══════════════════════════════════════════════════ */}
                {/* NUMBER INPUT - NEW */}
                {/* ═══════════════════════════════════════════════════ */}
                <Card>
                    <CardHeader title="NumberInput" />
                    <CardBody>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            <NumberInput
                                label="Quantidade"
                                value={numberValue}
                                onChange={setNumberValue}
                                min={0}
                                max={100}
                                step={1}
                                helperText="Min: 0, Max: 100"
                            />
                            <NumberInput
                                label="Com Erro"
                                value="3"
                                onChange={() => { }}
                                error="Valor inválido"
                            />
                            <NumberInput
                                label="Desabilitado"
                                value={numberValueDisabled}
                                onChange={() => { }}
                                disabled
                            />
                            <NumberInput
                                label="Step de 0.5"
                                value="2.5"
                                onChange={() => { }}
                                step={0.5}
                                min={0}
                                helperText="Step: 0.5"
                            />
                        </div>
                    </CardBody>
                </Card>

                {/* ═══════════════════════════════════════════════════ */}
                {/* PHONE INPUT - NEW */}
                {/* ═══════════════════════════════════════════════════ */}
                <Card>
                    <CardHeader title="PhoneInput" />
                    <CardBody>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            <PhoneInput
                                label="Telefone (Brasil)"
                                value={phoneValue}
                                onChange={setPhoneValue}
                                defaultCountry="BR"
                            />
                            <PhoneInput
                                label="Com Erro"
                                value=""
                                onChange={() => { }}
                                error="Telefone obrigatório"
                                required
                            />
                            <PhoneInput
                                label="Desabilitado"
                                value=""
                                onChange={() => { }}
                                disabled
                            />
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

                {/* ═══════════════════════════════════════════════════ */}
                {/* CONFIRM MODAL - NEW */}
                {/* ═══════════════════════════════════════════════════ */}
                <Card>
                    <CardHeader title="ConfirmModal" />
                    <CardBody>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <h4 style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                Variants (click to preview)
                            </h4>
                            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                                <Button variant="danger" size="sm" onClick={() => setConfirmDanger(true)}>Danger</Button>
                                <Button variant="secondary" size="sm" onClick={() => setConfirmWarning(true)}>Warning</Button>
                                <Button variant="secondary" size="sm" onClick={() => setConfirmInfo(true)}>Info</Button>
                                <Button variant="primary" size="sm" onClick={() => setConfirmSuccess(true)}>Success</Button>
                            </div>
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

                {/* ═══════════════════════════════════════════════════ */}
                {/* PERSON CARD - NEW */}
                {/* ═══════════════════════════════════════════════════ */}
                <div style={{ gridColumn: 'span 2' }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>PersonCard</h2>
                    <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1.5rem' }}>Card de perfil com imagem de fundo, status e ação</p>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
                        <PersonCard
                            name="João Silva"
                            role="CEO & Founder"
                            imageUrl="https://picsum.photos/400/600?random=10"
                            isOnline={true}
                            onViewProfile={() => alert('Ver perfil de João')}
                        />
                        <PersonCard
                            name="Maria Santos"
                            role="Head of Design"
                            imageUrl="https://picsum.photos/400/600?random=11"
                            isOnline={false}
                            onViewProfile={() => alert('Ver perfil de Maria')}
                        />
                        <PersonCard
                            name="Carlos Oliveira"
                            role="Lead Developer"
                            imageUrl="https://picsum.photos/400/600?random=12"
                            isOnline={true}
                            onViewProfile={() => alert('Ver perfil de Carlos')}
                        />
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

                {/* Chat Components Showcase */}
                <Card style={{ gridColumn: 'span 2' }}>
                    <CardHeader title="Chat Components" />
                    <CardBody>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                            {/* Audio Player */}
                            <div>
                                <h4 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '1rem' }}>
                                    Audio Player Design
                                </h4>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                                    {/* Incoming Audio */}
                                    <div style={{ maxWidth: '350px' }}>
                                        <p style={{ fontSize: '0.75rem', marginBottom: '0.5rem', opacity: 0.7 }}>Incoming (Received)</p>
                                        <div style={{
                                            padding: '8px 12px',
                                            backgroundColor: 'var(--color-bg-elevated)',
                                            borderRadius: '18px',
                                            borderBottomLeftRadius: '4px',
                                            border: '1px solid var(--color-border)',
                                            width: 'fit-content'
                                        }}>
                                            <AudioPlayer src="/sounds/ui/mensagem.mp3" />
                                        </div>
                                    </div>

                                    {/* Outgoing Audio */}
                                    <div style={{ maxWidth: '350px' }}>
                                        <p style={{ fontSize: '0.75rem', marginBottom: '0.5rem', opacity: 0.7 }}>Outgoing (Sent)</p>
                                        <div style={{
                                            padding: '8px 12px',
                                            background: 'linear-gradient(135deg, var(--color-primary-600), var(--color-primary-500))',
                                            borderRadius: '18px',
                                            borderBottomRightRadius: '4px',
                                            width: 'fit-content',
                                            color: 'white'
                                        }}>
                                            <AudioPlayer
                                                src="/sounds/ui/notification.mp3"
                                                isMine={true}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Divider */}
                            <div style={{ height: '1px', background: 'var(--color-border)' }} />

                            {/* ═══════════════════════════════════════════════════ */}
                            {/* CHAT BUBBLE - NEW */}
                            {/* ═══════════════════════════════════════════════════ */}
                            <div>
                                <h4 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '1rem' }}>
                                    ChatBubble — Message Types
                                </h4>
                                <div style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '0.5rem',
                                    background: 'var(--color-bg-secondary)',
                                    borderRadius: 'var(--radius-lg)',
                                    padding: '1.5rem',
                                    border: '1px solid var(--color-border)',
                                    maxWidth: '600px'
                                }}>
                                    {/* System message */}
                                    <ChatBubble
                                        content="Maria entrou no chat"
                                        type="system"
                                        isMine={false}
                                        time="10:30"
                                    />

                                    {/* Date divider */}
                                    <ChatDateDivider label="Hoje" />

                                    {/* Incoming text */}
                                    <ChatBubble
                                        content="Olá! Tudo bem? 👋"
                                        type="text"
                                        isMine={false}
                                        senderName="Maria"
                                        showSender
                                        time="10:32"
                                    />

                                    {/* Outgoing text */}
                                    <ChatBubble
                                        content="Tudo ótimo! Vamos conversar sobre o projeto."
                                        type="text"
                                        isMine={true}
                                        time="10:33"
                                        status="read"
                                    />

                                    {/* Incoming text with statuses */}
                                    <ChatBubble
                                        content="Mandei o arquivo agora!"
                                        type="text"
                                        isMine={true}
                                        time="10:34"
                                        status="delivered"
                                    />

                                    {/* Outgoing pending */}
                                    <ChatBubble
                                        content="Enviando..."
                                        type="text"
                                        isMine={true}
                                        time="10:35"
                                        status="pending"
                                    />

                                    {/* File message */}
                                    <ChatBubble
                                        content="https://example.com/relatorio.pdf"
                                        type="file"
                                        isMine={false}
                                        senderName="Maria"
                                        showSender
                                        time="10:36"
                                        fileName="Relatório Q4.pdf"
                                        fileSize="2.3 MB"
                                    />
                                </div>
                            </div>

                            {/* Divider */}
                            <div style={{ height: '1px', background: 'var(--color-border)' }} />

                            {/* ═══════════════════════════════════════════════════ */}
                            {/* CHAT INPUT - NEW */}
                            {/* ═══════════════════════════════════════════════════ */}
                            <div>
                                <h4 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '1rem' }}>
                                    ChatInput — Interactive Demo
                                </h4>
                                <div style={{
                                    background: 'var(--color-bg-secondary)',
                                    borderRadius: 'var(--radius-lg)',
                                    padding: '1rem',
                                    border: '1px solid var(--color-border)',
                                    maxWidth: '600px'
                                }}>
                                    <ChatInput
                                        value={chatInputValue}
                                        onChange={setChatInputValue}
                                        onSend={() => {
                                            alert(`Mensagem: ${chatInputValue}`);
                                            setChatInputValue('');
                                        }}
                                        isRecording={chatIsRecording}
                                        recordingTimeFormatted="00:05"
                                        onStartRecording={() => setChatIsRecording(true)}
                                        onStopRecording={() => setChatIsRecording(false)}
                                        onCancelRecording={() => setChatIsRecording(false)}
                                        placeholder="Digite aqui para testar..."
                                        theme={theme === 'light' ? 'light' : 'dark'}
                                        attachmentOptions={[
                                            { id: 'image', label: 'Imagem', icon: <ImageIcon size={18} />, onClick: () => alert('Anexar imagem') },
                                            { id: 'file', label: 'Arquivo', icon: <FileText size={18} />, onClick: () => alert('Anexar arquivo') },
                                        ]}
                                    />
                                </div>
                            </div>
                        </div>
                    </CardBody>
                </Card>

                {/* ═══════════════════════════════════════════════════ */}
                {/* TABS — TIER 1 NEW */}
                {/* ═══════════════════════════════════════════════════ */}
                <Card style={{ gridColumn: 'span 2' }}>
                    <CardHeader title="Tabs" />
                    <CardBody>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                            {/* Underline */}
                            <div>
                                <h4 style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    Underline (default)
                                </h4>
                                <Tabs
                                    value={activeTab}
                                    onChange={setActiveTab}
                                    items={[
                                        { value: 'overview', label: 'Overview', icon: <User size={16} /> },
                                        { value: 'details', label: 'Details', badge: 5 },
                                        { value: 'settings', label: 'Settings', icon: <Settings size={16} /> },
                                        { value: 'disabled', label: 'Disabled', disabled: true },
                                    ]}
                                />
                                <div style={{ padding: '1rem', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                                    Tab ativa: <strong>{activeTab}</strong>
                                </div>
                            </div>

                            {/* Pills */}
                            <div>
                                <h4 style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    Pills (segmented)
                                </h4>
                                <Tabs
                                    variant="pills"
                                    value={activeTabPills}
                                    onChange={setActiveTabPills}
                                    items={[
                                        { value: 'all', label: 'Todos' },
                                        { value: 'active', label: 'Ativos', badge: 12 },
                                        { value: 'archived', label: 'Arquivados' },
                                    ]}
                                />
                            </div>

                            {/* Enclosed + Sizes */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                                <div>
                                    <h4 style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                        Enclosed
                                    </h4>
                                    <Tabs
                                        variant="enclosed"
                                        value="tab1"
                                        onChange={() => { }}
                                        items={[
                                            { value: 'tab1', label: 'Tab 1' },
                                            { value: 'tab2', label: 'Tab 2' },
                                            { value: 'tab3', label: 'Tab 3' },
                                        ]}
                                    />
                                </div>
                                <div>
                                    <h4 style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                        Full Width + Small
                                    </h4>
                                    <Tabs
                                        variant="pills"
                                        size="sm"
                                        fullWidth
                                        value="a"
                                        onChange={() => { }}
                                        items={[
                                            { value: 'a', label: 'Opção A' },
                                            { value: 'b', label: 'Opção B' },
                                            { value: 'c', label: 'Opção C' },
                                        ]}
                                    />
                                </div>
                            </div>
                        </div>
                    </CardBody>
                </Card>

                {/* ═══════════════════════════════════════════════════ */}
                {/* PROGRESS BAR — TIER 1 NEW */}
                {/* ═══════════════════════════════════════════════════ */}
                <Card>
                    <CardHeader title="ProgressBar" />
                    <CardBody>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            <ProgressBar value={75} showLabel label="75% concluído" />
                            <ProgressBar value={100} variant="success" showLabel />
                            <ProgressBar value={45} variant="warning" showLabel size="sm" />
                            <ProgressBar value={20} variant="danger" showLabel size="lg" />
                            <div>
                                <h4 style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    Striped + Animated
                                </h4>
                                <ProgressBar value={60} striped showLabel />
                            </div>
                        </div>
                    </CardBody>
                </Card>

                {/* ═══════════════════════════════════════════════════ */}
                {/* EMPTY STATE — TIER 1 NEW */}
                {/* ═══════════════════════════════════════════════════ */}
                <Card>
                    <CardHeader title="EmptyState" />
                    <CardBody>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                            <EmptyState
                                icon={<Inbox />}
                                title="Nenhum item encontrado"
                                description="Tente ajustar seus filtros ou criar um novo item."
                                action={<Button size="sm">Criar item</Button>}
                            />
                            <div style={{ height: '1px', background: 'var(--color-border)' }} />
                            <EmptyState
                                icon={<Search />}
                                title="Sem resultados"
                                description="Nenhum resultado para sua busca."
                                size="sm"
                            />
                        </div>
                    </CardBody>
                </Card>

                {/* ═══════════════════════════════════════════════════ */}
                {/* TEXTAREA — TIER 1 NEW */}
                {/* ═══════════════════════════════════════════════════ */}
                <Card>
                    <CardHeader title="Textarea" />
                    <CardBody>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            <Textarea
                                label="Observações"
                                placeholder="Digite suas observações..."
                                value={textareaValue}
                                onChange={(e) => setTextareaValue(e.target.value)}
                                maxLength={200}
                                showCount
                            />
                            <Textarea
                                label="Auto-resize"
                                autoResize
                                value={textareaAutoValue}
                                onChange={(e) => setTextareaAutoValue(e.target.value)}
                                helperText="O textarea cresce conforme o conteúdo"
                            />
                            <Textarea
                                label="Com Erro"
                                error="Este campo é obrigatório"
                                value=""
                                onChange={() => { }}
                            />
                            <Textarea
                                label="Desabilitado"
                                disabled
                                value="Conteúdo fixo"
                                onChange={() => { }}
                                size="sm"
                            />
                        </div>
                    </CardBody>
                </Card>

                {/* ═══════════════════════════════════════════════════ */}
                {/* TOOLTIP — TIER 1 NEW */}
                {/* ═══════════════════════════════════════════════════ */}
                <Card>
                    <CardHeader title="Tooltip" />
                    <CardBody>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            <h4 style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                Positions (hover)
                            </h4>
                            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center', padding: '2rem 0' }}>
                                <Tooltip content="Tooltip acima" position="top">
                                    <Button variant="secondary" size="sm">Top</Button>
                                </Tooltip>
                                <Tooltip content="Tooltip abaixo" position="bottom">
                                    <Button variant="secondary" size="sm">Bottom</Button>
                                </Tooltip>
                                <Tooltip content="Tooltip à esquerda" position="left">
                                    <Button variant="secondary" size="sm">Left</Button>
                                </Tooltip>
                                <Tooltip content="Tooltip à direita" position="right">
                                    <Button variant="secondary" size="sm">Right</Button>
                                </Tooltip>
                            </div>
                            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                                <Tooltip content="Informação detalhada sobre esta funcionalidade que pode ser útil para o usuário." maxWidth={200}>
                                    <Button variant="ghost" size="sm" leftIcon={<AlertTriangle size={14} />}>Long text</Button>
                                </Tooltip>
                                <Tooltip content="Desabilitado" disabled>
                                    <Button variant="ghost" size="sm">Disabled</Button>
                                </Tooltip>
                            </div>
                        </div>
                    </CardBody>
                </Card>

                {/* ═══════════════════════════════════════════════════ */}
                {/* SKELETON — TIER 1 NEW */}
                {/* ═══════════════════════════════════════════════════ */}
                <Card>
                    <CardHeader title="Skeleton" />
                    <CardBody>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            {/* Rect */}
                            <div>
                                <h4 style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    Rectangle
                                </h4>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    <Skeleton width="100%" height={40} />
                                    <Skeleton width="75%" height={20} />
                                    <Skeleton width="50%" height={20} />
                                </div>
                            </div>

                            {/* Circle */}
                            <div>
                                <h4 style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    Circle
                                </h4>
                                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                    <Skeleton variant="circle" size={32} />
                                    <Skeleton variant="circle" size={48} />
                                    <Skeleton variant="circle" size={64} />
                                </div>
                            </div>

                            {/* Text */}
                            <div>
                                <h4 style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    Text (paragraph)
                                </h4>
                                <Skeleton variant="text" lines={4} />
                            </div>

                            {/* Card skeleton pattern */}
                            <div>
                                <h4 style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    Card Pattern
                                </h4>
                                <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                                    <Skeleton variant="circle" size={40} />
                                    <div style={{ flex: 1 }}>
                                        <Skeleton width="60%" height={16} style={{ marginBottom: 8 }} />
                                        <Skeleton width="40%" height={12} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CardBody>
                </Card>

            </div>

            {/* ═══════════════════════════════════════════════ */}
            {/* MODALS (portaled, rendered outside grid) */}
            {/* ═══════════════════════════════════════════════ */}

            {/* Regular Modal Demo */}
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

            {/* ConfirmModal — Danger */}
            <ConfirmModal
                isOpen={confirmDanger}
                onClose={() => setConfirmDanger(false)}
                onConfirm={() => { alert('Ação perigosa confirmada!'); setConfirmDanger(false); }}
                variant="danger"
                title="Excluir item?"
                description="Essa ação é irreversível. O item será permanentemente removido do sistema."
                confirmLabel="Excluir"
                cancelLabel="Cancelar"
            />

            {/* ConfirmModal — Warning */}
            <ConfirmModal
                isOpen={confirmWarning}
                onClose={() => setConfirmWarning(false)}
                onConfirm={() => { alert('Ação de alerta confirmada!'); setConfirmWarning(false); }}
                variant="warning"
                title="Tem certeza?"
                description="Essa ação pode causar efeitos colaterais. Deseja continuar?"
                confirmLabel="Sim, continuar"
            />

            {/* ConfirmModal — Info */}
            <ConfirmModal
                isOpen={confirmInfo}
                onClose={() => setConfirmInfo(false)}
                onConfirm={() => { alert('Ação info confirmada!'); setConfirmInfo(false); }}
                variant="info"
                title="Informação"
                description="Esta operação vai sincronizar os dados com o servidor. Deseja prosseguir?"
                confirmLabel="Sincronizar"
            />

            {/* ConfirmModal — Success */}
            <ConfirmModal
                isOpen={confirmSuccess}
                onClose={() => setConfirmSuccess(false)}
                onConfirm={() => { alert('Ação de sucesso confirmada!'); setConfirmSuccess(false); }}
                variant="success"
                title="Concluir operação?"
                description="Todos os itens foram validados. Confirmar a conclusão?"
                confirmLabel="Concluir"
            />
        </div>
    );
}
