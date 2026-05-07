"use client";

import QRCode from "qrcode";
import Image from "next/image";
import { useState, useEffect } from "react";

interface QrCodeLogoProps {
    user: string | null;
}

const QrCodeLogo: React.FC<QrCodeLogoProps> = ({ user }) => {

    const [isPopupOpen, setIsPopupOpen] = useState(false);
    const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>("");
    const [baseUrl, setBaseUrl] = useState<string>("");

    // Charger automatiquement l'URL réelle du site
    useEffect(() => { if (typeof window !== "undefined") { setBaseUrl(window.location.origin); } }, []);

    // Générer le QR code quand `user` + baseUrl sont prêts
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

    const handleOpenPopup = () => setIsPopupOpen(true);
    const handleClosePopup = () => setIsPopupOpen(false);

    return (
        <div className="relative">

            {/* ICONES DU HAUT */}
            <div className="flex relative">
                <div className="relative block cursor-pointer" onClick={handleOpenPopup} onMouseEnter={handleOpenPopup} onMouseLeave={handleClosePopup}  >
                    <Image src="/icons/qr-code-ring.svg" alt="Scanner pour nous suivre" width={40} height={40} loading="lazy" />
                    {/* Petit QR (ne pas toucher) */}
                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                        {qrCodeDataUrl ? (
                            <Image src="/icons/qr-code.svg" alt="QR Code" width={25} height={25} loading="lazy" />
                        ) : (
                            <div className="w-[25px] h-[25px] bg-muted animate-pulse rounded"></div>
                        )}

                    </div>
                </div>
            </div>

            {/* POPUP */}
            {isPopupOpen && (
                <div
                    className="absolute top-full left-1/2 -translate-x-1/2 mt-1 w-64 bg-card rounded-lg p-4 z-[1050] shadow-lg border border-border"
                    onMouseEnter={() => setIsPopupOpen(true)}
                    onMouseLeave={handleClosePopup}
                >

                    <div className="text-center">
                        <div className="mb-4">

                            {/* QR Code agrandi */}
                            <div className="flex justify-center mb-3">
                                <div className="relative">
                                    <Image
                                        src="/icons/qr-code-ring.svg"
                                        alt="QR Code Ring"
                                        width={180}
                                        height={180}
                                    />

                                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                                        {qrCodeDataUrl ? (
                                            <Image
                                                src={qrCodeDataUrl}
                                                alt="QR Code"
                                                width={150}
                                                height={150}
                                            />
                                        ) : (
                                            <div className="w-[150px] h-[150px] bg-muted animate-pulse rounded"></div>
                                        )}

                                    </div>
                                </div>
                            </div>

                            <p className="text-sm text-[#b07b5e] font-bold mb-3">
                                Scanner pour nous suivre
                            </p>


                            <button onClick={() => window.open(qrCodeLink, "_blank")} className="mt-2 px-4 py-2 bg-[#b07b5e] text-white text-sm rounded-md hover:bg-[#9d6b52]"  >
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
