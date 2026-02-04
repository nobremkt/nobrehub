import { Card, CardBody } from '@/design-system';
import { Globe, Mail, Phone, Users, MessageSquare, Instagram } from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import styles from './SalesStats.module.css';

interface SourceData {
    source: string;
    count: number;
}

interface LeadSourceChartProps {
    data: SourceData[];
}

// Source icons and colors
const SOURCE_CONFIG: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
    'instagram': { icon: <Instagram size={14} />, color: '#E4405F', label: 'Instagram' },
    'facebook': { icon: <Users size={14} />, color: '#1877F2', label: 'Facebook' },
    'whatsapp': { icon: <MessageSquare size={14} />, color: '#25D366', label: 'WhatsApp' },
    'email': { icon: <Mail size={14} />, color: '#EA4335', label: 'E-mail' },
    'telefone': { icon: <Phone size={14} />, color: '#3B82F6', label: 'Telefone' },
    'phone': { icon: <Phone size={14} />, color: '#3B82F6', label: 'Telefone' },
    'indicacao': { icon: <Users size={14} />, color: '#8B5CF6', label: 'Indicação' },
    'referral': { icon: <Users size={14} />, color: '#8B5CF6', label: 'Indicação' },
    'site': { icon: <Globe size={14} />, color: '#06B6D4', label: 'Site' },
    'website': { icon: <Globe size={14} />, color: '#06B6D4', label: 'Site' },
    'organico': { icon: <Globe size={14} />, color: '#22C55E', label: 'Orgânico' },
    'organic': { icon: <Globe size={14} />, color: '#22C55E', label: 'Orgânico' },
};

const DEFAULT_COLORS = ['#dc2626', '#f59e0b', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899'];

export function LeadSourceChart({ data }: LeadSourceChartProps) {
    const total = data.reduce((sum, d) => sum + d.count, 0);

    // Sort by count descending
    const sortedData = [...data].sort((a, b) => b.count - a.count);

    // Add colors to data
    const chartData = sortedData.map((item, index) => ({
        ...item,
        color: SOURCE_CONFIG[item.source.toLowerCase()]?.color || DEFAULT_COLORS[index % DEFAULT_COLORS.length],
        label: SOURCE_CONFIG[item.source.toLowerCase()]?.label || item.source
    }));

    return (
        <Card variant="default" className={styles.card}>
            <CardBody style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <div className={styles.cardTitle}>
                    <Globe size={16} color="var(--color-primary-500)" />
                    ORIGEM DOS LEADS
                    <span style={{ marginLeft: 'auto', fontSize: '0.75rem', fontWeight: 'bold' }}>
                        {total} leads
                    </span>
                </div>

                <div style={{ display: 'flex', gap: '1rem', flex: 1, alignItems: 'center' }}>
                    {/* Donut Chart */}
                    <div style={{ flex: '0 0 140px', height: '140px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={chartData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={40}
                                    outerRadius={65}
                                    paddingAngle={2}
                                    dataKey="count"
                                >
                                    {chartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{
                                        background: 'var(--color-bg-primary)',
                                        border: '1px solid var(--color-border)',
                                        borderRadius: '8px',
                                        fontSize: '12px'
                                    }}
                                    formatter={(value) => [`${value} leads`, '']}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Legend */}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                        {chartData.slice(0, 6).map((item, index) => {
                            const percentage = total > 0 ? Math.round((item.count / total) * 100) : 0;
                            const config = SOURCE_CONFIG[item.source.toLowerCase()];

                            return (
                                <div
                                    key={index}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem',
                                        padding: '0.35rem 0.5rem',
                                        background: 'var(--color-bg-secondary)',
                                        borderRadius: 'var(--radius-sm)'
                                    }}
                                >
                                    <div style={{ color: item.color }}>
                                        {config?.icon || <Globe size={14} />}
                                    </div>
                                    <span style={{ flex: 1, fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                                        {item.label}
                                    </span>
                                    <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--color-text-primary)' }}>
                                        {item.count}
                                    </span>
                                    <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', width: '30px', textAlign: 'right' }}>
                                        {percentage}%
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </CardBody>
        </Card>
    );
}
