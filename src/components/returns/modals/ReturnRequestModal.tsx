"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Icon } from "@iconify/react";
import { createPortal } from "react-dom";
import { createProductReturn } from "@/api/api";
import { useNotification } from "@/components/notifications/NotificationProvider";
import { OrderItem, ProductReturnReason } from "@/types/interface";

const REASONS: { value: ProductReturnReason; label: string; icon: string }[] = [
    { value: ProductReturnReason.DEFECTIVE, label: "Produit défectueux", icon: "solar:danger-bold-duotone" },
    { value: ProductReturnReason.WRONG_ITEM, label: "Mauvais article reçu", icon: "solar:close-square-bold-duotone" },
    { value: ProductReturnReason.NOT_AS_DESCRIBED, label: "Non conforme à la description", icon: "solar:document-text-bold-duotone" },
    { value: ProductReturnReason.DAMAGED_IN_TRANSIT, label: "Endommagé pendant le transport", icon: "solar:box-minimalistic-broken" },
    { value: ProductReturnReason.MISSING_PARTS, label: "Pièces manquantes", icon: "solar:widget-bold-duotone" },
    { value: ProductReturnReason.OTHER, label: "Autre motif", icon: "solar:menu-dots-bold-duotone" },
];

interface ReturnRequestModalProps {
    isOpen: boolean;
    onClose: () => void;
    orderId: string;
    item: OrderItem;
    onSuccess?: () => void;
}

export default function ReturnRequestModal({ isOpen, onClose, orderId, item, onSuccess }: ReturnRequestModalProps) {
    const { addNotification } = useNotification();
    const [reason, setReason] = useState<ProductReturnReason | "">("");
    const [description, setDescription] = useState("");
    const [files, setFiles] = useState<File[]>([]);
    const [submitting, setSubmitting] = useState(false);

    const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selected = Array.from(e.target.files || []);
        setFiles(prev => [...prev, ...selected].slice(0, 5));
    };

    const removeFile = (i: number) => setFiles(prev => prev.filter((_, idx) => idx !== i));

    const handleSubmit = async () => {
        if (!reason) { addNotification("Veuillez choisir un motif", "error"); return; }
        setSubmitting(true);
        try {
            const fd = new FormData();
            fd.append("orderId", orderId);
            fd.append("orderItemId", item.id);
            fd.append("reason", reason);
            if (description) fd.append("description", description);
            files.forEach(f => fd.append("files", f));

            const res = await createProductReturn(fd);
            if (res.statusCode === 201) {
                addNotification("Demande de retour envoyée", "success");
                onSuccess?.();
                onClose();
            } else {
                addNotification(res.message || "Erreur lors de l'envoi", "error");
            }
        } catch {
            addNotification("Une erreur est survenue", "error");
        } finally {
            setSubmitting(false);
        }
    };

    if (typeof document === "undefined") return null;

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        onClick={onClose} className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[1100]" />
                    <motion.div initial={{ y: "100%", opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: "100%", opacity: 0 }}
                        transition={{ type: "spring", damping: 30, stiffness: 300 }}
                        className="fixed inset-0 flex items-end md:items-center justify-center z-[1101] pointer-events-none">
                        <div className="bg-background w-full md:w-[90%] md:max-w-lg md:max-h-[90vh] md:rounded-3xl rounded-t-3xl h-[92dvh] md:h-auto overflow-hidden flex flex-col pointer-events-auto shadow-2xl">

                            {/* Header */}
                            <div className="flex items-center gap-3 px-5 py-4 border-b border-border shrink-0">
                                <button onClick={onClose} className="w-9 h-9 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 active:scale-90 transition-all">
                                    <Icon icon="solar:alt-arrow-left-bold-duotone" className="w-5 h-5" />
                                </button>
                                <div className="flex-1">
                                    <p className="text-[10px] font-black text-primary uppercase tracking-widest">SAV</p>
                                    <h2 className="text-base font-black text-foreground">Retourner l&apos;article</h2>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-5 space-y-5">
                                {/* Produit concerné */}
                                <div className="flex items-center gap-3 p-3 bg-muted/40 rounded-2xl border border-border/50">
                                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                                        <Icon icon="solar:box-bold-duotone" className="w-5 h-5 text-primary" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-black truncate">{item.product?.name || "Produit"}</p>
                                        <p className="text-[10px] text-muted-foreground">Qté: {item.quantity} · {(item.price * item.quantity).toLocaleString()} FCFA</p>
                                    </div>
                                </div>

                                {/* Motif */}
                                <div className="space-y-2">
                                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Motif du retour *</p>
                                    <div className="space-y-2">
                                        {REASONS.map(r => (
                                            <button key={r.value} onClick={() => setReason(r.value)}
                                                className={`w-full flex items-center gap-3 p-3 rounded-2xl border transition-all text-left ${reason === r.value ? "border-primary bg-primary/5 text-primary" : "border-border bg-muted/20 text-foreground hover:border-primary/40"}`}>
                                                <Icon icon={r.icon} className={`w-5 h-5 shrink-0 ${reason === r.value ? "text-primary" : "text-muted-foreground"}`} />
                                                <span className="text-sm font-bold">{r.label}</span>
                                                {reason === r.value && <Icon icon="solar:check-circle-bold-duotone" className="w-4 h-4 ml-auto text-primary" />}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Description */}
                                <div className="space-y-2">
                                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Description (optionnelle)</p>
                                    <textarea
                                        rows={3}
                                        placeholder="Décrivez le problème en détail..."
                                        value={description}
                                        onChange={e => setDescription(e.target.value)}
                                        className="w-full bg-muted/40 border border-border rounded-2xl p-3 text-sm resize-none focus:border-primary outline-none transition-all placeholder:text-muted-foreground"
                                    />
                                </div>

                                {/* Pièces justificatives */}
                                <div className="space-y-2">
                                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Photos / Vidéos (max 5)</p>
                                    <label className="flex items-center gap-2 p-3 border-2 border-dashed border-border rounded-2xl cursor-pointer hover:border-primary/50 transition-all">
                                        <Icon icon="solar:gallery-add-bold-duotone" className="w-5 h-5 text-muted-foreground" />
                                        <span className="text-sm text-muted-foreground">Ajouter des preuves</span>
                                        <input type="file" multiple accept="image/*,video/*" className="hidden" onChange={handleFiles} />
                                    </label>
                                    {files.length > 0 && (
                                        <div className="flex flex-wrap gap-2">
                                            {files.map((f, i) => (
                                                <div key={i} className="relative group">
                                                    <div className="w-16 h-16 rounded-xl bg-muted border border-border overflow-hidden flex items-center justify-center">
                                                        {f.type.startsWith("image/") ? (
                                                            // eslint-disable-next-line @next/next/no-img-element
                                                            (<img src={URL.createObjectURL(f)} alt="" className="w-full h-full object-cover" />)
                                                        ) : (
                                                            <Icon icon="solar:video-frame-bold-duotone" className="w-7 h-7 text-muted-foreground" />
                                                        )}
                                                    </div>
                                                    <button onClick={() => removeFile(i)} className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <Icon icon="solar:close-bold" className="w-3 h-3 text-white" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="p-5 border-t border-border shrink-0">
                                <button onClick={handleSubmit} disabled={submitting || !reason}
                                    className="w-full py-4 bg-primary text-white font-black text-sm rounded-2xl shadow-sm shadow-primary/20 hover:bg-secondary transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2">
                                    {submitting ? <Icon icon="line-md:loading-twotone-loop" className="w-5 h-5" /> : <Icon icon="solar:send-bold-duotone" className="w-5 h-5" />}
                                    Envoyer la demande
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>,
        document.body
    );
}
