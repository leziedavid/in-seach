"use client"

import React, { useState, useEffect } from "react"
import { Search, Trash2, Edit2, Loader2, X, Truck, User, CheckCircle2, AlertCircle } from "lucide-react"
import { adminGetDeliveryProfiles, adminDeleteDeliveryProfile, adminUpsertDeliveryProfile } from "@/api/api"
import { EasyDelivery, EasyDeliveryType, TypeEngin } from "@/types/interface"
import { toast } from "sonner"
import Image from "next/image"
import { TablePagination } from "@/components/ui/table/Pagination"
import DeliverySettingsModal from "@/components/delivery/sections/DeliverySettings"

const ENGIN_LABELS: Record<TypeEngin, string> = {
    VELO: "Vélo",
    VOITURE: "Voiture",
    MOTO: "Moto",
    CAMION: "Camion",
};

export default function AdminEasyDeliveryPage() {
    const [profiles, setProfiles] = useState<EasyDelivery[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")
    const [page, setPage] = useState(1)
    const [totalPages, setTotalPages] = useState(0)
    const [totalItems, setTotalItems] = useState(0)
    const limit = 10

    const [isEditModalOpen, setIsEditModalOpen] = useState(false)
    const [currentProfile, setCurrentProfile] = useState<EasyDelivery | null>(null)
    const [isUpdating, setIsUpdating] = useState(false)

    useEffect(() => {
        fetchProfiles()
    }, [page, searchQuery])

    const fetchProfiles = async () => {
        try {
            setLoading(true)
            const res = await adminGetDeliveryProfiles({ page, limit, search: searchQuery })
            if (res.data) {
                setProfiles(res.data.data)
                setTotalPages(res.data.totalPages)
                setTotalItems(res.data.total)
            }
        } catch (error) {
            toast.error("Erreur lors du chargement des profils")
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm("Êtes-vous sûr de vouloir supprimer ce profil de livraison ?")) return
        try {
            await adminDeleteDeliveryProfile(id)
            setProfiles(profiles.filter(p => p.id !== id))
            toast.success("Profil supprimé avec succès")
        } catch (error) {
            toast.error("Erreur lors de la suppression")
        }
    }

    const handleEdit = (profile: EasyDelivery) => {
        setCurrentProfile(profile)
        setIsEditModalOpen(true)
    }

    const handleSave = async (formData: FormData) => {
        if (!currentProfile) return
        try {
            setIsUpdating(true)
            const res = await adminUpsertDeliveryProfile(currentProfile.userId, formData)
            if (res.data) {
                toast.success("Profil mis à jour par l'administrateur")
                fetchProfiles()
                setIsEditModalOpen(false)
            }
        } catch (error) {
            toast.error("Erreur lors de la mise à jour")
        } finally {
            setIsUpdating(false)
        }
    }

    return (
        <div className="p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Gestion Easy-Delivery</h1>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">Gérez tous les profils de livreurs de la plateforme</p>
                </div>
            </div>

            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
                <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex flex-col md:flex-row gap-4 items-center justify-between">
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                        <input
                            type="text"
                            placeholder="Rechercher par nom, entreprise, email..."
                            className="w-full pl-10 pr-4 py-2 bg-zinc-50 dark:bg-zinc-800 border-none rounded-xl focus:ring-2 focus:ring-primary/20 transition-all text-sm"
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value)
                                setPage(1)
                            }}
                        />
                    </div>
                    <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                        {totalItems} Profils au total
                    </div>
                </div>

                <div className="overflow-x-auto">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                            <Loader2 className="w-8 h-8 text-primary animate-spin" />
                            <p className="text-sm text-zinc-500">Chargement des profils...</p>
                        </div>
                    ) : profiles.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                            <Truck className="w-12 h-12 text-zinc-300" />
                            <p className="text-zinc-500">Aucun profil trouvé</p>
                        </div>
                    ) : (
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-zinc-50 dark:bg-zinc-800/50 text-zinc-500 dark:text-zinc-400 text-xs font-semibold uppercase tracking-wider">
                                    <th className="px-6 py-4">Livreur</th>
                                    <th className="px-6 py-4">Type / Engin</th>
                                    <th className="px-6 py-4">Tarification</th>
                                    <th className="px-6 py-4">Statut</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                                {profiles.map((profile) => (
                                    <tr key={profile.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="relative w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/10 overflow-hidden">
                                                    {profile.deliveryLogo ? (
                                                        <Image src={profile.deliveryLogo} alt="" fill className="object-cover" />
                                                    ) : (
                                                        <User className="w-5 h-5 text-primary" />
                                                    )}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-sm font-bold text-zinc-900 dark:text-white truncate">
                                                        {profile.user?.fullName || "Utilisateur"}
                                                    </p>
                                                    <p className="text-[10px] text-zinc-500 truncate uppercase font-black">
                                                        {profile.companyName || "Indépendant"}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1">
                                                <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                                                    {profile.type === EasyDeliveryType.ENTREPRISE ? "Collectif" : "Individuel"}
                                                </span>
                                                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-tighter">
                                                    {profile.typeEngin ? ENGIN_LABELS[profile.typeEngin] : "N/A"}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-primary">
                                                    {profile.deliveryBasePrice?.toLocaleString() || 0} FCFA
                                                </span>
                                                <span className="text-[10px] text-zinc-500">
                                                    Base + {profile.deliveryOvertPrice?.toLocaleString() || 0} / km
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {profile.isActive ? (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-500 text-[10px] font-bold">
                                                    <CheckCircle2 className="w-3 h-3" />
                                                    Actif
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-700 dark:bg-zinc-500/10 dark:text-zinc-500 text-[10px] font-bold">
                                                    <AlertCircle className="w-3 h-3" />
                                                    Inactif
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handleEdit(profile)}
                                                    className="p-2 text-zinc-400 hover:text-primary transition-colors hover:bg-primary/10 rounded-lg"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(profile.id)}
                                                    className="p-2 text-zinc-400 hover:text-red-500 transition-colors hover:bg-red-50 rounded-lg"
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

                {totalPages > 1 && (
                    <div className="p-4 border-t border-zinc-200 dark:border-zinc-800">
                        <TablePagination
                            page={page}
                            limit={limit}
                            total={totalItems}
                            totalPages={totalPages}
                            onPageChange={setPage}
                        />
                    </div>
                )}
            </div>

            {isEditModalOpen && currentProfile && (
                <DeliverySettingsModal
                    isOpen={isEditModalOpen}
                    onClose={() => setIsEditModalOpen(false)}
                    initialData={currentProfile}
                    onSave={handleSave}
                    isLoading={isUpdating}
                />
            )}
        </div>
    )
}
