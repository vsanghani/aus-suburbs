import { Link } from "react-router-dom";
import { useDocumentTitle } from "../lib/useDocumentTitle";

export function NotFoundPage() {
  useDocumentTitle("Not found");
  return (
    <main className="page" id="content">
      <p className="kicker">404</p>
      <h1>This page is not part of the record.</h1>
      <p>
        <Link to="/">Back to search</Link>
      </p>
    </main>
  );
}
