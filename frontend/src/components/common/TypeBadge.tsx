interface TypeBadgeProps {
    type: string;
    testId?: string;
}

const BADGE_STYLES: Record<string, string> = {
    DEPOSIT: 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30',
    SWAP: 'bg-teal-500/15 text-teal-300 border border-teal-500/30',
    SWAP_IN: 'bg-teal-500/15 text-teal-300 border border-teal-500/30',
    SWAP_OUT: 'bg-secondary text-muted-foreground border border-border',
    SWAP_FEE: 'bg-amber-500/15 text-amber-300 border border-amber-500/30',
    WITHDRAWAL: 'bg-red-500/15 text-red-300 border border-red-500/30',
};

export function TypeBadge({ type, testId }: TypeBadgeProps) {
    const style = BADGE_STYLES[type] || 'bg-secondary border border-border';
    return (
        <span
            className={`inline-flex items-center text-[10px] font-medium px-2 py-0.5 rounded ${style}`}
            data-testid={testId}
        >
            {type}
        </span>
    );
}
