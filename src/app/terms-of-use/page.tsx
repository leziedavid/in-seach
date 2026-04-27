import React from 'react';
import { Icon } from '@iconify/react';
import Link from 'next/link';

export const metadata = {
  title: "Conditions d'Utilisation | Djamko",
  description: "Consultez les conditions générales d'utilisation de la plateforme Djamko.",
};

export default function TermsOfUse() {
  return (
    <div className="min-h-screen bg-background pb-20 pt-10 px-6">
      <div className="max-w-4xl mx-auto">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-primary transition-colors mb-8 group">
          <Icon icon="solar:arrow-left-bold" className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Retour à l'accueil
        </Link>

        <div className="bg-card rounded-[2.5rem] border border-border p-8 md:p-12 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -mr-32 -mt-32 blur-3xl" />
          
          <div className="relative z-10">
            <h1 className="text-3xl md:text-4xl font-black text-foreground mb-4 tracking-tight">
              Conditions Générales d'Utilisation <span className="text-primary">(CGU)</span>
            </h1>
            <p className="text-muted-foreground text-sm font-medium mb-12 italic">
              Dernière mise à jour : 27 Avril 2026
            </p>

            <div className="space-y-10 text-zinc-700 dark:text-zinc-300">
              <section>
                <h2 className="text-xl font-black text-foreground mb-4 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">1</div>
                  Objet
                </h2>
                <p className="leading-relaxed text-sm">
                  Les présentes Conditions Générales d'Utilisation ont pour objet de définir les modalités de mise à disposition des services de la plateforme **Djamko**, ci-après dénommée « le Service », et les conditions d'utilisation du Service par l'Utilisateur. 
                </p>
                <p className="mt-4 leading-relaxed text-sm">
                   Djamko est une plateforme multi-services opérant conformément aux lois de la République de Côte d'Ivoire.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-black text-foreground mb-4 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">2</div>
                  Acceptation des conditions
                </h2>
                <p className="leading-relaxed text-sm">
                  L'accès et l'utilisation du Service sont soumis à l'acceptation et au respect des présentes CGU. En cochant la case « J'accepte les conditions d'utilisation » lors de son inscription ou dans ses paramètres, l'Utilisateur reconnaît avoir pris connaissance de l'intégralité des présentes et les accepter sans réserve.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-black text-foreground mb-4 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">3</div>
                  Description des services
                </h2>
                <p className="leading-relaxed text-sm">
                  Djamko propose une plateforme technologique permettant la mise en relation entre des prestataires de services, des vendeurs et des clients. Les services incluent :
                </p>
                <ul className="list-disc list-inside mt-4 space-y-2 text-sm ml-4 font-medium">
                  <li>La réservation de services de dépannage et maintenance.</li>
                  <li>Une marketplace pour la vente et l'achat de biens.</li>
                  <li>Des solutions logistiques nationales et internationales.</li>
                  <li>Une messagerie et un système de notification en temps réel.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-black text-foreground mb-4 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">4</div>
                  Responsabilité
                </h2>
                <p className="leading-relaxed text-sm">
                  Djamko agit en qualité de simple intermédiaire. À ce titre, Djamko n'est pas partie aux contrats conclus entre les Utilisateurs et ne saurait être tenue responsable de la qualité des prestations ou des produits vendus.
                </p>
                <div className="mt-4 p-4 rounded-2xl bg-amber-500/5 border border-amber-500/10 flex gap-3">
                   <Icon icon="solar:danger-bold-duotone" className="w-5 h-5 text-amber-600 shrink-0" />
                   <p className="text-xs text-amber-800 dark:text-amber-400 font-bold leading-relaxed">
                     L'Utilisateur est seul responsable de la véracité des informations transmises et du respect des engagements pris vis-à-vis des autres membres de la communauté.
                   </p>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-black text-foreground mb-4 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">5</div>
                  Propriété Intellectuelle
                </h2>
                <p className="leading-relaxed text-sm">
                  L'ensemble des éléments constituant la plateforme (textes, graphismes, logiciels, photographies, logos, marques, etc.) est protégé par le droit de la propriété intellectuelle en vigueur en Côte d'Ivoire. Toute reproduction non autorisée constitue une contrefaçon.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-black text-foreground mb-4 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">6</div>
                  Loi applicable et juridiction
                </h2>
                <p className="leading-relaxed text-sm">
                  Les présentes CGU sont régies par le droit ivoirien. En cas de litige, et après une tentative de recherche d'une solution amiable, compétence expresse est attribuée aux tribunaux d'Abidjan.
                </p>
              </section>
            </div>

            <div className="mt-16 pt-10 border-t border-border flex flex-col items-center text-center">
              <Icon icon="solar:shield-check-bold-duotone" className="w-16 h-16 text-primary mb-4 opacity-20" />
              <p className="text-xs text-muted-foreground font-black uppercase tracking-[0.2em]">Djamko &bull; Sécurité &bull; Confiance</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
