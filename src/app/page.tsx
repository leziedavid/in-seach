import Content from "@/components/home/Content";
import { CookieConsentModal } from "@/components/modals/CookieConsentModal";
import InstallPWA from "@/components/pwa/InstallPWA";

export default function Page() {
  return (
    <>
      <Content />
      <CookieConsentModal />
      <InstallPWA />
    </>
  );
}
