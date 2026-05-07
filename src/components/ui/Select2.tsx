'use client';

import * as React from "react";
import { Icon } from "@iconify/react";

// Interfaces
interface BaseComboboxProps<T> {
    options: T[];
    labelExtractor: (item: T) => string;
    valueExtractor: (item: T) => string;
    placeholder?: string;
    disabled?: boolean;
}

interface SingleSelectProps<T> extends BaseComboboxProps<T> {
    mode?: 'single';
    selectedItem: string | null;
    onSelectionChange: (selectedItem: string | null) => void;
}

interface MultipleSelectProps<T> extends BaseComboboxProps<T> {
    mode: 'multiple';
    selectedItem: string[] | null;
    onSelectionChange: (selectedItem: string[] | null) => void;
}

type ComboboxProps<T> = SingleSelectProps<T> | MultipleSelectProps<T>;

export function Select2<T>(props: ComboboxProps<T>) {
    const {
        options,
        labelExtractor,
        valueExtractor,
        placeholder = "Sélectionner...",
        disabled = false,
    } = props;

    const mode = 'mode' in props ? props.mode : 'single';
    const selectedItem = 'selectedItem' in props ? props.selectedItem : null;
    const onSelectionChange = 'onSelectionChange' in props ? props.onSelectionChange : () => { };

    const [open, setOpen] = React.useState(false);
    const [searchQuery, setSearchQuery] = React.useState("");
    const popoverRef = React.useRef<HTMLDivElement>(null);

    const isMultipleMode = mode === 'multiple';

    // Fermer le popover en cliquant à l'extérieur
    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
                setOpen(false);
            }
        };

        if (open) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [open]);

    // Ne pas ouvrir le popover si désactivé
    const handleOpen = () => {
        if (!disabled) {
            setOpen(!open);
        }
    };

    const isSelected = (value: string): boolean => {
        if (isMultipleMode) {
            return Array.isArray(selectedItem) && selectedItem.includes(value);
        } else {
            return selectedItem === value;
        }
    };

    const handleSelection = (value: string) => {
        if (disabled) return;

        if (isMultipleMode) {
            const currentSelection = Array.isArray(selectedItem) ? selectedItem : [];

            if (currentSelection.includes(value)) {
                const newSelection = currentSelection.filter(item => item !== value);
                (onSelectionChange as (selected: string[] | null) => void)(
                    newSelection.length > 0 ? newSelection : null
                );
            } else {
                const newSelection = [...currentSelection, value];
                (onSelectionChange as (selected: string[] | null) => void)(newSelection);
            }
        } else {
            (onSelectionChange as (selected: string | null) => void)(
                value === selectedItem ? null : value
            );
            setOpen(false);
        }
    };

    const handleRemoveSelection = (e: React.MouseEvent, value?: string) => {
        if (disabled) return;

        e.stopPropagation();

        if (isMultipleMode && value) {
            const currentSelection = Array.isArray(selectedItem) ? selectedItem : [];
            const newSelection = currentSelection.filter(item => item !== value);
            (onSelectionChange as (selected: string[] | null) => void)(
                newSelection.length > 0 ? newSelection : null
            );
        } else {
            if (isMultipleMode) {
                (onSelectionChange as (selected: string[] | null) => void)(null);
            } else {
                (onSelectionChange as (selected: string | null) => void)(null);
            }
        }
    };

    const getFilteredOptions = () => {
        const availableOptions = Array.isArray(options) ? options : [];

        let filtered = availableOptions;

        if (isMultipleMode) {
            const selectedValues = Array.isArray(selectedItem) ? selectedItem : [];
            filtered = availableOptions.filter((option) => {
                const value = valueExtractor(option);
                return !selectedValues.includes(value);
            });
        } else {
            filtered = availableOptions.filter((option) => {
                const value = valueExtractor(option);
                return value !== selectedItem;
            });
        }

        // Filtrer par recherche
        if (searchQuery) {
            return filtered.filter((option) =>
                labelExtractor(option).toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        return filtered;
    };

    const renderSelectedDisplay = () => {
        if (isMultipleMode) {
            const selectedValues = Array.isArray(selectedItem) ? selectedItem : [];
            if (selectedValues.length === 0) {
                return <span className={`${disabled ? 'text-muted-foreground/40' : 'text-muted-foreground'}`}>{placeholder}</span>;
            }

            const selectedItems = options.filter(option =>
                selectedValues.includes(valueExtractor(option))
            );

            return (
                <div className="flex items-center space-x-2 flex-wrap gap-1">
                    {selectedItems.slice(0, 3).map((item) => (
                        <div
                            key={valueExtractor(item)}
                            className="inline-flex items-center bg-muted text-foreground text-sm px-2 py-1 rounded-lg border border-border transition-colors hover:bg-muted/80"
                        >
                            {labelExtractor(item)}
                            {!disabled && (
                                <Icon
                                    icon="solar:close-circle-bold-duotone"
                                    className="cursor-pointer text-muted-foreground h-3.5 w-3.5 ml-1.5 hover:text-foreground transition-colors"
                                    onClick={(e) => handleRemoveSelection(e, valueExtractor(item))}
                                />
                            )}
                        </div>
                    ))}
                    {selectedItems.length > 3 && (
                        <span className="text-xs text-muted-foreground font-medium">
                            +{selectedItems.length - 3} autres
                        </span>
                    )}
                    {!disabled && selectedItems.length > 0 && (
                        <Icon
                            icon="solar:close-circle-bold-duotone"
                            className="cursor-pointer text-black h-4 w-4 hover:text-gray-700"
                            onClick={(e) => handleRemoveSelection(e)}
                        />
                    )}
                </div>
            );
        } else {
            if (!selectedItem || typeof selectedItem !== 'string') {
                return <span className={`${disabled ? 'text-muted-foreground/40' : 'text-muted-foreground'}`}>{placeholder}</span>;
            }

            const item = options.find(option => valueExtractor(option) === selectedItem);
            return item ? (
                <div className="flex items-center space-x-2">
                    <span className={disabled ? 'text-muted-foreground/60' : 'text-foreground font-medium'}>{labelExtractor(item)}</span>
                    {!disabled && (
                        <Icon
                            icon="solar:close-circle-bold-duotone"
                            className="cursor-pointer text-black h-4 w-4 hover:text-gray-700"
                            onClick={(e) => handleRemoveSelection(e)}
                        />
                    )}
                </div>
            ) : (
                <span className={`${disabled ? 'text-muted-foreground/40' : 'text-muted-foreground'}`}>{placeholder}</span>
            );
        }
    };

    const filteredOptions = getFilteredOptions();

    return (
        <div className="relative w-full" ref={popoverRef}>
            {/* Trigger Button */}
            <button type="button" onClick={handleOpen} disabled={disabled} className={`flex items-center justify-between w-full px-3 py-2.5 text-sm border-2 rounded-xl transition-all duration-300 focus:outline-none focus:ring-2 ${disabled ? 'bg-muted/50 border-border text-muted-foreground/40 cursor-not-allowed' : `bg-card border-border hover:border-primary/50 focus:ring-primary/20 ${open ? 'border-primary ring-2 ring-primary/20' : ''}`}`} >
                <div className="flex items-center space-x-2 flex-wrap truncate flex-1">
                    {renderSelectedDisplay()}
                </div>
                <Icon icon="solar:alt-arrow-down-bold-duotone" className={`h-4 w-4 ml-2 flex-shrink-0 transition-transform duration-300 ${open ? 'rotate-180' : ''} ${disabled ? 'opacity-20' : 'text-muted-foreground'
                    }`} />
            </button>

            {/* Popover Content */}
            {open && !disabled && (
                <div className="absolute z-[1050] w-full mt-2 bg-card/90 backdrop-blur-2xl border-2 border-border rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                    {/* Search Input */}
                    <div className="p-2 border-b border-gray-200">
                        <input type="text" placeholder="Rechercher..." value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                            inputMode={'text'}
                            style={{ fontSize: '16px' }}
                            suppressHydrationWarning
                        />
                    </div>

                    {/* Options List */}
                    <div className="max-h-64 overflow-y-auto p-1">
                        {filteredOptions.length === 0 ? (
                            <div className="px-3 py-6 text-sm text-muted-foreground/60 text-center font-medium italic">
                                Aucune option trouvée.
                            </div>
                        ) : (
                            filteredOptions.map((option) => {
                                const value = valueExtractor(option);
                                const label = labelExtractor(option);
                                const selected = isSelected(value);

                                return (
                                    <div
                                        key={value}
                                        onClick={() => handleSelection(value)}
                                        className={`flex items-center justify-between px-4 py-2.5 text-sm cursor-pointer rounded-xl transition-all duration-200 ${selected ? 'bg-primary/10 text-primary' : 'text-foreground hover:bg-muted font-normal'}`}  >
                                        <span className={selected ? 'font-bold' : ''}>
                                            {label}
                                        </span>
                                        <Icon icon="solar:check-circle-bold-duotone" className={`h-4 w-4 transition-opacity ${selected ? 'opacity-100' : 'opacity-0'}`} />
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}