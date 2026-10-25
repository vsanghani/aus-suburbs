import type { SourceRef } from "../api/types";

export function SourceNote({ source }: { source: SourceRef | null | undefined }) {
  if (!source) {
    return (
      <footer className="source-note">
        <h3>Source</h3>
        <p>No source is attached to this section yet.</p>
      </footer>
    );
  }
  return (
    <footer className="source-note">
      <h3>Source</h3>
      <dl>
        <dt>Dataset</dt>
        <dd>{source.name}</dd>
        <dt>Agency</dt>
        <dd>{source.agency}</dd>
        <dt>Published</dt>
        <dd>{source.published ?? "Not recorded"}</dd>
        <dt>Licence</dt>
        <dd>{source.licence ?? "Not recorded"}</dd>
        {source.url ? (
          <>
            <dt>Link</dt>
            <dd>
              <a href={source.url}>{source.url}</a>
            </dd>
          </>
        ) : null}
        {source.note ? (
          <>
            <dt>Note</dt>
            <dd>{source.note}</dd>
          </>
        ) : null}
      </dl>
    </footer>
  );
}
