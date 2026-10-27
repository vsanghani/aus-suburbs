import { useSyncExternalStore } from "react";
import {
  bannerOpenSnapshot,
  getConsent,
  serverBannerOpen,
  serverConsent,
  subscribeConsentStore,
  type Consent,
} from "./consent";

/** Consent for render. Matches the server (analytics off) until after hydration. */
export function useConsent(): Consent {
  return useSyncExternalStore(subscribeConsentStore, getConsent, serverConsent);
}

/** Whether the cookie bar should be visible. False while hydrating. */
export function useCookieBannerOpen(): boolean {
  return useSyncExternalStore(subscribeConsentStore, bannerOpenSnapshot, serverBannerOpen);
}
