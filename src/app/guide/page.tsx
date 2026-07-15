import Link from "next/link";
import { Icon } from "@iconify/react";
import GuideSection from "./components/GuideSection";
import InstallGuide from "./components/InstallGuide";
import GuideFAQ from "./components/GuideFAQ";
import ScrollSmoothEffect from "./components/ScrollSmoothEffect";


export const metadata = {
    title: "Guide & Centre d'aide | Djamko",
    description: "Découvrez comment créer votre catalogue, gérer vos produits et services, passer commande, et profiter de toutes les fonctionnalités de Djamko.",
};

const TOC = [
    { id: "compte-connexion", label: "Compte & connexion" },
    { id: "catalogue-intro", label: "Le catalogue" },
    { id: "catalogue-gestion", label: "Gérer un catalogue" },
    { id: "collection", label: "Les collections" },
    { id: "partage-catalogue", label: "Partager un catalogue" },
    { id: "partage-produits", label: "Partager produits & services" },
    { id: "commande", label: "Passer commande" },
    { id: "panier", label: "Le panier" },
    { id: "services-demande", label: "Services à la demande" },
    { id: "annonces", label: "Les annonces" },
    { id: "logistique", label: "Service logistique" },
    { id: "gaz", label: "Recharge de gaz" },
    { id: "installation", label: "Installer l'application" },
    { id: "faq", label: "Questions fréquentes" },
];

export default function GuidePage() {
    return (
        <div className="min-h-screen bg-background">
            <ScrollSmoothEffect />

            {/* ── Hero ── */}
            <div className="px-6 pt-10 pb-6">
                <div className="max-w-5xl mx-auto text-center">
                    <Link href="/" className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-primary transition-colors mb-8 group">
                        <Icon icon="solar:arrow-left-bold" className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                        Retour à l'accueil
                    </Link>

                    <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
                        <Icon icon="solar:book-bookmark-bold-duotone" className="w-9 h-9 text-primary" />
                    </div>
                    <h1 className="text-3xl md:text-5xl font-black text-foreground tracking-tight mb-4">
                        Le guide complet de <span className="text-primary">Djamko</span>
                    </h1>

                    <p className="text-foreground/90 text-base md:text-xl font-bold leading-relaxed max-w-3xl mx-auto mb-5">
                        Djamko est une super-application qui réunit en un seul endroit tout ce dont particuliers, prestataires et entreprises ont besoin au quotidien : achat et vente en boutique en ligne, réservation de services à la demande, publication d'annonces, recharge de gaz à domicile, livraison express, logistique nationale et internationale, et lives shopping pour vendre en direct.
                    </p>

                    <div className="flex flex-wrap items-center justify-center gap-2 mb-6">
                        {[
                            { icon: "solar:bag-heart-bold-duotone", label: "Boutique en ligne" },
                            { icon: "solar:hand-stars-bold-duotone", label: "Services à la demande" },
                            { icon: "solar:megaphone-bold-duotone", label: "Annonces" },
                            { icon: "mdi:propane-tank", label: "Recharge de gaz" },
                            { icon: "solar:delivery-bold-duotone", label: "Livraison express" },
                            { icon: "solar:ship-bold-duotone", label: "Logistique" },
                            { icon: "solar:play-circle-bold-duotone", label: "Lives shopping" },
                        ].map((s) => (
                            <span key={s.label} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/5 border border-primary/10 text-xs font-bold text-foreground/80">
                                <Icon icon={s.icon} className="w-3.5 h-3.5 text-primary" />
                                {s.label}
                            </span>
                        ))}
                    </div>

                    <p className="text-muted-foreground text-base md:text-lg leading-relaxed max-w-2xl mx-auto">
                        Catalogue, produits, services, annonces, commandes, logistique... tout ce qu'il faut savoir pour tirer le meilleur parti de votre activité sur Djamko.
                    </p>
                </div>
            </div>

            {/* ── Sommaire ── */}
            <div className="px-6 pb-4">
                <div className="max-w-5xl mx-auto">
                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                        {TOC.map(item => (
                            <a
                                key={item.id}
                                href={`#${item.id}`}
                                className="shrink-0 px-4 py-2 rounded-full bg-muted text-xs font-bold text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors whitespace-nowrap"
                            >
                                {item.label}
                            </a>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── Sections ── */}
            <div className="max-w-5xl mx-auto px-6">

                <GuideSection
                    id="compte-connexion"
                    eyebrow="01 — Compte & connexion"
                    title="Créer un compte et se connecter"
                    description="Avant d'explorer le catalogue, créez votre compte Djamko ou connectez-vous si vous en avez déjà un — c'est la première étape pour commander, vendre ou publier."
                    icon="solar:user-circle-bold-duotone"
                    accentIcon="solar:login-3-bold-duotone"
                    tone="primary"
                    steps={[
                        { title: "Créer un compte", description: "Depuis la page d'accueil, cliquez sur « Créer un compte », renseignez votre numéro de téléphone (ou email), votre nom et un mot de passe, puis validez. Choisissez ensuite votre profil : client, prestataire ou entreprise." },
                        { title: "Se connecter", description: "Si vous avez déjà un compte, cliquez sur « Se connecter » et saisissez votre téléphone ou email avec votre mot de passe pour accéder à votre espace." },
                        { title: "Accéder à son compte depuis l'accueil", description: "Une fois connecté, cliquez à tout moment sur l'icône de profil en haut de la page d'accueil pour retrouver votre espace personnel « Mon espace »." },
                    ]}
                    info="Mot de passe oublié ? Utilisez le lien « Mot de passe oublié » sur la page de connexion pour le réinitialiser en quelques étapes."
                    tip="Complétez votre profil (nom, photo, adresse) dès la création du compte : cela accélère vos prochaines commandes et rassure vos futurs clients si vous vendez."
                />

                <GuideSection
                    id="catalogue-intro"
                    eyebrow="02 — Le catalogue"
                    title="À propos du catalogue"
                    description="Le catalogue, c'est la vitrine de votre boutique en ligne : l'ensemble des produits ou services que vous proposez, présentés de façon claire et organisée à vos clients."
                    icon="solar:widget-2-bold-duotone"
                    tone="primary"
                    steps={[
                        { title: "Une vitrine centralisée", description: "Tous vos produits sont regroupés au même endroit, accessibles via le lien de votre boutique." },
                        { title: "Une image professionnelle", description: "Un catalogue bien organisé inspire confiance et donne une image sérieuse à votre activité." },
                        { title: "Plus de ventes", description: "Les clients trouvent plus facilement ce qu'ils cherchent, ce qui augmente vos chances de vendre." },
                    ]}
                    tip="Ajoutez des photos nettes et un nom de boutique clair : c'est souvent la première chose que voit un client avant d'explorer vos produits."
                />

                <GuideSection
                    id="catalogue-gestion"
                    eyebrow="03 — Gestion"
                    title="Comment créer et gérer un catalogue"
                    description="La gestion de votre catalogue se fait entièrement depuis l'onglet « Boutique » de votre espace personnel."
                    icon="solar:box-bold-duotone"
                    accentIcon="solar:pen-new-square-bold-duotone"
                    tone="orange"
                    reverse
                    steps={[
                        { title: "Créer un produit", description: "Depuis « Boutique », cliquez sur « Publier un article », renseignez nom, prix, photos et catégorie, puis validez." },
                        { title: "Modifier un produit", description: "Ouvrez le Catalogue, sélectionnez le produit puis l'icône crayon pour mettre à jour ses informations à tout moment." },
                        { title: "Suspendre ou supprimer", description: "Désactivez temporairement un produit en rupture de stock via l'interrupteur, ou supprimez-le définitivement depuis le menu du produit." },
                    ]}
                    info="Un produit désactivé reste dans votre catalogue mais n'apparaît plus pour les acheteurs — pratique pendant une rupture de stock temporaire."
                    tip="Gardez vos stocks à jour : un produit toujours disponible mais épuisé génère des commandes que vous ne pourrez pas honorer."
                />

                <GuideSection
                    id="collection"
                    eyebrow="04 — Collections"
                    title="Comment créer et gérer une collection"
                    description="Une collection permet de regrouper plusieurs produits par thème (nouveautés, promotions, catégorie particulière) pour faciliter la navigation dans votre catalogue."
                    icon="solar:folder-bookmark-bold-duotone"
                    tone="purple"
                    steps={[
                        { title: "Créer la collection", description: "Donnez-lui un nom clair (ex : « Nouveautés », « Promo de la semaine ») et une image de couverture si possible." },
                        { title: "Ajouter des produits", description: "Depuis un produit existant, associez-le à une ou plusieurs collections pour qu'il y apparaisse." },
                        { title: "Réorganiser", description: "Modifiez à tout moment l'ordre et le contenu de vos collections selon vos priorités du moment." },
                    ]}
                    tip="Une collection « Promotions » régulièrement mise à jour incite les clients à revenir régulièrement consulter votre boutique."
                />

                <GuideSection
                    id="partage-catalogue"
                    eyebrow="05 — Partage"
                    title="Partager le lien d'un catalogue"
                    description="Chaque boutique dispose d'un lien unique que vous pouvez partager partout pour amener directement vos clients vers votre catalogue."
                    icon="solar:link-circle-bold-duotone"
                    accentIcon="solar:share-bold-duotone"
                    tone="cyan"
                    reverse
                    steps={[
                        { title: "Copier le lien", description: "Depuis « Boutique », utilisez l'icône de partage à côté du nom de votre boutique pour copier le lien ou générer un QR Code." },
                        { title: "Choisir où le partager", description: "WhatsApp, Facebook, Instagram, Statuts, SMS, ou directement en boutique physique via le QR Code imprimé." },
                        { title: "Suivre les résultats", description: "Observez l'évolution de vos commandes et vues de catalogue depuis les statistiques de votre boutique." },
                    ]}
                    tip="Affichez le QR Code de votre boutique en magasin ou sur vos flyers : vos clients scannent et accèdent instantanément à votre catalogue en ligne."
                />

                <GuideSection
                    id="partage-produits"
                    eyebrow="06 — Partage produits & services"
                    title="Partager ses produits ou ses services"
                    description="En plus du catalogue entier, chaque produit et chaque service dispose de son propre lien de partage — idéal pour mettre en avant un article précis."
                    icon="solar:share-circle-bold-duotone"
                    tone="emerald"
                    steps={[
                        { title: "Partager un produit", description: "Depuis la fiche produit, utilisez le bouton de partage pour envoyer directement le lien de cet article." },
                        { title: "Partager un service", description: "Le même principe s'applique à vos services : chaque fiche service a son lien dédié, partageable en un clic." },
                        { title: "Choisir la plateforme", description: "WhatsApp pour vos contacts directs, Facebook pour toucher une audience plus large, ou copier le lien pour l'utiliser où vous le souhaitez." },
                    ]}
                    info="Un lien de produit ou de service reste valable même si vous modifiez son prix, ses photos ou sa description par la suite."
                />

                <GuideSection
                    id="commande"
                    eyebrow="07 — Commander"
                    title="Comment passer une commande"
                    description="Commander un produit sur Djamko se fait en quelques étapes simples, du choix de l'article jusqu'au suivi de la livraison."
                    icon="solar:cart-large-4-bold-duotone"
                    accentIcon="solar:card-bold-duotone"
                    tone="blue"
                    reverse
                    steps={[
                        { title: "Rechercher un produit", description: "Utilisez la recherche ou parcourez les catégories pour trouver l'article qui vous intéresse." },
                        { title: "Ajouter au panier", description: "Choisissez la quantité souhaitée puis ajoutez le produit à votre panier." },
                        { title: "Valider la commande", description: "Vérifiez votre panier, renseignez votre adresse de livraison, puis validez votre commande." },
                        { title: "Payer", description: "Choisissez le paiement à la livraison ou un moyen de paiement mobile (Wave, Orange Money, MTN Money, Moov Money)." },
                        { title: "Suivre la commande", description: "Suivez l'évolution du statut de votre commande en temps réel depuis « Commandes »." },
                    ]}
                />

                <GuideSection
                    id="panier"
                    eyebrow="08 — Le panier"
                    title="Comment gérer son panier"
                    description="Le panier rassemble tous les produits que vous souhaitez acheter avant de passer commande."
                    icon="solar:cart-check-bold-duotone"
                    tone="rose"
                    steps={[
                        { title: "Ajouter un produit", description: "Depuis la fiche d'un produit, cliquez sur « Ajouter au panier »." },
                        { title: "Modifier la quantité", description: "Dans le panier, augmentez ou diminuez la quantité de chaque article avec les boutons + et -." },
                        { title: "Supprimer un produit", description: "Retirez un article du panier à tout moment avant validation." },
                        { title: "Passer commande", description: "Une fois satisfait de votre sélection, validez pour passer à l'étape de commande." },
                    ]}
                    tip="Le panier conserve vos articles même si vous quittez l'application — vous pouvez reprendre votre commande plus tard."
                />

                <GuideSection
                    id="services-demande"
                    eyebrow="09 — Services à la demande"
                    title="À propos des services à la demande"
                    description="Les services à la demande mettent en relation des clients ayant besoin d'une intervention (dépannage, prestation, entretien...) avec des prestataires disponibles autour d'eux."
                    icon="solar:hand-stars-bold-duotone"
                    accentIcon="solar:clipboard-check-bold-duotone"
                    tone="indigo"
                    reverse
                    steps={[
                        { title: "Publier une demande", description: "En tant que client, décrivez votre besoin, votre localisation et le type d'intervention souhaité." },
                        { title: "Répondre à une demande", description: "En tant que prestataire, consultez les demandes disponibles dans votre zone et proposez vos services." },
                        { title: "Confirmer le rendez-vous", description: "Une fois d'accord sur les modalités, le rendez-vous est planifié et suivi depuis l'onglet « Rendez-vous »." },
                    ]}
                    info="Publier un service ou répondre à une demande est gratuit — seule la mise en avant (boost) est une option payante."
                />

                <GuideSection
                    id="annonces"
                    eyebrow="10 — Annonces"
                    title="À propos des annonces"
                    description="Les annonces permettent de publier des biens (immobilier, véhicules, équipements...) à vendre, louer ou échanger."
                    icon="solar:megaphone-bold-duotone"
                    tone="amber"
                    steps={[
                        { title: "Publier une annonce", description: "Renseignez le type de bien, ses caractéristiques, son prix et ajoutez plusieurs photos de qualité." },
                        { title: "Modifier une annonce", description: "Mettez à jour le prix, la description ou les photos à tout moment depuis « Mes Annonces »." },
                        { title: "Supprimer une annonce", description: "Retirez une annonce définitivement une fois le bien vendu ou loué." },
                        { title: "Partager l'annonce", description: "Utilisez le bouton de partage pour diffuser votre annonce sur WhatsApp, Facebook ou via un lien direct." },
                    ]}
                    tip="Des photos prises en pleine lumière, sous plusieurs angles, augmentent nettement les chances de contact pour une annonce."
                />

                <GuideSection
                    id="logistique"
                    eyebrow="11 — Logistique"
                    title="À propos du service logistique"
                    description="Le service logistique de Djamko connecte des entreprises de transport à des clients ayant besoin d'acheminer des marchandises, localement ou à l'international."
                    icon="solar:delivery-bold-duotone"
                    accentIcon="solar:map-point-wave-bold-duotone"
                    tone="secondary"
                    reverse
                    steps={[
                        { title: "Demander un devis", description: "Indiquez le type de transport, le départ, la destination et les caractéristiques de la marchandise." },
                        { title: "Recevoir une proposition", description: "Une entreprise de transport partenaire vous répond avec un devis détaillé." },
                        { title: "Suivre la livraison", description: "Une fois le devis accepté, suivez chaque étape de l'acheminement grâce au code de suivi dédié." },
                    ]}
                    info="Le suivi affiche les statuts clés de la livraison (préparation, en transit, dédouanement, livraison) en temps réel."
                />

                <GuideSection
                    id="gaz"
                    eyebrow="12 — Recharge de gaz"
                    title="À propos de la recharge de gaz à domicile"
                    description="L'onglet « Gaz » vous met en relation avec des prestataires de recharge de bouteilles de gaz près de chez vous, avec livraison directement à domicile."
                    icon="mdi:propane-tank"
                    accentIcon="solar:map-point-bold-duotone"
                    tone="fuchsia"
                    steps={[
                        { title: "Trouver un prestataire", description: "Autorisez la géolocalisation pour voir en priorité les prestataires disponibles les plus proches de vous." },
                        { title: "Consulter le catalogue", description: "Ouvrez la fiche d'un prestataire pour voir ses bouteilles disponibles par format, marque et prix." },
                        { title: "Commander la livraison", description: "Choisissez le format de bouteille souhaité, confirmez votre adresse et votre position GPS, puis validez votre demande." },
                        { title: "Suivre la demande", description: "Un prestataire disponible accepte votre demande et vient livrer votre bouteille à l'adresse indiquée." },
                    ]}
                    info="Si aucun prestataire n'est disponible à proximité, l'application affiche automatiquement tous les prestataires disponibles, classés par ordre de disponibilité."
                    tip="Passez toujours votre commande depuis l'application plutôt que par appel ou WhatsApp direct : c'est la seule façon de bénéficier du suivi et des garanties de Djamko en cas de litige."
                />

            </div>

            {/* ── Installation de l'application ── */}
            <div className="bg-muted/30 py-14 md:py-16">
                <div className="max-w-5xl mx-auto px-6">
                    <section id="installation" className="scroll-mt-28">
                        <div className="text-center max-w-2xl mx-auto mb-10">
                            <p className="text-[11px] font-black text-primary uppercase tracking-[0.2em] mb-2">13 — Installation</p>
                            <h2 className="text-2xl md:text-3xl font-black text-foreground tracking-tight mb-4">
                                Installer l'application Djamko
                            </h2>
                            <p className="text-muted-foreground leading-relaxed">
                                Djamko s'installe directement depuis votre navigateur, sans passer par un store — un accès plus rapide et des notifications fiables au quotidien.
                            </p>
                        </div>

                        <InstallGuide />
                    </section>
                </div>
            </div>

            {/* ── FAQ ── */}
            <div className="max-w-5xl mx-auto px-6 py-14 md:py-16">
                <section id="faq" className="scroll-mt-28">
                    <div className="text-center max-w-2xl mx-auto mb-10">
                        <p className="text-[11px] font-black text-primary uppercase tracking-[0.2em] mb-2">Questions fréquentes</p>
                        <h2 className="text-2xl md:text-3xl font-black text-foreground tracking-tight">
                            Vous avez encore une question ?
                        </h2>
                    </div>
                    <GuideFAQ />
                </section>
            </div>

            {/* ── CTA de clôture ── */}
            <div className="px-6 pb-16">
                <div className="max-w-5xl mx-auto">
                    <div className="rounded-3xl bg-card border border-border p-8 md:p-12 text-center relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -mr-32 -mt-32 blur-3xl" />
                        <div className="relative z-10">
                            <Icon icon="solar:shield-check-bold-duotone" className="w-12 h-12 text-primary mx-auto mb-4 opacity-30" />
                            <h3 className="text-xl md:text-2xl font-black text-foreground mb-3">Prêt à passer à l'action ?</h3>
                            <p className="text-muted-foreground text-sm mb-6 max-w-md mx-auto">
                                Retrouvez toutes ces fonctionnalités directement depuis votre espace personnel Djamko.
                            </p>
                            <Link href="/akwaba" className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-black text-sm px-6 py-3 rounded-2xl shadow-lg shadow-primary/20 hover:bg-secondary transition-all">
                                Aller à mon espace
                                <Icon icon="solar:arrow-right-bold" className="w-4 h-4" />
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
