import { Link } from "react-router-dom";
import { PageIntro } from "../components/PageIntro";
import { RANKINGS } from "../config/rankings";
import { useDocumentTitle } from "../lib/useDocumentTitle";

export function RankingsIndexPage() {
  useDocumentTitle("Rankings");
  return (
    <main className="page" id="content">
      <PageIntro
        kicker="Lists"
        title="Rankings"
        lede="Each list answers one question with the draft formula. Your own weights live on the match page."
      />
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
    </main>
  );
}
