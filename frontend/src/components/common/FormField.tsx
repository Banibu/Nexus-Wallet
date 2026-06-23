import { ReactNode } from 'react';
import { Label } from '@/components/ui/label';

interface FormFieldProps {
    id: string;
    label: string;
    children: ReactNode;
    className?: string;
}

export function FormField({ id, label, children, className = '' }: FormFieldProps) {
    return (
        <div className={`space-y-2 ${className}`.trim()}>
            <Label htmlFor={id}>{label}</Label>
            {children}
        </div>
    );
}
