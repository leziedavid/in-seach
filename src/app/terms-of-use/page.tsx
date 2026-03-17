"use client"

import React from 'react'
import { Icon } from '@iconify/react'

export default function TermsOfUse() {
    return (
        <div className="container mx-auto px-4 py-12 max-w-4xl">
            <div className="flex items-center gap-3 mb-8">
                <div className="p-3 bg-primary/10 rounded-2xl text-primary">
                    <Icon icon="solar:document-text-bold-duotone" width="32" />
                </div>
                <h1 className="text-3xl font-black">Conditions Générales d'Utilisation</h1>
            </div>

            <div className="prose prose-slate dark:prose-invert max-w-none space-y-8">
                <section className="bg-card border border-border p-6 rounded-3xl shadow-sm">
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                        <span className="w-8 h-8 flex items-center justify-center bg-primary text-white rounded-full text-sm">1</span>
                        Objet de la plateforme
                    </h2>
                    <p className="text-muted-foreground leading-relaxed">
                        La plateforme <strong>inSeach</strong> est un espace numérique de mise en relation entre des particuliers ou entreprises (les "Utilisateurs") et des professionnels offrant divers services à domicile ou en entreprise (les "Prestataires").
                        Elle propose également une fonctionnalité secondaire de place de marché (Marketplace) permettant la vente de produits entre utilisateurs.
                    </p>
                </section>

                <section className="bg-card border border-border p-6 rounded-3xl shadow-sm">
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                        <span className="w-8 h-8 flex items-center justify-center bg-primary text-white rounded-full text-sm">2</span>
                        Définition des utilisateurs
                    </h2>
                    <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                        <li><strong>Client :</strong> Toute personne physique ou morale utilisant la plateforme pour rechercher un service ou acheter un produit.</li>
                        <li><strong>Prestataire :</strong> Professionnel (indépendant ou entreprise) proposant ses compétences (plomberie, électricité, nettoyage, etc.).</li>
                        <li><strong>Vendeur :</strong> Utilisateur proposant des produits à la vente via la marketplace.</li>
                    </ul>
                </section>

                <section className="bg-card border border-border p-6 rounded-3xl shadow-sm">
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                        <span className="w-8 h-8 flex items-center justify-center bg-primary text-white rounded-full text-sm">3</span>
                        Création et Gestion de compte
                    </h2>
                    <p className="text-muted-foreground leading-relaxed">
                        L'accès à certaines fonctionnalités nécessite la création d'un compte. L'utilisateur s'engage à fournir des informations exactes. Chaque compte est personnel et l'utilisateur est responsable de la confidentialité de ses identifiants.
                    </p>
                </section>

                <section className="bg-card border border-border p-6 rounded-3xl shadow-sm">
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                        <span className="w-8 h-8 flex items-center justify-center bg-primary text-white rounded-full text-sm">4</span>
                        Mise en relation (Activité Principale)
                    </h2>
                    <p className="text-muted-foreground leading-relaxed">
                        inSeach facilite la rencontre entre Clients et Prestataires. La plateforme n'intervient pas dans l'exécution du service lui-même. Le contrat de prestation est formé directement entre le Client et le Prestataire.
                        Les services incluent, sans s'y limiter : plomberie, nettoyage, réparation, électricité et livraison.
                    </p>
                </section>

                <section className="bg-card border border-border p-6 rounded-3xl shadow-sm">
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                        <span className="w-8 h-8 flex items-center justify-center bg-primary text-white rounded-full text-sm">5</span>
                        Option Marketplace (Vente de produits)
                    </h2>
                    <p className="text-muted-foreground leading-relaxed">
                        La plateforme permet aux utilisateurs de publier des annonces de vente.
                    </p>
                    <ul className="list-disc pl-6 mt-4 space-y-2 text-muted-foreground font-medium italic">
                        <li>Les produits sont publiés par leurs propriétaires respectifs.</li>
                        <li>Chaque vendeur gère lui-même ses stocks, ses prix et ses descriptions.</li>
                        <li>La gestion des commandes et les modalités de livraison sont sous la responsabilité exclusive du vendeur.</li>
                        <li>inSeach agit uniquement comme un intermédiaire technique et ne possède aucun stock.</li>
                    </ul>
                </section>

                <section className="bg-card border border-border p-6 rounded-3xl shadow-sm">
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                        <span className="w-8 h-8 flex items-center justify-center bg-primary text-white rounded-full text-sm">6</span>
                        Responsabilités et Limitations
                    </h2>
                    <p className="text-muted-foreground leading-relaxed">
                        inSeach décline toute responsabilité en cas de :
                    </p>
                    <ul className="list-disc pl-6 mt-4 space-y-2 text-muted-foreground">
                        <li>Mauvaise exécution d'un service par un Prestataire.</li>
                        <li>Non-conformité ou retard de livraison d'un produit vendu via la marketplace.</li>
                        <li>Litiges financiers entre utilisateurs en dehors des systèmes de paiement intégrés le cas échéant.</li>
                        <li>Interruption technique temporaire de la plateforme.</li>
                    </ul>
                </section>

                <section className="bg-card border border-border p-6 rounded-3xl shadow-sm">
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                        <span className="w-8 h-8 flex items-center justify-center bg-primary text-white rounded-full text-sm">7</span>
                        Suspension et Droit Applicable
                    </h2>
                    <p className="text-muted-foreground leading-relaxed">
                        inSeach se réserve le droit de suspendre tout compte ne respectant pas les présentes CGU ou ayant un comportement frauduleux.
                        Les présentes conditions sont régies par le droit en vigueur en Côte d'Ivoire.
                    </p>
                </section>

                <div className="text-center pt-8 text-sm text-muted-foreground italic">
                    Dernière mise à jour : 09 Mars 2026
                </div>
            </div>
        </div>
    )
}
