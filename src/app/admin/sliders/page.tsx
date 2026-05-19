"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Search, Trash2, Edit2, GalleryVertical, Loader2, X, Image as ImageIcon } from "lucide-react";
import { getSlidersAdmin, createSlider, updateSlider, deleteSlider, toggleSliderStatus, toggleSliderActive } from "@/api/api";
import { Slider } from "@/types/interface";
import { toast } from "sonner";
import SliderForm from "@/components/admin/forms/SliderForm";
import { Switch } from "@/components/ui/switch";
import { useTranslation } from "@/utils/langue/hooks";

export default function AdminSlidersPage() {
    const { t } = useTranslation();
    const [sliders, setSliders] = useState<Slider[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentSlider, setCurrentSlider] = useState<Slider | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        fetchSliders();
    }, []);

    const fetchSliders = async () => {
        try {
            setLoading(true);
            const res = await getSlidersAdmin();
            if (res.data) {
                setSliders(res.data);
            }
        } catch (error) {
            toast.error(t("admin.sliders.error_load"));
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm(t("admin.sliders.confirm_delete"))) return;
        try {
            await deleteSlider(id);
            setSliders(sliders.filter(s => s.id !== id));
            toast.success(t("admin.sliders.success_delete"));
        } catch (error) {
            toast.error(t("common.error"));
        }
    };

    const handleSubmit = async (formData: FormData) => {
        try {
            setIsSubmitting(true);
            if (currentSlider?.id) {
                const res = await updateSlider(currentSlider.id, formData);
                if (res.data) {
                    setSliders(sliders.map(s => s.id === currentSlider.id ? res.data! : s));
                    toast.success(t("admin.sliders.success_update"));
                }
            } else {
                const res = await createSlider(formData);
                if (res.data) {
                    setSliders([res.data, ...sliders]);
                    toast.success(t("admin.sliders.success_create"));
                }
            }
            setIsModalOpen(false);
            setCurrentSlider(null);
        } catch (error) {
            toast.error(t("common.error"));
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleToggleStatus = async (id: string, value: boolean) => {
        try {
            await toggleSliderStatus(id, value);
            setSliders(sliders.map(s => s.id === id ? { ...s, status: value } : s));
            toast.success(t("admin.sliders.status_update_success"));
        } catch (error) {
            toast.error(t("common.error"));
        }
    };

    const handleToggleActive = async (id: string, value: boolean) => {
        try {
            await toggleSliderActive(id, value);
            setSliders(sliders.map(s => s.id === id ? { ...s, isActive: value } : s));
            toast.success(t("admin.sliders.active_update_success"));
        } catch (error) {
            toast.error(t("common.error"));
        }
    };

    const filteredSliders = sliders.filter(s =>
        s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const openAddModal = () => {
        setCurrentSlider(null);
        setIsModalOpen(true);
    };

    const openEditModal = (slider: Slider) => {
        setCurrentSlider(slider);
        setIsModalOpen(true);
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">{t("admin.sliders.title")}</h1>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">{t("admin.sliders.subtitle")}</p>
                </div>
                <button
                    onClick={openAddModal}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-primary text-white rounded-xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
                >
                    <Plus className="w-5 h-5" />
                    <span>{t("admin.sliders.new_slider")}</span>
                </button>
            </div>

            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
                <div className="p-4 border-b border-zinc-200 dark:border-zinc-800">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                        <input
                            type="text"
                            placeholder={t("admin.sliders.search_placeholder")}
                            className="w-full pl-10 pr-4 py-2 bg-zinc-50 dark:bg-zinc-800 border-none rounded-xl focus:ring-2 focus:ring-primary/20 transition-all text-sm outline-none"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                            <Loader2 className="w-8 h-8 text-primary animate-spin" />
                            <p className="text-sm text-zinc-500">{t("common.loading")}</p>
                        </div>
                    ) : filteredSliders.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                            <GalleryVertical className="w-12 h-12 text-zinc-300" />
                            <p className="text-zinc-500">{t("common.no_results")}</p>
                        </div>
                    ) : (
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-zinc-50 dark:bg-zinc-800/50 text-zinc-500 dark:text-zinc-400 text-xs font-semibold uppercase tracking-wider">
                                    <th className="px-6 py-4">{t("admin.videos.preview")}</th>
                                    <th className="px-6 py-4">{t("common.title")} / Description</th>
                                    <th className="px-6 py-4">{t("admin.sliders.status_admin")}</th>
                                    <th className="px-6 py-4">{t("admin.sliders.active_front")}</th>
                                    <th className="px-6 py-4">{t("common.date")}</th>
                                    <th className="px-6 py-4 text-right">{t("common.actions")}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                                {filteredSliders.map((slider) => (
                                    <tr key={slider.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="relative w-28 aspect-[21/9] rounded-lg overflow-hidden bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
                                                {slider.file?.fileUrl ? (
                                                    <img src={slider.file.fileUrl} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center">
                                                        <ImageIcon className="w-6 h-6 text-zinc-400" />
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-zinc-900 dark:text-white line-clamp-1">{slider.title}</span>
                                                <span className="text-xs text-zinc-500 line-clamp-1">{slider.description || t("admin.sliders.no_description")}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <Switch
                                                checked={slider.status}
                                                onCheckedChange={(val) => handleToggleStatus(slider.id, val)}
                                            />
                                        </td>
                                        <td className="px-6 py-4">
                                            <Switch
                                                checked={slider.isActive}
                                                onCheckedChange={(val) => handleToggleActive(slider.id, val)}
                                            />
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-xs text-zinc-500">{new Date(slider.createdAt).toLocaleDateString()}</span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => openEditModal(slider)}
                                                    className="p-2 text-zinc-400 hover:text-primary transition-colors hover:bg-primary/10 rounded-lg"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(slider.id)}
                                                    className="p-2 text-zinc-400 hover:text-red-500 transition-colors hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* Modal Ajout / Edition */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => !isSubmitting && setIsModalOpen(false)}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative w-full max-w-2xl bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl overflow-hidden"
                        >
                            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800">
                                <h3 className="font-bold text-lg">{currentSlider?.id ? t("admin.sliders.edit_slider") : t("admin.sliders.new_slider")}</h3>
                                <button
                                    disabled={isSubmitting}
                                    onClick={() => setIsModalOpen(false)}
                                    className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <SliderForm
                                initialData={currentSlider || {}}
                                onSubmit={handleSubmit}
                                onCancel={() => setIsModalOpen(false)}
                                isSubmitting={isSubmitting}
                            />
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
