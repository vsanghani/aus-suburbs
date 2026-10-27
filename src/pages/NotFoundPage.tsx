import { Link, useLocation } from "react-router-dom";
import { notFoundCopy } from "../seo/copy";
import { Head } from "../seo/Head";

export function NotFoundPage() {
  const location = useLocation();
  return (
    <main className="page missing" id="content">
      <Head {...notFoundCopy(location.pathname)} status={404} robots="noindex" />
      <p className="kicker">404</p>
      <h1>This page is not part of the record.</h1>
      <p>The address does not match a page in this site.</p>
      <p className="actions">
        <Link className="button-line" to="/">
          Back to the record
        </Link>
        <Link className="button-line" to="/search">
          Search
        </Link>
      </p>
    </main>
  );
}
