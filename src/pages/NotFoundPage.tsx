import { Link } from "react-router-dom";
import { PageIntro } from "../components/PageIntro";
import { SearchField } from "../components/SearchField";
import { useDocumentTitle } from "../lib/useDocumentTitle";

export function NotFoundPage() {
  useDocumentTitle("Not found");
  return (
    <main className="page" id="content">
      <PageIntro
        kicker="404"
        title="This page is not part of the record."
        lede="Search for a suburb, or return to a list."
      />
      <SearchField />
      <p>
        <Link to="/">Home</Link>
        {" · "}
        <Link to="/rankings">Rankings</Link>
        {" · "}
        <Link to="/explore">Map</Link>
      </p>
    </main>
  );
}
