"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { getMyProducts, createProduct, updateProduct, deleteProduct, handleToggleProductActive, getStoreUserInfo, updateStoreNameLogo } from "@/api/api"
import { Product, StoreUserInfo } from "@/types/interface"
import Image from "next/image"
import ProductCard from "@/components/products/cards/ProductCard"
import { Icon } from "@iconify/react"
import { QRCodeCanvas } from "qrcode.react"
import { useNotification } from "@/components/notifications/NotificationProvider"
import { Modal } from "@/components/ui/MotionModal"
import FormsProduit from "@/components/products/forms/FormsProduit"
import { useSubscriptionCheck } from "@/hooks/useSubscriptionCheck"
import NotFound from "@/components/common/NotFound"
import VoiceSearchModal from "@/components/services/sections/VoiceSearchModal"
import { SectionHeader } from "@/components/shared/SectionHeader"

import InfiniteScroll from "@/components/ui/InfiniteScroll"
import CreateButton from "@/components/ui/CreateButton"
import LiveFormModal from "@/components/lives/LiveFormModal"
import { LiveEntityType } from "@/types/interface"

const ITEMS_PER_PAGE = 10

export default function Store() {

    const [search, setSearch] = useState("")
    const [products, setProducts] = useState<Product[]>([])
    const [page, setPage] = useState(1)
    const [hasMore, setHasMore] = useState(true)
    const [loading, setLoading] = useState(false)
    const [total, setTotal] = useState(0)

    // Product Management State
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isEditing, setIsEditing] = useState(false)
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false)
    const { addNotification } = useNotification()
    const { checkEligibility, loading: checkLoading } = useSubscriptionCheck()

    // Live Modal State
    const [isLiveModalOpen, setIsLiveModalOpen] = useState(false)
    const [liveEntityId, setLiveEntityId] = useState<string | undefined>(undefined)
    const [liveEntityLabel, setLiveEntityLabel] = useState<string | undefined>(undefined)

    // Store Info State
    const [storeInfo, setStoreInfo] = useState<StoreUserInfo | null>(null)
    const [isStoreModalOpen, setIsStoreModalOpen] = useState(false)
    const [newStoreName, setNewStoreName] = useState("")
    const [storeLogoFile, setStoreLogoFile] = useState<File | null>(null)
    const [storeLogoPreview, setStoreLogoPreview] = useState<string | null>(null)
    const [isStoreUpdating, setIsStoreUpdating] = useState(false)
    const [copied, setCopied] = useState(false);

    const slugify = (name: string) => {
        return name
            .trim()
            .replace(/\s+/g, "-")        // remplace les espaces par -
            .replace(/[^\w\-]+/g, "")    // supprime les caractères spéciaux
    }

    const handleCopy = async (url: string) => {
        try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            addNotification("Lien copié !", "success");
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            addNotification("Erreur lors de la copie", "error");
        }
    };

    const fetchStoreInfo = useCallback(async () => {
        try {
            const res = await getStoreUserInfo()
            if (res.statusCode === 200 && res.data) {
                setStoreInfo(res.data)
                setNewStoreName(res.data.storeName || "")
            }
        } catch (error) {
            console.error("Error fetching store info:", error)
        }
    }, [])

    useEffect(() => {
        fetchStoreInfo()
    }, [fetchStoreInfo])

    const handleUpdateStore = async () => {
        if (!newStoreName.trim()) {
            addNotification("Le nom de la boutique est requis", "error")
            return
        }

        setIsStoreUpdating(true)
        try {
            const formData = new FormData()
            formData.append("storeName", newStoreName)
            if (storeLogoFile) {
                formData.append("files", storeLogoFile)
            }

            const res = await updateStoreNameLogo(formData)
            if (res.statusCode === 200 || res.statusCode === 201) {
                addNotification("Boutique mise à jour avec succès", "success")
                setIsStoreModalOpen(false)
                fetchStoreInfo()
            } else {
                addNotification(res.message || "Erreur lors de la mise à jour", "error")
            }
        } catch (error) {
            console.error("Error updating store:", error)
            addNotification("Une erreur est survenue", "error")
        } finally {
            setIsStoreUpdating(false)
        }
    }

    // Handlers
    const handleFormSubmit = async (formData: FormData) => {
        setIsSubmitting(true)
        try {
            let res;
            if (isEditing && selectedProduct) {
                res = await updateProduct(selectedProduct.id, formData)
            } else {
                res = await createProduct(formData)
            }

            if (res.statusCode === 200 || res.statusCode === 201) {
                addNotification(isEditing ? "Produit mis à jour" : "Produit créé", "success")
                setIsModalOpen(false)
                setIsEditing(false)
                setSelectedProduct(null)
                fetchProducts(1, true)
            } else {
                addNotification(res.message || "Une erreur est survenue", "error")
            }
        } catch (error) {
            console.error("Error submitting product:", error)
            addNotification("Erreur lors de l'enregistrement", "error")
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleDeleteProduct = async (id: string) => {
        try {
            const res = await deleteProduct(id)
            if (res.statusCode === 200) {
                addNotification("Produit supprimé", "success")
                fetchProducts(1, true)
            } else {
                addNotification(res.message || "Erreur lors de la suppression", "error")
            }
        } catch (error) {
            console.error("Error deleting product:", error)
            addNotification("Erreur lors de la suppression", "error")
        }
    }

    const handleToggleStatus = async (product: Product, value: boolean) => {
        try {
            const res = await handleToggleProductActive(product.id, value)
            if (res.statusCode === 200) {
                addNotification(res.message || "Statut mis à jour", "success")
                fetchProducts(1, true)
            } else {
                addNotification(res.message || "Erreur lors de la mise à jour", "error")
            }
        } catch (error) {
            console.error("Error toggling product status:", error)
            addNotification("Erreur lors de la mise à jour", "error")
        }
    }

    const openCreateModal = async () => {
        const canCreate = await checkEligibility('Product')
        if (canCreate) {
            setIsEditing(false)
            setSelectedProduct(null)
            setIsModalOpen(true)
        }
    }

    const openLiveModal = (product?: Product) => {
        setLiveEntityId(product?.id)
        setLiveEntityLabel(product?.name)
        setIsLiveModalOpen(true)
    }

    const openEditModal = (product: Product) => {
        setIsEditing(true)
        setSelectedProduct(product)
        setIsModalOpen(true)
    }

    const handleVoiceResult = (text: string) => {
        setSearch(text)
    }

    const fetchProducts = useCallback(async (pageNum: number, isNewSearch: boolean) => {
        if (loading) return
        setLoading(true)

        try {
            const res = await getMyProducts({
                page: pageNum,
                limit: ITEMS_PER_PAGE,
                query: search || undefined,
            })

            if (res.statusCode === 200 && res.data) {
                const newProducts = res.data.data
                setProducts(prev => isNewSearch ? newProducts : [...prev, ...newProducts])
                setHasMore(pageNum < res.data.totalPages)
                setTotal(res.data.total)
            } else {
                setHasMore(false)
            }
        } catch (error) {
            console.error("Error fetching products:", error)
            setHasMore(false)
        } finally {
            setLoading(false)
        }
    }, [search])

    // Load more when page changes (infinite scroll)
    useEffect(() => {
        if (page > 1) {
            fetchProducts(page, false)
        }
    }, [page, fetchProducts])

    // Reset and fetch when filters change
    useEffect(() => {
        setPage(1)
        fetchProducts(1, true)
    }, [search, fetchProducts])

    return (
        <div className="flex flex-col items-center w-full max-w-7xl mx-auto px-4 py-2">
            {/* Action Bar */}
            <div className="flex flex-col items-center w-full max-w-7xl mx-auto px-4 py-2">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4 w-full max-w-4xl mb-6">

                    {/* Zone recherche - cachée en mobile */}
                    <div className="hidden md:flex flex-col gap-1 flex-1">
                    </div>

                    {/* Boutons */}
                    <div className="flex flex-col md:flex-row w-full md:w-auto gap-2 md:gap-4">

                        <div className="w-full md:min-w-[240px]">
                            <CreateButton
                                label="Publier un article"
                                loading={checkLoading}
                                onClick={openCreateModal}
                            />
                        </div>

                        <div className="w-full md:min-w-[200px]">
                            <CreateButton
                                label="Créer un Live"
                                icon="solar:play-circle-bold-duotone"
                                onClick={() => openLiveModal()}
                            />
                        </div>
                    </div>

                </div>
            </div>

            <SectionHeader
                // title="Vendez ou revendez vos produits"
                title="La vente en ligne n'a jamais été aussi facile"
                subtitle="Montez votre boutique en ligne en quelques clics et bénéficiez de tous les outils essentiels pour reussir dans l'e-commerce : ,
                Achetez, vendez ou échangez tous types de produits d'occasion en toute simplicité"
                className="mb-8"
            />



            {/* Store Information Section */}
            <div className="w-full max-w-4xl mx-auto mb-2 px-0 md:px-4">
                <div className="group bg-card border-b p-6  flex items-center justify-between gap-6">

                    <div className="flex items-center gap-4 md:gap-6">
                        <div className="relative w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border border-primary/10 overflow-hidden shrink-0">
                            {storeInfo?.storeLogo ? (
                                <Image src={storeInfo.storeLogo} alt={storeInfo.storeName || "Boutique"} fill className="object-cover" unoptimized />
                            ) : (
                                <Icon icon="solar:shop-bold-duotone" className="w-8 h-8 md:w-10 md:h-10 text-primary" />
                            )}
                        </div>

                        <div className="space-y-1">
                            <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-1">Ma Boutique Pro</p>
                            <h3 className="text-xl md:text-2xl font-black text-foreground uppercase tracking-tight leading-none truncate max-w-[150px] md:max-w-md">
                                {storeInfo?.storeName || "Ma Boutique"}
                            </h3>
                            <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-4">
                                <p className="text-[10px] text-muted-foreground font-bold flex items-center gap-2 uppercase tracking-widest">
                                    <Icon icon="solar:user-bold-duotone" className="w-3 h-3 text-primary" />
                                    {storeInfo?.fullName || "Gérant"}
                                </p>
                                {storeInfo?.phone && (
                                    <p className="text-[10px] text-muted-foreground font-bold flex items-center gap-2 uppercase tracking-widest">
                                        <Icon icon="solar:phone-bold-duotone" className="w-3 h-3 text-primary" />
                                        {storeInfo.phone}
                                    </p>
                                )}
                            </div>
                        </div>

                    </div>


                    <div className="flex items-center gap-2">

                        <button onClick={() => handleCopy(`${process.env.NEXT_PUBLIC_BASE_URL}/shop/${slugify(storeInfo?.storeName || "")}`)} className="w-8 h-8 md:w-10 md:h-10 rounded-2xl bg-muted flex items-center justify-center hover:bg-primary/20 hover:text-primary transition-all active:scale-90 shrink-0">
                            {copied ? <Icon icon="solar:check-circle-bold-duotone" className="w-5 h-5 md:w-6 md:h-6" /> : <Icon icon="solar:share-bold-duotone" className="w-5 h-5 md:w-6 md:h-6" />}
                        </button>

                        <button onClick={() => {
                            setNewStoreName(storeInfo?.storeName || "")
                            setStoreLogoPreview(storeInfo?.storeLogo || null)
                            setIsStoreModalOpen(true)
                        }}
                            className="w-8 h-8 md:w-10 md:h-10 rounded-2xl bg-muted flex items-center justify-center hover:bg-primary/20 hover:text-primary transition-all active:scale-90 shrink-0">
                            <Icon icon="solar:pen-bold-duotone" className="w-5 h-5 md:w-6 md:h-6" />
                        </button>

                    </div>

                </div>
            </div>


            {/* QR Code Section */}
            {storeInfo?.id && (
                <QRCodeSection storeInfo={storeInfo} />
            )}

            <div className="flex flex-col w-full max-w-4xl mx-auto px-0 md:px-4 py-2">
                <div className="flex items-center justify-between w-full px-2 md:px-0 mb-6 border-b border-border pb-4">
                    <h3 className="text-lg font-black text-foreground">
                        {loading && products.length === 0 ? 'Chargement...' : products.length === 0 ? 'Ma Boutique' : `Mes Produits (${total})`}
                    </h3>
                </div>

                <div className="flex w-full bg-card border border-border rounded-xl px-4 py-2.5 shadow-sm focus-within:border-primary transition-all mb-4">
                    <Icon icon="solar:magnifer-bold-duotone" className="w-5 h-5 text-muted-foreground mr-3 flex-shrink-0" />
                    <input type="text" placeholder="Rechercher dans mes produits..." className="flex-1 bg-transparent text-foreground outline-none text-sm placeholder:text-muted-foreground" value={search} onChange={(e) => setSearch(e.target.value)} />
                    <button type="button" onClick={() => setIsVoiceModalOpen(true)} className="p-1 text-muted-foreground hover:text-primary transition-colors hover:scale-110 active:scale-90" title="Recherche vocale" >
                        <Icon icon="solar:microphone-bold-duotone" className="w-5 h-5" />
                    </button>
                </div>
                <InfiniteScroll
                    items={products}
                    hasMore={hasMore}
                    isLoading={loading}
                    loadMore={() => setPage(prev => prev + 1)}
                    skeletonType="product"
                    skeletonCount={3}
                    gridClassName="grid grid-cols-2 gap-2 md:grid-cols-3 md:gap-6"
                    renderItem={(product) => (
                        <ProductCard
                            key={product.id}
                            product={product}
                            onEdit={openEditModal}
                            onDelete={handleDeleteProduct}
                            onStatusChange={handleToggleStatus}
                            onCreateLive={(p) => openLiveModal(p)}
                            storeNames={storeInfo?.storeName || ""}
                        />
                    )}
                    className="w-full"
                />
            </div>

            {/* Product Form Modal */}
            <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setIsEditing(false); setSelectedProduct(null); }}>
                <div className="p-4 md:p-0">
                    <div className="mb-6 md:mb-8 md:p-6 md:pb-0">
                        <h2 className="text-xl md:text-2xl font-black flex items-center gap-3">
                            <div className="p-2 bg-primary/10 rounded-xl">
                                <Icon icon={isEditing ? "solar:pen-new-square-bold-duotone" : "solar:add-square-bold-duotone"} className="text-primary w-6 h-6" />
                            </div>
                            {isEditing ? 'Modifier le produit' : 'Nouveau produit'}
                        </h2>
                        <p className="text-sm text-muted-foreground mt-1 ml-14">
                            {isEditing ? 'Mettez à jour les informations de votre article' : 'Remplissez les détails pour ajouter un nouvel article à votre boutique'}
                        </p>
                    </div>

                    <FormsProduit
                        initialData={selectedProduct || undefined}
                        onSubmit={handleFormSubmit}
                        isSubmitting={isSubmitting}
                        isEditMode={isEditing}
                        isOpen={isModalOpen}
                        onClose={() => setIsModalOpen(false)}
                    />
                </div>
            </Modal>

            <VoiceSearchModal
                isOpen={isVoiceModalOpen}
                onClose={() => setIsVoiceModalOpen(false)}
                onResult={handleVoiceResult}
            />

            {/* Store Update Modal */}
            <Modal isOpen={isStoreModalOpen} onClose={() => setIsStoreModalOpen(false)} >
                <div className="p-6 space-y-6">
                    <div className="flex flex-col items-center gap-4">
                        <div className="relative group">
                            <div className="w-32 h-32 rounded-[2rem] bg-muted border-2 border-dashed border-border overflow-hidden flex items-center justify-center relative">
                                {storeLogoPreview ? (
                                    <Image src={storeLogoPreview} alt="Logo preview" fill className="object-cover" unoptimized />
                                ) : (
                                    <Icon icon="solar:camera-bold-duotone" className="w-12 h-12 text-muted-foreground" />
                                )}
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <Icon icon="solar:gallery-edit-bold-duotone" className="w-8 h-8 text-white" />
                                </div>
                                <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => { const file = e.target.files?.[0]; if (file) { setStoreLogoFile(file); setStoreLogoPreview(URL.createObjectURL(file)); } }} />

                            </div>
                            <p className="text-[10px] font-black text-center text-muted-foreground uppercase tracking-widest mt-2">Logo de la boutique</p>
                        </div>

                        <div className="w-full space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Nom de la boutique</label>
                                <div className="relative">
                                    <Icon icon="solar:shop-bold-duotone" className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary" />
                                    <input type="text" placeholder="Ex: Ma Super Boutique" className="w-full bg-muted/50 border border-border rounded-2xl py-4 pl-12 pr-4 text-sm font-black focus:border-primary outline-none transition-all" value={newStoreName} onChange={(e) => setNewStoreName(e.target.value)} />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button onClick={() => setIsStoreModalOpen(false)} className="flex-1 py-4 rounded-2xl font-black text-xs uppercase tracking-widest bg-muted hover:bg-muted/80 transition-all">Annuler</button>
                        <button onClick={handleUpdateStore} disabled={isStoreUpdating} className="flex-1 py-4 rounded-2xl font-black text-xs uppercase tracking-widest bg-primary text-white shadow-lg shadow-primary/20 hover:bg-secondary transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                            {isStoreUpdating ? <Icon icon="line-md:loading-twotone-loop" className="w-5 h-5" /> : <Icon icon="solar:check-read-bold" className="w-5 h-5" />}
                            Enregistrer
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Live Form Modal */}
            <LiveFormModal
                isOpen={isLiveModalOpen}
                onClose={() => { setIsLiveModalOpen(false); setLiveEntityId(undefined); setLiveEntityLabel(undefined); }}
                onSuccess={() => { setIsLiveModalOpen(false); setLiveEntityId(undefined); setLiveEntityLabel(undefined); }}
                defaultEntityType={LiveEntityType.PRODUCT}
                defaultEntityId={liveEntityId}
                lockedEntity={!!liveEntityId}
                entityLabel={liveEntityLabel}
            />
        </div>
    )
}

// ─── QR Code Section ───────────────────────────────────────────────────────────

// Couleur secondary du projet (hsl(195, 69%, 27%))
const SECONDARY_HEX = "#0D4D6E"

function QRCodeSection({ storeInfo }: { storeInfo: StoreUserInfo }) {
    const { addNotification } = useNotification()
    const [baseUrl, setBaseUrl] = useState("")
    const [open, setOpen] = useState(false)

    useEffect(() => {
        setBaseUrl(typeof window !== "undefined" ? window.location.origin : "")
    }, [])

    const qrUrl = baseUrl ? `${baseUrl}/qr/store/${storeInfo.id}` : ""
    const storeName = storeInfo.storeName || "Ma Boutique"
    const logoSrc = storeInfo.storeLogo || "/logo.png"

    // Canvas Wave-style : fond secondary plein, encadré blanc avec QR noir centré
    const buildWaveCanvas = async (): Promise<HTMLCanvasElement | null> => {
        const qrCanvas = document.getElementById("store-qr-canvas") as HTMLCanvasElement | null
        if (!qrCanvas) return null

        const W = 600
        const H = 800
        const c = document.createElement("canvas")
        c.width = W; c.height = H
        const ctx = c.getContext("2d")
        if (!ctx) return null

        // ── Fond secondary plein ──
        ctx.fillStyle = SECONDARY_HEX
        ctx.fillRect(0, 0, W, H)

        // ── Logo (cercle blanc) ──
        const logoSize = 80
        const logoX = W / 2 - logoSize / 2
        const logoY = 60
        ctx.save()
        ctx.beginPath()
        ctx.arc(W / 2, logoY + logoSize / 2, logoSize / 2 + 6, 0, Math.PI * 2)
        ctx.fillStyle = "rgba(255,255,255,0.2)"
        ctx.fill()
        ctx.restore()

        // Charger et dessiner le logo
        await new Promise<void>((resolve) => {
            const img = new window.Image()
            img.crossOrigin = "anonymous"
            img.onload = () => {
                ctx.save()
                ctx.beginPath()
                ctx.arc(W / 2, logoY + logoSize / 2, logoSize / 2, 0, Math.PI * 2)
                ctx.closePath()
                ctx.clip()
                ctx.drawImage(img, logoX, logoY, logoSize, logoSize)
                ctx.restore()
                resolve()
            }
            img.onerror = () => resolve()
            img.src = logoSrc
        })

        // ── Nom de la boutique ──
        ctx.fillStyle = "#ffffff"
        ctx.font = "bold 32px 'Segoe UI', Arial, sans-serif"
        ctx.textAlign = "center"
        ctx.textBaseline = "middle"
        // Tronquer si trop long
        let displayName = storeName.toUpperCase()
        while (ctx.measureText(displayName).width > W - 80 && displayName.length > 3) {
            displayName = displayName.slice(0, -1)
        }
        if (displayName !== storeName.toUpperCase()) displayName += "…"
        ctx.fillText(displayName, W / 2, logoY + logoSize + 36)

        // ── Encadré blanc pour QR ──
        const qrBoxSize = 340
        const qrBoxX = (W - qrBoxSize) / 2
        const qrBoxY = logoY + logoSize + 80
        const radius = 24
        ctx.beginPath()
        ctx.moveTo(qrBoxX + radius, qrBoxY)
        ctx.lineTo(qrBoxX + qrBoxSize - radius, qrBoxY)
        ctx.quadraticCurveTo(qrBoxX + qrBoxSize, qrBoxY, qrBoxX + qrBoxSize, qrBoxY + radius)
        ctx.lineTo(qrBoxX + qrBoxSize, qrBoxY + qrBoxSize - radius)
        ctx.quadraticCurveTo(qrBoxX + qrBoxSize, qrBoxY + qrBoxSize, qrBoxX + qrBoxSize - radius, qrBoxY + qrBoxSize)
        ctx.lineTo(qrBoxX + radius, qrBoxY + qrBoxSize)
        ctx.quadraticCurveTo(qrBoxX, qrBoxY + qrBoxSize, qrBoxX, qrBoxY + qrBoxSize - radius)
        ctx.lineTo(qrBoxX, qrBoxY + radius)
        ctx.quadraticCurveTo(qrBoxX, qrBoxY, qrBoxX + radius, qrBoxY)
        ctx.closePath()
        ctx.fillStyle = "#ffffff"
        ctx.fill()

        // ── QR noir centré dans l'encadré ──
        const qrPad = 24
        const qrSize = qrBoxSize - qrPad * 2
        ctx.drawImage(qrCanvas, qrBoxX + qrPad, qrBoxY + qrPad, qrSize, qrSize)

        // ── Tagline ──
        ctx.fillStyle = "rgba(255,255,255,0.85)"
        ctx.font = "600 18px 'Segoe UI', Arial, sans-serif"
        ctx.textAlign = "center"
        ctx.fillText("Scannez pour découvrir notre boutique", W / 2, qrBoxY + qrBoxSize + 48)

        return c
    }

    const handleDownload = async () => {
        const canvas = await buildWaveCanvas()
        if (!canvas) return
        const link = document.createElement("a")
        link.download = `qr-boutique-${storeName.replace(/\s+/g, "-").toLowerCase()}.png`
        link.href = canvas.toDataURL("image/png")
        link.click()
        addNotification("QR Code téléchargé", "success")
    }

    const handlePrint = async () => {
        const canvas = await buildWaveCanvas()
        if (!canvas) return
        const dataUrl = canvas.toDataURL("image/png")
        const win = window.open("", "_blank")
        if (!win) return
        win.document.write(`<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8"/>
  <title>QR Code – ${storeName}</title>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; -webkit-print-color-adjust:exact !important; print-color-adjust:exact !important; }
    body { background:#e0e0e0; display:flex; align-items:center; justify-content:center; min-height:100vh; }
    img { width:420px; height:560px; object-fit:contain; border-radius:20px; box-shadow:0 8px 40px rgba(0,0,0,0.18); display:block; }
    @media print { body { background:#fff; } img { box-shadow:none; } }
  </style>
</head>
<body>
  <img src="${dataUrl}" alt="QR Code ${storeName}" />
  <script>window.onload=()=>{ window.print(); }<\/script>
</body>
</html>`)
        win.document.close()
    }

    if (!qrUrl) return null

    return (
        <div className="w-full mb-2">
            <div className="bg-card border-b">

                {/* ── Accordéon trigger ── */}
                <button onClick={() => setOpen(prev => !prev)} className="w-full flex items-center justify-between gap-3 px-4 md:px-6 py-5 hover:bg-muted/40 transition-colors">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-xl shrink-0">
                            <Icon icon="solar:qr-code-bold-duotone" className="w-5 h-5 text-primary" />
                        </div>
                        <div className="text-left">
                            <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Affichage physique</p>
                            <h3 className="text-base font-black text-foreground">QR Code de votre boutique</h3>
                        </div>
                    </div>
                    <Icon icon="solar:alt-arrow-down-bold-duotone" className={`w-5 h-5 text-muted-foreground transition-transform duration-300 shrink-0 ${open ? "rotate-180" : ""}`} />
                </button>

                {/* ── Contenu accordéon ── */}
                {open && (
                    <div className="px-4 md:px-6 pb-6">
                        <div className="w-full max-w-4xl mx-auto flex flex-col md:flex-row items-center gap-6 md:gap-10">

                            {/* ── Carte style Wave ── */}
                            <div className="w-full md:flex-[3] flex justify-center">
                                <div
                                    className="w-full max-w-[260px] md:max-w-[280px] rounded-3xl overflow-hidden shadow-lg flex flex-col items-center py-8 px-5 gap-2"
                                    style={{ backgroundColor: SECONDARY_HEX }}
                                >
                                    {/* Logo — sans fond, taille généreuse */}
                                    <div className="w-32 h-32 relative shrink-0">
                                        {storeInfo.storeLogo ? (
                                            <Image src={storeInfo.storeLogo} alt={storeName} fill className="object-contain" unoptimized />
                                        ) : (
                                            <Image src="/logo.png" alt="Logo" fill className="object-contain" unoptimized />
                                        )}
                                    </div>

                                    {/* Nom boutique — collé au logo */}
                                    <p className="text-white font-black text-base uppercase tracking-wide text-center leading-tight line-clamp-2 -mt-1">
                                        {storeName}
                                    </p>

                                    {/* QR noir sur fond blanc — style Wave */}
                                    <div className="bg-white rounded-2xl p-3 w-full flex items-center justify-center">
                                        <QRCodeCanvas
                                            id="store-qr-canvas"
                                            value={qrUrl}
                                            size={200}
                                            level="H"
                                            bgColor="#ffffff"
                                            fgColor="#111111"
                                            style={{ display: "block" }}
                                        />
                                    </div>

                                    {/* Tagline */}
                                    <p className="text-white/80 text-[10px] font-bold uppercase tracking-widest text-center">
                                        Scannez pour découvrir notre boutique
                                    </p>
                                </div>
                            </div>

                            {/* ── Info + boutons ── */}
                            <div className="flex flex-col gap-4 w-full md:flex-[2]">
                                <div className="bg-primary/5 border border-primary/10 rounded-2xl p-4 space-y-1">
                                    <p className="text-[10px] font-black text-primary uppercase tracking-widest flex items-center gap-1">
                                        <Icon icon="solar:shield-check-bold-duotone" className="w-3 h-3" />
                                        QR Code permanent
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        Ce QR Code reste valide même si vous modifiez le nom, le logo ou la description de votre boutique.
                                    </p>
                                </div>

                                <div className="flex gap-2">
                                    <button onClick={handleDownload} className="flex-1 min-w-0 flex items-center justify-center gap-1.5 bg-primary text-white font-black text-[10px] uppercase tracking-wide py-2.5 px-2 rounded-xl shadow-sm shadow-primary/20 hover:bg-secondary transition-all active:scale-95">
                                        <Icon icon="solar:download-bold-duotone" className="w-3.5 h-3.5 shrink-0" />
                                        <span className="truncate">Télécharger</span>
                                    </button>
                                    <button onClick={handlePrint} className="flex-1 min-w-0 flex items-center justify-center gap-1.5 bg-muted text-foreground font-black text-[10px] uppercase tracking-wide py-2.5 px-2 rounded-xl hover:bg-primary/10 hover:text-primary transition-all active:scale-95">
                                        <Icon icon="solar:printer-bold-duotone" className="w-3.5 h-3.5 shrink-0" />
                                        <span className="truncate">Imprimer</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}