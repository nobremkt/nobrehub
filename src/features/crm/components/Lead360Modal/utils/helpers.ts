
export function getInitials(name: string): string {
    return name
        .split(' ')
        .map(n => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();
}

export function formatCurrency(value?: number): string {
    if (!value) return 'Não informado';
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    }).format(value);
}

export function formatDate(date: Date): string {
    return new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(new Date(date));
}

export function getTagVariant(tag: string): 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info' {
    const lower = tag.toLowerCase();
    if (lower.includes('urgente') || lower.includes('prioridade')) return 'danger';
    if (lower.includes('quente') || lower.includes('hot')) return 'warning';
    if (lower.includes('fechado') || lower.includes('ganho')) return 'success';
    if (lower.includes('vip') || lower.includes('premium')) return 'primary';
    if (lower.includes('novo')) return 'info';
    return 'default';
}
