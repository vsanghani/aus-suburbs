import { Link } from "react-router-dom";
import { PageIntro } from "../components/PageIntro";
import { RANKINGS } from "../config/rankings";
import { rankingsIndexCopy } from "../seo/copy";
import { Head } from "../seo/Head";

export function RankingsIndexPage() {
  return (
    <main className="page" id="content">
      <Head {...rankingsIndexCopy()} />
      <PageIntro
        kicker="Lists"
        title="Rankings"
        lede="Each list answers one question with the draft formula. Your own weights live on the match page."
      />
      <ol className="ledger">
        {RANKINGS.map((ranking, index) => (
          <li key={ranking.slug}>
            <Link to={`/rankings/${ranking.slug}`}>
              <span className="idx">{String(index + 1).padStart(2, "0")}</span>
              <strong>{ranking.title}</strong>
              <span>{ranking.question}</span>
            </Link>
          </li>
        ))}
      </ol>
    </main>
  );
}
