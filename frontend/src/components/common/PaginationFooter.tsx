import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PaginationFooterProps {
    page: number;
    total: number;
    totalPages: number;
    loading: boolean;
    itemName?: string;
    onPageChange: (newPage: number) => void;
}

export function PaginationFooter({
    page,
    total,
    totalPages,
    loading,
    itemName = 'itens',
    onPageChange,
}: PaginationFooterProps) {
    return (
        <div
            className="flex items-center justify-between flex-wrap gap-2"
            data-testid="table-pagination"
        >
            <div className="text-xs text-muted-foreground">
                Total: <span className="font-medium">{total}</span> {itemName} ·
                Página {page} de {Math.max(1, totalPages)}
            </div>
            <div className="flex items-center gap-2">
                <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1 || loading}
                    onClick={() => onPageChange(Math.max(1, page - 1))}
                    data-testid="table-pagination-prev"
                >
                    <ChevronLeft className="h-4 w-4" /> Anterior
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= Math.max(1, totalPages) || loading}
                    onClick={() => onPageChange(page + 1)}
                    data-testid="table-pagination-next"
                >
                    Próxima <ChevronRight className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}
