"use client"

import React, { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { createPortal } from "react-dom"
import { Icon } from "@iconify/react"
import { Button } from "@/components/ui/button"
import { EasyDelivery, EasyDeliveryType, TypeEngin } from "@/types/interface"
import { useForm, SubmitHandler } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import Image from "next/image"

const ENGIN_LABELS: Record<TypeEngin, string> = {
    VELO: "Vélo",
    VOITURE: "Voiture",
    MOTO: "Moto",
    CAMION: "Camion",
}

const ENGIN_ICONS: Record<TypeEngin, string> = {
    VELO: "solar:bicycle-bold-duotone",
    VOITURE: "solar:car-bold-duotone",
    MOTO: "solar:scooter-bold-duotone",
    CAMION: "solar:delivery-bold-duotone",
}

const deliverySchema = z.object({
    companyName: z.string().min(2, "Le nom est trop court"),
    deliveryBasePrice: z.number().min(0, "Prix invalide"),
    deliveryOvertPrice: z.number().min(0, "Prix invalide"),
    type: z.nativeEnum(EasyDeliveryType),
    typeEngin: z.nativeEnum(TypeEngin),
    isActive: z.boolean(),
})

type DeliveryFormValues = z.infer<typeof deliverySchema>

interface Props {
    isOpen: boolean
    onClose: () => void
    initialData?: EasyDelivery
    onSave: (data: FormData) => void
    isLoading: boolean
}

export default function DeliverySettingsModal({ isOpen, onClose, initialData, onSave, isLoading }: Props) {
    const [mounted, setMounted] = useState(false)
    const [logoFile, setLogoFile] = useState<File | null>(null)
    const [logoPreview, setLogoPreview] = useState<string | null>(null)

    const { register, handleSubmit, setValue, watch, reset, formState: { errors }, } = useForm<DeliveryFormValues>({
        resolver: zodResolver(deliverySchema),
        defaultValues: {
            companyName: "",
            deliveryBasePrice: 0,
            deliveryOvertPrice: 0,
            type: EasyDeliveryType.PARTICULIER,
            typeEngin: TypeEngin.MOTO,
            isActive: true,
        },
    })

    const selectedType = watch("type")
    const selectedEngin = watch("typeEngin")

    useEffect(() => {
        setMounted(true)
    }, [])

    useEffect(() => {
        if (initialData) {
            reset({
                companyName: initialData.companyName || "",
                deliveryBasePrice: initialData.deliveryBasePrice || 0,
                deliveryOvertPrice: initialData.deliveryOvertPrice || 0,
                type: initialData.type,
                typeEngin: initialData.typeEngin,
                isActive: initialData.isActive,
            })
            setLogoPreview(initialData.deliveryLogo || null)
        }
    }, [initialData, reset, isOpen])

    const handleFormSubmit = (data: DeliveryFormValues) => {
        const formData = new FormData()
        Object.entries(data).forEach(([key, value]) => {
            formData.append(key, value.toString())
        })
        if (logoFile) {
            formData.append("files", logoFile)
        }
        onSave(formData)
    }

    if (!mounted) return null

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Overlay */}
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="hidden md:block fixed inset-0 bg-[#0F2944]/40 backdrop-blur-sm z-[1000]" />

                    {/* Modal */}
                    <motion.div initial={{ y: "100%", opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: "100%", opacity: 0 }} transition={{ type: "spring", damping: 30, stiffness: 300 }} className="fixed inset-0 flex items-end md:items-center justify-center z-[1001] pointer-events-none" >
                        <motion.div className="bg-[#FBFAF6] text-[#0F2944] overflow-hidden flex flex-col md:w-[90%] md:max-w-xl md:max-h-[85vh] md:rounded-3xl md:shadow-[0_8px_48px_rgba(15,41,68,0.16)] rounded-none w-full h-dvh md:h-auto pointer-events-auto">

                            {/* Drag handle mobile */}
                            <div className="flex justify-center pt-4 pb-2 md:hidden">
                                <div className="w-12 h-1.5 bg-muted rounded-full" />
                            </div>

                            {/* Header */}
                            <div className="sticky top-0 z-50 px-6 py-4 flex items-center gap-3 border-b bg-card/80 backdrop-blur-md">
                                <button onClick={onClose} className="p-2 bg-muted rounded-full hover:bg-muted/80 transition-colors">
                                    <Icon icon="solar:alt-arrow-left-bold-duotone" width={20} />
                                </button>
                                <div className="flex-1 text-center">
                                    <h2 className="text-lg font-black">Paramètres livraison</h2>
                                </div>
                            </div>

                            {/* Content */}
                            <form onSubmit={handleSubmit(handleFormSubmit)} className="flex-1 overflow-y-auto p-6 space-y-6">

                                {/* Logo Upload (Aligned with Store.tsx) */}
                                <div className="flex flex-col items-center gap-4">
                                    <div className="relative group">
                                        <div className="w-32 h-32 rounded-[2rem] bg-muted border-2 border-dashed border-border overflow-hidden flex items-center justify-center relative">
                                            {logoPreview ? (
                                                <Image
                                                    src={logoPreview}
                                                    alt="Logo preview"
                                                    fill
                                                    className="object-cover"
                                                    unoptimized />
                                            ) : (
                                                <Icon icon="solar:camera-bold-duotone" className="w-12 h-12 text-muted-foreground" />
                                            )}
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                <Icon icon="solar:gallery-edit-bold-duotone" className="w-8 h-8 text-white" />
                                            </div>
                                            <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => { const file = e.target.files?.[0]; if (file) { setLogoFile(file); setLogoPreview(URL.createObjectURL(file)); } }} />
                                        </div>
                                        <p className="text-[10px] font-black text-center text-muted-foreground uppercase tracking-widest mt-2">Logo du service</p>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Nom / Société</label>
                                        <div className="relative">
                                            <Icon icon="solar:shop-bold-duotone" className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary" />
                                            <input {...register("companyName")} className="w-full h-14 pl-12 pr-4 rounded-2xl border border-border bg-muted/30 outline-none focus:border-primary transition-all font-bold text-sm" placeholder="Nom de votre service" />
                                        </div>
                                        {errors.companyName && <p className="text-[10px] text-destructive font-bold ml-1">{errors.companyName.message}</p>}
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Prix base</label>
                                            <input type="number" {...register("deliveryBasePrice", { valueAsNumber: true })} className="w-full h-12 px-4 rounded-xl border border-border bg-muted/30 outline-none focus:border-primary transition-all font-bold text-sm" placeholder="Ex: 500" />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Prix sup</label>
                                            <input type="number" {...register("deliveryOvertPrice", { valueAsNumber: true })} className="w-full h-12 px-4 rounded-xl border border-border bg-muted/30 outline-none focus:border-primary transition-all font-bold text-sm" placeholder="Ex: 100" />
                                        </div>
                                    </div>

                                    {/* Type */}
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Type de compte</label>
                                        <div className="flex gap-2">
                                            {[EasyDeliveryType.PARTICULIER, EasyDeliveryType.ENTREPRISE].map((t) => (
                                                <button type="button" key={t} onClick={() => setValue("type", t)} className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all ${selectedType === t ? "bg-primary text-white shadow-lg shadow-primary/20" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}>
                                                    {t}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Engins */}
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Moyen de transport</label>
                                        <div className="grid grid-cols-2 gap-2">
                                            {(Object.values(TypeEngin) as TypeEngin[]).map((engin) => (
                                                <button type="button" key={engin} onClick={() => setValue("typeEngin", engin)} className={`flex items-center gap-2 p-3 rounded-xl text-xs font-bold transition-all ${selectedEngin === engin ? "bg-primary text-white shadow-lg shadow-primary/20" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}>
                                                    <Icon icon={ENGIN_ICONS[engin]} className="w-5 h-5" />
                                                    {ENGIN_LABELS[engin]}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Footer Spacer */}
                                <div className="h-4" />
                            </form>

                            {/* Footer */}
                            <div className="p-6 border-t bg-card flex gap-3">
                                <Button type="button" onClick={onClose} variant="ghost" className="flex-1 h-12 rounded-2xl font-black uppercase text-xs tracking-widest">
                                    Annuler
                                </Button>
                                <Button onClick={handleSubmit(handleFormSubmit)} disabled={isLoading} className="flex-1 h-12 rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg shadow-primary/20">
                                    {isLoading ? <Icon icon="line-md:loading-twotone-loop" className="w-5 h-5" /> : "Enregistrer"}
                                </Button>
                            </div>

                        </motion.div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>,
        document.body
    );
}