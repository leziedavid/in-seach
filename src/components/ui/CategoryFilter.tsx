"use client"

import React, { useRef, useEffect, useState } from "react";
import { Icon } from "@iconify/react";

export interface CategoryItem {
    id: string;
    name: string;
    subCategories?: { id: string; name: string }[];
}

interface CategoryFilterProps {
    categories: CategoryItem[];
    selectedCategoryId: string | null;
    selectedSubCategoryId?: string | null;
    onCategoryChange: (id: string) => void;
    onSubCategoryChange?: (id: string) => void;
    hasSubCategories?: boolean;
    className?: string;
    // "pills" (défaut, inchangé — utilisé par shop/[storeName], fournisseur/[storeName],
    // LogisticProvider, LogisticsServicesList) vs "cards" : icône dans une carte arrondie +
    // libellé dessous, comme la liste de catégories de SearchServies.tsx. Les catégories
    // produit n'ayant pas d'image, "cards" affiche toujours une icône par défaut.
    variant?: "pills" | "cards";
}

export default function CategoryFilter({
    categories,
    selectedCategoryId,
    selectedSubCategoryId = null,
    onCategoryChange,
    onSubCategoryChange,
    hasSubCategories = false,
    className = "",
    variant = "pills"
}: CategoryFilterProps) {
    const categoryRef = useRef<HTMLDivElement>(null);
    const subCategoryRef = useRef<HTMLDivElement>(null);
    const [showLeftArrow, setShowLeftArrow] = useState(false);
    const [showRightArrow, setShowRightArrow] = useState(false);

    const checkArrows = (ref: React.RefObject<HTMLDivElement | null>) => {
        if (ref.current) {
            const { scrollLeft, scrollWidth, clientWidth } = ref.current;
            setShowLeftArrow(scrollLeft > 0);
            setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 5);
        }
    };

    useEffect(() => {
        checkArrows(categoryRef);
        const currentRef = categoryRef.current;
        if (currentRef) {
            currentRef.addEventListener("scroll", () => checkArrows(categoryRef));
        }
        return () => {
            if (currentRef) {
                currentRef.removeEventListener("scroll", () => checkArrows(categoryRef));
            }
        };
    }, [categories]);

    const activeCategory = categories.find(cat => cat.id === selectedCategoryId);

    if (variant === "cards") {
        // Carte icône (pas d'image dispo côté catégories/sous-catégories produit → icône
        // par défaut systématique) + libellé dessous, avec la même croix rouge de
        // désélection que le style "pills". "all"/"Tous" n'est jamais déselectionnable
        // (c'est déjà l'état "aucun filtre").
        const renderCard = (id: string, name: string, isActive: boolean, isDeselectable: boolean, onClick: () => void, onDeselect: () => void, icon: string) => (
            <div key={id} className="flex flex-col items-center gap-1.5 shrink-0">
                <div className="relative">
                    <button type="button" onClick={onClick} className={`relative w-14 h-14 rounded-2xl overflow-hidden flex items-center justify-center border transition-all duration-300 active:scale-95 ${isActive ? "border-primary bg-primary/10 shadow-md shadow-primary/20 scale-105" : "border-border/40 bg-muted/40 hover:border-primary/40"}`}>
                        <Icon icon={icon} className={`w-6 h-6 ${isActive ? "text-primary" : "text-muted-foreground"}`} />
                    </button>
                    {isDeselectable && (
                        <button type="button" onClick={(e) => { e.stopPropagation(); onDeselect(); }} className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center shadow-md ring-2 ring-white dark:ring-zinc-900 active:scale-90 transition-all" aria-label={`Désélectionner ${name}`} title={`Désélectionner ${name}`} >
                            <Icon icon="solar:close-circle-bold" className="w-4 h-4" />
                        </button>
                    )}
                </div>
                <span className={`text-[11px] font-black max-w-[64px] truncate transition-colors ${isActive ? "text-primary" : "text-foreground/80"}`}>
                    {name}
                </span>
            </div>
        );

        return (
            <div className={`w-full space-y-3 ${className}`}>
                <div className="w-full overflow-x-auto scroll-smooth scrollbar-hide [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    <div className="flex items-start gap-3 px-1 py-1 w-max">
                        {categories.map((cat) =>
                            renderCard(
                                cat.id, cat.name,
                                selectedCategoryId === cat.id,
                                selectedCategoryId === cat.id && cat.id !== "all",
                                () => onCategoryChange(cat.id),
                                () => onCategoryChange("all"),
                                "solar:widget-5-bold-duotone",
                            )
                        )}
                    </div>
                </div>

                {hasSubCategories && activeCategory && activeCategory.subCategories && activeCategory.subCategories.length > 0 && (
                    <div className="w-full overflow-x-auto scroll-smooth scrollbar-hide [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden animate-in fade-in slide-in-from-top-2 duration-500">
                        <div className="flex items-start gap-3 px-1 py-1 w-max">
                            {onSubCategoryChange && renderCard(
                                "all", `Tout ${activeCategory.name}`,
                                selectedSubCategoryId === "all",
                                false,
                                () => onSubCategoryChange("all"),
                                () => onSubCategoryChange("all"),
                                "solar:layers-minimalistic-bold-duotone",
                            )}
                            {activeCategory.subCategories.map((sub) =>
                                renderCard(
                                    sub.id, sub.name,
                                    selectedSubCategoryId === sub.id,
                                    selectedSubCategoryId === sub.id,
                                    () => onSubCategoryChange?.(sub.id),
                                    () => onSubCategoryChange?.("all"),
                                    "solar:tag-bold-duotone",
                                )
                            )}
                        </div>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className={`w-full space-y-4 ${className}`}>
            {/* Categories Wrapper */}
            <div className="relative group">

                {/* Left Indicator */}
                {showLeftArrow && (
                    <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-background to-transparent z-10 flex items-center pointer-events-none">
                        <Icon icon="solar:alt-arrow-left-bold" className="w-3 h-3 text-muted-foreground/50 ml-1" />
                    </div>
                )}

                <div ref={categoryRef} className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide w-full px-2 md:px-4" >
                    {categories.map((cat) => {
                        const isActive = selectedCategoryId === cat.id;
                        const isDeselectable = isActive && cat.id !== "all";
                        return (
                            <button key={cat.id} onClick={() => onCategoryChange(cat.id)}
                                className={`  relative px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-tighter whitespace-nowrap transition-all duration-300 border-2 ${isActive ? "bg-primary border-primary text-white shadow-lg shadow-primary/20 scale-105 z-20" : "bg-card border-border text-muted-foreground hover:border-primary/30 hover:bg-muted/50"}`}>
                                {cat.name}
                                {isActive && (
                                    <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-white rounded-full animate-pulse" />
                                )}
                                {isDeselectable && (
                                    <span
                                        role="button"
                                        tabIndex={0}
                                        aria-label={`Désélectionner ${cat.name}`}
                                        onClick={(e) => { e.stopPropagation(); onCategoryChange("all"); }}
                                        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.stopPropagation(); onCategoryChange("all"); } }}
                                        className="absolute -top-1.5 -right-1.5 z-30 w-5 h-5 rounded-full bg-red-500 border-2 border-background shadow-md flex items-center justify-center hover:bg-red-600 hover:scale-110 active:scale-90 transition-all duration-200 animate-in fade-in zoom-in cursor-pointer"
                                    >
                                        <Icon icon="solar:close-circle-bold" className="w-3.5 h-3.5 text-white" />
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* Right Indicator */}
                {showRightArrow && (
                    <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-background to-transparent z-10 flex items-center justify-end pointer-events-none">
                        <Icon icon="solar:alt-arrow-right-bold" className="w-3 h-3 text-muted-foreground/50 mr-1" />
                    </div>
                )}
            </div>

            {/* Sub-categories Wrapper */}
            {hasSubCategories && activeCategory && activeCategory.subCategories && activeCategory.subCategories.length > 0 && (
                <div className="relative animate-in fade-in slide-in-from-top-2 duration-500">
                    <div ref={subCategoryRef} className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide w-full px-4 md:px-8">
                        {/* Option "All" for subcategories if needed, but often not used in sub-levels if the parent is already specific */}
                        {/* We include it if the caller provides onSubCategoryChange and selectedSubCategoryId */}
                        {onSubCategoryChange && (
                            <button
                                onClick={() => onSubCategoryChange("all")}
                                className={`
                                    px-4 py-1.5 rounded-full text-[10px] font-medium uppercase transition-all whitespace-nowrap border
                                    ${selectedSubCategoryId === "all"
                                        ? "bg-secondary text-white border-secondary shadow-md scale-105"
                                        : "bg-card text-muted-foreground/60 border-border hover:border-secondary/50"
                                    }
                                `}
                            >
                                Tout {activeCategory.name}
                            </button>
                        )}

                        {activeCategory.subCategories.map((sub) => {
                            const isSubActive = selectedSubCategoryId === sub.id;
                            return (
                                <button
                                    key={sub.id}
                                    onClick={() => onSubCategoryChange?.(sub.id)}
                                    className={`
                                        relative px-4 py-1.5 rounded-full text-[10px] font-medium uppercase transition-all whitespace-nowrap border
                                        ${isSubActive
                                            ? "bg-secondary text-white border-secondary shadow-md scale-105"
                                            : "bg-card text-muted-foreground/60 border-border hover:border-secondary/50"
                                        }
                                    `}
                                >
                                    {sub.name}
                                    {isSubActive && (
                                        <span
                                            role="button"
                                            tabIndex={0}
                                            aria-label={`Désélectionner ${sub.name}`}
                                            onClick={(e) => { e.stopPropagation(); onSubCategoryChange?.("all"); }}
                                            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.stopPropagation(); onSubCategoryChange?.("all"); } }}
                                            className="absolute -top-1.5 -right-1.5 z-30 w-4 h-4 rounded-full bg-red-500 border-2 border-background shadow-md flex items-center justify-center hover:bg-red-600 hover:scale-110 active:scale-90 transition-all duration-200 animate-in fade-in zoom-in cursor-pointer"
                                        >
                                            <Icon icon="solar:close-circle-bold" className="w-3 h-3 text-white" />
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
