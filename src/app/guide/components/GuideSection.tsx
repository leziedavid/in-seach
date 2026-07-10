import { Icon } from "@iconify/react";
import GuideIllustration, { GuideTone } from "./GuideIllustration";

interface GuideStep {
    title: string;
    description: string;
}

interface GuideSectionProps {
    id: string;
    eyebrow: string;
    title: string;
    description: string;
    icon: string;
    accentIcon?: string;
    tone: GuideTone;
    steps?: GuideStep[];
    tip?: string;
    info?: string;
    reverse?: boolean;
    children?: React.ReactNode;
}

export default function GuideSection({ id, eyebrow, title, description, icon, accentIcon, tone, steps, tip, info, reverse, children }: GuideSectionProps) {
    return (
        <section id={id} className="scroll-mt-28 py-12 md:py-16 border-b border-border/60 last:border-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-14 items-center">
                <div className={reverse ? "md:order-2" : ""}>
                    <GuideIllustration icon={icon} accentIcon={accentIcon} tone={tone} />
                </div>

                <div className={reverse ? "md:order-1" : ""}>
                    <p className="text-[11px] font-black text-primary uppercase tracking-[0.2em] mb-2">{eyebrow}</p>
                    <h2 className="text-2xl md:text-3xl font-black text-foreground tracking-tight mb-4">{title}</h2>
                    <p className="text-muted-foreground leading-relaxed mb-6">{description}</p>

                    {steps && steps.length > 0 && (
                        <ol className="space-y-4 mb-6">
                            {steps.map((step, i) => (
                                <li key={i} className="flex gap-4">
                                    <span className="shrink-0 w-8 h-8 rounded-full bg-primary/10 text-primary font-black text-sm flex items-center justify-center">
                                        {i + 1}
                                    </span>
                                    <div>
                                        <p className="font-bold text-foreground text-sm">{step.title}</p>
                                        <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
                                    </div>
                                </li>
                            ))}
                        </ol>
                    )}

                    {children}

                    {tip && (
                        <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/10 flex gap-3 mb-3">
                            <Icon icon="solar:lightbulb-bolt-bold-duotone" className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
                            <p className="text-xs text-amber-800 dark:text-amber-400 font-bold leading-relaxed">
                                <span className="uppercase tracking-wide mr-1">Conseil —</span>{tip}
                            </p>
                        </div>
                    )}

                    {info && (
                        <div className="p-4 rounded-2xl bg-secondary/5 border border-secondary/10 flex gap-3">
                            <Icon icon="solar:info-circle-bold-duotone" className="w-5 h-5 text-secondary shrink-0" />
                            <p className="text-xs text-secondary font-bold leading-relaxed">
                                <span className="uppercase tracking-wide mr-1">À savoir —</span>{info}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
}
