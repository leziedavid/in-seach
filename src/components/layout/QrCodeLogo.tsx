"use client";

import QRCode from "qrcode";
import Image from "next/image";
import { useState, useEffect, useRef } from "react";

interface QrCodeLogoProps {
    user: string | null;
}

const QrCodeLogo: React.FC<QrCodeLogoProps> = ({ user }) => {

    const [isPopupOpen, setIsPopupOpen] = useState(false);
    const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>("");
    const [baseUrl, setBaseUrl] = useState<string>("");
    const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => { if (typeof window !== "undefined") { setBaseUrl(window.location.origin); } }, []);

    useEffect(() => {
        if (!user || !baseUrl) return;

        const qrLink = `${baseUrl}/connect/${user}`;

        const generateQR = async () => {
            try {
                const url = await QRCode.toDataURL(qrLink, {
                    width: 600,
                    margin: 2,
                    errorCorrectionLevel: "M"
                });
                setQrCodeDataUrl(url);
            } catch (err) {
                console.error("Erreur génération QR code:", err);
            }
        };

        generateQR();
    }, [user, baseUrl]);

    const qrCodeLink = user && baseUrl ? `${baseUrl}/connect/${user}` : "";

    const handleMouseEnter = () => {
        if (closeTimer.current) clearTimeout(closeTimer.current);
        setIsPopupOpen(true);
    };

    const handleMouseLeave = () => {
        closeTimer.current = setTimeout(() => setIsPopupOpen(false), 120);
    };

    return (
        <div className="relative" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
            {/* ICONE TRIGGER */}
            <div className="flex relative">
                <div className="relative block cursor-pointer" onClick={() => setIsPopupOpen((v) => !v)}>
                    <Image
                        src="/icons/qr-code-ring.svg"
                        alt="Scanner pour nous suivre"
                        width={40}
                        height={40}
                        priority />
                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                        {qrCodeDataUrl ? (
                            <Image
                                src="/icons/qr-code.svg"
                                alt="QR Code"
                                width={25}
                                height={25}
                                priority />
                        ) : (
                            <div className="w-[25px] h-[25px] bg-muted animate-pulse rounded" />
                        )}
                    </div>
                </div>
            </div>
            {/* POPUP */}
            {isPopupOpen && (
                <div
                    className="absolute top-full left-1/2 -translate-x-1/2 mt-1 w-64 bg-card rounded-lg p-4 z-[1050] shadow-lg border border-border"
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={handleMouseLeave}
                >
                    <div className="text-center">
                        <div className="mb-4">
                            <div className="flex justify-center mb-3">
                                <div className="relative">
                                    <Image
                                        src="/icons/qr-code-ring.svg"
                                        alt="QR Code Ring"
                                        width={180}
                                        height={180} />
                                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                                        {qrCodeDataUrl ? (
                                            <Image
                                                src={qrCodeDataUrl}
                                                alt="QR Code"
                                                width={150}
                                                height={150} />
                                        ) : (
                                            <div className="w-[150px] h-[150px] bg-muted animate-pulse rounded" />
                                        )}
                                    </div>
                                </div>
                            </div>

                            <p className="text-sm text-[#b07b5e] font-bold mb-3">
                                Scanner pour nous suivre
                            </p>

                            <button onClick={() => window.open(qrCodeLink, "_blank")} className="mt-2 px-4 py-2 bg-[#b07b5e] text-white text-sm rounded-md hover:bg-[#9d6b52]">
                                Ouvrir le lien
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default QrCodeLogo;
