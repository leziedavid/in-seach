"use client"

import { useState, memo } from "react"
import Image from "next/image"
import { Icon } from "@iconify/react"
import { Product, productConditionLabels } from "@/types/interface"
import ProductDetailModal from "@/components/products/modals/ProductDetailModal"
import { useCart } from "@/components/providers/CartProvider"
import { useNotification } from "@/components/notifications/NotificationProvider"
import Delete from "@/components/logistics/modals/Delete"
import { Switch } from "@/components/ui/switch"
import { Share } from "@/components/shared/Share"
import LiveButtonInline from "@/components/lives/LiveButtonInline"
import BoostEntityModal from "@/components/boost/modals/BoostEntityModal"
import { FEATURES } from "@/config/features"

const slugify = (text: string) => {
    return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')     // Replace spaces with -
        .replace(/[^\w-]+/g, '')  // Remove all non-word chars
        .replace(/--+/g, '-');    // Replace multiple - with single -
}

// [PERF] memo : évite le re-render des cartes produit quand le parent se re-rend
// sans que ce produit spécifique ait changé (critique dans les listes infinies)

const ProductCard = memo(function ProductCard({ product, onEdit, onDelete, onStatusChange, onCreateLive, storeNames, viewMode = 'grid' }: {
    product: Product;
    onEdit?: (product: Product) => void;
    onDelete?: (id: string) => void;
    onStatusChange?: (product: Product, value: boolean) => void;
    onCreateLive?: (product: Product) => void;
    storeNames?: string;
    viewMode?: 'grid' | 'list';
}) {


    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isShareOpen, setIsShareOpen] = useState(false);
    const [isBoostOpen, setIsBoostOpen] = useState(false);
    const { addToCart } = useCart();
    const { addNotification } = useNotification();

    const handleShare = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsShareOpen(true);
    };

    const handleAddToCart = (e: React.MouseEvent) => {
        e.stopPropagation();
        addToCart(product);
        addNotification(`"${product.name}" ajouté au panier`, "success");
    };

    const handleEdit = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (onEdit) onEdit(product);
    };

    const handleDelete = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = () => {
        if (onDelete) {
            onDelete(product.id);
        }
        setIsDeleteModalOpen(false);
    };

    const handleToggle = (value: boolean) => {
        if (onStatusChange) onStatusChange(product, value);
    };

    const isList = viewMode === 'list';

    return (

        <>
            {/* <div onClick={() => setIsModalOpen(true)} className={`group rounded-xl p-2 md:p-4 bg-card w-full transition-all duration-300 cursor-pointer  flex ${isList ? 'flex-row items-center gap-3 md:gap-4 text-left' : 'flex-col md:items-center text-left md:text-center'}`}> */}
            {/* Image - Scaling on hover */}
            <div onClick={() => setIsModalOpen(true)} className={`group rounded-xl transition-all duration-300 cursor-pointer overflow-hidden ${viewMode === 'grid' ? "p-0 md:p-4 flex flex-col md:items-center text-left md:text-center" : "p-2 md:p-4 flex flex-row items-center gap-4 text-left"}`}>

                <div className={`relative shrink-0 overflow-hidden rounded-lg md:rounded-2xl ${isList ? 'w-24 h-24 md:w-32 md:h-32' : 'w-full aspect-square mb-2 md:mb-3'}`}>
                    <Image src={product.imageUrl || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=2099&auto=format&fit=crop'} alt={product.name} fill unoptimized className="object-cover group-hover:scale-110 transition-transform duration-500" />
                    <div className="absolute top-1 left-1 md:top-2 md:left-2 bg-black/70 md:bg-background/95 backdrop-blur-sm px-1.5 py-0.5 md:px-2 md:py-0.5 rounded-full text-[8px] md:text-[9px] font-black text-white md:text-foreground uppercase tracking-tighter">
                        {product.category?.name || 'Produit'}
                    </div>
                    <div className="absolute bottom-1 left-1 md:bottom-2 md:left-2 bg-primary/80 backdrop-blur-sm px-1 md:px-2 py-0.5 rounded-md text-[7px] md:text-[8px] font-black text-white uppercase tracking-wider">
                        {productConditionLabels[product.etat] || product.etat}
                    </div>
                    {product.discountPercent && (
                        <div className="absolute top-1 right-1 md:top-2 md:right-2 bg-red-500 text-white px-1.5 py-0.5 md:px-2 md:py-1 rounded-lg text-[8px] md:text-[10px] font-black animate-pulse shadow-lg">
                            -{product.discountPercent}%
                        </div>
                    )}
                    {/* Badge LIVE flottant — visible uniquement en mode gestion */}
                    {onCreateLive && !product.discountPercent && (
                        <LiveButtonInline
                            onClick={e => { e.stopPropagation(); onCreateLive(product); }}
                            title="Créer un Live pour ce produit"
                        />
                    )}
                    {onCreateLive && product.discountPercent && (
                        <LiveButtonInline
                            onClick={e => { e.stopPropagation(); onCreateLive(product); }}
                            title="Créer un Live pour ce produit"
                            className="absolute bottom-2 right-2"
                        />
                    )}
                </div>

                {/* Contenu */}
                <div className={`flex flex-col flex-1 min-w-0 ${isList ? 'justify-center py-0' : 'px-0.5 pb-0 md:px-0 md:pb-0 w-full'}`}>

                    <h3 className="text-xs md:text-base font-black text-foreground mb-1 line-clamp-2 md:line-clamp-1 group-hover:text-primary transition-colors w-full text-left leading-tight">
                        {product.name}
                    </h3>

                    <div className="flex items-center justify-between mb-3">
                        <div className="text-left">
                            {product.pricePromo ? (
                                <div className="space-y-0.5">
                                    <p className="text-primary font-black text-sm md:text-base">
                                        {Number(product.pricePromo).toLocaleString()} <span className="text-[9px] font-bold text-muted-foreground">CFA</span>
                                    </p>
                                    <p className="text-[9px] md:text-xs font-bold text-muted-foreground/60 line-through decoration-red-500/30">
                                        {Number(product.price).toLocaleString()} CFA
                                    </p>
                                </div>
                            ) : (
                                <p className="text-secondary font-black text-sm md:text-base">
                                    {Number(product.price).toLocaleString()} <span className="text-[9px] font-bold text-muted-foreground">CFA</span>
                                </p>
                            )}
                        </div>


                        {(onEdit || onDelete) && FEATURES.showBoostButton && (
                            <button onClick={e => { e.stopPropagation(); setIsBoostOpen(true); }} className="p-1.5 hover:bg-primary/10 rounded-lg text-primary transition-colors shrink-0" title="Booster ce produit">
                                <Icon icon="solar:rocket-bold-duotone" className="w-4 h-4" />
                            </button>
                        )}
                    </div>

                    {onEdit || onDelete ? (

                        <div className="flex items-center justify-center w-full gap-1.5 flex-wrap">
                            <Switch checked={product.isActive} onCheckedChange={handleToggle} onClick={(e) => e.stopPropagation()} />
                            {onEdit && (
                                <button onClick={handleEdit} className="p-1.5 rounded-lg hover:bg-muted transition" title="Modifier">
                                    <Icon icon="solar:pen-new-square-bold-duotone" className="w-4 h-4" />
                                </button>
                            )}
                            {onDelete && (
                                <button onClick={handleDelete} className="p-1.5 rounded-lg hover:bg-destructive/10 text-destructive transition" title="Supprimer">
                                    <Icon icon="solar:trash-bin-trash-bold-duotone" className="w-4 h-4" />
                                </button>
                            )}
                            <button onClick={handleShare} className="p-1.5 hover:bg-muted rounded-lg text-muted-foreground transition-colors">
                                <Icon icon="solar:share-bold-duotone" className="w-4 h-4" />
                            </button>
                        </div>
                    ) : (
                        <div className="flex justify-end w-full">
                            <button onClick={handleAddToCart} className="flex items-center gap-1 md:gap-2 bg-secondary text-white px-2 py-1 md:px-3 md:py-2 rounded-full text-[10px] md:text-xs font-black hover:bg-primary transition-all active:scale-90 shadow-sm">
                                <span className="whitespace-nowrap">Ajouter</span>
                                <Icon icon="solar:cart-large-minimalistic-bold-duotone" className="w-4 h-4" />
                            </button>
                        </div>
                    )}
                </div>

            </div>

            <ProductDetailModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} product={product} />

            {FEATURES.showBoostButton && (
                <BoostEntityModal isOpen={isBoostOpen} onClose={() => setIsBoostOpen(false)} entityType="PRODUCT" entityId={product.id} entityName={product.name} />
            )}

            <Delete isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} onConfirm={confirmDelete} isDeleting={false} />

            <Share
                isOpen={isShareOpen}
                onClose={() => setIsShareOpen(false)}
                url={`${process.env.NEXT_PUBLIC_BASE_URL}/shop/${slugify(storeNames || '')}`}
                title={product.name}
                description={product.description || undefined}
                image={product.imageUrl || undefined}
                price={product.pricePromo || product.price}
                storeName={storeNames || ''}
                storeLogo={product.user?.storeLogo || product.user?.avatar}
            />
        </>
    )
});

export default ProductCard;