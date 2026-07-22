import magnumLogo from "@/assets/stores/magnum.png";
import airbaFreshLogo from "@/assets/stores/airba_fresh.png";
import astoreLogo from "@/assets/stores/astore.png";
import arbuzLogo from "@/assets/stores/arbuz.png";
import smallLogo from "@/assets/stores/small.png";

export const storeLogos: Record<string, string> = {
  "MGO": magnumLogo,
  "Magnum": magnumLogo,
  "MagnumGO": magnumLogo,
  "Airba Fresh": airbaFreshLogo,
  "A-Store ADK": astoreLogo,
  // API sends the chain name with parentheses and has no logo for it
  "A-Store (ADK)": astoreLogo,
  "A-Store": astoreLogo,
  "Arbuz": arbuzLogo,
  "Small": smallLogo,
};

export function getStoreLogo(storeName?: string | null): string | null {
  return (storeName && storeLogos[storeName]) || null;
}

export function getStoreInitial(storeName?: string | null): string {
  return storeName ? storeName.charAt(0).toUpperCase() : "?";
}
