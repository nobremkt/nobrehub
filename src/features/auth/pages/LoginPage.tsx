/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * NOBRE HUB - FEATURE: AUTH - LOGIN PAGE
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { useState, FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '@/stores';
import { Button, Input, Card, CardBody } from '@/design-system';
import { ROUTES } from '@/config';
import styles from './LoginPage.module.css';

export function LoginPage() {
    const navigate = useNavigate();
    const { login, status, error, resetError } = useAuthStore();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [formError, setFormError] = useState<string | null>(null);

    const isLoading = status === 'loading';

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setFormError(null);
        resetError();

        // Validação básica
        if (!email.trim()) {
            setFormError('Digite seu email');
            return;
        }
        if (!password.trim()) {
            setFormError('Digite sua senha');
            return;
        }

        try {
            await login(email, password);
            navigate(ROUTES.dashboard, { replace: true });
        } catch {
            // Erro já está no store
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.wrapper}>
                {/* Logo & Brand */}
                <div className={styles.brand}>
                    <div className={styles.logo}>N</div>
                    <h1 className={styles.title}>Nobre Hub</h1>
                    <p className={styles.subtitle}>Sistema de gestão Nobre Marketing</p>
                </div>

                {/* Login Card */}
                <Card variant="elevated" className={styles.card}>
                    <CardBody className={styles.cardBody}>
                        <h2 className={styles.formTitle}>Entrar na sua conta</h2>

                        <form onSubmit={handleSubmit} className={styles.form}>
                            <Input
                                label="Email"
                                type="email"
                                placeholder="seu@email.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                disabled={isLoading}
                                autoComplete="email"
                                size="lg"
                            />

                            <Input
                                label="Senha"
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                disabled={isLoading}
                                autoComplete="current-password"
                                size="lg"
                            />

                            {(formError || error) && (
                                <div className={styles.errorMessage}>
                                    {formError || error}
                                </div>
                            )}

                            <Button
                                type="submit"
                                variant="primary"
                                size="lg"
                                fullWidth
                                isLoading={isLoading}
                            >
                                {isLoading ? 'Entrando...' : 'Entrar'}
                            </Button>
                        </form>

                        <Link to={ROUTES.auth.forgotPassword} className={styles.forgotLink}>
                            Esqueceu sua senha?
                        </Link>
                    </CardBody>
                </Card>

                {/* Footer */}
                <p className={styles.footer}>
                    © {new Date().getFullYear()} Nobre Marketing. Todos os direitos reservados.
                </p>
            </div>
        </div>
    );
}
