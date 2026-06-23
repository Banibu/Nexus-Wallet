import type { ReactNode } from 'react';

interface SectionHeaderProps {
    title: string;
    subtitle?: string;
    action?: ReactNode;
}

export default function SectionHeader({
    title,
    subtitle,
    action,
}: SectionHeaderProps) {
    return (
        <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
            <div>
                <h2 className="text-xl sm:text-2xl font-display font-semibold tracking-tight">
                    {title}
                </h2>
                {subtitle && (
                    <p className="text-sm text-muted-foreground mt-0.5 max-w-2xl">
                        {subtitle}
                    </p>
                )}
            </div>
            {action}
        </div>
    );
}
