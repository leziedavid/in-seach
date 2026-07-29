import Content from "@/components/home/Content";
import { CookieConsentModal } from "@/components/modals/CookieConsentModal";
import InstallPWA from "@/components/pwa/InstallPWA";

// Sans cette directive, Next.js pré-rend cette page statiquement (ISR, stale-time par
// défaut) — sur Vercel, ce cache est persistant *à travers les déploiements* et n'est pas
// automatiquement purgé à chaque déploiement. Un utilisateur peut donc recevoir un HTML mis
// en cache référençant les chunks JS d'un ancien build, potentiellement supprimés par un
// déploiement plus récent → chargement de ressources incohérentes/manquantes. Comme le
// contenu réel (catégories, services, etc.) est entièrement piloté par des composants
// client qui fetchent au montage, rien n'est réellement gagné à figer le HTML statique ici
// — mais on s'expose à servir une coquille périmée. force-dynamic garantit un rendu frais
// référençant toujours le build actuellement déployé.
export const dynamic = 'force-dynamic';

export default function Page() {
  return (
    <>
      <Content />
      <CookieConsentModal />
      <InstallPWA />
    </>
  );
}
