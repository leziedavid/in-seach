"use client"

import { useState } from "react"
import Image from "next/image"
import { Icon } from "@iconify/react"
import { Product } from "@/types/interface"
import ProductDetailModal from "./ProductDetailModal"
import { useCart } from "@/components/providers/CartProvider"
import { useNotification } from "@/components/toast/NotificationProvider"
import Delete from "../logistics/Delete"

import { Switch } from "../ui/switch"

export default function ProductCard({
    product,
    onEdit,
    onDelete,
    onStatusChange
}: {
    product: Product;
    onEdit?: (product: Product) => void;
    onDelete?: (id: string) => void;
    onStatusChange?: (product: Product, value: boolean) => void;
}) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const { addToCart } = useCart();
    const { addNotification } = useNotification();

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

    return (

        <>
            <div onClick={() => setIsModalOpen(true)} className="group rounded-lg p-0 md:p-4 flex flex-col md:items-center text-left md:text-center bg-card w-full transition-all duration-300 cursor-pointer  border border-transparent ">
                {/* Image - Scaling on hover */}
                {/* <pre>{JSON.stringify(product.imageUrl, null, 2)}</pre> */}
                <div className="relative w-full aspect-square mb-1.5 overflow-hidden rounded-lg md:rounded-2xl">
                    <Image src={product.imageUrl || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=2099&auto=format&fit=crop'}
                        alt={product.name}
                        fill unoptimized
                        className="object-cover group-hover:scale-110 transition-transform duration-500" />
                    <div className="absolute top-1 left-1 md:top-2 md:left-2 bg-black/70 md:bg-background/95 backdrop-blur-sm px-1.5 py-0.5 md:px-2 md:py-0.5 rounded-full text-[8px] md:text-[9px] font-black text-white md:text-foreground uppercase tracking-tighter">
                        {product.category?.name || 'Produit'}
                    </div>
                    {product.discountPercent && (
                        <div className="absolute top-1 right-1 md:top-2 md:right-2 bg-red-500 text-white px-1.5 py-0.5 md:px-2 md:py-1 rounded-lg text-[8px] md:text-[10px] font-black animate-pulse shadow-lg">
                            -{product.discountPercent}%
                        </div>
                    )}
                </div>

                {/* Contenu */}
                <div className="px-0.5 pb-0 md:px-0 md:pb-0 w-full">
                    <h3 className="text-xs md:text-base font-black text-foreground mb-1 line-clamp-2 md:line-clamp-1 group-hover:text-primary transition-colors w-full text-left leading-tight">
                        {product.name}
                    </h3>

                    <div className="flex items-center justify-start gap-1 text-primary mb-2 md:mb-4 md:justify-center">
                        <Icon icon="solar:star-bold-duotone" className="w-2.5 h-2.5 fill-current md:w-3 md:h-3" />
                        <span className="text-[9px] md:text-xs font-black tracking-tight">4.9 • <span className="text-muted-foreground">Boutique</span></span>
                    </div>

                    <div className="text-left mb-3">
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

                    {onEdit || onDelete ? (
                        <div className="flex items-center justify-center w-full gap-3">
                            <Switch
                                checked={product.isActive}
                                onCheckedChange={handleToggle}
                                onClick={(e) => e.stopPropagation()}
                            />
                            <div className="flex items-center gap-2">
                                {onEdit && (
                                    <button onClick={handleEdit} className="p-2 rounded-lg hover:bg-muted transition" title="Modifier" >
                                        <Icon icon="solar:pen-new-square-bold-duotone" width={18} height={18} />
                                    </button>
                                )}
                                {onDelete && (
                                    <button onClick={handleDelete} className="p-2 rounded-lg hover:bg-destructive/10 text-destructive transition" title="Supprimer">
                                        <Icon icon="solar:trash-bin-trash-bold-duotone" width={18} height={18} />
                                    </button>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="flex justify-end w-full">
                            <button onClick={handleAddToCart} className="bg-secondary text-white px-2 py-1 md:px-3 md:py-2 rounded-lg text-[10px] md:text-xs font-black hover:bg-primary transition-all active:scale-90 shadow-sm">
                                <Icon icon="solar:cart-large-minimalistic-bold-duotone" className="w-4 h-4" />
                            </button>
                        </div>
                    )}
                </div>
            </div>


            <ProductDetailModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} product={product} />

            <Delete
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={confirmDelete}
                // ProductCard relies on the parent to handle the actual API call and loading state via onDelete
                isDeleting={false} 
            />
        </>
    )
}