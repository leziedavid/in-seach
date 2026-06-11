"use client";

import { useCallback, useEffect, useState } from "react";
import { adminGetLives, adminUpdateLive, adminDeleteLive, adminGetLiveStats } from "@/api/api";
import { Live, LiveStatus, LiveEntityType } from "@/types/interface";
import { useTranslation } from "@/utils/langue/hooks";
import { useNotification } from "@/components/notifications/NotificationProvider";
import { GenericTable } from "@/components/ui/table/table";
import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Icon } from "@iconify/react";
import { ExternalLink, Trash2, CheckCircle, XCircle, PauseCircle, Clock } from "lucide-react";

// ─── CONFIG ──────────────────────────────────────────────────────────────────

const STATUS_BADGE: Record<LiveStatus, { label: string; className: string }> = {
    [LiveStatus.DRAFT]:     { label: "Brouillon",  className: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 border-zinc-200" },
    [LiveStatus.PENDING]:   { label: "En attente", className: "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 border-amber-200 dark:border-amber-800" },
    [LiveStatus.PUBLISHED]: { label: "Publié",     className: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800" },
    [LiveStatus.REJECTED]:  { label: "Refusé",     className: "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300 border-red-200 dark:border-red-800" },
    [LiveStatus.SUSPENDED]: { label: "Suspendu",   className: "bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300 border-orange-200 dark:border-orange-800" },
};

const ENTITY_LABELS: Partial<Record<LiveEntityType, string>> = {
    [LiveEntityType.PRODUCT]:            "Produit",
    [LiveEntityType.SERVICE]:            "Service",
    [LiveEntityType.ANNONCE]:            "Annonce",
    [LiveEntityType.SERVICE_LOGISTIQUE]: "Logistique",
    [LiveEntityType.PROFILE]:            "Profil",
};

const PLATFORM_ICON: Record<string, string> = {
    tiktok:    "mdi:tiktok",
    youtube:   "mdi:youtube",
    facebook:  "mdi:facebook",
    instagram: "mdi:instagram",
    other:     "solar:link-bold-duotone",
};

function detectPlatform(url: string): string {
    if (url.includes("tiktok.com")) return "tiktok";
    if (url.includes("youtube.com") || url.includes("youtu.be")) return "youtube";
    if (url.includes("facebook.com") || url.includes("fb.watch")) return "facebook";
    if (url.includes("instagram.com")) return "instagram";
    return "other";
}

// ─── STAT CARD ───────────────────────────────────────────────────────────────

function StatCard({ icon, value, label, colorIcon, colorBg }: {
    icon: string; value: number; label: string; colorIcon: string; colorBg: string;
}) {
    return (
        <div className="flex items-center gap-4 p-5 rounded-2xl bg-card border border-border/50 shadow-xs">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${colorBg}`}>
                <Icon icon={icon} className={`w-5 h-5 ${colorIcon}`} />
            </div>
            <div>
                <p className="text-2xl font-black text-foreground leading-none">{value.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground mt-1 font-medium">{label}</p>
            </div>
        </div>
    );
}

// ─── PAGE ─────────────────────────────────────────────────────────────────────

export default function AdminLivesPage() {
    const { t } = useTranslation();
    const { addNotification } = useNotification();

    const [lives, setLives] = useState<Live[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [stats, setStats] = useState({ total: 0, published: 0, pending: 0, rejected: 0 });

    // Filtres
    const [statusFilter, setStatusFilter] = useState<LiveStatus | "">("");
    const [search, setSearch] = useState("");

    const limit = 15;

    // ─── FETCH ──────────────────────────────────────────────────────────────

    const fetchData = useCallback(async (p: number) => {
        setLoading(true);
        try {
            const [livesRes, statsRes] = await Promise.all([
                adminGetLives({ page: p, limit, status: statusFilter || undefined }),
                adminGetLiveStats(),
            ]);
            if (livesRes.statusCode === 200 && livesRes.data) {
                setLives(livesRes.data.data);
                setTotal(livesRes.data.total);
            }
            if (statsRes.statusCode === 200 && statsRes.data) {
                setStats(statsRes.data);
            }
        } catch {
            addNotification(t("admin.lives.error_load"), "error");
        } finally {
            setLoading(false);
        }
    }, [statusFilter, addNotification, t]);

    useEffect(() => { fetchData(page); }, [page, fetchData]);

    // ─── ACTIONS ────────────────────────────────────────────────────────────

    const handleAction = async (action: string, live: Live) => {
        if (action === "publish") {
            const res = await adminUpdateLive(live.id, { status: LiveStatus.PUBLISHED });
            if (res.statusCode === 200) { addNotification(t("admin.lives.success_update"), "success"); fetchData(page); }
        }
        if (action === "reject") {
            const res = await adminUpdateLive(live.id, { status: LiveStatus.REJECTED });
            if (res.statusCode === 200) { addNotification(t("admin.lives.success_update"), "success"); fetchData(page); }
        }
        if (action === "suspend") {
            const res = await adminUpdateLive(live.id, { status: LiveStatus.SUSPENDED });
            if (res.statusCode === 200) { addNotification(t("admin.lives.success_update"), "success"); fetchData(page); }
        }
        if (action === "pending") {
            const res = await adminUpdateLive(live.id, { status: LiveStatus.PENDING });
            if (res.statusCode === 200) { addNotification(t("admin.lives.success_update"), "success"); fetchData(page); }
        }
        if (action === "delete") {
            if (!confirm(t("admin.lives.confirm_delete"))) return;
            const res = await adminDeleteLive(live.id);
            if (res.statusCode === 200) { addNotification(t("admin.lives.success_delete"), "success"); fetchData(page); }
        }
        if (action === "view") {
            window.open(live.videoLink, "_blank", "noopener noreferrer");
        }
    };

    // ─── COLONNES ───────────────────────────────────────────────────────────

    const columns: ColumnDef<Live>[] = [
        {
            accessorKey: "title",
            header: t("admin.lives.col.video"),
            cell: ({ row }) => {
                const platform = detectPlatform(row.original.videoLink);
                return (
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-zinc-900 flex items-center justify-center shrink-0">
                            <Icon icon={PLATFORM_ICON[platform] ?? PLATFORM_ICON.other} className="w-5 h-5 text-white" />
                        </div>
                        <div className="min-w-0">
                            <div className="font-black text-sm line-clamp-1">{row.original.title}</div>
                            <div className="text-muted-foreground text-[10px] font-mono">
                                {row.original.id.substring(0, 8)}...
                            </div>
                        </div>
                    </div>
                );
            },
        },
        {
            accessorKey: "user",
            header: t("admin.lives.col.author"),
            cell: ({ row }) => {
                const name = row.original.user?.storeName || row.original.user?.companyName || row.original.user?.fullName || "—";
                return (
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-black text-primary border border-primary/20 shrink-0">
                            {name.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-xs font-bold truncate max-w-[120px]">{name}</span>
                    </div>
                );
            },
        },
        {
            accessorKey: "entityType",
            header: t("admin.lives.col.entity"),
            cell: ({ row }) => row.original.entityType ? (
                <Badge variant="outline" className="text-[10px] font-bold border-primary/30 text-primary">
                    {ENTITY_LABELS[row.original.entityType]}
                </Badge>
            ) : <span className="text-muted-foreground text-xs">—</span>,
        },
        {
            accessorKey: "viewsCount",
            header: t("admin.lives.col.stats"),
            cell: ({ row }) => (
                <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1 text-[11px] text-muted-foreground font-medium">
                        <Icon icon="solar:eye-bold-duotone" className="w-3.5 h-3.5" />
                        {row.original.viewsCount.toLocaleString()}
                    </span>
                    <span className="flex items-center gap-1 text-[11px] text-muted-foreground font-medium">
                        <Icon icon="solar:heart-bold" className="w-3.5 h-3.5" />
                        {row.original.likesCount.toLocaleString()}
                    </span>
                </div>
            ),
        },
        {
            accessorKey: "status",
            header: t("admin.lives.col.status"),
            cell: ({ row }) => {
                const cfg = STATUS_BADGE[row.original.status];
                return (
                    <Badge variant="outline" className={`font-black text-[9px] uppercase tracking-widest ${cfg.className}`}>
                        {cfg.label}
                    </Badge>
                );
            },
        },
        {
            accessorKey: "createdAt",
            header: t("common.date"),
            cell: ({ row }) => (
                <span className="text-xs text-muted-foreground font-medium">
                    {new Date(row.original.createdAt).toLocaleDateString()}
                </span>
            ),
        },
    ];

    // ─── RENDER ─────────────────────────────────────────────────────────────

    const STATUS_FILTERS = [
        { value: "",                    label: t("admin.lives.filter.all") },
        { value: LiveStatus.PENDING,    label: t("admin.lives.filter.pending") },
        { value: LiveStatus.PUBLISHED,  label: t("admin.lives.filter.published") },
        { value: LiveStatus.REJECTED,   label: t("admin.lives.filter.rejected") },
        { value: LiveStatus.SUSPENDED,  label: t("admin.lives.filter.suspended") },
        { value: LiveStatus.DRAFT,      label: t("admin.lives.filter.draft") },
    ];

    return (
        <div className="p-8 space-y-8 animate-in fade-in duration-500">

            {/* ── Header ── */}
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black tracking-tight mb-1">{t("admin.lives.title")}</h1>
                    <p className="text-muted-foreground font-medium text-sm">{t("admin.lives.subtitle")}</p>
                </div>
                <a
                    href="/lives"
                    className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl font-bold text-sm hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 shrink-0 w-fit"
                >
                    <Icon icon="solar:play-circle-bold-duotone" className="w-4 h-4" />
                    {t("admin.lives.view_feed")}
                </a>
            </header>

            {/* ── Stats ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard icon="solar:videocamera-bold-duotone" value={stats.total}     label={t("admin.lives.stats.total")}     colorIcon="text-primary"      colorBg="bg-primary/10" />
                <StatCard icon="solar:play-circle-bold-duotone" value={stats.published} label={t("admin.lives.stats.published")} colorIcon="text-emerald-600"  colorBg="bg-emerald-50 dark:bg-emerald-900/20" />
                <StatCard icon="solar:clock-circle-bold-duotone" value={stats.pending}  label={t("admin.lives.stats.pending")}   colorIcon="text-amber-600"    colorBg="bg-amber-50 dark:bg-amber-900/20" />
                <StatCard icon="solar:close-circle-bold-duotone" value={stats.rejected} label={t("admin.lives.stats.rejected")}  colorIcon="text-red-600"      colorBg="bg-red-50 dark:bg-red-900/20" />
            </div>

            {/* ── Filtre statut ── */}
            <div className="flex items-center gap-2 p-1 bg-muted rounded-xl w-fit flex-wrap">
                {STATUS_FILTERS.map(f => (
                    <button
                        key={f.value}
                        onClick={() => { setStatusFilter(f.value as LiveStatus | ""); setPage(1); }}
                        className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                            statusFilter === f.value ? "bg-card shadow-xs text-foreground" : "text-muted-foreground hover:text-foreground"
                        }`}
                    >
                        {f.label}
                    </button>
                ))}
            </div>

            {/* ── Table ── */}
            <div className="animate-in slide-in-from-bottom-2 duration-500">
                <div className="bg-card rounded-lg border border-border/50 shadow-xs overflow-hidden p-2">
                    <GenericTable
                        columns={columns}
                        data={lives}
                        loading={loading}
                        totalItems={total}
                        currentPage={page}
                        itemsPerPage={limit}
                        onPageChange={setPage}
                        searchKey="title"
                        actions={[
                            { icon: CheckCircle, label: "Publier",   value: "publish",  variant: "default" },
                            { icon: XCircle,     label: "Refuser",   value: "reject",   variant: "destructive" },
                            { icon: PauseCircle, label: "Suspendre", value: "suspend",  variant: "default" },
                            { icon: Clock,       label: "En attente",value: "pending",  variant: "default" },
                            { icon: ExternalLink,label: "Voir vidéo",value: "view",     variant: "default" },
                            { icon: Trash2,      label: t("common.delete"), value: "delete", variant: "destructive" },
                        ]}
                        onAction={handleAction}
                        emptyMessage={t("common.no_results")}
                    />
                </div>
            </div>
        </div>
    );
}
