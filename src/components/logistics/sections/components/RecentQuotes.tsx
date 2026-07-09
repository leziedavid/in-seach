"use client"

import { Icon } from "@iconify/react"
import { Quote, QuoteStatus } from "@/types/interface"

const QUOTE_STATUS_LABEL: Record<string, string> = {
    [QuoteStatus.PENDING]: "EN ATTENTE",
    [QuoteStatus.REVIEWING]: "EN ÉTUDE",
    [QuoteStatus.PROPOSED]: "PROPOSÉ",
    [QuoteStatus.ACCEPTED]: "ACCEPTÉ",
    [QuoteStatus.REJECTED]: "REJETÉ",
    [QuoteStatus.CANCELLED]: "ANNULÉ",
};

const QUOTE_STATUS_STYLE: Record<string, string> = {
    [QuoteStatus.PENDING]: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
    [QuoteStatus.REVIEWING]: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    [QuoteStatus.PROPOSED]: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
    [QuoteStatus.ACCEPTED]: "bg-green-500/10 text-green-600 dark:text-green-400",
    [QuoteStatus.REJECTED]: "bg-red-500/10 text-red-600 dark:text-red-400",
    [QuoteStatus.CANCELLED]: "bg-muted text-muted-foreground",
};

interface RecentQuotesProps {
    quotes: Quote[];
    loading: boolean;
    onSeeAll?: () => void;
}

export default function RecentQuotes({ quotes, loading, onSeeAll }: RecentQuotesProps) {
    return (
        <>
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-black text-foreground">Devis récents</h3>
                {onSeeAll && quotes.length > 0 && (
                    <button onClick={onSeeAll} className="text-xs font-black text-primary hover:underline flex items-center gap-1">
                        Voir tout
                        <Icon icon="solar:alt-arrow-right-bold-duotone" className="w-3.5 h-3.5" />
                    </button>
                )}
            </div>

            {loading && (
                <div className="space-y-2">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="h-16 rounded-2xl bg-muted/40 animate-pulse" />
                    ))}
                </div>
            )}

            {!loading && quotes.length === 0 && (
                <div className="py-10 text-center flex flex-col items-center justify-center gap-3 bg-muted/20 rounded-2xl border-2 border-dashed border-border">
                    <div className="p-3 bg-muted/50 rounded-full">
                        <Icon icon="solar:document-text-bold-duotone" className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <p className="text-xs font-bold text-muted-foreground">Aucun devis reçu pour le moment</p>
                </div>
            )}

            {!loading && quotes.length > 0 && (
                <div className="space-y-2">
                    {quotes.map((quote) => (
                        <button key={quote.id} onClick={onSeeAll} className="w-full flex items-center justify-between gap-4 py-3.5 px-4 rounded-2xl border border-border bg-card shadow-sm hover:shadow-md hover:bg-muted/5 transition-all text-left" >
                            <div className="min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">{quote.sender?.fullName || "Client"}</span>
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${QUOTE_STATUS_STYLE[quote.status] || "bg-muted text-muted-foreground"}`}>
                                        {QUOTE_STATUS_LABEL[quote.status] || quote.status}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <p className="text-sm font-black text-card-foreground truncate">{quote.departureAddress} → {quote.arrivalAddress}</p>
                                    {!!quote.montantTransac && (
                                        <>
                                            <span className="text-muted-foreground">•</span>
                                            <p className="text-xs text-muted-foreground shrink-0">{quote.montantTransac.toLocaleString()} FCFA</p>
                                        </>
                                    )}
                                </div>
                            </div>
                            <Icon icon="solar:alt-arrow-right-bold-duotone" className="w-4 h-4 text-muted-foreground shrink-0" />
                        </button>
                    ))}
                </div>
            )}
        </>
    );
}
