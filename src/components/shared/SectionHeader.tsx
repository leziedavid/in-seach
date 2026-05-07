import React from 'react';
import { cn } from '@/lib/utils';

interface SectionHeaderProps {
    title: string;
    subtitle?: string;
    className?: string;
}

export const SectionHeader = ({ title, subtitle, className }: SectionHeaderProps) => {
    return (
        <div className={cn("w-full max-w-full px-1", className)}>
            <h1 className="text-xl md:text-2xl  font-extrabold tracking-tight text-brand-secondary dark:text-white uppercase">
                {title}
            </h1>

            {subtitle && (
                <p className="mt-3 text-sm text-gray-700 dark:text-gray-300 leading-relaxed italic font-medium">
                    {subtitle}
                </p>
            )}
        </div>
    );
};
