"use client"

import { useState } from "react"
import Image from "next/image"
import { Icon } from "@iconify/react"
import { Product } from "@/types/interface"
import ProductDetailModal from "./ProductDetailModal"
import { useCart } from "@/components/providers/CartProvider"
import { useNotification } from "@/components/toast/NotificationProvider"

export default function ProductCard({
    product,
    onEdit,
    onDelete
}: {
    product: Product;
    onEdit?: (product: Product) => void;
    onDelete?: (id: string) => void;
}) {
    const [isModalOpen, setIsModalOpen] = useState(false);
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
        if (onDelete && window.confirm("Voulez-vous vraiment supprimer ce produit ?")) {
            onDelete(product.id);
        }
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

                    <div className="w-full flex items-center justify-between mt-auto">
                        <div className="text-left">
                            <p className="text-secondary font-black text-sm md:text-lg">
                                {Number(product.price).toLocaleString()} <span className="text-[9px] font-bold text-muted-foreground">CFA</span>
                            </p>
                        </div>
                        {onEdit || onDelete ? (
                            <div className="flex items-center gap-1">
                                {onEdit && (
                                    <button onClick={handleEdit} className="bg-blue-500 text-white p-1.5 md:p-2 rounded-full hover:bg-blue-600 transition-all active:scale-90 shadow-sm" title="Modifier" >
                                        <Icon icon="solar:pen-bold-duotone" className="w-4 h-4" />
                                    </button>
                                )}
                                {onDelete && (
                                    <button onClick={handleDelete} className="bg-red-500 text-white p-1.5 md:p-2 rounded-full hover:bg-red-600 transition-all active:scale-90 shadow-sm" title="Supprimer">
                                        <Icon icon="solar:trash-bin-trash-bold-duotone" className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        ) : (
                            <button onClick={handleAddToCart} className="bg-secondary text-white px-2 py-1 md:px-3 md:py-2 rounded-full md:rounded-full text-[10px] md:text-xs font-black hover:bg-primary transition-all active:scale-90 shadow-sm">
                                <Icon icon="solar:cart-large-minimalistic-bold-duotone" className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <ProductDetailModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} product={product} />
        </>
    )
}