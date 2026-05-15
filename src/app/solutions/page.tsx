"use client";

import React from "react";
import { motion } from "framer-motion";
import IconIllustration from "@/components/solutions/IconIllustration";
import FeatureCard from "@/components/solutions/FeatureCard";
import SectionBlock from "@/components/solutions/SectionBlock";
import { Icon } from "@iconify/react";

const partners = [
  { name: "GlobalBank",     icon: "solar:bank-bold-duotone"         },
  { name: "SwiftLogistics", icon: "solar:delivery-bold-duotone"     },
  { name: "SecurePay",      icon: "solar:shield-check-bold-duotone" },
  { name: "WorldChain",     icon: "solar:globus-bold-duotone"       },
  { name: "TechFlow",       icon: "solar:cpu-bold-duotone"          },
];

const faqs = [
  {
    q: "Qu'est-ce que Djamko exactement ?",
    a: "Djamko est un écosystème digital tout-en-un qui réunit les services à la demande, la marketplace, la logistique export, EasyDelivery et les annonces immobilières sur une seule plateforme.",
  },
  {
    q: "Qu'est-ce qu'EasyDelivery ?",
    a: "EasyDelivery est le module de livraison locale de Djamko. Il connecte les vendeurs et particuliers à des coursiers vérifiés pour des livraisons rapides et suivies en temps réel dans votre ville.",
  },
  {
    q: "Comment fonctionne la mise en relation par IA ?",
    a: "Notre algorithme analyse votre besoin, votre localisation et les disponibilités en temps réel pour vous connecter en quelques secondes au prestataire ou produit le plus adapté.",
  },
  {
    q: "Djamko est-il disponible dans ma ville ?",
    a: "Djamko est actif à Abidjan et continue son expansion rapide. Les services à la demande, la marketplace et EasyDelivery sont disponibles dès maintenant.",
  },
  {
    q: "Puis-je publier des annonces immobilières ?",
    a: "Oui. La section Annonces vous permet de publier des biens immobiliers, véhicules et articles divers avec fiches détaillées, photos et options de mise en avant.",
  },
  {
    q: "Comment démarrer sur Djamko ?",
    a: "Créez un compte gratuitement en moins de 2 minutes. Le plan FREE donne accès à toutes les fonctionnalités de base, sans engagement ni carte bancaire.",
  },
];

function FAQItem({ q, a, index }: { q: string; a: string; index: number }) {
  const [open, setOpen] = React.useState(false);
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.35, delay: index * 0.06 }}
      className="border-b border-zinc-100 dark:border-zinc-800 last:border-0"
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-4 text-left group"
        aria-expanded={open}
      >
        <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-100 group-hover:text-primary transition-colors pr-6 leading-snug">
          {q}
        </span>
        <span className={`shrink-0 w-6 h-6 rounded-full border flex items-center justify-center transition-all duration-300
          ${open ? "bg-primary border-primary rotate-45" : "border-zinc-200 dark:border-zinc-700"}`}>
          <Icon
            icon="solar:add-linear"
            width={12}
            className={open ? "text-white" : "text-zinc-400 dark:text-zinc-500"}
          />
        </span>
      </button>
      <div className={`overflow-hidden transition-all duration-300 ease-in-out ${open ? "max-h-40 pb-4" : "max-h-0"}`}>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">{a}</p>
      </div>
    </motion.div>
  );
}

export default function SolutionsPage() {
  return (
    <main className="min-h-screen bg-background">

      {/* ── HERO ── */}
      <section className="relative w-full pt-16 pb-20 overflow-hidden bg-white dark:bg-zinc-950">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-[20%] -left-[10%] w-[50rem] h-[50rem] bg-primary/5 rounded-full blur-[120px]" />
          <div className="absolute top-[20%] -right-[10%] w-[40rem] h-[40rem] bg-secondary/5 rounded-full blur-[100px]" />
          <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-zinc-200/60 dark:via-zinc-700/40 to-transparent" />
        </div>

        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-3xl mx-auto text-center space-y-7">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="space-y-5"
            >
              <span className="inline-flex px-4 py-1.5 rounded-full bg-primary/5 border border-primary/15 text-primary text-[10px] font-bold uppercase tracking-[0.3em]">
                L&apos;Écosystème Digital Tout-en-Un
              </span>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground tracking-tight leading-tight">
                Bienvenue dans{" "}
                <span className="text-primary italic">l&apos;ère Djamko.</span>
              </h1>
              <p className="text-sm md:text-base text-muted-foreground max-w-xl mx-auto leading-relaxed">
                Djamko réunit services à la demande, marketplace, livraison locale et logistique export en une seule plateforme.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-3"
            >
              <button className="w-full sm:w-auto px-7 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 active:scale-95 transition-all">
                Lancer l&apos;aventure
              </button>
              <button className="w-full sm:w-auto px-7 py-2.5 rounded-xl bg-transparent border border-zinc-200 dark:border-zinc-700 text-sm font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-all">
                Voir la démo
              </button>
            </motion.div>

            {/* Trust Bar */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.8 }}
              className="pt-12 space-y-5"
            >
              <p className="text-[10px] uppercase font-bold tracking-[0.25em] text-muted-foreground/50">
                Ils nous font confiance
              </p>
              <div className="flex flex-wrap justify-center items-center gap-x-8 gap-y-4 opacity-40 grayscale hover:grayscale-0 transition-all duration-700">
                {partners.map((p, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Icon icon={p.icon} className="w-5 h-5" />
                    <span className="font-semibold text-sm tracking-tight">{p.name}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── SERVICES ── */}
      <SectionBlock
        id="services"
        title="Services à la demande"
        subtitle="Expertise & Proximité"
        illustration={<IconIllustration icon="solar:user-speak-bold-duotone" size={110} className="text-indigo-500" />}
      >
        <div className="space-y-6">
          <p className="text-sm md:text-base text-muted-foreground leading-relaxed text-center lg:text-left">
            Trouvez en quelques clics le prestataire idéal. Du dépannage d&apos;urgence au service à domicile,
            Djamko connecte les particuliers aux meilleurs experts vérifiés.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <FeatureCard
              title="Experts Certifiés"
              description="Sécurité et qualité garanties."
              utility="Chaque prestataire suit un processus de vérification rigoureux pour assurer votre tranquillité et la qualité des interventions."
              icon="solar:verified-check-bold-duotone"
              iconColor="text-indigo-500"
            />
            <FeatureCard
              title="Réservation Instantanée"
              description="Une réponse immédiate à vos besoins."
              utility="Grâce à notre technologie de mise en relation intelligente, réduisez vos délais d'attente à quelques minutes."
              icon="solar:calendar-date-bold-duotone"
              iconColor="text-indigo-500"
              delay={0.1}
            />
          </div>
        </div>
      </SectionBlock>

      {/* ── MARKETPLACE ── */}
      <SectionBlock
        id="marketplace"
        title="Marketplace Intégrée"
        subtitle="Commerce Circulaire"
        reversed
        illustration={<IconIllustration icon="solar:shop-bold-duotone" size={110} className="text-amber-500" />}
      >
        <div className="space-y-6">
          <p className="text-sm md:text-base text-muted-foreground leading-relaxed text-center lg:text-left">
            Vendez, achetez et donnez une seconde vie à vos articles. Notre interface intuitive
            facilite vos transactions en toute sécurité, directement au sein de la plateforme.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <FeatureCard
              title="Échanges Sécurisés"
              description="Un environnement d'achat serein."
              utility="Nous intégrons les systèmes de paiement locaux et internationaux pour des échanges sans friction et sans risques."
              icon="solar:shield-check-bold-duotone"
              iconColor="text-amber-500"
            />
            <FeatureCard
              title="Visibilité Maximale"
              description="Vendez vos articles en un temps record."
              utility="Optimisez vos ventes grâce à notre moteur de recherche sémantique et nos outils de mise en avant automatique."
              icon="solar:magic-stick-bold-duotone"
              iconColor="text-amber-500"
              delay={0.1}
            />
          </div>
        </div>
      </SectionBlock>

      {/* ── ANNONCES & IMMOBILIER ── */}
      <SectionBlock
        id="annonces"
        title="Annonces & Immobilier"
        subtitle="Nouveau Module"
        illustration={<IconIllustration icon="solar:home-bold-duotone" size={110} className="text-emerald-500" />}
      >
        <div className="space-y-6">
          <p className="text-sm md:text-base text-muted-foreground leading-relaxed text-center lg:text-left">
            Publiez et découvrez des annonces immobilières, véhicules et biens divers.
            Des fiches détaillées, des catégories structurées et une mise en avant intelligente.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <FeatureCard
              title="Publication Simplifiée"
              description="En ligne en moins de 3 minutes."
              utility="Créez votre annonce avec photos et options personnalisées. L'IA optimise automatiquement votre titre pour maximiser les vues."
              icon="solar:pen-bold-duotone"
              iconColor="text-emerald-500"
            />
            <FeatureCard
              title="Recherche Contextuelle"
              description="Trouvez le bien idéal."
              utility="Filtres avancés, localisation précise et alertes personnalisées pour être le premier informé des nouvelles annonces."
              icon="solar:filter-bold-duotone"
              iconColor="text-emerald-500"
              delay={0.1}
            />
          </div>
        </div>
      </SectionBlock>

      {/* ── EASY DELIVERY ── */}
      <SectionBlock
        id="easy-delivery"
        title="EasyDelivery"
        subtitle="Livraison Locale"
        reversed
        illustration={<IconIllustration icon="solar:scooter-bold-duotone" size={110} className="text-primary" />}
      >
        <div className="space-y-6">
          <p className="text-sm md:text-base text-muted-foreground leading-relaxed text-center lg:text-left">
            Envoyez et recevez vos colis en ville en quelques minutes.
            EasyDelivery connecte vendeurs, acheteurs et coursiers vérifiés sur une interface unifiée.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <FeatureCard
              title="Coursiers Vérifiés"
              description="Fiabilité à chaque livraison."
              utility="Chaque coursier est vérifié, noté et géolocalisé. Recevez des notifications à chaque étape de votre livraison."
              icon="solar:user-check-rounded-bold-duotone"
              iconColor="text-primary"
            />
            <FeatureCard
              title="Suivi Temps Réel"
              description="Votre colis sous les yeux."
              utility="Suivez votre livraison sur la carte en temps réel, de l'enlèvement jusqu'à la remise en main propre."
              icon="solar:routing-bold-duotone"
              iconColor="text-primary"
              delay={0.1}
            />
          </div>
        </div>
      </SectionBlock>

      {/* ── LOGISTICS ── */}
      <SectionBlock
        id="logistics"
        title="Logistique & Export"
        subtitle="Sans Frontières"
        illustration={<IconIllustration icon="solar:delivery-bold-duotone" size={110} className="text-secondary" />}
      >
        <div className="space-y-6">
          <p className="text-sm md:text-base text-muted-foreground leading-relaxed text-center lg:text-left">
            Djamko intègre des solutions de transport et de logistique avancées,
            permettant d&apos;expédier vos marchandises partout avec un suivi 100% transparent.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <FeatureCard
              title="Fret Multi-Modal"
              description="Aérien, Maritime & Routier."
              utility="Des solutions adaptées tant pour un colis urgent que pour un conteneur complet vers l'international."
              icon="solar:globus-bold-duotone"
              iconColor="text-secondary"
            />
            <FeatureCard
              title="Tracking Temps Réel"
              description="Visibilité totale de bout en bout."
              utility="Gardez un œil sur vos expéditions à chaque étape du voyage, de l'enlèvement à la livraison finale."
              icon="solar:map-point-bold-duotone"
              iconColor="text-secondary"
              delay={0.1}
            />
          </div>
        </div>
      </SectionBlock>

      {/* ── WHY DJAMKO — BENTO ── */}
      <section className="py-14 px-6 bg-zinc-50 dark:bg-zinc-900/30">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10 space-y-2">
            <span className="text-primary font-bold uppercase tracking-[0.25em] text-[10px]">
              L&apos;Excellence Djamko
            </span>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
              Pourquoi nous choisir ?
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 auto-rows-auto">
            {/* Large Card 1 */}
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="md:col-span-8 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 flex flex-col justify-between group overflow-hidden relative min-h-[180px]"
            >
              <div className="space-y-3 relative z-10">
                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <Icon icon="solar:widget-bold-duotone" className="w-5 h-5" />
                </div>
                <h3 className="text-lg md:text-xl font-bold tracking-tight text-zinc-900 dark:text-white">
                  Interface Unifiée
                </h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed max-w-md">
                  Passez d&apos;une commande de service à l&apos;envoi d&apos;un colis export en un seul geste. Une expérience sans couture.
                </p>
              </div>
              <div className="absolute -bottom-6 -right-6 opacity-[0.04] group-hover:opacity-[0.08] transition-opacity pointer-events-none">
                <Icon icon="solar:widget-bold-duotone" width={140} height={140} />
              </div>
            </motion.div>

            {/* Small Card 1 — Primary */}
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="md:col-span-4 bg-primary text-white rounded-2xl p-6 flex flex-col justify-between group overflow-hidden relative min-h-[180px]"
            >
              <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center relative z-10 transition-transform group-hover:scale-110">
                <Icon icon="solar:medal-star-bold-duotone" className="w-5 h-5" />
              </div>
              <div className="space-y-1.5 relative z-10">
                <h3 className="text-base md:text-lg font-bold">Confiance Absolue</h3>
                <p className="text-white/75 text-xs leading-relaxed">
                  Chaque membre est vérifié pour garantir des échanges sereins.
                </p>
              </div>
              <div className="absolute -bottom-4 -right-4 opacity-10 pointer-events-none">
                <Icon icon="solar:shield-check-bold-duotone" width={80} height={80} />
              </div>
            </motion.div>

            {/* Small Card 2 — Secondary */}
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="md:col-span-4 bg-secondary text-white rounded-2xl p-6 flex flex-col justify-between group overflow-hidden relative min-h-[180px]"
            >
              <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center relative z-10 transition-transform group-hover:scale-110">
                <Icon icon="solar:cpu-bold-duotone" className="w-5 h-5" />
              </div>
              <div className="space-y-1.5 relative z-10">
                <h3 className="text-base md:text-lg font-bold">Mise en Relation IA</h3>
                <p className="text-white/75 text-xs leading-relaxed">
                  Notre algorithme vous connecte instantanément à la solution idéale.
                </p>
              </div>
              <div className="absolute -bottom-4 -right-4 opacity-10 pointer-events-none">
                <Icon icon="solar:cpu-bold-duotone" width={80} height={80} />
              </div>
            </motion.div>

            {/* Large Card 2 — Dark island */}
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="md:col-span-8 bg-zinc-900 dark:bg-zinc-800 rounded-2xl p-6 flex flex-col sm:flex-row items-center gap-6 overflow-hidden relative group text-white min-h-[180px]"
            >
              <div className="flex-1 space-y-3 relative z-10">
                <h3 className="text-lg md:text-xl font-bold leading-tight tracking-tight">
                  Expansion Sans Limites
                </h3>
                <p className="text-zinc-400 text-sm leading-relaxed">
                  De votre domicile à l&apos;international, Djamko brise les barrières géographiques.
                </p>
                <div className="flex flex-wrap gap-2">
                  {["Abidjan", "Paris", "Dubaï"].map((city) => (
                    <span
                      key={city}
                      className="px-3 py-1 rounded-full bg-white/10 border border-white/10 text-xs font-semibold italic hover:bg-primary/40 transition-colors cursor-default"
                    >
                      {city}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex-shrink-0 relative z-10 transition-transform duration-500 group-hover:scale-110">
                <Icon icon="solar:globus-up-bold-duotone" width={100} height={100} className="text-primary opacity-40" />
              </div>
              <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_top_right,rgba(251,146,60,0.08),transparent_70%)]" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="py-14 px-6 bg-white dark:bg-zinc-950">
        <div className="max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-10 space-y-2"
          >
            <span className="text-primary font-bold uppercase tracking-[0.25em] text-[10px]">
              Support & Clarté
            </span>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
              Questions fréquentes
            </h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-md mx-auto leading-relaxed">
              Tout ce que vous devez savoir sur l&apos;écosystème Djamko avant de démarrer.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-5 sm:px-7"
          >
            {faqs.map((item, i) => (
              <FAQItem key={i} q={item.q} a={item.a} index={i} />
            ))}
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="text-center text-xs text-zinc-400 dark:text-zinc-500 mt-6"
          >
            Une autre question ?{" "}
            <a href="mailto:support@djamko.com" className="text-secondary dark:text-primary font-semibold hover:underline">
              Contactez notre équipe
            </a>
          </motion.p>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="py-8 px-6">
        <div className="max-w-3xl mx-auto rounded-2xl bg-zinc-900 dark:bg-zinc-800 text-white p-8 md:p-12 text-center space-y-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-[24rem] h-[24rem] bg-primary/20 blur-[100px] rounded-full -mr-40 -mt-40 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-[20rem] h-[20rem] bg-secondary/15 blur-[80px] rounded-full -ml-24 -mb-24 pointer-events-none" />

          <div className="relative z-10 space-y-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.85 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="inline-flex p-3 rounded-xl bg-primary/15 border border-primary/20"
            >
              <Icon icon="solar:crown-bold-duotone" className="text-primary w-7 h-7" />
            </motion.div>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight leading-tight">
              Prêt pour{" "}
              <span className="text-primary italic">le Futur ?</span>
            </h2>
            <p className="text-sm text-zinc-400 max-w-md mx-auto leading-relaxed">
              Rejoignez l&apos;écosystème qui définit les nouveaux standards de l&apos;économie digitale globale.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button className="w-full sm:w-auto px-7 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 active:scale-95 transition-all">
                Commencer maintenant
              </button>
              <button className="w-full sm:w-auto px-7 py-2.5 rounded-xl border border-zinc-700 dark:border-zinc-600 text-sm font-semibold text-zinc-300 hover:bg-zinc-700 dark:hover:bg-zinc-700 transition-colors">
                Contacter un expert
              </button>
            </div>
          </div>
        </div>
      </section>

    </main>
  );
}
