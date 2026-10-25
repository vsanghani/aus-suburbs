import { useState } from "react";
import { Link } from "react-router-dom";
import { PageIntro } from "../components/PageIntro";
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
        <p>Nothing kept on this browser.</p>
      ) : (
        <ul className="link-index">
          {places.map((place) => (
            <li key={`${place.state}-${place.slug}`}>
              <Link to={suburbPath(place.state, place.slug)}>
                <strong>{place.name}</strong>
                <span>{place.state.toUpperCase()}</span>
              </Link>
              <button type="button" className="button-line" onClick={() => remove(place)}>
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
