"use client";

import { useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import { AnimatePresence, motion } from "framer-motion";

/* ================= TYPES ================= */
export type NotificationType = "success" | "warning" | "info" | "error";
interface NotificationToastProps { message: string; type?: NotificationType; duration?: number; onClose?: () => void; }

/* ================= COMPONENT ================= */
export default function NotificationToast({ message, type = "success", duration = 4000, onClose, }: NotificationToastProps) {
    const [visible, setVisible] = useState(true);
    /* ================= AUTO CLOSE ================= */
    useEffect(() => {
        const timer = setTimeout(() => { handleClose(); }, duration); return () => clearTimeout(timer);
    }, [duration]);

    const handleClose = () => {
        setVisible(false);
        onClose?.();
    };

    /* ================= STYLES ================= */
    const styles = {
        success: {
            bg: "from-green-100 to-green-50 border-green-300",
            icon: <Icon icon="solar:check-circle-bold-duotone" className="h-5 w-5 text-green-600" />,
        },
        warning: {
            bg: "from-yellow-100 to-yellow-50 border-yellow-300",
            icon: <Icon icon="solar:danger-bold-duotone" className="h-5 w-5 text-yellow-600" />,
        },
        info: {
            bg: "from-[#155e75]/20 to-[#155e75]/10 border-[#155e75]/50",
            icon: <Icon icon="solar:info-circle-bold-duotone" className="h-5 w-5 text-[#155e75]" />,
        },
        error: {
            bg: "from-red-100 to-red-50 border-red-300",
            icon: <Icon icon="solar:danger-bold-duotone" className="h-5 w-5 text-red-600" />,
        },
    }[type];

    return (
        <AnimatePresence>
            {visible && (
                <motion.div initial={{ y: -80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -40, opacity: 0 }} transition={{ type: "spring", stiffness: 140, damping: 14 }}
                    className="  fixed top-4 left-1/2 -translate-x-1/2 z-[9999]  w-fit max-w-[95vw]  " >
                    <div className={`  relative flex items-center gap-3 bg-gradient-to-r ${styles.bg}  border rounded-xl shadow-lg px-4 py-3 min-w-[260px] `} >
                        {/* Icon */}
                        <div className="flex-shrink-0">{styles.icon}</div>
                        {/* Message */}
                        <p className="text-sm font-medium text-gray-800 flex-1">
                            {message}
                        </p>

                        {/* Close button */}
                        <button onClick={handleClose} className=" absolute -top-2 -right-2 p-1.5 rounded-full bg-white shadow border hover:bg-[#b07b5e] hover:text-white  transition-all hover:scale-105 " >
                            <Icon icon="solar:close-circle-bold-duotone" className="h-4 w-4" />
                        </button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}