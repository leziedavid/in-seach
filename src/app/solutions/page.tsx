"use client";

import { motion } from "framer-motion";
import IconIllustration from "@/components/solutions/IconIllustration";
import FeatureCard from "@/components/solutions/FeatureCard";
import SectionBlock from "@/components/solutions/SectionBlock";
import { Icon } from "@iconify/react";

const partners = [
  { name: "GlobalBank", icon: "solar:bank-bold-duotone" },
  { name: "SwiftLogistics", icon: "solar:delivery-bold-duotone" },
  { name: "SecurePay", icon: "solar:shield-check-bold-duotone" },
  { name: "WorldChain", icon: "solar:globus-bold-duotone" },
  { name: "TechFlow", icon: "solar:cpu-bold-duotone" },
];

export default function SolutionsPage() {
  return (
    <main className="min-h-screen bg-background">
      {/* --- HERO SECTION --- */}
      <section className="relative w-full pt-28 pb-32 overflow-hidden bg-white dark:bg-zinc-950">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-[20%] -left-[10%] w-[70rem] h-[70rem] bg-primary/5 rounded-full blur-[160px] animate-pulse" />
          <div className="absolute top-[20%] -right-[10%] w-[60rem] h-[60rem] bg-blue-500/5 rounded-full blur-[140px]" />
          <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-border/60 to-transparent" />
        </div>

        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-5xl mx-auto text-center space-y-10">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="space-y-6">
              <span className="inline-flex px-5 py-2 rounded-full bg-primary/5 border border-primary/10 text-primary text-[10px] sm:text-xs font-black uppercase tracking-[0.4em] backdrop-blur-md">
                L'Écosystème Digital Tout-en-Un
              </span>
              <h1 className="text-5xl md:text-[5.5rem] font-black text-foreground tracking-tighter leading-[1] !mt-8">
                Bienvenue dans <br />
                <span className="text-primary italic">l'ère Djamko.</span>
              </h1>
              <p className="text-lg md:text-2xl text-muted-foreground max-w-2xl mx-auto font-medium leading-normal !mt-8">
                Djamko n'est pas seulement une application, c'est le point de rencontre entre le besoin local et l'opportunité globale.
              </p>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.8 }} className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-4">
              <button className="px-10 py-5 rounded-full bg-primary text-primary-foreground text-lg font-black hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-primary/30">
                Lancer l'aventure
              </button>
              <button className="px-10 py-5 rounded-full bg-muted border border-border/50 text-lg font-bold hover:bg-border/30 transition-all">
                Voir la démo
              </button>
            </motion.div>

            {/* Trust Bar */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6, duration: 1 }} className="pt-24 space-y-10">
              <p className="text-[10px] uppercase font-black tracking-[0.3em] text-muted-foreground opacity-50">Ils nous font confiance</p>
              <div className="flex flex-wrap justify-center items-center gap-x-16 gap-y-8 opacity-40 grayscale hover:grayscale-0 transition-all duration-700">
                {partners.map((p, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Icon icon={p.icon} className="w-8 h-8" />
                    <span className="font-bold tracking-tighter text-xl">{p.name}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* --- SERVICES SECTION --- */}
      <SectionBlock id="services" title="Services à la demande" subtitle="Expertise & Proximité" illustration={<IconIllustration icon="solar:user-speak-bold-duotone" size={200} className="text-indigo-500" />}>
        <div className="space-y-12">
          <p className="text-2xl text-muted-foreground leading-relaxed font-medium text-center lg:text-left">
            Trouvez en quelques clics le prestataire idéal. Du dépannage d'urgence au service à domicile,
            Djamko connecte les particuliers aux meilleurs experts vérifiés.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <FeatureCard title="Experts Certifiés" description="Sécurité et qualité garanties." utility="Chaque prestataire suit un processus de vérification rigoureux pour assurer votre tranquillité et la qualité des interventions." icon="solar:verified-check-bold-duotone" iconColor="text-indigo-500" />
            <FeatureCard title="Réservation Instantanée" description="Une réponse immédiate à vos besoins." utility="Grâce à notre technologie de mise en relation intelligente, réduisez vos délais d'attente à quelques minutes." icon="solar:calendar-date-bold-duotone" iconColor="text-indigo-500" delay={0.1} />
          </div>
        </div>
      </SectionBlock>

      {/* --- MARKETPLACE SECTION --- */}
      <SectionBlock id="marketplace" title="Marketplace Intégrée" subtitle="Commerce Circulaire" reversed illustration={<IconIllustration icon="solar:shop-bold-duotone" size={200} className="text-amber-500" />}>
        <div className="space-y-12">
          <p className="text-2xl text-muted-foreground leading-relaxed font-medium text-center lg:text-left">
            Vendez, achetez et donnez une seconde vie à vos articles. Notre interface intuitive
            facilite vos transactions en toute sécurité, directement au sein de la plateforme.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <FeatureCard title="Échanges Sécurisés" description="Un environnement d'achat serein." utility="Nous intégrons les systèmes de paiement locaux et internationaux pour des échanges sans friction et sans risques." icon="solar:shield-check-bold-duotone" iconColor="text-amber-500" />
            <FeatureCard title="Visibilité Maximale" description="Vendez vos articles en un temps record." utility="Optimisez vos ventes grâce à notre moteur de recherche sémantique et nos outils de mise en avant automatique." icon="solar:magic-stick-bold-duotone" iconColor="text-amber-500" delay={0.1} />
          </div>
        </div>
      </SectionBlock>

      {/* --- LOGISTICS SECTION --- */}
      <SectionBlock id="logistics" title="Logistique & Export" subtitle="Sans Frontières" illustration={<IconIllustration icon="solar:delivery-bold-duotone" size={200} className="text-blue-500" />}>
        <div className="space-y-12">
          <p className="text-2xl text-muted-foreground leading-relaxed font-medium text-center lg:text-left">
            Djamko intègre des solutions de transport et de logistique avancées,
            permettant d'expédier vos marchandises partout avec un suivi 100% transparent.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <FeatureCard
              title="Fret Multi-Modal"
              description="Aérien, Maritime & Routier."
              utility="Des solutions adaptées tant pour un colis urgent que pour un conteneur complet vers l'international."
              icon="solar:globus-bold-duotone"
              iconColor="text-blue-500"
            />
            <FeatureCard
              title="Tracking Temps Réel"
              description="Visibilité totale de bout en bout."
              utility="Gardez un œil sur vos expéditions à chaque étape du voyage, de l'enlèvement à la livraison finale."
              icon="solar:map-point-bold-duotone"
              iconColor="text-blue-500"
              delay={0.1}
            />
          </div>
        </div>
      </SectionBlock>

      {/* --- WHY DJAMKO - BENTO GRID --- */}
      <section className="py-24 px-6 relative overflow-hidden bg-zinc-50 dark:bg-zinc-900/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 space-y-4">
            <span className="text-primary font-black uppercase tracking-[0.3em] text-[10px]">L'Excellence Djamko</span>
            <h2 className="text-4xl md:text-6xl font-black tracking-tight">Pourquoi nous choisir ?</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 grid-rows-2 gap-6 h-auto md:h-[580px]">
            {/* Large Card 1 - Unified Interface */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              className="md:col-span-8 bg-white dark:bg-zinc-900 border border-border/50 rounded-[40px] p-10 flex flex-col justify-between group overflow-hidden relative"
            >
              <div className="space-y-4 relative z-10">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-6">
                  <Icon icon="solar:widget-bold-duotone" className="w-7 h-7" />
                </div>
                <h3 className="text-3xl md:text-4xl font-black tracking-tight">Interface Unifiée</h3>
                <p className="text-lg text-muted-foreground max-w-xl font-medium leading-relaxed">
                  Passez d'une commande de service à l'envoi d'un colis export en un seul geste. Une expérience sans couture pour tous vos besoins.
                </p>
              </div>
              <div className="absolute -bottom-10 -right-10 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">
                <Icon icon="solar:widget-bold-duotone" width={280} height={280} />
              </div>
            </motion.div>

            {/* Small Card 1 - Confiance (Brand Primary) */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="md:col-span-4 bg-primary text-white rounded-[40px] p-10 flex flex-col justify-between group overflow-hidden relative"
            >
              <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center mb-6 relative z-10 transition-transform group-hover:scale-110">
                <Icon icon="solar:medal-star-bold-duotone" className="w-7 h-7" />
              </div>
              <div className="space-y-3 relative z-10">
                <h3 className="text-2xl md:text-3xl font-black">Confiance Absolue</h3>
                <p className="text-white/80 font-medium leading-relaxed text-sm md:text-base">
                  Chaque membre de l'écosystème est vérifié pour garantir des échanges sereins.
                </p>
              </div>
              <div className="absolute -bottom-6 -right-6 opacity-10 pointer-events-none">
                <Icon icon="solar:shield-check-bold-duotone" width={120} height={120} />
              </div>
            </motion.div>

            {/* Small Card 2 - IA (Brand Secondary) */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="md:col-span-4 bg-secondary text-white rounded-[40px] p-10 flex flex-col justify-between group overflow-hidden relative"
            >
              <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center mb-6 relative z-10 transition-transform group-hover:scale-110">
                <Icon icon="solar:cpu-bold-duotone" className="w-7 h-7" />
              </div>
              <div className="space-y-3 relative z-10">
                <h3 className="text-2xl md:text-3xl font-black">Mise en Relation IA</h3>
                <p className="text-white/80 font-medium leading-relaxed text-sm md:text-base">
                  Notre algorithme propriétaire vous connecte instantanément à la solution idéale.
                </p>
              </div>
              <div className="absolute -bottom-6 -right-6 opacity-10 pointer-events-none">
                <Icon icon="solar:cpu-bold-duotone" width={120} height={120} />
              </div>
            </motion.div>

            {/* Large Card 2 - Expansion (Brand Primary Darker/Deep) */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="md:col-span-8 bg-zinc-900 rounded-[40px] p-10 flex flex-col md:flex-row items-center gap-10 overflow-hidden relative group text-white"
            >
              <div className="flex-1 space-y-6 relative z-10">
                <h3 className="text-3xl md:text-4xl font-black leading-tight tracking-tight">Expansion <br />Sans Limites</h3>
                <p className="text-zinc-400 text-lg font-medium leading-relaxed mb-6">
                  De votre domicile à l'international, Djamko brise les barrières géographiques pour vos projets.
                </p>
                <div className="flex flex-wrap gap-3">
                  {["Abidjan", "Paris", "Dubaï"].map((city) => (
                    <div key={city} className="px-5 py-2 rounded-full bg-white/10 border border-white/10 font-bold backdrop-blur-md italic text-xs transition-colors hover:bg-primary/40">
                      {city}
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex-1 flex justify-center relative z-10 transition-transform duration-700 group-hover:scale-110">
                <Icon icon="solar:globus-up-bold-duotone" width={200} height={200} className="text-primary opacity-40" />
              </div>
              <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_top_right,rgba(251,146,60,0.1),transparent_70%)]" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* --- FINAL CTA --- */}
      <section className="py-12 px-6">
        <div className="max-w-4xl mx-auto rounded-[48px] bg-foreground text-background p-10 md:p-16 text-center space-y-8 relative overflow-hidden shadow-[0_40px_100px_-20px_rgba(0,0,0,0.5)]">
          <div className="absolute top-0 right-0 w-[40rem] h-[40rem] bg-primary/30 blur-[140px] rounded-full -mr-60 -mt-60" />
          <div className="absolute bottom-0 left-0 w-[30rem] h-[30rem] bg-blue-500/20 blur-[120px] rounded-full -ml-32 -mb-32" />

          <div className="relative z-10 space-y-6">
            <motion.div initial={{ opacity: 0, scale: 0.8 }} whileInView={{ opacity: 1, scale: 1 }} className="inline-flex p-4 rounded-[24px] bg-primary/10 border border-primary/20 backdrop-blur-xl mb-2">
              <Icon icon="solar:crown-bold-duotone" className="text-primary w-12 h-12" />
            </motion.div>
            <h2 className="text-3xl md:text-5xl font-black tracking-tighter leading-[1]">
              Prêt pour <br />
              <span className="text-primary italic">le Futur ?</span>
            </h2>
            <p className="text-lg md:text-xl text-zinc-400 max-w-xl mx-auto font-medium leading-normal">
              Rejoignez l'écosystème qui définit les nouveaux standards de l'économie digitale globale.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-6">
              <button className="w-full sm:w-auto px-10 py-4 rounded-full bg-primary text-primary-foreground text-xl font-black hover:scale-105 active:scale-95 transition-all shadow-[0_20px_50px_-10px_rgba(251,146,60,0.5)]">
                Commencer maintenant
              </button>
              <button className="w-full sm:w-auto px-10 py-4 rounded-full bg-zinc-900 border border-zinc-800 text-lg font-bold hover:bg-zinc-800 transition-colors">
                Contacter un expert
              </button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
