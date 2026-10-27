import { Link } from "react-router-dom";
import type { SuburbSummary } from "../api/types";
import { formatNumber } from "../lib/format";
import { suburbPath } from "../lib/places";

export function NearbyBlock({ places }: { places: SuburbSummary[] }) {
  if (places.length === 0) {
    return <p className="empty-line">No neighbouring suburbs are listed.</p>;
  }
  return (
    <ul className="link-index">
      {places.map((place) => (
        <li key={`${place.state}-${place.slug}`}>
          <Link to={suburbPath(place.state, place.slug)}>
            <strong>{place.name}</strong>
            <span>
              {place.state.toUpperCase()}
              {place.score == null ? "" : ` · ${formatNumber(place.score)}`}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
