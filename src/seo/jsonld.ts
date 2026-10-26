import type { SuburbDetail } from "../api/types";
import { absoluteUrl } from "../config/site";
import { findState } from "../config/geography";

/**
 * Schema.org Place for a suburb that is actually on file.
 * A suburb is a locality, so this is Place rather than Residence (a dwelling).
 * Returns null when there is no payload — a 404 shell must not emit structured data.
 */
export function placeJsonLd(
  place: SuburbDetail | null,
  path: string,
  origin: string,
): Record<string, unknown> | null {
  if (!place) return null;
  const region = findState(place.state)?.name ?? place.state.toUpperCase();
  const address: Record<string, unknown> = {
    "@type": "PostalAddress",
    addressLocality: place.name,
    addressRegion: region,
    addressCountry: "AU",
  };
  if (place.postcode) address.postalCode = place.postcode;
  const data: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Place",
    name: place.name,
    address,
  };
  const url = absoluteUrl(path, origin);
  if (url) data.url = url;
  const description = place.description?.trim() || place.blurb?.trim();
  if (description) data.description = description;
  if (place.latitude != null && place.longitude != null) {
    data.geo = {
      "@type": "GeoCoordinates",
      latitude: place.latitude,
      longitude: place.longitude,
    };
  }
  return data;
}
