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
      <section className="relative w-full pt-20 pb-32 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full pointer-events-none opacity-20">
          <div className="absolute top-20 left-10 w-96 h-96 bg-primary/30 rounded-full blur-[120px] animate-pulse" />
          <div className="absolute bottom-10 right-10 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[150px]" />
        </div>

        <div className="container mx-auto px-6 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="space-y-8"
          >
            <span className="inline-block px-4 py-2 rounded-full bg-primary/5 border border-primary/10 text-primary text-[10px] sm:text-xs font-black uppercase tracking-[0.3em]">
              L'Écosystème Digital Tout-en-Un
            </span>
            <h1 className="text-5xl md:text-8xl font-black text-foreground tracking-tight leading-[0.95] max-w-5xl mx-auto">
              Bienvenue dans <br />
              <span className="text-primary italic">l'ère Nexxa.</span>
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto font-medium leading-relaxed">
              Nexxa n'est pas seulement une application, c'est le point de rencontre entre le besoin local et l'opportunité globale. 
              Services, produits et logistique, connectés en un seul geste.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-4">
               <div className="flex -space-x-3">
                  {[1,2,3,4].map(i => (
                    <div key={i} className="w-12 h-12 rounded-full border-4 border-background bg-muted overflow-hidden">
                       <img src={`/avatars/user${i}.png`} alt="User" className="w-full h-full object-cover" />
                    </div>
                  ))}
               </div>
               <p className="text-sm font-bold text-foreground/60 tracking-wide">
                 Rejoignez une communauté de <span className="text-primary">+10k</span> utilisateurs
               </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4, duration: 1 }}
            className="mt-24 flex justify-center"
          >
             <div className="relative group">
                <div className="absolute inset-0 bg-primary/20 blur-[60px] rounded-full group-hover:bg-primary/30 transition-all duration-700" />
                <IconIllustration 
                    icon="solar:globus-bold-duotone" 
                    size={160} 
                    className="text-primary relative z-10" 
                />
             </div>
          </motion.div>
        </div>
      </section>

      {/* --- SERVICES SECTION --- */}
      <SectionBlock
        id="services"
        title="Services à la demande"
        subtitle="Expertise & Proximité"
        illustration={
          <IconIllustration icon="solar:user-speak-bold-duotone" size={200} className="text-indigo-500" />
        }
      >
        <div className="space-y-8">
          <p className="text-lg text-muted-foreground leading-relaxed font-medium">
            Trouvez en quelques clics le prestataire idéal. Du dépannage d'urgence au service à domicile, 
            Nexxa vous connecte avec des experts qualifiés et évalués par la communauté.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <FeatureCard
              title="Experts Certifiés"
              description="Sécurité et qualité garanties."
              utility="Chaque prestataire suit un processus de vérification rigoureux pour assurer votre tranquillité."
              examples={["Dépannage d'urgence", "Entretien & Travaux", "Consulting Pro"]}
              icon="solar:verified-check-bold-duotone"
              iconColor="text-indigo-500"
            />
            <FeatureCard
              title="Réservation Instantanée"
              description="Une réponse immédiate à vos besoins."
              utility="Grâce à notre technologie de mise en relation intelligente, réduisez vos délais d'attente."
              examples={["RDV en 1 clic", "Suivi en temps réel", "Paiement sécurisé"]}
              icon="solar:calendar-date-bold-duotone"
              iconColor="text-indigo-500"
              delay={0.1}
            />
          </div>
          <button className="flex items-center gap-2 px-8 py-4 rounded-2xl bg-indigo-500/10 text-indigo-600 font-bold hover:bg-indigo-500/20 transition-all">
            Trouver un service <Icon icon="solar:arrow-right-up-bold" />
          </button>
        </div>
      </SectionBlock>

      {/* --- MARKETPLACE SECTION --- */}
      <SectionBlock
        id="marketplace"
        title="Marketplace Intégrée"
        subtitle="Commerce Circulaire & Sécurisé"
        reversed
        illustration={
          <IconIllustration icon="solar:shop-bold-duotone" size={200} className="text-amber-500" />
        }
      >
        <div className="space-y-8">
          <p className="text-lg text-muted-foreground leading-relaxed font-medium">
            Vendez, achetez et donnez une seconde vie à vos articles. Notre interface intuitive 
            facilite vos transactions en toute sécurité, directement au sein de la plateforme.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <FeatureCard
              title="Transactions de Confiance"
              description="Un environnement d'achat serein."
              utility="Nous intégrons les systèmes de paiement locaux et internationaux pour des échanges sans friction."
              examples={["Escrow Protection", "Paiement Mobile", "Certificats d'achat"]}
              icon="solar:shield-check-bold-duotone"
              iconColor="text-amber-500"
            />
            <FeatureCard
              title="Interface Intuitive"
              description="Publiez une annonce en 30 secondes."
              utility="Optimisez votre visibilité grâce à notre moteur de recherche et nos outils de mise en avant."
              examples={["Photo Express", "Filtres Précis", "Chat Intégré"]}
              icon="solar:magic-stick-bold-duotone"
              iconColor="text-amber-500"
              delay={0.1}
            />
          </div>
          <button className="flex items-center gap-2 px-8 py-4 rounded-2xl bg-amber-500/10 text-amber-600 font-bold hover:bg-amber-500/20 transition-all">
            Publier une annonce <Icon icon="solar:camera-add-bold" />
          </button>
        </div>
      </SectionBlock>

      {/* --- LOGISTICS SECTION --- */}
      <SectionBlock
        id="logistics"
        title="Logistique & Export"
        subtitle="Expédiez Partout, Sans Friction"
        illustration={
          <IconIllustration icon="solar:delivery-bold-duotone" size={200} className="text-blue-500" />
        }
      >
        <div className="space-y-8">
          <p className="text-lg text-muted-foreground leading-relaxed font-medium">
            Franchissez les frontières sans friction. Nexxa intègre des solutions de transport et de logistique avancées, 
            permettant d'expédier vos marchandises partout avec un suivi 100% transparent.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <FeatureCard
              title="Transport Multi-Modal"
              description="Maritime, Aérien et Routier."
              utility="Des solutions adaptées tant pour une lettre urgente que pour un conteneur complet."
              examples={["Fret International", "Livraison Dernier Km", "Groupage"]}
              icon="solar:delivery-bold-duotone"
              iconColor="text-blue-500"
            />
            <FeatureCard
              title="Suivi Avancé"
              description="La transparence totale pour vos flux."
              utility="Gardez un œil sur vos expéditions à chaque étape, de l'enlèvement à la livraison finale."
              examples={["Tracking Temps Réel", "Notifications Douane", "Preuve de Livraison"]}
              icon="solar:map-point-bold-duotone"
              iconColor="text-blue-500"
              delay={0.1}
            />
          </div>
          <button className="flex items-center gap-2 px-8 py-4 rounded-2xl bg-blue-500/10 text-blue-600 font-bold hover:bg-blue-500/20 transition-all">
            Expédier un colis <Icon icon="solar:box-bold" />
          </button>
        </div>
      </SectionBlock>

      {/* --- WHY NEXXA SECTION --- */}
      <section className="py-24 px-6 relative overflow-hidden bg-primary/[0.02]">
         <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16 space-y-4">
               <h2 className="text-4xl md:text-5xl font-black">Pourquoi choisir Nexxa ?</h2>
               <p className="text-muted-foreground font-medium">L'alliance de la technologie et de la confiance.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
               {[
                 { 
                   title: "La Fluidité", 
                   desc: "Passez d'une recherche de service à l'envoi d'un colis export en un seul geste. Une interface unique pour des besoins multiples.",
                   icon: "solar:widget-bold-duotone",
                   color: "bg-blue-500"
                 },
                 { 
                   title: "La Confiance", 
                   desc: "Chaque utilisateur et prestataire est vérifié pour garantir des échanges sereins et professionnels.",
                   icon: "solar:medal-star-bold-duotone",
                   color: "bg-emerald-500"
                 },
                 { 
                   title: "L'Innovation", 
                   desc: "Grâce à notre technologie de mise en relation intelligente, chaque besoin trouve sa solution instantanément.",
                   icon: "solar:cpu-bold-duotone",
                   color: "bg-purple-500"
                 }
               ].map((item, i) => (
                 <motion.div 
                   key={i}
                   initial={{ opacity: 0, y: 20 }}
                   whileInView={{ opacity: 1, y: 0 }}
                   transition={{ delay: i * 0.1 }}
                   className="p-8 rounded-[32px] bg-card border border-border hover:border-primary/20 hover:shadow-2xl hover:shadow-primary/5 transition-all group"
                 >
                    <div className={`w-14 h-14 rounded-2xl ${item.color} flex items-center justify-center mb-6 shadow-xl shadow-${item.color.split('-')[1]}-500/20 group-hover:scale-110 transition-transform`}>
                       <Icon icon={item.icon} className="text-white w-8 h-8" />
                    </div>
                    <h3 className="text-2xl font-black mb-4">{item.title}</h3>
                    <p className="text-muted-foreground leading-relaxed font-medium">
                       {item.desc}
                    </p>
                 </motion.div>
               ))}
            </div>
         </div>
      </section>

      {/* --- FOOTER CTA --- */}
      <section className="py-32 px-6">
        <div className="max-w-5xl mx-auto rounded-[48px] bg-foreground text-background p-12 md:p-20 text-center space-y-12 relative overflow-hidden">
           <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-primary/20 blur-[100px] rounded-full -mr-40 -mt-40" />
           <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-blue-500/10 blur-[80px] rounded-full -ml-20 -mb-20" />
           
           <div className="relative z-10 space-y-6">
              <motion.div
                 initial={{ opacity: 0, scale: 0.9 }}
                 whileInView={{ opacity: 1, scale: 1 }}
                 className="inline-flex p-4 rounded-3xl bg-primary/20 backdrop-blur-md"
              >
                 <Icon icon="solar:globus-up-bold-duotone" className="text-primary w-12 h-12" />
              </motion.div>
              <h2 className="text-4xl md:text-7xl font-black tracking-tight leading-[1]">
                Connecter les talents, <br />
                <span className="text-primary italic">transporter vos idées.</span>
              </h2>
              <p className="text-xl text-zinc-400 max-w-2xl mx-auto font-medium leading-relaxed">
                Rejoignez l'écosystème qui simplifie votre quotidien et propulse vos projets vers l'international.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-8">
                 <button className="w-full sm:w-auto px-12 py-6 rounded-2xl bg-primary text-primary-foreground text-xl font-black hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-primary/40">
                    Commencer l'aventure
                 </button>
                 <button className="w-full sm:w-auto px-12 py-6 rounded-2xl bg-zinc-900 border border-zinc-800 text-xl font-bold hover:bg-zinc-800 transition-colors">
                    Parler à un expert
                 </button>
              </div>
           </div>
        </div>
      </section>
    </main>
  );
}
