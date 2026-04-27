import React from 'react';
import { Icon } from '@iconify/react';
import Link from 'next/link';

export const metadata = {
  title: "Politique de Confidentialité | Djamko",
  description: "Comment Djamko protège et gère vos données personnelles.",
};

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-background pb-20 pt-10 px-6">
      <div className="max-w-4xl mx-auto">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-primary transition-colors mb-8 group">
          <Icon icon="solar:arrow-left-bold" className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Retour à l'accueil
        </Link>

        <div className="bg-card rounded-[2.5rem] border border-border p-8 md:p-12 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-secondary/5 rounded-full -mr-32 -mt-32 blur-3xl" />
          
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-2xl bg-secondary/10 flex items-center justify-center text-secondary">
                    <Icon icon="solar:shield-keyhole-bold-duotone" className="w-8 h-8" />
                </div>
                <div>
                    <h1 className="text-3xl md:text-4xl font-black text-foreground tracking-tight">
                        Politique de Confidentialité
                    </h1>
                    <p className="text-muted-foreground text-sm font-medium">Vos données, notre priorité.</p>
                </div>
            </div>

            <p className="text-muted-foreground text-sm font-medium mb-12 italic">
              Dernière mise à jour : 27 Avril 2026
            </p>

            <div className="space-y-10 text-zinc-700 dark:text-zinc-300">
              <section>
                <h2 className="text-xl font-black text-foreground mb-4 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-secondary/10 flex items-center justify-center text-secondary">1</div>
                  Collecte des données
                </h2>
                <p className="leading-relaxed text-sm">
                  Djamko collecte des informations nécessaires au bon fonctionnement de ses services. Cela inclut :
                </p>
                <ul className="list-disc list-inside mt-4 space-y-2 text-sm ml-4 font-medium italic opacity-80">
                  <li>Identité (Nom, prénom, email, téléphone)</li>
                  <li>Localisation (pour les services de proximité et la logistique)</li>
                  <li>Documents officiels (CNI/Passeport pour les prestataires)</li>
                  <li>Données de navigation et jetons de notifications</li>
                </ul>
                <p className="mt-4 leading-relaxed text-sm font-bold text-secondary">
                   Toute collecte est effectuée conformément à la loi n°2013-450 relative à la protection des données à caractère personnel en Côte d'Ivoire.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-black text-foreground mb-4 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-secondary/10 flex items-center justify-center text-secondary">2</div>
                  Utilisation des données
                </h2>
                <p className="leading-relaxed text-sm">
                  Vos données sont utilisées exclusivement pour :
                </p>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                    <li className="p-3 bg-muted rounded-xl flex items-center gap-3 text-xs font-bold">
                        <Icon icon="solar:double-alt-arrow-right-bold" className="text-secondary w-4 h-4" />
                        Gérer votre compte utilisateur
                    </li>
                    <li className="p-3 bg-muted rounded-xl flex items-center gap-3 text-xs font-bold">
                        <Icon icon="solar:double-alt-arrow-right-bold" className="text-secondary w-4 h-4" />
                        Faciliter la mise en relation
                    </li>
                    <li className="p-3 bg-muted rounded-xl flex items-center gap-3 text-xs font-bold">
                        <Icon icon="solar:double-alt-arrow-right-bold" className="text-secondary w-4 h-4" />
                        Sécuriser les transactions
                    </li>
                    <li className="p-3 bg-muted rounded-xl flex items-center gap-3 text-xs font-bold">
                        <Icon icon="solar:double-alt-arrow-right-bold" className="text-secondary w-4 h-4" />
                        Améliorer l'expérience via l'IA
                    </li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-black text-foreground mb-4 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-secondary/10 flex items-center justify-center text-secondary">3</div>
                  Sécurité et Conservation
                </h2>
                <p className="leading-relaxed text-sm">
                  Nous mettons en œuvre des mesures de sécurité techniques et organisationnelles pour protéger vos données contre l'accès non autorisé, la perte ou l'altération. Les données des prestataires (documents d'identité) sont stockées dans des environnements sécurisés.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-black text-foreground mb-4 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-secondary/10 flex items-center justify-center text-secondary">4</div>
                  Partage avec des tiers
                </h2>
                <p className="leading-relaxed text-sm">
                  Djamko ne vend jamais vos données personnelles. Vos coordonnées (nom, téléphone) ne sont transmises qu'aux prestataires ou clients concernés par une commande ou un service validé afin de permettre la réalisation de la prestation.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-black text-foreground mb-4 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-secondary/10 flex items-center justify-center text-secondary">5</div>
                  Vos droits
                </h2>
                <p className="leading-relaxed text-sm">
                  Conformément à la législation ivoirienne, vous disposez d'un droit d'accès, de rectification, d'opposition et de suppression de vos données. Vous pouvez exercer ces droits directement depuis vos paramètres de compte ou en nous contactant.
                </p>
                <div className="mt-6 flex flex-wrap gap-4">
                    <button className="flex items-center gap-2 px-4 py-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg text-xs font-black">
                        Accéder à mes données
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 bg-secondary text-white rounded-lg text-xs font-black">
                        Demander la suppression
                    </button>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-black text-foreground mb-4 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-secondary/10 flex items-center justify-center text-secondary">6</div>
                  Notifications et Push
                </h2>
                <p className="leading-relaxed text-sm">
                  L'application utilise des systèmes de notifications pour vous informer des mises à jour de vos commandes. Vous pouvez activer ou désactiver ces notifications à tout moment dans les réglages de votre compte.
                </p>
              </section>
            </div>

            <div className="mt-16 pt-10 border-t border-border flex flex-col items-center text-center">
              <Icon icon="solar:lock-bold-duotone" className="w-16 h-16 text-secondary mb-4 opacity-20" />
              <p className="text-xs text-muted-foreground font-black uppercase tracking-[0.2em]">Djamko &bull; Confidentialité &bull; Protection</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
