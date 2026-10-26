import { useSyncExternalStore } from "react";
import { Link } from "react-router-dom";
import { PageIntro } from "../components/PageIntro";
import {
  serverShortlist,
  shortlistSnapshot,
  subscribeShortlist,
  writeShortlist,
  type KeptPlace,
} from "../lib/shortlist";
import { suburbPath } from "../lib/places";
import { Head } from "../seo/Head";

export function ShortlistPage() {
  const places = useSyncExternalStore(subscribeShortlist, shortlistSnapshot, serverShortlist);

  function remove(place: KeptPlace) {
    writeShortlist(
      places.filter((item) => !(item.state === place.state && item.slug === place.slug)),
    );
  }

  return (
    <main className="page" id="content">
      <Head
        title="Kept"
        description="Places kept in this browser. They are not an account and they are not synced."
        path="/shortlist"
        robots="noindex"
      />
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
