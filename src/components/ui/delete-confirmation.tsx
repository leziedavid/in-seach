"use client"

import * as React from "react"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, } from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"

interface DeleteConfirmationProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onConfirm: () => void
    title?: string
    description?: string
    loading?: boolean
}

export function DeleteConfirmation({
    open,
    onOpenChange,
    onConfirm,
    title = "Êtes-vous sûr ?",
    description = "Cette action est irréversible. Les logs sélectionnés seront définitivement supprimés du serveur.",
    loading = false, }: DeleteConfirmationProps) {
    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>{title}</AlertDialogTitle>
                    <AlertDialogDescription>
                        {description}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={loading}>Annuler</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={(e: React.MouseEvent) => { e.preventDefault(); onConfirm() }}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        disabled={loading}>
                        {loading ? "Suppression..." : "Supprimer"}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}
