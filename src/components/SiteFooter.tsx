import { Link } from "react-router-dom";
import { openCookieSettings } from "../lib/consent";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="footer-grid">
        <div>
          <p>
            Aboriginal and Torres Strait Islander peoples are the first peoples of the places in
            this record. Where a source names Traditional Owners for a suburb, the suburb page shows
            that name. This site does not invent one.
          </p>
          <p>
            Figures are general information from public datasets. They are not advice on property,
            safety, or where to live. Check the source named on each section before you rely on a
            number.
          </p>
        </div>
        <div>
          <nav className="footer-links" aria-label="About the record">
            <Link to="/methodology">Methodology</Link>
            <Link to="/methodology#sources">Sources</Link>
            <Link to="/privacy">Privacy</Link>
            <button type="button" id="cookie-settings" onClick={openCookieSettings}>
              Cookie settings
            </button>
            <Link to="/methodology#export">Export</Link>
          </nav>
          <p>
            Map data © OpenStreetMap contributors, ODbL. Tiles by OpenFreeMap. Dataset licences are
            named on each section when a dataset is attached.
          </p>
        </div>
      </div>
    </footer>
  );
}
