"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Icon } from "@iconify/react";
import { Button } from "../ui/button";

interface DeleteProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
  isDeleting?: boolean;
}

export default function Delete({
  isOpen,
  onClose,
  onConfirm,
  title = "Supprimer l'élément",
  message = "Êtes-vous sûr de vouloir supprimer cet élément ? Cette action est irréversible.",
  isDeleting = false,
}: DeleteProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-card border border-border w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden"
        >
          <div className="p-6 text-center">
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Icon icon="solar:trash-bin-trash-bold-duotone" className="w-8 h-8 text-red-500" />
            </div>
            
            <h3 className="text-xl font-black text-foreground mb-2">{title}</h3>
            <p className="text-sm text-muted-foreground mb-8">
              {message}
            </p>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={onClose}
                className="flex-1 rounded-2xl h-12 font-bold hover:bg-muted"
                disabled={isDeleting}
              >
                Annuler
              </Button>
              <Button
                onClick={onConfirm}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white rounded-2xl h-12 font-black shadow-lg shadow-red-500/20"
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <Icon icon="eos-icons:loading" className="w-5 h-5 animate-spin" />
                ) : (
                  "Oui, supprimer"
                )}
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
