"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { getMyProducts, createProduct, updateProduct, deleteProduct } from "@/api/api"
import { Product } from "@/types/interface"
import ProductCard from "./ProductCard"
import { Icon } from "@iconify/react"
import { useNotification } from "@/components/toast/NotificationProvider"
import { Modal } from "@/components/modal/MotionModal"
import FormsProduit from "@/components/Forms/FormsProduit"
import { useSubscriptionCheck } from "@/hooks/useSubscriptionCheck"

const ITEMS_PER_PAGE = 6

export default function Store() {
    const [search, setSearch] = useState("")
    const [products, setProducts] = useState<Product[]>([])
    const [page, setPage] = useState(1)
    const [hasMore, setHasMore] = useState(true)
    const [loading, setLoading] = useState(false)
    const [total, setTotal] = useState(0)
    const loaderRef = useRef<HTMLDivElement | null>(null)

    // Product Management State
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isEditing, setIsEditing] = useState(false)
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const { addNotification } = useNotification()

    const { checkEligibility, loading: checkLoading } = useSubscriptionCheck()

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

    const openCreateModal = async () => {
        const canCreate = await checkEligibility('Product')
        if (canCreate) {
            setIsEditing(false)
            setSelectedProduct(null)
            setIsModalOpen(true)
        }
    }

    const openEditModal = (product: Product) => {
        setIsEditing(true)
        setSelectedProduct(product)
        setIsModalOpen(true)
    }

    // Load Products
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

    // Reset and fetch when filters change
    useEffect(() => {
        setPage(1)
        fetchProducts(1, true)
    }, [search, fetchProducts])

    // Load more when page changes (infinite scroll)
    useEffect(() => {
        if (page > 1) {
            fetchProducts(page, false)
        }
    }, [page, fetchProducts])

    // Infinite Scroll Observer
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => { if (entries[0].isIntersecting && hasMore && !loading) { setPage(prev => prev + 1) } },
            { threshold: 0.1 }
        )

        if (loaderRef.current) observer.observe(loaderRef.current)
        return () => observer.disconnect()
    }, [hasMore, loading])



    return (
        <div className="flex flex-col items-center w-full max-w-7xl mx-auto px-4 py-2">
            {/* Action Bar */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 w-full max-w-4xl mb-6">
                <div className="flex items-center w-full md:max-w-md bg-card border border-border rounded-xl px-4 py-2.5 shadow-sm focus-within:border-primary transition-all">
                    <Icon icon="solar:magnifer-bold-duotone" className="w-5 h-5 text-muted-foreground mr-3 flex-shrink-0" />
                    <input type="text" placeholder="Rechercher dans mes produits..." className="flex-1 bg-transparent text-foreground outline-none text-sm placeholder:text-muted-foreground" value={search} onChange={(e) => setSearch(e.target.value)} />
                </div>

                <button disabled={checkLoading} onClick={openCreateModal} className="w-full md:w-auto flex items-center justify-center gap-2 bg-primary text-white px-6 py-2.5 rounded-xl font-bold hover:bg-secondary transition-all active:scale-95 shadow-lg shadow-primary/20 disabled:opacity-50">
                    {checkLoading ? <Icon icon="line-md:loading-twotone-loop" className="w-5 h-5" /> : <Icon icon="solar:plus-circle-bold-duotone" className="w-5 h-5" />}
                    Ajouter un produit
                </button>
            </div>

            {/* Results count header */}
            <div className="flex flex-col w-full max-w-4xl mx-auto px-0 md:px-4 py-2">
                <div className="flex items-center justify-between w-full px-2 md:px-0 mb-6 border-b border-border pb-4">
                    <h3 className="text-lg font-black text-foreground">
                        {loading && products.length === 0 ? 'Chargement...' : products.length === 0 ? 'Aucun produit' : `Mes Produits (${total})`}
                    </h3>
                </div>

                {/* PRODUCTS GRID */}
                <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-6">
                    {products.map((product) => (
                        <ProductCard
                            key={product.id}
                            product={product}
                            onEdit={openEditModal}
                            onDelete={handleDeleteProduct}
                        />
                    ))}
                </div>

                {/* Loading State / Trigger */}
                <div ref={loaderRef} className="w-full flex justify-center py-12">
                    {loading && (
                        <div className="flex flex-col items-center gap-2">
                            <Icon icon="eos-icons:loading" className="w-8 h-8 text-primary animate-spin" />
                            <span className="text-xs text-muted-foreground animate-pulse">Chargement de la suite...</span>
                        </div>
                    )}
                    {!hasMore && products.length > 0 && (
                        <div className="flex items-center gap-3 text-muted-foreground/40 italic">
                            <div className="h-px w-8 bg-current opacity-20" />
                            <span className="text-xs font-medium">Fin du catalogue</span>
                            <div className="h-px w-8 bg-current opacity-20" />
                        </div>
                    )}
                </div>
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
        </div>
    )
}