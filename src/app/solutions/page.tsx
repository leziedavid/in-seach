"use client";

import { motion } from "framer-motion";
import IconIllustration from "@/components/solutions/IconIllustration";
import FeatureCard from "@/components/solutions/FeatureCard";
import SectionBlock from "@/components/solutions/SectionBlock";
import { Icon } from "@iconify/react";

export default function SolutionsPage() {
  return (
    <main className="min-h-screen bg-background">
      {/* --- HERO SECTION --- */}
      <section className="relative w-full pt-12 pb-32 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full pointer-events-none opacity-20">
          <div className="absolute top-20 left-10 w-96 h-96 bg-primary/30 rounded-full blur-[120px] animate-pulse" />
          <div className="absolute bottom-10 right-10 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[150px]" />
        </div>

        <div className="container mx-auto px-6 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="space-y-6"
          >
            <span className="inline-block px-4 py-1.5 rounded-full bg-primary/5 border border-primary/10 text-primary text-[10px] font-black uppercase tracking-[0.3em]">
              L'Écosystème Digital Complet
            </span>
            <h1 className="text-5xl md:text-7xl font-black text-foreground tracking-tight leading-[1] max-w-4xl mx-auto">
              Une Plateforme, <br />
              <span className="text-primary italic">Des Possibilités Infinies.</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto font-medium leading-relaxed">
              De la marketplace au service expert, en passant par la logistique internationale, 
              découvrez comment notre solution transforme vos échanges.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4, duration: 1 }}
            className="mt-20 flex justify-center"
          >
             <IconIllustration 
                icon="solar:globus-bold-duotone" 
                size={120} 
                className="text-primary" 
             />
          </motion.div>
        </div>
      </section>

      {/* --- MARKETPLACE SECTION --- */}
      <SectionBlock
        id="marketplace"
        title="Marketplace B2B & B2C"
        subtitle="E-Commerce Haute-Performance"
        illustration={
          <IconIllustration icon="solar:shop-bold-duotone" size={180} color="text-amber-500" />
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FeatureCard
            title="Gestion de Stocks"
            description="Contrôle précis et en temps réel."
            utility="Permet aux vendeurs de suivre leurs inventaires et d'automatiser les alertes de rupture."
            examples={["Mise à jour automatique des stocks", "Gestion des catégories de produits"]}
            icon="solar:box-bold-duotone"
            iconColor="text-amber-500"
          />
          <FeatureCard
            title="Commandes & Paiements"
            description="Processus d'achat fluide et sécurisé."
            utility="Facilite les transactions entre clients et marchands avec plusieurs modes de paiement."
            examples={["Paiement via Wave/Orange Money", "Suivi de statut des commandes"]}
            icon="solar:card-2-bold-duotone"
            iconColor="text-amber-500"
            delay={0.1}
          />
        </div>
      </SectionBlock>

      {/* --- SERVICES SECTION --- */}
      <SectionBlock
        id="services"
        title="Services & Interventions"
        subtitle="Expertise à la Demande"
        reversed
        illustration={
          <IconIllustration icon="solar:user-speak-bold-duotone" size={180} color="text-indigo-500" />
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FeatureCard
            title="Réservation Intelligente"
            description="Planifiez des interventions en quelques clics."
            utility="Met en relation les prestataires certifiés avec les clients ayant des besoins spécifiques."
            examples={["RDV de dépannage à domicile", "Location de matériel professionnel"]}
            icon="solar:calendar-date-bold-duotone"
            iconColor="text-indigo-500"
          />
          <FeatureCard
            title="Validation par QR Code"
            description="Sécurité et preuve d'intervention."
            utility="Garantit que le service a été rendu via un scan mutuel du prestataire et du client."
            examples={["Scan QR Code au début/fin", "Certificat de service numérique"]}
            icon="solar:qr-code-bold-duotone"
            iconColor="text-indigo-500"
            delay={0.1}
          />
        </div>
      </SectionBlock>

      {/* --- LOGISTICS SECTION --- */}
      <SectionBlock
        id="logistics"
        title="Logistique & Grand Import"
        subtitle="Transport International"
        illustration={
          <IconIllustration icon="solar:delivery-bold-duotone" size={180} color="text-blue-500" />
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FeatureCard
            title="Multi-Modalité"
            description="Maritime, Aérien et Routier."
            utility="Permet de gérer des flux logistiques complexes depuis l'international jusqu'au dernier kilomètre."
            examples={["Suivi de conteneurs maritimes", "Fret aérien express"]}
            icon="solar:ship-bold-duotone"
            iconColor="text-blue-500"
          />
          <FeatureCard
            title="Tracking & Devis"
            description="Transparence totale sur vos envois."
            utility="Générez des demandes de devis complexes et suivez l'avancement de vos colis en temps réel."
            examples={["Suivi en temps réel (GPS)", "Historique des étapes douanières"]}
            icon="solar:route-bold-duotone"
            iconColor="text-blue-500"
            delay={0.1}
          />
        </div>
      </SectionBlock>

      {/* --- ADS SECTION --- */}
      <SectionBlock
        id="ads"
        title="Petites Annonces"
        subtitle="Ventes & Occasions"
        reversed
        illustration={
          <IconIllustration icon="solar:bill-list-bold-duotone" size={180} color="text-emerald-500" />
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FeatureCard
            title="Dépôt d'Annonce"
            description="Mise en ligne rapide et simplifiée."
            utility="Permet aux particuliers et entreprises de vendre des biens d'occasion ou neufs."
            examples={["Upload multiple d'images", "Géolocalisation de l'annonce"]}
            icon="solar:camera-add-bold-duotone"
            iconColor="text-emerald-500"
          />
          <FeatureCard
            title="Catégories Surgies"
            description="Recherche optimisée par types."
            utility="Aide les utilisateurs à trouver exactement ce qu'ils cherchent via des filtres puissants."
            examples={["Filtres par prix/état", "Alertes sur nouvelles annonces"]}
            icon="solar:filter-bold-duotone"
            iconColor="text-emerald-500"
            delay={0.1}
          />
        </div>
      </SectionBlock>

      {/* --- TRUST & DEV SECTION --- */}
      <SectionBlock
        id="dev"
        title="SaaS & Extensibilité"
        subtitle="Pour les Développeurs & Pro"
        illustration={
          <IconIllustration icon="solar:medal-star-bold-duotone" size={180} color="text-rose-500" />
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FeatureCard
            title="Abonnements Premium"
            description="Plans adaptés à votre croissance."
            utility="Accédez à des fonctionnalités avancées et augmentez vos limites opérationnelles."
            examples={["Badge Pro certifié", "Priorité dans les résultats de recherche"]}
            icon="solar:crown-bold-duotone"
            iconColor="text-rose-500"
          />
          <FeatureCard
            title="API Publique"
            description="Intégrez notre puissance chez vous."
            utility="Utilisez nos endpoints sécurisés pour synchroniser vos données et étendre vos services."
            examples={["Clés API sécurisées", "Documentation Open API"]}
            icon="solar:code-bold-duotone"
            iconColor="text-rose-500"
            delay={0.1}
          />
        </div>
      </SectionBlock>

      {/* --- FOOTER CTA --- */}
      <section className="py-32 px-6 bg-card border-t border-border mt-20">
        <div className="max-w-4xl mx-auto text-center space-y-12">
           <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              className="inline-flex p-4 rounded-3xl bg-primary/10"
           >
              <Icon icon="solar:globus-up-bold-duotone" className="text-primary w-12 h-12" />
           </motion.div>
           <h2 className="text-4xl md:text-6xl font-black tracking-tight">Prêt à transformer votre entreprise ?</h2>
           <p className="text-xl text-muted-foreground font-medium">
             Rejoignez des milliers d'utilisateurs qui font confiance à notre solution pour leur quotidien.
           </p>
           <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button className="px-10 py-5 rounded-2xl bg-primary text-primary-foreground text-lg font-black hover:scale-105 active:scale-95 transition-all shadow-xl shadow-primary/20">
                 Commencer maintenant
              </button>
              <button className="px-10 py-5 rounded-2xl bg-card border border-border text-lg font-bold hover:bg-muted/50 transition-colors">
                 Parler à un expert
              </button>
           </div>
        </div>
      </section>
    </main>
  );
}
