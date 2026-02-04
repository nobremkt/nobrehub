import { Card, CardBody } from '@/design-system';
import { Trophy, Medal } from 'lucide-react';
import styles from './SalesStats.module.css';

interface TopSeller {
    name: string;
    deals: number;
    value: number;
}

interface TopSellersRankingProps {
    sellers: TopSeller[];
}

// Medal colors for top 3
const RANK_COLORS = ['#f59e0b', '#94a3b8', '#cd7f32'];

export function TopSellersRanking({ sellers }: TopSellersRankingProps) {
    return (
        <Card variant="default" className={styles.card}>
            <CardBody style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <div className={styles.cardTitle}>
                    <Trophy size={16} color="var(--color-warning-500)" />
                    TOP VENDEDORES
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
                    {sellers.length === 0 ? (
                        <div style={{
                            flex: 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'var(--color-text-muted)',
                            fontSize: '0.875rem'
                        }}>
                            Nenhuma venda no período
                        </div>
                    ) : (
                        sellers.map((seller, index) => (
                            <div key={index} className={styles.sellerItem}>
                                {/* Rank Badge */}
                                <div
                                    className={styles.sellerRank}
                                    style={{
                                        background: index < 3
                                            ? `${RANK_COLORS[index]}22`
                                            : 'var(--color-bg-primary)',
                                        color: index < 3
                                            ? RANK_COLORS[index]
                                            : 'var(--color-text-muted)'
                                    }}
                                >
                                    {index < 3 ? (
                                        <Medal size={14} />
                                    ) : (
                                        `${index + 1}º`
                                    )}
                                </div>

                                {/* Seller Info */}
                                <div className={styles.sellerInfo}>
                                    <div className={styles.sellerName}>{seller.name}</div>
                                    <div className={styles.sellerDeals}>{seller.deals} vendas</div>
                                </div>

                                {/* Value */}
                                <div className={styles.sellerValue}>
                                    R$ {seller.value.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </CardBody>
        </Card>
    );
}
