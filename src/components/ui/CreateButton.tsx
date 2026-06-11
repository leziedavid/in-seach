'use client';

import { Icon } from '@iconify/react';
import { cn } from '@/lib/utils';

interface CreateButtonProps {
    label: string;
    onClick: () => void;
    loading?: boolean;
    disabled?: boolean;
    icon?: string;
    className?: string;
}

export default function CreateButton({
    label,
    onClick,
    loading = false,
    disabled = false,
    icon = 'solar:widget-add-bold',
    className,
}: CreateButtonProps) {
    return (
        <button onClick={onClick} disabled={disabled || loading}
            className={cn('group flex items-center justify-between gap-3 w-full', 'bg-muted/60 hover:bg-muted rounded-2xl px-4 py-3', 'text-foreground font-semibold text-sm', 'transition-all duration-200 active:scale-[0.98]', 'disabled:opacity-50 disabled:pointer-events-none', className)} >
            {/* Left: icon + label */}
            <span className="flex items-center gap-3">
                <span className="flex items-center justify-center w-8 h-8 rounded-xl bg-foreground/10 shrink-0">
                    {loading ? (
                        <Icon icon="line-md:loading-twotone-loop" className="w-5 h-5 text-foreground" />
                    ) : (
                        <Icon icon={icon} className="w-5 h-5 text-foreground" />
                    )}
                </span>
                <span className="whitespace-nowrap">{label}</span>
            </span>

            {/* Right: chevron */}
            <Icon icon="solar:alt-arrow-right-bold" className="w-4 h-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform shrink-0" />
        </button>
    );
}
