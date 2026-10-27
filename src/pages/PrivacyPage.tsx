import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { PageIntro } from "../components/PageIntro";
import { privacyCopy } from "../seo/copy";
import { Head } from "../seo/Head";

export function PrivacyPage() {
  const { hash } = useLocation();
  useEffect(() => {
    if (hash !== "#cookies") return;
    document.getElementById("cookies")?.scrollIntoView();
  }, [hash]);

  return (
    <main className="page" id="content">
      <Head {...privacyCopy()} />
      <PageIntro
        kicker="Privacy"
        title="What this site stores"
        lede="There are no accounts. Theme and kept suburbs stay in this browser. A cookie remembers this browser only if you accept."
      />
      <h2 id="cookies">Cookies</h2>
      <p>
        The cookie bar stores your choice in a first-party cookie named “kf_consent”. It holds which
        button you picked, a version number, and the date, and it lasts about a year. Accept all
        lets the site remember this browser. Essential only and Reject all record the choice and do
        not. Cookie settings in the footer opens the bar again.
      </p>
      <p>
        If you choose Accept all, the server can also set an anonymous visitor cookie named
        “kf_vid”. Essential only and Reject all clear it when the server receives the new choice.
      </p>
      <h2>On this browser</h2>
      <p>The colour theme is stored under the key “theme”.</p>
      <p>
        Places you keep are stored under “suburb-record.shortlist.v1”. Clearing site data removes
        them. They are not sent to the record service.
      </p>
      <h2>Requests</h2>
      <p>
        Search text, compare selections, and match weights are sent to the record service so it can
        answer. The service in this repository does not write those requests to a database.
      </p>
      <h2>Maps</h2>
      <p>
        The base map is loaded from OpenFreeMap, which uses OpenStreetMap data. That request leaves
        this site. Place outlines, when they exist, come from the record service.
      </p>
    </main>
  );
}
