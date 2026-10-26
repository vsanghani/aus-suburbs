import { useEffect } from "react";
import { fetchExport, fetchMethodology } from "../api/client";
import { useApi } from "../api/useApi";
import { PageIntro } from "../components/PageIntro";
import { ErrorState, LoadingState } from "../components/States";
import { formatNumber } from "../lib/format";
import { Head } from "../seo/Head";

export function MethodologyPage() {
  const method = useApi("methodology", fetchMethodology);
  const exported = useApi("export", fetchExport);

  useEffect(() => {
    const id = window.location.hash.replace("#", "");
    if (id !== "sources" && id !== "export") return;
    document.getElementById(id)?.scrollIntoView();
  }, [method.status, exported.status]);

  return (
    <main className="page" id="content">
      <Head
        title="Methodology"
        description="The composite is a draft. Missing inputs are skipped, not treated as zero."
        path="/methodology"
      />
      <PageIntro
        kicker="Method"
        title="Methodology"
        lede="The composite is a draft. The weights are round so the arithmetic can be checked. They are not fitted to a survey."
      />
      {method.status === "loading" ? <LoadingState /> : null}
      {method.status === "error" ? (
        <ErrorState error={method.error} onRetry={method.retry} />
      ) : null}
      {method.status === "ready" ? (
        <>
          <p>{method.data.summary}</p>
          <p>
            Status: {method.data.status}. Score label: {method.data.score_label}. Base{" "}
            {formatNumber(method.data.base)}. Floor {formatNumber(method.data.floor)}. Ceiling{" "}
            {formatNumber(method.data.ceiling)}.
          </p>
          <p>
            An input that is missing is skipped. The highest tier whose minimum is at or below the
            result supplies the word beside the number: Clear, Steady, Mixed, Thin, or Sparse.
          </p>
          <div className="table-scroll">
            <table className="data formula-table">
              <caption>Draft groups</caption>
              <thead>
                <tr>
                  <th scope="col">Group</th>
                  <th scope="col">Direction</th>
                  <th scope="col">Ceiling</th>
                </tr>
              </thead>
              <tbody>
                {method.data.groups.map((group) => (
                  <tr key={group.id}>
                    <th scope="row">
                      {group.label}
                      <small className="cell-note">{group.summary}</small>
                    </th>
                    <td>{group.direction === "positive" ? "Adds" : "Subtracts"}</td>
                    <td className="num">{formatNumber(group.draft_max_points)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="table-scroll">
            <table className="data">
              <caption>Words for the result</caption>
              <thead>
                <tr>
                  <th scope="col">Word</th>
                  <th scope="col">From</th>
                  <th scope="col">Meaning</th>
                </tr>
              </thead>
              <tbody>
                {method.data.tiers.map((tier) => (
                  <tr key={tier.id}>
                    <th scope="row">{tier.label}</th>
                    <td className="num">{formatNumber(tier.minimum)}</td>
                    <td>{tier.meaning}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <h2>Personal weights</h2>
          <p>
            The match page does not invent a second score. It keeps these inputs and changes how
            loudly each one speaks. The mapping the scorer should implement:
          </p>
          <ul>
            {method.data.weights.map((weight) => (
              <li key={weight.id}>
                <strong>{weight.label}.</strong> {weight.help}
              </li>
            ))}
          </ul>
          <h2>Caveats</h2>
          {method.data.caveats.map((caveat) => (
            <p key={caveat}>{caveat}</p>
          ))}
          <section id="sources">
            <h2>Sources</h2>
            {method.data.sources_connected && method.data.sources.length > 0 ? (
              <ul>
                {method.data.sources.map((source) => (
                  <li key={source.id}>
                    {source.name} · {source.agency}
                    {source.licence ? ` · ${source.licence}` : ""}
                    {source.url ? (
                      <>
                        {" "}
                        · <a href={source.url}>{source.url}</a>
                      </>
                    ) : null}
                  </li>
                ))}
              </ul>
            ) : (
              <p>
                No dataset catalogue is connected. Each suburb section still reserves a source line.
              </p>
            )}
            <p>
              When a dataset is attached, the page should name the agency, the publish date, the
              licence, and a link. OpenStreetMap geometries stay under ODbL. Government tables often
              use CC BY.
            </p>
          </section>
        </>
      ) : null}
      <section id="export">
        <h2>Export</h2>
        {exported.status === "loading" ? <LoadingState label="Checking export." /> : null}
        {exported.status === "error" ? (
          <ErrorState error={exported.error} onRetry={exported.retry} />
        ) : null}
        {exported.status === "ready" ? <p>{exported.data.notice}</p> : null}
      </section>
    </main>
  );
}
