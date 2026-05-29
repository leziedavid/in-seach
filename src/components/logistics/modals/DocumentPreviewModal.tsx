"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Icon } from "@iconify/react";
import { createPortal } from "react-dom";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import Image from "next/image";

interface DocumentPreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    data: any | null; // Data from /document-data
    type: 'FACTURE' | 'BON_COMMANDE';
}

export default function DocumentPreviewModal({ isOpen, onClose, data, type }: DocumentPreviewModalProps) {
    const [mounted, setMounted] = useState(false);
    const documentRef = useRef<HTMLDivElement>(null);

    useEffect(() => { setMounted(true); }, []);

    if (!data || !mounted) return null;

    const documentNumber = type === 'FACTURE'
        ? `FACT-${data.quote.id.slice(0, 4).toUpperCase()}-${data.trackingCode.slice(-4).toUpperCase()}`
        : `BC-${data.quote.id.slice(0, 4).toUpperCase()}-${data.trackingCode.slice(-4).toUpperCase()}`;

    const handlePrint = () => {
        const printContent = documentRef.current;
        if (!printContent) return;

        const printStyles = `
            <style>
                @page {
                    size: A4;
                    margin: 0;
                }
                @media print {
                    @page { margin: 0; }
                    body {
                        margin: 0 !important;
                        padding: 0 !important;
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                    }
                    #print-area {
                        width: 210mm !important;
                        min-height: 297mm;
                        height: auto;
                        padding: 15mm !important;
                        margin: 0 auto !important;
                        background: white !important;
                        box-sizing: border-box;
                    }
                    /* Force desktop-like layout in print (ignoring mobile responsive classes) */
                    .md\\:flex-row { flex-direction: row !important; }
                    .md\\:grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
                    .md\\:text-right { text-align: right !important; }
                    .md\\:p-16 { padding: 4rem !important; }
                    .md\\:mb-16 { margin-bottom: 4rem !important; }
                    .md\\:gap-12 { gap: 3rem !important; }
                    .md\\:pl-12 { padding-left: 3rem !important; }

                    .no-print { display: none !important; }
                    * { -webkit-print-color-adjust: exact !important; }
                }
            </style>
        `;

        const newWindow = window.open('', '_blank');
        if (newWindow) {
            newWindow.document.write('<html><head><title>' + (type === 'FACTURE' ? 'Facture' : 'Bon de Commande') + ' - ' + documentNumber + '</title>');
            newWindow.document.write(printStyles);
            document.querySelectorAll('link[rel="stylesheet"], style').forEach(node => {
                newWindow.document.write(node.outerHTML);
            });
            newWindow.document.write('</head><body class="bg-white">');
            newWindow.document.write('<div id="print-area">' + printContent.innerHTML + '</div>');
            newWindow.document.write('</body></html>');
            newWindow.document.close();
            
            // Wait slightly longer for heavy assets/icons
            setTimeout(() => {
                newWindow.focus();
                newWindow.print();
                // Optionally close after print, but some browsers block this
                // newWindow.close();
            }, 1000);
        }
    };

    const company = data.quote.receiver;
    const client = data.quote.sender;
    const quote = data.quote;

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }} 
                        exit={{ opacity: 0 }} 
                        onClick={onClose} 
                        className="fixed inset-0 bg-[#0F2944]/40 backdrop-blur-sm z-[1000]"
                    />
                    <motion.div 
                        initial={{ y: "100%", opacity: 0 }} 
                        animate={{ y: 0, opacity: 1 }} 
                        exit={{ y: "100%", opacity: 0 }}
                        className="fixed inset-0 flex items-center justify-center z-[1001] pointer-events-none p-2 md:p-4"
                    >
                        <motion.div 
                            className="bg-[#FBFAF6] text-[#0F2944] shadow-[0_8px_48px_rgba(15,41,68,0.16)] overflow-hidden flex flex-col w-full max-w-5xl max-h-[98vh] md:max-h-[95vh] rounded-[1.5rem] md:rounded-[2.5rem] pointer-events-auto border border-[#EEF1F4]"
                            initial={{ scale: 0.95 }} 
                            animate={{ scale: 1 }} 
                            transition={{ type: "spring", damping: 25 }} 
                        >
                            {/* Header UI */}
                            <div className="px-4 md:px-8 py-3 md:py-4 flex items-center justify-between border-b border-slate-100 bg-white sticky top-0 z-10">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                                        <Icon icon={type === 'FACTURE' ? "solar:bill-list-bold-duotone" : "solar:clipboard-list-bold-duotone"} className="w-5 h-5 md:w-6 md:h-6" />
                                    </div>
                                    <div>
                                        <h2 className="text-xs md:text-sm font-black uppercase tracking-tight">Prévisualisation</h2>
                                        <p className="text-[8px] md:text-[10px] text-slate-400 font-bold uppercase tracking-widest">{type === 'FACTURE' ? 'Facture Client' : 'Bon de Commande'}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button onClick={handlePrint} className="h-8 md:h-10 px-4 md:px-6 bg-primary text-white rounded-lg md:rounded-xl font-black text-[9px] md:text-[10px] uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2">
                                        <Icon icon="solar:printer-minimalistic-bold-duotone" width={16} />
                                        IMPRIMER
                                    </button>
                                    <button onClick={onClose} className="w-8 h-8 md:w-10 md:h-10 bg-slate-50 text-slate-400 rounded-lg md:rounded-xl hover:bg-slate-100 transition flex items-center justify-center">
                                        <Icon icon="solar:close-circle-bold" width={20} />
                                    </button>
                                </div>
                            </div>

                            {/* Document Render Area */}
                            <div className="flex-1 overflow-auto bg-slate-100/50 p-2 md:p-8 flex justify-center">
                                <div ref={documentRef} className="bg-white shadow-2xl border border-slate-200 w-full max-w-[210mm] min-h-fit md:min-h-[297mm] p-6 md:p-16 text-slate-800 flex flex-col">
                                    
                                    {/* Brand & Type */}
                                    <div className="flex flex-col md:flex-row justify-between items-start gap-8 md:gap-4 mb-10 md:mb-16">
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-3">
                                                {company.logo ? (
                                                    <div className="relative w-12 h-12 md:w-16 md:h-16 overflow-hidden">
                                                        <Image src={company.logo} alt="Logo" fill className="object-contain" unoptimized />
                                                    </div>
                                                ) : (
                                                    <div className="w-12 h-12 md:w-14 md:h-14 bg-primary text-white rounded-2xl flex items-center justify-center shadow-xl shadow-primary/20">
                                                        <Icon icon="solar:globus-bold-duotone" width={32} />
                                                    </div>
                                                )}
                                                <div className="space-y-0.5">
                                                    <h1 className="text-xl md:text-2xl font-black tracking-tighter uppercase leading-none">{company.companyName || company.fullName}</h1>
                                                    <p className="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-slate-400">Logistique & Transport International</p>
                                                </div>
                                            </div>
                                            <div className="text-[10px] md:text-xs space-y-1 font-medium text-slate-500 max-w-xs">
                                                <p className="flex items-center gap-2">
                                                    <Icon icon="solar:map-point-bold-duotone" className="text-slate-300" width={14} />
                                                    {company.siegeSocial || "Siège Social, Abidjan, Côte d'Ivoire"}
                                                </p>
                                                {company.boitePostale && (
                                                    <p className="flex items-center gap-2">
                                                        <Icon icon="solar:mailbox-bold-duotone" className="text-slate-300" width={14} />
                                                        {company.boitePostale}
                                                    </p>
                                                )}
                                                <p className="flex items-center gap-2">
                                                    <Icon icon="solar:phone-bold-duotone" className="text-slate-300" width={14} />
                                                    {company.phone || "+225 00 00 00 00"}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="w-full md:w-auto md:text-right">
                                            <div className="inline-block px-4 py-1.5 bg-secondary text-white rounded-lg mb-3">
                                                <h2 className="text-sm md:text-base font-black uppercase tracking-widest">{type === 'FACTURE' ? 'FACTURE' : 'BON DE COMMANDE'}</h2>
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase">Numéro de document</p>
                                                <p className="text-base md:text-lg font-black tracking-tight italic">#{documentNumber}</p>
                                                <div className="h-2 md:h-4" />
                                                <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase">Date d'émission</p>
                                                <p className="text-xs md:text-sm font-black">{format(new Date(), "dd MMMM yyyy", { locale: fr })}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Client & Delivery Info */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-12 bg-slate-50 rounded-2xl md:rounded-[2rem] p-4 md:p-8 mb-8 md:mb-12 border border-slate-100">
                                        <div className="space-y-3 md:space-y-4">
                                            <div className="flex items-center gap-2 text-[9px] md:text-[10px] font-black text-primary uppercase tracking-widest">
                                                <div className="w-1.5 h-3 md:h-4 bg-primary rounded-full" />
                                                Client
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-base md:text-lg font-black uppercase">{client.fullName}</p>
                                                <div className="text-[10px] md:text-xs space-y-1 md:space-y-1.5 font-medium text-slate-600">
                                                    <p className="flex items-center gap-2"><Icon icon="solar:letter-bold" className="text-slate-300" /> {client.email}</p>
                                                    <p className="flex items-center gap-2"><Icon icon="solar:phone-bold" className="text-slate-300" /> {client.phone || "N/A"}</p>
                                                    <p className="pt-2 italic text-[9px] md:text-[10px] border-t border-slate-200 mt-2">Livraison: {quote.arrivalAddress}</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="space-y-3 md:space-y-4 md:border-l border-slate-200 md:pl-12 pt-4 md:pt-0 border-t md:border-t-0">
                                            <div className="flex items-center gap-2 text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                                <Icon icon="solar:info-circle-bold-duotone" />
                                                Référence Tracking
                                            </div>
                                            <div className="space-y-2 md:space-y-3">
                                                <div>
                                                    <p className="text-[8px] md:text-[9px] font-black uppercase text-slate-400">Code Suivi</p>
                                                    <p className="text-sm md:text-md font-black tracking-widest text-primary">{data.trackingCode}</p>
                                                </div>
                                                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                                                    <div>
                                                        <p className="text-[8px] md:text-[9px] font-black uppercase text-slate-400">Transport</p>
                                                        <p className="text-[9px] md:text-[10px] font-black uppercase">{quote.transportType}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-[8px] md:text-[9px] font-black uppercase text-slate-400">Poids/Vol</p>
                                                        <p className="text-[9px] md:text-[10px] font-black uppercase">{quote.weight}kg / {quote.volume}m³</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Items Table */}
                                    <div className="flex-1 overflow-x-auto min-w-0">
                                        <table className="w-full text-left mb-10 md:mb-12">
                                            <thead>
                                                <tr className="border-b-2 border-slate-900 border-opacity-5">
                                                    <th className="py-3 md:py-4 text-[9px] md:text-[10px] font-black uppercase tracking-widest text-slate-400">Service</th>
                                                    <th className="py-3 md:py-4 text-[9px] md:text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Qté</th>
                                                    <th className="py-3 md:py-4 text-[9px] md:text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Prix</th>
                                                    <th className="py-3 md:py-4 text-[9px] md:text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Total HT</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                <tr>
                                                    <td className="py-4 md:py-6 pr-4 md:pr-8">
                                                        <p className="font-black text-xs md:text-sm uppercase mb-0.5">{quote.service.label}</p>
                                                        <p className="text-[9px] md:text-xs text-slate-500 italic leading-tight">{quote.departureAddress.split(',')[0]} → {quote.arrivalAddress.split(',')[0]}</p>
                                                    </td>
                                                    <td className="py-4 md:py-6 text-center font-black text-xs md:text-sm">1</td>
                                                    <td className="py-4 md:py-6 text-right font-black text-xs md:text-sm whitespace-nowrap">{(quote.montantTransac || 0).toLocaleString()} F</td>
                                                    <td className="py-4 md:py-6 text-right font-black text-xs md:text-sm whitespace-nowrap">{(quote.montantTransac || 0).toLocaleString()} F</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Logistics Detail (Flex on mobile) */}
                                    {(data.drivers?.length > 0 || data.flotes?.length > 0) && (
                                        <div className="mb-8 md:mb-12 grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
                                            {data.drivers?.length > 0 && (
                                                <div className="p-4 md:p-6 bg-slate-50 rounded-xl md:rounded-2xl border border-slate-100">
                                                    <p className="text-[9px] md:text-[10px] font-black uppercase text-primary mb-3 md:mb-4 tracking-widest border-b border-primary/20 pb-2">Chauffeurs</p>
                                                    <div className="space-y-3">
                                                        {data.drivers.map((d: any) => (
                                                            <div key={d.id} className="flex items-center gap-3">
                                                                <div className="w-7 h-7 md:w-8 md:h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-[9px] md:text-[10px] font-black text-slate-400">{d.fullName.charAt(0)}</div>
                                                                <div>
                                                                    <p className="text-[10px] md:text-[11px] font-black uppercase">{d.fullName}</p>
                                                                    <p className="text-[8px] md:text-[9px] text-slate-500 font-bold tracking-tight">{d.phone}</p>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                            {data.flotes?.length > 0 && (
                                                <div className="p-4 md:p-6 bg-slate-50 rounded-xl md:rounded-2xl border border-slate-100">
                                                    <p className="text-[9px] md:text-[10px] font-black uppercase text-secondary mb-3 md:mb-4 tracking-widest border-b border-secondary/20 pb-2">Engins</p>
                                                    <div className="space-y-3">
                                                        {data.flotes.map((f: any) => (
                                                            <div key={f.id} className="flex items-center gap-3">
                                                                <div className="w-7 h-7 md:w-8 md:h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center">
                                                                    <Icon icon={f.type === 'AVION' ? 'solar:plain-bold' : f.type === 'BATEAU' ? 'solar:ship-bold' : 'solar:bus-bold'} className="w-4 h-4 md:w-5 md:h-5 text-slate-300" />
                                                                </div>
                                                                <div>
                                                                    <p className="text-[10px] md:text-[11px] font-black uppercase">{f.name}</p>
                                                                    <p className="text-[8px] md:text-[9px] text-slate-500 font-bold tracking-widest uppercase">{f.immatriculation}</p>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Signature & Totals */}
                                    <div className="mt-auto pt-10 md:pt-16">
                                        <div className="flex flex-col-reverse md:flex-row justify-between items-center md:items-end gap-10 md:gap-4">
                                            <div className="w-full md:w-auto space-y-4">
                                                <div className="p-3 md:p-4 bg-slate-50 border border-slate-100 rounded-xl md:rounded-2xl w-full md:w-48 text-center relative overflow-hidden flex flex-col items-center justify-center min-h-[80px]">
                                                    <p className="text-[8px] md:text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest relative z-10">Cachet & Signature</p>
                                                    {company.signature ? (
                                                        <div className="relative w-full h-12 md:h-16 opacity-80 mix-blend-multiply">
                                                            <Image src={company.signature} alt="Signature" fill className="object-contain" unoptimized />
                                                        </div>
                                                    ) : (
                                                        <div className="h-8 md:h-12" />
                                                    )}
                                                </div>
                                                <p className="text-[8px] md:text-[9px] font-medium text-slate-400 max-w-xs leading-relaxed italic border-t border-slate-100 pt-3 uppercase tracking-tighter text-center md:text-left">
                                                    {type === 'FACTURE'
                                                        ? "Cette facture est payable sous 15 jours. En cas de retard, des pénalités seront appliquées."
                                                        : "Ce bon de commande atteste de la mise en place des moyens logistiques pour la mission."}
                                                </p>
                                            </div>

                                            <div className="w-full md:w-72 space-y-2 md:space-y-3">
                                                <div className="flex justify-between items-center text-slate-500">
                                                    <p className="text-[10px] md:text-xs font-black uppercase tracking-widest">Sous-Total</p>
                                                    <p className="text-xs md:text-sm font-black tabular-nums">{(quote.montantTransac || 0).toLocaleString()} F</p>
                                                </div>
                                                <div className="flex justify-between items-center text-slate-400">
                                                    <p className="text-[8px] md:text-[10px] font-black uppercase tracking-widest">TVA (0%)</p>
                                                    <p className="text-[10px] md:text-xs font-black tabular-nums">0 F</p>
                                                </div>
                                                <div className="flex justify-between items-center bg-secondary text-white px-5 py-3 md:px-6 md:py-3.5 rounded-xl shadow-lg shadow-secondary/10">
                                                    <p className="text-[10px] md:text-xs font-black uppercase tracking-widest">Total Net</p>
                                                    <p className="text-lg md:text-xl font-black tabular-nums">{(quote.montantTransac || 0).toLocaleString()} F</p>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div className="mt-10 md:mt-16 pt-6 md:pt-8 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4 opacity-30 grayscale text-center md:text-left">
                                            <div className="flex gap-4">
                                                <Icon icon="logos:visa" width={32} />
                                                <Icon icon="logos:mastercard" width={32} />
                                                <Icon icon="solar:safe-square-bold" width={24} />
                                            </div>
                                            <div className="flex flex-col md:items-end">
                                                <p className="text-[8px] md:text-[9px] font-black uppercase tracking-widest">{data.quote.receiver.fullName}</p>
                                                <p className="text-[7px] md:text-[8px] font-bold text-slate-400 uppercase">Djamko Logistics Platform</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>,
        document.body
    );
}
