import React, { useState } from 'react';
import { cn } from '@/lib/utils';

interface SectionHeaderProps {
    title: string;
    subtitle?: string;
    className?: string;
}

export const SectionHeader = ({ title, subtitle, className }: SectionHeaderProps) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const THRESHOLD = 120;

    const shouldShowReadMore = subtitle && subtitle.length > THRESHOLD;
    const displayText = shouldShowReadMore && !isExpanded 
        ? `${subtitle.substring(0, THRESHOLD)}...` 
        : subtitle;

    return (
        <div className={cn("w-full max-w-full px-1", className)}>
            <h1 className="text-xl md:text-2xl font-extrabold tracking-tight text-brand-secondary dark:text-white uppercase">
                {title}
            </h1>

            {subtitle && (
                <div className="mt-3">
                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed italic font-medium inline">
                        {displayText}
                    </p>
                    {shouldShowReadMore && (
                        <button
                            onClick={() => setIsExpanded(!isExpanded)}
                            className="ml-2 text-xs font-bold text-primary hover:underline transition-all cursor-pointer"
                        >
                            {isExpanded ? "Voir moins" : "Voir plus"}
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};
