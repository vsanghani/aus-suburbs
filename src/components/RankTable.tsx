import { Link } from "react-router-dom";
import type { RankingResponse } from "../api/types";
import { formatValue } from "../lib/format";
import { suburbPath } from "../lib/places";
import { DatasetNotice } from "./States";

export function RankTable({ ranking }: { ranking: RankingResponse }) {
  if (!ranking.dataset_connected) {
    return (
      <DatasetNotice
        connected={false}
        notice={ranking.notice}
        emptyTitle="Nothing matched"
        emptyBody="The list ran and returned no places."
      />
    );
  }
  return (
    <div className="table-scroll">
      <table className="data">
        <caption>
          {ranking.total == null
            ? "Count unavailable."
            : `Showing ${ranking.rows.length} of ${ranking.total}.`}
        </caption>
        <thead>
          <tr>
            <th scope="col">#</th>
            <th scope="col">Suburb</th>
            <th scope="col">State</th>
            <th scope="col">{ranking.ranking.value_label}</th>
            <th scope="col">Context</th>
          </tr>
        </thead>
        <tbody>
          {ranking.rows.length === 0 ? (
            <tr>
              <td colSpan={5}>The query matched nothing.</td>
            </tr>
          ) : (
            ranking.rows.map((row) => (
              <tr key={`${row.place.state}-${row.place.slug}`}>
                <td className="num">{row.position}</td>
                <td>
                  <Link to={suburbPath(row.place.state, row.place.slug)}>{row.place.name}</Link>
                </td>
                <td>{row.place.state.toUpperCase()}</td>
                <td className="num">{formatValue(row.value, ranking.ranking.unit)}</td>
                <td>{row.context ?? row.tier ?? "—"}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
