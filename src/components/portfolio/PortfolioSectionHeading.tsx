import React from "react";

export default function PortfolioSectionHeading({ eyebrow, title }: { eyebrow: string; title?: string }) {
    return (
        <div className="flex flex-col gap-3 mb-8">
            <div className="flex items-center gap-3">
                <span className="h-px w-8 bg-primary" />
                <span className="text-xs font-black uppercase tracking-[0.3em] text-primary">{eyebrow}</span>
            </div>
            {title ? <h2 className="text-4xl font-black tracking-tight">{title}</h2> : null}
        </div>
    );
}
