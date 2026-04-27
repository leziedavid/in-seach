'use client';

import React from 'react';
import { Settings, Save, Globe, Lock, Bell, Palette, Database, Code, Info, ShieldCheck, Zap, Activity } from 'lucide-react';
import { useNotification } from '@/components/toast/NotificationProvider';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import SeedAdminManager from '@/components/admin/SeedAdminManager';

interface AdminSettings {
    maintenanceMode: boolean;
    userRegistration: boolean;
    emailNotifications: boolean;
    highPerformanceMode: boolean;
    realtimeLogs: boolean;
    analyticsEnabled: boolean;
}

export default function AdminSettingsPage() {

    const { addNotification } = useNotification();
    const [settings, setSettings] = React.useState<AdminSettings>({
        maintenanceMode: false,
        userRegistration: true,
        emailNotifications: true,
        highPerformanceMode: true,
        realtimeLogs: false,
        analyticsEnabled: true
    });

    const handleSave = () => {
        addNotification("Paramètres sauvegardés avec succès", "success");
    };

    const sections = [
        {
            title: "Général",
            icon: Globe,
            items: [
                { id: 'maintenanceMode', label: "Mode Maintenance", description: "Désactive l'accès public au site pour les utilisateurs non-admins.", icon: Lock },
                { id: 'userRegistration', label: "Inscriptions ouvertes", description: "Permettre aux nouveaux utilisateurs de créer un compte.", icon: ShieldCheck }
            ]
        },
        {
            title: "Système & Performance",
            icon: Activity,
            items: [
                { id: 'highPerformanceMode', label: "Mode Haute Performance", description: "Active le cache agressif et l'optimisation des requêtes.", icon: Zap },
                { id: 'realtimeLogs', label: "Logs en temps réel", description: "Diffusion en direct des événements système sur le dashboard.", icon: Code }
            ]
        },
        {
            title: "Communications",
            icon: Bell,
            items: [
                { id: 'emailNotifications', label: "Notifications Email", description: "Envoi automatique d'emails pour les réservations et paiements.", icon: Bell },
                { id: 'analyticsEnabled', label: "Télémétrie & Analyse", description: "Collecte anonyme de données d'utilisation pour amélioration.", icon: Info }
            ]
        }
    ];

    return (
        <div className="p-8 space-y-8 animate-in fade-in duration-500">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black tracking-tight mb-1">Paramètres</h1>
                    <p className="text-muted-foreground font-medium text-sm">Configuration globale de la plateforme et des fonctionnalités systèmes.</p>
                </div>
                <Button onClick={handleSave} className="rounded-lg font-bold gap-2 px-8" >
                    <Save className="w-4 h-4" />
                    Enregistrer
                </Button>
            </header>
            <SeedAdminManager />

        </div>
    );
}
