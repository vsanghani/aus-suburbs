import { PageIntro } from "../components/PageIntro";
import { privacyCopy } from "../seo/copy";
import { Head } from "../seo/Head";

export function PrivacyPage() {
  return (
    <main className="page" id="content">
      <Head {...privacyCopy()} />
      <PageIntro
        kicker="Privacy"
        title="What this site stores"
        lede="There are no accounts. A few things stay in this browser, and nowhere else."
      />
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
