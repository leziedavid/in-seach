"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Icon } from "@iconify/react";
import { createPortal } from "react-dom";
import { useTranslation } from "@/utils/langue/hooks";

export interface ReceiptData {
    title: string;
    code: string;
    date: string;
    status: string;
    statusLabel: string;
    statusColor: { bg: string; text: string };
    clientName: string;
    clientEmail?: string;
    clientPhone?: string;
    providerName?: string;
    providerPhone?: string;
    items: {
        name: string;
        quantity: number;
        price: number;
    }[];
    totalAmount: number;
    type: 'RDV' | 'COMMANDE';
    paymentMethod?: string;
}

interface ReceiptModalProps {
    isOpen: boolean;
    onClose: () => void;
    data: ReceiptData | null;
}

export default function ReceiptModal({ isOpen, onClose, data }: ReceiptModalProps) {
    const { t, language } = useTranslation();
    const [mounted, setMounted] = useState(false);
    const receiptRef = useRef<HTMLDivElement>(null);

    useEffect(() => { setMounted(true); }, []);

    if (!data || !mounted) return null;

    const handlePrint = () => {
        const printContent = receiptRef.current;
        if (!printContent) return;

        const printStyles = `
            <style>
                @media print {
                    body * { visibility: hidden; }
                    #print-area, #print-area * { visibility: visible; }
                    #print-area { position: absolute; left: 0; top: 0; width: 100%; }
                    .no-print { display: none !important; }
                }
            </style>
        `;

        const newWindow = window.open('', '_blank');
        if (newWindow) {
            newWindow.document.write('<html><head><title>Reçu - ' + data.code + '</title>');
            newWindow.document.write(printStyles);
            // Copy existing styles
            document.querySelectorAll('link[rel="stylesheet"], style').forEach(node => {
                newWindow.document.write(node.outerHTML);
            });
            newWindow.document.write('</head><body>');
            newWindow.document.write('<div id="print-area">' + printContent.innerHTML + '</div>');
            newWindow.document.write('</body></html>');
            newWindow.document.close();
            newWindow.focus();
            setTimeout(() => {
                newWindow.print();
                newWindow.close();
            }, 500);
        }
    };

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 bg-[#0F2944]/30 backdrop-blur-sm z-[1000]" />
                    <motion.div initial={{ y: "100%", opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: "100%", opacity: 0 }}
                        transition={{ type: "spring", damping: 30, stiffness: 300 }}
                        className="fixed inset-0 flex items-end md:items-center justify-center z-[1001] pointer-events-none p-4">
                        <motion.div className="bg-white text-slate-900 md:shadow-[0_8px_48px_rgba(15,41,68,0.16)] overflow-hidden flex flex-col md:w-[90%] md:max-w-xl md:max-h-[85vh] md:rounded-3xl rounded-none w-full h-dvh md:h-auto pb-safe pointer-events-auto"
                            initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} transition={{ delay: 0.1, type: "spring", damping: 25 }} >

                            <div className="sticky top-0 z-50 flex h-16 items-center justify-between px-4 border-b border-[#EEF1F4] bg-white/90 backdrop-blur-md">
                                <button onClick={onClose} className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F2EFE7] text-[#0F2944] hover:bg-[#E8E2D6] transition-all active:scale-90"><Icon icon="solar:close-circle-bold-duotone" width={20} /></button>
                                <h2 className="text-lg font-black uppercase tracking-tight">{t("akwaba.receipt.title")}</h2>
                                <button onClick={handlePrint} className="p-2 bg-primary text-white rounded-full hover:scale-110 transition shadow-lg shadow-primary/20"><Icon icon="solar:printer-minimalistic-bold-duotone" width={20} /></button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-8 space-y-8" ref={receiptRef}>
                                {/* HEADER */}
                                <div className="text-center space-y-2">
                                    <div className="inline-flex p-3 bg-primary/10 text-primary rounded-2xl mb-2">
                                        <Icon icon="solar:wallet-money-bold-duotone" width={32} />
                                    </div>
                                    <h1 className="text-2xl font-black tracking-tighter">{t("akwaba.receipt.platform_name")}</h1>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t("akwaba.receipt.platform_desc")}</p>
                                </div>

                                {/* RECEIPT INFO */}
                                <div className="flex justify-between items-end border-b-2 border-dashed border-slate-100 pb-6">
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">{t("akwaba.receipt.reference")} {data.type === 'RDV' ? t("akwaba.receipt.booking") : t("akwaba.receipt.order")}</p>
                                        <p className="text-lg font-black text-primary italic">#{data.code.toUpperCase()}</p>
                                    </div>
                                    <div className="text-right space-y-1">
                                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">{t("akwaba.receipt.issue_date")}</p>
                                        <p className="text-sm font-bold">{data.date}</p>
                                    </div>
                                </div>

                                {/* CLIENT / PROVIDER */}
                                <div className="grid grid-cols-2 gap-8 py-4">
                                    <div className="space-y-2">
                                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">{t("akwaba.receipt.client")}</p>
                                        <div className="space-y-0.5">
                                            <p className="text-sm font-black">{data.clientName}</p>
                                            <p className="text-xs text-slate-500 font-medium">{data.clientPhone || data.clientEmail || 'N/A'}</p>
                                        </div>
                                    </div>
                                    {data.providerName && (
                                        <div className="space-y-2 text-right">
                                            <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">{t("akwaba.receipt.provider")}</p>
                                            <div className="space-y-0.5">
                                                <p className="text-sm font-black">{data.providerName}</p>
                                                <p className="text-xs text-slate-500 font-medium">{data.providerPhone || 'N/A'}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* ITEMS TABLE */}
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center text-[10px] font-black uppercase text-slate-400 tracking-widest border-b border-slate-100 pb-2">
                                        <span>{t("akwaba.receipt.designation")}</span>
                                        <div className="flex gap-8">
                                            <span className="w-12 text-center">{t("akwaba.receipt.quantity")}</span>
                                            <span className="w-24 text-right">{t("akwaba.receipt.total")}</span>
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        {data.items.map((item, index) => (
                                            <div key={index} className="flex justify-between items-start group">
                                                <div className="space-y-0.5">
                                                    <p className="text-sm font-black leading-tight">{item.name}</p>
                                                    <p className="text-[10px] text-slate-400 font-black">{item.price.toLocaleString()} FCFA / {language === 'fr' ? 'unité' : 'unit'}</p>
                                                </div>
                                                <div className="flex gap-8">
                                                    <p className="w-12 text-sm font-black text-center tabular-nums">x{item.quantity}</p>
                                                    <p className="w-24 text-sm font-black text-right tabular-nums">{(item.price * item.quantity).toLocaleString()} FCFA</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* TOTAL */}
                                <div className="mt-8 p-6 bg-slate-50 rounded-3xl space-y-3 relative overflow-hidden">
                                    {/* Watermark icon */}
                                    <Icon icon="solar:shield-check-bold" className="absolute -right-4 -bottom-4 text-slate-200" width={100} />

                                    <div className="flex justify-between items-center relative z-10">
                                        <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">{t("akwaba.receipt.total_amount")}</p>
                                        <p className="text-3xl font-black text-primary tracking-tighter tabular-nums">{data.totalAmount.toLocaleString()} FCFA</p>
                                    </div>

                                    <div className="flex justify-between items-center pt-2 border-t border-slate-200 relative z-10">
                                        <p className="text-[9px] font-bold text-slate-400">{t("akwaba.receipt.payment_status")}</p>
                                        <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full ${data.statusColor.bg} ${data.statusColor.text} text-[10px] font-black`}>
                                            <Icon icon="solar:verified-check-bold-duotone" width={12} />
                                            <span>{data.statusLabel}</span>
                                        </div>
                                    </div>
                                    {data.paymentMethod && (
                                        <div className="flex justify-between items-center relative z-10">
                                            <p className="text-[9px] font-bold text-slate-400">{t("akwaba.receipt.method")}</p>
                                            <p className="text-[10px] font-black uppercase leading-none">{data.paymentMethod}</p>
                                        </div>
                                    )}
                                </div>

                                {/* FOOTER */}
                                <div className="text-center space-y-4 pt-4">
                                    <div className="flex justify-center">
                                        <Icon icon="solar:qr-code-bold-duotone" width={64} className="text-slate-200" />
                                    </div>
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{t("akwaba.receipt.thanks")}</p>
                                </div>
                            </div>

                            <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-3">
                                <button onClick={handlePrint} className="flex-1 py-4 bg-primary text-white rounded-2xl font-black text-xs active:scale-95 transition flex items-center justify-center gap-2 shadow-lg shadow-primary/20">
                                    <Icon icon="solar:printer-minimalistic-bold-duotone" width={18} />
                                    {t("akwaba.receipt.print")}
                                </button>
                                <button onClick={onClose} className="px-6 py-4 bg-white text-slate-900 border border-slate-200 rounded-2xl font-black text-xs active:scale-95 transition">
                                    {t("akwaba.receipt.close")}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>,
        document.body
    );
}