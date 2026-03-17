'use client';

import React from 'react';
import { Settings, Save, Globe, Lock, Bell, Palette, Database, Code, Info, ShieldCheck, Zap, Activity } from 'lucide-react';
import { useNotification } from '@/components/toast/NotificationProvider';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

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

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-8">
                    {sections.map((section, idx) => (
                        <Card key={idx} className="rounded-lg border-border/50 shadow-xs overflow-hidden">
                            <CardHeader className="p-8 pb-4 bg-muted/20 border-b border-border/30">
                                <div className="flex items-center gap-4">
                                    <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20 text-primary">
                                        <section.icon className="w-5 h-5" />
                                    </div>
                                    <CardTitle className="text-lg font-black">{section.title}</CardTitle>
                                </div>
                            </CardHeader>
                            <CardContent className="p-8 space-y-10">
                                {section.items.map((item) => (
                                    <div key={item.id} className="flex items-start justify-between gap-6">
                                        <div className="flex gap-4">
                                            <div className="mt-1 p-1.5 bg-muted rounded-lg">
                                                <item.icon className="w-4 h-4 text-muted-foreground" />
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-black mb-1">{item.label}</h4>
                                                <p className="text-muted-foreground text-xs font-medium leading-relaxed max-w-sm">{item.description}</p>
                                            </div>
                                        </div>
                                        <Switch
                                            checked={settings[item.id as keyof AdminSettings]}
                                            onCheckedChange={(val) => setSettings({ ...settings, [item.id]: val })}
                                        />
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    ))}
                </div>

                <div className="space-y-8">
                    <Card className="rounded-lg bg-primary border-primary/20 p-10 text-primary-foreground shadow-lg shadow-primary/20 relative overflow-hidden group border">
                        <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32 transition-transform duration-700 group-hover:scale-110"></div>
                        <div className="relative space-y-6">
                            <Database className="w-10 h-10" />
                            <div>
                                <h2 className="text-2xl font-black mb-2">Base de Données</h2>
                                <p className="text-primary-foreground/80 font-medium leading-relaxed text-sm">
                                    Gérer les sauvegardes, effectuer des migrations de données ou réinitialiser certaines tables de cache système.
                                </p>
                            </div>
                            <div className="flex flex-col gap-3 pt-2">
                                <Button variant="secondary" className="w-full h-12 rounded-xl font-bold bg-white/20 hover:bg-white/30 border-white/10 text-white">
                                    Lancer une sauvegarde
                                </Button>
                                <Button variant="ghost" className="w-full h-12 rounded-xl font-bold text-white hover:bg-white/10">
                                    Nettoyer les fichiers temporaires
                                </Button>
                            </div>
                        </div>
                    </Card>

                    <Card className="rounded-lg border-border/50 p-10 shadow-xs bg-card">
                        <Palette className="w-10 h-10 text-primary mb-6" />
                        <h2 className="text-2xl font-black mb-2">Personnalisation</h2>
                        <p className="text-muted-foreground font-medium mb-8 leading-relaxed text-sm">
                            Configurez l'aspect visuel de votre dashboard admin, changez le thème principal ou importez votre propre logo.
                        </p>
                        <div className="grid grid-cols-4 gap-4 mb-8">
                            {['#6366f1', '#f59e0b', '#10b981', '#ef4444'].map((color, i) => (
                                <div key={i} className={`h-10 rounded-xl cursor-pointer border-2 shadow-xs transition-all hover:scale-105 ${i === 0 ? 'border-primary ring-2 ring-primary/20' : 'border-transparent'}`} style={{ backgroundColor: color }}></div>
                            ))}
                        </div>
                        <Button variant="outline" className="w-full h-12 rounded-xl font-bold border-border/50">
                            Accéder à l'éditeur visuel
                        </Button>
                    </Card>
                </div>
            </div>
        </div>
    );
}
