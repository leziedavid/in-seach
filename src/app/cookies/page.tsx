import React from 'react';
import { Icon } from '@iconify/react';
import Link from 'next/link';

export const metadata = {
  title: "Politique Cookies | Djamko",
  description: "Comment Djamko utilise les cookies pour améliorer votre expérience.",
};

export default function CookiesPolicy() {
  return (
    <div className="min-h-screen bg-background pb-20 pt-10 px-6">
      <div className="max-w-4xl mx-auto">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-primary transition-colors mb-8 group">
          <Icon icon="solar:arrow-left-bold" className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Retour à l'accueil
        </Link>

        <div className="bg-card  p-8 md:p-12 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-secondary/5 rounded-full -mr-32 -mt-32 blur-3xl" />

          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-2xl bg-secondary/10 flex items-center justify-center text-secondary">
                <Icon icon="solar:cookie-bold-duotone" className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-black text-foreground tracking-tight">
                  Politique Cookies
                </h1>
                <p className="text-muted-foreground text-sm font-medium">Votre expérience, nos outils.</p>
              </div>
            </div>

            <p className="text-muted-foreground text-sm font-medium mb-12 italic">
              Dernière mise à jour : 20 Avril 2026
            </p>

            <div className="space-y-10 text-zinc-700 dark:text-zinc-300">
              <section>
                <h2 className="text-xl font-black text-foreground mb-4 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-secondary/10 flex items-center justify-center text-secondary">1</div>
                  Qu'est-ce qu'un cookie ?
                </h2>
                <p className="leading-relaxed text-sm">
                  Un cookie est un petit fichier texte déposé sur votre appareil (ordinateur, smartphone, tablette) lorsque vous visitez un site web. Il permet au site de mémoriser des informations sur votre visite, comme votre langue, votre session de connexion ou vos préférences.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-black text-foreground mb-4 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-secondary/10 flex items-center justify-center text-secondary">2</div>
                  Cookies utilisés sur lendroit.ci
                </h2>
                <p className="leading-relaxed text-sm mb-6">
                  Nous utilisons les catégories de cookies suivantes :
                </p>

                <div className="overflow-x-auto rounded-2xl border border-border bg-muted/30">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-muted font-black text-foreground">
                        <th className="p-4 border-b border-border uppercase">Nom</th>
                        <th className="p-4 border-b border-border uppercase">Finalité</th>
                        <th className="p-4 border-b border-border uppercase">Durée</th>
                      </tr>
                    </thead>
                    <tbody className="font-medium italic opacity-90">
                      <tr className="hover:bg-muted/20 transition-colors">
                        <td className="p-4 border-b border-border font-black text-foreground not-italic">PHPSESSID</td>
                        <td className="p-4 border-b border-border">Cookie de session — maintient votre connexion et votre panier de favoris pendant la navigation</td>
                        <td className="p-4 border-b border-border">Fermeture du navigateur</td>
                      </tr>
                      <tr className="hover:bg-muted/20 transition-colors">
                        <td className="p-4 border-b border-border font-black text-foreground not-italic">csrf_token</td>
                        <td className="p-4 border-b border-border">Cookie de sécurité — protège les formulaires contre les attaques CSRF</td>
                        <td className="p-4 border-b border-border">Session</td>
                      </tr>
                      <tr className="hover:bg-muted/20 transition-colors">
                        <td className="p-4 border-b border-border font-black text-foreground not-italic">firebase_*</td>
                        <td className="p-4 border-b border-border">Cookies techniques de Firebase Authentication — gèrent l'authentification Google et OTP SMS</td>
                        <td className="p-4 border-b border-border">Jusqu'à déconnexion</td>
                      </tr>
                      <tr className="hover:bg-muted/20 transition-colors">
                        <td className="p-4 border-b border-border font-black text-foreground not-italic">lendroit_consent</td>
                        <td className="p-4 border-b border-border">Mémorise votre choix concernant les cookies non essentiels</td>
                        <td className="p-4 border-b border-border">12 mois</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <p className="mt-4 leading-relaxed text-sm font-bold text-secondary flex items-center gap-2">
                  <Icon icon="solar:info-circle-bold" className="w-4 h-4" />
                  Les cookies ci-dessus sont strictement nécessaires au fonctionnement de la Plateforme et ne nécessitent pas votre consentement préalable.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-black text-foreground mb-4 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-secondary/10 flex items-center justify-center text-secondary">3</div>
                  Cookies de mesure d'audience
                </h2>
                <p className="leading-relaxed text-sm">
                  Nous pouvons utiliser des cookies de mesure d'audience anonymisés pour comprendre comment les visiteurs utilisent la Plateforme, identifier les pages populaires et améliorer le service. Ces cookies ne permettent pas de vous identifier personnellement.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-black text-foreground mb-4 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-secondary/10 flex items-center justify-center text-secondary">4</div>
                  Comment gérer les cookies
                </h2>
                <p className="leading-relaxed text-sm mb-6">
                  Vous pouvez à tout moment accepter ou refuser les cookies non essentiels via la bannière d'information affichée lors de votre première visite, ou modifier vos préférences via les paramètres de votre navigateur :
                </p>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <li className="p-3 bg-muted rounded-xl flex items-center gap-3 text-xs font-bold transition-transform hover:scale-[1.02]">
                    <div className="w-8 h-8 rounded-lg bg-white dark:bg-zinc-800 flex items-center justify-center shadow-sm">
                      <Icon icon="logos:chrome" className="w-4 h-4" />
                    </div>
                    Chrome
                  </li>
                  <li className="p-3 bg-muted rounded-xl flex items-center gap-3 text-xs font-bold transition-transform hover:scale-[1.02]">
                    <div className="w-8 h-8 rounded-lg bg-white dark:bg-zinc-800 flex items-center justify-center shadow-sm">
                      <Icon icon="logos:firefox" className="w-4 h-4" />
                    </div>
                    Firefox
                  </li>
                  <li className="p-3 bg-muted rounded-xl flex items-center gap-3 text-xs font-bold transition-transform hover:scale-[1.02]">
                    <div className="w-8 h-8 rounded-lg bg-white dark:bg-zinc-800 flex items-center justify-center shadow-sm">
                      <Icon icon="logos:safari" className="w-4 h-4" />
                    </div>
                    Safari
                  </li>
                  <li className="p-3 bg-muted rounded-xl flex items-center gap-3 text-xs font-bold transition-transform hover:scale-[1.02]">
                    <div className="w-8 h-8 rounded-lg bg-white dark:bg-zinc-800 flex items-center justify-center shadow-sm">
                      <Icon icon="logos:microsoft-edge" className="w-4 h-4" />
                    </div>
                    Edge
                  </li>
                </ul>
                <p className="mt-6 leading-relaxed text-sm italic font-medium text-muted-foreground bg-muted/10 p-4 rounded-xl border-l-2 border-primary/20">
                  Le blocage de certains cookies (notamment les cookies de session) peut empêcher l'utilisation normale de la Plateforme.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-black text-foreground mb-4 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-secondary/10 flex items-center justify-center text-secondary">5</div>
                  Durée de conservation
                </h2>
                <p className="leading-relaxed text-sm text-zinc-700 dark:text-zinc-300">
                  Les cookies sont conservés pour la durée indiquée dans le tableau ci-dessus, ou jusqu'à ce que vous les supprimiez manuellement depuis votre navigateur.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-black text-foreground mb-4 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-secondary/10 flex items-center justify-center text-secondary">6</div>
                  Contact
                </h2>
                <p className="leading-relaxed text-sm">
                  Pour toute question relative à notre politique cookies, contactez-nous à l'adresse support@djamko.com ou via l'espace assistance de votre compte.
                </p>
              </section>
            </div>

            <div className="mt-16 pt-10 border-t border-border flex flex-col items-center text-center">
              <Icon icon="solar:cookie-bold-duotone" className="w-16 h-16 text-secondary mb-4 opacity-20" />
              <p className="text-xs text-muted-foreground font-black uppercase tracking-[0.2em]">Djamko &bull; Cookies &bull; Transparence</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
