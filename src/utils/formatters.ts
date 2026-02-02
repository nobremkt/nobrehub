/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * NOBRE HUB - UTILS: FORMATTERS
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Funções de formatação para datas, moedas, números, etc.
 * 
 * ═══════════════════════════════════════════════════════════════════════════════
 */

/**
 * Formata data para exibição
 */
export function formatDate(date: Date | string, options?: Intl.DateTimeFormatOptions): string {
    const d = typeof date === 'string' ? new Date(date) : date;

    const defaultOptions: Intl.DateTimeFormatOptions = {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    };

    return d.toLocaleDateString('pt-BR', options ?? defaultOptions);
}

/**
 * Formata data e hora
 */
export function formatDateTime(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;

    return d.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

/**
 * Formata hora relativa (há X minutos, há X horas)
 */
export function formatRelativeTime(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Agora';
    if (diffMins < 60) return `Há ${diffMins} min`;
    if (diffHours < 24) return `Há ${diffHours}h`;
    if (diffDays === 1) return 'Ontem';
    if (diffDays < 7) return `Há ${diffDays} dias`;

    return formatDate(d);
}

/**
 * Formata valor monetário (BRL)
 */
export function formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    }).format(value);
}

/**
 * Formata número com separadores
 */
export function formatNumber(value: number): string {
    return new Intl.NumberFormat('pt-BR').format(value);
}

/**
 * Formata telefone brasileiro
 */
/**
 * Formata telefone brasileiro, suportando DDI (+55)
 */
import { formatPhoneNumberIntl } from 'react-phone-number-input';

export function formatPhone(phone: string): string {
    if (!phone) return '';

    // Se já vier formatado bonitinho (ex: Google Contacts), retorna
    if (phone.includes('(') && phone.includes(')')) return phone;

    // Tenta usar a lib para formatação internacional padrão
    try {
        // Adiciona + se não tiver, para a lib entender
        const phoneWithPlus = phone.startsWith('+') ? phone : `+${phone}`;
        const formatted = formatPhoneNumberIntl(phoneWithPlus);
        if (formatted) return formatted;
    } catch (e) {
        // Fallback para formatação manual se falhar
    }

    // Fallback manual (mantendo lógica antiga melhorada)
    const cleaned = phone.replace(/\D/g, '');

    // Brasil com DDI (12 ou 13 dígitos começando com 55)
    if (cleaned.startsWith('55') && (cleaned.length === 12 || cleaned.length === 13)) {
        const ddd = cleaned.slice(2, 4);
        const number = cleaned.slice(4);
        const part1 = number.length === 9 ? number.slice(0, 5) : number.slice(0, 4);
        const part2 = number.length === 9 ? number.slice(5) : number.slice(4);
        return `+55 (${ddd}) ${part1}-${part2}`;
    }

    // Apenas DDD + Numero (10 ou 11) -> Assume Brasil +55 implícito na visualização ou apenas (XX)
    if (cleaned.length === 11) {
        return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    }
    if (cleaned.length === 10) {
        return cleaned.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    }

    return phone;
}

/**
 * Formata CPF
 */
export function formatCPF(cpf: string): string {
    const cleaned = cpf.replace(/\D/g, '');
    return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

/**
 * Formata CNPJ
 */
export function formatCNPJ(cnpj: string): string {
    const cleaned = cnpj.replace(/\D/g, '');
    return cleaned.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
}

/**
 * Abreviação de nomes longos
 */
export function abbreviateName(name: string, maxLength: number = 20): string {
    if (name.length <= maxLength) return name;

    const parts = name.split(' ');
    if (parts.length === 1) return name.slice(0, maxLength) + '...';

    const firstName = parts[0];
    const lastName = parts[parts.length - 1];

    return `${firstName} ${lastName.charAt(0)}.`;
}

/**
 * Gera iniciais do nome
 */
export function getInitials(name: string): string {
    if (!name) return '';
    const parts = name.trim().split(' ').filter(Boolean);

    if (parts.length === 0) return '';
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();

    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

/**
 * Formata bytes para KB, MB, GB
 */
export function formatBytes(bytes: number, decimals: number = 2): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + ' ' + sizes[i];
}
