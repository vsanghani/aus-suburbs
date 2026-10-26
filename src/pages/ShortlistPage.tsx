import { useState } from "react";
import { Link } from "react-router-dom";
import { PageIntro } from "../components/PageIntro";
import { EmptyState } from "../components/States";
import { readShortlist, writeShortlist, type KeptPlace } from "../lib/shortlist";
import { suburbPath } from "../lib/places";
import { useDocumentTitle } from "../lib/useDocumentTitle";

export function ShortlistPage() {
  useDocumentTitle("Kept");
  const [places, setPlaces] = useState<KeptPlace[]>(() => readShortlist());

  function remove(place: KeptPlace) {
    const next = places.filter((item) => !(item.state === place.state && item.slug === place.slug));
    writeShortlist(next);
    setPlaces(next);
  }

  return (
    <main className="page" id="content">
      <PageIntro
        kicker="This browser"
        title="Kept"
        lede="Places you marked on a suburb page. Nothing here is an account, and nothing is synced."
      />
      {places.length === 0 ? (
        <EmptyState
          title="Nothing kept on this browser"
          body="Open a suburb that is on file and choose Keep. The list stays in this browser."
        >
          <p>
            <Link to="/">Search the record</Link>
          </p>
        </EmptyState>
      ) : (
        <ul className="link-index">
          {places.map((place) => (
            <li key={`${place.state}-${place.slug}`} className="with-action">
              <Link to={suburbPath(place.state, place.slug)}>
                <strong>{place.name}</strong>
                <span>{place.state.toUpperCase()}</span>
              </Link>
              <button
                type="button"
                className="button-line"
                aria-label={`Remove ${place.name}`}
                onClick={() => remove(place)}
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
