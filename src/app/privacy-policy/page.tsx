"use client"

import React from 'react'
import { Icon } from '@iconify/react'

export default function PrivacyPolicy() {
    return (
        <div className="container mx-auto px-4 py-12 max-w-4xl">
            <div className="flex items-center gap-3 mb-8">
                <div className="p-3 bg-indigo-500/10 rounded-2xl text-indigo-600 dark:text-indigo-400">
                    <Icon icon="solar:shield-check-bold-duotone" width="32" />
                </div>
                <h1 className="text-3xl font-black">Politique de Confidentialité</h1>
            </div>

            <div className="prose prose-slate dark:prose-invert max-w-none space-y-8">
                <section className="bg-card border border-border p-8 rounded-3xl shadow-sm transition-all hover:shadow-md">
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-primary">
                        <Icon icon="solar:user-id-bold-duotone" width="24" />
                        Types de données collectées
                    </h2>
                    <p className="text-muted-foreground leading-relaxed mb-4">
                        Pour assurer le bon fonctionnement de nos services, nous collectons les informations suivantes :
                    </p>
                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-muted-foreground list-none pl-0">
                        <li className="flex items-center gap-2 p-3 bg-muted/30 rounded-xl">
                            <Icon icon="solar:check-circle-bold" className="text-green-500" /> Informations d'identité (Nom, Prénom)
                        </li>
                        <li className="flex items-center gap-2 p-3 bg-muted/30 rounded-xl">
                            <Icon icon="solar:check-circle-bold" className="text-green-500" /> Contact (Email, Téléphone)
                        </li>
                        <li className="flex items-center gap-2 p-3 bg-muted/30 rounded-xl">
                            <Icon icon="solar:check-circle-bold" className="text-green-500" /> Données de géolocalisation pour le dépannage
                        </li>
                        <li className="flex items-center gap-2 p-3 bg-muted/30 rounded-xl">
                            <Icon icon="solar:check-circle-bold" className="text-green-500" /> Historique des commandes et prestations
                        </li>
                    </ul>
                </section>

                <section className="bg-card border border-border p-8 rounded-3xl shadow-sm transition-all hover:shadow-md">
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-primary">
                        <Icon icon="solar:settings-minimalistic-bold-duotone" width="24" />
                        Utilisation des données
                    </h2>
                    <p className="text-muted-foreground leading-relaxed">
                        Vos données sont utilisées pour :
                    </p>
                    <ul className="list-disc pl-6 mt-4 space-y-2 text-muted-foreground">
                        <li>Faciliter la mise en relation avec les prestataires.</li>
                        <li>Gérer vos commandes de produits sur la marketplace.</li>
                        <li>Assurer la sécurité de votre compte et prévenir la fraude.</li>
                        <li>Améliorer l'expérience utilisateur et nos algorithmes de matching.</li>
                    </ul>
                </section>

                <section className="bg-card border border-border p-8 rounded-3xl shadow-sm transition-all hover:shadow-md">
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-primary">
                        <Icon icon="solar:share-bold-duotone" width="24" />
                        Partage et Sécurité
                    </h2>
                    <p className="text-muted-foreground leading-relaxed">
                        Nous partageons uniquement les données nécessaires à l'exécution de vos demandes :
                    </p>
                    <ul className="list-disc pl-6 mt-4 space-y-2 text-muted-foreground">
                        <li>Vos coordonnées sont transmises au Prestataire que vous avez sollicité.</li>
                        <li>Vos informations de livraison sont partagées avec le Vendeur lors d'un achat.</li>
                        <li>Nous utilisons des protocoles de sécurité avancés pour protéger vos données contre tout accès non autorisé.</li>
                    </ul>
                </section>

                <section className="bg-card border border-border p-8 rounded-3xl shadow-sm transition-all hover:shadow-md">
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-primary">
                        <Icon icon="solar:user-speak-bold-duotone" width="24" />
                        Vos Droits
                    </h2>
                    <p className="text-muted-foreground leading-relaxed">
                        Conformément à la réglementation sur la protection des données, vous disposez d'un droit :
                    </p>
                    <ul className="list-disc pl-6 mt-4 space-y-2 text-muted-foreground">
                        <li><strong>D'accès :</strong> Consulter les données que nous détenons sur vous.</li>
                        <li><strong>De rectification :</strong> Modifier vos informations erronées.</li>
                        <li><strong>De suppression :</strong> Demander la fermeture de votre compte et l'effacement de vos données privées.</li>
                    </ul>
                    <p className="mt-4 text-sm text-indigo-600 font-bold bg-indigo-50 dark:bg-indigo-950/30 p-4 rounded-2xl">
                        Pour toute demande, contactez notre support via l'interface d'aide de l'application.
                    </p>
                </section>

                <section className="bg-card border border-border p-8 rounded-3xl shadow-sm transition-all hover:shadow-md">
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-primary">
                        <Icon icon="solar:cookie-bold-duotone" width="24" />
                        Cookies
                    </h2>
                    <p className="text-muted-foreground leading-relaxed">
                        Nous utilisons des cookies essentiels pour maintenir votre session active et des cookies analytiques pour comprendre l'utilisation de la plateforme. Vous pouvez gérer vos préférences via les réglages de votre navigateur.
                    </p>
                </section>

                <div className="text-center pt-8 text-sm text-muted-foreground italic">
                    Dernière mise à jour : 09 Mars 2026
                </div>
            </div>
        </div>
    )
}
