"use client";

import { useState } from "react";
import { Icon } from "@iconify/react";

interface InstallStep {
    icon: string;
    title: string;
    description: string;
}

const ANDROID_STEPS: InstallStep[] = [
    { icon: "solar:global-bold-duotone", title: "Ouvrez www.djamko.com dans Chrome", description: "L'installation fonctionne depuis le navigateur Chrome (déjà présent sur la quasi-totalité des téléphones Android)." },
    { icon: "solar:menu-dots-bold", title: "Ouvrez le menu du navigateur", description: "Appuyez sur les trois points en haut à droite de Chrome." },
    { icon: "solar:add-square-bold-duotone", title: "Sélectionnez « Installer l'application »", description: "Ou « Ajouter à l'écran d'accueil » selon la version de Chrome. Confirmez l'installation." },
    { icon: "solar:shield-check-bold-duotone", title: "Acceptez les autorisations", description: "Au premier lancement, autorisez la localisation et les notifications lorsque Djamko vous les demande — cela permet un fonctionnement optimal de l'application." },
    { icon: "solar:bell-bold-duotone", title: "Activez les notifications", description: "Depuis Paramètres > Notifications dans l'application, activez-les pour ne rater aucune commande, réservation ou message." },
];

const IOS_STEPS: InstallStep[] = [
    { icon: "solar:compass-big-bold-duotone", title: "Ouvrez le site avec Safari", description: "L'installation en PWA n'est possible que depuis Safari sur iPhone (pas Chrome ni un navigateur tiers)." },
    { icon: "solar:export-bold-duotone", title: "Appuyez sur « Partager »", description: "L'icône de partage se trouve dans la barre du bas (ou en haut selon les modèles)." },
    { icon: "solar:widget-add-bold-duotone", title: "Sélectionnez « Sur l'écran d'accueil »", description: "Faites défiler la liste des options si nécessaire pour la trouver." },
    { icon: "solar:check-circle-bold-duotone", title: "Appuyez sur « Ajouter »", description: "Confirmez en haut à droite : l'icône Djamko apparaît alors sur votre écran d'accueil." },
    { icon: "solar:phone-bold-duotone", title: "Ouvrez l'application", description: "Lancez Djamko depuis son icône, exactement comme une application classique." },
    { icon: "solar:shield-check-bold-duotone", title: "Acceptez les autorisations", description: "Autorisez la localisation lorsqu'iOS vous le demande, pour profiter de toutes les fonctionnalités." },
    { icon: "solar:bell-bold-duotone", title: "Activez les notifications", description: "Depuis Paramètres > Notifications dans l'application, activez-les pour rester informé en temps réel." },
];

export default function InstallGuide() {
    const [platform, setPlatform] = useState<"android" | "ios">("android");
    const steps = platform === "android" ? ANDROID_STEPS : IOS_STEPS;

    return (
        <div>
            <div className="flex bg-muted/50 p-1 rounded-2xl mb-8 w-full max-w-xs mx-auto">
                <button
                    onClick={() => setPlatform("android")}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all ${platform === "android" ? "bg-white dark:bg-zinc-800 text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                >
                    <Icon icon="solar:smartphone-2-bold-duotone" width={16} />
                    Android
                </button>
                <button
                    onClick={() => setPlatform("ios")}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all ${platform === "ios" ? "bg-white dark:bg-zinc-800 text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                >
                    <Icon icon="solar:iphone-bold-duotone" width={16} />
                    iPhone
                </button>
            </div>

            <ol className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-3xl mx-auto">
                {steps.map((step, i) => (
                    <li key={i} className="flex gap-3 p-4 rounded-2xl bg-card border border-border">
                        <span className="shrink-0 w-8 h-8 rounded-full bg-primary/10 text-primary font-black text-sm flex items-center justify-center">
                            {i + 1}
                        </span>
                        <div className="min-w-0">
                            <div className="flex items-center gap-1.5 mb-1">
                                <Icon icon={step.icon} className="w-3.5 h-3.5 text-primary shrink-0" />
                                <p className="font-bold text-foreground text-sm truncate">{step.title}</p>
                            </div>
                            <p className="text-xs text-muted-foreground leading-relaxed">{step.description}</p>
                        </div>
                    </li>
                ))}
            </ol>
        </div>
    );
}
