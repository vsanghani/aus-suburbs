import { useSyncExternalStore } from "react";
import {
  bannerOpenSnapshot,
  consentNoticeOpen,
  getConsent,
  serverBannerOpen,
  serverConsent,
  serverNoticeOpen,
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

/** Privacy-signal notice. False while hydrating, so the first paint does not include it. */
export function useConsentNotice(): boolean {
  return useSyncExternalStore(subscribeConsentStore, consentNoticeOpen, serverNoticeOpen);
}
