"use client";

import { useCallback, useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import { useRouter } from "next/navigation";
import { getMyLives, deleteLive } from "@/api/api";
import { Live, LiveStatus, LiveEntityType } from "@/types/interface";
import { useNotification } from "@/components/notifications/NotificationProvider";
import { Button } from "@/components/ui/button";
import { TablePagination } from "@/components/ui/table/Pagination";
import { SectionHeader } from "@/components/shared/SectionHeader";
import LiveFormModal from "./LiveFormModal";
import CreateButton from "@/components/ui/CreateButton";

// ─── CONFIG ──────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<LiveStatus, { label: string; color: string; dot: string }> = {
    [LiveStatus.DRAFT]:     { label: "Brouillon",  color: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",           dot: "bg-zinc-400" },
    [LiveStatus.PENDING]:   { label: "En attente", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",     dot: "bg-amber-400" },
    [LiveStatus.PUBLISHED]: { label: "Publié",     color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",     dot: "bg-green-500" },
    [LiveStatus.REJECTED]:  { label: "Refusé",     color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",             dot: "bg-red-500" },
    [LiveStatus.SUSPENDED]: { label: "Suspendu",   color: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400", dot: "bg-orange-400" },
};

const ENTITY_LABELS: Partial<Record<LiveEntityType, string>> = {
    [LiveEntityType.PRODUCT]:            "Produit",
    [LiveEntityType.SERVICE]:            "Service",
    [LiveEntityType.ANNONCE]:            "Annonce",
    [LiveEntityType.SERVICE_LOGISTIQUE]: "Logistique",
    [LiveEntityType.PROFILE]:            "Profil",
};

const STATUS_FILTER_OPTIONS = [
    { value: "", label: "Tous les statuts" },
    { value: LiveStatus.PUBLISHED, label: "Publiés" },
    { value: LiveStatus.PENDING,   label: "En attente" },
    { value: LiveStatus.REJECTED,  label: "Refusés" },
    { value: LiveStatus.SUSPENDED, label: "Suspendus" },
    { value: LiveStatus.DRAFT,     label: "Brouillons" },
];

function detectSource(url: string) {
    if (url.includes("tiktok.com")) return { icon: "mdi:tiktok", label: "TikTok" };
    if (url.includes("youtube.com") || url.includes("youtu.be")) return { icon: "mdi:youtube", label: "YouTube" };
    if (url.includes("facebook.com") || url.includes("fb.watch")) return { icon: "mdi:facebook", label: "Facebook" };
    if (url.includes("instagram.com")) return { icon: "mdi:instagram", label: "Instagram" };
    return { icon: "solar:link-bold-duotone", label: "Lien" };
}

// ─── STAT CARD ───────────────────────────────────────────────────────────────

function StatCard({ icon, value, label, color }: { icon: string; value: number; label: string; color: string }) {
    return (
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-card border border-border">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
                <Icon icon={icon} className="w-5 h-5" />
            </div>
            <div>
                <p className="text-xl font-black text-foreground leading-none">{value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
            </div>
        </div>
    );
}

// ─── COMPONENT ───────────────────────────────────────────────────────────────

export default function MyLivesList() {
    const { showNotification } = useNotification();
    const router = useRouter();

    // List state
    const [lives, setLives] = useState<Live[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [total, setTotal] = useState(0);
    const limit = 8;

    // Filters
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState<LiveStatus | "">("");

    // Stats
    const [stats, setStats] = useState<{ total: number; published: number; pending: number; rejected: number } | null>(null);

    // Modals
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingLive, setEditingLive] = useState<Live | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    // ─── FETCH ────────────────────────────────────────────────────────────

    const fetchLives = useCallback(async () => {
        setLoading(true);
        try {
            const res = await getMyLives({ page, limit, status: statusFilter || undefined });
            if (res.statusCode === 200 && res.data) {
                // Filtrage recherche côté client (sur title/description)
                const filtered = search.trim()
                    ? res.data.data.filter(l =>
                        l.title.toLowerCase().includes(search.toLowerCase()) ||
                        (l.description ?? "").toLowerCase().includes(search.toLowerCase())
                    )
                    : res.data.data;
                setLives(filtered);
                setTotal(search.trim() ? filtered.length : res.data.total);
                setTotalPages(search.trim() ? Math.ceil(filtered.length / limit) : res.data.totalPages);
            }
        } finally {
            setLoading(false);
        }
    }, [page, limit, statusFilter, search]);

    useEffect(() => { fetchLives(); }, [fetchLives]);

    // ─── ACTIONS ──────────────────────────────────────────────────────────

    const handleDelete = async (id: string) => {
        if (!confirm("Supprimer ce Live ?")) return;
        setDeletingId(id);
        try {
            const res = await deleteLive(id);
            if (res.statusCode === 200) {
                showNotification("Live supprimé.", "success");
                fetchLives();
            } else {
                showNotification(res.message || "Erreur.", "error");
            }
        } finally {
            setDeletingId(null);
        }
    };

    const openEdit = (live: Live) => { setEditingLive(live); setIsFormOpen(true); };
    const openCreate = () => { setEditingLive(null); setIsFormOpen(true); };

    // ─── RENDER ───────────────────────────────────────────────────────────

    return (
        <div className="w-full py-4 space-y-6">

            {/* Header */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <SectionHeader
                    title="Mes Lives"
                    subtitle="Publiez des courtes vidéos pour promouvoir vos produits, services et annonces."
                    className="!text-left"
                />
                <div className="w-full sm:w-auto sm:shrink-0">
                    <CreateButton
                        label="Publier un Live"
                        icon="solar:play-circle-bold-duotone"
                        onClick={openCreate}
                    />
                </div>
            </div>

            {/* Stats */}
            {stats && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <StatCard icon="solar:videocamera-bold-duotone" value={stats.total}     label="Total"      color="bg-primary/10 text-primary" />
                    <StatCard icon="solar:play-circle-bold-duotone" value={stats.published} label="Publiés"    color="bg-green-100 text-green-600 dark:bg-green-900/30" />
                    <StatCard icon="solar:clock-circle-bold-duotone" value={stats.pending}  label="En attente" color="bg-amber-100 text-amber-600 dark:bg-amber-900/30" />
                    <StatCard icon="solar:close-circle-bold-duotone" value={stats.rejected} label="Refusés"    color="bg-red-100 text-red-600 dark:bg-red-900/30" />
                </div>
            )}

            {/* Filtres */}
            <div className="flex flex-col sm:flex-row gap-3">
                {/* Recherche */}
                <div className="flex items-center gap-2 flex-1 bg-card border border-border rounded-xl px-3 h-10">
                    <Icon icon="solar:magnifer-bold-duotone" className="w-4 h-4 text-muted-foreground shrink-0" />
                    <input
                        value={search}
                        onChange={e => { setSearch(e.target.value); setPage(1); }}
                        placeholder="Rechercher un Live..."
                        className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                    />
                    {search && (
                        <button onClick={() => setSearch("")} className="text-muted-foreground hover:text-foreground">
                            <Icon icon="solar:close-circle-bold" className="w-4 h-4" />
                        </button>
                    )}
                </div>

                {/* Filtre statut */}
                <select
                    value={statusFilter}
                    onChange={e => { setStatusFilter(e.target.value as LiveStatus | ""); setPage(1); }}
                    className="h-10 px-3 rounded-xl border border-border bg-card text-sm focus:outline-none focus:border-primary transition min-w-[160px]"
                >
                    {STATUS_FILTER_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                </select>

                {/* Bouton accès feed public — navigation interne */}
                <button
                    onClick={() => router.push("/lives")}
                    className="h-10 px-4 rounded-xl border border-border bg-card text-sm font-semibold flex items-center gap-2 hover:bg-muted transition shrink-0"
                >
                    <Icon icon="solar:play-circle-bold-duotone" className="w-4 h-4 text-primary" />
                    Voir le feed
                </button>
            </div>

            {/* Loading */}
            {loading && (
                <div className="space-y-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="h-16 rounded-2xl bg-muted/40 animate-pulse" />
                    ))}
                </div>
            )}

            {/* Empty */}
            {!loading && lives.length === 0 && (
                <div className="py-16 flex flex-col items-center justify-center gap-4 bg-muted/20 rounded-3xl border-2 border-dashed border-border text-center px-6">
                    <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                        <Icon icon="solar:videocamera-bold-duotone" className="w-8 h-8 text-primary" />
                    </div>
                    <div>
                        <p className="font-black text-foreground text-sm">
                            {search || statusFilter ? "Aucun Live correspondant" : "Aucun Live publié"}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                            {search || statusFilter
                                ? "Essayez de modifier vos filtres."
                                : "Partagez vos vidéos TikTok, Instagram, Facebook ou YouTube pour promouvoir votre activité."}
                        </p>
                    </div>
                    {!search && !statusFilter && (
                        <Button className="bg-primary hover:bg-primary/90 rounded-xl h-10 font-black text-sm" onClick={openCreate}>
                            <Icon icon="solar:play-circle-bold-duotone" className="w-4 h-4 mr-2" />
                            Publier mon premier Live
                        </Button>
                    )}
                </div>
            )}

            {/* List */}
            {!loading && lives.length > 0 && (
                <div className="space-y-2">
                    {lives.map(live => {
                        const statusCfg = STATUS_CONFIG[live.status];
                        const src = detectSource(live.videoLink);
                        return (
                            <div key={live.id} className="flex items-center gap-3 p-3 rounded-2xl border border-border bg-card hover:bg-muted/30 transition group">
                                {/* Source icon */}
                                <div className="w-10 h-10 rounded-xl bg-zinc-900 flex items-center justify-center shrink-0">
                                    <Icon icon={src.icon} className="w-5 h-5 text-white" />
                                </div>

                                {/* Infos */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <p className="text-sm font-bold text-foreground truncate max-w-[180px] sm:max-w-none">
                                            {live.title}
                                        </p>
                                        {/* Statut */}
                                        <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${statusCfg.color}`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
                                            {statusCfg.label}
                                        </span>
                                        {/* Entité */}
                                        {live.entityType && (
                                            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                                                {ENTITY_LABELS[live.entityType]}
                                            </span>
                                        )}
                                        {/* Source */}
                                        <span className="text-[10px] text-muted-foreground hidden sm:flex items-center gap-1">
                                            <Icon icon={src.icon} className="w-3 h-3" /> {src.label}
                                        </span>
                                    </div>
                                    {/* Stats */}
                                    <div className="flex items-center gap-3 mt-1">
                                        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                            <Icon icon="solar:eye-bold-duotone" className="w-3 h-3" />
                                            {live.viewsCount.toLocaleString()}
                                        </span>
                                        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                            <Icon icon="solar:heart-bold" className="w-3 h-3" />
                                            {live.likesCount.toLocaleString()}
                                        </span>
                                        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                            <Icon icon="solar:share-bold-duotone" className="w-3 h-3" />
                                            {live.sharesCount.toLocaleString()}
                                        </span>
                                        <span className="text-[10px] text-muted-foreground hidden sm:block">
                                            {new Date(live.createdAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-1 shrink-0">
                                    <a
                                        href={live.videoLink}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="w-8 h-8 rounded-xl bg-muted flex items-center justify-center hover:bg-primary/10 hover:text-primary transition text-muted-foreground"
                                        title="Voir la vidéo"
                                        onClick={e => e.stopPropagation()}
                                    >
                                        <Icon icon="solar:link-bold-duotone" className="w-4 h-4" />
                                    </a>
                                    <button
                                        onClick={() => openEdit(live)}
                                        className="w-8 h-8 rounded-xl bg-muted flex items-center justify-center hover:bg-primary/10 hover:text-primary transition text-muted-foreground"
                                        title="Modifier"
                                    >
                                        <Icon icon="solar:pen-bold-duotone" className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(live.id)}
                                        disabled={deletingId === live.id}
                                        className="w-8 h-8 rounded-xl bg-muted flex items-center justify-center hover:bg-red-50 hover:text-red-500 transition text-muted-foreground disabled:opacity-50"
                                        title="Supprimer"
                                    >
                                        {deletingId === live.id
                                            ? <Icon icon="line-md:loading-twotone-loop" className="w-4 h-4" />
                                            : <Icon icon="solar:trash-bin-minimalistic-bold-duotone" className="w-4 h-4" />
                                        }
                                    </button>
                                </div>
                            </div>
                        );
                    })}

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="mt-4">
                            <TablePagination page={page} limit={limit} total={total} totalPages={totalPages} onPageChange={setPage} />
                        </div>
                    )}
                </div>
            )}

            {/* Modal Form */}
            <LiveFormModal
                isOpen={isFormOpen}
                onClose={() => { setIsFormOpen(false); setEditingLive(null); }}
                onSuccess={() => { setIsFormOpen(false); setEditingLive(null); fetchLives(); }}
                editingLive={editingLive}
            />
        </div>
    );
}
