"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import SimulationLoader from "@/components/home/SimulationLoader";
import { Role } from "@/types/interface";
import { reconnectUser } from "@/api/api";
import { motion, AnimatePresence } from "framer-motion";
import { Icon } from "@iconify/react";

export default function ConnectPage() {
    const params = useParams();
    const router = useRouter();
    const userId = params.id as string;

    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState("Initialisation...");
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!userId) {
            setError("ID utilisateur manquant.");
            setLoading(false);
            return;
        }

        const handleReconnect = async () => {
            try {
                setStatus("Authentification sécurisée...");
                await new Promise(resolve => setTimeout(resolve, 1500)); // Delay for simulation feel

                setStatus("Génération des nouveaux jetons...");
                const res = await reconnectUser(userId);

                if (res.statusCode === 200 && res.data) {
                    const { accessToken, refreshToken, user } = res.data;

                    setStatus("Mise à jour de la session...");
                    localStorage.setItem('access_token', accessToken);
                    localStorage.setItem('refresh_token', refreshToken);
                    document.cookie = `token=${accessToken}; path=/`;

                    setSuccess(true);
                    setStatus(`Bienvenue, ${user?.fullName || user?.email || 'Utilisateur'}`);

                    await new Promise(resolve => setTimeout(resolve, 1000));

                    if (user?.role === Role.ADMIN) {
                        router.push('/dashboard/compte');
                    } else {
                        router.push('/');
                    }
                } else {
                    throw new Error(res.message || "Erreur de connexion");
                }
            } catch (err: any) {
                console.error(err);
                setError(err.message || "Une erreur est survenue");
            } finally {
                setLoading(false);
            }
        };

        handleReconnect();
    }, [userId, router]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
            {/* Background Decorative Elements */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-20">
                <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/20 rounded-full blur-3xl animate-pulse" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
            </div>

            <AnimatePresence mode="wait">
                {loading ? (
                    <SimulationLoader key="loader" status={status} />
                ) : error ? (
                    <motion.div
                        key="error"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-card/50 backdrop-blur-xl border border-destructive/20 p-8 rounded-3xl shadow-2xl max-w-sm w-full text-center space-y-4"
                    >
                        <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto">
                            <Icon icon="solar:shield-warning-bold-duotone" className="w-8 h-8 text-destructive" />
                        </div>
                        <h2 className="text-xl font-bold">Échec de la simulation</h2>
                        <p className="text-muted-foreground text-sm">{error}</p>
                        <button
                            onClick={() => router.push('/')}
                            className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-semibold hover:opacity-90 transition-opacity"
                        >
                            Retour à l'accueil
                        </button>
                    </motion.div>
                ) : success ? (
                    <motion.div
                        key="success"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-card/50 backdrop-blur-xl border border-primary/20 p-10 rounded-3xl shadow-2xl max-w-sm w-full text-center space-y-6"
                    >
                        <div className="relative w-24 h-24 mx-auto">
                            <motion.div
                                className="absolute inset-0 border-2 border-primary rounded-full"
                                animate={{ scale: [1, 1.4], opacity: [1, 0] }}
                                transition={{ duration: 1.5, repeat: Infinity }}
                            />
                            <div className="absolute inset-0 flex items-center justify-center bg-primary text-primary-foreground rounded-full shadow-lg">
                                <Icon icon="solar:check-circle-bold" className="w-12 h-12" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <h2 className="text-2xl font-bold tracking-tight">Session prête</h2>
                            <p className="text-muted-foreground font-medium">{status}</p>
                        </div>
                        <div className="flex justify-center gap-1.5 pt-2">
                            {[0, 1, 2].map(i => (
                                <motion.div
                                    key={i}
                                    animate={{ scale: [1, 1.5, 1], opacity: [0.3, 1, 0.3] }}
                                    transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.1 }}
                                    className="w-2 h-2 rounded-full bg-primary"
                                />
                            ))}
                        </div>
                    </motion.div>
                ) : null}
            </AnimatePresence>
        </div>
    );
}
