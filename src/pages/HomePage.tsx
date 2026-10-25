import { Link } from "react-router-dom";
import { SearchField } from "../components/SearchField";
import { RANKINGS } from "../config/rankings";
import { STATES } from "../config/geography";
import { site } from "../config/site";
import { useDocumentTitle } from "../lib/useDocumentTitle";
import { registry } from "../metrics/registry";

const contents = registry.filter((section) => section.kind !== "score");

export function HomePage() {
  useDocumentTitle();
  return (
    <main className="page home" id="content">
      <p className="kicker">Australia · public datasets</p>
      <h1 className="home-h1">{site.name}</h1>
      <p className="lede">A public record of Australian suburbs.</p>
      <SearchField autoFocus />
      <p>
        Search a suburb. The page lists what public datasets say about housing, schools, transport,
        safety, and hazards. It does not tell you whether to move.
      </p>
      <blockquote className="pull">
        <p>Empty means the figure is not loaded. It does not mean the figure is zero.</p>
      </blockquote>
      <div className="home-split">
        <section>
          <h2>What a suburb page holds</h2>
          <ol className="toc">
            {contents.map((section, index) => (
              <li key={section.id}>
                <span className="idx">{String(index + 1).padStart(2, "0")}</span>
                <strong>{section.title}</strong>
                <span>{section.lede}</span>
              </li>
            ))}
          </ol>
        </section>
        <section>
          <h2>One formula, then your own</h2>
          <p>
            Ranked lists use a single draft composite. The match page keeps the same inputs and lets
            you move the weights. Neither list is advice.
          </p>
          <p>
            <Link to="/methodology">Read the draft formula</Link>
          </p>
          <p>
            <Link to="/explore">Open the map</Link>
          </p>
        </section>
      </div>
      <section>
        <h2>Fixed lists</h2>
        <p>These questions are fixed. The rows stay empty until a dataset is connected.</p>
        <ul className="link-index">
          {RANKINGS.map((ranking) => (
            <li key={ranking.slug}>
              <Link to={`/rankings/${ranking.slug}`}>
                <strong>{ranking.title}</strong>
                <span>{ranking.question}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
      <section>
        <h2>States and territories</h2>
        <ul className="state-index">
          {STATES.map((state) => (
            <li key={state.code}>
              <Link to={`/states/${state.code}`}>{state.name}</Link>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
