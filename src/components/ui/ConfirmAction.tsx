"use client";

import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Icon } from "@iconify/react";
import { Button } from "@/components/ui/button";

export type ConfirmVariant = "danger" | "warning" | "success" | "info" | "indigo" | "orange";

interface ConfirmActionProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: ConfirmVariant;
  icon?: string;
  isLoading?: boolean;
}

const VARIANT_CONFIG: Record<ConfirmVariant, {
  iconBg: string;
  iconColor: string;
  btnClass: string;
  defaultIcon: string;
}> = {
  danger: { iconBg: "bg-red-500/10", iconColor: "text-red-500", btnClass: "bg-red-500 hover:bg-red-600 shadow-red-500/20", defaultIcon: "solar:close-circle-bold-duotone" },
  warning: { iconBg: "bg-orange-500/10", iconColor: "text-orange-500", btnClass: "bg-orange-500 hover:bg-orange-600 shadow-orange-500/20", defaultIcon: "solar:danger-triangle-bold-duotone" },
  success: { iconBg: "bg-green-500/10", iconColor: "text-green-500", btnClass: "bg-green-600 hover:bg-green-700 shadow-green-600/20", defaultIcon: "solar:check-circle-bold-duotone" },
  info: { iconBg: "bg-blue-500/10", iconColor: "text-blue-500", btnClass: "bg-blue-600 hover:bg-blue-700 shadow-blue-600/20", defaultIcon: "solar:info-circle-bold-duotone" },
  indigo: { iconBg: "bg-indigo-500/10", iconColor: "text-indigo-500", btnClass: "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/20", defaultIcon: "solar:delivery-bold-duotone" },
  orange: { iconBg: "bg-amber-500/10", iconColor: "text-amber-500", btnClass: "bg-amber-500 hover:bg-amber-600 shadow-amber-500/20", defaultIcon: "solar:bolt-circle-bold-duotone" },
};

export default function ConfirmAction({
  isOpen,
  onClose,
  onConfirm,
  title = "Confirmer l'action",
  message = "Êtes-vous sûr de vouloir effectuer cette action ?",
  confirmLabel = "Confirmer",
  cancelLabel = "Annuler",
  variant = "info",
  icon,
  isLoading = false,
}: ConfirmActionProps) {
  const [mounted, setMounted] = useState(false);
  // Bloque les interactions pendant 350ms après l'ouverture
  // pour éviter qu'un double-click sur le bouton déclencheur
  // déclenche immédiatement le bouton "Confirmer"
  const [interactive, setInteractive] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (isOpen) {
      setInteractive(false);
      timerRef.current = setTimeout(() => setInteractive(true), 350);
    } else {
      setInteractive(false);
    }
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [isOpen]);

  const cfg = VARIANT_CONFIG[variant];
  const resolvedIcon = icon ?? cfg.defaultIcon;

  const handleConfirm = (e: React.MouseEvent) => {
    e.stopPropagation();

    // 🔒 onConfirm ne doit JAMAIS s'exécuter seul (ex: touche Entrée/Espace
    // sur un bouton focus, déclenchement programmatique, etc.).
    // e.detail === 0 signifie que le "clic" n'a pas été initié par une
    // vraie action souris/tactile -> on bloque tout dans ce cas.
    if (e.detail === 0) return;

    if (!interactive || isLoading) return;
    onConfirm();
  };

  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isLoading) return;
    onClose();
  };

  const dialog = (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="confirm-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 flex items-center justify-center p-4"
          style={{ zIndex: 99999, backgroundColor: "rgba(0,0,0,0.65)", backdropFilter: "blur(4px)" }}
        >
          <motion.div
            key="confirm-card"
            initial={{ opacity: 0, scale: 0.92, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 16 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="bg-card border border-border w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 text-center">
              <div className={`w-16 h-16 ${cfg.iconBg} rounded-full flex items-center justify-center mx-auto mb-4`}>
                <Icon icon={resolvedIcon} className={`w-8 h-8 ${cfg.iconColor}`} />
              </div>
              <h3 className="text-xl font-black text-foreground mb-2">{title}</h3>
              <p className="text-sm text-muted-foreground mb-8 leading-relaxed">{message}</p>
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  disabled={isLoading || !interactive}
                  className="flex-1 rounded-2xl h-12 font-bold hover:bg-muted"
                >
                  {cancelLabel}
                </Button>
                <Button
                  type="button"
                  onClick={handleConfirm}
                  disabled={isLoading || !interactive}
                  className={`flex-1 text-white rounded-2xl h-12 font-black shadow-lg ${cfg.btnClass}`}
                >
                  {isLoading ? (
                    <Icon icon="eos-icons:loading" className="w-5 h-5 animate-spin" />
                  ) : !interactive ? (
                    <Icon icon="eos-icons:loading" className="w-5 h-5 animate-spin opacity-40" />
                  ) : (
                    confirmLabel
                  )}
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  if (!mounted) return null;
  return createPortal(dialog, document.body);
}