import type { SuburbDetail } from "../api/types";
import { absoluteUrl } from "../config/site";
import { findState } from "../config/geography";

/**
 * Schema.org Place for a suburb that is actually on file.
 * A suburb is a locality, so this is Place rather than Residence (a dwelling).
 * Returns null when there is no payload — a 404 shell must not emit structured data.
 */
function finiteCoordinate(value: number | null | undefined, limit: number): number | null {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  if (value < -limit || value > limit) return null;
  return value;
}

export function placeJsonLd(
  place: SuburbDetail | null,
  path: string,
  origin: string,
): Record<string, unknown> | null {
  const name = place?.name?.trim();
  if (!place || !name) return null;
  const region = findState(place.state)?.name ?? place.state.toUpperCase();
  const address: Record<string, unknown> = {
    "@type": "PostalAddress",
    addressLocality: name,
    addressRegion: region,
    addressCountry: "AU",
  };
  const postcode = place.postcode?.trim();
  if (postcode) address.postalCode = postcode;
  const data: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Place",
    name,
    address,
  };
  const url = absoluteUrl(path, origin);
  if (url) data.url = url;
  const description = place.description?.trim() || place.blurb?.trim();
  if (description) data.description = description;
  const latitude = finiteCoordinate(place.latitude, 90);
  const longitude = finiteCoordinate(place.longitude, 180);
  if (latitude != null && longitude != null) {
    data.geo = {
      "@type": "GeoCoordinates",
      latitude,
      longitude,
    };
  }
  return data;
}
